/**
 * Which control the live report shows for a field, so it behaves like the same question on the form:
 * a dropdown where the form has a dropdown, a number box for numbers, a date picker for dates.
 */
import { districtSelectOptions, townSelectOptions } from './apDistricts';
import { PMEGP_AGENCY_OPTIONS, PMEGP_AREA_OPTIONS, PMEGP_CATEGORY_OPTIONS, PMEGP_EDUCATION_OPTIONS } from './pmegpQuestions';
import { PMEGP_2ND_AGENCY_OPTIONS, PMEGP_2ND_PRIOR_SCHEME_OPTIONS, PMEGP_2ND_SECTOR_BAND_OPTIONS, PMEGP_2ND_YES_NO_OPTIONS } from './pmegp2ndQuestions';
import { SVANIDHI_PROOF_OPTIONS, SVANIDHI_TRANCHE_OPTIONS, SVANIDHI_VENDING_OPTIONS } from './svanidhiQuestions';
import { VISHWAKARMA_CRAFTS, VISHWAKARMA_TRAINING_OPTIONS, VISHWAKARMA_TRANCHE_OPTIONS, VISHWAKARMA_WORKPLACE_OPTIONS, VISHWAKARMA_YES_NO_OPTIONS } from './vishwakarmaQuestions';
import { MUDRA_CATEGORY_OPTIONS, MUDRA_LOAN_PURPOSE_OPTIONS, MUDRA_PREMISES_OPTIONS } from './mudraQuestions';
import { STANDUP_CATEGORY_OPTIONS, STANDUP_PREMISES_OPTIONS } from './standupQuestions';
import { PMFME_FSSAI_OPTIONS, PMFME_ODOP_OPTIONS, PMFME_PREMISES_OPTIONS, PMFME_UNIT_STAGE_OPTIONS } from './pmfmeQuestions';
import { SCLCSS_CATEGORY_OPTIONS, SCLCSS_PREMISES_OPTIONS, SCLCSS_UNIT_STAGE_OPTIONS } from './sclcssQuestions';
import { AP_TECH_PREMISES_OPTIONS, AP_TECH_SIZE_OPTIONS, AP_TECH_YES_NO_OPTIONS } from './apTechUpgradeQuestions';
import { AP_EDP_PREMISES_OPTIONS, AP_EDP_SIZE_OPTIONS, AP_EDP_YES_NO_OPTIONS } from './apEdpQuestions';
import { ECLGS_ACCOUNT_STATUS_OPTIONS } from './eclgsQuestions';
import { ZED_LEVEL_OPTIONS } from './zedQuestions';
import { MSME_IPR_STAGE_OPTIONS, MSME_IPR_TYPE_OPTIONS } from './msmeIprQuestions';
import { SCST_HUB_CATEGORY_OPTIONS, SCST_HUB_GEM_OPTIONS } from './scstHubQuestions';
import { ASPIRE_PREMISES_OPTIONS } from './aspireQuestions';
import { NHDP_LOOM_OPTIONS, NHDP_PREMISES_OPTIONS } from './nhdpQuestions';
import { CVY_BOARD_STATUS_OPTIONS, CVY_PREMISES_OPTIONS } from './cvyQuestions';
import { PTUAS_GMP_OPTIONS } from './ptuasQuestions';
import { PMPDS_FOCUS_OPTIONS } from './pmpdsQuestions';
import { CGTMSE_PURPOSE_OPTIONS, CGTMSE_WOMEN_OPTIONS } from './cgtmseQuestions';
import { AP_FPP_PREMISES_OPTIONS, AP_FPP_SIZE_OPTIONS, AP_FPP_YES_NO } from './apFppQuestions';
import { AP_CMEP_ACTIVITY_OPTIONS, AP_CMEP_AREA_OPTIONS, AP_CMEP_BOOSTER_OPTIONS, AP_CMEP_EDP_OPTIONS, AP_CMEP_YES_NO } from './apCmepQuestions';
import { OBMMS_CORP_OPTIONS, OBMMS_YES_NO } from './obmmsQuestions';
import { MSE_SPICE_SECTOR_OPTIONS } from './mseSpiceQuestions';
import { AP_PARKS_REBATE_OPTIONS, AP_PARKS_YES_NO } from './apParksQuestions';
import { RAMP_TEAM_ONDC_OPTIONS } from './rampTeamQuestions';
import { EPM_NIRYAT_CREDIT_OPTIONS } from './epmNiryatQuestions';

