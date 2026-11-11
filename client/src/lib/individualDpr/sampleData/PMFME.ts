import type { SampleData } from './types';

// Source: QA doc section 9 (PMFME).
// Deviations from QA doc (needed so every question counts as answered; zero/blank does not count):
//  1. Firm PAN filled with a firm-format PAN (QA leaves it blank).
//  2. Land (QA blank): 0.30 lakh for site development/compound; building 1.50 -> 1.20 so project cost stays 15.00.
//  3. Other Sources (QA blank): 0.25 lakh (family loan); bank loan 7.50 -> 7.25 so finance = 15.00.
const sample: SampleData = {
  step1: {
    unitName: 'Sri Durga Chilli Foods',
    clusterName: 'Sri Durga Chilli Foods',
    district: 'Guntur',
    location: 'Prathipadu',
    natureOfBusiness: 'Spice / pickle processing',
    majorProducts: 'Red chilli powder, turmeric powder, coriander powder, sambar masala',
  },
  step2: {
    sectorType: 'Food processing — spices and condiments',
    sectorDescription:
      'Sri Durga Chilli Foods cleans, dries, grinds and packs red chilli, turmeric and coriander into branded spice powders sold to Guntur kirana shops, hostels and caterers.',
  },
  step3: {
    geography:
      'Unit is on the Prathipadu to Guntur road, 28 km from the Guntur Mirchi Yard, with 3-phase power and a tar road; the market catchment covers Guntur, Palnadu and Krishna districts.',
  },
  step4: {
    presentActivities:
      'Existing hand-fed grinding line of 60 kg/day will be replaced by a 150 kg/day mechanised line with destalker, cooled pulveriser, blender and pouch packing so that the unit meets FSSAI hygiene norms.',
    yearOfEstablishment: '2021-08-02',
    commitmentDate: '2026-12-01',
    technologyLevel: 'Semi-automatic, single shift, hygienic pouch packing',
    productionCapacity: '150 kg/day',
    productMix: [
      { name: 'Red chilli powder', sharePercent: 55, sellingPrice: 280 },
      { name: 'Turmeric powder', sharePercent: 20, sellingPrice: 220 },
      { name: 'Coriander powder', sharePercent: 15, sellingPrice: 190 },
      { name: 'Sambar masala', sharePercent: 10, sellingPrice: 340 },
    ],
  },
  step6: {
    targetMarket:
      'Kirana shops and supermarket shelves in Guntur, Tenali and Narasaraopet, hostels, hotels and caterers, weekly orders from two Vijayawada wholesalers, and online sales under the Durga brand.',
    existingDemand:
      'Spice demand is steady all year; existing customers already ask for 250 g packs that the old line cannot supply, and 14 repeat buyers place monthly orders.',
  },
  step10: {
    name: 'Rented processing shed of 2,400 sq ft with attached dry room, Industrial Road, Prathipadu',
    landDetails:
      'Shed taken on a registered 9-year lease from Sri K. Venkata Rao at Rs 18,000 per month; the lease runs beyond the 5-year loan period.',
  },
  step11: {
    spvName: 'Kommineni Bhavani (Proprietor), Sri Durga Chilli Foods',
    legalStatus: 'Sole proprietorship',
    gstin: '37BKQPK7316D1ZZ',
    firmPan: 'AAFFS4521K',
    udyamNumber: 'UDYAM-AP-10-0048215',
    applicantMobile: '9849062318',
    address: 'D.No. 3-118, Industrial Road, Prathipadu, Guntur District, Andhra Pradesh - 522019',
  },
  step12: {
    machineryItems: [
      { description: 'Chilli cleaning and destalking machine', condition: 'new', supplier: 'Sri Sai Agro Engineers, Guntur', quantity: 1, unitCost: 1.4 },
      { description: 'Cooled pulveriser, 20 HP with cyclone', condition: 'new', supplier: 'Sri Sai Agro Engineers, Guntur', quantity: 1, unitCost: 2.35 },
      { description: 'Ribbon blender, 100 kg', condition: 'new', supplier: 'Venkateswara Food Machinery, Vijayawada', quantity: 1, unitCost: 1.15 },
      { description: 'Vibro sifter, 24 inch', condition: 'new', supplier: 'Venkateswara Food Machinery, Vijayawada', quantity: 1, unitCost: 0.65 },
      { description: 'Semi-automatic pouch filling and sealing machine', condition: 'new', supplier: 'Sri Lakshmi Packaging Machines, Hyderabad', quantity: 1, unitCost: 1.3 },
      { description: 'Electronic platform scale, 100 kg', condition: 'new', supplier: 'Balaji Weighing Systems, Guntur', quantity: 2, unitCost: 0.12 },
      { description: 'Electric tray dryer, 48 tray', condition: 'new', supplier: 'Venkateswara Food Machinery, Vijayawada', quantity: 1, unitCost: 0.91 },
    ],
    machinery: 8,
    land: 0.3,
    building: 1.2,
    utilitiesAndInfrastructure: 0.8,
    preliminaryAndPreOperative: 0.5,
    workingCapitalMargin: 4.2,
  },
  step13: {
    bankName: 'State Bank of India, Prathipadu branch',
    interestRate: 10.5,
    moratoriumMonths: 6,
    loanTenureMonths: 60,
    spvContribution: 2.25,
    governmentGrant: 5.25,
    bankLoan: 7.25,
    otherSources: 0.25,
  },
  step14: {
    rawMaterialItems: [
      { name: 'Dry red chilli (Teja and 334)', use: 'Main raw material for chilli powder', basis: 'Cash purchase at Guntur Mirchi Yard, about 60 days of stock in season' },
      { name: 'Turmeric fingers', use: 'Turmeric powder', basis: 'Monthly rate from Duggirala growers' },
      { name: 'Coriander seed', use: 'Coriander powder and sambar masala', basis: 'Quarterly lots on contract with a Kurnool dealer' },
      { name: 'Laminated pouches and cartons', use: 'Packing', basis: 'Monthly order from a Hyderabad packaging supplier' },
    ],
    staffRoles: [
      { role: 'Supervisor-cum-operator', count: 1, monthlyPay: 14000 },
      { role: 'Machine operator', count: 1, monthlyPay: 12000 },
      { role: 'Helper and packer', count: 3, monthlyPay: 9000 },
      { role: 'Sales and dispatch assistant', count: 1, monthlyPay: 11000 },
    ],
    rawMaterialCost: 48.5,
    powerCost: 2.4,
    wages: 7.68,
    maintenance: 0.9,
    administrativeExpenses: 1.5,
    marketingExpenses: 2.4,
    annualProductionVolume: 27000,
    annualSalesRealization: 70.34,
  },
  step15: {
    yearProjections: [
      { year: 1, sales: 70.34, rm: 48.5, wages: 7.68, power: 2.4, netProfit: 3.49 },
      { year: 2, sales: 73.86, rm: 50.93, wages: 8.06, power: 2.52, netProfit: 4.0 },
      { year: 3, sales: 77.55, rm: 53.47, wages: 8.47, power: 2.65, netProfit: 4.51 },
      { year: 4, sales: 81.43, rm: 56.14, wages: 8.89, power: 2.78, netProfit: 5.05 },
      { year: 5, sales: 85.5, rm: 58.95, wages: 9.34, power: 2.92, netProfit: 5.6 },
    ],
    breakEvenPoint: 38.5,
  },
  step16: {
    startDate: '2027-02-15',
    milestones: [
      { activity: 'Machinery order and advance payment', timeRequired: '', startDate: '2026-12-01', endDate: '2026-12-15' },
      { activity: 'Shed civil works and power load enhancement', timeRequired: '', startDate: '2026-12-10', endDate: '2027-01-15' },
      { activity: 'Installation, trial run and FSSAI inspection', timeRequired: '', startDate: '2027-01-20', endDate: '2027-02-10' },
    ],
  },
  step17: {
    employmentGeneration: 6,
    impactNote:
      'The upgrade formalises a 6-person spice unit under FSSAI, gives 40 chilli growers in Prathipadu a steady buyer and brings branded Guntur chilli powder to local shelves.',
  },
  schemeExtras: {
    businessKind: 'manufacturing',
    unitStage: 'existing',
    odopAligned: 'yes',
    fssai: 'yes',
    entrepreneurName: 'Kommineni Bhavani',
    entrepreneurAge: '38',
    existingTurnover: '36.5',
    processOfManufacture:
      'Dry chillies are bought at the Guntur yard, cleaned and destalked, tray dried to 10% moisture, ground in the cooled pulveriser, sieved, blended to colour and pungency grade, packed in 100 g, 250 g and 1 kg laminated pouches, batch-coded and held in the dry room before dispatch.',
    installedCapacity: '150 kg/day',
    capacityUtilisationY1: '60',
    proposedWorkers: '6',
    rawMaterialSources:
      'Dry red chillies (Teja and 334 varieties) from the Guntur Mirchi Yard and two farmer producer groups at Prathipadu and Vinukonda; turmeric from Duggirala growers; coriander from Kurnool dealers on contract.',
    premisesType: 'leased',
    powerRequirement: '35 HP connected load (26 kW), 3-phase',
    directEmployment: '6',
    indirectEmployment: '15',
    impactNote:
      'The upgrade formalises a 6-person spice unit under FSSAI, gives 40 chilli growers in Prathipadu a steady buyer and brings branded Guntur chilli powder to local shelves.',
  },
};
export default sample;
