import React from 'react';
import { Award, CheckCircle2, Circle, TrendingUp, BookOpen, Clock, HelpCircle, Flame } from 'lucide-react';
import type { DashboardData } from '../types';

interface ProgressViewProps {
  data: DashboardData | null;
  isLoading: boolean;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ data, isLoading }) => {
  const stats = data || {
    weeklyStats: [],
    achievements: [],
    totalNotes: 0,
    totalStudyMinutes: 0
  };

  const unlockedCount = stats.achievements.filter(a => a.unlocked === 1).length;
  
  // Weekly averages
  const avgStudy = stats.weeklyStats.length > 0 
    ? Math.round(stats.weeklyStats.reduce((sum, curr) => sum + curr.study_minutes, 0) / stats.weeklyStats.length)
    : 0;

  const avgQueries = stats.weeklyStats.length > 0
    ? (stats.weeklyStats.reduce((sum, curr) => sum + curr.queries_asked, 0) / stats.weeklyStats.length).toFixed(1)
    : '0';

  const dailyGoals = [
    { id: 1, title: 'Estudiar 30 minutos', completed: stats.totalStudyMinutes >= 30 },
    { id: 2, title: 'Crear una nota conectada', completed: stats.totalNotes >= 1 },
    { id: 3, title: 'Realizar una pregunta a Quantum', completed: true },
    { id: 4, title: 'Completar 1 cuestionario', completed: unlockedCount >= 1 }
  ];

  if (isLoading) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-tech-purple border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-text-secondary">Cargando tus progresos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto bg-bg-primary p-6 space-y-6 select-none">
      {/* Header */}
      <div className="pb-4 border-b border-border-custom flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Award className="w-6 h-6 text-tech-purple" />
          <div>
            <h2 className="font-bold text-sm uppercase tracking-wider text-text-primary">Progreso y Logros Académicos</h2>
            <p className="text-[11px] text-text-secondary">
              Monitorea tus metas de estudio diarias, tu racha de aprendizaje e insignias
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Stats Cards & Goals */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Daily Goals Panel */}
          <div className="p-5 rounded-2xl bg-white dark:bg-panel border border-border-custom space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-custom pb-3">
              <CheckCircle2 className="w-4 h-4 text-tech-purple" />
              <h3 className="font-bold text-xs uppercase tracking-wider">Objetivos Diarios de Aprendizaje</h3>
            </div>

            <div className="space-y-2.5">
              {dailyGoals.map(goal => (
                <div
                  key={goal.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#F8F7FC] dark:bg-panel-secondary border border-border-custom text-xs text-text-secondary"
                >
                  <span className={goal.completed ? 'line-through opacity-60' : 'text-text-primary font-medium'}>
                    {goal.title}
                  </span>
                  {goal.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-text-secondary/60 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Academic Stats Summary */}
          <div className="p-5 rounded-2xl bg-white dark:bg-panel border border-border-custom space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-text-primary border-b border-border-custom pb-3">
              <TrendingUp className="w-4 h-4 text-tech-purple" />
              <h3 className="font-bold text-xs uppercase tracking-wider">Métricas de Rendimiento</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#F8F7FC] dark:bg-panel-secondary border border-border-custom text-center space-y-1">
                <Clock className="w-5 h-5 text-tech-purple mx-auto" />
                <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-semibold">Promedio Diario</span>
                <span className="text-xl font-bold font-mono text-text-primary">{avgStudy} min</span>
              </div>
              <div className="p-4 rounded-xl bg-[#F8F7FC] dark:bg-panel-secondary border border-border-custom text-center space-y-1">
                <BookOpen className="w-5 h-5 text-[#5865F2] mx-auto" />
                <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-semibold">Notas Creadas</span>
                <span className="text-xl font-bold font-mono text-text-primary">{stats.totalNotes}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#F8F7FC] dark:bg-panel-secondary border border-border-custom text-center space-y-1">
                <HelpCircle className="w-5 h-5 text-tech-purple mx-auto" />
                <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-semibold">Consultas / Día</span>
                <span className="text-xl font-bold font-mono text-text-primary">{avgQueries}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Achievements Grid */}
        <div className="p-5 rounded-2xl bg-white dark:bg-panel border border-border-custom space-y-4 shadow-xs">
          <div className="flex items-center justify-between text-text-primary border-b border-border-custom pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-tech-purple" />
              <h3 className="font-bold text-xs uppercase tracking-wider">Medallas Logradas</h3>
            </div>
            <span className="text-[10px] font-mono bg-tech-purple/10 text-tech-purple border border-tech-purple/20 px-2.5 py-0.5 rounded-full font-bold">
              {unlockedCount} / {stats.achievements.length}
            </span>
          </div>

          {/* Racha Card */}
          <div className="p-4 rounded-xl bg-[#F8F7FC] dark:bg-panel-secondary border border-border-custom flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-semibold">Racha de Estudio</span>
              <span className="text-sm font-bold text-text-primary">3 Días Consecutivos</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Flame className="w-5 h-5 fill-current" />
            </div>
          </div>

          <div className="space-y-3">
            {stats.achievements.map(ach => {
              const isUnlocked = ach.unlocked === 1;

              return (
                <div
                  key={ach.id}
                  className={`p-3.5 rounded-xl border flex gap-3 transition-all ${
                    isUnlocked
                      ? 'bg-white dark:bg-panel border-tech-purple/40 shadow-xs'
                      : 'bg-[#F8F7FC] dark:bg-panel/40 border-border-custom opacity-60'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isUnlocked ? 'bg-tech-purple/10 text-tech-purple' : 'bg-border-custom/25 text-text-secondary'
                    }`}
                  >
                    <Award className="w-5 h-5" />
                  </div>

                  <div className="space-y-0.5 overflow-hidden">
                    <h4 className={`text-xs font-bold truncate ${isUnlocked ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {ach.title}
                    </h4>
                    <p className="text-[10px] text-text-secondary leading-normal">
                      {ach.description}
                    </p>
                    {isUnlocked && ach.unlocked_at && (
                      <span className="text-[9px] text-tech-purple font-mono block pt-0.5 font-semibold">
                        Logrado el {ach.unlocked_at.split('T')[0]}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
