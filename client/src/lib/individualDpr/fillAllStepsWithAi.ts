import { AISuggestionsService } from '@/services/aiSuggestions.service';
import { extraFieldsForScheme, VISHWAKARMA_CRAFTS, hideComplexCapex } from '@/lib/individualDpr/schemeFormConfig';
import { getSchemeSteps } from '@/lib/individualDpr/schemeStepCatalog';
import { getIndividualDocFields, isLeanUnitScheme } from '@/lib/individualDpr/individualDocModel';
import { suggestionToFieldValue, isNumericDprField, isStructuredDprField, toDateInputValue } from '@/lib/dprAiFieldNormalize';
import { mergeCmepProjectedSuggestion } from '@/lib/individualDpr/cmepProjections';
import { machineryTotalLakhs, totalsFromCostPhasing, workingCapitalFromBuildup } from '@/lib/individualDpr/cmepBankPack';
import { isCostSuggestionField } from '@/lib/individualDpr/costSuggestionGuard';
import { isReasonableIsoDate } from '@/lib/individualDpr/isoDate';
import {
  acceptByKind,
  buildFactsCard,
  isLongProseField,
  machineryCostsFit,
  splitUnfilledFields,
  yearToIsoDate,
  type FactsCard,
  type SuggestionKind,
} from '@/lib/individualDpr/stepSuggestionCheck';
import { Budget, VentureMatchAnswers } from '@/lib/ventureMatch/types';

const IDENTITY_FIELDS = ['clusterName', 'unitName', 'district', 'location'];

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
  if (field === 'unitStage') return /exist|upgrade|expans/i.test(text) ? 'existing' : 'new';
  if (field === 'odopAligned') return /\bno\b|non-?odop/i.test(text) ? 'no' : /yes|odop/i.test(text) ? 'yes' : text;
  if (field === 'priorScheme') {
    if (/regp/i.test(text)) return 'REGP';
    if (/mudra/i.test(text)) return 'MUDRA';
    return 'PMEGP';
  }
  if (field === 'marginMoneyAdjusted' || field === 'firstLoanRepaid' || field === 'nerHill') {
    return /\bno\b/i.test(text) ? 'no' : 'yes';
  }
  if (field === 'sectorBand') return /service|trad|business/i.test(text) ? 'service' : 'manufacturing';
  if (field === 'sclcssCategory') return /st\b|tribe/i.test(text) ? 'st' : 'sc';
  if (field === 'enterpriseSize') {
    if (/medium/i.test(text)) return 'medium';
    if (/small/i.test(text)) return 'small';
    return 'micro';
  }
  if (field === 'specialCategory' || field === 'apDomicile' || field === 'scStOwned') {
    return /\bno\b/i.test(text) ? 'no' : 'yes';
  }
  if (field === 'priorSelfEmploymentLoan') {
    return /\byes\b|availed|taken/i.test(text) ? 'yes' : 'no';
  }
  if (field === 'trainingStage') {
    if (/advanced/i.test(text)) return 'advancedDone';
    if (/basic|complet/i.test(text)) return 'basicDone';
    return 'notStarted';
  }
  if (field === 'loanTranche') {
    if (/third|3rd|₹?\s*50/i.test(text)) return 'third';
    if (/second|2nd|₹?\s*25|₹?\s*2\s*l/i.test(text)) return 'second';
    if (/none|not yet|await/i.test(text)) return 'noneYet';
    if (/first|1st|₹?\s*15|₹?\s*1\s*l/i.test(text)) return 'first';
    return 'first';
  }
  if (field === 'vendingType') {
    if (/cart|thela/i.test(text)) return 'cart';
    if (/stall|kiosk/i.test(text)) return 'stall';
    if (/market/i.test(text)) return 'market';
    if (/mov|hawk|door/i.test(text)) return 'moving';
    if (/other/i.test(text)) return 'other';
    return 'footpath';
  }
  if (field === 'workplaceType') {
    if (/rent/i.test(text)) return 'rentedShop';
    if (/own|shed/i.test(text)) return 'ownShop';
    if (/cart|stall|foot|market|mov/i.test(text)) {
      if (/cart|thela/i.test(text)) return 'cart';
      if (/stall/i.test(text)) return 'stall';
      if (/market/i.test(text)) return 'market';
      if (/mov|hawk/i.test(text)) return 'moving';
      return 'footpath';
    }
    if (/other/i.test(text)) return 'other';
    return 'home';
  }
  if (field === 'accountStatus') {
    if (/sma/i.test(text)) return 'sma1';
    if (/other|npa|inelig/i.test(text)) return 'other';
    return 'standard';
  }
  if (field === 'zedCurrentLevel' || field === 'zedTargetLevel') {
    if (/gold/i.test(text)) return 'gold';
    if (/silver/i.test(text)) return 'silver';
    if (/bronze/i.test(text)) return 'bronze';
    return 'none';
  }
  if (field === 'ipType') {
    if (/design/i.test(text)) return 'design';
    if (/trade|mark|brand/i.test(text)) return 'trademark';
    if (/\bgi\b|geograph/i.test(text)) return 'gi';
    if (/other/i.test(text)) return 'other';
    return 'patent';
  }
  if (field === 'filingStage') {
    if (/grant|regist/i.test(text)) return 'granted';
    if (/filed|applic/i.test(text)) return 'filed';
    if (/draft/i.test(text)) return 'draft';
    return 'idea';
  }
  if (field === 'gemExperience') {
    if (/won|order/i.test(text)) return 'won';
    if (/bid/i.test(text)) return 'bidding';
    if (/regist/i.test(text)) return 'registered';
    return 'none';
  }
  if (field === 'loomType') {
    if (/jacquard|semi/i.test(text)) return 'jacquard';
    if (/pit/i.test(text)) return 'pit';
    if (/other/i.test(text)) return 'other';
    return 'frame';
  }
  if (field === 'apiicPark') return /yes|apiic|park/i.test(text) && !/\bno\b/i.test(text) ? 'yes' : /no/i.test(text) ? 'no' : 'yes';
  return text;
}




