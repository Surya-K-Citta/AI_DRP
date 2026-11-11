# Integration test map

> The journeys below are exercised by `admin-reviewer.spec.ts` ("across people and modules", the reviewer queue and the deactivation test) and, in the older suite, by INT-001..004. New hand-offs: dashboard card → filtered DPR list (`dashboard.responsive.spec.ts`), dashboard Search Scheme → scheme list with the words typed in, analytics chart or legend → filtered page and DPR Management tab (`admin-analytics.responsive.spec.ts`), tour → real creation flow → sample answers → Save Draft → dashboard (`tour.spec.ts`).

How modules depend on each other, and which test proves each hand-off. All are run (Chromium and WebKit, at phone, tablet, laptop and desktop sizes) against the real API and database (only the AI is stubbed).

```
 Entrepreneur UI ──► Projects ──► DPR (individual / cluster) ──► Submit ──► Reviewer queue ──► Decision
        │               │               │                          │              │                │
        │               │               └── Downloads (PDF/DOCX/XLS)            │                └─► status back to Entrepreneur + Admin
        │               └── Dashboard totals / All DPRs list                      └─► Admin analytics, audit trail
        ├─► Scheme finder ──► scheme chosen ──► DPR template/brief
        ├─► AI chat (consent required) ◄── Privacy settings (AI on/off)
        └─► Profile / Privacy ──► export, nominee, complaint ──► Support desk ──► Admin
 Admin ──► invite reviewer ──► accept-invite ──► reviewer role   Admin ──► deactivate ──► every module refuses the user
 Session manager ◄──► token refresh ◄──► every API call
```

| # | Hand-off | Proving test | Result source |
|---|---|---|---|
| 1 | Draft saved in the DPR module → appears in the project list, dashboard totals, admin counts and the reviewer's view | INT-001 | `08-…` |
| 2 | Submitted DPR → reviewer sees it (own district only) → admin sees it → status follows the decision | INT-002, REV-001..003, DPR-022 | `04`, `08` |
| 3 | Reviewer decision → admin analytics `data.summary` change | INT-002, ADM-001 | `08` |
| 4 | One person's data never appears for another (projects, DPRs, export, notifications) | INT-003, PROJ-020, DPR-010, PRIV-001/005 | `03`, `04`, `07`, `08` |
| 5 | Deactivating a user → token dead everywhere, sign-in refused, audit entry | INT-004, `admin.live` | `08`, server |
| 6 | Privacy "AI help off" → chat API refuses | PRIV-002, CHAT-004 | `07` |
| 7 | Complaint → support desk | PRIV-004 | `07` |
| 8 | Delete account → user and records removed | PRIV-006 | `07` |
| 9 | Project delete → DPR versions removed | PROJ-013 | passes (BUG-010 fixed) |
| 10 | Draft save with another user's `projectId` → refused (404) | DPR-011 | passes (BUG-009 fixed) |
| 11 | Session expiry → redirect to sign-in with a message; refresh keeps the session while active | SESS-001..003, `session.live` | `09`, server |
| 12 | Admin invites reviewer (district required) → reviewer sets password once → right access | ADM-004, `admin.live` | `08`, server |
| 13 | Scheme finder → DPR creation | VM-020 ends with schemes the person can act on; IDPR-001 starts from a scheme | `05`, `06` |
| 14 | Draft failure (forced) → message shown, typing kept | IDPR-023 | `05` |

**Not exercised:** AI-guided builder → DPR, document upload → RAG → AI answers, APMSME submission, email delivery of invitations, support-ticket UI, file/image upload.
