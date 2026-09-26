import type { ViewType } from '../types';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  requiredView?: ViewType;
  requiresRightPanel?: boolean;
  positionPreference?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  interactiveLabel?: string;
  isActionable?: boolean;
}

export interface GuideCategory {
  id: string;
  title: string;
  description: string;
  iconName: string;
  steps: TourStep[];
}

// Recorrido Principal Integral de Onboarding para Nuevos Usuarios
// Explica todas las funciones reales de la plataforma de manera secuencial y contextual
export const MAIN_ONBOARDING_STEPS: TourStep[] = [
  // 1. Mis Notas
  {
    id: 'nav-notes',
    title: 'Mis Notas de Estudio',
    description: 'Accede a tu repositorio central de apuntes. Aquí creas, editas y organizas todo tu conocimiento estructurado en carpetas y materias.',
    targetSelector: '[data-tour="nav-notes"]',
    requiredView: 'notes',
    positionPreference: 'right',
    interactiveLabel: 'Explorar notas'
  },
  {
    id: 'notes-search',
    title: 'Buscador Instantáneo',
    description: 'Filtra rápidamente tus apuntes escribiendo palabras clave. Busca coincidencias directas en títulos, contenidos y etiquetas.',
    targetSelector: '[data-tour="notes-search"]',
    requiredView: 'notes',
    positionPreference: 'bottom'
  },
  {
    id: 'notes-folder-btn',
    title: 'Organización por Carpetas',
    description: 'Crea carpetas temáticas para agrupar tus asignaturas, módulos o semestres académicos de manera ordenada.',
    targetSelector: '[data-tour="notes-folder-btn"]',
    requiredView: 'notes',
    positionPreference: 'bottom'
  },
  {
    id: 'notes-new-btn',
    title: 'Crear Nueva Nota',
    description: 'Genera un nuevo apunte en blanco al instante dentro de la carpeta activa para comenzar a redactar.',
    targetSelector: '[data-tour="notes-new-btn"]',
    requiredView: 'notes',
    positionPreference: 'bottom',
    interactiveLabel: 'Nueva nota'
  },
  {
    id: 'notes-import-btn',
    title: 'Importar Archivo .qnote',
    description: 'Carga apuntes guardados previamente en formato Quantum Nova (.qnote), conservando sus enlaces, etiquetas y estructura intactos.',
    targetSelector: '[data-tour="notes-import-btn"]',
    requiredView: 'notes',
    positionPreference: 'bottom'
  },
  {
    id: 'notes-editor',
    title: 'Editor con Enlaces Semánticos',
    description: 'Redacta con soporte Markdown completo. Escribe [[Nombre de Nota]] para crear enlaces bidireccionales automáticos que alimentan tu grafo de conocimiento.',
    targetSelector: '[data-tour="notes-editor"]',
    requiredView: 'notes',
    positionPreference: 'left'
  },
  {
    id: 'notes-toolbar-highlight',
    title: 'Barra de Formato y Resaltadores',
    description: 'Aplica negritas, cursivas, listas, código y colores de resaltado inteligente para enfatizar conceptos clave durante tus lecturas.',
    targetSelector: '[data-tour="notes-toolbar-highlight"]',
    requiredView: 'notes',
    positionPreference: 'bottom'
  },
  {
    id: 'notes-tabs',
    title: 'Modos de Visualización',
    description: 'Alterna fluidamente entre Vista Edición (redacción pura), Vista Previa (diseño final procesado) y Pantalla Dividida.',
    targetSelector: '[data-tour="notes-tabs"]',
    requiredView: 'notes',
    positionPreference: 'bottom'
  },
  {
    id: 'notes-tags-bar',
    title: 'Etiquetas y Metadatos (#)',
    description: 'Asigna categorías temáticas mediante hashtags. La inteligencia artificial utiliza estas etiquetas para agrupar notas con afinidad semántica.',
    targetSelector: '[data-tour="notes-tags-bar"]',
    requiredView: 'notes',
    positionPreference: 'bottom'
  },
  {
    id: 'notes-save-btn',
    title: 'Guardar Apunte',
    description: 'Guarda tus modificaciones de forma persistente. Tus notas quedan disponibles de inmediato para el Copiloto y el Mapa Mental.',
    targetSelector: '[data-tour="notes-save-btn"]',
    requiredView: 'notes',
    positionPreference: 'bottom'
  },
  {
    id: 'notes-more-actions',
    title: 'Acciones de Exportación y Enfoque',
    description: 'Despliega opciones para exportar tu apunte a PDF, Word o archivo .qnote, activar el Modo Enfoque sin distracciones o enviarlo a tu aula.',
    targetSelector: '[data-tour="notes-more-actions"]',
    requiredView: 'notes',
    positionPreference: 'bottom'
  },

  // 2. Quantum Copiloto
  {
    id: 'nav-copilot',
    title: 'Quantum Copiloto',
    description: 'Abre el panel de asistencia contextual en tiempo real. Analiza la nota que estás visualizando para ofrecerte síntesis y relaciones conceptuales.',
    targetSelector: '[data-tour="nav-copilot"]',
    requiredView: 'notes',
    requiresRightPanel: true,
    positionPreference: 'left'
  },
  {
    id: 'copilot-summary',
    title: 'Resúmenes Automáticos de la Nota',
    description: 'La IA extrae y sintetiza los puntos cruciales del apunte activo, permitiéndote repasar lecciones extensas en pocos segundos.',
    targetSelector: '[data-tour="copilot-summary"]',
    requiredView: 'notes',
    requiresRightPanel: true,
    positionPreference: 'left'
  },
  {
    id: 'copilot-connections',
    title: 'Conexiones Inteligentes Sugeridas',
    description: 'Detecta notas complementarias en tu biblioteca según su afinidad conceptual. Pulsa "Enlazar" para crear una vinculación inmediata.',
    targetSelector: '[data-tour="copilot-connections"]',
    requiredView: 'notes',
    requiresRightPanel: true,
    positionPreference: 'left'
  },

  // 3. Quantum Tutor IA
  {
    id: 'nav-chat',
    title: 'Quantum Tutor IA',
    description: 'Interactúa con un asistente pedagógico de método socrático que te guía en la resolución de dudas complejas.',
    targetSelector: '[data-tour="nav-chat"]',
    requiredView: 'chat',
    positionPreference: 'right'
  },
  {
    id: 'chat-tutor-header',
    title: 'Contexto Activo de Aprendizaje',
    description: 'El tutor detecta automáticamente cuál apunte tienes abierto y formula sus explicaciones tomando en cuenta ese material específico.',
    targetSelector: '[data-tour="chat-tutor-header"]',
    requiredView: 'chat',
    positionPreference: 'bottom'
  },
  {
    id: 'chat-quiz-btn',
    title: 'Generador de Cuestionarios Dinámicos',
    description: 'Crea evaluaciones formativas interactivas de 3 preguntas de opción múltiple basadas en tu contenido para consolidar la retención activa.',
    targetSelector: '[data-tour="chat-quiz-btn"]',
    requiredView: 'chat',
    positionPreference: 'bottom'
  },
  {
    id: 'chat-voice-toggle',
    title: 'Explicaciones Narradas por Voz TTS',
    description: 'Activa la locución automática para escuchar las respuestas del tutor en voz alta mientras repasas tus textos.',
    targetSelector: '[data-tour="chat-voice-toggle"]',
    requiredView: 'chat',
    positionPreference: 'bottom'
  },
  {
    id: 'chat-input-area',
    title: 'Campo de Consulta y Diálogo',
    description: 'Escribe tus dudas conceptuales, solicita ejemplos o pide desgloses paso a paso. El tutor responderá adaptándose a tu nivel.',
    targetSelector: '[data-tour="chat-input-area"]',
    requiredView: 'chat',
    positionPreference: 'top'
  },

  // 4. Mapa Mental
  {
    id: 'nav-map',
    title: 'Mapa Mental Interactivo',
    description: 'Visualiza todo tu ecosistema de apuntes representado como una constelación de nodos interconectados con física gravitatoria.',
    targetSelector: '[data-tour="nav-map"]',
    requiredView: 'map',
    positionPreference: 'right'
  },
  {
    id: 'mindmap-search',
    title: 'Buscador de Nodos',
    description: 'Localiza instantáneamente cualquier concepto o título dentro de la red espacial para centrar la cámara en él.',
    targetSelector: '[data-tour="mindmap-search"]',
    requiredView: 'map',
    positionPreference: 'bottom'
  },
  {
    id: 'mindmap-reorganize',
    title: 'Reorganización Espacial Automática',
    description: 'Distribuye armónicamente los nodos en espiral para desenredar conexiones densas y facilitar la lectura global del grafo.',
    targetSelector: '[data-tour="mindmap-reorganize"]',
    requiredView: 'map',
    positionPreference: 'bottom'
  },
  {
    id: 'mindmap-canvas',
    title: 'Lienzo de Grafo Dinámico',
    description: 'Haz doble clic en el lienzo para crear notas, arrastra nodos para vincularlos entre sí o haz clic en cualquier nodo para abrir su apunte.',
    targetSelector: '[data-tour="mindmap-canvas"]',
    requiredView: 'map',
    positionPreference: 'bottom'
  },

  // 5. Aulas y Comunidades
  {
    id: 'nav-communities',
    title: 'Mis Aulas y Asignaturas',
    description: 'Conecta con tus asignaturas oficiales, revisa los materiales compartidos por tus docentes y presenta evaluaciones académicas.',
    targetSelector: '[data-tour="nav-communities"]',
    requiredView: 'communities',
    positionPreference: 'right'
  },
  {
    id: 'communities-join',
    title: 'Inscripción por Código de Clase',
    description: 'Introduce el código alfanumérico proporcionado por tu profesor para matricularte al instante en el aula correspondiente.',
    targetSelector: '[data-tour="communities-join"]',
    requiredView: 'communities',
    positionPreference: 'bottom'
  },
  {
    id: 'communities-tabs',
    title: 'Materiales, Evaluaciones y Calificaciones',
    description: 'Navega entre diapositivas oficiales descargables, exámenes institucionales con temporizador y tu historial de calificaciones.',
    targetSelector: '[data-tour="communities-tabs"]',
    requiredView: 'communities',
    positionPreference: 'bottom'
  },

  // 6. Cursos Académicos
  {
    id: 'nav-courses',
    title: 'Mis Cursos Académicos',
    description: 'Revisa tu catálogo de materias en curso y monitorea tu progreso porcentual acumulado conforme completas sesiones de estudio.',
    targetSelector: '[data-tour="nav-courses"]',
    requiredView: 'courses',
    positionPreference: 'right'
  },
  {
    id: 'courses-grid',
    title: 'Tarjetas de Materia y Progreso',
    description: 'Visualiza el avance de cada asignatura, activa sesiones de estudio focalizadas y marca hitos académicos completados.',
    targetSelector: '[data-tour="courses-grid"]',
    requiredView: 'courses',
    positionPreference: 'bottom'
  },

  // 7. Biblioteca del Conocimiento
  {
    id: 'nav-library',
    title: 'Biblioteca Recomendada',
    description: 'Descubre conceptos y temas sugeridos automáticamente por la IA en función del contenido de tus notas creadas.',
    targetSelector: '[data-tour="nav-library"]',
    requiredView: 'library',
    positionPreference: 'right'
  },
  {
    id: 'library-grid',
    title: 'Tarjetas de Aprendizaje IA',
    description: 'Selecciona cualquier tarjeta para solicitar una explicación conceptual profunda o generar un nuevo apunte directamente en tu cuaderno.',
    targetSelector: '[data-tour="library-grid"]',
    requiredView: 'library',
    positionPreference: 'bottom'
  },

  // 8. Controles de Productividad y Ajustes
  {
    id: 'sidebar-study-time',
    title: 'Sesión de Estudio Pomodoro',
    description: 'Temporizador integrado para registrar tus periodos de concentración. Establece metas diarias y visualiza tus minutos productivos.',
    targetSelector: '[data-tour="sidebar-study-time"]',
    positionPreference: 'right'
  },
  {
    id: 'sidebar-role-toggle',
    title: 'Alternador de Rol (Estudiante / Docente)',
    description: 'Cambia entre la perspectiva de estudiante (toma de notas y exámenes) y la de docente (gestión de grupos y publicación de material).',
    targetSelector: '[data-tour="sidebar-role-toggle"]',
    positionPreference: 'right'
  },
  {
    id: 'nav-settings',
    title: 'Configuración y Accesibilidad',
    description: 'Personaliza tu experiencia con temas visuales (Claro/Oscuro), escala de fuentes, modo de alto contraste y opciones del sintetizador TTS.',
    targetSelector: '[data-tour="nav-settings"]',
    requiredView: 'settings',
    positionPreference: 'right'
  },
  {
    id: 'settings-guide',
    title: 'Centro de Guías y Tutoriales',
    description: 'Puedes reiniciar este recorrido completo en cualquier momento o lanzar mini-guías específicas por sección desde este panel.',
    targetSelector: '[data-tour="settings-guide"]',
    requiredView: 'settings',
    positionPreference: 'left'
  }
];

