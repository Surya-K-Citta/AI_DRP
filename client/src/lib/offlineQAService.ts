/**
 * Offline Q&A Service
 * Searches and retrieves answers from the offline Q&A database
 */

import qaDatabase from './offlineQA.json';
import mockProjectExample from './mockProjectExample.json';
import dprCreationDemo from './dprCreationDemo.json';

interface QAEntry {
  question: string;
  keywords: string[];
  answer: string;
  suggestions?: string[];
  dprWorkflow?: any;
}

interface QACategory {
  name: string;
  questions: QAEntry[];
}

interface QADatabase {
  categories: QACategory[];
  general: QAEntry[];
}

/**
 * Calculate similarity score between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 1.0;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Word-based matching
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  let matches = 0;
  words1.forEach(word => {
    if (words2.some(w => w.includes(word) || word.includes(w))) {
      matches++;
    }
  });
  
  return matches / Math.max(words1.length, words2.length);
}

/**
 * Find the best matching question from the database
 */
function findBestMatch(userQuestion: string, threshold: number = 0.3): QAEntry | null {
  const lowerQuestion = userQuestion.toLowerCase().trim();
  const db = qaDatabase as QADatabase;
  
  let bestMatch: QAEntry | null = null;
  let bestScore = 0;
  
  // Search through all categories
  db.categories.forEach(category => {
    category.questions.forEach(qa => {
      // Check question text similarity
      const questionScore = calculateSimilarity(lowerQuestion, qa.question);
      
      // Check keyword matches
      let keywordScore = 0;
      qa.keywords.forEach(keyword => {
        if (lowerQuestion.includes(keyword.toLowerCase())) {
          keywordScore += 0.2;
        }
      });
      keywordScore = Math.min(keywordScore, 1.0);
      
      // Combined score (weighted: 60% question match, 40% keyword match)
      const combinedScore = (questionScore * 0.6) + (keywordScore * 0.4);
      
      if (combinedScore > bestScore && combinedScore >= threshold) {
        bestScore = combinedScore;
        bestMatch = qa;
      }
    });
  });
  
  // Also search general questions
  db.general.forEach(qa => {
    const questionScore = calculateSimilarity(lowerQuestion, qa.question);
    let keywordScore = 0;
    qa.keywords.forEach(keyword => {
      if (lowerQuestion.includes(keyword.toLowerCase())) {
        keywordScore += 0.2;
      }
    });
    keywordScore = Math.min(keywordScore, 1.0);
    
    const combinedScore = (questionScore * 0.6) + (keywordScore * 0.4);
    
    if (combinedScore > bestScore && combinedScore >= threshold) {
      bestScore = combinedScore;
      bestMatch = qa;
    }
  });
  
  return bestMatch;
}

/**
 * Get answer for a user question from offline database
 */
export function getOfflineAnswer(userQuestion: string): {
  answer: string;
  suggestions?: string[];
  matchScore?: number;
  dprWorkflow?: any;
} | null {
  const match = findBestMatch(userQuestion);
  
  if (!match) {
    return null;
  }
  
  // If it's a DPR workflow question, enhance answer with mock project data
  let enhancedAnswer = match.answer;
  if (match.dprWorkflow) {
    enhancedAnswer = enhanceAnswerWithMockData(match.answer, userQuestion, match.dprWorkflow);
  }
  
  return {
    answer: enhancedAnswer,
    suggestions: match.suggestions,
    dprWorkflow: match.dprWorkflow,
  };
}

/**
 * Enhance answer with mock project data for contextual responses
 */
