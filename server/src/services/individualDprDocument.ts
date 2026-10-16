/**
 * Scheme Q&A document for Create New Latest DPR.
 * Used by PDF / DOCX / XLS downloads and quality analysis so they match
 * IndividualDPRDocumentView — not the cluster chapter template.
 */

import fs from 'fs';
import path from 'path';
import { aiDisclaimerDocxFooters } from '../lib/aiDisclaimer';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import catalogs from './individualDprCatalog.json';

export type SchemeStepDef = {
  n: number;
  id: string;
  title: string;
  contentStep: number;
};

export type DocField = {
  name: string;
  label: string;
  source: 'step' | 'extras';
  path: string;
};

export type DocRow = {
  label: string;
  value: string;
  path: string;
  filled: boolean;
  embed?: 'cmep-projections' | 'cmep-promoters' | 'cmep-machinery' | 'cmep-cost' | 'cmep-derived' | 'data-table';
};

export type DocSection = {
  n: number;
  id: string;
  title: string;
  contentStep: number;
  rows: DocRow[];
};

export type IndividualDocument = {
  schemeCode: string | null;
  unitName: string;
  district: string;
  location: string;
  entrepreneurName: string;
  actionLine: string;
  underLine: string;
  sections: DocSection[];
  askedCount: number;
  filledCount: number;
};

const LEAN_UNIT_CODES = new Set([
  'PMEGP', 'PMEGP_2ND', 'MUDRA', 'STANDUP', 'PMFME', 'SCLCSS', 'AP_TECH_UPGRADE',
  'AP_EDP', 'VISHWAKARMA', 'SVANIDHI', 'ECLGS', 'ZED', 'LEAN', 'MSME_IPR', 'PMS',
  'SCST_HUB', 'ASPIRE', 'NHDP', 'CVY', 'MSE_GIFT', 'PTUAS', 'PMPDS', 'CGTMSE',
  'AP_FPP', 'AP_CMEP', 'OBMMS', 'MSE_SPICE', 'AP_PARKS', 'RAMP_TEAM', 'EPM_NIRYAT',
]);

const HIDE_COMPLEX_CAPEX = new Set([
  'VISHWAKARMA', 'SVANIDHI', 'ECLGS', 'NHDP', 'ASPIRE', 'ZED', 'LEAN', 'MSME_IPR',
  'PMS', 'SCST_HUB', 'PMPDS', 'RAMP_TEAM', 'EPM_NIRYAT', 'OBMMS',
]);

const UPGRADE_SCHEMES = new Set([
  'PMEGP_2ND', 'SCLCSS', 'AP_TECH_UPGRADE', 'MSE_GIFT', 'PTUAS', 'MSE_SPICE',
]);

const SCHEME_LABELS: Record<string, string> = {
  PMEGP: 'PMEGP',
  PMEGP_2ND: '2nd PMEGP Upgrade Loan',
  MUDRA: 'PM MUDRA Yojana',
  STANDUP: 'Stand-Up India',
  CGTMSE: 'CGTMSE',
  VISHWAKARMA: 'PM Vishwakarma',
  PMFME: 'PMFME',
  SVANIDHI: 'PM SVANidhi',
  SCLCSS: 'SCLCSS (SC/ST)',
  AP_TECH_UPGRADE: 'AP Technology Upgradation Subsidy',
  AP_EDP: 'AP MSME-EDP 4.0',
  AP_CMEP: 'AP CMEP',
  AP_FPP: 'AP Food Processing Policy 4.0',
  ECLGS: 'ECLGS',
  ZED: 'ZED Certification',
  LEAN: 'Competitive LEAN',
  MSME_IPR: 'MSME Innovative (IPR)',
  PMS: 'Procurement & Marketing Scheme',
  MSE_GIFT: 'MSE-GIFT',
  CVY: 'Coir Vikas Yojana',
  NHDP: 'National Handloom Development Programme',
  PTUAS: 'PTUAS',
  PMPDS: 'PMPDS',
  MSE_SPICE: 'RAMP MSE-SPICE',
  RAMP_TEAM: 'RAMP TEAM (ONDC)',
  EPM_NIRYAT: 'EPM Niryat Protsahan',
  ASPIRE: 'ASPIRE',
  SCST_HUB: 'National SC/ST Hub',
  OBMMS: 'AP OBMMS Welfare Loans',
  AP_PARKS: 'AP MSME-PARKS',
};

const SCHEME_EXTRA_FIELDS: Record<string, string[]> = {
  VISHWAKARMA: ['craft', 'currentTools', 'newTools', 'entrepreneurName', 'entrepreneurAge', 'experienceYears', 'trainingStage', 'loanTranche', 'priorSelfEmploymentLoan', 'processOfManufacture', 'workplaceType', 'powerRequirement'],
  SVANIDHI: ['covOrLor', 'upiQr', 'entrepreneurName', 'entrepreneurAge', 'yearsVending', 'loanTranche', 'vendingType', 'dailySales', 'processOfManufacture', 'workplaceType', 'powerRequirement'],
  PMFME: ['fssai', 'unitStage', 'odopAligned', 'entrepreneurName', 'entrepreneurAge', 'existingTurnover', 'processOfManufacture', 'installedCapacity', 'capacityUtilisationY1', 'proposedWorkers', 'rawMaterialSources', 'premisesType', 'powerRequirement', 'directEmployment', 'indirectEmployment', 'impactNote'],
  AP_EDP: ['enterpriseSize', 'specialCategory', 'scStOwned', 'apDomicile', 'apiicPark', 'entrepreneurName', 'entrepreneurAge', 'processOfManufacture', 'installedCapacity', 'capacityUtilisationY1', 'premisesType', 'powerRequirement'],
  PMEGP: ['pmegpCategory', 'pmegpArea', 'pmegpAgency', 'entrepreneurName', 'entrepreneurAge', 'educationStatus', 'executiveSummary', 'processOfManufacture', 'installedCapacity', 'capacityUtilisationY1', 'powerRequirement', 'pmegpSubsidyPercent', 'pmegpOwnPercent', 'directEmployment', 'indirectEmployment', 'impactNote'],
  MUDRA: ['mudraCategory', 'entrepreneurName', 'entrepreneurAge', 'experienceYears', 'premisesType', 'loanPurpose'],
  STANDUP: ['standupCategory', 'entrepreneurName', 'entrepreneurAge', 'controllingStakePercent', 'loanAmountSought', 'processOfManufacture', 'installedCapacity', 'capacityUtilisationY1', 'premisesType'],
  PMEGP_2ND: ['priorScheme', 'priorSanctionAmount', 'firstSubsidyYear', 'marginMoneyAdjusted', 'firstLoanRepaid', 'yearsProfitable', 'existingTurnover', 'pmegpAgency', 'nerHill', 'sectorBand', 'entrepreneurName', 'entrepreneurAge', 'processOfManufacture', 'existingCapacity', 'installedCapacity', 'capacityUtilisationY1', 'powerRequirement', 'existingTech', 'proposedTech', 'directEmployment', 'indirectEmployment', 'impactNote'],
  SCLCSS: ['sclcssCategory', 'controllingStakePercent', 'unitStage', 'entrepreneurName', 'entrepreneurAge', 'udyamStatus', 'existingTech', 'proposedTech', 'processOfManufacture', 'installedCapacity', 'capacityUtilisationY1', 'premisesType', 'powerRequirement'],
  AP_TECH_UPGRADE: ['enterpriseSize', 'specialCategory', 'apDomicile', 'entrepreneurName', 'entrepreneurAge', 'yearsInOperation', 'existingTurnover', 'existingTech', 'proposedTech', 'processOfManufacture', 'productivityGain', 'existingCapacity', 'installedCapacity', 'capacityUtilisationY1', 'premisesType', 'powerRequirement'],
  MSE_GIFT: ['energyBaselineKwh', 'expectedSaving', 'entrepreneurName', 'eeEquipment'],
  ZED: ['zedCurrentLevel', 'zedTargetLevel', 'entrepreneurName', 'qualityFocus'],
  LEAN: ['processBottleneck', 'entrepreneurName', 'shopFloorSize', 'expectedLeanGain'],
  MSME_IPR: ['ipType', 'filingStage', 'entrepreneurName', 'inventionTitle'],
  PMS: ['eventName', 'stallSize', 'entrepreneurName', 'fairCity', 'estimatedFairCost'],
  CVY: ['coirProductLine', 'coirBoardStatus', 'entrepreneurName', 'premisesType'],
  NHDP: ['loomType', 'weaverId', 'entrepreneurName', 'entrepreneurAge', 'yarnSource', 'productLine', 'premisesType'],
  PTUAS: ['gmpStatus', 'productLicence', 'entrepreneurName', 'existingTech', 'proposedTech', 'processOfManufacture'],
  PMPDS: ['deviceOrFormulation', 'entrepreneurName', 'promotionNeed'],
  SCST_HUB: ['gemExperience', 'entrepreneurName', 'sclcssCategory', 'procurementFocus'],
  ASPIRE: ['incubatorName', 'entrepreneurName', 'entrepreneurAge', 'innovationBrief', 'livelihoodFocus', 'premisesType'],
  ECLGS: ['existingLimit', 'peakWcOutstanding', 'additionalWcSought', 'accountStatus', 'entrepreneurName', 'liquidityReason'],
  CGTMSE: ['loanPurpose', 'womenOwned', 'entrepreneurName', 'proposedLimit'],
  AP_FPP: ['enterpriseSize', 'specialCategory', 'apDomicile', 'fpoShg', 'entrepreneurName', 'processOfManufacture', 'installedCapacity', 'premisesType'],
  AP_CMEP: ['activityBand', 'boosterCategory', 'apDomicile', 'entrepreneurName', 'executiveSummary', 'processOfManufacture', 'premisesType', 'cmepArea', 'edpStatus', 'priorSubsidy', 'familyExclusive'],
  OBMMS: ['welfareCorporation', 'whiteRiceCard', 'entrepreneurName', 'entrepreneurAge', 'activityTrade'],
  MSE_SPICE: ['circularSector', 'existingUnitYears', 'entrepreneurName', 'proposedPmCost', 'processOfManufacture'],
  AP_PARKS: ['apiicParkName', 'plotArea', 'landRebateClaim', 'scStOrWomen', 'entrepreneurName', 'apDomicile'],
  RAMP_TEAM: ['ondcReady', 'catalogueSkus', 'entrepreneurName', 'productListNote'],
  EPM_NIRYAT: ['exportMarkets', 'hsnLines', 'prePostShipment', 'entrepreneurName', 'exportCreditSought'],
};

