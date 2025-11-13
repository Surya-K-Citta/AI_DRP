/**
 * Comprehensive Mock Data Service
 * Provides extensive mock data for offline/development use
 */

// Mock User Data
export const mockUsers = {
  currentUser: {
    userId: 'user_001',
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@example.com',
    role: 'user',
    phoneNumber: '+91 9876543210',
    location: 'Hyderabad, Telangana',
    udyamNumber: 'UDYAM-TG-01-0001234',
    createdAt: new Date('2024-01-15').toISOString(),
  },
  adminUser: {
    userId: 'admin_001',
    name: 'Admin User',
    email: 'admin@apmsme.gov.in',
    role: 'admin',
    phoneNumber: '+91 9876543211',
    location: 'Amaravati, Andhra Pradesh',
    createdAt: new Date('2023-12-01').toISOString(),
  },
};

// Mock Projects Data
export const mockProjects = [
  {
    _id: 'project_001',
    userId: 'user_001',
    projectName: 'Organic Spice Processing Unit',
    projectType: 'individual',
    industrySector: 'Food Processing',
    subSector: 'Spice Processing',
    totalCost: 2500000,
    ownContribution: 750000,
    loanAmount: 1750000,
    location: 'Hyderabad, Telangana',
    status: 'completed',
    inputs: {
      businessDescription: 'A modern organic spice processing unit focusing on turmeric, red chili, and coriander processing with export quality standards.',
      targetMarket: 'Domestic retail chains, export markets in Middle East and Europe',
      rawMaterials: [
        { item: 'Organic Turmeric', quantity: 5000, unit: 'kg', costPerUnit: 120 },
        { item: 'Red Chili', quantity: 3000, unit: 'kg', costPerUnit: 150 },
        { item: 'Coriander Seeds', quantity: 2000, unit: 'kg', costPerUnit: 80 },
      ],
      machinery: [
        { equipment: 'Spice Grinding Machine', quantity: 2, cost: 450000 },
        { equipment: 'Packaging Machine', quantity: 1, cost: 250000 },
        { equipment: 'Quality Testing Equipment', quantity: 1, cost: 180000 },
      ],
      manpower: [
        { designation: 'Production Manager', count: 1, salaryPerMonth: 35000 },
        { designation: 'Quality Control Officer', count: 1, salaryPerMonth: 25000 },
        { designation: 'Machine Operators', count: 4, salaryPerMonth: 18000 },
        { designation: 'Packaging Staff', count: 3, salaryPerMonth: 15000 },
      ],
      infrastructure: {
        landArea: 2000,
        buildingArea: 1500,
        landCost: 800000,
        buildingCost: 1200000,
      },
    },
    createdAt: new Date('2024-02-01').toISOString(),
    updatedAt: new Date('2024-02-15').toISOString(),
  },
  {
    _id: 'project_002',
    userId: 'user_001',
    projectName: 'Handloom Textile Manufacturing',
    projectType: 'individual',
    industrySector: 'Textiles',
    subSector: 'Handloom',
    totalCost: 1800000,
    ownContribution: 540000,
    loanAmount: 1260000,
    location: 'Warangal, Telangana',
    status: 'in-progress',
    inputs: {
      businessDescription: 'Traditional handloom textile manufacturing unit producing cotton sarees and fabrics with modern design integration.',
      targetMarket: 'Domestic markets, online platforms, export to Southeast Asia',
      rawMaterials: [
        { item: 'Cotton Yarn', quantity: 1000, unit: 'kg', costPerUnit: 180 },
        { item: 'Dyes and Chemicals', quantity: 500, unit: 'kg', costPerUnit: 250 },
      ],
      machinery: [
        { equipment: 'Handloom Machines', quantity: 10, cost: 600000 },
        { equipment: 'Dyeing Unit', quantity: 1, cost: 200000 },
      ],
      manpower: [
        { designation: 'Master Weaver', count: 2, salaryPerMonth: 30000 },
        { designation: 'Weavers', count: 8, salaryPerMonth: 20000 },
        { designation: 'Designer', count: 1, salaryPerMonth: 25000 },
      ],
      infrastructure: {
        landArea: 1500,
        buildingArea: 1000,
        landCost: 450000,
        buildingCost: 550000,
      },
    },
    createdAt: new Date('2024-03-10').toISOString(),
    updatedAt: new Date('2024-03-20').toISOString(),
  },
  {
    _id: 'project_003',
    userId: 'user_001',
    projectName: 'Solar Panel Manufacturing Unit',
    projectType: 'individual',
    industrySector: 'Renewable Energy',
    subSector: 'Solar Equipment',
    totalCost: 5000000,
    ownContribution: 1500000,
    loanAmount: 3500000,
    location: 'Vijayawada, Andhra Pradesh',
    status: 'draft',
    inputs: {
      businessDescription: 'Manufacturing unit for solar panels with capacity of 5MW per annum, focusing on residential and commercial applications.',
      targetMarket: 'Residential, commercial, and industrial sectors in South India',
      rawMaterials: [
        { item: 'Solar Cells', quantity: 50000, unit: 'units', costPerUnit: 45 },
        { item: 'Glass Panels', quantity: 10000, unit: 'sqft', costPerUnit: 120 },
        { item: 'Aluminum Frames', quantity: 10000, unit: 'units', costPerUnit: 180 },
      ],
      machinery: [
        { equipment: 'Solar Panel Assembly Line', quantity: 1, cost: 2500000 },
        { equipment: 'Testing Equipment', quantity: 1, cost: 500000 },
        { equipment: 'Quality Control Lab', quantity: 1, cost: 300000 },
      ],
      manpower: [
        { designation: 'Production Manager', count: 1, salaryPerMonth: 45000 },
        { designation: 'Engineers', count: 3, salaryPerMonth: 35000 },
        { designation: 'Technicians', count: 10, salaryPerMonth: 22000 },
        { designation: 'Quality Control', count: 2, salaryPerMonth: 25000 },
      ],
      infrastructure: {
        landArea: 5000,
        buildingArea: 3000,
        landCost: 2000000,
        buildingCost: 2500000,
      },
    },
    createdAt: new Date('2024-04-01').toISOString(),
    updatedAt: new Date('2024-04-05').toISOString(),
  },
];

