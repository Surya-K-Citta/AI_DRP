import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { applyUserTranslations, collectUserTexts, isTranslatableUserText } from './userTextTe.ts';

describe('typed text worth translating', () => {
  it('accepts names, descriptions and addresses', () => {
    for (const text of ['Sri Lakshmi Tailors', 'We stitch school uniforms for local schools', '12-4/5, Main Road, Guntur']) {
      assert.equal(isTranslatableUserText(text), true, text);
    }
  });
  it('leaves numbers, codes, links, contact details and Telugu alone', () => {
    for (const text of ['12', '45.5', '₹ 5,00,000', 'PMEGP', 'UDYAM-AP-01-0001234', 'user@example.com', 'https://example.com/x', 'file:abc123', 'ok', 'శ్రీ లక్ష్మి']) {
      assert.equal(isTranslatableUserText(text), false, text);
    }
  });
  it('leaves identifier-like fields alone by field name', () => {
    assert.equal(isTranslatableUserText('Sri Lakshmi Tailors', 'email'), false);
    assert.equal(isTranslatableUserText('Annual turnover note', 'gstin'), false);
    assert.equal(isTranslatableUserText('Sri Lakshmi Tailors', 'unitName'), true);
  });
});

describe('collecting and applying translations', () => {
  const data = {
    matchedSchemeCode: 'SVANIDHI',
    step1: { unitName: 'Sri Lakshmi Tailors', district: 'Guntur', email: 'a@b.co' },
    step2: { products: ['School uniforms', 'Blouse stitching'], note: '' },
    step18: { aadhaar: { status: 'uploaded', fileId: 'x1', originalName: 'Aadhaar card scan.pdf' } },
    schemeExtras: { documentStyle: { headerLine: 'Confidential draft' } },
  };

  it('finds each distinct text once and skips settings, files and contact fields', () => {
    assert.deepEqual(collectUserTexts(data).sort(), ['Blouse stitching', 'Guntur', 'School uniforms', 'Sri Lakshmi Tailors']);
  });
  it('replaces translated texts in a copy and leaves the original untouched', () => {
    const out: any = applyUserTranslations(data, new Map([['Sri Lakshmi Tailors', 'శ్రీ లక్ష్మి టైలర్స్'], ['School uniforms', 'స్కూల్ యూనిఫారాలు']]));
    assert.equal(out.step1.unitName, 'శ్రీ లక్ష్మి టైలర్స్');
    assert.equal(out.step1.district, 'Guntur', 'no translation yet: stays as typed');
    assert.deepEqual(out.step2.products, ['స్కూల్ యూనిఫారాలు', 'Blouse stitching']);
    assert.equal(out.matchedSchemeCode, 'SVANIDHI');
    assert.equal(data.step1.unitName, 'Sri Lakshmi Tailors');
  });
});