const EXTRA_FIELD_LABELS: Record<string, string> = {
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
  pmegpAgency: 'Implementing agency',
  education: 'Education',
  educationStatus: 'Education',
  priorScheme: 'Prior scheme',
  firstSubsidyYear: 'Year of first subsidy',
  firstProjectCost: 'First sanction / project cost (₹ Lakhs)',
  priorSanctionAmount: 'Prior sanction amount (₹ Lakhs)',
  firstLoanRepaid: 'First loan repaid in time?',
  firstMmAdjusted: 'First margin money adjusted?',
  marginMoneyAdjusted: 'First margin money adjusted?',
  nerHill: 'NER / Hill State?',
  mudraCategory: 'PMMY category',
  loanPurpose: 'Loan purpose',
  standupCategory: 'Eligible category',
  controllingStakePercent: 'Controlling stake %',
  compositeLoan: 'Composite loan sought (₹ Lakhs)',
  loanAmountSought: 'Loan amount sought (₹ Lakhs)',
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
  existingLimit: 'Existing fund-based WC limit (₹ Lakhs)',
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
  experienceYears: 'Experience (years)',
  yearsInOperation: 'Years in operation',
  existingTurnover: 'Existing turnover (₹ Lakhs)',
  powerRequirement: 'Power requirement',
  directEmployment: 'Direct employment',
  indirectEmployment: 'Indirect employment',
  impactNote: 'Impact note',
  rawMaterialSources: 'Raw material sources',
  udyamStatus: 'Udyam status',
  yearsProfitable: 'Years profitable',
  sectorBand: 'Sector band',
  pmegpSubsidyPercent: 'PMEGP subsidy %',
  pmegpOwnPercent: 'Own contribution %',
};

const CATALOG_BY_CODE: Record<string, SchemeStepDef[]> = {
  PMEGP: catalogs.PMEGP_STEPS,
  MUDRA: catalogs.MUDRA_STEPS,
  STANDUP: catalogs.STANDUP_STEPS,
  PMFME: catalogs.PMFME_STEPS,
  PMEGP_2ND: catalogs.PMEGP_2ND_STEPS,
  SCLCSS: catalogs.SCLCSS_STEPS,
  AP_TECH_UPGRADE: catalogs.AP_TECH_UPGRADE_STEPS,
  AP_EDP: catalogs.AP_EDP_STEPS,
  VISHWAKARMA: catalogs.VISHWAKARMA_STEPS,
  SVANIDHI: catalogs.SVANIDHI_STEPS,
  ECLGS: catalogs.ECLGS_STEPS,
  ZED: catalogs.ZED_STEPS,
  LEAN: catalogs.LEAN_STEPS,
  MSME_IPR: catalogs.MSME_IPR_STEPS,
  PMS: catalogs.PMS_STEPS,
  SCST_HUB: catalogs.SCST_HUB_STEPS,
  ASPIRE: catalogs.ASPIRE_STEPS,
  NHDP: catalogs.NHDP_STEPS,
  CVY: catalogs.CVY_STEPS,
  MSE_GIFT: catalogs.MSE_GIFT_STEPS,
  PTUAS: catalogs.PTUAS_STEPS,
  PMPDS: catalogs.PMPDS_STEPS,
  CGTMSE: catalogs.CGTMSE_STEPS,
  AP_FPP: catalogs.AP_FPP_STEPS,
  AP_CMEP: catalogs.AP_CMEP_STEPS,
  OBMMS: catalogs.OBMMS_STEPS,
  MSE_SPICE: catalogs.MSE_SPICE_STEPS,
  AP_PARKS: catalogs.AP_PARKS_STEPS,
  RAMP_TEAM: catalogs.RAMP_TEAM_STEPS,
  EPM_NIRYAT: catalogs.EPM_NIRYAT_STEPS,
};

function extraFieldsForScheme(schemeCode?: string | null): string[] {
  if (!schemeCode) return [];
  return SCHEME_EXTRA_FIELDS[schemeCode] || [];
}

function hideComplexCapex(code: string | null, budget?: string): boolean {
  if (HIDE_COMPLEX_CAPEX.has(code || '')) return true;
  return code === 'MUDRA' && (budget === 'under2L' || budget === '2to5L');
}

function stepField(name: string, label: string, contentStep: number): DocField {
  return { name, label, source: 'step', path: `step${contentStep}.${name}` };
}

function extraField(name: string): DocField {
  return {
    name,
    label: EXTRA_FIELD_LABELS[name] || name,
    source: 'extras',
    path: `schemeExtras.${name}`,
  };
}

function getSchemeSteps(schemeCode?: string | null): SchemeStepDef[] {
  if (!schemeCode) return catalogs.VANILLA_STEPS as SchemeStepDef[];
  return (CATALOG_BY_CODE[schemeCode] || catalogs.VANILLA_STEPS) as SchemeStepDef[];
}

