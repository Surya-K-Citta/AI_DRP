import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import mongoose from 'mongoose';
import { OpenSttService } from './services/open-stt.service.ts';

mongoose.set('bufferCommands', false); // the audit write has no database here and must fail fast

const realFetch = globalThis.fetch;
const names = ['STT_SERVICE_URL', 'STT_SERVICE_KEY', 'STT_MODEL_TE', 'STT_MODEL_EN', 'AI_ALLOW_AUDIO'] as const;
const saved = Object.fromEntries(names.map((name) => [name, process.env[name]]));
afterEach(() => {
  globalThis.fetch = realFetch;
  for (const name of names) {
    if (saved[name] === undefined) delete process.env[name];
    else process.env[name] = saved[name];
  }
});

describe('self-hosted open-source speech service', () => {
  it('is on only when a URL is set and audio is allowed', () => {
    delete process.env.STT_SERVICE_URL;
    assert.equal(OpenSttService.enabled, false);
    process.env.STT_SERVICE_URL = 'http://stt:8000/';
    assert.equal(OpenSttService.enabled, true);
    assert.equal(OpenSttService.baseUrl, 'http://stt:8000');
    process.env.AI_ALLOW_AUDIO = 'false';
    assert.equal(OpenSttService.enabled, false);
  });

  it('uses the Telugu model for Telugu and the English model otherwise', () => {
    delete process.env.STT_MODEL_TE;
    delete process.env.STT_MODEL_EN;
    assert.equal(OpenSttService.modelFor('te'), 'vasista22/whisper-telugu-small');
    assert.equal(OpenSttService.modelFor('en'), 'Systran/faster-whisper-small.en');
    process.env.STT_MODEL_TE = 'my/telugu-model';
    assert.equal(OpenSttService.modelFor('te'), 'my/telugu-model');
  });

  it('posts to the OpenAI-style endpoint with the model, language and optional key', async () => {
    process.env.STT_SERVICE_URL = 'http://stt:8000';
    process.env.STT_SERVICE_KEY = 'abc';
    delete process.env.STT_MODEL_TE;
    let seen: any;
    globalThis.fetch = (async (url: any, init: any) => {
      seen = { url: String(url), init };
      return new Response(JSON.stringify({ text: ' నా పేరు రవి ' }), { status: 200 });
    }) as any;
    const text = await OpenSttService.transcribe(Buffer.from([1, 2, 3]), 'te', 'webm');
    assert.equal(text, 'నా పేరు రవి');
    assert.equal(seen.url, 'http://stt:8000/v1/audio/transcriptions');
    assert.equal(seen.init.headers.Authorization, 'Bearer abc');
    const form: FormData = seen.init.body;
    assert.equal(form.get('model'), 'vasista22/whisper-telugu-small');
    assert.equal(form.get('language'), 'te');
    assert.ok(form.get('file'));
  });

  it('fails with the status, without echoing the key', async () => {
    process.env.STT_SERVICE_URL = 'http://stt:8000';
    process.env.STT_SERVICE_KEY = 'secret-token';
    globalThis.fetch = (async () => new Response('model not found', { status: 404 })) as any;
    await assert.rejects(
      () => OpenSttService.transcribe(Buffer.from([1]), 'en'),
      (error: Error) => error.message.includes('404') && !error.message.includes('secret-token')
    );
  });
});
