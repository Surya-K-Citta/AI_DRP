# Production Readiness Guide

Version 1.0 · Audience: DevOps, release manager, security reviewer
Status key: **Ready** (built and tested) · **Setup** (needs a deployment step) · **Open** (not done, needs work or a decision)

## 1. Verdict
The application is ready for a **controlled pilot on a single API server**. It is **not** ready for open, multi-server production until the *Open* items in §9 are closed.

## 2. Target deployment
```
Users ─HTTPS/TLS 1.3─► Reverse proxy / CDN ─► Client (static files)
                                           └► API server (Node 20+, 2 vCPU, 4 GB RAM, Chrome for PDF)
                                                 ├► MongoDB (replica set, TLS, encrypted disk)
                                                 ├► Redis (optional, only with 2+ API servers)
                                                 ├► uploads/ volume (encrypted, backed up)
                                                 └► OpenAI API, AP MSME API (outbound only)
```
The client is static files (the repo has `vercel.json`: build `client`, serve `client/dist`, route all paths to `index.html`). The API is a long-running Node process (`npm run build && npm start`); it needs Chrome for PDF export (`PUPPETEER_EXECUTABLE_PATH`).
Sizing: PDF generation is the heaviest task (about 300–500 MB per concurrent export). Start with one server and watch memory.

