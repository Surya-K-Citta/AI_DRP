// Bilingual audit: locale parity, Telugu Unicode health, and untranslated UI literals in source.
// Usage: node scripts/i18n-audit.mjs [--strict] [--list]
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = path.resolve(new URL('..', import.meta.url).pathname);
const src = path.join(root, 'src');
const args = new Set(process.argv.slice(2));
const TELUGU = /[ఀ-౿]/;
let failures = 0;
const section = (t) => console.log(`\n== ${t}`);
const fail = (n) => { failures += n; };

const flat = (obj, prefix = '', out = {}) => {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') flat(v, key, out); else out[key] = String(v);
  }
  return out;
};
const en = flat(JSON.parse(fs.readFileSync(path.join(src, 'i18n/locales/en.json'), 'utf8')));
const te = flat(JSON.parse(fs.readFileSync(path.join(src, 'i18n/locales/te.json'), 'utf8')));

// words that legitimately stay in Latin script
const KEEP = /^[\s\d\W]*$|^(DPR|PMEGP|MSME|AP|GST|GSTIN|PAN|UPI|OTP|PDF|IFSC|QR|ID|URL|CSV|AI|KYC|Udyam|APIIC|FSSAI|CGTMSE|MUDRA|ZED|LEAN|IPR|Arial|Calibri|Helvetica|Times New Roman|AP MSME-EDP 4\.0|RAMP MSE-SPICE|Competitive LEAN|MSME Champions|English|EN|TE|KB|IP|KW|kWh|L\/day|KVIB|KVIC|DIC|UDYAM|XX|DOCX|XLS|XLSX|DELETE|\(mm\)|\(pt\)|\(KW\))[\s\W]*$/i;
const needsTe = (v) => /[A-Za-z]{3,}/.test(v.replace(/\{\{[^}]+\}\}/g, ''));

section('Locale parity (en.json vs te.json)');
const missing = Object.keys(en).filter((k) => !(k in te));
const extra = Object.keys(te).filter((k) => !(k in en));
const untranslated = Object.keys(en).filter((k) => k in te && needsTe(en[k]) && !KEEP.test(en[k]) && te[k] === en[k]);
const noTelugu = Object.keys(te).filter((k) => k in en && needsTe(en[k]) && !KEEP.test(en[k]) && !TELUGU.test(te[k]) && te[k] !== en[k]);
const placeholders = Object.keys(te).filter((k) => k in en && JSON.stringify(en[k].match(/\{\{[^}]+\}\}/g) || []) !== JSON.stringify(te[k].match(/\{\{[^}]+\}\}/g) || []));
console.log(`keys en=${Object.keys(en).length} te=${Object.keys(te).length}`);
console.log(`missing in te: ${missing.length}, extra in te: ${extra.length}, identical to English: ${untranslated.length}, no Telugu script: ${noTelugu.length}, {{var}} mismatch: ${placeholders.length}`);
if (args.has('--list')) {
  for (const [n, l] of [['MISSING', missing], ['IDENTICAL', untranslated], ['NO-TELUGU', noTelugu], ['VARS', placeholders]]) l.forEach((k) => console.log(`  ${n} ${k}: ${en[k] ?? ''}`));
}
fail(missing.length + untranslated.length + noTelugu.length + placeholders.length);

