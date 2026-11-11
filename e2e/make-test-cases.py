#!/usr/bin/env python3
"""Builds test-docs/test-cases.md from the result files written by run-all.sh (real outcomes, not a plan)."""
import re, sys, glob, os
src = sys.argv[1] if len(sys.argv) > 1 else '/tmp/qa-e2e-results'
rows, totals = [], {}
for f in sorted(glob.glob(f'{src}/*.out')):
    name = os.path.basename(f)[:-4]
    for line in open(f, encoding='utf-8', errors='replace'):
        m = re.match(r'^\s+([✔✖﹣])\s+((?:[A-Z]+-[0-9A-Za-z]+(?:-W\d+)?)|(?:[A-Z]+-0?2x|AUTH-02x))\s+(.*?)\s+\((\d+(?:\.\d+)?)ms\)(?:\s+#\s*(.*))?$', line)
        if not m:
            continue
        mark, tid, title, ms, note = m.groups()
        res = 'PASS' if mark == '✔' and not note else ('KNOWN BUG' if note else 'FAIL')
        if mark == '✖': res = 'FAIL'
        rows.append((tid, title, res, name, note or ''))
        totals[res] = totals.get(res, 0) + 1
out = ['# Test cases and results', '',
       'Generated from the real run output (`e2e/run-all.sh`, each file in its own process). `KNOWN BUG` = the check failed because of a confirmed defect listed in `bug-report.md` (reported as `todo`, not hidden).', '',
       'Totals: ' + ', '.join(f'{k} {v}' for k, v in sorted(totals.items())), '',
       '| ID | What it checks | Result | File | Note |', '|---|---|---|---|---|']
for tid, title, res, name, note in rows:
    out.append(f'| {tid} | {title.replace("|", "/")} | {res} | {name} | {note.replace("|", "/")} |')
open(sys.argv[2] if len(sys.argv) > 2 else '/Users/not_found/Documents/CODE/AI_DPR/test-docs/test-cases.md', 'w').write('\n'.join(out) + '\n')
print(totals, len(rows))
