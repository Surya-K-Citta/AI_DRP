// @ts-nocheck
import crypto from 'crypto';
import { AuditEvent } from '../models/AuditEvent.model';
import { AuditAnchor } from '../models/AuditAnchor.model';

export const GENESIS_HASH = '0'.repeat(64);

type EventLike = {
  seq: number;
  at: Date | string;
  userId?: unknown;
  role?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  ip?: string;
  payload?: unknown;
};

/** Fixed field order, so the same event always hashes to the same value. */
export function canonicalEvent(e: EventLike, prevHash: string): string {
  return JSON.stringify([
    e.seq,
    new Date(e.at).toISOString(),
    e.userId ? String(e.userId) : '',
    e.role || '',
    e.action,
    e.targetType || '',
    e.targetId || '',
    e.ip || '',
    stable(e.payload ?? null),
    prevHash,
  ]);
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value as object).sort().map((k) => [k, stable((value as any)[k])]));
  }
  return value;
}

export const hashEvent = (e: EventLike, prevHash: string): string => crypto.createHash('sha256').update(canonicalEvent(e, prevHash)).digest('hex');

const SECRET_KEY = /pass(word|phrase)|secret|token|authorization|cookie|otp|aadhaa?r|\bpan\b|panNumber|account(number)?|ifsc|upi|kyc|apikey|api_key/i;
const MAX_STRING = 500;
const MAX_BYTES = 4096;

/** A safe, small copy of what to record: secrets and identity numbers removed, long text cut short, depth and size capped. */
export function auditPayload(value: unknown, depth = 0): unknown {
  if (value == null) return value;
  if (typeof value === 'string') return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value;
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Date) return value.toISOString();
  if (depth >= 4) return '[nested]';
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => auditPayload(item, depth + 1));
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>).slice(0, 40)) {
      out[key] = SECRET_KEY.test(key) ? '[redacted]' : auditPayload(child, depth + 1);
    }
    return out;
  }
  return String(value);
}

function capPayload(value: unknown): unknown {
  if (value == null) return undefined;
  const cleaned = auditPayload(value);
  const size = Buffer.byteLength(JSON.stringify(cleaned) || '');
  return size > MAX_BYTES ? { truncated: true, bytes: size } : cleaned;
}

let queue: Promise<unknown> = Promise.resolve();

async function appendOnce(input: Omit<EventLike, 'seq' | 'at'> & { at?: Date }) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const last: any = await AuditEvent.findOne({ seq: { $exists: true } }).sort({ seq: -1 }).select('seq hash').lean();
    let seq = last?.seq ?? 0;
    let prevHash = last?.hash ?? GENESIS_HASH;
    if (!last) {
      const anchor: any = await AuditAnchor.findOne({ key: 'audit' }).lean();
      if (anchor) {
        seq = anchor.upToSeq;
        prevHash = anchor.lastHash || GENESIS_HASH;
      }
    }
    const event = { ...input, seq: seq + 1, at: input.at || new Date(), payload: capPayload(input.payload) };
    const hash = hashEvent(event, prevHash);
    try {
      await AuditEvent.create({ ...event, prevHash, hash });
      return;
    } catch (error: any) {
      // Another server wrote this number first: read the new tail and try again.
      if (error?.code !== 11000) throw error;
    }
  }
  throw new Error('Could not append to the audit log');
}

/** Adds one event to the end of the chain. Writes are queued so numbers stay in order within a server. */
export function appendAuditEvent(input: Omit<EventLike, 'seq' | 'at'> & { at?: Date }): Promise<void> {
  const run = queue.then(() => appendOnce(input));
  queue = run.catch(() => undefined);
  return run as Promise<void>;
}

export type ChainVerdict = {
  ok: boolean;
  checked: number;
  firstSeq: number | null;
  lastSeq: number | null;
  anchorSeq: number;
  problem?: { seq: number; reason: string };
};

/** Walks the chain from the oldest kept event and recomputes every hash. */
export async function verifyAuditChain(): Promise<ChainVerdict> {
  const anchor: any = await AuditAnchor.findOne({ key: 'audit' }).lean();
  let expectedPrev = anchor?.lastHash || GENESIS_HASH;
  let expectedSeq: number | null = anchor ? anchor.upToSeq + 1 : null;
  let checked = 0;
  let firstSeq: number | null = null;
  let lastSeq: number | null = null;
  const cursor = AuditEvent.find({ seq: { $exists: true } }).sort({ seq: 1 }).lean().cursor();
  for await (const e of cursor as any) {
    if (firstSeq === null) {
      firstSeq = e.seq;
      if (expectedSeq === null) expectedSeq = e.seq;
      if (!anchor && e.seq !== 1 && e.prevHash !== GENESIS_HASH) {
        // The oldest rows were removed without an anchor.
        return { ok: false, checked, firstSeq, lastSeq, anchorSeq: 0, problem: { seq: e.seq, reason: 'The start of the log is missing' } };
      }
      if (!anchor) expectedPrev = e.prevHash;
    }
    if (e.seq !== expectedSeq) return { ok: false, checked, firstSeq, lastSeq, anchorSeq: anchor?.upToSeq ?? 0, problem: { seq: expectedSeq as number, reason: 'An event is missing from the sequence' } };
    if (e.prevHash !== expectedPrev) return { ok: false, checked, firstSeq, lastSeq, anchorSeq: anchor?.upToSeq ?? 0, problem: { seq: e.seq, reason: 'The link to the previous event is broken' } };
    if (hashEvent(e, e.prevHash) !== e.hash) return { ok: false, checked, firstSeq, lastSeq, anchorSeq: anchor?.upToSeq ?? 0, problem: { seq: e.seq, reason: 'The event was changed after it was written' } };
    expectedPrev = e.hash;
    expectedSeq = e.seq + 1;
    lastSeq = e.seq;
    checked += 1;
  }
  return { ok: true, checked, firstSeq, lastSeq, anchorSeq: anchor?.upToSeq ?? 0 };
}

/**
 * Retention: removes events older than `cutoff` and records an anchor so the rest of the chain still verifies.
 * This is the only code path that deletes audit rows.
 */
export async function purgeAuditEvents(cutoff: Date): Promise<number> {
  const old: any = await AuditEvent.find({ at: { $lt: cutoff }, seq: { $exists: true } }).sort({ seq: -1 }).limit(1).select('seq hash').lean();
  const removed = await AuditEvent.collection.deleteMany({ at: { $lt: cutoff } });
  if (old[0]) {
    await AuditAnchor.collection.updateOne(
      { key: 'audit' },
      { $set: { upToSeq: old[0].seq, lastHash: old[0].hash, purgedAt: new Date() }, $inc: { purgedCount: removed.deletedCount || 0 } },
      { upsert: true }
    );
  }
  return removed.deletedCount || 0;
}