/** Same field list as Latest DPR form / PDF — use this for AI suggestions too. */
export function getIndividualDocFields(
  contentStep: number,
  schemeCode?: string | null,
  budget?: string
): DocField[] {
  const lean = !!schemeCode && LEAN_UNIT_CODES.has(schemeCode);
  const hideCapex = hideComplexCapex(schemeCode || null, budget);

  if (contentStep === 1) {
    const fields: DocField[] = [
      stepField('unitName', 'Unit / Project Name', 1),
      stepField('district', 'District', 1),
      stepField('location', 'Location', 1),
      stepField('natureOfBusiness', 'Nature of Business', 1),
      stepField('majorProducts', 'Major Products', 1),
    ];
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
    const fields: DocField[] = [
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
    if (lean) return [stepField('geography', 'Brief location / market catchment', 3)];
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
    const fields: DocField[] = [
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
    if (schemeCode && ['PMEGP', 'PMEGP_2ND', 'STANDUP', 'PMFME', 'SCLCSS', 'AP_TECH_UPGRADE', 'AP_EDP'].includes(schemeCode)) {
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
    const fields: DocField[] = [
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
    ];
  }

  if (contentStep === 12) {
    const fields: DocField[] = [];
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
    const fields = [
      stepField('startDate', 'Commercial production date (CoD)', 16),
      stepField('milestones', 'Milestones', 16),
    ];
    if (schemeCode === 'AP_CMEP') fields.push(stepField('risks', 'Risks and how they will be handled', 16));
    return fields;
  }

  if (contentStep === 17) {
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
    return [
      stepField('employmentGeneration', 'Direct employment (count)', 17),
      stepField('turnoverGrowth', 'Expected annual turnover (₹ Lakhs)', 17),
    ];
  }

  return [];
}

export function formatDocValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return '—';
    return String(value);
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string') {
    const mapped: Record<string, string> = {
      yes: 'Yes',
      no: 'No',
      cov: 'Certificate of Vending',
      first: '1st tranche',
      general: 'General category',
      special: 'Special category (SC / ST / OBC / Minority / Women / Ex-serviceman / PwD)',
      rural: 'Rural',
      urban: 'Urban',
      '8thPlus': '8th class pass or higher',
      below8th: 'Below 8th class',
      KVIB: 'State KVIB',
      DIC: 'DIC',
      manufacturing: 'Manufacturing',
      knowledge: 'Knowledge / service enterprise',
      woman: 'Woman entrepreneur',
      none: 'General (no booster)',
      pwd: 'PwD',
      exServiceman: 'Ex-serviceman',
      transgender: 'Transgender',
      completed: 'EDP completed',
      pending: 'EDP still pending',
      leased: 'Leased',
      owned: 'Owned',
      rented: 'Rented',
    };
    return mapped[value] || value;
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
          return Object.values(o).filter((v) => v !== '' && v != null).join(' — ');
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

function isFilled(formatted: string): boolean {
  return !!formatted && formatted !== '—';
}

export function extractIndividualDocData(dpr: any, project?: any): Record<string, any> {
  return (
    dpr?.content?.english?.clusterData ||
    dpr?.content?.telugu?.clusterData ||
    dpr?.metadata?.clusterData ||
    project?.stepData ||
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
    dpr?.content?.english?.isIndividualDPR ||
    dpr?.content?.english?.clusterData?.isIndividualDPR ||
    dpr?.content?.telugu?.isIndividualDPR ||
    project?.projectType === 'individual'
  ) {
    return true;
  }
  const scheme = extractSchemeCode(dpr, project, extractIndividualDocData(dpr, project));
  return !!scheme && project?.projectType !== 'cluster';
}

function readField(field: DocField, data: Record<string, any>): unknown {
  if (field.source === 'extras') {
    return (data.schemeExtras || {})[field.name];
  }
  const step = data[`step${field.path.match(/^step(\d+)/)?.[1]}`] || {};
  if (field.name === 'unitName') return step.unitName || step.clusterName;
  return step[field.name];
}

function actionLine(schemeCode: string | null): string {
  if (schemeCode && UPGRADE_SCHEMES.has(schemeCode)) return 'Upgradation of';
  if (schemeCode === 'ECLGS') return 'Working Capital Proposal for';
  if (schemeCode === 'ZED' || schemeCode === 'LEAN' || schemeCode === 'MSME_IPR') return 'Proposal for';
  if (schemeCode === 'PMS') return 'Marketing Support Proposal for';
  return 'Establishment of';
}

function pmegpUploadIds(data: Record<string, any>): string[] {
  const ids = ['aadhaarPan', 'machineryQuotations', 'buildingEstimates', 'bankPassbook', 'udyamCertificate'];
  if (data.schemeExtras?.pmegpCategory === 'special') ids.push('casteCertificate');
  const cost = data.step12 || {};
  const total = [
    'land',
    'building',
    'machinery',
    'utilitiesAndInfrastructure',
    'preliminaryAndPreOperative',
    'workingCapitalMargin',
    'furniture',
    'securityDeposits',
  ].reduce((sum, key) => sum + (Number(cost[key]) || 0), 0);
  if (total > 10) ids.push('educationCertificate');
  return ids;
}

function uploadRows(schemeCode: string | null, data: Record<string, any>): DocRow[] {
  const store = data.step18 || data.uploads || {};
  const labels: Record<string, string> = {
    aadhaarPan: 'Aadhaar / PAN',
    udyamCertificate: 'Udyam Certificate',
    bankPassbook: 'Bank Passbook',
    machineryQuotations: 'Machinery / Equipment Quotations',
    covOrLor: 'Certificate of Vending / Vendor ID or Portal LoR',
    upiProof: 'UPI ID / QR Screenshot',
    rationCard: 'Ration Card',
    pmVishwakarmaId: 'PM Vishwakarma Certificate / ID',
    toolkitQuotation: 'Toolkit List / Quote',
    educationCertificate: 'Education certificate',
    buildingEstimates: 'Building / workshed estimate',
    casteCertificate: 'Caste / special-category certificate',
    edpCertificate: 'EDP certificate',
    apDomicileProof: 'AP Domicile Proof',
    premisesLease: 'Lease deed / premises proof',
    rawMaterialQuotations: 'Yarn, dye and packing rate sheets',
    dealerEnquiries: 'Dealer enquiries or purchase orders',
  };
  const ids =
    schemeCode === 'SVANIDHI'
      ? ['covOrLor', 'aadhaarPan', 'bankPassbook', 'upiProof']
      : schemeCode === 'VISHWAKARMA'
        ? ['aadhaarPan', 'bankPassbook', 'rationCard', 'pmVishwakarmaId', 'toolkitQuotation']
        : schemeCode === 'AP_CMEP'
          ? ['udyamCertificate', 'machineryQuotations', 'apDomicileProof', 'bankPassbook', 'educationCertificate', 'edpCertificate', 'premisesLease', 'rawMaterialQuotations', 'dealerEnquiries']
          : schemeCode === 'PMEGP'
            ? pmegpUploadIds(data)
            : ['aadhaarPan', 'udyamCertificate', 'bankPassbook', 'machineryQuotations'];
  return ids.map((id) => {
    const present = !!(store[id] || store[labels[id]]);
    return {
      label: labels[id] || id,
      value: present ? 'Uploaded' : 'Pending',
      path: `step18.${id}`,
      filled: present,
    };
  });
}

function tableCell(value: unknown): string {
  if (value == null || value === '') return '—';
  return String(value);
}

function cellEntered(value: string): boolean {
  const text = String(value ?? '').trim();
  return text !== '' && text !== '—' && text !== '0';
}

function rowEntered(cells: string[], skipIndexes: number[] = []): boolean {
  return cells.some((cell, index) => !skipIndexes.includes(index) && cellEntered(cell));
}

function keepEnteredRows(name: string, rows: string[][]): string[][] {
  const skip = name === 'yearProjections' || name === 'costPhasing' ? [0] : [];
  return rows.filter((cells) => {
    const probe = name === 'machineryItems'
      ? cells.map((cell, index) => (index === 3 && cell === '1' ? '0' : cell))
      : cells;
    return rowEntered(probe, skip);
  });
}

function bankDataTable(
  name: string,
  raw: unknown,
  schemeCode?: string | null
): { headers: string[]; rows: string[][] } | null {
  const list = Array.isArray(raw) ? raw.filter((row) => row && typeof row === 'object') : [];
  if (name === 'productMix') {
    return {
      headers: ['Product', 'Share of output (%)', 'Selling price (₹)'],
      rows: list.map((row) => [tableCell(row.name), tableCell(row.sharePercent), tableCell(row.sellingPrice)]),
    };
  }
  if (name === 'rawMaterialItems') {
    return {
      headers: ['Material', 'Use', 'How it is bought'],
      rows: list.map((row) => [tableCell(row.name), tableCell(row.use), tableCell(row.basis)]),
    };
  }
  if (name === 'staffRoles') {
    return {
      headers: ['Role', 'Number of people', 'Monthly pay (₹)'],
      rows: list.map((row) => [tableCell(row.role), tableCell(row.count), tableCell(row.monthlyPay)]),
    };
  }
  if (name === 'risks') {
    return {
      headers: ['Risk', 'How it will be handled'],
      rows: list.map((row) => [tableCell(row.risk), tableCell(row.mitigation)]),
    };
  }
  if (name === 'utilisationByYear') {
    return {
      headers: ['Year', 'Capacity utilisation (%)'],
      rows: list.map((row) => [tableCell(row.label), tableCell(row.percent)]),
    };
  }
  if (name === 'milestones') {
    return {
      headers: ['Activity', 'Time', 'Start', 'End'],
      rows: list.map((row) => [tableCell(row.activity), tableCell(row.timeRequired), tableCell(row.startDate), tableCell(row.endDate)]),
    };
  }
  if (name === 'promoters') {
    return {
      headers: ['Name', 'Relation', 'Age', 'Education', 'Experience (years)', 'Phone', 'Address'],
      rows: list.map((row) => [
        tableCell(row.name),
        tableCell(row.relationName),
        tableCell(row.age),
        tableCell(row.education),
        tableCell(row.experienceYears),
        tableCell(row.phone),
        tableCell(row.address),
      ]),
    };
  }
  if (name === 'machineryItems') {
    const detailed = schemeCode === 'AP_CMEP';
    const headers = ['Description', 'New / used', 'Supplier', 'Qty', 'Unit cost (₹ Lakhs)'];
    if (detailed) headers.push('GST', 'Transport', 'Installation', 'Life (years)', 'Yearly maintenance');
    return {
      headers,
      rows: list.map((row) => {
        const cells = [tableCell(row.description), tableCell(row.condition), tableCell(row.supplier), tableCell(row.quantity), tableCell(row.unitCost)];
        if (detailed) cells.push(tableCell(row.gst), tableCell(row.transport), tableCell(row.installation), tableCell(row.lifeYears), tableCell(row.annualMaintenance));
        return cells;
      }),
    };
  }
  if (name === 'yearProjections') {
    return {
      headers: ['Year', 'Sales (₹ Lakhs)', 'Raw material', 'Wages', 'Power', 'Net profit'],
      rows: list.map((row) => [
        tableCell(row.year != null ? `Year ${row.year}` : row.label),
        tableCell(row.sales),
        tableCell(row.rm),
        tableCell(row.wages),
        tableCell(row.power),
        tableCell(row.netProfit),
      ]),
    };
  }
  if (name === 'costPhasing' && raw && typeof raw === 'object') {
    const heads: Array<[string, string]> = [
      ['land', 'Land'],
      ['building', 'Building / shed'],
      ['machinery', 'Machinery / equipment'],
      ['furniture', 'Furniture and fixtures'],
      ['deposits', 'Security deposits'],
      ['workingCapital', 'Working capital'],
    ];
    const source = raw as Record<string, any>;
    return {
      headers: ['Particulars', 'Already incurred', 'To be incurred', 'Total'],
      rows: heads.map(([key, label]) => {
        const cell = source[key] || {};
        const incurred = Number(cell.incurred) || 0;
        const proposed = Number(cell.proposed) || 0;
        return [label, String(incurred), String(proposed), String(incurred + proposed)];
      }),
    };
  }
  return null;
}

function cmepUserFigures(data: Record<string, any>): boolean {
  const num = (value: unknown) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };
  const step12 = data.step12 || {};
  const step13 = data.step13 || {};
  const costKeys = ['land', 'building', 'machinery', 'furniture', 'utilitiesAndInfrastructure', 'preliminaryAndPreOperative', 'workingCapitalMargin', 'ownContribution', 'securityDeposits'];
  if (costKeys.some((key) => num(step12[key]) !== 0)) return true;
  if (['bankLoan', 'interestRate', 'loanTenureMonths', 'moratoriumMonths'].some((key) => num(step13[key]) !== 0)) return true;
  const columns = Array.isArray(data.step15?.yearProjections) ? data.step15.yearProjections : [];
  const lineKeys = ['sales', 'rm', 'wages', 'power', 'salaries', 'rent', 'maintenance', 'admin', 'interest', 'depreciation', 'tax', 'netProfit'];
  return columns.some((col: any) => col && typeof col === 'object' && lineKeys.some((key) => num(col[key]) !== 0));
}

function sectionsForReport(doc: IndividualDocument): DocSection[] {
  return doc.sections
    .map((section) => ({ ...section, rows: section.rows.filter((row) => row.filled) }))
    .filter((section) => section.rows.length > 0);
}

export function buildIndividualDocument(dpr: any, project?: any): IndividualDocument {
  const data = extractIndividualDocData(dpr, project);
  const schemeCode = extractSchemeCode(dpr, project, data);
  const steps = getSchemeSteps(schemeCode);
  const step1 = data.step1 || {};
  const extras = data.schemeExtras || {};
  const budget = data.ventureMatchAnswers?.budget;
  const unitName = (step1.unitName || step1.clusterName || project?.projectName || 'UNIT NAME').toString();
  const schemeLabel = schemeCode ? (SCHEME_LABELS[schemeCode] || schemeCode) : 'Bank Term Loan';

  const sections: DocSection[] = steps.map((def) => {
    const title = def.title.replace(/^Step \d+:\s*/, '');
    if (def.id === 'uploads' || def.contentStep === 18) {
      return { n: def.n, id: def.id, title, contentStep: def.contentStep, rows: uploadRows(schemeCode, data) };
    }
    const fields = getIndividualDocFields(def.contentStep, schemeCode, budget);
    const seen = new Set<string>();
    const rows: DocRow[] = [];
    for (const field of fields) {
      if (seen.has(field.path)) continue;
      seen.add(field.path);
      const raw = readField(field, data);
      if (schemeCode === 'AP_CMEP' && field.name === 'yearProjections') {
        const columns = normalizeCmepProjections(raw) as Array<Record<string, unknown>>;
        const amt = (value: unknown) => {
          const n = Number(value);
          if (!Number.isFinite(n)) return '0';
          return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
        };
        const lineKeys = ['sales', 'rm', 'wages', 'power', 'salaries', 'rent', 'maintenance', 'admin', 'interest', 'depreciation', 'tax', 'netProfit'] as const;
        const filled = columns.some((col) => lineKeys.some((key) => Number((col as Record<string, unknown>)[key]) !== 0));
        const operating = {
          caption: 'Sales and operating costs (₹ Lakhs)',
          headers: ['Year', 'Sales', 'Raw material', 'Wages', 'Power', 'Salaries', 'Rent', 'Maintenance', 'Admin'],
          rows: columns.map((col) => [
            String(col.label || ''),
            amt(col.sales),
            amt(col.rm),
            amt(col.wages),
            amt(col.power),
            amt(col.salaries),
            amt(col.rent),
            amt(col.maintenance),
            amt(col.admin),
          ]),
        };
        const profit = {
          caption: 'Interest, depreciation and profit (₹ Lakhs)',
          headers: ['Year', 'Interest', 'Depreciation', 'Tax', 'Net profit'],
          rows: columns.map((col) => [String(col.label || ''), amt(col.interest), amt(col.depreciation), amt(col.tax), amt(col.netProfit)]),
        };
        rows.push({ label: operating.caption, value: JSON.stringify(operating), path: field.path, filled, embed: 'data-table' });
        rows.push({ label: profit.caption, value: JSON.stringify(profit), path: `${field.path}.profit`, filled, embed: 'data-table' });
        continue;
      }
      const table = bankDataTable(field.name, raw, schemeCode);
      if (table) {
        const kept = { ...table, rows: keepEnteredRows(field.name, table.rows) };
        rows.push({
          label: field.label,
          value: JSON.stringify(kept),
          path: field.path,
          filled: kept.rows.length > 0,
          embed: 'data-table',
        });
        continue;
      }
      if (
        schemeCode === 'AP_CMEP' &&
        (field.name === 'promoters' || field.name === 'machineryItems' || field.name === 'costPhasing')
      ) {
        rows.push({
          label: field.label,
          value: JSON.stringify(raw ?? null),
          path: field.path,
          filled: raw != null && raw !== '' && !(Array.isArray(raw) && raw.length === 0),
          embed: field.name === 'promoters' ? 'cmep-promoters' : field.name === 'machineryItems' ? 'cmep-machinery' : 'cmep-cost',
        });
        continue;
      }
      const formatted = formatDocValue(raw);
      rows.push({ label: field.label, value: formatted, path: field.path, filled: isFilled(formatted) });
    }
    if (schemeCode === 'AP_CMEP' && def.contentStep === 15 && cmepUserFigures(data)) {
      rows.push({
        label: 'Depreciation, DSCR, break-even and repayment',
        value: JSON.stringify(buildCmepDerived(data)),
        path: 'derived.cmep',
        filled: true,
        embed: 'cmep-derived',
      });
    }
    return { n: def.n, id: def.id, title, contentStep: def.contentStep, rows };
  });

  let askedCount = 0;
  let filledCount = 0;
  for (const section of sections) {
    for (const row of section.rows) {
      askedCount += 1;
      if (row.filled) filledCount += 1;
    }
  }

  return {
    schemeCode,
    unitName,
    district: step1.district || '',
    location: step1.location || '',
    entrepreneurName: extras.entrepreneurName || '',
    actionLine: actionLine(schemeCode),
    underLine: `under '${schemeLabel}'`,
    sections,
    askedCount,
    filledCount,
  };
}

function escapeHtml(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Short / numeric-ish fields → compact meta grid; long prose → stacked Q&A block (matches live preview). */
const SHORT_FIELD_NAMES = new Set([
  'unitName',
  'district',
  'location',
  'yearOfEstablishment',
  'yearOfIncorporation',
  'entrepreneurName',
  'entrepreneurAge',
  'craft',
  'loanTranche',
  'trainingStage',
  'covOrLor',
  'vendingType',
  'workplaceType',
  'fssai',
  'unitStage',
  'odopAligned',
  'sectorType',
  'land',
  'building',
  'machinery',
  'utilitiesAndInfrastructure',
  'preliminaryAndPreOperative',
  'workingCapitalMargin',
  'ownContribution',
  'spvContribution',
  'governmentGrant',
  'bankLoan',
  'otherSources',
  'subsidy',
  'startDate',
  'endDate',
  'irr',
  'npv',
  'dscr',
  'breakEvenPoint',
  'upiQr',
  'dailySales',
  'yearsVending',
  'yearsPractising',
  'employmentGeneration',
  'indirectEmployment',
  'directEmployment',
  'turnoverGrowth',
  'rawMaterialCost',
  'powerCost',
  'wages',
  'maintenance',
  'administrativeExpenses',
  'marketingExpenses',
  'annualProductionVolume',
  'annualSalesRealization',
]);

function fieldNameFromPath(path: string): string {
  const parts = String(path || '').split('.');
  return parts[parts.length - 1] || '';
}

function isExpansiveRow(row: DocRow): boolean {
  const name = fieldNameFromPath(row.path);
  if (SHORT_FIELD_NAMES.has(name)) return false;
  const text = String(row.value || '');
  if (!text || text === '—') return false;
  if (text.includes('\n') || text.length > 48) return true;
  const label = row.label.toLowerCase();
  return (
    label.includes('description') ||
    label.includes('intro') ||
    label.includes('summary') ||
    label.includes('process') ||
    label.includes('analysis') ||
    label.includes('importance') ||
    label.includes('justification') ||
    label.includes('gap') ||
    label.includes('story') ||
    label.includes('activity') ||
    label.includes('note') ||
    label.includes('outcome')
  );
}

function cmepFyStart(now = new Date()): number {
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
}

function normalizeCmepProjections(raw: unknown, now = new Date()) {
  const start = cmepFyStart(now);
  const defaults = [
    ...[start - 3, start - 2, start - 1].map((year) => ({
      label: `${year}-${year + 1}`,
      period: 'previous' as const,
      sales: 0,
      rm: 0,
      wages: 0,
      power: 0,
      netProfit: 0,
    })),
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((offset) => {
      const year = start + offset;
      return {
        label: `${year}-${year + 1}`,
        period: 'projected' as const,
        sales: 0,
        rm: 0,
        wages: 0,
        power: 0,
        netProfit: 0,
      };
    }),
  ];
  const lineKeys = ['sales', 'rm', 'wages', 'power', 'salaries', 'rent', 'maintenance', 'admin', 'interest', 'depreciation', 'tax', 'netProfit'];
  const num = (value: unknown) => {
    const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
    return Number.isFinite(n) ? n : 0;
  };
  const copyAmounts = (saved: Record<string, unknown>) => {
    const amounts: Record<string, number> = {};
    for (const key of lineKeys) amounts[key] = num(saved[key]);
    return amounts;
  };
  if (!Array.isArray(raw)) return defaults;
  const labeled = raw.filter((row) => row && typeof row === 'object' && 'label' in row && 'period' in row);
  if (labeled.length) {
    const byLabel = new Map(labeled.map((row) => [String((row as { label: string }).label), row as Record<string, unknown>]));
    return defaults.map((col) => {
      const saved = byLabel.get(col.label) || {};
      return { ...col, ...copyAmounts(saved) };
    });
  }
  const legacy = raw.filter((row) => row && typeof row === 'object');
  return defaults.map((col, index) => {
    if (col.period !== 'projected') return col;
    const slot = legacy[index - defaults.filter((item) => item.period === 'previous').length] as Record<string, unknown> | undefined;
    if (!slot) return col;
    return { ...col, ...copyAmounts(slot) };
  });
}

function renderCmepProjectionTableHtml(json: string): string {
  let columns: Array<Record<string, unknown>> = [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) columns = parsed;
  } catch {
    columns = [];
  }
  if (!columns.length) return '<p class="empty">Not filled yet — complete this in the form.</p>';
  const lines: Array<[string, string]> = [
    ['sales', 'Sales realisation'],
    ['rm', 'Raw material'],
    ['wages', 'Wages'],
    ['power', 'Power'],
    ['salaries', 'Salaries'],
    ['rent', 'Rent'],
    ['maintenance', 'Maintenance'],
    ['admin', 'Administrative expenses'],
    ['interest', 'Interest'],
    ['depreciation', 'Depreciation'],
    ['tax', 'Income tax'],
    ['netProfit', 'Net profit'],
  ];
  const previous = columns.filter((col) => col.period === 'previous').length;
  const projected = columns.filter((col) => col.period === 'projected').length;
  const fmt = (value: unknown) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n === 0) return '–';
    return Number.isInteger(n) ? String(n) : n.toFixed(2);
  };
  const years = columns.map((col) => `<th>${escapeHtml(String(col.label || ''))}</th>`).join('');
  const body = lines
    .map(([key, label], index) => {
      const cells = columns.map((col) => `<td class="amt">${fmt(col[key])}</td>`).join('');
      return `<tr><td class="sl">${index + 1}</td><td class="part">${escapeHtml(label)}</td>${cells}</tr>`;
    })
    .join('');
  return `<div class="fin-sheet">
    <div class="fin-banner">Financial projections</div>
    <p class="fin-unit">Rs. In Lakhs</p>
    <table class="fin-table">
      <thead>
        <tr>
          <th rowspan="2" class="sl">Sl. No.</th>
          <th rowspan="2" class="part">Particulars</th>
          ${previous ? `<th colspan="${previous}">Previous</th>` : ''}
          ${projected ? `<th colspan="${projected}">Projected</th>` : ''}
        </tr>
        <tr>${years}</tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  </div>`;
}