export type FillStepProgress = {
  field: string;
  label: string;
  index: number;
  total: number;
};


export type StepFieldSuggestion = {
  field: string;
  label: string;
  suggestion: string;
  source: 'step' | 'extras';
};

type SuggestStepResult = {
  suggestions: StepFieldSuggestion[];
  failed: string[];
};

function buildStepSuggestContext(options: {
  contentStep: number;
  data: Record<string, any>;
  getStepData: (step: number) => any;
  schemeCode: string | null;
  answers?: VentureMatchAnswers | null;
  excludeFields?: string[];
}) {
  const { contentStep, getStepData, schemeCode, answers } = options;
  const data = { ...options.data };
  const budget = answers?.budget;
  const exclude = [
    ...excludeForStep(contentStep, schemeCode, budget),
    ...(options.excludeFields || []),
  ];
  const excludeSet = new Set(exclude);
  const extraFieldNames = extraFieldsForScheme(schemeCode);
  const catalogFields = getIndividualDocFields(contentStep, schemeCode, budget).filter(
    (f) => !excludeSet.has(f.name) && !IDENTITY_FIELDS.includes(f.name)
  );

  const schemeSteps = getSchemeSteps(schemeCode);
  const currentLocal = schemeSteps.find((s) => s.contentStep === contentStep)?.n ?? contentStep;
  const priorContent = schemeSteps
    .filter((s) => s.n < currentLocal)
    .map((s) => s.contentStep);
  const previous = previousStepsPayload(data, priorContent, schemeCode, budget);

  let stepData = { ...(getStepData(contentStep) || data[`step${contentStep}`] || {}) };
  if (contentStep === 1 || extraFieldNames.length) {
    stepData = { ...(data.schemeExtras || {}), ...stepData };
  }

  return { catalogFields, previous, stepData, extraFieldNames, exclude, budget };
}

