import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  FolderKanban,
  Layers,
  MapPin,
  PieChart as PieIcon,
  RotateCcw,
  ScrollText,
  UserPlus,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { downloadBlob, formatDate } from '@/lib/utils';
import { useClusterFormText } from '@/lib/clusterDprFormText';

type RangeId = 'all' | '7' | '30' | '90' | 'custom';
type DprStatus = 'draft' | 'submitted' | 'analyzed' | 'completed' | 'rejected';

interface Overview {
  options: { districts: string[]; sectors: string[] };
  kpis: {
    users: { total: number; entrepreneurs: number };
    projects: { total: number; completed: number };
    dprs: { total: number; completed: number; avgQuality: number | null; scored: number };
  };
  dprStatus: Array<{ status: DprStatus; count: number }>;
  sectors: Array<{ name: string; count: number }>;
  districts: Array<{ name: string; count: number }>;
  activity: Array<{ id: string; at: string; action: string; user: string | null; role: string | null; targetType: string | null; targetId: string | null; status: string | null }>;
}

interface AnalyticsOverviewProps {
  /** Opens another Admin tab; for DPR Management a status can come with it. */
  onOpenTab: (tab: 'users' | 'dprs' | 'audit', dprStatus?: string) => void;
}

/** Colours are chosen to stay readable on light and dark pages; the words and numbers always carry the meaning too. */
const STATUS_COLOR: Record<DprStatus, string> = {
  draft: '#d97706',
  submitted: '#2563eb',
  analyzed: '#7c3aed',
  completed: '#059669',
  rejected: '#dc2626',
};
const SECTOR_COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#65a30d', '#64748b'];
const DISTRICT_SHOWN = 8;
const SECTOR_SHOWN = 8;

const ACTIVITY: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  dpr_change: { label: 'DPR saved or updated', icon: FileText },
  dpr_review: { label: 'DPR reviewed', icon: CheckCircle2 },
  dpr_download: { label: 'DPR downloaded', icon: Download },
  dpr_delete: { label: 'Project deleted', icon: FolderKanban },
  register: { label: 'User registered', icon: UserPlus },
  user_invite: { label: 'User invited', icon: UserPlus },
  invite_accepted: { label: 'Invitation accepted', icon: UserPlus },
  user_update: { label: 'User details changed', icon: Users },
  role_change: { label: 'User role changed', icon: Users },
  user_deactivate: { label: 'User deactivated', icon: Users },
  user_reactivate: { label: 'User reactivated', icon: Users },
  account_delete: { label: 'Account deleted', icon: Users },
  complaint_submitted: { label: 'Complaint submitted', icon: ScrollText },
  support_ticket: { label: 'Support ticket raised', icon: ScrollText },
  data_export: { label: 'Data exported', icon: Download },
};

