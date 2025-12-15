// @ts-nocheck
import { Response } from 'express';
import { AuthRequest } from '../types';
import { SchemeService } from '../services/scheme.service';
import { Project } from '../models/Project.model';
import { Scheme } from '../models/Scheme.model';

export class SchemeController {
  /**
   * Get all available schemes
   */
  static async getAllSchemes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const schemes = await Scheme.find().sort({ schemeName: 1 });

      res.status(200).json({
        success: true,
        data: schemes,
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
   * Get scheme by code
   */
  static async getScheme(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { schemeCode } = req.params;

      const scheme = await Scheme.findOne({ schemeCode });

      if (!scheme) {
        res.status(404).json({
          success: false,
          message: 'Scheme not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: scheme,
      });
    } catch (error: any) {
      console.error('Get scheme error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch scheme',
        error: error.message,
      });
    }
  }

  /**
   * Recommend schemes for a project
   */
  static async recommendSchemes(req: AuthRequest, res: Response): Promise<void> {
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

      // Get scheme matches
      const matches = await SchemeService.matchSchemes(project);

      // Format response to match frontend expectations
      // Frontend expects array of scheme objects with schemeCode, schemeName, description, etc.
      const formattedSchemes = matches.map((match: any) => {
        const scheme = match.scheme || match;
        return {
          _id: scheme._id || scheme.schemeCode,
          schemeCode: scheme.schemeCode,
          schemeName: scheme.schemeName || scheme.name,
          description: scheme.description || match.matchReason || 'Government scheme for MSME projects',
          eligibility: scheme.eligibility || {},
          benefits: scheme.benefits || {},
          documentsRequired: scheme.documentsRequired || [],
          status: scheme.status || 'active',
          category: scheme.category || 'Central Government',
          portal: scheme.portal || '',
          confidenceScore: match.confidenceScore,
          matchReason: match.matchReason
        };
      });

      res.status(200).json({
        success: true,
        message: 'Schemes matched successfully',
        data: formattedSchemes,
      });
    } catch (error: any) {
      console.error('Recommend schemes error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to recommend schemes',
        error: error.message,
      });
    }
  }

  /**
   * Select a scheme for a project
   */
  static async selectScheme(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { projectId, schemeCode } = req.params;
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

      await SchemeService.selectScheme(projectId, schemeCode);

      res.status(200).json({
        success: true,
        message: 'Scheme selected successfully',
      });
    } catch (error: any) {
      console.error('Select scheme error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to select scheme',
        error: error.message,
      });
    }
  }
}

