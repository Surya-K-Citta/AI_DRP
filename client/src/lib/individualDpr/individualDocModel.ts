/**
 * Scheme-only DPR document model for Create New Latest DPR.
 * Sections follow getSchemeSteps(); fields follow questions actually asked.
 */

import type { Budget } from '@/lib/ventureMatch/types';
import {
  extraFieldsForScheme,
  getStep18Uploads,
  hideComplexCapex,
  type UploadField,
} from '@/lib/individualDpr/schemeFormConfig';
import { getSchemeSteps, type SchemeStepDef } from '@/lib/individualDpr/schemeStepCatalog';
import { getUnitName } from '@/lib/individualDpr/toIndividualPayload';
import { kindLabel, type BusinessKind } from '@/lib/individualDpr/businessKind';
import { SVANIDHI_PROOF_OPTIONS, SVANIDHI_TRANCHE_OPTIONS, SVANIDHI_VENDING_OPTIONS } from '@/lib/individualDpr/svanidhiQuestions';
import { VISHWAKARMA_TRAINING_OPTIONS, VISHWAKARMA_TRANCHE_OPTIONS, VISHWAKARMA_WORKPLACE_OPTIONS, VISHWAKARMA_YES_NO_OPTIONS } from '@/lib/individualDpr/vishwakarmaQuestions';
import { PMEGP_AGENCY_OPTIONS, PMEGP_AREA_OPTIONS, PMEGP_CATEGORY_OPTIONS, PMEGP_EDUCATION_OPTIONS } from '@/lib/individualDpr/pmegpQuestions';
import { PMEGP_2ND_AGENCY_OPTIONS, PMEGP_2ND_PRIOR_SCHEME_OPTIONS, PMEGP_2ND_SECTOR_BAND_OPTIONS, PMEGP_2ND_YES_NO_OPTIONS } from '@/lib/individualDpr/pmegp2ndQuestions';
import { MUDRA_CATEGORY_OPTIONS, MUDRA_LOAN_PURPOSE_OPTIONS, MUDRA_PREMISES_OPTIONS } from '@/lib/individualDpr/mudraQuestions';
import { STANDUP_CATEGORY_OPTIONS, STANDUP_PREMISES_OPTIONS } from '@/lib/individualDpr/standupQuestions';
import { PMFME_FSSAI_OPTIONS, PMFME_ODOP_OPTIONS, PMFME_PREMISES_OPTIONS, PMFME_UNIT_STAGE_OPTIONS } from '@/lib/individualDpr/pmfmeQuestions';
import { SCLCSS_CATEGORY_OPTIONS, SCLCSS_PREMISES_OPTIONS, SCLCSS_UNIT_STAGE_OPTIONS } from '@/lib/individualDpr/sclcssQuestions';
import { AP_TECH_PREMISES_OPTIONS, AP_TECH_SIZE_OPTIONS, AP_TECH_YES_NO_OPTIONS } from '@/lib/individualDpr/apTechUpgradeQuestions';
import { AP_EDP_PREMISES_OPTIONS, AP_EDP_SIZE_OPTIONS, AP_EDP_YES_NO_OPTIONS } from '@/lib/individualDpr/apEdpQuestions';
import { ECLGS_ACCOUNT_STATUS_OPTIONS } from '@/lib/individualDpr/eclgsQuestions';
import { ZED_LEVEL_OPTIONS } from '@/lib/individualDpr/zedQuestions';
import { MSME_IPR_STAGE_OPTIONS, MSME_IPR_TYPE_OPTIONS } from '@/lib/individualDpr/msmeIprQuestions';
import { SCST_HUB_CATEGORY_OPTIONS, SCST_HUB_GEM_OPTIONS } from '@/lib/individualDpr/scstHubQuestions';
import { ASPIRE_PREMISES_OPTIONS } from '@/lib/individualDpr/aspireQuestions';
import { NHDP_LOOM_OPTIONS, NHDP_PREMISES_OPTIONS } from '@/lib/individualDpr/nhdpQuestions';
import { CVY_BOARD_STATUS_OPTIONS, CVY_PREMISES_OPTIONS } from '@/lib/individualDpr/cvyQuestions';
import { PTUAS_GMP_OPTIONS } from '@/lib/individualDpr/ptuasQuestions';
import { PMPDS_FOCUS_OPTIONS } from '@/lib/individualDpr/pmpdsQuestions';
import { CGTMSE_PURPOSE_OPTIONS, CGTMSE_WOMEN_OPTIONS } from '@/lib/individualDpr/cgtmseQuestions';
import { AP_FPP_PREMISES_OPTIONS, AP_FPP_SIZE_OPTIONS, AP_FPP_YES_NO } from '@/lib/individualDpr/apFppQuestions';
import { AP_CMEP_ACTIVITY_OPTIONS, AP_CMEP_BOOSTER_OPTIONS, AP_CMEP_YES_NO } from '@/lib/individualDpr/apCmepQuestions';
import { OBMMS_CORP_OPTIONS, OBMMS_YES_NO } from '@/lib/individualDpr/obmmsQuestions';
import { MSE_SPICE_SECTOR_OPTIONS } from '@/lib/individualDpr/mseSpiceQuestions';
import { AP_PARKS_REBATE_OPTIONS, AP_PARKS_YES_NO } from '@/lib/individualDpr/apParksQuestions';
import { RAMP_TEAM_ONDC_OPTIONS } from '@/lib/individualDpr/rampTeamQuestions';
import { EPM_NIRYAT_CREDIT_OPTIONS } from '@/lib/individualDpr/epmNiryatQuestions';

