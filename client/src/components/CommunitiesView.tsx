import React, { useState, useEffect } from 'react';
import {
  Presentation,
  ShieldCheck,
  Lock,
  Plus,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  FileText,
  Download,
  GraduationCap,
  Copy,
  Check,
  Clock,
  Award,
  BookOpen,
  FileCheck,
  Trash2,
  X
} from 'lucide-react';
import type { Community, CommunityExam, User, StudentSubmission } from '../types';

interface CommunitiesViewProps {
  currentUser: User | null;
  theme?: 'dark' | 'light';
  onNavigateToNotes?: () => void;
}

type StudentTab = 'materials' | 'exams' | 'submissions';

export const CommunitiesView: React.FC<CommunitiesViewProps> = ({
  currentUser,
  onNavigateToNotes
}) => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [activeTab, setActiveTab] = useState<StudentTab>('materials');
  const [joinCode, setJoinCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Active exam taking state
  const [activeExam, setActiveExam] = useState<CommunityExam | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [examScore, setExamScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [examFinished, setExamFinished] = useState(false);
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchStudentCommunities = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch('http://localhost:5000/api/student/communities', {
        headers: {
          'x-user-id': currentUser.id
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCommunities(data);
        if (data.length > 0) {
          const currentId = selectedCommunity?._id || selectedCommunity?.id;
          const found = data.find((c: Community) => (c._id || c.id) === currentId);
          setSelectedCommunity(found || data[0]);
        } else {
          setSelectedCommunity(null);
        }
      }
    } catch (err) {
      console.error('Error loading student communities:', err);
    }
  };

  useEffect(() => {
    fetchStudentCommunities();
  }, [currentUser]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleJoinCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      showToast('Ingresa el código proporcionado por tu docente');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/student/communities/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || ''
        },
        body: JSON.stringify({ code: joinCode.trim().toUpperCase() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setJoinCode('');
        showToast(`Te has inscrito correctamente en: ${data.community.name}`);
        await fetchStudentCommunities();
        setSelectedCommunity(data.community);
      } else {
        showToast(data.error || 'Código de asignatura no encontrado');
      }
    } catch (err) {
      console.error(err);
      showToast('Error al inscribir la asignatura');
    }
  };

  const handleStartExam = (exam: CommunityExam) => {
    setActiveExam(exam);
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setExamScore(0);
    setUserAnswers([]);
    setExamFinished(false);
  };

  const handleSubmitExamAnswer = () => {
    if (selectedOption === null || !activeExam) return;
    const currentQ = activeExam.questions[currentQuestionIdx];
    const isCorrect = selectedOption === currentQ.answer;

    if (isCorrect) {
      setExamScore(prev => prev + 1);
    }
    setUserAnswers(prev => [...prev, selectedOption]);
    setIsAnswerSubmitted(true);
  };

  const handleNextExamQuestion = async () => {
    if (!activeExam) return;

    if (currentQuestionIdx + 1 < activeExam.questions.length) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      // Exam finished: submit to backend
      setIsSubmittingExam(true);
      try {
        const commId = selectedCommunity?._id || selectedCommunity?.id;
        await fetch(`http://localhost:5000/api/student/communities/${commId}/submit-exam`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser?.id || ''
          },
          body: JSON.stringify({
            examId: activeExam._id || activeExam.id,
            examTitle: activeExam.title,
            score: examScore,
            totalQuestions: activeExam.questions.length,
            answers: userAnswers
          })
        });
        setExamFinished(true);
        showToast('Evaluación enviada y archivada en el portal del docente');
        await fetchStudentCommunities();
      } catch (err) {
        console.error('Error submitting exam result:', err);
        setExamFinished(true);
        showToast('Evaluación completada');
      } finally {
        setIsSubmittingExam(false);
      }
    }
  };

  // Student: Leave an enrolled community
  const handleLeaveCommunity = async (commId?: string, commName?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!commId) return;
    const name = commName || 'esta asignatura';
    if (!confirm(`¿Estás seguro de que deseas darte de baja de la asignatura "${name}"?`)) {
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/student/communities/${commId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || ''
        }
      });
      if (res.ok) {
        showToast(`Te has dado de baja de "${commName}"`);
        setCommunities(prev => prev.filter(c => (c._id || c.id) !== commId));
        const currentSelId = selectedCommunity?._id || selectedCommunity?.id;
        if (currentSelId === commId) {
          const remaining = communities.filter(c => (c._id || c.id) !== commId);
          setSelectedCommunity(remaining.length > 0 ? remaining[0] : null);
          setActiveExam(null);
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Error al darse de baja de la asignatura');
      }
    } catch (err) {
      console.error('Error leaving community:', err);
      alert('Error de conexión al procesar la baja de la asignatura');
    }
  };

  // Filter student's own submissions
  const mySubmissions: StudentSubmission[] = (selectedCommunity?.submissions || []).filter(sub =>
    sub.studentId === currentUser?.id || (currentUser?.email && sub.studentEmail === currentUser.email)
  );

  return (
    <div className="communities-container w-full h-full flex flex-col bg-bg-primary text-text-primary p-6 md:p-8 space-y-6 overflow-y-auto select-none">
      {/* Institutional Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-border-custom shrink-0">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tech-purple/10 border border-tech-purple/20">
            <GraduationCap className="w-3.5 h-3.5 text-tech-purple shrink-0" />
            <span className="text-xs font-bold text-tech-purple tracking-wide">
              Portal del Estudiante
            </span>
            <span className="text-[11px] text-text-secondary">
              • Sistema Universitario • Entorno de Aprendizaje
            </span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Mis Asignaturas y Aulas Virtuales
          </h1>
          <p className="text-xs text-text-secondary">
            Accede al material oficial de tus docentes, consulta diapositivas de clase y presenta evaluaciones académicas.
          </p>
        </div>

        {/* Enroll by Code Box */}
        <form data-tour="communities-join" onSubmit={handleJoinCommunity} className="flex items-center gap-2 bg-white dark:bg-panel p-1.5 rounded-xl border border-border-custom shadow-xs shrink-0">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Código de clase (ej. QN-FIS101)"
            className="px-3 py-2 rounded-lg bg-bg-secondary border border-border-custom text-xs text-text-primary placeholder:text-text-secondary font-mono uppercase focus:outline-none focus:border-tech-purple w-52 transition-colors"
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-lg bg-tech-purple hover:bg-tech-purple-hover text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Inscribir Asignatura
          </button>
        </form>
      </div>

      {/* Enrolled Courses Selector Tabs */}
      {communities.length > 0 && (
        <div data-tour="communities-list" className="space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
              Asignaturas Inscritas ({communities.length})
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {communities.map(comm => {
              const cid = comm._id || comm.id;
              const selId = selectedCommunity?._id || selectedCommunity?.id;
              const isSelected = selId === cid;
              return (
                <div
                  key={cid}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 shrink-0 border ${
                    isSelected
                      ? 'bg-tech-purple/10 border-tech-purple text-tech-purple shadow-xs font-bold'
                      : 'bg-white dark:bg-panel border-border-custom text-text-secondary hover:text-text-primary hover:border-border-custom/80'
                  }`}
                >
                  <button
                    onClick={() => {
                      setSelectedCommunity(comm);
                      setActiveExam(null);
                    }}
                    className="flex items-center gap-2 cursor-pointer outline-none"
                  >
                    <GraduationCap className={`w-4 h-4 ${isSelected ? 'text-tech-purple' : 'text-text-secondary'}`} />
                    <span>{comm.name}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      isSelected ? 'bg-tech-purple/20 text-tech-purple border-tech-purple/30' : 'bg-bg-secondary text-text-secondary border-border-custom'
                    }`}>
                      {comm.code}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleLeaveCommunity(cid, comm.name, e)}
                    className="p-1 rounded-md text-text-secondary hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors ml-1 cursor-pointer"
                    title="Darse de baja de esta asignatura"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ACTIVE EXAM MODE MODAL / SCREEN */}
      {activeExam && (
        <div className="p-6 rounded-xl bg-white dark:bg-panel border border-border-custom shadow-xl space-y-6">
          <div className="flex items-start justify-between pb-4 border-b border-border-custom">
            <div>
              <div className="flex items-center gap-2">
                <span className="badge-amber flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-amber-600" /> Evaluación en Progreso
                </span>
                {activeExam.lockNotesDuringExam && (
                  <span className="text-xs text-text-secondary flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-tech-purple" /> Modo seguro: notas protegidas
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-text-primary mt-2">
                {activeExam.title}
              </h2>
              {activeExam.description && (
                <p className="text-xs text-text-secondary mt-0.5">
                  {activeExam.description}
                </p>
              )}
            </div>

            {!examFinished && (
              <button
                onClick={() => {
                  if (window.confirm('¿Estás seguro de que deseas salir? El progreso no guardado de esta pregunta podría perderse.')) {
                    setActiveExam(null);
                  }
                }}
                className="text-xs text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg border border-border-custom hover:bg-bg-secondary cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Salir del Examen
              </button>
            )}
          </div>

          {!examFinished ? (
            <div className="space-y-5">
              {/* Progress & Info Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-text-secondary">
                  <span>
                    Pregunta <strong className="text-text-primary font-mono">{currentQuestionIdx + 1}</strong> de {activeExam.questions.length}
                  </span>
                  <span className="flex items-center gap-1.5 text-text-secondary">
                    <Clock className="w-3.5 h-3.5 text-text-secondary" /> Tiempo sugerido: {activeExam.durationMinutes || 20} min
                  </span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full bg-bg-secondary h-2 rounded-full overflow-hidden border border-border-custom">
                  <div
                    className="bg-tech-purple h-full transition-all duration-300 rounded-full"
                    style={{
                      width: `${((currentQuestionIdx + (isAnswerSubmitted ? 1 : 0)) / activeExam.questions.length) * 100}%`
                    }}
                  />
                </div>
              </div>

              {/* Question Card */}
              <div className="p-6 rounded-xl bg-bg-secondary/60 border border-border-custom space-y-5">
                <h3 className="text-sm font-semibold text-text-primary leading-relaxed">
                  {activeExam.questions[currentQuestionIdx].question}
                </h3>

                <div className="space-y-2.5">
                  {activeExam.questions[currentQuestionIdx].options.map((option, idx) => {
                    let btnStyle = 'bg-white dark:bg-panel border-border-custom text-text-secondary hover:border-tech-purple/40 hover:text-text-primary';
                    if (isAnswerSubmitted) {
                      if (idx === activeExam.questions[currentQuestionIdx].answer) {
                        btnStyle = 'badge-success font-semibold';
                      } else if (selectedOption === idx) {
                        btnStyle = 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400';
                      } else {
                        btnStyle = 'bg-white dark:bg-panel border-border-custom/50 text-text-secondary opacity-50';
                      }
                    } else if (selectedOption === idx) {
                      btnStyle = 'bg-tech-purple/10 border-tech-purple text-tech-purple font-semibold shadow-xs';
                    }

                    return (
                      <button
                        key={idx}
                        disabled={isAnswerSubmitted}
                        onClick={() => setSelectedOption(idx)}
                        className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center gap-3 cursor-pointer ${btnStyle}`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] font-bold shrink-0 border ${
                          selectedOption === idx
                            ? 'bg-tech-purple text-white border-tech-purple'
                            : 'bg-bg-primary text-text-secondary border-border-custom'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1 leading-normal">{option}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Card upon submission */}
                {isAnswerSubmitted && (
                  <div className="p-4 rounded-lg bg-white dark:bg-panel border border-border-custom text-xs text-text-primary space-y-1 animate-fade-in shadow-xs">
                    <strong className="text-tech-purple flex items-center gap-1.5 font-semibold">
                      <HelpCircle className="w-3.5 h-3.5" /> Explicación Académica:
                    </strong>
                    <p className="text-text-secondary leading-relaxed pl-5">
                      {activeExam.questions[currentQuestionIdx].explanation}
                    </p>
                  </div>
                )}
              </div>

              {/* Navigation Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-text-secondary">
                  Selecciona una opción y confirma para registrar tu respuesta.
                </span>
                <div className="flex gap-2">
                  {!isAnswerSubmitted ? (
                    <button
                      disabled={selectedOption === null}
                      onClick={handleSubmitExamAnswer}
                      className={`px-4 py-2 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                        selectedOption === null
                          ? 'bg-bg-secondary text-text-secondary opacity-50 cursor-not-allowed border border-border-custom'
                          : 'bg-tech-purple hover:bg-tech-purple-hover text-white shadow-xs'
                      }`}
                    >
                      Confirmar Respuesta
                    </button>
                  ) : (
                    <button
                      disabled={isSubmittingExam}
                      onClick={handleNextExamQuestion}
                      className="px-4 py-2 rounded-lg bg-tech-purple hover:bg-tech-purple-hover text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>
                        {currentQuestionIdx + 1 < activeExam.questions.length
                          ? 'Siguiente Pregunta'
                          : isSubmittingExam ? 'Enviando...' : 'Finalizar y Entregar Evaluación'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Exam Completed Summary */
            <div className="text-center py-10 space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800/40">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary">
                  ¡Evaluación Entregada con Éxito!
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Tu intento ha sido registrado de forma oficial en la plataforma del profesor para su revisión.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-bg-secondary border border-border-custom inline-block w-full">
                <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
                  Resultado Obtenido
                </span>
                <div className="text-2xl font-bold text-tech-purple font-mono mt-1">
                  {examScore} de {activeExam.questions.length} Correctas
                </div>
                <span className="text-xs text-text-secondary mt-0.5 block">
                  ({Math.round((examScore / activeExam.questions.length) * 100)}% de aciertos)
                </span>
              </div>

              <div>
                <button
                  onClick={() => {
                    setActiveExam(null);
                    setActiveTab('submissions');
                  }}
                  className="px-4 py-2 rounded-lg bg-tech-purple hover:bg-tech-purple-hover text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                >
                  Ver mis Entregas y Calificaciones
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MAIN VIEW FOR SELECTED COMMUNITY */}
      {!activeExam && selectedCommunity && (
        <div className="space-y-6 flex-1">
          {/* Community Information Banner */}
          <div className="bg-white dark:bg-panel rounded-xl border border-border-custom p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-text-primary">
                  {selectedCommunity.name}
                </h2>
                <button
                  onClick={() => handleCopyCode(selectedCommunity.code)}
                  className="px-2 py-0.5 rounded-md bg-bg-secondary hover:bg-border-custom text-text-primary font-mono text-[11px] flex items-center gap-1 border border-border-custom transition-colors cursor-pointer"
                  title="Copiar código de clase"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-text-secondary" />}
                  <span>{selectedCommunity.code}</span>
                </button>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Docente titular: <strong className="text-text-primary">{selectedCommunity.teacherName || 'Docente'}</strong>
                {selectedCommunity.description && ` • ${selectedCommunity.description}`}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onNavigateToNotes && (
                <button
                  onClick={onNavigateToNotes}
                  className="px-3.5 py-1.5 rounded-lg border border-border-custom bg-white dark:bg-panel hover:bg-bg-secondary text-text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-tech-purple" />
                  <span>Mis Notas de Estudio</span>
                </button>
              )}
              <button
                onClick={() => handleLeaveCommunity(selectedCommunity._id || selectedCommunity.id, selectedCommunity.name)}
                className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Darse de baja de esta asignatura"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Darme de baja</span>
              </button>
            </div>
          </div>

          {/* Sub-navigation Tabs */}
          <div className="bg-white dark:bg-panel rounded-xl border border-border-custom shadow-xs overflow-hidden">
            <div data-tour="communities-tabs" className="flex border-b border-border-custom px-6 pt-2 bg-bg-secondary/40 gap-1 overflow-x-auto">
              <button
                onClick={() => setActiveTab('materials')}
                className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 tab-apple transition-all cursor-pointer shrink-0 ${
                  activeTab === 'materials'
                    ? 'border-tech-purple text-text-primary bg-white dark:bg-panel font-bold'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Presentaciones y Materiales</span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full border ${
                  activeTab === 'materials' ? 'bg-tech-purple/20 text-tech-purple border-tech-purple/30 font-bold' : 'bg-bg-secondary text-text-secondary border-border-custom'
                }`}>
                  {selectedCommunity.materials?.length || 0}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('exams')}
                className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 tab-apple transition-all cursor-pointer shrink-0 ${
                  activeTab === 'exams'
                    ? 'border-tech-purple text-text-primary bg-white dark:bg-panel font-bold'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Evaluaciones del Curso</span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full border ${
                  activeTab === 'exams' ? 'bg-tech-purple/20 text-tech-purple border-tech-purple/30 font-bold' : 'bg-bg-secondary text-text-secondary border-border-custom'
                }`}>
                  {selectedCommunity.exams?.length || 0}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('submissions')}
                className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 tab-apple transition-all cursor-pointer shrink-0 ${
                  activeTab === 'submissions'
                    ? 'border-tech-purple text-text-primary bg-white dark:bg-panel font-bold'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Mis Entregas y Calificaciones</span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full border ${
                  activeTab === 'submissions' ? 'bg-tech-purple/20 text-tech-purple border-tech-purple/30 font-bold' : 'bg-bg-secondary text-text-secondary border-border-custom'
                }`}>
                  {mySubmissions.length}
                </span>
              </button>
            </div>

            {/* TAB 1: PRESENTATIONS & OFFICIAL MATERIALS */}
            {activeTab === 'materials' && (
              <div className="p-6 space-y-4 ios-tab-panel">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">
                      Presentaciones y Diapositivas de Clase
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Descarga las presentaciones oficiales compartidas por el docente para estudiar y preparar tus evaluaciones.
                    </p>
                  </div>
                </div>

                {selectedCommunity.materials && selectedCommunity.materials.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCommunity.materials.map((mat, idx) => (
                      <div
                        key={mat._id || idx}
                        className="bg-white dark:bg-panel rounded-xl border border-border-custom p-5 space-y-3 hover:border-tech-purple/40 transition-all shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="badge-purple">
                            {mat.category || 'Presentación'}
                          </span>
                          <span className="text-[11px] text-text-secondary">
                            {new Date(mat.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-text-primary">
                            {mat.title}
                          </h4>
                        </div>

                        {/* File Attachment Pill */}
                        {mat.fileName && (
                          <div className="p-2.5 rounded-lg bg-bg-secondary border border-border-custom flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Presentation className="w-4 h-4 text-tech-purple shrink-0" />
                              <span className="text-xs font-medium text-text-primary truncate">
                                {mat.fileName}
                              </span>
                              {mat.fileSize && (
                                <span className="text-[10px] text-text-secondary font-mono shrink-0">
                                  ({mat.fileSize})
                                </span>
                              )}
                            </div>

                            {(mat.fileUrl || mat.fileData) && (
                              <a
                                href={mat.fileUrl || mat.fileData}
                                download={mat.fileName}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-md bg-tech-purple hover:bg-tech-purple-hover text-white text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 shadow-xs"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Descargar</span>
                              </a>
                            )}
                          </div>
                        )}

                        {/* Content text excerpt */}
                        {mat.content && (
                          <div className="text-xs text-text-secondary bg-bg-secondary p-3 rounded-lg border border-border-custom max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                            {mat.content}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 text-center border border-border-custom rounded-xl space-y-2 bg-white dark:bg-panel shadow-xs">
                    <Presentation className="w-8 h-8 text-text-secondary mx-auto opacity-50" />
                    <h4 className="text-xs font-semibold text-text-primary">
                      No hay presentaciones disponibles
                    </h4>
                    <p className="text-xs text-text-secondary max-w-sm mx-auto">
                      El profesor aún no ha compartido diapositivas o guías en esta comunidad.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: COURSE EXAMS & EVALUATIONS */}
            {activeTab === 'exams' && (
              <div className="p-6 space-y-4 ios-tab-panel">
                <div>
                  <h3 className="text-sm font-bold text-text-primary">
                    Evaluaciones y Pruebas del Curso
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Presenta tus evaluaciones programadas con modo de examen seguro.
                  </p>
                </div>

                {selectedCommunity.exams && selectedCommunity.exams.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCommunity.exams.map((exam, idx) => {
                      const isActive = exam.status === 'activo';
                      return (
                        <div
                          key={exam._id || idx}
                          className="bg-white dark:bg-panel rounded-xl border border-border-custom p-5 space-y-4 shadow-xs hover:border-tech-purple/40 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                                isActive
                                  ? 'badge-success'
                                  : 'bg-bg-secondary text-text-secondary border-border-custom'
                              }`}
                            >
                              {isActive ? '● Examen Disponible' : 'Finalizado / No disponible'}
                            </span>
                            {exam.lockNotesDuringExam && (
                              <span className="badge-amber flex items-center gap-1 font-medium">
                                <Lock className="w-3 h-3 text-amber-600" /> Notas bloqueadas
                              </span>
                            )}
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-text-primary">
                              {exam.title}
                            </h4>
                            {exam.description && (
                              <p className="text-xs text-text-secondary mt-1">
                                {exam.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
                              <span className="flex items-center gap-1">
                                <HelpCircle className="w-3.5 h-3.5 text-text-secondary" />
                                {exam.questions?.length || 0} preguntas
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-mono">
                                <Clock className="w-3.5 h-3.5 text-text-secondary" />
                                {exam.durationMinutes || 20} minutos
                              </span>
                            </div>
                          </div>

                          {isActive ? (
                            <button
                              onClick={() => handleStartExam(exam)}
                              className="w-full py-2.5 rounded-lg bg-tech-purple hover:bg-tech-purple-hover text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Comenzar Evaluación</span>
                            </button>
                          ) : (
                            <div className="w-full py-2 text-center text-xs text-text-secondary bg-bg-secondary rounded-lg border border-border-custom font-medium">
                              Esta evaluación no está abierta actualmente
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-10 text-center border border-border-custom rounded-xl space-y-2 bg-white dark:bg-panel shadow-xs">
                    <ShieldCheck className="w-8 h-8 text-text-secondary mx-auto opacity-50" />
                    <h4 className="text-xs font-semibold text-text-primary">
                      No hay evaluaciones programadas
                    </h4>
                    <p className="text-xs text-text-secondary max-w-sm mx-auto">
                      Tu profesor programará las pruebas correspondientes una vez finalizados los temas de clase.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: STUDENT'S SUBMISSIONS & GRADES */}
            {activeTab === 'submissions' && (
              <div className="p-6 space-y-4 ios-tab-panel">
                <div>
                  <h3 className="text-sm font-bold text-text-primary">
                    Mis Entregas y Calificaciones
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Historial oficial de evaluaciones presentadas y notas entregadas al docente.
                  </p>
                </div>

                {mySubmissions.length > 0 ? (
                  <div className="overflow-x-auto border border-border-custom rounded-xl bg-white dark:bg-panel shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-bg-secondary/70 text-text-secondary font-semibold border-b border-border-custom">
                        <tr>
                          <th className="px-4 py-3">Actividad / Evaluación</th>
                          <th className="px-4 py-3">Tipo</th>
                          <th className="px-4 py-3">Fecha de Entrega</th>
                          <th className="px-4 py-3">Puntaje / Calificación</th>
                          <th className="px-4 py-3 text-right">Detalle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-custom/40">
                        {mySubmissions.map((sub, sIdx) => {
                          const isExam = sub.type === 'examen_resultado';
                          return (
                            <tr key={sub._id || sIdx} className="hover:bg-bg-secondary/50 transition-colors">
                              <td className="px-4 py-3 font-medium text-text-primary">
                                {sub.title}
                              </td>
                              <td className="px-4 py-3">
                                <span className={isExam ? 'badge-purple' : 'badge-blue'}>
                                  {isExam ? 'Examen' : 'Nota PDF'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-text-secondary font-mono">
                                {new Date(sub.submittedAt).toLocaleDateString()}{' '}
                                <span className="text-[10px] text-text-secondary opacity-75 font-mono">
                                  {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {sub.score !== undefined ? (
                                  <span className="font-semibold text-text-primary bg-bg-secondary px-2 py-0.5 rounded border border-border-custom font-mono">
                                    {sub.score} Puntos
                                  </span>
                                ) : (
                                  <span className="text-text-secondary">Entregado</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {sub.pdfData ? (
                                  <a
                                    href={sub.pdfData}
                                    download={sub.fileName || 'mi_nota.pdf'}
                                    className="inline-flex items-center gap-1 text-tech-purple hover:underline font-semibold"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Descargar PDF</span>
                                  </a>
                                ) : (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Registrado
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-10 text-center border border-border-custom rounded-xl space-y-2 bg-white dark:bg-panel shadow-xs">
                    <FileCheck className="w-8 h-8 text-text-secondary mx-auto opacity-50" />
                    <h4 className="text-xs font-semibold text-text-primary">
                      No tienes entregas registradas en esta asignatura
                    </h4>
                    <p className="text-xs text-text-secondary max-w-sm mx-auto">
                      Cuando presentes un examen o envíes notas de clase en PDF, se archivarán en esta sección para tu consulta.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EMPTY STATE: NO COMMUNITIES ENROLLED */}
      {!activeExam && communities.length === 0 && (
        <div className="bg-white dark:bg-panel rounded-xl border border-border-custom p-12 text-center max-w-lg mx-auto space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-tech-purple/10 text-tech-purple flex items-center justify-center mx-auto border border-tech-purple/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Aún no estás inscrito en ninguna asignatura
            </h3>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              Para acceder a las diapositivas de clase y evaluaciones, solicita a tu profesor el código de la asignatura (por ejemplo, <code className="text-tech-purple font-mono font-semibold">QN-FIS101</code>).
            </p>
          </div>

          <form onSubmit={handleJoinCommunity} className="flex items-center justify-center gap-2 pt-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Código de clase (ej. QN-FIS101)"
              className="px-3.5 py-2 rounded-lg bg-bg-secondary border border-border-custom text-xs text-text-primary placeholder:text-text-secondary font-mono uppercase focus:outline-none focus:border-tech-purple w-56"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-tech-purple hover:bg-tech-purple-hover text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Inscribirse
            </button>
          </form>
        </div>
      )}

      {/* Clean Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-text-primary text-white shadow-2xl text-xs font-medium flex items-center gap-2.5 animate-fade-in border border-border-custom/20">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
