import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isEnteredDocRow, isEnteredDocText } from './individualDpr/docEntries.ts';
import { dprDownloadName } from './dprExportName.ts';
import { patchFromDocEdit } from './individualDpr/liveDocEdit.ts';
import { cardMatchesFilters, schemeKind, schemeLevel } from './schemePickerFilters.ts';
import { isReasonableIsoDate } from './individualDpr/isoDate.ts';
import { sanitizeOwnerTags, toggleOwner } from './ventureMatch/ownerSelection.ts';
import { analyzeCombinations, relationBetween } from './ventureMatch/combos.ts';
import { draftSignature, hasDraftContent } from './individualDpr/draftState.ts';
import { toIndividualPayload } from './individualDpr/toIndividualPayload.ts';
import { useIndividualDPRStore } from '../store/individualDPRStore.ts';
import { hasAnswer, nextMilestone, overallProgress, sectionsUnsaved, type SectionProgress } from './individualDpr/authoringMath.ts';
import { groundCostSuggestion } from './individualDpr/costSuggestionGuard.ts';
import {
  acceptByKind,
  buildFactsCard,
  costFigureFits,
  fieldIsFilled,
  machineryCostsFit,
  splitUnfilledFields,
  yearToIsoDate,
} from './individualDpr/stepSuggestionCheck.ts';
import {
  applySectionOrder,
  contrastOk,
  defaultStyleForScheme,
  insertPicture,
  addCustomSection,
  addSectionBlock,
  layoutOrder,
  moveSection,
  selectionStepOrder,
  formatPageNumber,
  pageCountForHeight,
  pageEdgeMm,
  resizeImageBox,
  resolveDocumentStyle,
  setImageWidth,
  shiftForPageEdge,
} from './individualDpr/documentStyle.ts';

describe('report entries', () => {
  it('keeps a filled answer and drops a blank, a dash, and a zero', () => {
    assert.equal(isEnteredDocText('Visakhapatnam'), true);
    assert.equal(isEnteredDocText(''), false);
    assert.equal(isEnteredDocText('—'), false);
    assert.equal(isEnteredDocText('0'), false);
    assert.equal(isEnteredDocRow(['Year 1', '', '0', '12'], [0]), true);
    assert.equal(isEnteredDocRow(['Land', '0', '0', '0'], [0]), false);
    assert.equal(isEnteredDocRow(['', '0', '0']), false);
  });
});

describe('dpr download name', () => {
  it('uses scheme, project, short language, and DDMMYY', () => {
    const name = dprDownloadName({
      schemeCode: 'AP_CMEP',
      projectName: 'Kavya Silks',
      language: 'english',
      date: new Date(2026, 1, 1),
      ext: 'pdf',
    });
    assert.equal(name, 'AP_CMEP_Kavya_Silks_eng_010226.pdf');
  });

  it('shortens Telugu to tel', () => {
    const name = dprDownloadName({
      schemeCode: 'PMEGP',
      projectName: 'Unit',
      language: 'telugu',
      date: new Date(2026, 9, 3),
      ext: 'docx',
    });
    assert.equal(name, 'PMEGP_Unit_tel_031026.docx');
  });
});

describe('scheme card filters', () => {
  const card = {
    level: schemeLevel('State Scheme'),
    kind: schemeKind('Subsidy and incentive'),
    haystack: 'ap cmep garment',
  };

  it('matches any selected level and any selected kind', () => {
    assert.equal(cardMatchesFilters(card, ['state', 'central'], ['subsidy', 'loan'], ''), true);
    assert.equal(cardMatchesFilters(card, ['central'], ['subsidy'], ''), false);
    assert.equal(cardMatchesFilters(card, ['state'], ['loan'], ''), false);
  });

  it('treats an empty selection as all', () => {
    assert.equal(cardMatchesFilters(card, [], [], 'garment'), true);
    assert.equal(cardMatchesFilters(card, [], [], 'steel'), false);
  });
});

describe('iso dates', () => {
  it('accepts a real day inside 1990–2100', () => {
    assert.equal(isReasonableIsoDate('2026-04-01'), true);
  });

  it('rejects an impossible day and a year outside the range', () => {
    assert.equal(isReasonableIsoDate('2026-02-31'), false);
    assert.equal(isReasonableIsoDate('1989-01-01'), false);
  });
});

describe('cost suggestions', () => {
  it('returns 0 when earlier steps state no amount', () => {
    assert.equal(groundCostSuggestion('machinery', '42', { step1: { unitName: 'Loom' } }), '0');
  });

  it('keeps a figure when earlier steps already state one', () => {
    assert.equal(
      groundCostSuggestion('machinery', '12', { step12: { machinery: 12 } }),
      '12'
    );
  });
});

