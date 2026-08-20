import { HANDOFF_KEY } from './questions';
import { SchemeMatch, VentureMatchAnswers } from './types';
import en from '@/i18n/locales/en.json';

const ACTIVITY_SECTOR: Record<string, string> = {
  mfg: 'Manufacturing',
  food: 'Food Processing',
  craft: 'Handicrafts',
  service: 'Services',
  trade: 'Trading',
  vending: 'Retail',
  crop: 'Agriculture & Allied',
};

const LEGAL_LABEL: Record<string, string> = {
  sole: 'Sole Proprietorship',
  partnership: 'Partnership / LLP',
  company: 'Private / Public Limited Company',
};

const CATEGORY_MAP: Record<string, string> = {
  sc: 'SC',
  st: 'ST',
  bc: 'OBC',
  pwd: 'PHC',
};

const BUDGET_MID: Record<string, number> = {
  under2L: 100_000,
  '2to5L': 350_000,
  '5to10L': 750_000,
  '10to20L': 1_500_000,
  '20to50L': 3_500_000,
  '50Lto1Cr': 7_500_000,
  '1to10Cr': 55_000_000,
  above10Cr: 150_000_000,
};

export interface VentureMatchHandoff {
  answers: VentureMatchAnswers;
  matches: SchemeMatch[];
}

function lookupEn(path: string, fallback: string): string {
  const value = path.split('.').reduce((acc: unknown, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, en as unknown);
  return typeof value === 'string' ? value : fallback;
}

export function buildDprPrefill(answers: VentureMatchAnswers, matches: SchemeMatch[]) {
  const owner = answers.owner || [];
  const categories = owner.map((o) => CATEGORY_MAP[o]).filter(Boolean);
  const mfgLike = answers.activity === 'mfg' || answers.activity === 'food' || answers.activity === 'craft';

  return {
    businessOverview: {
      industrySector: answers.activity ? ACTIVITY_SECTOR[answers.activity] : '',
      businessDescription: answers.stage
        ? answers.stage === 'greenfield'
          ? 'New (greenfield) unit.'
          : 'Expansion / upgrade of an existing (brownfield) unit.'
        : '',
    },
    applicantInfo: {
      gender: owner.includes('female') ? 'Female' : owner.includes('generalMale') ? 'Male' : undefined,
      locationType: answers.location === 'rural' ? 'Rural' : answers.location ? 'Urban' : undefined,
      categories,
      projectType: mfgLike ? 'Manufacturing Unit' : answers.activity ? 'Service Unit' : undefined,
      legalStatus: answers.legal ? LEGAL_LABEL[answers.legal] : undefined,
    },
    eligibleSchemes: {
      selectedSchemes: matches.map((m) => m.code),
      schemesData: matches.map((m) => ({
        schemeCode: m.code,
        schemeName: lookupEn(`ventureMatch.schemes.${m.code}.name`, m.name),
        description: lookupEn(m.benefit, m.benefit),
        category: m.kind,
      })),
    },
    ventureMatchBudget: answers.budget ? BUDGET_MID[answers.budget] : undefined,
  };
}

export function saveHandoff(answers: VentureMatchAnswers, matches: SchemeMatch[]) {
  const payload: VentureMatchHandoff = { answers, matches };
  localStorage.setItem(HANDOFF_KEY, JSON.stringify(payload));
}

export function consumeHandoff(): VentureMatchHandoff | null {
  const raw = localStorage.getItem(HANDOFF_KEY);
  if (!raw) return null;
  localStorage.removeItem(HANDOFF_KEY);
  try {
    return JSON.parse(raw) as VentureMatchHandoff;
  } catch {
    return null;
  }
}
