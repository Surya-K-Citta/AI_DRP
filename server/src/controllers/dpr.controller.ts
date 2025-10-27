import { Response } from 'express';
import { AuthRequest } from '../types';
import { DPRService } from '../services/dpr.service';
import { Project } from '../models/Project.model';

export class DPRController {
  /**
   * Generate DPR for a project
   */
  static async generateDPR(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const { language = 'bilingual' } = req.body;
      const userId = req.user?.userId;

      // Verify project ownership
      const project = await Project.findOne({ _id: projectId, userId });
      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project not found',
        });
        return;
      }

      // Generate DPR (async process)
      const dpr = await DPRService.generateDPR(projectId, language);

      res.status(200).json({
        success: true,
        message: 'DPR generated successfully',
        data: dpr,
      });
    } catch (error: any) {
      console.error('Generate DPR error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate DPR',
        error: error.message,
      });
    }
  }

  /**
   * Get DPR status
   */
  static async getDPRStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { dprId } = req.params;

      const dpr = await DPRService.getDPR(dprId);

      res.status(200).json({
        success: true,
        data: {
          dprId: dpr._id,
          status: 'completed',
          versionNumber: dpr.versionNumber,
          generatedAt: dpr.generatedAt,
        },
      });
    } catch (error: any) {
      console.error('Get DPR status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch DPR status',
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
      const userId = req.user?.userId;

      const dpr = await DPRService.getDPR(dprId);

      // Verify ownership through project
      const project = await Project.findOne({ _id: dpr.projectId, userId });
      if (!project) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: dpr,
      });
    } catch (error: any) {
      console.error('Get DPR error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch DPR',
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
      const userId = req.user?.userId;

      // Verify project ownership
      const project = await Project.findOne({ _id: projectId, userId });
      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project not found',
        });
        return;
      }

      const dprs = await DPRService.getProjectDPRs(projectId);

      res.status(200).json({
        success: true,
        data: dprs,
      });
    } catch (error: any) {
      console.error('Get project DPRs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch DPRs',
        error: error.message,
      });
    }
  }

  /**
   * Download DPR as PDF
   */
  static async downloadPDF(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { dprId } = req.params;
      const { language = 'english' } = req.query;
      const userId = req.user?.userId;

      const dpr = await DPRService.getDPR(dprId);

      // Verify ownership
      const project = await Project.findOne({ _id: dpr.projectId, userId });
      if (!project) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      const pdfBuffer = await DPRService.generatePDF(
        dprId,
        language as 'english' | 'telugu'
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=DPR_${project.projectName.replace(/\s+/g, '_')}.pdf`
      );
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Download PDF error:', error);
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
      const userId = req.user?.userId;

      const dpr = await DPRService.getDPR(dprId);

      // Verify ownership
      const project = await Project.findOne({ _id: dpr.projectId, userId });
      if (!project) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

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
        `attachment; filename=DPR_${project.projectName.replace(/\s+/g, '_')}.docx`
      );
      res.send(docxBuffer);
    } catch (error: any) {
      console.error('Download DOCX error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download DOCX',
        error: error.message,
      });
    }
  }
}

