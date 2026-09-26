import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Brain,
  Lightbulb,
  Minimize2
} from 'lucide-react';
import type { Note, SuggestionConnection } from '../types';
import { ContextualHelpBadge } from './ContextualHelpBadge';

interface RightPanelProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  activeNote: Note | null;
  aiSummary: string;
  isSummaryLoading: boolean;
  suggestedConnections: SuggestionConnection[];
  onConnectNote: (targetId: string) => void;
  allNotes: Note[];
  isMobileOrTablet?: boolean;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  isOpen,
  setIsOpen,
  activeNote,
  aiSummary,
  isSummaryLoading,
  suggestedConnections,
  onConnectNote,
  allNotes,
  isMobileOrTablet = false
}) => {
  const panelWidth = 320;
  
  const initialAnim = isMobileOrTablet 
    ? { x: panelWidth, opacity: 0 } 
    : { width: 0, opacity: 0 };
    
  const animateVal = isMobileOrTablet 
    ? { x: 0, opacity: 1 } 
    : { width: panelWidth, opacity: 1 };
    
  const exitAnim = isMobileOrTablet 
    ? { x: panelWidth, opacity: 0 } 
    : { width: 0, opacity: 0 };

  return (
    <div className={`h-full flex shrink-0 select-none ${isMobileOrTablet ? '' : 'relative z-20'}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            data-tour="copilot-panel"
            initial={initialAnim}
            animate={animateVal}
            exit={exitAnim}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={`right-panel-container h-full bg-white dark:bg-panel border-l border-border-custom flex flex-col overflow-hidden shadow-xl ${
              isMobileOrTablet ? 'fixed top-0 bottom-0 right-0 z-40' : ''
            }`}
            style={
              isMobileOrTablet
                ? {
                    margin: '0',
                    height: '100%',
                    borderRadius: '0',
                    boxShadow: '-20px 0 30px rgba(0, 0, 0, 0.3)'
                  }
                : {}
            }
          >
            {/* Header */}
            <div className="p-4 border-b border-border-custom flex items-center justify-between h-14 shrink-0 bg-white dark:bg-panel">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-tech-purple shrink-0" />
                <span className="font-bold text-xs uppercase tracking-wider text-text-primary">Quantum Copiloto</span>
                <ContextualHelpBadge
                  title="Quantum Copiloto"
                  description="El copiloto analiza tus apuntes en tiempo real para generar resúmenes automáticos y sugerirte conexiones con otras notas."
                  tooltipText="Ayuda del Copiloto"
                  placement="bottom"
                />
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
                title="Cerrar panel"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {activeNote ? (
                <>
                  {/* Note Context Info */}
                  <div className="p-4 rounded-xl bg-[#F8F7FC] dark:bg-panel-secondary border border-border-custom shadow-xs">
                    <span className="text-[10px] text-tech-purple font-bold uppercase tracking-wider">Nota Activa</span>
                    <h3 className="font-bold text-text-primary truncate text-xs mt-0.5">{activeNote.title}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {activeNote.tags.map(tag => (
                        <span
                          key={tag}
                          className="text-[10px] font-semibold bg-white dark:bg-panel border border-border-custom text-text-secondary px-2.5 py-0.5 rounded-md font-mono"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* AI Note Summary Section */}
                  <div data-tour="copilot-summary" className="space-y-2.5">
                    <div className="flex items-center gap-2 text-text-primary">
                      <BookOpen className="w-4 h-4 text-tech-purple" />
                      <h4 className="font-bold text-xs uppercase tracking-wider text-text-primary">
                        Resumen de la Nota
                      </h4>
                    </div>

                    {isSummaryLoading ? (
                      <div className="p-4 rounded-xl bg-[#F8F7FC] dark:bg-panel-secondary border border-border-custom space-y-2.5 animate-pulse">
                        <div className="h-3.5 bg-border-custom rounded w-full" />
                        <div className="h-3.5 bg-border-custom rounded w-5/6" />
                        <div className="h-3.5 bg-border-custom rounded w-4/5" />
                        <div className="h-3.5 bg-border-custom rounded w-2/3" />
                      </div>
                    ) : aiSummary ? (
                      <div className="p-4 rounded-xl bg-white dark:bg-panel border border-border-custom text-xs text-text-secondary leading-relaxed markdown-body shadow-xs">
                        {aiSummary.split('\n').map((line, idx) => {
                          if (line.startsWith('*') || line.startsWith('-')) {
                            return (
                              <div key={idx} className="flex gap-2 mb-1.5 last:mb-0">
                                <span className="text-tech-purple shrink-0 font-bold">•</span>
                                <span>{line.replace(/^[*-\s]+/, '')}</span>
                              </div>
                            );
                          }
                          if (line.startsWith('###')) {
                            return (
                              <h5 key={idx} className="font-bold text-text-primary text-xs mt-3.5 mb-1.5 first:mt-0">
                                {line.replace(/^###\s+/, '')}
                              </h5>
                            );
                          }
                          return (
                            <p key={idx} className="mb-2 last:mb-0">
                              {line}
                            </p>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-[#F8F7FC] dark:bg-panel-secondary border border-border-custom text-xs text-text-secondary text-center italic">
                        Agrega contenido a la nota para ver el resumen automático de la IA.
                      </div>
                    )}
                  </div>

                  {/* Dynamic Connections Suggestion (RAG fallbacks) */}
                  <div data-tour="copilot-connections" className="space-y-2.5">
                    <div className="flex items-center gap-2 text-text-primary">
                      <Brain className="w-4 h-4 text-tech-purple" />
                      <h4 className="font-bold text-xs uppercase tracking-wider text-text-primary">
                        Conexiones sugeridas por IA
                      </h4>
                    </div>

                    {suggestedConnections.length > 0 ? (
                      <div className="space-y-2.5">
                        {suggestedConnections.map((conn, idx) => {
                          const targetNote = allNotes.find(n => n.id === conn.targetNoteId);
                          if (!targetNote) return null;

                          return (
                            <div
                              key={idx}
                              className="p-3.5 rounded-xl bg-white dark:bg-panel border border-border-custom text-xs space-y-2 hover:border-tech-purple/60 transition-all group shadow-xs"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-text-primary group-hover:text-tech-purple transition-colors truncate">
                                  {targetNote.title}
                                </span>
                                <button
                                  onClick={() => onConnectNote(conn.targetNoteId)}
                                  className="text-[10px] text-tech-purple hover:text-tech-purple/80 flex items-center gap-1 shrink-0 font-bold uppercase tracking-wider cursor-pointer"
                                >
                                  Enlazar <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="text-[11px] text-text-secondary leading-relaxed">
                                {conn.reason}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-[#F8F7FC] dark:bg-panel-secondary border border-border-custom text-xs text-text-secondary text-center italic">
                        No hay notas relacionadas detectadas. Crea más notas de temas similares.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // State when no note is open
                <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-4 py-20">
                  <div className="w-12 h-12 rounded-full bg-white dark:bg-panel-secondary border border-border-custom flex items-center justify-center text-tech-purple shadow-xs">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-text-primary">Estudio Contextual Inactivo</h4>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Abre o crea una nota en la sección **Mis Notas** para activar las sugerencias inteligentes, resúmenes automáticos y el grafo de conocimiento contextual de Quantum.
                    </p>
                  </div>
                  
                  {/* Quick study tip */}
                  <div className="p-4 rounded-xl bg-[#F8F7FC] dark:bg-panel-secondary border border-border-custom text-[11px] text-text-secondary text-left w-full space-y-1.5 shadow-xs">
                    <div className="flex items-center gap-1.5 text-tech-purple font-bold">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Consejo de Productividad</span>
                    </div>
                    <p className="leading-relaxed">
                      Usa enlaces bidireccionales `[[Nombre de Nota]]` para vincular tus ideas. La IA detectará estos enlaces y creará relaciones automáticas en tu Mapa Mental.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
