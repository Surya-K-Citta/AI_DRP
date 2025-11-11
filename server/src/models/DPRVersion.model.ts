// @ts-nocheck
import mongoose, { Schema } from 'mongoose';
import { IDPRVersion } from '../types';

const dprVersionSchema = new Schema<IDPRVersion>(
  {
    projectId: {
      type: String,
      required: true,
      ref: 'Project',
      index: true,
    },
    contentPath: String,
    content: {
      english: {
        executiveSummary: { type: String, default: '' },
        businessProfile: { type: String, default: '' },
        marketAnalysis: { type: String, default: '' },
        technicalFeasibility: { type: String, default: '' },
        financialProjections: { type: String, default: '' },
        conclusion: { type: String, default: '' },
      },
      telugu: {
        executiveSummary: { type: String, default: '' },
        businessProfile: { type: String, default: '' },
        marketAnalysis: { type: String, default: '' },
        technicalFeasibility: { type: String, default: '' },
        financialProjections: { type: String, default: '' },
        conclusion: { type: String, default: '' },
      },
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

