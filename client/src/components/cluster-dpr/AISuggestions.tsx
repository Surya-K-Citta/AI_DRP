// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Loader2, ChevronDown, ChevronUp, Check, RefreshCw, X } from 'lucide-react';
import { AISuggestionsService, AISuggestion } from '@/services/aiSuggestions.service';
import { useClusterDPRStore } from '@/store/clusterDPRStore';
import { useIndividualDPRStore } from '@/store/individualDPRStore';
import { toast } from 'react-hot-toast';
import { extraFieldsForScheme } from '@/lib/individualDpr/schemeFormConfig';
import { getSchemeSteps } from '@/lib/individualDpr/schemeStepCatalog';
import { EXTRA_FIELD_LABELS, getIndividualDocFields } from '@/lib/individualDpr/individualDocModel';
import { getUnitName } from '@/lib/individualDpr/toIndividualPayload';
import { normalizeMilestones, toDateInputValue, isNumericDprField, suggestionToFieldValue } from '@/lib/dprAiFieldNormalize';
import {
  suggestCurrentStepWithAi,
  regenerateStepFieldSuggestion,
  applyCatalogSuggestionToForm,
  applyAllCatalogSuggestionsToForm,
  FillStepProgress,
  StepFieldSuggestion,
} from '@/lib/individualDpr/fillAllStepsWithAi';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';

const SUGGESTION_LABELS: Record<string, string> = {
  year: 'Year',
  label: 'Year',
  sales: 'Sales (₹ Lakhs)',
  rm: 'Raw material (₹ Lakhs)',
  wages: 'Wages (₹ Lakhs)',
  power: 'Power (₹ Lakhs)',
  salaries: 'Salaries (₹ Lakhs)',
  rent: 'Rent (₹ Lakhs)',
  maintenance: 'Maintenance (₹ Lakhs)',
  admin: 'Admin (₹ Lakhs)',
  interest: 'Interest (₹ Lakhs)',
  depreciation: 'Depreciation (₹ Lakhs)',
  tax: 'Tax (₹ Lakhs)',
  netProfit: 'Net profit (₹ Lakhs)',
  percent: 'Utilisation (%)',
  name: 'Name',
  sharePercent: 'Share of output (%)',
  sellingPrice: 'Selling price',
  description: 'Description',
  condition: 'Condition',
  supplier: 'Supplier',
  quantity: 'Quantity',
  unitCost: 'Unit cost (₹ Lakhs)',
  incurred: 'Already incurred',
  proposed: 'To be incurred',
};

function parseStructuredSuggestion(text: string): unknown | null {
  const trimmed = String(text || '').trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
  try {
    const value = JSON.parse(trimmed);
    if (value && typeof value === 'object') return value;
  } catch {
    return null;
  }
  return null;
}

function suggestionLabel(key: string): string {
  if (SUGGESTION_LABELS[key]) return SUGGESTION_LABELS[key];
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (letter) => letter.toUpperCase());
}

