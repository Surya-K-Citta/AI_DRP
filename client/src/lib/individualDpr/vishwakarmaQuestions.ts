/**
 * PM Vishwakarma Create New Latest DPR question catalog.
 * Spec: docs/schemes/VISHWAKARMA/vishwakarma.md
 * Step list: VISHWAKARMA_STEPS in schemeStepCatalog.ts (12 consecutive steps).
 */

type VishwakarmaTrainingStage = 'notStarted' | 'basicDone' | 'advancedDone';
type VishwakarmaLoanTranche = 'noneYet' | 'first' | 'second';
type VishwakarmaWorkplace = 'home' | 'rentedShop' | 'ownShop' | 'other';
type VishwakarmaYesNo = 'yes' | 'no';

/** Official 18 trades (PIB / guidelines wording, form-friendly labels). */
export const VISHWAKARMA_CRAFTS = [
  'Carpenter (Suthar/Badhai)',
  'Boat Maker',
  'Armourer',
  'Blacksmith (Lohar)',
  'Hammer and Tool Kit Maker',
  'Locksmith',
  'Goldsmith (Sonar)',
  'Potter (Kumhaar)',
  'Sculptor (Moortikar, stone carver) / Stone breaker',
  'Cobbler (Charmkar) / Shoesmith / Footwear artisan',
  'Mason (Rajmistri)',
  'Basket/Mat/Broom Maker / Coir Weaver',
  'Doll & Toy Maker (Traditional)',
  'Barber (Naai)',
  'Garland maker (Malakaar)',
  'Washerman (Dhobi)',
  'Tailor (Darzi)',
  'Fishing Net Maker',
] as const;

export const VISHWAKARMA_EXTRA_FIELDS = [
  'craft',
  'currentTools',
  'newTools',
  'entrepreneurName',
  'entrepreneurAge',
  'experienceYears',
  'trainingStage',
  'loanTranche',
  'priorSelfEmploymentLoan',
  'processOfManufacture',
  'workplaceType',
  'powerRequirement',
] as const;


export const VISHWAKARMA_TRAINING_OPTIONS: {
  value: VishwakarmaTrainingStage;
  label: string;
}[] = [
  { value: 'notStarted', label: 'Not started / awaiting skill assessment' },
  { value: 'basicDone', label: 'Basic training completed' },
  { value: 'advancedDone', label: 'Advanced training completed' },
];

export const VISHWAKARMA_TRANCHE_OPTIONS: {
  value: VishwakarmaLoanTranche;
  label: string;
}[] = [
  { value: 'noneYet', label: 'None yet (toolkit / training first)' },
  { value: 'first', label: 'First tranche (up to ₹1 lakh)' },
  { value: 'second', label: 'Second tranche (up to ₹2 lakh)' },
];

export const VISHWAKARMA_WORKPLACE_OPTIONS: {
  value: VishwakarmaWorkplace;
  label: string;
}[] = [
  { value: 'home', label: 'Home / household workplace' },
  { value: 'rentedShop', label: 'Rented shop / stall' },
  { value: 'ownShop', label: 'Own shop / workshed' },
  { value: 'other', label: 'Other' },
];

export const VISHWAKARMA_YES_NO_OPTIONS: { value: VishwakarmaYesNo; label: string }[] = [
  { value: 'no', label: 'No — eligible (no similar loan in last 5 years)' },
  { value: 'yes', label: 'Yes — similar loan taken (usually ineligible)' },
];

/** Toolkit e-voucher ceiling in ₹ lakhs. */
export const VISHWAKARMA_TOOLKIT_LAKHS = 0.15;

/** First / second enterprise-loan ceilings in ₹ lakhs. */
const VISHWAKARMA_TRANCHE1_LAKHS = 1;
const VISHWAKARMA_TRANCHE2_LAKHS = 2;

/** Concessional interest charged to beneficiary (%). */
export const VISHWAKARMA_INTEREST_PERCENT = 5;

export function vishwakarmaTrancheCapLakhs(loanTranche?: string): number {
  if (loanTranche === 'second') return VISHWAKARMA_TRANCHE2_LAKHS;
  if (loanTranche === 'first') return VISHWAKARMA_TRANCHE1_LAKHS;
  return 0;
}

export const VISHWAKARMA_IMPACT_BULLETS = [
  'Own 12-step artisan pack for PM Vishwakarma (18 trades). Steps numbered 1–12.',
  'Step 1 asks exact craft + current/new tools + training stage + loan tranche — drives MoF and eligibility.',
  'Toolkit e-voucher up to ₹15,000 (0.15 L) + collateral-free enterprise loan ₹1 L then ₹2 L at 5%.',
  'Land/building tables hidden (home / light workplace). Step 12: Aadhaar, passbook, ration card, ID / toolkit quote.',
];
