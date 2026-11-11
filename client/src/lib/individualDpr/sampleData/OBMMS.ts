// Deviations from QA doc (a bare 0 counts as unanswered in the progress check):
//  - Other Sources 0 -> 0.25 (family help) and Government Grant 2.5 -> 2.25 so means of finance stays 5.00 (own 0.5 + grant 2.25 + loan 2 + other 0.25).
//  - GSTIN and Firm PAN left blank as in the QA doc (below GST threshold; sole proprietor has only a personal PAN, which the app refuses to store): Step 7 stays 5/7 in the verifier.
//  - machineryItems repeats the assets list (condition 'new'): the verifier counts it as a Step 8 question although the form shows only the Assets list for a trading shop.
import type { SampleData } from './types';

const sample: SampleData = {
  step1: {
    unitName: 'Sri Sai Ramana Kirana Stores',
    clusterName: 'Sri Sai Ramana Kirana Stores',
    district: 'Srikakulam',
    location: 'Amudalavalasa',
    natureOfBusiness: 'Retail kirana and grocery shop',
    majorProducts: 'Rice, pulses, spices, sugar, soaps, biscuits',
  },
  step2: {
    sectorType: 'Retail – grocery and general stores',
    sectorDescription:
      'Neighbourhood kirana shops supply daily groceries to families in Amudalavalasa town and nearby villages. The beneficiary will open a general store near the market road with a visi-cooler, a billing computer and a stock of rice, pulses and daily-use items.',
  },
  step3: {
    geography:
      'The shop is on the Amudalavalasa–Srikakulam road near the vegetable market, within 2 km of about 4,000 households. Wholesale stock comes from Srikakulam by weekly tempo delivery over 20 km.',
  },
  step4: {
    presentActivities:
      'The applicant has worked six years as a salesman in a grocery wholesale outlet at Srikakulam and now plans to set up his own retail store with a corporation subsidy and a bank loan.',
    yearOfEstablishment: '2026-10-05',
    commitmentDate: '2026-10-12',
    technologyLevel: 'Counter sales with electronic scales and computer billing',
    productionCapacity: 'About 48 customer bills a day, 14,400 bills a year',
    productMix: [
      { name: 'Rice, pulses and sugar', sharePercent: 45, sellingPrice: 270 },
      { name: 'Oil, spices and masalas', sharePercent: 25, sellingPrice: 310 },
      { name: 'Biscuits, soaps and daily-use items', sharePercent: 30, sellingPrice: 170 },
    ],
  },
  step6: {
    targetMarket:
      'Households within 2 km of the market road in Amudalavalasa, small tiffin centres and tea stalls buying in bulk, and villagers from three nearby hamlets.',
    existingDemand:
      'About 4,000 households live within 2 km. The two existing shops close by 8 pm and none offers home delivery, so evening and bulk demand is not being met.',
  },
  step10: {
    name: 'Rented shop, Market Road, Amudalavalasa',
    landDetails: 'Rented 400 sq.ft. shop at ₹4,000 per month under a one-year rent agreement signed on 2026-09-28.',
    powerRequirements: '2 kW',
  },
  step11: {
    spvName: 'Sri Sai Ramana Kirana Stores (proprietor Gollapalli Venkata Ramana)',
    legalStatus: 'Sole proprietorship',
    udyamNumber: 'UDYAM-AP-24-0123456',
    applicantMobile: '9490654312',
    address: 'D.No. 3-18, Market Road, Amudalavalasa, Srikakulam district, Andhra Pradesh – 532 185',
  },
  step12: {
    workingCapitalMargin: 2.25,
    machinery: 2.75,
    assetItems: [
      { item: 'Wall racks and shelving for grocery', category: 'Furniture & fixtures', quantity: 1, unitCost: 1 },
      { item: 'Visi-cooler / deep freezer (200 L)', category: 'Equipment & tools', quantity: 1, unitCost: 0.62 },
      { item: 'Electronic counter weighing scale (30 kg)', category: 'Equipment & tools', quantity: 2, unitCost: 0.12 },
      { item: 'Computer with billing software and barcode scanner', category: 'Computers & software', quantity: 1, unitCost: 0.54 },
      { item: 'Shop signboard, shutter fitting and grain storage bins', category: 'Furniture & fixtures', quantity: 1, unitCost: 0.35 },
    ],
    machineryItems: [
      { description: 'Wall racks and shelving for grocery', condition: 'new', supplier: 'Local supplier, Srikakulam', quantity: 1, unitCost: 1 },
      { description: 'Visi-cooler / deep freezer (200 L)', condition: 'new', supplier: 'Local supplier, Srikakulam', quantity: 1, unitCost: 0.62 },
      { description: 'Electronic counter weighing scale (30 kg)', condition: 'new', supplier: 'Local supplier, Srikakulam', quantity: 2, unitCost: 0.12 },
      { description: 'Computer with billing software and barcode scanner', condition: 'new', supplier: 'Local supplier, Srikakulam', quantity: 1, unitCost: 0.54 },
      { description: 'Shop signboard, shutter fitting and grain storage bins', condition: 'new', supplier: 'Local supplier, Srikakulam', quantity: 1, unitCost: 0.35 },
    ],
  },
  step13: {
    bankName: 'Andhra Pradesh Grameena Vikas Bank, Amudalavalasa branch',
    interestRate: 9,
    moratoriumMonths: 3,
    loanTenureMonths: 60,
    spvContribution: 0.5,
    governmentGrant: 2.25,
    bankLoan: 2,
    otherSources: 0.25,
  },
  step14: {
    rawMaterialItems: [
      { name: 'Rice, pulses and sugar', use: 'Daily staples for resale', basis: 'Weekly from Srikakulam wholesale market' },
      { name: 'Edible oils, spices and masalas', use: 'Cooking needs for resale', basis: 'Fortnightly from a Srikakulam distributor' },
      { name: 'Biscuits, soaps and daily-use items', use: 'Fast-moving goods for resale', basis: 'Company van-sales route every week' },
    ],
    staffRoles: [{ role: 'Shop assistant', count: 1, monthlyPay: 10000 }],
    rawMaterialCost: 31.68,
    powerCost: 0.36,
    wages: 1.2,
    maintenance: 0.12,
    administrativeExpenses: 0.6,
    marketingExpenses: 0.24,
    annualProductionVolume: 14400,
    annualSalesRealization: 36,
  },
  schemeExtras: {
    businessKind: 'trading',
    welfareCorporation: 'bc',
    whiteRiceCard: 'yes',
    activityTrade: 'Retail grocery (kirana) shop',
    entrepreneurAge: 34,
    entrepreneurName: 'Gollapalli Venkata Ramana',
  },
};

export default sample;
