/**
 * Coir Vikas Yojana — Create New Latest DPR question catalog.
 * Spec: docs/schemes/CVY/cvy.md
 * Step list: CVY_STEPS (12 consecutive steps).
 */

export const CVY_EXTRA_FIELDS = [
  'coirProductLine',
  'coirBoardStatus',
  'entrepreneurName',
  'premisesType',
] as const;


export const CVY_BOARD_STATUS_OPTIONS = [
  { value: 'registered', label: 'Registered with Coir Board' },
  { value: 'applied', label: 'Application in progress' },
  { value: 'notYet', label: 'Not yet registered' },
];

export const CVY_PREMISES_OPTIONS = [
  { value: 'own', label: 'Own shed / workshed' },
  { value: 'lease', label: 'Leased / rented' },
  { value: 'home', label: 'Home-based coir unit' },
  { value: 'other', label: 'Other' },
];

export const CVY_IMPACT_BULLETS = [
  'Own 12-step coir-unit pack for Coir Vikas Yojana.',
  'Step 1 asks coir product line + Coir Board status.',
  'Step 12: Coir Board docs, quotations, Udyam.',
];
