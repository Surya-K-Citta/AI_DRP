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
