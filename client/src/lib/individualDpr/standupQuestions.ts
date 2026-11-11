/**
 * Stand-Up India Create New Latest DPR question catalog.
 * Spec: docs/schemes/STANDUP/standup.md
 * Step list: STANDUP_STEPS in schemeStepCatalog.ts (13 consecutive steps).
 */

type StandupCategory = 'woman' | 'sc' | 'st';
type StandupPremises = 'owned' | 'leased' | 'rented';

export const STANDUP_EXTRA_FIELDS = [
  'standupCategory',
  'entrepreneurName',
  'entrepreneurAge',
  'controllingStakePercent',
  'loanAmountSought',
  'processOfManufacture',
  'installedCapacity',
  'capacityUtilisationY1',
  'premisesType',
] as const;


export const STANDUP_CATEGORY_OPTIONS: { value: StandupCategory; label: string }[] = [
  { value: 'woman', label: 'Woman entrepreneur' },
  { value: 'sc', label: 'Scheduled Caste (SC)' },
  { value: 'st', label: 'Scheduled Tribe (ST)' },
];

export const STANDUP_PREMISES_OPTIONS: { value: StandupPremises; label: string }[] = [
  { value: 'owned', label: 'Owned' },
  { value: 'leased', label: 'Leased' },
  { value: 'rented', label: 'Rented' },
];

/** Minimum own contribution % under scheme norms. */
export const STANDUP_MIN_OWN_PERCENT = 10;

export const STANDUP_IMPACT_BULLETS = [
  'Own 13-step bank-unit pack for Stand-Up India (₹10 L–₹1 Cr composite loan). Steps numbered 1–13.',
  'Step 1 asks woman / SC / ST, stake %, loan sought — hard eligibility.',
  'Own contribution must be at least 10% of project cost; bank funds the composite TL + WC.',
  'Step 5 includes buyers / competitors (bank checklist). Step 13: KYC, caste (if SC/ST), 51% ownership proof, quotations.',
];
