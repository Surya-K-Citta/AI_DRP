import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * A large window over the page for the comparison and the suggested plan. Escape or the close button closes it, the page behind
 * does not scroll, focus moves in and goes back to the button that opened it.
 */
export const ExpandedOverlay: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  children: React.ReactNode;
}> = ({ open, onClose, title, closeLabel, children }) => {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    panel.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = previous;
      opener?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  // Drawn on the page itself (not inside the results block). It covers only the content area: the header and the side menu stay clear and
  // unblurred above it, and the window keeps a margin from both.
  return createPortal(
    <div className="motion-overlay fixed inset-x-0 bottom-0 top-16 z-40 flex items-center justify-center bg-background/30 p-4 backdrop-blur-md sm:p-8 md:pl-24" onClick={onClose}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="relative max-h-full w-full max-w-6xl overflow-y-auto rounded-2xl border border-border bg-background p-4 shadow-[0_30px_90px_-12px_rgba(15,23,42,0.5)] outline-none sm:px-8 sm:py-6"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="sticky top-0 z-20 float-right -mr-1 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
};
