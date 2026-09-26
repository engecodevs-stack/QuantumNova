import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, Sparkles, Compass } from 'lucide-react';
import type { TourStep } from '../config/onboardingConfig';

interface OnboardingTourProps {
  steps: TourStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
  onStepChange?: (step: TourStep, stepIndex: number) => void;
  theme?: 'dark' | 'light';
  isMobileOrTablet?: boolean;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  steps,
  isActive,
  onComplete,
  onSkip,
  onStepChange,
  theme = 'dark',
  isMobileOrTablet = false
}) => {
  const [phase, setPhase] = useState<'welcome' | 'tour' | 'completed'>('welcome');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [isTargetVisible, setIsTargetVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const currentStep = steps[currentStepIndex];

  // Measure target element position
  const measureTarget = useCallback(() => {
    if (!currentStep || phase !== 'tour') return;

    const el = document.querySelector(currentStep.targetSelector) as HTMLElement | null;
    if (el) {
      const rect = el.getBoundingClientRect();
      // Only set if element has dimensions
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
        setIsTargetVisible(true);
        return;
      }
    }

    // Target element not ready or hidden yet
    setIsTargetVisible(false);
  }, [currentStep, phase]);

  // When step changes, notify parent to switch view/drawer, then measure
  useEffect(() => {
    if (!isActive || phase !== 'tour' || !currentStep) return;

    onStepChange?.(currentStep, currentStepIndex);

    // Initial measurement attempt scheduled after current paint
    const timer0 = setTimeout(measureTarget, 10);
    // Re-measure after short delays to allow React re-renders, view switches and transitions to finish
    const timer1 = setTimeout(measureTarget, 80);
    const timer2 = setTimeout(measureTarget, 260);
    const timer3 = setTimeout(measureTarget, 550);

    return () => {
      clearTimeout(timer0);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isActive, phase, currentStepIndex, currentStep, onStepChange, measureTarget]);

  // Keep target rect updated on window resize or scroll
  useEffect(() => {
    if (!isActive || phase !== 'tour') return;

    const handleUpdate = () => {
      measureTarget();
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
    };
  }, [isActive, phase, measureTarget]);

  const handleStartTour = () => {
    setPhase('tour');
    setCurrentStepIndex(0);
  };

  const handleNext = useCallback(() => {
    if (currentStepIndex + 1 < steps.length) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setPhase('completed');
    }
  }, [currentStepIndex, steps.length]);

  const handlePrev = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const handleFinish = () => {
    onComplete();
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSkip();
      } else if (e.key === 'ArrowRight' && phase === 'tour') {
        handleNext();
      } else if (e.key === 'ArrowLeft' && phase === 'tour' && currentStepIndex > 0) {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, phase, currentStepIndex, handleNext, handlePrev, onSkip]);

  // Card Positioning Engine (Guarantees zero screen overflow on any device)
  const calculateCardPosition = () => {
    const cardWidth = isMobileOrTablet ? Math.min(window.innerWidth - 32, 380) : 340;
    const cardHeight = 220; // Estimated max height
    const padding = 16;

    if (!targetRect || !isTargetVisible) {
      // Default to center-bottom if target is offscreen
      return {
        top: window.innerHeight / 2 - 100,
        left: Math.max(padding, (window.innerWidth - cardWidth) / 2),
        width: cardWidth
      };
    }

    if (isMobileOrTablet) {
      // On mobile/tablet, position card safely at bottom or top of screen
      const spaceBelow = window.innerHeight - (targetRect.top + targetRect.height);
      const spaceAbove = targetRect.top;

      let top: number;
      if (spaceBelow >= cardHeight + padding) {
        top = targetRect.top + targetRect.height + 12;
      } else if (spaceAbove >= cardHeight + padding) {
        top = Math.max(padding, targetRect.top - cardHeight - 12);
      } else {
        top = Math.max(padding, window.innerHeight - cardHeight - padding);
      }

      const left = Math.max(padding, (window.innerWidth - cardWidth) / 2);
      return { top, left, width: cardWidth };
    }

    // Desktop placement
    const pref = currentStep?.positionPreference || 'auto';
    let top: number;
    let left: number;

    if (pref === 'right') {
      left = targetRect.left + targetRect.width + 16;
      top = targetRect.top + Math.min(10, (targetRect.height - 180) / 2);

      // Check right boundary
      if (left + cardWidth > window.innerWidth - padding) {
        left = targetRect.left - cardWidth - 16;
      }
    } else if (pref === 'left') {
      left = targetRect.left - cardWidth - 16;
      top = targetRect.top + Math.min(10, (targetRect.height - 180) / 2);

      // Check left boundary
      if (left < padding) {
        left = targetRect.left + targetRect.width + 16;
      }
    } else if (pref === 'bottom') {
      top = targetRect.top + targetRect.height + 14;
      left = targetRect.left + (targetRect.width - cardWidth) / 2;
    } else if (pref === 'top') {
      top = targetRect.top - cardHeight - 14;
      left = targetRect.left + (targetRect.width - cardWidth) / 2;
    } else {
      // Auto: prefer right if wide screen, otherwise bottom
      if (window.innerWidth - (targetRect.left + targetRect.width) >= cardWidth + 24) {
        left = targetRect.left + targetRect.width + 16;
        top = targetRect.top;
      } else {
        top = targetRect.top + targetRect.height + 14;
        left = targetRect.left;
      }
    }

    // Clamp inside viewport
    left = Math.max(padding, Math.min(window.innerWidth - cardWidth - padding, left));
    top = Math.max(padding, Math.min(window.innerHeight - cardHeight - padding, top));

    return { top, left, width: cardWidth };
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto overflow-hidden select-none">
      {/* PHASE 1: WELCOME SCREEN */}
      {phase === 'welcome' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md rounded-2xl bg-white/95 dark:bg-[#12121B]/95 border border-[#E1E1EA] dark:border-white/10 p-7 text-center shadow-2xl relative overflow-hidden backdrop-blur-2xl"
          >
            {/* Ambient subtle glow background */}
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-br from-[#5865F2]/20 to-[#A947E8]/20 rounded-full blur-3xl pointer-events-none" />

            {/* Quantum Logo Mark */}
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#F8F7FC] dark:bg-[#181824] border border-[#E1E1EA] dark:border-white/10 flex items-center justify-center shadow-md relative">
              <svg className="w-10 h-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="tourLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#5865F2" />
                    <stop offset="60%" stopColor="#8A2BE2" />
                    <stop offset="100%" stopColor="#A947E8" />
                  </linearGradient>
                </defs>
                <path d="M 71.2 24.8 A 30 30 0 1 0 71.2 67.2" stroke="url(#tourLogoGrad)" strokeWidth="10" strokeLinecap="round" fill="none" />
                <path d="M 52 48 L 78 74" stroke="url(#tourLogoGrad)" strokeWidth="10" strokeLinecap="round" />
                <circle cx="50" cy="46" r="14" fill="#FFFFFF" opacity="0.9" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-[#18181F] dark:text-[#F5F5F7] tracking-tight mb-2">
              Bienvenido a Quantum Nova
            </h2>
            <p className="text-xs text-[#5F6070] dark:text-[#9E9EAF] leading-relaxed mb-6 px-2">
              Aprende a utilizar Quantum Nova y descubre cómo convertir tus propios conocimientos en una herramienta para estudiar mejor.
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleStartTour}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#5865F2] via-[#8A2BE2] to-[#A947E8] hover:opacity-95 text-white font-semibold text-xs transition-all shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Comenzar recorrido</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={onSkip}
                className="w-full py-2 text-xs font-medium text-[#5F6070] dark:text-[#9E9EAF] hover:text-[#18181F] dark:hover:text-[#F5F5F7] transition-colors cursor-pointer"
              >
                Omitir por ahora
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* PHASE 2: INTERACTIVE GUIDED TOUR SPOTLIGHT & FLOATING CARD */}
      {phase === 'tour' && (
        <>
          {/* Spotlight Highlight Box (Smooth Animated Cutout) */}
          <AnimatePresence>
            {targetRect && isTargetVisible && (
              <motion.div
                key="spotlight-box"
                initial={false}
                animate={{
                  top: targetRect.top - 6,
                  left: targetRect.left - 6,
                  width: targetRect.width + 12,
                  height: targetRect.height + 12
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 32,
                  mass: 0.8
                }}
                className="fixed pointer-events-none z-50 rounded-2xl"
                style={{
                  border: theme === 'dark' ? '2px solid rgba(169, 71, 232, 0.85)' : '2px solid rgba(154, 57, 217, 0.85)',
                  boxShadow:
                    theme === 'dark'
                      ? '0 0 0 9999px rgba(11, 11, 18, 0.68), 0 0 28px rgba(169, 71, 232, 0.42), inset 0 0 14px rgba(88, 101, 242, 0.25)'
                      : '0 0 0 9999px rgba(18, 18, 31, 0.55), 0 0 26px rgba(154, 57, 217, 0.35), inset 0 0 14px rgba(79, 94, 219, 0.2)'
                }}
              />
            )}
          </AnimatePresence>

          {/* Fallback Overlay when target is off-screen or animating */}
          {(!targetRect || !isTargetVisible) && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 pointer-events-none" />
          )}

          {/* Floating Contextual Explanatory Card */}
          {(() => {
            const cardPos = calculateCardPosition();

            return (
              <motion.div
                ref={cardRef}
                key={`tour-card-${currentStepIndex}`}
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  top: cardPos.top,
                  left: cardPos.left,
                  width: cardPos.width
                }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="fixed z-50 rounded-2xl bg-white/95 dark:bg-[#12121B]/95 border border-[#E1E1EA] dark:border-white/10 p-5 shadow-2xl backdrop-blur-2xl text-left"
                style={{
                  boxShadow:
                    theme === 'dark'
                      ? '0 20px 40px -10px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(169, 71, 232, 0.25)'
                      : '0 20px 40px -10px rgba(18, 18, 31, 0.15), 0 0 1px 1px rgba(154, 57, 217, 0.2)'
                }}
              >
                {/* Minimal Progress Bar */}
                <div className="w-full h-1 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-[#5865F2] to-[#A947E8] transition-all duration-300 rounded-full"
                    style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                  />
                </div>

                {/* Card Top Row: Progress indicator & Close Button */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#A947E8] dark:text-[#B04BEE] font-mono">
                    {currentStepIndex + 1} de {steps.length}
                  </span>

                  <button
                    onClick={onSkip}
                    className="p-1 rounded-lg text-[#5F6070] dark:text-[#9E9EAF] hover:text-[#18181F] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    title="Cerrar recorrido"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Title and Description */}
                <h3 className="text-sm font-bold text-[#18181F] dark:text-[#F5F5F7] tracking-tight mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#A947E8] dark:text-[#B04BEE] shrink-0" />
                  <span>{currentStep.title}</span>
                </h3>

                <p className="text-xs text-[#5F6070] dark:text-[#9E9EAF] leading-relaxed mb-4">
                  {currentStep.description}
                </p>

                {/* Card Bottom Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E1E1EA] dark:border-white/5">
                  <button
                    onClick={onSkip}
                    className="text-[11px] font-medium text-[#5F6070] dark:text-[#9E9EAF] hover:text-[#18181F] dark:hover:text-[#F5F5F7] hover:underline cursor-pointer transition-colors"
                  >
                    Omitir recorrido
                  </button>

                  <div className="flex items-center gap-2">
                    {currentStepIndex > 0 && (
                      <button
                        onClick={handlePrev}
                        className="px-2.5 py-1.5 rounded-lg border border-[#E1E1EA] dark:border-white/10 text-[11px] font-semibold text-[#5F6070] dark:text-[#9E9EAF] hover:text-[#18181F] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Atrás</span>
                      </button>
                    )}

                    <button
                      onClick={handleNext}
                      className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#5865F2] to-[#A947E8] hover:opacity-95 text-white text-[11px] font-semibold transition-all shadow-xs active:scale-[0.97] cursor-pointer flex items-center gap-1.5"
                    >
                      <span>
                        {currentStepIndex + 1 === steps.length
                          ? 'Finalizar'
                          : currentStep.interactiveLabel || 'Siguiente'}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })()}
        </>
      )}

      {/* PHASE 3: COMPLETION SCREEN */}
      {phase === 'completed' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm rounded-2xl bg-white/95 dark:bg-[#12121B]/95 border border-[#E1E1EA] dark:border-white/10 p-7 text-center shadow-2xl relative overflow-hidden backdrop-blur-2xl"
          >
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-[#A947E8]/10 text-[#A947E8] dark:text-[#B04BEE] border border-[#A947E8]/20 flex items-center justify-center shadow-sm">
              <Compass className="w-6 h-6" />
            </div>

            <h2 className="text-lg font-bold text-[#18181F] dark:text-[#F5F5F7] tracking-tight mb-2">
              Ya estás listo
            </h2>
            <p className="text-xs text-[#5F6070] dark:text-[#9E9EAF] leading-relaxed mb-6">
              Ahora puedes comenzar a utilizar Quantum Nova.
            </p>

            <button
              onClick={handleFinish}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#5865F2] to-[#A947E8] hover:opacity-95 text-white font-semibold text-xs transition-all shadow-md active:scale-[0.98] cursor-pointer"
            >
              Comenzar
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};
