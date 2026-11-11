/**
 * PTUAS — Create New Latest DPR question catalog.
 * Spec: docs/schemes/PTUAS/ptuas.md
 * Step list: PTUAS_STEPS (13 consecutive steps).
 */

export const PTUAS_EXTRA_FIELDS = [
  'gmpStatus',
  'productLicence',
  'entrepreneurName',
  'existingTech',
  'proposedTech',
  'processOfManufacture',
] as const;


export const PTUAS_GMP_OPTIONS = [
  { value: 'gmp', label: 'WHO-GMP / Schedule M compliant' },
  { value: 'partial', label: 'Partial / upgrading to GMP' },
  { value: 'none', label: 'Not yet GMP' },
];

export const PTUAS_IMPACT_BULLETS = [
  'Own 13-step pharma upgrade pack for PTUAS.',
  'Step 1 asks GMP status + product licence.',
  'Step 13: manufacturing licence, pollution consent, quotations, CA FCI, Udyam.',
];
