import type { Finding } from './dataChecks.ts';
import { reviewFinance } from '../finance/rules.ts';

type AnyData = Record<string, any>;
export type RequiredField = { key: string; label: string };

/**
 * The checks that stop a DPR from being generated or submitted:
 *  1. every required field on every step of this scheme is filled in;
 *  2. the money adds up (funding = cost exactly), equity and debt-equity meet the scheme rule, the bank loan is
 *     within the scheme's lending limit, grants are within their caps, and the projected balance sheet balances.
 * Each finding names the step and field to jump to. Advisory notes (DSCR, cash) are returned by the finance
 * review as warnings and are not included here.
 */
export function auditSubmission(
  data: AnyData | null | undefined,
  visibleContentSteps: number[],
  missingRequired: (contentStep: number, stepData: AnyData | undefined) => RequiredField[]
): Finding[] {
  const d = data || {};
  const out: Finding[] = [];
  for (const step of visibleContentSteps) {
    for (const field of missingRequired(step, d[`step${step}`])) {
      out.push({
        id: `required.${step}.${field.key}`,
        kind: 'blocking',
        blocking: true,
        step,
        field: field.key,
        message: '"{a}" is required and is empty.',
        hint: 'Fill it in before generating the DPR.',
        vars: { a: field.label },
        signature: field.key,
      });
    }
  }
  for (const f of reviewFinance(d)) {
    if (f.severity !== 'block') continue;
    out.push({ id: f.id, kind: 'blocking', blocking: true, step: f.step, field: f.field, message: f.message, hint: f.hint, vars: f.vars, signature: JSON.stringify(f.vars ?? {}) });
  }
  return out;
}

/** Advisory money notes (never block). */
export function financeWarnings(data: AnyData | null | undefined): Finding[] {
  return reviewFinance(data)
    .filter((f) => f.severity === 'warn')
    .map((f) => ({ id: f.id, kind: 'unusual' as const, step: f.step, field: f.field, message: f.message, hint: f.hint, vars: f.vars, signature: JSON.stringify(f.vars ?? {}) }));
}
