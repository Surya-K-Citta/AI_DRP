/**
 * SCLCSS Create New Latest DPR question catalog.
 * Spec: docs/schemes/SCLCSS/sclcss.md
 * Step list: SCLCSS_STEPS in schemeStepCatalog.ts (13 consecutive steps).
 */

type SclcssCategory = 'sc' | 'st';
type SclcssUnitStage = 'new' | 'existing';
type SclcssPremises = 'owned' | 'leased' | 'rented';

export const SCLCSS_EXTRA_FIELDS = [
  'sclcssCategory',
  'controllingStakePercent',
  'unitStage',
  'entrepreneurName',
  'entrepreneurAge',
  'udyamStatus',
  'existingTech',
  'proposedTech',
  'processOfManufacture',
  'installedCapacity',
  'capacityUtilisationY1',
  'premisesType',
  'powerRequirement',
] as const;


export const SCLCSS_CATEGORY_OPTIONS: { value: SclcssCategory; label: string }[] = [
  { value: 'sc', label: 'Scheduled Caste (SC)' },
  { value: 'st', label: 'Scheduled Tribe (ST)' },
];

export const SCLCSS_UNIT_STAGE_OPTIONS: { value: SclcssUnitStage; label: string }[] = [
  { value: 'existing', label: 'Existing MSE — tech upgrade / expansion' },
  { value: 'new', label: 'New SC/ST MSE — first plant & machinery' },
];

export const SCLCSS_PREMISES_OPTIONS: { value: SclcssPremises; label: string }[] = [
  { value: 'owned', label: 'Owned' },
  { value: 'leased', label: 'Leased' },
  { value: 'rented', label: 'Rented' },
];

/** Capital subsidy rate on eligible P&M. */
export const SCLCSS_SUBSIDY_PERCENT = 25;

/** Ceiling on capital subsidy (₹ lakhs). */
export const SCLCSS_SUBSIDY_CAP_LAKHS = 25;

/** Minimum SC/ST controlling stake % for non-sole proprietors. */
export const SCLCSS_MIN_STAKE_PERCENT = 51;

/** Indicative subsidy (₹ lakhs) = min(25% of eligible P&M, ₹25 L). */
export function sclcssIndicativeGrantLakhs(eligibleMachineryLakhs: number): number {
  if (!eligibleMachineryLakhs || eligibleMachineryLakhs <= 0) return 0;
  return Math.min((eligibleMachineryLakhs * SCLCSS_SUBSIDY_PERCENT) / 100, SCLCSS_SUBSIDY_CAP_LAKHS);
}

export const SCLCSS_IMPACT_BULLETS = [
  'Own 13-step tech-upgrade pack for SCLCSS (SC/ST only; 25% capital subsidy, cap ₹25 L). Steps numbered 1–13.',
  'Step 1 asks SC/ST category + ≥51% stake; Step 2 existing vs proposed technology.',
  'Step 9: SCLCSS grant on eligible new P&M (not land). General CLCSS is closed — non-SC/ST use AP Technology Upgrade.',
  'Step 13: caste certificate, Udyam, machinery tech quotes, CA FCI, term-loan sanction.',
];
