/**
 * Sample answers for "Apply sample data" (Dev mode only).
 * Keys are CONTENT steps (`step1`..`step18`, the store buckets), not the UI step numbers of a scheme.
 * Spec of the values: docs/qa/AI-DPR-E2E-QA-Test-Document.md
 */
export type SampleData = {
  [stepKey: `step${number}`]: Record<string, any> | undefined;
  /** Scheme-specific answers (scheme extras). */
  schemeExtras?: Record<string, any>;
  /** Only when the scheme's form changes with Scheme Finder answers (e.g. MUDRA loan band). */
  ventureMatchAnswers?: Record<string, any>;
};
