/**
 * Text-to-Speech utility with support for English and Telugu
 * Uses browser's Web Speech API (SpeechSynthesis) for client-side TTS
 */

export type TTSLanguage = 'en' | 'te';

interface TTSOptions {
  language?: TTSLanguage;
  rate?: number;
  pitch?: number;
  volume?: number;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

class TTSService {
  private synth: SpeechSynthesis | null = null;
  private isSupported: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.isSupported = true;
    }
  }

  /**
   * Check if TTS is supported in the browser
   */
  isTTSSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Get available voices for a language
   */
  getVoices(language: TTSLanguage): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    
    const langCode = language === 'te' ? 'te-IN' : 'en-US';
    return this.synth.getVoices().filter(voice => 
      voice.lang.startsWith(langCode) || 
      (language === 'te' && (voice.lang.includes('te') || voice.name.toLowerCase().includes('telugu')))
    );
  }

  /**
   * Speak text with specified language and options
   */
  speak(text: string, options: TTSOptions = {}): void {
    if (!this.synth || !this.isSupported) {
      console.warn('Text-to-speech is not supported in this browser');
      options.onError?.(new Error('TTS not supported'));
      return;
    }

    // Stop any current speech
    this.stop();

    // Clean text - remove markdown formatting for better speech
    const cleanText = this.cleanTextForSpeech(text);

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Set language
    const langCode = options.language === 'te' ? 'te-IN' : 'en-US';
    utterance.lang = langCode;

    // Set voice
    const voices = this.getVoices(options.language || 'en');
    if (voices.length > 0) {
      // Prefer native voices for Telugu
      const preferredVoice = voices.find(v => 
        options.language === 'te' 
          ? (v.lang.includes('te') || v.name.toLowerCase().includes('telugu'))
          : v.lang.startsWith('en')
      ) || voices[0];
      utterance.voice = preferredVoice;
    }

    // Set speech parameters
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;

    // Event handlers
    utterance.onend = () => {
      options.onEnd?.();
    };

    utterance.onerror = (event) => {
      options.onError?.(new Error(`TTS Error: ${event.error}`));
    };

    // Speak
    this.synth.speak(utterance);
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  /**
   * Pause current speech
   */
  pause(): void {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }

  /**
   * Check if currently paused
   */
  isPaused(): boolean {
    return this.synth ? this.synth.paused : false;
  }

  /**
   * Clean text for better speech output
   * Removes markdown, code blocks, and other formatting
   */
  private cleanTextForSpeech(text: string): string {
    let cleaned = text;

    // Remove markdown code blocks
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
    
    // Remove inline code
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
    
    // Remove markdown links but keep text
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    
    // Remove markdown headers
    cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
    
    // Remove markdown bold/italic
    cleaned = cleaned.replace(/\*\*([^\*]+)\*\*/g, '$1');
    cleaned = cleaned.replace(/\*([^\*]+)\*/g, '$1');
    cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
    cleaned = cleaned.replace(/_([^_]+)_/g, '$1');
    
    // Remove HTML tags
    cleaned = cleaned.replace(/<[^>]+>/g, '');
    
    // Clean up extra whitespace
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.replace(/[ \t]+/g, ' ');
    cleaned = cleaned.trim();

    return cleaned;
  }
}

// Export singleton instance
export const ttsService = new TTSService();

