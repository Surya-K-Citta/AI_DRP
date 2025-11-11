// @ts-nocheck
import { Response } from 'express';
import { Project } from '../models/Project.model';
import { AuthRequest } from '../types';

export class ProjectController {
  /**
   * Create new project
   */
  static async createProject(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const projectData = req.body;

      const project = await Project.create({
        ...projectData,
        userId,
        status: 'draft',
      });

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: project,
      });
    } catch (error: any) {
      console.error('Create project error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create project',
        error: error.message,
      });
    }
  }

  /**
   * Get all projects for current user
   */
  static async getUserProjects(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { status, limit = 20, page = 1 } = req.query;

      const filter: any = { userId };
      if (status) {
        filter.status = status;
      }

      const projects = await Project.find(filter)
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
      console.error('Get projects error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch projects',
        error: error.message,
      });
    }
  }

  /**
   * Get project by ID
   */
  static async getProject(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const project = await Project.findOne({ _id: id, userId });

      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error: any) {
      console.error('Get project error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch project',
        error: error.message,
      });
    }
  }

  /**
   * Update project
   */
  static async updateProject(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const updates = req.body;

      const project = await Project.findOneAndUpdate(
        { _id: id, userId },
        updates,
        { new: true, runValidators: true }
      );

      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Project updated successfully',
        data: project,
      });
    } catch (error: any) {
      console.error('Update project error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update project',
        error: error.message,
      });
    }
  }

  /**
   * Delete project
   */
  static async deleteProject(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const project = await Project.findOneAndDelete({ _id: id, userId });

      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete project error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete project',
        error: error.message,
      });
    }
  }
}

