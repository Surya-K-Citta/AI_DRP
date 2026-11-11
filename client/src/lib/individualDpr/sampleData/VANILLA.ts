// Sample data: Vanilla bank term loan (no scheme). Source: docs/qa/AI-DPR-E2E-QA-Test-Document.md section 1.
// Deviations from QA doc: (1) Government Grant and Other Sources are stored as the text '0.00' instead of the number 0,
// because the completeness check treats a bare numeric 0 as unanswered (value is still 0 in all sums).
// (step 13 hidden interestRate/loanTenureMonths are what the "Loan instalment and DSCR" calculator writes).
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
    unitName: 'Sri Annapurna Aqua Packaged Water Plant',
    clusterName: 'Sri Annapurna Aqua Packaged Water Plant',
    district: 'Guntur',
    location: 'Tenali',
    natureOfBusiness: 'Packaged drinking water manufacturing (RO + UV treated)',
    majorProducts: '20-litre water jars, 1-litre bottles (cartons of 12)',
  },
  step2: {
    sectorType: 'Food and beverage – packaged drinking water',
    sectorDescription:
      'Packaged drinking water is a fast-growing segment of the food and beverage industry in Andhra Pradesh. Households, hospitals, hostels, offices, function halls and shops in towns like Tenali increasingly buy 20-litre jars and 1-litre bottles because borewell water in the Krishna delta is often high in TDS and hardness. A small RO plant with UV and ozone disinfection can serve a 25 km radius with daily doorstep delivery.',
    nationalImportance:
      'Safe drinking water is a national priority under the Jal Jeevan Mission and the Swachh Bharat programme. Packaged water is regulated by the FSSAI and must follow BIS standard IS 14543, which has created steady demand for licensed small bottlers who can supply tested water to towns not yet fully covered by piped supply.',
    stateLevelImportance:
      "Andhra Pradesh has a large, fast-urbanising population along the Krishna-Guntur belt and many hostels, hospitals, wedding halls and offices. The state's MSME policy encourages food processing and agro-based units in district industrial areas, and Guntur district has a strong base of small manufacturers and dealers who can distribute the product.",
    keyProducts: [
      '20-litre packaged drinking water jar (BIS IS 14543)',
      '1-litre packaged drinking water bottle (carton of 12)',
      'Reusable 20-litre PET jar (refundable deposit scheme)',
    ],
  },
  step3: {
    geography:
      'Tenali is a municipal town in Guntur district on the Krishna delta, about 25 km from Guntur and 40 km from Vijayawada. The unit site is a 400 sq. yd. plot in the Chenchupet industrial area, with flat land, a 30 ft internal road and a borewell of good yield.',
    climate: 'Hot and humid; summer up to 42 C, rainfall about 900 mm a year; peak water demand March to June',
    infrastructure:
      'Three-phase power from APSPDCL, own borewell so no dependence on municipal supply, all-weather road, mobile and broadband coverage, banks, transporters and packaging dealers within 5 km.',
    keyEconomicActivities:
      'Paddy and banana farming, rice mills, chilli and cotton trading, small engineering workshops and retail trade serving the Krishna delta.',
    rawMaterialAvailability:
      "Raw water from the plot's own borewell; PET preforms, caps, labels, cartons and RO chemicals are available from packaging dealers in Vijayawada and Guntur with 1-2 day delivery.",
    rawMaterialQuantity: 'About 20,000 litres of raw borewell water per day (60% RO recovery gives 12,000 litres treated)',
    industrialInfrastructure:
      'Chenchupet industrial area has three-phase power, approach roads, a few engineering and packaging units and a drain for RO reject water.',
    connectivity: {
      road: 'NH-16 at about 20 km; Guntur-Tenali-Repalle state highway at 2 km',
      rail: 'Tenali Junction railway station, 3 km, on the Vijayawada-Chennai main line',
      port: 'Machilipatnam port about 90 km; Krishnapatnam port about 190 km',
    },
  },
  step4: {
    presentActivities:
      'The promoters have 14 years of experience installing and servicing RO plants and now distribute 20-litre jars for another brand. They propose to start their own licensed packaged drinking water plant in Tenali to supply jars and bottles directly to retailers and institutions.',
    yearOfEstablishment: 2026,
    technologyLevel:
      'Semi-automatic: multi-stage pre-treatment, reverse osmosis, ozonation and UV disinfection with semi-automatic jar and bottle filling',
    productionCapacity: '12,000 litres per day (about 600 jars of 20 litres) in one 8-hour shift',
    clusterEvolution:
      'The promoters started as RO service technicians in 2012 and built a customer base of about 150 households and shops. After running a jar distribution agency for three years they decided to manufacture their own brand to improve margins and quality control.',
    typeOfUnits: 'Micro manufacturing unit (partnership firm)',
    stakeholders: [
      'Partners',
      'State Bank of India',
      'APSPDCL',
      'FSSAI',
      'BIS',
      'Pollution Control Board',
      'jar and bottle distributors',
    ],
  },
  step5: {
    rawMaterials: [
      { name: 'Borewell water (raw water)', source: 'Own borewell, Chenchupet plot' },
      { name: 'PET preforms and 1-litre bottle caps', source: 'Packaging dealer, Vijayawada' },
      { name: '20-litre jar caps, seals and labels', source: 'Label printer, Guntur' },
      { name: 'RO membranes, antiscalant and filter cartridges', source: 'Aqua Tech Water Systems, Vijayawada' },
    ],
    intermediateProducts: [
      'Filtered water',
      'RO treated water',
      'ozonated and UV-disinfected water in storage tank',
    ],
    finalProducts: ['20-litre packaged drinking water jar', '1-litre packaged drinking water bottle'],
    valueAdditionStages: [
      { stage: 'Raw water pre-treatment and reverse osmosis (treated bulk water)', sellingPrice: 18 },
      { stage: 'Disinfection, jar washing and filling', sellingPrice: 42 },
      { stage: 'Branded sealing, coding and doorstep delivery', sellingPrice: 51 },
    ],
    majorBuyers: [
      'Retail kirana and tea shops in Tenali',
      'Hospitals and nursing homes',
      'Student hostels',
      'Function halls',
      'Government and private offices',
    ],
  },
  step6: {
    targetMarket:
      'Retail shops, hostels, hospitals, function halls and offices within 25 km of Tenali, served by two delivery autos on fixed daily routes.',
    existingDemand:
      'A survey of 60 shops and 12 hostels done by the promoters shows a daily need of about 900 jars; existing suppliers from Guntur and Vijayawada deliver late and raise prices in summer.',
    demandSupplyGap:
      'Local plants meet only about 60% of summer demand; buyers complain about irregular delivery, TDS variation and leaking jars.',
    competitorAnalysis:
      'Four small plants in Tenali and branded jars from Guntur sell at Rs 25-35 per jar. Our edge is BIS-licensed quality, daily delivery and a refundable jar deposit.',
    priceTrends:
      'The price of a 20-litre jar in Tenali has risen from Rs 22 to Rs 30 over the last three years; 1-litre bottles retail at Rs 10-20.',
    exportPotential:
      'No direct export planned; supply is limited to Tenali and neighbouring mandals and the district headquarters.',
  },
  step7: {
    technologyGaps:
      'Most local suppliers use basic filters without ozone or regular TDS testing, so water quality varies from batch to batch.',
    infrastructureGaps:
      'Few plants have a covered filling hall, hygienic jar washing or a proper storage room; power cuts interrupt continuous operation.',
    skillGaps:
      'Trained RO operators and quality-control technicians are scarce in Tenali; the promoters will train the staff.',
    marketingGaps:
      'Small plants lack branding, regular institutional contracts and simple phone or online ordering.',
    financialGaps:
      'Small bottlers find it hard to raise a term loan for plant and working capital without a bank-ready project report.',
    justificationForIntervention:
      'A bank-financed licensed plant with proper treatment, testing and branded packaging will meet local demand, create nine jobs and give hospitals, hostels and offices in Tenali a safe and reliable supply of drinking water.',
  },
  step8: {
    strengths: [
      '14 years of RO technical experience',
      'Own borewell with good yield',
      'Plot with three-phase power',
      'Existing customer base of about 150 shops and households',
    ],
    weaknesses: [
      'New brand with no market share yet',
      'Dependence on a single borewell',
      'Limited working capital',
      'Seasonal demand variation',
    ],
    opportunities: [
      'Rising demand from hostels and hospitals',
      'Wedding and function season sales',
      'Institutional contracts with offices and colleges',
      'Government push for safe drinking water',
    ],
    threats: [
      'Competition from established brands',
      'Water quality or licence violations',
      'Power cost increases',
      'Falling borewell yield in summer',
    ],
  },
  step9: {
    interventionType: 'Hard',
    description:
      'Establish a new 12,000 litres per day packaged drinking water plant with RO, UV and ozone treatment, a jar washing-filling machine, a bottle filling machine, a storage room and a delivery system for jars and bottles.',
    objectives: [
      'Produce BIS-standard drinking water',
      'Create nine direct jobs',
      'Build a branded supply to 150 retail points',
      'Repay the term loan within 7 years',
    ],
    expectedBenefits: [
      'Safe water for local institutions',
      'Annual sales of about Rs 51 lakh',
      'Employment for nine persons',
      'Steady income for two partners',
    ],
  },
  step10: {
    name: 'Sri Annapurna Aqua plant shed, Chenchupet',
    location: 'Chenchupet industrial area, Tenali',
    landDetails:
      '400 sq. yd. industrial plot in Chenchupet, Tenali, to be bought from the present owner (agreement of sale signed); land cost of Rs 4 lakh is included in the project cost.',
    civilWorks:
      'RCC-roof shed of 1,800 sq. ft. for the plant and filling hall, a 300 sq. ft. storage room, a 150 sq. ft. office and a 10,000-litre underground water sump.',
    manufacturingProcess:
      'Borewell water is pumped to a raw-water tank, passed through sand and carbon filters and a softener, and then reverse osmosis. The treated water is stored, ozonated and UV-sterilised; jars are washed, filled, capped and sealed, and bottles are filled and capped on a separate machine. Finished goods are date-coded and stored for dispatch.',
    plantAndMachinery:
      'RO plant 1,500 LPH with pre-filters, UV steriliser and ozone generator, 3-in-1 jar washing-filling machine, cap-sealing unit, bottle filling machine, SS storage tanks and a date coder.',
    capacity: '12,000 litres per day',
    powerRequirements: '18 kW connected load, three-phase',
    waterRequirements:
      '20,000 litres per day raw water from own borewell; RO reject water of about 8,000 litres is reused for floor cleaning and gardening',
    manpowerRequirements: '9 persons: 1 plant manager, 1 accountant-cum-salesman, 2 operators, 3 helpers, 2 drivers',
  },
  step11: {
    spvName: 'M/s Sri Annapurna Aqua Industries',
    legalStatus: 'Partnership firm',
    gstin: '37AAJFS4821M1ZQ',
    firmPan: 'AAJFS4821M',
    udyamNumber: 'UDYAM-AP-11-0034821',
    applicantMobile: '9440218365',
    yearOfIncorporation: 2025,
    submittedTo: 'The Branch Manager, State Bank of India, Tenali Main Branch',
    objectives: [
      'Set up a 12,000 litres per day packaged drinking water plant at Tenali',
      'Provide employment to nine persons and safe drinking water to local institutions',
    ],
    owners: 'Kolluri Srinivasa Rao, Kolluri Padmavathi',
    boardOfDirectors: [
      { name: 'Kolluri Srinivasa Rao', designation: 'Owner' },
      { name: 'Kolluri Padmavathi', designation: 'Owner' },
    ],
    address: 'Tenali, Guntur',
  },
  step12: {
    land: 4,
    building: 8,
    machinery: 14.5,
    utilitiesAndInfrastructure: 3,
    preliminaryAndPreOperative: 1.5,
    workingCapitalMargin: 5,
    machineryItems: [
      machine('RO plant 1,500 LPH with sand, carbon and softener pre-treatment', 'Aqua Tech Water Systems, Vijayawada', 1, 5.2),
      machine('UV steriliser (2 x 55 W) and ozone generator', 'Aqua Tech Water Systems, Vijayawada', 1, 0.9),
      machine('Semi-automatic 3-in-1 jar rinsing, filling and capping machine (300 jars/hr)', 'Sri Vinayaka Filling Machines, Coimbatore', 1, 3.6),
      machine('Jar cap-sealing and shrink unit', 'Sri Vinayaka Filling Machines, Coimbatore', 1, 0.35),
      machine('Semi-automatic 1-litre bottle rinsing, filling and capping machine (1,200 bottles/hr)', 'Sri Vinayaka Filling Machines, Coimbatore', 1, 2.45),
      machine('SS 304 water storage tank, 2,000 litres', 'Hindustan Steel Fabricators, Guntur', 2, 0.6),
      machine('Date coder and water quality testing kit (TDS, pH, microbial)', 'Sree Coding Systems, Hyderabad', 1, 0.8),
    ],
  },
  step13: {
    spvContribution: 10.8,
    governmentGrant: '0.00', // text zero: the progress counter ignores a numeric 0
    bankLoan: 25.2,
    otherSources: '0.00',
    interestRate: 11,
    loanTenureMonths: 84,
  },
  step14: {
    rawMaterialCost: 11.4,
    powerCost: 3.6,
    wages: 15.6,
    maintenance: 1.2,
    administrativeExpenses: 1.8,
    marketingExpenses: 6.6,
    annualProductionVolume: 126000,
    annualSalesRealization: 51,
  },
  step15: {
    yearProjections: [
      { year: 1, sales: 51, rm: 11.4, wages: 15.6, power: 3.6, netProfit: 3.43 },
      { year: 2, sales: 53.55, rm: 11.97, wages: 16.38, power: 3.78, netProfit: 4.39 },
      { year: 3, sales: 56.23, rm: 12.57, wages: 17.2, power: 3.97, netProfit: 5.34 },
      { year: 4, sales: 59.04, rm: 13.2, wages: 18.06, power: 4.17, netProfit: 6.31 },
      { year: 5, sales: 61.99, rm: 13.86, wages: 18.96, power: 4.38, netProfit: 7.29 },
    ],
    breakEvenPoint: 70,
  },
  step16: {
    startDate: '2027-02-15',
    milestones: [
      { activity: 'Order and install RO plant, filling machines and storage tanks', startDate: '2026-12-01', endDate: '2027-01-20' },
      { activity: 'Three-phase power connection, BIS and FSSAI licences', startDate: '2026-12-10', endDate: '2027-01-10' },
      { activity: 'Trial run and start of commercial production', startDate: '2027-01-25', endDate: '2027-02-10' },
    ],
  },
  step17: {
    employmentGeneration: 9,
    turnoverGrowth: 51,
  },
  schemeExtras: { businessKind: 'manufacturing' },
};

export default sample;
