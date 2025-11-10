import mongoose, { Schema } from 'mongoose';

export interface IDPRTemplate {
  name: string;
  description: string;
  category: 'manufacturing' | 'service' | 'trading' | 'agriculture' | 'technology' | 'other';
  templateContent: string;
  structure: {
    sections: Array<{
      name: string;
      fields: Array<{
        name: string;
        type: 'text' | 'number' | 'date' | 'select' | 'textarea';
        required: boolean;
        options?: string[];
        description?: string;
      }>;
      order: number;
    }>;
    totalSections: number;
    estimatedTime: string;
  };
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  metadata: {
    version: string;
    tags: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    targetAudience: string[];
  };
}

const dprTemplateSchema = new Schema<IDPRTemplate>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['manufacturing', 'service', 'trading', 'agriculture', 'technology', 'other'],
      required: true,
    },
    templateContent: {
      type: String,
      required: true,
    },
    structure: {
      sections: [{
        name: String,
        fields: [{
          name: String,
          type: {
            type: String,
            enum: ['text', 'number', 'date', 'select', 'textarea'],
          },
          required: Boolean,
          options: [String],
          description: String,
        }],
        order: Number,
      }],
      totalSections: Number,
      estimatedTime: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      required: true,
      ref: 'User',
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    metadata: {
      version: {
        type: String,
        default: '1.0.0',
      },
      tags: [String],
      difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'intermediate',
      },
      targetAudience: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient searching
dprTemplateSchema.index({ category: 1, isActive: 1 });
dprTemplateSchema.index({ 'metadata.tags': 1 });
dprTemplateSchema.index({ createdBy: 1 });

export const DPRTemplate = mongoose.model<IDPRTemplate>('DPRTemplate', dprTemplateSchema);

