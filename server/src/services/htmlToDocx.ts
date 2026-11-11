// @ts-nocheck
/**
 * Word file from the on-screen report.
 *
 * The PDF is printed from the live report's HTML, so the Word file is built from that same HTML. Content, labels, the
 * fields shown, section order and the sections a person hid can then never differ between the two. The HTML is only
 * parsed (never run); scripts, styles and form controls are dropped.
 *
 * Mapping (class names come from IndividualDPRDocumentView): cover block, table of contents, numbered section headings,
 * "Particular | Details" tables, question-and-answer blocks, upload lists, real tables, and pictures that are embedded as
 * data URLs. A4, 14 mm margins, Times New Roman, and a footer with the AI notice and "Page X of Y", as in the PDF.
 */
import { parseDocument } from 'htmlparser2';
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { aiDisclaimerDocxFooters } from '../lib/aiDisclaimer';

type Block = Paragraph | Table;
type RunStyle = { bold?: boolean; italics?: boolean; underline?: boolean; color?: string; size?: number; caps?: boolean };

const PAGE = { width: 11906, height: 16838 };
const MARGIN = 794; // 14 mm
const CONTENT_WIDTH = PAGE.width - 2 * MARGIN;
const TEAL = '0F766E';
const TEAL_LIGHT = 'ECFDF5';
const GREY = '9CA3AF';
const line = { style: BorderStyle.SINGLE, size: 4, color: TEAL };
const cellBorders = { top: line, bottom: line, left: line, right: line };

const SKIP_TAGS = new Set(['script', 'style', 'head', 'button', 'svg', 'noscript', 'input', 'select', 'textarea', 'canvas', 'iframe', 'template', 'link', 'meta']);
const SKIP_CLASSES = ['no-print', 'dpr-open-in-form', 'dpr-slot-handle', 'dpr-watermark', 'sr-only'];
const INLINE_TAGS = new Set(['span', 'a', 'b', 'strong', 'i', 'em', 'u', 'small', 'sup', 'sub', 'mark', 'code', 'abbr', 'label', 'time', 'br']);
const HEADINGS: Record<string, { level: any; size: number }> = {
  h1: { level: HeadingLevel.HEADING_1, size: 40 },
  h2: { level: HeadingLevel.HEADING_2, size: 26 },
  h3: { level: HeadingLevel.HEADING_3, size: 22 },
  h4: { level: HeadingLevel.HEADING_4, size: 21 },
  h5: { level: HeadingLevel.HEADING_5, size: 21 },
  h6: { level: HeadingLevel.HEADING_6, size: 21 },
};

const classesOf = (el: any): string[] => String(el?.attribs?.class || '').split(/\s+/).filter(Boolean);
const hasClass = (el: any, name: string) => classesOf(el).includes(name);
const isElement = (node: any) => node && (node.type === 'tag' || node.type === 'script' || node.type === 'style');
const isText = (node: any) => node && node.type === 'text';
const tagOf = (el: any) => String(el?.name || '').toLowerCase();

function skipped(el: any): boolean {
  if (!isElement(el)) return false;
  if (SKIP_TAGS.has(tagOf(el))) return true;
  if (el.attribs?.hidden !== undefined) return true;
  const cls = classesOf(el);
  return SKIP_CLASSES.some((c) => cls.includes(c));
}

/** Plain text of a node, with line breaks kept and the parts that are not content left out. */
function textOf(node: any): string {
  if (isText(node)) return String(node.data || '').replace(/\s+/g, ' ');
  if (!isElement(node) || skipped(node)) return '';
  if (tagOf(node) === 'br') return '\n';
  return (node.children || []).map(textOf).join('');
}
const cleanText = (text: string) => text.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).join('\n').replace(/^\n+|\n+$/g, '');

type RunPart = { text?: string; br?: boolean; style: RunStyle };

function collectParts(nodes: any[], style: RunStyle = {}, out: RunPart[] = []): RunPart[] {
  for (const node of nodes || []) {
    if (isText(node)) {
      const text = String(node.data || '').replace(/\s+/g, ' ');
      if (text) out.push({ text, style });
    } else if (isElement(node) && !skipped(node)) {
      const tag = tagOf(node);
      if (tag === 'br') out.push({ br: true, style });
      else if (tag === 'img') continue;
      else {
        const next = { ...style };
        if (tag === 'b' || tag === 'strong') next.bold = true;
        if (tag === 'i' || tag === 'em') next.italics = true;
        if (tag === 'u') next.underline = true;
        collectParts(node.children, next, out);
      }
    }
  }
  return out;
}

