import React, { useEffect, useRef } from 'react';
import { useDialogFocus } from '@/lib/useDialog';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { dismissalKey, KIND_ORDER, type CheckKind, type Finding } from '@/lib/individualDpr/dataChecks';

const KIND_STYLE: Record<CheckKind, { label: string; badge: string }> = {
  blocking: { label: 'Must fix first', badge: 'bg-red-600 text-white' },
  missing: { label: 'Missing', badge: 'bg-red-100 text-red-800' },
  mismatch: { label: 'Does not add up', badge: 'bg-orange-100 text-orange-900' },
  unclear: { label: 'Unclear', badge: 'bg-amber-100 text-amber-900' },
  unusual: { label: 'Unusual', badge: 'bg-sky-100 text-sky-900' },
};

function useFindingText() {
  const tf = useClusterFormText();
  const fill = (template: string, vars?: Record<string, string>) =>
    Object.entries(vars || {}).reduce((text, [key, value]) => text.split(`{${key}}`).join(tf(value)), tf(template));
  return { tf, message: (f: Finding) => fill(f.message, f.vars), hint: (f: Finding) => (f.hint ? fill(f.hint, f.vars) : '') };
}

const FindingRow: React.FC<{ finding: Finding; onDismiss: (f: Finding) => void; onGo?: (f: Finding) => void }> = ({ finding, onDismiss, onGo }) => {
  const { tf, message, hint } = useFindingText();
  const style = KIND_STYLE[finding.kind];
  return (
    <li className="flex flex-col gap-2 rounded-md border border-border bg-background p-3 sm:flex-row sm:items-start sm:justify-between" data-check={finding.id}>
      <div className="min-w-0">
        <span className={`mr-2 inline-block rounded px-2 py-0.5 text-xs font-semibold ${style.badge}`}>{tf(style.label)}</span>
        <span className="text-sm">{message(finding)}</span>
        {finding.hint ? <p className="mt-1 text-xs text-muted-foreground">{hint(finding)}</p> : null}
      </div>
      <div className="flex shrink-0 gap-2">
        {onGo ? (
          <Button variant="outline" size="sm" onClick={() => onGo(finding)}>
            {tf('Go to answer')}
          </Button>
        ) : null}
        {finding.blocking ? null : (
          <Button variant="ghost" size="sm" onClick={() => onDismiss(finding)} title={tf('Hide this note. It comes back if you change the answer.')}>
            {tf('This is correct')}
          </Button>
        )}
      </div>
    </li>
  );
};

/** Notes about the step on screen. Quiet until the step has some answers. */
export const StepChecks: React.FC<{ findings: Finding[]; onDismiss: (f: Finding) => void }> = ({ findings, onDismiss }) => {
  const tf = useClusterFormText();
  if (!findings.length) return null;
  return (
    <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50/60 p-3 dark:bg-amber-950/20" role="status" data-step-checks>
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
        <AlertTriangle className="h-4 w-4" aria-hidden />
        {tf('Please check these answers')} ({findings.length})
      </p>
      <ul className="space-y-2">
        {findings.map((f) => (
          <FindingRow key={f.id} finding={f} onDismiss={onDismiss} />
        ))}
      </ul>
    </div>
  );
};

/** Everything that looks wrong across the whole form, opened from the header and before generating. */
export const ReviewDialog: React.FC<{
  findings: Finding[];
  stepTitle: (step: number) => string;
  onClose: () => void;
  onGo: (f: Finding) => void;
  onDismiss: (f: Finding) => void;
  onGenerate?: () => void;
}> = ({ findings, stepTitle, onClose, onGo, onDismiss, onGenerate }) => {
  const tf = useClusterFormText();
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogFocus(true, panelRef);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const groups = KIND_ORDER.map((kind) => ({ kind, items: findings.filter((f) => f.kind === kind) })).filter((g) => g.items.length);
  return (
    <div className="motion-overlay fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="review-title">
      <div ref={panelRef} className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-background shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b p-4">
          <div>
            <h2 id="review-title" className="text-lg font-semibold">{tf('Check my answers')}</h2>
            <p className="text-sm text-muted-foreground">
              {findings.some((f) => f.blocking)
                ? tf('Items marked "Must fix first" stop the DPR from being generated. The rest are suggestions.')
                : findings.length
                  ? tf('These are only suggestions. Fix what is wrong, or mark an answer as correct.')
                  : tf('Nothing looks missing or unusual.')}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label={tf('Close')}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-4 overflow-y-auto p-4">
          {!findings.length ? (
            <p className="flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-5 w-5" aria-hidden />
              {tf('All clear')}
            </p>
          ) : null}
          {groups.map((group) => (
            <section key={group.kind}>
              <h3 className="mb-2 text-sm font-semibold">{tf(KIND_STYLE[group.kind].label)}</h3>
              <ul className="space-y-2">
                {group.items.map((f) => (
                  <li key={dismissalKey(f)} className="list-none">
                    <p className="mb-1 text-xs text-muted-foreground">{tf(stepTitle(f.step))}</p>
                    <ul>
                      <FindingRow finding={f} onDismiss={onDismiss} onGo={onGo} />
                    </ul>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t p-4">
          <Button variant="outline" onClick={onClose}>{tf('Keep editing')}</Button>
          {onGenerate && !findings.some((f) => f.blocking) ? (
            <Button variant="primary" onClick={onGenerate}>{tf(findings.length ? 'Generate anyway' : 'Generate DPR')}</Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
