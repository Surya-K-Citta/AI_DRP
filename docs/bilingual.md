# Bilingual UI (English / Telugu)

Two mechanisms, both switched by the language toggle (`i18n.language`, saved in `localStorage.i18nextLng`).

1. `t('key')` from react-i18next with `client/src/i18n/locales/en.json` and `te.json`. Both files must have the same keys and the same `{{variables}}`.
2. `tf('English text')` from `useClusterFormText()` (`client/src/lib/clusterDprFormText.ts`). The English sentence is the key. Telugu lives in dictionaries:
   - `lib/individualDpr/*Te.ts` (form fields, scheme steps, skills, places)
   - `lib/i18n/te/*Te.ts` (everything added for full coverage; picked up automatically by `lib/i18n/te/index.ts`, filename must end in `Te.ts`)
   - Scheme step titles also work without the "Step N:" prefix, and Scheme Finder names from `te.json` are reused for the same English name.
   - `tf` has no interpolation. Use a token: `tf('Step {n} of {total}').replace('{n}', n)`; keep the token in both languages.
   - Keep one wording per English string. If two dictionaries disagree, run `node` conflict check (see below) and keep the older one.

## Checks

- `npm run audit:i18n` (`scripts/i18n-audit.mjs`, add `--list` for details): locale key parity, English-only values, `{{var}}` mismatches, Telugu Unicode health (NFC, no U+FFFD, no dependent sign at word start, no double virama, no invisible characters, no other Indic scripts), `tf()` strings with no Telugu entry, and hard-coded English in JSX text, `placeholder`, `title`, `aria-label`, `alt`, `label`.
- Dev-only runtime aid: in `npm run dev`, with the app in Telugu, open the browser console and read `window.__tfMissing`. It lists every English string passed to `tf()` that had no Telugu entry on the screens you visited. This catches strings the static audit cannot see (labels built from data, helper functions).

## Intentionally English

Language names ("English" next to "తెలుగు"), acronyms and scheme codes (PMEGP, GSTIN, DSCR), file formats, units such as kWh, format-only placeholders (UDYAM-XX-00-0000000), the `DELETE` confirmation word, text typed by the user, server and AI generated content, and `DPRPreview` which switches the UI to the language the DPR was generated in.

## Exports are English only

PDF, DOCX and XLS downloads are always English. On the DPR preview page, if the document is showing in Telugu, a download first switches it to English (the PDF is printed from the on-screen document) and then exports. The download requests send `english`, and the server ignores any other `language` value on the download endpoints (`dpr.controller.ts`).
