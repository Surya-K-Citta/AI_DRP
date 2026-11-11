/**
 * Turns what a speech service heard into what a form field should hold.
 * Pure functions with no app imports, so they are easy to test.
 *
 *  - text:       trimmed, and the full stop a dictation tool adds to a short answer is dropped
 *  - number:     "twelve lakh fifty thousand", "12.5 lakh", "₹ 12,50,000", Telugu numerals and number words -> "1250000"
 *                (in a field counted in lakh, "twelve lakh fifty thousand" -> "12.5")
 *  - identifier: PAN, GSTIN, Udyam, IFSC, PIN, mobile, e-mail: spaces and dashes removed, spoken digits written as digits,
 *                "double four" -> 44, "at" / "dot" in an e-mail address
 */
export type SpokenKind = 'text' | 'number' | 'identifier';
type SpokenOptions = {
  kind?: SpokenKind;
  /** Identifier shape (see validation/formats): pan, gstin, udyam, ifsc, pincode, mobile, email. */
  format?: string;
  /** The field is counted in lakh, so "twelve lakh" means 12. */
  lakh?: boolean;
};

const INDIC_DIGITS: Record<string, string> = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  '౦': '0', '౧': '1', '౨': '2', '౩': '3', '౪': '4', '౫': '5', '౬': '6', '౭': '7', '౮': '8', '౯': '9',
};

const toAsciiDigits = (text: string) => text.replace(/[०-९౦-౯]/g, (ch) => INDIC_DIGITS[ch] || ch);

const DIGIT_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  సున్నా: 0, ఒకటి: 1, ఒక: 1, రెండు: 2, మూడు: 3, నాలుగు: 4, ఐదు: 5, ఆరు: 6, ఏడు: 7, ఎనిమిది: 8, తొమ్మిది: 9,
};

const SMALL_WORDS: Record<string, number> = {
  ...DIGIT_WORDS,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  పది: 10, పదకొండు: 11, పన్నెండు: 12, పదమూడు: 13, పద్నాలుగు: 14, పదిహేను: 15, పదహారు: 16, పదిహేడు: 17, పద్దెనిమిది: 18, పంతొమ్మిది: 19,
  ఇరవై: 20, ముప్పై: 30, నలభై: 40, యాభై: 50, అరవై: 60, డెబ్బై: 70, ఎనభై: 80, తొంభై: 90,
};

const MULTIPLIERS: Record<string, number> = {
  hundred: 100, thousand: 1_000, lakh: 100_000, lakhs: 100_000, lac: 100_000, lacs: 100_000, crore: 10_000_000, crores: 10_000_000, million: 1_000_000,
  వంద: 100, నూరు: 100, వెయ్యి: 1_000, లక్ష: 100_000, లక్షలు: 100_000, కోటి: 10_000_000, కోట్లు: 10_000_000,
};

const POINT_WORDS = new Set(['point', 'dot', 'పాయింట్']);
const FILLER = new Set(['and', 'rupees', 'rupee', 'rs', 'only', 'about', 'around', 'approximately', 'రూపాయలు', 'రూపాయి']);

const round2 = (n: number) => Math.round(n * 100) / 100;
const asString = (n: number) => String(round2(n));

/** "twelve lakh fifty thousand" -> 1250000. Returns null when the words are not a number. */
function wordsToRupees(tokens: string[]): number | null {
  let total = 0;
  let current = 0;
  let seen = false;
  let i = 0;
  for (; i < tokens.length; i += 1) {
    const word = tokens[i];
    if (FILLER.has(word)) continue;
    if (POINT_WORDS.has(word)) break;
    if (word in SMALL_WORDS) {
      current += SMALL_WORDS[word];
      seen = true;
    } else if (word in MULTIPLIERS) {
      const mult = MULTIPLIERS[word];
      if (mult === 100) current = (current || 1) * 100;
      else {
        total += (current || 1) * mult;
        current = 0;
      }
      seen = true;
    } else if (/^\d+$/.test(word)) {
      current += Number(word);
      seen = true;
    } else {
      return null;
    }
  }
  if (!seen) return null;
  let value = total + current;
  if (i < tokens.length && POINT_WORDS.has(tokens[i])) {
    let fraction = '';
    for (let j = i + 1; j < tokens.length; j += 1) {
      const digit = DIGIT_WORDS[tokens[j]] ?? (/^\d$/.test(tokens[j]) ? Number(tokens[j]) : undefined);
      if (digit === undefined) return null;
      fraction += String(digit);
    }
    if (fraction) value += Number(`0.${fraction}`);
  }
  return value;
}

