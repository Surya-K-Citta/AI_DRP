// @ts-nocheck
import { Response } from 'express';
import { AuthRequest } from '../types';
import { ClusterDPRService } from '../services/clusterDPR.service';
import { GeminiService } from '../services/gemini.service';
import { CloudinaryService } from '../services/cloudinary.service';
import { Project } from '../models/Project.model';
import { DPRVersion } from '../models/DPRVersion.model';
import { ClusterSection } from '../models/ClusterSection.model';
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

      // Fetch all cluster sections for this DPR
      const clusterSections = await ClusterSection.find({
        dprId,
        userId,
      });

      // Organize sections by language and type
      const sectionsByLanguage: Record<string, Record<string, any>> = {
        english: {},
        telugu: {},
      };

      clusterSections.forEach((section) => {
        const lang = section.language;
        sectionsByLanguage[lang][section.sectionType] = {
          content: section.content,
          generatedContent: section.generatedContent,
          enhancedContent: section.enhancedContent,
          isApplied: section.isApplied,
          version: section.version,
        };
      });

      // Add sections to DPR response
      const dprData = dpr.toObject();
      dprData.clusterSections = sectionsByLanguage;

      res.status(200).json({
        success: true,
        data: dprData,
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
   * Get all sections for a DPR
   */
  static async getClusterSections(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { dprId } = req.params;
      const { language = 'english' } = req.query;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Verify DPR exists
      const dpr = await DPRVersion.findOne({
        _id: dprId,
        userId,
      });

      if (!dpr) {
        res.status(404).json({
          success: false,
          message: 'DPR not found',
        });
        return;
      }

      // Fetch cluster sections
      const sections = await ClusterSection.find({
        dprId,
        userId,
        language: language as 'english' | 'telugu',
      });

      res.status(200).json({
        success: true,
        data: {
          sections: sections.map((s) => ({
            sectionType: s.sectionType,
            content: s.content,
            generatedContent: s.generatedContent,
            enhancedContent: s.enhancedContent,
            isApplied: s.isApplied,
            version: s.version,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
          })),
        },
      });
    } catch (error: any) {
      console.error('Error fetching cluster sections:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch cluster sections',
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

      // Create or update DPRVersion record
      let dprVersion = await DPRVersion.findOne({
        projectId: project._id.toString(),
        userId,
        status: 'draft',
      }).sort({ createdAt: -1 });

      if (!dprVersion) {
        // Create base DPRVersion record
        dprVersion = await DPRVersion.create({
          projectId: project._id.toString(),
          userId,
          versionNumber: 1,
          status: 'draft',
          language: 'bilingual',
          content: {
            english: {
              isClusterDPR: true,
              clusterData: clusterData,
            },
            telugu: {
              isClusterDPR: true,
              clusterData: clusterData,
            },
          },
        });
        console.log('✅ Created base DPRVersion record:', dprVersion._id);
      } else {
        // Update existing DPRVersion with latest clusterData
        if (!dprVersion.content.english) {
          dprVersion.content.english = {};
        }
        if (!dprVersion.content.telugu) {
          dprVersion.content.telugu = {};
        }
        dprVersion.content.english.isClusterDPR = true;
        dprVersion.content.english.clusterData = clusterData;
        dprVersion.content.telugu.isClusterDPR = true;
        dprVersion.content.telugu.clusterData = clusterData;
        await dprVersion.save();
        console.log('✅ Updated DPRVersion record:', dprVersion._id);
      }

      res.status(200).json({
        success: true,
        message: 'Cluster DPR draft saved successfully',
        data: {
          projectId: project._id.toString(),
          dprId: dprVersion._id.toString(),
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

      // Find DPR version by _id (not dprId)
      const dprVersion = await DPRVersion.findOne({
        _id: dprId,
        userId,
      });

      if (!dprVersion) {
        res.status(404).json({
          success: false,
          message: 'DPR not found',
        });
        return;
      }

      // Store enhanced content in ClusterSection model
      const lang = language === 'telugu' ? 'telugu' : 'english';
      const sectionPromises = Object.entries(enhancedContent).map(async ([sectionType, content]) => {
        // Find or create cluster section
        let clusterSection = await ClusterSection.findOne({
          dprId,
          userId,
          sectionType,
          language: lang,
        });

        if (clusterSection) {
          // Update existing section with enhanced content
          clusterSection.enhancedContent = content as string;
          clusterSection.version += 1;
          await clusterSection.save();
        } else {
          // Create new cluster section
          clusterSection = await ClusterSection.create({
            userId,
            dprId,
            sectionType,
            language: lang,
            content: '', // Empty initially, will be filled when applied
            enhancedContent: content as string,
            isApplied: false,
            version: 1,
          });
        }

        return clusterSection;
      });

      await Promise.all(sectionPromises);

      // Also update DPRVersion for backward compatibility
      const contentKey = lang;
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

  /**
   * Store generated sections separately (for user review before applying)
   */
  static async storeGeneratedSections(req: AuthRequest, res: Response): Promise<void> {
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
      const { generatedSections, language = 'english' } = req.body;

      if (!dprId) {
        res.status(400).json({
          success: false,
          message: 'DPR ID is required',
        });
        return;
      }

      if (!generatedSections || Object.keys(generatedSections).length === 0) {
        res.status(400).json({
          success: false,
          message: 'Generated sections are required',
        });
        return;
      }

      // Verify DPR exists and belongs to user
      const dprVersion = await DPRVersion.findOne({
        _id: dprId,
        userId,
      });

      if (!dprVersion) {
        res.status(404).json({
          success: false,
          message: 'DPR not found',
        });
        return;
      }

      // Store each generated section in ClusterSection model
      const lang = language === 'telugu' ? 'telugu' : 'english';
      const sectionPromises = Object.entries(generatedSections).map(async ([sectionType, content]) => {
        // Find or create cluster section
        let clusterSection = await ClusterSection.findOne({
          dprId,
          userId,
          sectionType,
          language: lang,
        });

        if (clusterSection) {
          // Update existing section with generated content
          clusterSection.generatedContent = content as string;
          clusterSection.version += 1;
          await clusterSection.save();
        } else {
          // Create new cluster section
          clusterSection = await ClusterSection.create({
            userId,
            dprId,
            sectionType,
            language: lang,
            content: '', // Empty initially, will be filled when applied
            generatedContent: content as string,
            isApplied: false,
            version: 1,
          });
        }

        return clusterSection;
      });

      await Promise.all(sectionPromises);
      console.log(`✅ Stored ${Object.keys(generatedSections).length} generated sections for DPR ${dprId}`);

      res.status(200).json({
        success: true,
        message: 'Generated sections stored successfully',
        data: {
          dprId,
          generatedSectionsCount: Object.keys(generatedSections).length,
        },
      });
    } catch (error: any) {
      console.error('❌ Error storing generated sections:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to store generated sections',
        error: error.message,
      });
    }
  }

  /**
   * Apply a generated section (replace current section content)
   */
  static async applyGeneratedSection(req: AuthRequest, res: Response): Promise<void> {
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
      const { sectionName, language = 'english' } = req.body;

      if (!dprId || !sectionName) {
        res.status(400).json({
          success: false,
          message: 'DPR ID and section name are required',
        });
        return;
      }

      // Verify DPR exists
      const dprVersion = await DPRVersion.findOne({
        _id: dprId,
        userId,
      });

      if (!dprVersion) {
        res.status(404).json({
          success: false,
          message: 'DPR not found',
        });
        return;
      }

      const lang = language === 'telugu' ? 'telugu' : 'english';

      // Find cluster section with generated content
      const clusterSection = await ClusterSection.findOne({
        dprId,
        userId,
        sectionType: sectionName,
        language: lang,
      });

      if (!clusterSection || !clusterSection.generatedContent) {
        res.status(404).json({
          success: false,
          message: `Generated section "${sectionName}" not found`,
        });
        return;
      }

      // Apply generated content to the section
      clusterSection.content = clusterSection.generatedContent;
      clusterSection.isApplied = true;
      clusterSection.version += 1;
      await clusterSection.save();

      // Also update DPRVersion content for backward compatibility
      const contentKey = lang;
      if (!dprVersion.content[contentKey]) {
        dprVersion.content[contentKey] = {};
      }

      // Map section names to content fields
      const sectionMapping: Record<string, string> = {
        'executiveSummary': 'executiveSummary',
        'introduction': 'businessProfile',
        'districtProfile': 'districtProfile',
        'clusterProfile': 'clusterProfile',
        'valueChain': 'valueChain',
        'marketAspects': 'marketAnalysis',
        'gapAnalysis': 'gapAnalysis',
        'swotAnalysis': 'swotAnalysis',
        'proposedInterventions': 'proposedInterventions',
        'cfcDetails': 'technicalFeasibility',
        'spvDetails': 'spvDetails',
        'projectCost': 'projectCost',
        'meansOfFinance': 'meansOfFinance',
        'operatingCostRevenue': 'operatingCostRevenue',
        'financialViability': 'financialProjections',
        'implementationSchedule': 'implementationSchedule',
        'expectedImpact': 'conclusion',
        'annexures': 'annexures',
      };

      const contentField = sectionMapping[sectionName] || sectionName;
      dprVersion.content[contentKey][contentField] = clusterSection.content;
      await dprVersion.save();

      console.log(`✅ Applied generated section "${sectionName}" to DPR ${dprId}`);

      res.status(200).json({
        success: true,
        message: 'Generated section applied successfully',
        data: {
          dprId,
          sectionName,
          appliedContent: clusterSection.content.substring(0, 100) + '...',
        },
      });
    } catch (error: any) {
      console.error('❌ Error applying generated section:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to apply generated section',
        error: error.message,
      });
    }
  }

  /**
   * Apply enhanced content to replace current section content
   */
  static async applyEnhancedContent(req: AuthRequest, res: Response): Promise<void> {
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
      const { sectionName, language = 'english' } = req.body;

      if (!dprId || !sectionName) {
        res.status(400).json({
          success: false,
          message: 'DPR ID and section name are required',
        });
        return;
      }

      // Verify DPR exists
      const dprVersion = await DPRVersion.findOne({
        _id: dprId,
        userId,
      });

      if (!dprVersion) {
        res.status(404).json({
          success: false,
          message: 'DPR not found',
        });
        return;
      }

      const lang = language === 'telugu' ? 'telugu' : 'english';

      // Find cluster section with enhanced content
      const clusterSection = await ClusterSection.findOne({
        dprId,
        userId,
        sectionType: sectionName,
        language: lang,
      });

      if (!clusterSection || !clusterSection.enhancedContent) {
        res.status(404).json({
          success: false,
          message: `Enhanced content for section "${sectionName}" not found`,
        });
        return;
      }

      // Apply enhanced content to the section
      clusterSection.content = clusterSection.enhancedContent;
      clusterSection.isApplied = true;
      clusterSection.version += 1;
      await clusterSection.save();

      // Also update DPRVersion content for backward compatibility
      const contentKey = lang;
      if (!dprVersion.content[contentKey]) {
        dprVersion.content[contentKey] = {};
      }

      // Map section names to content fields
      const sectionMapping: Record<string, string> = {
        'executiveSummary': 'executiveSummary',
        'introduction': 'businessProfile',
        'districtProfile': 'districtProfile',
        'clusterProfile': 'clusterProfile',
        'valueChain': 'valueChain',
        'marketAspects': 'marketAnalysis',
        'gapAnalysis': 'gapAnalysis',
        'swotAnalysis': 'swotAnalysis',
        'proposedInterventions': 'proposedInterventions',
        'cfcDetails': 'technicalFeasibility',
        'spvDetails': 'spvDetails',
        'projectCost': 'projectCost',
        'meansOfFinance': 'meansOfFinance',
        'operatingCostRevenue': 'operatingCostRevenue',
        'financialViability': 'financialProjections',
        'implementationSchedule': 'implementationSchedule',
        'expectedImpact': 'conclusion',
        'annexures': 'annexures',
      };

      const contentField = sectionMapping[sectionName] || sectionName;
      dprVersion.content[contentKey][contentField] = clusterSection.content;
      await dprVersion.save();

      console.log(`✅ Applied enhanced content for section "${sectionName}" to DPR ${dprId}`);

      res.status(200).json({
        success: true,
        message: 'Enhanced content applied successfully',
        data: {
          dprId,
          sectionName,
          appliedContent: clusterSection.content.substring(0, 100) + '...',
        },
      });
    } catch (error: any) {
      console.error('❌ Error applying enhanced content:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to apply enhanced content',
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
