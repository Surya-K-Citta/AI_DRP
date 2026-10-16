import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { basicMissing, financeBlockers } from './lib/financeGuard.ts';

const vectors = JSON.parse(readFileSync(new URL('./financeGuard.vectors.json', import.meta.url), 'utf8')) as { name: string; data: any; blockers: string[] }[];

describe('server finance guard agrees with the client rules', () => {
  for (const vector of vectors) {
    it(vector.name, () => {
      assert.deepEqual(financeBlockers(vector.data).map((b) => b.id).sort(), vector.blockers);
    });
  }
  it('covers the scenarios that matter', () => {
    const names = vectors.map((v) => v.name).join('|');
    for (const needle of ['balanced', 'equity', 'debt equity', 'mudra', 'standup', 'pmfme', 'sclcss']) assert.ok(names.includes(needle), needle);
    assert.ok(vectors.some((v) => v.blockers.length === 0) && vectors.some((v) => v.blockers.length > 0));
  });
});

describe('basic required fields', () => {
  it('lists unit name, district and location when empty', () => {
    assert.deepEqual(basicMissing({}), ['unitName', 'district', 'location']);
    assert.deepEqual(basicMissing({ step1: { clusterName: 'A', district: 'Guntur', location: 'Tenali' } }), []);
  });
});
