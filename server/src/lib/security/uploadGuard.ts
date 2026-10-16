import fs from 'fs';
import type { NextFunction, Request, Response } from 'express';
import { sanitizeValue } from './sanitizeInput';

/**
 * Upload checks that do not trust the browser. The declared MIME type and file extension are ignored: the
 * kind of file is read from its first bytes. Anything that does not match a type this endpoint accepts is
 * deleted and refused, so an HTML or script file renamed to .png never reaches storage.
 */

export type UploadKind = 'image' | 'document' | 'text' | 'audio';
export type Detected = { mime: string; ext: string; kind: UploadKind };

const startsWith = (buf: Buffer, bytes: number[], offset = 0) => bytes.every((byte, i) => buf[offset + i] === byte);
const ascii = (buf: Buffer, from: number, to: number) => buf.subarray(from, to).toString('latin1');

function looksLikeText(buf: Buffer): boolean {
  if (buf.length === 0) return false;
  const sample = buf.subarray(0, Math.min(buf.length, 64 * 1024));
  let controls = 0;
  for (const byte of sample) {
    if (byte === 0) return false;
    if (byte < 9 || (byte > 13 && byte < 32)) controls += 1;
  }
  if (controls / sample.length > 0.01) return false;
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(sample.subarray(0, sample.length - 3));
    return true;
  } catch {
    return false;
  }
}

