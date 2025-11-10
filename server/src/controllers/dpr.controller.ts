import { Request, Response } from 'express';
import { OpenAIService } from '../services/openai.service';
import { DPRTemplate } from '../models/DPRTemplate.model';
import { DPRSession } from '../models/DPRSession.model';
import { Document } from '../models/Document.model';
import { DPRService } from '../services/dpr.service';
import { AuthRequest } from '../types';

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
        const template = await DPRTemplate.findById(session.templateId);
        if (template) {
          const generatedDPR = await OpenAIService.generateCompleteDPR(
            template.structure,
            session.responses,
            session.metadata.language
          );
          session.generatedDPR = generatedDPR;
        }

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
      const generatedDPR = await OpenAIService.generateCompleteDPR(
        template.structure,
        responses,
        language
      );

      // Update template usage count
      await DPRTemplate.findByIdAndUpdate(template._id, {
        $inc: { usageCount: 1 }
      });

      res.status(200).json({
        success: true,
        message: 'DPR generated successfully',
        data: {
          dpr: generatedDPR,
          template: {
            name: template.name,
            category: template.category,
          },
        },
      });
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
      const { projectId } = req.params;
      const { language = 'bilingual' } = req.body;

      const dpr = await DPRService.generateDPR(projectId, language);

      res.status(200).json({
        success: true,
        message: 'DPR generated successfully',
        data: dpr,
      });
    } catch (error: any) {
      console.error('Error generating DPR:', error);
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
      const { projectId } = req.params;

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
      const { dprId } = req.params;

      const dpr = await DPRService.getDPR(dprId);

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

      const pdfBuffer = await DPRService.generatePDF(
        dprId,
        language as 'english' | 'telugu'
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="DPR_${dprId}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
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
      const generatedDPR = await OpenAIService.generateCompleteDPR(
        template.structure,
        responses,
        language
      );

      // Update template usage count if it's a database template
      if (template._id) {
        await DPRTemplate.findByIdAndUpdate(template._id, {
          $inc: { usageCount: 1 }
        });
      }

      res.status(200).json({
        success: true,
        message: 'Enhanced DPR generated successfully',
        data: {
          dpr: generatedDPR,
          template: {
            name: template.name,
            category: template.category,
            source: templateStructure ? 'RAG-extracted' : 'database',
            sourceDocuments: templateStructure?.sourceDocuments || [],
          },
        },
      });
    } catch (error: any) {
      console.error('Error generating enhanced DPR from chat:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate enhanced DPR',
        error: error.message,
      });
    }
  }
}