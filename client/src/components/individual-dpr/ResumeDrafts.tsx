import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileClock } from 'lucide-react';
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
    <section className="mb-6 rounded-2xl border border-primary/25 bg-primary/5 p-4" aria-label={tf('Continue where you left off')}>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <FileClock className="h-4 w-4 text-primary" />
        {tf('Continue where you left off')}
      </h3>
      <ul className="space-y-2">
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
    </section>
  );
};
