import type { SampleData } from './types';

// Source: QA doc section 13 (ECLGS).
// Deviations from QA doc: none.
// Residual verifier output (kept on purpose): the progress counter treats a zero as "not answered", and ECLGS has no
// machinery/assets and no own contribution, grant or other sources (all 0 per the QA doc, project cost = WC 25.00 = bank loan 25.00).
// So step 4 shows 1/3 (machinery, machinery list empty) and step 5 shows 5/8 (own, grant, other = 0). Inventing non-zero
// values here would break the ECLGS rules (margin nil, grant 0, no capex), so they stay 0 / empty.
const sample: SampleData = {
  step1: {
    unitName: 'Sri Lakshmi Ganapathi Rice Industries',
    clusterName: 'Sri Lakshmi Ganapathi Rice Industries',
    district: 'West Godavari',
    location: 'Tadepalligudem',
    natureOfBusiness: 'Rice / flour mill',
    majorProducts: 'Sona Masoori raw rice, broken rice, rice bran',
  },
  step4: {
    presentActivities:
      'Existing 4 tonne per hour modern rice mill with boiler-cum-dryer, sheller, polisher and colour sorter running two shifts in the paddy season.',
    yearOfEstablishment: '2012-04-16',
    commitmentDate: '2026-11-05',
    technologyLevel: 'Modern mill with colour sorter, two shifts in season',
    productionCapacity: '4 tonnes of paddy per hour',
    productMix: [
      { name: 'Sona Masoori raw rice', sharePercent: 68, sellingPrice: 4350 },
      { name: 'Broken rice', sharePercent: 12, sellingPrice: 2350 },
      { name: 'Rice bran', sharePercent: 10, sellingPrice: 2150 },
      { name: 'Rice husk', sharePercent: 10, sellingPrice: 400 },
    ],
  },
  step11: {
    spvName: 'M/s Sri Lakshmi Ganapathi Rice Industries',
    legalStatus: 'Partnership firm',
    gstin: '37AAEFS2958Q1ZD',
    firmPan: 'AAEFS2958Q',
    udyamNumber: 'UDYAM-AP-28-0029481',
    applicantMobile: '9848760321',
    address: 'Door No. 6-24, Eluru Road, Tadepalligudem, West Godavari District, Andhra Pradesh - 534101',
  },
  step12: {
    workingCapitalMargin: 25,
  },
  step13: {
    bankName: 'Union Bank of India, Tadepalligudem branch',
    interestRate: 9,
    moratoriumMonths: 12,
    loanTenureMonths: 60,
    spvContribution: 0,
    governmentGrant: 0,
    bankLoan: 25,
    otherSources: 0,
  },
  step14: {
    rawMaterialItems: [
      { name: 'Paddy (BPT 5204 and MTU 1010)', use: 'Milling into rice', basis: 'Direct purchase from farmers and Tadepalligudem market yard at harvest' },
      { name: 'HDPE and PP packing bags', use: 'Packing of rice', basis: 'Monthly order from Eluru bag supplier' },
      { name: 'Rice husk', use: 'Boiler and dryer fuel', basis: 'Own by-product, topped up from nearby mills' },
    ],
    staffRoles: [
      { role: 'Mill manager', count: 1, monthlyPay: 30000 },
      { role: 'Boiler, dryer and machine operator', count: 4, monthlyPay: 17000 },
      { role: 'Loader and helper', count: 8, monthlyPay: 11000 },
      { role: 'Accountant', count: 1, monthlyPay: 18000 },
      { role: 'Weighbridge clerk', count: 1, monthlyPay: 12000 },
    ],
    rawMaterialCost: 830,
    powerCost: 22,
    wages: 25.92,
    maintenance: 9,
    administrativeExpenses: 12,
    marketingExpenses: 6,
    annualProductionVolume: 27470,
    annualSalesRealization: 960.08,
  },
  schemeExtras: {
    businessKind: 'manufacturing',
    existingLimit: '150',
    peakWcOutstanding: '140',
    additionalWcSought: '25',
    accountStatus: 'standard',
    entrepreneurName: 'Chintalapati Satyanarayana',
    liquidityReason:
      'Paddy procurement prices rose about 9% this season and Hyderabad buyers now take 45 days to pay, so the 150 lakh cash credit limit stays fully drawn for four months of the year; 25 lakh of additional working capital lets the mill buy paddy at harvest without delaying payment to farmers.',
  },
};
export default sample;