export type DocSelectOption = { value: string; label: string };

export type DocFieldInput =
  | { kind: 'text' | 'textarea' | 'number' | 'date' }
  | { kind: 'select'; options: DocSelectOption[]; disabled?: boolean; blank: string };

type Options = readonly DocSelectOption[];

const YES_NO: Options = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

/** Dropdowns that mean the same thing in every scheme. */
const COMMON_SELECTS: Record<string, Options> = {
  accountStatus: ECLGS_ACCOUNT_STATUS_OPTIONS,
  activityBand: AP_CMEP_ACTIVITY_OPTIONS,
  boosterCategory: AP_CMEP_BOOSTER_OPTIONS,
  circularSector: MSE_SPICE_SECTOR_OPTIONS,
  cmepArea: AP_CMEP_AREA_OPTIONS,
  coirBoardStatus: CVY_BOARD_STATUS_OPTIONS,
  covOrLor: SVANIDHI_PROOF_OPTIONS,
  deviceOrFormulation: PMPDS_FOCUS_OPTIONS,
  edpStatus: AP_CMEP_EDP_OPTIONS,
  educationStatus: PMEGP_EDUCATION_OPTIONS,
  familyExclusive: AP_CMEP_YES_NO,
  filingStage: MSME_IPR_STAGE_OPTIONS,
  firstLoanRepaid: PMEGP_2ND_YES_NO_OPTIONS,
  firstMmAdjusted: PMEGP_2ND_YES_NO_OPTIONS,
  marginMoneyAdjusted: PMEGP_2ND_YES_NO_OPTIONS,
  nerHill: PMEGP_2ND_YES_NO_OPTIONS,
  fpoShg: AP_FPP_YES_NO,
  fssai: PMFME_FSSAI_OPTIONS,
  gemExperience: SCST_HUB_GEM_OPTIONS,
  gmpStatus: PTUAS_GMP_OPTIONS,
  ipType: MSME_IPR_TYPE_OPTIONS,
  landRebateClaim: AP_PARKS_REBATE_OPTIONS,
  loomType: NHDP_LOOM_OPTIONS,
  mudraCategory: MUDRA_CATEGORY_OPTIONS,
  odopAligned: PMFME_ODOP_OPTIONS,
  ondcReady: RAMP_TEAM_ONDC_OPTIONS,
  pmegpArea: PMEGP_AREA_OPTIONS,
  pmegpCategory: PMEGP_CATEGORY_OPTIONS,
  prePostShipment: EPM_NIRYAT_CREDIT_OPTIONS,
  priorScheme: PMEGP_2ND_PRIOR_SCHEME_OPTIONS,
  priorSelfEmploymentLoan: VISHWAKARMA_YES_NO_OPTIONS,
  priorSubsidy: AP_CMEP_YES_NO,
  sectorBand: PMEGP_2ND_SECTOR_BAND_OPTIONS,
  standupCategory: STANDUP_CATEGORY_OPTIONS,
  trainingStage: VISHWAKARMA_TRAINING_OPTIONS,
  welfareCorporation: OBMMS_CORP_OPTIONS,
  whiteRiceCard: OBMMS_YES_NO,
  womenOwned: CGTMSE_WOMEN_OPTIONS,
  zedCurrentLevel: ZED_LEVEL_OPTIONS,
  zedTargetLevel: ZED_LEVEL_OPTIONS.filter((option) => option.value !== 'none'),
  apiicPark: YES_NO,
  scStOwned: AP_EDP_YES_NO_OPTIONS,
  craft: VISHWAKARMA_CRAFTS.map((craft) => ({ value: craft, label: craft })),
  interventionType: [
    { value: 'Hard', label: 'Hard' },
    { value: 'Soft', label: 'Soft' },
    { value: 'Both', label: 'Both' },
  ],
};