/** Runs for a list of nodes, with the HTML whitespace at either end (and around line breaks) trimmed away. */
function runsOf(nodes: any[], style: RunStyle = {}): TextRun[] {
  const parts = collectParts(nodes, style);
  const firstText = parts.findIndex((p) => p.text !== undefined);
  if (firstText >= 0) parts[firstText] = { ...parts[firstText], text: parts[firstText].text!.replace(/^\s+/, '') };
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    if (parts[i].text !== undefined) { parts[i] = { ...parts[i], text: parts[i].text!.replace(/\s+$/, '') }; break; }
  }
  return parts
    .filter((p) => p.br || (p.text !== undefined && p.text !== ''))
    .map((p) => (p.br ? new TextRun({ break: 1 }) : new TextRun({ text: p.text, bold: p.style.bold, italics: p.style.italics, underline: p.style.underline ? {} : undefined, color: p.style.color, size: p.style.size, allCaps: p.style.caps })));
}

const isEmptyRuns = (runs: TextRun[]) => !runs.length;

function paragraph(nodes: any[], opts: { style?: RunStyle; align?: any; spacing?: any; shading?: string; border?: any; keepNext?: boolean; heading?: any; indent?: any } = {}): Paragraph | null {
  const runs = runsOf(nodes, opts.style || {});
  const plain = cleanText((nodes || []).map(textOf).join(''));
  if (isEmptyRuns(runs) || !plain) return null;
  return new Paragraph({
    heading: opts.heading,
    alignment: opts.align,
    spacing: opts.spacing ?? { after: 80 },
    keepNext: opts.keepNext,
    indent: opts.indent,
    shading: opts.shading ? { type: ShadingType.CLEAR, fill: opts.shading, color: 'auto' } : undefined,
    border: opts.border,
    children: runs,
  });
}