export function spokenToNumber(raw: string, options: { lakh?: boolean } = {}): string {
  const text = toAsciiDigits(String(raw ?? ''))
    .toLowerCase()
    .replace(/₹/g, ' ')
    .replace(/(\d),(?=\d)/g, '$1')
    .replace(/[,;:!?()]/g, ' ')
    .replace(/(\d)\s*%/g, '$1')
    .trim();
  const tokens = text.split(/\s+/).filter(Boolean);

  // Digits first: "12.5 lakh", "1250000", "rs 12 thousand".
  const digitToken = tokens.findIndex((token) => /^-?\d+(\.\d+)?$/.test(token));
  let rupees: number | null = null;
  let multiplied = false;
  if (digitToken >= 0) {
    const base = Number(tokens[digitToken]);
    const next = tokens[digitToken + 1];
    if (next && next in MULTIPLIERS) {
      rupees = base * MULTIPLIERS[next];
      multiplied = true;
    } else {
      rupees = base;
    }
  } else {
    rupees = wordsToRupees(tokens);
    multiplied = tokens.some((token) => token in MULTIPLIERS && MULTIPLIERS[token] >= 1_000);
  }
  if (rupees === null || Number.isNaN(rupees)) return '';
  // In a lakh field a bare "twelve point five" already means lakh; "twelve lakh" or a big amount is turned into lakh.
  if (options.lakh && (multiplied || rupees >= 100_000)) return asString(rupees / 100_000);
  return asString(rupees);
}

const EMAIL_WORDS: Array<[RegExp, string]> = [
  [/\bat the rate( of)?\b/g, '@'],
  [/\bat\b/g, '@'],
  [/\bdot\b/g, '.'],
  [/\bunderscore\b/g, '_'],
  [/\b(dash|hyphen|minus)\b/g, '-'],
];

export function spokenToIdentifier(raw: string, format?: string): string {
  let text = toAsciiDigits(String(raw ?? '')).toLowerCase().trim();
  if (format === 'email') {
    for (const [pattern, symbol] of EMAIL_WORDS) text = text.replace(pattern, ` ${symbol} `);
    text = text.replace(/\b(\d)\b/g, '$1');
    return text.replace(/\s+/g, '').replace(/[^a-z0-9@._+-]/g, '');
  }
  // "double four" -> 44, "triple nine" -> 999
  text = text.replace(/\b(double|triple)\s+([a-z0-9]+)/g, (_, kind, what) => {
    const unit = String(what in DIGIT_WORDS ? DIGIT_WORDS[what] : what);
    return unit.repeat(kind === 'double' ? 2 : 3);
  });
  const joined = text
    .split(/[\s,.\-/]+/)
    .filter(Boolean)
    .map((part) => (part in DIGIT_WORDS ? String(DIGIT_WORDS[part]) : part))
    .join('');
  const cleaned = joined.replace(/[^a-z0-9]/g, '');
  if (format === 'mobile' || format === 'pincode') return cleaned.replace(/\D/g, '');
  return cleaned.toUpperCase();
}

export function spokenToText(raw: string): string {
  let text = String(raw ?? '').replace(/\s+/g, ' ').trim();
  text = text.replace(/^["“”']+|["“”']+$/g, '').trim();
  // A dictation tool ends every answer with a full stop. A one-line answer does not want it; real sentences keep theirs.
  const sentenceMarks = text.match(/[.!?।]/g) || [];
  if (text.length <= 80 && sentenceMarks.length === 1 && /[.!?।]$/.test(text)) text = text.slice(0, -1).trim();
  return text;
}

export function normalizeSpoken(raw: string, options: SpokenOptions = {}): string {
  if (options.kind === 'number') return spokenToNumber(raw, { lakh: options.lakh });
  if (options.kind === 'identifier') return spokenToIdentifier(raw, options.format);
  return spokenToText(raw);
}

/** Add dictated text after what is already in a long-answer box, with one space between. */
export function appendSpoken(existing: string, spoken: string): string {
  const before = String(existing ?? '').trimEnd();
  const add = String(spoken ?? '').trim();
  if (!add) return before;
  return before ? `${before} ${add}` : add;
}
