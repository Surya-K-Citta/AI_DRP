import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  Clock,
  Search,
  Edit,
  Trash2,
  Plus,
  Eye,
  Download,
  Filter,
  TrendingUp,
  Award,
  Target,
  Database,
  MessageSquare,
  HardDrive,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { formatDate } from '@/lib/utils';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

type TabType = 'analytics' | 'users' | 'dprs' | 'policies';

export const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [dprs, setDprs] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
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
      }
    } catch (error: any) {
      console.error('Failed to load data:', error);
      toast.error(error.response?.data?.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveDPR = async (dprId: string) => {
    try {
      await api.approveDPR(dprId);
      toast.success('DPR approved successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve DPR');
    }
  };

  const handleRejectDPR = async (dprId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    try {
      await api.rejectDPR(dprId, reason);
      toast.success('DPR rejected successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject DPR');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.deleteUserAdmin(userId);
      toast.success('User deleted successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleSavePolicy = async () => {
    try {
      const policyData = {
        ...policyForm,
        tags: policyForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        metadata: {
          priority: policyForm.priority,
          requiresApproval: false,
        },
      };

      if (editingPolicy) {
        await api.updatePolicy(editingPolicy._id, policyData);
        toast.success('Policy updated successfully');
      } else {
        await api.createPolicy(policyData);
        toast.success('Policy created successfully');
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
      });
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save policy');
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;
    try {
      await api.deletePolicy(policyId);
      toast.success('Policy deleted successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete policy');
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
    });
    setShowPolicyModal(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
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

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage users, DPRs, policies, and view analytics
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'analytics'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-2" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              User Management
            </button>
            <button
              onClick={() => setActiveTab('dprs')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'dprs'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              DPR Management
            </button>
            <button
              onClick={() => setActiveTab('policies')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'policies'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Shield className="h-4 w-4 inline mr-2" />
              Policies
            </button>
          </div>
        </div>

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading analytics...</p>
              </div>
            ) : (
              <>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <h3 className="text-3xl font-bold mt-2">{summary.totalUsers || 0}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Entrepreneurs: {summary.totalEntrepreneurs || 0}
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
                          <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                  <h3 className="text-3xl font-bold mt-2">{summary.totalProjects || 0}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Completed: {summary.completedProjects || 0}
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
                          <p className="text-sm font-medium text-muted-foreground">DPRs Generated</p>
                  <h3 className="text-3xl font-bold mt-2">{summary.totalDPRs || 0}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Avg Quality: {summary.avgQualityScore || 0}%
                  </p>
                </div>
                <TrendingUp className="h-12 w-12 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                          <p className="text-sm font-medium text-muted-foreground">Bankability Score</p>
                  <h3 className="text-3xl font-bold mt-2">{summary.avgBankabilityScore || 0}%</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Rating: {summary.averageRating || 0}/5
                  </p>
                </div>
                <Award className="h-12 w-12 text-yellow-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Projects by Sector</CardTitle>
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
              <CardTitle>Projects by Location</CardTitle>
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
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : (
          <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {filteredUsers.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                      >
                        <div>
                          <h4 className="font-semibold">{user.name}</h4>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                              {user.role}
                            </span>
                            {user.location && (
                              <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                                {user.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/users/${user._id}`)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user._id)}
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

        {/* DPR Management Tab */}
        {activeTab === 'dprs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search DPRs..."
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
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading DPRs...</p>
              </div>
            ) : (
          <Card>
                <CardContent className="pt-6">
              <div className="space-y-4">
                    {filteredDPRs.map((dpr) => (
                      <div
                        key={dpr._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold">{dpr.projectId?.projectName || 'Untitled Project'}</h4>
                          <p className="text-sm text-muted-foreground">
                            {dpr.projectId?.industrySector} • {dpr.projectId?.location}
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
                              {dpr.status || 'draft'}
                            </span>
                            {dpr.qualityScore && (
                              <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                                Quality: {dpr.qualityScore}%
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
                            onClick={() => navigate(`/dpr/view/${dpr._id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          {dpr.status === 'submitted' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-success border-success"
                                onClick={() => handleApproveDPR(dpr._id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive border-destructive"
                                onClick={() => handleRejectDPR(dpr._id)}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
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

        {/* Policies Tab */}
        {activeTab === 'policies' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search policies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => {
                  setEditingPolicy(null);
                  setPolicyForm({
                    title: '',
                    description: '',
                    category: 'dpr',
                    content: '',
                    status: 'draft',
                    priority: 'medium',
                    tags: '',
                  });
                  setShowPolicyModal(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Policy
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
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading policies...</p>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {filteredPolicies.map((policy) => (
                      <div
                        key={policy._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold">{policy.title}</h4>
                          <p className="text-sm text-muted-foreground">{policy.description}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                              {policy.category}
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
                              {policy.status}
                            </span>
                            <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                              {policy.metadata?.priority || 'medium'}
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
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePolicy(policy._id)}
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

        {/* Policy Modal */}
        {showPolicyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
                <CardTitle>{editingPolicy ? 'Edit Policy' : 'Create Policy'}</CardTitle>
            </CardHeader>
              <CardContent className="space-y-4">
                  <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={policyForm.title}
                    onChange={(e) => setPolicyForm({ ...policyForm, title: e.target.value })}
                    placeholder="Policy title"
                  />
                  </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={policyForm.description}
                    onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })}
                    placeholder="Brief description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <select
                      value={policyForm.category}
                      onChange={(e) => setPolicyForm({ ...policyForm, category: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="dpr">DPR</option>
                      <option value="user">User</option>
                      <option value="system">System</option>
                      <option value="financial">Financial</option>
                      <option value="compliance">Compliance</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <select
                      value={policyForm.priority}
                      onChange={(e) => setPolicyForm({ ...policyForm, priority: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Content</label>
                  <textarea
                    value={policyForm.content}
                    onChange={(e) => setPolicyForm({ ...policyForm, content: e.target.value })}
                    placeholder="Policy content..."
                    className="w-full px-4 py-2 border rounded-lg min-h-[200px]"
                  />
        </div>
                  <div>
                  <label className="text-sm font-medium">Tags (comma-separated)</label>
                  <Input
                    value={policyForm.tags}
                    onChange={(e) => setPolicyForm({ ...policyForm, tags: e.target.value })}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowPolicyModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSavePolicy}>
                    {editingPolicy ? 'Update' : 'Create'} Policy
                  </Button>
            </div>
          </CardContent>
        </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};
