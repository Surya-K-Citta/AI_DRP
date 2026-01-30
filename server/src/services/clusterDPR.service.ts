// @ts-nocheck
import OpenAI from 'openai';
import { DPRVersion } from '../models/DPRVersion.model';
import { Project } from '../models/Project.model';
import { STEP_FIELDS_MAPPING } from './stepFieldsMapping';
import dotenv from 'dotenv';
import { ClusterSection } from '../models/ClusterSection.model';

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
- Submitted to: ${submittedTo} (MUST be a single line, typically "DIC, [District Name]" or similar - NO paragraphs or explanations)
- Submitted by: ${clusterName} (MUST be the cluster name only - single line, NO paragraphs or explanations)
- Prepared by: CittaAI

CRITICAL: "Submitted to" and "Submitted by" MUST be simple single-line entries. DO NOT write paragraphs or explanations for these fields. Just use the exact values provided above.

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
10. **Avoid redundant subsections** - Do NOT add extra subsection headings like "Sectoral Context", "Strategic Importance", "Additional Analysis" etc. Integrate all content naturally within the main section narrative. Only use subsections when they are part of the standard DPR structure.

SPECIFIC SECTION REQUIREMENTS:

- **Executive Summary**: 600-800 words, comprehensive overview covering all key aspects
- **Introduction**: 800-1000 words with sector overview, national and state importance, historical context. Write as a cohesive narrative without unnecessary subsection headings.
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
- Cover Page MUST include: "DETAILED PROJECT REPORT\nOn Establishment of Common Facility Centre for ${clusterName} under 'Micro Cluster Development Programme'\nSubmitted to: ${submittedTo}\nSubmitted by: ${clusterName}\nPrepared by: CittaAI"
CRITICAL: "Submitted to" and "Submitted by" must be simple single-line entries only. NO paragraphs or explanations.
- Project Snapshot tables MUST use actual data values from step1, step4, step5, step6, step11
- All sections MUST reference actual data values, not placeholders