// Mock DPR Data
export const mockDPRs = [
  {
    _id: 'dpr_001',
    projectId: {
      _id: 'project_001',
      projectName: 'Organic Spice Processing Unit',
      industrySector: 'Food Processing',
    },
    versionNumber: 1,
    status: 'approved',
    qualityScore: 85,
    qualityFeedback: {
      score: 85,
      strengths: [
        'Comprehensive financial projections',
        'Well-defined market analysis',
        'Strong technical feasibility',
        'Clear implementation timeline',
      ],
      weakSections: [
        'Risk analysis could be more detailed',
        'Environmental impact assessment needs expansion',
      ],
      recommendations: [
        'Add detailed risk mitigation strategies',
        'Include environmental compliance documentation',
        'Expand on export market opportunities',
      ],
    },
    content: {
      english: {
        executiveSummary: `This Detailed Project Report (DPR) presents a comprehensive analysis of establishing an Organic Spice Processing Unit in Hyderabad, Telangana. The project aims to process organic turmeric, red chili, and coriander with a total investment of ₹25 lakhs, seeking a bank loan of ₹17.5 lakhs.

The unit will have a processing capacity of 10,000 kg per month and is expected to generate annual revenue of ₹48 lakhs with a net profit margin of 18%. The project demonstrates strong technical feasibility, market demand, and financial viability, making it an attractive investment opportunity.`,
        businessProfile: `The Organic Spice Processing Unit will be established as a proprietorship concern focusing on processing and packaging organic spices for domestic and export markets. The business will operate from a 1,500 sqft processing facility in Hyderabad.

Key products include:
- Organic Turmeric Powder (Haldi)
- Red Chili Powder (Lal Mirch)
- Coriander Powder (Dhaniya)

The business model emphasizes quality, organic certification, and sustainable practices to differentiate itself in the competitive spice market.`,
        marketAnalysis: `The Indian spice market is valued at ₹1.2 lakh crores and is growing at 8% annually. The organic spice segment is experiencing rapid growth at 15% CAGR, driven by increasing health consciousness and export demand.

Target Markets:
1. Domestic: Retail chains, supermarkets, online platforms
2. Export: Middle East (UAE, Saudi Arabia), Europe (Germany, UK)

Competitive advantages:
- Organic certification
- Quality control measures
- Competitive pricing
- Strong distribution network`,
        technicalFeasibility: `The project is technically feasible with:
- Availability of raw materials from local organic farms
- Established processing technology
- Skilled workforce in the region
- Adequate infrastructure facilities

Processing capacity: 10,000 kg/month
Quality standards: FSSAI, Organic India certification
Technology: Modern grinding and packaging equipment`,
        financialProjections: `Financial Highlights (Year 1):
- Total Investment: ₹25,00,000
- Own Contribution: ₹7,50,000 (30%)
- Bank Loan: ₹17,50,000 (70%)
- Annual Revenue: ₹48,00,000
- Operating Costs: ₹35,00,000
- Net Profit: ₹8,64,000
- ROI: 34.56%
- Payback Period: 2.9 years

The project shows strong financial viability with positive cash flows from year 1.`,
        conclusion: `The Organic Spice Processing Unit is a viable and profitable venture with strong market demand, technical feasibility, and financial returns. The project aligns with government initiatives promoting organic farming and food processing.

With proper implementation and management, the unit is expected to achieve break-even within 18 months and generate sustainable profits, contributing to local employment and economic development.`,
      },
      telugu: {
        executiveSummary: `ఈ వివరణాత్మక ప్రాజెక్ట్ నివేదిక (DPR) హైదరాబాద్, తెలంగాణలో ఒక ఆర్గానిక్ మసాలా ప్రాసెసింగ్ యూనిట్ స్థాపనకు సంబంధించిన సమగ్ర విశ్లేషణను అందిస్తుంది. ఈ ప్రాజెక్ట్ ఆర్గానిక్ పసుపు, ఎర్ర మిరపకాయ మరియు కొత్తిమీరను ప్రాసెస్ చేయడానికి లక్ష్యంగా ఉంది.`,
        businessProfile: `ఆర్గానిక్ మసాలా ప్రాసెసింగ్ యూనిట్ ఒక స్వంత సంపాదకత్వ సంస్థగా స్థాపించబడుతుంది.`,
        marketAnalysis: `భారతీయ మసాలా మార్కెట్ ₹1.2 లక్షల కోట్ల విలువ కలిగి ఉంది మరియు సంవత్సరానికి 8% వృద్ధి చెందుతోంది.`,
        technicalFeasibility: `ప్రాజెక్ట్ సాంకేతికంగా సాధ్యమే.`,
        financialProjections: `ఆర్థిక అంచనాలు: మొత్తం పెట్టుబడి ₹25,00,000.`,
        conclusion: `ఆర్గానిక్ మసాలా ప్రాసెసింగ్ యూనిట్ లాభదాయకమైన వ్యాపారం.`,
      },
    },
    generatedAt: new Date('2024-02-15').toISOString(),
    createdAt: new Date('2024-02-15').toISOString(),
    updatedAt: new Date('2024-02-20').toISOString(),
  },
  {
    _id: 'dpr_002',
    projectId: {
      _id: 'project_002',
      projectName: 'Handloom Textile Manufacturing',
      industrySector: 'Textiles',
    },
    versionNumber: 1,
    status: 'submitted',
    qualityScore: 72,
    qualityFeedback: {
      score: 72,
      strengths: [
        'Good market analysis',
        'Reasonable financial projections',
      ],
      weakSections: [
        'Technical feasibility needs more detail',
        'Financial projections need validation',
        'Market analysis could be expanded',
      ],
      recommendations: [
        'Add detailed technical specifications',
        'Include more market research data',
        'Expand financial projections to 5 years',
      ],
    },
    content: {
      english: {
        executiveSummary: `This DPR outlines the establishment of a Handloom Textile Manufacturing unit in Warangal, Telangana.`,
        businessProfile: `Traditional handloom manufacturing with modern design integration.`,
        marketAnalysis: `Growing demand for handloom products in domestic and international markets.`,
        technicalFeasibility: `Established handloom technology with skilled workforce.`,
        financialProjections: `Total investment: ₹18 lakhs with expected ROI of 28%.`,
        conclusion: `Viable project with cultural and economic significance.`,
      },
    },
    generatedAt: new Date('2024-03-20').toISOString(),
    createdAt: new Date('2024-03-20').toISOString(),
    updatedAt: new Date('2024-03-25').toISOString(),
  },
  {
    _id: 'dpr_003',
    projectId: {
      _id: 'project_001',
      projectName: 'Organic Spice Processing Unit',
      industrySector: 'Food Processing',
    },
    versionNumber: 2,
    status: 'draft',
    qualityScore: null,
    content: {
      english: {
        executiveSummary: `Updated DPR with revised financial projections.`,
        businessProfile: `Business profile updated.`,
        marketAnalysis: `Market analysis in progress.`,
        technicalFeasibility: `Technical details being finalized.`,
        financialProjections: `Revised financial projections.`,
        conclusion: `Conclusion pending.`,
      },
    },
    generatedAt: new Date('2024-02-25').toISOString(),
    createdAt: new Date('2024-02-25').toISOString(),
    updatedAt: new Date('2024-02-25').toISOString(),
  },
];

