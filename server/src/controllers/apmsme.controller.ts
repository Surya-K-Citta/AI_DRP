import { Response } from 'express';
import { AuthRequest } from '../types';
import { APMSMEService } from '../services/apmsme.service';

export class APMSMEController {
  /**
   * Get available schemes from AP MSME ONE Portal
   */
  static async getSchemes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const schemes = await APMSMEService.getAvailableSchemes();

      res.status(200).json({
        success: true,
        data: {
          schemes,
          total: schemes.length,
        },
      });
    } catch (error: any) {
      console.error('Get schemes error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch schemes',
        error: error.message,
      });
    }
  }

  /**
   * Get sector-specific guidelines
   */
  static async getSectorGuidelines(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { sector } = req.params;

      if (!sector) {
        res.status(400).json({
          success: false,
          message: 'Sector parameter is required',
        });
        return;
      }

      const guidelines = await APMSMEService.getSectorGuidelines(sector);

      res.status(200).json({
        success: true,
        data: guidelines,
      });
    } catch (error: any) {
      console.error('Get sector guidelines error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sector guidelines',
        error: error.message,
      });
    }
  }

  /**
   * Get financial institutions
   */
  static async getFinancialInstitutions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const institutions = await APMSMEService.getFinancialInstitutions();

      res.status(200).json({
        success: true,
        data: {
          institutions,
          total: institutions.length,
        },
      });
    } catch (error: any) {
      console.error('Get financial institutions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch financial institutions',
        error: error.message,
      });
    }
  }

  /**
   * Submit DPR to AP MSME ONE Portal
   */
  static async submitDPR(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { projectId, dprId } = req.params;
      const { selectedScheme, additionalData } = req.body;

      if (!projectId || !dprId) {
        res.status(400).json({
          success: false,
          message: 'Project ID and DPR ID are required',
        });
        return;
      }

      // Prepare DPR data for submission
      const dprData = {
        projectId,
        dprId,
        selectedScheme,
        additionalData,
        submittedAt: new Date(),
        submittedBy: req.user?.userId,
      };

      const result = await APMSMEService.submitDPR(dprData);

      res.status(200).json({
        success: true,
        data: {
          submissionId: result.submissionId,
          status: result.status,
          message: 'DPR submitted successfully to AP MSME ONE Portal',
        },
      });
    } catch (error: any) {
      console.error('Submit DPR error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit DPR to AP MSME ONE Portal',
        error: error.message,
      });
    }
  }

  /**
   * Check DPR status in AP MSME ONE Portal
   */
  static async checkDPRStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { dprId } = req.params;

      if (!dprId) {
        res.status(400).json({
          success: false,
          message: 'DPR ID is required',
        });
        return;
      }

      const status = await APMSMEService.checkDPRStatus(dprId);

      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      console.error('Check DPR status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check DPR status',
        error: error.message,
      });
    }
  }

  /**
   * Get entrepreneur profile from AP MSME ONE Portal
   */
  static async getEntrepreneurProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { entrepreneurId } = req.params;

      if (!entrepreneurId) {
        res.status(400).json({
          success: false,
          message: 'Entrepreneur ID is required',
        });
        return;
      }

      const profile = await APMSMEService.getEntrepreneurProfile(entrepreneurId);

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      console.error('Get entrepreneur profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch entrepreneur profile',
        error: error.message,
      });
    }
  }
}
