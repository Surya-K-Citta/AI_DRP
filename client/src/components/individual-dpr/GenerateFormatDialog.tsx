import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Download, FileText, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { useDialogFocus } from '@/lib/useDialog';
import type { ExportFormat, ExportedFile } from '@/lib/exportGeneratedDpr';

interface GenerateFormatDialogProps {
  open: boolean;
  /** The format being made right now. Cancel still works and stops it. */
  busy: ExportFormat | null;
  /** The file that is ready. The browser may have blocked the automatic download, so the dialog offers a download link. */
  ready: ExportedFile | null;
  onChoose: (format: ExportFormat) => void;
  onAnother: () => void;
  onClose: () => void;
}

/** "Generate DPR" asks which file the person wants, makes it, and offers it for download. */
export const GenerateFormatDialog: React.FC<GenerateFormatDialogProps> = ({ open, busy, ready, onChoose, onAnother, onClose }) => {
  const tf = useClusterFormText();
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogFocus(open, panelRef);

  // A real link to the file. Clicking it is a download the person started, which browsers always allow.
  const url = useMemo(() => (ready ? window.URL.createObjectURL(ready.blob) : null), [ready]);
  useEffect(() => () => { if (url) window.URL.revokeObjectURL(url); }, [url]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;
  const label = (format: ExportFormat) => (format === 'pdf' ? 'PDF' : tf('Word (DOCX)'));
  const options: Array<{ format: ExportFormat; text: string }> = [
    { format: 'pdf', text: tf('Fixed layout, ready to print or send to the bank.') },
    { format: 'docx', text: tf('Same layout as the PDF, and you can edit it in Word.') },
  ];
  return createPortal(
    <div className="motion-overlay fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="generate-format-title" data-testid="generate-format-dialog">
      <button type="button" className="absolute inset-0 bg-black/45" aria-label={tf('Cancel')} onClick={onClose} tabIndex={-1} />
      <div ref={panelRef} className="relative z-10 w-full max-w-md rounded-xl border border-border bg-background p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="generate-format-title" className="text-lg font-semibold text-foreground">{ready ? tf('Your DPR is ready') : tf('Choose the file format')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {ready ? tf('If the download did not start on its own, press Download.') : tf('Your DPR is generated and downloaded in the format you pick.')}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={tf('Cancel')}>
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {ready && url ? (
          <div className="mt-4 min-w-0 overflow-hidden rounded-xl border-2 border-primary/30 bg-primary/5 p-4" data-testid="generate-format-ready">
            <div className="flex items-start gap-2 text-sm text-foreground">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-primary" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-semibold">{label(ready.format)}</p>
                {/* Long file names wrap inside the box instead of running past its edge. */}
                <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]" data-testid="generate-format-filename">{ready.filename}</p>
              </div>
            </div>
            <a
              href={url}
              download={ready.filename}
              data-testid="generate-format-download"
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {tf('Download')}
            </a>
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {options.map((option) => (
              <button
                key={option.format}
                type="button"
                data-format={option.format}
                disabled={!!busy}
                onClick={() => onChoose(option.format)}
                className="flex items-center gap-3 rounded-xl border-2 border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden="true">
                  {busy === option.format ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">{label(option.format)}</span>
                  <span className="block text-xs text-muted-foreground">{busy === option.format ? tf('Generating your DPR…') : option.text}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {busy ? <p role="status" className="mt-3 text-xs text-muted-foreground">{tf('This can take up to a minute. Please keep this page open.')}</p> : null}
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          {ready ? (
            <Button type="button" variant="outline" onClick={onAnother} data-testid="generate-format-another">{tf('Choose another format')}</Button>
          ) : null}
          <Button type="button" variant="outline" onClick={onClose} data-testid="generate-format-cancel">
            {busy ? tf('Cancel generating') : ready ? tf('Close') : tf('Cancel')}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
