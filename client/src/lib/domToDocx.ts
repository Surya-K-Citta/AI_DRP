// @ts-nocheck
/**
 * Word file from the live on-screen report, built in the browser.
 *
 * It does not guess the look from class names. Every size, colour, border, spacing, alignment and column width is read
 * from the page itself (getComputedStyle and measured boxes), so the Word file follows the layout the person sees and the
 * PDF prints: whichever template is in use, however its CSS changes. Elements are mapped by what they ARE on the page
 * (a table, a bordered box, a row of items, a paragraph of text), not by what they are called.
 *
 *   text                 -> runs with the font, size, weight, colour, caps and letter spacing of that text on the page
 *   block of text        -> paragraph with the page's alignment, spacing, line height, shading and borders
 *   table / display:table-> Word table with the measured column widths, borders, shading and padding of each cell
 *   bordered / filled box -> a one-cell table (so Word draws the same box) with the page's border, fill and padding
 *   row of items (flex)  -> one paragraph with tab stops at the measured positions (numbers and labels line up)
 *   list                 -> paragraphs with bullets or numbers; pictures -> embedded images at their drawn size
 *
 * Needs nothing from the server. Throws when the report has no content to put in the file.
 */
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  ImageRun,
  LineRuleType,
  PageNumber,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TabStopType,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import { AI_DISCLAIMER_TEXT } from '@/lib/aiDisclaimer';

type Block = Paragraph | Table;

const PAGES: Record<string, { width: number; height: number }> = {
  A4: { width: 11906, height: 16838 },
  A3: { width: 16838, height: 23811 },
  Letter: { width: 12240, height: 15840 },
  Legal: { width: 12240, height: 20160 },
};
const MM = 56.6929; // twips in a millimetre
const PX = 15; // twips in a CSS pixel (1 px = 0.75 pt = 15 twips)

// ---- the page's own measurements --------------------------------------------------------------------------------------
type Frame = { innerPx: number; contentTwips: number; leftPx: number };
let frame: Frame = { innerPx: 700, contentTwips: 10092, leftPx: 0 };
let images = new Map<Element, { data: Uint8Array; width: number; height: number }>();

const cs = (el: Element) => getComputedStyle(el);
const num = (v: string) => (Number.parseFloat(v) || 0);
const px2tw = (v: number) => Math.max(0, Math.round(v * PX));
const toHalfPt = (v: number) => Math.max(2, Math.round(v * 1.5));
const isEl = (n: any): n is Element => !!n && n.nodeType === 1;
const isTxt = (n: any) => !!n && n.nodeType === 3;
const tag = (el: Element) => el.tagName.toLowerCase();
const cls = (el: Element) => Array.from(el.classList || []);
const kids = (el: Node): Node[] => Array.from(el.childNodes).filter((n) => n.nodeType === 1 || n.nodeType === 3);
const rect = (el: Element) => el.getBoundingClientRect();
const widthTwips = (px: number) => Math.max(200, Math.round((px / frame.innerPx) * frame.contentTwips));

// ---- colours ------------------------------------------------------------------------------------------------------------
function parseColor(value: string): { hex: string; alpha: number } | null {
  const m = /rgba?\(([^)]+)\)/i.exec(value || '');
  if (!m) return null;
  const p = m[1].split(/[,/ ]+/).filter(Boolean).map(Number);
  if (p.length < 3) return null;
  const alpha = p.length > 3 ? p[3] : 1;
  const hex = p.slice(0, 3).map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')).join('').toUpperCase();
  return { hex, alpha };
}
/** A solid colour, or undefined for transparent. A see-through colour is blended with white (paper). */
function solid(value: string): string | undefined {
  const c = parseColor(value);
  if (!c || c.alpha <= 0.02) return undefined;
  if (c.alpha >= 0.98) return c.hex;
  const mix = (i: number) => Math.round(parseInt(c.hex.slice(i, i + 2), 16) * c.alpha + 255 * (1 - c.alpha)).toString(16).padStart(2, '0');
  return (mix(0) + mix(2) + mix(4)).toUpperCase();
}
/** A background: its colour, or for a gradient the first colour in it (Word has no gradient paragraphs). */
function backgroundOf(style: CSSStyleDeclaration): string | undefined {
  const flat = solid(style.backgroundColor);
  if (flat) return flat;
  const m = /rgba?\([^)]+\)/.exec(style.backgroundImage || '');
  return m ? solid(m[0]) : undefined;
}

