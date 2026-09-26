import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, AlertCircle, Square } from 'lucide-react';
import type { ViewType } from '../types';

interface VoiceControllerProps {
  setView: (view: ViewType) => void;
  onVoiceAction: (actionType: string, payload?: string) => void;
  ttsEnabled: boolean;
  setTtsEnabled: (enabled: boolean) => void;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
}

export const VoiceController: React.FC<VoiceControllerProps> = ({
  setView,
  onVoiceAction,
  ttsEnabled,
  setTtsEnabled,
  isSpeaking,
  onStopSpeaking
}) => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const feedbackTimeoutRef = useRef<any>(null);
  const errorTimeoutRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true; // Enabled interim results for live typing bubble
      rec.lang = 'es-ES';

      rec.onstart = () => {
        setIsListening(true);
        setInterimText('');
        setErrorMessage(null);
        triggerFeedback('Quantum escuchando...', 2500);
      };

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Show live spoken words in speech bubble
        if (interimTranscript) {
          setInterimText(interimTranscript);
        }

        if (finalTranscript) {
          setInterimText('');
          processVoiceCommand(finalTranscript.trim().toLowerCase());
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setInterimText('');

        let userErrorMsg = 'Error en reconocimiento de voz';
        if (event.error === 'not-allowed') {
          userErrorMsg = 'Micrófono desactivado (permiso denegado)';
        } else if (event.error === 'network') {
          userErrorMsg = 'Error de red (conexión inestable)';
        } else if (event.error === 'no-speech') {
          return; // Suppress no-speech alerts to avoid spamming the user
        }

        setErrorMessage(userErrorMsg);
        if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = setTimeout(() => setErrorMessage(null), 4000);
      };

      rec.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognitionRef.current = rec;
    } else {
      console.warn('Speech Recognition is not supported in this browser.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, [ttsEnabled]);

  const triggerFeedback = (message: string, duration = 3000) => {
    setFeedbackMsg(message);
    setShowFeedback(true);

    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    feedbackTimeoutRef.current = setTimeout(() => {
      setShowFeedback(false);
    }, duration);

    // Speak feedback if TTS enabled
    if (ttsEnabled && message !== 'Quantum escuchando...') {
      speakText(message);
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/[*#`_\-]/g, '')
      .replace(/\[\[.*?\]\]/g, (m) => m.slice(2, -2));

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-ES';

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => 
      v.lang.toLowerCase().includes('es') && 
      (v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('helena') || v.name.toLowerCase().includes('sabina'))
    ) || voices.find(v => v.lang.toLowerCase().startsWith('es'));

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.pitch = 1.0;
    utterance.rate = 0.95; // Slightly slower, sounds much more human/didactic

    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setErrorMessage('Reconocimiento de voz no soportado en este navegador');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Failed to stop speech recognition:', err);
      }
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        try {
          recognitionRef.current.abort();
          setTimeout(() => {
            try {
              recognitionRef.current.start();
            } catch (retryErr) {
              console.error(retryErr);
            }
          }, 100);
        } catch (abortErr) {
          console.error(abortErr);
        }
      }
    }
  };

  const processVoiceCommand = (rawText: string) => {
    console.log('Processed Voice Command:', rawText);
    
    // Command patterns matching the specifications
    if (rawText.startsWith('crear nota')) {
      const title = rawText.replace('crear nota', '').trim();
      setView('notes');
      onVoiceAction('create_note', title || undefined);
      triggerFeedback(title ? `Creando nota: ${title}` : 'Creando una nueva nota.');
      return;
    }

    if (rawText.startsWith('buscar')) {
      const query = rawText.replace('buscar', '').trim();
      setView('notes');
      onVoiceAction('search_note', query);
      triggerFeedback(`Buscando notas relacionadas con: ${query}`);
      return;
    }

    if (rawText.startsWith('explicar')) {
      const concept = rawText.replace('explicar', '').trim();
      setView('chat');
      onVoiceAction('explain_concept', concept);
      triggerFeedback(`Explicando el concepto: ${concept}`);
      return;
    }

    if (rawText.includes('resumir nota') || rawText.includes('resumir')) {
      onVoiceAction('generate_summary');
      triggerFeedback('Resumiendo la nota actual.');
      return;
    }

    if (rawText.includes('iniciar estudio') || rawText.includes('comenzar estudio')) {
      onVoiceAction('start_study');
      triggerFeedback('Temporizador de estudio iniciado.');
      return;
    }

    if (rawText.includes('pausar estudio') || rawText.includes('detener estudio')) {
      onVoiceAction('pause_study');
      triggerFeedback('Temporizador de estudio pausado.');
      return;
    }

    if (rawText.includes('guardar nota') || rawText.includes('guardar cambios')) {
      onVoiceAction('save_changes');
      triggerFeedback('Nota guardada con éxito.');
      return;
    }

    // "ir a [sección]"
    if (rawText.startsWith('ir a') || rawText.startsWith('abrir')) {
      const section = rawText.replace('ir a', '').replace('abrir', '').trim();
      
      if (section.includes('nota')) {
        setView('notes');
        triggerFeedback('Navegando a Mis Notas.');
        return;
      }
      if (section.includes('mapa') || section.includes('grafo') || section.includes('canvas')) {
        setView('map');
        triggerFeedback('Navegando al Mapa Mental.');
        return;
      }
      if (section.includes('chat') || section.includes('ia') || section.includes('tutor')) {
        setView('chat');
        triggerFeedback('Navegando al Chat IA.');
        return;
      }
      if (section.includes('curso')) {
        setView('courses');
        triggerFeedback('Navegando a Mis Cursos.');
        return;
      }
      if (section.includes('biblioteca') || section.includes('recurso')) {
        setView('library');
        triggerFeedback('Navegando a la Biblioteca.');
        return;
      }
      if (section.includes('ajuste') || section.includes('configuraci')) {
        setView('settings');
        triggerFeedback('Navegando a Configuración.');
        return;
      }
    }

    // Default fallback to Chat AI query if the phrase is long enough
    if (rawText.length > 4) {
      setView('chat');
      onVoiceAction('chat_query', rawText);
      triggerFeedback(`Preguntando a Quantum: "${rawText}"`);
    } else {
      triggerFeedback('Comando no reconocido. Intenta "ir a mapa", "crear nota física cuántica" o "pausar estudio".');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 flex items-center gap-3 z-50 select-none">
      {/* Live Transcription Bubble and Feedback Messages */}
      <AnimatePresence>
        {(showFeedback || interimText) && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="bg-white dark:bg-panel border border-border-custom px-4 py-2.5 rounded-2xl text-[11px] font-bold text-text-primary shadow-xl flex items-center gap-2.5 max-w-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-tech-purple shrink-0 animate-pulse" />
            <span className="truncate max-w-[180px]">
              {interimText ? `"${interimText}..."` : feedbackMsg}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear error toast message */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 px-4 py-2.5 rounded-2xl text-[11px] font-bold shadow-xl flex items-center gap-2 max-w-xs"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setTtsEnabled(!ttsEnabled)}
        className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all cursor-pointer shadow-xs ${
          ttsEnabled
            ? 'bg-tech-purple/10 border-tech-purple text-tech-purple hover:bg-tech-purple/20'
            : 'bg-white dark:bg-panel border-border-custom text-text-secondary hover:text-text-primary'
        }`}
        title={ttsEnabled ? 'Desactivar lectura por voz (TTS)' : 'Activar lectura por voz (TTS)'}
      >
        {ttsEnabled ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
      </button>

      {/* Stop Speaking Button */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={onStopSpeaking}
            className="w-10 h-10 rounded-2xl border bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 flex items-center justify-center transition-all cursor-pointer shadow-xs"
            title="Detener lectura en curso"
          >
            <Square className="w-4 h-4 fill-rose-600 dark:fill-rose-400" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating Microphone Trigger Container */}
      <div className="relative w-12 h-12">
        {/* Glowing halo */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              animate={{
                scale: [1.0, 1.35, 0.9, 1.2, 1.0],
                rotate: [0, 120, 240, 360],
                borderRadius: ["30% 70% 70% 30% / 30% 30% 70% 70%", "50% 50% 50% 50%", "30% 70% 70% 30% / 30% 30% 70% 70%"],
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                repeat: Infinity,
                duration: 4.0,
                ease: "easeInOut"
              }}
              className="absolute -inset-3.5 bg-gradient-to-tr from-[#5865F2] via-tech-purple to-[#007AFF] opacity-75 blur-lg z-0 pointer-events-none"
            />
          )}
        </AnimatePresence>

        <button
          onClick={toggleListening}
          className={`absolute inset-0 rounded-2xl border flex items-center justify-center transition-all duration-300 z-10 cursor-pointer shadow-md ${
            isListening
              ? 'bg-tech-purple border-tech-purple text-white scale-105'
              : 'bg-white dark:bg-panel border-border-custom text-text-secondary hover:text-text-primary hover:border-tech-purple'
          }`}
          title={isListening ? 'Detener comandos de voz' : 'Activar comandos de voz'}
        >
          {isListening ? <Mic className="w-5 h-5 animate-pulse" /> : <MicOff className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};