function buildCmepDerived(data: Record<string, any>) {
  const step12 = data.step12 || {};
  const step13 = data.step13 || {};
  const columns = normalizeCmepProjections(data.step15?.yearProjections).filter((col) => col.period === 'projected');
  const num = (value: unknown) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };
  const phasing = step12.costPhasing && typeof step12.costPhasing === 'object' ? step12.costPhasing : {};
  const asset = (key: string, field: string) => {
    const cell = phasing[key];
    if (cell && typeof cell === 'object') return num(cell.incurred) + num(cell.proposed);
    return num(step12[field]);
  };
  const schedule = (label: string, rate: number, addition: number) => {
    let opening = 0;
    return {
      asset: label,
      rate,
      years: columns.map((col, index) => {
        const additions = index === 0 ? addition : 0;
        const depreciation = Math.round((opening + additions) * rate * 100) / 100;
        const closing = Math.round((opening + additions - depreciation) * 100) / 100;
        const row = { label: col.label, opening, additions, depreciation, closing };
        opening = closing;
        return row;
      }),
    };
  };
  const loan = num(step13.bankLoan);
  const rate = num(step13.interestRate) > 0 ? num(step13.interestRate) : 12;
  const tenure = num(step13.loanTenureMonths) > 0 ? num(step13.loanTenureMonths) : 84;
  const moratorium = num(step13.moratoriumMonths);
  const months = Math.max(1, tenure - moratorium);
  const monthly = rate / 100 / 12;
  const emi = loan > 0 && monthly > 0
    ? (loan * monthly * Math.pow(1 + monthly, months)) / (Math.pow(1 + monthly, months) - 1)
    : 0;
  const repayment = emi * 12;
  const dscr = columns.map((col) => {
    const record = col as Record<string, unknown>;
    const cash = num(record.netProfit) + num(record.depreciation) + num(record.interest);
    return {
      label: col.label,
      cash,
      repayment,
      ratio: repayment > 0 ? cash / repayment : 0,
    };
  });
  const first = (columns[0] || {}) as Record<string, unknown>;
  const fixed = num(first.salaries) + num(first.rent) + num(first.maintenance) + num(first.admin) + num(first.depreciation) + num(first.interest);
  const contribution = Math.max(0, num(first.sales) - num(first.rm) - num(first.wages) - num(first.power));
  const breakEvenSales = num(first.sales) > 0 && contribution > 0 ? fixed / (contribution / num(first.sales)) : 0;
  const breakEvenCapacity = num(first.sales) > 0 ? (breakEvenSales / num(first.sales)) * 100 : 0;
  return {
    depreciation: [
      schedule('Machinery', 0.15, asset('machinery', 'machinery')),
      schedule('Building', 0.1, asset('building', 'building')),
      schedule('Furniture and fixtures', 0.1, asset('furniture', 'furniture')),
    ],
    dscr,
    averageDscr: dscr.length ? dscr.reduce((sum, row) => sum + row.ratio, 0) / dscr.length : 0,
    breakEvenSales,
    breakEvenCapacity,
    repayment: {
      amount: loan,
      rate: num(step13.interestRate),
      moratorium,
      tenure: num(step13.loanTenureMonths),
      emi,
    },
  };
}

