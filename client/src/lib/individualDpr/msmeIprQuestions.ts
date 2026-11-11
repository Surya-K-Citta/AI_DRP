/**
 * MSME Innovative — IPR component Create New Latest DPR question catalog.
 * Spec: docs/schemes/MSME_IPR/msmeIpr.md
 * Step list: MSME_IPR_STEPS (5 consecutive steps).
 */

type IprType = 'patent' | 'design' | 'trademark' | 'gi' | 'other';
type IprFilingStage = 'idea' | 'draft' | 'filed' | 'granted';

export const MSME_IPR_EXTRA_FIELDS = [
  'ipType',
  'filingStage',
  'entrepreneurName',
  'inventionTitle',
] as const;


export const MSME_IPR_TYPE_OPTIONS: { value: IprType; label: string }[] = [
  { value: 'patent', label: 'Patent' },
  { value: 'design', label: 'Design' },
  { value: 'trademark', label: 'Trademark' },
  { value: 'gi', label: 'Geographical Indication (GI)' },
  { value: 'other', label: 'Other IP' },
];

export const MSME_IPR_STAGE_OPTIONS: { value: IprFilingStage; label: string }[] = [
  { value: 'idea', label: 'Idea / prior art search' },
  { value: 'draft', label: 'Specification draft ready' },
  { value: 'filed', label: 'Already filed' },
  { value: 'granted', label: 'Granted / registered' },
];

export const MSME_IPR_IMPACT_BULLETS = [
  'Own 5-step IP filing pack for MSME Innovative (IPR) — not a plant term-loan DPR.',
  'Step 1 asks IP type + filing stage.',
  'Step 5: Udyam, Aadhaar/PAN (+ draft specification / TM search as needed).',
];
