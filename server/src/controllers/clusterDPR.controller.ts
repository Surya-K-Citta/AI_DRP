// @ts-nocheck
import { Response } from 'express';
import { AuthRequest } from '../types';
import { ClusterDPRService } from '../services/clusterDPR.service';
import { GeminiService } from '../services/gemini.service';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

export class ClusterDPRController {
  /**
   * Generate Cluster DPR with OpenAI enhancement
   */
  static async generateClusterDPR(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { clusterData, language = 'bilingual' } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!clusterData) {
        res.status(400).json({
          success: false,
          message: 'Cluster data is required',
        });
        return;
      }

      // Validate that at least step 1 data is provided
      if (!clusterData.step1 || !clusterData.step1.clusterName) {
        res.status(400).json({
          success: false,
          message: 'At least basic cluster details (Step 1) are required',
        });
        return;
      }

      console.log(`📝 Generating Cluster DPR for user ${userId}...`);

      // Generate DPR with OpenAI enhancement
      const result = await ClusterDPRService.generateClusterDPR(
        userId,
        clusterData,
        language
      );

      res.status(200).json({
        success: true,
        message: 'Cluster DPR generated successfully',
        data: result,
      });
    } catch (error: any) {
      console.error('❌ Error generating Cluster DPR:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate Cluster DPR',
        error: error.message,
      });
    }
  }

  /**
   * Get Cluster DPR by ID
   */
  static async getClusterDPR(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { dprId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Import DPRVersion model
      const { DPRVersion } = await import('../models/DPRVersion.model');
      
      const dpr = await DPRVersion.findOne({
        _id: dprId,
        userId,
      });

      if (!dpr) {
        res.status(404).json({
          success: false,
          message: 'Cluster DPR not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: dpr,
      });
    } catch (error: any) {
      console.error('Error fetching Cluster DPR:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch Cluster DPR',
        error: error.message,
      });
    }
  }

  /**
   * Setup multer for image uploads
   */
  static getImageUploadMiddleware() {
    return multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = path.join(process.cwd(), 'uploads', 'images');
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
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
        }
      },
    });
  }

  /**
   * Generate image using Gemini API
   */
  static async generateImage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { prompt, sectionType, sectionInfo } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!prompt || !sectionType) {
        res.status(400).json({
          success: false,
          message: 'Prompt and section type are required',
        });
        return;
      }

      console.log(`🎨 Generating image for section: ${sectionType}`);

      // Generate image using Gemini-enhanced prompt with DALL-E
      const imageUrl = await GeminiService.generateImage(prompt, sectionInfo || {});

      res.status(200).json({
        success: true,
        message: 'Image generated successfully',
        data: {
          imageUrl,
          sectionType,
        },
      });
    } catch (error: any) {
      console.error('❌ Error generating image:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate image',
        error: error.message,
      });
    }
  }

  /**
   * Upload image
   */
  static async uploadImage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const file = req.file;
      if (!file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
        return;
      }

      // Return the file path relative to uploads directory
      const imageUrl = `/uploads/images/${file.filename}`;

      res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          imageUrl,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
        },
      });
    } catch (error: any) {
      console.error('❌ Error uploading image:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload image',
        error: error.message,
      });
    }
  }
}
