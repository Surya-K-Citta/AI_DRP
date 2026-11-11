// @ts-nocheck
import mongoose, { Schema } from 'mongoose';

/**
 * One signed-in browser. The browser holds a random secret in an httpOnly cookie; only its hash is stored.
 * A session stays alive while it is used at least once every idle window, up to an absolute limit.
 */
const refreshSessionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    lastUsedAt: { type: Date, required: true },
    absoluteExpiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
    ip: String,
    userAgent: String,
  },
  { timestamps: true }
);

// Mongo removes rows an hour after the absolute limit.
refreshSessionSchema.index({ absoluteExpiresAt: 1 }, { expireAfterSeconds: 3600 });

export const RefreshSession = mongoose.model('RefreshSession', refreshSessionSchema);
