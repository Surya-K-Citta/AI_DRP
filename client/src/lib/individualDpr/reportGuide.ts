import {
  defaultStyleForScheme,
  presetStyle,
  type DocPresetId,
  type DocumentStyle,
  type FontChoice,
  type PageSize,
  type TypeRole,
} from './documentStyle.ts';

export const GUIDE_LOOKS = ['match', 'government', 'bank', 'pmegp', 'apCmep', 'formal', 'minimal'] as const;
export type GuideLook = (typeof GUIDE_LOOKS)[number];

export const GUIDE_FONTS = ['preset', 'Times New Roman', 'Arial', 'Calibri', 'Helvetica', 'Noto Sans Telugu'] as const;
export type GuideFont = (typeof GUIDE_FONTS)[number];

export const GUIDE_ALIGNS = ['preset', 'left', 'justify'] as const;
export type GuideAlign = (typeof GUIDE_ALIGNS)[number];

export const GUIDE_COLOR_SETS = ['preset', 'navy', 'ink', 'teal', 'indigo', 'stone', 'grey'] as const;
export type GuideColorSet = (typeof GUIDE_COLOR_SETS)[number];

export const GUIDE_PAGES = ['A4', 'A3', 'Letter', 'Legal'] as const;

const STANDARD_WATERMARK = 'Confidential — for lending appraisal';

const COLOR_VALUES: Record<Exclude<GuideColorSet, 'preset'>, DocumentStyle['colors']> = {
  navy: presetStyle('government').colors,
  ink: presetStyle('bank').colors,
  teal: presetStyle('pmegp').colors,
  indigo: presetStyle('apCmep').colors,
  stone: presetStyle('formal').colors,
  grey: presetStyle('minimal').colors,
};

export type ReportGuideChoices = {
  look: GuideLook;
  pageSize: PageSize;
  wideTablesLandscape: boolean;
  font: GuideFont;
  align: GuideAlign;
  colors: GuideColorSet;
  tableStriped: boolean;
  logoAlign: 'left' | 'center' | 'right';
  agencyName: string;
  pageNumberStyle: 'plain' | 'of';
  watermarkOn: boolean;
};

export function defaultGuideChoices(): ReportGuideChoices {
  return {
    look: 'match',
    pageSize: 'A4',
    wideTablesLandscape: false,
    font: 'preset',
    align: 'preset',
    colors: 'preset',
    tableStriped: true,
    logoAlign: 'left',
    agencyName: '',
    pageNumberStyle: 'of',
    watermarkOn: true,
  };
}

function withFamily(style: DocumentStyle, family: FontChoice): DocumentStyle {
  const paint = (role: TypeRole): TypeRole => ({ ...role, family });
  return {
    ...style,
    cover: paint(style.cover),
    sectionTitle: paint(style.sectionTitle),
    body: paint(style.body),
    table: paint(style.table),
    caption: paint(style.caption),
  };
}

/** Turn the five guide choices into the style the Create DPR page opens with. */
export function styleFromGuide(
  choices: ReportGuideChoices,
  schemeCode?: string | null,
  savedSchemeStyle?: DocumentStyle | null
): DocumentStyle {
  const base =
    choices.look === 'match'
      ? savedSchemeStyle || defaultStyleForScheme(schemeCode)
      : presetStyle(choices.look as DocPresetId);

  let next: DocumentStyle = {
    ...base,
    pageSize: choices.pageSize,
    wideTablesLandscape: choices.wideTablesLandscape,
    tableStriped: choices.tableStriped,
    logoAlign: choices.logoAlign,
    logoDataUrl: '',
    agencyName: choices.agencyName.trim().slice(0, 160),
    pageNumberStyle: choices.pageNumberStyle,
    watermark: choices.watermarkOn ? base.watermark || STANDARD_WATERMARK : '',
  };

  if (choices.font !== 'preset') next = withFamily(next, choices.font);
  if (choices.align !== 'preset') next = { ...next, align: choices.align };
  if (choices.colors !== 'preset') next = { ...next, colors: { ...COLOR_VALUES[choices.colors] } };
  return next;
}

/** First place in the sample report that a guide click changes. */
export function guideFocusSpot(change: Partial<ReportGuideChoices>): string {
  if ('watermarkOn' in change) return change.watermarkOn ? 'watermark' : 'page';
  if ('pageNumberStyle' in change) return 'page-number';
  if ('logoAlign' in change || 'agencyName' in change) return 'header';
  if ('tableStriped' in change) return 'table';
  if ('colors' in change) return 'header';
  if ('align' in change) return 'body';
  if ('font' in change || 'look' in change) return 'cover';
  if ('wideTablesLandscape' in change) return 'money';
  if ('pageSize' in change) return 'page';
  return 'cover';
}

/** Spot to show when a step opens, before a click on that step. */
export const GUIDE_STEP_SPOTS = ['cover', 'page', 'cover', 'header', 'header'] as const;

/** If the first spot is missing, try the next. Never walk every match. */
export function guideSpotFallbacks(spot: string): string[] {
  if (spot === 'header') return ['header', 'cover'];
  if (spot === 'money') return ['money', 'table'];
  if (spot === 'watermark') return ['watermark', 'page'];
  if (spot === 'table') return ['table', 'money'];
  return [spot];
}
