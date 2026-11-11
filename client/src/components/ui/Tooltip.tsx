// @ts-nocheck
import React from 'react';
import { cn } from '@/lib/utils';

/**
 * A small name tag that appears under an icon-only control on hover or keyboard focus (after a short pause, so it does
 * not flash while the pointer passes by). It hides itself on touch screens. The control itself must still carry an
 * aria-label, which is what screen readers use.
 */
export function Tooltip({
  label,
  children,
  className = '',
  align = 'start',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  /** 'end' lines the tag up with the right edge of the control (for controls at the right of a box). */
  align?: 'start' | 'end';
}) {
  return (
    <span className={cn('tt-wrap', align === 'end' && 'tt-end', className)}>
      {children}
      <span role="tooltip" className="tt-bubble">{label}</span>
    </span>
  );
}
