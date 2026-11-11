// Deviations from QA doc: GSTIN filled (37AAHFK4821M1Z5, matches firm PAN) because the form counts it as an asked question; QA doc leaves it blank.
// Also: grant and other sources are the string "0.00" instead of 0 (progress counting ignores a bare 0, so the step would show 6/8).
import type { SampleData } from './types';

const sample: SampleData = {
  step1: {
    unitName: 'Araku Hills Coffee Roasters',
    clusterName: 'Araku Hills Coffee Roasters',
    district: 'Alluri Sitharama Raju',
    location: 'Araku Valley',
    natureOfBusiness: 'Roasting and grinding of Araku green coffee beans with pouch packing',
    majorProducts: 'Araku roast and ground coffee in 250 g and 500 g pouches',
  },
  step2: {
    sectorType: 'Agro-based food processing (coffee)',
    sectorDescription:
      'Araku coffee roasting and grinding unit that buys beans from tribal farmer groups and sells packed ground coffee to cooperative outlets, hotels, homestays and online buyers.',
  },
  step3: {
    geography:
      'Unit is at Araku Valley town on the Visakhapatnam-Araku road, about 115 km from Visakhapatnam. Coffee-growing villages of Araku and Ananthagiri mandals lie within 30 km. Weekly tribal market, tourist footfall and GCC retail outlets are within 2 km.',
  },
  step4: {
    presentActivities:
      'Proposed unit: roast 5 kg batches of green coffee in a drum roaster, grind in a 1 HP pulveriser, weigh and heat-seal into 250 g and 500 g pouches. Two women employed.',
    yearOfEstablishment: '2026-11-02',
    commitmentDate: '2026-11-16',
    technologyLevel: 'Semi-automatic small drum roaster, 1 HP pulveriser, manual heat-sealing',
    productionCapacity: '5 kg per batch; about 4 kg roasted coffee per hour; 1,200 kg per year',
    productMix: [
      { name: 'Araku roast and ground coffee, 250 g pouch', sharePercent: 60, sellingPrice: 275 },
      { name: 'Araku roast and ground coffee, 500 g pouch', sharePercent: 40, sellingPrice: 520 },
    ],
  },
  step6: {
    targetMarket:
      "Tourists and local families at Araku Valley, GCC retail outlets, hotels and homestays at Araku, and online customers through the farmers' producer group page.",
    existingDemand:
      'About 4 lakh tourists visit Araku every year. GCC outlets and three hotels have indicated a purchase of 150 kg a month; about 40 online enquiries a month.',
  },
  step10: {
    name: 'Rented roasting shed, Bus Stand Road, Araku Valley',
    landDetails:
      'Rented shed of 400 sq ft at Rs 6,000 per month on a 5-year rent agreement from Sri Killo Ramu; 3-phase power connection available.',
    powerRequirements: '6 kW',
  },
  step11: {
    spvName: 'Killo Sunitha',
    legalStatus: 'Sole proprietorship',
    address:
      'Door No. 4-17, Bus Stand Road, Araku Valley, Araku mandal, Alluri Sitharama Raju district, Andhra Pradesh - 531149',
    gstin: '37AAHFK4821M1Z5',
    firmPan: 'AAHFK4821M',
    udyamNumber: 'UDYAM-AP-01-0052764',
    applicantMobile: '9440218763',
  },
  step12: {
    machinery: 2.9,
    workingCapitalMargin: 1.5,
    machineryItems: [
      { description: 'Drum coffee roaster, 5 kg per batch, LPG fired', condition: 'new', supplier: 'Sri Ganesh Agro Engineering, Visakhapatnam', quantity: 1, unitCost: 1.85 },
      { description: 'Coffee grinder / pulveriser, 1 HP', condition: 'new', supplier: 'Sri Ganesh Agro Engineering, Visakhapatnam', quantity: 1, unitCost: 0.62 },
      { description: 'Pouch heat-sealing machine, 300 mm', condition: 'new', supplier: 'Vijaya Packaging Machines, Vijayawada', quantity: 1, unitCost: 0.28 },
      { description: 'Digital weighing scale, 30 kg', condition: 'new', supplier: 'Vijaya Packaging Machines, Vijayawada', quantity: 2, unitCost: 0.075 },
    ],
  },
  step13: {
    spvContribution: 1.5,
    governmentGrant: '0.00',
    bankLoan: 2.9,
    otherSources: '0.00',
    bankName: 'State Bank of India, Araku Valley branch',
    interestRate: 10.5,
    moratoriumMonths: 3,
    loanTenureMonths: 60,
  },
  step14: {
    rawMaterialCost: 7.32,
    powerCost: 0.24,
    wages: 1.8,
    maintenance: 0.12,
    administrativeExpenses: 0.9,
    marketingExpenses: 0.4,
    annualProductionVolume: 1200,
    annualSalesRealization: 12.9,
    rawMaterialItems: [
      { name: 'Green Araku coffee beans (parchment-processed)', use: 'Roasting and grinding', basis: 'Directly from farmer groups at Rs 480 per kg in lots of 200 kg' },
      { name: 'Laminated zip pouches, 250 g and 500 g', use: 'Packing', basis: '5,000 pieces per order from a Visakhapatnam supplier' },
    ],
    staffRoles: [
      { role: 'Roaster-cum-operator', count: 1, monthlyPay: 9000 },
      { role: 'Packing helper', count: 1, monthlyPay: 6000 },
    ],
  },
  schemeExtras: {
    businessKind: 'manufacturing',
    incubatorName: 'Paderu Livelihood Business Incubator (LBI), Girijan Cooperative Corporation',
    premisesType: 'rented',
    entrepreneurName: 'Killo Sunitha',
    entrepreneurAge: '31',
    innovationBrief:
      'Women-led micro unit that buys parchment-grade Araku coffee beans directly from 40 Girijan farmer families, roasts them in small batches and sells ground coffee in branded pouches through tribal cooperative outlets, tourist shops and online, so that the farmers earn the value-addition margin that now goes to traders.',
    livelihoodFocus:
      'Women-led micro unit that buys parchment-grade Araku coffee beans directly from 40 Girijan farmer families, roasts them in small batches and sells ground coffee in branded pouches through tribal cooperative outlets, tourist shops and online, so that the farmers earn the value-addition margin that now goes to traders.',
  },
};
export default sample;
