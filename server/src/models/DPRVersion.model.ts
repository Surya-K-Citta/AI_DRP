// @ts-nocheck
import mongoose, { Schema } from 'mongoose';
import { IDPRVersion } from '../types';
import { ClusterSection } from './ClusterSection.model';

const dprVersionSchema = new Schema<IDPRVersion>(
  {
    projectId: {
      type: String,
      required: true,
      ref: 'Project',
      index: true,
    },
    userId: {
      type: String,
      required: false,
      index: true,
    },
    versionNumber: {
      type: Number,
      default: 1,
    },
    contentPath: String,
    content: {
      english: { type: Schema.Types.Mixed, default: {} },
      telugu: { type: Schema.Types.Mixed, default: {} },
    },
    // Store eligible schemes data for easy access
    eligibleSchemes: {
      selectedSchemes: [String],
      schemesData: [{
        schemeCode: String,
        schemeName: String,
        description: String,
        eligibility: Schema.Types.Mixed,
        benefits: Schema.Types.Mixed,
        documentsRequired: [String],
        category: String,
        portal: String,
      }],
    },
    financials: {
      type: Schema.Types.Mixed,
      default: {},
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    language: {
      type: String,
      enum: ['english', 'telugu', 'bilingual'],
      default: 'bilingual',
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected'],
      default: 'draft',
    },
    qualityScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    qualityFeedback: {
      score: Number,
      feedback: [String],
      weakSections: [String],
      lastAnalyzedAt: Date,
    },
    submittedAt: Date,
    submittedTo: {
      type: String,
      enum: ['admin', 'bank', 'apmsme'],
    },
    approvedAt: Date,
    approvedBy: String,
  },
  {
    timestamps: true,
  }
);

dprVersionSchema.index({ projectId: 1, createdAt: -1 });

export const DPRVersion = mongoose.model<IDPRVersion>(
  'DPRVersion',
  dprVersionSchema
);

