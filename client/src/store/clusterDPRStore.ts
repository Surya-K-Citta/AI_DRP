// @ts-nocheck
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
}

interface ClusterDPRState {
  data: ClusterDPRData;
  setStepData: (step: number, stepData: any) => void;
  getStepData: (step: number) => any;
  setGeneratedDPR: (dpr: any) => void;
  setCurrentStep: (step: number) => void;
  resetData: () => void;
  saveDraft: () => void;
  loadDraft: (draft: ClusterDPRData) => void;
}

const defaultData: ClusterDPRData = {
  currentStep: 1,
  isDraft: true,
  lastSaved: new Date(),
};

export const useClusterDPRStore = create<ClusterDPRState>()(
  persist(
    (set, get) => ({
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
      
      resetData: () => {
        set({ data: defaultData });
      },
      
      saveDraft: () => {
        const state = get();
        localStorage.setItem('cluster-dpr-draft', JSON.stringify(state.data));
      },
      
      loadDraft: (draft) => {
        set({ data: draft });
      },
    }),
    {
      name: 'cluster-dpr-storage',
      partialize: (state) => ({ data: state.data }),
    }
  )
);
