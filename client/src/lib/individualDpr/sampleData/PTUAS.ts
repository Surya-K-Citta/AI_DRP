// Deviations from QA doc:
// - Land (QA: 0), government grant (QA: 0) and other sources (QA: 0) are the string "0.00" instead of 0, because progress counting ignores a bare 0 and the steps would show as incomplete.
import type { SampleData } from './types';

const sample: SampleData = {
  step1: {
    unitName: 'Sri Satya Pharma Formulations',
    clusterName: 'Sri Satya Pharma Formulations',
    district: 'Anakapalli',
    location: 'Anakapalli',
    natureOfBusiness: 'Manufacture of oral solid dosage pharmaceutical formulations (tablets)',
    majorProducts: 'Paracetamol, cetirizine and metformin tablets',
  },
  step2: {
    sectorType: 'Pharmaceutical formulations (oral solid dosage)',
    sectorDescription:
      'Tablet manufacturing unit making paracetamol, cetirizine and metformin tablets for own brand and contract supply to distributors in Andhra Pradesh and Odisha, upgrading granulation, compression, coating and packing technology to revised Schedule M GMP.',
  },
  step3: {
    geography:
      'Unit is a leased plot in Jawaharlal Nehru Pharma City, Parawada, 35 km from Visakhapatnam port and airport; common effluent treatment plant and 33 kV power in the park; distributors at Visakhapatnam, Vijayawada and Bhubaneswar.',
  },
  step4: {
    presentActivities:
      'Present: 9 crore tablets a year on old single-rotary press, manual packing. Proposed: replace with granulation, double-rotary compression, coating and blister lines with HVAC to meet revised Schedule M and raise output to about 14.6 lakh strips of 10 tablets.',
    yearOfEstablishment: '2014-03-17',
    commitmentDate: '2026-12-07',
    technologyLevel: 'Semi-automatic: single-rotary press, open pan coating, manual blister packing',
    productionCapacity: 'Proposed: 14.6 lakh strips of 10 tablets a year at 75% use',
    productMix: [
      { name: 'Paracetamol 500 mg tablets, strip of 10', sharePercent: 40, sellingPrice: 14 },
      { name: 'Cetirizine 10 mg tablets, strip of 10', sharePercent: 25, sellingPrice: 18 },
      { name: 'Metformin 500 mg tablets, strip of 10', sharePercent: 35, sellingPrice: 24 },
    ],
  },
  step6: {
    targetMarket:
      'Pharma distributors and stockists in Andhra Pradesh and Odisha, government dispensaries through tender supply, and contract manufacturing for two marketing companies.',
    existingDemand:
      'Two marketing companies have signed letters of intent for 4 lakh strips a year each once GMP certification is complete; present buyers want WHO-GMP certified supply.',
  },
  step10: {
    name: 'Leased factory building, Plot No. 14-B, Pharma City, Parawada',
    landDetails:
      'Leased from APIIC for 33 years; built-up area 6,500 sq ft; clean-room block of 2,200 sq ft to be built; HT power 100 kVA and borewell water in the park.',
    powerRequirements: '100 kVA',
  },
  step11: {
    spvName: 'Sri Satya Pharma Formulations',
    legalStatus: 'Sole proprietorship',
    address: 'Plot No. 14-B, Jawaharlal Nehru Pharma City, Parawada, Anakapalli district, Andhra Pradesh - 531021',
    gstin: '37AAMFS3086Q1Z8',
    firmPan: 'AAMFS3086Q',
    udyamNumber: 'UDYAM-AP-24-0081437',
    applicantMobile: '9700615284',
  },
  step12: {
    land: '0.00',
    building: 14.0,
    utilitiesAndInfrastructure: 2.5,
    preliminaryAndPreOperative: 4.5,
    machinery: 82.0,
    workingCapitalMargin: 22.0,
    machineryItems: [
      { description: 'Rapid mixer granulator, 100 litre', condition: 'new', supplier: 'Cadmach Machinery, Ahmedabad', quantity: 1, unitCost: 9.5 },
      { description: 'Fluid bed dryer, 60 kg', condition: 'new', supplier: 'Cadmach Machinery, Ahmedabad', quantity: 1, unitCost: 8.2 },
      { description: 'Double-rotary tablet compression machine, 27 station', condition: 'new', supplier: 'Elizabeth Pharma Machinery, Mumbai', quantity: 1, unitCost: 22.5 },
      { description: 'Automatic perforated coating machine, 36 inch', condition: 'new', supplier: 'Elizabeth Pharma Machinery, Mumbai', quantity: 1, unitCost: 11.8 },
      { description: 'Alu-Alu blister packing machine', condition: 'new', supplier: 'Pharma Pack Systems, Vadodara', quantity: 1, unitCost: 13.6 },
      { description: 'HVAC air handling unit with HEPA filters', condition: 'new', supplier: 'Airtech Cleanroom Solutions, Hyderabad', quantity: 2, unitCost: 8.2 },
    ],
  },
  step13: {
    spvContribution: 37.5,
    governmentGrant: '0.00',
    bankLoan: 87.5,
    otherSources: '0.00',
    bankName: 'State Bank of India, SME Branch, Visakhapatnam',
    interestRate: 10.25,
    moratoriumMonths: 6,
    loanTenureMonths: 84,
  },
  step14: {
    rawMaterialCost: 150.0,
    powerCost: 9.6,
    wages: 36.96,
    maintenance: 5.5,
    administrativeExpenses: 12.0,
    marketingExpenses: 22.0,
    annualProductionVolume: 1460000,
    annualSalesRealization: 270.1,
    rawMaterialItems: [
      { name: 'Active pharmaceutical ingredients (paracetamol, cetirizine, metformin)', use: 'Tablet formulation', basis: 'From licensed API dealers at Hyderabad, 30-day credit, lot-wise with COA' },
      { name: 'Excipients (starch, MCC, binders, coating polymers)', use: 'Granulation and coating', basis: 'Monthly from Vizag chemical suppliers' },
      { name: 'Alu-Alu foil and printed cartons', use: 'Strip packing', basis: 'Quarterly from Vadodara packaging supplier' },
    ],
    staffRoles: [
      { role: 'Production in-charge (B.Pharm)', count: 1, monthlyPay: 40000 },
      { role: 'QC chemist', count: 2, monthlyPay: 30000 },
      { role: 'Machine operator', count: 6, monthlyPay: 16000 },
      { role: 'Packing helper', count: 9, monthlyPay: 10000 },
      { role: 'Store-keeper', count: 1, monthlyPay: 22000 },
    ],
  },
  step15: {
    yearProjections: [
      { year: 1, sales: 270.1, rm: 150.0, wages: 36.96, power: 9.6, netProfit: 18.5 },
      { year: 2, sales: 297.0, rm: 165.0, wages: 38.8, power: 10.2, netProfit: 26.0 },
      { year: 3, sales: 326.5, rm: 181.5, wages: 40.7, power: 10.8, netProfit: 33.5 },
      { year: 4, sales: 359.0, rm: 199.5, wages: 42.7, power: 11.4, netProfit: 42.0 },
      { year: 5, sales: 395.0, rm: 219.5, wages: 44.8, power: 12.0, netProfit: 50.5 },
    ],
    breakEvenPoint: 52,
  },
  step16: {
    startDate: '2027-07-01',
    milestones: [
      { activity: 'Placing machinery orders and advance payment', timeRequired: '', startDate: '2026-12-07', endDate: '2027-01-15' },
      { activity: 'Clean-room civil work and HVAC installation', timeRequired: '', startDate: '2027-01-18', endDate: '2027-04-30' },
      { activity: 'Machinery installation, IQ/OQ/PQ qualification and trial batches', timeRequired: '', startDate: '2027-05-03', endDate: '2027-06-25' },
    ],
  },
  schemeExtras: {
    businessKind: 'manufacturing',
    gmpStatus: 'partial',
    productLicence: 'Mfg. Licence No. AP/DCA/ML/TAB/2014/0147 (Form 25 and 28)',
    existingTech: 'Single-rotary 16-station press, open coating pan, manual blister packing, no HVAC in granulation area',
    proposedTech: '27-station double-rotary press, rapid mixer granulator, fluid bed dryer, automatic coating, Alu-Alu blister line with HVAC clean rooms',
    entrepreneurName: 'Bandaru Satya Prasad',
  },
};
export default sample;