function renderCmepEmbedHtml(kind: string, json: string): string {
  let parsed: any = null;
  try {
    parsed = JSON.parse(json);
  } catch {
    parsed = null;
  }
  const fmt = (value: unknown) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n === 0) return '–';
    return Number.isInteger(n) ? String(n) : n.toFixed(2);
  };
  if (kind === 'cmep-promoters' && Array.isArray(parsed)) {
    const body = parsed
      .map((row) => `<tr><td>${escapeHtml(String(row.name || '–'))}</td><td>${escapeHtml(String(row.relationName || '–'))}</td><td>${escapeHtml(String(row.age || '–'))}</td><td>${escapeHtml(String(row.education || '–'))}</td><td>${escapeHtml(String(row.experienceYears || '–'))}</td><td>${escapeHtml(String(row.phone || '–'))}</td></tr>`)
      .join('');
    return `<table class="fin-table"><thead><tr><th>Name</th><th>Relation</th><th>Age</th><th>Education</th><th>Experience</th><th>Phone</th></tr></thead><tbody>${body}</tbody></table>`;
  }
  if (kind === 'cmep-machinery' && Array.isArray(parsed)) {
    const body = parsed
      .map((row) => `<tr><td>${escapeHtml(String(row.description || '–'))}</td><td>${escapeHtml(String(row.condition || '–'))}</td><td>${escapeHtml(String(row.supplier || '–'))}</td><td>${fmt(row.quantity)}</td><td>${fmt(row.unitCost)}</td></tr>`)
      .join('');
    return `<table class="fin-table"><thead><tr><th>Description</th><th>New / used</th><th>Supplier</th><th>Qty</th><th>Unit cost (₹ Lakhs)</th></tr></thead><tbody>${body}</tbody></table>`;
  }
  if (kind === 'cmep-cost' && parsed && typeof parsed === 'object') {
    const heads: Array<[string, string]> = [
      ['land', 'Land'],
      ['building', 'Building / shed'],
      ['machinery', 'Machinery / equipment'],
      ['furniture', 'Furniture and fixtures'],
      ['deposits', 'Security deposits'],
      ['workingCapital', 'Working capital'],
    ];
    const body = heads
      .map(([key, label]) => {
        const cell = parsed[key] || {};
        const incurred = Number(cell.incurred) || 0;
        const proposed = Number(cell.proposed) || 0;
        return `<tr><td class="part">${label}</td><td>${fmt(incurred)}</td><td>${fmt(proposed)}</td><td>${fmt(incurred + proposed)}</td></tr>`;
      })
      .join('');
    return `<table class="fin-table"><thead><tr><th>Particulars</th><th>Already incurred</th><th>To be incurred</th><th>Total</th></tr></thead><tbody>${body}</tbody></table>`;
  }
  if (kind === 'cmep-derived' && parsed) {
    const loan = parsed.repayment || {};
    const facts: Array<[string, string]> = [
      ['Term loan (₹ Lakhs)', fmt(loan.amount)],
      ['Interest rate (% per year)', fmt(loan.rate)],
      ['Moratorium (months)', String(loan.moratorium || 0)],
      ['Loan tenure (months)', String(loan.tenure || 0)],
      ['Indicative EMI (₹ Lakhs)', fmt(loan.emi)],
      ['Break-even sales (₹ Lakhs)', fmt(parsed.breakEvenSales)],
      ['Break-even capacity (%)', fmt(parsed.breakEvenCapacity)],
      ['Average DSCR', fmt(parsed.averageDscr)],
    ].filter((pair): pair is [string, string] => Boolean(pair[1] && pair[1] !== '–' && pair[1] !== '0'));
    const factRows = facts
      .map(([label, value]) => `<tr><td class="part">${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`)
      .join('');
    const dscrBody = (Array.isArray(parsed.dscr) ? parsed.dscr : [])
      .filter((row: any) => Number(row.cash) || Number(row.repayment) || Number(row.ratio))
      .map(
        (row: any) =>
          `<tr><td>${escapeHtml(String(row.label || ''))}</td><td>${fmt(row.cash)}</td><td>${fmt(row.repayment)}</td><td>${fmt(row.ratio)}</td></tr>`
      )
      .join('');
    const depTables = (Array.isArray(parsed.depreciation) ? parsed.depreciation : [])
      .filter((asset: any) => (Array.isArray(asset.years) ? asset.years : []).some((year: any) => Number(year.additions) || Number(year.depreciation) || Number(year.opening)))
      .map((asset: any) => {
        const body = (Array.isArray(asset.years) ? asset.years : [])
          .map(
            (year: any) =>
              `<tr><td>${escapeHtml(String(year.label || ''))}</td><td>${fmt(year.opening)}</td><td>${fmt(year.additions)}</td><td>${fmt(year.depreciation)}</td><td>${fmt(year.closing)}</td></tr>`
          )
          .join('');
        const title = `${asset.asset || 'Asset'} — depreciation ${Math.round(Number(asset.rate) * 100)}%`;
        return `<table class="fin-table particulars"><caption>${escapeHtml(title)}</caption><thead><tr><th>Year</th><th>Opening</th><th>Additions</th><th>Depreciation</th><th>Closing</th></tr></thead><tbody>${body}</tbody></table>`;
      })
      .join('');
    return (
      (factRows
        ? `<table class="particulars"><caption>Repayment, break-even and DSCR</caption><thead><tr><th>Particular</th><th>Details</th></tr></thead><tbody>${factRows}</tbody></table>`
        : '') +
      (dscrBody
        ? `<table class="fin-table particulars"><caption>DSCR by year (₹ Lakhs)</caption><thead><tr><th>Year</th><th>Cash profit</th><th>Repayment</th><th>DSCR</th></tr></thead><tbody>${dscrBody}</tbody></table>`
        : '') +
      depTables
    );
  }
  return '';
}

