/**
 * Per-DPR report style. The scheme preset is only the starting look.
 * A saved style on the DPR wins over the scheme default.
 */

export const FONT_CHOICES = [
  'Times New Roman',
  'Arial',
  'Calibri',
  'Helvetica',
  'Noto Sans Telugu',
] as const;

export type FontChoice = (typeof FONT_CHOICES)[number];

export const PRESET_IDS = ['government', 'bank', 'pmegp', 'apCmep', 'formal', 'minimal', 'corporate', 'heritage', 'fresh', 'compact'] as const;
export type DocPresetId = (typeof PRESET_IDS)[number];

/** Outline family that draws a preset (cover frame, section titles). The newer looks reuse an existing outline with their own type and colors. */
type DocLayoutId = 'government' | 'bank' | 'pmegp' | 'apCmep' | 'formal' | 'minimal';
export const PRESET_LAYOUT: Record<DocPresetId, DocLayoutId> = {
  government: 'government',
  bank: 'bank',
  pmegp: 'pmegp',
  apCmep: 'apCmep',
  formal: 'formal',
  minimal: 'minimal',
  corporate: 'bank',
  heritage: 'formal',
  fresh: 'minimal',
  compact: 'government',
};
export const layoutOfPreset = (id: DocPresetId): DocLayoutId => PRESET_LAYOUT[id] || 'government';

const TABLE_DENSITIES = ['compact', 'normal', 'roomy'] as const;
export type TableDensity = (typeof TABLE_DENSITIES)[number];
const TABLE_BORDERS = ['template', 'grid', 'rows', 'none'] as const;
export type TableBorders = (typeof TABLE_BORDERS)[number];
const SECTION_BREAKS = ['flow', 'newPage'] as const;
export type SectionBreak = (typeof SECTION_BREAKS)[number];

export const PAGE_SIZES = ['A4', 'A3', 'Letter', 'Legal'] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

export const MARGIN_MIN = 10;
export const MARGIN_MAX = 40;

export interface TypeRole {
  family: FontChoice;
  size: number;
  weight: 400 | 600 | 700;
}

/** Picture box as percents of the column width. h 0 keeps the photo's own height. */
export type ImageBox = { w: number; h: number; x: number; y: number };
export type ImageHandle = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se';

export interface DocumentStyle {
  preset: DocPresetId;
  pageSize: PageSize;
  /** Portrait page. Wide money tables can take a landscape sheet. */
  wideTablesLandscape: boolean;
  marginMm: { top: number; right: number; bottom: number; left: number };
  cover: TypeRole;
  sectionTitle: TypeRole;
  body: TypeRole;
  table: TypeRole;
  caption: TypeRole;
  align: 'left' | 'justify';
  lineHeight: number;
  paragraphGap: number;
  colors: { primary: string; header: string; table: string; border: string };
  logoAlign: 'left' | 'center' | 'right';
  logoDataUrl: string;
  agencyName: string;
  headerLine: boolean;
  pageNumberStyle: 'plain' | 'of';
  watermark: string;
  watermarkOpacity: number;
  watermarkAngle: number;
  tableStriped: boolean;
  /** Cell padding in tables. */
  tableDensity: TableDensity;
  /** 'template' keeps the lines the chosen template draws. */
  tableBorders: TableBorders;
  /** 'newPage' starts the contents and every section at the top of a page. */
  sectionBreak: SectionBreak;
  showToc: boolean;
  headingNumbers: boolean;
  /** Short line at the foot of every page, left side (for example the firm name or "Draft"). */
  footerText: string;
  sectionOrder: string[];
  hiddenSectionIds: string[];
  images: { cover: string; annexure: string; after: Record<string, string> };
  imageWidths: { cover: number; annexure: number; after: Record<string, number> };
  imageFrames: { cover: ImageBox; annexure: ImageBox; after: Record<string, ImageBox> };
  pictures: ReportPicture[];
  customSections: CustomSection[];
  sectionBlocks: Record<string, SectionBlock[]>;
}

export type CustomSection = {
  id: string;
  title: string;
};

export type SectionBlock =
  | { id: string; kind: 'text'; text: string }
  | { id: string; kind: 'image'; name: string; src: string; hidden: boolean; frame: ImageBox };

/** A named picture in the section list. `place` is where it was first inserted. */
export type ReportPicture = {
  id: string;
  name: string;
  src: string;
  hidden: boolean;
  place: string;
  frame: ImageBox;
};

export const pictureToken = (id: string) => `pic:${id}`;
export const pictureIdFromToken = (token: string) => (token.startsWith('pic:') ? token.slice(4) : '');

export const PRESET_LABELS: Record<DocPresetId, string> = {
  government: 'Gazette',
  bank: 'Ledger',
  pmegp: 'Ribbon',
  apCmep: 'Docket',
  formal: 'Manuscript',
  minimal: 'Quiet',
  corporate: 'Corporate',
  heritage: 'Heritage',
  fresh: 'Fresh',
  compact: 'Compact',
};

/** One line on what each template is good for, shown under its picture. */
export const PRESET_NOTES: Record<DocPresetId, string> = {
  government: 'Boxed cover, navy headings',
  bank: 'Dark section bars, clean tables',
  pmegp: 'Teal ribbon, KVIC style',
  apCmep: 'Indigo cards, AP MSME style',
  formal: 'Serif, justified, plain rules',
  minimal: 'Light and quiet',
  corporate: 'Blue bars, sans-serif',
  heritage: 'Maroon serif, classic',
  fresh: 'Green accents, airy',
  compact: 'Smaller type, fewer pages',
};

const DEFAULT_WATERMARK = 'Confidential — for lending appraisal';

function role(family: FontChoice, size: number, weight: TypeRole['weight']): TypeRole {
  return { family, size, weight };
}

function margins(n: number): DocumentStyle['marginMm'] {
  return { top: n, right: n, bottom: n, left: n };
}

