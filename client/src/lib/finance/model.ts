import { type CL, fromCL, sumCL, toCL } from './money.ts';
import { composeFinancing, composeProjectCost } from './capital.ts';
import { discountedPaybackYears, irrExcel, npvFromZero, paybackYears } from './valuation.ts';

type AnyData = Record<string, any>;

/** Assumptions the person can change. Every default is shown on screen next to the results. */
export type Assumptions = {
  years: number;
  revenueGrowthPct: number;
  costGrowthPct: number;
  taxPct: number;
  discountPct: number;
  buildingDepPct: number;
  machineryDepPct: number;
  furnitureDepPct: number;
  preOpWriteOffYears: number;
  interestPct: number;
  tenureMonths: number;
  moratoriumMonths: number;
};

export const DEFAULT_ASSUMPTIONS: Omit<Assumptions, 'years' | 'interestPct' | 'tenureMonths' | 'moratoriumMonths'> = {
  revenueGrowthPct: 5,
  costGrowthPct: 5,
  taxPct: 25,
  discountPct: 12,
  buildingDepPct: 10,
  machineryDepPct: 15,
  furnitureDepPct: 10,
  preOpWriteOffYears: 5,
};

const num = (v: unknown, fallback: number): number => {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(/,/g, ''));
  return Number.isFinite(n) && String(v ?? '') !== '' ? n : fallback;
};

export function assumptionsFrom(data: AnyData | null | undefined): Assumptions {
  const d = data || {};
  const saved = d.schemeExtras?.financeAssumptions || {};
  const s13 = d.step13 || {};
  const tenureMonths = Math.max(0, Math.floor(num(s13.loanTenureMonths, 0))) || 60;
  const years = Math.min(7, Math.max(5, Math.round(num(saved.years, Math.ceil(tenureMonths / 12)))));
  return {
    years,
    revenueGrowthPct: num(saved.revenueGrowthPct, DEFAULT_ASSUMPTIONS.revenueGrowthPct),
    costGrowthPct: num(saved.costGrowthPct, DEFAULT_ASSUMPTIONS.costGrowthPct),
    taxPct: Math.min(100, Math.max(0, num(saved.taxPct, DEFAULT_ASSUMPTIONS.taxPct))),
    discountPct: Math.max(0, num(saved.discountPct, DEFAULT_ASSUMPTIONS.discountPct)),
    buildingDepPct: num(saved.buildingDepPct, DEFAULT_ASSUMPTIONS.buildingDepPct),
    machineryDepPct: num(saved.machineryDepPct, DEFAULT_ASSUMPTIONS.machineryDepPct),
    furnitureDepPct: num(saved.furnitureDepPct, DEFAULT_ASSUMPTIONS.furnitureDepPct),
    preOpWriteOffYears: Math.max(1, Math.round(num(saved.preOpWriteOffYears, DEFAULT_ASSUMPTIONS.preOpWriteOffYears))),
    interestPct: Math.max(0, num(s13.interestRate, 11)),
    tenureMonths,
    moratoriumMonths: Math.max(0, Math.floor(num(s13.moratoriumMonths, 0))),
  };
}

export type YearRow = {
  year: number;
  // profit and loss
  revenue: CL;
  variableCosts: CL;
  grossMargin: CL;
  fixedCosts: CL;
  ebitda: CL;
  depreciation: CL;
  amortisation: CL;
  interest: CL;
  pbt: CL;
  tax: CL;
  pat: CL;
  // loan
  principal: CL;
  termLoanClosing: CL;
  // cash flow statement
  operatingCash: CL;
  investingCash: CL;
  financingCash: CL;
  openingCash: CL;
  closingCash: CL;
  // balance sheet
  netFixedAssets: CL;
  preOperativeUnwritten: CL;
  netWorkingCapital: CL;
  totalAssets: CL;
  promoterCapital: CL;
  subsidyReserve: CL;
  retainedEarnings: CL;
  termLoan: CL;
  workingCapitalLoan: CL;
  otherFunding: CL;
  totalLiabilitiesAndEquity: CL;
  balanceDifference: CL;
  // ratios
  dscr: number | null;
};

