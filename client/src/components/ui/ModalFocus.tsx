import { useEffect, useRef, type ReactNode } from 'react';
import { useDialogFocus } from '@/lib/useDialog';

/**
 * Wrap a pop-up that is only mounted while it is open: focus moves into it, Tab stays inside, Esc closes it (when `onEscape` is given)
 * and focus goes back to the button that opened it. It adds no box of its own.
 */
export function ModalFocus({ children, onEscape }: { children: ReactNode; onEscape?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogFocus(true, ref);
  const escape = useRef(onEscape);
  escape.current = onEscape;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') escape.current?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div ref={ref} style={{ display: 'contents' }}>
      {children}
    </div>
  );
}
