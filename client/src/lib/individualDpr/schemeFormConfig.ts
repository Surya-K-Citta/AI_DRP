import { Budget, VentureMatchAnswers } from '@/lib/ventureMatch/types';
import { isIndividualPickerScheme, SCHEMES } from '@/lib/ventureMatch/schemes';
import { PMEGP_EXTRA_FIELDS, PMEGP_IMPACT_BULLETS } from '@/lib/individualDpr/pmegpQuestions';
import { PMEGP_2ND_EXTRA_FIELDS, PMEGP_2ND_IMPACT_BULLETS } from '@/lib/individualDpr/pmegp2ndQuestions';
import { MUDRA_EXTRA_FIELDS, MUDRA_IMPACT_BULLETS } from '@/lib/individualDpr/mudraQuestions';
import { STANDUP_EXTRA_FIELDS, STANDUP_IMPACT_BULLETS } from '@/lib/individualDpr/standupQuestions';
import { PMFME_EXTRA_FIELDS, PMFME_IMPACT_BULLETS } from '@/lib/individualDpr/pmfmeQuestions';
import { SCLCSS_EXTRA_FIELDS, SCLCSS_IMPACT_BULLETS } from '@/lib/individualDpr/sclcssQuestions';
import { AP_TECH_EXTRA_FIELDS, AP_TECH_IMPACT_BULLETS } from '@/lib/individualDpr/apTechUpgradeQuestions';
import {
  AP_EDP_EXTRA_FIELDS,
  AP_EDP_IMPACT_BULLETS,
} from '@/lib/individualDpr/apEdpQuestions';
import {
  VISHWAKARMA_CRAFTS,
  VISHWAKARMA_EXTRA_FIELDS,
  VISHWAKARMA_IMPACT_BULLETS,
} from '@/lib/individualDpr/vishwakarmaQuestions';
import {
  SVANIDHI_EXTRA_FIELDS,
  SVANIDHI_IMPACT_BULLETS,
} from '@/lib/individualDpr/svanidhiQuestions';
import { ECLGS_EXTRA_FIELDS, ECLGS_IMPACT_BULLETS } from '@/lib/individualDpr/eclgsQuestions';
import { ZED_EXTRA_FIELDS, ZED_IMPACT_BULLETS } from '@/lib/individualDpr/zedQuestions';
import { LEAN_EXTRA_FIELDS, LEAN_IMPACT_BULLETS } from '@/lib/individualDpr/leanQuestions';
import { MSME_IPR_EXTRA_FIELDS, MSME_IPR_IMPACT_BULLETS } from '@/lib/individualDpr/msmeIprQuestions';
import { PMS_EXTRA_FIELDS, PMS_IMPACT_BULLETS } from '@/lib/individualDpr/pmsQuestions';
import { SCST_HUB_EXTRA_FIELDS, SCST_HUB_IMPACT_BULLETS } from '@/lib/individualDpr/scstHubQuestions';
import { ASPIRE_EXTRA_FIELDS, ASPIRE_IMPACT_BULLETS } from '@/lib/individualDpr/aspireQuestions';
import { NHDP_EXTRA_FIELDS, NHDP_IMPACT_BULLETS } from '@/lib/individualDpr/nhdpQuestions';
import { CVY_EXTRA_FIELDS, CVY_IMPACT_BULLETS } from '@/lib/individualDpr/cvyQuestions';
import { MSE_GIFT_EXTRA_FIELDS, MSE_GIFT_IMPACT_BULLETS } from '@/lib/individualDpr/mseGiftQuestions';
import { PTUAS_EXTRA_FIELDS, PTUAS_IMPACT_BULLETS } from '@/lib/individualDpr/ptuasQuestions';
import { PMPDS_EXTRA_FIELDS, PMPDS_IMPACT_BULLETS } from '@/lib/individualDpr/pmpdsQuestions';
import { CGTMSE_EXTRA_FIELDS, CGTMSE_IMPACT_BULLETS } from '@/lib/individualDpr/cgtmseQuestions';
import { AP_FPP_EXTRA_FIELDS, AP_FPP_IMPACT_BULLETS } from '@/lib/individualDpr/apFppQuestions';
import { AP_CMEP_EXTRA_FIELDS, AP_CMEP_IMPACT_BULLETS } from '@/lib/individualDpr/apCmepQuestions';
import { OBMMS_EXTRA_FIELDS, OBMMS_IMPACT_BULLETS } from '@/lib/individualDpr/obmmsQuestions';
import { MSE_SPICE_EXTRA_FIELDS, MSE_SPICE_IMPACT_BULLETS } from '@/lib/individualDpr/mseSpiceQuestions';
import { AP_PARKS_EXTRA_FIELDS, AP_PARKS_IMPACT_BULLETS } from '@/lib/individualDpr/apParksQuestions';
import { RAMP_TEAM_EXTRA_FIELDS, RAMP_TEAM_IMPACT_BULLETS } from '@/lib/individualDpr/rampTeamQuestions';
import { EPM_NIRYAT_EXTRA_FIELDS, EPM_NIRYAT_IMPACT_BULLETS } from '@/lib/individualDpr/epmNiryatQuestions';
import {
  getSchemeSteps,
  getStepDef,
  localToContent,
} from '@/lib/individualDpr/schemeStepCatalog';

