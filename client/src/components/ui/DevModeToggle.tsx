import React from 'react';
import { FlaskConical } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { isSuperAdmin } from '@/lib/rbac';
import { useClusterFormText } from '@/lib/clusterDprFormText';

interface DevModeToggleProps {
  on: boolean;
  onChange: (next: boolean) => void;
  /** Side-bar rail is open, so the label and switch can show. */
  expanded?: boolean;
}

/** Admin-only switch that lives in the side tool bar. Hidden for every other role. */
export const DevModeToggle: React.FC<DevModeToggleProps> = ({ on, onChange, expanded = false }) => {
  const user = useAuthStore((s) => s.user);
  const tf = useClusterFormText();
  if (!isSuperAdmin(user?.role)) return null;
  const label = tf('Dev mode');

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      title={label}
      onClick={() => onChange(!on)}
      className={`flex h-11 w-full items-center rounded-lg transition-colors ${
        on
          ? 'bg-amber-100 text-amber-950'
          : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
      }`}
    >
      <span className="flex h-11 w-12 shrink-0 items-center justify-center">
        <FlaskConical className="h-5 w-5" aria-hidden="true" />
      </span>
      <span
        className={`flex min-w-0 flex-1 items-center justify-between gap-2 pr-3 text-sm font-medium whitespace-nowrap ${
          expanded ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <span className="truncate">{label}</span>
        <span
          className={`inline-flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors ${
            on ? 'justify-end bg-amber-500' : 'justify-start bg-muted-foreground/30'
          }`}
          aria-hidden
        >
          <span className="h-4 w-4 rounded-full bg-white shadow" />
        </span>
      </span>
    </button>
  );
};
