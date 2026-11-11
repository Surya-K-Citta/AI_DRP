import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { Loader2, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';

/** Where "Edit" on a DPR card goes: the Create DPR page that built it. */
export function dprEditPath(dpr: any): string {
  const projectId = dpr?.projectId?._id;
  const type = dpr?.projectId?.projectType;
  if (!projectId) return `/dpr/view/${dpr?._id}`;
  if (type === 'individual') {
    const scheme = dpr.schemeCode ? `&scheme=${encodeURIComponent(dpr.schemeCode)}` : '';
    return `/individual-dpr/create?projectId=${projectId}&dprId=${dpr._id}${scheme}`;
  }
  if (type === 'cluster') return `/cluster-dpr/create?projectId=${projectId}&dprId=${dpr._id}`;
  return `/dpr/builder/${projectId}`;
}

/**
 * Edit and delete for DPR cards, shared by the dashboard and DPR management so both behave the same.
 * Delete asks first and only then calls the API; `onDeleted` lets the page drop the card.
 */
export function useDprActions(onDeleted: (dprId: string) => void) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [target, setTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const edit = (dpr: any) => {
    const path = dprEditPath(dpr);
    navigate(path, path.startsWith('/dpr/view/') ? { state: { updatedAt: dpr.updatedAt } } : undefined);
  };

  const confirmDelete = async () => {
    if (!target) return;
    setDeleting(true);
    try {
      await api.deleteDPR(target._id);
      onDeleted(target._id);
      toast.success(t('dashboard.deleted'));
      setTarget(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('dashboard.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  const deleteDialog = target ? (
    <div
      className="motion-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={() => !deleting && setTarget(null)}
    >
      <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold">{t('dashboard.deleteTitle')}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('dashboard.deleteBody', {
            name: target.projectId?.projectName || t('dashboard.untitledProject'),
          })}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setTarget(null)} disabled={deleting}>
            {t('dashboard.deleteCancel')}
          </Button>
          <Button variant="destructive" onClick={confirmDelete} disabled={deleting} data-no-auto-confirm>
            {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            {deleting ? t('dashboard.deleting') : t('dashboard.deleteConfirm')}
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  return { edit, askDelete: setTarget, deleteDialog };
}
