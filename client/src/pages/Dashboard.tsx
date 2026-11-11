// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { useDPRStore } from '@/store/dprStore';
import { api } from '@/lib/api';
import { Layout } from '@/components/layout/Layout';
import { 
  FileText,
  Sparkles,
  CheckCircle, 
  Clock,
  Send,
  BarChart3,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDprActions } from '@/lib/dprActions';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { RecentDprs } from '@/components/dashboard/RecentDprs';
import { SchemeFinderCard } from '@/components/dashboard/SchemeFinderCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { useTourStore } from '@/store/tourStore';
import { Button } from '@/components/ui/Button';
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
  const startTour = useTourStore((s) => s.start);

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
        return 'bg-success/10 text-success-text border border-success/20';
      case 'submitted':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20';
      case 'draft':
        return 'bg-warning/10 text-warning-text border border-warning/20';
      case 'analyzed':
        return 'bg-primary/10 text-primary border border-primary/20';
      case 'rejected':
        return 'bg-destructive/10 text-destructive-text border border-destructive/20';
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
        return <Send className="h-4 w-4" />;
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
  const stamp = (d: DPR) => new Date(d.updatedAt || d.createdAt || d.generatedAt || 0).getTime();

  const latest = [...dprs]
    .sort((x: DPR, y: DPR) => stamp(y) - stamp(x))
    .slice(0, LATEST_COUNT);
  const canCreate = canCreateDpr(user?.role);
  const createDpr = () => navigate('/individual-dpr/create?new=true');
  const openList = (status?: string) => navigate(status ? `/dprs?status=${status}` : '/dprs');
  const findSchemes = (words?: string) =>
    navigate(words ? `/individual-dpr/create?new=true&q=${encodeURIComponent(words)}` : '/individual-dpr/create?new=true');

  return (
    <Layout>
      <div className="space-y-5 pb-8 lg:space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="text-xl font-bold sm:text-2xl">{t('dashboard.welcomeBack', { name: user?.name })}</h1>
              <RoleBadge role={user?.role} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{t(ROLE_META[toAppRole(user?.role)].descriptionKey)}</p>
          </div>
          <div data-tour="actions" className="flex w-full flex-col gap-3 rounded-xl sm:w-auto sm:flex-row sm:flex-wrap">
            {canCreate && (
              <Button variant="primary" onClick={createDpr} className="gap-2 whitespace-nowrap">
                <FileText className="h-4 w-4" aria-hidden="true" />
                {tf('Create DPR')}
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/venture-match')} className="gap-2 whitespace-nowrap border-2">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {tf('Scheme Finder')}
            </Button>
          </div>
        </div>

        <DashboardHero
          onGuide={() => navigate('/individual-dpr/guide')}
          onTour={startTour}
        />

        <KpiCards stats={stats} loading={showPlaceholders} onOpen={openList} />
        {insights?.topSector && (
          <p className="-mt-2 text-sm text-muted-foreground">
            {t('dashboard.topBusinessSector')}: <span className="font-medium text-foreground">{insights.topSector.name}</span>
            {' · '}{insights.topSector.count} {insights.topSector.count === 1 ? t('dashboard.project') : t('dashboard.projects')}
          </p>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,13fr)_minmax(0,7fr)] lg:gap-6">
          <RecentDprs
            dprs={latest}
            total={dprs.length}
            loading={showPlaceholders}
            canCreate={canCreate}
            renderStatus={(dpr: DPR) => (
              <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(getEffectiveStatus(dpr))}`}>
                {getStatusIcon(getEffectiveStatus(dpr))}
                {(() => {
                  const status = getEffectiveStatus(dpr);
                  if (status === 'analyzed') return `${tf('Analyzed')} (${dpr.qualityScore}/100)`;
                  return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Draft';
                })()}
              </span>
            )}
            onView={(dpr: DPR) => navigate(`/dpr/view/${dpr._id}`, { state: { updatedAt: dpr.updatedAt } })}
            onEdit={editDpr}
            onDelete={askDelete}
            onViewAll={() => openList()}
            onViewProjects={() => navigate('/projects')}
            onCreate={createDpr}
            onGuide={() => navigate('/individual-dpr/guide')}
          />
          {/* The card fills the column beside the report list without making that row taller; its scheme list scrolls.
              The minimum height keeps its search, sector chips and button inside the card when the list is short (one report). */}
          <div className="min-w-0 lg:relative lg:min-h-[30rem]">
            <SchemeFinderCard
              onSearch={findSchemes}
              onPick={(code: string) => navigate(`/individual-dpr/create?new=true&scheme=${encodeURIComponent(code)}`)}
              onQuiz={() => navigate('/venture-match')}
              onViewAll={() => findSchemes()}
            />
          </div>
        </div>

        <QuickActions
          onCreate={createDpr}
          onGuide={() => navigate('/individual-dpr/guide')}
          onSchemes={() => navigate('/venture-match')}
          onProjects={() => navigate('/projects')}
        />
      </div>
      {deleteDialog}
    </Layout>
  );
};
