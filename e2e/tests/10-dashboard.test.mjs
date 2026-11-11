// DASH: the dashboard home page: summary numbers match the data, every card, step and shortcut opens the right place, and deleting asks first.
import { before, after, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { launch, openPage, go, requireStack, api, signIn, clickText, bodyText, waitFor, sleep, unique, dbClose, horizontalOverflow } from '../lib/harness.mjs';

let browser;
before(async () => { await requireStack(); browser = await launch(); });
after(async () => { await browser?.close(); await dbClose(); });

const pathOf = (page) => { const u = new URL(page.url()); return u.pathname + u.search; };
const draft = (name) => ({ clusterData: { step1: { unitName: name, location: 'Guntur', district: 'Guntur' }, isIndividualDPR: true } });

/** A person with exactly one draft, so the numbers and the recent list are easy to check. */
async function newPerson() {
  const email = `${unique('dash')}@msme.test`;
  const made = await api('POST', '/auth/register', { name: 'QA Dash', email, password: 'Qa-Test-2026!', phoneNumber: '9876543210', dateOfBirth: '1990-01-01', accountConsent: true, privacyConsent: true });
  assert.equal(made.status, 201, JSON.stringify(made.body));
  return { token: made.body.data.token, email };
}
async function openAs(token, user, opts = {}) {
  const page = await openPage(browser, opts);
  await page.evaluateOnNewDocument((state) => {
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user: state.user, token: state.token, isAuthenticated: true }, version: 0 }));
    localStorage.setItem('token', state.token);
  }, { token, user });
  return page;
}

describe('dashboard layout and numbers', () => {
  test('DASH-001 the page shows the journey, five summary cards, recent reports, scheme finder and quick actions in order', async () => {
    const page = await openPage(browser, { as: 'consultant' });
    await go(page, '/dashboard', 2000);
    const order = await page.evaluate(() => [...document.querySelectorAll('main h1, main h2')].map((h) => h.textContent.trim()));
    const expected = ['Welcome back', 'Create a DPR in simple steps', 'My Recent DPRs', 'Search Scheme', 'Quick Actions'];
    let at = -1;
    for (const title of expected) {
      const next = order.findIndex((text, i) => i > at && text.startsWith(title));
      assert.ok(next > at, `"${title}" is missing or out of order in ${JSON.stringify(order)}`);
      at = next;
    }
    assert.equal(await page.evaluate(() => document.querySelectorAll('main h1').length), 1, 'one page heading');
    assert.equal(await horizontalOverflow(page) <= 1, true, 'no sideways scrolling');
    await page.close();
  });

  test('DASH-002 the five summary numbers equal what is stored for this person', async () => {
    const me = await newPerson();
    for (const n of [1, 2]) assert.equal((await api('POST', '/dpr/cluster/draft/save', draft(unique(`QA Num${n}`)), me.token)).status, 200);
    const profile = await api('GET', '/auth/profile', undefined, me.token);
    const page = await openAs(me.token, profile.body.data?.user || profile.body.data);
    await go(page, '/dashboard', 2500);
    const cards = await page.evaluate(() => [...document.querySelectorAll('section[aria-label="DPR summary"] button')].map((b) => b.getAttribute('aria-label')));
    assert.equal(cards.length, 5);
    assert.match(cards[0], /^Total DPRs: 2\./);
    assert.match(cards[1], /^Draft: 2\./);
    assert.match(cards[2], /^Submitted: 0\./);
    assert.match(cards[3], /^Analyzed: 0\./);
    assert.match(cards[4], /^Avg Quality: N\/A\./, 'no score is invented when nothing has been analysed');
    await page.close();
  });

  test('DASH-003 a person with no reports sees a clear empty state with a way to start', async () => {
    const me = await newPerson();
    const profile = await api('GET', '/auth/profile', undefined, me.token);
    const page = await openAs(me.token, profile.body.data?.user || profile.body.data);
    await go(page, '/dashboard', 2500);
    assert.match(await bodyText(page), /No DPRs yet/);
    await clickText(page, 'main button', /^Create DPR/);
    await waitFor(page, () => location.pathname === '/individual-dpr/create');
    await page.close();
  });
});

