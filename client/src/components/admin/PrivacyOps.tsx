// @ts-nocheck
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const fmt = (value?: string) => (value ? new Date(value).toLocaleString('en-IN') : '—');
const errMsg = (error: any, fallback: string) => error?.response?.data?.message || fallback;

const textareaClass = 'flex min-h-[80px] w-full rounded-[10px] border border-input bg-background px-3 py-2 text-sm';

const INCIDENT_STATUS_LABEL: Record<string, string> = {
  detected: 'Detected',
  assessing: 'Being assessed',
  declared_breach: 'Declared a breach',
  not_a_breach: 'Not a breach',
  contained: 'Contained',
  closed: 'Closed',
};

/** DPDP operations for the department: readiness, privacy requests, breach register, retention holds. */
export const PrivacyOps: React.FC = () => {
  const tf = useClusterFormText();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any[]>([]);
  const [officer, setOfficer] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [holds, setHolds] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      const [s, c, i, h] = await Promise.all([
        api.adminComplianceStatus(),
        api.adminListComplaints(),
        api.adminListIncidents(),
        api.adminListRetentionHolds(),
      ]);
      setStatus(s.data?.items || []);
      setOfficer(c.data?.officer || null);
      setComplaints(c.data?.items || []);
      setIncidents(i.data?.items || []);
      setHolds(h.data || []);
    } catch (error: any) {
      toast.error(errMsg(error, tf('Failed to load data')));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="privacy-ops">
      <Readiness items={status} tf={tf} />
      <Requests items={complaints} officer={officer} reload={load} tf={tf} />
      <Incidents items={incidents} reload={load} tf={tf} />
      <Holds items={holds} reload={load} tf={tf} />
    </div>
  );
};

