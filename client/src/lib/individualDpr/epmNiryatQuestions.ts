/**
 * EPM Niryat Protsahan — Create New Latest DPR question catalog.
 * Spec: docs/schemes/EPM_NIRYAT/epmNiryat.md
 * Step list: EPM_NIRYAT_STEPS (7 consecutive steps).
 */

export const EPM_NIRYAT_EXTRA_FIELDS = [
  'exportMarkets',
  'hsnLines',
  'prePostShipment',
  'entrepreneurName',
  'exportCreditSought',
] as const;


export const EPM_NIRYAT_CREDIT_OPTIONS = [
  { value: 'pre', label: 'Pre-shipment' },
  { value: 'post', label: 'Post-shipment' },
  { value: 'both', label: 'Both pre + post' },
];

export const EPM_NIRYAT_IMPACT_BULLETS = [
  'Own 7-step export-credit pack for EPM Niryat Protsahan.',
  'Step 1 asks markets + HSN + pre/post-shipment credit sought.',
  'Interest subvention 2.75% is not a capital grant line.',
];
