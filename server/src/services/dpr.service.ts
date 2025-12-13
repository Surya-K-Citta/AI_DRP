// @ts-nocheck
import { IProject } from '../types';
import { DPRVersion } from '../models/DPRVersion.model';
import { Project } from '../models/Project.model';
import { OpenAIService } from './openai.service';
import { FinancialService } from './financial.service';
import { QualityService } from './quality.service';
import { processMarkdownBold, removeMarkdownBold, processMarkdownText, ProcessedParagraph } from '../utils/textProcessor';
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import fs from 'fs';
import path from 'path';
import { Buffer } from 'buffer';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

export class DPRService {
  /**
   * Generate complete DPR
   */
  static async generateDPR(
    projectId: string,
    language: 'english' | 'telugu' | 'bilingual' = 'bilingual'
  ): Promise<any> {
    try {
      // OPTIMIZATION: Fetch project with only needed fields including eligibleSchemes
      const project = await Project.findById(projectId)
        .select('projectName industrySector projectType totalCost loanAmount location inputs eligibleSchemes')
        .lean(); // Use lean() for faster queries
      if (!project) {
        throw new Error('Project not found');
      }

      // Generate AI content
      console.log('Generating AI content...');
      const content = await OpenAIService.generateCompleteDPR(project, language);

      // Generate financial projections
      console.log('Generating financial projections...');
      const financials = FinancialService.generateCompleteFinancials(project);

      // Create DPR
      const dprVersion = await DPRVersion.create({
        projectId,
        content,
        financials,
        language,
        generatedAt: new Date(),
        status: 'draft',
      });

      // Verify DPR was saved successfully
      if (!dprVersion || !dprVersion._id) {
        throw new Error('Failed to save DPR to database');
      }

      console.log(`✅ DPR saved successfully: ${dprVersion._id} for project ${projectId}`);

      // Calculate and update quality score (async, don't wait)
      QualityService.updateDPRQuality(dprVersion._id.toString()).catch(err => {
        console.error('Error calculating quality score:', err);
      });

      // Update project status
      await Project.findByIdAndUpdate(projectId, { status: 'completed' });

      return {
        dprId: dprVersion._id,
        content: dprVersion.content,
        financials: dprVersion.financials,
        generatedAt: dprVersion.generatedAt,
        status: dprVersion.status,
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
   * Get all DPRs for a project
   */
  static async getProjectDPRs(projectId: string): Promise<any[]> {
    return DPRVersion.find({ projectId }).sort({ createdAt: -1 });
  }

  /**
   * Check if LibreOffice is available for Word to PDF conversion
   */
  private static async checkLibreOfficeAvailable(): Promise<{ available: boolean; command: string; error?: string }> {
    const isWindows = process.platform === 'win32';
    
    if (isWindows) {
      // Windows: Try common LibreOffice installation paths
      const possiblePaths = [
        'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
        'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
      ];
      
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          return { available: true, command: `"${possiblePath}"` };
        }
      }
      
      // Check if soffice is in PATH
      try {
        await execAsync('where soffice');
        return { available: true, command: 'soffice' };
      } catch {
        return { 
          available: false, 
          command: '', 
          error: 'LibreOffice not found. Please install from https://www.libreoffice.org/' 
        };
      }
    } else {
      // Linux/Mac: Check if libreoffice command exists
      try {
        await execAsync('which libreoffice');
        return { available: true, command: 'libreoffice' };
      } catch {
        return { 
          available: false, 
          command: '', 
          error: 'LibreOffice not found. Install with: sudo apt-get install libreoffice (Ubuntu) or brew install --cask libreoffice (Mac)' 
        };
      }
    }
  }

  /**
   * Generate PDF document
   * For Telugu: Generate Word document first, then convert to PDF (ensures proper Unicode support)
   * For English: Generate PDF directly (works fine with PDFKit)
   */
  static async generatePDF(dprId: string, language: 'english' | 'telugu'): Promise<Buffer> {
    // For Telugu language, generate Word document first and convert to PDF
    // This ensures proper Unicode/encoding support since PDFKit doesn't handle Telugu well
    if (language === 'telugu') {
      try {
        console.log('📄 Generating Telugu PDF via Word conversion (ensures proper Unicode support)...');
        
        // First generate Word document (which handles Telugu perfectly)
        const docxBuffer = await this.generateDOCX(dprId, language);
        
        // Check if LibreOffice is available for conversion
        const libreOfficeCheck = await this.checkLibreOfficeAvailable();
        
        if (!libreOfficeCheck.available) {
          // If LibreOffice is not available, throw clear error
          throw new Error(
            `LibreOffice is required for Telugu PDF generation. ${libreOfficeCheck.error || ''}\n\n` +
            `Alternative: Download the Word document (.docx) which displays Telugu perfectly, ` +
            `or install LibreOffice from https://www.libreoffice.org/`
          );
        }
        
        // Create temporary files
        const tempDir = os.tmpdir();
        const tempDocxPath = path.join(tempDir, `dpr_${dprId}_${Date.now()}.docx`);
        
        // Write DOCX to temp file
        fs.writeFileSync(tempDocxPath, docxBuffer);
        console.log(`✅ Generated Word document: ${tempDocxPath}`);
        
        try {
          // Convert Word to PDF using LibreOffice
          const libreOfficeCmd = `${libreOfficeCheck.command} --headless --convert-to pdf --outdir "${tempDir}" "${tempDocxPath}"`;
          
          console.log(`🔄 Converting Word to PDF using LibreOffice...`);
          console.log(`   Command: ${libreOfficeCmd}`);
          
          await execAsync(libreOfficeCmd, { 
            timeout: 30000, // 30 second timeout
            maxBuffer: 10 * 1024 * 1024 // 10MB buffer
          });
          
          // LibreOffice creates PDF with same name but .pdf extension
          const generatedPdfPath = tempDocxPath.replace('.docx', '.pdf');
          
          // Wait for file to be written (LibreOffice is async)
          let retries = 10;
          while (!fs.existsSync(generatedPdfPath) && retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
            retries--;
          }
          
          if (fs.existsSync(generatedPdfPath)) {
            const pdfBuffer = fs.readFileSync(generatedPdfPath);
            
            // Clean up temp files
            try { fs.unlinkSync(tempDocxPath); } catch {}
            try { fs.unlinkSync(generatedPdfPath); } catch {}
            
            console.log('✅ Successfully converted Word to PDF for Telugu');
            return pdfBuffer;
          } else {
            throw new Error('LibreOffice conversion failed - PDF file was not created');
          }
        } catch (error: any) {
          // Clean up temp files
          try { fs.unlinkSync(tempDocxPath); } catch {}
          
          console.error('❌ Error converting Word to PDF:', error);
          throw new Error(
            `Failed to convert Word to PDF: ${error.message}\n\n` +
            `Please ensure LibreOffice is properly installed and accessible. ` +
            `Alternatively, download the Word document (.docx) which displays Telugu perfectly.`
          );
        }
      } catch (error: any) {
        console.error('Error generating Telugu PDF:', error);
        throw error;
      }
    }
    
    // For English language, generate PDF directly (works fine with PDFKit)
    try {
      const dpr = await this.getDPR(dprId);
      if (!dpr) {
        throw new Error('DPR not found');
      }
      
      const project = dpr.projectId;
      if (!project) {
        throw new Error('Project not found for DPR');
      }

      // Safely access content with fallback
      const content = dpr.content || {};
      const contentLang = content.english || {};

      if (!contentLang || Object.keys(contentLang).length === 0) {
        throw new Error(`No ${language} content available for this DPR`);
      }

      return new Promise((resolve, reject) => {
        try {
          // PDFKit configuration for better Unicode support
          const doc = new PDFDocument({ 
            margin: 50,
            autoFirstPage: true,
            // Ensure proper encoding for Unicode characters
            info: {
              Title: language === 'telugu' ? 'వివరణాత్మక ప్రాజెక్ట్ నివేదిక' : 'Detailed Project Report',
              Author: 'MSME DPR Tool',
              Subject: 'DPR Document',
              Creator: 'MSME AI DPR Generation Tool'
            }
          });
          const chunks: Buffer[] = [];

          doc.on('data', (chunk) => chunks.push(chunk));
          doc.on('end', () => resolve(Buffer.concat(chunks)));
          doc.on('error', (error) => {
            console.error('PDF generation error:', error);
            reject(error);
          });

          // Register Telugu font if available
          // Try multiple possible paths for the font file
          const possibleFontPaths = [
            path.join(__dirname, '../../fonts/NotoSansTelugu-Regular.ttf'), // Development
            path.join(process.cwd(), 'fonts/NotoSansTelugu-Regular.ttf'),   // Production
            path.join(process.cwd(), 'server/fonts/NotoSansTelugu-Regular.ttf'), // Alternative
          ];
          
          let teluguFontPath: string | null = null;
          let teluguFontRegistered = false;
          
          // Find the font file
          for (const fontPath of possibleFontPaths) {
            if (fs.existsSync(fontPath)) {
              teluguFontPath = fontPath;
              break;
            }
          }
          
          // Register the font if found
          if (teluguFontPath) {
            try {
              doc.registerFont('NotoSansTelugu', teluguFontPath);
              teluguFontRegistered = true;
              console.log('✅ Telugu font registered successfully from:', teluguFontPath);
            } catch (fontError: any) {
              console.warn('⚠️  Failed to register Telugu font:', fontError.message);
              console.warn('   Telugu text may not render correctly in PDF');
              console.warn('   Please ensure the font file is valid and accessible');
            }
          } else {
            console.warn('⚠️  Telugu font not found. Tried paths:');
            possibleFontPaths.forEach(p => console.warn(`   - ${p}`));
            console.warn('   Please download NotoSansTelugu-Regular.ttf and place it in the fonts folder');
            console.warn('   See server/fonts/README.md for instructions');
            console.warn('   Telugu text will NOT render correctly in PDF without this font');
          }

          // Helper function to detect Telugu text (must be defined first)
          const isTeluguText = (text: string): boolean => {
            return /[\u0C00-\u0C7F]/.test(text);
          };

          // Detect if content contains Telugu characters
          const hasTelugu = /[\u0C00-\u0C7F]/.test(contentLang.executiveSummary || '');
          
          // Title Page
          const title = language === 'telugu' ? 'వివరణాత్మక ప్రాజెక్ట్ నివేదిక' : 'Detailed Project Report';
          const titleIsTelugu = isTeluguText(title);
          
          // For Telugu title, use registered Telugu font if available
          if (titleIsTelugu) {
            if (teluguFontRegistered) {
              doc.fontSize(24).font('NotoSansTelugu').text(title, { align: 'center' });
            } else {
              doc.fontSize(24).text(title, { align: 'center' });
            }
          } else {
            doc.fontSize(24).font('Helvetica-Bold').text(title, { align: 'center' });
          }
          doc.moveDown();
          
          // Project name
          const projectNameIsTelugu = isTeluguText(project.projectName);
          if (projectNameIsTelugu) {
            if (teluguFontRegistered) {
              doc.fontSize(18).font('NotoSansTelugu').text(project.projectName, { align: 'center' });
            } else {
              doc.fontSize(18).text(project.projectName, { align: 'center' });
            }
          } else {
            doc.fontSize(18).font('Helvetica').text(project.projectName, { align: 'center' });
          }
          doc.moveDown();
          
          const sectorLabel = language === 'telugu' ? 'రంగం' : 'Sector';
          const locationLabel = language === 'telugu' ? 'స్థానం' : 'Location';
          
          // Sector and Location
          if (language === 'telugu') {
            if (teluguFontRegistered) {
              doc.fontSize(12).font('NotoSansTelugu').text(`${sectorLabel}: ${project.industrySector}`, { align: 'center' });
              doc.font('NotoSansTelugu').text(`${locationLabel}: ${project.location}`, { align: 'center' });
            } else {
              doc.fontSize(12).text(`${sectorLabel}: ${project.industrySector}`, { align: 'center' });
              doc.text(`${locationLabel}: ${project.location}`, { align: 'center' });
            }
          } else {
            doc.fontSize(12).font('Helvetica').text(`${sectorLabel}: ${project.industrySector}`, { align: 'center' });
            doc.font('Helvetica').text(`${locationLabel}: ${project.location}`, { align: 'center' });
          }
          doc.moveDown(2);

          // Helper function to add text with formatting (bold and headings)
          // For Telugu: Don't specify font, let PDFKit use default Unicode-supporting font
          // For English: Use Helvetica for better formatting
          const addFormattedText = (text: string, fontSize: number = 11) => {
            if (!text) return;
            
            const containsTelugu = isTeluguText(text);
            
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
                  const segmentText = segment.text;
                  const segmentIsTelugu = isTeluguText(segmentText);
                  
                  // For Telugu: Use registered Telugu font if available
                  // For English: Use Helvetica-Bold for headings
                  if (segmentIsTelugu) {
                    // Telugu text - use registered Telugu font
                    if (teluguFontRegistered) {
                      doc.fontSize(headingFontSize).font('NotoSansTelugu').text(segmentText, { 
                        continued: !isLast 
                      });
                    } else {
                      // Fallback: try without font (may not render correctly)
                      doc.fontSize(headingFontSize).text(segmentText, { 
                        continued: !isLast 
                      });
                    }
                  } else {
                    // English text - use Helvetica-Bold for headings
                    doc.fontSize(headingFontSize).font('Helvetica-Bold').text(segmentText, { 
                      continued: !isLast 
                    });
                  }
                });
                doc.moveDown(spacingAfter);
              } else if (para.originalText.trim().length > 0) {
                // Regular text paragraph
                para.content.forEach((segment, index) => {
                  const isLast = index === para.content.length - 1;
                  const segmentText = segment.text;
                  const segmentIsTelugu = isTeluguText(segmentText);
                  
                  if (segmentIsTelugu) {
                    // Telugu text - use registered Telugu font if available
                    if (teluguFontRegistered) {
                      doc.fontSize(fontSize).font('NotoSansTelugu').text(segmentText, { 
                        align: 'justify', 
                        continued: !isLast 
                      });
                    } else {
                      // Fallback: try without font (may not render correctly)
                      doc.fontSize(fontSize).text(segmentText, { 
                        align: 'justify', 
                        continued: !isLast 
                      });
                    }
                  } else {
                    // English text - use Helvetica with bold if needed
                    if (segment.bold) {
                      doc.fontSize(fontSize).font('Helvetica-Bold').text(segmentText, { 
                        align: 'justify', 
                        continued: !isLast 
                      });
                    } else {
                      doc.fontSize(fontSize).font('Helvetica').text(segmentText, { 
                        align: 'justify', 
                        continued: !isLast 
                      });
                    }
                  }
                });
                doc.moveDown(0.3);
              }
            });
          };

          // Section labels based on language
          const sectionLabels = language === 'telugu' ? {
            executiveSummary: '1. కార్యనిర్వాహక సారాంశం',
            businessProfile: '2. వ్యాపార ప్రొఫైల్',
            marketAnalysis: '3. మార్కెట్ విశ్లేషణ',
            technicalFeasibility: '4. సాంకేతిక సాధ్యత',
            financialProjections: '5. ఆర్థిక అంచనాలు',
            conclusion: '6. ముగింపు',
            financialSummary: 'ఆర్థిక సారాంశం',
            projectCostBreakdown: 'ప్రాజెక్ట్ ఖర్చు విభజన:',
            meansOfFinance: 'ఆర్థిక మార్గాలు:'
          } : {
            executiveSummary: '1. Executive Summary',
            businessProfile: '2. Business Profile',
            marketAnalysis: '3. Market Analysis',
            technicalFeasibility: '4. Technical Feasibility',
            financialProjections: '5. Financial Projections',
            conclusion: '6. Conclusion',
            financialSummary: 'Financial Summary',
            projectCostBreakdown: 'Project Cost Breakdown:',
            meansOfFinance: 'Means of Finance:'
          };

          // Helper to render section headers with proper font
          const renderSectionHeader = (text: string) => {
            const isTelugu = isTeluguText(text);
            if (isTelugu) {
              if (teluguFontRegistered) {
                doc.fontSize(16).font('NotoSansTelugu').text(text, { underline: true });
              } else {
                doc.fontSize(16).text(text, { underline: true });
              }
            } else {
              doc.fontSize(16).font('Helvetica-Bold').text(text, { underline: true });
            }
          };

          // Executive Summary
          doc.addPage();
          renderSectionHeader(sectionLabels.executiveSummary);
          doc.moveDown();
          addFormattedText(contentLang.executiveSummary || '');
          doc.moveDown();

          // Business Profile
          doc.addPage();
          renderSectionHeader(sectionLabels.businessProfile);
          doc.moveDown();
          addFormattedText(contentLang.businessProfile || '');
          doc.moveDown();

          // Market Analysis
          doc.addPage();
          renderSectionHeader(sectionLabels.marketAnalysis);
          doc.moveDown();
          addFormattedText(contentLang.marketAnalysis || '');
          doc.moveDown();

          // Technical Feasibility
          doc.addPage();
          renderSectionHeader(sectionLabels.technicalFeasibility);
          doc.moveDown();
          addFormattedText(contentLang.technicalFeasibility || '');
          doc.moveDown();

          // Financial Projections
          doc.addPage();
          renderSectionHeader(sectionLabels.financialProjections);
          doc.moveDown();
          addFormattedText(contentLang.financialProjections || '');
          doc.moveDown();

          // Financial Tables (if available)
          if (dpr.financials && dpr.financials.projectCost) {
            doc.addPage();
            renderSectionHeader(sectionLabels.financialSummary);
            doc.moveDown();
            
            // Project Cost
            renderSectionHeader(sectionLabels.projectCostBreakdown);
            doc.fontSize(10);
            const fixedCapitalLabel = language === 'telugu' ? 'మొత్తం స్థిర మూలధనం' : 'Total Fixed Capital';
            const workingCapitalLabel = language === 'telugu' ? 'మొత్తం పని మూలధనం' : 'Total Working Capital';
            const totalProjectCostLabel = language === 'telugu' ? 'మొత్తం ప్రాజెక్ట్ ఖర్చు' : 'Total Project Cost';
            
            // Render financial labels with proper font handling
            const renderFinancialText = (text: string) => {
              if (isTeluguText(text)) {
                // Telugu text - use registered Telugu font if available
                if (teluguFontRegistered) {
                  doc.font('NotoSansTelugu').text(text);
                } else {
                  doc.text(text);
                }
              } else {
                // English text - use Helvetica
                doc.font('Helvetica').text(text);
              }
            };
            
            if (dpr.financials.projectCost.fixedCapital) {
              renderFinancialText(`${fixedCapitalLabel}: ₹${dpr.financials.projectCost.fixedCapital.total?.toLocaleString() || '0'}`);
            }
            if (dpr.financials.projectCost.workingCapital) {
              renderFinancialText(`${workingCapitalLabel}: ₹${dpr.financials.projectCost.workingCapital.total?.toLocaleString() || '0'}`);
            }
            if (dpr.financials.projectCost.totalProjectCost) {
              renderFinancialText(`${totalProjectCostLabel}: ₹${dpr.financials.projectCost.totalProjectCost.toLocaleString()}`);
            }
            doc.moveDown();

            // Means of Finance
            if (dpr.financials.meansOfFinance) {
              renderSectionHeader(sectionLabels.meansOfFinance);
              doc.fontSize(10);
              const ownContributionLabel = language === 'telugu' ? 'సొంత సహకారం' : 'Own Contribution';
              const termLoanLabel = language === 'telugu' ? 'టర్మ్ లోన్' : 'Term Loan';
              
              if (dpr.financials.meansOfFinance.ownContribution) {
                renderFinancialText(`${ownContributionLabel}: ₹${dpr.financials.meansOfFinance.ownContribution.amount?.toLocaleString() || '0'} (${dpr.financials.meansOfFinance.ownContribution.percentage || 0}%)`);
              }
              if (dpr.financials.meansOfFinance.termLoan) {
                renderFinancialText(`${termLoanLabel}: ₹${dpr.financials.meansOfFinance.termLoan.amount?.toLocaleString() || '0'} (${dpr.financials.meansOfFinance.termLoan.percentage || 0}%)`);
              }
              doc.moveDown();
            }
          }

          // Conclusion
          doc.addPage();
          renderSectionHeader(sectionLabels.conclusion);
          doc.moveDown();
          addFormattedText(contentLang.conclusion || '');

          doc.end();
        } catch (error) {
          reject(error);
        }
      });
    } catch (error: any) {
      console.error('Error in generatePDF:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }

  /**
   * Generate DOCX document
   */
  static async generateDOCX(dprId: string, language: 'english' | 'telugu'): Promise<Buffer> {
    try {
      const dpr = await this.getDPR(dprId);
      if (!dpr) {
        throw new Error('DPR not found');
      }
      
      const project = dpr.projectId;
      if (!project) {
        throw new Error('Project not found for DPR');
      }

      // Safely access content with fallback
      const content = dpr.content || {};
      const contentLang = language === 'telugu' 
        ? (content.telugu || content.english || {}) 
        : (content.english || {});

      if (!contentLang || Object.keys(contentLang).length === 0) {
        throw new Error(`No ${language} content available for this DPR`);
      }

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

    // Section labels based on language
    const sectionLabels = language === 'telugu' ? {
      title: 'వివరణాత్మక ప్రాజెక్ట్ నివేదిక',
      sector: 'రంగం',
      location: 'స్థానం',
      executiveSummary: '1. కార్యనిర్వాహక సారాంశం',
      businessProfile: '2. వ్యాపార ప్రొఫైల్',
      marketAnalysis: '3. మార్కెట్ విశ్లేషణ',
      technicalFeasibility: '4. సాంకేతిక సాధ్యత',
      financialProjections: '5. ఆర్థిక అంచనాలు',
      conclusion: '6. ముగింపు'
    } : {
      title: 'Detailed Project Report',
      sector: 'Sector',
      location: 'Location',
      executiveSummary: '1. Executive Summary',
      businessProfile: '2. Business Profile',
      marketAnalysis: '3. Market Analysis',
      technicalFeasibility: '4. Technical Feasibility',
      financialProjections: '5. Financial Projections',
      conclusion: '6. Conclusion'
    };

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: sectionLabels.title,
              heading: HeadingLevel.TITLE,
            }),
            new Paragraph({
              text: project.projectName,
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              text: `${sectionLabels.sector}: ${project.industrySector}`,
            }),
            new Paragraph({
              text: `${sectionLabels.location}: ${project.location}`,
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              text: sectionLabels.executiveSummary,
              heading: HeadingLevel.HEADING_2,
            }),
            ...createFormattedParagraphs(contentLang.executiveSummary || ''),
            new Paragraph({
              text: sectionLabels.businessProfile,
              heading: HeadingLevel.HEADING_2,
            }),
            ...createFormattedParagraphs(contentLang.businessProfile || ''),
            new Paragraph({
              text: sectionLabels.marketAnalysis,
              heading: HeadingLevel.HEADING_2,
            }),
            ...createFormattedParagraphs(contentLang.marketAnalysis || ''),
            new Paragraph({
              text: sectionLabels.technicalFeasibility,
              heading: HeadingLevel.HEADING_2,
            }),
            ...createFormattedParagraphs(contentLang.technicalFeasibility || ''),
            new Paragraph({
              text: sectionLabels.financialProjections,
              heading: HeadingLevel.HEADING_2,
            }),
            ...createFormattedParagraphs(contentLang.financialProjections || ''),
            new Paragraph({
              text: sectionLabels.conclusion,
              heading: HeadingLevel.HEADING_2,
            }),
            ...createFormattedParagraphs(contentLang.conclusion || ''),
          ],
        },
      ],
    });

    return Packer.toBuffer(doc);
    } catch (error: any) {
      console.error('Error in generateDOCX:', error);
      throw new Error(`Failed to generate DOCX: ${error.message}`);
    }
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

  /**
   * Extract text from uploaded DPR file using OpenAI
   */
  static async extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
    try {
      // For text files, read directly
      if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
        return await fs.promises.readFile(filePath, 'utf-8');
      }

      // For PDF and DOCX, use OpenAI's file API to extract text
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Upload file to OpenAI
      const fileStream = fs.createReadStream(filePath);
      const uploadedFile = await openai.files.create({
        file: fileStream,
        purpose: 'assistants',
      });

      // Use OpenAI to extract text content
      // Create a simple assistant to extract text
      const assistant = await openai.beta.assistants.create({
        model: 'gpt-4o-mini',
        instructions: 'Extract all text content from the uploaded document. Return only the extracted text without any formatting or analysis.',
        tools: [{ type: 'file_search' }],
        tool_resources: {
          file_search: {
            vector_store_ids: [],
          },
        },
      });

      const thread = await openai.beta.threads.create({
        messages: [
          {
            role: 'user',
            content: 'Extract all text content from this document. Return the complete text as-is.',
            attachments: [
              {
                file_id: uploadedFile.id,
                tools: [{ type: 'file_search' }],
              },
            ],
          },
        ],
      });

      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistant.id,
      });

      // Wait for completion (with timeout)
      let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max

      while (runStatus.status !== 'completed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        attempts++;
      }

      if (runStatus.status !== 'completed') {
        // Cleanup before throwing error
        await openai.beta.assistants.del(assistant.id).catch(() => {});
        await openai.beta.threads.del(thread.id).catch(() => {});
        await openai.files.del(uploadedFile.id).catch(() => {});
        throw new Error('Text extraction timeout. The file may be too large or complex.');
      }

      // Get the extracted text
      const messages = await openai.beta.threads.messages.list(thread.id, {
        limit: 1,
        order: 'desc',
      });

      const extractedText = messages.data[0]?.content[0]?.type === 'text'
        ? messages.data[0].content[0].text.value
        : '';

      // Cleanup
      await openai.beta.assistants.del(assistant.id).catch(() => {});
      await openai.beta.threads.del(thread.id).catch(() => {});
      await openai.files.del(uploadedFile.id).catch(() => {});

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from the document. The file may be corrupted or contain only images.');
      }

      return extractedText;
    } catch (error: any) {
      console.error('Error extracting text from file:', error);
      throw new Error(`Failed to extract text from file: ${error.message}`);
    }
  }

  /**
   * Analyze uploaded DPR content and structure it
   */
  static async analyzeUploadedDPR(fileText: string, fileName: string): Promise<{
    content: any;
    projectInfo: any;
    suggestions: string[];
  }> {
    try {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const prompt = `Analyze this uploaded DPR (Detailed Project Report) document and extract structured information.

Document Name: ${fileName}
Document Content:
${fileText.substring(0, 15000)}${fileText.length > 15000 ? '\n\n[Content truncated...]' : ''}

Extract and structure the DPR content into the following sections:
1. executiveSummary
2. businessProfile
3. marketAnalysis
4. technicalFeasibility
5. financialProjections
6. conclusion

Also extract project information:
- projectName
- industrySector
- location
- projectType
- totalCost (if mentioned)
- loanAmount (if mentioned)

Additionally, provide suggestions for improvement based on the content quality.

Return a JSON object with this structure:
{
  "content": {
    "english": {
      "executiveSummary": "...",
      "businessProfile": "...",
      "marketAnalysis": "...",
      "technicalFeasibility": "...",
      "financialProjections": "...",
      "conclusion": "..."
    }
  },
  "projectInfo": {
    "projectName": "...",
    "industrySector": "...",
    "location": "...",
    "projectType": "...",
    "totalCost": 0,
    "loanAmount": 0
  },
  "suggestions": ["suggestion 1", "suggestion 2", ...]
}

Return only valid JSON without markdown formatting.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 4000,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      let analysis;
      try {
        analysis = JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error('Failed to parse AI analysis response:', parseError);
        // Return a basic structure if parsing fails
        analysis = {
          content: {
            english: {
              executiveSummary: fileText.substring(0, 500) || 'No summary available',
              businessProfile: fileText.substring(500, 1000) || 'No business profile available',
              marketAnalysis: fileText.substring(1000, 1500) || 'No market analysis available',
              technicalFeasibility: fileText.substring(1500, 2000) || 'No technical feasibility available',
              financialProjections: fileText.substring(2000, 2500) || 'No financial projections available',
              conclusion: fileText.substring(2500, 3000) || 'No conclusion available',
            },
          },
          projectInfo: {
            projectName: fileName.replace(/\.[^/.]+$/, ''),
            industrySector: 'Other',
            location: 'Not specified',
            projectType: 'Other',
            totalCost: 0,
            loanAmount: 0,
          },
          suggestions: ['Please review and update the extracted content for accuracy.'],
        };
      }

      return {
        content: analysis.content || { english: {} },
        projectInfo: analysis.projectInfo || {},
        suggestions: analysis.suggestions || [],
      };
    } catch (error: any) {
      console.error('Error analyzing uploaded DPR:', error);
      throw new Error(`Failed to analyze uploaded DPR: ${error.message}`);
    }
  }

  /**
   * Process uploaded DPR file
   */
  static async processUploadedDPR(
    filePath: string,
    fileName: string,
    mimeType: string,
    userId: string
  ): Promise<any> {
    try {
      console.log(`📄 Processing uploaded DPR: ${fileName}`);

      // Extract text from file
      console.log('📖 Extracting text from file...');
      const fileText = await this.extractTextFromFile(filePath, mimeType);

      if (!fileText || fileText.trim().length === 0) {
        throw new Error('No text could be extracted from the uploaded file');
      }

      // Analyze and structure the content
      console.log('🤖 Analyzing DPR content with AI...');
      const analysis = await this.analyzeUploadedDPR(fileText, fileName);

      // Create or find project
      let project = await Project.findOne({
        userId,
        projectName: analysis.projectInfo.projectName || 'Uploaded DPR Project',
      });

      if (!project) {
        project = await Project.create({
          userId,
          projectName: analysis.projectInfo.projectName || 'Uploaded DPR Project',
          industrySector: analysis.projectInfo.industrySector || 'Other',
          projectType: analysis.projectInfo.projectType || 'Other',
          location: analysis.projectInfo.location || 'Not specified',
          totalCost: analysis.projectInfo.totalCost || 0,
          loanAmount: analysis.projectInfo.loanAmount || 0,
          status: 'completed',
        });
      }

      // Create DPR
      const dprVersion = await DPRVersion.create({
        projectId: project._id.toString(),
        content: analysis.content,
        status: 'draft',
        generatedAt: new Date(),
      });

      // Calculate quality score (async, don't wait)
      QualityService.updateDPRQuality(dprVersion._id.toString()).catch(err => {
        console.error('Error calculating quality score:', err);
      });

      console.log(`✅ Uploaded DPR processed successfully: ${dprVersion._id}`);

      return {
        dprId: dprVersion._id,
        content: dprVersion.content,
        projectInfo: analysis.projectInfo,
        suggestions: analysis.suggestions,
        projectId: project._id,
      };
    } catch (error: any) {
      console.error('Error processing uploaded DPR:', error);
      throw error;
    }
  }
}

