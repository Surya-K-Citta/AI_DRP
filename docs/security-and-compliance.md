# Encryption, tenant isolation and compliance mapping

Status key: **Built** = in the code and tested. **Setup** = needs a deployment step by the hosting team. **Open** = not done, needs a decision or a third party.

## 1. External integrations (read-first)
**Built.** `server/src/lib/integrations/readThrough.ts`. Used by the AP MSME scheme directory, sector guidelines and financial institutions.
- Only GET requests use it. Submitting a DPR to the portal stays a separate, explicit call.
- A fresh cached answer is used before the registry is contacted. Each registry has its own rate limit (`APMSME_RATE_PER_MINUTE`, default 30), timeout (`APMSME_TIMEOUT_MS`), circuit breaker (opens after 3 failures for 60 s) and cache life (`APMSME_CACHE_TTL_MS`, default 6 h).
- If the registry is down, slow or over its limit, the last good answer is returned and marked `stale`. If nothing was ever cached, built-in sample data is returned (`source: "fallback"`). The scheme list response carries `source`, `stale`, `fetchedAt`.
- Admin: `GET /api/admin/integrations/status` shows breaker state, last success, last error and call counts.
- Open: the real registry address and API key (`AP_MSME_API_URL`, `AP_MSME_API_KEY`) must be supplied by APMSMEDC. Until then every call is served from sample data.

## 2. Data encryption
| Layer | Status | How |
|---|---|---|
| Personal data in the database | **Built** | AES-256-GCM per field (`lib/fieldCrypto.ts`): phone number, date of birth, nominee phone and email. Needs `DATA_ENCRYPTION_KEY` (required in production; the server will not start without it). Existing accounts: run `npm run encrypt:existing` once. Key rotation: set the new key, list the old one in `DATA_ENCRYPTION_KEY_PREVIOUS`, run `npm run encrypt:existing` again. |
| Identity files (KYC) and cluster photos | **Built** | AES-256-GCM (`KYC_ENCRYPTION_KEY`, required in production). |
| Disk / database storage | **Setup** | Turn on encryption at rest where the data lives: MongoDB Atlas (encryption at rest with your own KMS key) or an encrypted volume (LUKS/EBS/Azure Disk) for a self-hosted database and for the `uploads/` folder. This cannot be done from the application. |
| In transit | **Built + Setup** | In production the server redirects HTTP to HTTPS (GET/HEAD) and refuses other methods over HTTP, and sends HSTS (2 years, preload). TLS 1.3 only: set `TLS_CERT_FILE` and `TLS_KEY_FILE` and the server listens with `minVersion/maxVersion TLSv1.3`; or terminate TLS at a proxy using the settings below. Database traffic: use `mongodb+srv://` or `tls=true` (the server warns if not). |

Not encrypted at field level, on purpose: **email** (the sign-in lookup key) and **name** (shown in lists and audit entries). Encrypting them would need a separate search index (a "blind index"); that is possible but is a further change. DPR content (business plans, finance) is also stored as readable fields; if "every column with personal data" must include DPR content, that needs a separate decision. Promoter details inside a DPR are personal data, so this should be settled with the cyber-security cell.

Proxy settings for TLS 1.3 only (nginx):
```
ssl_protocols TLSv1.3;
ssl_prefer_server_ciphers off;
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
```
Set `TRUST_PROXY=true` when behind one proxy so client IPs in the audit trail are right.

**SSL Labs A+ is not something the code can promise.** The rating depends on the certificate, the proxy and the DNS records; TLS 1.3 only plus HSTS preload is what A+ normally needs, but the grade has to be run against the live address. TLS 1.3 only will exclude very old browsers (for example old Android 4.x).

## 3. Tenant isolation (RLS)
**Open — decision needed.** The platform runs on MongoDB. PostgreSQL Row-Level Security does not exist there, and moving the database would be a project of its own. What exists today:
- Every record read is scoped in application code: an entrepreneur reaches only their own records; a District Reviewer only DPRs from their assigned district (`lib/staffScope.ts`); admin routes are role-checked on every request with a fresh role lookup.
- Tests (`npm run test:rbac`, `test:security`) check cross-user access and NoSQL-operator injection.

What is **not** true: there is no database-enforced isolation, and no multi-tenant penetration test has been done. A bug in one controller could expose another user's data, which RLS would prevent. Options: (a) keep MongoDB and add a mandatory owner filter at the model layer plus an independent penetration test; (b) migrate to PostgreSQL with RLS policies. The people who sign off should choose; (b) is the one that matches the stated requirement.

## 4. Compliance mapping (working draft)
This is an engineering draft for the cyber-security cell to review. It is **not** a certification and nothing here has been approved. ISO 27001 certification is an audit of the organisation's whole management system, not of an application.

| Requirement | What the application does | Gap / needed from the organisation |
|---|---|---|
| DPDP 2023 – notice and consent | Privacy notice with version, consent captured at sign-up with time, separate AI-assist and analytics consents | Notice text approved by legal; consent for under-18s is blocked (age ≥ 18 required) |
| DPDP – purpose limitation, minimisation | Only listed fields collected; AI gateway removes personal data before any LLM call | Written data inventory |
| DPDP – data principal rights | Access/export, correction, nominee, erasure (`accountErase`), complaints (`PrivacyComplaint`) | Named grievance officer and response process |
| DPDP – retention | Retention job warns then purges idle accounts; audit retention separate | Retention periods agreed in writing |
| DPDP – security safeguards | AES-256-GCM fields and files, TLS, hashed passwords (bcrypt), hash-chained audit trail, RBAC, 15-min tokens, instant revocation | Disk encryption, key custody, pen test |
| DPDP – breach notification | Audit trail and `support_ticket` P1 path exist | Incident response runbook and Data Protection Board reporting process |
| ISO 27001 A.5/A.8 access control | Three roles, least privilege, invite-only staff, deactivation, session control | Access review procedure |
| ISO 27001 A.8.15 logging | Append-only hash-chained audit log with IP and payload, verification endpoint | Database user without delete rights; log shipping to a SIEM |
| ISO 27001 A.8.24 cryptography | AES-256-GCM, TLS 1.3, key rotation procedure | Key management policy, KMS/HSM |
| ISO 27001 A.8.28 secure coding | Input sanitisation, upload checks, tests | Independent code review / SAST in CI |
| MeitY cloud norms | Nothing in the code forbids it | Hosting must be a MeitY-empanelled cloud with data in India. The AI features send (scrubbed) text to OpenAI outside India; confirm this is acceptable, or use an in-country model endpoint through `OPENAI_BASE_URL` |
| APCSOC | Audit export (`/admin/audit/csv`) can feed a SOC | Agree log format, onboarding and alert contacts with APCSOC |

Approval by the GoAP cyber security cell can only be obtained from them.
