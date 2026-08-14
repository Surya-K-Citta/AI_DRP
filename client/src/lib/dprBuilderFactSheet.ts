export const ASSIST_STEP_IDS = [
  'building-details',
  'machinery-details',
  'other-capital-costs',
  'financing',
  'sales-details',
  'raw-materials',
  'wages',
  'salary-details',
  'working-capital-estimate',
  'power-estimate',
  'energy-efficiency',
  'water-efficiency',
  'overhead-expenses',
  'financial-parameters',
  'beneficiary-info',
  'project-at-glance',
  'market-analysis',
  'financial-projections',
  'eligible-schemes',
] as const;

export type AssistStepId = (typeof ASSIST_STEP_IDS)[number];

export const STEP_DATA_KEYS: Record<string, string> = {
  'business-overview': 'businessOverview',
  'applicant-info': 'applicantInfo',
  'building-details': 'buildingDetails',
  'machinery-details': 'machineryDetails',
  'other-capital-costs': 'otherCapitalCosts',
  'financing': 'financing',
  'sales-details': 'salesDetails',
  'raw-materials': 'rawMaterials',
  'wages': 'wages',
  'salary-details': 'salaryDetails',
  'working-capital-estimate': 'workingCapitalEstimate',
  'power-estimate': 'powerEstimate',
  'energy-efficiency': 'energyEfficiency',
  'water-efficiency': 'waterEfficiency',
  'overhead-expenses': 'overheadExpenses',
  'financial-parameters': 'financialParameters',
  'beneficiary-info': 'beneficiaryInfo',
  'project-at-glance': 'projectAtGlance',
  'market-analysis': 'marketAnalysis',
  'financial-projections': 'financialProjections',
  'eligible-schemes': 'eligibleSchemes',
};

const STEP_ORDER = Object.keys(STEP_DATA_KEYS);

export function isAssistStep(stepId: string): boolean {
  return (ASSIST_STEP_IDS as readonly string[]).includes(stepId);
}

function isFilledString(value: any): boolean {
  return typeof value === 'string' && value.trim() !== '';
}

function isFilledNumber(value: any): boolean {
  if (value === null || value === undefined || value === '') return false;
  const n = Number(value);
  return !Number.isNaN(n);
}

function hasFilledRow(rows: any[] | undefined, nameKey: string, numericKeys: string[]): boolean {
  if (!Array.isArray(rows)) return false;
  return rows.some((row) => {
    if (!row) return false;
    const named = isFilledString(row[nameKey]);
    const numbered = numericKeys.some((key) => isFilledNumber(row[key]));
    return named && numbered;
  });
}

function hasAnyFilled(data: any, keys: string[]): boolean {
  if (!data || typeof data !== 'object') return false;
  return keys.some((key) => {
    const value = data[key];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'number') return true;
    return isFilledString(value) || isFilledNumber(value);
  });
}

export function compactValue(value: any): any {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  }
  if (Array.isArray(value)) {
    const items = value.map(compactValue).filter((item) => item !== undefined);
    return items.length ? items : undefined;
  }
  if (typeof value === 'object') {
    const next: Record<string, any> = {};
    for (const [key, child] of Object.entries(value)) {
      const compacted = compactValue(child);
      if (compacted !== undefined) next[key] = compacted;
    }
    return Object.keys(next).length ? next : undefined;
  }
  return value;
}

export function buildFactSheet(stepData: Record<string, any>, currentStepId: string) {
  const currentIndex = STEP_ORDER.indexOf(currentStepId);
  const endIndex = currentIndex >= 0 ? currentIndex : STEP_ORDER.length - 1;
  const previousSteps: Record<string, any> = {};

  for (let i = 0; i < endIndex; i++) {
    const id = STEP_ORDER[i];
    const key = STEP_DATA_KEYS[id];
    const compacted = compactValue(stepData?.[key]);
    if (compacted !== undefined) previousSteps[key] = compacted;
  }

  const currentKey = STEP_DATA_KEYS[currentStepId];
  const currentStep = compactValue(stepData?.[currentKey]) || {};

  return compactValue({
    currentStepId,
    previousSteps,
    currentStep,
  }) || { currentStepId, previousSteps: {}, currentStep: {} };
}