// ---- borders ------------------------------------------------------------------------------------------------------------
type Side = 'top' | 'right' | 'bottom' | 'left';
function borderOf(style: CSSStyleDeclaration, side: Side) {
  const width = num(style[`border${side[0].toUpperCase()}${side.slice(1)}Width`]);
  const kind = style[`border${side[0].toUpperCase()}${side.slice(1)}Style`];
  if (!width || !kind || kind === 'none' || kind === 'hidden') return null;
  const color = solid(style[`border${side[0].toUpperCase()}${side.slice(1)}Color`]) || '000000';
  return {
    style: kind === 'dashed' ? BorderStyle.DASHED : kind === 'dotted' ? BorderStyle.DOTTED : kind === 'double' ? BorderStyle.DOUBLE : BorderStyle.SINGLE,
    size: Math.max(2, Math.min(96, Math.round(width * 6))), // eighths of a point
    color,
  };
}
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'auto' };
const sidesOf = (style: CSSStyleDeclaration) => (style && style.borderTopWidth !== undefined ? { top: borderOf(style, 'top'), right: borderOf(style, 'right'), bottom: borderOf(style, 'bottom'), left: borderOf(style, 'left') } : { top: null, right: null, bottom: null, left: null });
/** If every border of every cell is the same line, that line (so the table can carry it as its own grid too). */
function sharedBorder(list: ReturnType<typeof sidesOf>[]) {
  const first = list[0]?.top;
  if (!first) return null;
  const same = (x: any) => x && x.style === first.style && x.size === first.size && x.color === first.color;
  return list.every((b) => same(b.top) && same(b.right) && same(b.bottom) && same(b.left)) ? first : null;
}
const hasBorder = (b: ReturnType<typeof sidesOf>) => !!(b.top || b.right || b.bottom || b.left);

// ---- what is drawn ------------------------------------------------------------------------------------------------------
const SKIP_TAGS = new Set(['script', 'style', 'head', 'button', 'svg', 'noscript', 'input', 'select', 'textarea', 'canvas', 'iframe', 'template', 'link', 'meta', 'video', 'audio', 'object', 'embed']);
const SKIP_CLASSES = ['no-print', 'dpr-open-in-form', 'dpr-slot-handle', 'dpr-watermark', 'sr-only', 'dpr-style-header-spot'];

function skipped(el: Element): boolean {
  if (SKIP_TAGS.has(tag(el))) return true;
  if (el.hasAttribute('hidden')) return true;
  const c = cls(el);
  if (SKIP_CLASSES.some((k) => c.includes(k))) return true;
  const s = cs(el);
  return s.display === 'none' || s.visibility === 'hidden';
}
const displayOf = (el: Element) => cs(el).display;
const isInlineEl = (el: Element) => {
  const d = displayOf(el);
  return tag(el) === 'br' || d === 'inline' || d === 'inline-block' || d === 'inline-flex' || d === 'inline-grid' || d === 'contents';
};
const isTableDisplay = (el: Element) => tag(el) === 'table' || displayOf(el) === 'table' || displayOf(el) === 'inline-table';