describe('dashboard navigation', () => {
  test('DASH-010 the Draft card opens the report list already filtered to drafts', async () => {
    const page = await openPage(browser, { as: 'consultant' });
    await go(page, '/dashboard', 2000);
    await clickText(page, 'section[aria-label="DPR summary"] button', /^Draft:/);
    await waitFor(page, () => location.pathname === '/dprs');
    assert.equal(pathOf(page), '/dprs?status=draft');
    await sleep(1500);
    assert.equal(await page.evaluate(() => [...document.querySelectorAll('select')].some((s) => s.value === 'draft')), true, 'the status filter shows Draft');
    await page.close();
  });

  test('DASH-011 the top-right Create DPR and Scheme Finder buttons and the Take Quick Guide button open their pages', async () => {
    const page = await openPage(browser, { as: 'consultant' });
    await go(page, '/dashboard', 2000);
    await clickText(page, '[data-tour=actions] button', /^Create DPR/);
    await waitFor(page, () => location.pathname === '/individual-dpr/create');
    await go(page, '/dashboard', 1500);
    await clickText(page, '[data-tour=journey] button', /Take Quick Guide/);
    await waitFor(page, () => location.pathname === '/individual-dpr/guide');
    await go(page, '/dashboard', 1500);
    await clickText(page, '[data-tour=actions] button', /^Scheme Finder$/);
    await waitFor(page, () => location.pathname === '/venture-match');
    await page.close();
  });

  test('DASH-012 the four "simple steps" boxes only explain; they are not buttons or links', async () => {
    const page = await openPage(browser, { as: 'consultant' });
    await go(page, '/dashboard', 2000);
    const steps = await page.evaluate(() => [...document.querySelectorAll('[data-tour=journey] ol li')].map((li) => ({ text: li.innerText.replace(/\s+/g, ' ').trim(), interactive: li.querySelectorAll('button, a, [role=button], [tabindex]').length })));
    assert.equal(steps.length, 4);
    assert.deepEqual(steps.map((s) => s.interactive), [0, 0, 0, 0]);
    assert.match(steps[0].text, /1\. Create/);
    assert.match(steps[3].text, /4\. Generate/);
    const before = new URL(page.url()).pathname;
    await page.evaluate(() => document.querySelector('[data-tour=journey] ol li div').click());
    await sleep(500);
    assert.equal(new URL(page.url()).pathname, before, 'pressing a step goes nowhere');
    await page.close();
  });

  test('DASH-014 searching in Scheme Finder opens the scheme list with the words already typed', async () => {
    const page = await openPage(browser, { as: 'consultant' });
    await go(page, '/dashboard', 2000);
    await page.fill('input[type=search]', 'food');
    await page.keyboard.press('Enter');
    await waitFor(page, () => location.pathname === '/individual-dpr/create');
    await sleep(1500);
    assert.equal(await page.evaluate(() => [...document.querySelectorAll('input')].some((i) => i.value === 'food')), true, 'the search box holds "food"');
    await page.close();
  });

  test('DASH-022 the Search Scheme card lists real schemes, narrows them as you type, and a scheme starts a DPR for it', async () => {
    const page = await openPage(browser, { as: 'consultant' });
    await go(page, '/dashboard', 2000);
    const count = () => page.evaluate(() => document.querySelectorAll('[aria-labelledby=finder-list-title] li').length);
    assert.ok((await count()) >= 5, 'popular schemes are listed');
    await page.fill('input[type=search]', 'mudra');
    await sleep(400);
    assert.equal(await count(), 1, 'typing narrows the list');
    await clickText(page, '[aria-labelledby=finder-list-title] button', /MUDRA/i);
    await waitFor(page, () => location.pathname === '/individual-dpr/create' && location.search.includes('scheme=MUDRA'), undefined, 8000);
    await page.close();
  });

  test('DASH-015 a popular sector chip and the quick-action tiles open their places', async () => {
    const page = await openPage(browser, { as: 'consultant' });
    await go(page, '/dashboard', 2000);
    await clickText(page, 'main button', /^Manufacturing$/);
    await waitFor(page, () => location.pathname === '/individual-dpr/create' && location.search.includes('q=Manufacturing'));
    for (const [label, path] of [[/^Start with a guide/, '/individual-dpr/guide'], [/^Scheme Finder/, '/venture-match'], [/^My Projects/, '/projects']]) {
      await go(page, '/dashboard', 1500);
      await clickText(page, 'section[aria-labelledby="quick-actions-title"] button', label);
      await waitFor(page, (p) => location.pathname === p, p => p, 8000).catch(() => {});
      assert.equal(new URL(page.url()).pathname, path);
    }
    await page.close();
  });
});

