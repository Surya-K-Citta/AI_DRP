// Sample data: PMEGP (Sri Durga Bakery and Biscuits Unit). Source: docs/qa/AI-DPR-E2E-QA-Test-Document.md section 2.
// Deviations from QA doc:
// (1) Land (step 12) and Other Sources (step 13) are stored as the text '0.00' instead of the number 0, because the
//     completeness check treats a bare numeric 0 as unanswered (they still add up as 0).
// (2) Hidden extras pmegpSubsidyPercent / pmegpOwnPercent ('35' / '5') are what the form writes silently when Category/Area change.
// (3) Entrepreneur name / age are stored as text in schemeExtras, like the form does.
// Residual: Firm PAN (step 7) is left blank as the QA doc says (sole proprietor has no firm PAN), so the Applicant / firm
// section reads 6/7 answered in the verifier.
import type { SampleData } from './types';

const machine = (description: string, supplier: string, quantity: number, unitCost: number) => ({
  description,
  condition: 'new',
  supplier,
  quantity,
  unitCost,
  gst: 0,
  transport: 0,
  installation: 0,
  lifeYears: 0,
  annualMaintenance: 0,
});

const sample: SampleData = {
  step1: {
    unitName: 'Sri Durga Bakery and Biscuits Unit',
    clusterName: 'Sri Durga Bakery and Biscuits Unit',
    district: 'Anakapalli',
    location: 'Kasimkota',
    natureOfBusiness: 'Bakery products manufacturing',
    majorProducts: 'Sandwich bread, buns, tea rusk, cookies',
  },
  step2: {
    sectorType: 'Food processing – bakery and confectionery',
    sectorDescription:
      'Bakery products such as sandwich bread, buns, tea rusk and cookies are bought every day by households, tea shops, hostels and small retailers in Kasimkota mandal and the nearby villages. At present most bread arrives from Anakapalli and Visakhapatnam after a delay of four to six hours. A village bakery will supply fresh products every morning.',
  },
  step3: {
    geography:
      'Kasimkota is a mandal headquarters in Anakapalli district, about 25 km from Anakapalli town and 55 km from Visakhapatnam. The workshed is on the main road in Kasimkota village with bus service, a daily market and tea shops nearby; the catchment is Kasimkota mandal and 12 neighbouring villages.',
  },
  step4: {
    presentActivities:
      'Smt. Naga Lakshmi has run a small home-based snack and cake business for five years and completed a DIC-sponsored bakery training. She now proposes a regular bakery unit with an oven, mixer and divider to supply nearby villages.',
    yearOfEstablishment: '2026-11-02',
    commitmentDate: '2026-11-23',
    technologyLevel: 'Semi-automatic: spiral mixer, divider-rounder, proofer and rotary rack oven',
    productionCapacity: '250 kg of bakery products per day (single 8-hour shift)',
    productMix: [
      { name: 'Sandwich bread (sold by weight)', sharePercent: 45, sellingPrice: 82 },
      { name: 'Buns and pav', sharePercent: 20, sellingPrice: 80 },
      { name: 'Tea rusk', sharePercent: 15, sellingPrice: 95 },
      { name: 'Cookies and biscuits', sharePercent: 20, sellingPrice: 120 },
    ],
  },
  step6: {
    targetMarket:
      'Tea shops, kirana stores, school canteens and households in Kasimkota and 12 nearby villages, supplied by a three-wheeler on four fixed daily routes.',
    existingDemand:
      'About 150 tea shops and 60 kirana stores in the catchment; the promoter already holds verbal orders from 35 shops for about 120 kg a day.',
  },
  step10: {
    name: 'Own workshed attached to residence, Kasimkota main road',
    landDetails:
      'Own site of 40 sq. yd. with a 600 sq. ft. workshed to be renovated; no rent is payable because it belongs to the promoter.',
    powerRequirements: '9 kW, three-phase',
  },
  step11: {
    spvName: 'Sri Durga Bakery and Biscuits Unit (Prop. Bandaru Naga Lakshmi)',
    legalStatus: 'Sole proprietorship',
    gstin: '37AZXPB4417L1ZV',
    udyamNumber: 'UDYAM-AP-03-0048215',
    applicantMobile: '9505734128',
    address: 'Door No. 2-41, Main Road, Kasimkota (V & M), Anakapalli District, Andhra Pradesh - 531031',
  },
  step12: {
    land: '0.00',
    building: 2.4,
    machinery: 7.2,
    utilitiesAndInfrastructure: 0.9,
    preliminaryAndPreOperative: 0.6,
    workingCapitalMargin: 3.5,
    machineryItems: [
      machine('Rotary rack oven, 12-tray, LPG/diesel fired', 'Sri Balaji Bakery Equipments, Visakhapatnam', 1, 2.75),
      machine('Spiral dough mixer, 25 kg', 'Sri Balaji Bakery Equipments, Visakhapatnam', 1, 1.1),
      machine('Dough divider-rounder', 'Sri Balaji Bakery Equipments, Visakhapatnam', 1, 0.95),
      machine('Proofer cabinet, 16-tray', 'Sri Balaji Bakery Equipments, Visakhapatnam', 1, 0.6),
      machine('Bread slicer', 'Sri Balaji Bakery Equipments, Visakhapatnam', 1, 0.45),
      machine('Pouch sealing machine', 'Vizag Packaging Machines, Visakhapatnam', 2, 0.2),
      machine('Baking trays, loaf pans and moulds (set)', 'Sri Balaji Bakery Equipments, Visakhapatnam', 1, 0.75),
      machine('Electronic weighing scale, 30 kg', 'Vizag Weigh Systems, Visakhapatnam', 2, 0.1),
    ],
  },
  step13: {
    bankName: 'Andhra Pradesh Grameena Vikas Bank, Kasimkota Branch',
    interestRate: 11,
    moratoriumMonths: 6,
    loanTenureMonths: 60,
    spvContribution: 0.73,
    governmentGrant: 5.11,
    bankLoan: 8.76,
    otherSources: '0.00',
  },
  step14: {
    rawMaterialCost: 21.15,
    powerCost: 3,
    wages: 8.52,
    maintenance: 0.5,
    administrativeExpenses: 0.8,
    marketingExpenses: 1.6,
    annualProductionVolume: 45000,
    annualSalesRealization: 41,
    rawMaterialItems: [
      { name: 'Maida (refined wheat flour)', use: 'Dough for bread, buns, rusk and cookies', basis: '50 kg bags from a flour dealer at Anakapalli, every fortnight' },
      { name: 'Sugar and salt', use: 'Sweetening and dough conditioning', basis: '50 kg bags from a Kasimkota wholesaler, monthly' },
      { name: 'Yeast, bread improver and milk powder', use: 'Fermentation and softness', basis: 'Packed lots from Visakhapatnam bakery suppliers, monthly' },
      { name: 'Edible oil and margarine', use: 'Shortening for buns and cookies', basis: '15 kg tins from an Anakapalli oil dealer, every fortnight' },
      { name: 'Packing film and labels', use: 'Packing bread, rusk and cookies', basis: 'Printed rolls from Vizag Packaging, Visakhapatnam, quarterly' },
    ],
    staffRoles: [
      { role: 'Head baker', count: 1, monthlyPay: 16000 },
      { role: "Baker's helper", count: 3, monthlyPay: 11000 },
      { role: 'Packer', count: 1, monthlyPay: 10000 },
      { role: 'Delivery-cum-salesman', count: 1, monthlyPay: 12000 },
    ],
  },
  step15: {
    yearProjections: [
      { year: 1, sales: 41, rm: 21.15, wages: 8.52, power: 3, netProfit: 2.21 },
      { year: 2, sales: 43.05, rm: 22.21, wages: 8.95, power: 3.15, netProfit: 2.67 },
      { year: 3, sales: 45.2, rm: 23.32, wages: 9.39, power: 3.31, netProfit: 3.16 },
      { year: 4, sales: 47.46, rm: 24.48, wages: 9.86, power: 3.47, netProfit: 3.66 },
      { year: 5, sales: 49.84, rm: 25.71, wages: 10.36, power: 3.65, netProfit: 4.18 },
    ],
    breakEvenPoint: 67.77,
  },
  step16: {
    startDate: '2027-02-01',
    milestones: [
      { activity: 'Order and install oven, mixer, divider and proofer', startDate: '2026-12-01', endDate: '2027-01-15' },
      { activity: 'Workshed renovation and power connection', startDate: '2026-11-25', endDate: '2027-01-10' },
      { activity: 'Trial batches and start of commercial production', startDate: '2027-01-20', endDate: '2027-01-31' },
    ],
  },
  step17: {
    employmentGeneration: 7,
    impactNote:
      'Gives regular work to seven local women and youth and brings fresh bread to remote villages; the promoter will repay the bank loan from unit income.',
  },
  schemeExtras: {
    businessKind: 'manufacturing',
    pmegpCategory: 'special',
    pmegpArea: 'rural',
    pmegpAgency: 'DIC',
    educationStatus: '8thPlus',
    entrepreneurName: 'Bandaru Naga Lakshmi',
    entrepreneurAge: '34',
    pmegpSubsidyPercent: '35',
    pmegpOwnPercent: '5',
    executiveSummary:
      'Smt. Bandaru Naga Lakshmi proposes a 250 kg per day bakery unit at Kasimkota, Anakapalli district, to make sandwich bread, buns, tea rusk and cookies. The project cost is Rs 14.60 lakh: own contribution Rs 0.73 lakh (5%), PMEGP margin money Rs 5.11 lakh (35%, special category woman, rural) and bank term loan plus working capital Rs 8.76 lakh (60%). The unit will employ 7 persons directly and is expected to reach sales of Rs 41 lakh in the first year at 60% capacity utilisation.',
    processOfManufacture:
      '1. Weigh maida, sugar, yeast, salt and improvers. 2. Knead the dough in the spiral mixer for 12-15 minutes. 3. Divide and round the dough, rest it for 15 minutes, then mould loaves and buns. 4. Proof in the proofer cabinet for 45-60 minutes. 5. Bake in the rotary rack oven at 200-220 C for 25-30 minutes. 6. Cool, slice and pack bread in printed film; rusk is re-baked and cookies are baked on trays. 7. Dispatch the same morning to shops by three-wheeler.',
    installedCapacity: '250 kg of bakery products per day (single 8-hour shift)',
    capacityUtilisationY1: '60',
    powerRequirement: '9 kW, three-phase',
    directEmployment: '7',
    indirectEmployment: '5',
    impactNote:
      'Gives regular work to seven local women and youth and brings fresh bread to remote villages; the promoter will repay the bank loan from unit income.',
  },
};

export default sample;
