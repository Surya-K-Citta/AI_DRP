// @ts-nocheck
import React from 'react';
import { useIndividualDPRStore } from '@/store/individualDPRStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, Loader2, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { AISuggestions } from '@/components/cluster-dpr/AISuggestions';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { FIELD_DESCRIPTIONS } from '@/data/fieldDescriptions';
import {
  VISHWAKARMA_CRAFTS,
  extraFieldsForScheme,
  hideComplexCapex,
  getStep18Uploads,
  showPmegpEducationGate,
  nayakWorkingCapital,
  showDscr,
  isMudraShishuKishore,
} from '@/lib/individualDpr/schemeFormConfig';
import { fillAllStepsWithAi, FillAllProgress, normalizeExtraValue } from '@/lib/individualDpr/fillAllStepsWithAi';

interface IndividualDPRFormProps {
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
}

export const IndividualDPRForm: React.FC<IndividualDPRFormProps> = ({
  currentStep,
  onNext,
  onPrevious,
}) => {
  const { data, setStepData, getStepData, setSchemeExtras, setCurrentStep } = useIndividualDPRStore();
  const schemeCode = data.matchedSchemeCode || null;
  const extraFieldNames = extraFieldsForScheme(schemeCode);
  const extras = data.schemeExtras || {};
  const updateExtras = (patch: Record<string, any>) => {
    const current = useIndividualDPRStore.getState().data.schemeExtras || {};
    setSchemeExtras({ ...current, ...patch });
  };
  const aiStore = {
    data,
    setStepData,
    getStepData,
    isIndividualDPR: true,
    contextHint: 'This is an individual entrepreneur unit (one firm), not a cluster or SPV.',
  };
  const aiExclude =
    currentStep === 1
      ? ['clusterName', 'location', 'district']
      : hideComplexCapex(schemeCode, data.ventureMatchAnswers?.budget) && currentStep === 12
        ? ['land', 'building', 'utilitiesAndInfrastructure', 'preliminaryAndPreOperative']
        : [];
  // Read step data directly from store to ensure reactivity
  // This will trigger re-renders when data is loaded from database
  const stepDataKey = `step${currentStep}` as keyof typeof data;
  const stepData = (data[stepDataKey] as any) || {};

  // State for Step 18 file uploads (must be at top level due to React hooks rules)
  const [uploadingFiles, setUploadingFiles] = React.useState<Record<string, boolean>>({});
  const [isFillingAll, setIsFillingAll] = React.useState(false);
  const [fillProgress, setFillProgress] = React.useState<FillAllProgress | null>(null);

  // Debug: Log when step data changes (reduced frequency)
  // React.useEffect(() => {
  //   console.log(`📋 Step ${currentStep} data loaded:`, {
  //     stepData,
  //     hasData: Object.keys(stepData).length > 0,
  //     keys: Object.keys(stepData),
  //     // For step 1, log all nested fields to debug
  //     ...(currentStep === 1 ? {
  //       enterpriseCount: stepData.enterpriseCount,
  //       ageOfEnterprises: stepData.ageOfEnterprises,
  //       employmentPerUnit: stepData.employmentPerUnit,
  //       investmentPerUnit: stepData.investmentPerUnit,
  //       turnoverPerUnit: stepData.turnoverPerUnit,
  //       marketServed: stepData.marketServed,
  //     } : {}),
  //   });
  // }, [currentStep, stepData, data]);

  // Helper function to render label with info icon
  const renderLabel = (fieldName: string, label: string, required: boolean = false) => {
    const stepKey = `step${currentStep}`;
    const stepDescriptions = FIELD_DESCRIPTIONS[stepKey] || {};
    const description = stepDescriptions[fieldName];

    return (
      <label className={`block text-sm font-medium mb-2 ${required ? '' : ''} flex items-center gap-2`}>
        {label}
        {required && <span className="text-red-500">*</span>}
        {description && (
          <InfoTooltip content={description} />
        )}
      </label>
    );
  };

  // Helper function to normalize array/string to array
  const normalizeToArray = (value: any): any[] => {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim()) {
      // Split by comma and clean up
      return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }
    return [];
  };

  // Helper function to normalize array/string to comma-separated string for display
  const normalizeToString = (value: any): string => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'string') {
      return value;
    }
    return '';
  };

  const handleInputChange = (field: string, value: any) => {
    if (extraFieldNames.includes(field) || ['craft', 'currentTools', 'newTools', 'covOrLor', 'upiQr', 'fssai', 'apiicPark'].includes(field)) {
      updateExtras({ [field]: normalizeExtraValue(field, value) });
      return;
    }
    const latestStepData = getStepData(currentStep) || {};
    let nextValue = value;
    if (field === 'startDate' || field === 'endDate') nextValue = toDateInputValue(value) || value;
    if (field === 'milestones') nextValue = normalizeMilestones(value);
    setStepData(currentStep, {
      ...latestStepData,
      [field]: nextValue,
    });
  };

  const handleGenerateAllSteps = async () => {
    if (!data.step1?.clusterName) {
      toast.error('Enter the unit / project name first so AI has something to write about.');
      return;
    }
    setIsFillingAll(true);
    setFillProgress({ step: 1, index: 1, total: 1 });
    try {
      const result = await fillAllStepsWithAi({
        data,
        setStepData,
        getStepData,
        setSchemeExtras,
        schemeCode,
        answers: data.ventureMatchAnswers,
        onProgress: setFillProgress,
      });
      if (result.filledSteps.length === 0) {
        toast.error('AI could not fill any steps. Try again after adding district and location.');
        return;
      }
      if (result.failedSteps.length) {
        toast.error(`Filled ${result.filledSteps.length} steps. Failed: ${result.failedSteps.join(', ')}.`);
      } else {
        toast.success(`Filled ${result.filledSteps.length} steps with AI. Review and edit as needed.`);
      }
      if (!['VISHWAKARMA', 'SVANIDHI', 'PMFME', 'AP_EDP'].includes(schemeCode || '')) {
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate all steps. Please try again.');
    } finally {
      setIsFillingAll(false);
      setFillProgress(null);
    }
  };

  // Handle comma-separated input fields (for array fields)
  const handleCommaSeparatedChange = (field: string, value: string) => {
    // Convert comma-separated string to array
    const arrayValue = normalizeToArray(value);
    setStepData(currentStep, {
      ...stepData,
      [field]: arrayValue,
    });
  };

  const handleArrayAdd = (field: string, newItem: any) => {
    const currentArray = Array.isArray(stepData[field]) ? stepData[field] : [];
    setStepData(currentStep, {
      ...stepData,
      [field]: [...currentArray, newItem],
    });
  };

  const handleArrayRemove = (field: string, index: number) => {
    const currentArray = Array.isArray(stepData[field]) ? stepData[field] : [];
    setStepData(currentStep, {
      ...stepData,
      [field]: currentArray.filter((_: any, i: number) => i !== index),
    });
  };

  const handleArrayUpdate = (field: string, index: number, updatedItem: any) => {
    const currentArray = Array.isArray(stepData[field]) ? stepData[field] : [];
    setStepData(currentStep, {
      ...stepData,
      [field]: currentArray.map((item: any, i: number) =>
        i === index ? { ...item, ...updatedItem } : item
      ),
    });
  };

  // Step 1: Executive Summary
  if (currentStep === 1) {
    const stepDescriptions = FIELD_DESCRIPTIONS.step1 || {};

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              Unit / Project Name *
              {stepDescriptions.clusterName && (
                <InfoTooltip content={stepDescriptions.clusterName} />
              )}
            </label>
            <Input
              value={stepData.clusterName || ''}
              onChange={(e) => handleInputChange('clusterName', e.target.value)}
              placeholder="Enter unit or project name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              District *
              {stepDescriptions.district && (
                <InfoTooltip content={stepDescriptions.district} />
              )}
            </label>
            <Input
              value={stepData.district || ''}
              onChange={(e) => handleInputChange('district', e.target.value)}
              placeholder="Enter district"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 flex items-center gap-2">
            Location *
            {stepDescriptions.location && (
              <InfoTooltip content={stepDescriptions.location} />
            )}
          </label>
          <Input
            value={stepData.location || ''}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="Village / town / industrial park"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              Nature of Business
              {stepDescriptions.natureOfBusiness && (
                <InfoTooltip content={stepDescriptions.natureOfBusiness} />
              )}
            </label>
            <Input
              value={stepData.natureOfBusiness || ''}
              onChange={(e) => handleInputChange('natureOfBusiness', e.target.value)}
              placeholder="Enter nature of business"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              Major Products
              {stepDescriptions.majorProducts && (
                <InfoTooltip content={stepDescriptions.majorProducts} />
              )}
            </label>
            <Input
              value={stepData.majorProducts || ''}
              onChange={(e) => handleInputChange('majorProducts', e.target.value)}
              placeholder="Enter major products"
            />
          </div>
        </div>

        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
          <p className="text-sm font-medium">Generate the rest of this DPR with AI</p>
          <p className="text-sm text-muted-foreground">
            Uses the unit name, district, and location to fill every visible step except document uploads. You can edit anything afterwards.
          </p>
          <Button
            type="button"
            onClick={handleGenerateAllSteps}
            disabled={isFillingAll}
            className="gap-2"
          >
            {isFillingAll ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isFillingAll && fillProgress
              ? `Filling step ${fillProgress.step} (${fillProgress.index} of ${fillProgress.total})…`
              : 'Generate all steps with AI'}
          </Button>
        </div>

        {schemeCode === 'VISHWAKARMA' && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">PM Vishwakarma details</h3>
            <div>
              <label className="block text-sm font-medium mb-2">Craft / trade</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={extras.craft || stepData.craft || ''}
                onChange={(e) => updateExtras({ craft: e.target.value })}
              >
                <option value="">Select your craft</option>
                {VISHWAKARMA_CRAFTS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Current tools</label>
              <textarea
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={extras.currentTools || stepData.currentTools || ''}
                onChange={(e) => updateExtras({ currentTools: e.target.value })}
                placeholder="Tools you use today"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">New tools needed (₹15,000 voucher)</label>
              <textarea
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={extras.newTools || stepData.newTools || ''}
                onChange={(e) => updateExtras({ newTools: e.target.value })}
                placeholder="Tools you want to buy with the voucher"
              />
            </div>
          </div>
        )}

        {schemeCode === 'SVANIDHI' && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">PM SVANidhi details</h3>
            <div>
              <label className="block text-sm font-medium mb-2">Vending proof</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={extras.covOrLor || stepData.covOrLor || ''}
                onChange={(e) => updateExtras({ covOrLor: e.target.value })}
              >
                <option value="">Select</option>
                <option value="cov">Certificate of Vending (CoV)</option>
                <option value="lor">Letter of Recommendation (LoR)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">UPI QR code</label>
              <Input
                value={extras.upiQr || stepData.upiQr || ''}
                onChange={(e) => updateExtras({ upiQr: e.target.value })}
                placeholder="UPI ID or QR details"
              />
            </div>
          </div>
        )}

        {schemeCode === 'PMFME' && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">FSSAI</h3>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={extras.fssai || stepData.fssai || ''}
              onChange={(e) => updateExtras({ fssai: e.target.value })}
            >
              <option value="">FSSAI status</option>
              <option value="yes">Already have FSSAI</option>
              <option value="planned">Will obtain / draft FSSAI</option>
            </select>
          </div>
        )}

        {schemeCode === 'AP_EDP' && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">APIIC industrial park</h3>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={extras.apiicPark || stepData.apiicPark || ''}
              onChange={(e) => updateExtras({ apiicPark: e.target.value })}
            >
              <option value="">Is the unit inside an APIIC park?</option>
              <option value="yes">Yes — land rebate may apply</option>
              <option value="no">No</option>
            </select>
          </div>
        )}

        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={currentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
      </div>
    );
  }

  // Step 2: Introduction & Sector Overview
  if (currentStep === 2) {
    return (
      <div className="space-y-6">
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={currentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div>
          {renderLabel('sectorType', 'Sector / Industry Type', true)}
          <Input
            value={stepData.sectorType || ''}
            onChange={(e) => handleInputChange('sectorType', e.target.value)}
            placeholder="Enter sector type"
          />
        </div>

        <div>
          {renderLabel('sectorDescription', 'Sector Description', true)}
          <textarea
            className="w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.sectorDescription || ''}
            onChange={(e) => handleInputChange('sectorDescription', e.target.value)}
            placeholder="Describe the sector in detail"
          />
        </div>

        <div>
          {renderLabel('nationalImportance', 'National Importance')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.nationalImportance || ''}
            onChange={(e) => handleInputChange('nationalImportance', e.target.value)}
            placeholder="Describe national importance"
          />
        </div>

        <div>
          {renderLabel('stateLevelImportance', 'State-level Importance')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.stateLevelImportance || ''}
            onChange={(e) => handleInputChange('stateLevelImportance', e.target.value)}
            placeholder="Describe state-level importance"
          />
        </div>

        <div>
          {renderLabel('keyProducts', 'Key Products')}
          <div className="space-y-2">
            {(Array.isArray(stepData.keyProducts) ? stepData.keyProducts : []).map((product: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={product}
                  onChange={(e) => {
                    const updated = [...(stepData.keyProducts || [])];
                    updated[index] = e.target.value;
                    handleInputChange('keyProducts', updated);
                  }}
                  placeholder="Enter product name"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleArrayRemove('keyProducts', index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleArrayAdd('keyProducts', '')}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: District & Regional Profile
  if (currentStep === 3) {
    return (
      <div className="space-y-6">
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={currentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div>
          {renderLabel('geography', 'Geography')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.geography || ''}
            onChange={(e) => handleInputChange('geography', e.target.value)}
            placeholder="Describe geography"
          />
        </div>
        <div>
          {renderLabel('climate', 'Climate')}
          <Input
            value={stepData.climate || ''}
            onChange={(e) => handleInputChange('climate', e.target.value)}
            placeholder="Enter climate details"
          />
        </div>
        <div>
          {renderLabel('infrastructure', 'Infrastructure')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.infrastructure || ''}
            onChange={(e) => handleInputChange('infrastructure', e.target.value)}
            placeholder="Describe infrastructure"
          />
        </div>
        <div>
          {renderLabel('keyEconomicActivities', 'Key Economic Activities')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.keyEconomicActivities || ''}
            onChange={(e) => handleInputChange('keyEconomicActivities', e.target.value)}
            placeholder="Describe key economic activities"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            {renderLabel('rawMaterialAvailability', 'Raw Material Availability')}
            <textarea
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={stepData.rawMaterialAvailability || ''}
              onChange={(e) => handleInputChange('rawMaterialAvailability', e.target.value)}
              placeholder="Describe raw material availability"
            />
          </div>
          <div>
            {renderLabel('rawMaterialQuantity', 'Raw Material Quantity')}
            <Input
              value={stepData.rawMaterialQuantity || ''}
              onChange={(e) => handleInputChange('rawMaterialQuantity', e.target.value)}
              placeholder="Enter quantity"
            />
          </div>
        </div>
        <div>
          {renderLabel('industrialInfrastructure', 'Industrial Infrastructure')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.industrialInfrastructure || ''}
            onChange={(e) => handleInputChange('industrialInfrastructure', e.target.value)}
            placeholder="Describe industrial infrastructure"
          />
        </div>
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-4">Connectivity</h3>
          <div className="space-y-4">
            <div>
              {renderLabel('connectivity', 'Road')}
              <Input
                value={stepData.connectivity?.road || ''}
                onChange={(e) => handleInputChange('connectivity', {
                  ...stepData.connectivity,
                  road: e.target.value,
                })}
                placeholder="Enter road connectivity details"
              />
            </div>
            <div>
              {renderLabel('connectivity', 'Rail')}
              <Input
                value={stepData.connectivity?.rail || ''}
                onChange={(e) => handleInputChange('connectivity', {
                  ...stepData.connectivity,
                  rail: e.target.value,
                })}
                placeholder="Enter rail connectivity details"
              />
            </div>
            <div>
              {renderLabel('connectivity', 'Port')}
              <Input
                value={stepData.connectivity?.port || ''}
                onChange={(e) => handleInputChange('connectivity', {
                  ...stepData.connectivity,
                  port: e.target.value,
                })}
                placeholder="Enter port connectivity details"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Cluster Profile
  if (currentStep === 4) {
    return (
      <div className="space-y-6">
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={currentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div>
          {renderLabel('yearOfEstablishment', 'Year of Establishment')}
          <Input
            type="number"
            value={stepData.yearOfEstablishment || ''}
            onChange={(e) => handleInputChange('yearOfEstablishment', parseInt(e.target.value) || 0)}
            placeholder="YYYY"
          />
        </div>
        <div>
          {renderLabel('clusterEvolution', 'How your unit evolved')}
          <textarea
            className="w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.clusterEvolution || ''}
            onChange={(e) => handleInputChange('clusterEvolution', e.target.value)}
            placeholder="Describe how the unit evolved"
          />
        </div>
        <div>
          {renderLabel('presentActivities', 'Present Activities')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.presentActivities || ''}
            onChange={(e) => handleInputChange('presentActivities', e.target.value)}
            placeholder="Describe present activities"
          />
        </div>
        <div>
          {renderLabel('typeOfUnits', 'Type of unit')}
          <Input
            value={stepData.typeOfUnits || ''}
            onChange={(e) => handleInputChange('typeOfUnits', e.target.value)}
            placeholder="Enter type of units"
          />
        </div>
        <div>
          {renderLabel('productionCapacity', 'Production Capacity')}
          <Input
            value={stepData.productionCapacity || ''}
            onChange={(e) => handleInputChange('productionCapacity', e.target.value)}
            placeholder="Enter production capacity"
          />
        </div>
        <div>
          {renderLabel('technologyLevel', 'Technology Level')}
          <Input
            value={stepData.technologyLevel || ''}
            onChange={(e) => handleInputChange('technologyLevel', e.target.value)}
            placeholder="Enter technology level"
          />
        </div>
        <div>
          {renderLabel('stakeholders', 'Stakeholders')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={normalizeToString(stepData.stakeholders)}
            onChange={(e) => handleCommaSeparatedChange('stakeholders', e.target.value)}
            placeholder="Enter stakeholders separated by commas (e.g., Stakeholder 1, Stakeholder 2, Stakeholder 3)"
          />
          <p className="text-xs text-muted-foreground mt-1">Separate multiple stakeholders with commas</p>
        </div>
      </div>
    );
  }

  // Step 5: Value Chain Details
  if (currentStep === 5) {
    return (
      <div className="space-y-6">
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={currentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div>
          {renderLabel('rawMaterials', 'Raw Materials')}
          <div className="space-y-4">
            {(Array.isArray(stepData.rawMaterials) ? stepData.rawMaterials : []).map((material: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Raw Material {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArrayRemove('rawMaterials', index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input
                    value={material.name || ''}
                    onChange={(e) => handleArrayUpdate('rawMaterials', index, { name: e.target.value })}
                    placeholder="Material name"
                  />
                  <Input
                    value={material.source || ''}
                    onChange={(e) => handleArrayUpdate('rawMaterials', index, { source: e.target.value })}
                    placeholder="Source"
                  />
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleArrayAdd('rawMaterials', { name: '', source: '' })}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Raw Material
            </Button>
          </div>
        </div>

        <div>
          {renderLabel('intermediateProducts', 'Intermediate Products')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={normalizeToString(stepData.intermediateProducts)}
            onChange={(e) => handleCommaSeparatedChange('intermediateProducts', e.target.value)}
            placeholder="Enter intermediate products separated by commas (e.g., Semi-finished Product 1, Semi-finished Product 2)"
          />
          <p className="text-xs text-muted-foreground mt-1">Separate multiple products with commas</p>
        </div>

        <div>
          {renderLabel('finalProducts', 'Final Products')}
          <div className="space-y-2">
            {(Array.isArray(stepData.finalProducts) ? stepData.finalProducts : []).map((product: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={product}
                  onChange={(e) => {
                    const updated = [...(stepData.finalProducts || [])];
                    updated[index] = e.target.value;
                    handleInputChange('finalProducts', updated);
                  }}
                  placeholder="Enter final product"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleArrayRemove('finalProducts', index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleArrayAdd('finalProducts', '')}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Final Product
            </Button>
          </div>
        </div>

        <div>
          {renderLabel('valueAdditionStages', 'Value Addition Stages')}
          <div className="space-y-4">
            {(Array.isArray(stepData.valueAdditionStages) ? stepData.valueAdditionStages : []).map((stage: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Stage {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArrayRemove('valueAdditionStages', index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input
                    value={stage.stage || ''}
                    onChange={(e) => handleArrayUpdate('valueAdditionStages', index, { stage: e.target.value })}
                    placeholder="Stage name"
                  />
                  <Input
                    type="number"
                    value={stage.sellingPrice || ''}
                    onChange={(e) => handleArrayUpdate('valueAdditionStages', index, { sellingPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="Selling price (₹ Lakhs)"
                  />
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleArrayAdd('valueAdditionStages', { stage: '', sellingPrice: 0 })}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Value Addition Stage
            </Button>
          </div>
        </div>

        <div>
          {renderLabel('majorBuyers', 'Major Buyers')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={normalizeToString(stepData.majorBuyers)}
            onChange={(e) => handleCommaSeparatedChange('majorBuyers', e.target.value)}
            placeholder="Enter major buyers separated by commas (e.g., Buyer 1, Buyer 2, Buyer 3)"
          />
          <p className="text-xs text-muted-foreground mt-1">Separate multiple buyers with commas</p>
        </div>
      </div>
    );
  }

  // Step 6: Market Assessment
  if (currentStep === 6) {
    return (
      <div className="space-y-6">
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={currentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div>
          {renderLabel('existingDemand', 'Existing Demand')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.existingDemand || ''}
            onChange={(e) => handleInputChange('existingDemand', e.target.value)}
            placeholder="Describe existing demand"
          />
        </div>
        <div>
          {renderLabel('demandSupplyGap', 'Demand-Supply Gap')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.demandSupplyGap || ''}
            onChange={(e) => handleInputChange('demandSupplyGap', e.target.value)}
            placeholder="Describe demand-supply gap"
          />
        </div>
        <div>
          {renderLabel('targetMarket', 'Target Market')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.targetMarket || ''}
            onChange={(e) => handleInputChange('targetMarket', e.target.value)}
            placeholder="Describe target market"
          />
        </div>
        <div>
          {renderLabel('competitorAnalysis', 'Competitor Analysis')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.competitorAnalysis || ''}
            onChange={(e) => handleInputChange('competitorAnalysis', e.target.value)}
            placeholder="Describe competitor analysis"
          />
        </div>
        <div>
          {renderLabel('priceTrends', 'Price Trends')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.priceTrends || ''}
            onChange={(e) => handleInputChange('priceTrends', e.target.value)}
            placeholder="Describe price trends"
          />
        </div>
        <div>
          {renderLabel('exportPotential', 'Export Potential')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.exportPotential || ''}
            onChange={(e) => handleInputChange('exportPotential', e.target.value)}
            placeholder="Describe export potential"
          />
        </div>
      </div>
    );
  }

  // Step 7: Gap Analysis
  if (currentStep === 7) {
    return (
      <div className="space-y-6">
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={currentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div>
          {renderLabel('technologyGaps', 'Technology Gaps')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.technologyGaps || ''}
            onChange={(e) => handleInputChange('technologyGaps', e.target.value)}
            placeholder="Describe technology gaps"
          />
        </div>
        <div>
          {renderLabel('infrastructureGaps', 'Infrastructure Gaps')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.infrastructureGaps || ''}
            onChange={(e) => handleInputChange('infrastructureGaps', e.target.value)}
            placeholder="Describe infrastructure gaps"
          />
        </div>
        <div>
          {renderLabel('skillGaps', 'Skill Gaps')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.skillGaps || ''}
            onChange={(e) => handleInputChange('skillGaps', e.target.value)}
            placeholder="Describe skill gaps"
          />
        </div>
        <div>
          {renderLabel('marketingGaps', 'Marketing Gaps')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.marketingGaps || ''}
            onChange={(e) => handleInputChange('marketingGaps', e.target.value)}
            placeholder="Describe marketing gaps"
          />
        </div>
        <div>
          {renderLabel('financialGaps', 'Financial Gaps')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.financialGaps || ''}
            onChange={(e) => handleInputChange('financialGaps', e.target.value)}
            placeholder="Describe financial gaps"
          />
        </div>
        <div>
          {renderLabel('justificationForIntervention', 'Justification for Intervention')}
          <textarea
            className="w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.justificationForIntervention || ''}
            onChange={(e) => handleInputChange('justificationForIntervention', e.target.value)}
            placeholder="Provide justification for intervention"
          />
        </div>
      </div>
    );
  }

  // Step 8: SWOT Analysis
  if (currentStep === 8) {
    return (
      <div className="space-y-6">
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={currentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div>
          {renderLabel('strengths', 'Strengths')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={normalizeToString(stepData.strengths)}
            onChange={(e) => handleCommaSeparatedChange('strengths', e.target.value)}
            placeholder="Enter strengths separated by commas (e.g., Strong market presence, Skilled workforce, Good infrastructure)"
          />
          <p className="text-xs text-muted-foreground mt-1">Separate multiple strengths with commas</p>
        </div>
        <div>
          {renderLabel('weaknesses', 'Weaknesses')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={normalizeToString(stepData.weaknesses)}
            onChange={(e) => handleCommaSeparatedChange('weaknesses', e.target.value)}
            placeholder="Enter weaknesses separated by commas (e.g., Limited technology, Lack of skilled workers, Poor infrastructure)"
          />
          <p className="text-xs text-muted-foreground mt-1">Separate multiple weaknesses with commas</p>
        </div>
        <div>
          {renderLabel('opportunities', 'Opportunities')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={normalizeToString(stepData.opportunities)}
            onChange={(e) => handleCommaSeparatedChange('opportunities', e.target.value)}
            placeholder="Enter opportunities separated by commas (e.g., Growing market demand, Government support, Export potential)"
          />
          <p className="text-xs text-muted-foreground mt-1">Separate multiple opportunities with commas</p>
        </div>
        <div>
          {renderLabel('threats', 'Threats')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={normalizeToString(stepData.threats)}
            onChange={(e) => handleCommaSeparatedChange('threats', e.target.value)}
            placeholder="Enter threats separated by commas (e.g., Market competition, Price fluctuations, Regulatory changes)"
          />
          <p className="text-xs text-muted-foreground mt-1">Separate multiple threats with commas</p>
        </div>
      </div>
    );
  }

  // Step 9: Proposed Interventions
  if (currentStep === 9) {
    return (
      <div className="space-y-6">
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={currentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div>
          {renderLabel('interventionType', 'Intervention Type', true)}
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.interventionType || ''}
            onChange={(e) => handleInputChange('interventionType', e.target.value)}
          >
            <option value="">Select type</option>
            <option value="Hard">Hard</option>
            <option value="Soft">Soft</option>
            <option value="Both">Both</option>
          </select>
        </div>
        <div>
          {renderLabel('description', 'Description')}
          <textarea
            className="w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe the intervention"
          />
        </div>
        <div>
          {renderLabel('objectives', 'Objectives')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={normalizeToString(stepData.objectives)}
            onChange={(e) => handleCommaSeparatedChange('objectives', e.target.value)}
            placeholder="Enter objectives separated by commas (e.g., Objective 1, Objective 2, Objective 3)"
          />
          <p className="text-xs text-muted-foreground mt-1">Separate multiple objectives with commas</p>
        </div>
        <div>
          {renderLabel('expectedBenefits', 'Expected Benefits')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={normalizeToString(stepData.expectedBenefits)}
            onChange={(e) => handleCommaSeparatedChange('expectedBenefits', e.target.value)}
            placeholder="Enter expected benefits separated by commas (e.g., Benefit 1, Benefit 2, Benefit 3)"
          />
          <p className="text-xs text-muted-foreground mt-1">Separate multiple benefits with commas</p>
        </div>
      </div>
    );
  }

  // Step 10: Common Facility Centre (CFC) Details
  if (currentStep === 10) {
    return (
      <div className="space-y-6">
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={currentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            {renderLabel('name', 'Unit / shed / workplace name', true)}
            <Input
              value={stepData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter workplace or shed name"
            />
          </div>
          <div>
            {renderLabel('location', 'Location', true)}
            <Input
              value={stepData.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Enter location"
            />
          </div>
        </div>
        <div>
          {renderLabel('landDetails', 'Land Details')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.landDetails || ''}
            onChange={(e) => handleInputChange('landDetails', e.target.value)}
            placeholder="Enter land details"
          />
        </div>
        <div>
          {renderLabel('civilWorks', 'Civil Works')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.civilWorks || ''}
            onChange={(e) => handleInputChange('civilWorks', e.target.value)}
            placeholder="Describe civil works"
          />
        </div>
        <div>
          {renderLabel('manufacturingProcess', 'Manufacturing Process')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.manufacturingProcess || ''}
            onChange={(e) => handleInputChange('manufacturingProcess', e.target.value)}
            placeholder="Describe manufacturing process"
          />
        </div>
        <div>
          {renderLabel('plantAndMachinery', 'Plant & Machinery')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.plantAndMachinery || ''}
            onChange={(e) => handleInputChange('plantAndMachinery', e.target.value)}
            placeholder="Describe plant & machinery"
          />
        </div>
        <div>
          {renderLabel('capacity', 'Capacity')}
          <Input
            value={stepData.capacity || ''}
            onChange={(e) => handleInputChange('capacity', e.target.value)}
            placeholder="Enter capacity"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            {renderLabel('powerRequirements', 'Power Requirements')}
            <Input
              value={stepData.powerRequirements || ''}
              onChange={(e) => handleInputChange('powerRequirements', e.target.value)}
              placeholder="Enter power requirements"
            />
          </div>
          <div>
            {renderLabel('waterRequirements', 'Water Requirements')}
            <Input
              value={stepData.waterRequirements || ''}
              onChange={(e) => handleInputChange('waterRequirements', e.target.value)}
              placeholder="Enter water requirements"
            />
          </div>
          <div>
            {renderLabel('manpowerRequirements', 'Manpower Requirements')}
            <Input
              value={stepData.manpowerRequirements || ''}
              onChange={(e) => handleInputChange('manpowerRequirements', e.target.value)}
              placeholder="Enter manpower requirements"
            />
          </div>
        </div>
      </div>
    );
  }

  // Step 11: SPV Details
  if (currentStep === 11) {
    return (
      <div className="space-y-6">
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={currentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            {renderLabel('spvName', 'Applicant / firm name', true)}
            <Input
              value={stepData.spvName || ''}
              onChange={(e) => handleInputChange('spvName', e.target.value)}
              placeholder="Enter applicant or firm name"
            />
          </div>
          <div>
            {renderLabel('legalStatus', 'Legal Status')}
            <Input
              value={stepData.legalStatus || ''}
              onChange={(e) => handleInputChange('legalStatus', e.target.value)}
              placeholder="Enter legal status"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            {renderLabel('yearOfIncorporation', 'Year of establishment')}
            <Input
              type="number"
              value={stepData.yearOfIncorporation || ''}
              onChange={(e) => handleInputChange('yearOfIncorporation', parseInt(e.target.value) || 0)}
              placeholder="YYYY"
            />
          </div>
          <div>
            {renderLabel('submittedTo', 'Submitted To')}
            <Input
              value={stepData.submittedTo || ''}
              onChange={(e) => handleInputChange('submittedTo', e.target.value)}
              placeholder="e.g., DIC, District"
            />
          </div>
        </div>
        <div>
          {renderLabel('objectives', 'Objectives')}
          <div className="space-y-2">
            {(Array.isArray(stepData.objectives) ? stepData.objectives : []).map((objective: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={objective}
                  onChange={(e) => {
                    const updated = [...(stepData.objectives || [])];
                    updated[index] = e.target.value;
                    handleInputChange('objectives', updated);
                  }}
                  placeholder="Enter objective"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleArrayRemove('objectives', index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleArrayAdd('objectives', '')}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Objective
            </Button>
          </div>
        </div>
        <div>
          {renderLabel('boardOfDirectors', 'Owner(s)')}
          <textarea
            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={
              Array.isArray(stepData.boardOfDirectors)
                ? stepData.boardOfDirectors.map((d: any) => d?.name).filter(Boolean).join(', ')
                : (stepData.owners || '')
            }
            onChange={(e) => {
              const names = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
              const latest = getStepData(currentStep) || {};
              setStepData(currentStep, {
                ...latest,
                owners: e.target.value,
                boardOfDirectors: names.map((name) => ({ name, designation: 'Owner' })),
              });
            }}
            placeholder="Owner names, separated by commas"
          />
        </div>
      </div>
    );
  }

  // Step 12: Project Cost Details
  if (currentStep === 12) {
    const simpleCapex = hideComplexCapex(schemeCode, data.ventureMatchAnswers?.budget);
    const keepFci = schemeCode === 'AP_EDP';
    const showHeavy = keepFci || !simpleCapex;
    const totalCost = (stepData.land || 0) +
      (stepData.building || 0) +
      (stepData.machinery || 0) +
      (stepData.utilitiesAndInfrastructure || 0) +
      (stepData.preliminaryAndPreOperative || 0) +
      (stepData.workingCapitalMargin || 0);

    return (
      <div className="space-y-6">
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={currentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        {simpleCapex && (
          <p className="text-sm text-muted-foreground">
            Heavy capex tables are hidden for Mudra Shishu / Kishore. Enter machinery and working-capital margin only.
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {showHeavy && (
            <>
              <div>
                {renderLabel('land', 'Land / FCI land (₹ Lakhs)')}
                <Input
                  type="number"
                  value={stepData.land || ''}
                  onChange={(e) => handleInputChange('land', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div>
                {renderLabel('building', 'Building / shed (₹ Lakhs)')}
                <Input
                  type="number"
                  value={stepData.building || ''}
                  onChange={(e) => handleInputChange('building', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </>
          )}
          <div>
            {renderLabel('machinery', 'Plant & machinery (₹ Lakhs)')}
            <Input
              type="number"
              value={stepData.machinery || ''}
              onChange={(e) => handleInputChange('machinery', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          {showHeavy && (
            <>
              <div>
                {renderLabel('utilitiesAndInfrastructure', 'Utilities & Infrastructure (₹ Lakhs)')}
                <Input
                  type="number"
                  value={stepData.utilitiesAndInfrastructure || ''}
                  onChange={(e) => handleInputChange('utilitiesAndInfrastructure', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div>
                {renderLabel('preliminaryAndPreOperative', 'Preliminary & Pre-operative (₹ Lakhs)')}
                <Input
                  type="number"
                  value={stepData.preliminaryAndPreOperative || ''}
                  onChange={(e) => handleInputChange('preliminaryAndPreOperative', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </>
          )}
          <div>
            {renderLabel('workingCapitalMargin', 'Working Capital Margin (₹ Lakhs)')}
            <Input
              type="number"
              value={stepData.workingCapitalMargin || ''}
              onChange={(e) => handleInputChange('workingCapitalMargin', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
        </div>
        <div className="border-t pt-4">
          <div className="bg-primary/10 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Total Project Cost</span>
              <span className="text-2xl font-bold text-primary">₹ {totalCost.toLocaleString('en-IN')} Lakhs</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 13: Means of Finance
  if (currentStep === 13) {
    const total = (stepData.spvContribution || 0) +
      (stepData.governmentGrant || 0) +
      (stepData.bankLoan || 0) +
      (stepData.otherSources || 0);

    return (
      <div className="space-y-6">
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={currentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            {renderLabel('spvContribution', 'Promoter contribution / equity (₹ Lakhs)')}
            <Input
              type="number"
              value={stepData.spvContribution || ''}
              onChange={(e) => handleInputChange('spvContribution', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            {renderLabel('governmentGrant', 'Government Grant (₹ Lakhs)')}
            <Input
              type="number"
              value={stepData.governmentGrant || ''}
              onChange={(e) => handleInputChange('governmentGrant', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            {renderLabel('bankLoan', 'Bank Loan (₹ Lakhs)')}
            <Input
              type="number"
              value={stepData.bankLoan || ''}
              onChange={(e) => handleInputChange('bankLoan', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            {renderLabel('otherSources', 'Other Sources (₹ Lakhs)')}
            <Input
              type="number"
              value={stepData.otherSources || ''}
              onChange={(e) => handleInputChange('otherSources', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
        </div>
        <div className="border-t pt-4">
          <div className="bg-primary/10 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Total Finance</span>
              <span className="text-2xl font-bold text-primary">₹ {total.toLocaleString('en-IN')} Lakhs</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 14: Operating Cost & Revenue
  if (currentStep === 14) {
    return (
      <div className="space-y-6">
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={currentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            {renderLabel('rawMaterialCost', 'Raw Material Cost (₹ Lakhs)')}
            <Input
              type="number"
              value={stepData.rawMaterialCost || ''}
              onChange={(e) => handleInputChange('rawMaterialCost', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            {renderLabel('powerCost', 'Power Cost (₹ Lakhs)')}
            <Input
              type="number"
              value={stepData.powerCost || ''}
              onChange={(e) => handleInputChange('powerCost', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            {renderLabel('wages', 'Wages (₹ Lakhs)')}
            <Input
              type="number"
              value={stepData.wages || ''}
              onChange={(e) => handleInputChange('wages', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            {renderLabel('maintenance', 'Maintenance (₹ Lakhs)')}
            <Input
              type="number"
              value={stepData.maintenance || ''}
              onChange={(e) => handleInputChange('maintenance', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            {renderLabel('administrativeExpenses', 'Administrative Expenses (₹ Lakhs)')}
            <Input
              type="number"
              value={stepData.administrativeExpenses || ''}
              onChange={(e) => handleInputChange('administrativeExpenses', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            {renderLabel('marketingExpenses', 'Marketing Expenses (₹ Lakhs)')}
            <Input
              type="number"
              value={stepData.marketingExpenses || ''}
              onChange={(e) => handleInputChange('marketingExpenses', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            {renderLabel('annualProductionVolume', 'Annual Production Volume')}
            <Input
              type="number"
              value={stepData.annualProductionVolume || ''}
              onChange={(e) => handleInputChange('annualProductionVolume', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            {renderLabel('annualSalesRealization', 'Annual Sales Realization (₹ Lakhs)')}
            <Input
              type="number"
              value={stepData.annualSalesRealization || ''}
              onChange={(e) => handleInputChange('annualSalesRealization', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
        </div>
      </div>
    );
  }

  // Step 15: Financial Viability
  if (currentStep === 15) {
    const step12 = data.step12 || {};
    const step13 = data.step13 || {};
    const step14 = data.step14 || {};
    const cost = (step12.land || 0) + (step12.building || 0) + (step12.machinery || 0) +
      (step12.utilitiesAndInfrastructure || 0) + (step12.preliminaryAndPreOperative || 0) +
      (step12.workingCapitalMargin || 0);
    const finance = (step13.spvContribution || 0) + (step13.governmentGrant || 0) +
      (step13.bankLoan || 0) + (step13.otherSources || 0);
    const loan = step13.bankLoan || 0;
    const years = stepData.yearProjections?.length
      ? stepData.yearProjections
      : [1, 2, 3, 4, 5].map((year) => ({
          year,
          sales: year === 1 ? (step14.annualSalesRealization || 0) : 0,
          rm: year === 1 ? (step14.rawMaterialCost || 0) : 0,
          wages: year === 1 ? (step14.wages || 0) : 0,
          power: year === 1 ? (step14.powerCost || 0) : 0,
          netProfit: 0,
        }));
    const updateYear = (index: number, field: string, value: number) => {
      const next = years.map((row: any, i: number) => (i === index ? { ...row, [field]: value } : row));
      handleInputChange('yearProjections', next);
    };
    const annualEmi = loan > 0
      ? (loan * 0.12 * Math.pow(1.12, 7)) / (Math.pow(1.12, 7) - 1)
      : 0;
    const dep = ((step12.machinery || 0) + (step12.building || 0)) * 0.1;
    const dscrs = years.map((row: any) => {
      const np = row.netProfit || 0;
      return annualEmi > 0 ? (np + dep) / annualEmi : 0;
    });
    const avgDscr = dscrs.length ? dscrs.reduce((a: number, b: number) => a + b, 0) / dscrs.length : 0;
    const turnover = extras.projectedTurnover || step14.annualSalesRealization || 0;
    const nayak = nayakWorkingCapital(turnover);
    const mudraSimple = isMudraShishuKishore(schemeCode, data.ventureMatchAnswers?.budget);

    return (
      <div className="space-y-6">
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={currentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Project cost</p>
            <p className="text-xl font-semibold">₹ {cost.toLocaleString('en-IN')} Lakhs</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Equity + loan + other</p>
            <p className="text-xl font-semibold">₹ {finance.toLocaleString('en-IN')} Lakhs</p>
          </div>
        </div>
        {mudraSimple && (
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-semibold">Mudra Nayak working capital</h4>
            <label className="block text-sm font-medium">Projected annual turnover (₹ Lakhs)</label>
            <Input
              type="number"
              value={turnover || ''}
              onChange={(e) => updateExtras({ projectedTurnover: parseFloat(e.target.value) || 0 })}
            />
            <p className="text-sm">WC limit (20%): <strong>₹ {nayak.limit.toFixed(2)} Lakhs</strong></p>
            <p className="text-sm">Promoter margin (5% of WC): <strong>₹ {nayak.margin.toFixed(2)} Lakhs</strong></p>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-muted">
                <th className="p-2 text-left">Year</th>
                <th className="p-2">Sales</th>
                <th className="p-2">RM</th>
                <th className="p-2">Wages</th>
                <th className="p-2">Power</th>
                <th className="p-2">Net profit</th>
              </tr>
            </thead>
            <tbody>
              {years.map((row: any, index: number) => (
                <tr key={row.year} className="border-t">
                  <td className="p-2">{row.year}</td>
                  {['sales', 'rm', 'wages', 'power', 'netProfit'].map((field) => (
                    <td key={field} className="p-1">
                      <Input
                        type="number"
                        value={row[field] || ''}
                        onChange={(e) => updateYear(index, field, parseFloat(e.target.value) || 0)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          {renderLabel('breakEvenPoint', 'Break-even (capacity %)')}
          <Input
            type="number"
            value={stepData.breakEvenPoint || ''}
            onChange={(e) => handleInputChange('breakEvenPoint', parseFloat(e.target.value) || 0)}
            placeholder="e.g. 55"
          />
        </div>
        {showDscr(loan) && (
          <div className={`p-4 rounded-lg border ${avgDscr < 1.5 ? 'border-amber-400 bg-amber-50' : 'border-border'}`}>
            <p className="font-semibold">DSCR (profit + depreciation vs EMI)</p>
            <p className="text-sm text-muted-foreground mt-1">
              Assumed 7-year term at 12%. Average DSCR: <strong>{avgDscr.toFixed(2)}</strong>
              {avgDscr < 1.5 ? ' — below 1.5; lenders may query this.' : ''}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Step 16: Implementation
  if (currentStep === 16) {
    const milestoneRows = normalizeMilestones(stepData.milestones).length
      ? normalizeMilestones(stepData.milestones)
      : [
          { activity: 'Machinery order / installation', timeRequired: '', startDate: '', endDate: '' },
          { activity: 'Power connection', timeRequired: '', startDate: '', endDate: '' },
          { activity: 'Trial run', timeRequired: '', startDate: '', endDate: '' },
        ];

    return (
      <div className="space-y-6">
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={currentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div>
          {renderLabel('startDate', 'Commercial production date (CoD)')}
          <Input
            type="date"
            value={toDateInputValue(stepData.startDate)}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
          />
        </div>
        <div>
          {renderLabel('milestones', 'Milestones')}
          <div className="space-y-4">
            {milestoneRows.map((milestone: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <Input
                  value={milestone.activity || ''}
                  onChange={(e) => {
                    const next = milestoneRows.map((m: any, i: number) =>
                      i === index ? { ...m, activity: e.target.value } : m
                    );
                    handleInputChange('milestones', next);
                  }}
                  placeholder="Activity"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={toDateInputValue(milestone.startDate)}
                    onChange={(e) => {
                      const next = milestoneRows.map((m: any, i: number) =>
                        i === index ? { ...m, startDate: e.target.value } : m
                      );
                      handleInputChange('milestones', next);
                    }}
                  />
                  <Input
                    type="date"
                    value={toDateInputValue(milestone.endDate)}
                    onChange={(e) => {
                      const next = milestoneRows.map((m: any, i: number) =>
                        i === index ? { ...m, endDate: e.target.value } : m
                      );
                      handleInputChange('milestones', next);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 17: Expected impact
  if (currentStep === 17) {
    return (
      <div className="space-y-6">
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={currentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            {renderLabel('employmentGeneration', 'Direct employment (count)')}
            <Input
              type="number"
              value={stepData.employmentGeneration || ''}
              onChange={(e) => handleInputChange('employmentGeneration', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            {renderLabel('turnoverGrowth', 'Expected annual turnover (₹ Lakhs)')}
            <Input
              type="number"
              value={stepData.turnoverGrowth || ''}
              onChange={(e) => handleInputChange('turnoverGrowth', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>
    );
  }

  // Step 18: Uploads
  if (currentStep === 18) {
    const handleFileChange = async (field: string, file: File | null) => {
      if (file) {
        setUploadingFiles((prev) => ({ ...prev, [field]: true }));
        try {
          const uploadResult = await api.uploadClusterDPRDocument(file);
          if (uploadResult.success && uploadResult.data?.documentUrl) {
            handleInputChange(field, uploadResult.data.documentUrl);
            toast.success(`${file.name} uploaded successfully!`);
          } else {
            toast.error(uploadResult.message || 'Failed to upload document');
            handleInputChange(field, file.name);
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to upload document');
          handleInputChange(field, file.name);
        } finally {
          setUploadingFiles((prev) => ({ ...prev, [field]: false }));
        }
      }
    };

    const getDisplayName = (urlOrName: string): string => {
      if (urlOrName.startsWith('http://') || urlOrName.startsWith('https://')) {
        const urlParts = urlOrName.split('/');
        return urlParts[urlParts.length - 1] || urlOrName;
      }
      return urlOrName;
    };

    const step12 = data.step12 || {};
    const totalCost = (step12.land || 0) + (step12.building || 0) + (step12.machinery || 0) +
      (step12.utilitiesAndInfrastructure || 0) + (step12.preliminaryAndPreOperative || 0) +
      (step12.workingCapitalMargin || 0);
    const uploads = getStep18Uploads(schemeCode, data.ventureMatchAnswers);
    const needEdu = showPmegpEducationGate(schemeCode, data.ventureMatchAnswers?.activity, totalCost);

    return (
      <div className="space-y-6">
        {uploads.map((item) => (
          <div key={item.id}>
            {renderLabel(item.id, item.label)}
            <div className="relative">
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange(item.id, e.target.files?.[0] || null)}
                disabled={uploadingFiles[item.id]}
              />
              {uploadingFiles[item.id] && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
            </div>
            {stepData[item.id] && (
              <p className="text-sm text-green-600 mt-1">✓ Uploaded: {getDisplayName(stepData[item.id])}</p>
            )}
          </div>
        ))}
        {needEdu && (
          <div>
            {renderLabel('educationCertificate', '8th-pass / education certificate')}
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange('educationCertificate', e.target.files?.[0] || null)}
            />
            {stepData.educationCertificate && (
              <p className="text-sm text-green-600 mt-1">✓ Uploaded: {getDisplayName(stepData.educationCertificate)}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Step {currentStep} form implementation in progress. Please check back soon.
      </p>
    </div>
  );
};
