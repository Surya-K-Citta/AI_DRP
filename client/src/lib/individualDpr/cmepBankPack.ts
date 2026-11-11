import { type CmepYearColumn, normalizeCmepProjections } from '@/lib/individualDpr/cmepProjections';

export type CmepPromoter = {
  name: string;
  relationName: string;
  age: string;
  dob: string;
  education: string;
  experienceYears: string;
  phone: string;
  address: string;
};

export type CmepMachineryItem = {
  description: string;
  condition: 'new' | 'used' | '';
  supplier: string;
  quantity: number;
  unitCost: number;
  gst: number;
  transport: number;
  installation: number;
  lifeYears: number;
  annualMaintenance: number;
};

export type ProductMixRow = { name: string; sharePercent: number; sellingPrice: number };
export type RawMaterialRow = { name: string; use: string; basis: string };
export type StaffRoleRow = { role: string; count: number; monthlyPay: number };
export type RiskRow = { risk: string; mitigation: string };
type UtilisationYear = { label: string; percent: number };

export type CmepCostCell = { incurred: number; proposed: number };

export const CMEP_COST_HEADS: { key: string; totalField: string; label: string }[] = [
  { key: 'land', totalField: 'land', label: 'Land' },
  { key: 'building', totalField: 'building', label: 'Building / shed' },
  { key: 'machinery', totalField: 'machinery', label: 'Machinery / equipment' },
  { key: 'furniture', totalField: 'furniture', label: 'Furniture and fixtures' },
  { key: 'deposits', totalField: 'securityDeposits', label: 'Security deposits' },
  { key: 'workingCapital', totalField: 'workingCapitalMargin', label: 'Working capital' },
];

const PROMOTER_KEYS: (keyof CmepPromoter)[] = [
  'name',
  'relationName',
  'age',
  'dob',
  'education',
  'experienceYears',
  'phone',
  'address',
];

function num(value: unknown): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(n) ? n : 0;
}

function blankPromoter(): CmepPromoter {
  return {
    name: '',
    relationName: '',
    age: '',
    dob: '',
    education: '',
    experienceYears: '',
    phone: '',
    address: '',
  };
}

export function normalizePromoters(raw: unknown): CmepPromoter[] {
  if (!Array.isArray(raw)) return [blankPromoter()];
  const rows = raw
    .filter((row) => row && typeof row === 'object')
    .map((row) => {
      const item = row as Record<string, unknown>;
      const next = blankPromoter();
      for (const key of PROMOTER_KEYS) next[key] = String(item[key] ?? '');
      return next;
    });
  return rows.length ? rows : [blankPromoter()];
}

export function normalizeMachineryItems(raw: unknown): CmepMachineryItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((row) => row && typeof row === 'object')
    .map((row) => {
      const item = row as Record<string, unknown>;
      const condition = item.condition === 'used' ? 'used' : item.condition === 'new' ? 'new' : '';
      return {
        description: String(item.description ?? ''),
        condition,
        supplier: String(item.supplier ?? ''),
        quantity: num(item.quantity) || 1,
        unitCost: num(item.unitCost),
        gst: num(item.gst),
        transport: num(item.transport),
        installation: num(item.installation),
        lifeYears: num(item.lifeYears),
        annualMaintenance: num(item.annualMaintenance),
      };
    });
}

export function normalizeCostPhasing(raw: unknown, step?: Record<string, unknown> | null): Record<string, CmepCostCell> {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const out: Record<string, CmepCostCell> = {};
  for (const head of CMEP_COST_HEADS) {
    const cell = source[head.key];
    const saved = cell && typeof cell === 'object' ? (cell as Record<string, unknown>) : null;
    const total = num(step?.[head.totalField]);
    out[head.key] = saved
      ? { incurred: num(saved.incurred), proposed: num(saved.proposed) }
      : { incurred: 0, proposed: total };
  }
  return out;
}

export function machineryTotalLakhs(items: CmepMachineryItem[], includeCharges: boolean): number {
  return items.reduce((sum, row) => {
    const charges = includeCharges ? row.gst + row.transport + row.installation : 0;
    return sum + (row.quantity || 0) * ((row.unitCost || 0) + charges);
  }, 0);
}

export function workingCapitalFromBuildup(step: Record<string, unknown>): number {
  return (
    num(step.wcRawStock) +
    num(step.wcWip) +
    num(step.wcFinished) +
    num(step.wcReceivables) +
    num(step.wcCash) -
    num(step.wcSupplierCredit)
  );
}

function textRows<T>(raw: unknown, blank: () => T, fill: (row: T, item: Record<string, unknown>) => T): T[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((row) => row && typeof row === 'object')
    .map((row) => fill(blank(), row as Record<string, unknown>));
}

export function normalizeProductMix(raw: unknown): ProductMixRow[] {
  return textRows(raw, () => ({ name: '', sharePercent: 0, sellingPrice: 0 }), (_row, item) => ({
    name: String(item.name ?? ''),
    sharePercent: num(item.sharePercent),
    sellingPrice: num(item.sellingPrice),
  }));
}

export function normalizeRawMaterials(raw: unknown): RawMaterialRow[] {
  return textRows(raw, () => ({ name: '', use: '', basis: '' }), (_row, item) => ({
    name: String(item.name ?? item.material ?? ''),
    use: String(item.use ?? ''),
    basis: String(item.basis ?? ''),
  }));
}

