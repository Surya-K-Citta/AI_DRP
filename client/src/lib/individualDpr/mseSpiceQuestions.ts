/**
 * RAMP MSE-SPICE — Create New Latest DPR question catalog.
 * Spec: docs/schemes/MSE_SPICE/mseSpice.md
 * Step list: MSE_SPICE_STEPS (12 consecutive steps).
 */

export const MSE_SPICE_EXTRA_FIELDS = [
  'circularSector',
  'existingUnitYears',
  'entrepreneurName',
  'proposedPmCost',
  'processOfManufacture',
] as const;


export const MSE_SPICE_SECTOR_OPTIONS = [
  { value: 'plastic', label: 'Plastic recycling / circular' },
  { value: 'ewaste', label: 'E-waste' },
  { value: 'textile', label: 'Textile waste / circular fashion' },
  { value: 'other', label: 'Other circular economy' },
];

export const MSE_SPICE_IMPACT_BULLETS = [
  'Own 12-step circular-economy upgrade pack for MSE-SPICE.',
  'Step 1 asks circular sector + existing unit years.',
  'Subsidy 25% of new P&M capped ₹12.5 L; second-hand ineligible.',
];
