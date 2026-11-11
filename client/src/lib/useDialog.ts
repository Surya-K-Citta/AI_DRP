import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Keeps a pop-up mounted for a moment after it is closed so it can fade out, and says when it is closing.
 * `render` is what to use for "draw the pop-up"; `closing` adds the exit animation class.
 */
export function useDialogPresence(open: boolean, exitMs = 160): { render: boolean; closing: boolean } {
  const [render, setRender] = useState(open);
  useEffect(() => {
    if (open) {
      setRender(true);
      return undefined;
    }
    const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setRender(false), reduced ? 0 : exitMs);
    return () => window.clearTimeout(timer);
  }, [open, exitMs]);
  return { render: open || render, closing: !open && render };
}

/**
 * While a pop-up is open: the page behind it stops scrolling, focus moves into the pop-up, and focus goes back to
 * whatever opened it when the pop-up closes.
 */
export function useDialogFocus(open: boolean, dialogRef: RefObject<HTMLElement | null>): void {
  const opener = useRef<HTMLElement | null>(null);
  const openNow = useRef(open);
  openNow.current = open;
  // True once the pop-up's component is really gone (so focus goes back), false while React merely re-runs the effect in development.
  const gone = useRef(false);
  useEffect(() => {
    gone.current = false;
    return () => {
      gone.current = true;
    };
  }, []);
  useEffect(() => {
    if (!open) return undefined;
    opener.current = document.activeElement as HTMLElement | null;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = window.requestAnimationFrame(() => {
      const node = dialogRef.current;
      if (node && !node.contains(document.activeElement)) {
        if (!node.hasAttribute('tabindex')) node.setAttribute('tabindex', '-1');
        node.focus({ preventScroll: true });
        // A wrapper that cannot hold focus itself (for example display: contents): go to the first control inside it.
        if (!node.contains(document.activeElement)) {
          node.querySelector<HTMLElement>('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')?.focus({ preventScroll: true });
        }
      }
    });
    // Tab and Shift+Tab stay inside the pop-up while it is open (it is modal), going round from the last control to the first and back.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const node = dialogRef.current;
      if (!node) return;
      const items = Array.from(
        node.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]')
      ).filter((item) => !item.hasAttribute('disabled') && item.getAttribute('aria-hidden') !== 'true' && item.getClientRects().length > 0);
      if (!items.length) {
        event.preventDefault();
        node.focus({ preventScroll: true });
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (!active || !node.contains(active) || active === node) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previous;
      const back = opener.current;
      // After the click that closed the pop-up has finished moving focus (a click outside would otherwise win).
      window.setTimeout(() => {
        // Only when the pop-up really closed (not when the effect was merely run again while it is still open).
        if ((!openNow.current || gone.current) && back && document.contains(back)) back.focus({ preventScroll: true });
      }, 0);
    };
  }, [open, dialogRef]);
}
