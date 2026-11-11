# Application Handbook — MSME AI DPR Tool

Version 1.0 · Audience: developers, testers, support staff, new team members

## 1. What the application is
A web application for APMSMEDC (Andhra Pradesh). Entrepreneurs answer plain-language questions and the tool produces a bank-ready **Detailed Project Report (DPR)** for a chosen scheme. District Reviewers check submitted DPRs. Admins manage users, policies and the audit trail.

Main capabilities: scheme finder, step-by-step DPR builder (30 scheme packs), live document preview, English/Telugu screens, English-only exports (PDF, Word, Excel), automatic data and finance checks, review workflow, role-based access, audit trail, privacy (DPDP) tools, support desk.

## 2. Architecture
```
Browser (React + Vite + TypeScript, Tailwind, Zustand, i18next)
        │  HTTPS, JSON, Bearer token (6.5 min) + refresh cookie
        ▼
API (Node.js + Express + TypeScript)  ── OpenAI (gpt-4o-mini) via AI gateway
        │                              ── AP MSME portal (read-first, cached)
        │                              ── Cloudinary (optional), Twilio SMS (optional)
        ├── MongoDB (users, projects, DPRs, versions, audit, tickets, cache)
        ├── Redis (optional: shared rate limits + account cache)
        └── Disk folder uploads/ (KYC files, photos, scheme documents)
PDF export: headless Chrome (Puppeteer) on the API server
```
| Layer | Technology |
|---|---|
| Client | React 18, Vite, TypeScript, Tailwind CSS, Zustand, react-i18next, react-hot-toast |
| API | Express, Mongoose, express-validator, JWT, bcrypt, helmet |
| Documents | Puppeteer (PDF), `docx` (Word), `pdf-lib` (footer stamp), XLS export |
| Quality | node:test unit and live tests, OpenAPI 3.0.3 generated from routes |

## 3. Folder map
| Path | Content |
|---|---|
| `client/src/pages` | One file per screen (Dashboard, IndividualDPRCreation, DPRPreview, AdminDashboard, DistrictReview, VentureMatch …) |
| `client/src/components` | Reusable UI by area: `individual-dpr`, `cluster-dpr`, `venture-match`, `session`, `privacy`, `ui`, `layout` |
| `client/src/lib` | Business logic: `individualDpr/` (questions, checks, finance), `finance/`, `ventureMatch/`, `i18n/te/` (Telugu), `rbac.ts`, `api.ts` |
| `client/src/store` | Zustand stores (draft state, auth, theme) |
| `server/src/routes` | Route files, one per area; mounted in `routes/index.ts` under `/api` |
| `server/src/controllers`, `services` | Request handling and business logic |
| `server/src/models` | Mongoose models |
| `server/src/lib` | Security, audit chain, session, AI gateway, integrations, encryption |
| `server/openapi.json` | Generated API description (`npm run docs:openapi`) |
| `docs/` | Topic documents (rbac, session, dpdp, financial-engine, ai-gateway …) |

## 4. Run it locally
Needs Node 20+ (24 used in development), MongoDB, an OpenAI key.
```
cd server && cp .env.example .env     # set MONGODB_URI, JWT_SECRET, OPENAI_API_KEY
npm install && npm run dev            # API on :5000
cd client && npm install && npm run dev   # UI on :5173 (proxies /api to :5000)
```
Development creates three test accounts (`rbac.admin@msme.test`, `rbac.officer@msme.test`, `rbac.consultant@msme.test`, password `Rbac-Test-2026`). They are **not** created when `NODE_ENV=production`.
API docs: http://localhost:5000/api/docs

## 5. Core flows
**Create a DPR (entrepreneur)**
1. *Scheme Finder* (`/venture-match`) asks about the business and owner, then suggests schemes (Suggested / Compare). Wording never promises approval.
2. *Create DPR* (`/individual-dpr/create`): pick a scheme. Each scheme has its own numbered steps (vanilla 18, PMEGP 14, MUDRA 12, short packs 5).
3. Answers autosave every 30 s and on step change; **Save Draft** saves now. A draft can be resumed from the dashboard.
4. The right-hand **live DPR** updates as typed; fields can also be edited in the document. Tabs: Form, Sections, Style.
5. **Check my answers** lists missing, unusual or inconsistent data. Blocking findings stop generation.
6. **Generate DPR** → *DPR Preview* (`/dpr/view/:id`) → download PDF/Word/Excel, submit for review.

