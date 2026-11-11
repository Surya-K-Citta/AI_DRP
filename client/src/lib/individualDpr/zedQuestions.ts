/**
 * MSME Sustainable ZED Certification — Create New Latest DPR question catalog.
 * Spec: docs/schemes/ZED/zed.md
 * Step list: ZED_STEPS (5 consecutive steps).
 */

type ZedLevel = 'none' | 'bronze' | 'silver' | 'gold';

export const ZED_EXTRA_FIELDS = [
  'zedCurrentLevel',
  'zedTargetLevel',
  'entrepreneurName',
  'qualityFocus',
] as const;


export const ZED_LEVEL_OPTIONS: { value: ZedLevel; label: string }[] = [
  { value: 'none', label: 'Not certified yet' },
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
];

export const ZED_IMPACT_BULLETS = [
  'Own 5-step certification pack for MSME Sustainable ZED — not a bank term-loan DPR.',
  'Step 1 asks current vs target ZED level (Bronze / Silver / Gold).',
  'No land/building FCI or 5-year P&L. Step 5: Udyam, Aadhaar/PAN.',
];