export type Model = {
  assumptions: Assumptions;
  years: YearRow[]; // index 0 is the set-up year ("Year 0"); 1..N follow
  checks: {
    balanceSheetBalances: boolean;
    cashContinuity: boolean;
    liquidityPositive: boolean;
    firstNegativeCashYear: number | null;
  };
  dscr: { average: number | null; minimum: number | null; meetsNorm: boolean; norm: number };
  valuation: {
    projectFlows: CL[];
    equityFlows: CL[];
    projectIrr: number | null;
    equityIrr: number | null;
    npv: number;
    payback: number | null;
    discountedPayback: number | null;
    discountPct: number;
  };
  breakEven: { sales: CL; percentOfRevenue: number | null; fixedCharges: CL };
};

const DSCR_NORM = 1.5;
const roundCL = (value: number): CL => Math.round(value);

/** Monthly loan schedule rolled up to years. Interest-only during the moratorium, equal instalments after it. */
function termLoanByYear(loan: CL, ratePct: number, tenureMonths: number, moratorium: number, years: number) {
  const interest: CL[] = Array(years + 1).fill(0);
  const principal: CL[] = Array(years + 1).fill(0);
  const closing: CL[] = Array(years + 1).fill(0);
  closing[0] = loan;
  if (loan <= 0) return { interest, principal, closing };
  const r = ratePct / 1200;
  const repayMonths = Math.max(1, tenureMonths - moratorium);
  const instalment = r === 0 ? loan / repayMonths : (loan * r * Math.pow(1 + r, repayMonths)) / (Math.pow(1 + r, repayMonths) - 1);
  let balance = loan;
  const yearInterest: number[] = Array(years + 1).fill(0);
  const yearPrincipal: number[] = Array(years + 1).fill(0);
  for (let month = 1; month <= years * 12; month += 1) {
    const y = Math.ceil(month / 12);
    const monthInterest = balance * r;
    yearInterest[y] += monthInterest;
    if (month > moratorium && balance > 0 && month <= tenureMonths) {
      const repaid = Math.min(balance, instalment - monthInterest);
      yearPrincipal[y] += repaid;
      balance -= repaid;
    }
  }
  let outstanding = loan;
  for (let y = 1; y <= years; y += 1) {
    let paid = roundCL(yearPrincipal[y]);
    // Whole loan repaid inside this year: take exactly what is left so the balance ends at zero.
    if (tenureMonths <= y * 12 && tenureMonths > (y - 1) * 12) paid = outstanding;
    paid = Math.min(paid, outstanding);
    interest[y] = roundCL(yearInterest[y]);
    principal[y] = paid;
    outstanding -= paid;
    closing[y] = outstanding;
  }
  return { interest, principal, closing };
}

