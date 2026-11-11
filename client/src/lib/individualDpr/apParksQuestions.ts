/**
 * AP MSME-PARKS — Create New Latest DPR question catalog.
 * Spec: docs/schemes/AP_PARKS/apParks.md
 * Step list: AP_PARKS_STEPS (10 consecutive steps).
 */

export const AP_PARKS_EXTRA_FIELDS = [
  'apiicParkName',
  'plotArea',
  'landRebateClaim',
  'scStOrWomen',
  'entrepreneurName',
  'apDomicile',
] as const;


export const AP_PARKS_REBATE_OPTIONS = [
  { value: 'general', label: 'General rebate' },
  { value: 'scSt', label: 'SC / ST rebate' },
  { value: 'women', label: 'Women entrepreneur rebate' },
  { value: 'other', label: 'Other notified category' },
];

export const AP_PARKS_YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

export const AP_PARKS_IMPACT_BULLETS = [
  'Own 10-step park-allotment pack for AP MSME-PARKS.',
  'Step 1 asks park name + rebate claim category.',
  'Means of finance must show land cost net of APIIC / GO rebate.',
];