describe('guided tour', () => {
  const panelTitle = (page) => page.evaluate(() => document.getElementById('tour-title')?.textContent);
  const press = (page, label) => clickText(page, '[role=dialog][aria-labelledby=tour-title] button', label);
  const next = async (page) => { await press(page, /^Next/); await sleep(450); };

  test('TOUR-001 Take a Tour starts at the beginning, explains the page, then points an arrow at Create DPR', async () => {
    const page = await openPage(browser, { as: 'consultant' });
    await go(page, '/dashboard', 2000);
    await clickText(page, '[data-tour=journey] button', /Take a Tour/);
    await waitFor(page, () => !!document.getElementById('tour-title'));
    assert.equal(await panelTitle(page), 'Welcome to the tour');
    await next(page);
    assert.equal(await panelTitle(page), 'Your reports at a glance');
    await next(page);
    assert.equal(await panelTitle(page), 'Start a new DPR');
    await waitFor(page, () => !!document.querySelector('.tour-arrow'), undefined, 5000);
    assert.equal(await page.evaluate(() => document.querySelector('[data-tour-active="click"]')?.textContent.trim()), 'Create DPR', 'the arrow marks the real Create DPR button');
    await page.close();
  });

  test('TOUR-002 pressing the button the arrow points at moves the tour on, across pages, to the scheme choice', async () => {
    const page = await openPage(browser, { as: 'consultant' });
    await go(page, '/dashboard', 2000);
    await clickText(page, '[data-tour=journey] button', /Take a Tour/);
    await next(page); await next(page);
    await page.click('[data-tour-active="click"]');
    await waitFor(page, () => location.pathname === '/individual-dpr/create', undefined, 10000);
    await waitFor(page, () => document.getElementById('tour-title')?.textContent === 'Choose how you want to apply', undefined, 10000);
    await next(page);
    assert.equal(await panelTitle(page), 'Pick one to try');
    await waitFor(page, () => document.querySelector('[data-tour-active="click"]')?.textContent.includes('bank term loan') || document.querySelector('[data-tour-active="click"]')?.textContent.includes('Bank term loan'), undefined, 8000);
    await page.close();
  });

  test('TOUR-003 Exit tour stops at any point and returns to the dashboard, nothing stays marked, and the tour can be started again from the beginning', async () => {
    const page = await openPage(browser, { as: 'consultant' });
    await go(page, '/dashboard', 2000);
    await clickText(page, '[data-tour=journey] button', /Take a Tour/);
    await next(page); await next(page);
    await page.click('[data-tour-active="click"]');
    await waitFor(page, () => location.pathname === '/individual-dpr/create', undefined, 10000);
    await press(page, /^Exit tour/);
    await waitFor(page, () => location.pathname === '/dashboard', undefined, 8000);
    await sleep(400);
    assert.equal(await page.evaluate(() => !!document.getElementById('tour-title') || !!document.querySelector('.tour-arrow') || !!document.querySelector('[data-tour-active]')), false);
    await page.reload(); await sleep(1800);
    assert.equal(await page.evaluate(() => !!document.getElementById('tour-title')), false, 'it stays closed after a reload');
    await clickText(page, '[data-tour=journey] button', /Take a Tour/);
    await waitFor(page, () => document.getElementById('tour-title')?.textContent === 'Welcome to the tour');
    await page.close();
  });

  test('TOUR-004 the full walk-through: scheme, brief, form explained, sample answers filled in, Save Draft pressed, finished', async () => {
    const me = await newPerson();
    const profile = await api('GET', '/auth/profile', undefined, me.token);
    const page = await openAs(me.token, profile.body.data?.user || profile.body.data, { width: 1440, height: 1000 });
    await go(page, '/dashboard', 2500);
    await clickText(page, '[data-tour=journey] button', /Take a Tour/);
    await next(page); await next(page);
    await page.click('[data-tour-active="click"]');
    await waitFor(page, () => document.getElementById('tour-title')?.textContent === 'Choose how you want to apply', undefined, 10000);
    await next(page);
    await waitFor(page, () => !!document.querySelector('[data-tour-active="click"]'), undefined, 8000);
    await page.click('[data-tour-active="click"]');
    await waitFor(page, () => document.getElementById('tour-title')?.textContent === 'A short brief first', undefined, 10000);
    await next(page);
    assert.equal(await panelTitle(page), 'Start the steps');
    await waitFor(page, () => !!document.querySelector('[data-tour-active="click"]'), undefined, 8000);
    await page.click('[data-tour-active="click"]');
    await waitFor(page, () => document.getElementById('tour-title')?.textContent === 'Your progress', undefined, 10000);
    await next(page);
    assert.equal(await panelTitle(page), 'Where you answer');
    await next(page);
    assert.equal(await panelTitle(page), 'Try it with sample answers');
    await press(page, /Fill sample answers/);
    await waitFor(page, () => document.getElementById('tour-title')?.textContent === 'The report writes itself', undefined, 10000);
    const filled = await page.evaluate(() => document.querySelector('#dpr-preview')?.innerText.includes('Sri Annapurna'));
    assert.equal(filled, true, 'the sample answers show in the report');
    await next(page); await next(page); await next(page);
    assert.equal(await panelTitle(page), 'Save your work');
    await waitFor(page, () => !!document.querySelector('[data-tour-active="click"]'), undefined, 8000);
    await page.click('[data-tour-active="click"]');
    await waitFor(page, () => document.getElementById('tour-title')?.textContent === 'Check my answers', undefined, 10000);
    await next(page);
    assert.equal(await panelTitle(page), 'Generate the DPR');
    await press(page, /^Finish/);
    await sleep(400);
    assert.equal(await page.evaluate(() => !!document.getElementById('tour-title')), false, 'Finish ends the tour');
    await waitFor(page, () => location.pathname === '/dashboard', undefined, 8000);
    await page.close();
  });
});