// ---- text -> runs -------------------------------------------------------------------------------------------------------
function runBase(el: Element) {
  const s = cs(el);
  const family = (s.fontFamily || '').split(',')[0].replace(/["']/g, '').trim();
  const generic = /^(serif|sans-serif|ui-|system-ui|-apple|monospace)/i.test(family) || !family;
  return {
    font: generic ? (/mono/i.test(family) ? 'Courier New' : /sans/i.test(family) ? 'Arial' : 'Times New Roman') : family,
    size: toHalfPt(num(s.fontSize) || 14),
    bold: Number(s.fontWeight) >= 600 || s.fontWeight === 'bold',
    italics: s.fontStyle === 'italic' || s.fontStyle === 'oblique',
    underline: /underline/.test(s.textDecorationLine || '') ? {} : undefined,
    strike: /line-through/.test(s.textDecorationLine || ''),
    color: solid(s.color),
    allCaps: s.textTransform === 'uppercase',
    characterSpacing: s.letterSpacing && s.letterSpacing !== 'normal' ? Math.round(num(s.letterSpacing) * PX) || undefined : undefined,
    preserve: /pre/.test(s.whiteSpace || ''),
  };
}

type Part = { text?: string; br?: boolean; tab?: boolean; base: ReturnType<typeof runBase>; box?: { border: any; shade?: string } };

/** A bordered or filled inline element (a number badge) becomes boxed text. */
function inlineBox(el: Element) {
  const s = cs(el);
  const b = sidesOf(s);
  const shade = backgroundOf(s);
  if (!hasBorder(b) && !shade) return undefined;
  const edge = b.top || b.left || b.bottom || b.right;
  return { border: edge ? { style: edge.style, size: edge.size, color: edge.color, space: 1 } : undefined, shade };
}

function collectParts(nodes: Node[], out: Part[] = [], box?: Part['box']): Part[] {
  for (const node of nodes) {
    if (isTxt(node)) {
      const parent = node.parentElement;
      if (!parent) continue;
      const base = runBase(parent);
      let text = node.textContent || '';
      if (base.preserve) {
        text.split('\n').forEach((piece, i) => {
          if (i > 0) out.push({ br: true, base });
          if (piece) out.push({ text: piece.replace(/\t/g, '    '), base, box });
        });
        continue;
      }
      text = text.replace(/[ \t\r\n\f]+/g, ' ');
      if (text) out.push({ text, base, box });
    } else if (isEl(node) && !skipped(node)) {
      if (tag(node) === 'br') out.push({ br: true, base: runBase(node) });
      else if (tag(node) === 'img') continue;
      else collectParts(kids(node), out, inlineBox(node) || box);
    }
  }
  return out;
}

function runsFrom(parts: Part[]): TextRun[] {
  const copy = parts.map((p) => ({ ...p }));
  const first = copy.findIndex((p) => p.text !== undefined);
  if (first >= 0) copy[first].text = copy[first].text!.replace(/^ +/, '');
  for (let i = copy.length - 1; i >= 0; i -= 1) {
    if (copy[i].text !== undefined) { copy[i].text = copy[i].text!.replace(/ +$/, ''); break; }
  }
  // a space at the start or end of a line break is not drawn either
  copy.forEach((p, i) => {
    if (p.br && copy[i + 1]?.text !== undefined) copy[i + 1].text = copy[i + 1].text!.replace(/^ +/, '');
    if (p.br && copy[i - 1]?.text !== undefined) copy[i - 1].text = copy[i - 1].text!.replace(/ +$/, '');
  });
  const runs: TextRun[] = [];
  for (const p of copy) {
    if (p.br) { runs.push(new TextRun({ break: 1 })); continue; }
    if (p.tab) { runs.push(new TextRun({ children: ['\t'] })); continue; }
    if (!p.text) continue;
    const b = p.base;
    runs.push(
      new TextRun({
        text: p.box ? ` ${p.text} ` : p.text,
        font: b.font,
        size: b.size,
        bold: b.bold,
        italics: b.italics,
        underline: b.underline,
        strike: b.strike || undefined,
        color: b.color,
        allCaps: b.allCaps || undefined,
        characterSpacing: b.characterSpacing,
        border: p.box?.border,
        shading: p.box?.shade ? { type: ShadingType.CLEAR, fill: p.box.shade, color: 'auto' } : undefined,
      })
    );
  }
  return runs;
}

const plainOf = (parts: Part[]) => parts.map((p) => (p.br ? '\n' : p.text || '')).join('').replace(/\s+/g, ' ').trim();

// ---- paragraphs ---------------------------------------------------------------------------------------------------------
const ALIGN: Record<string, any> = { left: AlignmentType.LEFT, start: AlignmentType.LEFT, right: AlignmentType.RIGHT, end: AlignmentType.RIGHT, center: AlignmentType.CENTER, justify: AlignmentType.JUSTIFIED };
const HEADING = { h1: HeadingLevel.HEADING_1, h2: HeadingLevel.HEADING_2, h3: HeadingLevel.HEADING_3, h4: HeadingLevel.HEADING_4, h5: HeadingLevel.HEADING_5, h6: HeadingLevel.HEADING_6 };

/** Left offset (px) of an element's content box inside the page content, for indents. */
function indentOf(el: Element) {
  const s = cs(el);
  return Math.max(0, num(s.paddingLeft) + num(s.marginLeft));
}

/**
 * Where the block sits inside its parent, from the measured boxes (so auto-centred or narrowed blocks, such as a pill or a
 * tinted strip, keep their place). Text starts inside the block's own border and padding; Word draws a paragraph's border
 * and fill outward from the text by the same amount.
 */
function indentFor(el: Element, extra: { indentPx?: number; plain?: boolean }) {
  if (extra.plain) return undefined;
  if (extra.indentPx !== undefined) return extra.indentPx > 2 ? { left: px2tw(extra.indentPx) } : undefined;
  const parent = el.parentElement;
  if (!parent) return undefined;
  const r = rect(el);
  const pr = rect(parent);
  const ps = cs(parent);
  const s = cs(el);
  const parentLeft = pr.left + num(ps.paddingLeft) + num(ps.borderLeftWidth);
  const parentRight = pr.right - num(ps.paddingRight) - num(ps.borderRightWidth);
  let gapLeft = Math.max(0, r.left - parentLeft);
  let gapRight = Math.max(0, parentRight - r.right);
  // A block sized to its text (a pill, a tag) gets room to spare: Word's text runs a little wider than the browser's.
  if (r.width < (parentRight - parentLeft) * 0.9) {
    const room = Math.min(gapLeft, gapRight, Math.max(10, r.width * 0.08));
    gapLeft -= room;
    gapRight -= room;
  }
  const left = gapLeft + num(s.paddingLeft) + num(s.borderLeftWidth);
  const right = gapRight + num(s.paddingRight) + num(s.borderRightWidth);
  return left > 2 || right > 2 ? { left: px2tw(left), right: px2tw(right) } : undefined;
}

function centredByGeometry(el: Element) {
  const parent = el.parentElement;
  if (!parent) return false;
  const r = rect(el);
  const pr = rect(parent);
  const ps = cs(parent);
  const left = r.left - (pr.left + num(ps.paddingLeft) + num(ps.borderLeftWidth));
  const right = pr.right - num(ps.paddingRight) - num(ps.borderRightWidth) - r.right;
  return left > 4 && Math.abs(left - right) < 6;
}

function paragraphFor(el: Element, parts: Part[], extra: { tabs?: { type: any; position: number }[]; indentPx?: number; tight?: boolean; plain?: boolean } = {}): Paragraph | null {
  const plain = plainOf(parts);
  if (!plain && !parts.some((p) => p.tab)) return null;
  const runs = runsFrom(parts);
  if (!runs.length) return null;
  const s = cs(el);
  // Loose text inside a cell or box (extra.plain) is drawn by that cell or box: the paragraph takes no border, fill or padding.
  const b = extra.plain ? sidesOf({} as any) : sidesOf(s);
  const shade = extra.plain ? undefined : backgroundOf(s);
  let lineHeight = s.lineHeight === 'normal' ? num(s.fontSize) * 1.2 : num(s.lineHeight);
  const fontSize = num(s.fontSize) || 14;
  // A single line that the page draws taller than its text (a row with padding or a minimum height) keeps the drawn height.
  if (!extra.tight) {
    const drawn = rect(el).height - num(s.paddingTop) - num(s.paddingBottom) - num(s.borderTopWidth) - num(s.borderBottomWidth);
    if (drawn > lineHeight && drawn < lineHeight * 1.6) lineHeight = drawn;
  }
  const boxed = hasBorder(b) || shade;
  // A shaded or bordered paragraph carries its padding as space above and below.
  const before = extra.plain ? 0 : px2tw(num(s.marginTop) + (boxed ? num(s.paddingTop) : 0));
  const after = extra.plain ? 0 : px2tw(num(s.marginBottom) + (boxed ? num(s.paddingBottom) : 0));
  const space = (side: Side) => Math.min(31, Math.round(num(s[`padding${side[0].toUpperCase()}${side.slice(1)}`]) * 0.75));
  const hd = HEADING[tag(el)];
  // A single line centred by auto margins (a narrow title block) is centred as text: Word-compatible apps such as Pages do not
  // all honour matching left and right indents, but every one honours centred alignment.
  const centredLine = !extra.plain && extra.indentPx === undefined && !boxed && !hasBorder(b) && centredByGeometry(el) && rect(el).height <= lineHeight * 1.5 + num(s.paddingTop) + num(s.paddingBottom);
  return new Paragraph({
    heading: hd,
    alignment: centredLine ? AlignmentType.CENTER : ALIGN[s.textAlign] || AlignmentType.LEFT,
    // The page's line height is a length (px), but Word's automatic spacing is a multiple of the font's own taller natural line
    // height, which made every line about 15% taller. "At least" the page's line height in points matches the page.
    spacing: { before: extra.tight ? 0 : before, after: extra.tight ? Math.min(after, 60) : after, line: Math.max(200, px2tw(lineHeight)), lineRule: LineRuleType.AT_LEAST },
    indent: centredLine ? undefined : indentFor(el, extra),
    // Keep-with-next only for real headings and the report's own section and question titles. Chaining it through every cover
    // line (each is break-after: avoid on the page) can push the whole cover onto a new page in Word.
    keepNext: (!!hd && tag(el) !== 'h1') || cls(el).some((c) => /sec-title|qa-q/.test(c)),
    shading: shade ? { type: ShadingType.CLEAR, fill: shade, color: 'auto' } : undefined,
    border: hasBorder(b)
      ? {
          top: b.top ? { ...b.top, space: space('top') } : undefined,
          right: b.right ? { ...b.right, space: space('right') } : undefined,
          bottom: b.bottom ? { ...b.bottom, space: space('bottom') } : undefined,
          left: b.left ? { ...b.left, space: space('left') } : undefined,
          // Neighbouring paragraphs with the same border are one group in Word, drawn once around the group; a rule under
          // each row (the contents list) needs a line between the paragraphs of the group as well.
          between: b.bottom && !b.top ? { ...b.bottom, space: space('bottom') } : undefined,
        }
      : undefined,
    tabStops: extra.tabs,
    children: runs,
  });
}

/** An empty line of an exact height: the page's vertical gap between blocks. */
const gap = (px: number): Paragraph | null =>
  px >= 3 ? new Paragraph({ spacing: { before: 0, after: 0, line: Math.max(20, px2tw(px)), lineRule: LineRuleType.EXACT }, children: [] }) : null;

// ---- pictures -----------------------------------------------------------------------------------------------------------
async function loadImages(root: Element) {
  const found = new Map<Element, { data: Uint8Array; width: number; height: number }>();
  for (const img of Array.from(root.querySelectorAll('img')) as HTMLImageElement[]) {
    try {
      if (!img.complete || !img.naturalWidth) continue;
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const context = canvas.getContext('2d');
      if (!context) continue;
      context.drawImage(img, 0, 0);
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (blob) found.set(img, { data: new Uint8Array(await blob.arrayBuffer()), width: img.naturalWidth, height: img.naturalHeight });
    } catch {
      /* a picture that cannot be read is left out */
    }
  }
  return found;
}

function imageBlock(el: Element): Paragraph | null {
  const image = images.get(el);
  if (!image) return null;
  const r = rect(el);
  const drawnW = r.width || image.width;
  const drawnH = r.height || image.height;
  const maxPx = (frame.contentTwips / PX) * 0.98;
  const scale = Math.min(1, maxPx / drawnW);
  const parentAlign = el.parentElement ? ALIGN[cs(el.parentElement).textAlign] : undefined;
  return new Paragraph({
    alignment: parentAlign || AlignmentType.LEFT,
    spacing: { before: 40, after: 80 },
    children: [new ImageRun({ type: 'png', data: image.data, transformation: { width: Math.max(1, Math.round(drawnW * scale)), height: Math.max(1, Math.round(drawnH * scale)) } })],
  });
}

// ---- boxes: one-cell tables ---------------------------------------------------------------------------------------------
function boxOf(el: Element, inner: Block[], widthPx?: number, avoid?: boolean): Block[] {
  const s = cs(el);
  const b = sidesOf(s);
  const shade = backgroundOf(s);
  const width = widthTwips(widthPx ?? rect(el).width);
  const padL = px2tw(num(s.paddingLeft));
  const padR = px2tw(num(s.paddingRight));
  const border = (side: Side) => b[side] || NO_BORDER;
  const content = inner.length ? inner : [new Paragraph({ spacing: { after: 0 }, children: [] })];
  const table = new Table({
    width: { size: width, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [width],
    borders: { top: border('top'), bottom: border('bottom'), left: border('left'), right: border('right'), insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
    rows: [
      new TableRow({
        cantSplit: !!avoid || /avoid/.test(s.breakInside || '') || /avoid/.test(s.pageBreakInside || ''),
        children: [
          new TableCell({
            width: { size: width, type: WidthType.DXA },
            borders: { top: border('top'), right: border('right'), bottom: border('bottom'), left: border('left') },
            shading: shade ? { type: ShadingType.CLEAR, fill: shade, color: 'auto' } : undefined,
            margins: { top: px2tw(num(s.paddingTop)), bottom: px2tw(num(s.paddingBottom)), left: padL, right: padR },
            children: content,
          }),
        ],
      }),
    ],
  });
  const after = gap(num(s.marginBottom));
  const before = gap(num(s.marginTop));
  return [...(before ? [before] : []), table, after || new Paragraph({ spacing: { before: 0, after: 0, line: 40, lineRule: LineRuleType.EXACT }, children: [] })];
}

// ---- tables -------------------------------------------------------------------------------------------------------------
/** A table cell: a real cell element, or the loose text beside cell elements, which the page draws as a cell of its own. */
type Cell = { el: Element; nodes: Node[]; anon?: boolean };
function cellsOf(row: Element): Cell[] {
  const cells: Cell[] = [];
  let loose: Node[] = [];
  const flushLoose = () => {
    if (loose.some((n) => (n.textContent || '').trim())) cells.push({ el: row, nodes: loose, anon: true });
    loose = [];
  };
  for (const n of kids(row)) {
    if (isEl(n) && skipped(n)) continue;
    if (isEl(n) && (['td', 'th'].includes(tag(n)) || displayOf(n) === 'table-cell')) {
      flushLoose();
      cells.push({ el: n, nodes: kids(n) });
    } else loose.push(n);
  }
  flushLoose();
  return cells;
}
function rowsOf(table: Element): { el: Element; head: boolean }[] {
  const rows: { el: Element; head: boolean }[] = [];
  const visit = (node: Element, head: boolean) => {
    for (const child of kids(node)) {
      if (!isEl(child) || skipped(child)) continue;
      const d = displayOf(child);
      if (tag(child) === 'tr' || d === 'table-row') rows.push({ el: child, head });
      else if (tag(child) === 'thead' || d === 'table-header-group') visit(child, true);
      else if (tag(child) === 'tbody' || tag(child) === 'tfoot' || d === 'table-row-group' || d === 'table-footer-group') visit(child, false);
    }
  };
  visit(table, false);
  return rows;
}

/** Measured width of a cell; loose text's width is measured around the text itself. */
function cellWidthPx(c: Cell): number {
  if (!c.anon) return rect(c.el).width;
  const range = document.createRange();
  const first = c.nodes[0];
  const last = c.nodes[c.nodes.length - 1];
  range.setStartBefore(first);
  range.setEndAfter(last);
  return Math.max(rect(c.el).width - sumOtherCells(c), range.getBoundingClientRect().width);
}
function sumOtherCells(c: Cell): number {
  return cellsOf(c.el).filter((o) => !o.anon).reduce((n, o) => n + rect(o.el).width, 0);
}

/** A table's caption, which the page draws as a titled strip at the top of the table, as the table's first row. */
function captionRowFor(caption: Element, width: number, columns: number): TableRow | null {
  const s = cs(caption);
  const b = sidesOf(s);
  const shade = backgroundOf(s);
  const inner = walkChildren(kids(caption), { tight: true });
  if (!inner.length) return null;
  return new TableRow({
    cantSplit: true,
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: width, type: WidthType.DXA },
        columnSpan: columns,
        borders: { top: b.top || NO_BORDER, right: b.right || NO_BORDER, bottom: b.bottom || NO_BORDER, left: b.left || NO_BORDER },
        shading: shade ? { type: ShadingType.CLEAR, fill: shade, color: 'auto' } : undefined,
        margins: { top: px2tw(num(s.paddingTop)), bottom: px2tw(num(s.paddingBottom)), left: px2tw(num(s.paddingLeft)), right: px2tw(num(s.paddingRight)) },
        children: inner,
      }),
    ],
  });
}

