// @ts-nocheck
/**
 * Mapping of each step to its actual form fields
 * Used to generate field-specific AI suggestions
 */
export const STEP_FIELDS_MAPPING: Record<number, { stepName: string; fields: Array<{ name: string; type: string; label: string; sampleValue?: string }> }> = {
  1: {
    stepName: 'Executive Summary - Basic Cluster Details',
    fields: [
      // Fields that should be suggested (below AI component)
      { name: 'enterpriseCount', type: 'object', label: 'Enterprise Count', sampleValue: '{"micro": 0, "small": 0, "medium": 0}' },
      { name: 'ageOfEnterprises', type: 'object', label: 'Age of Enterprises', sampleValue: '{"lessThan5": 0, "between5And10": 0, "moreThan10": 0}' },
      { name: 'employmentPerUnit', type: 'object', label: 'Employment per Unit', sampleValue: '{"lessThan5": 0, "between5And10": 0, "moreThan10": 0}' },
      { name: 'investmentPerUnit', type: 'number', label: 'Investment per Unit (₹ Lakhs)' },
      { name: 'turnoverPerUnit', type: 'number', label: 'Turnover per Unit (₹ Lakhs)' },
      { name: 'marketServed', type: 'object', label: 'Market Served (%)', sampleValue: '{"domestic": 0, "export": 0}' },
    ],
  },
  2: {
    stepName: 'Introduction & Sector Overview',
    fields: [
      { name: 'sectorType', type: 'text', label: 'Sector / Industry Type' },
      { name: 'sectorDescription', type: 'text', label: 'Sector Description' },
      { name: 'nationalImportance', type: 'text', label: 'National Importance' },
      { name: 'stateLevelImportance', type: 'text', label: 'State-level Importance' },
      { name: 'keyProducts', type: 'array', label: 'Key Products', sampleValue: '["Product A", "Product B"]' },
    ],
  },
  3: {
    stepName: 'District & Regional Profile',
    fields: [
      { name: 'geography', type: 'text', label: 'Geography' },
      { name: 'climate', type: 'shortText', label: 'Climate', sampleValue: 'Tropical with 800mm annual rainfall' },
      { name: 'infrastructure', type: 'text', label: 'Infrastructure' },
      { name: 'keyEconomicActivities', type: 'text', label: 'Key Economic Activities' },
      { name: 'rawMaterialAvailability', type: 'text', label: 'Raw Material Availability' },
      { name: 'rawMaterialQuantity', type: 'shortText', label: 'Raw Material Quantity', sampleValue: '500,000 Metric Tonnes per annum' },
      { name: 'industrialInfrastructure', type: 'text', label: 'Industrial Infrastructure' },
      { name: 'connectivity', type: 'object', label: 'Connectivity', sampleValue: '{"road": "...", "rail": "...", "port": "..."}' },
    ],
  },
  4: {
    stepName: 'Cluster Profile',
    fields: [
      { name: 'yearOfEstablishment', type: 'number', label: 'Year of Establishment' },
      { name: 'clusterEvolution', type: 'text', label: 'Cluster Evolution' },
      { name: 'presentActivities', type: 'text', label: 'Present Activities' },
      { name: 'typeOfUnits', type: 'text', label: 'Type of Units' },
      { name: 'productionCapacity', type: 'text', label: 'Production Capacity' },
      { name: 'technologyLevel', type: 'text', label: 'Technology Level' },
      { name: 'stakeholders', type: 'array', label: 'Stakeholders', sampleValue: '["Stakeholder 1", "Stakeholder 2"]' },
    ],
  },
  5: {
    stepName: 'Value Chain Details',
    fields: [
      { name: 'rawMaterials', type: 'array', label: 'Raw Materials', sampleValue: '[{"name": "...", "source": "..."}]' },
      { name: 'intermediateProducts', type: 'array', label: 'Intermediate Products', sampleValue: '["Product 1", "Product 2"]' },
      { name: 'finalProducts', type: 'array', label: 'Final Products', sampleValue: '["Product 1", "Product 2"]' },
      { name: 'valueAdditionStages', type: 'array', label: 'Value Addition Stages', sampleValue: '[{"stage": "...", "sellingPrice": 0}]' },
      { name: 'majorBuyers', type: 'array', label: 'Major Buyers', sampleValue: '["Buyer 1", "Buyer 2"]' },
    ],
  },
  6: {
    stepName: 'Market Assessment',
    fields: [
      { name: 'existingDemand', type: 'text', label: 'Existing Demand' },
      { name: 'demandSupplyGap', type: 'text', label: 'Demand Supply Gap' },
      { name: 'targetMarket', type: 'text', label: 'Target Market' },
      { name: 'competitorAnalysis', type: 'text', label: 'Competitor Analysis' },
      { name: 'priceTrends', type: 'text', label: 'Price Trends' },
      { name: 'exportPotential', type: 'text', label: 'Export Potential' },
    ],
  },
  7: {
    stepName: 'Gap Analysis',
    fields: [
      { name: 'technologyGaps', type: 'text', label: 'Technology Gaps' },
      { name: 'infrastructureGaps', type: 'text', label: 'Infrastructure Gaps' },
      { name: 'skillGaps', type: 'text', label: 'Skill Gaps' },
      { name: 'marketingGaps', type: 'text', label: 'Marketing Gaps' },
      { name: 'financialGaps', type: 'text', label: 'Financial Gaps' },
      { name: 'justificationForIntervention', type: 'text', label: 'Justification for Intervention' },
    ],
  },
  8: {
    stepName: 'SWOT Analysis',
    fields: [
      { name: 'strengths', type: 'array', label: 'Strengths', sampleValue: '["Strength 1", "Strength 2"]' },
      { name: 'weaknesses', type: 'array', label: 'Weaknesses', sampleValue: '["Weakness 1", "Weakness 2"]' },
      { name: 'opportunities', type: 'array', label: 'Opportunities', sampleValue: '["Opportunity 1", "Opportunity 2"]' },
      { name: 'threats', type: 'array', label: 'Threats', sampleValue: '["Threat 1", "Threat 2"]' },
    ],
  },
  9: {
    stepName: 'Proposed Interventions',
    fields: [
      { name: 'interventionType', type: 'text', label: 'Intervention Type' },
      { name: 'description', type: 'text', label: 'Description' },
      { name: 'objectives', type: 'array', label: 'Objectives', sampleValue: '["Objective 1", "Objective 2"]' },
      { name: 'expectedBenefits', type: 'array', label: 'Expected Benefits', sampleValue: '["Benefit 1", "Benefit 2"]' },
    ],
  },
  10: {
    stepName: 'Common Facility Centre (CFC) Details',
    fields: [
      { name: 'name', type: 'text', label: 'Name' },
      { name: 'location', type: 'text', label: 'Location' },
      { name: 'landDetails', type: 'text', label: 'Land Details' },
      { name: 'civilWorks', type: 'text', label: 'Civil Works' },
      { name: 'manufacturingProcess', type: 'text', label: 'Manufacturing Process' },
      { name: 'plantAndMachinery', type: 'text', label: 'Plant and Machinery' },
      { name: 'capacity', type: 'text', label: 'Capacity' },
      { name: 'powerRequirements', type: 'text', label: 'Power Requirements' },
      { name: 'waterRequirements', type: 'text', label: 'Water Requirements' },
      { name: 'manpowerRequirements', type: 'text', label: 'Manpower Requirements' },
    ],
  },
  11: {
    stepName: 'SPV Details',
    fields: [
      { name: 'spvName', type: 'text', label: 'SPV Name' },
      { name: 'legalStatus', type: 'text', label: 'Legal Status' },
      { name: 'yearOfIncorporation', type: 'number', label: 'Year of Incorporation' },
      { name: 'objectives', type: 'array', label: 'Objectives', sampleValue: '["Objective 1", "Objective 2"]' },
      { name: 'rolesAndResponsibilities', type: 'array', label: 'Roles and Responsibilities', sampleValue: '["Role 1", "Role 2"]' },
      { name: 'boardOfDirectors', type: 'array', label: 'Board of Directors', sampleValue: '[{"name": "...", "designation": "..."}]' },
      { name: 'shareholdingPattern', type: 'array', label: 'Shareholding Pattern', sampleValue: '[{"stakeholder": "...", "percentage": 0}]' },
      { name: 'memberUnits', type: 'array', label: 'Member Units', sampleValue: '[{"name": "...", "registration": "..."}]' },
      { name: 'statutoryRegistrations', type: 'array', label: 'Statutory Registrations', sampleValue: '["Registration 1", "Registration 2"]' },
      { name: 'submittedTo', type: 'text', label: 'Submitted To' },
    ],
  },
  12: {
    stepName: 'Project Cost Details',
    fields: [
      { name: 'land', type: 'number', label: 'Land' },
      { name: 'building', type: 'number', label: 'Building' },
      { name: 'machinery', type: 'number', label: 'Machinery' },
      { name: 'utilitiesAndInfrastructure', type: 'number', label: 'Utilities and Infrastructure' },
      { name: 'preliminaryAndPreOperative', type: 'number', label: 'Preliminary and Pre-Operative' },
      { name: 'workingCapitalMargin', type: 'number', label: 'Working Capital Margin' },
    ],
  },
  13: {
    stepName: 'Means of Finance',
    fields: [
      { name: 'spvContribution', type: 'number', label: 'SPV Contribution' },
      { name: 'governmentGrant', type: 'number', label: 'Government Grant' },
      { name: 'bankLoan', type: 'number', label: 'Bank Loan' },
      { name: 'otherSources', type: 'number', label: 'Other Sources' },
    ],
  },
  14: {
    stepName: 'Operating Cost & Revenue',
    fields: [
      { name: 'rawMaterialCost', type: 'number', label: 'Raw Material Cost' },
      { name: 'powerCost', type: 'number', label: 'Power Cost' },
      { name: 'wages', type: 'number', label: 'Wages' },
      { name: 'maintenance', type: 'number', label: 'Maintenance' },
      { name: 'administrativeExpenses', type: 'number', label: 'Administrative Expenses' },
      { name: 'marketingExpenses', type: 'number', label: 'Marketing Expenses' },
      { name: 'annualProductionVolume', type: 'number', label: 'Annual Production Volume' },
      { name: 'annualSalesRealization', type: 'number', label: 'Annual Sales Realization' },
    ],
  },
  15: {
    stepName: 'Financial Viability',
    fields: [
      { name: 'profitAndLossProjections', type: 'array', label: 'Profit and Loss Projections', sampleValue: '[{"year": 0, "revenue": 0, "expenses": 0, "profit": 0}]' },
      { name: 'cashFlowProjections', type: 'array', label: 'Cash Flow Projections', sampleValue: '[{"year": 0, "inflow": 0, "outflow": 0, "netCashFlow": 0}]' },
      { name: 'balanceSheetProjections', type: 'array', label: 'Balance Sheet Projections', sampleValue: '[{"year": 0, "assets": 0, "liabilities": 0, "equity": 0}]' },
      { name: 'breakEvenPoint', type: 'number', label: 'Break Even Point' },
      { name: 'irr', type: 'number', label: 'IRR' },
      { name: 'npv', type: 'number', label: 'NPV' },
      { name: 'sensitivityAnalysis', type: 'text', label: 'Sensitivity Analysis' },
    ],
  },
  16: {
    stepName: 'Project Implementation Schedule',
    fields: [
      { name: 'startDate', type: 'text', label: 'Start Date' },
      { name: 'milestones', type: 'array', label: 'Milestones', sampleValue: '[{"activity": "...", "timeRequired": "...", "startDate": "...", "endDate": "..."}]' },
      { name: 'totalImplementationPeriod', type: 'text', label: 'Total Implementation Period' },
    ],
  },
  17: {
    stepName: 'Expected Impact',
    fields: [
      { name: 'increaseInUnits', type: 'number', label: 'Increase in Units' },
      { name: 'employmentGeneration', type: 'number', label: 'Employment Generation' },
      { name: 'turnoverGrowth', type: 'number', label: 'Turnover Growth' },
      { name: 'exportGrowth', type: 'number', label: 'Export Growth' },
      { name: 'incomeEnhancement', type: 'number', label: 'Income Enhancement' },
      { name: 'sustainabilityOutcomes', type: 'array', label: 'Sustainability Outcomes', sampleValue: '["Outcome 1", "Outcome 2"]' },
    ],
  },
  18: {
    stepName: 'Annexures & Document Uploads',
    fields: [
      { name: 'spvRegistration', type: 'text', label: 'SPV Registration' },
      { name: 'landDocuments', type: 'text', label: 'Land Documents' },
      { name: 'buildingEstimates', type: 'text', label: 'Building Estimates' },
      { name: 'machineryQuotations', type: 'text', label: 'Machinery Quotations' },
      { name: 'memberRegistrations', type: 'text', label: 'Member Registrations' },
      { name: 'supportingDocuments', type: 'array', label: 'Supporting Documents', sampleValue: '["Document 1", "Document 2"]' },
    ],
  },
};

