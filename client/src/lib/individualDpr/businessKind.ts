/**
 * What kind of business a draft is (making things, a service, or buying and selling) and how big it is.
 * The form uses this to show a plant and machinery table for manufacturing and an asset list for services.
 */
type AnyData = Record<string, any>;

export type BusinessKind = 'manufacturing' | 'service' | 'trading';
type Scale = 'tiny' | 'small' | 'medium' | 'large' | 'unknown';

const KIND_BY_ACTIVITY: Record<string, BusinessKind> = {
  mfg: 'manufacturing',
  food: 'manufacturing',
  craft: 'manufacturing',
  mixed: 'manufacturing',
  crop: 'manufacturing',
  service: 'service',
  knowledge: 'service',
  trade: 'trading',
  vending: 'trading',
};

const SERVICE_WORDS = /\b(salon|parlou?r|repair|servicing|laundry|training|tuition|coaching|transport|taxi|travel|tour|software|clinic|hospital|diagnostic|photograph|studio|cyber|internet|courier|event|hotel|lodge|beauty|spa|gym|school|consult|accounting|printing service|cab)\b/i;
const TRADING_WORDS = /\b(shop|store|trading|trader|retail|wholesale|kirana|stationery|dealer|vendor|hawker|supermarket|distribut)\b/i;
const MAKING_WORDS = /\b(making|manufactur|produc|processing|mill|weav|stitch|bak(e|ery)|pickle|powder|oil|brick|furniture|fabricat|welding|machine|assembl|packag)/i;

/** The kind the person chose, else the scheme-finder answer, else a guess from what they wrote, else manufacturing. */
export function detectKind(data: AnyData | null | undefined): { kind: BusinessKind; source: 'chosen' | 'scheme-finder' | 'guessed' | 'default' } {
  const d = data || {};
  const chosen = d.schemeExtras?.businessKind;
  if (chosen === 'manufacturing' || chosen === 'service' || chosen === 'trading') return { kind: chosen, source: 'chosen' };
  const fromActivity = KIND_BY_ACTIVITY[String(d.ventureMatchAnswers?.activity || '')];
  if (fromActivity) return { kind: fromActivity, source: 'scheme-finder' };
  const written = `${d.step1?.natureOfBusiness || ''} ${d.step1?.majorProducts || ''}`.trim();
  if (written) {
    if (SERVICE_WORDS.test(written) && !MAKING_WORDS.test(written)) return { kind: 'service', source: 'guessed' };
    if (TRADING_WORDS.test(written) && !MAKING_WORDS.test(written)) return { kind: 'trading', source: 'guessed' };
    if (MAKING_WORDS.test(written)) return { kind: 'manufacturing', source: 'guessed' };
  }
  return { kind: 'manufacturing', source: 'default' };
}

export const businessKind = (data: AnyData | null | undefined): BusinessKind => detectKind(data).kind;

/** Size from the project cost once entered (lakhs), otherwise from the budget chosen in the scheme finder. */
export function scaleOf(data: AnyData | null | undefined, projectCostLakhs = 0): Scale {
  if (projectCostLakhs > 0) {
    return projectCostLakhs < 5 ? 'tiny' : projectCostLakhs < 50 ? 'small' : projectCostLakhs < 200 ? 'medium' : 'large';
  }
  switch (data?.ventureMatchAnswers?.budget) {
    case 'under2L':
    case '2to5L':
      return 'tiny';
    case '5to10L':
    case '10to20L':
    case '20to50L':
      return 'small';
    case '50Lto1Cr':
      return 'medium';
    case '1to10Cr':
    case 'above10Cr':
      return 'large';
    default:
      return 'unknown';
  }
}

const SERVICE_LABELS: Record<string, string> = {
  'Plant & machinery (₹ Lakhs)': 'Equipment & assets (₹ Lakhs)',
  'Machinery / equipment (₹ Lakhs)': 'Equipment & assets (₹ Lakhs)',
  'Machinery list': 'Assets list',
  'Raw Material Cost (₹ Lakhs)': 'Materials & supplies (₹ Lakhs)',
  'Annual Production Volume': 'Annual service volume (jobs or customers)',
  'Manufacturing Process': 'How the service is delivered',
};
const TRADING_LABELS: Record<string, string> = {
  ...SERVICE_LABELS,
  'Raw Material Cost (₹ Lakhs)': 'Cost of goods bought for resale (₹ Lakhs)',
  'Annual Production Volume': 'Annual sales volume (units)',
  'Manufacturing Process': 'How you buy and sell',
};

/** The label to show for this kind of business. Manufacturing keeps the original wording. */
export function kindLabel(label: string, kind: BusinessKind): string {
  if (kind === 'service') return SERVICE_LABELS[label] ?? label;
  if (kind === 'trading') return TRADING_LABELS[label] ?? label;
  return label;
}

export const ASSET_CATEGORIES = ['Equipment & tools', 'Furniture & fixtures', 'Vehicle', 'Computers & software', 'Other'] as const;

export type AssetItem = { item: string; category: string; quantity: number; unitCost: number };

const toNum = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export function normalizeAssetItems(raw: unknown): AssetItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row: any) => ({
    item: typeof row?.item === 'string' ? row.item : '',
    category: ASSET_CATEGORIES.includes(row?.category) ? row.category : 'Equipment & tools',
    quantity: toNum(row?.quantity) || 1,
    unitCost: toNum(row?.unitCost),
  }));
}

/** Total of the asset list in lakhs. */
export function assetTotalLakhs(items: AssetItem[]): number {
  return Math.round(items.reduce((sum, row) => sum + row.quantity * row.unitCost, 0) * 100) / 100;
}
