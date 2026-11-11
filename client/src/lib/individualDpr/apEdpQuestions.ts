/**
 * AP MSME-EDP 4.0 (new-unit capital subsidy) Create New Latest DPR question catalog.
 * Spec: docs/schemes/AP_EDP/apEdp.md
 * Step list: AP_EDP_STEPS in schemeStepCatalog.ts (13 consecutive steps).
 */

type ApEdpEnterpriseSize = 'micro' | 'small' | 'medium';
type ApEdpPremises = 'owned' | 'leased' | 'rented';
type ApEdpYesNo = 'yes' | 'no';

export const AP_EDP_EXTRA_FIELDS = [
  'enterpriseSize',
  'specialCategory',
  'scStOwned',
  'apDomicile',
  'apiicPark',
  'entrepreneurName',
  'entrepreneurAge',
  'processOfManufacture',
  'installedCapacity',
  'capacityUtilisationY1',
  'premisesType',
  'powerRequirement',
] as const;


export const AP_EDP_SIZE_OPTIONS: { value: ApEdpEnterpriseSize; label: string }[] = [
  { value: 'micro', label: 'Micro' },
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
];

export const AP_EDP_YES_NO_OPTIONS: { value: ApEdpYesNo; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

export const AP_EDP_PREMISES_OPTIONS: { value: ApEdpPremises; label: string }[] = [
  { value: 'owned', label: 'Owned' },
  { value: 'leased', label: 'Leased' },
  { value: 'rented', label: 'Rented' },
];

/** Capital subsidy % of FCI from amendment para 6.3 (confirm live GO). */
export function apEdpSubsidyPercent(enterpriseSize?: string, specialCategory?: string): number {
  const special = specialCategory === 'yes';
  if (special) {
    if (enterpriseSize === 'medium') return 35;
    return 45; // micro / small
  }
  return 25;
}

/** Cap on capital subsidy in ₹ lakhs (amendment table). */
export function apEdpSubsidyCapLakhs(enterpriseSize?: string, specialCategory?: string): number {
  const special = specialCategory === 'yes';
  if (enterpriseSize === 'micro') return special ? 45 : 25;
  if (enterpriseSize === 'small') return special ? 450 : 150;
  if (enterpriseSize === 'medium') return 700;
  return special ? 45 : 25;
}

/** Indicative capital subsidy (₹ lakhs) = min(rate × FCI, size/category cap). */
export function apEdpIndicativeGrantLakhs(
  fciLakhs: number,
  enterpriseSize?: string,
  specialCategory?: string
): number {
  if (!fciLakhs || fciLakhs <= 0) return 0;
  const rate = apEdpSubsidyPercent(enterpriseSize, specialCategory);
  const cap = apEdpSubsidyCapLakhs(enterpriseSize, specialCategory);
  return Math.min((fciLakhs * rate) / 100, cap);
}

/** APIIC land-cost rebate: 75% of land, cap ₹25 L — SC/ST micro/small in APIIC park. */
export const AP_EDP_LAND_REBATE_PERCENT = 75;
export const AP_EDP_LAND_REBATE_CAP_LAKHS = 25;

export function apEdpLandRebateEligible(
  apiicPark?: string,
  scStOwned?: string,
  enterpriseSize?: string
): boolean {
  if (apiicPark !== 'yes' || scStOwned !== 'yes') return false;
  return enterpriseSize === 'micro' || enterpriseSize === 'small' || !enterpriseSize;
}

export function apEdpIndicativeLandRebateLakhs(
  landLakhs: number,
  apiicPark?: string,
  scStOwned?: string,
  enterpriseSize?: string
): number {
  if (!apEdpLandRebateEligible(apiicPark, scStOwned, enterpriseSize)) return 0;
  if (!landLakhs || landLakhs <= 0) return 0;
  return Math.min((landLakhs * AP_EDP_LAND_REBATE_PERCENT) / 100, AP_EDP_LAND_REBATE_CAP_LAKHS);
}

export const AP_EDP_IMPACT_BULLETS = [
  'Own 13-step greenfield pack for AP MSME-EDP 4.0 capital subsidy (para 6.3). Steps numbered 1–13.',
  'Step 1 asks micro/small/medium + special category + APIIC park + SC/ST — drives 25%/45%/35% FCI rates and land-rebate hint.',
  'Step 9: state capital subsidy on new-unit FCI; mutually exclusive with tech-upgrade; total incentives ≤ 75% FCI.',
  'Step 13: Udyam, land/shed, CFE/CFO, CA FCI, AP domicile proof.',
];
