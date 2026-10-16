import mongoose, { Schema } from 'mongoose';

/**
 * The audit log is append-only. Each event carries the SHA-256 of the one before it (`prevHash`), so changing,
 * removing or inserting a row breaks the chain and `verifyAuditChain` shows where. Writing goes through
 * `appendAuditEvent` (lib/auditChain.ts). Any attempt to update or delete through this model is refused; the only
 * way rows are removed is the retention job (`purgeAuditEvents`), which records an anchor so the chain still verifies.
 * In production the database user should also have no update or delete rights on this collection.
 */
const auditEventSchema = new Schema(
  {
    seq: { type: Number, index: { unique: true, sparse: true } },
    at: { type: Date, required: true, default: Date.now, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    role: { type: String },
    action: { type: String, required: true, index: true },
    targetType: { type: String },
    targetId: { type: String },
    ip: { type: String },
    /** What happened, with secrets removed and size capped. Never holds passwords, tokens or document text. */
    payload: { type: Schema.Types.Mixed },
    prevHash: { type: String },
    hash: { type: String },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

auditEventSchema.index({ userId: 1, at: -1 });

const REFUSED = 'The audit log is append-only: events cannot be changed or deleted.';
const refuse = function () {
  throw new Error(REFUSED);
};
for (const op of ['updateOne', 'updateMany', 'findOneAndUpdate', 'findOneAndReplace', 'findOneAndDelete', 'findOneAndRemove', 'replaceOne', 'deleteOne', 'deleteMany'] as const) {
  auditEventSchema.pre(op as any, refuse);
}
auditEventSchema.pre('save', function () {
  if (!this.isNew) throw new Error(REFUSED);
});
auditEventSchema.pre('deleteOne', { document: true, query: false }, refuse);

export const AuditEvent = mongoose.model('AuditEvent', auditEventSchema);
