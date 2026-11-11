/**
 * Speech to text that runs inside the browser, with an open-source Whisper model (Apache-2.0) through Transformers.js
 * and ONNX Runtime Web. Nothing is uploaded: the recording never leaves the device, and after the first download
 * (cached by the browser) it works offline.
 *
 * English only for now: the model is `whisper-base.en`. Telugu has no ready-made in-browser model, so it goes to the
 * server (see server/src/services/open-stt.service.ts).
 *
 * Settings (all optional, set at build time):
 *   VITE_VOICE_LOCAL=false         switch this off, so English also goes to the server
 *   VITE_VOICE_EN_MODEL            another Whisper ONNX repo, e.g. onnx-community/whisper-small.en (better, bigger)
 *   VITE_VOICE_MODEL_HOST          host the model files yourself instead of huggingface.co
 */
const MODEL = (import.meta.env?.VITE_VOICE_EN_MODEL as string | undefined) || 'onnx-community/whisper-base.en';
const MODEL_HOST = import.meta.env?.VITE_VOICE_MODEL_HOST as string | undefined;
const LOCAL_ENABLED = String(import.meta.env?.VITE_VOICE_LOCAL ?? 'true').toLowerCase() !== 'false';

export const LOCAL_MODEL_SIZE_MB = 80;

export function localVoiceSupported(): boolean {
  return LOCAL_ENABLED && typeof WebAssembly !== 'undefined' && typeof AudioContext !== 'undefined';
}

type Recognizer = (audio: Float32Array, options?: Record<string, unknown>) => Promise<{ text?: string } | Array<{ text?: string }>>;

let loading: Promise<Recognizer> | null = null;
let ready = false;
const listeners = new Set<(percent: number) => void>();
const files = new Map<string, { loaded: number; total: number }>();

function report() {
  let loaded = 0;
  let total = 0;
  files.forEach((file) => {
    loaded += file.loaded;
    total += file.total;
  });
  const percent = total ? Math.min(99, Math.round((loaded / total) * 100)) : 0;
  listeners.forEach((listener) => listener(percent));
}

export function isLocalModelReady(): boolean {
  return ready;
}

/** Downloads and starts the model once. Safe to call again and again; every caller gets the same model. */
export function loadLocalWhisper(onProgress?: (percent: number) => void): Promise<Recognizer> {
  if (onProgress) listeners.add(onProgress);
  if (!loading) {
    loading = (async () => {
      const { pipeline, env } = await import('@huggingface/transformers');
      env.allowLocalModels = false;
      if (MODEL_HOST) env.remoteHost = MODEL_HOST;
      const recognizer = await pipeline('automatic-speech-recognition', MODEL, {
        dtype: 'q8',
        device: 'wasm',
        progress_callback: (event: any) => {
          if (event?.status === 'progress' && event.file && event.total) {
            files.set(event.file, { loaded: event.loaded ?? 0, total: event.total });
            report();
          }
        },
      });
      ready = true;
      listeners.forEach((listener) => listener(100));
      return recognizer as unknown as Recognizer;
    })();
    loading.catch(() => {
      loading = null; // a failed download can be tried again
      files.clear();
    });
  }
  return loading.finally(() => {
    if (onProgress) listeners.delete(onProgress);
  });
}

/** The recording as 16 kHz mono samples, which is what Whisper takes. */
async function decodeTo16kMono(file: Blob): Promise<Float32Array> {
  const context = new AudioContext({ sampleRate: 16_000 });
  try {
    const decoded = await context.decodeAudioData(await file.arrayBuffer());
    if (decoded.numberOfChannels === 1) return decoded.getChannelData(0).slice();
    const mono = new Float32Array(decoded.length);
    for (let channel = 0; channel < decoded.numberOfChannels; channel += 1) {
      const data = decoded.getChannelData(channel);
      for (let i = 0; i < mono.length; i += 1) mono[i] += data[i] / decoded.numberOfChannels;
    }
    return mono;
  } finally {
    void context.close().catch(() => undefined);
  }
}

export async function transcribeLocally(file: Blob, onProgress?: (percent: number) => void): Promise<string> {
  const [recognizer, samples] = await Promise.all([loadLocalWhisper(onProgress), decodeTo16kMono(file)]);
  const result = await recognizer(samples, { chunk_length_s: 30, stride_length_s: 5 });
  const first = Array.isArray(result) ? result[0] : result;
  return String(first?.text ?? '').trim();
}
