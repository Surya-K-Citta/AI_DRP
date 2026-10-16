// @ts-nocheck
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';
import { useClusterFormText } from '@/lib/clusterDprFormText';

interface InfoTooltipProps {
  content: React.ReactNode;
  className?: string;
}

const MARGIN = 8;
const GAP = 8;
const MAX_WIDTH = 288;

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ content, className = '' }) => {
  const tf = useClusterFormText();
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const buttonRef = useRef(null);
  const tipRef = useRef(null);

  const place = useCallback(() => {
    const button = buttonRef.current;
    const tip = tipRef.current;
    if (!button || !tip) return;
    const rect = button.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(MAX_WIDTH, vw - MARGIN * 2);
    tip.style.width = `${width}px`;
    const height = tip.offsetHeight;
    const centre = rect.left + rect.width / 2;
    const left = Math.min(Math.max(centre - width / 2, MARGIN), vw - width - MARGIN);
    const below = vh - rect.bottom - GAP - MARGIN;
    const above = rect.top - GAP - MARGIN;
    const placeAbove = height > below && above > below;
    const room = placeAbove ? above : below;
    const top = placeAbove
      ? Math.max(MARGIN, rect.top - GAP - Math.min(height, room))
      : rect.bottom + GAP;
    setPos({
      left,
      top,
      width,
      maxHeight: Math.max(room, 80),
      arrow: Math.min(Math.max(centre - left, 12), width - 12),
      above: placeAbove,
    });
  }, []);

  useLayoutEffect(() => {
    if (isOpen) place();
  }, [isOpen, content, place]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const close = () => setIsOpen(false);
    const onKey = (event) => event.key === 'Escape' && close();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, place]);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-help"
        aria-label={tf("Information")}
      >
        <Info className="h-3 w-3" />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={tipRef}
            role="tooltip"
            className="fixed z-[100] p-3 text-xs text-white bg-gray-900 rounded-lg shadow-lg"
            style={{
              left: pos?.left ?? 0,
              top: pos?.top ?? 0,
              width: pos?.width ?? MAX_WIDTH,
              visibility: pos ? 'visible' : 'hidden',
            }}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            <span
              aria-hidden
              className="absolute w-2 h-2 rotate-45 bg-gray-900"
              style={{
                left: (pos?.arrow ?? 16) - 4,
                [pos?.above ? 'bottom' : 'top']: -4,
              }}
            />
            <div className="relative overflow-y-auto" style={{ maxHeight: pos ? pos.maxHeight - 24 : undefined }}>
              <div className="text-sm leading-relaxed">{content}</div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
