/**
 * Exact money arithmetic. Amounts are entered in ₹ lakhs with two decimals, so they are held as whole
 * hundredths of a lakh ("centi-lakh", ₹1,000). Adding whole numbers has no rounding error: a total always
 * equals the sum of the lines that are shown, to exactly two decimal places.
 */
export type CL = number; // integer hundredths of a lakh

/** Round a lakh amount (as typed) to whole hundredths. Half values round away from zero, in the same way every time. */
export function toCL(lakhs: unknown): CL {
  const raw = typeof lakhs === 'number' ? lakhs : Number(String(lakhs ?? '').replace(/,/g, '').trim());
  if (!Number.isFinite(raw)) return 0;
  // The epsilon removes binary noise such as 1.005 * 100 = 100.49999999999999.
  const scaled = Math.abs(raw) * 100 + 1e-9;
  return Math.sign(raw) * Math.floor(scaled + 0.5);
}

export const fromCL = (value: CL): number => value / 100;

export function sumCL(values: readonly CL[]): CL {
  return values.reduce((total, value) => total + value, 0);
}

/** "12.50" style text for a centi-lakh amount. */
export function formatCL(value: CL): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

/** Percentage of a centi-lakh amount, rounded to a whole centi-lakh. */
export function pctOfCL(value: CL, pct: number): CL {
  return toCL((value * pct) / 100 / 100);
}

/** Share a/b as a percentage with 2 decimals (0 when b is 0). */
export function sharePct(a: CL, b: CL): number {
  return b === 0 ? 0 : Math.round((a / b) * 10000) / 100;
}