function SuggestionValue({ text }: { text: string }) {
  const tf = useClusterFormText();
  const parsed = parseStructuredSuggestion(text);
  if (Array.isArray(parsed) && parsed.every((row) => row && typeof row === 'object' && !Array.isArray(row))) {
    const keys = [...new Set(parsed.flatMap((row) => Object.keys(row as Record<string, unknown>)))];
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              {keys.map((key) => (
                <th key={key} className="p-1 text-left font-medium text-muted-foreground">
                  {tf(suggestionLabel(key))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parsed.map((row, index) => (
              <tr key={index}>
                {keys.map((key) => (
                  <td key={key} className="p-1">
                    <input
                      readOnly
                      className="h-9 w-full min-w-[5.5rem] rounded-md border border-input bg-background px-2 text-sm"
                      value={String((row as Record<string, unknown>)[key] ?? '')}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {Object.entries(parsed as Record<string, unknown>).map(([key, value]) => (
          <label key={key} className="block text-xs">
            <span className="mb-1 block font-medium text-muted-foreground">{tf(suggestionLabel(key))}</span>
            <input
              readOnly
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={value != null && typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')}
            />
          </label>
        ))}
      </div>
    );
  }
  return <p className="text-sm text-gray-700 whitespace-pre-wrap">{text}</p>;
}

interface AISuggestionsProps {
  currentStep: number;
  currentStepData: any;
  onApplySuggestion?: (field: string, content: string) => void;
  excludeFields?: string[];
  data?: any;
  setStepData?: (step: number, stepData: any) => void;
  getStepData?: (step: number) => any;
  setSchemeExtras?: (extras: any) => void;
  contextHint?: string;
  isIndividualDPR?: boolean;
}

export const AISuggestions: React.FC<AISuggestionsProps> = ({
  currentStep,
  currentStepData,
  onApplySuggestion,
  excludeFields = [],
  data: dataProp,
  setStepData: setStepDataProp,
  getStepData: getStepDataProp,
  setSchemeExtras: setSchemeExtrasProp,
  contextHint,
  isIndividualDPR = false,
}) => {
  const clusterStore = useClusterDPRStore();
  const tf = useClusterFormText();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const aiAllowed = !!user?.privacy?.aiAssist;
  const data = dataProp ?? clusterStore.data;
  const setStepData = setStepDataProp ?? clusterStore.setStepData;
  const getStepData = getStepDataProp ?? clusterStore.getStepData;
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [stepSuggestions, setStepSuggestions] = useState<StepFieldSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [hasGenerated, setHasGenerated] = useState(false);
  const schemeExtraFields = extraFieldsForScheme(isIndividualDPR ? data?.matchedSchemeCode : null);
  const [applyingAll, setApplyingAll] = useState(false);
  const [applyingFields, setApplyingFields] = useState<Set<string>>(new Set());
  const [fillProgress, setFillProgress] = useState<FillStepProgress | null>(null);
  const [regenTarget, setRegenTarget] = useState<StepFieldSuggestion | null>(null);
  const [regenInstructions, setRegenInstructions] = useState('');
  const [regeneratingField, setRegeneratingField] = useState<string | null>(null);
  const fieldLabel = (field: string) => {
    if (EXTRA_FIELD_LABELS[field]) return EXTRA_FIELD_LABELS[field];
    const pretty: Record<string, string> = {
      natureOfBusiness: 'Nature of Business',
      majorProducts: 'Major Products',
      unitName: 'Unit / Project Name',
      district: 'District',
      location: 'Location',
      sectorType: 'Sector / industry type',
      sectorDescription: 'Sector description',
      processOfManufacture: 'Process of manufacture',
      powerRequirement: 'Power requirement',
      workplaceType: 'Workplace',
      entrepreneurName: 'Vendor / entrepreneur name',
      entrepreneurAge: 'Age',
    };
    return pretty[field] || field;
  };

  const schemeCode = isIndividualDPR ? data?.matchedSchemeCode || null : null;
  const markAiStep = () => {
    if (!isIndividualDPR || !setSchemeExtrasProp) return;
    // Read the store after apply. The render copy is stale and would wipe answers just written.
    const extras = useIndividualDPRStore.getState().data.schemeExtras || data?.schemeExtras || {};
    const current = Array.isArray(extras.aiAssistedSteps) ? extras.aiAssistedSteps : [];
    if (current.includes(currentStep)) return;
    setSchemeExtrasProp({ ...extras, aiAssistedSteps: [...current, currentStep] });
  };
  const budget = isIndividualDPR ? data?.ventureMatchAnswers?.budget : undefined;
  const stepCatalogFields = isIndividualDPR
    ? getIndividualDocFields(currentStep, schemeCode, budget).filter(
        (f) => !excludeFields.includes(f.name)
      )
    : [];

  const previousStepsData = React.useMemo(() => {
    const previousData: Record<string, any> = {};
    if (isIndividualDPR) {
      const catalog = getSchemeSteps(schemeCode);
      const currentLocal = catalog.find((s) => s.contentStep === currentStep)?.n ?? currentStep;
      for (const def of catalog) {
        if (def.n >= currentLocal) continue;
        const stepKey = `step${def.contentStep}`;
        if (data[stepKey as keyof typeof data]) {
          previousData[stepKey] = data[stepKey as keyof typeof data];
        }
      }
      if (data.step1 && !previousData.step1) previousData.step1 = data.step1;
      previousData._isIndividualDPR = true;
      if (schemeCode) previousData._schemeCode = schemeCode;
      if (budget) previousData._budget = budget;
      return previousData;
    }
    for (let i = 1; i < currentStep; i++) {
      const stepKey = `step${i}`;
      if (data[stepKey as keyof typeof data]) {
        previousData[stepKey] = data[stepKey as keyof typeof data];
      }
    }
    return previousData;
  }, [currentStep, data, isIndividualDPR, schemeCode, budget]);

  const hasPreviousData = Boolean(
    (previousStepsData.step1 && Object.keys(previousStepsData.step1).length > 0) ||
      (isIndividualDPR && getUnitName(data?.step1))
  );

  useEffect(() => {
    setSuggestions([]);
    setStepSuggestions([]);
    setHasGenerated(false);
    setFillProgress(null);
    setRegenTarget(null);
    setRegenInstructions('');
    setRegeneratingField(null);
  }, [currentStep]);

  const handleFillThisStep = async () => {
    if (!aiAllowed) {
      toast.error(t('privacy.aiOffWarning'));
      return;
    }
    if (currentStep === 1) return;
    if (currentStep > 1 && !hasPreviousData) return;
    if (!stepCatalogFields.length) {
      toast.error(tf('No questions to fill on this step.'));
      return;
    }

    setLoading(true);
    setFillProgress(null);
    setStepSuggestions([]);
    setHasGenerated(false);
    try {
      const result = await suggestCurrentStepWithAi({
        contentStep: currentStep,
        data,
        getStepData,
        schemeCode,
        answers: data?.ventureMatchAnswers,
        excludeFields,
        onProgress: setFillProgress,
      });

      setStepSuggestions(result.suggestions);
      setHasGenerated(true);

      if (result.suggestions.length === 0 && result.failed.length === 0) {
        toast.success(tf('This step is already filled.'));
        return;
      }
      if (result.suggestions.length === 0) {
        toast.error(tf('Could not get suggestions for this step. Try again.'));
        return;
      }
      if (result.failed.length) {
        toast.success(
          tf('Suggested {filled} of {total} questions on this step.')
            .replace('{filled}', String(result.suggestions.length))
            .replace('{total}', String(result.suggestions.length + result.failed.length))
        );
      } else {
        toast.success(
          tf('Suggested {n} questions on this step.').replace(
            '{n}',
            String(result.suggestions.length)
          )
        );
      }
    } catch (error) {
      console.error('Error suggesting step with AI:', error);
      toast.error(tf('Failed to get suggestions for this step'));
    } finally {
      setLoading(false);
      setFillProgress(null);
    }
  };

  const handleApplyStepSuggestion = (item: StepFieldSuggestion) => {
    setApplyingFields((prev) => new Set(prev).add(item.field));
    try {
      const result = applyCatalogSuggestionToForm({
        contentStep: currentStep,
        suggestion: item,
        getStepData,
        setStepData,
        setSchemeExtras: setSchemeExtrasProp,
        schemeExtras: data?.schemeExtras,
        schemeCode,
      });
      if (!result.ok) {
        toast.error(tf('Could not apply this suggestion. Try again.'));
        return;
      }
      markAiStep();
      // Do NOT call onApplySuggestion with raw AI text — that overwrites numbers with prose.
      setStepSuggestions((prev) => prev.filter((s) => s.field !== item.field));
      toast.success(tf('Applied suggestion for {label}').replace('{label}', item.label));
    } catch (error) {
      console.error('Error applying step suggestion:', error);
      toast.error(tf('Failed to apply suggestion'));
    } finally {
      setApplyingFields((prev) => {
        const next = new Set(prev);
        next.delete(item.field);
        return next;
      });
    }
  };

  const handleApplyAllStepSuggestions = () => {
    if (!stepSuggestions.length || applyingAll) return;
    setApplyingAll(true);
    setApplyingFields(new Set(stepSuggestions.map((s) => s.field)));
    try {
      const { applied, values } = applyAllCatalogSuggestionsToForm({
        contentStep: currentStep,
        suggestions: stepSuggestions,
        getStepData,
        setStepData,
        setSchemeExtras: setSchemeExtrasProp,
        schemeExtras: useIndividualDPRStore.getState().data.schemeExtras || data?.schemeExtras,
        schemeCode,
      });
      const missed = stepSuggestions.filter((item) => values[item.field] == null);
      if (applied === 0) {
        toast.error(tf('Could not apply suggestions. Try again.'));
      } else {
        markAiStep();
        setStepSuggestions(missed);
        toast.success(
          missed.length
            ? tf('Applied {n} suggestions. {left} still need a manual answer.')
                .replace('{n}', String(applied))
                .replace('{left}', String(missed.length))
            : tf('Applied {n} suggestions.').replace('{n}', String(applied))
        );
      }
    } finally {
      setApplyingAll(false);
      setApplyingFields(new Set());
    }
  };

  const openRegenerateModal = (item: StepFieldSuggestion) => {
    setRegenTarget(item);
    setRegenInstructions('');
  };

  const closeRegenerateModal = () => {
    if (regeneratingField) return;
    setRegenTarget(null);
    setRegenInstructions('');
  };

  const handleConfirmRegenerate = async () => {
    if (!regenTarget) return;
    if (!aiAllowed) {
      toast.error(t('privacy.aiOffWarning'));
      return;
    }
    const instruction = regenInstructions.trim();
    if (!instruction) {
      toast.error(tf('Tell us what you want to add before regenerating.'));
      return;
    }

    setRegeneratingField(regenTarget.field);
    try {
      const next = await regenerateStepFieldSuggestion({
        contentStep: currentStep,
        field: regenTarget.field,
        label: regenTarget.label,
        source: regenTarget.source,
        instruction,
        currentSuggestion: regenTarget.suggestion,
        data,
        getStepData,
        schemeCode,
        answers: data?.ventureMatchAnswers,
        excludeFields,
      });
      if (!next) {
        toast.error(tf('Could not regenerate this suggestion. Try again.'));
        return;
      }
      setStepSuggestions((prev) =>
        prev.map((s) => (s.field === next.field ? next : s))
      );
      setRegenTarget(null);
      setRegenInstructions('');
      toast.success(tf('Suggestion regenerated.'));
    } catch (error) {
      console.error('Error regenerating suggestion:', error);
      toast.error(tf('Failed to regenerate suggestion'));
    } finally {
      setRegeneratingField(null);
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!aiAllowed) {
      toast.error(t('privacy.aiOffWarning'));
      return;
    }
    if (currentStep > 1 && !hasPreviousData) {
      return;
    }

    setLoading(true);
    try {
      const aiSuggestions = await AISuggestionsService.getSuggestionsForStep(
        currentStep,
        currentStepData,
        {
          ...previousStepsData,
          ...(contextHint ? { _promptContext: contextHint } : {}),
        },
        excludeFields
      );

      const filteredSuggestions = (aiSuggestions || []).filter((suggestion) => {
        if (excludeFields.includes(suggestion.field)) return false;
        return true;
      });
      setSuggestions(filteredSuggestions);
      setHasGenerated(true);
    } catch (error) {
      console.error('Error loading AI suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const parseAndTransformFieldContent = (field: string, content: string) => {
    let parsedContent: any = content;
    try {
      parsedContent = JSON.parse(content);

      if (typeof parsedContent === 'object' && !Array.isArray(parsedContent)) {
        if (field === 'connectivity') {
          parsedContent = {
            road: parsedContent.road || parsedContent.Road || '',
            rail: parsedContent.rail || parsedContent.Rail || '',
            port: parsedContent.port || parsedContent.Port || '',
          };
        }
      }

      if (Array.isArray(parsedContent)) {
        if (field === 'valueAdditionStages') {
          if (parsedContent.length > 0 && typeof parsedContent[0] === 'string') {
            parsedContent = parsedContent.map((stage: string) => ({
              stage,
              sellingPrice: 0,
            }));
          }
        } else if (field === 'rawMaterials') {
          if (parsedContent.length > 0 && typeof parsedContent[0] === 'string') {
            parsedContent = parsedContent.map((material: string) => ({
              name: material,
              source: '',
            }));
          }
        } else if (field === 'boardOfDirectors') {
          if (parsedContent.length > 0 && typeof parsedContent[0] === 'string') {
            parsedContent = parsedContent.map((director: string) => ({
              name: director,
              designation: '',
            }));
          }
        } else if (field === 'shareholdingPattern') {
          if (parsedContent.length > 0 && typeof parsedContent[0] === 'string') {
            parsedContent = parsedContent.map((stakeholder: string) => ({
              stakeholder,
              percentage: 0,
            }));
          }
        } else if (field === 'memberUnits') {
          if (parsedContent.length > 0 && typeof parsedContent[0] === 'string') {
            parsedContent = parsedContent.map((unit: string) => ({
              name: unit,
              registration: '',
            }));
          }
        } else if (field === 'milestones') {
          parsedContent = normalizeMilestones(parsedContent);
        }
      }
    } catch {
      parsedContent = content;
    }

    if (field === 'startDate' || field === 'endDate') {
      const dateValue = toDateInputValue(parsedContent);
      return dateValue || null;
    }

    if (field === 'milestones') {
      const rows = normalizeMilestones(parsedContent);
      return rows.length ? rows : null;
    }

    if (
      parsedContent === null ||
      parsedContent === undefined ||
      (Array.isArray(parsedContent) && parsedContent.length === 0) ||
      (typeof parsedContent === 'string' && parsedContent.trim() === '')
    ) {
      return null;
    }

    if (isNumericDprField(field)) {
      const n = suggestionToFieldValue(field, parsedContent);
      return n == null || n === '' ? null : n;
    }

    return parsedContent;
  };

  const extractValueFromSuggestion = (field: string, suggestionText: string): any => {
    if (!suggestionText) return null;

    // Prefer shared numeric / date / structured parsers (₹ Lakhs prose → number)
    const normalized = suggestionToFieldValue(field, suggestionText);
    if (normalized !== null && normalized !== undefined && normalized !== '') {
      if (isNumericDprField(field) || field === 'startDate' || field === 'endDate' || field === 'milestones') {
        return normalized;
      }
      if (typeof normalized === 'object') return normalized;
    }

    if (field === 'startDate' || field === 'endDate') {
      return toDateInputValue(suggestionText) || null;
    }

    if (field === 'milestones') {
      try {
        const arrayMatch = suggestionText.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          const parsed = JSON.parse(arrayMatch[0]);
          const rows = normalizeMilestones(parsed);
          if (rows.length) return rows;
        }
      } catch {
        /* fall through */
      }
    }

    try {
      let braceCount = 0;
      let startIndex = -1;
      for (let i = 0; i < suggestionText.length; i++) {
        if (suggestionText[i] === '{') {
          if (startIndex === -1) startIndex = i;
          braceCount++;
        } else if (suggestionText[i] === '}') {
          braceCount--;
          if (braceCount === 0 && startIndex !== -1) {
            const jsonStr = suggestionText.substring(startIndex, i + 1);
            try {
              const parsed = JSON.parse(jsonStr);
              if (field === 'enterpriseCount' && parsed.micro !== undefined && parsed.small !== undefined && parsed.medium !== undefined) {
                return parsed;
              }
              if (field === 'ageOfEnterprises' && parsed.lessThan5 !== undefined && parsed.between5And10 !== undefined && parsed.moreThan10 !== undefined) {
                return parsed;
              }
              if (field === 'employmentPerUnit' && parsed.lessThan5 !== undefined && parsed.between5And10 !== undefined && parsed.moreThan10 !== undefined) {
                return parsed;
              }
              if (field === 'marketServed' && parsed.domestic !== undefined && parsed.export !== undefined) {
                return parsed;
              }
              if (field === 'connectivity' && parsed.road !== undefined && parsed.rail !== undefined && parsed.port !== undefined) {
                return parsed;
              }
            } catch (e) {
              // Continue searching
            }
            startIndex = -1;
          }
        }
      }

      const jsonArrayMatch = suggestionText.match(/\[[^\]]*\]/);
      if (jsonArrayMatch) {
        const parsed = JSON.parse(jsonArrayMatch[0]);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }

      if (field === 'investmentPerUnit' || field === 'turnoverPerUnit') {
        const numberMatch = suggestionText.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|₹|rupees?)?/i);
        if (numberMatch) {
          let num = parseFloat(numberMatch[1]);
          if (suggestionText.toLowerCase().includes('lakh')) {
            num = num * 100000;
          }
          return num;
        }
      }
    } catch (e) {
      // fall back to API
    }

    return null;
  };

  const handleApplySuggestion = async (suggestion: AISuggestion) => {
    if (!suggestion.field) {
      toast.error(tf('Field name is missing'));
      return;
    }

    setApplyingFields(prev => new Set(prev).add(suggestion.field));

    try {
      const suggestionText = typeof suggestion.suggestion === 'string'
        ? suggestion.suggestion
        : JSON.stringify(suggestion.suggestion);

      let parsedContent = extractValueFromSuggestion(suggestion.field, suggestionText);

      if (parsedContent === null) {
        const content = await AISuggestionsService.generateFieldContent(
          suggestion.field,
          currentStep,
          currentStepData,
          previousStepsData,
          suggestion.suggestion
        );

        if (content) {
          parsedContent = parseAndTransformFieldContent(suggestion.field, content);
        }
      } else {
        parsedContent = parseAndTransformFieldContent(suggestion.field, JSON.stringify(parsedContent));
      }

      if (parsedContent === null) {
        toast.error(tf('Could not extract value for {n1}. Please try again.').replace('{n1}', tf(fieldLabel(suggestion.field))));
        return;
      }

      let finalContent = parsedContent;
      if (suggestion.field === 'connectivity') {
        if (typeof parsedContent === 'object' && !Array.isArray(parsedContent)) {
          finalContent = {
            road: parsedContent.road || '',
            rail: parsedContent.rail || '',
            port: parsedContent.port || '',
          };
        } else {
          toast.error(tf('Connectivity data format is invalid. Please try again.'));
          return;
        }
      }

      if (schemeExtraFields.includes(suggestion.field)) {
        if (onApplySuggestion) onApplySuggestion(suggestion.field, finalContent);
        markAiStep();
        toast.success(tf('Applied AI suggestion to {n1}').replace('{n1}', tf(fieldLabel(suggestion.field))));
        return;
      }

      const latestStepData = getStepData(currentStep) || {};

      const updatedStepData = {
        ...latestStepData,
        [suggestion.field]: finalContent,
      };
      setStepData(currentStep, updatedStepData);

      if (onApplySuggestion) {
        onApplySuggestion(suggestion.field, finalContent);
      }

      markAiStep();
      toast.success(tf('Applied AI suggestion to {n1}').replace('{n1}', tf(fieldLabel(suggestion.field))));
    } catch (error) {
      console.error('Error applying suggestion:', error);
      toast.error(tf('Failed to apply suggestion'));
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
      toast.error(tf('No applicable suggestions found.'));
      return;
    }

    setApplyingAll(true);
    setApplyingFields(new Set(validSuggestions.map((s) => s.field)));

    try {
      const latestStepData = getStepData(currentStep) || {};
      let updatedStepData = { ...latestStepData };
      let appliedCount = 0;
      const fieldsNeedingAPI: typeof validSuggestions = [];

      for (const suggestion of validSuggestions) {
        try {
          const suggestionText = typeof suggestion.suggestion === 'string'
            ? suggestion.suggestion
            : JSON.stringify(suggestion.suggestion);

          let parsedContent = extractValueFromSuggestion(suggestion.field, suggestionText);

          if (parsedContent === null) {
            fieldsNeedingAPI.push(suggestion);
            continue;
          }

          parsedContent = parseAndTransformFieldContent(suggestion.field, JSON.stringify(parsedContent));

          if (parsedContent === null) {
            fieldsNeedingAPI.push(suggestion);
            continue;
          }

          if (schemeExtraFields.includes(suggestion.field)) {
            if (onApplySuggestion) onApplySuggestion(suggestion.field, parsedContent);
            appliedCount += 1;
            continue;
          }

          updatedStepData = {
            ...updatedStepData,
            [suggestion.field]: parsedContent,
          };
          // Do not call onApplySuggestion here — it re-reads stale step data and
          // overwrites sibling fields applied earlier in this batch.
          appliedCount += 1;
        } catch (e) {
          console.error(`Error extracting value for ${suggestion.field}:`, e);
          fieldsNeedingAPI.push(suggestion);
        }
      }

      if (fieldsNeedingAPI.length > 0) {
        const apiPromises = fieldsNeedingAPI.map(async (suggestion) => {
          try {
            const content = await AISuggestionsService.generateFieldContent(
              suggestion.field,
              currentStep,
              updatedStepData,
              previousStepsData,
              suggestion.suggestion
            );

            if (!content) return null;

            const parsedContent = parseAndTransformFieldContent(suggestion.field, content);
            if (parsedContent === null) return null;

            return { field: suggestion.field, content: parsedContent };
          } catch (e) {
            console.error(`Error applying suggestion for ${suggestion.field}:`, e);
            return null;
          }
        });

        const results = await Promise.all(apiPromises);

        for (const result of results) {
          if (result) {
            if (schemeExtraFields.includes(result.field)) {
              if (onApplySuggestion) onApplySuggestion(result.field, result.content);
              appliedCount += 1;
              continue;
            }

            updatedStepData = {
              ...updatedStepData,
              [result.field]: result.content,
            };
            appliedCount += 1;
          }
        }
      }

      if (appliedCount === 0) {
        toast.error(tf('Could not apply any suggestions. Try again.'));
        return;
      }

      setStepData(currentStep, updatedStepData);
      markAiStep();
      toast.success(tf(appliedCount !== 1 ? 'Applied {n} suggestions' : 'Applied {n} suggestion').replace('{n}', String(appliedCount)));
    } finally {
      setApplyingAll(false);
      setApplyingFields(new Set());
    }
  };

  if (!aiAllowed) {
    return (
      <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg">
        <p className="text-xs font-medium text-red-700">{t('privacy.aiOffWarning')}</p>
      </div>
    );
  }

  // Latest DPR: suggest only this step's catalog questions; Apply / Regenerate per card
  if (isIndividualDPR) {
    // Step 1 (cover / basics) is always manual — no AI fill for any scheme.
    if (currentStep === 1) {
      return null;
    }

    if (!hasPreviousData) {
      return (
        <div className="mb-4 p-3 bg-muted/50 border border-muted rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs">{tf('Complete Step 1 first to get AI suggestions for this step.')}</span>
          </div>
        </div>
      );
    }

    if (!stepCatalogFields.length) {
      return null;
    }

    const regenModal =
      regenTarget &&
      createPortal(
        <div
          className="motion-overlay fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="regen-suggestion-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label={tf('Cancel')}
            onClick={closeRegenerateModal}
            disabled={!!regeneratingField}
          />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-white shadow-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h2 id="regen-suggestion-title" className="text-base font-semibold text-gray-900">
                  {tf('Tell us what you want to add')}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {tf('For: {label}').replace('{label}', regenTarget.label)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeRegenerateModal}
                disabled={!!regeneratingField}
                className="p-1 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-50"
                aria-label={tf('Cancel')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {tf('List the points or changes you want in the new answer. We will regenerate only this question.')}
            </p>
            <textarea
              value={regenInstructions}
              onChange={(e) => setRegenInstructions(e.target.value)}
              rows={5}
              disabled={!!regeneratingField}
              placeholder={tf('e.g. Mention local raw materials, add 2 more workers, keep it under 80 words')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeRegenerateModal}
                disabled={!!regeneratingField}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-muted disabled:opacity-50"
              >
                {tf('Cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmRegenerate}
                disabled={!!regeneratingField || !regenInstructions.trim()}
                className="px-3 py-1.5 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
              >
                {regeneratingField ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {tf('Regenerating…')}
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
                    {tf('Regenerate')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      );

    if (!hasGenerated && !loading) {
      return (
        <>
          <div className="mb-4 p-4 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{tf('Fill this step with AI')}</p>
                  <p className="text-xs text-muted-foreground">
                    {tf('Suggests answers only for this step’s questions ({n}). Apply the ones you like.')
                      .replace('{n}', String(stepCatalogFields.length))}
                  </p>
                </div>
              </div>
              <button
                onClick={handleFillThisStep}
                disabled={loading || (currentStep > 1 && !hasPreviousData)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Sparkles className="h-4 w-4" />
                {tf('Fill this step')}
              </button>
            </div>
            <ul className="mt-3 text-xs text-muted-foreground list-disc pl-5 space-y-0.5">
              {stepCatalogFields.slice(0, 12).map((f) => (
                <li key={f.name}>{f.label}</li>
              ))}
              {stepCatalogFields.length > 12 && (
                <li>{tf('+{n} more').replace('{n}', String(stepCatalogFields.length - 12))}</li>
              )}
            </ul>
          </div>
          {regenModal}
        </>
      );
    }

    if (loading) {
      return (
        <div className="mb-4 p-4 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{tf('Getting suggestions…')}</p>
              <p className="text-xs text-muted-foreground">
                {fillProgress
                  ? tf('Suggesting {index}/{total}: {label}')
                      .replace('{index}', String(fillProgress.index))
                      .replace('{total}', String(fillProgress.total))
                      .replace('{label}', fillProgress.label)
                  : tf('Asking only this step’s catalog questions, one at a time.')}
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (hasGenerated && stepSuggestions.length === 0) {
      return (
        <>
          <div className="mb-4 p-4 bg-muted/50 border border-muted rounded-lg">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs">
                  {tf('No suggestions available. Try generating again or fill in more fields.')}
                </span>
              </div>
              <button
                onClick={handleFillThisStep}
                disabled={loading}
                className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {tf('Retry')}
              </button>
            </div>
          </div>
          {regenModal}
        </>
      );
    }

    return (
      <>
        <div className="mb-4 border border-primary/20 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
          <div className="flex items-center justify-between p-4 gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex-1 min-w-[12rem] flex items-center justify-between hover:bg-primary/10 transition-colors rounded-lg p-2 -m-2"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-semibold text-sm">{tf('AI Suggestions')}</span>
                <span className="text-xs text-muted-foreground">
                  ({stepSuggestions.length})
                </span>
              </div>
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFillThisStep}
                disabled={loading}
                className="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 disabled:opacity-50 transition-colors flex items-center gap-1"
                title={tf('Regenerate all suggestions for this step')}
              >
                <Sparkles className="h-3 w-3" />
                {tf('Fill this step')}
              </button>
              <button
                type="button"
                onClick={handleApplyAllStepSuggestions}
                disabled={loading || applyingAll || !stepSuggestions.length}
                className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                {applyingAll ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {tf('Applying...')}
                  </>
                ) : (
                  <>
                    <Check className="h-3 w-3" />
                    {tf('Apply All')}
                  </>
                )}
              </button>
            </div>
          </div>

          {expanded && (
            <div className="px-4 pb-4 space-y-3">
              {stepSuggestions.map((item) => {
                const isApplying = applyingFields.has(item.field);
                const isRegen = regeneratingField === item.field;
                return (
                  <div
                    key={item.field}
                    className="p-3 bg-white/50 rounded-lg border border-primary/10"
                  >
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-primary mb-1">{item.label}</p>
                        <SuggestionValue
                          text={
                            isNumericDprField(item.field)
                              ? (() => {
                                  const n = suggestionToFieldValue(item.field, item.suggestion);
                                  return n == null || n === '' ? item.suggestion : String(n);
                                })()
                              : item.suggestion
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleApplyStepSuggestion(item)}
                          disabled={isApplying || isRegen}
                          className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                        >
                          {isApplying ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              {tf('Applying...')}
                            </>
                          ) : (
                            <>
                              <Check className="h-3 w-3" />
                              {tf('Apply')}
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => openRegenerateModal(item)}
                          disabled={isApplying || !!regeneratingField}
                          className="px-3 py-1.5 text-xs bg-white border border-primary/30 text-primary rounded-lg hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                        >
                          <RefreshCw className="h-3 w-3" />
                          {tf('Regenerate')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {regenModal}
      </>
    );
  }

  if (!hasGenerated && !loading) {
    if (currentStep > 1 && !hasPreviousData) {
      return (
        <div className="mb-4 p-3 bg-muted/50 border border-muted rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs">{tf('Complete Step 1 first to get AI suggestions for this step.')}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-4 p-4 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Sparkles className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{tf('Get AI Suggestions')}</p>
              <p className="text-xs text-muted-foreground">
                {tf('Get contextual recommendations based on your previous step data')}
              </p>
            </div>
          </div>
          <button
            onClick={handleGenerateSuggestions}
            disabled={loading || (currentStep > 1 && !hasPreviousData)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Sparkles className="h-4 w-4" />
            {tf('Generate Suggestions')}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-center gap-2 text-primary">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">{tf('Generating AI suggestions based on previous steps...')}</span>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0 && hasGenerated) {
    return (
      <div className="mb-4 p-3 bg-muted/50 border border-muted rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs">{tf('No suggestions available. Try generating again or fill in more fields.')}</span>
          </div>
          <button
            onClick={handleGenerateSuggestions}
            disabled={loading}
            className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {tf('Retry')}
          </button>
        </div>
      </div>
    );
  }

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
              <span className="font-semibold text-sm">{tf('AI Suggestions')}</span>
              <span className="text-xs text-muted-foreground">
                ({suggestions.length} {tf(suggestions.length !== 1 ? 'suggestions' : 'suggestion')})
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
            title={tf('Regenerate suggestions')}
          >
            <Sparkles className="h-3 w-3" />
            {tf('Regenerate')}
          </button>
          <button
            onClick={handleApplyAllSuggestions}
            disabled={loading || applyingAll}
            className="ml-2 px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            title={tf('Apply all suggestions')}
          >
            {applyingAll ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                {tf('Applying...')}
              </>
            ) : (
              <>
                <Check className="h-3 w-3" />
                {tf('Apply All')}
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
                          {tf(fieldLabel(suggestion.field))}:
                        </p>
                      )}
                      <SuggestionValue
                        text={
                          typeof suggestion.suggestion === 'string'
                            ? suggestion.suggestion
                            : typeof suggestion.suggestion === 'object'
                              ? JSON.stringify(suggestion.suggestion)
                              : String(suggestion.suggestion || '')
                        }
                      />
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
                            {tf('Applying...')}
                          </>
                        ) : (
                          <>
                            <Check className="h-3 w-3" />
                            {tf('Apply')}
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
