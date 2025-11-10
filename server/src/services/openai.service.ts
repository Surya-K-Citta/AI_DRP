import OpenAI from 'openai';
import { IProject } from '../types';
import { VectorStore } from '../models/VectorStore.model';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';

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
          Create a comprehensive Executive Summary for an MSME DPR with the following details:
          Project Name: ${projectData.projectName}
          Industry Sector: ${projectData.industrySector}
          Project Type: ${projectData.projectType}
          Total Investment: ₹${projectData.totalCost}
          Loan Amount: ₹${projectData.loanAmount}
          Location: ${projectData.location}
          
          Include:
          - Brief overview of the business
          - Key objectives and goals
          - Financial highlights
          - Expected outcomes and benefits
          
          ${languageInstruction}
          Format: Professional, concise, and bankable.
        `,
        businessProfile: `
          Create a detailed Business Profile section for:
          Project: ${projectData.projectName}
          Sector: ${projectData.industrySector}
          Description: ${projectData.inputs.businessDescription || 'Not provided'}
          Location: ${projectData.location}
          
          Include:
          - Business concept and vision
          - Products/Services offered
          - Unique selling proposition
          - Entrepreneur background (if available)
          - Business structure
          
          ${languageInstruction}
        `,
        marketAnalysis: `
          Generate a Market Analysis section for:
          Project: ${projectData.projectName}
          Sector: ${projectData.industrySector}
          Target Market: ${projectData.inputs.targetMarket || 'To be defined'}
          Location: ${projectData.location}
          
          Include:
          - Market size and potential
          - Target customer segments
          - Competitive landscape
          - Market trends and opportunities
          - Demand-supply gap analysis
          - Marketing and sales strategy
          
          ${languageInstruction}
          Base on Indian MSME context and Andhra Pradesh/Telangana region if applicable.
        `,
        technicalFeasibility: `
          Create a Technical Feasibility section for:
          Project: ${projectData.projectName}
          Sector: ${projectData.industrySector}
          
          Machinery: ${JSON.stringify(projectData.inputs.machinery || [])}
          Raw Materials: ${JSON.stringify(projectData.inputs.rawMaterials || [])}
          Manpower: ${JSON.stringify(projectData.inputs.manpower || [])}
          Infrastructure: ${JSON.stringify(projectData.inputs.infrastructure || {})}
          
          Include:
          - Production process/Service delivery
          - Technology and equipment requirements
          - Raw material availability
          - Manpower planning
          - Infrastructure needs
          - Capacity utilization
          - Quality control measures
          
          ${languageInstruction}
        `,
        financialProjections: `
          Create a Financial Projections narrative for:
          Project: ${projectData.projectName}
          Total Cost: ₹${projectData.totalCost}
          Own Contribution: ₹${projectData.ownContribution}
          Loan Amount: ₹${projectData.loanAmount}
          
          Provide narrative explaining:
          - Project cost breakdown
          - Means of finance
          - Revenue assumptions
          - Profitability expectations
          - Break-even analysis
          - Debt servicing capacity (DSCR)
          - Return on investment
          
          ${languageInstruction}
          Note: Include tables will be generated separately.
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
          - Alignment with government schemes
          - Recommendation for approval
          
          ${languageInstruction}
          Tone: Confident, professional, and persuasive for bank approval.
        `,
      };

      const prompt = prompts[section] || prompts.executiveSummary;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert MSME consultant specializing in creating bankable Detailed Project Reports (DPRs) for Indian entrepreneurs. Generate professional, comprehensive, and lender-ready content.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
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
   * Generate complete DPR content
   */
  static async generateCompleteDPR(
    projectData: IProject,
    language: 'english' | 'telugu' | 'bilingual' = 'bilingual'
  ): Promise<any> {
    const sections = [
      'executiveSummary',
      'businessProfile',
      'marketAnalysis',
      'technicalFeasibility',
      'financialProjections',
      'conclusion',
    ];

    const content: any = {
      english: {},
      telugu: {},
    };

    // Generate English content
    if (language === 'english' || language === 'bilingual') {
      for (const section of sections) {
        content.english[section] = await this.generateDPRSection(
          section,
          projectData,
          'english'
        );
      }
    }

    // Generate Telugu content
    if (language === 'telugu' || language === 'bilingual') {
      for (const section of sections) {
        content.telugu[section] = await this.generateDPRSection(
          section,
          projectData,
          'telugu'
        );
      }
    }

    return content;
  }

  /**
   * Transcribe audio using Whisper API
   */
  static async transcribeAudio(audioFile: Buffer): Promise<string> {
    try {
      // Create a File object from buffer
      const file = new File([audioFile], 'audio.webm', { type: 'audio/webm' });
      
      const response = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: 'en', // Can be 'te' for Telugu
      });

      return response.text;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw new Error('Failed to transcribe audio');
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
    vectorStoreIds?: string[]
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
        return this.chatResponseWithRAG(userMessage, conversationHistory, userContext, vectorStoreIds, dprQuestions);
      }

      // Standard chat response
      const systemPrompt = `You are an expert MSME AI DPR Assistant specializing in helping Indian entrepreneurs create bank-ready Detailed Project Reports.

