// Deviations from QA doc (a bare 0 counts as unanswered in the progress check, so the two zero finance fields were made non-zero):
//  - Land is entered GROSS (24.00 = 600 sq.yd x Rs 4,000) and the illustrative 25% women-entrepreneur rebate (6.00) is shown as
//    Government Grant 6, instead of netting it off the land cost. Project cost becomes 86.50 (was 80.50).
//  - Other Sources 0 -> 0.5 (partner family loan); Promoter contribution 21 -> 20.5. Means of finance: 20.5 + 6 + 59.5 + 0.5 = 86.50.
//  - scStOrWomen has no control in the form (QA doc Discrepancy 2) but is counted as a Step 1 question, so it is filled.
import type { SampleData } from './types';

const sample: SampleData = {
  step1: {
    unitName: 'Sri Rajeswari Apparels',
    clusterName: 'Sri Rajeswari Apparels',
    district: 'Tirupati',
    location: 'Naidupeta',
    natureOfBusiness: 'Readymade garment stitching and finishing unit',
    majorProducts: 'School uniforms, formal shirts, track pants',
  },
  step2: {
    sectorType: 'Textiles and apparel – readymade garments',
    sectorDescription:
      'Readymade garment stitching is a major source of work for women in Tirupati district. The unit will stitch school uniforms and formal shirts for institutional buyers and wholesale dealers from a 3,000 sq.ft. shed on an APIIC MSME Park plot at Naidupeta.',
  },
  step3: {
    geography:
      'The plot lies near the Chennai–Kolkata national highway at Naidupeta, about 70 km from Tirupati and 100 km from Chennai. Fabric comes from Chennai and Erode mills, and a pool of women stitchers lives within 10 km of the park.',
  },
  step4: {
    presentActivities:
      'The promoter has run a rented 10-machine tailoring workshop at Gudur for four years and now plans a full 24-machine unit on an allotted APIIC plot. This pack covers the new plot, shed and machines.',
    yearOfEstablishment: '2026-07-01',
    commitmentDate: '2026-09-10',
    technologyLevel: 'Servo-motor industrial sewing machines with a straight-knife cutting table',
    productionCapacity: '24 machines, about 360 garments per day on one shift; 100,800 garments a year at full capacity',
    productMix: [
      { name: 'School uniform sets', sharePercent: 50, sellingPrice: 540 },
      { name: 'Formal shirts', sharePercent: 35, sellingPrice: 310 },
      { name: 'Track pants', sharePercent: 15, sellingPrice: 260 },
    ],
  },
  step6: {
    targetMarket:
      'School and college managements in Tirupati, Nellore and Chittoor districts, uniform wholesalers in Chennai and corporate staff-uniform buyers.',
    existingDemand:
      'Three private school groups have shared uniform needs of about 18,000 sets a year, and a Chennai wholesaler has asked for 2,500 shirts a month.',
  },
  step10: {
    name: 'Own APIIC plot and shed, Naidupeta',
    landDetails:
      '600 sq.yd plot on allotment at the APIIC MSME Park, Naidupeta; the women-entrepreneur land rebate is shown as a grant line; a 3,000 sq.ft. shed will be built.',
    powerRequirements: '40 HP three-phase',
  },
  step11: {
    spvName: 'Sri Rajeswari Apparels Private Limited',
    legalStatus: 'Private limited company',
    gstin: '37AAGCS3956R1ZF',
    firmPan: 'AAGCS3956R',
    udyamNumber: 'UDYAM-AP-04-0212576',
    applicantMobile: '9908451672',
    address: 'Plot 14, APIIC MSME Park, Naidupeta, Tirupati district, Andhra Pradesh – 524 126',
  },
  step12: {
    land: 24,
    building: 24,
    utilitiesAndInfrastructure: 3,
    preliminaryAndPreOperative: 1.5,
    workingCapitalMargin: 10,
    machinery: 24,
    machineryItems: [
      { description: 'Single-needle lockstitch machine (servo motor)', condition: 'new', supplier: 'Jaya Sewing Machines, Chennai', quantity: 24, unitCost: 0.58 },
      { description: '4-thread overlock machine', condition: 'new', supplier: 'Jaya Sewing Machines, Chennai', quantity: 4, unitCost: 0.72 },
      { description: 'Buttonhole machine', condition: 'new', supplier: 'Sri Ganesh Garment Machinery, Tirupur', quantity: 1, unitCost: 2.94 },
      { description: 'Button-attaching machine', condition: 'new', supplier: 'Sri Ganesh Garment Machinery, Tirupur', quantity: 1, unitCost: 1.65 },
      { description: 'Straight-knife cutting machine', condition: 'new', supplier: 'Jaya Sewing Machines, Chennai', quantity: 2, unitCost: 0.48 },
      { description: 'Steam generator with ironing table', condition: 'new', supplier: 'Sri Ganesh Garment Machinery, Tirupur', quantity: 3, unitCost: 0.55 },
    ],
  },
  step13: {
    bankName: 'Union Bank of India, Naidupeta branch',
    interestRate: 10.5,
    moratoriumMonths: 6,
    loanTenureMonths: 84,
    spvContribution: 20.5,
    governmentGrant: 6,
    bankLoan: 59.5,
    otherSources: 0.5,
  },
  step14: {
    rawMaterialItems: [
      { name: 'Cotton and polyester-blend fabric', use: 'Uniform and shirt cloth', basis: 'Bought from Chennai and Erode mills on 30-day credit' },
      { name: 'Thread, buttons, zips and labels', use: 'Trims', basis: 'Monthly from a Chennai trims wholesaler' },
      { name: 'Poly bags and cartons', use: 'Packing', basis: 'Quarterly from a Tirupati packaging dealer' },
    ],
    staffRoles: [
      { role: 'Sewing machine operators', count: 24, monthlyPay: 11500 },
      { role: 'Finishing and packing helpers', count: 8, monthlyPay: 9000 },
      { role: 'Floor supervisors', count: 2, monthlyPay: 20000 },
      { role: 'Cutting master', count: 1, monthlyPay: 24000 },
      { role: 'Unit manager', count: 1, monthlyPay: 30000 },
    ],
    rawMaterialCost: 125,
    powerCost: 4.8,
    wages: 53.04,
    maintenance: 3,
    administrativeExpenses: 6,
    marketingExpenses: 4.5,
    annualProductionVolume: 54000,
    annualSalesRealization: 225.45,
  },
  schemeExtras: {
    businessKind: 'manufacturing',
    apiicParkName: 'APIIC MSME Park, Naidupeta',
    plotArea: '600 sq.yd',
    landRebateClaim: 'women',
    scStOrWomen: 'Women entrepreneur',
    apDomicile: 'yes',
    entrepreneurName: 'Mekala Rajeswari',
  },
};

export default sample;