function suggestionKind(field: string, schemeCode: string | null): SuggestionKind {
  if (isLongProseField(field)) return 'prose';
  if (field === 'costPhasing') return 'json-object';
  if (isStructuredDprField(field)) return 'json-list';
  if (
    field === 'startDate' ||
    field === 'endDate' ||
    field === 'commitmentDate' ||
    (field === 'yearOfEstablishment' && isLeanUnitScheme(schemeCode))
  ) {
    return 'date';
  }
  if (isCostSuggestionField(field)) return 'cost';
  if (isNumericDprField(field)) return 'number';
  return 'text';
}

function checkedFieldSuggestion(
  field: string,
  raw: string,
  facts: FactsCard,
  schemeCode: string | null
): string | null {
  const kind = suggestionKind(field, schemeCode);
  const prepared = kind === 'date' ? toDateInputValue(raw) || yearToIsoDate(raw) || raw : raw;
  const accepted = acceptByKind(kind, prepared, facts);
  if (!accepted) return null;
  if (field !== 'machineryItems') return accepted;
  try {
    return machineryCostsFit(JSON.parse(accepted), facts) ? accepted : null;
  } catch {
    return null;
  }
}

function factsPayload(
  facts: FactsCard,
  schemeCode: string | null,
  budget: string | null | undefined,
  batchKind: 'short' | 'long',
  promptContext?: string
) {
  return {
    _isIndividualDPR: true,
    ...(schemeCode ? { _schemeCode: schemeCode } : {}),
    ...(budget ? { _budget: budget } : {}),
    _factsCard: facts,
    _batchKind: batchKind,
    ...(promptContext ? { _promptContext: promptContext } : {}),
  };
}

/**
 * Fetch AI suggestions for this step's catalog questions only — does not write to the form.
 * Unfilled short fields share one call. Unfilled long write-ups share a second call.
 * A field that fails the check is retried once, then left blank.
 */
export async function suggestCurrentStepWithAi(options: {
  contentStep: number;
  data: Record<string, any>;
  getStepData: (step: number) => any;
  schemeCode: string | null;
  answers?: VentureMatchAnswers | null;
  excludeFields?: string[];
  onProgress?: (progress: FillStepProgress) => void;
}): Promise<SuggestStepResult> {
  const { contentStep, onProgress } = options;
  const ctx = buildStepSuggestContext(options);
  const { catalogFields, previous, stepData, exclude } = ctx;

  if (!catalogFields.length) {
    return { suggestions: [], failed: [] };
  }

  const facts = buildFactsCard(previous);
  const grouped = splitUnfilledFields(catalogFields, stepData);
  const groups = [grouped.short, grouped.long].filter((group) => group.length > 0);
  const suggestions: StepFieldSuggestion[] = [];
  const failed: string[] = [];
  const schemeCode = options.schemeCode;

  const ask = async (group: typeof catalogFields, batchKind: 'short' | 'long') => {
    const names = new Set(group.map((field) => field.name));
    const excludeNames = catalogFields.map((field) => field.name).filter((name) => !names.has(name)).concat(exclude);
    return AISuggestionsService.getSuggestionsForStep(
      contentStep,
      stepData,
      factsPayload(facts, schemeCode, options.answers?.budget, batchKind),
      excludeNames
    );
  };

  const acceptGroup = (group: typeof catalogFields, returned: { field: string; suggestion: string }[]) => {
    const rejected: typeof catalogFields = [];
    for (const fieldDef of group) {
      const match = returned.find((item) => item.field === fieldDef.name);
      const raw = match
        ? typeof match.suggestion === 'string'
          ? match.suggestion
          : JSON.stringify(match.suggestion)
        : '';
      const suggestion = checkedFieldSuggestion(fieldDef.name, raw, facts, schemeCode);
      if (!suggestion || !isReasonableFieldDate(fieldDef.name, suggestion, schemeCode)) {
        rejected.push(fieldDef);
        continue;
      }
      suggestions.push({
        field: fieldDef.name,
        label: fieldDef.label,
        suggestion,
        source: fieldDef.source === 'extras' ? 'extras' : 'step',
      });
    }
    return rejected;
  };

  for (let index = 0; index < groups.length; index++) {
    const group = groups[index];
    const batchKind = isLongProseField(group[0].name) ? 'long' : 'short';
    onProgress?.({
      field: group[0].name,
      label: batchKind === 'long' ? 'Long answers' : 'Short answers',
      index: index + 1,
      total: groups.length,
    });
    try {
      let returned: { field: string; suggestion: string }[] | null = null;
      try {
        returned = await ask(group, batchKind);
      } catch (error) {
        console.error(`AI suggest failed for content step ${contentStep}, retrying the batch once:`, error);
        returned = await ask(group, batchKind);
      }
      const rejected = acceptGroup(group, returned || []);
      for (const fieldDef of rejected) {
        onProgress?.({
          field: fieldDef.name,
          label: fieldDef.label,
          index: index + 1,
          total: groups.length,
        });
        try {
          const retry = await ask([fieldDef], batchKind);
          const stillRejected = acceptGroup([fieldDef], retry || []);
          if (stillRejected.length) failed.push(fieldDef.name);
        } catch (error) {
          console.error(`AI retry failed for ${fieldDef.name} on content step ${contentStep}:`, error);
          failed.push(fieldDef.name);
        }
      }
    } catch (error) {
      console.error(`AI suggest failed for content step ${contentStep}:`, error);
      group.forEach((fieldDef) => failed.push(fieldDef.name));
    }
  }

  return { suggestions, failed };
}

