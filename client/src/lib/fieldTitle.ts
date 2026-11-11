// @ts-nocheck
function cleanLabelText(raw: string): string {
  return raw
    .replace(/\s*\*\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Pick the visible field title near a control (sibling / parent label). */
export function findNearbyFieldTitle(el: HTMLElement | null): string {
  if (!el) return '';
  const aria = el.getAttribute('aria-label');
  if (aria?.trim()) return cleanLabelText(aria);

  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const node = document.getElementById(labelledBy);
    if (node?.textContent) return cleanLabelText(node.textContent);
  }

  const wrap = el.closest('div');
  const container = wrap?.parentElement || wrap;
  const labelInContainer = container?.querySelector('label');
  if (labelInContainer?.textContent) return cleanLabelText(labelInContainer.textContent);

  let sibling = wrap?.previousElementSibling as HTMLElement | null;
  while (sibling) {
    if (sibling.tagName === 'LABEL' || sibling.classList.contains('font-medium') || sibling.classList.contains('font-semibold')) {
      if (sibling.textContent) return cleanLabelText(sibling.textContent);
    }
    const nested = sibling.querySelector?.('label');
    if (nested?.textContent) return cleanLabelText(nested.textContent);
    sibling = sibling.previousElementSibling as HTMLElement | null;
  }
  return '';
}
