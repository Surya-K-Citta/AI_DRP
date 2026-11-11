/**
 * MUDRA (PMMY) Create New Latest DPR question catalog.
 * Spec: docs/schemes/MUDRA/mudra.md
 * Step list: MUDRA_STEPS in schemeStepCatalog.ts (12 consecutive steps).
 */

type MudraCategory = 'shishu' | 'kishore' | 'tarun' | 'tarunPlus';
type MudraPremises = 'owned' | 'rented';

export const MUDRA_EXTRA_FIELDS = [
  'mudraCategory',
  'entrepreneurName',
  'entrepreneurAge',
  'experienceYears',
  'premisesType',
  'loanPurpose',
] as const;


export const MUDRA_CATEGORY_OPTIONS: { value: MudraCategory; label: string }[] = [
  { value: 'shishu', label: 'Shishu (up to ₹50,000)' },
  { value: 'kishore', label: 'Kishore (above ₹50,000 to ₹5 lakh)' },
  { value: 'tarun', label: 'Tarun (above ₹5 lakh to ₹10 lakh)' },
  { value: 'tarunPlus', label: 'Tarun Plus (above ₹10 lakh to ₹20 lakh)' },
];

export const MUDRA_PREMISES_OPTIONS: { value: MudraPremises; label: string }[] = [
  { value: 'owned', label: 'Owned' },
  { value: 'rented', label: 'Rented' },
];

export const MUDRA_LOAN_PURPOSE_OPTIONS = [
  { value: 'term', label: 'Term loan (machinery / fixed assets)' },
  { value: 'wc', label: 'Working capital' },
  { value: 'both', label: 'Term loan + working capital' },
];


export const MUDRA_IMPACT_BULLETS = [
  'Own 12-step bank-unit PMMY pack (not the vanilla 18-step skeleton). Steps numbered 1–12.',
  'Step 1 asks Shishu / Kishore / Tarun / Tarun Plus — drives form depth and uploads.',
  'No PMEGP-style margin money. Means of finance = own + bank (+ other).',
  'Shishu/Kishore: land/building tables hidden when VM budget is under ₹5L; Nayak WC hint on viability.',
  'Step 12 uploads: shop proof, bank statements, quotes (+ Mudra closure if Tarun Plus).',
];
