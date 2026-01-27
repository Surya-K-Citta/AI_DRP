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
  static async generatePDF(dprId: string, language: 'english' | 'telugu', enhancedParagraphs?: Record<string, string>): Promise<Buffer> {
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

      // Check if this is a cluster DPR - multiple ways to detect
      const isClusterDPRFromContent = dpr.content?.english?.isClusterDPR || dpr.content?.telugu?.isClusterDPR;
      const isClusterDPRFromProject = project.projectType === 'cluster';
      const hasClusterData = !!(dpr.content?.english?.clusterData || dpr.content?.telugu?.clusterData || dpr.metadata?.clusterData || project.stepData);
      const hasClusterStepData = !!(project.stepData && (project.stepData.step1 || project.stepData.step2));
      
      // It's a cluster DPR if any of these conditions are true
      const isClusterDPR = isClusterDPRFromContent || isClusterDPRFromProject || (hasClusterData && hasClusterStepData);
      
      console.log('🔍 Checking DPR type for PDF generation:');
      console.log(`   DPR ID: ${dpr._id || dpr.id}`);
      console.log(`   content.english.isClusterDPR: ${!!dpr.content?.english?.isClusterDPR}`);
      console.log(`   content.telugu.isClusterDPR: ${!!dpr.content?.telugu?.isClusterDPR}`);
      console.log(`   project.projectType: ${project.projectType}`);
      console.log(`   hasClusterData: ${hasClusterData}`);
      console.log(`   hasClusterStepData: ${hasClusterStepData}`);
      console.log(`   Is Cluster DPR: ${isClusterDPR}`);
      
      // If it's a cluster DPR, use the cluster-specific PDF generation
      if (isClusterDPR) {
        console.log('✅ Using Cluster DPR template (cluster-dpr-pdf.html)');
        return await this.generateClusterDPRPDF(dpr, project, language, enhancedParagraphs);
      }
      
      console.log('📄 Using regular DPR template (PDFKit)');

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
  private static generateClusterDPRHTML(dpr: any, project: any, language: 'english' | 'telugu', enhancedParagraphs?: Record<string, string>): string {
    console.log('📄 Starting Cluster DPR HTML generation...');
    console.log('📊 DPR ID:', dpr._id || dpr.id);
    console.log('📊 Language:', language);
    if (enhancedParagraphs && Object.keys(enhancedParagraphs).length > 0) {
      console.log(`📊 Enhanced paragraphs provided: ${Object.keys(enhancedParagraphs).join(', ')}`);
    }
    
    const content = dpr.content || {};
    const contentLang = language === 'telugu' 
      ? (content.telugu || content.english || {}) 
      : (content.english || {});
    
    console.log('📊 ContentLang keys:', Object.keys(contentLang));
    console.log('📊 Has executiveSummary:', !!contentLang.executiveSummary);
    console.log('📊 Has districtProfile:', !!contentLang.districtProfile);
    console.log('📊 Has clusterProfile:', !!contentLang.clusterProfile);
    console.log('📊 Has valueChain:', !!contentLang.valueChain);
    console.log('📊 Has marketAnalysis:', !!contentLang.marketAnalysis);
    console.log('📊 Has swotAnalysis:', !!contentLang.swotAnalysis);
    console.log('📊 Has gapAnalysis:', !!contentLang.gapAnalysis);
    console.log('📊 Has cfcDetails:', !!contentLang.cfcDetails);
    console.log('📊 Has spvDetails:', !!contentLang.spvDetails);
    console.log('📊 Has projectCost:', !!contentLang.projectCost);
    
    // Get cluster data from multiple sources - prioritize actual data
    const clusterData = contentLang.clusterData || dpr.metadata?.clusterData || project.stepData || {};
    console.log('📊 ClusterData source:', contentLang.clusterData ? 'contentLang' : dpr.metadata?.clusterData ? 'metadata' : 'project.stepData');
    console.log('📊 ClusterData step keys:', Object.keys(clusterData).filter(k => k.startsWith('step')));
    
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
    
    console.log('📊 Step data availability:');
    console.log('  - step1:', Object.keys(s1).length > 0 ? `${Object.keys(s1).length} keys` : 'empty');
    console.log('  - step2:', Object.keys(s2).length > 0 ? `${Object.keys(s2).length} keys` : 'empty');
    console.log('  - step3:', Object.keys(s3).length > 0 ? `${Object.keys(s3).length} keys` : 'empty');
    console.log('  - step4:', Object.keys(s4).length > 0 ? `${Object.keys(s4).length} keys` : 'empty');
    console.log('  - step5:', Object.keys(s5).length > 0 ? `${Object.keys(s5).length} keys` : 'empty');
    console.log('  - step6:', Object.keys(s6).length > 0 ? `${Object.keys(s6).length} keys` : 'empty');
    console.log('  - step7:', Object.keys(s7).length > 0 ? `${Object.keys(s7).length} keys` : 'empty');
    console.log('  - step8:', Object.keys(s8).length > 0 ? `${Object.keys(s8).length} keys` : 'empty');
    console.log('  - step9:', Object.keys(s9).length > 0 ? `${Object.keys(s9).length} keys` : 'empty');
    console.log('  - step10:', Object.keys(s10).length > 0 ? `${Object.keys(s10).length} keys` : 'empty');
    console.log('  - step11:', Object.keys(s11).length > 0 ? `${Object.keys(s11).length} keys` : 'empty');
    console.log('  - step12:', Object.keys(s12).length > 0 ? `${Object.keys(s12).length} keys` : 'empty');
    console.log('  - step14:', Object.keys(s14).length > 0 ? `${Object.keys(s14).length} keys` : 'empty');
    console.log('  - step15:', Object.keys(s15).length > 0 ? `${Object.keys(s15).length} keys` : 'empty');
    console.log('  - step16:', Object.keys(s16).length > 0 ? `${Object.keys(s16).length} keys` : 'empty');
    console.log('  - step17:', Object.keys(s17).length > 0 ? `${Object.keys(s17).length} keys` : 'empty');
    console.log('  - step18:', Object.keys(s18).length > 0 ? `${Object.keys(s18).length} keys` : 'empty');
    
    // Read HTML template - handle both development and production paths
    const possiblePaths = [
      path.join(__dirname, '../templates/cluster-dpr-pdf.html'), // Development
      path.join(process.cwd(), 'server/src/templates/cluster-dpr-pdf.html'), // Production
      path.join(process.cwd(), 'src/templates/cluster-dpr-pdf.html'), // Alternative
    ];
    
    console.log('📂 Looking for Cluster DPR template...');
    console.log('   Possible paths:');
    possiblePaths.forEach((p, idx) => {
      const exists = fs.existsSync(p);
      console.log(`   ${idx + 1}. ${p} - ${exists ? '✅ FOUND' : '❌ NOT FOUND'}`);
    });
    
    let templatePath = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        templatePath = p;
        break;
      }
    }
    
    if (!templatePath) {
      console.error('❌ Cluster DPR HTML template not found!');
      console.error('   Tried paths:', possiblePaths);
      throw new Error('Cluster DPR HTML template not found. Tried paths: ' + possiblePaths.join(', '));
    }
    
    console.log(`✅ Using template: ${templatePath}`);
    let html = fs.readFileSync(templatePath, 'utf-8');
    console.log(`✅ Template loaded: ${html.length} characters`);
    
    // Verify this is the cluster template by checking for cluster-specific placeholders
    const isClusterTemplate = html.includes('{{CLUSTER_NAME}}') && 
                              html.includes('{{PROJECT_SNAPSHOT}}') &&
                              html.includes('{{DISTRICT_PROFILE}}');
    if (!isClusterTemplate) {
      console.error('❌ WARNING: Template does not appear to be cluster-dpr-pdf.html!');
      console.error('   Template should contain {{CLUSTER_NAME}}, {{PROJECT_SNAPSHOT}}, {{DISTRICT_PROFILE}}');
      throw new Error('Wrong template file detected. Expected cluster-dpr-pdf.html but got a different template.');
    }
    console.log('✅ Template verified as cluster-dpr-pdf.html');
    
    // Replace cover page variables
    html = html.replace('{{CLUSTER_NAME}}', (s1.clusterName || project.projectName || 'CLUSTER NAME').toUpperCase());
    html = html.replace('{{SUBMITTED_TO}}', s11.submittedTo || 'DIC, District');
    html = html.replace('{{SPV_NAME}}', s11.spvName || 'SPV Name');
    html = html.replace('{{LOCATION}}', s1.location || project.location || 'Location');
    
    // Cover image - check multiple sources
    let coverImage = contentLang.coverImage || contentLang.images?.coverImage || dpr.metadata?.coverImage || '';
    
    // If image is a relative path, convert to absolute URL for PDF generation
    if (coverImage && !coverImage.startsWith('http') && !coverImage.startsWith('data:')) {
      // Check if it's a local file path
      const imagePath = path.join(process.cwd(), coverImage.replace(/^\//, ''));
      if (fs.existsSync(imagePath)) {
        // Convert to base64 for embedding in PDF
        try {
          const imageBuffer = fs.readFileSync(imagePath);
          const imageBase64 = imageBuffer.toString('base64');
          const imageExt = path.extname(imagePath).toLowerCase().slice(1);
          const mimeType = imageExt === 'png' ? 'image/png' : imageExt === 'jpg' || imageExt === 'jpeg' ? 'image/jpeg' : 'image/webp';
          coverImage = `data:${mimeType};base64,${imageBase64}`;
        } catch (error) {
          console.warn('Failed to read cover image file:', error);
          coverImage = '';
        }
      } else {
        // Try to construct URL from uploads path
        const uploadsPath = path.join(process.cwd(), 'uploads', 'images', path.basename(coverImage));
        if (fs.existsSync(uploadsPath)) {
          try {
            const imageBuffer = fs.readFileSync(uploadsPath);
            const imageBase64 = imageBuffer.toString('base64');
            const imageExt = path.extname(uploadsPath).toLowerCase().slice(1);
            const mimeType = imageExt === 'png' ? 'image/png' : imageExt === 'jpg' || imageExt === 'jpeg' ? 'image/jpeg' : 'image/webp';
            coverImage = `data:${mimeType};base64,${imageBase64}`;
          } catch (error) {
            console.warn('Failed to read cover image from uploads:', error);
            coverImage = '';
          }
        }
      }
    }
    
    if (coverImage) {
      html = html.replace('{{COVER_IMAGE}}', `<img src="${coverImage}" alt="Cover Image" style="max-width: 100%; max-height: 100%; object-fit: contain; display: block;" />`);
      // Hide placeholder text when image is present
      html = html.replace('<div class="placeholder-text" id="cover-image-placeholder-text">No image</div>', '');
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
    
    // Project Snapshot - BEFORE Introduction (rearranged order)
    if (s1.clusterName || s11.spvName) {
      tocSections.push({ chapter: '', title: 'Project Snapshot', page: String(pageNum++) });
    }
    
    // Introduction
    if (contentLang.introduction || sections.introduction || s2.sectorType) {
      tocSections.push({ chapter: '1.', title: 'Introduction', page: String(pageNum++) });
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
    const formatContent = (text: string, sectionKey?: string): string => {
      if (!text) return '';
      
      // Check for enhanced content in metadata or contentLang
      let enhancedText = '';
      if (sectionKey) {
        // Try to get enhanced content from multiple sources - check various naming patterns
        enhancedText = contentLang.enhancedContent?.[sectionKey] || 
                      dpr.metadata?.enhancedContent?.[sectionKey] ||
                      contentLang[`enhanced${sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)}`] ||
                      contentLang[`${sectionKey}Enhanced`] ||
                      '';
      }
      
      // Use enhanced content if available, otherwise use original text
      // BUT: if both exist, combine them (enhanced content + original for completeness)
      let finalText = enhancedText || text;
      
      // If we have both enhanced and original, combine them intelligently
      if (enhancedText && text && enhancedText !== text) {
        // Check if enhanced content already includes the original (to avoid duplication)
        if (!enhancedText.toLowerCase().includes(text.toLowerCase().substring(0, 50))) {
          // Combine: enhanced content first, then original if it adds value
          finalText = enhancedText + '\n\n' + text;
        } else {
          // Enhanced content already includes original, use it
          finalText = enhancedText;
        }
      }
      
      // If text already contains HTML tags, don't escape them - it's already formatted
      const hasHTMLTags = /<[a-z][\s\S]*>/i.test(finalText);
      
      if (hasHTMLTags) {
        // Text already contains HTML - clean it up but don't escape
        // Remove any double-escaped entities
        finalText = finalText
          .replace(/&amp;amp;/g, '&amp;')
          .replace(/&amp;lt;/g, '&lt;')
          .replace(/&amp;gt;/g, '&gt;')
          .replace(/&amp;quot;/g, '&quot;');
        
        // If it's already well-formed HTML, return it
        if (finalText.includes('<p') || finalText.includes('<div') || finalText.includes('<table')) {
          return finalText;
        }
      }
      
      // Process markdown text to handle tables and formatting
      const processedParas = processMarkdownText(finalText);
      let html = '';
      
      processedParas.forEach((para) => {
        if (para.type === 'table' && para.tableData) {
          // Render table with proper styling
          html += '<table style="width: 100%; border-collapse: collapse; margin: 0.5cm 0; font-size: 10pt;">';
          para.tableData.forEach((row, rowIndex) => {
            const bgColor = rowIndex === 0 ? '#E5E7EB' : (rowIndex % 2 === 0 ? '#F9FAFB' : '#FFFFFF');
            html += `<tr style="background-color: ${bgColor};">`;
            row.forEach((cell) => {
              const tag = rowIndex === 0 ? 'th' : 'td';
              const cellText = (cell || '').toString();
              // Only escape if not already HTML
              const escapedCell = hasHTMLTags ? cellText : cellText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
              const style = rowIndex === 0 
                ? 'border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left; background-color: #E5E7EB;'
                : 'border: 1px solid #1F2937; padding: 0.3cm;';
              html += `<${tag} style="${style}">${escapedCell}</${tag}>`;
            });
            html += '</tr>';
          });
          html += '</table>';
          html += '</div>';
        } else if (para.type === 'heading') {
          const level = para.headingLevel || 2;
          const tag = `h${Math.min(level + 1, 4)}`;
          const content = para.content.map(seg => seg.text).join('');
          const fontSize = level === 1 ? '18pt' : level === 2 ? '16pt' : '14pt';
          const escapedContent = hasHTMLTags ? content : content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          html += `<${tag} style="font-weight: bold; margin-top: 0.5cm; margin-bottom: 0.3cm; font-size: ${fontSize}; color: #1F2937;">${escapedContent}</${tag}>`;
        } else if (para.originalText.trim().length > 0) {
          html += '<p style="text-align: justify; margin-bottom: 0.5cm; line-height: 1.8; color: #1F2937;">';
          para.content.forEach((segment) => {
            const text = segment.text;
            const escapedText = hasHTMLTags ? text : text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            if (segment.bold) {
              html += `<strong>${escapedText}</strong>`;
            } else {
              html += escapedText;
            }
          });
          html += '</p>';
        }
      });
      
      // Fallback to simple text formatting if no processed paragraphs
      if (!html) {
        if (hasHTMLTags) {
          // Already HTML, just return it
          html = finalText;
        } else {
          // Plain text - format it
          html = finalText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\n/g, '</p><p style="text-align: justify; margin-bottom: 0.5cm; line-height: 1.8; color: #1F2937;">')
            .replace(/\n/g, '<br>');
          if (html && !html.startsWith('<p') && !html.startsWith('<div') && !html.startsWith('<table')) {
            html = `<p style="text-align: justify; margin-bottom: 0.5cm; line-height: 1.8; color: #1F2937;">${html}</p>`;
          }
        }
      }
      
      return html;
    };
    
    // Ensure we have at least some content - use enhanced content if available
    const execSummary = formatContent(
      contentLang.executiveSummary || sections.executiveSummary || '', 
      'executiveSummary'
    );
    html = html.replace('{{EXECUTIVE_SUMMARY}}', execSummary || '<p style="text-align: justify; margin-bottom: 0.5cm; line-height: 1.8;">The cluster development project aims to enhance the processing capabilities and market reach of the cluster through the establishment of a Common Facility Centre.</p>');
    
    // Generate Project Snapshot from clusterData - matching preview structure
    const generateProjectSnapshot = (): string => {
      const totalUnits = (s1.enterpriseCount?.micro || 0) + (s1.enterpriseCount?.small || 0) + (s1.enterpriseCount?.medium || 0);
      const totalEmployment = (s1.employmentPerUnit?.lessThan5 || 0) + (s1.employmentPerUnit?.between5And10 || 0) + (s1.employmentPerUnit?.moreThan10 || 0);
      
      let snapshotHTML = '<div style="width: 100%; max-width: 100%; margin: 0.6cm 0; display: flex; justify-content: flex-start; align-items: flex-start; box-sizing: border-box;">';
      snapshotHTML += '<table style="width: 100%; max-width: 100%; border-collapse: collapse; margin: 0; border: 1px solid #1F2937; box-sizing: border-box;">';
      snapshotHTML += '<tr style="background-color: #E5E7EB;"><th style="border: 1px solid #1F2937; padding: 0.35cm 0.3cm; font-weight: bold; text-align: left; vertical-align: middle;">Particulars</th><th style="border: 1px solid #1F2937; padding: 0.35cm 0.3cm; font-weight: bold; text-align: left; vertical-align: middle;">Details</th></tr>';
      snapshotHTML += `<tr style="background-color: #FFFFFF;"><td style="border: 1px solid #1F2937; padding: 0.3cm; vertical-align: top;">Name of the cluster</td><td style="border: 1px solid #1F2937; padding: 0.3cm; vertical-align: top;">${(s1.clusterName || 'N/A')}, ${(s1.district || 'N/A')} District</td></tr>`;
      snapshotHTML += `<tr style="background-color: #F9FAFB;"><td style="border: 1px solid #1F2937; padding: 0.3cm; vertical-align: top;">Location & Spread of the cluster</td><td style="border: 1px solid #1F2937; padding: 0.3cm; vertical-align: top;">${(s1.geographicalSpread || s1.location || 'N/A')}</td></tr>`;
      snapshotHTML += `<tr style="background-color: #FFFFFF;"><td style="border: 1px solid #1F2937; padding: 0.3cm; vertical-align: top;">Product range</td><td style="border: 1px solid #1F2937; padding: 0.3cm; vertical-align: top;">${(s1.majorProducts || 'N/A')}</td></tr>`;
      snapshotHTML += `<tr style="background-color: #F9FAFB;"><td style="border: 1px solid #1F2937; padding: 0.3cm; vertical-align: top;">Existing cluster scenario</td><td style="border: 1px solid #1F2937; padding: 0.3cm; vertical-align: top;">See table below</td></tr>`;
      snapshotHTML += `<tr style="background-color: #FFFFFF;"><td style="border: 1px solid #1F2937; padding: 0.3cm; vertical-align: top;">Existing employment in the Cluster</td><td style="border: 1px solid #1F2937; padding: 0.3cm; vertical-align: top;">${totalEmployment} workers (Male workers: ${(s1.employmentPerUnit?.male || 0)}, Female workers: ${(s1.employmentPerUnit?.female || 0)})</td></tr>`;
      snapshotHTML += `<tr style="background-color: #F9FAFB;"><td style="border: 1px solid #1F2937; padding: 0.3cm; vertical-align: top;">Name of the SPV</td><td style="border: 1px solid #1F2937; padding: 0.3cm; vertical-align: top;">${(s11.spvName || 'N/A')}</td></tr>`;
      snapshotHTML += `<tr style="background-color: #FFFFFF;"><td style="border: 1px solid #1F2937; padding: 0.3cm; vertical-align: top;">Legal Status</td><td style="border: 1px solid #1F2937; padding: 0.3cm; vertical-align: top;">${(s11.legalStatus || 'N/A')}</td></tr>`;
      snapshotHTML += `<tr style="background-color: #F9FAFB;"><td style="border: 1px solid #1F2937; padding: 0.3cm; vertical-align: top;">Number of SPV members (Micro unit holders)</td><td style="border: 1px solid #1F2937; padding: 0.3cm; vertical-align: top;">${(s11.memberUnits?.length || 0)} member units</td></tr>`;
      snapshotHTML += '</table>';
      snapshotHTML += '</div>';
      
        // Add existing cluster scenario table if data exists
        if (s1.enterpriseCount || s4.productionCapacity || s14.annualProductionVolume) {
          snapshotHTML += '<h4 style="margin-top: 1cm; margin-bottom: 0.5cm; font-weight: bold; color: #1F2937; font-size: 12pt;">Existing cluster scenario</h4>';
          snapshotHTML += '<table style="width: 100%; border-collapse: collapse; margin: 0.5cm 0; font-size: 10pt;">';
          snapshotHTML += '<thead><tr style="background-color: #E5E7EB;"><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Product Type</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">No. of units</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Annual Production (in MT)</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Annual Turnover (in Rs.lakhs)</th></tr></thead>';
          snapshotHTML += '<tbody>';
        
        const rows: Array<{type: string, units: number, production: string, turnover: string}> = [];
        
        if (s1.enterpriseCount?.micro && s1.enterpriseCount.micro > 0) {
          const turnover = s1.turnoverPerUnit ? ((s1.turnoverPerUnit * s1.enterpriseCount.micro) / 100000).toFixed(2) : 'N/A';
          rows.push({
            type: 'Micro Enterprises',
            units: s1.enterpriseCount.micro,
            production: s14.annualProductionVolume ? s14.annualProductionVolume.toString() : 'N/A',
            turnover: turnover
          });
        }
        if (s1.enterpriseCount?.small && s1.enterpriseCount.small > 0) {
          const turnover = s1.turnoverPerUnit ? ((s1.turnoverPerUnit * s1.enterpriseCount.small) / 100000).toFixed(2) : 'N/A';
          rows.push({
            type: 'Small Enterprises',
            units: s1.enterpriseCount.small,
            production: 'N/A',
            turnover: turnover
          });
        }
        if (s1.enterpriseCount?.medium && s1.enterpriseCount.medium > 0) {
          const turnover = s1.turnoverPerUnit ? ((s1.turnoverPerUnit * s1.enterpriseCount.medium) / 100000).toFixed(2) : 'N/A';
          rows.push({
            type: 'Medium Enterprises',
            units: s1.enterpriseCount.medium,
            production: 'N/A',
            turnover: turnover
          });
        }
        
        rows.forEach((row, idx) => {
          const bgColor = idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
          snapshotHTML += `<tr style="background-color: ${bgColor};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">${row.type}</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${row.units}</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${row.production}</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${row.turnover}</td></tr>`;
        });
        
        // Add total row
        if (rows.length > 0) {
          const totalProduction = s14.annualProductionVolume ? s14.annualProductionVolume.toString() : 'N/A';
          const totalTurnover = s1.turnoverPerUnit && totalUnits > 0 
            ? ((s1.turnoverPerUnit * totalUnits) / 100000).toFixed(2)
            : 'N/A';
          snapshotHTML += `<tr style="background-color: #E5E7EB; font-weight: bold;"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Total</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${totalUnits}</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${totalProduction}</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${totalTurnover}</td></tr>`;
        }
        
        snapshotHTML += '</tbody></table>';
      }
      
      // Key Concern areas
      snapshotHTML += '<h4 style="margin-top: 1cm; margin-bottom: 0.5cm; font-weight: bold; color: #1F2937; font-size: 12pt;">Key Concern areas of the cluster</h4>';
      snapshotHTML += '<ul style="list-style-type: disc; padding-left: 1.5cm; margin-bottom: 0.5cm; color: #1F2937;">';
      const concerns: string[] = [];
      if (s7.technologyGaps) concerns.push(`<strong>Technology:</strong> ${(s7.technologyGaps || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}`);
      if (s7.infrastructureGaps) concerns.push(`<strong>Infrastructure:</strong> ${(s7.infrastructureGaps || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}`);
      if (s7.skillGaps) concerns.push(`<strong>Skill:</strong> ${(s7.skillGaps || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}`);
      if (s7.marketingGaps) concerns.push(`<strong>Marketing:</strong> ${(s7.marketingGaps || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}`);
      if (s7.financialGaps) concerns.push(`<strong>Finance:</strong> ${(s7.financialGaps || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}`);
      
      if (concerns.length > 0) {
        concerns.forEach(concern => {
          snapshotHTML += `<li style="margin-bottom: 0.3cm; color: #1F2937; line-height: 1.8;">${concern}</li>`;
        });
      } else {
        snapshotHTML += '<li style="margin-bottom: 0.3cm; color: #1F2937; line-height: 1.8;">N/A</li>';
      }
      snapshotHTML += '</ul>';
      
      // Project Rationale
      snapshotHTML += '<h4 style="margin-top: 1cm; margin-bottom: 0.5cm; font-weight: bold; color: #1F2937; font-size: 12pt;">Project Rationale</h4>';
      const rationale = (s7.justificationForIntervention || 'N/A').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      snapshotHTML += `<p style="text-align: justify; margin-bottom: 0.5cm; line-height: 1.8; color: #1F2937;">${rationale}</p>`;
      
      // Proposed Interventions
      snapshotHTML += '<h4 style="margin-top: 1cm; margin-bottom: 0.5cm; font-weight: bold; color: #1F2937; font-size: 12pt;">Proposed Interventions</h4>';
      if (s9.interventionType) {
        const interventionType = (s9.interventionType || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        snapshotHTML += `<p style="margin-bottom: 0.3cm; color: #1F2937; line-height: 1.8;"><strong>Intervention Type:</strong> ${interventionType}</p>`;
      }
      if (s9.description) {
        const description = (s9.description || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        snapshotHTML += `<p style="text-align: justify; margin-bottom: 0.5cm; line-height: 1.8; color: #1F2937;">${description}</p>`;
      }
      
      if (s9.objectives && Array.isArray(s9.objectives) && s9.objectives.length > 0) {
        snapshotHTML += '<p style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937;">Objectives:</p>';
        snapshotHTML += '<ul style="list-style-type: disc; padding-left: 1.5cm; margin-bottom: 0.5cm; color: #1F2937;">';
        s9.objectives.forEach((objective: string) => {
          const objText = (objective || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          snapshotHTML += `<li style="margin-bottom: 0.3cm; color: #1F2937; line-height: 1.8;">${objText}</li>`;
        });
        snapshotHTML += '</ul>';
      }
      
      if (s9.expectedBenefits && Array.isArray(s9.expectedBenefits) && s9.expectedBenefits.length > 0) {
        snapshotHTML += '<p style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937;">Expected Benefits:</p>';
        snapshotHTML += '<ul style="list-style-type: disc; padding-left: 1.5cm; margin-bottom: 0.5cm; color: #1F2937;">';
        s9.expectedBenefits.forEach((benefit: string) => {
          const benefitText = (benefit || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          snapshotHTML += `<li style="margin-bottom: 0.3cm; color: #1F2937; line-height: 1.8;">${benefitText}</li>`;
        });
        snapshotHTML += '</ul>';
      }
      
      return snapshotHTML;
    };
    
    // Template already has page structure, just return content
    const projectSnapshotHTML = generateProjectSnapshot();
    html = html.replace('{{PROJECT_SNAPSHOT}}', projectSnapshotHTML);
    
    // Replace optional sections with proper headers - CORRECT ORDER
    const sectionHeaders: Record<string, string> = {
      '{{DISTRICT_PROFILE}}': '1.5 DISTRICT & REGIONAL PROFILE',
      '{{CLUSTER_PROFILE}}': '2. CLUSTER PROFILE',
      '{{VALUE_CHAIN}}': '3. CLUSTER VALUE CHAIN MAPPING',
      '{{MARKET_ASPECTS}}': '4. MARKET ASPECTS',
      '{{SWOT_ANALYSIS}}': '5. SWOT ANALYSIS',
      '{{GAP_ANALYSIS}}': '6. NEED GAP ANALYSIS',
      '{{PROPOSED_INTERVENTION}}': '7. PROPOSED INTERVENTION',
      '{{CFC_DETAILS}}': '8. CFC - OPERATION & MANAGEMENT',
      '{{SPV_DETAILS}}': '9. SPV MEMBER UNITS',
      '{{PROJECT_COST}}': '10. PROJECT COST & MEANS OF FINANCE',
      '{{OPERATING_COST_REVENUE}}': '10.5 OPERATING COST & REVENUE',
      '{{FINANCIAL_VIABILITY}}': '11. FINANCIAL VIABILITY',
      '{{IMPLEMENTATION_SCHEDULE}}': '11.5 PROJECT IMPLEMENTATION SCHEDULE',
      '{{EXPECTED_IMPACT}}': '12. EXPECTED IMPACT',
      '{{CONCLUSION}}': 'CONCLUSION'
    };
    
    // Helper to generate section content from clusterData
    const generateSectionFromData = (stepData: any, sectionType: string): string => {
      if (!stepData || Object.keys(stepData).length === 0) return '';
      
      let content = '';
      let hasContent = false;
      
      // Helper to escape HTML in text (but preserve existing HTML structure)
      const escapeText = (text: string): string => {
        // Don't escape if it already looks like HTML
        if (/<[a-z]/i.test(text)) return text;
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      };
      
      // Helper to check if array should be a table (has objects with same keys)
      const shouldBeTable = (arr: any[]): boolean => {
        if (arr.length === 0) return false;
        const firstItem = arr[0];
        if (typeof firstItem !== 'object' || firstItem === null || Array.isArray(firstItem)) return false;
        // Check if all items have similar structure (at least 2 keys)
        const keys = Object.keys(firstItem);
        if (keys.length < 2) return false;
        // Check if at least 50% of items have the same keys
        const matchingItems = arr.filter(item => 
          typeof item === 'object' && 
          item !== null && 
          !Array.isArray(item) &&
          keys.every(k => k in item)
        );
        return matchingItems.length >= Math.max(1, arr.length * 0.5);
      };
      
      // Generate content from step data
      Object.entries(stepData).forEach(([key, value]) => {
        // Skip internal/technical fields
        if (key.startsWith('_') || key === 'id' || key === '__v') return;
        
        if (value && typeof value === 'object' && !Array.isArray(value) && value !== null) {
          // Nested object - recurse but format better
          const nested = generateSectionFromData(value, sectionType);
          if (nested) {
            // Add a heading for nested objects if they have meaningful content
            const keyLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
            content += `<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">${escapeText(keyLabel)}</h4>`;
            content += nested;
            hasContent = true;
          }
        } else if (value && Array.isArray(value)) {
          // Array - create table if objects have similar structure, otherwise list
          if (value.length > 0) {
            const keyLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
            
            if (shouldBeTable(value)) {
              // Create table
              const firstItem = value[0];
              const columns = Object.keys(firstItem).filter(k => !k.startsWith('_') && k !== 'id' && k !== '__v');
              
              if (columns.length > 0) {
                content += `<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">${escapeText(keyLabel)}</h4>`;
                content += '<table style="width: 100%; border-collapse: collapse; margin: 0.5cm 0; font-size: 10pt;">';
                content += '<thead><tr style="background-color: #E5E7EB;">';
                columns.forEach(col => {
                  const colLabel = col.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
                  content += `<th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">${escapeText(colLabel)}</th>`;
                });
                content += '</tr></thead><tbody>';
                
                value.forEach((item: any, idx: number) => {
                  if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                    const bgColor = idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
                    content += `<tr style="background-color: ${bgColor};">`;
                    columns.forEach(col => {
                      const cellValue = item[col];
                      const cellStr = cellValue !== null && cellValue !== undefined 
                        ? (typeof cellValue === 'number' ? cellValue.toLocaleString('en-IN') : String(cellValue))
                        : '';
                      content += `<td style="border: 1px solid #1F2937; padding: 0.3cm;">${escapeText(cellStr)}</td>`;
                    });
                    content += '</tr>';
                    hasContent = true;
                  }
                });
                content += '</tbody></table>';
              }
            } else {
              // Create list
              content += `<p style="margin-top: 0.3cm; margin-bottom: 0.2cm; color: #1F2937;"><strong>${escapeText(keyLabel)}:</strong></p><ul style="list-style-type: disc; padding-left: 1.5cm; margin-bottom: 0.5cm; color: #1F2937;">`;
              value.forEach((item: any) => {
                if (typeof item === 'string' && item.trim()) {
                  content += `<li style="margin-bottom: 0.2cm; line-height: 1.8;">${escapeText(item)}</li>`;
                  hasContent = true;
                } else if (typeof item === 'object' && item !== null) {
                  // Format object as readable text
                  const parts: string[] = [];
                  Object.entries(item).forEach(([k, v]) => {
                    if (v !== null && v !== undefined && v !== '') {
                      const kLabel = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
                      const vStr = typeof v === 'number' ? v.toLocaleString('en-IN') : String(v);
                      parts.push(`${kLabel}: ${vStr}`);
                    }
                  });
                  if (parts.length > 0) {
                    content += `<li style="margin-bottom: 0.2cm; line-height: 1.8;">${escapeText(parts.join(', '))}</li>`;
                    hasContent = true;
                  }
                }
              });
              content += '</ul>';
            }
          }
        } else if (value !== null && value !== undefined && value !== '') {
          // Simple value - format key nicely
          const keyLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
          const valueStr = typeof value === 'number' 
            ? value.toLocaleString('en-IN') 
            : String(value);
          content += `<p style="margin-bottom: 0.3cm; line-height: 1.8; color: #1F2937;"><strong>${escapeText(keyLabel)}:</strong> ${escapeText(valueStr)}</p>`;
          hasContent = true;
        }
      });
      
      return hasContent ? content : '';
    };
    
    const replaceSection = (placeholder: string, content: string, header: string, stepData?: any) => {
      const sectionName = header;
      console.log(`\n🔍 Processing section: ${sectionName}`);
      console.log(`   Placeholder: ${placeholder}`);
      console.log(`   Has formatted content: ${!!(content && content.trim())}`);
      console.log(`   Has stepData: ${!!(stepData && Object.keys(stepData).length > 0)}`);
      if (stepData && Object.keys(stepData).length > 0) {
        console.log(`   StepData keys: ${Object.keys(stepData).slice(0, 5).join(', ')}${Object.keys(stepData).length > 5 ? '...' : ''}`);
      }
      
      // Try to get content from multiple sources - COMBINE ENHANCED CONTENT + STEPDATA
      let finalContent = content;
      
      // Map placeholders to section names used in enhancedParagraphs
      const placeholderToSectionMap: Record<string, string> = {
        '{{INTRODUCTION}}': 'introduction',
        '{{DISTRICT_PROFILE}}': 'districtProfile',
        '{{CLUSTER_PROFILE}}': 'clusterProfile',
        '{{MARKET_ASPECTS}}': 'marketAspects',
        '{{VALUE_CHAIN}}': 'valueChain',
        '{{SWOT_ANALYSIS}}': 'swotAnalysis',
        '{{GAP_ANALYSIS}}': 'gapAnalysis',
        '{{CFC_DETAILS}}': 'cfcDetails',
        '{{SPV_DETAILS}}': 'spvDetails',
        '{{PROJECT_COST}}': 'projectCost',
        '{{FINANCIAL_VIABILITY}}': 'financialViability',
        '{{EXPECTED_IMPACT}}': 'expectedImpact',
        '{{CONCLUSION}}': 'conclusion',
      };
      
      const enhancedSectionKey = placeholderToSectionMap[placeholder] || placeholder.replace(/[{}]/g, '').toLowerCase().replace(/_/g, '');
      
      // Check for enhanced content first (from localStorage enhancedParagraphs - HIGHEST PRIORITY)
      let enhancedContent = '';
      if (enhancedParagraphs && enhancedParagraphs[enhancedSectionKey]) {
        enhancedContent = enhancedParagraphs[enhancedSectionKey];
        console.log(`   ✅ Found enhanced paragraph from localStorage for ${enhancedSectionKey} (${enhancedContent.length} chars)`);
      }
      
      // Check for enhanced content from other sources (from AI enhancement stored in DPR)
      const sectionKey = placeholder.replace(/[{}]/g, '').toLowerCase().replace(/_/g, '');
      enhancedContent = enhancedContent || 
                        contentLang.enhancedContent?.[sectionKey] || 
                        dpr.metadata?.enhancedContent?.[sectionKey] ||
                        contentLang[`enhanced${sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)}`] ||
                        '';
      
      // For Introduction, also check introduction and businessProfile fields
      if (placeholder === '{{INTRODUCTION}}') {
        enhancedContent = enhancedContent || 
                         contentLang.introduction || 
                         contentLang.businessProfile || 
                         sections.introduction ||
                         '';
        console.log(`   📝 Introduction - checking multiple sources for enhanced content`);
        console.log(`      enhancedParagraphs: ${!!(enhancedParagraphs && enhancedParagraphs['introduction'])}`);
        console.log(`      contentLang.introduction: ${!!contentLang.introduction}`);
        console.log(`      contentLang.businessProfile: ${!!contentLang.businessProfile}`);
        console.log(`      sections.introduction: ${!!sections.introduction}`);
        console.log(`      enhancedContent found: ${!!enhancedContent} (${enhancedContent ? enhancedContent.length : 0} chars)`);
      }
      
      // For District Profile, also check districtProfile field
      if (placeholder === '{{DISTRICT_PROFILE}}') {
        enhancedContent = enhancedContent || 
                         contentLang.districtProfile || 
                         sections.districtProfile ||
                         '';
        console.log(`   📝 District Profile - checking multiple sources for enhanced content`);
        console.log(`      contentLang.districtProfile: ${!!contentLang.districtProfile}`);
        console.log(`      sections.districtProfile: ${!!sections.districtProfile}`);
        console.log(`      enhancedContent found: ${!!enhancedContent} (${enhancedContent ? enhancedContent.length : 0} chars)`);
      }
      
      // For Cluster Profile, also check clusterProfile field
      if (placeholder === '{{CLUSTER_PROFILE}}') {
        enhancedContent = enhancedContent || 
                         contentLang.clusterProfile || 
                         sections.clusterProfile ||
                         '';
        console.log(`   📝 Cluster Profile - checking multiple sources for enhanced content`);
        console.log(`      contentLang.clusterProfile: ${!!contentLang.clusterProfile}`);
        console.log(`      sections.clusterProfile: ${!!sections.clusterProfile}`);
        console.log(`      enhancedContent found: ${!!enhancedContent} (${enhancedContent ? enhancedContent.length : 0} chars)`);
      }
      
      // For Market Aspects, also check marketAnalysis and marketAssessment fields
      if (placeholder === '{{MARKET_ASPECTS}}') {
        enhancedContent = enhancedContent || 
                         contentLang.marketAnalysis || 
                         contentLang.marketAssessment ||
                         sections.marketAnalysis ||
                         sections.marketAssessment ||
                         '';
        console.log(`   📝 Market Aspects - checking multiple sources for enhanced content`);
        console.log(`      contentLang.marketAnalysis: ${!!contentLang.marketAnalysis}`);
        console.log(`      contentLang.marketAssessment: ${!!contentLang.marketAssessment}`);
        console.log(`      sections.marketAnalysis: ${!!sections.marketAnalysis}`);
        console.log(`      sections.marketAssessment: ${!!sections.marketAssessment}`);
        console.log(`      enhancedContent found: ${!!enhancedContent} (${enhancedContent ? enhancedContent.length : 0} chars)`);
      }
      
      // Generate content from stepData (but ONLY if we don't have enhanced content, or for specific sections)
      // For Introduction, District Profile, Cluster Profile, and Market Aspects, we'll generate sub-sections separately to avoid duplication
      let stepDataContent = '';
      if (stepData && Object.keys(stepData).length > 0) {
        // For Introduction, District Profile, Cluster Profile, and Market Aspects, don't use generateSectionFromData (it creates duplicates)
        // We'll generate sub-sections separately
        if (placeholder !== '{{INTRODUCTION}}' && placeholder !== '{{DISTRICT_PROFILE}}' && placeholder !== '{{CLUSTER_PROFILE}}' && placeholder !== '{{MARKET_ASPECTS}}') {
          console.log(`   ⚙️  Generating content from stepData...`);
          stepDataContent = generateSectionFromData(stepData, header);
          console.log(`   Generated stepData content length: ${stepDataContent ? stepDataContent.length : 0} chars`);
        }
      }
      
      // Combine content intelligently - ENHANCED CONTENT FIRST, THEN STEPDATA
      // 1. Use enhanced content if available (most comprehensive) - THIS COMES FIRST
      // 2. Append stepData content AFTER enhanced content (never replace it)
      // 3. Fall back to original content if no enhanced content
      
      // Format enhanced content if it exists
      if (enhancedContent && enhancedContent.trim()) {
        console.log(`   ✅ Found enhanced content (${enhancedContent.length} chars) - using as primary content`);
        // Format the enhanced content properly (convert markdown, preserve HTML)
        finalContent = formatContent(enhancedContent, sectionKey);
        console.log(`   ✅ Formatted enhanced content (${finalContent.length} chars)`);
      } else if (content && content.trim()) {
        // Use original content if no enhanced content
        console.log(`   ✅ Using original content (${content.length} chars)`);
        finalContent = formatContent(content, sectionKey);
      } else {
        // No content at all
        finalContent = '';
      }
      
      // For non-Introduction sections, append stepData content AFTER enhanced content
      if (placeholder !== '{{INTRODUCTION}}' && stepDataContent && stepDataContent.trim()) {
        // Check if stepData content is already in enhanced content (avoid duplication)
        const stepDataPreview = stepDataContent.substring(0, 100).toLowerCase();
        const stepDataKeyWords = stepDataContent.toLowerCase().split(/\s+/).slice(0, 10).join(' ');
        
        // More thorough check for duplication
        const isDuplicate = finalContent.toLowerCase().includes(stepDataPreview) ||
                           finalContent.toLowerCase().includes(stepDataKeyWords) ||
                           (stepDataContent.length < 200 && finalContent.toLowerCase().includes(stepDataContent.toLowerCase().substring(0, 50)));
        
        if (!isDuplicate) {
          console.log(`   ➕ Appending stepData content AFTER enhanced content`);
          finalContent += '\n\n' + stepDataContent;
        } else {
          console.log(`   ℹ️  StepData content already included - skipping to avoid duplication`);
        }
      }
      
      // For specific sections, generate tables from stepData even if we have content
      if (stepData && Object.keys(stepData).length > 0) {
        // Introduction - generate sub-sections (1.1, 1.2, 1.3, 1.4) from stepData
        // ONLY add these if they're not already in the enhanced content
        if (placeholder === '{{INTRODUCTION}}' && stepData && Object.keys(stepData).length > 0) {
          let introSubsections = '';
          
          // Check for common Introduction sub-section fields
          const subsectionFields = [
            { key: 'sectorType', label: '1.1 Sector/Industry Type' },
            { key: 'sectorDescription', label: '1.2 Sector Description' },
            { key: 'nationalImportance', label: '1.3 National Importance' },
            { key: 'stateLevelImportance', label: '1.4 State-level Importance' },
            { key: 'industryType', label: '1.1 Sector/Industry Type' },
            { key: 'description', label: '1.2 Sector Description' },
            { key: 'nationalSignificance', label: '1.3 National Importance' },
            { key: 'stateSignificance', label: '1.4 State-level Importance' }
          ];
          
          subsectionFields.forEach(({ key, label}) => {
            if (stepData[key] && stepData[key] !== null && stepData[key] !== '') {
              const valueStr = String(stepData[key]).trim();
              const labelLower = label.toLowerCase();
              
              // Check if this subsection is already in the enhanced content
              // Check for both the label and the value to avoid duplication
              const labelInContent = finalContent.toLowerCase().includes(labelLower.substring(0, 20));
              const valueInContent = finalContent.toLowerCase().includes(valueStr.toLowerCase().substring(0, Math.min(50, valueStr.length)));
              
              if (!labelInContent && !valueInContent) {
                console.log(`   ➕ Adding subsection: ${label}`);
                introSubsections += `<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">${label}</h4>`;
                introSubsections += `<p style="text-align: justify; margin-bottom: 0.5cm; line-height: 1.8; color: #1F2937;">${valueStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
              } else {
                console.log(`   ⏭️  Skipping subsection ${label} - already in content`);
              }
            }
          });
          
          // Also include any other stepData fields that aren't already covered
          // But only if they're not already in the enhanced content
          Object.entries(stepData).forEach(([key, value]) => {
            // Skip fields we've already processed or internal fields
            if (key.startsWith('_') || key === 'id' || key === '__v') return;
            if (subsectionFields.some(f => f.key === key)) return;
            
            // Skip if already in content
            const keyLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
            const valueStr = typeof value === 'number' ? value.toLocaleString('en-IN') : String(value);
            
            // Check if this field is already in the enhanced content
            const keyInContent = finalContent.toLowerCase().includes(keyLabel.toLowerCase().substring(0, 10));
            const valueInContent = valueStr && valueStr.trim() && finalContent.toLowerCase().includes(valueStr.toLowerCase().substring(0, Math.min(30, valueStr.length)));
            
            if (!keyInContent && !valueInContent && value !== null && value !== undefined && value !== '' && valueStr.trim().length > 0) {
              console.log(`   ➕ Adding additional field: ${keyLabel}`);
              introSubsections += `<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">${keyLabel}</h4>`;
              introSubsections += `<p style="text-align: justify; margin-bottom: 0.5cm; line-height: 1.8; color: #1F2937;">${valueStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
            }
          });
          
          // ALWAYS append sub-sections AFTER enhanced content (never replace it)
          if (introSubsections) {
            if (finalContent && finalContent.trim()) {
              // Enhanced content exists - append stepData sub-sections after it
              console.log(`   ➕ Appending Introduction sub-sections (${introSubsections.length} chars) AFTER enhanced content`);
              finalContent += '\n\n' + introSubsections;
            } else {
              // No enhanced content - use sub-sections as main content
              console.log(`   ✅ Using Introduction sub-sections as main content (${introSubsections.length} chars)`);
              finalContent = introSubsections;
            }
          } else {
            console.log(`   ℹ️  No new Introduction sub-sections to add (all already in enhanced content)`);
          }
        }
        
        // SWOT Analysis - generate table if we have SWOT data
        if (placeholder === '{{SWOT_ANALYSIS}}' && (s8.strengths || s8.weaknesses || s8.opportunities || s8.threats)) {
          let swotTable = '<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">SWOT Analysis Summary</h4>';
          swotTable += '<table style="width: 100%; border-collapse: collapse; margin: 0.5cm 0; font-size: 10pt;">';
          swotTable += '<thead><tr style="background-color: #E5E7EB;"><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Category</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Details</th></tr></thead><tbody>';
          
          if (s8.strengths) {
            const strengths = Array.isArray(s8.strengths) ? s8.strengths : [s8.strengths];
            strengths.forEach((s: any) => {
              swotTable += `<tr style="background-color: #FFFFFF;"><td style="border: 1px solid #1F2937; padding: 0.3cm;"><strong>Strengths</strong></td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr>`;
            });
          }
          if (s8.weaknesses) {
            const weaknesses = Array.isArray(s8.weaknesses) ? s8.weaknesses : [s8.weaknesses];
            weaknesses.forEach((w: any) => {
              swotTable += `<tr style="background-color: #F9FAFB;"><td style="border: 1px solid #1F2937; padding: 0.3cm;"><strong>Weaknesses</strong></td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${String(w).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr>`;
            });
          }
          if (s8.opportunities) {
            const opportunities = Array.isArray(s8.opportunities) ? s8.opportunities : [s8.opportunities];
            opportunities.forEach((o: any) => {
              swotTable += `<tr style="background-color: #FFFFFF;"><td style="border: 1px solid #1F2937; padding: 0.3cm;"><strong>Opportunities</strong></td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${String(o).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr>`;
            });
          }
          if (s8.threats) {
            const threats = Array.isArray(s8.threats) ? s8.threats : [s8.threats];
            threats.forEach((t: any) => {
              swotTable += `<tr style="background-color: #F9FAFB;"><td style="border: 1px solid #1F2937; padding: 0.3cm;"><strong>Threats</strong></td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr>`;
            });
          }
          swotTable += '</tbody></table>';
          
          // Append table to content if we have content, or use as main content
          if (finalContent && finalContent.trim()) {
            finalContent += swotTable;
          } else {
            finalContent = swotTable;
          }
        }
        
        // District & Regional Profile - generate numbered sub-sections and tables
        if (placeholder === '{{DISTRICT_PROFILE}}' && stepData && Object.keys(stepData).length > 0) {
          let districtSubsections = '';
          let subsectionNum = 1;
          
          // Define the sub-sections in order
          const subsectionFields = [
            { key: 'geography', label: '1.5.1 Geography' },
            { key: 'climate', label: '1.5.2 Climate' },
            { key: 'infrastructure', label: '1.5.3 Infrastructure' },
            { key: 'keyEconomicActivities', label: '1.5.4 Key Economic Activities' },
            { key: 'economicActivities', label: '1.5.4 Key Economic Activities' },
            { key: 'rawMaterialAvailability', label: '1.5.5 Raw Material Availability' },
            { key: 'industrialInfrastructure', label: '1.5.6 Industrial Infrastructure' },
            { key: 'connectivity', label: '1.5.7 Connectivity' }
          ];
          
          subsectionFields.forEach(({ key, label }) => {
            if (stepData[key] && stepData[key] !== null && stepData[key] !== '') {
              const value = stepData[key];
              const labelLower = label.toLowerCase();
              
              // Check if this subsection is already in the enhanced content
              const labelInContent = finalContent.toLowerCase().includes(labelLower.substring(0, 15));
              
              if (!labelInContent) {
                // Special handling for Raw Material Availability - create table
                if (key === 'rawMaterialAvailability' && typeof value === 'object' && !Array.isArray(value)) {
                  districtSubsections += `<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">${label}</h4>`;
                  districtSubsections += '<table style="width: 100%; border-collapse: collapse; margin: 0.5cm 0; font-size: 10pt;">';
                  districtSubsections += '<thead><tr style="background-color: #E5E7EB;"><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Parameter</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Details</th></tr></thead><tbody>';
                  
                  Object.entries(value).forEach(([paramKey, paramValue], idx) => {
                    if (paramValue !== null && paramValue !== undefined && paramValue !== '') {
                      const bgColor = idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
                      const paramLabel = paramKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
                      const paramValueStr = typeof paramValue === 'number' ? paramValue.toLocaleString('en-IN') : String(paramValue);
                      districtSubsections += `<tr style="background-color: ${bgColor};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">${paramLabel}</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${paramValueStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr>`;
                    }
                  });
                  districtSubsections += '</tbody></table>';
                }
                // Special handling for Connectivity - create table
                else if (key === 'connectivity' && typeof value === 'object' && !Array.isArray(value)) {
                  districtSubsections += `<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">${label}</h4>`;
                  districtSubsections += '<table style="width: 100%; border-collapse: collapse; margin: 0.5cm 0; font-size: 10pt;">';
                  districtSubsections += '<thead><tr style="background-color: #E5E7EB;"><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Mode</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Details</th></tr></thead><tbody>';
                  
                  Object.entries(value).forEach(([modeKey, modeValue], idx) => {
                    if (modeValue !== null && modeValue !== undefined && modeValue !== '') {
                      const bgColor = idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
                      const modeLabel = modeKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
                      const modeValueStr = typeof modeValue === 'number' ? modeValue.toLocaleString('en-IN') : String(modeValue);
                      districtSubsections += `<tr style="background-color: ${bgColor};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">${modeLabel}</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${modeValueStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr>`;
                    }
                  });
                  districtSubsections += '</tbody></table>';
                }
                // Regular text fields
                else {
                  const valueStr = typeof value === 'number' ? value.toLocaleString('en-IN') : String(value);
                  districtSubsections += `<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">${label}</h4>`;
                  districtSubsections += `<p style="text-align: justify; margin-bottom: 0.5cm; line-height: 1.8; color: #1F2937;">${valueStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
                }
              }
            }
          });
          
          // Also include any other stepData fields that aren't already covered
          Object.entries(stepData).forEach(([key, value]) => {
            // Skip fields we've already processed or internal fields
            if (key.startsWith('_') || key === 'id' || key === '__v') return;
            if (subsectionFields.some(f => f.key === key)) return;
            
            // Skip if already in content
            const keyLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
            const valueStr = typeof value === 'number' ? value.toLocaleString('en-IN') : String(value);
            
            // Check if this field is already in the enhanced content
            const keyInContent = finalContent.toLowerCase().includes(keyLabel.toLowerCase().substring(0, 10));
            const valueInContent = valueStr && valueStr.trim() && finalContent.toLowerCase().includes(valueStr.toLowerCase().substring(0, Math.min(30, valueStr.length)));
            
            if (!keyInContent && !valueInContent && value !== null && value !== undefined && value !== '' && valueStr.trim().length > 0) {
              subsectionNum++;
              districtSubsections += `<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">1.5.${subsectionNum} ${keyLabel}</h4>`;
              districtSubsections += `<p style="text-align: justify; margin-bottom: 0.5cm; line-height: 1.8; color: #1F2937;">${valueStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
            }
          });
          
          // Append sub-sections AFTER enhanced content
          if (districtSubsections) {
            if (finalContent && finalContent.trim()) {
              console.log(`   ➕ Appending District Profile sub-sections (${districtSubsections.length} chars) AFTER enhanced content`);
              finalContent += '\n\n' + districtSubsections;
            } else {
              console.log(`   ✅ Using District Profile sub-sections as main content (${districtSubsections.length} chars)`);
              finalContent = districtSubsections;
            }
          }
        }
        
        // Cluster Profile - generate numbered sub-sections and tables
        if (placeholder === '{{CLUSTER_PROFILE}}' && stepData && Object.keys(stepData).length > 0) {
          let clusterSubsections = '';
          let subsectionNum = 1;
          
          // Define the sub-sections in order
          const subsectionFields = [
            { key: 'clusterEvolution', label: '2.1 Evolution of the Cluster', isText: true },
            { key: 'evolution', label: '2.1 Evolution of the Cluster', isText: true },
            { key: 'presentStatus', label: '2.2 Present Status of Cluster Units', isTable: true },
            { key: 'presentStatusOfClusterUnits', label: '2.2 Present Status of Cluster Units', isTable: true },
            { key: 'keyStakeholders', label: '2.3 Key Stakeholders', isList: true },
            { key: 'stakeholders', label: '2.3 Key Stakeholders', isList: true }
          ];
          
          subsectionFields.forEach(({ key, label, isTable, isList, isText }) => {
            if (stepData[key] && stepData[key] !== null && stepData[key] !== '') {
              const value = stepData[key];
              const labelLower = label.toLowerCase();
              
              // Check if this subsection is already in the enhanced content
              const labelInContent = finalContent.toLowerCase().includes(labelLower.substring(0, 15));
              
              if (!labelInContent) {
                // Special handling for Present Status - create table
                if (isTable && typeof value === 'object' && !Array.isArray(value)) {
                  clusterSubsections += `<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">${label}</h4>`;
                  clusterSubsections += '<table style="width: 100%; border-collapse: collapse; margin: 0.5cm 0; font-size: 10pt;">';
                  clusterSubsections += '<thead><tr style="background-color: #E5E7EB;"><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Parameter</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Details</th></tr></thead><tbody>';
                  
                  Object.entries(value).forEach(([paramKey, paramValue], idx) => {
                    if (paramValue !== null && paramValue !== undefined && paramValue !== '') {
                      const bgColor = idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
                      const paramLabel = paramKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
                      // Handle common field names
                      const displayLabel = paramLabel === 'No Of Units' || paramLabel === 'No. Of Units' || paramLabel === 'Number Of Units' 
                        ? 'No. of Units' 
                        : paramLabel === 'Year Of Establishment' || paramLabel === 'Year Of Establishment'
                        ? 'Year of Establishment'
                        : paramLabel;
                      const paramValueStr = typeof paramValue === 'number' ? paramValue.toLocaleString('en-IN') : String(paramValue);
                      clusterSubsections += `<tr style="background-color: ${bgColor};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">${displayLabel}</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${paramValueStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr>`;
                    }
                  });
                  clusterSubsections += '</tbody></table>';
                }
                // Special handling for Key Stakeholders - create list
                else if (isList) {
                  clusterSubsections += `<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">${label}</h4>`;
                  if (Array.isArray(value)) {
                    clusterSubsections += '<ul style="list-style-type: disc; padding-left: 1.5cm; margin-bottom: 0.5cm; color: #1F2937;">';
                    value.forEach((item: any) => {
                      if (item && String(item).trim()) {
                        clusterSubsections += `<li style="margin-bottom: 0.2cm; line-height: 1.8;">${String(item).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`;
                      }
                    });
                    clusterSubsections += '</ul>';
                  } else if (typeof value === 'object' && value !== null) {
                    // Handle object format - extract values
                    clusterSubsections += '<ul style="list-style-type: disc; padding-left: 1.5cm; margin-bottom: 0.5cm; color: #1F2937;">';
                    Object.values(value).forEach((item: any) => {
                      if (item && String(item).trim()) {
                        clusterSubsections += `<li style="margin-bottom: 0.2cm; line-height: 1.8;">${String(item).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`;
                      }
                    });
                    clusterSubsections += '</ul>';
                  } else {
                    // Single value
                    clusterSubsections += `<p style="text-align: justify; margin-bottom: 0.5cm; line-height: 1.8; color: #1F2937;">${String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
                  }
                }
                // Regular text fields
                else if (isText) {
                  const valueStr = typeof value === 'number' ? value.toLocaleString('en-IN') : String(value);
                  clusterSubsections += `<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">${label}</h4>`;
                  clusterSubsections += `<p style="text-align: justify; margin-bottom: 0.5cm; line-height: 1.8; color: #1F2937;">${valueStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
                }
              }
            }
          });
          
          // Also handle presentStatus fields directly from stepData (if not in subsectionFields)
          if (stepData.numberOfUnits || stepData.productionCapacity || stepData.technologyLevel || 
              stepData.yearOfEstablishment || stepData.typeOfUnits || stepData.presentActivities) {
            const labelLower = '2.2 present status of cluster units';
            if (!finalContent.toLowerCase().includes(labelLower.substring(0, 20))) {
              clusterSubsections += '<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">2.2 Present Status of Cluster Units</h4>';
              clusterSubsections += '<table style="width: 100%; border-collapse: collapse; margin: 0.5cm 0; font-size: 10pt;">';
              clusterSubsections += '<thead><tr style="background-color: #E5E7EB;"><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Parameter</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Details</th></tr></thead><tbody>';
              
              let rowIdx = 0;
              if (stepData.numberOfUnits) {
                clusterSubsections += `<tr style="background-color: ${rowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">No. of Units</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${typeof stepData.numberOfUnits === 'number' ? stepData.numberOfUnits.toLocaleString('en-IN') : stepData.numberOfUnits}</td></tr>`;
                rowIdx++;
              }
              if (stepData.productionCapacity) {
                clusterSubsections += `<tr style="background-color: ${rowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Production Capacity</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${String(stepData.productionCapacity).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr>`;
                rowIdx++;
              }
              if (stepData.technologyLevel) {
                clusterSubsections += `<tr style="background-color: ${rowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Technology Level</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${String(stepData.technologyLevel).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr>`;
                rowIdx++;
              }
              if (stepData.yearOfEstablishment) {
                clusterSubsections += `<tr style="background-color: ${rowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Year of Establishment</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${typeof stepData.yearOfEstablishment === 'number' ? stepData.yearOfEstablishment.toLocaleString('en-IN') : stepData.yearOfEstablishment}</td></tr>`;
                rowIdx++;
              }
              if (stepData.typeOfUnits) {
                clusterSubsections += `<tr style="background-color: ${rowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Type of Units</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${String(stepData.typeOfUnits).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr>`;
                rowIdx++;
              }
              if (stepData.presentActivities) {
                clusterSubsections += `<tr style="background-color: ${rowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Present Activities</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${String(stepData.presentActivities).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr>`;
                rowIdx++;
              }
              clusterSubsections += '</tbody></table>';
            }
          }
          
          // Also include any other stepData fields that aren't already covered
          Object.entries(stepData).forEach(([key, value]) => {
            // Skip fields we've already processed or internal fields
            if (key.startsWith('_') || key === 'id' || key === '__v') return;
            if (subsectionFields.some(f => f.key === key)) return;
            if (['numberOfUnits', 'productionCapacity', 'technologyLevel', 'yearOfEstablishment', 'typeOfUnits', 'presentActivities'].includes(key)) return;
            
            // Skip if already in content
            const keyLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
            const valueStr = typeof value === 'number' ? value.toLocaleString('en-IN') : String(value);
            
            // Check if this field is already in the enhanced content
            const keyInContent = finalContent.toLowerCase().includes(keyLabel.toLowerCase().substring(0, 10));
            const valueInContent = valueStr && valueStr.trim() && finalContent.toLowerCase().includes(valueStr.toLowerCase().substring(0, Math.min(30, valueStr.length)));
            
            if (!keyInContent && !valueInContent && value !== null && value !== undefined && value !== '' && valueStr.trim().length > 0) {
              subsectionNum++;
              clusterSubsections += `<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">2.${subsectionNum} ${keyLabel}</h4>`;
              if (Array.isArray(value)) {
                clusterSubsections += '<ul style="list-style-type: disc; padding-left: 1.5cm; margin-bottom: 0.5cm; color: #1F2937;">';
                value.forEach((item: any) => {
                  if (item && String(item).trim()) {
                    clusterSubsections += `<li style="margin-bottom: 0.2cm; line-height: 1.8;">${String(item).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`;
                  }
                });
                clusterSubsections += '</ul>';
              } else {
                clusterSubsections += `<p style="text-align: justify; margin-bottom: 0.5cm; line-height: 1.8; color: #1F2937;">${valueStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
              }
            }
          });
          
          // Append sub-sections AFTER enhanced content
          if (clusterSubsections) {
            if (finalContent && finalContent.trim()) {
              console.log(`   ➕ Appending Cluster Profile sub-sections (${clusterSubsections.length} chars) AFTER enhanced content`);
              finalContent += '\n\n' + clusterSubsections;
            } else {
              console.log(`   ✅ Using Cluster Profile sub-sections as main content (${clusterSubsections.length} chars)`);
              finalContent = clusterSubsections;
            }
          }
        }
        
        // Market Aspects - generate numbered sub-sections (4.1, 4.2, etc.) from stepData
        if (placeholder === '{{MARKET_ASPECTS}}' && stepData && Object.keys(stepData).length > 0) {
          let marketSubsections = '';
          let subsectionNum = 1;
          
          // Define the sub-sections in order
          const subsectionFields = [
            { key: 'demandSupplyAnalysis', label: '4.1 Demand-Supply Analysis', altKeys: ['existingDemand', 'demandSupplyGap'] },
            { key: 'existingDemand', label: '4.1 Demand-Supply Analysis', isPartOf: 'demandSupplyAnalysis' },
            { key: 'demandSupplyGap', label: '4.1 Demand-Supply Analysis', isPartOf: 'demandSupplyAnalysis' },
            { key: 'competitionAnalysis', label: '4.2 Competition Analysis', altKeys: ['competitorAnalysis', 'competitors'] },
            { key: 'competitorAnalysis', label: '4.2 Competition Analysis', isPartOf: 'competitionAnalysis' },
            { key: 'priceTrends', label: '4.3 Price Trends', altKeys: ['priceTrend'] },
            { key: 'exportPotential', label: '4.4 Export Potential', altKeys: ['exportOpportunities'] },
            { key: 'targetMarket', label: '4.5 Target Market', altKeys: ['targetMarkets', 'markets'] }
          ];
          
          // Track which subsections we've already added
          const addedSubsections = new Set<string>();
          
          subsectionFields.forEach(({ key, label, altKeys, isPartOf }) => {
            if (isPartOf) return; // Skip if it's part of another subsection
            
            const value = stepData[key] || (altKeys && altKeys.find(altKey => stepData[altKey]) ? stepData[altKeys.find(altKey => stepData[altKey])!] : null);
            
            if (value && value !== null && value !== '') {
              const labelLower = label.toLowerCase();
              
              // Check if this subsection is already in the enhanced content
              const labelInContent = finalContent.toLowerCase().includes(labelLower.substring(0, 20));
              
              if (!labelInContent && !addedSubsections.has(label)) {
                addedSubsections.add(label);
                
                // For Demand-Supply Analysis, combine existingDemand and demandSupplyGap if both exist
                if (key === 'demandSupplyAnalysis' || label.includes('Demand-Supply')) {
                  let combinedContent = '';
                  if (stepData.existingDemand) {
                    combinedContent += `<p style="text-align: justify; margin-bottom: 0.3cm; line-height: 1.8; color: #1F2937;">${String(stepData.existingDemand).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
                  }
                  if (stepData.demandSupplyGap) {
                    combinedContent += `<p style="text-align: justify; margin-bottom: 0.3cm; line-height: 1.8; color: #1F2937;"><strong>Demand-Supply Gap:</strong> ${String(stepData.demandSupplyGap).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
                  }
                  if (combinedContent) {
                    marketSubsections += `<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">${label}</h4>`;
                    marketSubsections += combinedContent;
                  } else {
                    const valueStr = typeof value === 'number' ? value.toLocaleString('en-IN') : String(value);
                    marketSubsections += `<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">${label}</h4>`;
                    marketSubsections += `<p style="text-align: justify; margin-bottom: 0.5cm; line-height: 1.8; color: #1F2937;">${valueStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
                  }
                } else {
                  const valueStr = typeof value === 'number' ? value.toLocaleString('en-IN') : String(value);
                  marketSubsections += `<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">${label}</h4>`;
                  marketSubsections += `<p style="text-align: justify; margin-bottom: 0.5cm; line-height: 1.8; color: #1F2937;">${valueStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
                }
              }
            }
          });
          
          // Also handle individual fields that might not be in subsectionFields
          const individualFields = ['existingDemand', 'demandSupplyGap', 'competitorAnalysis', 'priceTrends', 'exportPotential', 'targetMarket'];
          individualFields.forEach(field => {
            if (stepData[field] && stepData[field] !== null && stepData[field] !== '' && !addedSubsections.has(field)) {
              const fieldLabel = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
              const labelLower = fieldLabel.toLowerCase();
              
              // Check if already in content
              if (!finalContent.toLowerCase().includes(labelLower.substring(0, 15))) {
                subsectionNum++;
                const valueStr = typeof stepData[field] === 'number' ? stepData[field].toLocaleString('en-IN') : String(stepData[field]);
                marketSubsections += `<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">4.${subsectionNum} ${fieldLabel}</h4>`;
                marketSubsections += `<p style="text-align: justify; margin-bottom: 0.5cm; line-height: 1.8; color: #1F2937;">${valueStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
              }
            }
          });
          
          // Append sub-sections AFTER enhanced content
          if (marketSubsections) {
            if (finalContent && finalContent.trim()) {
              console.log(`   ➕ Appending Market Aspects sub-sections (${marketSubsections.length} chars) AFTER enhanced content`);
              finalContent += '\n\n' + marketSubsections;
            } else {
              console.log(`   ✅ Using Market Aspects sub-sections as main content (${marketSubsections.length} chars)`);
              finalContent = marketSubsections;
            }
          }
        }
        
        // Gap Analysis - generate table if we have gap data
        if (placeholder === '{{GAP_ANALYSIS}}' && (s7.technologyGaps || s7.infrastructureGaps || s7.skillGaps || s7.marketingGaps || s7.financialGaps)) {
          let gapTable = '<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">Gap Analysis Summary</h4>';
          gapTable += '<table style="width: 100%; border-collapse: collapse; margin: 0.5cm 0; font-size: 10pt;">';
          gapTable += '<thead><tr style="background-color: #E5E7EB;"><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Area</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Existing Gap</th></tr></thead><tbody>';
          
          if (s7.technologyGaps) {
            gapTable += `<tr style="background-color: #FFFFFF;"><td style="border: 1px solid #1F2937; padding: 0.3cm;"><strong>Technology</strong></td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${String(s7.technologyGaps).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr>`;
          }
          if (s7.infrastructureGaps) {
            gapTable += `<tr style="background-color: #F9FAFB;"><td style="border: 1px solid #1F2937; padding: 0.3cm;"><strong>Infrastructure</strong></td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${String(s7.infrastructureGaps).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr>`;
          }
          if (s7.skillGaps) {
            gapTable += `<tr style="background-color: #FFFFFF;"><td style="border: 1px solid #1F2937; padding: 0.3cm;"><strong>Skill</strong></td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${String(s7.skillGaps).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr>`;
          }
          if (s7.marketingGaps) {
            gapTable += `<tr style="background-color: #F9FAFB;"><td style="border: 1px solid #1F2937; padding: 0.3cm;"><strong>Marketing</strong></td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${String(s7.marketingGaps).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr>`;
          }
          if (s7.financialGaps) {
            gapTable += `<tr style="background-color: #FFFFFF;"><td style="border: 1px solid #1F2937; padding: 0.3cm;"><strong>Finance</strong></td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${String(s7.financialGaps).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr>`;
          }
          gapTable += '</tbody></table>';
          
          // Append table to content if we have content, or use as main content
          if (finalContent && finalContent.trim()) {
            finalContent += gapTable;
          } else {
            finalContent = gapTable;
          }
        }
        
        // SPV Member Units - generate tables for shareholding and member units
        if (placeholder === '{{SPV_DETAILS}}' && s11) {
          let spvTables = '';
          
          // Shareholding Pattern Table
          if (s11.shareholdingPattern && Array.isArray(s11.shareholdingPattern) && s11.shareholdingPattern.length > 0) {
            spvTables += '<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">Shareholding Pattern</h4>';
            spvTables += '<table style="width: 100%; border-collapse: collapse; margin: 0.5cm 0; font-size: 10pt;">';
            spvTables += '<thead><tr style="background-color: #E5E7EB;"><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Stakeholder</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Percentage (%)</th></tr></thead><tbody>';
            
            s11.shareholdingPattern.forEach((share: any, idx: number) => {
              const bgColor = idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
              const stakeholder = share.stakeholder || share.name || 'N/A';
              const percentage = share.percentage || share.percent || '0';
              spvTables += `<tr style="background-color: ${bgColor};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">${String(stakeholder).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${percentage}%</td></tr>`;
            });
            spvTables += '</tbody></table>';
          } else if (s11.shareholdingPattern && typeof s11.shareholdingPattern === 'object') {
            // Handle object format shareholding
            spvTables += '<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">Shareholding Pattern</h4>';
            spvTables += '<table style="width: 100%; border-collapse: collapse; margin: 0.5cm 0; font-size: 10pt;">';
            spvTables += '<thead><tr style="background-color: #E5E7EB;"><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Stakeholder</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Percentage (%)</th></tr></thead><tbody>';
            
            let rowIdx = 0;
            Object.entries(s11.shareholdingPattern).forEach(([key, value]) => {
              const bgColor = rowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
              const stakeholder = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              const percentage = typeof value === 'number' ? value : (typeof value === 'string' ? parseFloat(value) || 0 : 0);
              spvTables += `<tr style="background-color: ${bgColor};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">${stakeholder}</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${percentage}%</td></tr>`;
              rowIdx++;
            });
            spvTables += '</tbody></table>';
          }
          
          // Member Units Table
          if (s11.memberUnits && Array.isArray(s11.memberUnits) && s11.memberUnits.length > 0) {
            spvTables += '<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">Member Units</h4>';
            spvTables += '<table style="width: 100%; border-collapse: collapse; margin: 0.5cm 0; font-size: 10pt;">';
            spvTables += '<thead><tr style="background-color: #E5E7EB;"><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Sl. No</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Unit Name</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Registration</th></tr></thead><tbody>';
            
            s11.memberUnits.forEach((unit: any, idx: number) => {
              const bgColor = idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
              const unitName = unit.name || unit.unitName || unit.unit || 'N/A';
              const registration = unit.registration || unit.udyamRegistration || unit.registrationNumber || 'N/A';
              spvTables += `<tr style="background-color: ${bgColor};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">${idx + 1}</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${String(unitName).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${String(registration).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr>`;
            });
            spvTables += '</tbody></table>';
          }
          
          // Board of Directors Table
          if (s11.boardOfDirectors && Array.isArray(s11.boardOfDirectors) && s11.boardOfDirectors.length > 0) {
            spvTables += '<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">Board of Directors</h4>';
            spvTables += '<table style="width: 100%; border-collapse: collapse; margin: 0.5cm 0; font-size: 10pt;">';
            spvTables += '<thead><tr style="background-color: #E5E7EB;"><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Name</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Designation</th></tr></thead><tbody>';
            
            s11.boardOfDirectors.forEach((director: any, idx: number) => {
              const bgColor = idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
              const name = director.name || 'N/A';
              const designation = director.designation || director.role || 'N/A';
              spvTables += `<tr style="background-color: ${bgColor};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">${String(name).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${String(designation).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr>`;
            });
            spvTables += '</tbody></table>';
          }
          
          if (spvTables) {
            if (finalContent && finalContent.trim()) {
              finalContent += spvTables;
            } else {
              finalContent = spvTables;
            }
          }
        }
        
        // Project Cost - generate tables for cost breakdown and means of finance
        if (placeholder === '{{PROJECT_COST}}' && s12) {
          let costTables = '';
          
          // Cost of Project Table
          if (s12.land || s12.building || s12.machinery || s12.utilities || s12.preliminary || s12.workingCapital) {
            costTables += '<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">Cost of Project</h4>';
            costTables += '<table style="width: 100%; border-collapse: collapse; margin: 0.5cm 0; font-size: 10pt;">';
            costTables += '<thead><tr style="background-color: #E5E7EB;"><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Particulars</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Amount (₹)</th></tr></thead><tbody>';
            
            let rowIdx = 0;
            if (s12.land) {
              costTables += `<tr style="background-color: ${rowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Land</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${typeof s12.land === 'number' ? s12.land.toLocaleString('en-IN') : s12.land}</td></tr>`;
              rowIdx++;
            }
            if (s12.building) {
              costTables += `<tr style="background-color: ${rowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Building</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${typeof s12.building === 'number' ? s12.building.toLocaleString('en-IN') : s12.building}</td></tr>`;
              rowIdx++;
            }
            if (s12.machinery) {
              costTables += `<tr style="background-color: ${rowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Machinery</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${typeof s12.machinery === 'number' ? s12.machinery.toLocaleString('en-IN') : s12.machinery}</td></tr>`;
              rowIdx++;
            }
            if (s12.utilities) {
              costTables += `<tr style="background-color: ${rowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Utilities & Infrastructure</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${typeof s12.utilities === 'number' ? s12.utilities.toLocaleString('en-IN') : s12.utilities}</td></tr>`;
              rowIdx++;
            }
            if (s12.preliminary) {
              costTables += `<tr style="background-color: ${rowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Preliminary & Pre-operative</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${typeof s12.preliminary === 'number' ? s12.preliminary.toLocaleString('en-IN') : s12.preliminary}</td></tr>`;
              rowIdx++;
            }
            if (s12.workingCapital) {
              costTables += `<tr style="background-color: ${rowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Working Capital Margin</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${typeof s12.workingCapital === 'number' ? s12.workingCapital.toLocaleString('en-IN') : s12.workingCapital}</td></tr>`;
              rowIdx++;
            }
            
            // Calculate and add total
            const total = (s12.land || 0) + (s12.building || 0) + (s12.machinery || 0) + (s12.utilities || 0) + (s12.preliminary || 0) + (s12.workingCapital || 0);
            if (total > 0) {
              costTables += `<tr style="background-color: #E5E7EB; font-weight: bold;"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Total</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${total.toLocaleString('en-IN')}</td></tr>`;
            }
            costTables += '</tbody></table>';
          }
          
          // Means of Finance Table
          if (s12.meansOfFinance) {
            const mof = s12.meansOfFinance;
            if (mof.spvContribution || mof.governmentGrant || mof.bankLoan || mof.otherSources) {
              costTables += '<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">Means of Finance</h4>';
              costTables += '<table style="width: 100%; border-collapse: collapse; margin: 0.5cm 0; font-size: 10pt;">';
              costTables += '<thead><tr style="background-color: #E5E7EB;"><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Source</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Amount (₹)</th></tr></thead><tbody>';
              
              let mofRowIdx = 0;
              if (mof.spvContribution) {
                costTables += `<tr style="background-color: ${mofRowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">SPV Contribution</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${typeof mof.spvContribution === 'number' ? mof.spvContribution.toLocaleString('en-IN') : mof.spvContribution}</td></tr>`;
                mofRowIdx++;
              }
              if (mof.governmentGrant) {
                costTables += `<tr style="background-color: ${mofRowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Government Grant</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${typeof mof.governmentGrant === 'number' ? mof.governmentGrant.toLocaleString('en-IN') : mof.governmentGrant}</td></tr>`;
                mofRowIdx++;
              }
              if (mof.bankLoan) {
                costTables += `<tr style="background-color: ${mofRowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Bank Loan</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${typeof mof.bankLoan === 'number' ? mof.bankLoan.toLocaleString('en-IN') : mof.bankLoan}</td></tr>`;
                mofRowIdx++;
              }
              if (mof.otherSources) {
                costTables += `<tr style="background-color: ${mofRowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Other Sources</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${typeof mof.otherSources === 'number' ? mof.otherSources.toLocaleString('en-IN') : mof.otherSources}</td></tr>`;
                mofRowIdx++;
              }
              
              const mofTotal = (mof.spvContribution || 0) + (mof.governmentGrant || 0) + (mof.bankLoan || 0) + (mof.otherSources || 0);
              if (mofTotal > 0) {
                costTables += `<tr style="background-color: #E5E7EB; font-weight: bold;"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Total</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${mofTotal.toLocaleString('en-IN')}</td></tr>`;
              }
              costTables += '</tbody></table>';
            }
          }
          
          if (costTables) {
            if (finalContent && finalContent.trim()) {
              finalContent += costTables;
            } else {
              finalContent = costTables;
            }
          }
        }
        
        // Financial Viability - generate tables for projections
        if (placeholder === '{{FINANCIAL_VIABILITY}}' && s15) {
          let viabilityTables = '';
          
          // Profit & Loss Projections Table
          if (s15.profitAndLossProjections && Array.isArray(s15.profitAndLossProjections) && s15.profitAndLossProjections.length > 0) {
            viabilityTables += '<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">Profit & Loss Projections</h4>';
            viabilityTables += '<table style="width: 100%; border-collapse: collapse; margin: 0.5cm 0; font-size: 10pt;">';
            viabilityTables += '<thead><tr style="background-color: #E5E7EB;"><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Year</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Revenue (₹)</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Cost (₹)</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Profit (₹)</th></tr></thead><tbody>';
            
            s15.profitAndLossProjections.forEach((proj: any, idx: number) => {
              const bgColor = idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
              const revenue = typeof proj.revenue === 'number' ? proj.revenue.toLocaleString('en-IN') : (proj.revenue || '0');
              const cost = typeof proj.cost === 'number' ? proj.cost.toLocaleString('en-IN') : (proj.cost || '0');
              const profit = typeof proj.profit === 'number' ? proj.profit.toLocaleString('en-IN') : (proj.profit || '0');
              viabilityTables += `<tr style="background-color: ${bgColor};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Year ${idx + 1}</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${revenue}</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${cost}</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${profit}</td></tr>`;
            });
            viabilityTables += '</tbody></table>';
          }
          
          // Financial Indicators Table
          if (s15.breakEvenPoint || s15.irr || s15.npv) {
            viabilityTables += '<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">Financial Indicators</h4>';
            viabilityTables += '<table style="width: 100%; border-collapse: collapse; margin: 0.5cm 0; font-size: 10pt;">';
            viabilityTables += '<thead><tr style="background-color: #E5E7EB;"><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Indicator</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Value</th></tr></thead><tbody>';
            
            if (s15.breakEvenPoint) {
              viabilityTables += `<tr style="background-color: #FFFFFF;"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Break Even Point</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${s15.breakEvenPoint} years</td></tr>`;
            }
            if (s15.irr) {
              viabilityTables += `<tr style="background-color: #F9FAFB;"><td style="border: 1px solid #1F2937; padding: 0.3cm;">IRR</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${s15.irr}%</td></tr>`;
            }
            if (s15.npv) {
              viabilityTables += `<tr style="background-color: #FFFFFF;"><td style="border: 1px solid #1F2937; padding: 0.3cm;">NPV</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${typeof s15.npv === 'number' ? s15.npv.toLocaleString('en-IN') : s15.npv}</td></tr>`;
            }
            viabilityTables += '</tbody></table>';
          }
          
          if (viabilityTables) {
            if (finalContent && finalContent.trim()) {
              finalContent += viabilityTables;
            } else {
              finalContent = viabilityTables;
            }
          }
        }
        
        // Implementation Schedule - generate table if we have schedule data
        if (placeholder === '{{IMPLEMENTATION_SCHEDULE}}' && s16) {
          let scheduleTable = '';
          
          if (s16.milestones && Array.isArray(s16.milestones) && s16.milestones.length > 0) {
            scheduleTable += '<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">Implementation Schedule</h4>';
            scheduleTable += '<table style="width: 100%; border-collapse: collapse; margin: 0.5cm 0; font-size: 10pt;">';
            scheduleTable += '<thead><tr style="background-color: #E5E7EB;"><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Activity</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Time Required</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Start Date</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">End Date</th></tr></thead><tbody>';
            
            s16.milestones.forEach((milestone: any, idx: number) => {
              const bgColor = idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
              const activity = milestone.activity || milestone.name || milestone.task || 'N/A';
              const timeRequired = milestone.timeRequired || milestone.duration || 'N/A';
              const startDate = milestone.startDate || milestone.start || 'N/A';
              const endDate = milestone.endDate || milestone.end || 'N/A';
              scheduleTable += `<tr style="background-color: ${bgColor};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">${String(activity).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${String(timeRequired).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${String(startDate).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${String(endDate).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr>`;
            });
            scheduleTable += '</tbody></table>';
            
            if (finalContent && finalContent.trim()) {
              finalContent += scheduleTable;
            } else {
              finalContent = scheduleTable;
            }
          }
        }
        
        // Operating Cost & Revenue - generate tables
        if (placeholder === '{{OPERATING_COST_REVENUE}}' && s14) {
          let operatingTables = '';
          
          // Operating Costs Table
          if (s14.rawMaterialCost || s14.powerCost || s14.wages || s14.administrativeExpenses || s14.marketingExpenses) {
            operatingTables += '<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">Operating Costs</h4>';
            operatingTables += '<table style="width: 100%; border-collapse: collapse; margin: 0.5cm 0; font-size: 10pt;">';
            operatingTables += '<thead><tr style="background-color: #E5E7EB;"><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Cost Component</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Amount (₹)</th></tr></thead><tbody>';
            
            let opRowIdx = 0;
            if (s14.rawMaterialCost) {
              operatingTables += `<tr style="background-color: ${opRowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Raw Material Cost</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${typeof s14.rawMaterialCost === 'number' ? s14.rawMaterialCost.toLocaleString('en-IN') : s14.rawMaterialCost}</td></tr>`;
              opRowIdx++;
            }
            if (s14.powerCost) {
              operatingTables += `<tr style="background-color: ${opRowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Power Cost</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${typeof s14.powerCost === 'number' ? s14.powerCost.toLocaleString('en-IN') : s14.powerCost}</td></tr>`;
              opRowIdx++;
            }
            if (s14.wages) {
              operatingTables += `<tr style="background-color: ${opRowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Wages</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${typeof s14.wages === 'number' ? s14.wages.toLocaleString('en-IN') : s14.wages}</td></tr>`;
              opRowIdx++;
            }
            if (s14.administrativeExpenses) {
              operatingTables += `<tr style="background-color: ${opRowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Administrative Expenses</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${typeof s14.administrativeExpenses === 'number' ? s14.administrativeExpenses.toLocaleString('en-IN') : s14.administrativeExpenses}</td></tr>`;
              opRowIdx++;
            }
            if (s14.marketingExpenses) {
              operatingTables += `<tr style="background-color: ${opRowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Marketing Expenses</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${typeof s14.marketingExpenses === 'number' ? s14.marketingExpenses.toLocaleString('en-IN') : s14.marketingExpenses}</td></tr>`;
              opRowIdx++;
            }
            
            const totalOpCost = (s14.rawMaterialCost || 0) + (s14.powerCost || 0) + (s14.wages || 0) + (s14.administrativeExpenses || 0) + (s14.marketingExpenses || 0);
            if (totalOpCost > 0) {
              operatingTables += `<tr style="background-color: #E5E7EB; font-weight: bold;"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Total Operating Cost</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${totalOpCost.toLocaleString('en-IN')}</td></tr>`;
            }
            operatingTables += '</tbody></table>';
          }
          
          // Revenue Projections Table
          if (s14.annualProductionVolume || s14.annualSalesRealization) {
            operatingTables += '<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">Revenue Projections</h4>';
            operatingTables += '<table style="width: 100%; border-collapse: collapse; margin: 0.5cm 0; font-size: 10pt;">';
            operatingTables += '<thead><tr style="background-color: #E5E7EB;"><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Parameter</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Value</th></tr></thead><tbody>';
            
            if (s14.annualProductionVolume) {
              operatingTables += `<tr style="background-color: #FFFFFF;"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Annual Production Volume</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${typeof s14.annualProductionVolume === 'number' ? s14.annualProductionVolume.toLocaleString('en-IN') : s14.annualProductionVolume} ${s14.productionUnit || 'units'}</td></tr>`;
            }
            if (s14.annualSalesRealization) {
              operatingTables += `<tr style="background-color: #F9FAFB;"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Annual Sales Realization</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${typeof s14.annualSalesRealization === 'number' ? s14.annualSalesRealization.toLocaleString('en-IN') : s14.annualSalesRealization}</td></tr>`;
            }
            operatingTables += '</tbody></table>';
          }
          
          if (operatingTables) {
            if (finalContent && finalContent.trim()) {
              finalContent += operatingTables;
            } else {
              finalContent = operatingTables;
            }
          }
        }
        
        // Expected Impact - ensure all impact data is included
        if (placeholder === '{{EXPECTED_IMPACT}}' && s17) {
          let impactContent = '';
          
          // Generate impact metrics if available
          if (s17.employmentGeneration || s17.incomeIncrease || s17.exportGrowth || s17.otherImpacts) {
            impactContent += '<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">Expected Impact Metrics</h4>';
            impactContent += '<ul style="list-style-type: disc; padding-left: 1.5cm; margin-bottom: 0.5cm; color: #1F2937;">';
            
            if (s17.employmentGeneration) {
              impactContent += `<li style="margin-bottom: 0.3cm; line-height: 1.8;"><strong>Employment Generation:</strong> ${String(s17.employmentGeneration).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`;
            }
            if (s17.incomeIncrease) {
              impactContent += `<li style="margin-bottom: 0.3cm; line-height: 1.8;"><strong>Income Increase:</strong> ${String(s17.incomeIncrease).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`;
            }
            if (s17.exportGrowth) {
              impactContent += `<li style="margin-bottom: 0.3cm; line-height: 1.8;"><strong>Export Growth:</strong> ${String(s17.exportGrowth).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`;
            }
            if (s17.otherImpacts && Array.isArray(s17.otherImpacts)) {
              s17.otherImpacts.forEach((impact: any) => {
                impactContent += `<li style="margin-bottom: 0.3cm; line-height: 1.8;">${String(impact).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`;
              });
            }
            impactContent += '</ul>';
            
            if (finalContent && finalContent.trim()) {
              finalContent += impactContent;
            } else {
              finalContent = impactContent;
            }
          }
        }
      }
      
      // Check if template already has page structure (new template format)
      const hasPageStructure = html.includes(`<div class="page">`) && 
                               html.includes(`<div class="content">`) &&
                               html.includes(`${placeholder}`);
      
      let sectionHTML = '';
      
      if (finalContent && finalContent.trim()) {
        // Get section key for enhanced content lookup
        const sectionKey = placeholder.replace(/[{}]/g, '').toLowerCase().replace(/_/g, '');
        
        // Check if content is already HTML (from generateSectionFromData or contains tables)
        const isAlreadyHTML = /<[a-z][\s\S]*>/i.test(finalContent);
        const hasTables = /<table[\s\S]*?<\/table>/i.test(finalContent);
        let formattedContent: string;
        
        if (isAlreadyHTML || hasTables) {
          // Content is already HTML - don't process through formatContent to avoid double-escaping
          // Just ensure it's clean and preserve tables
          formattedContent = finalContent
            .replace(/&amp;amp;/g, '&amp;')
            .replace(/&amp;lt;/g, '&lt;')
            .replace(/&amp;gt;/g, '&gt;');
          
          // If we have enhanced content that wasn't included, try to append it
          const enhancedContent = contentLang.enhancedContent?.[sectionKey] || 
                                dpr.metadata?.enhancedContent?.[sectionKey] ||
                                '';
          if (enhancedContent && enhancedContent.trim() && !formattedContent.includes(enhancedContent.substring(0, 100))) {
            // Enhanced content not yet included, append it
            const enhancedFormatted = formatContent(enhancedContent, sectionKey);
            formattedContent += '\n' + enhancedFormatted;
          }
        } else {
          // Plain text - format it properly (this will also check for enhanced content)
          formattedContent = formatContent(finalContent, sectionKey);
        }
        
        if (hasPageStructure) {
          // Template already has page structure, just replace the placeholder with content
          sectionHTML = formattedContent;
          console.log(`   ✅ Section content replaced (template has page structure)`);
        } else {
          // Old template format - create full page structure
          sectionHTML = `<div class="page">
            <div class="page-content">
              <div class="section-title-box">
                <div class="section-title-box-inner">
                  <h2>${header}</h2>
                </div>
              </div>
              <div class="content">${formattedContent}</div>
            </div>
          </div>`;
          console.log(`   ✅ Section included with formatted content (full page structure)`);
        }
      } else {
        // Include section even with minimal content - generate from stepData if available
        let placeholderContent = '<p style="text-align: justify; margin-bottom: 0.5cm; line-height: 1.8; color: #1F2937;">This section contains cluster development information. Detailed content will be populated from cluster data.</p>';
        
        // Try one more time to get content from stepData
        if (stepData && Object.keys(stepData).length > 0) {
          const generatedContent = generateSectionFromData(stepData, header);
          if (generatedContent && generatedContent.trim()) {
            // Generated content is already HTML, use it directly
            placeholderContent = generatedContent;
            console.log(`   ✅ Section included with generated content from stepData`);
          } else {
            console.log(`   ⚠️  Section included with placeholder (no data available)`);
          }
        } else {
          console.log(`   ⚠️  Section included with placeholder (no stepData)`);
        }
        
        if (hasPageStructure) {
          // Template already has page structure, just replace the placeholder with content
          sectionHTML = placeholderContent;
          console.log(`   ✅ Section placeholder replaced (template has page structure)`);
        } else {
          // Old template format - create full page structure
          sectionHTML = `<div class="page">
            <div class="page-content">
              <div class="section-title-box">
                <div class="section-title-box-inner">
                  <h2>${header}</h2>
                </div>
              </div>
              <div class="content">${placeholderContent}</div>
            </div>
          </div>`;
          console.log(`   ✅ Section included with placeholder (full page structure)`);
        }
      }
      
      html = html.replace(placeholder, sectionHTML);
      console.log(`   ✅ Section replaced in HTML`);
    };
    
    console.log('\n📝 Replacing all section placeholders...');
    
    // Introduction - MUST use replaceSection to ensure stepData is included
    // This processes Introduction with step2 data to include all sub-sections (1.1, 1.2, 1.3, 1.4, etc.)
    const introContent = contentLang.introduction || contentLang.businessProfile || sections.introduction || '';
    console.log(`📋 Introduction - contentLang.introduction: ${!!contentLang.introduction}, contentLang.businessProfile: ${!!contentLang.businessProfile}, sections.introduction: ${!!sections.introduction}, step2: ${Object.keys(s2).length > 0}`);
    if (Object.keys(s2).length > 0) {
      console.log(`   Step2 keys: ${Object.keys(s2).join(', ')}`);
    }
    replaceSection('{{INTRODUCTION}}', introContent, '1. INTRODUCTION', s2);
    
    // District Profile
    const districtProfileContent = contentLang.districtProfile || sections.districtProfile || '';
    console.log(`📋 District Profile - contentLang: ${!!contentLang.districtProfile}, sections: ${!!sections.districtProfile}, step3: ${Object.keys(s3).length > 0}`);
    replaceSection('{{DISTRICT_PROFILE}}', districtProfileContent, sectionHeaders['{{DISTRICT_PROFILE}}'], s3);
    
    // Cluster Profile
    const clusterProfileContent = contentLang.clusterProfile || sections.clusterProfile || '';
    console.log(`📋 Cluster Profile - contentLang: ${!!contentLang.clusterProfile}, sections: ${!!sections.clusterProfile}, step4: ${Object.keys(s4).length > 0}`);
    replaceSection('{{CLUSTER_PROFILE}}', clusterProfileContent, sectionHeaders['{{CLUSTER_PROFILE}}'], s4);
    
    // Handle Cluster Photos images
    const clusterUnitImage = s4.clusterUnitImage || s4.sampleClusterUnitImage || contentLang.images?.clusterUnit || '';
    const productionProcessImage = s4.productionProcessImage || s4.productionProcessImage || contentLang.images?.productionProcess || '';
    
    // Process cluster unit image
    let clusterUnitImageHTML = '';
    if (clusterUnitImage && (clusterUnitImage.startsWith('http') || clusterUnitImage.startsWith('data:'))) {
      clusterUnitImageHTML = `<img src="${clusterUnitImage}" alt="Sample cluster unit" style="max-width: 100%; max-height: 3cm; object-fit: contain; display: block; margin: 0 auto;" />`;
    } else if (clusterUnitImage) {
      // Try to load from file system
      try {
        const imagePath = path.join(process.cwd(), clusterUnitImage.replace(/^\//, ''));
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);
          const imageBase64 = imageBuffer.toString('base64');
          const imageExt = path.extname(imagePath).toLowerCase().slice(1);
          const mimeType = imageExt === 'png' ? 'image/png' : imageExt === 'jpg' || imageExt === 'jpeg' ? 'image/jpeg' : 'image/webp';
          clusterUnitImageHTML = `<img src="data:${mimeType};base64,${imageBase64}" alt="Sample cluster unit" style="max-width: 100%; max-height: 3cm; object-fit: contain; display: block; margin: 0 auto;" />`;
        }
      } catch (error) {
        console.warn('Failed to read cluster unit image:', error);
      }
    }
    if (!clusterUnitImageHTML) {
      // Create placeholder with icon and text
      clusterUnitImageHTML = `
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: 0.5; margin-bottom: 0.3cm;">
          <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="#9CA3AF"/>
        </svg>
        <div style="color: #9CA3AF; font-size: 10pt; margin-top: 0.2cm;">No image</div>
      `;
    }
    html = html.replace('{{CLUSTER_UNIT_IMAGE}}', clusterUnitImageHTML);
    
    // Process production process image
    let productionProcessImageHTML = '';
    if (productionProcessImage && (productionProcessImage.startsWith('http') || productionProcessImage.startsWith('data:'))) {
      productionProcessImageHTML = `<img src="${productionProcessImage}" alt="Production process" style="max-width: 100%; max-height: 3cm; object-fit: contain; display: block; margin: 0 auto;" />`;
    } else if (productionProcessImage) {
      // Try to load from file system
      try {
        const imagePath = path.join(process.cwd(), productionProcessImage.replace(/^\//, ''));
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);
          const imageBase64 = imageBuffer.toString('base64');
          const imageExt = path.extname(imagePath).toLowerCase().slice(1);
          const mimeType = imageExt === 'png' ? 'image/png' : imageExt === 'jpg' || imageExt === 'jpeg' ? 'image/jpeg' : 'image/webp';
          productionProcessImageHTML = `<img src="data:${mimeType};base64,${imageBase64}" alt="Production process" style="max-width: 100%; max-height: 3cm; object-fit: contain; display: block; margin: 0 auto;" />`;
        }
      } catch (error) {
        console.warn('Failed to read production process image:', error);
      }
    }
    if (!productionProcessImageHTML) {
      // Create placeholder with icon and text
      productionProcessImageHTML = `
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: 0.5; margin-bottom: 0.3cm;">
          <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="#9CA3AF"/>
        </svg>
        <div style="color: #9CA3AF; font-size: 10pt; margin-top: 0.2cm;">No image</div>
      `;
    }
    html = html.replace('{{PRODUCTION_PROCESS_IMAGE}}', productionProcessImageHTML);
    
    // Value Chain
    const valueChainContent = contentLang.valueChain || sections.valueChain || '';
    console.log(`📋 Value Chain - contentLang: ${!!contentLang.valueChain}, sections: ${!!sections.valueChain}, step5: ${Object.keys(s5).length > 0}`);
    replaceSection('{{VALUE_CHAIN}}', valueChainContent, sectionHeaders['{{VALUE_CHAIN}}'], s5);
    
    // Handle Value Chain Flow Diagram image
    const valueChainDiagram = s5.valueChainDiagram || s5.valueChainFlowDiagram || s5.flowDiagram || contentLang.images?.valueChainDiagram || '';
    
    // Process value chain diagram image
    let valueChainDiagramHTML = '';
    if (valueChainDiagram && (valueChainDiagram.startsWith('http') || valueChainDiagram.startsWith('data:'))) {
      valueChainDiagramHTML = `<img src="${valueChainDiagram}" alt="Value Chain Flow Diagram" style="max-width: 100%; max-height: 4cm; object-fit: contain; display: block; margin: 0 auto;" />`;
    } else if (valueChainDiagram) {
      // Try to load from file system
      try {
        const imagePath = path.join(process.cwd(), valueChainDiagram.replace(/^\//, ''));
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);
          const imageBase64 = imageBuffer.toString('base64');
          const imageExt = path.extname(imagePath).toLowerCase().slice(1);
          const mimeType = imageExt === 'png' ? 'image/png' : imageExt === 'jpg' || imageExt === 'jpeg' ? 'image/jpeg' : 'image/webp';
          valueChainDiagramHTML = `<img src="data:${mimeType};base64,${imageBase64}" alt="Value Chain Flow Diagram" style="max-width: 100%; max-height: 4cm; object-fit: contain; display: block; margin: 0 auto;" />`;
        }
      } catch (error) {
        console.warn('Failed to read value chain diagram image:', error);
      }
    }
    if (!valueChainDiagramHTML) {
      // Create placeholder with icon and text
      valueChainDiagramHTML = `
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: 0.5; margin-bottom: 0.3cm;">
          <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="#3B82F6"/>
        </svg>
        <div style="color: #6B7280; font-size: 10pt; margin-top: 0.2cm;">No image</div>
      `;
    }
    html = html.replace('{{VALUE_CHAIN_DIAGRAM}}', valueChainDiagramHTML);
    
    // Market Aspects
    const marketAspectsContent = contentLang.marketAnalysis || sections.marketAssessment || '';
    console.log(`📋 Market Aspects - contentLang.marketAnalysis: ${!!contentLang.marketAnalysis}, sections.marketAssessment: ${!!sections.marketAssessment}, step6: ${Object.keys(s6).length > 0}`);
    replaceSection('{{MARKET_ASPECTS}}', marketAspectsContent, sectionHeaders['{{MARKET_ASPECTS}}'], s6);
    
    // SWOT Analysis
    const swotContent = contentLang.swotAnalysis || sections.swotAnalysis || '';
    console.log(`📋 SWOT Analysis - contentLang: ${!!contentLang.swotAnalysis}, sections: ${!!sections.swotAnalysis}, step8: ${Object.keys(s8).length > 0}`);
    replaceSection('{{SWOT_ANALYSIS}}', swotContent, sectionHeaders['{{SWOT_ANALYSIS}}'], s8);
    
    // Gap Analysis
    const gapAnalysisContent = contentLang.gapAnalysis || sections.gapAnalysis || '';
    console.log(`📋 Gap Analysis - contentLang: ${!!contentLang.gapAnalysis}, sections: ${!!sections.gapAnalysis}, step7: ${Object.keys(s7).length > 0}`);
    replaceSection('{{GAP_ANALYSIS}}', gapAnalysisContent, sectionHeaders['{{GAP_ANALYSIS}}'], s7);
    
    // CFC Details
    const cfcContent = contentLang.cfcDetails || sections.cfcDetails || contentLang.technicalFeasibility || '';
    console.log(`📋 CFC Details - contentLang.cfcDetails: ${!!contentLang.cfcDetails}, contentLang.technicalFeasibility: ${!!contentLang.technicalFeasibility}, sections: ${!!sections.cfcDetails}, step10: ${Object.keys(s10).length > 0}`);
    replaceSection('{{CFC_DETAILS}}', cfcContent, sectionHeaders['{{CFC_DETAILS}}'], s10);
    
    // SPV Details
    const spvContent = contentLang.spvDetails || sections.spvDetails || '';
    console.log(`📋 SPV Details - contentLang: ${!!contentLang.spvDetails}, sections: ${!!sections.spvDetails}, step11: ${Object.keys(s11).length > 0}`);
    replaceSection('{{SPV_DETAILS}}', spvContent, sectionHeaders['{{SPV_DETAILS}}'], s11);
    
    // Project Cost
    const projectCostContent = contentLang.projectCost || sections.projectCost || '';
    console.log(`📋 Project Cost - contentLang: ${!!contentLang.projectCost}, sections: ${!!sections.projectCost}, step12: ${Object.keys(s12).length > 0}`);
    replaceSection('{{PROJECT_COST}}', projectCostContent, sectionHeaders['{{PROJECT_COST}}'], s12);
    
    // Operating Cost & Revenue
    const operatingCostContent = contentLang.operatingCostRevenue || sections.operatingCostRevenue || '';
    console.log(`📋 Operating Cost & Revenue - contentLang: ${!!contentLang.operatingCostRevenue}, sections: ${!!sections.operatingCostRevenue}, step14: ${Object.keys(s14).length > 0}`);
    replaceSection('{{OPERATING_COST_REVENUE}}', operatingCostContent, sectionHeaders['{{OPERATING_COST_REVENUE}}'], s14);
    
    // Financial Viability
    const financialViabilityContent = contentLang.financialProjections || sections.financialViability || '';
    console.log(`📋 Financial Viability - contentLang.financialProjections: ${!!contentLang.financialProjections}, sections.financialViability: ${!!sections.financialViability}, step15: ${Object.keys(s15).length > 0}`);
    replaceSection('{{FINANCIAL_VIABILITY}}', financialViabilityContent, sectionHeaders['{{FINANCIAL_VIABILITY}}'], s15);
    
    // Implementation Schedule
    const implementationContent = contentLang.implementationSchedule || sections.implementationSchedule || '';
    console.log(`📋 Implementation Schedule - contentLang: ${!!contentLang.implementationSchedule}, sections: ${!!sections.implementationSchedule}, step16: ${Object.keys(s16).length > 0}`);
    replaceSection('{{IMPLEMENTATION_SCHEDULE}}', implementationContent, sectionHeaders['{{IMPLEMENTATION_SCHEDULE}}'], s16);
    
    // Expected Impact - check multiple sources
    const expectedImpactContent = contentLang.expectedImpact || contentLang.conclusion || sections.expectedImpact || '';
    console.log(`📋 Expected Impact - contentLang.expectedImpact: ${!!contentLang.expectedImpact}, contentLang.conclusion: ${!!contentLang.conclusion}, sections: ${!!sections.expectedImpact}, step17: ${Object.keys(s17).length > 0}`);
    replaceSection('{{EXPECTED_IMPACT}}', expectedImpactContent, sectionHeaders['{{EXPECTED_IMPACT}}'], s17);
    
    // Conclusion - separate from expected impact
    const conclusionContent = contentLang.conclusion && !expectedImpactContent ? contentLang.conclusion : 
                             (contentLang.conclusion && expectedImpactContent ? '' : contentLang.conclusion || '');
    console.log(`📋 Conclusion - contentLang.conclusion: ${!!contentLang.conclusion}, will include: ${!!conclusionContent}`);
    replaceSection('{{CONCLUSION}}', conclusionContent, sectionHeaders['{{CONCLUSION}}']);
    
    // Proposed Intervention - Section 7 (BEFORE CFC Details)
    const proposedIntervention = contentLang.proposedIntervention || contentLang.proposedInterventions || sections.proposedIntervention || s9.interventionType || '';
    console.log(`📋 Proposed Intervention - contentLang.proposedIntervention: ${!!contentLang.proposedIntervention}, contentLang.proposedInterventions: ${!!contentLang.proposedInterventions}, sections: ${!!sections.proposedIntervention}, step9: ${Object.keys(s9).length > 0}`);
    replaceSection('{{PROPOSED_INTERVENTION}}', proposedIntervention, sectionHeaders['{{PROPOSED_INTERVENTION}}'], s9);
    
    console.log('\n✅ All sections processed');
    
    // Generate Financial Statements section - ENSURE ALL DATA IS INCLUDED
    const generateFinancialStatements = (): string => {
      let statementsHTML = '';
      
      // Cost of Project & Means of Finance - Include ALL cost components
      if (s12.land || s12.building || s12.machinery || s12.utilities || s12.preliminary || s12.workingCapital) {
        statementsHTML += '<h3 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 14pt;">1. Cost of Project & Means of Finance</h3>';
        statementsHTML += '<table style="width: 100%; border-collapse: collapse; margin: 0.5cm 0; font-size: 10pt;">';
        statementsHTML += '<thead><tr style="background-color: #E5E7EB;"><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Particulars</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Amount (₹)</th></tr></thead>';
        statementsHTML += '<tbody>';
        let rowIdx = 0;
        if (s12.land) {
          statementsHTML += `<tr style="background-color: ${rowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Land</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${typeof s12.land === 'number' ? s12.land.toLocaleString('en-IN') : s12.land}</td></tr>`;
          rowIdx++;
        }
        if (s12.building) {
          statementsHTML += `<tr style="background-color: ${rowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Building</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${typeof s12.building === 'number' ? s12.building.toLocaleString('en-IN') : s12.building}</td></tr>`;
          rowIdx++;
        }
        if (s12.machinery) {
          statementsHTML += `<tr style="background-color: ${rowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Machinery</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${typeof s12.machinery === 'number' ? s12.machinery.toLocaleString('en-IN') : s12.machinery}</td></tr>`;
          rowIdx++;
        }
        if (s12.utilities) {
          statementsHTML += `<tr style="background-color: ${rowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Utilities & Infrastructure</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${typeof s12.utilities === 'number' ? s12.utilities.toLocaleString('en-IN') : s12.utilities}</td></tr>`;
          rowIdx++;
        }
        if (s12.preliminary) {
          statementsHTML += `<tr style="background-color: ${rowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Preliminary & Pre-operative</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${typeof s12.preliminary === 'number' ? s12.preliminary.toLocaleString('en-IN') : s12.preliminary}</td></tr>`;
          rowIdx++;
        }
        if (s12.workingCapital) {
          statementsHTML += `<tr style="background-color: ${rowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Working Capital Margin</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${typeof s12.workingCapital === 'number' ? s12.workingCapital.toLocaleString('en-IN') : s12.workingCapital}</td></tr>`;
          rowIdx++;
        }
        
        // Add total
        const total = (s12.land || 0) + (s12.building || 0) + (s12.machinery || 0) + (s12.utilities || 0) + (s12.preliminary || 0) + (s12.workingCapital || 0);
        if (total > 0) {
          statementsHTML += `<tr style="background-color: #E5E7EB; font-weight: bold;"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Total</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${total.toLocaleString('en-IN')}</td></tr>`;
        }
        statementsHTML += '</tbody></table>';
        
        // Means of Finance Table
        if (s12.meansOfFinance) {
          const mof = s12.meansOfFinance;
          if (mof.spvContribution || mof.governmentGrant || mof.bankLoan || mof.otherSources) {
            statementsHTML += '<h4 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 12pt;">Means of Finance</h4>';
            statementsHTML += '<table style="width: 100%; border-collapse: collapse; margin: 0.5cm 0; font-size: 10pt;">';
            statementsHTML += '<thead><tr style="background-color: #E5E7EB;"><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Source</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Amount (₹)</th></tr></thead><tbody>';
            
            let mofRowIdx = 0;
            if (mof.spvContribution) {
              statementsHTML += `<tr style="background-color: ${mofRowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">SPV Contribution</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${typeof mof.spvContribution === 'number' ? mof.spvContribution.toLocaleString('en-IN') : mof.spvContribution}</td></tr>`;
              mofRowIdx++;
            }
            if (mof.governmentGrant) {
              statementsHTML += `<tr style="background-color: ${mofRowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Government Grant</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${typeof mof.governmentGrant === 'number' ? mof.governmentGrant.toLocaleString('en-IN') : mof.governmentGrant}</td></tr>`;
              mofRowIdx++;
            }
            if (mof.bankLoan) {
              statementsHTML += `<tr style="background-color: ${mofRowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Bank Loan</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${typeof mof.bankLoan === 'number' ? mof.bankLoan.toLocaleString('en-IN') : mof.bankLoan}</td></tr>`;
              mofRowIdx++;
            }
            if (mof.otherSources) {
              statementsHTML += `<tr style="background-color: ${mofRowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Other Sources</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${typeof mof.otherSources === 'number' ? mof.otherSources.toLocaleString('en-IN') : mof.otherSources}</td></tr>`;
              mofRowIdx++;
            }
            
            const mofTotal = (mof.spvContribution || 0) + (mof.governmentGrant || 0) + (mof.bankLoan || 0) + (mof.otherSources || 0);
            if (mofTotal > 0) {
              statementsHTML += `<tr style="background-color: #E5E7EB; font-weight: bold;"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Total</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${mofTotal.toLocaleString('en-IN')}</td></tr>`;
            }
            statementsHTML += '</tbody></table>';
          }
        }
      }
      
      if (s15.profitAndLossProjections && s15.profitAndLossProjections.length > 0) {
        statementsHTML += '<h3 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 14pt;">2. Cost of Production & Profitability</h3>';
        statementsHTML += '<table style="width: 100%; border-collapse: collapse; margin: 0.5cm 0; font-size: 10pt;">';
        statementsHTML += '<thead><tr style="background-color: #E5E7EB;"><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Year</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Revenue</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Cost</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Profit</th></tr></thead>';
        statementsHTML += '<tbody>';
        s15.profitAndLossProjections.forEach((proj: any, idx: number) => {
          const bgColor = idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
          const revenue = typeof proj.revenue === 'number' ? `₹${proj.revenue.toLocaleString('en-IN')}` : (proj.revenue || '0');
          const cost = typeof proj.cost === 'number' ? `₹${proj.cost.toLocaleString('en-IN')}` : (proj.cost || '0');
          const profit = typeof proj.profit === 'number' ? `₹${proj.profit.toLocaleString('en-IN')}` : (proj.profit || '0');
          statementsHTML += `<tr style="background-color: ${bgColor};"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Year ${idx + 1}</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${revenue}</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${cost}</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${profit}</td></tr>`;
        });
        statementsHTML += '</tbody></table>';
      }
      
      if (s15.breakEvenPoint || s15.irr || s15.npv) {
        statementsHTML += '<h3 style="margin-top: 0.5cm; margin-bottom: 0.3cm; font-weight: bold; color: #1F2937; font-size: 14pt;">3. Financial Indicators</h3>';
        statementsHTML += '<table style="width: 100%; border-collapse: collapse; margin: 0.5cm 0; font-size: 10pt;">';
        statementsHTML += '<thead><tr style="background-color: #E5E7EB;"><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Indicator</th><th style="border: 1px solid #1F2937; padding: 0.3cm; font-weight: bold; text-align: left;">Value</th></tr></thead>';
        statementsHTML += '<tbody>';
        if (s15.breakEvenPoint) statementsHTML += `<tr style="background-color: #FFFFFF;"><td style="border: 1px solid #1F2937; padding: 0.3cm;">Break Even Point</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${s15.breakEvenPoint} years</td></tr>`;
        if (s15.irr) statementsHTML += `<tr style="background-color: #F9FAFB;"><td style="border: 1px solid #1F2937; padding: 0.3cm;">IRR</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">${s15.irr}%</td></tr>`;
        if (s15.npv) statementsHTML += `<tr style="background-color: #FFFFFF;"><td style="border: 1px solid #1F2937; padding: 0.3cm;">NPV</td><td style="border: 1px solid #1F2937; padding: 0.3cm;">₹${s15.npv.toLocaleString('en-IN')}</td></tr>`;
        statementsHTML += '</tbody></table>';
      }
      
      return statementsHTML || '<p style="text-align: justify; margin-bottom: 0.5cm; line-height: 1.8; color: #1F2937;">Financial statements data not available.</p>';
    };
    
    // Template already has page structure, just return content
    const financialStatementsHTML = generateFinancialStatements();
    html = html.replace('{{FINANCIAL_STATEMENTS}}', financialStatementsHTML);
    
    // Generate Annexures section
    const generateAnnexures = (): string => {
      let annexuresHTML = '<ul style="list-style-type: none; padding-left: 0; color: #1F2937;">';
      let annexureNum = 1;
      
      if (s18.spvRegistration) {
        annexuresHTML += `<li style="margin-bottom: 0.5cm; line-height: 1.8;"><strong>Annexure ${annexureNum}:</strong> SPV Registration</li>`;
        annexureNum++;
      }
      if (s18.landDocuments) {
        annexuresHTML += `<li style="margin-bottom: 0.5cm; line-height: 1.8;"><strong>Annexure ${annexureNum}:</strong> Land Documents</li>`;
        annexureNum++;
      }
      if (s18.buildingEstimates) {
        annexuresHTML += `<li style="margin-bottom: 0.5cm; line-height: 1.8;"><strong>Annexure ${annexureNum}:</strong> Building Estimates</li>`;
        annexureNum++;
      }
      if (s18.machineryQuotations) {
        annexuresHTML += `<li style="margin-bottom: 0.5cm; line-height: 1.8;"><strong>Annexure ${annexureNum}:</strong> Machinery Quotations</li>`;
        annexureNum++;
      }
      if (s18.memberRegistrations) {
        annexuresHTML += `<li style="margin-bottom: 0.5cm; line-height: 1.8;"><strong>Annexure ${annexureNum}:</strong> Member Registrations</li>`;
        annexureNum++;
      }
      if (s18.supportingDocuments && Array.isArray(s18.supportingDocuments) && s18.supportingDocuments.length > 0) {
        s18.supportingDocuments.forEach((doc: any, idx: number) => {
          annexuresHTML += `<li style="margin-bottom: 0.5cm; line-height: 1.8;"><strong>Annexure ${annexureNum}:</strong> Supporting Document ${idx + 1}</li>`;
          annexureNum++;
        });
      }
      
      annexuresHTML += '</ul>';
      return annexuresHTML || '<p style="text-align: justify; margin-bottom: 0.5cm; line-height: 1.8; color: #1F2937;">No annexures available.</p>';
    };
    
    // Template already has page structure, just return content
    const annexuresHTMLContent = generateAnnexures();
    html = html.replace('{{ANNEXURES}}', annexuresHTMLContent);
    
    // Final check: Find any remaining placeholders
    const remainingPlaceholders = html.match(/\{\{[A-Z_]+\}\}/g);
    if (remainingPlaceholders && remainingPlaceholders.length > 0) {
      console.warn('⚠️  WARNING: Some placeholders were not replaced:', remainingPlaceholders);
      // Replace any remaining placeholders with empty string to avoid showing them in PDF
      remainingPlaceholders.forEach(placeholder => {
        console.warn(`   Removing unreplaced placeholder: ${placeholder}`);
        html = html.replace(placeholder, '');
      });
    } else {
      console.log('✅ All placeholders successfully replaced');
    }
    
    // Log final HTML stats
    const pageCount = (html.match(/<div class="page"/g) || []).length;
    console.log(`\n📊 Final HTML Statistics:`);
    console.log(`   Total pages: ${pageCount}`);
    console.log(`   HTML length: ${html.length} characters`);
    console.log(`   Contains Executive Summary: ${html.includes('EXECUTIVE SUMMARY')}`);
    console.log(`   Contains Introduction: ${html.includes('1. INTRODUCTION')}`);
    console.log(`   Contains District Profile: ${html.includes('DISTRICT & REGIONAL PROFILE')}`);
    console.log(`   Contains Cluster Profile: ${html.includes('CLUSTER PROFILE')}`);
    console.log(`   Contains Value Chain: ${html.includes('VALUE CHAIN')}`);
    console.log(`   Contains Market Aspects: ${html.includes('MARKET ASPECTS')}`);
    console.log(`   Contains SWOT: ${html.includes('SWOT ANALYSIS')}`);
    console.log(`   Contains Gap Analysis: ${html.includes('GAP ANALYSIS')}`);
    console.log(`   Contains CFC Details: ${html.includes('CFC - OPERATION')}`);
    console.log(`   Contains SPV Details: ${html.includes('SPV MEMBER')}`);
    console.log(`   Contains Project Cost: ${html.includes('PROJECT COST')}`);
    console.log(`   Contains Financial Viability: ${html.includes('FINANCIAL VIABILITY')}`);
    console.log(`   Contains Expected Impact: ${html.includes('EXPECTED IMPACT')}`);
    console.log(`   Contains Conclusion: ${html.includes('CONCLUSION')}`);
    console.log(`   Contains Financial Statements: ${html.includes('FINANCIAL STATEMENTS')}`);
    console.log(`   Contains Annexures: ${html.includes('ANNEXURES')}`);
    
    return html;
  }

  /**
   * Generate PDF for Cluster DPR matching the preview template exactly using HTML-to-PDF
   */
  static async generateClusterDPRPDF(dpr: any, project: any, language: 'english' | 'telugu', enhancedParagraphs?: Record<string, string>): Promise<Buffer> {
    try {
      console.log('📄 Starting Cluster DPR PDF generation...');
      console.log('   ✅ Using: cluster-dpr-pdf.html template');
      console.log('   DPR ID:', dpr._id || dpr.id);
      console.log('   Language:', language);
      if (enhancedParagraphs && Object.keys(enhancedParagraphs).length > 0) {
        console.log(`   📝 Enhanced paragraphs provided for ${Object.keys(enhancedParagraphs).length} sections`);
      }
      
      // Generate HTML from template
      let html: string;
      try {
        html = this.generateClusterDPRHTML(dpr, project, language, enhancedParagraphs);
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
      const hasBorderStyle = html.includes('border: 8px double #2563EB') || html.includes('border: 8px solid #2563EB');
      if (!html.includes('<style') || !hasBorderStyle) {
        console.error('❌ HTML template missing critical styles!');
        throw new Error('HTML template is missing required CSS styles');
      }
      
      console.log(`✅ HTML generated: ${html.length} characters`);
      console.log(`✅ HTML contains styles: ${html.includes('<style')}`);
      console.log(`✅ HTML contains page borders: ${hasBorderStyle}`);
      
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
              timeout: 90000 // Increased timeout for large documents
            });
            console.log('✅ HTML content set successfully');
            // Wait a bit for all resources to load
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (contentError: any) {
            console.warn('⚠️  networkidle0 failed, trying domcontentloaded:', contentError.message);
            // Try with simpler wait condition
            await page.setContent(html, {
              waitUntil: 'domcontentloaded',
              timeout: 90000
            });
            // Wait for stylesheets to load - use Promise-based delay instead of waitForTimeout
            await new Promise(resolve => setTimeout(resolve, 3000)); // Longer wait for fallback
            console.log('✅ HTML content set with fallback method');
          }
          
          // Ensure all styles are applied
          await page.evaluateHandle(() => document.fonts.ready);
          
          // Wait for styles to load and render - use Promise-based delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          
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
          
          // Wait a bit more for rendering - use Promise-based delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verify all sections are present in the rendered page
          const sectionsInPage = await page.evaluate(() => {
            const sections = [
              'EXECUTIVE SUMMARY',
              'INTRODUCTION',
              'DISTRICT & REGIONAL PROFILE',
              'CLUSTER PROFILE',
              'VALUE CHAIN',
              'MARKET ASPECTS',
              'SWOT ANALYSIS',
              'GAP ANALYSIS',
              'CFC - OPERATION',
              'SPV MEMBER',
              'PROJECT COST',
              'FINANCIAL VIABILITY',
              'EXPECTED IMPACT',
              'CONCLUSION',
              'FINANCIAL STATEMENTS',
              'ANNEXURES'
            ];
            const foundSections: string[] = [];
            const pageText = document.body.innerText || '';
            sections.forEach(section => {
              if (pageText.includes(section)) {
                foundSections.push(section);
              }
            });
            return { found: foundSections, total: sections.length };
          });
          
          console.log(`📊 Sections found in rendered page: ${sectionsInPage.found.length}/${sectionsInPage.total}`);
          if (sectionsInPage.found.length < sectionsInPage.total) {
            console.warn(`⚠️  Some sections may be missing. Found: ${sectionsInPage.found.join(', ')}`);
          } else {
            console.log('✅ All sections found in rendered page');
          }
          
          // Wait one more time to ensure everything is fully rendered
          await new Promise(resolve => setTimeout(resolve, 500));
          
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
            timeout: 120000, // Increased timeout for large documents with many sections
            scale: 1.0
          });
          
          // Validate PDF buffer
          if (!pdfBuffer || pdfBuffer.length === 0) {
            await browser.close();
            throw new Error('Generated PDF buffer is empty');
          }
          
          // Convert to Buffer if it's not already
          const buffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
          
          // Validate PDF header (PDF files start with %PDF)
          // Check first 4 bytes: 0x25 0x50 0x44 0x46 = %PDF
          const isValidPDF = buffer.length >= 4 && 
                            buffer[0] === 0x25 && // %
                            buffer[1] === 0x50 && // P
                            buffer[2] === 0x44 && // D
                            buffer[3] === 0x46;   // F
          
          if (!isValidPDF) {
            const headerBytes = buffer.slice(0, 4);
            const headerStr = headerBytes.toString('ascii');
            const headerHex = Array.from(headerBytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
            console.error('❌ Invalid PDF header bytes:', Array.from(headerBytes).join(','));
            console.error('   Header as string:', headerStr);
            console.error('   Header as hex:', headerHex);
            console.error('   First 20 bytes:', buffer.slice(0, 20).toString('hex'));
            await browser.close();
            throw new Error(`Generated buffer does not appear to be a valid PDF. Header bytes: ${Array.from(headerBytes).join(',')}`);
          }
          
          const pdfHeader = buffer.slice(0, 4).toString('ascii');
          console.log(`✅ PDF generated successfully: ${buffer.length} bytes`);
          console.log(`✅ PDF header validated: ${pdfHeader}`);
          
          await browser.close();
          return buffer; // Return the validated buffer
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

        // Helper to draw page borders (matching reference PDF)
        const drawPageBorders = () => {
          const pageWidth = doc.page.width;
          const pageHeight = doc.page.height;
          const borderWidth = 8;
          const innerBorderWidth = 2;
          const margin = 10;
          
          // Save current graphics state
          doc.save();
          
          // Outer double border (blue) - draw as double line
          doc.strokeColor('#2563EB');
          doc.lineWidth(borderWidth);
          // Top
          doc.moveTo(0, 0).lineTo(pageWidth, 0).stroke();
          // Bottom
          doc.moveTo(0, pageHeight).lineTo(pageWidth, pageHeight).stroke();
          // Left
          doc.moveTo(0, 0).lineTo(0, pageHeight).stroke();
          // Right
          doc.moveTo(pageWidth, 0).lineTo(pageWidth, pageHeight).stroke();
          
          // Inner border (lighter blue)
          doc.strokeColor('#3B82F6');
          doc.lineWidth(innerBorderWidth);
          // Top
          doc.moveTo(margin, margin).lineTo(pageWidth - margin, margin).stroke();
          // Bottom
          doc.moveTo(margin, pageHeight - margin).lineTo(pageWidth - margin, pageHeight - margin).stroke();
          // Left
          doc.moveTo(margin, margin).lineTo(margin, pageHeight - margin).stroke();
          // Right
          doc.moveTo(pageWidth - margin, margin).lineTo(pageWidth - margin, pageHeight - margin).stroke();
          
          // Reset stroke color and restore graphics state
          doc.strokeColor('#000000');
          doc.restore();
        };
        
        // Wrapper for addPage that also draws borders
        const addPageWithBorders = () => {
          doc.addPage();
          drawPageBorders();
        };

        // Helper to render section header (blue, bold, underlined)
        const renderSectionHeader = (text: string) => {
          doc.fillColor('#1E40AF'); // Blue
          doc.fontSize(16).font('Helvetica-Bold').text(text, { underline: true });
          doc.fillColor('#000000'); // Reset to black
          doc.moveDown(0.5);
        };

        // Draw borders on first page
        drawPageBorders();
        
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
        doc.moveDown(2);
        
        // Submitted by
        const submittedByY = doc.y;
        doc.font('Helvetica-Bold').text('Submitted by:', 50, submittedByY);
        doc.moveDown(0.5);
        const spvNameY = doc.y;
        doc.font('Helvetica').text(s11.spvName || 'SPV Name', 50, spvNameY);
        doc.moveDown(0.3);
        doc.text(s1.location || 'Location', 50, doc.y);
        doc.moveDown(1.5);
        
        // Prepared by
        const preparedByY = doc.y;
        doc.font('Helvetica-Bold').text('Prepared by:', 50, preparedByY);
        doc.moveDown(0.5);
        doc.font('Helvetica').text('M/s.ITCOT Limited, 50A Greams Road, Chennai.', 50, doc.y);
        
        // Reset color
        doc.fillColor('#000000');

        // Table of Contents Page
        addPageWithBorders();
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
        addPageWithBorders();
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
        addPageWithBorders();
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
          addPageWithBorders();
          renderSectionHeader('1.5 DISTRICT & REGIONAL PROFILE');
          addFormattedText(sections.districtProfile || contentLang.districtProfile || '');
        }

        if (sections.clusterProfile || contentLang.clusterProfile) {
          addPageWithBorders();
          renderSectionHeader('2. CLUSTER PROFILE');
          addFormattedText(sections.clusterProfile || contentLang.clusterProfile || '');
        }

        if (sections.valueChain || contentLang.valueChain) {
          addPageWithBorders();
          renderSectionHeader('3. CLUSTER VALUE CHAIN MAPPING');
          addFormattedText(sections.valueChain || contentLang.valueChain || '');
        }

        if (sections.marketAssessment || contentLang.marketAnalysis) {
          addPageWithBorders();
          renderSectionHeader('4. MARKET ASPECTS');
          addFormattedText(sections.marketAssessment || contentLang.marketAnalysis || '');
        }

        if (sections.swotAnalysis || contentLang.swotAnalysis) {
          addPageWithBorders();
          renderSectionHeader('5. SWOT ANALYSIS');
          addFormattedText(sections.swotAnalysis || contentLang.swotAnalysis || '');
        }

        if (sections.gapAnalysis || contentLang.gapAnalysis) {
          addPageWithBorders();
          renderSectionHeader('6. NEED GAP ANALYSIS');
          addFormattedText(sections.gapAnalysis || contentLang.gapAnalysis || '');
        }

        if (sections.cfcDetails || contentLang.cfcDetails) {
          addPageWithBorders();
          renderSectionHeader('7. CFC - OPERATION & MANAGEMENT');
          addFormattedText(sections.cfcDetails || contentLang.cfcDetails || '');
        }

        if (sections.spvDetails || contentLang.spvDetails) {
          addPageWithBorders();
          renderSectionHeader('8. SPV MEMBER UNITS');
          addFormattedText(sections.spvDetails || contentLang.spvDetails || '');
        }

        if (sections.projectCost || contentLang.projectCost) {
          addPageWithBorders();
          renderSectionHeader('9. PROJECT COST & MEANS OF FINANCE');
          addFormattedText(sections.projectCost || contentLang.projectCost || '');
        }

        if (sections.operatingCostRevenue || contentLang.operatingCostRevenue) {
          addPageWithBorders();
          renderSectionHeader('9.5 OPERATING COST & REVENUE');
          addFormattedText(sections.operatingCostRevenue || contentLang.operatingCostRevenue || '');
        }

        if (sections.financialViability || contentLang.financialProjections) {
          addPageWithBorders();
          renderSectionHeader('10. FINANCIAL VIABILITY');
          addFormattedText(sections.financialViability || contentLang.financialProjections || '');
        }

        if (sections.implementationSchedule || contentLang.implementationSchedule) {
          addPageWithBorders();
          renderSectionHeader('10.5 PROJECT IMPLEMENTATION SCHEDULE');
          addFormattedText(sections.implementationSchedule || contentLang.implementationSchedule || '');
        }

        if (sections.expectedImpact || contentLang.conclusion) {
          addPageWithBorders();
          renderSectionHeader('11. EXPECTED IMPACT');
          addFormattedText(sections.expectedImpact || contentLang.conclusion || '');
        }

        // Conclusion
        if (contentLang.conclusion && !sections.expectedImpact) {
          addPageWithBorders();
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

