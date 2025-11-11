// @ts-nocheck
import { Response } from 'express';
import { AuthRequest } from '../types';
import { Feedback } from '../models/Feedback.model';
import { Project } from '../models/Project.model';

export class FeedbackController {
  /**
   * Submit feedback for a project
   */
  static async submitFeedback(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const userId = req.user?.userId;
      const { rating, comments, feedbackType } = req.body;

      // Verify project ownership
      const project = await Project.findOne({ _id: projectId, userId });
      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project not found',
        });
        return;
      }

      const feedback = await Feedback.create({
        projectId,
        userId,
        rating,
        comments,
        feedbackType: feedbackType || 'general',
      });

      res.status(201).json({
        success: true,
        message: 'Feedback submitted successfully',
        data: feedback,
      });
    } catch (error: any) {
      console.error('Submit feedback error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit feedback',
        error: error.message,
      });
    }
  }

  /**
   * Get feedback for a project
   */
  static async getProjectFeedback(req: AuthRequest, res: Response): Promise<void> {
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

      const feedback = await Feedback.find({ projectId }).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: feedback,
      });
    } catch (error: any) {
      console.error('Get feedback error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback',
        error: error.message,
      });
    }
  }
}