// Mock Schemes Data
export const mockSchemes = [
  {
    _id: 'scheme_001',
    schemeCode: 'PMEGP',
    schemeName: 'Prime Minister Employment Generation Programme',
    description: 'Credit-linked subsidy scheme for setting up new micro-enterprises',
    eligibility: {
      age: '18-35 years',
      category: 'General, SC/ST, OBC, Women, Ex-servicemen',
      projectCost: 'Up to ₹25 lakhs (manufacturing), ₹10 lakhs (service)',
    },
    benefits: {
      subsidy: '15-35% of project cost',
      maxSubsidy: '₹5 lakhs (manufacturing), ₹2 lakhs (service)',
      interestRate: 'As per bank rates',
    },
    documentsRequired: [
      'DPR',
      'Identity proof',
      'Address proof',
      'Caste certificate (if applicable)',
      'Project cost estimate',
    ],
    status: 'active',
  },
  {
    _id: 'scheme_002',
    schemeCode: 'MUDRA',
    schemeName: 'Pradhan Mantri MUDRA Yojana',
    description: 'Micro Units Development and Refinance Agency - provides loans up to ₹10 lakhs',
    eligibility: {
      age: '18 years and above',
      category: 'All categories',
      projectCost: 'Up to ₹10 lakhs',
    },
    benefits: {
      loanAmount: 'Up to ₹10 lakhs',
      interestRate: 'Competitive rates',
      noCollateral: 'For loans up to ₹50,000',
    },
    documentsRequired: [
      'Business plan',
      'Identity proof',
      'Address proof',
      'Bank statements',
    ],
    status: 'active',
  },
  {
    _id: 'scheme_003',
    schemeCode: 'CGTMSE',
    schemeName: 'Credit Guarantee Fund Trust for Micro and Small Enterprises',
    description: 'Credit guarantee scheme for collateral-free loans',
    eligibility: {
      category: 'All MSMEs',
      loanAmount: 'Up to ₹2 crores',
    },
    benefits: {
      guarantee: 'Up to 85% of loan amount',
      noCollateral: 'Collateral-free loans',
      interestRate: 'As per bank rates',
    },
    documentsRequired: [
      'DPR',
      'MSME registration',
      'Financial statements',
      'Bank loan application',
    ],
    status: 'active',
  },
];

