import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Who a request belongs to, for the AI gateway only. It carries the person's own name and the names typed in the
 * request (applicant, promoters, owners) so they can be swapped for placeholders before any text leaves the server.
 */
export type AiContext = { userId?: string; names: string[] };

const store = new AsyncLocalStorage<AiContext>();

export function enterAiContext(context: AiContext): void {
  store.enterWith(context);
}

export function currentAiContext(): AiContext {
  return store.getStore() || { names: [] };
}

export function runWithAiContext<T>(context: AiContext, fn: () => T): T {
  return store.run(context, fn);
}

const NAME_KEYS = /^(entrepreneurName|fullName|applicantName|promoterName|vendorName|weaverName|authori[sz]edSignatory|relationName|fatherName|spouseName|contactPerson|ownerName|spvName)$/i;
const LIST_KEYS = /^(promoters|owners|partners|directors)$/i;

/** Person names found in a request body (applicant, promoters, owners), de-duplicated. */
export function collectPersonNames(body: unknown, found: Set<string> = new Set(), depth = 0, inList = false): string[] {
  if (depth > 6 || body == null) return [...found];
  if (Array.isArray(body)) {
    for (const item of body.slice(0, 50)) collectPersonNames(item, found, depth + 1, inList);
    return [...found];
  }
  if (typeof body === 'object') {
    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      if (typeof value === 'string') {
        const text = value.trim();
        if ((NAME_KEYS.test(key) || (inList && key === 'name')) && text.length >= 3 && text.length <= 80) found.add(text);
      } else if (value && typeof value === 'object') {
        collectPersonNames(value, found, depth + 1, inList || LIST_KEYS.test(key));
      }
    }
  }
  return [...found];
}