export type DocFieldSource = 'step' | 'extras';

export type IndividualDocField = {
  name: string;
  label: string;
  source: DocFieldSource;
  /** Store path for live-preview hits, e.g. step1.unitName or schemeExtras.craft */
  path: string;
};

const LEAN_UNIT_CODES = new Set([
  'PMEGP',
  'PMEGP_2ND',
  'MUDRA',
  'STANDUP',
  'PMFME',
  'SCLCSS',
  'AP_TECH_UPGRADE',
  'AP_EDP',
  'VISHWAKARMA',
  'SVANIDHI',
  'ECLGS',
  'ZED',
  'LEAN',
  'MSME_IPR',
  'PMS',
  'SCST_HUB',
  'ASPIRE',
  'NHDP',
  'CVY',
  'MSE_GIFT',
  'PTUAS',
  'PMPDS',
  'CGTMSE',
  'AP_FPP',
  'AP_CMEP',
  'OBMMS',
  'MSE_SPICE',
  'AP_PARKS',
  'RAMP_TEAM',
  'EPM_NIRYAT',
]);

export const EXTRA_FIELD_LABELS: Record<string, string> = {
  yearsInOperation: 'Years in operation',
  existingTurnover: 'Existing annual turnover',
  existingLimit: 'Existing credit limit',
  experienceYears: 'Experience (years)',
  priorSanctionAmount: 'Prior sanction amount',
  marginMoneyAdjusted: 'Margin money already adjusted',
  yearsProfitable: 'Years of profit',
  sectorBand: 'Sector band',
  rawMaterialSources: 'Raw material sources',
  udyamStatus: 'Udyam status',
  loanAmountSought: 'Loan amount sought',
  directEmployment: 'Direct employment (count)',
  indirectEmployment: 'Indirect employment (count)',
  impactNote: 'Short impact note',
  powerRequirement: 'Power requirement',
  educationStatus: 'Education',
  pmegpAgency: 'Implementing agency',
  pmegpOwnPercent: 'Own contribution %',
  pmegpSubsidyPercent: 'Margin money / subsidy %',
  entrepreneurName: 'Entrepreneur name',
  entrepreneurAge: 'Age',
  premisesType: 'Premises type',
  processOfManufacture: 'Process of manufacture',
  executiveSummary: 'Executive summary',
  installedCapacity: 'Installed / proposed capacity',
  existingCapacity: 'Existing capacity (before upgrade)',
  capacityUtilisationY1: 'Capacity utilisation Year 1 (%)',
  proposedWorkers: 'Proposed workers (nos.)',
  existingTech: 'Existing technology',
  proposedTech: 'Proposed technology / upgrade',
  productivityGain: 'Expected productivity / quality / cost gain',
  craft: 'Craft / trade',
  currentTools: 'Current tools',
  newTools: 'New tools needed',
  trainingStage: 'Training stage',
  loanTranche: 'Loan tranche',
  priorSelfEmploymentLoan: 'Similar self-employment loan in last 5 years?',
  yearsPractising: 'Years practising this craft',
  workplaceType: 'Workplace',
  covOrLor: 'Vending proof',
  upiQr: 'UPI ID',
  vendingType: 'Vending type / pitch',
  yearsVending: 'Years in street vending',
  dailySales: 'Approx daily sales (₹)',
  fssai: 'FSSAI status',
  unitStage: 'Unit stage',
  odopAligned: 'ODOP aligned?',
  enterpriseSize: 'Enterprise size',
  specialCategory: 'Special category',
  scStOwned: 'SC/ST wholly owned?',
  apDomicile: 'AP domicile',
  apiicPark: 'Unit inside an APIIC park?',
  fpoShg: 'FPO / SHG',
  pmegpCategory: 'Category',
  pmegpArea: 'Area (rural / urban)',
  implementingAgency: 'Implementing agency',
  education: 'Education',
  priorScheme: 'Prior scheme',
  firstSubsidyYear: 'Year of first subsidy',
  firstProjectCost: 'First sanction / project cost (₹ Lakhs)',
  firstLoanRepaid: 'First loan repaid in time?',
  firstMmAdjusted: 'First margin money adjusted?',
  nerHill: 'NER / Hill State?',
  mudraCategory: 'PMMY category',
  loanPurpose: 'Loan purpose',
  standupCategory: 'Eligible category',
  controllingStakePercent: 'Controlling stake %',
  compositeLoan: 'Composite loan sought (₹ Lakhs)',
  sclcssCategory: 'SC / ST category',
  existingUnitYears: 'Existing unit years',
  proposedPmCost: 'Proposed P&M cost (₹ Lakhs)',
  energyBaselineKwh: 'Energy baseline (kWh / month)',
  expectedSaving: 'Expected saving (%)',
  eeEquipment: 'EE equipment focus',
  gmpStatus: 'GMP status',
  productLicence: 'Product licence',
  deviceOrFormulation: 'Focus',
  promotionNeed: 'Promotion / development need',
  womenOwned: 'Women-owned',
  proposedLimit: 'Proposed limit (₹ Lakhs)',
  activityBand: 'Activity band',
  cmepArea: 'Urban or rural',
  edpStatus: 'EDP training',
  priorSubsidy: 'Earlier government subsidy',
  familyExclusive: 'Only one person in the family for this scheme',
  boosterCategory: 'Booster category',
  welfareCorporation: 'Welfare corporation',
  whiteRiceCard: 'White rice card',
  activityTrade: 'Activity / trade',
  circularSector: 'Circular sector',
  apiicParkName: 'APIIC / park name',
  plotArea: 'Plot area',
  landRebateClaim: 'Land rebate claim',
  scStOrWomen: 'SC/ST or women category',
  ondcReady: 'ONDC readiness',
  catalogueSkus: 'Catalogue SKUs (approx)',
  productListNote: 'Product list note',
  exportMarkets: 'Export markets',
  hsnLines: 'HSN lines',
  prePostShipment: 'Pre / post shipment',
  exportCreditSought: 'Export credit sought (₹ Lakhs)',
  peakWcOutstanding: 'Peak Q4 WC outstanding (₹ Lakhs)',
  additionalWcSought: 'Additional ECLGS WC sought (₹ Lakhs)',
  accountStatus: 'Account status',
  liquidityReason: 'Why additional liquidity is needed',
  existingWcLimit: 'Existing fund-based WC limit (₹ Lakhs)',
  zedCurrentLevel: 'Current ZED level',
  zedTargetLevel: 'Target ZED level',
  qualityFocus: 'Quality / sustainability focus',
  processBottleneck: 'Main process bottleneck',
  shopFloorSize: 'Shop-floor size / lines',
  expectedLeanGain: 'Expected lean gain',
  ipType: 'IP type',
  filingStage: 'Filing stage',
  inventionTitle: 'Invention / mark title',
  eventName: 'Event / fair name',
  stallSize: 'Stall size',
  fairCity: 'Fair city',
  estimatedFairCost: 'Estimated fair cost (₹ Lakhs)',
  gemExperience: 'GeM experience',
  procurementFocus: 'Procurement focus',
  incubatorName: 'Incubator / LBI name',
  innovationBrief: 'Innovation / livelihood brief',
  livelihoodFocus: 'Innovation / livelihood brief',
  loomType: 'Loom type',
  weaverId: 'Weaver ID / corp membership',
  productLine: 'Product line',
  yarnSource: 'Yarn source',
  coirProductLine: 'Coir product line',
  coirBoardStatus: 'Coir Board status',
};