const Readiness = ({ items, tf }) => (
  <Card>
    <CardHeader>
      <CardTitle>{tf('DPDP readiness')}</CardTitle>
      <p className="text-sm text-muted-foreground">
        {tf('What is in place and what still needs a decision or a document from the department.')}
      </p>
    </CardHeader>
    <CardContent>
      <ul className="divide-y">
        {items.map((item) => (
          <li key={item.area} className="flex gap-3 py-3 text-sm" data-status={item.status}>
            {item.status === 'ready' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-label={tf('Ready')} />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-label={tf('Action needed')} />
            )}
            <div>
              <p className="font-medium">{item.area}</p>
              <p className="text-muted-foreground">{item.detail}</p>
              {item.needs ? <p className="mt-1 text-amber-800">{item.needs}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const Requests = ({ items, officer, reload, tf }) => {
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const edit = (c) => {
    setOpen(open === c._id ? null : c._id);
    setDraft({ status: c.status, response: c.response || '', assignedTo: c.assignedTo || '', internalNote: c.internalNote || '' });
  };

  const save = async (id) => {
    setSaving(true);
    try {
      await api.adminUpdateComplaint(id, draft);
      toast.success(tf('Saved'));
      setOpen(null);
      reload();
    } catch (error: any) {
      toast.error(errMsg(error, tf('Failed to save')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tf('Privacy requests')}</CardTitle>
        {officer ? (
          <p className="text-sm text-muted-foreground">
            {tf('Privacy officer')}: {officer.name}, {officer.role} · {officer.email}
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{tf('No privacy requests yet.')}</p>
        ) : (
          <ul className="space-y-3">
            {items.map((c) => (
              <li key={c._id} className="rounded-md border p-3 text-sm" data-testid="privacy-request">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{c.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.name || c.email} · {c.email} · {fmt(c.createdAt)} · {tf('Reply due by')} {fmt(c.dueAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.overdue ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">{tf('Overdue')}</span> : null}
                    <span className="rounded-full border px-2 py-0.5 text-xs">{c.status.replace('_', ' ')}</span>
                    <Button variant="outline" size="sm" onClick={() => edit(c)}>
                      {open === c._id ? tf('Close') : tf('Open')}
                    </Button>
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-wrap">{c.message}</p>
                {open === c._id ? (
                  <div className="mt-3 space-y-3 border-t pt-3">
                    <label className="block text-xs font-medium">
                      {tf('Status')}
                      <select
                        className="mt-1 block w-full rounded-md border bg-background p-2 text-sm"
                        value={draft.status}
                        onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                      >
                        <option value="open">open</option>
                        <option value="in_progress">in progress</option>
                        <option value="resolved">resolved</option>
                        <option value="closed">closed</option>
                      </select>
                    </label>
                    <Input
                      label={tf('Assigned to')}
                      value={draft.assignedTo}
                      onChange={(e) => setDraft({ ...draft, assignedTo: e.target.value })}
                    />
                    <label className="block text-xs font-medium">
                      {tf('Reply to the person (they see this)')}
                      <textarea
                        className={textareaClass}
                        value={draft.response}
                        onChange={(e) => setDraft({ ...draft, response: e.target.value })}
                      />
                    </label>
                    <label className="block text-xs font-medium">
                      {tf('Internal note (not shown to the person)')}
                      <textarea
                        className={textareaClass}
                        value={draft.internalNote}
                        onChange={(e) => setDraft({ ...draft, internalNote: e.target.value })}
                      />
                    </label>
                    <Button onClick={() => save(c._id)} disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {tf('Save')}
                    </Button>
                  </div>
                ) : c.response ? (
                  <p className="mt-2 rounded bg-muted/50 p-2 whitespace-pre-wrap">
                    <span className="font-medium">{tf('Reply')}: </span>
                    {c.response}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

const emptyIncident = { title: '', nature: '', dataAffected: '', usersAffectedCount: '', detectedAt: '' };

const Incidents = ({ items, reload, tf }) => {
  const [form, setForm] = useState(emptyIncident);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState<any>({});
  const [busy, setBusy] = useState(false);

  const create = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.adminCreateIncident({
        title: form.title,
        nature: form.nature,
        dataAffected: form.dataAffected.split(',').map((x) => x.trim()).filter(Boolean),
        usersAffectedCount: Number(form.usersAffectedCount) || 0,
        detectedAt: form.detectedAt ? new Date(form.detectedAt).toISOString() : undefined,
      });
      setForm(emptyIncident);
      toast.success(tf('Incident logged'));
      reload();
    } catch (error: any) {
      toast.error(errMsg(error, tf('Failed to save')));
    } finally {
      setCreating(false);
    }
  };

  const expand = (i) => {
    setOpen(open === i._id ? null : i._id);
    setDraft({
      assessmentNote: i.assessmentNote || '',
      containmentActions: i.containmentActions || '',
      correctiveActions: i.correctiveActions || '',
      boardReference: i.boardReference || '',
      affectedEmails: '',
      notice: '',
    });
  };

  const patch = async (id, body, ok) => {
    setBusy(true);
    try {
      await api.adminUpdateIncident(id, body);
      toast.success(ok || tf('Saved'));
      reload();
    } catch (error: any) {
      toast.error(errMsg(error, tf('Failed to save')));
    } finally {
      setBusy(false);
    }
  };

  const notify = async (id) => {
    setBusy(true);
    try {
      const res = await api.adminNotifyIncidentUsers(id, draft.notice);
      toast.success(`${res.data?.notified ?? 0} ${tf('people notified')}`);
      reload();
    } catch (error: any) {
      toast.error(errMsg(error, tf('Failed to save')));
    } finally {
      setBusy(false);
    }
  };

  const fields = (i) => ({
    assessmentNote: draft.assessmentNote,
    containmentActions: draft.containmentActions,
    correctiveActions: draft.correctiveActions,
    boardReference: draft.boardReference,
    ...(draft.affectedEmails.trim() ? { affectedEmails: draft.affectedEmails.split(/[\s,;]+/).filter(Boolean) } : {}),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tf('Security incidents and breaches')}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {tf('Log every incident, decide whether it is a personal data breach, record the containment, the Board report, the notice to people and the corrective actions.')}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={create} className="space-y-3 rounded-md border p-3" data-testid="incident-form">
          <Input label={tf('Title')} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <label className="block text-xs font-medium">
            {tf('What happened (nature and scope)')}
            <textarea className={textareaClass} value={form.nature} onChange={(e) => setForm({ ...form, nature: e.target.value })} required />
          </label>
          <Input
            label={tf('Data affected (comma separated)')}
            value={form.dataAffected}
            onChange={(e) => setForm({ ...form, dataAffected: e.target.value })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              type="number"
              min={0}
              label={tf('People potentially affected')}
              value={form.usersAffectedCount}
              onChange={(e) => setForm({ ...form, usersAffectedCount: e.target.value })}
            />
            <Input
              type="datetime-local"
              label={tf('Date and time detected (blank = now)')}
              value={form.detectedAt}
              onChange={(e) => setForm({ ...form, detectedAt: e.target.value })}
            />
          </div>
          <Button type="submit" disabled={creating}>
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tf('Log incident')}
          </Button>
        </form>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{tf('No incidents logged.')}</p>
        ) : (
          <ul className="space-y-3">
            {items.map((i) => (
              <li key={i._id} className="rounded-md border p-3 text-sm" data-testid="incident-row">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {i.reference} · {i.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tf('Detected')} {fmt(i.detectedAt)} · {i.usersAffectedCount} {tf('people')} · {(i.dataAffected || []).join(', ') || '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {i.boardReportOverdue ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">{tf('Board report overdue')}</span>
                    ) : null}
                    <span className="rounded-full border px-2 py-0.5 text-xs">{tf(INCIDENT_STATUS_LABEL[i.status] || i.status)}</span>
                    <Button variant="outline" size="sm" onClick={() => expand(i)}>
                      {open === i._id ? tf('Close') : tf('Open')}
                    </Button>
                  </div>
                </div>
                {open === i._id ? (
                  <div className="mt-3 space-y-3 border-t pt-3">
                    <p className="whitespace-pre-wrap">{i.nature}</p>
                    {i.boardDetailedDueAt ? (
                      <p className="text-xs">
                        {tf('Detailed Board report due')}: {fmt(i.boardDetailedDueAt)} · {tf('Board told')}: {fmt(i.boardIntimatedAt)} ·{' '}
                        {tf('Detailed report sent')}: {fmt(i.boardDetailedReportAt)}
                      </p>
                    ) : null}
                    <label className="block text-xs font-medium">
                      {tf('Assessment: why this is, or is not, a personal data breach')}
                      <textarea className={textareaClass} value={draft.assessmentNote} onChange={(e) => setDraft({ ...draft, assessmentNote: e.target.value })} />
                    </label>
                    <label className="block text-xs font-medium">
                      {tf('Actions taken to contain it')}
                      <textarea className={textareaClass} value={draft.containmentActions} onChange={(e) => setDraft({ ...draft, containmentActions: e.target.value })} />
                    </label>
                    <label className="block text-xs font-medium">
                      {tf('Corrective and preventive actions')}
                      <textarea className={textareaClass} value={draft.correctiveActions} onChange={(e) => setDraft({ ...draft, correctiveActions: e.target.value })} />
                    </label>
                    <Input
                      label={tf('Data Protection Board reference')}
                      value={draft.boardReference}
                      onChange={(e) => setDraft({ ...draft, boardReference: e.target.value })}
                    />
                    <label className="block text-xs font-medium">
                      {tf('Affected people: add account emails (separated by commas or spaces)')} ({i.affectedUserCount} {tf('listed')})
                      <textarea className={textareaClass} value={draft.affectedEmails} onChange={(e) => setDraft({ ...draft, affectedEmails: e.target.value })} />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Button disabled={busy} variant="outline" onClick={() => patch(i._id, fields(i))}>
                        {tf('Save details')}
                      </Button>
                      {['detected', 'assessing'].includes(i.status) ? (
                        <>
                          {i.status === 'detected' ? (
                            <Button disabled={busy} variant="outline" onClick={() => patch(i._id, { ...fields(i), status: 'assessing' })}>
                              {tf('Start assessment')}
                            </Button>
                          ) : null}
                          <Button disabled={busy} onClick={() => patch(i._id, { ...fields(i), status: 'declared_breach' }, tf('Declared a personal data breach'))}>
                            {tf('Declare personal data breach')}
                          </Button>
                          <Button disabled={busy} variant="outline" onClick={() => patch(i._id, { ...fields(i), status: 'not_a_breach' })}>
                            {tf('Not a breach')}
                          </Button>
                        </>
                      ) : null}
                      {i.status === 'declared_breach' ? (
                        <>
                          {!i.boardIntimatedAt ? (
                            <Button disabled={busy} variant="outline" onClick={() => patch(i._id, { ...fields(i), boardIntimated: true })}>
                              {tf('Record: Board told')}
                            </Button>
                          ) : null}
                          {!i.boardDetailedReportAt ? (
                            <Button disabled={busy} variant="outline" onClick={() => patch(i._id, { ...fields(i), boardDetailedReported: true })}>
                              {tf('Record: detailed report sent')}
                            </Button>
                          ) : null}
                          <Button disabled={busy} variant="outline" onClick={() => patch(i._id, { ...fields(i), status: 'contained' })}>
                            {tf('Mark contained')}
                          </Button>
                        </>
                      ) : null}
                      {['contained', 'not_a_breach'].includes(i.status) ? (
                        <Button disabled={busy} onClick={() => patch(i._id, { ...fields(i), status: 'closed' })}>
                          {tf('Close incident')}
                        </Button>
                      ) : null}
                    </div>
                    {['declared_breach', 'contained', 'closed'].includes(i.status) ? (
                      <div className="space-y-2 rounded-md border p-3">
                        <label className="block text-xs font-medium">
                          {tf('Notice to affected people (what happened, what it means for them, what to do, who to contact)')}
                          <textarea className={textareaClass} value={draft.notice} onChange={(e) => setDraft({ ...draft, notice: e.target.value })} />
                        </label>
                        <Button disabled={busy || !i.affectedUserCount} onClick={() => notify(i._id)}>
                          {tf('Notify affected people')}
                        </Button>
                        {i.usersNotifiedAt ? (
                          <p className="text-xs">
                            {i.usersNotifiedCount} {tf('people notified')} · {fmt(i.usersNotifiedAt)}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    <div>
                      <p className="text-xs font-medium">{tf('Timeline')}</p>
                      <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                        {(i.timeline || []).map((t, n) => (
                          <li key={n}>
                            {fmt(t.at)} · {t.by} · {t.kind.replace(/_/g, ' ')}
                            {t.note ? ` — ${t.note}` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

const Holds = ({ items, reload, tf }) => {
  const [form, setForm] = useState({ dprId: '', reason: '', reference: '', until: '' });
  const [saving, setSaving] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.adminSetRetentionHold(form.dprId.trim(), {
        reason: form.reason,
        reference: form.reference,
        until: form.until ? new Date(form.until).toISOString() : undefined,
      });
      setForm({ dprId: '', reason: '', reference: '', until: '' });
      toast.success(tf('Retention hold set'));
      reload();
    } catch (error: any) {
      toast.error(errMsg(error, tf('Failed to save')));
    } finally {
      setSaving(false);
    }
  };

  const lift = async (id) => {
    try {
      await api.adminLiftRetentionHold(id);
      toast.success(tf('Retention hold lifted'));
      reload();
    } catch (error: any) {
      toast.error(errMsg(error, tf('Failed to save')));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tf('Retention holds')}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {tf('Keep a submitted DPR past 12 months only on the department’s written instruction (bank, DIC or scheme process still open).')}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-2" data-testid="hold-form">
          <Input label={tf('DPR id')} value={form.dprId} onChange={(e) => setForm({ ...form, dprId: e.target.value })} required />
          <Input label={tf('Written reference (letter or file number)')} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} required />
          <Input label={tf('Reason')} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required />
          <Input type="date" label={tf('Keep until (blank = until lifted)')} value={form.until} onChange={(e) => setForm({ ...form, until: e.target.value })} />
          <div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tf('Set hold')}
            </Button>
          </div>
        </form>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{tf('No retention holds.')}</p>
        ) : (
          <ul className="space-y-2">
            {items.map((d) => (
              <li key={d._id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
                <span>
                  <span className="font-mono text-xs">{d._id}</span> · {d.retentionHold?.reference} · {d.retentionHold?.reason} ·{' '}
                  {d.retentionHold?.until ? `${tf('until')} ${new Date(d.retentionHold.until).toLocaleDateString('en-IN')}` : tf('until lifted')}
                </span>
                <Button variant="outline" size="sm" onClick={() => lift(d._id)}>
                  {tf('Lift hold')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