Return a JSON object with this structure:
{
  "coverPage": "Full cover page content with EXACT values: DETAILED PROJECT REPORT\nOn Establishment of Common Facility Centre for ${clusterName} under 'Micro Cluster Development Programme'\nSubmitted to: ${submittedTo}\nSubmitted by: ${spvName}\nPrepared by: CittaAI",
  "tableOfContents": "Complete table of contents with page numbers",
  "sections": {
    "executiveSummary": "Comprehensive executive summary (600-800 words) covering all key aspects. MUST include actual cluster name: ${clusterName}, location: ${location}, district: ${district}, SPV: ${spvName}, and all key metrics from step1",
    "introduction": "Extensive introduction section (800-1000 words) with sector overview, national and state importance, historical context, and industry background. DO NOT add extra subsection headings like 'Sectoral Context' or 'Strategic Importance' - integrate all content naturally within the main introduction narrative.",
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
            content: 'You are an expert DPR writer specializing in Cluster Development Projects for government submissions. Generate comprehensive, professional, and detailed project reports with minimum 30 pages. You must use ALL provided data and expand extensively on every section. IMPORTANT: Do NOT add redundant subsection headings like "Sectoral Context", "Strategic Importance", or "Additional Analysis" - integrate all content naturally within the main section narrative.',
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
      coverPage: `# DETAILED PROJECT REPORT\n\n## On Establishment of Common Facility Centre for ${clusterName} under 'Micro Cluster Development Programme'\n\n### ${district}, ${location}\n\n---\n\n**Submitted to:** ${submittedTo}\n**Submitted by:** ${clusterName}\n**Prepared by:** CittaAI\n**Date:** ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}\n\n---\n\n*This Detailed Project Report has been prepared in accordance with the guidelines for Cluster Development Projects.*`,
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
    
    // Special handling for Executive Summary (step 1) - generate as paragraph
    if (step === 1) {
      return this.generateExecutiveSummaryParagraph(clusterData, clusterName, location, district);
    }
    
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
   * Generate Executive Summary as a comprehensive paragraph
   */
  private static generateExecutiveSummaryParagraph(clusterData: any, clusterName?: string, location?: string, district?: string): string {
    const s1 = clusterData.step1 || {};
    const s11 = clusterData.step11 || {};
    
    const clusterNameValue = clusterName || s1.clusterName || 'the Cluster';
    const locationValue = location || s1.location || 'the location';
    const districtValue = district || s1.district || 'the district';
    const geographicalSpread = s1.geographicalSpread || 'multiple villages';
    const natureOfBusiness = s1.natureOfBusiness || 'business activities';
    const majorProducts = s1.majorProducts || 'products';
    
    const enterpriseCount = s1.enterpriseCount || {};
    const micro = enterpriseCount.micro || 0;
    const small = enterpriseCount.small || 0;
    const medium = enterpriseCount.medium || 0;
    const totalEnterprises = micro + small + medium;
    
    const ageOfEnterprises = s1.ageOfEnterprises || {};
    const employmentPerUnit = s1.employmentPerUnit || {};
    const investmentPerUnit = s1.investmentPerUnit || 0;
    const turnoverPerUnit = s1.turnoverPerUnit || 0;
    const marketServed = s1.marketServed || {};
    const domestic = marketServed.domestic || 0;
    const exportShare = marketServed.export || 0;
    
    const spvName = s11.spvName || 'the Special Purpose Vehicle';
    const projectCost = clusterData.step12?.totalCost || 0;
    const expectedEmployment = clusterData.step17?.employmentGeneration || 0;
    
    // Generate comprehensive paragraph
    const paragraph = `The ${clusterNameValue} located in ${locationValue}, ${districtValue}, represents a significant initiative under the Micro Cluster Development Programme. The cluster encompasses ${geographicalSpread} and focuses on ${natureOfBusiness}, with primary products including ${majorProducts}. The cluster comprises a total of ${totalEnterprises} enterprises, including ${micro} micro enterprises, ${small} small enterprises, and ${medium} medium enterprises, demonstrating a diverse and robust industrial ecosystem. ` +
      `The cluster's enterprises have varying operational histories, with ${ageOfEnterprises.lessThan5 || 0} enterprises operating for less than 5 years, ${ageOfEnterprises.between5And10 || 0} enterprises between 5-10 years, and ${ageOfEnterprises.moreThan10 || 0} enterprises with over 10 years of experience. ` +
      `In terms of employment generation, the cluster provides substantial employment opportunities across different scales, with ${employmentPerUnit.lessThan5 || 0} units employing less than 5 workers, ${employmentPerUnit.between5And10 || 0} units employing 5-10 workers, and ${employmentPerUnit.moreThan10 || 0} units employing more than 10 workers. ` +
      `The average investment per unit stands at ₹${investmentPerUnit.toLocaleString('en-IN')} Lakhs, while the average turnover per unit is ₹${turnoverPerUnit.toLocaleString('en-IN')} Lakhs, indicating strong economic activity and growth potential. ` +
      `The market served by the cluster is distributed with ${domestic}% domestic market share and ${exportShare}% export orientation, showcasing both local market strength and international competitiveness. ` +
      `${spvName} has been established as the implementing agency for this cluster development initiative. ` +
      (projectCost > 0 ? `The total project cost is estimated at ₹${projectCost.toLocaleString('en-IN')} Lakhs, ` : '') +
      (expectedEmployment > 0 ? `with an expected employment generation of ${expectedEmployment} persons. ` : '') +
      `This comprehensive development project aims to enhance the cluster's competitiveness, improve production capabilities, strengthen market linkages, and create sustainable employment opportunities, thereby contributing significantly to the regional economic development and the overall growth of the MSME sector.`;

    return paragraph;
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
      // Extract enhancedContent and images if provided (user-enhanced content/images from preview)
      let providedEnhancedContent = clusterData.enhancedContent || {};
      const enhancedContentKeys = Object.keys(providedEnhancedContent);
      console.log(`📥 Received ${enhancedContentKeys.length} enhanced content sections from frontend`);
      
      // Extract images from clusterData
      const providedImages = clusterData.images || {};
      const imageKeys = Object.keys(providedImages);
      console.log(`📥 Received ${imageKeys.length} images from frontend:`, imageKeys);
      
      // Remove enhancedContent and images from clusterData before processing
      const { enhancedContent, images, ...cleanClusterData } = clusterData;
      
      // Enhance data using OpenAI
      console.log('🤖 Enhancing cluster DPR data with OpenAI...');
      const enhancedDPR = await this.enhanceClusterDPRData(cleanClusterData);
      
      // Merge provided enhanced content with generated content
      // User-enhanced content takes precedence over AI-generated content
      if (enhancedContentKeys.length > 0) {
        console.log('🔄 Merging user-enhanced content with AI-generated content...');
        
        // Map enhanced content keys to DPR sections
        // Enhanced content keys are like: 'executiveSummary', 'districtProfile-geography', 'marketAspects-demandSupplyGap', etc.
        Object.keys(providedEnhancedContent).forEach(key => {
          const enhancedText = providedEnhancedContent[key];
          if (!enhancedText) return;
          
          // Direct section mapping (e.g., 'executiveSummary' -> sections.executiveSummary)
          if (key.includes('-')) {
            // Subsection mapping (e.g., 'districtProfile-geography' -> sections.districtProfile)
            const [sectionName, subsection] = key.split('-');
            if (enhancedDPR.sections && enhancedDPR.sections[sectionName]) {
              // For subsections, we'll store them separately and use them in rendering
              if (!enhancedDPR.sections[`${sectionName}-${subsection}`]) {
                enhancedDPR.sections[`${sectionName}-${subsection}`] = enhancedText;
              }
            }
          } else {
            // Direct section replacement
            if (enhancedDPR.sections && enhancedDPR.sections[key]) {
              enhancedDPR.sections[key] = enhancedText;
              console.log(`✅ Merged enhanced content for section: ${key}`);
            }
          }
        });
      }

      // Create or find a project for this cluster DPR
      // First try to find by project name, then by stepData if available
      let project = await Project.findOne({
        userId,
        projectName: cleanClusterData.step1?.clusterName || 'Cluster DPR',
        projectType: 'cluster',
      });

      // If project not found, try to find by matching stepData (for existing drafts)
      if (!project && cleanClusterData.step1?.clusterName) {
        const projects = await Project.find({
          userId,
          projectType: 'cluster',
          'stepData.step1.clusterName': cleanClusterData.step1.clusterName,
        }).sort({ updatedAt: -1 }).limit(1);
        
        if (projects.length > 0) {
          project = projects[0];
          console.log('📥 Found existing cluster project by stepData:', project._id);
          
          // Merge saved stepData with provided data (provided data takes precedence)
          if (project.stepData) {
            cleanClusterData = {
              ...project.stepData,
              ...cleanClusterData,
            };
            console.log('📥 Merged saved stepData with provided data');
          }
        }
      }
      
      // If project exists, also check for existing DPR with enhancedContent
      if (project) {
        const existingDPR = await DPRVersion.findOne({
          projectId: project._id.toString(),
          userId,
        }).sort({ createdAt: -1 });
        
        if (existingDPR && existingDPR.content?.english?.enhancedContent) {
          // Merge existing enhancedContent with provided enhancedContent (provided takes precedence)
          const existingEnhancedContent = existingDPR.content.english.enhancedContent || {};
          const mergedEnhancedContent = {
            ...existingEnhancedContent,
            ...providedEnhancedContent,
          };
          providedEnhancedContent = mergedEnhancedContent;
          console.log(`📥 Merged existing enhancedContent (${Object.keys(existingEnhancedContent).length} sections) with provided (${Object.keys(providedEnhancedContent).length} sections)`);
        }
      }

      // Calculate total cost from step 12 if available
      const totalCost = cleanClusterData.step12
        ? (cleanClusterData.step12.land || 0) +
        (cleanClusterData.step12.building || 0) +
        (cleanClusterData.step12.machinery || 0) +
        (cleanClusterData.step12.utilitiesAndInfrastructure || 0) +
        (cleanClusterData.step12.preliminaryAndPreOperative || 0) +
        (cleanClusterData.step12.workingCapitalMargin || 0)
        : 0;

      // Calculate own contribution from step 13 if available
      const ownContribution = cleanClusterData.step13?.spvContribution || 0;
      const loanAmount = cleanClusterData.step13?.bankLoan || 0;

      if (!project) {
        project = await Project.create({
          userId,
          projectName: cleanClusterData.step1?.clusterName || 'Cluster DPR',
          industrySector: cleanClusterData.step2?.sectorType || 'Cluster Development',
          location: cleanClusterData.step1?.location || '',
          district: cleanClusterData.step1?.district || '',
          projectType: 'cluster',
          totalCost: totalCost || 100000, // Default to 1 lakh if not provided
          ownContribution: ownContribution || 0,
          loanAmount: loanAmount || 0,
          status: 'completed',
          stepData: cleanClusterData,
          images: providedImages, // Save images to project
        });
      } else {
        // Update existing project
        project.stepData = cleanClusterData;
        project.totalCost = totalCost || project.totalCost || 100000;
        project.ownContribution = ownContribution || project.ownContribution || 0;
        project.loanAmount = loanAmount || project.loanAmount || 0;
        project.status = 'completed';
        // Merge images (provided images take precedence)
        project.images = { ...(project.images || {}), ...providedImages };
        await project.save();
      }

      // Store generated sections separately (for user review before applying)
      const generatedSections = enhancedDPR.sections || {};
      
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
            clusterData: cleanClusterData,
            // Store generated sections separately (for user review before applying)
            generatedSections: generatedSections,
            // Store all enhanced content (including subsections) for use in rendering
            enhancedContent: providedEnhancedContent,
            // Store images for use in rendering
            images: providedImages,
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
            clusterData: cleanClusterData,
            // Store generated sections separately (for user review before applying)
            generatedSections: generatedSections,
            // Store enhanced content for Telugu as well
            enhancedContent: providedEnhancedContent,
            // Store images for use in rendering
            images: providedImages,
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

      // Store generated sections in ClusterSection model
      const sectionsToStore = enhancedDPR.sections || {};
      
      // Map section names to valid enum values
      const sectionTypeMapping: Record<string, string> = {
        'marketAssessment': 'marketAspects', // Map marketAssessment to marketAspects
        // Add other mappings if needed
      };
      
      const sectionPromises = Object.entries(sectionsToStore).map(async ([sectionType, content]) => {
        // Map section type to valid enum value
        const mappedSectionType = sectionTypeMapping[sectionType] || sectionType;
        
        // Skip if section type is not in valid enum (after mapping)
        const validSectionTypes = [
          'executiveSummary', 'introduction', 'districtProfile', 'clusterProfile',
          'valueChain', 'marketAspects', 'marketAssessment', 'gapAnalysis', 'swotAnalysis',
          'proposedInterventions', 'cfcDetails', 'spvDetails', 'projectCost',
          'meansOfFinance', 'operatingCostRevenue', 'financialViability',
          'implementationSchedule', 'expectedImpact', 'conclusion', 'annexures',
          'coverPage', 'tableOfContents', 'projectSnapshot',
          // Subsections
          'districtProfile-geography', 'districtProfile-climate',
          'districtProfile-infrastructure', 'districtProfile-keyEconomicActivities',
          'districtProfile-industrialInfrastructure', 'clusterProfile-evolution',
          'marketAspects-demandSupply', 'marketAspects-competition',
          'marketAspects-priceTrends', 'marketAspects-exportPotential',
          'marketAspects-targetMarket',
        ];
        
        // Only process if it's a valid section type (including subsections that start with valid types)
        const isValidSection = validSectionTypes.includes(mappedSectionType) ||
          mappedSectionType.includes('-') && validSectionTypes.some(valid => mappedSectionType.startsWith(valid.split('-')[0]));
        
        if (!isValidSection) {
          console.warn(`⚠️ Skipping invalid section type: ${sectionType} (mapped to: ${mappedSectionType})`);
          return Promise.resolve([]);
        }
        
        // Store for both languages if bilingual
        const languages = language === 'bilingual' ? ['english', 'telugu'] : [language === 'telugu' ? 'telugu' : 'english'];
        
        return Promise.all(languages.map(async (lang) => {
          await ClusterSection.create({
            userId,
            dprId: dprVersion._id.toString(),
            sectionType: mappedSectionType,
            language: lang as 'english' | 'telugu',
            content: content as string || '', // Use generated content as initial content, or empty string
            generatedContent: content as string,
            isApplied: false,
            version: 1,
          });
        }));
      });

      await Promise.all(sectionPromises);
      console.log(`✅ Stored ${Object.keys(sectionsToStore).length} generated sections in ClusterSection model`);

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

  /**
   * Enhance a specific section of the DPR with contextual paragraph
   */
  static async enhanceSection(sectionName: string, sectionData: any, clusterData: any): Promise<string> {
    try {
      const clusterName = clusterData.step1?.clusterName || 'the cluster';
      const location = clusterData.step1?.location || '';
      const district = clusterData.step1?.district || '';

      // Create section-specific prompts - Generate intro paragraphs for each section
      const sectionPrompts: Record<string, string> = {
        'executiveSummary': `Generate an introductory paragraph (150-200 words) for the Executive Summary section that provides an overview and context. Use the following data: Cluster Name: ${clusterName}, Location: ${location}, District: ${district}, Enterprise Count: ${JSON.stringify(clusterData.step1?.enterpriseCount || {})}, Major Products: ${clusterData.step1?.majorProducts || 'N/A'}. Write a professional, government-ready introductory paragraph that summarizes the project overview, cluster characteristics, and key highlights. This paragraph will serve as an introduction to the section.`,
        'projectSnapshot': `Generate an introductory paragraph (150-200 words) for the Project Snapshot section that provides an overview and context. Use the following data: Cluster Name: ${clusterName}, Location: ${location}, District: ${district}, Enterprise Count: ${JSON.stringify(clusterData.step1?.enterpriseCount || {})}, SPV Name: ${clusterData.step11?.spvName || 'N/A'}, Major Products: ${clusterData.step1?.majorProducts || 'N/A'}. Write a professional, government-ready introductory paragraph that summarizes the project overview, cluster characteristics, and key highlights. This paragraph will serve as an introduction to the section.`,

        'operatingCostRevenue': `Generate an introductory paragraph (150-200 words) for the Operating Cost & Revenue section that provides context and overview. Use the following data: ${JSON.stringify(sectionData)}. Calculate and mention: Total annual operating cost, breakdown of major cost components (raw material, power, wages, etc.), annual production volume, annual sales realization, and operating surplus. Write a professional introductory paragraph explaining the operational viability and financial sustainability of the project. This paragraph will serve as an introduction to the section.`,

        'projectCost': `Generate an introductory paragraph (150-200 words) for the Project Cost & Means of Finance section that provides context and overview. Use the following data: ${JSON.stringify(sectionData)}. Mention: Total project cost, cost breakdown (land, building, machinery, etc.), means of finance (SPV contribution, government grant, bank loan, etc.), and financial structure. Write a professional introductory paragraph explaining the project investment and financing plan. This paragraph will serve as an introduction to the section.`,

        'financialViability': `Generate an introductory paragraph (150-200 words) for the Financial Viability section that provides context and overview. Use the following data: ${JSON.stringify(sectionData)}. Mention: Profit & Loss projections, cash flow, balance sheet, break-even point, IRR, NPV, and overall financial viability. Write a professional introductory paragraph explaining the financial sustainability and profitability of the project. This paragraph will serve as an introduction to the section.`,

        'expectedImpact': `Generate an introductory paragraph (150-200 words) for the Expected Impact section that provides context and overview. Use the following data: ${JSON.stringify(sectionData)}. Mention: Employment generation, turnover growth, export growth, income enhancement, and sustainability outcomes. Write a professional introductory paragraph explaining the socio-economic impact and benefits of the project. This paragraph will serve as an introduction to the section.`,

        'clusterProfile': `Generate an introductory paragraph (150-200 words) for the Cluster Profile section that provides context and overview. Use the following data: ${JSON.stringify(sectionData)}. Mention: Cluster evolution, present status, number of units, production capacity, technology level, and key stakeholders. Write a professional introductory paragraph describing the cluster's current state and characteristics. This paragraph will serve as an introduction to the section.`,

        'valueChain': `Generate an introductory paragraph (150-200 words) for the Value Chain Mapping section that provides context and overview. Use the following data: ${JSON.stringify(sectionData)}. Mention: Raw materials, value addition stages, intermediate products, final products, and major buyers. Write a professional introductory paragraph explaining the complete value chain structure. This paragraph will serve as an introduction to the section.`,

        'marketAspects': `Generate an introductory paragraph (150-200 words) for the Market Aspects section that provides context and overview. Use the following data: ${JSON.stringify(sectionData)}. Mention: Existing demand, demand-supply gap, competition analysis, price trends, export potential, and target market. Write a professional introductory paragraph analyzing the market scenario and opportunities. This paragraph will serve as an introduction to the section.`,

        'swotAnalysis': `Generate an introductory paragraph (150-200 words) for the SWOT Analysis section that provides context and overview. Use the following data: ${JSON.stringify(sectionData)}. Mention: Key strengths, weaknesses, opportunities, and threats. Write a professional introductory paragraph summarizing the SWOT analysis and strategic implications. This paragraph will serve as an introduction to the section.`,

        'gapAnalysis': `Generate an introductory paragraph (150-200 words) for the Gap Analysis section that provides context and overview. Use the following data: ${JSON.stringify(sectionData)}. Mention: Technology gaps, infrastructure gaps, skill gaps, marketing gaps, financial gaps, and justification for intervention. Write a professional introductory paragraph explaining the identified gaps and need for intervention. This paragraph will serve as an introduction to the section.`,

        'cfcDetails': `Generate an introductory paragraph (150-200 words) for the CFC Operation & Management section that provides context and overview. Use the following data: ${JSON.stringify(sectionData)}. Mention: CFC name, location, plant & machinery, manufacturing process, capacity, and requirements (power, water, manpower). Write a professional introductory paragraph describing the CFC setup and operations. This paragraph will serve as an introduction to the section.`,

        'spvDetails': `Generate an introductory paragraph (150-200 words) for the SPV Member Units section that provides context and overview. Use the following data: ${JSON.stringify(sectionData)}. Mention: SPV name, legal status, member units, shareholding pattern, objectives, and roles. Write a professional introductory paragraph describing the SPV structure and governance. This paragraph will serve as an introduction to the section.`,

        'implementationSchedule': `Generate an introductory paragraph (150-200 words) for the Project Implementation Schedule section that provides context and overview. Use the following data: ${JSON.stringify(sectionData)}. Mention: Project start date, key milestones, timeline, and total implementation period. Write a professional introductory paragraph explaining the project timeline and implementation plan. This paragraph will serve as an introduction to the section.`,

        'conclusion': `Generate a comprehensive conclusion paragraph (200-250 words) for the DPR. 

PROJECT SUMMARY:
- Cluster Name: ${clusterName}
- Location: ${location}, District: ${district}
- Major Products: ${clusterData.step1?.majorProducts || 'N/A'}
- Total Enterprises: ${(clusterData.step1?.enterpriseCount?.micro || 0) + (clusterData.step1?.enterpriseCount?.small || 0) + (clusterData.step1?.enterpriseCount?.medium || 0)}
- SPV Name: ${clusterData.step11?.spvName || 'N/A'}
- Project Cost: ₹${(clusterData.step12?.totalCost || 0).toLocaleString('en-IN')} Lakhs
- Expected Employment Generation: ${clusterData.step17?.employmentGeneration || 0}
- Expected Turnover Growth: ${clusterData.step17?.turnoverGrowth || 0}%
- Expected Export Growth: ${clusterData.step17?.exportGrowth || 0}%
- Expected Income Enhancement: ₹${(clusterData.step17?.incomeEnhancement || 0).toLocaleString('en-IN')}

Write a professional, government-ready conclusion paragraph (200-250 words) that:
1. Summarizes the project rationale and key highlights
2. Highlights expected benefits (employment, turnover, export, income)
3. Mentions financial viability and project sustainability
4. Provides a strong recommendation for approval
5. Ties together all aspects of the cluster development project

Use exact values from the data above. Write in a formal, persuasive tone suitable for government submission.`,

        'introduction': `Generate an introductory paragraph (150-200 words) for the Introduction section that provides context and overview. Use the following data: ${JSON.stringify(sectionData)}. Mention: Sector/Industry type, sector description, national importance, and state-level importance. Write a professional introductory paragraph explaining the sector context and significance. This paragraph will serve as an introduction to the section.`,

        'districtProfile': `Generate an introductory paragraph (150-200 words) for the District & Regional Profile section that provides context and overview. Use the following data: ${JSON.stringify(sectionData)}. Mention: Geography, climate, infrastructure, key economic activities, raw material availability, industrial infrastructure, and connectivity. Write a professional introductory paragraph describing the district's characteristics and advantages. This paragraph will serve as an introduction to the section.`,

        'tableExplanation': `Generate a comprehensive explanation paragraph (100-150 words) for the following table data: ${JSON.stringify(sectionData)}. Explain what the table shows, key findings, trends, and implications. Write a professional paragraph that provides context and analysis for the table.`,

        'graphExplanation': `Generate a comprehensive explanation paragraph (100-150 words) for the following graph/chart data: ${JSON.stringify(sectionData)}. Explain what the graph shows, key trends, patterns, and insights. Write a professional paragraph that provides context and analysis for the visualization.`,

        // District Profile Subsections
        'districtProfile-geography': `Generate a comprehensive paragraph (150-200 words) for the Geography subsection of District & Regional Profile. The cluster is "${clusterName}" located in ${district}, ${location}. Current information: ${typeof sectionData === 'object' && sectionData.text ? sectionData.text : sectionData}. Additional context: ${JSON.stringify(typeof sectionData === 'object' && sectionData.context ? sectionData.context : {})}. Write a detailed, professional paragraph describing the geographical characteristics, terrain, location advantages, geographical significance, and how geography supports the cluster's operations. Make it informative for investors.`,

        'districtProfile-climate': `Generate a comprehensive paragraph (150-200 words) for the Climate subsection of District & Regional Profile. The cluster is "${clusterName}" located in ${district}, ${location}. Current information: ${typeof sectionData === 'object' && sectionData.text ? sectionData.text : sectionData}. Additional context: ${JSON.stringify(typeof sectionData === 'object' && sectionData.context ? sectionData.context : {})}. Write a detailed, professional paragraph describing the climate conditions, seasonal patterns, temperature ranges, rainfall patterns, and how climate affects the cluster's operations and production cycles. Make it informative for investors.`,

        'districtProfile-infrastructure': `Generate a comprehensive paragraph (150-200 words) for the Infrastructure subsection of District & Regional Profile. The cluster is "${clusterName}" located in ${district}, ${location}. Current information: ${typeof sectionData === 'object' && sectionData.text ? sectionData.text : sectionData}. Additional context: ${JSON.stringify(typeof sectionData === 'object' && sectionData.context ? sectionData.context : {})}. Write a detailed, professional paragraph describing the existing infrastructure facilities (roads, power, water, communication, etc.), their capacity, quality, accessibility, and importance for the cluster's operations. Make it informative for investors.`,

        'districtProfile-keyEconomicActivities': `Generate a comprehensive paragraph (150-200 words) for the Key Economic Activities subsection of District & Regional Profile. The cluster is "${clusterName}" located in ${district}, ${location}. Current information: ${typeof sectionData === 'object' && sectionData.text ? sectionData.text : sectionData}. Additional context: ${JSON.stringify(typeof sectionData === 'object' && sectionData.context ? sectionData.context : {})}. Write a detailed, professional paragraph describing the major economic activities in the district, their significance, contribution to the local economy, employment generation, and how they relate to the cluster. Make it informative for investors.`,

        'districtProfile-industrialInfrastructure': `Generate a comprehensive paragraph (150-200 words) for the Industrial Infrastructure subsection of District & Regional Profile. The cluster is "${clusterName}" located in ${district}, ${location}. Current information: ${typeof sectionData === 'object' && sectionData.text ? sectionData.text : sectionData}. Additional context: ${JSON.stringify(typeof sectionData === 'object' && sectionData.context ? sectionData.context : {})}. Write a detailed, professional paragraph describing the industrial infrastructure facilities (industrial parks, SEZs, common facilities, etc.), their capacity, role in supporting cluster development, and benefits for investors. Make it informative for investors.`,

        // Cluster Profile Subsections
        'clusterProfile-evolution': `Generate a comprehensive paragraph (150-200 words) for the Evolution of the Cluster subsection. The cluster is "${clusterName}" located in ${district}, ${location}. Current information: ${typeof sectionData === 'object' && sectionData.text ? sectionData.text : sectionData}. Additional context: ${JSON.stringify(typeof sectionData === 'object' && sectionData.context ? sectionData.context : {})}. Write a detailed, professional paragraph describing how the cluster evolved over time, its historical development, growth trajectory, transformation phases, key milestones, and current status. Make it informative for investors.`,

        // Market Aspects Subsections
        'marketAspects-demandSupply': `Generate a comprehensive paragraph (150-200 words) for the Demand-Supply Analysis subsection. The cluster is "${clusterName}" producing ${clusterData.step1?.majorProducts || 'products'}. Current information: ${typeof sectionData === 'object' && sectionData.text ? sectionData.text : sectionData}. Additional context: ${JSON.stringify(typeof sectionData === 'object' && sectionData.context ? sectionData.context : {})}. Write a detailed, professional paragraph analyzing the existing demand, supply patterns, market dynamics, demand-supply balance, market size, growth trends, and opportunities. Make it informative for investors.`,

        'marketAspects-demandSupplyGap': `Generate a comprehensive paragraph (150-200 words) explaining the Demand-Supply Gap. The cluster is "${clusterName}" producing ${clusterData.step1?.majorProducts || 'products'}. Current information: ${typeof sectionData === 'object' && sectionData.text ? sectionData.text : sectionData}. Additional context: ${JSON.stringify(typeof sectionData === 'object' && sectionData.context ? sectionData.context : {})}. Write a detailed, professional paragraph describing the gap between demand and supply, its magnitude, causes, implications for the cluster, market opportunities, and potential for growth. Make it informative for investors.`,

        'marketAspects-competition': `Generate a comprehensive paragraph (150-200 words) for the Competition Analysis subsection. The cluster is "${clusterName}" producing ${clusterData.step1?.majorProducts || 'products'}. Current information: ${typeof sectionData === 'object' && sectionData.text ? sectionData.text : sectionData}. Additional context: ${JSON.stringify(typeof sectionData === 'object' && sectionData.context ? sectionData.context : {})}. Write a detailed, professional paragraph analyzing the competitive landscape, key competitors, competitive advantages, market positioning, differentiation factors, and competitive strategies. Make it informative for investors.`,

        'marketAspects-priceTrends': `Generate a comprehensive paragraph (150-200 words) for the Price Trends subsection. The cluster is "${clusterName}" producing ${clusterData.step1?.majorProducts || 'products'}. Current information: ${typeof sectionData === 'object' && sectionData.text ? sectionData.text : sectionData}. Additional context: ${JSON.stringify(typeof sectionData === 'object' && sectionData.context ? sectionData.context : {})}. Write a detailed, professional paragraph describing price trends, seasonal variations, historical patterns, future price outlook, price stability, and profitability implications. Make it informative for investors.`,

        'marketAspects-exportPotential': `Generate a comprehensive paragraph (150-200 words) for the Export Potential subsection. The cluster is "${clusterName}" producing ${clusterData.step1?.majorProducts || 'products'}. Current information: ${typeof sectionData === 'object' && sectionData.text ? sectionData.text : sectionData}. Additional context: ${JSON.stringify(typeof sectionData === 'object' && sectionData.context ? sectionData.context : {})}. Write a detailed, professional paragraph describing export opportunities, target markets, export potential, international demand, export regulations, and strategies for export growth. Make it informative for investors.`,

        'marketAspects-targetMarket': `Generate a comprehensive paragraph (150-200 words) for the Target Market subsection. The cluster is "${clusterName}" producing ${clusterData.step1?.majorProducts || 'products'}. Current information: ${typeof sectionData === 'object' && sectionData.text ? sectionData.text : sectionData}. Additional context: ${JSON.stringify(typeof sectionData === 'object' && sectionData.context ? sectionData.context : {})}. Write a detailed, professional paragraph describing the target market segments, customer profiles, market size, market entry strategies, distribution channels, and market penetration opportunities. Make it informative for investors.`
      };

      // Handle table and graph explanations
      let prompt: string;
      if (sectionName.startsWith('tableExplanation-')) {
        prompt = sectionPrompts['tableExplanation'] || `Generate a comprehensive explanation paragraph (100-150 words) for a table. Table data: ${JSON.stringify(sectionData)}. Explain what the table shows, key findings, trends, patterns, and implications. Write a professional paragraph that provides context and analysis for the table data.`;
      } else if (sectionName.startsWith('graphExplanation-')) {
        prompt = sectionPrompts['graphExplanation'] || `Generate a comprehensive explanation paragraph (100-150 words) for a graph/chart. Chart data: ${JSON.stringify(sectionData)}. Explain what the graph shows, key trends, patterns, insights, and what it means for the project. Write a professional paragraph that provides context and analysis for the visualization.`;
      } else {
        // Check for subsection prompts first, then main section prompts
        prompt = sectionPrompts[sectionName] || sectionPrompts[sectionName.split('-')[0]] || `Generate a comprehensive paragraph (150-200 words) for the ${sectionName} section based on the following data: ${JSON.stringify(sectionData)}. Write a professional, government-ready paragraph that explains the key aspects and significance of this section.`;
      }

      const systemMessage = `You are an expert DPR writer specializing in Cluster Development Projects for government submissions. Generate professional, detailed, and contextual paragraphs based on the provided data. Use exact values from the data. Write in a formal, government-ready style suitable for official project reports.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemMessage,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const enhancedParagraph = response.choices[0]?.message?.content || '';
      return enhancedParagraph.trim();
    } catch (error: any) {
      console.error(`Error enhancing section ${sectionName}:`, error);
      throw new Error(`Failed to enhance section: ${error.message}`);
    }
  }

  /**
   * Regenerate/expand a specific section using the currently applied content + a user instruction.
   * This is used for "compare current vs new" workflows; caller is responsible for storing the result.
   */
  static async regenerateSectionWithInstruction(
    sectionName: string,
    currentContent: string,
    instruction: string,
    clusterData: any,
    language: 'english' | 'telugu' = 'english'
  ): Promise<string> {
    try {
      const clusterName = clusterData?.step1?.clusterName || 'the cluster';
      const district = clusterData?.step1?.district || '';
      const location = clusterData?.step1?.location || '';
      const majorProducts = clusterData?.step1?.majorProducts || '';

      const systemMessage =
        language === 'telugu'
          ? 'మీరు ప్రభుత్వ సమర్పణల కోసం క్లస్టర్ డెవలప్‌మెంట్ DPRలను రాసే నిపుణ రచయిత. ఇచ్చిన సందర్భం మరియు సూచన ఆధారంగా ఉన్న పాఠ్యాన్ని మెరుగుపరచండి. అధికారిక, ప్రభుత్వ-సిద్ధమైన శైలిలో రాయండి.'
          : 'You are an expert DPR writer specializing in Cluster Development Projects for government submissions. Improve and expand the given section based on the instruction and context. Write in a formal, government-ready style.';

      const prompt =
        language === 'telugu'
          ? [
              `విభాగం: ${sectionName}`,
              `క్లస్టర్: ${clusterName} (${district} ${location})`,
              majorProducts ? `ప్రధాన ఉత్పత్తులు: ${majorProducts}` : '',
              '',
              'ప్రస్తుత (Applied) కంటెంట్:',
              '"""',
              currentContent || '(ఖాళీ)',
              '"""',
              '',
              'యూజర్ అవసరం / మార్పుల సూచన:',
              '"""',
              instruction,
              '"""',
              '',
              'నిబంధనలు:',
              '- ప్రస్తుత అర్థాన్ని కాపాడుతూ, అవసరమైన మేరకు విస్తరించండి/సరిచేయండి',
              '- పునరావృత శీర్షికలు/అదనపు subsection headings చేర్చవద్దు',
              '- అవసరమైన చోట సంఖ్యలు/వాస్తవాలు clusterData నుండి మాత్రమే ఉపయోగించండి; ఊహించవద్దు',
              '- ఫలితం ఒకే విభాగం కంటెంట్‌గా ఇవ్వండి (మార్క్‌డౌన్ హెడ్డింగ్స్ లేకుండా)',
            ]
              .filter(Boolean)
              .join('\n')
          : [
              `Section: ${sectionName}`,
              `Cluster: ${clusterName} (${district} ${location})`,
              majorProducts ? `Major products: ${majorProducts}` : '',
              '',
              'CURRENT (applied) content:',
              '"""',
              currentContent || '(empty)',
              '"""',
              '',
              'USER REQUIREMENT / CHANGE INSTRUCTION:',
              '"""',
              instruction,
              '"""',
              '',
              'Rules:',
              '- Preserve intent, expand/improve as needed',
              '- Do not add redundant subsection headings; write as a continuous section narrative',
              '- Use numbers/facts only if present in the provided context; do not hallucinate',
              '- Output only the rewritten section content (no markdown headings)',
            ]
              .filter(Boolean)
              .join('\n');

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 900,
      });

      const regenerated = response.choices[0]?.message?.content || '';
      return regenerated.trim();
    } catch (error: any) {
      console.error(`Error regenerating section ${sectionName}:`, error);
      throw new Error(`Failed to regenerate section: ${error.message}`);
    }
  }

  /**
   * Get AI suggestions for a specific step based on previous steps data
   */
  static async getAISuggestionsForStep(
    currentStep: number,
    currentStepData: any,
    previousStepsData: Record<string, any>,
    excludeFields: string[] = []
  ): Promise<Array<{ field: string; suggestion: string; reasoning?: string }>> {
    try {
      // For Step 1, we don't require previous data
      // For other steps, check if we have at least Step 1 data
      if (currentStep > 1 && (!previousStepsData.step1 || Object.keys(previousStepsData.step1).length === 0)) {
        console.log('No Step 1 data available for AI suggestions');
        return [];
      }

      // Get step field mapping
      const stepMapping = STEP_FIELDS_MAPPING[currentStep];
      if (!stepMapping) {
        console.log(`No field mapping found for step ${currentStep}`);
        return [];
      }

      // Build comprehensive context from ALL previous steps
      const contextText = this.formatStepDataAsText(previousStepsData);
      const currentStepText = this.formatStepDataAsText({ [`step${currentStep}`]: currentStepData });

      // Extract key information from Step 1 for quick reference
      // For Step 1, use currentStepData; for other steps, use previousStepsData.step1
      const step1Data = currentStep === 1 ? currentStepData : (previousStepsData.step1 || {});
      const clusterName = step1Data.clusterName || '';
      const district = step1Data.district || '';
      const location = step1Data.location || '';
      const natureOfBusiness = step1Data.natureOfBusiness || '';
      const majorProducts = step1Data.majorProducts || '';
      const enterpriseCount = step1Data.enterpriseCount || {};
      const totalEnterprises = (enterpriseCount.micro || 0) + (enterpriseCount.small || 0) + (enterpriseCount.medium || 0);

      // Extract key information from other previous steps for better context
      const step2Data = previousStepsData.step2 || {};
      const step3Data = previousStepsData.step3 || {};
      const step4Data = previousStepsData.step4 || {};
      const step5Data = previousStepsData.step5 || {};
      const step6Data = previousStepsData.step6 || {};
      const step7Data = previousStepsData.step7 || {};
      const step8Data = previousStepsData.step8 || {};

      // Build summary of all previous steps data
      const previousStepsSummary = [];
      if (previousStepsData.step1) previousStepsSummary.push(`Step 1: Basic Cluster Details - ${clusterName}${district ? ` in ${district}` : ''}${natureOfBusiness ? ` (${natureOfBusiness})` : ''}`);
      if (previousStepsData.step2) previousStepsSummary.push(`Step 2: Sector Overview - ${step2Data.sectorType || 'Sector information available'}`);
      if (previousStepsData.step3) previousStepsSummary.push(`Step 3: District Profile - ${step3Data.geography ? 'Geographical and infrastructure details available' : 'District information available'}`);
      if (previousStepsData.step4) previousStepsSummary.push(`Step 4: Cluster Profile - ${step4Data.yearOfEstablishment ? `Established ${step4Data.yearOfEstablishment}` : 'Cluster details available'}`);
      if (previousStepsData.step5) previousStepsSummary.push(`Step 5: Value Chain - ${step5Data.finalProducts ? 'Value chain mapped' : 'Value chain details available'}`);
      if (previousStepsData.step6) previousStepsSummary.push(`Step 6: Market Assessment - Market analysis completed`);
      if (previousStepsData.step7) previousStepsSummary.push(`Step 7: Gap Analysis - Gaps identified`);
      if (previousStepsData.step8) previousStepsSummary.push(`Step 8: SWOT Analysis - Strengths, weaknesses, opportunities, threats analyzed`);

      // Identify which fields are already filled and which are empty
      const filledFields: string[] = [];
      const emptyFields: string[] = [];

      stepMapping.fields.forEach(fieldInfo => {
        const fieldName = fieldInfo.name;
        const fieldValue = currentStepData[fieldName];
        if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '' &&
          !(Array.isArray(fieldValue) && fieldValue.length === 0)) {
          filledFields.push(fieldName);
        } else {
          emptyFields.push(fieldName);
        }
      });

      // Special handling for Step 1 - use clusterName, location, district as context
      // Generate context if ANY of the three key fields are present
      const hasStep1Context = currentStep === 1 && (clusterName || location || district);
      const step1Context = hasStep1Context
        ? `\n═══════════════════════════════════════════════════════════════
CLUSTER CONTEXT (Use this information to generate suggestions):
═══════════════════════════════════════════════════════════════
${clusterName ? `Cluster Name: ${clusterName}` : 'Cluster Name: (not provided)'}
${location ? `Location: ${location}` : 'Location: (not provided)'}
${district ? `District: ${district}` : 'District: (not provided)'}

CRITICAL: Use the provided cluster information as the PRIMARY CONTEXT for generating ALL suggestions. All field suggestions should be relevant and specific to this cluster.
${clusterName ? `The cluster name is "${clusterName}"` : 'Use the location and district information'}${location ? ` located in ${location}` : ''}${district ? `, ${district} district` : ''}.

For example:
- "Geographical Spread" should describe the geographical area covered by ${clusterName || 'the cluster'}${location ? ` in ${location}` : ''}${district ? `, ${district}` : ''}
- "Nature of Business" should be inferred from ${clusterName ? `the cluster name "${clusterName}"` : 'the location and district context'} if not already provided
- "Major Products" should be relevant to what ${clusterName || 'this cluster'} typically produces
- Enterprise counts, investment, turnover should be realistic estimates for ${clusterName ? `a cluster named "${clusterName}"` : 'this type of cluster'}
- Market served percentages should be appropriate for ${clusterName || 'the cluster'}${location ? ` in ${location}` : ''}${district ? `, ${district}` : ''}
`
        : '';
      
      // Debug logging for Step 1
      if (currentStep === 1) {
        console.log('🔍 Step 1 AI Suggestions Debug:', {
          hasStep1Context,
          clusterName: clusterName || '(empty)',
          location: location || '(empty)',
          district: district || '(empty)',
          currentStepDataKeys: Object.keys(currentStepData || {}),
          step1ContextLength: step1Context.length,
        });
      }

      const prompt = `You are an expert consultant helping create a Detailed Project Report (DPR) for an MSME cluster.

═══════════════════════════════════════════════════════════════
CURRENT STEP TO COMPLETE:
═══════════════════════════════════════════════════════════════
Step Number: ${currentStep}
Step Name: "${stepMapping.stepName}"
Required Fields: ${stepMapping.fields.map(f => f.name).join(', ')}
${step1Context}═══════════════════════════════════════════════════════════════
COMPLETED PREVIOUS STEPS (${previousStepsSummary.length} steps):
═══════════════════════════════════════════════════════════════
${previousStepsSummary.length > 0 ? previousStepsSummary.join('\n') : currentStep === 1 ? 'This is Step 1 - no previous steps completed yet' : 'No previous steps completed'}

${currentStep > 1 ? `═══════════════════════════════════════════════════════════════
COMPREHENSIVE DATA FROM ALL PREVIOUS STEPS:
═══════════════════════════════════════════════════════════════
IMPORTANT: Read and analyze ALL the data below carefully. This contains complete information from Steps 1-${currentStep - 1}.

${contextText}` : ''}

═══════════════════════════════════════════════════════════════
CURRENT STEP DATA (what user has filled so far):
═══════════════════════════════════════════════════════════════
${currentStepText}

═══════════════════════════════════════════════════════════════
FIELD STATUS:
═══════════════════════════════════════════════════════════════
FILLED FIELDS: ${filledFields.length > 0 ? filledFields.join(', ') : 'None'}
EMPTY FIELDS (PRIORITY): ${emptyFields.length > 0 ? emptyFields.join(', ') : 'All fields are filled'}

═══════════════════════════════════════════════════════════════
TASK:
═══════════════════════════════════════════════════════════════
Provide suggestions for ALL ${stepMapping.fields.length} fields in Step ${currentStep}: "${stepMapping.stepName}".

MANDATORY REQUIREMENT: You MUST provide exactly ${stepMapping.fields.length} suggestions - one for EACH field:
${stepMapping.fields.map((f, idx) => `${idx + 1}. ${f.name} (${f.type})`).join('\n')}

CRITICAL REQUIREMENTS:

1. **MANDATORY: SUGGEST ALL FIELDS**
   - You MUST provide suggestions for EVERY field in Step ${currentStep}
   - Total fields to suggest: ${stepMapping.fields.length}
   - Field list: ${stepMapping.fields.map(f => `${f.name} (${f.type})`).join(', ')}
   - Provide ONE suggestion per field - NO EXCEPTIONS
   - If a field is already filled, suggest improvements or additional details based on previous steps

2. **ANALYZE CONTEXT DATA COMPREHENSIVELY:**
   ${currentStep === 1 
     ? `   - This is STEP 1 - you have the CLUSTER CONTEXT provided above (Cluster Name: "${clusterName}"${location ? `, Location: ${location}` : ''}${district ? `, District: ${district}` : ''})
   - Use the cluster name "${clusterName}" as the PRIMARY BASIS for generating ALL suggestions
   - For each field, think: "What would be appropriate for a cluster named '${clusterName}'${location ? ` located in ${location}` : ''}${district ? `, ${district} district` : ''}?"
   - Make suggestions SPECIFIC to "${clusterName}" - not generic
   - If cluster name suggests a specific industry/product (e.g., "Cherry Farming", "Coir", "Handicrafts"), use that to infer nature of business, major products, etc.
   - Use location and district to make geographical spread suggestions more accurate
   - Generate realistic, context-appropriate suggestions based on the cluster name and location`
     : `   - You have been provided with COMPLETE data from ALL previous steps (Steps 1-${currentStep - 1})
   - Read through ALL the "COMPREHENSIVE DATA FROM ALL PREVIOUS STEPS" section above
   - Extract and use relevant information from:
     * Step 1: Cluster basics (${clusterName}${district ? ` in ${district}` : ''}, ${natureOfBusiness}, ${majorProducts}, ${totalEnterprises} enterprises)
     ${previousStepsData.step2 ? `     * Step 2: Sector overview (${step2Data.sectorType || 'sector type'}, ${step2Data.nationalImportance ? 'national/state importance' : 'sector description'})` : ''}
     ${previousStepsData.step3 ? `     * Step 3: District/regional profile (geography, infrastructure, connectivity)` : ''}
     ${previousStepsData.step4 ? `     * Step 4: Cluster profile (establishment, evolution, capacity, technology)` : ''}
     ${previousStepsData.step5 ? `     * Step 5: Value chain (raw materials, products, buyers)` : ''}
     ${previousStepsData.step6 ? `     * Step 6: Market assessment (demand, competition, pricing)` : ''}
     ${previousStepsData.step7 ? `     * Step 7: Gap analysis (technology, infrastructure, skills gaps)` : ''}
     ${previousStepsData.step8 ? `     * Step 8: SWOT analysis (strengths, weaknesses, opportunities, threats)` : ''}
   - DO NOT rely only on Step 1. Use information from ALL relevant previous steps
   - Cross-reference data across steps to provide accurate suggestions`}

3. **FIELD-SPECIFIC FOCUS:**
   - Focus ONLY on fields in Step ${currentStep}: ${stepMapping.fields.map(f => f.name).join(', ')}
   - Each suggestion must target ONE specific field from the list above
   - Do NOT suggest fields from other steps
   - IMPORTANT: Consider the FIELD TYPE when making suggestions:
     * For NUMBER fields (yearOfEstablishment, investmentPerUnit, etc.): Suggest actual numbers derived from previous steps
     * For ARRAY fields (stakeholders, keyProducts, rawMaterials, valueAdditionStages, etc.): Suggest list items based on data from previous steps
     * For TEXT fields: Suggest detailed paragraphs derived from previous step information
     * For SHORTTEXT fields: Suggest concise phrases (10-15 words max) based on previous steps
     * For OBJECT fields: Suggest structured data matching the EXACT expected format, derived from previous steps
       ${currentStep === 1 ? `
       CRITICAL FOR STEP 1 OBJECT FIELDS - USE THESE EXACT FORMATS:
       - enterpriseCount: MUST be {"micro": <number>, "small": <number>, "medium": <number>}
         Example: {"micro": 15, "small": 8, "medium": 2}
       - ageOfEnterprises: MUST be {"lessThan5": <number>, "between5And10": <number>, "moreThan10": <number>}
         Example: {"lessThan5": 10, "between5And10": 8, "moreThan10": 5}
       - employmentPerUnit: MUST be {"lessThan5": <number>, "between5And10": <number>, "moreThan10": <number>}
         Example: {"lessThan5": 12, "between5And10": 8, "moreThan10": 5}
       - marketServed: MUST be {"domestic": <number>, "export": <number>} where numbers are percentages (0-100)
         Example: {"domestic": 75, "export": 25}
       DO NOT use alternative field names or structures. Use ONLY the exact field names specified above.` : ''}

4. **PRIORITIZE EMPTY FIELDS:**
   - EMPTY fields (priority): ${emptyFields.length > 0 ? emptyFields.join(', ') : 'None - all fields are filled'}
   - FILLED fields: ${filledFields.length > 0 ? filledFields.join(', ') : 'None'}
   - For EMPTY fields: Provide comprehensive suggestions to fill them
   - For FILLED fields: Provide suggestions to improve, expand, or enhance existing content

5. **EACH SUGGESTION MUST:**
   - Reference SPECIFIC data from relevant previous steps (quote actual values when possible)
   - Show how information from previous steps connects to the current field
   - Be actionable and specific (tell user exactly what to write based on field type and previous step data)
   - Be accurate and consistent with ALL information from previous steps
   - Use actual cluster name "${clusterName}", district "${district}", nature of business "${natureOfBusiness}", products "${majorProducts}" in suggestions

6. **ACCURACY REQUIREMENTS:**
   - Suggestions must be accurate and specific to: ${clusterName}${district ? ` in ${district}` : ''}${natureOfBusiness ? ` - ${natureOfBusiness}` : ''}
   - Ensure consistency with ALL information from previous steps
   - Do not contradict data from previous steps
   - Build logically on information from earlier steps

Return suggestions in JSON format with EXACTLY ${stepMapping.fields.length} suggestions:
{
  "suggestions": [
    ${stepMapping.fields.map(f => `{
      "field": "${f.name}",
      "suggestion": "specific, actionable guidance for ${f.name} (${f.type}) that references actual data from relevant previous steps (use actual values like '${clusterName}', '${natureOfBusiness}', '${majorProducts}', etc.)",
      "reasoning": "explain why this field is important and how specific data from previous steps (mention which steps) relates to it"
    }`).join(',\n    ')}
  ]
}

CRITICAL: You MUST return exactly ${stepMapping.fields.length} suggestions - one for each field: ${stepMapping.fields.map(f => f.name).join(', ')}`;

      // Use OpenAI chat completions directly
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert consultant helping create Detailed Project Reports (DPR) for MSME clusters. 

Your task is to analyze ALL data from previous steps (Steps 1-${currentStep - 1}) and provide field-specific suggestions for Step ${currentStep}.

CRITICAL: 
- Carefully read and understand ALL previous steps data provided
- Use information from ALL completed steps, not just Step 1
- Each suggestion must reference specific data from relevant previous steps
- Provide accurate, contextual suggestions that connect previous step data to current step fields

Return suggestions in JSON format only.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000, // Increased to handle suggestions for all fields
      });

      const responseText = response.choices[0]?.message?.content || '';

      // Parse JSON response
      try {
        if (responseText) {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            let aiSuggestions = parsed.suggestions || [];
            
            // Filter out excluded fields
            if (excludeFields.length > 0) {
              aiSuggestions = aiSuggestions.filter((s: any) => !excludeFields.includes(s.field));
            }
            
            // Validate that we have suggestions for all fields (excluding excluded ones)
            const suggestedFields = new Set(aiSuggestions.map((s: any) => s.field));
            const allFields = stepMapping.fields.map(f => f.name).filter(f => !excludeFields.includes(f));
            const missingFields = allFields.filter(f => !suggestedFields.has(f));
            
            if (missingFields.length > 0) {
              console.log(`⚠️ AI did not provide suggestions for all fields. Missing: ${missingFields.join(', ')}`);
              // Add fallback suggestions for missing fields
              missingFields.forEach(field => {
                const fieldInfo = stepMapping.fields.find(f => f.name === field);
                aiSuggestions.push({
                  field,
                  suggestion: `Fill in the ${field} field (${fieldInfo?.type || 'field'}) based on ${clusterName}${district ? ` in ${district}` : ''}${natureOfBusiness ? ` (${natureOfBusiness})` : ''} data from all previous steps.`,
                  reasoning: 'Ensure consistency with all previous step data.',
                });
              });
            }
            
            // Normalize suggestions to ensure suggestion and reasoning are strings
            const normalizedSuggestions = aiSuggestions.map((s: any) => ({
              field: s.field || '',
              suggestion: typeof s.suggestion === 'string' 
                ? s.suggestion 
                : typeof s.suggestion === 'object' 
                  ? JSON.stringify(s.suggestion, null, 2)
                  : String(s.suggestion || ''),
              reasoning: typeof s.reasoning === 'string'
                ? s.reasoning
                : typeof s.reasoning === 'object'
                  ? JSON.stringify(s.reasoning, null, 2)
                  : String(s.reasoning || ''),
            }));
            
            // Sort suggestions to match the field order in stepMapping
            const fieldOrder = new Map(stepMapping.fields.map((f, idx) => [f.name, idx]));
            normalizedSuggestions.sort((a: any, b: any) => {
              const orderA = fieldOrder.get(a.field) ?? 999;
              const orderB = fieldOrder.get(b.field) ?? 999;
              return orderA - orderB;
            });
            
            // If we have suggestions, return them; otherwise fall through to fallback
            if (normalizedSuggestions.length > 0) {
              console.log(`✅ Returning ${normalizedSuggestions.length} AI suggestions for step ${currentStep}`);
              return normalizedSuggestions;
            } else {
              console.log(`⚠️ AI returned empty suggestions for step ${currentStep}, using fallback`);
            }
          }
        }
      } catch (parseError) {
        console.error('Error parsing AI suggestions:', parseError);
        console.log(`⚠️ Failed to parse AI response for step ${currentStep}, using fallback`);
      }

      // Fallback: return field-specific suggestions based on all previous step data
      // Note: step1Data, clusterName, district, natureOfBusiness, majorProducts, emptyFields, and filledFields
      // are already declared and calculated above - reuse them here

      // Generate field-specific fallback suggestions for ALL fields
      const fallbackSuggestions = [];

      // Generate suggestions for ALL fields (not just empty ones), excluding excluded fields
      // This ensures we always provide suggestions for every field
      const fieldsToSuggest = stepMapping.fields.map(f => f.name).filter(f => !excludeFields.includes(f));

      fieldsToSuggest.forEach(field => {
        let suggestion = '';
        let reasoning = '';

        // Field-specific suggestions based on step - use all previous step data
        // Reuse variables already declared above (clusterName, district, natureOfBusiness, majorProducts)
        if (currentStep === 1) {
          // Step 1 specific suggestions using clusterName, location, district as context
          if (field === 'geographicalSpread') {
            suggestion = `Describe the geographical spread of ${clusterName}${location ? ` located in ${location}` : ''}${district ? `, ${district} district` : ''}. Include the villages, towns, or areas covered by this cluster.`;
            reasoning = `Based on the cluster name "${clusterName}"${location ? ` and location ${location}` : ''}${district ? ` in ${district} district` : ''}, provide a detailed geographical description.`;
          } else if (field === 'natureOfBusiness') {
            suggestion = `Based on the cluster name "${clusterName}", specify the nature of business. For example, if the name contains "Farming", it's likely agriculture-related; if "Coir", it's coir processing; if "Handicrafts", it's handicraft manufacturing.`;
            reasoning = `The nature of business should align with what "${clusterName}" suggests.`;
          } else if (field === 'majorProducts') {
            suggestion = `Based on the cluster name "${clusterName}"${location ? ` in ${location}` : ''}${district ? `, ${district}` : ''}, list the major products this cluster typically produces. For example, "Cherry Farming Cluster" would produce cherries; "Coir Cluster" would produce coir products.`;
            reasoning = `Major products should be relevant to what "${clusterName}" typically produces.`;
          } else if (field === 'enterpriseCount') {
            suggestion = `Provide realistic enterprise counts for ${clusterName}. Typical cluster sizes range from 10-50 micro enterprises, 5-20 small enterprises, and 0-10 medium enterprises.`;
            reasoning = `Enterprise counts should be realistic for a cluster named "${clusterName}".`;
          } else if (field === 'ageOfEnterprises') {
            suggestion = `Provide age distribution of enterprises in ${clusterName}. Typically, clusters have a mix of new (<5 years), established (5-10 years), and mature (>10 years) enterprises.`;
            reasoning = `Age distribution helps understand the cluster's maturity.`;
          } else if (field === 'employmentPerUnit') {
            suggestion = `Provide employment per unit for ${clusterName}. Micro enterprises typically employ <5 people, small enterprises 5-10, and medium enterprises >10.`;
            reasoning = `Employment figures should be realistic for the cluster size.`;
          } else if (field === 'investmentPerUnit') {
            suggestion = `Provide investment per unit for ${clusterName}. Typical ranges: Micro (₹5-20 Lakhs), Small (₹20-50 Lakhs), Medium (₹50-200 Lakhs).`;
            reasoning = `Investment should be appropriate for the cluster type.`;
          } else if (field === 'turnoverPerUnit') {
            suggestion = `Provide turnover per unit for ${clusterName}. Typical ranges: Micro (₹10-50 Lakhs), Small (₹50-200 Lakhs), Medium (₹200-500 Lakhs).`;
            reasoning = `Turnover should be realistic for the cluster's scale.`;
          } else if (field === 'marketServed') {
            suggestion = `Provide market served percentages for ${clusterName}${location ? ` in ${location}` : ''}${district ? `, ${district}` : ''}. Most clusters serve 60-80% domestic and 20-40% export markets.`;
            reasoning = `Market served should reflect typical patterns for this type of cluster.`;
          } else {
            suggestion = `Fill in the ${field} field based on ${clusterName}${location ? ` located in ${location}` : ''}${district ? `, ${district} district` : ''}. Use the cluster name as context to make appropriate suggestions.`;
            reasoning = `Suggestions should be specific to "${clusterName}".`;
          }
        } else if (currentStep === 2) {
          if (field === 'sectorType') {
            suggestion = `Based on the nature of business "${natureOfBusiness}" from Step 1, specify the sector type (e.g., Agro-processing, Manufacturing, Handicrafts).`;
            reasoning = 'The sector type should align with the nature of business identified in Step 1.';
          } else if (field === 'sectorDescription') {
            suggestion = `Describe the ${natureOfBusiness || 'sector'} sector in detail, focusing on ${clusterName}${district ? ` in ${district}` : ''}. Include characteristics, significance, and how it relates to the cluster's major products: ${majorProducts || 'products from Step 1'}.`;
            reasoning = 'A detailed sector description helps establish the context and importance of the cluster.';
          } else if (field === 'nationalImportance') {
            suggestion = `Explain why the ${natureOfBusiness || 'sector'} sector is important at the national level. Consider contribution to GDP, employment, exports, food security, or other national priorities.`;
            reasoning = 'National importance demonstrates the broader significance of supporting this cluster.';
          } else if (field === 'stateLevelImportance') {
            suggestion = `Describe the significance of the ${natureOfBusiness || 'sector'} sector for ${district ? `the state, particularly ${district}` : 'the state'}. Include state-level economic impact, employment generation, and alignment with state development goals.`;
            reasoning = 'State-level importance shows how the cluster contributes to regional development.';
          } else if (field === 'keyProducts') {
            suggestion = `List the key products from Step 1: "${majorProducts || 'products'}" and expand with additional products relevant to ${natureOfBusiness || 'the sector'}.`;
            reasoning = 'Key products should align with the major products identified in Step 1.';
          }
        } else {
          // Generic fallback for other steps - reference all previous steps
          suggestion = `Fill in the ${field} field based on ${clusterName}${district ? ` in ${district}` : ''}${natureOfBusiness ? ` (${natureOfBusiness})` : ''} data from previous steps. Consider all information from Steps 1-${currentStep - 1}.`;
          reasoning = 'Ensure consistency with all previous step data.';
        }

        if (suggestion) {
          fallbackSuggestions.push({
            field,
            suggestion,
            reasoning,
          });
        }
      });

      // Ensure we have suggestions for all fields
      // If we're missing any, add generic suggestions for them
      const suggestedFields = new Set(fallbackSuggestions.map(s => s.field));
      const missingFields = fieldsToSuggest.filter(f => !suggestedFields.has(f));
      
      missingFields.forEach(field => {
        const fieldInfo = stepMapping.fields.find(f => f.name === field);
        fallbackSuggestions.push({
          field,
          suggestion: `Fill in the ${field} field (${fieldInfo?.type || 'field'}) based on ${clusterName}${district ? ` in ${district}` : ''}${natureOfBusiness ? ` (${natureOfBusiness})` : ''} data from all previous steps. Consider all information from Steps 1-${currentStep - 1}.`,
          reasoning: 'Ensure consistency with all previous step data.',
        });
      });

      // Normalize suggestions to ensure suggestion and reasoning are strings
      const normalizedFallbackSuggestions = fallbackSuggestions.map((s: any) => ({
        field: s.field || '',
        suggestion: typeof s.suggestion === 'string' 
          ? s.suggestion 
          : typeof s.suggestion === 'object' 
            ? JSON.stringify(s.suggestion, null, 2)
            : String(s.suggestion || ''),
        reasoning: typeof s.reasoning === 'string'
          ? s.reasoning
          : typeof s.reasoning === 'object'
            ? JSON.stringify(s.reasoning, null, 2)
            : String(s.reasoning || ''),
      }));

      // Sort suggestions to match the field order in stepMapping
      const fieldOrder = new Map(stepMapping.fields.map((f, idx) => [f.name, idx]));
      normalizedFallbackSuggestions.sort((a, b) => {
        const orderA = fieldOrder.get(a.field) ?? 999;
        const orderB = fieldOrder.get(b.field) ?? 999;
        return orderA - orderB;
      });

      return normalizedFallbackSuggestions;
    } catch (error: any) {
      console.error('Error getting AI suggestions:', error);
      return [];
    }
  }

  /**
   * Get step-specific guidance for AI suggestions
   */
  private static getStepSpecificGuidance(step: number): string {
    const guidanceMap: Record<number, string> = {
      2: 'Focus on sector overview that relates to the cluster type and products mentioned in Step 1.',
      3: 'Connect district and regional profile with the location and geographical spread from Step 1.',
      4: 'Reference the cluster name, enterprise count, and business nature from Step 1.',
      5: 'Link value chain details with the major products and nature of business from Step 1.',
      6: 'Consider market assessment based on the cluster\'s products and market served percentages from Step 1.',
      7: 'Identify gaps that are relevant to the cluster\'s current state described in Step 1.',
      8: 'Analyze SWOT considering the cluster\'s strengths and characteristics from Step 1.',
      9: 'Propose interventions that address the cluster\'s specific needs identified in previous steps.',
      10: 'Design CFC details that align with the cluster\'s production capacity and requirements from Step 1.',
      11: 'Structure SPV details considering the cluster name and enterprise count from Step 1.',
      12: 'Estimate project costs based on the cluster\'s scale and investment per unit from Step 1.',
      13: 'Plan financing considering the cluster\'s financial capacity from Step 1.',
      14: 'Calculate operating costs and revenue based on turnover per unit and production capacity from Step 1.',
      15: 'Assess financial viability using the cluster\'s financial metrics from Step 1.',
      16: 'Schedule implementation considering the cluster\'s current state and requirements.',
      17: 'Project impact based on the cluster\'s current employment and turnover from Step 1.',
      18: 'Include documents relevant to the cluster\'s registration and legal status.',
    };

    return guidanceMap[step] || 'Ensure all information is consistent with data from Step 1.';
  }

  /**
   * Get field-specific suggestion
   */
  static async getFieldSuggestion(
    fieldName: string,
    fieldValue: any,
    context: Record<string, any>
  ): Promise<string | null> {
    try {
      const contextText = this.formatStepDataAsText(context);

      const prompt = `You are helping fill a DPR form field.

Field name: ${fieldName}
Current value: ${fieldValue || '(empty)'}

Context from other fields:
${contextText}

Provide a brief, helpful suggestion (1-2 sentences) for filling this field based on the context.
Return only the suggestion text, no JSON or formatting.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant providing suggestions for filling DPR form fields.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      const responseText = response.choices[0]?.message?.content || '';
      return responseText.trim() || null;
    } catch (error: any) {
      console.error('Error getting field suggestion:', error);
      return null;
    }
  }

  /**
   * Generate actual content for a field based on suggestion and context
   */
  static async generateFieldContent(
    fieldName: string,
    currentStep: number,
    currentStepData: any,
    previousStepsData: Record<string, any>,
    suggestion: string
  ): Promise<string | null> {
    try {
      // Get step field mapping
      const stepMapping = STEP_FIELDS_MAPPING[currentStep];
      if (!stepMapping) {
        console.log(`No field mapping found for step ${currentStep}`);
        return null;
      }

      // Build context from all previous steps
      const contextText = this.formatStepDataAsText(previousStepsData);
      const currentStepText = this.formatStepDataAsText({ [`step${currentStep}`]: currentStepData });

      // Extract Step 1 key information
      const step1Data = previousStepsData.step1 || {};
      const clusterName = step1Data.clusterName || '';
      const district = step1Data.district || '';
      const natureOfBusiness = step1Data.natureOfBusiness || '';
      const majorProducts = step1Data.majorProducts || '';

      // Get field info to determine the expected format
      const fieldInfo = stepMapping.fields.find(f => f.name === fieldName);
      const fieldType = fieldInfo?.type || 'text';
      const sampleValue = fieldInfo?.sampleValue || '';

      // Determine format instructions based on field type and sample value
      let formatInstructions = '';
      
      // Special handling for Step 1 object fields
      if (currentStep === 1 && fieldType === 'object') {
        if (fieldName === 'enterpriseCount') {
          formatInstructions = `
CRITICAL FORMAT FOR enterpriseCount:
- Return a JSON object with EXACTLY these keys: "micro", "small", "medium"
- Each value must be a number (integer)
- Example: {"micro": 15, "small": 8, "medium": 2}
- Generate realistic counts based on cluster size and nature of business
- Return ONLY the JSON object, no explanations`;
        } else if (fieldName === 'ageOfEnterprises') {
          formatInstructions = `
CRITICAL FORMAT FOR ageOfEnterprises:
- Return a JSON object with EXACTLY these keys: "lessThan5", "between5And10", "moreThan10"
- Each value must be a number (integer) representing count of enterprises
- Example: {"lessThan5": 10, "between5And10": 8, "moreThan10": 5}
- Generate realistic distribution based on cluster maturity
- Return ONLY the JSON object, no explanations`;
        } else if (fieldName === 'employmentPerUnit') {
          formatInstructions = `
CRITICAL FORMAT FOR employmentPerUnit:
- Return a JSON object with EXACTLY these keys: "lessThan5", "between5And10", "moreThan10"
- Each value must be a number (integer) representing count of units
- Example: {"lessThan5": 12, "between5And10": 8, "moreThan10": 5}
- Generate realistic distribution based on enterprise sizes
- Return ONLY the JSON object, no explanations`;
        } else if (fieldName === 'marketServed') {
          formatInstructions = `
CRITICAL FORMAT FOR marketServed:
- Return a JSON object with EXACTLY these keys: "domestic", "export"
- Each value must be a number (0-100) representing percentage
- Values should add up to 100 (or close to it)
- Example: {"domestic": 75, "export": 25}
- Generate realistic percentages based on cluster type and location
- Return ONLY the JSON object, no explanations`;
        } else {
          formatInstructions = `
CRITICAL FORMAT FOR ${fieldName}:
- Return a JSON object matching the sample format: ${sampleValue}
- Return ONLY the JSON object, no explanations`;
        }
      } else if (fieldType === 'array') {
        if (sampleValue.includes('{"') || sampleValue.includes('{name') || sampleValue.includes('{stage')) {
          // Structured array (objects)
          if (fieldName === 'valueAdditionStages') {
            formatInstructions = `
CRITICAL FORMAT FOR valueAdditionStages:
- Return a JSON array of objects with "stage" and "sellingPrice" properties
- Each object must have: {"stage": "Stage description", "sellingPrice": number}
- Example: [{"stage": "Sourcing Raw Materials", "sellingPrice": 0}, {"stage": "Cleaning and Drying", "sellingPrice": 0}]
- Generate 5-7 stages based on the cluster's value chain
- sellingPrice can be 0 if not specified, or provide realistic prices in rupees
- Return ONLY the JSON array, no explanations`;
          } else if (fieldName === 'rawMaterials') {
            formatInstructions = `
CRITICAL FORMAT FOR rawMaterials:
- Return a JSON array of objects with "name" and "source" properties
- Each object must have: {"name": "Material name", "source": "Source location"}
- Example: [{"name": "Raw Chilli", "source": "Local farmers"}, {"name": "Packaging Material", "source": "Local suppliers"}]
- Generate 3-5 materials based on the cluster's production process
- Return ONLY the JSON array, no explanations`;
          } else if (fieldName === 'boardOfDirectors') {
            formatInstructions = `
CRITICAL FORMAT FOR boardOfDirectors:
- Return a JSON array of objects with "name" and "designation" properties
- Each object must have: {"name": "Director name", "designation": "Designation"}
- Example: [{"name": "John Doe", "designation": "Chairman"}, {"name": "Jane Smith", "designation": "Secretary"}]
- Generate 3-5 directors
- Return ONLY the JSON array, no explanations`;
          } else if (fieldName === 'shareholdingPattern') {
            formatInstructions = `
CRITICAL FORMAT FOR shareholdingPattern:
- Return a JSON array of objects with "stakeholder" and "percentage" properties
- Each object must have: {"stakeholder": "Stakeholder name", "percentage": number}
- Percentages should add up to 100
- Example: [{"stakeholder": "SPV Members", "percentage": 60}, {"stakeholder": "Government", "percentage": 40}]
- Return ONLY the JSON array, no explanations`;
          } else if (fieldName === 'memberUnits') {
            formatInstructions = `
CRITICAL FORMAT FOR memberUnits:
- Return a JSON array of objects with "name" and "registration" properties
- Each object must have: {"name": "Unit name", "registration": "Registration number"}
- Example: [{"name": "Unit 1", "registration": "REG001"}, {"name": "Unit 2", "registration": "REG002"}]
- Generate based on cluster enterprise count
- Return ONLY the JSON array, no explanations`;
          } else if (fieldName === 'milestones') {
            formatInstructions = `
CRITICAL FORMAT FOR milestones:
- Return a JSON array of objects with "activity", "timeRequired", "startDate", and "endDate" properties
- Each object must have: {"activity": "Activity name", "timeRequired": "X months", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD"}
- Example: [{"activity": "Land Acquisition", "timeRequired": "2 months", "startDate": "2024-01-01", "endDate": "2024-03-01"}]
- Return ONLY the JSON array, no explanations`;
          } else {
            // Simple array (strings)
            formatInstructions = `
CRITICAL FORMAT FOR ${fieldName}:
- Return a JSON array of strings
- Example: ["Item 1", "Item 2", "Item 3"]
- Generate 3-7 items based on the cluster context
- Return ONLY the JSON array, no explanations`;
          }
        } else {
          // Simple array (strings)
          formatInstructions = `
CRITICAL FORMAT FOR ${fieldName}:
- Return a JSON array of strings
- Example: ["Item 1", "Item 2", "Item 3"]
- Generate 3-7 items based on the cluster context
- Return ONLY the JSON array, no explanations`;
        }
      } else if (fieldType === 'number') {
        formatInstructions = `
CRITICAL FORMAT FOR ${fieldName}:
- Return ONLY a number (integer or float)
- No text, no units, no explanations
- Example: 500000 or 75.5`;
      } else {
        formatInstructions = `
CRITICAL FORMAT FOR ${fieldName}:
- Return a well-written paragraph or multiple paragraphs
- Be specific and reference actual data from previous steps
- Make it appropriate for a DPR document`;
      }

      const prompt = `You are an expert consultant helping create a Detailed Project Report (DPR) for an MSME cluster.

CURRENT STEP: Step ${currentStep} - ${stepMapping.stepName}
FIELD TO FILL: ${fieldName}
FIELD TYPE: ${fieldType}
CURRENT FIELD VALUE: ${currentStepData[fieldName] || '(empty)'}

CLUSTER INFORMATION FROM STEP 1:
- Cluster Name: ${clusterName}
- District: ${district}
- Nature of Business: ${natureOfBusiness}
- Major Products: ${majorProducts}

ALL PREVIOUS STEPS DATA:
${contextText}

CURRENT STEP DATA:
${currentStepText}

AI SUGGESTION FOR THIS FIELD:
${suggestion}

TASK: Generate actual content for the field "${fieldName}" in Step ${currentStep} based on:
1. The AI suggestion provided above
2. All previous steps data (especially Step 1)
3. The cluster context (${clusterName}${district ? ` in ${district}` : ''}${natureOfBusiness ? ` - ${natureOfBusiness}` : ''})

${formatInstructions}

Return only the field content, no JSON wrapper or additional text.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert consultant generating actual content for DPR form fields. Return only the content, no explanations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const responseText = response.choices[0]?.message?.content || '';
      return responseText.trim() || null;
    } catch (error: any) {
      console.error('Error generating field content:', error);
      return null;
    }
  }

  /**
   * Generate Financial Statements using AI based on project data
   */
  static async generateFinancialStatements(projectData: any): Promise<any> {
    try {
      const step12 = projectData.step12 || {};
      const step13 = projectData.step13 || {};
      const step14 = projectData.step14 || {};
      const step15 = projectData.step15 || {};

      // Extract key financial data
      const totalProjectCost = step12.totalProjectCost || 
        ((step12.land || 0) + (step12.building || 0) + (step12.machinery || 0) + 
         (step12.utilitiesAndInfrastructure || 0) + (step12.preliminaryAndPreOperative || 0) + 
         (step12.workingCapitalMargin || 0));

      const spvContribution = step13.spvContribution || 0;
      const governmentGrant = step13.governmentGrant || 0;
      const bankLoan = step13.bankLoan || 0;
      const workingCapital = step12.workingCapitalMargin || 0;
      const annualSales = step14.annualSalesRealization || 0;
      const annualProduction = step14.annualProductionVolume || 0;
      const rawMaterialCost = step14.rawMaterialCost || 0;
      const powerCost = step14.powerCost || 0;
      const wages = step14.wages || 0;

      const prompt = `You are a financial analyst expert in generating comprehensive financial statements for Cluster Development Projects under the Micro Cluster Development Programme.

Based on the following project data, generate all 12 financial statements with realistic, professional values:

PROJECT DATA:
- Total Project Cost: ₹${totalProjectCost.toFixed(2)} Lakhs
- SPV Contribution: ₹${spvContribution.toFixed(2)} Lakhs
- Government Grant: ₹${governmentGrant.toFixed(2)} Lakhs
- Bank Loan: ₹${bankLoan.toFixed(2)} Lakhs
- Working Capital: ₹${workingCapital.toFixed(2)} Lakhs
- Annual Sales Realization: ₹${annualSales.toFixed(2)} Lakhs
- Annual Production Volume: ${annualProduction} units
- Raw Material Cost: ₹${rawMaterialCost.toFixed(2)} Lakhs
- Power Cost: ₹${powerCost.toFixed(2)} Lakhs
- Wages: ₹${wages.toFixed(2)} Lakhs

Generate comprehensive financial statements for 5 years with the following structure:

1. Cost of Project & Means of Finance
2. Assessment of Working Capital (breakdown of working capital components)
3. Cost of Production & Profitability (5 years with sales, costs, and profit)
4. Assumptions for Cost of Production & Profitability
5. Estimation of Power Cost
6. Manpower Requirement & Estimation of Cost
7. Estimation of Depreciation (for building and machinery)
8. Calculation of Income Tax (5 years)
9. Projected Cash Flow Statement (5 years)
10. Projected Balance Sheet (5 years)
11. Estimation of Break Even Point (5 years)
12. Estimation of NPV & IRR

IMPORTANT:
- All values must be realistic and consistent
- Use industry-standard assumptions (e.g., depreciation rates: Building 10%, Machinery 15%)
- Show growth in sales and costs over 5 years (typically 5-10% growth)
- Calculate tax based on profit brackets (20-30%)
- Ensure all statements are mathematically consistent
- Use the exact project cost and financing structure provided

Return ONLY a valid JSON object with this structure:
{
  "costOfProject": number,
  "spvShare": number,
  "stateGovtGrant": number,
  "bankLoan": number,
  "workingCapital": {
    "rawMaterials": number,
    "workInProgress": number,
    "finishedGoods": number,
    "debtors": number,
    "cashBankBalance": number,
    "creditors": number
  },
  "costOfProduction": {
    "year1": { "salesRealization": number, "totalCost": number, "profitBeforeTax": number },
    "year2": { "salesRealization": number, "totalCost": number, "profitBeforeTax": number },
    "year3": { "salesRealization": number, "totalCost": number, "profitBeforeTax": number },
    "year4": { "salesRealization": number, "totalCost": number, "profitBeforeTax": number },
    "year5": { "salesRealization": number, "totalCost": number, "profitBeforeTax": number }
  },
  "assumptions": {
    "capacityUtilizationYear1": number,
    "capacityUtilizationYear2": number,
    "capacityUtilizationYear3Onwards": number,
    "rawMaterialCostPercentage": number
  },
  "powerCost": {
    "connectedLoad": number,
    "monthlyConsumption": number,
    "ratePerUnit": number,
    "annualCost": number
  },
  "manpower": [
    { "category": string, "count": number, "annualSalary": number, "totalCost": number }
  ],
  "depreciation": [
    { "asset": string, "cost": number, "rate": number, "annualDepreciation": number }
  ],
  "incomeTax": {
    "year1": { "profitBeforeTax": number, "taxRate": number, "taxAmount": number, "profitAfterTax": number },
    "year2": { "profitBeforeTax": number, "taxRate": number, "taxAmount": number, "profitAfterTax": number },
    "year3": { "profitBeforeTax": number, "taxRate": number, "taxAmount": number, "profitAfterTax": number },
    "year4": { "profitBeforeTax": number, "taxRate": number, "taxAmount": number, "profitAfterTax": number },
    "year5": { "profitBeforeTax": number, "taxRate": number, "taxAmount": number, "profitAfterTax": number }
  },
  "cashFlow": {
    "year1": { "inflow": number, "outflow": number, "netCashFlow": number },
    "year2": { "inflow": number, "outflow": number, "netCashFlow": number },
    "year3": { "inflow": number, "outflow": number, "netCashFlow": number },
    "year4": { "inflow": number, "outflow": number, "netCashFlow": number },
    "year5": { "inflow": number, "outflow": number, "netCashFlow": number }
  },
  "balanceSheet": {
    "year1": { "totalAssets": number, "totalLiabilities": number },
    "year2": { "totalAssets": number, "totalLiabilities": number },
    "year3": { "totalAssets": number, "totalLiabilities": number },
    "year4": { "totalAssets": number, "totalLiabilities": number },
    "year5": { "totalAssets": number, "totalLiabilities": number }
  },
  "breakEven": {
    "year1": { "fixedExpenses": number, "variableExpenses": number, "breakEvenPoint": number },
    "year2": { "fixedExpenses": number, "variableExpenses": number, "breakEvenPoint": number },
    "year3": { "fixedExpenses": number, "variableExpenses": number, "breakEvenPoint": number },
    "year4": { "fixedExpenses": number, "variableExpenses": number, "breakEvenPoint": number },
    "year5": { "fixedExpenses": number, "variableExpenses": number, "breakEvenPoint": number }
  },
  "npvIrr": {
    "npv": number,
    "irr": number,
    "discountRate": 8
  }
}

Return ONLY the JSON object, no markdown, no explanations.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a financial analyst expert in generating comprehensive financial statements for Cluster Development Projects. Generate realistic, mathematically consistent financial statements based on project data.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent financial calculations
        max_tokens: 4000,
      });

      const content = response.choices[0]?.message?.content || '{}';

      // Clean up the response
      let cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Try to parse JSON
      let financialStatements;
      try {
        financialStatements = JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error('Error parsing financial statements response:', parseError);
        // Fallback: create basic structure with calculated values
        financialStatements = this.createFallbackFinancialStatements(projectData);
      }

      return financialStatements;
    } catch (error: any) {
      console.error('Error generating financial statements:', error);
      // Return fallback structure
      return this.createFallbackFinancialStatements(projectData);
    }
  }

  /**
   * Create fallback financial statements structure
   */
  private static createFallbackFinancialStatements(projectData: any): any {
    const step12 = projectData.step12 || {};
    const step13 = projectData.step13 || {};
    const step14 = projectData.step14 || {};

    const totalProjectCost = step12.totalProjectCost || 
      ((step12.land || 0) + (step12.building || 0) + (step12.machinery || 0) + 
       (step12.utilitiesAndInfrastructure || 0) + (step12.preliminaryAndPreOperative || 0) + 
       (step12.workingCapitalMargin || 0));

    const workingCapital = step12.workingCapitalMargin || 0;
    const annualSales = step14.annualSalesRealization || 0;
    const buildingCost = step12.building || 0;
    const machineryCost = step12.machinery || 0;

    // Generate 5-year projections with growth
    const costOfProduction: any = {};
    const incomeTax: any = {};
    const cashFlow: any = {};
    const balanceSheet: any = {};
    const breakEven: any = {};

    for (let year = 1; year <= 5; year++) {
      const growthFactor = 1 + (year - 1) * 0.05; // 5% growth per year
      const sales = annualSales * growthFactor;
      const cost = sales * 0.75; // 75% cost ratio
      const profit = sales - cost;
      
      costOfProduction[`year${year}`] = {
        salesRealization: sales,
        totalCost: cost,
        profitBeforeTax: profit,
      };

      const taxRate = profit > 100 ? 30 : profit > 50 ? 25 : 20;
      const taxAmount = (profit * taxRate) / 100;
      const profitAfterTax = profit - taxAmount;

      incomeTax[`year${year}`] = {
        profitBeforeTax: profit,
        taxRate,
        taxAmount,
        profitAfterTax,
      };

      cashFlow[`year${year}`] = {
        inflow: profitAfterTax + (buildingCost * 0.1 + machineryCost * 0.15), // Profit + Depreciation
        outflow: cost * 0.2, // 20% of cost as outflow
        netCashFlow: profitAfterTax + (buildingCost * 0.1 + machineryCost * 0.15) - (cost * 0.2),
      };

      balanceSheet[`year${year}`] = {
        totalAssets: totalProjectCost + (profitAfterTax * year),
        totalLiabilities: (step13.bankLoan || 0) * (1 - (year - 1) * 0.1), // Decreasing loan
      };

      breakEven[`year${year}`] = {
        fixedExpenses: cost * 0.3,
        variableExpenses: cost * 0.7,
        breakEvenPoint: ((cost * 0.3) / (sales - cost * 0.7)) * 100,
      };
    }

    return {
      costOfProject: totalProjectCost,
      spvShare: step13.spvContribution || 0,
      stateGovtGrant: step13.governmentGrant || 0,
      bankLoan: step13.bankLoan || 0,
      workingCapital: {
        rawMaterials: workingCapital * 0.4,
        workInProgress: workingCapital * 0.2,
        finishedGoods: workingCapital * 0.2,
        debtors: workingCapital * 0.15,
        cashBankBalance: workingCapital * 0.05,
        creditors: workingCapital * 0.3,
      },
      costOfProduction,
      assumptions: {
        capacityUtilizationYear1: 60,
        capacityUtilizationYear2: 75,
        capacityUtilizationYear3Onwards: 85,
        rawMaterialCostPercentage: 40,
      },
      powerCost: {
        connectedLoad: 100,
        monthlyConsumption: 10000,
        ratePerUnit: 8,
        annualCost: (step14.powerCost || 0),
      },
      manpower: [
        {
          category: 'Executives',
          count: 2,
          annualSalary: 600000,
          totalCost: 1.2,
        },
        {
          category: 'Workers',
          count: 10,
          annualSalary: 240000,
          totalCost: 2.4,
        },
      ],
      depreciation: [
        {
          asset: 'Building',
          cost: buildingCost,
          rate: 10,
          annualDepreciation: buildingCost * 0.1,
        },
        {
          asset: 'Machinery',
          cost: machineryCost,
          rate: 15,
          annualDepreciation: machineryCost * 0.15,
        },
      ],
      incomeTax,
      cashFlow,
      balanceSheet,
      breakEven,
      npvIrr: {
        npv: totalProjectCost * 0.1, // 10% of project cost as NPV
        irr: 26,
        discountRate: 8,
      },
    };
  }
}