function isReasonableFieldDate(field: string, suggestion: string, schemeCode: string | null): boolean {
  const dated =
    field === 'startDate' ||
    field === 'endDate' ||
    field === 'commitmentDate' ||
    (field === 'yearOfEstablishment' && isLeanUnitScheme(schemeCode));
  if (!dated) return true;
  return isReasonableIsoDate(suggestion);
}

/**
 * Regenerate one catalog field suggestion using optional user "add these points" instructions.
 */
export async function regenerateStepFieldSuggestion(options: {
  contentStep: number;
  field: string;
  label: string;
  source?: 'step' | 'extras';
  instruction: string;
  currentSuggestion?: string;
  data: Record<string, any>;
  getStepData: (step: number) => any;
  schemeCode: string | null;
  answers?: VentureMatchAnswers | null;
  excludeFields?: string[];
}): Promise<StepFieldSuggestion | null> {
  const {
    contentStep,
    field,
    label,
    instruction,
    currentSuggestion,
  } = options;
  const ctx = buildStepSuggestContext(options);
  const { catalogFields, previous, stepData, exclude } = ctx;
  const fieldDef = catalogFields.find((f) => f.name === field);
  if (!fieldDef) return null;

  const otherExcludes = catalogFields
    .map((f) => f.name)
    .filter((name) => name !== field)
    .concat(exclude);

  const promptParts = [
    `Regenerate ONLY the suggestion for field "${field}" ("${label}").`,
    instruction.trim()
      ? `The user wants these points included or reflected:\n${instruction.trim()}`
      : 'Produce a fresh alternative suggestion for this field.',
    currentSuggestion?.trim()
      ? `Previous suggestion to improve upon:\n"""\n${currentSuggestion.trim()}\n"""`
      : '',
  ].filter(Boolean);

  const facts = buildFactsCard(previous);
  const previousWithHint = factsPayload(
    facts,
    options.schemeCode,
    options.answers?.budget,
    isLongProseField(field) ? 'long' : 'short',
    promptParts.join('\n\n')
  );

  const aiSuggestions = await AISuggestionsService.getSuggestionsForStep(
    contentStep,
    stepData,
    previousWithHint,
    otherExcludes
  );
  const match = (aiSuggestions || []).find((s) => s.field === field);
  if (!match) return null;
  const text =
    typeof match.suggestion === 'string'
      ? match.suggestion
      : JSON.stringify(match.suggestion);
  const suggestion = checkedFieldSuggestion(field, String(text || ''), facts, options.schemeCode);
  if (!suggestion) return null;

  return {
    field,
    label: fieldDef.label || label,
    suggestion,
    source: options.source || (fieldDef.source === 'extras' ? 'extras' : 'step'),
  };
}

