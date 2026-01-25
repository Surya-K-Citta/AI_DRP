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
      // Ensure ALL stepData is included - log for debugging
      console.log('📊 Enhancing Cluster DPR with complete data:', {
        stepsAvailable: Object.keys(clusterData).filter(key => key.startsWith('step')).length,
        totalKeys: Object.keys(clusterData).length,
      });

      // Extract key data points for explicit use in prompt
      const clusterName = clusterData.step1?.clusterName || 'N/A';
      const district = clusterData.step1?.district || 'N/A';
      const location = clusterData.step1?.location || 'N/A';
      const spvName = clusterData.step11?.spvName || 'N/A';
      const submittedTo = clusterData.step11?.submittedTo || 'DIC, District';
      const majorProducts = clusterData.step1?.majorProducts || clusterData.step1?.productRange || 'N/A';
      const enterpriseCount = clusterData.step1?.enterpriseCount || {};
      const totalEnterprises = (enterpriseCount.micro || 0) + (enterpriseCount.small || 0) + (enterpriseCount.medium || 0);
      
      const prompt = `You are an expert DPR (Detailed Project Report) generation engine for Cluster Development Projects.

CRITICAL REQUIREMENT: Generate a COMPREHENSIVE, DETAILED DPR document with MINIMUM 30 PAGES. Each section must be extensively detailed, professional, and government-ready.

Your task is to enhance and expand the provided cluster data into a comprehensive, professional, government-ready DPR document following the exact structure of government DPRs for Micro Cluster Development Programme.

CRITICAL: You MUST use the EXACT VALUES from the data provided below. DO NOT use placeholders like "N/A", "[Cluster Name]", or generic values. Use the ACTUAL data values provided.

KEY DATA VALUES TO USE (REPLACE ALL PLACEHOLDERS WITH THESE EXACT VALUES):
- Cluster Name: "${clusterName}"
- District: "${district}"
- Location: "${location}"
- SPV Name: "${spvName}"
- Submitted To: "${submittedTo}"
- Major Products: "${majorProducts}"
- Total Enterprises: ${totalEnterprises}
- Micro Enterprises: ${enterpriseCount.micro || 0}
- Small Enterprises: ${enterpriseCount.small || 0}
- Medium Enterprises: ${enterpriseCount.medium || 0}

COMPLETE CLUSTER DATA PROVIDED (USE ALL OF THIS DATA - EVERY FIELD):

${JSON.stringify(clusterData, null, 2)}

CRITICAL INSTRUCTIONS:
1. **USE EXACT VALUES**: Replace ALL placeholders in the cover page, project snapshot, and all sections with the ACTUAL values from the data above
2. **NO GENERIC CONTENT**: Do not use "N/A", "[Cluster Name]", or any placeholders. Use the actual data values provided
3. **ALL DATA MUST BE USED**: Every field from step1 through step18 must be incorporated into the DPR
4. **PROJECT SNAPSHOT**: Must show actual values from step1, step4, step11, etc. - NOT placeholders
5. **COVER PAGE**: Must use actual cluster name, SPV name, location, and submitted to values
6. **TABLES**: All tables must use actual data values from the provided data, not zeros or N/A unless that's the actual value

Please generate a complete, professional DPR document matching the standard government DPR format with the following structure:

COVER PAGE (USE EXACT VALUES FROM DATA - NO PLACEHOLDERS):
- Title: "DETAILED PROJECT REPORT"
- Subtitle: "On Establishment of Common Facility Centre for ${clusterName} under 'Micro Cluster Development Programme'"
- Submitted to: ${submittedTo}
- Submitted by: ${spvName}
- Prepared by: ${spvName} (or use step11 data if available)

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

PROJECT SNAPSHOT (USE EXACT VALUES FROM DATA):
- Name of the cluster: "${clusterName}"
- Location & Spread: "${location}" (use step1.location and step1.geographicalSpread)
- Product range: "${majorProducts}" (use step1.majorProducts or step1.productRange)
- Existing cluster scenario (table): Use actual data from step4, step5, step6 - show actual production, units, turnover
- Existing employment: Use actual values from step1.employmentPerUnit and step1.enterpriseCount
- SPV details: Use actual values from step11 (spvName, legalStatus, memberUnits, etc.)
- Key concern areas: Use actual values from step7.gapAnalysis
- Project rationale: Use actual values from step7.justificationForIntervention
- Proposed interventions: Use actual values from step9

CRITICAL CONTENT REQUIREMENTS FOR 30+ PAGE DOCUMENT:

For each section, you MUST:
1. **Use ALL provided data** - Every field from step1 through step18 must be incorporated
2. **Expand extensively** - Each section should be 800-1200 words minimum
3. **Add detailed narratives** - Connect all data points with comprehensive explanations
4. **Include tables and structured data** - Format all numerical data, lists, and comparisons as markdown tables
5. **Add context and justifications** - Explain the significance of each data point
6. **Provide industry insights** - Add relevant industry context, benchmarks, and best practices
7. **Include detailed analysis** - Go beyond listing data - analyze, compare, and justify
8. **Use professional, formal language** - Suitable for government submissions
9. **Ensure completeness** - No data should be left out

SPECIFIC SECTION REQUIREMENTS:

- **Executive Summary**: 600-800 words, comprehensive overview covering all key aspects
- **Introduction**: 800-1000 words with sector overview, national and state importance, historical context
- **Cluster Profile**: 1000-1200 words with detailed evolution, present status, unit-by-unit analysis, employment details, investment patterns
- **Value Chain**: 1000-1200 words with complete mapping, all stages detailed, raw materials, value addition at each stage
- **Market Assessment**: 1000-1200 words with comprehensive demand-supply analysis, competition details, price trends, export potential, market size
- **SWOT Analysis**: 800-1000 words with detailed analysis of all four quadrants, strategic implications
- **Gap Analysis**: 800-1000 words with comprehensive gap identification, justification for intervention, detailed needs assessment
- **CFC Details**: 1000-1200 words with complete operation and management details, location specifics, machinery details, process flow, capacity analysis
- **SPV Details**: 800-1000 words with complete member units information, ownership structure, roles and responsibilities
- **Project Cost**: 800-1000 words with detailed breakdown, cost justification, comparison with industry standards
- **Financial Viability**: 1200-1500 words with comprehensive P&L analysis, cash flow projections, balance sheet, break-even analysis, IRR, NPV, sensitivity analysis
- **Expected Impact**: 800-1000 words with quantified outcomes, employment generation, income enhancement, cluster development impact
- **Conclusion**: 400-600 words summarizing project rationale and expected benefits

CRITICAL FORMATTING REQUIREMENTS:
- Cover Page MUST include: "DETAILED PROJECT REPORT\nOn Establishment of Common Facility Centre for ${clusterName} under 'Micro Cluster Development Programme'\nSubmitted to: ${submittedTo}\nSubmitted by: ${spvName}\nPrepared by: ${spvName}"
- Project Snapshot tables MUST use actual data values from step1, step4, step5, step6, step11
- All sections MUST reference actual data values, not placeholders

Return a JSON object with this structure:
{
  "coverPage": "Full cover page content with EXACT values: DETAILED PROJECT REPORT\nOn Establishment of Common Facility Centre for ${clusterName} under 'Micro Cluster Development Programme'\nSubmitted to: ${submittedTo}\nSubmitted by: ${spvName}\nPrepared by: ${spvName}",
  "tableOfContents": "Complete table of contents with page numbers",
  "sections": {
    "executiveSummary": "Comprehensive executive summary (600-800 words) covering all key aspects. MUST include actual cluster name: ${clusterName}, location: ${location}, district: ${district}, SPV: ${spvName}, and all key metrics from step1",
    "introduction": "Extensive introduction section (800-1000 words) with sector overview, national and state importance, historical context, and industry background",
    "clusterProfile": "Detailed cluster profile (1000-1200 words) with evolution, present status, unit-by-unit analysis, employment details, investment patterns, and comprehensive cluster characteristics",
    "valueChain": "Complete value chain mapping (1000-1200 words) with all stages detailed, raw materials, value addition at each stage, supply chain analysis, and value chain optimization opportunities",
    "marketAssessment": "Comprehensive market aspects (1000-1200 words) including detailed demand-supply analysis, competition details, price trends, export potential, market size, growth projections, and market entry strategy",
    "swotAnalysis": "Detailed SWOT analysis (800-1000 words) with all four quadrants extensively covered, strategic implications, and action plans",
    "gapAnalysis": "Comprehensive gap analysis (800-1000 words) with detailed gap identification, justification for intervention, needs assessment, and intervention requirements",
    "cfcDetails": "Detailed CFC operation and management (1000-1200 words) including location specifics, machinery details with specifications, process flow, capacity analysis, operational plan, and management structure",
    "spvDetails": "Complete SPV member units information (800-1000 words) with ownership structure, roles, responsibilities, governance, and member profiles",
    "projectCost": "Detailed project cost breakdown (800-1000 words) with cost justification, comparison with industry standards, cost optimization, and financial planning",
    "financialViability": "Comprehensive financial viability (1200-1500 words) with detailed P&L analysis, cash flow projections, balance sheet, break-even analysis, IRR, NPV, sensitivity analysis, and financial projections",
    "expectedImpact": "Detailed expected impact (800-1000 words) with quantified outcomes, employment generation, income enhancement, cluster development impact, and socio-economic benefits",
    "conclusion": "Professional conclusion (400-600 words) summarizing the project rationale, expected benefits, and recommendation"
  },
  "metadata": {
    "totalPages": 35,
    "wordCount": 12000,
    "sectionsCount": 13
  }
}

CRITICAL: Ensure the total word count is at least 12,000 words to achieve 30+ pages. Each section must be comprehensive and detailed.

Return only valid JSON without markdown code blocks.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // Use gpt-4o for better quality and higher token limits
        messages: [
          {
            role: 'system',
            content: 'You are an expert DPR writer specializing in Cluster Development Projects for government submissions. Generate comprehensive, professional, and detailed project reports with minimum 30 pages. You must use ALL provided data and expand extensively on every section.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 16000, // Increased from 8000 to 16000 for comprehensive content
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
    const clusterName = clusterData.step1?.clusterName || 'Cluster Development Project';
    const district = clusterData.step1?.district || 'District';
    const location = clusterData.step1?.location || 'Location';
    const spvName = clusterData.step11?.spvName || 'SPV Name';
    const submittedTo = clusterData.step11?.submittedTo || 'DIC, District';
    
    return {
      coverPage: `# DETAILED PROJECT REPORT\n\n## On Establishment of Common Facility Centre for ${clusterName} under 'Micro Cluster Development Programme'\n\n### ${district}, ${location}\n\n---\n\n**Submitted to:** ${submittedTo}\n**Submitted by:** ${spvName}\n**Prepared by:** ${spvName}\n**Date:** ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}\n\n---\n\n*This Detailed Project Report has been prepared in accordance with the guidelines for Cluster Development Projects.*`,
      tableOfContents: `# Table of Contents\n\n1. Executive Summary – Basic Cluster Details\n2. Introduction & Sector Overview\n3. District & Regional Profile\n4. Cluster Profile\n5. Value Chain Details\n6. Market Assessment\n7. Gap Analysis\n8. SWOT Analysis\n9. Proposed Interventions\n10. Common Facility Centre (CFC) Details\n11. SPV Details\n12. Project Cost Details\n13. Means of Finance\n14. Operating Cost & Revenue\n15. Financial Viability\n16. Project Implementation Schedule\n17. Expected Impact\n18. Annexures & Document Uploads`,
      sections: {
        executiveSummary: this.generateSectionContent(clusterData, 1, clusterName, location, district),
        introduction: this.generateSectionContent(clusterData, 2, clusterName, location, district),
        districtProfile: this.generateSectionContent(clusterData, 3, clusterName, location, district),
        clusterProfile: this.generateSectionContent(clusterData, 4, clusterName, location, district),
        valueChain: this.generateSectionContent(clusterData, 5, clusterName, location, district),
        marketAssessment: this.generateSectionContent(clusterData, 6, clusterName, location, district),
        gapAnalysis: this.generateSectionContent(clusterData, 7, clusterName, location, district),
        swotAnalysis: this.generateSectionContent(clusterData, 8, clusterName, location, district),
        proposedInterventions: this.generateSectionContent(clusterData, 9, clusterName, location, district),
        cfcDetails: this.generateSectionContent(clusterData, 10, clusterName, location, district),
        spvDetails: this.generateSectionContent(clusterData, 11, clusterName, location, district),
        projectCost: this.generateSectionContent(clusterData, 12, clusterName, location, district),
        meansOfFinance: this.generateSectionContent(clusterData, 13, clusterName, location, district),
        operatingCostRevenue: this.generateSectionContent(clusterData, 14, clusterName, location, district),
        financialViability: this.generateSectionContent(clusterData, 15, clusterName, location, district),
        implementationSchedule: this.generateSectionContent(clusterData, 16, clusterName, location, district),
        expectedImpact: this.generateSectionContent(clusterData, 17, clusterName, location, district),
        annexures: this.generateSectionContent(clusterData, 18, clusterName, location, district),
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
  private static generateSectionContent(clusterData: any, step: number, clusterName?: string, location?: string, district?: string): string {
    const stepData = clusterData[`step${step}` as keyof typeof clusterData];
    if (!stepData) {
      return `Section ${step} content will be generated based on provided data for ${clusterName || 'the cluster'} in ${location || 'the location'}, ${district || 'the district'}.`;
    }

    // Format the data in a readable way with actual values
    let content = `## Section ${step} Content\n\n`;
    
    // Add cluster context
    if (clusterName) {
      content += `**Cluster Name:** ${clusterName}\n`;
    }
    if (location) {
      content += `**Location:** ${location}\n`;
    }
    if (district) {
      content += `**District:** ${district}\n\n`;
    }
    
    // Format step data as readable text
    content += this.formatStepDataAsText(stepData);
    
    return content;
  }

  /**
   * Format step data as readable text
   */
  private static formatStepDataAsText(data: any, indent: number = 0): string {
    if (!data || typeof data !== 'object') {
      return String(data || 'N/A');
    }

    if (Array.isArray(data)) {
      return data.map((item, index) => {
        if (typeof item === 'object') {
          return `${index + 1}. ${this.formatStepDataAsText(item, indent + 1)}`;
        }
        return `${index + 1}. ${item || 'N/A'}`;
      }).join('\n');
    }

    let text = '';
    for (const [key, value] of Object.entries(data)) {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
      if (value === null || value === undefined || value === '') {
        continue; // Skip empty values
      }
      if (typeof value === 'object' && !Array.isArray(value)) {
        text += `\n**${formattedKey}:**\n${this.formatStepDataAsText(value, indent + 1)}\n`;
      } else if (Array.isArray(value)) {
        text += `\n**${formattedKey}:**\n${this.formatStepDataAsText(value, indent + 1)}\n`;
      } else {
        text += `**${formattedKey}:** ${value}\n`;
      }
    }
    return text;
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

      // Return the saved DPR content structure (not the raw enhancedDPR)
      // This ensures the frontend receives the data in the correct format
      return {
        dprId: dprVersion._id,
        projectId: project._id,
        content: {
          coverPage: enhancedDPR.coverPage || '',
          tableOfContents: enhancedDPR.tableOfContents || '',
          sections: enhancedDPR.sections || {},
          metadata: enhancedDPR.metadata || {},
        },
        generatedAt: dprVersion.generatedAt,
        status: dprVersion.status,
      };
    } catch (error: any) {
      console.error('Error generating cluster DPR:', error);
      throw new Error(`Failed to generate cluster DPR: ${error.message}`);
    }
  }
}
