import React from 'react';
import { ArrowRight, Eye, FileText, Pencil, Trash2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import { useClusterFormText } from '@/lib/clusterDprFormText';

interface RecentDprsProps {
  dprs: any[];
  total: number;
  loading: boolean;
  canCreate: boolean;
  /** Status badge for one report (icon + words, never colour alone). */
  renderStatus: (dpr: any) => React.ReactNode;
  onView: (dpr: any) => void;
  onEdit: (dpr: any) => void;
  onDelete: (dpr: any) => void;
  onViewAll: () => void;
  onViewProjects: () => void;
  onCreate: () => void;
  onGuide: () => void;
}

const rowButton =
  'inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring';

/** One card with the latest reports as compact rows (not a card per report). */
export const RecentDprs: React.FC<RecentDprsProps> = ({ dprs, total, loading, canCreate, renderStatus, onView, onEdit, onDelete, onViewAll, onViewProjects, onCreate, onGuide }) => {
  const tf = useClusterFormText();
  const nameOf = (dpr: any) => dpr.projectId?.projectName || tf('Untitled Project');
  const stamp = (dpr: any) => dpr.updatedAt || dpr.createdAt || dpr.generatedAt;

  return (
    <section aria-labelledby="recent-dprs-title" className="min-w-0 rounded-2xl border border-border bg-card">
      <header className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 id="recent-dprs-title" className="text-base font-semibold text-foreground">{tf('My Recent DPRs')}</h2>
            <p className="text-sm text-muted-foreground">{tf('Continue where you left off')}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onViewAll} className="gap-1.5">
            {tf('View All DPRs')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button variant="outline" size="sm" onClick={onViewProjects} className="gap-1.5">
            {tf('View Projects')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="space-y-2 p-4 sm:p-5" aria-busy="true" aria-label={tf('Loading')}>
          {[0, 1, 2].map((row) => <div key={row} className="h-14 animate-pulse rounded-lg bg-muted" />)}
        </div>
      ) : dprs.length === 0 ? (
        <div className="px-4 py-12 text-center sm:px-5">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden="true">
            <FileText className="h-8 w-8" />
          </span>
          <h3 className="text-lg font-semibold text-foreground">{tf('No DPRs yet')}</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{tf('Create your first DPR to get started.')}</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {canCreate && (
              <Button variant="primary" onClick={onCreate} className="gap-2"><FileText className="h-4 w-4" aria-hidden="true" />{tf('Create DPR')}</Button>
            )}
            <Button variant="outline" onClick={onGuide} className="gap-2"><Wand2 className="h-4 w-4" aria-hidden="true" />{tf('Start with a guide')}</Button>
          </div>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border">
            {dprs.map((dpr) => (
              <li
                key={dpr._id}
                className="group flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors hover:bg-muted/40 sm:grid sm:grid-cols-[minmax(0,1fr)_9.5rem_8.5rem_auto] sm:px-5"
              >
                <button
                  type="button"
                  onClick={() => onView(dpr)}
                  className="flex min-w-0 flex-1 basis-56 items-center gap-3 sm:basis-auto rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15" aria-hidden="true">
                    <FileText className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block break-words text-sm font-semibold text-foreground [overflow-wrap:anywhere]">{nameOf(dpr)}</span>
                    <span className="mt-1 block sm:hidden">{renderStatus(dpr)}</span>
                  </span>
                </button>
                <span className="hidden sm:block">{renderStatus(dpr)}</span>
                <span className="text-xs leading-tight text-muted-foreground">
                  {tf('Updated on')}
                  <span className="block text-sm text-foreground">{stamp(dpr) ? formatDate(stamp(dpr)) : '—'}</span>
                </span>
                <span className="ml-auto flex items-center gap-0.5">
                  <button type="button" onClick={() => onView(dpr)} className={`${rowButton} text-foreground hover:bg-muted`} aria-label={`${tf('View')} ${nameOf(dpr)}`} title={tf('View')}>
                    <Eye className="h-4 w-4" aria-hidden="true" /><span className="hidden 2xl:inline">{tf('View')}</span>
                  </button>
                  <button type="button" onClick={() => onEdit(dpr)} className={`${rowButton} text-foreground hover:bg-muted`} aria-label={`${tf('Edit')} ${nameOf(dpr)}`} title={tf('Edit')}>
                    <Pencil className="h-4 w-4" aria-hidden="true" /><span className="hidden 2xl:inline">{tf('Edit')}</span>
                  </button>
                  <button type="button" data-no-auto-confirm onClick={() => onDelete(dpr)} className={`${rowButton} text-destructive-text hover:bg-destructive/10`} aria-label={`${tf('Delete')} ${nameOf(dpr)}`} title={tf('Delete')}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" /><span className="hidden 2xl:inline">{tf('Delete')}</span>
                  </button>
                </span>
              </li>
            ))}
          </ul>
          {total > dprs.length && (
            <footer className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row sm:px-5">
              <p className="text-sm text-muted-foreground" role="status">
                {tf('Showing your latest')} {dprs.length} {tf('of')} {total} {tf('reports')}
              </p>
              <Button variant="outline" size="sm" onClick={onViewAll} className="gap-1.5">
                {tf('View All DPRs')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </footer>
          )}
        </>
      )}
    </section>
  );
};
