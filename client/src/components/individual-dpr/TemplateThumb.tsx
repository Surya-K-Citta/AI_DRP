import { useEffect, useMemo, useState } from 'react';
import { IndividualDPRDocumentView } from '@/components/individual-dpr/IndividualDPRDocumentView';
import { templateThumbDpr, templateThumbStyle } from '@/lib/individualDpr/templateSpecimen';
import type { DocPresetId, DocumentStyle } from '@/lib/individualDpr/documentStyle';

const THUMB_WIDTH_PX = 120;
const A4_WIDTH_PX = 794; // 210 mm at 96 dpi
const A4_RATIO = 297 / 210;

/** A tiny, non-interactive picture of the first page of a template, drawn by the real report renderer. */
export function TemplateThumb({
  id,
  style,
  schemeCode,
  order = 0,
}: {
  id: DocPresetId;
  style: DocumentStyle;
  schemeCode?: string | null;
  /** Position in the list. Thumbnails are drawn one after another so opening the menu never freezes. */
  order?: number;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 30 + order * 45);
    return () => window.clearTimeout(timer);
  }, [order]);
  const dpr = useMemo(() => templateThumbDpr(schemeCode), [schemeCode]);
  const themed = useMemo(() => templateThumbStyle(style, id), [style, id]);
  return (
    <div
      aria-hidden
      className="relative mx-auto overflow-hidden rounded border border-slate-200 bg-white shadow-sm"
      style={{ width: THUMB_WIDTH_PX, height: Math.round(THUMB_WIDTH_PX * A4_RATIO) }}
    >
      {ready ? (
        <div
          className="theme-light motion-fade-in pointer-events-none absolute left-0 top-0 select-none"
          style={{ width: A4_WIDTH_PX, transform: `scale(${THUMB_WIDTH_PX / A4_WIDTH_PX})`, transformOrigin: 'top left' }}
        >
          <IndividualDPRDocumentView dpr={dpr} documentStyle={themed} />
        </div>
      ) : (
        <div className="motion-skeleton absolute inset-0" />
      )}
    </div>
  );
}
