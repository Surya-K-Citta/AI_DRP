/** HTML date inputs only accept YYYY-MM-DD. */
import {
  normalizeCostPhasing,
  normalizeMachineryItems,
  normalizeProductMix,
  normalizePromoters,
  normalizeRawMaterials,
  normalizeRisks,
  normalizeStaffRoles,
  normalizeUtilisationYears,
} from '@/lib/individualDpr/cmepBankPack';
export function toDateInputValue(value: unknown): string {
  if (value == null || value === '') return '';
  if (typeof value === 'number' && Number.isFinite(value)) return '';
  const text = String(value).trim();

  const iso = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = text.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }

  // Month YYYY / January 2026
  const monthYear = text.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{4})\b/i
  );
  if (monthYear) {
    const months: Record<string, string> = {
      jan: '01',
      january: '01',
      feb: '02',
      february: '02',
      mar: '03',
      march: '03',
      apr: '04',
      april: '04',
      may: '05',
      jun: '06',
      june: '06',
      jul: '07',
      july: '07',
      aug: '08',
      august: '08',
      sep: '09',
      sept: '09',
      september: '09',
      oct: '10',
      october: '10',
      nov: '11',
      november: '11',
      dec: '12',
      december: '12',
    };
    const m = months[monthYear[1].toLowerCase()];
    if (m) return `${monthYear[2]}-${m}-01`;
  }

  return '';
}

function extractDatesFromText(text: string): string[] {
  const out: string[] = [];
  const isoAll = text.matchAll(/(\d{4}-\d{1,2}-\d{1,2})/g);
  for (const m of isoAll) {
    const v = toDateInputValue(m[1]);
    if (v) out.push(v);
  }
  const dmyAll = text.matchAll(/(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4})/g);
  for (const m of dmyAll) {
    const v = toDateInputValue(m[1]);
    if (v) out.push(v);
  }
  return out;
}

export function normalizeMilestones(value: unknown): Array<{
  activity: string;
  timeRequired: string;
  startDate: string;
  endDate: string;
}> {
  if (typeof value === 'string') {
    return parseMilestonesFromText(value);
  }
  if (!Array.isArray(value) || value.length === 0) return [];

  return value
    .map((item) => {
      if (typeof item === 'string') {
        const dates = extractDatesFromText(item);
        const activity =
          item
            .replace(/\s*by\s*\d{4}-\d{2}-\d{2}/gi, '')
            .replace(/\s*\(\d{4}-\d{2}-\d{2}\)/g, '')
            .replace(/\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4}/g, '')
            .replace(/\d{4}-\d{1,2}-\d{1,2}/g, '')
            .replace(/^[\s\-–—:•*]+|[\s\-–—:•*]+$/g, '')
            .trim() || item;
        return {
          activity,
          timeRequired: '',
          startDate: dates[0] || '',
          endDate: dates[1] || dates[0] || '',
        };
      }
      const row = item && typeof item === 'object' ? item : {};
      return {
        activity: String(row.activity || row.name || row.task || row.milestone || ''),
        timeRequired: String(row.timeRequired || row.duration || ''),
        startDate: toDateInputValue(row.startDate || row.start || row.from),
        endDate: toDateInputValue(row.endDate || row.end || row.to),
      };
    })
    .filter((row) => row.activity.trim() || row.startDate || row.endDate);
}

function parseMilestonesFromText(text: string): Array<{
  activity: string;
  timeRequired: string;
  startDate: string;
  endDate: string;
}> {
  const json = firstJsonArray(text);
  if (json?.length) return normalizeMilestones(json);

  const lines = text
    .split(/\n|;/)
    .map((l) => l.replace(/^[\s\-–—•*\d.)]+/, '').trim())
    .filter((l) => l.length > 3);

  const rows = lines
    .map((line) => {
      const dates = extractDatesFromText(line);
      const activity = line
        .replace(/\d{4}-\d{1,2}-\d{1,2}/g, '')
        .replace(/\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4}/g, '')
        .replace(/\bfrom\b|\bto\b|\buntil\b/gi, ' ')
        .replace(/\s{2,}/g, ' ')
        .replace(/^[\s\-–—:]+|[\s\-–—:]+$/g, '')
        .trim();
      if (!activity && !dates.length) return null;
      return {
        activity: activity || 'Activity',
        timeRequired: '',
        startDate: dates[0] || '',
        endDate: dates[1] || dates[0] || '',
      };
    })
    .filter(Boolean) as Array<{
    activity: string;
    timeRequired: string;
    startDate: string;
    endDate: string;
  }>;

  return rows;
}