function convertTable(table: Element): Block[] {
  const rows = rowsOf(table);
  if (!rows.length) return [];
  const tr = rect(table);
  const ts = cs(table);
  const colspan = (c: Element) => (c.getAttribute?.('colspan') ? Math.max(1, Number.parseInt(c.getAttribute('colspan') || '1', 10) || 1) : 1);
  const columns = Math.max(1, ...rows.map((r) => cellsOf(r.el).reduce((n, c) => n + colspan(c.el), 0)));

  // Column widths: measured on the row that has a cell for every column, otherwise shared equally.
  let widthsPx: number[] = [];
  const full = rows.find((r) => cellsOf(r.el).length === columns && cellsOf(r.el).every((c) => colspan(c.el) === 1));
  if (full) widthsPx = cellsOf(full.el).map((c) => cellWidthPx(c));
  else widthsPx = Array.from({ length: columns }, () => tr.width / columns);
  const sum = widthsPx.reduce((a, b) => a + b, 0) || 1;
  const tableTwips = Math.min(frame.contentTwips, widthTwips(tr.width));
  // A table that is not the full width of the page (the cover details) is sized to its text on screen. Word's text runs a
  // little wider than the browser's and the cells have padding, so it gets room to spare and is allowed to widen to fit.
  const fullWidth = tr.width >= frame.innerPx * 0.9;
  const slack = fullWidth ? 1 : 1.2;
  const extra = fullWidth ? 0 : 420 * columns;
  const tableTwips2 = Math.min(frame.contentTwips, Math.round(tableTwips * slack) + extra);
  const widths = widthsPx.map((w) => Math.max(240, Math.round((w / sum) * tableTwips2)));
  const drift = tableTwips2 - widths.reduce((a, b) => a + b, 0);
  widths[widths.length - 1] += drift;

  const centered = tr.width < frame.innerPx - 12 && Math.abs(tr.left - frame.leftPx - (frame.leftPx + frame.innerPx - tr.right)) < 6 && tr.left - frame.leftPx > 8;
  const out: Block[] = [];
  const lead = gap(num(ts.marginTop));
  if (lead) out.push(lead);

  const caption = kids(table).find((c) => isEl(c) && tag(c) === 'caption') as Element | undefined;
  const captionRow = caption && !skipped(caption) ? captionRowFor(caption, tableTwips2, columns) : null;

  const allBorders: ReturnType<typeof sidesOf>[] = [];
  const tableRows = rows.map((row) => {
    const cells = cellsOf(row.el);
    let col = 0;
    return new TableRow({
      cantSplit: true,
      tableHeader: row.head,
      children: cells.map((cell) => {
        const span = Math.min(colspan(cell.el), columns - col) || 1;
        const w = widths.slice(col, col + span).reduce((a, b) => a + b, 0);
        col += span;
        // Loose text takes the look of its row; a cell element has its own.
        const s = cell.anon ? cs(row.el) : cs(cell.el);
        const b = cell.anon ? sidesOf(null as any) : sidesOf(s);
        allBorders.push(b);
        const shade = (cell.anon ? undefined : backgroundOf(s)) || backgroundOf(cs(row.el));
        const inner = walkChildren(cell.nodes, { tight: true });
        return new TableCell({
          width: { size: w, type: WidthType.DXA },
          columnSpan: span > 1 ? span : undefined,
          borders: { top: b.top || NO_BORDER, right: b.right || NO_BORDER, bottom: b.bottom || NO_BORDER, left: b.left || NO_BORDER },
          shading: shade ? { type: ShadingType.CLEAR, fill: shade, color: 'auto' } : undefined,
          verticalAlign: s.verticalAlign === 'middle' ? VerticalAlign.CENTER : s.verticalAlign === 'bottom' ? VerticalAlign.BOTTOM : VerticalAlign.TOP,
          margins: cell.anon ? { top: 20, bottom: 20, left: 80, right: 40 } : { top: px2tw(num(s.paddingTop)), bottom: px2tw(num(s.paddingBottom)), left: px2tw(num(s.paddingLeft)), right: px2tw(num(s.paddingRight)) },
          children: inner.length ? inner : [new Paragraph({ spacing: { after: 0 }, children: [] })],
        });
      }),
    });
  });

  out.push(
    new Table({
      width: { size: tableTwips2, type: WidthType.DXA },
      layout: fullWidth ? TableLayoutType.FIXED : TableLayoutType.AUTOFIT,
      alignment: centered ? AlignmentType.CENTER : undefined,
      columnWidths: widths,
      borders: (() => {
        const line = sharedBorder(allBorders);
        return line
          ? { top: line, bottom: line, left: line, right: line, insideHorizontal: line, insideVertical: line }
          : { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER };
      })(),
      rows: captionRow ? [captionRow, ...tableRows] : tableRows,
    })
  );
  out.push(gap(Math.max(num(ts.marginBottom), 4)) || new Paragraph({ spacing: { after: 0 }, children: [] }));
  return out;
}

