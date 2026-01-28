// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Download,
  Edit2,
  Save,
  X,
  FileText,
  Languages,
  Send,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Loader2,
  Sparkles,
  Award,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { downloadBlob } from '@/lib/utils';
import { FormattedText } from '@/utils/textFormatter';
import { ClusterDPRDocumentView } from '@/components/cluster-dpr/ClusterDPRDocumentView';
import { captureElementAsStandaloneHTML } from '@/lib/htmlCapture';

export const DPRPreview: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { dprId } = useParams();
  const navigate = useNavigate();
  const [dpr, setDpr] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewLanguage, setViewLanguage] = useState<'english' | 'telugu'>('english');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [qualityFeedback, setQualityFeedback] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [hasTelugu, setHasTelugu] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(0.6); // Default zoom set to 60%

  // Update i18n language when viewLanguage changes
  useEffect(() => {
    if (viewLanguage === 'telugu') {
      i18n.changeLanguage('te');
    } else {
      i18n.changeLanguage('en');
    }
  }, [viewLanguage, i18n]);

  useEffect(() => {
    if (dprId) {
      loadDPR();
    }
  }, [dprId]);

  const [isClusterDPR, setIsClusterDPR] = useState(false);

  const loadDPR = async () => {
    try {
      setLoading(true);
      const [dprResponse, qualityResponse] = await Promise.all([
        api.getDPR(dprId!),
        api.analyzeDPRQuality(dprId!).catch(() => null),
      ]);

      // Handle different response structures (API vs mock data)
      let dprData = dprResponse;
      if (dprResponse.data && typeof dprResponse.data === 'object') {
        dprData = dprResponse.data;
      } else if (dprResponse.data && Array.isArray(dprResponse.data)) {
        // If it's an array, take the first one (shouldn't happen for getDPR, but handle it)
        dprData = dprResponse.data[0] || dprResponse;
      }
      
      setDpr(dprData);
      
      // Check if this is a cluster DPR (will be updated when project loads)
      const isCluster = dprData.content?.english?.isClusterDPR || 
                       dprData.content?.telugu?.isClusterDPR ||
                       dprData.metadata?.isClusterDPR ||
                       dprData.content?.english?.clusterData ||
                       dprData.metadata?.clusterData;
      setIsClusterDPR(isCluster);
      
      // Load project data
      if (dprData.projectId) {
        if (typeof dprData.projectId === 'string') {
          try {
            const projectResponse = await api.getProject(dprData.projectId);
            const projectData = projectResponse.data || projectResponse;
            setProject(projectData);
            // Check if cluster DPR based on project type
            if (projectData.projectType === 'cluster') {
              setIsClusterDPR(true);
            }
          } catch (projectError) {
            console.warn('Failed to load project, using projectId from DPR:', projectError);
            // Use the projectId object if available in dprData
            if (dprData.projectId && typeof dprData.projectId === 'object') {
              setProject(dprData.projectId);
              if (dprData.projectId.projectType === 'cluster') {
                setIsClusterDPR(true);
              }
            }
          }
        } else {
          setProject(dprData.projectId);
          if (dprData.projectId.projectType === 'cluster') {
            setIsClusterDPR(true);
          }
        }
      }

      // Handle quality feedback
      if (qualityResponse) {
        if (qualityResponse.data) {
          setQualityScore(qualityResponse.data.score);
          setQualityFeedback(qualityResponse.data);
        } else if (qualityResponse.score) {
          // Direct quality response structure
          setQualityScore(qualityResponse.score);
          setQualityFeedback(qualityResponse);
        }
      } else if (dprData.qualityScore !== undefined && dprData.qualityScore !== null) {
        setQualityScore(dprData.qualityScore);
        setQualityFeedback(dprData.qualityFeedback);
      }

      // Check if Telugu content exists
      const teluguContent = dprData.content?.telugu;
      setHasTelugu(teluguContent && Object.keys(teluguContent).length > 0);
    } catch (error: any) {
      console.error('Failed to load DPR:', error);
      
      // Check if it's a network error and try mock data fallback
      const isNetworkError = !error.response && (
        error.code === 'ERR_NETWORK' ||
        error.message?.includes('Network Error') ||
        error.message?.includes('ERR_CONNECTION_REFUSED') ||
        error.message?.includes('Failed to fetch')
      );
      
      if (isNetworkError) {
        console.log('🌐 Network error detected, trying to load mock DPR data...');
        try {
          const { MockDataService } = await import('@/lib/mockData');
          const mockDpr = await MockDataService.getDPR(dprId!);
          const mockQuality = await MockDataService.analyzeDPRQuality(dprId!);
          
          setDpr(mockDpr);
          
          // Load project from mock DPR
          if (mockDpr.projectId) {
            if (typeof mockDpr.projectId === 'string') {
              const mockProject = await MockDataService.getProject(mockDpr.projectId);
              setProject(mockProject);
            } else {
              setProject(mockDpr.projectId);
            }
          }
          
          // Set quality feedback
          if (mockQuality.data) {
            setQualityScore(mockQuality.data.score);
            setQualityFeedback(mockQuality.data);
          }
          
          // Check Telugu content
          const teluguContent = mockDpr.content?.telugu;
          setHasTelugu(teluguContent && Object.keys(teluguContent).length > 0);
          
          return; // Successfully loaded mock data
        } catch (mockError) {
          console.error('Failed to load mock DPR data:', mockError);
        }
      }
      
      toast.error('Failed to load DPR');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (section: string) => {
    const content = dpr.content[viewLanguage]?.[section] || '';
    setEditingSection(section);
    setEditedContent(content);
  };

  const handleSave = async () => {
    if (!editingSection) return;

    try {
      setSaving(true);
      const updateData = {
        [editingSection]: editedContent,
      };

      await api.updateDPRContent(dprId!, updateData, viewLanguage);
      
      // Update local state
      setDpr({
        ...dpr,
        content: {
          ...dpr.content,
          [viewLanguage]: {
            ...dpr.content[viewLanguage],
            [editingSection]: editedContent,
          },
        },
      });

      setEditingSection(null);
      setEditedContent('');
      toast.success('Content updated successfully');
      
      // Reload quality score
      const qualityResponse = await api.analyzeDPRQuality(dprId!);
      if (qualityResponse?.data) {
        setQualityScore(qualityResponse.data.score);
        setQualityFeedback(qualityResponse.data);
      }
    } catch (error) {
      toast.error('Failed to update content');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingSection(null);
    setEditedContent('');
  };

  const handleDownload = async (format: 'pdf' | 'docx' | 'xls') => {
    try {
      // Get enhanced paragraphs from database (DPR content) for cluster DPRs
      let enhancedParagraphs: Record<string, string> | undefined;
      if (isClusterDPR && dpr) {
        // Get enhanced content from DPR content (from database)
        const dprContent = dpr.content?.[viewLanguage] || dpr.content?.english || dpr.content?.telugu || {};
        enhancedParagraphs = dprContent.enhancedContent || {};
        if (Object.keys(enhancedParagraphs).length > 0) {
          console.log('📥 Loaded enhanced paragraphs from database for download:', Object.keys(enhancedParagraphs).length, 'sections');
        }
      }

      let blob;
      if (format === 'pdf') {
        // For Cluster DPRs: generate PDF from the actual rendered DOM + CSS so download matches preview 1:1
        if (isClusterDPR) {
          const root = document.querySelector('.dpr-document');
          if (!root) {
            throw new Error('Preview root not found');
          }
          const html = captureElementAsStandaloneHTML(root);
          blob = await api.downloadPDFExactFromHTML(dprId!, html, viewLanguage);
          downloadBlob(blob, `DPR_${project?.projectName || 'Report'}_${viewLanguage}.pdf`);
        } else {
          blob = await api.downloadPDF(dprId!, viewLanguage, enhancedParagraphs);
          downloadBlob(blob, `DPR_${project?.projectName || 'Report'}_${viewLanguage}.pdf`);
        }
      } else if (format === 'docx') {
        blob = await api.downloadDOCX(dprId!, viewLanguage);
        downloadBlob(blob, `DPR_${project?.projectName || 'Report'}_${viewLanguage}.docx`);
      } else if (format === 'xls') {
        blob = await api.downloadXLS(dprId!, viewLanguage);
        downloadBlob(blob, `DPR_${project?.projectName || 'Report'}_${viewLanguage}.xlsx`);
      }
      toast.success(`${format.toUpperCase()} downloaded successfully!`);
    } catch (error) {
      toast.error(`Failed to download ${format.toUpperCase()}`);
    }
  };

  const handleSubmit = async (submittedTo: string = 'admin') => {
    try {
      setSubmitting(true);
      await api.submitDPR(dprId!, submittedTo);
      toast.success('DPR submitted successfully!');
      await loadDPR(); // Reload to get updated status
    } catch (error) {
      toast.error('Failed to submit DPR');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTranslateToTelugu = async () => {
    try {
      setTranslating(true);
      const response = await api.translateToTelugu(dprId!);
      if (response.success) {
        toast.success('DPR translated to Telugu successfully!');
        setHasTelugu(true);
        await loadDPR(); // Reload to get Telugu content
        setViewLanguage('telugu'); // Switch to Telugu view
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to translate DPR to Telugu');
    } finally {
      setTranslating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success/10 text-success border border-success/20';
      case 'submitted':
        return 'bg-secondary/10 text-secondary border border-secondary/20';
      case 'draft':
        return 'bg-warning/10 text-warning border border-warning/20';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border border-destructive/20';
      default:
        return 'bg-muted/50 text-muted-foreground border border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'submitted':
        return <AlertCircle className="h-4 w-4" />;
      case 'draft':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getQualityColor = (score?: number | null) => {
    if (!score && score !== 0) return 'text-muted-foreground';
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const sections = [
    { key: 'executiveSummary', titleKey: 'dpr.sections.executiveSummary', title: 'Executive Summary', icon: FileText },
    { key: 'businessProfile', titleKey: 'dpr.sections.businessProfile', title: 'Business Profile', icon: FileText },
    { key: 'applicantInfo', titleKey: 'dpr.sections.applicantInfo', title: 'Applicant Information', icon: FileText },
    { key: 'projectAtGlance', titleKey: 'dpr.sections.projectAtGlance', title: 'Project at a Glance', icon: FileText },
    { key: 'buildingDetails', titleKey: 'dpr.sections.buildingDetails', title: 'Building Details', icon: FileText },
    { key: 'machineryDetails', titleKey: 'dpr.sections.machineryDetails', title: 'Machinery Details', icon: FileText },
    { key: 'otherCapitalCosts', titleKey: 'dpr.sections.otherCapitalCosts', title: 'Other Capital Costs', icon: FileText },
    { key: 'rawMaterials', titleKey: 'dpr.sections.rawMaterials', title: 'Raw Materials', icon: FileText },
    { key: 'wages', titleKey: 'dpr.sections.wages', title: 'Wages', icon: FileText },
    { key: 'salaryDetails', titleKey: 'dpr.sections.salaryDetails', title: 'Salary Details', icon: FileText },
    { key: 'workingCapitalEstimate', titleKey: 'dpr.sections.workingCapitalEstimate', title: 'Working Capital Estimate', icon: FileText },
    { key: 'powerEstimate', titleKey: 'dpr.sections.powerEstimate', title: 'Power Estimate', icon: FileText },
    { key: 'overheadExpenses', titleKey: 'dpr.sections.overheadExpenses', title: 'Overhead Expenses', icon: FileText },
    { key: 'financing', titleKey: 'dpr.sections.financing', title: 'Financing', icon: FileText },
    { key: 'salesDetails', titleKey: 'dpr.sections.salesDetails', title: 'Sales Details', icon: FileText },
    { key: 'marketAnalysis', titleKey: 'dpr.sections.marketAnalysis', title: 'Market Analysis', icon: BarChart3 },
    { key: 'technicalFeasibility', titleKey: 'dpr.sections.technicalFeasibility', title: 'Technical Feasibility', icon: CheckCircle },
    { key: 'financialProjections', titleKey: 'dpr.sections.financialProjections', title: 'Financial Projections', icon: BarChart3 },
    { key: 'financialParameters', titleKey: 'dpr.sections.financialParameters', title: 'Financial Parameters', icon: BarChart3 },
    { key: 'beneficiaryInfo', titleKey: 'dpr.sections.beneficiaryInfo', title: 'Beneficiary Information', icon: FileText },
    { key: 'eligibleSchemes', titleKey: 'dpr.sections.eligibleSchemes', title: 'Eligible Government Schemes', icon: Award },
    { key: 'conclusion', titleKey: 'dpr.sections.conclusion', title: 'Conclusion', icon: CheckCircle },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('dpr.preview.loadingDPR')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!dpr) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">{t('dpr.preview.dprNotFound')}</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            {t('dpr.preview.backToDashboard')}
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`${isClusterDPR ? 'w-full max-w-none' : 'max-w-6xl mx-auto'} space-y-6 pb-8`}>
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('dpr.preview.backToDashboard')}
        </Button>

        {/* Header Section - Only show for non-cluster DPRs */}
        {!isClusterDPR && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-secondary p-8 text-white mb-6">
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{project?.projectName || t('dpr.preview.dprPreview')}</h1>
                <p className="text-white/90">
                  {new Date(dpr.generatedAt || dpr.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(dpr.status || 'draft')} bg-white/10 backdrop-blur-sm`}>
                  {getStatusIcon(dpr.status || 'draft')}
                  {dpr.status ? t(`dpr.preview.${dpr.status}`) : t('dpr.preview.draft')}
                </span>
                {qualityScore !== null && (
                  <div className={`px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20`}>
                    <p className={`text-sm font-semibold ${getQualityColor(qualityScore)}`}>
                      {t('dpr.preview.quality')}: {qualityScore}/100
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        )}

        {/* Action Bar - Only show for non-cluster DPRs or show simplified for cluster */}
        {!isClusterDPR && (
        <Card className="border-2 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              {/* Language Selector */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Languages className="h-5 w-5 text-primary" />
                </div>
                <select
                  className="h-11 rounded-lg border-2 border-primary/20 bg-background px-4 py-2 text-sm font-medium focus:border-primary focus:outline-none"
                  value={viewLanguage}
                  onChange={(e) => {
                    const newLang = e.target.value as 'english' | 'telugu';
                    setViewLanguage(newLang);
                    // Change i18n language immediately
                    i18n.changeLanguage(newLang === 'telugu' ? 'te' : 'en');
                  }}
                >
                  <option value="english">{t('dpr.english')}</option>
                  <option value="telugu" disabled={!hasTelugu}>
                    {t('dpr.telugu')} {!hasTelugu && `(${t('dpr.notAvailable')})`}
                  </option>
                </select>
                {!hasTelugu && viewLanguage === 'english' && (
                  <Button
                    variant="outline"
                    onClick={handleTranslateToTelugu}
                    disabled={translating}
                    className="border-2 border-secondary text-secondary hover:bg-secondary hover:text-white"
                  >
                    {translating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('dpr.translating')}
                      </>
                    ) : (
                      <>
                        <Languages className="h-4 w-4 mr-2" />
                        {t('dpr.translateToTelugu')}
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => handleDownload('pdf')}
                  className="border-2 hover:bg-primary/5 hover:border-primary"
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDownload('docx')}
                  className="border-2 hover:bg-secondary/5 hover:border-secondary"
                >
                  <Download className="h-4 w-4 mr-2" />
                  DOCX
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDownload('xls')}
                  className="border-2 hover:bg-success/5 hover:border-success"
                >
                  <Download className="h-4 w-4 mr-2" />
                  XLS
                </Button>
                {dpr.status === 'draft' && (
                  <Button
                    onClick={() => handleSubmit('admin')}
                    disabled={submitting}
                    className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submitting ? t('dpr.preview.submitting') : t('dpr.preview.submitToAdmin')}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        )}
        
        {/* Simplified action bar for cluster DPRs */}
        {isClusterDPR && (
          <Card className="border-2 shadow-lg mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <select
                    className="h-11 rounded-lg border-2 border-primary/20 bg-background px-4 py-2 text-sm font-medium"
                    value={viewLanguage}
                    onChange={(e) => {
                      const newLang = e.target.value as 'english' | 'telugu';
                      setViewLanguage(newLang);
                      i18n.changeLanguage(newLang === 'telugu' ? 'te' : 'en');
                    }}
                  >
                    <option value="english">{t('dpr.english')}</option>
                    <option value="telugu" disabled={!hasTelugu}>
                      {t('dpr.telugu')} {!hasTelugu && `(${t('dpr.notAvailable')})`}
                    </option>
                  </select>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={() => handleDownload('pdf')}
                    className="border-2 hover:bg-primary/5 hover:border-primary"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDownload('docx')}
                    className="border-2 hover:bg-secondary/5 hover:border-secondary"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    DOCX
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quality Score Card - Only for non-cluster DPRs */}
        {qualityFeedback && !isClusterDPR && (
          <Card className={`border-2 shadow-lg ${
            qualityScore && qualityScore >= 80 
              ? 'bg-success/5 border-success/30' 
              : qualityScore && qualityScore >= 60 
              ? 'bg-warning/5 border-warning/30' 
              : 'bg-destructive/5 border-destructive/30'
          }`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{t('dpr.preview.dprQualityAnalysis')}</CardTitle>
                  <CardDescription>{t('dpr.preview.aiPoweredComprehensiveQualityAssessment')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Overall Score */}
                <div className="flex items-center justify-between p-6 rounded-lg bg-white/50 border-2 border-primary/20">
                  <div>
                    <span className="text-base font-semibold text-muted-foreground">{t('dpr.preview.overallQualityScore')}</span>
                    <p className="text-xs text-muted-foreground mt-1">{t('dpr.preview.basedOnCompleteness')}</p>
                  </div>
                  <span className={`text-4xl font-bold ${getQualityColor(qualityScore)}`}>
                    {qualityScore}/100
                  </span>
                </div>

                {/* Detailed Metrics */}
                {qualityFeedback.detailedMetrics && (
                  <div>
                    <p className="text-sm font-semibold mb-4 text-muted-foreground">{t('dpr.preview.qualityMetricsBreakdown')}</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {Object.entries(qualityFeedback.detailedMetrics).map(([key, value]: [string, any]) => (
                        <div key={key} className="p-3 rounded-lg bg-white/50 border border-primary/10">
                          <p className="text-xs text-muted-foreground mb-1 capitalize">{key}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  value >= 80 ? 'bg-success' : value >= 60 ? 'bg-warning' : 'bg-destructive'
                                }`}
                                style={{ width: `${value}%` }}
                              />
                            </div>
                            <span className={`text-sm font-bold ${
                              value >= 80 ? 'text-success' : value >= 60 ? 'text-warning' : 'text-destructive'
                            }`}>
                              {value}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section Scores */}
                {qualityFeedback.sectionScores && (
                  <div>
                    <p className="text-sm font-semibold mb-4 text-muted-foreground">{t('dpr.preview.sectionBySectionScores')}</p>
                    <div className="space-y-3">
                      {Object.entries(qualityFeedback.sectionScores).map(([section, score]: [string, any]) => {
                        const sectionName = section.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
                        return (
                          <div key={section} className="p-3 rounded-lg bg-white/50 border border-primary/10">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">{sectionName}</span>
                              <span className={`text-sm font-bold ${getQualityColor(score)}`}>
                                {score}/100
                              </span>
                            </div>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all ${
                                  score >= 80 ? 'bg-success' : score >= 60 ? 'bg-warning' : 'bg-destructive'
                                }`}
                                style={{ width: `${score}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section Details */}
                {qualityFeedback.sectionDetails && (
                  <div>
                    <p className="text-sm font-semibold mb-4 text-muted-foreground">{t('dpr.preview.detailedSectionAnalysis')}</p>
                    <div className="space-y-4">
                      {Object.entries(qualityFeedback.sectionDetails).map(([sectionName, details]: [string, any]) => (
                        <div key={sectionName} className="p-4 rounded-lg bg-white/50 border border-primary/10">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold">{sectionName}</h4>
                            <span className={`text-lg font-bold ${getQualityColor(details.score)}`}>
                              {details.score}/100
                            </span>
                          </div>
                          <div className="grid md:grid-cols-3 gap-3">
                            {details.strengths && details.strengths.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-success mb-2">{t('dpr.preview.strengths')}:</p>
                                <ul className="space-y-1">
                                  {details.strengths.map((strength: string, idx: number) => (
                                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                                      <CheckCircle className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
                                      <span>{strength}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {details.weaknesses && details.weaknesses.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-warning mb-2">{t('dpr.preview.weaknesses')}:</p>
                                <ul className="space-y-1">
                                  {details.weaknesses.map((weakness: string, idx: number) => (
                                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                                      <AlertCircle className="h-3 w-3 text-warning mt-0.5 flex-shrink-0" />
                                      <span>{weakness}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {details.suggestions && details.suggestions.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-primary mb-2">{t('dpr.preview.suggestions')}:</p>
                                <ul className="space-y-1">
                                  {details.suggestions.map((suggestion: string, idx: number) => (
                                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                                      <Sparkles className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                                      <span>{suggestion}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* General Feedback */}
                {qualityFeedback.feedback && qualityFeedback.feedback.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-3 text-muted-foreground">{t('dpr.preview.generalFeedback')}:</p>
                    <div className="space-y-2">
                      {qualityFeedback.feedback.map((fb: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-white/50 border border-primary/10">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{fb}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {qualityFeedback.recommendations && qualityFeedback.recommendations.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-3 text-muted-foreground">{t('dpr.preview.recommendationsForImprovement')}:</p>
                    <div className="space-y-2">
                      {qualityFeedback.recommendations.map((rec: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weak Sections */}
                {qualityFeedback.weakSections && qualityFeedback.weakSections.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-3 text-muted-foreground">{t('dpr.preview.sectionsNeedingImprovement')}:</p>
                    <div className="flex flex-wrap gap-2">
                      {qualityFeedback.weakSections.map((section: string, idx: number) => (
                        <span key={idx} className="px-3 py-1.5 bg-warning/10 text-warning border border-warning/20 rounded-lg text-sm font-medium">
                          {section}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* DPR Sections */}
        {isClusterDPR ? (
          <Card className="border-2 shadow-lg">
            <CardHeader className="flex-shrink-0 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle>DPR Preview</CardTitle>
                <div className="flex items-center gap-2">
                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1 border rounded-lg p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewZoom(Math.max(0.3, previewZoom - 0.1))}
                      className="h-7 w-7 p-0"
                      title="Zoom Out"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-xs px-2 min-w-[3rem] text-center">
                      {Math.round(previewZoom * 100)}%
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewZoom(Math.min(2, previewZoom + 0.1))}
                      className="h-7 w-7 p-0"
                      title="Zoom In"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewZoom(0.6)}
                      className="h-7 w-7 p-0"
                      title="Reset Zoom to 60%"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-auto p-4 bg-gray-100" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              <div 
                className="w-full overflow-auto"
                style={{ 
                  transform: `scale(${previewZoom})`,
                  transformOrigin: 'top left',
                  width: `${100 / previewZoom}%`,
                  height: `${100 / previewZoom}%`,
                }}
              >
                <div className="bg-white shadow-2xl mx-auto" style={{ width: '21cm', minHeight: '29.7cm' }}>
                  <ClusterDPRDocumentView dpr={dpr} project={project} viewLanguage={viewLanguage} />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sections.map((section) => {
            const content = dpr.content[viewLanguage]?.[section.key] || '';
            const isEditing = editingSection === section.key;
            const sectionTitle = section.title || t(section.titleKey || '');
            const isWeak = qualityFeedback?.weakSections?.some((s: string) => {
              if (!s || typeof s !== 'string' || !sectionTitle) return false;
              return s.toLowerCase().includes(sectionTitle.toLowerCase());
            }) || false;
            const SectionIcon = section.icon;

            return (
              <Card 
                key={section.key} 
                className={`border-2 shadow-lg transition-all ${
                  isWeak ? 'border-warning/30 bg-warning/5' : 'border-primary/10'
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        isWeak ? 'bg-warning/10' : 'bg-primary/10'
                      }`}>
                        <SectionIcon className={`h-5 w-5 ${isWeak ? 'text-warning' : 'text-primary'}`} />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{t(section.titleKey)}</CardTitle>
                        {isWeak && (
                          <CardDescription className="text-warning">
                            {t('dpr.preview.thisSectionNeedsImprovement')}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    {!isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(section.key)}
                        className="border-2 hover:bg-primary/5 hover:border-primary"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        {t('dpr.preview.edit')}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <textarea
                        className="w-full p-4 border-2 rounded-xl min-h-[300px] focus:border-primary focus:outline-none resize-none"
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        placeholder={t('dpr.preview.enterContent', { section: t(section.titleKey) })}
                      />
                      <div className="flex justify-end gap-3">
                        <Button 
                          variant="outline" 
                          onClick={handleCancel} 
                          disabled={saving}
                          className="border-2"
                        >
                          <X className="h-4 w-4 mr-2" />
                          {t('dpr.preview.cancel')}
                        </Button>
                        <Button 
                          onClick={handleSave} 
                          disabled={saving}
                          className="bg-primary hover:bg-primary/90 text-white"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {saving ? t('dpr.preview.saving') : t('dpr.preview.saveChanges')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="prose max-w-none" style={{ textAlign: 'left' }}>
                      {content ? (
                        <FormattedText text={content} />
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>{t('dpr.preview.noContentAvailable')}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          </div>
        )}
      </div>
    </Layout>
  );
};
