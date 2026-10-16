/**
 * Checks a chosen file by its first bytes before it is uploaded, so a renamed HTML or program file is stopped
 * on the device with a clear message. The server checks again and is the real gate.
 */
export type UploadKind = 'image' | 'document' | 'text' | 'audio';
export type FileVerdict = { ok: true; mime: string; kind: UploadKind } | { ok: false; reason: string };

const starts = (b: Uint8Array, bytes: number[], at = 0) => bytes.every((v, i) => b[at + i] === v);
const ascii = (b: Uint8Array, from: number, to: number) => String.fromCharCode(...Array.from(b.subarray(from, to)));

function looksLikeText(b: Uint8Array): boolean {
  if (!b.length) return false;
  let controls = 0;
  for (const byte of b) {
    if (byte === 0) return false;
    if (byte < 9 || (byte > 13 && byte < 32)) controls += 1;
  }
  if (controls / b.length > 0.01) return false;
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(b.subarray(0, Math.max(0, b.length - 3)));
    return true;
  } catch {
    return false;
  }
}

export function detectFileType(b: Uint8Array): { mime: string; kind: UploadKind } | null {
  if (starts(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: 'image/png', kind: 'image' };
  if (starts(b, [0xff, 0xd8, 0xff])) return { mime: 'image/jpeg', kind: 'image' };
  if (ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP') return { mime: 'image/webp', kind: 'image' };
  if (ascii(b, 0, 1024).includes('%PDF-')) return { mime: 'application/pdf', kind: 'document' };
  if (starts(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return { mime: 'application/msword', kind: 'document' };
  if (ascii(b, 0, 5) === '{\\rtf') return { mime: 'application/rtf', kind: 'document' };
  if (starts(b, [0x50, 0x4b, 0x03, 0x04])) {
    const names = ascii(b, 0, Math.min(b.length, 4096));
    return names.includes('[Content_Types].xml') && names.includes('word/')
      ? { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', kind: 'document' }
      : null;
  }
  if (starts(b, [0x1a, 0x45, 0xdf, 0xa3])) return { mime: 'audio/webm', kind: 'audio' };
  if (ascii(b, 0, 4) === 'OggS') return { mime: 'audio/ogg', kind: 'audio' };
  if (ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WAVE') return { mime: 'audio/wav', kind: 'audio' };
  if (ascii(b, 0, 3) === 'ID3' || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return { mime: 'audio/mpeg', kind: 'audio' };
  if (ascii(b, 4, 8) === 'ftyp') return { mime: 'audio/mp4', kind: 'audio' };
  if (looksLikeText(b)) return { mime: 'text/plain', kind: 'text' };
  return null;
}

export const MAX_UPLOAD_BYTES: Record<UploadKind, number> = {
  image: 10 * 1024 * 1024,
  document: 50 * 1024 * 1024,
  text: 5 * 1024 * 1024,
  audio: 25 * 1024 * 1024,
};

export async function checkUploadFile(file: File, accepted: UploadKind[]): Promise<FileVerdict> {
  if (!file.size) return { ok: false, reason: 'The file is empty.' };
  const buffer = new Uint8Array(await file.slice(0, 128 * 1024).arrayBuffer());
  const found = detectFileType(buffer);
  if (!found) return { ok: false, reason: 'This kind of file is not accepted. Use a PDF, Word file, text file or a JPG, PNG or WebP picture.' };
  if (!accepted.includes(found.kind)) return { ok: false, reason: 'This kind of file is not accepted here.' };
  if (file.size > MAX_UPLOAD_BYTES[found.kind]) {
    return { ok: false, reason: 'The file is too large.' };
  }
  return { ok: true, mime: found.mime, kind: found.kind };
}