// ---- rows of items (flex): label / value pairs, list items with a number ---------------------------------------------------
function isRowOfItems(el: Element): boolean {
  const s = cs(el);
  if (!/flex|grid/.test(s.display) || /column/.test(s.flexDirection || '')) return false;
  const items = kids(el).filter((n) => !(isEl(n) && skipped(n)) && !(isTxt(n) && !(n.textContent || '').trim()));
  if (!items.length) return false;
  // every item is text or an inline-looking element with no block children of its own
  return items.every((n) => isTxt(n) || (isEl(n) && !kids(n).some((c) => isEl(c) && !isInlineEl(c) && !skipped(c))));
}

/** Box of a node's text: the box around the text itself, not an element stretched by flex to fill the row. */
function rectOfNode(node: Node): DOMRect {
  const range = document.createRange();
  range.selectNodeContents(node);
  const r = range.getBoundingClientRect();
  return r.width || r.height ? r : isEl(node) ? rect(node) : r;
}

function rowParagraph(el: Element): Paragraph | null {
  const items = kids(el).filter((n) => (isEl(n) ? !skipped(n) : (n.textContent || '').trim().length > 0));
  const base = rect(el);
  const s = cs(el);
  const contentLeft = base.left + num(s.paddingLeft) + num(s.borderLeftWidth);
  const contentRight = base.right - num(s.paddingRight) - num(s.borderRightWidth);
  const parts: Part[] = [];
  const tabs: { type: any; position: number }[] = [];
  items.forEach((item, i) => {
    const r = rectOfNode(item);
    if (i > 0) {
      const previous = rectOfNode(items[i - 1]);
      const rightAligned = Math.abs(contentRight - r.right) < 4 && r.left - previous.right > 12;
      if (rightAligned) tabs.push({ type: TabStopType.RIGHT, position: px2tw(contentRight - contentLeft) });
      else tabs.push({ type: TabStopType.LEFT, position: px2tw(Math.max(0, r.left - contentLeft)) });
      parts.push({ tab: true, base: runBase(isEl(item) ? item : (item.parentElement as Element)) });
    }
    collectParts([item], parts);
  });
  return paragraphFor(el, parts, { tabs, indentPx: num(s.paddingLeft) });
}

