import { useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TemplateThumb } from '@/components/individual-dpr/TemplateThumb';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { useDialogFocus, useDialogPresence } from '@/lib/useDialog';
import { PRESET_IDS, PRESET_LABELS, PRESET_NOTES, type DocPresetId, type DocumentStyle } from '@/lib/individualDpr/documentStyle';

/** Pop-up with every report template as a small picture. Choosing one applies it to the live report and closes the pop-up. */
export function TemplatePickerDialog({
  open,
  onClose,
  style,
  schemeCode,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  style: DocumentStyle;
  schemeCode?: string | null;
  onPick: (id: DocPresetId) => void;
}) {
  const tf = useClusterFormText();
  const presence = useDialogPresence(open);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(open, dialogRef);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!presence.render) return null;
  return (
    <div
      className={`motion-overlay${presence.closing ? ' is-closing' : ''} fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-3 sm:p-6 no-print`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={tf('Choose a template')}
        tabIndex={-1}
        className="flex max-h-[92vh] min-h-0 w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl outline-none"
      >
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">{tf('Choose a template')}</p>
            <p className="text-xs text-slate-500">{tf('The look of the report changes at once. Your answers stay the same.')}</p>
          </div>
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose} aria-label={tf('Close')}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-3">
            {PRESET_IDS.map((id, index) => {
              const chosen = style.preset === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onPick(id);
                    onClose();
                  }}
                  aria-pressed={chosen}
                  title={tf(PRESET_LABELS[id])}
                  className={`relative flex w-full flex-col items-center gap-1.5 rounded-lg border p-2 text-xs font-medium transition-colors hover:border-slate-400 ${
                    chosen ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' : 'border-slate-200 bg-white'
                  }`}
                >
                  {chosen ? (
                    <span className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white" aria-hidden="true">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  ) : null}
                  <TemplateThumb id={id} style={style} schemeCode={schemeCode} order={index} />
                  <span>{tf(PRESET_LABELS[id])}</span>
                  <span className="text-center text-[11px] font-normal leading-tight text-slate-500">{tf(PRESET_NOTES[id])}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