export { VISHWAKARMA_CRAFTS };

export const SCHEME_OPTIONS = [
  { code: '', label: 'Vanilla bank term loan (standard individual DPR)' },
  ...SCHEMES.filter((s) => isIndividualPickerScheme(s.code)).map((s) => ({
    code: s.code,
    label: s.name,
  })),
];

const SCHEME_EXTRA_FIELDS: Record<string, string[]> = {
  VISHWAKARMA: [...VISHWAKARMA_EXTRA_FIELDS],
  SVANIDHI: [...SVANIDHI_EXTRA_FIELDS],
  PMFME: [...PMFME_EXTRA_FIELDS],
  AP_EDP: [...AP_EDP_EXTRA_FIELDS],
  PMEGP: [...PMEGP_EXTRA_FIELDS],
  MUDRA: [...MUDRA_EXTRA_FIELDS],
  STANDUP: [...STANDUP_EXTRA_FIELDS],
  PMEGP_2ND: [...PMEGP_2ND_EXTRA_FIELDS],
  SCLCSS: [...SCLCSS_EXTRA_FIELDS],
  AP_TECH_UPGRADE: [...AP_TECH_EXTRA_FIELDS],
  MSE_GIFT: [...MSE_GIFT_EXTRA_FIELDS],
  ZED: [...ZED_EXTRA_FIELDS],
  LEAN: [...LEAN_EXTRA_FIELDS],
  MSME_IPR: [...MSME_IPR_EXTRA_FIELDS],
  PMS: [...PMS_EXTRA_FIELDS],
  CVY: [...CVY_EXTRA_FIELDS],
  NHDP: [...NHDP_EXTRA_FIELDS],
  PTUAS: [...PTUAS_EXTRA_FIELDS],
  PMPDS: [...PMPDS_EXTRA_FIELDS],
  SCST_HUB: [...SCST_HUB_EXTRA_FIELDS],
  ASPIRE: [...ASPIRE_EXTRA_FIELDS],
  ECLGS: [...ECLGS_EXTRA_FIELDS],
  CGTMSE: [...CGTMSE_EXTRA_FIELDS],
  AP_FPP: [...AP_FPP_EXTRA_FIELDS],
  AP_CMEP: [...AP_CMEP_EXTRA_FIELDS],
  OBMMS: [...OBMMS_EXTRA_FIELDS],
  MSE_SPICE: [...MSE_SPICE_EXTRA_FIELDS],
  AP_PARKS: [...AP_PARKS_EXTRA_FIELDS],
  RAMP_TEAM: [...RAMP_TEAM_EXTRA_FIELDS],
  EPM_NIRYAT: [...EPM_NIRYAT_EXTRA_FIELDS],
};