function emptyImages(): DocumentStyle['images'] {
  return { cover: '', annexure: '', after: {} };
}

function emptyWidths(): DocumentStyle['imageWidths'] {
  return { cover: 100, annexure: 100, after: {} };
}

function emptyBox(): ImageBox {
  return { w: 100, h: 0, x: 0, y: 0 };
}

function emptyFrames(): DocumentStyle['imageFrames'] {
  return { cover: emptyBox(), annexure: emptyBox(), after: {} };
}

function emptyPictures(): ReportPicture[] {
  return [];
}

function clampWidth(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(100, Math.max(20, Math.round(n)));
}

function clampImageBox(box: Partial<ImageBox> | null | undefined): ImageBox {
  const w = clampWidth(box?.w) ?? 100;
  const hRaw = Number(box?.h);
  const h = !Number.isFinite(hRaw) || hRaw <= 0 ? 0 : Math.min(250, Math.max(8, Math.round(hRaw)));
  let x = Math.round(Number(box?.x) || 0);
  let y = Math.round(Number(box?.y) || 0);
  if (x < 0) x = 0;
  if (x + w > 100) x = Math.max(0, 100 - w);
  if (y < 0) y = 0;
  if (y > 120) y = 120;
  return { w, h, x, y };
}

/** Word-style resize. dx and dy are percents of the column width. The opposite edge stays put. */
export function resizeImageBox(start: ImageBox, handle: ImageHandle, dx: number, dy: number): ImageBox {
  const h0 = start.h > 0 ? start.h : Math.max(8, start.w * 0.75);
  const ratio = h0 / start.w;
  let w = start.w;
  let h = h0;
  const west = handle === 'w' || handle === 'nw' || handle === 'sw';
  const east = handle === 'e' || handle === 'ne' || handle === 'se';
  const north = handle === 'n' || handle === 'nw' || handle === 'ne';
  const south = handle === 's' || handle === 'sw' || handle === 'se';
  const corner = handle.length === 2;

  if (corner) {
    const dw = east ? dx : -dx;
    const dh = south ? dy : -dy;
    const scale = Math.abs(dw) >= Math.abs(dh) ? (start.w + dw) / start.w : (h0 + dh) / h0;
    w = start.w * scale;
    h = h0 * scale;
  } else if (east) w = start.w + dx;
  else if (west) w = start.w - dx;
  else if (south) h = h0 + dy;
  else h = h0 - dy;

  let x = start.x;
  let y = start.y;
  if (west) {
    w = Math.min(Math.max(w, 20), start.x + start.w);
    if (corner) h = w * ratio;
    x = start.x + start.w - w;
  } else if (east) {
    w = Math.min(Math.max(w, 20), 100 - start.x);
    if (corner) h = w * ratio;
    x = start.x;
  }
  const bottom = start.y + h0;
  if (north) {
    h = Math.min(Math.max(h, 8), bottom);
    if (corner) {
      w = Math.min(Math.max(h / ratio, 20), west ? start.x + start.w : 100 - start.x);
      h = w * ratio;
      if (h > bottom) {
        h = bottom;
        w = h / ratio;
      }
      x = west ? start.x + start.w - w : start.x;
    }
    y = bottom - h;
  } else if (south) {
    h = Math.min(Math.max(h, 8), 250);
    if (corner) {
      w = Math.min(Math.max(h / ratio, 20), west ? start.x + start.w : 100 - start.x);
      h = w * ratio;
      x = west ? start.x + start.w - w : start.x;
    }
    y = start.y;
  }
  return clampImageBox({ w, h, x, y });
}

