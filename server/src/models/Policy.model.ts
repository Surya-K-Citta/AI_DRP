// @ts-nocheck
import mongoose, { Schema } from 'mongoose';

export interface IPolicy {
  title: string;
  description: string;
  category: 'dpr' | 'user' | 'system' | 'financial' | 'compliance' | 'other';
  content: string;
  version: string;
  status: 'draft' | 'active' | 'archived' | 'deprecated';
  effectiveDate?: Date;
  expiryDate?: Date;
  createdBy: string;
  updatedBy?: string;
  tags: string[];
  appliesTo: {
    roles?: string[];
    sectors?: string[];
    locations?: string[];
  };
  metadata: {
    priority: 'low' | 'medium' | 'high' | 'critical';
    requiresApproval: boolean;
    approvalStatus?: 'pending' | 'approved' | 'rejected';
    approvedBy?: string;
    approvedAt?: Date;
    relatedPolicies?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const policySchema = new Schema<IPolicy>(
  {
    title: {
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
      enum: ['dpr', 'user', 'system', 'financial', 'compliance', 'other'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    version: {
      type: String,
      default: '1.0.0',
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'archived', 'deprecated'],
      default: 'draft',
    },
    effectiveDate: {
      type: Date,
    },
    expiryDate: {
      type: Date,
    },
    createdBy: {
      type: String,
      required: true,
      ref: 'User',
    },
    updatedBy: {
      type: String,
      ref: 'User',
    },
    tags: {
      type: [String],
      default: [],
    },
    appliesTo: {
      roles: [String],
      sectors: [String],
      locations: [String],
    },
    metadata: {
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
      },
      requiresApproval: {
        type: Boolean,
        default: false,
      },
      approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
      },
      approvedBy: {
        type: String,
        ref: 'User',
      },
      approvedAt: {
        type: Date,
      },
      relatedPolicies: [String],
    },
  },
  {
    timestamps: true,
  }
);

policySchema.index({ category: 1, status: 1 });
policySchema.index({ 'metadata.priority': 1 });
policySchema.index({ createdAt: -1 });

export const Policy = mongoose.model<IPolicy>('Policy', policySchema);