function renderDataTableHtml(json: string): string {
  let parsed: { headers?: string[]; rows?: string[][] } = {};
  try {
    parsed = JSON.parse(json || '{}');
  } catch {
    parsed = {};
  }
  const headers = parsed.headers || [];
  const bodyRows = parsed.rows || [];
  const caption = (parsed as { caption?: string }).caption
    ? `<caption>${escapeHtml(String((parsed as { caption?: string }).caption))}</caption>`
    : '';
  const wide = headers.length > 8 ? ' year-grid' : '';
  const head = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('');
  const body = bodyRows.length
    ? bodyRows
        .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
        .join('')
    : `<tr><td colspan="${headers.length || 1}">—</td></tr>`;
  return `<table class="fin-table particulars${wide}">${caption}<thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

const NARRATIVE_FIELDS = new Set([
  'executiveSummary',
  'processOfManufacture',
  'sectorDescription',
  'presentActivities',
  'geography',
  'targetMarket',
  'existingDemand',
  'landDetails',
  'waterAndEffluent',
  'impactNote',
]);

function isNarrativeRow(row: DocRow): boolean {
  const name = fieldNameFromPath(row.path);
  if (NARRATIVE_FIELDS.has(name)) return true;
  const text = String(row.value || '');
  return text.length > 160;
}

function renderParticularsHtml(rows: DocRow[]): string {
  const body = rows
    .map((row) => {
      const empty = !row.value || row.value === '—';
      return `<tr><td class="part">${escapeHtml(row.label)}</td><td class="${empty ? 'is-empty' : ''}">${escapeHtml(empty ? '—' : row.value)}</td></tr>`;
    })
    .join('');
  return `<table class="particulars"><thead><tr><th>Particular</th><th>Details</th></tr></thead><tbody>${body}</tbody></table>`;
}

function renderSectionRowsHtml(rows: DocRow[], _schemeCode?: string | null): string {
  if (!rows.length) return '<p class="empty">—</p>';

  {
    const parts: string[] = ['<div class="sec-body">'];
    let bucket: DocRow[] = [];
    const flush = () => {
      if (!bucket.length) return;
      parts.push(renderParticularsHtml(bucket));
      bucket = [];
    };
    for (const row of rows) {
      if (row.embed) {
        flush();
        if (row.embed === 'cmep-projections') parts.push(renderCmepProjectionTableHtml(row.value));
        else if (row.embed === 'data-table') parts.push(renderDataTableHtml(row.value));
        else parts.push(renderCmepEmbedHtml(row.embed, row.value));
      } else if (isNarrativeRow(row)) {
        flush();
        const empty = !row.value || row.value === '—';
        parts.push(
          `<article class="qa-block"><h3 class="qa-q">${escapeHtml(row.label)}</h3>` +
            `<div class="qa-a${empty ? ' is-empty' : ''}">${escapeHtml(empty ? '—' : row.value).replace(/\n/g, '<br/>')}</div></article>`
        );
      } else {
        bucket.push(row);
      }
    }
    flush();
    parts.push('</div>');
    return parts.join('');
  }
}

export function renderIndividualDprHtml(doc: IndividualDocument): string {
  const isPmegp = doc.schemeCode === 'PMEGP';
  const shown = sectionsForReport(doc);
  const namedUnit = doc.unitName && doc.unitName !== 'UNIT NAME' ? doc.unitName : '';
  const toc = shown
    .map((s, index) => `<li><span class="toc-num">${index + 1}</span><span class="toc-label">${escapeHtml(s.title)}</span></li>`)
    .join('');

  const sectionsHtml = shown
    .map(
      (s, index) =>
        `<section class="sec"><h2><span class="sec-num">${index + 1}</span>${escapeHtml(s.title)}</h2>${renderSectionRowsHtml(s.rows, doc.schemeCode)}</section>`
    )
    .join('\n');

  const coverMeta = `
      ${doc.district ? `<div><span>District</span>${escapeHtml(doc.district)}</div>` : ''}
      ${doc.location ? `<div><span>Location</span>${escapeHtml(doc.location)}</div>` : ''}
      ${doc.entrepreneurName ? `<div><span>Entrepreneur name</span>${escapeHtml(doc.entrepreneurName)}</div>` : ''}`;

  if (isPmegp) {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    color: #0b2f2c;
    font-family: 'Times New Roman', Times, Georgia, serif;
    background: #fbfaf6;
  }
  .page {
    border: 1px solid #99f6e4;
    box-shadow: inset 0 0 0 3px #fff, inset 0 0 0 5px #99f6e4;
    padding: 0 0 6mm;
    min-height: 100%;
    background: linear-gradient(180deg, #ffffff 0%, #fbfaf6 100%);
  }
  .flag-band {
    height: 5pt;
    background: linear-gradient(90deg, #ff9933 0%, #ff9933 33.33%, #ffffff 33.33%, #ffffff 66.66%, #138808 66.66%, #138808 100%);
  }
  .cover {
    text-align: center;
    padding: 7mm 5mm 10mm;
    margin-bottom: 8mm;
    background:
      radial-gradient(ellipse 80% 55% at 50% 0%, rgba(15,118,110,0.10), transparent 70%),
      linear-gradient(180deg, #ecfdf5 0%, #ffffff 62%);
  }
  .agency { display: flex; align-items: center; justify-content: center; gap: 8pt; margin: 8pt 0 6pt; flex-wrap: wrap; }
  .agency-mark {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 2.4em; height: 2.4em; padding: 0 6pt; border-radius: 999px;
    background: linear-gradient(145deg, #0f766e, #134e4a); color: #fff;
    font-size: 8.5pt; font-weight: 800; letter-spacing: 0.06em;
  }
  .agency-text { font-size: 8.5pt; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #115e59; }
  .badge {
    display: inline-block; margin: 0 auto 8pt; padding: 4pt 14pt;
    font-size: 8pt; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    color: #115e59; border: 1px solid #5eead4;
    background: linear-gradient(180deg, #ffffff, #ccfbf1); border-radius: 999px;
  }
  .kicker { font-size: 17pt; font-weight: 700; letter-spacing: 0.14em; color: #115e59; margin: 6pt 0 8pt; }
  .on { font-size: 10pt; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #64748b; margin: 0; }
  .action { font-size: 12.5pt; font-weight: 600; margin: 4pt 0 8pt; color: #0b2f2c; }
  .unit {
    color: #0f766e; font-size: 21pt; font-weight: 700; text-transform: uppercase;
    margin: 8pt 6mm; line-height: 1.25; letter-spacing: 0.02em;
  }
  .scheme-block {
    max-width: 150mm; margin: 8pt auto 0; padding: 8pt 12pt;
    border-top: 1px solid rgba(15,118,110,0.2); border-bottom: 1px solid rgba(15,118,110,0.2);
    background: rgba(240,253,250,0.65);
  }
  .scheme { font-size: 12.5pt; font-weight: 700; color: #115e59; margin: 0; line-height: 1.4; }
  .tagline { font-size: 9.5pt; font-style: italic; color: #0f766e; margin: 5pt 0 0; }
  .cover-meta {
    width: min(120mm, 92%); margin: 14pt auto 0; text-align: left;
    border: 1px solid #99f6e4; background: #fff;
  }
  .cover-meta div {
    display: grid; grid-template-columns: 38% 1fr; gap: 8pt;
    padding: 7pt 12pt; border-bottom: 1px solid #e5e7eb; font-size: 10.5pt;
  }
  .cover-meta div:last-child { border-bottom: none; }
  .cover-meta span {
    font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
    font-size: 8pt; color: #64748b;
  }
  .cover-rule {
    width: 48mm; height: 2.5pt; margin: 12pt auto 0; border-radius: 2pt;
    background: linear-gradient(90deg, transparent, #b45309, #0f766e, #b45309, transparent);
  }
  .sec { margin: 0 4mm 9mm; page-break-inside: avoid; }
  h2 {
    font-size: 13pt; font-weight: 700; margin: 0 0 10pt; padding: 0 0 8pt 8pt;
    display: flex; align-items: center; gap: 10pt; line-height: 1.3;
    border-left: 3.5pt solid #0f766e;
    background: linear-gradient(90deg, rgba(15,118,110,0.08), transparent 72%);
  }
  .sec-num {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 1.75em; height: 1.75em; padding: 0 4pt; border-radius: 999px;
    background: linear-gradient(145deg, #0f766e, #134e4a); color: #fff;
    font-size: 10.5pt; font-weight: 700; flex-shrink: 0;
  }
  .sec-body { display: flex; flex-direction: column; gap: 10pt; }
  .meta-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 0; margin: 0;
    border: 1px solid #5eead4; border-radius: 4pt; overflow: hidden; background: #fff;
  }
  .meta-item {
    display: flex; flex-direction: column; gap: 2pt; padding: 8pt 9pt;
    border-right: 1px solid #99f6e4; border-bottom: 1px solid #99f6e4; min-width: 0;
    background: linear-gradient(180deg, #ffffff 0%, #f0fdfa 100%);
  }
  .particulars { width: 100%; border-collapse: collapse; margin: 0 0 8pt; font-size: 10pt; }
  .particulars th, .particulars td { border: 1px solid #0f766e; padding: 4pt 6pt; text-align: left; vertical-align: top; }
  .particulars thead th { background: #ecfdf5; font-weight: 700; }
  .particulars td.part { width: 46%; font-weight: 700; }
  .particulars td.is-empty { color: #9CA3AF; font-style: italic; }
  .particulars caption { caption-side: top; text-align: left; font-weight: 700; padding: 5pt 6pt; background: #ecfdf5; border: 1px solid #0f766e; border-bottom: none; }
  .fin-table.particulars td, .fin-table.particulars th { text-align: left; }
  .year-grid { font-size: 8pt; }
  .year-grid th, .year-grid td { padding: 3pt 3pt; }
  .meta-item:nth-child(2n) { border-right: none; }
  .meta-item dt {
    margin: 0; font-size: 8pt; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.04em; color: #115e59;
  }
  .meta-item dd {
    margin: 0; font-size: 11pt; font-weight: 600; color: #0b2f2c;
    overflow-wrap: anywhere; word-break: break-word;
  }
  .meta-item dd.is-empty { color: #9CA3AF; font-style: italic; font-weight: 500; }
  .qa-block {
    border: 1px solid #99f6e4; border-left: 3.5pt solid #0f766e;
    border-radius: 0 4pt 4pt 0; background: #fff; page-break-inside: avoid; overflow: hidden;
  }
  .qa-q {
    margin: 0; padding: 6pt 9pt; font-size: 10pt; font-weight: 700;
    background: linear-gradient(90deg, #ecfdf5, #f8fafc);
    border-bottom: 1px solid #99f6e4; color: #115e59;
  }
  .qa-a {
    margin: 0; padding: 10pt 11pt 12pt; font-size: 11pt; line-height: 1.65;
    color: #0b2f2c; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word;
    min-height: 2.8em; text-align: justify; background: #fff;
  }
  .qa-a.is-empty { color: #9CA3AF; font-style: italic; text-align: left; }
  .empty { color: #9CA3AF; font-style: italic; }
  .toc-list {
    list-style: none; margin: 0; padding: 0; border: 1px solid #5eead4;
    border-radius: 4pt; overflow: hidden; background: #fff;
  }
  .toc-list li {
    display: flex; gap: 10pt; padding: 7pt 9pt; border-bottom: 1px solid #e6fffa; font-size: 11pt;
  }
  .toc-list li:nth-child(odd) { background: rgba(240,253,250,0.55); }
  .toc-list li:last-child { border-bottom: none; }
  .toc-num { font-weight: 700; min-width: 1.5em; color: #0f766e; }
  .toc-label { flex: 1; }
  .doc-footer {
    display: flex; justify-content: space-between; gap: 12pt; flex-wrap: wrap;
    margin: 4mm 4mm 0; padding: 8pt 10pt; border-top: 2pt solid #0f766e;
    font-size: 8pt; letter-spacing: 0.04em; text-transform: uppercase; color: #115e59;
    background: linear-gradient(180deg, #ecfdf5, transparent);
  }
</style>
</head>
<body>
  <div class="page">
    <div class="flag-band"></div>
    <div class="cover">
      <div class="agency">
        <span class="agency-mark">KVIC</span>
        <span class="agency-text">Khadi &amp; Village Industries Commission</span>
      </div>
      <div class="badge">PMEGP · KVIC unit pack</div>
      <div class="kicker">PMEGP DETAILED PROJECT REPORT</div>
      <div class="on">On</div>
      <div class="action">${escapeHtml(doc.actionLine)}</div>
      ${namedUnit ? `<div class="unit">${escapeHtml(namedUnit)}</div>` : ''}
      <div class="scheme-block">
        <div class="scheme">${escapeHtml(doc.underLine)}</div>
        <div class="tagline">Credit-linked margin money · bank-style single-unit DPR</div>
      </div>
      <div class="cover-meta">${coverMeta}</div>
      <div class="cover-rule"></div>
    </div>
    <section class="sec">
      <h2><span class="sec-num">0</span>Table of Contents</h2>
      <ol class="toc-list">${toc}</ol>
    </section>
    ${sectionsHtml}
    <footer class="doc-footer">
      <span>PMEGP · Bank-unit Detailed Project Report</span>
      <span>Confidential — for lending appraisal</span>
    </footer>
  </div>
</body>
</html>`;
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4; margin: 16mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; color: #1F2937; font-family: 'Times New Roman', Times, serif; }
  .cover { text-align: center; border-bottom: 2px solid #1F2937; padding: 4mm 2mm 8mm; margin-bottom: 8mm; }
  .kicker { font-size: 20pt; font-weight: 700; letter-spacing: 0.08em; margin: 0 0 10pt; }
  .on, .action { font-size: 13pt; font-weight: 600; margin: 2pt 0; }
  .unit { color: #059669; font-size: 20pt; font-weight: 700; text-transform: uppercase; margin: 10pt 6mm; line-height: 1.25; }
  .scheme { font-size: 12pt; font-weight: 600; max-width: 150mm; margin: 8pt auto 0; line-height: 1.4; }
  .cover-meta { display: table; margin: 14pt auto 0; text-align: left; font-size: 11pt; }
  .cover-meta div { display: table-row; }
  .cover-meta span { display: table-cell; font-weight: 700; padding: 2pt 10pt 2pt 0; white-space: nowrap; }
  h2 { font-size: 13.5pt; font-weight: 700; margin: 0 0 10pt; padding-bottom: 4pt; border-bottom: 1.5px solid #1F2937; display: flex; align-items: baseline; gap: 8pt; line-height: 1.3; }
  .sec-num { display: inline-flex; align-items: center; justify-content: center; min-width: 1.6em; height: 1.6em; padding: 0 4pt; border: 1.5px solid #1F2937; border-radius: 2pt; font-size: 11pt; font-weight: 700; flex-shrink: 0; }
  .sec { margin-bottom: 9mm; page-break-inside: avoid; }
  .sec-body { display: flex; flex-direction: column; gap: 10pt; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; margin: 0; border: 1px solid #1F2937; }
  .meta-item { display: flex; flex-direction: column; gap: 2pt; padding: 7pt 8pt; border-right: 1px solid #D1D5DB; border-bottom: 1px solid #D1D5DB; min-width: 0; }
  .meta-item:nth-child(2n) { border-right: none; }
  .meta-item dt { margin: 0; font-size: 8.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #4B5563; }
  .meta-item dd { margin: 0; font-size: 11pt; font-weight: 600; color: #111827; overflow-wrap: anywhere; word-break: break-word; }
  .meta-item dd.is-empty { color: #9CA3AF; font-style: italic; font-weight: 500; }
  .particulars { width: 100%; border-collapse: collapse; margin: 0 0 8pt; font-size: 10pt; }
  .particulars th, .particulars td { border: 1px solid #1F2937; padding: 4pt 6pt; text-align: left; vertical-align: top; }
  .particulars thead th { background: #F3F4F6; font-weight: 700; }
  .particulars td.part { width: 46%; font-weight: 700; }
  .particulars td.is-empty { color: #9CA3AF; font-style: italic; }
  .particulars caption { caption-side: top; text-align: left; font-weight: 700; padding: 5pt 6pt; background: #F3F4F6; border: 1px solid #1F2937; border-bottom: none; }
  .fin-table.particulars td, .fin-table.particulars th { text-align: left; }
  .year-grid { font-size: 8pt; }
  .year-grid th, .year-grid td { padding: 3pt 3pt; }
  .qa-block { border: 1px solid #1F2937; background: #fff; page-break-inside: avoid; }
  .qa-q { margin: 0; padding: 6pt 9pt; font-size: 10pt; font-weight: 700; background: #F3F4F6; border-bottom: 1px solid #D1D5DB; color: #111827; }
  .qa-a { margin: 0; padding: 10pt 11pt 12pt; font-size: 11pt; line-height: 1.65; color: #1F2937; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; min-height: 2.8em; text-align: justify; }
  .qa-a.is-empty { color: #9CA3AF; font-style: italic; text-align: left; }
  .empty { color: #9CA3AF; font-style: italic; }
  .sec:has(.fin-sheet) { page-break-inside: auto; }
  .fin-sheet { page: fin; break-before: page; margin-top: 4pt; }
  @page fin { size: A4 landscape; margin: 12mm; }
  .fin-banner { background: #8fa03a; color: #fff; text-align: right; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 4pt 8pt; font-size: 11pt; }
  .fin-unit { margin: 2pt 0 4pt; text-align: right; font-size: 9pt; font-weight: 700; }
  .fin-table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
  .fin-table th, .fin-table td { border: 1px solid #1F2937; padding: 3pt 4pt; text-align: center; }
  .fin-table .sl { width: 36pt; font-weight: 700; }
  .fin-table .part { text-align: left; font-weight: 700; min-width: 90pt; }
  .fin-table thead th { background: #F3F4F6; font-weight: 700; }
  .toc-list { list-style: none; margin: 0; padding: 0; border: 1px solid #1F2937; }
  .toc-list li { display: flex; gap: 10pt; padding: 6pt 8pt; border-bottom: 1px solid #E5E7EB; font-size: 11pt; }
  .toc-list li:last-child { border-bottom: none; }
  .toc-num { font-weight: 700; min-width: 1.5em; }
  .toc-label { flex: 1; }
</style>
</head>
<body>
  <div class="cover">
    <div class="kicker">DETAILED PROJECT REPORT</div>
    <div class="on">On</div>
    <div class="action">${escapeHtml(doc.actionLine)}</div>
    ${namedUnit ? `<div class="unit">${escapeHtml(namedUnit)}</div>` : ''}
    <div class="scheme">${escapeHtml(doc.underLine)}</div>
    <div class="cover-meta">${coverMeta}</div>
  </div>
  <section class="sec">
    <h2><span class="sec-num">0</span>Table of Contents</h2>
    <ol class="toc-list">${toc}</ol>
  </section>
  ${sectionsHtml}
</body>
</html>`;
}

function cmepDocxTable(json: string): Table {
  let columns: Array<Record<string, unknown>> = [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) columns = parsed;
  } catch {
    columns = [];
  }
  const lines: Array<[string, string]> = [
    ['sales', 'Sales realisation'],
    ['rm', 'Raw material'],
    ['wages', 'Wages'],
    ['power', 'Power'],
    ['salaries', 'Salaries'],
    ['rent', 'Rent'],
    ['maintenance', 'Maintenance'],
    ['admin', 'Administrative expenses'],
    ['interest', 'Interest'],
    ['depreciation', 'Depreciation'],
    ['tax', 'Income tax'],
    ['netProfit', 'Net profit'],
  ];
  const cell = (text: string, bold = false) =>
    new TableCell({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text, bold, size: 14 })],
        }),
      ],
    });
  const fmt = (value: unknown) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n === 0) return '–';
    return Number.isInteger(n) ? String(n) : n.toFixed(2);
  };
  const previous = columns.filter((col) => col.period === 'previous').length;
  const projected = columns.filter((col) => col.period === 'projected').length;
  const group = (text: string, span: number) =>
    new TableCell({
      columnSpan: span,
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text, bold: true, size: 14 })],
        }),
      ],
    });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            rowSpan: 2,
            children: [new Paragraph({ children: [new TextRun({ text: 'Sl. No.', bold: true, size: 14 })] })],
          }),
          new TableCell({
            rowSpan: 2,
            children: [new Paragraph({ children: [new TextRun({ text: 'Particulars', bold: true, size: 14 })] })],
          }),
          ...(previous ? [group('Previous', previous)] : []),
          ...(projected ? [group('Projected', projected)] : []),
        ],
      }),
      new TableRow({
        children: columns.map((col) => cell(String(col.label || ''), true)),
      }),
      ...lines.map(
        ([key, label], index) =>
          new TableRow({
            children: [
              cell(String(index + 1), true),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 14 })] })],
              }),
              ...columns.map((col) => cell(fmt(col[key]))),
            ],
          })
      ),
    ],
  });
}

export async function generateIndividualDprDocx(doc: IndividualDocument): Promise<Buffer> {
  const sectionBlocks = (rows: DocRow[]): (Paragraph | Table)[] => {
    if (!rows.length) {
      return [new Paragraph({ children: [new TextRun({ text: '—', italics: true, color: '9CA3AF' })] })];
    }
    const stacked = doc.schemeCode === 'AP_CMEP';
    const embeds = rows.filter((row) => !!row.embed);
    const rest = rows.filter((row) => !row.embed);
    const shortRows: DocRow[] = [];
    const longRows: DocRow[] = [];
    for (const row of rest) {
      if (stacked || isExpansiveRow(row)) longRows.push(row);
      else shortRows.push(row);
    }
    const out: (Paragraph | Table)[] = [];

    // Compact facts as stacked label-above-value (not side-by-side Q|A)
    for (const row of shortRows) {
      out.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [new TextRun({ text: row.label.toUpperCase(), bold: true, size: 16, color: '4B5563' })],
        })
      );
      out.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: !row.value || row.value === '—' ? 'Not filled' : row.value,
              bold: true,
              size: 22,
              italics: !row.value || row.value === '—',
              color: !row.value || row.value === '—' ? '9CA3AF' : '111827',
            }),
          ],
        })
      );
    }

    for (const row of longRows) {
      out.push(
        new Paragraph({
          spacing: { before: 160, after: 60 },
          shading: { type: 'clear', fill: 'F3F4F6' },
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D1D5DB' },
          },
          children: [new TextRun({ text: row.label, bold: true, size: 20 })],
        })
      );
      const answer =
        !row.value || row.value === '—'
          ? 'Not filled yet — complete this in the form.'
          : row.value;
      for (const line of String(answer).split(/\n/)) {
        out.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: line || ' ',
                size: 22,
                italics: !row.value || row.value === '—',
                color: !row.value || row.value === '—' ? '9CA3AF' : '1F2937',
              }),
            ],
          })
        );
      }
    }
    for (const row of embeds) {
      if (row.embed === 'cmep-projections') {
        out.push(
          new Paragraph({
            spacing: { before: 160, after: 60 },
            children: [new TextRun({ text: 'Financial projections (Rs. In Lakhs)', bold: true, size: 20 })],
          })
        );
        out.push(cmepDocxTable(row.value));
        continue;
      }
      const plain = renderCmepEmbedHtml(row.embed || '', row.value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      out.push(
        new Paragraph({
          spacing: { before: 160, after: 60 },
          children: [new TextRun({ text: row.label, bold: true, size: 20 })],
        })
      );
      out.push(new Paragraph({ children: [new TextRun({ text: plain || '—', size: 20 })] }));
    }
    return out;
  };

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      text: 'DETAILED PROJECT REPORT',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ text: 'On', alignment: AlignmentType.CENTER }),
    new Paragraph({ text: doc.actionLine, alignment: AlignmentType.CENTER }),
    ...(doc.unitName && doc.unitName !== 'UNIT NAME'
      ? [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: doc.unitName.toUpperCase(), bold: true, color: '059669', size: 36 })],
      })]
      : []),
    new Paragraph({ text: doc.underLine, alignment: AlignmentType.CENTER }),
    ...(doc.district ? [new Paragraph({ text: `District: ${doc.district}` })] : []),
    ...(doc.location ? [new Paragraph({ text: `Location: ${doc.location}` })] : []),
    ...(doc.entrepreneurName
      ? [new Paragraph({ text: `Entrepreneur name: ${doc.entrepreneurName}` })]
      : []),
    new Paragraph({ text: '' }),
    new Paragraph({ text: 'Table of Contents', heading: HeadingLevel.HEADING_2 }),
  ];

  const shown = sectionsForReport(doc);
  shown.forEach((s, index) => {
    children.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: `${index + 1}. `, bold: true }),
          new TextRun({ text: s.title }),
        ],
      })
    );
  });

  shown.forEach((section, index) => {
    children.push(new Paragraph({ text: '' }));
    children.push(
      new Paragraph({
        text: `${index + 1}. ${section.title}`,
        heading: HeadingLevel.HEADING_2,
      })
    );
    children.push(...sectionBlocks(section.rows));
  });

  const word = new Document({
    sections: [{ footers: aiDisclaimerDocxFooters(), children }],
  });
  return Packer.toBuffer(word);
}

export function individualQaPlainText(doc: IndividualDocument): string {
  return sectionsForReport(doc)
    .map((s, index) => {
      const rows = s.rows.map((r) => `${r.label}: ${r.value}`).join('\n');
      return `${index + 1}. ${s.title}\n${rows}`;
    })
    .join('\n\n');
}

export function groupSectionsForQuality(doc: IndividualDocument): Record<string, string> {
  const buckets: Record<string, number[]> = {
    executiveSummary: [1],
    businessProfile: [2, 3, 4, 11],
    marketAnalysis: [5, 6, 8],
    technicalFeasibility: [7, 9, 10],
    financialProjections: [12, 13, 14, 15],
    conclusion: [16, 17, 18],
  };
  const out: Record<string, string> = {};
  for (const [key, steps] of Object.entries(buckets)) {
    const texts = doc.sections
      .filter((s) => steps.includes(s.contentStep) || (key === 'executiveSummary' && s.n === 1))
      .map((s) => s.rows.filter((r) => r.filled).map((r) => `${r.label}: ${r.value}`).join('\n'))
      .filter(Boolean);
    out[key] = texts.join('\n\n');
  }
  return out;
}

export function resolveCatalogJsonPath(): string {
  const candidates = [
    path.join(__dirname, 'individualDprCatalog.json'),
    path.join(process.cwd(), 'server/src/services/individualDprCatalog.json'),
    path.join(process.cwd(), 'src/services/individualDprCatalog.json'),
  ];
  return candidates.find((p) => fs.existsSync(p)) || candidates[0];
}