const OPTION_LISTS: { value: string; label: string }[][] = [
  SVANIDHI_PROOF_OPTIONS,
  SVANIDHI_TRANCHE_OPTIONS,
  SVANIDHI_VENDING_OPTIONS,
  VISHWAKARMA_TRAINING_OPTIONS,
  VISHWAKARMA_TRANCHE_OPTIONS,
  VISHWAKARMA_WORKPLACE_OPTIONS,
  VISHWAKARMA_YES_NO_OPTIONS,
  PMEGP_CATEGORY_OPTIONS,
  PMEGP_AREA_OPTIONS,
  PMEGP_AGENCY_OPTIONS,
  PMEGP_EDUCATION_OPTIONS,
  PMEGP_2ND_PRIOR_SCHEME_OPTIONS,
  PMEGP_2ND_AGENCY_OPTIONS,
  PMEGP_2ND_SECTOR_BAND_OPTIONS,
  PMEGP_2ND_YES_NO_OPTIONS,
  MUDRA_CATEGORY_OPTIONS,
  MUDRA_PREMISES_OPTIONS,
  MUDRA_LOAN_PURPOSE_OPTIONS,
  STANDUP_CATEGORY_OPTIONS,
  STANDUP_PREMISES_OPTIONS,
  PMFME_UNIT_STAGE_OPTIONS,
  PMFME_FSSAI_OPTIONS,
  PMFME_ODOP_OPTIONS,
  PMFME_PREMISES_OPTIONS,
  SCLCSS_CATEGORY_OPTIONS,
  SCLCSS_UNIT_STAGE_OPTIONS,
  SCLCSS_PREMISES_OPTIONS,
  AP_TECH_SIZE_OPTIONS,
  AP_TECH_YES_NO_OPTIONS,
  AP_TECH_PREMISES_OPTIONS,
  AP_EDP_SIZE_OPTIONS,
  AP_EDP_YES_NO_OPTIONS,
  AP_EDP_PREMISES_OPTIONS,
  ECLGS_ACCOUNT_STATUS_OPTIONS,
  ZED_LEVEL_OPTIONS,
  MSME_IPR_TYPE_OPTIONS,
  MSME_IPR_STAGE_OPTIONS,
  SCST_HUB_GEM_OPTIONS,
  SCST_HUB_CATEGORY_OPTIONS,
  ASPIRE_PREMISES_OPTIONS,
  NHDP_LOOM_OPTIONS,
  NHDP_PREMISES_OPTIONS,
  CVY_BOARD_STATUS_OPTIONS,
  CVY_PREMISES_OPTIONS,
  PTUAS_GMP_OPTIONS,
  PMPDS_FOCUS_OPTIONS,
  CGTMSE_PURPOSE_OPTIONS,
  CGTMSE_WOMEN_OPTIONS,
  AP_FPP_SIZE_OPTIONS,
  AP_FPP_YES_NO,
  AP_FPP_PREMISES_OPTIONS,
  AP_CMEP_ACTIVITY_OPTIONS,
  AP_CMEP_BOOSTER_OPTIONS,
  AP_CMEP_YES_NO,
  OBMMS_CORP_OPTIONS,
  OBMMS_YES_NO,
  MSE_SPICE_SECTOR_OPTIONS,
  AP_PARKS_REBATE_OPTIONS,
  AP_PARKS_YES_NO,
  RAMP_TEAM_ONDC_OPTIONS,
  EPM_NIRYAT_CREDIT_OPTIONS,
];

