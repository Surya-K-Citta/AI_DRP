# AI gateway (OpenAI, gpt-4o-mini)

All OpenAI calls go through `server/src/lib/aiGateway.ts`. It:
- forces the model to `OPENAI_CHAT_MODEL` (default `gpt-4o-mini`; others only if listed in `OPENAI_OTHER_MODELS`);
- replaces person names, phone numbers and e-mails with placeholders before sending, then restores them in the reply; identity numbers (Aadhaar, PAN, GST, account numbers) are removed and never restored;
- sets `store: false` and sends a hashed `user` id;
- accepts only an https `OPENAI_BASE_URL` (point it at your own API gateway);
- records an `ai_call` audit event with sizes and redaction counts only, never the text.

## What this does not prove
- Scrubbing is pattern and name-list based. It lowers the risk; it is not a guarantee that no personal data is ever sent. Free text typed by users is the weak spot.
- Audio transcription sends the recording as spoken and cannot be scrubbed. It is off unless `AI_ALLOW_AUDIO` is set.
- **Data-retention opt-out cannot be verified from code.** `store: false` is a request flag. Zero data retention is an account-level agreement with OpenAI. The organisation must confirm it in its OpenAI enterprise terms, then set `OPENAI_ZDR_CONFIRMED=true` (and optionally `OPENAI_ZDR_NOTE`). Until then the server warns at startup and the Admin audit tab shows "NOT yet confirmed".

## Environment variables
`OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_CHAT_MODEL`, `OPENAI_OTHER_MODELS`, `AI_ALLOW_AUDIO`, `OPENAI_ORG_ID`, `OPENAI_PROJECT_ID`, `OPENAI_ZDR_CONFIRMED`, `OPENAI_ZDR_NOTE`, `ACCOUNT_STATUS_TTL_MS`.
