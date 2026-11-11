/**
 * Removes personal data from text before it is sent to an AI service, and puts the harmless parts back into
 * the answer that comes back. Identity numbers are never restored.
 *
 *  never sent:   Aadhaar, PAN, GSTIN, Udyam number, bank account and IFSC, date of birth, e-mail, phone numbers,
 *                door / plot numbers, the person's own name and the names typed in the request
 *  stays:        the business, product, place, money figures and everything the report is actually about
 */
export type Kind = 'AADHAAR' | 'PAN' | 'GSTIN' | 'UDYAM' | 'ACCOUNT' | 'IFSC' | 'DOB' | 'EMAIL' | 'PHONE' | 'ADDRESS' | 'PERSON';
export type ScrubStats = Partial<Record<Kind, number>>;

const RESTORABLE: Kind[] = ['PERSON', 'EMAIL', 'PHONE'];

const RULES: { kind: Kind; re: RegExp }[] = [
  { kind: 'EMAIL', re: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi },
  { kind: 'UDYAM', re: /\bUDYAM[-\s]?[A-Z]{2}[-\s]?\d{2}[-\s]?\d{7}\b/gi },
  { kind: 'GSTIN', re: /\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/gi },
  { kind: 'PAN', re: /\b[A-Z]{5}\d{4}[A-Z]\b/g },
  { kind: 'IFSC', re: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g },
  { kind: 'AADHAAR', re: /(?<![\d-])\d{4}[\s-]?\d{4}[\s-]?\d{4}(?![\d-])/g },
  { kind: 'ACCOUNT', re: /\b(?:a\/c|acct?|account)(?:\s*(?:no\.?|number|#))?[\s:.-]*\d{9,18}\b/gi },
  { kind: 'DOB', re: /\b(?:date of birth|d\.?o\.?b\.?|born(?: on)?)[\s:.-]*\d{1,4}[\/.-]\d{1,2}[\/.-]\d{1,4}\b/gi },
  { kind: 'PHONE', re: /(?<![\d.])(?:\+?91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}(?![\d])/g },
  { kind: 'ADDRESS', re: /\b(?:d\.?\s?no\.?|door\s?no\.?|h\.?\s?no\.?|house\s?no\.?|plot\s?no\.?|flat\s?no\.?|survey\s?no\.?)[\s:.-]*[0-9A-Z][0-9A-Z/-]*(?:[,\s]+[A-Za-z][A-Za-z .]*(?:road|street|nagar|colony|lane|layout|puram|peta)\b)?/gi },
];

const escapeRe = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class Scrubber {
  readonly stats: ScrubStats = {};
  private map = new Map<string, string>();
  private counters: Partial<Record<Kind, number>> = {};
  private nameRes: { re: RegExp; whole: boolean }[] = [];

  constructor(names: string[] = []) {
    const seen = new Set<string>();
    const add = (n: string, whole: boolean) => {
      const key = n.trim();
      if (key.length < 3 || seen.has(key.toLowerCase())) return;
      seen.add(key.toLowerCase());
      this.nameRes.push({ re: new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(key).replace(/\s+/g, '\\s+')}(?![\\p{L}\\p{N}])`, 'giu'), whole });
    };
    // Full names first, so "K. Ravi Kumar" is one placeholder rather than three.
    for (const name of [...names].sort((a, b) => b.length - a.length)) add(name, true);
    for (const name of names) for (const part of name.split(/[\s.,]+/)) if (part.length >= 4) add(part, false);
  }

  private token(kind: Kind, original: string): string {
    const n = (this.counters[kind] = (this.counters[kind] || 0) + 1);
    const placeholder = `[${kind}_${n}]`;
    this.stats[kind] = (this.stats[kind] || 0) + 1;
    if (RESTORABLE.includes(kind)) this.map.set(placeholder, original);
    return placeholder;
  }

  scrub(text: string): string {
    if (typeof text !== 'string' || !text) return text;
    let out = text;
    for (const rule of RULES) out = out.replace(rule.re, (match) => this.token(rule.kind, match));
    for (const { re } of this.nameRes) out = out.replace(re, (match) => this.token('PERSON', match));
    return out;
  }

  /** Puts names, e-mails and phone numbers back into text the AI returned. Identity numbers stay out. */
  restore(text: string): string {
    if (typeof text !== 'string' || !this.map.size) return text;
    let out = text;
    for (const [placeholder, original] of this.map) out = out.split(placeholder).join(original);
    return out;
  }

  get total(): number {
    return Object.values(this.stats).reduce((a, b) => a + (b || 0), 0);
  }
}

/** Scrubs every string inside a value (arrays and objects are walked). */
export function scrubDeep<T>(value: T, scrubber: Scrubber, depth = 0): T {
  if (typeof value === 'string') return scrubber.scrub(value) as T;
  if (value === null || typeof value !== 'object' || depth > 12) return value;
  if (Array.isArray(value)) return value.map((item) => scrubDeep(item, scrubber, depth + 1)) as T;
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) out[key] = scrubDeep(child, scrubber, depth + 1);
  return out as T;
}

/** True when text still contains something that looks like an identity number, e-mail or phone (used by tests and the gateway's last check). */
export function looksLikePersonalData(text: string): Kind[] {
  const hits: Kind[] = [];
  for (const rule of RULES) {
    rule.re.lastIndex = 0;
    if (rule.re.test(text) && !hits.includes(rule.kind)) hits.push(rule.kind);
    rule.re.lastIndex = 0;
  }
  return hits;
}
