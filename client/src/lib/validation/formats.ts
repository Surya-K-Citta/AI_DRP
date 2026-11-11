/**
 * Format checks and input masks for the identifiers people type into forms: PAN, GSTIN, Udyam, mobile, IFSC,
 * PIN code, e-mail, and bounded numbers. Pure functions with no app imports, so they are easy to test.
 *
 * A *mask* shapes what is typed (upper-case, only the characters allowed at each position, auto hyphens).
 * A *check* says whether a value is acceptable, with a short message in English and Telugu.
 * Checks treat an empty value as fine; "required" is a separate rule.
 */
export type FormatKind = 'pan' | 'gstin' | 'udyam' | 'mobile' | 'ifsc' | 'pincode' | 'email';

export type Msg = { en: string; te: string };
type CheckResult = { ok: true } | { ok: false; message: Msg; incomplete?: boolean };

const M = (en: string, te: string): Msg => ({ en, te });
const OK: CheckResult = { ok: true };

/** Fourth letter of a PAN says who it belongs to. P is an individual; the rest are firms and organisations. */
const PAN_ENTITY = 'ABCFGHJKLPT';
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const GST_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
/** Valid GST state / UT codes (01-38, plus 97 other territory and 99 centre jurisdiction). */
const GST_STATES = new Set([
  ...Array.from({ length: 38 }, (_, i) => String(i + 1).padStart(2, '0')),
  '97',
  '99',
]);

