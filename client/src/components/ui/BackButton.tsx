// @ts-nocheck
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';

/** Icon-only Back button. The name ("Back to Dashboard") shows as a tooltip on hover or focus and is the accessible label. */
export function BackButton({ label, onClick, className = '' }: { label: string; onClick: () => void; className?: string }) {
  return (
    <Tooltip label={label}>
      <Button type="button" variant="ghost" size="sm" onClick={onClick} aria-label={label} className={cn('h-9 w-9 shrink-0 p-0', className)}>
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      </Button>
    </Tooltip>
  );
}
