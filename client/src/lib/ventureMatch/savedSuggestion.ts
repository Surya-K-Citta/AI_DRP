import { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { analyzeCombinations } from './combos';
import { evaluate } from './evaluate';
import { STORAGE_KEY, pruneInvisibleAnswers, scopedVentureMatchKey } from './questions';
import type { VentureMatchAnswers } from './types';

export interface FinderSuggestion {
  /** Schemes to lead with, from the person's own Scheme Finder answers. */
  suggested: Set<string>;
  /** Every other scheme that still matched those answers. */
  alsoMatches: Set<string>;
}

/**
 * What the person's finished Scheme Finder run suggests. Returns null when they have not completed the
 * Finder (nothing saved, or stopped part-way), so callers show no suggestion at all.
 * The Finder keeps its answers in this browser, per signed-in user, under `venture-match-progress`.
 */
export function readFinderSuggestion(userId?: string | null): FinderSuggestion | null {
  try {
    const raw = localStorage.getItem(scopedVentureMatchKey(STORAGE_KEY, userId));
    if (!raw) return null;
    const saved = JSON.parse(raw) as { answers?: VentureMatchAnswers; done?: boolean };
    if (!saved?.done || !saved.answers) return null;
    const result = evaluate(pruneInvisibleAnswers(saved.answers));
    if (!result.matches.length) return null;
    const plan = analyzeCombinations(result.matches);
    const suggested = new Set(plan.core.map((item) => item.scheme.code));
    const alsoMatches = new Set(
      result.matches.map((match) => match.code).filter((code) => !suggested.has(code))
    );
    return { suggested, alsoMatches };
  } catch {
    return null;
  }
}

export function useFinderSuggestion(): FinderSuggestion | null {
  const userId = useAuthStore((s) => s.user?.userId);
  return useMemo(() => readFinderSuggestion(userId), [userId]);
}