section('Telugu Unicode health');
const dictFiles = ['lib/individualDpr/formFieldTe.ts', 'lib/individualDpr/schemeFormTe.ts', 'lib/individualDpr/schemeStepTitlesTe.ts', 'lib/individualDpr/businessSkillsTe.ts', 'lib/individualDpr/apPlacesTe.ts', 'lib/i18n/teDictionary.ts'].map((f) => path.join(src, f));
for (const f of fs.readdirSync(path.join(src, 'lib/i18n/te'))) if (/Te\.ts$/.test(f)) dictFiles.push(path.join(src, 'lib/i18n/te', f));
const uniProblems = [];
const checkUnicode = (label, s) => {
  if (!TELUGU.test(s)) return;
  const why = [];
  if (s !== s.normalize('NFC')) why.push('not NFC');
  if (s.includes('�')) why.push('U+FFFD replacement char');
  if (/(^|[\s(])[ా-్ౕౖౢౣఁ-ః]/.test(s)) why.push('word starts with a dependent sign');
  if (/్్/.test(s)) why.push('double virama');
  if (/[​‎‏﻿]/.test(s)) why.push('invisible char');
  if (/[ా-ౌ][ా-ౌ]/.test(s)) why.push('two vowel signs in a row');
  if (/[ऀ-௿ಀ-෿]/.test(s)) why.push('non-Telugu Indic letter');
  if (why.length) uniProblems.push(`${label}: ${why.join(', ')} :: ${s.slice(0, 60)}`);
};
for (const [k, v] of Object.entries(te)) checkUnicode(`te.json ${k}`, v);
const dictEntries = new Map();
const keyText = (n) => (ts.isIdentifier(n) ? n.text : ts.isStringLiteralLike(n) ? n.text : null);
for (const file of dictFiles) {
  const sf = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const visit = (n) => {
    if (ts.isPropertyAssignment(n) && ts.isStringLiteralLike(n.initializer)) {
      const k = keyText(n.name);
      if (k != null) {
        dictEntries.set(k, n.initializer.text);
        checkUnicode(`${path.basename(file)} "${k.slice(0, 40)}"`, n.initializer.text);
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}
console.log(`checked ${Object.keys(te).length} JSON strings and ${dictEntries.size} dictionary strings`);
console.log(`Unicode problems: ${uniProblems.length}`);
uniProblems.slice(0, 40).forEach((p) => console.log('  ' + p));
fail(uniProblems.length);

section('Plain-language prompts have Telugu');
const plainMissing = [];
const plainFiles = [];
const promptsDir = path.join(src, 'lib/plainLanguage');
for (const f of ['glossary.ts', 'units.ts']) plainFiles.push(path.join(promptsDir, f));
plainFiles.push(path.join(src, 'data/fieldDescriptions.ts'));
plainFiles.push(path.join(src, 'lib/individualDpr/dataChecks.ts'));
plainFiles.push(path.join(src, 'lib/individualDpr/submissionAudit.ts'));
plainFiles.push(path.join(src, 'lib/finance/rules.ts'));
for (const f of fs.readdirSync(path.join(promptsDir, 'prompts'))) if (/\.ts$/.test(f)) plainFiles.push(path.join(promptsDir, 'prompts', f));
for (const file of plainFiles) {
  const sf = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const visit = (n) => {
    if (ts.isPropertyAssignment(n) && ts.isStringLiteralLike(n.initializer)) {
      const name = keyText(n.name);
      const inPromptEntry = ['ask', 'help', 'example', 'means', 'hint', 'message', 'label'].includes(name);
      const inDescriptions = n.parent && ts.isObjectLiteralExpression(n.parent) && n.parent.parent && ts.isPropertyAssignment(n.parent.parent) && file.endsWith('fieldDescriptions.ts');
      const inIntros = n.parent && ts.isObjectLiteralExpression(n.parent) && n.parent.parent && ts.isVariableDeclaration(n.parent.parent) && n.parent.parent.name.getText() === 'STEP_INTROS';
      if ((inPromptEntry || inIntros || inDescriptions) && !dictEntries.has(n.initializer.text)) {
        plainMissing.push(`${path.relative(src, file)} ${n.initializer.text.slice(0, 70)}`);
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}
console.log(`plain-language strings without a Telugu entry: ${plainMissing.length}`);
plainMissing.slice(0, args.has('--list') ? 9999 : 10).forEach((l) => console.log('  PLAIN ' + l));
fail(plainMissing.length);

section('UI literals in source');
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.tsx$/.test(e.name) && !/\.test\./.test(e.name) && e.name !== 'ClusterDPRView.tsx') files.push(p); // ClusterDPRView.tsx is unused, unfinished code
  }
})(src);
const ATTRS = new Set(['placeholder', 'title', 'aria-label', 'alt', 'label']);
const isWords = (s) => /[A-Za-z]{2,}/.test(s) && !KEEP.test(s.trim()) && !/^[a-z0-9_.:/#@-]+$/.test(s.trim()) && !(/\d/.test(s) && /^[A-Z0-9\-+().\s]+$/.test(s));
const literals = [];
const missingTf = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const rel = path.relative(src, file);
  const where = (n) => `${rel}:${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1}`;
  const visit = (n) => {
    if (ts.isJsxText(n)) {
      const s = n.text.replace(/\s+/g, ' ').trim();
      if (s && isWords(s)) literals.push(`${where(n)} text "${s.slice(0, 50)}"`);
    } else if (ts.isJsxAttribute(n) && ATTRS.has(n.name.text) && n.initializer && ts.isStringLiteral(n.initializer) && !(ts.isJsxOpeningLikeElement(n.parent.parent) && ['FieldPrompt', 'FieldHelp'].includes(n.parent.parent.tagName.getText()))) {
      const s = n.initializer.text;
      if (isWords(s)) literals.push(`${where(n)} ${n.name.text}="${s.slice(0, 50)}"`);
    } else if (ts.isJsxSelfClosingElement(n) && ['FieldPrompt', 'FieldHelp'].includes(n.tagName.getText())) {
      const attr = n.attributes.properties.find((a) => ts.isJsxAttribute(a) && a.name.text === 'label');
      const raw = attr && attr.initializer && ts.isStringLiteral(attr.initializer) ? attr.initializer.text.replace(/&quot;/g, '"') : '';
      if (raw && needsTe(raw) && !KEEP.test(raw) && !dictEntries.has(raw)) missingTf.push(`${where(n)} FieldPrompt("${raw.slice(0, 60)}")`);
    } else if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'tf' && n.arguments[0] && ts.isStringLiteralLike(n.arguments[0])) {
      const s = n.arguments[0].text;
      if (needsTe(s) && !KEEP.test(s) && !dictEntries.has(s)) missingTf.push(`${where(n)} tf("${s.slice(0, 60)}")`);
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}
console.log(`tf() strings without a Telugu entry: ${missingTf.length}`);
console.log(`hard-coded English text/placeholder/title/aria in JSX: ${literals.length}`);
if (args.has('--list')) { missingTf.forEach((l) => console.log('  TF ' + l)); literals.forEach((l) => console.log('  LIT ' + l)); }
else { missingTf.slice(0, 15).forEach((l) => console.log('  TF ' + l)); literals.slice(0, 15).forEach((l) => console.log('  LIT ' + l)); }
fail(missingTf.length + literals.length);

console.log(`\n${failures ? 'FAIL' : 'PASS'} (${failures} issue${failures === 1 ? '' : 's'})`);
if (args.has('--strict') && failures) process.exit(1);
