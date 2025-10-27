import { Response } from 'express';
import { AuthRequest } from '../types';
import { User } from '../models/User.model';
import { Project } from '../models/Project.model';
import { DPRVersion } from '../models/DPRVersion.model';
import { Feedback } from '../models/Feedback.model';
import { DPRAnalytics } from '../models/DPRAnalytics.model';
import { MLService } from '../services/ml.service';

export class AdminController {
  /**
   * Get analytics and statistics
   */
  static async getAnalytics(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Total users
      const totalUsers = await User.countDocuments();
      const totalEntrepreneurs = await User.countDocuments({ role: 'entrepreneur' });

      // Total projects
      const totalProjects = await Project.countDocuments();
      const completedProjects = await Project.countDocuments({ status: 'completed' });
      const inProgressProjects = await Project.countDocuments({ status: 'in-progress' });
      const draftProjects = await Project.countDocuments({ status: 'draft' });

      // Total DPRs generated
      const totalDPRs = await DPRVersion.countDocuments();

      // Average rating
      const feedbackStats = await Feedback.aggregate([
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalFeedback: { $sum: 1 },
          },
        },
      ]);

      // Projects by sector
      const projectsBySector = await Project.aggregate([
        {
          $group: {
            _id: '$industrySector',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);

      // Projects by location
      const projectsByLocation = await Project.aggregate([
        {
          $group: {
            _id: '$location',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);

      // Recent projects
      const recentProjects = await Project.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'name email');

      // Monthly project creation trend
      const monthlyTrend = await Project.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 },
      ]);

      // DPR Quality Analytics
      const dprQualityStats = await DPRAnalytics.aggregate([
        {
          $group: {
            _id: null,
            avgQualityScore: { $avg: '$qualityScore' },
            avgCompletenessScore: { $avg: '$completenessScore' },
            avgBankabilityScore: { $avg: '$bankabilityScore' },
            avgUserSatisfaction: { $avg: '$userSatisfactionScore' },
            totalAnalytics: { $sum: 1 },
          },
        },
      ]);

      // Funding outcomes
      const fundingOutcomes = await DPRAnalytics.aggregate([
        {
          $group: {
            _id: '$fundingOutcome',
            count: { $sum: 1 },
            avgLoanAmount: { $avg: '$loanAmountApproved' },
          },
        },
      ]);

      // Sector-wise DPR performance
      const sectorDPRPerformance = await DPRAnalytics.aggregate([
        {
          $lookup: {
            from: 'projects',
            localField: 'projectId',
            foreignField: '_id',
            as: 'project',
          },
        },
        { $unwind: '$project' },
        {
          $group: {
            _id: '$project.industrySector',
            avgQualityScore: { $avg: '$qualityScore' },
            avgBankabilityScore: { $avg: '$bankabilityScore' },
            count: { $sum: 1 },
            approvalRate: {
              $avg: {
                $cond: [{ $eq: ['$fundingOutcome', 'approved'] }, 1, 0],
              },
            },
          },
        },
        { $sort: { avgQualityScore: -1 } },
      ]);

      // Get ML insights
      const mlInsights = await MLService.getMLInsights();

      res.status(200).json({
        success: true,
        data: {
          summary: {
            totalUsers,
            totalEntrepreneurs,
            totalProjects,
            completedProjects,
            inProgressProjects,
            draftProjects,
            totalDPRs,
            averageRating: feedbackStats[0]?.averageRating?.toFixed(2) || 0,
            totalFeedback: feedbackStats[0]?.totalFeedback || 0,
            avgQualityScore: dprQualityStats[0]?.avgQualityScore?.toFixed(2) || 0,
            avgBankabilityScore: dprQualityStats[0]?.avgBankabilityScore?.toFixed(2) || 0,
            totalAnalytics: dprQualityStats[0]?.totalAnalytics || 0,
          },
          projectsBySector,
          projectsByLocation,
          recentProjects,
          monthlyTrend,
          dprQualityStats: dprQualityStats[0] || {},
          fundingOutcomes,
          sectorDPRPerformance,
          mlInsights,
        },
      });
    } catch (error: any) {
      console.error('Get analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics',
        error: error.message,
      });
    }
  }

  /**
   * Get all users (admin only)
   */
  static async getAllUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, role } = req.query;

      const filter: any = {};
      if (role) {
        filter.role = role;
      }

      const users = await User.find(filter)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

      const total = await User.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error: any) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: error.message,
      });
    }
  }

  /**
   * Get all projects (admin only)
   */
  static async getAllProjects(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, status, sector } = req.query;

      const filter: any = {};
      if (status) {
        filter.status = status;
      }
      if (sector) {
        filter.industrySector = sector;
      }

      const projects = await Project.find(filter)
        .populate('userId', 'name email location')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

      const total = await Project.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: {
          projects,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error: any) {
      console.error('Get all projects error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch projects',
        error: error.message,
      });
    }
  }

  /**
   * Get all feedback (admin only)
   */
  static async getAllFeedback(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, feedbackType } = req.query;

      const filter: any = {};
      if (feedbackType) {
        filter.feedbackType = feedbackType;
      }

      const feedback = await Feedback.find(filter)
        .populate('userId', 'name email')
        .populate('projectId', 'projectName industrySector')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

      const total = await Feedback.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: {
          feedback,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error: any) {
      console.error('Get all feedback error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback',
        error: error.message,
      });
    }
  }
}

