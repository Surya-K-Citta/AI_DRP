import { AI_DISCLAIMER_TEXT, AI_FOOTER_MM } from '@/lib/aiDisclaimer';
import { formatPageNumber, pageCountForHeight, shiftForPageEdge } from '@/lib/individualDpr/documentStyle';

const BLOCKS = [
  '.dpr-style-header',
  '.individual-cover',
  '.individual-toc',
  '.individual-sec-title',
  '.individual-qa-block',
  '.individual-particulars',
  '.individual-doc-list',
  '.dpr-slot-figure',
  '.dpr-style-footer',
].join(',');

function scaleOf(sheet: HTMLElement): number {
  const layout = sheet.offsetHeight || sheet.offsetWidth;
  if (!layout) return 1;
  const visual = sheet.offsetHeight ? sheet.getBoundingClientRect().height : sheet.getBoundingClientRect().width;
  const scale = visual / layout;
  return scale > 0 ? scale : 1;
}

function layoutTop(el: HTMLElement, sheet: HTMLElement, scale: number): number {
  return (el.getBoundingClientRect().top - sheet.getBoundingClientRect().top) / scale;
}

function layoutHeight(el: HTMLElement, scale: number): number {
  return el.getBoundingClientRect().height / scale;
}

/** Keep headings and answer blocks off the page-break line, with space at the top of each page. */
export function fitSheetToPages(
  sheet: HTMLElement,
  pageHeightPx: number,
  edgeTopPx: number,
  edgeBottomPx: number
): void {
  if (!sheet || pageHeightPx <= 0) return;
  const root = sheet.querySelector('.individual-dpr-document') || sheet;
  const blocks = [...root.querySelectorAll<HTMLElement>(BLOCKS)];
  blocks.forEach((el) => {
    el.style.marginTop = '';
    el.removeAttribute('data-page-push');
  });
  if (!blocks.length) return;

  const scale = scaleOf(sheet);

  for (let pass = 0; pass < blocks.length + 1; pass += 1) {
    let moved = false;
    for (let i = 0; i < blocks.length; i += 1) {
      const el = blocks[i];
      const top = layoutTop(el, sheet, scale);
      const height = layoutHeight(el, scale);
      let shift = shiftForPageEdge(top, height, pageHeightPx, edgeTopPx, edgeBottomPx);

      if (el.classList.contains('individual-sec-title')) {
        const first = el.nextElementSibling?.firstElementChild as HTMLElement | null;
        if (first) {
          const firstTop = layoutTop(first, sheet, scale);
          const titlePage = Math.floor(Math.max(0, top) / pageHeightPx);
          const firstPage = Math.floor(Math.max(0, firstTop) / pageHeightPx);
          if (firstPage > titlePage) {
            const join = firstPage * pageHeightPx + edgeTopPx - top;
            if (join > shift) shift = join;
          } else {
            const pairBottom = first.getBoundingClientRect().bottom / scale - sheet.getBoundingClientRect().top / scale;
            const safeBottom = (titlePage + 1) * pageHeightPx - edgeBottomPx;
            const pairHeight = pairBottom - top;
            const room = pageHeightPx - edgeTopPx - edgeBottomPx;
            if (pairHeight > 0 && pairHeight <= room && pairBottom > safeBottom + 0.5) {
              const jump = (titlePage + 1) * pageHeightPx + edgeTopPx - top;
              if (jump > shift) shift = jump;
            }
          }
        }
      }

      if (shift > 0.5) {
        const current = parseFloat(el.style.marginTop) || 0;
        el.style.marginTop = `${current + shift}px`;
        el.setAttribute('data-page-push', '1');
        for (let j = i + 1; j < blocks.length; j += 1) {
          blocks[j].style.marginTop = '';
          blocks[j].removeAttribute('data-page-push');
        }
        moved = true;
        break;
      }
    }
    if (!moved) break;
  }
}

export function mmToLayoutPx(sheet: HTMLElement, mm: number): number {
  const probe = document.createElement('div');
  probe.style.cssText = `height:${mm}mm;position:absolute;visibility:hidden;pointer-events:none`;
  sheet.appendChild(probe);
  const px = probe.offsetHeight;
  sheet.removeChild(probe);
  return px;
}

/** Put 1, 2, 3… at the bottom of each sheet. Replaces the single footer that always said 1. */
export function stampSheetPageNumbers(sheet: HTMLElement, pageHeightPx: number, edgeBottomPx: number): void {
  const doc = sheet.querySelector<HTMLElement>('.individual-dpr-document');
  doc?.querySelectorAll('.dpr-page-number').forEach((node) => node.remove());
  if (!doc || !(pageHeightPx > 0)) return;
  const mode = doc.getAttribute('data-page-numbers') || '';
  if (mode !== 'plain' && mode !== 'of') return;

  const total = pageCountForHeight(sheet.offsetHeight, pageHeightPx);
  const pattern = doc.getAttribute('data-page-of-label') || 'Page {n} of {total}';
  const computed = getComputedStyle(doc);
  const color = computed.getPropertyValue('--dpr-header').trim();
  const font = computed.getPropertyValue('--dpr-body-font').trim();
  // Page numbers sit above the disclaimer block at the foot of the page.
  const band = Math.max(edgeBottomPx - mmToLayoutPx(sheet, AI_FOOTER_MM), 1);

  for (let i = 0; i < total; i += 1) {
    const el = document.createElement('div');
    el.className = 'dpr-page-number';
    el.textContent = formatPageNumber(mode, i + 1, total, pattern);
    if (i === 0) el.setAttribute('data-style-spot', 'page-number');
    el.style.top = `${(i + 1) * pageHeightPx - band - mmToLayoutPx(sheet, AI_FOOTER_MM)}px`;
    el.style.height = `${band}px`;
    el.style.paddingRight = computed.paddingRight;
    el.style.paddingLeft = computed.paddingLeft;
    if (color) el.style.color = color;
    if (font) el.style.fontFamily = font;
    doc.appendChild(el);
  }
}

/** A thin line and the AI disclaimer at the foot of every page. Not printed: downloads get the same footer from the server. */
export function stampSheetDisclaimers(sheet: HTMLElement, pageHeightPx: number): void {
  const doc = sheet.querySelector<HTMLElement>('.individual-dpr-document');
  doc?.querySelectorAll('.dpr-ai-footer').forEach((node) => node.remove());
  if (!doc || !(pageHeightPx > 0)) return;
  const total = pageCountForHeight(sheet.offsetHeight, pageHeightPx);
  const height = mmToLayoutPx(sheet, AI_FOOTER_MM);
  const computed = getComputedStyle(doc);
  for (let i = 0; i < total; i += 1) {
    const el = document.createElement('div');
    el.className = 'dpr-ai-footer';
    el.setAttribute('data-ai-footer', '1');
    el.style.top = `${(i + 1) * pageHeightPx - height}px`;
    el.style.height = `${height}px`;
    el.style.paddingLeft = computed.paddingLeft;
    el.style.paddingRight = computed.paddingRight;
    const body = document.createElement('span');
    body.textContent = AI_DISCLAIMER_TEXT;
    el.append(body);
    doc.appendChild(el);
  }
}
