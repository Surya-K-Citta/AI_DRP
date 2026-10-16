# UI motion

Short, eased animations used across the app. They are plain CSS in `client/src/index.css`, so there is nothing to import. All of them are switched off when the person’s system asks for reduced motion (`prefers-reduced-motion: reduce`).

| Where | What |
|-------|------|
| Every page (`Layout`) | `motion-page`: fades and rises in on load |
| `Card` | `motion-rise` entrance; a card whose `className` has `cursor-pointer` also gets `motion-lift` (lifts on hover, presses on click) |
| `Button` | Smooth colour / shadow change; presses down slightly while clicked |
| Card grids and lists (Dashboard, Projects, All DPRs, Analytics, Admin, Chat starters) | add `motion-stagger` to the container: its children rise in one after another (first 8 are staggered) |
| Pop-ups and slide-over panels | add `motion-overlay` to the fixed overlay: it fades in and its first child pops in |
| Inputs, selects, textareas, links | Border, shadow and colour changes ease instead of snapping |
| Scheme Finder | Its own extras: `vm-*` / `motion-slide-*` slide between questions, `motion-pop` check on chosen option, header shadow on scroll (see `venture-match-business-logic.md`) |

Rules of thumb: use `backwards` fill (not `both`) for entrance animations so hover transforms still work afterwards; keep durations under about 0.5 s; do not animate large tables or long forms row by row.
