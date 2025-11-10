import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  Users,
  FolderOpen,
  Star,
  TrendingUp,
  Award,
  Target,
  DollarSign,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Database,
  FileText,
  HardDrive,
  MessageSquare,
  Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart, ScatterChart, Scatter } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await api.getAnalytics();
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </Layout>
    );
  }

  const summary = analytics?.summary || {};

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.title')}</h1>
          <p className="text-muted-foreground mt-2">
            Platform analytics and insights
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('admin.totalUsers')}
                  </p>
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
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('admin.totalProjects')}
                  </p>
                  <h3 className="text-3xl font-bold mt-2">{summary.totalProjects || 0}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Completed: {summary.completedProjects || 0}
                  </p>
                </div>
                <FolderOpen className="h-12 w-12 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    DPRs Generated
                  </p>
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
                  <p className="text-sm font-medium text-muted-foreground">
                    Bankability Score
                  </p>
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

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Quality Score
                  </p>
                  <h3 className="text-2xl font-bold mt-2">{analytics?.dprQualityStats?.avgQualityScore || 0}%</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Completeness: {analytics?.dprQualityStats?.avgCompletenessScore || 0}%
                  </p>
                </div>
                <Target className="h-10 w-10 text-indigo-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    User Satisfaction
                  </p>
                  <h3 className="text-2xl font-bold mt-2">{analytics?.dprQualityStats?.avgUserSatisfaction || 0}%</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on {summary.totalFeedback || 0} feedback
                  </p>
                </div>
                <Star className="h-10 w-10 text-orange-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Analytics Tracked
                  </p>
                  <h3 className="text-2xl font-bold mt-2">{summary.totalAnalytics || 0}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    DPRs with ML insights
                  </p>
                </div>
                <BarChart3 className="h-10 w-10 text-cyan-500 opacity-20" />
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

        {/* DPR Quality Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>DPR Quality Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.mlInsights?.qualityTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id.month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avgQuality" stroke="#3b82f6" name="Quality Score" />
                  <Line type="monotone" dataKey="count" stroke="#10b981" name="DPR Count" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Funding Outcomes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics?.fundingOutcomes || []}
                    dataKey="count"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {(analytics?.fundingOutcomes || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Sector Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Sector-wise DPR Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={analytics?.sectorDPRPerformance || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="avgQualityScore" fill="#3b82f6" name="Quality Score" />
                <Bar yAxisId="left" dataKey="avgBankabilityScore" fill="#10b981" name="Bankability Score" />
                <Bar yAxisId="right" dataKey="approvalRate" fill="#f59e0b" name="Approval Rate" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* RAG and Document Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Vector Stores & Knowledge Base</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Vector Stores</p>
                    <h3 className="text-2xl font-bold">{analytics?.vectorStores?.length || 0}</h3>
                  </div>
                  <Database className="h-8 w-8 text-purple-500 opacity-20" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                    <h3 className="text-2xl font-bold">{analytics?.totalDocuments || 0}</h3>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500 opacity-20" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Knowledge Base Size</p>
                    <h3 className="text-2xl font-bold">
                      {analytics?.knowledgeBaseSize ? formatFileSize(analytics.knowledgeBaseSize) : '0 MB'}
                    </h3>
                  </div>
                  <HardDrive className="h-8 w-8 text-green-500 opacity-20" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>RAG Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">RAG Queries Today</p>
                    <h3 className="text-2xl font-bold">{analytics?.ragQueriesToday || 0}</h3>
                  </div>
                  <MessageSquare className="h-8 w-8 text-orange-500 opacity-20" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                    <h3 className="text-2xl font-bold">
                      {analytics?.avgResponseTime ? `${analytics.avgResponseTime}ms` : 'N/A'}
                    </h3>
                  </div>
                  <Clock className="h-8 w-8 text-red-500 opacity-20" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Document Templates</p>
                    <h3 className="text-2xl font-bold">{analytics?.templateCount || 0}</h3>
                  </div>
                  <FileText className="h-8 w-8 text-indigo-500 opacity-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(analytics?.recentProjects || []).map((project: any) => (
                <div
                  key={project._id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-semibold">{project.projectName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {project.industrySector} • {project.location}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      By {project.userId?.name || 'Unknown'} ({project.userId?.email})
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      project.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : project.status === 'in-progress'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

