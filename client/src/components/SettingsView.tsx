import React, { useEffect, useState } from 'react';
import {
  Settings,
  Eye,
  Volume2,
  ShieldAlert,
  Key,
  ZoomIn,
  Sun,
  Moon,
  Compass,
  FileText,
  Bot,
  Sparkles,
  BrainCircuit,
  GraduationCap,
  Library
} from 'lucide-react';

interface SettingsViewProps {
  ttsEnabled: boolean;
  setTtsEnabled: (enabled: boolean) => void;
  fontSizeScale: number;
  setFontSizeScale: (scale: number) => void;
  highContrast: boolean;
  setHighContrast: (contrast: boolean) => void;
  readingMode: boolean;
  setReadingMode: (mode: boolean) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  onLogout: () => void;
  onStartFullGuide?: () => void;
  onStartMiniGuide?: (category: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  ttsEnabled,
  setTtsEnabled,
  fontSizeScale,
  setFontSizeScale,
  highContrast,
  setHighContrast,
  readingMode,
  setReadingMode,
  theme,
  setTheme,
  onLogout,
  onStartFullGuide,
  onStartMiniGuide
}) => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('quantum_openai_key') || '');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('');

  useEffect(() => {
    // Get TTS voices
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleSaveApiKey = () => {
    localStorage.setItem('quantum_openai_key', apiKey);
    alert('Clave API guardada localmente en tu navegador.');
  };

  const handleResetDb = async () => {
    if (confirm('¿Estás seguro de que deseas limpiar las estadísticas y logros de estudio? Esto restablecerá los valores de la base de datos a sus valores iniciales.')) {
      // Clear localStorage study times and reload
      localStorage.removeItem('quantum_study_seconds');
      window.location.reload();
    }
  };

  return (
    <div className="settings-container flex-1 h-full overflow-y-auto bg-bg-primary p-6 space-y-6 select-none">
      {/* Header */}
      <div className="pb-4 border-b border-border-custom flex items-center gap-2.5">
        <Settings className="w-6 h-6 text-tech-purple" />
        <div>
          <h2 className="font-bold text-sm uppercase tracking-wider text-text-primary">Configuración de Plataforma</h2>
          <p className="text-[11px] text-text-secondary">
            Configura accesibilidad, controles de voz y credenciales de inteligencia artificial
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Column: Accessibility */}
        <div className="space-y-6">
          {/* Section 1: Accessibility */}
          <div data-tour="settings-visual" className="p-5 rounded-2xl bg-white dark:bg-panel border border-border-custom space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-custom pb-3">
              <Eye className="w-4 h-4 text-tech-purple" />
              <h3 className="font-bold text-xs uppercase tracking-wider">Accesibilidad Visual</h3>
            </div>

            {/* Font Scaler */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-text-secondary">
                <span className="flex items-center gap-1.5"><ZoomIn className="w-3.5 h-3.5" /> Escala de Fuentes (Interfaz)</span>
                <span className="font-mono text-text-primary font-bold">{fontSizeScale}%</span>
              </div>
              <input
                type="range"
                min="80"
                max="140"
                step="10"
                value={fontSizeScale}
                onChange={e => setFontSizeScale(Number(e.target.value))}
                className="w-full h-1.5 bg-[#EEEAF7] dark:bg-panel-secondary rounded-lg appearance-none cursor-pointer accent-tech-purple"
              />
            </div>

            {/* Toggle Switch Contrast */}
            <div className="flex items-center justify-between text-xs pt-2">
              <span className="flex items-center gap-1.5 font-medium"><Sun className="w-3.5 h-3.5 text-tech-purple" /> Alto Contraste</span>
              <button
                onClick={() => setHighContrast(!highContrast)}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                  highContrast ? 'bg-tech-purple' : 'bg-[#E3E0EB] dark:bg-panel-secondary'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                    highContrast ? 'transform translate-x-5' : ''
                  }`}
                />
              </button>
            </div>

            {/* Reading Mode Switch */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">Modo Lectura (Sin Distracciones)</span>
              <button
                onClick={() => setReadingMode(!readingMode)}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                  readingMode ? 'bg-tech-purple' : 'bg-[#E3E0EB] dark:bg-panel-secondary'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                    readingMode ? 'transform translate-x-5' : ''
                  }`}
                />
              </button>
            </div>

            {/* Theme Selector */}
            <div className="flex items-center justify-between text-xs pt-3 border-t border-border-custom">
              <span className="flex items-center gap-1.5 font-medium">Tema Visual</span>
              <div className="flex items-center bg-[#F3F1F8] dark:bg-panel-secondary border border-border-custom rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    theme === 'light'
                      ? 'bg-white dark:bg-panel text-text-primary shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  Claro
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    theme === 'dark'
                      ? 'bg-white dark:bg-panel text-text-primary shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  Oscuro
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Speech Synthesis */}
          <div data-tour="settings-tts" className="p-5 rounded-2xl bg-white dark:bg-panel border border-border-custom space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-custom pb-3">
              <Volume2 className="w-4 h-4 text-tech-purple" />
              <h3 className="font-bold text-xs uppercase tracking-wider">Sintetizador de Voz (TTS)</h3>
            </div>

            {/* Enable TTS */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">Activar Respuesta Verbal Automática</span>
              <button
                onClick={() => setTtsEnabled(!ttsEnabled)}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                  ttsEnabled ? 'bg-tech-purple' : 'bg-[#E3E0EB] dark:bg-panel-secondary'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                    ttsEnabled ? 'transform translate-x-5' : ''
                  }`}
                />
              </button>
            </div>

            {/* Speech Selection */}
            {voices.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider block">Selector de Voz</label>
                <select
                  value={selectedVoice}
                  onChange={e => setSelectedVoice(e.target.value)}
                  className="w-full bg-[#F8F7FC] dark:bg-panel-secondary border border-border-custom text-xs text-text-primary rounded-lg p-2 outline-none focus:border-tech-purple shadow-xs"
                >
                  {voices.map((v, i) => (
                    <option key={i} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Onboarding Help, AI Config & Danger Zone */}
        <div className="space-y-6">
          {/* Section: Cómo usar Quantum Nova */}
          <div data-tour="settings-guide" className="p-5 rounded-2xl bg-white dark:bg-panel border border-border-custom space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-custom pb-3">
              <Compass className="w-4 h-4 text-tech-purple" />
              <h3 className="font-bold text-xs uppercase tracking-wider">Cómo usar Quantum Nova</h3>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-tech-purple/10 to-ai-blue/10 border border-tech-purple/25 space-y-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-tech-purple" />
                <h4 className="font-bold text-xs text-text-primary">Guía de Quantum Nova</h4>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Aprende cómo funciona Quantum Nova y descubre las principales herramientas de la plataforma.
              </p>
              <button
                type="button"
                onClick={onStartFullGuide}
                className="px-4 py-2 bg-gradient-to-r from-[#5865F2] to-[#A947E8] hover:opacity-95 text-white text-xs font-semibold rounded-xl transition-all shadow-xs active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Iniciar guía</span>
              </button>
            </div>

            {/* Accesos a mini-guías específicas */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
                Guías específicas
              </span>

              <div className="grid grid-cols-1 gap-2">
                <div className="p-3 rounded-xl bg-[#F8F7FC] dark:bg-panel-secondary border border-border-custom flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-7 h-7 rounded-lg bg-tech-purple/10 text-tech-purple flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-text-primary truncate">Mis Notas</div>
                      <div className="text-[11px] text-text-secondary truncate">Aprende a crear y organizar tus apuntes.</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onStartMiniGuide?.('notes')}
                    className="px-2.5 py-1 text-[11px] font-semibold text-tech-purple hover:bg-tech-purple/10 border border-tech-purple/30 rounded-lg transition-colors shrink-0 cursor-pointer"
                  >
                    Ver guía
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-[#F8F7FC] dark:bg-panel-secondary border border-border-custom flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-7 h-7 rounded-lg bg-tech-purple/10 text-tech-purple flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-text-primary truncate">Quantum Tutor IA</div>
                      <div className="text-[11px] text-text-secondary truncate">Aprende cómo utilizar el asistente de IA y generar cuestionarios.</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onStartMiniGuide?.('chat')}
                    className="px-2.5 py-1 text-[11px] font-semibold text-tech-purple hover:bg-tech-purple/10 border border-tech-purple/30 rounded-lg transition-colors shrink-0 cursor-pointer"
                  >
                    Ver guía
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-[#F8F7FC] dark:bg-panel-secondary border border-border-custom flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-7 h-7 rounded-lg bg-tech-purple/10 text-tech-purple flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-text-primary truncate">Copiloto Contextual</div>
                      <div className="text-[11px] text-text-secondary truncate">Descubre cómo el copiloto analiza tus notas y sugiere conexiones.</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onStartMiniGuide?.('copilot')}
                    className="px-2.5 py-1 text-[11px] font-semibold text-tech-purple hover:bg-tech-purple/10 border border-tech-purple/30 rounded-lg transition-colors shrink-0 cursor-pointer"
                  >
                    Ver guía
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-[#F8F7FC] dark:bg-panel-secondary border border-border-custom flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-7 h-7 rounded-lg bg-tech-purple/10 text-tech-purple flex items-center justify-center shrink-0">
                      <BrainCircuit className="w-3.5 h-3.5" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-text-primary truncate">Mapa Mental</div>
                      <div className="text-[11px] text-text-secondary truncate">Visualiza tus notas y conceptos en un grafo interactivo.</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onStartMiniGuide?.('map')}
                    className="px-2.5 py-1 text-[11px] font-semibold text-tech-purple hover:bg-tech-purple/10 border border-tech-purple/30 rounded-lg transition-colors shrink-0 cursor-pointer"
                  >
                    Ver guía
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-[#F8F7FC] dark:bg-panel-secondary border border-border-custom flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-7 h-7 rounded-lg bg-tech-purple/10 text-tech-purple flex items-center justify-center shrink-0">
                      <GraduationCap className="w-3.5 h-3.5" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-text-primary truncate">Aulas y Evaluaciones</div>
                      <div className="text-[11px] text-text-secondary truncate">Inscripción por código, material oficial y exámenes del curso.</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onStartMiniGuide?.('communities')}
                    className="px-2.5 py-1 text-[11px] font-semibold text-tech-purple hover:bg-tech-purple/10 border border-tech-purple/30 rounded-lg transition-colors shrink-0 cursor-pointer"
                  >
                    Ver guía
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-[#F8F7FC] dark:bg-panel-secondary border border-border-custom flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-7 h-7 rounded-lg bg-tech-purple/10 text-tech-purple flex items-center justify-center shrink-0">
                      <Library className="w-3.5 h-3.5" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-text-primary truncate">Cursos y Biblioteca</div>
                      <div className="text-[11px] text-text-secondary truncate">Rutas de estudio, avance porcentual y temas sugeridos por IA.</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onStartMiniGuide?.('courses')}
                    className="px-2.5 py-1 text-[11px] font-semibold text-tech-purple hover:bg-tech-purple/10 border border-tech-purple/30 rounded-lg transition-colors shrink-0 cursor-pointer"
                  >
                    Ver guía
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: AI Configuration */}
          <div className="p-5 rounded-2xl bg-white dark:bg-panel border border-border-custom space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-custom pb-3">
              <Key className="w-4 h-4 text-tech-purple" />
              <h3 className="font-bold text-xs uppercase tracking-wider">Credenciales de IA</h3>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              De forma predeterminada, la plataforma utiliza un motor de simulación RAG local ultrarrápido. Si deseas conectar Quantum con el motor completo GPT-4o-mini, introduce tu clave OpenAI a continuación.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider block">OpenAI API Key</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="flex-1 bg-[#F8F7FC] dark:bg-panel-secondary border border-border-custom text-xs text-text-primary rounded-lg p-2 outline-none focus:border-tech-purple shadow-xs"
                />
                <button
                  onClick={handleSaveApiKey}
                  className="px-4 py-2 bg-tech-purple hover:bg-tech-purple/90 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer shrink-0 shadow-xs"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: System Actions (Danger Zone) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-panel border border-border-custom space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-custom pb-3">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-rose-600 dark:text-rose-400">Acciones de Sistema</h3>
            </div>

            <div className="flex justify-between items-center text-xs">
              <div className="space-y-0.5">
                <span className="font-semibold block text-text-primary">Reestablecer Progreso</span>
                <span className="text-[11px] text-text-secondary">Borra estadísticas y desbloqueos diarios.</span>
              </div>
              <button
                onClick={handleResetDb}
                className="px-3.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Limpiar Datos
              </button>
            </div>

            <div className="flex justify-between items-center text-xs pt-3 border-t border-border-custom">
              <div className="space-y-0.5">
                <span className="font-semibold block text-amber-700 dark:text-amber-400">Cerrar Sesión</span>
                <span className="text-[11px] text-text-secondary">Salir de tu cuenta de QuantumNova.</span>
              </div>
              <button
                onClick={onLogout}
                className="px-3.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
