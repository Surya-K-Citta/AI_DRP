// Deviations from QA doc (a bare 0 counts as unanswered in the progress check, so three zero fields were made non-zero; project cost unchanged at 64.44):
//  - Land 0 -> 0.5 (lease advance / site charges, to be incurred) and Utilities & Infrastructure 0 -> 0.5 (electrical fittings),
//    with Building / shed 8 -> 7 (incurred 3, to be incurred 4) so the total stays 64.44.
//  - Other Sources 0 -> 0.5 with Promoter contribution 14.68 -> 14.18 (executive summary text adjusted to match).
//  - Firm PAN left blank as the QA doc says (sole proprietor has only a personal PAN, which the app refuses to store).
// The projection grid year labels are built from the same helper the form uses, so they follow today's date like the form does.
import type { SampleData } from './types';
import { cmepProjectionColumns } from '../cmepProjections';

const GRID: Record<string, number[]> = {
  sales: [16.8, 20.4, 24.3, 146.45, 163.41, 181.26, 200.03, 219.77, 226.36, 233.16, 240.15],
  rm: [9.6, 11.6, 13.8, 83.51, 93.18, 103.35, 114.06, 125.31, 129.07, 132.95, 136.93],
  wages: [3.6, 4.3, 5.1, 25.26, 26.52, 27.85, 29.24, 30.7, 32.24, 33.85, 35.54],
  power: [0.3, 0.34, 0.4, 3.36, 3.82, 4.32, 4.86, 5.45, 5.72, 6, 6.3],
  salaries: [0, 0, 0, 4.32, 4.54, 4.76, 5, 5.25, 5.51, 5.79, 6.08],
  rent: [0, 0, 0, 3, 3.15, 3.31, 3.47, 3.65, 3.83, 4.02, 4.22],
  maintenance: [0.2, 0.22, 0.25, 1.8, 1.89, 1.98, 2.08, 2.19, 2.3, 2.41, 2.53],
  admin: [0.3, 0.34, 0.4, 1.68, 1.76, 1.85, 1.94, 2.04, 2.14, 2.25, 2.36],
  interest: [0, 0, 0, 4.15, 3.74, 3.22, 2.63, 1.98, 1.26, 0.47, 0],
  depreciation: [0.3, 0.27, 0.24, 6.86, 5.88, 5.04, 4.33, 3.72, 3.19, 2.75, 2.36],
  tax: [0, 0, 0.15, 3.13, 4.73, 6.4, 8.11, 9.87, 10.28, 10.67, 10.96],
  netProfit: [2.5, 3.33, 3.96, 9.38, 14.2, 19.18, 24.31, 29.61, 30.82, 32, 32.87],
};

const columns = cmepProjectionColumns();
const yearProjections = columns.map((col, i) => {
  const row: Record<string, any> = { label: col.label, period: col.period };
  for (const key of Object.keys(GRID)) row[key] = GRID[key][i];
  return row;
});
const utilisation = [60, 65, 70, 75, 80, 80, 80, 80];
const utilisationByYear = columns
  .filter((col) => col.period === 'projected')
  .map((col, i) => ({ label: col.label, percent: utilisation[i] }));

