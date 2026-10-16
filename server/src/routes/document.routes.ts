// @ts-nocheck
import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { auditOnSuccess } from '../lib/auditMiddleware';
import { uploadGuard } from '../lib/security/uploadGuard';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { requireAiConsent } from '../middleware/aiConsent.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Vector store management routes - accessible to all authenticated users for chat
router.get('/vector-stores/list', DocumentController.getVectorStores);
router.post('/search', requireAiConsent, DocumentController.searchDocuments);
router.post('/rag/query', requireAiConsent, DocumentController.queryWithRAG);

// File serving route - accessible to all authenticated users
router.get('/file/:filename', DocumentController.serveFile);
router.get('/file-by-id/:documentId', DocumentController.serveFileById);

// Admin-only routes (require admin role)
router.use(authorize('admin'));

// Document management routes (admin only)
router.post('/upload', DocumentController.getUploadMiddleware(), uploadGuard(['document', 'text']), auditOnSuccess(DocumentController.uploadDocument, { action: 'document_change', targetType: 'document', targetId: (req) => String((req as any).file?.originalname || ''), payload: (req) => ({ op: 'upload', size: (req as any).file?.size, type: (req as any).file?.mimetype }) }));
router.get('/', DocumentController.getDocuments);
router.get('/:documentId', DocumentController.getDocument);
router.delete('/:documentId', auditOnSuccess(DocumentController.deleteDocument, { action: 'document_change', targetType: 'document', payload: () => ({ op: 'delete' }) }));

// Vector store management routes (admin only)
router.post('/vector-stores/create', DocumentController.createVectorStore);
router.delete('/vector-stores/:vectorStoreId', DocumentController.deleteVectorStore);

export default router;