export function extraFieldsForScheme(schemeCode: string | null | undefined): string[] {
  if (!schemeCode) return [];
  return SCHEME_EXTRA_FIELDS[schemeCode] || [];
}


export type UploadField = { id: string; label: string };

const DEFAULT_UPLOADS: UploadField[] = [
  { id: 'aadhaarPan', label: 'Aadhaar / PAN' },
  { id: 'udyamCertificate', label: 'Udyam Certificate' },
  { id: 'bankPassbook', label: 'Bank Passbook' },
  { id: 'machineryQuotations', label: 'Machinery / Equipment Quotations' },
];

const SHISHU_KISHORE: Budget[] = ['under2L', '2to5L'];

export function isMudraShishuKishore(code: string | null, budget?: Budget): boolean {
  return code === 'MUDRA' && !!budget && SHISHU_KISHORE.includes(budget);
}

function isMudraTarunPlus(code: string | null, budget?: Budget): boolean {
  return code === 'MUDRA' && (budget === '50Lto1Cr' || budget === '1to10Cr' || budget === 'above10Cr');
}

export function hideComplexCapex(code: string | null, budget?: Budget): boolean {
  return (
    code === 'VISHWAKARMA' ||
    code === 'SVANIDHI' ||
    code === 'ECLGS' ||
    code === 'NHDP' ||
    code === 'ASPIRE' ||
    code === 'ZED' ||
    code === 'LEAN' ||
    code === 'MSME_IPR' ||
    code === 'PMS' ||
    code === 'SCST_HUB' ||
    code === 'PMPDS' ||
    code === 'RAMP_TEAM' ||
    code === 'EPM_NIRYAT' ||
    code === 'OBMMS' ||
    isMudraShishuKishore(code, budget)
  );
}

export function showDscr(bankLoanLakhs: number): boolean {
  return (bankLoanLakhs || 0) > 0;
}

export function showPmegpEducationGate(
  code: string | null,
  activity: string | undefined,
  totalCostLakhs: number
): boolean {
  if (code !== 'PMEGP' && code !== 'PMEGP_2ND') return false;
  const mfg = activity === 'mfg' || activity === 'food' || activity === 'craft';
  const service =
    activity === 'service' ||
    activity === 'knowledge' ||
    activity === 'trade' ||
    activity === 'vending' ||
    activity === 'mixed';
  if (mfg && totalCostLakhs > 10) return true;
  if (service && totalCostLakhs > 5) return true;
  return false;
}

/** Consecutive local steps 1..N for this scheme (not a shared 18 with gaps). */
export function getVisibleSteps(code: string | null): number[] {
  return getSchemeSteps(code).map((s) => s.n);
}

export function getStepTitle(localStep: number, schemeCode?: string | null): string {
  const def = getStepDef(schemeCode, localStep);
  if (def) return def.title;
  return `Step ${localStep}`;
}

/** Map UI local step → store/AI content bucket. */
export function getContentStep(localStep: number, schemeCode?: string | null): number {
  return localToContent(schemeCode, localStep);
}


