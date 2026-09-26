import React from 'react';
import {
  Clock,
  FileText,
  MessageSquare,
  Award,
  Play,
  Square,
  Sparkles,
  CheckCircle,
  Lock,
  ChevronRight
} from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import type { DashboardData } from '../types';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardViewProps {
  data: DashboardData | null;
  isLoading: boolean;
  studyActive: boolean;
  onToggleStudy: () => void;
  studyTimeStr: string;
  setView: (view: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  isLoading,
  studyActive,
  onToggleStudy,
  studyTimeStr,
  setView
}) => {
  // Setup default mock values in case data isn't loaded
  const stats = data || {
    weeklyStats: [],
    achievements: [],
    totalNotes: 0,
    totalStudyMinutes: 0
  };

  // Prepare chart data
  const chartLabels = stats.weeklyStats.map(s => {
    const parts = s.date.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`; // DD/MM
    }
    return s.date;
  });

  const minutesData = stats.weeklyStats.map(s => s.study_minutes);
  const queriesData = stats.weeklyStats.map(s => s.queries_asked);

  const chartData = {
    labels: chartLabels.length > 0 ? chartLabels : ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'],
    datasets: [
      {
        fill: true,
        label: 'Minutos de estudio',
        data: minutesData.length > 0 ? minutesData : [30, 45, 15, 60, 40, 25, 45],
        borderColor: '#A947E8',
        backgroundColor: 'rgba(169, 71, 232, 0.08)',
        borderWidth: 2,
        tension: 0.35,
        pointBackgroundColor: '#A947E8',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const queriesChartData = {
    labels: chartLabels.length > 0 ? chartLabels : ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'],
    datasets: [
      {
        label: 'Consultas al Tutor IA',
        data: queriesData.length > 0 ? queriesData : [2, 5, 1, 8, 4, 2, 6],
        backgroundColor: '#5865F2',
        borderRadius: 6,
        borderWidth: 0,
        maxBarThickness: 16
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#18181F',
        titleColor: '#FFFFFF',
        bodyColor: '#A1A1B2',
        borderColor: '#E3E0EB',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        cornerRadius: 8,
        bodyFont: {
          family: 'Inter, system-ui'
        },
        titleFont: {
          family: 'Inter, system-ui',
          weight: 600 as any
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          color: '#8E8D9A',
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(227, 224, 235, 0.6)',
          drawBorder: false
        },
        ticks: {
          color: '#8E8D9A',
          font: {
            size: 11
          },
          precision: 0
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-tech-purple border-t-transparent animate-spin" />
          <span className="text-text-secondary text-sm font-medium">Cargando Dashboard...</span>
        </div>
      </div>
    );
  }

  const unlockedCount = stats.achievements.filter(a => a.unlocked === 1).length;

  return (
    <div className="flex-1 h-full overflow-y-auto bg-bg-primary p-6 space-y-6">
      {/* Welcome & Study Timer Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-panel border border-border-custom flex flex-col justify-between relative overflow-hidden shadow-xs">
          <div className="space-y-2 relative z-10">
            <span className="text-xs text-tech-purple font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Mente Digital Activa
            </span>
            <h1 className="text-2xl lg:text-3xl font-bold text-text-primary tracking-tight leading-none mt-1">
              Bienvenido a QuantumNova
            </h1>
            <p className="text-xs text-text-secondary max-w-lg leading-relaxed">
              Tu entorno de aprendizaje inteligente y segunda mente. Organiza tus conocimientos, interactúa con el tutor y visualiza tus conexiones conceptuales.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={() => setView('notes')}
              className="px-4 py-2 bg-white dark:bg-panel-secondary hover:bg-bg-secondary text-text-primary rounded-xl text-xs font-semibold border border-border-custom transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              Comenzar a escribir <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('chat')}
              className="px-4 py-2 bg-tech-purple hover:bg-tech-purple/90 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              Preguntar a Quantum
            </button>
          </div>
        </div>

        {/* Study Timer Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-panel border border-border-custom flex flex-col justify-between items-center text-center relative shadow-xs">
          <span className="text-xs text-text-secondary font-semibold">Sesión de Concentración</span>
          
          <div className="my-3 space-y-1">
            <div className="text-3xl font-bold font-mono tracking-widest text-text-primary">
              {studyActive ? studyTimeStr : '00:00:00'}
            </div>
            <p className="text-[11px] text-text-secondary">
              {studyActive ? 'Tiempo acumulado hoy' : 'Temporizador inactivo'}
            </p>
          </div>

          <button
            onClick={onToggleStudy}
            className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
              studyActive
                ? 'bg-rose-50 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20'
                : 'bg-tech-purple text-white hover:bg-tech-purple/90 border border-tech-purple'
            }`}
          >
            {studyActive ? (
              <>
                <Square className="w-4 h-4 fill-current" /> Detener Sesión
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> Iniciar Sesión de Estudio
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-xl bg-white dark:bg-panel border border-border-custom flex items-center gap-4 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-tech-purple/10 flex items-center justify-center text-tech-purple shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-text-primary">
              {stats.totalStudyMinutes}m
            </div>
            <p className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
              Tiempo de Estudio
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-xl bg-white dark:bg-panel border border-border-custom flex items-center gap-4 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-[#5865F2]/10 flex items-center justify-center text-[#5865F2] shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-text-primary">
              {stats.totalNotes}
            </div>
            <p className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
              Notas Conectadas
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-xl bg-white dark:bg-panel border border-border-custom flex items-center gap-4 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-tech-purple/10 flex items-center justify-center text-tech-purple shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-text-primary">
              {stats.weeklyStats.reduce((acc, curr) => acc + curr.queries_asked, 0)}
            </div>
            <p className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
              Consultas IA
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-xl bg-white dark:bg-panel border border-border-custom flex items-center gap-4 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-text-primary">
              {unlockedCount}/{stats.achievements.length}
            </div>
            <p className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
              Logros Desbloqueados
            </p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-panel border border-border-custom flex flex-col justify-between h-80 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border-custom">
            <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              Actividad Semanal de Estudio
            </h3>
            <span className="text-[10px] bg-tech-purple/10 text-tech-purple border border-tech-purple/20 px-2 py-0.5 rounded font-semibold">Rendimiento</span>
          </div>
          <div className="flex-1 relative mt-4 h-56">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-panel border border-border-custom flex flex-col justify-between h-80 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border-custom">
            <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              Uso del Tutor Quantum
            </h3>
            <span className="text-[10px] bg-tech-purple/10 text-tech-purple border border-tech-purple/20 px-2 py-0.5 rounded font-semibold">Interacciones</span>
          </div>
          <div className="flex-1 relative mt-4 h-56">
            <Bar data={queriesChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="p-5 rounded-2xl bg-white dark:bg-panel border border-border-custom space-y-4 shadow-xs">
        <div className="pb-3 border-b border-border-custom flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-tech-purple" />
            <h3 className="font-semibold text-sm text-text-primary">Medallas y Logros de Conocimiento</h3>
          </div>
          <span className="text-xs text-text-secondary font-medium">
            Sigue estudiando para desbloquear más insignias
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.achievements.map(ach => {
            const isUnlocked = ach.unlocked === 1;

            return (
              <div
                key={ach.id}
                className={`p-4 rounded-xl border flex gap-3 transition-all relative overflow-hidden ${
                  isUnlocked
                    ? 'bg-white dark:bg-panel border-tech-purple/40 shadow-xs'
                    : 'bg-[#F8F7FC] dark:bg-panel/40 border-border-custom opacity-70'
                }`}
              >
                {isUnlocked && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-tech-purple rounded-bl-xl" />
                )}
                
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    isUnlocked ? 'bg-tech-purple/10 text-tech-purple' : 'bg-border-custom/25 text-text-secondary'
                  }`}
                >
                  {isUnlocked ? <CheckCircle className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>

                <div className="space-y-1">
                  <h4 className={`text-xs font-bold ${isUnlocked ? 'text-text-primary' : 'text-text-secondary'}`}>
                    {ach.title}
                  </h4>
                  <p className="text-[10px] text-text-secondary leading-normal">
                    {ach.description}
                  </p>
                  {isUnlocked && ach.unlocked_at && (
                    <span className="text-[9px] text-tech-purple font-mono block mt-1 font-semibold">
                      Completado {ach.unlocked_at.split('T')[0]}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
