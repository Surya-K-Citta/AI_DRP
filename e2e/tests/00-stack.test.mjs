import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, requireStack, QA } from '../lib/harness.mjs';

test('QA stack is up, isolated and seeded', async () => {
  await requireStack();
  assert.match(QA.mongo, /qa/, 'the QA database name must contain "qa"');
  assert.notEqual(new URL(QA.api).port, '5000', 'tests must never use the dev API port');
  const health = await api('GET', '/health');
  assert.equal(health.status, 200);
  for (const key of Object.keys(QA.users)) {
    const login = await api('POST', '/auth/login', { email: QA.users[key].email, password: QA.password });
    assert.equal(login.status, 200, `${key} can sign in`);
  }
});