export function presetStyle(id: DocPresetId): DocumentStyle {
  const shared = {
    pageSize: 'A4' as PageSize,
    wideTablesLandscape: false,
    align: 'left' as const,
    lineHeight: 1.45,
    paragraphGap: 6,
    logoAlign: 'left' as const,
    logoDataUrl: '',
    agencyName: '',
    headerLine: true,
    pageNumberStyle: 'of' as const,
    watermark: DEFAULT_WATERMARK,
    watermarkOpacity: 0.12,
    watermarkAngle: -32,
    tableStriped: true,
    tableDensity: 'normal' as TableDensity,
    tableBorders: 'template' as TableBorders,
    sectionBreak: 'flow' as SectionBreak,
    showToc: true,
    headingNumbers: true,
    footerText: '',
    sectionOrder: [] as string[],
    hiddenSectionIds: [] as string[],
    images: emptyImages(),
    imageWidths: emptyWidths(),
    imageFrames: emptyFrames(),
    pictures: emptyPictures(),
    customSections: [] as CustomSection[],
    sectionBlocks: {} as Record<string, SectionBlock[]>,
  };

  if (id === 'bank') {
    return {
      ...shared,
      preset: id,
      marginMm: margins(16),
      cover: role('Calibri', 22, 700),
      sectionTitle: role('Calibri', 14, 700),
      body: role('Calibri', 11, 400),
      table: role('Calibri', 9, 600),
      caption: role('Calibri', 9, 400),
      colors: { primary: '#0f172a', header: '#0f172a', table: '#0f766e', border: '#0f172a' },
      align: 'justify',
    };
  }
  if (id === 'pmegp') {
    return {
      ...shared,
      preset: id,
      marginMm: margins(16),
      cover: role('Times New Roman', 22, 700),
      sectionTitle: role('Times New Roman', 14, 700),
      body: role('Times New Roman', 11, 400),
      table: role('Times New Roman', 9, 600),
      caption: role('Times New Roman', 9, 400),
      colors: { primary: '#115e59', header: '#115e59', table: '#0f766e', border: '#115e59' },
      agencyName: 'Khadi & Village Industries Commission',
    };
  }
  if (id === 'apCmep') {
    return {
      ...shared,
      preset: id,
      marginMm: margins(16),
      cover: role('Calibri', 22, 700),
      sectionTitle: role('Calibri', 14, 700),
      body: role('Calibri', 11, 400),
      table: role('Calibri', 9, 600),
      caption: role('Calibri', 9, 400),
      colors: { primary: '#3730a3', header: '#312e81', table: '#3730a3', border: '#3730a3' },
      agencyName: 'Andhra Pradesh MSME',
      wideTablesLandscape: true,
    };
  }
  if (id === 'formal') {
    return {
      ...shared,
      preset: id,
      marginMm: margins(18),
      cover: role('Times New Roman', 20, 700),
      sectionTitle: role('Times New Roman', 13, 700),
      body: role('Times New Roman', 11, 400),
      table: role('Times New Roman', 9, 600),
      caption: role('Times New Roman', 9, 400),
      colors: { primary: '#1c1917', header: '#1c1917', table: '#44403c', border: '#1c1917' },
      align: 'justify',
      tableStriped: false,
    };
  }
  if (id === 'minimal') {
    return {
      ...shared,
      preset: id,
      marginMm: margins(18),
      cover: role('Helvetica', 20, 600),
      sectionTitle: role('Helvetica', 13, 600),
      body: role('Helvetica', 11, 400),
      table: role('Helvetica', 9, 600),
      caption: role('Helvetica', 9, 400),
      colors: { primary: '#111827', header: '#111827', table: '#374151', border: '#6b7280' },
      headerLine: false,
      watermark: '',
      tableStriped: false,
    };
  }
  if (id === 'corporate') {
    return {
      ...shared,
      preset: id,
      marginMm: margins(16),
      cover: role('Calibri', 22, 700),
      sectionTitle: role('Calibri', 14, 700),
      body: role('Calibri', 11, 400),
      table: role('Calibri', 9, 600),
      caption: role('Calibri', 9, 400),
      colors: { primary: '#1e40af', header: '#1e3a8a', table: '#1d4ed8', border: '#1e3a8a' },
      watermark: '',
    };
  }
  if (id === 'heritage') {
    return {
      ...shared,
      preset: id,
      marginMm: margins(20),
      cover: role('Times New Roman', 22, 700),
      sectionTitle: role('Times New Roman', 14, 700),
      body: role('Times New Roman', 11.5, 400),
      table: role('Times New Roman', 9.5, 600),
      caption: role('Times New Roman', 9, 400),
      colors: { primary: '#7f1d1d', header: '#7f1d1d', table: '#7f1d1d', border: '#7f1d1d' },
      align: 'justify',
      lineHeight: 1.55,
      tableStriped: false,
      watermark: '',
    };
  }
  if (id === 'fresh') {
    return {
      ...shared,
      preset: id,
      marginMm: margins(18),
      cover: role('Helvetica', 21, 600),
      sectionTitle: role('Helvetica', 13, 600),
      body: role('Helvetica', 11, 400),
      table: role('Helvetica', 9, 600),
      caption: role('Helvetica', 9, 400),
      colors: { primary: '#166534', header: '#166534', table: '#15803d', border: '#166534' },
      lineHeight: 1.55,
      paragraphGap: 8,
      tableDensity: 'roomy',
      tableStriped: true,
      watermark: '',
    };
  }
  if (id === 'compact') {
    return {
      ...shared,
      preset: id,
      marginMm: margins(12),
      cover: role('Arial', 20, 700),
      sectionTitle: role('Arial', 12, 700),
      body: role('Arial', 10, 400),
      table: role('Arial', 8.5, 600),
      caption: role('Arial', 8.5, 400),
      colors: { primary: '#1e3a5f', header: '#1e3a5f', table: '#1e3a5f', border: '#1e3a5f' },
      lineHeight: 1.3,
      paragraphGap: 4,
      tableDensity: 'compact',
    };
  }
  return {
    ...shared,
    preset: 'government',
    marginMm: margins(16),
    cover: role('Times New Roman', 22, 700),
    sectionTitle: role('Times New Roman', 14, 700),
    body: role('Times New Roman', 11, 400),
    table: role('Times New Roman', 9, 600),
    caption: role('Times New Roman', 9, 400),
    colors: { primary: '#1e3a5f', header: '#1e3a5f', table: '#1e3a5f', border: '#1e3a5f' },
  };
}

export function defaultStyleForScheme(schemeCode?: string | null): DocumentStyle {
  const code = String(schemeCode || '').toUpperCase();
  if (code === 'PMEGP') return presetStyle('pmegp');
  if (code === 'AP_CMEP' || code.includes('CMEP')) return presetStyle('apCmep');
  return presetStyle('government');
}

function isPreset(value: unknown): value is DocPresetId {
  return PRESET_IDS.includes(value as DocPresetId);
}

function isPage(value: unknown): value is PageSize {
  return PAGE_SIZES.includes(value as PageSize);
}

function clampNum(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function clampRole(value: unknown, fallback: TypeRole): TypeRole {
  const v = (value || {}) as Partial<TypeRole>;
  const family = FONT_CHOICES.includes(v.family as FontChoice) ? (v.family as FontChoice) : fallback.family;
  const weight = v.weight === 600 || v.weight === 700 || v.weight === 400 ? v.weight : fallback.weight;
  return {
    family,
    size: clampNum(v.size, 8, 36, fallback.size),
    weight,
  };
}

function hexColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

function safeText(value: unknown, fallback: string, max = 160): string {
  if (typeof value !== 'string') return fallback;
  return value.slice(0, max);
}

function safeImage(value: unknown): string {
  if (typeof value !== 'string') return '';
  if (!value.startsWith('data:image/')) return '';
  if (value.length > 500_000) return '';
  return value;
}

function readCustomSections(raw: unknown): CustomSection[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const id = typeof item.id === 'string' ? item.id : '';
    const title = typeof item.title === 'string' ? item.title.trim().slice(0, 80) : '';
    if (!/^csec_[A-Za-z0-9]+$/.test(id) || !title) return [];
    return [{ id: id.slice(0, 40), title }];
  });
}

