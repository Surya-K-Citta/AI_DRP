import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import JSZip from 'jszip';
import { buildIndividualDocument, generateIndividualDprDocx } from './services/individualDprDocument.ts';

// The Word file must have the same structure as the PDF: cover, contents, numbered sections, "Particular | Details" tables,
// real tables for data tables, an A4 page with 14 mm margins, and page numbers.
async function docxFor(code: string) {
  const dpr = {
    matchedSchemeCode: code,
    content: {
      english: {
        clusterData: {
          matchedSchemeCode: code,
          step1: { unitName: 'Sri Lakshmi Hand Looms', district: 'Guntur', location: 'Mangalagiri', natureOfBusiness: 'Handloom sarees' },
          step3: { geography: 'We weave cotton and silk sarees. '.repeat(12) },
          step4: { legalStatus: 'Sole proprietorship' },
          step12: { land: 1.5, building: 4, machinery: 8.5, workingCapitalMargin: 3 },
          step11: { spvName: 'Lakshmi', gstin: '37ABCDE1234F1Z5' },
        },
      },
    },
  };
  const doc = buildIndividualDocument(dpr, { projectType: 'individual', projectName: 'Sri Lakshmi Hand Looms' });
  const zip = await JSZip.loadAsync(await generateIndividualDprDocx(doc));
  return {
    doc,
    xml: await zip.file('word/document.xml')!.async('string'),
    footer: await zip.file('word/footer1.xml')!.async('string'),
    styles: await zip.file('word/styles.xml')!.async('string'),
  };
}
const text = (xml: string) => xml.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

describe('individual DPR as DOCX (same structure as the PDF)', () => {
  for (const code of ['VANILLA', 'PMEGP']) {
    it(`${code}: A4 with 14 mm margins, Times New Roman, tables with header rows, numbered sections`, async () => {
      const { xml, styles } = await docxFor(code);
      assert.match(xml, /<w:pgSz w:w="11906" w:h="16838"/);
      assert.match(xml, /<w:pgMar[^>]*w:top="794"[^>]*/);
      assert.ok(styles.includes('Times New Roman'));
      assert.ok((xml.match(/<w:tbl>/g) || []).length >= 1, 'short answers are in tables');
      assert.ok((xml.match(/<w:tblHeader/g) || []).length >= 1, 'tables have a header row');
      const headings = xml.match(/w:val="Heading2"/g) || [];
      assert.ok(headings.length >= 2, 'contents heading plus the sections');
      const plain = text(xml);
      assert.match(plain, /DETAILED PROJECT REPORT/);
      assert.match(plain, /Table of Contents/);
      assert.match(plain, /Particular\s+Details/);
      assert.match(plain, /District: Guntur/);
      assert.ok(!plain.includes('Not filled'), 'empty answers read "—" as in the PDF');
    });
  }
  it('PMEGP gets the KVIC cover, other schemes the plain one', async () => {
    const pmegp = text((await docxFor('PMEGP')).xml);
    assert.match(pmegp, /KHADI & VILLAGE INDUSTRIES COMMISSION/);
    assert.match(pmegp, /PMEGP DETAILED PROJECT REPORT/);
    assert.ok(!/KHADI & VILLAGE/.test(text((await docxFor('VANILLA')).xml)));
  });
  it('long answers are question-and-answer blocks, not table cells', async () => {
    const { xml } = await docxFor('VANILLA');
    const plain = text(xml);
    assert.ok(plain.includes('We weave cotton and silk sarees.'));
    assert.ok(/w:shd [^>]*w:fill="F3F4F6"/.test(xml), 'question line is shaded like the PDF');
  });
  it('has page numbers and the AI disclaimer in the footer', async () => {
    const { footer } = await docxFor('VANILLA');
    assert.ok(footer.includes('PAGE') && footer.includes('NUMPAGES'));
    assert.ok(footer.includes('AI-generated document'));
  });
});
