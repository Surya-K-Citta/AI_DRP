// @ts-nocheck
import mongoose, { Schema } from 'mongoose';

const noteSchema = new Schema(
  { at: { type: Date, default: Date.now }, byUserId: String, byRole: String, visibleToUser: { type: Boolean, default: true }, text: { type: String, maxlength: 4000 } },
  { _id: false }
);

const schema = new Schema(
  {
    ticketNo: { type: String, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    priority: { type: String, enum: ['P1', 'P2', 'P3', 'P4'], default: 'P3', index: true },
    tier: { type: String, enum: ['L1', 'L2', 'L3'], default: 'L1', index: true },
    status: { type: String, enum: ['open', 'in_progress', 'waiting_user', 'resolved', 'closed'], default: 'open', index: true },
    firstResponseAt: Date,
    resolvedAt: Date,
    responseDueAt: Date,
    resolutionDueAt: Date,
    breached: { type: Boolean, default: false, index: true },
    escalations: [{ _id: false, at: Date, from: String, to: String, reason: String, auto: Boolean }],
    notes: [noteSchema],
  },
  { timestamps: true }
);

export const SupportTicket = mongoose.model('SupportTicket', schema);
