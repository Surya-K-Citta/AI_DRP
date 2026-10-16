import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface ConfirmOptions {
  title?: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

type ConfirmFn = (options?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/** Ask before deleting: `if (!(await confirm({ body: 'Delete “X”?' }))) return;` */
export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return confirm;
}

const DELETE_ICON = 'svg[class*="lucide-trash"]';

/**
 * One confirmation dialog for the whole app.
 *
 * Besides `useConfirm()`, it watches for clicks on delete buttons (any button holding a trash icon, or marked
 * `data-confirm-delete`) and asks first; only a "yes" lets the click through. A button can set
 * `data-confirm-title`, `data-confirm-body` and `data-confirm-label` to word the question, or
 * `data-no-auto-confirm` when it already asks in its own way (typed confirmation, its own dialog).
 */
export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);
  const allowed = useRef<Element | null>(null);

  const confirm = useCallback<ConfirmFn>((next = {}) => {
    resolver.current?.(false);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setOptions(next);
    });
  }, []);

  const settle = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOptions(null);
  };

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const button = target?.closest?.('button, [role="button"]') as HTMLElement | null;
      if (!button) return;
      if (allowed.current === button) {
        allowed.current = null;
        return;
      }
      if (button.hasAttribute('data-no-auto-confirm') || (button as HTMLButtonElement).disabled) return;
      const isDelete = button.hasAttribute('data-confirm-delete') || !!button.querySelector(DELETE_ICON);
      if (!isDelete) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      void confirm({
        title: button.getAttribute('data-confirm-title') || undefined,
        body: button.getAttribute('data-confirm-body') || undefined,
        confirmLabel: button.getAttribute('data-confirm-label') || undefined,
      }).then((ok) => {
        if (!ok || !button.isConnected) return;
        allowed.current = button;
        button.click();
      });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [confirm]);

  useEffect(() => {
    if (!options) return;
    document.getElementById('confirm-cancel')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') settle(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [options]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <div
          className="motion-overlay fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          onClick={() => settle(false)}
        >
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-700" />
              </span>
              <div className="min-w-0">
                <h3 id="confirm-title" className="text-lg font-semibold">
                  {options.title || t('confirmDelete.title', { defaultValue: 'Delete this item?' })}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {options.body ||
                    t('confirmDelete.body', { defaultValue: 'It will be removed. This cannot be undone.' })}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button id="confirm-cancel" variant="outline" onClick={() => settle(false)}>
                {options.cancelLabel || t('confirmDelete.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button variant="destructive" onClick={() => settle(true)}>
                {options.confirmLabel || t('confirmDelete.confirm', { defaultValue: 'Delete' })}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
