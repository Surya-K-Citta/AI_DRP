// @ts-nocheck
import { IProject } from '../types';
import { DPRVersion } from '../models/DPRVersion.model';
import { Project } from '../models/Project.model';
import { OpenAIService } from './openai.service';
import { FinancialService } from './financial.service';
import { QualityService } from './quality.service';
import { processMarkdownBold, removeMarkdownBold, processMarkdownText, ProcessedParagraph } from '../utils/textProcessor';
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from 'docx';
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
      // Fetch project with all needed fields including stepData and eligibleSchemes
      const project = await Project.findById(projectId)
        .select('projectName industrySector projectType totalCost loanAmount ownContribution location inputs eligibleSchemes stepData')
        .lean(); // Use lean() for faster queries
      if (!project) {
        throw new Error('Project not found');
      }
      
      // Debug: Log eligibleSchemes to verify they're being fetched
      if ((project as any).eligibleSchemes) {
        console.log('📋 Eligible Schemes fetched from database:', {
          selectedSchemes: (project as any).eligibleSchemes?.selectedSchemes?.length || 0,
          schemesData: (project as any).eligibleSchemes?.schemesData?.length || 0,
        });
      } else {
        console.log('⚠️ No eligibleSchemes found in database for project:', projectId);
      }

      // Debug: Log stepData to verify it's being fetched
      if ((project as any).stepData) {
        console.log('📊 StepData fetched from database:', {
          hasStepData: true,
          stepDataKeys: Object.keys((project as any).stepData || {}),
        });
      } else {
        console.log('⚠️ No stepData found in database for project:', projectId);
      }

      // Generate AI content with comprehensive step data
      console.log('Generating AI content with comprehensive step data...');
      const content = await OpenAIService.generateCompleteDPR(project, language);

      // Generate financial projections
      console.log('Generating financial projections...');
      const financials = FinancialService.generateCompleteFinancials(project);

      // Extract eligible schemes from project
      const eligibleSchemes = (project as any).eligibleSchemes ? {
        selectedSchemes: (project as any).eligibleSchemes.selectedSchemes || [],
        schemesData: (project as any).eligibleSchemes.schemesData || [],
      } : undefined;

      // Create DPR with eligible schemes
      const dprVersion = await DPRVersion.create({
        projectId,
        content,
        financials,
        language,
        eligibleSchemes,
        generatedAt: new Date(),
        status: 'draft',
      });

      // Log eligible schemes storage
      if (eligibleSchemes) {
        console.log(`📋 Stored ${eligibleSchemes.schemesData?.length || 0} eligible schemes in DPR`);
      }

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
    // Fetch project separately since projectId is stored as String, include stepData and ownContribution
    const project = await Project.findById(dpr.projectId).select('projectName industrySector projectType totalCost loanAmount ownContribution location inputs eligibleSchemes stepData');
    if (project) {
      dpr.projectId = project as any;
      
      // For cluster DPRs, ensure clusterData is available in content if missing
      const isClusterDPR = (dpr.content?.english?.isClusterDPR || dpr.content?.telugu?.isClusterDPR) || project.projectType === 'cluster';
      if (isClusterDPR && project.stepData) {
        // If clusterData is missing from content, add it from project.stepData
        if (!dpr.content?.english?.clusterData && project.stepData) {
          if (!dpr.content) dpr.content = {};
          if (!dpr.content.english) dpr.content.english = {};
          dpr.content.english.clusterData = project.stepData;
        }
        if (!dpr.content?.telugu?.clusterData && project.stepData) {
          if (!dpr.content) dpr.content = {};
          if (!dpr.content.telugu) dpr.content.telugu = {};
          dpr.content.telugu.clusterData = project.stepData;
        }
        // Also add to metadata as fallback
        if (!dpr.metadata) dpr.metadata = {};
        dpr.metadata.clusterData = project.stepData;
      }
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
   * Check if Pandoc is available for DOCX to PDF conversion
   * Pandoc is a universal document converter that supports Telugu well
   */
  private static async checkPandocAvailable(): Promise<{ available: boolean; command: string; error?: string }> {
    try {
      // Check if pandoc is in PATH
      await execAsync('pandoc --version');
      return { available: true, command: 'pandoc' };
    } catch {
      return {
        available: false,
        command: '',
        error: 'Pandoc not found. Install from https://pandoc.org/installing.html'
      };
    }
  }

  /**
   * Convert DOCX to PDF using Pandoc
   * Pandoc requires a LaTeX distribution (like MiKTeX or TeX Live) for PDF output
   */
  private static async convertDocxToPdfWithPandoc(docxPath: string, outputDir: string): Promise<string> {
    const pdfPath = docxPath.replace('.docx', '.pdf');
    const pandocCmd = `pandoc "${docxPath}" -o "${pdfPath}" --pdf-engine=xelatex`;
    
    console.log(`🔄 Converting DOCX to PDF using Pandoc...`);
    console.log(`   Command: ${pandocCmd}`);
    
    try {
      await execAsync(pandocCmd, {
        timeout: 60000,
        maxBuffer: 10 * 1024 * 1024
      });
      
      if (fs.existsSync(pdfPath)) {
        console.log('✅ Successfully converted DOCX to PDF using Pandoc');
        return pdfPath;
      } else {
        throw new Error('Pandoc conversion failed - PDF file was not created');
      }
    } catch (error: any) {
      // If xelatex fails, try with pdflatex (less Unicode support but might work)
      if (error.message.includes('xelatex') || error.message.includes('LaTeX')) {
        console.log('⚠️  XeLaTeX not available, trying with pdflatex...');
        const pandocCmdPdflatex = `pandoc "${docxPath}" -o "${pdfPath}" --pdf-engine=pdflatex`;
        try {
          await execAsync(pandocCmdPdflatex, {
            timeout: 60000,
            maxBuffer: 10 * 1024 * 1024
          });
          if (fs.existsSync(pdfPath)) {
            console.log('✅ Successfully converted DOCX to PDF using Pandoc (pdflatex)');
            return pdfPath;
          }
        } catch (pdflatexError: any) {
          throw new Error(`Pandoc conversion failed: ${error.message}. Note: Pandoc requires LaTeX (MiKTeX or TeX Live) for PDF output.`);
        }
      }
      throw error;
    }
  }

  /**
   * Generate PDF document
   * For Telugu: Generate Word document first, then convert to PDF (ensures proper Unicode support)
   * For English: Generate PDF directly (works fine with PDFKit)
   */
  static async generatePDF(dprId: string, language: 'english' | 'telugu'): Promise<Buffer> {
    // For Telugu language, ALWAYS use Word document conversion to PDF
    // DOCX library handles Telugu perfectly, so we convert DOCX -> PDF
    // Try multiple conversion methods in order: LibreOffice -> Pandoc -> Error
    if (language === 'telugu') {
      console.log('📄 Generating Telugu PDF via Word conversion (DOCX handles Telugu perfectly)...');
      
      try {
        // First generate Word document (which handles Telugu perfectly)
        const docxBuffer = await this.generateDOCX(dprId, language);
        
        // Create temporary files
        const tempDir = os.tmpdir();
        const tempDocxPath = path.join(tempDir, `dpr_${dprId}_${Date.now()}.docx`);
        
        // Write DOCX to temp file
        fs.writeFileSync(tempDocxPath, docxBuffer);
        console.log(`✅ Generated Word document: ${tempDocxPath}`);
        
        let pdfPath: string | null = null;
        let conversionMethod = '';
        
        // Method 1: Try LibreOffice (preferred - best Telugu support)
        const libreOfficeCheck = await this.checkLibreOfficeAvailable();
        if (libreOfficeCheck.available) {
          try {
            const libreOfficeCmd = `${libreOfficeCheck.command} --headless --convert-to pdf --outdir "${tempDir}" "${tempDocxPath}"`;
            
            console.log(`🔄 Converting Word to PDF using LibreOffice...`);
            console.log(`   Command: ${libreOfficeCmd}`);
            
            await execAsync(libreOfficeCmd, { 
              timeout: 60000,
              maxBuffer: 10 * 1024 * 1024
            });
            
            pdfPath = tempDocxPath.replace('.docx', '.pdf');
            
            // Wait for file to be written
            let retries = 20;
            while (!fs.existsSync(pdfPath) && retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 500));
              retries--;
            }
            
            if (fs.existsSync(pdfPath)) {
              conversionMethod = 'LibreOffice';
            } else {
              throw new Error('LibreOffice conversion failed - PDF file was not created');
            }
          } catch (error: any) {
            console.warn('⚠️  LibreOffice conversion failed:', error.message);
            console.log('   Trying alternative: Pandoc...');
          }
        }
        
        // Method 2: Try Pandoc (if LibreOffice failed or not available)
        if (!pdfPath || !fs.existsSync(pdfPath)) {
          const pandocCheck = await this.checkPandocAvailable();
          if (pandocCheck.available) {
            try {
              pdfPath = await this.convertDocxToPdfWithPandoc(tempDocxPath, tempDir);
              conversionMethod = 'Pandoc';
            } catch (error: any) {
              console.warn('⚠️  Pandoc conversion failed:', error.message);
            }
          }
        }
        
        // If we have a successful conversion, return the PDF
        if (pdfPath && fs.existsSync(pdfPath)) {
          const pdfBuffer = fs.readFileSync(pdfPath);
          
          // Clean up temp files
          try { fs.unlinkSync(tempDocxPath); } catch {}
          try { fs.unlinkSync(pdfPath); } catch {}
          
          console.log(`✅ Successfully converted Word to PDF for Telugu using ${conversionMethod}`);
          return pdfBuffer;
        }
        
        // If all methods failed, provide helpful error message
        const errorMessages = [];
        if (!libreOfficeCheck.available) {
          errorMessages.push(`LibreOffice: ${libreOfficeCheck.error || 'Not installed'}`);
        }
        const pandocCheck = await this.checkPandocAvailable();
        if (!pandocCheck.available) {
          errorMessages.push(`Pandoc: ${pandocCheck.error || 'Not installed'}`);
        }
        
        throw new Error(
          `No PDF conversion tool available for Telugu PDF generation.\n\n` +
          `Reason: PDFKit cannot properly handle Telugu fonts, but DOCX generation works perfectly.\n\n` +
          `Available Solutions:\n` +
          `1. Install LibreOffice (Recommended): https://www.libreoffice.org/\n` +
          `   - Best Telugu support and formatting\n` +
          `   - Free and open-source\n\n` +
          `2. Install Pandoc: https://pandoc.org/installing.html\n` +
          `   - Also requires LaTeX (MiKTeX or TeX Live)\n` +
          `   - Good Unicode support\n\n` +
          `3. Download DOCX file: The Word document (.docx) displays Telugu perfectly\n` +
          `   - Can be opened in Microsoft Word, Google Docs, or LibreOffice Writer\n` +
          `   - Can be converted to PDF manually using any of the above tools\n\n` +
          `Current Status:\n${errorMessages.map(msg => `   - ${msg}`).join('\n')}`
        );
      } catch (error: any) {
        // Clean up temp files
        try {
          const tempDir = os.tmpdir();
          const files = fs.readdirSync(tempDir);
          files.forEach(file => {
            if (file.includes(`dpr_${dprId}`)) {
              try { fs.unlinkSync(path.join(tempDir, file)); } catch {}
            }
          });
        } catch {}
        
        console.error('Error generating Telugu PDF:', error);
        throw error;
      }
    }
    
    // For English language or Telugu fallback, generate PDF directly using PDFKit
    try {
      const dpr = await this.getDPR(dprId);
      if (!dpr) {
        throw new Error('DPR not found');
      }
      
      const project = dpr.projectId;
      if (!project) {
        throw new Error('Project not found for DPR');
      }

      // Check if this is a cluster DPR
      const isClusterDPR = (dpr.content?.english?.isClusterDPR || dpr.content?.telugu?.isClusterDPR) || project.projectType === 'cluster';
      
      // If it's a cluster DPR, use the cluster-specific PDF generation
      if (isClusterDPR) {
        return await this.generateClusterDPRPDF(dpr, project, language);
      }

      // Safely access content with fallback - use correct language content
      const content = dpr.content || {};
      const contentLang = language === 'telugu' 
        ? (content.telugu || content.english || {}) 
        : (content.english || {});

      if (!contentLang || Object.keys(contentLang).length === 0) {
        throw new Error(`No ${language} content available for this DPR`);
      }

      return new Promise((resolve, reject) => {
        try {
          // PDFKit configuration for better Unicode support with A4 page layout
          const doc = new PDFDocument({ 
            size: 'A4',
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
              // Validate font file exists and is readable
              const fontStats = fs.statSync(teluguFontPath);
              if (fontStats.size === 0) {
                throw new Error('Font file is empty');
              }
              
              // Try to read font as Buffer first to validate it
              const fontBuffer = fs.readFileSync(teluguFontPath);
              if (fontBuffer.length === 0) {
                throw new Error('Font file could not be read');
              }
              
              // Register font using the file path (PDFKit handles TTF files)
              // Note: Font registration might succeed but font usage might fail
              // We'll handle font usage errors with try-catch blocks throughout the code
              doc.registerFont('NotoSansTelugu', teluguFontPath);
              teluguFontRegistered = true;
              console.log('✅ Telugu font registered from:', teluguFontPath);
              console.log('   Note: Font will be tested when first used. If it fails, will fall back to default font.');
            } catch (fontError: any) {
              console.warn('⚠️  Failed to register Telugu font:', fontError.message);
              console.warn('   Font file path:', teluguFontPath);
              console.warn('   Telugu text may not render correctly in PDF');
              console.warn('   The font file may be corrupted or in an unsupported format');
              console.warn('   Please re-download the font from: https://fonts.google.com/noto/specimen/Noto+Sans+Telugu');
              teluguFontRegistered = false;
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

          // Helper function to safely apply Telugu font with fallback
          // This handles cases where font registration appears to succeed but actually fails when used
          const safeApplyTeluguFont = (callback: () => void) => {
            if (teluguFontRegistered) {
              try {
                doc.font('NotoSansTelugu');
                callback();
                return true;
              } catch (fontError: any) {
                // Font registration appeared to succeed but actually failed when used
                console.warn('⚠️  Telugu font failed when used, falling back to default font:', fontError.message);
                teluguFontRegistered = false; // Disable future attempts
                // Fall through to default font
                callback();
                return false;
              }
            } else {
              callback();
              return false;
            }
          };

          // Detect if content contains Telugu characters
          const hasTelugu = /[\u0C00-\u0C7F]/.test(contentLang.executiveSummary || '');
          
          // Title Page - Matching Floor Polish format
          const title = language === 'telugu' ? 'వివరణాత్మక ప్రాజెక్ట్ నివేదిక' : 'PROJECT PROFILE';
          const titleIsTelugu = isTeluguText(title);
          
          // Use blue color for title (matching Floor Polish document style)
          doc.fillColor('#1E40AF'); // Blue color
          
          // For Telugu title, use registered Telugu font if available
          if (titleIsTelugu) {
            if (teluguFontRegistered) {
              safeApplyTeluguFont(() => {
                doc.fontSize(24).text(title, { align: 'center' });
              });
            } else {
              doc.fontSize(24).text(title, { align: 'center' });
            }
          } else {
            doc.fontSize(24).font('Helvetica-Bold').text(title, { align: 'center' });
          }
          doc.moveDown();
          
          // Project name
          doc.fillColor('#000000'); // Black for project name
          const projectNameIsTelugu = isTeluguText(project.projectName);
          if (projectNameIsTelugu) {
            if (teluguFontRegistered) {
              safeApplyTeluguFont(() => {
                doc.fontSize(18).text(project.projectName, { align: 'center' });
              });
            } else {
              doc.fontSize(18).text(project.projectName, { align: 'center' });
            }
          } else {
            doc.fontSize(18).font('Helvetica-Bold').text(project.projectName, { align: 'center' });
          }
          doc.moveDown();
          
          const sectorLabel = language === 'telugu' ? 'రంగం' : 'Sector';
          const locationLabel = language === 'telugu' ? 'స్థానం' : 'Location';
          
          // Sector and Location
          if (language === 'telugu') {
            if (teluguFontRegistered) {
              safeApplyTeluguFont(() => {
                doc.fontSize(12).text(`${sectorLabel}: ${project.industrySector}`, { align: 'center' });
              });
              safeApplyTeluguFont(() => {
                doc.text(`${locationLabel}: ${project.location}`, { align: 'center' });
              });
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
              if (para.type === 'table' && para.tableData) {
                // Render table
                doc.moveDown(0.5);
                const tableData = para.tableData;
                const tableWidth = 500;
                const colCount = tableData[0]?.length || 0;
                const colWidth = tableWidth / colCount;
                const rowHeight = 20;
                
                // Draw table header (first row) with background - Floor Polish format
                if (tableData.length > 0) {
                  let x = doc.x;
                  const startY = doc.y;
                  
                  // Draw header row with light gray background (matching Floor Polish format)
                  doc.rect(x, startY, tableWidth, rowHeight).fill('#D3D3D3'); // Light gray for table headers
                  
                  // Draw header text in bold
                  tableData[0].forEach((cell, colIndex) => {
                    const cellX = x + (colIndex * colWidth);
                    const cellIsTelugu = isTeluguText(cell);
                    doc.fontSize(fontSize - 1).font('Helvetica-Bold');
                    if (cellIsTelugu && teluguFontRegistered) {
                      try {
                        doc.font('NotoSansTelugu');
                      } catch (e) {
                        // Font failed, continue with default font
                        teluguFontRegistered = false;
                      }
                    }
                    doc.fillColor('#000000'); // Black text
                    doc.text(cell, cellX + 5, startY + 5, {
                      width: colWidth - 10,
                      height: rowHeight - 10,
                      align: 'left',
                    });
                  });
                  
                  // Draw data rows with alternating row colors for better readability
                  for (let rowIndex = 1; rowIndex < tableData.length; rowIndex++) {
                    const rowY = startY + (rowIndex * rowHeight);
                    
                    // Alternate row background color (white and light blue)
                    if (rowIndex % 2 === 0) {
                      doc.rect(x, rowY, tableWidth, rowHeight).fill('#F0F8FF'); // Light blue for even rows
                    } else {
                      doc.rect(x, rowY, tableWidth, rowHeight).fill('#FFFFFF'); // White for odd rows
                    }
                    
                    // Draw cell borders
                    doc.rect(x, rowY, tableWidth, rowHeight).stroke('#CCCCCC');
                    
                    tableData[rowIndex].forEach((cell, colIndex) => {
                      const cellX = x + (colIndex * colWidth);
                      const cellIsTelugu = isTeluguText(cell);
                      doc.fontSize(fontSize - 1).font('Helvetica');
                      if (cellIsTelugu && teluguFontRegistered) {
                        try {
                          doc.font('NotoSansTelugu');
                        } catch (e) {
                          // Font failed, continue with default font
                          teluguFontRegistered = false;
                        }
                      }
                      doc.fillColor('#000000'); // Black text
                      doc.text(cell || '', cellX + 5, rowY + 5, {
                        width: colWidth - 10,
                        height: rowHeight - 10,
                        align: 'left',
                      });
                    });
                  }
                  
                  // Draw outer border
                  doc.rect(x, startY, tableWidth, tableData.length * rowHeight).stroke('#000000');
                  
                  // Draw vertical lines
                  for (let i = 1; i < colCount; i++) {
                    const lineX = x + (i * colWidth);
                    doc.moveTo(lineX, startY)
                      .lineTo(lineX, startY + (tableData.length * rowHeight))
                      .stroke('#000000');
                  }
                  
                  // Reset fill color and position to left margin after table
                  doc.fillColor('#000000');
                  doc.y = startY + (tableData.length * rowHeight);
                  doc.x = 50; // Reset to left margin
                  doc.moveDown(1);
                }
              } else if (para.type === 'heading') {
                // Render heading as semi-bold subheading
                doc.moveDown(0.5);
                // Ensure x position is at left margin before rendering heading
                doc.x = 50;
                
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
                      try {
                        doc.fontSize(headingFontSize).font('NotoSansTelugu').text(segmentText, { 
                          align: 'left',
                          width: 500,
                          continued: !isLast 
                        });
                      } catch (e) {
                        // Font failed, fall back to default
                        teluguFontRegistered = false;
                        doc.fontSize(headingFontSize).text(segmentText, { 
                          align: 'left',
                          width: 500,
                          continued: !isLast 
                        });
                      }
                    } else {
                      // Fallback: try without font (may not render correctly)
                      doc.fontSize(headingFontSize).text(segmentText, { 
                        align: 'left',
                        width: 500,
                        continued: !isLast 
                      });
                    }
                  } else {
                    // English text - use Helvetica-Bold for headings
                    doc.fontSize(headingFontSize).font('Helvetica-Bold').text(segmentText, { 
                      align: 'left',
                      width: 500,
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
                    // Ensure x position is at left margin before rendering text
                    doc.x = 50;
                    if (teluguFontRegistered) {
                      try {
                        doc.fontSize(fontSize).font('NotoSansTelugu').text(segmentText, { 
                          align: 'left', 
                          width: 500, // Set explicit width for proper alignment
                          continued: !isLast 
                        });
                      } catch (e) {
                        // Font failed, fall back to default
                        teluguFontRegistered = false;
                        doc.fontSize(fontSize).text(segmentText, { 
                          align: 'left', 
                          width: 500, // Set explicit width for proper alignment
                          continued: !isLast 
                        });
                      }
                    } else {
                      // Fallback: try without font (may not render correctly)
                      doc.fontSize(fontSize).text(segmentText, { 
                        align: 'left', 
                        width: 500, // Set explicit width for proper alignment
                        continued: !isLast 
                      });
                    }
                  } else {
                    // English text - use Helvetica with bold if needed
                    // Ensure x position is at left margin before rendering text
                    doc.x = 50;
                    if (segment.bold) {
                      doc.fontSize(fontSize).font('Helvetica-Bold').text(segmentText, { 
                        align: 'left', 
                        width: 500, // Set explicit width for proper alignment
                        continued: !isLast 
                      });
                    } else {
                      doc.fontSize(fontSize).font('Helvetica').text(segmentText, { 
                        align: 'left', 
                        width: 500, // Set explicit width for proper alignment
                        continued: !isLast 
                      });
                    }
                  }
                });
                doc.moveDown(0.3);
              }
            });
          };

          // Section labels based on language - includes all AI-Guided DPR Builder sections
          const sectionLabels = language === 'telugu' ? {
            executiveSummary: '1. కార్యనిర్వాహక సారాంశం',
            businessProfile: '2. వ్యాపార ప్రొఫైల్',
            applicantInfo: '3. దరఖాస్తుదారు సమాచారం',
            projectAtGlance: '4. ప్రాజెక్ట్ సంగ్రహం',
            buildingDetails: '5. భవన వివరాలు',
            machineryDetails: '6. యంత్రసామగ్రి వివరాలు',
            otherCapitalCosts: '7. ఇతర మూలధన ఖర్చులు',
            rawMaterials: '8. ముడి పదార్థాలు',
            wages: '9. వేతనాలు',
            salaryDetails: '10. జీత వివరాలు',
            workingCapitalEstimate: '11. పని మూలధన అంచనా',
            powerEstimate: '12. విద్యుత్ అంచనా',
            overheadExpenses: '13. ఓవర్ హెడ్ ఖర్చులు',
            financing: '14. ఆర్థిక సహాయం',
            salesDetails: '15. అమ్మకాల వివరాలు',
            marketAnalysis: '16. మార్కెట్ విశ్లేషణ',
            technicalFeasibility: '17. సాంకేతిక సాధ్యత',
            financialProjections: '18. ఆర్థిక అంచనాలు',
            financialParameters: '19. ఆర్థిక పారామితులు',
            beneficiaryInfo: '20. లాభాంశకుడి సమాచారం',
            eligibleSchemes: '21. అర్హతగల ప్రభుత్వ పథకాలు',
            conclusion: '22. ముగింపు',
            financialSummary: 'ఆర్థిక సారాంశం',
            projectCostBreakdown: 'ప్రాజెక్ట్ ఖర్చు విభజన:',
            meansOfFinance: 'ఆర్థిక మార్గాలు:'
          } : {
            executiveSummary: '1. Executive Summary',
            businessProfile: '2. Business Profile',
            applicantInfo: '3. Applicant Information',
            projectAtGlance: '4. Project at a Glance',
            buildingDetails: '5. Building Details',
            machineryDetails: '6. Machinery Details',
            otherCapitalCosts: '7. Other Capital Costs',
            rawMaterials: '8. Raw Materials',
            wages: '9. Wages',
            salaryDetails: '10. Salary Details',
            workingCapitalEstimate: '11. Working Capital Estimate',
            powerEstimate: '12. Power Estimate',
            overheadExpenses: '13. Overhead Expenses',
            financing: '14. Financing',
            salesDetails: '15. Sales Details',
            marketAnalysis: '16. Market Analysis',
            technicalFeasibility: '17. Technical Feasibility',
            financialProjections: '18. Financial Projections',
            financialParameters: '19. Financial Parameters',
            beneficiaryInfo: '20. Beneficiary Information',
            eligibleSchemes: '21. Eligible Government Schemes',
            conclusion: '22. Conclusion',
            financialSummary: 'Financial Summary',
            projectCostBreakdown: 'Project Cost Breakdown:',
            meansOfFinance: 'Means of Finance:'
          };

          // Helper to render section headers with proper font and blue color (matching Floor Polish format)
          const renderSectionHeader = (text: string) => {
            const isTelugu = isTeluguText(text);
            // Use blue color for section headers (matching Floor Polish document style)
            doc.fillColor('#1E40AF'); // Blue color for headers
            if (isTelugu) {
              if (teluguFontRegistered) {
                try {
                  doc.fontSize(16).font('NotoSansTelugu').text(text, { underline: true });
                } catch (e) {
                  // Font failed, fall back to default
                  teluguFontRegistered = false;
                  doc.fontSize(16).text(text, { underline: true });
                }
              } else {
                doc.fontSize(16).text(text, { underline: true });
              }
            } else {
              doc.fontSize(16).font('Helvetica-Bold').text(text, { underline: true });
            }
            // Reset to black for subsequent text
            doc.fillColor('#000000');
          };

          // Helper function to create a table from data array (for wages, salaries, etc.)
          // Handles both array of objects and array of arrays
          const renderDataTable = (data: any[], columns: string[], title?: string) => {
            if (!data || data.length === 0) return;
            
            doc.moveDown(0.5);
            const tableWidth = 500;
            const colCount = columns.length;
            const colWidth = tableWidth / colCount;
            const rowHeight = 25;
            
            let x = doc.x;
            const startY = doc.y;
            
            // Draw header row with light gray background (matching Floor Polish format)
            doc.rect(x, startY, tableWidth, rowHeight).fill('#D3D3D3');
            
            // Draw header text
            columns.forEach((col, colIndex) => {
              const cellX = x + (colIndex * colWidth);
              const cellIsTelugu = isTeluguText(col);
              doc.fontSize(10).font('Helvetica-Bold');
              if (cellIsTelugu && teluguFontRegistered) {
                try {
                  doc.font('NotoSansTelugu');
                } catch (e) {
                  // Font failed, continue with default font
                  teluguFontRegistered = false;
                }
              }
              doc.fillColor('#000000');
              doc.text(col, cellX + 5, startY + 7, {
                width: colWidth - 10,
                height: rowHeight - 10,
                align: 'left',
              });
            });
            
            // Draw data rows
            data.forEach((row, rowIndex) => {
              const rowY = startY + ((rowIndex + 1) * rowHeight);
              
              // Alternate row background color (white and light blue for better readability)
              if (rowIndex % 2 === 0) {
                doc.rect(x, rowY, tableWidth, rowHeight).fill('#F0F8FF'); // Light blue for even rows
              } else {
                doc.rect(x, rowY, tableWidth, rowHeight).fill('#FFFFFF'); // White for odd rows
              }
              
              doc.rect(x, rowY, tableWidth, rowHeight).stroke('#CCCCCC');
              
              columns.forEach((col, colIndex) => {
                const cellX = x + (colIndex * colWidth);
                // Handle both object format (row[col]) and array format (row[colIndex])
                let cellValue = '';
                if (Array.isArray(row)) {
                  // Array format: use index
                  cellValue = row[colIndex] || '';
                } else if (typeof row === 'object' && row !== null) {
                  // Object format: try to find value by column name or by index
                  cellValue = row[col] || row[col.toLowerCase()] || row[colIndex] || '';
                } else {
                  cellValue = String(row || '');
                }
                
                // Format numbers with proper formatting
                if (typeof cellValue === 'number') {
                  cellValue = cellValue.toLocaleString('en-IN', { maximumFractionDigits: 2 });
                } else if (cellValue && !isNaN(parseFloat(cellValue)) && isFinite(cellValue)) {
                  // If it's a numeric string, format it
                  cellValue = parseFloat(cellValue).toLocaleString('en-IN', { maximumFractionDigits: 2 });
                }
                
                const cellText = String(cellValue || '');
                const cellIsTelugu = isTeluguText(cellText);
                doc.fontSize(10).font('Helvetica');
                if (cellIsTelugu && teluguFontRegistered) {
                  try {
                    doc.font('NotoSansTelugu');
                  } catch (e) {
                    // Font failed, continue with default font
                    teluguFontRegistered = false;
                  }
                }
                doc.fillColor('#000000');
                doc.text(cellText, cellX + 5, rowY + 7, {
                  width: colWidth - 10,
                  height: rowHeight - 10,
                  align: 'left',
                });
              });
            });
            
            // Draw outer border
            doc.rect(x, startY, tableWidth, (data.length + 1) * rowHeight).stroke('#000000');
            
            // Draw vertical lines
            for (let i = 1; i < colCount; i++) {
              const lineX = x + (i * colWidth);
              doc.moveTo(lineX, startY)
                .lineTo(lineX, startY + ((data.length + 1) * rowHeight))
                .stroke('#000000');
            }
            
            // Reset position to left margin after table
            const tableHeight = (data.length + 1) * rowHeight;
            doc.y = startY + tableHeight;
            doc.x = 50; // Reset to left margin (50 is standard PDF margin)
            doc.fillColor('#000000');
            doc.moveDown(1);
          };

          // Track section number for sequential numbering
          let sectionNumber = 0;
          
          // Helper function to get section title without number (removes leading number if present)
          const getSectionTitle = (label: string): string => {
            // Remove leading number and dot (e.g., "1. Executive Summary" -> "Executive Summary")
            return label.replace(/^\d+\.\s*/, '').trim();
          };
          
          // Helper function to render section if content exists
          // Special handling for wages, salaries, and financial projections to ensure tabular format
          const renderSection = (sectionKey: string, label: string) => {
            if (contentLang[sectionKey]) {
              sectionNumber++; // Increment section number for each section with content
              doc.addPage();
              
              // Use sequential numbering instead of hardcoded numbers
              const sectionTitle = getSectionTitle(label);
              const numberedLabel = `${sectionNumber}. ${sectionTitle}`;
              
              renderSectionHeader(numberedLabel);
              doc.moveDown();
              
              // Special handling for sections that should be in tabular format
              if (project && (project as any).stepData) {
                const stepData = (project as any).stepData;
                
                if (sectionKey === 'wages' && stepData.wages && Array.isArray(stepData.wages) && stepData.wages.length > 0) {
                  // Render wages table
                  const columns = language === 'telugu' 
                    ? ['వివరాలు', 'కార్మికుల సంఖ్య', 'నెలకు వేతనం', 'మొత్తం']
                    : ['Particulars', 'No. of Workers', 'Wages per Month', 'Amount'];
                  renderDataTable(stepData.wages, columns);
                  doc.moveDown(0.5);
                } else if (sectionKey === 'salaryDetails' && stepData.salaryDetails?.salaries && Array.isArray(stepData.salaryDetails.salaries) && stepData.salaryDetails.salaries.length > 0) {
                  // Render salaries table
                  const columns = language === 'telugu'
                    ? ['వివరాలు', 'సిబ్బంది సంఖ్య', 'నెలకు జీతం', 'మొత్తం']
                    : ['Particulars', 'No. of Staff', 'Salary per Month', 'Amount'];
                  renderDataTable(stepData.salaryDetails.salaries, columns);
                  doc.moveDown(0.5);
                } else if (sectionKey === 'financialProjections' && stepData.financialProjections) {
                  // Try to create a financial projections table if data is available
                  const financialData = stepData.financialProjections;
                  
                  // Create a cost analysis table similar to Floor Polish format if we have the data
                  if (financialData.costAnalysis || (financialData.fixedCost && financialData.variableCost)) {
                    doc.moveDown(0.5);
                    const costTableData = [];
                    
                    // Add header row
                    const costColumns = language === 'telugu'
                      ? ['వివరాలు', '100%', '60%', '70%', '80%']
                      : ['Particulars', '100%', '60%', '70%', '80%'];
                    
                    // Add rows for Fixed Cost, Variable Cost, Cost of Production, etc.
                    if (financialData.fixedCost) {
                      costTableData.push({
                        'Particulars': language === 'telugu' ? 'స్థిర ఖర్చు' : 'Fixed Cost',
                        '100%': financialData.fixedCost.total || '0',
                        '60%': (financialData.fixedCost.total * 0.6).toFixed(2),
                        '70%': (financialData.fixedCost.total * 0.7).toFixed(2),
                        '80%': (financialData.fixedCost.total * 0.8).toFixed(2)
                      });
                    }
                    
                    if (financialData.variableCost) {
                      costTableData.push({
                        'Particulars': language === 'telugu' ? 'వేరియబుల్ ఖర్చు' : 'Variable Cost',
                        '100%': financialData.variableCost.total || '0',
                        '60%': (financialData.variableCost.total * 0.6).toFixed(2),
                        '70%': (financialData.variableCost.total * 0.7).toFixed(2),
                        '80%': (financialData.variableCost.total * 0.8).toFixed(2)
                      });
                    }
                    
                    if (costTableData.length > 0) {
                      renderDataTable(costTableData, costColumns);
                      doc.moveDown(0.5);
                    }
                  }
                }
              }
              
              // Clean content to remove any embedded section numbers from AI generation
              let cleanedContent = contentLang[sectionKey] || '';
              // Remove section numbers that might be embedded in the content (e.g., "16. Market Analysis" -> "Market Analysis")
              cleanedContent = cleanedContent.replace(/^\d+\.\s+/gm, '');
              
              // Render the content (which may already contain tables)
              addFormattedText(cleanedContent);
              doc.moveDown();
            }
          };

          // Executive Summary
          renderSection('executiveSummary', sectionLabels.executiveSummary);

          // Business Profile
          renderSection('businessProfile', sectionLabels.businessProfile);

          // Applicant Information
          renderSection('applicantInfo', sectionLabels.applicantInfo);

          // Project at a Glance
          renderSection('projectAtGlance', sectionLabels.projectAtGlance);

          // Building Details
          renderSection('buildingDetails', sectionLabels.buildingDetails);

          // Machinery Details
          renderSection('machineryDetails', sectionLabels.machineryDetails);

          // Other Capital Costs
          renderSection('otherCapitalCosts', sectionLabels.otherCapitalCosts);

          // Raw Materials
          renderSection('rawMaterials', sectionLabels.rawMaterials);

          // Wages
          renderSection('wages', sectionLabels.wages);

          // Salary Details
          renderSection('salaryDetails', sectionLabels.salaryDetails);

          // Working Capital Estimate
          renderSection('workingCapitalEstimate', sectionLabels.workingCapitalEstimate);

          // Power Estimate
          renderSection('powerEstimate', sectionLabels.powerEstimate);

          // Overhead Expenses
          renderSection('overheadExpenses', sectionLabels.overheadExpenses);

          // Financing
          renderSection('financing', sectionLabels.financing);

          // Sales Details
          renderSection('salesDetails', sectionLabels.salesDetails);

          // Market Analysis
          renderSection('marketAnalysis', sectionLabels.marketAnalysis);

          // Technical Feasibility
          renderSection('technicalFeasibility', sectionLabels.technicalFeasibility);

          // Financial Projections
          renderSection('financialProjections', sectionLabels.financialProjections);

          // Financial Parameters
          renderSection('financialParameters', sectionLabels.financialParameters);

          // Beneficiary Information
          renderSection('beneficiaryInfo', sectionLabels.beneficiaryInfo);

          // Eligible Government Schemes
          renderSection('eligibleSchemes', sectionLabels.eligibleSchemes);

          // Financial Tables - Recalculate if needed to ensure data is present
          let financials = dpr.financials;
          if (!financials || !financials.projectCost || !financials.meansOfFinance) {
            // Recalculate financials with current project data
            console.log('⚠️ Financial data missing or incomplete, recalculating...');
            financials = FinancialService.generateCompleteFinancials(project);
          }
          
          // Ensure financial data is valid before displaying
          if (financials && financials.projectCost) {
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
                  try {
                    doc.font('NotoSansTelugu').text(text);
                  } catch (e) {
                    // Font failed, fall back to default
                    teluguFontRegistered = false;
                    doc.text(text);
                  }
                } else {
                  doc.text(text);
                }
              } else {
                // English text - use Helvetica
                doc.font('Helvetica').text(text);
              }
            };
            
            // Helper function to safely format numbers
            const formatNumber = (value: any): string => {
              if (value === null || value === undefined || isNaN(value) || value === 0) {
                return '0';
              }
              const numValue = typeof value === 'number' ? value : parseFloat(value);
              if (isNaN(numValue) || !isFinite(numValue)) {
                return '0';
              }
              return numValue.toLocaleString('en-IN', { maximumFractionDigits: 2 });
            };
            
            // Helper function to safely format percentage
            const formatPercentage = (value: any): string => {
              if (value === null || value === undefined || value === '' || value === 'NaN') {
                return '0.00';
              }
              const numValue = typeof value === 'string' ? parseFloat(value) : value;
              if (isNaN(numValue) || !isFinite(numValue)) {
                return '0.00';
              }
              return parseFloat(numValue.toString()).toFixed(2);
            };
            
            // Get fixed capital total - ensure it's calculated properly
            let fixedCapitalTotal = financials.projectCost.fixedCapital?.total || 0;
            
            // If fixed capital is 0 but we have total project cost, calculate it
            // Fixed capital = Total Project Cost - Working Capital - Preliminary Expenses
            if (fixedCapitalTotal === 0) {
              const totalProjectCost = financials.projectCost.totalProjectCost || project.totalCost || 0;
              const workingCapitalTotal = financials.projectCost.workingCapital?.total || 0;
              const preliminaryExpenses = financials.projectCost.preliminaryExpenses || 0;
              
              if (totalProjectCost > 0) {
                // Calculate fixed capital as remainder
                fixedCapitalTotal = Math.max(0, totalProjectCost - workingCapitalTotal - preliminaryExpenses);
                
                // If still 0, estimate as 70% of total cost (typical for MSME projects)
                if (fixedCapitalTotal === 0 && totalProjectCost > 0) {
                  fixedCapitalTotal = totalProjectCost * 0.70;
                }
              }
            }
            
            if (fixedCapitalTotal > 0 || financials.projectCost.fixedCapital) {
              renderFinancialText(`${fixedCapitalLabel}: ₹${formatNumber(fixedCapitalTotal)}`);
            }
            
            // Get working capital total
            const workingCapitalTotal = financials.projectCost.workingCapital?.total || 0;
            if (workingCapitalTotal > 0 || financials.projectCost.workingCapital) {
              renderFinancialText(`${workingCapitalLabel}: ₹${formatNumber(workingCapitalTotal)}`);
            }
            
            // Get total project cost
            const totalProjectCost = financials.projectCost.totalProjectCost || project.totalCost || 0;
            if (totalProjectCost > 0) {
              renderFinancialText(`${totalProjectCostLabel}: ₹${formatNumber(totalProjectCost)}`);
            }
            doc.moveDown();

            // Means of Finance
            if (financials.meansOfFinance) {
              renderSectionHeader(sectionLabels.meansOfFinance);
              doc.fontSize(10);
              const ownContributionLabel = language === 'telugu' ? 'సొంత సహకారం' : 'Own Contribution';
              const termLoanLabel = language === 'telugu' ? 'టర్మ్ లోన్' : 'Term Loan';
              
              // Get own contribution - calculate if missing
              let ownContributionAmount = financials.meansOfFinance.ownContribution?.amount || project.ownContribution || 0;
              let ownContributionPercent = financials.meansOfFinance.ownContribution?.percentage;
              
              // If percentage is NaN or invalid, recalculate it
              if (!ownContributionPercent || ownContributionPercent === 'NaN' || isNaN(parseFloat(ownContributionPercent))) {
                const totalCost = totalProjectCost || (ownContributionAmount + (financials.meansOfFinance.termLoan?.amount || project.loanAmount || 0));
                if (totalCost > 0 && ownContributionAmount > 0) {
                  ownContributionPercent = ((ownContributionAmount / totalCost) * 100).toFixed(2);
                } else {
                  ownContributionPercent = '0.00';
                }
              }
              
              // If amount is 0 but we have totalCost and loanAmount, calculate it
              if (ownContributionAmount === 0 && totalProjectCost > 0) {
                const termLoanAmount = financials.meansOfFinance.termLoan?.amount || project.loanAmount || 0;
                ownContributionAmount = Math.max(totalProjectCost * 0.20, totalProjectCost - termLoanAmount);
                if (totalProjectCost > 0) {
                  ownContributionPercent = ((ownContributionAmount / totalProjectCost) * 100).toFixed(2);
                }
              }
              
              if (ownContributionAmount > 0 || financials.meansOfFinance.ownContribution) {
                renderFinancialText(`${ownContributionLabel}: ₹${formatNumber(ownContributionAmount)} (${formatPercentage(ownContributionPercent)}%)`);
              }
              
              // Get term loan
              let termLoanAmount = financials.meansOfFinance.termLoan?.amount || project.loanAmount || 0;
              let termLoanPercent = financials.meansOfFinance.termLoan?.percentage;
              
              // If percentage is NaN or invalid, recalculate it
              if (!termLoanPercent || termLoanPercent === 'NaN' || isNaN(parseFloat(termLoanPercent))) {
                const totalCost = totalProjectCost || (ownContributionAmount + termLoanAmount);
                if (totalCost > 0 && termLoanAmount > 0) {
                  termLoanPercent = ((termLoanAmount / totalCost) * 100).toFixed(2);
                } else {
                  termLoanPercent = '0.00';
                }
              }
              
              // If amount is 0 but we have totalCost and ownContribution, calculate it
              if (termLoanAmount === 0 && totalProjectCost > 0) {
                termLoanAmount = totalProjectCost - ownContributionAmount;
                if (totalProjectCost > 0) {
                  termLoanPercent = ((termLoanAmount / totalProjectCost) * 100).toFixed(2);
                }
              }
              
              if (termLoanAmount > 0 || financials.meansOfFinance.termLoan) {
                renderFinancialText(`${termLoanLabel}: ₹${formatNumber(termLoanAmount)} (${formatPercentage(termLoanPercent)}%)`);
              }
              doc.moveDown();
            }
          }

          // Conclusion
          renderSection('conclusion', sectionLabels.conclusion);

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
   * Generate HTML content for Cluster DPR PDF
   */
  private static generateClusterDPRHTML(dpr: any, project: any, language: 'english' | 'telugu'): string {
    const content = dpr.content || {};
    const contentLang = language === 'telugu' 
      ? (content.telugu || content.english || {}) 
      : (content.english || {});
    
    // Get cluster data from multiple sources - prioritize actual data
    const clusterData = contentLang.clusterData || dpr.metadata?.clusterData || project.stepData || {};
    const s1 = clusterData.step1 || {};
    const s2 = clusterData.step2 || {};
    const s3 = clusterData.step3 || {};
    const s4 = clusterData.step4 || {};
    const s5 = clusterData.step5 || {};
    const s6 = clusterData.step6 || {};
    const s7 = clusterData.step7 || {};
    const s8 = clusterData.step8 || {};
    const s9 = clusterData.step9 || {};
    const s10 = clusterData.step10 || {};
    const s11 = clusterData.step11 || {};
    const s12 = clusterData.step12 || {};
    const s13 = clusterData.step13 || {};
    const s14 = clusterData.step14 || {};
    const s15 = clusterData.step15 || {};
    const s16 = clusterData.step16 || {};
    const s17 = clusterData.step17 || {};
    const s18 = clusterData.step18 || {};
    const sections = contentLang.sections || {};
    
    // Read HTML template - handle both development and production paths
    const possiblePaths = [
      path.join(__dirname, '../templates/cluster-dpr-pdf.html'), // Development
      path.join(process.cwd(), 'server/src/templates/cluster-dpr-pdf.html'), // Production
      path.join(process.cwd(), 'src/templates/cluster-dpr-pdf.html'), // Alternative
    ];
    
    let templatePath = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        templatePath = p;
        break;
      }
    }
    
    if (!templatePath) {
      throw new Error('Cluster DPR HTML template not found. Tried paths: ' + possiblePaths.join(', '));
    }
    
    let html = fs.readFileSync(templatePath, 'utf-8');
    
    // Replace cover page variables
    html = html.replace('{{CLUSTER_NAME}}', (s1.clusterName || project.projectName || 'CLUSTER NAME').toUpperCase());
    html = html.replace('{{SUBMITTED_TO}}', s11.submittedTo || 'DIC, District');
    html = html.replace('{{SPV_NAME}}', s11.spvName || 'SPV Name');
    html = html.replace('{{LOCATION}}', s1.location || project.location || 'Location');
    
    // Cover image
    const coverImage = contentLang.coverImage || '';
    if (coverImage) {
      html = html.replace('{{COVER_IMAGE}}', `<img src="${coverImage}" alt="Cover Image" />`);
    } else {
      html = html.replace('{{COVER_IMAGE}}', '');
    }
    
    // Build Table of Contents - include all sections
    let toc = '<table style="width: 100%; border-collapse: collapse; margin-top: 0.5cm;">';
    toc += '<thead><tr style="background-color: #E5E7EB;"><th style="border: 1px solid #1F2937; padding: 0.3cm; text-align: left;">Chapter</th><th style="border: 1px solid #1F2937; padding: 0.3cm; text-align: left;">Title</th><th style="border: 1px solid #1F2937; padding: 0.3cm; text-align: left;">Page No.</th></tr></thead>';
    toc += '<tbody>';
    
    const tocSections: Array<{chapter: string, title: string, page: string}> = [];
    let pageNum = 1;
    
    // Executive Summary
    if (contentLang.executiveSummary || sections.executiveSummary || s1.clusterName) {
      tocSections.push({ chapter: '', title: 'Executive Summary', page: 'i-iv' });
    }
    
    // Introduction
    if (contentLang.introduction || sections.introduction || s2.sectorType) {
      tocSections.push({ chapter: '1.', title: 'Introduction', page: String(pageNum++) });
    }
    
    // Project Snapshot (always include if we have cluster data)
    if (s1.clusterName || s11.spvName) {
      tocSections.push({ chapter: '', title: 'Project Snapshot', page: String(pageNum++) });
    }
    
    // District Profile
    if (contentLang.districtProfile || sections.districtProfile || s3.geography) {
      tocSections.push({ chapter: '1.5', title: 'District & Regional Profile', page: String(pageNum++) });
    }
    
    // Cluster Profile
    if (contentLang.clusterProfile || sections.clusterProfile || s4.clusterEvolution) {
      tocSections.push({ chapter: '2.', title: 'Cluster Profile', page: String(pageNum++) });
    }
    
    // Value Chain
    if (contentLang.valueChain || sections.valueChain || s5.rawMaterials) {
      tocSections.push({ chapter: '3.', title: 'Cluster Value Chain Mapping', page: String(pageNum++) });
    }
    
    // Market Aspects
    if (contentLang.marketAnalysis || sections.marketAssessment || s6.existingDemand) {
      tocSections.push({ chapter: '4.', title: 'Market Aspects', page: String(pageNum++) });
    }
    
    // SWOT Analysis
    if (contentLang.swotAnalysis || sections.swotAnalysis || s8.strengths) {
      tocSections.push({ chapter: '5.', title: 'SWOT Analysis', page: String(pageNum++) });
    }
    
    // Gap Analysis
    if (contentLang.gapAnalysis || sections.gapAnalysis || s7.technologyGaps) {
      tocSections.push({ chapter: '6.', title: 'Need Gap Analysis', page: String(pageNum++) });
    }
    
    // Proposed Intervention
    if (contentLang.proposedIntervention || sections.proposedIntervention || s9.interventionType) {
      tocSections.push({ chapter: '7.', title: 'Proposed Intervention', page: String(pageNum++) });
    }
    
    // CFC Details
    if (contentLang.cfcDetails || sections.cfcDetails || s10.name) {
      tocSections.push({ chapter: '8.', title: 'CFC - Operation & Management', page: String(pageNum++) });
    }
    
    // SPV Details
    if (contentLang.spvDetails || sections.spvDetails || s11.spvName) {
      tocSections.push({ chapter: '9.', title: 'SPV Member Units', page: String(pageNum++) });
    }
    
    // Project Cost
    if (contentLang.projectCost || sections.projectCost || s12.land || s12.building || s12.machinery) {
      tocSections.push({ chapter: '10.', title: 'Project Cost & Means Of Finance', page: String(pageNum++) });
    }
    
    // Operating Cost & Revenue
    if (contentLang.operatingCostRevenue || sections.operatingCostRevenue || s14.rawMaterialCost) {
      tocSections.push({ chapter: '10.5', title: 'Operating Cost & Revenue', page: String(pageNum++) });
    }
    
    // Financial Viability
    if (contentLang.financialProjections || sections.financialViability || s15.irr || s15.npv) {
      tocSections.push({ chapter: '11.', title: 'Financial Viability', page: String(pageNum++) });
    }
    
    // Implementation Schedule
    if (contentLang.implementationSchedule || sections.implementationSchedule || s16.startDate) {
      tocSections.push({ chapter: '11.5', title: 'Project Implementation Schedule', page: String(pageNum++) });
    }
    
    // Expected Impact
    if (contentLang.conclusion || sections.expectedImpact || s17.employmentGeneration) {
      tocSections.push({ chapter: '12.', title: 'Expected Impact', page: String(pageNum++) });
    }
    
    // Financial Statements
    if (s12.land || s12.building || s12.machinery || s15.profitAndLossProjections) {
      tocSections.push({ chapter: '', title: 'Financial Statements', page: String(pageNum++) });
    }
    
    // Conclusion
    if (contentLang.conclusion || true) {
      tocSections.push({ chapter: '', title: 'Conclusion', page: String(pageNum++) });
    }
    
    // Annexures
    if (s18.spvRegistration || s18.landDocuments || s18.buildingEstimates || s18.machineryQuotations) {
      tocSections.push({ chapter: '', title: 'Annexures', page: String(pageNum++) });
    }
    
    // Render TOC as table
    tocSections.forEach((section, idx) => {
      const bgColor = idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
      toc += `<tr style="background-color: ${bgColor};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">${section.chapter}</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${section.title}</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${section.page}</td></tr>`;
    });
    
    toc += '</tbody></table>';
    html = html.replace('{{TABLE_OF_CONTENTS}}', toc);
    
    // Replace section content - handle markdown and tables
    const formatContent = (text: string): string => {
      if (!text) return '';
      
      // Process markdown text to handle tables and formatting
      const processedParas = processMarkdownText(text);
      let html = '';
      
      processedParas.forEach((para) => {
        if (para.type === 'table' && para.tableData) {
          // Render table
          html += '<table>';
          para.tableData.forEach((row, rowIndex) => {
            html += '<tr>';
            row.forEach((cell) => {
              const tag = rowIndex === 0 ? 'th' : 'td';
              html += `<${tag}>${cell || ''}</${tag}>`;
            });
            html += '</tr>';
          });
          html += '</table>';
        } else if (para.type === 'heading') {
          const level = para.headingLevel || 2;
          const tag = `h${Math.min(level + 1, 4)}`;
          const content = para.content.map(seg => seg.text).join('');
          html += `<${tag} style="font-weight: bold; margin-top: 0.5cm; margin-bottom: 0.3cm;">${content}</${tag}>`;
        } else if (para.originalText.trim().length > 0) {
          html += '<p>';
          para.content.forEach((segment) => {
            const text = segment.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            if (segment.bold) {
              html += `<strong>${text}</strong>`;
            } else {
              html += text;
            }
          });
          html += '</p>';
        }
      });
      
      return html || text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
    };
    
    // Ensure we have at least some content
    const execSummary = formatContent(contentLang.executiveSummary || sections.executiveSummary || '');
    html = html.replace('{{EXECUTIVE_SUMMARY}}', execSummary || '<p>The cluster development project aims to enhance the processing capabilities and market reach of the cluster through the establishment of a Common Facility Centre.</p>');
    
    const intro = formatContent(contentLang.introduction || sections.introduction || '');
    html = html.replace('{{INTRODUCTION}}', intro || '<p>The sector plays a crucial role in the economy, and this cluster has significant potential for growth and development.</p>');
    
    // Generate Project Snapshot from clusterData
    const generateProjectSnapshot = (): string => {
      const totalUnits = (s1.enterpriseCount?.micro || 0) + (s1.enterpriseCount?.small || 0) + (s1.enterpriseCount?.medium || 0);
      const totalEmployment = (s1.employmentPerUnit?.lessThan5 || 0) + (s1.employmentPerUnit?.between5And10 || 0) + (s1.employmentPerUnit?.moreThan10 || 0);
      
      let snapshotHTML = '<table>';
      snapshotHTML += '<tr><th>Particulars</th><th>Details</th></tr>';
      snapshotHTML += `<tr><td>Name of the cluster</td><td>${s1.clusterName || 'N/A'}, ${s1.district || 'N/A'} District</td></tr>`;
      snapshotHTML += `<tr><td>Location & Spread of the cluster</td><td>${s1.geographicalSpread || s1.location || 'N/A'}</td></tr>`;
      snapshotHTML += `<tr><td>Product range</td><td>${s1.majorProducts || 'N/A'}</td></tr>`;
      snapshotHTML += `<tr><td>Existing employment in the Cluster</td><td>${totalEmployment} workers (Male: ${s1.employmentPerUnit?.male || 0}, Female: ${s1.employmentPerUnit?.female || 0})</td></tr>`;
      snapshotHTML += `<tr><td>Name of the SPV</td><td>${s11.spvName || 'N/A'}</td></tr>`;
      snapshotHTML += `<tr><td>Legal Status</td><td>${s11.legalStatus || 'N/A'}</td></tr>`;
      snapshotHTML += `<tr><td>Number of SPV members</td><td>${s11.memberUnits?.length || 0} member units</td></tr>`;
      snapshotHTML += '</table>';
      
      // Add existing cluster scenario table if data exists
      if (s1.enterpriseCount || s4.productionCapacity || s14.annualProductionVolume) {
        snapshotHTML += '<h3 style="margin-top: 1cm; margin-bottom: 0.5cm;">Existing cluster scenario</h3>';
        snapshotHTML += '<table>';
        snapshotHTML += '<tr><th>Product</th><th>Pro forma</th><th>Annual Production (in MT)</th><th>Annual Pro forma (in ₹ lakhs)</th></tr>';
        
        if (s1.enterpriseCount?.micro && s1.enterpriseCount.micro > 0) {
          snapshotHTML += `<tr><td>Micro Enterprises</td><td>${s1.enterpriseCount.micro}</td><td>${s14.annualProductionVolume || 'N/A'}</td><td>${s1.turnoverPerUnit ? ((s1.turnoverPerUnit * s1.enterpriseCount.micro) / 100000).toFixed(2) : 'N/A'}</td></tr>`;
        }
        if (s1.enterpriseCount?.small && s1.enterpriseCount.small > 0) {
          snapshotHTML += `<tr><td>Small Enterprises</td><td>${s1.enterpriseCount.small}</td><td>${s14.annualProductionVolume || 'N/A'}</td><td>${s1.turnoverPerUnit ? ((s1.turnoverPerUnit * s1.enterpriseCount.small) / 100000).toFixed(2) : 'N/A'}</td></tr>`;
        }
        if (s1.enterpriseCount?.medium && s1.enterpriseCount.medium > 0) {
          snapshotHTML += `<tr><td>Medium Enterprises</td><td>${s1.enterpriseCount.medium}</td><td>${s14.annualProductionVolume || 'N/A'}</td><td>${s1.turnoverPerUnit ? ((s1.turnoverPerUnit * s1.enterpriseCount.medium) / 100000).toFixed(2) : 'N/A'}</td></tr>`;
        }
        
        snapshotHTML += '</table>';
      }
      
      return snapshotHTML;
    };
    
    const projectSnapshotHTML = `<div class="page">
      <div class="page-content">
        <div class="section-title-box">
          <div class="section-title-box-inner">
            <h2>PROJECT SNAPSHOT</h2>
          </div>
        </div>
        <div class="content">${generateProjectSnapshot()}</div>
      </div>
    </div>`;
    html = html.replace('{{PROJECT_SNAPSHOT}}', projectSnapshotHTML);
    
    // Replace optional sections with proper headers
    const sectionHeaders: Record<string, string> = {
      '{{DISTRICT_PROFILE}}': '1.5 DISTRICT & REGIONAL PROFILE',
      '{{CLUSTER_PROFILE}}': '2. CLUSTER PROFILE',
      '{{VALUE_CHAIN}}': '3. CLUSTER VALUE CHAIN MAPPING',
      '{{MARKET_ASPECTS}}': '4. MARKET ASPECTS',
      '{{SWOT_ANALYSIS}}': '5. SWOT ANALYSIS',
      '{{GAP_ANALYSIS}}': '6. NEED GAP ANALYSIS',
      '{{CFC_DETAILS}}': '7. CFC - OPERATION & MANAGEMENT',
      '{{SPV_DETAILS}}': '8. SPV MEMBER UNITS',
      '{{PROJECT_COST}}': '9. PROJECT COST & MEANS OF FINANCE',
      '{{OPERATING_COST_REVENUE}}': '9.5 OPERATING COST & REVENUE',
      '{{FINANCIAL_VIABILITY}}': '10. FINANCIAL VIABILITY',
      '{{IMPLEMENTATION_SCHEDULE}}': '10.5 PROJECT IMPLEMENTATION SCHEDULE',
      '{{EXPECTED_IMPACT}}': '11. EXPECTED IMPACT',
      '{{CONCLUSION}}': 'CONCLUSION'
    };
    
    // Helper to generate section content from clusterData
    const generateSectionFromData = (stepData: any, sectionType: string): string => {
      if (!stepData || Object.keys(stepData).length === 0) return '';
      
      let content = '';
      // Generate content from step data
      Object.entries(stepData).forEach(([key, value]) => {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          // Nested object - recurse
          const nested = generateSectionFromData(value, sectionType);
          if (nested) content += nested;
        } else if (value && Array.isArray(value)) {
          // Array - create list or table
          if (value.length > 0) {
            content += `<p><strong>${key}:</strong></p><ul>`;
            value.forEach((item: any) => {
              if (typeof item === 'string') {
                content += `<li>${item}</li>`;
              } else if (typeof item === 'object') {
                content += `<li>${JSON.stringify(item)}</li>`;
              }
            });
            content += '</ul>';
          }
        } else if (value && typeof value !== 'object') {
          // Simple value
          content += `<p><strong>${key}:</strong> ${value}</p>`;
        }
      });
      return content;
    };
    
    const replaceSection = (placeholder: string, content: string, header: string, stepData?: any) => {
      // Try to get content from multiple sources
      let finalContent = content;
      if (!finalContent || !finalContent.trim()) {
        // Try to generate from stepData
        if (stepData) {
          finalContent = generateSectionFromData(stepData, header);
        }
      }
      
      // Always include section if we have any content or if it's a required section
      const requiredSections = ['DISTRICT_PROFILE', 'CLUSTER_PROFILE', 'VALUE_CHAIN', 'MARKET_ASPECTS', 'SWOT_ANALYSIS', 'GAP_ANALYSIS', 'CFC_DETAILS', 'SPV_DETAILS', 'PROJECT_COST'];
      const isRequired = requiredSections.some(req => header.toUpperCase().includes(req));
      
      if (finalContent && finalContent.trim()) {
        const formattedContent = formatContent(finalContent);
        const sectionHTML = `<div class="page">
          <div class="page-content">
            <div class="section-title-box">
              <div class="section-title-box-inner">
                <h2>${header}</h2>
              </div>
            </div>
            <div class="content">${formattedContent}</div>
          </div>
        </div>`;
        html = html.replace(placeholder, sectionHTML);
      } else if (isRequired) {
        // Include section even with minimal content
        const sectionHTML = `<div class="page">
          <div class="page-content">
            <div class="section-title-box">
              <div class="section-title-box-inner">
                <h2>${header}</h2>
              </div>
            </div>
            <div class="content"><p>Section content will be populated from cluster data.</p></div>
          </div>
        </div>`;
        html = html.replace(placeholder, sectionHTML);
      } else {
        html = html.replace(placeholder, '');
      }
    };
    
    replaceSection('{{DISTRICT_PROFILE}}', contentLang.districtProfile || sections.districtProfile || '', sectionHeaders['{{DISTRICT_PROFILE}}'], s3);
    replaceSection('{{CLUSTER_PROFILE}}', contentLang.clusterProfile || sections.clusterProfile || '', sectionHeaders['{{CLUSTER_PROFILE}}'], s4);
    replaceSection('{{VALUE_CHAIN}}', contentLang.valueChain || sections.valueChain || '', sectionHeaders['{{VALUE_CHAIN}}'], s5);
    replaceSection('{{MARKET_ASPECTS}}', contentLang.marketAnalysis || sections.marketAssessment || '', sectionHeaders['{{MARKET_ASPECTS}}'], s6);
    replaceSection('{{SWOT_ANALYSIS}}', contentLang.swotAnalysis || sections.swotAnalysis || '', sectionHeaders['{{SWOT_ANALYSIS}}'], s8);
    replaceSection('{{GAP_ANALYSIS}}', contentLang.gapAnalysis || sections.gapAnalysis || '', sectionHeaders['{{GAP_ANALYSIS}}'], s7);
    replaceSection('{{CFC_DETAILS}}', contentLang.cfcDetails || sections.cfcDetails || '', sectionHeaders['{{CFC_DETAILS}}'], s10);
    replaceSection('{{SPV_DETAILS}}', contentLang.spvDetails || sections.spvDetails || '', sectionHeaders['{{SPV_DETAILS}}'], s11);
    replaceSection('{{PROJECT_COST}}', contentLang.projectCost || sections.projectCost || '', sectionHeaders['{{PROJECT_COST}}'], s12);
    replaceSection('{{OPERATING_COST_REVENUE}}', contentLang.operatingCostRevenue || sections.operatingCostRevenue || '', sectionHeaders['{{OPERATING_COST_REVENUE}}'], s14);
    replaceSection('{{FINANCIAL_VIABILITY}}', contentLang.financialProjections || sections.financialViability || '', sectionHeaders['{{FINANCIAL_VIABILITY}}'], s15);
    replaceSection('{{IMPLEMENTATION_SCHEDULE}}', contentLang.implementationSchedule || sections.implementationSchedule || '', sectionHeaders['{{IMPLEMENTATION_SCHEDULE}}'], s16);
    replaceSection('{{EXPECTED_IMPACT}}', contentLang.conclusion || sections.expectedImpact || '', sectionHeaders['{{EXPECTED_IMPACT}}']);
    replaceSection('{{CONCLUSION}}', contentLang.conclusion && !sections.expectedImpact ? contentLang.conclusion : '', sectionHeaders['{{CONCLUSION}}']);
    
    // Add Proposed Intervention section
    const proposedIntervention = contentLang.proposedIntervention || sections.proposedIntervention || s9.interventionType || '';
    if (proposedIntervention) {
      replaceSection('{{PROPOSED_INTERVENTION}}', proposedIntervention, '9. PROPOSED INTERVENTION');
    } else {
      html = html.replace('{{PROPOSED_INTERVENTION}}', '');
    }
    
    // Generate Financial Statements section
    const generateFinancialStatements = (): string => {
      let statementsHTML = '';
      
      if (s12.land || s12.building || s12.machinery) {
        statementsHTML += '<h3 style="margin-top: 0.5cm; margin-bottom: 0.3cm;">1. Cost of Project & Means of Finance</h3>';
        statementsHTML += '<table>';
        statementsHTML += '<tr><th>Particulars</th><th>Amount (₹)</th></tr>';
        if (s12.land) statementsHTML += `<tr><td>Land</td><td>${s12.land.toLocaleString('en-IN')}</td></tr>`;
        if (s12.building) statementsHTML += `<tr><td>Building</td><td>${s12.building.toLocaleString('en-IN')}</td></tr>`;
        if (s12.machinery) statementsHTML += `<tr><td>Machinery</td><td>${s12.machinery.toLocaleString('en-IN')}</td></tr>`;
        statementsHTML += '</table>';
      }
      
      if (s15.profitAndLossProjections && s15.profitAndLossProjections.length > 0) {
        statementsHTML += '<h3 style="margin-top: 0.5cm; margin-bottom: 0.3cm;">2. Cost of Production & Profitability</h3>';
        statementsHTML += '<table>';
        statementsHTML += '<tr><th>Year</th><th>Revenue</th><th>Cost</th><th>Profit</th></tr>';
        s15.profitAndLossProjections.forEach((proj: any, idx: number) => {
          statementsHTML += `<tr><td>Year ${idx + 1}</td><td>${proj.revenue || 0}</td><td>${proj.cost || 0}</td><td>${proj.profit || 0}</td></tr>`;
        });
        statementsHTML += '</table>';
      }
      
      if (s15.breakEvenPoint || s15.irr || s15.npv) {
        statementsHTML += '<h3 style="margin-top: 0.5cm; margin-bottom: 0.3cm;">3. Financial Indicators</h3>';
        statementsHTML += '<table>';
        statementsHTML += '<tr><th>Indicator</th><th>Value</th></tr>';
        if (s15.breakEvenPoint) statementsHTML += `<tr><td>Break Even Point</td><td>${s15.breakEvenPoint} years</td></tr>`;
        if (s15.irr) statementsHTML += `<tr><td>IRR</td><td>${s15.irr}%</td></tr>`;
        if (s15.npv) statementsHTML += `<tr><td>NPV</td><td>₹${s15.npv.toLocaleString('en-IN')}</td></tr>`;
        statementsHTML += '</table>';
      }
      
      return statementsHTML || '<p>Financial statements data not available.</p>';
    };
    
    const financialStatementsHTML = `<div class="page">
      <div class="page-content">
        <div class="section-title-box">
          <div class="section-title-box-inner">
            <h2>FINANCIAL STATEMENTS</h2>
          </div>
        </div>
        <div class="content">${generateFinancialStatements()}</div>
      </div>
    </div>`;
    html = html.replace('{{FINANCIAL_STATEMENTS}}', financialStatementsHTML);
    
    // Generate Annexures section
    const generateAnnexures = (): string => {
      let annexuresHTML = '<ul style="list-style-type: none; padding-left: 0;">';
      let annexureNum = 1;
      
      if (s18.spvRegistration) {
        annexuresHTML += `<li style="margin-bottom: 0.5cm;"><strong>Annexure ${annexureNum}:</strong> SPV Registration</li>`;
        annexureNum++;
      }
      if (s18.landDocuments) {
        annexuresHTML += `<li style="margin-bottom: 0.5cm;"><strong>Annexure ${annexureNum}:</strong> Land Documents</li>`;
        annexureNum++;
      }
      if (s18.buildingEstimates) {
        annexuresHTML += `<li style="margin-bottom: 0.5cm;"><strong>Annexure ${annexureNum}:</strong> Building Estimates</li>`;
        annexureNum++;
      }
      if (s18.machineryQuotations) {
        annexuresHTML += `<li style="margin-bottom: 0.5cm;"><strong>Annexure ${annexureNum}:</strong> Machinery Quotations</li>`;
        annexureNum++;
      }
      if (s18.memberRegistrations) {
        annexuresHTML += `<li style="margin-bottom: 0.5cm;"><strong>Annexure ${annexureNum}:</strong> Member Registrations</li>`;
        annexureNum++;
      }
      if (s18.supportingDocuments && Array.isArray(s18.supportingDocuments) && s18.supportingDocuments.length > 0) {
        s18.supportingDocuments.forEach((doc: any, idx: number) => {
          annexuresHTML += `<li style="margin-bottom: 0.5cm;"><strong>Annexure ${annexureNum}:</strong> Supporting Document ${idx + 1}</li>`;
          annexureNum++;
        });
      }
      
      annexuresHTML += '</ul>';
      return annexuresHTML || '<p>No annexures available.</p>';
    };
    
    const annexuresHTML = `<div class="page">
      <div class="page-content">
        <div class="section-title-box">
          <div class="section-title-box-inner">
            <h2>ANNEXURES</h2>
          </div>
        </div>
        <div class="content">${generateAnnexures()}</div>
      </div>
    </div>`;
    html = html.replace('{{ANNEXURES}}', annexuresHTML);
    
    return html;
  }

  /**
   * Generate PDF for Cluster DPR matching the preview template exactly using HTML-to-PDF
   */
  static async generateClusterDPRPDF(dpr: any, project: any, language: 'english' | 'telugu'): Promise<Buffer> {
    try {
      console.log('📄 Starting Cluster DPR PDF generation...');
      
      // Generate HTML from template
      let html: string;
      try {
        html = this.generateClusterDPRHTML(dpr, project, language);
      } catch (htmlError: any) {
        console.error('❌ Error generating HTML:', htmlError);
        throw new Error(`Failed to generate HTML template: ${htmlError.message}`);
      }
      
      // Validate HTML was generated
      if (!html || html.length === 0) {
        throw new Error('Generated HTML template is empty');
      }
      
      // Validate HTML structure
      if (!html.includes('<!DOCTYPE html>') || !html.includes('</html>')) {
        console.warn('⚠️  HTML template may be malformed');
      }
      
      // Check if styles are present
      if (!html.includes('<style') || !html.includes('border: 8px solid #2563EB')) {
        console.error('❌ HTML template missing critical styles!');
        throw new Error('HTML template is missing required CSS styles');
      }
      
      console.log(`✅ HTML generated: ${html.length} characters`);
      console.log(`✅ HTML contains styles: ${html.includes('<style')}`);
      console.log(`✅ HTML contains page borders: ${html.includes('border: 8px solid #2563EB')}`);
      
      // Try to use Puppeteer for HTML-to-PDF conversion
      try {
        const puppeteer = require('puppeteer');
        console.log('🔄 Launching Puppeteer browser...');
        
        const browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu'
          ],
          timeout: 30000
        });
        
        try {
          const page = await browser.newPage();
          
          // Set viewport for A4
          await page.setViewport({
            width: 794, // A4 width in pixels at 96 DPI
            height: 1123, // A4 height in pixels at 96 DPI
          });
          
          console.log('🔄 Setting HTML content...');
          // Set content with longer timeout and error handling
          // Use base64 encoding for images if needed
          try {
            await page.setContent(html, {
              waitUntil: ['load', 'networkidle0'],
              timeout: 60000 // Increased timeout
            });
            console.log('✅ HTML content set successfully');
          } catch (contentError: any) {
            console.warn('⚠️  networkidle0 failed, trying domcontentloaded:', contentError.message);
            // Try with simpler wait condition
            await page.setContent(html, {
              waitUntil: 'domcontentloaded',
              timeout: 60000
            });
            // Wait for stylesheets to load
            await page.waitForTimeout(2000);
            console.log('✅ HTML content set with fallback method');
          }
          
          // Ensure all styles are applied
          await page.evaluateHandle(() => document.fonts.ready);
          
          // Wait for styles to load and render
          await page.waitForTimeout(2000);
          
          // Verify styles are applied
          const stylesApplied = await page.evaluate(() => {
            const firstPage = document.querySelector('.page');
            if (!firstPage) return false;
            const computedStyle = window.getComputedStyle(firstPage);
            const borderWidth = computedStyle.borderWidth;
            return borderWidth && parseFloat(borderWidth) > 0;
          });
          
          if (!stylesApplied) {
            console.warn('⚠️  Styles may not be fully applied, but continuing...');
          } else {
            console.log('✅ Styles verified and applied');
          }
          
          // Ensure CSS is loaded by checking for styled elements
          await page.evaluate(() => {
            // Force style recalculation
            document.body.style.display = 'none';
            document.body.offsetHeight; // Trigger reflow
            document.body.style.display = '';
          });
          
          // Wait a bit more for rendering
          await page.waitForTimeout(1000);
          
          console.log('🔄 Generating PDF...');
          // Generate PDF with proper settings - ensure styles are rendered
          const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            displayHeaderFooter: false,
            margin: {
              top: '0',
              right: '0',
              bottom: '0',
              left: '0'
            },
            preferCSSPageSize: true,
            timeout: 60000,
            scale: 1.0
          });
          
          // Validate PDF buffer
          if (!pdfBuffer || pdfBuffer.length === 0) {
            await browser.close();
            throw new Error('Generated PDF buffer is empty');
          }
          
          // Validate PDF header (PDF files start with %PDF)
          const pdfHeader = pdfBuffer.slice(0, 4).toString('ascii');
          if (pdfHeader !== '%PDF') {
            console.error('❌ Invalid PDF header:', pdfHeader);
            console.error('First 20 bytes:', pdfBuffer.slice(0, 20).toString('hex'));
            await browser.close();
            throw new Error(`Generated buffer does not appear to be a valid PDF. Header: ${pdfHeader}`);
          }
          
          console.log(`✅ PDF generated successfully: ${pdfBuffer.length} bytes`);
          console.log(`✅ PDF header validated: ${pdfHeader}`);
          
          await browser.close();
          return Buffer.from(pdfBuffer); // Ensure it's a proper Buffer
        } catch (pageError: any) {
          await browser.close().catch(() => {});
          throw pageError;
        }
      } catch (puppeteerError: any) {
        console.warn('⚠️  Puppeteer error:', puppeteerError.message);
        console.warn('⚠️  Error stack:', puppeteerError.stack);
        console.warn('⚠️  Falling back to PDFKit...');
        // Fallback to PDFKit if Puppeteer is not available
        try {
          return await this.generateClusterDPRPDFWithPDFKit(dpr, project, language);
        } catch (pdfKitError: any) {
          console.error('❌ PDFKit fallback also failed:', pdfKitError.message);
          throw new Error(`Both Puppeteer and PDFKit failed. Puppeteer: ${puppeteerError.message}, PDFKit: ${pdfKitError.message}`);
        }
      }
    } catch (error: any) {
      console.error('❌ Error generating Cluster DPR PDF:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to generate Cluster DPR PDF: ${error.message}`);
    }
  }

  /**
   * Fallback: Generate PDF using PDFKit (if Puppeteer is not available)
   */
  private static async generateClusterDPRPDFWithPDFKit(dpr: any, project: any, language: 'english' | 'telugu'): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const content = dpr.content || {};
        const contentLang = language === 'telugu' 
          ? (content.telugu || content.english || {}) 
          : (content.english || {});
        
        // Get cluster data from content or project stepData
        const clusterData = contentLang.clusterData || dpr.metadata?.clusterData || project.stepData || {};
        
        // PDFKit configuration
        const doc = new PDFDocument({ 
          size: 'A4',
          margin: 50,
          autoFirstPage: true,
          info: {
            Title: 'Detailed Project Report - Cluster DPR',
            Author: 'MSME DPR Tool',
            Subject: 'Cluster DPR Document',
            Creator: 'MSME AI DPR Generation Tool'
          }
        });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          
          // Validate PDF buffer
          if (!pdfBuffer || pdfBuffer.length === 0) {
            reject(new Error('Generated PDF buffer is empty'));
            return;
          }
          
          // Validate PDF header
          const pdfHeader = pdfBuffer.slice(0, 4).toString('ascii');
          if (pdfHeader !== '%PDF') {
            console.error('❌ Invalid PDF header from PDFKit:', pdfHeader);
            reject(new Error(`Generated buffer is not a valid PDF. Header: ${pdfHeader}`));
            return;
          }
          
          console.log(`✅ PDFKit PDF generated successfully: ${pdfBuffer.length} bytes`);
          resolve(pdfBuffer);
        });
        doc.on('error', (error) => {
          console.error('Cluster DPR PDF generation error:', error);
          reject(error);
        });

        // Helper to detect Telugu text
        const isTeluguText = (text: string): boolean => {
          return /[\u0C00-\u0C7F]/.test(text);
        };

        // Helper to add formatted text
        const addFormattedText = (text: string, fontSize: number = 11) => {
          if (!text) return;
          const paragraphs = processMarkdownText(text);
          
          paragraphs.forEach((para) => {
            if (para.type === 'table' && para.tableData) {
              // Render table
              doc.moveDown(0.5);
              const tableData = para.tableData;
              const tableWidth = 500;
              const colCount = tableData[0]?.length || 0;
              const colWidth = tableWidth / colCount;
              const rowHeight = 20;
              
              let x = doc.x;
              const startY = doc.y;
              
              // Header row with gray background
              doc.rect(x, startY, tableWidth, rowHeight).fill('#D3D3D3');
              tableData[0].forEach((cell, colIndex) => {
                const cellX = x + (colIndex * colWidth);
                doc.fontSize(fontSize - 1).font('Helvetica-Bold');
                doc.fillColor('#000000');
                doc.text(cell, cellX + 5, startY + 5, {
                  width: colWidth - 10,
                  height: rowHeight - 10,
                  align: 'left',
                });
              });
              
              // Data rows
              for (let rowIndex = 1; rowIndex < tableData.length; rowIndex++) {
                const rowY = startY + (rowIndex * rowHeight);
                doc.rect(x, rowY, tableWidth, rowHeight).fill(rowIndex % 2 === 0 ? '#F0F8FF' : '#FFFFFF');
                doc.rect(x, rowY, tableWidth, rowHeight).stroke('#CCCCCC');
                
                tableData[rowIndex].forEach((cell, colIndex) => {
                  const cellX = x + (colIndex * colWidth);
                  doc.fontSize(fontSize - 1).font('Helvetica');
                  doc.fillColor('#000000');
                  doc.text(cell || '', cellX + 5, rowY + 5, {
                    width: colWidth - 10,
                    height: rowHeight - 10,
                    align: 'left',
                  });
                });
              }
              
              doc.rect(x, startY, tableWidth, tableData.length * rowHeight).stroke('#000000');
              for (let i = 1; i < colCount; i++) {
                const lineX = x + (i * colWidth);
                doc.moveTo(lineX, startY).lineTo(lineX, startY + (tableData.length * rowHeight)).stroke('#000000');
              }
              
              doc.fillColor('#000000');
              doc.y = startY + (tableData.length * rowHeight);
              doc.x = 50;
              doc.moveDown(1);
            } else if (para.type === 'heading') {
              doc.moveDown(0.5);
              doc.x = 50;
              const headingFontSize = fontSize + (para.headingLevel === 1 ? 5 : para.headingLevel === 2 ? 3 : 1);
              para.content.forEach((segment) => {
                doc.fontSize(headingFontSize).font('Helvetica-Bold').text(segment.text, { 
                  align: 'left',
                  width: 500,
                });
              });
              doc.moveDown(para.headingLevel === 1 ? 1.0 : para.headingLevel === 2 ? 0.8 : 0.5);
            } else if (para.originalText.trim().length > 0) {
              para.content.forEach((segment) => {
                doc.x = 50;
                if (segment.bold) {
                  doc.fontSize(fontSize).font('Helvetica-Bold').text(segment.text, { 
                    align: 'left', 
                    width: 500,
                  });
                } else {
                  doc.fontSize(fontSize).font('Helvetica').text(segment.text, { 
                    align: 'left', 
                    width: 500,
                  });
                }
              });
              doc.moveDown(0.3);
            }
          });
        };

        // Helper to render section header (blue, bold, underlined)
        const renderSectionHeader = (text: string) => {
          doc.fillColor('#1E40AF'); // Blue
          doc.fontSize(16).font('Helvetica-Bold').text(text, { underline: true });
          doc.fillColor('#000000'); // Reset to black
          doc.moveDown(0.5);
        };

        // Cover Page - "DETAILED PROJECT REPORT" format matching preview
        const s1 = clusterData.step1 || {};
        const s11 = clusterData.step11 || {};
        const clusterName = s1.clusterName || project.projectName || 'CLUSTER NAME';
        
        // Draw grey box background with diagonal stripes pattern
        const boxX = 50;
        const boxY = 100;
        const boxWidth = 500;
        const boxHeight = 200;
        
        // Grey background
        doc.rect(boxX, boxY, boxWidth, boxHeight).fill('#F3F4F6');
        // Border
        doc.rect(boxX, boxY, boxWidth, boxHeight).stroke('#D1D5DB');
        
        // Title section inside grey box
        doc.fillColor('#1F2937'); // Dark grey
        doc.fontSize(28).font('Helvetica-Bold').text('DETAILED PROJECT REPORT', boxX + 25, boxY + 30, {
          width: boxWidth - 50,
          align: 'center'
        });
        
        doc.fontSize(18).font('Helvetica').text('On', boxX + 25, boxY + 70, {
          width: boxWidth - 50,
          align: 'center'
        });
        
        doc.fontSize(18).font('Helvetica').text('Establishment of Common Facility Centre for', boxX + 25, boxY + 95, {
          width: boxWidth - 50,
          align: 'center'
        });
        
        // Cluster name in green
        doc.fillColor('#059669'); // Green
        doc.fontSize(24).font('Helvetica-Bold').text(clusterName.toUpperCase(), boxX + 25, boxY + 130, {
          width: boxWidth - 50,
          align: 'center'
        });
        
        doc.fillColor('#1F2937'); // Back to dark grey
        doc.fontSize(16).font('Helvetica').text("under 'Micro Cluster Development Programme'", boxX + 25, boxY + 165, {
          width: boxWidth - 50,
          align: 'center'
        });
        
        // Reset position after grey box
        doc.y = boxY + boxHeight + 50;
        doc.x = 50;
        
        // Image placeholder area (skip for PDF, or add placeholder text)
        doc.moveDown(3);
        doc.fontSize(10).font('Helvetica').fillColor('#9CA3AF').text('[Cover Image Placeholder]', { align: 'center' });
        doc.moveDown(2);
        
        // Submission Details Section at bottom
        doc.fillColor('#1F2937'); // Dark grey
        doc.fontSize(11).font('Helvetica');
        
        // Submitted to
        const submittedToY = doc.y;
        doc.font('Helvetica-Bold').text('Submitted to:', 50, submittedToY);
        doc.moveTo(150, submittedToY + 5).lineTo(550, submittedToY + 5).stroke('#1F2937');
        doc.font('Helvetica').text(s11.submittedTo || 'DIC, District', 155, submittedToY);
        doc.moveDown(1.5);
        
        // Submitted by
        const submittedByY = doc.y;
        doc.font('Helvetica-Bold').text('Submitted by:', 50, submittedByY);
        doc.moveDown(0.5);
        doc.font('Helvetica').text(s11.spvName || 'SPV Name', 50, doc.y);
        doc.text(s1.location || 'Location', 50, doc.y + 15);
        doc.moveDown(1);
        
        // Prepared by
        doc.font('Helvetica-Bold').text('Prepared by:', 50, doc.y);
        doc.font('Helvetica').text('M/s.ITCOT Limited, 50A Greams Road, Chennai.', 50, doc.y + 15);
        
        // Reset color
        doc.fillColor('#000000');

        // Table of Contents Page
        doc.addPage();
        renderSectionHeader('CONTENTS');
        doc.moveDown(1);
        
        // Build table of contents based on available sections
        const tocSections: Array<{title: string, page: string}> = [];
        let pageNum = 1;
        
        if (contentLang.executiveSummary || contentLang.sections?.executiveSummary) {
          tocSections.push({ title: 'Executive Summary', page: 'i-iv' });
        }
        if (contentLang.introduction || contentLang.sections?.introduction) {
          tocSections.push({ title: '1. Introduction', page: String(pageNum++) });
        }
        if (contentLang.districtProfile || contentLang.sections?.districtProfile) {
          tocSections.push({ title: '1.5 District & Regional Profile', page: String(pageNum++) });
        }
        if (contentLang.clusterProfile || contentLang.sections?.clusterProfile) {
          tocSections.push({ title: '2. Cluster Profile', page: String(pageNum++) });
        }
        if (contentLang.valueChain || contentLang.sections?.valueChain) {
          tocSections.push({ title: '3. Cluster Value Chain Mapping', page: String(pageNum++) });
        }
        if (contentLang.marketAnalysis || contentLang.sections?.marketAssessment) {
          tocSections.push({ title: '4. Market Aspects', page: String(pageNum++) });
        }
        if (contentLang.swotAnalysis || contentLang.sections?.swotAnalysis) {
          tocSections.push({ title: '5. SWOT Analysis', page: String(pageNum++) });
        }
        if (contentLang.gapAnalysis || contentLang.sections?.gapAnalysis) {
          tocSections.push({ title: '6. Need Gap Analysis', page: String(pageNum++) });
        }
        if (contentLang.cfcDetails || contentLang.sections?.cfcDetails) {
          tocSections.push({ title: '7. CFC - Operation & Management', page: String(pageNum++) });
        }
        if (contentLang.spvDetails || contentLang.sections?.spvDetails) {
          tocSections.push({ title: '8. SPV Member Units', page: String(pageNum++) });
        }
        if (contentLang.projectCost || contentLang.sections?.projectCost) {
          tocSections.push({ title: '9. Project Cost & Means Of Finance', page: String(pageNum++) });
        }
        if (contentLang.operatingCostRevenue || contentLang.sections?.operatingCostRevenue) {
          tocSections.push({ title: '9.5 Operating Cost & Revenue', page: String(pageNum++) });
        }
        if (contentLang.financialProjections || contentLang.sections?.financialViability) {
          tocSections.push({ title: '10. Financial Viability', page: String(pageNum++) });
        }
        if (contentLang.implementationSchedule || contentLang.sections?.implementationSchedule) {
          tocSections.push({ title: '10.5 Project Implementation Schedule', page: String(pageNum++) });
        }
        if (contentLang.conclusion || contentLang.sections?.expectedImpact) {
          tocSections.push({ title: '11. Expected Impact', page: String(pageNum++) });
        }
        
        // Render TOC
        tocSections.forEach((section, index) => {
          doc.fontSize(11).font('Helvetica');
          doc.text(section.title, 50, doc.y, { width: 400 });
          doc.text(section.page, 450, doc.y, { width: 100, align: 'right' });
          doc.moveDown(0.8);
        });

        // Section 1: Executive Summary
        doc.addPage();
        renderSectionHeader('EXECUTIVE SUMMARY');
        const executiveSummary = contentLang.executiveSummary || contentLang.sections?.executiveSummary || '';
        if (executiveSummary) {
          addFormattedText(executiveSummary);
        } else {
          // Fallback: Generate from cluster data
          const s1 = clusterData.step1 || {};
          doc.fontSize(11).font('Helvetica').text(
            `The ${s1.clusterName || 'Cluster'} located in ${s1.district || 'District'}, ${s1.location || 'Location'} ` +
            `comprises ${(s1.enterpriseCount?.micro || 0) + (s1.enterpriseCount?.small || 0) + (s1.enterpriseCount?.medium || 0)} enterprises ` +
            `(${s1.enterpriseCount?.micro || 0} micro, ${s1.enterpriseCount?.small || 0} small, ${s1.enterpriseCount?.medium || 0} medium). ` +
            `The cluster focuses on ${s1.majorProducts || 'product processing'} and serves both domestic and export markets.`,
            { align: 'left', width: 500 }
          );
        }
        doc.moveDown(1);

        // Section 1: Introduction
        doc.addPage();
        renderSectionHeader('1. INTRODUCTION');
        const introduction = contentLang.introduction || contentLang.sections?.introduction || contentLang.businessProfile || '';
        if (introduction) {
          addFormattedText(introduction);
        } else {
          const s2 = clusterData.step2 || {};
          doc.fontSize(11).font('Helvetica').text(
            `The ${s2.sectorType || 'sector'} industry plays a crucial role in the economy. ` +
            `The cluster has evolved from basic operations to advanced processing, demonstrating significant growth potential.`,
            { align: 'left', width: 500 }
          );
        }
        doc.moveDown(1);

        // Add more sections if content exists
        const sections = contentLang.sections || {};
        
        if (sections.districtProfile || contentLang.districtProfile) {
          doc.addPage();
          renderSectionHeader('1.5 DISTRICT & REGIONAL PROFILE');
          addFormattedText(sections.districtProfile || contentLang.districtProfile || '');
        }

        if (sections.clusterProfile || contentLang.clusterProfile) {
          doc.addPage();
          renderSectionHeader('2. CLUSTER PROFILE');
          addFormattedText(sections.clusterProfile || contentLang.clusterProfile || '');
        }

        if (sections.valueChain || contentLang.valueChain) {
          doc.addPage();
          renderSectionHeader('3. CLUSTER VALUE CHAIN MAPPING');
          addFormattedText(sections.valueChain || contentLang.valueChain || '');
        }

        if (sections.marketAssessment || contentLang.marketAnalysis) {
          doc.addPage();
          renderSectionHeader('4. MARKET ASPECTS');
          addFormattedText(sections.marketAssessment || contentLang.marketAnalysis || '');
        }

        if (sections.swotAnalysis || contentLang.swotAnalysis) {
          doc.addPage();
          renderSectionHeader('5. SWOT ANALYSIS');
          addFormattedText(sections.swotAnalysis || contentLang.swotAnalysis || '');
        }

        if (sections.gapAnalysis || contentLang.gapAnalysis) {
          doc.addPage();
          renderSectionHeader('6. NEED GAP ANALYSIS');
          addFormattedText(sections.gapAnalysis || contentLang.gapAnalysis || '');
        }

        if (sections.cfcDetails || contentLang.cfcDetails) {
          doc.addPage();
          renderSectionHeader('7. CFC - OPERATION & MANAGEMENT');
          addFormattedText(sections.cfcDetails || contentLang.cfcDetails || '');
        }

        if (sections.spvDetails || contentLang.spvDetails) {
          doc.addPage();
          renderSectionHeader('8. SPV MEMBER UNITS');
          addFormattedText(sections.spvDetails || contentLang.spvDetails || '');
        }

        if (sections.projectCost || contentLang.projectCost) {
          doc.addPage();
          renderSectionHeader('9. PROJECT COST & MEANS OF FINANCE');
          addFormattedText(sections.projectCost || contentLang.projectCost || '');
        }

        if (sections.operatingCostRevenue || contentLang.operatingCostRevenue) {
          doc.addPage();
          renderSectionHeader('9.5 OPERATING COST & REVENUE');
          addFormattedText(sections.operatingCostRevenue || contentLang.operatingCostRevenue || '');
        }

        if (sections.financialViability || contentLang.financialProjections) {
          doc.addPage();
          renderSectionHeader('10. FINANCIAL VIABILITY');
          addFormattedText(sections.financialViability || contentLang.financialProjections || '');
        }

        if (sections.implementationSchedule || contentLang.implementationSchedule) {
          doc.addPage();
          renderSectionHeader('10.5 PROJECT IMPLEMENTATION SCHEDULE');
          addFormattedText(sections.implementationSchedule || contentLang.implementationSchedule || '');
        }

        if (sections.expectedImpact || contentLang.conclusion) {
          doc.addPage();
          renderSectionHeader('11. EXPECTED IMPACT');
          addFormattedText(sections.expectedImpact || contentLang.conclusion || '');
        }

        // Conclusion
        if (contentLang.conclusion && !sections.expectedImpact) {
          doc.addPage();
          renderSectionHeader('CONCLUSION');
          addFormattedText(contentLang.conclusion);
        }

        doc.end();
      } catch (error: any) {
        console.error('Error generating Cluster DPR PDF with PDFKit:', error);
        reject(error);
      }
    });
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

    // Helper function to create paragraphs with formatting (bold, headings, and tables)
    const createFormattedParagraphs = (text: string): (Paragraph | Table)[] => {
      if (!text) {
        return [new Paragraph({ text: '' })];
      }
      
      const elements: (Paragraph | Table)[] = [];
      const processedParas = processMarkdownText(text);
      
      processedParas.forEach((para) => {
        if (para.type === 'table' && para.tableData) {
          // Create table
          const tableData = para.tableData;
          if (tableData.length > 0) {
            const colCount = tableData[0].length;
            const colWidth = 100 / colCount; // Percentage width per column
            
            const rows = tableData.map((row, rowIndex) => {
              const cells = row.map((cell, colIndex) => {
                return new TableCell({
                  children: [new Paragraph({
                    text: cell || '',
                  })],
                  width: {
                    size: colWidth,
                    type: WidthType.PERCENTAGE,
                  },
                });
              });
              
              // Ensure all rows have the same number of cells
              while (cells.length < colCount) {
                cells.push(new TableCell({
                  children: [new Paragraph({ text: '' })],
                  width: {
                    size: colWidth,
                    type: WidthType.PERCENTAGE,
                  },
                }));
              }
              
              return new TableRow({
                children: cells,
                tableHeader: rowIndex === 0, // First row is header
              });
            });
            
            elements.push(new Table({
              rows,
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
            }));
            
            // Add spacing after table
            elements.push(new Paragraph({ text: '', spacing: { after: 200 } }));
          }
        } else if (para.type === 'heading') {
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
          
          elements.push(new Paragraph({ 
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
            elements.push(new Paragraph({ 
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
            elements.push(new Paragraph({ 
              children,
              spacing: { after: 100 },
            }));
          }
        } else {
          // Empty paragraph for spacing
          elements.push(new Paragraph({ text: '', spacing: { after: 50 } }));
        }
      });
      
      return elements;
    };

    // Section labels based on language - includes all AI-Guided DPR Builder sections
    const sectionLabels = language === 'telugu' ? {
      title: 'వివరణాత్మక ప్రాజెక్ట్ నివేదిక',
      sector: 'రంగం',
      location: 'స్థానం',
      executiveSummary: '1. కార్యనిర్వాహక సారాంశం',
      businessProfile: '2. వ్యాపార ప్రొఫైల్',
      applicantInfo: '3. దరఖాస్తుదారు సమాచారం',
      projectAtGlance: '4. ప్రాజెక్ట్ సంగ్రహం',
      buildingDetails: '5. భవన వివరాలు',
      machineryDetails: '6. యంత్రసామగ్రి వివరాలు',
      otherCapitalCosts: '7. ఇతర మూలధన ఖర్చులు',
      rawMaterials: '8. ముడి పదార్థాలు',
      wages: '9. వేతనాలు',
      salaryDetails: '10. జీత వివరాలు',
      workingCapitalEstimate: '11. పని మూలధన అంచనా',
      powerEstimate: '12. విద్యుత్ అంచనా',
      overheadExpenses: '13. ఓవర్ హెడ్ ఖర్చులు',
      financing: '14. ఆర్థిక సహాయం',
      salesDetails: '15. అమ్మకాల వివరాలు',
      marketAnalysis: '16. మార్కెట్ విశ్లేషణ',
      technicalFeasibility: '17. సాంకేతిక సాధ్యత',
      financialProjections: '18. ఆర్థిక అంచనాలు',
      financialParameters: '19. ఆర్థిక పారామితులు',
      beneficiaryInfo: '20. లాభాంశకుడి సమాచారం',
      eligibleSchemes: '21. అర్హతగల ప్రభుత్వ పథకాలు',
      conclusion: '22. ముగింపు'
    } : {
      title: 'Detailed Project Report',
      sector: 'Sector',
      location: 'Location',
      executiveSummary: '1. Executive Summary',
      businessProfile: '2. Business Profile',
      applicantInfo: '3. Applicant Information',
      projectAtGlance: '4. Project at a Glance',
      buildingDetails: '5. Building Details',
      machineryDetails: '6. Machinery Details',
      otherCapitalCosts: '7. Other Capital Costs',
      rawMaterials: '8. Raw Materials',
      wages: '9. Wages',
      salaryDetails: '10. Salary Details',
      workingCapitalEstimate: '11. Working Capital Estimate',
      powerEstimate: '12. Power Estimate',
      overheadExpenses: '13. Overhead Expenses',
      financing: '14. Financing',
      salesDetails: '15. Sales Details',
      marketAnalysis: '16. Market Analysis',
      technicalFeasibility: '17. Technical Feasibility',
      financialProjections: '18. Financial Projections',
      financialParameters: '19. Financial Parameters',
      beneficiaryInfo: '20. Beneficiary Information',
      eligibleSchemes: '21. Eligible Government Schemes',
      conclusion: '22. Conclusion'
    };

    // Helper to get section title without number
    const getSectionTitle = (label: string): string => {
      return label.replace(/^\d+\.\s*/, '').trim();
    };
    
    // Track section number for sequential numbering
    let sectionNumber = 0;
    
    // Helper function to add section if content exists with sequential numbering
    const addSection = (sectionKey: string, label: string): (Paragraph | Table)[] => {
      if (contentLang[sectionKey]) {
        sectionNumber++; // Increment section number for each section with content
        
        // Use sequential numbering instead of hardcoded numbers
        const sectionTitle = getSectionTitle(label);
        const numberedLabel = `${sectionNumber}. ${sectionTitle}`;
        
        // Clean content to remove any embedded section numbers from AI generation
        let cleanedContent = contentLang[sectionKey] || '';
        cleanedContent = cleanedContent.replace(/^\d+\.\s+/gm, '');
        
        return [
          new Paragraph({
            text: numberedLabel,
            heading: HeadingLevel.HEADING_2,
          }),
          ...createFormattedParagraphs(cleanedContent),
        ];
      }
      return [];
    };

    // Build all sections
    const allSections: (Paragraph | Table)[] = [
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
      ...addSection('executiveSummary', sectionLabels.executiveSummary),
      ...addSection('businessProfile', sectionLabels.businessProfile),
      ...addSection('applicantInfo', sectionLabels.applicantInfo),
      ...addSection('projectAtGlance', sectionLabels.projectAtGlance),
      ...addSection('buildingDetails', sectionLabels.buildingDetails),
      ...addSection('machineryDetails', sectionLabels.machineryDetails),
      ...addSection('otherCapitalCosts', sectionLabels.otherCapitalCosts),
      ...addSection('rawMaterials', sectionLabels.rawMaterials),
      ...addSection('wages', sectionLabels.wages),
      ...addSection('salaryDetails', sectionLabels.salaryDetails),
      ...addSection('workingCapitalEstimate', sectionLabels.workingCapitalEstimate),
      ...addSection('powerEstimate', sectionLabels.powerEstimate),
      ...addSection('overheadExpenses', sectionLabels.overheadExpenses),
      ...addSection('financing', sectionLabels.financing),
      ...addSection('salesDetails', sectionLabels.salesDetails),
      ...addSection('marketAnalysis', sectionLabels.marketAnalysis),
      ...addSection('technicalFeasibility', sectionLabels.technicalFeasibility),
      ...addSection('financialProjections', sectionLabels.financialProjections),
      ...addSection('financialParameters', sectionLabels.financialParameters),
      ...addSection('beneficiaryInfo', sectionLabels.beneficiaryInfo),
      ...addSection('eligibleSchemes', sectionLabels.eligibleSchemes),
    ];

    // Add Financial Summary section if financials are available
    let financials = dpr.financials;
    if (!financials || !financials.projectCost || !financials.meansOfFinance) {
      // Recalculate financials with current project data
      console.log('⚠️ Financial data missing or incomplete in DOCX, recalculating...');
      financials = FinancialService.generateCompleteFinancials(project);
    }
    
    if (financials && financials.projectCost) {
      sectionNumber++;
      const financialSummaryLabel = language === 'telugu' ? 'ఆర్థిక సారాంశం' : 'Financial Summary';
      const projectCostBreakdownLabel = language === 'telugu' ? 'ప్రాజెక్ట్ ఖర్చు విభజన:' : 'Project Cost Breakdown:';
      const meansOfFinanceLabel = language === 'telugu' ? 'ఆర్థిక మార్గాలు:' : 'Means of Finance:';
      
      // Helper function to safely format numbers
      const formatNumber = (value: any): string => {
        if (value === null || value === undefined || isNaN(value) || value === 0) {
          return '0';
        }
        const numValue = typeof value === 'number' ? value : parseFloat(value);
        if (isNaN(numValue) || !isFinite(numValue)) {
          return '0';
        }
        return numValue.toLocaleString('en-IN', { maximumFractionDigits: 2 });
      };
      
      // Helper function to safely format percentage
      const formatPercentage = (value: any): string => {
        if (value === null || value === undefined || value === '' || value === 'NaN') {
          return '0.00';
        }
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue) || !isFinite(numValue)) {
          return '0.00';
        }
        return parseFloat(numValue.toString()).toFixed(2);
      };
      
      const financialParagraphs: (Paragraph | Table)[] = [
        new Paragraph({
          text: `${sectionNumber}. ${financialSummaryLabel}`,
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          text: projectCostBreakdownLabel,
          heading: HeadingLevel.HEADING_3,
        }),
      ];
      
      // Get fixed capital total - calculate if missing
      let fixedCapitalTotal = financials.projectCost.fixedCapital?.total || 0;
      
      // If fixed capital is 0 but we have total project cost, calculate it
      // Fixed capital = Total Project Cost - Working Capital - Preliminary Expenses
      if (fixedCapitalTotal === 0) {
        const totalProjectCost = financials.projectCost.totalProjectCost || project.totalCost || 0;
        const workingCapitalTotal = financials.projectCost.workingCapital?.total || 0;
        const preliminaryExpenses = financials.projectCost.preliminaryExpenses || 0;
        
        if (totalProjectCost > 0) {
          // Calculate fixed capital as remainder
          fixedCapitalTotal = Math.max(0, totalProjectCost - workingCapitalTotal - preliminaryExpenses);
          
          // If still 0, estimate as 70% of total cost (typical for MSME projects)
          if (fixedCapitalTotal === 0 && totalProjectCost > 0) {
            fixedCapitalTotal = totalProjectCost * 0.70;
          }
        }
      }
      
      const fixedCapitalLabel = language === 'telugu' ? 'మొత్తం స్థిర మూలధనం' : 'Total Fixed Capital';
      if (fixedCapitalTotal > 0 || financials.projectCost.fixedCapital) {
        financialParagraphs.push(new Paragraph({
          text: `${fixedCapitalLabel}: ₹${formatNumber(fixedCapitalTotal)}`,
        }));
      }
      
      // Get working capital total
      const workingCapitalTotal = financials.projectCost.workingCapital?.total || 0;
      const workingCapitalLabel = language === 'telugu' ? 'మొత్తం పని మూలధనం' : 'Total Working Capital';
      if (workingCapitalTotal > 0 || financials.projectCost.workingCapital) {
        financialParagraphs.push(new Paragraph({
          text: `${workingCapitalLabel}: ₹${formatNumber(workingCapitalTotal)}`,
        }));
      }
      
      // Get total project cost
      const totalProjectCost = financials.projectCost.totalProjectCost || project.totalCost || 0;
      const totalProjectCostLabel = language === 'telugu' ? 'మొత్తం ప్రాజెక్ట్ ఖర్చు' : 'Total Project Cost';
      if (totalProjectCost > 0) {
        financialParagraphs.push(new Paragraph({
          text: `${totalProjectCostLabel}: ₹${formatNumber(totalProjectCost)}`,
        }));
      }
      
      // Means of Finance
      if (financials.meansOfFinance) {
        financialParagraphs.push(new Paragraph({ text: '' }));
        financialParagraphs.push(new Paragraph({
          text: meansOfFinanceLabel,
          heading: HeadingLevel.HEADING_3,
        }));
        
        // Get own contribution - calculate if missing
        let ownContributionAmount = financials.meansOfFinance.ownContribution?.amount || project.ownContribution || 0;
        let ownContributionPercent = financials.meansOfFinance.ownContribution?.percentage;
        
        // If percentage is NaN or invalid, recalculate it
        if (!ownContributionPercent || ownContributionPercent === 'NaN' || isNaN(parseFloat(ownContributionPercent))) {
          const totalCost = totalProjectCost || (ownContributionAmount + (financials.meansOfFinance.termLoan?.amount || project.loanAmount || 0));
          if (totalCost > 0 && ownContributionAmount > 0) {
            ownContributionPercent = ((ownContributionAmount / totalCost) * 100).toFixed(2);
          } else {
            ownContributionPercent = '0.00';
          }
        }
        
        // If amount is 0 but we have totalCost and loanAmount, calculate it
        if (ownContributionAmount === 0 && totalProjectCost > 0) {
          const termLoanAmount = financials.meansOfFinance.termLoan?.amount || project.loanAmount || 0;
          ownContributionAmount = Math.max(totalProjectCost * 0.20, totalProjectCost - termLoanAmount);
          if (totalProjectCost > 0) {
            ownContributionPercent = ((ownContributionAmount / totalProjectCost) * 100).toFixed(2);
          }
        }
        
        const ownContributionLabel = language === 'telugu' ? 'సొంత సహకారం' : 'Own Contribution';
        if (ownContributionAmount > 0 || financials.meansOfFinance.ownContribution) {
          financialParagraphs.push(new Paragraph({
            text: `${ownContributionLabel}: ₹${formatNumber(ownContributionAmount)} (${formatPercentage(ownContributionPercent)}%)`,
          }));
        }
        
        // Get term loan
        let termLoanAmount = financials.meansOfFinance.termLoan?.amount || project.loanAmount || 0;
        let termLoanPercent = financials.meansOfFinance.termLoan?.percentage;
        
        // If percentage is NaN or invalid, recalculate it
        if (!termLoanPercent || termLoanPercent === 'NaN' || isNaN(parseFloat(termLoanPercent))) {
          const totalCost = totalProjectCost || (ownContributionAmount + termLoanAmount);
          if (totalCost > 0 && termLoanAmount > 0) {
            termLoanPercent = ((termLoanAmount / totalCost) * 100).toFixed(2);
          } else {
            termLoanPercent = '0.00';
          }
        }
        
        // If amount is 0 but we have totalCost and ownContribution, calculate it
        if (termLoanAmount === 0 && totalProjectCost > 0) {
          termLoanAmount = totalProjectCost - ownContributionAmount;
          if (totalProjectCost > 0) {
            termLoanPercent = ((termLoanAmount / totalProjectCost) * 100).toFixed(2);
          }
        }
        
        const termLoanLabel = language === 'telugu' ? 'టర్మ్ లోన్' : 'Term Loan';
        if (termLoanAmount > 0 || financials.meansOfFinance.termLoan) {
          financialParagraphs.push(new Paragraph({
            text: `${termLoanLabel}: ₹${formatNumber(termLoanAmount)} (${formatPercentage(termLoanPercent)}%)`,
          }));
        }
      }
      
      allSections.push(...financialParagraphs);
    }

    allSections.push(
      ...addSection('conclusion', sectionLabels.conclusion),
    );

    const doc = new Document({
      sections: [
        {
          children: allSections,
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
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
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

