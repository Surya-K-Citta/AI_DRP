import { Response } from 'express';
import { AuthRequest } from '../types';
import { User } from '../models/User.model';
import { Project } from '../models/Project.model';
import { DPRVersion } from '../models/DPRVersion.model';
import { Feedback } from '../models/Feedback.model';
import { DPRAnalytics } from '../models/DPRAnalytics.model';
import { Policy } from '../models/Policy.model';
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

      // Document and RAG analytics
      const { Document } = await import('../models/Document.model');
      const { VectorStore } = await import('../models/VectorStore.model');

      const totalDocuments = await Document.countDocuments();

      // Get all vector stores (excluding system-created ones for populate safety)
      let vectorStores = await VectorStore.find({ createdBy: { $ne: 'system' } }).populate('createdBy', 'name email');

      // Ensure main vector store is included
      const mainVectorStoreId = process.env.MAIN_VECTOR_STORE_ID || ' ';
      const mainVectorStoreExists = vectorStores.some(store => store.openaiVectorStoreId === mainVectorStoreId);
      if (!mainVectorStoreExists) {
        try {
          // Create the main vector store record in database
          const mainVectorStore = await VectorStore.create({
            openaiVectorStoreId: mainVectorStoreId,
            name: 'MSME Knowledge Base',
            description: 'Main knowledge base for MSME DPR assistance',
            fileCount: 0,
            totalSize: 0,
            status: 'ready',
            createdBy: 'system',
            metadata: {
              isDefault: true,
              purpose: 'dpr-assistance',
              category: 'general'
            }
          });
          // Add main vector store without populating createdBy
          const mainVectorStoreObj = mainVectorStore.toObject();
          vectorStores.push({
            ...mainVectorStoreObj,
            createdBy: 'system' as any
          });
        } catch (error: any) {
          if (error.code === 11000) {
            // Vector store already exists, fetch it instead
            console.log('Vector store already exists, fetching from database...');
            const mainVectorStoreId = process.env.MAIN_VECTOR_STORE_ID || ' ';
            const existingVectorStore = await VectorStore.findOne({ 
              openaiVectorStoreId: mainVectorStoreId 
            });
            if (existingVectorStore) {
              const existingVectorStoreObj = existingVectorStore.toObject();
              vectorStores.push({
                ...existingVectorStoreObj,
                createdBy: 'system' as any
              });
            }
          } else {
            throw error;
          }
        }
      }

      // Calculate knowledge base size
      const documentsWithSize = await Document.aggregate([
        {
          $group: {
            _id: null,
            totalSize: { $sum: '$fileSize' },
            templateCount: {
              $sum: {
                $cond: ['$metadata.isTemplate', 1, 0]
              }
            }
          }
        }
      ]);

      const knowledgeBaseSize = documentsWithSize[0]?.totalSize || 0;
      const templateCount = documentsWithSize[0]?.templateCount || 0;

      // Get RAG performance metrics
      const { RAGMetrics } = await import('../models/RAGMetrics.model');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const ragMetrics = await RAGMetrics.aggregate([
        {
          $match: {
            createdAt: { $gte: today }
          }
        },
        {
          $group: {
            _id: null,
            ragQueriesToday: { $sum: 1 },
            avgResponseTime: { $avg: '$responseTime' },
            minResponseTime: { $min: '$responseTime' },
            maxResponseTime: { $max: '$responseTime' },
            successCount: {
              $sum: { $cond: ['$success', 1, 0] }
            },
            failureCount: {
              $sum: { $cond: ['$success', 0, 1] }
            },
            totalTokens: { $sum: '$tokensUsed' },
            avgTokens: { $avg: '$tokensUsed' }
          }
        }
      ]);

      const ragStats = ragMetrics[0] || {
        ragQueriesToday: 0,
        avgResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        successCount: 0,
        failureCount: 0,
        totalTokens: 0,
        avgTokens: 0
      };

      // Calculate success rate
      const successRate = ragStats.ragQueriesToday > 0
        ? (ragStats.successCount / ragStats.ragQueriesToday) * 100
        : 0;

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
            totalDocuments,
            vectorStoreCount: vectorStores.length,
            knowledgeBaseSize,
            templateCount,
            ragQueriesToday: ragStats.ragQueriesToday,
            avgResponseTime: Math.round(ragStats.avgResponseTime || 0),
            minResponseTime: ragStats.minResponseTime || 0,
            maxResponseTime: ragStats.maxResponseTime || 0,
            ragSuccessRate: Math.round(successRate * 100) / 100,
            ragSuccessCount: ragStats.successCount,
            ragFailureCount: ragStats.failureCount,
            totalTokensUsed: ragStats.totalTokens || 0,
            avgTokensPerQuery: Math.round(ragStats.avgTokens || 0),
          },
          projectsBySector,
          projectsByLocation,
          recentProjects,
          monthlyTrend,
          dprQualityStats: dprQualityStats[0] || {},
          fundingOutcomes,
          sectorDPRPerformance,
          mlInsights,
          vectorStores,
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

  /**
   * Update user (admin only)
   */
  static async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, email, role, location, phoneNumber, udyamNumber } = req.body;

      // Prevent admin from changing their own role
      if (id === req.user?.userId && role && role !== req.user?.role) {
        res.status(400).json({
          success: false,
          message: 'You cannot change your own role',
        });
        return;
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (role) updateData.role = role;
      if (location !== undefined) updateData.location = location;
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
      if (udyamNumber !== undefined) updateData.udyamNumber = udyamNumber;

      const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-passwordHash');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { user },
        message: 'User updated successfully',
      });
    } catch (error: any) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: error.message,
      });
    }
  }

  /**
   * Delete user (admin only)
   */
  static async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Prevent admin from deleting themselves
      if (id === req.user?.userId) {
        res.status(400).json({
          success: false,
          message: 'You cannot delete your own account',
        });
        return;
      }

      const user = await User.findByIdAndDelete(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: error.message,
      });
    }
  }

  /**
   * Get all DPRs for admin review
   */
  static async getAllDPRs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, status, search } = req.query;

      const filter: any = {};
      if (status) {
        filter.status = status;
      }

      let query = DPRVersion.find(filter)
        .populate('projectId', 'projectName industrySector location totalCost userId')
        .sort({ createdAt: -1 });

      if (search) {
        query = query.or([
          { 'projectId.projectName': { $regex: search, $options: 'i' } },
          { 'projectId.industrySector': { $regex: search, $options: 'i' } },
        ]);
      }

      const dprs = await query
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

      const total = await DPRVersion.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: {
          dprs,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error: any) {
      console.error('Get all DPRs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch DPRs',
        error: error.message,
      });
    }
  }

  /**
   * Approve DPR (admin only)
   */
  static async approveDPR(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { comments } = req.body;

      const dpr = await DPRVersion.findByIdAndUpdate(
        id,
        {
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: req.user?.userId,
        },
        { new: true }
      ).populate('projectId', 'projectName');

      if (!dpr) {
        res.status(404).json({
          success: false,
          message: 'DPR not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { dpr },
        message: 'DPR approved successfully',
      });
    } catch (error: any) {
      console.error('Approve DPR error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve DPR',
        error: error.message,
      });
    }
  }

  /**
   * Reject DPR (admin only)
   */
  static async rejectDPR(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({
          success: false,
          message: 'Rejection reason is required',
        });
        return;
      }

      const existingDPR = await DPRVersion.findById(id);
      if (!existingDPR) {
        res.status(404).json({
          success: false,
          message: 'DPR not found',
        });
        return;
      }

      const dpr = await DPRVersion.findByIdAndUpdate(
        id,
        {
          status: 'rejected',
          qualityFeedback: {
            ...existingDPR.qualityFeedback?.toObject(),
            feedback: [...(existingDPR.qualityFeedback?.feedback || []), `Admin Rejection: ${reason}`],
          },
        },
        { new: true }
      ).populate('projectId', 'projectName');

      res.status(200).json({
        success: true,
        data: { dpr },
        message: 'DPR rejected successfully',
      });
    } catch (error: any) {
      console.error('Reject DPR error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject DPR',
        error: error.message,
      });
    }
  }

  /**
   * Get all policies
   */
  static async getAllPolicies(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, status, category, search } = req.query;

      const filter: any = {};
      if (status) {
        filter.status = status;
      }
      if (category) {
        filter.category = category;
      }

      let query = Policy.find(filter).sort({ createdAt: -1 });

      if (search) {
        query = query.or([
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
        ]);
      }

      const policies = await query
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      const total = await Policy.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: {
          policies,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error: any) {
      console.error('Get all policies error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch policies',
        error: error.message,
      });
    }
  }

  /**
   * Create policy
   */
  static async createPolicy(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        title,
        description,
        category,
        content,
        version,
        status,
        effectiveDate,
        expiryDate,
        tags,
        appliesTo,
        metadata,
      } = req.body;

      if (!title || !description || !category || !content) {
        res.status(400).json({
          success: false,
          message: 'Title, description, category, and content are required',
        });
        return;
      }

      const policy = await Policy.create({
        title,
        description,
        category,
        content,
        version: version || '1.0.0',
        status: status || 'draft',
        effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        createdBy: req.user?.userId,
        tags: tags || [],
        appliesTo: appliesTo || {},
        metadata: {
          priority: metadata?.priority || 'medium',
          requiresApproval: metadata?.requiresApproval || false,
          relatedPolicies: metadata?.relatedPolicies || [],
        },
      });

      const populatedPolicy = await Policy.findById(policy._id)
        .populate('createdBy', 'name email');

      res.status(201).json({
        success: true,
        data: { policy: populatedPolicy },
        message: 'Policy created successfully',
      });
    } catch (error: any) {
      console.error('Create policy error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create policy',
        error: error.message,
      });
    }
  }

  /**
   * Update policy
   */
  static async updatePolicy(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: any = { updatedBy: req.user?.userId };

      const allowedFields = [
        'title',
        'description',
        'category',
        'content',
        'version',
        'status',
        'effectiveDate',
        'expiryDate',
        'tags',
        'appliesTo',
        'metadata',
      ];

      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          if (field === 'effectiveDate' || field === 'expiryDate') {
            updateData[field] = req.body[field] ? new Date(req.body[field]) : undefined;
          } else {
            updateData[field] = req.body[field];
          }
        }
      });

      const policy = await Policy.findByIdAndUpdate(id, updateData, { new: true })
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      if (!policy) {
        res.status(404).json({
          success: false,
          message: 'Policy not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { policy },
        message: 'Policy updated successfully',
      });
    } catch (error: any) {
      console.error('Update policy error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update policy',
        error: error.message,
      });
    }
  }

  /**
   * Delete policy
   */
  static async deletePolicy(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const policy = await Policy.findByIdAndDelete(id);

      if (!policy) {
        res.status(404).json({
          success: false,
          message: 'Policy not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Policy deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete policy error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete policy',
        error: error.message,
      });
    }
  }

  /**
   * Approve policy
   */
  static async approvePolicy(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const policy = await Policy.findByIdAndUpdate(
        id,
        {
          'metadata.approvalStatus': 'approved',
          'metadata.approvedBy': req.user?.userId,
          'metadata.approvedAt': new Date(),
          status: 'active',
        },
        { new: true }
      )
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .populate('metadata.approvedBy', 'name email');

      if (!policy) {
        res.status(404).json({
          success: false,
          message: 'Policy not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { policy },
        message: 'Policy approved successfully',
      });
    } catch (error: any) {
      console.error('Approve policy error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve policy',
        error: error.message,
      });
    }
  }
}

