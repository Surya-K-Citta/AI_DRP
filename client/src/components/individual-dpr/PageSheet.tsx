import React, { useLayoutEffect, useRef } from 'react';
import { pageBreakBackground, pageHeightMm, pageWidthMm, type PageSize } from '@/lib/individualDpr/documentStyle';
import { fitSheetToPages, mmToLayoutPx, stampSheetDisclaimers, stampSheetPageNumbers, stampSheetWatermarks } from '@/lib/individualDpr/pageFit';

export function PageSheet({
  pageSize,
  edgeTopMm,
  edgeBottomMm,
  className,
  id,
  children,
}: {
  pageSize: PageSize;
  edgeTopMm: number;
  edgeBottomMm: number;
  className?: string;
  id?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const sheet = ref.current;
    if (!sheet) return;
    const pageHeightPx = mmToLayoutPx(sheet, pageHeightMm(pageSize));
    if (!pageHeightPx) return;
    const edgeBottomPx = mmToLayoutPx(sheet, edgeBottomMm);
    fitSheetToPages(
      sheet,
      pageHeightPx,
      mmToLayoutPx(sheet, edgeTopMm),
      edgeBottomPx
    );
    stampSheetPageNumbers(sheet, pageHeightPx, edgeBottomPx);
    stampSheetDisclaimers(sheet, pageHeightPx);
    stampSheetWatermarks(sheet, pageHeightPx);
  });

  return (
    <div
      ref={ref}
      id={id}
      className={`theme-light${className ? ` ${className}` : ''}`}
      style={{
        width: `${pageWidthMm(pageSize)}mm`,
        minHeight: `${pageHeightMm(pageSize)}mm`,
        background: pageBreakBackground(pageSize),
      }}
    >
      {children}
    </div>
  );
}
