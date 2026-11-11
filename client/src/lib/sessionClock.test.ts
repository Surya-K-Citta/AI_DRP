import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { IDLE_MS, formatClock, idleLeftMs, idleWindowMs, refreshAfterMs, warnMs } from './sessionClock.ts';

describe('idle countdown', () => {
  it('counts 6 minutes from the last real input, whatever the token length', () => {
    const t0 = 1_000_000;
    assert.equal(idleLeftMs(t0, 390_000, t0), IDLE_MS);
    assert.equal(idleLeftMs(t0, 390_000, t0 + 120_000), 240_000);
    assert.equal(formatClock(idleLeftMs(t0, 390_000, t0 + 3_000)), '5:57');
  });
  it('starts over at once when there is new input', () => {
    const t0 = 5_000_000;
    const before = idleLeftMs(t0, 390_000, t0 + 200_000); // 160 s left
    const after = idleLeftMs(t0 + 200_000, 390_000, t0 + 200_000); // input right now
    assert.equal(before, 160_000);
    assert.equal(after, IDLE_MS);
  });
  it('is never longer than a short token (so a test session ends on time)', () => {
    assert.equal(idleWindowMs(20_000), 20_000);
    assert.equal(idleWindowMs(390_000), IDLE_MS);
  });
  it('warns a minute before the end and renews the token every few seconds at most', () => {
    assert.equal(warnMs(390_000), 60_000);
    assert.equal(refreshAfterMs(390_000), 20_000);
    assert.equal(refreshAfterMs(20_000), 5_000);
  });
});
