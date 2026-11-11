/**
 * Sample answers for PM SVANidhi, 2nd tranche (QA doc section 6). Keys are CONTENT steps (store buckets). Uploads stay manual.
 * Deviations from QA doc:
 *  (1) Government grant, other sources and moratorium are the text '0.00' instead of the number 0, because the
 *      completeness check treats a bare numeric 0 as unanswered (they still add up as 0).
 *  (2) GSTIN and Firm PAN are filled (QA doc leaves them blank) so the Applicant step counts as fully answered; they are
 *      made-up values with a valid GSTIN check character and a firm-type PAN. Clear them if not wanted.
 */
import type { SampleData } from './types';

const sample: SampleData = {
  step1: {
    unitName: 'Satyanarayana Fresh Juice Stall',
    clusterName: 'Satyanarayana Fresh Juice Stall',
    district: 'East Godavari',
    location: 'Rajamahendravaram',
    natureOfBusiness: 'Street vending of fresh fruit juices and cut fruit from a fixed stall near the town bus stand',
    majorProducts: 'Fresh juices (sweet lime, pineapple, watermelon) and cut-fruit plates',
  },
  step2: {
    sectorType: 'Street vending - fresh fruit juices and cut fruit',
    sectorDescription:
      'Fixed street stall selling freshly pressed sweet lime, pineapple and watermelon juice and plates of cut fruit to bus passengers, office staff and shoppers around the RTC complex road in Rajamahendravaram, open 9 am to 9 pm every day.',
  },
  step3: {
    geography:
      'Stall is on the footpath side of the RTC complex road in Rajamahendravaram (Rajahmundry urban), beside the main bus stand with about 20,000 passengers a day and two government offices within 300 m.',
  },
  step4: {
    presentActivities:
      'Existing stall run by the vendor with one part-time helper; the second-tranche loan will fund a new steel stall with canopy, a commercial juicer, display trays and more fruit stock.',
    yearOfEstablishment: '2015-09-14',
    commitmentDate: '2026-11-10',
    technologyLevel: 'Hand-cut fruit with one electric juicer and an ice box',
    productionCapacity: 'About 75 glasses of juice and 20 fruit plates a day',
    productMix: [
      { name: 'Fresh fruit juice (glass)', sharePercent: 80, sellingPrice: 30 },
      { name: 'Cut-fruit plate', sharePercent: 20, sellingPrice: 40 },
    ],
  },
  step6: {
    targetMarket:
      'Bus passengers, college students, office staff and shoppers who want a quick fresh drink; repeat customers pay by UPI.',
    existingDemand:
      'Peak footfall 4 pm to 8 pm and in summer (March–June); lean during heavy monsoon days. Daily sales average ₹2,820 and reach ₹4,500 in May.',
  },
  step10: {
    name: 'Fruit juice stall, RTC complex road, Rajamahendravaram',
    landDetails:
      'Vending spot allotted by Rajamahendravaram Municipal Corporation (Zone 3) and shown on the Certificate of Vending; no rent, annual vending fee ₹1,200.',
    powerRequirements: '0.5 kW, shared shop connection',
  },
  step11: {
    spvName: 'Bhimavarapu Satyanarayana',
    legalStatus: 'Sole proprietorship (individual vendor)',
    gstin: '37AAFFB4411C1Z2',
    firmPan: 'AAFFB4411C',
    udyamNumber: 'UDYAM-AP-05-0072816',
    applicantMobile: '9885120473',
    address: 'Door No. 41-3-17, Jampet, Rajamahendravaram, East Godavari District, Andhra Pradesh 533101',
  },
  step12: {
    machineryItems: [
      { description: 'Stainless steel juice stall with canopy and shelves', condition: 'new', supplier: 'Sri Ganesh Fabricators, Rajamahendravaram', quantity: 1, unitCost: 0.12 },
      { description: 'Commercial electric juicer, 1 HP', condition: 'new', supplier: 'Kitchen World, Rajamahendravaram', quantity: 1, unitCost: 0.05 },
      { description: 'Fruit display trays and insulated ice box', condition: 'new', supplier: 'Kitchen World, Rajamahendravaram', quantity: 1, unitCost: 0.04 },
      { description: 'Digital weighing scale and UPI QR stand', condition: 'new', supplier: 'Sai Electronics, Rajamahendravaram', quantity: 1, unitCost: 0.02 },
      { description: 'Knife set, jars and serving glasses', condition: 'new', supplier: 'Local steel utensils mart, Rajamahendravaram', quantity: 1, unitCost: 0.03 },
    ],
    machinery: 0.26,
    workingCapitalMargin: 0.12,
  },
  step13: {
    bankName: 'Union Bank of India, Rajamahendravaram Main Branch',
    interestRate: 10,
    moratoriumMonths: '0.00',
    loanTenureMonths: 18,
    spvContribution: 0.13,
    governmentGrant: '0.00',
    bankLoan: 0.25,
    otherSources: '0.00',
  },
  step14: {
    rawMaterialItems: [
      { name: 'Seasonal fruits (sweet lime, pineapple, watermelon, papaya)', use: 'Fresh juice and cut-fruit plates', basis: 'Daily at 5.30 am from the Rajamahendravaram wholesale fruit market, cash' },
      { name: 'Ice blocks, disposable glasses and plates', use: 'Serving', basis: 'Daily from a local ice plant and weekly from a stationery wholesaler' },
    ],
    staffRoles: [{ role: 'Part-time helper (family member)', count: 1, monthlyPay: 6000 }],
    rawMaterialCost: 5.2,
    powerCost: 0.12,
    wages: 0.72,
    maintenance: 0.05,
    administrativeExpenses: 0.1,
    marketingExpenses: 0.03,
    annualProductionVolume: 26400,
    annualSalesRealization: 8.46,
  },
  schemeExtras: {
    covOrLor: 'cov',
    loanTranche: 'second',
    vendingType: 'stall',
    workplaceType: 'stall',
    upiQr: 'bsatyanarayana43@oksbi',
    entrepreneurName: 'Bhimavarapu Satyanarayana',
    entrepreneurAge: '43',
    yearsVending: '11',
    dailySales: '2820',
    processOfManufacture:
      'Fruit is bought each morning at 5.30 am from the Rajamahendravaram wholesale fruit market, washed, cut and pressed to order at the stall from 9 am to 9 pm; ice comes from a local ice plant; customers pay by UPI QR or cash; unsold fruit is used for next-day cut-fruit plates.',
    powerRequirement: '0.5 kW, shared shop connection',
    businessKind: 'manufacturing',
  },
};

export default sample;
