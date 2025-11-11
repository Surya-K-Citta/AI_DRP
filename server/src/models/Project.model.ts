// @ts-nocheck
import mongoose, { Schema } from 'mongoose';
import { IProject } from '../types';

const projectSchema = new Schema<IProject>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
      index: true,
    },
    projectType: {
      type: String,
      enum: ['individual', 'cluster'],
      required: true,
    },
    projectName: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    industrySector: {
      type: String,
      required: [true, 'Industry sector is required'],
      trim: true,
    },
    subSector: {
      type: String,
      trim: true,
    },
    totalCost: {
      type: Number,
      required: [true, 'Total cost is required'],
      min: 0,
    },
    ownContribution: {
      type: Number,
      required: true,
      min: 0,
    },
    loanAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    inputs: {
      businessDescription: String,
      targetMarket: String,
      rawMaterials: [
        {
          item: String,
          quantity: Number,
          unit: String,
          costPerUnit: Number,
        },
      ],
      machinery: [
        {
          equipment: String,
          quantity: Number,
          cost: Number,
        },
      ],
      manpower: [
        {
          designation: String,
          count: Number,
          salaryPerMonth: Number,
        },
      ],
      infrastructure: {
        landArea: Number,
        buildingArea: Number,
        landCost: Number,
        buildingCost: Number,
      },
    },
    status: {
      type: String,
      enum: ['draft', 'in-progress', 'completed'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ userId: 1, createdAt: -1 });

export const Project = mongoose.model<IProject>('Project', projectSchema);