const EXTRA_VALUE_LABELS: Record<string, string> = (() => {
  const out: Record<string, string> = { yes: 'Yes', no: 'No' };
  for (const list of OPTION_LISTS) {
    for (const o of list) out[o.value] = o.label;
  }
  return out;
})();

function stepField(name: string, label: string, contentStep: number): IndividualDocField {
  return { name, label, source: 'step', path: `step${contentStep}.${name}` };
}

function extraField(name: string): IndividualDocField {
  return {
    name,
    label: EXTRA_FIELD_LABELS[name] || name,
    source: 'extras',
    path: `schemeExtras.${name}`,
  };
}

function extrasOn(names: string[]): IndividualDocField[] {
  return names.map(extraField);
}

export function isLeanUnitScheme(code?: string | null): boolean {
  return !!code && LEAN_UNIT_CODES.has(code);
}

/** Fields asked on a content-step bucket for this scheme. */
/** Fields for a section, adjusted for the kind of business: machinery tables for manufacturing, an asset list otherwise. */
export function getIndividualDocFields(
  contentStep: number,
  schemeCode?: string | null,
  budget?: Budget,
  kind: BusinessKind = 'manufacturing'
): IndividualDocField[] {
  const base = getIndividualDocFieldsBase(contentStep, schemeCode, budget);
  if (contentStep !== 12 && kind === 'manufacturing') return base;
  const cmep = schemeCode === 'AP_CMEP';
  const out: IndividualDocField[] = [];
  for (const field of base) {
    if (kind !== 'manufacturing' && field.name === 'machineryItems' && !cmep) continue;
    out.push(kind === 'manufacturing' ? field : { ...field, label: kindLabel(field.label, kind) });
    if (contentStep === 12 && field.name === 'machinery' && !cmep) {
      if (kind === 'manufacturing' && !base.some((f) => f.name === 'machineryItems')) out.push(stepField('machineryItems', 'Machinery list', 12));
      if (kind !== 'manufacturing') out.push(stepField('assetItems', 'Assets list', 12));
    }
  }
  return out;
}

