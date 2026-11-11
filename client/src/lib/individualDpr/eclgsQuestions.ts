/**
 * ECLGS 5.0 Create New Latest DPR question catalog.
 * Spec: docs/schemes/ECLGS/eclgs.md
 * Step list: ECLGS_STEPS in schemeStepCatalog.ts (7 consecutive steps).
 */

type EclgsAccountStatus = 'standard' | 'sma1' | 'other';

export const ECLGS_EXTRA_FIELDS = [
  'existingLimit',
  'peakWcOutstanding',
  'additionalWcSought',
  'accountStatus',
  'entrepreneurName',
  'liquidityReason',
] as const;


export const ECLGS_ACCOUNT_STATUS_OPTIONS: {
  value: EclgsAccountStatus;
  label: string;
}[] = [
  { value: 'standard', label: 'Standard (eligible)' },
  { value: 'sma1', label: 'SMA-1 (confirm with bank)' },
  { value: 'other', label: 'Other / not eligible' },
];

/** Illustrative quantum: 20% of peak WC outstanding (₹ lakhs), capped at ₹100 Cr. */
export const ECLGS_QUANTUM_PERCENT = 20;
const ECLGS_MAX_LAKHS = 10000; // ₹100 crore

export function eclgsIndicativeQuantumLakhs(peakWcOutstandingLakhs?: number | string): number {
  const peak = Number(peakWcOutstandingLakhs) || 0;
  if (peak <= 0) return 0;
  return Math.min((peak * ECLGS_QUANTUM_PERCENT) / 100, ECLGS_MAX_LAKHS);
}

export const ECLGS_INTEREST_CAP_PERCENT = 9;
export const ECLGS_TENOR_YEARS = 5;

export const ECLGS_IMPACT_BULLETS = [
  'Own 7-step WC pack for ECLGS 5.0 (additional liquidity — not a greenfield plant DPR). Steps numbered 1–7.',
  'Step 1 asks existing WC limit + peak Q4 outstanding + additional WC sought — drives 20% quantum hint.',
  'Means of finance = bank WCTL (guarantee is not a capital grant). Land/building tables hidden.',
  'Step 7: Udyam, GST/ITR, bank statements, existing sanction, CA turnover.',
];
