// @ts-nocheck
import OpenAI from 'openai';
import { WhisperTeluguService } from './whisper-telugu.service';
import { IProject } from '../types';
import { VectorStore } from '../models/VectorStore.model';
import { RAGMetrics } from '../models/RAGMetrics.model';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { promisify } from 'util';

const readFileAsync = promisify(fs.readFile);

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required. Please set it in your .env file.');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Template structure cache with TTL (Time To Live)
interface CachedTemplateStructure {
  structure: any;
  timestamp: number;
  sourceDocumentIds: string[];
}

const templateStructureCache = new Map<string, CachedTemplateStructure>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

// Assistant cache for reuse (prevents creating new assistant for every search)
interface CachedAssistant {
  assistantId: string;
  timestamp: number;
  vectorStoreIds: string[];
}

const assistantCache = new Map<string, CachedAssistant>();
const ASSISTANT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Query result cache for instant responses
interface CachedQueryResult {
  results: any[];
  timestamp: number;
  vectorStoreIds: string[];
}

const queryResultCache = new Map<string, CachedQueryResult>();
const QUERY_CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Generate cache key for query results
 */
function generateQueryCacheKey(query: string, vectorStoreIds: string[]): string {
  const normalizedQuery = query.toLowerCase().trim().substring(0, 200);
  const sortedIds = [...vectorStoreIds].sort().join(',');
  return crypto.createHash('md5').update(normalizedQuery + sortedIds).digest('hex');
}

/**
 * Get cached query results if available and not expired
 */
function getCachedQueryResults(query: string, vectorStoreIds: string[]): any[] | null {
  const cacheKey = generateQueryCacheKey(query, vectorStoreIds);
  const cached = queryResultCache.get(cacheKey);
  
  if (!cached) {
    return null;
  }
  
  const now = Date.now();
  if (now - cached.timestamp > QUERY_CACHE_TTL) {
    queryResultCache.delete(cacheKey);
    return null;
  }
  
  // Verify vector stores match
  const cachedIds = cached.vectorStoreIds.sort().join(',');
  const requestedIds = [...vectorStoreIds].sort().join(',');
  if (cachedIds !== requestedIds) {
    return null;
  }
  
  console.log(`⚡ Using cached query results (key: ${cacheKey}, age: ${Math.round((now - cached.timestamp) / 1000)}s)`);
  return cached.results;
}

/**
 * Store query results in cache
 */
function setCachedQueryResults(query: string, vectorStoreIds: string[], results: any[]): void {
  const cacheKey = generateQueryCacheKey(query, vectorStoreIds);
  queryResultCache.set(cacheKey, {
    results,
    timestamp: Date.now(),
    vectorStoreIds: [...vectorStoreIds],
  });
  console.log(`💾 Cached query results (key: ${cacheKey}, results: ${results.length})`);
}

/**
 * Generate cache key for assistant based on vector store IDs
 */
function generateAssistantCacheKey(vectorStoreIds: string[]): string {
  const sortedIds = [...vectorStoreIds].sort().join(',');
  return crypto.createHash('md5').update(sortedIds).digest('hex');
}

/**
 * Get cached assistant ID if available and not expired
 */
function getCachedAssistant(vectorStoreIds: string[]): string | null {
  const cacheKey = generateAssistantCacheKey(vectorStoreIds);
  const cached = assistantCache.get(cacheKey);
  
  if (!cached) {
    return null;
  }
  
  const now = Date.now();
  if (now - cached.timestamp > ASSISTANT_CACHE_TTL) {
    assistantCache.delete(cacheKey);
    return null;
  }
  
  // Verify vector stores match
  const cachedIds = cached.vectorStoreIds.sort().join(',');
  const requestedIds = [...vectorStoreIds].sort().join(',');
  if (cachedIds !== requestedIds) {
    return null;
  }
  
  console.log(`♻️  Reusing cached assistant (key: ${cacheKey}, age: ${Math.round((now - cached.timestamp) / 1000)}s)`);
  return cached.assistantId;
}

/**
 * Store assistant ID in cache
 */
function setCachedAssistant(vectorStoreIds: string[], assistantId: string): void {
  const cacheKey = generateAssistantCacheKey(vectorStoreIds);
  assistantCache.set(cacheKey, {
    assistantId,
    timestamp: Date.now(),
    vectorStoreIds: [...vectorStoreIds],
  });
  console.log(`💾 Cached assistant (key: ${cacheKey})`);
}

/**
 * Pre-warm assistant cache on server startup
 * This eliminates the 5-10s assistant creation overhead on first request
 */
export async function preWarmAssistantCache(): Promise<void> {
  try {
    const mainVectorStoreId = process.env.MAIN_VECTOR_STORE_ID || ' ';
    if (!mainVectorStoreId || mainVectorStoreId.trim() === '') {
      console.log('⚠️  No MAIN_VECTOR_STORE_ID configured, skipping assistant pre-warming');
      return;
    }

    const activeVectorStores = [mainVectorStoreId].filter(id => id && id.trim() !== '');
    if (activeVectorStores.length === 0) {
      return;
    }

    // Check if assistant already exists in cache
    const existingAssistant = getCachedAssistant(activeVectorStores);
    if (existingAssistant) {
      console.log(`✅ Assistant already cached, skipping pre-warming`);
      return;
    }

    console.log('🔥 Pre-warming assistant cache...');
    const startTime = Date.now();

    // Create assistant with optimized settings
    const assistant = await openai.beta.assistants.create({
      model: 'gpt-4o-mini', // Fastest model
      name: 'MSME Knowledge Base Search',
      instructions: `Search the knowledge base and return the most relevant information. Be concise. Cite sources.`,
      tools: [{ type: 'file_search' }],
      tool_resources: {
        file_search: {
          vector_store_ids: activeVectorStores,
        },
      },
      temperature: 0.1, // Lower temperature for faster responses
    });

    // Cache the assistant
    setCachedAssistant(activeVectorStores, assistant.id);
    
    const elapsed = Date.now() - startTime;
    console.log(`✅ Assistant pre-warmed in ${elapsed}ms (ID: ${assistant.id})`);
  } catch (error: any) {
    console.error('⚠️  Failed to pre-warm assistant cache:', error.message);
    // Don't fail server startup if pre-warming fails
  }
}

/**
 * Generate cache key from template document IDs
 */
function generateCacheKey(templateResults: any[]): string {
  const docIds = templateResults
    .map((r: any) => r.documentId || r.openaiFileId || '')
    .filter((id: string) => id)
    .sort()
    .join(',');
  
  if (!docIds) {
    return 'default_template';
  }
  
  return crypto.createHash('md5').update(docIds).digest('hex');
}

/**
 * Get cached template structure if available and not expired
 */
function getCachedTemplateStructure(cacheKey: string): any | null {
  const cached = templateStructureCache.get(cacheKey);
  if (!cached) {
    return null;
  }
  
  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    // Cache expired, remove it
    templateStructureCache.delete(cacheKey);
    console.log(`🗑️  Cache expired for key: ${cacheKey}`);
    return null;
  }
  
  console.log(`✅ Using cached template structure (key: ${cacheKey}, age: ${Math.round((now - cached.timestamp) / 1000)}s)`);
  return cached.structure;
}

/**
 * Store template structure in cache
 */
function setCachedTemplateStructure(cacheKey: string, structure: any, sourceDocumentIds: string[]): void {
  templateStructureCache.set(cacheKey, {
    structure,
    timestamp: Date.now(),
    sourceDocumentIds,
  });
  console.log(`💾 Cached template structure (key: ${cacheKey}, sections: ${structure.totalSections})`);
}

/**
 * Clear expired cache entries (can be called periodically)
 */
function clearExpiredCache(): void {
  const now = Date.now();
  let cleared = 0;
  for (const [key, cached] of templateStructureCache.entries()) {
    if (now - cached.timestamp > CACHE_TTL) {
      templateStructureCache.delete(key);
      cleared++;
    }
  }
  if (cleared > 0) {
    console.log(`🧹 Cleared ${cleared} expired cache entries`);
  }
}

/**
 * Get cache statistics
 */
function getCacheStats(): { size: number; entries: Array<{ key: string; age: number; sections: number }> } {
  const now = Date.now();
  const entries = Array.from(templateStructureCache.entries()).map(([key, cached]) => ({
    key,
    age: Math.round((now - cached.timestamp) / 1000),
    sections: cached.structure?.totalSections || 0,
  }));
  
  return {
    size: templateStructureCache.size,
    entries,
  };
}

export class OpenAIService {
  /**
   * Format step data array as a markdown table
   */
  private static formatStepDataAsTable(
    data: any[],
    columns: string[]
  ): string {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return '';
    }

    // Create header row
    const headerRow = '| ' + columns.map(col => OpenAIService.formatColumnName(col)).join(' | ') + ' |';
    const separatorRow = '| ' + columns.map(() => '---').join(' | ') + ' |';
    
