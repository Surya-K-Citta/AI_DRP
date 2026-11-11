import { extraFieldsForScheme } from '@/lib/individualDpr/schemeFormConfig';
import { isLeanUnitScheme } from '@/lib/individualDpr/individualDocModel';
import { normalizeExtraValue } from '@/lib/individualDpr/fillAllStepsWithAi';
import { withSyncedUnitName } from '@/lib/individualDpr/toIndividualPayload';
import { isNumericDprField, normalizeMilestones, toDateInputValue, toFiniteNumber } from '@/lib/dprAiFieldNormalize';

const ALWAYS_EXTRA = ['craft', 'currentTools', 'newTools', 'covOrLor', 'upiQr', 'fssai', 'apiicPark'];

/**
 * Writes one answer the way the form's own input handler does (extras vs step data, dates, numbers, the unit name kept in
 * step with its twin), so an answer applied from the Document-mode guide lands exactly like a typed one.
 */
export function applyFieldValue(options: {
  contentStep: number;
  schemeCode: string | null;
  field: string;
  value: unknown;
  getStepData: (step: number) => any;
  setStepData: (step: number, stepData: any) => void;
  getExtras: () => Record<string, any>;
  setSchemeExtras: (extras: Record<string, any>) => void;
}): void {
  const { contentStep, schemeCode, field, value, getStepData, setStepData, getExtras, setSchemeExtras } = options;
  if (extraFieldsForScheme(schemeCode).includes(field) || ALWAYS_EXTRA.includes(field)) {
    setSchemeExtras({ ...getExtras(), [field]: normalizeExtraValue(field, value) });
    return;
  }
  const latest = getStepData(contentStep) || {};
  const lean = isLeanUnitScheme(schemeCode);
  let next: any = value;
  if (field === 'startDate' || field === 'endDate' || field === 'commitmentDate' || (field === 'yearOfEstablishment' && lean)) {
    next = toDateInputValue(value) || value;
  }
  if (field === 'milestones') next = normalizeMilestones(value);
  const dateOnThisStep = field === 'commitmentDate' || (field === 'yearOfEstablishment' && lean);
  if (!dateOnThisStep && isNumericDprField(field) && (typeof next === 'string' || typeof next === 'number')) {
    next = toFiniteNumber(next);
  }
  if (field === 'unitName' || field === 'clusterName') {
    setStepData(contentStep, withSyncedUnitName(latest, String(next ?? '')));
    return;
  }
  setStepData(contentStep, { ...latest, [field]: next });
}
