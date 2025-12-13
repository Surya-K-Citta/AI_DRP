/**
 * Offline DPR Creation Service
 * Manages step-by-step conversational DPR creation in offline mode
 */

// @ts-nocheck

export interface DPRCreationStep {
  step: number;
  totalSteps: number;
  question: string;
  field: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  options?: string[];
  helpText?: string;
  examples?: string[];
  validation?: (value: string) => boolean;
  validationMessage?: string;
}

// Match the StepData structure from AI-Guided DPR Builder
export interface DPRCreationData {
  businessOverview?: {
    projectName?: string;
    industrySector?: string;
    projectType?: string;
    location?: string;
    businessDescription?: string;
  };
  applicantInfo?: {
    sponsoringAgency?: string;
    gender?: string;
    locationType?: string;
    categories?: string[];
    projectType?: string;
    legalStatus?: string;
  };
  buildingDetails?: Array<{
    particulars?: string;
    area?: string;
    rate?: string;
    amount?: string;
  }>;
  machineryDetails?: Array<{
    particulars?: string;
    qty?: string;
    rate?: string;
    amount?: string;
  }>;
  otherCapitalCosts?: {
    preliminaryCost?: string;
    furnitureFixtures?: string;
    contingency?: string;
    workingCapital?: string;
  };
  financing?: {
    ownContributionPercent?: string;
    bankFinancePercent?: string;
    marginMoneyPercent?: string;
    schemeName?: string;
  };
  salesDetails?: Array<{
    particulars?: string;
    rate?: string;
    quantity?: string;
    amount?: string;
  }>;
  rawMaterials?: Array<{
    particulars?: string;
    unit?: string;
    rate?: string;
    requiredUnit?: string;
    amount?: string;
  }>;
  wages?: Array<{
    particulars?: string;
    noOfWorkers?: string;
    wagesPerMonth?: string;
    amount?: string;
  }>;
  salaryDetails?: Array<{
    particulars?: string;
    noOfStaff?: string;
    wagesPerMonth?: string;
    amount?: string;
  }>;
  workingCapitalEstimate?: {
    stockInProcess?: string;
    finishedGoods?: string;
    receivables?: string;
  };
  powerEstimate?: {
    powerRequirement?: string;
    monthlyCost?: string;
  };
  overheadExpenses?: {
    repairMaintenance?: string;
    powerFuel?: string;
    otherOverhead?: string;
    telephone?: string;
    stationeryPostage?: string;
    advertisement?: string;
    buildingRent?: string;
    otherMiscellaneous?: string;
  };
  financialParameters?: {
    rateOfInterest?: string;
    depreciationBuilding?: string;
    depreciationMachinery?: string;
  };
  beneficiaryInfo?: {
    fullName?: string;
    fatherSpouseName?: string;
    address?: string;
    email?: string;
    mobile?: string;
    educationalQualifications?: string;
    experience?: string;
  };
  projectAtGlance?: {
    beneficiaryName?: string;
    constitution?: string;
    unitAddress?: string;
    talukBlock?: string;
    district?: string;
    pinCode?: string;
    email?: string;
    mobile?: string;
    products?: string;
  };
  marketAnalysis?: {
    targetMarket?: string;
    competitorAnalysis?: string;
  };
  costStructure?: {
    capex?: {
      landBuilding?: string;
      machinery?: string;
    };
    opex?: {
      rawMaterials?: string;
      salaries?: string;
    };
  };
  financialProjections?: {
    year1?: { revenue?: string; costs?: string; profit?: string };
    year2?: { revenue?: string; costs?: string; profit?: string };
    year3?: { revenue?: string; costs?: string; profit?: string };
    year4?: { revenue?: string; costs?: string; profit?: string };
    year5?: { revenue?: string; costs?: string; profit?: string };
  };
  eligibleSchemes?: {
    selectedSchemes?: string[];
  };
}

export interface DPRCreationSession {
  currentStep: number;
  totalSteps: number;
  data: DPRCreationData;
  startedAt: Date;
  lastUpdated: Date;
  isComplete: boolean;
}

