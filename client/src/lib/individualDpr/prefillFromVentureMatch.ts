import { VentureMatchAnswers } from '@/lib/ventureMatch/types';

const ACTIVITY_SECTOR: Record<string, string> = {
  mfg: 'Manufacturing',
  food: 'Food Processing',
  craft: 'Traditional craft / artisan trade',
  service: 'Services',
  trade: 'Trading',
  vending: 'Street vending',
  crop: 'Agriculture',
};

const LEGAL_LABEL: Record<string, string> = {
  sole: 'Sole proprietorship',
  partnership: 'Partnership / LLP',
  company: 'Private / Public limited company',
};

const BUDGET_MID_LAKHS: Record<string, number> = {
  under2L: 1,
  '2to5L': 3.5,
  '5to10L': 7.5,
  '10to20L': 15,
  '20to50L': 35,
  '50Lto1Cr': 75,
  '1to10Cr': 550,
  above10Cr: 1500,
};

export function prefillFromVentureMatch(answers: VentureMatchAnswers) {
  const sector = answers.activity ? ACTIVITY_SECTOR[answers.activity] : '';
  const cost = answers.budget ? BUDGET_MID_LAKHS[answers.budget] : 0;
  const locationType =
    answers.location === 'rural' ? 'Village' : answers.location === 'apiic' ? 'APIIC industrial park' : answers.location === 'urban' ? 'City / town' : '';

  return {
    step1: {
      clusterName: '',
      district: answers.domicile === 'ap' ? 'Andhra Pradesh' : '',
      location: locationType,
      natureOfBusiness: sector,
      majorProducts: '',
    },
    step2: {
      sectorType: sector,
      sectorDescription: answers.stage === 'greenfield' ? 'New unit.' : answers.stage === 'brownfield' ? 'Existing unit – expansion or upgrade.' : '',
    },
    step3: {
      geography: answers.domicile === 'ap' ? 'Andhra Pradesh' : answers.domicile === 'other' ? 'Other Indian state' : '',
      connectivity: {
        road: locationType,
      },
    },
    step4: {
      presentActivities: sector,
      typeOfUnits: 'Individual enterprise',
      technologyLevel: answers.stage === 'brownfield' ? 'Existing unit' : 'New unit',
    },
    step10: {
      location: locationType,
      landDetails: answers.location === 'apiic' ? 'Unit proposed inside an APIIC industrial park.' : '',
    },
    step11: {
      spvName: '',
      legalStatus: answers.legal ? LEGAL_LABEL[answers.legal] : '',
      submittedTo: answers.udyam === 'yes' ? 'Udyam registered' : answers.udyam === 'willing' ? 'Will take Udyam registration' : '',
    },
    step12: cost
      ? {
          machinery: Math.round(cost * 0.5 * 10) / 10,
          building: Math.round(cost * 0.3 * 10) / 10,
          workingCapitalMargin: Math.round(cost * 0.2 * 10) / 10,
        }
      : {},
    step13: cost
      ? {
          spvContribution: Math.round(cost * 0.25 * 10) / 10,
          bankLoan: Math.round(cost * 0.75 * 10) / 10,
        }
      : {},
  };
}
