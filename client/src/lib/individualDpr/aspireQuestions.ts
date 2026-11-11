/**
 * ASPIRE — Create New Latest DPR question catalog.
 * Spec: docs/schemes/ASPIRE/aspire.md
 * Step list: ASPIRE_STEPS (10 consecutive steps).
 */

export const ASPIRE_EXTRA_FIELDS = [
  'incubatorName',
  'entrepreneurName',
  'entrepreneurAge',
  'innovationBrief',
  'livelihoodFocus',
  'premisesType',
] as const;


export const ASPIRE_PREMISES_OPTIONS = [
  { value: 'incubator', label: 'Incubator / LBI space' },
  { value: 'home', label: 'Home / village workplace' },
  { value: 'rented', label: 'Rented shed / shop' },
  { value: 'other', label: 'Other' },
];

export const ASPIRE_IMPACT_BULLETS = [
  'Own 10-step rural innovation / livelihood pack for ASPIRE — lighter than a factory term-loan DPR.',
  'Step 1 asks incubator name + innovation / livelihood brief.',
  'Land/building kept light. Step 10: rural address proof, concept note, Udyam if ready.',
];