    // Create data rows
    const dataRows = data.map(item => {
      const row = columns.map(col => {
        const value = item[col] || item[col.toLowerCase()] || '';
        // Format numbers with commas if they're numeric
        if (typeof value === 'number') {
          return value.toLocaleString('en-IN');
        }
        // Handle string numbers
        if (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value.trim())) {
          return parseFloat(value).toLocaleString('en-IN');
        }
        return String(value || '');
      });
      return '| ' + row.join(' | ') + ' |';
    });

    return [headerRow, separatorRow, ...dataRows].join('\n');
  }

  /**
   * Format column name for display (convert camelCase to Title Case)
   */
  private static formatColumnName(column: string): string {
    return column
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Analyze DPR template and extract structure/fields
   */
  static async analyzeDPRTemplate(templateContent: string): Promise<{
    sections: Array<{
      name: string;
      fields: Array<{
        name: string;
        type: 'text' | 'number' | 'date' | 'select' | 'textarea';
        required: boolean;
        options?: string[];
        description?: string;
      }>;
      order: number;
    }>;
    totalSections: number;
    estimatedTime: string;
  }> {
    try {
      const prompt = `Analyze this DPR template and extract its structure and required fields:

${templateContent}

Return a JSON object with:
1. sections: Array of sections with their fields
2. totalSections: Total number of sections
3. estimatedTime: Estimated time to complete (e.g., "15-20 minutes")

For each section, include:
- name: Section title
- fields: Array of fields with name, type, required status, and description
- order: Section order number

Field types should be: text, number, date, select, textarea
For select fields, include options array if applicable.

Return only valid JSON without markdown formatting.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content || '{}';
      
      // Clean the response to ensure valid JSON
      const cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const analysis = JSON.parse(cleanedContent);
      
      console.log(`📋 DPR Template Analysis: ${analysis.totalSections} sections found`);
      return analysis;
    } catch (error) {
      console.error('Error analyzing DPR template:', error);
      throw new Error('Failed to analyze DPR template');
    }
  }

  /**
   * Generate step-by-step questionnaire based on DPR template
   */
  static async generateDPRQuestionnaire(
    templateAnalysis: any,
    currentStep: number = 1,
    userResponses: Record<string, any> = {}
  ): Promise<{
    currentStep: number;
    totalSteps: number;
    currentSection: string;
    questions: Array<{
      id: string;
      question: string;
      type: 'text' | 'number' | 'date' | 'select' | 'textarea';
      required: boolean;
      options?: string[];
      placeholder?: string;
      helpText?: string;
    }>;
    progress: number;
    nextAction: string;
  }> {
    try {
      const currentSectionData = templateAnalysis.sections[currentStep - 1];
      if (!currentSectionData) {
        throw new Error('Invalid step number');
      }

      const questions = currentSectionData.fields.map((field: any) => ({
        id: field.name.toLowerCase().replace(/\s+/g, '_'),
        question: field.description || `Please provide ${field.name}`,
        type: field.type,
        required: field.required,
        options: field.options,
        placeholder: `Enter ${field.name.toLowerCase()}`,
        helpText: field.description,
      }));

      const progress = Math.round((currentStep / templateAnalysis.totalSections) * 100);

      let nextAction = 'Continue to next section';
      if (currentStep === templateAnalysis.totalSections) {
        nextAction = 'Generate DPR';
      }

      return {
        currentStep,
        totalSteps: templateAnalysis.totalSections,
        currentSection: currentSectionData.name,
        questions,
        progress,
        nextAction,
      };
    } catch (error) {
      console.error('Error generating DPR questionnaire:', error);
      throw new Error('Failed to generate DPR questionnaire');
    }
  }

  /**
   * Generate complete DPR from collected responses
   */
//   static async generateCompleteDPR(
//     templateAnalysis: any,
//     userResponses: Record<string, any>,
//     language: 'english' | 'telugu' = 'english'
//   ): Promise<{
//     dprContent: string;
//     sections: Array<{
//       title: string;
//       content: string;
//     }>;
//     metadata: {
//       generatedAt: string;
//       language: string;
//       totalSections: number;
//       wordCount: number;
//     };
//   }> {
//     try {
//       const languageInstruction = language === 'telugu' 
//         ? 'Generate the DPR in Telugu language.' 
//         : 'Generate the DPR in English language.';

//       const prompt = `Generate a complete, professional DPR based on the template structure and user responses:

// Template Structure: ${JSON.stringify(templateAnalysis.sections, null, 2)}

// User Responses: ${JSON.stringify(userResponses, null, 2)}

// ${languageInstruction}

// Create a well-structured DPR with:
// 1. Professional formatting
// 2. All required sections from the template
// 3. User-provided information integrated naturally
// 4. Additional relevant details to make it comprehensive
// 5. Proper headings and subheadings
// 6. Professional language suitable for banks/investors

// Return a JSON object with:
// - dprContent: Complete DPR as formatted text
// - sections: Array of sections with title and content
// - metadata: Generation details

// Return only valid JSON without markdown formatting.`;

//       const response = await openai.chat.completions.create({
//         model: 'gpt-4o',
//         messages: [{ role: 'user', content: prompt }],
//         temperature: 0.7,
//       });

//       const content = response.choices[0]?.message?.content || '{}';
      
//       // Clean the response to ensure valid JSON
//       const cleanedContent = content
//         .replace(/```json\n?/g, '')
//         .replace(/```\n?/g, '')
//         .trim();

//       const dprData = JSON.parse(cleanedContent);
      
//       // Add metadata
//       dprData.metadata = {
//         ...dprData.metadata,
//         generatedAt: new Date().toISOString(),
//         language,
//         totalSections: templateAnalysis.totalSections,
//         wordCount: dprData.dprContent.split(' ').length,
//       };

//       console.log(`📄 DPR Generated: ${dprData.sections.length} sections, ${dprData.metadata.wordCount} words`);
//       return dprData;
//     } catch (error) {
//       console.error('Error generating complete DPR:', error);
//       throw new Error('Failed to generate complete DPR');
//     }
//   }

  /**
   * Generate DPR content using GPT-4
   */
  static async generateDPRSection(
    section: string,
    projectData: IProject,
    language: 'english' | 'telugu' = 'english'
  ): Promise<string> {
    try {
      const languageInstruction =
        language === 'telugu'
          ? 'Generate the response in Telugu language.'
          : 'Generate the response in English language.';

      const prompts: Record<string, string> = {
        executiveSummary: `
          Create a comprehensive, BANK-INVESTOR READY Executive Summary for an MSME DPR.
          
          PROJECT DETAILS:
          - Project Name: ${projectData.projectName}
          - Industry Sector: ${projectData.industrySector}
          - Project Type: ${projectData.projectType}
          - Total Investment: ₹${projectData.totalCost?.toLocaleString() || '0'}
          - Loan Amount: ₹${projectData.loanAmount?.toLocaleString() || '0'}
          - Own Contribution: ₹${projectData.ownContribution?.toLocaleString() || '0'}
          - Location: ${projectData.location}
          
          ${(projectData as any).stepData ? `
          DETAILED PROJECT DATA FROM AI-GUIDED DPR BUILDER:
          ${JSON.stringify((projectData as any).stepData, null, 2)}
          
          Use this comprehensive data to create a detailed, accurate executive summary that reflects the actual project information provided.
          ` : ''}
          
          CRITICAL REQUIREMENTS FOR BANK/INVESTOR READINESS:
          1. Start with a compelling project overview that immediately establishes credibility
          2. Highlight key financial metrics: Total investment, loan requirement, own contribution percentage, expected ROI
          3. Emphasize project viability, market opportunity, and competitive advantages
          4. Include specific numbers, percentages, and concrete data from the project details
          5. Mention risk mitigation strategies and project strengths
          6. Reference applicable government schemes if available
          7. Conclude with a strong recommendation for approval
          
          ${(projectData as any).governmentSchemas ? `
          APPLICABLE GOVERNMENT SCHEMES:
          ${(projectData as any).governmentSchemas}
          Briefly mention relevant schemes that enhance project viability.
          ` : ''}
          
          ${(projectData as any).eligibleSchemes?.schemesData ? `
          SELECTED GOVERNMENT SCHEMES:
          ${JSON.stringify((projectData as any).eligibleSchemes.schemesData, null, 2)}
          Mention these selected schemes and their benefits to the project.
          ` : ''}
          
          ${languageInstruction}
          
          TONE: Professional, confident, persuasive, and investor-friendly. Use formal business language suitable for bank loan applications and investor presentations.
          LENGTH: 300-400 words, comprehensive yet concise.
          FORMAT: Well-structured paragraphs with clear sections. Use **bold** for key metrics and important points.
        `,
        businessProfile: `
          Create a detailed, BANK-INVESTOR READY Business Profile section.
          
          PROJECT INFORMATION:
          - Project: ${projectData.projectName}
          - Sector: ${projectData.industrySector}
          - Description: ${projectData.inputs.businessDescription || 'Not provided'}
          - Location: ${projectData.location}
          
          ${(projectData as any).stepData?.businessOverview ? `
          COMPREHENSIVE BUSINESS DATA:
          ${JSON.stringify((projectData as any).stepData.businessOverview, null, 2)}
          Use ALL this data to create a detailed business profile.
          ` : ''}
          
          ${(projectData as any).stepData?.applicantInfo ? `
          APPLICANT/ENTREPRENEUR INFORMATION:
          ${JSON.stringify((projectData as any).stepData.applicantInfo, null, 2)}
          Include relevant entrepreneur background, qualifications, and experience.
          ` : ''}
          
          CRITICAL REQUIREMENTS:
          1. **Business Concept**: Clear, compelling description of the business idea and its market positioning
          2. **Products/Services**: Detailed list with specifications, quality standards, and competitive advantages
          3. **Unique Selling Proposition (USP)**: What makes this business different and better than competitors
          4. **Entrepreneur Profile**: Background, qualifications, relevant experience, and why they are suited for this business
          5. **Business Structure**: Legal structure, ownership details, organizational setup
          6. **Market Positioning**: How the business fits into the market and competitive landscape
          7. **Value Proposition**: Clear articulation of value delivered to customers
          
          ${languageInstruction}
          
          TONE: Professional, detailed, and confidence-inspiring. Use specific details and concrete information.
          LENGTH: 400-500 words with comprehensive coverage.
          FORMAT: Well-organized with clear subheadings using ###. Use **bold** for key terms and important points.
        `,
        marketAnalysis: `
          Generate a comprehensive, BANK-INVESTOR READY Market Analysis section.
          
          PROJECT INFORMATION:
          - Project: ${projectData.projectName}
          - Sector: ${projectData.industrySector}
          - Location: ${projectData.location}
          
          ${(projectData as any).stepData?.marketAnalysis ? `
          DETAILED MARKET DATA FROM AI-GUIDED DPR BUILDER:
          ${JSON.stringify((projectData as any).stepData.marketAnalysis, null, 2)}
          Use ALL this data to create a comprehensive market analysis.
          ` : ''}
          
          ${(projectData as any).stepData?.salesDetails ? `
          SALES AND MARKETING DATA:
          ${JSON.stringify((projectData as any).stepData.salesDetails, null, 2)}
          Incorporate sales projections, pricing strategy, and marketing approach from this data.
          ` : ''}
          
          CRITICAL REQUIREMENTS FOR BANK/INVESTOR READINESS:
          1. **Market Size & Potential**: Quantify the total addressable market (TAM), serviceable addressable market (SAM), and serviceable obtainable market (SOM) with specific numbers
          2. **Target Customer Segments**: Detailed customer personas, demographics, purchasing behavior, and market share
          3. **Competitive Landscape**: Analysis of major competitors, their market share, strengths, weaknesses, and competitive positioning
          4. **Market Trends**: Current and future trends affecting the industry, growth drivers, and market dynamics
          5. **Demand-Supply Gap**: Specific analysis showing unmet demand and how this project addresses it
          6. **Marketing & Sales Strategy**: Detailed go-to-market strategy, distribution channels, pricing strategy, and sales projections
          7. **Market Entry Strategy**: How the business will capture market share and establish presence
          8. **Risk Assessment**: Market risks and mitigation strategies
          
          ${languageInstruction}
          Base analysis on Indian MSME context and specific regional market (${projectData.location || 'India'}).
          
          TONE: Analytical, data-driven, and professional. Use specific numbers, percentages, and market data.
          LENGTH: 500-600 words with comprehensive market insights.
          FORMAT: Use ### for subheadings. Use **bold** for key metrics, percentages, and important findings.
        `,
        technicalFeasibility: `
          Create a comprehensive, BANK-INVESTOR READY Technical Feasibility section.
          
          PROJECT INFORMATION:
          - Project: ${projectData.projectName}
          - Sector: ${projectData.industrySector}
          
          ${(projectData as any).stepData ? `
          COMPREHENSIVE TECHNICAL DATA FROM AI-GUIDED DPR BUILDER:
          - Building Details: ${JSON.stringify((projectData as any).stepData.buildingDetails || {}, null, 2)}
          - Machinery Details: ${JSON.stringify((projectData as any).stepData.machineryDetails || {}, null, 2)}
          - Raw Materials: ${JSON.stringify((projectData as any).stepData.rawMaterials || {}, null, 2)}
          - Wages: ${JSON.stringify((projectData as any).stepData.wages || {}, null, 2)}
          - Salary Details: ${JSON.stringify((projectData as any).stepData.salaryDetails || {}, null, 2)}
          - Power Estimate: ${JSON.stringify((projectData as any).stepData.powerEstimate || {}, null, 2)}
          - Working Capital: ${JSON.stringify((projectData as any).stepData.workingCapitalEstimate || {}, null, 2)}
          
          Use ALL this detailed data to create a comprehensive technical feasibility analysis.
          ` : `
          Basic Project Data:
          - Machinery: ${JSON.stringify(projectData.inputs.machinery || [])}
          - Raw Materials: ${JSON.stringify(projectData.inputs.rawMaterials || [])}
          - Manpower: ${JSON.stringify(projectData.inputs.manpower || [])}
          - Infrastructure: ${JSON.stringify(projectData.inputs.infrastructure || {})}
          `}
          
          CRITICAL REQUIREMENTS FOR BANK/INVESTOR READINESS:
          1. **Production Process/Service Delivery**: Detailed step-by-step process flow, technology used, and operational methodology
          2. **Technology & Equipment**: Complete list with specifications, capacity, suppliers, and technical specifications. Reference the machinery details provided.
          3. **Raw Material Availability**: Sources, suppliers, quality standards, procurement plan, and supply chain reliability. Use raw materials data provided.
          4. **Manpower Planning**: Organizational structure, staffing requirements, skill levels, recruitment plan, and training needs. Reference wages and salary data.
          5. **Infrastructure Needs**: Building requirements, utilities (power, water), connectivity, and facility specifications. Use building details provided.
          6. **Capacity Utilization**: Production capacity, utilization plan, scalability, and expansion potential
          7. **Quality Control**: Quality standards, testing procedures, certifications, and compliance measures
          8. **Technical Risks**: Identify technical challenges and mitigation strategies
          9. **Technology Readiness**: Assessment of technology maturity and implementation feasibility
          
          ${languageInstruction}
          
          TONE: Technical, detailed, and professional. Use specific technical terms, numbers, and specifications.
          LENGTH: 500-600 words with comprehensive technical coverage.
          FORMAT: Use ### for subheadings. Use **bold** for key technical specifications and important points.
        `,
        financialProjections: `
          Create a comprehensive, BANK-INVESTOR READY Financial Projections narrative.
          
          PROJECT FINANCIAL INFORMATION:
          - Project: ${projectData.projectName}
          - Total Cost: ₹${projectData.totalCost?.toLocaleString() || '0'}
          - Own Contribution: ₹${projectData.ownContribution?.toLocaleString() || '0'} (${projectData.ownContribution && projectData.totalCost ? ((projectData.ownContribution / projectData.totalCost) * 100).toFixed(1) : '0'}%)
          - Loan Amount: ₹${projectData.loanAmount?.toLocaleString() || '0'} (${projectData.loanAmount && projectData.totalCost ? ((projectData.loanAmount / projectData.totalCost) * 100).toFixed(1) : '0'}%)
          
          ${(projectData as any).stepData ? `
          COMPREHENSIVE FINANCIAL DATA FROM AI-GUIDED DPR BUILDER:
          - Cost Structure: ${JSON.stringify((projectData as any).stepData.costStructure || {}, null, 2)}
          - Financial Projections: ${JSON.stringify((projectData as any).stepData.financialProjections || {}, null, 2)}
          - Financial Parameters: ${JSON.stringify((projectData as any).stepData.financialParameters || {}, null, 2)}
          - Financing Details: ${JSON.stringify((projectData as any).stepData.financing || {}, null, 2)}
          - Sales Details: ${JSON.stringify((projectData as any).stepData.salesDetails || {}, null, 2)}
          - Other Capital Costs: ${JSON.stringify((projectData as any).stepData.otherCapitalCosts || {}, null, 2)}
          - Overhead Expenses: ${JSON.stringify((projectData as any).stepData.overheadExpenses || {}, null, 2)}
          
          Use ALL this detailed financial data to create accurate, comprehensive financial projections.
          ` : ''}
          
          CRITICAL REQUIREMENTS FOR BANK/INVESTOR READINESS:
          1. **Project Cost Breakdown**: Detailed breakdown of fixed capital (land, building, machinery), working capital, and other costs. Use cost structure data provided.
          2. **Means of Finance**: Clear financing structure showing own contribution, term loan, interest rates, repayment schedule, and debt-equity ratio
          3. **Revenue Assumptions**: Realistic revenue projections based on sales data, pricing strategy, market demand, and growth assumptions. Use sales details provided.
          4. **Profitability Analysis**: 
             - Gross profit margins
             - Net profit margins
             - Profit growth trajectory (Year 1, 2, 3)
             - Always emphasize positive, realistic profits
          5. **Break-Even Analysis**: Break-even point in months/years, break-even sales volume, and margin of safety
          6. **Debt Servicing Capacity (DSCR)**: 
             - Debt Service Coverage Ratio calculation
             - Minimum DSCR of 1.5+ for bank approval
             - Cash flow available for debt servicing
          7. **Return on Investment (ROI)**: 
             - Expected ROI percentage
             - Payback period
             - Internal Rate of Return (IRR)
          8. **Financial Ratios**: Current ratio, debt-equity ratio, profitability ratios, and liquidity ratios
          9. **Cash Flow Projections**: Operating cash flow, investing cash flow, financing cash flow
          10. **Sensitivity Analysis**: Impact of variations in key assumptions on profitability
          
          CRITICAL INSTRUCTIONS:
          - Present financials in a positive, confidence-inspiring manner while being realistic
          - Use specific numbers, percentages, and financial metrics from the provided data
          - Emphasize strong profitability, healthy margins, and sustainable growth
          - Highlight financial strengths and risk mitigation
          - Show how the project generates positive cash flows and profits from Year 1
          - Frame projections to demonstrate bankability and investment attractiveness
          
          ${languageInstruction}
          
          TONE: Professional, confident, and data-driven. Use financial terminology appropriately.
          LENGTH: 600-700 words with comprehensive financial analysis.
          FORMAT: Use ### for subheadings. Use **bold** for key financial metrics, percentages, and important numbers.
          Note: Financial tables will be generated separately, but include narrative explaining the numbers.
        `,
        eligibleSchemes: `
          Create a comprehensive Eligible Government Schemes section for the DPR:
          Project: ${projectData.projectName}
          Sector: ${projectData.industrySector}
          Project Type: ${projectData.projectType}
          Total Investment: ₹${projectData.totalCost}
          Loan Amount: ₹${projectData.loanAmount}
          Location: ${projectData.location}
          
          ${(projectData as any).eligibleSchemes?.schemesData && (projectData as any).eligibleSchemes.schemesData.length > 0 ? `
          CRITICAL: The following government schemes have been SELECTED by the user for this project. You MUST include ALL of these schemes with their complete details:
          
          ${(projectData as any).eligibleSchemes.schemesData.map((scheme: any, index: number) => `
          Scheme ${index + 1}:
          - Scheme Code: ${scheme.schemeCode}
          - Scheme Name: ${scheme.schemeName}
          - Description: ${scheme.description || 'Not provided'}
          - Eligibility Criteria: ${scheme.eligibility ? JSON.stringify(scheme.eligibility) : 'Standard MSME eligibility'}
          - Benefits: ${scheme.benefits ? JSON.stringify(scheme.benefits) : 'As per scheme guidelines'}
          - Required Documents: ${scheme.documentsRequired && scheme.documentsRequired.length > 0 ? scheme.documentsRequired.join(', ') : 'Standard DPR and project documents'}
          `).join('\n')}
          
          IMPORTANT INSTRUCTIONS:
          1. You MUST include ALL the above selected schemes in the Eligible Schemes section
          2. For each selected scheme, provide:
            * Full scheme name and code (exactly as provided above)
            * Detailed description
            * Specific eligibility criteria for this project (use the provided eligibility info)
            * Benefits and subsidy details (use the provided benefits info, include percentages and maximum amounts)
            * How THIS SPECIFIC PROJECT qualifies for the scheme (reference project details like sector, investment amount, location)
            * Application process and required documents (use the provided documents list)
            * Contact information or portal link if available
          3. Format each scheme as a clear section with heading
          4. Explain how multiple schemes can be combined if applicable
          5. Make the content specific to this project (${projectData.projectName} in ${projectData.industrySector} sector)
          
          ${(projectData as any).governmentSchemas ? `
          ADDITIONAL CONTEXT: The following additional government schemes were identified from knowledge base as potentially relevant:
          ${(projectData as any).governmentSchemas}
          
          You may mention these as additional options, but prioritize the SELECTED schemes listed above.
          ` : ''}
          
          Format: Use clear headings for each selected scheme, bullet points for key information, and ensure all details are accurate and specific to this project.
          ` : (projectData as any).governmentSchemas ? `
          IMPORTANT: The following government schemes and financial assistance programs have been identified from the government schemes category documents as relevant to this project:
          
          ${(projectData as any).governmentSchemas}
          
          Please create a detailed Eligible Schemes section that includes:
          - List of all applicable government schemes identified
          - For each scheme, provide:
            * Scheme name and code (if available)
            * Brief description
            * Eligibility criteria specific to this project
            * Benefits and subsidy details (percentage, maximum amount)
            * How this project qualifies for the scheme
            * Application process and required documents
            * Contact information or portal link (if available)
          - Prioritize schemes based on relevance and benefits
          - Explain how multiple schemes can be combined if applicable
          - Include both central and state government schemes
          
          Format: Use clear headings for each scheme, bullet points for key information, and ensure all details are accurate and specific to this project.
          ` : `
          Note: No specific government schemes were selected for this project. 
          However, you may mention general schemes like PMEGP, MUDRA, CGTMSE that are commonly applicable to MSME projects.
          `}
          
          ${languageInstruction}
          Tone: Professional, informative, and encouraging. Make it clear how these schemes will benefit the entrepreneur.
        `,
        conclusion: `
          Write a compelling Conclusion for the DPR:
          Project: ${projectData.projectName}
          Sector: ${projectData.industrySector}
          Investment: ₹${projectData.totalCost}
          
          Include:
          - Project viability summary
          - Key success factors
          - Expected socio-economic impact
          - Employment generation potential
          - Brief reference to eligible government schemes (detailed information is in the Eligible Schemes section)
          - Recommendation for approval
          
          ${languageInstruction}
          Tone: Confident, professional, and persuasive for bank approval.
        `,
        applicantInfo: `
          Create an Applicant Information section for the DPR:
          Project: ${projectData.projectName}
          
          ${(projectData as any).stepData?.applicantInfo ? `
          Applicant Data:
          ${JSON.stringify((projectData as any).stepData.applicantInfo, null, 2)}
          ` : 'Use standard applicant information format.'}
          
          Include:
          - Applicant name and personal details
          - Educational qualifications
          - Professional experience
          - Category (SC/ST/OBC/General, etc.)
          - Location type (Rural/Urban)
          - Contact information
          - Any relevant background information
          
          ${languageInstruction}
          Format: Professional and comprehensive.
        `,
        projectAtGlance: `
          Create a Project at a Glance section for the DPR:
          Project: ${projectData.projectName}
          Sector: ${projectData.industrySector}
          Total Investment: ₹${projectData.totalCost}
          Location: ${projectData.location}
          
          ${(projectData as any).stepData?.projectAtGlance ? `
          Project Data:
          ${JSON.stringify((projectData as any).stepData.projectAtGlance, null, 2)}
          ` : ''}
          
          Include:
          - Project overview summary
          - Key highlights
          - Investment summary
          - Expected outcomes
          - Quick reference information
          
          ${languageInstruction}
          Format: Concise, bullet points or short paragraphs.
        `,
        buildingDetails: `
          Create a Building Details section for the DPR:
          Project: ${projectData.projectName}
          
          ${(projectData as any).stepData?.buildingDetails ? `
          Building Data (present as a TABLE with columns: Particulars, Area, Rate, Amount):
          ${JSON.stringify((projectData as any).stepData.buildingDetails, null, 2)}
          
          IMPORTANT: If the building data contains an array of buildings with particulars, area, rate, and amount fields, format it as a MARKDOWN TABLE with the following structure:
          | Particulars | Area | Rate | Amount |
          |------------|------|------|--------|
          | [data from buildingDetails] | [data] | [data] | [data] |
          
          Include a summary with total amount at the end.
          ` : 'Include standard building details based on project requirements.'}
          
          Include:
          - Building particulars and specifications
          - Area details (in square feet/meters)
          - Rate per unit area
          - Total cost calculations
          - Building type and purpose
          - Location and site details
          
          ${languageInstruction}
          Format: Use MARKDOWN TABLE format if building data is provided, otherwise use detailed paragraphs.
        `,
        machineryDetails: `
          Create a Machinery Details section for the DPR:
          Project: ${projectData.projectName}
          Sector: ${projectData.industrySector}
          
          ${(projectData as any).stepData?.machineryDetails ? `
          Machinery Data (present as a TABLE with columns: Particulars, Quantity, Rate, Amount):
          ${JSON.stringify((projectData as any).stepData.machineryDetails, null, 2)}
          
          IMPORTANT: If the machinery data contains an array of machinery items with particulars, quantity, rate, and amount fields, format it as a MARKDOWN TABLE:
          | Particulars | Quantity | Rate | Amount |
          |------------|----------|------|--------|
          | [data from machineryDetails] | [data] | [data] | [data] |
          
          Include a summary with total amount at the end.
          ` : 'Include standard machinery details based on project requirements.'}
          
          Include:
          - List of machinery and equipment
          - Specifications and capacity
          - Quantity and unit prices
          - Total machinery cost
          - Supplier information (if available)
          - Installation and commissioning details
          
          ${languageInstruction}
          Format: Use MARKDOWN TABLE format if machinery data is provided, otherwise use detailed list with specifications.
        `,
        otherCapitalCosts: `
          Create an Other Capital Costs section for the DPR:
          Project: ${projectData.projectName}
          
          ${(projectData as any).stepData?.otherCapitalCosts ? `
          Other Capital Costs Data (present as a TABLE if structured data exists):
          ${JSON.stringify((projectData as any).stepData.otherCapitalCosts, null, 2)}
          
          IMPORTANT: If the other capital costs data contains structured information (like preliminaryCost, furnitureFixtures, contingency, workingCapital), format key items as a MARKDOWN TABLE:
          | Item | Amount |
          |------|--------|
          | Preliminary Costs | [amount] |
          | Furniture & Fixtures | [amount] |
          | Contingency | [amount] |
          | Working Capital | [amount] |
          
          Include a summary with total at the end.
          ` : 'Include standard other capital costs details based on project requirements.'}
          
          Include:
          - Preliminary and pre-operative expenses
          - Furniture and fixtures
          - Office equipment
          - Contingency provisions
          - Working capital margin
          - Any other capital expenses
          
          ${languageInstruction}
          Format: Use MARKDOWN TABLE format if structured data is provided, otherwise use itemized list with costs.
        `,
        rawMaterials: `
          Create a Raw Materials section for the DPR:
          Project: ${projectData.projectName}
          Sector: ${projectData.industrySector}
          
          ${(projectData as any).stepData?.rawMaterials ? `
          Raw Materials Data (present as a TABLE with columns: Material, Quantity, Unit, Rate, Amount):
          ${JSON.stringify((projectData as any).stepData.rawMaterials, null, 2)}
          
          IMPORTANT: If the raw materials data contains an array of materials with material name, quantity, unit, rate, and amount fields, format it as a MARKDOWN TABLE:
          | Material | Quantity | Unit | Rate | Amount |
          |----------|----------|------|------|--------|
          | [data from rawMaterials] | [data] | [data] | [data] | [data] |
          
          Include a summary with total amount at the end.
          ` : 'Include standard raw materials details based on project requirements.'}
          
          Include:
          - List of raw materials required
          - Quantity and units
          - Rate per unit
          - Total cost
          - Source of supply
          - Availability and procurement plan
          
          ${languageInstruction}
          Format: Use MARKDOWN TABLE format if raw materials data is provided, otherwise use detailed list format.
        `,
        wages: `
          Create a Wages section for the DPR:
          Project: ${projectData.projectName}
          
          ${(projectData as any).stepData?.wages ? `
          Wages Data (present as a TABLE with columns: Category, Number of Workers, Monthly Wage, Total):
          ${JSON.stringify((projectData as any).stepData.wages, null, 2)}
          
          IMPORTANT: If the wages data contains an array of wage entries with category, number of workers, monthly wage, and total fields, format it as a MARKDOWN TABLE:
          | Category | Number of Workers | Monthly Wage | Total |
          |----------|-------------------|--------------|-------|
          | [data from wages] | [data] | [data] | [data] |
          
          Include a summary with total wages at the end.
          ` : 'Include standard wages details based on project requirements.'}
          
          Include:
          - Wage structure for workers
          - Number of workers
          - Monthly/annual wage costs
          - Skill levels and categories
          - Total wage expenses
          
          ${languageInstruction}
          Format: Use MARKDOWN TABLE format if wages data is provided, otherwise use detailed breakdown by category.
        `,
        salaryDetails: `
          Create a Salary Details section for the DPR:
          Project: ${projectData.projectName}
          
          ${(projectData as any).stepData?.salaryDetails?.salaries && Array.isArray((projectData as any).stepData.salaryDetails.salaries) ? `
          Salary Data - MUST be formatted as a MARKDOWN TABLE:
          
          ${OpenAIService.formatStepDataAsTable(
            (projectData as any).stepData.salaryDetails.salaries,
            ['particulars', 'noOfStaff', 'wagesPerMonth', 'amount']
          )}
          
          CRITICAL REQUIREMENTS:
          1. You MUST include the above table EXACTLY as shown in your response
          2. The table should be the PRIMARY format for displaying salary details
          3. Add a summary row showing the total salary expenses
          4. Include brief narrative before/after the table explaining the organizational structure
          5. Use proper markdown table syntax with | separators
          
          Total Monthly Salaries: ₹${(projectData as any).stepData.salaryDetails.salaries.reduce((sum: number, s: any) => sum + parseFloat(s.amount || '0'), 0).toLocaleString()}
          ` : (projectData as any).stepData?.salaryDetails ? `
          Salary Data:
          ${JSON.stringify((projectData as any).stepData.salaryDetails, null, 2)}
          
          Format this data as a MARKDOWN TABLE if it contains salary entries with designation, number, monthly salary, and total fields.
          ` : 'Include standard salary details based on project requirements.'}
          
          Include:
          - Staff positions and designations
          - Number of employees
          - Monthly/annual salary
          - Total salary expenses
          - Organizational structure
          
          ${languageInstruction}
          Format: ALWAYS use MARKDOWN TABLE format when salary data is provided. The table is the PRIMARY format for this section.
        `,
        workingCapitalEstimate: `
          Create a Working Capital Estimate section for the DPR:
          Project: ${projectData.projectName}
          
          ${(projectData as any).stepData?.workingCapitalEstimate ? `
          Working Capital Data:
          ${JSON.stringify((projectData as any).stepData.workingCapitalEstimate, null, 2)}
          ` : ''}
          
          Include:
          - Working capital requirements
          - Components (raw materials, finished goods, receivables, etc.)
          - Calculation methodology
          - Total working capital needed
          - Sources of working capital
          
          ${languageInstruction}
          Format: Detailed with calculations.
        `,
        powerEstimate: `
          Create a Power Estimate section for the DPR:
          Project: ${projectData.projectName}
          
          ${(projectData as any).stepData?.powerEstimate ? `
          Power Data:
          ${JSON.stringify((projectData as any).stepData.powerEstimate, null, 2)}
          ` : ''}
          
          Include:
          - Power requirement (in kW/HP)
          - Connected load
          - Monthly power consumption
          - Power cost estimates
          - Backup power arrangements (if any)
          
          ${languageInstruction}
          Format: Detailed with calculations.
        `,
        overheadExpenses: `
          Create an Overhead Expenses section for the DPR:
          Project: ${projectData.projectName}
          
          ${(projectData as any).stepData?.overheadExpenses ? `
          Overhead Expenses Data:
          ${JSON.stringify((projectData as any).stepData.overheadExpenses, null, 2)}
          ` : ''}
          
          Include:
          - List of overhead expenses
          - Monthly/annual costs
          - Categories (utilities, insurance, maintenance, etc.)
          - Total overhead expenses
          
          ${languageInstruction}
          Format: Itemized list with costs.
        `,
        financing: `
          Create a Financing section for the DPR:
          Project: ${projectData.projectName}
          Total Cost: ₹${projectData.totalCost}
          Loan Amount: ₹${projectData.loanAmount}
          
          ${(projectData as any).stepData?.financing ? `
          Financing Data:
          ${JSON.stringify((projectData as any).stepData.financing, null, 2)}
          ` : ''}
          
          Include:
          - Means of finance breakdown
          - Own contribution details
          - Term loan details
          - Interest rates and repayment terms
          - Security and collateral
          - Financial institutions involved
          
          ${languageInstruction}
          Format: Detailed financing structure.
        `,
        salesDetails: `
          Create a Sales Details section for the DPR:
          Project: ${projectData.projectName}
          Sector: ${projectData.industrySector}
          
          ${(projectData as any).stepData?.salesDetails?.sales && Array.isArray((projectData as any).stepData.salesDetails.sales) ? `
          Sales Data - MUST be formatted as a MARKDOWN TABLE:
          
          ${OpenAIService.formatStepDataAsTable(
            (projectData as any).stepData.salesDetails.sales,
            ['particulars', 'rate', 'quantity', 'amount']
          )}
          
          CRITICAL REQUIREMENTS:
          1. You MUST include the above table EXACTLY as shown in your response
          2. The table should be the PRIMARY format for displaying sales details
          3. Add a summary row showing the total sales/revenue
          4. Include brief narrative before/after the table explaining sales projections and strategy
          5. Use proper markdown table syntax with | separators
          
          Total Sales/Revenue: ₹${(projectData as any).stepData.salesDetails.sales.reduce((sum: number, s: any) => sum + parseFloat(s.amount || '0'), 0).toLocaleString()}
          ` : (projectData as any).stepData?.salesDetails ? `
          Sales Data:
          ${JSON.stringify((projectData as any).stepData.salesDetails, null, 2)}
          
          Format this data as a MARKDOWN TABLE if it contains sales entries with particulars, rate, quantity, and amount fields.
          ` : ''}
          
          Include:
          - Sales projections
          - Product/service pricing
          - Sales channels and strategy
          - Target customers
          - Sales volume estimates
          - Revenue projections
          
          ${languageInstruction}
          Format: ALWAYS use MARKDOWN TABLE format when sales data is provided. The table is the PRIMARY format for this section.
        `,
        financialParameters: `
          Create a Financial Parameters section for the DPR:
          Project: ${projectData.projectName}
          
          ${(projectData as any).stepData?.financialParameters ? `
          Financial Parameters Data:
          ${JSON.stringify((projectData as any).stepData.financialParameters, null, 2)}
          ` : ''}
          
          Include:
          - Key financial ratios
          - Break-even analysis
          - Debt service coverage ratio (DSCR)
          - Internal rate of return (IRR)
          - Payback period
          - Profitability margins
          
          ${languageInstruction}
          Format: Detailed financial analysis.
        `,
        beneficiaryInfo: `
          Create a Beneficiary Information section for the DPR:
          Project: ${projectData.projectName}
          
          ${(projectData as any).stepData?.beneficiaryInfo ? `
          Beneficiary Data:
          ${JSON.stringify((projectData as any).stepData.beneficiaryInfo, null, 2)}
          ` : ''}
          
          Include:
          - Beneficiary details
          - Background information
          - Eligibility for schemes
          - Category and classification
          - Any relevant personal or business information
          
          ${languageInstruction}
          Format: Professional and comprehensive.
        `,
      };

      const prompt = prompts[section] || prompts.executiveSummary;

      // OPTIMIZATION: Use faster model and reduced tokens for quicker response
      // gpt-4o-mini is 3-4x faster than gpt-4o with similar quality for structured content
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Faster model - 3-4x speed improvement
        messages: [
          {
            role: 'system',
            content:
              `You are an expert MSME consultant and financial analyst specializing in creating BANK-INVESTOR READY Detailed Project Reports (DPRs) for Indian entrepreneurs.

CRITICAL REQUIREMENTS:
1. **Bank/Investor Readiness**: All content must be suitable for bank loan applications and investor presentations
2. **Data-Driven**: Use ALL provided stepData and project information comprehensively - do not ignore any data
3. **Professional Tone**: Formal, confident, persuasive business language
4. **Specific Details**: Include actual numbers, percentages, amounts, and concrete data from the provided information
5. **Comprehensive Coverage**: Cover all aspects thoroughly - be detailed, not generic
6. **Risk-Aware**: Acknowledge risks but emphasize strengths and mitigation strategies
7. **Formatting**: Use markdown formatting (### for headings, **bold** for key metrics)
8. **Accuracy**: Ensure all numbers, calculations, and facts are accurate based on provided data

When stepData is provided, you MUST use it extensively to create detailed, accurate content. Do not create generic content when specific data is available.

Generate professional, comprehensive, and lender-ready content that inspires confidence in banks and investors.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000, // Increased to allow for more comprehensive bank-ready content
      });

      let content = response.choices[0].message.content || '';
      
      // Note: We keep markdown markers (### and **) in content for processing
      // They will be processed when rendering in PDF/DOCX and frontend
      // This allows us to properly format headings and bold text
      
      return content;
    } catch (error) {
      console.error(`Error generating DPR section ${section}:`, error);
      throw new Error(`Failed to generate ${section}`);
    }
  }

  /**
   * Search for related government schemas from AI knowledge base
   * Specifically searches documents with category "government-schemes" or templateType "scheme"
   */
  static async searchGovernmentSchemas(
    projectData: IProject,
    vectorStoreIds?: string[]
  ): Promise<string> {
    try {
      console.log('🔍 Searching for related government schemes from government schemes category documents...');
      
      // First, find all documents with category "government-schemes" or templateType "scheme"
      const { Document } = await import('../models/Document.model');
      
      const governmentSchemeDocuments = await Document.find({
        status: 'ready',
        $or: [
          { 'metadata.category': 'government-schemes' },
          { 'metadata.templateType': 'scheme' }
        ],
        vectorStoreId: { $exists: true, $ne: null, $ne: '' }
      }).select('vectorStoreId originalName metadata').lean();

      if (!governmentSchemeDocuments || governmentSchemeDocuments.length === 0) {
        console.log('⚠️  No government schemes category documents found in database');
        // Fallback to provided vector stores or main vector store
        let activeVectorStores: string[] = [];
        if (vectorStoreIds && vectorStoreIds.length > 0) {
          activeVectorStores = vectorStoreIds.filter(id => id && id.trim() !== '');
        } else {
          const mainVectorStoreId = process.env.MAIN_VECTOR_STORE_ID || '';
          if (mainVectorStoreId && mainVectorStoreId.trim() !== '') {
            activeVectorStores = [mainVectorStoreId];
          }
        }

        if (activeVectorStores.length === 0) {
          console.log('⚠️  No vector stores available for government schema search');
          return '';
        }
      } else {
        console.log(`📚 Found ${governmentSchemeDocuments.length} government schemes category document(s)`);
      }

      // Get unique vector store IDs from government schemes documents
      const schemeVectorStoreIds = new Set<string>();
      governmentSchemeDocuments.forEach((doc: any) => {
        if (doc.vectorStoreId && doc.vectorStoreId.trim() !== '') {
          schemeVectorStoreIds.add(doc.vectorStoreId);
        }
      });

      // Use scheme-specific vector stores if available, otherwise fallback to provided/main vector stores
      let activeVectorStores: string[] = [];
      if (schemeVectorStoreIds.size > 0) {
        activeVectorStores = Array.from(schemeVectorStoreIds);
        console.log(`🎯 Using ${activeVectorStores.length} government schemes vector store(s) for search`);
      } else {
        // Fallback to provided vector stores or main vector store
        if (vectorStoreIds && vectorStoreIds.length > 0) {
          activeVectorStores = vectorStoreIds.filter(id => id && id.trim() !== '');
        } else {
          const mainVectorStoreId = process.env.MAIN_VECTOR_STORE_ID || '';
          if (mainVectorStoreId && mainVectorStoreId.trim() !== '') {
            activeVectorStores = [mainVectorStoreId];
          }
        }
        console.log(`⚠️  No scheme-specific vector stores found, using fallback vector stores`);
      }

      if (activeVectorStores.length === 0) {
        console.log('⚠️  No vector stores available for government schema search');
        return '';
      }

      // Build search query based on project details
      const searchQuery = `Government schemes, subsidies, and financial assistance programs for ${projectData.industrySector} sector MSME projects in ${projectData.location}. 
      Project cost: ₹${projectData.totalCost}, Loan amount: ₹${projectData.loanAmount}. 
      Find relevant central government schemes, state government schemes, subsidies, credit guarantee schemes, and financial assistance programs applicable to this project.
      Include scheme name, eligibility criteria, benefits, subsidy percentage, maximum amount, application process, and required documents.`;

      // Search the knowledge base using government schemes documents
      const schemaResults = await this.searchDocumentsWithRAG(
        searchQuery,
        activeVectorStores,
        10 // Get top 10 relevant results to find more schemes
      );

      if (!schemaResults || schemaResults.length === 0) {
        console.log('⚠️  No government schemas found in knowledge base');
        return '';
      }

      // Extract and format schema information
      let schemaInfo = 'Relevant Government Schemes and Financial Assistance Programs:\n\n';
      
      schemaResults.forEach((result, index) => {
        const content = result.content || result.text || '';
        const source = result.documentName || result.source || 'Knowledge Base';
        
        // Extract key information from the result
        if (content.trim()) {
          schemaInfo += `${index + 1}. ${source}\n`;
          // Increase content length limit to get more scheme details
          const truncatedContent = content.length > 1000 
            ? content.substring(0, 1000) + '...' 
            : content;
          schemaInfo += `${truncatedContent}\n\n`;
        }
      });

      console.log(`✅ Found ${schemaResults.length} relevant government scheme(s) from government schemes category documents`);
      return schemaInfo;
    } catch (error) {
      console.error('Error searching for government schemas:', error);
      // Don't fail DPR generation if schema search fails
      return '';
    }
  }

  /**
   * Generate complete DPR content
   * OPTIMIZED: Parallel generation for 3-4x faster response
   */
  static async generateCompleteDPR(
    projectData: IProject,
    language: 'english' | 'telugu' | 'bilingual' = 'bilingual',
    vectorStoreIds?: string[]
  ): Promise<any> {
    // Always include ALL 22 sections for comprehensive DPR
    const sections = [
      'executiveSummary',
      'businessProfile',
      'applicantInfo',
      'projectAtGlance',
      'buildingDetails',
      'machineryDetails',
      'otherCapitalCosts',
      'rawMaterials',
      'wages',
      'salaryDetails',
      'workingCapitalEstimate',
      'powerEstimate',
      'overheadExpenses',
      'financing',
      'salesDetails',
      'marketAnalysis',
      'technicalFeasibility',
      'financialProjections',
      'financialParameters',
      'beneficiaryInfo',
      'eligibleSchemes',
      'conclusion',
    ];

    const content: any = {
      english: {},
      telugu: {},
    };

    // Search for related government schemas from AI knowledge base
    console.log('🔍 Searching for related government schemas...');
    const governmentSchemas = await this.searchGovernmentSchemas(projectData, vectorStoreIds);
    
    // Add government schemas and stepData to project data for use in section generation
    // Preserve eligibleSchemes if they exist (user-selected schemes)
    const enrichedProjectData: IProject & { governmentSchemas?: string; eligibleSchemes?: any; stepData?: any } = {
      ...projectData,
      governmentSchemas: governmentSchemas,
      eligibleSchemes: (projectData as any).eligibleSchemes || undefined,
      stepData: (projectData as any).stepData || undefined,
    } as IProject & { governmentSchemas?: string; eligibleSchemes?: any; stepData?: any };

    // OPTIMIZATION: Generate all sections in parallel instead of sequentially
    // This reduces generation time from ~60-90s to ~15-20s
    const promises: Promise<any>[] = [];

    // Generate English content in parallel
    if (language === 'english' || language === 'bilingual') {
      sections.forEach(section => {
        promises.push(
          this.generateDPRSection(section, enrichedProjectData, 'english')
            .then(result => ({ lang: 'english', section, content: result }))
            .catch(error => {
              console.error(`Error generating ${section} (English):`, error);
              return { lang: 'english', section, content: '' };
            })
        );
      });
    }

    // Generate Telugu content in parallel
    if (language === 'telugu' || language === 'bilingual') {
      sections.forEach(section => {
        promises.push(
          this.generateDPRSection(section, enrichedProjectData, 'telugu')
            .then(result => ({ lang: 'telugu', section, content: result }))
            .catch(error => {
              console.error(`Error generating ${section} (Telugu):`, error);
              return { lang: 'telugu', section, content: '' };
            })
        );
      });
    }

    // Wait for all sections to complete in parallel
    console.log(`🚀 Generating ${promises.length} DPR sections in parallel...`);
    const results = await Promise.all(promises);

    // Organize results - handle errors gracefully
    results.forEach(result => {
      if (result && result.lang && result.section && result.content) {
        content[result.lang][result.section] = result.content;
      } else {
        console.warn('Invalid result structure:', result);
      }
    });

    console.log(`✅ DPR generation completed - ${results.length} sections generated`);
    return content;
  }

  /**
   * Transcribe audio using OpenAI Whisper API or Hugging Face Whisper Telugu model
   * - For Telugu ('te'): Uses fine-tuned Hugging Face model (vasista22/whisper-telugu-base)
   * - For English ('en') or undefined: Uses OpenAI Whisper API
   * 
   * @param audioFile - Audio file buffer
   * @param language - 'en' for English, 'te' for Telugu
   * @param audioFormat - Audio format (webm, mp3, wav, etc.) - default: 'webm'
   * @returns Transcribed text
   */
  static async transcribeAudio(
    audioFile: Buffer, 
    language?: 'en' | 'te',
    audioFormat: string = 'webm'
  ): Promise<string> {
    try {
      // Use Hugging Face Whisper Telugu model for Telugu language
      if (language === 'te') {
        console.log('🔊 Transcribing Telugu audio using Hugging Face Whisper Telugu model (vasista22/whisper-telugu-base)');
        try {
          const transcription = await WhisperTeluguService.transcribe(audioFile, audioFormat);
          return transcription;
        } catch (error: any) {
          console.error('❌ Hugging Face Whisper Telugu transcription failed:', error);
          console.log('🔄 Falling back to OpenAI Whisper API for Telugu...');
          // Fallback to OpenAI Whisper if Hugging Face model fails
        }
      }
      
      // Use OpenAI Whisper API for English or as fallback
      const languageParam = language === 'en' ? 'en' : undefined;
      console.log(`🔊 Transcribing ${language || 'audio'} using OpenAI Whisper API`);

      // OpenAI SDK for Node.js accepts File objects or streams
      // Create a File object from buffer (works in both browser and Node.js with proper polyfill)
      let file: any;
      const mimeType = `audio/${audioFormat}`;
      
      try {
        // Try using File API first (if available)
        file = new File([audioFile], `audio.${audioFormat}`, { type: mimeType });
      } catch (fileError) {
        // If File API is not available (Node.js environment), use Readable stream
        const { Readable } = require('stream');
        file = Readable.from([audioFile]);
      }
      
      // Call OpenAI Whisper API using the configured API key
      // For Telugu, explicitly set language='te' to ensure correct transcription
      const transcriptionParams: any = {
        file: file,
        model: 'whisper-1', // Using Whisper-1 model
      };
      
      // Only set language parameter if specified (for both English and Telugu)
      if (languageParam) {
        transcriptionParams.language = languageParam;
      }
      
      // For Telugu, add explicit prompt to ensure Telugu script output (not Hindi/Devanagari)
      if (language === 'te') {
        transcriptionParams.prompt = 'This audio is in Telugu language (తెలుగు). Transcribe it in Telugu script only. Do not use Devanagari script. Use Telugu script characters like: అ ఆ ఇ ఈ ఉ ఊ ఋ ౠ ఎ ఏ ఐ ఒ ఓ ఔ క ఖ గ ఘ ఙ చ ఛ జ ఝ ఞ ట ఠ డ ఢ ణ త థ ద ధ న ప ఫ బ భ మ య ర ల వ శ ష స హ ళ ఱ.';
      }
      
      const response = await openai.audio.transcriptions.create(transcriptionParams);

      const transcribedText = response.text;
      
      if (language === 'te') {
        console.log(`✅ Telugu transcription completed: ${transcribedText.substring(0, 50)}...`);
      }
      
      return transcribedText;
    } catch (error: any) {
      console.error('❌ Error transcribing audio with Whisper API:', error);
      
      // Log more details for debugging
      if (error.message) {
        console.error('Error message:', error.message);
      }
      
      // If 'te' language code is not supported, try with prompt only (auto-detect with guidance)
      if (language === 'te' && (error.message?.includes("Language 'te' is not supported") || error.code === 'unsupported_language')) {
        console.log('⚠️  Language code "te" not supported, trying with prompt-based Telugu detection...');
        try {
          let file: any;
          const mimeType = `audio/${audioFormat}`;
          try {
            file = new File([audioFile], `audio.${audioFormat}`, { type: mimeType });
          } catch {
            const { Readable } = require('stream');
            file = Readable.from([audioFile]);
          }
          
          // Use explicit prompt to ensure Telugu script (not Hindi/Devanagari)
          const response = await openai.audio.transcriptions.create({
            file: file,
            model: 'whisper-1',
            prompt: 'This audio is in Telugu language (తెలుగు). Transcribe it in Telugu script only. Do not use Devanagari script. Use Telugu script characters like: అ ఆ ఇ ఈ ఉ ఊ ఋ ౠ ఎ ఏ ఐ ఒ ఓ ఔ క ఖ గ ఘ ఙ చ ఛ జ ఝ ఞ ట ఠ డ ఢ ణ త థ ద ధ న ప ఫ బ భ మ య ర ల వ శ ష స హ ళ ఱ. The language is Telugu, not Hindi, Bengali, or any other language.',
          });
          
          console.log(`✅ Telugu transcription completed (prompt-based): ${response.text.substring(0, 50)}...`);
          return response.text;
        } catch (promptError: any) {
          console.error('❌ Prompt-based transcription also failed:', promptError);
          throw new Error(`Failed to transcribe Telugu audio: ${promptError.message || 'Unknown error'}`);
        }
      }
      
      // If File API error, try alternative approach with stream
      if (error.message?.includes('File is not defined') || error.name === 'ReferenceError') {
        try {
          console.log('🔄 Trying alternative transcription method with Readable stream...');
          const { Readable } = require('stream');
          const stream = Readable.from([audioFile]);
          
          const transcriptionParams: any = {
            file: stream as any,
            model: 'whisper-1',
          };
          
          if (languageParam) {
            transcriptionParams.language = languageParam;
          }
          
          if (language === 'te') {
            transcriptionParams.prompt = 'This is Telugu language audio. Transcribe in Telugu script.';
          }
          
          const response = await openai.audio.transcriptions.create(transcriptionParams);
          
          return response.text;
        } catch (fallbackError: any) {
          console.error('❌ Fallback transcription error:', fallbackError);
          throw new Error(`Failed to transcribe audio using Whisper API: ${fallbackError.message || 'Unknown error'}`);
        }
      }
      
      throw new Error(`Failed to transcribe audio using Whisper API: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Generate speech from text using OpenAI TTS API
   * Supports both English and Telugu
   */
  static async textToSpeech(
    text: string,
    language: 'en' | 'te' = 'en',
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy'
  ): Promise<Buffer> {
    try {
      // Clean text for better speech output
      const cleanText = text
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/`([^`]+)`/g, '$1') // Remove inline code
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove markdown links
        .replace(/^#{1,6}\s+/gm, '') // Remove headers
        .replace(/\*\*([^\*]+)\*\*/g, '$1') // Remove bold
        .replace(/\*([^\*]+)\*/g, '$1') // Remove italic
        .trim();

      if (!cleanText) {
        throw new Error('No text to convert to speech');
      }

      console.log(`🔊 Using OpenAI TTS for ${language === 'te' ? 'Telugu' : 'English'}`);
      
      // OpenAI TTS supports multiple languages including Telugu
      // The API will automatically detect and handle the language from the text
      const response = await openai.audio.speech.create({
        model: 'tts-1', // or 'tts-1-hd' for higher quality
        voice: voice,
        input: cleanText,
      });

      // Convert response to buffer
      const buffer = Buffer.from(await response.arrayBuffer());
      console.log(`✅ Speech generated successfully (${Math.round(buffer.length / 1024)}KB)`);
      return buffer;
    } catch (error: any) {
      console.error('Error generating speech:', error);
      throw new Error(`Failed to generate speech: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Get available DPR templates for chat integration
   */
  static async getAvailableDPRTemplates(): Promise<any[]> {
    try {
      const { DPRTemplate } = await import('../models/DPRTemplate.model');
      const templates = await DPRTemplate.find({ isActive: true })
        .select('name description category structure')
        .sort({ usageCount: -1 })
        .limit(5);
      
      return templates;
    } catch (error) {
      console.error('Error fetching DPR templates:', error);
      return [];
    }
  }

  /**
   * Check if user is in DPR creation mode based on conversation
   */
  static isDPRCreationMode(conversationHistory: Array<{ role: string; content: string }>): boolean {
    const recentMessages = conversationHistory.slice(-6); // Check last 6 messages
    const dprKeywords = [
      'create dpr', 'dpr creation', 'detailed project report', 'start dpr',
      'project report', 'business plan', 'loan application', 'bank proposal',
      'how do i start', 'how do i create', 'begin dpr', 'start project report'
    ];
    
    return recentMessages.some(msg => 
      msg.role === 'assistant' && 
      (msg.content.includes('DPR creation') || 
       msg.content.includes('project report') ||
       msg.content.includes('Let me help you create') ||
       msg.content.includes('I\'ll guide you through'))
    ) || recentMessages.some(msg =>
      msg.role === 'user' &&
      dprKeywords.some(keyword => 
        msg.content.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  }

  /**
   * Generate DPR creation questions based on templates
   */
  static async generateDPRChatQuestions(
    templates: any[],
    conversationHistory: Array<{ role: string; content: string }>,
    userResponses: Record<string, any> = {}
  ): Promise<{
    isDPRMode: boolean;
    currentStep?: number;
    totalSteps?: number;
    questions?: Array<{
      id: string;
      question: string;
      type: 'text' | 'number' | 'date' | 'select' | 'textarea';
      required: boolean;
      options?: string[];
      helpText?: string;
    }>;
    progress?: number;
    nextAction?: string;
  }> {
    try {
      if (templates.length === 0) {
        return { isDPRMode: false };
      }

      // Use the most popular template or first available
      const template = templates[0];
      const isDPRMode = this.isDPRCreationMode(conversationHistory);

      if (!isDPRMode) {
        return { isDPRMode: false };
      }

      // Determine current step based on conversation
      const stepKeywords = [
        'project name', 'business name', 'company name',
        'industry', 'sector', 'business type',
        'investment', 'cost', 'budget', 'funding',
        'location', 'address', 'premises',
        'products', 'services', 'offerings',
        'market', 'customers', 'target audience',
        'financial', 'revenue', 'profit',
        'team', 'staff', 'employees',
        'timeline', 'schedule', 'duration'
      ];

      let currentStep = 1;
      const totalSteps = template.structure.totalSections;

      // Analyze conversation to determine current step
      for (let i = 0; i < stepKeywords.length; i++) {
        const keyword = stepKeywords[i];
        const hasKeyword = conversationHistory.some(msg => 
          msg.content.toLowerCase().includes(keyword.toLowerCase())
        );
        if (hasKeyword) {
          currentStep = Math.min(Math.floor(i / 3) + 1, totalSteps);
        }
      }

      const currentSectionData = template.structure.sections[currentStep - 1];
      if (!currentSectionData) {
        return { isDPRMode: true, currentStep: 1, totalSteps, questions: [] };
      }

      const questions = currentSectionData.fields.map((field: any) => ({
        id: field.name.toLowerCase().replace(/\s+/g, '_'),
        question: field.description || `Please provide ${field.name}`,
        type: field.type,
        required: field.required,
        options: field.options,
        helpText: field.description,
      }));

      const progress = Math.round((currentStep / totalSteps) * 100);
      const nextAction = currentStep === totalSteps ? 'Generate DPR' : 'Continue to next section';

      return {
        isDPRMode: true,
        currentStep,
        totalSteps,
        questions,
        progress,
        nextAction,
      };
    } catch (error) {
      console.error('Error generating DPR chat questions:', error);
      return { isDPRMode: false };
    }
  }

  /**
   * Generate AI chat response with enhanced DPR guidance and RAG
   */
  static async chatResponse(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }> = [],
    userContext?: any,
    useRAG: boolean = false,
    vectorStoreIds?: string[],
    userId?: string,
    language?: 'en' | 'te'
  ): Promise<{ response: string; suggestions?: any; nextSteps?: string[]; dprAction?: string; dprQuestions?: any }> {
    try {
      // Get available DPR templates
      const templates = await this.getAvailableDPRTemplates();
      
      // Check if user wants to create a DPR or is in DPR mode - expanded keyword detection
      const dprKeywords = [
        'create dpr', 
        'how do i create', 
        'how do i start creating',
        'how to create',
        'how to start',
        'start creating',
        'dpr creation', 
        'detailed project report', 
        'start dpr',
        'how do i start', 
        'begin dpr', 
        'start project report', 
        'business plan', 
        'loan application',
        'make dpr',
        'generate dpr',
        'prepare dpr',
        'write dpr'
      ];
      const userMessageLower = userMessage.toLowerCase();
      const wantsToCreateDPR = dprKeywords.some(keyword => 
        userMessageLower.includes(keyword.toLowerCase())
      ) || userMessageLower.match(/\b(create|start|begin|make|generate|prepare|write)\s+(a\s+)?(dpr|detailed\s+project\s+report)/i);

      // Generate DPR questions if in DPR mode or user wants to create DPR
      const dprQuestions = await this.generateDPRChatQuestions(templates, conversationHistory);
      
      // Force DPR mode if user wants to create DPR and we have templates
      if (wantsToCreateDPR && templates.length > 0 && !dprQuestions.isDPRMode) {
        dprQuestions.isDPRMode = true;
        dprQuestions.currentStep = 1;
        dprQuestions.totalSteps = templates[0].structure.totalSections;
        dprQuestions.progress = 0;
        dprQuestions.questions = templates[0].structure.sections[0]?.fields?.map((field: any) => ({
          id: field.name.toLowerCase().replace(/\s+/g, '_'),
          question: field.description || `Please provide ${field.name}`,
          type: field.type,
          required: field.required,
          options: field.options,
          helpText: field.description,
        })) || [];
        dprQuestions.nextAction = 'Continue to next section';
      }

      // Use RAG if enabled and vector stores are available
      if (useRAG && vectorStoreIds && vectorStoreIds.length > 0) {
        return this.chatResponseWithRAG(userMessage, conversationHistory, userContext, vectorStoreIds, dprQuestions, userId, language);
      }

      // Detect if user message is in Telugu (contains Telugu script characters)
      const containsTeluguScript = /[\u0C00-\u0C7F]/.test(userMessage);
      const shouldRespondInTelugu = language === 'te' || containsTeluguScript;

      // Standard chat response
      const systemPrompt = `You are a friendly and helpful AI Assistant specializing in helping Indian MSME entrepreneurs create Detailed Project Reports (DPR).

IMPORTANT COMMUNICATION RULES:
1. **Be Clear and Simple**: Use simple, easy-to-understand language. Avoid jargon unless necessary, and always explain technical terms.
2. **Be Conversational**: Talk like a helpful friend, not a formal document. Use "you" and "I" naturally.
3. **Be Specific**: Give concrete examples and specific numbers when possible. Don't be vague.
4. **Be Actionable**: Always tell users exactly what to do next. Provide step-by-step guidance.
5. **Be Encouraging**: Support users and acknowledge their progress. Be positive and helpful.

Your capabilities include:
1. Step-by-step DPR guidance through all sections using uploaded templates
2. Financial data auto-suggestions based on industry benchmarks
3. Government scheme recommendations (AP MSME ONE Portal compatible)
4. Sector-specific insights and cost structures
5. Bank approval optimization strategies
6. Telugu and English language support
7. Interactive DPR creation workflow using template structure

Guidance Framework:
- Always provide actionable next steps in simple language
- Suggest specific financial figures based on industry data
- Recommend relevant government schemes with clear explanations
- Ensure bank-ready quality standards
- Provide both English and Telugu responses when requested
- ALWAYS use uploaded DPR templates to guide users through DPR creation
- NEVER say "This information is not available in uploaded documents" when helping with DPR creation
- Break down complex concepts into simple, digestible parts
- Use examples and analogies to make things clearer

${shouldRespondInTelugu ? `
CRITICAL LANGUAGE REQUIREMENT:
- The user is communicating in Telugu (తెలుగు) or has selected Telugu as their preferred language
- You MUST respond ENTIRELY in Telugu language using Telugu script
- Use natural, fluent Telugu that sounds native and professional
- For business/financial terms, use commonly accepted Telugu translations
- Preserve all numbers, dates, percentages, and currency symbols exactly as they are
- Respond in a conversational, friendly manner in Telugu
- Do NOT mix English and Telugu - respond completely in Telugu
` : ''}

${wantsToCreateDPR ? `
IMPORTANT: The user wants to create a DPR. You should:
1. Acknowledge their request enthusiastically
2. Explain that you'll guide them through the DPR creation process using the available templates
3. Start asking the first question from the DPR template immediately
4. Guide them through each step naturally in conversation
5. Set dprAction to "start_creation" in your response
6. DO NOT say "This information is not available in uploaded documents" - use the templates!

Available DPR Template: ${templates.length > 0 ? templates[0].name : 'None available'}
Template Sections: ${templates.length > 0 ? templates[0].structure.totalSections : 0}
` : ''}

${dprQuestions.isDPRMode ? `
CURRENT DPR CREATION MODE:
- Step ${dprQuestions.currentStep} of ${dprQuestions.totalSteps}
- Progress: ${dprQuestions.progress}%
- Questions to ask: ${JSON.stringify(dprQuestions.questions, null, 2)}
- Next Action: ${dprQuestions.nextAction}

Ask the questions naturally in conversation and collect responses step by step.
Use the template structure to guide the user through each section.
` : ''}

Current Context: ${userContext ? JSON.stringify(userContext) : 'New user'}

Be professional, supportive, and focus on creating high-quality, bankable DPRs.`;

      // OPTIMIZATION: Check if this is a suggestions request (from DPR Builder) - optimize for speed
      const isSuggestionsRequest = (userContext?.currentStep && !useRAG && conversationHistory.length === 0) || userContext?.isSuggestionRequest;
      const stepId = userContext?.currentStep || '';
      
      // Define timeout durations based on step complexity
      // Complex steps (market analysis, financial projections, etc.) need more time
      const getStepTimeout = (step: string): number => {
        const complexSteps = [
          'market-analysis',
          'financial-projections',
          'technical-feasibility',
          'business-profile',
          'project-at-glance',
        ];
        const mediumSteps = [
          'cost-structure',
          'financial-parameters',
          'sales-details',
          'raw-materials',
          'working-capital-estimate',
        ];
        
        if (complexSteps.includes(step)) {
          return 15000; // 15 seconds for complex steps
        } else if (mediumSteps.includes(step)) {
          return 10000; // 10 seconds for medium complexity steps
        } else {
          return 8000; // 8 seconds for simple steps (default for suggestions)
        }
      };
      
      const suggestionsTimeout = stepId ? getStepTimeout(stepId) : 8000; // Default 8s if stepId not provided
      
      // OPTIMIZATION: For suggestions, use minimal system prompt and skip extra processing
      const messages: any[] = isSuggestionsRequest
        ? [
            {
              role: 'system',
              content: 'You are a helpful assistant. Generate concise, accurate responses. Return ONLY the requested JSON format, no explanations, no markdown code blocks, just pure JSON. Be extremely brief.',
            },
            {
              role: 'user',
              content: userMessage,
            },
          ]
        : [
            {
              role: 'system',
              content: systemPrompt,
            },
            ...conversationHistory,
            {
              role: 'user',
              content: userMessage,
            },
          ];

      // OPTIMIZATION: Adjust max_tokens based on step complexity
      const getStepMaxTokens = (step: string): number => {
        const complexSteps = ['market-analysis', 'financial-projections', 'technical-feasibility'];
        if (complexSteps.includes(step)) {
          return 800; // More tokens for complex steps
        } else if (step === 'cost-structure' || step === 'sales-details' || step === 'raw-materials') {
          return 600; // Medium tokens for structured data
        } else {
          return 400; // Default for simple steps
        }
      };
      
      const suggestionsMaxTokens = stepId ? getStepMaxTokens(stepId) : 400;

      // OPTIMIZATION: Use faster model and reduced tokens for suggestions with timeout
      const startTime = Date.now();
      let response;
      
      try {
        response = await Promise.race([
          openai.chat.completions.create({
            model: 'gpt-4o-mini', // Fastest model
            messages,
            temperature: isSuggestionsRequest ? 0.2 : 0.7, // Lower temperature for faster, more consistent suggestions
            max_tokens: isSuggestionsRequest ? suggestionsMaxTokens : 1000, // Dynamic tokens based on step complexity
            stream: false, // Ensure no streaming for faster response
          }),
          // Dynamic timeout based on step complexity: 8-15s for suggestions, 60s for regular chat
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), isSuggestionsRequest ? suggestionsTimeout : 60000)
          ) as Promise<any>
        ]);
      } catch (error: any) {
        if (error.message === 'Request timeout') {
          const timeoutSeconds = isSuggestionsRequest ? (suggestionsTimeout / 1000) : 60;
          console.error(`⏱️ Request timed out after ${timeoutSeconds} seconds${stepId ? ` (step: ${stepId})` : ''}`);
          throw new Error(`Request took too long (${timeoutSeconds}s timeout). The AI service may be experiencing high load. Please try again in a moment.`);
        }
        throw error;
      }

      const elapsedTime = Date.now() - startTime;
      if (isSuggestionsRequest) {
        console.log(`⚡ Suggestions generated in ${elapsedTime}ms`);
      }

      let responseText = response.choices[0].message.content || '';

      // Skip translation and extra processing for suggestions requests
      if (isSuggestionsRequest) {
        // For suggestions, return immediately without extra processing
        return {
          response: responseText,
          suggestions: {},
          nextSteps: []
        };
      }

      // Regular chat processing
      // If user requested Telugu but response is in English, translate it
      if (shouldRespondInTelugu && !/[\u0C00-\u0C7F]/.test(responseText)) {
        console.log('🔄 Translating response to Telugu...');
        try {
          const { TranslationService } = await import('./translation.service');
          responseText = await TranslationService.translateText(responseText, 'te');
          console.log('✅ Response translated to Telugu');
        } catch (error) {
          console.error('⚠️ Failed to translate response to Telugu, using original:', error);
        }
      }

      // Extract suggestions and next steps using AI (with timeout to prevent blocking)
      let suggestions = {};
      let nextSteps: string[] = [];

      try {
        // Add timeout for suggestions extraction (5 seconds max)
        const suggestionsPromise = this.extractSuggestions(userMessage, responseText, userContext);
        const suggestionsTimeout = new Promise((resolve) => 
          setTimeout(() => resolve({}), 5000)
        );
        suggestions = await Promise.race([suggestionsPromise, suggestionsTimeout]) as any;
        if (!suggestions || Object.keys(suggestions).length === 0) {
          suggestions = {};
        }
      } catch (error) {
        console.error('Failed to extract suggestions, continuing without them:', error);
        suggestions = {};
      }

      try {
        // Add timeout for next steps generation (5 seconds max)
        const nextStepsPromise = this.generateNextSteps(userMessage, responseText, userContext);
        const nextStepsTimeout = new Promise((resolve) => 
          setTimeout(() => resolve([]), 5000)
        );
        nextSteps = await Promise.race([nextStepsPromise, nextStepsTimeout]) as string[];
        if (!nextSteps || !Array.isArray(nextSteps)) {
          nextSteps = [];
        }
      } catch (error) {
        console.error('Failed to generate next steps, continuing without them:', error);
        nextSteps = [];
      }

      return {
        response: responseText,
        suggestions,
        nextSteps,
        dprAction: wantsToCreateDPR ? 'start_creation' : undefined,
        dprQuestions: dprQuestions.isDPRMode ? dprQuestions : undefined
      };
    } catch (error: any) {
      console.error('Error in chat response:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        isTimeout: error.message?.includes('timeout') || error.message?.includes('too long'),
      });
      
      // Preserve original error message if it's informative
      if (error.message && (error.message.includes('timeout') || error.message.includes('too long'))) {
        throw error; // Re-throw timeout errors as-is
      }
      
      // For other errors, provide more context
      const errorMessage = error.message || 'Unknown error occurred';
      throw new Error(`Failed to generate chat response: ${errorMessage}`);
    }
  }

  /**
   * Generate AI chat response using RAG (Retrieval-Augmented Generation)
   */
  static async chatResponseWithRAG(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }> = [],
    userContext?: any,
    vectorStoreIds?: string[],
    dprQuestions?: any,
    userId?: string,
    language?: 'en' | 'te'
  ): Promise<{ response: string; suggestions?: any; nextSteps?: string[]; dprAction?: string; dprQuestions?: any; templateStructure?: any }> {
    const startTime = Date.now();
    try {
      if (!vectorStoreIds || vectorStoreIds.length === 0) {
        throw new Error('No vector stores available for RAG');
      }

      // Detect if user message is in Telugu (contains Telugu script characters)
      const containsTeluguScript = /[\u0C00-\u0C7F]/.test(userMessage);
      const shouldRespondInTelugu = language === 'te' || containsTeluguScript;

      // OPTIMIZATION: Detect if user is answering a question vs asking a new question
      // This helps skip unnecessary RAG searches when user is just providing answers
      const isAnsweringQuestion = this.detectIfAnsweringQuestion(userMessage, conversationHistory);
      
      if (isAnsweringQuestion) {
        console.log('✅ User is answering a question - using fast response mode');
      }

      // Get available DPR templates
      const templates = await this.getAvailableDPRTemplates();

      // Check if user wants to create a DPR - expanded keyword detection
      const dprKeywords = [
        'create dpr', 
        'how do i create', 
        'how do i start creating',
        'how to create',
        'how to start',
        'start creating',
        'dpr creation', 
        'detailed project report', 
        'start dpr',
        'begin dpr',
        'make dpr',
        'generate dpr',
        'prepare dpr',
        'write dpr'
      ];
      const userMessageLower = userMessage.toLowerCase();
      const keywordMatch = dprKeywords.some(keyword => 
        userMessageLower.includes(keyword.toLowerCase())
      );
      const regexMatch = userMessageLower.match(/\b(create|start|begin|make|generate|prepare|write)\s+(a\s+)?(dpr|detailed\s+project\s+report)/i);
      const wantsToCreateDPR = keywordMatch || !!regexMatch;
      
      if (wantsToCreateDPR) {
        console.log(`🎯 DPR Creation Request Detected: "${userMessage}"`);
        console.log(`   Keyword Match: ${keywordMatch}, Regex Match: ${!!regexMatch}`);
      }

      let templateStructure: any = null;
      let templateContext = '';

      // OPTIMIZATION: Run template search and document search in PARALLEL
      // This saves 40-50 seconds by not waiting for one to complete before starting the other
      // OPTIMIZATION: For first requests, skip template search to reduce response time
      const isFirstRequest = !getCachedAssistant(vectorStoreIds || []);
      const skipTemplateSearch = isFirstRequest && !wantsToCreateDPR;
      
      console.log('🔍 Starting parallel RAG searches...');
      if (skipTemplateSearch) {
        console.log('⚡ Fast mode: Skipping template search for faster first response');
      }
      
      // Prepare template search promise (only if DPR creation is detected AND not first request)
      const templateSearchPromise = (wantsToCreateDPR && !skipTemplateSearch) ? (async () => {
        console.log('🔍 Searching for DPR template documents using RAG...');
        console.log(`   Vector Stores: ${vectorStoreIds?.length || 0}`);
        
        if (vectorStoreIds && vectorStoreIds.length > 0) {
          return this.searchTemplateDocumentsWithRAG(
            'DPR template structure, sections, fields, and format requirements',
            vectorStoreIds,
            'dpr',
            5,
            userId
          );
        } else {
          // Even without vector stores, try to find template documents directly from database
          console.log('   No vector stores provided, searching database for template documents...');
          const { Document } = await import('../models/Document.model');
          const templateDocs = await Document.find({
            'metadata.isTemplate': true,
            'metadata.templateType': 'dpr',
            status: 'ready',
          }).limit(5);
          
          if (templateDocs.length > 0) {
            // Convert to template results format (async file reading)
            const results = await Promise.all(
              templateDocs.map(async (doc: any) => {
                try {
                  if (doc.filePath && fs.existsSync(doc.filePath)) {
                    const content = await readFileAsync(doc.filePath, 'utf8');
                    return {
                      documentId: doc._id.toString(),
                      documentName: doc.originalName,
                      content: content.substring(0, 50000),
                      filePath: doc.filePath,
                      openaiFileId: doc.openaiFileId,
                      isTemplate: true,
                      templateType: 'dpr',
                    };
                  }
                  return null;
                } catch (error) {
                  console.error(`Error reading template file ${doc.filePath}:`, error);
                  return null;
                }
              })
            );
            return results.filter((t: any) => t !== null);
          }
          return [];
        }
      })() : Promise.resolve([]);

      // OPTIMIZATION: Skip RAG search if user is just answering a question
      // This significantly reduces response time when user is providing answers
      let documentSearchPromise: Promise<any[]>;
      
      if (isAnsweringQuestion) {
        console.log('⚡ Fast mode: Skipping RAG search - user is answering a question');
        // Skip RAG search entirely - just use empty results
        documentSearchPromise = Promise.resolve([]);
      } else {
        // OPTIMIZATION: Build context-aware query from conversation history
        // This ensures RAG searches consider the full conversation context, not just the current message
        // OPTIMIZATION: Use timeout to prevent blocking if query enhancement is slow
        console.log('🔍 Building context-aware query from conversation history...');
        const queryEnhancementPromise = this.buildContextAwareQuery(
          userMessage,
          conversationHistory,
          userContext
        );
        
        // Add timeout for query enhancement (2s max) - if it takes too long, use original message
        const queryTimeoutPromise = new Promise<string>((resolve) => 
          setTimeout(() => resolve(userMessage), 2000)
        );
        
        const contextAwareQuery = await Promise.race([
          queryEnhancementPromise,
          queryTimeoutPromise
        ]);
        
        if (contextAwareQuery !== userMessage) {
          console.log(`📝 Enhanced query: "${contextAwareQuery.substring(0, 100)}..."`);
        } else {
          console.log(`📝 Using original query (enhancement timeout or no history)`);
        }

        // Start document search in parallel with template search using context-aware query
        documentSearchPromise = this.searchDocumentsWithRAG(
          contextAwareQuery, // Use enhanced query instead of just userMessage
          vectorStoreIds,
          3,
          userId
        );
      }

      // Wait for searches to complete in parallel
      // OPTIMIZATION: On first request, only wait for document search if skipping template search
      console.time('⏱️  Parallel RAG Searches');
      let templateResults: any[] = [];
      let searchResults: any[] = [];
      
      if (skipTemplateSearch) {
        // Fast mode: Only do document search
        searchResults = await documentSearchPromise;
      } else {
        // Normal mode: Do both searches in parallel
        [templateResults, searchResults] = await Promise.all([
          templateSearchPromise,
          documentSearchPromise
        ]);
      }
      console.timeEnd('⏱️  Parallel RAG Searches');

      // Process template results if DPR creation was detected
      // OPTIMIZATION: Make template extraction non-blocking with aggressive timeout for first requests
      if (wantsToCreateDPR && templateResults && templateResults.length > 0 && !skipTemplateSearch) {
        console.log(`✅ Found ${templateResults.length} template documents via RAG`);
        
        // Generate cache key from template document IDs
        const cacheKey = generateCacheKey(templateResults);
        
        // Check cache first
        const cachedStructure = getCachedTemplateStructure(cacheKey);
        if (cachedStructure) {
          templateStructure = cachedStructure;
          console.log(`⚡ Using cached template structure - no extraction needed!`);
        } else {
          // OPTIMIZATION: Use shorter timeout for first requests (5s instead of 8s)
          const extractionTimeout = isFirstRequest ? 5000 : 8000;
          console.log(`🔄 Extracting template structure from RAG (with ${extractionTimeout}ms timeout)...`);
          
          // Extract template structure from RAG results with timeout
          // Don't block the main response if this takes too long
          try {
            // Use Promise.race to timeout template extraction
            const extractionPromise = this.extractTemplateStructureFromRAG(templateResults, 'dpr');
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Template extraction timeout')), extractionTimeout)
            );
            
            templateStructure = await Promise.race([extractionPromise, timeoutPromise]) as any;
            
            // Store in cache for future use
            const sourceDocumentIds = templateResults
              .map((r: any) => r.documentId || r.openaiFileId || '')
              .filter((id: string) => id);
            setCachedTemplateStructure(cacheKey, templateStructure, sourceDocumentIds);
            console.log(`✅ Template structure extracted and cached`);
          } catch (error: any) {
            console.warn(`⚠️  Template extraction ${error.message || 'failed'}, continuing without template structure`);
            // Continue without template structure - don't block the response
            templateStructure = null;
          }
        }
        
        // Build template context if structure was extracted or cached
        if (templateStructure) {
          templateContext = '📋 DPR Template Structure (Extracted from uploaded templates):\n\n';
          templateContext += `Template Sections: ${templateStructure.totalSections}\n`;
          templateContext += `Estimated Time: ${templateStructure.estimatedTime}\n`;
          templateContext += `Source Documents: ${templateStructure.sourceDocuments.join(', ')}\n\n`;
          templateContext += `Sections:\n${templateStructure.sections.map((s: any, i: number) => 
            `${i + 1}. ${s.name} (${s.fields.length} fields)`
          ).join('\n')}\n\n`;
          
          // Add detailed section information
          templateStructure.sections.forEach((section: any) => {
            templateContext += `\n${section.name}:\n`;
            section.fields.forEach((field: any) => {
              templateContext += `  - ${field.name} (${field.type}${field.required ? ', required' : ', optional'})`;
              if (field.description) {
                templateContext += `: ${field.description}`;
              }
              templateContext += '\n';
            });
          });
          
          templateContext += '\n---\nUse this template structure to guide the user through DPR creation.\n\n';
        }
      } else if (wantsToCreateDPR) {
        console.log('⚠️  No template documents found via RAG. Will use database templates if available.');
      }
      
      // Build context from search results with document references
      let context = '';
      if (searchResults && searchResults.length > 0) {
        context = '📚 Knowledge Base Context (Unified Vector Store):\n\n';
        searchResults.forEach((result: any, index: number) => {
          if (result.content) {
            // Extract document reference if available
            const docRef = result.citations?.[0]?.file_id || `[Source ${index + 1}]`;
            context += `${docRef}:\n${result.content}\n\n`;
            // Add citations if available
            if (result.citations && result.citations.length > 0) {
              context += `Citations: ${result.citations.map((c: any) => c.file_id).join(', ')}\n\n`;
            }
          }
        });
        context += '---\nUse this knowledge base information to provide accurate, document-based guidance.\n\n';
      }

      // Prepend template context if available
      if (templateContext) {
        context = templateContext + context;
      }

      // Build conversation context summary for the system prompt
      const conversationContext = conversationHistory.length > 0
        ? `\n\nConversation History (for context):
${conversationHistory.slice(-4).map((msg, idx) => {
          const role = msg.role === 'user' ? 'User' : 'You (Assistant)';
          return `${role}: ${msg.content}`;
        }).join('\n')}`
        : '';

      // OPTIMIZATION: Detect if user wants full data or PDF
      const { wantsFullData, wantsPDF } = this.detectDataRequest(userMessage);
      
      // OPTIMIZATION: Extract ALL user data when user asks for full data
      const allUserData = wantsFullData 
        ? this.extractAllUserData(conversationHistory)
        : '';
      
      // OPTIMIZATION: Extract user answers context when user is answering questions
      // This helps AI generate more relevant responses based on what user has provided
      const userAnswersContext = isAnsweringQuestion 
        ? this.extractUserAnswersContext(conversationHistory)
        : '';
      
      const userAnswersSection = userAnswersContext
        ? `\n\nUser's Recent Answers (use these to generate relevant next questions):
${userAnswersContext}

IMPORTANT: Based on the user's answers above, generate the next appropriate question or acknowledge their answer and move forward. Be specific and reference what they provided.`
        : '';

      // OPTIMIZATION: Add full data section when user requests it
      const fullDataSection = wantsFullData && allUserData
        ? `\n\n🚨 CRITICAL: User is asking for ALL data they provided. Below is COMPLETE data from entire conversation:

${allUserData}

IMPORTANT: 
- You MUST include ALL the data above in your response
- Do NOT summarize or truncate - include EVERYTHING
- Organize it clearly but include ALL details
- If user provided 3 paragraphs, include all 3 paragraphs
- If user provided multiple pieces of information, include ALL of them
- Be comprehensive and complete`
        : '';

      // OPTIMIZATION: Add PDF generation instruction when user requests PDF
      const pdfSection = wantsPDF
        ? `\n\n🚨🚨🚨 CRITICAL: User is asking for PDF generation. 

ABSOLUTELY FORBIDDEN - DO NOT DO THESE:
- ❌ DO NOT tell them to copy-paste
- ❌ DO NOT tell them to use Microsoft Word or Google Docs
- ❌ DO NOT provide step-by-step instructions for manual conversion
- ❌ DO NOT say "I'm unable to create a PDF directly"
- ❌ DO NOT suggest any manual process

MANDATORY RESPONSE:
- ✅ You MUST acknowledge that you WILL generate a downloadable PDF file
- ✅ Say: "I'll generate a downloadable PDF file with all your data right away!"
- ✅ Tell them: "The PDF is being generated and will be ready for download shortly"
- ✅ Be confident and direct - the system WILL generate the PDF automatically
- ✅ Do NOT provide any instructions - just confirm PDF generation

The system has already prepared all the data and will generate the PDF file automatically.`
        : '';

      const systemPrompt = `You are a friendly and helpful AI Assistant specializing in helping Indian MSME entrepreneurs create Detailed Project Reports (DPR).

IMPORTANT COMMUNICATION RULES:
1. **Be Clear and Simple**: Use simple, easy-to-understand language. Avoid jargon unless necessary, and always explain technical terms.
2. **Be Conversational**: Talk like a helpful friend, not a formal document. Use "you" and "I" naturally.
3. **Be Specific**: Give concrete examples and specific numbers when possible. Don't be vague.
4. **Be Actionable**: Always tell users exactly what to do next. Provide step-by-step guidance.
5. **Be Encouraging**: Support users and acknowledge their progress. Be positive and helpful.
6. **Break Down Complex Ideas**: If something is complicated, break it into smaller, easier parts.
7. **Use Examples**: When explaining concepts, use real-world examples that users can relate to.

IMPORTANT: Base your responses SOLELY on the provided document context and uploaded knowledge base. Do not use external knowledge or make up information.

${context ? context : 'No relevant documents found in the knowledge base.'}${conversationContext}${userAnswersSection}${fullDataSection}${pdfSection}

${wantsToCreateDPR ? `
🚀 CRITICAL: The user wants to create a DPR. DO NOT give generic steps. Instead:

1. IMMEDIATELY acknowledge: "I'll help you create a DPR! I've analyzed the template documents and will guide you step-by-step."

2. ${templateStructure ? `
   I have EXTRACTED a template structure from uploaded documents with ${templateStructure.totalSections} sections:
   ${templateStructure.sections.map((s: any, i: number) => `${i + 1}. ${s.name}`).join('\n   ')}
   
   Start IMMEDIATELY with Section 1: "${templateStructure.sections[0]?.name || 'Introduction'}"
   Ask the FIRST question from this section right now in your response.
   ` : templates.length > 0 ? `
   I have ${templates.length} template(s) available. Start with the first section and ask questions immediately.
   ` : `
   I'll guide you through creating a DPR. Let's start with basic project information.
   `}

3. DO NOT list all steps - START ASKING QUESTIONS NOW
4. Ask ONE question at a time, naturally in conversation
5. Use the exact template structure to guide questions
6. Be conversational and helpful, not instructional

${templateStructure ? `
TEMPLATE DETAILS TO USE:
- Source: ${templateStructure.sourceDocuments.join(', ')}
- Estimated Time: ${templateStructure.estimatedTime}
- First Section Fields: ${JSON.stringify(templateStructure.sections[0]?.fields?.slice(0, 3).map((f: any) => f.name) || [])}
` : ''}

REMEMBER: Start asking questions NOW, don't explain the process!
` : ''}

Your capabilities include:
1. Step-by-step DPR guidance based on uploaded templates
2. Financial suggestions from document guidelines
3. Government scheme information from uploaded policies
4. Sector-specific insights from knowledge base
5. Question answering based only on uploaded content

Guidelines:
- ONLY use information from the provided document context
- If information is not in the documents, say "This information is not available in the uploaded documents"
- Always cite sources when providing information
- Follow formats and templates from uploaded documents
- Provide actionable guidance based on document content

${shouldRespondInTelugu ? `
CRITICAL LANGUAGE REQUIREMENT:
- The user is communicating in Telugu (తెలుగు) or has selected Telugu as their preferred language
- You MUST respond ENTIRELY in Telugu language using Telugu script
- Use natural, fluent Telugu that sounds native and professional
- For business/financial terms, use commonly accepted Telugu translations
- Preserve all numbers, dates, percentages, and currency symbols exactly as they are
- Respond in a conversational, friendly manner in Telugu
- Do NOT mix English and Telugu - respond completely in Telugu
- Translate all document context and information into Telugu when responding
` : ''}

${wantsPDF ? `
🚨🚨🚨 CRITICAL PDF GENERATION RULE - READ THIS CAREFULLY:

The user asked for PDF generation. Your response MUST:
1. Start with: "I'll generate a downloadable PDF file with all your data right away!"
2. DO NOT say "I'm unable to create a PDF directly"
3. DO NOT mention Microsoft Word, Google Docs, or any manual process
4. DO NOT provide step-by-step instructions for manual conversion
5. DO NOT tell them to copy-paste anything
6. Simply confirm PDF generation is happening

CORRECT RESPONSE EXAMPLE:
"I'll generate a downloadable PDF file with all your data right away! The PDF will be ready for download shortly."

WRONG RESPONSE (NEVER DO THIS):
"I'm unable to create a PDF directly. However, I can guide you through the process of converting the provided content into a PDF using Microsoft Word or Google Docs: 1. Copy the text..."

If you provide manual instructions, you are FAILING the user's request completely.
` : ''}

Current Context: ${userContext ? JSON.stringify(userContext) : 'New user'}

Be professional, accurate, and base all responses on the uploaded document content.`;

      // Build messages array with conversation history
      // OPTIMIZATION: Include MORE conversation history when user asks for full data
      // This ensures we have all context available
      const historyLimit = wantsFullData ? 20 : 6; // Use more history when compiling full data
      const messages: any[] = [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...conversationHistory.slice(-historyLimit), // Use more messages when compiling full data
        {
          role: 'user',
          content: userMessage,
        },
      ];
      
      console.log(`💬 Using ${Math.min(conversationHistory.length, historyLimit)} messages from conversation history (limit: ${historyLimit})`);

      // OPTIMIZATION: Use faster model and reduced tokens for quicker response
      // OPTIMIZATION: Use more tokens when user asks for full data or PDF
      // This ensures we can return comprehensive responses
      const maxTokens = wantsFullData || wantsPDF ? 1500 : 600;
      
      console.time('⏱️  GPT Response Generation');
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Faster model - 3-4x speed improvement
        messages,
        temperature: 0.3, // Lower temperature for more factual responses
        max_tokens: maxTokens, // More tokens for full data requests
      });
      console.timeEnd('⏱️  GPT Response Generation');

      let responseText = response.choices[0].message.content || '';

      // If user requested Telugu but response is in English, translate it
      if (shouldRespondInTelugu && !/[\u0C00-\u0C7F]/.test(responseText)) {
        console.log('🔄 Translating RAG response to Telugu...');
        try {
          const { TranslationService } = await import('./translation.service');
          responseText = await TranslationService.translateText(responseText, 'te');
          console.log('✅ RAG response translated to Telugu');
        } catch (error) {
          console.error('⚠️ Failed to translate RAG response to Telugu, using original:', error);
        }
      }

      // OPTIMIZATION: Post-process response to ensure PDF requests are handled correctly
      // If user asked for PDF but AI gave manual instructions, replace with correct response
      if (wantsPDF) {
        const hasManualInstructions = /copy.*paste|microsoft word|google docs|manually|step.*step|instructions/i.test(responseText);
        const hasUnableMessage = /unable.*pdf|cannot.*pdf|can't.*pdf/i.test(responseText);
        
        if (hasManualInstructions || hasUnableMessage) {
          console.warn('⚠️  AI gave manual instructions for PDF - replacing with correct response');
          const pdfMessage = shouldRespondInTelugu 
            ? "మీ డేటాతో డౌన్‌లోడ్ చేయగల PDF ఫైల్‌ను వెంటనే జెనరేట్ చేస్తాను! PDF త్వరలో డౌన్‌లోడ్ కోసం సిద్ధంగా ఉంటుంది."
            : "I'll generate a downloadable PDF file with all your data right away! The PDF will be ready for download shortly.";
          responseText = pdfMessage;
        }
      }

      // OPTIMIZATION: Extract suggestions and next steps in PARALLEL with timeout
      // This saves 4-6 seconds by not waiting for one to complete before starting the other
      // OPTIMIZATION: Skip suggestions/nextSteps on first request OR when user is answering for faster response
      console.time('⏱️  Extract Suggestions & Next Steps');
      let suggestions: any = {};
      let nextSteps: string[] = [];
      
      if (!isFirstRequest && !isAnsweringQuestion) {
        // Only extract suggestions/nextSteps if not first request (for speed)
        const suggestionsPromise = this.extractSuggestions(userMessage, responseText, userContext)
          .catch((error) => {
            console.error('Failed to extract suggestions, continuing without them:', error);
            return {};
          });
        
        const nextStepsPromise = this.generateNextSteps(userMessage, responseText, userContext)
          .catch((error) => {
            console.error('Failed to generate next steps, continuing without them:', error);
            return [];
          });
        
        // Add timeout wrapper (5 seconds max for both, 3s for first request)
        const timeoutMs = isFirstRequest ? 3000 : 5000;
        const timeoutPromise = new Promise((resolve) => 
          setTimeout(() => resolve({ suggestions: {}, nextSteps: [] }), timeoutMs)
        );
        
        const result = await Promise.race([
          Promise.all([suggestionsPromise, nextStepsPromise]).then(([s, n]) => ({ suggestions: s, nextSteps: n })),
          timeoutPromise
        ]) as any;
        
        suggestions = result.suggestions || {};
        nextSteps = result.nextSteps || [];
      } else {
        if (isFirstRequest) {
          console.log('⚡ Fast mode: Skipping suggestions/nextSteps extraction for faster first response');
        } else if (isAnsweringQuestion) {
          console.log('⚡ Fast mode: Skipping suggestions/nextSteps extraction - user is answering');
        }
      }
      
      console.timeEnd('⏱️  Extract Suggestions & Next Steps');

      // Generate enhanced DPR questions if template structure is available
      let enhancedDPRQuestions = dprQuestions;
      if (wantsToCreateDPR && templateStructure) {
        try {
          // Extract user responses from conversation history
          const userResponses: Record<string, any> = {};
          conversationHistory.forEach((msg: any) => {
            if (msg.role === 'user') {
              // Try to extract structured responses (this is a simplified version)
              // In a real implementation, you'd parse the conversation more intelligently
            }
          });

          // Generate context-specific questions based on template structure
          const contextQuestions = await this.generateContextSpecificQuestions(
            templateStructure,
            1, // Start with first section
            userResponses,
            templateContext
          );

          enhancedDPRQuestions = {
            isDPRMode: true,
            ...contextQuestions,
            templateStructure: {
              totalSections: templateStructure.totalSections,
              estimatedTime: templateStructure.estimatedTime,
              sourceDocuments: templateStructure.sourceDocuments,
            },
          };
        } catch (error) {
          console.error('Error generating enhanced DPR questions:', error);
          // Fallback to basic questions
        }
      }

      const totalResponseTime = Date.now() - startTime;
      
      // Track overall RAG chat performance
      await this.trackRAGPerformance(
        userMessage,
        totalResponseTime,
        true,
        vectorStoreIds || [],
        'gpt-4o',
        response.usage?.total_tokens,
        undefined,
        userId,
        'chat'
      );

      console.log(`⏱️  Total RAG chat response time: ${totalResponseTime}ms`);

      // OPTIMIZATION: Include PDF generation flag and data in response
      const responseData: any = {
        response: responseText,
        suggestions,
        nextSteps,
        ragContext: context ? 'RAG used' : 'No documents available',
        dprAction: wantsToCreateDPR ? 'start_creation' : undefined,
        dprQuestions: enhancedDPRQuestions?.isDPRMode ? enhancedDPRQuestions : undefined,
        templateStructure: templateStructure ? {
          totalSections: templateStructure.totalSections,
          estimatedTime: templateStructure.estimatedTime,
          sourceDocuments: templateStructure.sourceDocuments,
        } : undefined,
      };

      // Add PDF generation flag and data if requested
      if (wantsPDF) {
        responseData.generatePDF = true;
        // Always extract all user data for PDF, even if not explicitly requested
        const pdfData = allUserData || this.extractAllUserData(conversationHistory);
        responseData.conversationData = pdfData;
        console.log('📄 PDF generation requested - data prepared');
        if (pdfData) {
          const entryCount = (pdfData.match(/\[Entry/g) || []).length;
          console.log(`📊 Extracted ${entryCount} data entries for PDF`);
        }
      }

      // Add full data flag if requested
      if (wantsFullData) {
        responseData.fullDataRequested = true;
        responseData.allUserData = allUserData;
        console.log('📊 Full data compilation requested');
      }

      return responseData;
    } catch (error: any) {
      const totalResponseTime = Date.now() - startTime;
      const errorMessage = error.message || 'Unknown error';
      
      console.error(`❌ RAG chat error (${totalResponseTime}ms):`, errorMessage);
      
      // Track failed performance
      await this.trackRAGPerformance(
        userMessage,
        totalResponseTime,
        false,
        vectorStoreIds || [],
        'gpt-4o',
        undefined,
        errorMessage,
        userId,
        'chat'
      );
      
      throw new Error('Failed to generate RAG chat response');
    }
  }

  /**
   * Extract financial and scheme suggestions from conversation
   */
  static async extractSuggestions(
    userMessage: string,
    response: string,
    userContext?: any
  ): Promise<any> {
    try {
      const prompt = `Analyze this DPR conversation and extract relevant suggestions:

User Message: ${userMessage}
AI Response: ${response}
User Context: ${userContext ? JSON.stringify(userContext) : 'None'}

Extract and return JSON with:
1. financialSuggestions: Cost estimates, funding recommendations, financial ratios
2. schemeSuggestions: Relevant government schemes for the project
3. sectorBenchmarks: Industry-specific data and benchmarks
4. nextActions: Specific steps the user should take

IMPORTANT: Return only valid JSON. Do not wrap in markdown code blocks or include any extra text.`;

      // OPTIMIZATION: Use faster model for suggestions
      const suggestionResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Faster model
        messages: [
          {
            role: 'system',
            content: 'You are a data extraction specialist. Return only valid JSON. Do not include markdown formatting, code blocks, or any text outside of the JSON object.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 600, // Reduced for faster response
      });

      const content = suggestionResponse.choices[0].message.content || '{}';

      // Clean the response to remove markdown code blocks and extra text
      let cleanContent = content
        .replace(/```json\s*/g, '') // Remove opening ```json
        .replace(/```\s*/g, '')     // Remove closing ```
        .replace(/^[^{]*{/, '{')   // Remove any text before first {
        .replace(/}[^}]*$/, '}')   // Remove any text after last }
        .trim();

      // If cleaning didn't work, try to extract JSON from the middle
      if (!cleanContent.startsWith('{') || !cleanContent.endsWith('}')) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanContent = jsonMatch[0];
        }
      }

      try {
        return JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('JSON parse error after cleaning:', parseError);
        console.error('Cleaned content:', cleanContent);
        return {};
      }
    } catch (error) {
      console.error('Error extracting suggestions:', error);
      return {};
    }
  }

  /**
   * Generate next steps for DPR creation
   */
  static async generateNextSteps(
    userMessage: string,
    response: string,
    userContext?: any
  ): Promise<string[]> {
    try {
      const prompt = `Based on this DPR conversation, suggest 3-5 specific next steps:

User Message: ${userMessage}
AI Response: ${response}
User Context: ${userContext ? JSON.stringify(userContext) : 'None'}

Provide actionable, specific steps the user should take next in their DPR creation process. Format your response as a numbered list (1, 2, 3, etc.) with each step on a new line.`;

      // OPTIMIZATION: Use faster model for next steps
      const stepsResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Faster model
        messages: [
          {
            role: 'system',
            content: 'You are a DPR creation guide. Provide specific, actionable next steps. List each step on a new line, numbered 1-5.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 300, // Reduced for faster response
      });

      const stepsText = stepsResponse.choices[0].message.content || '';

      // Clean the response and extract steps
      let cleanSteps = stepsText
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/^\d+\.\s*/gm, '')     // Remove numbered prefixes
        .replace(/^[•\-\*]\s*/gm, '')  // Remove bullet points
        .trim();

      return cleanSteps
        .split('\n')
        .map(step => step.trim())
        .filter(step => step.length > 0)
        .slice(0, 5); // Limit to 5 steps
    } catch (error) {
      console.error('Error generating next steps:', error);
      return [];
    }
  }

  /**
   * Detect if user is answering a question vs asking a new question
   * Helps optimize response time by skipping RAG when user is just providing answers
   */
  private static detectIfAnsweringQuestion(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }> = []
  ): boolean {
    try {
      // If no conversation history, user is asking a question
      if (!conversationHistory || conversationHistory.length === 0) {
        return false;
      }

      // Get last assistant message
      const lastAssistantMessage = conversationHistory
        .slice()
        .reverse()
        .find(msg => msg.role === 'assistant');

      // If last message was from assistant and contains a question, user is likely answering
      if (lastAssistantMessage) {
        const hasQuestion = /[?？]/.test(lastAssistantMessage.content) || 
                           /\b(what|which|when|where|who|how|why|tell me|provide|enter|give)\b/i.test(lastAssistantMessage.content);
        
        if (hasQuestion) {
          // Check if user message looks like an answer (not a question)
          const isUserAsking = /[?？]/.test(userMessage) || 
                              /\b(what|which|when|where|who|how|why|tell me|explain|help|show)\b/i.test(userMessage);
          
          // If user message is short and doesn't contain question words, likely an answer
          const isShortAnswer = userMessage.length < 200 && !isUserAsking;
          
          return isShortAnswer || !isUserAsking;
        }
      }

      return false;
    } catch (error) {
      console.warn('Error detecting if answering question:', error);
      return false;
    }
  }

  /**
   * Extract key information from user answers in conversation
   * Builds context from user's responses to help AI generate relevant next questions
   */
  private static extractUserAnswersContext(
    conversationHistory: Array<{ role: string; content: string }> = []
  ): string {
    try {
      if (!conversationHistory || conversationHistory.length === 0) {
        return '';
      }

      // Get last 4 user messages (likely answers to questions)
      const recentUserMessages = conversationHistory
        .filter(msg => msg.role === 'user')
        .slice(-4);

      if (recentUserMessages.length === 0) {
        return '';
      }

      // Build context summary from user answers
      const answersContext = recentUserMessages
        .map((msg, idx) => {
          // Skip very short messages (likely not meaningful answers)
          if (msg.content.length < 10) {
            return null;
          }
          return `Answer ${idx + 1}: ${msg.content.substring(0, 150)}`;
        })
        .filter(ctx => ctx !== null)
        .join('\n');

      return answersContext;
    } catch (error) {
      console.warn('Error extracting user answers context:', error);
      return '';
    }
  }

  /**
   * Extract ALL user-provided data from entire conversation history
   * This ensures we capture all information user has provided, not just recent messages
   */
  private static extractAllUserData(
    conversationHistory: Array<{ role: string; content: string }> = []
  ): string {
    try {
      if (!conversationHistory || conversationHistory.length === 0) {
        return '';
      }

      // Get ALL user messages from conversation (not just recent ones)
      const allUserMessages = conversationHistory.filter(msg => msg.role === 'user');

      if (allUserMessages.length === 0) {
        return '';
      }

      // Build comprehensive data summary from all user messages
      const allData = allUserMessages
        .map((msg, idx) => {
          // Skip very short messages (likely not meaningful data)
          if (msg.content.length < 5) {
            return null;
          }
          // Include full content, not truncated
          return `[Entry ${idx + 1}]: ${msg.content}`;
        })
        .filter(data => data !== null)
        .join('\n\n');

      console.log(`📊 Extracted ${allUserMessages.length} user data entries from conversation`);
      return allData;
    } catch (error) {
      console.warn('Error extracting all user data:', error);
      return '';
    }
  }

  /**
   * Detect if user is asking for full data compilation or PDF generation
   */
  private static detectDataRequest(userMessage: string): {
    wantsFullData: boolean;
    wantsPDF: boolean;
  } {
    const messageLower = userMessage.toLowerCase();
    
    const fullDataKeywords = [
      'full data', 'all data', 'complete data', 'everything i gave', 'all information',
      'all details', 'complete information', 'summarize all', 'compile all',
      'give me all', 'show me all', 'what i provided', 'what i gave', 'given data',
      'data i provided', 'data i gave', 'all the data'
    ];
    
    const pdfKeywords = [
      'make pdf', 'generate pdf', 'create pdf', 'download pdf', 'export pdf',
      'pdf file', 'give me pdf', 'send pdf', 'pdf document', 'convert to pdf',
      'save as pdf', 'pdf format', 'create the pdf', 'make the pdf', 'generate the pdf',
      'pdf for', 'pdf of', 'pdf with', 'create pdf for', 'make pdf for', 'generate pdf for',
      'pdf for the given', 'pdf for given data', 'pdf for the data', 'create the pdf for'
    ];
    
    // More aggressive detection - check for "pdf" anywhere in message
    const hasPDF = messageLower.includes('pdf');
    const hasCreateAction = /\b(create|make|generate|download|export|save|convert|give|send|provide)\b/i.test(messageLower);
    const hasDataReference = /\b(given|provided|data|information|details|content)\b/i.test(messageLower);
    
    const wantsFullData = fullDataKeywords.some(keyword => messageLower.includes(keyword));
    // Enhanced PDF detection: if message contains "pdf" and action words, it's likely a PDF request
    const wantsPDF = pdfKeywords.some(keyword => messageLower.includes(keyword)) || 
                     (hasPDF && (hasCreateAction || messageLower.includes('for')));
    
    if (wantsPDF) {
      console.log(`📄 PDF request detected: "${userMessage}"`);
    }
    
    return { wantsFullData, wantsPDF };
  }

  /**
   * Filter and organize conversation data by DPR sections
   * Removes conversational/chat text and organizes project-related information
   */
  private static async filterAndOrganizeProjectData(
    conversationData: string,
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<{
    sections: {
      executiveSummary: string[];
      businessProfile: string[];
      marketAnalysis: string[];
      technicalFeasibility: string[];
      financialProjections: string[];
      conclusion: string[];
    };
    projectInfo: {
      projectName?: string;
      industrySector?: string;
      location?: string;
      totalCost?: string;
      loanAmount?: string;
    };
  }> {
    try {
      console.log('🔍 Filtering and organizing project data for PDF...');
      
      // Extract user messages
      const userMessages = conversationHistory
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content)
        .filter(content => content && content.length > 5);
      
      if (userMessages.length === 0) {
        return {
          sections: {
            executiveSummary: [],
            businessProfile: [],
            marketAnalysis: [],
            technicalFeasibility: [],
            financialProjections: [],
            conclusion: [],
          },
          projectInfo: {},
        };
      }
      
      // Use AI to filter and organize the data
      const prompt = `You are a DPR (Detailed Project Report) data extraction specialist. Your task is to filter out conversational/chat text and organize only project-related information according to DPR sections.

User Messages from Conversation:
${userMessages.map((msg, idx) => `[Message ${idx + 1}]: ${msg}`).join('\n\n')}

IMPORTANT RULES:
1. EXCLUDE conversational text such as:
   - Greetings (hello, hi, thanks, thank you, etc.)
   - Questions asking for help or clarification
   - Requests for PDF generation or data export
   - Chat responses like "ok", "yes", "no", "sure", "please", etc.
   - Meta-conversation about the system or process
   - Any text that is not actual project information

2. INCLUDE only project-related information such as:
   - Project name, description, business details
   - Industry sector, location, market information
   - Technical specifications, equipment, processes
   - Financial data (costs, revenue, projections, loan amounts)
   - Market analysis, target customers, competition
   - Business model, operations, feasibility
   - Any factual project data

3. ORGANIZE the filtered data into these DPR sections:
   - executiveSummary: High-level project overview, objectives, key highlights
   - businessProfile: Business description, type, ownership, legal structure
   - marketAnalysis: Target market, customer analysis, competition, demand
   - technicalFeasibility: Technical specifications, equipment, processes, technology
   - financialProjections: Costs, revenue, financial projections, funding requirements
   - conclusion: Summary, recommendations, next steps

4. EXTRACT project information:
   - projectName: The name of the project
   - industrySector: Industry or sector
   - location: Project location
   - totalCost: Total project cost if mentioned
   - loanAmount: Loan amount required if mentioned

Return ONLY a valid JSON object with this structure:
{
  "sections": {
    "executiveSummary": ["relevant text 1", "relevant text 2"],
    "businessProfile": ["relevant text 1", "relevant text 2"],
    "marketAnalysis": ["relevant text 1", "relevant text 2"],
    "technicalFeasibility": ["relevant text 1", "relevant text 2"],
    "financialProjections": ["relevant text 1", "relevant text 2"],
    "conclusion": ["relevant text 1", "relevant text 2"]
  },
  "projectInfo": {
    "projectName": "name if found",
    "industrySector": "sector if found",
    "location": "location if found",
    "totalCost": "cost if found",
    "loanAmount": "loan amount if found"
  }
}

IMPORTANT: 
- Return ONLY valid JSON, no markdown, no code blocks, no extra text
- If a section has no relevant data, use an empty array []
- Only include actual project information, exclude all conversational text
- Each array item should be a meaningful piece of project information`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a DPR data extraction specialist. Extract and organize only project-related information, excluding all conversational text. Return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 4000,
      });

      const content = response.choices[0]?.message?.content || '{}';
      
      // Clean the response
      let cleanContent = content
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      
      // Extract JSON if wrapped in text
      if (!cleanContent.startsWith('{')) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanContent = jsonMatch[0];
        }
      }

      const organizedData = JSON.parse(cleanContent);
      
      console.log(`✅ Filtered and organized data into ${Object.keys(organizedData.sections).length} sections`);
      
      return organizedData;
    } catch (error: any) {
      console.error('❌ Error filtering and organizing project data:', error);
      // Fallback: return empty structure
      return {
        sections: {
          executiveSummary: [],
          businessProfile: [],
          marketAnalysis: [],
          technicalFeasibility: [],
          financialProjections: [],
          conclusion: [],
        },
        projectInfo: {},
      };
    }
  }

  /**
   * Generate PDF from conversation data
   * Creates a professional PDF with only project-related information organized by DPR sections
   * Excludes all conversational/chat text
   */
  static async generatePDFFromConversation(
    conversationData: string,
    conversationHistory: Array<{ role: string; content: string }> = [],
    userId?: string
  ): Promise<Buffer> {
    try {
      console.log('📄 Starting professional PDF generation...');
      console.log(`📊 Conversation data length: ${conversationData.length} characters`);
      
      // Validate inputs
      if (!conversationData || conversationData.length === 0) {
        throw new Error('Conversation data is empty or undefined');
      }
      
      // Check if PDFDocument is available
      if (!PDFDocument) {
        throw new Error('PDFDocument is not available. Check if pdfkit is properly installed.');
      }
      
      // Filter and organize project data by DPR sections (excludes conversational text)
      const organizedData = await this.filterAndOrganizeProjectData(conversationData, conversationHistory);
      
      // Count total data entries across all sections
      const totalEntries = Object.values(organizedData.sections).reduce(
        (sum, sectionData) => sum + sectionData.length,
        0
      );
      
      console.log(`📊 Filtered ${totalEntries} project-related data entries (conversational text excluded)`);
      
      // Calculate analytics from organized data
      const allSectionData = Object.values(organizedData.sections).flat();
      const allText = allSectionData.join(' ');
      const totalWords = allText.split(/\s+/).filter(w => w.length > 0).length;
      const totalCharacters = allText.length;
      const averageEntryLength = totalEntries > 0 
        ? Math.round(totalCharacters / totalEntries) 
        : 0;
      
      return new Promise((resolve, reject) => {
        try {
          const doc = new PDFDocument({ 
            margin: 50,
            size: 'A4',
            info: {
              Title: 'DPR Data Report',
              Author: 'MSME AI DPR Assistant',
              Subject: 'Detailed Project Report Data',
              Creator: 'MSME DPR Tool'
            }
          });
          const chunks: Buffer[] = [];

          doc.on('data', (chunk: Buffer) => chunks.push(chunk));
          doc.on('end', () => {
            const buffer = Buffer.concat(chunks);
            console.log(`📄 Professional PDF buffer created: ${buffer.length} bytes`);
            resolve(buffer);
          });
          doc.on('error', (error: Error) => {
            console.error('❌ PDFDocument error event:', error);
            reject(error);
          });

        // Title Page - Professional Design
        doc.fontSize(28).font('Helvetica-Bold').text('Detailed Project Report', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(20).font('Helvetica').text('Project Information Report', { align: 'center' });
        doc.moveDown(2);
        
        // Add project information if available
        if (organizedData.projectInfo.projectName) {
          doc.fontSize(16).font('Helvetica-Bold').text(organizedData.projectInfo.projectName, { align: 'center' });
          doc.moveDown(0.5);
        }
        
        // Add a line separator
        doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
        doc.moveDown(1);
        
        doc.fontSize(14).font('Helvetica-Bold').text('Report Information', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        doc.text(`Generated Date: ${new Date().toLocaleDateString('en-IN', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}`, { align: 'center' });
        doc.text(`Generated Time: ${new Date().toLocaleTimeString('en-IN')}`, { align: 'center' });
        if (organizedData.projectInfo.industrySector) {
          doc.text(`Industry Sector: ${organizedData.projectInfo.industrySector}`, { align: 'center' });
        }
        if (organizedData.projectInfo.location) {
          doc.text(`Location: ${organizedData.projectInfo.location}`, { align: 'center' });
        }
        if (userId) {
          doc.text(`Report ID: ${userId.substring(0, 8)}...`, { align: 'center' });
        }
        doc.moveDown(2);

        // Analytics Page
        doc.addPage();
        doc.fontSize(20).font('Helvetica-Bold').text('Data Analytics', { align: 'center', underline: true });
        doc.moveDown(1);
        
        // Analytics Box
        const analyticsY = doc.y;
        doc.rect(50, analyticsY, 512, 150).stroke();
        doc.moveDown(0.3);
        
        doc.fontSize(12).font('Helvetica-Bold').text('Summary Statistics', 60, doc.y);
        doc.moveDown(0.5);
        
        doc.fontSize(10).font('Helvetica');
        doc.text(`Total Data Entries: ${totalEntries}`, 60, doc.y);
        doc.text(`Total Words: ${totalWords.toLocaleString()}`, 300, doc.y);
        doc.moveDown(0.4);
        doc.text(`Total Characters: ${totalCharacters.toLocaleString()}`, 60, doc.y);
        doc.text(`Average Entry Length: ${averageEntryLength.toLocaleString()} characters`, 300, doc.y);
        doc.moveDown(0.4);
        doc.text(`Data Completeness: ${totalEntries > 0 ? 'Complete' : 'Incomplete'}`, 60, doc.y);
        doc.text(`Report Status: Professional`, 300, doc.y);
        
        doc.moveDown(2);
        
        // DPR Sections - Organized by defined sections
        const sectionLabels: Record<string, string> = {
          executiveSummary: '1. Executive Summary',
          businessProfile: '2. Business Profile',
          marketAnalysis: '3. Market Analysis',
          technicalFeasibility: '4. Technical Feasibility',
          financialProjections: '5. Financial Projections',
          conclusion: '6. Conclusion'
        };
        
        // Process each DPR section
        Object.entries(organizedData.sections).forEach(([sectionKey, sectionData]) => {
          if (sectionData.length === 0) {
            return; // Skip empty sections
          }
          
          // Check if we need a new page
          if (doc.y > 700) {
            doc.addPage();
          }
          
          try {
            // Section Header
            const sectionLabel = sectionLabels[sectionKey] || sectionKey;
            doc.fontSize(18).font('Helvetica-Bold').text(sectionLabel, { underline: true });
            doc.moveDown(0.5);
            
            // Section Content
            sectionData.forEach((dataItem: string, index: number) => {
              // Check if we need a new page
              if (doc.y > 750) {
                doc.addPage();
                doc.fontSize(11).font('Helvetica');
              }
              
              // Format content nicely
              const cleanContent = dataItem.trim();
              if (cleanContent.length > 0) {
                doc.fontSize(11).font('Helvetica').text(cleanContent, { 
                  align: 'left',
                  indent: 20,
                  paragraphGap: 5
                });
                doc.moveDown(0.4);
              }
            });
            
            doc.moveDown(1);
            
            // Add separator line between sections
            doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
            doc.moveDown(1);
          } catch (sectionError: any) {
            console.warn(`⚠️  Error processing section ${sectionKey}:`, sectionError.message);
            // Continue with next section
          }
        });

        // Footer on last page
        doc.addPage();
        doc.fontSize(16).font('Helvetica-Bold').text('Report Summary', { align: 'center', underline: true });
        doc.moveDown(1);
        
        doc.fontSize(11).font('Helvetica');
        doc.text('This report contains only project-related information organized according to DPR sections.', {
          align: 'justify',
          indent: 20
        });
        doc.moveDown(0.5);
        doc.text('All conversational and chat text has been filtered out. The data has been compiled and formatted for professional presentation.', {
          align: 'justify',
          indent: 20
        });
        doc.moveDown(1);
        
        doc.fontSize(10).font('Helvetica-Oblique');
        doc.text('Generated by MSME AI DPR Assistant', { align: 'center' });
        doc.text(`Report Generated: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
        doc.moveDown(0.5);
        doc.text('© MSME DPR Tool - All Rights Reserved', { align: 'center' });

        console.log('📄 Finalizing PDF document...');
        doc.end();
        } catch (docError: any) {
          console.error('❌ Error creating PDFDocument:', docError);
          reject(docError);
        }
      });
    } catch (error: any) {
      console.error('❌ Error generating PDF from conversation:', error);
      console.error('Error message:', error.message);
      console.error('Error name:', error.name);
      console.error('Error stack:', error.stack);
      throw new Error(`Failed to generate PDF from conversation: ${error.message}`);
    }
  }

  /**
   * Build context-aware query from user message and conversation history
   * This ensures RAG searches consider the full conversation context
   */
  private static async buildContextAwareQuery(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }> = [],
    userContext?: any
  ): Promise<string> {
    try {
      // If no conversation history, return the message as-is
      if (!conversationHistory || conversationHistory.length === 0) {
        return userMessage;
      }

      // Get last 6 messages for context (3 user + 3 assistant pairs)
      const recentHistory = conversationHistory.slice(-6);
      
      // Build conversation summary
      const conversationSummary = recentHistory
        .map((msg, idx) => {
          const role = msg.role === 'user' ? 'User' : 'Assistant';
          return `${role}: ${msg.content}`;
        })
        .join('\n');

      // Use AI to extract key context and build enhanced query
      const prompt = `Given this conversation history and current user message, create an enhanced search query that captures the full context and intent.

Conversation History:
${conversationSummary}

Current User Message: ${userMessage}
${userContext ? `User Context: ${JSON.stringify(userContext)}` : ''}

Create a comprehensive search query that:
1. Includes the current user's question/intent
2. Incorporates relevant context from the conversation
3. Extracts key topics, entities, and concepts mentioned
4. Makes the query specific enough to find relevant documents
5. Is concise but comprehensive (max 200 words)

Return ONLY the enhanced search query, nothing else. Do not include explanations or markdown.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Fast and cheap for query enhancement
        messages: [
          {
            role: 'system',
            content: 'You are a query enhancement specialist. Extract key context from conversations and create comprehensive search queries. Return only the query text.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const enhancedQuery = response.choices[0]?.message?.content?.trim() || userMessage;
      
      // Fallback: If AI fails or returns invalid response, build simple enhanced query
      if (enhancedQuery === userMessage || enhancedQuery.length < 10) {
        // Build a simple enhanced query from conversation
        const userMessages = recentHistory
          .filter(msg => msg.role === 'user')
          .map(msg => msg.content)
          .join(' ');
        
        const assistantMessages = recentHistory
          .filter(msg => msg.role === 'assistant')
          .map(msg => msg.content)
          .join(' ')
          .substring(0, 200); // Limit length
        
        // Combine current message with recent context
        return `${userMessage}. Context: ${userMessages} ${assistantMessages ? `Related: ${assistantMessages}` : ''}`.substring(0, 500);
      }

      console.log(`🔍 Enhanced query from conversation context (${enhancedQuery.length} chars)`);
      return enhancedQuery.substring(0, 500); // Limit query length
    } catch (error) {
      console.warn('⚠️  Failed to build context-aware query, using original message:', error);
      // Fallback to original message if enhancement fails
      return userMessage;
    }
  }

  /**
   * Track RAG performance metrics
   */
  private static async trackRAGPerformance(
    query: string,
    responseTime: number,
    success: boolean,
    vectorStoreIds: string[],
    model?: string,
    tokensUsed?: number,
    error?: string,
    userId?: string,
    queryType: 'chat' | 'template_search' | 'document_search' = 'document_search'
  ): Promise<void> {
    try {
      await RAGMetrics.create({
        query: query.substring(0, 500), // Limit query length
        responseTime,
        success,
        vectorStoreIds,
        model,
        tokensUsed,
        error: error?.substring(0, 1000), // Limit error length
        userId,
        queryType,
      });
    } catch (error) {
      // Don't fail the main operation if metrics tracking fails
      console.error('Error tracking RAG performance:', error);
    }
  }

  /**
   * Fast search using document metadata - bypasses slow Assistants API
   * Returns results in <1 second for simple queries
   */
  private static async fastMetadataSearch(
    query: string,
    vectorStoreIds: string[],
    maxResults: number = 5
  ): Promise<any[]> {
    const startTime = Date.now();
    try {
      const { Document } = await import('../models/Document.model');
      const mainVectorStoreId = process.env.MAIN_VECTOR_STORE_ID || ' ';
      
      // Simple keyword-based search on document metadata
      const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      
      const documents = await Document.find({
        vectorStoreId: mainVectorStoreId,
        status: 'ready',
        $or: [
          { originalName: { $regex: keywords.join('|'), $options: 'i' } },
          { 'metadata.description': { $regex: keywords.join('|'), $options: 'i' } },
          { 'metadata.tags': { $in: keywords } },
          { 'metadata.category': { $regex: keywords.join('|'), $options: 'i' } }
        ]
      })
      .limit(maxResults * 2) // Get more to filter
      .sort({ createdAt: -1 }); // Most recent first
      
      if (documents.length === 0) {
        return [];
      }
      
      // Return simple results
      const results = documents.slice(0, maxResults).map((doc: any) => ({
        content: `Document: ${doc.originalName}. ${doc.metadata?.description || 'Relevant information from knowledge base.'}`,
        documentName: doc.originalName,
        documentId: doc._id.toString(),
        openaiFileId: doc.openaiFileId,
        fastSearch: true,
      }));
      
      const responseTime = Date.now() - startTime;
      console.log(`⚡ Fast metadata search completed in ${responseTime}ms, found ${results.length} results`);
      return results;
    } catch (error) {
      console.error('Fast metadata search error:', error);
      return [];
    }
  }

  /**
   * Search documents using RAG with OpenAI Assistants API and File Search
   * OPTIMIZATION: Uses fast metadata search first, only uses slow Assistants API if needed
   */
  static async searchDocumentsWithRAG(
    query: string,
    vectorStoreIds: string[],
    maxResults: number = 5,
    userId?: string
  ): Promise<any[]> {
    const startTime = Date.now();
    
    // OPTIMIZATION: Check cache first for instant responses
    const cachedResults = getCachedQueryResults(query, vectorStoreIds);
    if (cachedResults) {
      const responseTime = Date.now() - startTime;
      console.log(`⚡ Cache hit! Returning results in ${responseTime}ms`);
      return cachedResults;
    }
    
    // OPTIMIZATION: Try fast metadata search first (<1 second)
    // This bypasses the slow Assistants API entirely for simple queries
    try {
      console.log('⚡ Attempting fast metadata search...');
      const fastResults = await Promise.race([
        this.fastMetadataSearch(query, vectorStoreIds, maxResults),
        new Promise<any[]>((_, reject) => 
          setTimeout(() => reject(new Error('Fast search timeout')), 1000) // 1s timeout
        )
      ]);
      
      if (fastResults && fastResults.length > 0) {
        const responseTime = Date.now() - startTime;
        console.log(`✅ Fast search succeeded in ${responseTime}ms - bypassing slow Assistants API`);
        
        // Cache the results for future queries
        setCachedQueryResults(query, vectorStoreIds, fastResults);
        
        await this.trackRAGPerformance(
          query,
          responseTime,
          true,
          vectorStoreIds,
          'fast-metadata',
          undefined,
          undefined,
          userId,
          'document_search'
        );
        return fastResults;
      }
    } catch (error) {
      console.log('⚠️  Fast search failed, using Assistants API (slower but more accurate)...');
      // Continue to Assistants API fallback
    }
    
    // Fallback to Assistants API (slower but more accurate for complex queries)
    console.log('🔄 Using Assistants API for semantic search...');
    let assistantId: string | undefined;
    let threadId: string | undefined;
    let runId: string | undefined;

    try {
      // Ensure we're using the main MSME Knowledge Base vector store
      const mainVectorStoreId = process.env.MAIN_VECTOR_STORE_ID || ' ';
      const activeVectorStores = vectorStoreIds.includes(mainVectorStoreId) 
        ? vectorStoreIds.filter(id => id && id.trim() !== '')
        : [mainVectorStoreId, ...vectorStoreIds].filter(id => id && id.trim() !== '');

      if (activeVectorStores.length === 0) {
        throw new Error('No valid vector stores available');
      }

      console.log(`🔍 RAG Search: Querying with ${activeVectorStores.length} vector stores`);
      console.log(`📚 Vector Stores: ${activeVectorStores.join(', ')}`);

      // OPTIMIZATION: Reuse cached assistant instead of creating new one every time
      // This saves 5-10 seconds per search by avoiding assistant creation overhead
      assistantId = getCachedAssistant(activeVectorStores) || undefined;
      
      if (!assistantId) {
        console.log('📝 Creating new assistant (not found in cache)...');
        // OPTIMIZATION: Simplified instructions for faster processing
        // Shorter, more direct instructions = faster execution
        const assistant = await openai.beta.assistants.create({
          model: 'gpt-4o-mini', // Fastest model
          name: 'MSME Knowledge Base Search',
          instructions: `Search the knowledge base and return the most relevant information. Be concise. Cite sources.`,
          tools: [{ type: 'file_search' }],
          tool_resources: {
            file_search: {
              vector_store_ids: activeVectorStores,
            },
          },
          temperature: 0.1, // Lower temperature for faster, more deterministic responses
        });

        assistantId = assistant.id;
        setCachedAssistant(activeVectorStores, assistantId);
        console.log(`✅ Created and cached assistant: ${assistantId}`);
      } else {
        console.log(`♻️  Reusing cached assistant: ${assistantId}`);
      }

      // OPTIMIZATION: Optimize query for faster processing
      // Shorter, more direct queries process faster
      const optimizedQuery = query.length > 200 
        ? query.substring(0, 200) + '...' // Limit query length
        : query;
      
      // Create a thread with the optimized query
      const thread = await openai.beta.threads.create({
        messages: [
          {
            role: 'user',
            content: optimizedQuery,
          },
        ],
      });

      threadId = thread.id;

      // OPTIMIZATION: Create run with streaming disabled for faster processing
      // Also add metadata for tracking
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistantId,
        // Don't stream - faster processing
        stream: false,
      });

      runId = run.id;

      // OPTIMIZATION: Balanced timeout with smart polling
      // OPTIMIZATION: Use shorter timeout for first requests (8s) to fail fast and use fallback
      const isFirstRequest = !getCachedAssistant(activeVectorStores);
      const maxWaitTime = isFirstRequest ? 8000 : 12000; // 8s for first request, 12s for subsequent
      let pollInterval = 100; // Start with 100ms
      const maxPollInterval = 800; // Max 800ms
      const startPollTime = Date.now();
      
      if (isFirstRequest) {
        console.log('⚡ Fast mode: Using shorter 8s timeout for first request');
      }
      
      let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      let pollCount = 0;
      
      // Early exit if already completed
      if (runStatus.status === 'completed') {
        console.log('✅ RAG search completed immediately');
      } else {
        // Smart polling: check more frequently at start, less frequently later
        while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
          const elapsed = Date.now() - startPollTime;
          pollCount++;
          
          // Check timeout
          if (elapsed > maxWaitTime) {
            console.warn(`⏰ RAG search timeout after ${elapsed}ms (${pollCount} polls), using fallback`);
            throw new Error('RAG search timeout');
          }
          
          // Adaptive polling: faster at start, slower later
          // First 3 polls: 100ms, then gradually increase
          if (pollCount <= 3) {
            pollInterval = 100;
          } else if (pollCount <= 6) {
            pollInterval = 200;
          } else if (pollCount <= 10) {
            pollInterval = 400;
          } else {
            pollInterval = maxPollInterval;
          }
          
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
          
          // Log progress every 5 polls
          if (pollCount % 5 === 0) {
            console.log(`⏳ RAG search in progress... (${elapsed}ms, status: ${runStatus.status})`);
          }
        }
      }
      
      console.log(`✅ RAG search completed after ${Date.now() - startPollTime}ms (${pollCount} polls)`);

      if (runStatus.status === 'failed') {
        throw new Error(runStatus.last_error?.message || 'RAG search failed');
      }

      // OPTIMIZATION: Retrieve messages efficiently
      // Only get the latest message, limit to 1 for faster retrieval
      const messages = await openai.beta.threads.messages.list(thread.id, {
        limit: 1,
        order: 'desc',
      });

      const responseTime = Date.now() - startTime;
      
      if (!messages.data || messages.data.length === 0) {
        console.warn('⚠️  No messages returned from RAG search');
        return [];
      }
      
      const assistantMessage = messages.data[0];
      if (!assistantMessage.content || assistantMessage.content.length === 0) {
        console.warn('⚠️  No content in assistant message');
        return [];
      }
      
      const content = assistantMessage.content[0];

      let results: any[] = [];
      
      if (content.type === 'text') {
        // Extract citations if available
        const textContent = content.text.value;
        const annotations = content.text.annotations || [];
        
        results = [{
          content: textContent,
          citations: annotations.map((ann: any) => ({
            file_id: ann.file_citation?.file_id,
            quote: ann.file_citation?.quote,
          })),
          model: 'gpt-4o-mini',
        }];
      }

      // Track performance
      await this.trackRAGPerformance(
        query,
        responseTime,
        true,
        activeVectorStores,
        'gpt-4o-mini',
        runStatus.usage?.total_tokens,
        undefined,
        userId,
        'document_search'
      );

      console.log(`✅ RAG Search: Completed in ${responseTime}ms, found ${results.length} results`);
      
      // Cache the results for future queries (even if from Assistants API)
      setCachedQueryResults(query, vectorStoreIds, results);
      
      // OPTIMIZATION: Don't delete assistant (we're reusing it), only delete thread
      // This allows assistant reuse across multiple searches
      try {
        // Only delete thread, keep assistant for reuse
        await openai.beta.threads.del(threadId);
      } catch (cleanupError) {
        // Ignore cleanup errors
        console.warn('Thread cleanup warning:', cleanupError);
      }

      return results;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error.message || 'Unknown error';
      
      console.error(`❌ RAG Search Error (${responseTime}ms):`, errorMessage);

      // Track failed performance
      await this.trackRAGPerformance(
        query,
        responseTime,
        false,
        vectorStoreIds,
        'gpt-4o-mini',
        undefined,
        errorMessage,
        userId,
        'document_search'
      );

      // Cleanup on error - only delete thread, keep assistant for reuse
      try {
        if (threadId) await openai.beta.threads.del(threadId).catch(() => {});
        // Don't delete assistant on error - it might still be valid for reuse
      } catch (cleanupError) {
        // Ignore cleanup errors
      }

      // Fallback to simple search if Assistants API fails
      console.log('🔄 Falling back to simple search...');
      return this.fallbackSearch(query, vectorStoreIds);
    }
  }

  /**
   * Fallback search method when Assistants API is unavailable
   * Fast, simple search without vector store overhead
   * OPTIMIZATION: Even faster for first requests
   */
  private static async fallbackSearch(
    query: string,
    vectorStoreIds: string[]
  ): Promise<any[]> {
    const fallbackStartTime = Date.now();
    try {
      // OPTIMIZATION: Check if this is a first request (no cached assistant)
      const isFirstRequest = !getCachedAssistant(vectorStoreIds || []);
      const timeoutMs = isFirstRequest ? 3000 : 5000; // 3s for first request, 5s for subsequent
      const maxTokens = isFirstRequest ? 400 : 600; // Fewer tokens for faster response
      
      if (isFirstRequest) {
        console.log('⚡ Fast mode: Using optimized fallback (3s timeout, 400 tokens)');
      }
      
      // Use Promise.race with timeout for fast fallback
      const searchPromise = openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `Based on the MSME Knowledge Base, answer: ${query}
            
            Provide a concise, helpful response. If specific information isn't available, provide general guidance.`,
          },
        ],
        max_tokens: maxTokens, // Reduced for faster response
        temperature: 0.3,
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Fallback search timeout')), timeoutMs)
      );

      const response = await Promise.race([searchPromise, timeoutPromise]) as any;
      
      const fallbackTime = Date.now() - fallbackStartTime;
      console.log(`✅ Fallback search completed in ${fallbackTime}ms`);
      
      return [{
        content: response.choices[0]?.message?.content || '',
        model: 'gpt-4o-mini',
        fallback: true,
      }];
    } catch (error: any) {
      const fallbackTime = Date.now() - fallbackStartTime;
      if (error.message?.includes('timeout')) {
        console.warn(`⏰ Fallback search timeout after ${fallbackTime}ms, returning empty results`);
      } else {
        console.error(`Fallback search failed after ${fallbackTime}ms:`, error);
      }
      return [];
    }
  }

  /**
   * Search for template documents using RAG
   * Specifically searches for documents marked as templates
   */
  static async searchTemplateDocumentsWithRAG(
    query: string,
    vectorStoreIds: string[],
    templateType: 'dpr' | 'scheme' | 'guidelines' | 'policy' | 'other' = 'dpr',
    maxResults: number = 5,
    userId?: string
  ): Promise<any[]> {
    const startTime = Date.now();
    try {
      const { Document } = await import('../models/Document.model');
      
      // First, find documents marked as templates
      const templateDocuments = await Document.find({
        'metadata.isTemplate': true,
        'metadata.templateType': templateType,
        status: 'ready',
      }).select('_id originalName metadata vectorStoreId openaiFileId filePath');

      if (templateDocuments.length === 0) {
        console.log('No template documents found');
        return [];
      }

      console.log(`📋 Found ${templateDocuments.length} template documents of type: ${templateType}`);

      // Read template document contents (async for better performance)
      const templateContents = await Promise.all(
        templateDocuments.map(async (doc: any) => {
          try {
            // Try to read file content asynchronously
            if (doc.filePath && fs.existsSync(doc.filePath)) {
              const content = await readFileAsync(doc.filePath, 'utf8');
              return {
                documentId: doc._id.toString(),
                documentName: doc.originalName,
                content: content.substring(0, 50000), // Limit content size
                filePath: doc.filePath,
                openaiFileId: doc.openaiFileId,
              };
            }
            return null;
          } catch (error) {
            console.error(`Error reading template file ${doc.filePath}:`, error);
            return null;
          }
        })
      );

      // Filter out null results
      const validTemplates = templateContents.filter((t: any) => t !== null);

      if (validTemplates.length === 0) {
        console.log('No valid template content found');
        // Fallback to RAG search
        const enhancedQuery = `${query}. Focus specifically on DPR template structure, required sections, fields, and format.`;
        const searchResults = await this.searchDocumentsWithRAG(
          enhancedQuery,
          vectorStoreIds,
          maxResults,
          userId
        );
        
        const responseTime = Date.now() - startTime;
        await this.trackRAGPerformance(
          query,
          responseTime,
          true,
          vectorStoreIds,
          'gpt-4o-mini',
          undefined,
          undefined,
          userId,
          'template_search'
        );
        
        return searchResults.map((result: any) => ({
          ...result,
          isTemplate: true,
          templateType,
        }));
      }

      // Use AI to extract relevant sections from template documents
      const templateContext = validTemplates
        .map((t: any) => `[${t.documentName}]:\n${t.content.substring(0, 10000)}\n`)
        .join('\n---\n\n');

      // Use AI to search and extract relevant template structure
      const searchPrompt = `${query}

Available Template Documents:
${templateContext}

Extract the most relevant template structure, sections, and fields from these documents. Focus on:
1. Complete section structure
2. Required fields and their types
3. Field descriptions and requirements
4. Format and layout guidelines

Return the extracted template structure information.`;

      const searchResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a DPR template extraction specialist. Extract complete template structures from documents.',
          },
          {
            role: 'user',
            content: searchPrompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 3000,
      });

      const extractedContent = searchResponse.choices[0]?.message?.content || '';

      const responseTime = Date.now() - startTime;
      
      // Track performance
      await this.trackRAGPerformance(
        query,
        responseTime,
        true,
        vectorStoreIds,
        'gpt-4o',
        searchResponse.usage?.total_tokens,
        undefined,
        userId,
        'template_search'
      );

      // Return results with template metadata
      return validTemplates.map((template: any) => ({
        content: extractedContent,
        isTemplate: true,
        templateType,
        documentName: template.documentName,
        documentId: template.documentId,
        file_id: template.openaiFileId,
      }));
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error.message || 'Unknown error';
      
      console.error(`❌ Template search error (${responseTime}ms):`, errorMessage);
      
      // Track failed performance
      await this.trackRAGPerformance(
        query,
        responseTime,
        false,
        vectorStoreIds,
        'gpt-4o',
        undefined,
        errorMessage,
        userId,
        'template_search'
      );
      
      return [];
    }
  }

  /**
   * Extract template structure from RAG search results
   */
  static async extractTemplateStructureFromRAG(
    ragResults: any[],
    templateType: 'dpr' = 'dpr'
  ): Promise<{
    sections: Array<{
      name: string;
      fields: Array<{
        name: string;
        type: 'text' | 'number' | 'date' | 'select' | 'textarea';
        required: boolean;
        options?: string[];
        description?: string;
      }>;
      order: number;
    }>;
    totalSections: number;
    estimatedTime: string;
    sourceDocuments: string[];
  }> {
    try {
      // Combine all RAG results into a single context
      const combinedContext = ragResults
        .map((result: any, index: number) => {
          const docName = result.documentName || `Template ${index + 1}`;
          return `[${docName}]:\n${result.content || ''}\n`;
        })
        .join('\n---\n\n');

      const prompt = `Analyze the following DPR template documents and extract their complete structure:

${combinedContext}

Extract and return a JSON object with:
1. sections: Array of all sections with their fields
   - Each section should have: name, fields array, order number
   - Each field should have: name, type (text/number/date/select/textarea), required (boolean), options (if select type), description
2. totalSections: Total number of sections
3. estimatedTime: Estimated time to complete (e.g., "15-20 minutes")
4. sourceDocuments: Array of document names used

IMPORTANT:
- Extract ALL sections and fields from the templates
- Identify required vs optional fields
- For select fields, extract all available options
- Provide clear descriptions for each field
- Return only valid JSON without markdown formatting`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a DPR template analysis specialist. Extract complete template structures accurately. Return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 3000,
      });

      const content = response.choices[0]?.message?.content || '{}';
      
      // Clean the response to ensure valid JSON
      const cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const structure = JSON.parse(cleanedContent);
      
      // Add source documents
      structure.sourceDocuments = ragResults.map((r: any) => r.documentName || 'Unknown');
      
      console.log(`📋 Template Structure Extracted: ${structure.totalSections} sections from ${structure.sourceDocuments.length} documents`);
      return structure;
    } catch (error) {
      console.error('Error extracting template structure from RAG:', error);
      throw new Error('Failed to extract template structure from RAG results');
    }
  }

  /**
   * Generate context-specific questions based on template structure
   */
  static async generateContextSpecificQuestions(
    templateStructure: any,
    currentStep: number,
    userResponses: Record<string, any> = {},
    ragContext?: string
  ): Promise<{
    currentStep: number;
    totalSteps: number;
    currentSection: string;
    questions: Array<{
      id: string;
      question: string;
      type: 'text' | 'number' | 'date' | 'select' | 'textarea';
      required: boolean;
      options?: string[];
      placeholder?: string;
      helpText?: string;
    }>;
    progress: number;
    nextAction: string;
  }> {
    try {
      const currentSectionData = templateStructure.sections[currentStep - 1];
      if (!currentSectionData) {
        throw new Error('Invalid step number');
      }

      // Use AI to generate context-specific questions based on template and previous responses
      const prompt = `Based on this DPR template structure and user's previous responses, generate context-specific questions for section "${currentSectionData.name}":

Template Section: ${JSON.stringify(currentSectionData, null, 2)}
Previous User Responses: ${JSON.stringify(userResponses, null, 2)}
${ragContext ? `\nRelevant Template Context:\n${ragContext}` : ''}

Generate questions that:
1. Are aligned with the template structure
2. Are contextually relevant based on previous responses
3. Are clear and easy to understand
4. Include helpful guidance based on the template format

For each field in the section, create a question that:
- Uses the field description from the template
- Provides context from previous responses if relevant
- Includes helpful examples or guidance from the template
- Is phrased naturally in conversation

Return a JSON object with the questions array, where each question has:
- id: field name in snake_case
- question: context-specific question text
- type: field type
- required: boolean
- options: array if select type
- placeholder: helpful placeholder text
- helpText: additional guidance from template

Return only valid JSON without markdown formatting.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a DPR creation assistant. Generate context-specific, helpful questions based on template structure. Return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const questionData = JSON.parse(cleanedContent);
      
      const progress = Math.round((currentStep / templateStructure.totalSections) * 100);
      const nextAction = currentStep === templateStructure.totalSections ? 'Generate DPR' : 'Continue to next section';

      return {
        currentStep,
        totalSteps: templateStructure.totalSections,
        currentSection: currentSectionData.name,
        questions: questionData.questions || currentSectionData.fields.map((field: any) => ({
          id: field.name.toLowerCase().replace(/\s+/g, '_'),
          question: field.description || `Please provide ${field.name}`,
          type: field.type,
          required: field.required,
          options: field.options,
          placeholder: `Enter ${field.name.toLowerCase()}`,
          helpText: field.description,
        })),
        progress,
        nextAction,
      };
    } catch (error) {
      console.error('Error generating context-specific questions:', error);
      // Fallback to basic question generation
      return this.generateDPRQuestionnaire(templateStructure, currentStep, userResponses);
    }
  }

  /**
   * Convert chat responses to stepData structure (same as AI-Guided DPR Builder)
   * This ensures projects created from chat use the same template structure
   */
  static convertChatResponsesToStepData(responses: Record<string, any>): any {
    const stepData: any = {};

    // Map basic project information to businessOverview
    if (responses.projectName || responses.name) {
      stepData.businessOverview = {
        projectName: responses.projectName || responses.name,
        industrySector: responses.industrySector || responses.industry || responses.sector,
        projectType: responses.projectType || responses.type,
        location: responses.location || responses.address,
        businessDescription: responses.businessDescription || responses.description,
      };
    }

    // Map applicant information
    if (responses.sponsoringAgency || responses.gender || responses.categories) {
      stepData.applicantInfo = {
        sponsoringAgency: responses.sponsoringAgency,
        gender: responses.gender,
        locationType: responses.locationType || responses.location_type,
        categories: Array.isArray(responses.categories) 
          ? responses.categories 
          : responses.categories ? responses.categories.split(',').map((c: string) => c.trim()) : [],
        projectType: responses.projectType || responses.type,
        legalStatus: responses.legalStatus || responses.legal_status,
      };
    }

    // Map building details
    if (responses.buildingDetails || responses.building) {
      stepData.buildingDetails = Array.isArray(responses.buildingDetails) 
        ? responses.buildingDetails 
        : responses.building ? [responses.building] : [];
    }

    // Map machinery details
    if (responses.machineryDetails || responses.machinery) {
      stepData.machineryDetails = Array.isArray(responses.machineryDetails)
        ? responses.machineryDetails
        : responses.machinery ? [responses.machinery] : [];
    }

    // Map cost structure
    if (responses.totalInvestment || responses.totalCost || responses.capex || responses.opex) {
      const totalInvestment = parseFloat(
        (responses.totalInvestment || responses.totalCost || '0').toString().replace(/[₹,\s]/g, '')
      );
      const landBuilding = parseFloat(
        (responses.landBuilding || responses.land_cost || responses.buildingCost || '0').toString().replace(/[₹,\s]/g, '')
      );
      const machinery = parseFloat(
        (responses.machineryCost || responses.machinery || '0').toString().replace(/[₹,\s]/g, '')
      );
      const rawMaterials = parseFloat(
        (responses.rawMaterialsCost || responses.rawMaterials || '0').toString().replace(/[₹,\s]/g, '')
      );
      const salaries = parseFloat(
        (responses.salariesCost || responses.salaries || responses.wages || '0').toString().replace(/[₹,\s]/g, '')
      );

      stepData.costStructure = {
        capex: {
          landBuilding: landBuilding > 0 ? landBuilding.toString() : (responses.capex?.landBuilding || '0'),
          machinery: machinery > 0 ? machinery.toString() : (responses.capex?.machinery || '0'),
        },
        opex: {
          rawMaterials: rawMaterials > 0 ? rawMaterials.toString() : (responses.opex?.rawMaterials || '0'),
          salaries: salaries > 0 ? salaries.toString() : (responses.opex?.salaries || '0'),
        },
      };
    }

    // Map market analysis
    if (responses.targetMarket || responses.market) {
      stepData.marketAnalysis = {
        targetMarket: responses.targetMarket || responses.market,
        competitorAnalysis: responses.competitorAnalysis || responses.competitors,
      };
    }

    // Map beneficiary information
    if (responses.fullName || responses.name || responses.email || responses.mobile) {
      stepData.beneficiaryInfo = {
        fullName: responses.fullName || responses.name,
        fatherSpouseName: responses.fatherSpouseName || responses.father_name,
        address: responses.address || responses.location,
        email: responses.email,
        mobile: responses.mobile || responses.phone,
        educationalQualifications: responses.educationalQualifications || responses.qualifications,
        experience: responses.experience,
      };
    }

    // Map financial projections if provided
    if (responses.financialProjections || responses.revenue || responses.costs) {
      stepData.financialProjections = responses.financialProjections || {
        year1: {
          revenue: responses.revenue?.year1 || responses.revenue || '0',
          costs: responses.costs?.year1 || responses.costs || '0',
          profit: '0',
        },
        year2: {
          revenue: responses.revenue?.year2 || '0',
          costs: responses.costs?.year2 || '0',
          profit: '0',
        },
        year3: {
          revenue: responses.revenue?.year3 || '0',
          costs: responses.costs?.year3 || '0',
          profit: '0',
        },
        year4: {
          revenue: responses.revenue?.year4 || '0',
          costs: responses.costs?.year4 || '0',
          profit: '0',
        },
        year5: {
          revenue: responses.revenue?.year5 || '0',
          costs: responses.costs?.year5 || '0',
          profit: '0',
        },
      };
    }

    // Map eligible schemes
    if (responses.selectedSchemes || responses.schemes) {
      stepData.eligibleSchemes = {
        selectedSchemes: Array.isArray(responses.selectedSchemes)
          ? responses.selectedSchemes
          : responses.schemes ? (Array.isArray(responses.schemes) ? responses.schemes : [responses.schemes]) : [],
      };
    }

    // Map other fields if they exist in responses
    if (responses.rawMaterials) {
      stepData.rawMaterials = Array.isArray(responses.rawMaterials)
        ? responses.rawMaterials
        : [{ particulars: responses.rawMaterials }];
    }

    if (responses.salesDetails || responses.sales) {
      stepData.salesDetails = Array.isArray(responses.salesDetails)
        ? responses.salesDetails
        : responses.sales ? [responses.sales] : [];
    }

    if (responses.wages) {
      stepData.wages = Array.isArray(responses.wages) ? responses.wages : [responses.wages];
    }

    if (responses.salaryDetails || responses.salaries) {
      stepData.salaryDetails = Array.isArray(responses.salaryDetails)
        ? responses.salaryDetails
        : responses.salaries ? [responses.salaries] : [];
    }

    if (responses.otherCapitalCosts) {
      stepData.otherCapitalCosts = responses.otherCapitalCosts;
    }

    if (responses.financing) {
      stepData.financing = responses.financing;
    }

    if (responses.workingCapitalEstimate) {
      stepData.workingCapitalEstimate = responses.workingCapitalEstimate;
    }

    if (responses.powerEstimate) {
      stepData.powerEstimate = responses.powerEstimate;
    }

    if (responses.overheadExpenses) {
      stepData.overheadExpenses = responses.overheadExpenses;
    }

    if (responses.financialParameters) {
      stepData.financialParameters = responses.financialParameters;
    }

    if (responses.projectAtGlance) {
      stepData.projectAtGlance = responses.projectAtGlance;
    }

    return stepData;
  }
}

