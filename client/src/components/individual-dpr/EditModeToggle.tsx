import { ChevronDown, ClipboardList, FileText } from 'lucide-react';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import type { EditMode } from '@/store/editModeStore';

/**
 * Mode dropdown: Basic (the step list and questions) / Advanced (typing straight into the report). A native select, so the keyboard, screen readers and phones all work as
 * they expect; the icon in front shows which mode is on.
 */
export function EditModeToggle({
  mode,
  onChange,
  className = '',
}: {
  mode: EditMode;
  onChange: (mode: EditMode) => void;
  className?: string;
}) {
  const tf = useClusterFormText();
  const Icon = mode === 'document' ? FileText : ClipboardList;
  const hint =
    mode === 'document'
      ? tf('Advanced mode: type straight into the report. The step list is folded away.')
      : tf('Basic mode: answer the questions step by step. The report is a read-only preview.');
  return (
    <label className={`relative inline-flex shrink-0 items-center ${className}`} title={hint}>
      <Icon className="pointer-events-none absolute left-2.5 h-4 w-4 text-primary" aria-hidden="true" />
      <select
        aria-label={tf('Where to fill in')}
        value={mode}
        onChange={(event) => onChange(event.target.value as EditMode)}
        className="h-9 cursor-pointer appearance-none rounded-lg border border-input bg-background py-1 pl-8 pr-8 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="form">{tf('Basic')}</option>
        <option value="document">{tf('Advanced')}</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
    </label>
  );
}
