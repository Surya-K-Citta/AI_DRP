import type { PlainPrompt } from './describe';

const promptModules = import.meta.glob('./prompts/*.ts', { eager: true }) as Record<
  string,
  { PROMPTS?: Record<string, PlainPrompt>; STEP_INTROS?: Record<string, string> }
>;

/** Plain-language versions of form labels, keyed by the label text used in the form. */
export const PLAIN_PROMPTS: Record<string, PlainPrompt> = Object.assign(
  {},
  ...Object.values(promptModules).map((m) => m.PROMPTS || {})
);

/** One plain sentence per step, keyed by the step title without its "Step N:" prefix. */
export const STEP_INTROS: Record<string, string> = Object.assign(
  {},
  ...Object.values(promptModules).map((m) => m.STEP_INTROS || {})
);

export { describeField } from './describe';
export type { PlainPrompt, FieldCopy } from './describe';
