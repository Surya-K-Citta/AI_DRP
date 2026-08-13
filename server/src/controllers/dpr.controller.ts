// @ts-nocheck
import { Request, Response } from 'express';
import { OpenAIService } from '../services/openai.service';
import { DprBuilderAssistService } from '../services/dprBuilderAssist.service';
import { DPRTemplate } from '../models/DPRTemplate.model';
import { DPRSession } from '../models/DPRSession.model';
import { Document } from '../models/Document.model';
import { DPRService } from '../services/dpr.service';
import { QualityService } from '../services/quality.service';
import { DPRVersion } from '../models/DPRVersion.model';
import { AuthRequest } from '../types';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Setup multer for DPR file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads', 'dprs');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    try {
      console.log(`📄 File upload attempt: ${file.originalname}, MIME: ${file.mimetype}`);
      
      // Allow PDF, DOC, DOCX, TXT files
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown',
        'application/octet-stream', // Some browsers send this for .doc files
      ];

      const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md'];
      const fileName = file.originalname.toLowerCase();
      const fileExtension = fileName.includes('.') 
        ? fileName.substring(fileName.lastIndexOf('.'))
        : '';

      console.log(`📄 File extension: ${fileExtension}, MIME type: ${file.mimetype}`);

      // Check both MIME type and file extension (some browsers don't report correct MIME for .doc)
      const isValidType = allowedTypes.includes(file.mimetype) || 
                         allowedExtensions.includes(fileExtension);

      if (isValidType) {
        console.log(`✅ File type accepted: ${file.originalname}`);
        cb(null, true);
      } else if (!fileExtension) {
        // If no extension, allow it and let the backend handle validation
        console.log(`⚠️ File has no extension, allowing for backend validation: ${file.originalname}`);
        cb(null, true);
      } else {
        const errorMsg = `Invalid file type. Only PDF, DOC, DOCX, TXT, and MD files are allowed. Received: ${file.mimetype || 'unknown'} (${fileExtension})`;
        console.error(`❌ ${errorMsg}`);
        cb(new Error(errorMsg));
      }
    } catch (error: any) {
      console.error(`❌ File validation error: ${error.message}`);
      cb(new Error(`File validation error: ${error.message}`));
    }
  },
});

export class DPRController {
  /**
   * Analyze uploaded DPR template
   */
  static async analyzeTemplate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { documentId } = req.params;
      const { category, description, tags } = req.body;

      // Get document content
      const document = await Document.findById(documentId);
      if (!document) {
        res.status(404).json({
          success: false,
          message: 'Document not found',
        });
        return;
      }

      // Read template content (assuming it's stored as text)
      const fs = require('fs');
      const templateContent = fs.readFileSync(document.filePath, 'utf8');

      // Analyze template structure
      const structure = await OpenAIService.analyzeDPRTemplate(templateContent);

      // Create DPR template record
      const dprTemplate = await DPRTemplate.create({
        name: document.originalName,
        description: description || 'DPR Template',
        category: category || 'other',
        templateContent,
        structure,
        createdBy: req.user?.userId || 'system',
        metadata: {
          version: '1.0.0',
          tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
          difficulty: 'intermediate',
          targetAudience: ['entrepreneurs', 'msme'],
        },
      });