const sample: SampleData = {
  step1: {
    unitName: 'Sri Durga Handloom Fabrics',
    clusterName: 'Sri Durga Handloom Fabrics',
    district: 'Guntur',
    location: 'Mangalagiri',
    natureOfBusiness: 'Handloom and power-assisted cotton fabric manufacturing',
    majorProducts: 'Cotton dress material, handloom sarees, dyed cotton yardage',
  },
  step2: {
    sectorType: 'Handloom and textiles – cotton fabric manufacturing',
    sectorDescription:
      'Mangalagiri in Guntur district is a well known centre for handloom cotton fabric and sarees. The unit will weave, dye and sell cotton dress material and sarees to wholesalers and boutiques.',
  },
  step3: {
    geography:
      'The unit stands in a rented 3,600 sq.ft. industrial shed on the Mangalagiri–Tadepalli road, 18 km from Guntur and 14 km from Vijayawada railway station. Yarn comes from Tirupur, Salem and Guntur dealers, and fabric is sold in the Vijayawada and Hyderabad markets.',
  },
  step4: {
    presentActivities:
      'The promoter has woven cotton fabric on three home looms since 2022 and sells through local master weavers. The new unit scales this to twelve semi-automatic looms with its own dyeing and warping.',
    yearOfEstablishment: '2026-06-15',
    commitmentDate: '2026-08-20',
    technologyLevel: 'Semi-automatic power looms with sectional warping and hank dyeing',
    productionCapacity: '360 metres of fabric per day on one shift',
    productMix: [
      { name: 'Cotton dress material', sharePercent: 55, sellingPrice: 210 },
      { name: 'Handloom-style cotton sarees (price per metre equivalent)', sharePercent: 30, sellingPrice: 260 },
      { name: 'Dyed cotton yardage', sharePercent: 15, sellingPrice: 215 },
    ],
    loomCount: 12,
    shifts: 1,
  },
  step6: {
    targetMarket: 'Wholesale textile merchants in Vijayawada and Hyderabad, saree boutiques in Guntur and school-uniform tailors.',
    existingDemand:
      'Two Vijayawada wholesalers have given written enquiries for 4,000 metres a month of cotton dress material, and boutique owners ask for dyed yardage that local weavers cannot supply regularly.',
  },
  step10: {
    name: 'Rented weaving shed, Mangalagiri',
    landDetails:
      'Rented industrial shed of 3,600 sq.ft. on a registered five-year lease from a private owner at Mangalagiri; rent ₹25,000 per month.',
    powerRequirements: '25 HP three-phase',
    workshopAreaSqft: 3600,
    productionAreaSqft: 2400,
    storageAreaSqft: 800,
    officeAreaSqft: 400,
    leaseYears: 5,
    waterAndEffluent:
      'Dyeing uses about 2,000 litres of water a day. Dye wastewater goes to a settling and neutralising tank before it is sent to the municipal drain, and only azo-free reactive dyes are used.',
  },
  step11: {
    spvName: 'Sri Durga Handloom Fabrics',
    legalStatus: 'Sole proprietorship',
    gstin: '37BKTPP4821M1ZC',
    udyamNumber: 'UDYAM-AP-11-0071538',
    applicantMobile: '9848076215',
    address: 'D.No. 5-62, Ramalayam Street, Mangalagiri, Guntur district, Andhra Pradesh – 522 503',
    promoters: [
      {
        name: 'Pothuri Naga Durga Bhavani',
        relationName: 'Pothuri Venkata Subba Rao',
        age: '38',
        dob: '1988-07-14',
        education: 'B.Com',
        experienceYears: '9',
        phone: '9849123450',
        address: 'D.No. 5-62, Ramalayam Street, Mangalagiri, Guntur district – 522 503',
      },
    ],
  },
  step12: {
    land: 0.5,
    building: 7,
    utilitiesAndInfrastructure: 0.5,
    preliminaryAndPreOperative: 1.2,
    furniture: 2,
    securityDeposits: 1.2,
    machinery: 39.04,
    workingCapitalMargin: 13,
    machineryItems: [
      { description: 'Semi-automatic power loom (60 inch)', condition: 'new', supplier: 'Sri Venkata Sai Textile Machinery, Salem', quantity: 12, unitCost: 1.5, gst: 0.27, transport: 0.03, installation: 0.05, lifeYears: 15, annualMaintenance: 0.04 },
      { description: 'Sectional warping machine', condition: 'new', supplier: 'Sri Venkata Sai Textile Machinery, Salem', quantity: 1, unitCost: 4.2, gst: 0.76, transport: 0.12, installation: 0.1, lifeYears: 15, annualMaintenance: 0.12 },
      { description: 'Pirn winding machine (12 spindle)', condition: 'new', supplier: 'Lakshmi Winding Works, Coimbatore', quantity: 2, unitCost: 0.85, gst: 0.15, transport: 0.02, installation: 0.03, lifeYears: 12, annualMaintenance: 0.05 },
      { description: 'Hank dyeing machine', condition: 'new', supplier: 'Lakshmi Winding Works, Coimbatore', quantity: 1, unitCost: 3.1, gst: 0.56, transport: 0.08, installation: 0.1, lifeYears: 12, annualMaintenance: 0.1 },
      { description: 'Hydro-extractor and yarn drying frame', condition: 'new', supplier: 'Lakshmi Winding Works, Coimbatore', quantity: 1, unitCost: 1.2, gst: 0.22, transport: 0.03, installation: 0.04, lifeYears: 10, annualMaintenance: 0.05 },
      { description: 'Diesel generator set (25 kVA)', condition: 'new', supplier: 'Kirloskar dealer, Vijayawada', quantity: 1, unitCost: 3.4, gst: 0.61, transport: 0.1, installation: 0.12, lifeYears: 15, annualMaintenance: 0.15 },
    ],
    wcRawStock: 4,
    wcWip: 1.5,
    wcFinished: 2.5,
    wcReceivables: 6,
    wcSupplierCredit: 2,
    wcCash: 1,
    costPhasing: {
      land: { incurred: 0, proposed: 0.5 },
      building: { incurred: 3, proposed: 4 },
      machinery: { incurred: 6, proposed: 33.04 },
      furniture: { incurred: 0.5, proposed: 1.5 },
      deposits: { incurred: 1.2, proposed: 0 },
      workingCapital: { incurred: 0, proposed: 13 },
    },
  },
  step13: {
    cashCreditLimit: 10,
    bankName: 'State Bank of India, Mangalagiri branch',
    interestRate: 10.5,
    moratoriumMonths: 6,
    loanTenureMonths: 84,
    subsidyPercent: 25,
    spvContribution: 14.18,
    governmentGrant: 9.76,
    bankLoan: 40,
    otherSources: 0.5,
  },
  step14: {
    capacityPerDay: 360,
    workingDays: 300,
    capacityUtilisation: 60,
    sellingPricePerUnit: 226,
    monthlyRent: 25000,
    monthlySalaries: 36000,
    monthlyPower: 28000,
    annualExpenseGrowth: 5,
    rawMaterialItems: [
      { name: 'Cotton yarn (40s and 60s count)', use: 'Warp and weft', basis: 'Bought from Salem, Tirupur and Guntur dealers with 30-day credit' },
      { name: 'Reactive dyes and chemicals', use: 'Hank dyeing', basis: 'Monthly from a Vijayawada dye dealer' },
      { name: 'Poly covers, cartons and labels', use: 'Packing', basis: 'Quarterly from a Guntur packaging supplier' },
    ],
    staffRoles: [
      { role: 'Weavers', count: 12, monthlyPay: 11500 },
      { role: 'Warping and winding operators', count: 3, monthlyPay: 11000 },
      { role: 'Dyer', count: 1, monthlyPay: 14000 },
      { role: 'Helpers', count: 3, monthlyPay: 8500 },
      { role: 'Production supervisor', count: 1, monthlyPay: 20000 },
      { role: 'Accountant and sales executive', count: 1, monthlyPay: 16000 },
    ],
    utilisationByYear,
    rawMaterialCost: 83.5,
    powerCost: 3.36,
    wages: 25.26,
    maintenance: 1.8,
    administrativeExpenses: 9,
    marketingExpenses: 3,
    annualProductionVolume: 64800,
    annualSalesRealization: 146.45,
  },
  step15: {
    yearProjections,
    breakEvenPoint: 63.55,
  },
  step16: {
    startDate: '2027-01-20',
    milestones: [
      { activity: 'Pay balance to loom supplier and install 12 looms and warping machine', startDate: '2026-10-20', endDate: '2026-12-10' },
      { activity: 'Shed renovation, 25 HP power connection and dye wastewater tank', startDate: '2026-10-25', endDate: '2026-12-05' },
      { activity: 'Trial weaving and first dispatch to Vijayawada wholesalers', startDate: '2026-12-14', endDate: '2027-01-19' },
    ],
    risks: [
      { risk: 'Cotton yarn price rise', mitigation: 'Keep 20 days of yarn stock and take fixed-rate quotes from two dealers' },
      { risk: 'Delay in loom delivery', mitigation: 'Penalty clause with the supplier and weaving on the three home looms in the meantime' },
      { risk: 'Dye wastewater compliance', mitigation: 'Settling tank built before dyeing starts; consent applied through the Single Desk portal' },
    ],
  },
  schemeExtras: {
    businessKind: 'manufacturing',
    activityBand: 'manufacturing',
    boosterCategory: 'woman',
    apDomicile: 'yes',
    entrepreneurName: 'Pothuri Naga Durga Bhavani',
    cmepArea: 'urban',
    edpStatus: 'completed',
    priorSubsidy: 'no',
    familyExclusive: 'yes',
    executiveSummary:
      'Sri Durga Handloom Fabrics is a new woman-owned manufacturing unit at Mangalagiri with 12 semi-automatic looms plus warping, winding and dyeing facilities. The project costs ₹64.44 lakh, funded by ₹14.18 lakh own money, ₹9.76 lakh subsidy, ₹0.50 lakh other sources and a ₹40.00 lakh bank term loan, and will employ 21 people.',
    processOfManufacture:
      'Cotton yarn is hank-dyed, wound on pirns, warped on the sectional warping machine and woven on the semi-automatic looms. The fabric is then inspected, folded, calendered and packed in poly covers before dispatch to wholesale buyers.',
  },
};

export default sample;