function rowNumber(...candidates: unknown[]): number {
  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c)) return c;
    if (c == null || c === '') continue;
    const n = asNumber(String(c));
    if (n != null) return n;
  }
  return 0;
}

function normalizeYearProjections(value: unknown): Array<{
  year: number;
  sales: number;
  rm: number;
  wages: number;
  power: number;
  netProfit: number;
}> {
  if (typeof value === 'string') {
    return parseYearProjectionsFromText(value);
  }
  if (!Array.isArray(value) || value.length === 0) return [];
  return value.map((item, index) => {
    const row = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    return {
      year: rowNumber(row.year, index + 1) || index + 1,
      sales: rowNumber(row.sales, row.revenue, row.Sales),
      rm: rowNumber(row.rm, row.rawMaterial, row.rawMaterialCost, row.RM, row.expenses),
      wages: rowNumber(row.wages, row.Wages, row.labour, row.labor),
      power: rowNumber(row.power, row.Power, row.powerCost, row.electricity),
      netProfit: rowNumber(row.netProfit, row.profit, row.NetProfit, row.net_profit),
    };
  });
}

function parseYearProjectionsFromText(text: string): Array<{
  year: number;
  sales: number;
  rm: number;
  wages: number;
  power: number;
  netProfit: number;
}> {
  const json = firstJsonArray(text);
  if (json?.length) return normalizeYearProjections(json);

  // Lines like: Year 1: sales 15, rm 8, wages 2, power 1, profit 3
  const lineRows: Array<{
    year: number;
    sales: number;
    rm: number;
    wages: number;
    power: number;
    netProfit: number;
  }> = [];
  const lineRe =
    /(?:year\s*)?(\d{1,4})\s*[:\-|]?\s*(?:sales|revenue)?\s*[:=]?\s*([\d.]+)?[^\d\n]*(?:rm|raw)?\s*[:=]?\s*([\d.]+)?[^\d\n]*(?:wages|labour|labor)?\s*[:=]?\s*([\d.]+)?[^\d\n]*(?:power|electricity)?\s*[:=]?\s*([\d.]+)?[^\d\n]*(?:net\s*profit|profit)?\s*[:=]?\s*([\d.]+)?/gi;

  let match: RegExpExecArray | null;
  while ((match = lineRe.exec(text)) !== null) {
    const nums = match.slice(2).map((x) => (x != null && x !== '' ? parseFloat(x) : NaN));
    if (nums.every((n) => !Number.isFinite(n))) continue;
    lineRows.push({
      year: parseInt(match[1], 10) || lineRows.length + 1,
      sales: Number.isFinite(nums[0]) ? nums[0] : 0,
      rm: Number.isFinite(nums[1]) ? nums[1] : 0,
      wages: Number.isFinite(nums[2]) ? nums[2] : 0,
      power: Number.isFinite(nums[3]) ? nums[3] : 0,
      netProfit: Number.isFinite(nums[4]) ? nums[4] : 0,
    });
  }
  if (lineRows.length) return lineRows;

  // Fallback: collect groups of 5+ numbers per row-ish split
  const numberLines = text
    .split(/\n/)
    .map((l) => (l.match(/-?\d+(?:\.\d+)?/g) || []).map((n) => parseFloat(n)))
    .filter((nums) => nums.length >= 4);
  return numberLines.map((nums, index) => {
    // If first number looks like a year (1-5 or 20xx), treat as year
    const hasYear = nums[0] >= 1 && (nums[0] <= 10 || nums[0] >= 2000);
    const offset = hasYear ? 1 : 0;
    return {
      year: hasYear ? nums[0] : index + 1,
      sales: nums[offset] || 0,
      rm: nums[offset + 1] || 0,
      wages: nums[offset + 2] || 0,
      power: nums[offset + 3] || 0,
      netProfit: nums[offset + 4] || 0,
    };
  });
}

