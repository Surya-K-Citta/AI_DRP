# Input safety: injection, XSS and uploads

Scope: every text input, request body, query string, URL parameter, uploaded file and the HTML that is printed to PDF.
This app uses **MongoDB**, so there is no SQL; the equivalent attack is NoSQL operator injection (`{"$ne": null}`), covered below.
This is a list of what is enforced and tested, not a certificate. "Zero vulnerabilities" cannot be proven; see "Known gaps".

## What is enforced

| Risk | Where | Control |
|---|---|---|
| NoSQL injection | server `lib/security/sanitizeInput.ts`, applied to body, query and params of every request (`index.ts`) | Keys starting with `$` are dropped at any depth; nested objects in query strings are dropped; login/registration passwords must be strings |
| Prototype pollution | same | `__proto__`, `constructor`, `prototype` keys dropped |
| Stored / reflected XSS | server (same file) and client `lib/security/sanitizeText.ts` (axios request interceptor) | Control characters removed; text that looks like markup is reduced to a small safe set (b, i, p, lists, tables, links with http/https/mailto/tel). Scripts, frames, objects, SVG, images, styles, handlers and `javascript:` links are removed. Plain text such as "< 5 years" or "A & B" is untouched. Passwords and tokens are never rewritten. React also escapes everything it renders, and the app has no `dangerouslySetInnerHTML` |
| Script, SSRF and local-file reads through PDF export | server `lib/security/sanitizeHtmlDoc.ts`, `pdfPage.ts`, `services/dpr.service.ts` (both PDF routes) | The HTML is cleaned (`sanitize-html` allow-list, `@import` / external `url()` / `expression()` removed), then printed in a browser with JavaScript off and **every request except `data:` URIs aborted** (no network, no `file://`) |
| Path traversal and regex injection | `controllers/document.controller.ts` file serving, `lib/security/http.ts` | Bare file names only, resolved path must stay inside `uploads/`, search text is regex-escaped |
| Malicious uploads | server `lib/security/uploadGuard.ts` after every multer route; client `lib/security/fileGuard.ts` before upload | The type is read from the file's first bytes (PNG, JPEG, WebP, PDF, DOC, DOCX, RTF, text, audio). The declared MIME type and extension are ignored. HTML, scripts, executables, generic zips and empty files are deleted and refused. The stored extension comes from the verified type, the display name is cleaned. Size limits per kind. Pictures added in the report editor must be real PNG, JPEG or WebP |
| Files served back | `getFile`, `serveFile*` | `Content-Disposition` built safely (no header injection), `X-Content-Type-Options: nosniff`, `Content-Security-Policy: sandbox` |
| Unsafe links | client `safeUrl()` | Only http(s), mailto and tel links are rendered |
| Access to other people's DPRs (found while testing) | `middleware/dprAccess.middleware.ts`, `router.param('dprId')` | PDF, DOCX, quality, translate and the other `:dprId` routes were open to any signed-in user. Now owner only, or staff in scope read-only |
| Known-vulnerable packages | `npm audit fix` run on server and client | Server 31 → 14, client 24 → 9 findings. The rest need breaking upgrades (see below) |

## Tests

- `cd server && npm test` includes `security.test.ts`: operators, prototype keys, 9 script payloads, plain text kept, HTML document cleaning, upload byte checks, path and header helpers, PDF lock-down.
- `cd server && npm run test:security` (API running): operator injection in login and query strings, stored script markup, path traversal names, fake and real image / PDF uploads, other-user access to every DPR route, and a hostile HTML page exported to PDF while a local server counts requests (must be zero).
- `cd client && npm test`: client sanitising and file-type detection.

## Known gaps (not fixed here)

- Remaining `npm audit` findings: puppeteer and `@xenova/transformers` (server), `jspdf` (client) need major-version upgrades that were not applied without testing the exports and AI features. Review them next.
- Uploaded PDFs and Word files are checked for type, not scanned for malware or embedded scripts.
- Other `:cluster` routes without a `:dprId` and the `/sessions/:id/...` routes were not audited for ownership.
- No CSP is set by the Vite client in production hosting (helmet only protects the API); set one at the web host.
- Error responses still include `error.message` in many controllers (information disclosure).
- Login brute-force protection is the general rate limit only.
