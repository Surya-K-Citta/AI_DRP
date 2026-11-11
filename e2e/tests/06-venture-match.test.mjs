// VM: the Scheme Finder questionnaire: narrowing, going back, the owner-category rules, reaching results.
import { before, after, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { launch, openPage, go, requireStack, clickText, bodyText, waitFor, sleep, shot } from '../lib/harness.mjs';

let browser;
before(async () => { await requireStack(); browser = await launch(); });
after(async () => { await browser?.close(); });

const options = (page) => page.evaluate(() => [...document.querySelectorAll('main button')].filter((b) => /^[A-K]\./.test(b.textContent.trim())).map((b) => ({ letter: b.textContent.trim()[0], cls: b.className })));
const possible = async (page) => Number(((await bodyText(page)).match(/(\d+) schemes? still possible/) || [])[1] ?? NaN);
const questionNo = async (page) => Number(((await bodyText(page)).match(/Question (\d+) of/) || [])[1] ?? NaN);
async function choose(page, letter) {
  await page.evaluate((l) => [...document.querySelectorAll('main button')].find((b) => b.textContent.trim().startsWith(l + '.'))?.click(), letter);
  await sleep(450);
}
async function reachOwner(page) {
  for (let i = 0; i < 20; i++) {
    if (/General category man/i.test(await bodyText(page))) return;
    await choose(page, 'A'); await sleep(250);
  }
  throw new Error('never reached the owner question');
}
/** Letters currently marked as chosen: those whose styling differs from the unchosen look. */
async function chosen(page) {
  const opts = await options(page);
  const base = opts.map((o) => o.cls);
  const counts = {};
  for (const c of base) counts[c] = (counts[c] || 0) + 1;
  const normal = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  return opts.filter((o) => o.cls !== normal).map((o) => o.letter).sort().join('');
}

describe('narrowing and navigation', () => {
  test('VM-001 each answer narrows the list of possible schemes and moves to the next question', async () => {
    const page = await openPage(browser, { as: 'consultant' });
    await go(page, '/venture-match', 2000);
    const start = await possible(page);
    assert.ok(start > 5, `starts with many schemes (${start})`);
    assert.equal(await questionNo(page), 1);
    await choose(page, 'A');
    await waitFor(page, () => /Question 2 of/.test(document.body.innerText), undefined, 8000);
    const after1 = await possible(page);
    assert.ok(after1 <= start, `${start} → ${after1}`);
    await choose(page, 'A');
    await waitFor(page, () => /Question 3 of/.test(document.body.innerText), undefined, 8000);
    const after2 = await possible(page);
    assert.ok(after2 <= after1, `${after1} → ${after2}`);
    await page.close();
  });

  test('VM-002 Previous goes back one question and keeps the earlier answer', async () => {
    const page = await openPage(browser, { as: 'consultant' });
    await go(page, '/venture-match', 2000);
    await choose(page, 'C');
    await clickText(page, 'main button', /Previous/i); await sleep(500);
    assert.equal(await questionNo(page), 1);
    assert.notEqual(await chosen(page), '', 'the earlier answer is still marked');
    await page.close();
  });

  test('VM-003 reloading mid-way does not break the page', async () => {
    const page = await openPage(browser, { as: 'consultant' });
    await go(page, '/venture-match', 2000);
    await choose(page, 'A');
    await page.reload({ waitUntil: 'load' }); await sleep(1500);
    assert.match(await bodyText(page), /Scheme Finder/);
    assert.deepEqual(page.problems, []);
    await page.close();
  });
});

describe('owner category rules', () => {
  // A woman, B SC, C ST, D BC, E disability, F transgender, G ex-serviceman, H general category man, I/J/K stand alone.
  const cases = [
    ['VM-010 one choice from each pick-one group can be combined (woman + SC)', ['A', 'B'], 'AB'],
    ['VM-011 choosing a second person from the same group replaces the first (woman, then transgender)', ['A', 'F'], 'F'],
    ['VM-012 SC and ST cannot both be chosen (the second replaces the first)', ['B', 'C'], 'C'],
    ['VM-013 disability combines with any other choice', ['B', 'E'], 'BE'],
    ['VM-014 general category man replaces a choice from both groups (woman + SC, then H)', ['A', 'B', 'H'], 'H'],
    ['VM-015 "not decided", "no 51% holder" and "not sure" stand alone (they clear everything else)', ['A', 'E', 'K'], 'K'],
    ['VM-016 choosing a person after "not sure" clears it', ['K', 'A'], 'A'],
    ['VM-017 pressing a chosen option again clears it', ['A', 'A'], ''],
  ];
  for (const [title, clicks, expected] of cases) {
    test(title, async () => {
      const page = await openPage(browser, { as: 'consultant' });
      await go(page, '/venture-match', 2000);
      await reachOwner(page);
      for (const letter of clicks) await choose(page, letter);
      assert.equal(await chosen(page), expected);
      await page.close();
    });
  }
});

describe('results', () => {
  test('VM-020 answering every question ends with matching schemes the person can act on', async () => {
    const page = await openPage(browser, { as: 'consultant' });
    await go(page, '/venture-match', 2000);
    for (let i = 0; i < 30; i++) {
      const text = await bodyText(page);
      if (/Question \d+ of/.test(text) === false) break;
      await choose(page, 'A');
      await page.evaluate(() => [...document.querySelectorAll('main button')].find((b) => /^(Next|See|Continue|Finish)/i.test(b.textContent.trim()) && !b.disabled)?.click());
      await sleep(350);
    }
    await sleep(1200);
    const text = await bodyText(page);
    try {
      assert.doesNotMatch(text, /Question \d+ of/, 'the questions are finished');
      assert.match(text, /scheme|match|recommend/i);
    } catch (error) { await shot(page, 'fail-VM-020'); throw error; }
    assert.deepEqual(page.problems, []);
    await page.close();
  });

  async function reachResults() {
    const page = await openPage(browser, { as: 'consultant' });
    await go(page, '/venture-match', 2000);
    for (let i = 0; i < 30; i++) {
      if (!/Question \d+ of/.test(await bodyText(page))) break;
      await choose(page, 'A');
      await page.evaluate(() => [...document.querySelectorAll('main button')].find((b) => /^(Next|See|Continue|Finish)/i.test(b.textContent.trim()) && !b.disabled)?.click());
      await sleep(350);
    }
    await sleep(1200);
    return page;
  }

  test('VM-021 every scheme card has a Compare button that opens a large comparison with three drop-downs of the other schemes', async () => {
    const page = await reachResults();
    const cards = await page.evaluate(() => document.querySelectorAll('main button[aria-label^="Compare:"]').length);
    assert.ok(cards >= 2, `Compare buttons on the cards (${cards})`);
    assert.equal(await page.evaluate(() => [...document.querySelectorAll('[role=tab]')].some((tab) => /Compare|Suggested/.test(tab.textContent))), false, 'the old Suggested / Compare tabs are gone');
    await page.evaluate(() => document.querySelector('main button[aria-label^="Compare:"]').click());
    await waitFor(page, () => !!document.querySelector('[role=dialog] select'));
    const first = await page.evaluate(() => document.querySelector('[role=dialog] select[aria-label="Your scheme"]').selectedOptions[0].textContent);
    assert.ok(first.length > 3, 'the scheme whose card was pressed is the first column');
    assert.equal(await page.evaluate(() => document.querySelectorAll('[role=dialog] select').length), 4, 'one list for the scheme and three to compare with');
    // Choosing from the first list fills the table; the same scheme is no longer offered in the other lists.
    const picked = await page.evaluate(() => { const s = document.querySelector('[role=dialog] select[aria-label="Scheme to compare 1"]'); return s.options[1]?.value; });
    await page.selectOption('[role=dialog] select[aria-label="Scheme to compare 1"]', picked);
    await waitFor(page, () => document.querySelectorAll('[role=dialog] table thead th').length >= 3);
    const offered = await page.evaluate((code) => [...document.querySelectorAll('[role=dialog] select[aria-label="Scheme to compare 2"] option')].map((o) => o.value).includes(code), picked);
    assert.equal(offered, false, 'a scheme already chosen is not offered again');
    await page.keyboard.press('Escape');
    await sleep(300);
    assert.equal(await page.evaluate(() => !!document.querySelector('[role=dialog]')), false, 'Escape closes it');
    await page.close();
  });

  test('VM-022 the Suggested plan button opens the plan as a large window instead of a side panel', async () => {
    const page = await reachResults();
    await clickText(page, 'main button', /^Suggested plan/);
    await waitFor(page, () => !!document.querySelector('[role=dialog]'));
    assert.match(await page.evaluate(() => document.querySelector('[role=dialog]').innerText), /A suggested plan/);
    await clickText(page, '[role=dialog] button', /^(Close|Minimi)/i);
    await sleep(300);
    assert.equal(await page.evaluate(() => !!document.querySelector('[role=dialog]')), false);
    await page.close();
  });
});