// Map to AI-Guided DPR Builder steps structure
const DPR_CREATION_STEPS: DPRCreationStep[] = [
  {
    step: 1,
    totalSteps: 19,
    question: "What is your project name?",
    field: "businessOverview.projectName",
    type: "text",
    helpText: "Provide a clear, descriptive name for your project",
    examples: [
      "Organic Spice Processing Unit",
      "Handloom Textile Manufacturing",
      "Solar Panel Manufacturing Unit",
      "Rice Milling Unit",
      "Bakery and Confectionery"
    ],
    validation: (value: string) => value.length >= 3,
    validationMessage: "Project name should be at least 3 characters long"
  },
  {
    step: 2,
    totalSteps: 19,
    question: "What industry sector does your project belong to?",
    field: "businessOverview.industrySector",
    type: "select",
    options: [
      "Food Processing",
      "Textiles",
      "Manufacturing",
      "Service",
      "Renewable Energy",
      "Agriculture",
      "Healthcare",
      "Education",
      "Other"
    ],
    helpText: "Select the sector that best matches your primary business activity",
    examples: [
      "Food Processing - For spice processing, dairy, bakery, etc.",
      "Textiles - For handloom, garments, weaving",
      "Manufacturing - For electronics, engineering, chemicals"
    ]
  },
  {
    step: 3,
    totalSteps: 19,
    question: "What is your project type?",
    field: "businessOverview.projectType",
    type: "select",
    options: [
      "Individual",
      "Cluster",
      "Partnership",
      "Company"
    ],
    helpText: "Individual projects are owned by one person, Cluster projects involve multiple entrepreneurs",
    examples: [
      "Individual - Single owner business",
      "Cluster - Group of entrepreneurs in same sector",
      "Partnership - Multiple partners",
      "Company - Private limited or LLP"
    ]
  },
  {
    step: 4,
    totalSteps: 19,
    question: "Where is your project located?",
    field: "businessOverview.location",
    type: "text",
    helpText: "Provide the city, district, and state where you plan to set up the project",
    examples: [
      "Hyderabad, Telangana",
      "Vijayawada, Andhra Pradesh",
      "Warangal, Telangana",
      "Visakhapatnam, Andhra Pradesh"
    ],
    validation: (value: string) => value.includes(','),
    validationMessage: "Please include city and state (e.g., Hyderabad, Telangana)"
  },
  {
    step: 5,
    totalSteps: 19,
    question: "Can you describe your business in detail?",
    field: "businessOverview.businessDescription",
    type: "textarea",
    helpText: "Explain what your business does, products/services offered, production capacity, and unique selling points",
    examples: [
      "A modern organic spice processing unit that will process turmeric, red chili, and coriander with export quality standards. We will source from certified organic farmers and target both domestic retail chains and international markets.",
      "Traditional handloom textile manufacturing producing cotton sarees and fabrics with modern design integration, employing skilled weavers and targeting online platforms and export markets."
    ],
    validation: (value: string) => value.length >= 50,
    validationMessage: "Please provide a detailed description (at least 50 characters)"
  },
  {
    step: 6,
    totalSteps: 19,
    question: "Who are your target customers and what is your market reach?",
    field: "marketAnalysis.targetMarket",
    type: "textarea",
    helpText: "Describe your primary customers, geographic markets (domestic/export), distribution channels, and market size",
    examples: [
      "Primary customers: Retail chains, supermarkets, online platforms like Amazon and Flipkart. Markets: 70% domestic (South India), 30% export (Middle East and Europe). Distribution through wholesalers, direct retail, and e-commerce.",
      "Target customers: Fashion-conscious women aged 25-45, NRI market. Geographic reach: Pan-India online sales, export to USA, UK, Singapore. Distribution through own e-commerce site and marketplaces."
    ],
    validation: (value: string) => value.length >= 40,
    validationMessage: "Please describe your target market in detail (at least 40 characters)"
  },
  {
    step: 7,
    totalSteps: 19,
    question: "What is the total investment for your project (CAPEX - Land & Building)?",
    field: "costStructure.capex.landBuilding",
    type: "number",
    helpText: "Enter the cost for land and building",
    examples: [
      "₹5,00,000 (5 lakhs)",
      "₹10,00,000 (10 lakhs)",
      "₹15,00,000 (15 lakhs)"
    ],
    validation: (value: string) => {
      const num = parseFloat(value.replace(/[₹,\s]/g, ''));
      return !isNaN(num) && num >= 0;
    },
    validationMessage: "Please enter a valid amount"
  },
  {
    step: 8,
    totalSteps: 19,
    question: "What is the total investment for machinery and equipment (CAPEX - Machinery)?",
    field: "costStructure.capex.machinery",
    type: "number",
    helpText: "Enter the total cost for all machinery and equipment",
    examples: [
      "₹10,00,000 (10 lakhs)",
      "₹25,00,000 (25 lakhs)",
      "₹50,00,000 (50 lakhs)"
    ],
    validation: (value: string) => {
      const num = parseFloat(value.replace(/[₹,\s]/g, ''));
      return !isNaN(num) && num >= 0;
    },
    validationMessage: "Please enter a valid amount"
  },
  {
    step: 9,
    totalSteps: 19,
    question: "What are your monthly raw materials costs (OPEX)?",
    field: "costStructure.opex.rawMaterials",
    type: "number",
    helpText: "Enter the monthly cost for raw materials",
    examples: [
      "₹50,000/month",
      "₹1,00,000/month",
      "₹2,00,000/month"
    ],
    validation: (value: string) => {
      const num = parseFloat(value.replace(/[₹,\s]/g, ''));
      return !isNaN(num) && num >= 0;
    },
    validationMessage: "Please enter a valid amount"
  },
  {
    step: 10,
    totalSteps: 19,
    question: "What are your monthly salaries/wages costs (OPEX)?",
    field: "costStructure.opex.salaries",
    type: "number",
    helpText: "Enter the total monthly cost for salaries and wages",
    examples: [
      "₹80,000/month",
      "₹1,50,000/month",
      "₹3,00,000/month"
    ],
    validation: (value: string) => {
      const num = parseFloat(value.replace(/[₹,\s]/g, ''));
      return !isNaN(num) && num >= 0;
    },
    validationMessage: "Please enter a valid amount"
  },
  {
    step: 11,
    totalSteps: 19,
    question: "What is your sponsoring agency preference?",
    field: "applicantInfo.sponsoringAgency",
    type: "select",
    options: ["KVIC", "KVIB", "DIC", "COIR Board"],
    helpText: "Select your preferred sponsoring agency",
    examples: ["KVIC - Khadi and Village Industries Commission", "KVIB - Khadi and Village Industries Board"]
  },
  {
    step: 12,
    totalSteps: 19,
    question: "What is your gender?",
    field: "applicantInfo.gender",
    type: "select",
    options: ["Male", "Female", "Transgender"],
    helpText: "Select your gender"
  },
  {
    step: 13,
    totalSteps: 19,
    question: "What is your location type?",
    field: "applicantInfo.locationType",
    type: "select",
    options: ["Rural", "Urban"],
    helpText: "Select whether your project is in a rural or urban area"
  },
  {
    step: 14,
    totalSteps: 19,
    question: "What is your category? (Select all that apply, comma-separated)",
    field: "applicantInfo.categories",
    type: "text",
    helpText: "Enter categories like SC, ST, OBC, PHC, Ex-Serviceman, Minority, etc. (comma-separated)",
    examples: ["OBC", "SC, OBC", "ST", "PHC"]
  },
  {
    step: 15,
    totalSteps: 19,
    question: "What is your full name?",
    field: "beneficiaryInfo.fullName",
    type: "text",
    helpText: "Enter your full name as per official documents",
    validation: (value: string) => value.length >= 3,
    validationMessage: "Please enter a valid name"
  },
  {
    step: 16,
    totalSteps: 19,
    question: "What is your email address?",
    field: "beneficiaryInfo.email",
    type: "text",
    helpText: "Enter your email address",
    validation: (value: string) => value.includes('@') && value.includes('.'),
    validationMessage: "Please enter a valid email address"
  },
  {
    step: 17,
    totalSteps: 19,
    question: "What is your mobile number?",
    field: "beneficiaryInfo.mobile",
    type: "text",
    helpText: "Enter your 10-digit mobile number",
    examples: ["9876543210", "+91 9876543210"],
    validation: (value: string) => {
      const digits = value.replace(/\D/g, '');
      return digits.length >= 10;
    },
    validationMessage: "Please enter a valid 10-digit mobile number"
  },
  {
    step: 18,
    totalSteps: 19,
    question: "What is your complete address?",
    field: "beneficiaryInfo.address",
    type: "textarea",
    helpText: "Enter your complete address including street, city, district, state, and PIN code",
    examples: ["123 Main Street, Hyderabad, Telangana - 500001"],
    validation: (value: string) => value.length >= 20,
    validationMessage: "Please provide a complete address"
  },
  {
    step: 19,
    totalSteps: 19,
    question: "What are your educational qualifications and experience?",
    field: "beneficiaryInfo.experience",
    type: "textarea",
    helpText: "Describe your educational background and relevant work experience",
    examples: [
      "B.Tech in Mechanical Engineering, 5 years experience in manufacturing",
      "MBA in Finance, 3 years experience in business management"
    ],
    validation: (value: string) => value.length >= 20,
    validationMessage: "Please provide your qualifications and experience"
  }
];

