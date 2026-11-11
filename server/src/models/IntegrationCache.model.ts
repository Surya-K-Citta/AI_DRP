// @ts-nocheck
import mongoose, { Schema } from 'mongoose';

// Last good answer from an external registry, kept so the app can still answer when the registry is down.
const schema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    integration: { type: String, required: true, index: true },
    value: { type: Schema.Types.Mixed },
    fetchedAt: { type: Date, required: true },
  },
  { timestamps: false }
);

export const IntegrationCache = mongoose.model('IntegrationCache', schema);