function getIndividualDocFieldsBase(
  contentStep: number,
  schemeCode?: string | null,
  budget?: Budget
): IndividualDocField[] {
  const lean = isLeanUnitScheme(schemeCode);
  const hideCapex = hideComplexCapex(schemeCode || null, budget);

  if (contentStep === 1) {
    const fields: IndividualDocField[] = [
      stepField('unitName', 'Unit / Project Name', 1),
      stepField('district', 'District', 1),
      stepField('location', 'Location', 1),
      stepField('natureOfBusiness', 'Nature of Business', 1),
      stepField('majorProducts', 'Major Products', 1),
    ];
    // Narrative / later-step extras are attached on the steps where the form asks them.
    const skipOnStep1 = new Set([
      'executiveSummary',
      'processOfManufacture',
      'existingTech',
      'proposedTech',
      'productivityGain',
      'installedCapacity',
      'capacityUtilisationY1',
      'powerRequirement',
      'directEmployment',
      'indirectEmployment',
      'impactNote',
      'pmegpSubsidyPercent',
      'pmegpOwnPercent',
      'premisesType',
    ]);
    extraFieldsForScheme(schemeCode).forEach((name) => {
      if (!skipOnStep1.has(name)) fields.push(extraField(name));
    });
    return fields;
  }

  if (contentStep === 2) {
    const fields: IndividualDocField[] = [
      stepField('sectorType', lean ? 'Sector / industry type' : 'Sector / Industry Type', 2),
      stepField('sectorDescription', lean ? 'Short intro — what the unit does' : 'Sector Description', 2),
    ];
    if (!lean) {
      fields.push(
        stepField('nationalImportance', 'National Importance', 2),
        stepField('stateLevelImportance', 'State-level Importance', 2),
        stepField('keyProducts', 'Key Products', 2)
      );
    }
    if (schemeCode === 'PMEGP' || schemeCode === 'AP_CMEP') {
      fields.push(extraField('executiveSummary'));
    }
    if (
      schemeCode &&
      [
        'PMEGP',
        'PMEGP_2ND',
        'STANDUP',
        'PMFME',
        'SCLCSS',
        'AP_TECH_UPGRADE',
        'AP_EDP',
        'AP_CMEP',
        'VISHWAKARMA',
        'SVANIDHI',
      ].includes(schemeCode)
    ) {
      fields.push(extraField('processOfManufacture'));
    }
    if (schemeCode === 'PMEGP_2ND' || schemeCode === 'SCLCSS' || schemeCode === 'AP_TECH_UPGRADE') {
      fields.push(extraField('existingTech'), extraField('proposedTech'));
    }
    if (schemeCode === 'AP_TECH_UPGRADE') fields.push(extraField('productivityGain'));
    return fields;
  }

  if (contentStep === 3) {
    if (lean) {
      return [stepField('geography', 'Brief location / market catchment', 3)];
    }
    return [
      stepField('geography', 'Geography', 3),
      stepField('climate', 'Climate', 3),
      stepField('infrastructure', 'Infrastructure', 3),
      stepField('keyEconomicActivities', 'Key Economic Activities', 3),
      stepField('rawMaterialAvailability', 'Raw Material Availability', 3),
      stepField('rawMaterialQuantity', 'Raw Material Quantity', 3),
      stepField('industrialInfrastructure', 'Industrial Infrastructure', 3),
      stepField('connectivity', 'Connectivity', 3),
    ];
  }

  if (contentStep === 4) {
    const fields: IndividualDocField[] = [
      stepField('presentActivities', lean ? 'Present / proposed activity summary' : 'Present Activities', 4),
      stepField('yearOfEstablishment', lean ? 'Start Date' : 'Year of Establishment', 4),
      ...(lean ? [stepField('commitmentDate', 'Commitment Date', 4)] : []),
      stepField('technologyLevel', lean ? 'Tools / process level' : 'Technology Level', 4),
      stepField('productionCapacity', lean ? 'Capacity / throughput' : 'Production Capacity', 4),
    ];
    if (!lean) {
      fields.push(
        stepField('clusterEvolution', 'How the unit evolved', 4),
        stepField('typeOfUnits', 'Type of unit', 4),
        stepField('stakeholders', 'Stakeholders', 4)
      );
    }
    if (schemeCode === 'PMEGP_2ND' || schemeCode === 'AP_TECH_UPGRADE') {
      fields.push(extraField('existingCapacity'));
    }
    if (
      schemeCode &&
      ['PMEGP', 'PMEGP_2ND', 'STANDUP', 'PMFME', 'SCLCSS', 'AP_TECH_UPGRADE', 'AP_EDP'].includes(schemeCode)
    ) {
      fields.push(extraField('capacityUtilisationY1'));
    }
    if (schemeCode === 'PMFME') fields.push(extraField('proposedWorkers'));
    if (lean) {
      fields.push(stepField('productMix', 'Products, share of output and selling price', 4));
    }
    if (schemeCode === 'AP_CMEP') {
      fields.push(
        stepField('loomCount', 'Number of looms / machines', 4),
        stepField('shifts', 'Shifts per day', 4)
      );
    }
    return fields;
  }

  if (contentStep === 5) {
    return [
      stepField('rawMaterials', 'Raw Materials', 5),
      stepField('intermediateProducts', 'Intermediate Products', 5),
      stepField('finalProducts', 'Final Products', 5),
      stepField('valueAdditionStages', 'Value Addition Stages', 5),
      stepField('majorBuyers', 'Major Buyers', 5),
    ];
  }

  if (contentStep === 6) {
    const fields: IndividualDocField[] = [
      stepField('targetMarket', lean ? 'Target customers / market' : 'Target Market', 6),
      stepField('existingDemand', lean ? 'Demand / footfall note' : 'Existing Demand', 6),
    ];
    if (!lean) {
      fields.push(
        stepField('demandSupplyGap', 'Demand-Supply Gap', 6),
        stepField('competitorAnalysis', 'Competitor Analysis', 6),
        stepField('priceTrends', 'Price Trends', 6),
        stepField('exportPotential', 'Export Potential', 6)
      );
    }
    return fields;
  }

  if (contentStep === 7) {
    return [
      stepField('technologyGaps', 'Technology Gaps', 7),
      stepField('infrastructureGaps', 'Infrastructure Gaps', 7),
      stepField('skillGaps', 'Skill Gaps', 7),
      stepField('marketingGaps', 'Marketing Gaps', 7),
      stepField('financialGaps', 'Financial Gaps', 7),
      stepField('justificationForIntervention', 'Justification for Intervention', 7),
    ];
  }

  if (contentStep === 8) {
    return [
      stepField('strengths', 'Strengths', 8),
      stepField('weaknesses', 'Weaknesses', 8),
      stepField('opportunities', 'Opportunities', 8),
      stepField('threats', 'Threats', 8),
    ];
  }

  if (contentStep === 9) {
    return [
      stepField('interventionType', 'Activity type', 9),
      stepField('description', 'Description', 9),
      stepField('objectives', 'Objectives', 9),
      stepField('expectedBenefits', 'Expected Benefits', 9),
    ];
  }

  if (contentStep === 10) {
    if (lean) {
      const fields = [
        stepField('name', 'Shop / shed / workplace name', 10),
        stepField('landDetails', 'Premises note (own / lease / rent)', 10),
      ];
      if (schemeCode === 'AP_CMEP') {
        fields.push(
          stepField('workshopAreaSqft', 'Workshop area (sq.ft.)', 10),
          stepField('productionAreaSqft', 'Production floor (sq.ft.)', 10),
          stepField('storageAreaSqft', 'Storage / packing area (sq.ft.)', 10),
          stepField('officeAreaSqft', 'Office area (sq.ft.)', 10),
          stepField('leaseYears', 'Lease period (years)', 10),
          stepField('waterAndEffluent', 'Water use and dye wastewater', 10)
        );
      }
      return fields;
    }
    return [
      stepField('name', 'Unit / shed / workplace name', 10),
      stepField('location', 'Location', 10),
      stepField('landDetails', 'Land Details', 10),
      stepField('civilWorks', 'Civil Works', 10),
      stepField('manufacturingProcess', 'Manufacturing Process', 10),
      stepField('plantAndMachinery', 'Plant & Machinery', 10),
      stepField('capacity', 'Capacity', 10),
      stepField('powerRequirements', 'Power Requirements', 10),
      stepField('waterRequirements', 'Water Requirements', 10),
      stepField('manpowerRequirements', 'Manpower Requirements', 10),
    ];
  }

  if (contentStep === 11) {
    if (lean) {
      const fields = [
        stepField('spvName', 'Firm / proprietor name', 11),
        stepField('legalStatus', 'Legal status', 11),
        stepField('address', 'Correspondence address', 11),
        stepField('gstin', 'GSTIN', 11),
        stepField('firmPan', 'Firm PAN', 11),
        stepField('udyamNumber', 'Udyam registration number', 11),
        stepField('applicantMobile', 'Contact mobile number', 11),
      ];
      if (schemeCode === 'AP_CMEP') fields.push(stepField('promoters', 'Promoters', 11));
      return fields;
    }
    return [
      stepField('spvName', 'Applicant / firm name', 11),
      stepField('legalStatus', 'Legal Status', 11),
      stepField('yearOfIncorporation', 'Year of establishment', 11),
      stepField('submittedTo', 'Submitted To', 11),
      stepField('objectives', 'Objectives', 11),
      stepField('boardOfDirectors', 'Owner(s)', 11),
      stepField('gstin', 'GSTIN', 11),
      stepField('firmPan', 'Firm PAN', 11),
      stepField('udyamNumber', 'Udyam registration number', 11),
      stepField('applicantMobile', 'Contact mobile number', 11),
    ];
  }

  if (contentStep === 12) {
    const fields: IndividualDocField[] = [];
    if (!hideCapex || schemeCode === 'AP_EDP') {
      fields.push(
        stepField('land', 'Land (₹ Lakhs)', 12),
        stepField('building', 'Building / shed (₹ Lakhs)', 12),
        stepField('utilitiesAndInfrastructure', 'Utilities & Infrastructure (₹ Lakhs)', 12),
        stepField('preliminaryAndPreOperative', 'Preliminary & Pre-operative (₹ Lakhs)', 12)
      );
    }
    fields.push(
      stepField('machinery', 'Machinery / equipment (₹ Lakhs)', 12),
      stepField('workingCapitalMargin', 'Working capital (₹ Lakhs)', 12)
    );
    if (schemeCode === 'AP_CMEP') {
      fields.push(
        stepField('costPhasing', 'Cost already incurred and still to be incurred (₹ Lakhs)', 12),
        stepField('machineryItems', 'Machinery list', 12),
        stepField('furniture', 'Furniture and fixtures (₹ Lakhs)', 12),
        stepField('securityDeposits', 'Security deposits (₹ Lakhs)', 12),
        stepField('wcRawStock', 'Raw material stock (₹ Lakhs)', 12),
        stepField('wcWip', 'Work in progress (₹ Lakhs)', 12),
        stepField('wcFinished', 'Finished goods (₹ Lakhs)', 12),
        stepField('wcReceivables', 'Receivables (₹ Lakhs)', 12),
        stepField('wcSupplierCredit', 'Supplier credit (₹ Lakhs)', 12),
        stepField('wcCash', 'Cash (₹ Lakhs)', 12)
      );
    }
    if (lean && schemeCode !== 'AP_CMEP') {
      fields.push(stepField('machineryItems', 'Machinery list', 12));
    }
    if (schemeCode === 'AP_EDP') {
      fields.push(
        stepField('furniture', 'Furniture and fixtures (₹ Lakhs)', 12),
        stepField('securityDeposits', 'Security deposits (₹ Lakhs)', 12)
      );
    }
    return fields;
  }

  if (contentStep === 13) {
    const fields = [
      stepField('spvContribution', 'Own / promoter contribution (₹ Lakhs)', 13),
      stepField('governmentGrant', 'Government Grant (₹ Lakhs)', 13),
      stepField('bankLoan', 'Bank Loan (₹ Lakhs)', 13),
      stepField('otherSources', 'Other Sources (₹ Lakhs)', 13),
    ];
    if (schemeCode === 'AP_CMEP') {
      fields.push(
        stepField('cashCreditLimit', 'Cash credit / working capital limit (₹ Lakhs)', 13),
        stepField('bankName', 'Bank name', 13),
        stepField('interestRate', 'Interest rate (% per year)', 13),
        stepField('moratoriumMonths', 'Moratorium (months)', 13),
        stepField('loanTenureMonths', 'Loan tenure (months)', 13),
        stepField('subsidyPercent', 'Subsidy rate (%)', 13)
      );
    }
    if (lean && schemeCode !== 'AP_CMEP') {
      fields.push(
        stepField('bankName', 'Bank name', 13),
        stepField('interestRate', 'Interest rate (% per year)', 13),
        stepField('moratoriumMonths', 'Moratorium (months)', 13),
        stepField('loanTenureMonths', 'Loan tenure (months)', 13)
      );
    }
    return fields;
  }

  if (contentStep === 14) {
    const fields = [
      stepField('rawMaterialCost', 'Raw Material Cost (₹ Lakhs)', 14),
      stepField('powerCost', 'Power Cost (₹ Lakhs)', 14),
      stepField('wages', 'Wages (₹ Lakhs)', 14),
      stepField('maintenance', 'Maintenance (₹ Lakhs)', 14),
      stepField('administrativeExpenses', 'Administrative Expenses (₹ Lakhs)', 14),
      stepField('marketingExpenses', 'Marketing Expenses (₹ Lakhs)', 14),
      stepField('annualProductionVolume', 'Annual Production Volume', 14),
      stepField('annualSalesRealization', 'Annual Sales Realization (₹ Lakhs)', 14),
    ];
    if (lean) {
      fields.push(
        stepField('rawMaterialItems', 'Raw materials', 14),
        stepField('staffRoles', 'Staff by role and monthly pay', 14)
      );
    }
    if (schemeCode === 'AP_CMEP') {
      fields.push(
        stepField('capacityPerDay', 'Installed capacity per day', 14),
        stepField('workingDays', 'Working days in a year', 14),
        stepField('capacityUtilisation', 'Capacity utilisation (%)', 14),
        stepField('sellingPricePerUnit', 'Selling price per unit (₹)', 14),
        stepField('monthlyRent', 'Rent per month (₹)', 14),
        stepField('monthlySalaries', 'Salaries per month (₹)', 14),
        stepField('monthlyPower', 'Power per month (₹)', 14),
        stepField('annualExpenseGrowth', 'Annual expense increase (%)', 14),
        stepField('utilisationByYear', 'Capacity utilisation by projected year', 14)
      );
    }
    return fields;
  }

  if (contentStep === 15) {
    return [
      stepField(
        'yearProjections',
        schemeCode === 'AP_CMEP'
          ? 'Financial projections — previous years and estimates (₹ Lakhs)'
          : 'Year-wise sales / costs / profit',
        15
      ),
      stepField('breakEvenPoint', 'Break-even (capacity %)', 15),
    ];
  }

  if (contentStep === 16) {
    // Form only has CoD + milestones (no totalImplementationPeriod input)
    const fields = [
      stepField('startDate', 'Commercial production date (CoD)', 16),
      stepField('milestones', 'Milestones', 16),
    ];
    if (schemeCode === 'AP_CMEP') fields.push(stepField('risks', 'Risks and how they will be handled', 16));
    return fields;
  }

  if (contentStep === 17) {
    // PMEGP / 2nd / PMFME form: direct + indirect employment + short impact note
    if (
      schemeCode === 'PMEGP' ||
      schemeCode === 'PMEGP_2ND' ||
      schemeCode === 'PMFME'
    ) {
      return [
        stepField('employmentGeneration', 'Direct employment (count)', 17),
        extraField('indirectEmployment'),
        extraField('impactNote'),
      ];
    }
    // Other schemes: direct employment + expected turnover
    return [
      stepField('employmentGeneration', 'Direct employment (count)', 17),
      stepField('turnoverGrowth', 'Expected annual turnover (₹ Lakhs)', 17),
    ];
  }

  return extrasOn([]);
}

