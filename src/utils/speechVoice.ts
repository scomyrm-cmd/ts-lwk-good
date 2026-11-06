/**
 * Campus OS Voice & Speech Utilities
 * Provides browser Web Speech API integration for:
 * 1. Text-to-Speech (AI talking back aloud in English, French, Arabic/Darija)
 * 2. Speech-to-Text (Microphone voice dictation)
 */

export interface VoiceOption {
  voice: SpeechSynthesisVoice;
  lang: string;
  name: string;
}

// Clean markdown syntax for natural voice reading
export function sanitizeTextForSpeech(text: string): string {
  if (!text) return '';
  return text
    .replace(/[*_#`~>]/g, '') // remove markdown symbols
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // link formatting
    .replace(/```[\s\S]*?```/g, '') // code blocks
    .replace(/\s+/g, ' ')
    .trim();
}

// Detect language of text for optimal voice selection
export function detectVoiceLang(text: string, defaultLang: string = 'en'): string {
  if (/[\u0600-\u06FF]/.test(text)) {
    return 'ar-SA';
  }
  const t = text.toLowerCase();
  const frCount = (t.match(/\b(bonjour|salut|merci|élève|élèves|présence|absence|aujourd'hui|pourquoi|comment|qui|est|sont|dans|avec)\b/g) || []).length;
  if (frCount >= 2 || /[éèêëàâôûîïç]/.test(t)) {
    return 'fr-FR';
  }
  if (defaultLang === 'ar') return 'ar-SA';
  if (defaultLang === 'fr') return 'fr-FR';
  return 'en-US';
}

class SpeechController {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingInternal: boolean = false;
  private recognitionInstance: any = null;

  public isTTSSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public isSTTSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );
  }

  // Text-To-Speech: Make the AI talk aloud
  public speak(
    text: string,
    options?: {
      lang?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: () => void;
    }
  ): void {
    if (!this.isTTSSupported()) {
      options?.onError?.();
      return;
    }

    this.stop();

    const clean = sanitizeTextForSpeech(text);
    if (!clean) {
      options?.onEnd?.();
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(clean);
      const targetLang = options?.lang || detectVoiceLang(clean);
      utterance.lang = targetLang;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Match best voice available in browser
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const langPrefix = targetLang.split('-')[0].toLowerCase();
        const matched = voices.find(
          (v) => v.lang.toLowerCase() === targetLang.toLowerCase()
        ) || voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));

        if (matched) {
          utterance.voice = matched;
        }
      }

      utterance.onstart = () => {
        this.isSpeakingInternal = true;
        options?.onStart?.();
      };

      utterance.onend = () => {
        this.isSpeakingInternal = false;
        this.currentUtterance = null;
        options?.onEnd?.();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        this.isSpeakingInternal = false;
        this.currentUtterance = null;
        options?.onError?.();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Failed to start speech synthesis:', err);
      this.isSpeakingInternal = false;
      options?.onError?.();
    }
  }

  public stop(): void {
    if (this.isTTSSupported()) {
      window.speechSynthesis.cancel();
    }
    this.isSpeakingInternal = false;
    this.currentUtterance = null;
  }

  public isSpeaking(): boolean {
    if (!this.isTTSSupported()) return false;
    return window.speechSynthesis.speaking || this.isSpeakingInternal;
  }

  // Speech-To-Text: User speaking to AI via microphone
  public startListening(options: {
    lang?: string;
    onResult: (transcript: string, isFinal: boolean) => void;
    onEnd: () => void;
    onError: (err: string) => void;
  }): void {
    if (!this.isSTTSupported()) {
      options.onError('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      this.stopListening();

      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = options.lang || 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }

        options.onResult(transcript, isFinal);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        options.onError(event.error || 'Speech recognition failed');
      };

      recognition.onend = () => {
        this.recognitionInstance = null;
        options.onEnd();
      };

      this.recognitionInstance = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Failed to start speech recognition:', err);
      options.onError(err.message || 'Could not start microphone');
    }
  }

  public stopListening(): void {
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.stop();
      } catch {}
      this.recognitionInstance = null;
    }
  }
}

export const speechController = new SpeechController();
