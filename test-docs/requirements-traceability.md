# Requirements traceability

> Test IDs below are from the older `node:test` suite (`e2e/tests/`). The same requirements are also covered by the Playwright Test suite in `client/e2e/` (run with `npx playwright test --ui`); the file-by-file list is at the end of `test-cases.md`. Requirements added later: **R32** the dashboard shows real numbers and every card/button opens the right place (`dashboard.responsive.spec.ts`, DASH-001..022); **R33** the guided tour points at real buttons, switches the rest of the page off and ends on the dashboard (`tour.spec.ts`, TOUR-001..006); **R34** the admin Analytics tab agrees with the records, filters, exports and links through (`admin-analytics.responsive.spec.ts`, ADMA-001..008); **R35** Compare and the suggested plan open as large windows with up to three chosen schemes (`scheme-finder.responsive.spec.ts`, VM-021/022).

The application has no written requirements document, so each requirement below was **derived from the code and the screens** (the inventory in `application-functionality-inventory.md`). Test IDs are the real ones in `e2e/tests/` and `server/src/*.test.ts`. A row with "—" in the test column is a gap, not a pass.

| # | Requirement (derived) | Tests | Status |
|---|---|---|---|
| R1 | A person can register with consent; weak password, duplicate email, bad phone, under-18 are refused; nobody can self-register as admin | AUTH-010..014 | Covered |
| R2 | Sign-in works, wrong password is refused, the form works by keyboard | AUTH-001/002/004, KEY-002 | Covered |
| R3 | Protected pages and APIs need a valid token; forged/missing tokens are refused | AUTH-003, AUTH-031, `rbac.live` | Covered |
| R4 | Roles only open their own areas (entrepreneur / admin / reviewer) | AUTH-02x, `rbac.live` | Covered |
| R5 | Sign-out clears the session; a 6-minute idle session warns, then ends with a message; "Stay signed in" keeps it | AUTH-030, SESS-001..003, `session.live` | Covered |
| R6 | A project can be created, listed, opened, edited, deleted (with confirmation) | PROJ-001..005, 010..012 | Covered |
| R7 | Deleting a project also removes its DPRs | PROJ-013 | Passes (BUG-010 fixed) |
| R8 | One person cannot read, change or delete another's project/DPR | PROJ-020, DPR-010, DPR-011 | Passes (BUG-009 fixed) |
| R9 | Saving a DPR draft creates one project + one draft and later saves update them | DPR-001, IDPR-020..023 | Covered |
| R10 | Individual DPR: scheme choice, step list, required count, check answers, autosave, failure message, Basic/Advanced, drag/hide steps, template, preview, number inputs | IDPR-001..044 | Covered |
| R11 | Cluster DPR opens with 18 steps, saves a cluster draft, views switch without losing input | CLUS-001..003 | Covered (generation/AI helpers not) |
| R12 | Under-18 applicants are refused server-side and nothing is stored | DPR-004, IDPR-024, `api.live` | Covered |
| R13 | Money fields: zero/negative handled cleanly | PROJ-005, IDPR-044 | Passes (BUG-007 fixed) |
| R14 | Boundary input (very long names, large payload, special characters) is stored safely | DPR-005, PROJ-004 | Covered; long names are now capped and wrap (BUG-013 fixed) |
| R15 | Download PDF/Word/spreadsheet of own draft; PDF is a real PDF | DPR-020, `pdf.smoke` | Covered |
| R16 | Submitting records who/when/to whom and cannot duplicate | DPR-021 | Covered |
| R17 | Reviewers see only their district; decisions need remarks, are final, and the status follows | DPR-022, REV-001..003, INT-002 | Covered |
| R18 | Scheme finder narrows by answers, Previous works, reload is safe, owner-category rules hold, ends with matching schemes | VM-001..003, VM-010..017, VM-020 | Covered |
| R19 | AI chat sends/receives, shows failure, blocks empty message, requires AI consent | CHAT-001..004 (AI stubbed) | Covered with a mock |
| R20 | Profile edit; email fixed; invalid phone refused | PROF-001/002 | Covered |
| R21 | Privacy rights: export (own data only), AI consent, nominee, complaint, notifications, delete account | PRIV-001..006 | Covered |
| R22 | Admin analytics equal the database; users list; audit trail verifies; invite reviewer | ADM-001..004, `admin.live` | Covered |
| R23 | Deactivation ends access at once across modules | INT-004, `admin.live` | Covered |
| R24 | Finance guard and encryption of stored data | `finance.live`, `financeGuard.parity`, `encryption.live` | Covered |
| R25 | Support desk tickets | `support.live` (API) | API only; no UI test |
| R26 | Every screen opens (Chromium and WebKit, phone / tablet / laptop / desktop), shows content, has no console errors, passes an automated accessibility scan | SMOKE-001..018 | Passes after the fixes (BUG-002..008, 011, 012, 016, 017) |
| R27 | No sideways scrolling at 360/768/1280 px | SMOKE-nnn-W360/W768/W1280 | Passes after BUG-013 and BUG-015 were fixed |
| R28 | English ↔ Telugu switch | LANG-001 | Covered (page chrome only) |
| R29 | Keyboard: skip link, focus order | KEY-001, IDPR-043 (focus return) | Covered |
| R31 | The pages work with touch screens and on Safari's engine | whole suite on WebKit; phone/tablet use touch | Covered (touch drag-and-drop to reorder steps is not tested) |
| R30 | AI guided builder, document/RAG upload, image/annexure upload, APMSME submit, accept-invite UI, All-DPRs filters | — | **Not covered** |
