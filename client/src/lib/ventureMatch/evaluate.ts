import { SCHEMES } from './schemes';
import {
  Activity,
  Budget,
  EvaluateResult,
  OwnerTag,
  SchemeDef,
  SchemeExclusion,
  SchemeMatch,
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

const MFG_LIKE: Activity[] = ['mfg', 'food', 'craft'];
const SERVICE_LIKE: Activity[] = ['service', 'trade', 'vending'];

function budgetMin(answers: VentureMatchAnswers): number | undefined {
  return answers.budget ? BUDGET_MIN[answers.budget] : undefined;
}

function owners(answers: VentureMatchAnswers): OwnerTag[] {
  return answers.owner || [];
}

function isSpecialCategory(answers: VentureMatchAnswers): boolean {
  return owners(answers).some((o) => ['female', 'sc', 'st', 'bc', 'pwd'].includes(o));
}

function isWomanOrScSt(answers: VentureMatchAnswers): boolean {
  return owners(answers).some((o) => ['female', 'sc', 'st'].includes(o));
}

function isFemale(answers: VentureMatchAnswers): boolean {
  return owners(answers).includes('female');
}

function hasUdyam(answers: VentureMatchAnswers): boolean | undefined {
  if (!answers.udyam) return undefined;
  return answers.udyam !== 'refuse';
}

function isAdult(answers: VentureMatchAnswers): boolean | undefined {
  if (!answers.age) return undefined;
  return answers.age !== 'under18';
}

function pmegpCap(activity?: Activity): number | undefined {
  if (!activity) return undefined;
  if (MFG_LIKE.includes(activity)) return 5_000_000;
  if (SERVICE_LIKE.includes(activity)) return 2_000_000;
  return undefined;
}

function pmegpEducationThreshold(activity?: Activity): number | undefined {
  if (!activity) return undefined;
  if (MFG_LIKE.includes(activity)) return 1_000_000;
  if (SERVICE_LIKE.includes(activity)) return 500_000;
  return undefined;
}

function pmegpSubsidy(answers: VentureMatchAnswers): string {
  const special = owners(answers).length ? isSpecialCategory(answers) : false;
  const rural = answers.location === 'rural';
  if (rural && special) return '35% margin money subsidy (rural, special category)';
  if (!rural && special) return '25% margin money subsidy (urban, special category)';
  if (rural) return '25% margin money subsidy (rural)';
  return '15% margin money subsidy (urban)';
}

function cgtmseCover(answers: VentureMatchAnswers): string {
  if (isFemale(answers)) return 'Up to 90% guarantee cover (women-owned unit)';
  return 'Credit guarantee cover without collateral';
}

function apSpecialBoost(answers: VentureMatchAnswers): string {
  if (answers.domicile === 'ap' && isSpecialCategory(answers)) {
    return ' +10% special category capital subsidy (AP domicile)';
  }
  return '';
}

type CheckResult = { ok: true; benefit: string } | { ok: false; reason: string } | { ok: 'skip' };

function checkScheme(scheme: SchemeDef, answers: VentureMatchAnswers): CheckResult {
  const min = budgetMin(answers);

  switch (scheme.code) {
    case 'SVANIDHI': {
      if (answers.activity && answers.activity !== 'vending') {
        return { ok: false, reason: 'For street vending only' };
      }
      if (answers.location === 'rural') {
        return { ok: false, reason: 'For urban / municipal street vendors' };
      }
      if (isAdult(answers) === false) {
        return { ok: false, reason: 'Applicant must be 18 or older' };
      }
      return { ok: true, benefit: 'Working-capital loan for street vendors' };
    }
    case 'VISHWAKARMA': {
      if (answers.activity && answers.activity !== 'craft') {
        return { ok: false, reason: 'For traditional craft / artisanal trades' };
      }
      if (isAdult(answers) === false) {
        return { ok: false, reason: 'Applicant must be 18 or older' };
      }
      if (answers.govtFamily === 'yes') {
        return { ok: false, reason: 'Immediate family in government service is not eligible' };
      }
      if (answers.priorSubsidy === 'outstanding') {
        return { ok: false, reason: 'Outstanding subsidised loan in the last 5 years' };
      }
      if (hasUdyam(answers) === false) {
        return { ok: false, reason: 'Udyam registration required' };
      }
      return { ok: true, benefit: 'Toolkit, skill, and credit support for traditional trades' };
    }
    case 'PMFME': {
      if (answers.activity && answers.activity !== 'food') {
        return { ok: false, reason: 'For food processing units' };
      }
      if (min !== undefined && min > 3_500_000) {
        return { ok: false, reason: 'Individual project cap around ₹35 lakh' };
      }
      if (hasUdyam(answers) === false) {
        return { ok: false, reason: 'Udyam registration required' };
      }
      return { ok: true, benefit: 'Credit-linked subsidy for micro food processing' };
    }
    case 'PMEGP': {
      if (answers.activity === 'crop') {
        return { ok: false, reason: 'Not for direct crop farming' };
      }
      if (answers.stage === 'brownfield') {
        return { ok: false, reason: 'New units only' };
      }
      if (isAdult(answers) === false) {
        return { ok: false, reason: 'Applicant must be 18 or older' };
      }
      if (hasUdyam(answers) === false) {
        return { ok: false, reason: 'Udyam registration required' };
      }
      const cap = pmegpCap(answers.activity);
      if (cap !== undefined && min !== undefined && min > cap) {
        return {
          ok: false,
          reason: MFG_LIKE.includes(answers.activity!)
            ? 'Manufacturing cap is ₹50 lakh'
            : 'Service / trade cap is ₹20 lakh',
        };
      }
      const eduCap = pmegpEducationThreshold(answers.activity);
      if (
        answers.education === 'below8th' &&
        eduCap !== undefined &&
        min !== undefined &&
        min >= eduCap
      ) {
        return {
          ok: false,
          reason: '8th standard required above ₹10 lakh (manufacturing) or ₹5 lakh (services)',
        };
      }
      return { ok: true, benefit: pmegpSubsidy(answers) };
    }
    case 'STANDUP': {
      if (answers.activity === 'crop') {
        return { ok: false, reason: 'Not for direct crop farming' };
      }
      if (answers.stage === 'brownfield') {
        return { ok: false, reason: 'Greenfield units only' };
      }
      if (owners(answers).length && !isWomanOrScSt(answers)) {
        return { ok: false, reason: 'Majority owner must be a woman, SC, or ST promoter' };
      }
      if (min !== undefined && min < 1_000_000) {
        return { ok: false, reason: 'Loan band starts at ₹10 lakh' };
      }
      if (min !== undefined && min > 10_000_000) {
        return { ok: false, reason: 'Loan band caps at ₹1 crore' };
      }
      if (isAdult(answers) === false) {
        return { ok: false, reason: 'Applicant must be 18 or older' };
      }
      if (hasUdyam(answers) === false) {
        return { ok: false, reason: 'Udyam registration required' };
      }
      return { ok: true, benefit: 'Bank loan ₹10 lakh–₹1 crore for SC/ST or women-owned greenfield units' };
    }
    case 'MUDRA': {
      if (answers.activity === 'crop') {
        return { ok: false, reason: 'Not for direct crop farming' };
      }
      if (min !== undefined && min > 2_000_000) {
        return { ok: false, reason: 'MUDRA covers up to ₹20 lakh' };
      }
      if (hasUdyam(answers) === false) {
        return { ok: false, reason: 'Udyam registration required' };
      }
      return { ok: true, benefit: 'Collateral-free micro loan (Shishu / Kishore / Tarun bands)' };
    }
    case 'CGTMSE': {
      if (answers.activity === 'crop') {
        return { ok: false, reason: 'Not for direct crop farming' };
      }
      if (hasUdyam(answers) === false) {
        return { ok: false, reason: 'Udyam registration required' };
      }
      return { ok: true, benefit: cgtmseCover(answers) };
    }
    case 'AP_EDP': {
      if (answers.domicile === 'other') {
        return { ok: false, reason: 'Andhra Pradesh domicile required' };
      }
      if (answers.activity && answers.activity !== 'mfg') {
        return { ok: false, reason: 'For manufacturing / production units' };
      }
      if (hasUdyam(answers) === false) {
        return { ok: false, reason: 'Udyam registration required' };
      }
      return {
        ok: true,
        benefit: `AP MSME capital subsidy${apSpecialBoost(answers)}`,
      };
    }
    case 'AP_FPP': {
      if (answers.domicile === 'other') {
        return { ok: false, reason: 'Andhra Pradesh domicile required' };
      }
      if (answers.activity && answers.activity !== 'food') {
        return { ok: false, reason: 'For food processing units' };
      }
      if (hasUdyam(answers) === false) {
        return { ok: false, reason: 'Udyam registration required' };
      }
      return {
        ok: true,
        benefit: `AP food processing capital subsidy${apSpecialBoost(answers)}`,
      };
    }
    case 'AP_TECH_UPGRADE': {
      if (answers.stage === 'greenfield') {
        return { ok: false, reason: 'For existing units upgrading technology' };
      }
      if (answers.domicile === 'other') {
        return { ok: false, reason: 'Andhra Pradesh domicile required' };
      }
      if (answers.activity && !['mfg', 'food'].includes(answers.activity)) {
        return { ok: false, reason: 'For manufacturing or food processing upgrades' };
      }
      if (hasUdyam(answers) === false) {
        return { ok: false, reason: 'Udyam registration required' };
      }
      return { ok: true, benefit: '20% technology upgradation subsidy for existing units' };
    }
    case 'MSE_SPICE': {
      if (answers.stage === 'greenfield') {
        return { ok: false, reason: 'For existing (brownfield) units' };
      }
      if (hasUdyam(answers) === false) {
        return { ok: false, reason: 'Udyam registration required' };
      }
      return { ok: true, benefit: 'RAMP support for existing unit expansion / circular upgrades' };
    }
    case 'OBMMS': {
      if (answers.riceCard === 'no') {
        return { ok: false, reason: 'Active White Rice Card required' };
      }
      if (answers.domicile === 'other') {
        return { ok: false, reason: 'Andhra Pradesh domicile required' };
      }
      if (answers.age && !['21to50', '51to60'].includes(answers.age)) {
        return { ok: false, reason: 'Age must be 21–60' };
      }
      return { ok: true, benefit: 'Back-ended subsidy on AP welfare corporation self-employment loan' };
    }
    case 'AP_PARKS': {
      if (answers.location && answers.location !== 'apiic') {
        return { ok: false, reason: 'Unit must be inside an APIIC industrial park' };
      }
      if (answers.domicile === 'other') {
        return { ok: false, reason: 'Andhra Pradesh domicile required' };
      }
      return { ok: true, benefit: '75% land-cost rebate in APIIC parks' };
    }
    case 'RAMP_TEAM': {
      if (answers.market && answers.market !== 'ecommerce') {
        return { ok: false, reason: 'For e-commerce / ONDC sellers' };
      }
      return { ok: true, benefit: 'Free ONDC onboarding and cataloguing support' };
    }
    case 'EPM_NIRYAT': {
      if (answers.market && answers.market !== 'export') {
        return { ok: false, reason: 'For direct international exporters' };
      }
      return { ok: true, benefit: '2.75% export interest subvention' };
    }
    default:
      return { ok: 'skip' };
  }
}

export function evaluate(answers: VentureMatchAnswers): EvaluateResult {
  const matches: SchemeMatch[] = [];
  const excluded: SchemeExclusion[] = [];

  for (const scheme of SCHEMES) {
    const result = checkScheme(scheme, answers);
    if (result.ok === 'skip') continue;
    if (result.ok === true) {
      matches.push({
        code: scheme.code,
        name: scheme.name,
        kind: scheme.kind,
        benefit: result.benefit,
      });
    } else {
      excluded.push({
        code: scheme.code,
        name: scheme.name,
        kind: scheme.kind,
        reason: result.reason,
      });
    }
  }

  return { matches, excluded };
}

export function remainingCount(answers: VentureMatchAnswers): number {
  return evaluate(answers).matches.length;
}
