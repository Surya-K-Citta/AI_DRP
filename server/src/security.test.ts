import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sanitizeValue } from './lib/security/sanitizeInput.ts';
import { cleanCss, sanitizeHtmlDocument } from './lib/security/sanitizeHtmlDoc.ts';
import { detectFileType, extensionForMime, safeFileName, verifyBuffer } from './lib/security/uploadGuard.ts';
import { contentDisposition, escapeRegex, isInside } from './lib/security/http.ts';
import { isAllowedPdfRequest, lockDownPage } from './lib/security/pdfPage.ts';

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const pdf = Buffer.from('%PDF-1.7\n1 0 obj\n');
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
const docx = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from('[Content_Types].xml word/document.xml')]);

describe('request sanitising (NoSQL injection, prototype pollution, scripts)', () => {
  it('drops Mongo operators at any depth', () => {
    const out: any = sanitizeValue({ email: { $ne: null }, filter: { $where: 'sleep(5000)', ok: 1 }, list: [{ $gt: '' }, 'a'] });
    assert.deepEqual(out, { email: {}, filter: { ok: 1 }, list: [{}, 'a'] });
  });
  it('drops prototype-pollution keys', () => {
    const out: any = sanitizeValue(JSON.parse('{"__proto__":{"admin":true},"constructor":{"x":1},"a":1}'));
    assert.deepEqual(Object.keys(out), ['a']);
    assert.equal(({} as any).admin, undefined);
  });
  it('removes control characters but keeps normal text, line breaks and Telugu', () => {
    assert.equal(sanitizeValue('a\u0000b\u0007c\nd\te'), 'abc\nd\te');
    assert.equal(sanitizeValue('పరిశ్రమ వివరణ'), 'పరిశ్రమ వివరణ');
  });
  it('neutralises script markup', () => {
    for (const bad of [
      '<script>alert(1)</script>hello',
      '<img src=x onerror=alert(1)>hello',
      '<svg onload=alert(1)>hello',
      '<iframe src="javascript:alert(1)"></iframe>hello',
      '<a href="javascript:alert(1)">hello</a>',
      '<a href="  JaVaScRiPt:alert(1)">hello</a>',
      '<div onclick="steal()">hello</div>',
      '<object data="x"></object>hello',
      '<style>@import url(http://evil)</style>hello',
    ]) {
      const out = String(sanitizeValue(bad));
      assert.ok(!/<script|<iframe|<object|<svg|<img|<style|onerror|onload|onclick|javascript:|@import/i.test(out), `${bad} -> ${out}`);
      assert.ok(out.includes('hello'), bad);
    }
  });
  it('leaves ordinary text with < > & exactly as typed', () => {
    for (const text of ['< 5 years', '> 10 employees', 'A & B Traders', 'salary > 10000 and age < 60', '3 < 5 && 5 > 3', 'Rs. 5,00,000 (approx.)']) {
      assert.equal(sanitizeValue(text), text);
    }
  });
  it('never rewrites passwords or tokens', () => {
    const out: any = sanitizeValue({ password: '<b>pass</b>\u0000', newPassword: '<script>x</script>', token: 'a<b>c', note: '<script>x</script>ok' });
    assert.equal(out.password, '<b>pass</b>\u0000');
    assert.equal(out.newPassword, '<script>x</script>');
    assert.equal(out.token, 'a<b>c');
    assert.equal(out.note.includes('script'), false);
  });
  it('keeps safe formatting', () => {
    assert.equal(sanitizeValue('<b>bold</b> and <i>italic</i>'), '<b>bold</b> and <i>italic</i>');
  });
});

describe('HTML sanitising for PDF', () => {
  const html = (body: string, head = '') => `<!doctype html><html><head><style>.a{color:red}${head}</style></head><body>${body}</body></html>`;
  it('removes scripts, frames and handlers but keeps the document', () => {
    const out = sanitizeHtmlDocument(html('<div class="a" onclick="x()">Hi</div><script>fetch("http://evil")</script><iframe src="file:///etc/passwd"></iframe><table><tr><td colspan="2">Cell</td></tr></table>'));
    assert.ok(!/<script|<iframe|onclick|evil|file:/i.test(out), out);
    assert.ok(out.includes('class="a"') && out.includes('<td colspan="2">Cell</td>') && out.includes('.a{color:red}'));
  });
  it('removes file and network images, keeps data images', () => {
    const out = sanitizeHtmlDocument(html('<img src="file:///etc/passwd"><img src="http://169.254.169.254/x"><img src="data:image/png;base64,iVBORw0KGgo=">'));
    assert.ok(!out.includes('file:') && !out.includes('169.254'), out);
    assert.ok(out.includes('data:image/png;base64,iVBORw0KGgo='));
  });
  it('removes @import, external url() and expression() from styles', () => {
    assert.ok(!/@import|evil/i.test(cleanCss('@import url(http://evil/a.css); .x{background:url(http://evil/b.png)}')));
    const out = sanitizeHtmlDocument(html('<p style="background:url(http://evil/x);color:blue;width:expression(alert(1))">t</p>', '@import "http://evil/c.css";'));
    assert.ok(!/evil|expression/i.test(out), out);
    assert.match(out, /color:\s*blue/);
  });
  it('strips javascript: links', () => {
    const out = sanitizeHtmlDocument(html('<a href="javascript:alert(1)">x</a><a href="https://example.com">y</a>'));
    assert.ok(!out.includes('javascript:') && out.includes('https://example.com'));
  });
});

