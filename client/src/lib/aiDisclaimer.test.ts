import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { AI_DISCLAIMER_TEXT } from './aiDisclaimer.ts';

describe('AI disclaimer wording', () => {
  it('is the same in the client, the stylesheet and the server', () => {
    const css = readFileSync(new URL('../styles/dpr-print.css', import.meta.url), 'utf8');
    assert.ok(css.includes(AI_DISCLAIMER_TEXT), 'text missing in css');
    const server = readFileSync(new URL('../../../server/src/lib/aiDisclaimer.ts', import.meta.url), 'utf8');
    assert.ok(server.includes(AI_DISCLAIMER_TEXT.replace(/'/g, "\\'")));
  });
});
