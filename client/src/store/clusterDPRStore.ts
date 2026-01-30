// @ts-nocheck
import { create } from 'zustand';

export interface ClusterDPRData {
  // Step 1: Executive Summary
  step1?: {
    clusterName?: string;
    district?: string;
    location?: string;
    geographicalSpread?: string;
    natureOfBusiness?: string;
    majorProducts?: string;
    enterpriseCount?: {
      micro?: number;
      small?: number;
      medium?: number;
    };
    ageOfEnterprises?: {
      lessThan5?: number;
      between5And10?: number;
      moreThan10?: number;
    };
    employmentPerUnit?: {
      lessThan5?: number;
      between5And10?: number;
      moreThan10?: number;
    };
    investmentPerUnit?: number;
    turnoverPerUnit?: number;
    marketServed?: {
      domestic?: number;
      export?: number;
    };
  };
  
  // Step 2: Introduction & Sector Overview
  step2?: {
    sectorType?: string;
    sectorDescription?: string;
    nationalImportance?: string;
    stateLevelImportance?: string;
    keyProducts?: string[];
  };
  
  // Step 3: District & Regional Profile
  step3?: {
    geography?: string;
    climate?: string;
    infrastructure?: string;
    keyEconomicActivities?: string;
    rawMaterialAvailability?: string;
    rawMaterialQuantity?: string;
    industrialInfrastructure?: string;
    connectivity?: {
      road?: string;
      rail?: string;
      port?: string;
    };
  };
  
  // Step 4: Cluster Profile
  step4?: {
    yearOfEstablishment?: number;
    clusterEvolution?: string;
    presentActivities?: string;
    typeOfUnits?: string;
    productionCapacity?: string;
    technologyLevel?: string;
    stakeholders?: string[];
  };
  
  // Step 5: Value Chain Details
  step5?: {
    rawMaterials?: Array<{
      name?: string;
      source?: string;
    }>;
    intermediateProducts?: string[];
    finalProducts?: string[];
    valueAdditionStages?: Array<{
      stage?: string;
      sellingPrice?: number;
    }>;
    majorBuyers?: string[];
  };
  
  // Step 6: Market Assessment
  step6?: {
    existingDemand?: string;
    demandSupplyGap?: string;
    targetMarket?: string;
    competitorAnalysis?: string;
    priceTrends?: string;
    exportPotential?: string;
  };
  
  // Step 7: Gap Analysis
  step7?: {
    technologyGaps?: string;
    infrastructureGaps?: string;
    skillGaps?: string;
    marketingGaps?: string;
    financialGaps?: string;
    justificationForIntervention?: string;
  };
  
  // Step 8: SWOT Analysis
  step8?: {
    strengths?: string[];
    weaknesses?: string[];
    opportunities?: string[];
    threats?: string[];
  };
  
  // Step 9: Proposed Interventions
  step9?: {
    interventionType?: 'Hard' | 'Soft' | 'Both';
    description?: string;
    objectives?: string[];
    expectedBenefits?: string[];
  };
  
  // Step 10: Common Facility Centre (CFC) Details
  step10?: {
    name?: string;
    location?: string;
    landDetails?: string;
    civilWorks?: string;
    manufacturingProcess?: string;
    plantAndMachinery?: string;
    capacity?: string;
    powerRequirements?: string;
    waterRequirements?: string;
    manpowerRequirements?: string;
  };
  
  // Step 11: SPV Details
  step11?: {
    spvName?: string;
    legalStatus?: string;
    yearOfIncorporation?: number;
    objectives?: string[];
    rolesAndResponsibilities?: string[];
    boardOfDirectors?: Array<{
      name?: string;
      designation?: string;
    }>;
    shareholdingPattern?: Array<{
      stakeholder?: string;
      percentage?: number;
    }>;
    memberUnits?: Array<{
      name?: string;
      registration?: string;
    }>;
    statutoryRegistrations?: string[];
    submittedTo?: string;
  };
  
