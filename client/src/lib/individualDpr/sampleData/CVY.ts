// Deviations from QA doc:
// - Land (QA: 0), government grant (QA: 0) and other sources (QA: 0) are the string "0.00" instead of 0, because progress counting ignores a bare 0 and the steps would show as incomplete.
import type { SampleData } from './types';

const sample: SampleData = {
  step1: {
    unitName: 'Sri Satya Sai Coir Industries',
    clusterName: 'Sri Satya Sai Coir Industries',
    district: 'Dr. B.R. Ambedkar Konaseema',
    location: 'Amalapuram',
    natureOfBusiness: 'Spinning of 2-ply coir yarn from white coir fibre',
    majorProducts: '2-ply coir yarn and short coir fibre',
  },
  step2: {
    sectorType: 'Coir and coconut-based industry',
    sectorDescription:
      'Spinning of 2-ply coir yarn from white coir fibre bought from Konaseema coconut growers; the yarn is sold to coir mat and rope makers and traders in East Godavari and Krishna districts.',
  },
  step3: {
    geography:
      'Unit is on Mummidivaram Road coir estate, Amalapuram, in the middle of the Konaseema coconut belt; fibre extraction units within 15 km; NH-216 and Amalapuram bus stand 3 km; coir traders at Mandapeta and Kakinada within 60 km.',
  },
  step4: {
    presentActivities:
      'Proposed unit with two motorised spinning machines, a fibre willowing machine and a winding machine; 4 workers; yarn sold in 5 kg bundles.',
    yearOfEstablishment: '2026-12-01',
    commitmentDate: '2026-12-14',
    technologyLevel: 'Motorised spinning, mechanical willowing, manual bundling',
    productionCapacity: '200 kg yarn per day, 300 days, 60 tonnes a year; 70% use in year 1 (42 tonnes)',
    productMix: [
      { name: '2-ply coir yarn, per kg', sharePercent: 90, sellingPrice: 56 },
      { name: 'Short coir fibre, per kg', sharePercent: 10, sellingPrice: 22 },
    ],
  },
  step6: {
    targetMarket:
      'Coir mat and rope manufacturers (through traders at Mandapeta and Kakinada) and local mat makers in Konaseema; yarn sold in 5 kg bundles on 15-day credit.',
    existingDemand:
      'Two Mandapeta traders have offered to take 20 tonnes a year; local mat units need about 25 tonnes; coir yarn demand rises before the March export season.',
  },
  step10: {
    name: 'Own workshed, Plot No. 21, Coir Estate Road, Amalapuram',
    landDetails:
      'Own plot of 600 sq yards; new workshed of 1,500 sq ft to be built; 3-phase power connection of 15 HP applied for.',
    powerRequirements: '15 HP',
  },
  step11: {
    spvName: 'Sri Satya Sai Coir Industries',
    legalStatus: 'Sole proprietorship',
    address:
      'Plot No. 21, Coir Estate Road, Mummidivaram Road, Amalapuram, Dr. B.R. Ambedkar Konaseema district, Andhra Pradesh - 533201',
    gstin: '37AAGFC7264K1Z2',
    firmPan: 'AAGFC7264K',
    udyamNumber: 'UDYAM-AP-07-0063148',
    applicantMobile: '9704582913',
  },
  step12: {
    land: '0.00',
    building: 4.5,
    utilitiesAndInfrastructure: 0.35,
    preliminaryAndPreOperative: 0.4,
    machinery: 7.15,
    workingCapitalMargin: 3.6,
    machineryItems: [
      { description: 'Motorised coir yarn spinning machine, 2-ply, 10 spindles', condition: 'new', supplier: 'Kerala Coir Machinery Co., Alappuzha', quantity: 2, unitCost: 1.65 },
      { description: 'Coir fibre willowing and cleaning machine', condition: 'new', supplier: 'Kerala Coir Machinery Co., Alappuzha', quantity: 1, unitCost: 2.4 },
      { description: 'Yarn winding and bundling machine', condition: 'new', supplier: 'Sri Lakshmi Engineering Works, Rajahmundry', quantity: 1, unitCost: 0.85 },
      { description: '7.5 HP motor with starter panel', condition: 'new', supplier: 'Sri Lakshmi Engineering Works, Rajahmundry', quantity: 1, unitCost: 0.6 },
    ],
  },
  step13: {
    spvContribution: 6.0,
    governmentGrant: '0.00',
    bankLoan: 10.0,
    otherSources: '0.00',
    bankName: 'Andhra Pradesh Grameena Vikas Bank, Amalapuram branch',
    interestRate: 10.75,
    moratoriumMonths: 6,
    loanTenureMonths: 72,
  },
  step14: {
    rawMaterialCost: 11.59,
    powerCost: 0.96,
    wages: 4.32,
    maintenance: 0.35,
    administrativeExpenses: 0.6,
    marketingExpenses: 0.5,
    annualProductionVolume: 42000,
    annualSalesRealization: 22.09,
    rawMaterialItems: [
      { name: 'White coconut husk fibre', use: 'Spinning into yarn', basis: 'From Konaseema fibre extraction units at Rs 24 per kg, 5-tonne lots, weekly' },
      { name: 'Jute twine and bundle labels', use: 'Bundling', basis: 'From Amalapuram stationers, monthly' },
    ],
    staffRoles: [
      { role: 'Machine operator', count: 2, monthlyPay: 10000 },
      { role: 'Helper', count: 2, monthlyPay: 8000 },
    ],
  },
  step15: {
    yearProjections: [
      { year: 1, sales: 22.09, rm: 11.59, wages: 4.32, power: 0.96, netProfit: 1.2 },
      { year: 2, sales: 25.4, rm: 13.3, wages: 4.54, power: 1.03, netProfit: 1.95 },
      { year: 3, sales: 28.2, rm: 14.7, wages: 4.76, power: 1.1, netProfit: 2.6 },
      { year: 4, sales: 30.5, rm: 15.8, wages: 5.0, power: 1.16, netProfit: 3.05 },
      { year: 5, sales: 32.0, rm: 16.6, wages: 5.25, power: 1.22, netProfit: 3.4 },
    ],
    breakEvenPoint: 42,
  },
  schemeExtras: {
    businessKind: 'manufacturing',
    coirProductLine: '2-ply spun coir yarn from white fibre',
    coirBoardStatus: 'applied',
    premisesType: 'own',
    entrepreneurName: 'Kommuri Satyanarayana',
  },
};
export default sample;