export function sectionTitleFromStep(def: SchemeStepDef): string {
  return def.title.replace(/^Step \d+:\s*/, '');
}

export function formatDocValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object' && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    if (o.status === 'uploaded' || o.fileId) {
      return o.originalName ? `Uploaded (${o.originalName})` : 'Uploaded';
    }
  }
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return '—';
    return String(value);
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string') {
    const mapped = EXTRA_VALUE_LABELS[value];
    return mapped || value;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '—';
    return value
      .map((item) => {
        if (item == null || item === '') return '';
        if (typeof item === 'string' || typeof item === 'number') return String(item);
        if (typeof item === 'object') {
          const o = item as Record<string, unknown>;
          if (o.name && o.source) return `${o.name} (${o.source})`;
          if (o.name && o.designation) return `${o.name} — ${o.designation}`;
          if (o.activity) {
            const when = [o.startDate, o.endDate].filter(Boolean).join(' → ');
            return when ? `${o.activity} (${when})` : String(o.activity);
          }
          if (o.year != null) {
            const bits = [`Y${o.year}`];
            if (o.sales != null) bits.push(`sales ${o.sales}`);
            if (o.revenue != null) bits.push(`rev ${o.revenue}`);
            if (o.netProfit != null) bits.push(`NP ${o.netProfit}`);
            if (o.profit != null) bits.push(`P ${o.profit}`);
            return bits.join(', ');
          }
          if (o.stakeholder && o.percentage != null) return `${o.stakeholder} ${o.percentage}%`;
          return Object.values(o)
            .filter((v) => v !== '' && v != null)
            .join(' — ');
        }
        return String(item);
      })
      .filter(Boolean)
      .join('; ');
  }
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    const parts = Object.entries(o)
      .filter(([, v]) => v !== '' && v != null && v !== 0)
      .map(([k, v]) => `${k}: ${v}`);
    return parts.length ? parts.join(', ') : '—';
  }
  return String(value);
}

