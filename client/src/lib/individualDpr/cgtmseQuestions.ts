/**
 * CGTMSE — Create New Latest DPR question catalog (MUDRA-adjacent guarantee overlay).
 * Spec: docs/schemes/CGTMSE/cgtmse.md
 * Step list: CGTMSE_STEPS (12 consecutive steps).
 */

export const CGTMSE_EXTRA_FIELDS = [
  'loanPurpose',
  'womenOwned',
  'entrepreneurName',
  'proposedLimit',
] as const;


export const CGTMSE_PURPOSE_OPTIONS = [
  { value: 'termLoan', label: 'Term loan (P&M / shed)' },
  { value: 'wc', label: 'Working capital' },
  { value: 'composite', label: 'Composite (term + WC)' },
];

export const CGTMSE_WOMEN_OPTIONS = [
  { value: 'yes', label: 'Yes — women-owned (higher cover %)' },
  { value: 'no', label: 'No' },
];

export const CGTMSE_IMPACT_BULLETS = [
  'Own 12-step bank-unit pack for CGTMSE-covered MSE loans (MUDRA-adjacent guarantee path).',
  'Step 1 asks loan purpose + women-owned (cover %).',
  'Guarantee is taken by the bank — governmentGrant usually 0.',
];
