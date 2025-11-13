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

export interface DPRCreationData {
  projectName?: string;
  industrySector?: string;
  projectType?: string;
  totalInvestment?: number;
  location?: string;
  businessDescription?: string;
  targetMarket?: string;
  rawMaterials?: string;
  machinery?: string;
  manpower?: string;
  competitiveAdvantages?: string;
}

export interface DPRCreationSession {
  currentStep: number;
  totalSteps: number;
  data: DPRCreationData;
  startedAt: Date;
  lastUpdated: Date;
  isComplete: boolean;
}

const DPR_CREATION_STEPS: DPRCreationStep[] = [
  {
    step: 1,
    totalSteps: 10,
    question: "What is your project name?",
    field: "projectName",
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
    totalSteps: 10,
    question: "What industry sector does your project belong to?",
    field: "industrySector",
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
    totalSteps: 10,
    question: "What is your project type?",
    field: "projectType",
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
    totalSteps: 10,
    question: "What is the total investment for your project?",
    field: "totalInvestment",
    type: "number",
    helpText: "Enter the total project cost including land, building, machinery, working capital, etc.",
    examples: [
      "₹10,00,000 (10 lakhs)",
      "₹25,00,000 (25 lakhs)",
      "₹50,00,000 (50 lakhs)",
      "₹1,00,00,000 (1 crore)"
    ],
    validation: (value: string) => {
      const num = parseFloat(value.replace(/[₹,\s]/g, ''));
      return !isNaN(num) && num > 0;
    },
    validationMessage: "Please enter a valid positive amount"
  },
  {
    step: 5,
    totalSteps: 10,
    question: "Where is your project located?",
    field: "location",
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
    step: 6,
    totalSteps: 10,
    question: "Can you describe your business in detail?",
    field: "businessDescription",
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
    step: 7,
    totalSteps: 10,
    question: "Who are your target customers and what is your market reach?",
    field: "targetMarket",
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
    step: 8,
    totalSteps: 10,
    question: "What are the key raw materials you'll need?",
    field: "rawMaterials",
    type: "textarea",
    helpText: "List the main raw materials, their quantities, costs, and sources",
    examples: [
      "1. Organic Turmeric - 5000 kg/month at ₹120/kg from local organic farms\n2. Red Chili - 3000 kg/month at ₹150/kg from AP markets\n3. Coriander Seeds - 2000 kg/month at ₹80/kg from local suppliers\n4. Packaging Materials - ₹50,000/month",
      "1. Cotton Yarn - 1000 kg/month at ₹180/kg from mills\n2. Dyes and Chemicals - 500 kg/month at ₹250/kg\n3. Packaging - ₹20,000/month"
    ],
    validation: (value: string) => value.length >= 30,
    validationMessage: "Please list your raw materials (at least 30 characters)"
  },
  {
    step: 9,
    totalSteps: 10,
    question: "What machinery and equipment do you need?",
    field: "machinery",
    type: "textarea",
    helpText: "List the key machinery/equipment, their specifications, quantities, and costs",
    examples: [
      "1. Spice Grinding Machine - 2 units at ₹2,25,000 each = ₹4,50,000\n2. Packaging Machine - 1 unit at ₹2,50,000\n3. Quality Testing Equipment - 1 unit at ₹1,80,000\n4. Storage Racks and Utilities - ₹1,20,000\nTotal: ₹10,00,000",
      "1. Handloom Machines - 10 units at ₹60,000 each = ₹6,00,000\n2. Dyeing Unit - 1 unit at ₹2,00,000\n3. Finishing Equipment - ₹1,50,000\nTotal: ₹9,50,000"
    ],
    validation: (value: string) => value.length >= 30,
    validationMessage: "Please list your machinery requirements (at least 30 characters)"
  },
  {
    step: 10,
    totalSteps: 10,
    question: "What manpower do you need?",
    field: "manpower",
    type: "textarea",
    helpText: "List the key positions, number of employees, qualifications, and salaries",
    examples: [
      "1. Production Manager - 1 person at ₹35,000/month (BTech/MBA)\n2. Quality Control Officer - 1 person at ₹25,000/month (BSc)\n3. Machine Operators - 4 people at ₹18,000/month each (ITI/Diploma)\n4. Packaging Staff - 3 people at ₹15,000/month each (10th pass)\nTotal: 9 employees, Monthly: ₹1,62,000",
      "1. Master Weaver - 2 people at ₹30,000/month each\n2. Weavers - 8 people at ₹20,000/month each\n3. Designer - 1 person at ₹25,000/month\n4. Helper - 2 people at ₹12,000/month each\nTotal: 13 employees, Monthly: ₹2,69,000"
    ],
    validation: (value: string) => value.length >= 30,
    validationMessage: "Please list your manpower requirements (at least 30 characters)"
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

    // Store the answer
    const field = currentStep.field as keyof DPRCreationData;
    if (currentStep.type === 'number') {
      // Parse number (remove currency symbols and commas)
      const numValue = parseFloat(answer.replace(/[₹,\s]/g, ''));
      session.data[field] = numValue as any;
    } else {
      session.data[field] = answer as any;
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
    
    if (session.data.projectName) {
      summary += `📌 **Project Name:** ${session.data.projectName}\n`;
    }
    if (session.data.industrySector) {
      summary += `🏭 **Industry:** ${session.data.industrySector}\n`;
    }
    if (session.data.projectType) {
      summary += `📋 **Type:** ${session.data.projectType}\n`;
    }
    if (session.data.totalInvestment) {
      const amount = typeof session.data.totalInvestment === 'number' 
        ? session.data.totalInvestment 
        : parseFloat(session.data.totalInvestment.toString().replace(/[₹,\s]/g, ''));
      summary += `💰 **Investment:** ₹${amount.toLocaleString('en-IN')} (₹${(amount/100000).toFixed(2)} lakhs)\n`;
    }
    if (session.data.location) {
      summary += `📍 **Location:** ${session.data.location}\n`;
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
   * Generate final DPR document (simplified for offline mode)
   */
  static generateOfflineDPR(): {
    projectData: any;
    message: string;
  } {
    const session = this.getSession();
    if (!session || !session.isComplete) {
      throw new Error("DPR creation not complete");
    }

    // Create project data structure
    const investment = typeof session.data.totalInvestment === 'number'
      ? session.data.totalInvestment
      : parseFloat((session.data.totalInvestment || '0').toString().replace(/[₹,\s]/g, ''));

    const ownContribution = Math.round(investment * 0.25);
    const loanAmount = investment - ownContribution;

    const projectData = {
      projectName: session.data.projectName,
      projectType: session.data.projectType?.toLowerCase() || 'individual',
      industrySector: session.data.industrySector,
      subSector: session.data.industrySector,
      totalCost: investment,
      ownContribution: ownContribution,
      loanAmount: loanAmount,
      location: session.data.location,
      status: 'draft',
      inputs: {
        businessDescription: session.data.businessDescription,
        targetMarket: session.data.targetMarket,
        rawMaterials: session.data.rawMaterials,
        machinery: session.data.machinery,
        manpower: session.data.manpower,
      },
      createdOffline: true,
      createdAt: new Date().toISOString(),
    };

    const message = `
✅ **DPR Created Successfully in Offline Mode!**

Your project "${session.data.projectName}" has been created with all the information you provided.

**Project Summary:**
- Industry: ${session.data.industrySector}
- Type: ${session.data.projectType}
- Investment: ₹${investment.toLocaleString('en-IN')}
- Location: ${session.data.location}

**Financial Structure:**
- Own Contribution (25%): ₹${ownContribution.toLocaleString('en-IN')}
- Loan Amount (75%): ₹${loanAmount.toLocaleString('en-IN')}

**Next Steps:**
1. When you're back online, you can save this project
2. Generate a complete DPR document
3. Get quality score and recommendations
4. Check scheme eligibility

**Offline Mode Note:**
Your project data has been saved locally. It will be available when you reconnect to generate the full DPR document.

Would you like to:
- Create another DPR
- Review scheme information
- Learn about financial projections
    `.trim();

    return { projectData, message };
  }
}

// Export types and constants
export { DPR_CREATION_STEPS };