/**
 * Apply one catalog suggestion into step data or scheme extras (Latest DPR).
 * Returns the normalized value written (or null if skipped).
 */
export function applyCatalogSuggestionToForm(options: {
  contentStep: number;
  suggestion: StepFieldSuggestion;
  getStepData: (step: number) => any;
  setStepData: (step: number, stepData: any) => void;
  setSchemeExtras?: (extras: Record<string, any>) => void;
  schemeExtras?: Record<string, any>;
  schemeCode: string | null;
  /** When applying many fields, pass a shared mutable bag so we don't lose prior writes. */
  stepPatch?: Record<string, any>;
}): { ok: boolean; value: any } {
  const {
    contentStep,
    suggestion,
    getStepData,
    setStepData,
    setSchemeExtras,
    schemeCode,
    stepPatch,
  } = options;
  const extraFieldNames = extraFieldsForScheme(schemeCode);
  let value = suggestionToFieldValue(suggestion.field, suggestion.suggestion);
  if (schemeCode === 'AP_CMEP' && suggestion.field === 'yearProjections' && Array.isArray(value)) {
    const current = stepPatch?.yearProjections ?? getStepData(contentStep)?.yearProjections;
    value = mergeCmepProjectedSuggestion(current, value);
  }

  // Structured / date fields must parse cleanly — never store raw AI prose.
  if (isStructuredDprField(suggestion.field)) {
    if (suggestion.field === 'costPhasing') {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, value: null };
    } else if (!Array.isArray(value) || value.length === 0) return { ok: false, value: null };
  } else if (
    suggestion.field === 'startDate' ||
    suggestion.field === 'endDate' ||
    suggestion.field === 'commitmentDate' ||
    (suggestion.field === 'yearOfEstablishment' && isLeanUnitScheme(schemeCode))
  ) {
    value = toDateInputValue(value) || toDateInputValue(suggestion.suggestion) || yearToIsoDate(String(suggestion.suggestion || ''));
    if (!value) return { ok: false, value: null };
  } else if (Array.isArray(value)) {
    value = String(suggestion.suggestion || '').trim();
  } else if (isNumericDprField(suggestion.field)) {
    // Never store prose in ₹ Lakhs / numeric buckets — that breaks totals via string concat.
    if (value === null || value === undefined || value === '') {
      return { ok: false, value: null };
    }
    value = Number(value);
    if (!Number.isFinite(value)) return { ok: false, value: null };
  } else if (value === null || value === undefined || value === '') {
    value = String(suggestion.suggestion || '').trim();
  }
  if (value === null || value === undefined || value === '') return { ok: false, value: null };

  if (suggestion.source === 'extras' || extraFieldNames.includes(suggestion.field)) {
    if (!setSchemeExtras) return { ok: false, value: null };
    const next = {
      ...(options.schemeExtras || {}),
      [suggestion.field]: normalizeExtraValue(suggestion.field, value),
    };
    setSchemeExtras(next);
    return { ok: true, value: next[suggestion.field] };
  }

  // PMEGP family: keep directEmployment extras in sync with employmentGeneration
  if (
    suggestion.field === 'employmentGeneration' &&
    setSchemeExtras &&
    (schemeCode === 'PMEGP' || schemeCode === 'PMEGP_2ND' || schemeCode === 'PMFME')
  ) {
    const nextExtras = {
      ...(options.schemeExtras || {}),
      directEmployment: String(value),
    };
    setSchemeExtras(nextExtras);
  }

  if (stepPatch) {
    stepPatch[suggestion.field] = value;
    if (suggestion.field === 'costPhasing' && value && typeof value === 'object') {
      Object.assign(stepPatch, totalsFromCostPhasing(value as Record<string, { incurred: number; proposed: number }>));
    }
    if (suggestion.field === 'machineryItems' && Array.isArray(value)) {
      stepPatch.machinery = machineryTotalLakhs(value, schemeCode === 'AP_CMEP');
    }
    if (String(suggestion.field).startsWith('wc')) {
      stepPatch.workingCapitalMargin = workingCapitalFromBuildup({ ...stepPatch });
    }
    return { ok: true, value };
  }

  const latest = { ...(getStepData(contentStep) || {}) };
  latest[suggestion.field] = value;
  if (suggestion.field === 'costPhasing' && value && typeof value === 'object') {
    Object.assign(latest, totalsFromCostPhasing(value as Record<string, { incurred: number; proposed: number }>));
  }
  if (suggestion.field === 'machineryItems' && Array.isArray(value)) {
    latest.machinery = machineryTotalLakhs(value, schemeCode === 'AP_CMEP');
  }
  if (String(suggestion.field).startsWith('wc')) {
    latest.workingCapitalMargin = workingCapitalFromBuildup(latest);
  }
  extraFieldNames.forEach((name) => {
    delete latest[name];
  });
  setStepData(contentStep, latest);
  return { ok: true, value };
}

