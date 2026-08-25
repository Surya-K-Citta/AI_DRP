// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Save, Eye, ChevronRight, ChevronLeft, ZoomIn, ZoomOut, Maximize2, RotateCcw, Loader2 } from 'lucide-react';
import { useIndividualDPRStore } from '@/store/individualDPRStore';
import { IndividualDPRForm } from '@/components/individual-dpr/IndividualDPRForm';
import { ClusterDPRDocumentView } from '@/components/cluster-dpr/ClusterDPRDocumentView';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/api';
import { toClusterPayload } from '@/lib/individualDpr/toClusterPayload';
import { getVisibleSteps, getStepTitle, SCHEME_OPTIONS, getSchemeImpact } from '@/lib/individualDpr/schemeFormConfig';
import { peekHandoff } from '@/lib/ventureMatch/mapToDpr';
import { prefillFromVentureMatch } from '@/lib/individualDpr/prefillFromVentureMatch';

export const IndividualDPRCreation: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const {
    data,
    setCurrentStep,
    setGeneratedDPR,
    resetData,
    setDprIds,
    loadDataFromProject,
    setStepData,
    setMatchedSchemeCode,
    setVentureMatchAnswers,
    applyPrefill,
  } = useIndividualDPRStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState<'split' | 'form' | 'preview'>('split');
  const [previewZoom, setPreviewZoom] = useState(0.6);
  const [project, setProject] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const currentStep = data.currentStep || 1;
  const visibleSteps = getVisibleSteps(data.matchedSchemeCode || null);
  const lastVisible = visibleSteps[visibleSteps.length - 1] || 18;
  const stepOrdinal = Math.max(1, visibleSteps.indexOf(currentStep) + 1);
  const schemeImpact = getSchemeImpact(data.matchedSchemeCode || null);
  const clusterPayload = toClusterPayload(data);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoadingData(true);
        const projectIdFromUrl = params.projectId || searchParams.get('projectId');
        const dprIdFromUrl = params.dprId || searchParams.get('dprId');
        const isNew = searchParams.get('new') === 'true';
        const schemeFromUrl = searchParams.get('scheme');

        if (isNew) {
          resetData();
          setDprIds('', '');
          setProject(null);

          const handoff = peekHandoff();
          const answers = handoff?.answers || null;
          if (answers) setVentureMatchAnswers(answers);

          const scheme = schemeFromUrl || null;
          setMatchedSchemeCode(scheme);

          if (answers) {
            applyPrefill(prefillFromVentureMatch(answers));
          }
          setCurrentStep(1);
          setIsLoadingData(false);
          return;
        }

        if (projectIdFromUrl) {
          try {
            const projectResponse = await api.getProject(projectIdFromUrl);
            const projectData = projectResponse.data || projectResponse;
            setProject(projectData);
            let dprData = null;
            if (dprIdFromUrl) {
              try {
                const dprResponse = await api.getClusterDPR(dprIdFromUrl);
                dprData = dprResponse.data || dprResponse;
              } catch {
                /* draft only */
              }
            }
            loadDataFromProject(projectData, dprData);
            const pid = projectData._id || projectData.id;
            setDprIds(dprData?._id || dprData?.id || '', pid);
          } catch {
            resetData();
          }
        } else {
          resetData();
        }
      } finally {
        setIsLoadingData(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!visibleSteps.includes(currentStep) && visibleSteps.length) {
      setCurrentStep(visibleSteps[0]);
    }
  }, [data.matchedSchemeCode]);

  const saveToDatabase = useCallback(async () => {
    try {
      const hasAnyData = Object.keys(data).some((key) => {
        if (key.startsWith('step')) {
          const stepData = data[key];
          return stepData && typeof stepData === 'object' && Object.keys(stepData).length > 0;
        }
        return false;
      });
      if (hasAnyData || data.projectId) {
        const response = await api.saveClusterDPRDraft(clusterPayload);
        if (response.success && response.data) {
          if (response.data.dprId && response.data.projectId) {
            setDprIds(response.data.dprId, response.data.projectId);
            const schemeQ = data.matchedSchemeCode ? `&scheme=${data.matchedSchemeCode}` : '';
            window.history.replaceState(
              {},
              '',
              `/individual-dpr/create?projectId=${response.data.projectId}&dprId=${response.data.dprId}${schemeQ}`
            );
          }
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft to database');
      return false;
    }
  }, [clusterPayload, data, setDprIds]);

  const goAdjacent = async (dir: 1 | -1) => {
    await saveToDatabase();
    const idx = visibleSteps.indexOf(currentStep);
    const next = visibleSteps[idx + dir];
    if (next) {
      setCurrentStep(next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveDraft = async () => {
    const success = await saveToDatabase();
    if (success) toast.success('Draft saved to database successfully!');
    else if (!data.step1?.clusterName) toast.error('Please complete Step 1 (Unit / project name) before saving');
    else toast.error('Failed to save draft');
  };

  const handleGenerateDPR = async () => {
    setIsGenerating(true);
    try {
      if (!data.step1 || !data.step1.clusterName) {
        toast.error('Please fill in at least Step 1 (unit name) before generating DPR.');
        setIsGenerating(false);
        return;
      }
      const saveSuccess = await saveToDatabase();
      if (!saveSuccess) {
        toast.error('Failed to save data before generating DPR');
        setIsGenerating(false);
        return;
      }

      toast.loading('Generating DPR with AI enhancement...', { id: 'generating-dpr' });
      const response = await api.generateClusterDPR(
        {
          ...clusterPayload,
          currentStep: undefined,
          isDraft: undefined,
          lastSaved: undefined,
          generatedDPR: undefined,
        },
        'bilingual'
      );

      if (response.success && response.data) {
        setGeneratedDPR(response.data.content);
        resetData();
        toast.success('DPR generated successfully!', { id: 'generating-dpr' });
        navigate(`/dpr/view/${response.data.dprId}`);
      } else {
        throw new Error(response.message || 'Failed to generate DPR');
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.message || 'Failed to generate DPR. Please try again.',
        { id: 'generating-dpr' }
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const getStepCompletion = (step: number): boolean => {
    const stepData = data[`step${step}`];
    return !!stepData;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Create New Latest DPR</h1>
                  <p className="text-sm text-muted-foreground">
                    Step {stepOrdinal} of {visibleSteps.length} visible steps
                    {visibleSteps.length !== 18 ? ` (${18 - visibleSteps.length} hidden for this scheme)` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm max-w-[260px]"
                  value={data.matchedSchemeCode || ''}
                  onChange={(e) => {
                    const code = e.target.value || null;
                    setMatchedSchemeCode(code);
                    const nextVisible = getVisibleSteps(code);
                    const impact = getSchemeImpact(code);
                    const jumpTo = nextVisible.includes(impact.firstChangedStep)
                      ? impact.firstChangedStep
                      : nextVisible[0];
                    setCurrentStep(jumpTo);
                  }}
                >
                  {SCHEME_OPTIONS.map((opt) => (
                    <option key={opt.code || 'vanilla'} value={opt.code}>
                      {opt.code ? opt.label : 'Know which scheme you want? Vanilla bank term loan'}
                    </option>
                  ))}
                </select>
                <Button variant="outline" size="sm" onClick={handleSaveDraft} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Draft
                </Button>
                <div className="flex items-center gap-1 border rounded-lg p-1">
                  <Button variant={previewMode === 'form' ? 'primary' : 'ghost'} size="sm" onClick={() => setPreviewMode('form')}>
                    Form
                  </Button>
                  <Button variant={previewMode === 'split' ? 'primary' : 'ghost'} size="sm" onClick={() => setPreviewMode('split')}>
                    Split
                  </Button>
                  <Button variant={previewMode === 'preview' ? 'primary' : 'ghost'} size="sm" onClick={() => setPreviewMode('preview')} className="gap-2">
                    <Eye className="h-4 w-4" />
                    Preview
                  </Button>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleGenerateDPR}
                  isLoading={isGenerating}
                  className="gap-2"
                  disabled={currentStep !== lastVisible}
                >
                  Generate DPR
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky top-[73px] z-40 bg-background/95 backdrop-blur border-b border-border">
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {visibleSteps.map((step) => {
                const isCompleted = getStepCompletion(step);
                const isCurrent = step === currentStep;
                return (
                  <button
                    key={step}
                    onClick={() => {
                      setCurrentStep(step);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                      ${isCurrent
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : isCompleted
                        ? 'bg-success/10 text-success border border-success/20 hover:bg-success/20'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'}
                    `}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${isCurrent ? 'bg-primary-foreground/20' : isCompleted ? 'bg-success' : 'bg-muted-foreground/20'}`}>
                      {isCompleted && !isCurrent ? '✓' : step}
                    </span>
                    <span className="hidden sm:inline">Step {step}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <p className="text-sm font-semibold text-foreground">
              Scheme: {schemeImpact.title}
            </p>
            <ul className="mt-1 text-sm text-muted-foreground list-disc pl-5 space-y-0.5">
              {schemeImpact.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className={`grid gap-6 ${previewMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {(previewMode === 'form' || previewMode === 'split') && (
              <div id="cluster-dpr-form" className="space-y-6">
                {isLoadingData ? (
                  <Card>
                    <CardContent className="py-12">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading...</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>{getStepTitle(currentStep)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <IndividualDPRForm
                        key={`step-${currentStep}-${data.projectId || 'new'}-${data.matchedSchemeCode || 'vanilla'}`}
                        currentStep={currentStep}
                        onNext={() => goAdjacent(1)}
                        onPrevious={() => goAdjacent(-1)}
                      />
                    </CardContent>
                  </Card>
                )}

                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={() => goAdjacent(-1)} disabled={currentStep === visibleSteps[0]} className="gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button variant="primary" onClick={() => goAdjacent(1)} disabled={currentStep === lastVisible} className="gap-2">
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {(previewMode === 'preview' || previewMode === 'split') && (
              <div className="space-y-6">
                <Card className="sticky top-[146px] max-h-[calc(100vh-170px)] overflow-hidden flex flex-col">
                  <CardHeader className="flex-shrink-0 border-b border-border">
                    <div className="flex items-center justify-between">
                      <CardTitle>Live DPR Preview</CardTitle>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 border rounded-lg p-1">
                          <Button variant="ghost" size="sm" onClick={() => setPreviewZoom(Math.max(0.5, previewZoom - 0.1))} className="h-7 w-7 p-0">
                            <ZoomOut className="h-4 w-4" />
                          </Button>
                          <span className="text-xs px-2 min-w-[3rem] text-center">{Math.round(previewZoom * 100)}%</span>
                          <Button variant="ghost" size="sm" onClick={() => setPreviewZoom(Math.min(2, previewZoom + 0.1))} className="h-7 w-7 p-0">
                            <ZoomIn className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setPreviewZoom(1)} className="h-7 w-7 p-0">
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('dpr-preview-container')?.requestFullscreen?.()}
                          className="gap-2"
                        >
                          <Maximize2 className="h-4 w-4" />
                          Fullscreen
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto p-0 bg-gray-100 relative">
                    <div
                      id="dpr-preview-container"
                      className="w-full h-full overflow-auto"
                      style={{
                        transform: `scale(${previewZoom})`,
                        transformOrigin: 'top left',
                        width: `${100 / previewZoom}%`,
                        height: `${100 / previewZoom}%`,
                      }}
                    >
                      <div id="dpr-preview" className="bg-white mx-auto shadow-lg" style={{ minHeight: '100%', width: '21cm', padding: '2rem' }}>
                        <ClusterDPRDocumentView
                          dpr={{
                            content: {
                              english: {
                                clusterData: clusterPayload,
                                ...data.generatedDPR?.sections,
                              },
                            },
                            metadata: {
                              clusterData: clusterPayload,
                              isIndividualDPR: true,
                            },
                          }}
                          project={project || {
                            _id: data.projectId,
                            id: data.projectId,
                            projectName: data.step1?.clusterName,
                            projectType: 'cluster',
                            stepData: clusterPayload,
                          }}
                          viewLanguage="english"
                          onSectionClick={(stepNumber: number) => {
                            if (visibleSteps.includes(stepNumber)) setCurrentStep(stepNumber);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          onDataChange={(field, value) => {
                            if (field === 'financialStatements') {
                              setStepData(15, { ...(data.step15 || {}), financialStatements: value });
                            }
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
