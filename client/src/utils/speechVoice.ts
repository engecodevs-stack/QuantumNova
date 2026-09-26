// Natural Academic Voice Synthesis Engine for QuantumNova Tutor

type SpeechStatusListener = (isSpeaking: boolean, textId?: string) => void;

let currentTextId: string | null = null;
let speechHeartbeat: any = null;
const listeners = new Set<SpeechStatusListener>();

/**
 * Notifies all subscribers about speech playback status
 */
function notifyListeners(isSpeaking: boolean, textId?: string) {
  listeners.forEach(cb => {
    try {
      cb(isSpeaking, textId);
    } catch (err) {
      console.error('Error in speech listener:', err);
    }
  });
}

export function subscribeToSpeechStatus(callback: SpeechStatusListener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Fetches available browser voices reliably, waiting for `onvoiceschanged` if necessary.
 */
export function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise(resolve => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const immediate = window.speechSynthesis.getVoices();
    if (immediate && immediate.length > 0) {
      resolve(immediate);
      return;
    }

    const handleVoicesChanged = () => {
      const updated = window.speechSynthesis.getVoices();
      if (updated && updated.length > 0) {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        resolve(updated);
      }
    };

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

    // Fallback timeout in case voiceschanged never fires
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      resolve(window.speechSynthesis.getVoices() || []);
    }, 600);
  });
}

/**
 * Selects the most pleasant, natural-sounding Spanish voice available.
 * Prioritizes modern Neural / Natural online voices from Microsoft, Google, and Apple.
 */
export async function getBestSpanishVoice(): Promise<SpeechSynthesisVoice | null> {
  const voices = await getAvailableVoices();
  if (!voices || voices.length === 0) return null;

  // Filter for Spanish voices
  const spanishVoices = voices.filter(v =>
    v.lang.toLowerCase().startsWith('es') || v.lang.toLowerCase().includes('es-')
  );

  if (spanishVoices.length === 0) {
    // If no Spanish voices, return default voice
    return voices.find(v => v.default) || voices[0] || null;
  }

  // Scoring algorithm for natural/pleasant sounding voices
  const scoreVoice = (voice: SpeechSynthesisVoice): number => {
    const name = voice.name.toLowerCase();
    const lang = voice.lang.toLowerCase();
    let score = 0;

    // Highest preference: Microsoft Online Natural/Neural voices (Jorge, Alvaro, Elvira, Helena, Laura, Dalia)
    if (name.includes('natural') || name.includes('online')) score += 100;
    if (name.includes('neural')) score += 90;

    // Preferred natural speaker names (known high quality in Windows/Edge/macOS)
    if (name.includes('jorge')) score += 50;
    if (name.includes('alvaro') || name.includes('álvaro')) score += 50;
    if (name.includes('helena') || name.includes('elena')) score += 45;
    if (name.includes('laura')) score += 45;
    if (name.includes('elvira')) score += 45;
    if (name.includes('dalia')) score += 45;
    if (name.includes('sabina')) score += 40;
    if (name.includes('paulina')) score += 40;
    if (name.includes('monica') || name.includes('mónica')) score += 40;

    // High preference: Google Chrome Neural Spanish
    if (name.includes('google')) {
      score += 60;
      if (lang.includes('es-es') || lang.includes('es-us') || lang.includes('es-mx')) {
        score += 20;
      }
    }

    // Apple Enhanced / Siri voices on macOS/iOS
    if (name.includes('enhanced') || name.includes('premium')) score += 80;

    // Spanish Spain and Mexico preferred for neutral cadence
    if (lang === 'es-es' || lang === 'es_es') score += 20;
    if (lang === 'es-mx' || lang === 'es_mx') score += 18;

    return score;
  };

  spanishVoices.sort((a, b) => scoreVoice(b) - scoreVoice(a));
  return spanishVoices[0] || null;
}

/**
 * Cleans and normalizes markdown and academic text into fluent spoken Spanish.
 */
