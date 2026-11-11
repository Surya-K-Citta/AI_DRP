/**
 * Records one spoken answer from the microphone.
 *
 * It stops by itself after the person has spoken and then paused (`silenceMs`), or after `maxMs`, so nobody has to find
 * the Stop button. A recording with no speech in it is dropped (returns null) instead of being sent to be transcribed.
 * The recording is kept in memory only.
 */
export type Recording = {
  /** Stops and returns the audio, or null when nothing was said. */
  stop: () => Promise<File | null>;
  /** Stops and throws the audio away. */
  cancel: () => void;
};

type RecordOptions = {
  maxMs?: number;
  silenceMs?: number;
  /** Called a few times a second with how loud it is, 0 to 1. */
  onLevel?: (level: number) => void;
  /** Called when the recording ended by itself (pause or time limit). The caller then calls stop(). */
  onAutoStop?: () => void;
};

const MIME_CHOICES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
const SPEECH_LEVEL = 0.05;

export function voiceSupported(): boolean {
  return typeof window !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== 'undefined';
}

function pickMime(): string {
  return MIME_CHOICES.find((type) => MediaRecorder.isTypeSupported?.(type)) || '';
}

export async function startRecording(options: RecordOptions = {}): Promise<Recording> {
  const { maxMs = 28_000, silenceMs = 1_800, onLevel, onAutoStop } = options;
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
  });
  const mime = pickMime();
  const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data?.size) chunks.push(event.data);
  };

  let heard = false;
  let quietSince = 0;
  let autoStopped = false;
  let finished = false;
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 512;
  audioContext.createMediaStreamSource(stream).connect(analyser);
  const samples = new Uint8Array(analyser.fftSize);

  const fireAutoStop = () => {
    if (autoStopped || finished) return;
    autoStopped = true;
    onAutoStop?.();
  };
  const meter = window.setInterval(() => {
    analyser.getByteTimeDomainData(samples);
    let sum = 0;
    for (let i = 0; i < samples.length; i += 1) {
      const centred = (samples[i] - 128) / 128;
      sum += centred * centred;
    }
    const level = Math.min(1, Math.sqrt(sum / samples.length) * 4);
    onLevel?.(level);
    const now = Date.now();
    if (level > SPEECH_LEVEL) {
      heard = true;
      quietSince = 0;
    } else if (heard) {
      if (!quietSince) quietSince = now;
      else if (now - quietSince >= silenceMs) fireAutoStop();
    }
  }, 120);
  const limit = window.setTimeout(fireAutoStop, maxMs);

  const release = () => {
    finished = true;
    window.clearInterval(meter);
    window.clearTimeout(limit);
    stream.getTracks().forEach((track) => track.stop());
    void audioContext.close().catch(() => undefined);
  };

  recorder.start(250);

  const ended = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  return {
    stop: async () => {
      if (recorder.state !== 'inactive') recorder.stop();
      await ended;
      release();
      if (!heard || !chunks.length) return null;
      const type = recorder.mimeType || mime || 'audio/webm';
      const extension = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm';
      return new File(chunks, `speech.${extension}`, { type });
    },
    cancel: () => {
      if (recorder.state !== 'inactive') recorder.stop();
      release();
    },
  };
}
