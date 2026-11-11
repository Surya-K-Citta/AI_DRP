# Responsive design

The app is built mobile-first with Tailwind breakpoints: `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536 px. Phones and tablets show the same content and actions as desktop; only the arrangement changes.

## Rules we follow

- **Navigation:** from `md` up, the icon rail on the left (hover or tap to expand). Below `md` the rail is hidden and the top-bar menu lists the same places (Dashboard, All DPRs, Projects, Chat, admin pages) plus profile, privacy, language, log out and, on the Create DPR pages, Dev mode. The top bar shortens on small screens (app name appears from 480 px, language label from 640 px; the language button keeps its accessible name).
- **Rows of buttons wrap** (`flex-wrap`) instead of running off the screen; page headers stack (`flex-col` below `sm`/`lg`).
- **Wide tables and tab bars scroll sideways** inside their own box (Admin tabs, financial tables), never the whole page.
- **Sticky headers** on Create DPR only stick from `sm` up, because on a phone they would cover most of the screen. Scheme Finder keeps its sticky header (back, title, progress).
- **Scheme Finder floating controls:** Previous / Next sit beside the question on `lg`+; on smaller screens Previous, the help button (icon only) and Next sit along the bottom. The help button shows its label from `sm` up.
- **Report editor (Customise):** three panes on `lg`+. Below that, the live document fills the screen and *Fill & edit*, *Sections* and *Style* open as a drawer. The step strip and the Undo / Redo / Reset / Close / Save buttons stack into two rows on narrow screens.
- **Long text** (IDs, addresses, names) uses `break-all` / `truncate` / `min-w-0` where it could force width.
- The DPR document itself keeps its page size on every screen; it is zoomed to fit (Fit page), not reflowed, so what you see is what prints.

## Checking

`npm run audit:responsive` (see `client/scripts/responsive-audit.mjs`) opens 19 screens at 320, 375, 414, 768, 1024, 1280 and 1440 px, reports any element past the screen edge, and can save screenshots. Run it after layout changes; it should report `bad 0`. It does not judge looks, so also check the screenshots for cramped or cut-off content.
