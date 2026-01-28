// @ts-nocheck
import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content: string;
  className?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ content, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-help"
        aria-label="Information"
      >
        <Info className="h-3 w-3" />
      </button>
      
      {isOpen && (
        <div
          className="absolute z-50 w-64 p-3 mt-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg left-0 top-full"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="relative">
            <div className="absolute -top-2 left-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
            <p className="text-sm leading-relaxed">{content}</p>
          </div>
        </div>
      )}
    </div>
  );
};
