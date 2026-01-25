// @ts-nocheck
import OpenAI from 'openai';
import { DPRVersion } from '../models/DPRVersion.model';
import { Project } from '../models/Project.model';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required.');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class ClusterDPRService {
  /**
   * Enhance cluster DPR data using OpenAI
   */
  static async enhanceClusterDPRData(clusterData: any): Promise<any> {
    try {
      const prompt = `You are an expert DPR (Detailed Project Report) generation engine for Cluster Development Projects.

Your task is to enhance and expand the provided cluster data into a comprehensive, professional, government-ready DPR document following the exact structure of government DPRs for Micro Cluster Development Programme.

The user has provided the following cluster information:

${JSON.stringify(clusterData, null, 2)}

Please generate a complete, professional DPR document matching the standard government DPR format with the following structure:

COVER PAGE:
- Title: "DETAILED PROJECT REPORT"
- Subtitle: "On Establishment of Common Facility Centre for [Cluster Name] under 'Micro Cluster Development Programme'"
- Submitted to: [Agency]
- Submitted by: [SPV Name]
- Prepared by: [Prepared by]

TABLE OF CONTENTS:
- Executive Summary (i-iv)
- 1. Introduction (1)
- 2. Cluster Profile (3)
- 3. Cluster value chain mapping (11)
- 4. Market Aspects (19)
- 5. SWOT Analysis (25)
- 6. Need Gap Analysis (26)
- 7. CFC - Operation & Management (27)
- 8. SPV Member Units (43)
- 9. Project Cost & Means Of Finance (49)
- 10. Financial viability (50)
- 11. Expected Impact (53)
- Financial Statements (54-68)

PROJECT SNAPSHOT:
- Name of the cluster
- Location & Spread
- Product range
- Existing cluster scenario (table)
- Existing employment
- SPV details
- Key concern areas
- Project rationale
- Proposed interventions

For each section:
- Use the provided data as the foundation
- Expand and enhance with professional, formal language suitable for government submissions
- Add relevant context, justifications, and explanations based on industry best practices
- Ensure consistency and completeness
- Use formal, professional tone throughout
- Include detailed narratives that connect data points logically
- Add appropriate justifications and explanations
- Ensure each section is comprehensive and government-ready

Return a JSON object with this structure:
{
  "coverPage": "Full cover page content",
  "tableOfContents": "Table of contents",
  "sections": {
    "introduction": "Comprehensive introduction section with sector overview, national and state importance",
    "clusterProfile": "Detailed cluster profile with evolution, present status, and unit details",
    "valueChain": "Complete value chain mapping with stages, raw materials, and value addition",
    "marketAssessment": "Comprehensive market aspects including demand-supply, competition, price trends, export potential",
    "swotAnalysis": "Detailed SWOT analysis with all four quadrants",
    "gapAnalysis": "Comprehensive gap analysis with justification for intervention",
    "cfcDetails": "Detailed CFC operation and management including location, machinery, process, capacity",
    "spvDetails": "Complete SPV member units information",
    "projectCost": "Detailed project cost breakdown",
    "financialViability": "Comprehensive financial viability with P&L, cash flow, balance sheet projections, break-even, IRR, NPV",
    "expectedImpact": "Detailed expected impact with quantified outcomes",
    "conclusion": "Professional conclusion summarizing the project rationale and expected benefits"
  },
  "metadata": {
    "totalPages": 50,
    "wordCount": 15000,
    "sectionsCount": 11
  }
}

Return only valid JSON without markdown code blocks.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert DPR writer specializing in Cluster Development Projects for government submissions. Generate comprehensive, professional, and detailed project reports.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 8000,
      });

      const content = response.choices[0]?.message?.content || '{}';
      
      // Clean up the response
      let cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Try to parse JSON
      let enhancedDPR;
      try {
        enhancedDPR = JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error('Error parsing OpenAI response:', parseError);
        // Fallback: create a basic structure
        enhancedDPR = this.createFallbackDPR(clusterData);
      }

      return enhancedDPR;
    } catch (error: any) {
      console.error('Error enhancing cluster DPR with OpenAI:', error);
      // Return fallback DPR if OpenAI fails
      return this.createFallbackDPR(clusterData);
    }
  }

  /**
   * Create fallback DPR if OpenAI fails
   */
  private static createFallbackDPR(clusterData: any): any {
    return {
      coverPage: `# DETAILED PROJECT REPORT\n\n## ${clusterData.step1?.clusterName || 'Cluster Development Project'}\n\n### ${clusterData.step1?.district || 'District'}, ${clusterData.step1?.location || 'Location'}\n\n---\n\n**Prepared by:** ${clusterData.step11?.spvName || 'SPV Name'}\n**Date:** ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}\n\n---\n\n*This Detailed Project Report has been prepared in accordance with the guidelines for Cluster Development Projects.*`,
      tableOfContents: `# Table of Contents\n\n1. Executive Summary – Basic Cluster Details\n2. Introduction & Sector Overview\n3. District & Regional Profile\n4. Cluster Profile\n5. Value Chain Details\n6. Market Assessment\n7. Gap Analysis\n8. SWOT Analysis\n9. Proposed Interventions\n10. Common Facility Centre (CFC) Details\n11. SPV Details\n12. Project Cost Details\n13. Means of Finance\n14. Operating Cost & Revenue\n15. Financial Viability\n16. Project Implementation Schedule\n17. Expected Impact\n18. Annexures & Document Uploads`,
      sections: {
        executiveSummary: this.generateSectionContent(clusterData, 1),
        introduction: this.generateSectionContent(clusterData, 2),
        districtProfile: this.generateSectionContent(clusterData, 3),
        clusterProfile: this.generateSectionContent(clusterData, 4),
        valueChain: this.generateSectionContent(clusterData, 5),
        marketAssessment: this.generateSectionContent(clusterData, 6),
        gapAnalysis: this.generateSectionContent(clusterData, 7),
        swotAnalysis: this.generateSectionContent(clusterData, 8),
        proposedInterventions: this.generateSectionContent(clusterData, 9),
        cfcDetails: this.generateSectionContent(clusterData, 10),
        spvDetails: this.generateSectionContent(clusterData, 11),
        projectCost: this.generateSectionContent(clusterData, 12),
        meansOfFinance: this.generateSectionContent(clusterData, 13),
        operatingCostRevenue: this.generateSectionContent(clusterData, 14),
        financialViability: this.generateSectionContent(clusterData, 15),
        implementationSchedule: this.generateSectionContent(clusterData, 16),
        expectedImpact: this.generateSectionContent(clusterData, 17),
        annexures: this.generateSectionContent(clusterData, 18),
      },
      metadata: {
        totalPages: 40,
        wordCount: 10000,
        sectionsCount: 18,
      },
    };
  }

  /**
   * Generate basic section content from cluster data
   */
  private static generateSectionContent(clusterData: any, step: number): string {
    const stepData = clusterData[`step${step}` as keyof typeof clusterData];
    if (!stepData) {
      return `Section ${step} content will be generated based on provided data.`;
    }

    // Basic content generation (can be enhanced)
    return JSON.stringify(stepData, null, 2);
  }

  /**
   * Generate and save Cluster DPR
   */
  static async generateClusterDPR(
    userId: string,
    clusterData: any,
    language: 'english' | 'telugu' | 'bilingual' = 'bilingual'
  ): Promise<any> {
    try {
      // Enhance data using OpenAI
      console.log('🤖 Enhancing cluster DPR data with OpenAI...');
      const enhancedDPR = await this.enhanceClusterDPRData(clusterData);

      // Create or find a project for this cluster DPR
      let project = await Project.findOne({
        userId,
        projectName: clusterData.step1?.clusterName || 'Cluster DPR',
        projectType: 'cluster',
      });

      // Calculate total cost from step 12 if available
      const totalCost = clusterData.step12
        ? (clusterData.step12.land || 0) +
          (clusterData.step12.building || 0) +
          (clusterData.step12.machinery || 0) +
          (clusterData.step12.utilitiesAndInfrastructure || 0) +
          (clusterData.step12.preliminaryAndPreOperative || 0) +
          (clusterData.step12.workingCapitalMargin || 0)
        : 0;

      // Calculate own contribution from step 13 if available
      const ownContribution = clusterData.step13?.spvContribution || 0;
      const loanAmount = clusterData.step13?.bankLoan || 0;

      if (!project) {
        project = await Project.create({
          userId,
          projectName: clusterData.step1?.clusterName || 'Cluster DPR',
          industrySector: clusterData.step2?.sectorType || 'Cluster Development',
          location: clusterData.step1?.location || '',
          district: clusterData.step1?.district || '',
          projectType: 'cluster',
          totalCost: totalCost || 100000, // Default to 1 lakh if not provided
          ownContribution: ownContribution || 0,
          loanAmount: loanAmount || 0,
          status: 'completed',
          stepData: clusterData,
        });
      } else {
        // Update existing project
        project.stepData = clusterData;
        project.totalCost = totalCost || project.totalCost || 100000;
        project.ownContribution = ownContribution || project.ownContribution || 0;
        project.loanAmount = loanAmount || project.loanAmount || 0;
        project.status = 'completed';
        await project.save();
      }

      // Create DPR version with proper structure
      // Store cluster-specific sections as additional keys in content
      const dprVersion = await DPRVersion.create({
        projectId: project._id.toString(),
        userId,
        versionNumber: 1,
        status: 'draft',
        content: {
          english: {
            executiveSummary: enhancedDPR.sections?.executiveSummary || '',
            businessProfile: enhancedDPR.sections?.introduction || '',
            marketAnalysis: enhancedDPR.sections?.marketAssessment || '',
            technicalFeasibility: enhancedDPR.sections?.cfcDetails || '',
            financialProjections: enhancedDPR.sections?.financialViability || '',
            conclusion: enhancedDPR.sections?.expectedImpact || '',
            eligibleSchemes: '',
            // Store cluster-specific sections
            coverPage: enhancedDPR.coverPage || '',
            tableOfContents: enhancedDPR.tableOfContents || '',
            districtProfile: enhancedDPR.sections?.districtProfile || '',
            clusterProfile: enhancedDPR.sections?.clusterProfile || '',
            valueChain: enhancedDPR.sections?.valueChain || '',
            gapAnalysis: enhancedDPR.sections?.gapAnalysis || '',
            swotAnalysis: enhancedDPR.sections?.swotAnalysis || '',
            proposedInterventions: enhancedDPR.sections?.proposedInterventions || '',
            cfcDetails: enhancedDPR.sections?.cfcDetails || '',
            spvDetails: enhancedDPR.sections?.spvDetails || '',
            projectCost: enhancedDPR.sections?.projectCost || '',
            meansOfFinance: enhancedDPR.sections?.meansOfFinance || '',
            operatingCostRevenue: enhancedDPR.sections?.operatingCostRevenue || '',
            implementationSchedule: enhancedDPR.sections?.implementationSchedule || '',
            annexures: enhancedDPR.sections?.annexures || '',
            isClusterDPR: true,
            clusterData: clusterData,
          },
          telugu: {
            executiveSummary: enhancedDPR.sections?.executiveSummary || '',
            businessProfile: enhancedDPR.sections?.introduction || '',
            marketAnalysis: enhancedDPR.sections?.marketAssessment || '',
            technicalFeasibility: enhancedDPR.sections?.cfcDetails || '',
            financialProjections: enhancedDPR.sections?.financialViability || '',
            conclusion: enhancedDPR.sections?.expectedImpact || '',
            eligibleSchemes: '',
            // Store cluster-specific sections
            coverPage: enhancedDPR.coverPage || '',
            tableOfContents: enhancedDPR.tableOfContents || '',
            districtProfile: enhancedDPR.sections?.districtProfile || '',
            clusterProfile: enhancedDPR.sections?.clusterProfile || '',
            valueChain: enhancedDPR.sections?.valueChain || '',
            gapAnalysis: enhancedDPR.sections?.gapAnalysis || '',
            swotAnalysis: enhancedDPR.sections?.swotAnalysis || '',
            proposedInterventions: enhancedDPR.sections?.proposedInterventions || '',
            cfcDetails: enhancedDPR.sections?.cfcDetails || '',
            spvDetails: enhancedDPR.sections?.spvDetails || '',
            projectCost: enhancedDPR.sections?.projectCost || '',
            meansOfFinance: enhancedDPR.sections?.meansOfFinance || '',
            operatingCostRevenue: enhancedDPR.sections?.operatingCostRevenue || '',
            implementationSchedule: enhancedDPR.sections?.implementationSchedule || '',
            annexures: enhancedDPR.sections?.annexures || '',
            isClusterDPR: true,
            clusterData: clusterData,
          },
        },
        financials: {
          projectCost: clusterData.step12 || {},
          meansOfFinance: clusterData.step13 || {},
          profitLoss: clusterData.step15?.profitAndLossProjections || [],
          cashFlow: clusterData.step15?.cashFlowProjections || [],
          balanceSheet: clusterData.step15?.balanceSheetProjections || [],
          ratios: {
            breakEvenPoint: clusterData.step15?.breakEvenPoint || 0,
            irr: clusterData.step15?.irr || 0,
            npv: clusterData.step15?.npv || 0,
          },
        },
        language,
        generatedAt: new Date(),
      });

      console.log(`✅ Cluster DPR generated and saved: ${dprVersion._id} for project ${project._id}`);

      return {
        dprId: dprVersion._id,
        projectId: project._id,
        content: enhancedDPR,
        generatedAt: dprVersion.generatedAt,
        status: dprVersion.status,
      };
    } catch (error: any) {
      console.error('Error generating cluster DPR:', error);
      throw new Error(`Failed to generate cluster DPR: ${error.message}`);
    }
  }
}