export function getStep18Uploads(
  code: string | null,
  answers?: VentureMatchAnswers | null,
  schemeExtras?: Record<string, any> | null
): UploadField[] {
  if (code === 'VISHWAKARMA') {
    return [
      { id: 'aadhaarPan', label: 'Aadhaar' },
      { id: 'bankPassbook', label: 'Savings Bank Passbook' },
      { id: 'rationCard', label: 'Ration Card (family verification)' },
      { id: 'pmVishwakarmaId', label: 'PM Vishwakarma Certificate / ID (if issued)' },
      { id: 'toolkitQuotation', label: 'Toolkit List / Designated-centre Quote' },
    ];
  }
  if (code === 'SVANIDHI') {
    return [
      { id: 'covOrLor', label: 'Certificate of Vending / Vendor ID or Portal LoR' },
      { id: 'aadhaarPan', label: 'Aadhaar' },
      { id: 'bankPassbook', label: 'Savings Bank Passbook / Statement' },
      { id: 'upiProof', label: 'UPI ID / QR Screenshot (linked to same account)' },
    ];
  }
  if (code === 'PMFME') {
    const uploads: UploadField[] = [
      { id: 'machineryQuotations', label: 'Machinery Quotations' },
      { id: 'premisesLease', label: 'Land / Premises Lease or Ownership Proof' },
      { id: 'fssaiDraft', label: 'FSSAI Licence / Draft Registration' },
      { id: 'aadhaarPan', label: 'Aadhaar / PAN' },
      { id: 'udyamCertificate', label: 'Udyam Certificate (or application)' },
      { id: 'bankPassbook', label: 'Bank Passbook / Cancelled Cheque' },
    ];
    if (schemeExtras?.unitStage === 'existing') {
      uploads.push({ id: 'existingUnitPhotos', label: 'Photos of Existing Unit' });
    }
    return uploads;
  }
  if (code === 'PMEGP' || code === 'PMEGP_2ND') {
    const uploads: UploadField[] = [
      { id: 'aadhaarPan', label: 'Aadhaar / PAN' },
      { id: 'machineryQuotations', label: 'Machinery Quotations' },
      { id: 'buildingEstimates', label: 'Building / Workshed Estimate' },
      { id: 'bankPassbook', label: 'Bank Passbook / Cancelled Cheque' },
      { id: 'udyamCertificate', label: 'Udyam Certificate (or application)' },
    ];
    if (code === 'PMEGP_2ND') {
      uploads.push(
        { id: 'priorSanctionLetter', label: 'Prior PMEGP / REGP / MUDRA Sanction Letter' },
        { id: 'caExistingInvestment', label: 'CA Certificate of Existing Investment' },
        { id: 'profitStatements', label: 'Last 3 Years Profit / ITR Statements' }
      );
    }
    const owner = answers?.owner || [];
    const specialCategory =
      schemeExtras?.pmegpCategory === 'special' ||
      owner.some((o) => ['sc', 'st', 'bc'].includes(o));
    if (code === 'PMEGP' && specialCategory) {
      uploads.push({ id: 'casteCertificate', label: 'Caste / Special-category Certificate' });
    }
    return uploads;
  }
  if (code === 'SCLCSS') {
    const uploads: UploadField[] = [
      { id: 'casteCertificate', label: 'SC / ST Caste Certificate' },
      { id: 'machineryQuotations', label: 'Machinery Quotations (tech specs)' },
      { id: 'udyamCertificate', label: 'Udyam Certificate' },
      { id: 'aadhaarPan', label: 'Aadhaar / PAN' },
      { id: 'termLoanSanction', label: 'Term Loan Sanction / In-principle' },
    ];
    if (schemeExtras?.unitStage !== 'new') {
      uploads.push({ id: 'caExistingInvestment', label: 'CA Certificate of Existing FCI' });
    }
    uploads.push({
      id: 'ownershipProof',
      label: '51% SC/ST Shareholding Proof (if not sole proprietor)',
    });
    return uploads;
  }
  if (code === 'AP_EDP') {
    const uploads: UploadField[] = [
      { id: 'udyamCertificate', label: 'Udyam Certificate' },
      { id: 'landShedAllotment', label: 'Land / Shed Allotment or Lease' },
      { id: 'cfeCfo', label: 'Single Desk Pollution Clearances (CFE/CFO)' },
      { id: 'caFciStatement', label: 'CA-certified FCI Statement' },
      { id: 'apDomicileProof', label: 'AP Domicile Proof' },
      { id: 'aadhaarPan', label: 'Aadhaar / PAN' },
      { id: 'machineryQuotations', label: 'Machinery Quotations / Invoices' },
      { id: 'termLoanSanction', label: 'Term Loan Sanction (if credit-linked)' },
    ];
    if (schemeExtras?.specialCategory === 'yes') {
      uploads.push({
        id: 'specialCategoryProof',
        label: 'Special-category Ownership Proof (women / SC/ST / BC / PwD / etc.)',
      });
    }
    if (schemeExtras?.scStOwned === 'yes' && schemeExtras?.apiicPark === 'yes') {
      uploads.push({
        id: 'scStOwnershipProof',
        label: 'SC/ST Ownership Proof (APIIC land-rebate claim)',
      });
    }
    return uploads;
  }
  if (code === 'AP_TECH_UPGRADE') {
    const uploads: UploadField[] = [
      { id: 'udyamCertificate', label: 'Udyam Certificate' },
      { id: 'machineryQuotations', label: 'New Machinery Quotations / Invoices' },
      { id: 'oldMachineryList', label: 'List of Existing Machinery' },
      { id: 'caFciStatement', label: 'CA Statement of Upgrade FCI' },
      { id: 'apDomicileProof', label: 'AP Domicile Proof' },
      { id: 'aadhaarPan', label: 'Aadhaar / PAN' },
      { id: 'termLoanSanction', label: 'Term Loan Sanction (if credit-linked)' },
    ];
    if (schemeExtras?.specialCategory === 'yes') {
      uploads.push({
        id: 'specialCategoryProof',
        label: 'Special-category Ownership Proof (women / SC/ST / BC / PwD / etc.)',
      });
    }
    return uploads;
  }
  if (code === 'MUDRA') {
    const uploads: UploadField[] = [
      { id: 'shopAddressProof', label: 'Shop Address Proof' },
      { id: 'bankStatements', label: 'Bank Statements' },
      { id: 'machineryQuotations', label: 'Machinery / Equipment Quotations' },
      { id: 'aadhaarPan', label: 'Aadhaar / PAN' },
      { id: 'udyamCertificate', label: 'Udyam Certificate (or application)' },
    ];
    if (
      isMudraTarunPlus(code, answers?.budget) ||
      schemeExtras?.mudraCategory === 'tarunPlus'
    ) {
      uploads.push({ id: 'mudraClosure', label: 'Previous Mudra Loan Repayment / Closure Certificate' });
    }
    return uploads;
  }
  if (code === 'STANDUP') {
    const uploads: UploadField[] = [
      { id: 'aadhaarPan', label: 'Aadhaar / PAN' },
      { id: 'machineryQuotations', label: 'Machinery Quotations' },
      { id: 'buildingEstimates', label: 'Building Estimate / Premises Lease' },
      { id: 'udyamCertificate', label: 'Udyam Certificate (or application)' },
      { id: 'bankPassbook', label: 'Bank Passbook / Cancelled Cheque' },
    ];
    const cat = schemeExtras?.standupCategory;
    if (cat === 'sc' || cat === 'st') {
      uploads.push({ id: 'casteCertificate', label: 'Caste Certificate (SC / ST)' });
    }
    uploads.push({
      id: 'ownershipProof',
      label: '51% Controlling Stake Proof (if not sole proprietor)',
    });
    return uploads;
  }
  if (code === 'ECLGS') {
    return [
      { id: 'udyamCertificate', label: 'Udyam Certificate' },
      { id: 'gstItr', label: 'GST Returns / ITR' },
      { id: 'bankStatements', label: 'Bank Statements' },
      { id: 'existingSanction', label: 'Existing Sanction Letter' },
      { id: 'caTurnover', label: 'CA Turnover Certificate' },
    ];
  }
  if (code === 'ZED' || code === 'LEAN' || code === 'MSME_IPR') {
    return [
      { id: 'udyamCertificate', label: 'Udyam Certificate' },
      { id: 'aadhaarPan', label: 'Aadhaar / PAN' },
    ];
  }
  if (code === 'PMS') {
    return [
      { id: 'udyamCertificate', label: 'Udyam Certificate' },
      { id: 'fairPhotos', label: 'Previous Fair Photos (optional)' },
    ];
  }
  if (code === 'MSE_GIFT') {
    return [
      { id: 'energyBill', label: 'Recent Energy Bill' },
      { id: 'machineryQuotations', label: 'EE Equipment Quotations' },
      { id: 'udyamCertificate', label: 'Udyam Certificate' },
    ];
  }
  if (code === 'CVY') {
    return [
      { id: 'coirBoardDocs', label: 'Coir Board Documents' },
      { id: 'machineryQuotations', label: 'Machinery Quotations' },
      { id: 'udyamCertificate', label: 'Udyam Certificate' },
    ];
  }
  if (code === 'NHDP') {
    return [
      { id: 'weaverId', label: 'Weaver ID / Handloom Corp Membership' },
      { id: 'aadhaarPan', label: 'Aadhaar' },
      { id: 'bankPassbook', label: 'Bank Passbook' },
    ];
  }
  if (code === 'PTUAS') {
    return [
      { id: 'manufacturingLicence', label: 'Manufacturing / Product Licence' },
      { id: 'pollutionConsent', label: 'Pollution Consent' },
      { id: 'machineryQuotations', label: 'Machinery Quotations' },
      { id: 'caFciStatement', label: 'CA FCI Statement' },
      { id: 'udyamCertificate', label: 'Udyam Certificate' },
    ];
  }
  if (code === 'PMPDS') {
    return [
      { id: 'manufacturingLicence', label: 'Manufacturing / Product Licence (if any)' },
      { id: 'udyamCertificate', label: 'Udyam Certificate' },
      { id: 'aadhaarPan', label: 'Aadhaar / PAN' },
    ];
  }
  if (code === 'CGTMSE') {
    return [
      { id: 'udyamCertificate', label: 'Udyam Certificate' },
      { id: 'aadhaarPan', label: 'Aadhaar / PAN' },
      { id: 'machineryQuotations', label: 'Quotations / WC Evidence' },
      { id: 'bankPassbook', label: 'Bank Passbook' },
    ];
  }
  if (code === 'AP_FPP') {
    return [
      { id: 'udyamCertificate', label: 'Udyam Certificate' },
      { id: 'fssai', label: 'FSSAI Licence' },
      { id: 'cfeCfo', label: 'CFE / CFO' },
      { id: 'machineryQuotations', label: 'Machinery Quotations' },
      { id: 'caFciStatement', label: 'CA FCI Statement' },
      { id: 'apDomicileProof', label: 'AP Domicile Proof' },
    ];
  }
  if (code === 'AP_CMEP') {
    return [
      { id: 'udyamCertificate', label: 'Udyam Certificate (or application)' },
      { id: 'machineryQuotations', label: 'Machinery / Capex Quotations' },
      { id: 'apDomicileProof', label: 'AP Domicile Proof' },
      { id: 'bankPassbook', label: 'Bank Passbook / Cancelled Cheque' },
      { id: 'educationCertificate', label: 'Education certificate' },
      { id: 'edpCertificate', label: 'EDP certificate' },
      { id: 'premisesLease', label: 'Lease deed / premises proof' },
      { id: 'rawMaterialQuotations', label: 'Yarn, dye and packing rate sheets' },
      { id: 'dealerEnquiries', label: 'Dealer enquiries or purchase orders' },
    ];
  }
  if (code === 'OBMMS') {
    return [
      { id: 'casteCertificate', label: 'Caste / Corporation Eligibility Proof' },
      { id: 'whiteRiceCard', label: 'White Rice Card' },
      { id: 'aadhaarPan', label: 'Aadhaar' },
      { id: 'bankPassbook', label: 'Bank Passbook' },
    ];
  }
  if (code === 'MSE_SPICE') {
    return [
      { id: 'udyamCertificate', label: 'Udyam Certificate' },
      { id: 'machineryQuotations', label: 'New P&M Quotations (second-hand ineligible)' },
      { id: 'bankPassbook', label: 'Bank Passbook / Sanction Path' },
    ];
  }
  if (code === 'AP_PARKS') {
    return [
      { id: 'allotmentApplication', label: 'APIIC / Park Allotment Application' },
      { id: 'apDomicileProof', label: 'AP Domicile Proof' },
      { id: 'categoryProof', label: 'SC/ST / Women Category Proof (if claimed)' },
      { id: 'aadhaarPan', label: 'Aadhaar / PAN' },
    ];
  }
  if (code === 'RAMP_TEAM') {
    return [
      { id: 'udyamCertificate', label: 'Udyam Certificate' },
      { id: 'productCatalogue', label: 'Product List / Catalogue Draft' },
      { id: 'aadhaarPan', label: 'Aadhaar / PAN' },
    ];
  }
  if (code === 'EPM_NIRYAT') {
    return [
      { id: 'iec', label: 'IEC Certificate' },
      { id: 'exportEvidence', label: 'Shipping / LC / Export Evidence' },
      { id: 'udyamCertificate', label: 'Udyam Certificate' },
      { id: 'bankStatements', label: 'Bank Statements' },
    ];
  }
  if (code === 'SCST_HUB') {
    return [
      { id: 'casteCertificate', label: 'Caste Certificate' },
      { id: 'udyamCertificate', label: 'Udyam Certificate' },
      { id: 'cancelledCheque', label: 'Cancelled Cheque' },
    ];
  }
  if (code === 'ASPIRE') {
    return [
      { id: 'ruralAddressProof', label: 'Rural / Village Address Proof' },
      { id: 'conceptNote', label: 'Concept / Innovation Note' },
      { id: 'udyamCertificate', label: 'Udyam Certificate (or application)' },
      { id: 'aadhaarPan', label: 'Aadhaar / PAN' },
    ];
  }
  return DEFAULT_UPLOADS;
}

