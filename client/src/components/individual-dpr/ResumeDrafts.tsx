import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, FileClock } from 'lucide-react';
import { api } from '@/lib/api';
import { dprEditPath } from '@/lib/dprActions';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';

/**
 * "Continue where you left off": the person's latest unfinished Create DPR drafts, each opening at the step
 * they stopped on. Shown on the scheme picker; nothing is shown when there is no draft.
 */
export const ResumeDrafts: React.FC = () => {
  const tf = useClusterFormText();
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<any[]>([]);
  // Always closed when the page opens; it opens only when someone presses it.
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((current) => !current);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await api.getUserDPRs();
        const list = Array.isArray(response) ? response : response?.data?.dprs || response?.data || response?.dprs || [];
        const mine = (Array.isArray(list) ? list : [])
          .filter((item: any) => item?.projectId?.projectType === 'individual' && item.status === 'draft')
          .sort(
            (a: any, b: any) =>
              new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime()
          )
          .slice(0, 3);
        if (!cancelled) setDrafts(mine);
      } catch {
        /* no drafts to offer */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!drafts.length) return null;
  return (
    <section className="mb-6 rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3" aria-label={tf('Continue where you left off')}>
      <h3 className="text-sm font-semibold text-foreground">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="flex w-full items-center gap-2 rounded-lg text-left transition-colors hover:text-primary"
        >
          <FileClock className="h-4 w-4 text-primary" />
          <span>{tf('Continue where you left off')}</span>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">{drafts.length}</span>
          <ChevronDown className={`ml-auto h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
        </button>
      </h3>
      <div className="motion-collapse" data-open={open ? 'true' : 'false'} aria-hidden={!open} {...(open ? {} : { inert: '' })}>
        <div>
          <ul className="space-y-2 pt-3">
            {drafts.map((draft) => (
              <li
                key={draft._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {draft.projectId?.projectName || 'Untitled'}
                    {draft.schemeCode ? <span className="ml-2 text-xs font-medium text-primary">{draft.schemeCode}</span> : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tf('Last edited')} {formatDate(draft.updatedAt || draft.createdAt || new Date())}
                  </p>
                </div>
                <Button size="sm" onClick={() => navigate(dprEditPath(draft))}>
                  {tf('Resume')}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