// ---- the walk -------------------------------------------------------------------------------------------------------------
type Ctx = { tight?: boolean; avoid?: boolean };

function listBlocks(list: Element): Block[] {
  const out: Block[] = [];
  const ordered = tag(list) === 'ol';
  const ls = cs(list);
  const frame2 = ls.listStyleType === 'none';
  let n = Number.parseInt(list.getAttribute('start') || '1', 10) || 1;
  const items = kids(list).filter((c): c is Element => isEl(c) && !skipped(c) && (tag(c) === 'li' || displayOf(c) === 'list-item'));
  for (const li of items) {
    const rowLike = isRowOfItems(li);
    if (rowLike) {
      const p = rowParagraph(li);
      if (p) out.push(p);
    } else {
      const marker = frame2 ? '' : ordered ? `${n}. ` : '• ';
      const parts = collectParts(kids(li));
      if (marker) parts.unshift({ text: marker, base: runBase(li) });
      const p = paragraphFor(li, parts, { indentPx: Math.max(indentOf(li), 18) });
      if (p) out.push(p);
    }
    n += 1;
  }
  return out;
}

/** Paragraph(s) for a block whose content is only text and inline elements (or a row of items). */
function textBlock(el: Element): Block[] {
  if (isRowOfItems(el)) {
    const p = rowParagraph(el);
    return p ? [p] : [];
  }
  const p = paragraphFor(el, collectParts(kids(el)));
  return p ? [p] : [];
}

