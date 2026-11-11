/**
 * PMEGP 2nd Loan (upgrade) Create New Latest DPR question catalog.
 * Spec: docs/schemes/PMEGP_2ND/pmegp2nd.md
 * Step list: PMEGP_2ND_STEPS in schemeStepCatalog.ts (14 consecutive steps).
 */

type Pmegp2ndPriorScheme = 'PMEGP' | 'REGP' | 'MUDRA';
type Pmegp2ndAgency = 'KVIC' | 'KVIB' | 'DIC';
type Pmegp2ndSectorBand = 'manufacturing' | 'service';
type Pmegp2ndYesNo = 'yes' | 'no';

export const PMEGP_2ND_EXTRA_FIELDS = [
  'priorScheme',
  'priorSanctionAmount',
  'firstSubsidyYear',
  'marginMoneyAdjusted',
  'firstLoanRepaid',
  'yearsProfitable',
  'existingTurnover',
  'pmegpAgency',
  'nerHill',
  'sectorBand',
  'entrepreneurName',
  'entrepreneurAge',
  'processOfManufacture',
  'existingCapacity',
  'installedCapacity',
  'capacityUtilisationY1',
  'powerRequirement',
  'existingTech',
  'proposedTech',
  'directEmployment',
  'indirectEmployment',
  'impactNote',
] as const;


export const PMEGP_2ND_PRIOR_SCHEME_OPTIONS: { value: Pmegp2ndPriorScheme; label: string }[] = [
  { value: 'PMEGP', label: 'PMEGP (1st loan)' },
  { value: 'REGP', label: 'REGP' },
  { value: 'MUDRA', label: 'MUDRA' },
];

export const PMEGP_2ND_AGENCY_OPTIONS: { value: Pmegp2ndAgency; label: string }[] = [
  { value: 'KVIC', label: 'KVIC' },
  { value: 'KVIB', label: 'State KVIB' },
  { value: 'DIC', label: 'DIC' },
];

export const PMEGP_2ND_SECTOR_BAND_OPTIONS: { value: Pmegp2ndSectorBand; label: string }[] = [
  { value: 'manufacturing', label: 'Manufacturing (ceiling ₹1 crore)' },
  { value: 'service', label: 'Business / Service / Trading (ceiling ₹25 lakh)' },
];

export const PMEGP_2ND_YES_NO_OPTIONS: { value: Pmegp2ndYesNo; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

/** Own contribution % — uniform for all categories on 2nd loan. */
export const PMEGP_2ND_OWN_PERCENT = 10;

/** Margin money % — uniform; 20% if NER / Hill. */
export function pmegp2ndSubsidyPercent(nerHill?: string): number {
  return nerHill === 'yes' ? 20 : 15;
}

/** Max project cost (₹ lakhs) by sector band. */
function pmegp2ndMaxProjectLakhs(sectorBand?: string): number {
  return sectorBand === 'service' ? 25 : 100;
}

/** Indicative MM (₹ lakhs) = rate × min(projectCost, ceiling). */
export function pmegp2ndIndicativeMmLakhs(
  projectCostLakhs: number,
  sectorBand?: string,
  nerHill?: string
): number {
  if (!projectCostLakhs || projectCostLakhs <= 0) return 0;
  const capped = Math.min(projectCostLakhs, pmegp2ndMaxProjectLakhs(sectorBand));
  return (capped * pmegp2ndSubsidyPercent(nerHill)) / 100;
}

export const PMEGP_2ND_IMPACT_BULLETS = [
  'Own 14-step upgrade pack for PMEGP 2nd loan (brownfield only). Steps numbered 1–14.',
  'Step 1 asks prior PMEGP/REGP/MUDRA, MM adjusted, repayment, profit years — hard eligibility.',
  'Step 9: own 10% + uniform MM 15% (20% NER/Hill) + bank = project cost. Not first-PMEGP category rates.',
  'Step 14: prior sanction letter, CA existing investment, quotations, Udyam.',
];
