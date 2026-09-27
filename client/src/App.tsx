import { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { RightPanel } from './components/RightPanel';
import { NotesView } from './components/NotesView';
import { MindMapView } from './components/MindMapView';
import { ChatView } from './components/ChatView';
import { CoursesView } from './components/CoursesView';
import { LibraryView } from './components/LibraryView';
import { SettingsView } from './components/SettingsView';
import { LoginScreen } from './components/LoginScreen';
import { ToolsOverlay } from './components/ToolsOverlay';
import { TeacherPortalView } from './components/TeacherPortalView';
import { CommunitiesView } from './components/CommunitiesView';
import { motion, AnimatePresence } from 'framer-motion';
import type { Note, ChatMessage, ViewType, SuggestionConnection, Course, QuizQuestion, User } from './types';
import { speakTutorExplanation, stopTutorSpeech } from './utils/speechVoice';
import { OnboardingTour } from './components/OnboardingTour';
import { MAIN_ONBOARDING_STEPS, MINI_GUIDES, type TourStep } from './config/onboardingConfig';
import {
  shouldShowAutoOnboarding,
  markOnboardingCompleted,
  markOnboardingSkipped
} from './utils/onboardingStorage';
import { getApiUrl } from './config/api';

function App() {
  // Redirect helper for lobby
  const redirectToLobby = () => {
    window.location.href = '/';
  };

  // Authentication & Session
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // Check URL query parameters first (e.g. from Lobby redirect)
    const params = new URLSearchParams(window.location.search);
    const userParam = params.get('user');
    if (userParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(userParam));
        if (parsed && parsed.email) {
          if (!parsed.role) {
            parsed.role = parsed.email.toLowerCase().endsWith('@profe.edu.mx') ? 'profe' : 'alumno';
          }
          localStorage.setItem('quantum_user', JSON.stringify(parsed));
          // Clean the query parameter from URL
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing user query param:', e);
      }
    }

    const saved = localStorage.getItem('quantum_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email && !parsed.role) {
          parsed.role = parsed.email.toLowerCase().endsWith('@profe.edu.mx') ? 'profe' : 'alumno';
        }
        return parsed;
      } catch (e) {}
    }
    return null;
  });

  const [showToolsOverlay, setShowToolsOverlay] = useState(false);

  const handleLoginSuccess = (userData: User) => {
    if (!userData.role) {
      userData.role = userData.email.toLowerCase().endsWith('@profe.edu.mx') ? 'profe' : 'alumno';
    }
    localStorage.setItem('quantum_user', JSON.stringify(userData));
    setCurrentUser(userData);
    if (userData.role === 'profe') {
      setView('teacher');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('quantum_user');
    setCurrentUser(null);
    redirectToLobby();
  };

  // Navigation & UI States
  const [currentView, setView] = useState<ViewType>(() => {
    if (currentUser?.role === 'profe') return 'teacher';
    return 'notes';
  });

  const handleToggleRole = () => {
    if (!currentUser) return;
    const newRole = currentUser.role === 'profe' ? 'alumno' : 'profe';
    const updated = { ...currentUser, role: newRole as 'profe' | 'alumno' };
    localStorage.setItem('quantum_user', JSON.stringify(updated));
    setCurrentUser(updated);
    if (newRole === 'profe') {
      setView('teacher');
    } else {
      setView('notes');
    }
  };

  // Student exam lock state
  const [examLockState, setExamLockState] = useState<{ locked: boolean; communityName?: string; examTitle?: string }>({ locked: false });

  useEffect(() => {
    if (!currentUser?.id || currentUser?.role === 'profe') {
      setExamLockState({ locked: false });
      return;
    }
    const checkLock = async () => {
      try {
        const res = await fetch(getApiUrl('/student/active-exam-lock'), {
          headers: { 'x-user-id': currentUser.id }
        });
        if (res.ok) {
          const data = await res.json();
          setExamLockState(data);
        }
      } catch (e) {}
    };
    checkLock();
    const timer = setInterval(checkLock, 15000);
    return () => clearInterval(timer);
  }, [currentUser]);

  // Onboarding & Interactive Tour States
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [tourSteps, setTourSteps] = useState<TourStep[]>(MAIN_ONBOARDING_STEPS);

  // Auto-detect first time onboarding for new user
  useEffect(() => {
    if (currentUser) {
      const userKey = currentUser.id || currentUser.email;
      if (shouldShowAutoOnboarding(userKey)) {
        const timer = setTimeout(() => {
          setTourSteps(MAIN_ONBOARDING_STEPS);
          setIsOnboardingActive(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [currentUser]);

  const handleTourStepChange = (step: TourStep) => {
    if (step.requiredView && step.requiredView !== currentView) {
      setView(step.requiredView);
    }
    if (step.requiresRightPanel) {
      setIsRightPanelOpen(true);
    }
    if (isMobileOrTablet) {
      if (step.targetSelector.startsWith('[data-tour="nav-') && !isSidebarOpenMobile) {
        setIsSidebarOpenMobile(true);
      } else if (!step.targetSelector.startsWith('[data-tour="nav-') && isSidebarOpenMobile) {
        setIsSidebarOpenMobile(false);
      }
    }
    if (step.requiredView === 'notes' && !activeNote && notes.length > 0) {
      const editorTargets = ['notes-editor', 'notes-save-btn', 'notes-image-btn', 'notes-toolbar-highlight', 'notes-tags-bar', 'notes-tabs', 'notes-more-actions'];
      if (editorTargets.some(t => step.targetSelector.includes(t))) {
        setActiveNote(notes[0]);
      }
    }
  };

  const handleTourComplete = () => {
    markOnboardingCompleted(currentUser?.id || currentUser?.email);
    setIsOnboardingActive(false);
  };

  const handleTourSkip = () => {
    markOnboardingSkipped(currentUser?.id || currentUser?.email);
    setIsOnboardingActive(false);
  };

  const handleStartFullGuide = () => {
    setTourSteps(MAIN_ONBOARDING_STEPS);
    setIsOnboardingActive(true);
  };

  const handleStartMiniGuide = (category: string) => {
    const steps = MINI_GUIDES[category];
    if (steps && steps.length > 0) {
      setTourSteps(steps);
      setIsOnboardingActive(true);
    }
  };

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('quantum_theme') as 'dark' | 'light') || 'light';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
      document.body.classList.add('light-mode');
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('light-mode');
      document.body.classList.remove('light-mode');
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    }
    localStorage.setItem('quantum_theme', theme);
  }, [theme]);
  // Responsiveness States
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileOrTablet = windowWidth < 1024;

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 1024);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  useEffect(() => {
    if (windowWidth < 1024) {
      setIsSidebarCollapsed(true);
    } else {
      setIsSidebarCollapsed(false);
    }
  }, [windowWidth]);

  // Core Data States
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // RAG States
  const [aiSummary, setAiSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [suggestedConnections, setSuggestedConnections] = useState<SuggestionConnection[]>([]);

  // Study Session States
  const [studyActive, setStudyActive] = useState(false);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [studySeconds, setStudySeconds] = useState(0);
  const studySecondsRef = useRef(0);

  // Chat Feed
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: '¡Hola! Soy **Quantum**, tu tutor inteligente para el estudio activo en QuantumNova. Mi objetivo es guiarte para que comprendas y consolides conocimientos a partir de tus notas, combatiendo el uso pasivo de la IA. ¿Qué apunte de tu biblioteca vamos a revisar hoy?'
    }
  ]);

  // Global Quiz States
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isQuizLoading, setIsQuizLoading] = useState(false);

  // Accessibility States
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [fontSizeScale, setFontSizeScale] = useState(100);
  const [highContrast, setHighContrast] = useState(false);
  const [readingMode, setReadingMode] = useState(false);

  // Cancel any active speech when TTS is toggled off
  useEffect(() => {
    if (!ttsEnabled) {
      stopTutorSpeech();
    }
  }, [ttsEnabled]);

  // Fetch initial notes
  const fetchNotes = async () => {
    try {
      const res = await fetch(getApiUrl('/notes'));
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setNotes(data);
          localStorage.setItem('quantum_local_notes', JSON.stringify(data));
          return;
        }
      }
    } catch (err) {
      console.warn('Backend local no disponible, usando almacenamiento local/demo.');
    }

    const saved = localStorage.getItem('quantum_local_notes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNotes(parsed);
          return;
        }
      } catch (e) {}
    }

    const sampleNotes: Note[] = [
      {
        id: 'note-1',
        title: 'Introducción a la Física Cuántica',
        content: `# Introducción a la Física Cuántica\n\nLa **física cuántica** es la rama de la física que estudia la materia y la energía a escalas atómicas y subatómicas.\n\n## Conceptos Clave\n1. **Dualidad Onda-Partícula**: Las partículas exhiben comportamientos de ondas y partículas según la observación. Consulta [[Dualidad Onda Particula]].\n2. **Superposición**: Un sistema cuántico existe en varios estados posibles a la vez.\n3. **Entrelazamiento Cuántico**: Conexión instantánea entre partículas entrelazadas.\n\n#fisica #cuantica #ciencia`,
        tags: ['#fisica', '#cuantica', '#ciencia'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'note-2',
        title: 'Dualidad Onda Particula',
        content: `# Dualidad Onda Partícula\n\nFenómeno cuántico donde electrones y fotones presentan tanto propiedades de ondas continuas como partículas discretas.\n\n- Experimento de la doble rendija de Thomas Young.\n- Conexión directa con [[Introducción a la Física Cuántica]].\n\n#fisica #mecanicacuantica`,
        tags: ['#fisica', '#mecanicacuantica'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    setNotes(sampleNotes);
    localStorage.setItem('quantum_local_notes', JSON.stringify(sampleNotes));
  };

  useEffect(() => {
    fetchNotes();

    // Load accumulated study seconds from localStorage
    const savedSecs = localStorage.getItem('quantum_study_seconds');
    if (savedSecs) {
      const parsed = parseInt(savedSecs, 10);
      setStudySeconds(parsed);
      studySecondsRef.current = parsed;
    }
  }, []);

  // Update HTML styles for Accessibility (Font Scale & Contrast)
  useEffect(() => {
    // Standard font size on html tag was 18px base
    const basePx = (fontSizeScale / 100) * 18;
    document.documentElement.style.fontSize = `${basePx}px`;

    // Apply high contrast classes to body
    if (highContrast) {
      document.body.classList.add('high-contrast');
      document.body.style.filter = 'contrast(1.25) saturate(1.1)';
    } else {
      document.body.classList.remove('high-contrast');
      document.body.style.filter = 'none';
    }
  }, [fontSizeScale, highContrast]);

  // Study Session Pomodoro effect
  useEffect(() => {
    let interval: any = null;

    if (studyActive) {
      interval = setInterval(() => {
        setStudySeconds(prev => {
          const next = prev + 1;
          studySecondsRef.current = next;
          localStorage.setItem('quantum_study_seconds', next.toString());
          
          // Sync with database every 60 seconds of study
          if (next % 60 === 0) {
            fetch(getApiUrl('/stats/study'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ minutes: 1 })
            })
              .catch(err => console.error(err));
          }

          return next;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [studyActive]);

  // Load AI summaries and connections whenever activeNote changes
  useEffect(() => {
    if (!activeNote) {
      setAiSummary('');
      setSuggestedConnections([]);
      return;
    }

    const loadRAGContext = async () => {
      setIsSummaryLoading(true);
      try {
        // 1. Fetch AI Summary
        const summaryRes = await fetch(getApiUrl('/ai/summary'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: activeNote.content })
        });
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          setAiSummary(summaryData.summary);
        }

        // 2. Fetch AI Suggested Connections
        const connRes = await fetch(getApiUrl('/ai/suggest-connections'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            noteTitle: activeNote.title,
            noteContent: activeNote.content
          })
        });
        if (connRes.ok) {
          const connData = await connRes.json();
          setSuggestedConnections(connData.suggestions);
        }
      } catch (err) {
        console.error('Failed to load RAG copilot data:', err);
      } finally {
        setIsSummaryLoading(false);
      }
    };

    loadRAGContext();
  }, [activeNote]);

  // Note CRUD handlers
  const handleCreateNote = async (title?: string, folderId?: string) => {
    const defaultTitle = title || 'Nueva Nota';
    try {
      const response = await fetch(getApiUrl('/notes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: defaultTitle,
          content: `# ${defaultTitle}\n\nEscribe aquí tus ideas...`,
          tags: [],
          folderId: folderId
        })
      });

      if (response.ok) {
        const newNote = await response.json();
        setNotes(prev => [newNote, ...prev]);
        setActiveNote(newNote);
        return newNote;
      }
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  const handleUpdateNote = async (updatedNote: Note) => {
    try {
      const response = await fetch(getApiUrl(`/notes/${updatedNote.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: updatedNote.title,
          content: updatedNote.content,
          tags: updatedNote.tags,
          images: updatedNote.images || [],
          folderId: updatedNote.folderId !== undefined ? updatedNote.folderId : (updatedNote.folder ? updatedNote.folder.id : null)
        })
      });

      if (response.ok) {
        const syncedNote = await response.json();
        setNotes(prev => prev.map(n => (n.id === syncedNote.id ? syncedNote : n)));
        setActiveNote(syncedNote);
      }
    } catch (err) {
      console.error('Failed to update note:', err);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const response = await fetch(getApiUrl(`/notes/${id}`), {
        method: 'DELETE'
      });

      if (response.ok) {
        setNotes(prev => prev.filter(n => n.id !== id));
        setActiveNote(null);
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleDeleteNotesBulk = async (ids: string[]) => {
    try {
      const response = await fetch(getApiUrl('/notes/bulk-delete'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });

      if (response.ok) {
        setNotes(prev => prev.filter(n => !ids.includes(n.id)));
        if (activeNote && ids.includes(activeNote.id)) {
          setActiveNote(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete notes in bulk:', err);
    }
  };

  // Chat queries with AI Tutor
  const handleAskTutor = async (query: string): Promise<string> => {
    try {
      const response = await fetch(getApiUrl('/ai/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages
            .filter(m => m.id !== 'welcome-msg')
            .map(m => ({ role: m.role, content: m.content })),
          contextNotes: activeNote ? activeNote.content : undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.response;
      }
    } catch (err) {
      console.error('Failed to reach tutor backend:', err);
    }
    return 'Lo siento, no he podido contactar con el tutor en este momento. Por favor verifica que el servidor esté activo.';
  };

  // Bidirectional connections connector
  const handleConnectNotes = (targetId: string) => {
    if (!activeNote) return;
    const targetNote = notes.find(n => n.id === targetId);
    if (!targetNote) return;

    // Append link markdown
    const updatedContent = `${activeNote.content}\n\n*   Concepto relacionado: [[${targetNote.title}]]`;
    handleUpdateNote({
      ...activeNote,
      content: updatedContent
    });
  };



  // Generate AI Quiz global trigger
  const handleGenerateQuiz = async () => {
    setIsQuizLoading(true);
    setQuizQuestions([]);
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setQuizCompleted(false);

    const topic = activeNote ? activeNote.title : 'Física Cuántica';

    try {
      const response = await fetch(getApiUrl('/ai/quiz'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ concept: topic })
      });

      if (response.ok) {
        const data = await response.json();
        setQuizQuestions(data.quiz);
        
        // Speak feedback if TTS enabled
        if (ttsEnabled) {
          speakTutorExplanation(`He preparado un cuestionario de tres preguntas sobre ${topic}. ¡Mucha suerte!`);
        }
      }
    } catch (err) {
      console.error('Failed to generate quiz:', err);
    } finally {
      setIsQuizLoading(false);
    }
  };

  // Voice Interaction Handlers (Pleasant Natural Spanish Voice)
  const speakTextHelper = (text: string) => {
    if (!ttsEnabled) return;
    speakTutorExplanation(text);
  };

  const handleVoiceAction = async (actionType: string, payload?: string) => {
    console.log('Orchestrated Voice Action:', actionType, payload);
    
    switch (actionType) {
      case 'create_note':
        await handleCreateNote(payload);
        break;
      
      case 'explain_concept':
        if (payload) {
          setIsRightPanelOpen(true);
          const responseMsg = await handleAskTutor(`explicar tema ${payload}`);
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: responseMsg
          }]);
          speakTextHelper(responseMsg);
        }
        break;

      case 'generate_summary':
        if (activeNote) {
          setIsRightPanelOpen(true);
          setIsSummaryLoading(true);
          const summaryRes = await fetch(getApiUrl('/ai/summary'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: activeNote.content })
          });
          if (summaryRes.ok) {
            const data = await summaryRes.json();
            setAiSummary(data.summary);
            speakTextHelper(data.summary);
          }
          setIsSummaryLoading(false);
        }
        break;

      case 'start_study':
        setStudyActive(true);
        break;

      case 'pause_study':
        setStudyActive(false);
        break;

      case 'save_changes':
        if (activeNote) {
          handleUpdateNote(activeNote);
        }
        break;

      case 'search_note':
        if (payload) {
          setSearchQuery(payload);
          setView('notes');
        }
        break;

      case 'generate_quiz':
        setView('chat');
        await handleGenerateQuiz();
        break;

      case 'chat_query':
        if (payload) {
          const res = await handleAskTutor(payload);
          setMessages(prev => [
            ...prev,
            { id: Date.now().toString(), role: 'user', content: payload },
            { id: (Date.now() + 1).toString(), role: 'assistant', content: res }
          ]);
          speakTextHelper(res);
        }
        break;
      
      default:
        break;
    }
  };

  const handleStartCourseStudy = (course: Course) => {
    if (studyActive && activeCourseId === course.id) {
      setStudyActive(false);
      setActiveCourseId(null);
    } else {
      setStudyActive(true);
      setActiveCourseId(course.id);
    }
  };

  // Format study seconds to string
  const formatStudyTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  // Render view
  const renderView = () => {
    switch (currentView) {
      case 'teacher':
        return <TeacherPortalView currentUser={currentUser} theme={theme} />;

      case 'communities':
        return (
          <CommunitiesView
            currentUser={currentUser}
            theme={theme}
            onNavigateToNotes={() => setView('notes')}
          />
        );

      case 'notes':
        return (
          <NotesView
            notes={notes}
            activeNote={activeNote}
            setActiveNote={setActiveNote}
            onCreateNote={handleCreateNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            onDeleteNotesBulk={handleDeleteNotesBulk}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onRefreshNotes={fetchNotes}
            readingMode={readingMode}
            setReadingMode={setReadingMode}
            theme={theme}
            isMobileOrTablet={isMobileOrTablet}
            currentUser={currentUser}
            isExamLocked={examLockState.locked}
            examLockInfo={examLockState.locked ? { communityName: examLockState.communityName || '', examTitle: examLockState.examTitle || '' } : null}
          />
        );

      case 'map':
        return (
          <MindMapView
            notes={notes}
            onNodeClick={noteId => {
              const matched = notes.find(n => n.id === noteId);
              if (matched) {
                setActiveNote(matched);
                setView('notes');
              }
            }}
            theme={theme}
          />
        );

      case 'chat':
        return (
          <ChatView
            messages={messages}
            setMessages={setMessages}
            activeNote={activeNote}
            allNotes={notes}
            onAskTutor={handleAskTutor}
            onTriggerVoiceFeedback={speakTextHelper}
            quizQuestions={quizQuestions}
            setQuizQuestions={setQuizQuestions}
            currentQuestionIdx={currentQuestionIdx}
            setCurrentQuestionIdx={setCurrentQuestionIdx}
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
            isAnswerSubmitted={isAnswerSubmitted}
            setIsAnswerSubmitted={setIsAnswerSubmitted}
            score={score}
            setScore={setScore}
            quizCompleted={quizCompleted}
            setQuizCompleted={setQuizCompleted}
            isQuizLoading={isQuizLoading}
            onGenerateQuiz={handleGenerateQuiz}
          />
        );

      case 'courses':
        return (
          <CoursesView
            onStartCourseStudy={handleStartCourseStudy}
            studyActive={studyActive}
            activeCourseId={activeCourseId}
          />
        );

      case 'library':
        return (
          <LibraryView
            onExplainConcept={concept => {
              handleVoiceAction('explain_concept', concept);
            }}
            setView={setView}
            onCreateNote={async (title, content) => {
              try {
                const response = await fetch(getApiUrl('/notes'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: title,
                    content: content,
                    tags: ['#biblioteca'],
                    folderId: null
                  })
                });
                if (response.ok) {
                  const newNote = await response.json();
                  setNotes(prev => [newNote, ...prev]);
                  setActiveNote(newNote);
                  setView('notes');
                  return newNote;
                }
              } catch (err) {
                console.error('Failed to create note from library:', err);
              }
            }}
          />
        );

      case 'settings':
        return (
          <SettingsView
            ttsEnabled={ttsEnabled}
            setTtsEnabled={setTtsEnabled}
            fontSizeScale={fontSizeScale}
            setFontSizeScale={setFontSizeScale}
            highContrast={highContrast}
            setHighContrast={setHighContrast}
            readingMode={readingMode}
            setReadingMode={setReadingMode}
            theme={theme}
            setTheme={setTheme}
            onLogout={handleLogout}
            onStartFullGuide={handleStartFullGuide}
            onStartMiniGuide={handleStartMiniGuide}
          />
        );

      default:
        return <div className="p-8 text-text-primary text-xs">Sección no encontrada.</div>;
    }
  };

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="w-full h-full flex overflow-hidden bg-bg-primary font-sans relative">
      {/* Background Animated Liquid Blobs */}
      <div className="background-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* Ambient refined glow */}
      {theme === 'dark' ? (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-30">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-[#5865F2]/20 to-transparent blur-[120px]" style={{ transform: 'translate3d(0,0,0)' }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-[#A947E8]/15 to-transparent blur-[120px]" style={{ transform: 'translate3d(0,0,0)' }} />
        </div>
      ) : (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-10">
          <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-gradient-to-br from-[#5865F2]/10 to-transparent blur-[100px]" style={{ transform: 'translate3d(0,0,0)' }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-gradient-to-tr from-[#A947E8]/10 to-transparent blur-[100px]" style={{ transform: 'translate3d(0,0,0)' }} />
        </div>
      )}

      {/* Mobile Drawer Backdrops */}
      {isMobileOrTablet && isSidebarOpenMobile && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-35 cursor-pointer"
          onClick={() => setIsSidebarOpenMobile(false)}
        />
      )}
      {isMobileOrTablet && isRightPanelOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-25 cursor-pointer"
          onClick={() => setIsRightPanelOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      {(!readingMode || !['notes', 'map'].includes(currentView)) && (
        <Sidebar
          currentView={currentView}
          setView={(view) => {
            setView(view);
            setIsSidebarOpenMobile(false); // Close sidebar on view switch (mobile)
          }}
          isCollapsed={isMobileOrTablet ? false : isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          studyTimeStr={formatStudyTime(studySeconds)}
          onToolsClick={() => setShowToolsOverlay(true)}
          isMobileOrTablet={isMobileOrTablet}
          isSidebarOpenMobile={isSidebarOpenMobile}
          onCloseMobile={() => setIsSidebarOpenMobile(false)}
          currentUser={currentUser}
          onToggleRole={handleToggleRole}
          isRightPanelOpen={isRightPanelOpen}
          onToggleRightPanel={() => setIsRightPanelOpen(prev => !prev)}
        />
      )}

      {/* Main Content Pane */}
      <main className="flex-1 h-full overflow-hidden flex flex-col relative">
        {/* Mobile Header Navbar */}
        {isMobileOrTablet && (
          <header className="h-14 bg-panel border-b border-border-custom px-4 flex items-center justify-between shrink-0 z-20">
            <button
              onClick={() => setIsSidebarOpenMobile(true)}
              className="p-2 rounded-xl bg-bg-secondary border border-border-custom text-text-primary flex items-center justify-center cursor-pointer hover:bg-bg-primary transition-colors"
              title="Abrir menú"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-bold text-sm text-text-primary uppercase tracking-wider">
              QuantumNova
            </span>
            <button
              onClick={() => setIsRightPanelOpen(true)}
              className="p-2 rounded-xl bg-bg-secondary border border-border-custom text-text-primary flex items-center justify-center cursor-pointer hover:bg-bg-primary transition-colors"
              title="Abrir copiloto"
            >
              <Sparkles className="w-4.5 h-4.5 text-tech-purple" />
            </button>
          </header>
        )}

        <AnimatePresence initial={false}>
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.995, pointerEvents: 'none' }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 w-full h-full flex flex-col overflow-hidden bg-transparent"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Right panel (Contextual Copilot) - hidden in Reading Mode */}
      {(!readingMode || !['notes', 'map'].includes(currentView)) && (
        <RightPanel
          isOpen={isRightPanelOpen}
          setIsOpen={setIsRightPanelOpen}
          activeNote={activeNote}
          aiSummary={aiSummary}
          isSummaryLoading={isSummaryLoading}
          suggestedConnections={suggestedConnections}
          onConnectNote={handleConnectNotes}
          allNotes={notes}
          isMobileOrTablet={isMobileOrTablet}
        />
      )}

      {showToolsOverlay && (
        <ToolsOverlay theme={theme} onClose={() => setShowToolsOverlay(false)} />
      )}

      {/* Interactive Guided Onboarding Tour */}
      <OnboardingTour
        steps={tourSteps}
        isActive={isOnboardingActive}
        onComplete={handleTourComplete}
        onSkip={handleTourSkip}
        onStepChange={handleTourStepChange}
        theme={theme}
        isMobileOrTablet={isMobileOrTablet}
      />
    </div>
  );
}

export default App;
