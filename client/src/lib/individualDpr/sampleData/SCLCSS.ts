import type { SampleData } from './types';

// Source: QA doc section 10 (SCLCSS).
// Deviations from QA doc (needed so every question counts as answered; zero/blank does not count):
//  1. Land (QA blank): 0.50 lakh for APIIC plot transfer/stamp charges; building 3.00 -> 2.50 so project cost stays 80.00.
//  2. Other Sources (QA blank): 0.50 lakh (partners' unsecured loan); bank loan 51.75 -> 51.25 so finance = 80.00.
//  3. Year projections: five yearly rows as in the QA table (the model may run 7 years).
const sample: SampleData = {
  step1: {
    unitName: 'Sri Sai Balaji Precision Works',
    clusterName: 'Sri Sai Balaji Precision Works',
    district: 'Kakinada',
    location: 'Samalkota',
    natureOfBusiness: 'Engineering workshop',
    majorProducts: 'CNC-turned pump shafts, bushes and tractor implement pins',
  },
  step2: {
    sectorType: 'Engineering goods — precision machined components',
    sectorDescription:
      'Sri Sai Balaji Precision Works makes turned and milled steel components for pump manufacturers and tractor implement makers around Kakinada and Rajamahendravaram.',
  },
  step3: {
    geography:
      'Plot 14 in the Samalkota Industrial Estate, 2 km from Samalkota railway station and 14 km from Kakinada; customers are within 120 km in Kakinada, East Godavari, Konaseema and Eluru districts.',
  },
  step4: {
    presentActivities:
      'The workshop will install a CNC turning centre and a vertical machining centre to replace three conventional lathes and cut rejection and cycle time.',
    yearOfEstablishment: '2016-03-14',
    commitmentDate: '2026-12-10',
    technologyLevel: 'Conventional centre lathes today; CNC turning and machining after upgrade',
    productionCapacity: '600 components per day (two shifts) after new machinery',
    productMix: [
      { name: 'Pump shafts and bushes', sharePercent: 50, sellingPrice: 185 },
      { name: 'Tractor implement pins and couplings', sharePercent: 30, sellingPrice: 260 },
      { name: 'Job-work turning and milling', sharePercent: 20, sellingPrice: 95 },
    ],
  },
  step6: {
    targetMarket:
      'Pump set manufacturers at Rajamahendravaram and Samalkota, tractor implement makers in Kakinada district, three Visakhapatnam engineering firms on monthly job orders, and Government agro-engineering supply through the SC/ST Hub vendor list.',
    existingDemand:
      'About 3,500 pieces a month are declined today for lack of CNC accuracy; two buyers have written to place 4,000 pieces a month once the CNC line is ready.',
  },
  step10: {
    name: 'Own workshed of 3,200 sq ft, Plot 14, APIIC Industrial Estate, Samalkota',
    landDetails: 'Plot and shed owned by the firm through an APIIC allotment registered in 2016; no rent is payable.',
  },
  step11: {
    spvName: 'M/s Sri Sai Balaji Precision Works',
    legalStatus: 'Partnership firm',
    gstin: '37AAKFS4417H1Z0',
    firmPan: 'AAKFS4417H',
    udyamNumber: 'UDYAM-AP-07-0045218',
    applicantMobile: '9440218734',
    address: 'Plot 14, APIIC Industrial Estate, Samalkota, Kakinada District, Andhra Pradesh - 533440',
  },
  step12: {
    machineryItems: [
      { description: 'CNC turning centre, 8-station turret, 20 HP spindle', condition: 'new', supplier: 'Sri Vijaya Machine Tools, Hyderabad', quantity: 1, unitCost: 24 },
      { description: 'CNC vertical machining centre, 850 x 500 mm table', condition: 'new', supplier: 'Sri Vijaya Machine Tools, Hyderabad', quantity: 1, unitCost: 34.5 },
      { description: 'Tool and cutter grinder', condition: 'new', supplier: 'Godavari Tooling Corporation, Rajamahendravaram', quantity: 1, unitCost: 3.5 },
      { description: 'Digital height gauge, micrometer and bore gauge set', condition: 'new', supplier: 'Precision Metrology Traders, Visakhapatnam', quantity: 1, unitCost: 1.2 },
      { description: 'Screw air compressor 7.5 HP with dryer', condition: 'new', supplier: 'Kakinada Air Systems, Kakinada', quantity: 1, unitCost: 1.8 },
    ],
    machinery: 65,
    land: 0.5,
    building: 2.5,
    utilitiesAndInfrastructure: 1.5,
    preliminaryAndPreOperative: 1.5,
    workingCapitalMargin: 9,
  },
  step13: {
    bankName: 'Union Bank of India, Samalkota branch',
    interestRate: 10.5,
    moratoriumMonths: 6,
    loanTenureMonths: 84,
    spvContribution: 12,
    governmentGrant: 16.25,
    bankLoan: 51.25,
    otherSources: 0.5,
  },
  step14: {
    rawMaterialItems: [
      { name: 'EN8 and EN24 bright steel bars', use: 'Shafts, bushes and pins', basis: 'Monthly purchase from a Visakhapatnam steel stockist' },
      { name: 'Forged blanks', use: 'Couplings and implement pins', basis: 'Quarterly lots from a Rajamahendravaram forging unit' },
      { name: 'Carbide inserts and cutting coolant', use: 'CNC tooling consumables', basis: 'Monthly order from Hyderabad tooling dealer' },
      { name: 'Anti-rust oil and packing crates', use: 'Packing and dispatch', basis: 'Local purchase at Kakinada' },
    ],
    staffRoles: [
      { role: 'CNC programmer-operator', count: 2, monthlyPay: 22000 },
      { role: 'Conventional turner', count: 3, monthlyPay: 16000 },
      { role: 'Quality inspector', count: 1, monthlyPay: 15000 },
      { role: 'Helper', count: 3, monthlyPay: 10000 },
      { role: 'Accountant-cum-store keeper', count: 1, monthlyPay: 14000 },
    ],
    rawMaterialCost: 108,
    powerCost: 9.6,
    wages: 18.12,
    maintenance: 3.6,
    administrativeExpenses: 4.8,
    marketingExpenses: 2.4,
    annualProductionVolume: 99000,
    annualSalesRealization: 187.61,
  },
  step15: {
    yearProjections: [
      { year: 1, sales: 187.61, rm: 108, wages: 18.12, power: 9.6, netProfit: 18.91 },
      { year: 2, sales: 196.99, rm: 113.4, wages: 19.03, power: 10.08, netProfit: 21.97 },
      { year: 3, sales: 206.84, rm: 119.07, wages: 19.98, power: 10.58, netProfit: 25.09 },
      { year: 4, sales: 217.18, rm: 125.02, wages: 20.98, power: 11.11, netProfit: 28.15 },
      { year: 5, sales: 228.04, rm: 131.27, wages: 22.02, power: 11.67, netProfit: 31.27 },
    ],
    breakEvenPoint: 22.7,
  },
  step16: {
    startDate: '2027-03-10',
    milestones: [
      { activity: 'Place order for CNC machines and pay advance', timeRequired: '', startDate: '2026-12-10', endDate: '2026-12-24' },
      { activity: 'Foundation work and power load raised to 45 HP', timeRequired: '', startDate: '2026-12-15', endDate: '2027-01-31' },
      { activity: 'Installation, trial run and operator training', timeRequired: '', startDate: '2027-02-10', endDate: '2027-03-05' },
    ],
  },
  schemeExtras: {
    businessKind: 'manufacturing',
    sclcssCategory: 'sc',
    unitStage: 'existing',
    controllingStakePercent: '60',
    udyamStatus: 'UDYAM-AP-07-0045218',
    entrepreneurName: 'Gedela Suresh Babu',
    entrepreneurAge: '41',
    processOfManufacture:
      'Bright bars and forged blanks are cut to length, rough and finish turned on the CNC turning centre, milled and drilled on the machining centre, checked with digital gauges every tenth piece, deburred, oiled and packed in crates for dispatch to pump and implement makers.',
    existingTech:
      'Three conventional centre lathes, one radial drilling machine and one shaper run by skilled turners; manual vernier measurement; about 9% rejection and 22 minutes per shaft.',
    proposedTech:
      'One CNC turning centre with 8-station turret and 20 HP spindle, one vertical machining centre, a tool and cutter grinder, digital height gauge and micrometer set, and a 7.5 HP screw air compressor; all new with OEM warranty.',
    installedCapacity: '600 components per day (two shifts) after new machinery',
    capacityUtilisationY1: '55',
    premisesType: 'owned',
    powerRequirement: '45 HP connected load (33 kW), 3-phase LT',
  },
};
export default sample;
