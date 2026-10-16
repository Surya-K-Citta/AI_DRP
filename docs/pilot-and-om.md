# Pilot, go-live and 3-year O&M

## Support model (as built)
The support desk is in the application (`/api/support/*`; `npm run test:support`). **Built:** raise a request, follow it, reply, staff queue, status and priority changes, internal notes, automatic escalation, report. **Not built:** a web screen for it (it is API-only for now), e-mail/SMS alerts on escalation, and a 24x7 on-call roster. Those need building, and people to staff them.

| Priority | Meaning | First response | Resolution target |
|---|---|---|---|
| P1 | Service down, data loss, security incident | < 4 h (starts at L2) | 24 h |
| P2 | Major feature broken, no workaround | < 8 h | 72 h |
| P3 | Broken, workaround exists | 24 h | 7 days |
| P4 | Question or small improvement | 72 h | 14 days |

Escalation matrix (runs every minute, recorded in the audit trail): with no first reply, a ticket moves L1 → L2 at half of its response time, and to L3 and is flagged **breached** when the full time passes. A reply to the person (not an internal note) stops the clock.
- **L1** – District Reviewers / support desk: how-to, account problems, triage.
- **L2** – APMSMEDC Admin / application support: bugs, data fixes, configuration.
- **L3** – Developers and vendor: code changes, security, infrastructure.

The P1/P2 times above are response times from the moment a request is raised. They only mean something if someone is on duty at those hours; the contract should say whether the clock runs 24x7 or only in working hours (the code currently counts calendar time).

## Pilot plan (3 months, 5 district offices, 200+ DPRs)
This cannot be completed by software. What the project team has to do, and what the application provides:

| Step | Owner | Application support |
|---|---|---|
| Pick 5 districts; invite each District Reviewer | APMSMEDC | Admin → Users → Invite user (one-time link, district assigned) |
| Training: entrepreneurs (create a DPR, read the checks) and reviewers (queue, decisions, comments) | Vendor + APMSMEDC | Telugu/English UI; plain-language prompts; review dialog |
| Weekly pilot report | Vendor | Admin dashboard counts; `/api/support/report` response-target figures |
| Defect and feedback loop | Support desk | Tickets with priorities; in-app feedback |
| Milestones: 200+ DPRs created, share reviewed, defects closed | APMSMEDC | Counts from the dashboard |
| UAT sign-off | APMSMEDC | Test evidence: `npm test`, `test:admin`, `test:rbac`, `test:security`, `test:finance`, `test:support` |

Go-live checklist: `DATA_ENCRYPTION_KEY`, `KYC_ENCRYPTION_KEY`, JWT secret, OpenAI zero-retention confirmed (`OPENAI_ZDR_CONFIRMED`), TLS 1.3 live and graded, disk encryption on, database user without delete rights on `auditevents`, backups tested, `npm run encrypt:existing` run, penetration test report, compliance matrix reviewed.

## Honest status
Training, the pilot, milestone results and UAT sign-off are project activities that have not happened. The application is ready to be piloted once the setup items above are done; it is not evidence that the pilot succeeded.