// ---- pictures ---------------------------------------------------------------------------------------------------------
function imageSize(buf: Buffer): { type: 'png' | 'jpg'; width: number; height: number } | null {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) return { type: 'png', width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i += 1; continue; }
      const marker = buf[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { type: 'jpg', height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return null;
}

function imageBlock(el: any, align: any): Paragraph | null {
  const src = String(el.attribs?.src || '');
  const match = /^data:image\/(png|jpe?g);base64,([A-Za-z0-9+/=]+)$/i.exec(src);
  if (!match) return null;
  try {
    const data = Buffer.from(match[2], 'base64');
    const size = imageSize(data);
    if (!size || !size.width || !size.height) return null;
    const maxWidth = 460; // px, about the text width of an A4 page
    const scale = Math.min(1, maxWidth / size.width, 600 / size.height);
    return new Paragraph({
      alignment: align,
      spacing: { before: 60, after: 100 },
      children: [new ImageRun({ type: size.type, data, transformation: { width: Math.max(1, Math.round(size.width * scale)), height: Math.max(1, Math.round(size.height * scale)) } })],
    });
  } catch {
    return null;
  }
}

// ---- tables -----------------------------------------------------------------------------------------------------------
function cellParagraphs(cell: any, style: RunStyle): Block[] {
  const blocks = walkChildren(cell.children || [], { style, align: undefined, tight: true });
  return blocks.length ? blocks : [new Paragraph({ spacing: { after: 0 }, children: [] })];
}

function convertTable(table: any): Block[] {
  const rows: any[] = [];
  const collect = (node: any, inHead: boolean) => {
    for (const child of node.children || []) {
      if (!isElement(child) || skipped(child)) continue;
      const tag = tagOf(child);
      if (tag === 'tr') rows.push({ el: child, head: inHead });
      else if (tag === 'thead') collect(child, true);
      else if (tag === 'tbody' || tag === 'tfoot') collect(child, false);
    }
  };
  collect(table, false);
  if (!rows.length) return [];

  const cellsOf = (row: any) => (row.el.children || []).filter((c: any) => isElement(c) && !skipped(c) && ['td', 'th'].includes(tagOf(c)));
  const spanOf = (cell: any) => Math.max(1, parseInt(cell.attribs?.colspan || '1', 10) || 1);
  const columns = Math.max(1, ...rows.map((row) => cellsOf(row).reduce((n: number, c: any) => n + spanOf(c), 0)));
  const particulars = hasClass(table, 'individual-particulars') || (columns === 2 && rows.some((r) => hasClass(cellsOf(r)[0] || {}, 'part')));
  const widths = particulars && columns === 2 ? [Math.round(CONTENT_WIDTH * 0.46), CONTENT_WIDTH - Math.round(CONTENT_WIDTH * 0.46)] : Array.from({ length: columns }, () => Math.floor(CONTENT_WIDTH / columns));
  const size = columns > 10 ? 13 : columns > 8 ? 14 : columns > 5 ? 16 : columns > 2 ? 18 : 20;

  const out: Block[] = [];
  const caption = (table.children || []).find((c: any) => isElement(c) && tagOf(c) === 'caption');
  const captionText = caption ? cleanText(textOf(caption)) : '';
  if (captionText) {
    out.push(new Paragraph({ keepNext: true, spacing: { before: 80, after: 40 }, shading: { type: ShadingType.CLEAR, fill: TEAL_LIGHT, color: 'auto' }, children: [new TextRun({ text: captionText, bold: true, size: 20 })] }));
  }

  const tableRows = rows.map((row) => {
    const cells = cellsOf(row);
    let col = 0;
    return new TableRow({
      cantSplit: true,
      tableHeader: row.head,
      children: cells.map((cell: any) => {
        const span = Math.min(spanOf(cell), columns - col) || 1;
        const width = widths.slice(col, col + span).reduce((a, b) => a + b, 0);
        col += span;
        const header = tagOf(cell) === 'th' || row.head;
        const bold = header || hasClass(cell, 'part');
        return new TableCell({
          width: { size: width, type: WidthType.DXA },
          columnSpan: span > 1 ? span : undefined,
          borders: cellBorders,
          shading: header ? { type: ShadingType.CLEAR, fill: particulars ? TEAL_LIGHT : 'F3F4F6', color: 'auto' } : undefined,
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: cellParagraphs(cell, { size, bold }).map((b) => b),
        });
      }),
    });
  });
  out.push(new Table({ width: { size: CONTENT_WIDTH, type: WidthType.DXA }, layout: TableLayoutType.FIXED, columnWidths: widths, rows: tableRows }));
  out.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
  return out;
}

/** "label ... status" lists (the upload list) as a two-column table. */
function convertPairList(list: any): Block[] {
  const items = (list.children || []).filter((c: any) => isElement(c) && tagOf(c) === 'li' && !skipped(c));
  const rows = items.map((li: any) => {
    const spans = (li.children || []).filter((c: any) => isElement(c) && !skipped(c));
    const label = cleanText(textOf(spans[0] || li));
    const status = spans.length > 1 ? cleanText(spans.slice(1).map(textOf).join(' ')) : '';
    return { label, status, done: hasClass(li, 'is-uploaded') };
  });
  const first = Math.round(CONTENT_WIDTH * 0.7);
  const cell = (text: string, width: number, bold = false, color?: string) =>
    new TableCell({ width: { size: width, type: WidthType.DXA }, borders: cellBorders, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: text || ' ', size: 20, bold, color })] })] });
  return [
    new Table({
      width: { size: CONTENT_WIDTH, type: WidthType.DXA },
      layout: TableLayoutType.FIXED,
      columnWidths: [first, CONTENT_WIDTH - first],
      rows: rows.map((r) => new TableRow({ cantSplit: true, children: [cell(r.label, first), cell(r.status, CONTENT_WIDTH - first, r.done, r.done ? '047857' : '6B7280')] })),
    }),
    new Paragraph({ spacing: { after: 80 }, children: [] }),
  ];
}

// ---- blocks -----------------------------------------------------------------------------------------------------------
type Ctx = { style: RunStyle; align?: any; tight?: boolean };

function sectionHeading(el: any, title?: string): Paragraph | null {
  const numEl = (el.children || []).find((c: any) => isElement(c) && hasClass(c, 'individual-sec-num'));
  const num = numEl ? cleanText(textOf(numEl)) : '';
  const text = title ?? cleanText((el.children || []).filter((c: any) => c !== numEl).map(textOf).join(''));
  if (!text) return null;
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    keepNext: true,
    spacing: { before: 240, after: 140 },
    shading: { type: ShadingType.CLEAR, fill: 'F0FDFA', color: 'auto' },
    border: { left: { style: BorderStyle.SINGLE, size: 28, color: TEAL, space: 6 } },
    children: [...(num ? [new TextRun({ text: `${num}   `, bold: true, size: 26, color: TEAL })] : []), new TextRun({ text, bold: true, size: 26, color: '0B2F2C' })],
  });
}

