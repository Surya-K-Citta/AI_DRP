import { GLOSSARY } from './glossary.ts';
import { UNIT_HINTS } from './units.ts';

/** A hand-written plain-language version of one form label. */
export type PlainPrompt = {
  /** The question in everyday words. */
  ask: string;
  /** One sentence on what it means or where to find it. */
  help?: string;
  /** A realistic example answer. */
  example?: string;
};

export type FieldCopy = {
  /** The label as the form had it (kept in brackets so it matches bank and government forms). */
  official: string;
  ask: string | null;
  help: string | null;
  example: string | null;
  units: string[];
  terms: { term: string; means: string }[];
};

/**
 * What to show for one label: the plain question if we wrote one, a unit hint if the label names a unit,
 * and a one-line meaning for each technical word in the label. Pure English; the screen translates each piece.
 */
export function describeField(label: string, prompts: Record<string, PlainPrompt>): FieldCopy {
  const prompt = prompts[label] ?? prompts[label.replace(/\s*\*$/, '')];
  const text = `${label} ${prompt?.ask ?? ''}`;
  const units = UNIT_HINTS.filter((unit) => unit.when.test(label)).map((unit) => unit.hint);
  const terms: { term: string; means: string }[] = [];
  const used = new Set<string>();
  for (const entry of GLOSSARY) {
    if (entry.pattern.test(text) && !used.has(entry.means)) {
      used.add(entry.means);
      terms.push({ term: entry.term, means: entry.means });
    }
  }
  return {
    official: label,
    ask: prompt?.ask ?? null,
    help: prompt?.help ?? null,
    example: prompt?.example ?? null,
    units: units.slice(0, 1),
    // A hand-written prompt already explains the field in plain words, so the glossary only fills the gaps.
    terms: prompt ? [] : terms.slice(0, 3),
  };
}
