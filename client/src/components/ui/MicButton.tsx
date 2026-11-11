// @ts-nocheck
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Loader2, Mic, Square } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useVoiceStore } from '@/store/voiceStore';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { startRecording, voiceSupported, type Recording } from '@/lib/voice/recorder';
import { LOCAL_MODEL_SIZE_MB, isLocalModelReady, loadLocalWhisper, localVoiceSupported, transcribeLocally } from '@/lib/voice/localWhisper';
import { normalizeSpoken, type SpokenKind } from '@/lib/voice/spokenValue';
import { useConfirm } from '@/components/ui/ConfirmProvider';
import { Tooltip } from '@/components/ui/Tooltip';

const NOTICE_KEY = 'voice-input-notice-accepted';
const LOCAL_NOTICE_KEY = 'voice-input-local-notice-accepted';
type Phase = 'idle' | 'listening' | 'working';

const noticeAccepted = (key: string) => {
  try {
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
};
const rememberNotice = (key: string) => {
  try {
    window.localStorage.setItem(key, '1');
  } catch {
    /* it is just asked again next time */
  }
};

/**
 * Tap, speak, pause: the words are typed into the box. Tap again while listening to finish early, Esc to cancel.
 * English is turned into text on this device by an open-source Whisper model (nothing is uploaded; the model is
 * downloaded once and then works offline). Telugu, and English if the device cannot run the model, goes to our server
 * (never straight to a speech service from the browser), which uses open-source models too, and nothing is kept. `onText` receives the cleaned-up text (numbers as digits, IDs without spaces, and so on).
 */
export function MicButton({
  onText,
  kind = 'text',
  format,
  getLakh,
  label,
  className,
}: {
  onText: (text: string) => void;
  kind?: SpokenKind;
  format?: string;
  /** Asked when the recording ends: is this field counted in lakh? */
  getLakh?: () => boolean;
  label?: string;
  className?: string;
}) {
  const tf = useClusterFormText();
  const { i18n } = useTranslation();
  const confirm = useConfirm();
  const user = useAuthStore((s) => s.user);
  const id = useId();
  const activeId = useVoiceStore((s) => s.activeId);
  const setActive = useVoiceStore((s) => s.setActive);
  const [phase, setPhase] = useState<Phase>('idle');
  const [level, setLevel] = useState(0);
  const [modelPercent, setModelPercent] = useState<number | null>(null);
  const recording = useRef<Recording | null>(null);
  const supported = voiceSupported();
  const language: 'en' | 'te' = i18n.language?.startsWith('te') ? 'te' : 'en';
  // English is typed out on this device when it can; everything else goes to the server.
  const engine: 'local' | 'server' = language === 'en' && localVoiceSupported() ? 'local' : 'server';
  const aiAssist = !!user?.privacy?.aiAssist;

  const finish = useCallback(async () => {
    const current = recording.current;
    if (!current) return;
    recording.current = null;
    setLevel(0);
    setPhase('working');
    try {
      const file = await current.stop();
      if (!file) {
        toast.error(tf('Could not hear anything. Try again closer to the microphone.'));
        return;
      }
      let heard = '';
      if (engine === 'local') {
        try {
          heard = await transcribeLocally(file, setModelPercent);
        } catch (localError) {
          console.warn('On-device voice typing failed', localError);
          // Only with the person's AI-assist consent may the recording be sent to the server instead.
          if (!aiAssist) throw localError;
          heard = String((await api.transcribeAudio(file, language))?.data?.transcription ?? '');
        }
      } else {
        heard = String((await api.transcribeAudio(file, language))?.data?.transcription ?? '');
      }
      const text = normalizeSpoken(heard, { kind, format, lakh: getLakh?.() });
      if (!text) {
        toast.error(tf('Could not hear anything. Try again closer to the microphone.'));
        return;
      }
      onText(text);
    } catch (error) {
      console.error('Voice input failed', error);
      toast.error(tf('Could not turn your voice into text. Please type this answer.'));
    } finally {
      setPhase('idle');
      setModelPercent(null);
      if (useVoiceStore.getState().activeId === id) setActive(null);
    }
  }, [aiAssist, engine, format, getLakh, id, kind, language, onText, setActive, tf]);

  const cancel = useCallback(() => {
    recording.current?.cancel();
    recording.current = null;
    setLevel(0);
    setPhase('idle');
    if (useVoiceStore.getState().activeId === id) setActive(null);
  }, [id, setActive]);

  // Another button started: this one stops and drops its recording.
  useEffect(() => {
    if (activeId && activeId !== id && phase === 'listening') cancel();
  }, [activeId, id, phase, cancel]);

  useEffect(() => {
    if (phase !== 'listening') return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        cancel();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [phase, cancel]);

  useEffect(() => () => recording.current?.cancel(), []);

  const begin = async () => {
    if (engine === 'server' && !aiAssist) {
      toast.error(tf('Voice input needs AI assist to be on. Turn it on in Privacy settings.'));
      return;
    }
    const noticeKey = engine === 'local' ? LOCAL_NOTICE_KEY : NOTICE_KEY;
    if (!noticeAccepted(noticeKey)) {
      const ok = await confirm(
        engine === 'local'
          ? {
              title: tf('Turn on voice typing?'),
              body: tf('Voice typing works on this device. The first time, it downloads a speech model (about {mb} MB), then it works offline. Your voice is not uploaded.').replace('{mb}', String(LOCAL_MODEL_SIZE_MB)),
              confirmLabel: tf('Allow'),
              cancelLabel: tf('Not now'),
            }
          : {
              title: tf('Allow your voice to be typed out?'),
              body: tf('When you tap the microphone, your voice is sent to a speech-to-text service that types what you say. This app does not keep the recording.'),
              confirmLabel: tf('Allow'),
              cancelLabel: tf('Not now'),
            }
      );
      if (!ok) return;
      rememberNotice(noticeKey);
    }
    // Start fetching the model now, so it downloads while the person is still speaking.
    if (engine === 'local' && !isLocalModelReady()) void loadLocalWhisper(setModelPercent).catch(() => undefined);
    try {
      setActive(id);
      recording.current = await startRecording({
        onLevel: setLevel,
        onAutoStop: () => void finish(),
      });
      setPhase('listening');
    } catch (error) {
      setActive(null);
      const blocked = error?.name === 'NotAllowedError' || error?.name === 'SecurityError';
      toast.error(
        blocked
          ? tf('Microphone access was blocked. Allow the microphone for this site and try again.')
          : tf('No microphone was found.')
      );
    }
  };

  const onClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (phase === 'listening') void finish();
    else if (phase === 'idle') void begin();
  };

  const action =
    !supported
      ? tf('Voice input is not supported in this browser.')
      : phase === 'listening'
        ? tf('Listening… tap to finish')
        : phase === 'working'
          ? modelPercent !== null && modelPercent < 100
            ? `${tf('Preparing the voice model (first time only)…')} ${modelPercent}%`
            : tf('Writing it down…')
          : tf('Speak this answer');
  const aria = label && phase === 'idle' && supported ? `${action}: ${label}` : action;

  return (
    <Tooltip label={action} align="end" className={className}>
      <button
        type="button"
        onClick={onClick}
        disabled={!supported || phase === 'working'}
        aria-label={aria}
        aria-pressed={phase === 'listening'}
        // A press must not take focus away from (or blur) the text box it fills.
        onMouseDown={(event) => event.preventDefault()}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
          phase === 'listening' && 'mic-listening bg-red-600 text-white hover:bg-red-700 hover:text-white'
        )}
        style={phase === 'listening' ? { transform: `scale(${1 + level * 0.25})` } : undefined}
      >
        {phase === 'working' ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : phase === 'listening' ? (
          <Square className="h-3 w-3 fill-current" aria-hidden="true" />
        ) : (
          <Mic className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {phase === 'idle' ? '' : action}
      </span>
    </Tooltip>
  );
}