function enhanceAnswerWithMockData(answer: string, userQuestion: string, _workflow: any): string {
  const project = mockProjectExample as any;
  const lowerQuestion = userQuestion.toLowerCase();
  
  // Add contextual examples based on the question
  if (lowerQuestion.includes('project name') || lowerQuestion.includes('name')) {
    return answer.replace(
      /For example:[\s\S]*?(?=\n\n|$)/,
      `For example:\n- "${project.projectName}"\n- "Handloom Textile Manufacturing"\n- "Solar Panel Manufacturing Unit"`
    );
  }
  
  if (lowerQuestion.includes('sector') || lowerQuestion.includes('industry')) {
    return answer + `\n\n**Example:**\nFor "${project.projectName}", the industry sector is "${project.industrySector}" (${project.subSector}).`;
  }
  
  if (lowerQuestion.includes('individual') || lowerQuestion.includes('cluster') || lowerQuestion.includes('type')) {
    return answer + `\n\n**Example:**\n"${project.projectName}" is an "${project.projectType}" project.`;
  }
  
  if (lowerQuestion.includes('investment') || lowerQuestion.includes('cost') || lowerQuestion.includes('amount')) {
    const investment = project.totalInvestment.toLocaleString('en-IN');
    return answer + `\n\n**Example:**\n"${project.projectName}" has a total investment of ₹${investment} (₹${(project.totalInvestment/100000).toFixed(1)} lakhs).\n\n**Breakdown:**\n- Land & Building: ₹${project.financialStructure.breakdown.landAndBuilding.total.toLocaleString('en-IN')}\n- Machinery & Equipment: ₹${project.financialStructure.breakdown.machineryAndEquipment.total.toLocaleString('en-IN')}\n- Working Capital: ₹${project.financialStructure.breakdown.workingCapital.total.toLocaleString('en-IN')}\n- Pre-operative Expenses: ₹${project.financialStructure.breakdown.preOperativeExpenses.total.toLocaleString('en-IN')}\n- Contingency: ₹${project.financialStructure.breakdown.contingency.amount.toLocaleString('en-IN')}`;
  }
  
  if (lowerQuestion.includes('location') || lowerQuestion.includes('where')) {
    return answer + `\n\n**Example:**\n"${project.projectName}" is located in ${project.location.city}, ${project.location.state}.\n\n**Location Details:**\n- City: ${project.location.city}\n- State: ${project.location.state}\n- Area: ${project.location.area}\n- Address: ${project.location.address}`;
  }
  
  if (lowerQuestion.includes('business') && (lowerQuestion.includes('describe') || lowerQuestion.includes('detail'))) {
    return answer + `\n\n**Complete Example:**\n"${project.businessDescription.overview}"\n\n**Products:**\n${project.businessDescription.products.map((p: any) => `- ${p.name}: ${p.description}`).join('\n')}\n\n**Production Capacity:**\n- Monthly: ${project.businessDescription.productionCapacity.monthly.toLocaleString('en-IN')} ${project.businessDescription.productionCapacity.unit}\n- Annual: ${project.businessDescription.productionCapacity.annual.toLocaleString('en-IN')} ${project.businessDescription.productionCapacity.unit}\n\n**Unique Selling Points:**\n${project.businessDescription.uniqueSellingPoints.map((usp: string) => `- ${usp}`).join('\n')}`;
  }
  
  if (lowerQuestion.includes('target market') || lowerQuestion.includes('customers') || lowerQuestion.includes('market')) {
    return answer + `\n\n**Complete Example for "${project.projectName}":**\n\n**Primary Customers:**\n${project.targetMarket.primaryCustomers.map((c: string) => `- ${c}`).join('\n')}\n\n**Market Distribution:**\n- Domestic Retail: ${project.targetMarket.geographicMarkets.domestic.percentage}%\n- Export Markets: ${project.targetMarket.geographicMarkets.export.percentage}%\n- Online Platforms: ${project.targetMarket.geographicMarkets.online.percentage}%\n\n**Distribution Channels:**\n${project.targetMarket.distributionChannels.map((ch: string) => `- ${ch}`).join('\n')}\n\n**Market Size:**\n- Total Market: ${project.targetMarket.marketSize.totalMarket}\n- Growth Rate: ${project.targetMarket.marketSize.growthRate}\n- Organic Segment Growth: ${project.targetMarket.marketSize.organicSegment}`;
  }
  
  // Handle machinery questions
  if (lowerQuestion.includes('machinery') || lowerQuestion.includes('equipment') || lowerQuestion.includes('machines')) {
    const machinery = project.technicalFeasibility.machineryAndEquipment;
    let machineryDetails = `\n\n**Complete Example for "${project.projectName}":**\n\n`;
    machinery.forEach((item: any, index: number) => {
      machineryDetails += `**${index + 1}. ${item.name}**\n`;
      machineryDetails += `   - Quantity: ${item.quantity}\n`;
      machineryDetails += `   - Specifications: ${item.specifications}\n`;
      machineryDetails += `   - Cost: ₹${item.cost.toLocaleString('en-IN')}\n`;
      machineryDetails += `   - Total: ₹${(item.cost * item.quantity).toLocaleString('en-IN')}\n`;
      machineryDetails += `   - Purpose: ${item.purpose || 'Production'}\n\n`;
    });
    machineryDetails += `**Total Machinery Cost: ₹${project.financialStructure.breakdown.machineryAndEquipment.total.toLocaleString('en-IN')}**\n\n`;
    machineryDetails += `**Infrastructure Requirements:**\n`;
    machineryDetails += `- Power: ${project.technicalFeasibility.infrastructure.utilities.power.requirement} ${project.technicalFeasibility.infrastructure.utilities.power.unit}\n`;
    machineryDetails += `- Processing Area: ${project.technicalFeasibility.infrastructure.building.breakdown.processingArea} sq.ft\n`;
    return answer + machineryDetails;
  }
  
  // Handle raw materials questions
  if (lowerQuestion.includes('raw material') || lowerQuestion.includes('materials') || lowerQuestion.includes('inputs')) {
    const rawMaterials = project.technicalFeasibility.rawMaterials;
    let materialsDetails = `\n\n**Complete Example for "${project.projectName}":**\n\n`;
    rawMaterials.forEach((item: any, index: number) => {
      materialsDetails += `**${index + 1}. ${item.item}**\n`;
      materialsDetails += `   - Quantity: ${item.quantity.toLocaleString('en-IN')} ${item.unit}\n`;
      materialsDetails += `   - Cost per ${item.unit.split('/')[0]}: ₹${item.costPerUnit}\n`;
      materialsDetails += `   - Monthly Cost: ₹${item.totalCost.toLocaleString('en-IN')}\n`;
      materialsDetails += `   - Supplier: ${item.supplier}\n`;
      materialsDetails += `   - Availability: ${item.availability}\n\n`;
    });
    const totalMonthly = rawMaterials.reduce((sum: number, item: any) => sum + item.totalCost, 0);
    materialsDetails += `**Total Raw Material Cost:**\n`;
    materialsDetails += `- Monthly: ₹${totalMonthly.toLocaleString('en-IN')}\n`;
    materialsDetails += `- Annual: ₹${(totalMonthly * 12).toLocaleString('en-IN')}\n`;
    return answer + materialsDetails;
  }
  
  // Handle manpower questions
  if (lowerQuestion.includes('employee') || lowerQuestion.includes('manpower') || lowerQuestion.includes('staff') || lowerQuestion.includes('workers')) {
    const manpower = project.technicalFeasibility.manpower;
    let manpowerDetails = `\n\n**Complete Example for "${project.projectName}":**\n\n`;
    manpower.forEach((item: any, index: number) => {
      manpowerDetails += `**${index + 1}. ${item.designation}**\n`;
      manpowerDetails += `   - Count: ${item.count}\n`;
      manpowerDetails += `   - Qualifications: ${item.qualifications}\n`;
      manpowerDetails += `   - Salary: ₹${item.salaryPerMonth.toLocaleString('en-IN')}/month per person\n`;
      manpowerDetails += `   - Annual: ₹${(item.salaryPerMonth * item.count * 12).toLocaleString('en-IN')} (total)\n`;
      manpowerDetails += `   - Responsibilities: ${item.responsibilities}\n\n`;
    });
    const totalMonthly = manpower.reduce((sum: number, item: any) => sum + (item.salaryPerMonth * item.count), 0);
    const totalAnnual = totalMonthly * 12;
    const benefits = totalAnnual * 0.2;
    manpowerDetails += `**Total Manpower:**\n`;
    manpowerDetails += `- Total Employees: ${manpower.reduce((sum: number, item: any) => sum + item.count, 0)}\n`;
    manpowerDetails += `- Monthly Salary: ₹${totalMonthly.toLocaleString('en-IN')}\n`;
    manpowerDetails += `- Annual Salary: ₹${totalAnnual.toLocaleString('en-IN')}\n`;
    manpowerDetails += `- Benefits (20%): ₹${benefits.toLocaleString('en-IN')}\n`;
    manpowerDetails += `- **Total Annual Cost: ₹${(totalAnnual + benefits).toLocaleString('en-IN')}**\n`;
    return answer + manpowerDetails;
  }
  
  // Handle financial projections questions
  if (lowerQuestion.includes('financial projection') || lowerQuestion.includes('revenue') || lowerQuestion.includes('profit') || lowerQuestion.includes('financials')) {
    const financials = project.financialProjections;
    let financialDetails = `\n\n**Complete Example for "${project.projectName}":**\n\n`;
    financialDetails += `**Year 1 Financial Projections:**\n\n`;
    financialDetails += `**Revenue:**\n`;
    Object.keys(financials.year1.revenue).forEach((key: string) => {
      if (key !== 'total') {
        const product = financials.year1.revenue[key as keyof typeof financials.year1.revenue] as any;
        financialDetails += `- ${key.charAt(0).toUpperCase() + key.slice(1)}: ₹${product.total.toLocaleString('en-IN')} (${product.quantity.toLocaleString('en-IN')} ${product.unit} × ₹${product.price})\n`;
      }
    });
    financialDetails += `- **Total Revenue: ₹${financials.year1.revenue.total.toLocaleString('en-IN')}**\n\n`;
    financialDetails += `**Costs:**\n`;
    financialDetails += `- Raw Materials: ₹${financials.year1.costs.rawMaterials.toLocaleString('en-IN')}\n`;
    financialDetails += `- Labor: ₹${financials.year1.costs.labor.toLocaleString('en-IN')}\n`;
    financialDetails += `- Overheads: ₹${financials.year1.costs.overheads.toLocaleString('en-IN')}\n`;
    financialDetails += `- Interest: ₹${financials.year1.costs.interest.toLocaleString('en-IN')}\n`;
    financialDetails += `- Depreciation: ₹${financials.year1.costs.depreciation.toLocaleString('en-IN')}\n`;
    financialDetails += `- **Total Costs: ₹${financials.year1.costs.total.toLocaleString('en-IN')}**\n\n`;
    financialDetails += `**Profitability:**\n`;
    financialDetails += `- Net Profit: ₹${financials.year1.profit.net.toLocaleString('en-IN')}\n`;
    financialDetails += `- Profit Margin: ${financials.year1.profit.margin}%\n`;
    financialDetails += `- ROI: ${financials.keyMetrics.roi}%\n`;
    financialDetails += `- Payback Period: ${financials.keyMetrics.paybackPeriod} years\n`;
    financialDetails += `- Break-even: ${financials.keyMetrics.breakEvenPoint.units.toLocaleString('en-IN')} ${financials.keyMetrics.breakEvenPoint.unit} (${financials.keyMetrics.breakEvenPoint.months} months)\n`;
    return answer + financialDetails;
  }
  
  return answer;
}

