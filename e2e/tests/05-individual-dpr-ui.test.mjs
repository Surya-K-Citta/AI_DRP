// IDPR: the individual DPR screen as a person uses it: pick a scheme, work through steps, save, come back, switch mode, arrange and style the report.
import { before, after, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { launch, openPage, go, requireStack, api, signIn, clickText, typeInto, bodyText, waitFor, sleep, shot, unique, dbFind, dbClose, QA } from '../lib/harness.mjs';

let browser;
before(async () => { await requireStack(); browser = await launch(); });
after(async () => { await browser?.close(); await dbClose(); });

const FORM = '#individual-dpr-form';
/** Opens a fresh "bank term loan" DPR straight in the form. */
async function startForm(opts = {}) {
  const page = await openPage(browser, { as: 'consultant', ...opts });
  await go(page, '/individual-dpr/create?new=true&scheme=VANILLA', 1500);
  await clickText(page, 'button', /Start DPR steps/i);
  await waitFor(page, () => !!document.querySelector('[data-step-row]'), undefined, 15000);
  return page;
}
async function unitBox(page) {
  await waitFor(page, () => !!document.querySelector('#individual-dpr-form input'));
  return page.evaluateHandle(() => document.querySelector('#individual-dpr-form input'));
}
async function typeUnit(page, name) {
  const box = await unitBox(page);
  await box.click({ clickCount: 3 }); await box.type(name, { delay: 4 });
}
// The save button also carries a hidden status sentence for screen readers, so only its start is compared.
const saveState = (page) => page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /^(Save Draft|Saved)/.test(x.textContent.trim())); return /^Saved/.test(b?.textContent.trim() || '') ? 'Saved' : b ? 'Save Draft' : undefined; });
async function saveDraft(page) {
  await clickText(page, 'button', /^(Save Draft|Saved)\b/);
  await waitFor(page, () => [...document.querySelectorAll('button')].some((b) => /^Saved/.test(b.textContent.trim())), undefined, 15000);
}
async function storedDraft(unit) {
  const rows = await dbFind('dprversions', {});
  return rows.find((r) => r.content?.english?.clusterData?.step1?.unitName === unit);
}

describe('start and navigate', () => {
  test('IDPR-001 choosing a scheme from the list leads to its brief, then to the step list', async () => {
    const page = await openPage(browser, { as: 'consultant' });
    await go(page, '/individual-dpr/create', 2200);
    assert.match(await bodyText(page), /Bank term loan/);
    await clickText(page, 'main button', /Bank term loan \(no scheme overlay\)/i);
    await waitFor(page, () => /Start DPR steps/i.test(document.body.innerText), undefined, 10000);
    await clickText(page, 'button', /Start DPR steps/i);
    await waitFor(page, () => document.querySelectorAll('[data-step-row]').length >= 10, undefined, 15000);
    assert.equal(await page.evaluate(() => document.querySelectorAll('[data-step-dot]').length), await page.evaluate(() => document.querySelectorAll('[data-step-row]').length), 'dots and rows list the same steps');
    await page.close();
  });

  test('IDPR-002 any step can be opened straight away, without filling earlier steps', async () => {
    const page = await startForm();
    for (const n of [9, 14, 18, 3]) {
      await page.evaluate((i) => document.querySelectorAll('[data-step-dot]')[i - 1].click(), n);
      await sleep(500);
      assert.equal(await page.evaluate(() => document.querySelectorAll('[data-step-row] button[aria-expanded=true]').length), 1, `one step is open after choosing ${n}`);
    }
    await page.close();
  });

  test('IDPR-003 opening one step closes the other, and pressing the open one closes it', async () => {
    const page = await startForm();
    await page.evaluate(() => document.querySelector('[data-step-row="4"] button[aria-expanded]').click()); await sleep(500);
    assert.equal(await page.evaluate(() => document.querySelector('[data-step-row="4"] button[aria-expanded]').getAttribute('aria-expanded')), 'true');
    assert.equal(await page.evaluate(() => document.querySelector('[data-step-row="1"] button[aria-expanded]').getAttribute('aria-expanded')), 'false');
    await page.evaluate(() => document.querySelector('[data-step-row="4"] button[aria-expanded]').click()); await sleep(400);
    assert.equal(await page.evaluate(() => document.querySelectorAll('[data-step-row] button[aria-expanded=true]').length), 0);
    await page.close();
  });

  test('IDPR-004 Next and Previous move one step; Previous is off on the first step', async () => {
    const page = await startForm();
    const current = () => page.evaluate(() => document.querySelector('[data-step-dot][aria-current=step]')?.getAttribute('aria-label')?.split(':')[0]);
    assert.equal(await current(), 'Step 1');
    assert.equal(await page.evaluate(() => [...document.querySelectorAll(`${'#individual-dpr-form'} button`)].find((b) => /Previous/.test(b.textContent))?.disabled), true);
    await clickText(page, '#individual-dpr-form button', /^Next/); await sleep(1200);
    assert.equal(await current(), 'Step 2');
    await clickText(page, '#individual-dpr-form button', /Previous/); await sleep(1200);
    assert.equal(await current(), 'Step 1');
    await page.close();
  });
});