      res.status(200).json({
        success: true,
        message: 'Template analyzed successfully',
        data: {
          templateId: dprTemplate._id,
          structure,
          documentId,
        },
      });
    } catch (error: any) {
      console.error('Error analyzing template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze template',
        error: error.message,
      });
    }
  }

  /**
   * Start DPR creation session
   */
  static async startDPRSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { templateId, language = 'english' } = req.body;

      const template = await DPRTemplate.findById(templateId);
      if (!template) {
        res.status(404).json({
          success: false,
          message: 'Template not found',
        });
        return;
      }

      // Check for existing active session
      const existingSession = await DPRSession.findOne({
        userId: req.user?.userId,
        templateId,
        status: 'in_progress',
      });

      if (existingSession) {
        res.status(200).json({
          success: true,
          message: 'Resuming existing DPR session',
          data: {
            sessionId: existingSession._id,
            currentStep: existingSession.currentStep,
            totalSteps: existingSession.totalSteps,
            progress: existingSession.metadata.progress,
          },
        });
        return;
      }

      // Create new session
      const session = await DPRSession.create({
        userId: req.user?.userId || 'anonymous',
        templateId,
        totalSteps: template.structure.totalSections,
        metadata: {
          language,
          progress: 0,
        },
      });

      res.status(201).json({
        success: true,
        message: 'DPR session started',
        data: {
          sessionId: session._id,
          currentStep: 1,
          totalSteps: template.structure.totalSections,
          progress: 0,
        },
      });
    } catch (error: any) {
      console.error('Error starting DPR session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start DPR session',
        error: error.message,
      });
    }
  }

  /**
   * Get current step questionnaire
   */
  static async getCurrentStep(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      const session = await DPRSession.findById(sessionId);
      if (!session) {
        res.status(404).json({
          success: false,
          message: 'Session not found',
        });
        return;
      }

      const template = await DPRTemplate.findById(session.templateId);
      if (!template) {
        res.status(404).json({
          success: false,
          message: 'Template not found',
        });
        return;
      }

      // Generate questionnaire for current step
      const questionnaire = await OpenAIService.generateDPRQuestionnaire(
        template.structure,
        session.currentStep,
        session.responses
      );

      res.status(200).json({
        success: true,
        data: {
          sessionId,
          questionnaire,
          session: {
            currentStep: session.currentStep,
            totalSteps: session.totalSteps,
            progress: session.metadata.progress,
            status: session.status,
          },
        },
      });
    } catch (error: any) {
      console.error('Error getting current step:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get current step',
        error: error.message,
      });
    }
  }

  /**
   * Submit step responses
   */
  static async submitStepResponses(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { responses } = req.body;

      const session = await DPRSession.findById(sessionId);
      if (!session) {
        res.status(404).json({
          success: false,
          message: 'Session not found',
        });
        return;
      }

      // Update session with new responses
      session.responses = { ...session.responses, ...responses };
      session.lastActivityAt = new Date();

      // Check if this is the last step
      if (session.currentStep >= session.totalSteps) {
        session.status = 'completed';
        session.completedAt = new Date();
        session.metadata.progress = 100;

        // Generate complete DPR
        // NOTE: This legacy code path is not supported. Use DPRService.generateDPR() instead.
        // const template = await DPRTemplate.findById(session.templateId);
        // if (template) {
        //   // This method signature is deprecated - use DPRService.generateDPR() instead
        // }
        // Set empty DPR since legacy method is not supported
        session.generatedDPR = {
          content: 'Legacy DPR generation method not supported. Please use the new DPR builder.',
          sections: [],
          metadata: {
            generatedAt: new Date().toISOString(),
            language: session.metadata.language || 'english',
            totalSections: 0,
            wordCount: 0,
          },
        };

        await session.save();

        res.status(200).json({
          success: true,
          message: 'DPR creation completed!',
          data: {
            sessionId,
            status: 'completed',
            generatedDPR: session.generatedDPR,
            nextAction: 'download',
          },
        });
      } else {
        // Move to next step
        session.currentStep += 1;
        session.metadata.progress = Math.round((session.currentStep / session.totalSteps) * 100);
        await session.save();

        res.status(200).json({
          success: true,
          message: 'Responses saved, moving to next step',
          data: {
            sessionId,
            currentStep: session.currentStep,
            totalSteps: session.totalSteps,
            progress: session.metadata.progress,
            nextAction: 'continue',
          },
        });
      }
    } catch (error: any) {
      console.error('Error submitting step responses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit responses',
        error: error.message,
      });
    }
  }

  /**
   * Get generated DPR
   */
  static async getGeneratedDPR(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      const session = await DPRSession.findById(sessionId);
      if (!session) {
        res.status(404).json({
          success: false,
          message: 'Session not found',
        });
        return;
      }

      if (session.status !== 'completed' || !session.generatedDPR) {
        res.status(400).json({
          success: false,
          message: 'DPR not yet generated',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          sessionId,
          dpr: session.generatedDPR,
          session: {
            startedAt: session.startedAt,
            completedAt: session.completedAt,
            language: session.metadata.language,
          },
        },
      });
    } catch (error: any) {
      console.error('Error getting generated DPR:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get generated DPR',
        error: error.message,
      });
    }
  }

  /**
   * Get available DPR templates
   */
  static async getTemplates(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { category, difficulty } = req.query;

      const filter: any = { isActive: true };
      if (category) filter.category = category;
      if (difficulty) filter['metadata.difficulty'] = difficulty;

      const templates = await DPRTemplate.find(filter)
        .select('name description category metadata structure.totalSections structure.estimatedTime usageCount')
        .sort({ usageCount: -1, createdAt: -1 });

      res.status(200).json({
        success: true,
        data: templates,
      });
    } catch (error: any) {
      console.error('Error getting templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get templates',
        error: error.message,
      });
    }
  }

  /**
   * Generate DPR from chat responses
   */
  static async generateDPRFromChat(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { responses, language = 'english' } = req.body;

      if (!responses || Object.keys(responses).length === 0) {
        res.status(400).json({
          success: false,
          message: 'No responses provided',
        });
        return;
      }

      // Get the most popular template
      const template = await DPRTemplate.findOne({ isActive: true })
        .sort({ usageCount: -1 });

      if (!template) {
        res.status(404).json({
          success: false,
          message: 'No DPR templates available',
        });
        return;
      }

      // Generate complete DPR
      // NOTE: This legacy code path is not supported. Use DPRService.generateDPR() instead.
      // The generateCompleteDPR method signature has changed - it now requires a Project object
      res.status(400).json({
        success: false,
        message: 'Legacy DPR generation method not supported. Please use the new DPR builder at /dpr/builder',
      });
      return;
    } catch (error: any) {
      console.error('Error generating DPR from chat:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate DPR',
        error: error.message,
      });
    }
  }

  /**
   * Get user's DPR sessions
   */
  static async getUserSessions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const sessions = await DPRSession.find({ userId: req.user?.userId })
        .populate('templateId', 'name description category')
        .sort({ lastActivityAt: -1 })
        .limit(20);

      res.status(200).json({
        success: true,
        data: sessions,
      });
    } catch (error: any) {
      console.error('Error getting user sessions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user sessions',
        error: error.message,
      });
    }
  }

  /**
   * Generate DPR for a project
   */
  static async generateDPR(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const { projectId } = req.params;
      const { language = 'bilingual', stepData } = req.body;

      // Verify that the project belongs to the current user
      const { Project } = await import('../models/Project.model');
      const project = await Project.findById(projectId);
      
      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project not found',
        });
        return;
      }

      // Check if project belongs to the current user
      if (project.userId?.toString() !== userId.toString()) {
        res.status(403).json({
          success: false,
          message: 'Access denied: This project does not belong to you',
        });
        return;
      }

      // If stepData is provided in the request, update the project with it
      // This ensures locally stored stepData is used for DPR generation
      if (stepData && Object.keys(stepData).length > 0) {
        console.log('📊 StepData provided in request, updating project...');
        const stepKeys = Object.keys(stepData).filter(key => key.startsWith('step') || key !== 'stepData');
        console.log(`📊 Complete stepData received:`, {
          totalSteps: stepKeys.length,
          steps: stepKeys,
          totalKeys: Object.keys(stepData).length,
        });
        project.stepData = stepData;
        await project.save();
        console.log('✅ Project updated with stepData from request');
      } else {
        // Log existing stepData if any
        if (project.stepData) {
          const existingStepKeys = Object.keys(project.stepData).filter(key => key.startsWith('step') || key !== 'stepData');
          console.log(`📊 Using existing stepData from project:`, {
            totalSteps: existingStepKeys.length,
            steps: existingStepKeys,
          });
        } else {
          console.log('⚠️ No stepData provided in request and none found in project');
        }
      }

      console.log(`📝 Generating DPR for project ${projectId} in ${language}...`);

      const dpr = await DPRService.generateDPR(projectId, language);

      // Verify DPR was created and saved
      if (!dpr || !dpr.dprId) {
        throw new Error('DPR generation completed but failed to save to database');
      }

      console.log(`✅ DPR generated and saved successfully: ${dpr.dprId}`);

      res.status(200).json({
        success: true,
        message: 'DPR generated and saved successfully',
        data: dpr,
      });
    } catch (error: any) {
      console.error('❌ Error generating DPR:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate DPR',
        error: error.message,
      });
    }
  }

  /**
   * Get all DPRs for a project
   */
  static async getProjectDPRs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const { projectId } = req.params;

      // Verify that the project belongs to the current user
      const { Project } = await import('../models/Project.model');
      const project = await Project.findById(projectId);
      
      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project not found',
        });
        return;
      }

      // Check if project belongs to the current user
      if (project.userId?.toString() !== userId.toString()) {
        res.status(403).json({
          success: false,
          message: 'Access denied: This project does not belong to you',
        });
        return;
      }

      const dprs = await DPRService.getProjectDPRs(projectId);

      // Normalize DPR objects to include dprId field for consistency
      const normalizedDprs = dprs.map((dpr: any) => ({
        ...dpr.toObject ? dpr.toObject() : dpr,
        dprId: dpr._id || dpr.dprId,
      }));

      res.status(200).json({
        success: true,
        data: normalizedDprs,
      });
    } catch (error: any) {
      console.error('Error getting project DPRs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get project DPRs',
        error: error.message,
      });
    }
  }

  /**
   * Get DPR by ID
   */
  static async getDPR(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const { dprId } = req.params;

      const dpr = await DPRService.getDPR(dprId);
      
      if (!dpr) {
        res.status(404).json({
          success: false,
          message: 'DPR not found',
        });
        return;
      }

      // Verify that the DPR's project belongs to the current user
      const { Project } = await import('../models/Project.model');
      const project = await Project.findById(dpr.projectId);
      
      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project associated with this DPR not found',
        });
        return;
      }

      // Check if project belongs to the current user
      if (project.userId?.toString() !== userId.toString()) {
        res.status(403).json({
          success: false,
          message: 'Access denied: This DPR does not belong to you',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: dpr,
      });
    } catch (error: any) {
      console.error('Error getting DPR:', error);
      if (error.message === 'DPR not found') {
        res.status(404).json({
          success: false,
          message: 'DPR not found',
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to get DPR',
          error: error.message,
        });
      }
    }
  }

  /**
   * Download DPR as PDF
   */
  static async downloadPDF(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { dprId } = req.params;
      const { language = 'english' } = req.query;
      // Get enhanced paragraphs from request body (for POST) or query (for GET backward compatibility)
      const enhancedParagraphs = req.body?.enhancedParagraphs || req.query?.enhancedParagraphs;

      console.log(`📥 Downloading PDF for DPR ${dprId} in ${language}...`);
      if (enhancedParagraphs && Object.keys(enhancedParagraphs).length > 0) {
        console.log(`📝 Received enhanced paragraphs for ${Object.keys(enhancedParagraphs).length} sections`);
      }

      const pdfBuffer = await DPRService.generatePDF(
        dprId,
        language as 'english' | 'telugu',
        enhancedParagraphs
      );

      // Validate PDF buffer
      if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
        throw new Error('Invalid PDF buffer received');
      }

      if (pdfBuffer.length === 0) {
        throw new Error('PDF buffer is empty');
      }

      // Validate PDF header (PDF files start with %PDF)
      if (pdfBuffer[0] !== 0x25 || pdfBuffer[1] !== 0x50 || pdfBuffer[2] !== 0x44 || pdfBuffer[3] !== 0x46) {
        console.error('❌ Invalid PDF header:', pdfBuffer.slice(0, 10).toString());
        throw new Error('Generated file is not a valid PDF');
      }

      console.log(`✅ PDF validated: ${pdfBuffer.length} bytes`);

      // Get project name for filename
      const dpr = await DPRService.getDPR(dprId);
      const project = dpr?.projectId;
      const projectName = project?.projectName || dprId;
      const safeProjectName = projectName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="DPR_${safeProjectName}_${language}.pdf"`
      );
      res.setHeader('Content-Length', pdfBuffer.length.toString());
      res.setHeader('Cache-Control', 'no-cache');
      
      res.send(pdfBuffer);
      
      console.log(`✅ PDF sent successfully: ${pdfBuffer.length} bytes`);
    } catch (error: any) {
      console.error('❌ Error downloading PDF:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Failed to download PDF',
        error: error.message,
      });
    }
  }

  /**
   * Download DPR as PDF generated from client-rendered HTML (exact match with preview)
   * Intended mainly for Cluster DPRs where the React preview should match the downloaded PDF 1:1.
   */
  static async downloadPDFHtml(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { dprId } = req.params;
      const { language = 'english' } = req.query;
      const html = req.body?.html;
      console.log('html', html);

      if (!html || typeof html !== 'string' || html.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Missing required field: html',
        });
        return;
      }

      // Basic safety limits
      if (html.length > 20_000_000) {
        res.status(413).json({
          success: false,
          message: 'HTML payload too large',
        });
        return;
      }

      console.log(`📥 Downloading EXACT PDF (from HTML) for DPR ${dprId} in ${language}...`);
      console.log(`   HTML length: ${html.length} chars`);

      const pdfBuffer = await DPRService.generatePDFFromHTML(html);

      // Validate PDF header (PDF files start with %PDF)
      if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer) || pdfBuffer.length < 4) {
        throw new Error('Invalid PDF buffer received');
      }
      if (pdfBuffer[0] !== 0x25 || pdfBuffer[1] !== 0x50 || pdfBuffer[2] !== 0x44 || pdfBuffer[3] !== 0x46) {
        throw new Error('Generated file is not a valid PDF');
      }

      // Get project name for filename (same logic as standard download)
      const dpr = await DPRService.getDPR(dprId);
      const project = dpr?.projectId;
      const projectName = project?.projectName || dprId;
      const safeProjectName = projectName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="DPR_${safeProjectName}_${language}_exact.pdf"`
      );
      res.setHeader('Content-Length', pdfBuffer.length.toString());
      res.setHeader('Cache-Control', 'no-cache');

      res.send(pdfBuffer);
      console.log(`✅ EXACT PDF sent successfully: ${pdfBuffer.length} bytes`);
    } catch (error: any) {
      console.error('❌ Error downloading EXACT PDF:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Failed to download PDF',
        error: error.message,
      });
    }
  }

  /**
   * Download DPR as DOCX
   */
  static async downloadDOCX(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { dprId } = req.params;
      const { language = 'english' } = req.query;

      const docxBuffer = await DPRService.generateDOCX(
        dprId,
        language as 'english' | 'telugu'
      );

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="DPR_${dprId}.docx"`
      );
      res.send(docxBuffer);
    } catch (error: any) {
      console.error('Error downloading DOCX:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download DOCX',
        error: error.message,
      });
    }
  }

  /**
   * Download DPR session as PDF
   */
  static async downloadSessionPDF(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { language = 'english' } = req.query;

      const pdfBuffer = await DPRService.generatePDFFromSession(
        sessionId,
        language as 'english' | 'telugu'
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="DPR_Session_${sessionId}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Error downloading session PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download session PDF',
        error: error.message,
      });
    }
  }

  /**
   * Generate enhanced DPR from chat with template-based RAG
   */
  static async generateEnhancedDPRFromChat(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { responses, language = 'english', vectorStoreIds } = req.body;

      if (!responses || Object.keys(responses).length === 0) {
        res.status(400).json({
          success: false,
          message: 'No responses provided',
        });
        return;
      }

      // Search for template documents using RAG
      let templateStructure = null;
      if (vectorStoreIds && vectorStoreIds.length > 0) {
        try {
          const templateResults = await OpenAIService.searchTemplateDocumentsWithRAG(
            'DPR template structure, sections, fields, and format requirements',
            vectorStoreIds,
            'dpr',
            5
          );

          if (templateResults && templateResults.length > 0) {
            templateStructure = await OpenAIService.extractTemplateStructureFromRAG(
              templateResults,
              'dpr'
            );
          }
        } catch (error) {
          console.error('Error extracting template structure from RAG:', error);
          // Continue with fallback to existing templates
        }
      }

      // Use extracted template structure or fallback to existing templates
      let template: any = null;
      if (templateStructure) {
        // Create a temporary template object from extracted structure
        template = {
          structure: templateStructure,
          name: 'RAG-Extracted Template',
          category: 'other',
        };
      } else {
        // Get the most popular template as fallback
        template = await DPRTemplate.findOne({ isActive: true })
          .sort({ usageCount: -1 });
      }

      if (!template) {
        res.status(404).json({
          success: false,
          message: 'No DPR templates available',
        });
        return;
      }

      // Generate complete DPR using template structure
      // NOTE: This legacy code path is not supported. Use DPRService.generateDPR() instead.
      // The generateCompleteDPR method signature has changed - it now requires a Project object
      res.status(400).json({
        success: false,
        message: 'Legacy DPR generation method not supported. Please use the new DPR builder at /dpr/builder',
      });
      return;
    } catch (error: any) {
      console.error('Error generating enhanced DPR from chat:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate enhanced DPR',
        error: error.message,
      });
    }
  }

  /**
   * Analyze DPR quality and get score
   */
  static async analyzeQuality(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { dprId } = req.params;

      const analysis = await QualityService.analyzeDPRQuality(dprId);
      
      // Update DPR with quality analysis
      await QualityService.updateDPRQuality(dprId);

      res.status(200).json({
        success: true,
        data: analysis,
      });
    } catch (error: any) {
      console.error('Error analyzing DPR quality:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze DPR quality',
        error: error.message,
      });
    }
  }

  /**
   * Update DPR content (for inline editing)
   */
  static async updateDPRContent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const { dprId } = req.params;
      const { content, language } = req.body;

      const dpr = await DPRVersion.findById(dprId);
      if (!dpr) {
        res.status(404).json({
          success: false,
          message: 'DPR not found',
        });
        return;
      }

      // Verify that the DPR's project belongs to the current user
      const { Project } = await import('../models/Project.model');
      const project = await Project.findById(dpr.projectId);
      
      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project associated with this DPR not found',
        });
        return;
      }

      // Check if project belongs to the current user
      if (project.userId?.toString() !== userId.toString()) {
        res.status(403).json({
          success: false,
          message: 'Access denied: This DPR does not belong to you',
        });
        return;
      }

      // Update content
      if (content && language) {
        if (language === 'english' || language === 'telugu') {
          const langKey = language as 'english' | 'telugu';
          dpr.content[langKey] = { ...dpr.content[langKey], ...content };
          dpr.markModified('content');
        }
      }

      await dpr.save();

      // Recalculate quality score
      QualityService.updateDPRQuality(dprId).catch(err => {
        console.error('Error recalculating quality score:', err);
      });

      res.status(200).json({
        success: true,
        message: 'DPR content updated successfully',
        data: dpr,
      });
    } catch (error: any) {
      console.error('Error updating DPR content:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update DPR content',
        error: error.message,
      });
    }
  }

  /**
   * Submit DPR to admin/bank/APMSME
   */
  static async submitDPR(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const { dprId } = req.params;
      const { submittedTo } = req.body;

      const dpr = await DPRVersion.findById(dprId);
      if (!dpr) {
        res.status(404).json({
          success: false,
          message: 'DPR not found',
        });
        return;
      }

      // Verify that the DPR's project belongs to the current user
      const { Project } = await import('../models/Project.model');
      const project = await Project.findById(dpr.projectId);
      
      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project associated with this DPR not found',
        });
        return;
      }

      // Check if project belongs to the current user
      if (project.userId?.toString() !== userId.toString()) {
        res.status(403).json({
          success: false,
          message: 'Access denied: This DPR does not belong to you',
        });
        return;
      }

      // Update DPR status
      dpr.status = 'submitted';
      dpr.submittedAt = new Date();
      dpr.submittedTo = submittedTo || 'admin';
      await dpr.save();

      res.status(200).json({
        success: true,
        message: 'DPR submitted successfully',
        data: {
          dprId,
          status: dpr.status,
          submittedAt: dpr.submittedAt,
          submittedTo: dpr.submittedTo,
        },
      });
    } catch (error: any) {
      console.error('Error submitting DPR:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit DPR',
        error: error.message,
      });
    }
  }

  /**
   * Get user's DPRs with statuses
   */
  static async getUserDPRs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const { Project } = await import('../models/Project.model');
      
      // Find projects belonging to this user - ensure userId matches exactly
      // Handle both string and ObjectId cases
      const projects = await Project.find({ 
        userId: userId.toString() 
      });
      const projectIds = projects.map(p => p._id.toString());

      if (projectIds.length === 0) {
        res.status(200).json({
          success: true,
          data: [],
        });
        return;
      }

      // Find DPRs for user's projects - only select essential fields for dashboard
      const dprs = await DPRVersion.find({ projectId: { $in: projectIds } })
        .select('_id projectId versionNumber status qualityScore generatedAt createdAt updatedAt')
        .sort({ createdAt: -1 })
        .lean(); // Use lean() for faster queries

      // Additional safety check: Filter DPRs to ensure their projects belong to the user
      // This prevents any edge cases where projectId might not match
      const dprsWithProjects = await Promise.all(
        dprs.map(async (dpr: any) => {
          const project = await Project.findById(dpr.projectId)
            .select('projectName industrySector location userId')
            .lean();
          
          // Only include DPR if the project belongs to the current user
          if (!project || project.userId?.toString() !== userId.toString()) {
            return null;
          }
          
          return {
            _id: dpr._id,
            projectId: {
              projectName: project.projectName || 'Unknown Project',
              industrySector: project.industrySector || 'Unknown',
              location: project.location || 'Unknown',
            },
            versionNumber: dpr.versionNumber,
            status: dpr.status,
            qualityScore: dpr.qualityScore,
            generatedAt: dpr.generatedAt,
            createdAt: dpr.createdAt,
            updatedAt: dpr.updatedAt,
          };
        })
      );

      // Filter out any null values from the safety check
      const filteredDprs = dprsWithProjects.filter(dpr => dpr !== null);

      console.log(`📊 Retrieved ${filteredDprs.length} DPRs for user ${userId} (from ${projects.length} projects)`);

      res.status(200).json({
        success: true,
        data: filteredDprs,
      });
    } catch (error: any) {
      console.error('Error getting user DPRs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user DPRs',
        error: error.message,
      });
    }
  }

  /**
   * Download DPR as XLS (Excel) - CSV format as fallback
   */
  static async downloadXLS(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const { dprId } = req.params;
      const { language = 'english' } = req.query;

      const dpr = await DPRService.getDPR(dprId);
      
      if (!dpr) {
        res.status(404).json({
          success: false,
          message: 'DPR not found',
        });
        return;
      }

      // Verify that the DPR's project belongs to the current user
      const { Project } = await import('../models/Project.model');
      const project = await Project.findById(dpr.projectId);
      
      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project associated with this DPR not found',
        });
        return;
      }

      // Check if project belongs to the current user
      if (project.userId?.toString() !== userId.toString()) {
        res.status(403).json({
          success: false,
          message: 'Access denied: This DPR does not belong to you',
        });
        return;
      }

      const contentLang = language === 'telugu' ? dpr.content.telugu : dpr.content.english;

      // Try to use exceljs if available, otherwise use CSV
      try {
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('DPR');

        // Add title with proper language
        const title = language === 'telugu' ? 'వివరణాత్మక ప్రాజెక్ట్ నివేదిక' : 'Detailed Project Report';
        worksheet.addRow([title]);
        worksheet.addRow([project.projectName]);
        worksheet.addRow([]);

        // Section labels based on language
        const sectionLabels = language === 'telugu' ? {
          executiveSummary: '1. కార్యనిర్వాహక సారాంశం',
          businessProfile: '2. వ్యాపార ప్రొఫైల్',
          marketAnalysis: '3. మార్కెట్ విశ్లేషణ',
          technicalFeasibility: '4. సాంకేతిక సాధ్యత',
          financialProjections: '5. ఆర్థిక అంచనాలు',
          conclusion: '6. ముగింపు'
        } : {
          executiveSummary: '1. Executive Summary',
          businessProfile: '2. Business Profile',
          marketAnalysis: '3. Market Analysis',
          technicalFeasibility: '4. Technical Feasibility',
          financialProjections: '5. Financial Projections',
          conclusion: '6. Conclusion'
        };

        // Add sections with proper labels
        const sections = [
          { title: sectionLabels.executiveSummary, content: contentLang.executiveSummary },
          { title: sectionLabels.businessProfile, content: contentLang.businessProfile },
          { title: sectionLabels.marketAnalysis, content: contentLang.marketAnalysis },
          { title: sectionLabels.technicalFeasibility, content: contentLang.technicalFeasibility },
          { title: sectionLabels.financialProjections, content: contentLang.financialProjections },
          { title: sectionLabels.conclusion, content: contentLang.conclusion },
        ];

        sections.forEach(section => {
          worksheet.addRow([section.title]);
          worksheet.addRow([section.content]);
          worksheet.addRow([]);
        });

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="DPR_${dprId}.xlsx"`
        );
        res.send(buffer);
      } catch (excelError) {
        // Fallback to CSV format
        const sections = [
          { title: 'Executive Summary', content: contentLang.executiveSummary },
          { title: 'Business Profile', content: contentLang.businessProfile },
          { title: 'Market Analysis', content: contentLang.marketAnalysis },
          { title: 'Technical Feasibility', content: contentLang.technicalFeasibility },
          { title: 'Financial Projections', content: contentLang.financialProjections },
          { title: 'Conclusion', content: contentLang.conclusion },
        ];

        let csv = `Detailed Project Report\n${project.projectName}\n\n`;
        sections.forEach(section => {
          csv += `${section.title}\n${section.content}\n\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="DPR_${dprId}.csv"`
        );
        res.send(csv);
      }
    } catch (error: any) {
      console.error('Error downloading XLS:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download XLS',
        error: error.message,
      });
    }
  }

  /**
   * Upload and analyze DPR file
   */
  static async uploadDPR(req: AuthRequest, res: Response): Promise<void> {
    try {
      const file = req.file;
      const userId = req.user?.userId;

      if (!file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded. Please select a file to upload.',
        });
        return;
      }

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      console.log(`📤 DPR upload request: ${file.originalname} (${file.size} bytes)`);

      // Process the uploaded DPR
      const result = await DPRService.processUploadedDPR(
        file.path,
        file.originalname,
        file.mimetype,
        userId
      );

      // Clean up uploaded file after processing
      try {
        await fs.promises.unlink(file.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file:', cleanupError);
      }

      // Get quality analysis
      let qualityAnalysis = null;
      try {
        qualityAnalysis = await QualityService.analyzeDPRQuality(result.dprId.toString());
      } catch (qualityError) {
        console.warn('Quality analysis failed (non-critical):', qualityError);
      }

      res.status(200).json({
        success: true,
        message: 'DPR uploaded and analyzed successfully',
        data: {
          dprId: result.dprId,
          projectId: result.projectId,
          projectInfo: result.projectInfo,
          suggestions: result.suggestions,
          qualityAnalysis: qualityAnalysis || null,
        },
      });
    } catch (error: any) {
      console.error('Error uploading DPR:', error);
      
      // Clean up file on error
      if (req.file?.path) {
        try {
          await fs.promises.unlink(req.file.path);
        } catch (cleanupError) {
          console.warn('Failed to cleanup file on error:', cleanupError);
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to upload and analyze DPR',
        error: error.message,
      });
    }
  }

  /**
   * Translate DPR content to Telugu
   */
  static async translateToTelugu(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { dprId } = req.params;
      const { TranslationService } = await import('../services/translation.service');
      
      const dpr = await DPRVersion.findById(dprId);
      if (!dpr) {
        res.status(404).json({
          success: false,
          message: 'DPR not found',
        });
        return;
      }

      // Check if Telugu content already exists
      if (dpr.content?.telugu && Object.keys(dpr.content.telugu).length > 0) {
        res.status(200).json({
          success: true,
          message: 'Telugu content already exists',
          data: {
            dprId,
            hasTelugu: true,
          },
        });
        return;
      }

      // Translate English content to Telugu
      const englishContent = dpr.content?.english || {};
      if (!englishContent || Object.keys(englishContent).length === 0) {
        res.status(400).json({
          success: false,
          message: 'No English content available to translate',
        });
        return;
      }

      // Translate all sections - ensure complete translation
      const teluguContent: any = {};
      const sections = ['executiveSummary', 'businessProfile', 'marketAnalysis', 'technicalFeasibility', 'financialProjections', 'conclusion'] as const;
      
      console.log(`🔄 Translating ${sections.length} sections to Telugu...`);
      
      // Translate sections in parallel for faster processing
      const translationPromises = sections.map(async (section) => {
        const sectionContent = englishContent[section as keyof typeof englishContent];
        if (sectionContent && sectionContent.trim().length > 0) {
          try {
            console.log(`  Translating ${section}...`);
            const translated = await TranslationService.translateText(
              sectionContent,
              'te'
            );
            // Verify translation is not empty
            if (!translated || translated.trim().length === 0) {
              console.warn(`  ⚠️  ${section} translation is empty, using original`);
              return { section, content: sectionContent };
            }
            console.log(`  ✅ ${section} translated (${translated.length} chars)`);
            return { section, content: translated };
          } catch (error: any) {
            console.error(`  ❌ Error translating ${section}:`, error.message);
            // Fallback to original content if translation fails
            return { section, content: sectionContent };
          }
        }
        return { section, content: '' };
      });
      
      const translationResults = await Promise.all(translationPromises);
      
      // Organize translated content
      translationResults.forEach(({ section, content }) => {
        teluguContent[section] = content;
      });
      
      console.log(`✅ Translation completed: ${Object.keys(teluguContent).length} sections translated`);

      // Update DPR with Telugu content
      dpr.content = {
        ...dpr.content,
        telugu: teluguContent,
      };
      dpr.markModified('content');
      await dpr.save();

      res.status(200).json({
        success: true,
        message: 'DPR translated to Telugu successfully',
        data: {
          dprId,
          teluguContent,
        },
      });
    } catch (error: any) {
      console.error('Error translating DPR to Telugu:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to translate DPR to Telugu',
        error: error.message,
      });
    }
  }

  /**
   * One-shot grounded analysis for Create DPR (AIGuidedDPRBuilder) steps
   */
  static async analyzeBuilderStep(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { stepId, stepTitle, factSheet } = req.body || {};
      if (!stepId) {
        res.status(400).json({
          success: false,
          message: 'stepId is required',
        });
        return;
      }

      const data = await DprBuilderAssistService.analyzeStep({
        stepId,
        stepTitle: stepTitle || stepId,
        factSheet: factSheet || {},
      });

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error('Error analyzing DPR builder step:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze this step',
        error: error.message,
      });
    }
  }

  /**
   * Step-scoped chat for Create DPR (AIGuidedDPRBuilder)
   */
  static async chatBuilderStep(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { stepId, stepTitle, factSheet, message, conversationHistory } = req.body || {};
      if (!stepId) {
        res.status(400).json({
          success: false,
          message: 'stepId is required',
        });
        return;
      }
      if (!message || !String(message).trim()) {
        res.status(400).json({
          success: false,
          message: 'message is required',
        });
        return;
      }

      const data = await DprBuilderAssistService.chatStep({
        stepId,
        stepTitle: stepTitle || stepId,
        factSheet: factSheet || {},
        message: String(message).trim(),
        conversationHistory: Array.isArray(conversationHistory) ? conversationHistory : [],
      });

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error('Error in DPR builder step chat:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get chat response',
        error: error.message,
      });
    }
  }

  /**
   * Get multer middleware for DPR file upload
   */
  static getUploadMiddleware() {
    return upload.single('file');
  }
}