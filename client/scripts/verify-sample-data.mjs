// Checks every sample-data file the way the form would: full coverage of the questions asked, no required
// field empty, no blocking finance/required finding, no data-check notes. Usage: node scripts/verify-sample-data.mjs [CODE ...]
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = mkdtempSync(path.join(tmpdir(), 'verify-sample-'));
const entry = path.join(dir, 'entry.ts');
const src = path.join(root, 'src');
const only = process.argv.slice(2);
const codes = readdirSync(path.join(src, 'lib/individualDpr/sampleData'))
  .filter((f) => /^[A-Z0-9_]+\.ts$/.test(f))
  .map((f) => f.replace('.ts', ''))
  .filter((c) => !only.length || only.includes(c));

writeFileSync(entry, `
import { getSchemeSteps } from '${src}/lib/individualDpr/schemeStepCatalog';
import { computeSections } from '${src}/lib/individualDpr/authoringProgress';
import { missingIndividualRequired } from '${src}/lib/requiredStepFields';
import { auditSubmission, financeWarnings } from '${src}/lib/individualDpr/submissionAudit';
import { runDataChecks } from '${src}/lib/individualDpr/dataChecks';
${codes.map((c, i) => `import s${i} from '${src}/lib/individualDpr/sampleData/${c}';`).join('\n')}
const all = { ${codes.map((c, i) => `'${c}': s${i}`).join(', ')} };
export function run() {
  const out = {};
  for (const [code, sample] of Object.entries(all)) {
    const scheme = code === 'VANILLA' ? null : code;
    const defs = getSchemeSteps(scheme);
    const data = { ...sample, matchedSchemeCode: scheme, schemeExtras: { ...(sample.schemeExtras || {}) } };
    const steps = defs.map((d) => d.n);
    const visible = [...new Set(defs.map((d) => d.contentStep))];
    const problems = [];
    for (const s of computeSections(data, scheme, defs, steps)) {
      if (s.title.toLowerCase().includes('upload') || s.contentStep === 18) continue;
      if (s.percent < 100) problems.push('step ' + s.step + ' (' + s.title + '): ' + s.answered + '/' + s.total + ' answered');
      if (s.requiredMissing) problems.push('step ' + s.step + ': ' + s.requiredMissing + ' required missing');
    }
    for (const f of auditSubmission(data, visible, (st, sd) => missingIndividualRequired(st, sd, scheme)))
      if (!String(f.id).startsWith('required.18.')) problems.push('BLOCK ' + f.id + ' ' + JSON.stringify(f.vars || {}));
    for (const f of [...runDataChecks(data, { final: true }), ...financeWarnings(data)])
      problems.push('NOTE ' + f.kind + ' ' + f.id + ' ' + JSON.stringify(f.vars || {}));
    out[code] = problems;
  }
  return out;
}
`);
const outfile = path.join(dir, 'bundle.mjs');
await build({
  entryPoints: [entry], bundle: true, format: 'esm', platform: 'node', outfile, logLevel: 'error',
  alias: { '@': src }, loader: { '.json': 'json' }, define: { 'import.meta.env': '{}' },
});
const { run } = await import(pathToFileURL(outfile).href);
const res = run();
let bad = 0;
for (const [code, problems] of Object.entries(res)) {
  console.log(`${problems.length ? 'FAIL' : 'ok  '} ${code}`);
  problems.forEach((p) => console.log('      - ' + p));
  if (problems.length) bad += 1;
}
console.log(`\n${codes.length - bad}/${codes.length} sample files clean`);
process.exit(bad ? 1 : 0);
