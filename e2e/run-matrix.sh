#!/usr/bin/env bash
# Runs the whole browser suite on every browser x screen size (phone 360, tablet 768, laptop 1280, desktop 1440).
# Browsers run side by side, screen sizes one after another. Results: /tmp/qa-matrix/<browser>-<device>/ and /tmp/qa-matrix/summary-<browser>.txt
# Usage: ./run-matrix.sh [browsers="chromium webkit"] [devices="desktop laptop tablet phone"]
cd "$(dirname "$0")"
BROWSERS="${1:-chromium webkit}"; DEVICES="${2:-desktop laptop tablet phone}"
mkdir -p /tmp/qa-matrix
for b in $BROWSERS; do
  ( for d in $DEVICES; do E2E_BROWSER=$b E2E_DEVICE=$d ./run-all.sh /tmp/qa-matrix/$b-$d; done > /tmp/qa-matrix/summary-$b.txt 2>&1 ) &
done
wait
