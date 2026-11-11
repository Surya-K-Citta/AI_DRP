import mongoose, { Schema } from 'mongoose';

const privacyComplaintSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, trim: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 4000 },
    inbox: { type: String, required: true },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    /** Answer to the person, written by the officer. Shown to them on the privacy page. */
    response: { type: String, trim: true, maxlength: 4000 },
    respondedAt: { type: Date },
    respondedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    /** Officer or team looking after it. */
    assignedTo: { type: String, trim: true, maxlength: 200 },
    /** Internal note, never shown to the person. */
    internalNote: { type: String, trim: true, maxlength: 4000 },
    /** Last day to answer under the DPDP Rules. */
    dueAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

privacyComplaintSchema.index({ createdAt: -1 });

export const PrivacyComplaint = mongoose.model(
  'PrivacyComplaint',
  privacyComplaintSchema
);
