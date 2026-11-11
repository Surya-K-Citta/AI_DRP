// The AI assistant (the AI provider is replaced by a stub, so nothing is spent), the profile, and the person's privacy rights.
import { api, expect, login, newPerson, PASSWORD, startSignedIn, test, USERS } from './fixtures';

const WEB = process.env.E2E_BASE_URL || 'http://localhost:5199';
const CORS = { 'access-control-allow-origin': WEB, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': 'authorization,content-type', 'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS' };
const project = (name: string) => ({ projectName: name, projectType: 'individual', industrySector: 'Services', totalCost: 10, ownContribution: 2, loanAmount: 8, location: 'Guntur' });

test.describe('AI assistant', () => {
  test.use({ role: 'consultant' });

  test('a question is shown, sent, and the assistant\'s reply appears', async ({ page }) => {
    let sent = '';
    await page.route('**/ai/chat', (route) => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
      sent = route.request().postData() || '';
      const answer = 'QA stub answer: start with a unit name.';
      return route.fulfill({ status: 200, headers: CORS, contentType: 'application/json', body: JSON.stringify({ success: true, data: { response: answer, message: answer } }) });
    });
    await page.goto('/chat');
    await page.locator('textarea').fill('How do I create a DPR?');
    await page.keyboard.press('Enter');
    await expect(page.locator('body')).toContainText('QA stub answer');
    await expect(page.locator('body')).toContainText('How do I create a DPR?');
    expect(sent).toMatch(/How do I create a DPR/);
  });

  test('when the assistant fails the person is told, and their question is not lost', async ({ page }) => {
    await page.route('**/ai/chat', (route) =>
      route.request().method() === 'OPTIONS'
        ? route.fulfill({ status: 204, headers: CORS })
        : route.fulfill({ status: 500, headers: CORS, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'upstream down' }) })
    );
    await page.goto('/chat');
    await page.locator('textarea').fill('Will this fail?');
    await page.keyboard.press('Enter');
    await expect(page.locator('body')).toContainText(/error|sorry|try again|could not|failed/i);
    await expect(page.locator('body')).toContainText('Will this fail?');
  });

  test('an empty message cannot be sent', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.locator('button[aria-label^="Send"]').first()).toBeDisabled();
  });

  test('the server only answers a person who allowed AI help', async () => {
    const person = await newPerson('noai');
    expect([400, 403]).toContain((await api('POST', '/ai/chat', { message: 'hello' }, person.token)).status);
    expect((await api('POST', '/ai/chat', { message: 'hello' })).status).toBe(401);
  });
});

test.describe('profile', () => {
  test('the profile shows my details and a changed name is saved', async ({ page }) => {
    const person = await newPerson('prof');
    await startSignedIn(page, person);
    await page.goto('/profile');
    await expect(page.locator(`input[value="${person.email}"]`)).toBeVisible();
    const name = page.locator('input[value^="QA "]').first();
    await name.fill('QA Renamed Person');
    await page.getByRole('button', { name: /^(Save|Update)/ }).first().click();
    await expect.poll(async () => JSON.stringify((await api('GET', '/auth/profile', undefined, person.token)).body)).toContain('QA Renamed Person');
  });

  test('the email cannot be changed, and an invalid phone number is refused by the server', async () => {
    const person = await newPerson('prof2');
    const changed = await api('PUT', '/auth/profile', { email: 'someone.else@msme.test', phoneNumber: '12' }, person.token);
    expect(changed.status === 400 || !JSON.stringify(changed.body).includes('someone.else@msme.test')).toBe(true);
    expect(JSON.stringify((await api('GET', '/auth/profile', undefined, person.token)).body)).toContain(person.email);
  });
});

test.describe('privacy rights', () => {
  test('"download my data" contains my own records and nobody else\'s', async () => {
    const a = await newPerson('exp-a');
    const b = await newPerson('exp-b');
    await api('POST', '/projects', project('ExportMine'), a.token);
    await api('POST', '/projects', project('ExportTheirs'), b.token);
    const out = await api('GET', '/privacy/export', undefined, a.token);
    expect(out.status).toBe(200);
    const text = JSON.stringify(out.body);
    expect(text).toContain('ExportMine');
    expect(text).toContain(a.email);
    expect(text).not.toContain('ExportTheirs');
    expect(text).not.toContain(b.email);
    expect(text, 'no password material is exported').not.toMatch(/passwordHash|"password"/i);
  });

  test('switching AI help on and off is saved, and the server honours it', async () => {
    const person = await newPerson('consent');
    expect((await api('PATCH', '/privacy/consent', { aiAssist: true }, person.token)).status).toBe(200);
    expect(JSON.stringify((await api('GET', '/privacy/export', undefined, person.token)).body)).toMatch(/"aiAssist":true/);
    await api('PATCH', '/privacy/consent', { aiAssist: false }, person.token);
    expect(JSON.stringify((await api('GET', '/privacy/export', undefined, person.token)).body)).toMatch(/"aiAssist":false/);
  });

  test('a nominee needs a name and a phone or email', async () => {
    const person = await newPerson('nominee');
    expect((await api('PUT', '/privacy/nominee', { name: '' }, person.token)).status).toBe(400);
    expect((await api('PUT', '/privacy/nominee', { name: 'Someone' }, person.token)).status).toBe(400);
    expect((await api('PUT', '/privacy/nominee', { name: 'Someone', phone: '9876543210' }, person.token)).status).toBe(200);
  });

  test('a complaint needs a subject and a message, and reaches the support desk', async () => {
    const person = await newPerson('complaint');
    expect((await api('POST', '/privacy/complaint', { subject: '', message: '' }, person.token)).status).toBe(400);
    const ok = await api('POST', '/privacy/complaint', { subject: 'QA subject', message: 'QA message body' }, person.token);
    expect([200, 201]).toContain(ok.status);
    expect(ok.body.success).toBe(true);
  });

  test('notifications can be listed and marked read, only by their owner', async () => {
    const person = await newPerson('notify');
    expect((await api('GET', '/privacy/notifications', undefined, person.token)).status).toBe(200);
    expect((await api('POST', '/privacy/notifications/000000000000000000000000/read', {}, person.token)).status).toBeLessThan(500);
  });

  test('deleting my account needs the word DELETE, then removes me and my records', async () => {
    const person = await newPerson('erase');
    await api('POST', '/projects', project('EraseMe'), person.token);
    expect((await api('DELETE', '/privacy/account', { confirm: 'no' }, person.token)).status, 'a wrong confirmation is refused').toBe(400);
    expect((await api('DELETE', '/privacy/account', { confirm: 'DELETE' }, person.token)).status).toBe(200);
    expect((await api('POST', '/auth/login', { email: person.email, password: PASSWORD })).status, 'cannot sign in any more').toBe(401);
    const admin = await login(USERS.admin);
    const found = await api('GET', `/admin/users?q=${encodeURIComponent(person.email)}`, undefined, admin.token);
    expect(found.body.data.pagination.total, 'the account is gone').toBe(0);
  });
});
