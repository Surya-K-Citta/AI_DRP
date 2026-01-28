// @ts-nocheck
import mongoose, { Schema } from 'mongoose';

export interface IClusterSection extends Document {
  _id: string;
  userId: string;
  dprId: string;
  sectionType: string; // e.g., 'executiveSummary', 'introduction', 'clusterProfile', etc.
  language: 'english' | 'telugu';
  content: string; // The actual section content
  generatedContent?: string; // Generated content (for review before applying)
  enhancedContent?: string; // Enhanced content (for review before applying)
  isApplied: boolean; // Whether this content is currently applied
  version: number; // Version number for tracking changes
  createdAt: Date;
  updatedAt: Date;
}

const clusterSectionSchema = new Schema<IClusterSection>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    dprId: {
      type: String,
      required: true,
      ref: 'DPRVersion',
      index: true,
    },
    sectionType: {
      type: String,
      required: true,
      enum: [
        'executiveSummary',
        'introduction',
        'districtProfile',
        'clusterProfile',
        'valueChain',
        'marketAspects',
        'gapAnalysis',
        'swotAnalysis',
        'proposedInterventions',
        'cfcDetails',
        'spvDetails',
        'projectCost',
        'meansOfFinance',
        'operatingCostRevenue',
        'financialViability',
        'implementationSchedule',
        'expectedImpact',
        'annexures',
        'coverPage',
        'tableOfContents',
        // Subsection types
        'districtProfile-geography',
        'districtProfile-climate',
        'districtProfile-infrastructure',
        'districtProfile-keyEconomicActivities',
        'districtProfile-industrialInfrastructure',
        'clusterProfile-evolution',
        'marketAspects-demandSupply',
        'marketAspects-competition',
        'marketAspects-priceTrends',
        'marketAspects-exportPotential',
        'marketAspects-targetMarket',
      ],
      index: true,
    },
    language: {
      type: String,
      required: true,
      enum: ['english', 'telugu'],
      default: 'english',
      index: true,
    },
    content: {
      type: String,
      required: true,
      default: '',
    },
    generatedContent: {
      type: String,
      default: '',
    },
    enhancedContent: {
      type: String,
      default: '',
    },
    isApplied: {
      type: Boolean,
      default: false,
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
clusterSectionSchema.index({ dprId: 1, sectionType: 1, language: 1 });
clusterSectionSchema.index({ userId: 1, dprId: 1 });
clusterSectionSchema.index({ dprId: 1, isApplied: 1 });

export const ClusterSection = mongoose.model<IClusterSection>(
  'ClusterSection',
  clusterSectionSchema
);
