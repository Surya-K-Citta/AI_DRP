// Deviations from QA doc (a bare 0 counts as unanswered in the progress check; totals unchanged at 79.50):
//  - Land 0 -> 0.5 (site development / paving of the existing plot) and Building / shed 4.5 -> 4.
//  - Other Sources 0 -> 0.5 (partners' unsecured loan) and Promoter contribution 17.5 -> 17.
import type { SampleData } from './types';

const sample: SampleData = {
  step1: {
    unitName: 'Sri Lakshmi Narasimha Polymers',
    clusterName: 'Sri Lakshmi Narasimha Polymers',
    district: 'Anakapalli',
    location: 'Anakapalli',
    natureOfBusiness: 'PET bottle recycling and flake manufacturing',
    majorProducts: 'Hot-washed PET flakes, recycled PET pellets',
  },
  step2: {
    sectorType: 'Circular economy – plastic recycling',
    sectorDescription:
      "Post-consumer PET bottles collected around Visakhapatnam and Anakapalli are washed, crushed and sold as flakes to fibre and sheet makers. The upgrade adds a hot-wash line and a pelletiser so the unit can sell higher-value recycled pellets and meet buyers' quality norms.",
  },
  step3: {
    geography:
      'The unit stands in the Anakapalli industrial belt, about 35 km from Visakhapatnam port and close to the Chennai–Kolkata highway. Waste PET bales come from collectors within 150 km, and buyers in Hyderabad and Chennai collect by truck.',
  },
  step4: {
    presentActivities:
      'The unit has crushed and cold-washed PET bottles since 2019 on a 150 kg per hour line and sells loose flakes. It has 14 workers on one shift.',
    yearOfEstablishment: '2019-08-12',
    commitmentDate: '2026-09-28',
    technologyLevel: 'Cold wash, crusher and baling; no hot wash or pelletising yet',
    productionCapacity: '300 kg per hour after the upgrade (150 kg per hour before); about 720 MT a year at full capacity',
    productMix: [
      { name: 'Hot-washed PET flakes', sharePercent: 70, sellingPrice: 60 },
      { name: 'Recycled PET pellets', sharePercent: 30, sellingPrice: 84 },
    ],
  },
  step6: {
    targetMarket:
      'Polyester fibre and strapping-sheet manufacturers in Hyderabad, Chennai and Vijayawada, and packaging converters that need recycled pellets.',
    existingDemand:
      'Two Hyderabad buyers have asked for 40 MT a month of hot-washed flakes and a Chennai strapping maker for 25 MT a month of pellets, none of which the unit can supply today.',
  },
  step10: {
    name: 'Own recycling shed, Anakapalli',
    landDetails:
      'Own freehold shed of 8,000 sq.ft. on 0.75 acre bought in 2019. No land or shed purchase is part of this project; the new line uses the existing 150 kW connection.',
    powerRequirements: '150 kW',
  },
  step11: {
    spvName: 'Sri Lakshmi Narasimha Polymers LLP',
    legalStatus: 'Limited liability partnership',
    gstin: '37AAKFL6173Q1ZF',
    firmPan: 'AAKFL6173Q',
    udyamNumber: 'UDYAM-AP-02-0156342',
    applicantMobile: '9885123407',
    address: 'Survey No. 88/2, Industrial Estate Road, Anakapalli, Anakapalli district, Andhra Pradesh – 531 001',
  },
  step12: {
    land: 0.5,
    building: 4,
    utilitiesAndInfrastructure: 1.5,
    preliminaryAndPreOperative: 1.5,
    workingCapitalMargin: 20,
    machinery: 52,
    machineryItems: [
      { description: 'PET label remover and pre-wash drum', condition: 'new', supplier: 'Shree Plastic Machinery, Ahmedabad', quantity: 1, unitCost: 6.8 },
      { description: 'Hot-wash friction washer line', condition: 'new', supplier: 'Shree Plastic Machinery, Ahmedabad', quantity: 1, unitCost: 14.2 },
      { description: 'Granulator / crusher (300 kg per hour)', condition: 'new', supplier: 'Nirmal Recycling Systems, Coimbatore', quantity: 1, unitCost: 9.5 },
      { description: 'Float-sink separation tank', condition: 'new', supplier: 'Nirmal Recycling Systems, Coimbatore', quantity: 1, unitCost: 4.6 },
      { description: 'Centrifugal dryer', condition: 'new', supplier: 'Shree Plastic Machinery, Ahmedabad', quantity: 1, unitCost: 5.4 },
      { description: 'Flake pelletiser (extruder with melt filter)', condition: 'new', supplier: 'Nirmal Recycling Systems, Coimbatore', quantity: 1, unitCost: 11.5 },
    ],
  },
  step13: {
    bankName: 'State Bank of India, Anakapalli main branch',
    interestRate: 10.25,
    moratoriumMonths: 6,
    loanTenureMonths: 84,
    spvContribution: 17,
    governmentGrant: 12.5,
    bankLoan: 49.5,
    otherSources: 0.5,
  },
  step14: {
    rawMaterialItems: [
      { name: 'Waste PET bottle bales', use: 'Main feedstock', basis: 'Bought from collectors on a weekly rate at about ₹38 per kg' },
      { name: 'Caustic soda and detergent', use: 'Hot-wash chemicals', basis: 'Monthly from a Visakhapatnam chemical dealer' },
      { name: 'HDPE woven bags', use: 'Flake and pellet packing', basis: 'Quarterly from a Vijayawada bag maker' },
    ],
    staffRoles: [
      { role: 'Plant supervisor', count: 1, monthlyPay: 26000 },
      { role: 'Machine operators', count: 6, monthlyPay: 14000 },
      { role: 'Sorting labour', count: 12, monthlyPay: 10500 },
      { role: 'Maintenance fitter', count: 1, monthlyPay: 18000 },
      { role: 'Accountant', count: 1, monthlyPay: 18000 },
    ],
    rawMaterialCost: 195,
    powerCost: 14.4,
    wages: 32.64,
    maintenance: 4.2,
    administrativeExpenses: 6,
    marketingExpenses: 3,
    annualProductionVolume: 432000,
    annualSalesRealization: 290.3,
  },
  step15: {
    yearProjections: [
      { year: 1, sales: 290.3, rm: 195, wages: 32.64, power: 14.4, netProfit: 16 },
      { year: 2, sales: 304.82, rm: 204.75, wages: 34.27, power: 15.12, netProfit: 18.62 },
      { year: 3, sales: 320.06, rm: 214.99, wages: 35.99, power: 15.88, netProfit: 21.26 },
      { year: 4, sales: 336.06, rm: 225.74, wages: 37.78, power: 16.67, netProfit: 23.91 },
      { year: 5, sales: 352.86, rm: 237.02, wages: 39.67, power: 17.5, netProfit: 26.59 },
    ],
    breakEvenPoint: 73.62,
  },
  schemeExtras: {
    businessKind: 'manufacturing',
    circularSector: 'plastic',
    existingUnitYears: 7,
    proposedPmCost: 52,
    entrepreneurName: 'Dronamraju Venkata Satyanarayana',
  },
};

export default sample;