// Mock Chat Messages
export const mockChatMessages = [
  {
    id: 'msg_001',
    role: 'user',
    content: 'I want to start a spice processing unit. Can you help me?',
    timestamp: new Date('2024-02-01T10:00:00').toISOString(),
  },
  {
    id: 'msg_002',
    role: 'assistant',
    content: `I'd be happy to help you set up a spice processing unit! Let me guide you through the process.

To create a comprehensive DPR, I'll need some information:
1. What type of spices do you want to process? (e.g., turmeric, chili, coriander)
2. What is your estimated project cost?
3. Where do you plan to set up the unit?
4. Do you have any prior experience in this field?

Once you provide these details, I can help you create a detailed project report.`,
    timestamp: new Date('2024-02-01T10:00:05').toISOString(),
  },
  {
    id: 'msg_003',
    role: 'user',
    content: 'I want to process organic turmeric, red chili, and coriander. My budget is around ₹25 lakhs. Location is Hyderabad.',
    timestamp: new Date('2024-02-01T10:02:00').toISOString(),
  },
  {
    id: 'msg_004',
    role: 'assistant',
    content: `Excellent! An organic spice processing unit in Hyderabad is a great choice. Based on your requirements:

**Project Overview:**
- Products: Organic Turmeric, Red Chili, Coriander
- Investment: ₹25 lakhs
- Location: Hyderabad

**Key Components:**
1. **Infrastructure**: Processing unit (1500-2000 sqft), storage facility
2. **Machinery**: Grinding machines, packaging equipment, quality testing lab
3. **Raw Materials**: Organic spices from certified farms
4. **Manpower**: Production manager, quality control, operators

**Financial Structure:**
- Own contribution: 30% (₹7.5 lakhs)
- Bank loan: 70% (₹17.5 lakhs)

Would you like me to help you create a detailed DPR with all these components?`,
    timestamp: new Date('2024-02-01T10:02:10').toISOString(),
  },
];

// Mock Documents
export const mockDocuments = [
  {
    _id: 'doc_001',
    name: 'DPR Template - Food Processing',
    originalName: 'DPR_Template_Food_Processing.pdf',
    fileSize: 2456789,
    mimeType: 'application/pdf',
    status: 'ready',
    uploadedBy: 'user_001',
    uploadedAt: new Date('2024-01-20').toISOString(),
    metadata: {
      description: 'Template for food processing DPRs',
      category: 'templates',
      tags: ['dpr', 'template', 'food-processing'],
      isTemplate: true,
      templateType: 'dpr',
    },
  },
  {
    _id: 'doc_002',
    name: 'PMEGP Scheme Guidelines',
    originalName: 'PMEGP_Guidelines_2024.pdf',
    fileSize: 1234567,
    mimeType: 'application/pdf',
    status: 'ready',
    uploadedBy: 'admin_001',
    uploadedAt: new Date('2024-01-15').toISOString(),
    metadata: {
      description: 'Complete guidelines for PMEGP scheme',
      category: 'schemes',
      tags: ['pmegp', 'scheme', 'guidelines'],
      isTemplate: false,
      templateType: 'scheme',
    },
  },
];

// Mock Analytics Data
export const mockAnalytics = {
  totalUsers: 1250,
  totalProjects: 3420,
  totalDPRs: 2890,
  approvedDPRs: 2150,
  pendingDPRs: 450,
  rejectedDPRs: 290,
  averageQualityScore: 78.5,
  sectorDistribution: {
    'Food Processing': 850,
    'Textiles': 620,
    'Renewable Energy': 480,
    'Manufacturing': 750,
    'Services': 720,
  },
  monthlyGrowth: [
    { month: 'Jan', projects: 120, dprs: 95 },
    { month: 'Feb', projects: 145, dprs: 118 },
    { month: 'Mar', projects: 168, dprs: 142 },
    { month: 'Apr', projects: 192, dprs: 165 },
  ],
};

// Mock Feedback Data
export const mockFeedback = [
  {
    _id: 'feedback_001',
    projectId: 'project_001',
    userId: 'user_001',
    rating: 5,
    comment: 'Excellent platform! The AI guidance was very helpful in creating my DPR.',
    createdAt: new Date('2024-02-20').toISOString(),
  },
  {
    _id: 'feedback_002',
    projectId: 'project_002',
    userId: 'user_001',
    rating: 4,
    comment: 'Good experience overall. Would like to see more scheme recommendations.',
    createdAt: new Date('2024-03-25').toISOString(),
  },
];

// Mock API Response Helpers
export const createMockResponse = <T>(data: T, delay: number = 100): Promise<{ data: T }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data });
    }, delay);
  });
};

// Mock API Service
export class MockDataService {
  // Auth
  static async login(_email: string, _password: string) {
    return createMockResponse({
      success: true,
      data: mockUsers.currentUser,
      token: 'mock_jwt_token_' + Date.now(),
    });
  }

  static async register(data: any) {
    return createMockResponse({
      success: true,
      data: { ...mockUsers.currentUser, ...data },
      token: 'mock_jwt_token_' + Date.now(),
    });
  }

  static async getProfile() {
    return createMockResponse(mockUsers.currentUser);
  }

  // Projects
  static async getProjects(_params?: any) {
    return createMockResponse({
      projects: mockProjects,
      total: mockProjects.length,
    });
  }

  static async getProject(id: string) {
    const project = mockProjects.find(p => p._id === id) || mockProjects[0];
    // Return project directly (API client's handleRequest will return this)
    return project;
  }

