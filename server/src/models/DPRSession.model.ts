// @ts-nocheck
import mongoose, { Schema } from 'mongoose';

export interface IDPRSession {
  userId: string;
  templateId: string;
  currentStep: number;
  totalSteps: number;
  responses: Record<string, any>;
  status: 'in_progress' | 'completed' | 'abandoned';
  generatedDPR?: {
    content: string;
    sections: Array<{
      title: string;
      content: string;
    }>;
    metadata: {
      generatedAt: string;
      language: string;
      totalSections: number;
      wordCount: number;
    };
  };
  startedAt: Date;
  completedAt?: Date;
  lastActivityAt: Date;
  metadata: {
    language: 'english' | 'telugu';
    estimatedTimeRemaining?: string;
    progress: number;
  };
}

const dprSessionSchema = new Schema<IDPRSession>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    templateId: {
      type: String,
      required: true,
      ref: 'DPRTemplate',
    },
    currentStep: {
      type: Number,
      default: 1,
    },
    totalSteps: {
      type: Number,
      required: true,
    },
    responses: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress',
    },
    generatedDPR: {
      content: String,
      sections: [{
        title: String,
        content: String,
      }],
      metadata: {
        generatedAt: String,
        language: String,
        totalSections: Number,
        wordCount: Number,
      },
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      language: {
        type: String,
        enum: ['english', 'telugu'],
        default: 'english',
      },
      estimatedTimeRemaining: String,
      progress: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
dprSessionSchema.index({ userId: 1, status: 1 });
dprSessionSchema.index({ templateId: 1 });
dprSessionSchema.index({ lastActivityAt: -1 });

export const DPRSession = mongoose.model<IDPRSession>('DPRSession', dprSessionSchema);