// Local storage key for DPR creation session
const STORAGE_KEY = 'offline-dpr-creation-session';

/**
 * Offline DPR Creation Manager
 */
export class OfflineDPRCreationService {
  private static session: DPRCreationSession | null = null;

  /**
   * Initialize or resume a DPR creation session
   */
  static initSession(): DPRCreationSession {
    // Try to load existing session
    const savedSession = this.loadSession();
    if (savedSession && !savedSession.isComplete) {
      this.session = savedSession;
      console.log('📋 Resumed DPR creation session at step', savedSession.currentStep);
      return savedSession;
    }

    // Create new session
    this.session = {
      currentStep: 1,
      totalSteps: DPR_CREATION_STEPS.length,
      data: {},
      startedAt: new Date(),
      lastUpdated: new Date(),
      isComplete: false
    };
    
    this.saveSession();
    console.log('📋 Started new DPR creation session');
    return this.session;
  }

  /**
   * Get current session
   */
  static getSession(): DPRCreationSession | null {
    if (!this.session) {
      const saved = this.loadSession();
      if (saved && !saved.isComplete) {
        this.session = saved;
      }
    }
    return this.session;
  }

  /**
   * Get current step
   */
  static getCurrentStep(): DPRCreationStep | null {
    const session = this.getSession();
    if (!session) return null;
    
    return DPR_CREATION_STEPS.find(step => step.step === session.currentStep) || null;
  }