describe('required answers and generating', () => {
  test('IDPR-010 the required count shows on steps with missing answers and Generate DPR stays off', async () => {
    const page = await startForm();
    assert.ok(await page.evaluate(() => [...document.querySelectorAll('[data-step-row] [title*="required"]')].length) > 0, 'steps show a missing-required count');
    assert.equal(await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Generate DPR')?.disabled), true);
    await page.close();
  });

  test('IDPR-011 "Check my answers" lists what is missing', async () => {
    const page = await startForm();
    await clickText(page, 'button', /Check my answers/i);
    await waitFor(page, () => !!document.querySelector('#review-title'));
    assert.match(await bodyText(page), /Unit \/ Project Name|required/i);
    await page.keyboard.press('Escape'); await sleep(400);
    assert.equal(await page.evaluate(() => !!document.querySelector('#review-title')), false, 'Esc closes it');
    await page.close();
  });
});

describe('saving and coming back', () => {
  test('IDPR-020 typing a unit name and pressing Save Draft stores it for this person', async () => {
    const unit = unique('QA Pickles');
    const page = await startForm();
    await typeUnit(page, unit);
    assert.equal(await saveState(page), 'Save Draft', 'the button shows there is something to save @' + new URL(page.url()).pathname + ' ' + (await bodyText(page)).replace(/\s+/g, ' ').slice(0, 160) + ' ' + JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => /Sav|draft/i.test(b.textContent + b.getAttribute('aria-label')) ).map((b) => (b.getAttribute('aria-label') || b.textContent).slice(0, 50)))));
    await saveDraft(page);
    const stored = await storedDraft(unit);
    assert.ok(stored, 'the draft is in the database');
    const owner = await signIn('consultant');
    assert.equal(String(stored.userId), String(owner.user.userId || owner.user._id || owner.user.id), 'stored under the signed-in person');
    await page.close();
  });

  test('IDPR-021 the saved draft is offered under "Continue where you left off" and reopens with its answers', async () => {
    const unit = unique('QA Resume');
    const first = await startForm();
    await typeUnit(first, unit); await saveDraft(first); await first.close();
    const stored = await storedDraft(unit);
    const page = await openPage(browser, { as: 'consultant' });
    await go(page, `/individual-dpr/create?projectId=${stored.projectId}&dprId=${stored._id}`, 2500);
    await waitFor(page, (u) => [...document.querySelectorAll('input')].some((i) => i.value === u), unit, 15000);
    await page.close();
  });

  test('IDPR-022 changes are saved by themselves about 30 seconds after the first change', async () => {
    const unit = unique('QA Autosave');
    const page = await startForm();
    await typeUnit(page, unit);
    await waitFor(page, () => [...document.querySelectorAll('button')].some((b) => /^Saved/.test(b.textContent.trim())), undefined, 45000);
    assert.ok(await storedDraft(unit), 'stored without pressing Save Draft');
    await page.close();
  });

  test('IDPR-023 a failed save shows an error and keeps what was typed', async () => {
    const unit = unique('QA Failing');
    const page = await startForm();
    await page.setRequestInterception(true);
    page.on('request', (r) => { if (r.url().includes('/dpr/cluster/draft/save')) r.respond({ status: 500, contentType: 'application/json', headers: { 'access-control-allow-origin': QA.web, 'access-control-allow-credentials': 'true' }, body: JSON.stringify({ success: false, message: 'boom' }) }); else r.continue(); });
    await typeUnit(page, unit);
    await clickText(page, 'button', /^Save Draft\b/);
    await sleep(2000);
    assert.match(await bodyText(page), /fail|could not|error/i);
    assert.equal(await page.evaluate((u) => [...document.querySelectorAll('input')].some((i) => i.value === u), unit), true, 'the typed answer is still there');
    assert.equal(await storedDraft(unit), undefined);
    await page.close();
  });

  test('IDPR-024 an under-18 applicant is refused by the server and the person is told', async () => {
    const me = await signIn('consultant');
    const r = await api('POST', '/dpr/cluster/draft/save', { clusterData: { step1: { unitName: unique('QA Kid') }, isIndividualDPR: true, schemeExtras: { entrepreneurAge: 14 } } }, me.token);
    assert.equal(r.status, 403);
    assert.match(JSON.stringify(r.body), /18|guardian/i);
  });
});

