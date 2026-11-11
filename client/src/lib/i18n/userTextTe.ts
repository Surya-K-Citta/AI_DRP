// Telugu view of the text a person typed. The stored answers stay in English (the exports are English and the report logic
// reads them); only what is drawn on screen is swapped for a translation.

/** Parts of the answers that are settings, files or identifiers, never prose to translate. */
const SKIP_KEYS = new Set([
  'matchedSchemeCode',
  'schemeExtras',
  'ventureMatchAnswers',
  'step18',
  'uploads',
  'metadata',
  'currentStep',
]);
const SKIP_KEY_PATTERN = /(^|_)(id|ids|url|uri|date|dob|email|phone|mobile|gstin|pan|aadhaar|aadhar|udyam|ifsc|pincode|pin|account|status|code|language|currency|fileid|originalname)$/i;

const MAX_LENGTH = 2000;

/** True for free text worth translating: real words, not numbers, codes, links, contact details or identifiers. */
export function isTranslatableUserText(value: unknown, key = ''): value is string {
  if (typeof value !== 'string') return false;
  if (key && SKIP_KEY_PATTERN.test(key)) return false;
  const text = value.trim();
  if (text.length < 3 || text.length > MAX_LENGTH) return false;
  if (!/[A-Za-z]{3,}/.test(text)) return false;
  if (/[ఀ-౿]/.test(text)) return false; // already Telugu
  if (/^(https?:\/\/|www\.)\S+$/i.test(text)) return false;
  if (/^\S+@\S+\.\S+$/.test(text)) return false;
  if (/^file:/i.test(text)) return false;
  if (/^[A-Z0-9][A-Z0-9\-/.&_]{2,40}$/.test(text)) return false; // codes and identifiers with no spaces: PMEGP, UDYAM-AP-01-0001234
  if (/^[A-Z0-9][A-Z0-9 \-/.&]{0,11}$/.test(text)) return false; // short all-capital labels
  if (/^[\d\s.,/:₹%+\-A-Za-z]{0,3}$/.test(text)) return false;
  return true;
}

function walk(value: unknown, key: string, visit: (text: string, set: (next: string) => void) => void, depth = 0): unknown {
  if (depth > 12 || value == null) return value;
  if (typeof value === 'string') {
    let out = value;
    if (isTranslatableUserText(value, key)) visit(value.trim(), (next) => { out = next; });
    return out;
  }
  if (Array.isArray(value)) return value.map((item) => walk(item, key, visit, depth + 1));
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (obj.fileId || obj.status === 'uploaded') return value;
    const copy: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      copy[k] = SKIP_KEYS.has(k) ? v : walk(v, k, visit, depth + 1);
    }
    return copy;
  }
  return value;
}

/** Every distinct piece of typed text in the answers that could be translated. */
export function collectUserTexts(data: unknown): string[] {
  const found = new Set<string>();
  walk(data, '', (text) => found.add(text));
  return Array.from(found);
}

/** A copy of the answers with each translated text replaced. Texts without a translation are left as typed. */
export function applyUserTranslations<T>(data: T, translations: ReadonlyMap<string, string>): T {
  if (!translations.size) return data;
  return walk(data, '', (text, set) => {
    const hit = translations.get(text);
    if (hit) set(hit);
  }) as T;
}
