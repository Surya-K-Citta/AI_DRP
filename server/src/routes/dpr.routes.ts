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

// Project-based DPR generation
router.post('/generate/:projectId', DPRController.generateDPR);
router.get('/project/:projectId', DPRController.getProjectDPRs);

// DPR retrieval and download
router.get('/:dprId', DPRController.getDPR);
router.get('/:dprId/download/pdf', DPRController.downloadPDF);
router.get('/:dprId/download/docx', DPRController.downloadDOCX);

export { router as dprRoutes };