// Mini-guías específicas detalladas para consultar desde Ajustes
export const MINI_GUIDES: Record<string, TourStep[]> = {
  notes: [
    {
      id: 'notes-g-nav',
      title: 'Repositorio de Apuntes',
      description: 'Panel de acceso a todos tus cuadernos, carpetas y documentos de estudio.',
      targetSelector: '[data-tour="nav-notes"]',
      requiredView: 'notes',
      positionPreference: 'right'
    },
    {
      id: 'notes-g-search',
      title: 'Buscador de Notas',
      description: 'Filtra al instante por términos clave o temas específicos.',
      targetSelector: '[data-tour="notes-search"]',
      requiredView: 'notes',
      positionPreference: 'bottom'
    },
    {
      id: 'notes-g-folder',
      title: 'Estructuración en Carpetas',
      description: 'Crea carpetas por asignatura para mantener tus notas organizadas.',
      targetSelector: '[data-tour="notes-folder-btn"]',
      requiredView: 'notes',
      positionPreference: 'bottom'
    },
    {
      id: 'notes-g-new',
      title: 'Crear Apunte',
      description: 'Inicia una nueva nota en blanco con título y contenido personalizable.',
      targetSelector: '[data-tour="notes-new-btn"]',
      requiredView: 'notes',
      positionPreference: 'bottom'
    },
    {
      id: 'notes-g-editor',
      title: 'Enlaces Bidireccionales [[...]]',
      description: 'Conecta ideas usando [[Nombre de Nota]]. La plataforma vinculará ambos apuntes de forma automática.',
      targetSelector: '[data-tour="notes-editor"]',
      requiredView: 'notes',
      positionPreference: 'left'
    },
    {
      id: 'notes-g-toolbar',
      title: 'Formato y Resaltadores',
      description: 'Aplica estilos de texto enriquecido y colores de resaltado para destacar ideas principales.',
      targetSelector: '[data-tour="notes-toolbar-highlight"]',
      requiredView: 'notes',
      positionPreference: 'bottom'
    },
    {
      id: 'notes-g-tabs',
      title: 'Modos de Vista',
      description: 'Alterna entre editor, vista previa renderizada y pantalla dividida.',
      targetSelector: '[data-tour="notes-tabs"]',
      requiredView: 'notes',
      positionPreference: 'bottom'
    },
    {
      id: 'notes-g-more',
      title: 'Exportar y Modo Enfoque',
      description: 'Exporta a PDF, Word o .qnote y elimina distracciones visuales activando el Modo Enfoque.',
      targetSelector: '[data-tour="notes-more-actions"]',
      requiredView: 'notes',
      positionPreference: 'bottom'
    }
  ],
  chat: [
    {
      id: 'chat-g-nav',
      title: 'Quantum Tutor IA',
      description: 'Tutor interactivo diseñado para promover el razonamiento deductivo y la comprensión profunda.',
      targetSelector: '[data-tour="nav-chat"]',
      requiredView: 'chat',
      positionPreference: 'right'
    },
    {
      id: 'chat-g-header',
      title: 'Contexto de Estudio',
      description: 'Indica qué apunte está siendo utilizado como base de conocimiento para responder a tus preguntas.',
      targetSelector: '[data-tour="chat-tutor-header"]',
      requiredView: 'chat',
      positionPreference: 'bottom'
    },
    {
      id: 'chat-g-quiz',
      title: 'Generación de Cuestionarios',
      description: 'Crea evaluaciones de 3 preguntas de opción múltiple para comprobar tu dominio del tema.',
      targetSelector: '[data-tour="chat-quiz-btn"]',
      requiredView: 'chat',
      positionPreference: 'bottom'
    },
    {
      id: 'chat-g-voice',
      title: 'Voz del Tutor',
      description: 'Activa la reproducción auditiva para escuchar las explicaciones sintetizadas con voz natural.',
      targetSelector: '[data-tour="chat-voice-toggle"]',
      requiredView: 'chat',
      positionPreference: 'bottom'
    },
    {
      id: 'chat-g-input',
      title: 'Consulta Socrática',
      description: 'Formula cualquier duda o solicita explicaciones alternativas.',
      targetSelector: '[data-tour="chat-input-area"]',
      requiredView: 'chat',
      positionPreference: 'top'
    }
  ],
  copilot: [
    {
      id: 'copilot-g-toggle',
      title: 'Panel del Copiloto Contextual',
      description: 'Abre este panel en cualquier momento para obtener asistencia rápida sobre la nota seleccionada.',
      targetSelector: '[data-tour="nav-copilot"]',
      requiredView: 'notes',
      requiresRightPanel: true,
      positionPreference: 'left'
    },
    {
      id: 'copilot-g-summary',
      title: 'Resúmenes Clave',
      description: 'Sintetiza lecciones extensas destacando definiciones y fórmulas principales.',
      targetSelector: '[data-tour="copilot-summary"]',
      requiredView: 'notes',
      requiresRightPanel: true,
      positionPreference: 'left'
    },
    {
      id: 'copilot-g-connections',
      title: 'Conexiones Semánticas',
      description: 'Enlaza apuntes afines con 1 clic para enriquecer tu constelación conceptual.',
      targetSelector: '[data-tour="copilot-connections"]',
      requiredView: 'notes',
      requiresRightPanel: true,
      positionPreference: 'left'
    }
  ],
  map: [
    {
      id: 'map-g-nav',
      title: 'Grafo de Conocimiento',
      description: 'Representación visual y espacial de tus apuntes como neuronas conectadas.',
      targetSelector: '[data-tour="nav-map"]',
      requiredView: 'map',
      positionPreference: 'right'
    },
    {
      id: 'map-g-search',
      title: 'Buscador de Nodos',
      description: 'Enfoca la cámara sobre conceptos clave dentro de la red.',
      targetSelector: '[data-tour="mindmap-search"]',
      requiredView: 'map',
      positionPreference: 'bottom'
    },
    {
      id: 'map-g-reorganize',
      title: 'Reorganización Espacial',
      description: 'Acomoda los nodos en una distribución limpia y equilibrada de forma automática.',
      targetSelector: '[data-tour="mindmap-reorganize"]',
      requiredView: 'map',
      positionPreference: 'bottom'
    },
    {
      id: 'map-g-canvas',
      title: 'Lienzo Interactivo',
      description: 'Interactúa libremente: arrastra nodos, conéctalos o haz clic para abrir su contenido.',
      targetSelector: '[data-tour="mindmap-canvas"]',
      requiredView: 'map',
      positionPreference: 'bottom'
    }
  ],
  communities: [
    {
      id: 'comm-g-nav',
      title: 'Portal de Aulas Virtuales',
      description: 'Campus de interacción institucional entre estudiantes y docentes.',
      targetSelector: '[data-tour="nav-communities"]',
      requiredView: 'communities',
      positionPreference: 'right'
    },
    {
      id: 'comm-g-join',
      title: 'Inscripción de Asignatura',
      description: 'Ingresa el código proporcionado por tu docente para matricularte.',
      targetSelector: '[data-tour="communities-join"]',
      requiredView: 'communities',
      positionPreference: 'bottom'
    },
    {
      id: 'comm-g-tabs',
      title: 'Materiales y Exámenes',
      description: 'Consulta diapositivas oficiales de clase y presenta evaluaciones con control de tiempo.',
      targetSelector: '[data-tour="communities-tabs"]',
      requiredView: 'communities',
      positionPreference: 'bottom'
    }
  ],
  courses: [
    {
      id: 'courses-g-nav',
      title: 'Rutas de Aprendizaje',
      description: 'Gestión de tus materias académicas y bibliotecas recomendadas.',
      targetSelector: '[data-tour="nav-courses"]',
      requiredView: 'courses',
      positionPreference: 'right'
    },
    {
      id: 'courses-g-grid',
      title: 'Progreso Curricular',
      description: 'Monitorea el avance porcentual de cada materia y activa sesiones de estudio.',
      targetSelector: '[data-tour="courses-grid"]',
      requiredView: 'courses',
      positionPreference: 'bottom'
    },
    {
      id: 'courses-g-library',
      title: 'Biblioteca Inteligente',
      description: 'Accede a temas recomendados por la IA basados en tus materias para profundizar.',
      targetSelector: '[data-tour="nav-library"]',
      requiredView: 'library',
      positionPreference: 'right'
    }
  ]
};
