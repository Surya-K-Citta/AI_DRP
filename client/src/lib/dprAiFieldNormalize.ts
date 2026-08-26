/** HTML date inputs only accept YYYY-MM-DD. */
export function toDateInputValue(value: unknown): string {
  if (value == null || value === '') return '';
  if (typeof value === 'number' && Number.isFinite(value)) return '';
  const text = String(value);
  const iso = text.match(/(\d{4}-\d{2}-\d{2})/);
  return iso ? iso[1] : '';
}

export function normalizeMilestones(value: unknown): Array<{
  activity: string;
  timeRequired: string;
  startDate: string;
  endDate: string;
}> {
  if (!Array.isArray(value) || value.length === 0) return [];

  return value.map((item) => {
    if (typeof item === 'string') {
      const dates = item.match(/\d{4}-\d{2}-\d{2}/g) || [];
      const activity = item
        .replace(/\s*by\s*\d{4}-\d{2}-\d{2}/gi, '')
        .replace(/\s*\(\d{4}-\d{2}-\d{2}\)/g, '')
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
  });
}

export function normalizeYearProjections(value: unknown): Array<{
  year: number;
  sales: number;
  rm: number;
  wages: number;
  power: number;
  netProfit: number;
}> {
  if (!Array.isArray(value) || value.length === 0) return [];
  return value.map((item, index) => {
    const row = item && typeof item === 'object' ? item : {};
    return {
      year: Number(row.year || index + 1) || index + 1,
      sales: Number(row.sales ?? row.revenue ?? 0) || 0,
      rm: Number(row.rm ?? row.rawMaterial ?? row.expenses ?? 0) || 0,
      wages: Number(row.wages ?? 0) || 0,
      power: Number(row.power ?? 0) || 0,
      netProfit: Number(row.netProfit ?? row.profit ?? 0) || 0,
    };
  });
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
  const match = text.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const num = parseFloat(match[0]);
  return Number.isFinite(num) ? num : null;
}

/** Turn an AI suggestion string into a form field value without a second API call. */
export function suggestionToFieldValue(field: string, suggestion: unknown): any {
  if (suggestion == null) return null;
  if (typeof suggestion !== 'string') {
    if (field === 'milestones') return normalizeMilestones(suggestion);
    if (field === 'yearProjections') return normalizeYearProjections(suggestion);
    if (field === 'startDate' || field === 'endDate') return toDateInputValue(suggestion) || null;
    return suggestion;
  }

  const text = suggestion.trim();
  if (!text) return null;

  if (field === 'startDate' || field === 'endDate') {
    return toDateInputValue(text) || null;
  }

  if (field === 'milestones') {
    const rows = normalizeMilestones(firstJsonArray(text) || []);
    return rows.length ? rows : null;
  }

  if (field === 'yearProjections') {
    const rows = normalizeYearProjections(firstJsonArray(text) || []);
    return rows.length ? rows : null;
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
  if (arr) {
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

  const numericFields = new Set([
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
    'employmentGeneration',
    'turnoverGrowth',
    'sellingPrice',
  ]);
  if (numericFields.has(field)) {
    return asNumber(text);
  }

  return text;
}