/** The same field name asks a different list in different schemes. */
const SCHEME_SELECTS: Record<string, Record<string, Options>> = {
  apDomicile: {
    AP_CMEP: AP_CMEP_YES_NO,
    AP_EDP: AP_EDP_YES_NO_OPTIONS,
    AP_FPP: AP_FPP_YES_NO,
    AP_PARKS: AP_PARKS_YES_NO,
    AP_TECH_UPGRADE: AP_TECH_YES_NO_OPTIONS,
  },
  specialCategory: {
    AP_EDP: AP_EDP_YES_NO_OPTIONS,
    AP_FPP: AP_FPP_YES_NO,
    AP_TECH_UPGRADE: AP_TECH_YES_NO_OPTIONS,
  },
  enterpriseSize: {
    AP_EDP: AP_EDP_SIZE_OPTIONS,
    AP_FPP: AP_FPP_SIZE_OPTIONS,
    AP_TECH_UPGRADE: AP_TECH_SIZE_OPTIONS,
  },
  loanPurpose: {
    CGTMSE: CGTMSE_PURPOSE_OPTIONS,
    MUDRA: MUDRA_LOAN_PURPOSE_OPTIONS,
  },
  loanTranche: {
    SVANIDHI: SVANIDHI_TRANCHE_OPTIONS,
    VISHWAKARMA: VISHWAKARMA_TRANCHE_OPTIONS,
  },
  pmegpAgency: {
    PMEGP: PMEGP_AGENCY_OPTIONS,
    PMEGP_2ND: PMEGP_2ND_AGENCY_OPTIONS,
  },
  premisesType: {
    AP_CMEP: [],
    AP_EDP: AP_EDP_PREMISES_OPTIONS,
    AP_FPP: AP_FPP_PREMISES_OPTIONS,
    AP_TECH_UPGRADE: AP_TECH_PREMISES_OPTIONS,
    ASPIRE: ASPIRE_PREMISES_OPTIONS,
    CVY: CVY_PREMISES_OPTIONS,
    MUDRA: MUDRA_PREMISES_OPTIONS,
    NHDP: NHDP_PREMISES_OPTIONS,
    PMFME: PMFME_PREMISES_OPTIONS,
    SCLCSS: SCLCSS_PREMISES_OPTIONS,
    STANDUP: STANDUP_PREMISES_OPTIONS,
  },
  sclcssCategory: {
    SCLCSS: SCLCSS_CATEGORY_OPTIONS,
    SCST_HUB: SCST_HUB_CATEGORY_OPTIONS,
  },
  unitStage: {
    PMFME: PMFME_UNIT_STAGE_OPTIONS,
    SCLCSS: SCLCSS_UNIT_STAGE_OPTIONS,
  },
  vendingType: {
    SVANIDHI: SVANIDHI_VENDING_OPTIONS,
  },
  workplaceType: {
    SVANIDHI: SVANIDHI_VENDING_OPTIONS,
    VISHWAKARMA: VISHWAKARMA_WORKPLACE_OPTIONS,
  },
};

const NUMBER_FIELDS = new Set([
  'additionalWcSought', 'administrativeExpenses', 'annualProductionVolume', 'annualSalesRealization', 'bankLoan',
  'breakEvenPoint', 'building', 'capacityUtilisationY1', 'catalogueSkus', 'controllingStakePercent', 'dailySales',
  'employmentGeneration', 'energyBaselineKwh', 'entrepreneurAge', 'estimatedFairCost', 'existingLimit',
  'existingTurnover', 'existingUnitYears', 'expectedSaving', 'experienceYears', 'exportCreditSought', 'furniture',
  'governmentGrant', 'indirectEmployment', 'directEmployment', 'land', 'leaseYears', 'loanAmountSought', 'loomCount',
  'machinery', 'maintenance', 'marketingExpenses', 'officeAreaSqft', 'otherSources', 'peakWcOutstanding', 'powerCost',
  'preliminaryAndPreOperative', 'priorSanctionAmount', 'productionAreaSqft', 'proposedLimit', 'proposedPmCost',
  'proposedWorkers', 'rawMaterialCost', 'securityDeposits', 'shifts', 'spvContribution', 'storageAreaSqft',
  'turnoverGrowth', 'utilitiesAndInfrastructure', 'wages', 'workingCapitalMargin', 'workshopAreaSqft',
  'yearOfIncorporation', 'yearsInOperation', 'yearsProfitable', 'yearsVending',
]);