/**
 * Get mock project example data
 */
export function getMockProjectExample() {
  return mockProjectExample;
}

/**
 * Get all questions from a specific category
 */
export function getQuestionsByCategory(categoryName: string): QAEntry[] {
  const db = qaDatabase as QADatabase;
  const category = db.categories.find(cat => 
    cat.name.toLowerCase().includes(categoryName.toLowerCase())
  );
  
  return category ? category.questions : [];
}

/**
 * Get all available categories
 */
export function getCategories(): string[] {
  const db = qaDatabase as QADatabase;
  return db.categories.map(cat => cat.name);
}

/**
 * Search questions by keyword
 */
export function searchQuestions(keyword: string): QAEntry[] {
  const db = qaDatabase as QADatabase;
  const lowerKeyword = keyword.toLowerCase();
  const results: QAEntry[] = [];
  
  // Search in categories
  db.categories.forEach(category => {
    category.questions.forEach(qa => {
      if (
        qa.question.toLowerCase().includes(lowerKeyword) ||
        qa.keywords.some(k => k.toLowerCase().includes(lowerKeyword)) ||
        qa.answer.toLowerCase().includes(lowerKeyword)
      ) {
        results.push(qa);
      }
    });
  });
  
  // Search in general
  db.general.forEach(qa => {
    if (
      qa.question.toLowerCase().includes(lowerKeyword) ||
      qa.keywords.some(k => k.toLowerCase().includes(lowerKeyword)) ||
      qa.answer.toLowerCase().includes(lowerKeyword)
    ) {
      results.push(qa);
    }
  });
  
  return results;
}