describe('step suggestion batch', () => {
  const emptyFacts = { unitName: '', district: '', location: '', products: '', amounts: {} };

  it('keeps filled answers out of the batch and splits long write-ups', () => {
    const groups = splitUnfilledFields(
      [
        { name: 'sectorType' },
        { name: 'sectorDescription' },
        { name: 'executiveSummary' },
      ],
      { sectorType: 'Manufacturing', sectorDescription: '', executiveSummary: '' }
    );
    assert.deepEqual(groups.short.map((field) => field.name), []);
    assert.deepEqual(groups.long.map((field) => field.name), ['sectorDescription', 'executiveSummary']);
    assert.equal(fieldIsFilled(0), false);
    assert.equal(fieldIsFilled('Cotton yarn'), true);
  });

  it('builds a facts card from earlier steps', () => {
    const card = buildFactsCard({
      step1: { unitName: 'Kavya Silks', district: 'Guntur', location: 'Tenali', majorProducts: 'Sarees' },
      step12: { machinery: 12 },
    });
    assert.equal(card.unitName, 'Kavya Silks');
    assert.equal(card.district, 'Guntur');
    assert.equal(card.products, 'Sarees');
    assert.equal(card.amounts.machinery, 12);
  });

  it('keeps a cost only when it agrees with amounts already entered', () => {
    assert.equal(acceptByKind('cost', '42', emptyFacts), '0');
    assert.equal(costFigureFits(80, { machinery: 2 }), false);
    assert.equal(acceptByKind('cost', '8', { ...emptyFacts, amounts: { machinery: 2 } }), '8');
    assert.equal(
      machineryCostsFit([{ description: 'Loom', quantity: 1, unitCost: 40 }], { ...emptyFacts, amounts: { machinery: 2 } }),
      false
    );
  });

  it('turns a bare year into a start date', () => {
    assert.equal(yearToIsoDate('2019'), '2019-01-01');
    assert.equal(yearToIsoDate('started in 2023'), '2023-01-01');
    assert.equal(yearToIsoDate(''), '');
  });

  it('rejects a bad date and a short essay', () => {
    assert.equal(acceptByKind('date', '2026-02-31', emptyFacts), null);
    assert.equal(acceptByKind('date', '2026-04-01', emptyFacts), '2026-04-01');
    assert.equal(acceptByKind('prose', 'Too short.', emptyFacts), null);
  });
});

describe('custom sections', () => {
  it('adds a section and keeps a text block and an image inside it', () => {
    const steps = [{ id: 'a' }, { id: 'b' }];
    let style = defaultStyleForScheme('PMFME');
    style = addCustomSection(style, steps, 'Site photos', 'csec_site');
    assert.ok(layoutOrder(steps, style).includes('csec_site'));
    style = addSectionBlock(style, 'a', { id: 'blk_note', kind: 'text', text: 'Hello from the section' });
    style = addSectionBlock(style, 'csec_site', {
      id: 'blk_pic',
      kind: 'image',
      name: 'Front',
      src: 'data:image/png;base64,aaaa',
      hidden: false,
      frame: { w: 80, h: 0, x: 0, y: 0 },
    });
    const saved = resolveDocumentStyle(style, 'PMFME');
    assert.equal(saved.customSections[0].title, 'Site photos');
    assert.equal((saved.sectionBlocks.a[0] as { text: string }).text, 'Hello from the section');
    assert.equal((saved.sectionBlocks.csec_site[0] as { name: string }).name, 'Front');
    assert.ok(layoutOrder(steps, saved).includes('csec_site'));
  });
});

describe('live document typing', () => {
  it('writes a cover field and a table cell back onto the draft', () => {
    const unit = patchFromDocEdit({ step1: {} }, 'step1.unitName', 'Screen Test Unit');
    assert.equal(unit?.stepData?.unitName, 'Screen Test Unit');
    assert.equal(unit?.stepData?.clusterName, 'Screen Test Unit');
    const same = patchFromDocEdit({ step1: { unitName: 'Screen Test Unit', clusterName: 'Screen Test Unit' } }, 'step1.unitName', 'Screen Test Unit');
    assert.equal(same, null);
    const row = patchFromDocEdit({ step14: { staffRoles: [{ role: 'Helper', count: 1 }] } }, 'step14.staffRoles[0].count', '3');
    assert.equal(row?.stepData?.staffRoles[0].count, 3);
    assert.equal(row?.stepData?.staffRoles[0].role, 'Helper');
  });
});

