// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/api';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Download, FileText, Loader2 } from 'lucide-react';
import { downloadBlob } from '@/lib/utils';
import { FormattedText } from '@/utils/textFormatter';

export const DPRGeneration: React.FC = () => {
  const { t } = useTranslation();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [dpr, setDpr] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'telugu' | 'bilingual'>('bilingual');
  const [viewLanguage, setViewLanguage] = useState<'english' | 'telugu'>('english');

  useEffect(() => {
    loadProject();
    loadExistingDPRs();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const response = await api.getProject(projectId!);
      setProject(response.data || response);
    } catch (error) {
      toast.error('Failed to load project');
    }
  };

  const loadExistingDPRs = async () => {
    try {
      const response = await api.getProjectDPRs(projectId!);
      const dprs = response.data || response;
      if (Array.isArray(dprs) && dprs.length > 0) {
        setDpr(dprs[0]);
      }
    } catch (error) {
      console.log('No existing DPRs');
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await api.generateDPR(projectId!, selectedLanguage);
      const dpr = response.data || response;
      setDpr(dpr);
      toast.success(t('dpr.generationSuccess'));
    } catch (error) {
      toast.error('Failed to generate DPR');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      // Handle both dprId (from generateDPR) and _id (from getProjectDPRs)
      const dprId = dpr.dprId || dpr._id;
      if (!dprId) {
        toast.error('DPR ID not found');
        return;
      }
      const blob = await api.downloadPDF(dprId, viewLanguage);
      downloadBlob(blob, `DPR_${project.projectName}_${viewLanguage}.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadDOCX = async () => {
    setIsDownloading(true);
    try {
      // Handle both dprId (from generateDPR) and _id (from getProjectDPRs)
      const dprId = dpr.dprId || dpr._id;
      if (!dprId) {
        toast.error('DPR ID not found');
        return;
      }
      const blob = await api.downloadDOCX(dprId, viewLanguage);
      downloadBlob(blob, `DPR_${project.projectName}_${viewLanguage}.docx`);
      toast.success('DOCX downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download DOCX');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/projects')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{t('dpr.title')}</CardTitle>
            <p className="text-muted-foreground">{project.projectName}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {!dpr ? (
              <div className="text-center py-12 space-y-6">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    No DPR Generated Yet
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Generate a professional DPR for your project
                  </p>
                  
                  <div className="max-w-sm mx-auto space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('dpr.selectLanguage')}
                      </label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={selectedLanguage}
                        onChange={(e) =>
                          setSelectedLanguage(e.target.value as any)
                        }
                      >
                        <option value="english">{t('dpr.english')}</option>
                        <option value="telugu">{t('dpr.telugu')}</option>
                        <option value="bilingual">{t('dpr.bilingual')}</option>
                      </select>
                    </div>
                    
                    <Button
                      onClick={handleGenerate}
                      isLoading={isGenerating}
                      className="w-full"
                      size="lg"
                    >
                      {t('dpr.generate')}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">
                      DPR Generated Successfully
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Version {dpr.versionNumber || 1} • Generated on{' '}
                      {new Date(dpr.generatedAt || dpr.createdAt || new Date()).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <select
                      className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={viewLanguage}
                      onChange={(e) =>
                        setViewLanguage(e.target.value as 'english' | 'telugu')
                      }
                    >
                      <option value="english">{t('dpr.english')}</option>
                      <option value="telugu">{t('dpr.telugu')}</option>
                    </select>
                    <Button
                      onClick={handleDownloadPDF}
                      isLoading={isDownloading}
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {t('dpr.downloadPDF')}
                    </Button>
                    <Button
                      onClick={handleDownloadDOCX}
                      isLoading={isDownloading}
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {t('dpr.downloadDOCX')}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {Object.entries(t('dpr.sections', { returnObjects: true }) as Record<string, string>).map(
                    ([key, title]) => (
                      <Card key={key}>
                        <CardHeader>
                          <CardTitle className="text-lg">{title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-gray-700">
                            <FormattedText 
                              text={dpr.content[viewLanguage]?.[key] || 'Content not available'} 
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )
                  )}
                </div>

                <Button
                  onClick={handleGenerate}
                  isLoading={isGenerating}
                  variant="outline"
                  className="w-full"
                >
                  Regenerate DPR
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

