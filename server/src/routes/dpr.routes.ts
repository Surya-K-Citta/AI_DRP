// @ts-nocheck
import { Router } from 'express';
import { DPRController } from '../controllers/dpr.controller';
import { ClusterDPRController } from '../controllers/clusterDPR.controller';
import { dprParamGuard } from '../middleware/dprAccess.middleware';
import { auditOnSuccess } from '../lib/auditMiddleware';
import { uploadGuard } from '../lib/security/uploadGuard';
import { authenticate } from '../middleware/auth.middleware';
import { requireAiConsent } from '../middleware/aiConsent.middleware';
import { SchemeStyleController } from '../controllers/schemeStyle.controller';

const router = Router();

router.use(authenticate);
// Every route with a :dprId checks that the DPR belongs to the caller (or to staff in scope, read-only).
router.param('dprId', dprParamGuard);

router.post('/templates/analyze/:documentId', requireAiConsent, DPRController.analyzeTemplate);
router.get('/templates', DPRController.getTemplates);

router.post('/sessions/start', DPRController.startDPRSession);
router.get('/sessions/user', DPRController.getUserSessions);
router.get('/sessions/:sessionId/step', DPRController.getCurrentStep);
router.post('/sessions/:sessionId/responses', DPRController.submitStepResponses);
router.get('/sessions/:sessionId/dpr', DPRController.getGeneratedDPR);

router.post('/generate-from-chat', requireAiConsent, DPRController.generateDPRFromChat);
router.post('/generate-enhanced-from-chat', requireAiConsent, DPRController.generateEnhancedDPRFromChat);

router.post('/builder/analyze', requireAiConsent, DPRController.analyzeBuilderStep);
router.post('/builder/chat', requireAiConsent, DPRController.chatBuilderStep);

router.get('/sessions/:sessionId/download/pdf', DPRController.downloadSessionPDF);

router.post('/upload', (req, res, next) => {
  const middleware = DPRController.getUploadMiddleware();
  middleware(req, res, (err: any) => {
    if (err) {
      console.error('Multer upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error',
        error: err.code || 'UPLOAD_ERROR',
      });
    }
    next();
  });
}, uploadGuard(['document', 'text']), requireAiConsent, DPRController.uploadDPR);

router.get('/user/list', DPRController.getUserDPRs);

router.get('/scheme-style/:schemeCode', SchemeStyleController.get);
router.put('/scheme-style/:schemeCode', auditOnSuccess(SchemeStyleController.save, { action: 'template_update', targetType: 'scheme-style', payload: (req) => ({ scheme: req.params.schemeCode, preset: req.body?.documentStyle?.preset, sections: Array.isArray(req.body?.documentStyle?.sectionOrder) ? req.body.documentStyle.sectionOrder.length : undefined }) }));

router.post('/generate/:projectId', requireAiConsent, DPRController.generateDPR);
router.get('/project/:projectId', DPRController.getProjectDPRs);

router.post('/cluster/generate', requireAiConsent, ClusterDPRController.generateClusterDPR);
router.post('/cluster/draft/save', ClusterDPRController.saveClusterDPRDraft);
router.post('/cluster/:dprId/enhanced-content', ClusterDPRController.saveEnhancedContent);
router.post('/cluster/:dprId/generated-sections', ClusterDPRController.storeGeneratedSections);
router.post('/cluster/:dprId/sections/regenerate', requireAiConsent, ClusterDPRController.regenerateClusterSection);
router.post('/cluster/:dprId/apply-generated-section', ClusterDPRController.applyGeneratedSection);
router.post('/cluster/:dprId/apply-enhanced-content', ClusterDPRController.applyEnhancedContent);
router.post('/cluster/:dprId/enhance-and-apply-all', requireAiConsent, ClusterDPRController.enhanceAndApplyAllSections);
router.get('/cluster/:dprId', ClusterDPRController.getClusterDPR);
router.get('/cluster/:dprId/sections', ClusterDPRController.getClusterSections);

router.post('/cluster/images/generate', requireAiConsent, ClusterDPRController.generateImage);
router.get('/cluster/files/:fileId', ClusterDPRController.getFile);
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
}, uploadGuard(['image']), ClusterDPRController.uploadImage);

router.post('/cluster/sections/enhance', requireAiConsent, ClusterDPRController.enhanceSection);

router.post('/cluster/ai/suggestions', requireAiConsent, ClusterDPRController.getAISuggestions);
router.post('/cluster/ai/field-suggestion', requireAiConsent, ClusterDPRController.getFieldSuggestion);
router.post('/cluster/ai/improve-field', requireAiConsent, ClusterDPRController.improveFieldText);
router.post('/cluster/ai/match-skill', requireAiConsent, ClusterDPRController.matchBusinessSkill);
router.post('/cluster/ai/generate-field-content', requireAiConsent, ClusterDPRController.generateFieldContent);
router.post('/cluster/financial-statements/generate', requireAiConsent, ClusterDPRController.generateFinancialStatements);

router.delete('/cluster/images/delete', ClusterDPRController.deleteImage);

router.post('/cluster/documents/upload', (req, res, next) => {
  const upload = ClusterDPRController.getDocumentUploadMiddleware();
  upload.single('document')(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error',
      });
    }
    next();
  });
}, uploadGuard(['document', 'image', 'text']), ClusterDPRController.uploadDocument);
router.post('/cluster/annexures/update', ClusterDPRController.updateAnnexureDocument);

router.get('/:dprId', DPRController.getDPR);
router.delete('/:dprId', DPRController.deleteDPR);
router.get('/:dprId/download/pdf', DPRController.downloadPDF);
router.post('/:dprId/download/pdf', DPRController.downloadPDF);
router.post('/:dprId/download/pdf/html', DPRController.downloadPDFHtml);
router.get('/:dprId/download/docx', DPRController.downloadDOCX);
router.get('/:dprId/download/xls', DPRController.downloadXLS);

router.get('/:dprId/quality', requireAiConsent, DPRController.analyzeQuality);
router.put('/:dprId/content', DPRController.updateDPRContent);
router.post('/:dprId/submit', DPRController.submitDPR);
router.post('/:dprId/translate/telugu', requireAiConsent, DPRController.translateToTelugu);

export { router as dprRoutes };
