/**
 * PM SVANidhi Create New Latest DPR question catalog.
 * Spec: docs/schemes/SVANIDHI/svanidhi.md
 * Step list: SVANIDHI_STEPS in schemeStepCatalog.ts (10 consecutive steps).
 */

type SvanidhiProof = 'cov' | 'lor';
type SvanidhiLoanTranche = 'first' | 'second' | 'third';
type SvanidhiVendingType =
  | 'footpath'
  | 'cart'
  | 'stall'
  | 'market'
  | 'moving'
  | 'other';

export const SVANIDHI_EXTRA_FIELDS = [
  'covOrLor',
  'upiQr',
  'entrepreneurName',
  'entrepreneurAge',
  'yearsVending',
  'loanTranche',
  'vendingType',
  'dailySales',
  'processOfManufacture',
  'workplaceType',
  'powerRequirement',
] as const;


export const SVANIDHI_PROOF_OPTIONS: { value: SvanidhiProof; label: string }[] = [
  { value: 'cov', label: 'Certificate of Vending / Vendor ID (ULB / TVC)' },
  { value: 'lor', label: 'Letter of Recommendation (portal digital only)' },
];

export const SVANIDHI_TRANCHE_OPTIONS: {
  value: SvanidhiLoanTranche;
  label: string;
}[] = [
  { value: 'first', label: '1st tranche — up to ₹15,000 (12 months)' },
  { value: 'second', label: '2nd tranche — up to ₹25,000 (18 months)' },
  { value: 'third', label: '3rd tranche — up to ₹50,000 (36 months)' },
];

export const SVANIDHI_VENDING_OPTIONS: {
  value: SvanidhiVendingType;
  label: string;
}[] = [
  { value: 'footpath', label: 'Footpath / pavement pitch' },
  { value: 'cart', label: 'Mobile cart / thela' },
  { value: 'stall', label: 'Fixed stall / kiosk' },
  { value: 'market', label: 'Weekly / municipal market' },
  { value: 'moving', label: 'Hawking / door-to-door' },
  { value: 'other', label: 'Other' },
];

/** Tranche ceilings in ₹ lakhs (restructured MoHUA guidelines). */
const SVANIDHI_TRANCHE1_LAKHS = 0.15;
const SVANIDHI_TRANCHE2_LAKHS = 0.25;
const SVANIDHI_TRANCHE3_LAKHS = 0.5;

/** Interest subsidy % p.a. credited quarterly when account is Standard. */
export const SVANIDHI_INTEREST_SUBSIDY_PERCENT = 7;

export function svanidhiTrancheCapLakhs(loanTranche?: string): number {
  if (loanTranche === 'third') return SVANIDHI_TRANCHE3_LAKHS;
  if (loanTranche === 'second') return SVANIDHI_TRANCHE2_LAKHS;
  if (loanTranche === 'first') return SVANIDHI_TRANCHE1_LAKHS;
  return SVANIDHI_TRANCHE1_LAKHS;
}

export function svanidhiTrancheTenorMonths(loanTranche?: string): number {
  if (loanTranche === 'third') return 36;
  if (loanTranche === 'second') return 18;
  return 12;
}

export const SVANIDHI_IMPACT_BULLETS = [
  'Own 10-step street-vendor WC pack for PM SVANidhi. Steps numbered 1–10.',
  'Step 1 asks CoV vs portal LoR + mandatory UPI + loan tranche (₹15k / ₹25k / ₹50k).',
  'Means of finance = own + bank WC tranche. 7% interest subsidy is not a capital grant line.',
  'Land/building tables hidden. Step 10: CoV/LoR, Aadhaar, passbook (+ UPI proof).',
];
