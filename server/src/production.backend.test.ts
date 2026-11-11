import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ageFromDob, isUnder18Age, payloadHasUnder18Applicant, under18Response } from './lib/under18.ts';
import { sanitizeForAi } from './lib/sanitizeForAi.ts';
import { getJwtSecret } from './lib/jwtSecret.ts';
import {
  AI_REFUSED_MESSAGE,
  AUDIT_RETENTION_MONTHS,
  DATA_FIDUCIARY_ADDRESS,
  DATA_FIDUCIARY_NAME,
  DELETION_WARNING_DAYS,
  DRAFT_RETENTION_MONTHS,
  GRIEVANCE_EMAIL,
  PRIVACY_NOTICE_VERSION,
  PRIVACY_OFFICER_NAME,
  PRIVACY_OFFICER_ROLE,
  UNDER_18_CODE,
} from './lib/privacyNotice.ts';
import { auditRetentionDays, retentionIdleDays, retentionWarningDays } from './lib/kycStorage.ts';
import { pdfOptionsFromCapturedHtml } from './lib/pdfPageOptions.ts';
import { canSaveSchemeDefault, cleanDocumentStyle, SCHEME_CODE } from './lib/schemeStyleRules.ts';
import { roleAllowed } from './lib/roleGate.ts';

const here = dirname(fileURLToPath(import.meta.url));

describe('roles', () => {
  it('lets a super admin through and stops everyone else', () => {
    assert.equal(roleAllowed(undefined, ['admin']), 'unauthenticated');
    assert.equal(roleAllowed('consultant', ['admin', 'super_admin']), 'forbidden');
    assert.equal(roleAllowed('govt_official', ['admin']), 'forbidden');
    assert.equal(roleAllowed('super_admin', ['admin', 'super_admin']), 'ok');
    assert.equal(roleAllowed('admin', ['admin']), 'ok');
  });

  it('saves a scheme default only for super admin or legacy admin', () => {
    assert.equal(canSaveSchemeDefault('super_admin'), true);
    assert.equal(canSaveSchemeDefault('admin'), true);
    assert.equal(canSaveSchemeDefault('consultant'), false);
    assert.equal(canSaveSchemeDefault('officer'), false);
    assert.equal(canSaveSchemeDefault(null), false);
  });
});

describe('scheme style payload', () => {
  it('accepts a real scheme code and rejects a short or empty one', () => {
    assert.equal(SCHEME_CODE.test('PMEGP'), true);
    assert.equal(SCHEME_CODE.test('AP_CMEP'), true);
    assert.equal(SCHEME_CODE.test('A'), false);
    assert.equal(SCHEME_CODE.test('pmegp'), false);
    assert.equal(SCHEME_CODE.test(''), false);
  });

  it('keeps a style object and drops a list or a huge payload', () => {
    assert.deepEqual(cleanDocumentStyle({ preset: 'government' }), { preset: 'government' });
    assert.equal(cleanDocumentStyle(['government']), null);
    assert.equal(cleanDocumentStyle(null), null);
    assert.equal(cleanDocumentStyle({ blob: 'x'.repeat(1_500_001) }), null);
  });

  it('registers scheme style before the DPR id route', () => {
    const routes = readFileSync(join(here, 'routes/dpr.routes.ts'), 'utf8');
    const scheme = routes.indexOf("'/scheme-style/:schemeCode'");
    const byId = routes.indexOf("'/:dprId'");
    assert.ok(scheme > 0);
    assert.ok(byId > scheme);
  });
});

describe('captured PDF page', () => {
  it('uses the styled page size and vertical edge', () => {
    const html = '<div class="individual-dpr-document" data-dpr-styled="1" data-page-size="A3" data-page-edge-top="18" data-page-edge-bottom="14"></div>';
    assert.deepEqual(pdfOptionsFromCapturedHtml(html), {
      marginTop: '18mm',
      marginBottom: '14mm',
      marginLeft: '0',
      marginRight: '0',
      format: 'A3',
      preferCssPageSize: true,
    });
  });

  it('uses 16mm for an unstyled individual report and nothing for other HTML', () => {
    assert.deepEqual(pdfOptionsFromCapturedHtml('<div class="individual-dpr-document"></div>'), { margin: '16mm' });
    assert.equal(pdfOptionsFromCapturedHtml('<div class="cluster"></div>'), undefined);
  });

  it('falls back to A4 and 12mm when a styled report omits the size', () => {
    const options = pdfOptionsFromCapturedHtml('<div data-dpr-styled="1"></div>');
    assert.equal(options && 'format' in options && options.format, 'A4');
    assert.equal(options && 'marginTop' in options && options.marginTop, '12mm');
  });
});