/** Fields that exist on the individual Latest DPR form (not cluster grids / SPV / CFC). */
export const INDIVIDUAL_STEP_FIELDS_MAPPING: Record<number, { stepName: string; fields: Array<{ name: string; type: string; label: string; sampleValue?: string }> }> = {
  1: {
    stepName: 'Your unit – basic details',
    fields: [
      { name: 'natureOfBusiness', type: 'shortText', label: 'Nature of Business' },
      { name: 'majorProducts', type: 'text', label: 'Major Products (specific goods, not a repeat of the sector name)' },
    ],
  },
  2: {
    stepName: 'Sector overview for this unit',
    fields: STEP_FIELDS_MAPPING[2].fields,
  },
  3: {
    stepName: 'District & location of this unit',
    fields: STEP_FIELDS_MAPPING[3].fields,
  },
  4: {
    stepName: 'Your unit profile',
    fields: [
      { name: 'yearOfEstablishment', type: 'number', label: 'Year of Establishment' },
      { name: 'clusterEvolution', type: 'text', label: 'How this unit evolved' },
      { name: 'presentActivities', type: 'text', label: 'Present Activities' },
      { name: 'typeOfUnits', type: 'text', label: 'Type of unit' },
      { name: 'productionCapacity', type: 'text', label: 'Production Capacity' },
      { name: 'technologyLevel', type: 'text', label: 'Technology Level' },
      { name: 'stakeholders', type: 'array', label: 'Stakeholders', sampleValue: '["Stakeholder 1", "Stakeholder 2"]' },
    ],
  },
  5: STEP_FIELDS_MAPPING[5],
  6: STEP_FIELDS_MAPPING[6],
  7: STEP_FIELDS_MAPPING[7],
  8: STEP_FIELDS_MAPPING[8],
  9: {
    stepName: 'What you plan to do (this unit)',
    fields: STEP_FIELDS_MAPPING[9].fields,
  },
  10: {
    stepName: 'Workplace / shed / unit (not a CFC)',
    fields: STEP_FIELDS_MAPPING[10].fields,
  },
  11: {
    stepName: 'Applicant / firm',
    fields: [
      { name: 'spvName', type: 'text', label: 'Applicant / firm name' },
      { name: 'legalStatus', type: 'text', label: 'Legal Status' },
      { name: 'yearOfIncorporation', type: 'number', label: 'Year of establishment' },
      { name: 'objectives', type: 'array', label: 'Objectives', sampleValue: '["Objective 1", "Objective 2"]' },
      { name: 'boardOfDirectors', type: 'array', label: 'Owner(s)', sampleValue: '[{"name": "...", "designation": "Owner"}]' },
      { name: 'submittedTo', type: 'text', label: 'Submitted To' },
    ],
  },
  12: STEP_FIELDS_MAPPING[12],
  13: {
    stepName: 'Means of finance for this unit',
    fields: [
      { name: 'spvContribution', type: 'number', label: 'Promoter contribution / equity' },
      { name: 'governmentGrant', type: 'number', label: 'Government Grant' },
      { name: 'bankLoan', type: 'number', label: 'Bank Loan' },
      { name: 'otherSources', type: 'number', label: 'Other Sources' },
    ],
  },
  14: STEP_FIELDS_MAPPING[14],
  15: {
    stepName: 'Financial viability (simplified)',
    fields: [
      { name: 'yearProjections', type: 'array', label: '5-year sales / RM / wages / power / net profit', sampleValue: '[{"year":1,"sales":0,"rm":0,"wages":0,"power":0,"netProfit":0}]' },
      { name: 'breakEvenPoint', type: 'number', label: 'Break-even (capacity %)' },
    ],
  },
  16: {
    stepName: 'Implementation schedule',
    fields: [
      { name: 'startDate', type: 'text', label: 'Commercial production date' },
      { name: 'milestones', type: 'array', label: 'Milestones', sampleValue: '[{"activity":"Machinery order / installation","timeRequired":"","startDate":"","endDate":""}]' },
    ],
  },
  17: {
    stepName: 'Expected impact of this unit',
    fields: [
      { name: 'employmentGeneration', type: 'number', label: 'Direct employment (count)' },
      { name: 'turnoverGrowth', type: 'number', label: 'Expected annual turnover (₹ Lakhs)' },
    ],
  },
  18: {
    stepName: 'Document uploads',
    fields: [],
  },
};

