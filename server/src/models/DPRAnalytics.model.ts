import mongoose, { Schema } from 'mongoose';

export interface IDPRAnalytics {
  projectId: string;
  dprId: string;
  qualityScore: number;
  completenessScore: number;
  bankabilityScore: number;
  userSatisfactionScore: number;
  fundingOutcome?: 'approved' | 'rejected' | 'pending' | 'not_applied';
  loanAmountApproved?: number;
  approvalDate?: Date;
  rejectionReason?: string;
  feedbackCount: number;
  averageRating: number;
  improvementSuggestions: string[];
  sectorBenchmarkComparison: {
    projectCostVsBenchmark: number;
    ownContributionVsBenchmark: number;
    paybackPeriodVsBenchmark: number;
    roiVsBenchmark: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const dprAnalyticsSchema = new Schema<IDPRAnalytics>(
  {
    projectId: {
      type: String,
      required: true,
      ref: 'Project',
      index: true,
    },
    dprId: {
      type: String,
      required: true,
      ref: 'DPRVersion',
      index: true,
    },
    qualityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    completenessScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    bankabilityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    userSatisfactionScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    fundingOutcome: {
      type: String,
      enum: ['approved', 'rejected', 'pending', 'not_applied'],
      default: 'not_applied',
    },
    loanAmountApproved: {
      type: Number,
      min: 0,
    },
    approvalDate: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    feedbackCount: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    improvementSuggestions: [{
      type: String,
    }],
    sectorBenchmarkComparison: {
      projectCostVsBenchmark: {
        type: Number,
        required: true,
      },
      ownContributionVsBenchmark: {
        type: Number,
        required: true,
      },
      paybackPeriodVsBenchmark: {
        type: Number,
        required: true,
      },
      roiVsBenchmark: {
        type: Number,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

dprAnalyticsSchema.index({ projectId: 1, createdAt: -1 });
dprAnalyticsSchema.index({ qualityScore: -1 });
dprAnalyticsSchema.index({ fundingOutcome: 1 });

export const DPRAnalytics = mongoose.model<IDPRAnalytics>('DPRAnalytics', dprAnalyticsSchema);
