// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { useDPRStore } from '@/store/dprStore';
import { api } from '@/lib/api';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  FileText, 
  MessageSquare, 
  Building, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Sparkles,
  BarChart3,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  ArrowRight,
  Wand2,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { useDprActions } from '@/lib/dprActions';
import { RoleBadge } from '@/components/auth/RolePicker';
import { canCreateDpr, ROLE_META, toAppRole } from '@/lib/rbac';

import { useClusterFormText } from '@/lib/clusterDprFormText';
interface DPR {
  _id: string;
  projectId: any;
  versionNumber: number;
  status?: 'draft' | 'submitted' | 'approved' | 'rejected';
  qualityScore?: number;
  generatedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  schemeCode?: string | null;
}

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const tf = useClusterFormText();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { dprs: cachedDPRs, setDPRs, isStale: isDPRsStale } = useDPRStore();
  const [dprs, setDprs] = useState<DPR[]>(cachedDPRs);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    analyzed: 0,
    submitted: 0,
    approved: 0,
    avgQualityScore: 0,
  });
  const [loading, setLoading] = useState(cachedDPRs.length === 0);
  const [insights, setInsights] = useState<any>(null);
  const LATEST_COUNT = 5;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(cachedDPRs.length === 0);

      const useCachedDPRs = cachedDPRs.length > 0 && !isDPRsStale();
      if (useCachedDPRs) {
        processDPRsData(cachedDPRs);
        setLoading(false);
        return;
      }

      const dprsResponse = await api.getUserDPRs();

      // Process DPRs response if we fetched new data
      let dprsData: DPR[] = useCachedDPRs ? cachedDPRs : [];
      
      if (dprsResponse) {
        // Handle different response structures (API vs mock data)
        if (Array.isArray(dprsResponse)) {
          dprsData = dprsResponse;
        } else if (dprsResponse.data) {
          if (Array.isArray(dprsResponse.data)) {
            dprsData = dprsResponse.data;
          } else if (dprsResponse.data.dprs && Array.isArray(dprsResponse.data.dprs)) {
            dprsData = dprsResponse.data.dprs;
          }
        } else if (dprsResponse.dprs && Array.isArray(dprsResponse.dprs)) {
          dprsData = dprsResponse.dprs;
        }
        
        // Ensure dprsData is always an array
        if (!Array.isArray(dprsData)) {
          console.warn('DPRs data is not an array, using empty array:', dprsData);
          dprsData = [];
        }
        
        // Update store with new data
        setDPRs(dprsData);
      }

      processDPRsData(dprsData);
    } catch (error: any) {
      console.error('Failed to load data:', error);
      
      // Check if it's a network error - if so, try to use mock data directly
      const isNetworkError = !error.response && (
        error.code === 'ERR_NETWORK' ||
        error.message?.includes('Network Error') ||
        error.message?.includes('ERR_CONNECTION_REFUSED') ||
        error.message?.includes('Failed to fetch')
      );
      
      if (isNetworkError) {
        console.log('🌐 Network error detected, trying to load mock data...');
        try {
          // Import and use mock data directly
          const { MockDataService } = await import('@/lib/mockData');
          const [mockDprsResponse] = await Promise.all([
            MockDataService.getUserDPRs(),
          ]);
          
          // Extract DPRs from mock response
          let mockDprsData: DPR[] = [];
          if (Array.isArray(mockDprsResponse)) {
            mockDprsData = mockDprsResponse;
          } else if (mockDprsResponse.dprs && Array.isArray(mockDprsResponse.dprs)) {
            mockDprsData = mockDprsResponse.dprs;
          } else if (mockDprsResponse.data) {
            if (Array.isArray(mockDprsResponse.data)) {
              mockDprsData = mockDprsResponse.data;
            } else if (mockDprsResponse.data.dprs && Array.isArray(mockDprsResponse.data.dprs)) {
              mockDprsData = mockDprsResponse.data.dprs;
            }
          }
          
          if (Array.isArray(mockDprsData) && mockDprsData.length > 0) {
            setDprs(mockDprsData);
            
            // Calculate stats from mock data
            const draft = mockDprsData.filter((d: DPR) => d.status === 'draft').length;
            const submitted = mockDprsData.filter((d: DPR) => d.status === 'submitted').length;
            const approved = mockDprsData.filter((d: DPR) => d.status === 'approved').length;
            const qualityScores = mockDprsData
              .filter((d: DPR) => d.qualityScore !== undefined)
              .map((d: DPR) => d.qualityScore || 0);
            const avgQualityScore = qualityScores.length > 0
              ? Math.round(qualityScores.reduce((a: number, b: number) => a + b, 0) / qualityScores.length)
              : 0;
            
            setStats({
              total: mockDprsData.length,
              draft,
              submitted,
              approved,
              avgQualityScore,
            });
            
            if (mockDprsData.length > 0) {
              generateInsights(mockDprsData);
            }
            
            return; // Successfully loaded mock data, exit early
          }
        } catch (mockError) {
          console.error('Failed to load mock data:', mockError);
        }
      }
      
      // If we reach here, show error but don't prevent UI from rendering
      toast.error(tf('Failed to load dashboard data. Showing empty state.'));
    } finally {
      setLoading(false);
    }
  };

  const { edit: editDpr, askDelete, deleteDialog } = useDprActions((dprId: string) => {
    const remaining = dprs.filter((item: DPR) => item._id !== dprId);
    setDPRs(remaining);
    processDPRsData(remaining);
  });

  const processDPRsData = (dprsData: DPR[]) => {
    setDprs(dprsData);
    
    // Calculate stats - use effective status
    const draft = dprsData.filter((d: DPR) => getEffectiveStatus(d) === 'draft').length;
    const analyzed = dprsData.filter((d: DPR) => getEffectiveStatus(d) === 'analyzed').length;
    const submitted = dprsData.filter((d: DPR) => d.status === 'submitted').length;
    const approved = dprsData.filter((d: DPR) => d.status === 'approved').length;
    const qualityScores = dprsData
      .filter((d: DPR) => d.qualityScore !== undefined)
      .map((d: DPR) => d.qualityScore || 0);
    const avgQualityScore = qualityScores.length > 0
      ? Math.round(qualityScores.reduce((a: number, b: number) => a + b, 0) / qualityScores.length)
      : 0;

    setStats({
      total: dprsData.length,
      draft,
      analyzed,
      submitted,
      approved,
      avgQualityScore,
    });

    // Generate AI insights
    if (dprsData.length > 0) {
      generateInsights(dprsData);
    }
  };

  const generateInsights = async (dprsData: DPR[]) => {
    try {
      const sectorCounts: Record<string, number> = {};
      dprsData.forEach((dpr: DPR) => {
        const sector = dpr.projectId?.industrySector || 'Unknown';
        sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
      });

      const topSector = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0];
      
      // Calculate average quality score directly from dprsData
      const qualityScores = dprsData
        .filter((d: DPR) => d.qualityScore !== undefined && d.qualityScore !== null)
        .map((d: DPR) => d.qualityScore || 0);
      const avgQualityScore = qualityScores.length > 0
        ? Math.round(qualityScores.reduce((a: number, b: number) => a + b, 0) / qualityScores.length)
        : null;
      
      setInsights({
        topSector: topSector ? { name: topSector[0], count: topSector[1] } : null,
        totalProjects: dprsData.length,
        avgQuality: avgQualityScore,
      });
    } catch (error) {
      console.error('Error generating insights:', error);
    }
  };

  const getEffectiveStatus = (dpr: DPR) => {
    // If DPR has a quality score, it's been analyzed and shouldn't be shown as draft
    if (dpr.qualityScore !== undefined && dpr.qualityScore !== null) {
      // If it has a quality score but no explicit status, treat as analyzed draft
      if (!dpr.status || dpr.status === 'draft') {
        return 'analyzed';
      }
    }
    return dpr.status || 'draft';
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-muted/50 text-muted-foreground border border-border';
    switch (status) {
      case 'approved':
        return 'bg-success/10 text-success border border-success/20';
      case 'submitted':
        return 'bg-secondary/10 text-secondary border border-secondary/20';
      case 'draft':
        return 'bg-warning/10 text-warning border border-warning/20';
      case 'analyzed':
        return 'bg-primary/10 text-primary border border-primary/20';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border border-destructive/20';
      default:
        return 'bg-muted/50 text-muted-foreground border border-border';
    }
  };

  const getStatusIcon = (status?: string) => {
    if (!status) return <FileText className="h-4 w-4" />;
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'submitted':
        return <AlertCircle className="h-4 w-4" />;
      case 'draft':
        return <Clock className="h-4 w-4" />;
      case 'analyzed':
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getQualityColor = (score?: number) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getQualityLabel = (score?: number) => {
    if (!score) return t('dashboard.notAnalyzed');
    if (score >= 80) return t('dashboard.excellent');
    if (score >= 60) return t('dashboard.good');
    return t('dashboard.needsImprovement');
  };

  const showPlaceholders = loading && dprs.length === 0;

  return (
    <Layout>
      <div className="space-y-8 pb-8">
        {/* Hero Section */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">
                {t('dashboard.welcomeBack', { name: user?.name })}
              </h1>
              <RoleBadge role={user?.role} />
            </div>
            <p className="text-muted-foreground">
              {t(ROLE_META[toAppRole(user?.role)].descriptionKey)}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {canCreateDpr(user?.role) && (
              <>
                <Button
                  variant="primary"
                  onClick={() => navigate('/individual-dpr/create?new=true')}
                  className="gap-2 whitespace-nowrap"
                >
                  <FileText className="h-4 w-4" />
                  {tf('Create DPR')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/individual-dpr/guide')}
                  className="gap-2 whitespace-nowrap border-2"
                >
                  <Wand2 className="h-4 w-4" />
                  {t('reportGuide.open')}
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={() => navigate('/venture-match')}
              className="gap-2 whitespace-nowrap border-2"
            >
              <Sparkles className="h-4 w-4" />
              {t('dashboard.ventureMatch')}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="motion-stagger grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {t('dashboard.totalDPRs')}
                  </p>
                  {showPlaceholders ? (
                    <div className="mt-1 h-9 w-16 animate-pulse rounded bg-muted" />
                  ) : (
                    <h3 className="text-3xl font-bold text-foreground">{stats.total}</h3>
                  )}
                  {!showPlaceholders && (
                    <p className="text-sm text-muted-foreground mt-1">{stats.total} {t('dashboard.dprs')}</p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {t('dashboard.draft')}
                  </p>
                  {showPlaceholders ? (
                    <div className="mt-1 h-9 w-16 animate-pulse rounded bg-muted" />
                  ) : (
                    <h3 className="text-3xl font-bold text-foreground">{stats.draft}</h3>
                  )}
                  {!showPlaceholders && (
                    <p className="text-sm text-muted-foreground mt-1">{stats.draft} {t('dashboard.drafts')}</p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {t('dashboard.submitted')}
                  </p>
                  {showPlaceholders ? (
                    <div className="mt-1 h-9 w-16 animate-pulse rounded bg-muted" />
                  ) : (
                    <h3 className="text-3xl font-bold text-foreground">{stats.submitted}</h3>
                  )}
                  {!showPlaceholders && (
                    <p className="text-sm text-muted-foreground mt-1">{stats.submitted} {t('dashboard.submitted')}</p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {tf('Analyzed')}
                  </p>
                  {showPlaceholders ? (
                    <div className="mt-1 h-9 w-16 animate-pulse rounded bg-muted" />
                  ) : (
                    <h3 className="text-3xl font-bold text-foreground">{stats.analyzed}</h3>
                  )}
                  {!showPlaceholders && (
                    <p className="text-sm text-muted-foreground mt-1">{stats.analyzed} {tf('Analyzed DPRs')}</p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {t('dashboard.avgQuality')}
                  </p>
                  {showPlaceholders ? (
                    <div className="mt-1 h-9 w-16 animate-pulse rounded bg-muted" />
                  ) : (
                    <h3 className={`text-3xl font-bold ${getQualityColor(stats.avgQualityScore)}`}>
                      {stats.avgQualityScore || 'N/A'}
                    </h3>
                  )}
                  {!showPlaceholders && (
                    <p className="text-sm text-muted-foreground mt-1">{getQualityLabel(stats.avgQualityScore)}</p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        {insights && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{t('dashboard.aiPoweredInsights')}</CardTitle>
                  <CardDescription>{t('dashboard.personalizedRecommendations')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {insights.topSector && (
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">{t('dashboard.topBusinessSector')}</p>
                    <p className="text-xl font-bold text-foreground">{insights.topSector.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {insights.topSector.count} {insights.topSector.count === 1 ? t('dashboard.project') : t('dashboard.projects')}
                    </p>
                  </div>
                )}
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">{t('dashboard.averageDPRQuality')}</p>
                  <p className={`text-xl font-bold ${getQualityColor(insights.avgQuality)}`}>
                    {insights.avgQuality !== null && insights.avgQuality !== undefined ? `${insights.avgQuality}/100` : 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getQualityLabel(insights.avgQuality)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent DPRs */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>{t('dashboard.yourDPRs')}</CardTitle>
                <CardDescription>{t('dashboard.manageDPRs')}</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => navigate('/dprs')}>
                  {t('dashboard.viewAllDPRs')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button variant="outline" onClick={() => navigate('/projects')}>
                  {t('dashboard.viewProjects')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {showPlaceholders ? (
              <div className="space-y-3" aria-busy="true">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="h-16 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : dprs.length === 0 ? (
              <div className="text-center py-16">
                <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('dashboard.noDPRsYet')}</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {t('dashboard.createFirstDPR')}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/individual-dpr/create?new=true')}
                    size="lg"
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    {tf('Create DPR')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/individual-dpr/guide')}
                    size="lg"
                  >
                    <Wand2 className="h-5 w-5 mr-2" />
                    {t('reportGuide.open')}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="motion-stagger space-y-3">
                  {(() => {
                    // Only the latest few; the rest are under "View all DPRs".
                    const stamp = (d: DPR) => new Date(d.updatedAt || d.createdAt || d.generatedAt || 0).getTime();
                    const paginatedDPRs = [...dprs].sort((a, b) => stamp(b) - stamp(a)).slice(0, LATEST_COUNT);
                    
                    return paginatedDPRs.map((dpr: DPR) => (
                  <div
                    key={dpr._id}
                    className="group flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 hover:shadow-md transition-all bg-card"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-base">
                          {dpr.projectId?.projectName || t('dashboard.untitledProject')}
                        </h4>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border mt-1 ${getStatusColor(getEffectiveStatus(dpr))}`}>
                          {getStatusIcon(getEffectiveStatus(dpr))}
                          {(() => {
                            const effectiveStatus = getEffectiveStatus(dpr);
                            if (effectiveStatus === 'analyzed') {
                              return `${tf('Analyzed')} (${dpr.qualityScore}/100)`;
                            }
                            return effectiveStatus ? (effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1)) : 'Draft';
                          })()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {dpr.qualityScore !== undefined && (
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${getQualityColor(dpr.qualityScore)}`}>
                            {dpr.qualityScore}/100
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getQualityLabel(dpr.qualityScore)}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dpr/view/${dpr._id}`, { state: { updatedAt: dpr.updatedAt } });
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {t('dashboard.view')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            editDpr(dpr);
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          {t('dashboard.edit')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          data-no-auto-confirm
                          onClick={(e) => {
                            e.stopPropagation();
                            askDelete(dpr);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('dashboard.delete')}
                        </Button>
                      </div>
                    </div>
                  </div>
                    ));
                  })()}
                </div>
                
                {dprs.length > LATEST_COUNT && (
                  <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-border pt-4 sm:flex-row">
                    <p className="text-sm text-muted-foreground">
                      {t('dashboard.showingLatest', { count: LATEST_COUNT, total: dprs.length, defaultValue: 'Showing your latest {{count}} of {{total}} reports' })}
                    </p>
                    <Button variant="outline" size="sm" onClick={() => navigate('/dprs')}>
                      {t('dashboard.viewAllDPRs')}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.quickActions')}</CardTitle>
            <CardDescription>{t('dashboard.accessFrequentlyUsed')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="motion-stagger grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="primary"
                onClick={() => navigate('/individual-dpr/create?new=true')}
                className="h-28 flex-col gap-3 bg-gradient-to-br from-primary to-primary/80"
              >
                <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="font-semibold">{tf('Create DPR')}</span>
                <span className="text-sm opacity-90">{tf('Individual / scheme-aware')}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/individual-dpr/guide')}
                className="h-28 flex-col gap-3 border-2 hover:border-primary hover:bg-primary/5"
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wand2 className="h-6 w-6 text-primary" />
                </div>
                <span className="font-semibold">{t('reportGuide.open')}</span>
                <span className="text-sm text-muted-foreground">{t('reportGuide.openHint')}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/venture-match')}
                className="h-28 flex-col gap-3 border-2 hover:border-primary hover:bg-primary/5"
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <span className="font-semibold">{t('dashboard.ventureMatch')}</span>
                <span className="text-sm text-muted-foreground">{t('dashboard.ventureMatchHint')}</span>
              </Button>
              <Button
                onClick={() => navigate('/chat')}
                variant="outline"
                className="h-28 flex-col gap-3 border-2 hover:border-secondary hover:bg-secondary/5"
              >
                <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-secondary" />
                </div>
                <span className="font-semibold">{t('nav.chat')}</span>
                <span className="text-sm text-muted-foreground">{t('dashboard.getInstantHelp')}</span>
              </Button>
              <Button
                onClick={() => navigate('/projects')}
                variant="outline"
                className="h-28 flex-col gap-3 border-2 hover:border-primary hover:bg-primary/5"
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building className="h-6 w-6 text-primary" />
                </div>
                <span className="font-semibold">{t('dashboard.myProjects')}</span>
                <span className="text-sm text-muted-foreground">{t('dashboard.viewAllProjects')}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      {deleteDialog}
    </Layout>
  );
};
