# Role-wise Features and Operations

Three roles. The server enforces them on every request; hiding a menu item is only a convenience.

| Role (screen name) | Stored as | Created by |
|---|---|---|
| Entrepreneur | `entrepreneur` | Self-registration (age 18+, consent required) |
| District Reviewer | `officer` + one district | Admin invitation or role change |
| APMSMEDC Admin | `admin` | Existing admin only |

## 1. Access at a glance
| Area | Entrepreneur | District Reviewer | Admin |
|---|:--:|:--:|:--:|
| Register, sign in, profile, privacy centre | ✔ | ✔ | ✔ |
| Scheme Finder, Create DPR, drafts, preview, downloads | ✔ (own) | – | ✔ |
| Submit own DPR for review | ✔ | – | – |
| Review queue, approve / send back | – | ✔ (own district) | ✔ (all districts) |
| Open another person's DPR / KYC file | – | ✔ read-only, own district | ✔ |
| User management, invitations, deactivation | – | – | ✔ |
| Role and district assignment | – | – | ✔ |
| Policies, documents, analytics | – | – | ✔ |
| Audit log, integrity check, CSV export | – | – | ✔ |
| Support desk: raise and follow own requests | ✔ | ✔ | ✔ |
| Support desk: work the queue | – | L1 only | all tiers + report |
| Developer tools (dev mode switch) | – | – | super admin only |

Wrong role → HTTP 403 and an `access_denied` audit entry. No or expired token → 401.

## 2. Entrepreneur
**Features**
- Scheme Finder: answer questions, see *Suggested* and *Compare* schemes with key facts.
- Create DPR: scheme-specific steps, plain-language prompts, hover cards, calculators (DSCR, CapEx), conditional tables (manufacturing → plant and machinery, services → asset list), auto-reuse of promoter details across sections.
- Autosave, resume, undo/redo, reset; live document with style editor (layout, fonts, margins, page numbers).
- *Check my answers* before generating; finance rules block bad submissions.
- Preview and download PDF / Word / Excel (English). Telugu/English toggle for screens.
- Dashboard "My Detailed Project Reports": open, edit, delete (confirmation asked).
- Chat assistant and AI help (needs AI consent in profile).
- Privacy centre: view and change consents, nominee, download my data, erase my account, raise a complaint.

**Typical operations**
1. Register → accept privacy notice → sign in.
2. Run Scheme Finder, choose a scheme, create DPR.
3. Fill steps; fix items under *Check my answers*; Generate.
4. Download, then **Submit** so the district reviewer can see it.
5. If sent back: open the DPR, read remarks, edit, resubmit.

**Limits**: sees only own projects; must be 18+; session ends after 15 minutes without activity (draft is kept); account is erased after long inactivity per retention policy (warning is given first).

## 3. District Reviewer
**Features**: `/reviewer` queue for the one assigned district (counts and filters); open a submitted DPR read-only with applicant details; **Approve**, or **Send back** (remarks required); view KYC files of that district's applicants.

**Typical operations**
1. Sign in → *Review* in the side menu.
2. Open the oldest submitted DPR; read sections and the data-check summary.
3. Approve, or send back with clear remarks.
4. For a problem with the tool, raise a support request (L1 queue is worked by reviewers).

**Limits**: cannot create DPRs, cannot see other districts (403), cannot manage users. Only DPRs in status `submitted` can be decided (409 otherwise).

## 4. APMSMEDC Admin
**Screens**: `/admin` tabs — Analytics, User Management, Access control, DPR Management, Policies, Audit log; `/admin/documents` (template and reference documents).

**Typical operations (runbook)**
| Task | Steps |
|---|---|
| Onboard a District Reviewer | Users → **Invite user** → name, email, role *District Reviewer*, district → copy the one-time link (valid 72 h, shown once) → send it. The person sets a password and consents. |
| Change role or district | Users → edit person. Not allowed on yourself. Logged as `role_change`. |
| Remove access | Users → **Deactivate** (reason required). Sessions end within seconds. **Reactivate** later; the person signs in again. |
| Force sign-out | Users → **Sign out everywhere**. |
| Check the audit trail | Audit tab → filter → **Verify integrity** (shows first broken entry if any) → CSV export (itself logged). |
| Manage policies | Policies tab: create, version, archive. Changes are audited. |
| Review DPRs | DPR Management: open any DPR, delete, decide; reviewer queue with district filter. |
| Run retention now | Audit tab → **Run retention** (normally runs automatically every 6 h). |
| Support desk | `GET /api/support/queue`, `PATCH /api/support/tickets/:id`, `GET /api/support/report`; unanswered tickets escalate automatically. |
| Check system health | `/api/health`, `/api/admin/infra/status`, `/api/admin/integrations/status`, `/api/admin/ai/status`. |

**Rules**: cannot deactivate self or the last admin. Every admin action is written to the audit log with user, IP and details.

## 5. Support targets (all roles)
| Priority | Meaning | First response |
|---|---|---|
| P1 | Service down, data loss, security incident | < 4 h (starts at L2) |
| P2 | Major feature broken, no workaround | < 8 h |
| P3 | Broken with workaround | 24 h |
| P4 | Question | 72 h |
Unanswered tickets move L1 → L2 at half the time and to L3 (flagged *breached*) at the full time.
