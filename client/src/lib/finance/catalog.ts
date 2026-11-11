import { composeFinancing, composeProjectCost, reconcileFinancing } from './capital.ts';
import { formatCL } from './money.ts';
import { buildModel } from './model.ts';
import { discountedPaybackYears, irrExcel, npvExcel, npvFromZero, paybackYears, xirrExcel } from './valuation.ts';
import { lendingLimit, reviewFinance, ruleFor } from './rules.ts';

/**
 * The catalog of financial formulas. Each entry has a version, a plain statement of the formula and a
 * worked example run through the real code. A SHA-256 hash of (id, version, statement, example result) is
 * kept in formulaLock.json. If anyone changes how a formula works, its example result changes, the hash no
 * longer matches the lock and the tests fail until the version is raised and the lock is regenerated on purpose
 * (`npm run lock:formulas`). Nothing here changes while the app runs.
 */
export const CATALOG_VERSION = '1.0.0';

type CatalogFormula = {
  id: string;
  version: string;
  name: string;
  /** The formula in words, as it appears in the DPR notes. */
  statement: string;
  /** Runs the real implementation on a fixed example and returns a plain, JSON-safe result. */
  example: () => unknown;
};

const SAMPLE = {
  matchedSchemeCode: 'PMFME',
  step12: { land: 5, building: 15, machinery: 60, furniture: 5, preliminaryAndPreOperative: 5, workingCapitalMargin: 10 },
  step13: { spvContribution: 20, governmentGrant: 20, bankLoan: 60, workingCapitalLoan: 10, interestRate: 12, loanTenureMonths: 60, moratoriumMonths: 6 },
  step14: { annualSalesRealization: 120, rawMaterialCost: 50, powerCost: 6, wages: 18, maintenance: 3, administrativeExpenses: 5, marketingExpenses: 4 },
};
const model = () => buildModel(SAMPLE);
const row = (year: number) => model().years[year];

const FORMULAS: CatalogFormula[] = [
  { id: 'cost.total', version: '1.0.0', name: 'Total project cost', statement: 'Total project cost = capital expenditure (land + building + utilities + machinery + furniture + deposits) + pre-operative expenses + initial operating expenses + working capital. Each part is rounded to 0.01 lakh first.', example: () => composeProjectCost(SAMPLE) },
  { id: 'mof.total', version: '1.0.0', name: 'Total means of finance', statement: 'Total means of finance = promoter equity + subsidy + term loan + working capital loan + other sources. Term loan = bank loan − working capital loan.', example: () => composeFinancing(SAMPLE) },
  { id: 'mof.difference', version: '1.0.0', name: 'Funding difference', statement: 'Difference = total means of finance − total project cost. It must be exactly zero.', example: () => reconcileFinancing(SAMPLE) },
  { id: 'pl.grossMargin', version: '1.0.0', name: 'Gross margin', statement: 'Gross margin = revenue − variable costs (raw material and power).', example: () => row(1).grossMargin },
  { id: 'pl.ebitda', version: '1.0.0', name: 'EBITDA', statement: 'EBITDA = gross margin − fixed costs (wages, maintenance, administration, marketing).', example: () => row(1).ebitda },
  { id: 'pl.depreciation', version: '1.0.0', name: 'Depreciation', statement: 'Depreciation = written-down value at the start of the year × rate (building and utilities 10%, machinery 15%, furniture 10%). Land and deposits are not depreciated. Set-up costs are written off in equal parts over 5 years.', example: () => [row(1).depreciation, row(1).amortisation, row(2).depreciation] },
  { id: 'pl.interest', version: '1.0.0', name: 'Interest', statement: 'Term loan: interest-only during the moratorium, then equal monthly instalments; interest each month = outstanding × rate ÷ 12, added up by year. Working capital loan: outstanding × rate.', example: () => [row(1).interest, row(2).interest, row(1).principal] },
  { id: 'pl.pat', version: '1.0.0', name: 'Profit after tax', statement: 'PBT = EBITDA − depreciation − amortisation − interest. Tax = tax rate × PBT when PBT is positive. PAT = PBT − tax.', example: () => [row(1).pbt, row(1).tax, row(1).pat] },
  { id: 'cf.closingCash', version: '1.0.0', name: 'Closing cash', statement: 'Operating = PAT + depreciation + amortisation − change in working capital. Investing = −assets bought (year 0). Financing = money raised (year 0) − loan repaid. Closing cash = opening cash + operating + investing + financing, and next year opens with this closing cash.', example: () => [row(0).closingCash, row(1).operatingCash, row(1).financingCash, row(1).closingCash] },
  { id: 'bs.identity', version: '1.0.0', name: 'Balance sheet identity', statement: 'Total assets (net fixed assets + unwritten set-up costs + net working capital + cash) = total liabilities and equity (promoter capital + subsidy reserve + retained earnings + loans + other funding) in every year.', example: () => model().years.map((r) => r.balanceDifference) },
  { id: 'val.npv', version: '1.0.0', name: 'NPV (Excel)', statement: 'NPV(rate, v1..vn) = Σ vi ÷ (1 + rate)^i for i = 1..n, as in Microsoft Excel. The project NPV adds the time-0 outlay without discounting.', example: () => [npvExcel(0.1, [-10000, 3000, 4200, 6800]), npvFromZero(0.08, [-40000, 8000, 9200, 10000, 12000, 14500]), model().valuation.npv] },
  { id: 'val.irr', version: '1.0.0', name: 'IRR (Excel)', statement: 'IRR is the rate at which the discounted cash flows, with the first at time 0, add up to zero. Project IRR uses cash flows before loans. Equity IRR uses cash flows to the promoter.', example: () => [irrExcel([-1000, 500, 500, 500]), model().valuation.projectIrr, model().valuation.equityIrr] },
  { id: 'val.xirr', version: '1.0.0', name: 'XIRR (Excel)', statement: 'XIRR solves Σ vi ÷ (1 + rate)^((di − d0) ÷ 365) = 0 for dated cash flows, as in Microsoft Excel.', example: () => xirrExcel([-10000, 2750, 4250, 3250, 2750], ['2008-01-01', '2008-03-01', '2008-10-30', '2009-02-15', '2009-04-01']) },
  { id: 'val.payback', version: '1.0.0', name: 'Payback period', statement: 'Payback = years until the running total of cash flows turns positive, with the fraction of the last year worked out in proportion. The discounted payback uses discounted flows.', example: () => [paybackYears([-100, 40, 40, 40]), discountedPaybackYears(0.1, [-100, 60, 60, 60]), model().valuation.payback] },
  { id: 'ratio.breakEven', version: '1.0.0', name: 'Break-even point', statement: 'Break-even sales = (fixed costs + depreciation + interest) ÷ ((revenue − variable costs) ÷ revenue). Shown as a share of revenue.', example: () => model().breakEven },
  { id: 'ratio.dscr', version: '1.0.0', name: 'DSCR', statement: 'DSCR (year) = (PAT + depreciation + amortisation + interest) ÷ (principal repaid + interest). The average is over the years with debt service. Banks look for 1.50 or more.', example: () => [row(1).dscr, row(2).dscr, model().dscr] },
  { id: 'ratio.debtEquity', version: '1.0.0', name: 'Debt-equity', statement: 'Debt-equity = bank loan ÷ (promoter equity + capital subsidy). The usual ceiling is 3 to 1; the scheme rule applies where it is different.', example: () => ({ rule: ruleFor(SAMPLE), findings: reviewFinance(SAMPLE).map((f) => f.id) }) },
  { id: 'ratio.promoterEquity', version: '1.0.0', name: 'Promoter equity share', statement: 'Promoter equity share = promoter equity ÷ total project cost × 100, to two decimals. It must be at least the scheme minimum.', example: () => ({ share: formatCL(composeFinancing(SAMPLE).promoterEquity), min: ruleFor(SAMPLE).minEquityPct }) },
  { id: 'limit.lending', version: '1.0.0', name: 'Scheme lending limit', statement: 'The bank loan must not exceed the largest loan the scheme allows for the chosen category or tranche.', example: () => [lendingLimit({ matchedSchemeCode: 'MUDRA', schemeExtras: { mudraCategory: 'kishore' } }), lendingLimit({ matchedSchemeCode: 'STANDUP' })] },
];

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
  }
  return value;
}