describe('report style', () => {
  it('starts PMEGP from its preset and other schemes from the government look', () => {
    assert.equal(defaultStyleForScheme('PMEGP').preset, 'pmegp');
    assert.equal(defaultStyleForScheme('AP_CMEP').preset, 'apCmep');
    assert.equal(defaultStyleForScheme('PMFME').preset, 'government');
  });

  it('keeps a half-saved style on the preset', () => {
    const style = resolveDocumentStyle({ colors: { header: '#111827' } }, 'PMEGP');
    assert.equal(style.colors.header, '#111827');
    assert.equal(style.colors.primary, defaultStyleForScheme('PMEGP').colors.primary);
    assert.equal(style.watermark, 'Confidential — for lending appraisal');
  });

  it('moves a section with its place in the print order and can hide it', () => {
    const steps = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const order = moveSection([], steps, 'c', 'a');
    assert.deepEqual(order, ['c', 'a', 'b']);
    const visible = applySectionOrder(steps, { sectionOrder: order, hiddenSectionIds: ['a'] });
    assert.deepEqual(visible.map((step) => step.id), ['c', 'b']);
  });

  it('drops a section after the row under the pointer and reorders step selection', () => {
    const steps = [
      { id: 'a', n: 1 },
      { id: 'b', n: 2 },
      { id: 'c', n: 3 },
    ];
    const order = moveSection(['a', 'b', 'c'], steps, 'a', 'b', 'after');
    assert.deepEqual(order, ['b', 'a', 'c']);
    assert.deepEqual(selectionStepOrder(steps, order, [1, 2, 3]), [2, 1, 3]);
    assert.deepEqual(selectionStepOrder(steps, ['pic:shop', 'c', 'a', 'b'], [1, 2, 3]), [3, 1, 2]);
  });

  it('rejects a color that would hide the text', () => {
    assert.equal(contrastOk('#ffffff', '#ffffff'), false);
    assert.equal(contrastOk('#111827', '#ffffff'), true);
    assert.equal(contrastOk('#ffffff', '#1e3a5f'), true);
  });

  it('keeps a picture width and drops it when the picture is gone', () => {
    const base = defaultStyleForScheme('PMFME');
    const tiny = 'data:image/png;base64,aaaa';
    const sized = setImageWidth({ ...base, images: { ...base.images, cover: tiny } }, 'cover', 40);
    assert.equal(sized.imageWidths.cover, 40);
    const kept = resolveDocumentStyle(sized, 'PMFME');
    assert.equal(kept.imageWidths.cover, 40);
    const cleared = resolveDocumentStyle({ ...sized, images: { ...sized.images, cover: '' } }, 'PMFME');
    assert.equal(cleared.images.cover, '');
    assert.equal(cleared.imageWidths.cover, 100);
    const start = { w: 80, h: 40, x: 10, y: 6 };
    const fromLeft = resizeImageBox(start, 'w', 10, 0);
    assert.equal(fromLeft.x + fromLeft.w, start.x + start.w);
    const fromTop = resizeImageBox(start, 'n', 0, 8);
    assert.equal(fromTop.y + fromTop.h, start.y + start.h);
    const corner = resizeImageBox(start, 'se', -10, -4);
    assert.equal(corner.x, start.x);
    assert.equal(corner.y, start.y);
    assert.ok(corner.w < start.w && corner.h < start.h);
    const steps = [{ id: 'a' }, { id: 'b' }];
    const placed = insertPicture(base, steps, {
      id: 'shop',
      name: 'Shop front',
      src: tiny,
      hidden: false,
      place: 'a',
      frame: { w: 100, h: 0, x: 0, y: 0 },
    });
    assert.deepEqual(layoutOrder(steps, placed), ['a', 'pic:shop', 'b']);
    const migrated = resolveDocumentStyle({ images: { cover: tiny } }, 'PMFME');
    assert.equal(migrated.pictures[0].place, 'cover');
    assert.equal(migrated.pictures[0].name, 'Cover picture');
  });

  it('keeps a block off the page edge and off the break', () => {
    const page = 1000;
    const edge = 80;
    assert.equal(pageEdgeMm(8), 12);
    assert.equal(pageEdgeMm(16), 16);
    assert.equal(pageEdgeMm(20), 20);
    assert.equal(shiftForPageEdge(100, 40, page, edge, edge), 0);
    assert.equal(shiftForPageEdge(20, 40, page, edge, edge), 60);
    assert.equal(shiftForPageEdge(900, 150, page, edge, edge), 180);
    assert.equal(shiftForPageEdge(400, 900, page, edge, edge), 0);
  });
});

describe('live report dropdowns and numbers', () => {
  it('clears the town when a new district does not contain it', () => {
    const moved = patchFromDocEdit({ step1: { district: 'Guntur', location: 'Tenali' } }, 'step1.district', 'Kakinada');
    assert.equal(moved?.stepData?.district, 'Kakinada');
    assert.equal(moved?.stepData?.location, '');
  });

  it('stores typed numbers as numbers and leaves dates as text', () => {
    const year = patchFromDocEdit({ step4: {} }, 'step4.yearOfEstablishment', '2019');
    assert.equal(year?.stepData?.yearOfEstablishment, 2019);
    const date = patchFromDocEdit({ step4: {} }, 'step4.yearOfEstablishment', '2024-05-01');
    assert.equal(date?.stepData?.yearOfEstablishment, '2024-05-01');
  });
});

describe('owner selection groups', () => {
  it('lets only one of SC, ST, BC and General category man be chosen', () => {
    let tags = toggleOwner([], 'sc');
    tags = toggleOwner(tags, 'bc');
    assert.deepEqual(tags, ['bc']);
    tags = toggleOwner(tags, 'generalMale');
    assert.deepEqual(tags, ['generalMale']);
    assert.deepEqual(toggleOwner(tags, 'generalMale'), []);
  });

  it('combines woman, disability, transgender and ex-serviceman with a group choice', () => {
    let tags = toggleOwner([], 'sc');
    tags = toggleOwner(tags, 'female');
    tags = toggleOwner(tags, 'pwd');
    tags = toggleOwner(tags, 'exServiceman');
    assert.deepEqual(new Set(tags), new Set(['sc', 'female', 'pwd', 'exServiceman']));
    tags = toggleOwner(tags, 'st');
    assert.deepEqual(new Set(tags), new Set(['st', 'female', 'pwd', 'exServiceman']));
  });

  it('keeps not decided, no 51% and not sure on their own', () => {
    assert.deepEqual(toggleOwner(['sc', 'female'], 'notSure'), ['notSure']);
    assert.deepEqual(toggleOwner(['notSure'], 'female'), ['female']);
    assert.deepEqual(sanitizeOwnerTags(['sc', 'st', 'pwd']), ['sc', 'pwd']);
    assert.deepEqual(sanitizeOwnerTags(['female', 'noMajority']), ['noMajority']);
  });
});

