import path from 'path';

/** Escape text so it can be used inside a regular expression as plain characters (stops regex injection and ReDoS). */
export function escapeRegex(text: string): string {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 200);
}

/** True only when `target` is inside `root` after resolving "..", symlink-free path tricks and separators. */
export function isInside(root: string, target: string): boolean {
  const base = path.resolve(root) + path.sep;
  const full = path.resolve(target);
  return full === path.resolve(root) || full.startsWith(base);
}

/** A Content-Disposition header value that cannot be broken out of by quotes, CR/LF or non-ASCII characters. */
export function contentDisposition(type: 'inline' | 'attachment', fileName: string): string {
  // eslint-disable-next-line no-control-regex
  const plain = String(fileName || 'file').replace(/[\u0000-\u001F\u007F"\;<>]/g, '_').replace(/[^\x20-\x7E]/g, '_').slice(0, 120) || 'file';
  const encoded = encodeURIComponent(String(fileName || 'file')).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return `${type}; filename="${plain}"; filename*=UTF-8''${encoded}`;
}

/** Headers for any file we hand back to a browser: it may be shown, but never run as a page. */
export function fileResponseHeaders(res: { setHeader: (k: string, v: string) => void }) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
}
