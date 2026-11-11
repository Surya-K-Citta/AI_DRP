# Style this report

## Problem

A Latest DPR had one look. PMEGP and AP CMEP wore their own skins. Every other scheme used the same plain page. A consultant could not change page size, type, colors, header, or the order of sections on **their** report. The fill form and the printed report were the same sequence, so moving a section would have moved the questions too.

The downloaded PDF has to be the document on screen. A style that lives only in the editor, or a section order that the PDF ignores, would bring back the mismatch between the live DPR and the file.

## What you get

From a DPR, choose **Edit this DPR**; the style controls are in the Style tab of the editing page. The live document stays in the middle.

The report opens in the scheme’s look. PMEGP and AP CMEP start from their presets. Every other scheme starts from the Government preset. If a super admin has saved a scheme default, the next DPR for that scheme starts from that look instead.

Changes apply to this DPR only. **Save on this DPR** stores the style, the section order, hidden sections, and pictures in that DPR. The downloaded PDF is the same document, including page size. A styled report uses its own margins, so the PDF does not add a second margin on top.

A super admin can also choose **Save as the scheme default**. That does not rewrite DPRs that already have their own look. It is the starting point for the next one.

The form you fill stays in the scheme’s step order. Only the report and the PDF follow the new order.

## The page

On a wide screen the live DPR sits on the left. The right pane has three tabs along its top, **Form**, **Sections**, and **Style**, and shows the fill form, the section list, or the style controls. Undo and redo are arrow icons at the top. On a narrow screen, Sections and Style are buttons. They open over the document and close when you tap the page.

The **Preview** button opens the final document full screen and read-only, with only the answered content and the chosen style, the way it will print. Close it to go back to editing.

Zoom changes the document only. The page edge is the sheet. A line marks each page break.

English and Telugu are a switch on the preview. The same style applies to both. Undo and redo sit at the top. **Reset** returns this DPR to the scheme’s starting look and section order.

## Style

Ten templates, each shown as a small picture of its first page (drawn by the real report renderer, with sample text): Gazette, Ledger, Ribbon, Docket, Manuscript, Quiet, plus the newer Corporate, Heritage, Fresh and Compact. Corporate, Heritage, Fresh and Compact reuse an existing outline (`PRESET_LAYOUT`) with their own type, colors and spacing. Compact uses smaller type and tighter margins to save pages. Clicking a picture opens the full preview in a popup (close with X, Esc or a click outside); **Use this theme** applies it and keeps the section order, pictures and footer text.

Every group has a **Reset to template** link that puts only that group back to what the chosen template ships with (logo, agency name and pictures are kept), and the panel has **Expand all / Collapse all**.

Page size is A4, A3, Letter, or Legal. Margins have three quick choices (Narrow 12, Normal 16, Wide 22 mm) as well as the four fields. The write-up stays portrait. **Landscape for wide money tables** gives those sheets their own landscape page in the PDF. Margins are four fields, in millimetres, kept between 10 and 40 so text cannot run off the page.

Type is five roles, not a font on every paragraph: Cover, Section title, Body, Table, Caption. Each has font, size, and weight. The fonts are Times New Roman, Arial, Calibri, Helvetica, and Noto Sans Telugu. Alignment, line spacing, and space between paragraphs are set once for the whole report. **Text size** (A− / A+) moves all five roles by half a point, and **Spacing** has Tight, Normal and Relaxed.

Colors are Primary, Header, Table header, and Borders; nine **color sets** (Navy, Blue, Teal, Forest, Indigo, Purple, Maroon, Amber, Charcoal) set all four at once. If a pair would hide the text, that control turns red and the color is not applied.

The header can place a logo on the left, center, or right, show the agency name, and draw a thin line. Page numbers read as `3` or `Page 3 of 12`. The watermark has text, how faint it is, and an angle. It starts as “Confidential — for lending appraisal”.

Tables: striped rows, **row height** (Compact, Normal, Roomy) and **table lines** (Template, Grid, Rows, None).

**Layout** has three switches: show the table of contents, number the section headings, and start each section on a new page (the contents and every section start at the top of a page in the live view and the PDF). The header group also has **Footer text**, a short line on the left of every page's number (up to 80 characters). If a wide money table still sticks out of the page, the table control says so.

Pictures go in named spots only: the cover, after a section, or the annexure. Add, replace, or remove. The picture sits in the flow of the page.

## Sections

The section list is the print order. Drag a row by its handle. The live DPR moves that heading and all of its answers together. The row you are dragging is highlighted in the list and on the page. Numbers update after you drop it.

The eye hides a section from the report and keeps its answers. The row stays in the list, dimmed, so you can show it again. **Original order** puts the sections back to the scheme’s sequence. The order is saved on this DPR.

## Before you leave

Save checks margins, contrast, the Telugu font, and whether a wide table still fits. A problem is named on the control that caused it. A color that fails contrast is not stored. Telugu on a Latin body font, and a wide table without the landscape switch, are named in red so you can fix them before you save.

Anything you did not set stays on the preset, so a half-finished style still prints.