describe('scheme combinations', () => {
  const pick = (...codes: string[]) => codes.map((code) => ({ code, name: code, kind: 'subsidy' as const, benefit: '' }));

  it('rules out the AP incentives that cannot share one investment and keeps the food one for food units', () => {
    const result = analyzeCombinations(pick('AP_EDP', 'AP_FPP', 'AP_TECH_UPGRADE'));
    assert.deepEqual(result.core.map((item) => item.scheme.code), ['AP_FPP']);
    assert.deepEqual(new Set(result.leftOut.map((item) => item.scheme.code)), new Set(['AP_EDP', 'AP_TECH_UPGRADE']));
    assert.equal(relationBetween('AP_EDP', 'AP_TECH_UPGRADE')?.type, 'exclusive');
    assert.equal(relationBetween('AP_EDP', 'AP_TECH_UPGRADE')?.source, 'guideline');
  });

  it('keeps PMEGP away from other subsidies and puts the 2nd loan after the first', () => {
    assert.equal(relationBetween('PMEGP', 'PMFME')?.type, 'exclusive');
    assert.equal(relationBetween('PMEGP', 'MUDRA')?.type, 'exclusive');
    const seq = relationBetween('PMEGP', 'PMEGP_2ND');
    assert.equal(seq?.type, 'sequence');
    assert.equal(seq?.first, 'PMEGP');
  });

  it('adds a guarantee on top of a subsidy but not on a loan that is already guaranteed', () => {
    assert.equal(relationBetween('CGTMSE', 'PMEGP')?.type, 'stack');
    assert.equal(relationBetween('CGTMSE', 'MUDRA')?.type, 'overlap');
    const plan = analyzeCombinations(pick('PMEGP', 'CGTMSE', 'ZED', 'MUDRA'));
    assert.deepEqual(plan.core.map((item) => item.scheme.code), ['PMEGP']);
    assert.deepEqual(new Set(plan.addOns.map((item) => item.scheme.code)), new Set(['CGTMSE', 'ZED']));
  });

  it('bars PM Vishwakarma for people who took PMEGP, MUDRA or SVANidhi', () => {
    ['PMEGP', 'MUDRA', 'SVANIDHI'].forEach((code) =>
      assert.equal(relationBetween('VISHWAKARMA', code)?.type, 'exclusive')
    );
  });
});

describe('sheet page numbers', () => {
  it('counts one sheet per page and does not add a blank for a sliver', () => {
    assert.equal(pageCountForHeight(297, 297), 1);
    assert.equal(pageCountForHeight(300, 297), 1);
    assert.equal(pageCountForHeight(400, 297), 2);
    assert.equal(pageCountForHeight(594, 297), 2);
    assert.equal(pageCountForHeight(0, 297), 1);
  });

  it('writes the page and the total, or just the page', () => {
    assert.equal(formatPageNumber('plain', 2, 8), '2');
    assert.equal(formatPageNumber('of', 2, 8), 'Page 2 of 8');
    assert.equal(formatPageNumber('of', 1, 3, 'పేజీ {n} / {total}'), 'పేజీ 1 / 3');
  });
});

describe('authoring progress', () => {
  const section = (step: number, answered: number, total: number, requiredMissing = 0, signature = ''): SectionProgress => ({
    step,
    contentStep: step,
    title: `Step ${step}`,
    answered,
    total,
    percent: total === 0 ? 100 : Math.round((answered / total) * 100),
    status: answered === total ? 'complete' : answered === 0 ? 'empty' : requiredMissing === 0 ? 'ready' : 'partial',
    requiredMissing,
    signature,
  });

  it('counts only real answers', () => {
    assert.equal(hasAnswer(''), false);
    assert.equal(hasAnswer('0'), false);
    assert.equal(hasAnswer(0), false);
    assert.equal(hasAnswer('Sri Lakshmi Foods'), true);
    assert.equal(hasAnswer([{ year: 1, sales: '' }, { year: 2, sales: 0 }]), false);
    assert.equal(hasAnswer([{ year: 1, sales: '' }, { year: 2, sales: 12 }]), true);
  });

  it('averages the sections and reports the next milestone', () => {
    const sections = [section(1, 2, 2), section(2, 1, 2, 1), section(3, 0, 4, 2), section(4, 0, 0)];
    const overall = overallProgress(sections);
    assert.equal(overall.percent, 50);
    assert.equal(overall.sectionsComplete, 2);
    assert.equal(overall.requiredMissing, 3);
    assert.equal(overall.readyToGenerate, false);
    assert.equal(nextMilestone(50)?.at, 75);
    assert.equal(nextMilestone(24)?.at, 25);
    assert.equal(nextMilestone(100), null);
  });

  it('flags sections whose answers differ from the saved copy', () => {
    const live = [section(1, 1, 2, 0, 'a'), section(2, 1, 2, 0, 'b'), section(3, 0, 2, 0, 'c')];
    const saved = [section(1, 1, 2, 0, 'a'), section(2, 0, 2, 0, 'x'), section(3, 0, 2, 0, 'c')];
    assert.deepEqual([...sectionsUnsaved(live, saved)], [2]);
    assert.deepEqual([...sectionsUnsaved(live, null)].sort(), [1, 2]);
  });
});

