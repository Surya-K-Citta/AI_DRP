import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  COLOR_PALETTES,
  PRESET_IDS,
  PRESET_LABELS,
  PRESET_LAYOUT,
  PRESET_NOTES,
  applyPreset,
  contrastOk,
  layoutOfPreset,
  presetStyle,
  resolveDocumentStyle,
  scaleTypeSizes,
  styleCssVars,
} from './individualDpr/documentStyle.ts';

describe('style options', () => {
  it('gives every template a name, a note, a layout family and a full set of settings', () => {
    for (const id of PRESET_IDS) {
      assert.ok(PRESET_LABELS[id], id);
      assert.ok(PRESET_NOTES[id], id);
      assert.ok(PRESET_LAYOUT[id], id);
      const style = presetStyle(id);
      assert.equal(style.preset, id);
      assert.ok(['compact', 'normal', 'roomy'].includes(style.tableDensity));
      assert.equal(typeof style.showToc, 'boolean');
    }
    assert.equal(layoutOfPreset('corporate'), 'bank');
    assert.equal(layoutOfPreset('compact'), 'government');
  });

  it('keeps the old look for a style saved before these options existed', () => {
    const saved = { preset: 'bank', colors: { primary: '#0f172a' } };
    const style = resolveDocumentStyle(saved, null);
    assert.equal(style.tableDensity, 'normal');
    assert.equal(style.tableBorders, 'template');
    assert.equal(style.sectionBreak, 'flow');
    assert.equal(style.showToc, true);
    assert.equal(style.headingNumbers, true);
    assert.equal(style.footerText, '');
  });

  it('reads the new settings and drops values it does not know', () => {
    const style = resolveDocumentStyle(
      { preset: 'formal', tableDensity: 'roomy', tableBorders: 'none', sectionBreak: 'newPage', showToc: false, headingNumbers: false, footerText: 'Firm · Draft' },
      null
    );
    assert.equal(style.tableDensity, 'roomy');
    assert.equal(style.tableBorders, 'none');
    assert.equal(style.sectionBreak, 'newPage');
    assert.equal(style.showToc, false);
    assert.equal(style.headingNumbers, false);
    assert.equal(style.footerText, 'Firm · Draft');
    const bad = resolveDocumentStyle({ preset: 'formal', tableDensity: 'huge', tableBorders: 'dotted', sectionBreak: 'x', footerText: 'x'.repeat(500) }, null);
    assert.equal(bad.tableDensity, 'normal');
    assert.equal(bad.tableBorders, 'template');
    assert.equal(bad.sectionBreak, 'flow');
    assert.equal(bad.footerText.length, 80);
  });

  it('keeps the footer text when a new template is chosen', () => {
    const current = { ...presetStyle('government'), footerText: 'Sri Lakshmi Foods' };
    assert.equal(applyPreset(current, 'heritage').footerText, 'Sri Lakshmi Foods');
  });

  it('keeps every color set readable', () => {
    for (const palette of COLOR_PALETTES) {
      const { primary, header, table, border } = palette.colors;
      assert.ok(contrastOk(primary), `${palette.id} primary`);
      assert.ok(contrastOk(header), `${palette.id} header`);
      assert.ok(contrastOk('#ffffff', table), `${palette.id} table`);
      assert.ok(contrastOk(border), `${palette.id} border`);
    }
  });

  it('scales all type sizes together inside the allowed range', () => {
    const base = presetStyle('government');
    const up = scaleTypeSizes(base, 0.5);
    assert.equal(up.body.size, base.body.size + 0.5);
    assert.equal(up.cover.size, base.cover.size + 0.5);
    const floor = scaleTypeSizes({ ...base, body: { ...base.body, size: 8 } }, -0.5);
    assert.equal(floor.body.size, 8);
    const ceiling = scaleTypeSizes({ ...base, cover: { ...base.cover, size: 36 } }, 0.5);
    assert.equal(ceiling.cover.size, 36);
    assert.equal(styleCssVars(up)['--dpr-body-size'], `${up.body.size}pt`);
  });
});
