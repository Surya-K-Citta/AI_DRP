import React from 'react';

/** Leaf-path diff for step* / schemeExtras payloads. */
export function diffPayloadFieldPaths(
  prev: Record<string, any> | null | undefined,
  next: Record<string, any> | null | undefined
): string[] {
  const paths: string[] = [];
  const walk = (a: any, b: any, prefix: string) => {
    if (Object.is(a, b)) return;
    const aObj = a !== null && typeof a === 'object' && !Array.isArray(a);
    const bObj = b !== null && typeof b === 'object' && !Array.isArray(b);
    if (aObj || bObj) {
      const keys = new Set([
        ...Object.keys(aObj ? a : {}),
        ...Object.keys(bObj ? b : {}),
      ]);
      keys.forEach((k) => walk(aObj ? a[k] : undefined, bObj ? b[k] : undefined, prefix ? `${prefix}.${k}` : k));
      return;
    }
    if (Array.isArray(a) || Array.isArray(b)) {
      if (JSON.stringify(a ?? null) !== JSON.stringify(b ?? null)) {
        if (prefix) paths.push(prefix);
      }
      return;
    }
    if (prefix) paths.push(prefix);
  };

  if (!next) return paths;
  const roots = [
    ...Array.from({ length: 18 }, (_, i) => `step${i + 1}`),
    'schemeExtras',
  ];
  roots.forEach((root) => {
    walk(prev?.[root], next[root], root);
  });
  return Array.from(new Set(paths));
}

function expandFieldPaths(paths: string[]): string[] {
  const out = new Set<string>();
  paths.forEach((p) => {
    if (!p) return;
    const parts = p.split('.');
    for (let i = 2; i <= parts.length; i++) {
      out.add(parts.slice(0, i).join('.'));
    }
  });
  return Array.from(out);
}

export function collectFieldHits(
  root: ParentNode | null | undefined,
  paths: string[]
): HTMLElement[] {
  if (!root || paths.length === 0) return [];
  const expanded = expandFieldPaths(paths);
  const seen = new Set<HTMLElement>();
  const hits: HTMLElement[] = [];
  expanded.forEach((path) => {
    const safe =
      typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
        ? CSS.escape(path)
        : path.replace(/"/g, '\\"');
    root.querySelectorAll(`[data-dpr-field="${safe}"]`).forEach((el) => {
      const node = el as HTMLElement;
      if (!seen.has(node)) {
        seen.add(node);
        hits.push(node);
      }
    });
  });
  hits.sort((a, b) => {
    if (a === b) return 0;
    const pos = a.compareDocumentPosition(b);
    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });
  return hits;
}

/**
 * Scroll a hit into view inside the live-preview scroller.
 * Prefer scrollIntoView — works correctly when preview uses CSS `zoom`
 * (layout size matches visual size). Falls back to rect math if needed.
 */
export function scrollHitIntoPreview(
  scrollParent: HTMLElement,
  target: HTMLElement,
  _scale = 1
): void {
  // Keep horizontal position stable; only bring the hit into the vertical viewport.
  const parentRect = scrollParent.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const deltaTop =
    targetRect.top -
    parentRect.top -
    scrollParent.clientHeight / 2 +
    targetRect.height / 2;

  scrollParent.scrollTo({
    top: Math.max(0, scrollParent.scrollTop + deltaTop),
    // Do not change scrollLeft — avoids the left/right jump on each keystroke
    behavior: 'smooth',
  });
}

export function highlightHit(el: HTMLElement | null, className = 'dpr-field-hit-active'): void {
  document.querySelectorAll(`.${className}`).forEach((node) => node.classList.remove(className));
  if (el) el.classList.add(className);
}

export function fieldHitNode(
  track: boolean,
  path: string,
  children: React.ReactNode
): React.ReactNode {
  if (!track) return children;
  return React.createElement(
    'span',
    { 'data-dpr-field': path, className: 'dpr-field-hit' },
    children
  );
}