describe('draft saving and restoring', () => {
  const longText = `${'పరిశ్రమ వివరణ '.repeat(4000)}END`;
  const saved = () => ({
    step1: { unitName: 'శ్రీ లక్ష్మి ఫుడ్స్', district: 'Guntur', location: 'Tenali', natureOfBusiness: longText, majorProducts: 'Chips' },
    step4: { productMix: [{ name: 'Chips', sharePercent: 60, sellingPrice: 12.5 }, { name: 'Namkeen', sharePercent: 40, sellingPrice: 9 }] },
    step12: { land: 0, building: 4.25, machinery: 7.5, workingCapitalMargin: 2.125 },
    schemeExtras: { entrepreneurName: 'Lakshmi', pmegpCategory: 'special', documentStyle: { preset: 'govt', sectionOrder: ['a', 'b'] } },
    matchedSchemeCode: 'PMEGP',
    currentStep: 7,
  });

  it('restores a saved draft exactly: long text, Telugu, tables, decimals, style, and the step reached', () => {
    const store = useIndividualDPRStore;
    // What the server returns is what was sent, after a JSON round trip.
    const fromServer = JSON.parse(JSON.stringify(toIndividualPayload(saved())));
    store.getState().loadDataFromProject({ _id: 'p1', stepData: fromServer }, { _id: 'd1' });
    const now: any = store.getState().data;
    const original = saved();
    assert.equal(now.step1.natureOfBusiness, longText);
    assert.equal(now.step1.unitName, original.step1.unitName);
    assert.deepEqual(now.step4.productMix, original.step4.productMix);
    assert.deepEqual(now.step12, original.step12);
    assert.deepEqual(now.schemeExtras, original.schemeExtras);
    assert.equal(now.matchedSchemeCode, 'PMEGP');
    assert.equal(now.currentStep, 7);
    assert.equal(now.projectId, 'p1');
    assert.equal(now.dprId, 'd1');
  });

  it('does not carry another draft or person’s leftovers into a restored one', () => {
    const store = useIndividualDPRStore;
    store.getState().setStepData(3, { geography: 'LEFTOVER FROM ANOTHER SESSION' });
    store.getState().setSchemeExtras({ entrepreneurName: 'Someone else' });
    store.getState().loadDataFromProject({ _id: 'p2', stepData: { step1: { unitName: 'Fresh unit' } } }, null);
    const now: any = store.getState().data;
    assert.equal(now.step3, undefined);
    assert.deepEqual(now.schemeExtras, {});
    assert.equal(now.step1.unitName, 'Fresh unit');
    assert.equal(now.currentStep, 1);
  });

  it('tells a real change from moving between steps', () => {
    const a: any = { step1: { unitName: 'A' }, currentStep: 1, lastSaved: new Date(1) };
    const b: any = { step1: { unitName: 'A' }, currentStep: 5, lastSaved: new Date(2) };
    const c: any = { step1: { unitName: 'A!' }, currentStep: 5 };
    assert.equal(draftSignature(a), draftSignature(b));
    assert.notEqual(draftSignature(a), draftSignature(c));
    assert.equal(hasDraftContent({ step1: {} }), false);
    assert.equal(hasDraftContent({ step1: { unitName: 'A' } }), true);
  });
});

import { checkFormat, checkRange, gstinCheckChar, maskGstin, maskPan, maskUdyam } from './validation/formats.ts';

describe('field formats and masks', () => {
  it('masks PAN to upper-case pattern and rejects malformed values', () => {
    assert.equal(maskPan('abcfe1234f'), 'ABCFE1234F');
    assert.equal(checkFormat('pan', 'ABCFE1234F').ok, true);
    assert.equal(checkFormat('pan', 'ABCFE12345').ok, false);
    assert.equal(checkFormat('pan', 'ABC').ok, false);
  });
  it('validates GSTIN including the check character', () => {
    const base = '27AAPFU0939F1Z';
    const gstin = base + gstinCheckChar(base);
    assert.equal(maskGstin(gstin.toLowerCase()), gstin);
    assert.equal(checkFormat('gstin', gstin).ok, true);
    const bad = base + (gstin.endsWith('A') ? 'B' : 'A');
    assert.equal(checkFormat('gstin', bad).ok, false);
  });
  it('validates mobile, Udyam and numeric ranges', () => {
    assert.equal(checkFormat('mobile', '9876543210').ok, true);
    assert.equal(checkFormat('mobile', '5876543210').ok, false);
    assert.equal(maskUdyam('udyam-ap-01-1234567').startsWith('UDYAM-AP-01-'), true);
    assert.equal(checkRange('150', { min: 0, max: 100 }).ok, false);
    assert.equal(checkRange('50', { min: 0, max: 100 }).ok, true);
    assert.equal(checkRange('1.5', { min: 0, integer: true }).ok, false);
  });
});

