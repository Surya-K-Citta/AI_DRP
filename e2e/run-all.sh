#!/usr/bin/env bash
# Runs every browser test file in its own process and prints one summary line per file.
# Usage: E2E_BROWSER=chromium|firefox|webkit E2E_DEVICE=phone|tablet|laptop|desktop ./run-all.sh [outdir]
cd "$(dirname "$0")"
OUT="${1:-/tmp/qa-e2e-results}"; mkdir -p "$OUT"
echo "browser=${E2E_BROWSER:-chromium} device=${E2E_DEVICE:-desktop}"
for f in tests/*.test.mjs; do
  n=$(basename "$f" .test.mjs)
  perl -e 'alarm 1500; exec @ARGV' node --test --test-concurrency=1 "$f" > "$OUT/$n.out" 2>&1
  printf "%-40s pass=%s fail=%s todo=%s\n" "$n" "$(grep -m1 '^ℹ pass' "$OUT/$n.out" | awk '{print $3}')" "$(grep -m1 '^ℹ fail' "$OUT/$n.out" | awk '{print $3}')" "$(grep -m1 '^ℹ todo' "$OUT/$n.out" | awk '{print $3}')"
done
