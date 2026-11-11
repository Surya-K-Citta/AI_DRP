export type CmepLineKey =
  | 'sales'
  | 'rm'
  | 'wages'
  | 'power'
  | 'salaries'
  | 'rent'
  | 'maintenance'
  | 'admin'
  | 'interest'
  | 'depreciation'
  | 'tax'
  | 'netProfit';

export const CMEP_LINE_ITEMS: { key: CmepLineKey; label: string }[] = [
  { key: 'sales', label: 'Sales realisation' },
  { key: 'rm', label: 'Raw material' },
  { key: 'wages', label: 'Wages' },
  { key: 'power', label: 'Power' },
  { key: 'salaries', label: 'Salaries' },
  { key: 'rent', label: 'Rent' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'admin', label: 'Administrative expenses' },
  { key: 'interest', label: 'Interest' },
  { key: 'depreciation', label: 'Depreciation' },
  { key: 'tax', label: 'Income tax' },
  { key: 'netProfit', label: 'Net profit' },
];

const CMEP_PROJECTED_YEARS = 8;

export type CmepYearColumn = {
  label: string;
  period: 'previous' | 'projected';
} & Record<CmepLineKey, number>;

function fyLabel(startYear: number): string {
  return `${startYear}-${startYear + 1}`;
}

function blankColumn(label: string, period: CmepYearColumn['period']): CmepYearColumn {
  const column = { label, period } as CmepYearColumn;
  for (const line of CMEP_LINE_ITEMS) column[line.key] = 0;
  return column;
}

/** Three completed financial years, then eight years from the current FY (April–March). */
export function cmepProjectionColumns(now = new Date()): CmepYearColumn[] {
  const month = now.getMonth();
  const year = now.getFullYear();
  const currentFyStart = month >= 3 ? year : year - 1;
  const cols: CmepYearColumn[] = [];
  for (let i = 3; i >= 1; i -= 1) {
    cols.push(blankColumn(fyLabel(currentFyStart - i), 'previous'));
  }
  for (let i = 0; i < CMEP_PROJECTED_YEARS; i += 1) {
    cols.push(blankColumn(fyLabel(currentFyStart + i), 'projected'));
  }
  return cols;
}

function asNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(n) ? n : 0;
}

function coerceColumn(raw: Record<string, unknown>, fallback: CmepYearColumn): CmepYearColumn {
  const period = raw.period === 'previous' || raw.period === 'projected' ? raw.period : fallback.period;
  const column: CmepYearColumn = {
    label: String(raw.label || fallback.label),
    period,
    sales: 0,
    rm: 0,
    wages: 0,
    power: 0,
    salaries: 0,
    rent: 0,
    maintenance: 0,
    admin: 0,
    interest: 0,
    depreciation: 0,
    tax: 0,
    netProfit: 0,
  };
  for (const line of CMEP_LINE_ITEMS) column[line.key] = asNumber(raw[line.key]);
  return column;
}

function isSavedColumn(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.label === 'string' && (row.period === 'previous' || row.period === 'projected');
}

/** Keeps a saved CMEP grid. Maps an older Year-1…5 list onto the projected columns. */
export function normalizeCmepProjections(raw: unknown, now = new Date()): CmepYearColumn[] {
  const defaults = cmepProjectionColumns(now);
  if (!Array.isArray(raw) || raw.length === 0) return defaults;

  if (raw.every(isSavedColumn)) {
    const byLabel = new Map(raw.map((row) => [String(row.label), row]));
    return defaults.map((col) => {
      const saved = byLabel.get(col.label);
      return saved ? coerceColumn(saved, col) : col;
    });
  }

  const legacy = raw.filter((row) => row && typeof row === 'object' && 'year' in (row as object));
  if (!legacy.length) return defaults;
  const projected = defaults.filter((col) => col.period === 'projected');
  legacy.forEach((row, index) => {
    const target = projected[index];
    if (!target) return;
    const source = row as Record<string, unknown>;
    for (const line of CMEP_LINE_ITEMS) target[line.key] = asNumber(source[line.key]);
  });
  return defaults;
}

/** Put a Year-1…5 suggestion onto the projected columns and keep previous-year actuals. */
export function mergeCmepProjectedSuggestion(existing: unknown, suggestion: unknown): CmepYearColumn[] {
  const columns = normalizeCmepProjections(existing);
  const incoming = normalizeCmepProjections(suggestion);
  const projectedIncoming = incoming.filter((col) => col.period === 'projected');
  const legacy = Array.isArray(suggestion) ? suggestion : [];
  const source = projectedIncoming.some((col) => col.sales || col.rm || col.wages || col.power || col.netProfit)
    ? projectedIncoming
    : legacy;
  let slot = 0;
  return columns.map((col) => {
    if (col.period !== 'projected') return col;
    const row = source[slot];
    slot += 1;
    if (!row || typeof row !== 'object') return col;
    const item = row as Record<string, unknown>;
    const next = { ...col };
    for (const line of CMEP_LINE_ITEMS) next[line.key] = asNumber(item[line.key]);
    return next;
  });
}

export function cmepProjectionsHaveFigures(columns: CmepYearColumn[]): boolean {
  return columns.some((col) =>
    CMEP_LINE_ITEMS.some((line) => col[line.key] !== 0)
  );
}
