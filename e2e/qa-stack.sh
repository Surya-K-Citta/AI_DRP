#!/usr/bin/env bash
# Starts an isolated QA stack: its own API (port 5055) on its own database (msme-dpr-qa), and the client dev server (port 5199) pointed at it.
# Your normal dev server (port 5000) and database (msme-dpr) are never touched.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export QA_API_PORT=5055 QA_WEB_PORT=5199
export MONGODB_URI="${QA_MONGODB_URI:-mongodb://localhost:27017/msme-dpr-qa}"
case "$MONGODB_URI" in *msme-dpr-qa*|*qa*) ;; *) echo "Refusing: QA database name must contain 'qa' (got $MONGODB_URI)"; exit 1;; esac
cmd="${1:-up}"
if [ "$cmd" = "down" ]; then pkill -f "QA_STACK_API" || true; pkill -f "vite --port $QA_WEB_PORT" || true; echo stopped; exit 0; fi
( cd "$ROOT/server" && PORT=$QA_API_PORT API_BASE_URL="http://localhost:$QA_API_PORT/api" CORS_ORIGIN="http://localhost:$QA_WEB_PORT" \
  RATE_LIMIT_MAX_REQUESTS=100000 NODE_ENV=development QA_STACK_API=1 nohup npx ts-node-dev --transpile-only src/index.ts > /tmp/qa-api.log 2>&1 & )
( cd "$ROOT/client" && VITE_API_URL="http://localhost:$QA_API_PORT/api" nohup npx vite --port $QA_WEB_PORT --strictPort > /tmp/qa-web.log 2>&1 & )
for i in $(seq 1 40); do curl -s -m 2 "http://localhost:$QA_API_PORT/api/health" >/dev/null && break; sleep 1; done
curl -s "http://localhost:$QA_API_PORT/api/health" && echo && echo "web: http://localhost:$QA_WEB_PORT"
