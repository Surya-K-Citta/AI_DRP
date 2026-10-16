/**
 * How far along a Latest DPR is, section by section.
 *
 * A section's percentage is the share of its questions that have a real answer (blank, a dash and a bare zero
 * do not count; pre-filled year labels in tables do not count). The overall percentage is the average of the
 * sections, so every section matters equally. "Saved" progress is the same sum taken on the last saved copy, so
 * the stepper can show what is saved apart from what is only on screen.
 */
import {
  getIndividualDocFields,
  getIndividualUploads,
  readDocField,
} from './individualDocModel';
import { missingIndividualRequired } from '@/lib/requiredStepFields';
import { isKycUploaded } from '@/lib/privacy/kycField';
import type { SchemeStepDef } from './schemeStepCatalog';

import { hasAnswer, type SectionProgress, type SectionStatus } from './authoringMath';
export * from './authoringMath';

export function sectionProgress(
  payload: Record<string, any>,
  schemeCode: string | null,
  def: SchemeStepDef,
  budget?: any
): SectionProgress {
  const contentStep = def.contentStep;
  let answered = 0;
  let total = 0;
  let signature = '';

  if (def.id === 'uploads' || contentStep === 18) {
    const store = payload.step18 || payload.uploads || {};
    const uploads = getIndividualUploads(schemeCode, payload);
    total = uploads.length;
    uploads.forEach((item) => {
      const done = isKycUploaded(store[item.id] || store[item.label]);
      if (done) answered += 1;
      signature += done ? '1' : '0';
    });
  } else {
    const fields = getIndividualDocFields(contentStep, schemeCode, budget);
    total = fields.length;
    fields.forEach((field) => {
      const value = readDocField(field, payload);
      if (hasAnswer(value)) answered += 1;
      signature += `${field.path}=${JSON.stringify(value ?? null)}|`;
    });
  }

  const requiredMissing =
    def.id === 'uploads' || contentStep === 18
      ? 0
      : missingIndividualRequired(contentStep, payload[`step${contentStep}`], schemeCode).length;
  const percent = total === 0 ? 100 : Math.round((answered / total) * 100);
  const status: SectionStatus =
    percent === 100 ? 'complete' : answered === 0 ? 'empty' : requiredMissing === 0 ? 'ready' : 'partial';

  return {
    step: def.n,
    contentStep,
    title: def.title,
    answered,
    total,
    percent,
    status: total === 0 ? 'complete' : status,
    requiredMissing,
    signature,
  };
}

/** Progress for the sections the person will fill, in the order they appear. */
export function computeSections(
  payload: Record<string, any>,
  schemeCode: string | null,
  defs: SchemeStepDef[],
  steps: number[]
): SectionProgress[] {
  const budget = payload?.ventureMatchAnswers?.budget;
  return steps
    .map((step) => defs.find((def) => def.n === step))
    .filter((def): def is SchemeStepDef => Boolean(def))
    .map((def) => sectionProgress(payload, schemeCode, def, budget));
}

