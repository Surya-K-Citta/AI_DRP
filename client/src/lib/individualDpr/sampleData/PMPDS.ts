// Deviations from QA doc:
// - Government grant and other sources (QA: 0) are the string "0.00" instead of 0, because progress counting ignores a bare 0 and the step would show 6/8.
import type { SampleData } from './types';

const sample: SampleData = {
  step1: {
    unitName: 'Sri Sravan Medicare Disposables',
    clusterName: 'Sri Sravan Medicare Disposables',
    district: 'Visakhapatnam',
    location: 'Visakhapatnam',
    natureOfBusiness: 'Manufacture of sterile surgical gauze, bandages and cotton rolls (medical devices)',
    majorProducts: 'Surgical gauze pads, crepe bandages, absorbent cotton rolls',
  },
  step4: {
    presentActivities:
      'Proposed unit near AP MedTech Zone making sterile gauze pads, crepe bandages and absorbent cotton rolls; 6 workers on one shift.',
    yearOfEstablishment: '2026-11-23',
    commitmentDate: '2026-12-07',
    technologyLevel: 'Semi-automatic cutting, folding and rolling machines; hot-air sterilising oven',
    productionCapacity: '1,20,000 packs and rolls a year on one shift',
    productMix: [
      { name: 'Surgical gauze pad pack (10 pieces)', sharePercent: 55, sellingPrice: 24 },
      { name: 'Crepe bandage, 10 cm', sharePercent: 30, sellingPrice: 40 },
      { name: 'Absorbent cotton roll, 500 g', sharePercent: 15, sellingPrice: 190 },
    ],
  },
  step6: {
    targetMarket:
      'Government hospitals and PHCs through APMSIDC tenders, private hospitals and nursing homes in Visakhapatnam, and medical-store distributors.',
    existingDemand:
      'Visakhapatnam has about 400 hospitals and nursing homes; two distributors will take 40,000 units a year once the product is ISO 13485 certified.',
  },
  step11: {
    spvName: 'Sri Sravan Medicare Disposables',
    legalStatus: 'Sole proprietorship',
    address:
      'Door No. 5-9-14, AP MedTech Zone Road, Pedagantyada, Visakhapatnam, Visakhapatnam district, Andhra Pradesh - 530044',
    gstin: '37AAPFM2290L1ZP',
    firmPan: 'AAPFM2290L',
    udyamNumber: 'UDYAM-AP-21-0044062',
    applicantMobile: '9885472016',
  },
  step12: {
    machinery: 13.6,
    workingCapitalMargin: 4.4,
    machineryItems: [
      { description: 'Gauze cutting and folding machine', condition: 'new', supplier: 'Medi-Tech Machinery, Ahmedabad', quantity: 1, unitCost: 4.2 },
      { description: 'Bandage rolling and winding machine', condition: 'new', supplier: 'Medi-Tech Machinery, Ahmedabad', quantity: 1, unitCost: 3.1 },
      { description: 'Cotton carding and roll forming machine', condition: 'new', supplier: 'Sri Ram Textile Engineers, Coimbatore', quantity: 1, unitCost: 3.65 },
      { description: 'Pouch packing and sealing machine', condition: 'new', supplier: 'Vijaya Packaging Machines, Vijayawada', quantity: 1, unitCost: 1.4 },
      { description: 'Hot-air sterilising oven, 100 litre', condition: 'new', supplier: 'Lab-Aid Equipment, Hyderabad', quantity: 1, unitCost: 1.25 },
    ],
  },
  step13: {
    spvContribution: 5.4,
    governmentGrant: '0.00',
    bankLoan: 12.6,
    otherSources: '0.00',
    bankName: 'Union Bank of India, Pedagantyada branch',
    interestRate: 10.5,
    moratoriumMonths: 6,
    loanTenureMonths: 60,
  },
  step14: {
    rawMaterialCost: 40.0,
    powerCost: 2.4,
    wages: 9.6,
    maintenance: 0.9,
    administrativeExpenses: 2.4,
    marketingExpenses: 3.0,
    annualProductionVolume: 120000,
    annualSalesRealization: 64.44,
    rawMaterialItems: [
      { name: 'Absorbent cotton and cotton gauze fabric', use: 'Gauze pads and rolls', basis: 'From Guntur and Coimbatore mills at Rs 150 per kg, monthly, 30-day credit' },
      { name: 'Cotton crepe yarn and elastic thread', use: 'Crepe bandages', basis: 'From Erode suppliers, quarterly' },
      { name: 'Pouches, cartons and ethylene oxide sterilisation charges', use: 'Packing and sterility', basis: 'From Visakhapatnam suppliers and AMTZ common facility per batch' },
    ],
    staffRoles: [
      { role: 'Machine operator', count: 3, monthlyPay: 14000 },
      { role: 'Packer', count: 2, monthlyPay: 10000 },
      { role: 'Supervisor', count: 1, monthlyPay: 18000 },
    ],
  },
  schemeExtras: {
    businessKind: 'manufacturing',
    deviceOrFormulation: 'device',
    entrepreneurName: 'Ponnada Sravan Kumar',
    promotionNeed:
      'Support for ISO 13485 certification, CDSCO manufacturing licence (Form MD-5) for Class A devices and a sterilisation / testing tie-up, so the unit can supply government hospitals through APMSIDC tenders.',
  },
};
export default sample;
