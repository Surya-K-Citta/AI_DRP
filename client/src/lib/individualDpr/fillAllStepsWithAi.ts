import { AISuggestionsService } from '@/services/aiSuggestions.service';
import { extraFieldsForScheme, VISHWAKARMA_CRAFTS, getVisibleSteps, hideComplexCapex } from '@/lib/individualDpr/schemeFormConfig';
import { suggestionToFieldValue } from '@/lib/dprAiFieldNormalize';
import { Budget, VentureMatchAnswers } from '@/lib/ventureMatch/types';

const IDENTITY_FIELDS = ['clusterName', 'district', 'location'];

function matchCraft(value: string): string {
  const text = String(value || '').toLowerCase();
  const exact = VISHWAKARMA_CRAFTS.find((c) => c.toLowerCase() === text);
  if (exact) return exact;
  const partial = VISHWAKARMA_CRAFTS.find(
    (c) => text.includes(c.toLowerCase()) || c.toLowerCase().includes(text)
  );
  return partial || VISHWAKARMA_CRAFTS[0];
}

export function normalizeExtraValue(field: string, value: any): any {
  if (Array.isArray(value)) {
    value = value.filter(Boolean).join(', ');
  }
  const text = String(value ?? '').trim();
  if (!text) return '';
  if (field === 'craft') return matchCraft(text);
  if (field === 'covOrLor') return /lor/i.test(text) ? 'lor' : 'cov';
  if (field === 'fssai') return /plan/i.test(text) ? 'planned' : 'yes';
  if (field === 'apiicPark') return /yes|apiic|park/i.test(text) && !/\bno\b/i.test(text) ? 'yes' : /no/i.test(text) ? 'no' : 'yes';
  return text;
}

function inferMissingExtras(
  schemeCode: string | null,
  step1: Record<string, any>,
  extras: Record<string, any>
): Record<string, any> {
  const next = { ...extras };
  const hint = [step1.clusterName, step1.natureOfBusiness, step1.majorProducts, extras.craft]
    .filter(Boolean)
    .join(' ');
  if (schemeCode === 'VISHWAKARMA') {
    const craft = next.craft || matchCraft(hint);
    next.craft = craft;
    if (!next.currentTools) {
      next.currentTools = `Existing ${craft.toLowerCase()} hand tools and workshop equipment used in day-to-day work.`;
    }
    if (!next.newTools) {
      next.newTools = `Upgraded ${craft.toLowerCase()} tools and kit items to be bought with the ₹15,000 PM Vishwakarma toolkit voucher.`;
    }
  }
  if (schemeCode === 'SVANIDHI') {
    if (!next.covOrLor) next.covOrLor = 'cov';
    if (!next.upiQr) next.upiQr = 'UPI QR to be linked to the vendor bank account.';
  }
  if (schemeCode === 'PMFME' && !next.fssai) next.fssai = 'planned';
  if (schemeCode === 'AP_EDP' && !next.apiicPark) {
    next.apiicPark = /apiic|industrial park/i.test(hint) ? 'yes' : 'no';
  }
  return next;
}

export type FillAllProgress = {
  step: number;
  index: number;
  total: number;
};

export type FillAllResult = {
  filledSteps: number[];
  failedSteps: number[];
};

function excludeForStep(
  step: number,
  schemeCode: string | null,
  budget?: Budget
): string[] {
  if (step === 1) return [...IDENTITY_FIELDS];
  if (step === 12 && hideComplexCapex(schemeCode, budget)) {
    return ['land', 'building', 'utilitiesAndInfrastructure', 'preliminaryAndPreOperative'];
  }
  return [];
}

function previousStepsPayload(data: Record<string, any>, beforeStep: number, schemeCode: string | null) {
  const previous: Record<string, any> = {
    _isIndividualDPR: true,
    ...(schemeCode ? { _schemeCode: schemeCode } : {}),
  };
  for (let i = 1; i < beforeStep; i++) {
    const key = `step${i}`;
    if (data[key] && typeof data[key] === 'object') previous[key] = data[key];
  }
  return previous;
}

export async function fillAllStepsWithAi(options: {
  data: Record<string, any>;
  setStepData: (step: number, stepData: any) => void;
  getStepData: (step: number) => any;
  setSchemeExtras?: (extras: Record<string, any>) => void;
  schemeCode: string | null;
  answers?: VentureMatchAnswers | null;
  onProgress?: (progress: FillAllProgress) => void;
}): Promise<FillAllResult> {
  const { setStepData, getStepData, setSchemeExtras, schemeCode, answers, onProgress } = options;
  let data = { ...options.data };
  const extraFieldNames = extraFieldsForScheme(schemeCode);
  let extras = { ...(data.schemeExtras || {}) };
  extraFieldNames.forEach((field) => {
    if (!extras[field] && data.step1?.[field]) {
      extras[field] = normalizeExtraValue(field, data.step1[field]);
    }
  });

  const steps = getVisibleSteps(schemeCode).filter((s) => s !== 18);
  const filledSteps: number[] = [];
  const failedSteps: number[] = [];

  for (let index = 0; index < steps.length; index++) {
    const step = steps[index];
    onProgress?.({ step, index: index + 1, total: steps.length });

    const currentStepData = { ...(getStepData(step) || data[`step${step}`] || {}) };
    const previous = previousStepsPayload(data, step, schemeCode);
    const exclude = excludeForStep(step, schemeCode, answers?.budget);

    try {
      const suggestions = await AISuggestionsService.getSuggestionsForStep(
        step,
        currentStepData,
        previous,
        exclude
      );

      if (!suggestions?.length) {
        if (step === 1 && extraFieldNames.length && setSchemeExtras) {
          extras = inferMissingExtras(schemeCode, currentStepData, extras);
          setSchemeExtras(extras);
          data = { ...data, schemeExtras: extras };
        }
        failedSteps.push(step);
        continue;
      }

      const nextStepData = { ...currentStepData };
      let applied = 0;
      let extrasChanged = false;

      for (const suggestion of suggestions) {
        const field = suggestion.field;
        if (!field || IDENTITY_FIELDS.includes(field) || exclude.includes(field)) continue;

        const text =
          typeof suggestion.suggestion === 'string'
            ? suggestion.suggestion
            : JSON.stringify(suggestion.suggestion);
        const value = suggestionToFieldValue(field, text);
        if (value === null || value === undefined) continue;

        if (extraFieldNames.includes(field)) {
          extras = { ...extras, [field]: normalizeExtraValue(field, value) };
          extrasChanged = true;
          applied += 1;
          continue;
        }

        nextStepData[field] = value;
        applied += 1;
      }

      if (applied === 0 && !(step === 1 && extraFieldNames.length)) {
        failedSteps.push(step);
        continue;
      }

      if (step === 1 && extraFieldNames.length) {
        extras = inferMissingExtras(schemeCode, nextStepData, extras);
        extrasChanged = true;
        extraFieldNames.forEach((field) => {
          delete nextStepData[field];
        });
        applied = Math.max(applied, 1);
      }

      if (applied === 0) {
        failedSteps.push(step);
        continue;
      }

      setStepData(step, nextStepData);
      data = { ...data, [`step${step}`]: nextStepData };
      if (extrasChanged && setSchemeExtras) {
        setSchemeExtras(extras);
        data = { ...data, schemeExtras: extras };
      }
      filledSteps.push(step);
    } catch (error) {
      console.error(`AI fill failed for step ${step}:`, error);
      failedSteps.push(step);
    }
  }

  return { filledSteps, failedSteps };
}
