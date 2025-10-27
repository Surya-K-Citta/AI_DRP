import mongoose, { Schema } from 'mongoose';
import { IFeedback } from '../types';

const feedbackSchema = new Schema<IFeedback>(
  {
    projectId: {
      type: String,
      required: true,
      ref: 'Project',
      index: true,
    },
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comments: String,
    feedbackType: {
      type: String,
      enum: ['quality', 'accuracy', 'usability', 'general'],
      default: 'general',
    },
  },
  {
    timestamps: true,
  }
);

feedbackSchema.index({ projectId: 1, createdAt: -1 });

export const Feedback = mongoose.model<IFeedback>('Feedback', feedbackSchema);