function readSectionBlocks(raw: unknown): Record<string, SectionBlock[]> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, SectionBlock[]> = {};
  for (const [sectionId, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(sectionId) || !Array.isArray(value)) continue;
    const blocks: SectionBlock[] = value.flatMap((rawBlock): SectionBlock[] => {
      if (!rawBlock || typeof rawBlock !== 'object') return [];
      const item = rawBlock as { id?: unknown; kind?: unknown; text?: unknown; name?: unknown; src?: unknown; hidden?: unknown; frame?: Partial<ImageBox> };
      const id = typeof item.id === 'string' ? item.id.replace(/[^A-Za-z0-9_]/g, '').slice(0, 40) : '';
      if (!id) return [];
      if (item.kind === 'text') {
        return [{ id, kind: 'text' as const, text: typeof item.text === 'string' ? item.text.slice(0, 8000) : '' }];
      }
      if (item.kind === 'image') {
        const src = safeImage(item.src);
        if (!src) return [];
        const name = typeof item.name === 'string' && item.name.trim() ? item.name.trim().slice(0, 80) : 'Picture';
        return [{ id, kind: 'image' as const, name, src, hidden: Boolean(item.hidden), frame: clampImageBox(item.frame) }];
      }
      return [];
    });
    if (blocks.length) out[sectionId] = blocks;
  }
  return out;
}

export function resolveDocumentStyle(saved: unknown, schemeCode?: string | null): DocumentStyle {
  const base = defaultStyleForScheme(schemeCode);
  if (!saved || typeof saved !== 'object') return base;
  const s = saved as Partial<DocumentStyle>;
  const fromPreset = isPreset(s.preset) ? presetStyle(s.preset) : base;
  const afterRaw = s.images && typeof s.images.after === 'object' && s.images.after ? s.images.after : {};
  const after: Record<string, string> = {};
  for (const [key, value] of Object.entries(afterRaw)) {
    const img = safeImage(value);
    if (img) after[key] = img;
  }
  return {
    ...fromPreset,
    preset: fromPreset.preset,
    pageSize: isPage(s.pageSize) ? s.pageSize : fromPreset.pageSize,
    wideTablesLandscape: typeof s.wideTablesLandscape === 'boolean' ? s.wideTablesLandscape : fromPreset.wideTablesLandscape,
    marginMm: {
      top: clampNum(s.marginMm?.top, MARGIN_MIN, MARGIN_MAX, fromPreset.marginMm.top),
      right: clampNum(s.marginMm?.right, MARGIN_MIN, MARGIN_MAX, fromPreset.marginMm.right),
      bottom: clampNum(s.marginMm?.bottom, MARGIN_MIN, MARGIN_MAX, fromPreset.marginMm.bottom),
      left: clampNum(s.marginMm?.left, MARGIN_MIN, MARGIN_MAX, fromPreset.marginMm.left),
    },
    cover: clampRole(s.cover, fromPreset.cover),
    sectionTitle: clampRole(s.sectionTitle, fromPreset.sectionTitle),
    body: clampRole(s.body, fromPreset.body),
    table: clampRole(s.table, fromPreset.table),
    caption: clampRole(s.caption, fromPreset.caption),
    align: s.align === 'justify' || s.align === 'left' ? s.align : fromPreset.align,
    lineHeight: clampNum(s.lineHeight, 1, 2, fromPreset.lineHeight),
    paragraphGap: clampNum(s.paragraphGap, 0, 24, fromPreset.paragraphGap),
    colors: {
      primary: hexColor(s.colors?.primary, fromPreset.colors.primary),
      header: hexColor(s.colors?.header, fromPreset.colors.header),
      table: hexColor(s.colors?.table, fromPreset.colors.table),
      border: hexColor(s.colors?.border, fromPreset.colors.border),
    },
    logoAlign: s.logoAlign === 'center' || s.logoAlign === 'right' || s.logoAlign === 'left' ? s.logoAlign : fromPreset.logoAlign,
    logoDataUrl: safeImage(s.logoDataUrl),
    agencyName: safeText(s.agencyName, fromPreset.agencyName),
    headerLine: typeof s.headerLine === 'boolean' ? s.headerLine : fromPreset.headerLine,
    pageNumberStyle: s.pageNumberStyle === 'plain' || s.pageNumberStyle === 'of' ? s.pageNumberStyle : fromPreset.pageNumberStyle,
    watermark: safeText(s.watermark, fromPreset.watermark),
    watermarkOpacity: clampNum(s.watermarkOpacity, 0.04, 0.4, fromPreset.watermarkOpacity),
    watermarkAngle: clampNum(s.watermarkAngle, -90, 90, fromPreset.watermarkAngle),
    tableStriped: typeof s.tableStriped === 'boolean' ? s.tableStriped : fromPreset.tableStriped,
    tableDensity: TABLE_DENSITIES.includes(s.tableDensity as TableDensity) ? (s.tableDensity as TableDensity) : fromPreset.tableDensity,
    tableBorders: TABLE_BORDERS.includes(s.tableBorders as TableBorders) ? (s.tableBorders as TableBorders) : fromPreset.tableBorders,
    sectionBreak: SECTION_BREAKS.includes(s.sectionBreak as SectionBreak) ? (s.sectionBreak as SectionBreak) : fromPreset.sectionBreak,
    showToc: typeof s.showToc === 'boolean' ? s.showToc : fromPreset.showToc,
    headingNumbers: typeof s.headingNumbers === 'boolean' ? s.headingNumbers : fromPreset.headingNumbers,
    footerText: safeText(s.footerText, fromPreset.footerText, 80),
    sectionOrder: Array.isArray(s.sectionOrder) ? s.sectionOrder.filter((id) => typeof id === 'string') : [],
    hiddenSectionIds: Array.isArray(s.hiddenSectionIds) ? s.hiddenSectionIds.filter((id) => typeof id === 'string') : [],
    images: {
      cover: safeImage(s.images?.cover),
      annexure: safeImage(s.images?.annexure),
      after,
    },
    imageWidths: readImageWidths(s.imageWidths, {
      cover: Boolean(safeImage(s.images?.cover)),
      annexure: Boolean(safeImage(s.images?.annexure)),
      after,
    }),
    imageFrames: readImageFrames(s.imageFrames, s.imageWidths, {
      cover: Boolean(safeImage(s.images?.cover)),
      annexure: Boolean(safeImage(s.images?.annexure)),
      after,
    }),
    customSections: readCustomSections(s.customSections),
    sectionBlocks: readSectionBlocks(s.sectionBlocks),
    pictures: readPictures(s, {
      cover: safeImage(s.images?.cover),
      annexure: safeImage(s.images?.annexure),
      after,
    }, readImageFrames(s.imageFrames, s.imageWidths, {
      cover: Boolean(safeImage(s.images?.cover)),
      annexure: Boolean(safeImage(s.images?.annexure)),
      after,
    })),
  };
}

