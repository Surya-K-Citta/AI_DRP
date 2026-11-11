/**
 * Small pure helpers for draft saving: what counts as a change, and whether there is anything worth saving.
 * Kept free of app imports so they can be tested on their own.
 */
const VOLATILE_KEYS = new Set(['lastSaved', 'generatedDPR', 'currentStep', 'isDraft']);

/** Stable text for the parts of a draft that matter; two drafts with the same signature save the same data. */
export function draftSignature(data: Record<string, unknown> | null | undefined): string {
  if (!data) return '';
  const keep: Record<string, unknown> = {};
  Object.keys(data)
    .filter((key) => !VOLATILE_KEYS.has(key))
    .sort()
    .forEach((key) => {
      keep[key] = data[key];
    });
  return JSON.stringify(keep);
}

/** True once the form holds at least one answer (any step object with something in it). */
export function hasDraftContent(data: Record<string, any> | null | undefined): boolean {
  if (!data) return false;
  return Object.keys(data).some((key) => {
    if (!key.startsWith('step')) return false;
    const value = data[key];
    return !!value && typeof value === 'object' && Object.keys(value).length > 0;
  });
}
