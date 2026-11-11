# UI motion

Short, eased animations used across the app. They are plain CSS in `client/src/index.css`, so there is nothing to import. All of them are switched off when the person’s system asks for reduced motion (`prefers-reduced-motion: reduce`).

| Where | What |
|-------|------|
| Every page (`Layout`) | `motion-page`: fades and rises in on load |
| `Card` | `motion-rise` entrance; a card whose `className` has `cursor-pointer` also gets `motion-lift` (lifts on hover, presses on click) |
| `Button` | Smooth colour / shadow change; its contents press down slightly while clicked (the button itself never shrinks) |
| Card grids and lists (Dashboard, Projects, All DPRs, Analytics, Admin, Chat starters) | add `motion-stagger` to the container: its children rise in one after another (first 8 are staggered) |
| Pop-ups and slide-over panels | add `motion-overlay` to the fixed overlay: it fades in and its first child pops in |
| Inputs, selects, textareas, links | Border, shadow and colour changes ease instead of snapping |
| Create DPR steps | The step content slides in from the side you moved towards (`motion-step-forward` / `motion-step-back`, 0.26 s). The step strip scrolls the current step into view |
| Style panel groups | Open and close by height (`motion-collapse`, set `data-open`); the content is built the first time and then kept, so reopening is instant. Closed groups are `inert` |
| Pop-ups with an exit | `useDialogPresence` keeps the pop-up mounted for 0.16 s so `motion-overlay.is-closing` can fade it out; `useDialogFocus` stops the page scrolling behind it, moves focus into it and returns focus to the opener (`client/src/lib/useDialog.ts`) |
| Loading placeholders | `motion-skeleton` shimmer, then `motion-fade-in` (template thumbnails are drawn one after another) |
| Back buttons | `BackButton` (`components/ui/BackButton.tsx`) is icon-only. The name ("Back to Dashboard") is the accessible label and shows as a `Tooltip` (`components/ui/Tooltip.tsx`) on hover after 0.3 s and at once on keyboard focus; no tooltip on touch screens. Wizard Previous/Next buttons keep their words |
| Tabs | A tab panel carries `motion-tab` and a `key` that changes with the tab, so it fades and rises in; tab buttons ease their colour and underline (`[role=tab]` also gets this globally) |
| Screen changes | `ScrollToTop` (in `lib/navHistory.tsx`) opens a new screen at its top and leaves Back/Forward scroll alone; the loading spinner (`PageLoading`) waits 200 ms so quick loads show nothing |
| Every button | The contents of the button (icon, text spans) press down slightly while clicked, and colour/shadow ease (`:where` rules in `index.css`, so any component's own transform wins). The button's own box never changes while pressed: shrinking it pulled its edges in, so an arrow or icon at the edge of a wide button fell outside it and the click was lost; taps respond at once on phones (`touch-action: manipulation`); the page keeps a stable scrollbar gutter so locking scroll behind a pop-up does not shift the layout; scrolling is smooth unless reduced motion is requested |
| Form mode / Document mode | The form column (Create DPR page) or the side pane (editor) slides to zero width and fades over 0.3 s when Document mode is chosen, and back again for Form mode; the report grows or shrinks with it. The hidden side is `inert`. |
| Editor toolbar buttons (Form or Document, Sections, Style) | Same three buttons in both modes. They open, switch and (pressed again) fold away the side pane beside the report, which slides open and closed (0.3 s) while the report moves right and narrows. Below 1024 px the pane is a slide-over (`motion-panel`) that minimises on an outside click or Esc. |
| Scheme Finder | Its own extras: `vm-*` / `motion-slide-*` slide between questions, `motion-pop` check on chosen option, header shadow on scroll (see `venture-match-business-logic.md`) |

Rules of thumb: use `backwards` fill (not `both`) for entrance animations so hover transforms still work afterwards; keep durations under about 0.5 s; do not animate large tables or long forms row by row.