export const FORMULA_CATALOG: readonly CatalogFormula[] = deepFreeze(FORMULAS);

export async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** What gets hashed for a formula: its identity, its statement and what the real code returns for the example. */
function canonicalForm(formula: CatalogFormula): string {
  // Numbers are rounded to 9 decimals so that harmless last-digit differences between JavaScript engines never change a hash.
  const round = (_key: string, value: unknown) => (typeof value === 'number' ? Math.round(value * 1e9) / 1e9 : value);
  return JSON.stringify({ id: formula.id, version: formula.version, statement: formula.statement, example: formula.example() }, round);
}

type CatalogLock = {
  catalogVersion: string;
  formulas: Record<string, { version: string; sha256: string }>;
  catalogSha256: string;
};

export async function computeLock(): Promise<CatalogLock> {
  const formulas: CatalogLock['formulas'] = {};
  for (const formula of FORMULA_CATALOG) formulas[formula.id] = { version: formula.version, sha256: await sha256Hex(canonicalForm(formula)) };
  const catalogSha256 = await sha256Hex(JSON.stringify({ catalogVersion: CATALOG_VERSION, formulas }));
  return { catalogVersion: CATALOG_VERSION, formulas, catalogSha256 };
}

type CatalogVerdict = { ok: boolean; changed: string[]; added: string[]; removed: string[] };

/** Compares the code as it is now against the committed lock. */
export async function verifyCatalog(lock: CatalogLock): Promise<CatalogVerdict> {
  const now = await computeLock();
  const changed = Object.keys(now.formulas).filter((id) => lock.formulas[id] && lock.formulas[id].sha256 !== now.formulas[id].sha256);
  const added = Object.keys(now.formulas).filter((id) => !lock.formulas[id]);
  const removed = Object.keys(lock.formulas).filter((id) => !now.formulas[id]);
  return { ok: !changed.length && !added.length && !removed.length && lock.catalogSha256 === now.catalogSha256, changed, added, removed };
}