export function readDocField(
  field: IndividualDocField,
  data: Record<string, any>
): unknown {
  if (field.source === 'extras') {
    const extras = data.schemeExtras || {};
    return extras[field.name];
  }
  const m = field.path.match(/^step(\d+)\.(.+)$/);
  if (!m) return undefined;
  const step = data[`step${m[1]}`] || {};
  if (field.name === 'unitName') return getUnitName(step);
  return step[field.name];
}

export function getIndividualUploads(
  schemeCode: string | null,
  data: Record<string, any>
): UploadField[] {
  return getStep18Uploads(schemeCode, data.ventureMatchAnswers, data.schemeExtras);
}

export function getSchemeDocSteps(schemeCode?: string | null): SchemeStepDef[] {
  return getSchemeSteps(schemeCode);
}

export function extractIndividualDocData(dpr: any, project?: any): Record<string, any> {
  return (
    dpr?.content?.english?.clusterData ||
    dpr?.content?.telugu?.clusterData ||
    dpr?.metadata?.clusterData ||
    project?.stepData ||
    dpr ||
    {}
  );
}

export function extractSchemeCode(dpr: any, project?: any, data?: Record<string, any>): string | null {
  return (
    data?.matchedSchemeCode ||
    dpr?.metadata?.matchedSchemeCode ||
    data?.metadata?.matchedSchemeCode ||
    project?.matchedSchemeCode ||
    null
  );
}

export function isIndividualDprRecord(dpr: any, project?: any): boolean {
  if (
    dpr?.metadata?.isIndividualDPR ||
    dpr?.content?.english?.clusterData?.isIndividualDPR ||
    dpr?.content?.english?.isIndividualDPR ||
    project?.projectType === 'individual'
  ) {
    return true;
  }
  const data = extractIndividualDocData(dpr, project);
  const scheme = extractSchemeCode(dpr, project, data);
  return !!scheme && project?.projectType !== 'cluster';
}