**Review (District Reviewer / Admin)**: `/reviewer` queue → open DPR read-only → *Approve* or *Send back* with remarks. Only DPRs in status `submitted` can be reviewed.

**Cluster DPR** (`/cluster-dpr/create`): older multi-unit flow with AI-written sections, images and annexures.

## 6. Key modules
| Module | What it does | Where |
|---|---|---|
| Finance engine | Whole-rupee (integer) arithmetic; project cost, means of finance, DSCR, break-even, ratios; blocks submission on rule breaches (debt-equity above 3:1, promoter share below minimum, source ≠ uses) | `client/src/lib/finance`, `server/src/lib/financeGuard.ts`, `docs/financial-engine.md` |
| Data checks | Flags missing, ambiguous and outlier answers | `lib/individualDpr/dataChecks.ts`, `docs/data-checks.md` |
| Plain language | Short note under each field, tooltips, glossary calculators (DSCR, CapEx) | `docs/plain-language.md` |
| i18n | English/Telugu screens; exports stay English. `npm run audit:i18n` must pass | `client/src/i18n`, `lib/i18n/te`, `docs/bilingual.md` |
| Sessions | 6-min idle limit, silent refresh while active, idle prompt, sign-out to the login screen after 6 idle minutes, 8 h cap, draft backup on expiry | `docs/session.md` |
| RBAC | Entrepreneur, District Reviewer, Admin; district-scoped reviewers | `docs/rbac.md` |
| Audit trail | Append-only, hash-chained events (logins, admin edits, template changes) with IP and payload; verify and CSV export | `docs/audit-and-access.md` |
| Access control | Invite onboarding, deactivate/reactivate, sign out everywhere; deactivation ends access in ≤10 s | same |
| AI gateway | Only path to OpenAI; removes personal data, forces gpt-4o-mini, `store:false` | `docs/ai-gateway.md` |
| Security | Input sanitising, upload checks, encrypted KYC files, AES-256-GCM personal fields | `docs/security.md`, `docs/security-and-compliance.md` |
| Privacy (DPDP) | Notice, consent, nominee, export, erasure, complaints, retention job | `docs/dpdp.md` |
| Integrations | Read-first, rate-limited, cached AP MSME registry client | `docs/security-and-compliance.md` §1 |
| Support desk | Tickets with P1–P4 targets and L1→L3 auto-escalation (API only) | `docs/pilot-and-om.md` |
| Disclaimer footer | "AI-generated document…" on every page of preview, PDF and Word | `lib/aiDisclaimer.ts` (client and server) |

## 7. Configuration
All settings are environment variables; the full table is in *3-Production-Readiness.md* §3 and `server/.env.example`. Client needs none for local use (Vite proxy). Production client calls `/api` on the same host or the host set in the client API base.

## 8. Testing
| Command | Needs API running | Checks |
|---|---|---|
| `server: npm test` | no | security, finance parity, AI gateway, audit hash, encryption helpers, integrations, OpenAPI |
| `server: npm run test:admin / rbac / session / security / finance / support / encryption` | yes (restart API between runs to reset the rate limit) | live behaviour against a real database; each cleans up its test data |
| `server: npm run test:pdf` | no | PDF page size smoke test |
| `client: npm test` | no | 130 unit tests (finance, DPR fixes, wording) |
| `client: npm run audit:i18n` | no | every UI string has Telugu |
| `npx tsc --noEmit -p .` (both) | no | 0 type errors |

## 9. Conventions
- New text in the UI: wrap in `tf('English text')` and add Telugu in `client/src/lib/i18n/te/*Te.ts`; run `audit:i18n`.
- New route: add it to the route file, then `npm run docs:openapi` (a test fails otherwise).
- Audited change: wrap the route in `auditOnSuccess(...)`.
- Calls to OpenAI go through `lib/openaiClient.ts` only.
- Never write plain `fs` uploads without the upload guard (`lib/security/uploadGuard.ts`).

## 10. Known limits (be aware)
- Uploads are stored on the server's local disk, so run one API server or share the folder.
- 67 client files and most server files carry `// @ts-nocheck`; "0 type errors" covers checked files only.
- Landing page mobile Lighthouse score is 75–83 (desktop 96).
- Support desk has no screen yet (API only). Redis support is tested only against an in-memory stand-in.
- PostgreSQL, Next.js, NestJS and an object store are **not** used.
