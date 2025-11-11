// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  TrendingUp, 
  Target, 
  Award, 
  CheckCircle, 
  AlertCircle, 
  BarChart3,
  Download,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const DPRAnalytics: React.FC = () => {
  const { t } = useTranslation();
  const { projectId } = useParams();
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadDPRAnalytics();
    }
  }, [projectId]);

  const loadDPRAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await api.getDPRAnalytics(projectId!);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to load DPR analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDPRAnalytics();
    setIsRefreshing(false);
  };

  const handleDownloadReport = async () => {
    try {
      const blob = await api.downloadDPRAnalyticsReport(projectId!);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DPR_Analytics_${projectId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download analytics report');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading DPR Analytics...</p>
        </div>
      </Layout>
    );
  }

  if (!analytics) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Analytics Available</h3>
          <p className="text-muted-foreground">
            DPR analytics will be available after the DPR is generated and analyzed.
          </p>
        </div>
      </Layout>
    );
  }

  const qualityScore = analytics.qualityScore || 0;
  const bankabilityScore = analytics.bankabilityScore || 0;
  const completenessScore = analytics.completenessScore || 0;
  const userSatisfactionScore = analytics.userSatisfactionScore || 0;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">DPR Analytics & Insights</h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive analysis of your DPR quality and performance
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleDownloadReport}>
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </div>
        </div>

        {/* Quality Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overall Quality</p>
                  <h3 className="text-3xl font-bold mt-2">{qualityScore}%</h3>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${qualityScore}%` }}
                    ></div>
                  </div>
                </div>
                <Award className="h-12 w-12 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Bankability</p>
                  <h3 className="text-3xl font-bold mt-2">{bankabilityScore}%</h3>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${bankabilityScore}%` }}
                    ></div>
                  </div>
                </div>
                <Target className="h-12 w-12 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completeness</p>
                  <h3 className="text-3xl font-bold mt-2">{completenessScore}%</h3>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${completenessScore}%` }}
                    ></div>
                  </div>
                </div>
                <CheckCircle className="h-12 w-12 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User Satisfaction</p>
                  <h3 className="text-3xl font-bold mt-2">{userSatisfactionScore}%</h3>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full" 
                      style={{ width: `${userSatisfactionScore}%` }}
                    ></div>
                  </div>
                </div>
                <TrendingUp className="h-12 w-12 text-orange-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Funding Outcome */}
        {analytics.fundingOutcome && (
          <Card>
            <CardHeader>
              <CardTitle>Funding Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${
                  analytics.fundingOutcome === 'approved' ? 'bg-green-100 text-green-800' :
                  analytics.fundingOutcome === 'rejected' ? 'bg-red-100 text-red-800' :
                  analytics.fundingOutcome === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {analytics.fundingOutcome === 'approved' ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : analytics.fundingOutcome === 'rejected' ? (
                    <AlertCircle className="h-6 w-6" />
                  ) : (
                    <BarChart3 className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold capitalize">
                    {analytics.fundingOutcome.replace('_', ' ')}
                  </h3>
                  {analytics.loanAmountApproved && (
                    <p className="text-muted-foreground">
                      Approved Amount: ₹{analytics.loanAmountApproved.toLocaleString()}
                    </p>
                  )}
                  {analytics.approvalDate && (
                    <p className="text-muted-foreground">
                      Approved on: {new Date(analytics.approvalDate).toLocaleDateString()}
                    </p>
                  )}
                  {analytics.rejectionReason && (
                    <p className="text-muted-foreground">
                      Reason: {analytics.rejectionReason}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sector Benchmark Comparison */}
        {analytics.sectorBenchmarkComparison && (
          <Card>
            <CardHeader>
              <CardTitle>Sector Benchmark Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Project Cost vs Benchmark</p>
                  <p className={`text-2xl font-bold ${
                    analytics.sectorBenchmarkComparison.projectCostVsBenchmark > 100 
                      ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {analytics.sectorBenchmarkComparison.projectCostVsBenchmark.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Own Contribution vs Benchmark</p>
                  <p className={`text-2xl font-bold ${
                    analytics.sectorBenchmarkComparison.ownContributionVsBenchmark > 100 
                      ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {analytics.sectorBenchmarkComparison.ownContributionVsBenchmark.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Payback Period vs Benchmark</p>
                  <p className={`text-2xl font-bold ${
                    analytics.sectorBenchmarkComparison.paybackPeriodVsBenchmark < 100 
                      ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {analytics.sectorBenchmarkComparison.paybackPeriodVsBenchmark.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">ROI vs Benchmark</p>
                  <p className={`text-2xl font-bold ${
                    analytics.sectorBenchmarkComparison.roiVsBenchmark > 100 
                      ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {analytics.sectorBenchmarkComparison.roiVsBenchmark.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Improvement Suggestions */}
        {analytics.improvementSuggestions && analytics.improvementSuggestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Improvement Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.improvementSuggestions.map((suggestion: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{suggestion}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quality Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Quality Score Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.qualityTrends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="qualityScore" stroke="#3b82f6" name="Quality Score" />
                <Line type="monotone" dataKey="bankabilityScore" stroke="#10b981" name="Bankability Score" />
                <Line type="monotone" dataKey="completenessScore" stroke="#8b5cf6" name="Completeness Score" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
