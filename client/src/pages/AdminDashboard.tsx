// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/api';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Users,
  FileText,
  BarChart3,
  Shield,
  CheckCircle,
  XCircle,
  Search,
  Edit,
  Trash2,
  Plus,
  Eye,
  Filter,
  TrendingUp,
  Award,
  X,
  Calendar,
  Tag,
  AlertCircle,
  Save,
  ScrollText,
  Download,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { formatDate, downloadBlob } from '@/lib/utils';
import { APP_ROLES, ROLE_META, toAppRole, toBackendRole, type AppRole } from '@/lib/rbac';
import { RoleBadge } from '@/components/auth/RolePicker';
import { AP_DISTRICTS } from '@/lib/individualDpr/apDistricts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

type TabType = 'analytics' | 'users' | 'dprs' | 'policies' | 'access' | 'audit';

export const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const tf = useClusterFormText();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [dprs, setDprs] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'govt_official' as AppRole, district: '' });
  const [inviteResult, setInviteResult] = useState<{ url: string; expiresAt: string } | null>(null);
  const [deactivatePrompt, setDeactivatePrompt] = useState<{ userId: string; name: string; reason: string } | null>(null);
  const [auditVerdict, setAuditVerdict] = useState<{ ok: boolean; checked: number; problem?: { seq: number; reason: string } } | null>(null);
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [reviewerPrompt, setReviewerPrompt] = useState<{ userId: string; name: string; district: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);
  const [policyForm, setPolicyForm] = useState({
    title: '',
    description: '',
    category: 'dpr',
    content: '',
    status: 'draft',
    priority: 'medium',
    tags: '',
    effectiveDate: '',
    expiryDate: '',
  });
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditFilters, setAuditFilters] = useState({
    userId: '',
    action: '',
    from: '',
    to: '',
  });

  useEffect(() => {
    loadData();
  }, [activeTab, statusFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'access') {
        return;
      }
      if (activeTab === 'analytics') {
        const response = await api.getAnalytics();
        setAnalytics(response.data);
      } else if (activeTab === 'users') {
        const response = await api.getAllUsers({ limit: 50 });
        setUsers(response.data.users || []);
      } else if (activeTab === 'dprs') {
        const response = await api.getAllDPRsAdmin({ limit: 50, status: statusFilter !== 'all' ? statusFilter : undefined });
        setDprs(response.data.dprs || []);
      } else if (activeTab === 'policies') {
        const response = await api.getAllPolicies({ limit: 50, status: statusFilter !== 'all' ? statusFilter : undefined });
        setPolicies(response.data.policies || []);
      } else if (activeTab === 'audit') {
        const response = await api.getAuditLog({
          userId: auditFilters.userId || undefined,
          action: auditFilters.action || undefined,
          from: auditFilters.from || undefined,
          to: auditFilters.to || undefined,
          limit: 100,
        });
        setAuditEvents(response.data?.events || []);
        setAuditTotal(response.data?.pagination?.total || 0);
        api.getAiStatus().then((s: any) => setAiStatus(s.data)).catch(() => undefined);
      }
    } catch (error: any) {
      console.error('Failed to load data:', error);
      toast.error(error.response?.data?.message || tf('Failed to load data'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveDPR = async (dprId: string) => {
    try {
      await api.approveDPR(dprId);
      toast.success(tf('DPR approved successfully'));
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || tf('Failed to approve DPR'));
    }
  };

  const handleRejectDPR = async (dprId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    try {
      await api.rejectDPR(dprId, reason);
      toast.success(tf('DPR rejected successfully'));
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || tf('Failed to reject DPR'));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await api.deleteUserAdmin(userId);
      toast.success(tf('User deleted successfully'));
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || tf('Failed to delete user'));
    }
  };

  const handleInvite = async () => {
    try {
      const backendRole = toBackendRole(inviteForm.role);
      const res = await api.inviteUser({
        name: inviteForm.name,
        email: inviteForm.email,
        role: backendRole,
        reviewDistrict: backendRole === 'officer' ? inviteForm.district : undefined,
      });
      setInviteResult({ url: res.data.inviteUrl, expiresAt: res.data.expiresAt });
      loadData();
    } catch {
      // the API client shows the server's message
    }
  };

  const handleDeactivate = async () => {
    if (!deactivatePrompt) return;
    try {
      await api.deactivateUser(deactivatePrompt.userId, deactivatePrompt.reason);
      toast.success(tf('Account deactivated. Active sessions are being ended now.'));
      setDeactivatePrompt(null);
      loadData();
    } catch {
      // the API client shows the server's message
    }
  };

  const handleReactivate = async (userId: string) => {
    try {
      await api.reactivateUser(userId);
      toast.success(tf('Account reactivated. The person has to sign in again.'));
      loadData();
    } catch {
      // the API client shows the server's message
    }
  };

  const handleRevokeSessions = async (userId: string) => {
    try {
      await api.revokeUserSessions(userId);
      toast.success(tf('Signed out everywhere.'));
    } catch {
      // the API client shows the server's message
    }
  };

  const handleVerifyAudit = async () => {
    try {
      const res = await api.verifyAuditLog();
      setAuditVerdict(res.data);
    } catch {
      setAuditVerdict(null);
    }
  };

  const handleUpdateUserRole = async (userId: string, role: AppRole, district?: string) => {
    const backendRole = toBackendRole(role);
    const target = users.find((u) => u._id === userId);
    // A District Reviewer must be tied to a district, so ask for it before saving.
    if (backendRole === 'officer' && !district) {
      setReviewerPrompt({ userId, name: target?.name || '', district: target?.reviewDistrict || '' });
      return;
    }
    setUpdatingUserId(userId);
    try {
      const response = await api.updateUserAdmin(userId, {
        role: backendRole,
        ...(backendRole === 'officer' ? { reviewDistrict: district } : {}),
      });
      const saved = response?.data?.user;
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId
            ? { ...u, role: backendRole, reviewDistrict: backendRole === 'officer' ? saved?.reviewDistrict ?? district : undefined }
            : u
        )
      );
      setReviewerPrompt(null);
      toast.success(t('rbac.roleUpdated'));
    } catch {
      // the API client shows the server's message; the list keeps the old role
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDownloadAuditCsv = async () => {
    try {
      const blob = await api.downloadAuditCsv({
        userId: auditFilters.userId || undefined,
        action: auditFilters.action || undefined,
        from: auditFilters.from || undefined,
        to: auditFilters.to || undefined,
      });
      downloadBlob(blob, 'audit-log.csv');
      toast.success(tf('Audit CSV downloading'));
    } catch (error: any) {
      toast.error(error.response?.data?.message || tf('Failed to download audit CSV'));
    }
  };

  const handleRunRetention = async () => {
    try {
      const response = await api.runRetentionJob();
      const data = response.data || {};
      toast.success(tf('Retention: warned {warned}, purged {purged}').replace('{warned}', String(data.warned || 0)).replace('{purged}', String(data.purged || 0)));
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || tf('Failed to run retention'));
    }
  };

  const handleSavePolicy = async () => {
    if (!policyForm.title || !policyForm.description || !policyForm.content) {
      toast.error(tf('Please fill in all required fields'));
      return;
    }

    try {
      const policyData = {
        ...policyForm,
        tags: policyForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        effectiveDate: policyForm.effectiveDate || undefined,
        expiryDate: policyForm.expiryDate || undefined,
        metadata: {
          priority: policyForm.priority,
          requiresApproval: false,
        },
      };

      if (editingPolicy) {
        await api.updatePolicy(editingPolicy._id, policyData);
        toast.success(tf('Policy updated successfully'));
      } else {
        await api.createPolicy(policyData);
        toast.success(tf('Policy created successfully'));
      }
      setShowPolicyModal(false);
      setEditingPolicy(null);
      setPolicyForm({
        title: '',
        description: '',
        category: 'dpr',
        content: '',
        status: 'draft',
        priority: 'medium',
        tags: '',
        effectiveDate: '',
        expiryDate: '',
      });
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || tf('Failed to save policy'));
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    try {
      await api.deletePolicy(policyId);
      toast.success(tf('Policy deleted successfully'));
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || tf('Failed to delete policy'));
    }
  };

  const handleEditPolicy = (policy: any) => {
    setEditingPolicy(policy);
    setPolicyForm({
      title: policy.title,
      description: policy.description,
      category: policy.category,
      content: policy.content,
      status: policy.status,
      priority: policy.metadata?.priority || 'medium',
      tags: policy.tags?.join(', ') || '',
      effectiveDate: policy.effectiveDate ? new Date(policy.effectiveDate).toISOString().split('T')[0] : '',
      expiryDate: policy.expiryDate ? new Date(policy.expiryDate).toISOString().split('T')[0] : '',
    });
    setShowPolicyModal(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 ' + tf('Bytes');
    const k = 1024;
    const sizes = [tf('Bytes'), 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const summary = analytics?.summary || {};
  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredDPRs = dprs.filter(d =>
    d.projectId?.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.projectId?.industrySector?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredPolicies = policies.filter(p =>
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'analytics' as TabType, label: tf('Analytics'), icon: BarChart3 },
    { id: 'users' as TabType, label: tf('User Management'), icon: Users },
    { id: 'access' as TabType, label: t('rbac.accessControl'), icon: Shield },
    { id: 'dprs' as TabType, label: tf('DPR Management'), icon: FileText },
    { id: 'policies' as TabType, label: tf('Policies'), icon: Shield },
    { id: 'audit' as TabType, label: tf('Audit log'), icon: ScrollText },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{tf('Admin Dashboard')}</h1>
          <p className="text-muted-foreground mt-2">
            {tf('Manage users, DPRs, policies, and view analytics')}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-border">
          <div className="flex gap-1 overflow-x-auto" role="tablist">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-3 font-medium border-b-2 transition-all sm:px-6 ${
                    activeTab === tab.id
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{tf('Loading analytics...')}</p>
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="motion-stagger grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">{tf('Total Users')}</p>
                          <h3 className="text-3xl font-bold mt-2">{summary.totalUsers || 0}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {tf('Entrepreneurs:')} {summary.totalEntrepreneurs || 0}
                          </p>
                        </div>
                        <Users className="h-12 w-12 text-blue-500 opacity-20" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">{tf('Total Projects')}</p>
                          <h3 className="text-3xl font-bold mt-2">{summary.totalProjects || 0}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {tf('Completed:')} {summary.completedProjects || 0}
                          </p>
                        </div>
                        <FileText className="h-12 w-12 text-green-500 opacity-20" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">{tf('DPRs Generated')}</p>
                          <h3 className="text-3xl font-bold mt-2">{summary.totalDPRs || 0}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {tf('Avg Quality:')} {summary.avgQualityScore || 0}%
                          </p>
                        </div>
                        <TrendingUp className="h-12 w-12 text-purple-500 opacity-20" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="motion-stagger grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{tf('Projects by Sector')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={analytics?.projectsBySector || []}
                            dataKey="count"
                            nameKey="_id"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                          >
                            {(analytics?.projectsBySector || []).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{tf('Projects by Location')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics?.projectsByLocation || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="_id" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={tf('Search users...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button onClick={() => { setInviteResult(null); setInviteOpen(true); }}>{tf('Invite user')}</Button>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{tf('Loading users...')}</p>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {filteredUsers.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <h4 className="font-semibold">{user.name}</h4>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex gap-2 mt-2 items-center flex-wrap">
                            <RoleBadge role={user.role} />
                            {user.isActive === false && (
                              <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800" data-user-status="deactivated">{tf('Deactivated')}</span>
                            )}
                            {user.invite?.expiresAt && (
                              <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-900" data-user-status="invited">{tf('Invitation pending')}</span>
                            )}
                            {user.role === 'officer' && user.reviewDistrict && (
                              <span className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-800">
                                {tf(user.reviewDistrict)}
                              </span>
                            )}
                            {user.location && (
                              <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                                {user.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 items-center">
                          <select
                            value={toAppRole(user.role)}
                            disabled={updatingUserId === user._id}
                            onChange={(e) => handleUpdateUserRole(user._id, e.target.value as AppRole)}
                            className="px-3 py-2 border rounded-lg text-sm bg-background"
                            aria-label={t('rbac.updateRole')}
                          >
                            {APP_ROLES.map((role) => (
                              <option key={role} value={role}>
                                {t(ROLE_META[role].labelKey)}
                              </option>
                            ))}
                          </select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/users/${user._id}`)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            {tf('Edit')}
                          </Button>
                          {user.isActive === false ? (
                            <Button variant="outline" size="sm" onClick={() => handleReactivate(user._id)}>{tf('Reactivate')}</Button>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => setDeactivatePrompt({ userId: user._id, name: user.name, reason: '' })}>{tf('Deactivate')}</Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeSessions(user._id)}
                            data-confirm-title={tf('Sign this person out everywhere?')}
                            data-confirm-body={tf('{name} will have to sign in again on every device.').replace('{name}', String(user.name))}
                          >
                            {tf('Sign out everywhere')}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user._id)}
                            data-confirm-title={tf('Delete this user?')}
                            data-confirm-body={tf('{name} ({email}) will be removed. This cannot be undone.').replace('{name}', String(user.name)).replace('{email}', String(user.email))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'access' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">{t('rbac.accessControl')}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t('rbac.accessControlHint')}</p>
              <p className="text-xs text-muted-foreground mt-2">{t('rbac.uiOnlyNote')}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {APP_ROLES.map((role) => {
                const meta = ROLE_META[role];
                return (
                  <Card key={role} className={`border-2 ${meta.accent}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between gap-2">
                        <span>{t(meta.labelKey)}</span>
                        <RoleBadge role={role} />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{t(meta.descriptionKey)}</p>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-2">{t('rbac.permissions')}</p>
                      <ul className="space-y-2 text-sm">
                        {meta.permissionKeys.map((key) => (
                          <li key={key} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                            <span>{t(key)}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* DPR Management Tab */}
        {activeTab === 'dprs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={tf('Search DPRs...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    loadData();
                  }}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="all">{tf('All Status')}</option>
                  <option value="draft">{tf('Draft')}</option>
                  <option value="submitted">{tf('Submitted')}</option>
                  <option value="approved">{tf('Approved')}</option>
                  <option value="rejected">{tf('Rejected')}</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{tf('Loading DPRs...')}</p>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="motion-stagger space-y-4">
                    {filteredDPRs.map((dpr) => (
                      <div
                        key={dpr._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold">{dpr.projectId?.projectName || tf('Untitled Project')}</h4>
                          <p className="text-sm text-muted-foreground">
                            {tf(String(dpr.projectId?.industrySector ?? ''))} • {dpr.projectId?.location}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                dpr.status === 'approved'
                                  ? 'bg-success/10 text-success'
                                  : dpr.status === 'rejected'
                                  ? 'bg-destructive/10 text-destructive'
                                  : dpr.status === 'submitted'
                                  ? 'bg-warning/10 text-warning'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {tf(dpr.status || 'draft')}
                            </span>
                            {dpr.qualityScore && (
                              <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                                {tf('Quality:')} {dpr.qualityScore}%
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDate(dpr.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/dpr/view/${dpr._id}`, { state: { updatedAt: dpr.updatedAt } })}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {tf('View')}
                          </Button>
                          {dpr.status === 'submitted' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-success border-success hover:bg-success hover:text-white"
                                onClick={() => handleApproveDPR(dpr._id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {tf('Approve')}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive border-destructive hover:bg-destructive hover:text-white"
                                onClick={() => handleRejectDPR(dpr._id)}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                {tf('Reject')}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="w-56">
                <Input
                  placeholder={tf('User id')}
                  value={auditFilters.userId}
                  onChange={(e) => setAuditFilters((prev) => ({ ...prev, userId: e.target.value }))}
                />
              </div>
              <div className="w-48">
                <Input
                  placeholder={tf('Action (e.g. login_success)')}
                  value={auditFilters.action}
                  onChange={(e) => setAuditFilters((prev) => ({ ...prev, action: e.target.value }))}
                />
              </div>
              <div>
                <Input
                  type="date"
                  value={auditFilters.from}
                  onChange={(e) => setAuditFilters((prev) => ({ ...prev, from: e.target.value }))}
                />
              </div>
              <div>
                <Input
                  type="date"
                  value={auditFilters.to}
                  onChange={(e) => setAuditFilters((prev) => ({ ...prev, to: e.target.value }))}
                />
              </div>
              <Button onClick={loadData}>{tf('Search')}</Button>
              <Button variant="outline" onClick={handleDownloadAuditCsv}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" onClick={handleRunRetention}>
                {tf('Run retention')}
              </Button>
              <Button variant="outline" onClick={handleVerifyAudit}>{tf('Verify integrity')}</Button>
            </div>
            {auditVerdict ? (
              <p role="status" data-audit-verdict={auditVerdict.ok} className={`rounded-md border p-3 text-sm ${auditVerdict.ok ? 'border-emerald-300 text-emerald-800' : 'border-red-300 text-red-800'}`}>
                {auditVerdict.ok
                  ? tf('The audit log is intact. {n} events checked.').replace('{n}', String(auditVerdict.checked))
                  : `${tf('The audit log has been tampered with')}: #${auditVerdict.problem?.seq} — ${auditVerdict.problem?.reason || ""}`}
              </p>
            ) : null}
            {aiStatus ? (
              <p className="rounded-md border p-3 text-sm text-muted-foreground" data-ai-status>
                {tf('AI gateway')}: {aiStatus.chatModel} · {tf('personal data is removed before anything is sent')} · {tf('OpenAI storage switched off')} ·{' '}
                {aiStatus.zeroRetentionConfirmed ? tf('zero data retention confirmed') : tf('zero data retention NOT yet confirmed (check the OpenAI account terms)')}
              </p>
            ) : null}
            <p className="text-sm text-muted-foreground">{tf('{n} events (showing latest 100)').replace('{n}', String(auditTotal))}</p>
            {isLoading ? (
              <p className="text-muted-foreground py-12 text-center">{tf('Loading audit log...')}</p>
            ) : (
              <Card>
                <CardContent className="pt-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2 pr-3">{tf('When')}</th>
                        <th className="py-2 pr-3">{tf('Action')}</th>
                        <th className="py-2 pr-3">{tf('User')}</th>
                        <th className="py-2 pr-3">{tf('Role')}</th>
                        <th className="py-2 pr-3">{tf('Target')}</th>
                        <th className="py-2 pr-3">{tf('Details')}</th>
                        <th className="py-2">IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditEvents.map((event) => (
                        <tr key={event._id} className="border-b last:border-0">
                          <td className="py-2 pr-3 whitespace-nowrap">
                            {event.at ? new Date(event.at).toLocaleString('en-IN') : ''}
                          </td>
                          <td className="py-2 pr-3 font-medium">{event.action}</td>
                          <td className="py-2 pr-3 font-mono text-xs">{event.userId || '—'}</td>
                          <td className="py-2 pr-3">{event.role || '—'}</td>
                          <td className="py-2 pr-3">
                            {event.targetType || '—'}
                            {event.targetId ? ` · ${event.targetId}` : ''}
                          </td>
                          <td className="py-2 pr-3 max-w-xs truncate font-mono text-xs" title={event.payload ? JSON.stringify(event.payload) : ''}>
                            {event.payload ? JSON.stringify(event.payload) : '—'}
                          </td>
                          <td className="py-2">{event.ip || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {auditEvents.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">{tf('No events match these filters.')}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Policies Tab */}
        {activeTab === 'policies' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={tf('Search policies...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => {
                    setEditingPolicy(null);
                    setPolicyForm({
                      title: '',
                      description: '',
                      category: 'dpr',
                      content: '',
                      status: 'draft',
                      priority: 'medium',
                      tags: '',
                      effectiveDate: '',
                      expiryDate: '',
                    });
                    setShowPolicyModal(true);
                  }}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {tf('New Policy')}
                </Button>
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    loadData();
                  }}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="all">{tf('All Status')}</option>
                  <option value="draft">{tf('Draft')}</option>
                  <option value="active">{tf('Active')}</option>
                  <option value="archived">{tf('Archived')}</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{tf('Loading policies...')}</p>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {filteredPolicies.map((policy) => (
                      <div
                        key={policy._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold">{policy.title}</h4>
                          <p className="text-sm text-muted-foreground">{policy.description}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                              {tf(policy.category)}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                policy.status === 'active'
                                  ? 'bg-success/10 text-success'
                                  : policy.status === 'archived'
                                  ? 'bg-muted text-muted-foreground'
                                  : 'bg-warning/10 text-warning'
                              }`}
                            >
                              {tf(policy.status)}
                            </span>
                            <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                              {tf(policy.metadata?.priority || 'medium')}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPolicy(policy)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            {tf('Edit')}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePolicy(policy._id)}
                            data-confirm-title={tf('Delete this policy?')}
                            data-confirm-body={tf('“{name}” will be removed. This cannot be undone.').replace('{name}', policy.title)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {inviteOpen && (
          <div className="motion-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <Card className="w-full max-w-md">
              <CardContent className="space-y-4 p-6">
                <h2 className="text-lg font-semibold">{tf('Invite a user')}</h2>
                {inviteResult ? (
                  <div className="space-y-3" data-invite-result>
                    <p className="text-sm text-muted-foreground">{tf('Share this link with the person. It works once and expires in 72 hours. It is not shown again.')}</p>
                    <input readOnly value={inviteResult.url} onFocus={(e) => e.currentTarget.select()} className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs" aria-label={tf('Invitation link')} />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => { void navigator.clipboard?.writeText(inviteResult.url); toast.success(tf('Link copied')); }}>{tf('Copy link')}</Button>
                      <Button variant="primary" onClick={() => setInviteOpen(false)}>{tf('Done')}</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Input label={tf('Name')} value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} />
                    <Input label={tf('Email')} type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} />
                    <label className="block text-sm font-medium">
                      {tf('Role')}
                      <select value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as AppRole })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        {APP_ROLES.map((role) => (
                          <option key={role} value={role}>{t(ROLE_META[role].labelKey)}</option>
                        ))}
                      </select>
                    </label>
                    {toBackendRole(inviteForm.role) === 'officer' && (
                      <label className="block text-sm font-medium">
                        {tf('District')}
                        <select value={inviteForm.district} onChange={(e) => setInviteForm({ ...inviteForm, district: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                          <option value="">{tf('Select a district')}</option>
                          {AP_DISTRICTS.map((name) => (
                            <option key={name} value={name}>{tf(name)}</option>
                          ))}
                        </select>
                      </label>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setInviteOpen(false)}>{tf('Cancel')}</Button>
                      <Button
                        variant="primary"
                        disabled={!inviteForm.name.trim() || !inviteForm.email.trim() || (toBackendRole(inviteForm.role) === 'officer' && !inviteForm.district)}
                        onClick={handleInvite}
                      >
                        {tf('Create invitation')}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {deactivatePrompt && (
          <div className="motion-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <Card className="w-full max-w-md">
              <CardContent className="space-y-4 p-6">
                <h2 className="text-lg font-semibold">{tf('Deactivate this account?')}</h2>
                <p className="text-sm text-muted-foreground">{tf('{name} will be signed out within seconds and cannot sign in again until you reactivate the account.').replace('{name}', deactivatePrompt.name)}</p>
                <Input label={tf('Reason (kept in the audit log)')} value={deactivatePrompt.reason} onChange={(e) => setDeactivatePrompt({ ...deactivatePrompt, reason: e.target.value })} />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDeactivatePrompt(null)}>{tf('Cancel')}</Button>
                  <Button variant="destructive" onClick={handleDeactivate}>{tf('Deactivate')}</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {reviewerPrompt && (
          <div className="motion-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <Card className="w-full max-w-md">
              <CardContent className="space-y-4 p-6">
                <h2 className="text-lg font-semibold">{tf('Assign a district')}</h2>
                <p className="text-sm text-muted-foreground">
                  {reviewerPrompt.name} {tf('will only see DPRs from this district.')}
                </p>
                <select
                  value={reviewerPrompt.district}
                  onChange={(e) => setReviewerPrompt({ ...reviewerPrompt, district: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  aria-label={tf('District')}
                >
                  <option value="">{tf('Select a district')}</option>
                  {AP_DISTRICTS.map((name) => (
                    <option key={name} value={name}>{tf(name)}</option>
                  ))}
                </select>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setReviewerPrompt(null)}>{tf('Cancel')}</Button>
                  <Button
                    variant="primary"
                    disabled={!reviewerPrompt.district || updatingUserId === reviewerPrompt.userId}
                    onClick={() => handleUpdateUserRole(reviewerPrompt.userId, 'govt_official', reviewerPrompt.district)}
                  >
                    {tf('Make District Reviewer')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Policy Modal */}
        {showPolicyModal && (
          <div className="motion-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <CardHeader className="flex-shrink-0 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">
                    {editingPolicy ? tf('Edit Policy') : tf('Create New Policy')}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowPolicyModal(false);
                      setEditingPolicy(null);
                      setPolicyForm({
                        title: '',
                        description: '',
                        category: 'dpr',
                        content: '',
                        status: 'draft',
                        priority: 'medium',
                        tags: '',
                        effectiveDate: '',
                        expiryDate: '',
                      });
                    }}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto pt-6 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {tf('Title')} <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={policyForm.title}
                    onChange={(e) => setPolicyForm({ ...policyForm, title: e.target.value })}
                    placeholder={tf('Enter policy title')}
                    className="h-11"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {tf('Description')} <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={policyForm.description}
                    onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })}
                    placeholder={tf('Brief description of the policy')}
                    className="h-11"
                  />
                </div>

                {/* Category and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {tf('Category')} <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={policyForm.category}
                      onChange={(e) => setPolicyForm({ ...policyForm, category: e.target.value })}
                      className="w-full h-11 px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="dpr">{tf('DPR')}</option>
                      <option value="user">{tf('User')}</option>
                      <option value="system">{tf('System')}</option>
                      <option value="financial">{tf('Financial')}</option>
                      <option value="compliance">{tf('Compliance')}</option>
                      <option value="other">{tf('Other')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      {tf('Priority')}
                    </label>
                    <select
                      value={policyForm.priority}
                      onChange={(e) => setPolicyForm({ ...policyForm, priority: e.target.value })}
                      className="w-full h-11 px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="low">{tf('Low')}</option>
                      <option value="medium">{tf('Medium')}</option>
                      <option value="high">{tf('High')}</option>
                      <option value="critical">{tf('Critical')}</option>
                    </select>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {tf('Status')}
                  </label>
                  <select
                    value={policyForm.status}
                    onChange={(e) => setPolicyForm({ ...policyForm, status: e.target.value })}
                    className="w-full h-11 px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="draft">{tf('Draft')}</option>
                    <option value="active">{tf('Active')}</option>
                    <option value="archived">{tf('Archived')}</option>
                    <option value="deprecated">{tf('Deprecated')}</option>
                  </select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {tf('Effective Date')}
                    </label>
                    <Input
                      type="date"
                      value={policyForm.effectiveDate}
                      onChange={(e) => setPolicyForm({ ...policyForm, effectiveDate: e.target.value })}
                      className="h-11"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {tf('Expiry Date')}
                    </label>
                    <Input
                      type="date"
                      value={policyForm.expiryDate}
                      onChange={(e) => setPolicyForm({ ...policyForm, expiryDate: e.target.value })}
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    {tf('Tags')}
                  </label>
                  <Input
                    value={policyForm.tags}
                    onChange={(e) => setPolicyForm({ ...policyForm, tags: e.target.value })}
                    placeholder={tf('Enter tags separated by commas (e.g., important, compliance, dpr)')}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {tf('Separate multiple tags with commas')}
                  </p>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {tf('Policy Content')} <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    value={policyForm.content}
                    onChange={(e) => setPolicyForm({ ...policyForm, content: e.target.value })}
                    placeholder={tf('Enter the full policy content here...')}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[300px] resize-y font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {policyForm.content.length} {tf('characters')}
                  </p>
                </div>
              </CardContent>
              <div className="flex-shrink-0 border-t p-6 bg-muted/30">
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPolicyModal(false);
                      setEditingPolicy(null);
                      setPolicyForm({
                        title: '',
                        description: '',
                        category: 'dpr',
                        content: '',
                        status: 'draft',
                        priority: 'medium',
                        tags: '',
                        effectiveDate: '',
                        expiryDate: '',
                      });
                    }}
                  >
                    {tf('Cancel')}
                  </Button>
                  <Button
                    onClick={handleSavePolicy}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingPolicy ? tf('Update Policy') : tf('Create Policy')}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};
