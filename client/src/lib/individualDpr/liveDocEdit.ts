import { getUnitName, withSyncedUnitName } from './toIndividualPayload.ts';
import { isTownInDistrict } from './apDistricts.ts';

const TABLE_NUMBERS = new Set([
  'sharePercent',
  'sellingPrice',
  'count',
  'monthlyPay',
  'percent',
  'quantity',
  'unitCost',
  'gst',
  'transport',
  'installation',
  'lifeYears',
  'annualMaintenance',
  'sales',
  'rm',
  'wages',
  'power',
  'netProfit',
  'year',
  'age',
  'experienceYears',
  'yearOfEstablishment',
  'yearOfIncorporation',
]);

function numericName(name: string): boolean {
  return TABLE_NUMBERS.has(name) || /(cost|lakhs|percent|amount|qty|quantity|count|rate|emi|sales|profit|wage|price|margin)$/i.test(name);
}

export function storedValueFromDocText(name: string, text: string, previous: unknown): unknown {
  const trimmed = text.replace(/\u00a0/g, ' ').trim();
  if (!trimmed || trimmed === '—' || trimmed === 'UNIT NAME') return '';
  if (/^yes$/i.test(trimmed)) return 'yes';
  if (/^no$/i.test(trimmed)) return 'no';
  if (typeof previous === 'boolean') return /^(yes|true)$/i.test(trimmed);
  const numeric = typeof previous === 'number' || numericName(name);
  if (numeric) {
    if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return trimmed;
    return Number(trimmed);
  }
  return trimmed;
}

function unchanged(previous: unknown, next: unknown): boolean {
  if (previous == null || previous === '') return next === '' || next == null;
  return String(previous) === String(next);
}

/** Turn a typed live-document value into a store patch. */
export function patchFromDocEdit(
  data: Record<string, any>,
  path: string,
  text: string
): { step?: number; stepData?: Record<string, any>; extras?: Record<string, any> } | null {
  const indexed = path.match(/^step(\d+)\.([A-Za-z0-9_]+)\[(\d+)\]\.([A-Za-z0-9_]+)$/);
  if (indexed) {
    const step = Number(indexed[1]);
    const field = indexed[2];
    const index = Number(indexed[3]);
    const key = indexed[4];
    const stepData = { ...(data[`step${step}`] || {}) };
    const list = Array.isArray(stepData[field]) ? stepData[field].map((row: any) => ({ ...(row || {}) })) : [];
    while (list.length <= index) list.push({});
    const previous = list[index]?.[key];
    const next = storedValueFromDocText(key, text, previous);
    if (unchanged(previous, next)) return null;
    list[index] = { ...list[index], [key]: next };
    stepData[field] = list;
    return { step, stepData };
  }

  const extra = path.match(/^schemeExtras\.([A-Za-z0-9_]+)$/);
  if (extra) {
    const name = extra[1];
    const extras = { ...(data.schemeExtras || {}) };
    const previous = extras[name];
    const next = storedValueFromDocText(name, text, previous);
    if (unchanged(previous, next)) return null;
    extras[name] = next;
    return { extras };
  }

  const stepMatch = path.match(/^step(\d+)\.([A-Za-z0-9_]+)$/);
  if (!stepMatch) return null;
  const step = Number(stepMatch[1]);
  const name = stepMatch[2];
  const current = { ...(data[`step${step}`] || {}) };
  const previous = name === 'unitName' || name === 'clusterName' ? getUnitName(current) : current[name];
  const next = storedValueFromDocText(name, text, previous);
  if (unchanged(previous, next)) return null;
  if (name === 'unitName' || name === 'clusterName') {
    return { step, stepData: withSyncedUnitName(current, String(next ?? '')) };
  }
  current[name] = next;
  if (step === 1 && name === 'district' && !isTownInDistrict(String(next ?? ''), current.location)) {
    current.location = '';
  }
  return { step, stepData: current };
}