function cleanPicture(raw: unknown): ReportPicture | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Partial<ReportPicture>;
  const src = safeImage(item.src);
  const id = typeof item.id === 'string' ? item.id.slice(0, 40) : '';
  if (!src || !id) return null;
  const name = typeof item.name === 'string' && item.name.trim() ? item.name.trim().slice(0, 80) : 'Picture';
  return {
    id,
    name,
    src,
    hidden: Boolean(item.hidden),
    place: typeof item.place === 'string' ? item.place.slice(0, 80) : 'annexure',
    frame: clampImageBox(item.frame),
  };
}

function readPictures(
  saved: Partial<DocumentStyle>,
  images: DocumentStyle['images'],
  frames: DocumentStyle['imageFrames']
): ReportPicture[] {
  if (Array.isArray(saved.pictures)) {
    return saved.pictures.map(cleanPicture).filter((item): item is ReportPicture => Boolean(item));
  }
  const pictures: ReportPicture[] = [];
  const add = (src: string, name: string, place: string, frame: ImageBox) => {
    if (!src) return;
    pictures.push({
      id: `pic_${place}_${pictures.length}`.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 40),
      name,
      src,
      hidden: false,
      place,
      frame,
    });
  };
  add(images.cover, 'Cover picture', 'cover', frames.cover);
  for (const [sectionId, src] of Object.entries(images.after)) add(src, 'Picture', sectionId, frames.after[sectionId] || emptyBox());
  add(images.annexure, 'Annexure picture', 'annexure', frames.annexure);
  return pictures;
}

function readImageWidths(
  raw: DocumentStyle['imageWidths'] | undefined,
  present: { cover: boolean; annexure: boolean; after: Record<string, string> }
): DocumentStyle['imageWidths'] {
  const after: Record<string, number> = {};
  const afterRaw = raw?.after && typeof raw.after === 'object' ? raw.after : {};
  for (const key of Object.keys(present.after)) {
    after[key] = clampWidth(afterRaw[key]) ?? 100;
  }
  return {
    cover: present.cover ? (clampWidth(raw?.cover) ?? 100) : 100,
    annexure: present.annexure ? (clampWidth(raw?.annexure) ?? 100) : 100,
    after,
  };
}

function readImageFrames(
  raw: DocumentStyle['imageFrames'] | undefined,
  widths: DocumentStyle['imageWidths'] | undefined,
  present: { cover: boolean; annexure: boolean; after: Record<string, string> }
): DocumentStyle['imageFrames'] {
  const after: Record<string, ImageBox> = {};
  for (const key of Object.keys(present.after)) {
    after[key] = clampImageBox({ ...(raw?.after?.[key] || {}), w: raw?.after?.[key]?.w ?? widths?.after?.[key] ?? 100 });
  }
  return {
    cover: present.cover ? clampImageBox({ ...(raw?.cover || {}), w: raw?.cover?.w ?? widths?.cover ?? 100 }) : emptyBox(),
    annexure: present.annexure ? clampImageBox({ ...(raw?.annexure || {}), w: raw?.annexure?.w ?? widths?.annexure ?? 100 }) : emptyBox(),
    after,
  };
}

function imageFrameOf(style: DocumentStyle, slot: string): ImageBox {
  if (slot === 'cover') return style.imageFrames?.cover || emptyBox();
  if (slot === 'annexure') return style.imageFrames?.annexure || emptyBox();
  return style.imageFrames?.after?.[slot] || { ...emptyBox(), w: style.imageWidths?.after?.[slot] || 100 };
}


function writeFrame(style: DocumentStyle, slot: string, box: ImageBox): DocumentStyle {
  const frames: DocumentStyle['imageFrames'] = {
    cover: style.imageFrames?.cover || emptyBox(),
    annexure: style.imageFrames?.annexure || emptyBox(),
    after: { ...(style.imageFrames?.after || {}) },
  };
  const widths: DocumentStyle['imageWidths'] = {
    cover: style.imageWidths?.cover ?? 100,
    annexure: style.imageWidths?.annexure ?? 100,
    after: { ...(style.imageWidths?.after || {}) },
  };
  if (slot === 'cover') {
    frames.cover = box;
    widths.cover = box.w;
  } else if (slot === 'annexure') {
    frames.annexure = box;
    widths.annexure = box.w;
  } else {
    frames.after[slot] = box;
    widths.after[slot] = box.w;
  }
  return { ...style, imageFrames: frames, imageWidths: widths };
}


export function setImageWidth(style: DocumentStyle, slot: string, pct: number): DocumentStyle {
  const current = imageFrameOf(style, slot);
  return writeFrame(style, slot, clampImageBox({ ...current, w: pct }));
}

