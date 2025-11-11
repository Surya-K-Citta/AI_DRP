// @ts-nocheck
import { Response } from 'express';
import { AuthRequest } from '../types';
import { Document } from '../models/Document.model';
import { VectorStore } from '../models/VectorStore.model';
import { OpenAIService } from '../services/openai.service';
import OpenAI from 'openai';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

// OpenAI client for file operations
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required. Please set it in your .env file.');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Setup multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads');
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
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow PDF, DOC, DOCX, TXT files
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'application/rtf',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, and MD files are allowed.'));
    }
  },
});

export class DocumentController {
  /**
   * Process document for RAG integration
   */
  static async processDocumentForRAG(documentId: string): Promise<void> {
    try {
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Update status to processing
      document.status = 'processing';
      await document.save();

      try {
        // Upload file to OpenAI
        const fileStream = fs.createReadStream(document.filePath);
        const fileResponse = await openai.files.create({
          file: fileStream,
          purpose: 'assistants',
        });

        const openaiFileId = fileResponse.id;

        // Update document with OpenAI file ID
        document.openaiFileId = openaiFileId;
        document.status = 'processing';
        await document.save();

        // Use the specific MSME vector store as unified knowledge base
        const defaultVectorStoreId = process.env.MAIN_VECTOR_STORE_ID || ' ';
        console.log(`📚 Adding document to unified knowledge base: ${defaultVectorStoreId}`);

        // Check if vector store exists in database
        let vectorStore = await VectorStore.findOne({ openaiVectorStoreId: defaultVectorStoreId });
        if (!vectorStore) {
          try {
            // Create record for the existing vector store
            vectorStore = await VectorStore.create({
              openaiVectorStoreId: defaultVectorStoreId,
              name: 'MSME Knowledge Base',
              description: 'Unified knowledge base for MSME DPR assistance - acts as a graph structure for all documents',
              fileCount: 0,
              totalSize: 0,
              status: 'ready',
              createdBy: document.uploadedBy,
              metadata: {
                isDefault: true,
                purpose: 'dpr-assistance',
                category: 'general',
                structure: 'graph',
                unified: true
              }
            });
            console.log(`✅ Created vector store record for unified knowledge base`);
          } catch (error: any) {
            if (error.code === 11000) {
              // Vector store already exists, fetch it instead
              console.log('Vector store already exists, fetching from database...');
              vectorStore = await VectorStore.findOne({ openaiVectorStoreId: defaultVectorStoreId });
              if (!vectorStore) {
                throw new Error('Vector store exists but could not be retrieved');
              }
            } else {
              throw error;
            }
          }
        }

        // Attach file to the unified vector store (graph structure)
        await openai.vectorStores.files.create(defaultVectorStoreId, {
          file_id: openaiFileId,
        });

        console.log(`🔗 Document ${document.filename} attached to unified knowledge base`);

        // Update document with vector store ID and reference
        document.vectorStoreId = defaultVectorStoreId;
        document.status = 'ready';
        document.processedAt = new Date();
        document.documentReference = `DOC_${document._id.toString().slice(-8)}`; // Create reference ID
        
        // Set graph position based on file count in vector store
        const currentFileCount = vectorStore.fileCount || 0;
        document.metadata.graphPosition = currentFileCount + 1;
        
        await document.save();

        // Update vector store file count and total size
        const fileSize = document.fileSize || 0;
        await VectorStore.findByIdAndUpdate(vectorStore._id, {
          $inc: { 
            fileCount: 1,
            totalSize: fileSize
          },
          lastUpdated: new Date(),
        });

        console.log(`✅ Document processed and added to unified knowledge base with reference: ${document.documentReference}`);

      } catch (error) {
        document.status = 'error';
        document.error = error instanceof Error ? error.message : 'Unknown error';
        await document.save();
        throw error;
      }
    } catch (error) {
      console.error('Error processing document for RAG:', error);
      throw new Error('Failed to process document for RAG');
    }
  }

  /**
   * Upload document (Admin only)
   */
  static async uploadDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { description, category, tags, isTemplate, templateType } = req.body;
      const file = req.file;

      if (!file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
        return;
      }

      // Create document record
      const document = await Document.create({
        name: file.filename,
        originalName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy: req.user?.userId,
        status: 'uploading',
        metadata: {
          description,
          category,
          tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
          isTemplate: isTemplate === 'true',
          templateType,
        },
      });

