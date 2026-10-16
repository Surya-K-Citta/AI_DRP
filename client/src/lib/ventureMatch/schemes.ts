import {
  Activity,
  Age,
  Budget,
  CriterionStatus,
  Legal,
  LocationType,
  OwnerTag,
  SchemeRule,
  Udyam,
  VentureMatchAnswers,
} from './types';

const BUDGET_MIN: Record<Exclude<Budget, 'none' | 'notSure'>, number> = {
  under2L: 0,
  '2to5L': 200_000,
  '5to10L': 500_000,
  '10to20L': 1_000_000,
  '20to50L': 2_000_000,
  '50Lto1Cr': 5_000_000,
  '1to10Cr': 10_000_000,
  above10Cr: 100_000_000,
};

const NUMERIC_BUDGETS: Budget[] = [
  'under2L',
  '2to5L',
  '5to10L',
  '10to20L',
  '20to50L',
  '50Lto1Cr',
  '1to10Cr',
  'above10Cr',
];
const PMFME_BUDGETS: Budget[] = ['under2L', '2to5L', '5to10L', '10to20L', '20to50L'];
const CGTMSE_BUDGETS: Budget[] = [
  'under2L',
  '2to5L',
  '5to10L',
  '10to20L',
  '20to50L',
  '50Lto1Cr',
  '1to10Cr',
];
const MFG_LIKE: Activity[] = ['mfg', 'food', 'craft'];
const SERVICE_LIKE: Activity[] = ['service', 'trade', 'vending', 'knowledge'];
const ENTERPRISE_ACTIVITIES: Activity[] = [
  'mfg',
  'knowledge',
  'food',
  'craft',
  'service',
  'trade',
  'vending',
  'mixed',
];
const OBMMS_OWNERS: OwnerTag[] = ['sc', 'st', 'bc', 'pwd'];
const OBMMS_AGES: Age[] = ['21to50', '51to60'];
const SPECIAL_OWNERS: OwnerTag[] = ['female', 'sc', 'st', 'bc', 'pwd'];
const CMEP_ACTIVITIES: Activity[] = ['mfg', 'knowledge'];
const CMEP_BOOST_OWNERS: OwnerTag[] = ['female', 'transgender', 'exServiceman', 'pwd'];
const AGE_18_PLUS: Age[] = ['18to20', '21to50', '51to60', 'above60'];
const UDYAM_READY: Udyam[] = ['yes', 'willing', 'applied'];
const FIRM_LEGAL: Legal[] = ['sole', 'partnership', 'company'];
const AP_LOCATION: LocationType[] = ['urban', 'rural', 'apiic', 'home', 'notDecided'];
const EDP_LOCATION: LocationType[] = ['urban', 'rural', 'apiic'];

function requireValue<T>(
  value: T | undefined,
  predicate: (v: T) => boolean
): CriterionStatus {
  if (value === undefined || value === null) return 'unknown';
  return predicate(value) ? 'pass' : 'fail';
}

function passIf<T>(value: T | undefined, allowed: readonly T[]): CriterionStatus {
  return requireValue(value, (v) => allowed.includes(v));
}

function owners(answers: VentureMatchAnswers): OwnerTag[] | undefined {
  if (!answers.owner || answers.owner.length === 0) return undefined;
  return answers.owner;
}

