import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import mongoose from 'mongoose';
import { Scrubber, looksLikePersonalData, scrubDeep } from './lib/security/piiScrubber.ts';
import { collectPersonNames, runWithAiContext } from './lib/aiContext.ts';
import { CHAT_MODEL, checkedBaseUrl, createGateway } from './lib/aiGateway.ts';
import { auditPayload, canonicalEvent, hashEvent, GENESIS_HASH } from './lib/auditChain.ts';

mongoose.set('bufferCommands', false); // the gateway's audit write has no database in these tests; it must fail fast, not wait

const SAMPLE = [
  'Applicant Ravi Kumar (Aadhaar 2345 6789 0123, PAN ABCDE1234F) can be reached on +91 98765 43210 or ravi.kumar@example.com.',
  'GSTIN 37ABCFE1234F1ZV, Udyam UDYAM-AP-01-0001234, a/c no 123456789012, IFSC SBIN0001234.',
  'Date of birth: 12/05/1990. Lives at D.No 12-3-45, Gandhi Nagar, Tenali.',
  'The unit makes mango pickle in Tenali, Guntur, costs ₹25,00,000 (cost 25.00 lakh), started 2026-01-05, serves customers < 5 km away.',
].join('\n');

describe('personal data removal', () => {
  it('leaves nothing that looks like personal data', () => {
    const scrubber = new Scrubber(['Ravi Kumar']);
    const out = scrubber.scrub(SAMPLE);
    assert.deepEqual(looksLikePersonalData(out), [], out);
    for (const secret of ['2345 6789 0123', 'ABCDE1234F', '98765 43210', 'ravi.kumar@example.com', '37ABCFE1234F1ZV', 'UDYAM-AP-01-0001234', '123456789012', 'SBIN0001234', '12-3-45', 'Ravi', 'Kumar', '12/05/1990']) {
      assert.ok(!out.includes(secret), `${secret} leaked: ${out}`);
    }
    assert.ok(scrubber.total >= 10);
  });
  it('keeps what the report is about', () => {
    const out = new Scrubber(['Ravi Kumar']).scrub(SAMPLE);
    for (const keep of ['mango pickle', 'Tenali, Guntur', '₹25,00,000', '25.00 lakh', '2026-01-05', '< 5 km']) assert.ok(out.includes(keep), `${keep} lost: ${out}`);
  });
  it('puts names, e-mails and phones back into the answer but never identity numbers', () => {
    const scrubber = new Scrubber(['Ravi Kumar']);
    const sent = scrubber.scrub('Write to Ravi Kumar at ravi@example.com, mobile 9876543210, PAN ABCDE1234F.');
    const back = scrubber.restore(`Dear ${sent.match(/\[PERSON_\d+\]/)?.[0]}, contact ${sent.match(/\[EMAIL_\d+\]/)?.[0]}, ${sent.match(/\[PHONE_\d+\]/)?.[0]}, ${sent.match(/\[PAN_\d+\]/)?.[0]}`);
    assert.ok(back.includes('Ravi Kumar') && back.includes('ravi@example.com') && back.includes('9876543210'));
    assert.ok(!back.includes('ABCDE1234F') && back.includes('[PAN_1]'));
  });
  it('handles names written in parts, other casing and Telugu', () => {
    const s = new Scrubber(['కృష్ణ మూర్తి', 'Lakshmi Devi']);
    const out = s.scrub('lakshmi devi and DEVI Garu met కృష్ణ మూర్తి');
    assert.ok(!/lakshmi|devi|కృష్ణ|మూర్తి/i.test(out), out);
  });
  it('walks nested prompts and is safe to run twice', () => {
    const s = new Scrubber(['Ravi']);
    const messages = [{ role: 'user', content: 'Call 9876543210 about Ravi' }, { role: 'system', content: [{ type: 'text', text: 'a@b.co' }] }];
    const once = scrubDeep(messages, s);
    assert.deepEqual(scrubDeep(once, new Scrubber(['Ravi'])), once);
    assert.ok(!JSON.stringify(once).match(/9876543210|a@b\.co|Ravi/));
  });
  it('collects names from a request body', () => {
    const names = collectPersonNames({ schemeExtras: { entrepreneurName: 'K. Ravi' }, step11: { spvName: 'Ravi Traders', promoters: [{ name: 'Sita Rani' }, { name: 'Anil' }], password: 'x' }, other: { name: 'ignored thing' } });
    assert.deepEqual(names.sort(), ['Anil', 'K. Ravi', 'Ravi Traders', 'Sita Rani']);
  });
});

