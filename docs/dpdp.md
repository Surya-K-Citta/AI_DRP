# DPDP — implemented product logic

> Living source of truth for **DPDP-related code** in this repo.  
> Plan / PDF (stages, legal caveats): [dpdp-implementation-plan.html](./dpdp-implementation-plan.html) · [dpdp-implementation-plan.pdf](./dpdp-implementation-plan.pdf)  
> Printable requirements checklist: [dpdp-requirements-checklist.html](./dpdp-requirements-checklist.html) (File → Print → Save as PDF)

**Maintenance:** Any change to DPDP behaviour (notice, consent, age 18, AI strip, audit, retention, grievance, under-18 copy) **must** update this file. Cursor rule: `.cursor/rules/dpdp-docs.mdc`.

This is **not** a legal opinion and **not** a DPDP compliance certificate. After Stages 1–3 the *code* can be as aligned as this product can get. Do not say “we comply with DPDP” until Stage 4 (contracts, named officer, real inbox, breach process).

---

## 1. Status

| Stage | What it is | Status |
|-------|------------|--------|
| 0 | Four locked notice lines | Locked (Sep 2026) |
| 1 | Notice, consent, age 18, safer AI, first audit | **In code** |
| 2 | Export, delete, nominee, complaint form, full audit UI | **In code** |
| 3 | Private KYC storage, 12-month draft purge job | **In code** |
| 4 | Legal name on paper, real grievance inbox, vendor contracts, breach playbook | Org work |

---

## 2. Locked Stage 0 (notice text)

Keep `PRIVACY_NOTICE_VERSION` in sync on **both** sides when the notice text changes.

| Decision | Value |
|----------|--------|
| Data Fiduciary (product name) | MSME One Department |
| Grievance email | `privacy.grievance@msmeone.gov.in` (**mock** until Stage 4) |
| Unused draft life | **12 months after last edit of that DPR** (draft or submitted). Not first save, not last login. **15 days before delete**: in-app + mock SMS. Account stays. **Audit rows: 24 months from that event**, then erased. |
| AI | Optional. KYC never in the model. If AI is off, say so: Fill with AI, model quality score, chat help will not run; type / save / download still work. |

Constants:

- Server: `server/src/lib/privacyNotice.ts`
- Client: `client/src/lib/privacy/constants.ts`

Current notice version: **`2026-09-4`**. Bump this string when the privacy page content changes so old users re-consent.

---

## 3. Stage 1 — what the code does

### 3.1 Notice page

- Public route: `/privacy`
- English / Telugu (follows UI language toggle)
- Linked from Register, Login, Layout footer, Landing footer
- **On Register and the re-consent popup the full notice is inside a scroll box.** The account-consent tick stays **disabled** until the user scrolls to the last line. Switching language resets the scroll and unchecks the box. Opening `/privacy` in a new tab does not skip this.

### 3.2 Consent on the user

Stored on `User.privacy`:

| Field | Meaning |
|-------|---------|
| `accountConsent` | Required to register / to pass the re-consent popup. **Cannot be ticked until the notice is scrolled to the end** (client). Server still requires `true`. |
| `aiAssist` | Optional. Server refuses AI routes if false |
| `analytics` | Optional; stored only |
| `noticeVersion` / `noticeAcceptedAt` | Which notice they agreed to |
| `dateOfBirth` | Register only; used to block under 18 |

JWT / profile payload includes `privacy.needsNoticeAcceptance` when `noticeVersion !== 2026-09-4`.

