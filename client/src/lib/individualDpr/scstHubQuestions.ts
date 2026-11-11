/**
 * National SC/ST Hub — Create New Latest DPR question catalog.
 * Spec: docs/schemes/SCST_HUB/scstHub.md
 * Step list: SCST_HUB_STEPS (5 consecutive steps).
 */

type GemExperience = 'none' | 'registered' | 'bidding' | 'won';

export const SCST_HUB_EXTRA_FIELDS = [
  'gemExperience',
  'entrepreneurName',
  'sclcssCategory',
  'procurementFocus',
] as const;


export const SCST_HUB_GEM_OPTIONS: { value: GemExperience; label: string }[] = [
  { value: 'none', label: 'Not on GeM yet' },
  { value: 'registered', label: 'GeM registered' },
  { value: 'bidding', label: 'Have bid on GeM' },
  { value: 'won', label: 'Have won GeM orders' },
];

export const SCST_HUB_CATEGORY_OPTIONS = [
  { value: 'sc', label: 'Scheduled Caste (SC)' },
  { value: 'st', label: 'Scheduled Tribe (ST)' },
];

export const SCST_HUB_IMPACT_BULLETS = [
  'Own 5-step procurement-readiness pack for National SC/ST Hub — not a term loan by itself.',
  'Step 1 asks SC/ST category + GeM experience.',
  'Step 5: Caste certificate, Udyam, cancelled cheque.',
];
