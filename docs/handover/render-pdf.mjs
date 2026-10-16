import puppeteer from '../../server/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const dir = path.dirname(new URL(import.meta.url).pathname);
const htmlPath = path.join(dir, 'AI-DRP-Project-Handover.html');
const pdfPath = path.join(dir, 'AI-DRP-Project-Handover.pdf');

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate:
      '<div style="width:100%;font-size:8px;color:#64748b;padding:0 14mm;display:flex;justify-content:space-between;font-family:Calibri,Helvetica,sans-serif;"><span>MSME AI DPR — Project handover — feature/live_cust</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>',
    margin: { top: '14mm', bottom: '16mm', left: '12mm', right: '12mm' },
  });
  console.log(pdfPath);
} finally {
  await browser.close();
}