export function cleanTextForSpeech(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, ' En el código mostrado: ');

  // Remove inline code
  text = text.replace(/`([^`]+)`/g, '$1');

  // Clean markdown links [label](url) -> label
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Clean Obsidian wikilinks [[page]] -> page
  text = text.replace(/\[\[(.*?)\]\]/g, '$1');

  // Remove markdown headers (#, ##, ###)
  text = text.replace(/^#{1,6}\s+/gm, '');

  // Remove bold and italics formatting (**word**, *word*, __word__, _word_)
  text = text.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1');

  // Replace bullet points with brief pauses
  text = text.replace(/^\s*[-*+]\s+/gm, ' ');

  // Replace numbered lists with natural numbering
  text = text.replace(/^\s*\d+\.\s+/gm, ' ');

  // Clean common LaTeX / math formulas into spoken equivalents
  text = text.replace(/\$([^$]+)\$/g, '$1');
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, '$1');
  text = text.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 sobre $2');
  text = text.replace(/\^2/g, ' al cuadrado');
  text = text.replace(/\^3/g, ' al cubo');

  // Remove emojis and decorative unicode symbols
  text = text.replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

  // Clean excessive spaces and multiple newlines
  text = text.replace(/\n+/g, '. ');
  text = text.replace(/\s{2,}/g, ' ');

  return text.trim();
}

/**
 * Splits long text into natural sentence chunks to prevent browser speech synthesis timeouts.
 */
function splitIntoSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  if (!matches) return [text];
  return matches.map(s => s.trim()).filter(s => s.length > 0);
}

/**
 * Speaks an explanation aloud using the most pleasant Spanish voice.
 */
export async function speakTutorExplanation(
  text: string,
  options?: {
    textId?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }

  // Cancel any currently playing speech
  stopTutorSpeech();

  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) return;

  const voice = await getBestSpanishVoice();
  const sentences = splitIntoSentences(cleaned);
  let sentenceIdx = 0;

  currentTextId = options?.textId || 'active';
  notifyListeners(true, currentTextId);
  options?.onStart?.();

  // Clear any existing heartbeat
  if (speechHeartbeat) {
    clearInterval(speechHeartbeat);
    speechHeartbeat = null;
  }

  // Chrome workaround: speech synthesis can pause unexpectedly during long speech
  speechHeartbeat = setInterval(() => {
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 9000);

  const speakNextSentence = () => {
    if (sentenceIdx >= sentences.length) {
      // Completed all sentences
      cleanup();
      options?.onEnd?.();
      return;
    }

    const currentSentence = sentences[sentenceIdx];
    sentenceIdx++;

    const utterance = new SpeechSynthesisUtterance(currentSentence);
    if (voice) {
      utterance.voice = voice;
    }
    utterance.lang = voice?.lang || 'es-ES';
    utterance.pitch = 1.0;
    // Pleasant didactic rate (clear, natural, neither robotic nor rushed)
    utterance.rate = 0.97;
    utterance.volume = 1.0;

    utterance.onend = () => {
      speakNextSentence();
    };

    utterance.onerror = (e) => {
      // Interrupted error is expected when user stops manually
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn('Speech synthesis error:', e);
        options?.onError?.(e);
      }
      cleanup();
    };

    window.speechSynthesis.speak(utterance);
  };

  const cleanup = () => {
    if (speechHeartbeat) {
      clearInterval(speechHeartbeat);
      speechHeartbeat = null;
    }
    currentTextId = null;
    notifyListeners(false);
  };

  speakNextSentence();
}

/**
 * Stops any active tutor speech immediately.
 */
export function stopTutorSpeech(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  if (speechHeartbeat) {
    clearInterval(speechHeartbeat);
    speechHeartbeat = null;
  }

  window.speechSynthesis.cancel();
  currentTextId = null;
  notifyListeners(false);
}

/**
 * Checks if the tutor is currently speaking.
 */
export function isTutorSpeaking(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  return window.speechSynthesis.speaking && !window.speechSynthesis.paused;
}

/**
 * Gets the ID of the text currently being spoken, if any.
 */
export function getCurrentSpokenTextId(): string | null {
  return currentTextId;
}