export function buildModel(data: AnyData | null | undefined, override?: Partial<Assumptions>): Model {
  const d = data || {};
  const a: Assumptions = { ...assumptionsFrom(d), ...(override || {}) };
  const N = a.years;
  const cost = composeProjectCost(d);
  const fin = composeFinancing(d);
  const s14 = d.step14 || {};

  const base = {
    revenue: toCL(s14.annualSalesRealization),
    variable: sumCL([toCL(s14.rawMaterialCost), toCL(s14.powerCost)]),
    fixed: sumCL([toCL(s14.wages), toCL(s14.maintenance), toCL(s14.administrativeExpenses), toCL(s14.marketingExpenses)]),
  };
  const g = 1 + a.revenueGrowthPct / 100;
  const gc = 1 + a.costGrowthPct / 100;

  const loan = termLoanByYear(fin.termLoan, a.interestPct, a.tenureMonths, a.moratoriumMonths, N);
  const wcInterest = roundCL((fin.workingCapitalLoan * a.interestPct) / 100);

  // Written-down values by asset class (land and deposits are not depreciated).
  let wdv = {
    building: cost.capex.building + cost.capex.utilities,
    machinery: cost.capex.machinery,
    furniture: cost.capex.furniture,
  };
  const staticAssets = cost.capex.land + cost.capex.deposits;
  const setUpCosts = cost.preOperative + cost.opex;
  let setUpLeft = setUpCosts;

  const rows: YearRow[] = [];
  const zeroRow = (year: number): YearRow => ({
    year, revenue: 0, variableCosts: 0, grossMargin: 0, fixedCosts: 0, ebitda: 0, depreciation: 0, amortisation: 0, interest: 0, pbt: 0, tax: 0, pat: 0,
    principal: 0, termLoanClosing: 0, operatingCash: 0, investingCash: 0, financingCash: 0, openingCash: 0, closingCash: 0,
    netFixedAssets: 0, preOperativeUnwritten: 0, netWorkingCapital: 0, totalAssets: 0, promoterCapital: 0, subsidyReserve: 0, retainedEarnings: 0,
    termLoan: 0, workingCapitalLoan: 0, otherFunding: 0, totalLiabilitiesAndEquity: 0, balanceDifference: 0, dscr: null,
  });

  // Year 0: the money comes in, the project is paid for, working capital is set up.
  const y0 = zeroRow(0);
  y0.investingCash = -(cost.capex.total + setUpCosts);
  y0.operatingCash = -cost.workingCapital;
  y0.financingCash = fin.total;
  y0.openingCash = 0;
  y0.closingCash = y0.operatingCash + y0.investingCash + y0.financingCash;
  const fillBalance = (row: YearRow, retained: CL) => {
    row.netFixedAssets = staticAssets + wdv.building + wdv.machinery + wdv.furniture;
    row.preOperativeUnwritten = setUpLeft;
    row.totalAssets = row.netFixedAssets + row.preOperativeUnwritten + row.netWorkingCapital + row.closingCash;
    row.promoterCapital = fin.promoterEquity;
    row.subsidyReserve = fin.subsidy;
    row.retainedEarnings = retained;
    row.otherFunding = fin.other;
    row.workingCapitalLoan = fin.workingCapitalLoan;
    row.totalLiabilitiesAndEquity = row.promoterCapital + row.subsidyReserve + row.retainedEarnings + row.termLoan + row.workingCapitalLoan + row.otherFunding;
    row.balanceDifference = row.totalAssets - row.totalLiabilitiesAndEquity;
  };
  y0.netWorkingCapital = cost.workingCapital;
  y0.termLoan = loan.closing[0];
  y0.termLoanClosing = loan.closing[0];
  fillBalance(y0, 0);
  rows.push(y0);

  let retained = 0;
  let nwcPrev = cost.workingCapital;
  const amortYears = Math.min(a.preOpWriteOffYears, N);
  for (let y = 1; y <= N; y += 1) {
    const row = zeroRow(y);
    row.revenue = roundCL(base.revenue * Math.pow(g, y - 1));
    row.variableCosts = roundCL(base.variable * Math.pow(gc, y - 1));
    row.grossMargin = row.revenue - row.variableCosts;
    row.fixedCosts = roundCL(base.fixed * Math.pow(gc, y - 1));
    row.ebitda = row.grossMargin - row.fixedCosts;

    const depB = roundCL((wdv.building * a.buildingDepPct) / 100);
    const depM = roundCL((wdv.machinery * a.machineryDepPct) / 100);
    const depF = roundCL((wdv.furniture * a.furnitureDepPct) / 100);
    wdv = { building: wdv.building - depB, machinery: wdv.machinery - depM, furniture: wdv.furniture - depF };
    row.depreciation = depB + depM + depF;

    const amort = y <= amortYears ? (y === amortYears ? setUpLeft : Math.min(setUpLeft, roundCL(setUpCosts / amortYears))) : 0;
    setUpLeft -= amort;
    row.amortisation = amort;

    row.interest = loan.interest[y] + wcInterest;
    row.pbt = row.ebitda - row.depreciation - row.amortisation - row.interest;
    row.tax = row.pbt > 0 ? roundCL((row.pbt * a.taxPct) / 100) : 0;
    row.pat = row.pbt - row.tax;
    retained += row.pat;

    row.principal = loan.principal[y];
    row.termLoan = loan.closing[y];
    row.termLoanClosing = loan.closing[y];

    const nwc = base.revenue > 0 ? roundCL((cost.workingCapital * row.revenue) / roundCL(base.revenue)) : cost.workingCapital;
    row.netWorkingCapital = nwc;
    row.operatingCash = row.pat + row.depreciation + row.amortisation - (nwc - nwcPrev);
    nwcPrev = nwc;
    row.investingCash = 0;
    row.financingCash = -row.principal;
    row.openingCash = rows[y - 1].closingCash;
    row.closingCash = row.openingCash + row.operatingCash + row.investingCash + row.financingCash;

    const service = row.principal + row.interest;
    row.dscr = service > 0 ? Math.round(((row.pat + row.depreciation + row.amortisation + row.interest) / service) * 100) / 100 : null;
    fillBalance(row, retained);
    rows.push(row);
  }

  const withDebt = rows.filter((r) => r.year > 0 && r.dscr !== null);
  const avg = withDebt.length ? Math.round((withDebt.reduce((s, r) => s + (r.dscr as number), 0) / withDebt.length) * 100) / 100 : null;
  const min = withDebt.length ? Math.min(...withDebt.map((r) => r.dscr as number)) : null;

  // Valuation, in lakhs. Terminal value is the book value still on the balance sheet (a prudent, simple choice).
  const last = rows[N];
  const projectOutlay = -(cost.capex.total + setUpCosts + cost.workingCapital);
  const projectFlows: CL[] = [projectOutlay];
  const equityFlows: CL[] = [-fin.promoterEquity];
  for (let y = 1; y <= N; y += 1) {
    const r = rows[y];
    const ebit = r.ebitda - r.depreciation - r.amortisation;
    const unleveredTax = ebit > 0 ? roundCL((ebit * a.taxPct) / 100) : 0;
    const dNwc = r.netWorkingCapital - rows[y - 1].netWorkingCapital;
    let free = r.ebitda - unleveredTax - dNwc;
    let toEquity = r.operatingCash - r.principal;
    if (y === N) {
      free += last.netFixedAssets + last.preOperativeUnwritten + last.netWorkingCapital;
      toEquity += last.closingCash + last.netFixedAssets + last.preOperativeUnwritten + last.netWorkingCapital - last.termLoan - last.workingCapitalLoan - last.otherFunding - last.subsidyReserve;
    }
    projectFlows.push(free);
    equityFlows.push(toEquity);
  }
  const rate = a.discountPct / 100;
  const asLakhs = (flows: CL[]) => flows.map(fromCL);

  const fixedCharges = rows[1] ? rows[1].fixedCosts + rows[1].depreciation + rows[1].amortisation + rows[1].interest : 0;
  const contribution = rows[1] && rows[1].revenue > 0 ? (rows[1].revenue - rows[1].variableCosts) / rows[1].revenue : 0;
  const bepSales = contribution > 0 ? roundCL(fixedCharges / contribution) : 0;

  const negative = rows.find((r) => r.closingCash < 0);
  return {
    assumptions: a,
    years: rows,
    checks: {
      balanceSheetBalances: rows.every((r) => r.balanceDifference === 0),
      cashContinuity: rows.every((r, i) => i === 0 || r.openingCash === rows[i - 1].closingCash),
      liquidityPositive: !negative,
      firstNegativeCashYear: negative ? negative.year : null,
    },
    dscr: { average: avg, minimum: min, meetsNorm: avg !== null && avg >= DSCR_NORM, norm: DSCR_NORM },
    valuation: {
      projectFlows,
      equityFlows,
      projectIrr: irrExcel(asLakhs(projectFlows)),
      equityIrr: fin.promoterEquity > 0 ? irrExcel(asLakhs(equityFlows)) : null,
      npv: Math.round(npvFromZero(rate, asLakhs(projectFlows)) * 100) / 100,
      payback: paybackYears(asLakhs(projectFlows)),
      discountedPayback: discountedPaybackYears(rate, asLakhs(projectFlows)),
      discountPct: a.discountPct,
    },
    breakEven: { sales: bepSales, percentOfRevenue: rows[1] && rows[1].revenue > 0 && bepSales > 0 ? Math.round((bepSales / rows[1].revenue) * 10000) / 100 : null, fixedCharges },
  };
}
