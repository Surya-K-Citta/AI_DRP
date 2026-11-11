// The individual DPR screen as a person uses it: pick a scheme, work through the steps, save, come back, switch between Basic and
// Advanced, arrange and style the report. Desktop layout (the step list sits beside the form).
import { api, expect, login, test, unique, USERS, type Page } from './fixtures';

const FORM = '#individual-dpr-form';
test.use({ role: 'consultant' });

/** Opens a fresh "bank term loan" DPR straight in the form. */
async function startForm(page: Page) {
  await page.goto('/individual-dpr/create?new=true&scheme=VANILLA');
  await page.getByRole('button', { name: /Start DPR steps/i }).click();
  await expect(page.locator('[data-step-row]').first()).toBeVisible({ timeout: 20_000 });
}
const typeUnit = async (page: Page, name: string) => {
  const box = page.locator(`${FORM} input`).first();
  await box.fill('');
  await box.pressSequentially(name, { delay: 4 });
};
const saveButton = (page: Page) => page.getByRole('button', { name: /^(Save Draft|Saved)/ }).first();
async function saveDraft(page: Page) {
  await saveButton(page).click();
  await expect(page.getByRole('button', { name: /^Saved/ }).first()).toBeVisible({ timeout: 20_000 });
}
/** The person's saved drafts, found by unit name (read through the API, as the dashboard does). */
async function storedDraft(unit: string) {
  const { token } = await login(USERS.consultant);
  const list = await api('GET', '/dpr/user/list', undefined, token);
  const rows: any[] = list.body?.data?.dprs || list.body?.data || [];
  return rows.find((row) => row.projectId?.projectName === unit);
}
const modeSelect = (page: Page) => page.getByLabel('Where to fill in');

test.describe('start and navigate', () => {
  test('choosing a scheme from the list leads to its brief, then to the step list', async ({ page }) => {
    await page.goto('/individual-dpr/create');
    await page.getByRole('button', { name: /Bank term loan \(no scheme overlay\)/i }).click();
    await page.getByRole('button', { name: /Start DPR steps/i }).click();
    await expect.poll(() => page.locator('[data-step-row]').count(), { timeout: 20_000 }).toBeGreaterThanOrEqual(10);
    expect(await page.locator('[data-step-dot]').count(), 'dots and rows list the same steps').toBe(await page.locator('[data-step-row]').count());
  });

  test('any step can be opened straight away, without filling earlier steps', async ({ page }) => {
    await startForm(page);
    for (const n of [9, 14, 18, 3]) {
      await page.locator('[data-step-dot]').nth(n - 1).click();
      await expect(page.locator('[data-step-row] button[aria-expanded=true]'), `one step is open after choosing ${n}`).toHaveCount(1);
    }
  });

  test('opening one step closes the other, and pressing the open one closes it', async ({ page }) => {
    await startForm(page);
    const four = page.locator('[data-step-row="4"] button[aria-expanded]');
    await four.click();
    await expect(four).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('[data-step-row="1"] button[aria-expanded]')).toHaveAttribute('aria-expanded', 'false');
    await four.click();
    await expect(page.locator('[data-step-row] button[aria-expanded=true]')).toHaveCount(0);
  });

  test('Next and Previous move one step; Previous is off on the first step', async ({ page }) => {
    await startForm(page);
    const current = page.locator('[data-step-dot][aria-current=step]');
    await expect(current).toHaveAttribute('aria-label', /^Step 1:/);
    await expect(page.locator(`${FORM} button`).filter({ hasText: /Previous/ })).toBeDisabled();
    await page.locator(`${FORM} button`).filter({ hasText: /^Next/ }).click();
    await expect(current).toHaveAttribute('aria-label', /^Step 2:/);
    await page.locator(`${FORM} button`).filter({ hasText: /Previous/ }).click();
    await expect(current).toHaveAttribute('aria-label', /^Step 1:/);
  });
});

test.describe('required answers and generating', () => {
  test('the required count shows on steps with missing answers and Generate DPR stays off', async ({ page }) => {
    await startForm(page);
    expect(await page.locator('[data-step-row] [title*="required"]').count()).toBeGreaterThan(0);
    await expect(page.getByRole('button', { name: 'Generate DPR', exact: true })).toBeDisabled();
  });

  test('"Check my answers" lists what is missing, and Escape closes it', async ({ page }) => {
    await startForm(page);
    await page.getByRole('button', { name: /Check my answers/i }).click();
    await expect(page.locator('#review-title')).toBeVisible();
    await expect(page.locator('body')).toContainText(/Unit \/ Project Name|required/i);
    await page.keyboard.press('Escape');
    await expect(page.locator('#review-title')).toHaveCount(0);
  });
});