const DATE_FIELDS = new Set(['commitmentDate', 'startDate', 'endDate']);

const TEXTAREA_FIELDS = new Set([
  'address', 'boardOfDirectors', 'civilWorks', 'clusterEvolution', 'competitorAnalysis', 'currentTools',
  'demandSupplyGap', 'description', 'executiveSummary', 'existingDemand', 'expectedBenefits', 'expectedLeanGain',
  'exportPotential', 'financialGaps', 'geography', 'impactNote', 'industrialInfrastructure', 'infrastructure',
  'infrastructureGaps', 'innovationBrief', 'intermediateProducts', 'justificationForIntervention',
  'keyEconomicActivities', 'landDetails', 'liquidityReason', 'majorBuyers', 'manufacturingProcess', 'marketingGaps',
  'nationalImportance', 'newTools', 'objectives', 'opportunities', 'plantAndMachinery', 'presentActivities',
  'priceTrends', 'processBottleneck', 'processOfManufacture', 'procurementFocus', 'productListNote',
  'productivityGain', 'promotionNeed', 'qualityFocus', 'rawMaterialAvailability', 'rawMaterialSources',
  'sectorDescription', 'skillGaps', 'stakeholders', 'stateLevelImportance', 'strengths', 'targetMarket',
  'technologyGaps', 'threats', 'waterAndEffluent', 'weaknesses', 'existingTech', 'proposedTech',
]);

/** Build a dropdown the way the form does, keeping a stored value that is no longer on the list. */
function withCurrent(options: Options, current: unknown, blank: string): DocFieldInput {
  const list = options.map((option) => ({ value: option.value, label: option.label }));
  const now = String(current ?? '').trim();
  if (now && !list.some((option) => option.value === now)) list.unshift({ value: now, label: now });
  return { kind: 'select', options: list, blank };
}

export function getDocFieldInput(
  name: string,
  opts: { path?: string; schemeCode?: string | null; lean?: boolean; data?: Record<string, any>; current?: unknown }
): DocFieldInput {
  const { schemeCode, lean, data, current } = opts;
  const step1 = data?.step1 || {};

  if (opts.path === 'step1.district') {
    const list = districtSelectOptions(String(current ?? '')).map((district) => ({ value: district, label: district }));
    return { kind: 'select', options: list, blank: 'Select district' };
  }
  if (opts.path === 'step1.location') {
    const towns = townSelectOptions(step1.district, String(current ?? '')).map((town) => ({ value: town, label: town }));
    return { kind: 'select', options: towns, disabled: !step1.district, blank: step1.district ? 'Select town' : 'Select district first' };
  }

  const bySchemeList = SCHEME_SELECTS[name];
  if (bySchemeList) {
    const list = schemeCode ? bySchemeList[schemeCode] : undefined;
    if (list && list.length) return withCurrent(list, current, 'Select');
    return { kind: 'text' };
  }
  if (COMMON_SELECTS[name]) return withCurrent(COMMON_SELECTS[name], current, 'Select');

  if (name === 'yearOfEstablishment') return { kind: lean ? 'date' : 'number' };
  if (DATE_FIELDS.has(name)) return { kind: 'date' };
  if (NUMBER_FIELDS.has(name)) return { kind: 'number' };
  if (TEXTAREA_FIELDS.has(name)) return { kind: 'textarea' };
  return { kind: 'text' };
}

const CELL_NUMBERS = new Set([
  'sharePercent', 'sellingPrice', 'count', 'monthlyPay', 'percent', 'quantity', 'unitCost', 'gst', 'transport',
  'installation', 'lifeYears', 'annualMaintenance', 'sales', 'rm', 'wages', 'power', 'netProfit', 'year', 'age',
  'experienceYears',
]);

/** Control for one cell inside a list table (machinery, promoters, milestones and so on). */
export function getDocCellInput(name: string, current?: unknown): DocFieldInput {
  if (CELL_NUMBERS.has(name)) return { kind: 'number' };
  if (name === 'startDate' || name === 'endDate') return { kind: 'date' };
  if (name === 'condition') {
    return withCurrent(
      [
        { value: 'new', label: 'New' },
        { value: 'used', label: 'Used' },
      ],
      current,
      'Select'
    );
  }
  return { kind: 'text' };
}