describe('guided tour rules', () => {
  test('TOUR-005 on a click step a "Click here" label shows; on every step only the tour panel and the one button to press respond', async () => {
    const page = await openPage(browser, { as: 'consultant' });
    await go(page, '/dashboard', 2000);
    await clickText(page, '[data-tour=journey] button', /Take a Tour/);
    await waitFor(page, () => !!document.getElementById('tour-title'));
    // Information step: the page behind is switched off.
    await page.evaluate(() => [...document.querySelectorAll('main button')].find((b) => /View All DPRs/.test(b.textContent))?.click());
    await page.mouse.click(10, 10);
    await sleep(500);
    assert.equal(new URL(page.url()).pathname, '/dashboard', 'a click on the page does nothing');
    const view = await page.$('main button:has-text("View All DPRs")');
    await view.click({ force: true }).catch(() => {});
    await sleep(500);
    assert.equal(new URL(page.url()).pathname, '/dashboard', 'View All DPRs is switched off during an information step');
    assert.equal(await page.evaluate(() => !!document.body.innerText.match(/Click here/)), false, 'no "Click here" label on an information step');
    await clickText(page, '[role=dialog][aria-labelledby=tour-title] button', /^Next/); await sleep(400);
    await clickText(page, '[role=dialog][aria-labelledby=tour-title] button', /^Next/); await sleep(800);
    // Click step: the label shows, and Scheme Finder (not the target) is still switched off.
    assert.equal(await page.evaluate(() => /CLICK HERE|Click here/i.test(document.body.innerText)), true, 'a "Click here" label shows');
    await page.evaluate(() => [...document.querySelectorAll('[data-tour=actions] button')].find((b) => /Scheme Finder/.test(b.textContent))?.click());
    await sleep(500);
    assert.equal(new URL(page.url()).pathname, '/dashboard', 'other buttons stay off on a click step');
    await page.click('[data-tour-active="click"]');
    await waitFor(page, () => location.pathname === '/individual-dpr/create', undefined, 8000);
    await page.close();
  });

  test('TOUR-006 the explanation sits next to what it explains and never covers it', async () => {
    const page = await openPage(browser, { as: 'consultant', width: 1440, height: 1000 });
    await go(page, '/dashboard', 2000);
    await clickText(page, '[data-tour=journey] button', /Take a Tour/);
    await waitFor(page, () => !!document.getElementById('tour-title'));
    await sleep(900);
    const near = await page.evaluate(() => {
      const panel = document.querySelector('[role=dialog][aria-labelledby=tour-title]').getBoundingClientRect();
      const target = document.querySelector('[data-tour-active]').getBoundingClientRect();
      const gap = panel.top >= target.bottom ? panel.top - target.bottom : target.top >= panel.bottom ? target.top - panel.bottom : 0;
      return { gap, overlaps: !(panel.right < target.left || panel.left > target.right || panel.bottom < target.top || panel.top > target.bottom) };
    });
    assert.equal(near.overlaps, false, 'the panel does not cover what it explains');
    assert.ok(near.gap <= 60, `the panel is ${near.gap}px from its target`);
    await page.close();
  });
});