  static async createProject(data: any) {
    const newProject = {
      _id: 'project_' + Date.now(),
      userId: 'user_001',
      ...data,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return createMockResponse(newProject);
  }

  static async updateProject(id: string, data: any) {
    const project = mockProjects.find(p => p._id === id) || mockProjects[0];
    return createMockResponse({ ...project, ...data, updatedAt: new Date().toISOString() });
  }

  // DPRs
  static async getUserDPRs() {
    // Return in the format expected by the API client
    // Real API returns: { data: { dprs: [...], total: ... } } or { dprs: [...], total: ... }
    // We'll return: { dprs: [...], total: ... } directly
    return {
      dprs: mockDPRs,
      total: mockDPRs.length,
    };
  }

  static async getDPR(dprId: string) {
    const dpr = mockDPRs.find(d => d._id === dprId) || mockDPRs[0];
    // Return DPR directly (API client's handleRequest will return this)
    return dpr;
  }

  static async getProjectDPRs(projectId: string) {
    const dprs = mockDPRs.filter(d => d.projectId._id === projectId);
    return createMockResponse({ dprs, total: dprs.length });
  }

  static async analyzeDPRQuality(dprId: string) {
    const dpr = mockDPRs.find(d => d._id === dprId) || mockDPRs[0];
    // Return in the format expected: { success: true, data: { score, strengths, weakSections, recommendations } }
    return {
      success: true,
      data: dpr.qualityFeedback || {
        score: dpr.qualityScore || 75,
        strengths: ['Good structure', 'Clear objectives'],
        weakSections: ['Needs more detail'],
        recommendations: ['Expand sections'],
      },
    };
  }

  // Schemes
  static async getSchemes() {
    return createMockResponse({
      schemes: mockSchemes,
      total: mockSchemes.length,
    });
  }

  static async recommendSchemes(_projectId: string) {
    return createMockResponse({
      recommendedSchemes: [mockSchemes[0], mockSchemes[1]],
      matchScore: 85,
    });
  }

  // Chat - Enhanced with context-aware responses for offline mode
  static async chat(message: string, conversationHistory: any[] = []) {
    // Try to get answer from Q&A database first
    try {
      const { getOfflineAnswer } = await import('./offlineQAService');
      const qaAnswer = getOfflineAnswer(message);
      
      if (qaAnswer) {
        // Found a match in Q&A database
        const response: any = {
          success: true,
          data: {
            response: qaAnswer.answer + '\n\n💡 *You are in offline mode. This answer is from our pre-loaded knowledge base.*',
            suggestions: qaAnswer.suggestions || [],
            nextSteps: [],
            ragContext: 'Offline Q&A Database',
            dprAction: null,
            dprQuestions: [],
          },
        };
        
        return {
          data: response.data,
        };
      }
    } catch (error) {
      console.warn('Failed to load Q&A service, falling back to pattern matching:', error);
    }
    
    // Fallback to pattern matching if Q&A database doesn't have a match
    const lowerMessage = message.toLowerCase();
    
    // Context-aware response generation
    let response: any = {
      success: true,
      data: {
        response: '',
        suggestions: [],
        nextSteps: [],
        ragContext: null,
        dprAction: null,
        dprQuestions: [],
      },
    };

    // Add offline mode indicator
    const offlineModeNote = '\n\n💡 *You are in offline mode. I can still help with a wide range of questions using pre-loaded knowledge!*';

    // Industry-specific queries
    if (lowerMessage.includes('food processing') || lowerMessage.includes('spice') || lowerMessage.includes('agriculture')) {
      response.data.response = `Food Processing is a great sector! Here's what you need to know:

**Key Considerations:**
- **FSSAI License**: Required for all food processing units
- **Organic Certification**: If processing organic products (NPOP/India Organic)
- **Location**: Near raw material sources, good transport connectivity
- **Infrastructure**: Clean processing area, cold storage if needed

**Common Food Processing Projects:**
1. Spice Processing (Turmeric, Chili, Coriander)
2. Rice Milling and Processing
3. Fruit & Vegetable Processing
4. Dairy Products
5. Bakery & Confectionery

**Typical Investment Range:**
- Small Scale: ₹10-25 lakhs
- Medium Scale: ₹25 lakhs - ₹1 crore
- Large Scale: ₹1 crore+

**I can help you:**
- Create a food processing project DPR
- Calculate machinery costs
- Identify suitable schemes
- Plan infrastructure requirements

Would you like to start creating your food processing project?` + offlineModeNote;
      
      response.data.suggestions = [
        'Create food processing project',
        'Calculate machinery costs',
        'Check FSSAI requirements',
        'View food processing templates',
      ];
    }
    // Textile/Handloom queries
    else if (lowerMessage.includes('textile') || lowerMessage.includes('handloom') || lowerMessage.includes('weaving')) {
      response.data.response = `Textile and Handloom sector offers great opportunities! Here's guidance:

**Types of Textile Projects:**
1. Handloom Weaving (Traditional sarees, fabrics)
2. Powerloom Manufacturing
3. Garment Manufacturing
4. Textile Processing & Dyeing
5. Apparel Export Units

**Key Requirements:**
- **Handloom**: Skilled weavers, traditional designs, handloom registration
- **Powerloom**: Machinery, power supply, skilled operators
- **Garment**: Cutting, stitching machines, quality control

**Investment Range:**
- Handloom: ₹5-20 lakhs
- Powerloom: ₹20-50 lakhs
- Garment Unit: ₹30 lakhs - ₹2 crores

**Government Support:**
- Handloom Mark registration
- Subsidies for handloom units
- Export promotion schemes

**I can help with:**
- Creating textile project DPR
- Machinery selection guidance
- Market analysis for textiles
- Scheme recommendations

Ready to create your textile project?` + offlineModeNote;
      
      response.data.suggestions = [
        'Create textile project',
        'Handloom registration info',
        'Machinery cost estimates',
        'Textile market analysis',
      ];
    }
    // Manufacturing queries
    else if (lowerMessage.includes('manufacturing') || lowerMessage.includes('production') || lowerMessage.includes('factory')) {
      response.data.response = `Manufacturing projects require careful planning! Here's what to consider:

**Manufacturing Project Types:**
1. Light Engineering
2. Electronics Assembly
3. Chemical Products
4. Plastic Products
5. Metal Fabrication

**Essential Components:**
- **Land & Building**: Industrial plot, factory shed
- **Machinery**: Production equipment, quality testing
- **Power**: Adequate electricity supply, backup power
- **Raw Materials**: Reliable suppliers, storage
- **Manpower**: Skilled workers, supervisors

**Investment Considerations:**
- Small Scale: ₹25 lakhs - ₹1 crore
- Medium Scale: ₹1-5 crores
- Large Scale: ₹5 crores+

**Regulatory Requirements:**
- Factory License
- Pollution Control Board clearance
- Fire Safety certificate
- Labor compliance

**I can assist with:**
- Manufacturing project DPR creation
- Technical feasibility analysis
- Machinery cost estimation
- Compliance requirements

Let's start building your manufacturing project!` + offlineModeNote;
      
      response.data.suggestions = [
        'Create manufacturing project',
        'Check compliance requirements',
        'Estimate machinery costs',
        'Technical feasibility help',
      ];
    }
    // Service sector queries
    else if (lowerMessage.includes('service') || lowerMessage.includes('consulting') || lowerMessage.includes('business service')) {
      response.data.response = `Service sector projects have different requirements! Here's guidance:

**Service Business Types:**
1. IT/Software Services
2. Consulting Services
3. Trading & Distribution
4. Logistics & Transportation
5. Professional Services

**Key Advantages:**
- Lower initial investment
- Faster setup time
- Less infrastructure needed
- Scalable operations

**Investment Range:**
- Small Service: ₹5-15 lakhs
- Medium Service: ₹15-50 lakhs
- Large Service: ₹50 lakhs+

**Requirements:**
- Office space (can be rented)
- Equipment (computers, furniture)
- Professional licenses if applicable
- Skilled professionals

**I can help with:**
- Service business DPR creation
- Business plan development
- Financial projections
- Market analysis

Ready to start your service business project?` + offlineModeNote;
      
      response.data.suggestions = [
        'Create service project',
        'Business plan help',
        'Service sector schemes',
        'Market analysis',
      ];
    }
    // Project creation queries
    else if (lowerMessage.includes('create') || lowerMessage.includes('start') || lowerMessage.includes('new project')) {
      response.data.response = `I'd be happy to help you create a new project! Let's start by gathering some key information:

**To create a comprehensive DPR, I'll need:**

1. **Project Type**: Individual or Cluster?
2. **Industry Sector**: What industry are you in? (e.g., Food Processing, Textiles, Manufacturing)
3. **Project Name**: What would you like to name your project?
4. **Total Investment**: What's your total project cost?
5. **Location**: Where do you plan to set up?

Would you like to:
- 📝 Fill out a guided form step-by-step
- 💬 Answer questions through chat
- 📄 Upload an existing document

Which option would you prefer?` + offlineModeNote;
      
      response.data.suggestions = [
        'Create a new project',
        'View project templates',
        'Learn about DPR requirements',
      ];
      
      response.data.nextSteps = [
        'Navigate to Projects page',
        'Start AI-guided DPR builder',
        'Upload existing project document',
      ];
    }
    // Registration and documentation queries
    else if (lowerMessage.includes('registration') || lowerMessage.includes('license') || lowerMessage.includes('udyam') || lowerMessage.includes('gst')) {
      response.data.response = `Registration and licensing are crucial! Here's what you need:

**Essential Registrations:**
1. **Udyam Registration** (MSME)
   - Online registration at udyamregistration.gov.in
   - Free of cost
   - Required for scheme benefits

2. **GST Registration**
   - Required if turnover > ₹20 lakhs (services) or ₹40 lakhs (goods)
   - Apply at gst.gov.in

3. **FSSAI License** (Food businesses)
   - Basic: Up to ₹12 lakhs turnover
   - State: ₹12 lakhs - ₹20 crores
   - Central: Above ₹20 crores

4. **Factory License** (Manufacturing)
   - Required for factories with 10+ workers
   - Apply to State Labor Department

5. **Trade License**
   - From local municipal corporation
   - Required for commercial activities

**Documents Typically Needed:**
- Identity proof (Aadhaar/PAN)
- Address proof
- Business address proof
- Bank account details
- Photographs

**I can help you:**
- Understand registration requirements
- Create checklist for your sector
- Guide through application process

Which registration do you need help with?` + offlineModeNote;
      
      response.data.suggestions = [
        'Udyam registration guide',
        'GST registration help',
        'License requirements',
        'Document checklist',
      ];
    }
    // Risk analysis queries
    else if (lowerMessage.includes('risk') || lowerMessage.includes('challenge') || lowerMessage.includes('problem')) {
      response.data.response = `Risk analysis is essential for a strong DPR! Here's what to consider:

**Common Project Risks:**
1. **Market Risks**
   - Demand fluctuations
   - Competition
   - Price volatility
   - Changing customer preferences

2. **Technical Risks**
   - Technology obsolescence
   - Machinery breakdown
   - Quality issues
   - Raw material availability

3. **Financial Risks**
   - Cash flow problems
   - Interest rate changes
   - Loan repayment delays
   - Cost overruns

4. **Operational Risks**
   - Skilled labor shortage
   - Supply chain disruptions
   - Regulatory changes
   - Natural disasters

**Risk Mitigation Strategies:**
- Diversify product/service range
- Maintain emergency fund
- Insurance coverage
- Backup suppliers
- Regular maintenance
- Market research

**I can help you:**
- Identify project-specific risks
- Develop mitigation strategies
- Create risk analysis section
- Plan contingency measures

Would you like me to create a risk analysis for your project?` + offlineModeNote;
      
      response.data.suggestions = [
        'Create risk analysis',
        'Risk mitigation strategies',
        'Insurance guidance',
        'Contingency planning',
      ];
    }
    // Break-even analysis queries
    else if (lowerMessage.includes('break even') || lowerMessage.includes('break-even') || lowerMessage.includes('profitability') || lowerMessage.includes('roi')) {
      response.data.response = `Break-even and profitability analysis are crucial! Here's how to calculate:

**Break-Even Analysis:**
Break-even point = Fixed Costs / (Selling Price - Variable Cost per unit)

**Key Financial Metrics:**
1. **Break-Even Point**: When revenue = total costs
2. **ROI (Return on Investment)**: (Net Profit / Investment) × 100
3. **Payback Period**: Investment / Annual Net Profit
4. **Profit Margin**: (Net Profit / Revenue) × 100

**Typical Benchmarks:**
- **ROI**: 25-40% is considered good for MSMEs
- **Payback Period**: 2-4 years is reasonable
- **Profit Margin**: 15-25% is healthy

**Example Calculation:**
- Investment: ₹25 lakhs
- Annual Revenue: ₹48 lakhs
- Annual Costs: ₹35 lakhs
- Net Profit: ₹13 lakhs
- ROI: (13/25) × 100 = 52%
- Payback: 25/13 = 1.9 years

**I can help you:**
- Calculate break-even point
- Estimate ROI for your project
- Create financial projections
- Analyze profitability

Would you like me to calculate these metrics for your project?` + offlineModeNote;
      
      response.data.suggestions = [
        'Calculate break-even',
        'Estimate ROI',
        'Financial projections',
        'Profitability analysis',
      ];
    }
    // Financial queries
    else if (lowerMessage.includes('cost') || lowerMessage.includes('loan') || lowerMessage.includes('funding') || lowerMessage.includes('investment')) {
      response.data.response = `Great question about financing! Here's what you need to know:

**Typical Financial Structure:**
- **Own Contribution**: 25-30% of total project cost
- **Bank Loan**: 70-75% of total project cost
- **Government Subsidy**: 15-35% (depending on scheme)

**Available Schemes:**
1. **PMEGP**: Up to ₹5 lakhs subsidy
2. **MUDRA**: Loans up to ₹10 lakhs
3. **CGTMSE**: Collateral-free loans up to ₹2 crores

**What I can help with:**
- Calculate optimal loan amount
- Recommend suitable schemes
- Estimate subsidy eligibility
- Create financial projections

Would you like me to calculate the financial structure for your project?` + offlineModeNote;
      
      response.data.suggestions = [
        'Calculate loan amount',
        'Check scheme eligibility',
        'View financial templates',
      ];
    }
    // DPR generation queries
    else if (lowerMessage.includes('dpr') || lowerMessage.includes('report') || lowerMessage.includes('generate')) {
      response.data.response = `I can help you generate a comprehensive Detailed Project Report (DPR)! 

**A complete DPR includes:**
1. Executive Summary
2. Business Profile
3. Market Analysis
4. Technical Feasibility
5. Financial Projections
6. Conclusion

**To generate your DPR, I need:**
- Project details (name, sector, location)
- Investment amount
- Business description
- Target market information

**Options:**
- 🤖 **AI-Guided Builder**: Step-by-step with intelligent suggestions
- 📝 **Manual Form**: Fill out all details yourself
- 📄 **Upload Document**: Upload existing project information

Which method would you prefer?` + offlineModeNote;
      
      response.data.dprAction = {
        type: 'generate',
        projectId: null,
        suggestedSteps: ['business-overview', 'market-analysis', 'cost-structure'],
      };
      
      response.data.dprQuestions = [
        'What is your project name?',
        'Which industry sector?',
        'What is your total investment?',
        'Where is your project location?',
      ];
    }
    // Scheme queries
    else if (lowerMessage.includes('scheme') || lowerMessage.includes('subsidy') || lowerMessage.includes('government')) {
      response.data.response = `I can help you find the right government schemes for your project!

**Popular Schemes:**
1. **PMEGP** - Prime Minister Employment Generation Programme
   - Subsidy: 15-35% of project cost
   - Max: ₹5 lakhs (manufacturing), ₹2 lakhs (service)
   
2. **MUDRA** - Pradhan Mantri MUDRA Yojana
   - Loans: Up to ₹10 lakhs
   - No collateral for loans up to ₹50,000
   
3. **CGTMSE** - Credit Guarantee Scheme
   - Collateral-free loans up to ₹2 crores
   - 85% guarantee coverage

**To recommend the best scheme, I need:**
- Your project type and sector
- Total investment amount
- Your category (General/SC/ST/Women)

Would you like me to check your eligibility for these schemes?` + offlineModeNote;
      
      response.data.suggestions = [
        'Check PMEGP eligibility',
        'Apply for MUDRA loan',
        'View all schemes',
      ];
    }
    // Market analysis queries
    else if (lowerMessage.includes('market') || lowerMessage.includes('demand') || lowerMessage.includes('competition')) {
      response.data.response = `Market analysis is crucial for a successful DPR! Here's what I can help with:

**Market Analysis Components:**
1. **Target Market**: Who are your customers?
2. **Market Size**: What's the total addressable market?
3. **Competition**: Who are your competitors?
4. **Pricing Strategy**: How will you price your products/services?
5. **Distribution Channels**: How will you reach customers?

**I can provide:**
- Industry-specific market data
- Competitor analysis templates
- Market size estimates
- Pricing benchmarks

**To help you better, please share:**
- Your industry sector
- Product/service type
- Target location

Would you like me to generate a market analysis section for your DPR?`;
    }
    // Technical feasibility queries
    else if (lowerMessage.includes('technical') || lowerMessage.includes('machinery') || lowerMessage.includes('equipment')) {
      response.data.response = `Technical feasibility is a key component of your DPR! Let me help:

**Technical Feasibility Includes:**
1. **Infrastructure**: Land, building, utilities
2. **Machinery & Equipment**: Required machinery list with costs
3. **Technology**: Production processes and technology
4. **Raw Materials**: Sourcing and availability
5. **Manpower**: Required skills and staffing

**I can help with:**
- Machinery cost estimates
- Infrastructure requirements
- Technology recommendations
- Raw material sourcing guidance

**To provide accurate information, please share:**
- Your industry sector
- Production capacity required
- Location preferences

Would you like me to create a technical feasibility section?` + offlineModeNote;
      
      response.data.suggestions = [
        'Machinery cost estimates',
        'Infrastructure planning',
        'Technology recommendations',
        'Raw material guidance',
      ];
    }
    // Quality/improvement queries
    else if (lowerMessage.includes('quality') || lowerMessage.includes('improve') || lowerMessage.includes('better')) {
      response.data.response = `I can help improve your DPR quality! Here are some tips:

**Common Quality Issues:**
1. Incomplete financial projections
2. Weak market analysis
3. Missing technical details
4. Inadequate risk assessment

**Quality Improvement Tips:**
- ✅ Add detailed financial projections (5 years)
- ✅ Include comprehensive market research
- ✅ Provide technical specifications
- ✅ Add risk analysis and mitigation
- ✅ Include environmental impact assessment

**I can:**
- Analyze your existing DPR
- Provide specific improvement suggestions
- Generate missing sections
- Review and enhance content

Would you like me to analyze your DPR and provide specific recommendations?` + offlineModeNote;
      
      response.data.suggestions = [
        'DPR quality analysis',
        'Improvement suggestions',
        'Generate missing sections',
        'Content review',
      ];
    }
    // General help queries
    else if (lowerMessage.includes('help') || lowerMessage.includes('how') || lowerMessage.includes('what')) {
      response.data.response = `I'm here to help you create a bank-ready Detailed Project Report (DPR)! 

**I can assist with:**
- 📝 Creating new projects
- 📊 Generating comprehensive DPRs
- 💰 Financial planning and loan calculations
- 🏛️ Government scheme recommendations
- 📈 Market analysis and research
- 🔧 Technical feasibility studies
- ✅ DPR quality improvement

**Quick Actions:**
- Create a new project
- Generate DPR from existing project
- Check scheme eligibility
- Calculate financial structure
- Improve DPR quality

What would you like to do today?`;
      
      response.data.suggestions = [
        'Create new project',
        'Generate DPR',
        'Check schemes',
        'View templates',
      ];
    }
    // Default response
    else {
      response.data.response = `I understand you're asking about "${message}". Let me help you with that!

**I can assist with:**
- Creating and managing projects
- Generating Detailed Project Reports (DPRs)
- Financial planning and calculations
- Government scheme recommendations
- Market analysis
- Technical feasibility studies

**To provide the best help, could you:**
1. Share more details about your project?
2. Tell me what specific aspect you need help with?
3. Or choose from the options below?

**Quick Options:**
- 📝 Create a new project
- 📊 Generate a DPR
- 💰 Get financial guidance
- 🏛️ Check scheme eligibility

What would you like to do?`;
      
      response.data.suggestions = [
        'Create project',
        'Generate DPR',
        'Financial help',
        'Scheme information',
      ];
    }

    // Add conversation context if available
    if (conversationHistory.length > 0) {
      const lastUserMessage = conversationHistory.filter(m => m.role === 'user').pop();
      if (lastUserMessage) {
        response.data.ragContext = {
          previousTopic: lastUserMessage.content.substring(0, 50),
          conversationLength: conversationHistory.length,
        };
      }
    }

    // Return in the format expected by the API client and Chat component
    // The real API returns: { data: { response: ..., suggestions: ..., etc } }
    // The API client's handleRequest returns this directly
    // So we need to return: { data: { response: ..., suggestions: ..., etc } }
    return {
      data: response.data,
    };
  }

  // Documents
  static async getDocuments(_params?: any) {
    return createMockResponse({
      documents: mockDocuments,
      total: mockDocuments.length,
    });
  }

  // Analytics
  static async getAnalytics() {
    return createMockResponse(mockAnalytics);
  }

  static async getDPRAnalytics(projectId: string) {
    return createMockResponse({
      projectId,
      qualityScore: 85,
      completeness: 92,
      recommendations: mockDPRs[0].qualityFeedback?.recommendations || [],
      ...mockAnalytics,
    });
  }

  // Feedback
  static async getProjectFeedback(projectId: string) {
    const feedback = mockFeedback.filter(f => f.projectId === projectId);
    return createMockResponse({ feedback, total: feedback.length });
  }

  // Admin
  static async getAllUsers(_params?: any) {
    return createMockResponse({
      users: [mockUsers.currentUser, mockUsers.adminUser],
      total: 2,
    });
  }

  static async getAllProjects(_params?: any) {
    return createMockResponse({
      projects: mockProjects,
      total: mockProjects.length,
    });
  }

  static async getAllDPRsAdmin(_params?: any) {
    const response = await createMockResponse({
      dprs: mockDPRs,
      total: mockDPRs.length,
    });
    // Return in the format expected by the API client
    return response.data;
  }
}

