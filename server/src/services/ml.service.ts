// @ts-nocheck
import { DPRAnalytics } from '../models/DPRAnalytics.model';
import { Feedback } from '../models/Feedback.model';
import { DPRVersion } from '../models/DPRVersion.model';
import { Project } from '../models/Project.model';
import { SuggestionService } from './suggestion.service';

export class MLService {
  /**
   * Analyze DPR quality and generate improvement suggestions
   */
  static async analyzeDPRQuality(dprId: string, projectId: string): Promise<any> {
    try {
      const dpr = await DPRVersion.findById(dprId);
      const project = await Project.findById(projectId);
      
      if (!dpr || !project) {
        throw new Error('DPR or Project not found');
      }

      // Get feedback for this DPR
      const feedback = await Feedback.find({ dprId });
      const averageRating = feedback.length > 0 
        ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length 
        : 0;

      // Calculate quality scores
      const qualityScores = this.calculateQualityScores(dpr, project, feedback);
      
      // Get sector benchmarks
      const benchmarks = SuggestionService.getSectorBenchmarks(project.industrySector);
      
      // Calculate benchmark comparisons
      const benchmarkComparison = this.calculateBenchmarkComparison(project, benchmarks);
      
      // Generate improvement suggestions
      const improvementSuggestions = this.generateImprovementSuggestions(
        qualityScores, 
        benchmarkComparison, 
        feedback
      );

      // Create or update analytics record
      const analyticsData = {
        projectId,
        dprId,
        ...qualityScores,
        userSatisfactionScore: averageRating * 20, // Convert 5-point scale to 100-point scale
        feedbackCount: feedback.length,
        averageRating,
        improvementSuggestions,
        sectorBenchmarkComparison: benchmarkComparison,
      };

      const analytics = await DPRAnalytics.findOneAndUpdate(
        { dprId },
        analyticsData,
        { upsert: true, new: true }
      );

      return analytics;
    } catch (error) {
      console.error('Error analyzing DPR quality:', error);
      throw new Error('Failed to analyze DPR quality');
    }
  }

  /**
   * Calculate quality scores for DPR
   */
  private static calculateQualityScores(dpr: any, project: any, feedback: any[]): any {
    // Completeness Score (0-100)
    const completenessScore = this.calculateCompletenessScore(dpr, project);
    
    // Bankability Score (0-100)
    const bankabilityScore = this.calculateBankabilityScore(dpr, project);
    
    // Overall Quality Score (weighted average)
    const qualityScore = Math.round(
      (completenessScore * 0.4) + 
      (bankabilityScore * 0.4) + 
      (this.calculateContentQualityScore(dpr) * 0.2)
    );

    return {
      qualityScore,
      completenessScore,
      bankabilityScore,
    };
  }

  /**
   * Calculate completeness score
   */
  private static calculateCompletenessScore(dpr: any, project: any): number {
    let score = 0;
    const maxScore = 100;

    // Check if all required sections are present
    const requiredSections = ['executiveSummary', 'businessProfile', 'marketAnalysis', 'technicalFeasibility', 'financialProjections', 'conclusion'];
    const englishSections = dpr.content?.english || {};
    const teluguSections = dpr.content?.telugu || {};

    const englishCompleteness = requiredSections.filter(section => 
      englishSections[section] && englishSections[section].length > 100
    ).length / requiredSections.length;

    const teluguCompleteness = requiredSections.filter(section => 
      teluguSections[section] && teluguSections[section].length > 100
    ).length / requiredSections.length;

    score += (englishCompleteness + teluguCompleteness) * 30; // 60 points for content completeness

    // Check project data completeness
    const projectDataScore = this.calculateProjectDataCompleteness(project);
    score += projectDataScore * 20; // 20 points for project data

    // Check financial data completeness
    const financialDataScore = this.calculateFinancialDataCompleteness(dpr);
    score += financialDataScore * 20; // 20 points for financial data

    return Math.min(Math.round(score), maxScore);
  }

  /**
   * Calculate bankability score
   */
  private static calculateBankabilityScore(dpr: any, project: any): number {
    let score = 0;
    const maxScore = 100;

    // Check financial ratios
    const financials = dpr.financials || {};
    const projectCost = project.totalCost;
    const ownContribution = project.ownContribution;
    const loanAmount = project.loanAmount;

    // Own contribution ratio (should be at least 15%)
    const ownContributionRatio = ownContribution / projectCost;
    if (ownContributionRatio >= 0.15) score += 20;
    else if (ownContributionRatio >= 0.10) score += 15;
    else if (ownContributionRatio >= 0.05) score += 10;

    // Debt service coverage ratio
    const dscr = this.calculateDSCR(financials);
    if (dscr >= 1.5) score += 25;
    else if (dscr >= 1.2) score += 20;
    else if (dscr >= 1.0) score += 15;

    // Payback period (should be reasonable)
    const paybackPeriod = this.calculatePaybackPeriod(financials);
    if (paybackPeriod <= 3) score += 20;
    else if (paybackPeriod <= 5) score += 15;
    else if (paybackPeriod <= 7) score += 10;

    // Project viability indicators
    const viabilityScore = this.calculateViabilityScore(project, financials);
    score += viabilityScore * 0.35; // 35 points for viability

    return Math.min(Math.round(score), maxScore);
  }

