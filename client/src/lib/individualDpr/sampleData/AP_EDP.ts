import type { SampleData } from './types';

// Source: QA doc section 12 (AP_EDP).
// Deviations from QA doc (needed so every question counts as answered; zero/blank does not count):
//  1. Firm PAN filled with a firm-format PAN (QA leaves it blank).
//  2. Other Sources (QA blank): 0.50 lakh (family loan); bank loan 45.67 -> 45.17 so finance = 100.00.
//  3. Year projections: five yearly rows as in the QA table.
const sample: SampleData = {
  step1: {
    unitName: 'Sri Ramalingeswara Steel Furniture Works',
    clusterName: 'Sri Ramalingeswara Steel Furniture Works',
    district: 'Krishna',
    location: 'Gannavaram',
    natureOfBusiness: 'Furniture making',
    majorProducts: 'Steel almirahs, hostel cots, school bench-desk sets and office filing racks',
  },
  step2: {
    sectorType: 'Engineering goods — sheet-metal and steel furniture',
    sectorDescription:
      'Sri Ramalingeswara Steel Furniture Works will make powder-coated steel almirahs, hostel cots and school furniture for government hostels, schools and dealers in the Krishna and NTR districts.',
  },
  step3: {
    geography:
      'Plot 41 in the APIIC Industrial Park at Gannavaram, 4 km from Vijayawada airport and NH-16 with water, 33/11 kV power and internal roads; steel stockists at Vijayawada are 22 km away.',
  },
  step4: {
    presentActivities:
      'A new greenfield sheet-metal furniture unit in the APIIC Industrial Park at Gannavaram with shearing, bending, welding and powder-coating lines in one shed.',
    yearOfEstablishment: '2026-11-02',
    commitmentDate: '2026-11-25',
    technologyLevel: 'Semi-automatic sheet-metal line with powder-coating oven',
    productionCapacity: '4,800 pieces per year (single shift)',
    productMix: [
      { name: 'Steel almirah, 2-door', sharePercent: 40, sellingPrice: 9800 },
      { name: 'Hostel cot, double-decker', sharePercent: 25, sellingPrice: 7200 },
      { name: 'School bench-desk set', sharePercent: 20, sellingPrice: 3900 },
      { name: 'Office filing rack', sharePercent: 15, sellingPrice: 5400 },
    ],
  },
  step6: {
    targetMarket:
      'Government social-welfare and BC-welfare hostels, Zilla Parishad and private schools, and office-furniture dealers in Krishna, NTR, Eluru and Guntur districts; empanelment for welfare-hostel supply is planned.',
    existingDemand:
      'Hostel and school furniture is bought in bulk every June and January; Vijayawada dealers have quoted indicative orders of about 1,200 pieces a year.',
  },
  step10: {
    name: 'APIIC Plot 41 of 1,200 sq m with a 7,200 sq ft production shed, Gannavaram',
    landDetails:
      "Plot allotted by APIIC on lease-cum-sale basis (allotment letter dated 2026-09-18 in the promoter's name); the shed will be built by the unit.",
  },
  step11: {
    spvName: 'Muppidi Naga Raju (Proprietor), Sri Ramalingeswara Steel Furniture Works',
    legalStatus: 'Sole proprietorship',
    gstin: '37DLWPM3316K1ZG',
    firmPan: 'AAFFR7164M',
    udyamNumber: 'UDYAM-AP-05-0072164',
    applicantMobile: '9885307642',
    address: 'Door No. 2-61, Ramalingeswara Colony, Gannavaram, Krishna District, Andhra Pradesh - 521101',
  },
  step12: {
    machineryItems: [
      { description: 'Hydraulic press brake, 80 tonne, 2.5 m', condition: 'new', supplier: 'Sri Lakshmi Machine Tools, Vijayawada', quantity: 1, unitCost: 11.5 },
      { description: 'Sheet shearing machine, 6 ft', condition: 'new', supplier: 'Sri Lakshmi Machine Tools, Vijayawada', quantity: 1, unitCost: 6.2 },
      { description: 'Spot welding machine, 25 kVA', condition: 'new', supplier: 'Auto Nagar Welding Supplies, Vijayawada', quantity: 2, unitCost: 1.1 },
      { description: 'MIG welding set, 350 A', condition: 'new', supplier: 'Auto Nagar Welding Supplies, Vijayawada', quantity: 3, unitCost: 0.85 },
      { description: 'Powder-coating booth with curing oven', condition: 'new', supplier: 'Kakatiya Coating Systems, Hyderabad', quantity: 1, unitCost: 9.5 },
      { description: 'Pipe cutting and bending machine', condition: 'new', supplier: 'Sri Lakshmi Machine Tools, Vijayawada', quantity: 1, unitCost: 1.85 },
      { description: 'Air compressor, 5 HP', condition: 'new', supplier: 'Auto Nagar Welding Supplies, Vijayawada', quantity: 1, unitCost: 1.4 },
    ],
    machinery: 35.2,
    land: 18,
    building: 28,
    utilitiesAndInfrastructure: 3.5,
    preliminaryAndPreOperative: 2,
    furniture: 1.5,
    securityDeposits: 1.2,
    workingCapitalMargin: 10.6,
  },
  step13: {
    bankName: 'State Bank of India, Gannavaram branch',
    interestRate: 10.5,
    moratoriumMonths: 6,
    loanTenureMonths: 84,
    spvContribution: 15,
    governmentGrant: 39.33,
    bankLoan: 45.17,
    otherSources: 0.5,
  },
  step14: {
    rawMaterialItems: [
      { name: 'CRCA steel sheet, 0.8 to 1.2 mm', use: 'Almirahs, cots and racks', basis: 'Monthly truck lots from Vijayawada steel stockist' },
      { name: 'MS pipes and angles', use: 'Cots, benches and frames', basis: 'Fortnightly purchase from Auto Nagar dealer' },
      { name: 'Powder-coating powder and phosphating chemicals', use: 'Surface finish', basis: 'Quarterly order from Hyderabad supplier' },
      { name: 'Locks, hinges and packing cartons', use: 'Fittings and packing', basis: 'Monthly local purchase' },
    ],
    staffRoles: [
      { role: 'Foreman', count: 1, monthlyPay: 25000 },
      { role: 'Welder', count: 4, monthlyPay: 18000 },
      { role: 'Press-brake and shearing operator', count: 2, monthlyPay: 16000 },
      { role: 'Powder-coating operator', count: 2, monthlyPay: 14000 },
      { role: 'Helper', count: 4, monthlyPay: 10000 },
      { role: 'Store and accounts assistant', count: 1, monthlyPay: 15000 },
    ],
    rawMaterialCost: 122,
    powerCost: 6.5,
    wages: 25.44,
    maintenance: 2.4,
    administrativeExpenses: 4.2,
    marketingExpenses: 5,
    annualProductionVolume: 2880,
    annualSalesRealization: 210.53,
  },
  step15: {
    yearProjections: [
      { year: 1, sales: 210.53, rm: 122, wages: 25.44, power: 6.5, netProfit: 23.45 },
      { year: 2, sales: 221.06, rm: 128.1, wages: 26.71, power: 6.83, netProfit: 26.32 },
      { year: 3, sales: 232.11, rm: 134.5, wages: 28.05, power: 7.17, netProfit: 29.29 },
      { year: 4, sales: 243.71, rm: 141.23, wages: 29.45, power: 7.52, netProfit: 32.26 },
      { year: 5, sales: 255.9, rm: 148.29, wages: 30.92, power: 7.9, netProfit: 35.32 },
    ],
    breakEvenPoint: 27.1,
  },
  step16: {
    startDate: '2027-06-15',
    milestones: [
      { activity: 'Plan approval and civil construction of shed', timeRequired: '', startDate: '2026-11-25', endDate: '2027-03-31' },
      { activity: 'Machinery order, power connection and installation', timeRequired: '', startDate: '2027-03-01', endDate: '2027-05-20' },
      { activity: 'Trial production and CFE/CFO clearances', timeRequired: '', startDate: '2027-05-25', endDate: '2027-06-10' },
    ],
  },
  schemeExtras: {
    businessKind: 'manufacturing',
    enterpriseSize: 'micro',
    specialCategory: 'yes',
    scStOwned: 'yes',
    apDomicile: 'yes',
    apiicPark: 'yes',
    entrepreneurName: 'Muppidi Naga Raju',
    entrepreneurAge: '34',
    processOfManufacture:
      'CRCA steel sheets are sheared and punched, bent on the press brake, welded and ground, de-greased and phosphated, powder-coated and cured in the oven, then assembled with locks and fittings, inspected and packed in cartons with corner guards.',
    installedCapacity: '4,800 pieces per year (single shift)',
    capacityUtilisationY1: '60',
    premisesType: 'leased',
    powerRequirement: '60 HP (45 kW) 3-phase LT connection, 100 kVA transformer',
  },
};
export default sample;