## 3. Environment variables (server)
| Variable | Required | Purpose / rule |
|---|:--:|---|
| `NODE_ENV=production` | ✔ | Strict checks, secure cookies, HTTPS redirect; hides API docs and test users |
| `PORT` | | Default 5000 |
| `MONGODB_URI` | ✔ | Use `mongodb+srv://` or add `tls=true` |
| `JWT_SECRET` | ✔ | Long random value; the server will not start in production without it |
| `OPENAI_API_KEY` | ✔ | The server exits without it |
| `DATA_ENCRYPTION_KEY` | ✔ | 64 hex characters (`openssl rand -hex 32`). Encrypts phone, date of birth, nominee contacts. **Back it up: losing it makes that data unreadable** |
| `KYC_ENCRYPTION_KEY` | ✔ | Encrypts KYC files and cluster photos |
| `CORS_ORIGIN`, `CLIENT_URL` | ✔ | Exact client URL (CORS and invitation links) |
| `TRUST_PROXY=true` | ✔ behind a proxy | Correct client IPs in the audit trail and rate limits |
| `TLS_CERT_FILE`, `TLS_KEY_FILE` | | Only if the API terminates TLS itself (TLS 1.3 only) |
| `OPENAI_CHAT_MODEL`, `OPENAI_BASE_URL`, `OPENAI_ORG_ID`, `OPENAI_PROJECT_ID` | | Default model gpt-4o-mini; base URL must be https |
| `OPENAI_ZDR_CONFIRMED`, `OPENAI_ZDR_NOTE` | | Set `true` only after zero data retention is confirmed in the OpenAI contract |
| `AI_ALLOW_AUDIO` | | Voice transcription sends recordings as spoken; off by default |
| `REDIS_URL` | with 2+ servers | Shared rate limits and account cache |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS` | | Default 15 min / 100 per IP |
| `MONGODB_MAX_POOL_SIZE` (20), `MONGODB_MIN_POOL_SIZE` (2), `MONGODB_MAX_IDLE_MS`, `MONGODB_WAIT_QUEUE_MS` | | Connection pool per server |
| `ACCOUNT_STATUS_TTL_MS` | | Default 10 s, max 25 s: upper limit for a deactivation to take effect |
| `RETENTION_IDLE_DAYS` (365), `RETENTION_WARNING_DAYS` (15), `AUDIT_RETENTION_DAYS` (730) | | Retention job |
| `SESSION_MAX_HOURS` | | Absolute session cap, default 8 hours. Never set `SESSION_ACCESS_SECONDS` (tests only) |
| `AP_MSME_API_URL`, `AP_MSME_API_KEY`, `APMSME_RATE_PER_MINUTE`, `APMSME_CACHE_TTL_MS`, `APMSME_TIMEOUT_MS` | | Registry integration; without it, sample data is served |
| `CLOUDINARY_*`, `TWILIO_*` | | Optional image hosting / SMS retention warnings |
| `ENABLE_API_DOCS=true` | | Shows Swagger in production (off by default) |
| `SEED_TEST_USERS=true` | never in production | Creates test accounts with a published password |
| `ALLOW_INSECURE_HTTP=true` | never in production | Disables the HTTPS redirect |

## 4. Security configuration
| Control | State |
|---|---|
| HTTPS redirect, HSTS (2 years, preload), TLS 1.3 option | Ready; **Setup** certificate or proxy (TLS 1.3 only) |
| bcrypt passwords; 15-minute JWT; refresh cookie httpOnly, Secure, SameSite=None | Ready |
| Role checked on every request; privileged routes re-read the role from the database | Ready |
| Deactivation revokes sessions in ≤10 s (25 s worst case) | Ready |
| Input sanitising, upload type and size checks, locked-down PDF page | Ready |
| KYC files and photos, and personal fields, AES-256-GCM | Ready; **Setup** keys |
| Audit log append-only, hash-chained, verify endpoint | Ready; **Setup** database user without update/delete on `auditevents` |
| Database and disk encryption at rest | **Setup** (Atlas encryption or encrypted volume, including `uploads/`) |
| Rate limit 100 per 15 min per IP | Ready (per server; Redis to share) |
| AI: personal data removed, `store:false`, model locked | Ready; **zero retention must be confirmed in the contract** |
| Penetration test, ISO 27001 audit, GoAP cyber-cell approval | **Open** (third parties) |
| Row-level tenant isolation in the database | **Open** (application-level only; MongoDB has no RLS) |

## 5. Deployment steps
1. Provision MongoDB (replica set, TLS, encryption). Create an app user with read/write on the app database and **insert/find only** on `auditevents`.
2. Generate `JWT_SECRET`, `DATA_ENCRYPTION_KEY`, `KYC_ENCRYPTION_KEY`; keep them in a secret manager and keep a sealed backup.
3. Set the environment variables (§3). Never commit them.
4. Build and start the API: `cd server && npm ci && npm run build && npm start`. Read the start-up log for warnings (TLS, database TLS, ZDR not confirmed).
5. Build the client: `cd client && npm ci && npm run build`; publish `client/dist` with a catch-all rewrite to `index.html`.
6. Configure the proxy: TLS 1.3 only, HSTS, `X-Forwarded-Proto`, compression, long cache for `/assets/*`.
7. Existing data only: `cd server && npm run encrypt:existing` (safe to repeat).
8. Create the first admin: register a user and set `role: "admin"` in the database (or start once with `SEED_TEST_USERS=true`, sign in, then remove the flag and the test accounts).
9. Run the smoke test (§7), then invite District Reviewers from Admin → Users.

## 6. Operations
| Topic | Practice |
|---|---|
| Health | `GET /api/health` (public). Admin: `/api/admin/infra/status`, `/api/admin/integrations/status`, `/api/admin/ai/status` |
| Logs | stdout (access log and warnings). Ship to a central store; alert on 5xx rate, `[redis]`, `[disclaimer]`, `[retention] failed`, `MongoDB disconnected` |
| Backups | MongoDB daily snapshot (point-in-time if possible); `uploads/` daily; **test a restore every quarter**. Keep encryption keys backed up apart from the data |
| Background jobs | Run inside the API process: retention (every 6 h) and support escalation (every minute). With several servers, run them on one only |
| Capacity | Watch memory during PDF export; scale the API vertically first |
| Key rotation | Set the new `DATA_ENCRYPTION_KEY`, move the old one to `DATA_ENCRYPTION_KEY_PREVIOUS`, run `npm run encrypt:existing`, remove the old key later |
| Audit | Weekly: Admin → Audit → Verify integrity. Monthly: CSV export to cold storage before the retention purge (default 730 days) |
| Support | P1 < 4 h, P2 < 8 h first response; escalation L1 → L3 is automatic; name owners and an on-call roster (the clock counts calendar time) |

## 7. Release checklist (every release)
- [ ] `tsc --noEmit` in client and server: 0 errors
- [ ] `server: npm test` and the live suites (admin, rbac, session, security, finance, support, encryption) pass on a staging copy
- [ ] `client: npm test`, `npm run audit:i18n`, `npm run build` pass
- [ ] `npm run docs:openapi` run if routes changed (a test enforces it)
- [ ] Staging smoke: register, sign in, create a DPR, generate, download PDF (footer on every page), submit, review as a reviewer, deactivate a test user and confirm sign-out within 30 s
- [ ] Database backup taken; previous build kept for rollback

**Rollback**: redeploy the previous API and client builds. Schema changes are additive (no destructive migrations). Encrypted fields stay readable by the previous build only if the same key is set.

## 8. Go-live checklist
- [ ] All required variables set; `NODE_ENV=production`; no test users; `SEED_TEST_USERS` unset
- [ ] TLS 1.3 verified and graded on the live address (SSL Labs); HSTS present
- [ ] Database TLS and disk encryption confirmed; `uploads/` volume encrypted and backed up
- [ ] Keys backed up in two places; restore tested
- [ ] OpenAI zero data retention confirmed in writing, then `OPENAI_ZDR_CONFIRMED=true`
- [ ] Audit database user cannot update or delete
- [ ] Privacy notice text approved; grievance contact published
- [ ] Penetration test done and findings closed; cyber-cell review recorded
- [ ] Monitoring and alerts live; on-call named; support process agreed
- [ ] Pilot plan, training and UAT sign-off agreed (`docs/pilot-and-om.md`)

## 9. Open items before wider production
| # | Item | Impact | Suggested action |
|---|---|---|---|
| 1 | Uploads on local disk | Cannot run 2+ API servers safely | Move to an S3-compatible object store; lifecycle rules ready in `docs/ops/s3-lifecycle.json` |
| 2 | No database-enforced tenant isolation | A controller bug could expose data | Independent penetration test; decide on a MongoDB filter layer or PostgreSQL RLS |
| 3 | OpenAI zero retention unverified | DPDP and contract risk | Confirm in enterprise terms; consider an in-country model endpoint |
| 4 | `@ts-nocheck` on most files | Type safety only partly enforced | Remove file by file |
| 5 | Landing page mobile Lighthouse 75–83 | Misses the ">90" target | Pre-render the landing page HTML |
| 6 | Support desk has no screen or alert emails | Staff must use the API | Build the screen and notifications |
| 7 | Redis path tested only with a stand-in | Unknown behaviour on a real Redis | Test on a staging Redis before multi-server use |
| 8 | Name, email and DPR content not field-encrypted | Gap against "all personal data encrypted" | Decide scope with the cyber cell; add a blind index if needed |
| 9 | India data residency of AI calls | Compliance | Confirm, or switch the endpoint |
| 10 | Telugu-to-PDF conversion route unused | None today | Remove it, or retest before enabling |