function fakeClient() {
  const calls: any[] = [];
  const client: any = {
    chat: { completions: { create: async (params: any) => { calls.push(params); return { choices: [{ message: { role: 'assistant', content: `Report for ${params.messages[0].content.match(/\[PERSON_\d+\]/)?.[0] ?? 'nobody'}` } }], usage: { prompt_tokens: 10, completion_tokens: 5 } }; } } },
    audio: { speech: { create: async (p: any) => { calls.push(p); return {}; } }, transcriptions: { create: async (p: any) => { calls.push(p); return { text: 'ok' }; } } },
    images: { generate: async (p: any) => { calls.push(p); return {}; } },
  };
  return { client: createGateway(client), calls };
}

describe('AI gateway', () => {
  it('uses one chat model, stores nothing, scrubs the prompt, hashes the user and restores the answer', async () => {
    const { client, calls } = fakeClient();
    const response: any = await runWithAiContext({ userId: 'user-123', names: ['Ravi Kumar'] }, () =>
      client.chat.completions.create({ model: 'gpt-4o', messages: [{ role: 'user', content: 'Ravi Kumar, phone 9876543210, makes pickle' }], temperature: 0.2 })
    );
    const sent = calls[0];
    assert.equal(sent.model, CHAT_MODEL);
    assert.equal(CHAT_MODEL, 'gpt-4o-mini');
    assert.equal(sent.store, false);
    assert.equal(sent.temperature, 0.2);
    assert.ok(!JSON.stringify(sent.messages).match(/Ravi|Kumar|9876543210/));
    assert.match(sent.user, /^[0-9a-f]{24}$/);
    assert.ok(!sent.user.includes('user-123'));
    assert.equal(response.choices[0].message.content, 'Report for Ravi Kumar');
  });
  it('scrubs speech and image prompts and refuses models that are not on the list', async () => {
    const { client, calls } = fakeClient();
    await runWithAiContext({ names: ['Ravi Kumar'] }, async () => {
      await client.audio.speech.create({ model: 'tts-1', input: 'Hello Ravi Kumar 9876543210' });
      await client.images.generate({ model: 'dall-e-3', prompt: 'Workshop of Ravi Kumar' });
    });
    assert.ok(!JSON.stringify(calls).match(/Ravi|9876543210/));
    await assert.rejects(() => client.images.generate({ model: 'some-other-model', prompt: 'x' }), /not allowed/);
    await assert.rejects(() => client.audio.speech.create({ model: 'gpt-4o', input: 'x' }), /not allowed/);
  });
  it('only accepts an https gateway address (or a local test server)', () => {
    assert.equal(checkedBaseUrl(undefined), undefined);
    assert.equal(checkedBaseUrl('https://ai-gateway.example.org/v1'), 'https://ai-gateway.example.org/v1');
    assert.equal(checkedBaseUrl('http://127.0.0.1:9999/v1'), 'http://127.0.0.1:9999/v1');
    assert.throws(() => checkedBaseUrl('http://ai.example.org/v1'), /https/);
  });
});

describe('audit trail records', () => {
  const base = { seq: 7, at: '2026-10-15T10:00:00.000Z', userId: 'u1', role: 'admin', action: 'user_update', targetType: 'user', targetId: 'u2', ip: '1.2.3.4', payload: { b: 2, a: 1 } };
  it('hashes the same event to the same value whatever the key order', () => {
    assert.equal(hashEvent(base, GENESIS_HASH), hashEvent({ ...base, payload: { a: 1, b: 2 } }, GENESIS_HASH));
    assert.match(hashEvent(base, GENESIS_HASH), /^[0-9a-f]{64}$/);
  });
  it('changes the hash when any recorded part or the previous hash changes', () => {
    const original = hashEvent(base, GENESIS_HASH);
    for (const change of [{ role: 'officer' }, { action: 'user_delete' }, { targetId: 'u3' }, { ip: '1.2.3.5' }, { payload: { a: 1, b: 3 } }, { at: '2026-10-15T10:00:00.001Z' }, { userId: 'u9' }, { seq: 8 }]) {
      assert.notEqual(hashEvent({ ...base, ...change }, GENESIS_HASH), original, JSON.stringify(change));
    }
    assert.notEqual(hashEvent(base, 'f'.repeat(64)), original);
    assert.ok(canonicalEvent(base, GENESIS_HASH).includes(GENESIS_HASH));
  });
  it('keeps secrets, identity numbers and long text out of the payload', () => {
    const cleaned: any = auditPayload({ reason: 'x'.repeat(900), password: 'p', nested: { token: 't', aadhaarNumber: '1', ok: 1 }, list: Array.from({ length: 50 }, (_, i) => i) });
    assert.equal(cleaned.password, '[redacted]');
    assert.equal(cleaned.nested.token, '[redacted]');
    assert.equal(cleaned.nested.aadhaarNumber, '[redacted]');
    assert.equal(cleaned.nested.ok, 1);
    assert.ok(cleaned.reason.length <= 501);
    assert.equal(cleaned.list.length, 20);
  });
});