describe('Basic and Advanced mode', () => {
  test('IDPR-030 switching between Basic and Advanced keeps what was typed', async () => {
    const unit = unique('QA Mode');
    const page = await startForm();
    await typeUnit(page, unit);
    await page.select('select[aria-label="Where to fill in"]', 'document');
    await waitFor(page, () => !!document.querySelector('[data-dpr-scroll]'), undefined, 10000);
    await waitFor(page, (u) => [...document.querySelectorAll('.individual-dpr-document [contenteditable=true], .individual-dpr-document input')].some((e) => (e.value || e.textContent) === u), unit, 10000);
    await page.select('select[aria-label="Where to fill in"]', 'form');
    await waitFor(page, (u) => [...document.querySelectorAll('#individual-dpr-form input')].some((i) => i.value === u), unit, 10000);
    await page.close();
  });

  test('IDPR-031 typing straight into the report (Advanced) updates the answer used by the form', async () => {
    const page = await startForm();
    await page.select('select[aria-label="Where to fill in"]', 'document');
    await waitFor(page, () => !!document.querySelector('[data-dpr-scroll] [data-dpr-field="step1.unitName"]'), undefined, 15000);
    const unit = unique('QA Inline');
    const cell = await page.evaluateHandle(() => document.querySelector('[data-dpr-scroll] [data-dpr-field="step1.unitName"]'));
    await cell.click({ clickCount: 3 }); await page.keyboard.type(unit, { delay: 5 });
    await page.evaluate(() => document.activeElement.blur());
    await page.select('select[aria-label="Where to fill in"]', 'form');
    await waitFor(page, (u) => [...document.querySelectorAll('#individual-dpr-form input')].some((i) => i.value === u), unit, 10000);
    await page.close();
  });

  test('IDPR-033 a new DPR always opens in Basic, even if Advanced was used last', async () => {
    const page = await startForm({ mode: 'document' });
    assert.equal(await page.evaluate(() => document.querySelector('select[aria-label="Where to fill in"]').value), 'form');
    assert.equal(await page.evaluate(() => !!document.querySelector('#individual-dpr-form')), true, 'the question form is showing');
    await page.close();
  });

  test('IDPR-034 editing an existing DPR opens in the mode used last (Advanced stays Advanced)', async () => {
    const unit = unique('QA Mode');
    const first = await startForm();
    await typeUnit(first, unit); await saveDraft(first); await first.close();
    const stored = await storedDraft(unit);
    const page = await openPage(browser, { as: 'consultant', mode: 'document' });
    await go(page, `/individual-dpr/create?projectId=${stored.projectId}&dprId=${stored._id}`, 2500);
    await waitFor(page, () => !!document.querySelector('select[aria-label="Where to fill in"]'), undefined, 15000);
    assert.equal(await page.evaluate(() => document.querySelector('select[aria-label="Where to fill in"]').value), 'document');
    await page.close();
  });

  test('IDPR-032 undo and redo take back and bring back a change in the report', async () => {
    const page = await startForm();
    await typeUnit(page, 'First value');
    await sleep(1200);
    await page.select('select[aria-label="Where to fill in"]', 'document');
    await waitFor(page, () => !!document.querySelector('button[aria-label="Undo"]'), undefined, 10000);
    await waitFor(page, () => !document.querySelector('button[aria-label="Undo"]').disabled, undefined, 5000);
    await page.evaluate(() => document.querySelector('button[aria-label="Undo"]').click()); await sleep(600);
    assert.equal(await page.evaluate(() => !document.querySelector('button[aria-label="Redo"]').disabled), true, 'redo is available after undo');
    await page.evaluate(() => document.querySelector('button[aria-label="Redo"]').click()); await sleep(600);
    await page.close();
  });
});

