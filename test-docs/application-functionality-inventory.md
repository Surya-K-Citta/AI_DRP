# Application functionality inventory — MSME DPR

Built from the code (`client/src/App.tsx`, `server/src/routes/*.ts`, `server/src/models`, the e2e/server test suites). "Covered" says whether an automated test in this repository exercises it; where it does not, the gap is stated plainly. Nothing here is claimed as 100 % covered.

Roles: **Entrepreneur** (`consultant`) · **Admin** (`super_admin`) · **District reviewer / officer** (`govt_official`) · **Signed out**.

## 1. Screens (client routes)

| Route | Who | What it does | Covered by (browser tests run on Chromium + WebKit at 4 screen sizes) |
|---|---|---|---|
| `/` | all | Landing page, language switch, sign-in/register links | SMOKE-001, LANG-001 |
| `/login` | signed out | Sign in (demo credentials shown), keyboard-only use | AUTH-001..004, KEY-002, SMOKE-002 |
| `/register` | signed out | Create account with privacy consent (must scroll notice) | AUTH-010..014, SMOKE-003 |
| `/accept-invite` | invited user | Set a password from an emailed invitation | server `admin.live` (onboarding); no browser test |
| `/privacy`, `/accessibility` | all | Notices | SMOKE-004, a11y scan |
| `/dashboard` | entrepreneur (also others) | Journey panel, five summary cards (open the filtered list), recent reports, Scheme Finder card, quick actions, **guided tour** (arrow points at the real buttons across the dashboard, scheme choice and form; fills sample answers; Exit tour any time) | SMOKE-005, INT-001..004, DASH-001..021, TOUR-001..006 |
| `/projects`, `/projects/create`, `/projects/:id` | entrepreneur | List, create, view, delete projects | PROJ-001..020, SMOKE-006/007 |
| `/dprs` | entrepreneur | All reports: filters, open, delete, PDF | SMOKE-008, INT; filters/pagination **not** tested |
| `/individual-dpr/guide` | entrepreneur | Choose Basic/Advanced mode and set up the report | SMOKE-010, IDPR-001..044 |
| `/individual-dpr/create` | entrepreneur | Individual (single-unit) DPR editor: steps, drafts, save, scheme-aware | IDPR-001..044 |
| `/cluster-dpr/create` | entrepreneur | Cluster DPR (18 steps), Form/Split/Preview, drafts | CLUS-001..003 |
| `/dpr/builder`, `/dpr/builder/:projectId` | entrepreneur | AI guided builder | SMOKE only (opens); **conversation not tested** |
| `/dpr/:projectId`, `/dpr/view/:dprId` | entrepreneur | View/preview a report | opened via INT; download paths partly |
| `/venture-match` | entrepreneur | Scheme finder questionnaire and results: a Compare button on every scheme card opens a large comparison (this scheme plus up to three chosen from drop-downs); a Suggested plan button opens the plan as a large window | VM-001..022 |
| `/chat` | entrepreneur | AI assistant (AI stubbed in tests) | CHAT-001..004 |
| `/profile`, `/account/privacy` | signed in | Profile, consent, export, nominee, complaint, delete account | PROF-001/002, PRIV-001..006 |
| `/admin` | admin | Analytics, users, invitations, policies, audit, status | ADM-001..004, SMOKE-016 |
| `/admin/documents` | admin | Knowledge documents, vector stores | SMOKE-017 (opens + a11y); upload not tested |
| `/reviewer` | officer | District queue, review a DPR (approve/reject) | REV-001..003, SMOKE-018 |
| `*` | all | Not-found page | SMOKE (unknown route) |

Cross-cutting UI: session manager (idle warning, expiry redirect), skip link / keyboard use, language (English ↔ Telugu), responsive layout (360/768/1280), accessibility (axe on each route).

## 2. API (server routes under `/api`)