const hasBlockChild = (el: Element) => kids(el).some((c) => isEl(c) && !skipped(c) && !isInlineEl(c));

function walkElement(el: Element, ctx: Ctx): Block[] {
  if (skipped(el)) return [];
  const t = tag(el);
  if (t === 'img') return [imageBlock(el)].filter(Boolean) as Block[];
  if (isTableDisplay(el)) return convertTable(el);
  const keepTogether = !!ctx.avoid || ((/avoid/.test(cs(el).breakInside || '') || /avoid/.test(cs(el).pageBreakInside || '')) && rect(el).height < 880);
  if (t === 'ul' || t === 'ol') {
    const items = listBlocks(el);
    const b = sidesOf(cs(el));
    return hasBorder(b) ? boxOf(el, items, undefined, keepTogether) : items;
  }

  const s = cs(el);
  const b = sidesOf(s);
  const shade = backgroundOf(s);
  const breakBefore = /page|always/.test(s.breakBefore || '') || /always/.test(s.pageBreakBefore || '');
  const breakAfter = /page|always/.test(s.breakAfter || '') || /always/.test(s.pageBreakAfter || '');
  const lead = breakBefore ? [new Paragraph({ pageBreakBefore: true, spacing: { after: 0, line: 20, lineRule: LineRuleType.EXACT }, children: [] })] : [];
  const trail = breakAfter ? [new Paragraph({ pageBreakBefore: true, spacing: { after: 0, line: 20, lineRule: LineRuleType.EXACT }, children: [] })] : [];

  // Text-only blocks (and rows of items) are paragraphs.
  if (!hasBlockChild(el) || isRowOfItems(el)) {
    const own = textBlock(el);
    return [...lead, ...own, ...trail];
  }

  // A container: its children in order. If it is drawn as a box (borders on several sides, or a border with a fill),
  // Word gets a one-cell table with the same border, fill and padding.
  const sides = [b.top, b.right, b.bottom, b.left].filter(Boolean).length;
  const asBox = sides >= 3 || (sides >= 1 && !!shade) ;
  const inner = walkChildren(kids(el), { ...ctx, avoid: keepTogether });
  if (asBox) return [...lead, ...boxOf(el, inner, undefined, keepTogether), ...trail];

  // A rule above or below the container (a border on one side only) is a paragraph that carries the line.
  const out: Block[] = [...lead];
  const top = gap(num(s.marginTop) + num(s.paddingTop));
  if (b.top) out.push(new Paragraph({ spacing: { before: 0, after: 0, line: 20, lineRule: LineRuleType.EXACT }, border: { top: { ...b.top, space: 1 } }, children: [] }));
  else if (top) out.push(top);
  out.push(...inner);
  if (b.bottom) out.push(new Paragraph({ spacing: { before: px2tw(num(s.paddingBottom)), after: px2tw(num(s.marginBottom)), line: 20, lineRule: LineRuleType.EXACT }, border: { bottom: { ...b.bottom, space: 1 } }, children: [] }));
  else {
    const bottom = gap(num(s.marginBottom) + num(s.paddingBottom));
    if (bottom) out.push(bottom);
  }
  return [...out, ...trail];
}

