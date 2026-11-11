/**
 * Sample answers for CGTMSE (QA doc section 8). Keys are CONTENT steps (store buckets). Uploads stay manual.
 * Deviations from QA doc:
 *  (1) Land, government grant and other sources are the text '0.00' instead of the number 0, because the
 *      completeness check treats a bare numeric 0 as unanswered (they still add up as 0).
 *  (2) Firm PAN is filled (QA doc leaves it blank for a sole proprietor) so the Applicant step counts as fully answered;
 *      it has a firm-type 4th letter because an individual PAN is rejected in that field. Edit or clear it freely.
 */
import type { SampleData } from './types';

const sample: SampleData = {
  step1: {
    unitName: 'Padmaja Silk Handlooms',
    clusterName: 'Padmaja Silk Handlooms',
    district: 'Sri Sathya Sai',
    location: 'Dharmavaram',
    natureOfBusiness: 'Weaving and finishing of Dharmavaram pure silk sarees and half-saree fabric on Jacquard handlooms',
    majorProducts: 'Pure silk sarees, silk half-saree sets, silk dupattas',
  },
  step2: {
    sectorType: 'Handloom textiles - pure silk sarees',
    sectorDescription:
      'Padmaja Silk Handlooms weaves pure silk sarees, half-saree fabric and silk dupattas on six Jacquard handlooms at Dharmavaram and sells to saree showrooms in Dharmavaram, Hyderabad, Bengaluru and Chennai. Yarn is bought from Bengaluru and finishing is done in-house.',
  },
  step3: {
    geography:
      'Dharmavaram town (Dharmavaram mandal, Sri Sathya Sai district) is a silk-saree cluster with a railway junction, about 50 km from Anantapur; yarn dealers and dyers are in the town and the main buyers are showrooms in Hyderabad, Bengaluru and Chennai.',
  },
  step4: {
    presentActivities:
      'Existing unit with six Jacquard handlooms, hand finishing and one steam vat. The loan adds a warping machine, twisting machines, finishing machine and a shed extension to lift output from 30 to 40 sarees a month.',
    yearOfEstablishment: '2016-08-15',
    commitmentDate: '2026-12-05',
    technologyLevel: 'Jacquard pit handlooms with steam degumming and hand finishing',
    productionCapacity: '40 sarees per month on 6 Jacquard handlooms',
    productMix: [
      { name: 'Pure silk saree (pattu)', sharePercent: 65, sellingPrice: 12000 },
      { name: 'Silk half-saree fabric set', sharePercent: 20, sellingPrice: 9000 },
      { name: 'Silk dupatta and stole', sharePercent: 15, sellingPrice: 4500 },
    ],
  },
  step6: {
    targetMarket:
      'Saree showrooms and wholesalers in Dharmavaram, Hyderabad, Bengaluru and Chennai, plus bridal orders from families in Anantapur and Kurnool districts.',
    existingDemand:
      'Peak demand October–February (wedding and festival season); two Hyderabad showrooms have placed standing orders for 15 sarees a month.',
  },
  step10: {
    name: 'Weaving shed, Handloom Park Road, Dharmavaram',
    landDetails:
      "Own 2,400 sq ft weaving shed on a 600 sq yd plot in the proprietor's name (registered sale deed 2014); an 800 sq ft extension is planned.",
    powerRequirements: '12 kW, 3-phase handloom tariff connection',
  },
  step11: {
    spvName: 'Padmaja Silk Handlooms (Prop. Gaddam Padmaja)',
    legalStatus: 'Sole proprietorship',
    gstin: '37AEHPB2290L1ZF',
    firmPan: 'AEHFB2290L',
    udyamNumber: 'UDYAM-AP-03-0066274',
    applicantMobile: '9618403925',
    address: 'D.No. 6-112, Handloom Park Road, Dharmavaram, Sri Sathya Sai District, Andhra Pradesh 515671',
  },
  step12: {
    land: '0.00',
    building: 3.2,
    machineryItems: [
      { description: 'Jacquard handloom with accessories', condition: 'new', supplier: 'Sri Sai Loom Works, Dharmavaram', quantity: 6, unitCost: 0.95 },
      { description: 'Warping and sizing machine', condition: 'new', supplier: 'Venkateswara Textile Machinery, Salem', quantity: 1, unitCost: 1.1 },
      { description: 'Silk twisting machine', condition: 'new', supplier: 'Venkateswara Textile Machinery, Salem', quantity: 2, unitCost: 0.65 },
      { description: 'Steam degumming and dyeing vats', condition: 'new', supplier: 'Sri Sai Loom Works, Dharmavaram', quantity: 1, unitCost: 1.4 },
      { description: 'Calendering and finishing machine', condition: 'new', supplier: 'Venkateswara Textile Machinery, Salem', quantity: 1, unitCost: 1 },
    ],
    machinery: 10.5,
    utilitiesAndInfrastructure: 0.8,
    preliminaryAndPreOperative: 0.5,
    workingCapitalMargin: 6.5,
  },
  step13: {
    bankName: 'Canara Bank, Dharmavaram Branch',
    interestRate: 10.75,
    moratoriumMonths: 6,
    loanTenureMonths: 72,
    spvContribution: 6.5,
    governmentGrant: '0.00',
    bankLoan: 15,
    otherSources: '0.00',
  },
  step14: {
    rawMaterialItems: [
      { name: 'Mulberry silk yarn (20/22 denier) and zari', use: 'Warp, weft and borders', basis: 'Monthly from Bengaluru silk-yarn dealers on 30-day credit' },
      { name: 'Dyes, chemicals and soap-nut', use: 'Degumming and colouring', basis: 'Quarterly from a Salem dye supplier, cash' },
      { name: 'Cartons, saree covers and labels', use: 'Packing for showrooms', basis: 'Quarterly from a Hyderabad packaging dealer' },
    ],
    staffRoles: [{ role: 'Master weaver', count: 6, monthlyPay: 14000 }],
    rawMaterialCost: 26.4,
    powerCost: 0.6,
    wages: 10.08,
    maintenance: 0.6,
    administrativeExpenses: 1.5,
    marketingExpenses: 1.4,
    annualProductionVolume: 480,
    annualSalesRealization: 49.32,
  },
  step15: {
    yearProjections: [
      { year: 1, sales: 49.32, rm: 26.4, wages: 10.08, power: 0.6, netProfit: 3.8 },
      { year: 2, sales: 51.79, rm: 27.72, wages: 10.58, power: 0.63, netProfit: 4.49 },
      { year: 3, sales: 54.38, rm: 29.11, wages: 11.11, power: 0.66, netProfit: 5.2 },
      { year: 4, sales: 57.09, rm: 30.56, wages: 11.67, power: 0.69, netProfit: 5.92 },
      { year: 5, sales: 59.95, rm: 32.09, wages: 12.25, power: 0.73, netProfit: 6.67 },
    ],
    breakEvenPoint: 77,
  },
  schemeExtras: {
    loanPurpose: 'termLoan',
    womenOwned: 'yes',
    proposedLimit: '15',
    entrepreneurName: 'Gaddam Padmaja',
    businessKind: 'manufacturing',
  },
};

export default sample;