/** An essay that merely mentions a list should stay prose. A bare JSON array is the answer. */
function proseAroundJson(text: string): boolean {
  const start = text.indexOf('[');
  if (start < 0) return false;
  let depth = 0;
  let end = -1;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '[') depth++;
    else if (text[i] === ']') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end < 0) return false;
  const rest = `${text.slice(0, start)} ${text.slice(end + 1)}`.replace(/\s+/g, ' ').trim();
  return rest.split(' ').filter(Boolean).length > 12;
}

function firstJsonArray(text: string): any[] | null {
  const start = text.indexOf('[');
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '[') depth++;
    else if (text[i] === ']') {
      depth--;
      if (depth === 0) {
        try {
          const parsed = JSON.parse(text.slice(start, i + 1));
          return Array.isArray(parsed) ? parsed : null;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function firstJsonObject(text: string): Record<string, any> | null {
  const start = text.indexOf('{');
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) {
        try {
          const parsed = JSON.parse(text.slice(start, i + 1));
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function asNumber(text: string): number | null {
  // Prefer patterns like "15 Lakhs", "₹10.5 L", then first plain number
  const lakh = text.match(
    /(?:₹\s*)?(-?\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lacs?|l)\b/i
  );
  if (lakh) {
    const num = parseFloat(lakh[1]);
    return Number.isFinite(num) ? num : null;
  }
  const match = text.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const num = parseFloat(match[0]);
  return Number.isFinite(num) ? num : null;
}

/** Fields that must store a number in the Latest / cluster form. */
const NUMERIC_DPR_FIELDS = new Set([
  'yearOfEstablishment',
  'yearOfIncorporation',
  'land',
  'building',
  'machinery',
  'utilitiesAndInfrastructure',
  'preliminaryAndPreOperative',
  'workingCapitalMargin',
  'spvContribution',
  'governmentGrant',
  'bankLoan',
  'otherSources',
  'rawMaterialCost',
  'powerCost',
  'wages',
  'maintenance',
  'administrativeExpenses',
  'marketingExpenses',
  'annualProductionVolume',
  'annualSalesRealization',
  'breakEvenPoint',
  'irr',
  'npv',
  'employmentGeneration',
  'turnoverGrowth',
  'exportGrowth',
  'incomeEnhancement',
  'sellingPrice',
  'capacityUtilisationY1',
  'entrepreneurAge',
  'dailySales',
  'yearsVending',
  'yearsPractising',
  'investmentPerUnit',
  'turnoverPerUnit',
  'increaseInUnits',
  'indirectEmployment',
  'furniture',
  'securityDeposits',
  'cashCreditLimit',
  'interestRate',
  'moratoriumMonths',
  'loanTenureMonths',
  'subsidyPercent',
  'capacityPerDay',
  'workingDays',
  'capacityUtilisation',
  'sellingPricePerUnit',
  'monthlyRent',
  'monthlySalaries',
  'monthlyPower',
  'annualExpenseGrowth',
  'loomCount',
  'shifts',
  'workshopAreaSqft',
  'productionAreaSqft',
  'storageAreaSqft',
  'officeAreaSqft',
  'leaseYears',
  'wcRawStock',
  'wcWip',
  'wcFinished',
  'wcReceivables',
  'wcSupplierCredit',
  'wcCash',
]);

export function isNumericDprField(field: string): boolean {
  return NUMERIC_DPR_FIELDS.has(field);
}

const STRUCTURED_LIST_FIELDS = new Set([
  'yearProjections',
  'milestones',
  'promoters',
  'machineryItems',
  'costPhasing',
  'productMix',
  'rawMaterialItems',
  'staffRoles',
  'risks',
  'utilisationByYear',
]);

export function isStructuredDprField(field: string): boolean {
  return STRUCTURED_LIST_FIELDS.has(field);
}

/** Turn an AI suggestion string into a form field value without a second API call. */
export function suggestionToFieldValue(field: string, suggestion: unknown): any {
  if (suggestion == null) return null;
  if (typeof suggestion !== 'string') {
    if (field === 'milestones') {
      const rows = normalizeMilestones(suggestion);
      return rows.length ? rows : null;
    }
    if (field === 'yearProjections') {
      const rows = normalizeYearProjections(suggestion);
      return rows.length ? rows : null;
    }
    if (field === 'promoters') return normalizePromoters(suggestion);
    if (field === 'machineryItems') return normalizeMachineryItems(suggestion);
    if (field === 'costPhasing') return normalizeCostPhasing(suggestion);
    if (field === 'productMix') return normalizeProductMix(suggestion);
    if (field === 'rawMaterialItems') return normalizeRawMaterials(suggestion);
    if (field === 'staffRoles') return normalizeStaffRoles(suggestion);
    if (field === 'risks') return normalizeRisks(suggestion);
    if (field === 'utilisationByYear') return normalizeUtilisationYears(suggestion);
    if (field === 'startDate' || field === 'endDate' || field === 'commitmentDate') return toDateInputValue(suggestion) || null;
    if (field === 'yearOfEstablishment' && /\d{4}-\d{1,2}-\d{1,2}/.test(String(suggestion))) {
      return toDateInputValue(suggestion) || null;
    }
    if (isNumericDprField(field)) {
      const n = Number(suggestion);
      return Number.isFinite(n) ? n : asNumber(String(suggestion));
    }
    return suggestion;
  }

  const text = suggestion.trim();
  if (!text) return null;

  if (field === 'startDate' || field === 'endDate' || field === 'commitmentDate') {
    return toDateInputValue(text) || null;
  }
  if (field === 'yearOfEstablishment' && /\d{4}-\d{1,2}-\d{1,2}/.test(text)) {
    return toDateInputValue(text) || null;
  }

  if (field === 'milestones') {
    const rows = normalizeMilestones(text);
    return rows.length ? rows : null;
  }

  if (field === 'yearProjections') {
    const rows = normalizeYearProjections(text);
    return rows.length ? rows : null;
  }

  if (
    field === 'promoters' ||
    field === 'machineryItems' ||
    field === 'costPhasing' ||
    field === 'productMix' ||
    field === 'rawMaterialItems' ||
    field === 'staffRoles' ||
    field === 'risks' ||
    field === 'utilisationByYear'
  ) {
    const array = firstJsonArray(text);
    const objectMatch = text.match(/\{[\s\S]*\}/);
    let objectValue: unknown = null;
    if (objectMatch) {
      try {
        objectValue = JSON.parse(objectMatch[0]);
      } catch {
        objectValue = null;
      }
    }
    if (field === 'promoters') return normalizePromoters(array || objectValue);
    if (field === 'machineryItems') return normalizeMachineryItems(array || objectValue);
    if (field === 'productMix') return normalizeProductMix(array || objectValue);
    if (field === 'rawMaterialItems') return normalizeRawMaterials(array || objectValue);
    if (field === 'staffRoles') return normalizeStaffRoles(array || objectValue);
    if (field === 'risks') return normalizeRisks(array || objectValue);
    if (field === 'utilisationByYear') return normalizeUtilisationYears(array || objectValue);
    if (field === 'costPhasing') return objectValue ? normalizeCostPhasing(objectValue) : null;
  }

  if (field === 'connectivity') {
    const obj = firstJsonObject(text);
    if (obj) {
      return {
        road: obj.road || obj.Road || '',
        rail: obj.rail || obj.Rail || '',
        port: obj.port || obj.Port || '',
      };
    }
  }

  const arr = firstJsonArray(text);
  if (arr && !proseAroundJson(text)) {
    if (field === 'rawMaterials' && arr.length && typeof arr[0] === 'string') {
      return arr.map((name: string) => ({ name, source: '' }));
    }
    if (field === 'valueAdditionStages' && arr.length && typeof arr[0] === 'string') {
      return arr.map((stage: string) => ({ stage, sellingPrice: 0 }));
    }
    if (field === 'boardOfDirectors' && arr.length && typeof arr[0] === 'string') {
      return arr.map((name: string) => ({ name, designation: 'Owner' }));
    }
    return arr;
  }

  const obj = firstJsonObject(text);
  if (obj && ['connectivity', 'enterpriseCount', 'ageOfEnterprises', 'employmentPerUnit', 'marketServed'].includes(field)) {
    return obj;
  }

  if (isNumericDprField(field)) {
    return asNumber(text);
  }

  return text;
}

/** Coerce a stored cost / numeric field to a finite number (0 if unusable). */
export function toFiniteNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value == null || value === '') return 0;
  const n = asNumber(String(value));
  return n == null ? 0 : n;
}