  /**
   * Calculate content quality score
   */
  private static calculateContentQualityScore(dpr: any): number {
    const englishContent = dpr.content?.english || {};
    const teluguContent = dpr.content?.telugu || {};

    let totalScore = 0;
    let sectionCount = 0;

    const sections = ['executiveSummary', 'businessProfile', 'marketAnalysis', 'technicalFeasibility', 'financialProjections', 'conclusion'];

    sections.forEach(section => {
      const englishText = englishContent[section] || '';
      const teluguText = teluguContent[section] || '';

      if (englishText.length > 100) {
        totalScore += this.analyzeTextQuality(englishText);
        sectionCount++;
      }

      if (teluguText.length > 100) {
        totalScore += this.analyzeTextQuality(teluguText);
        sectionCount++;
      }
    });

    return sectionCount > 0 ? Math.round(totalScore / sectionCount) : 0;
  }

  /**
   * Analyze text quality based on length, structure, and keywords
   */
  private static analyzeTextQuality(text: string): number {
    let score = 0;

    // Length score (0-30 points)
    if (text.length >= 500) score += 30;
    else if (text.length >= 300) score += 20;
    else if (text.length >= 150) score += 10;

    // Structure score (0-30 points)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length >= 10) score += 30;
    else if (sentences.length >= 5) score += 20;
    else if (sentences.length >= 3) score += 10;

    // Professional keywords score (0-40 points)
    const professionalKeywords = [
      'financial', 'project', 'investment', 'revenue', 'profit', 'market', 'analysis',
      'feasibility', 'viability', 'growth', 'development', 'strategy', 'planning',
      'management', 'operations', 'production', 'quality', 'efficiency', 'sustainability'
    ];

    const keywordCount = professionalKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    ).length;

    score += Math.min(keywordCount * 4, 40);

