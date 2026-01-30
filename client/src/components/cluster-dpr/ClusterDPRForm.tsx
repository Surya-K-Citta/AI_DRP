// @ts-nocheck
import React from 'react';
import { useClusterDPRStore } from '@/store/clusterDPRStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { AISuggestions } from './AISuggestions';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { FIELD_DESCRIPTIONS } from '@/data/fieldDescriptions';
import { FinancialStatements } from './FinancialStatements';

interface ClusterDPRFormProps {
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
}

export const ClusterDPRForm: React.FC<ClusterDPRFormProps> = ({
  currentStep,
  onNext,
  onPrevious,
}) => {
  const { data, setStepData, getStepData } = useClusterDPRStore();
  // Read step data directly from store to ensure reactivity
  // This will trigger re-renders when data is loaded from database
  const stepDataKey = `step${currentStep}` as keyof typeof data;
  const stepData = (data[stepDataKey] as any) || {};

  // State for Step 18 file uploads (must be at top level due to React hooks rules)
  const [uploadingFiles, setUploadingFiles] = React.useState<Record<string, boolean>>({});

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
    // Get the latest stepData from store to avoid stale data
    const latestStepData = getStepData(currentStep) || {};
    setStepData(currentStep, {
      ...latestStepData,
      [field]: value,
    });
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
              Cluster Name *
              {stepDescriptions.clusterName && (
                <InfoTooltip content={stepDescriptions.clusterName} />
              )}
            </label>
            <Input
              value={stepData.clusterName || ''}
              onChange={(e) => handleInputChange('clusterName', e.target.value)}
              placeholder="Enter cluster name"
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
            placeholder="Enter location"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 flex items-center gap-2">
            Geographical Spread
            {stepDescriptions.geographicalSpread && (
              <InfoTooltip content={stepDescriptions.geographicalSpread} />
            )}
          </label>
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.geographicalSpread || ''}
            onChange={(e) => handleInputChange('geographicalSpread', e.target.value)}
            placeholder="Describe geographical spread"
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

        {/* AI Suggestions - appears above Enterprise Count, uses above fields as context to generate below fields */}
        <AISuggestions
          currentStep={currentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
          excludeFields={['clusterName', 'location', 'district', 'geographicalSpread', 'natureOfBusiness', 'majorProducts']}
        />

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-4">Enterprise Count</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              {renderLabel('enterpriseCount', 'Micro')}
              <Input
                type="number"
                value={stepData.enterpriseCount?.micro || ''}
                onChange={(e) => handleInputChange('enterpriseCount', {
                  ...stepData.enterpriseCount,
                  micro: parseInt(e.target.value) || 0,
                })}
                placeholder="0"
              />
            </div>
            <div>
              {renderLabel('enterpriseCount', 'Small')}
              <Input
                type="number"
                value={stepData.enterpriseCount?.small || ''}
                onChange={(e) => handleInputChange('enterpriseCount', {
                  ...stepData.enterpriseCount,
                  small: parseInt(e.target.value) || 0,
                })}
                placeholder="0"
              />
            </div>
            <div>
              {renderLabel('enterpriseCount', 'Medium')}
              <Input
                type="number"
                value={stepData.enterpriseCount?.medium || ''}
                onChange={(e) => handleInputChange('enterpriseCount', {
                  ...stepData.enterpriseCount,
                  medium: parseInt(e.target.value) || 0,
                })}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-4">Age of Enterprises</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              {renderLabel('ageOfEnterprises', '< 5 years')}
              <Input
                type="number"
                value={stepData.ageOfEnterprises?.lessThan5 || ''}
                onChange={(e) => handleInputChange('ageOfEnterprises', {
                  ...stepData.ageOfEnterprises,
                  lessThan5: parseInt(e.target.value) || 0,
                })}
                placeholder="0"
              />
            </div>
            <div>
              {renderLabel('ageOfEnterprises', '5-10 years')}
              <Input
                type="number"
                value={stepData.ageOfEnterprises?.between5And10 || ''}
                onChange={(e) => handleInputChange('ageOfEnterprises', {
                  ...stepData.ageOfEnterprises,
                  between5And10: parseInt(e.target.value) || 0,
                })}
                placeholder="0"
              />
            </div>
            <div>
              {renderLabel('ageOfEnterprises', '> 10 years')}
              <Input
                type="number"
                value={stepData.ageOfEnterprises?.moreThan10 || ''}
                onChange={(e) => handleInputChange('ageOfEnterprises', {
                  ...stepData.ageOfEnterprises,
                  moreThan10: parseInt(e.target.value) || 0,
                })}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-4">Employment per Unit</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              {renderLabel('employmentPerUnit', '< 5 employees')}
              <Input
                type="number"
                value={stepData.employmentPerUnit?.lessThan5 || ''}
                onChange={(e) => handleInputChange('employmentPerUnit', {
                  ...stepData.employmentPerUnit,
                  lessThan5: parseInt(e.target.value) || 0,
                })}
                placeholder="0"
              />
            </div>
            <div>
              {renderLabel('employmentPerUnit', '5-10 employees')}
              <Input
                type="number"
                value={stepData.employmentPerUnit?.between5And10 || ''}
                onChange={(e) => handleInputChange('employmentPerUnit', {
                  ...stepData.employmentPerUnit,
                  between5And10: parseInt(e.target.value) || 0,
                })}
                placeholder="0"
              />
            </div>
            <div>
              {renderLabel('employmentPerUnit', '> 10 employees')}
              <Input
                type="number"
                value={stepData.employmentPerUnit?.moreThan10 || ''}
                onChange={(e) => handleInputChange('employmentPerUnit', {
                  ...stepData.employmentPerUnit,
                  moreThan10: parseInt(e.target.value) || 0,
                })}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            {renderLabel('investmentPerUnit', 'Investment per Unit (₹ Lakhs)')}
            <Input
              type="number"
              value={stepData.investmentPerUnit || ''}
              onChange={(e) => handleInputChange('investmentPerUnit', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            {renderLabel('turnoverPerUnit', 'Turnover per Unit (₹ Lakhs)')}
            <Input
              type="number"
              value={stepData.turnoverPerUnit || ''}
              onChange={(e) => handleInputChange('turnoverPerUnit', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-4">Market Served (%)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              {renderLabel('marketServed', 'Domestic')}
              <Input
                type="number"
                min="0"
                max="100"
                value={stepData.marketServed?.domestic || ''}
                onChange={(e) => handleInputChange('marketServed', {
                  ...stepData.marketServed,
                  domestic: parseFloat(e.target.value) || 0,
                })}
                placeholder="0"
              />
            </div>
            <div>
              {renderLabel('marketServed', 'Export')}
              <Input
                type="number"
                min="0"
                max="100"
                value={stepData.marketServed?.export || ''}
                onChange={(e) => handleInputChange('marketServed', {
                  ...stepData.marketServed,
                  export: parseFloat(e.target.value) || 0,
                })}
                placeholder="0"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Introduction & Sector Overview
  if (currentStep === 2) {
    return (
      <div className="space-y-6">
        <AISuggestions
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
          {renderLabel('clusterEvolution', 'Cluster Evolution')}
          <textarea
            className="w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.clusterEvolution || ''}
            onChange={(e) => handleInputChange('clusterEvolution', e.target.value)}
            placeholder="Describe cluster evolution"
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
          {renderLabel('typeOfUnits', 'Type of Units')}
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
          currentStep={currentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            {renderLabel('name', 'CFC Name', true)}
            <Input
              value={stepData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter CFC name"
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
          currentStep={currentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            {renderLabel('spvName', 'SPV Name', true)}
            <Input
              value={stepData.spvName || ''}
              onChange={(e) => handleInputChange('spvName', e.target.value)}
              placeholder="Enter SPV name"
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
            {renderLabel('yearOfIncorporation', 'Year of Incorporation')}
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
          {renderLabel('rolesAndResponsibilities', 'Roles & Responsibilities')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={normalizeToString(stepData.rolesAndResponsibilities)}
            onChange={(e) => handleCommaSeparatedChange('rolesAndResponsibilities', e.target.value)}
            placeholder="Enter roles and responsibilities separated by commas (e.g., Role 1, Role 2, Role 3)"
          />
          <p className="text-xs text-muted-foreground mt-1">Separate multiple roles with commas</p>
        </div>
        <div>
          {renderLabel('boardOfDirectors', 'Board of Directors')}
          <div className="space-y-4">
            {(Array.isArray(stepData.boardOfDirectors) ? stepData.boardOfDirectors : []).map((director: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Director {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArrayRemove('boardOfDirectors', index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input
                    value={director.name || ''}
                    onChange={(e) => handleArrayUpdate('boardOfDirectors', index, { name: e.target.value })}
                    placeholder="Name"
                  />
                  <Input
                    value={director.designation || ''}
                    onChange={(e) => handleArrayUpdate('boardOfDirectors', index, { designation: e.target.value })}
                    placeholder="Designation"
                  />
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleArrayAdd('boardOfDirectors', { name: '', designation: '' })}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Director
            </Button>
          </div>
        </div>
        <div>
          {renderLabel('shareholdingPattern', 'Shareholding Pattern')}
          <div className="space-y-4">
            {(Array.isArray(stepData.shareholdingPattern) ? stepData.shareholdingPattern : []).map((share: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Shareholder {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArrayRemove('shareholdingPattern', index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input
                    value={share.stakeholder || ''}
                    onChange={(e) => handleArrayUpdate('shareholdingPattern', index, { stakeholder: e.target.value })}
                    placeholder="Stakeholder name"
                  />
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={share.percentage || ''}
                    onChange={(e) => handleArrayUpdate('shareholdingPattern', index, { percentage: parseFloat(e.target.value) || 0 })}
                    placeholder="Percentage (%)"
                  />
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleArrayAdd('shareholdingPattern', { stakeholder: '', percentage: 0 })}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Shareholder
            </Button>
          </div>
        </div>
        <div>
          {renderLabel('memberUnits', 'Member Units')}
          <div className="space-y-4">
            {(Array.isArray(stepData.memberUnits) ? stepData.memberUnits : []).map((unit: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Unit {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArrayRemove('memberUnits', index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input
                    value={unit.name || ''}
                    onChange={(e) => handleArrayUpdate('memberUnits', index, { name: e.target.value })}
                    placeholder="Unit name"
                  />
                  <Input
                    value={unit.registration || ''}
                    onChange={(e) => handleArrayUpdate('memberUnits', index, { registration: e.target.value })}
                    placeholder="Registration number"
                  />
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleArrayAdd('memberUnits', { name: '', registration: '' })}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Member Unit
            </Button>
          </div>
        </div>
        <div>
          {renderLabel('statutoryRegistrations', 'Statutory Registrations')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={normalizeToString(stepData.statutoryRegistrations)}
            onChange={(e) => handleCommaSeparatedChange('statutoryRegistrations', e.target.value)}
            placeholder="Enter statutory registrations separated by commas (e.g., Registration 1, Registration 2, Registration 3)"
          />
          <p className="text-xs text-muted-foreground mt-1">Separate multiple registrations with commas</p>
        </div>
      </div>
    );
  }

  // Step 12: Project Cost Details
  if (currentStep === 12) {
    const totalCost = (stepData.land || 0) +
      (stepData.building || 0) +
      (stepData.machinery || 0) +
      (stepData.utilitiesAndInfrastructure || 0) +
      (stepData.preliminaryAndPreOperative || 0) +
      (stepData.workingCapitalMargin || 0);

    return (
      <div className="space-y-6">
        <AISuggestions
          currentStep={currentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            {renderLabel('land', 'Land (₹ Lakhs)')}
            <Input
              type="number"
              value={stepData.land || ''}
              onChange={(e) => handleInputChange('land', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            {renderLabel('building', 'Building (₹ Lakhs)')}
            <Input
              type="number"
              value={stepData.building || ''}
              onChange={(e) => handleInputChange('building', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            {renderLabel('machinery', 'Machinery (₹ Lakhs)')}
            <Input
              type="number"
              value={stepData.machinery || ''}
              onChange={(e) => handleInputChange('machinery', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
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
          currentStep={currentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            {renderLabel('spvContribution', 'SPV Contribution (₹ Lakhs)')}
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
    return (
      <div className="space-y-6">
        <AISuggestions
          currentStep={currentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        
        {/* Basic Financial Indicators */}
        <div className="border rounded-lg p-6 space-y-4">
          <h4 className="text-lg font-semibold">Basic Financial Indicators</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              {renderLabel('breakEvenPoint', 'Break-even Point (₹ Lakhs)')}
              <Input
                type="number"
                value={stepData.breakEvenPoint || ''}
                onChange={(e) => handleInputChange('breakEvenPoint', parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div>
              {renderLabel('irr', 'IRR (%)')}
              <Input
                type="number"
                value={stepData.irr || ''}
                onChange={(e) => handleInputChange('irr', parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div>
              {renderLabel('npv', 'NPV (₹ Lakhs)')}
              <Input
                type="number"
                value={stepData.npv || ''}
                onChange={(e) => handleInputChange('npv', parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>
          <div>
            {renderLabel('sensitivityAnalysis', 'Sensitivity Analysis')}
            <textarea
              className="w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={stepData.sensitivityAnalysis || ''}
              onChange={(e) => handleInputChange('sensitivityAnalysis', e.target.value)}
              placeholder="Describe sensitivity analysis"
            />
          </div>
        </div>

        {/* Detailed Financial Statements */}
        <div className="border-t pt-6">
          <FinancialStatements
            data={stepData.financialStatements || {}}
            onChange={(field, value) => {
              if (field === 'financialStatements') {
                handleInputChange('financialStatements', value);
              } else {
                handleInputChange(field, value);
              }
            }}
            projectData={data}
          />
        </div>
      </div>
    );
  }

  // Step 16: Project Implementation Schedule
  if (currentStep === 16) {
    return (
      <div className="space-y-6">
        <AISuggestions
          currentStep={currentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div>
          {renderLabel('startDate', 'Start Date')}
          <Input
            type="date"
            value={stepData.startDate || ''}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
          />
        </div>
        <div>
          {renderLabel('milestones', 'Milestones')}
          <div className="space-y-4">
            {(Array.isArray(stepData.milestones) ? stepData.milestones : []).map((milestone: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Milestone {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArrayRemove('milestones', index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Input
                    value={milestone.activity || ''}
                    onChange={(e) => handleArrayUpdate('milestones', index, { activity: e.target.value })}
                    placeholder="Activity name"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Input
                      value={milestone.timeRequired || ''}
                      onChange={(e) => handleArrayUpdate('milestones', index, { timeRequired: e.target.value })}
                      placeholder="Time required"
                    />
                    <Input
                      type="date"
                      value={milestone.startDate || ''}
                      onChange={(e) => handleArrayUpdate('milestones', index, { startDate: e.target.value })}
                      placeholder="Start date"
                    />
                    <Input
                      type="date"
                      value={milestone.endDate || ''}
                      onChange={(e) => handleArrayUpdate('milestones', index, { endDate: e.target.value })}
                      placeholder="End date"
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleArrayAdd('milestones', { activity: '', timeRequired: '', startDate: '', endDate: '' })}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Milestone
            </Button>
          </div>
        </div>
        <div>
          {renderLabel('totalImplementationPeriod', 'Total Implementation Period')}
          <Input
            value={stepData.totalImplementationPeriod || ''}
            onChange={(e) => handleInputChange('totalImplementationPeriod', e.target.value)}
            placeholder="e.g., 18 months"
          />
        </div>
      </div>
    );
  }

  // Step 17: Expected Impact
  if (currentStep === 17) {
    return (
      <div className="space-y-6">
        <AISuggestions
          currentStep={currentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            {renderLabel('increaseInUnits', 'Increase in Units')}
            <Input
              type="number"
              value={stepData.increaseInUnits || ''}
              onChange={(e) => handleInputChange('increaseInUnits', parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            {renderLabel('employmentGeneration', 'Employment Generation')}
            <Input
              type="number"
              value={stepData.employmentGeneration || ''}
              onChange={(e) => handleInputChange('employmentGeneration', parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            {renderLabel('turnoverGrowth', 'Turnover Growth (%)')}
            <Input
              type="number"
              value={stepData.turnoverGrowth || ''}
              onChange={(e) => handleInputChange('turnoverGrowth', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            {renderLabel('exportGrowth', 'Export Growth (%)')}
            <Input
              type="number"
              value={stepData.exportGrowth || ''}
              onChange={(e) => handleInputChange('exportGrowth', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            {renderLabel('incomeEnhancement', 'Income Enhancement (%)')}
            <Input
              type="number"
              value={stepData.incomeEnhancement || ''}
              onChange={(e) => handleInputChange('incomeEnhancement', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
        </div>
        <div>
          {renderLabel('sustainabilityOutcomes', 'Sustainability Outcomes')}
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={normalizeToString(stepData.sustainabilityOutcomes)}
            onChange={(e) => handleCommaSeparatedChange('sustainabilityOutcomes', e.target.value)}
            placeholder="Enter sustainability outcomes separated by commas (e.g., Outcome 1, Outcome 2, Outcome 3)"
          />
          <p className="text-xs text-muted-foreground mt-1">Separate multiple outcomes with commas</p>
        </div>
      </div>
    );
  }

  // Step 18: Annexures & Document Uploads
  if (currentStep === 18) {
    // Note: uploadingFiles state is defined at component top level (React hooks rule)

    const handleFileChange = async (field: string, file: File | null) => {
      if (file) {
        setUploadingFiles(prev => ({ ...prev, [field]: true }));
        try {
          // Upload to Cloudinary
          const uploadResult = await api.uploadClusterDPRDocument(file);
          if (uploadResult.success && uploadResult.data?.documentUrl) {
            // Store the Cloudinary URL, not just the filename
            handleInputChange(field, uploadResult.data.documentUrl);
            toast.success(`${file.name} uploaded successfully!`);
          } else {
            toast.error(uploadResult.message || 'Failed to upload document');
            // Fallback to filename only if upload fails
            handleInputChange(field, file.name);
          }
        } catch (error: any) {
          console.error('Error uploading document:', error);
          toast.error(error.message || 'Failed to upload document');
          // Fallback to filename only if upload fails
          handleInputChange(field, file.name);
        } finally {
          setUploadingFiles(prev => ({ ...prev, [field]: false }));
        }
      }
    };

    const handleMultipleFileChange = async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      const uploadedUrls: string[] = [];

      setUploadingFiles(prev => ({ ...prev, supportingDocuments: true }));
      try {
        for (const file of fileArray) {
          try {
            const uploadResult = await api.uploadClusterDPRDocument(file);
            if (uploadResult.success && uploadResult.data?.documentUrl) {
              uploadedUrls.push(uploadResult.data.documentUrl);
            } else {
              // Fallback to filename if upload fails
              uploadedUrls.push(file.name);
            }
          } catch (error) {
            console.error('Error uploading file:', file.name, error);
            uploadedUrls.push(file.name);
          }
        }
        handleInputChange('supportingDocuments', uploadedUrls);
        toast.success(`${uploadedUrls.length} document(s) uploaded!`);
      } finally {
        setUploadingFiles(prev => ({ ...prev, supportingDocuments: false }));
      }
    };

    // Helper to display filename from URL
    const getDisplayName = (urlOrName: string): string => {
      if (urlOrName.startsWith('http://') || urlOrName.startsWith('https://')) {
        // Extract filename from URL
        const urlParts = urlOrName.split('/');
        return urlParts[urlParts.length - 1] || urlOrName;
      }
      return urlOrName;
    };

    return (
      <div className="space-y-6">
        <AISuggestions
          currentStep={currentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div>
          {renderLabel('spvRegistration', 'SPV Registration')}
          <div className="relative">
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange('spvRegistration', e.target.files?.[0] || null)}
              disabled={uploadingFiles.spvRegistration}
            />
            {uploadingFiles.spvRegistration && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            )}
          </div>
          {stepData.spvRegistration && (
            <p className="text-sm text-green-600 mt-1">✓ Uploaded: {getDisplayName(stepData.spvRegistration)}</p>
          )}
        </div>
        <div>
          {renderLabel('landDocuments', 'Land Documents')}
          <div className="relative">
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange('landDocuments', e.target.files?.[0] || null)}
              disabled={uploadingFiles.landDocuments}
            />
            {uploadingFiles.landDocuments && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            )}
          </div>
          {stepData.landDocuments && (
            <p className="text-sm text-green-600 mt-1">✓ Uploaded: {getDisplayName(stepData.landDocuments)}</p>
          )}
        </div>
        <div>
          {renderLabel('buildingEstimates', 'Building Estimates')}
          <div className="relative">
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange('buildingEstimates', e.target.files?.[0] || null)}
              disabled={uploadingFiles.buildingEstimates}
            />
            {uploadingFiles.buildingEstimates && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            )}
          </div>
          {stepData.buildingEstimates && (
            <p className="text-sm text-green-600 mt-1">✓ Uploaded: {getDisplayName(stepData.buildingEstimates)}</p>
          )}
        </div>
        <div>
          {renderLabel('machineryQuotations', 'Machinery Quotations')}
          <div className="relative">
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange('machineryQuotations', e.target.files?.[0] || null)}
              disabled={uploadingFiles.machineryQuotations}
            />
            {uploadingFiles.machineryQuotations && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            )}
          </div>
          {stepData.machineryQuotations && (
            <p className="text-sm text-green-600 mt-1">✓ Uploaded: {getDisplayName(stepData.machineryQuotations)}</p>
          )}
        </div>
        <div>
          {renderLabel('memberRegistrations', 'Member Registrations')}
          <div className="relative">
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange('memberRegistrations', e.target.files?.[0] || null)}
              disabled={uploadingFiles.memberRegistrations}
            />
            {uploadingFiles.memberRegistrations && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            )}
          </div>
          {stepData.memberRegistrations && (
            <p className="text-sm text-green-600 mt-1">✓ Uploaded: {getDisplayName(stepData.memberRegistrations)}</p>
          )}
        </div>
        <div>
          {renderLabel('supportingDocuments', 'Supporting Documents')}
          <div className="relative">
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              multiple
              onChange={(e) => handleMultipleFileChange(e.target.files)}
              disabled={uploadingFiles.supportingDocuments}
            />
            {uploadingFiles.supportingDocuments && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            )}
          </div>
          {stepData.supportingDocuments && Array.isArray(stepData.supportingDocuments) && stepData.supportingDocuments.length > 0 && (
            <div className="mt-2 space-y-1">
              {stepData.supportingDocuments.map((doc: string, index: number) => (
                <p key={index} className="text-sm text-green-600">✓ {getDisplayName(doc)}</p>
              ))}
            </div>
          )}
        </div>
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
