# Light and dark mode

A **Light / Dark** switch (sun and moon icons) sits in the top bar of the app and the home page header, and floats at the top right of the sign-in and register pages. All screens follow the choice, including the home, login and register pages. The default is **light**; the choice is remembered in the browser. There is no “follow the device” option.

## What stays light

The DPR document is never themed, so what people review is what the bank gets:

- the live DPR in the editor, the read-only **Preview**, the DPR view page, and the plain preview in Create DPR;
- the PDF / DOCX export and printing.

How: `.dpr-document` and `.theme-light` (also put on `PageSheet`) re-declare the light colour tokens and `color-scheme: light`, and the dark remaps in `client/src/index.css` explicitly exclude them. The PDF is built from the document’s HTML plus the stylesheets; it is rendered without the `dark` class, so it is light regardless of the theme chosen.

## How it works

- `store/themeStore.ts` keeps the mode (`light` by default; an old saved `system` value counts as light); `ThemeApplier` (mounted in `App.tsx`) puts or removes the `dark` class on `<html>`. A small script in `index.html` applies it before first paint to avoid a white flash.
- Colours come from the CSS tokens in `index.css` (`:root` for light, `.dark` for dark; teal palette). Components that use tokens (`bg-background`, `bg-card`, `text-muted-foreground`, `border-border`, …) follow automatically.
- Some screens use fixed Tailwind colours (`bg-white`, `text-gray-500`, tinted `bg-amber-50` / `text-red-700` panels, a few brand hex colours). A block at the end of `index.css` remaps those under `html.dark`.

## Switch animation

Switching theme plays a ripple: the new theme spreads from the clicked icon as a growing circle (0.9 s, ease-in-out), with three thin rings riding just ahead of its edge and fading out near the corners. It uses the View Transitions API (`document.startViewTransition`), so the old page stays underneath while the new one is revealed; the circle’s edge is a soft, translucent band: the new page is revealed through a feathered radial mask (`mask-image` with an animated `--ripple-r`, registered with `@property`) so old and new themes blend across about 120–260 px instead of cutting along a hard line (browsers without `@property` get a hard `clip-path` circle). The rings are faint stroked circles inside that band in one SVG layer (captured separately so it stays on top) driven by the same easing curve and clock. Browsers without the API (for example current Firefox) get a short colour cross-fade plus the rings. With reduced motion on, the theme changes instantly. Code: `client/src/lib/themeTransition.ts`, called from `ThemeToggle`; styles at the end of `index.css`.

Performance notes (why it is built this way): no blur or box-shadow on the rings (large blurred layers repaint every frame); the dark remaps use plain class selectors reading CSS variables, because the earlier `:not(… *)` guards made the style recalculation at the start of the switch slow; the first frame is the heaviest part, so keep selectors in `index.css` simple.

## Adding UI

Prefer tokens (`bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-muted`) over fixed colours. If a new screen must stay light (a document, a QR, a print sheet), give it the class `theme-light`.

## Known limits

Charts (Recharts) and any inline `style={{ color: '#…' }}` keep their colours; check them in dark mode as screens are touched. Telugu and English use the same palette.
