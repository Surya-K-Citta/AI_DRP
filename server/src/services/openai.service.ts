import OpenAI from 'openai';
import { IProject } from '../types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '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',
});

export class OpenAIService {
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

      return response.choices[0].message.content || '';
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
   * Generate AI chat response with enhanced DPR guidance
   */
  static async chatResponse(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }> = [],
    userContext?: any
  ): Promise<{ response: string; suggestions?: any; nextSteps?: string[] }> {
    try {
      const systemPrompt = `You are an expert MSME AI DPR Assistant specializing in helping Indian entrepreneurs create bank-ready Detailed Project Reports. 

Your capabilities include:
1. Step-by-step DPR guidance through all sections
2. Financial data auto-suggestions based on industry benchmarks
3. Government scheme recommendations (AP MSME ONE Portal compatible)
4. Sector-specific insights and cost structures
5. Bank approval optimization strategies
6. Telugu and English language support

Guidance Framework:
- Always provide actionable next steps
- Suggest specific financial figures based on industry data
- Recommend relevant government schemes
- Ensure bank-ready quality standards
- Provide both English and Telugu responses when requested

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
        nextSteps
      };
    } catch (error) {
      console.error('Error in chat response:', error);
      throw new Error('Failed to generate chat response');
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
}