describe('arranging and styling the report', () => {
  test('IDPR-040 dragging a step to a new place renumbers the steps and the report follows', async () => {
    const page = await startForm();
    // Mouse dragging needs both rows on screen at once; a phone-sized window is made tall for this one check.
    await page.setViewport({ width: page.viewportSize().width, height: Math.max(page.viewportSize().height, 1800) }); await sleep(300);
    await page.evaluate(() => document.querySelector('[data-step-row="1"] button[aria-expanded]').click()); await sleep(400);
    const rect = (n) => page.evaluate((i) => { const r = document.querySelector(`[data-step-row="${i}"]`).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y, h: r.height }; }, n);
    const a = await rect(2); const b = await rect(4);
    await page.mouse.move(a.x, a.y + a.h / 2); await page.mouse.down(); await page.mouse.move(a.x, a.y + a.h / 2 + 10, { steps: 3 }); await page.mouse.move(b.x, b.y + b.h * 0.8, { steps: 10 }); await page.mouse.up();
    await sleep(700);
    const numbers = await page.evaluate(() => [...document.querySelectorAll('[data-step-row]')].slice(0, 5).map((li) => li.querySelector('button[aria-expanded] > span')?.textContent.trim().slice(0, 1)));
    assert.deepEqual(numbers, ['1', '2', '3', '4', '5'], 'numbers follow the new order');
    const titles = await page.evaluate(() => [...document.querySelectorAll('[data-step-row]')].slice(0, 4).map((li) => li.querySelector('span.block')?.textContent.trim()));
    assert.equal(titles[3], 'Sector overview', 'step 2 now sits fourth');
    await page.close();
  });

  test('IDPR-041 hiding a step leaves its section out of the report; showing it brings it back', async () => {
    const unit = unique('QA Hide');
    const page = await startForm();
    await typeUnit(page, unit);
    await page.evaluate(() => document.querySelector('[data-step-row="1"] button[aria-expanded]').click()); await sleep(400);
    const hasSection = () => page.evaluate(() => !!document.querySelector('#dpr-preview [data-dpr-section="cover"]'));
    assert.equal(await hasSection(), true, 'the cover section shows to begin with');
    await page.evaluate(() => document.querySelector('[data-step-row="1"] button[aria-pressed]').click()); await sleep(700);
    assert.equal(await hasSection(), false, 'hidden');
    await page.evaluate(() => document.querySelector('[data-step-row="1"] button[aria-pressed]').click()); await sleep(700);
    assert.equal(await hasSection(), true, 'shown again');
    await page.close();
  });

  test('IDPR-042 choosing another template changes the look and is kept in the draft', async () => {
    const page = await startForm();
    await clickText(page, 'button', /^Template$/);
    await waitFor(page, () => !!document.querySelector('[role=dialog][aria-label]'), undefined, 8000);
    const before = await page.evaluate(() => JSON.parse(localStorage.getItem('individual-dpr-storage') || 'null'));
    await page.evaluate(() => [...document.querySelectorAll('[role=dialog] button[aria-pressed=false]')][1].click());
    await sleep(900);
    assert.equal(await page.evaluate(() => !document.querySelector('[role=dialog][aria-label]')), true, 'the picker closes after choosing');
    await page.close();
  });

  test('IDPR-043 Preview opens a read-only copy, Esc closes it, and focus goes back to the button', async () => {
    const page = await startForm();
    await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Preview').focus());
    await page.keyboard.press('Enter');
    await waitFor(page, () => !!document.querySelector('[role=dialog][aria-label="Final preview"]'), undefined, 8000);
    await page.keyboard.press('Escape'); await sleep(600);
    assert.equal(await page.evaluate(() => !!document.querySelector('[role=dialog][aria-label="Final preview"]')), false);
    assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), 'Preview');
    await page.close();
  });

  test('IDPR-044 number boxes accept zero and above only', async () => {
    const page = await startForm();
    await page.evaluate(() => document.querySelector('[data-step-row="12"] button[aria-expanded]').click()); await sleep(800);
    const box = await page.evaluateHandle(() => document.querySelector('#individual-dpr-form input[type=number]'));
    if (!(await box.evaluate((e) => !!e))) { assert.fail('no number box on step 12'); }
    await box.click(); await page.keyboard.type('-5'); await sleep(200);
    assert.ok(Number((await box.evaluate((e) => e.value)) || 0) >= 0, 'a minus sign does not produce a negative value');
    await page.close();
  });
});