function requireNumericBudget(
  answers: VentureMatchAnswers,
  predicate: (min: number, band: Exclude<Budget, 'none' | 'notSure'>) => boolean
): CriterionStatus {
  const band = answers.budget;
  if (band === undefined) return 'unknown';
  if (band === 'none' || band === 'notSure') return 'fail';
  return predicate(BUDGET_MIN[band], band) ? 'pass' : 'fail';
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

export function blocksAllSchemes(answers: VentureMatchAnswers): boolean {
  return answers.activity === 'notBusiness' || answers.activity === 'notSure';
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

/** True only if AP domicile AND at least one CMEP booster promoter tag. */
export function cmepBoosted(answers: VentureMatchAnswers): boolean {
  return (
    answers.domicile === 'ap' &&
    (answers.owner || []).some((o) => CMEP_BOOST_OWNERS.includes(o))
  );
}

function pmegpEducation(answers: VentureMatchAnswers): CriterionStatus {
  const activity = answers.activity;
  if (!activity) return 'unknown';

  let threshold: number | undefined;
  if (MFG_LIKE.includes(activity)) threshold = 1_000_000;
  else if (SERVICE_LIKE.includes(activity) || activity === 'mixed') threshold = 500_000;

  if (threshold === undefined) return 'pass';
  const band = answers.budget;
  if (band === undefined) return 'unknown';
  if (band === 'none' || band === 'notSure') return 'fail';
  if (BUDGET_MIN[band] < threshold) return 'pass';
  return passIf(answers.education, ['8thPlus']);
}

function pmegpStage(answers: VentureMatchAnswers): CriterionStatus {
  if (!answers.stage) return 'unknown';
  if (answers.stage === 'idea') return 'unknown';
  return answers.stage === 'greenfield' ? 'pass' : 'fail';
}

/** Central + Andhra Pradesh schemes. AP domicile is required only on AP state schemes (including CMEP). */
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
        test: (a) => passIf(a.activity, ['vending']),
      },
      {
        id: 'location',
        questionId: 'location',
        labelKey: 'ventureMatch.criteria.urban',
        test: (a) => passIf(a.location, ['urban']),
      },
      {
        id: 'age',
        questionId: 'age',
        labelKey: 'ventureMatch.criteria.age18',
        test: (a) => passIf(a.age, AGE_18_PLUS),
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
        test: (a) => passIf(a.activity, ['craft']),
      },
      {
        id: 'age',
        questionId: 'age',
        labelKey: 'ventureMatch.criteria.age18',
        test: (a) => passIf(a.age, AGE_18_PLUS),
      },
      {
        id: 'priorSubsidy',
        questionId: 'priorSubsidy',
        labelKey: 'ventureMatch.criteria.noOutstandingSubsidy',
        test: (a) => passIf(a.priorSubsidy, ['none', 'repaid']),
      },
      {
        id: 'govtFamily',
        questionId: 'govtFamily',
        labelKey: 'ventureMatch.criteria.noGovtFamily',
        test: (a) => passIf(a.govtFamily, ['no']),
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
        test: (a) => passIf(a.activity, ['food']),
      },
      {
        id: 'budget',
        questionId: 'budget',
        labelKey: 'ventureMatch.criteria.budgetPmFme',
        test: (a) => passIf(a.budget, PMFME_BUDGETS),
      },
      {
        id: 'legal',
        questionId: 'legal',
        labelKey: 'ventureMatch.criteria.legalPmfme',
        test: (a) => passIf(a.legal, ['sole', 'partnership', 'otherEntity'] as Legal[]),
      },
      {
        id: 'education',
        questionId: 'education',
        labelKey: 'ventureMatch.criteria.education8th',
        test: (a) => passIf(a.education, ['8thPlus']),
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
        test: pmegpStage,
      },
      {
        id: 'age',
        questionId: 'age',
        labelKey: 'ventureMatch.criteria.age18',
        test: (a) => passIf(a.age, AGE_18_PLUS),
      },
      {
        id: 'activity',
        questionId: 'activity',
        labelKey: 'ventureMatch.criteria.enterpriseActivity',
        test: (a) => passIf(a.activity, ENTERPRISE_ACTIVITIES),
      },
      {
        id: 'legal',
        questionId: 'legal',
        labelKey: 'ventureMatch.criteria.legalPmegp',
        test: (a) => passIf(a.legal, FIRM_LEGAL),
      },
      {
        id: 'budget',
        questionId: 'budget',
        labelKey: 'ventureMatch.criteria.budgetRequired',
        test: (a) => passIf(a.budget, NUMERIC_BUDGETS),
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
    code: 'MUDRA',
    name: 'Pradhan Mantri MUDRA Yojana',
    kind: 'loan',
    benefit: () => 'ventureMatch.benefits.mudra',
    criteria: [
      {
        id: 'activity',
        questionId: 'activity',
        labelKey: 'ventureMatch.criteria.enterpriseActivity',
        test: (a) => passIf(a.activity, ENTERPRISE_ACTIVITIES),
      },
      {
        id: 'legal',
        questionId: 'legal',
        labelKey: 'ventureMatch.criteria.legalRegistered',
        test: (a) => passIf(a.legal, FIRM_LEGAL),
      },
      {
        id: 'budget',
        questionId: 'budget',
        labelKey: 'ventureMatch.criteria.mudraCap',
        test: (a) => requireNumericBudget(a, (min) => min <= 2_000_000),
      },
      {
        id: 'age',
        questionId: 'age',
        labelKey: 'ventureMatch.criteria.age18',
        test: (a) => passIf(a.age, AGE_18_PLUS),
      },
      {
        id: 'udyam',
        questionId: 'udyam',
        labelKey: 'ventureMatch.criteria.udyam',
        test: (a) => passIf(a.udyam, UDYAM_READY),
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
        id: 'legal',
        questionId: 'legal',
        labelKey: 'ventureMatch.criteria.legalRegistered',
        test: (a) => passIf(a.legal, FIRM_LEGAL),
      },
      {
        id: 'udyam',
        questionId: 'udyam',
        labelKey: 'ventureMatch.criteria.udyam',
        test: (a) => passIf(a.udyam, UDYAM_READY),
      },
      {
        id: 'budget',
        questionId: 'budget',
        labelKey: 'ventureMatch.criteria.budgetUnder10Cr',
        test: (a) => passIf(a.budget, CGTMSE_BUDGETS),
      },
      {
        id: 'activity',
        questionId: 'activity',
        labelKey: 'ventureMatch.criteria.enterpriseActivity',
        test: (a) => passIf(a.activity, ENTERPRISE_ACTIVITIES),
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
        test: (a) => passIf(a.activity, ['mfg']),
      },
      {
        id: 'stage',
        questionId: 'stage',
        labelKey: 'ventureMatch.criteria.greenfield',
        test: (a) => passIf(a.stage, ['greenfield']),
      },
      {
        id: 'domicile',
        questionId: 'domicile',
        labelKey: 'ventureMatch.criteria.apDomicile',
        test: (a) => passIf(a.domicile, ['ap']),
      },
      {
        id: 'location',
        questionId: 'location',
        labelKey: 'ventureMatch.criteria.apUnitLocation',
        test: (a) => passIf(a.location, EDP_LOCATION),
      },
      {
        id: 'legal',
        questionId: 'legal',
        labelKey: 'ventureMatch.criteria.legalApEdp',
        test: (a) => passIf(a.legal, FIRM_LEGAL),
      },
      {
        id: 'udyam',
        questionId: 'udyam',
        labelKey: 'ventureMatch.criteria.udyam',
        test: (a) => passIf(a.udyam, UDYAM_READY),
      },
      {
        id: 'budget',
        questionId: 'budget',
        labelKey: 'ventureMatch.criteria.budgetRequired',
        test: (a) => passIf(a.budget, NUMERIC_BUDGETS),
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
        test: (a) => passIf(a.domicile, ['ap']),
      },
      {
        id: 'activity',
        questionId: 'activity',
        labelKey: 'ventureMatch.criteria.foodProcessing',
        test: (a) => passIf(a.activity, ['food']),
      },
      {
        id: 'legal',
        questionId: 'legal',
        labelKey: 'ventureMatch.criteria.legalPmfme',
        test: (a) => passIf(a.legal, ['sole', 'partnership', 'company', 'otherEntity'] as Legal[]),
      },
      {
        id: 'location',
        questionId: 'location',
        labelKey: 'ventureMatch.criteria.apLocation',
        test: (a) => passIf(a.location, AP_LOCATION),
      },
      {
        id: 'udyam',
        questionId: 'udyam',
        labelKey: 'ventureMatch.criteria.udyam',
        test: (a) => passIf(a.udyam, UDYAM_READY),
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
        test: (a) => passIf(a.activity, ['mfg']),
      },
      {
        id: 'stage',
        questionId: 'stage',
        labelKey: 'ventureMatch.criteria.brownfield',
        test: (a) => passIf(a.stage, ['brownfield', 'restart']),
      },
      {
        id: 'upgradeIntent',
        questionId: 'upgradeIntent',
        labelKey: 'ventureMatch.criteria.techUpgrade',
        test: (a) => {
          if (!a.upgradeIntent) return 'unknown';
          return a.upgradeIntent === 'techUpgrade' || a.upgradeIntent === 'expandSameLine'
            ? 'pass'
            : 'fail';
        },
      },
      {
        id: 'domicile',
        questionId: 'domicile',
        labelKey: 'ventureMatch.criteria.apDomicile',
        test: (a) => passIf(a.domicile, ['ap']),
      },
      {
        id: 'location',
        questionId: 'location',
        labelKey: 'ventureMatch.criteria.apLocation',
        test: (a) => passIf(a.location, AP_LOCATION),
      },
      {
        id: 'legal',
        questionId: 'legal',
        labelKey: 'ventureMatch.criteria.legalRegistered',
        test: (a) => passIf(a.legal, FIRM_LEGAL),
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
        id: 'legal',
        questionId: 'legal',
        labelKey: 'ventureMatch.criteria.legalRegistered',
        test: (a) => passIf(a.legal, FIRM_LEGAL),
      },
      {
        id: 'stage',
        questionId: 'stage',
        labelKey: 'ventureMatch.criteria.brownfield',
        test: (a) => passIf(a.stage, ['brownfield', 'restart']),
      },
      {
        id: 'udyam',
        questionId: 'udyam',
        labelKey: 'ventureMatch.criteria.udyam',
        test: (a) => passIf(a.udyam, UDYAM_READY),
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
        test: (a) => passIf(a.domicile, ['ap']),
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
        test: (a) => passIf(a.riceCard, ['yes']),
      },
      {
        id: 'age',
        questionId: 'age',
        labelKey: 'ventureMatch.criteria.age21to60',
        test: (a) => passIf(a.age, OBMMS_AGES),
      },
      {
        id: 'stage',
        questionId: 'stage',
        labelKey: 'ventureMatch.criteria.obmmsStage',
        test: (a) => passIf(a.stage, ['greenfield', 'brownfield', 'restart']),
      },
      {
        id: 'budget',
        questionId: 'budget',
        labelKey: 'ventureMatch.criteria.budgetRequired',
        test: (a) => passIf(a.budget, NUMERIC_BUDGETS),
      },
      {
        id: 'location',
        questionId: 'location',
        labelKey: 'ventureMatch.criteria.apLocation',
        test: (a) => passIf(a.location, AP_LOCATION),
      },
      {
        id: 'legal',
        questionId: 'legal',
        labelKey: 'ventureMatch.criteria.legalObmms',
        test: (a) => passIf(a.legal, ['unregistered', 'sole'] as Legal[]),
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
        test: (a) => passIf(a.location, ['apiic']),
      },
      {
        id: 'domicile',
        questionId: 'domicile',
        labelKey: 'ventureMatch.criteria.apDomicile',
        test: (a) => passIf(a.domicile, ['ap']),
      },
      {
        id: 'legal',
        questionId: 'legal',
        labelKey: 'ventureMatch.criteria.legalRegistered',
        test: (a) => passIf(a.legal, FIRM_LEGAL),
      },
    ],
  },
  {
    code: 'AP_CMEP',
    name: "AP Chief Minister's Entrepreneur Programme (AP CMEP)",
    kind: 'subsidy',
    benefit: (a) =>
      cmepBoosted(a) ? 'ventureMatch.benefits.apCmepBoost' : 'ventureMatch.benefits.apCmep',
    criteria: [
      {
        id: 'activity',
        questionId: 'activity',
        labelKey: 'ventureMatch.criteria.cmepActivity',
        test: (a) => passIf(a.activity, CMEP_ACTIVITIES),
      },
      {
        id: 'domicile',
        questionId: 'domicile',
        labelKey: 'ventureMatch.criteria.cmepDomicile',
        test: (a) => passIf(a.domicile, ['ap']),
      },
      {
        id: 'stage',
        questionId: 'stage',
        labelKey: 'ventureMatch.criteria.greenfield',
        test: (a) => passIf(a.stage, ['greenfield']),
      },
      {
        id: 'budget',
        questionId: 'budget',
        labelKey: 'ventureMatch.criteria.cmepCredit',
        test: (a) => passIf(a.budget, NUMERIC_BUDGETS),
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
        id: 'legal',
        questionId: 'legal',
        labelKey: 'ventureMatch.criteria.legalRegistered',
        test: (a) => passIf(a.legal, FIRM_LEGAL),
      },
      {
        id: 'market',
        questionId: 'market',
        labelKey: 'ventureMatch.criteria.ecommerce',
        test: (a) => passIf(a.market, ['ecommerce', 'both']),
      },
      {
        id: 'udyam',
        questionId: 'udyam',
        labelKey: 'ventureMatch.criteria.udyam',
        test: (a) => passIf(a.udyam, UDYAM_READY),
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
        id: 'legal',
        questionId: 'legal',
        labelKey: 'ventureMatch.criteria.legalRegistered',
        test: (a) => passIf(a.legal, FIRM_LEGAL),
      },
      {
        id: 'market',
        questionId: 'market',
        labelKey: 'ventureMatch.criteria.export',
        test: (a) => passIf(a.market, ['export']),
      },
      {
        id: 'udyam',
        questionId: 'udyam',
        labelKey: 'ventureMatch.criteria.udyam',
        test: (a) => passIf(a.udyam, UDYAM_READY),
      },
    ],
  },
  {
    code: 'PMEGP_2ND',
    name: '2nd Loan for Up-gradation of Existing PMEGP / REGP / MUDRA Units',
    kind: 'subsidy',
    benefit: () => 'ventureMatch.benefits.pmegp2nd',
    criteria: [
      {
        id: 'stage',
        questionId: 'stage',
        labelKey: 'ventureMatch.criteria.brownfield',
        test: (a) => {
          if (!a.stage) return 'unknown';
          if (a.stage === 'greenfield' || a.stage === 'idea') return 'fail';
          return passIf(a.stage, ['brownfield', 'restart']);
        },
      },
      {
        id: 'upgradeIntent',
        questionId: 'upgradeIntent',
        labelKey: 'ventureMatch.criteria.secondPmegpLoan',
        test: (a) => {
          if (!a.upgradeIntent) return 'unknown';
          return a.upgradeIntent === 'secondPmegpLoan' ? 'pass' : 'fail';
        },
      },
      {
        id: 'activity',
        questionId: 'activity',
        labelKey: 'ventureMatch.criteria.enterpriseActivity',
        test: (a) => passIf(a.activity, ENTERPRISE_ACTIVITIES),
      },
      {
        id: 'legal',
        questionId: 'legal',
        labelKey: 'ventureMatch.criteria.legalPmegp',
        test: (a) => passIf(a.legal, FIRM_LEGAL),
      },
      {
        id: 'age',
        questionId: 'age',
        labelKey: 'ventureMatch.criteria.age18',
        test: (a) => passIf(a.age, AGE_18_PLUS),
      },
      {
        id: 'budget',
        questionId: 'budget',
        labelKey: 'ventureMatch.criteria.budgetRequired',
        test: (a) => passIf(a.budget, NUMERIC_BUDGETS),
      },
      {
        id: 'priorSubsidy',
        questionId: 'priorSubsidy',
        labelKey: 'ventureMatch.criteria.priorSubsidyRepaid',
        test: (a) => {
          if (!a.priorSubsidy) return 'unknown';
          return a.priorSubsidy === 'repaid' ? 'pass' : a.priorSubsidy === 'outstanding' ? 'fail' : 'unknown';
        },
      },
    ],
  },
  {
    code: 'ECLGS',
    name: 'Emergency Credit Line Guarantee Scheme (ECLGS)',
    kind: 'guarantee',
    dprRoute: 'short',
    benefit: () => 'ventureMatch.benefits.eclgs',
    criteria: [
      {
        id: 'stage',
        questionId: 'stage',
        labelKey: 'ventureMatch.criteria.brownfield',
        test: (a) => {
          if (!a.stage) return 'unknown';
          if (a.stage === 'greenfield' || a.stage === 'idea') return 'fail';
          return passIf(a.stage, ['brownfield', 'restart']);
        },
      },
      {
        id: 'udyam',
        questionId: 'udyam',
        labelKey: 'ventureMatch.criteria.udyam',
        test: (a) => passIf(a.udyam, UDYAM_READY),
      },
      {
        id: 'upgradeIntent',
        questionId: 'upgradeIntent',
        labelKey: 'ventureMatch.criteria.workingCapitalOnly',
        test: (a) => {
          if (!a.upgradeIntent && a.supportType !== 'guarantee') return 'unknown';
          if (a.upgradeIntent === 'workingCapitalOnly' || a.supportType === 'guarantee') return 'pass';
          if (a.upgradeIntent) return 'fail';
          return 'unknown';
        },
      },
      {
        id: 'activity',
        questionId: 'activity',
        labelKey: 'ventureMatch.criteria.enterpriseActivity',
        test: (a) => passIf(a.activity, ENTERPRISE_ACTIVITIES),
      },
      {
        id: 'legal',
        questionId: 'legal',
        labelKey: 'ventureMatch.criteria.legalRegistered',
        test: (a) => passIf(a.legal, FIRM_LEGAL),
      },
    ],
  },
  {
    code: 'SCLCSS',
    name: 'Special Credit Linked Capital Subsidy Scheme (SCLCSS) for SC/ST MSEs',
    kind: 'subsidy',
    benefit: () => 'ventureMatch.benefits.sclcss',
    criteria: [
      {
        id: 'owner',
        questionId: 'owner',
        labelKey: 'ventureMatch.criteria.scStOwner',
        test: (a) =>
          requireValue(owners(a), (tags) => tags.some((o) => o === 'sc' || o === 'st')),
      },
      {
        id: 'stage',
        questionId: 'stage',
        labelKey: 'ventureMatch.criteria.brownfield',
        test: (a) => passIf(a.stage, ['brownfield', 'restart']),
      },
      {
        id: 'upgradeIntent',
        questionId: 'upgradeIntent',
        labelKey: 'ventureMatch.criteria.techUpgrade',
        test: (a) => {
          if (!a.upgradeIntent) return 'unknown';
          return a.upgradeIntent === 'techUpgrade' ? 'pass' : 'fail';
        },
      },
      {
        id: 'activity',
        questionId: 'activity',
        labelKey: 'ventureMatch.criteria.mfgFoodCraft',
        test: (a) => passIf(a.activity, MFG_LIKE),
      },
      {
        id: 'legal',
        questionId: 'legal',
        labelKey: 'ventureMatch.criteria.legalRegistered',
        test: (a) => passIf(a.legal, FIRM_LEGAL),
      },
      {
        id: 'budget',
        questionId: 'budget',
        labelKey: 'ventureMatch.criteria.budgetAbove2L',
        test: (a) => {
          if (!a.budget) return 'unknown';
          if (a.budget === 'under2L' || a.budget === 'none' || a.budget === 'notSure') return 'fail';
          return passIf(a.budget, NUMERIC_BUDGETS);
        },
      },
      {
        id: 'udyam',
        questionId: 'udyam',
        labelKey: 'ventureMatch.criteria.udyam',
        test: (a) => passIf(a.udyam, UDYAM_READY),
      },
    ],
  },
  {
    code: 'ZED',
    name: 'Sustainable ZED Certification',
    kind: 'support',
    dprRoute: 'short',
    benefit: () => 'ventureMatch.benefits.zed',
    criteria: [
      {
        id: 'supportType',
        questionId: 'supportType',
        labelKey: 'ventureMatch.criteria.certificationSupport',
        test: (a) => {
          if (!a.supportType && !a.qualityGoal) return 'unknown';
          if (a.supportType === 'certification' || a.qualityGoal === 'zed') return 'pass';
          if (a.qualityGoal) return 'fail';
          if (a.supportType) return 'fail';
          return 'unknown';
        },
      },
      {
        id: 'qualityGoal',
        questionId: 'qualityGoal',
        labelKey: 'ventureMatch.criteria.zedGoal',
        test: (a) => {
          if (!a.qualityGoal) return 'unknown';
          return a.qualityGoal === 'zed' ? 'pass' : 'fail';
        },
      },
      {
        id: 'udyam',
        questionId: 'udyam',
        labelKey: 'ventureMatch.criteria.udyam',
        test: (a) => passIf(a.udyam, UDYAM_READY),
      },
      {
        id: 'legal',
        questionId: 'legal',
        labelKey: 'ventureMatch.criteria.legalRegistered',
        test: (a) => passIf(a.legal, FIRM_LEGAL),
      },
    ],
  },
  {
    code: 'LEAN',
    name: 'Competitive LEAN',
    kind: 'support',
    dprRoute: 'short',
    benefit: () => 'ventureMatch.benefits.lean',
    criteria: [
      {
        id: 'qualityGoal',
        questionId: 'qualityGoal',
        labelKey: 'ventureMatch.criteria.leanGoal',
        test: (a) => {
          if (!a.qualityGoal) return 'unknown';
          return a.qualityGoal === 'lean' ? 'pass' : 'fail';
        },
      },
      {
        id: 'stage',
        questionId: 'stage',
        labelKey: 'ventureMatch.criteria.brownfield',
        test: (a) => passIf(a.stage, ['brownfield', 'restart']),
      },
      {
        id: 'activity',
        questionId: 'activity',
        labelKey: 'ventureMatch.criteria.mfgOrFood',
        test: (a) => passIf(a.activity, ['mfg', 'food']),
      },
      {
        id: 'udyam',
        questionId: 'udyam',
        labelKey: 'ventureMatch.criteria.udyam',
        test: (a) => passIf(a.udyam, UDYAM_READY),
      },
    ],
  },
  {
    code: 'MSME_IPR',
    name: 'MSME Innovative — Incubation, Design & IPR',
    kind: 'support',
    dprRoute: 'short',
    benefit: () => 'ventureMatch.benefits.msmeIpr',
    criteria: [
      {
        id: 'qualityGoal',
        questionId: 'qualityGoal',
        labelKey: 'ventureMatch.criteria.iprGoal',
        test: (a) => {
          if (!a.qualityGoal) return 'unknown';
          return a.qualityGoal === 'ipr' ? 'pass' : 'fail';
        },
      },
      {
        id: 'activity',
        questionId: 'activity',
        labelKey: 'ventureMatch.criteria.knowledgeMfgFood',
        test: (a) => passIf(a.activity, ['knowledge', 'mfg', 'food']),
      },
      {
        id: 'udyam',
        questionId: 'udyam',
        labelKey: 'ventureMatch.criteria.udyam',
        test: (a) => passIf(a.udyam, UDYAM_READY),
      },
    ],
  },
  {
    code: 'CHAMPIONS',
    name: 'MSME Champions Scheme',
    kind: 'support',
    dprRoute: 'cta',
    benefit: () => 'ventureMatch.benefits.champions',
    criteria: [
      {
        id: 'supportType',
        questionId: 'supportType',
        labelKey: 'ventureMatch.criteria.notBankLoan',
        test: (a) => {
          if (!a.supportType) return 'unknown';
          return a.supportType === 'loanOrSubsidy' ? 'fail' : 'pass';
        },
      },
      {
        id: 'activity',
        questionId: 'activity',
        labelKey: 'ventureMatch.criteria.enterpriseActivity',
        test: (a) => passIf(a.activity, ENTERPRISE_ACTIVITIES),
      },
    ],
  },
  {
    code: 'ESDP',
    name: 'Entrepreneurship and Skill Development Programme (ESDP)',
    kind: 'support',
    dprRoute: 'cta',
    benefit: () => 'ventureMatch.benefits.esdp',
    criteria: [
      {
        id: 'supportType',
        questionId: 'supportType',
        labelKey: 'ventureMatch.criteria.trainingSupport',
        test: (a) => {
          if (!a.supportType) return 'unknown';
          return a.supportType === 'training' ? 'pass' : 'fail';
        },
      },
      {
        id: 'age',
        questionId: 'age',
        labelKey: 'ventureMatch.criteria.age18',
        test: (a) => passIf(a.age, AGE_18_PLUS),
      },
    ],
  },
  {
    code: 'SCST_HUB',
    name: 'National SC/ST Hub',
    kind: 'support',
    dprRoute: 'short',
    benefit: () => 'ventureMatch.benefits.scstHub',
    criteria: [
      {
        id: 'owner',
        questionId: 'owner',
        labelKey: 'ventureMatch.criteria.scStOwner',
        test: (a) =>
          requireValue(owners(a), (tags) => tags.some((o) => o === 'sc' || o === 'st')),
      },
      {
        id: 'procurementInterest',
        questionId: 'procurementInterest',
        labelKey: 'ventureMatch.criteria.procurementInterest',
        test: (a) => {
          if (!a.procurementInterest) return 'unknown';
          return a.procurementInterest === 'yes' ? 'pass' : 'fail';
        },
      },
      {
        id: 'udyam',
        questionId: 'udyam',
        labelKey: 'ventureMatch.criteria.udyam',
        test: (a) => passIf(a.udyam, UDYAM_READY),
      },
    ],
  },
  {
    code: 'NTCEC',
    name: 'New Technology Centres and Extension Centres',
    kind: 'support',
    dprRoute: 'cta',
    benefit: () => 'ventureMatch.benefits.ntcec',
    criteria: [
      {
        id: 'supportType',
        questionId: 'supportType',
        labelKey: 'ventureMatch.criteria.trainingOrTech',
        test: (a) => {
          if (!a.supportType && !a.upgradeIntent) return 'unknown';
          if (
            a.supportType === 'training' ||
            a.upgradeIntent === 'techUpgrade'
          )
            return 'pass';
          if (a.supportType === 'loanOrSubsidy') return 'fail';
          return 'unknown';
        },
      },
      {
        id: 'activity',
        questionId: 'activity',
        labelKey: 'ventureMatch.criteria.manufacturing',
        test: (a) => passIf(a.activity, ['mfg']),
      },
    ],
  },
  {
    code: 'ASPIRE',
    name: 'ASPIRE — Promotion of Innovation, Rural Industries and Entrepreneurship',
    kind: 'support',
    dprRoute: 'short',
    benefit: () => 'ventureMatch.benefits.aspire',
    criteria: [
      {
        id: 'location',
        questionId: 'location',
        labelKey: 'ventureMatch.criteria.ruralPreferred',
        test: (a) => {
          if (!a.location) return 'unknown';
          if (a.location === 'rural' || a.location === 'home') return 'pass';
          return 'unknown';
        },
      },
      {
        id: 'stage',
        questionId: 'stage',
        labelKey: 'ventureMatch.criteria.ideaOrGreenfield',
        test: (a) => passIf(a.stage, ['idea', 'greenfield']),
      },
      {
        id: 'budget',
        questionId: 'budget',
        labelKey: 'ventureMatch.criteria.notAbove10Cr',
        test: (a) => {
          if (!a.budget) return 'unknown';
          return a.budget === 'above10Cr' ? 'fail' : 'pass';
        },
      },
      {
        id: 'activity',
        questionId: 'activity',
        labelKey: 'ventureMatch.criteria.enterpriseActivity',
        test: (a) => passIf(a.activity, ENTERPRISE_ACTIVITIES),
      },
    ],
  },
  {
    code: 'MSE_GIFT',
    name: 'MSE Green Investment and Financing for Transformation (MSE-GIFT)',
    kind: 'subsidy',
    benefit: () => 'ventureMatch.benefits.mseGift',
    criteria: [
      {
        id: 'stage',
        questionId: 'stage',
        labelKey: 'ventureMatch.criteria.brownfield',
        test: (a) => passIf(a.stage, ['brownfield', 'restart']),
      },
      {
        id: 'upgradeIntent',
        questionId: 'upgradeIntent',
        labelKey: 'ventureMatch.criteria.techUpgrade',
        test: (a) => {
          if (!a.upgradeIntent) return 'unknown';
          return a.upgradeIntent === 'techUpgrade' ? 'pass' : 'fail';
        },
      },
      {
        id: 'activity',
        questionId: 'activity',
        labelKey: 'ventureMatch.criteria.mfgOrFood',
        test: (a) => passIf(a.activity, ['mfg', 'food']),
      },
      {
        id: 'legal',
        questionId: 'legal',
        labelKey: 'ventureMatch.criteria.legalRegistered',
        test: (a) => passIf(a.legal, FIRM_LEGAL),
      },
      {
        id: 'udyam',
        questionId: 'udyam',
        labelKey: 'ventureMatch.criteria.udyam',
        test: (a) => passIf(a.udyam, UDYAM_READY),
      },
    ],
  },
  {
    code: 'PMS',
    name: 'Procurement and Marketing Scheme (PMS)',
    kind: 'support',
    dprRoute: 'short',
    benefit: () => 'ventureMatch.benefits.pms',
    criteria: [
      {
        id: 'supportType',
        questionId: 'supportType',
        labelKey: 'ventureMatch.criteria.marketingFair',
        test: (a) => {
          if (!a.supportType) return 'unknown';
          return a.supportType === 'marketingFair' ? 'pass' : 'fail';
        },
      },
      {
        id: 'udyam',
        questionId: 'udyam',
        labelKey: 'ventureMatch.criteria.udyam',
        test: (a) => passIf(a.udyam, UDYAM_READY),
      },
      {
        id: 'stage',
        questionId: 'stage',
        labelKey: 'ventureMatch.criteria.existingPreferred',
        test: (a) => {
          if (!a.stage) return 'unknown';
          if (a.stage === 'idea') return 'fail';
          return 'pass';
        },
      },
    ],
  },
  {
    code: 'CVY',
    name: 'Coir Vikas Yojana',
    kind: 'subsidy',
    benefit: () => 'ventureMatch.benefits.cvy',
    criteria: [
      {
        id: 'sectorFlag',
        questionId: 'sectorFlag',
        labelKey: 'ventureMatch.criteria.coirSector',
        test: (a) => {
          if (!a.sectorFlag) return 'unknown';
          return a.sectorFlag === 'coir' ? 'pass' : 'fail';
        },
      },
      {
        id: 'activity',
        questionId: 'activity',
        labelKey: 'ventureMatch.criteria.craftOrMfg',
        test: (a) => passIf(a.activity, ['craft', 'mfg']),
      },
      {
        id: 'legal',
        questionId: 'legal',
        labelKey: 'ventureMatch.criteria.legalRegistered',
        test: (a) => passIf(a.legal, [...FIRM_LEGAL, 'otherEntity'] as Legal[]),
      },
    ],
  },
  {
    code: 'NHDP',
    name: 'National Handloom Development Programme (NHDP)',
    kind: 'subsidy',
    dprRoute: 'short',
    benefit: () => 'ventureMatch.benefits.nhdp',
    criteria: [
      {
        id: 'sectorFlag',
        questionId: 'sectorFlag',
        labelKey: 'ventureMatch.criteria.handloomSector',
        test: (a) => {
          if (!a.sectorFlag) return 'unknown';
          return a.sectorFlag === 'handloom' ? 'pass' : 'fail';
        },
      },
      {
        id: 'activity',
        questionId: 'activity',
        labelKey: 'ventureMatch.criteria.craft',
        test: (a) => passIf(a.activity, ['craft']),
      },
    ],
  },
  {
    code: 'PTUAS',
    name: 'Pharmaceutical Technology Upgradation Assistance Scheme (PTUAS)',
    kind: 'subsidy',
    benefit: () => 'ventureMatch.benefits.ptuas',
    criteria: [
      {
        id: 'sectorFlag',
        questionId: 'sectorFlag',
        labelKey: 'ventureMatch.criteria.pharmaSector',
        test: (a) => {
          if (!a.sectorFlag) return 'unknown';
          return a.sectorFlag === 'pharma' ? 'pass' : 'fail';
        },
      },
      {
        id: 'stage',
        questionId: 'stage',
        labelKey: 'ventureMatch.criteria.brownfield',
        test: (a) => passIf(a.stage, ['brownfield', 'restart']),
      },
      {
        id: 'upgradeIntent',
        questionId: 'upgradeIntent',
        labelKey: 'ventureMatch.criteria.techUpgrade',
        test: (a) => {
          if (!a.upgradeIntent) return 'unknown';
          return a.upgradeIntent === 'techUpgrade' ? 'pass' : 'fail';
        },
      },
      {
        id: 'activity',
        questionId: 'activity',
        labelKey: 'ventureMatch.criteria.manufacturing',
        test: (a) => passIf(a.activity, ['mfg']),
      },
      {
        id: 'legal',
        questionId: 'legal',
        labelKey: 'ventureMatch.criteria.legalRegistered',
        test: (a) => passIf(a.legal, FIRM_LEGAL),
      },
      {
        id: 'udyam',
        questionId: 'udyam',
        labelKey: 'ventureMatch.criteria.udyam',
        test: (a) => passIf(a.udyam, UDYAM_READY),
      },
    ],
  },
  {
    code: 'PMPDS',
    name: 'Pharmaceutical & Medical Devices Promotion and Development Scheme (PMPDS)',
    kind: 'support',
    benefit: () => 'ventureMatch.benefits.pmpds',
    criteria: [
      {
        id: 'sectorFlag',
        questionId: 'sectorFlag',
        labelKey: 'ventureMatch.criteria.pharmaSector',
        test: (a) => {
          if (!a.sectorFlag) return 'unknown';
          return a.sectorFlag === 'pharma' ? 'pass' : 'fail';
        },
      },
      {
        id: 'activity',
        questionId: 'activity',
        labelKey: 'ventureMatch.criteria.manufacturing',
        test: (a) => passIf(a.activity, ['mfg']),
      },
      {
        id: 'legal',
        questionId: 'legal',
        labelKey: 'ventureMatch.criteria.legalRegistered',
        test: (a) => passIf(a.legal, FIRM_LEGAL),
      },
    ],
  },
  {
    code: 'MSE_CDP',
    name: 'Micro & Small Enterprises Cluster Development Programme (MSE-CDP)',
    kind: 'support',
    dprRoute: 'cluster',
    benefit: () => 'ventureMatch.benefits.mseCdp',
    criteria: [
      {
        id: 'supportType',
        questionId: 'supportType',
        labelKey: 'ventureMatch.criteria.clusterCfc',
        test: (a) => {
          if (!a.supportType) return 'unknown';
          return a.supportType === 'clusterCfc' ? 'pass' : 'fail';
        },
      },
    ],
  },
  {
    code: 'SFURTI',
    name: 'Scheme of Fund for Regeneration of Traditional Industries (SFURTI)',
    kind: 'support',
    dprRoute: 'cluster',
    benefit: () => 'ventureMatch.benefits.sfurti',
    criteria: [
      {
        id: 'supportType',
        questionId: 'supportType',
        labelKey: 'ventureMatch.criteria.clusterCfc',
        test: (a) => {
          if (!a.supportType) return 'unknown';
          return a.supportType === 'clusterCfc' ? 'pass' : 'fail';
        },
      },
      {
        id: 'activity',
        questionId: 'activity',
        labelKey: 'ventureMatch.criteria.craft',
        test: (a) => {
          if (!a.activity) return 'unknown';
          return a.activity === 'craft' ? 'pass' : 'unknown';
        },
      },
    ],
  },
  {
    code: 'AP_CDP',
    name: 'Andhra Pradesh Cluster Development Programme (APCDP)',
    kind: 'support',
    dprRoute: 'cluster',
    benefit: () => 'ventureMatch.benefits.apCdp',
    criteria: [
      {
        id: 'supportType',
        questionId: 'supportType',
        labelKey: 'ventureMatch.criteria.clusterCfc',
        test: (a) => {
          if (!a.supportType) return 'unknown';
          return a.supportType === 'clusterCfc' ? 'pass' : 'fail';
        },
      },
      {
        id: 'domicile',
        questionId: 'domicile',
        labelKey: 'ventureMatch.criteria.apDomicile',
        test: (a) => passIf(a.domicile, ['ap', 'planningAp']),
      },
    ],
  },
  {
    code: 'APICF',
    name: 'Assistance to Pharmaceutical Industry for Common Facilities (APICF)',
    kind: 'support',
    dprRoute: 'cluster',
    benefit: () => 'ventureMatch.benefits.apicf',
    criteria: [
      {
        id: 'supportType',
        questionId: 'supportType',
        labelKey: 'ventureMatch.criteria.clusterCfc',
        test: (a) => {
          if (!a.supportType) return 'unknown';
          return a.supportType === 'clusterCfc' ? 'pass' : 'fail';
        },
      },
      {
        id: 'sectorFlag',
        questionId: 'sectorFlag',
        labelKey: 'ventureMatch.criteria.pharmaSector',
        test: (a) => {
          if (!a.sectorFlag) return 'unknown';
          return a.sectorFlag === 'pharma' ? 'pass' : 'fail';
        },
      },
    ],
  },
];

/** Schemes that belong on Create New Latest DPR picker (exclude cluster / pure CTAs). */
export function isIndividualPickerScheme(code: string): boolean {
  const scheme = SCHEMES.find((s) => s.code === code);
  if (!scheme) return true;
  const route = scheme.dprRoute || 'full';
  return route === 'full' || route === 'short';
}
