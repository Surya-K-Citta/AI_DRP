import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import mongoose from 'mongoose';
import { SarvamSttService } from './services/sarvam-stt.service.ts';

mongoose.set('bufferCommands', false); // the audit write has no database here and must fail fast

const realFetch = globalThis.fetch;
const env = { key: process.env.SARVAM_API_KEY, audio: process.env.AI_ALLOW_AUDIO, model: process.env.SARVAM_STT_MODEL };
afterEach(() => {
  globalThis.fetch = realFetch;
  for (const [name, value] of [['SARVAM_API_KEY', env.key], ['AI_ALLOW_AUDIO', env.audio], ['SARVAM_STT_MODEL', env.model]] as const) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

describe('Sarvam speech to text', () => {
  it('is on only with a key, and off when audio is switched off', () => {
    delete process.env.SARVAM_API_KEY;
    assert.equal(SarvamSttService.enabled, false);
    process.env.SARVAM_API_KEY = 'test-key';
    assert.equal(SarvamSttService.enabled, true);
    process.env.AI_ALLOW_AUDIO = 'false';
    assert.equal(SarvamSttService.enabled, false);
  });

  it('maps the app language to a Sarvam language code', () => {
    assert.equal(SarvamSttService.languageCode('te'), 'te-IN');
    assert.equal(SarvamSttService.languageCode('en'), 'en-IN');
    assert.equal(SarvamSttService.languageCode(undefined), 'unknown');
  });

  it('sends the recording with the key in a header and returns the transcript', async () => {
    process.env.SARVAM_API_KEY = 'test-key';
    delete process.env.SARVAM_STT_MODEL;
    let seen: any;
    globalThis.fetch = (async (url: any, init: any) => {
      seen = { url: String(url), init };
      return new Response(JSON.stringify({ transcript: '  నా పేరు రవి  ' }), { status: 200 });
    }) as any;
    const text = await SarvamSttService.transcribe(Buffer.from([1, 2, 3]), 'te', 'webm');
    assert.equal(text, 'నా పేరు రవి');
    assert.equal(seen.url, 'https://api.sarvam.ai/speech-to-text');
    assert.equal(seen.init.headers['api-subscription-key'], 'test-key');
    const form: FormData = seen.init.body;
    assert.equal(form.get('language_code'), 'te-IN');
    assert.equal(form.get('model'), 'saaras:v4');
    assert.ok(form.get('file'));
  });

  it('fails with the status when the service refuses, without echoing the key', async () => {
    process.env.SARVAM_API_KEY = 'secret-key';
    globalThis.fetch = (async () => new Response('quota exceeded', { status: 429 })) as any;
    await assert.rejects(
      () => SarvamSttService.transcribe(Buffer.from([1]), 'en'),
      (error: Error) => error.message.includes('429') && !error.message.includes('secret-key')
    );
  });
});
