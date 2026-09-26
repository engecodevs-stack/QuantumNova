import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, User, Check, X, Award, HelpCircle, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import type { ChatMessage, QuizQuestion, Note } from '../types';
import Markdown from 'markdown-to-jsx';
import { speakTutorExplanation, stopTutorSpeech, subscribeToSpeechStatus, isTutorSpeaking } from '../utils/speechVoice';
import { ContextualHelpBadge } from './ContextualHelpBadge';

interface ChatViewProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  activeNote: Note | null;
  allNotes: Note[];
  onAskTutor: (msg: string) => Promise<string>;
  onTriggerVoiceFeedback: (text: string) => void;

  // Global Quiz Props
  quizQuestions: QuizQuestion[];
  setQuizQuestions: React.Dispatch<React.SetStateAction<QuizQuestion[]>>;
  currentQuestionIdx: number;
  setCurrentQuestionIdx: React.Dispatch<React.SetStateAction<number>>;
  selectedOption: number | null;
  setSelectedOption: React.Dispatch<React.SetStateAction<number | null>>;
  isAnswerSubmitted: boolean;
  setIsAnswerSubmitted: React.Dispatch<React.SetStateAction<boolean>>;
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  quizCompleted: boolean;
  setQuizCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  isQuizLoading: boolean;
  onGenerateQuiz: () => Promise<void>;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  setMessages,
  activeNote,
  allNotes,
  onAskTutor,
  onTriggerVoiceFeedback,

  quizQuestions,
  setQuizQuestions,
  currentQuestionIdx,
  setCurrentQuestionIdx,
  selectedOption,
  setSelectedOption,
  isAnswerSubmitted,
  setIsAnswerSubmitted,
  score,
  setScore,
  quizCompleted,
  setQuizCompleted,
  isQuizLoading,
  onGenerateQuiz
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoVoiceEnabled, setAutoVoiceEnabled] = useState<boolean>(() => {
    return localStorage.getItem('qn_tutor_voice_auto') === 'true';
  });
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to speech synthesis status
  useEffect(() => {
    const unsubscribe = subscribeToSpeechStatus((isSpeaking, textId) => {
      if (!isSpeaking) {
        setSpeakingMsgId(null);
      } else if (textId) {
        setSpeakingMsgId(textId);
      }
    });
    return () => {
      unsubscribe();
      stopTutorSpeech();
    };
  }, []);

  const handleToggleVoiceForMessage = (msgId: string, content: string) => {
    if (speakingMsgId === msgId && isTutorSpeaking()) {
      stopTutorSpeech();
      setSpeakingMsgId(null);
    } else {
      speakTutorExplanation(content, {
        textId: msgId,
        onStart: () => setSpeakingMsgId(msgId),
        onEnd: () => setSpeakingMsgId(null)
      });
    }
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, quizQuestions]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    if (!textToSend) setInput('');
    setIsLoading(true);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query
    };

    setMessages(prev => [...prev, userMsg]);

    try {
      const tutorReply = await onAskTutor(query);
      
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: tutorReply
      };

      setMessages(prev => [...prev, assistantMsg]);
      
      if (autoVoiceEnabled) {
        speakTutorExplanation(tutorReply, {
          textId: assistantMsg.id,
          onStart: () => setSpeakingMsgId(assistantMsg.id),
          onEnd: () => setSpeakingMsgId(null)
        });
      } else {
        onTriggerVoiceFeedback(tutorReply);
      }
    } catch (err) {
      console.error('Failed to get tutor reply:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isAnswerSubmitted) return;
    
    setIsAnswerSubmitted(true);
    const correct = quizQuestions[currentQuestionIdx].answer;
    
    if (selectedOption === correct) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsAnswerSubmitted(false);

    if (currentQuestionIdx + 1 < quizQuestions.length) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const quickSuggestions = allNotes && allNotes.length > 0
    ? allNotes.slice(0, 3).map(note => ({
        label: `Explicar "${note.title}"`,
        action: () => handleSend(`explicar tema ${note.title}`)
      }))
    : [
        { label: '¿Cómo empezar a tomar notas?', action: () => handleSend('¿cómo empiezo a organizar mis apuntes de estudio?') },
        { label: 'Consejos de estudio activo', action: () => handleSend('dame consejos de estudio activo') },
        { label: 'Explicar concepto nuevo', action: () => handleSend('¿cómo puedo usar el Método Feynman para estudiar?') }
      ];

  return (
    <div className="flex-1 h-full flex overflow-hidden bg-bg-primary relative select-text">
      {/* Main Chat Feed */}
      <div className="chat-container flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="h-14 border-b border-border-custom px-6 flex items-center justify-between shrink-0 bg-white dark:bg-panel">
          <div data-tour="chat-tutor-header" className="flex items-center gap-2.5">
            <Bot className="w-5 h-5 text-tech-purple shrink-0" />
            <div className="text-left">
              <h2 className="font-bold text-xs uppercase tracking-wider text-text-primary">Quantum Tutor IA</h2>
              {activeNote && (
                <span className="text-[10px] text-text-secondary">
                  Estudiando contexto de: <span className="text-tech-purple font-semibold">{activeNote.title}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto Voice Toggle */}
            <button
              data-tour="chat-voice-toggle"
              onClick={() => {
                const newVal = !autoVoiceEnabled;
                setAutoVoiceEnabled(newVal);
                localStorage.setItem('qn_tutor_voice_auto', String(newVal));
                if (!newVal) {
                  stopTutorSpeech();
                  setSpeakingMsgId(null);
                }
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                autoVoiceEnabled
                  ? 'bg-tech-purple/10 border-tech-purple text-tech-purple'
                  : 'bg-white dark:bg-panel-secondary border-border-custom text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
              }`}
              title={autoVoiceEnabled ? 'Voz del tutor activada automáticamente al responder' : 'Voz automática silenciada'}
            >
              {autoVoiceEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-tech-purple" />
                  <span className="hidden sm:inline">Voz Tutor</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-text-secondary" />
                  <span className="hidden sm:inline">Voz Silenciada</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-1">
              <button
                data-tour="chat-quiz-btn"
                onClick={onGenerateQuiz}
                disabled={isQuizLoading}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-panel-secondary hover:bg-bg-secondary border border-border-custom text-text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isQuizLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-tech-purple" />
                ) : (
                  <HelpCircle className="w-4 h-4 text-tech-purple" />
                )}
                Generar Cuestionario
              </button>

              <ContextualHelpBadge
                title="Generador de Cuestionarios"
                description="Quantum elabora evaluaciones pedagógicas activas de 3 preguntas basadas en la nota seleccionada, ayudándote a reforzar la retención."
                tooltipText="Ayuda de Cuestionarios"
                placement="bottom"
              />
            </div>
          </div>
        </div>

        {/* Chat log / Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => {
            const isAI = msg.role === 'assistant';
            
            return (
              <div key={msg.id} className={`flex gap-3.5 max-w-3xl ${isAI ? '' : 'ml-auto flex-row-reverse'}`}>
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    isAI
                      ? 'bg-tech-purple border-tech-purple text-white shadow-xs'
                      : 'bg-white dark:bg-panel-secondary border-border-custom text-text-secondary shadow-xs'
                  }`}
                >
                  {isAI ? <Bot className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
                </div>

                {/* Message bubble */}
                <div className={`space-y-1 ${isAI ? 'text-left' : 'text-right'}`}>
                  <div className="flex items-center justify-between gap-2 px-1">
                    <span className="text-[10px] text-text-secondary font-bold tracking-wide uppercase">
                      {isAI ? 'Quantum Tutor' : 'Tú'}
                    </span>
                    {isAI && (
                      <button
                        onClick={() => handleToggleVoiceForMessage(msg.id, msg.content)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1.5 transition-all cursor-pointer border ${
                          speakingMsgId === msg.id
                            ? 'bg-tech-purple/20 text-tech-purple border-tech-purple/40 shadow-xs'
                            : 'text-text-secondary hover:text-text-primary bg-bg-secondary border-border-custom hover:bg-bg-secondary/80'
                        }`}
                        title={speakingMsgId === msg.id ? 'Pausar audio' : 'Escuchar explicación en voz alta'}
                      >
                        {speakingMsgId === msg.id ? (
                          <>
                            <div className="flex items-end gap-0.5 h-3">
                              <span className="w-0.5 bg-tech-purple soundwave-bar" />
                              <span className="w-0.5 bg-tech-purple soundwave-bar" />
                              <span className="w-0.5 bg-tech-purple soundwave-bar" />
                            </div>
                            <span>Pausar</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3 text-tech-purple" />
                            <span>Escuchar</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div
                    className={`p-4 text-xs leading-relaxed border ${
                      isAI
                        ? 'bg-white dark:bg-panel border-border-custom rounded-2xl rounded-tl-xs shadow-xs text-text-primary markdown-body'
                        : 'bg-tech-blue border-transparent text-white rounded-2xl rounded-tr-xs shadow-xs'
                    }`}
                  >
                    {isAI ? (
                      <Markdown>{msg.content}</Markdown>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* AI Loader Bubble */}
          {isLoading && (
            <div className="flex gap-3.5 max-w-3xl">
              <div className="w-9 h-9 rounded-xl bg-tech-purple text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4.5 h-4.5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-text-secondary font-bold tracking-wide uppercase px-1">
                  Quantum Tutor
                </span>
                <div className="p-3.5 rounded-2xl rounded-tl-xs bg-white dark:bg-panel border border-border-custom flex gap-1.5 items-center shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-tech-purple animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-tech-purple animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-tech-purple animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Render Active Interactive Quiz directly in chat log */}
          {quizQuestions.length > 0 && !quizCompleted && (
            <div className="flex gap-3.5 max-w-3xl border-t border-border-custom pt-6">
              <div className="w-9 h-9 rounded-xl bg-tech-purple/10 text-tech-purple border border-tech-purple/20 flex items-center justify-center shrink-0 shadow-xs">
                <HelpCircle className="w-4.5 h-4.5 animate-bounce" />
              </div>

              <div className="space-y-2 flex-1">
                <span className="text-[10px] text-tech-purple font-bold tracking-wider uppercase">
                  Cuestionario Interactivo ({currentQuestionIdx + 1}/{quizQuestions.length})
                </span>

                <div className="p-5 rounded-2xl bg-white dark:bg-panel border border-border-custom space-y-4 shadow-sm">
                  {/* Question Title */}
                  <h3 className="font-semibold text-xs text-text-primary leading-relaxed">
                    {quizQuestions[currentQuestionIdx].question}
                  </h3>

                  {/* Options List */}
                  <div className="space-y-2">
                    {quizQuestions[currentQuestionIdx].options.map((opt, oIdx) => {
                      const isSelected = selectedOption === oIdx;
                      const isCorrectAnswer = quizQuestions[currentQuestionIdx].answer === oIdx;
                      
                      let btnStyle = 'bg-bg-secondary/60 border-border-custom text-text-primary hover:border-tech-purple/40 hover:bg-bg-secondary';
                      let checkIcon = null;

                      if (isAnswerSubmitted) {
                        if (isCorrectAnswer) {
                          btnStyle = 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold';
                          checkIcon = <Check className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
                        } else if (isSelected) {
                          btnStyle = 'bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 font-bold';
                          checkIcon = <X className="w-4.5 h-4.5 text-rose-600 dark:text-rose-400 shrink-0" />;
                        } else {
                          btnStyle = 'bg-bg-secondary/30 border-border-custom text-text-secondary opacity-50';
                        }
                      } else if (isSelected) {
                        btnStyle = 'bg-tech-purple/10 border-tech-purple text-tech-purple font-bold';
                      }

                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleSelectOption(oIdx)}
                          disabled={isAnswerSubmitted}
                          className={`w-full text-left p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all cursor-pointer shadow-xs ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {checkIcon}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanatory Box (Visible after answer submitted) */}
                  {isAnswerSubmitted && (
                    <div className="p-3.5 rounded-xl bg-[#F8F7FC] dark:bg-panel-secondary border border-border-custom text-[11px] text-text-secondary leading-relaxed space-y-1">
                      <span className="font-bold text-text-primary block">Explicación:</span>
                      <p>{quizQuestions[currentQuestionIdx].explanation}</p>
                    </div>
                  )}

                  {/* Quiz Control Buttons */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-border-custom">
                    {!isAnswerSubmitted ? (
                      <button
                        onClick={handleSubmitAnswer}
                        disabled={selectedOption === null}
                        className="px-4 py-2 bg-tech-purple hover:bg-tech-purple/90 disabled:opacity-50 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition-all"
                      >
                        Enviar Respuesta
                      </button>
                    ) : (
                      <button
                        onClick={handleNextQuestion}
                        className="px-4 py-2 bg-tech-blue hover:bg-tech-blue/90 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                      >
                        {currentQuestionIdx + 1 === quizQuestions.length ? 'Finalizar' : 'Siguiente Pregunta'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quiz Final Score Screen */}
          {quizCompleted && (
            <div className="flex gap-3.5 max-w-3xl border-t border-border-custom pt-6">
              <div className="w-9 h-9 rounded-xl bg-tech-purple text-white flex items-center justify-center shrink-0 shadow-xs">
                <Award className="w-4.5 h-4.5" />
              </div>
              
              <div className="space-y-2 flex-1">
                <span className="text-[10px] text-tech-purple font-bold tracking-wider uppercase">
                  Cuestionario Completado
                </span>

                <div className="p-6 rounded-2xl bg-white dark:bg-panel border border-border-custom text-center space-y-4 max-w-sm mx-auto shadow-md">
                  <div className="w-14 h-14 rounded-full bg-tech-purple/10 border border-tech-purple/30 flex items-center justify-center text-tech-purple mx-auto">
                    <Award className="w-7 h-7" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-text-primary text-sm">¡Buen trabajo!</h3>
                    <p className="text-xs text-text-secondary leading-normal">
                      Has completado la prueba de retención rápida de Quantum.
                    </p>
                  </div>

                  <div className="text-2xl font-bold font-mono text-text-primary">
                    Puntuación: <span className="text-tech-purple">{score} / {quizQuestions.length}</span>
                  </div>

                  <p className="text-[10.5px] text-text-secondary leading-relaxed font-semibold">
                    {score === quizQuestions.length
                      ? '¡Excelente! Has respondido de forma correcta a todas las preguntas de este cuestionario.'
                      : 'Buen intento. Revisa tus apuntes en la sección de notas para repasar este concepto e inténtalo de nuevo.'}
                  </p>

                  <button
                    onClick={() => setQuizQuestions([])}
                    className="w-full py-2.5 bg-bg-secondary hover:bg-bg-secondary/80 text-text-primary border border-border-custom rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                  >
                    Cerrar Cuestionario
                  </button>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion list */}
        {messages.length === 1 && !quizQuestions.length && (
          <div data-tour="chat-suggestions" className="px-6 pb-2 pt-4 flex flex-wrap gap-2 justify-center">
            {quickSuggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={s.action}
                className="px-3.5 py-1.5 rounded-full bg-white dark:bg-panel hover:bg-bg-secondary hover:border-tech-purple/40 text-text-secondary hover:text-text-primary border border-border-custom text-xs transition-all cursor-pointer font-semibold shadow-xs"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Message Input panel */}
        <div data-tour="chat-input-area" className="p-4 border-t border-border-custom bg-white dark:bg-panel shrink-0">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2 relative bg-[#F8F7FC] dark:bg-panel-secondary rounded-full border border-border-custom focus-within:border-tech-purple p-1.5 shadow-xs transition-colors"
          >
            <input
              type="text"
              placeholder={isLoading ? 'Quantum está pensando...' : 'Escribe tu duda o pregunta sobre tus apuntes...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-transparent border-none text-xs text-text-primary placeholder:text-text-secondary/60 outline-none px-4 py-2 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2.5 rounded-full bg-tech-purple hover:bg-tech-purple/90 disabled:opacity-40 text-white flex items-center justify-center shrink-0 cursor-pointer shadow-xs transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
