/** Small money calculations behind the form's "help me work this out" calculators. All amounts in lakhs. */

const n = (v: unknown): number => {
  const x = typeof v === 'number' ? v : Number(String(v ?? '').replace(/,/g, ''));
  return Number.isFinite(x) ? x : 0;
};
const r2 = (x: number) => Math.round(x * 100) / 100;

/** Monthly instalment for a loan repaid in equal monthly instalments. */
export function monthlyInstalment(loan: number, annualRatePct: number, months: number): number {
  const principal = n(loan);
  const m = Math.floor(n(months));
  if (principal <= 0 || m <= 0) return 0;
  const rate = n(annualRatePct) / 1200;
  if (rate === 0) return principal / m;
  const growth = Math.pow(1 + rate, m);
  return (principal * rate * growth) / (growth - 1);
}

export type DscrVerdict = 'comfortable' | 'tight' | 'short' | 'unknown';

/**
 * DSCR = money available each year to pay the loan ÷ the loan instalments due in that year.
 * `yearlyAvailable` is profit before loan payments, with depreciation added back.
 */
export function loanCover(input: { loan: number; ratePct: number; months: number; yearlyAvailable: number }) {
  const emi = monthlyInstalment(input.loan, input.ratePct, input.months);
  const yearlyPayment = emi * 12;
  const dscr = yearlyPayment > 0 ? n(input.yearlyAvailable) / yearlyPayment : 0;
  const verdict: DscrVerdict = yearlyPayment <= 0 ? 'unknown' : dscr >= 1.5 ? 'comfortable' : dscr >= 1 ? 'tight' : 'short';
  return { emi: r2(emi), yearlyPayment: r2(yearlyPayment), dscr: r2(dscr), verdict };
}

/** Share of full capacity at which sales just cover all costs. null when sales never cover the changing costs. */
export function breakEvenPercent(input: { sales: number; changingCosts: number; fixedCosts: number }): number | null {
  const contribution = n(input.sales) - n(input.changingCosts);
  if (n(input.sales) <= 0 || contribution <= 0) return null;
  return r2((n(input.fixedCosts) / contribution) * 100);
}

/** Money needed to run the unit for a number of months, from yearly running costs. */
export function workingCapitalNeed(yearlyRunningCosts: number, months: number): number {
  return r2((n(yearlyRunningCosts) / 12) * Math.max(0, n(months)));
}

/** Split a project cost into own money, subsidy and the bank loan that is left. */
export function fundingSplit(cost: number, ownPct: number, grantPct: number) {
  const total = Math.max(0, n(cost));
  const own = r2((total * Math.max(0, n(ownPct))) / 100);
  const grant = r2((total * Math.max(0, n(grantPct))) / 100);
  const loan = r2(Math.max(0, total - own - grant));
  return { own, grant, loan, overfunded: own + grant > total + 0.005 };
}
