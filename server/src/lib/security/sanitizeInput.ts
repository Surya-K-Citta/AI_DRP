import sanitizeHtml from 'sanitize-html';
import type { NextFunction, Request, Response } from 'express';

/**
 * Request sanitising, applied to every request body, query string and URL parameter.
 *
 *  - NoSQL injection: keys starting with "$" (Mongo operators like $ne, $gt, $where) are dropped, so a
 *    value can never turn into a query operator. The database is MongoDB, there is no SQL.
 *  - Prototype pollution: "__proto__", "constructor" and "prototype" keys are dropped.
 *  - Control characters (NUL and friends) are removed from text.
 *  - Script injection: any tag-like markup in text is reduced to harmless formatting tags. Plain text such as
 *    "< 5 years", "A & B" or "salary > 10000" is left exactly as typed.
 */

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_DEPTH = 40;

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const TAG_LIKE = /<\s*\/?\s*[a-zA-Z!?]/;
const SCRIPT_URL = /(?:java|vb)script\s*:|data\s*:\s*text\/html|\bon[a-z]{3,}\s*=/i;

/** Formatting that is safe to keep. No scripts, frames, forms, styles or event handlers. */
const SAFE_TAGS = [
  'b', 'i', 'u', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'hr', 'sub', 'sup',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'span', 'div', 'a',
];

export function neutraliseMarkup(text: string): string {
  if (!TAG_LIKE.test(text) && !SCRIPT_URL.test(text)) return text;
  return sanitizeHtml(text, {
    allowedTags: SAFE_TAGS,
    allowedAttributes: { a: ['href', 'title'] },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesAppliedToAttributes: ['href'],
    allowProtocolRelative: false,
    // Contents of these are dropped with the tag.
    nonTextTags: ['script', 'style', 'textarea', 'option', 'noscript', 'iframe', 'object', 'embed', 'template'],
    transformTags: { a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }) },
  });
}

export function cleanText(text: string): string {
  return neutraliseMarkup(text.replace(CONTROL_CHARS, ''));
}

export type SanitizeStats = { droppedKeys: number; changedStrings: number };

/** Returns a cleaned copy. Arrays and plain objects are walked; everything else is returned as is. */
/** Secrets are never rewritten: a password that happens to contain "<b>" must still match what was typed. */
const SECRET_KEY = /pass(word|phrase)|secret|token/i;

export function sanitizeValue(value: unknown, stats: SanitizeStats = { droppedKeys: 0, changedStrings: 0 }, depth = 0, key = ''): unknown {
  if (typeof value === 'string') {
    if (SECRET_KEY.test(key)) return value;
    const cleaned = cleanText(value);
    if (cleaned !== value) stats.changedStrings += 1;
    return cleaned;
  }
  if (value === null || typeof value !== 'object') return value;
  if (depth > MAX_DEPTH) return undefined;
  if (Array.isArray(value)) return value.map((item) => sanitizeValue(item, stats, depth + 1, key));
  if (Buffer.isBuffer(value) || value instanceof Date) return value;
  const out: Record<string, unknown> = {};
  for (const [name, child] of Object.entries(value as Record<string, unknown>)) {
    if (name.startsWith('$') || FORBIDDEN_KEYS.has(name)) {
      stats.droppedKeys += 1;
      continue;
    }
    out[name] = sanitizeValue(child, stats, depth + 1, name);
  }
  return out;
}

/** Endpoints that take a whole HTML document and clean it with the stricter document sanitiser instead. */
const HTML_BODY_PATHS = [/\/download\/pdf\/html$/];

function replaceContents(target: any, cleaned: any) {
  for (const key of Object.keys(target)) delete target[key];
  Object.assign(target, cleaned);
}

export function sanitizeRequest(req: Request, _res: Response, next: NextFunction): void {
  const stats: SanitizeStats = { droppedKeys: 0, changedStrings: 0 };
  if (req.body && typeof req.body === 'object' && !HTML_BODY_PATHS.some((pattern) => pattern.test(req.path))) {
    replaceContents(req.body, sanitizeValue(req.body, stats));
  }
  if (req.query && typeof req.query === 'object') {
    const cleaned = sanitizeValue(req.query, stats) as Record<string, unknown>;
    // Nothing in this API takes a nested object in the query string (a[b]=c), so any that is left is dropped.
    for (const [key, value] of Object.entries(cleaned)) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        delete cleaned[key];
        stats.droppedKeys += 1;
      }
    }
    replaceContents(req.query, cleaned);
  }
  if (req.params && typeof req.params === 'object') replaceContents(req.params, sanitizeValue(req.params, stats));
  if (stats.droppedKeys) console.warn(`🛡️ dropped ${stats.droppedKeys} operator/forbidden key(s) from ${req.method} ${req.path}`);
  next();
}