/** Keep section order and pictures when the person picks a new preset. */
export function applyPreset(current: DocumentStyle, id: DocPresetId): DocumentStyle {
  const next = presetStyle(id);
  return {
    ...next,
    sectionOrder: current.sectionOrder,
    hiddenSectionIds: current.hiddenSectionIds,
    images: current.images,
    imageWidths: current.imageWidths,
    imageFrames: current.imageFrames,
    pictures: current.pictures,
    customSections: current.customSections,
    sectionBlocks: current.sectionBlocks,
    logoDataUrl: current.logoDataUrl,
    agencyName: current.agencyName || next.agencyName,
    pageSize: current.pageSize,
    marginMm: current.marginMm,
    footerText: current.footerText || '',
  };
}

export function applySectionOrder<T extends { id: string }>(
  steps: T[],
  style: Pick<DocumentStyle, 'sectionOrder' | 'hiddenSectionIds'>
): T[] {
  const hidden = new Set(style.hiddenSectionIds || []);
  const visible = steps.filter((step) => !hidden.has(step.id));
  const order = style.sectionOrder || [];
  if (!order.length) return visible;
  const rank = new Map(order.map((id, index) => [id, index]));
  return [...visible].sort((a, b) => (rank.get(a.id) ?? 1000) - (rank.get(b.id) ?? 1000));
}

export function moveSection(
  order: string[],
  steps: { id: string }[],
  fromId: string,
  toId: string,
  place: 'before' | 'after' = 'before'
): string[] {
  const ids = order.length ? [...order] : steps.map((step) => step.id);
  for (const step of steps) {
    if (!ids.includes(step.id)) ids.push(step.id);
  }
  const from = ids.indexOf(fromId);
  const to = ids.indexOf(toId);
  if (from < 0 || to < 0 || from === to) return ids;
  const [item] = ids.splice(from, 1);
  let insertAt = ids.indexOf(toId);
  if (place === 'after') insertAt += 1;
  ids.splice(insertAt, 0, item);
  return ids;
}

/** Step-button order follows the section list. Picture tokens are skipped. */
export function selectionStepOrder(
  steps: { id: string; n: number }[],
  sectionOrder: string[] | undefined,
  visible: number[]
): number[] {
  if (!sectionOrder?.length) return visible;
  const byId = new Map(steps.map((step) => [step.id, step.n]));
  const ordered: number[] = [];
  const seen = new Set<number>();
  for (const id of sectionOrder) {
    const n = byId.get(id);
    if (n == null || !visible.includes(n) || seen.has(n)) continue;
    seen.add(n);
    ordered.push(n);
  }
  for (const n of visible) {
    if (!seen.has(n)) ordered.push(n);
  }
  return ordered.length ? ordered : visible;
}

/** Section ids, custom sections, and pic: tokens, with any new picture sitting at its saved place. */
export function layoutOrder(
  steps: { id: string }[],
  style: Pick<DocumentStyle, 'sectionOrder' | 'pictures' | 'customSections'>
): string[] {
  const customIds = (style.customSections || []).map((section) => section.id);
  const ids = style.sectionOrder?.length ? [...style.sectionOrder] : steps.map((step) => step.id);
  for (const step of steps) {
    if (!ids.includes(step.id)) ids.push(step.id);
  }
  for (const id of customIds) {
    if (!ids.includes(id)) ids.push(id);
  }
  for (const picture of style.pictures || []) {
    const token = pictureToken(picture.id);
    if (ids.includes(token)) continue;
    if (picture.place === 'cover') ids.unshift(token);
    else if (picture.place && picture.place !== 'annexure' && ids.includes(picture.place)) {
      ids.splice(ids.indexOf(picture.place) + 1, 0, token);
    } else ids.push(token);
  }
  const known = new Set([
    ...steps.map((step) => step.id),
    ...customIds,
    ...(style.pictures || []).map((picture) => pictureToken(picture.id)),
  ]);
  return ids.filter((id) => known.has(id));
}

export function newContentId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 40);
}

export function addCustomSection(
  style: DocumentStyle,
  steps: { id: string }[],
  title: string,
  id = newContentId('csec')
): DocumentStyle {
  const section = { id, title: title.trim().slice(0, 80) || 'New section' };
  const customSections = [...(style.customSections || []).filter((item) => item.id !== id), section];
  const next = { ...style, customSections };
  return { ...next, sectionOrder: layoutOrder(steps, next) };
}

export function renameCustomSection(style: DocumentStyle, id: string, title: string): DocumentStyle {
  return {
    ...style,
    customSections: (style.customSections || []).map((section) => (
      section.id === id ? { ...section, title: title.trim().slice(0, 80) || section.title } : section
    )),
  };
}

export function removeCustomSection(style: DocumentStyle, id: string): DocumentStyle {
  const blocks = { ...(style.sectionBlocks || {}) };
  delete blocks[id];
  return {
    ...style,
    customSections: (style.customSections || []).filter((section) => section.id !== id),
    sectionBlocks: blocks,
    sectionOrder: (style.sectionOrder || []).filter((token) => token !== id),
    hiddenSectionIds: (style.hiddenSectionIds || []).filter((token) => token !== id),
  };
}

export function addSectionBlock(style: DocumentStyle, sectionId: string, block: SectionBlock): DocumentStyle {
  const sectionBlocks = { ...(style.sectionBlocks || {}) };
  sectionBlocks[sectionId] = [...(sectionBlocks[sectionId] || []), block];
  return { ...style, sectionBlocks };
}

export function removeSectionBlock(style: DocumentStyle, sectionId: string, blockId: string): DocumentStyle {
  const sectionBlocks = { ...(style.sectionBlocks || {}) };
  sectionBlocks[sectionId] = (sectionBlocks[sectionId] || []).filter((block) => block.id !== blockId);
  return { ...style, sectionBlocks };
}

