import { Request, Response } from 'express';
import { OpenAIService } from '../services/openai.service';
import { DPRTemplate } from '../models/DPRTemplate.model';
import { DPRSession } from '../models/DPRSession.model';
import { Document } from '../models/Document.model';
import { DPRService } from '../services/dpr.service';
import { QualityService } from '../services/quality.service';
import { DPRVersion } from '../models/DPRVersion.model';
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
      const { projectId } = req.params;
      const { language = 'bilingual' } = req.body;

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

      // Update content
      if (content && language) {
        if (language === 'english' || language === 'telugu') {
          const langKey = language as 'english' | 'telugu';
          dpr.content[langKey] = { ...dpr.content[langKey], ...content };
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
      const projects = await Project.find({ userId });
      const projectIds = projects.map(p => p._id.toString());

      if (projectIds.length === 0) {
        res.status(200).json({
          success: true,
          data: [],
        });
        return;
      }

      const dprs = await DPRVersion.find({ projectId: { $in: projectIds } })
        .sort({ createdAt: -1 })
        .lean(); // Use lean() for faster queries

      // Manually populate project data since projectId is stored as String
      const dprsWithProjects = await Promise.all(
        dprs.map(async (dpr: any) => {
          const project = await Project.findById(dpr.projectId)
            .select('projectName industrySector location')
            .lean();
          return {
            ...dpr,
            projectId: project || { projectName: 'Unknown Project', industrySector: 'Unknown', location: 'Unknown' },
          };
        })
      );

      console.log(`📊 Retrieved ${dprsWithProjects.length} DPRs for user ${userId}`);

      res.status(200).json({
        success: true,
        data: dprsWithProjects,
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
      const { dprId } = req.params;
      const { language = 'english' } = req.query;

      const dpr = await DPRService.getDPR(dprId);
      const project = dpr.projectId;
      const contentLang = language === 'telugu' ? dpr.content.telugu : dpr.content.english;

      // Try to use exceljs if available, otherwise use CSV
      try {
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('DPR');

        // Add title
        worksheet.addRow(['Detailed Project Report']);
        worksheet.addRow([project.projectName]);
        worksheet.addRow([]);

        // Add sections
        const sections = [
          { title: 'Executive Summary', content: contentLang.executiveSummary },
          { title: 'Business Profile', content: contentLang.businessProfile },
          { title: 'Market Analysis', content: contentLang.marketAnalysis },
          { title: 'Technical Feasibility', content: contentLang.technicalFeasibility },
          { title: 'Financial Projections', content: contentLang.financialProjections },
          { title: 'Conclusion', content: contentLang.conclusion },
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
}