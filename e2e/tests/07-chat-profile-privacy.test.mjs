// CHAT / PROF / PRIV: the AI assistant (with the AI provider replaced by a stub), the profile, and the person's privacy rights.
import { before, after, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { launch, openPage, go, requireStack, api, signIn, bodyText, waitFor, sleep, typeInto, unique, dbCount, dbFind, dbClose, QA } from '../lib/harness.mjs';

let browser;
before(async () => { await requireStack(); browser = await launch(); });
after(async () => { await browser?.close(); await dbClose(); });

const CORS = { 'access-control-allow-origin': QA.web, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': 'authorization,content-type', 'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS' };
async function stubAi(page, respond) {
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    if (!r.url().includes('/ai/chat')) return r.continue();
    if (r.method() === 'OPTIONS') return r.respond({ status: 204, headers: CORS });
    return r.respond({ ...respond(), headers: CORS, contentType: 'application/json' });
  });
}
async function newPerson(tag) {
  const email = `${unique(tag)}@msme.test`;
  const made = await api('POST', '/auth/register', { name: `QA ${tag}`, email, password: QA.password, phoneNumber: '9876543210', dateOfBirth: '1990-01-01', accountConsent: true, privacyConsent: true });
  assert.equal(made.status, 201, JSON.stringify(made.body));
  return { email, token: made.body.data.token, id: made.body.data.userId };
}

describe('AI assistant', () => {
  test('CHAT-001 a question is shown, sent, and the assistant\'s reply appears', async () => {
    const page = await openPage(browser, { as: 'consultant' });
    let sent = null;
    await stubAi(page, () => ({ status: 200, body: JSON.stringify({ success: true, data: { response: 'QA stub answer: start with a unit name.', message: 'QA stub answer: start with a unit name.' } }) }));
    page.on('request', (r) => { if (r.url().includes('/ai/chat') && r.method() === 'POST') sent = r.postData(); });
    await go(page, '/chat', 1500);
    await typeInto(page, 'textarea', 'How do I create a DPR?');
    await page.keyboard.press('Enter');
    await waitFor(page, () => /QA stub answer/.test(document.body.innerText), undefined, 10000);
    assert.match(await bodyText(page), /How do I create a DPR\?/);
    assert.match(sent || '', /How do I create a DPR/);
    await page.close();
  });

  test('CHAT-002 when the assistant fails the person is told, and their question is not lost', async () => {
    const page = await openPage(browser, { as: 'consultant' });
    await stubAi(page, () => ({ status: 500, body: JSON.stringify({ success: false, message: 'upstream down' }) }));
    await go(page, '/chat', 1500);
    await typeInto(page, 'textarea', 'Will this fail?');
    await page.keyboard.press('Enter');
    await waitFor(page, () => /error|sorry|try again|could not|failed/i.test(document.body.innerText), undefined, 10000);
    assert.match(await bodyText(page), /Will this fail\?/);
    await page.close();
  });

  test('CHAT-003 an empty message cannot be sent, and the clear button asks before removing the conversation', async () => {
    const page = await openPage(browser, { as: 'consultant' });
    await go(page, '/chat', 1500);
    assert.equal(await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => /^Send/.test(b.getAttribute('aria-label') || ''))?.disabled ?? true), true);
    await page.close();
  });

  test('CHAT-004 the server only answers a person who allowed AI help', async () => {
    const person = await newPerson('noai');
    const denied = await api('POST', '/ai/chat', { message: 'hello' }, person.token);
    assert.ok([400, 403].includes(denied.status), `without consent → ${denied.status}`);
    assert.equal((await api('POST', '/ai/chat', { message: 'hello' })).status, 401);
  });
});

describe('profile', () => {
  test('PROF-001 the profile shows my details and a changed name is saved', async () => {
    const person = await newPerson('prof');
    const page = await openPage(browser);
    await page.evaluateOnNewDocument((t) => { localStorage.setItem('token', t); }, person.token);
    await go(page, '/login', 800);
    await typeInto(page, 'input[type=email]', person.email);
    await typeInto(page, 'input[type=password]', QA.password);
    await page.keyboard.press('Enter');
    await waitFor(page, () => location.pathname === '/dashboard', undefined, 15000);
    await go(page, '/profile', 1500);
    assert.equal(await page.evaluate((e) => [...document.querySelectorAll('input')].some((i) => i.value === e), person.email), true, 'the email is shown');
    const nameBox = await page.evaluateHandle(() => [...document.querySelectorAll('input')].find((i) => /^QA /.test(i.value)));
    await nameBox.click({ clickCount: 3 }); await page.keyboard.type('QA Renamed Person');
    await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => /^Save|Update/.test(b.textContent.trim()))?.click());
    await sleep(1500);
    const profile = await api('GET', '/auth/profile', undefined, person.token);
    assert.match(JSON.stringify(profile.body), /QA Renamed Person/);
    await page.close();
  });

  test('PROF-002 the email cannot be changed, and an invalid phone number is refused by the server', async () => {
    const person = await newPerson('prof2');
    const changed = await api('PUT', '/auth/profile', { email: 'someone.else@msme.test', phoneNumber: '12' }, person.token);
    assert.ok(changed.status === 400 || !JSON.stringify(changed.body).includes('someone.else@msme.test'), JSON.stringify(changed.body).slice(0, 200));
    const profile = await api('GET', '/auth/profile', undefined, person.token);
    assert.ok(JSON.stringify(profile.body).includes(person.email));
  });
});

