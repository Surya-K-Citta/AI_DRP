# Audit trail and access control

## Audit trail
- Every admin edit, template/scheme-style update, document change, DPR decision, invitation, role change, deactivation and every login (success and failure) writes one event: `seq`, `at`, `userId`, `role`, `action`, target, `ip`, `payload`.
- Events are hash-chained (SHA-256 over the event plus the previous hash). `GET /api/admin/audit/verify` (Admin tab: "Verify integrity") recomputes the chain and reports the first broken `seq`.
- The app cannot update or delete events: model hooks reject it. The only deletion path is the retention job, which records an anchor so the remaining chain still verifies.
- Limit: this protects against changes made through the app and detects changes made in the database. It does not stop someone with full database rights. In production, give the app's MongoDB user insert/find only on `auditevents`.
- Rows written before this feature have no hash and sit outside the chain.
- Secrets and identity numbers are redacted from payloads; payloads are size-capped.

## Onboarding and revocation
- Admin invites a user (name, email, role, district for District Reviewers). A one-time link (hashed in the DB, valid 72 h) is shown once. The person sets a password, phone, date of birth and consent.
- Deactivate: sets `isActive=false`, ends all sessions, refuses login and refresh. Access tokens are rejected on the next request; the account-status cache lives at most `ACCOUNT_STATUS_TTL_MS` (default 10 s, capped at 25 s), and is cleared instantly for changes made through the app. So revocation takes effect within 30 seconds even if the database is edited directly.
- Reactivate: old tokens stay dead; the person signs in again.
- Admins cannot deactivate themselves or the last admin.
