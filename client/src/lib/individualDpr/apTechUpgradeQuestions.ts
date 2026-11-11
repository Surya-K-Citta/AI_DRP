/**
 * AP Technology Upgradation Create New Latest DPR question catalog.
 * Spec: docs/schemes/AP_TECH_UPGRADE/apTechUpgrade.md
 * Step list: AP_TECH_UPGRADE_STEPS in schemeStepCatalog.ts (13 consecutive steps).
 */

type ApTechEnterpriseSize = 'micro' | 'small' | 'medium';
type ApTechPremises = 'owned' | 'leased' | 'rented';
type ApTechYesNo = 'yes' | 'no';

export const AP_TECH_EXTRA_FIELDS = [
  'enterpriseSize',
  'specialCategory',
  'apDomicile',
  'entrepreneurName',
  'entrepreneurAge',
  'yearsInOperation',
  'existingTurnover',
  'existingTech',
  'proposedTech',
  'processOfManufacture',
  'productivityGain',
  'existingCapacity',
  'installedCapacity',
  'capacityUtilisationY1',
  'premisesType',
  'powerRequirement',
] as const;


export const AP_TECH_SIZE_OPTIONS: { value: ApTechEnterpriseSize; label: string }[] = [
  { value: 'micro', label: 'Micro' },
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
];

export const AP_TECH_YES_NO_OPTIONS: { value: ApTechYesNo; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

export const AP_TECH_PREMISES_OPTIONS: { value: ApTechPremises; label: string }[] = [
  { value: 'owned', label: 'Owned' },
  { value: 'leased', label: 'Leased' },
  { value: 'rented', label: 'Rented' },
];

/** Subsidy % of FCI from amendment para 6.4 (confirm live GO). */
export function apTechSubsidyPercent(enterpriseSize?: string, specialCategory?: string): number {
  const special = specialCategory === 'yes';
  if (special) {
    if (enterpriseSize === 'medium') return 30;
    return 40; // micro / small
  }
  return 20;
}

/** Cap on subsidy in ₹ lakhs (amendment table). */
export function apTechSubsidyCapLakhs(enterpriseSize?: string, specialCategory?: string): number {
  const special = specialCategory === 'yes';
  if (enterpriseSize === 'micro') return special ? 40 : 20;
  if (enterpriseSize === 'small') return special ? 400 : 200;
  if (enterpriseSize === 'medium') return 500;
  return special ? 40 : 20;
}

/** Indicative subsidy (₹ lakhs) = min(rate × FCI, size/category cap). */
export function apTechIndicativeGrantLakhs(
  fciLakhs: number,
  enterpriseSize?: string,
  specialCategory?: string
): number {
  if (!fciLakhs || fciLakhs <= 0) return 0;
  const rate = apTechSubsidyPercent(enterpriseSize, specialCategory);
  const cap = apTechSubsidyCapLakhs(enterpriseSize, specialCategory);
  return Math.min((fciLakhs * rate) / 100, cap);
}

export const AP_TECH_IMPACT_BULLETS = [
  'Own 13-step brownfield pack for AP Technology Upgradation (MSME-EDP 4.0 para 6.4). Steps numbered 1–13.',
  'Step 1 asks micro/small/medium + special category (AP domicile) — drives 20%/40%/30% FCI rates and caps.',
  'Step 9: state tech-upgrade subsidy on upgrade FCI; mutually exclusive with new-unit EDP capital subsidy; total incentives ≤ 75% FCI.',
  'Step 13: Udyam, old machinery list, new quotes, CA FCI, AP domicile proof.',
];
