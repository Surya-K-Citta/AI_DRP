/**
 * AP Food Processing Policy 4.0 — Create New Latest DPR question catalog.
 * Spec: docs/schemes/AP_FPP/apFpp.md
 * Step list: AP_FPP_STEPS (13 consecutive steps).
 */

export const AP_FPP_EXTRA_FIELDS = [
  'enterpriseSize',
  'specialCategory',
  'apDomicile',
  'fpoShg',
  'entrepreneurName',
  'processOfManufacture',
  'installedCapacity',
  'premisesType',
] as const;


export const AP_FPP_SIZE_OPTIONS = [
  { value: 'micro', label: 'Micro' },
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
];

export const AP_FPP_YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

export const AP_FPP_PREMISES_OPTIONS = [
  { value: 'own', label: 'Own land / building' },
  { value: 'lease', label: 'Lease / rent' },
  { value: 'apiic', label: 'APIIC / industrial park' },
  { value: 'other', label: 'Other' },
];

export const AP_FPP_IMPACT_BULLETS = [
  'Own 13-step food-unit pack for AP FPP 4.0.',
  'Step 1 asks size + special category / FPO-SHG.',
  'Mutually exclusive with AP_EDP capital subsidy on the same FCI.',
];
