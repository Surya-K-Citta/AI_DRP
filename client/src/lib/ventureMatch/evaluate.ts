import { SCHEMES, shouldShowOwnershipHint } from './schemes';
import {
  EvaluateResult,
  SchemeCriterion,
  SchemeExclusion,
  SchemeMatch,
  VentureMatchAnswers,
} from './types';

const STATUS_ORDER = { fail: 0, unknown: 1, pass: 2 } as const;

export function sortCriteria(criteria: SchemeCriterion[]): SchemeCriterion[] {
  return [...criteria].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
}

export function evaluate(answers: VentureMatchAnswers): EvaluateResult {
  const matches: SchemeMatch[] = [];
  const excluded: SchemeExclusion[] = [];

  for (const scheme of SCHEMES) {
    const criteria: SchemeCriterion[] = scheme.criteria.map((criterion) => ({
      id: criterion.id,
      questionId: criterion.questionId,
      labelKey: criterion.labelKey,
      status: criterion.test(answers),
    }));

    const hasFail = criteria.some((c) => c.status === 'fail');
    const hasPass = criteria.some((c) => c.status === 'pass');

    if (hasFail) {
      excluded.push({
        code: scheme.code,
        name: scheme.name,
        kind: scheme.kind,
        criteria: sortCriteria(criteria),
      });
    } else if (hasPass) {
      matches.push({
        code: scheme.code,
        name: scheme.name,
        kind: scheme.kind,
        benefit: scheme.benefit(answers),
      });
    }
  }

  return {
    matches,
    excluded,
    showOwnershipHint: shouldShowOwnershipHint(answers),
  };
}

export function remainingCount(answers: VentureMatchAnswers): number {
  return SCHEMES.filter((scheme) =>
    scheme.criteria.every((criterion) => criterion.test(answers) !== 'fail')
  ).length;
}