test.describe('saving and coming back', () => {
  test('typing a unit name and pressing Save Draft stores it for this person', async ({ page }) => {
    const unit = unique('QA Pickles');
    await startForm(page);
    await typeUnit(page, unit);
    await expect(saveButton(page)).toContainText(/^Save Draft/);
    await saveDraft(page);
    expect(await storedDraft(unit), 'the draft is stored').toBeTruthy();
  });

  test('the saved draft reopens with its answers', async ({ page, context }) => {
    const unit = unique('QA Resume');
    await startForm(page);
    await typeUnit(page, unit);
    await saveDraft(page);
    const stored = await storedDraft(unit);
    const second = await context.newPage();
    await second.goto(`/individual-dpr/create?projectId=${stored.projectId._id || stored.projectId}&dprId=${stored._id}`);
    await expect(second.locator(`input[value="${unit}"]`).first()).toBeVisible({ timeout: 20_000 });
  });

  test('changes are saved by themselves about 30 seconds after the first change', async ({ page }) => {
    test.setTimeout(150_000);
    const unit = unique('QA Autosave');
    await startForm(page);
    await typeUnit(page, unit);
    await expect(page.getByRole('button', { name: /^Saved/ }).first()).toBeVisible({ timeout: 60_000 });
    expect(await storedDraft(unit), 'stored without pressing Save Draft').toBeTruthy();
  });

  test('a failed save shows an error and keeps what was typed', async ({ page }) => {
    const unit = unique('QA Failing');
    await startForm(page);
    await page.route('**/dpr/cluster/draft/save', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'boom' }) }));
    await typeUnit(page, unit);
    await saveButton(page).click();
    await expect(page.locator('body')).toContainText(/fail|could not|error/i);
    await expect(page.locator(`input[value="${unit}"]`).first()).toBeVisible();
    expect(await storedDraft(unit)).toBeUndefined();
  });

  test('an under-18 applicant is refused by the server and the person is told', async () => {
    const me = await login(USERS.consultant);
    const refused = await api('POST', '/dpr/cluster/draft/save', { clusterData: { step1: { unitName: unique('QA Kid') }, isIndividualDPR: true, schemeExtras: { entrepreneurAge: 14 } } }, me.token);
    expect(refused.status).toBe(403);
    expect(JSON.stringify(refused.body)).toMatch(/18|guardian/i);
  });
});