/**
 * Apply many catalog suggestions in one step write (avoids lost updates).
 */
export function applyAllCatalogSuggestionsToForm(options: {
  contentStep: number;
  suggestions: StepFieldSuggestion[];
  getStepData: (step: number) => any;
  setStepData: (step: number, stepData: any) => void;
  setSchemeExtras?: (extras: Record<string, any>) => void;
  schemeExtras?: Record<string, any>;
  schemeCode: string | null;
}): { applied: number; values: Record<string, any> } {
  const {
    contentStep,
    suggestions,
    getStepData,
    setStepData,
    setSchemeExtras,
    schemeCode,
  } = options;
  const extraFieldNames = extraFieldsForScheme(schemeCode);
  let extras = { ...(options.schemeExtras || {}) };
  const stepPatch: Record<string, any> = {};
  const values: Record<string, any> = {};
  let applied = 0;

  for (const suggestion of suggestions) {
    const result = applyCatalogSuggestionToForm({
      contentStep,
      suggestion,
      getStepData,
      setStepData: () => {},
      setSchemeExtras: (next) => {
        extras = next;
      },
      schemeExtras: extras,
      schemeCode,
      stepPatch,
    });
    if (result.ok) {
      applied += 1;
      values[suggestion.field] = result.value;
    }
  }

  if (Object.keys(stepPatch).length) {
    const latest = { ...(getStepData(contentStep) || {}), ...stepPatch };
    extraFieldNames.forEach((name) => {
      delete latest[name];
    });
    setStepData(contentStep, latest);
  }
  if (setSchemeExtras && Object.keys(extras).length) {
    setSchemeExtras(extras);
  }

  return { applied, values };
}


function excludeForStep(
  contentStep: number,
  schemeCode: string | null,
  budget?: Budget
): string[] {
  if (contentStep === 1) return [...IDENTITY_FIELDS];
  if (contentStep === 12 && hideComplexCapex(schemeCode, budget)) {
    return ['land', 'building', 'utilitiesAndInfrastructure', 'preliminaryAndPreOperative'];
  }
  return [];
}

function previousStepsPayload(
  data: Record<string, any>,
  beforeContentSteps: number[],
  schemeCode: string | null,
  budget?: string | null
) {
  const previous: Record<string, any> = {
    _isIndividualDPR: true,
    ...(schemeCode ? { _schemeCode: schemeCode } : {}),
    ...(budget ? { _budget: budget } : {}),
  };
  for (const contentStep of beforeContentSteps) {
    const key = `step${contentStep}`;
    if (data[key] && typeof data[key] === 'object') previous[key] = data[key];
  }
  return previous;
}

