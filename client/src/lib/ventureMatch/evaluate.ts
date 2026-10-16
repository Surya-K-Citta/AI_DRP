import { QUESTIONS } from './questions';
import {
  SCHEMES,
  blocksAllSchemes,
  cmepBoosted,
  isIndividualPickerScheme,
  shouldShowOwnershipHint,
} from './schemes';

/** Create New Latest DPR packs only — not cluster / helpdesk CTAs. */
const LATEST_DPR_SCHEMES = SCHEMES.filter((scheme) => isIndividualPickerScheme(scheme.code));
import {
  EvaluateResult,
  QuestionId,
  SchemeCriterion,
  SchemeExclusion,
  SchemeMatch,
  VentureMatchAnswers,
} from './types';

const STATUS_ORDER = { fail: 0, unknown: 1, pass: 2 } as const;

export function sortCriteria(criteria: SchemeCriterion[]): SchemeCriterion[] {
  return [...criteria].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
}

function activityBlockCriterion(): SchemeCriterion {
  return {
    id: 'activity',
    questionId: 'activity',
    labelKey: 'ventureMatch.criteria.mustBeEnterprise',
    status: 'fail',
  };
}

/** Answers from questions before the current one. Later (and in-progress) answers do not count. */
function scopedAnswers(
  answers: VentureMatchAnswers,
  ignoreQuestionId?: QuestionId
): VentureMatchAnswers {
  if (!ignoreQuestionId) return { ...answers };
  const dropFrom = QUESTIONS.findIndex((q) => q.id === ignoreQuestionId);
  if (dropFrom < 0) return { ...answers };
  const scoped: VentureMatchAnswers = { ...answers };
  for (let i = dropFrom; i < QUESTIONS.length; i++) {
    delete scoped[QUESTIONS[i].id];
  }
  return scoped;
}

export function evaluate(answers: VentureMatchAnswers): EvaluateResult {
  const matches: SchemeMatch[] = [];
  const excluded: SchemeExclusion[] = [];
  const blocked = blocksAllSchemes(answers);

  for (const scheme of LATEST_DPR_SCHEMES) {
    const criteria: SchemeCriterion[] = scheme.criteria.map((criterion) => ({
      id: criterion.id,
      questionId: criterion.questionId,
      labelKey: criterion.labelKey,
      status: criterion.test(answers),
    }));

    if (blocked) {
      const activityCrit = criteria.find((c) => c.questionId === 'activity');
      if (activityCrit) activityCrit.status = 'fail';
      else criteria.unshift(activityBlockCriterion());
    }

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
        dprRoute: scheme.dprRoute || 'full',
        fit: {
          passed: criteria.filter((c) => c.status === 'pass').length,
          open: criteria.filter((c) => c.status === 'unknown').length,
          total: criteria.length,
        },
        ...(scheme.code === 'AP_CMEP' ? { boosted: cmepBoosted(answers) } : {}),
      });
    }
  }

  return {
    matches,
    excluded,
    showOwnershipHint: shouldShowOwnershipHint(answers),
  };
}

export function excludedSchemes(
  answers: VentureMatchAnswers,
  ignoreQuestionId?: QuestionId
): SchemeExclusion[] {
  return evaluate(scopedAnswers(answers, ignoreQuestionId)).excluded.map((scheme) => ({
    ...scheme,
    criteria: scheme.criteria.filter((item) => item.status === 'fail'),
  }));
}

export function remainingCount(
  answers: VentureMatchAnswers,
  ignoreQuestionId?: QuestionId
): number {
  const scoped = scopedAnswers(answers, ignoreQuestionId);
  if (blocksAllSchemes(scoped)) return 0;
  return LATEST_DPR_SCHEMES.filter((scheme) =>
    scheme.criteria.every((criterion) => criterion.test(scoped) !== 'fail')
  ).length;
}
