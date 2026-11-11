// @ts-nocheck
import { currentAiContext } from '../lib/aiContext';
import { AuditService } from './audit.service';

/**
 * Speech to text with Sarvam AI (Indian-language model, Telugu and Indian English).
 * Used first when SARVAM_API_KEY is set; OpenAI Whisper and the Telugu Whisper model stay as fallbacks
 * (see OpenAIService.transcribeAudio). The key stays on the server: the browser only ever calls /api/ai/transcribe.
 *
 * The REST endpoint takes recordings of up to about 30 seconds, which is what one spoken answer is.
 * Env: SARVAM_API_KEY, SARVAM_STT_MODEL (default saaras:v4), SARVAM_STT_TIMEOUT_MS (default 20000),
 *      AI_ALLOW_AUDIO=false switches all audio transcription off, as for the other providers.
 */
const ENDPOINT = 'https://api.sarvam.ai/speech-to-text';

const LANGUAGE_CODES: Record<string, string> = { te: 'te-IN', en: 'en-IN' };
const MIME_BY_FORMAT: Record<string, string> = {
  webm: 'audio/webm',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
};

export class SarvamSttService {
  static get enabled(): boolean {
    return Boolean(process.env.SARVAM_API_KEY) && (process.env.AI_ALLOW_AUDIO || 'true').toLowerCase() !== 'false';
  }

  static languageCode(language?: string): string {
    return LANGUAGE_CODES[String(language || '').toLowerCase()] || 'unknown';
  }

  static async transcribe(audio: Buffer, language?: 'en' | 'te', audioFormat = 'webm'): Promise<string> {
    const key = process.env.SARVAM_API_KEY;
    if (!key) throw new Error('SARVAM_API_KEY is not set');
    const form = new FormData();
    form.append('file', new Blob([audio], { type: MIME_BY_FORMAT[audioFormat] || 'audio/webm' }), `speech.${audioFormat}`);
    form.append('model', (process.env.SARVAM_STT_MODEL || 'saaras:v4').trim());
    form.append('language_code', SarvamSttService.languageCode(language));

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Number(process.env.SARVAM_STT_TIMEOUT_MS) || 20000);
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'api-subscription-key': key },
        body: form,
        signal: controller.signal,
      });
      if (!response.ok) {
        // The body can hold the provider's message; never log the audio or the key.
        const detail = (await response.text().catch(() => '')).slice(0, 200);
        throw new Error(`Sarvam speech-to-text failed (${response.status}) ${detail}`.trim());
      }
      const body: any = await response.json();
      const transcript = String(body?.transcript ?? '').trim();
      const ctx = currentAiContext?.() || {};
      void AuditService.log({
        action: 'ai_call',
        userId: ctx.userId,
        targetType: 'transcription',
        payload: { provider: 'sarvam', model: process.env.SARVAM_STT_MODEL || 'saaras:v4', note: 'audio recording sent as spoken' },
      });
      return transcript;
    } finally {
      clearTimeout(timer);
    }
  }
}