const toDay = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** Spreadsheet programs run text that starts with = + - @ as a formula, so such cells get a leading quote. */
const csvCell = (value: unknown) => {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({ onOpenTab }) => {
  const tf = useClusterFormText();
  const navigate = useNavigate();
  const [range, setRange] = useState<RangeId>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [district, setDistrict] = useState('');
  const [sector, setSector] = useState('');
  const [activityLimit, setActivityLimit] = useState(10);
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAllDistricts, setShowAllDistricts] = useState(false);
  // While a slice is hovered its tooltip owns the middle of the donut, so the total steps aside.
  const [sliceHover, setSliceHover] = useState(false);
  const [message, setMessage] = useState('');
  const [options, setOptions] = useState<{ districts: string[]; sectors: string[] }>({ districts: [], sectors: [] });
  const request = useRef(0);

  const dates = useMemo(() => {
    if (range === 'all') return { from: '', to: '' };
    if (range === 'custom') return { from: customFrom, to: customTo };
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (Number(range) - 1));
    return { from: toDay(start), to: toDay(end) };
  }, [range, customFrom, customTo]);

  const load = useCallback(async () => {
    const id = ++request.current;
    setLoading(true);
    setError('');
    try {
      const response = await api.getAnalyticsOverview({
        from: dates.from || undefined,
        to: dates.to || undefined,
        district: district || undefined,
        sector: sector || undefined,
        activityLimit,
      });
      if (id !== request.current) return; // a newer choice has already been asked for
      setData(response.data);
      // The lists hold everything that exists, so a filter never hides its own other choices.
      setOptions({ districts: response.data.options.districts, sectors: response.data.options.sectors });
      setMessage(tf('Analytics updated.'));
    } catch (failure: any) {
      if (id !== request.current) return;
      setError(failure?.response?.data?.message || tf('Could not load the analytics. Please try again.'));
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, [dates.from, dates.to, district, sector, activityLimit, tf]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtersActive = range !== 'all' || Boolean(district) || Boolean(sector);
  const reset = () => {
    setRange('all');
    setCustomFrom('');
    setCustomTo('');
    setDistrict('');
    setSector('');
  };
  const rangeLabel =
    range === 'all' ? tf('All time')
    : range === 'custom' ? `${dates.from || '…'} → ${dates.to || '…'}`
    : tf(`Last ${range} days`);
  const appliedText = `${rangeLabel} · ${district || tf('All districts')} · ${sector || tf('All sectors')}`;

  const statusLabel: Record<DprStatus, string> = {
    draft: tf('Draft'),
    submitted: tf('Submitted'),
    analyzed: tf('Analyzed'),
    completed: tf('Completed'),
    rejected: tf('Rejected'),
  };

  const kpis = data?.kpis;
  const empty = Boolean(data) && data!.kpis.projects.total === 0 && data!.kpis.dprs.total === 0 && filtersActive;
  const dprTotal = kpis?.dprs.total ?? 0;
  const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : null);

  const exportReport = () => {
    if (!data) return;
    const rows: unknown[][] = [
      [tf('MSME DPR Tool: admin analytics')],
      [tf('Exported'), new Date().toISOString()],
      [tf('Filters'), appliedText],
      [],
      [tf('Summary'), tf('Value')],
      [tf('Total users'), data.kpis.users.total],
      [tf('Entrepreneurs'), data.kpis.users.entrepreneurs],
      [tf('Total projects'), data.kpis.projects.total],
      [tf('Completed projects'), data.kpis.projects.completed],
      [tf('DPRs'), data.kpis.dprs.total],
      [tf('Completed DPRs'), data.kpis.dprs.completed],
      [tf('Average DPR quality'), data.kpis.dprs.avgQuality ?? 'N/A'],
      [],
      [tf('DPR status'), tf('Count')],
      ...data.dprStatus.map((row) => [statusLabel[row.status], row.count]),
      [],
      [tf('Business sector'), tf('Projects')],
      ...data.sectors.map((row) => [row.name, row.count]),
      [],
      [tf('District'), tf('Projects')],
      ...data.districts.map((row) => [row.name, row.count]),
      [],
      [tf('Recent activity'), tf('User'), tf('Date and time'), tf('Status')],
      ...data.activity.map((row) => [ACTIVITY[row.action]?.label || row.action, row.user || '', row.at, row.status || '']),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
    downloadBlob(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), `admin-analytics-${toDay(new Date())}.csv`);
    setMessage(`${tf('Report exported')}: ${appliedText}`);
  };

  const selectClass = 'h-11 min-w-0 rounded-lg border border-input bg-background pl-9 pr-8 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring';
  const dateClass = 'h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring';
  const cardClass = 'min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-5';

  const kpiCards = [
    {
      key: 'users', label: tf('Total Users'), value: kpis?.users.total, icon: Users, tint: 'bg-primary/10 text-primary',
      note: `${tf('Entrepreneurs:')} ${kpis?.users.entrepreneurs ?? 0}${district || sector ? ` · ${tf('not filtered by district or sector')}` : ''}`,
      go: () => onOpenTab('users'),
    },
    {
      key: 'projects', label: tf('Total Projects'), value: kpis?.projects.total, icon: FolderKanban, tint: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
      note: `${tf('Completed:')} ${kpis?.projects.completed ?? 0}`,
      go: () => navigate('/projects'),
    },
    {
      key: 'dprs', label: tf('DPRs Generated'), value: kpis?.dprs.total, icon: FileText, tint: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
      note: kpis?.dprs.avgQuality != null ? `${tf('Avg Quality:')} ${kpis.dprs.avgQuality}/100` : tf('Average quality not available yet'),
      go: () => onOpenTab('dprs'),
    },
    {
      key: 'completed', label: tf('Completed DPRs'), value: kpis?.dprs.completed, icon: CheckCircle2, tint: 'bg-warning/10 text-warning-text',
      note: pct(kpis?.dprs.completed ?? 0, dprTotal) ? `${pct(kpis?.dprs.completed ?? 0, dprTotal)} ${tf('of total')}` : tf('No DPRs yet'),
      go: () => onOpenTab('dprs', 'approved'),
    },
  ];

  const sectorRows = useMemo(() => {
    const rows = data?.sectors || [];
    if (rows.length <= SECTOR_SHOWN) return rows;
    const rest = rows.slice(SECTOR_SHOWN - 1);
    return [...rows.slice(0, SECTOR_SHOWN - 1), { name: tf('Other'), count: rest.reduce((sum, row) => sum + row.count, 0), merged: true } as any];
  }, [data, tf]);
  const sectorTotal = (data?.sectors || []).reduce((sum, row) => sum + row.count, 0);
  const districtRows = (data?.districts || []).slice(0, showAllDistricts ? undefined : DISTRICT_SHOWN);

  const statusRows = (data?.dprStatus || []).map((row) => ({ ...row, label: statusLabel[row.status] }));
  const chooseStatus = (status: DprStatus) => onOpenTab('dprs', status === 'completed' ? 'approved' : status === 'analyzed' ? undefined : status);

  const tip = (render: (payload: any) => React.ReactNode) => ({ active, payload }: any) =>
    active && payload?.length ? (
      <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg">{render(payload[0].payload)}</div>
    ) : null;

  return (
    <div className="space-y-5" aria-busy={loading}>
      <p className="sr-only" role="status" aria-live="polite">{loading ? '' : message}</p>

      {/* Filters */}
      <section aria-label={tf('Filters')} className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <select value={range} onChange={(e) => setRange(e.target.value as RangeId)} className={selectClass} aria-label={tf('Date range')}>
              <option value="all">{tf('All time')}</option>
              <option value="7">{tf('Last 7 days')}</option>
              <option value="30">{tf('Last 30 days')}</option>
              <option value="90">{tf('Last 90 days')}</option>
              <option value="custom">{tf('Custom range')}</option>
            </select>
          </div>
          {range === 'custom' && (
            <>
              <input type="date" value={customFrom} max={customTo || undefined} onChange={(e) => setCustomFrom(e.target.value)} className={dateClass} aria-label={tf('Start date')} />
              <span aria-hidden="true" className="text-muted-foreground">→</span>
              <input type="date" value={customTo} min={customFrom || undefined} onChange={(e) => setCustomTo(e.target.value)} className={dateClass} aria-label={tf('End date')} />
            </>
          )}
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <select value={district} onChange={(e) => setDistrict(e.target.value)} className={selectClass} aria-label={tf('District')}>
              <option value="">{tf('All districts')}</option>
              {options.districts.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          <div className="relative">
            <Layers className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <select value={sector} onChange={(e) => setSector(e.target.value)} className={`${selectClass} max-w-[16rem]`} aria-label={tf('Business sector')}>
              <option value="">{tf('All sectors')}</option>
              {options.sectors.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          {filtersActive && (
            <Button variant="outline" size="sm" onClick={reset} className="h-11 gap-1.5">
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> {tf('Reset Filters')}
            </Button>
          )}
          <Button variant="outline" onClick={exportReport} disabled={!data || loading} className="ml-auto h-11 gap-2">
            <Download className="h-4 w-4" aria-hidden="true" /> {tf('Export Report')}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground" data-testid="applied-filters">{tf('Showing')}: {appliedText}</p>
      </section>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-text">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => void load()}>{tf('Try again')}</Button>
        </div>
      )}

      {empty ? (
        <div className="rounded-2xl border border-dashed border-border px-4 py-16 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground" aria-hidden="true"><BarChart3 className="h-7 w-7" /></span>
          <h2 className="text-lg font-semibold">{tf('No records match these filters')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{tf('Try a wider date range, or another district or sector.')}</p>
          <Button variant="primary" onClick={reset} className="mt-5 gap-2"><RotateCcw className="h-4 w-4" aria-hidden="true" />{tf('Reset Filters')}</Button>
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <section aria-label={tf('Summary')} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={card.go}
                  className="group flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transform-none motion-reduce:transition-none"
                >
                  <span className={`flex h-12 w-12 flex-none items-center justify-center rounded-xl ${card.tint}`} aria-hidden="true"><Icon className="h-6 w-6" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">{card.label}</span>
                    {loading && !data ? (
                      <span className="mt-1 block h-8 w-14 animate-pulse rounded bg-muted" />
                    ) : (
                      <span className="block text-3xl font-bold leading-tight text-foreground">{card.value ?? 'N/A'}</span>
                    )}
                    <span className="block text-xs leading-snug text-muted-foreground">{card.note}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 flex-none text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" />
                </button>
              );
            })}
          </section>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <section aria-labelledby="chart-status" className={cardClass}>
              <header className="flex items-start gap-3">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden="true"><FileText className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <h2 id="chart-status" className="text-base font-semibold text-foreground">{tf('DPR Status Overview')}</h2>
                  <p className="text-sm text-muted-foreground">{tf('Current status of all DPRs in the system')}</p>
                </div>
              </header>
              {dprTotal === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">{tf('No DPRs for these filters.')}</p>
              ) : (
                <div className="mt-3 h-60" role="img" aria-label={statusRows.map((row) => `${row.label}: ${row.count}`).join(', ')}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusRows} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 0 }}>
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="currentColor" className="text-muted-foreground" />
                      <YAxis type="category" dataKey="label" width={84} tick={{ fontSize: 13 }} stroke="currentColor" className="text-foreground" />
                      <Tooltip
                        cursor={{ fill: 'rgba(100,116,139,0.12)' }}
                        content={tip((row) => (
                          <>
                            <p className="font-semibold">{row.label}</p>
                            <p>{row.count} {tf('DPRs')}{pct(row.count, dprTotal) ? ` · ${pct(row.count, dprTotal)}` : ''}</p>
                            <p className="text-xs text-muted-foreground">{tf('Click to open')}</p>
                          </>
                        ))}
                      />
                      <Bar dataKey="count" isAnimationActive={false} radius={[0, 6, 6, 0]} cursor="pointer" label={{ position: 'right', fontSize: 12, fill: 'currentColor' }} onClick={(row: any) => chooseStatus(row.status)}>
                        {statusRows.map((row) => <Cell key={row.status} fill={STATUS_COLOR[row.status]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {/* The same numbers as buttons: keyboard users can open each status, and every status is named in words. */}
              <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {statusRows.map((row) => (
                  <li key={row.status}>
                    <button type="button" onClick={() => chooseStatus(row.status)} className="inline-flex items-center gap-1.5 rounded px-1 py-0.5 text-xs text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLOR[row.status] }} aria-hidden="true" />
                      {row.label} <strong className="text-foreground">{row.count}</strong>
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => onOpenTab('dprs')} className="mt-2 inline-flex items-center gap-1 rounded text-sm font-medium text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
                {tf('View DPRs')} <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </section>

            <section aria-labelledby="chart-sector" className={cardClass}>
              <header className="flex items-start gap-3">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300" aria-hidden="true"><PieIcon className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <h2 id="chart-sector" className="text-base font-semibold text-foreground">{tf('Projects by Business Sector')}</h2>
                  <p className="text-sm text-muted-foreground">{tf('Distribution of projects across business sectors')}</p>
                </div>
              </header>
              {sectorTotal === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">{tf('No projects for these filters.')}</p>
              ) : (
                <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                  <div className="relative h-40 w-40 flex-none" role="img" aria-label={sectorRows.map((row: any) => `${row.name}: ${row.count}`).join(', ')}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={sectorRows} isAnimationActive={false} onMouseEnter={() => setSliceHover(true)} onMouseLeave={() => setSliceHover(false)} dataKey="count" nameKey="name" innerRadius={46} outerRadius={72} paddingAngle={1} cursor="pointer" onClick={(row: any) => !row.merged && setSector(row.name)}>
                          {sectorRows.map((row: any, index: number) => <Cell key={row.name} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} stroke="none" aria-label={`${row.name}: ${row.count}`} />)}
                        </Pie>
                        <Tooltip wrapperStyle={{ zIndex: 30 }} content={tip((row) => (<><p className="font-semibold">{row.name}</p><p>{row.count} {tf('projects')} · {pct(row.count, sectorTotal)}</p></>))} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className={`pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center transition-opacity motion-reduce:transition-none ${sliceHover ? 'opacity-0' : 'opacity-100'}`}>
                      <span className="text-2xl font-bold text-foreground">{sectorTotal}</span>
                      <span className="text-xs text-muted-foreground">{tf('Projects')}</span>
                    </div>
                  </div>
                  <ul className="min-w-0 flex-1 space-y-1 self-stretch">
                    {sectorRows.map((row: any, index: number) => (
                      <li key={row.name}>
                        <button
                          type="button"
                          disabled={row.merged}
                          onClick={() => setSector(row.name)}
                          title={row.merged ? undefined : `${tf('Filter by')} ${row.name}`}
                          className="flex w-full items-start gap-2 rounded px-1 py-1 text-left text-sm text-foreground hover:bg-muted/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-default disabled:hover:bg-transparent"
                        >
                          <span className="mt-1.5 h-2.5 w-2.5 flex-none rounded-full" style={{ background: SECTOR_COLORS[index % SECTOR_COLORS.length] }} aria-hidden="true" />
                          <span className="min-w-0 flex-1 break-words leading-snug">{row.name}</span>
                          <span className="flex-none font-semibold tabular-nums">{row.count}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section aria-labelledby="chart-district" className={`${cardClass} lg:col-span-2 xl:col-span-1`}>
              <header className="flex items-start gap-3">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-success/10 text-success-text" aria-hidden="true"><MapPin className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <h2 id="chart-district" className="text-base font-semibold text-foreground">{tf('Projects by District')}</h2>
                  <p className="text-sm text-muted-foreground">{tf('Distribution of projects across districts')}</p>
                </div>
              </header>
              {districtRows.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">{tf('No projects for these filters.')}</p>
              ) : (
                <div
                  className={`mt-3 ${showAllDistricts ? 'max-h-80 overflow-y-auto pr-1' : ''}`}
                  role="img"
                  aria-label={districtRows.map((row) => `${row.name}: ${row.count}`).join(', ')}
                >
                  <div style={{ height: Math.max(districtRows.length * 34 + 30, 150) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={districtRows} layout="vertical" margin={{ top: 0, right: 36, bottom: 0, left: 0 }}>
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="currentColor" className="text-muted-foreground" />
                        <YAxis type="category" dataKey="name" width={96} tick={{ fontSize: 12 }} interval={0} stroke="currentColor" className="text-foreground" tickFormatter={(name: string) => (name.length > 13 ? `${name.slice(0, 12)}…` : name)} />
                        <Tooltip
                          cursor={{ fill: 'rgba(100,116,139,0.12)' }}
                          content={tip((row) => (<><p className="font-semibold">{row.name}</p><p>{row.count} {tf('projects')}</p><p className="text-xs text-muted-foreground">{tf('Click to filter')}</p></>))}
                        />
                        <Bar dataKey="count" isAnimationActive={false} fill="#059669" radius={[0, 6, 6, 0]} cursor="pointer" label={{ position: 'right', fontSize: 12, fill: 'currentColor' }} onClick={(row: any) => row.name !== tf('Not specified') && row.name !== 'Not specified' && setDistrict(row.name)} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              {(data?.districts.length || 0) > DISTRICT_SHOWN && (
                <button type="button" onClick={() => setShowAllDistricts((open) => !open)} className="mt-2 rounded text-sm font-medium text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
                  {showAllDistricts ? tf('Show top districts only') : `${tf('View All Districts')} (${data?.districts.length})`}
                </button>
              )}
              {/* Names and counts as words, for anyone who cannot see the chart. */}
              <ul className="sr-only">{(data?.districts || []).map((row) => <li key={row.name}>{row.name}: {row.count}</li>)}</ul>
            </section>
          </div>

          {/* Recent activity */}
          <section aria-labelledby="recent-activity" className="min-w-0 rounded-2xl border border-border bg-card">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 sm:p-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden="true"><ScrollText className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <h2 id="recent-activity" className="text-base font-semibold text-foreground">{tf('Recent Activity')}</h2>
                  <p className="text-sm text-muted-foreground">{tf('Latest platform activities and updates')}</p>
                </div>
              </div>
              <button type="button" onClick={() => onOpenTab('audit')} className="inline-flex items-center gap-1 rounded text-sm font-medium text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
                {tf('View All')} <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>
            {!data ? (
              <div className="space-y-2 p-4 sm:p-5" aria-label={tf('Loading')}>{[0, 1, 2].map((n) => <div key={n} className="h-10 animate-pulse rounded bg-muted" />)}</div>
            ) : data.activity.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">{tf('No activity in this period.')}</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-muted/50 text-xs font-semibold text-muted-foreground">
                        <th scope="col" className="px-4 py-2.5 sm:px-5">{tf('Activity')}</th>
                        <th scope="col" className="px-3 py-2.5">{tf('User')}</th>
                        <th scope="col" className="px-3 py-2.5">{tf('Date and time')}</th>
                        <th scope="col" className="px-3 py-2.5">{tf('Status')}</th>
                        <th scope="col" className="px-4 py-2.5 sm:px-5">{tf('Action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.activity.map((row) => {
                        const meta = ACTIVITY[row.action] || { label: row.action.replace(/_/g, ' '), icon: ScrollText };
                        const Icon = meta.icon;
                        const view =
                          row.targetType === 'dpr' && row.targetId ? () => navigate(`/dpr/view/${row.targetId}`)
                          : row.targetType === 'user' ? () => onOpenTab('users')
                          : null;
                        const state = row.status as DprStatus | null;
                        return (
                          <tr key={row.id} className="hover:bg-muted/30">
                            <td className="px-4 py-2.5 sm:px-5">
                              <span className="flex items-center gap-2.5 font-medium text-foreground"><Icon className="h-4 w-4 flex-none text-muted-foreground" aria-hidden="true" />{tf(meta.label)}</span>
                            </td>
                            <td className="px-3 py-2.5 text-foreground">{row.user || <span className="text-muted-foreground">—</span>}</td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">{formatDate(row.at)} {new Date(row.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                            <td className="px-3 py-2.5">
                              {state && statusLabel[state] ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-foreground ring-1 ring-inset ring-border">
                                  <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[state] }} aria-hidden="true" />
                                  {statusLabel[state]}
                                </span>
                              ) : <span className="text-muted-foreground">—</span>}
                            </td>
                            <td className="px-4 py-2.5 sm:px-5">
                              {view ? (
                                <button type="button" onClick={view} className="rounded text-sm font-medium text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" aria-label={`${tf('View')}: ${tf(meta.label)}`}>{tf('View')}</button>
                              ) : <span className="text-muted-foreground">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {activityLimit < 50 && data.activity.length >= activityLimit && (
                  <div className="border-t border-border p-3 text-center">
                    <Button variant="outline" size="sm" onClick={() => setActivityLimit((n) => Math.min(n + 10, 50))}>{tf('Show more')}</Button>
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
};
