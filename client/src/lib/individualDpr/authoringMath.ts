/** Pure maths behind the authoring stepper (no app imports, so it can be unit-tested on its own). */
import { isEnteredDocText } from './docEntries.ts';

export type SectionStatus = 'empty' | 'partial' | 'ready' | 'complete';

export interface SectionProgress {
  /** Step number as shown in the UI (1..N for this scheme). */
  step: number;
  contentStep: number;
  title: string;
  answered: number;
  total: number;
  percent: number;
  /** empty: nothing yet; partial: some answers; ready: required answers all in; complete: every question answered. */
  status: SectionStatus;
  requiredMissing: number;
  /** Fingerprint of this section's answers, to tell whether the saved copy has the same ones. */
  signature: string;
}

export interface OverallProgress {
  percent: number;
  sectionsTotal: number;
  sectionsComplete: number;
  sectionsStarted: number;
  requiredMissing: number;
  readyToGenerate: boolean;
}

const IGNORED_KEYS = new Set(['year', 'label', 'id', 'key']);

/** True when the value holds something the person actually entered. */
export function hasAnswer(value: unknown): boolean {
  if (value == null) return false;
  if (Array.isArray(value)) return value.some(hasAnswer);
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).some(
      ([key, item]) => !IGNORED_KEYS.has(key) && hasAnswer(item)
    );
  }
  if (typeof value === 'boolean') return value;
  return isEnteredDocText(value);
}

export function overallProgress(sections: SectionProgress[]): OverallProgress {
  const counted = sections.filter((section) => section.total > 0);
  const percent = counted.length
    ? Math.round(counted.reduce((sum, section) => sum + section.percent, 0) / counted.length)
    : 0;
  const requiredMissing = sections.reduce((sum, section) => sum + section.requiredMissing, 0);
  return {
    percent,
    sectionsTotal: sections.length,
    sectionsComplete: sections.filter((section) => section.status === 'complete').length,
    sectionsStarted: sections.filter((section) => section.answered > 0).length,
    requiredMissing,
    readyToGenerate: sections.length > 0 && requiredMissing === 0,
  };
}

export interface Milestone {
  id: 'quarter' | 'half' | 'most' | 'done';
  at: number;
  label: { en: string; te: string };
}

export const MILESTONES: Milestone[] = [
  { id: 'quarter', at: 25, label: { en: 'Getting started', te: 'ప్రారంభం' } },
  { id: 'half', at: 50, label: { en: 'Halfway', te: 'సగం పూర్తి' } },
  { id: 'most', at: 75, label: { en: 'Almost there', te: 'దాదాపు పూర్తి' } },
  { id: 'done', at: 100, label: { en: 'Complete', te: 'పూర్తి' } },
];

export function nextMilestone(percent: number): Milestone | null {
  return MILESTONES.find((milestone) => percent < milestone.at) || null;
}

/** Whether the section's answers differ from the last saved copy. */
export function sectionsUnsaved(live: SectionProgress[], saved: SectionProgress[] | null): Set<number> {
  const unsaved = new Set<number>();
  live.forEach((section) => {
    const before = saved?.find((item) => item.step === section.step);
    if (!before) {
      if (section.answered > 0) unsaved.add(section.step);
      return;
    }
    if (before.signature !== section.signature) unsaved.add(section.step);
  });
  return unsaved;
}
