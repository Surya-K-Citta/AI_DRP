// @ts-nocheck
import crypto from 'crypto';
import { currentAiContext } from './aiContext';
import { Scrubber, scrubDeep } from './security/piiScrubber';
import { sanitizeForAi } from './sanitizeForAi';
import { AuditService } from '../services/audit.service';

/**
 * Every AI request in the app goes through here (lib/openaiClient.ts wraps the OpenAI client with it).
 *
 *  - one chat model (gpt-4o-mini unless OPENAI_CHAT_MODEL says otherwise); other chat models are replaced
 *  - only the listed non-chat models (speech, transcription, image) are allowed
 *  - personal data is removed from the prompt first and the harmless parts are put back into the answer
 *  - `store: false`, so the request is not kept in OpenAI's stored completions, and a hashed user id (never the real one)
 *  - an audit event with sizes and redaction counts, never the text
 *  - requests can be sent through your own gateway or proxy with OPENAI_BASE_URL (https only)
 */
export const CHAT_MODEL = (process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini').trim();
const OTHER_MODELS = (process.env.OPENAI_OTHER_MODELS || 'whisper-1,tts-1,dall-e-3').split(',').map((m) => m.trim()).filter(Boolean);
const ALLOW_AUDIO = (process.env.AI_ALLOW_AUDIO || 'true').toLowerCase() !== 'false';

export function gatewayConfig() {
  const base = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  let host = '';
  try {
    host = new URL(base).host;
  } catch {
    host = 'invalid';
  }
  return {
    chatModel: CHAT_MODEL,
    otherModels: OTHER_MODELS,
    endpointHost: host,
    viaCustomGateway: Boolean(process.env.OPENAI_BASE_URL),
    piiScrubbing: true,
    storeDisabled: true,
    audioAllowed: ALLOW_AUDIO,
    zeroRetentionConfirmed: (process.env.OPENAI_ZDR_CONFIRMED || '').toLowerCase() === 'true',
    zeroRetentionNote: process.env.OPENAI_ZDR_NOTE || '',
  };
}

/** The base URL must be https (or a local test server). */
export function checkedBaseUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const parsed = new URL(url);
  const local = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
  if (parsed.protocol !== 'https:' && !local) throw new Error('OPENAI_BASE_URL must use https');
  return url;
}

const hashedUser = (userId?: string) => (userId ? crypto.createHash('sha256').update(`ai:${userId}`).digest('hex').slice(0, 24) : undefined);

function textOf(messages: any[]): number {
  return (messages || []).reduce((n, m) => n + (typeof m?.content === 'string' ? m.content.length : Array.isArray(m?.content) ? m.content.reduce((a, p) => a + (typeof p?.text === 'string' ? p.text.length : 0), 0) : 0), 0);
}

function record(action: string, payload: Record<string, unknown>) {
  const ctx = currentAiContext();
  void AuditService.log({ action: 'ai_call', userId: ctx.userId, targetType: action, payload });
}

/** Wraps an OpenAI-style client. `client` is only used through the methods the app calls. */
export function createGateway<T extends Record<string, any>>(client: T): T {
  const ctx = () => currentAiContext();

  const chatCreate = client.chat.completions.create.bind(client.chat.completions);
  client.chat.completions.create = (async (params: any, options?: any) => {
    const scrubber = new Scrubber(ctx().names);
    const started = Date.now();
    const safe = sanitizeForAi({ ...params });
    const messages = scrubDeep(safe.messages, scrubber);
    const requestedModel = params.model;
    const out: any = { ...safe, messages, model: CHAT_MODEL, store: false };
    const user = hashedUser(ctx().userId);
    if (user) out.user = user;
    const response: any = await chatCreate(out, options);
    if (!out.stream && Array.isArray(response?.choices)) {
      for (const choice of response.choices) {
        const message = choice?.message;
        if (message && typeof message.content === 'string') message.content = scrubber.restore(message.content);
        for (const call of message?.tool_calls || []) {
          if (call?.function && typeof call.function.arguments === 'string') call.function.arguments = scrubber.restore(call.function.arguments);
        }
      }
    }
    record('chat', {
      model: CHAT_MODEL,
      requestedModel: requestedModel && requestedModel !== CHAT_MODEL ? requestedModel : undefined,
      promptChars: textOf(messages),
      redactions: scrubber.stats,
      promptTokens: response?.usage?.prompt_tokens,
      completionTokens: response?.usage?.completion_tokens,
      ms: Date.now() - started,
    });
    return response;
  }) as any;

  if (client.audio?.speech?.create) {
    const speech = client.audio.speech.create.bind(client.audio.speech);
    client.audio.speech.create = (async (params: any, options?: any) => {
      if (!ALLOW_AUDIO) throw new Error('Audio is switched off on this server');
      if (!OTHER_MODELS.includes(params.model)) throw new Error(`Model ${params.model} is not allowed`);
      const scrubber = new Scrubber(ctx().names);
      const res = await speech({ ...params, input: scrubber.scrub(String(params.input ?? '')) }, options);
      record('speech', { model: params.model, redactions: scrubber.stats });
      return res;
    }) as any;
  }
  if (client.audio?.transcriptions?.create) {
    const transcribe = client.audio.transcriptions.create.bind(client.audio.transcriptions);
    client.audio.transcriptions.create = (async (params: any, options?: any) => {
      if (!ALLOW_AUDIO) throw new Error('Audio is switched off on this server');
      if (!OTHER_MODELS.includes(params.model)) throw new Error(`Model ${params.model} is not allowed`);
      // A recording cannot be scrubbed, so the prompt text is the only part that can be, and the call is always recorded.
      const scrubber = new Scrubber(ctx().names);
      const next = { ...params };
      if (typeof next.prompt === 'string') next.prompt = scrubber.scrub(next.prompt);
      const res = await transcribe(next, options);
      record('transcription', { model: params.model, note: 'audio recording sent as spoken' });
      return res;
    }) as any;
  }
  if (client.images?.generate) {
    const generate = client.images.generate.bind(client.images);
    client.images.generate = (async (params: any, options?: any) => {
      if (!OTHER_MODELS.includes(params.model)) throw new Error(`Model ${params.model} is not allowed`);
      const scrubber = new Scrubber(ctx().names);
      const res = await generate({ ...params, prompt: scrubber.scrub(String(params.prompt ?? '')) }, options);
      record('image', { model: params.model, redactions: scrubber.stats });
      return res;
    }) as any;
  }
  return client;
}