export function getSchemeImpact(code: string | null): {
  title: string;
  bullets: string[];
  firstChangedStep: number;
} {
  if (code === 'VISHWAKARMA') {
    return {
      title: 'PM Vishwakarma',
      bullets: [...VISHWAKARMA_IMPACT_BULLETS],
      firstChangedStep: 1,
    };
  }
  if (code === 'SVANIDHI') {
    return {
      title: 'PM SVANidhi',
      bullets: [...SVANIDHI_IMPACT_BULLETS],
      firstChangedStep: 1,
    };
  }
  if (code === 'PMFME') {
    return {
      title: 'PMFME',
      bullets: [...PMFME_IMPACT_BULLETS],
      firstChangedStep: 1,
    };
  }
  if (code === 'PMEGP') {
    return {
      title: 'PMEGP',
      bullets: [...PMEGP_IMPACT_BULLETS],
      firstChangedStep: 1,
    };
  }
  if (code === 'PMEGP_2ND') {
    return {
      title: '2nd PMEGP Loan',
      bullets: [...PMEGP_2ND_IMPACT_BULLETS],
      firstChangedStep: 1,
    };
  }
  if (code === 'SCLCSS') {
    return {
      title: 'SCLCSS (SC/ST only)',
      bullets: [...SCLCSS_IMPACT_BULLETS],
      firstChangedStep: 1,
    };
  }
  if (code === 'ECLGS') {
    return {
      title: 'ECLGS 5.0',
      bullets: [...ECLGS_IMPACT_BULLETS],
      firstChangedStep: 1,
    };
  }
  if (code === 'ZED') {
    return { title: 'MSME Sustainable ZED', bullets: [...ZED_IMPACT_BULLETS], firstChangedStep: 1 };
  }
  if (code === 'LEAN') {
    return { title: 'Competitive LEAN', bullets: [...LEAN_IMPACT_BULLETS], firstChangedStep: 1 };
  }
  if (code === 'MSME_IPR') {
    return { title: 'MSME Innovative — IPR', bullets: [...MSME_IPR_IMPACT_BULLETS], firstChangedStep: 1 };
  }
  if (code === 'PMS') {
    return { title: 'PMS (marketing / fair)', bullets: [...PMS_IMPACT_BULLETS], firstChangedStep: 1 };
  }
  if (code === 'SCST_HUB') {
    return { title: 'National SC/ST Hub', bullets: [...SCST_HUB_IMPACT_BULLETS], firstChangedStep: 1 };
  }
  if (code === 'ASPIRE') {
    return { title: 'ASPIRE', bullets: [...ASPIRE_IMPACT_BULLETS], firstChangedStep: 1 };
  }
  if (code === 'NHDP') {
    return { title: 'NHDP (handloom)', bullets: [...NHDP_IMPACT_BULLETS], firstChangedStep: 1 };
  }
  if (code === 'CVY') {
    return { title: 'Coir Vikas Yojana', bullets: [...CVY_IMPACT_BULLETS], firstChangedStep: 1 };
  }
  if (code === 'MSE_GIFT') {
    return { title: 'MSE-GIFT', bullets: [...MSE_GIFT_IMPACT_BULLETS], firstChangedStep: 1 };
  }
  if (code === 'PTUAS') {
    return { title: 'PTUAS', bullets: [...PTUAS_IMPACT_BULLETS], firstChangedStep: 1 };
  }
  if (code === 'PMPDS') {
    return { title: 'PMPDS', bullets: [...PMPDS_IMPACT_BULLETS], firstChangedStep: 1 };
  }
  if (code === 'CGTMSE') {
    return { title: 'CGTMSE (MUDRA-adjacent)', bullets: [...CGTMSE_IMPACT_BULLETS], firstChangedStep: 1 };
  }
  if (code === 'AP_FPP') {
    return { title: 'AP FPP 4.0', bullets: [...AP_FPP_IMPACT_BULLETS], firstChangedStep: 1 };
  }
  if (code === 'AP_CMEP') {
    return { title: 'AP CMEP', bullets: [...AP_CMEP_IMPACT_BULLETS], firstChangedStep: 1 };
  }
  if (code === 'OBMMS') {
    return { title: 'AP OBMMS', bullets: [...OBMMS_IMPACT_BULLETS], firstChangedStep: 1 };
  }
  if (code === 'MSE_SPICE') {
    return { title: 'MSE-SPICE', bullets: [...MSE_SPICE_IMPACT_BULLETS], firstChangedStep: 1 };
  }
  if (code === 'AP_PARKS') {
    return { title: 'AP MSME-PARKS', bullets: [...AP_PARKS_IMPACT_BULLETS], firstChangedStep: 1 };
  }
  if (code === 'RAMP_TEAM') {
    return { title: 'RAMP TEAM (ONDC)', bullets: [...RAMP_TEAM_IMPACT_BULLETS], firstChangedStep: 1 };
  }
  if (code === 'EPM_NIRYAT') {
    return { title: 'EPM Niryat Protsahan', bullets: [...EPM_NIRYAT_IMPACT_BULLETS], firstChangedStep: 1 };
  }
  if (code === 'MUDRA') {
    return {
      title: 'MUDRA',
      bullets: [...MUDRA_IMPACT_BULLETS],
      firstChangedStep: 1,
    };
  }
  if (code === 'STANDUP') {
    return {
      title: 'Stand-Up India',
      bullets: [...STANDUP_IMPACT_BULLETS],
      firstChangedStep: 1,
    };
  }
  if (code === 'AP_EDP') {
    return {
      title: 'AP MSME-EDP 4.0',
      bullets: [...AP_EDP_IMPACT_BULLETS],
      firstChangedStep: 1,
    };
  }
  if (code === 'AP_TECH_UPGRADE') {
    return {
      title: 'AP Technology Upgradation',
      bullets: [...AP_TECH_IMPACT_BULLETS],
      firstChangedStep: 1,
    };
  }
  if (code) {
    return {
      title: code,
      bullets: [
        'No extra fields on steps 1–17 for this scheme in v1.',
        'Step 18 uses the default individual upload list (Aadhaar/PAN, Udyam, passbook, quotations).',
      ],
      firstChangedStep: 18,
    };
  }
  return {
    title: 'Vanilla bank term loan',
    bullets: [
      'All 18 steps. No scheme extras on step 1.',
      'Step 18: Aadhaar/PAN, Udyam, passbook, machinery quotations.',
    ],
    firstChangedStep: 1,
  };
}

export function nayakWorkingCapital(turnoverLakhs: number): { limit: number; margin: number } {
  const limit = turnoverLakhs * 0.2;
  const margin = limit * 0.05;
  return { limit, margin };
}
