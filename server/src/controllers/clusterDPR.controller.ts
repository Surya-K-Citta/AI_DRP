// @ts-nocheck
import { Response } from 'express';
import { AuthRequest } from '../types';
import { ClusterDPRService } from '../services/clusterDPR.service';
import { GeminiService } from '../services/gemini.service';
import { CloudinaryService } from '../services/cloudinary.service';
import { Project } from '../models/Project.model';
import { DPRVersion } from '../models/DPRVersion.model';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

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
      
      // Log complete data being sent for generation
      const stepKeys = Object.keys(clusterData).filter(key => key.startsWith('step'));
      console.log(`📊 Complete cluster data received:`, {
        totalSteps: stepKeys.length,
        steps: stepKeys,
        hasStep1: !!clusterData.step1,
        hasStep12: !!clusterData.step12,
        hasStep13: !!clusterData.step13,
        hasStep15: !!clusterData.step15,
        totalKeys: Object.keys(clusterData).length,
      });

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

      // Upload generated image to Cloudinary
      let cloudinaryUrl = imageUrl;
      let cloudinaryPublicId = null;
      try {
        const cloudinaryResult = await CloudinaryService.uploadImageFromUrl(
          imageUrl,
          'msme-dpr/cluster-images/generated'
        );
        cloudinaryUrl = cloudinaryResult.secureUrl;
        cloudinaryPublicId = cloudinaryResult.publicId;
        console.log(`✅ Image uploaded to Cloudinary: ${cloudinaryPublicId}`);
      } catch (cloudinaryError: any) {
        console.error('⚠️ Failed to upload to Cloudinary, using original URL:', cloudinaryError);
        // Continue with original URL if Cloudinary upload fails
      }

      res.status(200).json({
        success: true,
        message: 'Image generated successfully',
        data: {
          imageUrl: cloudinaryUrl,
          originalUrl: imageUrl,
          cloudinaryPublicId,
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

      // Upload to Cloudinary
      let cloudinaryUrl = `/uploads/images/${file.filename}`;
      let cloudinaryPublicId = null;
      try {
        const cloudinaryResult = await CloudinaryService.uploadImage(
          file.path,
          'msme-dpr/cluster-images/uploaded',
          `uploaded-${Date.now()}-${file.filename.replace(/\.[^/.]+$/, '')}`
        );
        cloudinaryUrl = cloudinaryResult.secureUrl;
        cloudinaryPublicId = cloudinaryResult.publicId;
        
        // Delete local file after successful Cloudinary upload
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting local file:', err);
        });
        
        console.log(`✅ Image uploaded to Cloudinary: ${cloudinaryPublicId}`);
      } catch (cloudinaryError: any) {
        console.error('⚠️ Failed to upload to Cloudinary, using local file:', cloudinaryError);
        // Continue with local file path if Cloudinary upload fails
      }

      res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          imageUrl: cloudinaryUrl,
          cloudinaryPublicId,
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

  /**
   * Enhance a specific section of the DPR
   */
  static async enhanceSection(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const { sectionName, sectionData, clusterData } = req.body;

      if (!sectionName || !sectionData) {
        res.status(400).json({
          success: false,
          message: 'Section name and section data are required',
        });
        return;
      }

      console.log(`✨ Enhancing section: ${sectionName} for user ${userId}`);

      const enhancedParagraph = await ClusterDPRService.enhanceSection(
        sectionName,
        sectionData,
        clusterData || {}
      );

      res.status(200).json({
        success: true,
        message: 'Section enhanced successfully',
        data: {
          sectionName,
          enhancedParagraph,
        },
      });
    } catch (error: any) {
      console.error('❌ Error enhancing section:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to enhance section',
        error: error.message,
      });
    }
  }

  /**
   * Delete image from Cloudinary
   */
  /**
   * Save cluster DPR stepData to database (create/update project)
   */
  static async saveClusterDPRDraft(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const { clusterData } = req.body;

      if (!clusterData || !clusterData.step1?.clusterName) {
        res.status(400).json({
          success: false,
          message: 'Cluster data with step1.clusterName is required',
        });
        return;
      }

      // Find or create project for this cluster DPR
      let project = await Project.findOne({
        userId,
        projectName: clusterData.step1.clusterName,
        projectType: 'cluster',
      });

      // Calculate total cost from step 12 if available
      const totalCost = clusterData.step12
        ? (clusterData.step12.land || 0) +
        (clusterData.step12.building || 0) +
        (clusterData.step12.machinery || 0) +
        (clusterData.step12.utilitiesAndInfrastructure || 0) +
        (clusterData.step12.preliminaryAndPreOperative || 0) +
        (clusterData.step12.workingCapitalMargin || 0)
        : 0;

      // Calculate own contribution from step 13 if available
      const ownContribution = clusterData.step13?.spvContribution || 0;
      const loanAmount = clusterData.step13?.bankLoan || 0;

      if (!project) {
        project = await Project.create({
          userId,
          projectName: clusterData.step1.clusterName,
          industrySector: clusterData.step2?.sectorType || 'Cluster Development',
          location: clusterData.step1?.location || '',
          district: clusterData.step1?.district || '',
          projectType: 'cluster',
          totalCost: totalCost || 0,
          ownContribution: ownContribution || 0,
          loanAmount: loanAmount || 0,
          status: 'draft',
          stepData: clusterData,
        });
        console.log('✅ Created new cluster project for draft:', project._id);
      } else {
        // Update existing project
        project.stepData = clusterData;
        project.totalCost = totalCost || project.totalCost || 0;
        project.ownContribution = ownContribution || project.ownContribution || 0;
        project.loanAmount = loanAmount || project.loanAmount || 0;
        project.status = project.status === 'completed' ? 'completed' : 'draft';
        await project.save();
        console.log('✅ Updated cluster project draft:', project._id);
      }

      res.status(200).json({
        success: true,
        message: 'Cluster DPR draft saved successfully',
        data: {
          projectId: project._id.toString(),
          projectName: project.projectName,
        },
      });
    } catch (error: any) {
      console.error('❌ Error saving cluster DPR draft:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save cluster DPR draft',
        error: error.message,
      });
    }
  }

  /**
   * Save enhanced content to DPR
   */
  static async saveEnhancedContent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const { dprId } = req.params;
      const { enhancedContent, language = 'english' } = req.body;

      if (!dprId) {
        res.status(400).json({
          success: false,
          message: 'DPR ID is required',
        });
        return;
      }

      if (!enhancedContent || Object.keys(enhancedContent).length === 0) {
        res.status(400).json({
          success: false,
          message: 'Enhanced content is required',
        });
        return;
      }

      // Find DPR version
      const dprVersion = await DPRVersion.findOne({
        dprId,
        userId,
      });

      if (!dprVersion) {
        res.status(404).json({
          success: false,
          message: 'DPR not found',
        });
        return;
      }

      // Update enhanced content in DPR content
      const contentKey = language === 'telugu' ? 'telugu' : 'english';
      if (!dprVersion.content[contentKey]) {
        dprVersion.content[contentKey] = {};
      }

      dprVersion.content[contentKey].enhancedContent = {
        ...(dprVersion.content[contentKey].enhancedContent || {}),
        ...enhancedContent,
      };

      await dprVersion.save();
      console.log(`✅ Saved ${Object.keys(enhancedContent).length} enhanced content sections to DPR ${dprId}`);

      res.status(200).json({
        success: true,
        message: 'Enhanced content saved successfully',
        data: {
          dprId,
          enhancedContentSections: Object.keys(enhancedContent).length,
        },
      });
    } catch (error: any) {
      console.error('❌ Error saving enhanced content:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save enhanced content',
        error: error.message,
      });
    }
  }

  static async deleteImage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const { imageUrl, publicId } = req.body;

      if (!imageUrl && !publicId) {
        res.status(400).json({
          success: false,
          message: 'Image URL or public ID is required',
        });
        return;
      }

      // Extract public ID from URL if not provided
      let imagePublicId = publicId;
      if (!imagePublicId && imageUrl) {
        imagePublicId = CloudinaryService.extractPublicId(imageUrl);
      }

      if (!imagePublicId) {
        res.status(400).json({
          success: false,
          message: 'Could not extract public ID from image URL',
        });
        return;
      }

      // Delete from Cloudinary
      const deleted = await CloudinaryService.deleteImage(imagePublicId);

      if (deleted) {
        res.status(200).json({
          success: true,
          message: 'Image deleted successfully',
          data: {
            publicId: imagePublicId,
          },
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Image not found in Cloudinary',
        });
      }
    } catch (error: any) {
      console.error('❌ Error deleting image:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete image',
        error: error.message,
      });
    }
  }

  /**
   * Get AI suggestions for cluster step
   */
  static async getAISuggestions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const { currentStep, currentStepData, previousStepsData } = req.body;

      if (currentStep === undefined || !currentStepData) {
        res.status(400).json({
          success: false,
          message: 'Current step and step data are required',
        });
        return;
      }

      console.log(`🤖 Getting AI suggestions for step ${currentStep}`);

      const suggestions = await ClusterDPRService.getAISuggestionsForStep(
        currentStep,
        currentStepData,
        previousStepsData || {}
      );

      res.status(200).json({
        success: true,
        message: 'AI suggestions retrieved successfully',
        data: {
          suggestions,
        },
      });
    } catch (error: any) {
      console.error('❌ Error getting AI suggestions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get AI suggestions',
        error: error.message,
      });
    }
  }

  /**
   * Get AI field suggestion
   */
  static async getFieldSuggestion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const { fieldName, fieldValue, context } = req.body;

      if (!fieldName) {
        res.status(400).json({
          success: false,
          message: 'Field name is required',
        });
        return;
      }

      const suggestion = await ClusterDPRService.getFieldSuggestion(
        fieldName,
        fieldValue,
        context || {}
      );

      res.status(200).json({
        success: true,
        message: 'Field suggestion retrieved successfully',
        data: {
          suggestion,
        },
      });
    } catch (error: any) {
      console.error('❌ Error getting field suggestion:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get field suggestion',
        error: error.message,
      });
    }
  }

  /**
   * Generate field content based on suggestion
   */
  static async generateFieldContent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const { fieldName, currentStep, currentStepData, previousStepsData, suggestion } = req.body;

      if (!fieldName || !currentStep || !suggestion) {
        res.status(400).json({
          success: false,
          message: 'Field name, current step, and suggestion are required',
        });
        return;
      }

      const content = await ClusterDPRService.generateFieldContent(
        fieldName,
        currentStep,
        currentStepData || {},
        previousStepsData || {},
        suggestion
      );

      res.status(200).json({
        success: true,
        message: 'Field content generated successfully',
        data: {
          content,
        },
      });
    } catch (error: any) {
      console.error('❌ Error generating field content:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate field content',
        error: error.message,
      });
    }
  }
}