| Group | Endpoints (method path) | Covered by |
|---|---|---|
| auth | login, register, `POST /refresh`, `POST /logout`, `GET/PUT /profile`, `POST /consent`, `GET /invite/:token`, `POST /accept-invite` | AUTH, SESS, server `session.live`, `rbac.live`, `api.live` |
| projects | `GET /`, `GET/PUT/DELETE /:id`, create | PROJ, INT, `api.live` |
| dpr | sessions (start/step/responses), templates, generate (`/generate/:projectId`, `/cluster/generate`), `POST /cluster/draft/save`, cluster sections/enhance/AI helpers, images, documents, annexures, `GET/DELETE /:dprId`, downloads (pdf/docx/xls), `quality`, `content`, `submit`, `translate/telugu`, scheme-style | DPR-001..011 cover draft save, validation, security, boundaries, ownership; PDF smoke; **AI helpers, docx/xls, images, annexures, translate not tested** |
| schemes | `GET /`, `GET /:code`, `recommend`, `select` | VM (UI), INT; direct API partly |
| feedback | `GET /:projectId` | none (read-only; low risk) |
| admin | analytics, users (list/edit/delete/invite/deactivate/reactivate/revoke), projects, feedback, dprs approve/reject, policies, audit (+csv, verify), ai/infra/integrations status, retention run | ADM, server `admin.live`, `rbac.live` |
| reviewer | summary, dprs, dpr detail, review | REV, INT |
| privacy | export, consent, nominee, delete account, complaint, activity, notifications (+read) | PRIV, PROF |
| support | info, tickets (mine/create/reply), queue, patch, report, escalate | server `support.live` (4 tests); no UI test |
| apmsme | schemes, guidelines, FIs, submit, status, entrepreneur | none (external-style integration) |
| documents | list/search/rag/upload/delete, vector stores | none beyond route opens |
| ai | (mounted; gateway) | server `aiGateway.test` (mock gateway), chat UI with stubbed `/ai/chat` |

## 3. Business rules found (and tested)
- Access-token lifetime ≈ 390 s, idle limit 6 min, refresh needs the `dpr_refresh` cookie; logout revokes the session; expired token → `401 TOKEN_EXPIRED`.
- Role gating: entrepreneur cannot open admin/reviewer pages or APIs; reviewer sees only their district.
- Under-18 applicants are refused (403) and nothing is stored (checks scheme extras, step1, age field).
- Owner-category pick-one groups in the scheme finder (woman/transgender, SC/ST, "not decided"/"not sure" stand alone).
- Reviewer decision: `approve|reject` with remarks; shows in admin analytics (`data.summary`).
- Privacy rights: export, consent withdrawal, nominee, complaint (201), account deletion.
- Audit trail is hash-chained and verifiable; CSV export is safe for spreadsheets.
- Deactivation stops access within seconds; DB-level switch-off enforced within 30 s.

## 3b. Where the tests are
Two suites: the `node:test` suite in `e2e/tests/` and the Playwright Test suite in `client/e2e/` (run `npx playwright test --ui` from `client/`). The IDs quoted in the tables above (DASH-, TOUR-, ADMA-, VM-021/022 and the older ones) come from the first; the second names its tests in plain words, listed per file at the end of `test-cases.md`.

## 4. Not covered / limits (honest list)
- AI answers are **stubbed** (`/ai/chat`) in browser tests; real AI quality and cost are not tested. Server `aiGateway.test` uses a mock gateway.
- No test for: AI-guided builder conversation, DPR view/download of DOCX/XLS, image generation/upload, annexure upload, document (RAG) upload/search, APMSME submit/status, support-desk UI, accept-invite UI, All-DPRs filters/pagination, voice input, Telugu translation of a whole DPR.
- No load/performance, Firefox (it would not launch on this Mac; Chromium and WebKit were run), real-device, or screen-reader (manual) testing.
- Email delivery of invitations is not exercised (token path only).