  /**
   * Get step by number
   */
  static getStepByNumber(stepNumber: number): DPRCreationStep | null {
    return DPR_CREATION_STEPS.find(step => step.step === stepNumber) || null;
  }

  /**
   * Submit answer for current step
   */
  static submitAnswer(answer: string): {
    success: boolean;
    message: string;
    nextStep?: DPRCreationStep;
    isComplete?: boolean;
    data?: DPRCreationData;
  } {
    const session = this.getSession();
    if (!session) {
      return {
        success: false,
        message: "No active DPR creation session. Please start a new one."
      };
    }

    const currentStep = this.getCurrentStep();
    if (!currentStep) {
      return {
        success: false,
        message: "Invalid step"
      };
    }

    // Validate answer
    if (currentStep.validation && !currentStep.validation(answer)) {
      return {
        success: false,
        message: currentStep.validationMessage || "Invalid input. Please try again."
      };
    }

    // Store the answer - handle nested field paths (e.g., "businessOverview.projectName" or "costStructure.capex.landBuilding")
    const fieldPath = currentStep.field.split('.');
    
    // Navigate/create nested structure
    let target: any = session.data;
    for (let i = 0; i < fieldPath.length - 1; i++) {
      const key = fieldPath[i];
      if (!target[key]) {
        target[key] = {};
      }
      target = target[key];
    }
    
    // Set the final value
    const finalKey = fieldPath[fieldPath.length - 1];
    if (currentStep.type === 'number') {
      const numValue = parseFloat(answer.replace(/[₹,\s]/g, ''));
      target[finalKey] = numValue.toString();
    } else if (finalKey === 'categories' && answer.includes(',')) {
      // Handle comma-separated categories
      target[finalKey] = answer.split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0);
    } else {
      target[finalKey] = answer;
    }

