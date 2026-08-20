import {
  Activity,
  Age,
  Budget,
  CriterionStatus,
  Legal,
  LocationType,
  OwnerTag,
  SchemeRule,
  VentureMatchAnswers,
} from './types';

const BUDGET_MIN: Record<Budget, number> = {
  under2L: 0,
  '2to5L': 200_000,
  '5to10L': 500_000,
  '10to20L': 1_000_000,
  '20to50L': 2_000_000,
  '50Lto1Cr': 5_000_000,
  '1to10Cr': 10_000_000,
  above10Cr: 100_000_000,
};

const PMFME_BUDGETS: Budget[] = ['under2L', '2to5L', '5to10L', '10to20L', '20to50L'];
const MFG_LIKE: Activity[] = ['mfg', 'food', 'craft'];
const SERVICE_LIKE: Activity[] = ['service', 'trade', 'vending'];
const OBMMS_OWNERS: OwnerTag[] = ['sc', 'st', 'bc', 'pwd'];
const STANDUP_OWNERS: OwnerTag[] = ['female', 'sc', 'st'];
const OBMMS_AGES: Age[] = ['21to50', '51to60'];
const SPECIAL_OWNERS: OwnerTag[] = ['female', 'sc', 'st', 'bc', 'pwd'];

function requireValue<T>(
  value: T | undefined,
  predicate: (v: T) => boolean
): CriterionStatus {
  if (value === undefined || value === null) return 'unknown';
  return predicate(value) ? 'pass' : 'fail';
}

function owners(answers: VentureMatchAnswers): OwnerTag[] | undefined {
  if (!answers.owner || answers.owner.length === 0) return undefined;
  return answers.owner;
}

function budgetMin(answers: VentureMatchAnswers): number | undefined {
  return answers.budget ? BUDGET_MIN[answers.budget] : undefined;
}

function isSpecialCategory(answers: VentureMatchAnswers): boolean {
  return (answers.owner || []).some((o) => SPECIAL_OWNERS.includes(o));
}

function isFemale(answers: VentureMatchAnswers): boolean {
  return (answers.owner || []).includes('female');
}

export function shouldShowOwnershipHint(answers: VentureMatchAnswers): boolean {
  const tags = answers.owner || [];
  return tags.includes('generalMale') && !tags.includes('female');
}

function pmegpSubsidy(answers: VentureMatchAnswers): string {
  const special = owners(answers) ? isSpecialCategory(answers) : false;
  const rural = answers.location === 'rural';
  if (rural && special) return 'ventureMatch.benefits.pmegpRuralSpecial';
  if (!rural && special) return 'ventureMatch.benefits.pmegpUrbanSpecial';
  if (rural) return 'ventureMatch.benefits.pmegpRural';
  return 'ventureMatch.benefits.pmegpUrban';
}

function apBoosted(answers: VentureMatchAnswers): boolean {
  return answers.domicile === 'ap' && isSpecialCategory(answers);
}

function pmegpEducation(answers: VentureMatchAnswers): CriterionStatus {
  const activity = answers.activity;
  const min = budgetMin(answers);
  if (!activity) return 'unknown';

  let threshold: number | undefined;
  if (MFG_LIKE.includes(activity)) threshold = 1_000_000;
  else if (SERVICE_LIKE.includes(activity)) threshold = 500_000;

  if (threshold === undefined) return 'pass';
  if (min === undefined) return 'unknown';
  if (min < threshold) return 'pass';
  return requireValue(answers.education, (edu) => edu === '8thPlus');
}

