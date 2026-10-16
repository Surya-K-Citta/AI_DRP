import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CheckCircle2, ClipboardCheck, Eye, Send, XCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { toAppRole } from '@/lib/rbac';
import { AP_DISTRICTS } from '@/lib/individualDpr/apDistricts';
import { formatDate } from '@/lib/utils';

type Status = 'submitted' | 'approved' | 'rejected';

const TABS: { status: Status; label: string }[] = [
  { status: 'submitted', label: 'Awaiting review' },
  { status: 'approved', label: 'Approved' },
  { status: 'rejected', label: 'Sent back' },
];

/** Review queue for a District Reviewer (own district) or an APMSMEDC Admin (all districts). */
export const DistrictReview: React.FC = () => {
  const tf = useClusterFormText();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = toAppRole(user?.role) === 'super_admin';
  const assignedDistrict: string = (user as any)?.reviewDistrict || '';

  const [status, setStatus] = useState<Status>('submitted');
  const [district, setDistrict] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sendBack, setSendBack] = useState<{ id: string; name: string } | null>(null);
  const [remarks, setRemarks] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [queue, summary] = await Promise.all([
        api.getReviewQueue({ status, district: isAdmin && district ? district : undefined }),
        api.getReviewSummary(),
      ]);
      setRows(queue?.data?.dprs || []);
      setCounts(summary?.data?.counts || {});
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [status, district, isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = async (id: string, decision: 'approve' | 'reject', note?: string) => {
    setBusyId(id);
    try {
      const response = await api.reviewDPR(id, decision, note);
      toast.success(tf(decision === 'approve' ? 'DPR approved' : 'DPR sent back to the applicant'));
      if (response?.success) {
        setSendBack(null);
        setRemarks('');
        await load();
      }
    } catch {
      // the API client already showed the server's message
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <ClipboardCheck className="h-6 w-6 text-primary" aria-hidden />
              {tf('District review')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAdmin
                ? tf('DPRs submitted from every district.')
                : assignedDistrict
                  ? `${tf('Your district')}: ${tf(assignedDistrict)}`
                  : tf('No district is assigned to you yet. Ask an APMSMEDC Admin.')}
            </p>
          </div>
          {isAdmin && (
            <label className="text-sm">
              <span className="mr-2 text-muted-foreground">{tf('District')}</span>
              <select
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">{tf('All districts')}</option>
                {AP_DISTRICTS.map((name) => (
                  <option key={name} value={name}>
                    {tf(name)}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="mb-4 flex gap-1 overflow-x-auto border-b" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.status}
              type="button"
              role="tab"
              aria-selected={status === tab.status}
              onClick={() => setStatus(tab.status)}
              className={`whitespace-nowrap px-4 py-2 text-sm font-semibold ${
                status === tab.status ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tf(tab.label)} ({counts[tab.status] ?? 0})
            </button>
          ))}
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{tf('Loading...')}</p>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {tf('Nothing here yet.')}
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => (
              <li key={row.dprId}>
                <Card>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold">{row.projectName}</h2>
                      <p className="text-sm text-muted-foreground">
                        {[row.district && tf(row.district), row.location].filter(Boolean).join(' · ')}
                        {row.projectType ? ` · ${tf(row.projectType === 'cluster' ? 'Cluster' : 'Individual')}` : ''}
                      </p>
                      {row.applicant && (
                        <p className="mt-1 text-sm">
                          {row.applicant.name} · {row.applicant.email}
                          {row.applicant.phoneNumber ? ` · ${row.applicant.phoneNumber}` : ''}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {row.submittedAt ? `${tf('Submitted')}: ${formatDate(row.submittedAt)}` : ''}
                        {typeof row.qualityScore === 'number' ? ` · ${tf('Quality score')}: ${row.qualityScore}/100` : ''}
                      </p>
                      {row.review?.remarks && (
                        <p className="mt-2 rounded-md bg-muted px-3 py-2 text-sm">
                          <span className="font-medium">{row.review.reviewerName || tf('Reviewer')}: </span>
                          {row.review.remarks}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/dpr/view/${row.dprId}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        {tf('Open DPR')}
                      </Button>
                      {row.status === 'submitted' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={busyId === row.dprId}
                            onClick={() => void decide(row.dprId, 'approve')}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {tf('Approve')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busyId === row.dprId}
                            onClick={() => setSendBack({ id: row.dprId, name: row.projectName })}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            {tf('Send back')}
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      {sendBack && (
        <div className="motion-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <Card className="w-full max-w-lg">
            <CardContent className="space-y-4 p-6">
              <h2 className="text-lg font-semibold">{tf('Send back to the applicant')}</h2>
              <p className="text-sm text-muted-foreground">{sendBack.name}</p>
              <label className="block text-sm font-medium">
                {tf('What needs to change?')}
                <textarea
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  rows={5}
                  maxLength={2000}
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder={tf('Remarks are required')}
                  autoFocus
                />
              </label>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setSendBack(null); setRemarks(''); }}>
                  <XCircle className="mr-2 h-4 w-4" />
                  {tf('Cancel')}
                </Button>
                <Button
                  variant="primary"
                  disabled={!remarks.trim() || busyId === sendBack.id}
                  onClick={() => void decide(sendBack.id, 'reject', remarks.trim())}
                >
                  {tf('Send back')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Layout>
  );
};
