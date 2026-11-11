/**
 * PMEGP Create New Latest DPR question catalog.
 * Spec: docs/schemes/PMEGP/pmegp.md
 * Step list: PMEGP_STEPS in schemeStepCatalog.ts (14 consecutive steps).
 */

type PmegpCategory = 'general' | 'special';
type PmegpArea = 'rural' | 'urban';
type PmegpAgency = 'KVIC' | 'KVIB' | 'DIC';

/** Extra fields collected for PMEGP (stored in schemeExtras). */
export const PMEGP_EXTRA_FIELDS = [
  'pmegpCategory',
  'pmegpArea',
  'pmegpAgency',
  'entrepreneurName',
  'entrepreneurAge',
  'educationStatus',
  'executiveSummary',
  'processOfManufacture',
  'installedCapacity',
  'capacityUtilisationY1',
  'powerRequirement',
  'pmegpSubsidyPercent',
  'pmegpOwnPercent',
  'directEmployment',
  'indirectEmployment',
  'impactNote',
] as const;


export const PMEGP_CATEGORY_OPTIONS: { value: PmegpCategory; label: string }[] = [
  { value: 'general', label: 'General category' },
  {
    value: 'special',
    label: 'Special category (SC / ST / OBC / Minority / Women / Ex-serviceman / PwD)',
  },
];

export const PMEGP_AREA_OPTIONS: { value: PmegpArea; label: string }[] = [
  { value: 'rural', label: 'Rural' },
  { value: 'urban', label: 'Urban' },
];

export const PMEGP_AGENCY_OPTIONS: { value: PmegpAgency; label: string }[] = [
  { value: 'KVIC', label: 'KVIC' },
  { value: 'KVIB', label: 'State KVIB' },
  { value: 'DIC', label: 'DIC' },
];

export const PMEGP_EDUCATION_OPTIONS = [
  { value: 'below8th', label: 'Below 8th class' },
  { value: '8thPlus', label: '8th class pass or higher' },
];

/** Subsidy % from category × area (KVIC / AP MSME One reference rates). */
export function pmegpSubsidyPercent(category?: string, area?: string): number {
  const special = category === 'special';
  const rural = area === 'rural';
  if (rural && special) return 35;
  if (!rural && special) return 25;
  if (rural) return 25;
  return 15;
}

/** Typical own-contribution % (confirm live GO). */
export function pmegpOwnPercent(category?: string): number {
  return category === 'special' ? 5 : 10;
}

export const PMEGP_IMPACT_BULLETS = [
  'Own 14-step bank-unit DPR (not the vanilla 18-step skeleton). Steps are numbered 1–14 consecutively.',
  'Step 1 asks category, rural/urban, agency, entrepreneur — drives margin-money %.',
  'Step 2 includes Executive summary + process of manufacture (Fill this step suggests only these catalog questions).',
  'Step 9 treats Government Grant as PMEGP margin money; own + subsidy + bank must equal project cost.',
  'Step 14: quotations, building estimate, caste cert (special), 8th-pass if education gate applies.',
];