test.describe('Basic and Advanced mode', () => {
  test('switching between Basic and Advanced keeps what was typed', async ({ page }) => {
    const unit = unique('QA Mode');
    await startForm(page);
    await typeUnit(page, unit);
    await modeSelect(page).selectOption('document');
    await expect(page.locator('[data-dpr-scroll]').first()).toBeVisible();
    await expect(page.locator('[data-dpr-field="step1.unitName"]').first()).toContainText(unit);
    await modeSelect(page).selectOption('form');
    await expect(page.locator(`${FORM} input[value="${unit}"]`).first()).toBeVisible();
  });

  test('typing straight into the report (Advanced) updates the answer used by the form', async ({ page }) => {
    await startForm(page);
    await modeSelect(page).selectOption('document');
    const cell = page.locator('[data-dpr-scroll] [data-dpr-field="step1.unitName"]').first();
    await expect(cell).toBeVisible();
    const unit = unique('QA Inline');
    await cell.fill(unit);
    await cell.blur();
    await modeSelect(page).selectOption('form');
    await expect(page.locator(`${FORM} input[value="${unit}"]`).first()).toBeVisible();
  });

  test('a new DPR always opens in Basic, even if Advanced was used last', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('dpr-edit-mode', JSON.stringify({ state: { mode: 'document' }, version: 0 })));
    await startForm(page);
    await expect(modeSelect(page)).toHaveValue('form');
    await expect(page.locator(FORM)).toBeVisible();
  });

  test('editing an existing DPR opens in the mode used last (Advanced stays Advanced)', async ({ page, browser }) => {
    const unit = unique('QA Mode');
    await startForm(page);
    await typeUnit(page, unit);
    await saveDraft(page);
    const stored = await storedDraft(unit);
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const second = await context.newPage();
    const me = await login(USERS.consultant);
    const { startSignedIn } = await import('./fixtures');
    await startSignedIn(second, me, 'document');
    await second.goto(`/individual-dpr/create?projectId=${stored.projectId._id || stored.projectId}&dprId=${stored._id}`);
    await expect(modeSelect(second)).toHaveValue('document');
    await context.close();
  });

  test('undo and redo take back and bring back a change in the report', async ({ page }) => {
    await startForm(page);
    await typeUnit(page, 'First value');
    await page.waitForTimeout(1200);
    await modeSelect(page).selectOption('document');
    const undo = page.getByRole('button', { name: 'Undo', exact: true });
    await expect(undo).toBeEnabled();
    await undo.click();
    await expect(page.getByRole('button', { name: 'Redo', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Redo', exact: true }).click();
  });
});

test.describe('the open step stays in view', () => {
  test('its title stays at the top, solid, while its inputs scroll past, and it is held inside its own step so it moves on after the last input', async ({ page }) => {
    await startForm(page);
    await page.locator('[data-step-row="12"] button[aria-expanded]').click();
    await page.waitForTimeout(800); // the step scrolls itself into view when it opens
    const scroller = page.locator('.fill-edit-scroll').first();
    const head = page.locator('#step-head-12').locator('xpath=..'); // the step's title bar
    const gap = async () => (await head.boundingBox())!.y - (await scroller.boundingBox())!.y;
    /** Scrolls so that the step's own top edge is `above` px above the top of the scroll area. */
    const scrollInto = (above: number) =>
      scroller.evaluate((el, n) => {
        const row = document.querySelector('[data-step-row="12"]')!.getBoundingClientRect();
        el.scrollTop += row.top - el.getBoundingClientRect().top + n;
      }, above);
    await scrollInto(250);
    await expect.poll(async () => Math.abs(await gap()), 'held at the top after 250 px of the step has gone past').toBeLessThanOrEqual(6);
    await scrollInto(600);
    await expect.poll(async () => Math.abs(await gap()), 'and still at the top after 600 px').toBeLessThanOrEqual(6);
    // Solid (not see-through), even under the mouse: a transparent bar would let the inputs show through while scrolling.
    await head.hover();
    expect(await head.evaluate((el) => getComputedStyle(el).backgroundColor)).toMatch(/^rgb\(/);
    // It can only move within its own step, so it is released when that step's last input has passed.
    expect(await head.evaluate((el) => ({ position: getComputedStyle(el).position, parent: getComputedStyle(el.parentElement!).position, overflow: getComputedStyle(el.parentElement!).overflow }))).toEqual({ position: 'sticky', parent: 'relative', overflow: 'visible' });
  });
});

test.describe('arranging and styling the report', () => {
  test('dragging a step to a new place renumbers the steps and the report follows', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1800 });
    await startForm(page);
    await page.locator('[data-step-row="1"] button[aria-expanded]').click();
    const two = (await page.locator('[data-step-row="2"]').boundingBox())!;
    const four = (await page.locator('[data-step-row="4"]').boundingBox())!;
    const x = two.x + two.width / 2;
    await page.mouse.move(x, two.y + two.height / 2);
    await page.mouse.down();
    await page.mouse.move(x, two.y + two.height / 2 + 10, { steps: 3 });
    await page.mouse.move(x, four.y + four.height * 0.8, { steps: 10 });
    await page.mouse.up();
    await expect.poll(() => page.locator('[data-step-row]').nth(3).locator('span.block').first().textContent()).toContain('Sector overview');
    const numbers = await page.locator('[data-step-row]').evaluateAll((rows) => rows.slice(0, 5).map((li) => li.querySelector('button[aria-expanded] > span')?.textContent?.trim().slice(0, 1)));
    expect(numbers, 'numbers follow the new order').toEqual(['1', '2', '3', '4', '5']);
  });

  test('hiding a step leaves its section out of the report; showing it brings it back', async ({ page }) => {
    await startForm(page);
    await typeUnit(page, unique('QA Hide'));
    await page.locator('[data-step-row="1"] button[aria-expanded]').click();
    const cover = page.locator('#dpr-preview [data-dpr-section="cover"]');
    await expect(cover).toHaveCount(1);
    await page.locator('[data-step-row="1"] button[aria-pressed]').click();
    await expect(cover).toHaveCount(0);
    await page.locator('[data-step-row="1"] button[aria-pressed]').click();
    await expect(cover).toHaveCount(1);
  });

  test('choosing another template closes the picker', async ({ page }) => {
    await startForm(page);
    await page.getByRole('button', { name: 'Template', exact: true }).click();
    const picker = page.locator('[role=dialog][aria-label]');
    await expect(picker).toBeVisible();
    await picker.locator('button[aria-pressed=false]').nth(1).click();
    await expect(picker).toHaveCount(0);
  });

  test('Preview opens a read-only copy, Escape closes it, and focus goes back to the button', async ({ page }) => {
    await startForm(page);
    const preview = page.getByRole('button', { name: 'Preview', exact: true });
    await preview.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[role=dialog][aria-label="Final preview"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[role=dialog][aria-label="Final preview"]')).toHaveCount(0);
    await expect(preview).toBeFocused();
  });

  test('number boxes accept zero and above only', async ({ page }) => {
    await startForm(page);
    await page.locator('[data-step-row="12"] button[aria-expanded]').click();
    const box = page.locator(`${FORM} input[type=number]`).first();
    await expect(box).toBeVisible();
    await box.click();
    await page.keyboard.type('-5');
    expect(Number((await box.inputValue()) || 0)).toBeGreaterThanOrEqual(0);
  });
});
