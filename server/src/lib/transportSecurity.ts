import fs from 'fs';
import https from 'https';
import type { NextFunction, Request, Response } from 'express';

// In production every request must arrive over HTTPS (directly, or via a proxy that sets X-Forwarded-Proto).
export function requireHttps(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_INSECURE_HTTP === 'true') return next();
  if (req.path === '/api/health') return next();
  const forwarded = req.headers['x-forwarded-proto'];
  const proto = String(forwarded || ((req.socket as any).encrypted ? 'https' : 'http')).split(',')[0].trim();
  if (proto === 'https') return next();
  if (req.method === 'GET' || req.method === 'HEAD') {
    return res.redirect(308, `https://${req.headers.host}${req.originalUrl}`);
  }
  return res.status(426).json({ success: false, message: 'HTTPS is required.' });
}

export const hstsOptions = { maxAge: 63072000, includeSubDomains: true, preload: true };

// Native TLS 1.3 listener, used when TLS_CERT_FILE and TLS_KEY_FILE are set. Behind a proxy, set the proxy to TLS 1.3 instead (see docs/security-and-compliance.md).
export function createTlsServer(app: any): https.Server | null {
  const certFile = process.env.TLS_CERT_FILE;
  const keyFile = process.env.TLS_KEY_FILE;
  if (!certFile || !keyFile) return null;
  return https.createServer(
    {
      cert: fs.readFileSync(certFile),
      key: fs.readFileSync(keyFile),
      minVersion: 'TLSv1.3',
      maxVersion: 'TLSv1.3',
    },
    app
  );
}

// Warns (does not stop the server) when the database link is not encrypted in transit.
export function databaseTransportWarning(uri: string | undefined): string | null {
  if (!uri || process.env.NODE_ENV !== 'production') return null;
  if (uri.startsWith('mongodb+srv://')) return null; // Atlas SRV connections use TLS by default
  if (/[?&]tls=true/i.test(uri) || /[?&]ssl=true/i.test(uri)) return null;
  if (/localhost|127\.0\.0\.1/.test(uri)) return null;
  return 'MONGODB_URI does not ask for TLS (add tls=true). Database traffic may be unencrypted.';
}
