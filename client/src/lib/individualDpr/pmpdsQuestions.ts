/**
 * PMPDS — Create New Latest DPR question catalog.
 * Spec: docs/schemes/PMPDS/pmpds.md
 * Step list: PMPDS_STEPS (5 consecutive steps).
 */

export const PMPDS_EXTRA_FIELDS = [
  'deviceOrFormulation',
  'entrepreneurName',
  'promotionNeed',
] as const;


export const PMPDS_FOCUS_OPTIONS = [
  { value: 'formulation', label: 'Formulation / pharma product' },
  { value: 'device', label: 'Medical device' },
  { value: 'both', label: 'Both / allied' },
];

export const PMPDS_IMPACT_BULLETS = [
  'Own 5-step promotion pack for PMPDS.',
  'Step 1 asks device / formulation focus.',
  'Use full bank DPR only if the same unit also needs term-loan capex.',
];