export const SCHEMES: SchemeRule[] = [
  {
    code: 'SVANIDHI',
    name: 'PM SVANidhi',
    kind: 'loan',
    benefit: () => 'ventureMatch.benefits.svanidhi',
    criteria: [
      {
        id: 'activity',
        questionId: 'activity',
        labelKey: 'ventureMatch.criteria.streetVending',
        test: (a) => requireValue(a.activity, (v) => v === 'vending'),
      },
      {
        id: 'location',
        questionId: 'location',
        labelKey: 'ventureMatch.criteria.urban',
        test: (a) => requireValue(a.location, (v) => v === 'urban'),
      },
      {
        id: 'age',
        questionId: 'age',
        labelKey: 'ventureMatch.criteria.age18',
        test: (a) => requireValue(a.age, (v) => v !== 'under18'),
      },
    ],
  },
  {
    code: 'VISHWAKARMA',
    name: 'PM Vishwakarma',
    kind: 'subsidy',
    benefit: () => 'ventureMatch.benefits.vishwakarma',
    criteria: [
      {
        id: 'activity',
        questionId: 'activity',
        labelKey: 'ventureMatch.criteria.craft',
        test: (a) => requireValue(a.activity, (v) => v === 'craft'),
      },
      {
        id: 'age',
        questionId: 'age',
        labelKey: 'ventureMatch.criteria.age18',
        test: (a) => requireValue(a.age, (v) => v !== 'under18'),
      },
      {
        id: 'priorSubsidy',
        questionId: 'priorSubsidy',
        labelKey: 'ventureMatch.criteria.noOutstandingSubsidy',
        test: (a) => requireValue(a.priorSubsidy, (v) => v !== 'outstanding'),
      },
      {
        id: 'govtFamily',
        questionId: 'govtFamily',
        labelKey: 'ventureMatch.criteria.noGovtFamily',
        test: (a) => requireValue(a.govtFamily, (v) => v === 'no'),
      },
    ],
  },
  {
    code: 'PMFME',
    name: 'PM Formalisation of Micro Food Processing Enterprises (PMFME)',
    kind: 'subsidy',
    benefit: () => 'ventureMatch.benefits.pmfme',
    criteria: [
      {
        id: 'activity',
        questionId: 'activity',
        labelKey: 'ventureMatch.criteria.foodProcessing',
        test: (a) => requireValue(a.activity, (v) => v === 'food'),
      },
      {
        id: 'budget',
        questionId: 'budget',
        labelKey: 'ventureMatch.criteria.budgetPmFme',
        test: (a) => requireValue(a.budget, (v) => PMFME_BUDGETS.includes(v)),
      },
      {
        id: 'legal',
        questionId: 'legal',
        labelKey: 'ventureMatch.criteria.legalSoleOrPartnership',
        test: (a) => requireValue(a.legal, (v: Legal) => v === 'sole' || v === 'partnership'),
      },
      {
        id: 'education',
        questionId: 'education',
        labelKey: 'ventureMatch.criteria.education8th',
        test: (a) => requireValue(a.education, (v) => v === '8thPlus'),
      },
    ],
  },
  {
    code: 'PMEGP',
    name: 'Prime Minister’s Employment Generation Programme (PMEGP)',
    kind: 'subsidy',
    benefit: (a) => pmegpSubsidy(a),
    criteria: [
      {
        id: 'stage',
        questionId: 'stage',
        labelKey: 'ventureMatch.criteria.greenfield',
        test: (a) => requireValue(a.stage, (v) => v === 'greenfield'),
      },
      {
        id: 'age',
        questionId: 'age',
        labelKey: 'ventureMatch.criteria.age18',
        test: (a) => requireValue(a.age, (v) => v !== 'under18'),
      },
      {
        id: 'activity',
        questionId: 'activity',
        labelKey: 'ventureMatch.criteria.notCrop',
        test: (a) => requireValue(a.activity, (v) => v !== 'crop'),
      },
      {
        id: 'education',
        questionId: 'education',
        labelKey: 'ventureMatch.criteria.pmegpEducation',
        test: pmegpEducation,
      },
    ],
  },
  {
    code: 'STANDUP',
    name: 'Stand-Up India',
    kind: 'loan',
    benefit: () => 'ventureMatch.benefits.standup',
    criteria: [
      {
        id: 'activity',
        questionId: 'activity',
        labelKey: 'ventureMatch.criteria.notCrop',
        test: (a) => requireValue(a.activity, (v) => v !== 'crop'),
      },
      {
        id: 'stage',
        questionId: 'stage',
        labelKey: 'ventureMatch.criteria.greenfield',
        test: (a) => requireValue(a.stage, (v) => v === 'greenfield'),
      },
      {
        id: 'owner',
        questionId: 'owner',
        labelKey: 'ventureMatch.criteria.womanScSt',
        test: (a) =>
          requireValue(owners(a), (tags) => tags.some((o) => STANDUP_OWNERS.includes(o))),
      },
      {
        id: 'budgetMin',
        questionId: 'budget',
        labelKey: 'ventureMatch.criteria.standupMin',
        test: (a) => requireValue(budgetMin(a), (min) => min >= 1_000_000),
      },
      {
        id: 'budgetMax',
        questionId: 'budget',
        labelKey: 'ventureMatch.criteria.standupMax',
        test: (a) => requireValue(budgetMin(a), (min) => min <= 10_000_000),
      },
      {
        id: 'age',
        questionId: 'age',
        labelKey: 'ventureMatch.criteria.age18',
        test: (a) => requireValue(a.age, (v) => v !== 'under18'),
      },
      {
        id: 'udyam',
        questionId: 'udyam',
        labelKey: 'ventureMatch.criteria.udyam',
        test: (a) => requireValue(a.udyam, (v) => v !== 'refuse'),
      },
    ],
  },
  {
    code: 'MUDRA',
    name: 'Pradhan Mantri MUDRA Yojana',
    kind: 'loan',
    benefit: () => 'ventureMatch.benefits.mudra',
    criteria: [
      {
        id: 'activity',
        questionId: 'activity',
        labelKey: 'ventureMatch.criteria.notCrop',
        test: (a) => requireValue(a.activity, (v) => v !== 'crop'),
      },
      {
        id: 'budget',
        questionId: 'budget',
        labelKey: 'ventureMatch.criteria.mudraCap',
        test: (a) => requireValue(budgetMin(a), (min) => min <= 2_000_000),
      },
      {
        id: 'udyam',
        questionId: 'udyam',
        labelKey: 'ventureMatch.criteria.udyam',
        test: (a) => requireValue(a.udyam, (v) => v !== 'refuse'),
      },
    ],
  },
  {
    code: 'CGTMSE',
    name: 'Credit Guarantee Fund Trust for Micro and Small Enterprises (CGTMSE)',
    kind: 'guarantee',
    benefit: (a) =>
      isFemale(a) ? 'ventureMatch.benefits.cgtmseWomen' : 'ventureMatch.benefits.cgtmse',
    criteria: [
      {
        id: 'udyam',
        questionId: 'udyam',
        labelKey: 'ventureMatch.criteria.udyam',
        test: (a) => requireValue(a.udyam, (v) => v === 'yes' || v === 'willing'),
      },
      {
        id: 'budget',
        questionId: 'budget',
        labelKey: 'ventureMatch.criteria.budgetUnder10Cr',
        test: (a) => requireValue(a.budget, (v) => v !== 'above10Cr'),
      },
      {
        id: 'activity',
        questionId: 'activity',
        labelKey: 'ventureMatch.criteria.notCrop',
        test: (a) => requireValue(a.activity, (v) => v !== 'crop'),
      },
    ],
  },
  {
    code: 'AP_EDP',
    name: 'AP MSME-EDP 4.0',
    kind: 'subsidy',
    benefit: (a) => (apBoosted(a) ? 'ventureMatch.benefits.apEdpBoost' : 'ventureMatch.benefits.apEdp'),
    criteria: [
      {
        id: 'activity',
        questionId: 'activity',
        labelKey: 'ventureMatch.criteria.manufacturing',
        test: (a) => requireValue(a.activity, (v) => v === 'mfg'),
      },
      {
        id: 'stage',
        questionId: 'stage',
        labelKey: 'ventureMatch.criteria.greenfield',
        test: (a) => requireValue(a.stage, (v) => v === 'greenfield'),
      },
      {
        id: 'domicile',
        questionId: 'domicile',
        labelKey: 'ventureMatch.criteria.apDomicile',
        test: (a) => requireValue(a.domicile, (v) => v === 'ap'),
      },
    ],
  },
  {
    code: 'AP_FPP',
    name: 'AP Food Processing Policy 4.0',
    kind: 'subsidy',
    benefit: (a) => (apBoosted(a) ? 'ventureMatch.benefits.apFppBoost' : 'ventureMatch.benefits.apFpp'),
    criteria: [
      {
        id: 'domicile',
        questionId: 'domicile',
        labelKey: 'ventureMatch.criteria.apDomicile',
        test: (a) => requireValue(a.domicile, (v) => v === 'ap'),
      },
      {
        id: 'activity',
        questionId: 'activity',
        labelKey: 'ventureMatch.criteria.foodProcessing',
        test: (a) => requireValue(a.activity, (v) => v === 'food'),
      },
      {
        id: 'udyam',
        questionId: 'udyam',
        labelKey: 'ventureMatch.criteria.udyam',
        test: (a) => requireValue(a.udyam, (v) => v !== 'refuse'),
      },
    ],
  },
  {
    code: 'AP_TECH_UPGRADE',
    name: 'AP Technology Upgradation Subsidy',
    kind: 'subsidy',
    benefit: () => 'ventureMatch.benefits.apTech',
    criteria: [
      {
        id: 'activity',
        questionId: 'activity',
        labelKey: 'ventureMatch.criteria.manufacturing',
        test: (a) => requireValue(a.activity, (v) => v === 'mfg'),
      },
      {
        id: 'stage',
        questionId: 'stage',
        labelKey: 'ventureMatch.criteria.brownfield',
        test: (a) => requireValue(a.stage, (v) => v === 'brownfield'),
      },
      {
        id: 'domicile',
        questionId: 'domicile',
        labelKey: 'ventureMatch.criteria.apDomicile',
        test: (a) => requireValue(a.domicile, (v) => v === 'ap'),
      },
    ],
  },
  {
    code: 'MSE_SPICE',
    name: 'RAMP MSE-SPICE',
    kind: 'subsidy',
    benefit: () => 'ventureMatch.benefits.mseSpice',
    criteria: [
      {
        id: 'stage',
        questionId: 'stage',
        labelKey: 'ventureMatch.criteria.brownfield',
        test: (a) => requireValue(a.stage, (v) => v === 'brownfield'),
      },
      {
        id: 'udyam',
        questionId: 'udyam',
        labelKey: 'ventureMatch.criteria.udyam',
        test: (a) => requireValue(a.udyam, (v) => v !== 'refuse'),
      },
    ],
  },
  {
    code: 'OBMMS',
    name: 'AP State Welfare Corporation Self-Employment Loans (OBMMS)',
    kind: 'subsidy',
    benefit: () => 'ventureMatch.benefits.obmms',
    criteria: [
      {
        id: 'domicile',
        questionId: 'domicile',
        labelKey: 'ventureMatch.criteria.apDomicile',
        test: (a) => requireValue(a.domicile, (v) => v === 'ap'),
      },
      {
        id: 'owner',
        questionId: 'owner',
        labelKey: 'ventureMatch.criteria.socialCategory',
        test: (a) =>
          requireValue(owners(a), (tags) => tags.some((o) => OBMMS_OWNERS.includes(o))),
      },
      {
        id: 'riceCard',
        questionId: 'riceCard',
        labelKey: 'ventureMatch.criteria.riceCard',
        test: (a) => requireValue(a.riceCard, (v) => v === 'yes'),
      },
      {
        id: 'age',
        questionId: 'age',
        labelKey: 'ventureMatch.criteria.age21to60',
        test: (a) => requireValue(a.age, (v) => OBMMS_AGES.includes(v)),
      },
    ],
  },
  {
    code: 'AP_PARKS',
    name: 'AP MSME-PARKS land-cost rebate',
    kind: 'subsidy',
    benefit: () => 'ventureMatch.benefits.apParks',
    criteria: [
      {
        id: 'location',
        questionId: 'location',
        labelKey: 'ventureMatch.criteria.apiic',
        test: (a) => requireValue(a.location, (v: LocationType) => v === 'apiic'),
      },
      {
        id: 'domicile',
        questionId: 'domicile',
        labelKey: 'ventureMatch.criteria.apDomicile',
        test: (a) => requireValue(a.domicile, (v) => v === 'ap'),
      },
    ],
  },
  {
    code: 'RAMP_TEAM',
    name: 'RAMP TEAM (ONDC)',
    kind: 'support',
    benefit: () => 'ventureMatch.benefits.rampTeam',
    criteria: [
      {
        id: 'market',
        questionId: 'market',
        labelKey: 'ventureMatch.criteria.ecommerce',
        test: (a) => requireValue(a.market, (v) => v === 'ecommerce'),
      },
    ],
  },
  {
    code: 'EPM_NIRYAT',
    name: 'EPM Niryat Protsahan',
    kind: 'subsidy',
    benefit: () => 'ventureMatch.benefits.epmNiryat',
    criteria: [
      {
        id: 'market',
        questionId: 'market',
        labelKey: 'ventureMatch.criteria.export',
        test: (a) => requireValue(a.market, (v) => v === 'export'),
      },
    ],
  },
];
