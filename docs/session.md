# Sessions: 6 minute idle limit, refresh and inactivity timeout

## How it works

- **Access token (JWT): 6 minutes 30 seconds** (the 6 minute idle limit plus 30 s slack; the browser ends a quiet session at exactly 6:00 first, the server is the backstop). Sent as `Authorization: Bearer …`. Expired: `401 {"code":"TOKEN_EXPIRED"}`. Bad: `401 {"code":"TOKEN_INVALID"}`.
- **Session cookie:** login and registration also set an httpOnly cookie `dpr_refresh` (path `/api/auth`, `Secure` + `SameSite=None` in production, `Lax` in development). Only a hash of it is stored (`RefreshSession`). It is never readable from JavaScript.
- **Refresh:** `POST /api/auth/refresh` swaps the cookie for a new token (and re-reads the user, so a changed role shows up). A session is refused when it has not been refreshed for 6 minutes 30 seconds (`SESSION_IDLE`), has passed `SESSION_MAX_HOURS` (default 8, `SESSION_EXPIRED`), or was signed out (`SESSION_REVOKED`). `POST /api/auth/logout` revokes the session and works with an expired token. Deleting an account removes its sessions. Refreshes are exempt from the API rate limit.
- **Inactivity timeout = 6 minutes without activity.** The browser renews the token while the person is working (clicks, key presses, mouse wheel, touch; real input only, so a page reload, a restored scroll position or the app's own scrolling never restarts the clock), The header clock is the **idle countdown**: it is measured in the browser from the last real input, so it jumps back to 6:00 the instant someone clicks or types and only runs down while they are idle (it is not the token's expiry). The token is renewed in the background at most every 20 seconds while someone is active. The time of the last input is kept on the device, so a reload or another tab carries on from it instead of starting over. With no activity there is no renewal, the token runs out, and the server would refuse a refresh anyway.
- Tests can set `SESSION_ACCESS_SECONDS` (minimum 10) on the server to run the whole lifecycle in a minute. The browser reads the length from the token. It is ignored when `NODE_ENV=production` (always 6 minutes there), so leave it unset in real use.

## What the person sees

- **Header:** a "Session m:ss" pill (turns amber, then red in the last minute). Hover for the rule.
- **One minute before the end:** "Are you still there?" with **Stay signed in**. The open draft is saved at that moment, while the token still works. Any activity renews the session and closes the prompt.
- **When it ends:** the person is signed out and taken to the **login screen**, with a note saying why ("You were signed out after 6 minutes of inactivity. Please sign in again."; other notes for the 8 hour limit and a deactivated account). They must sign in again. An open draft is saved first if possible; if it cannot be, a copy is kept on this device and put back (saved as a draft) after the same person signs in.
- **Reload or a request after expiry:** the first 401 triggers one silent refresh and the request is repeated. If the session is over, the person is signed out and sent to the login screen as above.
- **Draft safety net:** if the session ends while the open draft has changes the server never got, a copy is kept in this browser (`dpr-session-backup`) and put back (saved as a draft) the next time the same person signs in, then deleted. Signing in as someone else shows nothing of the previous person's screen.
- Other tabs share the renewed token through `localStorage`.

## Tests

`cd server && npm run test:session` (API running): token length, cookie flags, `TOKEN_EXPIRED`, refresh, idle expiry, logout with an expired token, role change on refresh.
