// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Save, Download, Eye, ChevronRight, ChevronLeft, ZoomIn, ZoomOut, Maximize2, RotateCcw, Sparkles, Loader2, X, Check } from 'lucide-react';
import { useClusterDPRStore } from '@/store/clusterDPRStore';
import { ClusterDPRForm } from '@/components/cluster-dpr/ClusterDPRForm';
import { ClusterDPRDocumentView } from '@/components/cluster-dpr/ClusterDPRDocumentView';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/api';

export const ClusterDPRCreation: React.FC = () => {
  const navigate = useNavigate();
  const { data, setCurrentStep, saveDraft, setGeneratedDPR, setStepData, getStepData } = useClusterDPRStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState<'split' | 'form' | 'preview'>('split');
  const [viewLanguage, setViewLanguage] = useState<'english' | 'telugu'>('english');
  const [previewZoom, setPreviewZoom] = useState(0.6); // Default to 60% zoom
  const [previewScroll, setPreviewScroll] = useState(0);
  
  // AI Suggestions state
  const [aiSuggestions, setAiSuggestions] = useState<Record<number, any>>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState<Record<number, boolean>>({});

  const currentStep = data.currentStep || 1;
  const totalSteps = 18;

  useEffect(() => {
    // Auto-save draft every 30 seconds
    const interval = setInterval(() => {
      saveDraft();
    }, 30000);

    return () => clearInterval(interval);
  }, [saveDraft]);

  // Auto-scroll preview to current step section
  useEffect(() => {
    if (previewMode === 'split' || previewMode === 'preview') {
      // Small delay to ensure DOM is updated and content is rendered
      const timer = setTimeout(() => {
        const previewContainer = document.getElementById('dpr-preview-container');
        const sectionElement = document.getElementById(`section-step-${currentStep}`);
        
        if (previewContainer && sectionElement) {
          // Get the preview element (the inner content)
          const previewElement = document.getElementById('dpr-preview');
          
          if (previewElement && previewContainer) {
            // Calculate the section's position relative to the preview element
            const previewRect = previewElement.getBoundingClientRect();
            const sectionRect = sectionElement.getBoundingClientRect();
            
            // Get the current scroll position of the container
            const currentScrollTop = previewContainer.scrollTop;
            
            // Calculate the section's position relative to the preview element's top
            // Since both are children of the scaled container, we can use their relative positions
            const sectionOffsetFromPreview = sectionRect.top - previewRect.top;
            
            // Calculate the target scroll position
            // The section should be positioned near the top of the visible area (with some offset)
            const offset = 100; // Offset from top in pixels (before scaling)
            const targetScrollTop = currentScrollTop + sectionOffsetFromPreview - (offset / previewZoom);
            
            previewContainer.scrollTo({
              top: Math.max(0, targetScrollTop),
              behavior: 'smooth'
            });
          } else {
            // Fallback: use scrollIntoView with options
            sectionElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
              inline: 'nearest'
            });
          }
        }
      }, 500); // Delay to ensure DOM and content are ready

      return () => clearTimeout(timer);
    }
  }, [currentStep, previewMode, previewZoom]);

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

      // Prepare complete data - ensure all step data is included
      const completeData = {
        ...data,
        // Remove metadata fields that shouldn't be sent
        currentStep: undefined,
        isDraft: undefined,
        lastSaved: undefined,
        generatedDPR: undefined,
      };

      // Log what we're sending
      const stepKeys = Object.keys(completeData).filter(key => key.startsWith('step'));
      console.log('📤 Sending cluster data to backend:', {
        totalSteps: stepKeys.length,
        steps: stepKeys,
        step1Data: completeData.step1,
        step11Data: completeData.step11,
        step12Data: completeData.step12,
      });

      toast.loading('Generating DPR with AI enhancement...', { id: 'generating-dpr' });
      
      // Call backend API to generate DPR with OpenAI enhancement
      const response = await api.generateClusterDPR(completeData, 'bilingual');
      
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

  // Get AI suggestions for current step
  const getAISuggestions = async (step: number, forceRefresh = false) => {
    // Don't fetch if already loaded (unless user explicitly requests refresh)
    if (aiSuggestions[step] && !forceRefresh) {
      return;
    }

    // Clear cached suggestion if refreshing
    if (forceRefresh) {
      setAiSuggestions(prev => {
        const newState = { ...prev };
        delete newState[step];
        return newState;
      });
    }

    try {
      setLoadingSuggestions(prev => ({ ...prev, [step]: true }));

      const stepData = getStepData(step) || {};
      const clusterName = data.step1?.clusterName || '';
      const district = data.step1?.district || '';
      const sector = data.step2?.sector || data.step1?.natureOfBusiness || '';

      // Build step-specific prompt
      let prompt = '';
      
      switch (step) {
        case 1:
          prompt = `Generate sample content for Cluster DPR Step 1: Executive Summary – Basic Cluster Details.

Context: ${clusterName ? `Cluster Name: ${clusterName}` : 'New cluster'}, ${district ? `District: ${district}` : ''}

Return ONLY JSON (no markdown, no explanations):
{
  "clusterName": "Example cluster name",
  "district": "Example district",
  "location": "Example location",
  "geographicalSpread": "200-300 words describing geographical spread",
  "natureOfBusiness": "Business nature description",
  "totalUnits": "Number of units",
  "totalEmployment": "Employment numbers"
}

Make it realistic for MSME cluster development. JSON only.`;
          break;
        case 2:
          prompt = `Generate sample content for Cluster DPR Step 2: Introduction & Sector Overview.

Context: ${clusterName ? `Cluster: ${clusterName}` : 'New cluster'}, ${sector ? `Sector: ${sector}` : ''}

Return ONLY JSON:
{
  "sector": "Sector name",
  "sectorOverview": "300-400 words about sector overview, industry trends, market potential",
  "clusterHistory": "200-300 words about cluster history and development",
  "keyStakeholders": "List of key stakeholders"
}

Make it realistic. JSON only.`;
          break;
        case 3:
          prompt = `Generate sample content for Cluster DPR Step 3: District & Regional Profile.

Context: ${district ? `District: ${district}` : 'New district'}

Return ONLY JSON:
{
  "districtProfile": "300-400 words about district demographics, economy, infrastructure",
  "regionalAdvantages": "200-300 words about regional advantages for cluster development",
  "infrastructure": "200-300 words about existing infrastructure"
}

Make it realistic. JSON only.`;
          break;
        case 4:
          prompt = `Generate sample content for Cluster DPR Step 4: Cluster Profile.

Context: ${clusterName ? `Cluster: ${clusterName}` : 'New cluster'}

Return ONLY JSON:
{
  "clusterDescription": "300-400 words describing the cluster",
  "clusterSize": "Size details",
  "memberUnits": "Information about member units",
  "productionCapacity": "Production capacity details"
}

Make it realistic. JSON only.`;
          break;
        case 5:
          prompt = `Generate sample content for Cluster DPR Step 5: Value Chain Details.

Return ONLY JSON:
{
  "valueChainDescription": "300-400 words describing the value chain",
  "keyActivities": "List of key activities in the value chain",
  "valueAddition": "200-300 words about value addition opportunities"
}

Make it realistic. JSON only.`;
          break;
        case 6:
          prompt = `Generate sample content for Cluster DPR Step 6: Market Assessment.

Return ONLY JSON:
{
  "marketSize": "Market size information",
  "targetMarket": "300-400 words about target market segments",
  "competitorAnalysis": "300-400 words about competitors",
  "marketTrends": "200-300 words about market trends"
}

Make it realistic. JSON only.`;
          break;
        case 7:
          prompt = `Generate sample content for Cluster DPR Step 7: Gap Analysis.

Return ONLY JSON:
{
  "identifiedGaps": "300-400 words about identified gaps",
  "gapPrioritization": "200-300 words about gap prioritization",
  "impactAnalysis": "200-300 words about impact of gaps"
}

Make it realistic. JSON only.`;
          break;
        case 8:
          prompt = `Generate sample content for Cluster DPR Step 8: SWOT Analysis.

Return ONLY JSON:
{
  "strengths": "List of strengths (200-300 words)",
  "weaknesses": "List of weaknesses (200-300 words)",
  "opportunities": "List of opportunities (200-300 words)",
  "threats": "List of threats (200-300 words)"
}

Make it realistic. JSON only.`;
          break;
        case 9:
          prompt = `Generate sample content for Cluster DPR Step 9: Proposed Interventions.

Return ONLY JSON:
{
  "interventions": "300-400 words about proposed interventions",
  "interventionDetails": "Detailed list of interventions",
  "expectedOutcomes": "200-300 words about expected outcomes"
}

Make it realistic. JSON only.`;
          break;
        case 10:
          prompt = `Generate sample content for Cluster DPR Step 10: Common Facility Centre (CFC) Details.

Return ONLY JSON:
{
  "cfcName": "CFC name",
  "cfcLocation": "CFC location",
  "facilities": "List of facilities",
  "cfcDescription": "300-400 words describing the CFC",
  "capacity": "Capacity details"
}

Make it realistic. JSON only.`;
          break;
        case 11:
          prompt = `Generate sample content for Cluster DPR Step 11: SPV Details.

Return ONLY JSON:
{
  "spvName": "SPV name",
  "spvRegistration": "Registration details",
  "spvStructure": "200-300 words about SPV structure",
  "membership": "Membership details",
  "governance": "200-300 words about governance"
}

Make it realistic. JSON only.`;
          break;
        case 12:
          prompt = `Generate sample content for Cluster DPR Step 12: Project Cost Details.

Return ONLY JSON with numbers (not strings):
{
  "landCost": 500000,
  "buildingCost": 2000000,
  "machineryCost": 3000000,
  "otherCosts": 500000,
  "totalCost": 6000000
}

Make it realistic for MSME cluster. JSON only.`;
          break;
        case 13:
          prompt = `Generate sample content for Cluster DPR Step 13: Means of Finance.

Return ONLY JSON with numbers:
{
  "governmentGrant": 3000000,
  "spvContribution": 2000000,
  "bankLoan": 1000000,
  "totalFinance": 6000000
}

Make it realistic. JSON only.`;
          break;
        case 14:
          prompt = `Generate sample content for Cluster DPR Step 14: Operating Cost & Revenue.

Return ONLY JSON with numbers:
{
  "monthlyOperatingCost": 200000,
  "annualOperatingCost": 2400000,
  "monthlyRevenue": 500000,
  "annualRevenue": 6000000,
  "profitMargin": "20%"
}

Make it realistic. JSON only.`;
          break;
        case 15:
          prompt = `Generate sample content for Cluster DPR Step 15: Financial Viability.

Return ONLY JSON:
{
  "npv": "NPV calculation details",
  "irr": "IRR percentage",
  "paybackPeriod": "Payback period",
  "financialSummary": "300-400 words about financial viability"
}

Make it realistic. JSON only.`;
          break;
        case 16:
          prompt = `Generate sample content for Cluster DPR Step 16: Project Implementation Schedule.

Return ONLY JSON:
{
  "implementationPhases": "List of implementation phases",
  "timeline": "Detailed timeline",
  "milestones": "Key milestones",
  "scheduleDescription": "300-400 words about implementation schedule"
}

Make it realistic. JSON only.`;
          break;
        case 17:
          prompt = `Generate sample content for Cluster DPR Step 17: Expected Impact.

Return ONLY JSON:
{
  "economicImpact": "300-400 words about economic impact",
  "socialImpact": "200-300 words about social impact",
  "employmentGeneration": "Employment generation details",
  "environmentalImpact": "200-300 words about environmental impact"
}

Make it realistic. JSON only.`;
          break;
        case 18:
          prompt = `Generate guidance for Cluster DPR Step 18: Annexures & Document Uploads.

Return ONLY JSON:
{
  "guidance": "List the required documents: SPV Registration Certificate, Land Documents, Building Estimates, Machinery Quotations, and any other relevant documents. Ensure all documents are clear, recent, and properly formatted."
}

JSON only.`;
          break;
        default:
          prompt = `Generate sample content for Cluster DPR Step ${step}. Return ONLY JSON format.`;
      }

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 30000)
      );

      let response;
      try {
        response = await Promise.race([
          api.chat(
            prompt,
            [],
            {
              clusterData: data,
              currentStep: step,
              stepData: stepData,
              isSuggestionRequest: true,
            },
            false // Disable RAG for faster response
          ),
          timeoutPromise
        ]) as any;
      } catch (error: any) {
        if (error.message?.includes('timeout')) {
          toast.error('AI suggestions request timed out. Please try again.');
          throw error;
        }
        throw error;
      }

      const suggestionText = response.response || response.data?.response || '';

      // Try to parse JSON if it's structured data, otherwise use as-is
      let parsedSuggestion: any = suggestionText;
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = suggestionText.match(/```(?:json)?\s*(\{[\s\S]*\}|\[[\s\S]*\])\s*```/);
        if (jsonMatch) {
          parsedSuggestion = JSON.parse(jsonMatch[1]);
        } else {
          // Try parsing the entire response as JSON
          parsedSuggestion = JSON.parse(suggestionText);
        }
      } catch (e) {
        // If parsing fails, use the text as-is
        parsedSuggestion = { guidance: suggestionText };
      }

      setAiSuggestions(prev => ({ ...prev, [step]: parsedSuggestion }));
      toast.success('AI suggestions generated!');
    } catch (error: any) {
      console.error('Error getting AI suggestions:', error);
      toast.error(error.message || 'Failed to get AI suggestions. Please try again.');
    } finally {
      setLoadingSuggestions(prev => ({ ...prev, [step]: false }));
    }
  };

  // Clear AI suggestions for a step
  const clearAISuggestions = (step: number) => {
    setAiSuggestions(prev => {
      const newState = { ...prev };
      delete newState[step];
      return newState;
    });
  };

  // Apply AI suggestions to current step
  const applyAISuggestions = (step: number) => {
    const suggestions = aiSuggestions[step];
    if (suggestions && typeof suggestions === 'object') {
      const currentStepData = getStepData(step) || {};
      setStepData(step, { ...currentStepData, ...suggestions });
      clearAISuggestions(step);
      toast.success('AI suggestions applied!');
    }
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
                
                {currentStep === totalSteps && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleGenerateDPR}
                    isLoading={isGenerating}
                    className="gap-2"
                  >
                    Generate DPR
                  </Button>
                )}
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
                    {/* AI Suggestions Section */}
                    <div className="mb-6">
                      {!aiSuggestions[currentStep] && (
                        <div className="flex items-center justify-between p-4 bg-primary/5 border-l-4 border-l-primary rounded-r-lg">
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">
                              Need help filling this step? Get AI-powered suggestions based on your cluster details.
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => getAISuggestions(currentStep)}
                            disabled={loadingSuggestions[currentStep]}
                            className="ml-4 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
                          >
                            {loadingSuggestions[currentStep] ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Get AI Suggestions
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {aiSuggestions[currentStep] && (
                        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5 border-2 border-primary/30 shadow-lg mb-4">
                          <CardContent className="pt-5 pb-5">
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div className="flex items-start gap-4 flex-1">
                                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border-2 border-primary/30">
                                  <Sparkles className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-base font-bold text-primary mb-2">AI-Powered Suggestions</p>
                                  <div className="text-sm text-foreground space-y-2">
                                    {typeof aiSuggestions[currentStep] === 'object' ? (
                                      Object.entries(aiSuggestions[currentStep]).map(([key, value]: [string, any]) => (
                                        <div key={key} className="mb-2">
                                          <span className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                          <span className="ml-2">{typeof value === 'string' ? value : JSON.stringify(value)}</span>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="whitespace-pre-line">{aiSuggestions[currentStep]}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => getAISuggestions(currentStep, true)}
                                  disabled={loadingSuggestions[currentStep]}
                                  title="Refresh suggestions"
                                  className="flex-shrink-0 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
                                >
                                  {loadingSuggestions[currentStep] ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    'Refresh'
                                  )}
                                </Button>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => applyAISuggestions(currentStep)}
                                  className="flex-shrink-0 gap-2"
                                >
                                  <Check className="h-4 w-4" />
                                  Apply
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => clearAISuggestions(currentStep)}
                                  className="flex-shrink-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>

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
                       <div className="flex items-center gap-2">
                         {/* Zoom Controls */}
                         <div className="flex items-center gap-1 border border-border rounded-lg bg-background shadow-sm">
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => setPreviewZoom(Math.max(0.3, previewZoom - 0.1))}
                             className="h-8 w-8 p-0 hover:bg-muted"
                             title="Zoom Out"
                           >
                             <ZoomOut className="h-4 w-4" />
                           </Button>
                           <div className="px-3 py-1.5 border-x border-border">
                             <span className="text-sm font-medium text-foreground min-w-[3.5rem] inline-block text-center">
                               {Math.round(previewZoom * 100)}%
                             </span>
                           </div>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => setPreviewZoom(Math.min(2, previewZoom + 0.1))}
                             className="h-8 w-8 p-0 hover:bg-muted"
                             title="Zoom In"
                           >
                             <ZoomIn className="h-4 w-4" />
                           </Button>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => setPreviewZoom(0.6)}
                             className="h-8 w-8 p-0 hover:bg-muted border-l border-border rounded-l-none"
                             title="Reset to 60%"
                           >
                             <RotateCcw className="h-4 w-4" />
                           </Button>
                         </div>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => {
                             const previewElement = document.getElementById('dpr-preview-container');
                             if (previewElement) {
                               previewElement.requestFullscreen?.();
                             }
                           }}
                           className="gap-2"
                         >
                           <Maximize2 className="h-4 w-4" />
                           Fullscreen
                         </Button>
                       </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden p-0 bg-gray-100 relative">
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
                      <div 
                        id="dpr-preview" 
                        className="bg-white mx-auto shadow-lg" 
                        style={{ 
                          minHeight: '100%', 
                          width: '21cm',
                          padding: '2rem',
                          cursor: 'pointer'
                        }}
                      >
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
                            stepData: data,
                          }}
                          viewLanguage="english"
                          onSectionClick={(stepNumber: number) => {
                            setCurrentStep(stepNumber);
                            document.getElementById('cluster-dpr-form')?.scrollIntoView({ behavior: 'smooth' });
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