/** The 15th character of a GSTIN is a check character over the first 14 (Mod-36 weighted sum). */
export function gstinCheckChar(first14: string): string {
  let sum = 0;
  for (let i = 0; i < 14; i += 1) {
    const value = GST_CHARS.indexOf(first14[i]);
    if (value < 0) return '';
    const product = value * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return GST_CHARS[(36 - (sum % 36)) % 36];
}

const UDYAM_RE = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

// ---- masks ---------------------------------------------------------------------------------------------

const upperAlnum = (raw: string) => String(raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');

/** PAN: five letters, four digits, one letter. Characters that do not fit their position are dropped. */
export function maskPan(raw: string): string {
  const chars = upperAlnum(raw);
  let out = '';
  for (const ch of chars) {
    const pos = out.length;
    if (pos >= 10) break;
    const wantsLetter = pos < 5 || pos === 9;
    if (wantsLetter ? /[A-Z]/.test(ch) : /[0-9]/.test(ch)) out += ch;
  }
  return out;
}

export function maskGstin(raw: string): string {
  return upperAlnum(raw).slice(0, 15);
}

/** Udyam: UDYAM-XX-00-0000000, typed without having to enter the hyphens. */
export function maskUdyam(raw: string): string {
  const chars = upperAlnum(raw);
  const prefix = 'UDYAM';
  let rest = chars;
  if (chars.startsWith(prefix)) rest = chars.slice(prefix.length);
  else if (prefix.startsWith(chars)) return chars; // still typing the prefix
  const state = (rest.match(/^[A-Z]{0,2}/) || [''])[0];
  let after = rest.slice(state.length);
  if (state.length < 2) after = '';
  const district = (after.match(/^\d{0,2}/) || [''])[0];
  after = after.slice(district.length);
  if (district.length < 2) after = '';
  const number = (after.match(/^\d{0,7}/) || [''])[0];
  let out = prefix;
  if (state) out += `-${state}`;
  if (state.length === 2 && district) out += `-${district}`;
  if (district.length === 2 && number) out += `-${number}`;
  return chars === '' ? '' : out;
}

const maskDigits = (max: number) => (raw: string) => String(raw ?? '').replace(/\D/g, '').slice(0, max);

function maskIfsc(raw: string): string {
  const chars = upperAlnum(raw);
  let out = '';
  for (const ch of chars) {
    const pos = out.length;
    if (pos >= 11) break;
    if (pos < 4 ? /[A-Z]/.test(ch) : pos === 4 ? ch === '0' : true) out += ch;
  }
  return out;
}

function maskEmail(raw: string): string {
  return String(raw ?? '').trim().toLowerCase().replace(/\s+/g, '');
}

export const MASKS: Record<FormatKind, (raw: string) => string> = {
  pan: maskPan,
  gstin: maskGstin,
  udyam: maskUdyam,
  mobile: maskDigits(10),
  ifsc: maskIfsc,
  pincode: maskDigits(6),
  email: maskEmail,
};

/** Full length of each format once complete. */
export const FORMAT_LENGTH: Partial<Record<FormatKind, number>> = {
  pan: 10,
  gstin: 15,
  udyam: 19,
  mobile: 10,
  ifsc: 11,
  pincode: 6,
};

/** What a correct value looks like, for the placeholder and tooltip. */
export const FORMAT_EXAMPLE: Record<FormatKind, string> = {
  pan: 'ABCFE1234F',
  gstin: '37ABCFE1234F1ZV',
  udyam: 'UDYAM-AP-01-0001234',
  mobile: '9876543210',
  ifsc: 'SBIN0001234',
  pincode: '522001',
  email: 'name@example.com',
};

// ---- checks --------------------------------------------------------------------------------------------

function checkPan(value: string): CheckResult {
  if (!value) return OK;
  if (value.length < 10) {
    return {
      ok: false,
      incomplete: true,
      message: M(
        `PAN has 10 characters, like ${FORMAT_EXAMPLE.pan} (${10 - value.length} more).`,
        `PAN లో 10 అక్షరాలు ఉంటాయి, ఉదా. ${FORMAT_EXAMPLE.pan} (ఇంకా ${10 - value.length}).`
      ),
    };
  }
  if (!PAN_RE.test(value)) {
    return { ok: false, message: M('PAN is 5 letters, 4 digits, then 1 letter.', 'PAN: 5 అక్షరాలు, 4 అంకెలు, తర్వాత 1 అక్షరం.') };
  }
  if (!PAN_ENTITY.includes(value[3])) {
    return {
      ok: false,
      message: M(
        'The 4th letter of a PAN must be A, B, C, F, G, H, J, K, L, P or T.',
        'PAN లో 4వ అక్షరం A, B, C, F, G, H, J, K, L, P లేదా T అయి ఉండాలి.'
      ),
    };
  }
  return OK;
}

function checkGstin(value: string): CheckResult {
  if (!value) return OK;
  if (value.length < 15) {
    return {
      ok: false,
      incomplete: true,
      message: M(
        `GSTIN has 15 characters, like ${FORMAT_EXAMPLE.gstin} (${15 - value.length} more).`,
        `GSTIN లో 15 అక్షరాలు ఉంటాయి, ఉదా. ${FORMAT_EXAMPLE.gstin} (ఇంకా ${15 - value.length}).`
      ),
    };
  }
  if (!GSTIN_RE.test(value)) {
    return {
      ok: false,
      message: M(
        'GSTIN is a 2-digit state code, the 10-character PAN, a number or letter, the letter Z, and a check character.',
        'GSTIN: 2 అంకెల రాష్ట్ర కోడ్, 10 అక్షరాల PAN, ఒక అంకె లేదా అక్షరం, Z అక్షరం, చివర చెక్ అక్షరం.'
      ),
    };
  }
  if (!GST_STATES.has(value.slice(0, 2))) {
    return { ok: false, message: M('The first two digits are not a valid state code.', 'మొదటి రెండు అంకెలు సరైన రాష్ట్ర కోడ్ కాదు.') };
  }
  if (!PAN_ENTITY.includes(value[5])) {
    return { ok: false, message: M('The PAN inside this GSTIN is not valid.', 'ఈ GSTIN లోని PAN సరైనది కాదు.') };
  }
  if (gstinCheckChar(value.slice(0, 14)) !== value[14]) {
    return {
      ok: false,
      message: M('The last character does not match. Check the GSTIN for a typing mistake.', 'చివరి అక్షరం సరిపోలడం లేదు. GSTIN లో టైపింగ్ తప్పు ఉందేమో చూడండి.'),
    };
  }
  return OK;
}

function checkUdyam(value: string): CheckResult {
  if (!value) return OK;
  if (value.length < 19) {
    return {
      ok: false,
      incomplete: true,
      message: M(
        `Udyam number looks like ${FORMAT_EXAMPLE.udyam}.`,
        `ఉద్యమ్ నంబర్ ఇలా ఉంటుంది: ${FORMAT_EXAMPLE.udyam}.`
      ),
    };
  }
  if (!UDYAM_RE.test(value)) {
    return { ok: false, message: M(`Use the form ${FORMAT_EXAMPLE.udyam}.`, `ఈ రూపంలో రాయండి: ${FORMAT_EXAMPLE.udyam}.`) };
  }
  return OK;
}

function checkMobile(value: string): CheckResult {
  if (!value) return OK;
  if (value.length < 10) {
    return { ok: false, incomplete: true, message: M(`Mobile number has 10 digits (${10 - value.length} more).`, `మొబైల్ నంబర్‌లో 10 అంకెలు ఉంటాయి (ఇంకా ${10 - value.length}).`) };
  }
  if (!/^[6-9]\d{9}$/.test(value)) {
    return { ok: false, message: M('An Indian mobile number starts with 6, 7, 8 or 9.', 'భారత మొబైల్ నంబర్ 6, 7, 8 లేదా 9 తో మొదలవుతుంది.') };
  }
  return OK;
}

function checkIfsc(value: string): CheckResult {
  if (!value) return OK;
  if (value.length < 11) {
    return { ok: false, incomplete: true, message: M(`IFSC has 11 characters, like ${FORMAT_EXAMPLE.ifsc}.`, `IFSC లో 11 అక్షరాలు, ఉదా. ${FORMAT_EXAMPLE.ifsc}.`) };
  }
  return IFSC_RE.test(value)
    ? OK
    : { ok: false, message: M('IFSC is 4 letters, a zero, then 6 letters or digits.', 'IFSC: 4 అక్షరాలు, ఒక సున్నా, తర్వాత 6 అక్షరాలు లేదా అంకెలు.') };
}

function checkPincode(value: string): CheckResult {
  if (!value) return OK;
  if (value.length < 6) {
    return { ok: false, incomplete: true, message: M(`PIN code has 6 digits (${6 - value.length} more).`, `పిన్ కోడ్‌లో 6 అంకెలు (ఇంకా ${6 - value.length}).`) };
  }
  return /^[1-9]\d{5}$/.test(value)
    ? OK
    : { ok: false, message: M('A PIN code cannot start with 0.', 'పిన్ కోడ్ 0 తో మొదలవదు.') };
}

function checkEmail(value: string): CheckResult {
  if (!value) return OK;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
    ? OK
    : { ok: false, incomplete: !value.includes('@'), message: M('Enter an e-mail like name@example.com.', 'name@example.com లాగా ఇ-మెయిల్ ఇవ్వండి.') };
}

export const CHECKS: Record<FormatKind, (value: string) => CheckResult> = {
  pan: checkPan,
  gstin: checkGstin,
  udyam: checkUdyam,
  mobile: checkMobile,
  ifsc: checkIfsc,
  pincode: checkPincode,
  email: checkEmail,
};

/** A firm PAN is stored; an individual's PAN (4th letter P) is personal data and is not. */
export function isIndividualPan(value: string): boolean {
  return PAN_RE.test(value) && value[3] === 'P';
}

/** A number inside limits. Empty is fine. */
export function checkRange(
  raw: unknown,
  limits: { min?: number; max?: number; integer?: boolean }
): CheckResult {
  const text = String(raw ?? '').trim();
  if (text === '') return OK;
  const value = Number(text);
  const { min, max, integer } = limits;
  const range =
    min != null && max != null
      ? M(`Enter a number from ${min} to ${max}.`, `${min} నుండి ${max} మధ్య సంఖ్య ఇవ్వండి.`)
      : min != null
        ? M(`Enter ${min} or more.`, `${min} లేదా అంతకంటే ఎక్కువ ఇవ్వండి.`)
        : M(`Enter ${max} or less.`, `${max} లేదా అంతకంటే తక్కువ ఇవ్వండి.`);
  if (!Number.isFinite(value)) return { ok: false, message: M('Enter a number.', 'సంఖ్య ఇవ్వండి.') };
  if (integer && !Number.isInteger(value)) return { ok: false, message: M('Enter a whole number.', 'పూర్తి సంఖ్య ఇవ్వండి.') };
  if ((min != null && value < min) || (max != null && value > max)) return { ok: false, message: range };
  return OK;
}

/** Check a stored or typed value for a format, after masking it the way the input would. */
export function checkFormat(kind: FormatKind, value: unknown): CheckResult {
  return CHECKS[kind](MASKS[kind](String(value ?? '')));
}
