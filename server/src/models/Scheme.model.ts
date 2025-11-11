// @ts-nocheck
import mongoose, { Schema } from 'mongoose';
import { IScheme } from '../types';

const schemeSchema = new Schema<IScheme>(
  {
    schemeCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    schemeName: {
      type: String,
      required: true,
    },
    nameInTelugu: String,
    description: {
      type: String,
      required: true,
    },
    descriptionInTelugu: String,
    eligibilityCriteria: {
      minAge: Number,
      maxAge: Number,
      minCost: Number,
      maxCost: Number,
      applicableFor: [String],
      category: [String],
    },
    benefits: {
      subsidyPercentage: Number,
      maxSubsidyAmount: Number,
      interestRate: Number,
      marginMoney: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Index is already created by unique: true above

export const Scheme = mongoose.model<IScheme>('Scheme', schemeSchema);

