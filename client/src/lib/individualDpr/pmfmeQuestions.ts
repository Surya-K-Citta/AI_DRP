/**
 * PMFME Create New Latest DPR question catalog.
 * Spec: docs/schemes/PMFME/pmfme.md
 * Step list: PMFME_STEPS in schemeStepCatalog.ts (14 consecutive steps).
 */

type PmfmeUnitStage = 'new' | 'existing';
type PmfmeFssai = 'yes' | 'planned';
type PmfmePremises = 'owned' | 'leased' | 'rented';
type PmfmeOdop = 'yes' | 'no';

export const PMFME_EXTRA_FIELDS = [
  'fssai',
  'unitStage',
  'odopAligned',
  'entrepreneurName',
  'entrepreneurAge',
  'existingTurnover',
  'processOfManufacture',
  'installedCapacity',
  'capacityUtilisationY1',
  'proposedWorkers',
  'rawMaterialSources',
  'premisesType',
  'powerRequirement',
  'directEmployment',
  'indirectEmployment',
  'impactNote',
] as const;


export const PMFME_UNIT_STAGE_OPTIONS: { value: PmfmeUnitStage; label: string }[] = [
  { value: 'new', label: 'New micro food processing unit' },
  { value: 'existing', label: 'Existing unit — upgrade / expansion' },
];

export const PMFME_FSSAI_OPTIONS: { value: PmfmeFssai; label: string }[] = [
  { value: 'yes', label: 'Already have FSSAI' },
  { value: 'planned', label: 'Will obtain / draft FSSAI' },
];

export const PMFME_ODOP_OPTIONS: { value: PmfmeOdop; label: string }[] = [
  { value: 'yes', label: 'Yes — district ODOP product' },
  { value: 'no', label: 'No — non-ODOP (still eligible)' },
];

export const PMFME_PREMISES_OPTIONS: { value: PmfmePremises; label: string }[] = [
  { value: 'owned', label: 'Owned' },
  { value: 'leased', label: 'Leased' },
  { value: 'rented', label: 'Rented' },
];

/** Credit-linked capital grant rate for individual micro units. */
export const PMFME_SUBSIDY_PERCENT = 35;

/** Ceiling on individual capital grant (₹ lakhs). */
export const PMFME_SUBSIDY_CAP_LAKHS = 10;

/** Minimum own contribution %. */
export const PMFME_MIN_OWN_PERCENT = 10;

/** Indicative grant (₹ lakhs) = min(35% of project cost, ₹10 L). */
export function pmfmeIndicativeGrantLakhs(projectCostLakhs: number): number {
  if (!projectCostLakhs || projectCostLakhs <= 0) return 0;
  return Math.min((projectCostLakhs * PMFME_SUBSIDY_PERCENT) / 100, PMFME_SUBSIDY_CAP_LAKHS);
}

export const PMFME_IMPACT_BULLETS = [
  'Own 14-step food-unit pack for PMFME (MoFPI credit-linked 35% grant, cap ₹10 L). Steps numbered 1–14.',
  'Step 1 asks new/existing, ODOP, FSSAI, entrepreneur — formalisation + eligibility.',
  'Step 9: own ≥10% + PMFME grant + bank must equal project cost (grant ≤ min(35%, ₹10 L)).',
  'Step 5 includes marketing channels + raw-material sources (MoFPI / NIFTEM model). Step 14: quotations, premises, FSSAI, Udyam.',
];
