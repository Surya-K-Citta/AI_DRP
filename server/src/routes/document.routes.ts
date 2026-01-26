// @ts-nocheck
import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Vector store management routes - accessible to all authenticated users for chat
router.get('/vector-stores/list', DocumentController.getVectorStores);
router.post('/search', DocumentController.searchDocuments);
router.post('/rag/query', DocumentController.queryWithRAG);

// File serving route - accessible to all authenticated users
router.get('/file/:filename', DocumentController.serveFile);
router.get('/file-by-id/:documentId', DocumentController.serveFileById);

// Admin-only routes (require admin role)
router.use(authorize('admin'));

// Document management routes (admin only)
router.post('/upload', DocumentController.getUploadMiddleware(), DocumentController.uploadDocument);
router.get('/', DocumentController.getDocuments);
router.get('/:documentId', DocumentController.getDocument);
router.delete('/:documentId', DocumentController.deleteDocument);

// Vector store management routes (admin only)
router.post('/vector-stores/create', DocumentController.createVectorStore);
router.delete('/vector-stores/:vectorStoreId', DocumentController.deleteVectorStore);

export default router;
