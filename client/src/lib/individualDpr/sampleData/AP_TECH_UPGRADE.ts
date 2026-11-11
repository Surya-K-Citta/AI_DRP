import type { SampleData } from './types';

// Source: QA doc section 11 (AP_TECH_UPGRADE).
// Deviations from QA doc (needed so every question counts as answered; zero/blank does not count):
//  1. Firm PAN filled with a firm-format PAN (QA leaves it blank).
//  2. Land (QA blank): 0.50 lakh for plot-boundary and survey works; building 4.00 -> 3.50 so FCI stays 94.50 and cost 110.00.
//  3. Other Sources (QA blank): 0.50 lakh (family loan); bank loan 55.70 -> 55.20 so finance = 110.00.
//  4. Year projections: five yearly rows as in the QA table.
const sample: SampleData = {
  step1: {
    unitName: 'Sri Padmavathi Plastic Industries',
    clusterName: 'Sri Padmavathi Plastic Industries',
    district: 'Tirupati',
    location: 'Renigunta',
    natureOfBusiness: 'Plastic products',
    majorProducts: 'Injection-moulded plastic stools, buckets, mugs and jugs',
  },
  step2: {
    sectorType: 'Plastic products — injection moulded household goods',
    sectorDescription:
      'Sri Padmavathi Plastic Industries moulds household plastic stools, buckets and mugs for wholesalers in Tirupati, Chittoor and Nellore districts.',
  },
  step3: {
    geography:
      'Plot in the Renigunta industrial area on the Tirupati to Chennai highway, 12 km from Tirupati railway station; Chennai port is 135 km away and granule suppliers at Chennai and Hyderabad deliver in two days.',
  },
  step4: {
    presentActivities:
      'Three old hydraulic moulding machines will be replaced by two servo-hydraulic injection moulding machines with chiller, loaders and new moulds to double output and cut power use.',
    yearOfEstablishment: '2018-09-05',
    commitmentDate: '2026-12-05',
    technologyLevel: 'Servo-hydraulic injection moulding with auto loaders and chiller after upgrade',
    productionCapacity: '60,000 pieces per month after upgrade',
    productMix: [
      { name: 'Plastic stools', sharePercent: 30, sellingPrice: 165 },
      { name: 'Buckets, 16 litre', sharePercent: 35, sellingPrice: 110 },
      { name: 'Mugs and jugs', sharePercent: 35, sellingPrice: 38 },
    ],
  },
  step6: {
    targetMarket:
      'Wholesale dealers in Tirupati, Chittoor, Nellore and Kadapa districts, private-label orders from Hyderabad supermarket chains, and SHG-run household stores; 14 regular distributors place weekly orders.',
    existingDemand:
      'Distributors ask for more 16-litre buckets and stools than the present 30,000 pieces a month; two supermarket private-label buyers have requested sample lots.',
  },
  step10: {
    name: 'Own factory shed of 5,500 sq ft with 75 kVA connection, Renigunta industrial area',
    landDetails:
      "Plot bought in 2018 and shed built on it; sale deed is in the proprietress's name; an 800 sq ft extension is needed for the new machines.",
  },
  step11: {
    spvName: 'Gummadi Lakshmi Prasanna (Proprietress), Sri Padmavathi Plastic Industries',
    legalStatus: 'Sole proprietorship',
    gstin: '37CPRPG5528L1Z8',
    firmPan: 'AAFFS5528L',
    udyamNumber: 'UDYAM-AP-24-0061937',
    applicantMobile: '9701553826',
    address: 'Plot 27, Industrial Area, Renigunta, Tirupati District, Andhra Pradesh - 517520',
  },
  step12: {
    machineryItems: [
      { description: 'Servo-hydraulic injection moulding machine, 150 tonne', condition: 'new', supplier: 'Hyderabad Injection Systems, Hyderabad', quantity: 1, unitCost: 24.5 },
      { description: 'Servo-hydraulic injection moulding machine, 250 tonne', condition: 'new', supplier: 'Hyderabad Injection Systems, Hyderabad', quantity: 1, unitCost: 38 },
      { description: 'Water chiller 10 TR', condition: 'new', supplier: 'Coolwell Industrial Chillers, Chennai', quantity: 1, unitCost: 4.5 },
      { description: 'Hopper dryer with auto loader', condition: 'new', supplier: 'Sri Balaji Polymer Equipments, Chennai', quantity: 2, unitCost: 1.75 },
      { description: 'Multi-cavity mould set (16 L bucket and stool)', condition: 'new', supplier: 'Annapurna Tool Room, Hyderabad', quantity: 2, unitCost: 9 },
    ],
    machinery: 88.5,
    land: 0.5,
    building: 3.5,
    utilitiesAndInfrastructure: 2,
    preliminaryAndPreOperative: 1.5,
    workingCapitalMargin: 14,
  },
  step13: {
    bankName: 'Indian Bank, Renigunta branch',
    interestRate: 10.75,
    moratoriumMonths: 6,
    loanTenureMonths: 72,
    spvContribution: 16.5,
    governmentGrant: 37.8,
    bankLoan: 55.2,
    otherSources: 0.5,
  },
  step14: {
    rawMaterialItems: [
      { name: 'PP copolymer granules', use: 'Stools, buckets and mugs', basis: 'Truck lots from Chennai dealer on 15-day credit' },
      { name: 'HDPE granules', use: 'Jugs and bucket handles', basis: 'Monthly lots from Hyderabad supplier' },
      { name: 'Colour masterbatch', use: 'Product colouring', basis: 'Quarterly purchase from a Chennai trader' },
      { name: 'Poly-bags and cartons', use: 'Packing', basis: 'Local supplier at Tirupati' },
    ],
    staffRoles: [
      { role: 'Machine operator', count: 6, monthlyPay: 14000 },
      { role: 'Mould and maintenance technician', count: 2, monthlyPay: 20000 },
      { role: 'Quality and packing worker', count: 6, monthlyPay: 10000 },
      { role: 'Production supervisor', count: 1, monthlyPay: 25000 },
      { role: 'Accounts and dispatch staff', count: 2, monthlyPay: 15000 },
    ],
    rawMaterialCost: 310,
    powerCost: 24,
    wages: 28.68,
    maintenance: 6,
    administrativeExpenses: 7.2,
    marketingExpenses: 9.6,
    annualProductionVolume: 468000,
    annualSalesRealization: 474.08,
  },
  step15: {
    yearProjections: [
      { year: 1, sales: 474.08, rm: 310, wages: 28.68, power: 24, netProfit: 51.39 },
      { year: 2, sales: 497.78, rm: 325.5, wages: 30.11, power: 25.2, netProfit: 56.8 },
      { year: 3, sales: 522.67, rm: 341.78, wages: 31.62, power: 26.46, netProfit: 62.29 },
      { year: 4, sales: 548.81, rm: 358.86, wages: 33.2, power: 27.78, netProfit: 67.86 },
      { year: 5, sales: 576.25, rm: 376.81, wages: 34.86, power: 29.17, netProfit: 73.53 },
    ],
    breakEvenPoint: 23.9,
  },
  step16: {
    startDate: '2027-03-20',
    milestones: [
      { activity: 'Order injection moulding machines and moulds', timeRequired: '', startDate: '2026-12-05', endDate: '2026-12-20' },
      { activity: 'Shed extension, foundations and 90 HP power upgrade', timeRequired: '', startDate: '2026-12-15', endDate: '2027-02-10' },
      { activity: 'Installation, trial run and mould trials', timeRequired: '', startDate: '2027-02-20', endDate: '2027-03-15' },
    ],
  },
  schemeExtras: {
    businessKind: 'manufacturing',
    enterpriseSize: 'small',
    specialCategory: 'yes',
    apDomicile: 'yes',
    yearsInOperation: '8',
    existingTurnover: '285',
    entrepreneurName: 'Gummadi Lakshmi Prasanna',
    entrepreneurAge: '36',
    processOfManufacture:
      'PP and HDPE granules are dried and fed through the loader into the injection moulding machine, moulded in multi-cavity moulds, cooled by the chiller, trimmed and inspected, and finished goods are packed in poly-bags and cartons for dispatch.',
    existingTech:
      'Three 15-year-old toggle-type hydraulic moulding machines of 90 to 150 tonne with high power draw, manual material feeding and 6.5% rejection; 48 seconds cycle time for a 16-litre bucket.',
    proposedTech:
      'Two servo-hydraulic injection moulding machines (150 T and 250 T), a 10 TR water chiller, two hopper-dryer-loader units and two new multi-cavity moulds; all new with one-year OEM warranty and energy meters.',
    productivityGain:
      'Cycle time falls to 32 seconds, power per kg of moulded product drops about 35%, rejection falls below 2% and monthly capacity doubles from 30,000 to 60,000 pieces.',
    existingCapacity: '30,000 pieces per month',
    installedCapacity: '60,000 pieces per month after upgrade',
    capacityUtilisationY1: '65',
    premisesType: 'owned',
    powerRequirement: '90 HP (67 kW) after upgrade, 75 kVA transformer',
  },
};
export default sample;
