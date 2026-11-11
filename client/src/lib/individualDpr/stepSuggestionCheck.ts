/** Write-ups that ask for a few hundred words. Everything else on a step shares one call. */
const LONG_PROSE_FIELDS = [
  'executiveSummary',
  'processOfManufacture',
  'sectorDescription',
  'presentActivities',
  'targetMarket',
  'existingDemand',
  'geography',
  'landDetails',
  'impactNote',
  'waterAndEffluent',
] as const;

const LONG_PROSE = new Set<string>(LONG_PROSE_FIELDS);

const MONEY_KEYS = [
  'land',
  'building',
  'machinery',
  'utilitiesAndInfrastructure',
  'preliminaryAndPreOperative',
  'workingCapitalMargin',
  'workingCapital',
  'furniture',
  'securityDeposits',
  'spvContribution',
  'governmentGrant',
  'bankLoan',
  'otherSources',
  'rawMaterialCost',
  'powerCost',
  'wages',
  'maintenance',
  'administrativeExpenses',
  'marketingExpenses',
  'annualSalesRealization',
  'unitCost',
  'gst',
  'transport',
  'installation',
  'annualMaintenance',
  'cashCreditLimit',
  'sellingPrice',
  'investmentPerUnit',
  'turnoverPerUnit',
];

export type FactsCard = {
  unitName: string;
  district: string;
  location: string;
  products: string;
  amounts: Record<string, number>;
};

export type SuggestionKind = 'cost' | 'number' | 'date' | 'json-list' | 'json-object' | 'prose' | 'text';

function reasonableDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return false;
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  if (`${year}-${month}-${day}` !== value) return false;
  return year >= 1990 && year <= 2100;
}

/** A bare year such as 2019 becomes 2019-01-01 so a date box can show it. */
export function yearToIsoDate(raw: string): string {
  const match = String(raw ?? '').trim().match(/\b((?:19|20)\d{2})\b/);
  if (!match) return '';
  const iso = `${match[1]}-01-01`;
  return reasonableDate(iso) ? iso : '';
}

function groundMoney(raw: string, facts: FactsCard): string {
  if (Object.keys(facts.amounts).length > 0) return raw;
  return '0';
}

export function isLongProseField(field: string): boolean {
  return LONG_PROSE.has(field);
}

/** Blank strings, empty lists, and untouched zeros count as not filled. */
export function fieldIsFilled(value: unknown): boolean {
  if (value == null || value === '') return false;
  if (typeof value === 'number') return Number.isFinite(value) && value !== 0;
  if (typeof value === 'string') return value.trim().length > 0 && value.trim() !== '0';
  if (Array.isArray(value)) return value.some((item) => fieldIsFilled(item));
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).some((item) => fieldIsFilled(item));
  return false;
}

export function splitUnfilledFields<T extends { name: string }>(fields: T[], stepData: Record<string, unknown>) {
  const unfilled = fields.filter((field) => !fieldIsFilled(stepData?.[field.name]));
  return {
    short: unfilled.filter((field) => !LONG_PROSE.has(field.name)),
    long: unfilled.filter((field) => LONG_PROSE.has(field.name)),
  };
}

export function buildFactsCard(previous: unknown): FactsCard {
  const card: FactsCard = { unitName: '', district: '', location: '', products: '', amounts: {} };
  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    const record = node as Record<string, unknown>;
    if (!card.unitName && typeof record.unitName === 'string') card.unitName = record.unitName.trim();
    if (!card.district && typeof record.district === 'string') card.district = record.district.trim();
    if (!card.location && typeof record.location === 'string') card.location = record.location.trim();
    if (!card.products && typeof record.majorProducts === 'string') card.products = record.majorProducts.trim();
    for (const key of MONEY_KEYS) {
      const amount = Number(record[key]);
      if (Number.isFinite(amount) && amount !== 0 && card.amounts[key] == null) card.amounts[key] = amount;
    }
    for (const value of Object.values(record)) {
      if (value && typeof value === 'object') visit(value);
    }
  };
  visit(previous);
  return card;
}

/** A figure is kept when it stays within five times the amounts already entered. With no amounts, only 0 is kept. */
export function costFigureFits(value: number, amounts: Record<string, number>): boolean {
  if (!Number.isFinite(value) || value < 0) return false;
  const stated = Object.values(amounts).filter((amount) => Number.isFinite(amount) && amount > 0);
  if (!stated.length) return value === 0;
  const ceiling = Math.max(...stated, stated.reduce((sum, amount) => sum + amount, 0)) * 5;
  return value <= ceiling;
}

export function acceptByKind(kind: SuggestionKind, raw: string, facts: FactsCard): string | null {
  const text = String(raw ?? '').trim();
  if (!text) return null;
  if (kind === 'prose') {
    const words = text.split(/\s+/).filter(Boolean);
    return words.length >= 40 ? text : null;
  }
  if (kind === 'text') return text;
  if (kind === 'date') return reasonableDate(text) ? text : null;
  if (kind === 'number' || kind === 'cost') {
    const grounded = kind === 'cost' ? groundMoney(text, facts) : text;
    const value = Number(String(grounded).replace(/,/g, ''));
    if (!Number.isFinite(value)) return null;
    if (kind === 'cost' && !costFigureFits(value, facts.amounts)) return null;
    return String(value);
  }
  try {
    const parsed = JSON.parse(text);
    if (kind === 'json-list') return Array.isArray(parsed) && parsed.length > 0 ? text : null;
    if (kind === 'json-object' && parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return costFigureFits(sumNumbers(parsed), facts.amounts) ? text : null;
    }
  } catch {
    return null;
  }
  return null;
}

function sumNumbers(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.abs(value) : 0;
  if (!value || typeof value !== 'object') return 0;
  return Object.values(value as Record<string, unknown>).reduce<number>((sum, item) => sum + sumNumbers(item), 0);
}

/** Line-item machinery costs follow the same ceiling as the other rupee fields. */
export function machineryCostsFit(rows: unknown, facts: FactsCard): boolean {
  if (!Array.isArray(rows) || rows.length === 0) return false;
  let sum = 0;
  for (const row of rows) {
    if (!row || typeof row !== 'object') return false;
    const record = row as Record<string, unknown>;
    const quantity = Number(record.quantity ?? 1);
    const unitCost = Number(record.unitCost ?? 0);
    if (!Number.isFinite(unitCost) || unitCost < 0) return false;
    sum += unitCost * (Number.isFinite(quantity) && quantity > 0 ? quantity : 1);
  }
  return costFigureFits(sum, facts.amounts);
}
