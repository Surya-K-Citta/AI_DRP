// @ts-nocheck
import { currentAiContext } from '../lib/aiContext';
import { AuditService } from './audit.service';

/**
 * Speech to text with an open-source model you host yourself, through any server that speaks the OpenAI
 * `/v1/audio/transcriptions` API (for example speaches / faster-whisper-server, whisper.cpp's server, LocalAI).
 * This is how Telugu is handled: the IIT Madras Whisper fine-tunes (`vasista22/whisper-telugu-*`, Apache-2.0) are
 * far better at Telugu than general Whisper. The audio goes to your own server, not to a third party.
 *
 * Env:
 *   STT_SERVICE_URL   base URL of that server, e.g. http://stt:8000 (this service is off while it is empty)
 *   STT_SERVICE_KEY   optional bearer token
 *   STT_MODEL_TE      model name the server knows for Telugu (default vasista22/whisper-telugu-small)
 *   STT_MODEL_EN      model name for English (default Systran/faster-whisper-small.en)
 *   STT_SERVICE_TIMEOUT_MS  default 30000
 *   AI_ALLOW_AUDIO=false switches all audio transcription off.
 */
const MIME_BY_FORMAT: Record<string, string> = {
  webm: 'audio/webm',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
};

export class OpenSttService {
  static get baseUrl(): string {
    return String(process.env.STT_SERVICE_URL || '').trim().replace(/\/+$/, '');
  }

  static get enabled(): boolean {
    return Boolean(OpenSttService.baseUrl) && (process.env.AI_ALLOW_AUDIO || 'true').toLowerCase() !== 'false';
  }

  static modelFor(language?: string): string {
    return language === 'te'
      ? (process.env.STT_MODEL_TE || 'vasista22/whisper-telugu-small').trim()
      : (process.env.STT_MODEL_EN || 'Systran/faster-whisper-small.en').trim();
  }

  static async transcribe(audio: Buffer, language?: 'en' | 'te', audioFormat = 'webm'): Promise<string> {
    if (!OpenSttService.baseUrl) throw new Error('STT_SERVICE_URL is not set');
    const model = OpenSttService.modelFor(language);
    const form = new FormData();
    form.append('file', new Blob([audio], { type: MIME_BY_FORMAT[audioFormat] || 'audio/webm' }), `speech.${audioFormat}`);
    form.append('model', model);
    form.append('response_format', 'json');
    if (language === 'te' || language === 'en') form.append('language', language);

    const headers: Record<string, string> = {};
    if (process.env.STT_SERVICE_KEY) headers.Authorization = `Bearer ${process.env.STT_SERVICE_KEY}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Number(process.env.STT_SERVICE_TIMEOUT_MS) || 30000);
    try {
      const response = await fetch(`${OpenSttService.baseUrl}/v1/audio/transcriptions`, {
        method: 'POST',
        headers,
        body: form,
        signal: controller.signal,
      });
      if (!response.ok) {
        const detail = (await response.text().catch(() => '')).slice(0, 200);
        throw new Error(`Speech service failed (${response.status}) ${detail}`.trim());
      }
      const body: any = await response.json();
      const text = String(body?.text ?? '').trim();
      const ctx = currentAiContext?.() || {};
      void AuditService.log({
        action: 'ai_call',
        userId: ctx.userId,
        targetType: 'transcription',
        payload: { provider: 'self-hosted', model, note: 'audio recording sent to our own speech server' },
      });
      return text;
    } finally {
      clearTimeout(timer);
    }
  }
}
