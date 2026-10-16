// @ts-nocheck
import { FieldPrompt } from '@/components/ui/FieldPrompt';
import { AssetListEditor, BusinessKindPicker } from '@/components/individual-dpr/AssetItems';
import { businessKind, kindLabel, scaleOf } from '@/lib/individualDpr/businessKind';
import { projectCost as draftProjectCost } from '@/lib/individualDpr/dataChecks';
import { FinanceModelPanel } from '@/components/individual-dpr/FinanceModel';
import { FinanceCalcStrip } from '@/components/individual-dpr/FinanceCalculators';
import { ReusedNote, ScheduleParties } from '@/components/individual-dpr/ScheduleParties';
import React from 'react';
import { useIndividualDPRStore } from '@/store/individualDPRStore';
import { ExpandableInput as Input, ExpandableTextarea, ExpandableSelect } from '@/components/ui/ExpandableField';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, Loader2, Wand2, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AISuggestions } from '@/components/cluster-dpr/AISuggestions';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { FIELD_DESCRIPTIONS } from '@/data/fieldDescriptions';
import { districtSelectOptions, townSelectOptions, isTownInDistrict } from '@/lib/individualDpr/apDistricts';
import { normalizeCmepProjections } from '@/lib/individualDpr/cmepProjections';
import { CmepProjectionTable } from '@/components/individual-dpr/CmepProjectionTable';
import {
  CmepAssumptionsEditor,
  CmepCostPhasingEditor,
  CmepDerivedSheets,
  CmepLoanTermsEditor,
  CmepMachineryEditor,
  CmepPromotersEditor,
} from '@/components/individual-dpr/CmepBankSections';
import { BUSINESS_SKILLS, matchBusinessSkillLocal } from '@/lib/individualDpr/businessSkills';
import { AISuggestionsService } from '@/services/aiSuggestions.service';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import {
  extraFieldsForScheme,
  hideComplexCapex,
  getStep18Uploads,
  showPmegpEducationGate,
  nayakWorkingCapital,
  showDscr,
  isMudraShishuKishore,
  getContentStep,
} from '@/lib/individualDpr/schemeFormConfig';
import {
  VISHWAKARMA_CRAFTS,
  VISHWAKARMA_INTEREST_PERCENT,
  VISHWAKARMA_TOOLKIT_LAKHS,
  VISHWAKARMA_TRAINING_OPTIONS,
  VISHWAKARMA_TRANCHE_OPTIONS,
  VISHWAKARMA_WORKPLACE_OPTIONS,
  VISHWAKARMA_YES_NO_OPTIONS,
  vishwakarmaTrancheCapLakhs,
} from '@/lib/individualDpr/vishwakarmaQuestions';
import {
  SVANIDHI_INTEREST_SUBSIDY_PERCENT,
  SVANIDHI_PROOF_OPTIONS,
  SVANIDHI_TRANCHE_OPTIONS,
  SVANIDHI_VENDING_OPTIONS,
  svanidhiTrancheCapLakhs,
  svanidhiTrancheTenorMonths,
} from '@/lib/individualDpr/svanidhiQuestions';
import {
  PMEGP_AGENCY_OPTIONS,
  PMEGP_AREA_OPTIONS,
  PMEGP_CATEGORY_OPTIONS,
  PMEGP_EDUCATION_OPTIONS,
  pmegpOwnPercent,
  pmegpSubsidyPercent,
} from '@/lib/individualDpr/pmegpQuestions';
import {
  MUDRA_CATEGORY_OPTIONS,
  MUDRA_LOAN_PURPOSE_OPTIONS,
  MUDRA_PREMISES_OPTIONS,
} from '@/lib/individualDpr/mudraQuestions';
import {
  STANDUP_CATEGORY_OPTIONS,
  STANDUP_MIN_OWN_PERCENT,
  STANDUP_PREMISES_OPTIONS,
} from '@/lib/individualDpr/standupQuestions';
import {
  PMFME_FSSAI_OPTIONS,
  PMFME_MIN_OWN_PERCENT,
  PMFME_ODOP_OPTIONS,
  PMFME_PREMISES_OPTIONS,
  PMFME_SUBSIDY_CAP_LAKHS,
  PMFME_SUBSIDY_PERCENT,
  PMFME_UNIT_STAGE_OPTIONS,
  pmfmeIndicativeGrantLakhs,
} from '@/lib/individualDpr/pmfmeQuestions';
import {
  PMEGP_2ND_AGENCY_OPTIONS,
  PMEGP_2ND_OWN_PERCENT,
  PMEGP_2ND_PRIOR_SCHEME_OPTIONS,
  PMEGP_2ND_SECTOR_BAND_OPTIONS,
  PMEGP_2ND_YES_NO_OPTIONS,
  pmegp2ndIndicativeMmLakhs,
  pmegp2ndSubsidyPercent,
} from '@/lib/individualDpr/pmegp2ndQuestions';
import {
  SCLCSS_CATEGORY_OPTIONS,
  SCLCSS_MIN_STAKE_PERCENT,
  SCLCSS_PREMISES_OPTIONS,
  SCLCSS_SUBSIDY_CAP_LAKHS,
  SCLCSS_SUBSIDY_PERCENT,
  SCLCSS_UNIT_STAGE_OPTIONS,
  sclcssIndicativeGrantLakhs,
} from '@/lib/individualDpr/sclcssQuestions';
import {
  AP_TECH_PREMISES_OPTIONS,
  AP_TECH_SIZE_OPTIONS,
  AP_TECH_YES_NO_OPTIONS,
  apTechIndicativeGrantLakhs,
  apTechSubsidyCapLakhs,
  apTechSubsidyPercent,
} from '@/lib/individualDpr/apTechUpgradeQuestions';
import {
  AP_EDP_LAND_REBATE_CAP_LAKHS,
  AP_EDP_LAND_REBATE_PERCENT,
  AP_EDP_PREMISES_OPTIONS,
  AP_EDP_SIZE_OPTIONS,
  AP_EDP_YES_NO_OPTIONS,
  apEdpIndicativeGrantLakhs,
  apEdpIndicativeLandRebateLakhs,
  apEdpLandRebateEligible,
  apEdpSubsidyCapLakhs,
  apEdpSubsidyPercent,
} from '@/lib/individualDpr/apEdpQuestions';
import {
  ECLGS_ACCOUNT_STATUS_OPTIONS,
  ECLGS_INTEREST_CAP_PERCENT,
  ECLGS_QUANTUM_PERCENT,
  ECLGS_TENOR_YEARS,
  eclgsIndicativeQuantumLakhs,
} from '@/lib/individualDpr/eclgsQuestions';
import { ZED_LEVEL_OPTIONS } from '@/lib/individualDpr/zedQuestions';
import { MSME_IPR_STAGE_OPTIONS, MSME_IPR_TYPE_OPTIONS } from '@/lib/individualDpr/msmeIprQuestions';
import { SCST_HUB_CATEGORY_OPTIONS, SCST_HUB_GEM_OPTIONS } from '@/lib/individualDpr/scstHubQuestions';
import { ASPIRE_PREMISES_OPTIONS } from '@/lib/individualDpr/aspireQuestions';
import { NHDP_LOOM_OPTIONS, NHDP_PREMISES_OPTIONS } from '@/lib/individualDpr/nhdpQuestions';
import { CVY_BOARD_STATUS_OPTIONS, CVY_PREMISES_OPTIONS } from '@/lib/individualDpr/cvyQuestions';
import { PTUAS_GMP_OPTIONS } from '@/lib/individualDpr/ptuasQuestions';
import { PMPDS_FOCUS_OPTIONS } from '@/lib/individualDpr/pmpdsQuestions';
import { CGTMSE_PURPOSE_OPTIONS, CGTMSE_WOMEN_OPTIONS } from '@/lib/individualDpr/cgtmseQuestions';
import {
  AP_FPP_PREMISES_OPTIONS,
  AP_FPP_SIZE_OPTIONS,
  AP_FPP_YES_NO,
} from '@/lib/individualDpr/apFppQuestions';
import {
  AP_CMEP_ACTIVITY_OPTIONS,
  AP_CMEP_AREA_OPTIONS,
  AP_CMEP_BOOSTER_OPTIONS,
  AP_CMEP_EDP_OPTIONS,
  AP_CMEP_YES_NO,
} from '@/lib/individualDpr/apCmepQuestions';
import {
  ProductMixEditor,
  RawMaterialEditor,
  RiskEditor,
  StaffRoleEditor,
  UtilisationYearEditor,
  WorkingCapitalBuildupEditor,
} from '@/components/individual-dpr/SchemeQuestionEditors';
import { machineryTotalLakhs } from '@/lib/individualDpr/cmepBankPack';
import { OBMMS_CORP_OPTIONS, OBMMS_YES_NO } from '@/lib/individualDpr/obmmsQuestions';
import { MSE_SPICE_SECTOR_OPTIONS } from '@/lib/individualDpr/mseSpiceQuestions';
import { AP_PARKS_REBATE_OPTIONS, AP_PARKS_YES_NO } from '@/lib/individualDpr/apParksQuestions';
import { RAMP_TEAM_ONDC_OPTIONS } from '@/lib/individualDpr/rampTeamQuestions';
import { EPM_NIRYAT_CREDIT_OPTIONS } from '@/lib/individualDpr/epmNiryatQuestions';
import { normalizeExtraValue } from '@/lib/individualDpr/fillAllStepsWithAi';
import { suggestUnitTitle } from '@/lib/individualDpr/coverTitle';
import { getUnitName, withSyncedUnitName } from '@/lib/individualDpr/toIndividualPayload';
import { individualDprApi } from '@/lib/individualDpr/individualDprApi';
import { isKycUploaded, kycDisplayName, kycUploadPayload } from '@/lib/privacy/kycField';
import {
  normalizeMilestones,
  toDateInputValue,
  toFiniteNumber,
  isNumericDprField,
} from '@/lib/dprAiFieldNormalize';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { isReasonableIsoDate } from '@/lib/individualDpr/isoDate';

interface IndividualDPRFormProps {
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  invalidFields?: string[];
}

