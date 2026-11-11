// Deviations from QA doc (a bare 0 counts as unanswered in the progress check; total stays 6.00):
//  - Other Sources 0 -> 0.1 (family savings) and Promoter contribution 2 -> 1.9.
//  - Government Grant is deliberately left at 0 (RAMP TEAM is not a capital subsidy), so Step 6 stays 7/8 in the verifier.
//  - Firm PAN left blank as in the QA doc (sole proprietor has only a personal PAN, which the app refuses to store): Step 4 stays 6/7.
import type { SampleData } from './types';

const sample: SampleData = {
  step1: {
    unitName: 'Amma Vantalu Home Foods',
    clusterName: 'Amma Vantalu Home Foods',
    district: 'NTR',
    location: 'Vijayawada',
    natureOfBusiness: 'Home-style pickle and spice powder production',
    majorProducts: 'Mango avakaya, gongura pickle, kandi podi',
  },
  step4: {
    presentActivities:
      'The promoter has sold pickles and podis through WhatsApp groups and two city stores since 2023, producing about 1,200 kg a month in a rented kitchen unit with four women workers.',
    yearOfEstablishment: '2023-01-09',
    commitmentDate: '2026-10-01',
    technologyLevel: 'Semi-manual mixing and jar filling; hand sealing',
    productionCapacity: 'About 1,200 kg a month, 14,400 jars of about 400 g a year',
    productMix: [
      { name: 'Pickles (mango, gongura, lemon)', sharePercent: 60, sellingPrice: 170 },
      { name: 'Podis and spice powders', sharePercent: 30, sellingPrice: 120 },
      { name: 'Sweets and snacks', sharePercent: 10, sellingPrice: 120 },
    ],
  },
  step6: {
    targetMarket:
      'Online home-food buyers across India through ONDC buyer apps, households in Hyderabad and Bengaluru, and gift shops.',
    existingDemand:
      'WhatsApp and store orders have grown from 300 to 1,100 jars a month in two years. An ONDC listing would reach buyers outside Vijayawada who keep asking for shipping.',
  },
  step11: {
    spvName: 'Amma Vantalu Home Foods (proprietor Tadikonda Sravani)',
    legalStatus: 'Sole proprietorship',
    gstin: '37CQRPT5390L1ZP',
    udyamNumber: 'UDYAM-AP-11-0187263',
    applicantMobile: '8309276541',
    address: 'Flat 302, Sri Sai Residency, Bhavanipuram, Vijayawada, NTR district, Andhra Pradesh – 520 012',
  },
  step12: {
    workingCapitalMargin: 1.9,
    machinery: 4.1,
    machineryItems: [
      { description: 'Semi-automatic jar filling and capping machine', condition: 'new', supplier: 'Sri Ganesh Food Machines, Hyderabad', quantity: 1, unitCost: 1.8 },
      { description: 'Induction cap sealer', condition: 'new', supplier: 'Sri Ganesh Food Machines, Hyderabad', quantity: 1, unitCost: 0.65 },
      { description: 'Spice pulveriser (5 HP)', condition: 'new', supplier: 'Venkateswara Industries, Vijayawada', quantity: 1, unitCost: 1.05 },
      { description: 'Packing table with weighing scale', condition: 'new', supplier: 'Venkateswara Industries, Vijayawada', quantity: 1, unitCost: 0.6 },
    ],
  },
  step13: {
    bankName: 'Canara Bank, Bhavanipuram branch',
    interestRate: 10.5,
    moratoriumMonths: 6,
    loanTenureMonths: 60,
    spvContribution: 1.9,
    governmentGrant: 0,
    bankLoan: 4,
    otherSources: 0.1,
  },
  step14: {
    rawMaterialItems: [
      { name: 'Raw mango, gongura and spices', use: 'Pickle and podi base', basis: 'Bought weekly from Vijayawada market and Guntur spice dealers' },
      { name: 'Jars, caps and labels', use: 'Retail packing', basis: 'Monthly from a Hyderabad packaging supplier' },
      { name: 'Courier cartons and tamper seals', use: 'Dispatch for ONDC orders', basis: 'Monthly from a local carton maker' },
    ],
    staffRoles: [
      { role: 'Production workers', count: 3, monthlyPay: 7500 },
      { role: 'Packing and dispatch helper', count: 1, monthlyPay: 7500 },
    ],
    rawMaterialCost: 10.8,
    powerCost: 0.6,
    wages: 3.6,
    maintenance: 0.3,
    administrativeExpenses: 1.2,
    marketingExpenses: 2.2,
    annualProductionVolume: 14400,
    annualSalesRealization: 21.6,
  },
  schemeExtras: {
    businessKind: 'manufacturing',
    ondcReady: 'planning',
    catalogueSkus: 28,
    entrepreneurName: 'Tadikonda Sravani',
    productListNote:
      '28 SKUs: 12 pickles in 500 g and 250 g jars, 9 podis and spice powders, 7 sweets and snacks. Photographs and HSN mapping for each SKU are pending.',
  },
};

export default sample;
