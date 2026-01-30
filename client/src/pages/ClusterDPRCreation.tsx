// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Save, Download, Eye, ChevronRight, ChevronLeft, ZoomIn, ZoomOut, Maximize2, RotateCcw, Loader2 } from 'lucide-react';
import { useClusterDPRStore } from '@/store/clusterDPRStore';
import { ClusterDPRForm } from '@/components/cluster-dpr/ClusterDPRForm';
import { ClusterDPRDocumentView } from '@/components/cluster-dpr/ClusterDPRDocumentView';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/api';

export const ClusterDPRCreation: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { data, setCurrentStep, setGeneratedDPR, resetData, setDprIds, loadDataFromProject, setStepData } = useClusterDPRStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState<'split' | 'form' | 'preview'>('split');
  const [viewLanguage, setViewLanguage] = useState<'english' | 'telugu'>('english');
  const [previewZoom, setPreviewZoom] = useState(0.6); // Default zoom set to 60%
  const [previewScroll, setPreviewScroll] = useState(0);
  const [project, setProject] = useState<any>(null); // Store the actual project object

  const currentStep = data.currentStep || 1;
  const totalSteps = 18;
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Helper function to load a draft project
  const loadDraftProject = async (projectId: string, dprId?: string) => {
    try {
      const projectResponse = await api.getProject(projectId);
      const projectData = projectResponse.data || projectResponse;
      
      // Store the actual project object
      setProject(projectData);
      
      // If we also have a dprId, load DPR data
      let dprData = null;
      if (dprId) {
        try {
          const dprResponse = await api.getClusterDPR(dprId);
          dprData = dprResponse.data || dprResponse;
        } catch (dprError) {
          console.warn('Failed to load DPR, using project data only:', dprError);
        }
      } else {
        // Try to find associated DPR
        try {
          const dprsResponse = await api.getUserDPRs();
          const dprs = Array.isArray(dprsResponse) 
            ? dprsResponse 
            : dprsResponse?.data?.dprs || dprsResponse?.data || [];
          
          const associatedDPR = dprs.find((d: any) => 
            (d.projectId?._id || d.projectId?.id || d.projectId) === projectId &&
            (d.content?.english?.isClusterDPR || d.content?.telugu?.isClusterDPR)
          );
          
          if (associatedDPR) {
            try {
              const dprResponse = await api.getClusterDPR(associatedDPR._id || associatedDPR.id);
              dprData = dprResponse.data || dprResponse;
            } catch (dprError) {
              console.warn('Failed to load DPR, using project data only:', dprError);
            }
          }
        } catch (error) {
          console.warn('Failed to fetch DPRs:', error);
        }
      }
      
      // Debug: Log what we're receiving from the API
      console.log('📥 Project data received from API:', {
        projectId: projectData._id || projectData.id,
        hasStepData: !!projectData.stepData,
        stepDataKeys: projectData.stepData ? Object.keys(projectData.stepData) : [],
        stepDataType: typeof projectData.stepData,
        step1Data: projectData.stepData?.step1,
        step1EnterpriseCount: projectData.stepData?.step1?.enterpriseCount,
        step1AgeOfEnterprises: projectData.stepData?.step1?.ageOfEnterprises,
        step1EmploymentPerUnit: projectData.stepData?.step1?.employmentPerUnit,
        step1InvestmentPerUnit: projectData.stepData?.step1?.investmentPerUnit,
        step1TurnoverPerUnit: projectData.stepData?.step1?.turnoverPerUnit,
        step1MarketServed: projectData.stepData?.step1?.marketServed,
        hasDprData: !!dprData,
        dprId: dprData?._id || dprData?.id,
      });
      
      // Load data into store - always pass projectData, even if no DPR exists
      // This ensures we load from project.stepData when DPR is not generated
      loadDataFromProject(projectData, dprData || null);
      
      // Update IDs in store and URL
      if (projectData._id || projectData.id) {
        const pid = projectData._id || projectData.id;
        const did = dprData?._id || dprData?.id || dprId;
        if (did) {
          setDprIds(did, pid);
          // Update URL to include IDs for future loads
          const newUrl = `/cluster-dpr/create?projectId=${pid}&dprId=${did}`;
          window.history.replaceState({}, '', newUrl);
        } else if (pid) {
          setDprIds('', pid);
          // Update URL to include projectId
          const newUrl = `/cluster-dpr/create?projectId=${pid}`;
          window.history.replaceState({}, '', newUrl);
        }
      }
      
      console.log('✅ Loaded existing draft from database');
      return true;
    } catch (error) {
      console.error('Failed to load draft project:', error);
      return false;
    }
  };

  // Helper function to find most recent draft
  const findMostRecentDraft = async () => {
    try {
      const projectsResponse = await api.getProjects({ limit: 100 });
      const projects = projectsResponse?.data?.projects || projectsResponse?.data || projectsResponse || [];
      
      // Filter for cluster projects with stepData (draft data)
      const clusterProjectsWithData = projects.filter((p: any) => {
        const isCluster = p.projectType === 'cluster';
        const hasStepData = p.stepData && Object.keys(p.stepData).length > 0;
        return isCluster && hasStepData;
      });
      
      if (clusterProjectsWithData.length === 0) {
        return null;
      }
      
      // Prioritize projects with status 'draft' first (or no status, which means draft)
      // Projects without status or with status='draft' are considered drafts
      const draftProjects = clusterProjectsWithData.filter((p: any) => 
        !p.status || p.status === 'draft' || p.status === undefined || p.status === null
      );
      const nonDraftProjects = clusterProjectsWithData.filter((p: any) => 
        p.status && p.status !== 'draft' && p.status !== undefined && p.status !== null
      );
      
      // Sort function to get most recent
      const sortByDate = (a: any, b: any) => {
        const aDate = new Date(a.updatedAt || a.createdAt || 0);
        const bDate = new Date(b.updatedAt || b.createdAt || 0);
        return bDate.getTime() - aDate.getTime();
      };
      
      // If we have draft projects, return the most recent one
      if (draftProjects.length > 0) {
        const mostRecentDraft = draftProjects.sort(sortByDate)[0];
        console.log('📋 Found draft project with status="draft":', mostRecentDraft._id || mostRecentDraft.id);
        return mostRecentDraft;
      }
      
      // If no draft projects, return the most recent project with stepData (fallback)
      if (nonDraftProjects.length > 0) {
        const mostRecentNonDraft = nonDraftProjects.sort(sortByDate)[0];
        console.log('📋 Found project with stepData (not draft status):', mostRecentNonDraft._id || mostRecentNonDraft.id);
        return mostRecentNonDraft;
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to check for existing drafts:', error);
      return null;
    }
  };

  // Load existing draft data from database when component mounts
  useEffect(() => {
    const loadExistingDraft = async () => {
      try {
        setIsLoadingData(true);
        
        // Get projectId or dprId from URL params or search params
        const projectIdFromUrl = params.projectId || searchParams.get('projectId');
        const dprIdFromUrl = params.dprId || searchParams.get('dprId');
        const isNew = searchParams.get('new') === 'true'; // Check for new parameter
        
        // Also check store for existing IDs
        const projectId = projectIdFromUrl || data.projectId;
        const dprId = dprIdFromUrl || data.dprId;
        
        // If user explicitly wants to create new, check for existing draft first
        if (isNew) {
          // Before resetting, check if user has an existing draft
          const draftProject = await findMostRecentDraft();
          
          // If draft exists, load it instead of resetting
          if (draftProject && (draftProject._id || draftProject.id)) {
            const pid = draftProject._id || draftProject.id;
            console.log('📋 Found existing draft, loading it instead of creating new:', pid);
            
            const loaded = await loadDraftProject(pid);
            if (loaded) {
              setIsLoadingData(false);
              return;
            }
          }
          
          // No existing draft found, proceed with reset
          resetData();
          setDprIds('', ''); // Clear IDs
          setProject(null); // Clear project
          console.log('🆕 Starting fresh cluster DPR creation');
          setIsLoadingData(false);
          return;
        }
        
        // If we have a projectId, load project data (which contains stepData)
        if (projectId) {
          const loaded = await loadDraftProject(projectId, dprId);
          if (!loaded) {
            // If loading fails, reset to start fresh
            resetData();
            setDprIds('', '');
            setProject(null);
            console.log('🔄 Cleared data - starting fresh cluster creation');
          }
        } else {
          // No projectId in URL or store - check for existing draft
          const draftProject = await findMostRecentDraft();
          
          if (draftProject && (draftProject._id || draftProject.id)) {
            const pid = draftProject._id || draftProject.id;
            console.log('📋 Found existing draft, loading it:', pid);
            
            const loaded = await loadDraftProject(pid);
            if (loaded) {
              setIsLoadingData(false);
              return;
            }
          }
          
          // No existing draft found, reset to start fresh
          resetData();
          setDprIds('', '');
          setProject(null);
          console.log('🆕 Starting fresh cluster DPR creation - no project ID');
        }
      } catch (error) {
        console.error('Error loading existing draft:', error);
        // On any error, reset to ensure clean state
        resetData();
        setDprIds('', '');
        setProject(null);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    loadExistingDraft();
  }, []); // Run only on mount
  
  // Force re-render when data loads to ensure form fields are populated
  useEffect(() => {
    if (!isLoadingData && data.step1) {
      console.log('✅ Data loaded, form should now display:', {
        hasStep1: !!data.step1,
        step1Keys: Object.keys(data.step1 || {}),
        currentStep: data.currentStep,
      });
    }
  }, [isLoadingData, data]);

  // Debounce function to prevent too many rapid saves
  const saveToDatabaseRef = useRef<NodeJS.Timeout | null>(null);
  
  const saveToDatabase = useCallback(async () => {
    // Clear any pending save
    if (saveToDatabaseRef.current) {
      clearTimeout(saveToDatabaseRef.current);
    }
    
    // Debounce: wait 500ms after last change before saving
    saveToDatabaseRef.current = setTimeout(async () => {
      try {
        // Save if we have any step data (not just step1.clusterName)
        // Check if any step has data
        const hasAnyData = Object.keys(data).some(key => {
          if (key.startsWith('step')) {
            const stepData = data[key as keyof typeof data];
            return stepData && typeof stepData === 'object' && Object.keys(stepData).length > 0;
          }
          return false;
        });
        
        if (hasAnyData || data.projectId) {
          // Save if we have any step data OR if we already have a projectId (to update existing draft)
          const response = await api.saveClusterDPRDraft(data);
          if (response.success && response.data) {
            // Store the dprId and projectId from the response
            if (response.data.dprId && response.data.projectId) {
              setDprIds(response.data.dprId, response.data.projectId);
              // Update URL to include IDs for future loads
              const newUrl = `/cluster-dpr/create?projectId=${response.data.projectId}&dprId=${response.data.dprId}`;
              window.history.replaceState({}, '', newUrl);
            }
            console.log('💾 Auto-saved cluster DPR draft to database');
          }
        }
      } catch (error) {
        console.error('Error auto-saving draft to database:', error);
        // Don't show error toast for background saves
      }
    }, 500);
  }, [data, setDprIds]);

  useEffect(() => {
    // Auto-save draft to database every 20 seconds (debounced to prevent too many API calls)
    const databaseInterval = setInterval(() => {
      saveToDatabase();
    }, 30000);

    return () => {
      clearInterval(databaseInterval);
      // Clear any pending debounced save
      if (saveToDatabaseRef.current) {
        clearTimeout(saveToDatabaseRef.current);
      }
      // Save data one final time when component unmounts (user navigates away)
      // Use a synchronous save without debounce
      const finalSave = async () => {
        try {
          const hasAnyData = Object.keys(data).some(key => {
            if (key.startsWith('step')) {
              const stepData = data[key as keyof typeof data];
              return stepData && typeof stepData === 'object' && Object.keys(stepData).length > 0;
            }
            return false;
          });
          
          if (hasAnyData || data.projectId) {
            await api.saveClusterDPRDraft(data);
            console.log('💾 Final save on component unmount');
          }
        } catch (error) {
          console.error('Error in final save on unmount:', error);
        }
      };
      finalSave();
    };
  }, [saveToDatabase, data]);

  // Trigger save when data changes (including when AI suggestions are applied)
  useEffect(() => {
    // Only trigger save if we have step data and we're not currently loading initial data
    if (!isLoadingData) {
      // Debounce the save to avoid too many API calls
      const timeoutId = setTimeout(() => {
        saveToDatabase();
      }, 2000); // Wait 2 seconds after data change before saving

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [data, isLoadingData, saveToDatabase]);

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      // Save to database before moving to next step
      try {
        // Check if we have any step data to save
        const hasAnyData = Object.keys(data).some(key => {
          if (key.startsWith('step')) {
            const stepData = data[key as keyof typeof data];
            return stepData && typeof stepData === 'object' && Object.keys(stepData).length > 0;
          }
          return false;
        });
        
        if (hasAnyData || data.projectId) {
          const response = await api.saveClusterDPRDraft(data);
          if (response.success && response.data) {
            // Store the dprId and projectId from the response
            if (response.data.dprId && response.data.projectId) {
              setDprIds(response.data.dprId, response.data.projectId);
              // Update URL to include IDs for future loads
              const newUrl = `/cluster-dpr/create?projectId=${response.data.projectId}&dprId=${response.data.dprId}`;
              window.history.replaceState({}, '', newUrl);
            }
            console.log('💾 Saved cluster DPR draft before moving to next step');
          }
        }
      } catch (error) {
        console.error('Error saving draft before next step:', error);
        // Continue to next step even if save fails
      }
      
      setCurrentStep(currentStep + 1);
      // Scroll to top of form
      document.getElementById('cluster-dpr-form')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePrevious = async () => {
    if (currentStep > 1) {
      // Save to database before moving to previous step (to ensure data is persisted)
      try {
        // Check if we have any step data to save
        const hasAnyData = Object.keys(data).some(key => {
          if (key.startsWith('step')) {
            const stepData = data[key as keyof typeof data];
            return stepData && typeof stepData === 'object' && Object.keys(stepData).length > 0;
          }
          return false;
        });
        
        if (hasAnyData || data.projectId) {
          const response = await api.saveClusterDPRDraft(data);
          if (response.success && response.data) {
            // Store the dprId and projectId from the response
            if (response.data.dprId && response.data.projectId) {
              setDprIds(response.data.dprId, response.data.projectId);
              // Update URL to include IDs for future loads
              const newUrl = `/cluster-dpr/create?projectId=${response.data.projectId}&dprId=${response.data.dprId}`;
              window.history.replaceState({}, '', newUrl);
            }
            console.log('💾 Saved cluster DPR draft before moving to previous step');
          }
        }
      } catch (error) {
        console.error('Error saving draft before previous step:', error);
        // Continue to previous step even if save fails
      }
      
      setCurrentStep(currentStep - 1);
      // Scroll to top of form
      document.getElementById('cluster-dpr-form')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStepClick = (step: number) => {
    setCurrentStep(step);
    document.getElementById('cluster-dpr-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSaveDraft = async () => {
    // Save to database
    try {
      if (data.step1?.clusterName) {
        const response = await api.saveClusterDPRDraft(data);
        if (response.success && response.data) {
          // Store the dprId and projectId from the response
          if (response.data.dprId && response.data.projectId) {
            setDprIds(response.data.dprId, response.data.projectId);
          }
          toast.success('Draft saved to database successfully!');
        } else {
          toast.error('Failed to save draft');
        }
      } else {
        toast.error('Please complete Step 1 (Cluster Name) before saving');
      }
    } catch (error) {
      console.error('Error saving draft to database:', error);
      toast.error('Failed to save draft to database');
    }
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

      // Get enhanced content and images from database if DPR/project already exists
      // Otherwise, enhanced content will be empty and backend will generate it
      let enhancedContent: Record<string, string> = {};
      let projectImages: Record<string, string> = {};
      
      // Try to find existing project to get enhanced content and images
      try {
        // First, try to find existing project
        const existingProjects = await api.getProjects({ 
          projectName: data.step1?.clusterName,
          projectType: 'cluster'
        });
        
        if (existingProjects.data && existingProjects.data.length > 0) {
          const foundProject = existingProjects.data[0];
          
          // Get images from project
          projectImages = foundProject.images || {};
          if (Object.keys(projectImages).length > 0) {
            console.log('📥 Loaded images from project:', Object.keys(projectImages).length, 'images');
          }
          
          // Try to get existing DPRs for this project
          const projectDPRs = await api.getProjectDPRs(foundProject._id || foundProject.id);
          
          if (projectDPRs.data && projectDPRs.data.length > 0) {
            // Get the most recent DPR
            const latestDPR = projectDPRs.data[0];
            const dprContent = latestDPR.content?.english || latestDPR.content?.telugu || {};
            enhancedContent = dprContent.enhancedContent || {};
            console.log('📥 Loaded enhanced content from database:', Object.keys(enhancedContent).length, 'sections');
          }
        }
      } catch (error) {
        console.error('Error loading enhanced content/images from database:', error);
        // Continue without enhanced content/images - backend will generate content
      }

      // Also check if we have images in the current project state
      if (project?.images && Object.keys(project.images).length > 0) {
        projectImages = { ...projectImages, ...project.images };
      }

      // Prepare complete data - ensure all step data is included
      const completeData = {
        ...data,
        // Include enhanced content so backend can use it
        enhancedContent: enhancedContent,
        // Include images from project so backend can use them
        images: projectImages,
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
        enhancedContentSections: Object.keys(enhancedContent).length,
        imagesCount: Object.keys(projectImages).length,
        imageIds: Object.keys(projectImages),
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
        resetData();
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
                {isLoadingData ? (
                  <Card>
                    <CardContent className="py-12">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading draft data from database...</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
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
                        key={`step-${currentStep}-${data.projectId || 'new'}-${isLoadingData ? 'loading' : 'loaded'}-${data.step1 ? JSON.stringify(data.step1).substring(0, 50) : ''}`}
                        currentStep={currentStep}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                      />
                    </CardContent>
                  </Card>
                )}

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
                        <div className="flex items-center gap-1 border rounded-lg p-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewZoom(Math.max(0.5, previewZoom - 0.1))}
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
                            onClick={() => setPreviewZoom(1)}
                            className="h-7 w-7 p-0"
                            title="Reset Zoom"
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
                  <CardContent className="flex-1 overflow-auto p-0 bg-gray-100 relative">
                    <div 
                      id="dpr-preview-container"
                      className="w-full h-full overflow-auto"
                      style={{ 
                        transform: `scale(${previewZoom})`,
                        transformOrigin: 'top left',
                        width: `${100 / previewZoom}%`,
                        height: `${100 / previewZoom}%`,
                        overflowY: 'auto',
                        overflowX: 'auto',
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
                          project={project || {
                            _id: data.projectId,
                            id: data.projectId,
                            projectName: data.step1?.clusterName,
                            projectType: 'cluster',
                            stepData: data,
                          }}
                          viewLanguage="english"
                          onSectionClick={(stepNumber: number) => {
                            setCurrentStep(stepNumber);
                            document.getElementById('cluster-dpr-form')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          onDataChange={(field, value) => {
                            // Update store when financial data changes
                            if (field === 'financialStatements') {
                              const currentStep15 = data.step15 || {};
                              setStepData(15, {
                                ...currentStep15,
                                financialStatements: value,
                              });
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