Your capabilities include:
1. Step-by-step DPR guidance through all sections using uploaded templates
2. Financial data auto-suggestions based on industry benchmarks
3. Government scheme recommendations (AP MSME ONE Portal compatible)
4. Sector-specific insights and cost structures
5. Bank approval optimization strategies
6. Telugu and English language support
7. Interactive DPR creation workflow using template structure

Guidance Framework:
- Always provide actionable next steps
- Suggest specific financial figures based on industry data
- Recommend relevant government schemes
- Ensure bank-ready quality standards
- Provide both English and Telugu responses when requested
- ALWAYS use uploaded DPR templates to guide users through DPR creation
- NEVER say "This information is not available in uploaded documents" when helping with DPR creation

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

      const messages: any[] = [
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

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 800,
      });

      const responseText = response.choices[0].message.content || '';

      // Extract suggestions and next steps using AI
      let suggestions = {};
      let nextSteps: string[] = [];

      try {
        suggestions = await this.extractSuggestions(userMessage, responseText, userContext);
      } catch (error) {
        console.error('Failed to extract suggestions, continuing without them:', error);
        suggestions = {};
      }

      try {
        nextSteps = await this.generateNextSteps(userMessage, responseText, userContext);
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
    } catch (error) {
      console.error('Error in chat response:', error);
      throw new Error('Failed to generate chat response');
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
    dprQuestions?: any
  ): Promise<{ response: string; suggestions?: any; nextSteps?: string[]; dprAction?: string; dprQuestions?: any; templateStructure?: any }> {
    try {
      if (!vectorStoreIds || vectorStoreIds.length === 0) {
        throw new Error('No vector stores available for RAG');
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

      // If user wants to create DPR, search for template documents using RAG
      if (wantsToCreateDPR) {
        console.log('🔍 Searching for DPR template documents using RAG...');
        console.log(`   Vector Stores: ${vectorStoreIds?.length || 0}`);
        
        // Search for template documents if vector stores are available
        let templateResults: any[] = [];
        if (vectorStoreIds && vectorStoreIds.length > 0) {
          templateResults = await this.searchTemplateDocumentsWithRAG(
            'DPR template structure, sections, fields, and format requirements',
            vectorStoreIds,
            'dpr',
            5
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
            // Convert to template results format
            templateResults = await Promise.all(
              templateDocs.map(async (doc: any) => {
                try {
                  if (doc.filePath && fs.existsSync(doc.filePath)) {
                    const content = fs.readFileSync(doc.filePath, 'utf8');
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
            templateResults = templateResults.filter((t: any) => t !== null);
          }
        }

        if (templateResults && templateResults.length > 0) {
          console.log(`✅ Found ${templateResults.length} template documents via RAG`);
          
          // Generate cache key from template document IDs
          const cacheKey = generateCacheKey(templateResults);
          
          // Check cache first
          const cachedStructure = getCachedTemplateStructure(cacheKey);
          if (cachedStructure) {
            templateStructure = cachedStructure;
            console.log(`⚡ Using cached template structure - no extraction needed!`);
          } else {
            // Extract template structure from RAG results
            try {
              console.log(`🔄 Extracting template structure from RAG (this may take a moment)...`);
              templateStructure = await this.extractTemplateStructureFromRAG(templateResults, 'dpr');
              
              // Store in cache for future use
              const sourceDocumentIds = templateResults
                .map((r: any) => r.documentId || r.openaiFileId || '')
                .filter((id: string) => id);
              setCachedTemplateStructure(cacheKey, templateStructure, sourceDocumentIds);
            } catch (error) {
              console.error('Error extracting template structure from RAG:', error);
              // Continue without template structure
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
        } else {
          console.log('⚠️  No template documents found via RAG. Will use database templates if available.');
        }
      }

      // First, search for relevant information using RAG
      const searchResults = await this.searchDocumentsWithRAG(
        userMessage,
        vectorStoreIds,
        3
      );

      // Build context from search results with document references
      let context = '';
      if (searchResults && searchResults.length > 0) {
        context = '📚 Knowledge Base Context (Unified Vector Store):\n\n';
        searchResults.forEach((result: any, index: number) => {
          if (result.content) {
            // Extract document reference if available
            const docRef = result.file_id ? `[Doc ID: ${result.file_id}]` : `[Source ${index + 1}]`;
            context += `${docRef}:\n${result.content}\n\n`;
          }
        });
        context += '---\nUse this knowledge base information to provide accurate, document-based guidance.\n\n';
      }

      // Prepend template context if available
      if (templateContext) {
        context = templateContext + context;
      }

      const systemPrompt = `You are an expert MSME AI DPR Assistant with access to uploaded documents and knowledge base.

IMPORTANT: Base your responses SOLELY on the provided document context and uploaded knowledge base. Do not use external knowledge or make up information.

${context ? context : 'No relevant documents found in the knowledge base.'}

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

Current Context: ${userContext ? JSON.stringify(userContext) : 'New user'}

Be professional, accurate, and base all responses on the uploaded document content.`;

      const messages: any[] = [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...conversationHistory.slice(-5), // Keep last 5 messages for context
        {
          role: 'user',
          content: userMessage,
        },
      ];

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.3, // Lower temperature for more factual responses
        max_tokens: 1000,
      });

      const responseText = response.choices[0].message.content || '';

      // Extract suggestions and next steps using AI (without RAG context)
      let suggestions = {};
      let nextSteps: string[] = [];

      try {
        suggestions = await this.extractSuggestions(userMessage, responseText, userContext);
      } catch (error) {
        console.error('Failed to extract suggestions, continuing without them:', error);
        suggestions = {};
      }

      try {
        nextSteps = await this.generateNextSteps(userMessage, responseText, userContext);
      } catch (error) {
        console.error('Failed to generate next steps, continuing without them:', error);
        nextSteps = [];
      }

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

      return {
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
    } catch (error) {
      console.error('Error in RAG chat response:', error);
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

      const suggestionResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
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
        max_tokens: 800,
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

      const stepsResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
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
        max_tokens: 400,
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
   * Search documents using RAG with OpenAI File Search
   * Uses the unified vector store as a knowledge graph for efficient retrieval
   */
  static async searchDocumentsWithRAG(
    query: string,
    vectorStoreIds: string[],
    maxResults: number = 5
  ): Promise<any[]> {
    try {
      // Ensure we're using the main MSME Knowledge Base vector store
      const mainVectorStoreId = process.env.MAIN_VECTOR_STORE_ID || ' ';
      const activeVectorStores = vectorStoreIds.includes(mainVectorStoreId) 
        ? vectorStoreIds 
        : [mainVectorStoreId, ...vectorStoreIds];

      console.log(`🔍 RAG Search: Querying unified knowledge base with ${activeVectorStores.length} vector stores`);
      console.log(`📚 Main Vector Store: ${mainVectorStoreId}`);

      // Use a simple chat completion for document search
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `Search the MSME Knowledge Base for: ${query}. 
            
            The knowledge base contains DPR templates, government schemes, financial guidelines, and sector-specific information.
            Return the most relevant information with document references and citations.
            
            Focus on:
            1. DPR structure and requirements
            2. Financial projections and cost estimates
            3. Government schemes and incentives
            4. Sector-specific benchmarks and guidelines
            5. Legal and compliance requirements`,
          },
        ],
        max_tokens: 1500,
      });

      const results = response.choices || [];
      console.log(`✅ RAG Search: Found ${results.length} relevant document sections`);
      
      return results;
    } catch (error) {
      console.error('Error searching documents with RAG:', error);
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
    maxResults: number = 5
  ): Promise<any[]> {
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

      // Read template document contents
      const templateContents = await Promise.all(
        templateDocuments.map(async (doc: any) => {
          try {
            // Try to read file content
            if (doc.filePath && fs.existsSync(doc.filePath)) {
              const content = fs.readFileSync(doc.filePath, 'utf8');
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
          maxResults
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

      // Return results with template metadata
      return validTemplates.map((template: any) => ({
        content: extractedContent,
        isTemplate: true,
        templateType,
        documentName: template.documentName,
        documentId: template.documentId,
        file_id: template.openaiFileId,
      }));
    } catch (error) {
      console.error('Error searching template documents with RAG:', error);
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
}