export function isStepReadyForAnalyze(stepId: string, stepData: Record<string, any>): boolean {
  const data = stepData?.[STEP_DATA_KEYS[stepId]] || {};

  switch (stepId) {
    case 'building-details':
      return hasFilledRow(data.buildings, 'particulars', ['area', 'rate', 'amount']);
    case 'machinery-details':
      return hasFilledRow(data.machinery, 'particulars', ['qty', 'rate', 'amount']);
    case 'sales-details':
      return hasFilledRow(data.sales, 'particulars', ['rate', 'quantity', 'amount']);
    case 'raw-materials':
      return hasFilledRow(data.materials, 'particulars', ['rate', 'requiredUnit', 'amount']);
    case 'wages':
      return hasFilledRow(data.wages, 'particulars', ['noOfWorkers', 'wagesPerMonth', 'amount']);
    case 'salary-details':
      return hasFilledRow(data.staff || data.salaries, 'particulars', ['noOfStaff', 'wagesPerMonth', 'amount']);
    case 'other-capital-costs':
      return hasAnyFilled(data, ['preliminaryCost', 'furnitureFixtures', 'contingency', 'workingCapital']);
    case 'financing':
      return hasAnyFilled(data, ['ownContributionPercent', 'bankFinancePercent', 'schemeName']);
    case 'working-capital-estimate':
      return hasAnyFilled(data, ['stockInProcess', 'finishedGoods', 'receivables']);
    case 'power-estimate':
      return hasAnyFilled(data, ['powerRequirement', 'monthlyCost']);
    case 'energy-efficiency':
      return hasAnyFilled(data, ['monthlyConsumption', 'energySource', 'savingMeasures']);
    case 'water-efficiency':
      return hasAnyFilled(data, ['dailyConsumption', 'waterSource', 'treatmentMethod']);
    case 'overhead-expenses':
      return hasAnyFilled(data, [
        'repairMaintenance',
        'powerFuel',
        'otherOverhead',
        'telephone',
        'stationeryPostage',
        'advertisement',
        'buildingRent',
        'otherMiscellaneous',
      ]);
    case 'financial-parameters':
      return hasAnyFilled(data, ['rateOfInterest', 'depreciationBuilding', 'depreciationMachinery']);
    case 'beneficiary-info':
      return isFilledString(data.fullName) && hasAnyFilled(data, ['address', 'email', 'mobile']);
    case 'project-at-glance':
      return isFilledString(data.beneficiaryName) && hasAnyFilled(data, ['unitAddress', 'district', 'mobile', 'email']);
    case 'market-analysis':
      return hasAnyFilled(data, ['targetMarket', 'competitorAnalysis']);
    case 'financial-projections':
      return (
        hasAnyFilled(data.year1, ['revenue', 'costs']) ||
        hasAnyFilled(data.projections?.year1, ['revenue', 'costs'])
      );
    case 'eligible-schemes':
      return (
        (Array.isArray(data.selectedSchemes) && data.selectedSchemes.length > 0) ||
        (Array.isArray(data.schemesData) && data.schemesData.length > 0) ||
        (Array.isArray(data.schemes) && data.schemes.length > 0)
      );
    default:
      return Object.keys(compactValue(data) || {}).length > 0;
  }
}

export interface ChatOpenerSuggestion {
  title?: string;
  observation?: string;
  recommendation?: string;
  offloadingIdea?: string | null;
  why?: string;
  how?: string;
}

type TranslateFn = (key: string, options?: Record<string, any>) => string;

function formatInr(value: any): string | null {
  const n = Number(value);
  if (value === '' || value === null || value === undefined || Number.isNaN(n)) return null;
  return `₹${n.toLocaleString('en-IN')}`;
}