export function setBlockText(style: DocumentStyle, sectionId: string, blockId: string, text: string): DocumentStyle {
  const sectionBlocks = { ...(style.sectionBlocks || {}) };
  sectionBlocks[sectionId] = (sectionBlocks[sectionId] || []).map((block) => (
    block.id === blockId && block.kind === 'text' ? { ...block, text: text.slice(0, 8000) } : block
  ));
  return { ...style, sectionBlocks };
}


export function parseBlockFrameSlot(slot: string): { sectionId: string; blockId: string } | null {
  if (!slot.startsWith('block:')) return null;
  const rest = slot.slice('block:'.length);
  const cut = rest.lastIndexOf(':');
  if (cut <= 0) return null;
  return { sectionId: rest.slice(0, cut), blockId: rest.slice(cut + 1) };
}

export function setBlockFrame(style: DocumentStyle, slot: string, box: Partial<ImageBox>): DocumentStyle {
  const parsed = parseBlockFrameSlot(slot);
  if (!parsed) return style;
  const sectionBlocks = { ...(style.sectionBlocks || {}) };
  sectionBlocks[parsed.sectionId] = (sectionBlocks[parsed.sectionId] || []).map((block) => (
    block.id === parsed.blockId && block.kind === 'image'
      ? { ...block, frame: clampImageBox({ ...block.frame, ...box }) }
      : block
  ));
  return { ...style, sectionBlocks };
}

export function insertPicture(
  style: DocumentStyle,
  steps: { id: string }[],
  picture: ReportPicture
): DocumentStyle {
  const pictures = [...(style.pictures || []), picture];
  return { ...style, pictures, sectionOrder: layoutOrder(steps, { ...style, pictures }) };
}

export function setPictureFrame(style: DocumentStyle, pictureId: string, box: Partial<ImageBox>): DocumentStyle {
  return {
    ...style,
    pictures: (style.pictures || []).map((picture) => (
      picture.id === pictureId ? { ...picture, frame: clampImageBox(box) } : picture
    )),
  };
}

function channel(hex: string, index: number): number {
  const n = parseInt(hex.slice(index, index + 2), 16) / 255;
  return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
}

