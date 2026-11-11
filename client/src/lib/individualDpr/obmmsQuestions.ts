/**
 * AP OBMMS — Create New Latest DPR question catalog.
 * Spec: docs/schemes/OBMMS/obmms.md
 * Step list: OBMMS_STEPS (10 consecutive steps).
 */

export const OBMMS_EXTRA_FIELDS = [
  'welfareCorporation',
  'whiteRiceCard',
  'entrepreneurName',
  'entrepreneurAge',
  'activityTrade',
] as const;


export const OBMMS_CORP_OPTIONS = [
  { value: 'sc', label: 'SC Corporation' },
  { value: 'st', label: 'ST Corporation' },
  { value: 'bc', label: 'BC Corporation' },
  { value: 'kapu', label: 'Kapu Corporation' },
  { value: 'minority', label: 'Minority Corporation' },
  { value: 'other', label: 'Other welfare corp' },
];

export const OBMMS_YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

export const OBMMS_IMPACT_BULLETS = [
  'Own 10-step self-employment pack for AP OBMMS.',
  'Step 1 asks welfare corporation + white rice card.',
  'Subsidy % and unit cost vary by corporation GO — confirm on apobmms.apcfss.in.',
];
