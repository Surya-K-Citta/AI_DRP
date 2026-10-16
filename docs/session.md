# Sessions: 15 minute tokens, refresh and inactivity timeout

## How it works

- **Access token (JWT): 15 minutes.** Sent as `Authorization: Bearer …`. Expired: `401 {"code":"TOKEN_EXPIRED"}`. Bad: `401 {"code":"TOKEN_INVALID"}`.
- **Session cookie:** login and registration also set an httpOnly cookie `dpr_refresh` (path `/api/auth`, `Secure` + `SameSite=None` in production, `Lax` in development). Only a hash of it is stored (`RefreshSession`). It is never readable from JavaScript.
- **Refresh:** `POST /api/auth/refresh` swaps the cookie for a new 15 minute token (and re-reads the user, so a changed role shows up). A session is refused when it has not been refreshed for 15 minutes (`SESSION_IDLE`), has passed `SESSION_MAX_HOURS` (default 12, `SESSION_EXPIRED`), or was signed out (`SESSION_REVOKED`). `POST /api/auth/logout` revokes the session and works with an expired token. Deleting an account removes its sessions. Refreshes are exempt from the API rate limit.
- **Inactivity timeout = 15 minutes without activity.** The browser renews the token while the person is working (clicks, keys, scroll, touch), at most about once a minute, so the header clock stays near 15:00 while active and counts down while idle. With no activity there is no renewal, the token runs out, and the server would refuse a refresh anyway.
- Tests can set `SESSION_ACCESS_SECONDS` (minimum 10) on the server to run the whole lifecycle in a minute. The browser reads the length from the token. Leave it unset in real use.

## What the person sees

- **Header:** a "Session m:ss" pill (turns amber, then red in the last minute). Hover for the rule.
- **One minute before the end:** "Are you still there?" with **Stay signed in**. The open draft is saved at that moment, while the token still works. Any activity renews the session and closes the prompt.
- **When it ends:** a sign-in prompt appears over the page (password only, same account). The form underneath is untouched, so nothing typed is lost. After signing in the open draft is saved. **Sign out** is also offered.
- **Reload or a request after expiry:** the first 401 triggers one silent refresh and the request is repeated. If the session is over, the same prompt opens.
- **Draft safety net:** if the session ends while the open draft has changes the server never got, a copy is kept in this browser (`dpr-session-backup`) and put back (saved as a draft) the next time the same person signs in, then deleted. Signing in as someone else shows nothing of the previous person's screen.
- Other tabs share the renewed token through `localStorage`.

## Tests

`cd server && npm run test:session` (API running): token length, cookie flags, `TOKEN_EXPIRED`, refresh, idle expiry, logout with an expired token, role change on refresh.
