# Platform, API documentation and scaling

## Stack as built (and how it differs from the wish list)
| Asked for | What is there | Gap |
|---|---|---|
| Next.js (React), TypeScript | Vite + React 18 + TypeScript, react-router, react-i18next (English/Telugu), a dynamic form engine for the scheme steps | **Not Next.js.** Switching would mean rewriting routing and the pages. The main benefit (pre-rendered first paint) can be had on the landing page alone; see "Lighthouse" |
| NestJS / FastAPI | Express + TypeScript + Mongoose | **Not NestJS or FastAPI.** The API is stateless in how it handles requests (see below) and has OpenAPI docs |
| PostgreSQL or MongoDB | MongoDB (drafts, versions, audit log) | Connection pool configured (below). PostgreSQL is not used |
| Redis | Optional: shared rate limits and shared account-status cache | Sessions (refresh tokens) are stored in MongoDB, not Redis |
| Object store | Local `uploads/` folder | **Not an object store yet.** See "Stateless?" |

## TypeScript
`npx tsc --noEmit -p .` reports **0 errors** in the client and the server. A syntax error in one file (`ClusterDPRView.tsx`, leftover code after a re-export) had been hiding about 40 real errors; those are fixed (unused imports, a missing `mapToOption`/`nextQuestionIndex` in the fallback help guide, unreachable comparisons in a scheme rule, loose types). Caveat: 67 client files and most server files start with `// @ts-nocheck`, which turns checking **off** for them. "Zero errors" is true for the checked files only; removing `@ts-nocheck` file by file is the next step.

## Lighthouse (measured on the production build, headless Chrome, `lighthouse@12`)
| Page | Mobile (default, simulated slow 4G) | Desktop |
|---|---|---|
| Login | 96 | 100 |
| Landing | **75–83** (varies between runs) | 96 |

Landing on mobile is **below 90**. What was done: pages load on demand (main script 3.0 MB → 0.33 MB), the 1 MB Telugu text loads only when Telugu is chosen, a 520 KB logo was replaced by a 35 KB copy, the font stylesheet no longer blocks painting, layout shift went from 0.24 to 0.002. What is left: the hero text appears only after the main script runs, and under Lighthouse's 4x CPU slowdown that gives a largest-contentful-paint of about 4–5 s (target 2.5 s). The fix is to pre-render the landing page's HTML at build time (what Next.js would do); that was not done. Accessibility 97, best practices 100, SEO 92.

## API documentation (OpenAPI 3.0.3)
- `server/openapi.json` is **generated from the route files** (`npm run docs:openapi`): 139 operations, which routes are public, which need sign-in and which roles. A test fails when the file is out of date or invalid.
- Swagger UI: `/api/docs`; raw file: `/api/openapi.json`. In production they are off unless `ENABLE_API_DOCS=true`.
- Limits: request and response bodies are described generically (`{success, message, data}`), not field by field, because the controllers do not declare schemas. Describing each body is further work.

## Stateless?
What is stateless: no server-side sessions (access tokens carry what is needed, refresh sessions are in MongoDB), no per-request memory, audit writes are safe with several servers (unique sequence number, retry).
What is **not**: uploaded files (KYC, cluster photos, scheme documents, templates) are written to the server's local `uploads/` folder, so a second server would not see them. Until they move to an object store (S3 or compatible), run **one** server, or mount one shared volume (EFS/NFS) at `uploads/` on all servers. Moving ~15 file read/write places to an object-store driver is a separate piece of work and was not done.
Per-server memory that is harmless but not shared: integration cache layer, breaker and token bucket; the account-status cache (up to 10 s; made shared by Redis, below).

## Redis (optional, `REDIS_URL`)
- Shared rate limits (`RedisRateLimitStore`) and a shared account-status cache. Deactivating an account clears the entry for every server at once.
- If Redis is down or not set, each server counts in memory and requests are never blocked.
- `GET /api/admin/infra/status` shows pool settings, Redis state and the account-status cache hit rate (memory hits + shared hits over all lookups).
- **Tested only against an in-memory stand-in (`ioredis-mock`), not a real Redis server.** Try it on a staging Redis before relying on it.
- The "99.9% hit rate" cannot be promised: it depends on traffic. With a 10 s cache, an active user costs one database read per 10 s, so hit rate rises with how often people click. Measure it from the status endpoint under real load.

## Connection pooling
MongoDB: `MONGODB_MAX_POOL_SIZE` (default 20), `MONGODB_MIN_POOL_SIZE` (2), `MONGODB_MAX_IDLE_MS` (60000), `MONGODB_WAIT_QUEUE_MS` (10000). Pool size is per API server; keep (servers × max pool) below the database's connection limit. This is MongoDB pooling; there is no PostgreSQL pool because there is no PostgreSQL.

## Object store lifecycle rules
`docs/ops/s3-lifecycle.json` is a ready S3 lifecycle configuration (abort stale multipart uploads after 2 days; KYC files expire after 730 days; cluster photos move to infrequent access after 90 days and expire after 3 years; exports expire after 7 days; old versions expire after 30 days). Apply with `aws s3api put-bucket-lifecycle-configuration`. Match the expiry days to the retention periods approved under the DPDP plan. It does nothing until an object store is actually in use.
