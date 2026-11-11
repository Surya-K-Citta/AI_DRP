// Sample data: PMEGP 2nd loan (Khadar Engineering Works). Source: docs/qa/AI-DPR-E2E-QA-Test-Document.md section 3.
// Deviations from QA doc:
// (1) Land (step 12) and Other Sources (step 13) are stored as the text '0.00' instead of the number 0, because the
//     completeness check treats a bare numeric 0 as unanswered (they still add up as 0).
// (2) Select values use the option value (priorScheme 'PMEGP', sectorBand 'manufacturing', yes/no as 'yes'/'no').
// (3) Entrepreneur age, first sanction, turnover etc. are stored as text in schemeExtras, like the form does.
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
    unitName: 'Khadar Engineering Works',
    clusterName: 'Khadar Engineering Works',
    district: 'Nandyal',
    location: 'Nandyal',
    natureOfBusiness: 'Steel fabrication and farm implements workshop',
    majorProducts: 'MS gates and grills, farm-implement frames, roof trusses',
  },
  step2: {
    sectorType: 'Engineering – metal fabrication',
    sectorDescription:
      'Khadar Engineering Works in Nandyal has fabricated gates, grills, roof trusses and farm-implement frames since 2021 with a first PMEGP loan that is fully adjusted and repaid on time. Demand from farmers, builders and schools in Nandyal and the Kurnool region now exceeds the capacity of the manual workshop, so the unit proposes an upgrade with cutting, bending and welding machines to raise output and quality.',
  },
  step3: {
    geography:
      'Nandyal is a district headquarters on the Kurnool-Nandyal-Giddalur road, about 70 km from Kurnool. The workshop is on Industrial Estate Road with a ready customer base of farmers, builders and institutions in Nandyal, Atmakur and Banaganapalle mandals.',
  },
  step4: {
    presentActivities:
      'The unit fabricates MS gates and grills, farm-implement frames and roof trusses with 5 workers and a turnover of Rs 31.5 lakh. It has repaid the first PMEGP loan and now proposes an upgrade to nearly double capacity and improve finish.',
    yearOfEstablishment: '2021-09-06',
    commitmentDate: '2026-11-20',
    technologyLevel: 'Upgrade from manual cutting and bending to hydraulic and MIG-welded fabrication',
    productionCapacity: '8.6 tonnes of fabricated products per month after upgrade',
    productMix: [
      { name: 'MS gates and grills', sharePercent: 40, sellingPrice: 105 },
      { name: 'Farm-implement frames and sprayer stands', sharePercent: 35, sellingPrice: 95 },
      { name: 'Roof trusses and shed structures', sharePercent: 25, sellingPrice: 98 },
    ],
  },
  step6: {
    targetMarket:
      'Farmers, builders, school and hostel managements and contractors in Nandyal, Kurnool, Atmakur and Banaganapalle, reached through direct orders and local contractors.',
    existingDemand:
      'Fourteen pending orders for gates and trusses worth about Rs 9 lakh are being turned away for lack of capacity; farm-implement orders peak before the kharif season.',
  },
  step10: {
    name: 'Khadar Engineering Works shed, Industrial Estate Road, Nandyal',
    landDetails:
      'Own shed of 2,400 sq. ft. on a 300 sq. yd. site; a 700 sq. ft. extension will be built on the same site for the new machines.',
    powerRequirements: '30 kW three-phase (existing 15 kW, additional 15 kW required)',
  },
  step11: {
    spvName: 'Khadar Engineering Works (Prop. Shaik Abdul Khadar)',
    legalStatus: 'Sole proprietorship',
    gstin: '37CMLPS5528Q1ZY',
    udyamNumber: 'UDYAM-AP-17-0061042',
    applicantMobile: '9704861539',
    address: 'H.No. 14-3-82, Industrial Estate Road, Nandyal, Nandyal District, Andhra Pradesh - 518501',
  },
  step12: {
    land: '0.00',
    building: 3.5,
    machinery: 14.75,
    utilitiesAndInfrastructure: 1.25,
    preliminaryAndPreOperative: 0.5,
    workingCapitalMargin: 4,
    machineryItems: [
      machine('Hydraulic press brake, 40-ton x 2.5 m', 'Sri Sai Machine Tools, Hyderabad', 1, 4.75),
      machine('Hydraulic shearing machine, 3 mm x 2 m', 'Sri Sai Machine Tools, Hyderabad', 1, 3.25),
      machine('CNC plasma cutting machine with 1.5 m x 3 m table', 'Deccan CNC Systems, Hyderabad', 1, 2.5),
      machine('MIG welding set, 400 A', 'Deccan Welding Equipments, Kurnool', 2, 0.75),
      machine('Spray painting booth with 2 HP compressor', 'Deccan Welding Equipments, Kurnool', 1, 1.5),
      machine('EOT crane, 2-tonne', 'Sri Sai Machine Tools, Hyderabad', 1, 1.25),
    ],
  },
  step13: {
    bankName: 'Union Bank of India, Nandyal Main Branch',
    interestRate: 11,
    moratoriumMonths: 6,
    loanTenureMonths: 84,
    spvContribution: 2.4,
    governmentGrant: 3.6,
    bankLoan: 18,
    otherSources: '0.00',
  },
  step14: {
    rawMaterialCost: 35.5,
    powerCost: 3.4,
    wages: 11.4,
    maintenance: 1,
    administrativeExpenses: 1.2,
    marketingExpenses: 1.5,
    annualProductionVolume: 62000,
    annualSalesRealization: 62,
    rawMaterialItems: [
      { name: 'MS sheets, 2-6 mm', use: 'Gates, grills, panels and trusses', basis: 'Stockist at Kurnool, 5-tonne lots every month' },
      { name: 'MS angles, channels and square pipes', use: 'Frames and structures', basis: 'Stockist at Nandyal, weekly' },
      { name: 'Welding wire, electrodes and gas', use: 'Welding and cutting', basis: 'Local dealer, monthly' },
      { name: 'Primer, paint and consumables', use: 'Surface finish', basis: 'Paint dealer in Nandyal, monthly' },
    ],
    staffRoles: [
      { role: 'Master welder', count: 1, monthlyPay: 18000 },
      { role: 'Welder-fabricator', count: 3, monthlyPay: 13000 },
      { role: 'Helper', count: 3, monthlyPay: 9000 },
      { role: 'Machine operator', count: 1, monthlyPay: 11000 },
    ],
  },
  step15: {
    yearProjections: [
      { year: 1, sales: 62, rm: 35.5, wages: 11.4, power: 3.4, netProfit: 2.44 },
      { year: 2, sales: 65.1, rm: 37.28, wages: 11.97, power: 3.57, netProfit: 3.16 },
      { year: 3, sales: 68.36, rm: 39.14, wages: 12.57, power: 3.75, netProfit: 3.91 },
      { year: 4, sales: 71.77, rm: 41.1, wages: 13.2, power: 3.94, netProfit: 4.65 },
      { year: 5, sales: 75.36, rm: 43.15, wages: 13.86, power: 4.13, netProfit: 5.41 },
    ],
    breakEvenPoint: 65.37,
  },
  step16: {
    startDate: '2027-01-18',
    milestones: [
      { activity: 'Order and install press brake, shear and plasma cutting table', startDate: '2026-11-25', endDate: '2027-01-05' },
      { activity: 'Shed extension, additional power connection and crane', startDate: '2026-11-25', endDate: '2026-12-31' },
      { activity: 'Trial production and start of upgraded production', startDate: '2027-01-06', endDate: '2027-01-17' },
    ],
  },
  step17: {
    employmentGeneration: 8,
    impactNote:
      'Three new skilled jobs are added to the existing five; the upgrade is expected to double turnover to about Rs 62 lakh and improve finish quality for institutional buyers.',
  },
  schemeExtras: {
    businessKind: 'manufacturing',
    priorScheme: 'PMEGP',
    priorSanctionAmount: '9.8',
    firstSubsidyYear: '2021',
    pmegpAgency: 'DIC',
    sectorBand: 'manufacturing',
    nerHill: 'no',
    marginMoneyAdjusted: 'yes',
    firstLoanRepaid: 'yes',
    yearsProfitable: '4',
    existingTurnover: '31.5',
    entrepreneurName: 'Shaik Abdul Khadar',
    entrepreneurAge: '39',
    processOfManufacture:
      "1. Receive MS sheets, angles and pipes and stack them by size. 2. Mark and cut sheets on the plasma cutting table and the shearing machine. 3. Bend and form sections on the hydraulic press brake. 4. Weld frames with MIG sets on jigs and fixtures. 5. Grind, clean and fit hinges and locks. 6. Spray primer and paint in the painting booth and dry. 7. Inspect, load with the 2-tonne crane and deliver to the customer's site.",
    existingTech:
      'Manual gas cutting, hand-operated bending, two arc welding sets and a pedestal drilling machine; capacity of about 4.5 tonnes a month with 5 workers.',
    proposedTech:
      'Hydraulic press brake 40-ton, hydraulic shearing machine, CNC plasma cutting table, two MIG welding sets, a spray painting booth with compressor and a 2-tonne EOT crane; raises capacity to about 8.6 tonnes a month.',
    installedCapacity: '8.6 tonnes of fabricated products per month after upgrade',
    existingCapacity: '4.5 tonnes of fabricated products per month',
    capacityUtilisationY1: '60',
    powerRequirement: '30 kW three-phase (existing 15 kW, additional 15 kW required)',
    directEmployment: '8',
    indirectEmployment: '6',
    impactNote:
      'Three new skilled jobs are added to the existing five; the upgrade is expected to double turnover to about Rs 62 lakh and improve finish quality for institutional buyers.',
  },
};

export default sample;
