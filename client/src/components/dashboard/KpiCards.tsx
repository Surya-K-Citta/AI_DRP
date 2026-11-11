import React from 'react';
import { BarChart3, ChevronRight, Clock, FileText, Send } from 'lucide-react';
import { useClusterFormText } from '@/lib/clusterDprFormText';

export interface DashboardStats {
  total: number;
  draft: number;
  submitted: number;
  analyzed: number;
  avgQualityScore: number;
}

type ListStatus = 'draft' | 'submitted' | 'analyzed';

interface KpiCardsProps {
  stats: DashboardStats;
  loading: boolean;
  /** Opens the DPR list, optionally on one status. */
  onOpen: (status?: ListStatus) => void;
}

/** Five compact summary cards. Each one opens the DPR list on the matching status. */
export const KpiCards: React.FC<KpiCardsProps> = ({ stats, loading, onOpen }) => {
  const tf = useClusterFormText();
  const cards: Array<{ key: string; label: string; value: string; hint: string; icon: React.ComponentType<{ className?: string }>; tint: string; status?: ListStatus }> = [
    { key: 'total', label: tf('Total DPRs'), value: String(stats.total), hint: tf('All projects in system'), icon: FileText, tint: 'bg-primary/10 text-primary' },
    { key: 'draft', label: tf('Draft'), value: String(stats.draft), hint: tf('In progress'), icon: Clock, tint: 'bg-warning/10 text-warning-text', status: 'draft' },
    { key: 'submitted', label: tf('Submitted'), value: String(stats.submitted), hint: tf('Sent for review'), icon: Send, tint: 'bg-blue-500/10 text-blue-700 dark:text-blue-300', status: 'submitted' },
    { key: 'analyzed', label: tf('Analyzed'), value: String(stats.analyzed), hint: tf('AI analyzed DPRs'), icon: BarChart3, tint: 'bg-violet-500/10 text-violet-700 dark:text-violet-300', status: 'analyzed' },
    { key: 'quality', label: tf('Avg Quality'), value: stats.avgQualityScore ? String(stats.avgQualityScore) : 'N/A', hint: stats.avgQualityScore ? tf('Out of 100') : tf('Not analyzed yet'), icon: BarChart3, tint: 'bg-success/10 text-success-text', status: 'analyzed' },
  ];

  return (
    <section data-tour="summary" aria-label={tf('DPR summary')} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onOpen(card.status)}
            aria-label={`${card.label}: ${loading ? '…' : card.value}. ${card.hint}`}
            className="group flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transform-none motion-reduce:transition-none"
          >
            <span className={`flex h-12 w-12 flex-none items-center justify-center rounded-xl ${card.tint}`} aria-hidden="true">
              <Icon className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1" aria-hidden="true">
              <span className="block text-sm font-medium text-foreground">{card.label}</span>
              {loading ? (
                <span className="mt-1 block h-7 w-12 animate-pulse rounded bg-muted" />
              ) : (
                <span className="block text-2xl font-bold leading-tight text-foreground">{card.value}</span>
              )}
              <span className="block text-xs leading-snug text-muted-foreground">{card.hint}</span>
            </span>
            <ChevronRight className="h-4 w-4 flex-none text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" />
          </button>
        );
      })}
    </section>
  );
};
