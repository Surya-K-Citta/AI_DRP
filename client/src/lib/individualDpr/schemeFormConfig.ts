import { Budget, VentureMatchAnswers } from '@/lib/ventureMatch/types';
import { SCHEMES } from '@/lib/ventureMatch/schemes';

export const SCHEME_OPTIONS = [
  { code: '', label: 'Vanilla bank term loan (standard individual DPR)' },
  ...SCHEMES.map((s) => ({ code: s.code, label: s.name })),
];

export const SCHEME_EXTRA_FIELDS: Record<string, string[]> = {
  VISHWAKARMA: ['craft', 'currentTools', 'newTools'],
  SVANIDHI: ['covOrLor', 'upiQr'],
  PMFME: ['fssai'],
  AP_EDP: ['apiicPark'],
};

export function extraFieldsForScheme(schemeCode: string | null | undefined): string[] {
  if (!schemeCode) return [];
  return SCHEME_EXTRA_FIELDS[schemeCode] || [];
}

export function isSchemeExtraField(field: string, schemeCode?: string | null): boolean {
  const known = Object.values(SCHEME_EXTRA_FIELDS).flat();
  if (!known.includes(field)) return false;
  if (!schemeCode) return true;
  return extraFieldsForScheme(schemeCode).includes(field);
}

export const VISHWAKARMA_CRAFTS = [
  'Carpenter (Suthar)',
  'Boat Maker',
  'Armourer',
  'Blacksmith',
  'Hammer and Tool Kit Maker',
  'Locksmith',
  'Sculptor',
  'Stone breaker / Stone carver',
  'Goldsmith',
  'Potter',
  'Sculptor (metal/stone/wood)',
  'Cobbler / Shoemaker',
  'Mason',
  'Basket/Mat/Broom Maker / Coir Weaver',
  'Doll & Toy Maker',
  'Barber',
  'Garland Maker',
  'Washerman',
  'Tailor',
  'Fishing Net Maker',
];

export type UploadField = { id: string; label: string };

const DEFAULT_UPLOADS: UploadField[] = [
  { id: 'aadhaarPan', label: 'Aadhaar / PAN' },
  { id: 'udyamCertificate', label: 'Udyam Certificate' },
  { id: 'bankPassbook', label: 'Bank Passbook' },
  { id: 'machineryQuotations', label: 'Machinery / Equipment Quotations' },
];

const SHISHU_KISHORE: Budget[] = ['under2L', '2to5L'];

export function isMudraShishuKishore(code: string | null, budget?: Budget): boolean {
  return code === 'MUDRA' && !!budget && SHISHU_KISHORE.includes(budget);
}

export function isMudraTarunPlus(code: string | null, budget?: Budget): boolean {
  return code === 'MUDRA' && (budget === '50Lto1Cr' || budget === '1to10Cr' || budget === 'above10Cr');
}

export function getHiddenSteps(code: string | null): number[] {
  if (code === 'VISHWAKARMA' || code === 'SVANIDHI') return [15, 16, 17];
  return [];
}

export function hideComplexCapex(code: string | null, budget?: Budget): boolean {
  return isMudraShishuKishore(code, budget);
}

export function showDscr(bankLoanLakhs: number): boolean {
  return (bankLoanLakhs || 0) > 0;
}

export function showPmegpEducationGate(
  code: string | null,
  activity: string | undefined,
  totalCostLakhs: number
): boolean {
  if (code !== 'PMEGP') return false;
  const mfg = activity === 'mfg' || activity === 'food' || activity === 'craft';
  const service = activity === 'service' || activity === 'trade' || activity === 'vending';
  if (mfg && totalCostLakhs > 10) return true;
  if (service && totalCostLakhs > 5) return true;
  return false;
}

export function getVisibleSteps(code: string | null): number[] {
  const hidden = new Set(getHiddenSteps(code));
  return Array.from({ length: 18 }, (_, i) => i + 1).filter((s) => !hidden.has(s));
}

export function getStepTitle(step: number): string {
  const titles: Record<number, string> = {
    1: 'Step 1: Your unit – basic details',
    2: 'Step 2: Sector overview',
    3: 'Step 3: District & location',
    4: 'Step 4: Your unit profile',
    5: 'Step 5: Value chain',
    6: 'Step 6: Market',
    7: 'Step 7: Gaps',
    8: 'Step 8: SWOT',
    9: 'Step 9: What you plan to do',
    10: 'Step 10: Workplace / shed / unit',
    11: 'Step 11: Applicant / firm',
    12: 'Step 12: Project cost',
    13: 'Step 13: Means of finance',
    14: 'Step 14: Operating cost & sales',
    15: 'Step 15: Financial viability',
    16: 'Step 16: Implementation schedule',
    17: 'Step 17: Expected impact',
    18: 'Step 18: Document uploads',
  };
  return titles[step] || `Step ${step}`;
}

