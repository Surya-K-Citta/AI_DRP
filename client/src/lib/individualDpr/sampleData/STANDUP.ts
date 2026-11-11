/**
 * Sample answers for Stand-Up India (QA doc section 5). Keys are CONTENT steps (store buckets). Uploads stay manual.
 * Deviations from QA doc:
 *  (1) Land, government grant and other sources are the text '0.00' instead of the number 0, because the
 *      completeness check treats a bare numeric 0 as unanswered (they still add up as 0).
 */
import type { SampleData } from './types';

const sample: SampleData = {
  step1: {
    unitName: 'Sri Durga Bhavani Chilli & Spice Products',
    clusterName: 'Sri Durga Bhavani Chilli & Spice Products',
    district: 'Palnadu',
    location: 'Chilakaluripet',
    natureOfBusiness: 'Manufacturing branded chilli, turmeric and coriander powders and sambar masala in retail packs',
    majorProducts: 'Chilli powder, turmeric powder, coriander powder, sambar masala',
  },
  step2: {
    sectorType: 'Agro-processing - spice powders',
    sectorDescription:
      'The unit will clean, grind, blend and pack red chilli, turmeric, coriander and sambar masala powders under the brand "Durga Bhavani" for retail shops, supermarkets and wholesalers in Palnadu, Guntur and Krishna districts. Chilakaluripet sits beside the Guntur chilli belt so raw material is available all year.',
  },
  step3: {
    geography:
      'Plot 14 on Narasaraopet Road, Chilakaluripet (Chilakaluripet mandal, Palnadu district), on the NH-16 corridor about 30 km from Guntur. Chilli yards of Guntur and turmeric markets of Duggirala are within 40 km; retail customers are in Guntur, Narasaraopet and Vijayawada.',
  },
  step4: {
    presentActivities:
      'Proposed greenfield spice-processing unit with one hammer mill, destemmer, roaster, ribbon blender and automatic pouch-filling machine, running a single 8-hour shift.',
    yearOfEstablishment: '2026-12-01',
    commitmentDate: '2026-12-15',
    technologyLevel: 'Mechanised: hammer-mill grinding, ribbon blending and automatic pouch filling',
    productionCapacity: '120 kg of spice powder per day (single 8-hour shift)',
    productMix: [
      { name: 'Chilli powder', sharePercent: 55, sellingPrice: 350 },
      { name: 'Turmeric powder', sharePercent: 25, sellingPrice: 290 },
      { name: 'Coriander powder and sambar masala', sharePercent: 20, sellingPrice: 305 },
    ],
  },
  step6: {
    targetMarket:
      'Kirana and supermarket chains in Guntur, Narasaraopet and Vijayawada, hotels and mess operators, and wholesalers who repack under their own labels.',
    existingDemand:
      'Branded chilli powder demand is steady all year; retailers reorder every two weeks and three Guntur wholesalers have given letters of intent for 800 kg a month.',
    competitorAnalysis:
      'Competitors are Guntur-based Sri Lakshmi Masala and Vijaya Foods plus unbranded loose powder. Strengths: raw material 40 km away, women-led quality control and lower freight. Weakness: new brand with no shelf presence yet.',
  },
  step10: {
    name: 'Leased factory shed, Narasaraopet Road, Chilakaluripet',
    landDetails: '3,200 sq ft shed leased for nine years from Sri M. Veera Reddy at ₹15,000 per month from 1 December 2026.',
    powerRequirements: '20 kW, 3-phase industrial connection',
  },
  step11: {
    spvName: 'Sri Durga Bhavani Spices (Partnership firm)',
    legalStatus: 'Partnership firm (two partners)',
    gstin: '37AAFFD3317K1ZG',
    firmPan: 'AAFFD3317K',
    udyamNumber: 'UDYAM-AP-17-0051093',
    applicantMobile: '9347261184',
    address: 'Plot 14, Narasaraopet Road, Chilakaluripet, Palnadu District, Andhra Pradesh 522616',
  },
  step12: {
    land: '0.00',
    building: 4.5,
    machineryItems: [
      { description: 'Hammer-mill pulveriser, 10 HP with cyclone', condition: 'new', supplier: 'Sri Sai Agro Engineering, Guntur', quantity: 1, unitCost: 1.85 },
      { description: 'Chilli destemmer and cleaner', condition: 'new', supplier: 'Sri Sai Agro Engineering, Guntur', quantity: 1, unitCost: 1.2 },
      { description: 'Drum roaster / dryer for turmeric and coriander', condition: 'new', supplier: 'Vijaya Food Machinery, Vijayawada', quantity: 1, unitCost: 1.6 },
      { description: 'Ribbon blender, 100 kg', condition: 'new', supplier: 'Vijaya Food Machinery, Vijayawada', quantity: 1, unitCost: 1.45 },
      { description: '4-head automatic pouch filling and sealing machine', condition: 'new', supplier: 'Pack Tech Machinery, Hyderabad', quantity: 1, unitCost: 3.8 },
      { description: 'Digital platform and table-top weighing scales', condition: 'new', supplier: 'Sri Balaji Weighing Systems, Guntur', quantity: 2, unitCost: 0.25 },
      { description: 'Storage racks, bins and pallets', condition: 'new', supplier: 'Local fabricator, Chilakaluripet', quantity: 1, unitCost: 0.9 },
    ],
    machinery: 11.3,
    utilitiesAndInfrastructure: 1.8,
    preliminaryAndPreOperative: 1.2,
    workingCapitalMargin: 5.2,
  },
  step13: {
    bankName: 'Union Bank of India, Chilakaluripet Branch',
    interestRate: 10.5,
    moratoriumMonths: 6,
    loanTenureMonths: 84,
    spvContribution: 5.2,
    governmentGrant: '0.00',
    bankLoan: 18.8,
    otherSources: '0.00',
  },
  step14: {
    rawMaterialItems: [
      { name: 'Dry red chillies (Teja and 334 varieties)', use: 'Chilli powder', basis: 'Seasonal bulk buying (February–May) from the Guntur chilli yard, cash and 7-day credit' },
      { name: 'Turmeric fingers and coriander seed', use: 'Turmeric and coriander powders', basis: 'Monthly from Duggirala and Chilakaluripet traders' },
      { name: 'Laminated pouches, cartons and labels', use: 'Retail packing', basis: 'Quarterly orders from a Hyderabad packaging supplier' },
    ],
    staffRoles: [
      { role: 'Supervisor-cum-store keeper', count: 1, monthlyPay: 15000 },
      { role: 'Machine operator', count: 2, monthlyPay: 11000 },
      { role: 'Packing worker (women)', count: 3, monthlyPay: 8500 },
    ],
    rawMaterialCost: 44,
    powerCost: 1.8,
    wages: 7.5,
    maintenance: 0.96,
    administrativeExpenses: 3,
    marketingExpenses: 2.4,
    annualProductionVolume: 21600,
    annualSalesRealization: 70.42,
  },
  step15: {
    yearProjections: [
      { year: 1, sales: 70.42, rm: 44, wages: 7.5, power: 1.8, netProfit: 4.68 },
      { year: 2, sales: 73.94, rm: 46.2, wages: 7.88, power: 1.89, netProfit: 5.47 },
      { year: 3, sales: 77.64, rm: 48.51, wages: 8.27, power: 1.98, netProfit: 6.29 },
      { year: 4, sales: 81.52, rm: 50.94, wages: 8.68, power: 2.08, netProfit: 7.11 },
      { year: 5, sales: 85.6, rm: 53.48, wages: 9.12, power: 2.19, netProfit: 7.96 },
    ],
    breakEvenPoint: 75,
  },
  step16: {
    startDate: '2027-03-01',
    milestones: [
      { activity: 'Machinery order and installation', timeRequired: '', startDate: '2026-12-15', endDate: '2027-02-05' },
      { activity: 'Power connection (20 kW)', timeRequired: '', startDate: '2026-12-01', endDate: '2027-01-15' },
      { activity: 'Trial run, FSSAI licence and first batch', timeRequired: '', startDate: '2027-02-06', endDate: '2027-02-28' },
    ],
  },
  schemeExtras: {
    standupCategory: 'woman',
    loanAmountSought: '18.8',
    entrepreneurName: 'Kolla Venkata Durga Bhavani',
    entrepreneurAge: '37',
    controllingStakePercent: '60',
    processOfManufacture:
      'Dry red chillies, turmeric fingers and coriander seed are bought from the Guntur and Duggirala yards, cleaned and destemmed, roasted or dried where needed, ground in the hammer mill with a cyclone, blended in the ribbon blender, weighed and sealed in 100 g, 250 g and 500 g laminated pouches on the 4-head machine, then boxed and dispatched.',
    installedCapacity: '120 kg of spice powder per day (single 8-hour shift)',
    capacityUtilisationY1: '60',
    premisesType: 'leased',
    businessKind: 'manufacturing',
  },
};

export default sample;