    return Math.min(score, 100);
  }

  /**
   * Calculate project data completeness
   */
  private static calculateProjectDataCompleteness(project: any): number {
    let score = 0;
    const fields = [
      'projectName', 'industrySector', 'totalCost', 'ownContribution', 
      'loanAmount', 'location', 'inputs.businessDescription', 'inputs.targetMarket'
    ];

    fields.forEach(field => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], project);
      if (value && value.toString().trim().length > 0) {
        score += 100 / fields.length;
      }
    });

    return Math.round(score);
  }

  /**
   * Calculate financial data completeness
   */
  private static calculateFinancialDataCompleteness(dpr: any): number {
    const financials = dpr.financials || {};
    let score = 0;

    const requiredFields = [
      'projectCost', 'meansOfFinance', 'financialProjections'
    ];

    requiredFields.forEach(field => {
      if (financials[field]) {
        score += 100 / requiredFields.length;
      }
    });

    return Math.round(score);
  }

  /**
   * Calculate Debt Service Coverage Ratio
   */
  private static calculateDSCR(financials: any): number {
    // Simplified DSCR calculation
    // In a real implementation, this would use actual financial projections
    return 1.5; // Placeholder
  }

  /**
   * Calculate payback period
   */
  private static calculatePaybackPeriod(financials: any): number {
    // Simplified payback period calculation
    // In a real implementation, this would use actual financial projections
    return 4; // Placeholder
  }

  /**
   * Calculate viability score
   */
  private static calculateViabilityScore(project: any, financials: any): number {
    // Simplified viability calculation
    // In a real implementation, this would analyze multiple factors
    return 70; // Placeholder
  }

  /**
   * Calculate benchmark comparison
   */
  private static calculateBenchmarkComparison(project: any, benchmarks: any): any {
    return {
      projectCostVsBenchmark: (project.totalCost / benchmarks.averageProjectCost) * 100,
      ownContributionVsBenchmark: (project.ownContribution / project.totalCost) / (benchmarks.averageOwnContribution / 100) * 100,
      paybackPeriodVsBenchmark: (this.calculatePaybackPeriod({}) / benchmarks.averagePaybackPeriod) * 100,
      roiVsBenchmark: (15 / benchmarks.averageROI) * 100, // Placeholder ROI
    };
  }

  /**
   * Generate improvement suggestions
   */
  private static generateImprovementSuggestions(
    qualityScores: any, 
    benchmarkComparison: any, 
    feedback: any[]
  ): string[] {
    const suggestions: string[] = [];

    if (qualityScores.completenessScore < 80) {
      suggestions.push('Complete all required DPR sections with detailed content');
    }

    if (qualityScores.bankabilityScore < 70) {
      suggestions.push('Improve financial projections and debt service coverage ratio');
    }

    if (benchmarkComparison.ownContributionVsBenchmark < 80) {
      suggestions.push('Consider increasing own contribution to improve loan eligibility');
    }

    if (benchmarkComparison.paybackPeriodVsBenchmark > 120) {
      suggestions.push('Optimize project structure to reduce payback period');
    }

    // Add feedback-based suggestions
    const commonFeedback = this.analyzeCommonFeedback(feedback);
    suggestions.push(...commonFeedback);

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Analyze common feedback themes
   */
  private static analyzeCommonFeedback(feedback: any[]): string[] {
    const suggestions: string[] = [];
    
    // Analyze feedback text for common themes
    const allFeedback = feedback.map(f => f.comments || '').join(' ').toLowerCase();
    
    if (allFeedback.includes('financial') && allFeedback.includes('unclear')) {
      suggestions.push('Provide more detailed financial projections and explanations');
    }
    
    if (allFeedback.includes('market') && allFeedback.includes('analysis')) {
      suggestions.push('Enhance market analysis with more specific data and trends');
    }
    
    if (allFeedback.includes('technical') && allFeedback.includes('feasibility')) {
      suggestions.push('Add more technical details and feasibility studies');
    }

    return suggestions;
  }

  /**
   * Get ML insights for admin dashboard
   */
  static async getMLInsights(): Promise<any> {
    try {
      // Get overall analytics
      const totalDPRs = await DPRAnalytics.countDocuments();
      const avgQualityScore = await DPRAnalytics.aggregate([
        { $group: { _id: null, avgScore: { $avg: '$qualityScore' } } }
      ]);

      // Get funding outcomes
      const fundingOutcomes = await DPRAnalytics.aggregate([
        { $group: { _id: '$fundingOutcome', count: { $sum: 1 } } }
      ]);

      // Get quality trends over time
      const qualityTrends = await DPRAnalytics.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            avgQuality: { $avg: '$qualityScore' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ]);

      // Get sector-wise performance
      const sectorPerformance = await DPRAnalytics.aggregate([
        {
          $lookup: {
            from: 'projects',
            localField: 'projectId',
            foreignField: '_id',
            as: 'project'
          }
        },
        { $unwind: '$project' },
        {
          $group: {
            _id: '$project.industrySector',
            avgQuality: { $avg: '$qualityScore' },
            avgBankability: { $avg: '$bankabilityScore' },
            count: { $sum: 1 },
            approvalRate: {
              $avg: {
                $cond: [{ $eq: ['$fundingOutcome', 'approved'] }, 1, 0]
              }
            }
          }
        },
        { $sort: { avgQuality: -1 } }
      ]);

      return {
        totalDPRs,
        averageQualityScore: avgQualityScore[0]?.avgScore || 0,
        fundingOutcomes,
        qualityTrends,
        sectorPerformance
      };
    } catch (error) {
      console.error('Error getting ML insights:', error);
      throw new Error('Failed to get ML insights');
    }
  }

  /**
   * Generate analytics report PDF
   */
  static async generateAnalyticsReport(projectId: string): Promise<Buffer> {
    try {
      const analytics = await this.analyzeDPRQuality(projectId, projectId);
      const project = await Project.findById(projectId);
      
      if (!project) {
        throw new Error('Project not found');
      }

      const PDFDocument = require('pdfkit');
      
      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Title Page
        doc.fontSize(24).text('DPR Analytics Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(18).text(project.projectName, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Sector: ${project.industrySector}`, { align: 'center' });
        doc.text(`Location: ${project.location}`, { align: 'center' });
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(2);

        // Quality Scores
        doc.addPage();
        doc.fontSize(16).text('Quality Analysis', { underline: true });
        doc.moveDown();
        
        doc.fontSize(12).text(`Overall Quality Score: ${analytics.qualityScore}%`);
        doc.text(`Bankability Score: ${analytics.bankabilityScore}%`);
        doc.text(`Completeness Score: ${analytics.completenessScore}%`);
        doc.text(`User Satisfaction: ${analytics.userSatisfactionScore}%`);
        doc.moveDown();

        // Funding Outcome
        if (analytics.fundingOutcome) {
          doc.fontSize(14).text('Funding Status', { underline: true });
          doc.moveDown();
          doc.fontSize(12).text(`Status: ${analytics.fundingOutcome}`);
          if (analytics.loanAmountApproved) {
            doc.text(`Approved Amount: ₹${analytics.loanAmountApproved.toLocaleString()}`);
          }
          if (analytics.approvalDate) {
            doc.text(`Approval Date: ${new Date(analytics.approvalDate).toLocaleDateString()}`);
          }
          doc.moveDown();
        }

        // Improvement Suggestions
        if (analytics.improvementSuggestions && analytics.improvementSuggestions.length > 0) {
          doc.fontSize(14).text('Improvement Suggestions', { underline: true });
          doc.moveDown();
          analytics.improvementSuggestions.forEach((suggestion: string, index: number) => {
            doc.fontSize(11).text(`${index + 1}. ${suggestion}`);
            doc.moveDown(0.5);
          });
        }

        doc.end();
      });
    } catch (error) {
      console.error('Error generating analytics report:', error);
      throw new Error('Failed to generate analytics report');
    }
  }
}