/**
 * Get example questions for offline mode
 */
export function getExampleQuestions(count: number = 10): string[] {
  const db = qaDatabase as QADatabase;
  const examples: string[] = [];
  
  // Get questions from each category
  db.categories.forEach(category => {
    category.questions.forEach(qa => {
      examples.push(qa.question);
    });
  });
  
  // Add general questions
  db.general.forEach(qa => {
    examples.push(qa.question);
  });
  
  // Shuffle and return requested count
  const shuffled = examples.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Get DPR creation workflow demonstration data
 */
export function getDPRCreationDemo() {
  return dprCreationDemo;
}

/**
 * Get a specific workflow step by step number
 */
export function getWorkflowStep(stepNumber: number) {
  const demo = dprCreationDemo as any;
  return demo.workflowSteps.find((step: any) => step.stepNumber === stepNumber) || null;
}

/**
 * Get all workflow steps
 */
export function getAllWorkflowSteps() {
  const demo = dprCreationDemo as any;
  return demo.workflowSteps || [];
}

/**
 * Get workflow summary
 */
export function getWorkflowSummary() {
  const demo = dprCreationDemo as any;
  return demo.summary || null;
}

/**
 * Get example project information
 */
export function getExampleProjectInfo() {
  const demo = dprCreationDemo as any;
  return demo.exampleProject || null;
}

/**
 * Get key features of the workflow
 */
export function getWorkflowKeyFeatures() {
  const demo = dprCreationDemo as any;
  return demo.keyFeatures || [];
}

/**
 * Get usage information for offline mode
 */
export function getOfflineModeUsage() {
  const demo = dprCreationDemo as any;
  return demo.usageInOfflineMode || null;
}

