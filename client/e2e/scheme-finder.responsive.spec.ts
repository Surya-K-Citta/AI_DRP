// Scheme Finder: the questions, going back, the owner-category rules, the results with Compare and the suggested plan.
// Runs at every screen size.
import { expect, test, watchProblems, type Page } from './fixtures';

test.use({ role: 'consultant' });

const option = (page: Page, letter: string) => page.locator('main button').filter({ hasText: new RegExp(`^\\s*${letter}\\.`) }).first();
const question = async (page: Page) => Number((((await page.locator('body').innerText()).match(/Question (\d+) of/)) || [])[1] ?? NaN);
const possible = async (page: Page) => Number((((await page.locator('body').innerText()).match(/(\d+) schemes? still possible/)) || [])[1] ?? NaN);
const choose = async (page: Page, letter: string) => {
  await option(page, letter).click();
  await page.waitForTimeout(350);
};
async function reachOwner(page: Page) {
  for (let i = 0; i < 20; i++) {
    if (/General category man/i.test(await page.locator('body').innerText())) return;
    await choose(page, 'A');
  }
  throw new Error('never reached the owner question');
}
/** Letters currently marked as chosen: those whose styling differs from the unchosen look. */
async function chosen(page: Page) {
  const buttons = await page.locator('main button').evaluateAll((els) =>
    els.filter((b) => /^[A-K]\./.test((b.textContent || '').trim())).map((b) => ({ letter: (b.textContent || '').trim()[0], cls: b.className }))
  );
  const counts: Record<string, number> = {};
  for (const b of buttons) counts[b.cls] = (counts[b.cls] || 0) + 1;
  const normal = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  return buttons.filter((b) => b.cls !== normal).map((b) => b.letter).sort().join('');
}
async function reachResults(page: Page) {
  await page.goto('/venture-match');
  for (let i = 0; i < 30; i++) {
    if (!/Question \d+ of/.test(await page.locator('body').innerText())) break;
    await option(page, 'A').click();
    await page.locator('main button').filter({ hasText: /^(Next|See|Continue|Finish)/i }).first().click({ timeout: 1500 }).catch(() => undefined);
    await page.waitForTimeout(350);
  }
  await expect(page.locator('body')).not.toContainText(/Question \d+ of/);
}

test.describe('narrowing and navigation', () => {
  test('each answer narrows the list of possible schemes and moves to the next question', async ({ page }) => {
    await page.goto('/venture-match');
    const start = await possible(page);
    expect(start, 'starts with many schemes').toBeGreaterThan(5);
    expect(await question(page)).toBe(1);
    await choose(page, 'A');
    await expect(page.locator('body')).toContainText(/Question 2 of/);
    const after1 = await possible(page);
    expect(after1).toBeLessThanOrEqual(start);
    await choose(page, 'A');
    await expect(page.locator('body')).toContainText(/Question 3 of/);
    expect(await possible(page)).toBeLessThanOrEqual(after1);
  });

  test('Previous goes back one question and keeps the earlier answer', async ({ page }) => {
    await page.goto('/venture-match');
    await choose(page, 'C');
    await page.getByRole('button', { name: 'Previous', exact: true }).click();
    await expect.poll(() => question(page)).toBe(1);
    expect(await chosen(page), 'the earlier answer is still marked').not.toBe('');
  });

  test('reloading mid-way does not break the page', async ({ page }) => {
    const problems = watchProblems(page);
    await page.goto('/venture-match');
    await choose(page, 'A');
    await page.reload();
    await expect(page.locator('body')).toContainText(/Scheme Finder/);
    expect(problems).toEqual([]);
  });
});

test.describe('owner category rules', () => {
  // A woman, B SC, C ST, D BC, E disability, F transgender, G ex-serviceman, H general category man, I/J/K stand alone.
  const cases: Array<[string, string[], string]> = [
    ['one choice from each pick-one group can be combined (woman + SC)', ['A', 'B'], 'AB'],
    ['choosing a second person from the same group replaces the first (woman, then transgender)', ['A', 'F'], 'F'],
    ['SC and ST cannot both be chosen (the second replaces the first)', ['B', 'C'], 'C'],
    ['disability combines with any other choice', ['B', 'E'], 'BE'],
    ['general category man replaces a choice from both groups (woman + SC, then H)', ['A', 'B', 'H'], 'H'],
    ['"not decided", "no 51% holder" and "not sure" stand alone (they clear everything else)', ['A', 'E', 'K'], 'K'],
    ['choosing a person after "not sure" clears it', ['K', 'A'], 'A'],
    ['pressing a chosen option again clears it', ['A', 'A'], ''],
  ];
  for (const [title, clicks, expected] of cases) {
    test(title, async ({ page }) => {
      await page.goto('/venture-match');
      await reachOwner(page);
      for (const letter of clicks) await choose(page, letter);
      expect(await chosen(page)).toBe(expected);
    });
  }
});

test.describe('results, Compare and the suggested plan', () => {
  test('answering every question ends with matching schemes the person can act on', async ({ page }) => {
    const problems = watchProblems(page);
    await reachResults(page);
    await expect(page.locator('body')).toContainText(/scheme|match|recommend/i);
    expect(problems).toEqual([]);
  });

  test('every scheme card has a Compare button that opens a large comparison with three drop-downs of the other schemes', async ({ page }) => {
    await reachResults(page);
    const compare = page.locator('main button[aria-label^="Compare:"]');
    expect(await compare.count()).toBeGreaterThanOrEqual(2);
    expect(await page.getByRole('tab', { name: /Compare|Suggested/ }).count(), 'the old tabs are gone').toBe(0);
    await compare.first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('select')).toHaveCount(4);
    const first = dialog.getByLabel('Scheme to compare 1');
    const value = await first.locator('option').nth(1).getAttribute('value');
    await first.selectOption(value!);
    await expect.poll(() => dialog.locator('table thead th').count()).toBeGreaterThanOrEqual(3);
    expect(await dialog.getByLabel('Scheme to compare 2').locator(`option[value="${value}"]`).count(), 'a scheme already chosen is not offered again').toBe(0);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });

  test('the Suggested plan button opens the plan as a large window', async ({ page }) => {
    await reachResults(page);
    await page.getByRole('button', { name: /^Suggested plan/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(/A suggested plan/);
    await dialog.getByRole('button', { name: /^(Close|Minimi)/i }).click();
    await expect(dialog).toHaveCount(0);
  });

  test('the scheme cards in a row are the same height', async ({ page }) => {
    await reachResults(page);
    const heights = await page.locator('main .grid > .vm-rise').evaluateAll((cards) => cards.map((c) => Math.round(c.getBoundingClientRect().height)));
    expect(heights.length).toBeGreaterThanOrEqual(2);
    if (await page.evaluate(() => window.innerWidth >= 768)) expect(Math.abs(heights[0] - heights[1])).toBeLessThanOrEqual(2);
  });
});