function walkChildren(nodes: Node[], ctx: Ctx = {}): Block[] {
  const out: Block[] = [];
  let pending: Node[] = [];
  const flush = (host?: Element) => {
    if (!pending.length) return;
    const parent = (pending.find((n) => n.parentElement)?.parentElement as Element) || host;
    const parts = collectParts(pending);
    pending = [];
    if (parent) {
      const p = paragraphFor(parent, parts, { tight: ctx.tight, indentPx: 0, plain: true });
      if (p) out.push(p);
    }
  };
  for (const node of nodes) {
    if (isTxt(node)) { pending.push(node); continue; }
    if (!isEl(node) || skipped(node)) continue;
    if (isInlineEl(node) && tag(node) !== 'img') { pending.push(node); continue; }
    flush();
    out.push(...walkElement(node, ctx));
  }
  flush();
  return out;
}

// ---- page + file --------------------------------------------------------------------------------------------------------
function footers() {
  return {
    default: new Footer({
      children: [
        new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 6, color: '7A8494', space: 4 } },
          spacing: { before: 0, after: 0 },
          children: [new TextRun({ text: AI_DISCLAIMER_TEXT, size: 14, color: '4A5568', font: 'Arial' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 40, after: 0 },
          children: [new TextRun({ children: ['Page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES], size: 16, color: '4A5568', font: 'Arial' })],
        }),
      ],
    }),
  };
}

export async function domToDocxBlob(root: Element): Promise<Blob> {
  const rs = cs(root);
  const styled = root.getAttribute('data-dpr-styled') === '1';
  const size = PAGES[root.getAttribute('data-page-size') || 'A4'] || PAGES.A4;
  const rr = rect(root);
  const padL = num(rs.paddingLeft);
  const padR = num(rs.paddingRight);
  // A styled report carries its side margins as padding on the report; a plain one uses the PDF's 16 mm all round.
  const marginSide = styled ? px2tw(padL) : Math.round(16 * MM);
  const marginTop = styled ? Math.round(num(root.getAttribute('data-page-edge-top') || '12') * MM) : Math.round(16 * MM);
  const marginBottom = styled ? Math.round(num(root.getAttribute('data-page-edge-bottom') || '12') * MM) : Math.round(16 * MM);
  frame = {
    innerPx: Math.max(100, rr.width - (styled ? padL + padR : 0)),
    contentTwips: size.width - 2 * marginSide,
    leftPx: rr.left + (styled ? padL : 0),
  };
  images = await loadImages(root);
  // The PDF is printed with every table in fixed layout at the full width (equal columns unless set). Measure the same way,
  // by applying that rule for the moment of measuring (nothing is drawn in between), so the column widths match the PDF's.
  const printRule = document.createElement('style');
  printRule.textContent = '.dpr-document table, .pdf-capture-root table { table-layout: fixed !important; width: 100% !important; max-width: 100% !important; min-width: 0 !important; } .dpr-document th, .dpr-document td { overflow-wrap: anywhere; word-break: break-word; min-width: 0 !important; }';
  document.head.appendChild(printRule);
  let blocks: Block[];
  try {
    blocks = walkChildren(kids(root), {});
  } finally {
    printRule.remove();
  }
  images = new Map();
  if (!blocks.length) throw new Error('The report has no content to export');
  const rootFont = runBase(root);
  const word = new Document({
    creator: 'AP MSME Development Corporation',
    styles: { default: { document: { run: { font: rootFont.font, size: rootFont.size } } } },
    sections: [
      {
        properties: { page: { size, margin: { top: marginTop, bottom: marginBottom, left: marginSide, right: marginSide } } },
        footers: footers(),
        children: blocks,
      },
    ],
  });
  return Packer.toBlob(word);
}
