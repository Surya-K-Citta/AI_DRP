import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Eye, EyeOff, GripVertical } from 'lucide-react';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import type { SectionProgress } from '@/lib/individualDpr/authoringProgress';

/**
 * Form mode's step list: every step is a row that opens and closes. Choosing a row opens it (and closes the one that was open), and the
 * questions for that step appear inside it. A row shows its number, name, a tick when complete, and how many required answers are missing.
 */
export function StepAccordion({
  sections,
  current,
  open,
  onSelect,
  describe,
  hiddenSteps,
  onToggleHidden,
  onMove,
  children,
}: {
  sections: SectionProgress[];
  current: number;
  /** Whether the current step's row is open (it can be closed by pressing it again). */
  open: boolean;
  onSelect: (step: number) => void;
  /** One plain sentence about the step, shown under its name (in full for the open step, on one line for the others). */
  describe?: (step: number) => string | undefined;
  /** Steps left out of the report (their answers are kept). Omit to turn hiding off. */
  hiddenSteps?: Set<number>;
  onToggleHidden?: (step: number) => void;
  /** Drag and drop (or the arrow keys on the handle): put `from` before or after `to`. Omit to turn moving off. */
  onMove?: (from: number, to: number, place: 'before' | 'after') => void;
  /** The questions of the current step. */
  children: React.ReactNode;
}) {
  const tf = useClusterFormText();
  const scroller = useRef<HTMLDivElement>(null);
  const [dragStep, setDragStep] = useState<number | null>(null);
  const [drop, setDrop] = useState<{ step: number; place: 'before' | 'after' } | null>(null);
  const clearDrag = () => {
    setDragStep(null);
    setDrop(null);
  };
  const moveBy = (step: number, delta: number) => {
    const at = sections.findIndex((item) => item.step === step);
    const target = sections[at + delta];
    if (at < 0 || !target) return;
    onMove?.(step, target.step, delta < 0 ? 'before' : 'after');
  };

  // Bring the opened row to the top of the list once it has opened.
  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setTimeout(() => {
      const box = scroller.current;
      const row = box?.querySelector<HTMLElement>(`[data-step-row="${current}"]`);
      if (!box || !row) return;
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      box.scrollTo({ top: Math.max(0, row.offsetTop - box.offsetTop - 4), behavior: reduced ? 'auto' : 'smooth' });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [current, open]);

  return (
    <div ref={scroller} className="fill-edit-scroll min-h-0 flex-1 overflow-y-auto">
      <ol className="divide-y divide-border/70">
        {sections.map((section, index) => {
          const isCurrent = section.step === current;
          const expanded = isCurrent && open;
          const done = section.status === 'complete';
          const isHidden = !!hiddenSteps?.has(section.step);
          const needed = section.requiredMissing || 0;
          const about = describe?.(section.step);
          const label = tf(section.title).replace(/^\s*(Step|దశ)\s*\d+\s*[:.\-–]\s*/i, '');
          return (
            <li
              key={section.step}
              data-step-row={section.step}
              draggable={!!onMove}
              onDragStart={(event) => {
                setDragStep(section.step);
                if (event.dataTransfer) {
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', String(section.step));
                }
              }}
              onDragOver={(event) => {
                if (dragStep === null || dragStep === section.step) return;
                event.preventDefault();
                const box = event.currentTarget.getBoundingClientRect();
                setDrop({ step: section.step, place: event.clientY < box.top + box.height / 2 ? 'before' : 'after' });
              }}
              onDrop={(event) => {
                event.preventDefault();
                if (dragStep !== null && drop && dragStep !== drop.step) onMove?.(dragStep, drop.step, drop.place);
                clearDrag();
              }}
              onDragEnd={clearDrag}
              className={`relative ${expanded ? 'bg-primary/[0.03]' : ''} ${dragStep === section.step ? 'opacity-40' : ''} ${isHidden ? 'bg-muted/40' : ''}`}
            >
              {drop && drop.step === section.step ? (
                <span aria-hidden="true" className={`pointer-events-none absolute inset-x-3 z-10 h-0.5 rounded bg-primary ${drop.place === 'before' ? 'top-0' : 'bottom-0'}`} />
              ) : null}
              {/* The open step's title stays at the top while its inputs scroll past (it is held inside its own row, so it moves on once the last input has passed). */}
              <h2 className={`m-0 flex items-stretch border-l-4 transition-colors ${expanded ? 'sticky top-0 z-20 border-primary bg-card shadow-[0_1px_0_0_hsl(var(--border)),0_6px_10px_-8px_rgba(15,23,42,0.35)] hover:bg-muted focus-within:bg-muted' : 'border-transparent hover:bg-muted/60 focus-within:bg-muted/40'}`}>
                {onMove ? (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`${tf('Move')}: ${label}. ${tf('Use the Up and Down arrow keys')}`}
                    title={tf('Drag, or press the Up and Down arrow keys to move')}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                        event.preventDefault();
                        moveBy(section.step, event.key === 'ArrowUp' ? -1 : 1);
                      }
                    }}
                    className="flex shrink-0 cursor-grab items-center pl-2 pr-0.5 text-muted-foreground/60 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:pl-3"
                  >
                    <GripVertical className="h-4 w-4" aria-hidden="true" />
                  </span>
                ) : null}
                <button
                  type="button"
                  id={`step-head-${section.step}`}
                  aria-expanded={expanded}
                  aria-controls={`step-panel-${section.step}`}
                  onClick={() => onSelect(section.step)}
                  className={`group flex min-w-0 flex-1 items-center gap-3 !shadow-none py-3 pr-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring ${
                    onMove ? 'pl-2' : 'pl-4 sm:pl-5'
                  } ${isHidden ? 'opacity-60' : ''}`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold tabular-nums transition-colors ${
                      done
                        ? 'border-success bg-success text-white'
                        : isCurrent
                          ? 'border-primary bg-primary text-primary-foreground'
                          : section.percent > 0
                            ? 'border-primary/60 text-primary'
                            : 'border-border text-muted-foreground'
                    }`}
                    aria-hidden="true"
                  >
                    {done ? <Check className="h-4 w-4" strokeWidth={3} /> : index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm ${expanded ? 'text-base font-semibold text-foreground' : 'font-medium text-foreground/90'}`}>{label}</span>
                    {isHidden ? <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{tf('Hidden from the report')}</span> : null}
                    {about ? (
                      <span className={`mt-0.5 block text-xs font-normal leading-snug text-muted-foreground ${expanded ? '' : 'line-clamp-2'}`}>{about}</span>
                    ) : null}
                  </span>
                  {needed ? (
                    <span
                      className="flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold leading-none text-white"
                      title={tf('{n} required answers missing').replace('{n}', String(needed))}
                    >
                      {needed}
                      <span className="sr-only"> {tf('{n} required answers missing').replace('{n}', String(needed))}</span>
                    </span>
                  ) : null}
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`}
                    aria-hidden="true"
                  />
                </button>
                {onToggleHidden ? (
                  <button
                    type="button"
                    onClick={() => onToggleHidden(section.step)}
                    aria-pressed={isHidden}
                    aria-label={`${isHidden ? tf('Show section') : tf('Hide section')}: ${label}`}
                    title={isHidden ? tf('Left out of the report. Press to show it.') : tf('Hide from the report (your answers are kept)')}
                    className="flex shrink-0 items-center !shadow-none px-3 text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                  >
                    {isHidden ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                ) : null}
              </h2>
              {expanded ? (
                <div id={`step-panel-${section.step}`} role="region" aria-labelledby={`step-head-${section.step}`} className="dpr-step-open pb-5 pl-[38px] pr-4 pt-1 sm:pl-[42px] sm:pr-5">
                  {children}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