import { describeField } from './plainLanguage/describe.ts';
import { GLOSSARY } from './plainLanguage/glossary.ts';

describe('plain-language field copy', () => {
  const prompts = {
    'Break-even (capacity %)': { ask: 'At what level of production do you stop losing money?', help: 'Often 50–60%.' },
  };
  it('uses the plain question and keeps the official label', () => {
    const copy = describeField('Break-even (capacity %)', prompts);
    assert.equal(copy.official, 'Break-even (capacity %)');
    assert.match(copy.ask ?? '', /stop losing money/);
  });
  it('adds a unit hint for lakhs and percentages', () => {
    assert.match(describeField('Wages (₹ Lakhs)', {}).units[0], /1 lakh is ₹1,00,000/);
    assert.match(describeField('Break-even (capacity %)', prompts).units[0], /0 to 100/);
    assert.equal(describeField('Address', {}).units.length, 0);
  });
  it('explains technical words found in the label', () => {
    const terms = describeField('Peak Q4 WC outstanding (₹ Lakhs)', {}).terms.map((t) => t.term);
    assert.deepEqual(terms, ['WC']);
    assert.ok(describeField('DSCR target', {}).terms.some((t) => t.term === 'DSCR'));
  });
  it('does not match acronyms inside ordinary words', () => {
    assert.equal(describeField('Total cost of the settlement', {}).terms.length, 0);
    assert.equal(describeField('Standard stall', {}).terms.length, 0);
  });
  it('finds the plain question even when the label has a required star', () => {
    assert.ok(describeField('Break-even (capacity %) *', prompts).ask);
  });
  it('every glossary entry matches its own term', () => {
    for (const entry of GLOSSARY) {
      const sample = entry.term === 'P&M' ? 'P&M' : entry.term;
      assert.ok(entry.pattern.test(sample) || entry.pattern.test(entry.means), entry.term);
    }
  });
});

import { PROMPTS as PROMPTS_A } from './plainLanguage/prompts/formA.ts';
import { PROMPTS as PROMPTS_B } from './plainLanguage/prompts/formB.ts';
import { PROMPTS as PROMPTS_C } from './plainLanguage/prompts/formC.ts';
import { STEP_INTROS as INTROS } from './plainLanguage/prompts/steps.ts';

describe('plain-language wording rules', () => {
  const all = { ...PROMPTS_A, ...PROMPTS_B, ...PROMPTS_C };
  it('every entry asks a short question and promises nothing', () => {
    const banned = /\b(guaranteed|assured|you will get|definitely)\b/i;
    for (const [label, entry] of Object.entries(all)) {
      assert.ok(entry.ask.length > 0 && entry.ask.length <= 140, `${label}: ask length`);
      for (const text of [entry.ask, entry.help ?? '', entry.example ?? '']) assert.ok(!banned.test(text), `${label}: promise wording`);
    }
    for (const [title, text] of Object.entries(INTROS)) assert.ok(!banned.test(text), `${title}: promise wording`);
  });
  it('never asks anyone to type a personal PAN or Aadhaar number', () => {
    for (const [label, entry] of Object.entries(all)) {
      const text = `${entry.ask} ${entry.help ?? ''}`;
      if (/aadhaar|\bPAN\b/i.test(text)) assert.match(text, /not|upload|copy|card|firm/i, label);
    }
  });
  it('has a plain sentence for the common steps', () => {
    for (const title of ['Means of finance', 'Project cost', 'Documents & uploads', 'Operating cost & sales']) assert.ok(INTROS[title], title);
  });
});

import { applyContextReuse, deriveProfile, isAutoFilled } from './individualDpr/contextReuse.ts';

describe('cross-section context reuse', () => {
  const base = () => ({ matchedSchemeCode: null, schemeExtras: {}, step1: { unitName: 'Sri Lakshmi Pickles', district: 'Guntur', location: 'Tenali' } });

  it('fills the applicant name and address from the unit details', () => {
    const out = applyContextReuse(base());
    assert.equal(out.step11.spvName, 'Sri Lakshmi Pickles');
    assert.equal(out.step11.address, 'Tenali, Guntur');
    assert.ok(isAutoFilled(out, 'step11.spvName'));
  });
  it('keeps following the source until the person types their own value', () => {
    let data: any = applyContextReuse(base());
    data = applyContextReuse({ ...data, step1: { ...data.step1, unitName: 'Sri Lakshmi Foods' } });
    assert.equal(data.step11.spvName, 'Sri Lakshmi Foods');
    data = applyContextReuse({ ...data, step11: { ...data.step11, spvName: 'Lakshmi & Sons' } });
    data = applyContextReuse({ ...data, step1: { ...data.step1, unitName: 'Something Else' } });
    assert.equal(data.step11.spvName, 'Lakshmi & Sons');
    assert.ok(!isAutoFilled(data, 'step11.spvName'));
  });
  it('never overwrites something already typed', () => {
    const out = applyContextReuse({ ...base(), step11: { spvName: 'Typed First', address: '12-3 Main Road' } });
    assert.equal(out.step11.spvName, 'Typed First');
    assert.equal(out.step11.address, '12-3 Main Road');
  });
  it('uses the proprietor for lean unit packs and returns the same object when nothing changes', () => {
    const lean: any = applyContextReuse({ ...base(), matchedSchemeCode: 'PMEGP', schemeExtras: { entrepreneurName: 'K. Ravi' } });
    assert.equal(lean.step11.spvName, 'K. Ravi');
    assert.equal(applyContextReuse(lean), lean);
  });
  it('derives promoter, address and GST for the schedules', () => {
    const profile = deriveProfile({ ...base(), schemeExtras: { entrepreneurName: 'K. Ravi' }, step11: { gstin: '37abcfe1234f1zv', address: '1-2 Station Road' } });
    assert.deepEqual([profile.promoterName, profile.address, profile.gstin, profile.unitName], ['K. Ravi', '1-2 Station Road', '37ABCFE1234F1ZV', 'Sri Lakshmi Pickles']);
    assert.equal(deriveProfile({ step1: { district: 'Guntur', location: 'Tenali' } }).address, 'Tenali, Guntur');
  });
});

