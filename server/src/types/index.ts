// @ts-nocheck
import { Request } from 'express';
import { Document } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'entrepreneur' | 'admin' | 'officer';
  udyamNumber?: string;
  location?: string;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IProject extends Document {
  _id: string;
  userId: string;
  projectType: 'individual' | 'cluster';
  projectName: string;
  industrySector: string;
  subSector?: string;
  totalCost: number;
  ownContribution: number;
  loanAmount: number;
  location: string;
  inputs: {
    businessDescription?: string;
    targetMarket?: string;
    rawMaterials?: Array<{
      item: string;
      quantity: number;
      unit: string;
      costPerUnit: number;
    }>;
    machinery?: Array<{
      equipment: string;
      quantity: number;
      cost: number;
    }>;
    manpower?: Array<{
      designation: string;
      count: number;
      salaryPerMonth: number;
    }>;
    infrastructure?: {
      landArea?: number;
      buildingArea?: number;
      landCost?: number;
      buildingCost?: number;
    };
  };
  status: 'draft' | 'in-progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface IScheme extends Document {
  _id: string;
  schemeCode: string;
  schemeName: string;
  nameInTelugu?: string;
  description: string;
  descriptionInTelugu?: string;
  eligibilityCriteria: {
    minAge?: number;
    maxAge?: number;
    minCost?: number;
    maxCost?: number;
    applicableFor?: string[];
    category?: string[];
  };
  benefits: {
    subsidyPercentage?: number;
    maxSubsidyAmount?: number;
    interestRate?: number;
    marginMoney?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ISchemeMatch extends Document {
  _id: string;
  projectId: string;
  schemeCode: string;
  confidenceScore: number;
  selected: boolean;
  matchReason: string;
  createdAt: Date;
}

export interface IDPRVersion extends Document {
  _id: string;
  projectId: string;
  contentPath?: string;
  content: {
    english: {
      executiveSummary: string;
      businessProfile: string;
      marketAnalysis: string;
      technicalFeasibility: string;
      financialProjections: string;
      conclusion: string;
    };
    telugu: {
      executiveSummary: string;
      businessProfile: string;
      marketAnalysis: string;
      technicalFeasibility: string;
      financialProjections: string;
      conclusion: string;
    };
  };
  financials: {
    projectCost: any;
    meansOfFinance: any;
    profitLoss: any;
    cashFlow: any;
    balanceSheet: any;
    ratios: any;
  };
  generatedAt: Date;
  language: 'english' | 'telugu' | 'bilingual';
  status?: 'draft' | 'submitted' | 'approved' | 'rejected';
  qualityScore?: number;
  qualityFeedback?: {
    score: number;
    feedback: string[];
    weakSections: string[];
    lastAnalyzedAt: Date;
  };
  submittedAt?: Date;
  submittedTo?: 'admin' | 'bank' | 'apmsme';
  approvedAt?: Date;
  approvedBy?: string;
}

export interface IFeedback extends Document {
  _id: string;
  projectId: string;
  userId: string;
  rating: number;
  comments?: string;
  feedbackType: 'quality' | 'accuracy' | 'usability' | 'general';
  createdAt: Date;
}

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export interface DPRGenerationRequest {
  projectData: IProject;
  language: 'english' | 'telugu' | 'bilingual';
  includeFinancials: boolean;
}

export interface TranslationRequest {
  text: string;
  targetLanguage: 'en' | 'te';
}

