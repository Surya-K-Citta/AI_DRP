import { getIndividualDocFields, getSchemeDocSteps } from '@/lib/individualDpr/individualDocModel';
import { applyPreset, type DocPresetId, type DocumentStyle, type SectionBlock } from '@/lib/individualDpr/documentStyle';

const LINE =
  'The unit buys cotton yarn from Guntur and weaves shirting for shops in Visakhapatnam and nearby towns. ';

function prose(times: number): string {
  return LINE.repeat(times).trim();
}

const SAMPLE_TITLES = [
  'Market and buyers',
  'How the cloth is made',
  'People and wages',
  'Premises and power',
  'Year-wise working',
  'Risks and the reply',
];

function specimenSections(longForm: boolean): { customSections: DocumentStyle['customSections']; sectionBlocks: Record<string, SectionBlock[]> } {
  const titles = longForm ? SAMPLE_TITLES : SAMPLE_TITLES.slice(0, 2);
  const customSections = titles.map((title, index) => ({
    id: `csec_sample${String(index + 1).padStart(2, '0')}`,
    title,
  }));
  const sectionBlocks: Record<string, SectionBlock[]> = {};
  customSections.forEach((section, index) => {
    sectionBlocks[section.id] = [{
      id: `blk${index}a`,
      kind: 'text' as const,
      text: prose(longForm ? 14 : 8),
    }];
  });
  return { customSections, sectionBlocks };
}

function valueFor(name: string, label: string): unknown {
  if (name === 'unitName') return 'Coastal Weave Unit';
  if (name === 'district') return 'Visakhapatnam';
  if (name === 'location') return 'Gajuwaka';
  if (name === 'productMix') {
    return [
      { name: 'Cotton shirting', sharePercent: '60', sellingPrice: '180' },
      { name: 'Bed linen', sharePercent: '40', sellingPrice: '420' },
    ];
  }
  if (name === 'yearProjections') {
    return [1, 2, 3, 4, 5].map((year) => ({
      year,
      sales: 40 + year * 8,
      rm: 18,
      wages: 6,
      power: 2,
      netProfit: 4 + year,
    }));
  }
  if (name === 'milestones') {
    return [
      { activity: 'Shed readiness', timeRequired: '6 weeks', startDate: '2026-04-01', endDate: '2026-05-15' },
      { activity: 'Machinery install', timeRequired: '4 weeks', startDate: '2026-05-16', endDate: '2026-06-12' },
      { activity: 'Trial production', timeRequired: '3 weeks', startDate: '2026-06-13', endDate: '2026-07-03' },
    ];
  }
  if (name === 'machineryItems') {
    return [
      { description: 'Power loom', condition: 'New', supplier: 'Local OEM', quantity: 4, unitCost: 2.5 },
      { description: 'Winding machine', condition: 'New', supplier: 'Local OEM', quantity: 1, unitCost: 0.8 },
    ];
  }
  if (name === 'rawMaterialItems') {
    return [
      { name: 'Cotton yarn', use: 'Warp and weft', basis: 'Monthly purchase' },
      { name: 'Dye', use: 'Shade', basis: 'Job work' },
    ];
  }
  if (name === 'staffRoles') {
    return [
      { role: 'Weaver', count: 6, monthlyPay: 14000 },
      { role: 'Helper', count: 2, monthlyPay: 9000 },
    ];
  }
  if (name === 'promoters') {
    return [
      { name: 'A. Rao', relationName: 'Self', age: '34', education: 'Graduate', experienceYears: '8', phone: '9000000000' },
    ];
  }
  if (name === 'risks') {
    return [{ risk: 'Yarn price rise', mitigation: 'Buy a two-month stock when the rate is steady' }];
  }
  if (name === 'utilisationByYear') {
    return [
      { label: 'Year 1', percent: '55' },
      { label: 'Year 2', percent: '70' },
    ];
  }
  if (/date/i.test(name)) return '2026-06-01';
  if (['sectorDescription', 'presentActivities', 'geography', 'targetMarket', 'existingDemand', 'landDetails', 'description', 'objectives', 'expectedBenefits', 'manufacturingProcess'].includes(name)) {
    return prose(3);
  }
  if (/₹|%|percent|count|cost|loan|sales|year|capacity|volume/i.test(label)) return '12';
  return 'Entered for this sample';
}

/** A filled specimen report, long enough to read a template across many pages. */
export function templateSpecimenDpr(schemeCode?: string | null) {
  const data: Record<string, any> = {
    isIndividualDPR: true,
    matchedSchemeCode: schemeCode || null,
    schemeExtras: {},
  };
  for (const step of getSchemeDocSteps(schemeCode)) {
    for (const field of getIndividualDocFields(step.contentStep, schemeCode)) {
      const value = valueFor(field.name, field.label);
      if (field.source === 'extras') {
        data.schemeExtras[field.name] = value;
      } else {
        const stepKey = field.path.split('.')[0];
        data[stepKey] = data[stepKey] || {};
        data[stepKey][field.name] = value;
      }
    }
  }
  return data;
}

/** Theme to judge, with specimen sections that are not written onto the real report. */
export function templateSpecimenStyle(current: DocumentStyle, id: DocPresetId, schemeCode?: string | null): DocumentStyle {
  const next = applyPreset(current, id);
  const specimen = specimenSections(getSchemeDocSteps(schemeCode).length < 16);

  return {
    ...next,
    customSections: specimen.customSections,
    sectionBlocks: specimen.sectionBlocks,
    sectionOrder: [],
    pictures: [],
    images: { cover: '', annexure: '', after: {} },
  };
}
