/**
 * AP CMEP — Create New Latest DPR question catalog.
 * Spec: docs/schemes/AP_CMEP/apCmep.md
 * Step list: AP_CMEP_STEPS (13 consecutive steps).
 */

export const AP_CMEP_EXTRA_FIELDS = [
  'activityBand',
  'boosterCategory',
  'apDomicile',
  'entrepreneurName',
  'executiveSummary',
  'processOfManufacture',
  'premisesType',
  'cmepArea',
  'edpStatus',
  'priorSubsidy',
  'familyExclusive',
] as const;


export const AP_CMEP_ACTIVITY_OPTIONS = [
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'knowledge', label: 'Knowledge / service enterprise' },
];

export const AP_CMEP_BOOSTER_OPTIONS = [
  { value: 'none', label: 'General (no booster)' },
  { value: 'woman', label: 'Woman entrepreneur' },
  { value: 'pwd', label: 'PwD' },
  { value: 'exServiceman', label: 'Ex-serviceman' },
  { value: 'transgender', label: 'Transgender' },
];

export const AP_CMEP_YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

export const AP_CMEP_AREA_OPTIONS = [
  { value: 'urban', label: 'Urban' },
  { value: 'rural', label: 'Rural' },
];

export const AP_CMEP_EDP_OPTIONS = [
  { value: 'completed', label: 'EDP completed' },
  { value: 'pending', label: 'EDP still pending' },
];

export const AP_CMEP_IMPACT_BULLETS = [
  'Own 13-step greenfield pack for AP CMEP (distinct UI from PMEGP / other schemes).',
  'Step 1 asks mfg vs knowledge + booster (woman/PwD/ex-serviceman/transgender).',
  'Step 2 includes Executive summary + process of manufacture.',
  'Must be bank-linked — zero-loan projects are out of scope.',
];