import { dismissalKey, openFindings, runDataChecks } from './individualDpr/dataChecks.ts';

describe('automated data checks', () => {
  const ids = (data: any, final = false) => runDataChecks(data, { final }).map((f) => f.id);
  it('stays quiet about steps that have not been started', () => {
    assert.deepEqual(ids({ step1: { unitName: 'A' } }), []);
  });
  it('flags missing answers at the end', () => {
    const found = ids({ step1: { unitName: 'A' } }, true);
    for (const id of ['cost.zero', 'sales.zero', 'what.missing']) assert.ok(found.includes(id), id);
  });
  it('flags funding that does not match the project cost', () => {
    const found = runDataChecks({ step12: { machinery: 10 }, step13: { bankLoan: 7, spvContribution: 1 } });
    const f = found.find((x) => x.id === 'mof.mismatch');
    assert.ok(f);
    assert.equal(f!.vars!.c, '2');
    assert.ok(!ids({ step12: { machinery: 10 }, step13: { bankLoan: 9, spvContribution: 1 } }).includes('mof.mismatch'));
  });
  it('flags rupees typed instead of lakhs', () => {
    assert.ok(ids({ step12: { machinery: 250000 } }).includes('unit.rupees'));
    assert.ok(!ids({ step12: { machinery: 2.5 } }).includes('unit.rupees'));
  });
  it('flags unusual loan terms, shares and capacity', () => {
    const found = ids({ step12: { machinery: 100 }, step13: { interestRate: 40, loanTenureMonths: 6, spvContribution: 2, governmentGrant: 60, bankLoan: 38, moratoriumMonths: 8 }, step14: { capacityUtilisation: 140 } });
    for (const id of ['loan.rate', 'loan.tenure', 'mof.own.low', 'mof.grant.high', 'loan.moratorium', 'util.over']) assert.ok(found.includes(id), id);
  });
  it('flags placeholder, short and copied text', () => {
    const found = ids({ step1: { natureOfBusiness: 'na', majorProducts: 'x' }, step2: { sectorDescription: 'We make pickles and sell them to local shops every day.' }, schemeExtras: { executiveSummary: 'We make pickles and sell them to local shops every day.' } });
    assert.ok(found.includes('text.placeholder.natureOfBusiness'));
    assert.ok(found.includes('text.short.majorProducts'));
    assert.ok(found.includes('text.repeat.executiveSummary'));
  });
  it('flags costs above sales', () => {
    assert.ok(ids({ step14: { annualSalesRealization: 10, rawMaterialCost: 8, wages: 5 } }).includes('sales.loss'));
  });
  it('lets a dismissed finding go until its value changes', () => {
    const data = { step13: { interestRate: 40 } };
    const first = runDataChecks(data).find((f) => f.id === 'loan.rate')!;
    assert.equal(openFindings(runDataChecks(data), [dismissalKey(first)]).filter((f) => f.id === 'loan.rate').length, 0);
    const changed = runDataChecks({ step13: { interestRate: 45 } });
    assert.equal(openFindings(changed, [dismissalKey(first)]).filter((f) => f.id === 'loan.rate').length, 1);
  });
});

import { breakEvenPercent, fundingSplit, loanCover, monthlyInstalment, workingCapitalNeed } from './individualDpr/financeCalc.ts';