describe('dashboard report rows', () => {
  test('DASH-020 a row opens the report, and Delete asks first and only then removes it', async () => {
    const me = await newPerson();
    const unit = unique('QA Row');
    assert.equal((await api('POST', '/dpr/cluster/draft/save', draft(unit), me.token)).status, 200);
    const profile = await api('GET', '/auth/profile', undefined, me.token);
    const page = await openAs(me.token, profile.body.data?.user || profile.body.data);
    await go(page, '/dashboard', 2500);
    assert.match(await bodyText(page), new RegExp(unit));
    await clickText(page, 'main ul button', new RegExp('^Delete ' + unit));
    await waitFor(page, () => !!document.querySelector('[role=dialog]'));
    await clickText(page, '[role=dialog] button', /^(Cancel|No|Keep)/i);
    await sleep(600);
    assert.match(await bodyText(page), new RegExp(unit), 'cancelling keeps the report');
    await clickText(page, 'main ul button', new RegExp('^Delete ' + unit));
    await waitFor(page, () => !!document.querySelector('[role=dialog]'));
    await clickText(page, '[role=dialog] button', /^(Delete|Yes|Confirm)/i);
    await waitFor(page, (u) => !document.body.innerText.includes(u), unit, 10000);
    await page.close();
  });

  test('DASH-021 View on a row opens that report', async () => {
    const page = await openPage(browser, { as: 'consultant' });
    await go(page, '/dashboard', 2500);
    await page.evaluate(() => document.querySelector('main ul button[aria-label^="View "]').click());
    await waitFor(page, () => location.pathname.startsWith('/dpr/view/'), undefined, 10000);
    await page.close();
  });
});
