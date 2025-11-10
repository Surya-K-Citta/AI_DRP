import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
  Sparkles,
  TrendingUp,
  Building2,
  DollarSign,
  FileText,
  Award,
  Brain,
  Save,
  BarChart3,
} from 'lucide-react';

interface StepData {
  businessOverview?: any;
  marketAnalysis?: any;
  costStructure?: any;
  financialProjections?: any;
  eligibleSchemes?: any;
}

const STEPS = [
  { id: 'business-overview', title: 'Business Overview', icon: Building2 },
  { id: 'market-analysis', title: 'Market Analysis', icon: TrendingUp },
  { id: 'cost-structure', title: 'Cost Structure', icon: DollarSign },
  { id: 'financial-projections', title: 'Financial Projections', icon: FileText },
  { id: 'eligible-schemes', title: 'Eligible Schemes', icon: Award },
  { id: 'ai-review', title: 'AI Review', icon: Brain },
];

export const AIGuidedDPRBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stepData, setStepData] = useState<StepData>({});
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, any>>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState<Record<string, boolean>>({});
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    if (projectId) {
      loadProject();
    } else {
      // Load saved progress from localStorage if no projectId
      const saved = localStorage.getItem('dpr-builder-progress');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setStepData(parsed.stepData || {});
          setCurrentStep(parsed.currentStep || 0);
        } catch (e) {
          console.error('Failed to load saved progress:', e);
        }
      }
    }
  }, [projectId]);

  // Auto-save progress to localStorage
  useEffect(() => {
    if (Object.keys(stepData).length > 0) {
      const saveData = {
        stepData,
        currentStep,
        timestamp: Date.now(),
      };
      localStorage.setItem('dpr-builder-progress', JSON.stringify(saveData));
    }
  }, [stepData, currentStep]);

  const loadProject = async () => {
    try {
      const response = await api.getProject(projectId!);
      setProject(response.data || response);
      
      // Auto-fill business overview from project data
      if (response.data || response) {
        setStepData({
          businessOverview: {
            projectName: (response.data || response).projectName,
            industrySector: (response.data || response).industrySector,
            location: (response.data || response).location,
            businessDescription: (response.data || response).inputs?.businessDescription || '',
          },
        });
      }
    } catch (error) {
      toast.error('Failed to load project');
    }
  };

  const getAISuggestions = async (stepId: string, _currentData: any, showLoading = true, forceRefresh = false) => {
    // Don't fetch if already loaded (unless user explicitly requests refresh)
    if (aiSuggestions[stepId] && showLoading && !forceRefresh) {
      return;
    }
    
    // Clear cached suggestion if refreshing
    if (forceRefresh) {
      setAiSuggestions(prev => {
        const updated = { ...prev };
        delete updated[stepId];
        return updated;
      });
    }

    try {
      if (showLoading) {
        setLoadingSuggestions(prev => ({ ...prev, [stepId]: true }));
      }
      
      // Build contextual prompt based on step and entered data
      const businessData = stepData.businessOverview || {};
      const marketData = stepData.marketAnalysis || {};
      const costData = stepData.costStructure || {};
      
      let prompt = '';
      
      switch (stepId) {
        case 'market-analysis':
          prompt = `As an MSME business consultant, provide specific, actionable market analysis suggestions for a ${businessData.industrySector || 'business'} project named "${businessData.projectName || 'the project'}".
          
Current data entered:
- Target Market: ${marketData.targetMarket || 'Not specified'}
- Competitor Analysis: ${marketData.competitorAnalysis || 'Not specified'}

Provide 3-5 specific suggestions including:
1. Market size and growth potential for ${businessData.industrySector || 'this sector'}
2. Key competitors to analyze and their strengths/weaknesses
3. Target customer segments and their needs
4. Market trends and opportunities
5. Competitive advantages to highlight

Keep each suggestion concise (1-2 sentences) and actionable.`;
          break;
          
        case 'cost-structure':
          prompt = `As a financial consultant, provide CAPEX and OPEX guidance for a ${businessData.industrySector || 'business'} project.
          
Current estimates:
- CAPEX (Land & Building): ₹${costData?.capex?.landBuilding || 'Not specified'}
- CAPEX (Machinery): ₹${costData?.capex?.machinery || 'Not specified'}
- OPEX (Raw Materials/Month): ₹${costData?.opex?.rawMaterials || 'Not specified'}
- OPEX (Salaries/Month): ₹${costData?.opex?.salaries || 'Not specified'}

Provide specific suggestions for:
1. Realistic cost estimates for ${businessData.industrySector || 'this sector'}
2. Industry benchmarks for similar projects
3. Cost optimization opportunities
4. Items that might be missing from the cost structure
5. Tips for bank-ready cost breakdown

Be specific with numbers and percentages where relevant.`;
          break;
          
        case 'financial-projections':
          prompt = `As a financial analyst, provide guidance for 3-5 year financial projections for a ${businessData.industrySector || 'business'} project.
          
Project details:
- Industry: ${businessData.industrySector || 'Not specified'}
- Project Name: ${businessData.projectName || 'Not specified'}

Provide specific suggestions for:
1. Realistic revenue growth rates for ${businessData.industrySector || 'this sector'}
2. Key cost drivers and their typical percentages
3. Break-even analysis timeline
4. Cash flow considerations
5. Industry-specific financial metrics to include

Include specific percentage ranges and timeframes.`;
          break;
          
        default:
          prompt = `Provide brief, actionable suggestions for ${stepId.replace('-', ' ')} section for a ${businessData.industrySector || 'business'} project. Keep response under 150 words with specific, actionable items.`;
      }
      
      const response = await api.chat(
        prompt,
        [],
        { 
          project: project || {},
          businessOverview: businessData,
          marketAnalysis: marketData,
          costStructure: costData,
          currentStep: stepId,
        },
        false // Disable RAG for faster response
      );
      
      const suggestion = response.response || response.data?.response || '';
      
      setAiSuggestions(prev => ({
        ...prev,
        [stepId]: suggestion,
      }));
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      // Don't block user if AI fails
      if (showLoading) {
        toast.error('Failed to load AI suggestions. You can continue without them.');
      }
    } finally {
      if (showLoading) {
        setLoadingSuggestions(prev => ({ ...prev, [stepId]: false }));
      }
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      // Navigate immediately without waiting for AI
      setCurrentStep(currentStep + 1);
      
      // Load AI suggestions in background (non-blocking)
      const nextStepId = STEPS[currentStep + 1].id;
      if (!aiSuggestions[nextStepId]) {
        getAISuggestions(nextStepId, stepData, false).catch(() => {
          // Silently fail - don't block user
        });
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Save to localStorage (already done automatically, but show confirmation)
      const saveData = {
        stepData,
        currentStep,
        timestamp: Date.now(),
      };
      localStorage.setItem('dpr-builder-progress', JSON.stringify(saveData));
      toast.success('Progress saved locally');
    } catch (error) {
      toast.error('Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateDPR = async () => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!stepData.businessOverview?.projectName || !stepData.businessOverview?.industrySector) {
        toast.error('Please complete Business Overview section (Project Name and Industry Sector are required)');
        setCurrentStep(0); // Go back to first step
        return;
      }

      let finalProjectId = projectId;

      // Create project if it doesn't exist
      if (!finalProjectId) {
        try {
          const businessData = stepData.businessOverview;
          const costData = stepData.costStructure;
          
          // Calculate total cost from CAPEX and OPEX
          const totalCapex = parseFloat(costData?.capex?.landBuilding || 0) + 
                           parseFloat(costData?.capex?.machinery || 0);
          const monthlyOpex = parseFloat(costData?.opex?.rawMaterials || 0) + 
                             parseFloat(costData?.opex?.salaries || 0);
          const annualOpex = monthlyOpex * 12;
          const totalCost = totalCapex + (annualOpex * 0.3); // Rough estimate
          
          // Estimate own contribution (20% of total cost)
          const ownContribution = totalCost * 0.2;
          const loanAmount = totalCost - ownContribution;

          const projectData = {
            projectType: 'individual',
            projectName: businessData.projectName,
            industrySector: businessData.industrySector,
            subSector: businessData.industrySector,
            totalCost: totalCost || 1000000, // Default if not calculated
            ownContribution: ownContribution || 200000,
            loanAmount: loanAmount || 800000,
            location: businessData.location || 'Not specified',
            inputs: {
              businessDescription: businessData.businessDescription || '',
              targetMarket: stepData.marketAnalysis?.targetMarket || '',
            },
            status: 'draft',
          };

          const projectResponse = await api.createProject(projectData);
          finalProjectId = projectResponse.data?._id || projectResponse.data?.id || projectResponse._id;
          
          if (!finalProjectId) {
            throw new Error('Failed to create project');
          }
          
          toast.success('Project created successfully!');
        } catch (error: any) {
          console.error('Error creating project:', error);
          toast.error(error.response?.data?.message || 'Failed to create project. Please try again.');
          return;
        }
      }

      // Generate DPR
      const response = await api.generateDPR(finalProjectId, 'bilingual');
      toast.success('DPR generated successfully!');
      
      // Clear saved progress after successful generation
      localStorage.removeItem('dpr-builder-progress');
      navigate(`/dpr/view/${response.data.dprId}`);
    } catch (error: any) {
      console.error('Error generating DPR:', error);
      toast.error(error.response?.data?.message || 'Failed to generate DPR. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    const step = STEPS[currentStep];
    
    switch (step.id) {
      case 'business-overview':
        return <BusinessOverviewStep data={stepData.businessOverview} onChange={(data: any) => setStepData({...stepData, businessOverview: data})} project={project} />;
      case 'market-analysis':
        return (
          <MarketAnalysisStep 
            data={stepData.marketAnalysis} 
            onChange={(data: any) => setStepData({...stepData, marketAnalysis: data})} 
            suggestions={aiSuggestions['market-analysis']}
            loading={loadingSuggestions['market-analysis']}
            onGetSuggestions={() => getAISuggestions('market-analysis', stepData, true, true)}
          />
        );
      case 'cost-structure':
        return (
          <CostStructureStep 
            data={stepData.costStructure} 
            onChange={(data: any) => setStepData({...stepData, costStructure: data})} 
            project={project}
            suggestions={aiSuggestions['cost-structure']}
            loading={loadingSuggestions['cost-structure']}
            onGetSuggestions={() => getAISuggestions('cost-structure', stepData, true, true)}
          />
        );
      case 'financial-projections':
        return (
          <FinancialProjectionsStep 
            data={stepData.financialProjections} 
            onChange={(data: any) => setStepData({...stepData, financialProjections: data})} 
            project={project}
            suggestions={aiSuggestions['financial-projections']}
            loading={loadingSuggestions['financial-projections']}
            onGetSuggestions={() => getAISuggestions('financial-projections', stepData, true, true)}
          />
        );
      case 'eligible-schemes':
        return <EligibleSchemesStep data={stepData.eligibleSchemes} onChange={(data: any) => setStepData({...stepData, eligibleSchemes: data})} project={project} />;
      case 'ai-review':
        return <AIReviewStep stepData={stepData} project={project} onGenerate={handleGenerateDPR} />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 pb-8">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-primary p-8 mb-6 shadow-2xl border-2 border-primary/20">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-3">
              <div className="h-14 w-14 rounded-xl bg-white/25 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white drop-shadow-lg">AI-Guided DPR Builder</h1>
                <p className="text-white/95 text-lg font-medium mt-1">Step {currentStep + 1} of {STEPS.length} • {STEPS[currentStep].title}</p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-white/15 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-56 h-56 bg-secondary/20 rounded-full blur-3xl"></div>
        </div>

        <Card className="border-2 border-primary/20 shadow-2xl bg-white">
          <CardContent className="pt-8 pb-8">
            {/* Progress Bar */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xl font-bold text-foreground block mb-1">{STEPS[currentStep].title}</span>
                  <span className="text-sm font-medium text-muted-foreground">
                    Complete all fields to proceed to the next step
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-primary block">
                    {Math.round(((currentStep + 1) / STEPS.length) * 100)}%
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">Complete</span>
                </div>
              </div>
              <div className="w-full bg-muted/50 rounded-full h-4 overflow-hidden border border-primary/10">
                <div
                  className="bg-primary h-4 rounded-full transition-all duration-500 shadow-lg relative overflow-hidden"
                  style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                </div>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4 scrollbar-hide">
              {STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return (
                  <div key={step.id} className="flex flex-col items-center min-w-[120px] relative">
                    {/* Connector Line */}
                    {index < STEPS.length - 1 && (
                      <div className={`absolute top-5 left-[60px] w-full h-0.5 ${
                        isCompleted ? 'bg-success' : 'bg-muted'
                      }`} style={{ width: 'calc(100% - 60px)' }} />
                    )}
                    <div
                      className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-primary text-white shadow-lg scale-110'
                          : isCompleted
                          ? 'bg-success text-white shadow-md'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <StepIcon className="h-6 w-6" />
                      )}
                    </div>
                    <span className={`text-xs mt-3 text-center font-medium ${
                      isActive ? 'font-semibold text-primary' : 'text-muted-foreground'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Step Content */}
            <div className="min-h-[400px]">
              {renderStepContent()}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t-2 border-primary/10">
              <div>
                {currentStep > 0 && (
                  <Button variant="outline" onClick={handlePrevious} className="border-2">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleSave} 
                  disabled={saving}
                  className="border-2 hover:bg-secondary/5 hover:border-secondary"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Progress'}
                </Button>
                    {currentStep < STEPS.length - 1 ? (
                      <Button 
                        onClick={handleNext}
                        className="bg-primary hover:bg-primary/90 text-white shadow-lg"
                      >
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleGenerateDPR} 
                        disabled={loading}
                        className="bg-success hover:bg-success/90 text-white shadow-lg"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate DPR
                            <CheckCircle className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

// Step Components
const BusinessOverviewStep: React.FC<{ data: any; onChange: (data: any) => void; project?: any }> = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <h3 className="text-xl font-bold text-foreground mb-2">Business Overview</h3>
        <p className="text-sm text-muted-foreground">
          Provide basic information about your business and project. This information will be used throughout your DPR.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">Project Name *</label>
          <Input
            value={data?.projectName || ''}
            onChange={(e) => onChange({...data, projectName: e.target.value})}
            placeholder="Enter project name"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">Industry Sector *</label>
          <Input
            value={data?.industrySector || ''}
            onChange={(e) => onChange({...data, industrySector: e.target.value})}
            placeholder="e.g., Manufacturing, Services"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 text-foreground">Business Description *</label>
        <textarea
          className="w-full p-4 border-2 rounded-lg focus:border-primary focus:outline-none resize-none"
          rows={6}
          value={data?.businessDescription || ''}
          onChange={(e) => onChange({...data, businessDescription: e.target.value})}
          placeholder="Describe your business, products/services, objectives, and unique value proposition..."
        />
      </div>
    </div>
  );
};

const MarketAnalysisStep: React.FC<any> = ({ data, onChange, suggestions, loading, onGetSuggestions }) => {
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-2">Market Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Analyze your target market, competition, and opportunities. Use AI suggestions to get industry insights.
            </p>
          </div>
          {!suggestions && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGetSuggestions}
              disabled={loading}
              className="ml-4 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get AI Suggestions
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {suggestions && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5 border-2 border-primary/30 shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border-2 border-primary/30">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-primary mb-2">AI-Powered Suggestion</p>
                  <p className="text-sm text-foreground whitespace-pre-line leading-relaxed font-medium">{suggestions}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onGetSuggestions}
                disabled={loading}
                title="Get updated suggestions based on your current data"
                className="flex-shrink-0 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Refresh'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <label className="block text-sm font-semibold mb-2 text-foreground">Target Market *</label>
        <textarea
          className="w-full p-4 border-2 rounded-lg focus:border-primary focus:outline-none resize-none"
          rows={5}
          value={data?.targetMarket || ''}
          onChange={(e) => onChange({...data, targetMarket: e.target.value})}
          placeholder="Describe your target customers, market segments, demographics, and market size..."
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 text-foreground">Competitor Analysis *</label>
        <textarea
          className="w-full p-4 border-2 rounded-lg focus:border-primary focus:outline-none resize-none"
          rows={5}
          value={data?.competitorAnalysis || ''}
          onChange={(e) => onChange({...data, competitorAnalysis: e.target.value})}
          placeholder="Analyze your competitors, their strengths and weaknesses, and your competitive advantages..."
        />
      </div>
    </div>
  );
};

const CostStructureStep: React.FC<{ data: any; onChange: (data: any) => void; project?: any; suggestions?: string; loading?: boolean; onGetSuggestions: () => void }> = ({ data, onChange, suggestions, loading, onGetSuggestions }) => {
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-2">Cost Structure</h3>
            <p className="text-sm text-muted-foreground">
              Define your CAPEX (Capital Expenditure) and OPEX (Operating Expenditure) requirements
            </p>
          </div>
          {!suggestions && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGetSuggestions}
              disabled={loading}
              className="ml-4 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get AI Suggestions
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {suggestions && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5 border-2 border-primary/30 shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border-2 border-primary/30">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-primary mb-2">AI-Powered Suggestion</p>
                  <p className="text-sm text-foreground whitespace-pre-line leading-relaxed font-medium">{suggestions}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onGetSuggestions}
                disabled={loading}
                title="Get updated suggestions based on your current data"
                className="flex-shrink-0 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Refresh'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="bg-primary/5 border-b-2 border-primary/10">
            <CardTitle className="text-lg font-bold text-foreground">CAPEX (Capital Expenditure)</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">One-time investments</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Land & Building (₹)</label>
              <Input
                type="number"
                value={data?.capex?.landBuilding || ''}
                onChange={(e) => onChange({
                  ...data,
                  capex: {...data?.capex, landBuilding: e.target.value}
                })}
                placeholder="Enter amount"
                className="h-12 border-2 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Machinery & Equipment (₹)</label>
              <Input
                type="number"
                value={data?.capex?.machinery || ''}
                onChange={(e) => onChange({
                  ...data,
                  capex: {...data?.capex, machinery: e.target.value}
                })}
                placeholder="Enter amount"
                className="h-12 border-2 focus:border-primary"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-secondary/20 shadow-lg">
          <CardHeader className="bg-secondary/5 border-b-2 border-secondary/10">
            <CardTitle className="text-lg font-bold text-foreground">OPEX (Operating Expenditure)</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Recurring monthly expenses</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Raw Materials (₹/Month)</label>
              <Input
                type="number"
                value={data?.opex?.rawMaterials || ''}
                onChange={(e) => onChange({
                  ...data,
                  opex: {...data?.opex, rawMaterials: e.target.value}
                })}
                placeholder="Enter monthly amount"
                className="h-12 border-2 focus:border-secondary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Salaries (₹/Month)</label>
              <Input
                type="number"
                value={data?.opex?.salaries || ''}
                onChange={(e) => onChange({
                  ...data,
                  opex: {...data?.opex, salaries: e.target.value}
                })}
                placeholder="Enter monthly amount"
                className="h-12 border-2 focus:border-secondary"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const FinancialProjectionsStep: React.FC<{ data: any; onChange: (data: any) => void; project?: any; suggestions?: string; loading?: boolean; onGetSuggestions: () => void }> = ({ data, onChange, suggestions, loading, onGetSuggestions }) => {
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-2">Financial Projections</h3>
            <p className="text-sm text-muted-foreground">
              Project your revenue, costs, and cash flow for the next 3-5 years. Use AI suggestions for realistic projections.
            </p>
          </div>
          {!suggestions && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGetSuggestions}
              disabled={loading}
              className="ml-4 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get AI Suggestions
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {suggestions && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5 border-2 border-primary/30 shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border-2 border-primary/30">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-primary mb-2">AI-Powered Suggestion</p>
                  <p className="text-sm text-foreground whitespace-pre-line leading-relaxed font-medium">{suggestions}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onGetSuggestions}
                disabled={loading}
                title="Get updated suggestions based on your current data"
                className="flex-shrink-0 border-2 border-primary bg-white hover:bg-primary hover:text-white text-primary"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Refresh'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto border-2 border-primary/20 rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-primary/10 to-secondary/10">
              <th className="border-2 border-primary/20 p-4 text-left font-bold text-foreground">Year</th>
              <th className="border-2 border-primary/20 p-4 text-right font-bold text-foreground">Revenue (₹)</th>
              <th className="border-2 border-primary/20 p-4 text-right font-bold text-foreground">Costs (₹)</th>
              <th className="border-2 border-primary/20 p-4 text-right font-bold text-foreground">Profit (₹)</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((year) => (
              <tr key={year} className="hover:bg-primary/5 transition-colors">
                <td className="border-2 border-primary/20 p-4 font-semibold text-foreground">Year {year}</td>
                <td className="border-2 border-primary/20 p-4">
                  <Input
                    type="number"
                    className="text-right h-10 border-2 focus:border-primary"
                    value={data?.[`year${year}`]?.revenue || ''}
                    onChange={(e) => onChange({
                      ...data,
                      [`year${year}`]: {...data?.[`year${year}`], revenue: e.target.value}
                    })}
                    placeholder="0"
                  />
                </td>
                <td className="border-2 border-primary/20 p-4">
                  <Input
                    type="number"
                    className="text-right h-10 border-2 focus:border-primary"
                    value={data?.[`year${year}`]?.costs || ''}
                    onChange={(e) => onChange({
                      ...data,
                      [`year${year}`]: {...data?.[`year${year}`], costs: e.target.value}
                    })}
                    placeholder="0"
                  />
                </td>
                <td className="border-2 border-primary/20 p-4 text-right font-bold">
                  {data?.[`year${year}`]?.revenue && data?.[`year${year}`]?.costs
                    ? `₹${(parseFloat(data[`year${year}`].revenue) - parseFloat(data[`year${year}`].costs)).toLocaleString('en-IN')}`
                    : '₹0'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const EligibleSchemesStep: React.FC<any> = ({ data, onChange, project }) => {
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSchemes();
  }, [project]);

  const loadSchemes = async () => {
    if (!project?._id) return;
    try {
      setLoading(true);
      const response = await api.recommendSchemes(project._id);
      setSchemes(response.data || []);
    } catch (error) {
      console.error('Error loading schemes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <h3 className="text-xl font-bold text-foreground mb-2">Eligible Schemes</h3>
        <p className="text-sm text-muted-foreground">
          Review and select applicable government schemes for your project. These will be included in your DPR.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Loading eligible schemes...</p>
        </div>
      ) : schemes.length === 0 ? (
        <Card className="border-2 border-primary/20">
          <CardContent className="py-12 text-center">
            <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground font-medium">
              No eligible schemes found. You can continue to generate your DPR.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {schemes.map((scheme: any) => (
            <Card 
              key={scheme._id} 
              className={`cursor-pointer transition-all border-2 ${
                data?.selectedSchemes?.includes(scheme.schemeCode)
                  ? 'border-success bg-success/5 shadow-lg'
                  : 'border-primary/20 hover:border-primary/40 hover:shadow-md'
              }`}
            >
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        data?.selectedSchemes?.includes(scheme.schemeCode)
                          ? 'bg-success/20'
                          : 'bg-primary/10'
                      }`}>
                        <Award className={`h-5 w-5 ${
                          data?.selectedSchemes?.includes(scheme.schemeCode)
                            ? 'text-success'
                            : 'text-primary'
                        }`} />
                      </div>
                      <h4 className="font-bold text-lg text-foreground">{scheme.schemeName}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground ml-[52px]">{scheme.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={data?.selectedSchemes?.includes(scheme.schemeCode) ? 'primary' : 'outline'}
                    className={data?.selectedSchemes?.includes(scheme.schemeCode) 
                      ? 'bg-success hover:bg-success/90 border-2 border-success text-white' 
                      : 'border-2 border-primary hover:bg-primary hover:text-white'
                    }
                    onClick={() => {
                      const selected = data?.selectedSchemes || [];
                      const newSelected = selected.includes(scheme.schemeCode)
                        ? selected.filter((s: string) => s !== scheme.schemeCode)
                        : [...selected, scheme.schemeCode];
                      onChange({...data, selectedSchemes: newSelected});
                    }}
                  >
                    {data?.selectedSchemes?.includes(scheme.schemeCode) ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Selected
                      </>
                    ) : (
                      'Select'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const AIReviewStep: React.FC<any> = () => {
  const [qualityScore, setQualityScore] = useState<number | null>(null);

  useEffect(() => {
    // Simulate quality check
    // In real implementation, this would call the quality analysis API
    const score = Math.floor(Math.random() * 30) + 70; // 70-100
    setQualityScore(score);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <h3 className="text-xl font-bold text-foreground mb-2">AI Review & Quality Check</h3>
        <p className="text-sm text-muted-foreground">
          Review your DPR completeness and quality before generation. Our AI analyzes all sections for accuracy.
        </p>
      </div>

      {qualityScore !== null && (
        <Card className={`border-2 shadow-lg ${
          qualityScore >= 80 
            ? 'bg-success/10 border-success/40' 
            : qualityScore >= 60 
            ? 'bg-warning/10 border-warning/40' 
            : 'bg-destructive/10 border-destructive/40'
        }`}>
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold mb-2 text-muted-foreground">DPR Quality Score</p>
                <p className={`text-4xl font-bold ${
                  qualityScore >= 80 
                    ? 'text-success' 
                    : qualityScore >= 60 
                    ? 'text-warning' 
                    : 'text-destructive'
                }`}>
                  {qualityScore}/100
                </p>
              </div>
              <div className="text-right">
                <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
                  qualityScore >= 80 
                    ? 'bg-success/20' 
                    : qualityScore >= 60 
                    ? 'bg-warning/20' 
                    : 'bg-destructive/20'
                }`}>
                  <BarChart3 className={`h-8 w-8 ${
                    qualityScore >= 80 
                      ? 'text-success' 
                      : qualityScore >= 60 
                      ? 'text-warning' 
                      : 'text-destructive'
                  }`} />
                </div>
                <p className={`text-sm font-bold mt-2 ${
                  qualityScore >= 80 
                    ? 'text-success' 
                    : qualityScore >= 60 
                    ? 'text-warning' 
                    : 'text-destructive'
                }`}>
                  {qualityScore >= 80 ? 'Excellent' : qualityScore >= 60 ? 'Good' : 'Needs Improvement'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-primary/5 border-b-2 border-primary/10">
          <CardTitle className="text-lg font-bold">Completeness Check</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {['Business Overview', 'Market Analysis', 'Cost Structure', 'Financial Projections'].map((section) => (
              <div key={section} className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20">
                <span className="text-sm font-semibold text-foreground">{section}</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="text-xs font-medium text-success">Complete</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="bg-gradient-to-br from-success/10 via-primary/5 to-secondary/5 border-2 border-success/30 rounded-xl p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-success/20 flex items-center justify-center flex-shrink-0 border-2 border-success/30">
            <CheckCircle className="h-7 w-7 text-success" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold text-success mb-2">Ready to Generate!</p>
            <p className="text-sm text-foreground font-medium">
              Your DPR is complete and ready for generation. Click "Generate DPR" below to create your professional Detailed Project Report in both English and Telugu.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