export function normalizeStaffRoles(raw: unknown): StaffRoleRow[] {
  return textRows(raw, () => ({ role: '', count: 0, monthlyPay: 0 }), (_row, item) => ({
    role: String(item.role ?? ''),
    count: num(item.count),
    monthlyPay: num(item.monthlyPay),
  }));
}

export function normalizeRisks(raw: unknown): RiskRow[] {
  return textRows(raw, () => ({ risk: '', mitigation: '' }), (_row, item) => ({
    risk: String(item.risk ?? ''),
    mitigation: String(item.mitigation ?? ''),
  }));
}

export function normalizeUtilisationYears(raw: unknown): UtilisationYear[] {
  return textRows(raw, () => ({ label: '', percent: 0 }), (_row, item) => ({
    label: String(item.label ?? ''),
    percent: num(item.percent),
  }));
}

export function totalsFromCostPhasing(phasing: Record<string, CmepCostCell>): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const head of CMEP_COST_HEADS) {
    const cell = phasing[head.key] || { incurred: 0, proposed: 0 };
    totals[head.totalField] = num(cell.incurred) + num(cell.proposed);
  }
  return totals;
}

type CmepDerived = {
  depreciation: Array<{ asset: string; rate: number; years: Array<{ label: string; opening: number; additions: number; depreciation: number; closing: number }> }>;
  dscr: Array<{ label: string; cashProfit: number; repayment: number; ratio: number }>;
  averageDscr: number;
  breakEvenSales: number;
  breakEvenCapacity: number;
  repayment: { amount: number; rate: number; moratoriumMonths: number; tenureMonths: number; emi: number };
};

function wdvSchedule(label: string, rate: number, addition: number, years: string[]) {
  let opening = 0;
  return {
    asset: label,
    rate,
    years: years.map((yearLabel, index) => {
      const additions = index === 0 ? addition : 0;
      const base = opening + additions;
      const depreciation = Math.round(base * rate * 100) / 100;
      const closing = Math.round((base - depreciation) * 100) / 100;
      const row = { label: yearLabel, opening, additions, depreciation, closing };
      opening = closing;
      return row;
    }),
  };
}

export function deriveCmepBankSheets(input: {
  step12?: Record<string, unknown> | null;
  step13?: Record<string, unknown> | null;
  step15?: Record<string, unknown> | null;
}): CmepDerived {
  const step12 = input.step12 || {};
  const step13 = input.step13 || {};
  const columns = normalizeCmepProjections(input.step15?.yearProjections);
  const projected = columns.filter((col) => col.period === 'projected');
  const yearLabels = projected.map((col) => col.label);
  const phasing = normalizeCostPhasing(step12.costPhasing, step12);
  const assetTotal = (key: string) => {
    const cell = phasing[key];
    return cell ? cell.incurred + cell.proposed : 0;
  };
  const depreciation = [
    wdvSchedule('Machinery', 0.15, assetTotal('machinery'), yearLabels),
    wdvSchedule('Building', 0.1, assetTotal('building'), yearLabels),
    wdvSchedule('Furniture and fixtures', 0.1, assetTotal('furniture'), yearLabels),
  ];
  const loan = num(step13.bankLoan);
  const annualRate = num(step13.interestRate) > 0 ? num(step13.interestRate) / 100 : 0.12;
  const tenureMonths = num(step13.loanTenureMonths) > 0 ? num(step13.loanTenureMonths) : 84;
  const moratoriumMonths = num(step13.moratoriumMonths);
  const payMonths = Math.max(1, tenureMonths - moratoriumMonths);
  const monthlyRate = annualRate / 12;
  const emi =
    loan > 0 && monthlyRate > 0
      ? (loan * monthlyRate * Math.pow(1 + monthlyRate, payMonths)) / (Math.pow(1 + monthlyRate, payMonths) - 1)
      : loan > 0
        ? loan / payMonths
        : 0;
  const annualRepayment = emi * 12;
  const dscr = projected.map((col: CmepYearColumn) => {
    const cashProfit = col.netProfit + col.depreciation + col.interest;
    const ratio = annualRepayment > 0 ? cashProfit / annualRepayment : 0;
    return { label: col.label, cashProfit, repayment: annualRepayment, ratio };
  });
  const averageDscr = dscr.length ? dscr.reduce((sum, row) => sum + row.ratio, 0) / dscr.length : 0;
  const first = projected[0];
  const fixed = first ? first.salaries + first.rent + first.maintenance + first.admin + first.depreciation + first.interest : 0;
  const contribution = first ? Math.max(0, first.sales - first.rm - first.wages - first.power) : 0;
  const pv = first && first.sales > 0 ? contribution / first.sales : 0;
  const breakEvenSales = pv > 0 ? fixed / pv : 0;
  const breakEvenCapacity = first && first.sales > 0 ? (breakEvenSales / first.sales) * 100 : 0;
  return {
    depreciation,
    dscr,
    averageDscr,
    breakEvenSales,
    breakEvenCapacity,
    repayment: {
      amount: loan,
      rate: annualRate * 100,
      moratoriumMonths,
      tenureMonths,
      emi,
    },
  };
}


