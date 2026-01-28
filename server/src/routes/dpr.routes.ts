// @ts-nocheck
import { Router } from 'express';
import { DPRController } from '../controllers/dpr.controller';
import { ClusterDPRController } from '../controllers/clusterDPR.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All DPR routes require authentication
router.use(authenticate);

// Template management
router.post('/templates/analyze/:documentId', DPRController.analyzeTemplate);
router.get('/templates', DPRController.getTemplates);

// DPR session management
router.post('/sessions/start', DPRController.startDPRSession);
router.get('/sessions/user', DPRController.getUserSessions);
router.get('/sessions/:sessionId/step', DPRController.getCurrentStep);
router.post('/sessions/:sessionId/responses', DPRController.submitStepResponses);
router.get('/sessions/:sessionId/dpr', DPRController.getGeneratedDPR);

// Chat-based DPR generation
router.post('/generate-from-chat', DPRController.generateDPRFromChat);
router.post('/generate-enhanced-from-chat', DPRController.generateEnhancedDPRFromChat);

// DPR session downloads
router.get('/sessions/:sessionId/download/pdf', DPRController.downloadSessionPDF);

// Upload DPR (must be before /:dprId routes to avoid route conflicts)
// Handle multer errors properly
router.post('/upload', (req, res, next) => {
  const middleware = DPRController.getUploadMiddleware();
  middleware(req, res, (err: any) => {
    if (err) {
      // Multer error (file validation, size limit, etc.)
      console.error('Multer upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error',
        error: err.code || 'UPLOAD_ERROR',
      });
    }
    next();
  });
}, DPRController.uploadDPR);

// User DPRs
router.get('/user/list', DPRController.getUserDPRs);

// Project-based DPR generation
router.post('/generate/:projectId', DPRController.generateDPR);
router.get('/project/:projectId', DPRController.getProjectDPRs);

// Cluster DPR generation
router.post('/cluster/generate', ClusterDPRController.generateClusterDPR);
router.get('/cluster/:dprId', ClusterDPRController.getClusterDPR);

// Image generation and upload for Cluster DPR
router.post('/cluster/images/generate', ClusterDPRController.generateImage);
router.post('/cluster/images/upload', (req, res, next) => {
  const upload = ClusterDPRController.getImageUploadMiddleware();
  upload.single('image')(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error',
      });
    }
    next();
  });
}, ClusterDPRController.uploadImage);

// Section enhancement for Cluster DPR
router.post('/cluster/sections/enhance', ClusterDPRController.enhanceSection);

// DPR retrieval and download
router.get('/:dprId', DPRController.getDPR);
router.get('/:dprId/download/pdf', DPRController.downloadPDF); // GET for backward compatibility
router.post('/:dprId/download/pdf', DPRController.downloadPDF); // POST to accept enhanced paragraphs
router.post('/:dprId/download/pdf/html', DPRController.downloadPDFHtml); // POST to accept rendered HTML for exact PDF
router.get('/:dprId/download/docx', DPRController.downloadDOCX);
router.get('/:dprId/download/xls', DPRController.downloadXLS);

// DPR quality and management
router.get('/:dprId/quality', DPRController.analyzeQuality);
router.put('/:dprId/content', DPRController.updateDPRContent);
router.post('/:dprId/submit', DPRController.submitDPR);
router.post('/:dprId/translate/telugu', DPRController.translateToTelugu);

export { router as dprRoutes };