function contrastRatio(fg: string, bg: string): number {
  if (!/^#[0-9a-fA-F]{6}$/.test(fg) || !/^#[0-9a-fA-F]{6}$/.test(bg)) return 1;
  const L = (hex: string) => 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
  const a = L(fg);
  const b = L(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** One-click color sets for the Colors group. Every color keeps the contrast the color controls demand. */
export const COLOR_PALETTES: { id: string; label: string; colors: DocumentStyle['colors'] }[] = [
  { id: 'navy', label: 'Navy', colors: { primary: '#1e3a5f', header: '#1e3a5f', table: '#1e3a5f', border: '#1e3a5f' } },
  { id: 'blue', label: 'Blue', colors: { primary: '#1e40af', header: '#1e3a8a', table: '#1d4ed8', border: '#1e3a8a' } },
  { id: 'teal', label: 'Teal', colors: { primary: '#115e59', header: '#115e59', table: '#0f766e', border: '#115e59' } },
  { id: 'forest', label: 'Forest', colors: { primary: '#166534', header: '#14532d', table: '#15803d', border: '#166534' } },
  { id: 'indigo', label: 'Indigo', colors: { primary: '#3730a3', header: '#312e81', table: '#3730a3', border: '#3730a3' } },
  { id: 'purple', label: 'Purple', colors: { primary: '#6b21a8', header: '#581c87', table: '#7e22ce', border: '#6b21a8' } },
  { id: 'maroon', label: 'Maroon', colors: { primary: '#7f1d1d', header: '#7f1d1d', table: '#7f1d1d', border: '#7f1d1d' } },
  { id: 'amber', label: 'Amber', colors: { primary: '#92400e', header: '#78350f', table: '#b45309', border: '#92400e' } },
  { id: 'charcoal', label: 'Charcoal', colors: { primary: '#111827', header: '#111827', table: '#374151', border: '#6b7280' } },
];

/** Line and paragraph spacing choices for the Type group. */
export const SPACING_CHOICES: { id: string; label: string; lineHeight: number; paragraphGap: number }[] = [
  { id: 'tight', label: 'Tight', lineHeight: 1.25, paragraphGap: 3 },
  { id: 'normal', label: 'Normal', lineHeight: 1.45, paragraphGap: 6 },
  { id: 'relaxed', label: 'Relaxed', lineHeight: 1.7, paragraphGap: 10 },
];

/** Margin choices for the Page group (mm, all four sides). */
export const MARGIN_CHOICES: { id: string; label: string; mm: number }[] = [
  { id: 'narrow', label: 'Narrow', mm: 12 },
  { id: 'normal', label: 'Normal', mm: 16 },
  { id: 'wide', label: 'Wide', mm: 22 },
];

/** Every type size up or down together, kept inside the 8 to 36 pt the controls allow. */
export function scaleTypeSizes(style: DocumentStyle, deltaPt: number): DocumentStyle {
  const bump = (role: TypeRole): TypeRole => ({ ...role, size: Math.min(36, Math.max(8, Math.round((role.size + deltaPt) * 2) / 2)) });
  return { ...style, cover: bump(style.cover), sectionTitle: bump(style.sectionTitle), body: bump(style.body), table: bump(style.table), caption: bump(style.caption) };
}

/** Text must stay readable. 3:1 is the floor used by the color controls. */
export function contrastOk(fg: string, bg = '#ffffff'): boolean {
  return contrastRatio(fg, bg) >= 3;
}

export function pageWidthMm(size: PageSize): number {
  if (size === 'A3') return 297;
  if (size === 'Letter' || size === 'Legal') return 216;
  return 210;
}

export function pageHeightMm(size: PageSize): number {
  if (size === 'A3') return 420;
  if (size === 'Letter') return 279;
  if (size === 'Legal') return 356;
  return 297;
}

/** How many sheets a fitted report occupies. A sliver under one page does not add a blank sheet. */
export function pageCountForHeight(sheetHeightPx: number, pageHeightPx: number): number {
  if (!(pageHeightPx > 0) || !(sheetHeightPx > 0)) return 1;
  return Math.max(1, Math.ceil(sheetHeightPx / pageHeightPx - 0.02));
}

/** `plain` is the number. `of` fills {n} and {total} in the pattern. */
export function formatPageNumber(
  style: string,
  n: number,
  total: number,
  ofPattern = 'Page {n} of {total}'
): string {
  if (style === 'of') {
    return ofPattern.split('{n}').join(String(n)).split('{total}').join(String(total));
  }
  return String(n);
}

export function pageBreakBackground(size: PageSize): string {
  const h = pageHeightMm(size);
  return `repeating-linear-gradient(to bottom, #ffffff 0, #ffffff calc(${h}mm - 1px), #94a3b8 calc(${h}mm - 1px), #94a3b8 ${h}mm)`;
}

/** Air at the top and bottom of every page, so a heading does not sit on the edge. */
const PAGE_EDGE_FLOOR_MM = 12;

export function pageEdgeMm(marginMm: number): number {
  const n = Number(marginMm);
  if (!Number.isFinite(n)) return PAGE_EDGE_FLOOR_MM;
  return Math.max(PAGE_EDGE_FLOOR_MM, n);
}

/**
 * How far to push a block so it stays inside the safe area of one page.
 * A block taller than that area is left alone, because it has to cross a page.
 * Distances are in the same unit (layout pixels).
 */
export function shiftForPageEdge(
  top: number,
  height: number,
  pageHeight: number,
  edgeTop: number,
  edgeBottom: number
): number {
  if (pageHeight <= edgeTop + edgeBottom || height <= 0) return 0;
  const page = Math.floor(Math.max(0, top) / pageHeight);
  const pageStart = page * pageHeight;
  const pageEnd = pageStart + pageHeight;
  const safeTop = pageStart + edgeTop;
  const safeBottom = pageEnd - edgeBottom;
  const room = safeBottom - safeTop;
  if (top < safeTop - 0.5) return safeTop - top;
  if (height <= room && top + height > safeBottom + 0.5) return pageEnd + edgeTop - top;
  return 0;
}

function fontStack(family: string): string {
  if (family === 'Noto Sans Telugu') return '"Noto Sans Telugu", sans-serif';
  if (family === 'Times New Roman') return '"Times New Roman", Times, serif';
  if (family === 'Calibri') return 'Calibri, "Segoe UI", sans-serif';
  if (family === 'Arial') return 'Arial, Helvetica, sans-serif';
  return 'Helvetica, Arial, sans-serif';
}

export function styleCssVars(style: DocumentStyle): Record<string, string> {
  return {
    '--dpr-cover-font': fontStack(style.cover.family),
    '--dpr-cover-size': `${style.cover.size}pt`,
    '--dpr-cover-weight': String(style.cover.weight),
    '--dpr-title-font': fontStack(style.sectionTitle.family),
    '--dpr-title-size': `${style.sectionTitle.size}pt`,
    '--dpr-title-weight': String(style.sectionTitle.weight),
    '--dpr-body-font': fontStack(style.body.family),
    '--dpr-body-size': `${style.body.size}pt`,
    '--dpr-body-weight': String(style.body.weight),
    '--dpr-table-font': fontStack(style.table.family),
    '--dpr-table-size': `${style.table.size}pt`,
    '--dpr-caption-font': fontStack(style.caption.family),
    '--dpr-caption-size': `${style.caption.size}pt`,
    '--dpr-caption-weight': String(style.caption.weight),
    '--dpr-line': String(style.lineHeight),
    '--dpr-para-gap': `${style.paragraphGap}pt`,
    '--dpr-align': style.align,
    '--dpr-primary': style.colors.primary,
    '--dpr-header': style.colors.header,
    '--dpr-table': style.colors.table,
    '--dpr-border': style.colors.border,
    '--dpr-wm-opacity': String(style.watermarkOpacity),
    '--dpr-wm-angle': `${style.watermarkAngle}deg`,
    background: 'transparent',
    padding: `${style.marginMm.top}mm ${style.marginMm.right}mm ${style.marginMm.bottom}mm ${style.marginMm.left}mm`,
  };
}

interface StyleProblem {
  key: string;
  message: string;
}

export function styleProblems(
  style: DocumentStyle,
  opts: { telugu: boolean; wideTable: boolean }
): StyleProblem[] {
  const problems: StyleProblem[] = [];
  (['top', 'right', 'bottom', 'left'] as const).forEach((side) => {
    const value = style.marginMm[side];
    if (value < MARGIN_MIN || value > MARGIN_MAX) {
      problems.push({ key: `margin-${side}`, message: 'Keep this margin between 10 and 40 mm.' });
    }
  });
  if (!contrastOk(style.colors.primary, '#ffffff')) {
    problems.push({ key: 'primary', message: 'Primary color is too light to read on the page.' });
  }
  if (!contrastOk(style.colors.header, '#ffffff')) {
    problems.push({ key: 'header', message: 'Header color is too light to read on the page.' });
  }
  if (!contrastOk('#ffffff', style.colors.table)) {
    problems.push({ key: 'table', message: 'Table header text would disappear on this color.' });
  }
  if (!contrastOk(style.colors.border, '#ffffff')) {
    problems.push({ key: 'border', message: 'Border color is too light to see.' });
  }
  if (opts.telugu && style.body.family !== 'Noto Sans Telugu') {
    problems.push({ key: 'body-font', message: 'Telugu needs Noto Sans Telugu on body text.' });
  }
  if (opts.wideTable && !style.wideTablesLandscape) {
    problems.push({
      key: 'wide',
      message: 'A wide money table does not fit this page. Turn on landscape for money tables.',
    });
  }
  return problems;
}