**APIs**

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/auth/register` | Requires `dateOfBirth`, `accountConsent: true`, optional `aiAssist` / `analytics` / `noticeVersion` |
| POST | `/api/auth/login` | Returns privacy flags |
| POST | `/api/auth/consent` | Auth required. Re-consent / change AI flag |
| POST | `/api/auth/logout` | Auth required. Audit only |
| GET | `/api/auth/profile` | Public user + privacy (no password) |

Old users: blocking modal (`ConsentGate` on every `ProtectedRoute`) until they accept. Logout is the only way out without accepting. The gate loads profile with a **live** API call (not mock fallback) so offline mock users cannot reopen the modal or overwrite the logged-in account.

### 3.3 Under 18

DPDP: under 18 cannot give adult consent. Product rule: the **named entrepreneur / applicant** must be 18+. No child-as-borrower DPR.

| Surface | Behaviour |
|---------|-----------|
| Register | DOB → age &lt; 18 → **no account**. Guardian banner under DOB. Clicking Register **scrolls to that banner**. Code `UNDER_18`. |
| Latest DPR extras | `entrepreneurAge` / `promoterAge` / `applicantAge` / `age` &lt; 18 → no save, no generate, no Fill-all-AI. Banner. |
| Server draft / generate | Same payload check on `/api/dpr/cluster/draft/save` and `/api/dpr/cluster/generate` |
| Scheme Finder | Age question and results show guardian copy. Create-DPR buttons hidden if `age === under18`. Loan schemes already fail the 18+ test. |

Copy lives in i18n `privacy.guardianMessage` (EN/TE) and server `GUARDIAN_MESSAGE`.

### 3.4 Safer AI

1. **Consent gate:** `requireAiConsent` on all `/api/ai/*` and AI DPR routes (suggestions, fill, generate, quality, translate, chat, RAG search, image gen, etc.). Draft save and PDF/DOCX download stay ungated.
2. **Strip KYC:** every `openai.chat.completions.create` goes through `server/src/lib/openaiClient.ts` → `sanitizeForAi` (drops Aadhaar/PAN/passbook/UPI/file URL keys; redacts Aadhaar/PAN patterns and Cloudinary/upload URLs in strings).
3. **UI:** Fill-all and per-step AI suggestions disabled + warning when `aiAssist` is false. 403 body uses `AI_CONSENT_REQUIRED`.

Generate that still calls OpenAI (including Latest DPR `generateClusterDPR`) **requires AI consent**. Preview of the live form does not.

### 3.5 First audit (append-only)

Collection: `auditevents` (`AuditEvent` model). Nobody updates old rows.

Stage 1 actions: `register`, `login_success`, `login_failed`, `logout`, `consent_given`, `consent_withdrawn`, `notice_accepted`, `ai_call`.

Each row: time, userId (if known), role, action, optional targetType/targetId, IP. **Not** Aadhaar, **not** DPR text.

Stage 2 adds DPR/KYC/export/delete/admin screens (see §4.6).

### 3.6 JWT

`getJwtSecret()` (`server/src/lib/jwtSecret.ts`). Production (`NODE_ENV=production`) **exits** if `JWT_SECRET` is missing or is a known dummy (`your-secret-key`, etc.). Dev may warn and use a local dummy.

---

## 4. Stage 2 — what the code does

Page: **`/account/privacy`** (navbar Privacy, Profile → Open privacy settings). Admin audit: **Admin → Audit log**.

### 4.1 Export (access)

`GET /api/privacy/export` (auth). JSON download: profile (no password), projects, DPR versions, sessions, own documents metadata, own complaints. Logs `data_export`.

### 4.2 Turn AI off / correction

`PATCH /api/privacy/consent` `{ aiAssist, analytics }`. Account consent stays required. AI off logs `consent_withdrawn`; AI on logs `consent_given`. Existing `POST /api/auth/consent` still used by the re-consent popup.

Profile edits (`PUT /api/auth/profile`) log `profile_change`.

### 4.3 Nominee

Stored on `User.privacy.nominee` `{ name, phone, email }`. Name plus at least phone or email. `PUT /api/privacy/nominee`. Logs `nominee_change`.

### 4.4 Erasure (complete delete)

`DELETE /api/privacy/account` body `{ confirm: "DELETE" }`. Admin `DELETE /api/admin/users/:id` uses the **same** `eraseAccount()` (`server/src/services/accountErase.service.ts`).

Cascade: Cloudinary public ids / upload URLs in projects and DPRs, local `/uploads/` files, OpenAI `file-*` ids, cluster sections, feedback, scheme matches, analytics, sessions, non-template documents, DPR versions, projects, then the user row.

**Audit rows stay.** Processor delete failures are warnings; Mongo data is still removed.

### 4.5 Grievance

`POST /api/privacy/complaint` `{ subject, message }`. Saves `PrivacyComplaint` (inbox `privacy.grievance@msmeone.gov.in`). No SMTP yet — server log line only. Logs `complaint_submitted`. A human must still reply (~90 days for rights requests).

### 4.6 Full audit

Append-only `auditevents`. Stage 2 actions (in addition to Stage 1): `dpr_create`, `dpr_change`, `dpr_download`, `dpr_delete`, `kyc_upload`, `kyc_delete`, `data_export`, `account_delete`, `admin_view`, `profile_change`, `nominee_change`, `complaint_submitted`.

- **User:** `GET /api/privacy/activity` — own logins, downloads, exports, consent, etc. No other people’s rows.
- **User inbox:** `GET /api/privacy/notifications`, `POST /api/privacy/notifications/:id/read` (`id` can be `all`).
- **Admin:** `GET /api/admin/audit?userId=&action=&from=&to=` and `GET /api/admin/audit/csv`.
- Staff (`admin` / `officer`) opening another user’s DPR logs `admin_view`.

Rows still store time, userId, role, action, optional targetType/targetId, IP. **Not** Aadhaar, **not** DPR text.

---

## 4.7 Stage 3 — private KYC and 12-month purge

### Files

- Step 18 / identity uploads go to `uploads/kyc/` as `KycFile` rows. Cluster unit photos go to `uploads/cluster/` the same way. **Neither** is sent to Cloudinary. **`/uploads` is 404** — files are only read via `GET /api/dpr/cluster/files/:fileId` (owner or admin/officer).
- Mongo stores `{ status: "uploaded", fileId, originalName }` for identity, and `file:<id>` for unit photos on `project.images`. Aadhaar/PAN **numbers** typed into those keys are dropped on save.
- The DPR preview/PDF shows **Uploaded** or **Pending** for identity. Unit photos can appear (fetched with the login token). Banks/DIC still need the original identity attachment from the applicant.
- **Production** requires `KYC_ENCRYPTION_KEY` (server secret, not per user; hashed to AES-256-GCM). Local/dev may omit it; files stay private but plaintext on disk.

### Retention job

`runRetentionJob()` (`server/src/services/retention.service.ts`). Starts ~20s after boot, then every 6 hours. Admin: **Audit log → Run retention** or `POST /api/admin/retention/run`.

| Env | Default | Meaning |
|-----|---------|---------|
> A blank value (for example `RETENTION_IDLE_DAYS=` in `.env`) counts as not set and uses the default. Only an explicit `0` means “right now”; never leave these keys blank-but-present expecting a default on older builds, where a blank read as 0.

| `RETENTION_IDLE_DAYS` | 365 (12 months) | Delete after last **edit** of that DPR (`updatedAt`). Draft **and** submitted. |
| `RETENTION_WARNING_DAYS` | **15** | Warn this many days **before** that delete |
| `AUDIT_RETENTION_DAYS` | **730** (24 months) | Delete **that** audit row 24 months after it was written |
| `KYC_ENCRYPTION_KEY` | **required in production** | Encrypt KYC and cluster photos at rest |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM` | unset | Real SMS. If any is missing, SMS is **mocked** |

1. Idle DPR (any status) → 15-day warning (in-app + mock SMS/email). Does **not** bump `updatedAt`.
2. After warning **and** 12 months since last edit → delete that DPR, cluster photos, KYC, project if empty. **Never the user account.**
3. Audit rows with `at` older than 24 months are erased. Account erase does **not** wipe audit; this clock does.

`NotifyService` is the Twilio plug. Do not add the Twilio SDK until those keys exist.

---

### Sign-out clears the session

`logout` in `authStore` calls `clearUserSession()` (`client/src/lib/sessionReset.ts`): the draft on screen, cached DPR / project lists, the chat and cached API answers are dropped, so nothing from one person’s session shows for the next on the same browser. Automatic draft saves count as edits for the 12-month retention clock (a save updates the DPR’s last-edit time).

## 5. Key files

| Area | Path |
|------|------|
| Notice constants | `server/src/lib/privacyNotice.ts`, `client/src/lib/privacy/constants.ts` |
| Age helpers | `server/src/lib/under18.ts`, `client/src/lib/privacy/under18.ts` |
| Sanitize + OpenAI wrap | `server/src/lib/sanitizeForAi.ts`, `server/src/lib/openaiClient.ts` |
| Audit | `server/src/models/AuditEvent.model.ts`, `server/src/services/audit.service.ts` |
| Erase | `server/src/services/accountErase.service.ts` |
| KYC + retention | `server/src/lib/kycStorage.ts`, `server/src/models/KycFile.model.ts`, `server/src/services/retention.service.ts` |
| Notify (in-app + mock SMS) | `server/src/services/notify.service.ts`, `server/src/models/UserNotification.model.ts` |
| Privacy APIs | `server/src/controllers/privacy.controller.ts`, `server/src/routes/privacy.routes.ts`, `server/src/models/PrivacyComplaint.model.ts` |
| Auth | `server/src/controllers/auth.controller.ts`, `server/src/routes/auth.routes.ts`, `server/src/models/User.model.ts` |
| AI gate | `server/src/middleware/aiConsent.middleware.ts`, `server/src/routes/ai.routes.ts`, `server/src/routes/dpr.routes.ts` |
| UI | `client/src/pages/Privacy.tsx`, `AccountPrivacy.tsx`, `Register.tsx`, `ConsentGate.tsx`, `ConsentFields.tsx`, `PrivacyNoticeScroll.tsx`, `GuardianNotice.tsx`, `NotificationBell.tsx`, `PrivateImg.tsx` |
| Admin audit | `client/src/pages/AdminDashboard.tsx` (Audit log tab) |
| i18n | `client/src/i18n/locales/en.json` / `te.json` → `privacy.*` |

---

## 6. How to test Stage 1

Run **client** (`npm run dev` in `client`, usually http://localhost:5173) and **server** (`npm run dev` in `server`, usually http://localhost:5000) with MongoDB and `OPENAI_API_KEY` as you already do.

Use a **new email** for each register test so you do not fight old users.

### A. Privacy page

1. Open http://localhost:5173/privacy (logged out).
2. Toggle English / Telugu — body language should change.
3. Confirm it names **MSME One Department**, mock mail `privacy.grievance@msmeone.gov.in`, 12-month drafts, optional AI, under-18 guardian line.

### B. Register — adult, AI off

1. `/register`. Fill name, email, password, **date of birth 18+**.
2. The account tick is greyed until you **scroll the notice box to the bottom**. Then tick account consent. Leave **AI** unticked.
3. Register stays clickable. If the notice is not scrolled/ticked, you get a toast and stay on the form. After notice + tick, submit → land on dashboard. No extra privacy popup (notice already accepted).
4. Open **Create New Latest DPR**, pick a scheme, fill unit name. **Generate all steps with AI** and **Get AI Suggestions** should be disabled / show the “AI will not work” warning.
5. Open **AI Assistant** (`/chat`), send a message → should fail with the AI-off message (toast).
6. You should still type fields, **Save draft**, and use the live preview.

### C. Register — adult, AI on

1. New email, DOB 18+, tick account **and** AI.
2. Latest DPR → Fill with AI / suggestions should run (needs a valid OpenAI key).
3. Chat should answer.

### D. Register — under 18

1. DOB that makes the person 16 (or any date &lt; 18 years ago). The yellow guardian box appears under date of birth.
2. Click **Register** (even if you are at the bottom of the form). The page **scrolls to the yellow warning**. No account is created.
3. Login with that email must fail (user was not created).

### E. Old user (re-consent)

1. Log in as an account created **before** Stage 1 (no `privacy.noticeVersion` in Mongo), **or** in Mongo set `privacy.noticeVersion` to `"old"`.
2. Dashboard should be blocked by **“Please review how we use your data”**.
3. You cannot tick agree until you **scroll the notice to the bottom**. Then tick account consent and **Agree and continue**.
4. Logout from the modal works without accepting.

Demo **Quick Test Login** (`jaa@gmail.com`) will hit this popup until that user accepts once.

### F. Latest DPR — promoter age under 18

1. Logged in as 18+ with any AI setting.
2. Open a scheme pack that has **Entrepreneur age**. Type `16`.
3. Guardian banner. **Save draft** and generate / fill-all should refuse.
4. Change age to `32` → save should work.

### G. Scheme Finder

1. `/venture-match`. On the **age** question, guardian box is visible.
2. Choose **Below 18 years**, finish the quiz.
3. Matches may be empty / loan schemes failed. **Create DPR** / **Generate DPR for this Match** must **not** appear.
4. Start again, choose 21–50, those buttons return.

### H. Audit (Mongo)

In the same DB the API uses:

```js
db.auditevents.find().sort({ at: -1 }).limit(20)
```

Expect `register`, `notice_accepted`, `consent_given` after a new signup; `login_success` / `login_failed`; `logout`; `ai_call` after a successful AI request (not when AI is refused). Rows must not contain Aadhaar numbers or DPR body text.

### I. JWT (production guard)

Do **not** point a production deploy at this app without `JWT_SECRET` set to a long random value. With `NODE_ENV=production` and no/weak secret, the server process should exit at startup.

---

## 7. How to test Stage 2

Use an **adult** account that already passed Stage 1 consent. Keep a **second** dummy account if you want to test admin delete.

### A. Privacy settings

1. Log in. Click **Privacy** in the header, or Profile → **Open privacy settings**. URL: `/account/privacy`.
2. **Download my data** — a JSON file should download. Open it: name/email/projects/DPRs present, **no** `passwordHash`.
3. Untick **Allow AI help** and wait for the saved toast. Open Latest DPR: Fill with AI should be off. Tick it again to restore.
4. Fill **Nominee** name + phone or email → Save. Reload the page; nominee is still there.
5. **Recent activity** should list login, export, consent change, nominee.

### B. Complaint

1. On the same page, send a short subject and message.
2. Toast says it was saved. In Mongo: `db.privacycomplaints.find().sort({ createdAt: -1 }).limit(5)` — inbox is the mock mail.
3. Activity shows `complaint_submitted` (or “Privacy request sent”).

### C. Delete my account

1. Use a **throwaway** account with at least one saved draft (and an upload if you can).
2. Type `DELETE` (all caps) and click **Delete my account**. You should land on the public home page and cannot log in with that email.
3. Mongo: user / projects / dprversions for that id gone. `db.auditevents.find({ action: 'account_delete' })` still has a row. Cloudinary/local files for that draft should be gone if they existed.

### D. Admin audit

1. Log in as **admin** (`authorize('admin')` on the API; UI tab is Super Admin).
2. Admin Dashboard → **Audit log**. Filter by action `login_success` or the throwaway user’s id.
3. **CSV** downloads `audit-log.csv` with at, userId, role, action, target, IP.
4. Admin **delete user** on another dummy should cascade like C (not only the user row).

### E. Officer view

If an admin/officer opens another user’s DPR by id, expect `admin_view` in the audit list. Own DPR views are not logged as admin_view.

---

## 8. How to test Stage 3

Old users will see the re-consent popup because the notice is now **`2026-09-4`**. Accept it, then:

### A. Private upload

1. Latest DPR → uploads step. Upload a dummy PDF as Aadhaar/PAN.
2. Form shows **Uploaded** and the original filename, not a `https://res.cloudinary.com/…` link.
3. Save draft. In Mongo the field should look like `{ status: "uploaded", fileId, originalName }` — no public URL.
4. Open `http://localhost:5000/uploads/kyc/<filename>` in a logged-out browser — **404**.
5. Preview/download the DPR: identity section is Uploaded / Pending, scan is not in the PDF.

### B. No Aadhaar number field

If a payload still sends `aadhaar: "1234 5678 9012"`, after save that value should be empty. The file status can remain.

### C. Retention (short clock)

1. Put a **phone number** on Profile (so SMS is mocked, not skipped).
2. In the **server** `.env` set `RETENTION_IDLE_DAYS=0` and `RETENTION_WARNING_DAYS=0`. Restart the server. Do **not** set `AUDIT_RETENTION_DAYS=0` (that would skip the 24-month default).
3. Have a saved draft **or submitted** copy. As admin, **Run retention**.
4. First run: warning + bell + `[sms:mock]`. Account still logs in.
5. Run again: that DPR is gone. User can still log in. Audit has `retention_purge`.
6. Remove the test env vars so production stays **365 + 15 days** for DPRs and **730 days** for each audit row.

### D. Private photos + encryption

1. Logged-out `http://localhost:5000/uploads/images/anything` → **404**. Same for `/uploads/cluster/...`.
2. Upload a cluster photo while logged in. Mongo `project.images` should be `file:<id>`, not `res.cloudinary.com`. Preview still shows the picture.
3. `KYC_ENCRYPTION_KEY=any-long-secret` (required on production). New KYC bytes start with `KYC1`.

To test audit drop: insert an `auditevents` row with `at` two years ago, run retention, that row is gone; a new login row stays.

---

## 9. What Stages 1–3 do not do

- Real grievance inbox, gazette legal name, OpenAI/Cloudinary contracts, breach playbook (Stage 4)
- A chatbot that “closes” a complaint — a person must reply
- A legal statement of DPDP compliance

---

## 10. What we may say after Stage 3

We may say: we do not keep identity scans or cluster photos as public links; unused reports are cleaned 12 months after last edit; each audit row is dropped after 24 months.

We must **not** say: legal compliance is complete. We must **not** say we comply with DPDP.


## Firm PAN field

The optional `firmPan` accepts company/firm PANs only. Individual PANs (4th letter P) are rejected client-side and stripped server-side in `sanitizeStoredPayload`.
