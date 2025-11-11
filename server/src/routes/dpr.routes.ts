import { Router } from 'express';
import { DPRController } from '../controllers/dpr.controller';
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

// DPR retrieval and download
router.get('/:dprId', DPRController.getDPR);
router.get('/:dprId/download/pdf', DPRController.downloadPDF);
router.get('/:dprId/download/docx', DPRController.downloadDOCX);
router.get('/:dprId/download/xls', DPRController.downloadXLS);

// DPR quality and management
router.get('/:dprId/quality', DPRController.analyzeQuality);
router.put('/:dprId/content', DPRController.updateDPRContent);
router.post('/:dprId/submit', DPRController.submitDPR);
router.post('/:dprId/translate/telugu', DPRController.translateToTelugu);

export { router as dprRoutes };