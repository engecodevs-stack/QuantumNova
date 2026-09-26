import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContextualHelpBadgeProps {
  title: string;
  description: string;
  tooltipText?: string;
  placement?: 'bottom' | 'top' | 'left' | 'right';
}

export const ContextualHelpBadge: React.FC<ContextualHelpBadgeProps> = ({
  title,
  description,
  tooltipText = 'Ayuda de esta función',
  placement = 'bottom'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const getPositionClasses = () => {
    switch (placement) {
      case 'top':
        return 'bottom-full mb-2 left-1/2 -translate-x-1/2';
      case 'left':
        return 'right-full mr-2 top-1/2 -translate-y-1/2';
      case 'right':
        return 'left-full ml-2 top-1/2 -translate-y-1/2';
      case 'bottom':
      default:
        return 'top-full mt-2 left-1/2 -translate-x-1/2';
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(prev => !prev);
        }}
        className="p-1 rounded-lg text-text-secondary hover:text-tech-purple hover:bg-tech-purple/10 transition-colors cursor-pointer"
        title={tooltipText}
        aria-label={tooltipText}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, scale: 0.94, y: placement === 'bottom' ? -4 : 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.16 }}
            className={`absolute z-50 w-72 p-3.5 rounded-xl bg-white/95 dark:bg-[#12121B]/95 border border-[#E1E1EA] dark:border-white/10 shadow-xl backdrop-blur-xl text-left select-none ${getPositionClasses()}`}
            style={{
              boxShadow: '0 12px 30px -8px rgba(0, 0, 0, 0.25), 0 0 1px 1px rgba(169, 71, 232, 0.2)'
            }}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5 border-b border-[#E1E1EA] dark:border-white/5 pb-1.5">
              <span className="text-[11px] font-bold text-[#18181F] dark:text-[#F5F5F7] tracking-tight truncate">
                {title}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="p-0.5 rounded text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <p className="text-[11px] text-text-secondary leading-relaxed mb-2.5">
              {description}
            </p>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="px-2.5 py-1 rounded-md bg-tech-purple text-white text-[10.5px] font-semibold hover:bg-tech-purple-hover transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
