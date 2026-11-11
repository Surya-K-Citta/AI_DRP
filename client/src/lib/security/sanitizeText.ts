import DOMPurify from 'dompurify';

/**
 * Text cleaning before anything leaves the browser. React already escapes what it shows; this is the second layer
 * (the server cleans again). Plain text such as "< 5 years" or "A & B" is left exactly as typed. Only text that
 * looks like markup is reduced to harmless formatting.
 */
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const TAG_LIKE = /<\s*\/?\s*[a-zA-Z!?]/;
const SCRIPT_URL = /(?:java|vb)script\s*:|data\s*:\s*text\/html|\bon[a-z]{3,}\s*=/i;
const SECRET_KEY = /pass(word|phrase)|secret|token/i;
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const SAFE_TAGS = [
  'b', 'i', 'u', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'hr', 'sub', 'sup',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'span', 'div', 'a',
];

function cleanText(text: string): string {
  const stripped = text.replace(CONTROL_CHARS, '');
  if (!TAG_LIKE.test(stripped) && !SCRIPT_URL.test(stripped)) return stripped;
  return DOMPurify.sanitize(stripped, {
    ALLOWED_TAGS: SAFE_TAGS,
    ALLOWED_ATTR: ['href', 'title'],
    ALLOWED_URI_REGEXP: /^(?:https?|mailto|tel):/i,
    KEEP_CONTENT: true,
    FORBID_CONTENTS: ['script', 'style', 'textarea', 'option', 'noscript', 'iframe', 'object', 'embed', 'template'],
  }) as string;
}

/** A cleaned copy of a request body: operator keys ($ne, $where), prototype keys and script markup are gone. */
export function sanitizeDeep(value: unknown, key = '', depth = 0): unknown {
  if (typeof value === 'string') return SECRET_KEY.test(key) ? value : cleanText(value);
  if (value === null || typeof value !== 'object' || depth > 40) return depth > 40 ? undefined : value;
  if (Array.isArray(value)) return value.map((item) => sanitizeDeep(item, key, depth + 1));
  if (value instanceof Date || value instanceof Blob || value instanceof File || value instanceof FormData) return value;
  const out: Record<string, unknown> = {};
  for (const [name, child] of Object.entries(value as Record<string, unknown>)) {
    if (name.startsWith('$') || FORBIDDEN_KEYS.has(name)) continue;
    out[name] = sanitizeDeep(child, name, depth + 1);
  }
  return out;
}

/** A link that can be put in an href: only http(s), mailto and tel. Anything else (javascript:, data:) becomes "#". */
export function safeUrl(url: unknown): string {
  const raw = typeof url === 'string' ? url.trim() : '';
  if (!raw) return '#';
  try {
    const parsed = new URL(raw, window.location.origin);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol) ? raw : '#';
  } catch {
    return '#';
  }
}
