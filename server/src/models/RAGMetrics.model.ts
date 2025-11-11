// @ts-nocheck
import mongoose, { Schema } from 'mongoose';

export interface IRAGMetrics {
  query: string;
  responseTime: number; // in milliseconds
  success: boolean;
  vectorStoreIds: string[];
  model?: string;
  tokensUsed?: number;
  error?: string;
  userId?: string;
  queryType?: 'chat' | 'template_search' | 'document_search';
  createdAt: Date;
}

const ragMetricsSchema = new Schema<IRAGMetrics>(
  {
    query: {
      type: String,
      required: true,
      index: true,
    },
    responseTime: {
      type: Number,
      required: true,
      min: 0,
    },
    success: {
      type: Boolean,
      required: true,
      default: true,
    },
    vectorStoreIds: {
      type: [String],
      default: [],
    },
    model: {
      type: String,
    },
    tokensUsed: {
      type: Number,
      min: 0,
    },
    error: {
      type: String,
    },
    userId: {
      type: String,
      ref: 'User',
      index: true,
    },
    queryType: {
      type: String,
      enum: ['chat', 'template_search', 'document_search'],
      default: 'chat',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
ragMetricsSchema.index({ createdAt: -1 });
ragMetricsSchema.index({ success: 1, createdAt: -1 });
ragMetricsSchema.index({ queryType: 1, createdAt: -1 });
ragMetricsSchema.index({ userId: 1, createdAt: -1 });

// TTL index to auto-delete old metrics after 90 days
ragMetricsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const RAGMetrics = mongoose.model<IRAGMetrics>('RAGMetrics', ragMetricsSchema);

