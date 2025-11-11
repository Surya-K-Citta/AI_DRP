// @ts-nocheck
import mongoose, { Schema } from 'mongoose';

export interface IDocument {
  name: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  openaiFileId?: string;
  vectorStoreId?: string;
  documentReference?: string; // Reference ID for efficient retrieval
  status: 'uploading' | 'processing' | 'ready' | 'error';
  uploadedBy: string;
  uploadedAt: Date;
  processedAt?: Date;
  error?: string;
  metadata: {
    description?: string;
    category?: string;
    tags?: string[];
    isTemplate?: boolean;
    templateType?: 'dpr' | 'scheme' | 'guidelines' | 'policy' | 'other';
    graphPosition?: number; // Position in the knowledge graph
    relatedDocuments?: string[]; // References to related documents
  };
  chunkCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    openaiFileId: {
      type: String,
    },
    vectorStoreId: {
      type: String,
    },
    documentReference: {
      type: String,
      unique: true,
      sparse: true, // Allow null values but ensure uniqueness when present
    },
    status: {
      type: String,
      enum: ['uploading', 'processing', 'ready', 'error'],
      default: 'uploading',
    },
    uploadedBy: {
      type: String,
      required: true,
      ref: 'User',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
    },
    error: {
      type: String,
    },
    metadata: {
      description: String,
      category: String,
      tags: [String],
      isTemplate: {
        type: Boolean,
        default: false,
      },
      templateType: {
        type: String,
        enum: ['dpr', 'scheme', 'guidelines', 'policy', 'other'],
      },
      graphPosition: {
        type: Number,
        default: 0,
      },
      relatedDocuments: [String],
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ uploadedBy: 1, createdAt: -1 });
documentSchema.index({ status: 1 });
documentSchema.index({ 'metadata.category': 1 });
documentSchema.index({ 'metadata.isTemplate': 1 });

export const Document = mongoose.model<IDocument>('Document', documentSchema);