describe('upload verification reads the file, not the name', () => {
  it('recognises the accepted types by their first bytes', () => {
    assert.equal(detectFileType(png)?.mime, 'image/png');
    assert.equal(detectFileType(jpeg)?.mime, 'image/jpeg');
    assert.equal(detectFileType(pdf)?.mime, 'application/pdf');
    assert.equal(detectFileType(docx)?.ext, '.docx');
    assert.equal(detectFileType(Buffer.from('plain notes ఇది'))?.kind, 'text');
  });
  it('refuses HTML or script sent as an image, and unknown binaries', () => {
    const html = Buffer.from('<html><script>alert(1)</script></html>');
    assert.equal(verifyBuffer(html, ['image']).ok, false);
    assert.equal(verifyBuffer(Buffer.from('<?php system($_GET[0]); ?>'), ['image']).ok, false);
    assert.equal(verifyBuffer(Buffer.from([0x4d, 0x5a, 0x90, 0, 3, 0, 0, 0]), ['image', 'document', 'text']).ok, false);
    assert.equal(verifyBuffer(Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from('some.zip')]), ['document']).ok, false);
    assert.equal(verifyBuffer(Buffer.alloc(0), ['image']).ok, false);
  });
  it('only accepts the kinds the endpoint asks for', () => {
    assert.equal(verifyBuffer(png, ['image']).ok, true);
    assert.equal(verifyBuffer(png, ['document']).ok, false);
    assert.equal(verifyBuffer(pdf, ['image']).ok, false);
  });
  it('builds safe names and extensions', () => {
    assert.equal(safeFileName('../../etc/passwd'), 'passwd');
    assert.equal(safeFileName('a\\b\\c.png'), 'c.png');
    assert.ok(!/[<>"&;]/.test(safeFileName('"><script>alert(1)</script>.png')));
    assert.equal(extensionForMime('image/png'), '.png');
    assert.equal(extensionForMime('text/html'), '.bin');
  });
});

describe('http helpers', () => {
  it('escapes regular expressions', () => {
    assert.equal(new RegExp(escapeRegex('(a+)+$')).test('(a+)+$'), true);
    assert.equal(new RegExp(escapeRegex('.*')).test('anything'), false);
  });
  it('keeps paths inside their folder', () => {
    assert.equal(isInside('/srv/uploads', '/srv/uploads/a.pdf'), true);
    assert.equal(isInside('/srv/uploads', '/srv/uploads/../.env'), false);
    assert.equal(isInside('/srv/uploads', '/srv/uploads-evil/a'), false);
  });
  it('cannot be broken out of through a file name', () => {
    const header = contentDisposition('inline', 'a"; filename="evil.html\r\nX-Injected: 1');
    assert.ok(!/\r|\n/.test(header) && header.split('filename="').length === 2, header);
  });
});

describe('PDF page lock-down', () => {
  it('only lets data URIs load', () => {
    assert.equal(isAllowedPdfRequest('data:image/png;base64,AAAA'), true);
    assert.equal(isAllowedPdfRequest('about:blank'), true);
    for (const url of ['http://169.254.169.254/latest/meta-data', 'https://example.com/x.css', 'file:///etc/passwd', 'ftp://x']) {
      assert.equal(isAllowedPdfRequest(url), false, url);
    }
  });
  it('turns JavaScript off and aborts everything else', async () => {
    const calls: string[] = [];
    let handler: any;
    const page = {
      setJavaScriptEnabled: async (v: boolean) => calls.push(`js:${v}`),
      setRequestInterception: async (v: boolean) => calls.push(`intercept:${v}`),
      on: (_e: string, h: any) => { handler = h; },
    };
    const blocked: string[] = [];
    await lockDownPage(page as any, blocked);
    assert.deepEqual(calls, ['js:false', 'intercept:true']);
    const results: string[] = [];
    for (const url of ['data:text/plain,hi', 'http://evil/x']) handler({ url: () => url, continue: () => results.push(`ok ${url}`), abort: () => results.push(`blocked ${url}`) });
    assert.deepEqual(results, ['ok data:text/plain,hi', 'blocked http://evil/x']);
    assert.deepEqual(blocked, ['http://evil/x']);
  });
});
