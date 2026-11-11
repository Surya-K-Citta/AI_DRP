import mongoose, { Schema } from 'mongoose';

/**
 * Register of security incidents that may be personal data breaches. One row per incident, with the evidence the
 * department must keep: what happened, which data, how many people, when it was found, what was done to contain it,
 * who was told, and what changes afterwards. Rows are never deleted by the retention job.
 */
const timelineSchema = new Schema(
  {
    at: { type: Date, default: Date.now },
    by: { type: String },
    kind: { type: String, required: true },
    note: { type: String, maxlength: 2000 },
  },
  { _id: false }
);

const incidentSchema = new Schema(
  {
    reference: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    /** Nature and scope: what happened and how far it reaches. */
    nature: { type: String, required: true, trim: true, maxlength: 4000 },
    /** Kinds of personal data involved (for example: contact details, DPR text, identity scans). */
    dataAffected: { type: [String], default: [] },
    usersAffectedCount: { type: Number, default: 0, min: 0 },
    /** Users who should be told. Empty when the count is only an estimate. */
    affectedUserIds: { type: [Schema.Types.ObjectId], default: [], ref: 'User' },
    recordsAffected: { type: String, maxlength: 1000 },
    detectedAt: { type: Date, required: true },
    reportedBy: { type: String },
    status: {
      type: String,
      enum: ['detected', 'assessing', 'declared_breach', 'not_a_breach', 'contained', 'closed'],
      default: 'detected',
      index: true,
    },
    /** Officer who decided whether this is a personal data breach. */
    declaredBy: { type: String },
    declaredAt: { type: Date },
    assessmentNote: { type: String, maxlength: 2000 },
    containmentActions: { type: String, maxlength: 4000 },
    containedAt: { type: Date },
    /** Report to the Data Protection Board of India. */
    boardIntimatedAt: { type: Date },
    boardDetailedReportAt: { type: Date },
    boardReference: { type: String, maxlength: 200 },
    /** Notice to affected people. */
    usersNotifiedAt: { type: Date },
    usersNotifiedCount: { type: Number, default: 0 },
    correctiveActions: { type: String, maxlength: 4000 },
    closedAt: { type: Date },
    timeline: { type: [timelineSchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

incidentSchema.index({ detectedAt: -1 });

export const DataBreachIncident = mongoose.model('DataBreachIncident', incidentSchema);