    // Move to next step
    session.currentStep++;
    session.lastUpdated = new Date();

    // Check if completed
    if (session.currentStep > session.totalSteps) {
      session.isComplete = true;
      this.saveSession();
      return {
        success: true,
        message: "DPR creation completed! All information has been collected.",
        isComplete: true,
        data: session.data
      };
    }

    this.saveSession();
    const nextStep = this.getCurrentStep();
    
    return {
      success: true,
      message: "Answer saved successfully",
      nextStep: nextStep || undefined
    };
  }

  /**
   * Get formatted question for current step
   */
  static getFormattedQuestion(): string {
    const step = this.getCurrentStep();
    if (!step) return "";

    let formatted = `**Question ${step.step} of ${step.totalSteps}:**\n\n`;
    formatted += `**${step.question}**\n\n`;
    
    if (step.helpText) {
      formatted += `${step.helpText}\n\n`;
    }

    if (step.options) {
      formatted += `**Options:**\n`;
      step.options.forEach(opt => {
        formatted += `- ${opt}\n`;
      });
      formatted += '\n';
    }

    if (step.examples && step.examples.length > 0) {
      formatted += `**Examples:**\n`;
      step.examples.forEach(ex => {
        formatted += `- ${ex}\n`;
      });
      formatted += '\n';
    }

    formatted += `💡 Tip: ${step.type === 'textarea' ? 'Provide detailed information' : 'Be clear and specific'}`;
    
    return formatted;
  }

  /**
   * Get progress percentage
   */
  static getProgress(): number {
    const session = this.getSession();
    if (!session) return 0;
    return Math.round(((session.currentStep - 1) / session.totalSteps) * 100);
  }

  /**
   * Reset session
   */
  static resetSession(): void {
    this.session = null;
    localStorage.removeItem(STORAGE_KEY);
    console.log('📋 DPR creation session reset');
  }

  /**
   * Save session to localStorage
   */
  private static saveSession(): void {
    if (this.session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.session));
    }
  }

  /**
   * Load session from localStorage
   */
  private static loadSession(): DPRCreationSession | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const session = JSON.parse(saved);
        // Convert date strings back to Date objects
        session.startedAt = new Date(session.startedAt);
        session.lastUpdated = new Date(session.lastUpdated);
        return session;
      }
    } catch (error) {
      console.error('Failed to load DPR creation session:', error);
    }
    return null;
  }

  /**
   * Get collected data summary
   */
  static getDataSummary(): string {
    const session = this.getSession();
    if (!session || !session.data) return "No data collected yet.";

    let summary = "**DPR Information Collected:**\n\n";
    
    const bo = session.data.businessOverview || {};
    const cs = session.data.costStructure || {};
    const ma = session.data.marketAnalysis || {};
    
    if (bo.projectName) {
      summary += `📌 **Project Name:** ${bo.projectName}\n`;
    }
    if (bo.industrySector) {
      summary += `🏭 **Industry:** ${bo.industrySector}\n`;
    }
    if (bo.projectType) {
      summary += `📋 **Type:** ${bo.projectType}\n`;
    }
    if (cs.capex?.landBuilding || cs.capex?.machinery) {
      const landBuilding = parseFloat(cs.capex?.landBuilding || '0');
      const machinery = parseFloat(cs.capex?.machinery || '0');
      const totalInvestment = landBuilding + machinery;
      if (totalInvestment > 0) {
        summary += `💰 **Investment:** ₹${totalInvestment.toLocaleString('en-IN')} (₹${(totalInvestment/100000).toFixed(2)} lakhs)\n`;
      }
    }
    if (bo.location) {
      summary += `📍 **Location:** ${bo.location}\n`;
    }
    if (ma.targetMarket) {
      summary += `🎯 **Target Market:** ${ma.targetMarket.substring(0, 50)}...\n`;
    }

    summary += `\n📊 **Progress:** ${this.getProgress()}% complete (${session.currentStep - 1}/${session.totalSteps} questions answered)`;

    return summary;
  }

  /**
   * Check if user message is trying to create DPR
   */
  static isDPRCreationIntent(message: string): boolean {
    const lowerMessage = message.toLowerCase().trim();
    
    const dprKeywords = [
      'how to create dpr',
      'how do i create dpr',
      'how can i create dpr',
      'create a dpr',
      'create dpr',
      'make a dpr',
      'make dpr',
      'start dpr',
      'begin dpr',
      'generate dpr',
      'i want to create a dpr',
      'i want to create dpr',
      'help me create dpr',
      'guide me to create dpr'
    ];

    return dprKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Check if session is in progress
   */
  static hasActiveSession(): boolean {
    const session = this.getSession();
    return session !== null && !session.isComplete;
  }

  /**
   * Generate final DPR document using the same structure as AI-Guided DPR Builder
   */
  static generateOfflineDPR(): {
    stepData: DPRCreationData; // Same structure as AI-Guided DPR Builder StepData
    projectData: any;
    message: string;
  } {
    const session = this.getSession();
    if (!session || !session.isComplete) {
      throw new Error("DPR creation not complete");
    }

    // Use the stepData structure directly (matches AI-Guided DPR Builder)
    const stepData = session.data;

    // Calculate total investment from cost structure
    const landBuilding = parseFloat(stepData.costStructure?.capex?.landBuilding || '0');
    const machinery = parseFloat(stepData.costStructure?.capex?.machinery || '0');
    const totalInvestment = landBuilding + machinery;

    const ownContribution = Math.round(totalInvestment * 0.25);
    const loanAmount = totalInvestment - ownContribution;

    // Create project data structure compatible with API
    const projectData = {
      projectName: stepData.businessOverview?.projectName,
      projectType: stepData.businessOverview?.projectType?.toLowerCase() || 'individual',
      industrySector: stepData.businessOverview?.industrySector,
      subSector: stepData.businessOverview?.industrySector,
      totalCost: totalInvestment,
      ownContribution: ownContribution,
      loanAmount: loanAmount,
      location: stepData.businessOverview?.location,
      status: 'draft',
      inputs: {
        businessDescription: stepData.businessOverview?.businessDescription || '',
        targetMarket: stepData.marketAnalysis?.targetMarket || '',
      },
      createdOffline: true,
      createdAt: new Date().toISOString(),
    };

    const message = `
✅ **DPR Created Successfully!**

Your project "${stepData.businessOverview?.projectName}" has been created with all the information you provided.

**Project Summary:**
- Industry: ${stepData.businessOverview?.industrySector}
- Type: ${stepData.businessOverview?.projectType}
- Investment: ₹${totalInvestment.toLocaleString('en-IN')}
- Location: ${stepData.businessOverview?.location}

**Financial Structure:**
- Own Contribution (25%): ₹${ownContribution.toLocaleString('en-IN')}
- Loan Amount (75%): ₹${loanAmount.toLocaleString('en-IN')}

**Next Steps:**
1. Navigate to AI-Guided DPR Builder to continue filling remaining details
2. Generate a complete DPR document
3. Get quality score and recommendations
4. Check scheme eligibility

**Note:**
Your DPR data has been saved in the same structure as the AI-Guided DPR Builder. You can continue editing in the builder interface.
    `.trim();

    return { stepData, projectData, message };
  }
}

// Export types and constants
export { DPR_CREATION_STEPS };

