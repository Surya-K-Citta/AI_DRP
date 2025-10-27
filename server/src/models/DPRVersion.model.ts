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
    versionNumber: {
      type: Number,
      required: true,
      default: 1,
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
  },
  {
    timestamps: true,
  }
);

dprVersionSchema.index({ projectId: 1, versionNumber: -1 });

export const DPRVersion = mongoose.model<IDPRVersion>(
  'DPRVersion',
  dprVersionSchema
);