function coverBlocks(header: any): Block[] {
  const out: Block[] = [];
  const centre = AlignmentType.CENTER;
  const push = (p: Paragraph | null) => p && out.push(p);
  const visit = (node: any) => {
    for (const child of node.children || []) {
      if (!isElement(child) || skipped(child)) continue;
      const cls = classesOf(child).join(' ');
      const text = cleanText(textOf(child));
      if (!text && tagOf(child) !== 'div') continue;
      if (/cover-kicker/.test(cls)) push(new Paragraph({ alignment: centre, spacing: { before: 120, after: 160 }, children: [new TextRun({ text, bold: true, size: 38 })] }));
      else if (/cover-on|cover-action/.test(cls)) push(new Paragraph({ alignment: centre, spacing: { after: 60 }, children: [new TextRun({ text, bold: true, size: 26 })] }));
      else if (/cover-unit/.test(cls)) push(new Paragraph({ alignment: centre, spacing: { before: 200, after: 160 }, children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 40, color: '059669' })] }));
      else if (/cover-scheme(?!-)|(^| )scheme( |$)/.test(cls) && tagOf(child) === 'p') push(new Paragraph({ alignment: centre, spacing: { before: 120, after: 60 }, children: [new TextRun({ text, bold: true, size: 24 })] }));
      else if (/tagline/.test(cls)) push(new Paragraph({ alignment: centre, spacing: { after: 160 }, children: [new TextRun({ text, italics: true, size: 19, color: TEAL })] }));
      else if (/cover-meta/.test(cls)) {
        for (const row of (child.children || []).filter((c: any) => isElement(c) && !skipped(c))) {
          // <div><span>District</span>East Godavari</div>: the label is the first element, the value is what follows it.
          const nodes = (row.children || []).filter((c: any) => !(isElement(c) && skipped(c)));
          const labelAt = nodes.findIndex((c: any) => isElement(c));
          if (labelAt >= 0) {
            const label = cleanText(textOf(nodes[labelAt]));
            const value = cleanText(nodes.filter((_: any, i: number) => i !== labelAt).map(textOf).join(' '));
            if (value) push(new Paragraph({ alignment: centre, spacing: { after: 40 }, children: [new TextRun({ text: `${label}: `, bold: true, size: 22 }), new TextRun({ text: value, size: 22 })] }));
          } else {
            const value = cleanText(textOf(row));
            if (value) push(new Paragraph({ alignment: centre, spacing: { after: 40 }, children: [new TextRun({ text: value, size: 22 })] }));
          }
        }
      } else if (tagOf(child) === 'img') push(imageBlock(child, centre));
      else if (['div', 'section', 'header', 'figure'].includes(tagOf(child))) visit(child);
      else if (text) push(new Paragraph({ alignment: centre, spacing: { after: 60 }, children: [new TextRun({ text, size: 22 })] }));
    }
  };
  visit(header);
  out.push(new Paragraph({ spacing: { before: 120, after: 240 }, border: { bottom: { style: BorderStyle.SINGLE, size: 16, color: '1F2937', space: 1 } }, children: [] }));
  return out;
}

