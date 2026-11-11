// Deviations from QA doc:
// - Land, furniture / utilities, government grant and other sources (QA: 0) are the string "0.00" instead of 0, because progress counting ignores a bare 0 and the steps would show as incomplete.
import type { SampleData } from './types';

const sample: SampleData = {
  step1: {
    unitName: 'Sri Venkata Sai Plastic Moulding Works',
    clusterName: 'Sri Venkata Sai Plastic Moulding Works',
    district: 'Guntur',
    location: 'Guntur',
    natureOfBusiness: 'Injection moulding of household plastic buckets and mugs',
    majorProducts: 'Plastic buckets (16 litre) and mugs (1 litre)',
  },
  step2: {
    sectorType: 'Plastic products manufacturing (injection moulding)',
    sectorDescription:
      'Existing injection moulding unit making household buckets and mugs for dealers across Guntur and Krishna districts; now installing servo energy-saving drives, VFDs and rooftop solar to cut its power cost by about 28 percent.',
  },
  step3: {
    geography:
      'Unit is in Autonagar industrial area, Guntur, 4 km from Guntur railway station with NH-16 access; resin dealers in Guntur and Vijayawada; customers are plastic-ware dealers within 150 km.',
  },
  step4: {
    presentActivities:
      'Existing unit runs 12 injection moulding machines on one shift; proposed green upgrade retrofits 4 machines with servo drives, adds VFDs on chiller and compressor and installs 25 kWp rooftop solar.',
    yearOfEstablishment: '2016-08-22',
    commitmentDate: '2026-12-01',
    technologyLevel: 'Hydraulic injection moulding machines, air-cooled chiller, screw compressor',
    productionCapacity: 'Existing 12 machines; 1,60,000 pieces a year at 80% use',
    productMix: [
      { name: 'Plastic bucket, 16 litre', sharePercent: 44, sellingPrice: 78 },
      { name: 'Plastic mug, 1 litre', sharePercent: 56, sellingPrice: 42 },
    ],
  },
  step6: {
    targetMarket:
      'Plastic-ware and general stores through 14 dealers in Guntur, Krishna and Prakasam districts; two wholesale buyers at Vijayawada.',
    existingDemand:
      'Order book is steady at 13,000 to 14,000 pieces a month; dealers ask for lower prices, so a cut in power cost protects margin.',
  },
  step10: {
    name: 'Own factory shed, Plot No. 56, Autonagar, Guntur',
    landDetails:
      'Own shed of 5,000 sq ft on a 600 sq yard APIIC plot; roof strong enough for solar panels; 63 kVA HT service connection.',
    powerRequirements: '63 kVA contract demand',
  },
  step11: {
    spvName: 'Sri Venkata Sai Plastic Moulding Works',
    legalStatus: 'Sole proprietorship',
    address: 'Plot No. 56, Autonagar Industrial Area, Guntur, Guntur district, Andhra Pradesh - 522005',
    gstin: '37AAKFV5517R1Z9',
    firmPan: 'AAKFV5517R',
    udyamNumber: 'UDYAM-AP-10-0029586',
    applicantMobile: '9246731850',
  },
  step12: {
    land: '0.00',
    building: 1.2,
    utilitiesAndInfrastructure: '0.00',
    preliminaryAndPreOperative: 0.6,
    machinery: 15.95,
    workingCapitalMargin: 1.25,
    machineryItems: [
      { description: 'Rooftop solar PV plant, 25 kWp grid-tied with inverter', condition: 'new', supplier: 'Sunrise Solar Solutions, Vijayawada', quantity: 1, unitCost: 11.25 },
      { description: 'Servo energy-saving drive retrofit kit for 150-tonne injection moulding machine', condition: 'new', supplier: 'Servotech Drives India, Hyderabad', quantity: 4, unitCost: 0.62 },
      { description: 'Variable frequency drive panel for chiller and compressor', condition: 'new', supplier: 'Servotech Drives India, Hyderabad', quantity: 3, unitCost: 0.48 },
      { description: 'Power capacitor bank with energy meters', condition: 'new', supplier: 'Servotech Drives India, Hyderabad', quantity: 1, unitCost: 0.78 },
    ],
  },
  step13: {
    spvContribution: 5.7,
    governmentGrant: '0.00',
    bankLoan: 13.3,
    otherSources: '0.00',
    bankName: 'State Bank of India, Autonagar branch, Guntur',
    interestRate: 10.25,
    moratoriumMonths: 6,
    loanTenureMonths: 60,
  },
  step14: {
    rawMaterialCost: 50.7,
    powerCost: 10.02,
    wages: 14.16,
    maintenance: 1.2,
    administrativeExpenses: 2.4,
    marketingExpenses: 1.5,
    annualProductionVolume: 160000,
    annualSalesRealization: 92.4,
    rawMaterialItems: [
      { name: 'HDPE and PP moulding granules', use: 'Moulding buckets and mugs', basis: 'From Vijayawada resin dealers at about Rs 106 per kg, 2-tonne lots, 30-day credit' },
      { name: 'Colour masterbatch and handle inserts', use: 'Colouring and fitting', basis: 'Monthly from Guntur suppliers' },
    ],
    staffRoles: [
      { role: 'Machine operator', count: 4, monthlyPay: 14000 },
      { role: 'Helper', count: 4, monthlyPay: 10000 },
      { role: 'Supervisor', count: 1, monthlyPay: 22000 },
    ],
  },
  step15: {
    yearProjections: [
      { year: 1, sales: 92.4, rm: 50.7, wages: 14.16, power: 10.02, netProfit: 8.5 },
      { year: 2, sales: 97.0, rm: 53.2, wages: 14.9, power: 10.5, netProfit: 9.6 },
      { year: 3, sales: 101.8, rm: 55.8, wages: 15.6, power: 11.0, netProfit: 10.8 },
      { year: 4, sales: 106.9, rm: 58.6, wages: 16.4, power: 11.5, netProfit: 11.9 },
      { year: 5, sales: 112.2, rm: 61.5, wages: 17.2, power: 12.1, netProfit: 13.0 },
    ],
    breakEvenPoint: 49,
  },
  schemeExtras: {
    businessKind: 'manufacturing',
    energyBaselineKwh: '14500',
    expectedSaving: '28',
    eeEquipment: 'Servo energy-saving drives, VFDs and 25 kWp rooftop solar PV',
    entrepreneurName: 'Maddipati Srinivasa Rao',
  },
};
export default sample;
