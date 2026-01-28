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
      english: {
        executiveSummary: { type: String, default: '' },
        businessProfile: { type: String, default: '' },
        marketAnalysis: { type: String, default: '' },
        technicalFeasibility: { type: String, default: '' },
        financialProjections: { type: String, default: '' },
        conclusion: { type: String, default: '' },
        eligibleSchemes: { type: String, default: '' },
        // Cluster DPR specific sections
        coverPage: { type: String, default: '' },
        tableOfContents: { type: String, default: '' },
        districtProfile: { type: String, default: '' },
        clusterProfile: { type: String, default: '' },
        valueChain: { type: String, default: '' },
        gapAnalysis: { type: String, default: '' },
        swotAnalysis: { type: String, default: '' },
        proposedInterventions: { type: String, default: '' },
        cfcDetails: { type: String, default: '' },
        spvDetails: { type: String, default: '' },
        projectCost: { type: String, default: '' },
        meansOfFinance: { type: String, default: '' },
        operatingCostRevenue: { type: String, default: '' },
        implementationSchedule: { type: String, default: '' },
        annexures: { type: String, default: '' },
        // Generated sections and enhanced content (stored separately for user review)
        generatedSections: { type: Schema.Types.Mixed, default: {} },
        enhancedContent: { type: Schema.Types.Mixed, default: {} },
        // Additional cluster DPR metadata
        isClusterDPR: { type: Boolean, default: false },
        clusterData: { type: Schema.Types.Mixed, default: {} },
      },
      telugu: {
        executiveSummary: { type: String, default: '' },
        businessProfile: { type: String, default: '' },
        marketAnalysis: { type: String, default: '' },
        technicalFeasibility: { type: String, default: '' },
        financialProjections: { type: String, default: '' },
        conclusion: { type: String, default: '' },
        eligibleSchemes: { type: String, default: '' },
        // Cluster DPR specific sections
        coverPage: { type: String, default: '' },
        tableOfContents: { type: String, default: '' },
        districtProfile: { type: String, default: '' },
        clusterProfile: { type: String, default: '' },
        valueChain: { type: String, default: '' },
        gapAnalysis: { type: String, default: '' },
        swotAnalysis: { type: String, default: '' },
        proposedInterventions: { type: String, default: '' },
        cfcDetails: { type: String, default: '' },
        spvDetails: { type: String, default: '' },
        projectCost: { type: String, default: '' },
        meansOfFinance: { type: String, default: '' },
        operatingCostRevenue: { type: String, default: '' },
        implementationSchedule: { type: String, default: '' },
        annexures: { type: String, default: '' },
        // Generated sections and enhanced content (stored separately for user review)
        generatedSections: { type: Schema.Types.Mixed, default: {} },
        enhancedContent: { type: Schema.Types.Mixed, default: {} },
        // Additional cluster DPR metadata
        isClusterDPR: { type: Boolean, default: false },
        clusterData: { type: Schema.Types.Mixed, default: {} },
      },
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