  // Step 12: Project Cost Details
  step12?: {
    land?: number;
    building?: number;
    machinery?: number;
    utilitiesAndInfrastructure?: number;
    preliminaryAndPreOperative?: number;
    workingCapitalMargin?: number;
    totalProjectCost?: number; // Auto-calculated
  };
  
  // Step 13: Means of Finance
  step13?: {
    spvContribution?: number;
    governmentGrant?: number;
    bankLoan?: number;
    otherSources?: number;
    total?: number; // Auto-calculated
  };
  
  // Step 14: Operating Cost & Revenue
  step14?: {
    rawMaterialCost?: number;
    powerCost?: number;
    wages?: number;
    maintenance?: number;
    administrativeExpenses?: number;
    marketingExpenses?: number;
    annualProductionVolume?: number;
    annualSalesRealization?: number;
  };
  
  // Step 15: Financial Viability
  step15?: {
    profitAndLossProjections?: Array<{
      year?: number;
      revenue?: number;
      expenses?: number;
      profit?: number;
    }>;
    cashFlowProjections?: Array<{
      year?: number;
      inflow?: number;
      outflow?: number;
      netCashFlow?: number;
    }>;
    balanceSheetProjections?: Array<{
      year?: number;
      assets?: number;
      liabilities?: number;
      equity?: number;
    }>;
    breakEvenPoint?: number;
    irr?: number;
    npv?: number;
    sensitivityAnalysis?: string;
  };
  
  // Step 16: Project Implementation Schedule
  step16?: {
    startDate?: string;
    milestones?: Array<{
      activity?: string;
      timeRequired?: string;
      startDate?: string;
      endDate?: string;
    }>;
    totalImplementationPeriod?: string;
  };
  
  // Step 17: Expected Impact
  step17?: {
    increaseInUnits?: number;
    employmentGeneration?: number;
    turnoverGrowth?: number;
    exportGrowth?: number;
    incomeEnhancement?: number;
    sustainabilityOutcomes?: string[];
  };
  
  // Step 18: Annexures & Document Uploads
  step18?: {
    spvRegistration?: File | string;
    landDocuments?: File | string;
    buildingEstimates?: File | string;
    machineryQuotations?: File | string;
    memberRegistrations?: File | string;
    supportingDocuments?: File[] | string[];
  };
  
  // Generated DPR content
  generatedDPR?: {
    coverPage?: string;
    tableOfContents?: string;
    sections?: Record<string, string>;
    visualizations?: Array<{
      type?: string;
      data?: any;
      imageUrl?: string;
    }>;
  };
  
  // Metadata
  currentStep?: number;
  isDraft?: boolean;
  lastSaved?: Date;
  dprId?: string;
  projectId?: string;
}

interface ClusterDPRState {
  data: ClusterDPRData;
  setStepData: (step: number, stepData: any) => void;
  getStepData: (step: number) => any;
  setGeneratedDPR: (dpr: any) => void;
  setCurrentStep: (step: number) => void;
  setDprIds: (dprId: string, projectId: string) => void;
  resetData: () => void;
  loadDataFromProject: (projectData: any, dprData?: any) => void;
}

const defaultData: ClusterDPRData = {
  currentStep: 1,
  isDraft: true,
  lastSaved: new Date(),
};

