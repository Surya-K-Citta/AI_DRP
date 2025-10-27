import { IProject } from '../types';
import { DPRVersion } from '../models/DPRVersion.model';
import { Project } from '../models/Project.model';
import { OpenAIService } from './openai.service';
import { FinancialService } from './financial.service';
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import fs from 'fs';
import path from 'path';

export class DPRService {
  /**
   * Generate complete DPR
   */
  static async generateDPR(
    projectId: string,
    language: 'english' | 'telugu' | 'bilingual' = 'bilingual'
  ): Promise<any> {
    try {
      // Fetch project data
      const project = await Project.findById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Generate AI content
      console.log('Generating AI content...');
      const content = await OpenAIService.generateCompleteDPR(project, language);

      // Generate financial projections
      console.log('Generating financial projections...');
      const financials = FinancialService.generateCompleteFinancials(project);

      // Get next version number
      const lastVersion = await DPRVersion.findOne({ projectId })
        .sort({ versionNumber: -1 });
      const versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

      // Create DPR version
      const dprVersion = await DPRVersion.create({
        projectId,
        versionNumber,
        content,
        financials,
        language,
        generatedAt: new Date(),
      });

      // Update project status
      await Project.findByIdAndUpdate(projectId, { status: 'completed' });

      return {
        dprId: dprVersion._id,
        versionNumber: dprVersion.versionNumber,
        content: dprVersion.content,
        financials: dprVersion.financials,
        generatedAt: dprVersion.generatedAt,
      };
    } catch (error) {
      console.error('Error generating DPR:', error);
      throw new Error('Failed to generate DPR');
    }
  }

  /**
   * Get DPR by ID
   */
  static async getDPR(dprId: string): Promise<any> {
    const dpr = await DPRVersion.findById(dprId).populate('projectId');
    if (!dpr) {
      throw new Error('DPR not found');
    }
    return dpr;
  }

  /**
   * Get all DPR versions for a project
   */
  static async getProjectDPRs(projectId: string): Promise<any[]> {
    return DPRVersion.find({ projectId }).sort({ versionNumber: -1 });
  }

  /**
   * Generate PDF document
   */
  static async generatePDF(dprId: string, language: 'english' | 'telugu'): Promise<Buffer> {
    const dpr = await this.getDPR(dprId);
    const project = dpr.projectId;
    const contentLang = language === 'telugu' ? dpr.content.telugu : dpr.content.english;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title Page
      doc.fontSize(24).text('Detailed Project Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(18).text(project.projectName, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Sector: ${project.industrySector}`, { align: 'center' });
      doc.text(`Location: ${project.location}`, { align: 'center' });
      doc.moveDown(2);

      // Executive Summary
      doc.addPage();
      doc.fontSize(16).text('1. Executive Summary', { underline: true });
      doc.moveDown();
      doc.fontSize(11).text(contentLang.executiveSummary, { align: 'justify' });
      doc.moveDown();

      // Business Profile
      doc.addPage();
      doc.fontSize(16).text('2. Business Profile', { underline: true });
      doc.moveDown();
      doc.fontSize(11).text(contentLang.businessProfile, { align: 'justify' });
      doc.moveDown();

      // Market Analysis
      doc.addPage();
      doc.fontSize(16).text('3. Market Analysis', { underline: true });
      doc.moveDown();
      doc.fontSize(11).text(contentLang.marketAnalysis, { align: 'justify' });
      doc.moveDown();

      // Technical Feasibility
      doc.addPage();
      doc.fontSize(16).text('4. Technical Feasibility', { underline: true });
      doc.moveDown();
      doc.fontSize(11).text(contentLang.technicalFeasibility, { align: 'justify' });
      doc.moveDown();

      // Financial Projections
      doc.addPage();
      doc.fontSize(16).text('5. Financial Projections', { underline: true });
      doc.moveDown();
      doc.fontSize(11).text(contentLang.financialProjections, { align: 'justify' });
      doc.moveDown();

      // Financial Tables
      doc.addPage();
      doc.fontSize(14).text('Financial Summary', { underline: true });
      doc.moveDown();
      
      // Project Cost
      doc.fontSize(12).text('Project Cost Breakdown:', { underline: true });
      doc.fontSize(10);
      doc.text(`Total Fixed Capital: ₹${dpr.financials.projectCost.fixedCapital.total.toLocaleString()}`);
      doc.text(`Total Working Capital: ₹${dpr.financials.projectCost.workingCapital.total.toLocaleString()}`);
      doc.text(`Total Project Cost: ₹${dpr.financials.projectCost.totalProjectCost.toLocaleString()}`);
      doc.moveDown();

      // Means of Finance
      doc.fontSize(12).text('Means of Finance:', { underline: true });
      doc.fontSize(10);
      doc.text(`Own Contribution: ₹${dpr.financials.meansOfFinance.ownContribution.amount.toLocaleString()} (${dpr.financials.meansOfFinance.ownContribution.percentage}%)`);
      doc.text(`Term Loan: ₹${dpr.financials.meansOfFinance.termLoan.amount.toLocaleString()} (${dpr.financials.meansOfFinance.termLoan.percentage}%)`);
      doc.moveDown();

      // Conclusion
      doc.addPage();
      doc.fontSize(16).text('6. Conclusion', { underline: true });
      doc.moveDown();
      doc.fontSize(11).text(contentLang.conclusion, { align: 'justify' });

      doc.end();
    });
  }

  /**
   * Generate DOCX document
   */
  static async generateDOCX(dprId: string, language: 'english' | 'telugu'): Promise<Buffer> {
    const dpr = await this.getDPR(dprId);
    const project = dpr.projectId;
    const contentLang = language === 'telugu' ? dpr.content.telugu : dpr.content.english;

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: 'Detailed Project Report',
              heading: HeadingLevel.TITLE,
            }),
            new Paragraph({
              text: project.projectName,
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              text: `Sector: ${project.industrySector}`,
            }),
            new Paragraph({
              text: `Location: ${project.location}`,
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              text: '1. Executive Summary',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: contentLang.executiveSummary,
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              text: '2. Business Profile',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: contentLang.businessProfile,
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              text: '3. Market Analysis',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: contentLang.marketAnalysis,
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              text: '4. Technical Feasibility',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: contentLang.technicalFeasibility,
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              text: '5. Financial Projections',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: contentLang.financialProjections,
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              text: '6. Conclusion',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: contentLang.conclusion,
            }),
          ],
        },
      ],
    });

    return Packer.toBuffer(doc);
  }
}

