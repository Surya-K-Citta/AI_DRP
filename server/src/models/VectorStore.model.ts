// @ts-nocheck
import mongoose, { Schema } from 'mongoose';

export interface IVectorStore {
  openaiVectorStoreId: string;
  name: string;
  description?: string;
  fileCount: number;
  totalSize: number;
  status: 'creating' | 'ready' | 'error';
  createdBy?: string;
  createdAt: Date;
  lastUpdated: Date;
  expiresAt?: Date;
  metadata: {
    purpose?: string;
    category?: string;
    isDefault?: boolean;
  };
}

const vectorStoreSchema = new Schema<IVectorStore>(
  {
    openaiVectorStoreId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    fileCount: {
      type: Number,
      default: 0,
    },
    totalSize: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['creating', 'ready', 'error'],
      default: 'creating',
    },
    createdBy: {
      type: String,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
    },
    metadata: {
      purpose: String,
      category: String,
      isDefault: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

vectorStoreSchema.index({ createdBy: 1 });
vectorStoreSchema.index({ status: 1 });
vectorStoreSchema.index({ 'metadata.isDefault': 1 });

export const VectorStore = mongoose.model<IVectorStore>('VectorStore', vectorStoreSchema);