export function getStepFieldsMapping(
  step: number,
  isIndividualDPR = false,
  schemeCode?: string | null
): { stepName: string; fields: Array<{ name: string; type: string; label: string; sampleValue?: string }> } | undefined {
  if (!isIndividualDPR) return STEP_FIELDS_MAPPING[step];
  const base = INDIVIDUAL_STEP_FIELDS_MAPPING[step];
  if (!base) return undefined;
  if (step !== 1) return base;
  const extras = getIndividualSchemeExtraFields(schemeCode);
  if (!extras.length) return base;
  return {
    stepName: base.stepName,
    fields: [...base.fields, ...extras],
  };
}

const VISHWAKARMA_CRAFT_OPTIONS =
  'Carpenter (Suthar); Boat Maker; Armourer; Blacksmith; Hammer and Tool Kit Maker; Locksmith; Sculptor; Stone breaker / Stone carver; Goldsmith; Potter; Sculptor (metal/stone/wood); Cobbler / Shoemaker; Mason; Basket/Mat/Broom Maker / Coir Weaver; Doll & Toy Maker; Barber; Garland Maker; Washerman; Tailor; Fishing Net Maker';

export function getIndividualSchemeExtraFields(
  schemeCode?: string | null
): Array<{ name: string; type: string; label: string; sampleValue?: string }> {
  if (schemeCode === 'VISHWAKARMA') {
    return [
      {
        name: 'craft',
        type: 'shortText',
        label: 'Craft / trade — MUST be copied exactly from this list: ' + VISHWAKARMA_CRAFT_OPTIONS,
      },
      { name: 'currentTools', type: 'text', label: 'Current tools the artisan uses today' },
      { name: 'newTools', type: 'text', label: 'New tools to buy with the ₹15,000 Vishwakarma voucher' },
    ];
  }
  if (schemeCode === 'SVANIDHI') {
    return [
      { name: 'covOrLor', type: 'shortText', label: 'Vending proof: reply only "cov" or "lor"' },
      { name: 'upiQr', type: 'shortText', label: 'UPI ID or QR details for the vendor' },
    ];
  }
  if (schemeCode === 'PMFME') {
    return [
      { name: 'fssai', type: 'shortText', label: 'FSSAI status: reply only "yes" or "planned"' },
    ];
  }
  if (schemeCode === 'AP_EDP') {
    return [
      { name: 'apiicPark', type: 'shortText', label: 'Is the unit inside an APIIC park? Reply only "yes" or "no"' },
    ];
  }
  return [];
}


