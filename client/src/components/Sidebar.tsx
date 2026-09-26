import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  GraduationCap,
  FileText,
  BrainCircuit,
  Library,
  Settings,
  ChevronLeft,
  AppWindow,
  Users,
  Clock,
  Sparkles
} from 'lucide-react';
import type { ViewType, User } from '../types';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
  studyTimeStr: string;
  onToolsClick: () => void;
  isMobileOrTablet?: boolean;
  isSidebarOpenMobile?: boolean;
  onCloseMobile?: () => void;
  currentUser?: User | null;
  onToggleRole?: () => void;
  isRightPanelOpen?: boolean;
  onToggleRightPanel?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setView,
  studyTimeStr,
  onToolsClick,
  isMobileOrTablet = false,
  isSidebarOpenMobile = false,
  onCloseMobile,
  currentUser,
  onToggleRole,
  isRightPanelOpen = false,
  onToggleRightPanel
}) => {
  // Desktop hover expansion state
  const [isHovered, setIsHovered] = useState(false);

  // In mobile/tablet drawer mode, the sidebar is always fully expanded when opened
  const isExpanded = isMobileOrTablet ? true : isHovered;
  const sidebarWidth = 260;

  const isTeacher = currentUser?.role === 'profe' || currentUser?.email?.toLowerCase().endsWith('@profe.edu.mx');

  const menuItems = isTeacher
    ? [
        { id: 'teacher' as ViewType, label: 'Portal Docente', icon: GraduationCap },
        { id: 'chat' as ViewType, label: 'Chat IA', icon: Bot },
        { id: 'notes' as ViewType, label: 'Mis Notas', icon: FileText },
        { id: 'map' as ViewType, label: 'Mapa Mental', icon: BrainCircuit },
        { id: 'library' as ViewType, label: 'Biblioteca', icon: Library }
      ]
    : [
        { id: 'notes' as ViewType, label: 'Mis Notas', icon: FileText },
        { id: 'chat' as ViewType, label: 'Chat IA', icon: Bot },
        { id: 'communities' as ViewType, label: 'Comunidades', icon: Users },
        { id: 'courses' as ViewType, label: 'Mis Cursos', icon: GraduationCap },
        { id: 'map' as ViewType, label: 'Mapa Mental', icon: BrainCircuit },
        { id: 'library' as ViewType, label: 'Biblioteca', icon: Library }
      ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between overflow-hidden">
      {/* Upper Logo Area */}
      <div>
        <div className="px-3 flex items-center justify-between border-b border-[#E1E1EA] dark:border-[#292936] h-16 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Logo Mark - perfectly stable at 40px width */}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative select-none">
              <svg className="w-9 h-9" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="qBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#5865F2" />
                    <stop offset="60%" stopColor="#8A2BE2" />
                    <stop offset="100%" stopColor="#A947E8" />
                  </linearGradient>
                  
                  <linearGradient id="qTailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8A2BE2" />
                    <stop offset="100%" stopColor="#A947E8" />
                  </linearGradient>

                  <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#5865F2" stopOpacity="0.4" />
                    <stop offset="50%" stopColor="#5865F2" />
                    <stop offset="100%" stopColor="#A947E8" stopOpacity="0.4" />
                  </linearGradient>

                  <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="40%" stopColor="#EBF0FF" />
                    <stop offset="100%" stopColor="#5865F2" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Back orbit */}
                <path 
                  d="M 8 46 A 42 14 0 0 1 92 46" 
                  stroke="url(#orbitGrad)" 
                  strokeWidth="2" 
                  fill="none" 
                  transform="rotate(-20 50 46)" 
                  opacity="0.8"
                />

                {/* Q Body */}
                <path 
                  d="M 71.2 24.8 A 30 30 0 1 0 71.2 67.2" 
                  stroke="url(#qBodyGrad)" 
                  strokeWidth="10" 
                  strokeLinecap="round" 
                  fill="none"
                />

                {/* Q Tail */}
                <path 
                  d="M 52 48 L 78 74" 
                  stroke="url(#qTailGrad)" 
                  strokeWidth="10" 
                  strokeLinecap="round" 
                />

                {/* Front orbit */}
                <path 
                  d="M 92 46 A 42 14 0 0 1 8 46" 
                  stroke="url(#orbitGrad)" 
                  strokeWidth="2" 
                  fill="none" 
                  transform="rotate(-20 50 46)" 
                />

                {/* Orbiting nodes */}
                <g transform="rotate(-20 50 46)">
                  <circle cx="13.6" cy="53" r="3.5" fill="#5865F2" />
                  <circle cx="86.4" cy="39" r="4" fill="#A947E8" />
                </g>

                {/* Center Star Glow */}
                <circle cx="50" cy="46" r="18" fill="url(#starGlow)" opacity="0.9" />

                {/* Flared 4-point Star */}
                <path 
                  d="M 50 30 Q 50 46 66 46 Q 50 46 50 62 Q 50 46 34 46 Q 50 46 50 30 Z" 
                  fill="#FFFFFF" 
                />
              </svg>
            </div>

            {/* Brand Title: smooth fade-in on expansion */}
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.16 }}
                className="font-bold text-sm text-[#18181F] dark:text-[#F5F5F7] tracking-tight whitespace-nowrap"
              >
                QuantumNova
              </motion.span>
            )}
          </div>

          {/* Close button strictly on mobile drawer */}
          {isMobileOrTablet && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-[#626273] hover:text-[#18181F] dark:text-[#A1A1B2] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Cerrar menú"
            >
              <ChevronLeft className="w-5 h-5 text-[#A947E8] dark:text-[#B04BEE]" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1 overflow-y-auto">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                data-tour={`nav-${item.id}`}
                onClick={() => {
                  setView(item.id);
                  if (isMobileOrTablet && onCloseMobile) {
                    onCloseMobile();
                  }
                }}
                className={`w-full flex items-center h-11 px-2.5 rounded-xl text-xs font-medium transition-colors group relative cursor-pointer ${
                  isActive
                    ? 'bg-[#A947E8]/10 text-[#A947E8] font-bold border border-[#A947E8]/25 dark:bg-[#B04BEE]/15 dark:text-[#B04BEE] dark:border-[#B04BEE]/30'
                    : 'text-[#626273] hover:text-[#18181F] hover:bg-[#A947E8]/5 dark:text-[#A1A1B2] dark:hover:text-[#F5F5F7] dark:hover:bg-[#181321]'
                }`}
                title={!isExpanded ? item.label : undefined}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full bg-[#A947E8] dark:bg-[#B04BEE]" />
                )}

                {/* Fixed centered icon frame */}
                <div className="w-7 h-7 flex items-center justify-center shrink-0">
                  <Icon
                    className={`w-4.5 h-4.5 transition-transform duration-150 group-hover:scale-105 ${
                      isActive
                        ? 'text-[#A947E8] dark:text-[#B04BEE]'
                        : 'text-[#626273] dark:text-[#A1A1B2] group-hover:text-[#18181F] dark:group-hover:text-[#F5F5F7]'
                    }`}
                  />
                </div>

                {/* Label text */}
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.16 }}
                    className="truncate flex-1 text-left ml-2.5 text-xs font-semibold"
                  >
                    {item.label}
                  </motion.span>
                )}
              </button>
            );
          })}

          {/* Tools Action Button */}
          <button
            data-tour="nav-tools"
            onClick={() => {
              onToolsClick();
              if (isMobileOrTablet && onCloseMobile) {
                onCloseMobile();
              }
            }}
            className="w-full flex items-center h-11 px-2.5 rounded-xl text-xs font-medium transition-colors group relative cursor-pointer text-[#626273] hover:text-[#18181F] hover:bg-[#A947E8]/5 dark:text-[#A1A1B2] dark:hover:text-[#F5F5F7] dark:hover:bg-[#181321]"
            title={!isExpanded ? 'Tools' : undefined}
          >
            <div className="w-7 h-7 flex items-center justify-center shrink-0">
              <AppWindow className="w-4.5 h-4.5 transition-transform duration-150 group-hover:scale-105 text-[#626273] dark:text-[#A1A1B2] group-hover:text-[#18181F] dark:group-hover:text-[#F5F5F7]" />
            </div>

            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.16 }}
                className="truncate flex-1 text-left ml-2.5 text-xs font-semibold"
              >
                Tools
              </motion.span>
            )}
          </button>

          {/* Quantum Copiloto (IA Panel) Button */}
          <button
            data-tour="nav-copilot"
            onClick={() => {
              onToggleRightPanel?.();
              if (isMobileOrTablet && onCloseMobile) {
                onCloseMobile();
              }
            }}
            className={`w-full flex items-center h-11 px-2.5 rounded-xl text-xs font-medium transition-colors group relative cursor-pointer ${
              isRightPanelOpen
                ? 'bg-[#A947E8]/10 text-[#A947E8] font-bold border border-[#A947E8]/25 dark:bg-[#B04BEE]/15 dark:text-[#B04BEE] dark:border-[#B04BEE]/30'
                : 'text-[#626273] hover:text-[#18181F] hover:bg-[#A947E8]/5 dark:text-[#A1A1B2] dark:hover:text-[#F5F5F7] dark:hover:bg-[#181321]'
            }`}
            title={!isExpanded ? (isRightPanelOpen ? 'Cerrar panel de IA' : 'Abrir panel de IA') : undefined}
          >
            {isRightPanelOpen && (
              <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full bg-[#A947E8] dark:bg-[#B04BEE]" />
            )}

            <div className="w-7 h-7 flex items-center justify-center shrink-0">
              <Sparkles
                className={`w-4.5 h-4.5 transition-transform duration-150 group-hover:scale-105 ${
                  isRightPanelOpen
                    ? 'text-[#A947E8] dark:text-[#B04BEE]'
                    : 'text-[#626273] dark:text-[#A1A1B2] group-hover:text-[#A947E8] dark:group-hover:text-[#B04BEE]'
                }`}
              />
            </div>

            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.16 }}
                className="truncate flex-1 text-left ml-2.5 text-xs font-semibold flex items-center justify-between"
              >
                <span>Copiloto IA</span>
                {isRightPanelOpen && (
                  <span className="text-[9.5px] px-1.5 py-0.5 rounded-md bg-[#A947E8]/15 text-[#A947E8] dark:text-[#B04BEE] font-bold">
                    Activo
                  </span>
                )}
              </motion.span>
            )}
          </button>

          {/* Configuración (Settings) Button */}
          <button
            data-tour="nav-settings"
            onClick={() => {
              setView('settings');
              if (isMobileOrTablet && onCloseMobile) {
                onCloseMobile();
              }
            }}
            className={`w-full flex items-center h-11 px-2.5 rounded-xl text-xs font-medium transition-colors group relative cursor-pointer ${
              currentView === 'settings'
                ? 'bg-[#A947E8]/10 text-[#A947E8] font-bold border border-[#A947E8]/25 dark:bg-[#B04BEE]/15 dark:text-[#B04BEE] dark:border-[#B04BEE]/30'
                : 'text-[#626273] hover:text-[#18181F] hover:bg-[#A947E8]/5 dark:text-[#A1A1B2] dark:hover:text-[#F5F5F7] dark:hover:bg-[#181321]'
            }`}
            title={!isExpanded ? 'Configuración' : undefined}
          >
            {currentView === 'settings' && (
              <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full bg-[#A947E8] dark:bg-[#B04BEE]" />
            )}

            <div className="w-7 h-7 flex items-center justify-center shrink-0">
              <Settings
                className={`w-4.5 h-4.5 transition-transform duration-150 group-hover:scale-105 ${
                  currentView === 'settings'
                    ? 'text-[#A947E8] dark:text-[#B04BEE]'
                    : 'text-[#626273] dark:text-[#A1A1B2] group-hover:text-[#18181F] dark:group-hover:text-[#F5F5F7]'
                }`}
              />
            </div>

            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.16 }}
                className="truncate flex-1 text-left ml-2.5 text-xs font-semibold"
              >
                Configuración
              </motion.span>
            )}
          </button>
        </nav>
      </div>

      {/* Footer Info / Study Session info */}
      <div data-tour="sidebar-study-time" className="p-2.5 border-t border-[#E1E1EA] dark:border-[#292936] shrink-0">
        {isExpanded ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-1.5 p-3 rounded-xl bg-white dark:bg-[#12121B] border border-[#E1E1EA] dark:border-[#292936] shadow-xs"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#A947E8] dark:bg-[#B04BEE] animate-pulse" />
              <span className="text-[10px] text-[#5F6070] dark:text-[#A4A4B5] font-semibold tracking-wider uppercase">
                Sesión de estudio
              </span>
            </div>
            <div className="text-sm font-bold font-mono tracking-wider text-[#18181F] dark:text-[#F5F5F7] ml-4">
              {studyTimeStr}
            </div>

            {/* Role Badge and Switcher */}
            <div className="flex items-center justify-between pt-2 mt-1 border-t border-[#E1E1EA] dark:border-[#292936]">
              <span className="text-[10px] font-medium text-[#5F6070] dark:text-[#A4A4B5]">
                {isTeacher ? 'Rol Docente' : 'Rol Estudiante'}
              </span>
              {onToggleRole && (
                <button
                  data-tour="sidebar-role-toggle"
                  onClick={onToggleRole}
                  className="text-[10px] font-semibold text-[#A947E8] dark:text-[#B04BEE] hover:underline transition-colors cursor-pointer"
                  title="Alternar rol para probar ambas experiencias"
                >
                  Alternar
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[#5F6070] dark:text-[#A4A4B5] hover:bg-[#A947E8]/5 dark:hover:bg-[#181321] transition-colors"
              title={`Sesión de estudio: ${studyTimeStr}`}
            >
              <Clock className="w-5 h-5 text-[#A947E8] dark:text-[#B04BEE]" />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Mobile / Tablet Drawer rendering
  if (isMobileOrTablet) {
    return (
      <motion.aside
        animate={{ x: isSidebarOpenMobile ? 0 : -sidebarWidth - 30, width: sidebarWidth }}
        transition={{ duration: 0.22, ease: [0.2, 0, 0.2, 1] }}
        className="sidebar-container fixed top-0 bottom-0 left-0 h-full z-40 bg-[#F3F2F8] dark:bg-[#0B0B12] border-r border-[#E1E1EA] dark:border-[#292936] flex flex-col justify-between select-none overflow-hidden shadow-2xl"
      >
        {sidebarContent}
      </motion.aside>
    );
  }

  // Desktop Hover-to-expand Google Classroom interaction:
  // The outer wrapper has fixed width (76px) so the main content never moves or reflows.
  // The aside floats over the left portion of the content on hover and smoothly expands to 260px.
  return (
    <div
      className="relative h-full shrink-0 z-30 pointer-events-none"
      style={{ width: 76 }}
    >
      <motion.aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocusCapture={() => setIsHovered(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsHovered(false);
          }
        }}
        animate={{ width: isHovered ? sidebarWidth : 64 }}
        transition={{ duration: 0.2, ease: [0.2, 0, 0.2, 1] }}
        className={`sidebar-container pointer-events-auto absolute top-2.5 bottom-2.5 left-2.5 flex flex-col justify-between select-none overflow-hidden rounded-2xl border border-[#E1E1EA] dark:border-[#292936] bg-[#F3F2F8] dark:bg-[#0B0B12] transition-shadow duration-200 ${
          isHovered
            ? 'shadow-2xl z-40'
            : 'shadow-xs z-30'
        }`}
        style={{
          height: 'calc(100% - 20px)',
          maxWidth: 'calc(100vw - 20px)'
        }}
      >
        {sidebarContent}
      </motion.aside>
    </div>
  );
};
