// Deviations from QA doc (a bare 0 counts as unanswered in the progress check; project cost and funding total stay 120.00):
//  - Moratorium 0 -> 1 month (revolving export credit, first month interest-only).
//  - Other Sources 0 -> 1 (director's loan) and Bank Loan 90 -> 89; Export credit sought 90 -> 89 to stay equal to the bank loan.
//    Debt-equity = 89 / 30 = 2.97 (ceiling 3).
//  - Government Grant is deliberately left at 0 (the 2.75% interest subvention is not a capital grant), so Step 5 stays 7/8 in the verifier.
//  - GSTIN etc. as in the QA doc. machineryItems repeats the assets list (condition 'new'): the verifier counts it as a Step 4 question
//    although the form shows only the Assets list for a trading business.
//  - Expected advisory (not removable without wrong data): term loan is more than assets and set-up costs (export credit is working capital).
import type { SampleData } from './types';

const sample: SampleData = {
  step1: {
    unitName: 'Sri Lakshmi Venkateswara Chilli Exports',
    clusterName: 'Sri Lakshmi Venkateswara Chilli Exports',
    district: 'Guntur',
    location: 'Guntur',
    natureOfBusiness: 'Export of dried red chillies and chilli powder',
    majorProducts: 'Teja S17 whole dried chilli, Byadgi chilli, chilli powder',
  },
  step4: {
    presentActivities:
      'The firm has exported dried red chillies from its Mirchi Yard warehouse at Guntur since 2018 and shipped 31 containers in 2025-26 to Vietnam, Malaysia and Bangladesh against letters of credit and advance payment.',
    yearOfEstablishment: '2018-04-02',
    commitmentDate: '2026-09-30',
    technologyLevel: 'Manual grading and drying yard with moisture meter and ASTA colour test',
    productionCapacity: 'About 25 containers (350 MT) handled a year; 20 containers (280 MT) of exports planned for 2026-27',
    productMix: [
      { name: 'Teja S17 whole dried chilli', sharePercent: 55, sellingPrice: 185 },
      { name: 'Byadgi whole dried chilli', sharePercent: 30, sellingPrice: 210 },
      { name: 'Chilli powder in retail export packs', sharePercent: 15, sellingPrice: 240 },
    ],
  },
  step11: {
    spvName: 'Sri Lakshmi Venkateswara Chilli Exports Private Limited',
    legalStatus: 'Private limited company',
    gstin: '37AABCV7204D1ZL',
    firmPan: 'AABCV7204D',
    udyamNumber: 'UDYAM-AP-10-0098417',
    applicantMobile: '9848731206',
    address: 'Door No. 12-4-88, Mirchi Yard Road, Guntur, Andhra Pradesh – 522 004',
  },
  step12: {
    workingCapitalMargin: 114,
    machinery: 6,
    assetItems: [
      { item: 'Moisture meter and ASTA colour analyser', category: 'Equipment & tools', quantity: 1, unitCost: 1.35 },
      { item: 'Computers, printers and export documentation software', category: 'Computers & software', quantity: 3, unitCost: 0.48 },
      { item: 'Pallet racking and weighing platform scale', category: 'Equipment & tools', quantity: 1, unitCost: 1.7 },
      { item: 'Office furniture and fittings at the export office', category: 'Furniture & fixtures', quantity: 1, unitCost: 1.51 },
    ],
    machineryItems: [
      { description: 'Moisture meter and ASTA colour analyser', condition: 'new', supplier: 'Local supplier, Guntur', quantity: 1, unitCost: 1.35 },
      { description: 'Computers, printers and export documentation software', condition: 'new', supplier: 'Local supplier, Guntur', quantity: 3, unitCost: 0.48 },
      { description: 'Pallet racking and weighing platform scale', condition: 'new', supplier: 'Local supplier, Guntur', quantity: 1, unitCost: 1.7 },
      { description: 'Office furniture and fittings at the export office', condition: 'new', supplier: 'Local supplier, Guntur', quantity: 1, unitCost: 1.51 },
    ],
  },
  step13: {
    bankName: 'Indian Bank, Guntur Brodipet branch',
    interestRate: 9.5,
    moratoriumMonths: 1,
    loanTenureMonths: 12,
    spvContribution: 30,
    governmentGrant: 0,
    bankLoan: 89,
    otherSources: 1,
  },
  step14: {
    rawMaterialItems: [
      { name: 'Dried red chillies (Teja S17 and Byadgi)', use: 'Export stock', basis: 'Bought from farmers and traders at Guntur Mirchi Yard at spot price' },
      { name: 'Gunny bags and export cartons', use: 'Packing', basis: 'Monthly from a Guntur packaging dealer' },
      { name: 'Fumigation and cold-storage charges', use: 'Quality and shelf life', basis: 'Per container, paid to a licensed fumigator' },
    ],
    staffRoles: [
      { role: 'Export manager', count: 1, monthlyPay: 45000 },
      { role: 'Documentation executive', count: 1, monthlyPay: 25000 },
      { role: 'Godown supervisors', count: 2, monthlyPay: 18000 },
      { role: 'Loaders', count: 8, monthlyPay: 12000 },
    ],
    rawMaterialCost: 478,
    powerCost: 2.4,
    wages: 24.24,
    maintenance: 1.5,
    administrativeExpenses: 14.4,
    marketingExpenses: 12,
    annualProductionVolume: 279,
    annualSalesRealization: 560,
  },
  schemeExtras: {
    businessKind: 'trading',
    exportMarkets: 'Vietnam, Malaysia, Bangladesh, Sri Lanka, UAE',
    hsnLines: '09042110, 09042210',
    prePostShipment: 'both',
    exportCreditSought: 89,
    entrepreneurName: 'Vemuri Srinivasa Rao',
  },
};

export default sample;
