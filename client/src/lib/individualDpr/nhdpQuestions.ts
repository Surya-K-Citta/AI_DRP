/**
 * National Handloom Development Programme — Create New Latest DPR question catalog.
 * Spec: docs/schemes/NHDP/nhdp.md
 * Step list: NHDP_STEPS (10 consecutive steps).
 */

type NhdpLoomType = 'pit' | 'frame' | 'jacquard' | 'other';

export const NHDP_EXTRA_FIELDS = [
  'loomType',
  'weaverId',
  'entrepreneurName',
  'entrepreneurAge',
  'yarnSource',
  'productLine',
  'premisesType',
] as const;


export const NHDP_LOOM_OPTIONS: { value: NhdpLoomType; label: string }[] = [
  { value: 'pit', label: 'Pit loom' },
  { value: 'frame', label: 'Frame loom' },
  { value: 'jacquard', label: 'Jacquard / semi-automatic' },
  { value: 'other', label: 'Other' },
];

export const NHDP_PREMISES_OPTIONS = [
  { value: 'home', label: 'Home loom shed' },
  { value: 'weaversColony', label: 'Weavers’ colony / co-op shed' },
  { value: 'rented', label: 'Rented workplace' },
  { value: 'other', label: 'Other' },
];

export const NHDP_IMPACT_BULLETS = [
  'Own 10-step weaver / handloom pack for NHDP — lighter than a factory DPR.',
  'Step 1 asks loom type + weaver ID / handloom corp membership.',
  'Land/building tables hidden. Step 10: Weaver ID, Aadhaar, passbook.',
];
