/**
 * RAMP TEAM (ONDC) — Create New Latest DPR question catalog.
 * Spec: docs/schemes/RAMP_TEAM/rampTeam.md
 * Step list: RAMP_TEAM_STEPS (5 consecutive steps).
 */

export const RAMP_TEAM_EXTRA_FIELDS = [
  'ondcReady',
  'catalogueSkus',
  'entrepreneurName',
  'productListNote',
] as const;


export const RAMP_TEAM_ONDC_OPTIONS = [
  { value: 'ready', label: 'Ready to onboard / already on ONDC' },
  { value: 'planning', label: 'Planning catalogue / onboarding' },
  { value: 'early', label: 'Early exploration' },
];

export const RAMP_TEAM_IMPACT_BULLETS = [
  'Own 5-step ONDC market-access pack for RAMP TEAM.',
  'Step 1 asks ONDC readiness + catalogue SKUs.',
  'Not a machinery subsidy — use a loan DPR separately if needed.',
];
