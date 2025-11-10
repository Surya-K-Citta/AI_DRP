import { IProject } from '../types';
import { DPRVersion } from '../models/DPRVersion.model';
import { Project } from '../models/Project.model';
import { OpenAIService } from './openai.service';
import { FinancialService } from './financial.service';
import { processMarkdownBold, removeMarkdownBold, processMarkdownText, ProcessedParagraph } from '../utils/textProcessor';
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
    const dpr = await DPRVersion.findById(dprId);
    if (!dpr) {
      throw new Error('DPR not found');
    }
    // Fetch project separately since projectId is stored as String
    const project = await Project.findById(dpr.projectId);
    if (project) {
      dpr.projectId = project as any;
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

      // Helper function to add text with formatting (bold and headings)
      const addFormattedText = (text: string, fontSize: number = 11) => {
        if (!text) return;
        
        // Process markdown text (handles both bold and headings)
        const paragraphs = processMarkdownText(text);
        
        paragraphs.forEach((para) => {
          if (para.type === 'heading') {
            // Render heading as semi-bold subheading
            doc.moveDown(0.5);
            let headingFontSize: number;
            let spacingAfter: number;
            
            if (para.headingLevel === 1) {
              headingFontSize = fontSize + 5; // Largest for heading-1
              spacingAfter = 1.0;
            } else if (para.headingLevel === 2) {
              headingFontSize = fontSize + 3; // Medium for heading-2
              spacingAfter = 0.8;
            } else {
              headingFontSize = fontSize + 1; // Smallest for heading-3
              spacingAfter = 0.5;
            }
            
            para.content.forEach((segment, index) => {
              const isLast = index === para.content.length - 1;
              if (segment.bold) {
                doc.fontSize(headingFontSize).font('Helvetica-Bold').text(segment.text, { 
                  continued: !isLast 
                });
              } else {
                // Semi-bold for headings (font-weight 600 equivalent)
                doc.fontSize(headingFontSize).font('Helvetica-Bold').text(segment.text, { 
                  continued: !isLast 
                });
              }
            });
            doc.moveDown(spacingAfter);
          } else if (para.originalText.trim().length > 0) {
            // Regular text paragraph
            para.content.forEach((segment, index) => {
              const isLast = index === para.content.length - 1;
              if (segment.bold) {
                doc.fontSize(fontSize).font('Helvetica-Bold').text(segment.text, { 
                  align: 'justify', 
                  continued: !isLast 
                });
              } else {
                doc.fontSize(fontSize).font('Helvetica').text(segment.text, { 
                  align: 'justify', 
                  continued: !isLast 
                });
              }
            });
            doc.moveDown(0.3);
          }
        });
      };

      // Executive Summary
      doc.addPage();
      doc.fontSize(16).text('1. Executive Summary', { underline: true });
      doc.moveDown();
      addFormattedText(contentLang.executiveSummary || '');
      doc.moveDown();

      // Business Profile
      doc.addPage();
      doc.fontSize(16).text('2. Business Profile', { underline: true });
      doc.moveDown();
      addFormattedText(contentLang.businessProfile || '');
      doc.moveDown();

      // Market Analysis
      doc.addPage();
      doc.fontSize(16).text('3. Market Analysis', { underline: true });
      doc.moveDown();
      addFormattedText(contentLang.marketAnalysis || '');
      doc.moveDown();

      // Technical Feasibility
      doc.addPage();
      doc.fontSize(16).text('4. Technical Feasibility', { underline: true });
      doc.moveDown();
      addFormattedText(contentLang.technicalFeasibility || '');
      doc.moveDown();

      // Financial Projections
      doc.addPage();
      doc.fontSize(16).text('5. Financial Projections', { underline: true });
      doc.moveDown();
      addFormattedText(contentLang.financialProjections || '');
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
      addFormattedText(contentLang.conclusion || '');

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

    // Helper function to create paragraphs with formatting (bold and headings)
    const createFormattedParagraphs = (text: string): Paragraph[] => {
      if (!text) {
        return [new Paragraph({ text: '' })];
      }
      
      const paragraphs: Paragraph[] = [];
      const processedParas = processMarkdownText(text);
      
      processedParas.forEach((para) => {
        if (para.type === 'heading') {
          // Create heading paragraph with semi-bold
          const children = para.content.map(segment => 
            new TextRun({
              text: segment.text,
              bold: true, // Semi-bold for headings
            })
          );
          
          let headingLevel: HeadingLevel;
          let spacingBefore: number;
          let spacingAfter: number;
          
          if (para.headingLevel === 1) {
            headingLevel = HeadingLevel.HEADING_1;
            spacingBefore = 400;
            spacingAfter = 200;
          } else if (para.headingLevel === 2) {
            headingLevel = HeadingLevel.HEADING_2;
            spacingBefore = 300;
            spacingAfter = 150;
          } else {
            headingLevel = HeadingLevel.HEADING_3;
            spacingBefore = 200;
            spacingAfter = 100;
          }
          
          paragraphs.push(new Paragraph({ 
            children,
            heading: headingLevel,
            spacing: { 
              before: spacingBefore, 
              after: spacingAfter 
            },
          }));
        } else if (para.originalText.trim().length > 0) {
          // Regular text paragraph
          const segments = processMarkdownBold(para.originalText);
          
          if (segments.length === 1 && !segments[0].bold) {
            paragraphs.push(new Paragraph({ 
              text: removeMarkdownBold(para.originalText),
              spacing: { after: 100 },
            }));
          } else {
            const children = segments.map(segment => 
              new TextRun({
                text: segment.text,
                bold: segment.bold,
              })
            );
            paragraphs.push(new Paragraph({ 
              children,
              spacing: { after: 100 },
            }));
          }
        } else {
          // Empty paragraph for spacing
          paragraphs.push(new Paragraph({ text: '', spacing: { after: 50 } }));
        }
      });
      
      return paragraphs;
    };

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
            ...createFormattedParagraphs(contentLang.executiveSummary || ''),
            new Paragraph({
              text: '2. Business Profile',
              heading: HeadingLevel.HEADING_2,
            }),
            ...createFormattedParagraphs(contentLang.businessProfile || ''),
            new Paragraph({
              text: '3. Market Analysis',
              heading: HeadingLevel.HEADING_2,
            }),
            ...createFormattedParagraphs(contentLang.marketAnalysis || ''),
            new Paragraph({
              text: '4. Technical Feasibility',
              heading: HeadingLevel.HEADING_2,
            }),
            ...createFormattedParagraphs(contentLang.technicalFeasibility || ''),
            new Paragraph({
              text: '5. Financial Projections',
              heading: HeadingLevel.HEADING_2,
            }),
            ...createFormattedParagraphs(contentLang.financialProjections || ''),
            new Paragraph({
              text: '6. Conclusion',
              heading: HeadingLevel.HEADING_2,
            }),
            ...createFormattedParagraphs(contentLang.conclusion || ''),
          ],
        },
      ],
    });

    return Packer.toBuffer(doc);
  }

  /**
   * Generate PDF from DPR session (chat-based DPR)
   */
  static async generatePDFFromSession(
    sessionId: string,
    language: 'english' | 'telugu' = 'english'
  ): Promise<Buffer> {
    const { DPRSession } = await import('../models/DPRSession.model');
    const session = await DPRSession.findById(sessionId);
    
    if (!session || !session.generatedDPR) {
      throw new Error('DPR session not found or DPR not generated');
    }

    const dpr = session.generatedDPR;
    const content = dpr.content || '';
    const sections = dpr.sections || [];

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title Page
      doc.fontSize(24).text('Detailed Project Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(18).text('Generated DPR', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Language: ${language === 'telugu' ? 'Telugu' : 'English'}`, { align: 'center' });
      doc.text(`Generated: ${new Date(session.completedAt || session.startedAt).toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      // Helper function to add text with formatting
      const addFormattedText = (text: string, fontSize: number = 11) => {
        if (!text) return;
        
        const paragraphs = processMarkdownText(text);
        
        paragraphs.forEach((para) => {
          if (para.type === 'heading') {
            doc.moveDown(0.5);
            let headingFontSize: number;
            let spacingAfter: number;
            
            if (para.headingLevel === 1) {
              headingFontSize = fontSize + 5;
              spacingAfter = 1.0;
            } else if (para.headingLevel === 2) {
              headingFontSize = fontSize + 3;
              spacingAfter = 0.8;
            } else {
              headingFontSize = fontSize + 1;
              spacingAfter = 0.5;
            }
            
            para.content.forEach((segment, index) => {
              const isLast = index === para.content.length - 1;
              doc.fontSize(headingFontSize).font('Helvetica-Bold').text(segment.text, { 
                continued: !isLast 
              });
            });
            doc.moveDown(spacingAfter);
          } else if (para.originalText.trim().length > 0) {
            para.content.forEach((segment, index) => {
              const isLast = index === para.content.length - 1;
              if (segment.bold) {
                doc.fontSize(fontSize).font('Helvetica-Bold').text(segment.text, { 
                  align: 'justify', 
                  continued: !isLast 
                });
              } else {
                doc.fontSize(fontSize).font('Helvetica').text(segment.text, { 
                  align: 'justify', 
                  continued: !isLast 
                });
              }
            });
            doc.moveDown(0.3);
          }
        });
      };

      // Add sections
      if (sections.length > 0) {
        sections.forEach((section: any, index: number) => {
          doc.addPage();
          doc.fontSize(16).text(`${index + 1}. ${section.title}`, { underline: true });
          doc.moveDown();
          addFormattedText(section.content || '');
          doc.moveDown();
        });
      } else if (content) {
        // Fallback to full content if sections not available
        doc.addPage();
        addFormattedText(content);
      }

      doc.end();
    });
  }
}

