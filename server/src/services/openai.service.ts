import OpenAI from 'openai';
import { IProject } from '../types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
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
   * Generate AI chat response
   */
  static async chatResponse(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<string> {
    try {
      const messages: any[] = [
        {
          role: 'system',
          content: `You are an MSME AI DPR Assistant helping Indian entrepreneurs create Detailed Project Reports. 
          You guide users through data collection, provide sector insights, suggest government schemes, and answer questions about DPR creation.
          Be helpful, professional, and supportive. Keep responses concise and actionable.`,
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
        temperature: 0.8,
        max_tokens: 500,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error in chat response:', error);
      throw new Error('Failed to generate chat response');
    }
  }
}

