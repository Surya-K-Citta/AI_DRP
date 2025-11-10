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
  Eye,
} from 'lucide-react';
import { downloadBlob } from '@/lib/utils';
import { FormattedText } from '@/utils/textFormatter';

export const DPRPreview: React.FC = () => {
  const { t } = useTranslation();
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

  useEffect(() => {
    if (dprId) {
      loadDPR();
    }
  }, [dprId]);

  const loadDPR = async () => {
    try {
      setLoading(true);
      const [dprResponse, qualityResponse] = await Promise.all([
        api.getDPR(dprId!),
        api.analyzeDPRQuality(dprId!).catch(() => null),
      ]);

      const dprData = dprResponse.data || dprResponse;
      setDpr(dprData);
      
      if (dprData.projectId) {
        if (typeof dprData.projectId === 'string') {
          const projectResponse = await api.getProject(dprData.projectId);
          setProject(projectResponse.data || projectResponse);
        } else {
          setProject(dprData.projectId);
        }
      }

      if (qualityResponse?.data) {
        setQualityScore(qualityResponse.data.score);
        setQualityFeedback(qualityResponse.data);
      } else if (dprData.qualityScore) {
        setQualityScore(dprData.qualityScore);
        setQualityFeedback(dprData.qualityFeedback);
      }
    } catch (error) {
      console.error('Failed to load DPR:', error);
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
      let blob;
      if (format === 'pdf') {
        blob = await api.downloadPDF(dprId!, viewLanguage);
        downloadBlob(blob, `DPR_${project?.projectName || 'Report'}_${viewLanguage}.pdf`);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success/10 text-success border-success/20';
      case 'submitted':
        return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'draft':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
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

  const getQualityColor = (score?: number) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const sections = [
    { key: 'executiveSummary', title: 'Executive Summary', icon: FileText },
    { key: 'businessProfile', title: 'Business Profile', icon: FileText },
    { key: 'marketAnalysis', title: 'Market Analysis', icon: BarChart3 },
    { key: 'technicalFeasibility', title: 'Technical Feasibility', icon: CheckCircle },
    { key: 'financialProjections', title: 'Financial Projections', icon: BarChart3 },
    { key: 'conclusion', title: 'Conclusion', icon: CheckCircle },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading DPR...</p>
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
          <p className="text-muted-foreground text-lg">DPR not found</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 pb-8">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-secondary p-8 text-white mb-6">
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{project?.projectName || 'DPR Preview'}</h1>
                <p className="text-white/90">
                  Version {dpr.versionNumber} • {new Date(dpr.generatedAt || dpr.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(dpr.status || 'draft')} bg-white/10 backdrop-blur-sm`}>
                  {getStatusIcon(dpr.status || 'draft')}
                  {dpr.status ? dpr.status.charAt(0).toUpperCase() + dpr.status.slice(1) : 'Draft'}
                </span>
                {qualityScore !== null && (
                  <div className={`px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20`}>
                    <p className={`text-sm font-semibold ${getQualityColor(qualityScore)}`}>
                      Quality: {qualityScore}/100
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* Action Bar */}
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
                  onChange={(e) => setViewLanguage(e.target.value as 'english' | 'telugu')}
                >
                  <option value="english">English</option>
                  <option value="telugu">Telugu</option>
                </select>
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
                    className="bg-success hover:bg-success/90 text-white shadow-lg"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submitting ? 'Submitting...' : 'Submit to Admin'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quality Score Card */}
        {qualityFeedback && (
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
                  <CardTitle>DPR Quality Analysis</CardTitle>
                  <CardDescription>AI-powered quality assessment</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/50">
                  <span className="text-base font-semibold">Overall Score</span>
                  <span className={`text-3xl font-bold ${getQualityColor(qualityScore)}`}>
                    {qualityScore}/100
                  </span>
                </div>

                {qualityFeedback.feedback && qualityFeedback.feedback.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-3 text-muted-foreground">Feedback:</p>
                    <div className="space-y-2">
                      {qualityFeedback.feedback.slice(0, 5).map((fb: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-white/50 border border-primary/10">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{fb}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {qualityFeedback.weakSections && qualityFeedback.weakSections.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-3 text-muted-foreground">Sections Needing Improvement:</p>
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
        <div className="space-y-6">
          {sections.map((section) => {
            const content = dpr.content[viewLanguage]?.[section.key] || '';
            const isEditing = editingSection === section.key;
            const isWeak = qualityFeedback?.weakSections?.some((s: string) => 
              s.toLowerCase().includes(section.title.toLowerCase())
            );
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
                        <CardTitle className="text-xl">{section.title}</CardTitle>
                        {isWeak && (
                          <CardDescription className="text-warning">
                            This section needs improvement
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
                        Edit
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
                        placeholder={`Enter ${section.title} content...`}
                      />
                      <div className="flex justify-end gap-3">
                        <Button 
                          variant="outline" 
                          onClick={handleCancel} 
                          disabled={saving}
                          className="border-2"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSave} 
                          disabled={saving}
                          className="bg-primary hover:bg-primary/90 text-white"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="prose max-w-none">
                      {content ? (
                        <FormattedText text={content} />
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No content available for this section</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};
