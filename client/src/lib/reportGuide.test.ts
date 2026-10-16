import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { defaultGuideChoices, guideFocusSpot, guideSpotFallbacks, styleFromGuide } from './individualDpr/reportGuide.ts';
import { presetStyle } from './individualDpr/documentStyle.ts';

describe('report setup guide', () => {
  it('starts with a scheme look, a regular page, and the usual page extras', () => {
    const choices = defaultGuideChoices();
    assert.equal(choices.look, 'match');
    assert.equal(choices.pageSize, 'A4');
    assert.equal(choices.wideTablesLandscape, false);
    assert.equal(choices.font, 'preset');
    assert.equal(choices.colors, 'preset');
    assert.equal(choices.tableStriped, true);
    assert.equal(choices.watermarkOn, true);
    assert.equal(choices.agencyName, '');
    assert.equal(choices.pageNumberStyle, 'of');
  });

  it('uses the scheme look and still applies the other default choices', () => {
    const style = styleFromGuide(defaultGuideChoices(), 'PMEGP');
    const pmegp = presetStyle('pmegp');
    assert.equal(style.preset, 'pmegp');
    assert.equal(style.body.family, pmegp.body.family);
    assert.deepEqual(style.colors, pmegp.colors);
    assert.equal(style.pageSize, 'A4');
    assert.equal(style.wideTablesLandscape, false);
    assert.equal(style.tableStriped, true);
    assert.equal(style.agencyName, '');
    assert.equal(style.pageNumberStyle, 'of');
    assert.equal(style.watermark, pmegp.watermark);
  });

  it('keeps a chosen look when the scheme would normally look different', () => {
    const style = styleFromGuide({ ...defaultGuideChoices(), look: 'government' }, 'PMEGP');
    assert.equal(style.preset, 'government');
    assert.equal(style.body.family, 'Times New Roman');
    assert.equal(style.colors.primary, presetStyle('government').colors.primary);
  });

  it('uses one chosen font on every text role and a chosen colour set', () => {
    const style = styleFromGuide(
      { ...defaultGuideChoices(), look: 'minimal', font: 'Arial', colors: 'navy', align: 'left' },
      null
    );
    assert.equal(style.cover.family, 'Arial');
    assert.equal(style.sectionTitle.family, 'Arial');
    assert.equal(style.body.family, 'Arial');
    assert.equal(style.table.family, 'Arial');
    assert.equal(style.caption.family, 'Arial');
    assert.equal(style.cover.size, presetStyle('minimal').cover.size);
    assert.deepEqual(style.colors, presetStyle('government').colors);
    assert.equal(style.align, 'left');
  });

  it('turns the watermark off and puts wide tables on their side when asked', () => {
    const style = styleFromGuide(
      {
        ...defaultGuideChoices(),
        look: 'government',
        pageSize: 'A3',
        wideTablesLandscape: true,
        watermarkOn: false,
        pageNumberStyle: 'plain',
        logoAlign: 'center',
        agencyName: '  District Industries Centre  ',
      },
      null
    );
    assert.equal(style.pageSize, 'A3');
    assert.equal(style.wideTablesLandscape, true);
    assert.equal(style.watermark, '');
    assert.equal(style.pageNumberStyle, 'plain');
    assert.equal(style.logoAlign, 'center');
    assert.equal(style.agencyName, 'District Industries Centre');
  });

  it('prefers a saved scheme look over the built-in one when matching the scheme', () => {
    const saved = presetStyle('formal');
    const style = styleFromGuide(defaultGuideChoices(), 'MUDRA', saved);
    assert.equal(style.preset, 'formal');
    assert.equal(style.body.family, 'Times New Roman');
    assert.equal(style.tableStriped, true);
  });

  it('points each guide click at the first place that choice shows', () => {
    assert.equal(guideFocusSpot({ look: 'bank' }), 'cover');
    assert.equal(guideFocusSpot({ font: 'Arial' }), 'cover');
    assert.equal(guideFocusSpot({ pageSize: 'A3' }), 'page');
    assert.equal(guideFocusSpot({ wideTablesLandscape: true }), 'money');
    assert.equal(guideFocusSpot({ align: 'left' }), 'body');
    assert.equal(guideFocusSpot({ colors: 'navy' }), 'header');
    assert.equal(guideFocusSpot({ tableStriped: false }), 'table');
    assert.equal(guideFocusSpot({ logoAlign: 'center' }), 'header');
    assert.equal(guideFocusSpot({ agencyName: 'DIC' }), 'header');
    assert.equal(guideFocusSpot({ pageNumberStyle: 'plain' }), 'page-number');
    assert.equal(guideFocusSpot({ watermarkOn: true }), 'watermark');
    assert.equal(guideFocusSpot({ watermarkOn: false }), 'page');
  });

  it('falls back once when the first spot is not on the page', () => {
    assert.deepEqual(guideSpotFallbacks('header'), ['header', 'cover']);
    assert.deepEqual(guideSpotFallbacks('money'), ['money', 'table']);
    assert.deepEqual(guideSpotFallbacks('table'), ['table', 'money']);
    assert.deepEqual(guideSpotFallbacks('watermark'), ['watermark', 'page']);
    assert.deepEqual(guideSpotFallbacks('cover'), ['cover']);
  });
});