describe('under 18', () => {
  it('treats 17 as under 18 and 18 as old enough', () => {
    assert.equal(isUnder18Age(17), true);
    assert.equal(isUnder18Age('17'), true);
    assert.equal(isUnder18Age(18), false);
    assert.equal(isUnder18Age(''), false);
    assert.equal(isUnder18Age(-1), false);
  });

  it('finds an under-18 age on the applicant and ignores a blank form', () => {
    assert.equal(payloadHasUnder18Applicant({ step1: { entrepreneurAge: 16 } }), true);
    assert.equal(payloadHasUnder18Applicant({ schemeExtras: { applicantAge: 15 } }), true);
    assert.equal(payloadHasUnder18Applicant({ step1: { entrepreneurAge: 30 } }), false);
    assert.equal(payloadHasUnder18Applicant(null), false);
  });

  it('returns the guardian refusal', () => {
    const body = under18Response();
    assert.equal(body.success, false);
    assert.equal(body.code, UNDER_18_CODE);
    assert.match(body.message, /18 or older/);
  });
});

describe('AI sanitizer and secrets', () => {
  it('strips Aadhaar, PAN, and file URLs before an AI call', () => {
    const clean = sanitizeForAi({
      unitName: 'Kavya Silks',
      aadhaar: '1234 5678 9012',
      note: 'PAN ABCDE1234F and https://res.cloudinary.com/demo/image/upload/kyc.jpg',
      panNumber: 'ABCDE1234F',
    });
    assert.equal(clean.unitName, 'Kavya Silks');
    assert.equal('aadhaar' in clean, false);
    assert.equal('panNumber' in clean, false);
    assert.match(String(clean.note), /\[PAN_REDACTED\]/);
    assert.match(String(clean.note), /\[FILE_URL_REDACTED\]/);
  });

  it('refuses a weak JWT secret in production and allows a real one', () => {
    const previousNode = process.env.NODE_ENV;
    const previousSecret = process.env.JWT_SECRET;
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'secret';
    assert.throws(() => getJwtSecret(), /JWT_SECRET/);
    process.env.JWT_SECRET = 'a-long-unique-production-secret';
    assert.equal(getJwtSecret(), 'a-long-unique-production-secret');
    process.env.NODE_ENV = previousNode;
    process.env.JWT_SECRET = previousSecret;
  });
});

describe('privacy notice', () => {
  it('keeps the current notice version and the AI-off message', () => {
    assert.equal(PRIVACY_NOTICE_VERSION, '2026-10-1');
    assert.match(AI_REFUSED_MESSAGE, /AI features are off/);
  });

  it('names the department, officer, address and monitored mailbox it gave in writing', () => {
    assert.equal(DATA_FIDUCIARY_NAME, 'AP MSME Development Corporation');
    assert.match(DATA_FIDUCIARY_ADDRESS, /PVS Landmark, Mangalagiri, Guntur District – 522503/);
    assert.equal(PRIVACY_OFFICER_NAME, 'A Sudhakar');
    assert.match(PRIVACY_OFFICER_ROLE, /Executive Director/);
    assert.equal(GRIEVANCE_EMAIL, 'apmsmedc@gmail.com');
    assert.doesNotMatch(GRIEVANCE_EMAIL, /msmeone/);
  });

  it('keeps the approved retention policy: 12 months, 15-day warning, 24-month audit', () => {
    assert.equal(DRAFT_RETENTION_MONTHS, 12);
    assert.equal(DELETION_WARNING_DAYS, 15);
    assert.equal(AUDIT_RETENTION_MONTHS, 24);
    assert.equal(retentionIdleDays(), 365);
    assert.equal(retentionWarningDays(), 15);
    assert.equal(auditRetentionDays(), 730);
  });
});
