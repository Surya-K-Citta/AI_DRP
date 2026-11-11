import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const FILE_KEY =
  /^(aadhaa?r.*|.*aadhaa?r.*|pan|panNumber|panCard|pancard|passbook.*|.*passbook.*|upi.*|.*upiQr.*|kyc.*|.*kyc.*|ration.*|voterId|educationCertificate|covOrLor|udyamCertificate|toolkitQuotation|weaverId|spvRegistration|landDocuments|buildingEstimates|machineryQuotations|memberRegistrations|supportingDocuments|documentUrl|fileUrl|scanUrl|idProof|photoId|cloudinary.*)$/i;

const ID_NUMBER_KEY = /^(aadhaa?r.*|pan|panNumber|panCard|pancard)$/i;

const AADHAAR_WHOLE = /^\d{4}[\s-]?\d{4}[\s-]?\d{4}$/;
const PAN_WHOLE = /^[A-Z]{5}\d{4}[A-Z]$/i;

export type KycRef = {
  status: 'uploaded' | 'pending';
  fileId?: string;
  originalName?: string;
};

export function kycDir(): string {
  const dir = path.join(process.cwd(), 'uploads', 'kyc');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function clusterPhotoDir(): string {
  const dir = path.join(process.cwd(), 'uploads', 'cluster');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export class KycEncryptionRequiredError extends Error {
  code = 'KYC_ENCRYPTION_REQUIRED';
  constructor() {
    super(
      'KYC_ENCRYPTION_KEY is required in production to store identity files and cluster photos.'
    );
    this.name = 'KycEncryptionRequiredError';
  }
}

function encryptionKey(): Buffer | null {
  const raw = process.env.KYC_ENCRYPTION_KEY;
  if (!raw || !raw.trim()) return null;
  return crypto.createHash('sha256').update(raw.trim()).digest();
}

export function isKycEncryptionEnabled(): boolean {
  return !!encryptionKey();
}

export function assertKycEncryptionConfigured(): void {
  if (process.env.NODE_ENV === 'production' && !encryptionKey()) {
    throw new KycEncryptionRequiredError();
  }
}

export function encryptBuffer(plain: Buffer): Buffer {
  const key = encryptionKey();
  if (!key) return plain;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from('KYC1'), iv, tag, encrypted]);
}

export function decryptBuffer(stored: Buffer): Buffer {
  const key = encryptionKey();
  if (!key || stored.length < 36 || stored.subarray(0, 4).toString() !== 'KYC1') {
    return stored;
  }
  const iv = stored.subarray(4, 16);
  const tag = stored.subarray(16, 32);
  const encrypted = stored.subarray(32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

export function persistKycBytes(filePath: string, bytes: Buffer): { encrypted: boolean } {
  assertKycEncryptionConfigured();
  const key = encryptionKey();
  if (!key) {
    fs.writeFileSync(filePath, bytes);
    return { encrypted: false };
  }
  fs.writeFileSync(filePath, encryptBuffer(bytes));
  return { encrypted: true };
}

export function readKycBytes(filePath: string): Buffer {
  const stored = fs.readFileSync(filePath);
  return decryptBuffer(stored);
}

function isPublicFileUrl(value: string): boolean {
  if (/res\.cloudinary\.com/i.test(value)) return true;
  if (value.includes('/uploads/')) return true;
  return false;
}

function toUploadedRef(value: unknown): KycRef {
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const fileId = typeof obj.fileId === 'string' ? obj.fileId : undefined;
    const originalName =
      typeof obj.originalName === 'string'
        ? obj.originalName
        : typeof obj.name === 'string'
          ? obj.name
          : undefined;
    return { status: 'uploaded', fileId, originalName };
  }
  if (typeof value === 'string' && value.trim() && !isPublicFileUrl(value)) {
    return { status: 'uploaded', originalName: path.basename(value) };
  }
  return { status: 'uploaded' };
}

export function kycRefFromUpload(fileId: string, originalName: string): KycRef {
  return { status: 'uploaded', fileId, originalName };
}

/**
 * Drop public file URLs and Aadhaar/PAN numbers from a payload we persist.
 */
export function sanitizeStoredPayload<T>(value: T, key = '', depth = 0): T {
  if (value == null || depth > 14) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (FILE_KEY.test(key) && isPublicFileUrl(trimmed)) {
      return toUploadedRef(trimmed) as T;
    }
    // A firm PAN is kept; a personal PAN (4th letter P) is dropped.
    if (/^firmPan$/i.test(key) && /^[A-Z]{3}P[A-Z]\d{4}[A-Z]$/i.test(trimmed)) {
      return '' as T;
    }
    if (ID_NUMBER_KEY.test(key) && (AADHAAR_WHOLE.test(trimmed) || PAN_WHOLE.test(trimmed))) {
      return '' as T;
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeStoredPayload(item, key, depth + 1)) as T;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (obj.status === 'uploaded' || obj.fileId) {
      return toUploadedRef(obj) as T;
    }
    const out: Record<string, unknown> = {};
    for (const [nestedKey, nested] of Object.entries(obj)) {
      out[nestedKey] = sanitizeStoredPayload(nested, nestedKey, depth + 1);
    }
    return out as T;
  }
  return value;
}

/** A number from the environment. A blank or missing value is "not set" (never 0). */
function envNumber(name: string): number {
  const raw = (process.env[name] || '').trim();
  return raw === '' ? NaN : Number(raw);
}

export function retentionIdleDays(): number {
  const n = envNumber('RETENTION_IDLE_DAYS');
  if (Number.isFinite(n) && n >= 0) return n;
  return 365;
}

export function retentionWarningDays(): number {
  const n = envNumber('RETENTION_WARNING_DAYS');
  if (Number.isFinite(n) && n >= 0) return n;
  return 15;
}

/** Per-event audit lifetime. Default 24 months. Floor in the Rules is 1 year. */
export function auditRetentionDays(): number {
  const n = envNumber('AUDIT_RETENTION_DAYS');
  if (Number.isFinite(n) && n > 0) return n;
  return 730;
}

export function isPrivateFileRef(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('file:') && value.length > 5;
}

export function fileIdFromRef(value: string): string {
  return value.startsWith('file:') ? value.slice(5) : value;
}

export function privateFileRef(fileId: string): string {
  return `file:${fileId}`;
}
