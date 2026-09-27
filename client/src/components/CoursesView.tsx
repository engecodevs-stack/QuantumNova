import React, { useEffect, useState } from 'react';
import { GraduationCap, Clock, Play, Plus } from 'lucide-react';
import type { Course } from '../types';
import { getApiUrl } from '../config/api';

interface CoursesViewProps {
  onStartCourseStudy: (course: Course) => void;
  studyActive: boolean;
  activeCourseId: string | null;
}

export const CoursesView: React.FC<CoursesViewProps> = ({
  onStartCourseStudy,
  studyActive,
  activeCourseId
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(getApiUrl('/courses'));
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleProgressIncrement = async (courseId: string, currentProgress: number) => {
    const newProgress = Math.min(currentProgress + 5, 100);
    try {
      const response = await fetch(getApiUrl(`/courses/${courseId}/progress`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ progress: newProgress })
      });

      if (response.ok) {
        setCourses(prev =>
          prev.map(c => (c.id === courseId ? { ...c, progress: newProgress } : c))
        );

        // If completed 100%, check if we can unlock achievement
        if (newProgress === 100) {
          fetch(getApiUrl('/achievements/ach-2/unlock'), { method: 'POST' });
        }
      }
    } catch (err) {
      console.error('Failed to update course progress:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-tech-purple border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-text-secondary">Cargando tus cursos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="courses-container flex-1 h-full overflow-y-auto bg-bg-primary p-6 space-y-6 select-none">
      {/* Header */}
      <div className="pb-4 border-b border-border-custom flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <GraduationCap className="w-6 h-6 text-tech-purple" />
          <div>
            <h2 className="font-bold text-xs uppercase tracking-wider text-text-primary">Mis Cursos Académicos</h2>
            <p className="text-[11px] text-text-secondary">
              Gestiona tus materias y avanza en tu ruta de aprendizaje
            </p>
          </div>
        </div>

        <button className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-panel hover:bg-bg-secondary border border-border-custom text-text-primary text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs">
          <Plus className="w-4 h-4 text-tech-purple" /> Agregar Materia
        </button>
      </div>

      {/* Grid */}
      <div data-tour="courses-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => {
          const isStudyingThis = studyActive && activeCourseId === course.id;

          return (
            <div
              key={course.id}
              className={`p-5 rounded-2xl bg-white dark:bg-panel border transition-all duration-200 flex flex-col justify-between h-[230px] relative overflow-hidden group shadow-xs ${
                isStudyingThis
                  ? 'border-tech-purple shadow-md ring-1 ring-tech-purple/30'
                  : 'border-border-custom hover:border-tech-purple/40 hover:shadow-sm'
              }`}
            >
              {/* Category tag */}
              <div className="flex justify-between items-start">
                <span className="text-[10px] bg-bg-secondary text-text-secondary border border-border-custom px-2.5 py-0.5 rounded-md font-mono font-semibold uppercase">
                  {course.category}
                </span>

                {isStudyingThis && (
                  <span className="text-[10px] bg-tech-purple/10 text-tech-purple border border-tech-purple/30 px-2.5 py-0.5 rounded-md font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Estudiando ahora
                  </span>
                )}
              </div>

              {/* Title & Desc */}
              <div className="my-3 space-y-1">
                <h3 className="font-bold text-text-primary text-sm group-hover:text-tech-purple transition-colors line-clamp-1">
                  {course.title}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                  {course.description}
                </p>
              </div>

              {/* Progress Bar & Actions */}
              <div className="space-y-3 pt-2.5 border-t border-border-custom">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-text-secondary font-semibold">
                    <span>Progreso</span>
                    <span className="text-text-primary font-bold">{course.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#EEEAF7] dark:bg-panel-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-tech-purple to-[#5865F2] transition-all duration-500"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onStartCourseStudy(course)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                      isStudyingThis
                        ? 'bg-rose-50 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20'
                        : 'bg-tech-purple text-white hover:bg-tech-purple/90 border border-tech-purple'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    {isStudyingThis ? 'Pausar Sesión' : 'Estudiar Materia'}
                  </button>

                  {course.progress < 100 && (
                    <button
                      onClick={() => handleProgressIncrement(course.id, course.progress)}
                      className="px-3 py-1.5 bg-bg-secondary hover:bg-bg-secondary/80 border border-border-custom text-text-primary rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                      title="Registrar lección completada"
                    >
                      +5%
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
