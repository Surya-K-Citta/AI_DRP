// PROJ: project records: create, list, open, edit, delete, validation, ownership. Real UI against the QA API and database.
import { before, after, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { dbCount, dbClose, launch, openPage, go, requireStack, api, signIn, clickText, typeInto, bodyText, waitFor, sleep, shot, unique } from '../lib/harness.mjs';

let browser;
before(async () => { await requireStack(); browser = await launch(); });
after(async () => { await browser?.close(); await dbClose(); });
const body = (name, extra = {}) => ({ projectName: name, projectType: 'individual', industrySector: 'Manufacturing', totalCost: 1000000, ownContribution: 200000, loanAmount: 800000, location: 'Guntur', businessDescription: 'QA description', targetMarket: 'QA market', ...extra });

async function fillProjectForm(page, name, { total = '1000000', own = '200000', loan = '800000' } = {}) {
  await go(page, '/projects/create', 1200);
  const TEXT = 'form input:not([type=number]):not([type=checkbox])';
  await page.waitForSelector(TEXT, { timeout: 8000 });
  const texts = await page.$$(TEXT);
  await typeInto(page, TEXT, name);
  await texts[2].click({ clickCount: 3 }); await texts[2].type('Guntur');
  const selects = await page.$$('form select');
  await selects[1].selectOption('Manufacturing');
  const numbers = await page.$$('form input[type=number]');
  for (const [box, value] of [[numbers[0], total], [numbers[1], own], [numbers[2], loan]]) { await box.click({ clickCount: 3 }); await box.type(value); }
}

describe('create', () => {
  test('PROJ-001 a project filled in through the form is saved and shown in the list', async () => {
    const name = unique('QA Unit');
    const page = await openPage(browser, { as: 'consultant' });
    await fillProjectForm(page, name);
    await page.evaluate(() => document.querySelector('form button[type=submit]').click());
    await waitFor(page, () => location.pathname === '/projects', undefined, 15000).catch(async () => { await shot(page, 'fail-PROJ-001'); throw new Error(`stayed on ${new URL(page.url()).pathname}: ${(await bodyText(page)).slice(0, 300)}`); });
    await waitFor(page, (n) => document.body.innerText.includes(n), name);
    const { token } = await signIn('consultant');
    const list = await api('GET', '/projects', undefined, token);
    assert.ok(JSON.stringify(list.body).includes(name), 'the API has the project');
    await page.close();
  });

  test('PROJ-002 required fields stop an empty form (nothing is sent)', async () => {
    const page = await openPage(browser, { as: 'consultant' });
    await go(page, '/projects/create', 1000);
    await page.evaluate(() => document.querySelector('form button[type=submit]').click());
    await sleep(700);
    assert.equal(new URL(page.url()).pathname, '/projects/create');
    assert.equal(await page.evaluate(() => [...document.querySelectorAll('form [required]')].some((el) => !el.checkValidity())), true);
    await page.close();
  });

  test('PROJ-003 the server rejects a project with a missing name, a bad type or a non-numeric cost', async () => {
    const { token } = await signIn('consultant');
    for (const [label, bad] of [['no name', { projectName: '' }], ['bad type', { projectType: 'weird' }], ['text cost', { totalCost: 'abc' }], ['no location', { location: '' }]]) {
      const r = await api('POST', '/projects', body(unique('bad'), bad), token);
      assert.equal(r.status, 400, `${label} → ${r.status}`);
    }
    assert.equal((await api('POST', '/projects', body('x'))).status, 401, 'signed-out creation is refused');
  });

  test('PROJ-004 boundary: a very long name and unusual characters are stored safely, not executed', async () => {
    const { token } = await signIn('consultant');
    const nasty = `<img src=x onerror=alert(1)> ${'ñ'.repeat(40)} ${unique('long')}`;
    const made = await api('POST', '/projects', body(nasty), token);
    assert.ok([201, 400].includes(made.status), `status ${made.status}`);
    if (made.status === 201) {
      const page = await openPage(browser, { as: 'consultant' });
      let alerted = false;
      page.on('dialog', async (d) => { alerted = true; await d.dismiss(); });
      await go(page, '/projects', 2500);
      assert.equal(alerted, false, 'script in a name never runs');
      await page.close();
    }
  });

  test('PROJ-005 boundary: zero and negative money values are handled (not a server error)', async (t) => {
    const { token } = await signIn('consultant');
    const statuses = {};
    for (const cost of [0, -1]) statuses[cost] = (await api('POST', '/projects', body(unique('edge'), { totalCost: cost }), token)).status;
    assert.ok(statuses[0] < 500, `totalCost 0 → ${statuses[0]}`);
    if (statuses[-1] >= 500) { t.todo(`BUG-007 a negative totalCost returns ${statuses[-1]} (should be 400)`); return; }
    assert.ok(statuses[-1] < 500);
  });
});

describe('read, update, delete', () => {
  test('PROJ-010 a project opens from its own address and shows its details', async () => {
    const { token } = await signIn('consultant');
    const name = unique('QA Open');
    const made = await api('POST', '/projects', body(name), token);
    assert.equal(made.status, 201);
    const id = made.body.data._id || made.body.data.id || made.body.data.project?._id;
    const page = await openPage(browser, { as: 'consultant' });
    await go(page, `/projects/${id}`, 2500);
    await waitFor(page, (n) => [...document.querySelectorAll('input')].some((i) => i.value === n), name);
    await page.close();
  });

  test('PROJ-011 editing a project through the API changes only that project and keeps the rest', async () => {
    const { token } = await signIn('consultant');
    const name = unique('QA Edit');
    const made = await api('POST', '/projects', body(name), token);
    const id = made.body.data._id || made.body.data.id;
    const upd = await api('PUT', `/projects/${id}`, { location: 'Vijayawada' }, token);
    assert.equal(upd.status, 200);
    const got = await api('GET', `/projects/${id}`, undefined, token);
    const project = got.body.data.project || got.body.data;
    assert.equal(project.location, 'Vijayawada');
    assert.equal(project.projectName, name, 'untouched fields stay');
  });

  test('PROJ-012 deleting a project from the list asks first, then removes it', async () => {
    const { token } = await signIn('consultant');
    const name = unique('QA Delete');
    const made = await api('POST', '/projects', body(name), token);
    const id = made.body.data._id || made.body.data.id;
    const page = await openPage(browser, { as: 'consultant' });
    await go(page, '/projects', 2500);
    await waitFor(page, (n) => document.body.innerText.includes(n), name);
    const deleted = await page.evaluate((n) => {
      const card = [...document.querySelectorAll('main *')].filter((el) => el.textContent.includes(n)).pop();
      // The trash button is the card's icon-only button (it has no text and, today, no name: BUG-008).
      let node = card; while (node && ![...node.querySelectorAll('button')].some((b) => !b.textContent.trim())) node = node.parentElement;
      const btn = node && [...node.querySelectorAll('button')].find((b) => !b.textContent.trim());
      if (!btn) return false; btn.click(); return true;
    }, name);
    if (!deleted) { await shot(page, 'fail-PROJ-012'); assert.fail('no delete button found for the project card'); }
    await sleep(500);
    await waitFor(page, () => !!document.querySelector('[role=alertdialog]'));
    await clickText(page, '[role=alertdialog] button', /^(Delete|Yes|Confirm)/i);
    await sleep(1500);
    assert.equal((await api('GET', `/projects/${id}`, undefined, token)).status, 404, 'the project is gone');
    await page.close();
  });

  test('PROJ-013 deleting a project also removes its saved DPR drafts (no orphans)', async (t) => {
    const { token } = await signIn('consultant');
    const saved = await api('POST', '/dpr/cluster/draft/save', { clusterData: { step1: { unitName: unique('QA Orphan'), location: 'Guntur' }, isIndividualDPR: true, currentStep: 1 } }, token);
    assert.equal(saved.status, 200);
    const { projectId } = saved.body.data;
    assert.ok((await dbCount('dprversions', { projectId })) >= 1, 'a draft version exists before');
    assert.equal((await api('DELETE', `/projects/${projectId}`, undefined, token)).status, 200);
    const left = await dbCount('dprversions', { projectId });
    if (left > 0) { t.todo(`BUG-010 deleting a project leaves ${left} DPR version(s) behind in the database`); return; }
    assert.equal(left, 0);
  });
});

describe('ownership', () => {
  test('PROJ-020 another person cannot read, change or delete my project', async () => {
    const mine = await signIn('consultant');
    const other = await signIn('consultant2');
    const made = await api('POST', '/projects', body(unique('QA Private')), mine.token);
    const id = made.body.data._id || made.body.data.id;
    assert.equal((await api('GET', `/projects/${id}`, undefined, other.token)).status, 404);
    assert.equal((await api('PUT', `/projects/${id}`, { location: 'Hacked' }, other.token)).status, 404);
    assert.equal((await api('DELETE', `/projects/${id}`, undefined, other.token)).status, 404);
    const list = await api('GET', '/projects', undefined, other.token);
    assert.ok(!JSON.stringify(list.body).includes(id), 'not in their list');
    assert.equal((await api('GET', `/projects/${id}`, undefined, mine.token)).status, 200, 'still there for the owner');
  });
});