      // Process document for RAG in background
      DocumentController.processDocumentForRAG(document._id.toString())
        .then(() => {
          console.log(`Document ${document._id} processed successfully for RAG`);
        })
        .catch((error) => {
          console.error(`Error processing document ${document._id} for RAG:`, error);
        });

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully. Processing for RAG...',
        data: {
          documentId: document._id,
          name: document.name,
          originalName: document.originalName,
          status: document.status,
        },
      });
    } catch (error: any) {
      console.error('Upload document error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload document',
        error: error.message,
      });
    }
  }

  /**
   * Get all documents (Admin only)
   */
  static async getDocuments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, status, category, search } = req.query;

      const filter: any = {};

      if (status) {
        filter.status = status;
      }

      if (category) {
        filter['metadata.category'] = category;
      }

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { originalName: { $regex: search, $options: 'i' } },
          { 'metadata.description': { $regex: search, $options: 'i' } },
        ];
      }

      const documents = await Document.find(filter)
        .populate('uploadedBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

      const total = await Document.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: {
          documents,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error: any) {
      console.error('Get documents error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch documents',
        error: error.message,
      });
    }
  }

  /**
   * Get document by ID (Admin only)
   */
  static async getDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { documentId } = req.params;

      const document = await Document.findById(documentId)
        .populate('uploadedBy', 'name email');

      if (!document) {
        res.status(404).json({
          success: false,
          message: 'Document not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: document,
      });
    } catch (error: any) {
      console.error('Get document error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document',
        error: error.message,
      });
    }
  }

  /**
   * Delete document (Admin only)
   */
  static async deleteDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { documentId } = req.params;

      // Delete document and remove from OpenAI
      const document = await Document.findById(documentId);
      if (document) {
        // Delete from OpenAI if exists
        if (document.openaiFileId) {
          try {
            await openai.files.del(document.openaiFileId);
          } catch (error) {
            console.error('Error deleting file from OpenAI:', error);
          }
        }

        // Remove from vector store if attached
        if (document.vectorStoreId) {
          try {
            await openai.vectorStores.files.del(document.vectorStoreId, document.openaiFileId);
          } catch (error) {
            console.error('Error removing file from vector store:', error);
          }
        }

        // Delete file from local storage
        if (fs.existsSync(document.filePath)) {
          fs.unlinkSync(document.filePath);
        }
      }

      // Delete from database
      await Document.findByIdAndDelete(documentId);

      res.status(200).json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete document error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete document',
        error: error.message,
      });
    }
  }

  /**
   * Get vector stores (accessible to all authenticated users for chat)
   */
  static async getVectorStores(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Get vector stores from database
      // Try to populate createdBy, but handle errors gracefully
      let vectorStores;
      try {
        vectorStores = await VectorStore.find({ createdBy: { $ne: 'system' } }).populate('createdBy', 'name email');
      } catch (populateError) {
        // If populate fails, get without populate
        console.warn('Failed to populate createdBy, fetching without populate:', populateError);
        vectorStores = await VectorStore.find({ createdBy: { $ne: 'system' } });
      }

        // Ensure main vector store is included
        const mainVectorStoreId = process.env.MAIN_VECTOR_STORE_ID || ' ';
        const mainVectorStoreExists = vectorStores.some(store => store.openaiVectorStoreId === mainVectorStoreId);
        if (!mainVectorStoreExists) {
          try {
            // Create the main vector store record in database
            const mainVectorStore = await VectorStore.create({
              openaiVectorStoreId: mainVectorStoreId,
              name: 'MSME Knowledge Base',
              description: 'Main knowledge base for MSME DPR assistance',
              fileCount: 0,
              totalSize: 0,
              status: 'ready',
              createdBy: 'system',
              metadata: {
                isDefault: true,
                purpose: 'dpr-assistance',
                category: 'general'
              }
            });
            // Add main vector store without populating createdBy
            vectorStores.push({
              ...mainVectorStore.toObject(),
              createdBy: { name: 'System', email: 'system@msme-dpr.com' }
            });
          } catch (error: any) {
            if (error.code === 11000) {
              // Vector store already exists, fetch it instead
              console.log('Vector store already exists, fetching from database...');
              const mainVectorStoreId = process.env.MAIN_VECTOR_STORE_ID || ' ';
              const existingVectorStore = await VectorStore.findOne({ 
                openaiVectorStoreId: mainVectorStoreId 
              });
              if (existingVectorStore) {
                vectorStores.push({
                  ...existingVectorStore.toObject(),
                  createdBy: { name: 'System', email: 'system@msme-dpr.com' }
                });
              }
            } else {
              throw error;
            }
          }
        }

      res.status(200).json({
        success: true,
        data: vectorStores,
      });
    } catch (error: any) {
      console.error('Get vector stores error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vector stores',
        error: error.message,
      });
    }
  }

  /**
   * Create vector store (Admin only) - Note: System uses dedicated MSME vector store
   */
  static async createVectorStore(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, description, category, purpose } = req.body;

      // Return information about the main vector store
      const mainVectorStoreId = process.env.MAIN_VECTOR_STORE_ID || ' ';
      res.status(200).json({
        success: true,
        message: 'The system uses a dedicated MSME Knowledge Base for all document processing.',
        data: {
          mainVectorStore: {
            id: mainVectorStoreId,
            name: 'MSME Knowledge Base',
            description: 'Main knowledge base for MSME DPR assistance',
            status: 'ready'
          }
        },
      });
    } catch (error: any) {
      console.error('Create vector store error:', error);
      res.status(500).json({
        success: false,
        message: 'Vector store creation disabled - using dedicated MSME knowledge base',
        error: error.message,
      });
    }
  }

  /**
   * Delete vector store (Admin only) - Main vector store cannot be deleted
   */
  static async deleteVectorStore(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { vectorStoreId } = req.params;

      // Prevent deletion of the main MSME vector store
      const mainVectorStoreId = process.env.MAIN_VECTOR_STORE_ID || ' ';
      if (vectorStoreId === mainVectorStoreId) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete the main MSME Knowledge Base vector store',
        });
        return;
      }

      const vectorStore = await VectorStore.findOne({
        openaiVectorStoreId: vectorStoreId,
        createdBy: req.user?.userId,
      });

      if (!vectorStore) {
        res.status(404).json({
          success: false,
          message: 'Vector store not found',
        });
        return;
      }

      // Delete from OpenAI
      try {
        await openai.vectorStores.del(vectorStoreId);
      } catch (error) {
        console.error('Error deleting vector store from OpenAI:', error);
      }

      // Delete from database
      await VectorStore.findOneAndDelete({ openaiVectorStoreId: vectorStoreId });

      res.status(200).json({
        success: true,
        message: 'Vector store deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete vector store error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete vector store',
        error: error.message,
      });
    }
  }

  /**
   * Search documents using RAG (Admin only)
   */
  static async searchDocuments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { query, vectorStoreIds, maxResults = 5 } = req.body;

      if (!query) {
        res.status(400).json({
          success: false,
          message: 'Query is required',
        });
        return;
      }

      const results = await OpenAIService.searchDocumentsWithRAG(
        query,
        vectorStoreIds || [],
        maxResults
      );

      res.status(200).json({
        success: true,
        data: {
          query,
          results,
          timestamp: new Date(),
        },
      });
    } catch (error: any) {
      console.error('Search documents error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search documents',
        error: error.message,
      });
    }
  }

  /**
   * Query with RAG (Admin only)
   */
  static async queryWithRAG(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { question, vectorStoreIds, model = 'gpt-4o-mini' } = req.body;

      if (!question) {
        res.status(400).json({
          success: false,
          message: 'Question is required',
        });
        return;
      }

      if (!vectorStoreIds || vectorStoreIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Vector store IDs are required',
        });
        return;
      }

      // Use OpenAI Chat Completions API for RAG
      const response = await openai.chat.completions.create({
        model: model || 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: question,
          },
        ],
        max_tokens: 1000,
      });

      res.status(200).json({
        success: true,
        data: {
          question,
          response,
          timestamp: new Date(),
        },
      });
    } catch (error: any) {
      console.error('Query with RAG error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to query with RAG',
        error: error.message,
      });
    }
  }

  /**
   * Get multer middleware for file upload
   */
  static getUploadMiddleware() {
    return upload.single('file');
  }
}
