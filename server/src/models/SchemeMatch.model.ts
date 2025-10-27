import mongoose, { Schema } from 'mongoose';
import { ISchemeMatch } from '../types';

const schemeMatchSchema = new Schema<ISchemeMatch>(
  {
    projectId: {
      type: String,
      required: true,
      ref: 'Project',
      index: true,
    },
    schemeCode: {
      type: String,
      required: true,
      ref: 'Scheme',
    },
    confidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    selected: {
      type: Boolean,
      default: false,
    },
    matchReason: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

schemeMatchSchema.index({ projectId: 1, confidenceScore: -1 });

export const SchemeMatch = mongoose.model<ISchemeMatch>(
  'SchemeMatch',
  schemeMatchSchema
);