function tocBlocks(section: any): Block[] {
  const out: Block[] = [];
  for (const child of section.children || []) {
    if (!isElement(child) || skipped(child)) continue;
    if (tagOf(child) === 'h2') push(out, sectionHeading(child));
    else if (tagOf(child) === 'ol' || tagOf(child) === 'ul') {
      for (const li of (child.children || []).filter((c: any) => isElement(c) && tagOf(c) === 'li' && !skipped(c))) {
        const parts = (li.children || []).filter((c: any) => isElement(c) && !skipped(c));
        const num = cleanText(textOf(parts[0] || li));
        const label = parts.length > 1 ? cleanText(parts.slice(1).map(textOf).join(' ')) : '';
        out.push(new Paragraph({ spacing: { before: 40, after: 40 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB', space: 2 } }, children: [new TextRun({ text: num, bold: true, size: 22 }), ...(label ? [new TextRun({ text: `    ${label}`, size: 22 })] : [])] }));
      }
    }
  }
  return out;
}
const push = (out: Block[], item: Block | null) => { if (item) out.push(item); };

function walkChildren(nodes: any[], ctx: Ctx): Block[] {
  const out: Block[] = [];
  let pending: any[] = [];
  const flush = () => {
    if (!pending.length) return;
    push(out, paragraph(pending, { style: ctx.style, align: ctx.align, spacing: { after: ctx.tight ? 20 : 80 } }));
    pending = [];
  };
  for (const node of nodes || []) {
    if (isText(node)) { pending.push(node); continue; }
    if (!isElement(node) || skipped(node)) continue;
    const tag = tagOf(node);
    if (INLINE_TAGS.has(tag)) { pending.push(node); continue; }
    flush();
    out.push(...walkElement(node, ctx));
  }
  flush();
  return out;
}

function walkElement(el: any, ctx: Ctx): Block[] {
  const tag = tagOf(el);
  const cls = classesOf(el);

  if (tag === 'img') return [imageBlock(el, ctx.align)].filter(Boolean) as Block[];
  if (tag === 'table') return convertTable(el);
  if (HEADINGS[tag]) {
    if (cls.includes('individual-sec-title')) return [sectionHeading(el)].filter(Boolean) as Block[];
    if (cls.includes('individual-qa-q')) {
      return [paragraph(el.children, { style: { bold: true, size: 20 }, shading: 'F3F4F6', keepNext: true, spacing: { before: 120, after: 40 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D1D5DB', space: 1 } } })].filter(Boolean) as Block[];
    }
    const h = HEADINGS[tag];
    return [paragraph(el.children, { style: { ...ctx.style, bold: true, size: h.size }, heading: h.level, keepNext: true, align: ctx.align, spacing: { before: 160, after: 80 } })].filter(Boolean) as Block[];
  }
  if (tag === 'header' && cls.includes('individual-cover')) return coverBlocks(el);
  if (tag === 'section' && cls.includes('individual-toc')) return tocBlocks(el);
  if (tag === 'ul' || tag === 'ol') {
    if (cls.includes('individual-doc-list')) return convertPairList(el);
    const out: Block[] = [];
    let n = 0;
    for (const li of (el.children || []).filter((c: any) => isElement(c) && tagOf(c) === 'li' && !skipped(c))) {
      n += 1;
      const prefix = tag === 'ol' ? `${n}. ` : '• ';
      const text = cleanText(textOf(li));
      if (text) out.push(new Paragraph({ spacing: { after: 40 }, indent: { left: 360, hanging: 260 }, children: [new TextRun({ text: prefix, bold: tag === 'ol', size: ctx.style.size }), ...runsOf(li.children, ctx.style)] }));
    }
    return out;
  }
  if (cls.includes('individual-qa-a')) {
    const text = cleanText(textOf(el));
    if (!text) return [];
    return text.split('\n').map((lineText) => new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: lineText || ' ', size: 21, italics: lineText === '—', color: lineText === '—' ? GREY : '1F2937' })] }));
  }
  if (tag === 'p' || tag === 'pre' || tag === 'blockquote' || tag === 'figcaption' || tag === 'dt' || tag === 'dd' || tag === 'li') {
    return [paragraph(el.children, { style: ctx.style, align: ctx.align, spacing: { after: ctx.tight ? 20 : 80 } })].filter(Boolean) as Block[];
  }
  // Containers (div, section, article, header, ...): their children, in order.
  return walkChildren(el.children || [], ctx);
}

function findRoot(doc: any): any {
  const stack = [...(doc.children || [])];
  while (stack.length) {
    const node = stack.shift();
    if (!isElement(node)) continue;
    if (hasClass(node, 'individual-dpr-document') || hasClass(node, 'dpr-document') || hasClass(node, 'pdf-capture-root')) return node;
    stack.push(...(node.children || []));
  }
  // No marked root: the body, or the whole document.
  const find = (nodes: any[]): any => {
    for (const n of nodes || []) {
      if (isElement(n) && tagOf(n) === 'body') return n;
      const inner = isElement(n) ? find(n.children) : null;
      if (inner) return inner;
    }
    return null;
  };
  return find(doc.children) || doc;
}

/** Builds the Word file from the HTML of the on-screen report. Throws when the HTML has no content to put in it. */
export async function htmlToDocxBuffer(html: string): Promise<Buffer> {
  const dom = parseDocument(String(html || ''), { decodeEntities: true, lowerCaseTags: true });
  const root = findRoot(dom);
  const blocks = walkChildren(root.children || [], { style: {} });
  if (!blocks.length) throw new Error('The report has no content to export');

  const word = new Document({
    creator: 'AP MSME Development Corporation',
    styles: { default: { document: { run: { font: 'Times New Roman', size: 21 } } } },
    sections: [
      {
        properties: { page: { size: { width: PAGE.width, height: PAGE.height }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
        footers: aiDisclaimerDocxFooters({ pageNumbers: true }),
        children: blocks,
      },
    ],
  });
  return Packer.toBuffer(word);
}