export const useClusterDPRStore = create<ClusterDPRState>()((set, get) => ({
  data: defaultData,
  
  setStepData: (step, stepData) => {
    set((state) => ({
      data: {
        ...state.data,
        [`step${step}`]: stepData,
        lastSaved: new Date(),
      },
    }));
  },
  
  getStepData: (step) => {
    const state = get();
    return state.data[`step${step}` as keyof ClusterDPRData] || {};
  },
  
  setGeneratedDPR: (dpr) => {
    set((state) => ({
      data: {
        ...state.data,
        generatedDPR: dpr,
        lastSaved: new Date(),
      },
    }));
  },
  
  setCurrentStep: (step) => {
    set((state) => ({
      data: {
        ...state.data,
        currentStep: step,
      },
    }));
  },
  
  setDprIds: (dprId, projectId) => {
    set((state) => ({
      data: {
        ...state.data,
        dprId,
        projectId,
      },
    }));
  },
  
  resetData: () => {
    set({ data: defaultData });
  },
  
  loadDataFromProject: (projectData: any, dprData?: any) => {
    if (!projectData) {
      console.warn('⚠️ No project data provided to loadDataFromProject');
      return;
    }
    
    // Load stepData from project - this is the source of truth for draft data
    const stepData = projectData.stepData || {};
    
    // Load data from DPR if available (takes precedence only if DPR exists and has data)
    const dprClusterData = dprData?.content?.english?.clusterData || 
                          dprData?.content?.telugu?.clusterData ||
                          dprData?.metadata?.clusterData;
    
    // Use DPR data if it exists and has content, otherwise use project stepData
    // This ensures we always load the most recent saved data from project.stepData when no DPR exists
    const clusterDataToLoad = (dprClusterData && Object.keys(dprClusterData).length > 0) 
      ? dprClusterData 
      : stepData;
    
    // Debug: Log what we're about to load
    console.log('📥 Preparing to load data:', {
      hasStepData: !!stepData && Object.keys(stepData).length > 0,
      hasDprClusterData: !!dprClusterData && Object.keys(dprClusterData).length > 0,
      stepDataKeys: Object.keys(stepData),
      clusterDataToLoadKeys: Object.keys(clusterDataToLoad),
      step1InStepData: stepData.step1,
      step1InClusterDataToLoad: clusterDataToLoad.step1,
      usingSource: (dprClusterData && Object.keys(dprClusterData).length > 0) ? 'DPR' : 'Project.stepData',
    });
    
    // Only proceed if we have data to load
    if (!clusterDataToLoad || Object.keys(clusterDataToLoad).length === 0) {
      console.warn('⚠️ No data to load - clusterDataToLoad is empty');
      return;
    }
    
    // Merge with existing data, preserving currentStep and other metadata
    const currentState = get();
    
    // Create a new object that properly preserves all nested structures
    // Directly spread clusterDataToLoad to preserve all nested objects (step1, step2, etc.)
    const loadedData: ClusterDPRData = {
      // Start with current state to preserve any unsaved changes
      ...currentState.data,
      // Directly spread clusterDataToLoad - this preserves all nested objects like step1.enterpriseCount
      ...clusterDataToLoad,
      // Override metadata fields to preserve current state or use loaded values
      currentStep: currentState.data.currentStep || clusterDataToLoad.currentStep || 1,
      dprId: dprData?._id || dprData?.id || currentState.data.dprId,
      projectId: projectData._id || projectData.id || currentState.data.projectId,
      lastSaved: new Date(),
    };
    
    set({ data: loadedData });
    console.log('✅ Loaded cluster DPR data from database:', {
      projectId: loadedData.projectId,
      dprId: loadedData.dprId,
      stepsLoaded: Object.keys(clusterDataToLoad).filter(k => k.startsWith('step')).length,
      step1Keys: loadedData.step1 ? Object.keys(loadedData.step1) : [],
      step1EnterpriseCount: loadedData.step1?.enterpriseCount,
      step1AgeOfEnterprises: loadedData.step1?.ageOfEnterprises,
      step1EmploymentPerUnit: loadedData.step1?.employmentPerUnit,
      step1InvestmentPerUnit: loadedData.step1?.investmentPerUnit,
      step1TurnoverPerUnit: loadedData.step1?.turnoverPerUnit,
      step1MarketServed: loadedData.step1?.marketServed,
      fullStep1Data: loadedData.step1,
    });
  },
}));
