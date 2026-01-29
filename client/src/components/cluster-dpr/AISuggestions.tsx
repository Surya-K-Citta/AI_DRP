// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { AISuggestionsService, AISuggestion } from '@/services/aiSuggestions.service';
import { useClusterDPRStore } from '@/store/clusterDPRStore';
import { toast } from 'react-hot-toast';

interface AISuggestionsProps {
  currentStep: number;
  currentStepData: any;
  onApplySuggestion?: (field: string, content: string) => void;
}

export const AISuggestions: React.FC<AISuggestionsProps> = ({
  currentStep,
  currentStepData,
  onApplySuggestion,
}) => {
  const { data, setStepData } = useClusterDPRStore();
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [applyingFields, setApplyingFields] = useState<Set<string>>(new Set());
  const [applyingAll, setApplyingAll] = useState(false);

  // Only show AI suggestions from Step 2 onwards (Step 1 provides basic info)
  if (currentStep < 2) {
    return null;
  }

  // Collect previous steps data (in-memory) - use useMemo to avoid recalculating
  const previousStepsData = React.useMemo(() => {
    const previousData: Record<string, any> = {};
    for (let i = 1; i < currentStep; i++) {
      const stepKey = `step${i}`;
      if (data[stepKey as keyof typeof data]) {
        previousData[stepKey] = data[stepKey as keyof typeof data];
      }
    }
    return previousData;
  }, [currentStep, data]);

  const hasPreviousData = previousStepsData.step1 && Object.keys(previousStepsData.step1).length > 0;

  // Reset suggestions when step changes
  useEffect(() => {
    setSuggestions([]);
    setHasGenerated(false);
  }, [currentStep]);

  // Function to generate AI suggestions
  const handleGenerateSuggestions = async () => {
    if (!hasPreviousData) {
      return;
    }

    setLoading(true);
    try {
      const aiSuggestions = await AISuggestionsService.getSuggestionsForStep(
        currentStep,
        currentStepData,
        previousStepsData
      );
      setSuggestions(aiSuggestions || []);
      setHasGenerated(true);
    } catch (error) {
      console.error('Error loading AI suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const parseAndTransformFieldContent = (field: string, content: string) => {
    // Parse content if it's JSON (for array fields)
    let parsedContent: any = content;
    try {
      parsedContent = JSON.parse(content);
      console.log(`✅ Parsed JSON content for ${field}:`, parsedContent);

      if (Array.isArray(parsedContent)) {
        if (field === 'valueAdditionStages') {
          if (parsedContent.length > 0 && typeof parsedContent[0] === 'string') {
            parsedContent = parsedContent.map((stage: string) => ({
              stage,
              sellingPrice: 0,
            }));
            console.log(`✅ Transformed valueAdditionStages to object format:`, parsedContent);
          }
        } else if (field === 'rawMaterials') {
          if (parsedContent.length > 0 && typeof parsedContent[0] === 'string') {
            parsedContent = parsedContent.map((material: string) => ({
              name: material,
              source: '',
            }));
            console.log(`✅ Transformed rawMaterials to object format:`, parsedContent);
          }
        } else if (field === 'boardOfDirectors') {
          if (parsedContent.length > 0 && typeof parsedContent[0] === 'string') {
            parsedContent = parsedContent.map((director: string) => ({
              name: director,
              designation: '',
            }));
            console.log(`✅ Transformed boardOfDirectors to object format:`, parsedContent);
          }
        } else if (field === 'shareholdingPattern') {
          if (parsedContent.length > 0 && typeof parsedContent[0] === 'string') {
            parsedContent = parsedContent.map((stakeholder: string) => ({
              stakeholder,
              percentage: 0,
            }));
            console.log(`✅ Transformed shareholdingPattern to object format:`, parsedContent);
          }
        } else if (field === 'memberUnits') {
          if (parsedContent.length > 0 && typeof parsedContent[0] === 'string') {
            parsedContent = parsedContent.map((unit: string) => ({
              name: unit,
              registration: '',
            }));
            console.log(`✅ Transformed memberUnits to object format:`, parsedContent);
          }
        }
      }
    } catch {
      parsedContent = content;
      console.log(`✅ Using plain text content for ${field}:`, parsedContent);
    }

    if (
      parsedContent === null ||
      parsedContent === undefined ||
      (Array.isArray(parsedContent) && parsedContent.length === 0) ||
      (typeof parsedContent === 'string' && parsedContent.trim() === '')
    ) {
      return null;
    }

    return parsedContent;
  };

  // Function to apply a suggestion to a field
  const handleApplySuggestion = async (suggestion: AISuggestion) => {
    if (!suggestion.field) {
      toast.error('Field name is missing');
      return;
    }

    setApplyingFields(prev => new Set(prev).add(suggestion.field));

    try {
      // Generate actual content for the field
      const content = await AISuggestionsService.generateFieldContent(
        suggestion.field,
        currentStep,
        currentStepData,
        previousStepsData,
        suggestion.suggestion
      );

      if (content) {
        const parsedContent = parseAndTransformFieldContent(suggestion.field, content);
        if (parsedContent === null) {
          toast.error(`Generated content is empty for ${suggestion.field}. Please try again.`);
          return;
        }

        // Update the form data
        const updatedStepData = {
          ...currentStepData,
          [suggestion.field]: parsedContent,
        };
        setStepData(currentStep, updatedStepData);
        console.log(`Updated step ${currentStep} data for field ${suggestion.field}:`, parsedContent);

        // Call the optional callback
        if (onApplySuggestion) {
          onApplySuggestion(suggestion.field, parsedContent);
        }

        toast.success(`Applied AI suggestion to ${suggestion.field}`);
      } else {
        toast.error('Failed to generate content for this field');
      }
    } catch (error) {
      console.error('Error applying suggestion:', error);
      toast.error('Failed to apply suggestion');
    } finally {
      setApplyingFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(suggestion.field);
        return newSet;
      });
    }
  };

  const handleApplyAllSuggestions = async () => {
    if (!suggestions || suggestions.length === 0) return;
    if (applyingAll) return;

    const validSuggestions = suggestions.filter((s) => !!s.field);
    if (validSuggestions.length === 0) {
      toast.error('No applicable suggestions found.');
      return;
    }

    setApplyingAll(true);
    // Mark all fields as applying (disables individual Apply buttons)
    setApplyingFields(new Set(validSuggestions.map((s) => s.field)));

    try {
      let updatedStepData = { ...currentStepData };
      let appliedCount = 0;

      // Sequential on purpose (keeps API load reasonable, easier to debug)
      for (const suggestion of validSuggestions) {
        try {
          const content = await AISuggestionsService.generateFieldContent(
            suggestion.field,
            currentStep,
            updatedStepData,
            previousStepsData,
            suggestion.suggestion
          );

          if (!content) continue;

          const parsedContent = parseAndTransformFieldContent(suggestion.field, content);
          if (parsedContent === null) continue;

          updatedStepData = {
            ...updatedStepData,
            [suggestion.field]: parsedContent,
          };

          if (onApplySuggestion) {
            onApplySuggestion(suggestion.field, parsedContent);
          }

          appliedCount += 1;
        } catch (e) {
          console.error(`Error applying suggestion for ${suggestion.field}:`, e);
          // Continue applying others
        }
      }

      if (appliedCount === 0) {
        toast.error('Could not apply any suggestions. Try again.');
        return;
      }

      // Single store update for the step (final state)
      setStepData(currentStep, updatedStepData);
      toast.success(`Applied ${appliedCount} suggestion${appliedCount !== 1 ? 's' : ''}`);
    } finally {
      setApplyingAll(false);
      setApplyingFields(new Set());
    }
  };

  // Show button to generate suggestions if not generated yet
  if (!hasGenerated && !loading) {
    if (!hasPreviousData) {
      return (
        <div className="mb-4 p-3 bg-muted/50 border border-muted rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs">Complete Step 1 first to get AI suggestions for this step.</span>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-4 p-4 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Get AI Suggestions</p>
              <p className="text-xs text-muted-foreground">
                Get contextual recommendations based on your previous step data
              </p>
            </div>
          </div>
          <button
            onClick={handleGenerateSuggestions}
            disabled={loading || !hasPreviousData}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Sparkles className="h-4 w-4" />
            Generate Suggestions
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-center gap-2 text-primary">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Generating AI suggestions based on previous steps...</span>
        </div>
      </div>
    );
  }

  // Don't show anything if no suggestions generated
  if (suggestions.length === 0 && hasGenerated) {
    return (
      <div className="mb-4 p-3 bg-muted/50 border border-muted rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs">No suggestions available. Try generating again or fill in more fields.</span>
          </div>
          <button
            onClick={handleGenerateSuggestions}
            disabled={loading}
            className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show suggestions if generated
  if (suggestions.length > 0 && hasGenerated) {
    return (
      <div className="mb-4 border border-primary/20 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-1 flex items-center justify-between hover:bg-primary/10 transition-colors rounded-lg p-2 -m-2"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">AI Suggestions</span>
              <span className="text-xs text-muted-foreground">
                ({suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''})
              </span>
            </div>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={handleGenerateSuggestions}
            disabled={loading}
            className="ml-2 px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 disabled:opacity-50 transition-colors flex items-center gap-1"
            title="Regenerate suggestions"
          >
            <Sparkles className="h-3 w-3" />
            Regenerate
          </button>
          <button
            onClick={handleApplyAllSuggestions}
            disabled={loading || applyingAll}
            className="ml-2 px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            title="Apply all suggestions"
          >
            {applyingAll ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Check className="h-3 w-3" />
                Apply All
              </>
            )}
          </button>
        </div>

        {expanded && (
          <div className="px-4 pb-4 space-y-3">
            {suggestions.map((suggestion, index) => {
              const isApplying = suggestion.field && applyingFields.has(suggestion.field);
              return (
                <div
                  key={index}
                  className="p-3 bg-white/50 rounded-lg border border-primary/10"
                >
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      {suggestion.field && (
                        <p className="text-xs font-semibold text-primary mb-1">
                          {suggestion.field}:
                        </p>
                      )}
                      <p className="text-sm text-gray-700">
                        {typeof suggestion.suggestion === 'string' 
                          ? suggestion.suggestion 
                          : typeof suggestion.suggestion === 'object' 
                            ? JSON.stringify(suggestion.suggestion, null, 2)
                            : String(suggestion.suggestion || '')}
                      </p>
                      {suggestion.reasoning && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          {typeof suggestion.reasoning === 'string' 
                            ? suggestion.reasoning 
                            : typeof suggestion.reasoning === 'object' 
                              ? JSON.stringify(suggestion.reasoning, null, 2)
                              : String(suggestion.reasoning || '')}
                        </p>
                      )}
                    </div>
                    {suggestion.field && (
                      <button
                        onClick={() => handleApplySuggestion(suggestion)}
                        disabled={isApplying}
                        className="ml-2 px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 flex-shrink-0"
                        title={`Apply suggestion to ${suggestion.field}`}
                      >
                        {isApplying ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Applying...
                          </>
                        ) : (
                          <>
                            <Check className="h-3 w-3" />
                            Apply
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return null;
};