export const IndividualDPRForm: React.FC<IndividualDPRFormProps> = ({
  currentStep,
  onNext,
  onPrevious,
  invalidFields = [],
}) => {
  const { data, setStepData, getStepData, setSchemeExtras } = useIndividualDPRStore();
  const { user } = useAuthStore();
  const aiAllowed = !!user?.privacy?.aiAssist;
  const tf = useClusterFormText();
  const { t } = useTranslation();
  const [matchingSkill, setMatchingSkill] = React.useState(false);
  const schemeCode = data.matchedSchemeCode || null;
  const isPmegp = schemeCode === 'PMEGP';
  const isPmegp2nd = schemeCode === 'PMEGP_2ND';
  const isMudra = schemeCode === 'MUDRA';
  const isStandup = schemeCode === 'STANDUP';
  const isPmfme = schemeCode === 'PMFME';
  const isSclcss = schemeCode === 'SCLCSS';
  const isApTech = schemeCode === 'AP_TECH_UPGRADE';
  const isApEdp = schemeCode === 'AP_EDP';
  const isVishwakarma = schemeCode === 'VISHWAKARMA';
  const isSvanidhi = schemeCode === 'SVANIDHI';
  const isEclgs = schemeCode === 'ECLGS';
  const isZed = schemeCode === 'ZED';
  const isLean = schemeCode === 'LEAN';
  const isMsmeIpr = schemeCode === 'MSME_IPR';
  const isPms = schemeCode === 'PMS';
  const isScstHub = schemeCode === 'SCST_HUB';
  const isAspire = schemeCode === 'ASPIRE';
  const isNhdp = schemeCode === 'NHDP';
  const isCvy = schemeCode === 'CVY';
  const isMseGift = schemeCode === 'MSE_GIFT';
  const isPtuas = schemeCode === 'PTUAS';
  const isPmpds = schemeCode === 'PMPDS';
  const isCgtmse = schemeCode === 'CGTMSE';
  const isApFpp = schemeCode === 'AP_FPP';
  const isApCmep = schemeCode === 'AP_CMEP';
  const isObmms = schemeCode === 'OBMMS';
  const isMseSpice = schemeCode === 'MSE_SPICE';
  const isApParks = schemeCode === 'AP_PARKS';
  const isRampTeam = schemeCode === 'RAMP_TEAM';
  const isEpmNiryat = schemeCode === 'EPM_NIRYAT';
  const isLeanUnit =
    isPmegp ||
    isPmegp2nd ||
    isMudra ||
    isStandup ||
    isPmfme ||
    isSclcss ||
    isApTech ||
    isApEdp ||
    isVishwakarma ||
    isSvanidhi ||
    isEclgs ||
    isZed ||
    isLean ||
    isMsmeIpr ||
    isPms ||
    isScstHub ||
    isAspire ||
    isNhdp ||
    isCvy ||
    isMseGift ||
    isPtuas ||
    isPmpds ||
    isCgtmse ||
    isApFpp ||
    isApCmep ||
    isObmms ||
    isMseSpice ||
    isApParks ||
    isRampTeam ||
    isEpmNiryat;
  const extraFieldNames = extraFieldsForScheme(schemeCode);
  /** Store / AI / PDF bucket for this scheme's local step. */
  const contentStep = getContentStep(currentStep, schemeCode);
  const extras = data.schemeExtras || {};
  const updateExtras = (patch: Record<string, any>) => {
    const current = useIndividualDPRStore.getState().data.schemeExtras || {};
    setSchemeExtras({ ...current, ...patch });
  };
  const aiStore = {
    data,
    setStepData,
    getStepData,
    setSchemeExtras,
    isIndividualDPR: true,
    contextHint: 'This is an individual entrepreneur unit (one firm), not a multi-unit CFC / SPV report.',
  };
  const aiExclude =
    contentStep === 1
      ? ['clusterName', 'unitName', 'location', 'district']
      : hideComplexCapex(schemeCode, data.ventureMatchAnswers?.budget) && contentStep === 12
        ? ['land', 'building', 'utilitiesAndInfrastructure', 'preliminaryAndPreOperative']
        : [];
  // Read step data from the content bucket (scheme-local UI step may differ)
  const stepDataKey = `step${contentStep}` as keyof typeof data;
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
    const stepKey = `step${contentStep}`;
    const stepDescriptions = FIELD_DESCRIPTIONS[stepKey] || {};
    const description = stepDescriptions[fieldName];

    const missed = invalidFields.includes(fieldName);
    return (
      <label className={`block text-sm font-medium mb-2 ${missed ? 'text-red-600' : ''}`}>
        <FieldPrompt label={label} extra={description} required={required} />
      </label>
    );
  };

  const fieldRing = (name: string, base = '') =>
    `${base} ${invalidFields.includes(name) ? 'scroll-mt-40 border-red-500 ring-2 ring-red-400' : ''}`.trim();

  const requiredHint = (name: string) =>
    invalidFields.includes(name) ? (
      <p className="mt-1 text-xs font-medium text-red-600">{tf('Required')}</p>
    ) : null;

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

  /** A calculator writes its answers straight into the step they belong to. */
  const applyCalc = (step: number, patch: Record<string, number>) => {
    setStepData(step, { ...(getStepData(step) || {}), ...patch });
  };

  const kind = businessKind(data);
  const scale = scaleOf(data, draftProjectCost(data));
  const setKind = (next: string) => setSchemeExtras({ ...(data.schemeExtras || {}), businessKind: next });

  const handleInputChange = (field: string, value: any) => {
    if (extraFieldNames.includes(field) || ['craft', 'currentTools', 'newTools', 'covOrLor', 'upiQr', 'fssai', 'apiicPark'].includes(field)) {
      updateExtras({ [field]: normalizeExtraValue(field, value) });
      return;
    }
    const latestStepData = getStepData(contentStep) || {};
    let nextValue = value;
    if (field === 'startDate' || field === 'endDate' || field === 'commitmentDate' || (field === 'yearOfEstablishment' && isLeanUnit)) {
      nextValue = toDateInputValue(value) || value;
    }
    if (field === 'milestones') nextValue = normalizeMilestones(value);
    // Guard: never store AI prose in ₹ / numeric fields (breaks totals via string concat)
    const dateOnThisStep = field === 'commitmentDate' || (field === 'yearOfEstablishment' && isLeanUnit);
    if (!dateOnThisStep && isNumericDprField(field) && (typeof nextValue === 'string' || typeof nextValue === 'number')) {
      nextValue = toFiniteNumber(nextValue);
    }
    if (field === 'unitName' || field === 'clusterName') {
      setStepData(contentStep, withSyncedUnitName(latestStepData, String(nextValue ?? '')));
      return;
    }
    setStepData(contentStep, {
      ...latestStepData,
      [field]: nextValue,
    });
  };

  // Handle comma-separated input fields (for array fields)
  const handleCommaSeparatedChange = (field: string, value: string) => {
    // Convert comma-separated string to array
    const arrayValue = normalizeToArray(value);
    setStepData(contentStep, {
      ...stepData,
      [field]: arrayValue,
    });
  };

  const handleArrayAdd = (field: string, newItem: any) => {
    const currentArray = Array.isArray(stepData[field]) ? stepData[field] : [];
    setStepData(contentStep, {
      ...stepData,
      [field]: [...currentArray, newItem],
    });
  };

  const handleArrayRemove = (field: string, index: number) => {
    const currentArray = Array.isArray(stepData[field]) ? stepData[field] : [];
    setStepData(contentStep, {
      ...stepData,
      [field]: currentArray.filter((_: any, i: number) => i !== index),
    });
  };

  const handleArrayUpdate = (field: string, index: number, updatedItem: any) => {
    const currentArray = Array.isArray(stepData[field]) ? stepData[field] : [];
    setStepData(contentStep, {
      ...stepData,
      [field]: currentArray.map((item: any, i: number) =>
        i === index ? { ...item, ...updatedItem } : item
      ),
    });
  };

  // Step 1: Unit basics
  if (contentStep === 1) {
    const stepDescriptions = FIELD_DESCRIPTIONS.step1 || {};

    return (
      <div className="space-y-6">
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={contentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
          <div>
            <label className={`block text-sm font-medium mb-2 ${invalidFields.includes('unitName') ? 'text-red-600' : ''}`}>
              <FieldPrompt label="Unit / Project Name *" extra={stepDescriptions.unitName || stepDescriptions.clusterName} />
            </label>
            <Input
            data-required-field="unitName"
            className={fieldRing('unitName')}
            value={String(stepData.unitName ?? stepData.clusterName ?? '')}
            onChange={(e) => handleInputChange('unitName', e.target.value)}
            placeholder={tf('Enter unit or project name')}
          />
          {requiredHint('unitName')}
          <div className="mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5 whitespace-nowrap"
              onClick={() => {
                const nature = String(stepData.natureOfBusiness || '').trim();
                const products = String(stepData.majorProducts || '').trim();
                if (!nature || !products) {
                  toast.error(
                    tf(
                      'Fill Nature of Business and Major Products first, then suggest a title'
                    )
                  );
                  return;
                }
                const suggested = suggestUnitTitle(stepData, data.schemeExtras);
                handleInputChange('unitName', suggested);
                toast.success(tf('Title suggested'));
              }}
            >
              <Wand2 className="h-4 w-4" />
              {tf('Suggest title')}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {tf(
              'Short cover name from Nature of Business + Major Products (not a full paragraph).'
            )}
          </p>
        </div>

        <div className="form-field-grid">
          <div>
            <label className={`block text-sm font-medium mb-2 ${invalidFields.includes('district') ? 'text-red-600' : ''}`}>
              <FieldPrompt label="District *" extra={stepDescriptions.district} />
            </label>
            <ExpandableSelect
              data-required-field="district"
              className={fieldRing('district', 'w-full h-10 rounded-[10px] border border-input bg-background px-3 py-2 text-sm')}
              value={stepData.district || ''}
              onChange={(e) => {
                const nextDistrict = e.target.value;
                handleInputChange('district', nextDistrict);
                if (!isTownInDistrict(nextDistrict, stepData.location)) {
                  handleInputChange('location', '');
                }
              }}
              label={tf('District *')}
            >
              <option value="">{tf('Select district')}</option>
              {districtSelectOptions(stepData.district).map((d) => (
                <option key={d} value={d}>
                  {tf(d)}
                </option>
              ))}
            </ExpandableSelect>
            {requiredHint('district')}
          </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${invalidFields.includes('location') ? 'text-red-600' : ''}`}>
              <FieldPrompt label="Location *" extra={stepDescriptions.location} />
            </label>
            <ExpandableSelect
              data-required-field="location"
              className={fieldRing('location', 'w-full h-10 rounded-[10px] border border-input bg-background px-3 py-2 text-sm')}
            value={stepData.location || ''}
            onChange={(e) => handleInputChange('location', e.target.value)}
              label={tf('Location *')}
              disabled={!stepData.district}
            >
              <option value="">
                {stepData.district ? tf('Select town') : tf('Select district first')}
              </option>
              {townSelectOptions(stepData.district, stepData.location).map((town) => (
                <option key={town} value={town}>
                  {tf(town)}
                </option>
              ))}
            </ExpandableSelect>
            {requiredHint('location')}
          </div>
        </div>

        <div className="form-field-grid">
          <div>
            <label className="block text-sm font-medium mb-2">
              <FieldPrompt label="Nature of Business" extra={stepDescriptions.natureOfBusiness} />
            </label>
            <Input
              value={stepData.natureOfBusiness || ''}
              onChange={(e) => handleInputChange('natureOfBusiness', e.target.value)}
              placeholder={tf('What do you do')}
              enableSkillMatch
              expandTitle={tf('Nature of Business')}
              formatDisplay={(v) => tf(v)}
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5 whitespace-nowrap"
                disabled={matchingSkill}
                onClick={async () => {
                  const text = String(stepData.natureOfBusiness || '').trim();
                  if (!text) {
                    toast.error(tf('Type what you do first, then Match me.'));
                    return;
                  }
                  const local = matchBusinessSkillLocal(text);
                  if (local) {
                    handleInputChange('natureOfBusiness', local);
                    toast.success(tf('Matched to: {skill}').replace('{skill}', local));
                    return;
                  }
                  if (!aiAllowed) {
                    toast.error(t('privacy.aiOffWarning'));
                    return;
                  }
                  setMatchingSkill(true);
                  try {
                    const skill = await AISuggestionsService.matchBusinessSkill(
                      text,
                      [...BUSINESS_SKILLS],
                      {
                        unitName: getUnitName(stepData),
                        district: stepData.district || '',
                        location: stepData.location || '',
                        schemeCode,
                      }
                    );
                    if (!skill) {
                      toast.error(
                        tf('Could not match a skill. Try again with a clearer description.')
                      );
                      return;
                    }
                    handleInputChange('natureOfBusiness', skill);
                    toast.success(tf('Matched to: {skill}').replace('{skill}', skill));
                  } catch (err) {
                    console.error(err);
                    toast.error(
                      tf('Could not match a skill. Try again with a clearer description.')
                    );
                  } finally {
                    setMatchingSkill(false);
                  }
                }}
              >
                {matchingSkill ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {matchingSkill ? tf('Matching…') : tf('Match me')}
              </Button>
              <p className="text-xs text-muted-foreground">
                {tf('Describe your work in a line, then Match me to map it to one skill.')}
              </p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              <FieldPrompt label="Major Products" extra={stepDescriptions.majorProducts} />
            </label>
            <Input
              value={stepData.majorProducts || ''}
              onChange={(e) => handleInputChange('majorProducts', e.target.value)}
              placeholder={tf("Enter major products")}
            />
          </div>
        </div>

        {isVishwakarma && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">{tf('PM Vishwakarma — craft & eligibility')}</h3>
            <p className="text-xs text-muted-foreground">
              {tf(
                'Spec: docs/schemes/VISHWAKARMA/vishwakarma.md — 18 trades; toolkit ₹15,000; loan ₹1 L then ₹2 L at 5%'
              )}
            </p>
            <div className="form-field-grid">
            <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Craft / trade (18 notified)" /></label>
                <ExpandableSelect
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.craft || ''}
                onChange={(e) => updateExtras({ craft: e.target.value })}
              >
                  <option value="">{tf('Select your craft')}</option>
                {VISHWAKARMA_CRAFTS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                ))}
                </ExpandableSelect>
            </div>
            <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Training stage" /></label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.trainingStage || ''}
                  onChange={(e) => updateExtras({ trainingStage: e.target.value })}
                >
                  <option value="">{tf('Select')}</option>
                  {VISHWAKARMA_TRAINING_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Enterprise loan tranche" /></label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.loanTranche || ''}
                  onChange={(e) => updateExtras({ loanTranche: e.target.value })}
                >
                  <option value="">{tf('Select')}</option>
                  {VISHWAKARMA_TRANCHE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  <FieldPrompt label="Similar self-employment loan in last 5 years?" />
                </label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.priorSelfEmploymentLoan || ''}
                  onChange={(e) => updateExtras({ priorSelfEmploymentLoan: e.target.value })}
                >
                  <option value="">{tf('Select')}</option>
                  {VISHWAKARMA_YES_NO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur full name" /></label>
                <Input
                  value={extras.entrepreneurName || ''}
                  onChange={(e) => updateExtras({ entrepreneurName: e.target.value })}
                  placeholder={tf('Full name as in Aadhaar')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Age (≥ 18)" /></label>
                <Input
                  type="number" min={18} max={100}
                  value={extras.entrepreneurAge || ''}
                  onChange={(e) => updateExtras({ entrepreneurAge: e.target.value })}
                  placeholder={tf('e.g. 32')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Years practising this craft" /></label>
                <Input
                  type="number" min={0} max={80}
                  value={extras.experienceYears || ''}
                  onChange={(e) => updateExtras({ experienceYears: e.target.value })}
                  placeholder={tf('e.g. 8')}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"><FieldPrompt label="Current tools" /></label>
              <ExpandableTextarea
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={extras.currentTools || ''}
                onChange={(e) => updateExtras({ currentTools: e.target.value })}
                placeholder={tf('Tools you use today')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                <FieldPrompt label="New tools needed (₹15,000 toolkit voucher)" />
              </label>
              <ExpandableTextarea
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={extras.newTools || ''}
                onChange={(e) => updateExtras({ newTools: e.target.value })}
                placeholder={tf('Tools to buy with the e-voucher at a designated centre')}
              />
            </div>
            <p className="text-sm font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
              {tf('Indicative support')}: {tf('toolkit')} ₹
              {(VISHWAKARMA_TOOLKIT_LAKHS * 100000).toLocaleString('en-IN')} · {tf('loan cap')} ₹
              {(vishwakarmaTrancheCapLakhs(extras.loanTranche) * 100000 || 0).toLocaleString('en-IN')}{' '}
              · {VISHWAKARMA_INTEREST_PERCENT}% {tf('interest')} · {extras.craft || '—'} /{' '}
              {extras.trainingStage || '—'}
            </p>
          </div>
        )}

        {isSvanidhi && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">{tf('PM SVANidhi — vending & eligibility')}</h3>
            <p className="text-xs text-muted-foreground">
              {tf(
                'Spec: docs/schemes/SVANIDHI/svanidhi.md — WC tranches ₹15k / ₹25k / ₹50k; 7% interest subsidy; UPI mandatory'
              )}
            </p>
            <div className="form-field-grid">
            <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Vending proof" /></label>
                <ExpandableSelect
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.covOrLor || ''}
                onChange={(e) => updateExtras({ covOrLor: e.target.value })}
              >
                  <option value="">{tf('Select')}</option>
                  {SVANIDHI_PROOF_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
            </div>
            <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Loan tranche" /></label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.loanTranche || ''}
                  onChange={(e) => updateExtras({ loanTranche: e.target.value })}
                >
                  <option value="">{tf('Select')}</option>
                  {SVANIDHI_TRANCHE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Vending type / pitch" /></label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.vendingType || extras.workplaceType || ''}
                  onChange={(e) =>
                    updateExtras({ vendingType: e.target.value, workplaceType: e.target.value })
                  }
                >
                  <option value="">{tf('Select')}</option>
                  {SVANIDHI_VENDING_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  <FieldPrompt label="UPI ID (linked to bank account) — mandatory" />
                </label>
              <Input
                  value={extras.upiQr || ''}
                onChange={(e) => updateExtras({ upiQr: e.target.value })}
                  placeholder={tf('e.g. vendor@upi')}
              />
            </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Vendor full name" /></label>
                <Input
                  value={extras.entrepreneurName || ''}
                  onChange={(e) => updateExtras({ entrepreneurName: e.target.value })}
                  placeholder={tf('Full name as in Aadhaar')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Age (≥ 18)" /></label>
                <Input
                  type="number" min={18} max={100}
                  value={extras.entrepreneurAge || ''}
                  onChange={(e) => updateExtras({ entrepreneurAge: e.target.value })}
                  placeholder={tf('e.g. 35')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Years in street vending" /></label>
                <Input
                  type="number"
                  value={extras.yearsVending || ''}
                  onChange={(e) => updateExtras({ yearsVending: e.target.value })}
                  placeholder={tf('e.g. 6')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Approx daily sales (₹)" /></label>
                <Input
                  type="number"
                  value={extras.dailySales || ''}
                  onChange={(e) => updateExtras({ dailySales: e.target.value })}
                  placeholder={tf('e.g. 2500')}
                />
              </div>
            </div>
            <p className="text-sm font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
              {tf('Indicative WC loan')}: ₹
              {Math.round(svanidhiTrancheCapLakhs(extras.loanTranche) * 100000).toLocaleString(
                'en-IN'
              )}{' '}
              · {svanidhiTrancheTenorMonths(extras.loanTranche)} {tf('months')} ·{' '}
              {SVANIDHI_INTEREST_SUBSIDY_PERCENT}% {tf('interest subsidy')} ·{' '}
              {tf(
                SVANIDHI_PROOF_OPTIONS.find((o) => o.value === extras.covOrLor)?.label ||
                  extras.covOrLor ||
                  '—'
              )}{' '}
              /{' '}
              {tf(
                SVANIDHI_TRANCHE_OPTIONS.find((o) => o.value === extras.loanTranche)?.label ||
                  extras.loanTranche ||
                  '—'
              )}
              .
            </p>
          </div>
        )}

        {isPmfme && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">{tf('PMFME — formalisation & eligibility')}</h3>
            <p className="text-xs text-muted-foreground">
              {tf(
                'Spec: docs/schemes/PMFME/pmfme.md — NIFTEM model DPRs; 35% grant capped ₹10 L; own ≥10%'
              )}
            </p>
            <div className="form-field-grid">
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Unit stage" /></label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.unitStage || ''}
                  onChange={(e) => updateExtras({ unitStage: e.target.value })}
                >
                  <option value="">{tf('Select')}</option>
                  {PMFME_UNIT_STAGE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="ODOP aligned?" /></label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.odopAligned || ''}
                  onChange={(e) => updateExtras({ odopAligned: e.target.value })}
                >
                  <option value="">{tf('Select')}</option>
                  {PMFME_ODOP_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="FSSAI" /></label>
                <ExpandableSelect
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={extras.fssai || stepData.fssai || ''}
              onChange={(e) => updateExtras({ fssai: e.target.value })}
            >
                  <option value="">{tf('FSSAI status')}</option>
                  {PMFME_FSSAI_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur full name" /></label>
                <Input
                  value={extras.entrepreneurName || ''}
                  onChange={(e) => updateExtras({ entrepreneurName: e.target.value })}
                  placeholder={tf('Full name as in Aadhaar')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur age" /></label>
                <Input
                  type="number" min={18} max={100}
                  value={extras.entrepreneurAge || ''}
                  onChange={(e) => updateExtras({ entrepreneurAge: e.target.value })}
                  placeholder={tf('e.g. 32')}
                />
              </div>
              {extras.unitStage === 'existing' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <FieldPrompt label="Existing annual turnover (₹ Lakhs)" />
                  </label>
                  <Input
                    type="number"
                    value={extras.existingTurnover || ''}
                    onChange={(e) => updateExtras({ existingTurnover: e.target.value })}
                    placeholder={tf('e.g. 8')}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {isApEdp && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">{tf('AP MSME-EDP 4.0 — new-unit eligibility')}</h3>
            <p className="text-xs text-muted-foreground">
              {tf(
                'Spec: docs/schemes/AP_EDP/apEdp.md — greenfield FCI capital subsidy; mutually exclusive with tech-upgrade'
              )}
            </p>
            <div className="form-field-grid">
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Enterprise size" /></label>
                <ExpandableSelect
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.enterpriseSize || ''}
                  onChange={(e) => updateExtras({ enterpriseSize: e.target.value })}
                >
                  <option value="">{tf('Select')}</option>
                  {AP_EDP_SIZE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  <FieldPrompt label="Special category (wholly owned, AP domicile)?" />
                </label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.specialCategory || ''}
                  onChange={(e) => updateExtras({ specialCategory: e.target.value })}
                >
                  <option value="">{tf('Select')}</option>
                  {AP_EDP_YES_NO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="SC/ST wholly owned?" /></label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.scStOwned || ''}
                  onChange={(e) => updateExtras({ scStOwned: e.target.value })}
                >
                  <option value="">{tf('Select')}</option>
                  {AP_EDP_YES_NO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="AP domicile confirmed?" /></label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.apDomicile || ''}
                  onChange={(e) => updateExtras({ apDomicile: e.target.value })}
                >
                  <option value="">{tf('Select')}</option>
                  {AP_EDP_YES_NO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  <FieldPrompt label="Unit inside an APIIC park / estate?" />
                </label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.apiicPark || ''}
              onChange={(e) => updateExtras({ apiicPark: e.target.value })}
            >
                  <option value="">{tf('Select')}</option>
                  <option value="yes">{tf('Yes — SC/ST micro/small may get land rebate')}</option>
                  <option value="no">{tf('No')}</option>
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur full name" /></label>
                <Input
                  value={extras.entrepreneurName || ''}
                  onChange={(e) => updateExtras({ entrepreneurName: e.target.value })}
                  placeholder={tf('Full name as in Aadhaar')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur age" /></label>
                <Input
                  type="number" min={18} max={100}
                  value={extras.entrepreneurAge || ''}
                  onChange={(e) => updateExtras({ entrepreneurAge: e.target.value })}
                  placeholder={tf('e.g. 35')}
                />
              </div>
            </div>
            <p className="text-sm font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
              {tf('Indicative capital subsidy')}:{' '}
              {apEdpSubsidyPercent(extras.enterpriseSize, extras.specialCategory)}% {tf('of FCI')},{' '}
              {tf('cap')} ₹
              {apEdpSubsidyCapLakhs(extras.enterpriseSize, extras.specialCategory).toLocaleString(
                'en-IN'
              )}{' '}
              {tf('L')} · {extras.enterpriseSize || '—'} / {tf('special')} {extras.specialCategory || '—'}.
              {apEdpLandRebateEligible(
                extras.apiicPark,
                extras.scStOwned,
                extras.enterpriseSize
              ) && (
                <>
                  {' '}
                  · {tf('APIIC land rebate')} {AP_EDP_LAND_REBATE_PERCENT}% {tf('cap')} ₹
                  {AP_EDP_LAND_REBATE_CAP_LAKHS} {tf('L')}.
                </>
              )}
            </p>
          </div>
        )}

        {isEclgs && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">{tf('ECLGS 5.0 — existing WC facility')}</h3>
            <p className="text-xs text-muted-foreground">
              {tf('Spec: docs/schemes/ECLGS/eclgs.md — additional WC up to 20% of peak Q4 outstanding')}
            </p>
            <div className="form-field-grid">
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Existing fund-based WC limit (₹ Lakhs)" /></label>
                <Input type="number" value={extras.existingLimit || ''} onChange={(e) => updateExtras({ existingLimit: e.target.value })} placeholder={tf('e.g. 50')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Peak Q4 WC outstanding (₹ Lakhs)" /></label>
                <Input type="number" value={extras.peakWcOutstanding || ''} onChange={(e) => updateExtras({ peakWcOutstanding: e.target.value })} placeholder={tf('e.g. 40')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Additional ECLGS WC sought (₹ Lakhs)" /></label>
                <Input type="number" value={extras.additionalWcSought || ''} onChange={(e) => updateExtras({ additionalWcSought: e.target.value })} placeholder={tf('e.g. 8')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Account status" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.accountStatus || ''} onChange={(e) => updateExtras({ accountStatus: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {ECLGS_ACCOUNT_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Authorised signatory" /></label>
                <Input value={extras.entrepreneurName || ''} onChange={(e) => updateExtras({ entrepreneurName: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"><FieldPrompt label="Why additional liquidity is needed" /></label>
              <ExpandableTextarea className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.liquidityReason || ''} onChange={(e) => updateExtras({ liquidityReason: e.target.value })} />
            </div>
            <p className="text-sm font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
              {tf('Indicative quantum')} {ECLGS_QUANTUM_PERCENT}% ≈ ₹
              {eclgsIndicativeQuantumLakhs(extras.peakWcOutstanding).toLocaleString('en-IN')} {tf('L')} · {tf('ROI cap')} {ECLGS_INTEREST_CAP_PERCENT}% · {tf('tenor')} {ECLGS_TENOR_YEARS} {tf('yrs')}.
            </p>
          </div>
        )}

        {isZed && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">{tf('ZED — certification levels')}</h3>
            <p className="text-xs text-muted-foreground">{tf('Spec: docs/schemes/ZED/zed.md')}</p>
            <div className="form-field-grid">
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Current ZED level" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.zedCurrentLevel || ''} onChange={(e) => updateExtras({ zedCurrentLevel: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {ZED_LEVEL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Target ZED level" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.zedTargetLevel || ''} onChange={(e) => updateExtras({ zedTargetLevel: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {ZED_LEVEL_OPTIONS.filter((o) => o.value !== 'none').map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur name" /></label>
                <Input value={extras.entrepreneurName || ''} onChange={(e) => updateExtras({ entrepreneurName: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"><FieldPrompt label="Quality / sustainability focus" /></label>
              <ExpandableTextarea className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.qualityFocus || ''} onChange={(e) => updateExtras({ qualityFocus: e.target.value })} />
            </div>
          </div>
        )}

        {isLean && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">{tf('LEAN — process bottleneck')}</h3>
            <p className="text-xs text-muted-foreground">{tf('Spec: docs/schemes/LEAN/lean.md')}</p>
            <div>
              <label className="block text-sm font-medium mb-2"><FieldPrompt label="Main process bottleneck" /></label>
              <ExpandableTextarea className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.processBottleneck || ''} onChange={(e) => updateExtras({ processBottleneck: e.target.value })} placeholder={tf('e.g. changeover time, scrap, inventory')} />
            </div>
            <div className="form-field-grid">
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Shop-floor size / lines" /></label>
                <Input value={extras.shopFloorSize || ''} onChange={(e) => updateExtras({ shopFloorSize: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur name" /></label>
                <Input value={extras.entrepreneurName || ''} onChange={(e) => updateExtras({ entrepreneurName: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"><FieldPrompt label="Expected lean gain" /></label>
              <ExpandableTextarea className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.expectedLeanGain || ''} onChange={(e) => updateExtras({ expectedLeanGain: e.target.value })} />
            </div>
          </div>
        )}

        {isMsmeIpr && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">{tf('MSME Innovative — IPR')}</h3>
            <p className="text-xs text-muted-foreground">{tf('Spec: docs/schemes/MSME_IPR/msmeIpr.md')}</p>
            <div className="form-field-grid">
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="IP type" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.ipType || ''} onChange={(e) => updateExtras({ ipType: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {MSME_IPR_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Filing stage" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.filingStage || ''} onChange={(e) => updateExtras({ filingStage: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {MSME_IPR_STAGE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Invention / mark title" /></label>
                <Input value={extras.inventionTitle || ''} onChange={(e) => updateExtras({ inventionTitle: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur name" /></label>
                <Input value={extras.entrepreneurName || ''} onChange={(e) => updateExtras({ entrepreneurName: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        {isPms && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">{tf('PMS — fair / marketing')}</h3>
            <p className="text-xs text-muted-foreground">{tf('Spec: docs/schemes/PMS/pms.md')}</p>
            <div className="form-field-grid">
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Event / fair name" /></label>
                <Input value={extras.eventName || ''} onChange={(e) => updateExtras({ eventName: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Stall size" /></label>
                <Input value={extras.stallSize || ''} onChange={(e) => updateExtras({ stallSize: e.target.value })} placeholder={tf('e.g. 9 sqm')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Fair city" /></label>
                <Input value={extras.fairCity || ''} onChange={(e) => updateExtras({ fairCity: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Estimated fair cost (₹ Lakhs)" /></label>
                <Input type="number" value={extras.estimatedFairCost || ''} onChange={(e) => updateExtras({ estimatedFairCost: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur name" /></label>
                <Input value={extras.entrepreneurName || ''} onChange={(e) => updateExtras({ entrepreneurName: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        {isScstHub && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">{tf('SC/ST Hub — procurement readiness')}</h3>
            <p className="text-xs text-muted-foreground">{tf('Spec: docs/schemes/SCST_HUB/scstHub.md')}</p>
            <div className="form-field-grid">
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Category" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.sclcssCategory || ''} onChange={(e) => updateExtras({ sclcssCategory: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {SCST_HUB_CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="GeM experience" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.gemExperience || ''} onChange={(e) => updateExtras({ gemExperience: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {SCST_HUB_GEM_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur name" /></label>
                <Input value={extras.entrepreneurName || ''} onChange={(e) => updateExtras({ entrepreneurName: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"><FieldPrompt label="Procurement focus" /></label>
              <ExpandableTextarea className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.procurementFocus || ''} onChange={(e) => updateExtras({ procurementFocus: e.target.value })} />
            </div>
          </div>
        )}

        {isAspire && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">{tf('ASPIRE — incubator & livelihood')}</h3>
            <p className="text-xs text-muted-foreground">{tf('Spec: docs/schemes/ASPIRE/aspire.md')}</p>
            <div className="form-field-grid">
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Incubator / LBI name" /></label>
                <Input value={extras.incubatorName || ''} onChange={(e) => updateExtras({ incubatorName: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Premises type" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.premisesType || ''} onChange={(e) => updateExtras({ premisesType: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {ASPIRE_PREMISES_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur name" /></label>
                <Input value={extras.entrepreneurName || ''} onChange={(e) => updateExtras({ entrepreneurName: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Age" /></label>
                <Input type="number" min={18} max={100} value={extras.entrepreneurAge || ''} onChange={(e) => updateExtras({ entrepreneurAge: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"><FieldPrompt label="Innovation / livelihood brief" /></label>
              <ExpandableTextarea className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.innovationBrief || extras.livelihoodFocus || ''} onChange={(e) => updateExtras({ innovationBrief: e.target.value, livelihoodFocus: e.target.value })} />
            </div>
          </div>
        )}

        {isNhdp && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">{tf('NHDP — loom & weaver')}</h3>
            <p className="text-xs text-muted-foreground">{tf('Spec: docs/schemes/NHDP/nhdp.md')}</p>
            <div className="form-field-grid">
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Loom type" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.loomType || ''} onChange={(e) => updateExtras({ loomType: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {NHDP_LOOM_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Weaver ID / corp membership" /></label>
                <Input value={extras.weaverId || ''} onChange={(e) => updateExtras({ weaverId: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Workplace" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.premisesType || ''} onChange={(e) => updateExtras({ premisesType: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {NHDP_PREMISES_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Product line" /></label>
                <Input value={extras.productLine || ''} onChange={(e) => updateExtras({ productLine: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Yarn source" /></label>
                <Input value={extras.yarnSource || ''} onChange={(e) => updateExtras({ yarnSource: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Weaver name" /></label>
                <Input value={extras.entrepreneurName || ''} onChange={(e) => updateExtras({ entrepreneurName: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        
        {isCvy && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">{tf('CVY — coir unit')}</h3>
            <p className="text-xs text-muted-foreground">{tf('Spec: docs/schemes/CVY/cvy.md')}</p>
            <div className="form-field-grid">
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Coir product line" /></label>
                <Input value={extras.coirProductLine || ''} onChange={(e) => updateExtras({ coirProductLine: e.target.value })} placeholder={tf('e.g. coir fibre, pith, mats')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Coir Board status" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.coirBoardStatus || ''} onChange={(e) => updateExtras({ coirBoardStatus: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {CVY_BOARD_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Premises" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.premisesType || ''} onChange={(e) => updateExtras({ premisesType: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {CVY_PREMISES_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur name" /></label>
                <Input value={extras.entrepreneurName || ''} onChange={(e) => updateExtras({ entrepreneurName: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        {isMseGift && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">{tf('MSE-GIFT — green / EE')}</h3>
            <p className="text-xs text-muted-foreground">{tf('Spec: docs/schemes/MSE_GIFT/mseGift.md')}</p>
            <div className="form-field-grid">
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Energy baseline (kWh / month)" /></label>
                <Input type="number" value={extras.energyBaselineKwh || ''} onChange={(e) => updateExtras({ energyBaselineKwh: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Expected saving (%)" /></label>
                <Input type="number" min={0} max={100} value={extras.expectedSaving || ''} onChange={(e) => updateExtras({ expectedSaving: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="EE equipment focus" /></label>
                <Input value={extras.eeEquipment || ''} onChange={(e) => updateExtras({ eeEquipment: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur name" /></label>
                <Input value={extras.entrepreneurName || ''} onChange={(e) => updateExtras({ entrepreneurName: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        {isPtuas && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">{tf('PTUAS — pharma upgrade')}</h3>
            <p className="text-xs text-muted-foreground">{tf('Spec: docs/schemes/PTUAS/ptuas.md')}</p>
            <div className="form-field-grid">
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="GMP status" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.gmpStatus || ''} onChange={(e) => updateExtras({ gmpStatus: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {PTUAS_GMP_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Product licence" /></label>
                <Input value={extras.productLicence || ''} onChange={(e) => updateExtras({ productLicence: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Existing tech" /></label>
                <Input value={extras.existingTech || ''} onChange={(e) => updateExtras({ existingTech: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Proposed tech" /></label>
                <Input value={extras.proposedTech || ''} onChange={(e) => updateExtras({ proposedTech: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur name" /></label>
                <Input value={extras.entrepreneurName || ''} onChange={(e) => updateExtras({ entrepreneurName: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        {isPmpds && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">{tf('PMPDS — promotion')}</h3>
            <p className="text-xs text-muted-foreground">{tf('Spec: docs/schemes/PMPDS/pmpds.md')}</p>
            <div className="form-field-grid">
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Focus" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.deviceOrFormulation || ''} onChange={(e) => updateExtras({ deviceOrFormulation: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {PMPDS_FOCUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur name" /></label>
                <Input value={extras.entrepreneurName || ''} onChange={(e) => updateExtras({ entrepreneurName: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"><FieldPrompt label="Promotion / development need" /></label>
              <ExpandableTextarea className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.promotionNeed || ''} onChange={(e) => updateExtras({ promotionNeed: e.target.value })} />
            </div>
          </div>
        )}

        {isCgtmse && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">{tf('CGTMSE — credit guarantee (MUDRA-adjacent)')}</h3>
            <p className="text-xs text-muted-foreground">{tf('Spec: docs/schemes/CGTMSE/cgtmse.md')}</p>
            <div className="form-field-grid">
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Loan purpose" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.loanPurpose || ''} onChange={(e) => updateExtras({ loanPurpose: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {CGTMSE_PURPOSE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Women-owned" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.womenOwned || ''} onChange={(e) => updateExtras({ womenOwned: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {CGTMSE_WOMEN_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Proposed limit (₹ Lakhs)" /></label>
                <Input type="number" value={extras.proposedLimit || ''} onChange={(e) => updateExtras({ proposedLimit: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur name" /></label>
                <Input value={extras.entrepreneurName || ''} onChange={(e) => updateExtras({ entrepreneurName: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        {isApFpp && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">{tf('AP FPP 4.0 — food processing')}</h3>
            <p className="text-xs text-muted-foreground">{tf('Spec: docs/schemes/AP_FPP/apFpp.md — do not double-claim with AP_EDP')}</p>
            <div className="form-field-grid">
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Enterprise size" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.enterpriseSize || ''} onChange={(e) => updateExtras({ enterpriseSize: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {AP_FPP_SIZE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Special category" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.specialCategory || ''} onChange={(e) => updateExtras({ specialCategory: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {AP_FPP_YES_NO.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="FPO / SHG" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.fpoShg || ''} onChange={(e) => updateExtras({ fpoShg: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {AP_FPP_YES_NO.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="AP domicile" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.apDomicile || ''} onChange={(e) => updateExtras({ apDomicile: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {AP_FPP_YES_NO.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Premises" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.premisesType || ''} onChange={(e) => updateExtras({ premisesType: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {AP_FPP_PREMISES_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur name" /></label>
                <Input value={extras.entrepreneurName || ''} onChange={(e) => updateExtras({ entrepreneurName: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        {isApCmep && (
          <div className="border border-indigo-200 rounded-lg p-4 space-y-4 bg-indigo-50/50">
            <h3 className="text-lg font-semibold text-indigo-950">{tf('AP CMEP — credit-linked')}</h3>
            <p className="text-xs text-indigo-900/70">{tf('Spec: docs/schemes/AP_CMEP/apCmep.md — bank loan required')}</p>
            <div className="form-field-grid">
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Activity band" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.activityBand || ''} onChange={(e) => updateExtras({ activityBand: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {AP_CMEP_ACTIVITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Booster category" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.boosterCategory || ''} onChange={(e) => updateExtras({ boosterCategory: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {AP_CMEP_BOOSTER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="AP domicile" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.apDomicile || ''} onChange={(e) => updateExtras({ apDomicile: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {AP_CMEP_YES_NO.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur name" /></label>
                <Input value={extras.entrepreneurName || ''} onChange={(e) => updateExtras({ entrepreneurName: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Urban or rural" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.cmepArea || ''} onChange={(e) => updateExtras({ cmepArea: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {AP_CMEP_AREA_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="EDP training" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.edpStatus || ''} onChange={(e) => updateExtras({ edpStatus: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {AP_CMEP_EDP_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Earlier government subsidy" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.priorSubsidy || ''} onChange={(e) => updateExtras({ priorSubsidy: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {AP_CMEP_YES_NO.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Only one person in the family for this scheme" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.familyExclusive || ''} onChange={(e) => updateExtras({ familyExclusive: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {AP_CMEP_YES_NO.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
            </div>
          </div>
        )}

        {isObmms && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">{tf('OBMMS — welfare self-employment')}</h3>
            <p className="text-xs text-muted-foreground">{tf('Spec: docs/schemes/OBMMS/obmms.md')}</p>
            <div className="form-field-grid">
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Welfare corporation" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.welfareCorporation || ''} onChange={(e) => updateExtras({ welfareCorporation: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {OBMMS_CORP_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="White rice card" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.whiteRiceCard || ''} onChange={(e) => updateExtras({ whiteRiceCard: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {OBMMS_YES_NO.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Activity / trade" /></label>
                <Input value={extras.activityTrade || ''} onChange={(e) => updateExtras({ activityTrade: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Age" /></label>
                <Input type="number" min={18} max={100} value={extras.entrepreneurAge || ''} onChange={(e) => updateExtras({ entrepreneurAge: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur name" /></label>
                <Input value={extras.entrepreneurName || ''} onChange={(e) => updateExtras({ entrepreneurName: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        {isMseSpice && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">{tf('MSE-SPICE — circular economy')}</h3>
            <p className="text-xs text-muted-foreground">{tf('Spec: docs/schemes/MSE_SPICE/mseSpice.md — 25% P&M cap ₹12.5 L')}</p>
            <div className="form-field-grid">
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Circular sector" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.circularSector || ''} onChange={(e) => updateExtras({ circularSector: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {MSE_SPICE_SECTOR_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Existing unit years" /></label>
                <Input type="number" min={0} max={100} value={extras.existingUnitYears || ''} onChange={(e) => updateExtras({ existingUnitYears: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Proposed P&M cost (₹ Lakhs)" /></label>
                <Input type="number" value={extras.proposedPmCost || ''} onChange={(e) => updateExtras({ proposedPmCost: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur name" /></label>
                <Input value={extras.entrepreneurName || ''} onChange={(e) => updateExtras({ entrepreneurName: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        {isApParks && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">{tf('AP MSME-PARKS — land rebate')}</h3>
            <p className="text-xs text-muted-foreground">{tf('Spec: docs/schemes/AP_PARKS/apParks.md')}</p>
            <div className="form-field-grid">
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="APIIC / park name" /></label>
                <Input value={extras.apiicParkName || ''} onChange={(e) => updateExtras({ apiicParkName: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Plot area" /></label>
                <Input value={extras.plotArea || ''} onChange={(e) => updateExtras({ plotArea: e.target.value })} placeholder={tf('e.g. 500 sq.yd')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Land rebate claim" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.landRebateClaim || ''} onChange={(e) => updateExtras({ landRebateClaim: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {AP_PARKS_REBATE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="AP domicile" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.apDomicile || ''} onChange={(e) => updateExtras({ apDomicile: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {AP_PARKS_YES_NO.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur name" /></label>
                <Input value={extras.entrepreneurName || ''} onChange={(e) => updateExtras({ entrepreneurName: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        {isRampTeam && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">{tf('RAMP TEAM — ONDC')}</h3>
            <p className="text-xs text-muted-foreground">{tf('Spec: docs/schemes/RAMP_TEAM/rampTeam.md')}</p>
            <div className="form-field-grid">
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="ONDC readiness" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.ondcReady || ''} onChange={(e) => updateExtras({ ondcReady: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {RAMP_TEAM_ONDC_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Catalogue SKUs (approx)" /></label>
                <Input type="number" value={extras.catalogueSkus || ''} onChange={(e) => updateExtras({ catalogueSkus: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur name" /></label>
                <Input value={extras.entrepreneurName || ''} onChange={(e) => updateExtras({ entrepreneurName: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"><FieldPrompt label="Product list note" /></label>
              <ExpandableTextarea className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.productListNote || ''} onChange={(e) => updateExtras({ productListNote: e.target.value })} />
            </div>
          </div>
        )}

        {isEpmNiryat && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">{tf('EPM Niryat — export credit')}</h3>
            <p className="text-xs text-muted-foreground">{tf('Spec: docs/schemes/EPM_NIRYAT/epmNiryat.md — 2.75% interest subvention')}</p>
            <div className="form-field-grid">
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Export markets" /></label>
                <Input value={extras.exportMarkets || ''} onChange={(e) => updateExtras({ exportMarkets: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="HSN lines" /></label>
                <Input value={extras.hsnLines || ''} onChange={(e) => updateExtras({ hsnLines: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Pre / post shipment" /></label>
                <ExpandableSelect className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={extras.prePostShipment || ''} onChange={(e) => updateExtras({ prePostShipment: e.target.value })}>
                  <option value="">{tf('Select')}</option>
                  {EPM_NIRYAT_CREDIT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{tf(o.label)}</option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Export credit sought (₹ Lakhs)" /></label>
                <Input type="number" value={extras.exportCreditSought || ''} onChange={(e) => updateExtras({ exportCreditSought: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur name" /></label>
                <Input value={extras.entrepreneurName || ''} onChange={(e) => updateExtras({ entrepreneurName: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        {schemeCode === 'PMEGP' && (
          <div className="border border-teal-200 rounded-lg p-4 space-y-4 bg-teal-50/50">
            <h3 className="text-lg font-semibold text-teal-950">{tf('PMEGP — entrepreneur & subsidy inputs')}</h3>
            <p className="text-xs text-muted-foreground">
              {tf(
                'These fields drive margin-money % (category × rural/urban). Spec: docs/schemes/PMEGP/pmegp.md'
              )}
            </p>
            <div className="form-field-grid">
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Category" /></label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.pmegpCategory || ''}
                  onChange={(e) => {
                    const pmegpCategory = e.target.value;
                    updateExtras({
                      pmegpCategory,
                      pmegpSubsidyPercent: String(
                        pmegpSubsidyPercent(pmegpCategory, extras.pmegpArea)
                      ),
                      pmegpOwnPercent: String(pmegpOwnPercent(pmegpCategory)),
                    });
                  }}
                >
                  <option value="">{tf('Select category')}</option>
                  {PMEGP_CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Area (rural / urban)" /></label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.pmegpArea || ''}
                  onChange={(e) => {
                    const pmegpArea = e.target.value;
                    updateExtras({
                      pmegpArea,
                      pmegpSubsidyPercent: String(
                        pmegpSubsidyPercent(extras.pmegpCategory, pmegpArea)
                      ),
                    });
                  }}
                >
                  <option value="">{tf('Select area')}</option>
                  {PMEGP_AREA_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Implementing agency" /></label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.pmegpAgency || ''}
                  onChange={(e) => updateExtras({ pmegpAgency: e.target.value })}
                >
                  <option value="">{tf('Select agency')}</option>
                  {PMEGP_AGENCY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Education" /></label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.educationStatus || ''}
                  onChange={(e) => updateExtras({ educationStatus: e.target.value })}
                >
                  <option value="">{tf('Select education')}</option>
                  {PMEGP_EDUCATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur full name" /></label>
                <Input
                  value={extras.entrepreneurName || ''}
                  onChange={(e) => updateExtras({ entrepreneurName: e.target.value })}
                  placeholder={tf('Full name as in Aadhaar')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur age" /></label>
                <Input
                  type="number" min={18} max={100}
                  value={extras.entrepreneurAge || ''}
                  onChange={(e) => updateExtras({ entrepreneurAge: e.target.value })}
                  placeholder={tf('Must be 18 or older')}
                />
              </div>
            </div>
            {(extras.pmegpCategory || extras.pmegpArea) && (
              <p className="text-sm font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                {tf('Indicative margin money')}:{' '}
                {pmegpSubsidyPercent(extras.pmegpCategory, extras.pmegpArea)}% · {tf('Own contribution')}:{' '}
                {pmegpOwnPercent(extras.pmegpCategory)}%
              </p>
            )}
          </div>
        )}

        {isPmegp2nd && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">{tf('PMEGP 2nd loan — prior assistance')}</h3>
            <p className="text-xs text-muted-foreground">
              {tf(
                'Spec: docs/schemes/PMEGP_2ND/pmegp2nd.md — brownfield only; uniform 15% MM (20% NER/Hill); own 10%'
              )}
            </p>
            <div className="form-field-grid">
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Prior scheme" /></label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.priorScheme || ''}
                  onChange={(e) => updateExtras({ priorScheme: e.target.value })}
                >
                  <option value="">{tf('Select')}</option>
                  {PMEGP_2ND_PRIOR_SCHEME_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  <FieldPrompt label="First sanction / project cost (₹ Lakhs)" />
                </label>
                <Input
                  type="number"
                  value={extras.priorSanctionAmount || ''}
                  onChange={(e) => updateExtras({ priorSanctionAmount: e.target.value })}
                  placeholder={tf('e.g. 12')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Year of first subsidy" /></label>
                <Input
                  value={extras.firstSubsidyYear || ''}
                  onChange={(e) => updateExtras({ firstSubsidyYear: e.target.value })}
                  placeholder={tf('e.g. 2019')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Implementing agency" /></label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.pmegpAgency || ''}
                  onChange={(e) => updateExtras({ pmegpAgency: e.target.value })}
                >
                  <option value="">{tf('Select agency')}</option>
                  {PMEGP_2ND_AGENCY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Sector band" /></label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.sectorBand || ''}
                  onChange={(e) => updateExtras({ sectorBand: e.target.value })}
                >
                  <option value="">{tf('Select')}</option>
                  {PMEGP_2ND_SECTOR_BAND_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="NER / Hill State?" /></label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.nerHill || ''}
                  onChange={(e) => updateExtras({ nerHill: e.target.value })}
                >
                  <option value="">{tf('Select')}</option>
                  {PMEGP_2ND_YES_NO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  <FieldPrompt label="First margin money adjusted?" />
                </label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.marginMoneyAdjusted || ''}
                  onChange={(e) => updateExtras({ marginMoneyAdjusted: e.target.value })}
                >
                  <option value="">{tf('Select')}</option>
                  {PMEGP_2ND_YES_NO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  <FieldPrompt label="First loan repaid in time?" />
                </label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.firstLoanRepaid || ''}
                  onChange={(e) => updateExtras({ firstLoanRepaid: e.target.value })}
                >
                  <option value="">{tf('Select')}</option>
                  {PMEGP_2ND_YES_NO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  <FieldPrompt label="Years of continuous profit" />
                </label>
                <Input
                  type="number" min={0} max={100}
                  value={extras.yearsProfitable || ''}
                  onChange={(e) => updateExtras({ yearsProfitable: e.target.value })}
                  placeholder={tf('Expect ≥ 3')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  <FieldPrompt label="Latest annual turnover (₹ Lakhs)" />
                </label>
                <Input
                  type="number"
                  value={extras.existingTurnover || ''}
                  onChange={(e) => updateExtras({ existingTurnover: e.target.value })}
                  placeholder={tf('e.g. 28')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur full name" /></label>
                <Input
                  value={extras.entrepreneurName || ''}
                  onChange={(e) => updateExtras({ entrepreneurName: e.target.value })}
                  placeholder={tf('Full name as in Aadhaar')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur age" /></label>
                <Input
                  type="number" min={18} max={100}
                  value={extras.entrepreneurAge || ''}
                  onChange={(e) => updateExtras({ entrepreneurAge: e.target.value })}
                  placeholder={tf('Must be 18 or older')}
                />
              </div>
            </div>
            <p className="text-sm font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
              {tf('Indicative upgrade MM')}: {pmegp2ndSubsidyPercent(extras.nerHill)}% · {tf('Own')}:{' '}
              {PMEGP_2ND_OWN_PERCENT}% · {extras.priorScheme || '—'} / {extras.sectorBand || '—'}
            </p>
          </div>
        )}

        {isSclcss && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">{tf('SCLCSS — SC/ST capital subsidy')}</h3>
            <p className="text-xs text-muted-foreground">
              {tf(
                'Spec: docs/schemes/SCLCSS/sclcss.md — 25% on new P&M, cap ₹25 L; SC/ST ≥51%; not general CLCSS'
              )}
            </p>
            <div className="form-field-grid">
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="SC / ST category" /></label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.sclcssCategory || ''}
                  onChange={(e) => updateExtras({ sclcssCategory: e.target.value })}
                >
                  <option value="">{tf('Select')}</option>
                  {SCLCSS_CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Unit stage" /></label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.unitStage || ''}
                  onChange={(e) => updateExtras({ unitStage: e.target.value })}
                >
                  <option value="">{tf('Select')}</option>
                  {SCLCSS_UNIT_STAGE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  <FieldPrompt label="SC/ST controlling stake % (if not sole prop)" />
                </label>
                <Input
                  type="number" min={0} max={100}
                  value={extras.controllingStakePercent || ''}
                  onChange={(e) => updateExtras({ controllingStakePercent: e.target.value })}
                  placeholder={tf(`Must be ≥ ${SCLCSS_MIN_STAKE_PERCENT} for firms`)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Udyam status / number" /></label>
                <Input
                  value={extras.udyamStatus || ''}
                  onChange={(e) => updateExtras({ udyamStatus: e.target.value })}
                  placeholder={tf('Udyam number or “applied / ready”')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur full name" /></label>
                <Input
                  value={extras.entrepreneurName || ''}
                  onChange={(e) => updateExtras({ entrepreneurName: e.target.value })}
                  placeholder={tf('Full name as in Aadhaar')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur age" /></label>
                <Input
                  type="number" min={18} max={100}
                  value={extras.entrepreneurAge || ''}
                  onChange={(e) => updateExtras({ entrepreneurAge: e.target.value })}
                  placeholder={tf('e.g. 35')}
                />
              </div>
            </div>
            <p className="text-sm font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
              {tf('Indicative capital subsidy')}: {SCLCSS_SUBSIDY_PERCENT}% {tf('capped at')} ₹
              {SCLCSS_SUBSIDY_CAP_LAKHS} {tf('L')} · {extras.sclcssCategory || '—'} /{' '}
              {extras.unitStage || '—'}
            </p>
          </div>
        )}

        {isApTech && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">{tf('AP Technology Upgradation — eligibility')}</h3>
            <p className="text-xs text-muted-foreground">
              {tf(
                'Spec: docs/schemes/AP_TECH_UPGRADE/apTechUpgrade.md — brownfield FCI; mutually exclusive with new-unit EDP capital subsidy'
              )}
            </p>
            <div className="form-field-grid">
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Enterprise size" /></label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.enterpriseSize || ''}
                  onChange={(e) => updateExtras({ enterpriseSize: e.target.value })}
                >
                  <option value="">{tf('Select')}</option>
                  {AP_TECH_SIZE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  <FieldPrompt label="Special category (wholly owned, AP domicile)?" />
                </label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.specialCategory || ''}
                  onChange={(e) => updateExtras({ specialCategory: e.target.value })}
                >
                  <option value="">{tf('Select')}</option>
                  {AP_TECH_YES_NO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="AP domicile confirmed?" /></label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.apDomicile || ''}
                  onChange={(e) => updateExtras({ apDomicile: e.target.value })}
                >
                  <option value="">{tf('Select')}</option>
                  {AP_TECH_YES_NO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Years in operation" /></label>
                <Input
                  type="number" min={0} max={100}
                  value={extras.yearsInOperation || ''}
                  onChange={(e) => updateExtras({ yearsInOperation: e.target.value })}
                  placeholder={tf('e.g. 5')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  <FieldPrompt label="Latest annual turnover (₹ Lakhs)" />
                </label>
                <Input
                  type="number"
                  value={extras.existingTurnover || ''}
                  onChange={(e) => updateExtras({ existingTurnover: e.target.value })}
                  placeholder={tf('e.g. 45')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur full name" /></label>
                <Input
                  value={extras.entrepreneurName || ''}
                  onChange={(e) => updateExtras({ entrepreneurName: e.target.value })}
                  placeholder={tf('Full name as in Aadhaar')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur age" /></label>
                <Input
                  type="number" min={18} max={100}
                  value={extras.entrepreneurAge || ''}
                  onChange={(e) => updateExtras({ entrepreneurAge: e.target.value })}
                  placeholder={tf('e.g. 38')}
                />
              </div>
            </div>
            <p className="text-sm font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
              {tf('Indicative tech-upgrade subsidy')}:{' '}
              {apTechSubsidyPercent(extras.enterpriseSize, extras.specialCategory)}% {tf('of FCI')},{' '}
              {tf('cap')} ₹
              {apTechSubsidyCapLakhs(extras.enterpriseSize, extras.specialCategory).toLocaleString(
                'en-IN'
              )}{' '}
              {tf('L')} · {extras.enterpriseSize || '—'} / {tf('special')} {extras.specialCategory || '—'}.
            </p>
          </div>
        )}

        {isMudra && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">{tf('MUDRA — PMMY category & applicant')}</h3>
            <p className="text-xs text-muted-foreground">
              {tf('Spec: docs/schemes/MUDRA/mudra.md — Shishu / Kishore / Tarun / Tarun Plus')}
            </p>
            <div className="form-field-grid">
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="PMMY category" /></label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.mudraCategory || ''}
                  onChange={(e) => updateExtras({ mudraCategory: e.target.value })}
                >
                  <option value="">{tf('Select category')}</option>
                  {MUDRA_CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Loan purpose" /></label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.loanPurpose || ''}
                  onChange={(e) => updateExtras({ loanPurpose: e.target.value })}
                >
                  <option value="">{tf('Select purpose')}</option>
                  {MUDRA_LOAN_PURPOSE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur full name" /></label>
                <Input
                  value={extras.entrepreneurName || ''}
                  onChange={(e) => updateExtras({ entrepreneurName: e.target.value })}
                  placeholder={tf('Full name as in Aadhaar')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur age" /></label>
                <Input
                  type="number" min={18} max={100}
                  value={extras.entrepreneurAge || ''}
                  onChange={(e) => updateExtras({ entrepreneurAge: e.target.value })}
                  placeholder={tf('Must be 18 or older')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  <FieldPrompt label="Experience in this line (years)" />
                </label>
                <Input
                  type="number" min={0} max={80}
                  value={extras.experienceYears || ''}
                  onChange={(e) => updateExtras({ experienceYears: e.target.value })}
                  placeholder={tf('e.g. 3')}
                />
              </div>
            </div>
          </div>
        )}

        {isStandup && (
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
            <h3 className="text-lg font-semibold">{tf('Stand-Up India — eligibility')}</h3>
            <p className="text-xs text-muted-foreground">
              {tf(
                'Spec: docs/schemes/STANDUP/standup.md — woman / SC / ST, greenfield, ≥10% own, ₹10 L–₹1 Cr'
              )}
            </p>
            <div className="form-field-grid">
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Eligible category" /></label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={extras.standupCategory || ''}
                  onChange={(e) => updateExtras({ standupCategory: e.target.value })}
                >
                  <option value="">{tf('Select category')}</option>
                  {STANDUP_CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  <FieldPrompt label="Composite loan sought (₹ Lakhs)" />
                </label>
                <Input
                  type="number"
                  value={extras.loanAmountSought || ''}
                  onChange={(e) => updateExtras({ loanAmountSought: e.target.value })}
                  placeholder={tf('Above 10 and up to 100')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur full name" /></label>
                <Input
                  value={extras.entrepreneurName || ''}
                  onChange={(e) => updateExtras({ entrepreneurName: e.target.value })}
                  placeholder={tf('Full name as in Aadhaar')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Entrepreneur age" /></label>
                <Input
                  type="number" min={18} max={100}
                  value={extras.entrepreneurAge || ''}
                  onChange={(e) => updateExtras({ entrepreneurAge: e.target.value })}
                  placeholder={tf('Must be 18 or older')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  <FieldPrompt label="Controlling stake % (if not sole prop)" />
                </label>
                <Input
                  type="number" min={0} max={100}
                  value={extras.controllingStakePercent || ''}
                  onChange={(e) => updateExtras({ controllingStakePercent: e.target.value })}
                  placeholder={tf('Must be ≥ 51 for firms')}
                />
              </div>
            </div>
          </div>
        )}

        {extraFieldNames.length > 0 &&
          !['VISHWAKARMA', 'SVANIDHI', 'PMFME', 'AP_EDP', 'PMEGP', 'PMEGP_2ND', 'MUDRA', 'STANDUP', 'SCLCSS', 'AP_TECH_UPGRADE', 'ECLGS', 'ZED', 'LEAN', 'MSME_IPR', 'PMS', 'SCST_HUB', 'ASPIRE', 'NHDP', 'CVY', 'MSE_GIFT', 'PTUAS', 'PMPDS', 'CGTMSE', 'AP_FPP', 'AP_CMEP', 'OBMMS', 'MSE_SPICE', 'AP_PARKS', 'RAMP_TEAM', 'EPM_NIRYAT'].includes(
            schemeCode || ''
          ) && (
            <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50">
              <h3 className="text-lg font-semibold">{tf('Scheme-specific details')}</h3>
              {extraFieldNames.map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium mb-2"><FieldPrompt label={field} /></label>
                  <Input
                    value={String(extras[field] ?? stepData[field] ?? '')}
                    onChange={(e) => updateExtras({ [field]: e.target.value })}
                    placeholder={tf(field)}
                  />
                </div>
              ))}
            </div>
          )}

      </div>
    );
  }

  // Step 2: Introduction & Sector Overview
  if (contentStep === 2) {
    return (
      <div className="space-y-6">
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={contentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div>
          {renderLabel('sectorType', isLeanUnit ? 'Sector / industry type' : 'Sector / Industry Type', true)}
          <Input
            data-required-field="sectorType"
            className={fieldRing('sectorType')}
            value={stepData.sectorType || ''}
            onChange={(e) => handleInputChange('sectorType', e.target.value)}
            placeholder={tf("Enter sector type")}
          />
          {requiredHint('sectorType')}
        </div>

        <div>
          {renderLabel('sectorDescription', isLeanUnit ? 'Short intro — what the unit does' : 'Sector Description', true)}
          <ExpandableTextarea
            data-required-field="sectorDescription"
            className={fieldRing('sectorDescription', 'w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm')}
            value={stepData.sectorDescription || ''}
            onChange={(e) => handleInputChange('sectorDescription', e.target.value)}
            placeholder={
              isLeanUnit
                ? tf('Short intro: product, customers, what the unit does')
                : tf('Describe the sector in detail')
            }
          />
          {requiredHint('sectorDescription')}
        </div>

        {(isPmegp || isApCmep) && (
          <div
            className={
              isPmegp
                ? 'rounded-lg border border-teal-200 bg-teal-50/40 p-4 space-y-2'
                : 'rounded-lg border border-indigo-200 bg-indigo-50/40 p-4 space-y-2'
            }
          >
            <label className="block text-sm font-semibold text-foreground">
              <FieldPrompt label="Executive summary" />
            </label>
            <p className="text-xs text-muted-foreground">
              {tf(
                'Write a short bank-style overview: unit, location, products, project cost, own + bank + subsidy, and jobs.'
              )}
            </p>
            <ExpandableTextarea
              className="w-full min-h-[160px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={extras.executiveSummary || ''}
              onChange={(e) => updateExtras({ executiveSummary: e.target.value })}
              placeholder={tf(
                'Write a short bank-style overview: unit, location, products, project cost, own + bank + subsidy, and jobs.'
              )}
            />
          </div>
        )}

        {(isPmegp ||
          isPmegp2nd ||
          isStandup ||
          isPmfme ||
          isSclcss ||
          isApTech ||
          isApEdp ||
          isApCmep ||
          isVishwakarma ||
          isSvanidhi) && (
          <div>
            <label className="block text-sm font-medium mb-2"><FieldPrompt label="Process of manufacture" /></label>
            <ExpandableTextarea
              className="w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={extras.processOfManufacture || ''}
              onChange={(e) => updateExtras({ processOfManufacture: e.target.value })}
              placeholder={
                isApEdp
                  ? tf('Process of manufacture for the new greenfield unit')
                  : isApCmep
                  ? tf('Process of manufacture / service delivery for the new CMEP unit')
                  : isSvanidhi
                  ? tf('How you source, prepare (if food), and sell — daily routine')
                  : isVishwakarma
                  ? tf('How you make / deliver the craft product or service (step by step)')
                  : isApTech || isSclcss
                  ? tf('Process after new plant & machinery (manufacturing)')
                  : isPmegp2nd
                    ? tf('Process after upgrade / modernisation')
                    : isPmfme
                      ? tf('Food processing / value-addition steps (as in NIFTEM model DPRs)')
                      : isStandup
                        ? tf('Process of manufacture / service delivery (bank checklist)')
                        : tf('Step-by-step process (as in KVIC bakery / curd profiles)')
              }
            />
          </div>
        )}
        {(isPmegp2nd || isSclcss || isApTech) && (
          <div className="form-field-grid">
            <div>
              <label className="block text-sm font-medium mb-2"><FieldPrompt label="Existing technology" /></label>
              <ExpandableTextarea
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={extras.existingTech || ''}
                onChange={(e) => updateExtras({ existingTech: e.target.value })}
                placeholder={tf('What the unit uses today')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"><FieldPrompt label="Proposed technology / upgrade" /></label>
              <ExpandableTextarea
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={extras.proposedTech || ''}
                onChange={(e) => updateExtras({ proposedTech: e.target.value })}
                placeholder={
                  isApTech
                    ? tf('New / upgraded P&M with tech specs (FCI base)')
                    : isSclcss
                      ? tf('New P&M / equipment with tech specs (subsidy base)')
                      : tf('Machinery / process being added')
                }
              />
            </div>
          </div>
        )}
        {isApTech && (
          <div>
            <label className="block text-sm font-medium mb-2">
              <FieldPrompt label="Expected productivity / quality / cost gain" />
            </label>
            <ExpandableTextarea
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={extras.productivityGain || ''}
              onChange={(e) => updateExtras({ productivityGain: e.target.value })}
              placeholder={tf('Why DIC should support this upgrade')}
            />
          </div>
        )}

        {!isLeanUnit && (
          <>
        <div>
          {renderLabel('nationalImportance', 'National Importance')}
          <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.nationalImportance || ''}
            onChange={(e) => handleInputChange('nationalImportance', e.target.value)}
            placeholder={tf("Describe national importance")}
          />
        </div>

        <div>
          {renderLabel('stateLevelImportance', 'State-level Importance')}
          <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.stateLevelImportance || ''}
            onChange={(e) => handleInputChange('stateLevelImportance', e.target.value)}
            placeholder={tf("Describe state-level importance")}
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
                  placeholder={tf("Enter product name")}
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
              {tf('Add Product')}
            </Button>
          </div>
        </div>
          </>
        )}
      </div>
    );
  }

  // Step 3: District & Regional Profile
  if (contentStep === 3) {
    return (
      <div className="space-y-6">
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={contentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div>
          {renderLabel(
            'geography',
            isLeanUnit ? 'Brief location / market catchment' : 'Geography'
          )}
          <ExpandableTextarea
            allowImprove={false}
            expandTitle={isLeanUnit ? 'Brief location / market catchment' : 'Geography'}
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.geography || ''}
            onChange={(e) => handleInputChange('geography', e.target.value)}
            placeholder={
              isLeanUnit
                ? tf('Site, roads, nearby markets — brief feasibility note')
                : tf('Describe geography')
            }
          />
        </div>
        {!isLeanUnit && (
          <>
        <div>
          {renderLabel('climate', 'Climate')}
          <Input
            value={stepData.climate || ''}
            onChange={(e) => handleInputChange('climate', e.target.value)}
            placeholder={tf("Enter climate details")}
          />
        </div>
        <div>
          {renderLabel('infrastructure', 'Infrastructure')}
          <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.infrastructure || ''}
            onChange={(e) => handleInputChange('infrastructure', e.target.value)}
            placeholder={tf("Describe infrastructure")}
          />
        </div>
        <div>
          {renderLabel('keyEconomicActivities', 'Key Economic Activities')}
          <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.keyEconomicActivities || ''}
            onChange={(e) => handleInputChange('keyEconomicActivities', e.target.value)}
            placeholder={tf("Describe key economic activities")}
          />
        </div>
        <div className="form-field-grid">
          <div>
            {renderLabel('rawMaterialAvailability', 'Raw Material Availability')}
            <ExpandableTextarea
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={stepData.rawMaterialAvailability || ''}
              onChange={(e) => handleInputChange('rawMaterialAvailability', e.target.value)}
              placeholder={tf("Describe raw material availability")}
            />
          </div>
          <div>
            {renderLabel('rawMaterialQuantity', 'Raw Material Quantity')}
            <Input
              value={stepData.rawMaterialQuantity || ''}
              onChange={(e) => handleInputChange('rawMaterialQuantity', e.target.value)}
              placeholder={tf("Enter quantity")}
            />
          </div>
        </div>
        <div>
          {renderLabel('industrialInfrastructure', 'Industrial Infrastructure')}
          <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.industrialInfrastructure || ''}
            onChange={(e) => handleInputChange('industrialInfrastructure', e.target.value)}
            placeholder={tf("Describe industrial infrastructure")}
          />
        </div>
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-4">{tf("Connectivity")}</h3>
          <div className="space-y-4">
            <div>
              {renderLabel('connectivity', 'Road')}
              <Input
                value={stepData.connectivity?.road || ''}
                onChange={(e) => handleInputChange('connectivity', {
                  ...stepData.connectivity,
                  road: e.target.value,
                })}
                placeholder={tf("Enter road connectivity details")}
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
                placeholder={tf("Enter rail connectivity details")}
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
                placeholder={tf("Enter port connectivity details")}
              />
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    );
  }

  // Step 4: Unit profile
  if (contentStep === 4) {
    return (
      <div className="space-y-6">
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={contentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div>
          {renderLabel(
            'presentActivities',
            isLeanUnit ? 'Present / proposed activity summary' : 'Present Activities'
          )}
          <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.presentActivities || ''}
            onChange={(e) => handleInputChange('presentActivities', e.target.value)}
            placeholder={
              isLeanUnit
                ? tf('Present or proposed activity summary')
                : tf('Describe present activities')
            }
          />
        </div>
        {isLeanUnit ? (
          <div className="form-field-grid">
            <div>
              {renderLabel('yearOfEstablishment', 'Start Date')}
              <Input
                type="date"
                value={toDateInputValue(stepData.yearOfEstablishment)}
                onChange={(e) => {
                  const next = e.target.value;
                  if (next && !isReasonableIsoDate(next)) {
                    toast.error(tf('Enter a valid date between 1990 and 2100'));
                    return;
                  }
                  if (next && stepData.commitmentDate && toDateInputValue(stepData.commitmentDate) && next > toDateInputValue(stepData.commitmentDate)) {
                    toast.error(tf('Commitment Date must be on or after Start Date'));
                    return;
                  }
                  handleInputChange('yearOfEstablishment', next);
                }}
              />
            </div>
            <div>
              {renderLabel('commitmentDate', 'Commitment Date')}
              <Input
                type="date"
                value={toDateInputValue(stepData.commitmentDate)}
                onChange={(e) => {
                  const next = e.target.value;
                  if (next && !isReasonableIsoDate(next)) {
                    toast.error(tf('Enter a valid date between 1990 and 2100'));
                    return;
                  }
                  const start = toDateInputValue(stepData.yearOfEstablishment);
                  if (next && start && next < start) {
                    toast.error(tf('Commitment Date must be on or after Start Date'));
                    return;
                  }
                  handleInputChange('commitmentDate', next);
                }}
              />
            </div>
          </div>
        ) : (
        <div>
          {renderLabel('yearOfEstablishment', 'Year of Establishment')}
          <Input
            type="number"
            min={1900}
            max={new Date().getFullYear()}
            value={stepData.yearOfEstablishment || ''}
            onChange={(e) => handleInputChange('yearOfEstablishment', parseInt(e.target.value) || 0)}
            placeholder={tf('YYYY')}
          />
        </div>
        )}
        <div>
          {renderLabel(
            'technologyLevel',
            isLeanUnit ? 'Tools / process level' : 'Technology Level'
          )}
          <Input
            value={stepData.technologyLevel || ''}
            onChange={(e) => handleInputChange('technologyLevel', e.target.value)}
            placeholder={tf('Enter technology level')}
          />
        </div>
        <div>
          {renderLabel(
            'productionCapacity',
            isLeanUnit ? 'Capacity / throughput (if applicable)' : 'Production Capacity'
          )}
          <Input
            value={stepData.productionCapacity || extras.installedCapacity || ''}
            onChange={(e) => {
              handleInputChange('productionCapacity', e.target.value);
              if (isPmegp || isPmegp2nd || isStandup || isPmfme || isSclcss || isApTech || isApEdp)
                updateExtras({ installedCapacity: e.target.value });
            }}
            placeholder={
              isLeanUnit
                ? tf('e.g. 50 kg/hour or 1000 units/month')
                : tf('Enter production capacity')
            }
          />
        </div>
        {(isPmegp2nd || isApTech) && (
        <div>
            <label className="block text-sm font-medium mb-2">
              <FieldPrompt label="Existing capacity (before upgrade)" />
            </label>
          <Input
              value={extras.existingCapacity || ''}
              onChange={(e) => updateExtras({ existingCapacity: e.target.value })}
              placeholder={tf('e.g. 200 units/day')}
          />
        </div>
        )}
        {(isPmegp || isPmegp2nd || isStandup || isPmfme || isSclcss || isApTech || isApEdp) && (
        <div>
            <label className="block text-sm font-medium mb-2">
              <FieldPrompt label="Capacity utilisation Year 1 (%)" />
            </label>
          <Input
              type="number" min={0} max={100}
              value={extras.capacityUtilisationY1 || ''}
              onChange={(e) => updateExtras({ capacityUtilisationY1: e.target.value })}
              placeholder={isPmfme ? tf('e.g. 60 (NIFTEM models ramp 60→70→80)') : tf('e.g. 60')}
          />
        </div>
        )}
        {isLeanUnit && (
          <ProductMixEditor value={stepData.productMix} onChange={(next) => handleInputChange('productMix', next)} />
        )}
        {isApCmep && (
          <div className="form-field-grid">
        <div>
              <label className="block text-sm font-medium mb-2"><FieldPrompt label="Number of looms / machines" /></label>
              <Input type="number" value={stepData.loomCount || ''} onChange={(e) => handleInputChange('loomCount', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"><FieldPrompt label="Shifts per day" /></label>
              <Input type="number" value={stepData.shifts || ''} onChange={(e) => handleInputChange('shifts', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        )}
        {isPmfme && (
        <div>
            <label className="block text-sm font-medium mb-2"><FieldPrompt label="Proposed workers (nos.)" /></label>
          <Input
              type="number"
              value={extras.proposedWorkers || ''}
              onChange={(e) => updateExtras({ proposedWorkers: e.target.value })}
              placeholder={tf('e.g. 6')}
            />
          </div>
        )}
        {!isLeanUnit && (
          <>
        <div>
          {renderLabel('clusterEvolution', 'How your unit evolved')}
          <ExpandableTextarea
            className="w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.clusterEvolution || ''}
            onChange={(e) => handleInputChange('clusterEvolution', e.target.value)}
            placeholder={tf("Describe how the unit evolved")}
          />
        </div>
        <div>
          {renderLabel('typeOfUnits', 'Type of unit')}
          <Input
            value={stepData.typeOfUnits || ''}
            onChange={(e) => handleInputChange('typeOfUnits', e.target.value)}
            placeholder={tf("Enter type of units")}
          />
        </div>
        <div>
          {renderLabel('stakeholders', 'Stakeholders')}
          <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={normalizeToString(stepData.stakeholders)}
            onChange={(e) => handleCommaSeparatedChange('stakeholders', e.target.value)}
            placeholder={tf("Enter stakeholders separated by commas (e.g., Stakeholder 1, Stakeholder 2, Stakeholder 3)")}
          />
          <p className="text-xs text-muted-foreground mt-1">{tf("Separate multiple stakeholders with commas")}</p>
        </div>
          </>
        )}
      </div>
    );
  }

  // Step 5: Value Chain Details
  if (contentStep === 5) {
    return (
      <div className="space-y-6">
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={contentStep}
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
                  <span className="text-sm font-medium">{tf('Raw Material {n}').replace('{n}', String(index + 1))}</span>
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
                    placeholder={tf("Material name")}
                  />
                  <Input
                    value={material.source || ''}
                    onChange={(e) => handleArrayUpdate('rawMaterials', index, { source: e.target.value })}
                    placeholder={tf("Source")}
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
              {tf('Add Raw Material')}
            </Button>
          </div>
        </div>

        <div>
          {renderLabel('intermediateProducts', 'Intermediate Products')}
          <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={normalizeToString(stepData.intermediateProducts)}
            onChange={(e) => handleCommaSeparatedChange('intermediateProducts', e.target.value)}
            placeholder={tf("Enter intermediate products separated by commas (e.g., Semi-finished Product 1, Semi-finished Product 2)")}
          />
          <p className="text-xs text-muted-foreground mt-1">{tf("Separate multiple products with commas")}</p>
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
                  placeholder={tf("Enter final product")}
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
              {tf('Add Final Product')}
            </Button>
          </div>
        </div>

        <div>
          {renderLabel('valueAdditionStages', 'Value Addition Stages')}
          <div className="space-y-4">
            {(Array.isArray(stepData.valueAdditionStages) ? stepData.valueAdditionStages : []).map((stage: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{tf('Stage {n}').replace('{n}', String(index + 1))}</span>
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
                    placeholder={tf("Stage name")}
                  />
                  <Input
                    type="number"
                    value={stage.sellingPrice || ''}
                    onChange={(e) => handleArrayUpdate('valueAdditionStages', index, { sellingPrice: parseFloat(e.target.value) || 0 })}
                    placeholder={tf("Selling price (₹ Lakhs)")}
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
              {tf('Add Value Addition Stage')}
            </Button>
          </div>
        </div>

        <div>
          {renderLabel('majorBuyers', 'Major Buyers')}
          <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={normalizeToString(stepData.majorBuyers)}
            onChange={(e) => handleCommaSeparatedChange('majorBuyers', e.target.value)}
            placeholder={tf("Enter major buyers separated by commas (e.g., Buyer 1, Buyer 2, Buyer 3)")}
          />
          <p className="text-xs text-muted-foreground mt-1">{tf("Separate multiple buyers with commas")}</p>
        </div>
      </div>
    );
  }

  // Step 6: Market Assessment
  if (contentStep === 6) {
    return (
      <div className="space-y-6">
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={contentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div>
          {renderLabel(
            'targetMarket',
            isLeanUnit ? 'Target customers / market' : 'Target Market'
          )}
          <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.targetMarket || ''}
            onChange={(e) => handleInputChange('targetMarket', e.target.value)}
            placeholder={tf('Describe target market')}
          />
        </div>
        <div>
          {renderLabel('existingDemand', isLeanUnit ? 'Demand / footfall note' : 'Existing Demand')}
          <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.existingDemand || ''}
            onChange={(e) => handleInputChange('existingDemand', e.target.value)}
            placeholder={tf('Describe existing demand')}
          />
        </div>
        {isPmfme && (
        <div>
            <label className="block text-sm font-medium mb-2">
              <FieldPrompt label="Sources of raw material" />
            </label>
            <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={extras.rawMaterialSources || ''}
              onChange={(e) => updateExtras({ rawMaterialSources: e.target.value })}
              placeholder={tf('Farmers / mandi / contract sourcing — MoFPI DPR requirement')}
          />
        </div>
        )}
        {isStandup && (
        <div>
            {renderLabel(
              'competitorAnalysis',
              'Major competitors + your strengths / weaknesses'
            )}
            <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={stepData.competitorAnalysis || ''}
              onChange={(e) => handleInputChange('competitorAnalysis', e.target.value)}
              placeholder={tf('Bank checklist — competitors and how you win')}
            />
          </div>
        )}
        {!isLeanUnit && (
          <>
        <div>
          {renderLabel('demandSupplyGap', 'Demand-Supply Gap')}
          <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.demandSupplyGap || ''}
            onChange={(e) => handleInputChange('demandSupplyGap', e.target.value)}
            placeholder={tf("Describe demand-supply gap")}
          />
        </div>
        <div>
          {renderLabel('competitorAnalysis', 'Competitor Analysis')}
          <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.competitorAnalysis || ''}
            onChange={(e) => handleInputChange('competitorAnalysis', e.target.value)}
            placeholder={tf("Describe competitor analysis")}
          />
        </div>
        <div>
          {renderLabel('priceTrends', 'Price Trends')}
          <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.priceTrends || ''}
            onChange={(e) => handleInputChange('priceTrends', e.target.value)}
            placeholder={tf("Describe price trends")}
          />
        </div>
        <div>
          {renderLabel('exportPotential', 'Export Potential')}
          <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.exportPotential || ''}
            onChange={(e) => handleInputChange('exportPotential', e.target.value)}
            placeholder={tf("Describe export potential")}
          />
        </div>
          </>
        )}
      </div>
    );
  }

  // Step 7: Gap Analysis
  if (contentStep === 7) {
    return (
      <div className="space-y-6">
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={contentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div>
          {renderLabel('technologyGaps', 'Technology Gaps')}
          <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.technologyGaps || ''}
            onChange={(e) => handleInputChange('technologyGaps', e.target.value)}
            placeholder={tf("Describe technology gaps")}
          />
        </div>
        <div>
          {renderLabel('infrastructureGaps', 'Infrastructure Gaps')}
          <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.infrastructureGaps || ''}
            onChange={(e) => handleInputChange('infrastructureGaps', e.target.value)}
            placeholder={tf("Describe infrastructure gaps")}
          />
        </div>
        <div>
          {renderLabel('skillGaps', 'Skill Gaps')}
          <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.skillGaps || ''}
            onChange={(e) => handleInputChange('skillGaps', e.target.value)}
            placeholder={tf("Describe skill gaps")}
          />
        </div>
        <div>
          {renderLabel('marketingGaps', 'Marketing Gaps')}
          <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.marketingGaps || ''}
            onChange={(e) => handleInputChange('marketingGaps', e.target.value)}
            placeholder={tf("Describe marketing gaps")}
          />
        </div>
        <div>
          {renderLabel('financialGaps', 'Financial Gaps')}
          <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.financialGaps || ''}
            onChange={(e) => handleInputChange('financialGaps', e.target.value)}
            placeholder={tf("Describe financial gaps")}
          />
        </div>
        <div>
          {renderLabel('justificationForIntervention', 'Justification for Intervention')}
          <ExpandableTextarea
            className="w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.justificationForIntervention || ''}
            onChange={(e) => handleInputChange('justificationForIntervention', e.target.value)}
            placeholder={tf("Provide justification for intervention")}
          />
        </div>
      </div>
    );
  }

  // Step 8: SWOT Analysis
  if (contentStep === 8) {
    return (
      <div className="space-y-6">
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={contentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div>
          {renderLabel('strengths', 'Strengths')}
          <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={normalizeToString(stepData.strengths)}
            onChange={(e) => handleCommaSeparatedChange('strengths', e.target.value)}
            placeholder={tf("Enter strengths separated by commas (e.g., Strong market presence, Skilled workforce, Good infrastructure)")}
          />
          <p className="text-xs text-muted-foreground mt-1">{tf("Separate multiple strengths with commas")}</p>
        </div>
        <div>
          {renderLabel('weaknesses', 'Weaknesses')}
          <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={normalizeToString(stepData.weaknesses)}
            onChange={(e) => handleCommaSeparatedChange('weaknesses', e.target.value)}
            placeholder={tf("Enter weaknesses separated by commas (e.g., Limited technology, Lack of skilled workers, Poor infrastructure)")}
          />
          <p className="text-xs text-muted-foreground mt-1">{tf("Separate multiple weaknesses with commas")}</p>
        </div>
        <div>
          {renderLabel('opportunities', 'Opportunities')}
          <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={normalizeToString(stepData.opportunities)}
            onChange={(e) => handleCommaSeparatedChange('opportunities', e.target.value)}
            placeholder={tf("Enter opportunities separated by commas (e.g., Growing market demand, Government support, Export potential)")}
          />
          <p className="text-xs text-muted-foreground mt-1">{tf("Separate multiple opportunities with commas")}</p>
        </div>
        <div>
          {renderLabel('threats', 'Threats')}
          <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={normalizeToString(stepData.threats)}
            onChange={(e) => handleCommaSeparatedChange('threats', e.target.value)}
            placeholder={tf("Enter threats separated by commas (e.g., Market competition, Price fluctuations, Regulatory changes)")}
          />
          <p className="text-xs text-muted-foreground mt-1">{tf("Separate multiple threats with commas")}</p>
        </div>
      </div>
    );
  }

  // Step 9: Proposed Interventions
  if (contentStep === 9) {
    return (
      <div className="space-y-6">
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={contentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div>
          {renderLabel('interventionType', 'Intervention Type', true)}
          <ExpandableSelect
            data-required-field="interventionType"
            className={fieldRing('interventionType', 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm')}
            value={stepData.interventionType || ''}
            onChange={(e) => handleInputChange('interventionType', e.target.value)}
          >
            <option value="">{tf("Select type")}</option>
            <option value="Hard">{tf("Hard")}</option>
            <option value="Soft">{tf("Soft")}</option>
            <option value="Both">{tf("Both")}</option>
          </ExpandableSelect>
          {requiredHint('interventionType')}
        </div>
        <div>
          {renderLabel('description', 'Description')}
          <ExpandableTextarea
            className="w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder={tf("Describe the intervention")}
          />
        </div>
        <div>
          {renderLabel('objectives', 'Objectives')}
          <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={normalizeToString(stepData.objectives)}
            onChange={(e) => handleCommaSeparatedChange('objectives', e.target.value)}
            placeholder={tf("Enter objectives separated by commas (e.g., Objective 1, Objective 2, Objective 3)")}
          />
          <p className="text-xs text-muted-foreground mt-1">{tf("Separate multiple objectives with commas")}</p>
        </div>
        <div>
          {renderLabel('expectedBenefits', 'Expected Benefits')}
          <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={normalizeToString(stepData.expectedBenefits)}
            onChange={(e) => handleCommaSeparatedChange('expectedBenefits', e.target.value)}
            placeholder={tf("Enter expected benefits separated by commas (e.g., Benefit 1, Benefit 2, Benefit 3)")}
          />
          <p className="text-xs text-muted-foreground mt-1">{tf("Separate multiple benefits with commas")}</p>
        </div>
      </div>
    );
  }

  // Step 10: Common Facility Centre (CFC) Details
  if (contentStep === 10) {
    return (
      <div className="space-y-6">
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={contentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div className="form-field-grid">
          <div>
            {renderLabel(
              'name',
              isLeanUnit ? 'Shop / shed / workplace' : 'Unit / shed / workplace name',
              true
            )}
            <Input
              data-required-field="name"
              className={fieldRing('name')}
              value={stepData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder={
                isLeanUnit
                  ? tf('Shop or shed name / brief description')
                  : tf('Enter workplace or shed name')
              }
            />
            {requiredHint('name')}
          </div>
          {!isLeanUnit && (
          <div>
            {renderLabel('location', 'Location', true)}
            <Input
              data-required-field="location"
              className={fieldRing('location')}
              value={stepData.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder={tf("Enter location")}
            />
            {requiredHint('location')}
          </div>
          )}
        </div>
        <div>
          {renderLabel(
            'landDetails',
            isLeanUnit ? 'Premises note (own / lease / rent)' : 'Land Details'
          )}
          <ExpandableTextarea
            allowImprove={false}
            expandTitle={isLeanUnit ? 'Premises note (own / lease / rent)' : 'Land Details'}
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.landDetails || ''}
            onChange={(e) => handleInputChange('landDetails', e.target.value)}
            placeholder={
              isLeanUnit
                ? tf('Own / lease / rent — how premises are held')
                : tf('Enter land details')
            }
          />
        </div>
        {isLeanUnit ? (
          <div className="space-y-4">
            {(isMudra ||
              isStandup ||
              isPmfme ||
              isSclcss ||
              isApTech ||
              isApEdp ||
              isVishwakarma ||
              isSvanidhi) && (
              <div>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Premises — owned / rented" /></label>
                <ExpandableSelect
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={
                    isSvanidhi
                      ? extras.vendingType || extras.workplaceType || ''
                      : extras.workplaceType || extras.premisesType || ''
                  }
                  onChange={(e) =>
                    updateExtras(
                      isSvanidhi
                        ? { vendingType: e.target.value, workplaceType: e.target.value }
                        : isVishwakarma
                          ? { workplaceType: e.target.value }
                          : { premisesType: e.target.value }
                    )
                  }
                >
                  <option value="">{tf('Select')}</option>
                  {(isSvanidhi
                    ? SVANIDHI_VENDING_OPTIONS
                    : isVishwakarma
                    ? VISHWAKARMA_WORKPLACE_OPTIONS
                    : isApEdp
                    ? AP_EDP_PREMISES_OPTIONS
                    : isApTech
                    ? AP_TECH_PREMISES_OPTIONS
                    : isSclcss
                      ? SCLCSS_PREMISES_OPTIONS
                      : isPmfme
                        ? PMFME_PREMISES_OPTIONS
                        : isStandup
                          ? STANDUP_PREMISES_OPTIONS
                          : MUDRA_PREMISES_OPTIONS
                  ).map((o) => (
                    <option key={o.value} value={o.value}>
                      {tf(o.label)}
                    </option>
                  ))}
                </ExpandableSelect>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">
                <FieldPrompt label="Power requirement (HP / kW) — optional" />
              </label>
              <Input
                value={extras.powerRequirement || stepData.powerRequirements || ''}
                onChange={(e) => {
                  if (
                    isPmegp ||
                    isPmegp2nd ||
                    isPmfme ||
                    isSclcss ||
                    isApTech ||
                    isApEdp ||
                    isVishwakarma ||
                    isSvanidhi
                  )
                    updateExtras({ powerRequirement: e.target.value });
                  handleInputChange('powerRequirements', e.target.value);
                }}
                placeholder={tf('e.g. 8 kW')}
              />
            </div>
            {isApCmep && (
              <div className="form-field-grid">
                <div>
                  <label className="block text-sm font-medium mb-2"><FieldPrompt label="Workshop area (sq.ft.)" /></label>
                  <Input type="number" value={stepData.workshopAreaSqft || ''} onChange={(e) => handleInputChange('workshopAreaSqft', parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2"><FieldPrompt label="Production floor (sq.ft.)" /></label>
                  <Input type="number" value={stepData.productionAreaSqft || ''} onChange={(e) => handleInputChange('productionAreaSqft', parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2"><FieldPrompt label="Storage / packing area (sq.ft.)" /></label>
                  <Input type="number" value={stepData.storageAreaSqft || ''} onChange={(e) => handleInputChange('storageAreaSqft', parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2"><FieldPrompt label="Office area (sq.ft.)" /></label>
                  <Input type="number" value={stepData.officeAreaSqft || ''} onChange={(e) => handleInputChange('officeAreaSqft', parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2"><FieldPrompt label="Lease period (years)" /></label>
                  <Input type="number" value={stepData.leaseYears || ''} onChange={(e) => handleInputChange('leaseYears', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2"><FieldPrompt label="Water use and dye wastewater" /></label>
                  <ExpandableTextarea
                    allowImprove={false}
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={stepData.waterAndEffluent || ''}
                    onChange={(e) => handleInputChange('waterAndEffluent', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
        <div>
          {renderLabel('civilWorks', 'Civil Works')}
          <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.civilWorks || ''}
            onChange={(e) => handleInputChange('civilWorks', e.target.value)}
            placeholder={tf("Describe civil works")}
          />
        </div>
        <div>
          {renderLabel('manufacturingProcess', kindLabel('Manufacturing Process', kind))}
          <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.manufacturingProcess || ''}
            onChange={(e) => handleInputChange('manufacturingProcess', e.target.value)}
            placeholder={tf("Describe manufacturing process")}
          />
        </div>
        <div>
          {renderLabel('plantAndMachinery', 'Plant & Machinery')}
          <ExpandableTextarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={stepData.plantAndMachinery || ''}
            onChange={(e) => handleInputChange('plantAndMachinery', e.target.value)}
            placeholder={tf("Describe plant & machinery")}
          />
        </div>
        <div>
          {renderLabel('capacity', 'Capacity')}
          <Input
            value={stepData.capacity || ''}
            onChange={(e) => handleInputChange('capacity', e.target.value)}
            placeholder={tf("Enter capacity")}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            {renderLabel('powerRequirements', 'Power Requirements')}
            <Input
              value={stepData.powerRequirements || ''}
              onChange={(e) => handleInputChange('powerRequirements', e.target.value)}
              placeholder={tf("Enter power requirements")}
            />
          </div>
          <div>
            {renderLabel('waterRequirements', 'Water Requirements')}
            <Input
              value={stepData.waterRequirements || ''}
              onChange={(e) => handleInputChange('waterRequirements', e.target.value)}
              placeholder={tf("Enter water requirements")}
            />
          </div>
          <div>
            {renderLabel('manpowerRequirements', 'Manpower Requirements')}
            <Input
              value={stepData.manpowerRequirements || ''}
              onChange={(e) => handleInputChange('manpowerRequirements', e.target.value)}
              placeholder={tf("Enter manpower requirements")}
            />
          </div>
        </div>
          </>
        )}
      </div>
    );
  }

  // Step 11: SPV Details
  if (contentStep === 11) {
    return (
      <div className="space-y-6">
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={contentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div className="form-field-grid">
          <div>
            {renderLabel(
              'spvName',
              isLeanUnit ? 'Firm / proprietor name' : 'Applicant / firm name',
              true
            )}
            <Input
              value={stepData.spvName || ''}
              onChange={(e) => handleInputChange('spvName', e.target.value)}
              placeholder={tf('Enter applicant or firm name')}
            />
            <ReusedNote data={data} path="step11.spvName" text="Filled in from your unit details. Change it if the applicant is different." />
          </div>
          <div>
            {renderLabel(
              'legalStatus',
              isLeanUnit ? 'Legal status (sole / partnership / company)' : 'Legal Status'
            )}
            <Input
              value={stepData.legalStatus || ''}
              onChange={(e) => handleInputChange('legalStatus', e.target.value)}
              placeholder={
                isLeanUnit
                  ? tf('Sole proprietorship / partnership / company')
                  : tf('Enter legal status')
              }
            />
          </div>
        </div>
        <div className="form-field-grid">
          <div>
            {renderLabel('gstin', 'GSTIN (optional)')}
            <Input
              format="gstin"
              data-format-field="gstin"
              value={stepData.gstin || ''}
              onChange={(e) => handleInputChange('gstin', e.target.value)}
              hint={tf('15 characters. Leave blank if the firm has no GST registration.')}
            />
          </div>
          <div>
            {renderLabel('firmPan', 'Firm PAN (optional)')}
            <Input
              format="pan"
              firmPanOnly
              data-format-field="firmPan"
              value={stepData.firmPan || ''}
              onChange={(e) => handleInputChange('firmPan', e.target.value)}
              hint={tf('The firm’s or company’s PAN. Do not enter a personal PAN.')}
            />
          </div>
          <div>
            {renderLabel('udyamNumber', 'Udyam registration number (optional)')}
            <Input
              format="udyam"
              data-format-field="udyamNumber"
              value={stepData.udyamNumber || ''}
              onChange={(e) => handleInputChange('udyamNumber', e.target.value)}
              hint={tf('Type the letters and digits; the hyphens are added for you.')}
            />
          </div>
          <div>
            {renderLabel('applicantMobile', 'Contact mobile number (optional)')}
            <Input
              format="mobile"
              data-format-field="applicantMobile"
              value={stepData.applicantMobile || ''}
              onChange={(e) => handleInputChange('applicantMobile', e.target.value)}
              hint={tf('10 digits, starting with 6, 7, 8 or 9.')}
            />
          </div>
        </div>
        {isLeanUnit ? (
          <>
          <div>
            {renderLabel('address', 'Correspondence address')}
            <ExpandableTextarea
              allowImprove={false}
              expandTitle="Correspondence address"
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={stepData.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder={tf('Full correspondence address for KYC')}
            />
            <ReusedNote data={data} path="step11.address" text="Started from your town and district. Add the full street address." />
          </div>
          {isApCmep && (
            <CmepPromotersEditor
              value={stepData.promoters}
              onChange={(next) => handleInputChange('promoters', next)}
            />
          )}
          </>
        ) : (
          <>
        <div className="form-field-grid">
          <div>
            {renderLabel('yearOfIncorporation', 'Year of establishment')}
            <Input
              type="number" min={1900} max={new Date().getFullYear()}
              value={stepData.yearOfIncorporation || ''}
              onChange={(e) => handleInputChange('yearOfIncorporation', parseInt(e.target.value) || 0)}
              placeholder={tf("YYYY")}
            />
          </div>
          <div>
            {renderLabel('submittedTo', 'Submitted To')}
            <Input
              value={stepData.submittedTo || ''}
              onChange={(e) => handleInputChange('submittedTo', e.target.value)}
              placeholder={tf("e.g., DIC, District")}
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
                  placeholder={tf("Enter objective")}
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
              {tf('Add Objective')}
            </Button>
          </div>
        </div>
        <div>
          {renderLabel('boardOfDirectors', 'Owner(s)')}
          <ExpandableTextarea
            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={
              Array.isArray(stepData.boardOfDirectors)
                ? stepData.boardOfDirectors.map((d: any) => d?.name).filter(Boolean).join(', ')
                : (stepData.owners || '')
            }
            onChange={(e) => {
              const names = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
              const latest = getStepData(contentStep) || {};
              setStepData(contentStep, {
                ...latest,
                owners: e.target.value,
                boardOfDirectors: names.map((name) => ({ name, designation: 'Owner' })),
              });
            }}
            placeholder={tf("Owner names, separated by commas")}
          />
        </div>
          </>
        )}
      </div>
    );
  }

  // Step 12: Project Cost Details
  if (contentStep === 12) {
    const simpleCapex = hideComplexCapex(schemeCode, data.ventureMatchAnswers?.budget);
    const keepFci = schemeCode === 'AP_EDP';
    const showHeavy = keepFci || !simpleCapex;
    const totalCost =
      toFiniteNumber(stepData.land) +
      toFiniteNumber(stepData.building) +
      toFiniteNumber(stepData.machinery) +
      toFiniteNumber(stepData.utilitiesAndInfrastructure) +
      toFiniteNumber(stepData.preliminaryAndPreOperative) +
      toFiniteNumber(stepData.workingCapitalMargin) +
      (isApCmep || isApEdp ? toFiniteNumber(stepData.furniture) + toFiniteNumber(stepData.securityDeposits) : 0);

    return (
      <div className="space-y-6">
        <ScheduleParties data={data} />
        <FinanceCalcStrip contentStep={12} data={data} onApply={applyCalc} />
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={contentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        {simpleCapex && (
          <p className="text-sm text-muted-foreground">
            {tf('Heavy capex tables are hidden for Mudra Shishu / Kishore. Enter machinery and working-capital margin only.')}
          </p>
        )}
        {isApCmep && (
          <>
            <CmepCostPhasingEditor
              step={stepData}
              onChange={(patch) => {
                const latest = getStepData(contentStep) || {};
                setStepData(contentStep, { ...latest, ...patch });
              }}
            />
            <CmepMachineryEditor
              detailed
              value={stepData.machineryItems}
              onChange={(next) => {
                const latest = getStepData(contentStep) || {};
                const patch: Record<string, unknown> = { machineryItems: next };
                if (next.some((row) => row.description || row.unitCost)) patch.machinery = machineryTotalLakhs(next, true);
                setStepData(contentStep, { ...latest, ...patch });
              }}
            />
            <WorkingCapitalBuildupEditor
              step={stepData}
              onChange={(patch) => {
                const latest = getStepData(contentStep) || {};
                setStepData(contentStep, { ...latest, ...patch });
              }}
            />
          </>
        )}
        {!isApCmep && <BusinessKindPicker data={data} onChange={setKind} />}
        {!isApCmep && kind === 'manufacturing' && (isLeanUnit || scale !== 'tiny') && (
          <CmepMachineryEditor
            value={stepData.machineryItems}
            onChange={(next) => {
              const latest = getStepData(contentStep) || {};
              const patch: Record<string, unknown> = { machineryItems: next };
              if (next.some((row) => row.description || row.unitCost)) patch.machinery = machineryTotalLakhs(next, false);
              setStepData(contentStep, { ...latest, ...patch });
            }}
          />
        )}
        {!isApCmep && kind !== 'manufacturing' && (
          <AssetListEditor
            value={stepData.assetItems}
            collapsedWhenEmpty={scale === 'tiny'}
            onChange={(items, total) => {
              const latest = getStepData(contentStep) || {};
              const patch: Record<string, unknown> = { assetItems: items };
              if (items.some((row) => row.item || row.unitCost)) patch.machinery = total;
              setStepData(contentStep, { ...latest, ...patch });
            }}
          />
        )}
        <div className="form-field-grid">
          {showHeavy && !isApCmep && (
            <>
              <div>
                {renderLabel(
                  'land',
                  isLeanUnit ? 'Land / building / workshed — land (₹ Lakhs)' : 'Land / FCI land (₹ Lakhs)'
                )}
                <Input
                  type="number"
                  value={stepData.land === '' || stepData.land == null ? '' : toFiniteNumber(stepData.land)}
                  onChange={(e) => handleInputChange('land', parseFloat(e.target.value) || 0)}
                  placeholder={tf("0")}
                />
              </div>
              <div>
                {renderLabel(
                  'building',
                  isLeanUnit ? 'Land / building / workshed — building (₹ Lakhs)' : 'Building / shed (₹ Lakhs)'
                )}
                <Input
                  type="number"
                  value={stepData.building === '' || stepData.building == null ? '' : toFiniteNumber(stepData.building)}
                  onChange={(e) => handleInputChange('building', parseFloat(e.target.value) || 0)}
                  placeholder={tf("0")}
                />
              </div>
            </>
          )}
          {!isLeanUnit && (
          <div>
            {renderLabel('machinery', kindLabel('Plant & machinery (₹ Lakhs)', kind))}
            <Input
              type="number"
              value={stepData.machinery === '' || stepData.machinery == null ? '' : toFiniteNumber(stepData.machinery)}
              onChange={(e) => handleInputChange('machinery', parseFloat(e.target.value) || 0)}
              placeholder={tf("0")}
            />
          </div>
          )}
          {showHeavy && (
            <>
              <div>
                {renderLabel(
                  'utilitiesAndInfrastructure',
                  isLeanUnit ? 'Furniture & fixtures (₹ Lakhs)' : 'Utilities & Infrastructure (₹ Lakhs)'
                )}
                <Input
                  type="number"
                  value={
                    stepData.utilitiesAndInfrastructure === '' || stepData.utilitiesAndInfrastructure == null
                      ? ''
                      : toFiniteNumber(stepData.utilitiesAndInfrastructure)
                  }
                  onChange={(e) =>
                    handleInputChange('utilitiesAndInfrastructure', parseFloat(e.target.value) || 0)
                  }
                  placeholder={tf("0")}
                />
              </div>
              <div>
                {renderLabel(
                  'preliminaryAndPreOperative',
                  isPmegp
                    ? 'Preliminary & pre-operative (₹ Lakhs)'
                    : 'Preliminary & Pre-operative (₹ Lakhs)'
                )}
                <Input
                  type="number"
                  value={
                    stepData.preliminaryAndPreOperative === '' || stepData.preliminaryAndPreOperative == null
                      ? ''
                      : toFiniteNumber(stepData.preliminaryAndPreOperative)
                  }
                  onChange={(e) =>
                    handleInputChange('preliminaryAndPreOperative', parseFloat(e.target.value) || 0)
                  }
                  placeholder={tf("0")}
                />
              </div>
            </>
          )}
          {isApEdp && (
            <>
          <div>
                {renderLabel('furniture', 'Furniture and fixtures (₹ Lakhs)')}
                <Input type="number" value={stepData.furniture || ''} onChange={(e) => handleInputChange('furniture', parseFloat(e.target.value) || 0)} placeholder={tf('0')} />
              </div>
              <div>
                {renderLabel('securityDeposits', 'Security deposits (₹ Lakhs)')}
                <Input type="number" value={stepData.securityDeposits || ''} onChange={(e) => handleInputChange('securityDeposits', parseFloat(e.target.value) || 0)} placeholder={tf('0')} />
              </div>
            </>
          )}
          {!isApCmep && (
          <div>
            {renderLabel(
              'workingCapitalMargin',
              isLeanUnit ? 'Working capital (₹ Lakhs)' : 'Working Capital Margin (₹ Lakhs)'
            )}
            <Input
              type="number"
              value={
                stepData.workingCapitalMargin === '' || stepData.workingCapitalMargin == null
                  ? ''
                  : toFiniteNumber(stepData.workingCapitalMargin)
              }
              onChange={(e) => handleInputChange('workingCapitalMargin', parseFloat(e.target.value) || 0)}
              placeholder={tf("0")}
            />
          </div>
          )}
        </div>
        <div className="border-t pt-4">
          <div className="bg-primary/10 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">{tf("Total Project Cost")}</span>
              <span className="text-2xl font-bold text-primary">₹ {totalCost.toLocaleString('en-IN')} {tf("Lakhs")}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 13: Means of Finance
  if (contentStep === 13) {
    const total =
      toFiniteNumber(stepData.spvContribution) +
      toFiniteNumber(stepData.governmentGrant) +
      toFiniteNumber(stepData.bankLoan) +
      toFiniteNumber(stepData.otherSources);
    const step12 = getStepData(12) || {};
    const projectCostFromStep12 =
      toFiniteNumber(step12.land) +
      toFiniteNumber(step12.building) +
      toFiniteNumber(step12.machinery) +
      toFiniteNumber(step12.utilitiesAndInfrastructure) +
      toFiniteNumber(step12.preliminaryAndPreOperative) +
      toFiniteNumber(step12.workingCapitalMargin) +
      (isApCmep || isApEdp ? toFiniteNumber(step12.furniture) + toFiniteNumber(step12.securityDeposits) : 0);

    return (
      <div className="space-y-6">
        <ScheduleParties data={data} />
        <FinanceCalcStrip contentStep={13} data={data} onApply={applyCalc} />
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={contentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        {isApCmep && (
          <CmepLoanTermsEditor step={stepData} onChange={handleInputChange} />
        )}
        {isLeanUnit && !isApCmep && (
          <CmepLoanTermsEditor includeSubsidy={false} step={stepData} onChange={handleInputChange} />
        )}
        <div className="form-field-grid">
          <div>
            {renderLabel(
              'spvContribution',
              isPmegp
                ? 'Own contribution (₹ Lakhs) — typically 10% general / 5% special'
                : isPmegp2nd
                  ? 'Own contribution (₹ Lakhs) — 10% for all categories'
                  : isMudra ||
                      isStandup ||
                      isPmfme ||
                      isSclcss ||
                      isApTech ||
                      isApEdp ||
                      isVishwakarma ||
                      isSvanidhi
                    ? 'Own contribution (₹ Lakhs)'
                    : 'Promoter contribution / equity (₹ Lakhs)'
            )}
            <Input
              data-required-field="spvContribution"
              type="number"
              value={
                stepData.spvContribution === '' || stepData.spvContribution == null
                  ? ''
                  : toFiniteNumber(stepData.spvContribution)
              }
              onChange={(e) => handleInputChange('spvContribution', parseFloat(e.target.value) || 0)}
              placeholder={tf("0")}
            />
          </div>
          <div>
            {renderLabel(
              'governmentGrant',
              isPmegp
                ? 'PMEGP margin money / subsidy (₹ Lakhs)'
                : isPmegp2nd
                  ? 'PMEGP 2nd-loan margin money (₹ Lakhs) — 15% / 20% NER-Hill'
                  : isMudra
                    ? 'Government grant (₹ Lakhs) — usually 0 for MUDRA'
                    : isStandup
                      ? 'Other subsidy / grant if converging (₹ Lakhs) — else 0'
                      : isPmfme
                        ? 'PMFME capital grant (₹ Lakhs) — 35%, cap ₹10 L'
                        : isSclcss
                          ? 'SCLCSS capital subsidy (₹ Lakhs) — 25%, cap ₹25 L'
                          : isApTech
                            ? 'AP tech-upgrade subsidy (₹ Lakhs) — % of FCI by size'
                            : isApEdp
                              ? 'AP EDP capital subsidy (₹ Lakhs) — % of FCI by size'
                              : isVishwakarma
                                ? 'Toolkit e-voucher (₹ Lakhs) — usually 0.15'
                                : isSvanidhi || isEclgs
                                  ? 'Government grant (₹ Lakhs) — usually 0 (guarantee ≠ capital)'
                                  : 'Government Grant (₹ Lakhs)'
            )}
            <Input
              data-required-field="governmentGrant"
              type="number"
              value={
                stepData.governmentGrant === '' || stepData.governmentGrant == null
                  ? ''
                  : toFiniteNumber(stepData.governmentGrant)
              }
              onChange={(e) => handleInputChange('governmentGrant', parseFloat(e.target.value) || 0)}
              placeholder={tf("0")}
            />
          </div>
          <div>
            {renderLabel(
              'bankLoan',
              isPmegp || isPmegp2nd || isMudra || isPmfme
                ? 'Bank term loan + / or WC (₹ Lakhs)'
                : isStandup
                  ? 'Bank composite loan TL + WC (₹ Lakhs)'
                  : isSclcss || isApTech || isApEdp
                    ? 'Bank term loan for P&M (₹ Lakhs)'
                    : isVishwakarma
                      ? 'Enterprise development loan tranche (₹ Lakhs)'
                      : isSvanidhi
                        ? 'WC term loan tranche (₹ Lakhs)'
                        : isEclgs
                          ? 'ECLGS working-capital term loan (₹ Lakhs)'
                          : 'Bank Loan (₹ Lakhs)'
            )}
            <Input
              data-required-field="bankLoan"
              type="number"
              value={
                stepData.bankLoan === '' || stepData.bankLoan == null
                  ? ''
                  : toFiniteNumber(stepData.bankLoan)
              }
              onChange={(e) => handleInputChange('bankLoan', parseFloat(e.target.value) || 0)}
              placeholder={tf("0")}
            />
          </div>
          <div>
            {renderLabel('otherSources', 'Other Sources (₹ Lakhs)')}
            <Input
              type="number"
              value={
                stepData.otherSources === '' || stepData.otherSources == null
                  ? ''
                  : toFiniteNumber(stepData.otherSources)
              }
              onChange={(e) => handleInputChange('otherSources', parseFloat(e.target.value) || 0)}
              placeholder={tf("0")}
            />
          </div>
        </div>
        {isPmegp && (
          <p className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted/40">
            {tf(
              'Own + margin money + bank (+ other) must equal total project cost. Indicative subsidy'
            )}
            : {pmegpSubsidyPercent(extras.pmegpCategory, extras.pmegpArea)}% (
            {extras.pmegpCategory || '—'} / {extras.pmegpArea || '—'}).
          </p>
        )}
        {isPmegp2nd && (
          <p className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted/40">
            {tf(
              'Upgrade MoF: own 10% + uniform MM 15% (20% NER/Hill) + bank. Not first-PMEGP category rates. Indicative MM'
            )}{' '}
            ≈ ₹
            {pmegp2ndIndicativeMmLakhs(
              projectCostFromStep12,
              extras.sectorBand,
              extras.nerHill
            ).toLocaleString('en-IN')}{' '}
            {tf('Lakhs')} · {extras.priorScheme || '—'} / {extras.sectorBand || '—'}.
          </p>
        )}
        {isMudra && (
          <p className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted/40">
            {tf(
              'MUDRA is not a subsidy scheme. Own + bank (+ other) should equal total project cost. Category'
            )}
            : {extras.mudraCategory || '—'}.
          </p>
        )}
        {isStandup && (
          <p className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted/40">
            {tf(
              'Own contribution must be at least 10% of project cost. Own + bank (+ grant/other) = total. Category'
            )}
            : {extras.standupCategory || '—'} · {tf('Min own')} {STANDUP_MIN_OWN_PERCENT}%.
          </p>
        )}
        {isPmfme && (
          <p className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted/40">
            {tf('Credit-linked grant')} {PMFME_SUBSIDY_PERCENT}% {tf('capped at')} ₹
            {PMFME_SUBSIDY_CAP_LAKHS} {tf('L')}. {tf('Min own')} {PMFME_MIN_OWN_PERCENT}%.{' '}
            {tf('Indicative grant for current project cost fields')} ≈ ₹
            {pmfmeIndicativeGrantLakhs(projectCostFromStep12).toLocaleString('en-IN')}{' '}
            {tf('Lakhs')} · {extras.unitStage || '—'} / {tf('ODOP')} {extras.odopAligned || '—'}.
          </p>
        )}
        {isSclcss && (
          <p className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted/40">
            {tf(
              'SCLCSS is 25% capital subsidy on eligible new P&M (cap ₹25 L), not PMEGP margin money. Indicative on machinery field'
            )}{' '}
            ≈ ₹
            {sclcssIndicativeGrantLakhs(toFiniteNumber(step12.machinery)).toLocaleString('en-IN')}{' '}
            {tf('Lakhs')} · {extras.sclcssCategory || '—'} / {tf('stake')} {extras.controllingStakePercent || '—'}%.
          </p>
        )}
        {isApTech && (
          <p className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted/40">
            {tf(
              'AP tech-upgrade subsidy on upgrade FCI — mutually exclusive with new-unit EDP capital subsidy; total incentives ≤ 75% FCI. Indicative'
            )}{' '}
            ≈ ₹
            {apTechIndicativeGrantLakhs(
              projectCostFromStep12,
              extras.enterpriseSize,
              extras.specialCategory
            ).toLocaleString('en-IN')}{' '}
            {tf('Lakhs')} (
            {apTechSubsidyPercent(extras.enterpriseSize, extras.specialCategory)}% / {tf('cap')} ₹
            {apTechSubsidyCapLakhs(extras.enterpriseSize, extras.specialCategory).toLocaleString(
              'en-IN'
            )}{' '}
            {tf('L')}).
          </p>
        )}
        {isApEdp && (
          <p className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted/40">
            {tf(
              'AP EDP capital subsidy on new-unit FCI — mutually exclusive with tech-upgrade; total incentives ≤ 75% FCI. Indicative'
            )}{' '}
            ≈ ₹
            {apEdpIndicativeGrantLakhs(
              projectCostFromStep12,
              extras.enterpriseSize,
              extras.specialCategory
            ).toLocaleString('en-IN')}{' '}
            {tf('Lakhs')} (
            {apEdpSubsidyPercent(extras.enterpriseSize, extras.specialCategory)}% / {tf('cap')} ₹
            {apEdpSubsidyCapLakhs(extras.enterpriseSize, extras.specialCategory).toLocaleString(
              'en-IN'
            )}{' '}
            {tf('L')})
            {apEdpLandRebateEligible(
              extras.apiicPark,
              extras.scStOwned,
              extras.enterpriseSize
            )
              ? ` · ${tf('APIIC land rebate')} ≈ ₹${apEdpIndicativeLandRebateLakhs(
                  toFiniteNumber(step12.land),
                  extras.apiicPark,
                  extras.scStOwned,
                  extras.enterpriseSize
                ).toLocaleString('en-IN')} ${tf('L')}.`
              : '.'}
          </p>
        )}
        {isVishwakarma && (
          <p className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted/40">
            {tf(
              'Own + toolkit voucher (usually 0.15 L) + enterprise loan tranche (+ other) = total. Interest'
            )}{' '}
            {VISHWAKARMA_INTEREST_PERCENT}% · {tf('tranche cap')} ₹
            {vishwakarmaTrancheCapLakhs(extras.loanTranche).toLocaleString('en-IN')} {tf('L')} ·{' '}
            {extras.craft || '—'} / {extras.loanTranche || '—'}.
          </p>
        )}
        {isSvanidhi && (
          <p className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted/40">
            {tf(
              'Own + bank WC tranche (+ other) = total. Cap'
            )}{' '}
            ₹
            {Math.round(svanidhiTrancheCapLakhs(extras.loanTranche) * 100000).toLocaleString(
              'en-IN'
            )}{' '}
            · {svanidhiTrancheTenorMonths(extras.loanTranche)} {tf('months')} ·{' '}
            {SVANIDHI_INTEREST_SUBSIDY_PERCENT}% {tf('interest subsidy (quarterly, not capital grant)')}{' '}
            · {extras.covOrLor || '—'} / {extras.loanTranche || '—'}.
          </p>
        )}
        {isEclgs && (
          <p className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted/40">
            {tf(
              'ECLGS is a guaranteed WCTL — governmentGrant usually 0. Bank loan ≈ additional WC sought. Indicative 20% of peak'
            )}{' '}
            ≈ ₹{eclgsIndicativeQuantumLakhs(extras.peakWcOutstanding).toLocaleString('en-IN')}{' '}
            {tf('L')} · {tf('sought')} {extras.additionalWcSought || '—'} · {tf('ROI cap')} {ECLGS_INTEREST_CAP_PERCENT}%.
          </p>
        )}
        {isCgtmse && (
          <p className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted/40">
            {tf(
              'CGTMSE is a bank-side guarantee (MUDRA-adjacent) — governmentGrant usually 0. Own + bank = project cost. Women-owned may get higher cover %.'
            )}{' '}
            · {extras.loanPurpose || '—'} · {extras.womenOwned === 'yes' ? tf('women-owned') : tf('general')} ·{' '}
            {tf('proposed')} {extras.proposedLimit || '—'} {tf('L')}.
          </p>
        )}
        {isEpmNiryat && (
          <p className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted/40">
            {tf(
              'EPM Niryat is 2.75% interest subvention on eligible export credit — not a capital grant. Keep governmentGrant at 0; bank loan ≈ export credit sought.'
            )}{' '}
            · {extras.prePostShipment || '—'} · {extras.exportCreditSought || '—'} {tf('L')}.
          </p>
        )}
        {isMseSpice && (
          <p className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted/40">
            {tf(
              'MSE-SPICE: governmentGrant ≈ 25% of new P&M (cap ₹12.5 L). Second-hand machinery ineligible. Brownfield only.'
            )}{' '}
            · {extras.circularSector || '—'} · P&M {extras.proposedPmCost || '—'} {tf('L')}.
          </p>
        )}
        <div className="border-t pt-4">
          <div className="bg-primary/10 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">{tf("Total Finance")}</span>
              <span className="text-2xl font-bold text-primary">₹ {total.toLocaleString('en-IN')} {tf("Lakhs")}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 14: Operating Cost & Revenue
  if (contentStep === 14) {
    return (
      <div className="space-y-6">
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={contentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        {isApCmep && (
          <CmepAssumptionsEditor step={stepData} onChange={handleInputChange} />
        )}
        {isLeanUnit && (
          <>
            <RawMaterialEditor value={stepData.rawMaterialItems} onChange={(next) => handleInputChange('rawMaterialItems', next)} />
            <StaffRoleEditor value={stepData.staffRoles} onChange={(next) => handleInputChange('staffRoles', next)} />
          </>
        )}
        {isApCmep && (
          <UtilisationYearEditor value={stepData.utilisationByYear} onChange={(next) => handleInputChange('utilisationByYear', next)} />
        )}
        <div className="form-field-grid">
          <div>
            {renderLabel('rawMaterialCost', kindLabel('Raw Material Cost (₹ Lakhs)', kind))}
            <Input
              type="number"
              value={
                stepData.rawMaterialCost === '' || stepData.rawMaterialCost == null
                  ? ''
                  : toFiniteNumber(stepData.rawMaterialCost)
              }
              onChange={(e) => handleInputChange('rawMaterialCost', parseFloat(e.target.value) || 0)}
              placeholder={tf("0")}
            />
          </div>
          <div>
            {renderLabel('powerCost', 'Power Cost (₹ Lakhs)')}
            <Input
              type="number"
              value={
                stepData.powerCost === '' || stepData.powerCost == null
                  ? ''
                  : toFiniteNumber(stepData.powerCost)
              }
              onChange={(e) => handleInputChange('powerCost', parseFloat(e.target.value) || 0)}
              placeholder={tf("0")}
            />
          </div>
          <div>
            {renderLabel('wages', 'Wages (₹ Lakhs)')}
            <Input
              type="number"
              value={
                stepData.wages === '' || stepData.wages == null ? '' : toFiniteNumber(stepData.wages)
              }
              onChange={(e) => handleInputChange('wages', parseFloat(e.target.value) || 0)}
              placeholder={tf("0")}
            />
          </div>
          <div>
            {renderLabel('maintenance', 'Maintenance (₹ Lakhs)')}
            <Input
              type="number"
              value={
                stepData.maintenance === '' || stepData.maintenance == null
                  ? ''
                  : toFiniteNumber(stepData.maintenance)
              }
              onChange={(e) => handleInputChange('maintenance', parseFloat(e.target.value) || 0)}
              placeholder={tf("0")}
            />
          </div>
          <div>
            {renderLabel('administrativeExpenses', 'Administrative Expenses (₹ Lakhs)')}
            <Input
              type="number"
              value={
                stepData.administrativeExpenses === '' || stepData.administrativeExpenses == null
                  ? ''
                  : toFiniteNumber(stepData.administrativeExpenses)
              }
              onChange={(e) => handleInputChange('administrativeExpenses', parseFloat(e.target.value) || 0)}
              placeholder={tf("0")}
            />
          </div>
          <div>
            {renderLabel('marketingExpenses', 'Marketing Expenses (₹ Lakhs)')}
            <Input
              type="number"
              value={
                stepData.marketingExpenses === '' || stepData.marketingExpenses == null
                  ? ''
                  : toFiniteNumber(stepData.marketingExpenses)
              }
              onChange={(e) => handleInputChange('marketingExpenses', parseFloat(e.target.value) || 0)}
              placeholder={tf("0")}
            />
          </div>
          <div>
            {renderLabel('annualProductionVolume', kindLabel('Annual Production Volume', kind))}
            <Input
              type="number"
              value={
                stepData.annualProductionVolume === '' || stepData.annualProductionVolume == null
                  ? ''
                  : toFiniteNumber(stepData.annualProductionVolume)
              }
              onChange={(e) => handleInputChange('annualProductionVolume', parseFloat(e.target.value) || 0)}
              placeholder={tf("0")}
            />
          </div>
          <div>
            {renderLabel('annualSalesRealization', 'Annual Sales Realization (₹ Lakhs)')}
            <Input
              type="number"
              value={
                stepData.annualSalesRealization === '' || stepData.annualSalesRealization == null
                  ? ''
                  : toFiniteNumber(stepData.annualSalesRealization)
              }
              onChange={(e) => handleInputChange('annualSalesRealization', parseFloat(e.target.value) || 0)}
              placeholder={tf("0")}
            />
          </div>
        </div>
      </div>
    );
  }

  // Step 15: Financial Viability
  if (contentStep === 15) {
    const step12 = data.step12 || {};
    const step13 = data.step13 || {};
    const step14 = data.step14 || {};
    const cost =
      toFiniteNumber(step12.land) +
      toFiniteNumber(step12.building) +
      toFiniteNumber(step12.machinery) +
      toFiniteNumber(step12.utilitiesAndInfrastructure) +
      toFiniteNumber(step12.preliminaryAndPreOperative) +
      toFiniteNumber(step12.workingCapitalMargin);
    const finance =
      toFiniteNumber(step13.spvContribution) +
      toFiniteNumber(step13.governmentGrant) +
      toFiniteNumber(step13.bankLoan) +
      toFiniteNumber(step13.otherSources);
    const loan = toFiniteNumber(step13.bankLoan);
    let cmepYears = isApCmep ? normalizeCmepProjections(stepData.yearProjections) : [];
    if (isApCmep && !Array.isArray(stepData.yearProjections)) {
      const firstProjected = cmepYears.findIndex((col) => col.period === 'projected');
      cmepYears = cmepYears.map((col, index) =>
        index === firstProjected
          ? {
              ...col,
              sales: toFiniteNumber(step14.annualSalesRealization),
              rm: toFiniteNumber(step14.rawMaterialCost),
              wages: toFiniteNumber(step14.wages),
              power: toFiniteNumber(step14.powerCost),
            }
          : col
      );
    }
    const years = isApCmep
      ? cmepYears.filter((col) => col.period === 'projected')
      : stepData.yearProjections?.length
      ? stepData.yearProjections
      : [1, 2, 3, 4, 5].map((year) => ({
          year,
            sales: year === 1 ? toFiniteNumber(step14.annualSalesRealization) : 0,
            rm: year === 1 ? toFiniteNumber(step14.rawMaterialCost) : 0,
            wages: year === 1 ? toFiniteNumber(step14.wages) : 0,
            power: year === 1 ? toFiniteNumber(step14.powerCost) : 0,
          netProfit: 0,
        }));
    const updateYear = (index: number, field: string, value: number) => {
      const next = years.map((row: any, i: number) => (i === index ? { ...row, [field]: value } : row));
      handleInputChange('yearProjections', next);
    };
    const annualEmi = loan > 0
      ? (loan * 0.12 * Math.pow(1.12, 7)) / (Math.pow(1.12, 7) - 1)
      : 0;
    const dep = (toFiniteNumber(step12.machinery) + toFiniteNumber(step12.building)) * 0.1;
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
        <FinanceCalcStrip contentStep={15} data={data} onApply={applyCalc} />
        <FinanceModelPanel data={data} onAssumptions={(next) => setSchemeExtras({ ...(data.schemeExtras || {}), financeAssumptions: next })} />
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={contentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div className="form-field-grid">
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">{tf('Project cost')}</p>
            <p className="text-xl font-semibold">₹ {cost.toLocaleString('en-IN')} {tf('Lakhs')}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">{tf('Equity + loan + other')}</p>
            <p className="text-xl font-semibold">₹ {finance.toLocaleString('en-IN')} {tf('Lakhs')}</p>
          </div>
        </div>
        {mudraSimple && (
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-semibold">{tf("Mudra Nayak working capital")}</h4>
            <label className="block text-sm font-medium"><FieldPrompt label="Projected annual turnover (₹ Lakhs)" /></label>
            <Input
              type="number"
              value={turnover || ''}
              onChange={(e) => updateExtras({ projectedTurnover: parseFloat(e.target.value) || 0 })}
            />
            <p className="text-sm">{tf('WC limit (20%)')}: <strong>₹ {nayak.limit.toFixed(2)} {tf('Lakhs')}</strong></p>
            <p className="text-sm">{tf('Promoter margin (5% of WC)')}: <strong>₹ {nayak.margin.toFixed(2)} {tf('Lakhs')}</strong></p>
          </div>
        )}
        {isApCmep ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {tf(
                'Enter actuals for the three previous financial years and estimates for the next five. All figures are ₹ Lakhs.'
              )}
            </p>
            <CmepProjectionTable
              columns={cmepYears}
              onChange={(next) => handleInputChange('yearProjections', next)}
            />
            <CmepDerivedSheets
              step12={getStepData(12)}
              step13={getStepData(13)}
              step15={{ ...stepData, yearProjections: cmepYears }}
            />
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-muted">
                <th className="p-2 text-left">{tf('Year')}</th>
                <th className="p-2">{tf('Sales')}</th>
                <th className="p-2">{tf('RM')}</th>
                <th className="p-2">{tf('Wages')}</th>
                <th className="p-2">{tf('Power')}</th>
                <th className="p-2">{tf('Net profit')}</th>
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
        )}
        <div>
          {renderLabel('breakEvenPoint', 'Break-even (capacity %)')}
          <Input
            type="number"
            value={
              stepData.breakEvenPoint === '' || stepData.breakEvenPoint == null
                ? ''
                : toFiniteNumber(stepData.breakEvenPoint)
            }
            onChange={(e) => handleInputChange('breakEvenPoint', parseFloat(e.target.value) || 0)}
            placeholder={tf("e.g. 55")}
          />
        </div>
        {showDscr(loan) && (
          <div className={`p-4 rounded-lg border ${avgDscr < 1.5 ? 'border-red-300 bg-red-50' : 'border-border'}`}>
            <p className={`font-semibold ${avgDscr < 1.5 ? 'text-red-700' : ''}`}>{tf("DSCR (profit + depreciation vs EMI)")}</p>
            <p className={`text-sm mt-1 ${avgDscr < 1.5 ? 'text-red-700' : 'text-muted-foreground'}`}>
              {tf('Assumed 7-year term at 12%. Average DSCR:')} <strong>{avgDscr.toFixed(2)}</strong>
              {avgDscr < 1.5 ? tf(' — below 1.5; lenders may query this.') : ''}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Step 16: Implementation
  if (contentStep === 16) {
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
          currentStep={contentStep}
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
                  placeholder={tf("Activity")}
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
        {isApCmep && (
          <RiskEditor value={stepData.risks} onChange={(next) => handleInputChange('risks', next)} />
        )}
      </div>
    );
  }

  // Step 17: Expected impact
  if (contentStep === 17) {
    return (
      <div className="space-y-6">
        <AISuggestions
          {...aiStore}
          excludeFields={aiExclude}
          currentStep={contentStep}
          currentStepData={stepData}
          onApplySuggestion={(field, content) => {
            handleInputChange(field, content);
          }}
        />
        <div className="form-field-grid">
          <div>
            {renderLabel('employmentGeneration', 'Direct employment (count)')}
            <Input
              type="number"
              value={stepData.employmentGeneration || extras.directEmployment || ''}
              onChange={(e) => {
                const v = parseInt(e.target.value) || 0;
                handleInputChange('employmentGeneration', v);
                if (isPmegp || isPmegp2nd || isPmfme) updateExtras({ directEmployment: String(v) });
              }}
            />
          </div>
          <div>
            {isPmegp || isPmegp2nd || isPmfme ? (
              <>
                <label className="block text-sm font-medium mb-2"><FieldPrompt label="Indirect employment (count)" /></label>
                <Input
                  type="number"
                  value={extras.indirectEmployment || ''}
                  onChange={(e) => updateExtras({ indirectEmployment: e.target.value })}
                />
              </>
            ) : (
              <>
            {renderLabel('turnoverGrowth', 'Expected annual turnover (₹ Lakhs)')}
            <Input
              type="number"
              value={stepData.turnoverGrowth || ''}
              onChange={(e) => handleInputChange('turnoverGrowth', parseFloat(e.target.value) || 0)}
            />
              </>
            )}
          </div>
        </div>
        {(isPmegp || isPmegp2nd || isPmfme) && (
          <div>
            <label className="block text-sm font-medium mb-2"><FieldPrompt label="Short impact note (optional)" /></label>
            <ExpandableTextarea
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={extras.impactNote || stepData.impactNote || ''}
              onChange={(e) => {
                updateExtras({ impactNote: e.target.value });
                handleInputChange('impactNote', e.target.value);
              }}
              placeholder={
                isPmegp2nd
                  ? tf('Modernisation / turnover growth from upgrade — short note')
                  : isPmfme
                    ? tf('Formalisation / local offtake / farmer linkage — short note')
                    : tf('Keep light — employment / local benefit in one short note')
              }
            />
          </div>
        )}
      </div>
    );
  }

  // Step 18: Uploads
  if (contentStep === 18) {
    const handleFileChange = async (field: string, file: File | null) => {
      if (file) {
        setUploadingFiles((prev) => ({ ...prev, [field]: true }));
        try {
          const uploadResult = await individualDprApi.uploadDocument(file);
          if (uploadResult.success && uploadResult.data) {
            handleInputChange(field, kycUploadPayload(uploadResult.data, file.name));
            toast.success(`${file.name} ${tf('uploaded successfully!')}`);
          } else {
            toast.error(uploadResult.message || tf('Failed to upload document'));
            handleInputChange(field, file.name);
          }
        } catch (error: any) {
          toast.error(error.message || tf('Failed to upload document'));
          handleInputChange(field, file.name);
        } finally {
          setUploadingFiles((prev) => ({ ...prev, [field]: false }));
        }
      }
    };

    const getDisplayName = (urlOrName: unknown): string => kycDisplayName(urlOrName);

    const step12 = data.step12 || {};
    const totalCost =
      toFiniteNumber(step12.land) +
      toFiniteNumber(step12.building) +
      toFiniteNumber(step12.machinery) +
      toFiniteNumber(step12.utilitiesAndInfrastructure) +
      toFiniteNumber(step12.preliminaryAndPreOperative) +
      toFiniteNumber(step12.workingCapitalMargin);
    const uploads = getStep18Uploads(schemeCode, data.ventureMatchAnswers, extras);
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
            {isKycUploaded(stepData[item.id]) && (
              <p className="text-sm text-green-600 mt-1">✓ {tf("Uploaded")}: {getDisplayName(stepData[item.id])}</p>
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
            {isKycUploaded(stepData.educationCertificate) && (
              <p className="text-sm text-green-600 mt-1">✓ {tf("Uploaded")}: {getDisplayName(stepData.educationCertificate)}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {tf('Step')} {currentStep} {tf('form implementation in progress. Please check back soon.')}
      </p>
    </div>
  );
};