/** The real type of a file from its first bytes, or null when it is not a type we accept. */
export function detectFileType(head: Buffer, wholeFileIsText = false): Detected | null {
  if (startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: 'image/png', ext: '.png', kind: 'image' };
  if (startsWith(head, [0xff, 0xd8, 0xff])) return { mime: 'image/jpeg', ext: '.jpg', kind: 'image' };
  if (ascii(head, 0, 4) === 'RIFF' && ascii(head, 8, 12) === 'WEBP') return { mime: 'image/webp', ext: '.webp', kind: 'image' };
  if (ascii(head, 0, 1024).includes('%PDF-')) return { mime: 'application/pdf', ext: '.pdf', kind: 'document' };
  if (startsWith(head, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return { mime: 'application/msword', ext: '.doc', kind: 'document' };
  if (ascii(head, 0, 5) === '{\\rtf') return { mime: 'application/rtf', ext: '.rtf', kind: 'document' };
  if (startsWith(head, [0x50, 0x4b, 0x03, 0x04])) {
    const names = head.toString('latin1');
    if (names.includes('[Content_Types].xml') && names.includes('word/')) {
      return { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: '.docx', kind: 'document' };
    }
    return null;
  }
  if (startsWith(head, [0x1a, 0x45, 0xdf, 0xa3])) return { mime: 'audio/webm', ext: '.webm', kind: 'audio' };
  if (ascii(head, 0, 4) === 'OggS') return { mime: 'audio/ogg', ext: '.ogg', kind: 'audio' };
  if (ascii(head, 0, 4) === 'RIFF' && ascii(head, 8, 12) === 'WAVE') return { mime: 'audio/wav', ext: '.wav', kind: 'audio' };
  if (ascii(head, 0, 3) === 'ID3' || (head[0] === 0xff && (head[1] & 0xe0) === 0xe0)) return { mime: 'audio/mpeg', ext: '.mp3', kind: 'audio' };
  if (ascii(head, 4, 8) === 'ftyp') return { mime: 'audio/mp4', ext: '.m4a', kind: 'audio' };
  if (wholeFileIsText || looksLikeText(head)) return { mime: 'text/plain', ext: '.txt', kind: 'text' };
  return null;
}

/** A file name that is safe to store and to show: no path, no control characters, no markup. */
export function safeFileName(name: string | undefined): string {
  const base = String(name || 'file').split(/[\\/]/).pop() || 'file';
  // eslint-disable-next-line no-control-regex
  const cleaned = base.replace(/[\u0000-\u001F\u007F<>:"|?*&;`$'\\]/g, '_').replace(/\.{2,}/g, '.').trim();
  const trimmed = cleaned.length > 120 ? cleaned.slice(-120) : cleaned;
  return trimmed || 'file';
}

/** Extension for a stored file, taken from the verified type, never from the uploaded name. */
export function extensionForMime(mime: string): string {
  switch (mime) {
    case 'image/png': return '.png';
    case 'image/jpeg':
    case 'image/jpg': return '.jpg';
    case 'image/webp': return '.webp';
    case 'application/pdf': return '.pdf';
    case 'application/msword': return '.doc';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': return '.docx';
    case 'application/rtf': return '.rtf';
    case 'text/plain':
    case 'text/markdown': return '.txt';
    case 'audio/webm': return '.webm';
    case 'audio/ogg': return '.ogg';
    case 'audio/wav': case 'audio/x-wav': return '.wav';
    case 'audio/mpeg': case 'audio/mp3': return '.mp3';
    case 'audio/mp4': case 'audio/x-m4a': return '.m4a';
    default: return '.bin';
  }
}

export type Verdict = { ok: true; detected: Detected } | { ok: false; reason: string };

export function verifyBuffer(buffer: Buffer, accepted: UploadKind[]): Verdict {
  if (!buffer || buffer.length === 0) return { ok: false, reason: 'The file is empty.' };
  const head = buffer.subarray(0, 128 * 1024);
  const detected = detectFileType(head, buffer.length <= head.length && looksLikeText(head));
  if (!detected) return { ok: false, reason: 'This kind of file is not accepted.' };
  if (!accepted.includes(detected.kind)) return { ok: false, reason: `A ${detected.kind} file is not accepted here.` };
  return { ok: true, detected };
}

export function verifyFileOnDisk(filePath: string, accepted: UploadKind[]): Verdict {
  let fd: number | null = null;
  try {
    fd = fs.openSync(filePath, 'r');
    const size = fs.fstatSync(fd).size;
    if (size === 0) return { ok: false, reason: 'The file is empty.' };
    const head = Buffer.alloc(Math.min(size, 128 * 1024));
    fs.readSync(fd, head, 0, head.length, 0);
    const detected = detectFileType(head, size <= head.length && looksLikeText(head));
    if (!detected) return { ok: false, reason: 'This kind of file is not accepted.' };
    if (!accepted.includes(detected.kind)) return { ok: false, reason: `A ${detected.kind} file is not accepted here.` };
    return { ok: true, detected };
  } catch {
    return { ok: false, reason: 'The file could not be read.' };
  } finally {
    if (fd !== null) fs.closeSync(fd);
  }
}

/**
 * Express middleware to run right after multer. Verifies every uploaded file by its content, replaces the
 * declared type with the verified one and cleans the displayed file name. Bad files are deleted.
 */
export function uploadGuard(accepted: UploadKind[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const anyReq = req as any;
    const files: any[] = anyReq.file ? [anyReq.file] : Array.isArray(anyReq.files) ? anyReq.files : Object.values(anyReq.files || {}).flat();
    for (const file of files) {
      const verdict = file.buffer ? verifyBuffer(file.buffer, accepted) : verifyFileOnDisk(file.path, accepted);
      if (!verdict.ok) {
        for (const f of files) {
          if (f.path) {
            try { fs.unlinkSync(f.path); } catch { /* already gone */ }
          }
        }
        res.status(400).json({ success: false, code: 'UPLOAD_REJECTED', message: verdict.reason });
        return;
      }
      file.mimetype = verdict.detected.mime;
      file.originalname = safeFileName(file.originalname);
    }
    // Text fields sent with the file (multipart) are only available now, so clean them here.
    if (anyReq.body && typeof anyReq.body === 'object') {
      const cleaned = sanitizeValue(anyReq.body) as Record<string, unknown>;
      for (const key of Object.keys(anyReq.body)) delete anyReq.body[key];
      Object.assign(anyReq.body, cleaned);
    }
    next();
  };
}
