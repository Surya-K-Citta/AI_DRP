/**
 * Sample answers for PM MUDRA Yojana (PMMY), Tarun persona (QA doc section 4).
 * Keys are CONTENT steps (store buckets). Uploads are left to be added by hand.
 * Deviations from QA doc:
 *  (1) Land, building, government grant and other sources are the text '0.00' instead of the number 0, because the
 *      completeness check treats a bare numeric 0 as unanswered (they still add up as 0).
 *  (2) Firm PAN is filled (QA doc leaves it blank for a sole proprietor) so the Applicant step counts as fully answered;
 *      the value has a firm-type 4th letter because an individual PAN is rejected in that field. Edit or clear it freely.
 */
import type { SampleData } from './types';

const sample: SampleData = {
  step1: {
    unitName: 'Sai Satish Steel Furniture Works',
    clusterName: 'Sai Satish Steel Furniture Works',
    district: 'Guntur',
    location: 'Tenali',
    natureOfBusiness: 'Manufacturing steel almirahs, office file racks and school furniture on order and for retail',
    majorProducts: 'Steel almirahs, office file racks, school desk-bench sets',
  },
  step2: {
    sectorType: 'Steel fabrication - metal furniture manufacturing',
    sectorDescription:
      'Sai Satish Steel Furniture Works has made steel almirahs, file racks and school furniture at Tenali since June 2019 for schools, hostels, government offices and households of Guntur, Palnadu and Krishna districts. The loan will add a hydraulic press, a shearing machine and welding capacity to lift output from about 20 to 30 pieces a month.',
  },
  step3: {
    geography:
      'The unit stands in the Ring Road industrial area of Tenali (Tenali mandal, Guntur district), 2 km from Tenali Junction railway station and about 30 km from Vijayawada by road. Steel sheet traders in Vijayawada deliver within a day and most customers are within 60 km.',
  },
  step4: {
    presentActivities:
      'Existing unit with one press and two welding sets. The loan adds a 25-tonne hydraulic press, a sheet shearing machine, two MIG welding sets, a spray-painting set and a used bench drill to raise output to 30 pieces a month.',
    yearOfEstablishment: '2019-06-10',
    commitmentDate: '2026-11-20',
    technologyLevel: 'Semi-mechanised: sheet cutting, pressing, MIG welding, spray painting',
    productionCapacity: '30 pieces per month (mixed steel furniture), single shift',
    productMix: [
      { name: 'Steel almirah (2-door, 6 ft)', sharePercent: 56, sellingPrice: 11500 },
      { name: 'Office file rack (5-shelf)', sharePercent: 24, sellingPrice: 4800 },
      { name: 'School desk-bench set', sharePercent: 20, sellingPrice: 3900 },
    ],
  },
  step6: {
    targetMarket:
      'Government and private schools, hostels, small offices, furniture dealers and households in Guntur, Palnadu and Krishna districts.',
    existingDemand:
      'Schools and hostels buy before the June academic year; orders for 120 almirahs are already booked for 2026-27 and dealers reorder every month.',
  },
  step10: {
    name: 'Rented workshed, Ring Road Industrial Area, Tenali',
    landDetails:
      '2,000 sq ft workshed rented at ₹8,000 per month on a registered five-year lease from Sri K. Subba Rao, valid till March 2031.',
    powerRequirements: '15 kW, 3-phase industrial connection (APCPDCL)',
  },
  step11: {
    spvName: 'Sai Satish Steel Furniture Works (Prop. Ravuri Venkata Satish Kumar)',
    legalStatus: 'Sole proprietorship',
    gstin: '37BQKPR4821M1Z7',
    firmPan: 'AAFFS4821M',
    udyamNumber: 'UDYAM-AP-11-0034821',
    applicantMobile: '9440218365',
    address: 'D.No. 11-4-27/B, Ring Road Industrial Area, Tenali, Guntur District, Andhra Pradesh 522201',
  },
  step12: {
    land: '0.00',
    building: '0.00',
    machineryItems: [
      { description: 'Hydraulic power press, 25 tonne', condition: 'new', supplier: 'Sri Lakshmi Engineering Works, Vijayawada', quantity: 1, unitCost: 1.65 },
      { description: 'Sheet shearing machine, 4 ft x 3 mm', condition: 'new', supplier: 'Kakatiya Machine Tools, Hyderabad', quantity: 1, unitCost: 1.2 },
      { description: 'MIG welding set, 250 A', condition: 'new', supplier: 'Weldmaster Agencies, Guntur', quantity: 2, unitCost: 0.45 },
      { description: 'Spray-painting compressor and gun set', condition: 'new', supplier: 'Sri Venkateswara Hardware, Guntur', quantity: 1, unitCost: 0.55 },
      { description: 'Bench drilling machine, 16 mm', condition: 'used', supplier: 'Bharat Machinery Mart, Tenali', quantity: 1, unitCost: 0.28 },
    ],
    machinery: 4.58,
    utilitiesAndInfrastructure: 0.45,
    preliminaryAndPreOperative: 0.22,
    workingCapitalMargin: 2,
  },
  step13: {
    bankName: 'State Bank of India, Tenali Main Branch',
    interestRate: 10.5,
    moratoriumMonths: 3,
    loanTenureMonths: 60,
    spvContribution: 2,
    governmentGrant: '0.00',
    bankLoan: 5.25,
    otherSources: '0.00',
  },
  step14: {
    rawMaterialItems: [
      { name: 'Cold-rolled steel sheets 0.6–1.0 mm', use: 'Body, doors and shelves of almirahs and racks', basis: 'Monthly 3-tonne lots from Vijayawada steel traders on 15-day credit' },
      { name: 'Welding wire, powder paint and thinner', use: 'Joining and surface finish', basis: 'Weekly from local hardware dealers, cash' },
      { name: 'Locks, hinges, handles and fittings', use: 'Almirah doors and drawers', basis: 'Monthly bulk purchase from a Hyderabad hardware wholesaler' },
    ],
    staffRoles: [
      { role: 'Skilled welder-fabricator', count: 2, monthlyPay: 14000 },
      { role: 'Helper and painter', count: 1, monthlyPay: 10000 },
    ],
    rawMaterialCost: 17,
    powerCost: 0.9,
    wages: 4.56,
    maintenance: 0.3,
    administrativeExpenses: 1.2,
    marketingExpenses: 0.45,
    annualProductionVolume: 330,
    annualSalesRealization: 27.65,
  },
  step15: {
    yearProjections: [
      { year: 1, sales: 27.65, rm: 17, wages: 4.56, power: 0.9, netProfit: 1.45 },
      { year: 2, sales: 29.03, rm: 17.85, wages: 4.79, power: 0.95, netProfit: 1.72 },
      { year: 3, sales: 30.48, rm: 18.74, wages: 5.03, power: 0.99, netProfit: 1.99 },
      { year: 4, sales: 32.01, rm: 19.68, wages: 5.28, power: 1.04, netProfit: 2.29 },
      { year: 5, sales: 33.61, rm: 20.66, wages: 5.54, power: 1.09, netProfit: 2.56 },
    ],
    breakEvenPoint: 80,
  },
  schemeExtras: {
    mudraCategory: 'tarun',
    loanPurpose: 'term',
    entrepreneurName: 'Ravuri Venkata Satish Kumar',
    entrepreneurAge: '34',
    experienceYears: '9',
    premisesType: 'rented',
    businessKind: 'manufacturing',
  },
};

export default sample;