function formatRow(row: Record<string, any>): string | null {
  const name = String(row.particulars || row.schemeName || row.schemeCode || '').trim();
  const bits: string[] = [];
  if (row.area) bits.push(`${row.area} sq.ft`);
  if (row.qty) bits.push(`qty ${row.qty}`);
  if (row.quantity) bits.push(`qty ${row.quantity}`);
  if (row.noOfWorkers) bits.push(`${row.noOfWorkers} workers`);
  if (row.noOfStaff) bits.push(`${row.noOfStaff} staff`);
  if (row.rate) bits.push(formatInr(row.rate) ? `${formatInr(row.rate)}/unit` : `rate ${row.rate}`);
  if (row.wagesPerMonth) bits.push(`${formatInr(row.wagesPerMonth) || row.wagesPerMonth}/month`);
  if (row.amount) bits.push(formatInr(row.amount) || String(row.amount));
  if (!name && !bits.length) return null;
  if (name && bits.length) return `${name} (${bits.join(', ')})`;
  return name || bits.join(', ');
}

function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

function summarizeValue(value: any, depth = 0): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return formatInr(value) || String(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed.length > 80 ? `${trimmed.slice(0, 77)}…` : trimmed;
  }
  if (Array.isArray(value)) {
    const parts = value
      .slice(0, 4)
      .map((item) => {
        if (item && typeof item === 'object') return formatRow(item);
        return summarizeValue(item, depth + 1);
      })
      .filter(Boolean) as string[];
    if (!parts.length) return null;
    const extra = value.length > parts.length ? ` (+${value.length - parts.length} more)` : '';
    return parts.join('; ') + extra;
  }
  if (typeof value === 'object' && depth < 1) {
    const parts: string[] = [];
    for (const [key, child] of Object.entries(value)) {
      if (Array.isArray(child)) {
        const rows = summarizeValue(child, depth + 1);
        if (rows) parts.push(rows);
        continue;
      }
      const childText = summarizeValue(child, depth + 1);
      if (childText) parts.push(`${humanizeKey(key)}: ${childText}`);
      if (parts.length >= 4) break;
    }
    return parts.length ? parts.join('; ') : null;
  }
  return null;
}

export function summarizeCurrentStep(currentStep: any): string {
  const compact = compactValue(currentStep);
  if (!compact || typeof compact !== 'object') return '';
  const parts: string[] = [];

  for (const [key, value] of Object.entries(compact)) {
    if (Array.isArray(value)) {
      const rows = summarizeValue(value);
      if (rows) parts.push(rows);
    } else if (value && typeof value === 'object') {
      const nested = summarizeValue(value, 0);
      if (nested) parts.push(nested);
    } else {
      const text = summarizeValue(value);
      if (text) parts.push(`${humanizeKey(key)}: ${text}`);
    }
    if (parts.length >= 4) break;
  }

  const summary = parts.join('; ');
  return summary.length > 280 ? `${summary.slice(0, 277)}…` : summary;
}

export function buildStepChatOpener(params: {
  stepTitle: string;
  currentStep: any;
  suggestions?: ChatOpenerSuggestion[];
  t: TranslateFn;
}): string {
  const { stepTitle, currentStep, suggestions = [], t } = params;
  const details = summarizeCurrentStep(currentStep);
  const lead = details
    ? t('dprBuilder.assist.chatOpenerLead', { step: stepTitle, details })
    : t('dprBuilder.assist.chatOpenerLeadSparse', { step: stepTitle });

  const usable = (suggestions || []).filter(
    (s) => s && (s.title || s.observation || s.recommendation || s.why || s.how)
  );
  let body = '';
  if (usable.length) {
    const items = usable
      .map((s, i) => {
        const lines = [`${i + 1}. ${s.title || t('dprBuilder.assist.chatOpenerUntitled')}`];
        const observation = s.observation || s.why;
        const recommendation = s.recommendation || s.how;
        if (observation) lines.push(observation);
        if (recommendation) lines.push(recommendation);
        if (s.offloadingIdea) lines.push(s.offloadingIdea);
        return lines.join('\n');
      })
      .join('\n\n');
    body = `\n\n${t('dprBuilder.assist.chatOpenerImprovements')}\n\n${items}`;
  }

  return `${lead}${body}\n\n${t('dprBuilder.assist.chatOpenerAsk')}`;
}
