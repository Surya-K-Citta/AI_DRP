import { expect, test, type Page } from '@playwright/test';

const email = process.env.E2E_EMAIL || 'qa.consultant@msme.test';
const password = process.env.E2E_PASSWORD || 'Qa-Test-2026!';

const shopPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

async function acceptNoticeIfShown(page: Page) {
  const agree = page.getByRole('button', { name: 'Agree and continue' });
  const appeared = await agree
    .waitFor({ state: 'visible', timeout: 8_000 })
    .then(() => true)
    .catch(() => false);
  if (!appeared) return;
  const region = page.getByRole('region', { name: 'privacy notice' });
  await region.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  const account = page.locator('#reconsent-account');
  await expect(account).toBeEnabled();
  await account.check();
  await expect(agree).toBeEnabled();
  await agree.click();
  await expect(agree).toBeHidden();
}

test('consultant opens the style editor, advances a step, and names, resizes, hides, and deletes a picture', async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'en');
  });

  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await page.waitForURL(/\/(dashboard|login)/, { timeout: 30_000 });
  await acceptNoticeIfShown(page);
  await expect(page).toHaveURL(/dashboard/);

  await page.goto('/individual-dpr/create?new=true');
  await acceptNoticeIfShown(page);
  await page.getByRole('heading', { name: 'Bank term loan (no scheme overlay)' }).click();
  await page.getByRole('button', { name: 'Start DPR steps' }).click();

  await expect(page.getByRole('heading', { name: 'Create DPR' })).toBeVisible();
  await expect(page.getByText('Step 1 of')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Step 1:/ })).toBeVisible();
  await expect(page.locator('.fill-edit-scroll').first()).toBeVisible();

  const edit = page.locator('.fill-edit-scroll:visible').first();
  await edit.locator('[data-required-field="unitName"]').fill('Screen Test Unit');
  await edit.locator('[data-required-field="district"]').selectOption('Visakhapatnam');
  await expect(edit.locator('[data-required-field="location"]')).toBeEnabled();
  await edit.locator('[data-required-field="location"]').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  await expect(page.getByText('Step 2 of')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);

  // Pictures are added from the Style tab of Advanced mode (Basic mode has no style editor), then listed under Sections.
  await page.getByLabel('Where to fill in').selectOption('document');
  await page.getByRole('tab', { name: 'Style', exact: true }).click();
  await page.getByRole('button', { name: /^Pictures/ }).click();
  // The style panel holds more than one file input, so take the one right after the "Choose where a new picture starts" hint.
  const pictures = page.getByText(/Choose where a new picture starts/).locator('xpath=following-sibling::input[@type="file"]').first();
  await pictures.setInputFiles({
    name: 'shop-front.png',
    mimeType: 'image/png',
    buffer: shopPng,
  });

  const nameDialog = page.locator('form').filter({ hasText: 'Name this picture' });
  await expect(nameDialog).toBeVisible();
  await nameDialog.locator('input').fill('Shop front');
  await nameDialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(nameDialog).toBeHidden();

  await page.getByRole('tab', { name: 'Sections', exact: true }).click();
  // The Sections list is drawn twice (one copy per screen size), so use the copy that is on screen.
  const pictureRow = page.locator('ol li:visible').filter({ hasText: 'Shop front' }).first();
  await expect(pictureRow).toBeVisible();

  const frame = page.locator('.dpr-slot-box.is-live');
  await expect(frame).toBeVisible();
  const widthBefore = await frame.evaluate((el) => (el as HTMLElement).style.width);
  const handle = frame.locator('.dpr-slot-handle.is-e');
  await expect(handle).toBeVisible();
  await handle.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const startX = rect.x + rect.width / 2;
    const startY = rect.y + rect.height / 2;
    const down = { bubbles: true, cancelable: true, clientX: startX, clientY: startY, pointerId: 1, pointerType: 'mouse', buttons: 1 };
    el.dispatchEvent(new PointerEvent('pointerdown', down));
    window.dispatchEvent(new PointerEvent('pointermove', {
      ...down,
      clientX: startX - 180,
    }));
    window.dispatchEvent(new PointerEvent('pointerup', {
      ...down,
      buttons: 0,
      clientX: startX - 180,
    }));
  });
  await expect.poll(async () => frame.evaluate((el) => (el as HTMLElement).style.width)).not.toBe(widthBefore);

  await pictureRow.getByTitle('Hide picture').click();
  await expect(pictureRow).toHaveClass(/opacity-45/);
  await expect(pictureRow.getByTitle('Show picture')).toBeVisible();
  await expect(page.locator('.dpr-slot-box.is-live')).toHaveCount(0);

  await pictureRow.getByTitle('Delete picture').click();
  const confirm = page.locator('div').filter({ hasText: 'Delete this image?' }).last();
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByText('Shop front')).toHaveCount(0);
});
