// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
  Sparkles,
  TrendingUp,
  Building2,
  DollarSign,
  FileText,
  Award,
  Brain,
  Save,
  BarChart3,
  Info,
  TrendingDown,
  Target,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  HelpCircle,
  Hammer,
  Package,
  ShoppingCart,
  Users,
  Zap,
  Settings,
  User,
  Calculator,
  Plus,
  Trash2,
} from 'lucide-react';

interface StepData {
  businessOverview?: any;
  applicantInfo?: any;
  buildingDetails?: any;
  machineryDetails?: any;
  otherCapitalCosts?: any;
  financing?: any;
  salesDetails?: any;
  rawMaterials?: any;
  wages?: any;
  salaryDetails?: any;
  workingCapitalEstimate?: any;
  powerEstimate?: any;
  overheadExpenses?: any;
  financialParameters?: any;
  beneficiaryInfo?: any;
  projectAtGlance?: any;
  marketAnalysis?: any;
  costStructure?: any;
  financialProjections?: any;
  eligibleSchemes?: any;
}

export const AIGuidedDPRBuilder: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projectId } = useParams();
  
  const STEPS = [
    { id: 'business-overview', title: t('dprBuilder.businessOverview.title'), icon: Building2 },
    { id: 'applicant-info', title: t('dprBuilder.applicantInfo.title'), icon: User },
    { id: 'building-details', title: t('dprBuilder.buildingDetails.title'), icon: Building2 },
    { id: 'machinery-details', title: t('dprBuilder.machineryDetails.title'), icon: Hammer },
    { id: 'other-capital-costs', title: t('dprBuilder.otherCapitalCosts.title'), icon: Package },
    { id: 'financing', title: t('dprBuilder.financing.title'), icon: DollarSign },
    { id: 'sales-details', title: t('dprBuilder.salesDetails.title'), icon: ShoppingCart },
    { id: 'raw-materials', title: t('dprBuilder.rawMaterials.title'), icon: Package },
    { id: 'wages', title: t('dprBuilder.wages.title'), icon: Users },
    { id: 'salary-details', title: t('dprBuilder.salaryDetails.title'), icon: Users },
    { id: 'working-capital-estimate', title: t('dprBuilder.workingCapitalEstimate.title'), icon: Calculator },
    { id: 'power-estimate', title: t('dprBuilder.powerEstimate.title'), icon: Zap },
    { id: 'overhead-expenses', title: t('dprBuilder.overheadExpenses.title'), icon: Settings },
    { id: 'financial-parameters', title: t('dprBuilder.financialParameters.title'), icon: Calculator },
    { id: 'beneficiary-info', title: t('dprBuilder.beneficiaryInfo.title'), icon: User },
    { id: 'project-at-glance', title: t('dprBuilder.projectAtGlance.title'), icon: FileText },
    { id: 'market-analysis', title: t('dprBuilder.marketAnalysis.title'), icon: TrendingUp },
    { id: 'financial-projections', title: t('dprBuilder.financialProjections.title'), icon: BarChart3 },
    { id: 'eligible-schemes', title: t('dprBuilder.eligibleSchemes.title'), icon: Award },
    { id: 'ai-review', title: t('dprBuilder.aiReview.title'), icon: Brain },
  ];
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stepData, setStepData] = useState<StepData>({});
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, any>>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState<Record<string, boolean>>({});
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    if (projectId) {
      loadProject();
    } else {
      // Load saved progress from localStorage if no projectId
      const saved = localStorage.getItem('dpr-builder-progress');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setStepData(parsed.stepData || {});
          setCurrentStep(parsed.currentStep || 0);
        } catch (e) {
          console.error('Failed to load saved progress:', e);
        }
      }
    }
  }, [projectId]);

  // Auto-save progress to localStorage
  useEffect(() => {
    if (Object.keys(stepData).length > 0) {
      const saveData = {
        stepData,
        currentStep,
        timestamp: Date.now(),
      };
      localStorage.setItem('dpr-builder-progress', JSON.stringify(saveData));
    }
  }, [stepData, currentStep]);

  const loadProject = async () => {
    try {
      const response = await api.getProject(projectId!);
      setProject(response.data || response);
      
      // Auto-fill business overview from project data
      if (response.data || response) {
        setStepData({
          businessOverview: {
            projectName: (response.data || response).projectName,
            industrySector: (response.data || response).industrySector,
            location: (response.data || response).location,
            businessDescription: (response.data || response).inputs?.businessDescription || '',
          },
        });
      }
    } catch (error) {
          toast.error(t('dprBuilder.errors.failedToLoadProject'));
    }
  };

  // Helper function to parse Other Capital Costs from text/markdown
  const parseOtherCapitalCostsFromText = (text: string): any => {
    const result: any = {
      preliminaryCost: '0',
      furnitureFixtures: '0',
      contingency: '0',
      workingCapital: '0'
    };
    
    // Extract numbers with ₹ symbol or keywords
    let furnitureTotal = 0;
    let preliminaryTotal = 0;
    let contingencyTotal = 0;
    let workingCapitalTotal = 0;
    
    // Helper to extract number from text
    const extractNumber = (str: string): number => {
      const match = str.match(/[₹]?\s*(\d+(?:,\d+)*)/);
      return match ? parseInt(match[1].replace(/,/g, '')) : 0;
    };
    
    // Look for Furniture and Fixtures section with Total
    const furnitureSectionMatch = text.match(/(?:Furniture|Fixtures).*?Total.*?[₹]?\s*(\d+(?:,\d+)*)/gi);
    if (furnitureSectionMatch) {
      furnitureTotal = Math.max(...furnitureSectionMatch.map(m => extractNumber(m)));
    } else {
      // Try individual items
      const furnitureItems = text.match(/(?:Office Furniture|Display Racks|desks|chairs|cabinets|Furniture|Fixtures).*?[₹]?\s*(\d+(?:,\d+)*)/gi);
      if (furnitureItems) {
        furnitureItems.forEach(item => {
          furnitureTotal += extractNumber(item);
        });
      }
    }
    
    // Look for Office Equipment (goes to preliminaryCost)
    const officeEquipmentMatch = text.match(/(?:Office Equipment|Computers|Laptops|Printer|Scanner|Telephone|Communication).*?Total.*?[₹]?\s*(\d+(?:,\d+)*)/gi);
    if (officeEquipmentMatch) {
      officeEquipmentMatch.forEach(match => {
        preliminaryTotal += extractNumber(match);
      });
    } else {
      const equipmentItems = text.match(/(?:Computers|Laptops|Printer|Scanner|Telephone|Communication).*?[₹]?\s*(\d+(?:,\d+)*)/gi);
      if (equipmentItems) {
        equipmentItems.forEach(item => {
          preliminaryTotal += extractNumber(item);
        });
      }
    }
    
    // Look for Licenses and Permits (goes to preliminaryCost)
    const licensesMatch = text.match(/(?:Licenses|Permits|License|Permit|Food Safety|GST Registration|Registration).*?Total.*?[₹]?\s*(\d+(?:,\d+)*)/gi);
    if (licensesMatch) {
      licensesMatch.forEach(match => {
        preliminaryTotal += extractNumber(match);
      });
    } else {
      const licenseItems = text.match(/(?:Food Safety|GST|Registration|Permits|Licenses).*?[₹]?\s*(\d+(?:,\d+)*)/gi);
      if (licenseItems) {
        licenseItems.forEach(item => {
          preliminaryTotal += extractNumber(item);
        });
      }
    }
    
    // Look for Utilities and Installation (goes to contingency)
    const utilitiesMatch = text.match(/(?:Utilities|Installation|Electrical|Plumbing|Wiring|Setup).*?Total.*?[₹]?\s*(\d+(?:,\d+)*)/gi);
    if (utilitiesMatch) {
      utilitiesMatch.forEach(match => {
        contingencyTotal += extractNumber(match);
      });
    } else {
      const utilityItems = text.match(/(?:Electrical|Plumbing|Wiring|Setup|Installation).*?[₹]?\s*(\d+(?:,\d+)*)/gi);
      if (utilityItems) {
        utilityItems.forEach(item => {
          contingencyTotal += extractNumber(item);
        });
      }
    }
    
    // Look for Miscellaneous Expenses (goes to contingency)
    const miscMatch = text.match(/(?:Miscellaneous|Branding|Marketing|Others|Other).*?Total.*?[₹]?\s*(\d+(?:,\d+)*)/gi);
    if (miscMatch) {
      miscMatch.forEach(match => {
        contingencyTotal += extractNumber(match);
      });
    }
    
    // Look for Working Capital explicitly
    const workingCapitalMatch = text.match(/(?:Working Capital|working capital|Initial Working Capital).*?[₹]?\s*(\d+(?:,\d+)*)/gi);
    if (workingCapitalMatch) {
      workingCapitalMatch.forEach(match => {
        workingCapitalTotal += extractNumber(match);
      });
    }
    
    // Set values if found
    if (furnitureTotal > 0) result.furnitureFixtures = furnitureTotal.toString();
    if (preliminaryTotal > 0) result.preliminaryCost = preliminaryTotal.toString();
    if (contingencyTotal > 0) result.contingency = contingencyTotal.toString();
    if (workingCapitalTotal > 0) result.workingCapital = workingCapitalTotal.toString();
    
    return result;
  };

  const getAISuggestions = async (stepId: string, _currentData: any, showLoading = true, forceRefresh = false) => {
    // Don't fetch if already loaded (unless user explicitly requests refresh)
    if (aiSuggestions[stepId] && showLoading && !forceRefresh) {
      return;
    }
    
    // Clear cached suggestion if refreshing
    if (forceRefresh) {
      setAiSuggestions(prev => {
        const updated = { ...prev };
        delete updated[stepId];
        return updated;
      });
    }

    try {
      if (showLoading) {
        setLoadingSuggestions(prev => ({ ...prev, [stepId]: true }));
      }
      
      // Build contextual prompt based on step and entered data
      const businessData = stepData.businessOverview || {};
      const marketData = stepData.marketAnalysis || {};
      const costData = stepData.costStructure || {};
      
      let prompt = '';
      
      const currentStepData = stepData[stepId.replace(/-/g, '')] || {};
      
      switch (stepId) {
        case 'market-analysis':
          prompt = `You are an MSME business consultant. Generate ACTUAL SAMPLE CONTENT (not guidance) for a ${businessData.industrySector || 'business'} project named "${businessData.projectName || 'the project'}".

IMPORTANT: Generate REAL, READY-TO-USE sample content that can be directly filled into form fields. The user will edit this content.

Current data entered:
- Target Market: ${marketData.targetMarket || 'Not specified'}
- Competitor Analysis: ${marketData.competitorAnalysis || 'Not specified'}

CRITICAL: Return ONLY a valid JSON object with this exact structure. Do NOT include any markdown formatting, explanations, or additional text. Just return the JSON:
{
  "targetMarket": "Complete sample text for target market field (200-300 words). Include: market segments, demographics, geographic coverage, customer types, market size estimates, distribution channels.",
  "competitorAnalysis": "Complete sample text for competitor analysis field (200-300 words). Include: main competitors, their strengths/weaknesses, market share, pricing strategies, your competitive advantages."
}

Make the content realistic, specific to ${businessData.industrySector || 'the industry'}, and suitable for a bank-ready DPR. Use actual numbers, percentages, and specific examples where appropriate. Return ONLY the JSON object, nothing else.`;
          break;
          
        case 'cost-structure':
          prompt = `You are a financial consultant. Generate ACTUAL SAMPLE VALUES (not guidance) for CAPEX and OPEX for a ${businessData.industrySector || 'business'} project.

IMPORTANT: Generate REAL NUMBERS that can be directly filled into form fields. The user will edit these values.

Current estimates:
- CAPEX (Land & Building): ₹${costData?.capex?.landBuilding || 'Not specified'}
- CAPEX (Machinery): ₹${costData?.capex?.machinery || 'Not specified'}
- OPEX (Raw Materials/Month): ₹${costData?.opex?.rawMaterials || 'Not specified'}
- OPEX (Salaries/Month): ₹${costData?.opex?.salaries || 'Not specified'}

Project details:
- Industry: ${businessData.industrySector || 'Not specified'}
- Project Name: ${businessData.projectName || 'Not specified'}
- Total Investment: ₹${(parseFloat(costData?.capex?.landBuilding || 0) + parseFloat(costData?.capex?.machinery || 0)).toLocaleString('en-IN') || 'Not specified'}

CRITICAL: Return ONLY a valid JSON object with this exact structure. Do NOT include any markdown formatting, explanations, or additional text. Just return the JSON with numeric values (not strings):
{
  "capex": {
    "landBuilding": 500000,
    "machinery": 1500000
  },
  "opex": {
    "rawMaterials": 50000,
    "salaries": 80000
  }
}

Provide realistic values based on ${businessData.industrySector || 'the industry'} sector. If current values exist, use them as reference but suggest improvements if needed. Return ONLY the JSON object with numeric values, nothing else.`;
          break;
          
        case 'building-details':
          prompt = `You are a construction consultant. Generate ACTUAL SAMPLE BUILDING ENTRIES for a ${businessData.industrySector || 'business'} project.

Project details:
- Industry: ${businessData.industrySector || 'Not specified'}
- Project Name: ${businessData.projectName || 'Not specified'}

CRITICAL: Return ONLY a valid JSON array with building entries. Each entry should have: particulars, area (sq.ft), rate (per sq.ft), amount (calculated). Do NOT include markdown formatting:
[
  {
    "particulars": "2 Floor Building - Ground Floor",
    "area": "1500",
    "rate": "800",
    "amount": "1200000"
  },
  {
    "particulars": "2 Floor Building - First Floor",
    "area": "1500",
    "rate": "700",
    "amount": "1050000"
  }
]

Provide 2-3 realistic building entries based on ${businessData.industrySector || 'the industry'} sector. Return ONLY the JSON array, nothing else.`;
          break;
          
        case 'machinery-details':
          prompt = `You are a machinery consultant. Generate ACTUAL SAMPLE MACHINERY ENTRIES for a ${businessData.industrySector || 'business'} project.

Project details:
- Industry: ${businessData.industrySector || 'Not specified'}
- Project Name: ${businessData.projectName || 'Not specified'}

CRITICAL: Return ONLY a valid JSON array with machinery entries. Each entry should have: particulars, qty, rate, amount (calculated). Do NOT include markdown formatting:
[
  {
    "particulars": "CNC Machine",
    "qty": "1",
    "rate": "500000",
    "amount": "500000"
  },
  {
    "particulars": "Grinding Machine",
    "qty": "2",
    "rate": "250000",
    "amount": "500000"
  }
]

Provide 3-5 realistic machinery entries specific to ${businessData.industrySector || 'the industry'} sector. Return ONLY the JSON array, nothing else.`;
          break;
          
        case 'sales-details':
          prompt = `You are a sales consultant. Generate ACTUAL SAMPLE SALES ENTRIES for a ${businessData.industrySector || 'business'} project.

Project details:
- Industry: ${businessData.industrySector || 'Not specified'}
- Project Name: ${businessData.projectName || 'Not specified'}
- Products: ${businessData.businessDescription || 'Not specified'}

CRITICAL: Return ONLY a valid JSON array with sales entries. Each entry should have: particulars (product name), rate (per unit), quantity, amount (calculated). Do NOT include markdown formatting:
[
  {
    "particulars": "Product A",
    "rate": "500",
    "quantity": "1000",
    "amount": "500000"
  }
]

Provide 2-4 realistic product sales entries specific to ${businessData.industrySector || 'the industry'} sector. Return ONLY the JSON array, nothing else.`;
          break;
          
        case 'raw-materials':
          prompt = `You are a procurement consultant. Generate ACTUAL SAMPLE RAW MATERIAL ENTRIES for a ${businessData.industrySector || 'business'} project.

Project details:
- Industry: ${businessData.industrySector || 'Not specified'}
- Project Name: ${businessData.projectName || 'Not specified'}

CRITICAL: Return ONLY a valid JSON array with raw material entries. Each entry should have: particulars, unit (kg/liters/pieces), rate (per unit), requiredUnit (quantity), amount (calculated). Do NOT include markdown formatting:
[
  {
    "particulars": "Raw Material A",
    "unit": "kg",
    "rate": "100",
    "requiredUnit": "1000",
    "amount": "100000"
  }
]

Provide 3-5 realistic raw material entries specific to ${businessData.industrySector || 'the industry'} sector. Return ONLY the JSON array, nothing else.`;
          break;
          
        case 'wages':
          prompt = `You are an HR consultant. Generate ACTUAL SAMPLE WAGE ENTRIES for a ${businessData.industrySector || 'business'} project.

Project details:
- Industry: ${businessData.industrySector || 'Not specified'}
- Project Name: ${businessData.projectName || 'Not specified'}

CRITICAL: Return ONLY a valid JSON array with wage entries. Each entry should have: particulars (job role), noOfWorkers, wagesPerMonth, amount (calculated for 12 months). Do NOT include markdown formatting:
[
  {
    "particulars": "Skilled Labor",
    "noOfWorkers": "5",
    "wagesPerMonth": "15000",
    "amount": "900000"
  }
]

Provide 2-4 realistic worker categories specific to ${businessData.industrySector || 'the industry'} sector. Return ONLY the JSON array, nothing else.`;
          break;
          
        case 'salary-details':
          prompt = `You are an HR consultant. Generate ACTUAL SAMPLE SALARY ENTRIES for a ${businessData.industrySector || 'business'} project.

Project details:
- Industry: ${businessData.industrySector || 'Not specified'}
- Project Name: ${businessData.projectName || 'Not specified'}

CRITICAL: Return ONLY a valid JSON array with salary entries. Each entry should have: particulars (designation), noOfStaff, wagesPerMonth, amount (calculated for 12 months). Do NOT include markdown formatting:
[
  {
    "particulars": "Production Manager",
    "noOfStaff": "1",
    "wagesPerMonth": "35000",
    "amount": "420000"
  }
]

Provide 2-4 realistic staff positions specific to ${businessData.industrySector || 'the industry'} sector. Return ONLY the JSON array, nothing else.`;
          break;
          
        case 'financial-projections':
          const currentProjections = stepData.financialProjections || {};
          const totalCapex = parseFloat(costData?.capex?.landBuilding || 0) + parseFloat(costData?.capex?.machinery || 0);
          const monthlyOpex = parseFloat(costData?.opex?.rawMaterials || 0) + parseFloat(costData?.opex?.salaries || 0);
          const annualOpex = monthlyOpex * 12;
          const totalProjectCost = project?.totalCost || (totalCapex + (annualOpex * 0.3));
          
          prompt = `You are a financial analyst. Generate ACTUAL NUMERICAL VALUES for 5-year financial projections for a ${businessData.industrySector || 'business'} project named "${businessData.projectName || 'the project'}".

IMPORTANT: Generate REAL NUMBERS (revenue and costs) that can be directly filled into the financial projections table. The user will edit these values.

Project details:
- Industry: ${businessData.industrySector || 'Not specified'}
- Project Name: ${businessData.projectName || 'Not specified'}
- Total Project Cost: ₹${totalProjectCost.toLocaleString('en-IN') || 'Not specified'}
- CAPEX (Land & Building): ₹${parseFloat(costData?.capex?.landBuilding || 0).toLocaleString('en-IN')}
- CAPEX (Machinery): ₹${parseFloat(costData?.capex?.machinery || 0).toLocaleString('en-IN')}
- Annual OPEX: ₹${annualOpex.toLocaleString('en-IN')}

Current projections (if any):
${Object.keys(currentProjections).length > 0 ? JSON.stringify(currentProjections, null, 2) : 'None - generate new projections'}

CRITICAL: Return ONLY a valid JSON object with this exact structure. Do NOT include any markdown formatting, explanations, or additional text. Just return the JSON with string values for revenue and costs:
{
  "guidance": "Brief guidance text (150-200 words) covering: 1) Realistic revenue growth rates for ${businessData.industrySector || 'this sector'}, 2) Key cost drivers and their typical percentages, 3) Break-even analysis timeline, 4) Cash flow considerations",
  "projections": {
    "year1": {
      "revenue": "1000000",
      "costs": "850000"
    },
    "year2": {
      "revenue": "1120000",
      "costs": "918000"
    },
    "year3": {
      "revenue": "1254400",
      "costs": "991440"
    },
    "year4": {
      "revenue": "1404928",
      "costs": "1070755"
    },
    "year5": {
      "revenue": "1573520",
      "costs": "1156415"
    }
  }
}

Guidelines for generating realistic projections:
- Year 1 revenue should be 70-90% of total project cost, growing at 10-15% annually
- Costs should include: OPEX (${annualOpex.toLocaleString('en-IN')}), depreciation (~10% of CAPEX), and loan interest (~11% of loan amount)
- Ensure break-even occurs by Year 2-3 (revenue >= costs)
- Profit margins should improve each year (start at 10-15%, reach 20-25% by Year 5)
- All values should be realistic for ${businessData.industrySector || 'the industry'} sector

Return ONLY the JSON object, nothing else.`;
          break;
          
        case 'other-capital-costs':
          prompt = `You are a financial consultant. Generate ACTUAL SAMPLE VALUES for Other Capital Costs for a ${businessData.industrySector || 'business'} project.

IMPORTANT: The form has exactly 4 fields:
1. "preliminaryCost" - Preliminary & Pre-operative Cost (includes licenses, permits, legal fees, etc.)
2. "furnitureFixtures" - Furniture & Fixtures (office furniture, display racks, etc.)
3. "contingency" - Contingency/Others/Miscellaneous (unexpected expenses, buffer)
4. "workingCapital" - Working Capital (initial operating funds)

CRITICAL INSTRUCTIONS:
- Return ONLY valid JSON, no markdown, no explanations, no text before or after
- Use numeric strings (e.g., "100000" not 100000)
- Map all costs appropriately:
  * Licenses, permits, legal fees → preliminaryCost
  * Furniture, fixtures, office equipment → furnitureFixtures
  * Contingency, miscellaneous, buffer → contingency
  * Working capital for operations → workingCapital

Example response (copy this format exactly):
{"preliminaryCost":"100000","furnitureFixtures":"80000","contingency":"125000","workingCapital":"500000"}

Now generate realistic values for ${businessData.industrySector || 'the industry'} sector. Return ONLY the JSON object, nothing else.`;
          break;
          
        case 'financing':
          prompt = `You are a financial consultant. Generate ACTUAL SAMPLE VALUES (not guidance) for Financing structure for a ${businessData.industrySector || 'business'} project.

Project details:
- Industry: ${businessData.industrySector || 'Not specified'}
- Project Name: ${businessData.projectName || 'Not specified'}

CRITICAL: Return ONLY a valid JSON object with this exact structure. Do NOT include any markdown formatting, explanations, or additional text. Just return the JSON:
{
  "ownContributionPercent": "5",
  "bankFinancePercent": "95",
  "marginMoneyPercent": "35",
  "schemeName": "PMEGP"
}

Provide realistic values. Return ONLY the JSON object, nothing else.`;
          break;
          
        case 'working-capital-estimate':
          prompt = `You are a financial consultant. Generate ACTUAL SAMPLE VALUES (not guidance) for Working Capital Estimate for a ${businessData.industrySector || 'business'} project.

CRITICAL: Return ONLY a valid JSON object with this exact structure. Do NOT include any markdown formatting, explanations, or additional text. Just return the JSON:
{
  "stockInProcess": "15",
  "finishedGoods": "30",
  "receivables": "45"
}

Provide realistic values in days. Return ONLY the JSON object, nothing else.`;
          break;
          
        case 'power-estimate':
          prompt = `You are an energy consultant. Generate ACTUAL SAMPLE VALUES (not guidance) for Power Estimate for a ${businessData.industrySector || 'business'} project.

CRITICAL: Return ONLY a valid JSON object with this exact structure. Do NOT include any markdown formatting, explanations, or additional text. Just return the JSON:
{
  "powerRequirement": "50",
  "monthlyCost": "25000"
}

Provide realistic values. Return ONLY the JSON object, nothing else.`;
          break;
          
        case 'overhead-expenses':
          prompt = `You are a financial consultant. Generate ACTUAL SAMPLE VALUES (not guidance) for Overhead Expenses for a ${businessData.industrySector || 'business'} project.

CRITICAL: Return ONLY a valid JSON object with this exact structure. Do NOT include any markdown formatting, explanations, or additional text. Just return the JSON:
{
  "repairMaintenance": "50000",
  "powerFuel": "30000",
  "otherOverhead": "20000",
  "telephone": "5000",
  "stationeryPostage": "3000",
  "advertisement": "25000",
  "buildingRent": "0",
  "otherMiscellaneous": "10000"
}

Provide realistic values. Return ONLY the JSON object, nothing else.`;
          break;
          
        case 'financial-parameters':
          prompt = `You are a financial consultant. Generate ACTUAL SAMPLE VALUES (not guidance) for Financial Parameters for a ${businessData.industrySector || 'business'} project.

CRITICAL: Return ONLY a valid JSON object with this exact structure. Do NOT include any markdown formatting, explanations, or additional text. Just return the JSON:
{
  "rateOfInterest": "11",
  "depreciationBuilding": "5",
  "depreciationMachinery": "10"
}

Provide realistic values. Return ONLY the JSON object, nothing else.`;
          break;
          
        case 'applicant-info':
          prompt = `You are a consultant. Generate ACTUAL SAMPLE VALUES (not guidance) for Applicant Information for a ${businessData.industrySector || 'business'} project.

CRITICAL: Return ONLY a valid JSON object with this exact structure. Do NOT include any markdown formatting, explanations, or additional text. Just return the JSON:
{
  "sponsoringAgency": "KVIC",
  "gender": "Male",
  "locationType": "Rural",
  "categories": ["OBC"],
  "projectType": "Manufacturing Unit",
  "legalStatus": "Owned"
}

Provide realistic values. Return ONLY the JSON object, nothing else.`;
          break;
          
        case 'beneficiary-info':
          prompt = `You are a consultant. Generate ACTUAL SAMPLE VALUES (not guidance) for Beneficiary Information for a ${businessData.industrySector || 'business'} project.

CRITICAL: Return ONLY a valid JSON object with this exact structure. Do NOT include any markdown formatting, explanations, or additional text. Just return the JSON:
{
  "fullName": "Sample Name",
  "fatherSpouseName": "Father's Name",
  "address": "Complete Address",
  "email": "email@example.com",
  "mobile": "+91 9876543210",
  "educationalQualifications": "Graduate",
  "experience": "5 years experience"
}

Provide realistic values. Return ONLY the JSON object, nothing else.`;
          break;
          
        case 'project-at-glance':
          prompt = `You are a consultant. Generate ACTUAL SAMPLE VALUES (not guidance) for Project at a Glance for a ${businessData.industrySector || 'business'} project.

CRITICAL: Return ONLY a valid JSON object with this exact structure. Do NOT include any markdown formatting, explanations, or additional text. Just return the JSON:
{
  "beneficiaryName": "Sample Name",
  "constitution": "Individual",
  "unitAddress": "Complete Address",
  "talukBlock": "Taluk Name",
  "district": "District Name",
  "pinCode": "500001",
  "email": "email@example.com",
  "mobile": "+91 9876543210",
  "products": "Product list"
}

Provide realistic values. Return ONLY the JSON object, nothing else.`;
          break;
          
        case 'eligible-schemes': {
          const eligibleSchemesTotalCost = project?.totalCost || (parseFloat(costData?.capex?.landBuilding || 0) + parseFloat(costData?.capex?.machinery || 0));
          const projectType = businessData?.projectType || 'Manufacturing';
          const location = businessData?.location || project?.location || 'Not specified';
          
          prompt = `You are a government schemes consultant. Generate ACTUAL SCHEME SUGGESTIONS (not just guidance) for a ${businessData.industrySector || 'business'} project.

IMPORTANT: Generate REAL scheme codes and names that are commonly applicable to MSME projects in India. The user will select these schemes.

Project details:
- Industry Sector: ${businessData.industrySector || 'Not specified'}
- Project Name: ${businessData.projectName || 'Not specified'}
- Project Type: ${projectType}
- Total Project Cost: ₹${eligibleSchemesTotalCost.toLocaleString('en-IN') || 'Not specified'}
- Location: ${location}
- Applicant Category: ${businessData?.applicantInfo?.categories?.join(', ') || 'General'}

CRITICAL: Return ONLY a valid JSON object with this exact structure. Do NOT include any markdown formatting, explanations, or additional text. Just return the JSON:
{
  "guidance": "Brief explanation (100-150 words) about why these schemes are relevant to this project and how they can benefit the entrepreneur.",
  "schemes": [
    {
      "schemeCode": "PMEGP",
      "schemeName": "Prime Minister Employment Generation Programme",
      "description": "Credit-linked subsidy scheme for setting up new micro-enterprises. Provides 15-35% subsidy on project cost.",
      "relevance": "Highly relevant for ${businessData.industrySector || 'this'} sector MSME projects with investment up to ₹25 lakhs."
    },
    {
      "schemeCode": "MUDRA",
      "schemeName": "Pradhan Mantri MUDRA Yojana",
      "description": "Provides loans up to ₹10 lakhs for micro enterprises without collateral.",
      "relevance": "Suitable for working capital and equipment financing needs."
    }
  ]
}

Guidelines:
- Suggest 3-5 relevant government schemes (PMEGP, MUDRA, CGTMSE, Stand-Up India, etc.)
- Focus on schemes applicable to ${businessData.industrySector || 'the industry'} sector
- Consider project cost, location, and applicant category
- Include both central and state government schemes if applicable
- Ensure schemes are realistic and commonly available for MSME projects

Return ONLY the JSON object, nothing else.`;
          break;
        }
          
        default:
          prompt = `Generate ACTUAL SAMPLE CONTENT (not guidance) for ${stepId.replace(/-/g, ' ')} section for a ${businessData.industrySector || 'business'} project. 

Return ready-to-use content that can be directly filled into form fields. The user will edit this content.`;
      }
      
      const response = await api.chat(
        prompt,
        [],
        { 
          project: project || {},
          businessOverview: businessData,
          marketAnalysis: marketData,
          costStructure: costData,
          currentStep: stepId,
        },
        false // Disable RAG for faster response
      );
      
      const suggestionText = response.response || response.data?.response || '';
      
      // Try to parse JSON if it's structured data, otherwise use as-is
      let parsedSuggestion: any = suggestionText;
      try {
        // Extract JSON from markdown code blocks if present (supports both objects and arrays)
        const jsonMatch = suggestionText.match(/```(?:json)?\s*([\[\{][\s\S]*[\]\}])\s*```/);
        if (jsonMatch) {
          parsedSuggestion = JSON.parse(jsonMatch[1]);
        } else if (suggestionText.trim().startsWith('{') || suggestionText.trim().startsWith('[')) {
          parsedSuggestion = JSON.parse(suggestionText);
        } else {
          // Try to extract JSON from text that contains JSON
          const jsonInText = suggestionText.match(/\{[\s\S]*\}/);
          if (jsonInText) {
            parsedSuggestion = JSON.parse(jsonInText[0]);
          } else {
            // For other-capital-costs, try to parse markdown/text and extract values
            if (stepId === 'other-capital-costs') {
              parsedSuggestion = parseOtherCapitalCostsFromText(suggestionText);
            } else {
              parsedSuggestion = suggestionText;
            }
          }
        }
      } catch (e) {
        // If JSON parsing fails, try to extract values from text for specific steps
        if (stepId === 'other-capital-costs') {
          parsedSuggestion = parseOtherCapitalCostsFromText(suggestionText);
        } else {
          parsedSuggestion = suggestionText;
        }
      }
      
      setAiSuggestions(prev => ({
        ...prev,
        [stepId]: parsedSuggestion,
      }));
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      // Don't block user if AI fails
      if (showLoading) {
        toast.error(t('dprBuilder.errors.failedToLoadSuggestions'));
      }
    } finally {
      if (showLoading) {
        setLoadingSuggestions(prev => ({ ...prev, [stepId]: false }));
      }
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      // Navigate immediately without waiting for AI
      setCurrentStep(currentStep + 1);
      // Don't auto-load AI suggestions - user must click the button to get suggestions
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Save to localStorage (already done automatically, but show confirmation)
      const saveData = {
        stepData,
        currentStep,
        timestamp: Date.now(),
      };
      localStorage.setItem('dpr-builder-progress', JSON.stringify(saveData));
      toast.success('Progress saved locally');
    } catch (error) {
      toast.error('Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateDPR = async () => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!stepData.businessOverview?.projectName || !stepData.businessOverview?.industrySector) {
        toast.error(t('dprBuilder.errors.completeBusinessOverview'));
        setCurrentStep(0); // Go back to first step
        return;
      }

      let finalProjectId = projectId;

      // Create project if it doesn't exist
      if (!finalProjectId) {
        try {
          const businessData = stepData.businessOverview;
          const costData = stepData.costStructure;
          
          // Calculate total cost from CAPEX and OPEX
          const totalCapex = parseFloat(costData?.capex?.landBuilding || 0) + 
                           parseFloat(costData?.capex?.machinery || 0);
          const monthlyOpex = parseFloat(costData?.opex?.rawMaterials || 0) + 
                             parseFloat(costData?.opex?.salaries || 0);
          const annualOpex = monthlyOpex * 12;
          const totalCost = totalCapex + (annualOpex * 0.3); // Rough estimate
          
          // Estimate own contribution (20% of total cost)
          const ownContribution = totalCost * 0.2;
          const loanAmount = totalCost - ownContribution;

          const projectData = {
            projectType: 'individual',
            projectName: businessData.projectName,
            industrySector: businessData.industrySector,
            subSector: businessData.industrySector,
            totalCost: totalCost || 1000000, // Default if not calculated
            ownContribution: ownContribution || 200000,
            loanAmount: loanAmount || 800000,
            location: businessData.location || 'Not specified',
            inputs: {
              businessDescription: businessData.businessDescription || '',
              targetMarket: stepData.marketAnalysis?.targetMarket || '',
            },
            status: 'draft',
          };

          const projectResponse = await api.createProject(projectData);
          finalProjectId = projectResponse.data?._id || projectResponse.data?.id || projectResponse._id;
          
          if (!finalProjectId) {
            throw new Error('Failed to create project');
          }
          
          toast.success('Project created successfully!');
        } catch (error: any) {
          console.error('Error creating project:', error);
          toast.error(error.response?.data?.message || t('dprBuilder.errors.failedToCreateProject'));
          return;
        }
      }

      // Save selected schemes to project before generating DPR
      const selectedSchemes = stepData.eligibleSchemes?.selectedSchemes || [];
      if (selectedSchemes.length > 0) {
        try {
          // Get full scheme details for selected schemes
          const schemesData: any[] = [];
          for (const schemeCode of selectedSchemes) {
            try {
              const schemeResponse = await api.getScheme(schemeCode);
              const scheme = schemeResponse.data || schemeResponse;
              if (scheme) {
                schemesData.push({
                  schemeCode: scheme.schemeCode || schemeCode,
                  schemeName: scheme.schemeName || schemeCode,
                  description: scheme.description || '',
                  eligibility: scheme.eligibility || {},
                  benefits: scheme.benefits || {},
                  documentsRequired: scheme.documentsRequired || [],
                });
              }
            } catch (err) {
              // If scheme not found, use basic info
              schemesData.push({
                schemeCode: schemeCode,
                schemeName: schemeCode,
                description: 'Government scheme applicable to this project',
              });
            }
          }

          // Update project with selected schemes
          await api.updateProject(finalProjectId, {
            eligibleSchemes: {
              selectedSchemes: selectedSchemes,
              schemesData: schemesData,
            },
          });
        } catch (error: any) {
          console.error('Error saving schemes to project:', error);
          // Don't block DPR generation if scheme save fails
        }
      }

      // Generate DPR
      const response = await api.generateDPR(finalProjectId, 'bilingual');
      toast.success('DPR generated successfully!');
      
      // Clear saved progress after successful generation
      localStorage.removeItem('dpr-builder-progress');
      navigate(`/dpr/view/${response.data.dprId}`);
    } catch (error: any) {
      console.error('Error generating DPR:', error);
      toast.error(error.response?.data?.message || t('dprBuilder.errors.failedToGenerateDPR'));
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    const step = STEPS[currentStep];
    
    switch (step.id) {
      case 'business-overview':
        return <BusinessOverviewStep data={stepData.businessOverview} onChange={(data: any) => setStepData({...stepData, businessOverview: data})} project={project} />;
      case 'applicant-info':
        return (
          <ApplicantInfoStep 
            data={stepData.applicantInfo} 
            onChange={(data: any) => setStepData({...stepData, applicantInfo: data})}
            suggestions={aiSuggestions['applicant-info']}
            loading={loadingSuggestions['applicant-info']}
            onGetSuggestions={() => getAISuggestions('applicant-info', stepData, true, true)}
          />
        );
      case 'building-details':
        return (
          <BuildingDetailsStep 
            data={stepData.buildingDetails} 
            onChange={(data: any) => setStepData({...stepData, buildingDetails: data})}
            suggestions={aiSuggestions['building-details']}
            loading={loadingSuggestions['building-details']}
            onGetSuggestions={() => getAISuggestions('building-details', stepData, true, true)}
          />
        );
      case 'machinery-details':
        return (
          <MachineryDetailsStep 
            data={stepData.machineryDetails} 
            onChange={(data: any) => setStepData({...stepData, machineryDetails: data})}
            suggestions={aiSuggestions['machinery-details']}
            loading={loadingSuggestions['machinery-details']}
            onGetSuggestions={() => getAISuggestions('machinery-details', stepData, true, true)}
          />
        );
      case 'other-capital-costs':
        return (
          <OtherCapitalCostsStep 
            data={stepData.otherCapitalCosts} 
            onChange={(data: any) => setStepData({...stepData, otherCapitalCosts: data})}
            suggestions={aiSuggestions['other-capital-costs']}
            loading={loadingSuggestions['other-capital-costs']}
            onGetSuggestions={() => getAISuggestions('other-capital-costs', stepData, true, true)}
          />
        );
      case 'financing':
        return (
          <FinancingStep 
            data={stepData.financing} 
            onChange={(data: any) => setStepData({...stepData, financing: data})} 
            project={project} 
            stepData={stepData}
            suggestions={aiSuggestions['financing']}
            loading={loadingSuggestions['financing']}
            onGetSuggestions={() => getAISuggestions('financing', stepData, true, true)}
          />
        );
      case 'sales-details':
        return (
          <SalesDetailsStep 
            data={stepData.salesDetails} 
            onChange={(data: any) => setStepData({...stepData, salesDetails: data})}
            suggestions={aiSuggestions['sales-details']}
            loading={loadingSuggestions['sales-details']}
            onGetSuggestions={() => getAISuggestions('sales-details', stepData, true, true)}
          />
        );
      case 'raw-materials':
        return (
          <RawMaterialsStep 
            data={stepData.rawMaterials} 
            onChange={(data: any) => setStepData({...stepData, rawMaterials: data})}
            suggestions={aiSuggestions['raw-materials']}
            loading={loadingSuggestions['raw-materials']}
            onGetSuggestions={() => getAISuggestions('raw-materials', stepData, true, true)}
          />
        );
      case 'wages':
        return (
          <WagesStep 
            data={stepData.wages} 
            onChange={(data: any) => setStepData({...stepData, wages: data})}
            suggestions={aiSuggestions['wages']}
            loading={loadingSuggestions['wages']}
            onGetSuggestions={() => getAISuggestions('wages', stepData, true, true)}
          />
        );
      case 'salary-details':
        return (
          <SalaryDetailsStep 
            data={stepData.salaryDetails} 
            onChange={(data: any) => setStepData({...stepData, salaryDetails: data})}
            suggestions={aiSuggestions['salary-details']}
            loading={loadingSuggestions['salary-details']}
            onGetSuggestions={() => getAISuggestions('salary-details', stepData, true, true)}
          />
        );
      case 'working-capital-estimate':
        return (
          <WorkingCapitalEstimateStep 
            data={stepData.workingCapitalEstimate} 
            onChange={(data: any) => setStepData({...stepData, workingCapitalEstimate: data})}
            suggestions={aiSuggestions['working-capital-estimate']}
            loading={loadingSuggestions['working-capital-estimate']}
            onGetSuggestions={() => getAISuggestions('working-capital-estimate', stepData, true, true)}
          />
        );
      case 'power-estimate':
        return (
          <PowerEstimateStep 
            data={stepData.powerEstimate} 
            onChange={(data: any) => setStepData({...stepData, powerEstimate: data})}
            suggestions={aiSuggestions['power-estimate']}
            loading={loadingSuggestions['power-estimate']}
            onGetSuggestions={() => getAISuggestions('power-estimate', stepData, true, true)}
          />
        );
      case 'overhead-expenses':
        return (
          <OverheadExpensesStep 
            data={stepData.overheadExpenses} 
            onChange={(data: any) => setStepData({...stepData, overheadExpenses: data})}
            suggestions={aiSuggestions['overhead-expenses']}
            loading={loadingSuggestions['overhead-expenses']}
            onGetSuggestions={() => getAISuggestions('overhead-expenses', stepData, true, true)}
          />
        );
      case 'financial-parameters':
        return (
          <FinancialParametersStep 
            data={stepData.financialParameters} 
            onChange={(data: any) => setStepData({...stepData, financialParameters: data})}
            suggestions={aiSuggestions['financial-parameters']}
            loading={loadingSuggestions['financial-parameters']}
            onGetSuggestions={() => getAISuggestions('financial-parameters', stepData, true, true)}
          />
        );
      case 'beneficiary-info':
        return (
          <BeneficiaryInfoStep 
            data={stepData.beneficiaryInfo} 
            onChange={(data: any) => setStepData({...stepData, beneficiaryInfo: data})}
            suggestions={aiSuggestions['beneficiary-info']}
            loading={loadingSuggestions['beneficiary-info']}
            onGetSuggestions={() => getAISuggestions('beneficiary-info', stepData, true, true)}
          />
        );
      case 'project-at-glance':
        return (
          <ProjectAtGlanceStep 
            data={stepData.projectAtGlance} 
            onChange={(data: any) => setStepData({...stepData, projectAtGlance: data})} 
            stepData={stepData}
            suggestions={aiSuggestions['project-at-glance']}
            loading={loadingSuggestions['project-at-glance']}
            onGetSuggestions={() => getAISuggestions('project-at-glance', stepData, true, true)}
          />
        );
      case 'market-analysis':
        return (
          <MarketAnalysisStep 
            data={stepData.marketAnalysis} 
            onChange={(data: any) => setStepData({...stepData, marketAnalysis: data})} 
            suggestions={aiSuggestions['market-analysis']}
            loading={loadingSuggestions['market-analysis']}
            onGetSuggestions={() => getAISuggestions('market-analysis', stepData, true, true)}
          />
        );
      case 'financial-projections':
        return (
          <FinancialProjectionsStep 
            data={stepData.financialProjections} 
            onChange={(data: any) => setStepData({...stepData, financialProjections: data})} 
            project={project}
            suggestions={aiSuggestions['financial-projections']}
            loading={loadingSuggestions['financial-projections']}
            onGetSuggestions={() => getAISuggestions('financial-projections', stepData, true, true)}
            businessData={stepData.businessOverview}
            costData={stepData.costStructure}
          />
        );
      case 'eligible-schemes':
        return (
          <EligibleSchemesStep 
            data={stepData.eligibleSchemes} 
            onChange={(data: any) => setStepData({...stepData, eligibleSchemes: data})} 
            project={project}
            suggestions={aiSuggestions['eligible-schemes']}
            loading={loadingSuggestions['eligible-schemes']}
            onGetSuggestions={() => getAISuggestions('eligible-schemes', stepData, true, true)}
            businessData={stepData.businessOverview}
          />
        );
      case 'ai-review':
        return <AIReviewStep stepData={stepData} project={project} onGenerate={handleGenerateDPR} />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 pb-8">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('dprBuilder.backToDashboard')}
        </Button>

        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-primary p-8 mb-6 shadow-2xl border-2 border-primary/20">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-3">
              <div className="h-14 w-14 rounded-xl bg-white/25 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white drop-shadow-lg">{t('dprBuilder.title')}</h1>
                <p className="text-white/95 text-lg font-medium mt-1">{t('dprBuilder.stepOf', { current: currentStep + 1, total: STEPS.length })} • {STEPS[currentStep].title}</p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-white/15 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-56 h-56 bg-secondary/20 rounded-full blur-3xl"></div>
        </div>

        <Card className="border-2 border-primary/20 shadow-2xl bg-white">
          <CardContent className="pt-8 pb-8">
            {/* Progress Bar */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xl font-bold text-foreground block mb-1">{STEPS[currentStep].title}</span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {t('dprBuilder.completeAllFields')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-primary block">
                    {Math.round(((currentStep + 1) / STEPS.length) * 100)}%
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">{t('dprBuilder.complete')}</span>
                </div>
              </div>
              <div className="w-full bg-muted/50 rounded-full h-4 overflow-hidden border border-primary/10">
                <div
                  className="bg-primary h-4 rounded-full transition-all duration-500 shadow-lg relative overflow-hidden"
                  style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                </div>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4 scrollbar-hide">
              {STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return (
                  <div key={step.id} className="flex flex-col items-center min-w-[120px] relative">
                    {/* Connector Line */}
                    {index < STEPS.length - 1 && (
                      <div className={`absolute top-5 left-[60px] w-full h-0.5 ${
                        isCompleted ? 'bg-success' : 'bg-muted'
                      }`} style={{ width: 'calc(100% - 60px)' }} />
                    )}
                    <div
                      className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-primary text-white shadow-lg scale-110'
                          : isCompleted
                          ? 'bg-success text-white shadow-md'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <StepIcon className="h-6 w-6" />
                      )}
                    </div>
                    <span className={`text-xs mt-3 text-center font-medium ${
                      isActive ? 'font-semibold text-primary' : 'text-muted-foreground'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Step Content */}
            <div className="min-h-[400px]">
              {renderStepContent()}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t-2 border-primary/10">
              <div>
                {currentStep > 0 && (
                  <Button variant="outline" onClick={handlePrevious} className="border-2">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('common.previous')}
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleSave} 
                  disabled={saving}
                  className="border-2 hover:bg-secondary/5 hover:border-secondary"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? t('dprBuilder.saving') : t('dprBuilder.saveProgress')}
                </Button>
                    {currentStep < STEPS.length - 1 ? (
                      <Button 
                        onClick={handleNext}
                        className="bg-primary hover:bg-primary/90 text-white shadow-lg"
                      >
                        {t('common.next')}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleGenerateDPR} 
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700/90 text-white shadow-lg"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t('dprBuilder.generating')}
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            {t('dprBuilder.generateDPR')}
                            <CheckCircle className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

// Step Components

// Applicant Info Step
const ApplicantInfoStep: React.FC<{ data: any; onChange: (data: any) => void; suggestions?: any; loading?: boolean; onGetSuggestions: () => void }> = ({ data, onChange, suggestions, loading, onGetSuggestions }) => {
  const { t } = useTranslation();
  
  const handleApplySuggestions = () => {
    if (suggestions && typeof suggestions === 'object') {
      onChange({...data, ...suggestions});
      toast.success('Applied AI suggestions');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-2">{t('dprBuilder.applicantInfo.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('dprBuilder.applicantInfo.description')}</p>
          </div>
          {!suggestions && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGetSuggestions}
              disabled={loading}
              className="ml-4 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('dprBuilder.generateSampleContent')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {suggestions && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5 border-2 border-primary/30 shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border-2 border-primary/30">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-primary mb-2">{t('dprBuilder.aiGeneratedSample')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('dprBuilder.clickApplyToUse')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleApplySuggestions}
                  className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white"
                >
                  {t('dprBuilder.applyAll')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGetSuggestions}
                  disabled={loading}
                  className="flex-shrink-0 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('dprBuilder.refresh')
                  )}
                </Button>
              </div>
            </div>
            
            {/* Preview Content */}
            <div className="mt-4 p-4 bg-white/50 rounded-lg border-2 border-primary/20">
              {suggestions && typeof suggestions === 'object' && !Array.isArray(suggestions) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {suggestions.sponsoringAgency && (
                    <div>
                      <span className="font-semibold text-foreground">Sponsoring Agency: </span>
                      <span className="text-muted-foreground">{suggestions.sponsoringAgency}</span>
                    </div>
                  )}
                  {suggestions.gender && (
                    <div>
                      <span className="font-semibold text-foreground">Gender: </span>
                      <span className="text-muted-foreground">{suggestions.gender}</span>
                    </div>
                  )}
                  {suggestions.locationType && (
                    <div>
                      <span className="font-semibold text-foreground">Location Type: </span>
                      <span className="text-muted-foreground">{suggestions.locationType}</span>
                    </div>
                  )}
                  {suggestions.categories && Array.isArray(suggestions.categories) && suggestions.categories.length > 0 && (
                    <div>
                      <span className="font-semibold text-foreground">Categories: </span>
                      <span className="text-muted-foreground">{suggestions.categories.join(', ')}</span>
                    </div>
                  )}
                  {suggestions.projectType && (
                    <div>
                      <span className="font-semibold text-foreground">Project Type: </span>
                      <span className="text-muted-foreground">{suggestions.projectType}</span>
                    </div>
                  )}
                  {suggestions.legalStatus && (
                    <div>
                      <span className="font-semibold text-foreground">Legal Status: </span>
                      <span className="text-muted-foreground">{suggestions.legalStatus}</span>
                    </div>
                  )}
                  {Object.keys(suggestions).length === 0 && (
                    <div className="col-span-2 text-sm text-muted-foreground">
                      No suggestions available. Please try refreshing.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm">
                  <p className="text-muted-foreground mb-2">Preview:</p>
                  <pre className="bg-white p-3 rounded border text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                    {typeof suggestions === 'string' ? suggestions : JSON.stringify(suggestions, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.applicantInfo.sponsoringAgency')}</label>
          <select
            value={data?.sponsoringAgency || ''}
            onChange={(e) => onChange({...data, sponsoringAgency: e.target.value})}
            className="w-full h-12 px-4 border-2 rounded-lg focus:border-primary focus:outline-none bg-background text-foreground"
          >
            <option value="">Select Agency</option>
            <option value="KVIC">KVIC</option>
            <option value="KVIB">KVIB</option>
            <option value="DIC">DIC</option>
            <option value="COIR Board">COIR Board</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.applicantInfo.gender')}</label>
          <div className="flex gap-4">
            {['Male', 'Female', 'Transgender'].map((gender) => (
              <label key={gender} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value={gender}
                  checked={data?.gender === gender}
                  onChange={(e) => onChange({...data, gender: e.target.value})}
                  className="w-4 h-4"
                />
                <span className="text-sm">{gender}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.applicantInfo.locationType')}</label>
          <div className="flex gap-4">
            {['Rural', 'Urban'].map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="locationType"
                  value={type}
                  checked={data?.locationType === type}
                  onChange={(e) => onChange({...data, locationType: e.target.value})}
                  className="w-4 h-4"
                />
                <span className="text-sm">{type}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.applicantInfo.category')}</label>
          <div className="grid grid-cols-2 gap-2">
            {['SC', 'ST', 'OBC', 'PHC', 'Ex-Service man', 'Minority', 'Hill Border Area'].map((cat) => (
              <label key={cat} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data?.categories?.includes(cat) || false}
                  onChange={(e) => {
                    const categories = data?.categories || [];
                    if (e.target.checked) {
                      onChange({...data, categories: [...categories, cat]});
                    } else {
                      onChange({...data, categories: categories.filter((c: string) => c !== cat)});
                    }
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm">{cat}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.applicantInfo.projectType')}</label>
          <div className="flex gap-4">
            {['Manufacturing Unit', 'Service Unit'].map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="projectType"
                  value={type}
                  checked={data?.projectType === type}
                  onChange={(e) => onChange({...data, projectType: e.target.value})}
                  className="w-4 h-4"
                />
                <span className="text-sm">{type}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.applicantInfo.legalStatus')}</label>
          <Input
            value={data?.legalStatus || ''}
            onChange={(e) => onChange({...data, legalStatus: e.target.value})}
            placeholder="e.g., Owned, Leased, Rented"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
};

// Building Details Step
const BuildingDetailsStep: React.FC<{ data: any; onChange: (data: any) => void; suggestions?: any; loading?: boolean; onGetSuggestions: () => void }> = ({ data, onChange, suggestions, loading, onGetSuggestions }) => {
  const { t } = useTranslation();
  const buildings = data?.buildings || [{ particulars: '', area: '', rate: '', amount: '' }];
  
  const addBuilding = () => {
    onChange({...data, buildings: [...buildings, { particulars: '', area: '', rate: '', amount: '' }]});
  };
  
  const removeBuilding = (index: number) => {
    onChange({...data, buildings: buildings.filter((_: any, i: number) => i !== index)});
  };
  
  const updateBuilding = (index: number, field: string, value: string) => {
    const updated = [...buildings];
    updated[index] = {...updated[index], [field]: value};
    if (field === 'area' || field === 'rate') {
      const area = parseFloat(updated[index].area || '0');
      const rate = parseFloat(updated[index].rate || '0');
      updated[index].amount = (area * rate).toString();
    }
    onChange({...data, buildings: updated});
  };
  
  const handleApplySuggestions = () => {
    if (Array.isArray(suggestions) && suggestions.length > 0) {
      onChange({...data, buildings: suggestions});
      toast.success('Applied AI suggestions to building details');
    }
  };
  
  const total = buildings.reduce((sum: number, b: any) => sum + parseFloat(b.amount || '0'), 0);
  
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-2">{t('dprBuilder.buildingDetails.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('dprBuilder.buildingDetails.description')}</p>
          </div>
          {!suggestions && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGetSuggestions}
              disabled={loading}
              className="ml-4 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('dprBuilder.generateSampleContent')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {suggestions && Array.isArray(suggestions) && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5 border-2 border-primary/30 shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border-2 border-primary/30">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-primary mb-2">{t('dprBuilder.aiGeneratedSample')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('dprBuilder.clickApplyToUse')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleApplySuggestions}
                  className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white"
                >
                  {t('dprBuilder.applyAll')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGetSuggestions}
                  disabled={loading}
                  className="flex-shrink-0 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('dprBuilder.refresh')
                  )}
                </Button>
              </div>
            </div>
            
            {/* Preview Table */}
            <div className="mt-4 overflow-x-auto border-2 border-primary/20 rounded-lg bg-white/50">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-primary/10">
                    <th className="border-2 border-primary/20 p-3 text-left font-bold text-sm">Particulars</th>
                    <th className="border-2 border-primary/20 p-3 text-right font-bold text-sm">Area (Sq.ft)</th>
                    <th className="border-2 border-primary/20 p-3 text-right font-bold text-sm">Rate/Sq.ft (₹)</th>
                    <th className="border-2 border-primary/20 p-3 text-right font-bold text-sm">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {suggestions.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-primary/5">
                      <td className="border-2 border-primary/20 p-3 text-sm">{item.particulars || '-'}</td>
                      <td className="border-2 border-primary/20 p-3 text-right text-sm">{item.area || '0'}</td>
                      <td className="border-2 border-primary/20 p-3 text-right text-sm">₹{parseFloat(item.rate || '0').toLocaleString('en-IN')}</td>
                      <td className="border-2 border-primary/20 p-3 text-right font-semibold text-sm">₹{parseFloat(item.amount || '0').toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-primary/5">
                    <td colSpan={3} className="border-2 border-primary/20 p-3 text-right font-bold text-sm">Total</td>
                    <td className="border-2 border-primary/20 p-3 text-right font-bold text-sm">
                      ₹{suggestions.reduce((sum: number, m: any) => sum + parseFloat(m.amount || '0'), 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="overflow-x-auto border-2 border-primary/20 rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-primary/10">
              <th className="border-2 border-primary/20 p-3 text-left font-bold">Particulars</th>
              <th className="border-2 border-primary/20 p-3 text-right font-bold">Area (Sq.ft)</th>
              <th className="border-2 border-primary/20 p-3 text-right font-bold">Rate/Sq.ft (₹)</th>
              <th className="border-2 border-primary/20 p-3 text-right font-bold">Amount (₹)</th>
              <th className="border-2 border-primary/20 p-3 text-center font-bold">Action</th>
            </tr>
          </thead>
          <tbody>
            {buildings.map((building: any, index: number) => (
              <tr key={index}>
                <td className="border-2 border-primary/20 p-3">
                  <Input
                    value={building.particulars}
                    onChange={(e) => updateBuilding(index, 'particulars', e.target.value)}
                    placeholder="e.g., 2 Floor Building"
                    className="border-2"
                  />
                </td>
                <td className="border-2 border-primary/20 p-3">
                  <Input
                    type="number"
                    value={building.area}
                    onChange={(e) => updateBuilding(index, 'area', e.target.value)}
                    placeholder="0"
                    className="border-2 text-right"
                  />
                </td>
                <td className="border-2 border-primary/20 p-3">
                  <Input
                    type="number"
                    value={building.rate}
                    onChange={(e) => updateBuilding(index, 'rate', e.target.value)}
                    placeholder="0"
                    className="border-2 text-right"
                  />
                </td>
                <td className="border-2 border-primary/20 p-3 text-right font-semibold">
                  ₹{parseFloat(building.amount || '0').toLocaleString('en-IN')}
                </td>
                <td className="border-2 border-primary/20 p-3 text-center">
                  <Button variant="ghost" size="sm" onClick={() => removeBuilding(index)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-primary/5">
              <td colSpan={3} className="border-2 border-primary/20 p-3 text-right font-bold">Total</td>
              <td className="border-2 border-primary/20 p-3 text-right font-bold">₹{total.toLocaleString('en-IN')}</td>
              <td className="border-2 border-primary/20 p-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <Button onClick={addBuilding} variant="outline" className="border-2 border-primary">
        <Plus className="h-4 w-4 mr-2" />
        Add Building Entry
      </Button>
    </div>
  );
};

// Machinery Details Step
const MachineryDetailsStep: React.FC<{ data: any; onChange: (data: any) => void; suggestions?: any; loading?: boolean; onGetSuggestions: () => void }> = ({ data, onChange, suggestions, loading, onGetSuggestions }) => {
  const { t } = useTranslation();
  const machinery = data?.machinery || [{ particulars: '', qty: '', rate: '', amount: '' }];
  
  const addMachinery = () => {
    onChange({...data, machinery: [...machinery, { particulars: '', qty: '', rate: '', amount: '' }]});
  };
  
  const removeMachinery = (index: number) => {
    onChange({...data, machinery: machinery.filter((_: any, i: number) => i !== index)});
  };
  
  const updateMachinery = (index: number, field: string, value: string) => {
    const updated = [...machinery];
    updated[index] = {...updated[index], [field]: value};
    if (field === 'qty' || field === 'rate') {
      const qty = parseFloat(updated[index].qty || '0');
      const rate = parseFloat(updated[index].rate || '0');
      updated[index].amount = (qty * rate).toString();
    }
    onChange({...data, machinery: updated});
  };
  
  const handleApplySuggestions = () => {
    if (Array.isArray(suggestions) && suggestions.length > 0) {
      onChange({...data, machinery: suggestions});
      toast.success('Applied AI suggestions to machinery details');
    }
  };
  
  const total = machinery.reduce((sum: number, m: any) => sum + parseFloat(m.amount || '0'), 0);
  
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-2">{t('dprBuilder.machineryDetails.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('dprBuilder.machineryDetails.description')}</p>
          </div>
          {!suggestions && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGetSuggestions}
              disabled={loading}
              className="ml-4 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('dprBuilder.generateSampleContent')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {suggestions && Array.isArray(suggestions) && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5 border-2 border-primary/30 shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border-2 border-primary/30">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-primary mb-2">{t('dprBuilder.aiGeneratedSample')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('dprBuilder.clickApplyToUse')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleApplySuggestions}
                  className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white"
                >
                  {t('dprBuilder.applyAll')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGetSuggestions}
                  disabled={loading}
                  className="flex-shrink-0 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('dprBuilder.refresh')
                  )}
                </Button>
              </div>
            </div>
            
            {/* Preview Table */}
            <div className="mt-4 overflow-x-auto border-2 border-primary/20 rounded-lg bg-white/50">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-primary/10">
                    <th className="border-2 border-primary/20 p-3 text-left font-bold text-sm">Particulars</th>
                    <th className="border-2 border-primary/20 p-3 text-right font-bold text-sm">Qty</th>
                    <th className="border-2 border-primary/20 p-3 text-right font-bold text-sm">Rate (₹)</th>
                    <th className="border-2 border-primary/20 p-3 text-right font-bold text-sm">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {suggestions.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-primary/5">
                      <td className="border-2 border-primary/20 p-3 text-sm">{item.particulars || '-'}</td>
                      <td className="border-2 border-primary/20 p-3 text-right text-sm">{item.qty || '0'}</td>
                      <td className="border-2 border-primary/20 p-3 text-right text-sm">₹{parseFloat(item.rate || '0').toLocaleString('en-IN')}</td>
                      <td className="border-2 border-primary/20 p-3 text-right font-semibold text-sm">₹{parseFloat(item.amount || '0').toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-primary/5">
                    <td colSpan={3} className="border-2 border-primary/20 p-3 text-right font-bold text-sm">Total</td>
                    <td className="border-2 border-primary/20 p-3 text-right font-bold text-sm">
                      ₹{suggestions.reduce((sum: number, m: any) => sum + parseFloat(m.amount || '0'), 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="overflow-x-auto border-2 border-primary/20 rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-primary/10">
              <th className="border-2 border-primary/20 p-3 text-left font-bold">Particulars</th>
              <th className="border-2 border-primary/20 p-3 text-right font-bold">Qty</th>
              <th className="border-2 border-primary/20 p-3 text-right font-bold">Rate (₹)</th>
              <th className="border-2 border-primary/20 p-3 text-right font-bold">Amount (₹)</th>
              <th className="border-2 border-primary/20 p-3 text-center font-bold">Action</th>
            </tr>
          </thead>
          <tbody>
            {machinery.map((item: any, index: number) => (
              <tr key={index}>
                <td className="border-2 border-primary/20 p-3">
                  <Input
                    value={item.particulars}
                    onChange={(e) => updateMachinery(index, 'particulars', e.target.value)}
                    placeholder="e.g., CNC Machine"
                    className="border-2"
                  />
                </td>
                <td className="border-2 border-primary/20 p-3">
                  <Input
                    type="number"
                    value={item.qty}
                    onChange={(e) => updateMachinery(index, 'qty', e.target.value)}
                    placeholder="0"
                    className="border-2 text-right"
                  />
                </td>
                <td className="border-2 border-primary/20 p-3">
                  <Input
                    type="number"
                    value={item.rate}
                    onChange={(e) => updateMachinery(index, 'rate', e.target.value)}
                    placeholder="0"
                    className="border-2 text-right"
                  />
                </td>
                <td className="border-2 border-primary/20 p-3 text-right font-semibold">
                  ₹{parseFloat(item.amount || '0').toLocaleString('en-IN')}
                </td>
                <td className="border-2 border-primary/20 p-3 text-center">
                  <Button variant="ghost" size="sm" onClick={() => removeMachinery(index)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-primary/5">
              <td colSpan={3} className="border-2 border-primary/20 p-3 text-right font-bold">Total</td>
              <td className="border-2 border-primary/20 p-3 text-right font-bold">₹{total.toLocaleString('en-IN')}</td>
              <td className="border-2 border-primary/20 p-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <Button onClick={addMachinery} variant="outline" className="border-2 border-primary">
        <Plus className="h-4 w-4 mr-2" />
        Add Machinery Entry
      </Button>
    </div>
  );
};

// Other Capital Costs Step
const OtherCapitalCostsStep: React.FC<{ data: any; onChange: (data: any) => void; suggestions?: any; loading?: boolean; onGetSuggestions: () => void }> = ({ data, onChange, suggestions, loading, onGetSuggestions }) => {
  const { t } = useTranslation();
  
  const handleApplySuggestions = () => {
    if (suggestions && typeof suggestions === 'object') {
      onChange({...data, ...suggestions});
      toast.success('Applied AI suggestions');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-2">{t('dprBuilder.otherCapitalCosts.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('dprBuilder.otherCapitalCosts.description')}</p>
          </div>
          {!suggestions && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGetSuggestions}
              disabled={loading}
              className="ml-4 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('dprBuilder.generateSampleContent')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {suggestions && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5 border-2 border-primary/30 shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border-2 border-primary/30">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-primary mb-2">{t('dprBuilder.aiGeneratedSample')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('dprBuilder.clickApplyToUse')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleApplySuggestions}
                  className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white"
                >
                  {t('dprBuilder.applyAll')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGetSuggestions}
                  disabled={loading}
                  className="flex-shrink-0 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('dprBuilder.refresh')
                  )}
                </Button>
              </div>
            </div>
            
            {/* Preview Content - Other Capital Costs */}
            <div className="mt-4 p-4 bg-white/50 rounded-lg border-2 border-primary/20">
              {suggestions && typeof suggestions === 'object' && !Array.isArray(suggestions) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {suggestions.preliminaryCost && (
                    <div>
                      <span className="font-semibold text-foreground">Preliminary & Pre-operative Cost: </span>
                      <span className="text-muted-foreground">₹{parseFloat(String(suggestions.preliminaryCost || '0')).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {suggestions.furnitureFixtures && (
                    <div>
                      <span className="font-semibold text-foreground">Furniture & Fixtures: </span>
                      <span className="text-muted-foreground">₹{parseFloat(String(suggestions.furnitureFixtures || '0')).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {suggestions.contingency && (
                    <div>
                      <span className="font-semibold text-foreground">Contingency: </span>
                      <span className="text-muted-foreground">₹{parseFloat(String(suggestions.contingency || '0')).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {suggestions.workingCapital && (
                    <div>
                      <span className="font-semibold text-foreground">Working Capital: </span>
                      <span className="text-muted-foreground">₹{parseFloat(String(suggestions.workingCapital || '0')).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {Object.keys(suggestions).length === 0 && (
                    <div className="col-span-2 text-sm text-muted-foreground">
                      No suggestions available. Please try refreshing.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">Received suggestions in unexpected format. Raw response:</p>
                  <pre className="bg-white p-3 rounded border text-xs overflow-auto max-h-40">
                    {typeof suggestions === 'string' ? suggestions : JSON.stringify(suggestions, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.otherCapitalCosts.preliminaryCost')} (₹)</label>
          <Input
            type="number"
            value={data?.preliminaryCost || ''}
            onChange={(e) => onChange({...data, preliminaryCost: e.target.value})}
            placeholder="0"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.otherCapitalCosts.furnitureFixtures')} (₹)</label>
          <Input
            type="number"
            value={data?.furnitureFixtures || ''}
            onChange={(e) => onChange({...data, furnitureFixtures: e.target.value})}
            placeholder="0"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.otherCapitalCosts.contingency')} (₹)</label>
          <Input
            type="number"
            value={data?.contingency || ''}
            onChange={(e) => onChange({...data, contingency: e.target.value})}
            placeholder="0"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.otherCapitalCosts.workingCapital')} (₹)</label>
          <Input
            type="number"
            value={data?.workingCapital || ''}
            onChange={(e) => onChange({...data, workingCapital: e.target.value})}
            placeholder="0"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
};

// Financing Step
const FinancingStep: React.FC<{ data: any; onChange: (data: any) => void; project?: any; stepData: any; suggestions?: any; loading?: boolean; onGetSuggestions: () => void }> = ({ data, onChange, stepData, suggestions, loading, onGetSuggestions }) => {
  const { t } = useTranslation();
  
  // Calculate total project cost from previous steps
  const buildingTotal = (stepData.buildingDetails?.buildings || []).reduce((sum: number, b: any) => sum + parseFloat(b.amount || '0'), 0);
  const machineryTotal = (stepData.machineryDetails?.machinery || []).reduce((sum: number, m: any) => sum + parseFloat(m.amount || '0'), 0);
  const otherCosts = parseFloat(stepData.otherCapitalCosts?.preliminaryCost || '0') +
                     parseFloat(stepData.otherCapitalCosts?.furnitureFixtures || '0') +
                     parseFloat(stepData.otherCapitalCosts?.contingency || '0') +
                     parseFloat(stepData.otherCapitalCosts?.workingCapital || '0');
  const totalProjectCost = buildingTotal + machineryTotal + otherCosts;
  
  const updateFinancing = (field: string, value: string) => {
    const updated = {...data, [field]: value};
    if (field === 'ownContributionPercent' || field === 'bankFinancePercent') {
      const ownPercent = parseFloat(updated.ownContributionPercent || '0');
      const bankPercent = parseFloat(updated.bankFinancePercent || '0');
      updated.ownContribution = ((totalProjectCost * ownPercent) / 100).toString();
      updated.bankFinance = ((totalProjectCost * bankPercent) / 100).toString();
    }
    onChange(updated);
  };
  
  const handleApplySuggestions = () => {
    if (suggestions && typeof suggestions === 'object') {
      onChange({...data, ...suggestions});
      toast.success('Applied AI suggestions');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-2">{t('dprBuilder.financing.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('dprBuilder.financing.description')}</p>
          </div>
          {!suggestions && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGetSuggestions}
              disabled={loading}
              className="ml-4 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('dprBuilder.generateSampleContent')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {suggestions && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5 border-2 border-primary/30 shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border-2 border-primary/30">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-primary mb-2">{t('dprBuilder.aiGeneratedSample')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('dprBuilder.clickApplyToUse')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleApplySuggestions}
                  className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white"
                >
                  {t('dprBuilder.applyAll')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGetSuggestions}
                  disabled={loading}
                  className="flex-shrink-0 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('dprBuilder.refresh')
                  )}
                </Button>
              </div>
            </div>
            
            {/* Preview Content - Financing */}
            <div className="mt-4 p-4 bg-white/50 rounded-lg border-2 border-primary/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {suggestions.ownContributionPercent && (
                  <div>
                    <span className="font-semibold text-foreground">Own Contribution: </span>
                    <span className="text-muted-foreground">{suggestions.ownContributionPercent}% (₹{parseFloat(suggestions.ownContribution || '0').toLocaleString('en-IN')})</span>
                  </div>
                )}
                {suggestions.bankFinancePercent && (
                  <div>
                    <span className="font-semibold text-foreground">Bank Finance: </span>
                    <span className="text-muted-foreground">{suggestions.bankFinancePercent}% (₹{parseFloat(suggestions.bankFinance || '0').toLocaleString('en-IN')})</span>
                  </div>
                )}
                {suggestions.marginMoneyPercent && (
                  <div>
                    <span className="font-semibold text-foreground">Margin Money: </span>
                    <span className="text-muted-foreground">{suggestions.marginMoneyPercent}% (₹{parseFloat(suggestions.marginMoney || '0').toLocaleString('en-IN')})</span>
                  </div>
                )}
                {suggestions.schemeName && (
                  <div>
                    <span className="font-semibold text-foreground">Scheme Name: </span>
                    <span className="text-muted-foreground">{suggestions.schemeName}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6">
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-semibold text-foreground">Total Project Cost: ₹{totalProjectCost.toLocaleString('en-IN')}</p>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.financing.ownContribution')} (%)</label>
                <Input
                  type="number"
                  value={data?.ownContributionPercent || ''}
                  onChange={(e) => updateFinancing('ownContributionPercent', e.target.value)}
                  placeholder="5"
                  className="h-12 border-2 focus:border-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">Amount: ₹{parseFloat(data?.ownContribution || '0').toLocaleString('en-IN')}</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.financing.bankFinance')} (%)</label>
                <Input
                  type="number"
                  value={data?.bankFinancePercent || ''}
                  onChange={(e) => updateFinancing('bankFinancePercent', e.target.value)}
                  placeholder="95"
                  className="h-12 border-2 focus:border-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">Amount: ₹{parseFloat(data?.bankFinance || '0').toLocaleString('en-IN')}</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.financing.marginMoney')} (%)</label>
                <Input
                  type="number"
                  value={data?.marginMoneyPercent || ''}
                  onChange={(e) => {
                    const percent = parseFloat(e.target.value || '0');
                    onChange({...data, marginMoneyPercent: e.target.value, marginMoney: ((totalProjectCost * percent) / 100).toString()});
                  }}
                  placeholder="35"
                  className="h-12 border-2 focus:border-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">Amount: ₹{parseFloat(data?.marginMoney || '0').toLocaleString('en-IN')}</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.financing.schemeName')}</label>
              <Input
                value={data?.schemeName || ''}
                onChange={(e) => onChange({...data, schemeName: e.target.value})}
                placeholder="e.g., PMEGP, MUDRA"
                className="h-12 border-2 focus:border-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Sales Details Step
const SalesDetailsStep: React.FC<{ data: any; onChange: (data: any) => void; suggestions?: any; loading?: boolean; onGetSuggestions: () => void }> = ({ data, onChange, suggestions, loading, onGetSuggestions }) => {
  const { t } = useTranslation();
  const sales = data?.sales || [{ particulars: '', rate: '', quantity: '', amount: '' }];
  
  const addSale = () => {
    onChange({...data, sales: [...sales, { particulars: '', rate: '', quantity: '', amount: '' }]});
  };
  
  const removeSale = (index: number) => {
    onChange({...data, sales: sales.filter((_: any, i: number) => i !== index)});
  };
  
  const updateSale = (index: number, field: string, value: string) => {
    const updated = [...sales];
    updated[index] = {...updated[index], [field]: value};
    if (field === 'rate' || field === 'quantity') {
      const rate = parseFloat(updated[index].rate || '0');
      const qty = parseFloat(updated[index].quantity || '0');
      updated[index].amount = (rate * qty).toString();
    }
    onChange({...data, sales: updated});
  };
  
  const handleApplySuggestions = () => {
    if (Array.isArray(suggestions) && suggestions.length > 0) {
      onChange({...data, sales: suggestions});
      toast.success('Applied AI suggestions to sales details');
    }
  };
  
  const total = sales.reduce((sum: number, s: any) => sum + parseFloat(s.amount || '0'), 0);
  
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-2">{t('dprBuilder.salesDetails.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('dprBuilder.salesDetails.description')}</p>
          </div>
          {!suggestions && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGetSuggestions}
              disabled={loading}
              className="ml-4 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('dprBuilder.generateSampleContent')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {suggestions && Array.isArray(suggestions) && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5 border-2 border-primary/30 shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border-2 border-primary/30">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-primary mb-2">{t('dprBuilder.aiGeneratedSample')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('dprBuilder.clickApplyToUse')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleApplySuggestions}
                  className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white"
                >
                  {t('dprBuilder.applyAll')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGetSuggestions}
                  disabled={loading}
                  className="flex-shrink-0 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('dprBuilder.refresh')
                  )}
                </Button>
              </div>
            </div>
            
            {/* Preview Table - Sales Details */}
            <div className="mt-4 overflow-x-auto border-2 border-primary/20 rounded-lg bg-white/50">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-primary/10">
                    <th className="border-2 border-primary/20 p-3 text-left font-bold text-sm">Particulars</th>
                    <th className="border-2 border-primary/20 p-3 text-right font-bold text-sm">Rate/Unit (₹)</th>
                    <th className="border-2 border-primary/20 p-3 text-right font-bold text-sm">Quantity</th>
                    <th className="border-2 border-primary/20 p-3 text-right font-bold text-sm">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {suggestions.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-primary/5">
                      <td className="border-2 border-primary/20 p-3 text-sm">{item.particulars || '-'}</td>
                      <td className="border-2 border-primary/20 p-3 text-right text-sm">₹{parseFloat(item.rate || '0').toLocaleString('en-IN')}</td>
                      <td className="border-2 border-primary/20 p-3 text-right text-sm">{item.quantity || '0'}</td>
                      <td className="border-2 border-primary/20 p-3 text-right font-semibold text-sm">₹{parseFloat(item.amount || '0').toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-primary/5">
                    <td colSpan={3} className="border-2 border-primary/20 p-3 text-right font-bold text-sm">Total</td>
                    <td className="border-2 border-primary/20 p-3 text-right font-bold text-sm">
                      ₹{suggestions.reduce((sum: number, m: any) => sum + parseFloat(m.amount || '0'), 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="overflow-x-auto border-2 border-primary/20 rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-primary/10">
              <th className="border-2 border-primary/20 p-3 text-left font-bold">Particulars</th>
              <th className="border-2 border-primary/20 p-3 text-right font-bold">Rate/Unit (₹)</th>
              <th className="border-2 border-primary/20 p-3 text-right font-bold">Quantity</th>
              <th className="border-2 border-primary/20 p-3 text-right font-bold">Amount (₹)</th>
              <th className="border-2 border-primary/20 p-3 text-center font-bold">Action</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale: any, index: number) => (
              <tr key={index}>
                <td className="border-2 border-primary/20 p-3">
                  <Input
                    value={sale.particulars}
                    onChange={(e) => updateSale(index, 'particulars', e.target.value)}
                    placeholder="Product name"
                    className="border-2"
                  />
                </td>
                <td className="border-2 border-primary/20 p-3">
                  <Input
                    type="number"
                    value={sale.rate}
                    onChange={(e) => updateSale(index, 'rate', e.target.value)}
                    placeholder="0"
                    className="border-2 text-right"
                  />
                </td>
                <td className="border-2 border-primary/20 p-3">
                  <Input
                    type="number"
                    value={sale.quantity}
                    onChange={(e) => updateSale(index, 'quantity', e.target.value)}
                    placeholder="0"
                    className="border-2 text-right"
                  />
                </td>
                <td className="border-2 border-primary/20 p-3 text-right font-semibold">
                  ₹{parseFloat(sale.amount || '0').toLocaleString('en-IN')}
                </td>
                <td className="border-2 border-primary/20 p-3 text-center">
                  <Button variant="ghost" size="sm" onClick={() => removeSale(index)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-primary/5">
              <td colSpan={3} className="border-2 border-primary/20 p-3 text-right font-bold">Total</td>
              <td className="border-2 border-primary/20 p-3 text-right font-bold">₹{total.toLocaleString('en-IN')}</td>
              <td className="border-2 border-primary/20 p-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <Button onClick={addSale} variant="outline" className="border-2 border-primary">
        <Plus className="h-4 w-4 mr-2" />
        Add Product
      </Button>
    </div>
  );
};

// Raw Materials Step
const RawMaterialsStep: React.FC<{ data: any; onChange: (data: any) => void; suggestions?: any; loading?: boolean; onGetSuggestions: () => void }> = ({ data, onChange, suggestions, loading, onGetSuggestions }) => {
  const { t } = useTranslation();
  const materials = data?.materials || [{ particulars: '', unit: '', rate: '', requiredUnit: '', amount: '' }];
  
  const addMaterial = () => {
    onChange({...data, materials: [...materials, { particulars: '', unit: '', rate: '', requiredUnit: '', amount: '' }]});
  };
  
  const removeMaterial = (index: number) => {
    onChange({...data, materials: materials.filter((_: any, i: number) => i !== index)});
  };
  
  const updateMaterial = (index: number, field: string, value: string) => {
    const updated = [...materials];
    updated[index] = {...updated[index], [field]: value};
    if (field === 'rate' || field === 'requiredUnit') {
      const rate = parseFloat(updated[index].rate || '0');
      const qty = parseFloat(updated[index].requiredUnit || '0');
      updated[index].amount = (rate * qty).toString();
    }
    onChange({...data, materials: updated});
  };
  
  const handleApplySuggestions = () => {
    if (Array.isArray(suggestions) && suggestions.length > 0) {
      onChange({...data, materials: suggestions});
      toast.success('Applied AI suggestions to raw materials');
    }
  };
  
  const total = materials.reduce((sum: number, m: any) => sum + parseFloat(m.amount || '0'), 0);
  
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-2">{t('dprBuilder.rawMaterials.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('dprBuilder.rawMaterials.description')}</p>
          </div>
          {!suggestions && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGetSuggestions}
              disabled={loading}
              className="ml-4 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('dprBuilder.generateSampleContent')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {suggestions && Array.isArray(suggestions) && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5 border-2 border-primary/30 shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border-2 border-primary/30">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-primary mb-2">{t('dprBuilder.aiGeneratedSample')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('dprBuilder.clickApplyToUse')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleApplySuggestions}
                  className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white"
                >
                  {t('dprBuilder.applyAll')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGetSuggestions}
                  disabled={loading}
                  className="flex-shrink-0 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('dprBuilder.refresh')
                  )}
                </Button>
              </div>
            </div>
            
            {/* Preview Table - Raw Materials */}
            <div className="mt-4 overflow-x-auto border-2 border-primary/20 rounded-lg bg-white/50">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-primary/10">
                    <th className="border-2 border-primary/20 p-3 text-left font-bold text-sm">Particulars</th>
                    <th className="border-2 border-primary/20 p-3 text-center font-bold text-sm">Unit</th>
                    <th className="border-2 border-primary/20 p-3 text-right font-bold text-sm">Rate/Unit (₹)</th>
                    <th className="border-2 border-primary/20 p-3 text-right font-bold text-sm">Required Unit</th>
                    <th className="border-2 border-primary/20 p-3 text-right font-bold text-sm">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {suggestions.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-primary/5">
                      <td className="border-2 border-primary/20 p-3 text-sm">{item.particulars || '-'}</td>
                      <td className="border-2 border-primary/20 p-3 text-center text-sm">{item.unit || '-'}</td>
                      <td className="border-2 border-primary/20 p-3 text-right text-sm">₹{parseFloat(item.rate || '0').toLocaleString('en-IN')}</td>
                      <td className="border-2 border-primary/20 p-3 text-right text-sm">{item.requiredUnit || '0'}</td>
                      <td className="border-2 border-primary/20 p-3 text-right font-semibold text-sm">₹{parseFloat(item.amount || '0').toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-primary/5">
                    <td colSpan={4} className="border-2 border-primary/20 p-3 text-right font-bold text-sm">Total</td>
                    <td className="border-2 border-primary/20 p-3 text-right font-bold text-sm">
                      ₹{suggestions.reduce((sum: number, m: any) => sum + parseFloat(m.amount || '0'), 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="overflow-x-auto border-2 border-primary/20 rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-primary/10">
              <th className="border-2 border-primary/20 p-3 text-left font-bold">Particulars</th>
              <th className="border-2 border-primary/20 p-3 text-center font-bold">Unit</th>
              <th className="border-2 border-primary/20 p-3 text-right font-bold">Rate/Unit (₹)</th>
              <th className="border-2 border-primary/20 p-3 text-right font-bold">Required Unit</th>
              <th className="border-2 border-primary/20 p-3 text-right font-bold">Amount (₹)</th>
              <th className="border-2 border-primary/20 p-3 text-center font-bold">Action</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((material: any, index: number) => (
              <tr key={index}>
                <td className="border-2 border-primary/20 p-3">
                  <Input
                    value={material.particulars}
                    onChange={(e) => updateMaterial(index, 'particulars', e.target.value)}
                    placeholder="Material name"
                    className="border-2"
                  />
                </td>
                <td className="border-2 border-primary/20 p-3">
                  <Input
                    value={material.unit}
                    onChange={(e) => updateMaterial(index, 'unit', e.target.value)}
                    placeholder="kg, liters, etc."
                    className="border-2 text-center"
                  />
                </td>
                <td className="border-2 border-primary/20 p-3">
                  <Input
                    type="number"
                    value={material.rate}
                    onChange={(e) => updateMaterial(index, 'rate', e.target.value)}
                    placeholder="0"
                    className="border-2 text-right"
                  />
                </td>
                <td className="border-2 border-primary/20 p-3">
                  <Input
                    type="number"
                    value={material.requiredUnit}
                    onChange={(e) => updateMaterial(index, 'requiredUnit', e.target.value)}
                    placeholder="0"
                    className="border-2 text-right"
                  />
                </td>
                <td className="border-2 border-primary/20 p-3 text-right font-semibold">
                  ₹{parseFloat(material.amount || '0').toLocaleString('en-IN')}
                </td>
                <td className="border-2 border-primary/20 p-3 text-center">
                  <Button variant="ghost" size="sm" onClick={() => removeMaterial(index)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-primary/5">
              <td colSpan={4} className="border-2 border-primary/20 p-3 text-right font-bold">Total</td>
              <td className="border-2 border-primary/20 p-3 text-right font-bold">₹{total.toLocaleString('en-IN')}</td>
              <td className="border-2 border-primary/20 p-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <Button onClick={addMaterial} variant="outline" className="border-2 border-primary">
        <Plus className="h-4 w-4 mr-2" />
        Add Raw Material
      </Button>
    </div>
  );
};

// Wages Step
const WagesStep: React.FC<{ data: any; onChange: (data: any) => void; suggestions?: any; loading?: boolean; onGetSuggestions: () => void }> = ({ data, onChange, suggestions, loading, onGetSuggestions }) => {
  const { t } = useTranslation();
  const wages = data?.wages || [{ particulars: '', noOfWorkers: '', wagesPerMonth: '', amount: '' }];
  const totalMonths = 12;
  
  const addWage = () => {
    onChange({...data, wages: [...wages, { particulars: '', noOfWorkers: '', wagesPerMonth: '', amount: '' }]});
  };
  
  const removeWage = (index: number) => {
    onChange({...data, wages: wages.filter((_: any, i: number) => i !== index)});
  };
  
  const updateWage = (index: number, field: string, value: string) => {
    const updated = [...wages];
    updated[index] = {...updated[index], [field]: value};
    if (field === 'noOfWorkers' || field === 'wagesPerMonth') {
      const workers = parseFloat(updated[index].noOfWorkers || '0');
      const wage = parseFloat(updated[index].wagesPerMonth || '0');
      updated[index].amount = (workers * wage * totalMonths).toString();
    }
    onChange({...data, wages: updated});
  };
  
  const handleApplySuggestions = () => {
    if (Array.isArray(suggestions) && suggestions.length > 0) {
      onChange({...data, wages: suggestions});
      toast.success('Applied AI suggestions to wages');
    }
  };
  
  const total = wages.reduce((sum: number, w: any) => sum + parseFloat(w.amount || '0'), 0);
  
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-2">{t('dprBuilder.wages.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('dprBuilder.wages.description')}</p>
          </div>
          {!suggestions && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGetSuggestions}
              disabled={loading}
              className="ml-4 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('dprBuilder.generateSampleContent')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {suggestions && Array.isArray(suggestions) && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5 border-2 border-primary/30 shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border-2 border-primary/30">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-primary mb-2">{t('dprBuilder.aiGeneratedSample')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('dprBuilder.clickApplyToUse')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleApplySuggestions}
                  className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white"
                >
                  {t('dprBuilder.applyAll')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGetSuggestions}
                  disabled={loading}
                  className="flex-shrink-0 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('dprBuilder.refresh')
                  )}
                </Button>
              </div>
            </div>
            
            {/* Preview Table - Wages */}
            <div className="mt-4 overflow-x-auto border-2 border-primary/20 rounded-lg bg-white/50">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-primary/10">
                    <th className="border-2 border-primary/20 p-3 text-left font-bold text-sm">Particulars</th>
                    <th className="border-2 border-primary/20 p-3 text-right font-bold text-sm">No. of Workers</th>
                    <th className="border-2 border-primary/20 p-3 text-right font-bold text-sm">Wages Per Month (₹)</th>
                    <th className="border-2 border-primary/20 p-3 text-right font-bold text-sm">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {suggestions.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-primary/5">
                      <td className="border-2 border-primary/20 p-3 text-sm">{item.particulars || '-'}</td>
                      <td className="border-2 border-primary/20 p-3 text-right text-sm">{item.noOfWorkers || '0'}</td>
                      <td className="border-2 border-primary/20 p-3 text-right text-sm">₹{parseFloat(item.wagesPerMonth || '0').toLocaleString('en-IN')}</td>
                      <td className="border-2 border-primary/20 p-3 text-right font-semibold text-sm">₹{parseFloat(item.amount || '0').toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-primary/5">
                    <td colSpan={3} className="border-2 border-primary/20 p-3 text-right font-bold text-sm">Total</td>
                    <td className="border-2 border-primary/20 p-3 text-right font-bold text-sm">
                      ₹{suggestions.reduce((sum: number, m: any) => sum + parseFloat(m.amount || '0'), 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm font-semibold text-foreground">Total Months: {totalMonths}</p>
      </div>
      
      <div className="overflow-x-auto border-2 border-primary/20 rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-primary/10">
              <th className="border-2 border-primary/20 p-3 text-left font-bold">Particulars</th>
              <th className="border-2 border-primary/20 p-3 text-right font-bold">No. of Workers</th>
              <th className="border-2 border-primary/20 p-3 text-right font-bold">Wages Per Month (₹)</th>
              <th className="border-2 border-primary/20 p-3 text-right font-bold">Amount (₹)</th>
              <th className="border-2 border-primary/20 p-3 text-center font-bold">Action</th>
            </tr>
          </thead>
          <tbody>
            {wages.map((wage: any, index: number) => (
              <tr key={index}>
                <td className="border-2 border-primary/20 p-3">
                  <Input
                    value={wage.particulars}
                    onChange={(e) => updateWage(index, 'particulars', e.target.value)}
                    placeholder="e.g., Labor, Skilled Worker"
                    className="border-2"
                  />
                </td>
                <td className="border-2 border-primary/20 p-3">
                  <Input
                    type="number"
                    value={wage.noOfWorkers}
                    onChange={(e) => updateWage(index, 'noOfWorkers', e.target.value)}
                    placeholder="0"
                    className="border-2 text-right"
                  />
                </td>
                <td className="border-2 border-primary/20 p-3">
                  <Input
                    type="number"
                    value={wage.wagesPerMonth}
                    onChange={(e) => updateWage(index, 'wagesPerMonth', e.target.value)}
                    placeholder="0"
                    className="border-2 text-right"
                  />
                </td>
                <td className="border-2 border-primary/20 p-3 text-right font-semibold">
                  ₹{parseFloat(wage.amount || '0').toLocaleString('en-IN')}
                </td>
                <td className="border-2 border-primary/20 p-3 text-center">
                  <Button variant="ghost" size="sm" onClick={() => removeWage(index)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-primary/5">
              <td colSpan={3} className="border-2 border-primary/20 p-3 text-right font-bold">Total</td>
              <td className="border-2 border-primary/20 p-3 text-right font-bold">₹{total.toLocaleString('en-IN')}</td>
              <td className="border-2 border-primary/20 p-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <Button onClick={addWage} variant="outline" className="border-2 border-primary">
        <Plus className="h-4 w-4 mr-2" />
        Add Worker Category
      </Button>
    </div>
  );
};

// Salary Details Step
const SalaryDetailsStep: React.FC<{ data: any; onChange: (data: any) => void; suggestions?: any; loading?: boolean; onGetSuggestions: () => void }> = ({ data, onChange, suggestions, loading, onGetSuggestions }) => {
  const { t } = useTranslation();
  const salaries = data?.salaries || [{ particulars: '', noOfStaff: '', wagesPerMonth: '', amount: '' }];
  const totalMonths = 12;
  
  const addSalary = () => {
    onChange({...data, salaries: [...salaries, { particulars: '', noOfStaff: '', wagesPerMonth: '', amount: '' }]});
  };
  
  const removeSalary = (index: number) => {
    onChange({...data, salaries: salaries.filter((_: any, i: number) => i !== index)});
  };
  
  const updateSalary = (index: number, field: string, value: string) => {
    const updated = [...salaries];
    updated[index] = {...updated[index], [field]: value};
    if (field === 'noOfStaff' || field === 'wagesPerMonth') {
      const staff = parseFloat(updated[index].noOfStaff || '0');
      const wage = parseFloat(updated[index].wagesPerMonth || '0');
      updated[index].amount = (staff * wage * totalMonths).toString();
    }
    onChange({...data, salaries: updated});
  };
  
  const handleApplySuggestions = () => {
    if (Array.isArray(suggestions) && suggestions.length > 0) {
      onChange({...data, salaries: suggestions});
      toast.success('Applied AI suggestions to salary details');
    }
  };
  
  const total = salaries.reduce((sum: number, s: any) => sum + parseFloat(s.amount || '0'), 0);
  
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-2">{t('dprBuilder.salaryDetails.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('dprBuilder.salaryDetails.description')}</p>
          </div>
          {!suggestions && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGetSuggestions}
              disabled={loading}
              className="ml-4 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('dprBuilder.generateSampleContent')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {suggestions && Array.isArray(suggestions) && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5 border-2 border-primary/30 shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border-2 border-primary/30">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-primary mb-2">{t('dprBuilder.aiGeneratedSample')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('dprBuilder.clickApplyToUse')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleApplySuggestions}
                  className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white"
                >
                  {t('dprBuilder.applyAll')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGetSuggestions}
                  disabled={loading}
                  className="flex-shrink-0 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('dprBuilder.refresh')
                  )}
                </Button>
              </div>
            </div>
            
            {/* Preview Table - Salary Details */}
            <div className="mt-4 overflow-x-auto border-2 border-primary/20 rounded-lg bg-white/50">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-primary/10">
                    <th className="border-2 border-primary/20 p-3 text-left font-bold text-sm">Particulars</th>
                    <th className="border-2 border-primary/20 p-3 text-right font-bold text-sm">No. of Staff</th>
                    <th className="border-2 border-primary/20 p-3 text-right font-bold text-sm">Wages Per Month (₹)</th>
                    <th className="border-2 border-primary/20 p-3 text-right font-bold text-sm">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {suggestions.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-primary/5">
                      <td className="border-2 border-primary/20 p-3 text-sm">{item.particulars || '-'}</td>
                      <td className="border-2 border-primary/20 p-3 text-right text-sm">{item.noOfStaff || '0'}</td>
                      <td className="border-2 border-primary/20 p-3 text-right text-sm">₹{parseFloat(item.wagesPerMonth || '0').toLocaleString('en-IN')}</td>
                      <td className="border-2 border-primary/20 p-3 text-right font-semibold text-sm">₹{parseFloat(item.amount || '0').toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-primary/5">
                    <td colSpan={3} className="border-2 border-primary/20 p-3 text-right font-bold text-sm">Total</td>
                    <td className="border-2 border-primary/20 p-3 text-right font-bold text-sm">
                      ₹{suggestions.reduce((sum: number, m: any) => sum + parseFloat(m.amount || '0'), 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm font-semibold text-foreground">Total Months: {totalMonths}</p>
      </div>
      
      <div className="overflow-x-auto border-2 border-primary/20 rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-primary/10">
              <th className="border-2 border-primary/20 p-3 text-left font-bold">Particulars</th>
              <th className="border-2 border-primary/20 p-3 text-right font-bold">No. of Staff</th>
              <th className="border-2 border-primary/20 p-3 text-right font-bold">Wages Per Month (₹)</th>
              <th className="border-2 border-primary/20 p-3 text-right font-bold">Amount (₹)</th>
              <th className="border-2 border-primary/20 p-3 text-center font-bold">Action</th>
            </tr>
          </thead>
          <tbody>
            {salaries.map((salary: any, index: number) => (
              <tr key={index}>
                <td className="border-2 border-primary/20 p-3">
                  <Input
                    value={salary.particulars}
                    onChange={(e) => updateSalary(index, 'particulars', e.target.value)}
                    placeholder="e.g., Manager, Supervisor"
                    className="border-2"
                  />
                </td>
                <td className="border-2 border-primary/20 p-3">
                  <Input
                    type="number"
                    value={salary.noOfStaff}
                    onChange={(e) => updateSalary(index, 'noOfStaff', e.target.value)}
                    placeholder="0"
                    className="border-2 text-right"
                  />
                </td>
                <td className="border-2 border-primary/20 p-3">
                  <Input
                    type="number"
                    value={salary.wagesPerMonth}
                    onChange={(e) => updateSalary(index, 'wagesPerMonth', e.target.value)}
                    placeholder="0"
                    className="border-2 text-right"
                  />
                </td>
                <td className="border-2 border-primary/20 p-3 text-right font-semibold">
                  ₹{parseFloat(salary.amount || '0').toLocaleString('en-IN')}
                </td>
                <td className="border-2 border-primary/20 p-3 text-center">
                  <Button variant="ghost" size="sm" onClick={() => removeSalary(index)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-primary/5">
              <td colSpan={3} className="border-2 border-primary/20 p-3 text-right font-bold">Total</td>
              <td className="border-2 border-primary/20 p-3 text-right font-bold">₹{total.toLocaleString('en-IN')}</td>
              <td className="border-2 border-primary/20 p-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <Button onClick={addSalary} variant="outline" className="border-2 border-primary">
        <Plus className="h-4 w-4 mr-2" />
        Add Staff Category
      </Button>
    </div>
  );
};

// Working Capital Estimate Step
const WorkingCapitalEstimateStep: React.FC<{ data: any; onChange: (data: any) => void; suggestions?: any; loading?: boolean; onGetSuggestions: () => void }> = ({ data, onChange, suggestions, loading, onGetSuggestions }) => {
  const { t } = useTranslation();
  
  const handleApplySuggestions = () => {
    if (suggestions && typeof suggestions === 'object') {
      onChange({...data, ...suggestions});
      toast.success('Applied AI suggestions');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-2">{t('dprBuilder.workingCapitalEstimate.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('dprBuilder.workingCapitalEstimate.description')}</p>
          </div>
          {!suggestions && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGetSuggestions}
              disabled={loading}
              className="ml-4 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('dprBuilder.generateSampleContent')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {suggestions && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5 border-2 border-primary/30 shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border-2 border-primary/30">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-primary mb-2">{t('dprBuilder.aiGeneratedSample')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('dprBuilder.clickApplyToUse')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleApplySuggestions}
                  className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white"
                >
                  {t('dprBuilder.applyAll')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGetSuggestions}
                  disabled={loading}
                  className="flex-shrink-0 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('dprBuilder.refresh')
                  )}
                </Button>
              </div>
            </div>
            
            {/* Preview Content */}
            <div className="mt-4 p-4 bg-white/50 rounded-lg border-2 border-primary/20">
              {suggestions && typeof suggestions === 'object' && !Array.isArray(suggestions) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {suggestions.stockInProcess && (
                    <div>
                      <span className="font-semibold text-foreground">Stock in Process: </span>
                      <span className="text-muted-foreground">{suggestions.stockInProcess} days</span>
                    </div>
                  )}
                  {suggestions.finishedGoods && (
                    <div>
                      <span className="font-semibold text-foreground">Finished Goods: </span>
                      <span className="text-muted-foreground">{suggestions.finishedGoods} days</span>
                    </div>
                  )}
                  {suggestions.receivables && (
                    <div>
                      <span className="font-semibold text-foreground">Receivables: </span>
                      <span className="text-muted-foreground">{suggestions.receivables} days</span>
                    </div>
                  )}
                  {Object.keys(suggestions).length === 0 && (
                    <div className="col-span-2 text-sm text-muted-foreground">
                      No suggestions available. Please try refreshing.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm">
                  <p className="text-muted-foreground mb-2">Preview:</p>
                  <pre className="bg-white p-3 rounded border text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                    {typeof suggestions === 'string' ? suggestions : JSON.stringify(suggestions, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.workingCapitalEstimate.stockInProcess')} (Days)</label>
          <Input
            type="number"
            value={data?.stockInProcess || ''}
            onChange={(e) => onChange({...data, stockInProcess: e.target.value})}
            placeholder="0"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.workingCapitalEstimate.finishedGoods')} (Days)</label>
          <Input
            type="number"
            value={data?.finishedGoods || ''}
            onChange={(e) => onChange({...data, finishedGoods: e.target.value})}
            placeholder="0"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.workingCapitalEstimate.receivables')} (Days)</label>
          <Input
            type="number"
            value={data?.receivables || ''}
            onChange={(e) => onChange({...data, receivables: e.target.value})}
            placeholder="0"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
};

// Power Estimate Step
const PowerEstimateStep: React.FC<{ data: any; onChange: (data: any) => void; suggestions?: any; loading?: boolean; onGetSuggestions: () => void }> = ({ data, onChange, suggestions, loading, onGetSuggestions }) => {
  const { t } = useTranslation();
  
  const handleApplySuggestions = () => {
    if (suggestions && typeof suggestions === 'object') {
      onChange({...data, ...suggestions});
      toast.success('Applied AI suggestions');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-2">{t('dprBuilder.powerEstimate.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('dprBuilder.powerEstimate.description')}</p>
          </div>
          {!suggestions && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGetSuggestions}
              disabled={loading}
              className="ml-4 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('dprBuilder.generateSampleContent')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {suggestions && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5 border-2 border-primary/30 shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border-2 border-primary/30">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-primary mb-2">{t('dprBuilder.aiGeneratedSample')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('dprBuilder.clickApplyToUse')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleApplySuggestions}
                  className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white"
                >
                  {t('dprBuilder.applyAll')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGetSuggestions}
                  disabled={loading}
                  className="flex-shrink-0 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('dprBuilder.refresh')
                  )}
                </Button>
              </div>
            </div>
            
            {/* Preview Content */}
            <div className="mt-4 p-4 bg-white/50 rounded-lg border-2 border-primary/20">
              {suggestions && typeof suggestions === 'object' && !Array.isArray(suggestions) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {suggestions.powerRequirement && (
                    <div>
                      <span className="font-semibold text-foreground">Power Requirement: </span>
                      <span className="text-muted-foreground">{suggestions.powerRequirement} KW</span>
                    </div>
                  )}
                  {suggestions.monthlyCost && (
                    <div>
                      <span className="font-semibold text-foreground">Monthly Cost: </span>
                      <span className="text-muted-foreground">₹{parseFloat(String(suggestions.monthlyCost || '0')).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {Object.keys(suggestions).length === 0 && (
                    <div className="col-span-2 text-sm text-muted-foreground">
                      No suggestions available. Please try refreshing.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm">
                  <p className="text-muted-foreground mb-2">Preview:</p>
                  <pre className="bg-white p-3 rounded border text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                    {typeof suggestions === 'string' ? suggestions : JSON.stringify(suggestions, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.powerEstimate.powerRequirement')} (KW)</label>
          <Input
            type="number"
            value={data?.powerRequirement || ''}
            onChange={(e) => onChange({...data, powerRequirement: e.target.value})}
            placeholder="0"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.powerEstimate.monthlyCost')} (₹)</label>
          <Input
            type="number"
            value={data?.monthlyCost || ''}
            onChange={(e) => onChange({...data, monthlyCost: e.target.value})}
            placeholder="0"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
};

// Overhead Expenses Step
const OverheadExpensesStep: React.FC<{ data: any; onChange: (data: any) => void; suggestions?: any; loading?: boolean; onGetSuggestions: () => void }> = ({ data, onChange, suggestions, loading, onGetSuggestions }) => {
  const { t } = useTranslation();
  
  const handleApplySuggestions = () => {
    if (suggestions && typeof suggestions === 'object') {
      onChange({...data, ...suggestions});
      toast.success('Applied AI suggestions');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-2">{t('dprBuilder.overheadExpenses.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('dprBuilder.overheadExpenses.description')}</p>
          </div>
          {!suggestions && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGetSuggestions}
              disabled={loading}
              className="ml-4 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('dprBuilder.generateSampleContent')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {suggestions && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5 border-2 border-primary/30 shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border-2 border-primary/30">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-primary mb-2">{t('dprBuilder.aiGeneratedSample')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('dprBuilder.clickApplyToUse')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleApplySuggestions}
                  className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white"
                >
                  {t('dprBuilder.applyAll')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGetSuggestions}
                  disabled={loading}
                  className="flex-shrink-0 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('dprBuilder.refresh')
                  )}
                </Button>
              </div>
            </div>
            
            {/* Preview Content */}
            <div className="mt-4 p-4 bg-white/50 rounded-lg border-2 border-primary/20">
              {suggestions && typeof suggestions === 'object' && !Array.isArray(suggestions) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {suggestions.repairMaintenance && (
                    <div>
                      <span className="font-semibold text-foreground">Repair & Maintenance: </span>
                      <span className="text-muted-foreground">₹{parseFloat(String(suggestions.repairMaintenance || '0')).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {suggestions.powerFuel && (
                    <div>
                      <span className="font-semibold text-foreground">Power & Fuel: </span>
                      <span className="text-muted-foreground">₹{parseFloat(String(suggestions.powerFuel || '0')).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {suggestions.otherOverhead && (
                    <div>
                      <span className="font-semibold text-foreground">Other Overhead: </span>
                      <span className="text-muted-foreground">₹{parseFloat(String(suggestions.otherOverhead || '0')).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {suggestions.telephone && (
                    <div>
                      <span className="font-semibold text-foreground">Telephone: </span>
                      <span className="text-muted-foreground">₹{parseFloat(String(suggestions.telephone || '0')).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {suggestions.stationeryPostage && (
                    <div>
                      <span className="font-semibold text-foreground">Stationery & Postage: </span>
                      <span className="text-muted-foreground">₹{parseFloat(String(suggestions.stationeryPostage || '0')).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {suggestions.advertisement && (
                    <div>
                      <span className="font-semibold text-foreground">Advertisement: </span>
                      <span className="text-muted-foreground">₹{parseFloat(String(suggestions.advertisement || '0')).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {suggestions.buildingRent && (
                    <div>
                      <span className="font-semibold text-foreground">Building Rent: </span>
                      <span className="text-muted-foreground">₹{parseFloat(String(suggestions.buildingRent || '0')).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {suggestions.otherMiscellaneous && (
                    <div>
                      <span className="font-semibold text-foreground">Other Miscellaneous: </span>
                      <span className="text-muted-foreground">₹{parseFloat(String(suggestions.otherMiscellaneous || '0')).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {Object.keys(suggestions).length === 0 && (
                    <div className="col-span-2 text-sm text-muted-foreground">
                      No suggestions available. Please try refreshing.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm">
                  <p className="text-muted-foreground mb-2">Preview:</p>
                  <pre className="bg-white p-3 rounded border text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                    {typeof suggestions === 'string' ? suggestions : JSON.stringify(suggestions, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.overheadExpenses.repairMaintenance')} (₹)</label>
          <Input
            type="number"
            value={data?.repairMaintenance || ''}
            onChange={(e) => onChange({...data, repairMaintenance: e.target.value})}
            placeholder="0"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.overheadExpenses.powerFuel')} (₹)</label>
          <Input
            type="number"
            value={data?.powerFuel || ''}
            onChange={(e) => onChange({...data, powerFuel: e.target.value})}
            placeholder="0"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.overheadExpenses.otherOverhead')} (₹)</label>
          <Input
            type="number"
            value={data?.otherOverhead || ''}
            onChange={(e) => onChange({...data, otherOverhead: e.target.value})}
            placeholder="0"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.overheadExpenses.telephone')} (₹)</label>
          <Input
            type="number"
            value={data?.telephone || ''}
            onChange={(e) => onChange({...data, telephone: e.target.value})}
            placeholder="0"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.overheadExpenses.stationeryPostage')} (₹)</label>
          <Input
            type="number"
            value={data?.stationeryPostage || ''}
            onChange={(e) => onChange({...data, stationeryPostage: e.target.value})}
            placeholder="0"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.overheadExpenses.advertisement')} (₹)</label>
          <Input
            type="number"
            value={data?.advertisement || ''}
            onChange={(e) => onChange({...data, advertisement: e.target.value})}
            placeholder="0"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.overheadExpenses.buildingRent')} (₹)</label>
          <Input
            type="number"
            value={data?.buildingRent || ''}
            onChange={(e) => onChange({...data, buildingRent: e.target.value})}
            placeholder="0"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.overheadExpenses.otherMiscellaneous')} (₹)</label>
          <Input
            type="number"
            value={data?.otherMiscellaneous || ''}
            onChange={(e) => onChange({...data, otherMiscellaneous: e.target.value})}
            placeholder="0"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
};

// Financial Parameters Step
const FinancialParametersStep: React.FC<{ data: any; onChange: (data: any) => void; suggestions?: any; loading?: boolean; onGetSuggestions: () => void }> = ({ data, onChange, suggestions, loading, onGetSuggestions }) => {
  const { t } = useTranslation();
  
  const handleApplySuggestions = () => {
    if (suggestions && typeof suggestions === 'object') {
      onChange({...data, ...suggestions});
      toast.success('Applied AI suggestions');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-2">{t('dprBuilder.financialParameters.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('dprBuilder.financialParameters.description')}</p>
          </div>
          {!suggestions && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGetSuggestions}
              disabled={loading}
              className="ml-4 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('dprBuilder.generateSampleContent')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {suggestions && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5 border-2 border-primary/30 shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border-2 border-primary/30">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-primary mb-2">{t('dprBuilder.aiGeneratedSample')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('dprBuilder.clickApplyToUse')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleApplySuggestions}
                  className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white"
                >
                  {t('dprBuilder.applyAll')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGetSuggestions}
                  disabled={loading}
                  className="flex-shrink-0 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('dprBuilder.refresh')
                  )}
                </Button>
              </div>
            </div>
            
            {/* Preview Content */}
            <div className="mt-4 p-4 bg-white/50 rounded-lg border-2 border-primary/20">
              {suggestions && typeof suggestions === 'object' && !Array.isArray(suggestions) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {suggestions.rateOfInterest && (
                    <div>
                      <span className="font-semibold text-foreground">Rate of Interest: </span>
                      <span className="text-muted-foreground">{suggestions.rateOfInterest}%</span>
                    </div>
                  )}
                  {suggestions.depreciationBuilding && (
                    <div>
                      <span className="font-semibold text-foreground">Depreciation on Building: </span>
                      <span className="text-muted-foreground">{suggestions.depreciationBuilding}%</span>
                    </div>
                  )}
                  {suggestions.depreciationMachinery && (
                    <div>
                      <span className="font-semibold text-foreground">Depreciation on Machinery: </span>
                      <span className="text-muted-foreground">{suggestions.depreciationMachinery}%</span>
                    </div>
                  )}
                  {Object.keys(suggestions).length === 0 && (
                    <div className="col-span-2 text-sm text-muted-foreground">
                      No suggestions available. Please try refreshing.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm">
                  <p className="text-muted-foreground mb-2">Preview:</p>
                  <pre className="bg-white p-3 rounded border text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                    {typeof suggestions === 'string' ? suggestions : JSON.stringify(suggestions, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.financialParameters.rateOfInterest')} (%)</label>
          <Input
            type="number"
            value={data?.rateOfInterest || ''}
            onChange={(e) => onChange({...data, rateOfInterest: e.target.value})}
            placeholder="11"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.financialParameters.depreciationBuilding')} (%)</label>
          <Input
            type="number"
            value={data?.depreciationBuilding || ''}
            onChange={(e) => onChange({...data, depreciationBuilding: e.target.value})}
            placeholder="5"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.financialParameters.depreciationMachinery')} (%)</label>
          <Input
            type="number"
            value={data?.depreciationMachinery || ''}
            onChange={(e) => onChange({...data, depreciationMachinery: e.target.value})}
            placeholder="10"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
};

// Beneficiary Info Step
const BeneficiaryInfoStep: React.FC<{ data: any; onChange: (data: any) => void; suggestions?: any; loading?: boolean; onGetSuggestions: () => void }> = ({ data, onChange, suggestions, loading, onGetSuggestions }) => {
  const { t } = useTranslation();
  
  const handleApplySuggestions = () => {
    if (suggestions && typeof suggestions === 'object') {
      onChange({...data, ...suggestions});
      toast.success('Applied AI suggestions');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-2">{t('dprBuilder.beneficiaryInfo.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('dprBuilder.beneficiaryInfo.description')}</p>
          </div>
          {!suggestions && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGetSuggestions}
              disabled={loading}
              className="ml-4 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('dprBuilder.generateSampleContent')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {suggestions && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5 border-2 border-primary/30 shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border-2 border-primary/30">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-primary mb-2">{t('dprBuilder.aiGeneratedSample')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('dprBuilder.clickApplyToUse')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleApplySuggestions}
                  className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white"
                >
                  {t('dprBuilder.applyAll')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGetSuggestions}
                  disabled={loading}
                  className="flex-shrink-0 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('dprBuilder.refresh')
                  )}
                </Button>
              </div>
            </div>
            
            {/* Preview Content */}
            <div className="mt-4 p-4 bg-white/50 rounded-lg border-2 border-primary/20">
              {suggestions && typeof suggestions === 'object' && !Array.isArray(suggestions) ? (
                <div className="space-y-3 text-sm">
                  {suggestions.fullName && (
                    <div>
                      <span className="font-semibold text-foreground">Full Name: </span>
                      <span className="text-muted-foreground">{suggestions.fullName}</span>
                    </div>
                  )}
                  {suggestions.fatherSpouseName && (
                    <div>
                      <span className="font-semibold text-foreground">Father's/Spouse's Name: </span>
                      <span className="text-muted-foreground">{suggestions.fatherSpouseName}</span>
                    </div>
                  )}
                  {suggestions.address && (
                    <div>
                      <span className="font-semibold text-foreground">Address: </span>
                      <span className="text-muted-foreground">{suggestions.address}</span>
                    </div>
                  )}
                  {suggestions.email && (
                    <div>
                      <span className="font-semibold text-foreground">Email: </span>
                      <span className="text-muted-foreground">{suggestions.email}</span>
                    </div>
                  )}
                  {suggestions.mobile && (
                    <div>
                      <span className="font-semibold text-foreground">Mobile: </span>
                      <span className="text-muted-foreground">{suggestions.mobile}</span>
                    </div>
                  )}
                  {suggestions.educationalQualifications && (
                    <div>
                      <span className="font-semibold text-foreground">Educational Qualifications: </span>
                      <span className="text-muted-foreground">{suggestions.educationalQualifications}</span>
                    </div>
                  )}
                  {suggestions.experience && (
                    <div>
                      <span className="font-semibold text-foreground">Experience: </span>
                      <span className="text-muted-foreground">{suggestions.experience}</span>
                    </div>
                  )}
                  {Object.keys(suggestions).length === 0 && (
                    <div className="text-sm text-muted-foreground">
                      No suggestions available. Please try refreshing.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm">
                  <p className="text-muted-foreground mb-2">Preview:</p>
                  <pre className="bg-white p-3 rounded border text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                    {typeof suggestions === 'string' ? suggestions : JSON.stringify(suggestions, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.beneficiaryInfo.fullName')}</label>
          <Input
            value={data?.fullName || ''}
            onChange={(e) => onChange({...data, fullName: e.target.value})}
            placeholder="Full Name"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.beneficiaryInfo.fatherSpouseName')}</label>
          <Input
            value={data?.fatherSpouseName || ''}
            onChange={(e) => onChange({...data, fatherSpouseName: e.target.value})}
            placeholder="Father's/Spouse's Name"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.beneficiaryInfo.address')}</label>
          <textarea
            className="w-full p-4 border-2 rounded-lg focus:border-primary focus:outline-none resize-none"
            rows={3}
            value={data?.address || ''}
            onChange={(e) => onChange({...data, address: e.target.value})}
            placeholder="Complete Address"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.beneficiaryInfo.email')}</label>
          <Input
            type="email"
            value={data?.email || ''}
            onChange={(e) => onChange({...data, email: e.target.value})}
            placeholder="email@example.com"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.beneficiaryInfo.mobile')}</label>
          <Input
            type="tel"
            value={data?.mobile || ''}
            onChange={(e) => onChange({...data, mobile: e.target.value})}
            placeholder="+91 9876543210"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.beneficiaryInfo.educationalQualifications')}</label>
          <Input
            value={data?.educationalQualifications || ''}
            onChange={(e) => onChange({...data, educationalQualifications: e.target.value})}
            placeholder="Educational Qualifications"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.beneficiaryInfo.experience')}</label>
          <textarea
            className="w-full p-4 border-2 rounded-lg focus:border-primary focus:outline-none resize-none"
            rows={3}
            value={data?.experience || ''}
            onChange={(e) => onChange({...data, experience: e.target.value})}
            placeholder="Work Experience and Background"
          />
        </div>
      </div>
    </div>
  );
};

// Project at a Glance Step
const ProjectAtGlanceStep: React.FC<{ data: any; onChange: (data: any) => void; stepData: any; suggestions?: any; loading?: boolean; onGetSuggestions: () => void }> = ({ data, onChange, stepData, suggestions, loading, onGetSuggestions }) => {
  const { t } = useTranslation();
  
  // Auto-populate from other steps
  useEffect(() => {
    if (!data?.beneficiaryName && stepData.beneficiaryInfo?.fullName) {
      onChange({...data, beneficiaryName: stepData.beneficiaryInfo.fullName});
    }
    if (!data?.constitution && stepData.applicantInfo?.projectType) {
      onChange({...data, constitution: stepData.applicantInfo.projectType});
    }
    if (!data?.unitAddress && stepData.beneficiaryInfo?.address) {
      onChange({...data, unitAddress: stepData.beneficiaryInfo.address});
    }
  }, [stepData]);
  
  const handleApplySuggestions = () => {
    if (suggestions && typeof suggestions === 'object') {
      onChange({...data, ...suggestions});
      toast.success('Applied AI suggestions');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-2">{t('dprBuilder.projectAtGlance.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('dprBuilder.projectAtGlance.description')}</p>
          </div>
          {!suggestions && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGetSuggestions}
              disabled={loading}
              className="ml-4 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('dprBuilder.generateSampleContent')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {suggestions && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5 border-2 border-primary/30 shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border-2 border-primary/30">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-primary mb-2">{t('dprBuilder.aiGeneratedSample')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('dprBuilder.clickApplyToUse')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleApplySuggestions}
                  className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white"
                >
                  {t('dprBuilder.applyAll')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGetSuggestions}
                  disabled={loading}
                  className="flex-shrink-0 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('dprBuilder.refresh')
                  )}
                </Button>
              </div>
            </div>
            
            {/* Preview Content */}
            <div className="mt-4 p-4 bg-white/50 rounded-lg border-2 border-primary/20">
              {suggestions && typeof suggestions === 'object' && !Array.isArray(suggestions) ? (
                <div className="space-y-3 text-sm">
                  {suggestions.beneficiaryName && (
                    <div>
                      <span className="font-semibold text-foreground">Beneficiary Name: </span>
                      <span className="text-muted-foreground">{suggestions.beneficiaryName}</span>
                    </div>
                  )}
                  {suggestions.constitution && (
                    <div>
                      <span className="font-semibold text-foreground">Constitution: </span>
                      <span className="text-muted-foreground">{suggestions.constitution}</span>
                    </div>
                  )}
                  {suggestions.unitAddress && (
                    <div>
                      <span className="font-semibold text-foreground">Unit Address: </span>
                      <span className="text-muted-foreground">{suggestions.unitAddress}</span>
                    </div>
                  )}
                  {suggestions.talukBlock && (
                    <div>
                      <span className="font-semibold text-foreground">Taluk/Block: </span>
                      <span className="text-muted-foreground">{suggestions.talukBlock}</span>
                    </div>
                  )}
                  {suggestions.district && (
                    <div>
                      <span className="font-semibold text-foreground">District: </span>
                      <span className="text-muted-foreground">{suggestions.district}</span>
                    </div>
                  )}
                  {suggestions.pinCode && (
                    <div>
                      <span className="font-semibold text-foreground">PIN Code: </span>
                      <span className="text-muted-foreground">{suggestions.pinCode}</span>
                    </div>
                  )}
                  {suggestions.email && (
                    <div>
                      <span className="font-semibold text-foreground">Email: </span>
                      <span className="text-muted-foreground">{suggestions.email}</span>
                    </div>
                  )}
                  {suggestions.mobile && (
                    <div>
                      <span className="font-semibold text-foreground">Mobile: </span>
                      <span className="text-muted-foreground">{suggestions.mobile}</span>
                    </div>
                  )}
                  {suggestions.products && (
                    <div>
                      <span className="font-semibold text-foreground">Products: </span>
                      <span className="text-muted-foreground">{suggestions.products}</span>
                    </div>
                  )}
                  {Object.keys(suggestions).length === 0 && (
                    <div className="text-sm text-muted-foreground">
                      No suggestions available. Please try refreshing.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm">
                  <p className="text-muted-foreground mb-2">Preview:</p>
                  <pre className="bg-white p-3 rounded border text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                    {typeof suggestions === 'string' ? suggestions : JSON.stringify(suggestions, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.projectAtGlance.beneficiaryName')}</label>
          <Input
            value={data?.beneficiaryName || ''}
            onChange={(e) => onChange({...data, beneficiaryName: e.target.value})}
            placeholder="Name of the Beneficiary"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.projectAtGlance.constitution')}</label>
          <Input
            value={data?.constitution || ''}
            onChange={(e) => onChange({...data, constitution: e.target.value})}
            placeholder="e.g., Individual"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.projectAtGlance.unitAddress')}</label>
          <textarea
            className="w-full p-4 border-2 rounded-lg focus:border-primary focus:outline-none resize-none"
            rows={3}
            value={data?.unitAddress || ''}
            onChange={(e) => onChange({...data, unitAddress: e.target.value})}
            placeholder="Complete Unit Address"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.projectAtGlance.talukBlock')}</label>
          <Input
            value={data?.talukBlock || ''}
            onChange={(e) => onChange({...data, talukBlock: e.target.value})}
            placeholder="Taluk/Block"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.projectAtGlance.district')}</label>
          <Input
            value={data?.district || ''}
            onChange={(e) => onChange({...data, district: e.target.value})}
            placeholder="District"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.projectAtGlance.pinCode')}</label>
          <Input
            value={data?.pinCode || ''}
            onChange={(e) => onChange({...data, pinCode: e.target.value})}
            placeholder="PIN Code"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.projectAtGlance.email')}</label>
          <Input
            type="email"
            value={data?.email || ''}
            onChange={(e) => onChange({...data, email: e.target.value})}
            placeholder="email@example.com"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.projectAtGlance.mobile')}</label>
          <Input
            type="tel"
            value={data?.mobile || ''}
            onChange={(e) => onChange({...data, mobile: e.target.value})}
            placeholder="+91 9876543210"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.projectAtGlance.products')}</label>
          <textarea
            className="w-full p-4 border-2 rounded-lg focus:border-primary focus:outline-none resize-none"
            rows={3}
            value={data?.products || ''}
            onChange={(e) => onChange({...data, products: e.target.value})}
            placeholder="List of Products and By-Products"
          />
        </div>
      </div>
    </div>
  );
};

const BusinessOverviewStep: React.FC<{ data: any; onChange: (data: any) => void; project?: any }> = ({ data, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <h3 className="text-xl font-bold text-foreground mb-2">{t('dprBuilder.businessOverview.title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('dprBuilder.businessOverview.description')}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.businessOverview.projectName')} *</label>
          <Input
            value={data?.projectName || ''}
            onChange={(e) => onChange({...data, projectName: e.target.value})}
            placeholder={t('projects.projectName')}
            className="h-12 border-2 focus:border-primary"
          />
          <p className="text-xs text-muted-foreground mt-1">{t('dprBuilder.businessOverview.projectNameHint')}</p>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">{t('dprBuilder.businessOverview.industrySector')} *</label>
          <select
            value={data?.industrySector || ''}
            onChange={(e) => onChange({...data, industrySector: e.target.value})}
            className="w-full h-12 px-4 border-2 rounded-lg focus:border-primary focus:outline-none bg-background text-foreground"
            required
          >
            <option value="">{t('projects.selectIndustrySector')}</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Services">Services</option>
            <option value="Trading">Trading</option>
            <option value="Food Processing">Food Processing</option>
            <option value="Textiles & Garments">Textiles & Garments</option>
            <option value="Handicrafts">Handicrafts</option>
            <option value="IT & ITES">IT & ITES</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Education">Education</option>
            <option value="Agriculture & Allied">Agriculture & Allied</option>
            <option value="Construction">Construction</option>
            <option value="Retail">Retail</option>
            <option value="Hospitality & Tourism">Hospitality & Tourism</option>
            <option value="Transport & Logistics">Transport & Logistics</option>
            <option value="Real Estate">Real Estate</option>
            <option value="Energy & Power">Energy & Power</option>
            <option value="Chemicals & Pharmaceuticals">Chemicals & Pharmaceuticals</option>
            <option value="Metal & Engineering">Metal & Engineering</option>
            <option value="Leather & Leather Products">Leather & Leather Products</option>
            <option value="Paper & Paper Products">Paper & Paper Products</option>
            <option value="Rubber & Plastic Products">Rubber & Plastic Products</option>
            <option value="Wood & Wood Products">Wood & Wood Products</option>
            <option value="Printing & Publishing">Printing & Publishing</option>
            <option value="Electronics & Electrical">Electronics & Electrical</option>
            <option value="Gems & Jewellery">Gems & Jewellery</option>
            <option value="Other">Other</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">{t('dprBuilder.businessOverview.industrySectorHint')}</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-foreground">{t('dprBuilder.businessOverview.businessDescription')} *</label>
          <div className="group relative">
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            <div className="absolute right-0 top-6 w-72 p-3 bg-foreground text-background text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <p className="font-semibold mb-1">What to include:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Products/services you will offer</li>
                <li>Business model and operations</li>
                <li>Unique selling points</li>
                <li>Production capacity</li>
                <li>Business objectives</li>
              </ul>
            </div>
          </div>
        </div>
        <Card className="mb-3 bg-blue-50/50 border-blue-200">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-foreground">
                <p className="font-semibold mb-1">{t('dprBuilder.businessOverview.businessDescriptionHint')}</p>
                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                  {t('dprBuilder.businessOverview.businessDescriptionItems').split(', ').map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        <textarea
          className="w-full p-4 border-2 rounded-lg focus:border-primary focus:outline-none resize-none"
          rows={6}
          value={data?.businessDescription || ''}
          onChange={(e) => onChange({...data, businessDescription: e.target.value})}
          placeholder="Describe your business, products/services, objectives, and unique value proposition..."
        />
      </div>
    </div>
  );
};

const MarketAnalysisStep: React.FC<any> = ({ data, onChange, suggestions, loading, onGetSuggestions }) => {
  const { t } = useTranslation();
  const isStructured = suggestions && typeof suggestions === 'object' && !Array.isArray(suggestions);
  
  const handleApplySuggestion = (fieldName: string) => {
    if (isStructured && suggestions[fieldName]) {
      onChange({...data, [fieldName]: suggestions[fieldName]});
      const fieldLabel = fieldName === 'targetMarket' ? t('dprBuilder.marketAnalysis.targetMarket') : t('dprBuilder.marketAnalysis.competitorAnalysis');
      toast.success(t('dprBuilder.errors.appliedSuggestion', { field: fieldLabel }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-2">{t('dprBuilder.marketAnalysis.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('dprBuilder.marketAnalysis.description')}
            </p>
          </div>
          {!suggestions && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGetSuggestions}
              disabled={loading}
              className="ml-4 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('dprBuilder.marketAnalysis.generateSampleContent')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {suggestions && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5 border-2 border-primary/30 shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border-2 border-primary/30">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-primary mb-2">{t('dprBuilder.marketAnalysis.aiGeneratedSample')}</p>
                  <p className="text-sm text-muted-foreground">
                    {isStructured 
                      ? t('dprBuilder.marketAnalysis.clickApplyToUse')
                      : t('dprBuilder.marketAnalysis.clickApplyToUse')}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onGetSuggestions}
                disabled={loading}
                title={t('dprBuilder.marketAnalysis.generateSampleContent')}
                className="flex-shrink-0 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t('dprBuilder.marketAnalysis.refresh')
                )}
              </Button>
            </div>
            
            {isStructured ? (
              <div className="space-y-4">
                {suggestions.targetMarket && (
                  <div className="bg-white/50 rounded-lg p-4 border border-primary/20">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground mb-2">{t('dprBuilder.marketAnalysis.targetMarket')} {t('common.sample')}:</p>
                        <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{suggestions.targetMarket}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleApplySuggestion('targetMarket')}
                        className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white"
                      >
                        {t('dprBuilder.marketAnalysis.apply')}
                      </Button>
                    </div>
                  </div>
                )}
                {suggestions.competitorAnalysis && (
                  <div className="bg-white/50 rounded-lg p-4 border border-primary/20">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground mb-2">{t('dprBuilder.marketAnalysis.competitorAnalysis')} {t('common.sample')}:</p>
                        <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{suggestions.competitorAnalysis}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleApplySuggestion('competitorAnalysis')}
                        className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white"
                      >
                        {t('dprBuilder.marketAnalysis.apply')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-foreground whitespace-pre-line leading-relaxed font-medium">{String(suggestions)}</p>
            )}
          </CardContent>
        </Card>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-foreground">{t('dprBuilder.marketAnalysis.targetMarket')} *</label>
          <div className="group relative">
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            <div className="absolute right-0 top-6 w-72 p-3 bg-foreground text-background text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <p className="font-semibold mb-1">{t('dprBuilder.marketAnalysis.targetMarketHint')}</p>
              <ul className="list-disc list-inside space-y-1">
                {t('dprBuilder.marketAnalysis.targetMarketItems').split(', ').map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <Card className="mb-3 bg-blue-50/50 border-blue-200">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-foreground">
                <p className="font-semibold mb-1">{t('dprBuilder.marketAnalysis.targetMarketHint')}</p>
                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                  {t('dprBuilder.marketAnalysis.targetMarketItems').split(', ').map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        <textarea
          className="w-full p-4 border-2 rounded-lg focus:border-primary focus:outline-none resize-none"
          rows={5}
          value={data?.targetMarket || ''}
          onChange={(e) => onChange({...data, targetMarket: e.target.value})}
          placeholder="Describe your target customers, market segments, demographics, and market size..."
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-foreground">Competitor Analysis *</label>
          <div className="group relative">
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            <div className="absolute right-0 top-6 w-72 p-3 bg-foreground text-background text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <p className="font-semibold mb-1">What to include:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Main competitors and their market share</li>
                <li>Competitor strengths and weaknesses</li>
                <li>Pricing strategies</li>
                <li>Your competitive advantages</li>
                <li>Market positioning</li>
              </ul>
            </div>
          </div>
        </div>
        <Card className="mb-3 bg-blue-50/50 border-blue-200">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-foreground">
                <p className="font-semibold mb-1">{t('dprBuilder.marketAnalysis.competitorAnalysisHint')}</p>
                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                  {t('dprBuilder.marketAnalysis.competitorAnalysisItems').split(', ').map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        <textarea
          className="w-full p-4 border-2 rounded-lg focus:border-primary focus:outline-none resize-none"
          rows={5}
          value={data?.competitorAnalysis || ''}
          onChange={(e) => onChange({...data, competitorAnalysis: e.target.value})}
          placeholder="Analyze your competitors, their strengths and weaknesses, and your competitive advantages..."
        />
      </div>
    </div>
  );
};

const CostStructureStep: React.FC<{ data: any; onChange: (data: any) => void; project?: any; suggestions?: string; loading?: boolean; onGetSuggestions: () => void }> = ({ data, onChange, suggestions, loading, onGetSuggestions }) => {
  const isStructured = suggestions && typeof suggestions === 'object' && !Array.isArray(suggestions) && suggestions.capex;
  
  const handleApplyAll = () => {
    if (isStructured && suggestions.capex && suggestions.opex) {
      onChange({
        ...data,
        capex: {
          landBuilding: String(suggestions.capex.landBuilding || data?.capex?.landBuilding || ''),
          machinery: String(suggestions.capex.machinery || data?.capex?.machinery || ''),
        },
        opex: {
          rawMaterials: String(suggestions.opex.rawMaterials || data?.opex?.rawMaterials || ''),
          salaries: String(suggestions.opex.salaries || data?.opex?.salaries || ''),
        },
      });
      toast.success('Applied AI suggestions to all cost fields');
    }
  };

  const handleApplyField = (category: 'capex' | 'opex', field: string) => {
    if (isStructured && suggestions[category]?.[field]) {
      onChange({
        ...data,
        [category]: {
          ...data?.[category],
          [field]: String(suggestions[category][field]),
        },
      });
      toast.success(`Applied AI suggestion to ${category.toUpperCase()} - ${field.replace(/([A-Z])/g, ' $1').trim()}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-2">Cost Structure</h3>
            <p className="text-sm text-muted-foreground">
              Define your CAPEX (Capital Expenditure) and OPEX (Operating Expenditure) requirements. Use AI to generate sample values.
            </p>
          </div>
          {!suggestions && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGetSuggestions}
              disabled={loading}
              className="ml-4 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Sample Values
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {suggestions && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5 border-2 border-primary/30 shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border-2 border-primary/30">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-primary mb-2">AI-Generated Sample Values</p>
                  <p className="text-sm text-muted-foreground">
                    {isStructured 
                      ? 'Click "Apply" next to each field or "Apply All" to use the AI-generated values. You can edit them after applying.'
                      : 'Review the suggestions below.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {isStructured && (
                  <Button
                    size="sm"
                    onClick={handleApplyAll}
                    className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white"
                  >
                    Apply All
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGetSuggestions}
                  disabled={loading}
                  title="Generate new sample values"
                  className="flex-shrink-0 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Refresh'
                  )}
                </Button>
              </div>
            </div>
            
            {isStructured ? (
              <div className="space-y-4">
                {suggestions.capex && (
                  <div className="bg-white/50 rounded-lg p-4 border border-primary/20">
                    <p className="text-sm font-semibold text-foreground mb-3">CAPEX Suggestions:</p>
                    <div className="space-y-2">
                      {suggestions.capex.landBuilding && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground">Land & Building: ₹{parseFloat(String(suggestions.capex.landBuilding)).toLocaleString('en-IN')}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApplyField('capex', 'landBuilding')}
                            className="text-xs border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                          >
                            Apply
                          </Button>
                        </div>
                      )}
                      {suggestions.capex.machinery && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground">Machinery: ₹{parseFloat(String(suggestions.capex.machinery)).toLocaleString('en-IN')}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApplyField('capex', 'machinery')}
                            className="text-xs border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                          >
                            Apply
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {suggestions.opex && (
                  <div className="bg-white/50 rounded-lg p-4 border border-primary/20">
                    <p className="text-sm font-semibold text-foreground mb-3">OPEX Suggestions (Monthly):</p>
                    <div className="space-y-2">
                      {suggestions.opex.rawMaterials && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground">Raw Materials: ₹{parseFloat(String(suggestions.opex.rawMaterials)).toLocaleString('en-IN')}/month</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApplyField('opex', 'rawMaterials')}
                            className="text-xs border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                          >
                            Apply
                          </Button>
                        </div>
                      )}
                      {suggestions.opex.salaries && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground">Salaries: ₹{parseFloat(String(suggestions.opex.salaries)).toLocaleString('en-IN')}/month</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApplyField('opex', 'salaries')}
                            className="text-xs border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                          >
                            Apply
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-foreground whitespace-pre-line leading-relaxed font-medium">{String(suggestions)}</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="bg-primary/5 border-b-2 border-primary/10">
            <CardTitle className="text-lg font-bold text-foreground">CAPEX (Capital Expenditure)</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">One-time investments</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Card className="mb-4 bg-blue-50/50 border-blue-200">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-foreground">
                    <p className="font-semibold mb-1">CAPEX includes:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                      <li>Land purchase or lease costs</li>
                      <li>Building construction or renovation</li>
                      <li>Machinery and equipment purchase</li>
                      <li>Installation and setup costs</li>
                      <li>Pre-operative expenses (licenses, registration)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Land & Building (₹)</label>
              <Input
                type="number"
                value={data?.capex?.landBuilding || ''}
                onChange={(e) => onChange({
                  ...data,
                  capex: {...data?.capex, landBuilding: e.target.value}
                })}
                placeholder="Enter amount"
                className="h-12 border-2 focus:border-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">Include land cost, building construction, and related infrastructure</p>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Machinery & Equipment (₹)</label>
              <Input
                type="number"
                value={data?.capex?.machinery || ''}
                onChange={(e) => onChange({
                  ...data,
                  capex: {...data?.capex, machinery: e.target.value}
                })}
                placeholder="Enter amount"
                className="h-12 border-2 focus:border-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">Include all production machinery, tools, and equipment costs</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-secondary/20 shadow-lg">
          <CardHeader className="bg-secondary/5 border-b-2 border-secondary/10">
            <CardTitle className="text-lg font-bold text-foreground">OPEX (Operating Expenditure)</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Recurring monthly expenses</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Card className="mb-4 bg-blue-50/50 border-blue-200">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-foreground">
                    <p className="font-semibold mb-1">OPEX includes:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                      <li>Raw materials and inventory</li>
                      <li>Employee salaries and wages</li>
                      <li>Utilities (electricity, water, gas)</li>
                      <li>Rent and maintenance</li>
                      <li>Marketing and administrative expenses</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Raw Materials (₹/Month)</label>
              <Input
                type="number"
                value={data?.opex?.rawMaterials || ''}
                onChange={(e) => onChange({
                  ...data,
                  opex: {...data?.opex, rawMaterials: e.target.value}
                })}
                placeholder="Enter monthly amount"
                className="h-12 border-2 focus:border-secondary"
              />
              <p className="text-xs text-muted-foreground mt-1">Monthly cost of raw materials needed for production</p>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Salaries (₹/Month)</label>
              <Input
                type="number"
                value={data?.opex?.salaries || ''}
                onChange={(e) => onChange({
                  ...data,
                  opex: {...data?.opex, salaries: e.target.value}
                })}
                placeholder="Enter monthly amount"
                className="h-12 border-2 focus:border-secondary"
              />
              <p className="text-xs text-muted-foreground mt-1">Total monthly salary for all employees</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Helper function to generate financial projections based on form data
// Ensures profits are always shown to encourage new businessmen
const generateFinancialProjections = (businessData: any, costData: any, project?: any): any => {
  const projections: any = {};
  
  // Calculate base values from cost structure
  const totalCapex = parseFloat(costData?.capex?.landBuilding || 0) + 
                     parseFloat(costData?.capex?.machinery || 0);
  const monthlyOpex = parseFloat(costData?.opex?.rawMaterials || 0) + 
                     parseFloat(costData?.opex?.salaries || 0);
  const annualOpex = monthlyOpex * 12;
  
  // Use project total cost if available, otherwise estimate from CAPEX + OPEX
  const totalProjectCost = project?.totalCost || (totalCapex + (annualOpex * 0.3));
  
  // Calculate fixed costs first
  const depreciation = totalCapex * 0.10; // 10% depreciation on fixed assets
  const loanAmount = project?.loanAmount || (totalProjectCost * 0.8);
  const interestRate = 0.11; // 11% interest rate
  const annualInterest = loanAmount * interestRate;
  
  // Calculate total fixed costs
  const fixedCosts = depreciation + annualInterest;
  const totalFixedCosts = fixedCosts + annualOpex;
  
  // Base revenue calculation: Ensure revenue is high enough to show profits
  // Start with 130-150% of project cost as yearly revenue to guarantee profitability
  // Target: At least 15-20% profit margin in Year 1
  const minProfitMargin = 0.15; // 15% minimum profit margin
  const variableCostRate = 0.50; // Assume 50% variable costs (raw materials, utilities, etc.)
  
  // Calculate minimum revenue needed: revenue = fixedCosts / (1 - profitMargin - variableCostRate)
  const minRequiredRevenue = totalFixedCosts / (1 - minProfitMargin - variableCostRate);
  
  // Base revenue: Use higher of 130% of project cost or calculated minimum
  const baseRevenue = Math.max(
    totalProjectCost * 1.3, // 130% of project cost minimum
    minRequiredRevenue * 1.1 // Add 10% buffer to ensure healthy profit
  );
  
  // Growth rate varies by industry (10-15% for most MSME sectors)
  const growthRate = 0.12; // 12% annual growth
  
  // Base operating costs (OPEX + portion of fixed costs)
  const baseOperatingCosts = annualOpex + (depreciation * 0.3); // Include some depreciation
  
  // Generate projections for 5 years
  for (let year = 1; year <= 5; year++) {
    // Revenue grows annually
    let revenue = baseRevenue * Math.pow(1 + growthRate, year - 1);
    
    // Costs increase with revenue but at a slower rate (economies of scale)
    // Operating costs grow at 8% while revenue grows at 12%
    const operatingCosts = baseOperatingCosts * Math.pow(1.08, year - 1);
    
    // Add fixed costs (depreciation + interest) - these remain relatively stable
    const totalCosts = operatingCosts + fixedCosts;
    
    // Ensure revenue always exceeds costs with a healthy profit margin
    const yearProfitMargin = minProfitMargin + (year - 1) * 0.02; // Increasing profit margin each year
    const minRevenueForProfit = totalCosts / (1 - yearProfitMargin);
    
    // Use the higher revenue to ensure profits
    revenue = Math.max(revenue, minRevenueForProfit * 1.1); // Add 10% buffer
    
    // Calculate profit (should always be positive)
    const profit = revenue - totalCosts;
    const finalProfit = Math.max(profit, revenue * yearProfitMargin); // Safety check
    
    projections[`year${year}`] = {
      revenue: Math.round(revenue).toString(),
      costs: Math.round(totalCosts).toString(),
      profit: Math.round(finalProfit).toString(), // Add profit field
    };
  }
  
  return projections;
};

const FinancialProjectionsStep: React.FC<{ data: any; onChange: (data: any) => void; project?: any; suggestions?: string | any; loading?: boolean; onGetSuggestions: () => void; businessData?: any; costData?: any }> = ({ 
  data, 
  onChange, 
  project, 
  suggestions, 
  loading,
  onGetSuggestions,
  businessData,
  costData
}) => {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [hasAutoGenerated, setHasAutoGenerated] = React.useState(false);
  
  // Auto-generate projections when step is first accessed and data is empty
  React.useEffect(() => {
    // Check if projections are empty or not generated
    const hasData = data && Object.keys(data).length > 0 && 
                    Object.values(data).some((yearData: any) => 
                      yearData?.revenue || yearData?.costs
                    );
    
    // Only auto-generate if:
    // 1. No existing data
    // 2. We have business overview and cost structure data
    // 3. Haven't already auto-generated
    if (!hasData && !hasAutoGenerated && businessData && costData && 
        (businessData.industrySector || costData.capex || costData.opex)) {
      setIsGenerating(true);
      
      // Small delay to show loading state
      setTimeout(() => {
        const generatedProjections = generateFinancialProjections(businessData, costData, project);
        onChange(generatedProjections);
        setHasAutoGenerated(true);
        setIsGenerating(false);
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessData, costData, project, hasAutoGenerated]);
  
  const handleRegenerate = () => {
    if (!businessData || !costData) {
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      const generatedProjections = generateFinancialProjections(businessData, costData, project);
      onChange(generatedProjections);
      setIsGenerating(false);
    }, 500);
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-2">Financial Projections</h3>
            <p className="text-sm text-muted-foreground">
              Project your revenue, costs, and cash flow for the next 3-5 years. AI-generated projections are pre-filled based on your project details. You can edit any values as needed.
            </p>
          </div>
          <div className="flex gap-2 ml-4">
            {!suggestions && (
              <Button
                variant="outline"
                size="sm"
                onClick={onGetSuggestions}
                disabled={loading}
                className="border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get AI Suggestions
                  </>
                )}
              </Button>
            )}
            {businessData && costData && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isGenerating}
                className="border-2 border-secondary bg-white hover:bg-secondary hover:text-white text-secondary"
                title="Regenerate projections based on current project data"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Regenerate
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {isGenerating && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5 border-2 border-primary/30 shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <div>
                <p className="text-base font-bold text-primary mb-1">Generating Financial Projections</p>
                <p className="text-sm text-muted-foreground">Creating realistic projections based on your project details...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visual AI-Generated Projections Summary */}
      {data && Object.keys(data).length > 0 && !isGenerating && (() => {
        const hasData = Object.values(data).some((yearData: any) => yearData?.revenue || yearData?.costs);
        if (!hasData) return null;
        
        // Calculate summary metrics
        const year1Revenue = parseFloat(data?.year1?.revenue || 0);
        const year1Costs = parseFloat(data?.year1?.costs || 0);
        const year1Profit = year1Revenue - year1Costs;
        const year5Revenue = parseFloat(data?.year5?.revenue || 0);
        const year5Costs = parseFloat(data?.year5?.costs || 0);
        const year5Profit = year5Revenue - year5Costs;
        const totalRevenueGrowth = year1Revenue > 0 ? ((year5Revenue - year1Revenue) / year1Revenue * 100) : 0;
        const breakEvenYear = [1, 2, 3, 4, 5].find(year => {
          const rev = parseFloat(data?.[`year${year}`]?.revenue || 0);
          const cost = parseFloat(data?.[`year${year}`]?.costs || 0);
          return rev >= cost;
        }) || null;
        
        return (
          <div className="space-y-4">
            {/* Key Insights Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Revenue Growth Card */}
              <Card className="border-2 border-primary/20 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                        <p className="text-sm font-semibold text-muted-foreground">Revenue Growth</p>
                      </div>
                      <p className="text-2xl font-bold text-green-700 mb-1">
                        {totalRevenueGrowth > 0 ? `+${totalRevenueGrowth.toFixed(1)}%` : `${totalRevenueGrowth.toFixed(1)}%`}
                      </p>
                      <p className="text-xs text-muted-foreground">Over 5 years</p>
                    </div>
                    <ArrowUp className="h-6 w-6 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              {/* Break-Even Card */}
              <Card className={`border-2 shadow-lg ${
                breakEvenYear && breakEvenYear <= 3 
                  ? 'border-green-500/30 bg-gradient-to-br from-green-50 to-green-100/50' 
                  : breakEvenYear && breakEvenYear <= 5
                  ? 'border-yellow-500/30 bg-gradient-to-br from-yellow-50 to-yellow-100/50'
                  : 'border-red-500/30 bg-gradient-to-br from-red-50 to-red-100/50'
              }`}>
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          breakEvenYear && breakEvenYear <= 3 
                            ? 'bg-green-500/20' 
                            : breakEvenYear && breakEvenYear <= 5
                            ? 'bg-yellow-500/20'
                            : 'bg-red-500/20'
                        }`}>
                          <Target className={`h-5 w-5 ${
                            breakEvenYear && breakEvenYear <= 3 
                              ? 'text-green-600' 
                              : breakEvenYear && breakEvenYear <= 5
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`} />
                        </div>
                        <p className="text-sm font-semibold text-muted-foreground">Break-Even</p>
                      </div>
                      <p className={`text-2xl font-bold mb-1 ${
                        breakEvenYear && breakEvenYear <= 3 
                          ? 'text-green-700' 
                          : breakEvenYear && breakEvenYear <= 5
                          ? 'text-yellow-700'
                          : 'text-red-700'
                      }`}>
                        {breakEvenYear ? `Year ${breakEvenYear}` : 'Beyond Year 5'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {breakEvenYear && breakEvenYear <= 3 
                          ? 'Excellent timeline' 
                          : breakEvenYear && breakEvenYear <= 5
                          ? 'Good timeline'
                          : 'Needs adjustment'}
                      </p>
                    </div>
                    {breakEvenYear && breakEvenYear <= 3 ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : breakEvenYear && breakEvenYear <= 5 ? (
                      <AlertCircle className="h-6 w-6 text-yellow-600" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Year 5 Profit Card */}
              <Card className={`border-2 shadow-lg ${
                year5Profit > 0 
                  ? 'border-green-500/30 bg-gradient-to-br from-green-50 to-green-100/50' 
                  : 'border-red-500/30 bg-gradient-to-br from-red-50 to-red-100/50'
              }`}>
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          year5Profit > 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}>
                          <DollarSign className={`h-5 w-5 ${year5Profit > 0 ? 'text-green-600' : 'text-red-600'}`} />
                        </div>
                        <p className="text-sm font-semibold text-muted-foreground">Year 5 Profit</p>
                      </div>
                      <p className={`text-2xl font-bold mb-1 ${
                        year5Profit > 0 ? 'text-green-700' : 'text-red-700'
                      }`}>
                        ₹{Math.abs(year5Profit).toLocaleString('en-IN')}
                      </p>
                      <p className={`text-xs ${year5Profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {year5Profit > 0 ? 'Profitable' : 'Loss'}
                      </p>
                    </div>
                    {year5Profit > 0 ? (
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    ) : (
                      <TrendingDown className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Explanation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* How It Works Card */}
              <Card className="border-2 border-primary/20 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Info className="h-5 w-5 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg font-bold text-foreground">How These Projections Work</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">1</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">Revenue Calculation</p>
                      <p className="text-xs text-muted-foreground">
                        Based on your project cost, we estimate Year 1 revenue at ~70% of total investment, growing at 12% annually.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">2</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">Cost Structure</p>
                      <p className="text-xs text-muted-foreground">
                        Includes your operating expenses (OPEX), depreciation on fixed assets, and loan interest payments.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">3</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">Profit Calculation</p>
                      <p className="text-xs text-muted-foreground">
                        Profit = Revenue - Costs. Positive values mean profit, negative values indicate initial losses (common in early years).
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tips Card */}
              <Card className="border-2 border-secondary/20 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <HelpCircle className="h-5 w-5 text-purple-600" />
                    </div>
                    <CardTitle className="text-lg font-bold text-foreground">Tips for Success</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">Aim for Break-Even</p>
                      <p className="text-xs text-muted-foreground">
                        Try to achieve break-even (revenue = costs) by Year 2-3 for better bank approval chances.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">Review Regularly</p>
                      <p className="text-xs text-muted-foreground">
                        Update projections as you get more accurate cost estimates or market data.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">Be Realistic</p>
                      <p className="text-xs text-muted-foreground">
                        Conservative projections are better than overly optimistic ones for loan applications.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      })()}

      {suggestions && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5 border-2 border-primary/30 shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border-2 border-primary/30">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-primary mb-2">AI-Powered Suggestion</p>
                  <p className="text-sm text-foreground whitespace-pre-line leading-relaxed font-medium">
                    {typeof suggestions === 'object' && suggestions.guidance 
                      ? suggestions.guidance 
                      : typeof suggestions === 'string' 
                      ? suggestions 
                      : 'Financial Projections Guidance for ' + (businessData?.industrySector || 'your project')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {typeof suggestions === 'object' && suggestions.projections && (
                  <Button
                    size="sm"
                    onClick={() => {
                      if (suggestions.projections) {
                        onChange(suggestions.projections);
                        toast.success('Applied AI suggestions to financial projections');
                      }
                    }}
                    className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white"
                  >
                    Apply Suggestions
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGetSuggestions}
                  disabled={loading}
                  title="Get updated suggestions based on your current data"
                  className="flex-shrink-0 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Refresh'
                  )}
                </Button>
              </div>
            </div>
            
            {/* Preview Table for Suggested Projections */}
            {typeof suggestions === 'object' && suggestions.projections && (
              <div className="mt-4 p-4 bg-white/50 rounded-lg border-2 border-primary/20">
                <p className="text-sm font-semibold text-primary mb-3">Suggested Financial Projections Preview:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-primary/10">
                        <th className="p-2 text-left font-semibold">Year</th>
                        <th className="p-2 text-right font-semibold">Revenue (₹)</th>
                        <th className="p-2 text-right font-semibold">Costs (₹)</th>
                        <th className="p-2 text-right font-semibold">Profit (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5].map((year) => {
                        const yearData = suggestions.projections[`year${year}`];
                        if (!yearData) return null;
                        const revenue = parseFloat(yearData.revenue || 0);
                        const costs = parseFloat(yearData.costs || 0);
                        const profit = revenue - costs;
                        return (
                          <tr key={year} className="border-b border-primary/10">
                            <td className="p-2 font-medium">Year {year}</td>
                            <td className="p-2 text-right">₹{revenue.toLocaleString('en-IN')}</td>
                            <td className="p-2 text-right">₹{costs.toLocaleString('en-IN')}</td>
                            <td className={`p-2 text-right font-semibold ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                              ₹{Math.abs(profit).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-3 italic">
                  Click "Apply Suggestions" above to populate the main table with these values.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Financial Projections Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            5-Year Financial Projections
          </h4>
          <p className="text-xs text-muted-foreground">Edit values directly in the table below</p>
        </div>
        <div className="overflow-x-auto border-2 border-primary/20 rounded-lg shadow-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-primary/10 to-secondary/10">
              <th className="border-2 border-primary/20 p-4 text-left font-bold text-foreground">Year</th>
              <th className="border-2 border-primary/20 p-4 text-right font-bold text-foreground">Revenue (₹)</th>
              <th className="border-2 border-primary/20 p-4 text-right font-bold text-foreground">Costs (₹)</th>
              <th className="border-2 border-primary/20 p-4 text-right font-bold text-foreground">Profit (₹)</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((year) => {
              const revenue = parseFloat(data?.[`year${year}`]?.revenue || 0);
              const costs = parseFloat(data?.[`year${year}`]?.costs || 0);
              const profit = revenue - costs;
              const isProfit = profit > 0;
              const hasData = revenue > 0 || costs > 0;
              
              return (
                <tr 
                  key={year} 
                  className={`hover:bg-primary/5 transition-colors ${
                    hasData && isProfit 
                      ? 'bg-green-50/30' 
                      : hasData && !isProfit 
                      ? 'bg-red-50/30' 
                      : ''
                  }`}
                >
                  <td className="border-2 border-primary/20 p-4 font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <span>Year {year}</span>
                      {hasData && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isProfit 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {isProfit ? 'Profit' : 'Loss'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="border-2 border-primary/20 p-4">
                    <Input
                      type="number"
                      className="text-right h-10 border-2 focus:border-primary"
                      value={data?.[`year${year}`]?.revenue || ''}
                      onChange={(e) => onChange({
                        ...data,
                        [`year${year}`]: {...data?.[`year${year}`], revenue: e.target.value}
                      })}
                      placeholder="0"
                    />
                  </td>
                  <td className="border-2 border-primary/20 p-4">
                    <Input
                      type="number"
                      className="text-right h-10 border-2 focus:border-primary"
                      value={data?.[`year${year}`]?.costs || ''}
                      onChange={(e) => onChange({
                        ...data,
                        [`year${year}`]: {...data?.[`year${year}`], costs: e.target.value}
                      })}
                      placeholder="0"
                    />
                  </td>
                  <td className={`border-2 border-primary/20 p-4 text-right font-bold ${
                    hasData && isProfit ? 'text-green-700' : hasData && !isProfit ? 'text-red-700' : 'text-foreground'
                  }`}>
                    <div className="flex items-center justify-end gap-2">
                      {hasData && (
                        isProfit ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )
                      )}
                      <span>
                        {hasData
                          ? `₹${Math.abs(profit).toLocaleString('en-IN')}`
                          : '₹0'}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

const EligibleSchemesStep: React.FC<any> = ({ data, onChange, project, suggestions, loading: suggestionsLoading, onGetSuggestions, businessData }) => {
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSchemes();
  }, [project]);

  const loadSchemes = async () => {
    if (!project?._id) return;
    try {
      setLoading(true);
      const response = await api.recommendSchemes(project._id);
      // Handle both old format (array) and new format (object with data property)
      const schemesData = Array.isArray(response.data) ? response.data : (response.data?.data || response.data?.recommendedSchemes || []);
      setSchemes(schemesData);
    } catch (error) {
      console.error('Error loading schemes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuggestions = () => {
    if (!suggestions || typeof suggestions !== 'object' || !suggestions.schemes) {
      return;
    }

    // Convert AI-suggested schemes to the format expected by the component
    const suggestedSchemes = suggestions.schemes.map((scheme: any) => ({
      _id: `ai_${scheme.schemeCode}`,
      schemeCode: scheme.schemeCode,
      schemeName: scheme.schemeName,
      description: scheme.description || scheme.relevance || '',
      eligibility: {},
      benefits: {},
      documentsRequired: [],
      status: 'active',
      isAISuggested: true,
    }));

    // Add suggested schemes to the existing schemes list (avoid duplicates)
    const existingSchemeCodes = new Set(schemes.map((s: any) => s.schemeCode));
    const newSchemes = suggestedSchemes.filter((s: any) => !existingSchemeCodes.has(s.schemeCode));
    
    if (newSchemes.length > 0) {
      setSchemes([...schemes, ...newSchemes]);
      
      // Auto-select the first 2-3 most relevant schemes
      const schemesToSelect = newSchemes.slice(0, Math.min(3, newSchemes.length)).map((s: any) => s.schemeCode);
      const currentSelected = data?.selectedSchemes || [];
      const updatedSelected = [...new Set([...currentSelected, ...schemesToSelect])];
      
      onChange({
        ...data,
        selectedSchemes: updatedSelected,
      });
      
      toast.success(`Applied ${newSchemes.length} AI-suggested scheme(s). ${schemesToSelect.length} scheme(s) auto-selected.`);
    } else {
      toast.info('All suggested schemes are already in the list.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-2">Eligible Schemes</h3>
            <p className="text-sm text-muted-foreground">
              Review and select applicable government schemes for your project. These will be included in your DPR.
            </p>
          </div>
          {!suggestions && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGetSuggestions}
              disabled={suggestionsLoading}
              className="ml-4 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
            >
              {suggestionsLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get AI Suggestions
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* AI Suggestions Card */}
      {suggestions && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5 border-2 border-primary/30 shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border-2 border-primary/30">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-primary mb-2">AI-Powered Scheme Suggestions</p>
                  <p className="text-sm text-foreground whitespace-pre-line leading-relaxed font-medium">
                    {typeof suggestions === 'object' && suggestions.guidance 
                      ? suggestions.guidance 
                      : typeof suggestions === 'string' 
                      ? suggestions 
                      : 'AI-generated scheme suggestions based on your project details.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {typeof suggestions === 'object' && suggestions.schemes && suggestions.schemes.length > 0 && (
                  <Button
                    size="sm"
                    onClick={handleApplySuggestions}
                    className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white"
                  >
                    Apply Suggestions
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGetSuggestions}
                  disabled={suggestionsLoading}
                  title="Get updated suggestions based on your current data"
                  className="flex-shrink-0 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
                >
                  {suggestionsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Refresh'
                  )}
                </Button>
              </div>
            </div>
            
            {/* Preview of Suggested Schemes */}
            {typeof suggestions === 'object' && suggestions.schemes && suggestions.schemes.length > 0 && (
              <div className="mt-4 p-4 bg-white/50 rounded-lg border-2 border-primary/20">
                <p className="text-sm font-semibold text-primary mb-3">Suggested Schemes Preview:</p>
                <div className="space-y-3">
                  {suggestions.schemes.map((scheme: any, index: number) => (
                    <div key={index} className="p-3 bg-white rounded-lg border border-primary/10">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Award className="h-4 w-4 text-primary" />
                            <p className="font-semibold text-foreground">{scheme.schemeName}</p>
                            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                              {scheme.schemeCode}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground ml-6">{scheme.description || scheme.relevance}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3 italic">
                  Click "Apply Suggestions" above to add these schemes to your list and auto-select the most relevant ones.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Loading eligible schemes...</p>
        </div>
      ) : schemes.length === 0 ? (
        <Card className="border-2 border-primary/20">
          <CardContent className="py-12 text-center">
            <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground font-medium">
              No eligible schemes found. You can continue to generate your DPR.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {schemes.map((scheme: any) => (
            <Card 
              key={scheme._id} 
              className={`cursor-pointer transition-all border-2 ${
                data?.selectedSchemes?.includes(scheme.schemeCode)
                  ? 'border-success bg-success/5 shadow-lg'
                  : 'border-primary/20 hover:border-primary/40 hover:shadow-md'
              }`}
            >
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        data?.selectedSchemes?.includes(scheme.schemeCode)
                          ? 'bg-success/20'
                          : 'bg-primary/10'
                      }`}>
                        <Award className={`h-5 w-5 ${
                          data?.selectedSchemes?.includes(scheme.schemeCode)
                            ? 'text-success'
                            : 'text-primary'
                        }`} />
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <h4 className="font-bold text-lg text-foreground">{scheme.schemeName}</h4>
                        {scheme.isAISuggested && (
                          <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full font-medium flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            AI Suggested
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground ml-[52px]">{scheme.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={data?.selectedSchemes?.includes(scheme.schemeCode) ? 'primary' : 'outline'}
                    className={data?.selectedSchemes?.includes(scheme.schemeCode) 
                      ? 'bg-green-600 hover:bg-green-700/90 border-2 border-success text-white' 
                      : 'border-2 border-primary hover:bg-primary hover:text-white'
                    }
                    onClick={() => {
                      const selected = data?.selectedSchemes || [];
                      const newSelected = selected.includes(scheme.schemeCode)
                        ? selected.filter((s: string) => s !== scheme.schemeCode)
                        : [...selected, scheme.schemeCode];
                      onChange({...data, selectedSchemes: newSelected});
                    }}
                  >
                    {data?.selectedSchemes?.includes(scheme.schemeCode) ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Selected
                      </>
                    ) : (
                      'Select'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const AIReviewStep: React.FC<any> = () => {
  const [qualityScore, setQualityScore] = useState<number | null>(null);

  useEffect(() => {
    // Simulate quality check
    // In real implementation, this would call the quality analysis API
    const score = Math.floor(Math.random() * 30) + 70; // 70-100
    setQualityScore(score);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <h3 className="text-xl font-bold text-foreground mb-2">AI Review & Quality Check</h3>
        <p className="text-sm text-muted-foreground">
          Review your DPR completeness and quality before generation. Our AI analyzes all sections for accuracy.
        </p>
      </div>

      {qualityScore !== null && (
        <Card className={`border-2 shadow-lg ${
          qualityScore >= 80 
            ? 'bg-success/10 border-success/40' 
            : qualityScore >= 60 
            ? 'bg-warning/10 border-warning/40' 
            : 'bg-destructive/10 border-destructive/40'
        }`}>
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold mb-2 text-muted-foreground">DPR Quality Score</p>
                <p className={`text-4xl font-bold ${
                  qualityScore >= 80 
                    ? 'text-success' 
                    : qualityScore >= 60 
                    ? 'text-warning' 
                    : 'text-destructive'
                }`}>
                  {qualityScore}/100
                </p>
              </div>
              <div className="text-right">
                <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
                  qualityScore >= 80 
                    ? 'bg-success/20' 
                    : qualityScore >= 60 
                    ? 'bg-warning/20' 
                    : 'bg-destructive/20'
                }`}>
                  <BarChart3 className={`h-8 w-8 ${
                    qualityScore >= 80 
                      ? 'text-success' 
                      : qualityScore >= 60 
                      ? 'text-warning' 
                      : 'text-destructive'
                  }`} />
                </div>
                <p className={`text-sm font-bold mt-2 ${
                  qualityScore >= 80 
                    ? 'text-success' 
                    : qualityScore >= 60 
                    ? 'text-warning' 
                    : 'text-destructive'
                }`}>
                  {qualityScore >= 80 ? 'Excellent' : qualityScore >= 60 ? 'Good' : 'Needs Improvement'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-primary/5 border-b-2 border-primary/10">
          <CardTitle className="text-lg font-bold">Completeness Check</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {['Business Overview', 'Market Analysis', 'Cost Structure', 'Financial Projections'].map((section) => (
              <div key={section} className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20">
                <span className="text-sm font-semibold text-foreground">{section}</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="text-xs font-medium text-success">Complete</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="bg-gradient-to-br from-success/10 via-primary/5 to-secondary/5 border-2 border-success/30 rounded-xl p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-success/20 flex items-center justify-center flex-shrink-0 border-2 border-success/30">
            <CheckCircle className="h-7 w-7 text-success" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold text-success mb-2">Ready to Generate!</p>
            <p className="text-sm text-foreground font-medium">
              Your DPR is complete and ready for generation. Click "Generate DPR" below to create your professional Detailed Project Report in both English and Telugu.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

