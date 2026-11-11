// Deviations from QA doc (a bare 0 counts as unanswered in the progress check, so two zero fields were made non-zero; totals unchanged at 70.00):
//  - land 0 -> 1 (lease premium / deposit for the leased site) and building 12 -> 11.
//  - Other Sources 0 -> 0.5 (partners' family loan) and Bank Loan 39.5 -> 39.
import type { SampleData } from './types';

const sample: SampleData = {
  step1: {
    unitName: 'Sri Manikanta Fruit Pulp Industries',
    clusterName: 'Sri Manikanta Fruit Pulp Industries',
    district: 'Chittoor',
    location: 'Puthalapattu',
    natureOfBusiness: 'Mango pulp processing and retort pouch packing',
    majorProducts: 'Totapuri mango pulp, Banganapalli mango pulp, retort pouch pulp',
  },
  step2: {
    sectorType: 'Agro and food processing – fruit pulp',
    sectorDescription:
      'Chittoor district is the largest mango pulp cluster in Andhra Pradesh. The unit buys Totapuri and Banganapalli mangoes from farmers around Puthalapattu and sells aseptic pulp in drums to juice makers. The upgrade adds a pasteuriser, a retort pouch line and a cold room for branded retail packs.',
  },
  step3: {
    geography:
      'The unit is 9 km from Chittoor town on the Chittoor–Tirupati road, about 150 km from Chennai port and 160 km from Bengaluru. Mango orchards within 40 km supply fruit from April to July, and refrigerated trucks reach Chennai markets overnight.',
  },
  step4: {
    presentActivities:
      'Season-based mango pulping for about 90 days a year with 12 workers. Pulp is filled hot into 210 kg aseptic drums and sold to juice makers in Chennai and Bengaluru.',
    yearOfEstablishment: '2020-06-01',
    commitmentDate: '2026-09-21',
    technologyLevel: 'Semi-automatic: pulper-finisher, tubular steam heater and manual drum filling',
    productionCapacity: '2 MT of pulp per hour; 180 MT per season',
    productMix: [
      { name: 'Totapuri mango pulp (210 kg aseptic drum)', sharePercent: 60, sellingPrice: 85 },
      { name: 'Banganapalli mango pulp (210 kg aseptic drum)', sharePercent: 25, sellingPrice: 105 },
      { name: 'Mango pulp retort pouch (1 kg)', sharePercent: 15, sellingPrice: 130 },
    ],
  },
  step6: {
    targetMarket:
      'Juice and beverage makers in Chennai and Bengaluru, ice cream makers and, from this project, modern retail chains and institutional kitchens in Tirupati and Vijayawada.',
    existingDemand:
      'Buyers have asked for 1 kg and 5 kg retort pouches. Two Chennai dairies placed trial orders for 12 MT in 2025 that the unit could not pack in pouches.',
  },
  step10: {
    name: 'Leased processing shed, Puthalapattu',
    landDetails:
      'Registered nine-year lease of 0.60 acre with a 6,400 sq.ft. shed at Puthalapattu; rent ₹38,000 per month; lease deed dated 2024-02-12.',
    powerRequirements: '75 HP three-phase',
  },
  step11: {
    spvName: 'Sri Manikanta Fruit Pulp Industries',
    legalStatus: 'Partnership firm',
    gstin: '37AAFFM4821K1Z4',
    firmPan: 'AAFFM4821K',
    udyamNumber: 'UDYAM-AP-06-0034821',
    applicantMobile: '9440218735',
    address: 'Plot 214/3, Industrial Area, Puthalapattu, Chittoor district, Andhra Pradesh – 517 126',
  },
  step12: {
    land: 1,
    building: 11,
    utilitiesAndInfrastructure: 4.5,
    preliminaryAndPreOperative: 2.5,
    workingCapitalMargin: 14,
    machinery: 37,
    machineryItems: [
      { description: 'Fruit washing and roller sorting conveyor', condition: 'new', supplier: 'Sri Lakshmi Food Engineers, Coimbatore', quantity: 1, unitCost: 3.8 },
      { description: 'Pulper-finisher (SS 304, 2 MT per hour)', condition: 'new', supplier: 'Shree Ganesh Agro Machinery, Rajkot', quantity: 1, unitCost: 6.5 },
      { description: 'Tubular pasteuriser with steam heat exchanger', condition: 'new', supplier: 'Sri Lakshmi Food Engineers, Coimbatore', quantity: 1, unitCost: 9.2 },
      { description: 'Retort pouch filling and sealing machine', condition: 'new', supplier: 'Hosur Packaging Systems, Hosur', quantity: 1, unitCost: 4.6 },
      { description: 'Biomass steam boiler (300 kg per hour)', condition: 'new', supplier: 'Thermax dealer, Vijayawada', quantity: 1, unitCost: 5.4 },
      { description: 'Cold room (10 MT, panel type)', condition: 'new', supplier: 'Blue Star dealer, Tirupati', quantity: 1, unitCost: 7.5 },
    ],
  },
  step13: {
    bankName: 'State Bank of India, Chittoor main branch',
    interestRate: 10.75,
    moratoriumMonths: 6,
    loanTenureMonths: 84,
    spvContribution: 17.5,
    governmentGrant: 13,
    bankLoan: 39,
    otherSources: 0.5,
  },
  step14: {
    rawMaterialItems: [
      { name: 'Mango – Totapuri and Banganapalli', use: 'Fruit for pulp', basis: 'Bought direct from farmers and Puthalapattu mandi in season' },
      { name: 'Aseptic bags and 210 kg drums', use: 'Bulk packing', basis: 'Annual rate contract with a Hosur supplier' },
      { name: 'Retort pouches and cartons', use: 'Retail packing', basis: 'Ordered quarterly from a Chennai converter' },
      { name: 'Citric acid and ascorbic acid', use: 'Preservation', basis: 'Bought monthly from an Anakapalli distributor' },
    ],
    staffRoles: [
      { role: 'Plant manager', count: 1, monthlyPay: 28000 },
      { role: 'Production supervisors', count: 2, monthlyPay: 18000 },
      { role: 'Machine operators', count: 6, monthlyPay: 13500 },
      { role: 'Helpers and loaders', count: 10, monthlyPay: 9500 },
      { role: 'QC chemist', count: 1, monthlyPay: 22000 },
    ],
    rawMaterialCost: 104,
    powerCost: 6,
    wages: 15.72,
    maintenance: 2.4,
    administrativeExpenses: 3,
    marketingExpenses: 4,
    annualProductionVolume: 180000,
    annualSalesRealization: 174.15,
  },
  step15: {
    yearProjections: [
      { year: 1, sales: 174.15, rm: 104, wages: 15.72, power: 6, netProfit: 20.35 },
      { year: 2, sales: 182.86, rm: 109.2, wages: 16.51, power: 6.3, netProfit: 22.86 },
      { year: 3, sales: 192, rm: 114.66, wages: 17.33, power: 6.62, netProfit: 25.44 },
      { year: 4, sales: 201.6, rm: 120.39, wages: 18.2, power: 6.95, netProfit: 28.05 },
      { year: 5, sales: 211.68, rm: 126.41, wages: 19.11, power: 7.29, netProfit: 30.71 },
    ],
    breakEvenPoint: 57.71,
  },
  step16: {
    startDate: '2027-04-05',
    milestones: [
      { activity: 'Order, deliver and install pasteuriser, retort line and cold room', startDate: '2026-11-02', endDate: '2027-02-15' },
      { activity: 'Power load increase to 75 HP and boiler licence', startDate: '2026-12-01', endDate: '2027-01-20' },
      { activity: 'Trial run, FSSAI licence update and first retort pouch batches', startDate: '2027-02-22', endDate: '2027-03-31' },
    ],
  },
  schemeExtras: {
    businessKind: 'manufacturing',
    enterpriseSize: 'small',
    specialCategory: 'no',
    fpoShg: 'no',
    apDomicile: 'yes',
    premisesType: 'lease',
    entrepreneurName: 'Kasireddy Hari Krishna Reddy',
  },
};

export default sample;