describe('finance calculators', () => {
  it('works out a monthly instalment', () => {
    assert.equal(Math.round(monthlyInstalment(10, 12, 60) * 10000) / 10000, 0.2224);
    assert.equal(monthlyInstalment(12, 0, 12), 1);
    assert.equal(monthlyInstalment(0, 12, 60), 0);
  });
  it('says whether the profit covers the loan', () => {
    const comfortable = loanCover({ loan: 10, ratePct: 12, months: 60, yearlyAvailable: 5 });
    assert.equal(comfortable.verdict, 'comfortable');
    assert.equal(loanCover({ loan: 10, ratePct: 12, months: 60, yearlyAvailable: 3.2 }).verdict, 'tight');
    assert.equal(loanCover({ loan: 10, ratePct: 12, months: 60, yearlyAvailable: 1 }).verdict, 'short');
    assert.equal(loanCover({ loan: 0, ratePct: 12, months: 60, yearlyAvailable: 1 }).verdict, 'unknown');
  });
  it('finds the break-even share of capacity', () => {
    assert.equal(breakEvenPercent({ sales: 100, changingCosts: 40, fixedCosts: 30 }), 50);
    assert.equal(breakEvenPercent({ sales: 100, changingCosts: 120, fixedCosts: 10 }), null);
    assert.equal(breakEvenPercent({ sales: 0, changingCosts: 0, fixedCosts: 10 }), null);
  });
  it('estimates working capital and splits the funding', () => {
    assert.equal(workingCapitalNeed(24, 3), 6);
    const split = fundingSplit(100, 10, 25);
    assert.deepEqual([split.own, split.grant, split.loan, split.overfunded], [10, 25, 65, false]);
    assert.equal(fundingSplit(100, 70, 50).overfunded, true);
  });
});

import { assetTotalLakhs, businessKind, detectKind, kindLabel, normalizeAssetItems, scaleOf } from './individualDpr/businessKind.ts';

describe('business kind and scale', () => {
  it('uses the scheme-finder activity, then the words written, and lets the person override', () => {
    assert.equal(businessKind({ ventureMatchAnswers: { activity: 'mfg' } }), 'manufacturing');
    assert.equal(businessKind({ ventureMatchAnswers: { activity: 'service' } }), 'service');
    assert.equal(businessKind({ ventureMatchAnswers: { activity: 'vending' } }), 'trading');
    assert.equal(detectKind({ step1: { natureOfBusiness: 'Beauty parlour and bridal makeup' } }).kind, 'service');
    assert.equal(detectKind({ step1: { natureOfBusiness: 'Kirana shop selling groceries' } }).kind, 'trading');
    assert.equal(detectKind({ step1: { natureOfBusiness: 'Making mango pickle' } }).kind, 'manufacturing');
    assert.equal(detectKind({}).source, 'default');
    assert.equal(businessKind({ ventureMatchAnswers: { activity: 'mfg' }, schemeExtras: { businessKind: 'service' } }), 'service');
  });
  it('sizes by project cost when known, else by budget', () => {
    assert.equal(scaleOf({}, 3), 'tiny');
    assert.equal(scaleOf({}, 40), 'small');
    assert.equal(scaleOf({}, 120), 'medium');
    assert.equal(scaleOf({ ventureMatchAnswers: { budget: '2to5L' } }), 'tiny');
    assert.equal(scaleOf({ ventureMatchAnswers: { budget: '1to10Cr' } }), 'large');
    assert.equal(scaleOf({}), 'unknown');
  });
  it('renames machinery and production wording for services and traders only', () => {
    assert.equal(kindLabel('Plant & machinery (₹ Lakhs)', 'manufacturing'), 'Plant & machinery (₹ Lakhs)');
    assert.equal(kindLabel('Plant & machinery (₹ Lakhs)', 'service'), 'Equipment & assets (₹ Lakhs)');
    assert.equal(kindLabel('Raw Material Cost (₹ Lakhs)', 'trading'), 'Cost of goods bought for resale (₹ Lakhs)');
    assert.equal(kindLabel('Land', 'service'), 'Land');
  });
  it('totals an asset list', () => {
    const items = normalizeAssetItems([{ item: 'Chair', category: 'Furniture & fixtures', quantity: 4, unitCost: 0.05 }, { item: 'Laptop', quantity: 1, unitCost: 0.45, category: 'nonsense' }, { item: '' }]);
    assert.equal(items[1].category, 'Equipment & tools');
    assert.equal(assetTotalLakhs(items), 0.65);
    assert.deepEqual(normalizeAssetItems(null), []);
  });
});

import { detectFileType as detectClientFile } from './security/fileGuard.ts';
import { sanitizeDeep } from './security/sanitizeText.ts';

describe('client-side input safety', () => {
  it('drops operator and prototype keys and control characters before sending', () => {
    const out: any = sanitizeDeep(JSON.parse('{"email":{"$ne":null},"__proto__":{"x":1},"note":"a\\u0000b","password":"<b>keep</b>","list":[{"$gt":1,"ok":"< 5 years"}]}'));
    assert.deepEqual(out.email, {});
    assert.equal(Object.keys(out).includes('__proto__'), false);
    assert.equal(out.note, 'ab');
    assert.equal(out.password, '<b>keep</b>');
    assert.deepEqual(out.list, [{ ok: '< 5 years' }]);
  });
  it('recognises real files by their bytes and refuses a renamed web page', () => {
    assert.equal(detectClientFile(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))?.kind, 'image');
    assert.equal(detectClientFile(new TextEncoder().encode('%PDF-1.4'))?.mime, 'application/pdf');
    assert.equal(detectClientFile(new TextEncoder().encode('plain notes'))?.kind, 'text');
    assert.equal(detectClientFile(new Uint8Array([0x4d, 0x5a, 0x90, 0, 3, 0, 0, 0])), null);
    assert.equal(detectClientFile(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0, 0, 0])), null);
  });
});