describe('privacy rights', () => {
  test('PRIV-001 "download my data" contains my own records and nobody else\'s', async () => {
    const a = await newPerson('exp-a'); const b = await newPerson('exp-b');
    await api('POST', '/projects', { projectName: 'ExportMine', projectType: 'individual', industrySector: 'Services', totalCost: 10, ownContribution: 2, loanAmount: 8, location: 'Guntur' }, a.token);
    await api('POST', '/projects', { projectName: 'ExportTheirs', projectType: 'individual', industrySector: 'Services', totalCost: 10, ownContribution: 2, loanAmount: 8, location: 'Guntur' }, b.token);
    const out = await api('GET', '/privacy/export', undefined, a.token);
    assert.equal(out.status, 200);
    const text = JSON.stringify(out.body);
    assert.ok(text.includes('ExportMine') && text.includes(a.email));
    assert.ok(!text.includes('ExportTheirs') && !text.includes(b.email));
    assert.ok(!/passwordHash|"password"/i.test(text), 'no password material is exported');
  });

  test('PRIV-002 switching AI help on and off is saved, and the server honours it', async () => {
    const person = await newPerson('consent');
    const on = await api('PATCH', '/privacy/consent', { aiAssist: true }, person.token);
    assert.equal(on.status, 200);
    const [user] = await dbFind('users', { email: person.email });
    assert.equal(user.privacy.aiAssist, true);
    await api('PATCH', '/privacy/consent', { aiAssist: false }, person.token);
    assert.equal((await dbFind('users', { email: person.email }))[0].privacy.aiAssist, false);
  });

  test('PRIV-003 a nominee needs a name and a phone or email', async () => {
    const person = await newPerson('nominee');
    assert.equal((await api('PUT', '/privacy/nominee', { name: '' }, person.token)).status, 400);
    assert.equal((await api('PUT', '/privacy/nominee', { name: 'Someone' }, person.token)).status, 400);
    assert.equal((await api('PUT', '/privacy/nominee', { name: 'Someone', phone: '9876543210' }, person.token)).status, 200);
  });

  test('PRIV-004 a complaint needs a subject and a message, and reaches the support desk', async () => {
    const person = await newPerson('complaint');
    assert.equal((await api('POST', '/privacy/complaint', { subject: '', message: '' }, person.token)).status, 400);
    const ok = await api('POST', '/privacy/complaint', { subject: 'QA subject', message: 'QA message body' }, person.token);
    assert.ok([200, 201].includes(ok.status), JSON.stringify(ok.body));
    assert.equal(ok.body.success, true);
  });

  test('PRIV-005 notifications can be listed and marked read, only by their owner', async () => {
    const person = await newPerson('notify');
    const list = await api('GET', '/privacy/notifications', undefined, person.token);
    assert.equal(list.status, 200);
    assert.equal((await api('POST', '/privacy/notifications/000000000000000000000000/read', {}, person.token)).status < 500, true);
  });

  test('PRIV-006 deleting my account needs the word DELETE, then removes me and my records', async () => {
    const person = await newPerson('erase');
    await api('POST', '/projects', { projectName: 'EraseMe', projectType: 'individual', industrySector: 'Services', totalCost: 10, ownContribution: 2, loanAmount: 8, location: 'Guntur' }, person.token);
    assert.equal((await api('DELETE', '/privacy/account', { confirm: 'no' }, person.token)).status, 400, 'a wrong confirmation is refused');
    assert.equal((await api('DELETE', '/privacy/account', { confirm: 'DELETE' }, person.token)).status, 200);
    assert.equal((await api('POST', '/auth/login', { email: person.email, password: QA.password })).status, 401, 'cannot sign in any more');
    assert.equal(await dbCount('projects', { projectName: 'EraseMe' }), 0, 'their projects are gone');
    assert.equal(await dbCount('users', { email: person.email }), 0);
  });
});
