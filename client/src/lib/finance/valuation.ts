/**
 * Discounting formulas that follow Microsoft Excel's definitions:
 *  - NPV(rate, v1..vn): the first value is discounted by one period (Excel's NPV does not treat it as time 0).
 *  - IRR(values): the rate that makes the discounted values sum to zero, first value at time 0.
 *  - XIRR(values, dates): same with actual/365 day counts from the first date.
 */

export function npvExcel(rate: number, values: readonly number[]): number {
  return values.reduce((sum, value, index) => sum + value / Math.pow(1 + rate, index + 1), 0);
}

/** Net present value with the first cash flow at time 0 (the usual finance reading). */
export function npvFromZero(rate: number, values: readonly number[]): number {
  return values.reduce((sum, value, index) => sum + value / Math.pow(1 + rate, index), 0);
}

function solveRate(f: (rate: number) => number, guess: number): number | null {
  // Newton first, then bisection on a bracket, so a result is found whenever one exists.
  let rate = guess;
  for (let i = 0; i < 80; i += 1) {
    const value = f(rate);
    if (Math.abs(value) < 1e-10) return rate;
    const step = (f(rate + 1e-7) - f(rate - 1e-7)) / 2e-7;
    if (!Number.isFinite(step) || step === 0) break;
    const next = rate - value / step;
    if (!Number.isFinite(next) || next <= -0.999999) break;
    if (Math.abs(next - rate) < 1e-14) return next;
    rate = next;
  }
  let lo = -0.999;
  let hi = 10;
  let flo = f(lo);
  let fhi = f(hi);
  if (!Number.isFinite(flo) || !Number.isFinite(fhi) || flo * fhi > 0) return null;
  for (let i = 0; i < 300; i += 1) {
    const mid = (lo + hi) / 2;
    const fm = f(mid);
    if (Math.abs(fm) < 1e-12 || hi - lo < 1e-15) return mid;
    if (flo * fm < 0) {
      hi = mid;
      fhi = fm;
    } else {
      lo = mid;
      flo = fm;
    }
  }
  return (lo + hi) / 2;
}

/** Excel IRR. null when the flows never change sign (no rate exists). */
export function irrExcel(values: readonly number[], guess = 0.1): number | null {
  if (!values.some((v) => v > 0) || !values.some((v) => v < 0)) return null;
  return solveRate((rate) => npvFromZero(rate, values), guess);
}

/** Excel XIRR with actual/365 day counts. Dates are ISO strings or timestamps. */
export function xirrExcel(values: readonly number[], dates: readonly (string | number | Date)[], guess = 0.1): number | null {
  if (values.length !== dates.length || values.length < 2) return null;
  if (!values.some((v) => v > 0) || !values.some((v) => v < 0)) return null;
  const t0 = new Date(dates[0]).getTime();
  const years = dates.map((d) => (new Date(d).getTime() - t0) / 86400000 / 365);
  return solveRate((rate) => values.reduce((sum, value, i) => sum + value / Math.pow(1 + rate, years[i]), 0), guess);
}

/** Years until the running total of cash flows turns positive, interpolated inside the year. null if it never does. */
export function paybackYears(values: readonly number[]): number | null {
  let cumulative = 0;
  for (let i = 0; i < values.length; i += 1) {
    const before = cumulative;
    cumulative += values[i];
    if (i > 0 && before < 0 && cumulative >= 0) return Math.round((i - 1 + -before / values[i]) * 100) / 100;
  }
  return null;
}

/** Same as paybackYears but on cash flows discounted at `rate`. */
export function discountedPaybackYears(rate: number, values: readonly number[]): number | null {
  return paybackYears(values.map((v, i) => v / Math.pow(1 + rate, i)));
}
