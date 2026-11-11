/**
 * Sample answers for PM Vishwakarma, first tranche (QA doc section 7). Keys are CONTENT steps (store buckets). Uploads stay manual.
 * Deviations from QA doc:
 *  (1) Other sources and moratorium are the text '0.00' instead of the number 0, because the completeness check
 *      treats a bare numeric 0 as unanswered (they still add up as 0).
 *  (2) GSTIN and Firm PAN are filled (QA doc leaves them blank) so the Applicant step counts as fully answered; they are
 *      made-up values with a valid GSTIN check character and a firm-type PAN. Clear them if not wanted.
 *  (3) Residual NOTE kept on purpose: 'unusual loan.rate 5' (data check flags rates under 6%). 5% is the real PM Vishwakarma
 *      concessional rate and the QA doc value, so it was not changed to silence the note.
 */
import type { SampleData } from './types';

const sample: SampleData = {
  step1: {
    unitName: 'Sri Venkateswara Etikoppaka Toys',
    clusterName: 'Sri Venkateswara Etikoppaka Toys',
    district: 'Anakapalli',
    location: 'Yelamanchili',
    natureOfBusiness: 'Traditional Etikoppaka lacquer-turned wooden toys and dolls making',
    majorProducts: 'Lacquered toy sets, dolls, pen stands and kitchen play sets',
  },
  step2: {
    sectorType: 'Traditional craft - lacquered wooden toys (Doll & Toy Maker)',
    sectorDescription:
      'Gopala Krishna turns and lacquers wooden toys and dolls in the traditional Etikoppaka style, a Geographical Indication craft of Yelamanchili mandal, and sells them to craft emporia, tourist shops and online buyers.',
  },
  step3: {
    geography:
      'Workshop is in Etikoppaka village, Yelamanchili mandal, about 55 km from Visakhapatnam. Buyers are craft emporia in Visakhapatnam and Vijayawada, tourist shops at Araku and the beach road, and online customers.',
  },
  step4: {
    presentActivities:
      'Practising artisan making about 20 toy pieces a day on a hand lathe with two helpers; the toolkit and loan will add an electric lathe, bandsaw and sanders to raise quality and speed.',
    yearOfEstablishment: '2004-06-01',
    commitmentDate: '2026-11-25',
    technologyLevel: 'Traditional hand lathe, moving to electric lathe and bandsaw',
    productionCapacity: 'About 20 toy pieces a day (one artisan and two helpers)',
    productMix: [
      { name: 'Lacquer toy set (6 pieces)', sharePercent: 40, sellingPrice: 175 },
      { name: 'Lacquered doll', sharePercent: 35, sellingPrice: 70 },
      { name: 'Kitchen play set and pen stand', sharePercent: 25, sellingPrice: 60 },
    ],
  },
  step6: {
    targetMarket:
      'State handicraft emporia (Lepakshi outlets), tourist gift shops, schools and online buyers who want non-toxic traditional toys.',
    existingDemand:
      'Orders rise from October to January (festival and tourist season); an emporia buyer in Visakhapatnam already orders 300 sets every quarter.',
  },
  step10: {
    name: 'Home-cum-workshop, Etikoppaka village',
    landDetails: 'Own family house with a 400 sq ft workshed attached; no rent.',
    powerRequirements: '3 kW, domestic-plus-workshop connection',
  },
  step11: {
    spvName: 'Sri Venkateswara Etikoppaka Toys (Prop. Chintala Gopala Krishna)',
    legalStatus: 'Sole proprietor (artisan)',
    gstin: '37AAFFC7392H1Z5',
    firmPan: 'AAFFC7392H',
    udyamNumber: 'UDYAM-AP-02-0013356',
    applicantMobile: '9490617234',
    address: 'D.No. 3-58, Etikoppaka village, Yelamanchili Mandal, Anakapalli District, Andhra Pradesh 531055',
  },
  step12: {
    machineryItems: [
      { description: 'Electric wood-turning lathe, 1 HP with chuck set', condition: 'new', supplier: 'Sri Sai Machine Tools, Visakhapatnam', quantity: 1, unitCost: 0.48 },
      { description: 'Bandsaw, 14 inch', condition: 'new', supplier: 'Sri Sai Machine Tools, Visakhapatnam', quantity: 1, unitCost: 0.36 },
      { description: 'Orbital and belt sander set', condition: 'new', supplier: 'Sri Sai Machine Tools, Visakhapatnam', quantity: 1, unitCost: 0.14 },
      { description: 'Lac-colour melting stove and stirring set', condition: 'new', supplier: 'Local fabricator, Etikoppaka', quantity: 1, unitCost: 0.12 },
      { description: 'Chisel, gouge and scraper toolkit (e-voucher)', condition: 'new', supplier: 'PM Vishwakarma designated centre, Anakapalli', quantity: 1, unitCost: 0.15 },
      { description: 'Dust extractor with sturdy workbench', condition: 'new', supplier: 'Sri Sai Machine Tools, Visakhapatnam', quantity: 1, unitCost: 0.25 },
    ],
    machinery: 1.5,
    workingCapitalMargin: 0.45,
  },
  step13: {
    bankName: 'Andhra Pradesh Grameena Vikas Bank, Yelamanchili Branch',
    interestRate: 5,
    moratoriumMonths: '0.00',
    loanTenureMonths: 18,
    spvContribution: 0.8,
    governmentGrant: 0.15,
    bankLoan: 1,
    otherSources: '0.00',
  },
  step14: {
    rawMaterialItems: [
      { name: 'Ankudu (Wrightia) wood blocks', use: 'Turned toy bodies', basis: 'Monthly from a Narsipatnam wood depot, cash' },
      { name: 'Natural lac sticks and vegetable dyes', use: 'Lacquer colouring and polish', basis: 'Directly from Etikoppaka lac suppliers, monthly' },
      { name: 'Cartons, paper and bubble wrap', use: 'Packing for emporia and couriers', basis: 'Quarterly from a Visakhapatnam packaging dealer' },
    ],
    staffRoles: [
      { role: 'Assistant turner', count: 1, monthlyPay: 5000 },
      { role: 'Lac-colour painter (part-time)', count: 2, monthlyPay: 1500 },
    ],
    rawMaterialCost: 2.4,
    powerCost: 0.3,
    wages: 0.96,
    maintenance: 0.12,
    administrativeExpenses: 0.24,
    marketingExpenses: 0.3,
    annualProductionVolume: 6000,
    annualSalesRealization: 6.57,
  },
  step15: {
    yearProjections: [
      { year: 1, sales: 6.57, rm: 2.4, wages: 0.96, power: 0.3, netProfit: 1.48 },
      { year: 2, sales: 6.9, rm: 2.52, wages: 1.01, power: 0.32, netProfit: 1.62 },
      { year: 3, sales: 7.24, rm: 2.65, wages: 1.06, power: 0.33, netProfit: 1.73 },
      { year: 4, sales: 7.61, rm: 2.78, wages: 1.11, power: 0.35, netProfit: 1.84 },
      { year: 5, sales: 7.99, rm: 2.92, wages: 1.17, power: 0.36, netProfit: 1.96 },
    ],
    breakEvenPoint: 49,
  },
  schemeExtras: {
    craft: 'Doll & Toy Maker (Traditional)',
    trainingStage: 'basicDone',
    loanTranche: 'first',
    priorSelfEmploymentLoan: 'no',
    entrepreneurName: 'Chintala Gopala Krishna',
    entrepreneurAge: '46',
    experienceYears: '22',
    currentTools: 'Hand-operated wooden lathe (kunda), chisels, scrapers, lac sticks and hand brushes',
    newTools:
      '1 HP electric wood-turning lathe, 14-inch bandsaw, orbital and belt sander set, lac-colour melting stove set, chisel and gouge toolkit, dust extractor with workbench',
    processOfManufacture:
      'Ankudu (Wrightia tinctoria) wood is cut into blocks and turned into toy shapes on the lathe; heated natural lac sticks are pressed against the spinning piece so the lac melts and polishes it; vegetable-dye lac colours are layered, scraped for patterns and finished by hand, then the toys are packed in cartons.',
    workplaceType: 'home',
    powerRequirement: '3 kW, domestic-plus-workshop connection',
    businessKind: 'manufacturing',
  },
};

export default sample;
