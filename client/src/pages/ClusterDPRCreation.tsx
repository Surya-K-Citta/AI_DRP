// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Save, Download, Eye, ChevronRight, ChevronLeft } from 'lucide-react';
import { useClusterDPRStore } from '@/store/clusterDPRStore';
import { ClusterDPRForm } from '@/components/cluster-dpr/ClusterDPRForm';
import { ClusterDPRDocumentView } from '@/components/cluster-dpr/ClusterDPRDocumentView';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/api';

export const ClusterDPRCreation: React.FC = () => {
  const navigate = useNavigate();
  const { data, setCurrentStep, saveDraft, setGeneratedDPR } = useClusterDPRStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState<'split' | 'form' | 'preview'>('split');
  const [viewLanguage, setViewLanguage] = useState<'english' | 'telugu'>('english');

  const currentStep = data.currentStep || 1;
  const totalSteps = 18;

  useEffect(() => {
    // Auto-save draft every 30 seconds
    const interval = setInterval(() => {
      saveDraft();
    }, 30000);

    return () => clearInterval(interval);
  }, [saveDraft]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      // Scroll to top of form
      document.getElementById('cluster-dpr-form')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Scroll to top of form
      document.getElementById('cluster-dpr-form')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStepClick = (step: number) => {
    setCurrentStep(step);
    document.getElementById('cluster-dpr-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSaveDraft = () => {
    saveDraft();
    toast.success('Draft saved successfully!');
  };

  const handleGenerateDPR = async () => {
    setIsGenerating(true);
    try {
      // Validate that at least some data is provided
      if (!data.step1 || !data.step1.clusterName) {
        toast.error('Please fill in at least Step 1 (Basic Cluster Details) before generating DPR.');
        setIsGenerating(false);
        return;
      }

      toast.loading('Generating DPR with AI enhancement...', { id: 'generating-dpr' });
      
      // Call backend API to generate DPR with OpenAI enhancement
      const response = await api.generateClusterDPR(data, 'bilingual');
      
      if (response.success && response.data) {
        // Store the generated DPR in the store
        setGeneratedDPR(response.data.content);
        
        // Navigate to view the generated DPR
        toast.success('DPR generated successfully!', { id: 'generating-dpr' });
        navigate(`/dpr/view/${response.data.dprId}`);
      } else {
        throw new Error(response.message || 'Failed to generate DPR');
      }
    } catch (error: any) {
      console.error('Error generating DPR:', error);
      toast.error(
        error.response?.data?.message || 
        error.message || 
        'Failed to generate DPR. Please try again.',
        { id: 'generating-dpr' }
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const getStepCompletion = (step: number): boolean => {
    const stepData = data[`step${step}` as keyof typeof data];
    return !!stepData;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Cluster DPR Creation</h1>
                  <p className="text-sm text-muted-foreground">
                    Step {currentStep} of {totalSteps}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveDraft}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Draft
                </Button>
                
                <div className="flex items-center gap-1 border rounded-lg p-1">
                  <Button
                    variant={previewMode === 'form' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setPreviewMode('form')}
                    className="gap-2"
                  >
                    Form
                  </Button>
                  <Button
                    variant={previewMode === 'split' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setPreviewMode('split')}
                    className="gap-2"
                  >
                    Split
                  </Button>
                  <Button
                    variant={previewMode === 'preview' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setPreviewMode('preview')}
                    className="gap-2"
                  >
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
                  disabled={currentStep < totalSteps}
                >
                  Generate DPR
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Step Progress Indicator */}
        <div className="sticky top-[73px] z-40 bg-background/95 backdrop-blur border-b border-border">
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
                const isCompleted = getStepCompletion(step);
                const isCurrent = step === currentStep;
                
                return (
                  <button
                    key={step}
                    onClick={() => handleStepClick(step)}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                      ${isCurrent 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : isCompleted
                        ? 'bg-success/10 text-success border border-success/20 hover:bg-success/20'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      }
                    `}
                  >
                    <span className={`
                      w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                      ${isCurrent ? 'bg-primary-foreground/20' : isCompleted ? 'bg-success' : 'bg-muted-foreground/20'}
                    `}>
                      {isCompleted && !isCurrent ? '✓' : step}
                    </span>
                    <span className="hidden sm:inline">Step {step}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className={`
            grid gap-6
            ${previewMode === 'form' ? 'grid-cols-1' : ''}
            ${previewMode === 'preview' ? 'grid-cols-1' : ''}
            ${previewMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : ''}
          `}>
            {/* Left Panel: Form */}
            {(previewMode === 'form' || previewMode === 'split') && (
              <div id="cluster-dpr-form" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {currentStep === 1 && 'Step 1: Executive Summary – Basic Cluster Details'}
                      {currentStep === 2 && 'Step 2: Introduction & Sector Overview'}
                      {currentStep === 3 && 'Step 3: District & Regional Profile'}
                      {currentStep === 4 && 'Step 4: Cluster Profile'}
                      {currentStep === 5 && 'Step 5: Value Chain Details'}
                      {currentStep === 6 && 'Step 6: Market Assessment'}
                      {currentStep === 7 && 'Step 7: Gap Analysis'}
                      {currentStep === 8 && 'Step 8: SWOT Analysis'}
                      {currentStep === 9 && 'Step 9: Proposed Interventions'}
                      {currentStep === 10 && 'Step 10: Common Facility Centre (CFC) Details'}
                      {currentStep === 11 && 'Step 11: SPV Details'}
                      {currentStep === 12 && 'Step 12: Project Cost Details'}
                      {currentStep === 13 && 'Step 13: Means of Finance'}
                      {currentStep === 14 && 'Step 14: Operating Cost & Revenue'}
                      {currentStep === 15 && 'Step 15: Financial Viability'}
                      {currentStep === 16 && 'Step 16: Project Implementation Schedule'}
                      {currentStep === 17 && 'Step 17: Expected Impact'}
                      {currentStep === 18 && 'Step 18: Annexures & Document Uploads'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ClusterDPRForm 
                      currentStep={currentStep}
                      onNext={handleNext}
                      onPrevious={handlePrevious}
                    />
                  </CardContent>
                </Card>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <Button
                    variant="primary"
                    onClick={handleNext}
                    disabled={currentStep === totalSteps}
                    className="gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Right Panel: Preview */}
            {(previewMode === 'preview' || previewMode === 'split') && (
              <div className="space-y-6">
                <Card className="sticky top-[146px] max-h-[calc(100vh-170px)] overflow-hidden flex flex-col">
                  <CardHeader className="flex-shrink-0 border-b border-border">
                    <div className="flex items-center justify-between">
                      <CardTitle>Live DPR Preview</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const previewElement = document.getElementById('dpr-preview');
                          if (previewElement) {
                            previewElement.requestFullscreen?.();
                          }
                        }}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Fullscreen
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-0 bg-gray-100">
                    <div id="dpr-preview" className="bg-white" style={{ minHeight: '100%', width: '100%', padding: '2rem' }}>
                      <ClusterDPRDocumentView 
                        dpr={{
                          content: {
                            english: {
                              clusterData: data,
                              ...data.generatedDPR?.sections,
                            },
                          },
                          metadata: {
                            clusterData: data,
                          },
                        }}
                        project={{
                          projectName: data.step1?.clusterName,
                          projectType: 'cluster',
                        }}
                        viewLanguage="english"
                      />
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
