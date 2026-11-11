import { useEffect, useState, type MutableRefObject } from 'react';
import { AlertCircle, Check, Loader2, Save } from 'lucide-react';
import { useClusterFormText } from '@/lib/clusterDprFormText';

/**
 * One button for everything about saving:
 *  - changes waiting: orange, and its border fills round as the auto-save countdown runs out;
 *  - saving: orange with a spinner;
 *  - saved: green outline with a check mark;
 *  - could not save: red.
 * Pressing it saves at once.
 */
export function SaveDraftButton({
  label,
  savedLabel,
  dirty,
  saveStatus,
  dueAt,
  intervalMs,
  onClick,
  compact = false,
  disabled = false,
}: {
  label: string;
  savedLabel: string;
  /** Anything typed that the server does not have yet. */
  dirty: boolean;
  saveStatus: 'idle' | 'saving' | 'error';
  dueAt: MutableRefObject<number | null>;
  intervalMs: number;
  /** Saves now. Resolves to whether it worked. */
  onClick: () => Promise<boolean> | void;
  /** Toolbar size. */
  compact?: boolean;
  disabled?: boolean;
}) {
  const tf = useClusterFormText();
  const [progress, setProgress] = useState(0);
  // Pressing it always shows something: a short "saving" look while the save runs, and red for a few seconds when it did not work.
  const [pressed, setPressed] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!failed) return undefined;
    const timer = window.setTimeout(() => setFailed(false), 4000);
    return () => window.clearTimeout(timer);
  }, [failed]);
  const press = async () => {
    if (pressed) return;
    setPressed(true);
    setFailed(false);
    const started = Date.now();
    let ok: boolean | void = true;
    try {
      ok = await onClick();
    } catch {
      ok = false;
    }
    const rest = 450 - (Date.now() - started);
    if (rest > 0) await new Promise((resolve) => window.setTimeout(resolve, rest));
    setPressed(false);
    if (ok === false) setFailed(true);
  };
  const waiting = dirty && saveStatus === 'idle' && !pressed;
  useEffect(() => {
    if (!waiting) {
      setProgress(0);
      return undefined;
    }
    const tick = () => {
      const due = dueAt.current;
      setProgress(due ? Math.max(0, Math.min(1, 1 - (due - Date.now()) / intervalMs)) : 0);
    };
    tick();
    const timer = window.setInterval(tick, 100);
    return () => window.clearInterval(timer);
  }, [waiting, dueAt, intervalMs]);

  const state: 'error' | 'saving' | 'dirty' | 'saved' = pressed || saveStatus === 'saving' ? 'saving' : failed || saveStatus === 'error' ? 'error' : dirty ? 'dirty' : 'saved';
  const tone = {
    error: 'border-red-500 bg-red-50 text-red-700 hover:bg-red-100',
    saving: 'border-amber-300 bg-amber-50 text-amber-800',
    dirty: 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100',
    saved: 'border-success bg-transparent text-emerald-800 hover:bg-success/10 dark:text-emerald-300',
  }[state];
  const title = {
    error: tf('Could not save. Will retry.'),
    saving: tf('Saving…'),
    dirty: tf('Unsaved changes. Auto-saves every 30 seconds.'),
    saved: tf('Everything on screen is saved'),
  }[state];
  const text = state === 'saved' ? savedLabel : label;
  return (
    <button
      type="button"
      data-tour="save-draft"
      onClick={() => void press()}
      disabled={disabled}
      title={title}
      aria-label={`${text}. ${title}`}
      className={`relative inline-flex ${compact ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm'} shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border font-medium disabled:pointer-events-none disabled:opacity-50 transition-[background-color,border-color,color,box-shadow,transform] duration-300 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${tone}`}
    >
      {state === 'dirty' ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px rounded-[10px] p-[2px]"
          style={{
            background: `conic-gradient(from 0deg, #f59e0b ${progress * 360}deg, transparent 0)`,
            WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
            WebkitMaskComposite: 'xor',
            mask: 'linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)',
          }}
        />
      ) : null}
      {state === 'saving' ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : state === 'saved' ? (
        <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
      ) : state === 'error' ? (
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Save className="h-4 w-4" aria-hidden="true" />
      )}
      <span className="max-sm:hidden">{text}</span>
      {/* Said once when the state changes (unsaved, saving, saved, failed) for people using a screen reader. */}
      <span className="sr-only" role="status" aria-live="polite">{title}</span>
    </button>
  );
}
