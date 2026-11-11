import React, { useLayoutEffect, useEffect, useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageSheet } from '@/components/individual-dpr/PageSheet';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { useDialogFocus, useDialogPresence } from '@/lib/useDialog';
import { pageEdgeMm, pageWidthMm, type DocumentStyle } from '@/lib/individualDpr/documentStyle';

/** The read-only "Final preview" pop-up: the report as it will print. Esc, a click outside or the Close button closes it. */
export function FinalPreviewDialog({
  open,
  onClose,
  style,
  children,
}: {
  open: boolean;
  onClose: () => void;
  style: DocumentStyle;
  children: React.ReactNode;
}) {
  const tf = useClusterFormText();
  const presence = useDialogPresence(open);
  const dialogRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.8);
  useDialogFocus(open, dialogRef);

  const fit = () => {
    const box = boxRef.current;
    if (!box) return;
    const probe = document.createElement('div');
    probe.style.cssText = `width:${pageWidthMm(style.pageSize)}mm;height:0;position:absolute;visibility:hidden;pointer-events:none`;
    box.appendChild(probe);
    const pagePx = probe.offsetWidth;
    box.removeChild(probe);
    if (!pagePx) return;
    setZoom(Math.round(Math.min(1.35, Math.max(0.3, (box.clientWidth - 48) / pagePx)) * 100) / 100);
  };

  useLayoutEffect(() => {
    if (open) fit();
  }, [open, style.pageSize]);

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
        className="flex h-full max-h-[92vh] min-h-0 w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-slate-100 shadow-2xl outline-none"
        role="dialog"
        aria-modal="true"
        aria-label={tf('Final preview')}
        tabIndex={-1}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-white px-4 py-2">
          <div>
            <p className="text-sm font-semibold">{tf('Final preview')}</p>
            <p className="text-xs text-slate-500">{tf('Read only. This is how the DPR will print: only the answers you filled in.')}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={tf('Zoom out')} onClick={() => setZoom((z) => Math.max(0.3, Math.round((z - 0.05) * 100) / 100))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="w-10 text-center text-xs">{Math.round(zoom * 100)}%</span>
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={tf('Zoom in')} onClick={() => setZoom((z) => Math.min(1.35, Math.round((z + 0.05) * 100) / 100))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={fit}>{tf('Fit page')}</Button>
            <Button type="button" size="sm" className="ml-2" onClick={onClose} aria-label={tf('Close preview')}>
              <X className="mr-1 h-4 w-4" />
              {tf('Close preview')}
            </Button>
          </div>
        </div>
        <div ref={boxRef} className="min-h-0 flex-1 overflow-auto p-6">
          <div style={{ zoom }}>
            <PageSheet pageSize={style.pageSize} edgeTopMm={pageEdgeMm(style.marginMm.top)} edgeBottomMm={pageEdgeMm(style.marginMm.bottom)} className="mx-auto shadow-lg">
              {children}
            </PageSheet>
          </div>
        </div>
      </div>
    </div>
  );
}
