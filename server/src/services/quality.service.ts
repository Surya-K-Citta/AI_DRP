// @ts-nocheck
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { DPRVersion } from '../models/DPRVersion.model';
import { Project } from '../models/Project.model';
import { MLService } from './ml.service';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface QualityAnalysisResult {
  score: number;
  feedback: string[];
  weakSections: string[];
  sectionScores: {
    executiveSummary: number;
    businessProfile: number;
    marketAnalysis: number;
    technicalFeasibility: number;
    financialProjections: number;
    conclusion: number;
  };
  recommendations: string[];
  detailedMetrics: {
    completeness: number;
    clarity: number;
    accuracy: number;
    bankability: number;
    professionalism: number;
  };
  sectionDetails: {
    [key: string]: {
      score: number;
      strengths: string[];
      weaknesses: string[];
      suggestions: string[];
    };
  };
}

export class QualityService {
  /**
   * Analyze DPR quality using NLP + rule-based validation
   */
  static async analyzeDPRQuality(dprId: string): Promise<QualityAnalysisResult> {
    try {
      const dpr = await DPRVersion.findById(dprId);
      if (!dpr) {
        throw new Error('DPR not found');
      }

      const project = await Project.findById(dpr.projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Rule-based validation
      const ruleBasedScores = this.ruleBasedValidation(dpr, project);

      // NLP-based analysis using OpenAI
      const nlpAnalysis = await this.nlpAnalysis(dpr, project);

      // Combine scores (70% rule-based, 30% NLP)
      const sectionScores = {
        executiveSummary: Math.round(ruleBasedScores.executiveSummary * 0.7 + nlpAnalysis.executiveSummary * 0.3),
        businessProfile: Math.round(ruleBasedScores.businessProfile * 0.7 + nlpAnalysis.businessProfile * 0.3),
        marketAnalysis: Math.round(ruleBasedScores.marketAnalysis * 0.7 + nlpAnalysis.marketAnalysis * 0.3),
        technicalFeasibility: Math.round(ruleBasedScores.technicalFeasibility * 0.7 + nlpAnalysis.technicalFeasibility * 0.3),
        financialProjections: Math.round(ruleBasedScores.financialProjections * 0.7 + nlpAnalysis.financialProjections * 0.3),
        conclusion: Math.round(ruleBasedScores.conclusion * 0.7 + nlpAnalysis.conclusion * 0.3),
      };

      // Calculate overall score
      const overallScore = Math.round(
        (sectionScores.executiveSummary * 0.15) +
        (sectionScores.businessProfile * 0.15) +
        (sectionScores.marketAnalysis * 0.20) +
        (sectionScores.technicalFeasibility * 0.15) +
        (sectionScores.financialProjections * 0.25) +
        (sectionScores.conclusion * 0.10)
      );

      // Identify weak sections (score < 70)
      const weakSections = Object.entries(sectionScores)
        .filter(([_, score]) => score < 70)
        .map(([section]) => this.formatSectionName(section));

      // Generate feedback
      const feedback = this.generateFeedback(sectionScores, nlpAnalysis.feedback, weakSections);

      // Generate recommendations
      const recommendations = this.generateRecommendations(sectionScores, weakSections, project);

      // Calculate detailed metrics
      const detailedMetrics = this.calculateDetailedMetrics(dpr, project, sectionScores);

      // Generate section details
      const sectionDetails = this.generateSectionDetails(sectionScores, nlpAnalysis, dpr);

      return {
        score: overallScore,
        feedback,
        weakSections,
        sectionScores,
        recommendations,
        detailedMetrics,
        sectionDetails,
      };
    } catch (error) {
      console.error('Error analyzing DPR quality:', error);
      throw new Error('Failed to analyze DPR quality');
    }
  }

  /**
   * Rule-based validation
   */
  private static ruleBasedValidation(dpr: any, project: any): any {
    const englishContent = dpr.content?.english || {};
    const teluguContent = dpr.content?.telugu || {};

    const sections = ['executiveSummary', 'businessProfile', 'marketAnalysis', 'technicalFeasibility', 'financialProjections', 'conclusion'];
    const scores: any = {};

    sections.forEach(section => {
      const enText = englishContent[section] || '';
      const teText = teluguContent[section] || '';
      
      let score = 0;

      // Length check (0-40 points)
      const avgLength = (enText.length + teText.length) / 2;
      if (avgLength >= 500) score += 40;
      else if (avgLength >= 300) score += 30;
      else if (avgLength >= 150) score += 20;
      else if (avgLength >= 50) score += 10;

      // Completeness check (0-30 points)
      if (enText.length > 100 && teText.length > 100) score += 30;
      else if (enText.length > 100 || teText.length > 100) score += 15;

      // Structure check (0-20 points)
      const sentences = enText.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
      if (sentences.length >= 5) score += 20;
      else if (sentences.length >= 3) score += 15;
      else if (sentences.length >= 1) score += 10;

      // Keyword presence (0-10 points)
      const keywords = this.getSectionKeywords(section);
      const keywordCount = keywords.filter(kw => 
        enText.toLowerCase().includes(kw.toLowerCase())
      ).length;
      score += Math.min(keywordCount * 2, 10);

      scores[section] = Math.min(score, 100);
    });

    return scores;
  }

  /**
   * NLP-based analysis using OpenAI
   */
  private static async nlpAnalysis(dpr: any, project: any): Promise<any> {
    const englishContent = dpr.content?.english || {};
    const sections = ['executiveSummary', 'businessProfile', 'marketAnalysis', 'technicalFeasibility', 'financialProjections', 'conclusion'];
    
    const prompt = `Analyze the quality of this DPR (Detailed Project Report) for a ${project.industrySector} project.

Evaluate each section on a scale of 0-100 based on:
1. Completeness and detail level
2. Professional language and clarity
3. Relevance to the business sector
4. Accuracy and logical consistency
5. Bankability and funding readiness

Sections to evaluate:
${sections.map((s, i) => `${i + 1}. ${this.formatSectionName(s)}: ${(englishContent[s] || '').substring(0, 500)}`).join('\n\n')}

Return a JSON object with:
{
  "executiveSummary": <score 0-100>,
  "businessProfile": <score 0-100>,
  "marketAnalysis": <score 0-100>,
  "technicalFeasibility": <score 0-100>,
  "financialProjections": <score 0-100>,
  "conclusion": <score 0-100>,
  "feedback": ["specific feedback point 1", "specific feedback point 2", ...]
}

Return only valid JSON without markdown formatting.`;

    try {
      // OPTIMIZATION: Use faster model and reduced tokens for quicker analysis
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Faster model - 3-4x speed improvement
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000, // Reduced for faster response
      });

      const content = response.choices[0]?.message?.content || '{}';
      const cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const analysis = JSON.parse(cleanedContent);
      
      return {
        executiveSummary: analysis.executiveSummary || 50,
        businessProfile: analysis.businessProfile || 50,
        marketAnalysis: analysis.marketAnalysis || 50,
        technicalFeasibility: analysis.technicalFeasibility || 50,
        financialProjections: analysis.financialProjections || 50,
        conclusion: analysis.conclusion || 50,
        feedback: analysis.feedback || [],
      };
    } catch (error) {
      console.error('Error in NLP analysis:', error);
      // Return default scores if NLP fails
      return {
        executiveSummary: 50,
        businessProfile: 50,
        marketAnalysis: 50,
        technicalFeasibility: 50,
        financialProjections: 50,
        conclusion: 50,
        feedback: [],
      };
    }
  }

  /**
   * Get section-specific keywords
   */
  private static getSectionKeywords(section: string): string[] {
    const keywordMap: Record<string, string[]> = {
      executiveSummary: ['summary', 'overview', 'project', 'investment', 'objective', 'purpose'],
      businessProfile: ['business', 'company', 'organization', 'sector', 'industry', 'location'],
      marketAnalysis: ['market', 'demand', 'competition', 'customer', 'trend', 'opportunity'],
      technicalFeasibility: ['technical', 'technology', 'process', 'equipment', 'machinery', 'feasibility'],
      financialProjections: ['financial', 'revenue', 'cost', 'profit', 'cash flow', 'projection', 'budget'],
      conclusion: ['conclusion', 'summary', 'recommendation', 'viability', 'feasible'],
    };
    return keywordMap[section] || [];
  }

  /**
   * Format section name for display
   */
  private static formatSectionName(section: string): string {
    return section
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Generate feedback messages
   */
  private static generateFeedback(sectionScores: any, nlpFeedback: string[], weakSections: string[]): string[] {
    const feedback: string[] = [];

    // Overall quality feedback
    const scoreValues = Object.values(sectionScores) as number[];
    const avgScore = scoreValues.reduce((a: number, b: number) => a + b, 0) / scoreValues.length;
    if (avgScore >= 85) {
      feedback.push('Excellent DPR quality! Your report is comprehensive and bank-ready.');
    } else if (avgScore >= 70) {
      feedback.push('Good DPR quality. Minor improvements recommended for better bankability.');
    } else if (avgScore >= 50) {
      feedback.push('Moderate DPR quality. Several sections need enhancement for approval.');
    } else {
      feedback.push('DPR needs significant improvement. Multiple sections are incomplete or weak.');
    }

    // Section-specific feedback
    Object.entries(sectionScores).forEach(([section, score]: [string, any]) => {
      if (score < 70) {
        feedback.push(`${this.formatSectionName(section)}: Score ${score}/100 - Needs improvement`);
      }
    });

    // Add NLP feedback
    feedback.push(...nlpFeedback.slice(0, 3));

    return feedback;
  }

  /**
   * Generate recommendations
   */
  private static generateRecommendations(sectionScores: any, weakSections: string[], project: any): string[] {
    const recommendations: string[] = [];

    if (sectionScores.marketAnalysis < 70) {
      recommendations.push('Add more competitor data in Market Analysis section');
    }

    if (sectionScores.financialProjections < 70) {
      recommendations.push('Enhance financial projections with detailed 3-5 year forecasts');
    }

    if (sectionScores.technicalFeasibility < 70) {
      recommendations.push('Provide more technical details and equipment specifications');
    }

    if (sectionScores.businessProfile < 70) {
      recommendations.push('Expand business profile with more company background and structure');
    }

    if (weakSections.length > 0) {
      recommendations.push(`Focus on improving: ${weakSections.join(', ')}`);
    }

    return recommendations;
  }

  /**
   * Calculate detailed quality metrics
   */
  private static calculateDetailedMetrics(dpr: any, project: any, sectionScores: any): any {
    const englishContent = dpr.content?.english || {};
    const sections = ['executiveSummary', 'businessProfile', 'marketAnalysis', 'technicalFeasibility', 'financialProjections', 'conclusion'];
    
    // Completeness: Check if all sections have content
    const sectionsWithContent = sections.filter(s => {
      const content = englishContent[s] || '';
      return content.length > 100;
    });
    const completeness = Math.round((sectionsWithContent.length / sections.length) * 100);

    // Clarity: Average section scores (weighted by importance)
    const clarity = Math.round(
      (sectionScores.executiveSummary * 0.15 +
       sectionScores.businessProfile * 0.15 +
       sectionScores.marketAnalysis * 0.20 +
       sectionScores.technicalFeasibility * 0.15 +
       sectionScores.financialProjections * 0.25 +
       sectionScores.conclusion * 0.10)
    );

    // Accuracy: Check for financial data presence and consistency
    let accuracy = 70; // Base score
    if (dpr.financials && dpr.financials.projectCost) {
      accuracy += 10;
    }
    if (dpr.financials && dpr.financials.meansOfFinance) {
      accuracy += 10;
    }
    if (project.totalCost && project.loanAmount) {
      accuracy += 10;
    }
    accuracy = Math.min(accuracy, 100);

    // Bankability: Based on financial projections and market analysis
    const bankability = Math.round(
      (sectionScores.financialProjections * 0.5 + sectionScores.marketAnalysis * 0.3 + sectionScores.technicalFeasibility * 0.2)
    );

    // Professionalism: Based on overall structure and language quality
    const professionalism = Math.round(
      (sectionScores.executiveSummary * 0.2 +
       sectionScores.businessProfile * 0.2 +
       sectionScores.conclusion * 0.1 +
       clarity * 0.5)
    );

    return {
      completeness,
      clarity,
      accuracy,
      bankability,
      professionalism,
    };
  }

  /**
   * Generate detailed section analysis
   */
  private static generateSectionDetails(sectionScores: any, nlpAnalysis: any, dpr: any): any {
    const details: any = {};
    const sections = ['executiveSummary', 'businessProfile', 'marketAnalysis', 'technicalFeasibility', 'financialProjections', 'conclusion'];
    const englishContent = dpr.content?.english || {};

    sections.forEach(section => {
      const score = sectionScores[section];
      const content = englishContent[section] || '';
      
      const strengths: string[] = [];
      const weaknesses: string[] = [];
      const suggestions: string[] = [];

      // Analyze content length
      if (content.length >= 500) {
        strengths.push('Comprehensive content length');
      } else if (content.length < 200) {
        weaknesses.push('Content is too brief');
        suggestions.push(`Expand ${this.formatSectionName(section)} with more details`);
      }

      // Analyze structure
      const sentences = content.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
      if (sentences.length >= 5) {
        strengths.push('Well-structured with multiple points');
      } else {
        weaknesses.push('Needs more structured content');
        suggestions.push(`Add more detailed points to ${this.formatSectionName(section)}`);
      }

      // Score-based feedback
      if (score >= 80) {
        strengths.push('High quality content');
      } else if (score < 60) {
        weaknesses.push('Significant improvement needed');
        suggestions.push(`Review and enhance ${this.formatSectionName(section)} content`);
      }

      // Section-specific suggestions
      if (section === 'marketAnalysis' && score < 70) {
        suggestions.push('Add competitor analysis and market trends');
      }
      if (section === 'financialProjections' && score < 70) {
        suggestions.push('Include detailed 3-5 year financial forecasts');
      }
      if (section === 'technicalFeasibility' && score < 70) {
        suggestions.push('Provide more technical specifications and equipment details');
      }

      details[this.formatSectionName(section)] = {
        score,
        strengths: strengths.length > 0 ? strengths : ['Good foundation'],
        weaknesses: weaknesses.length > 0 ? weaknesses : ['Minor improvements possible'],
        suggestions: suggestions.length > 0 ? suggestions : ['Continue maintaining quality'],
      };
    });

    return details;
  }

  /**
   * Update DPR with quality analysis
   */
  static async updateDPRQuality(dprId: string): Promise<void> {
    try {
      const analysis = await this.analyzeDPRQuality(dprId);
      
      await DPRVersion.findByIdAndUpdate(dprId, {
        qualityScore: analysis.score,
        qualityFeedback: {
          score: analysis.score,
          feedback: analysis.feedback,
          weakSections: analysis.weakSections,
          recommendations: analysis.recommendations,
          detailedMetrics: analysis.detailedMetrics,
          sectionDetails: analysis.sectionDetails,
          lastAnalyzedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating DPR quality:', error);
      throw error;
    }
  }
}

