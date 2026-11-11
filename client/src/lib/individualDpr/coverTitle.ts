import { getSchemeBrief, briefText } from '@/lib/individualDpr/schemeBriefs';

const UPGRADE_SCHEMES = new Set([
  'PMEGP_2ND',
  'SCLCSS',
  'AP_TECH_UPGRADE',
  'MSE_GIFT',
  'PTUAS',
  'MSE_SPICE',
]);

/** Hard cap for cover / form unit titles (words + chars). */
const TITLE_MAX_WORDS = 8;
const TITLE_MAX_CHARS = 56;

interface CoverTitleInput {
  clusterName?: string;
  unitName?: string;
  natureOfBusiness?: string;
  majorProducts?: string;
  district?: string;
  location?: string;
  craft?: string;
}

interface IndividualCoverLines {
  actionLine: string;
  unitName: string;
  underLine: string;
}

/** Short scheme label for the cover “under …” line. */
function schemeCoverLabel(schemeCode: string | null | undefined, lang: 'en' | 'te' = 'en'): string {
  if (!schemeCode) return lang === 'te' ? 'బ్యాంకు టర్మ్ లోన్' : 'Bank Term Loan';
  const brief = getSchemeBrief(schemeCode);
  const title = briefText(brief.title, lang);
  // Prefer a compact label: strip parenthetical tails when very long
  if (title.length > 72) {
    const cut = title.indexOf('(');
    if (cut > 10) return title.slice(0, cut).trim();
  }
  return title || schemeCode;
}

function individualActionLine(schemeCode: string | null | undefined): string {
  if (schemeCode && UPGRADE_SCHEMES.has(schemeCode)) return 'Upgradation of';
  if (schemeCode === 'ECLGS') return 'Working Capital Proposal for';
  if (schemeCode === 'ZED' || schemeCode === 'LEAN' || schemeCode === 'MSME_IPR') {
    return 'Proposal for';
  }
  if (schemeCode === 'PMS') return 'Marketing Support Proposal for';
  return 'Establishment of';
}

export function getIndividualCoverLines(
  step1: CoverTitleInput,
  schemeCode: string | null | undefined,
  lang: 'en' | 'te' = 'en'
): IndividualCoverLines {
  const unitName = (step1.unitName || step1.clusterName || 'UNIT NAME').trim();
  return {
    actionLine: individualActionLine(schemeCode),
    unitName,
    underLine: `under '${schemeCoverLabel(schemeCode, lang)}'`,
  };
}

/** Pull a short label out of AI/user prose (first clause, trimmed). */
function shortPhrase(raw: string, maxWords = 5, maxChars = 36): string {
  let s = String(raw || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return '';

  // First sentence / clause only
  s = s.split(/[.\n;|]+/)[0]?.trim() || s;
  // Drop leading boilerplate from AI paragraphs
  s = s.replace(
    /^(the\s+)?(proposed\s+|new\s+|existing\s+)?(unit|enterprise|project|business|firm|applicant|venture)\s+(is\s+|will\s+be\s+)?(engaged\s+in|involves?|deals\s+in|about|for|to\s+)?\s*/i,
    ''
  );
  s = s.replace(/^(manufacturing|production|processing|trading|sale|sales)\s+of\s+/i, '');
  s = s.replace(/^(focused\s+on|speciali[sz]ing\s+in|mainly|primarily)\s+/i, '');

  const words = s.split(/\s+/).filter(Boolean);
  s = words.slice(0, maxWords).join(' ');
  if (s.length > maxChars) {
    s = s.slice(0, maxChars).replace(/\s+\S*$/, '').trim();
  }
  return s.replace(/[,:]+$/, '').trim();
}

function titleCaseWords(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      if (/^[A-Z0-9]{2,5}$/.test(w)) return w; // keep acronyms
      if (w === '—' || w === '-') return w;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');
}

function clampTitle(s: string): string {
  let out = s.replace(/\s+/g, ' ').trim();
  const words = out.split(/\s+/);
  if (words.length > TITLE_MAX_WORDS) {
    out = words.slice(0, TITLE_MAX_WORDS).join(' ');
  }
  if (out.length > TITLE_MAX_CHARS) {
    out = out.slice(0, TITLE_MAX_CHARS).replace(/\s+\S*$/, '').trim();
  }
  return out.replace(/[—,-]+$/, '').trim();
}

/**
 * Deterministic short unit / project title for step 1.
 * Uses nature of business + major products only (not full paragraphs).
 */
export function suggestUnitTitle(
  step1: CoverTitleInput,
  schemeExtras?: { craft?: string } | null
): string {
  const craft = shortPhrase(schemeExtras?.craft || step1.craft || '', 3, 24);
  const nature = shortPhrase(step1.natureOfBusiness || '', 5, 32);
  const productsRaw = String(step1.majorProducts || '').trim();
  const firstProduct = shortPhrase(productsRaw.split(/[,;/]/)[0] || '', 4, 28);

  let core = '';

  if (nature && firstProduct) {
    const natureLower = nature.toLowerCase();
    const productLower = firstProduct.toLowerCase();
    if (natureLower.includes(productLower) || productLower.includes(natureLower)) {
      core = /unit|enterprise|works|factory|plant$/i.test(nature) ? nature : `${nature} Unit`;
    } else {
      // Prefer product-led short name: "Pickles Food Processing Unit"
      core = `${firstProduct} ${nature} Unit`.replace(/\s+Unit\s+Unit$/i, ' Unit');
    }
  } else if (craft) {
    core = /unit$/i.test(craft) ? craft : `${craft} Unit`;
  } else if (nature) {
    core = /unit|enterprise|works|factory|plant$/i.test(nature) ? nature : `${nature} Unit`;
  } else if (firstProduct) {
    core = `${firstProduct} Unit`;
  } else {
    core = 'MSME Unit';
  }

  return clampTitle(titleCaseWords(core));
}
