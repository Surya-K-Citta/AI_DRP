import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import JSZip from 'jszip';
import { htmlToDocxBuffer } from './services/htmlToDocx.ts';
import { sanitizeRequest } from './lib/security/sanitizeInput.ts';

// A small report with the same structure as the on-screen document the PDF is printed from.
const PNG_1X1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const HTML = `<!doctype html><html><head><style>.x{color:red}</style><script>alert(1)</script></head><body>
<div class="dpr-document individual-dpr-document pdf-capture-root">
  <header class="individual-cover">
    <p class="cover-kicker">DETAILED PROJECT REPORT</p><p class="cover-on">On</p><p class="cover-action">Establishment of</p>
    <h1 class="cover-unit">Satyanarayana Fresh Juice Stall</h1>
    <div class="cover-scheme-block"><p class="cover-scheme">under 'PM SVANidhi'</p></div>
    <div class="cover-meta"><div><span>District</span>East Godavari</div><div><span>Location</span>Rajamahendravaram</div></div>
  </header>
  <section class="individual-toc"><h2 class="individual-sec-title"><span class="individual-sec-num">0</span>Table of Contents</h2>
    <ol class="individual-toc-list"><li><span class="toc-num">1</span><span class="toc-label">Cover &amp; vending eligibility</span></li><li><span class="toc-num">2</span><span class="toc-label">Vending activity</span></li></ol></section>
  <section class="individual-sec"><h2 class="individual-sec-title"><span class="individual-sec-num">1</span>Cover &amp; vending eligibility</h2>
    <div class="individual-sec-body">
      <table class="individual-particulars"><thead><tr><th>Particular</th><th>Details</th></tr></thead><tbody>
        <tr><td class="part">Loan tranche</td><td>Second tranche (up to ₹2 lakh)</td></tr>
        <tr><td class="part">Vending type / pitch</td><td>Fixed stall / kiosk</td></tr>
        <tr><td class="part">Hidden control</td><td><button>Edit</button>Visible text<span class="no-print">only on screen</span></td></tr></tbody></table>
      <article class="individual-qa-block"><h3 class="individual-qa-q">Short intro — what the unit does</h3><div class="individual-qa-a">Fixed street stall selling juice.<br/>Open 9 am to 9 pm.</div></article>
      <table class="fin-table"><caption>Machinery</caption><thead><tr><th>Item</th><th>Qty</th><th>Cost</th></tr></thead><tbody><tr><td>Juicer</td><td>2</td><td>0.4</td></tr></tbody></table>
      <img src="data:image/png;base64,${PNG_1X1}" width="1" height="1" />
    </div></section>
  <section class="individual-sec"><h2 class="individual-sec-title"><span class="individual-sec-num">2</span>Documents &amp; uploads</h2>
    <ul class="individual-doc-list"><li class="is-uploaded"><span class="doc-label">Aadhaar</span><span class="doc-status">Uploaded</span></li><li><span class="doc-label">Passbook</span><span class="doc-status">Not uploaded</span></li></ul></section>
</div></body></html>`;

async function build(html = HTML) {
  const zip = await JSZip.loadAsync(await htmlToDocxBuffer(html));
  const xml = await zip.file('word/document.xml')!.async('string');
  const plain = xml.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&apos;/g, "'").replace(/\s+/g, ' ');
  return { zip, xml, plain, footer: await zip.file('word/footer1.xml')!.async('string') };
}

describe('Word file from the on-screen report HTML', () => {
  it('keeps the content: every value as shown on screen, none of the scripts or hidden controls', async () => {
    const { plain } = await build();
    for (const text of ['DETAILED PROJECT REPORT', 'Establishment of', 'Second tranche (up to ₹2 lakh)', 'Fixed stall / kiosk', 'Visible text', 'Short intro — what the unit does', 'Fixed street stall selling juice.', 'Open 9 am to 9 pm.', 'Machinery', 'Juicer']) {
      assert.ok(plain.includes(text), text);
    }
    assert.ok(!plain.includes('alert(1)'), 'scripts are dropped');
    assert.ok(!plain.includes('only on screen'), 'no-print parts are dropped');
    assert.ok(!/\bEdit\b/.test(plain), 'buttons are dropped');
  });
  it('has the PDF structure: A4, 14 mm margins, centered cover, numbered section headings, tables with header rows', async () => {
    const { xml, plain } = await build();
    assert.match(xml, /<w:pgSz w:w="11906" w:h="16838"/);
    assert.match(xml, /<w:pgMar[^>]*w:left="794"/);
    assert.ok(/<w:jc w:val="center"\/>/.test(xml), 'cover is centered');
    assert.match(plain, /District: East Godavari/);
    assert.match(plain, /Location: Rajamahendravaram/);
    assert.equal((xml.match(/w:val="Heading2"/g) || []).length, 3, 'contents plus two sections');
    assert.match(plain, /1\s+Cover & vending eligibility/);
    assert.ok((xml.match(/<w:tbl>/g) || []).length >= 3, 'particulars, data table and upload list are tables');
    assert.ok((xml.match(/<w:tblHeader/g) || []).length >= 2, 'header rows repeat');
    assert.match(plain, /Particular\s+Details/);
  });
  it('shows the uploads list as label and status', async () => {
    const { plain } = await build();
    assert.match(plain, /Aadhaar\s+Uploaded/);
    assert.match(plain, /Passbook\s+Not uploaded/);
  });
  it('embeds data-URL pictures and puts the AI notice and page numbers in the footer', async () => {
    const { zip, footer } = await build();
    assert.ok(Object.keys(zip.files).some((name) => name.startsWith('word/media/')), 'picture is in the file');
    assert.ok(footer.includes('AI-generated document') && footer.includes('PAGE') && footer.includes('NUMPAGES'));
  });
  it('refuses HTML with no content', async () => {
    await assert.rejects(() => htmlToDocxBuffer('<html><body></body></html>'), /no content/);
  });
});

describe('report HTML is not stripped on its way to the export routes', () => {
  // The generic request cleaner removes markup from every body; the export routes take a whole HTML page and clean it
  // with the document sanitiser instead. Without this exemption the Word file lost every class and became plain text.
  for (const path of ['/api/dpr/abc/download/pdf/html', '/api/dpr/abc/download/docx/html']) {
    it(`keeps the markup for ${path}`, () => {
      const req: any = { method: 'POST', path, query: {}, params: {}, body: { html: '<div class="individual-cover"><p class="cover-kicker">Title</p></div>' } };
      sanitizeRequest(req, {} as any, () => undefined);
      assert.match(req.body.html, /class="individual-cover"/);
    });
  }
  it('still cleans other request bodies', () => {
    const req: any = { method: 'POST', path: '/api/dpr/abc/other', query: {}, params: {}, body: { text: '<script>alert(1)</script>hello' } };
    sanitizeRequest(req, {} as any, () => undefined);
    assert.ok(!/<script/i.test(req.body.text));
  });
});
