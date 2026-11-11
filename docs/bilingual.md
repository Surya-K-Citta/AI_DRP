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

Language names ("English" next to "తెలుగు"), acronyms and scheme codes (PMEGP, GSTIN, DSCR), file formats, units such as kWh, format-only placeholders (UDYAM-XX-00-0000000), the `DELETE` confirmation word, server and AI generated content, and `DPRPreview` which switches the UI to the language the DPR was generated in.

## The person's own typed answers in Telugu

In Telugu, the read-only live report (Basic mode) also shows what the person typed (names, descriptions, addresses) in Telugu.

- `client/src/lib/i18n/userTextTe.ts` picks the text worth translating (real words only: not numbers, codes, links, contact details, identifiers, files or scheme settings) and swaps in translations on a copy. The stored answers stay English; the report logic and exports read the English.
- `useUserTextTe` (`lib/i18n/useUserTextTe.ts`) asks `POST /api/ai/translate-texts` (up to 60 texts of 2000 characters per call, behind the AI consent gate, scrubbed by the AI gateway) in batches and remembers results for the session. Texts that already have a Telugu entry in the dictionaries are not sent.
- Needs AI help to be on. With it off the text stays as typed and the report says why.
- Advanced mode (typing inside the report) always shows what was typed.

## Exports are English only

PDF and DOCX downloads are always English (the Excel download was removed). On the DPR preview page, if the document is showing in Telugu, a download first switches it to English (the PDF is printed from the on-screen document) and then exports. The download requests send `english`, and the server ignores any other `language` value on the download endpoints (`dpr.controller.ts`).

## DOCX and PDF come from the same report

Both files are made from the HTML of the on-screen report (`IndividualDPRDocumentView`), so content, labels, the fields shown, section order and hidden sections cannot differ between them.

- **PDF:** `POST /api/dpr/:id/download/pdf/html` prints the HTML (`generatePDFFromHTML`). A whole-page inset (16 mm for Latest DPR) is written into the page's own `@page` CSS after every other style, because the captured page carries `@page { margin: 0 }` and Chrome lets that override the margin given to the PDF engine.
- **DOCX:** built **in the browser** from the live on-screen report (`client/src/lib/domToDocx.ts`, using the `docx` package, loaded only when Word is chosen). It does not guess the look from class names: every font, size, weight, colour, letter spacing, alignment, line height, spacing, border, fill and column width is read from the page (`getComputedStyle` and measured boxes), so the Word file follows whichever template is in use (PMEGP teal, AP-CMEP indigo, plain). Text becomes runs, text blocks become paragraphs, tables keep their measured column widths, bordered or filled boxes become one-cell tables, rows of items (contents lines) become paragraphs with tab stops, and pictures are embedded at their drawn size. A4, 16 mm margins (as the PDF), a footer with the AI notice and "Page X of Y". The view page and the Generate dialog never fall back to the older server-built Word layout. Not reproduced (Word has no equivalent): gradients (the first colour is used), the template's page header, watermark and decorative bands. The server has a simpler class-based converter for API use (`POST /api/dpr/:id/download/docx/html`, `server/src/services/htmlToDocx.ts`).
- **Fallback:** `generateIndividualDprDocx` (`individualDprDocument.ts`) builds a Word file from the saved data, mirroring `renderIndividualDprHtml`, for `GET /download/docx` and when the HTML cannot be used.
- **Generate DPR:** opens a chooser (`GenerateFormatDialog`): PDF or Word. The DPR is saved and generated once for the same answers, the report is drawn off screen in English (`lib/exportGeneratedDpr.tsx`), and the chosen file is made and downloaded. The person stays on the form. The browser may block an automatic download that starts seconds after the click, so the dialog then shows a ready panel with a real **Download** link (a click on it is always allowed). Cancel works at any time and stops the work.
- Tests: `server/src/htmlToDocx.test.ts`, `server/src/individualDocx.test.ts`.