export function getStep18Uploads(
  code: string | null,
  answers?: VentureMatchAnswers | null
): UploadField[] {
  if (code === 'VISHWAKARMA') {
    return [
      { id: 'aadhaarPan', label: 'Aadhaar' },
      { id: 'bankPassbook', label: 'Savings Bank Passbook' },
      { id: 'rationCard', label: 'Ration Card (family verification)' },
    ];
  }
  if (code === 'SVANIDHI') {
    return [{ id: 'covOrLor', label: 'Certificate of Vending (CoV) or Letter of Recommendation' }];
  }
  if (code === 'PMFME') {
    return [
      { id: 'machineryQuotations', label: 'Machinery Quotations' },
      { id: 'premisesLease', label: 'Land / Premises Lease' },
      { id: 'fssaiDraft', label: 'Draft FSSAI Registration' },
    ];
  }
  if (code === 'PMEGP') {
    const uploads: UploadField[] = [
      { id: 'machineryQuotations', label: 'Machinery Quotations' },
      { id: 'buildingEstimates', label: 'Building Estimate' },
    ];
    const owner = answers?.owner || [];
    if (owner.some((o) => ['sc', 'st', 'bc'].includes(o))) {
      uploads.push({ id: 'casteCertificate', label: 'Caste Certificate' });
    }
    return uploads;
  }
  if (code === 'AP_EDP') {
    return [
      { id: 'landShedAllotment', label: 'Land / Shed Allotment' },
      { id: 'cfeCfo', label: 'Single Desk Pollution Clearances (CFE/CFO)' },
      { id: 'caFciStatement', label: 'CA-certified FCI Statement' },
    ];
  }
  if (code === 'MUDRA') {
    const uploads: UploadField[] = [
      { id: 'shopAddressProof', label: 'Shop Address Proof' },
      { id: 'bankStatements', label: 'Bank Statements' },
      { id: 'machineryQuotations', label: 'Machinery / Equipment Quotations' },
    ];
    if (isMudraTarunPlus(code, answers?.budget)) {
      uploads.push({ id: 'mudraClosure', label: 'Previous Mudra Loan Repayment / Closure Certificate' });
    }
    return uploads;
  }
  return DEFAULT_UPLOADS;
}

export function getSchemeImpact(code: string | null): {
  title: string;
  bullets: string[];
  firstChangedStep: number;
} {
  if (code === 'VISHWAKARMA') {
    return {
      title: 'PM Vishwakarma',
      bullets: [
        'Step list drops 15, 16, 17 (15 steps instead of 18).',
        'Step 1 adds craft + current/new tools (₹15,000 voucher).',
        'Step 18 uploads: Aadhaar, passbook, ration card.',
      ],
      firstChangedStep: 1,
    };
  }
  if (code === 'SVANIDHI') {
    return {
      title: 'PM SVANidhi',
      bullets: [
        'Step list drops 15, 16, 17.',
        'Step 1 adds CoV vs LoR and UPI QR.',
        'Step 18 upload: CoV or Letter of Recommendation.',
      ],
      firstChangedStep: 1,
    };
  }
  if (code === 'PMFME') {
    return {
      title: 'PMFME',
      bullets: [
        'Steps 1–17 stay the same length.',
        'Step 1 adds FSSAI yes/planned.',
        'Step 18 uploads: quotations, premises lease, draft FSSAI.',
      ],
      firstChangedStep: 1,
    };
  }
  if (code === 'PMEGP') {
    return {
      title: 'PMEGP',
      bullets: [
        'Core questions on steps 1–17 do not change.',
        'Step 18 uploads: machinery quotes, building estimate (caste cert if SC/ST/BC from VentureMatch).',
        '8th-pass upload appears on step 18 if project cost is above the PMEGP education gate.',
      ],
      firstChangedStep: 18,
    };
  }
  if (code === 'MUDRA') {
    return {
      title: 'MUDRA',
      bullets: [
        'Step 12 hides land/building tables only if VentureMatch budget is under ₹5L (Shishu/Kishore).',
        'Step 15 shows Nayak WC (20% of turnover, 5% margin) for that same budget band.',
        'Step 18: shop proof, bank statements, quotes (+ Mudra closure if Tarun Plus).',
      ],
      firstChangedStep: 18,
    };
  }
  if (code === 'AP_EDP') {
    return {
      title: 'AP EDP',
      bullets: [
        'Step 1 asks if the unit is in an APIIC park (land-rebate hint).',
        'Step 12 keeps land / building / P&M (FCI).',
        'Step 18: land/shed, CFE/CFO, CA FCI statement.',
      ],
      firstChangedStep: 1,
    };
  }
  if (code) {
    return {
      title: code,
      bullets: [
        'No extra fields on steps 1–17 for this scheme in v1.',
        'Step 18 uses the default individual upload list (Aadhaar/PAN, Udyam, passbook, quotations).',
      ],
      firstChangedStep: 18,
    };
  }
  return {
    title: 'Vanilla bank term loan',
    bullets: [
      'All 18 steps. No scheme extras on step 1.',
      'Step 18: Aadhaar/PAN, Udyam, passbook, machinery quotations.',
    ],
    firstChangedStep: 1,
  };
}

export function nayakWorkingCapital(turnoverLakhs: number): { limit: number; margin: number } {
  const limit = turnoverLakhs * 0.2;
  const margin = limit * 0.05;
  return { limit, margin };
}
