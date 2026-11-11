import mongoose, { Schema } from 'mongoose';

/** Written when the retention job removes the oldest audit rows: the hash of the last removed row, so the chain still verifies. */
const auditAnchorSchema = new Schema(
  {
    key: { type: String, default: 'audit', unique: true },
    upToSeq: { type: Number, default: 0 },
    lastHash: { type: String, default: '' },
    purgedCount: { type: Number, default: 0 },
    purgedAt: { type: Date },
  },
  { versionKey: false }
);

export const AuditAnchor = mongoose.model('AuditAnchor', auditAnchorSchema);
