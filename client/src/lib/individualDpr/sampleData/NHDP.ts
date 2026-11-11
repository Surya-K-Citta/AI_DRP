// Deviations from QA doc:
// - GSTIN filled (36BQTFN6139D1Z7, matches firm PAN) because the form counts it as an asked question; QA doc leaves it blank.
// - Government grant is the string "0.00" instead of 0 (progress counting ignores a bare 0, so the step would show 7/8).
// - entrepreneurAge "46" added: the NHDP form has no age input (QA doc agrees) but the progress model counts it as an asked question, so step 1 would show 10/11.
import type { SampleData } from './types';

const sample: SampleData = {
  step1: {
    unitName: 'Sri Narasimha Handloom Silk Weavers',
    clusterName: 'Sri Narasimha Handloom Silk Weavers',
    district: 'Sri Sathya Sai',
    location: 'Dharmavaram',
    natureOfBusiness: 'Handloom weaving of Dharmavaram pure silk sarees on pit looms with jacquard',
    majorProducts: 'Dharmavaram pure silk sarees with zari borders',
  },
  step2: {
    sectorType: 'Handloom textiles (silk sarees)',
    sectorDescription:
      "Weaving of Dharmavaram pure silk sarees with zari borders on pit looms with jacquard, sold through the weavers' co-operative society and retail showrooms in Hyderabad and Bengaluru.",
  },
  step3: {
    geography:
      'Unit is in Weavers Colony, Dharmavaram, 2 km from the co-operative society showroom and 8 km from Dharmavaram railway station. Silk is available from Hindupur (55 km); retail demand from Hyderabad, Bengaluru and temple towns.',
  },
  step4: {
    presentActivities:
      'Weaver with 2 existing pit looms, now adding 3 pit looms with 480-hook jacquards and a warping drum to reach 120 sarees a year; two skilled weavers to be hired.',
    yearOfEstablishment: '2026-11-09',
    commitmentDate: '2026-11-23',
    technologyLevel: 'Pit looms with jacquard, motorised pirn winder, drum warping',
    productionCapacity: '3 new looms, about 40 sarees per loom per year; 120 sarees a year',
    productMix: [
      { name: 'Dharmavaram pure silk saree with zari border', sharePercent: 70, sellingPrice: 14500 },
      { name: 'Dharmavaram pure silk saree with temple border', sharePercent: 30, sellingPrice: 21500 },
    ],
  },
  step6: {
    targetMarket:
      'Wedding and festival buyers through the co-operative society showroom, saree dealers in Hyderabad and Bengaluru, and online handloom marketplaces.',
    existingDemand:
      'Society showroom has taken 60 sarees a year from the unit; two Hyderabad dealers have asked for 40 sarees a year; wedding-season demand exceeds supply from October to March.',
  },
  step10: {
    name: 'Home loom shed, Door No. 8-112, Weavers Colony, Dharmavaram',
    landDetails:
      'Own loom shed of 600 sq ft attached to the house, with space for 5 pit looms and warping drum; metered power connection.',
    powerRequirements: '2 kW',
  },
  step11: {
    spvName: 'Sri Narasimha Handloom Silk Weavers (Prop. Pothula Narasimhulu)',
    legalStatus: 'Sole proprietorship',
    address: 'Door No. 8-112, Weavers Colony, Dharmavaram, Sri Sathya Sai district, Andhra Pradesh - 515671',
    gstin: '36BQTFN6139D1Z7',
    firmPan: 'BQTFN6139D',
    udyamNumber: 'UDYAM-AP-18-0017395',
    applicantMobile: '9866143207',
  },
  step12: {
    machinery: 3.13,
    workingCapitalMargin: 1.87,
    machineryItems: [
      { description: 'Pit loom with accessories (heald frames, reeds, shuttles)', condition: 'new', supplier: 'Venkateswara Loom Works, Dharmavaram', quantity: 3, unitCost: 0.38 },
      { description: 'Jacquard, 480-hook, with design cards', condition: 'new', supplier: 'Sri Ganesh Jacquard Works, Dharmavaram', quantity: 3, unitCost: 0.42 },
      { description: 'Warping drum (mill) with creel', condition: 'new', supplier: 'Venkateswara Loom Works, Dharmavaram', quantity: 1, unitCost: 0.55 },
      { description: 'Motorised pirn winder', condition: 'new', supplier: 'Sri Ganesh Jacquard Works, Dharmavaram', quantity: 2, unitCost: 0.09 },
    ],
  },
  step13: {
    spvContribution: 1.5,
    governmentGrant: '0.00',
    bankLoan: 3.0,
    otherSources: 0.5,
    bankName: 'Andhra Pradesh Grameena Vikas Bank, Dharmavaram branch',
    interestRate: 10.5,
    moratoriumMonths: 3,
    loanTenureMonths: 60,
  },
  step14: {
    rawMaterialCost: 10.56,
    powerCost: 0.15,
    wages: 2.88,
    maintenance: 0.12,
    administrativeExpenses: 0.3,
    marketingExpenses: 0.6,
    annualProductionVolume: 120,
    annualSalesRealization: 19.92,
    rawMaterialItems: [
      { name: 'Mulberry silk warp and weft yarn, 20/22 denier', use: 'Warp and weft', basis: 'Monthly from Hindupur silk reeling units, paid in 30 days' },
      { name: 'Zari thread, silver-gold', use: 'Borders and pallu', basis: 'Quarterly from a Surat dealer, advance payment' },
      { name: 'Dyes and chemicals', use: 'Colouring', basis: 'Local dyeing unit, per lot' },
    ],
    staffRoles: [{ role: 'Skilled weaver (hired)', count: 2, monthlyPay: 12000 }],
  },
  schemeExtras: {
    businessKind: 'manufacturing',
    loomType: 'pit',
    weaverId: 'HLW-AP-SSS-004712 / DHWCS Member No. 218',
    premisesType: 'home',
    productLine: 'Pure silk sarees, 5.5 m with 0.8 m blouse piece, zari and temple borders',
    yarnSource: 'Mulberry silk warp and weft from Hindupur reeling units; zari from Surat dealer; local dyeing',
    entrepreneurName: 'Pothula Narasimhulu',
    entrepreneurAge: '46',
  },
};
export default sample;
