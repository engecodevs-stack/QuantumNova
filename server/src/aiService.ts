import Note from './models/note.js';
import mongoose from 'mongoose';
import GnosisLog from './models/gnosisLog.js';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

// Auxiliar function to talk with Gemini 1.5 Flash API using fetch
async function callGeminiAPI(
  systemInstruction: string,
  contents: Array<{ role: 'user' | 'model'; parts: { text: string }[] }>,
  temperature: number = 0.7,
  responseMimeType?: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no configurado en las variables de entorno.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;
  console.log('Using Gemini API Key starting with:', apiKey.substring(0, 10));

  const generationConfig: any = {
    temperature
  };
  if (responseMimeType) {
    generationConfig.responseMimeType = responseMimeType;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents,
      systemInstruction: systemInstruction ? {
        parts: [{ text: systemInstruction }]
      } : undefined,
      generationConfig
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as any;
  if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
    const responseText = data.candidates[0].content.parts[0].text;
    
    // Save to GnosisLog silently in the background
    const lastUserContent = [...contents].reverse().find(c => c.role === 'user');
    const promptText = lastUserContent?.parts?.[0]?.text || '';
    if (promptText) {
      const category = systemInstruction && systemInstruction.includes('tutor') ? 'Tutor' : 'Mapa Conceptual';
      GnosisLog.create({
        prompt: promptText,
        response: responseText,
        category
      }).catch(err => console.error('Error guardando log en Gnosis:', err));
    }

    return responseText;
  }

  throw new Error('La API de Gemini devolvió una respuesta vacía o no válida.');
}

export async function chatWithTutor(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  contextNotes?: string,
  userId?: string
): Promise<string> {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey) {
    try {
      // 1. Fetch user's notes to ground the chatbot context
      let notesContext = '';
      try {
        const filter = (userId && mongoose.Types.ObjectId.isValid(userId))
          ? { user: new mongoose.Types.ObjectId(userId) }
          : {};
        const notes = await Note.find(filter, 'title content');
        notesContext = notes
          .map(note => `---
Título de la nota: ${note.title}
Contenido:
${note.content}`)
          .join('\n\n');
      } catch (dbErr) {
        console.error('Error al obtener notas en aiService:', dbErr);
      }

      // 2. Build the active note context (the one currently being viewed by the user)
      const activeNoteContext = contextNotes
        ? `\nNota activa que el estudiante está visualizando actualmente:\n${contextNotes}\n`
        : '';

      // 3. Build system instruction
      const systemInstruction = `Eres Quantum, el tutor inteligente y acompañante pedagógico de QuantumNova. Tu propósito fundamental es transformar la relación del estudiante con la IA: combatir el mal uso de la IA de solo pedir que la máquina haga las cosas por nosotros sin esfuerzo activo, y promover en su lugar un aprendizaje constructivo, reflexivo y duradero.
No sustituyes el proceso intelectual del estudiante; actúas como un mentor socrático con limitaciones intencionales para que el alumno piense, analice y construya su propio conocimiento.

REGLAS PEDAGÓGICAS DE QUANTUM NOVA (OBLIGATORIAS Y ESTRICTAS):
1. LIMITACIONES INTENCIONALES: Nunca resuelvas tareas, ejercicios, ensayos o exámenes completos de forma directa ni des respuestas terminadas que anulen el esfuerzo del alumno. Identifica qué concepto necesita, dale pistas guiadas y formula preguntas reflexivas para que él mismo descubra la solución.
2. REGLA ESTRICTA DE NOTAS Y COMBATE A LA PASIVIDAD:
   - Si el estudiante pregunta sobre un tema, duda o concepto que NO figura en su <BIBLIOTECA_DE_NOTAS> ni en su nota activa:
     a) Dale ÚNICAMENTE una explicación muy pequeña y breve (máximo 2 a 3 oraciones concisas de orientación inicial).
     b) Indícale explícitamente que este tema NO se encuentra registrado en sus notas de estudio actuales.
     c) Pídele y exígele que cree una nota sobre este tema en la sección "Mis Notas" (con lo aprendido en clase o sus propias palabras) para poder profundizar juntos, generar cuestionarios, esquematizar mapas conceptuales y ayudarle a estudiar de verdad.
     d) NUNCA redactes explicaciones extensas, listas interminables ni resuelvas problemas de temas no anotados. Debemos erradicar el hábito pasivo de pedirle todo a la IA sin involucrarse en el proceso de estudio.
   - Si el estudiante pregunta sobre un tema que SÍ está en sus notas:
     Usa sus notas como base ("Como registraste en tus notas sobre..."), hazle preguntas socráticas para relacionar conceptos y ayúdalo a consolidar su memoria activa.
3. CONEXIÓN ALUMNO - QUANTUM NOVA - DOCENTE: Fomenta que el estudiante tome apuntes activos durante la clase y repase los materiales de sus comunidades docentes.
4. Responde siempre en español de manera clara, empática, pedagógica y estructurada con Markdown sobrio.
5. PROHIBICIÓN ESTRICTA DE EMOJIS: Está terminantemente prohibido utilizar emojis, emoticonos o caracteres pictográficos en cualquiera de tus respuestas. Mantén un formato académico, profesional, sobrio y completamente libre de emojis.

A continuación se encuentra toda la biblioteca de notas del estudiante para tu referencia:
<BIBLIOTECA_DE_NOTAS>
${notesContext || 'El estudiante aún no tiene notas en su biblioteca.'}
</BIBLIOTECA_DE_NOTAS>

${activeNoteContext}
`;

      // 4. Format chat history for Gemini contents role structures
      const contents = [
        ...history.map(h => ({
          role: h.role === 'assistant' ? ('model' as const) : ('user' as const),
          parts: [{ text: h.content }]
        })),
        { role: 'user' as const, parts: [{ text: message }] }
      ];

      return await callGeminiAPI(systemInstruction, contents, 0.7);
    } catch (err) {
      console.error('Error connecting to Gemini Chat:', err);
    }
  }

  // Fallback to OpenAI if configured, otherwise simulation
  const openAiApiKey = process.env.OPENAI_API_KEY;
  if (openAiApiKey) {
    try {
      const messages = [
        {
          role: 'system',
          content: `Eres Quantum, el tutor inteligente y acompañante pedagógico de QuantumNova. Tu misión es combatir el mal uso de la IA de solo pedir y no hacer el trabajo intelectual por nosotros mismos.
REGLAS PEDAGÓGICAS ESTRICTAS:
1. Si el estudiante pregunta algo que NO figura en sus notas (${contextNotes ? 'Nota activa disponible' : 'Sin notas registradas'}), dale ÚNICAMENTE una pequeña y breve explicación (máximo 2 a 3 oraciones concisas), infórmale que ese tema no está en sus notas y pídele explícitamente que cree un apunte en "Mis Notas" para poder ayudarle a estudiar y profundizar juntos.
2. Nunca resuelvas tareas completas ni des respuestas terminadas que reemplacen el esfuerzo reflexivo del alumno.
3. Prohibición estricta de emojis: mantén un formato académico, profesional y sobrio sin emojis.
4. Responde siempre en español con Markdown estructurado.
${contextNotes ? `\nContexto de la nota activa del estudiante:\n${contextNotes}` : ''}`
        },
        ...history.map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: message }
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        return data.choices[0].message.content;
      }
    } catch (err) {
      console.error('Error connecting to OpenAI chat:', err);
    }
  }

  // FALLBACK SIMULATION ENGINE
  console.log('AI Service running in Simulated Fallback Mode.');
  return simulateTutorResponse(message, contextNotes);
}

export async function explainConcept(concept: string): Promise<string> {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey) {
    try {
      const systemInstruction = 'Eres Quantum, el tutor inteligente de QuantumNova. Explica el concepto solicitado de manera clara, estructurada con markdown, incluyendo analogías sencillas y puntos clave.';
      const contents = [
        { role: 'user' as const, parts: [{ text: `Explica en detalle el concepto: ${concept}` }] }
      ];
      return await callGeminiAPI(systemInstruction, contents, 0.7);
    } catch (err) {
      console.error('Error in Gemini explainConcept:', err);
    }
  }

  const openAiApiKey = process.env.OPENAI_API_KEY;

  if (openAiApiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Eres Quantum. Explica el concepto de manera clara, estructurada con markdown, incluyendo analogías sencillas y puntos clave.'
            },
            {
              role: 'user',
              content: `Explica en detalle el concepto: ${concept}`
            }
          ]
        })
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        return data.choices[0].message.content;
      }
    } catch (err) {
      console.error('Error in OpenAI explain:', err);
    }
  }

  // Mock explanations
  const conceptKey = concept.toLowerCase();
  if (conceptKey.includes('cuantica') || conceptKey.includes('quantum')) {
    return `# Explicación Cuántica: Superposición y Dualidad

La **física cuántica** nos enseña que el universo a pequeña escala se comporta como una red de probabilidades.

## 1. Analogía de la Moneda
Imagina una moneda sobre la mesa: es cara o cruz (estado clásico 0 o 1). Pero si la lanzas al aire y está girando, es una mezcla de ambas al mismo tiempo. Eso es **Superposición**. Solo cuando la detienes (haces una medición) se decide por un estado.

## 2. Puntos Clave
*   **Colapso de la función de onda**: Al medir el sistema, este deja de ser probabilístico y se define en una realidad física.
*   **Aplicación**: Es la base del desarrollo de computadoras cuánticas, que usan qúbits que pueden ser 0 y 1 simultáneamente.

¿Te gustaría que generemos un cuestionario para verificar tu retención sobre este tema?`;
  }

  if (conceptKey.includes('feynman') || conceptKey.includes('estudio')) {
    return `# Explicación: El Método Feynman de Aprendizaje Acelerado

El **Método Feynman** es el pilar de la retención activa. Se basa en una verdad simple: *si no puedes explicarlo de forma sencilla, no lo has entendido.*

## Estructura de Aplicación
1.  **Enseña a un niño**: Utiliza lenguaje simple. Escribe la definición sin usar tecnicismos.
2.  **Identifica los vacíos**: ¿Qué parte te costó más estructurar? Regresa al texto de origen.
3.  **Usa analogías**: Por ejemplo, explica el ancho de banda de red comparándolo con tuberías de agua.

## ¿Por qué funciona?
Forzar a tu cerebro a traducir términos técnicos abstractos a lenguaje cotidiano crea nuevas conexiones sinápticas que fijan el conocimiento a largo plazo.`;
  }

  return `# Explicación Académica: ${concept}

Aquí tienes un resumen simplificado sobre **${concept}** para potenciar tu segunda mente digital.

## Concepto
Se refiere a la integración y análisis del tema a través de una perspectiva crítica y relacional.

## Puntos Clave
*   **Comprensión Estructural**: Entender las partes que lo componen y cómo interactúan entre sí.
*   **Aplicación Práctica**: Llevar el concepto teórico a un entorno de simulación o resolución de problemas reales.
*   **Conexión Semántica**: Conectar este tema con otras notas de tu biblioteca académica para consolidar el mapa de conocimiento.

> *Consejo de Quantum: Intenta relacionar este concepto con tus notas anteriores sobre productividad y técnicas de estudio.*`;
}

export async function generateQuiz(concept: string): Promise<QuizQuestion[]> {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey) {
    try {
      const systemInstruction = `Genera un cuestionario de 3 preguntas de opción múltiple sobre el tema solicitado.
Devuelve EXCLUSIVAMENTE un JSON en este formato de array (sin otros textos ni bloques):
[
  {
    "question": "Pregunta...",
    "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
    "answer": 0, // Índice de la respuesta correcta (0-3)
    "explanation": "Explicación de por qué es correcta..."
  }
]`;
      const contents = [
        { role: 'user' as const, parts: [{ text: `Tema: ${concept}` }] }
      ];
      const jsonResponse = await callGeminiAPI(systemInstruction, contents, 0.7, 'application/json');
      return JSON.parse(jsonResponse);
    } catch (err) {
      console.error('Error in Gemini generateQuiz:', err);
    }
  }

  const openAiApiKey = process.env.OPENAI_API_KEY;

  if (openAiApiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Genera un cuestionario de 3 preguntas de opción múltiple sobre el tema solicitado.
              Devuelve EXCLUSIVAMENTE un JSON en este formato:
              [
                {
                  "question": "Pregunta...",
                  "options": ["A", "B", "C", "D"],
                  "answer": 0, // Índice de la respuesta correcta (0-3)
                  "explanation": "Explicación de por qué es correcta..."
                }
              ]`
            },
            {
              role: 'user',
              content: `Tema: ${concept}`
            }
          ]
        })
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        let cleanText = data.choices[0].message.content.trim();
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.substring(7, cleanText.length - 3);
        } else if (cleanText.startsWith('```')) {
          cleanText = cleanText.substring(3, cleanText.length - 3);
        }
        return JSON.parse(cleanText);
      }
    } catch (err) {
      console.error('Error in OpenAI Quiz generator:', err);
    }
  }

  // Simulated Quiz Fallback
  const conceptKey = concept.toLowerCase();
  if (conceptKey.includes('cuantica') || conceptKey.includes('quantum') || conceptKey.includes('fisica')) {
    return [
      {
        question: '¿Qué es la superposición cuántica?',
        options: [
          'La capacidad de una partícula de tener un estado fijo siempre',
          'El estado en el cual una partícula existe en múltiples estados posibles a la vez',
          'El choque físico entre electrones y protones',
          'La velocidad de la luz en el vacío cuántico'
        ],
        answer: 1,
        explanation: 'La superposición describe la propiedad cuántica de existir en múltiples combinaciones lineales de estados hasta que se realiza una medición.'
      },
      {
        question: '¿Cuál es el resultado de medir un sistema en superposición?',
        options: [
          'El sistema explota de forma espontánea',
          'El sistema permanece exactamente igual y se duplica',
          'La función de onda colapsa en un único estado medible',
          'El entrelazamiento cuántico se cancela permanentemente'
        ],
        answer: 2,
        explanation: 'Al interactuar con el entorno (medición), el estado cuántico se proyecta a uno solo de los autovectores posibles, colapsando la función de onda.'
      },
      {
        question: '¿Qué mide la ecuación de Schrödinger?',
        options: [
          'La fuerza gravitatoria entre partículas cuánticas',
          'La evolución temporal del estado cuántico (función de onda)',
          'El tamaño exacto de un electrón en nanómetros',
          'La temperatura interna de un átomo de hidrógeno'
        ],
        answer: 1,
        explanation: 'La ecuación de Schrödinger describe el cambio con el tiempo de una partícula o sistema físico considerando los efectos cuánticos.'
      }
    ];
  }

  // Default General Quiz
  return [
    {
      question: `¿Cuál es el objetivo principal del análisis de "${concept}"?`,
      options: [
        'Aprenderse todo de memoria sin entender las relaciones',
        'Comprender la estructura de los conceptos y sus interconexiones dinámicas',
        'Evitar el uso de tecnologías digitales para estudiar',
        'Desarrollar una teoría matemática desde cero'
      ],
      answer: 1,
      explanation: 'Las metodologías de aprendizaje activo buscan estructurar el conocimiento mediante enlaces bidireccionales y análisis conceptual profundo.'
    },
    {
      question: 'Según las técnicas de estudio modernas, ¿cuál es el mejor método para retener información?',
      options: [
        'Releer el mismo texto de forma pasiva muchas veces consecutivas',
        'Combinar el Recuerdo Activo con la Repetición Espaciada en el tiempo',
        'Dormir con los libros debajo de la almohada',
        'Estudiar 12 horas seguidas la noche antes de una prueba'
      ],
      answer: 1,
      explanation: 'El Active Recall y la Spaced Repetition son las técnicas con mayor evidencia científica para fijar el conocimiento a largo plazo.'
    },
    {
      question: '¿Cómo ayuda el Método Feynman a resolver dudas conceptuales?',
      options: [
        'Te ayuda a memorizar términos técnicos complejos rápidamente',
        'Te fuerza a explicarlo de forma simple, dejando al descubierto tus lagunas de conocimiento',
        'Automatiza el proceso de escritura de tus notas',
        'Te conecta con expertos del área mediante foros'
      ],
      answer: 1,
      explanation: 'Al intentar simplificar un tema difícil, los puntos débiles de tu explicación revelan de inmediato en qué áreas necesitas profundizar.'
    }
  ];
}

export async function generateExamFromTeacherMaterial(
  materialContent: string,
  materialTitle: string,
  numQuestions: number = 3
): Promise<QuizQuestion[]> {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey) {
    try {
      const systemInstruction = `Eres el generador pedagógico de evaluaciones de QuantumNova para docentes.
Tu objetivo es crear una evaluación rigurosa y justa de ${numQuestions} preguntas de opción múltiple fundamentada EXCLUSIVAMENTE en el material de clase provisto por el profesor.
Las preguntas deben evaluar la comprensión real y las explicaciones vistas en clase para evitar reclamos como "eso no lo vimos en clase".

Devuelve EXCLUSIVAMENTE un JSON en este formato de array (sin texto adicional ni bloques de código adicionales):
[
  {
    "question": "Texto claro de la pregunta...",
    "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
    "answer": 0,
    "explanation": "Explicación de por qué es la respuesta correcta basada en el material impartido."
  }
]`;
      const contents = [
        {
          role: 'user' as const,
          parts: [{
            text: `Tema/Presentación: "${materialTitle}"\n\nContenido de clase:\n${materialContent}\n\nGenera ${numQuestions} preguntas de evaluación.`
          }]
        }
      ];

      const jsonResponse = await callGeminiAPI(systemInstruction, contents, 0.6, 'application/json');
      return JSON.parse(jsonResponse);
    } catch (err) {
      console.error('Error generating exam from teacher material with Gemini:', err);
    }
  }

  // Fallback generation based on material content
  const lowerContent = (materialContent + ' ' + materialTitle).toLowerCase();
  
  if (lowerContent.includes('onda') || lowerContent.includes('particula') || lowerContent.includes('cuantica')) {
    return [
      {
        question: `De acuerdo con la presentación "${materialTitle}", ¿qué fenómeno demuestra el experimento de la doble rendija?`,
        options: [
          'La naturaleza exclusivamente corpuscular de la luz',
          'La dualidad onda-partícula de la materia y la luz según se observe o no',
          'La inexistencia de electrones en el vacío',
          'La aceleración infinita de partículas subatómicas'
        ],
        answer: 1,
        explanation: 'El experimento demuestra que al no ser observadas las partículas generan un patrón de interferencia ondulatorio, mientras que al medirse colapsan en partículas discretas.'
      },
      {
        question: '¿Qué representa la función de onda en los temas vistos en el curso?',
        options: [
          'La trayectoria exacta y determinista de un cuerpo planetario',
          'La densidad de probabilidad de encontrar una partícula en un estado determinado',
          'La temperatura absoluta de un gas ideal',
          'El peso molecular de los elementos pesados'
        ],
        answer: 1,
        explanation: 'En mecánica cuántica, la función de onda entrega amplitudes probabilísticas para los distintos estados observables del sistema.'
      },
      {
        question: '¿Por qué es fundamental que las evaluaciones estén basadas en las presentaciones de clase según QuantumNova?',
        options: [
          'Para evitar que los alumnos tengan que pensar',
          'Para garantizar que se evalúe lo realmente enseñado y evitar "eso no lo vimos en clase"',
          'Para que la IA responda por el alumno automáticamente',
          'Para limitar la cantidad de apuntes que toma el alumno'
        ],
        answer: 1,
        explanation: 'El alineamiento pedagógico asegura que el contenido impartido sea el evaluado, respetando el esfuerzo de estudio de los estudiantes.'
      }
    ];
  }

  return [
    {
      question: `Respecto a "${materialTitle}", ¿cuál es el concepto central presentado por el docente?`,
      options: [
        'Aprender definiciones de memoria sin relación práctica',
        'Analizar y comprender las bases estructurales del tema expuesto en clase',
        'Copiar y pegar resúmenes automáticos de internet',
        'Desestimar los apuntes tomados en el aula'
      ],
      answer: 1,
      explanation: 'El material impartido se enfoca en el análisis conceptual propio y la aplicación práctica del conocimiento.'
    },
    {
      question: `Según los apuntes y temas expuestos en "${materialTitle}", ¿cuál es la mejor práctica de estudio?`,
      options: [
        'Esperar a la noche anterior para leer superficialmente',
        'Registrar notas con palabras propias y relacionar conceptos para afianzar el aprendizaje',
        'Permitir que una IA resuelva todo el trabajo académico',
        'Evitar repasar las notas previas al examen'
      ],
      answer: 1,
      explanation: 'El registro activo de notas con palabras propias consolida las vías neuronales del aprendizaje.'
    },
    {
      question: '¿Qué ventaja ofrece relacionar este tema con tu mapa de conocimiento?',
      options: [
        'Ocupa más espacio de almacenamiento en el dispositivo',
        'Facilita la transferencia de conocimientos y la retención a largo plazo',
        'Invalida las notas previas tomadas en clase',
        'Evita tener que presentar la evaluación'
      ],
      answer: 1,
      explanation: 'Conectar conceptos nuevos con conocimientos previos permite una comprensión más profunda y duradera.'
    }
  ];
}

export async function generateSummary(noteContent: string): Promise<string> {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey) {
    try {
      const systemInstruction = 'Genera un resumen ultra-conciso (máximo 4 puntos bala) y una recomendación de estudio corta del texto provisto.';
      const contents = [
        { role: 'user' as const, parts: [{ text: noteContent }] }
      ];
      return await callGeminiAPI(systemInstruction, contents, 0.7);
    } catch (err) {
      console.error('Error in Gemini generateSummary:', err);
    }
  }

  const openAiApiKey = process.env.OPENAI_API_KEY;

  if (openAiApiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Genera un resumen ultra-conciso (máximo 4 puntos bala) y una recomendación de estudio corta del texto provisto.'
            },
            {
              role: 'user',
              content: noteContent
            }
          ]
        })
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        return data.choices[0].message.content;
      }
    } catch (err) {
      console.error('Error in OpenAI summary:', err);
    }
  }

  // Simulated Summary fallback based on simple heuristics
  const bulletPoints: string[] = [];
  if (noteContent.toLowerCase().includes('cuantica')) {
    bulletPoints.push('Estudia los fenómenos físicos a escalas atómicas y subatómicas.');
    bulletPoints.push('Se rige por el principio de superposición probabilística.');
    bulletPoints.push('El entrelazamiento conecta estados cuánticos sin importar la distancia física.');
    bulletPoints.push('La medición colapsa la probabilidad en una sola realidad tangible.');
  } else if (noteContent.toLowerCase().includes('feynman') || noteContent.toLowerCase().includes('retención')) {
    bulletPoints.push('El Método Feynman se basa en explicar temas complejos con vocabulario simple.');
    bulletPoints.push('El Active Recall estimula la recuperación activa del cerebro en lugar de la lectura pasiva.');
    bulletPoints.push('La Repetición Espaciada rompe la curva natural del olvido de Ebbinghaus.');
    bulletPoints.push('Conectar conceptos en redes imita la estructura semántica neuronal.');
  } else {
    bulletPoints.push('Análisis estructural del documento cargado.');
    bulletPoints.push('Identificación de conceptos académicos prioritarios para examen.');
    bulletPoints.push('Conexión con el grafo general de notas para mejorar la retención cognitiva.');
  }

  return `### Resumen de la Nota
${bulletPoints.map(p => `*   ${p}`).join('\n')}

### Sugerencia de Estudio Quantum
*Repasa los enlaces cruzados de esta nota y genera un cuestionario rápido de 3 preguntas para consolidar la información en tu memoria.*`;
}

export async function suggestMindMapConnections(
  noteTitle: string,
  noteContent: string,
  allNotes: Array<{ id: string; title: string }>
): Promise<Array<{ targetNoteId: string; reason: string }>> {
  const suggestions: Array<{ targetNoteId: string; reason: string }> = [];

  const contentLower = noteContent.toLowerCase() + ' ' + noteTitle.toLowerCase();

  for (const n of allNotes) {
    if (n.title.toLowerCase() === noteTitle.toLowerCase()) continue;

    const targetLower = n.title.toLowerCase();

    // Check overlaps
    let match = false;
    let reason = '';

    if (
      (contentLower.includes('cuántica') || contentLower.includes('fisica') || contentLower.includes('onda')) &&
      (targetLower.includes('cuántica') || targetLower.includes('física') || targetLower.includes('onda'))
    ) {
      match = true;
      reason = 'Ambas notas abordan principios de mecánica cuántica y física subatómica.';
    } else if (
      (contentLower.includes('feynman') || contentLower.includes('retención') || contentLower.includes('estudio')) &&
      (targetLower.includes('feynman') || targetLower.includes('retención') || targetLower.includes('estudio') || targetLower.includes('aprendizaje'))
    ) {
      match = true;
      reason = 'Relacionadas con metodologías de estudio inteligente y retención cognitiva.';
    }

    if (match) {
      suggestions.push({
        targetNoteId: n.id,
        reason
      });
    }
  }

  return suggestions.slice(0, 2);
}

function simulateTutorResponse(msg: string, context?: string): string {
  const q = msg.toLowerCase();

  if (q.includes('hola') || q.includes('buenos dias') || q.includes('buenas noches')) {
    return `Hola. Soy **Quantum**, tu tutor inteligente y guía pedagógico en QuantumNova.

¿Qué tema de tus notas deseas revisar hoy? Recuerda que trabajamos a partir de tus propios apuntes para combatir el aprendizaje pasivo. Puedo ayudarte a:
1. Explicar conceptos basados en lo que has anotado.
2. Generar cuestionarios de práctica personalizados.
3. Conectar y estructurar tus notas en mapas conceptuales.

Por favor, dime qué tema o nota de tu biblioteca deseas revisar.`;
  }

  if (q.includes('cuestionario') || q.includes('examen') || q.includes('quiz') || q.includes('evalua')) {
    return `Para poner a prueba tus conocimientos de forma interactiva, haz clic en el botón **"Generar Cuestionario"** en la barra lateral o dentro del chat. Formularé preguntas fundamentadas en tus notas registradas para consolidar tu retención.`;
  }

  if (q.includes('resumen') || q.includes('resume')) {
    if (context && context.trim().length > 0) {
      return `Revisando tu nota activa, he sintetizado las ideas clave:\n\n${context.slice(0, 240)}...\n\n¿Qué reflexión o duda puntual te surge a partir de estos puntos?`;
    }
    return `Para generar un resumen, abre una nota en la sección **Mis Notas** para que podamos analizarla y sintetizarla juntos.`;
  }

  // Check if active note context exists and contains terms from the user query
  const hasContext = Boolean(context && context.trim().length > 15);
  const words = q.split(/\s+/).filter(w => w.length > 4);
  const isTopicInContext = hasContext && words.some(w => context!.toLowerCase().includes(w));

  if (isTopicInContext) {
    return `Revisando tu nota activa sobre este tema:

Has anotado puntos fundamentales que guardan relación con tu pregunta. Para consolidar tu comprensión y no limitarte a una respuesta directa, reflexiona: ¿cómo formularías este concepto con tus propias palabras o con un ejemplo cotidiano?

Registra esa síntesis en tus notas para afianzar la memoria de largo plazo.`;
  }

  // Topic NOT in student notes -> Brief 2-sentence explanation + explicit note creation mandate
  return `He analizado tu consulta.

**Explicación breve de orientación:**
El concepto al que te refieres es un principio fundamental que aborda las bases y relaciones teóricas de este campo del conocimiento.

**Observación pedagógica:**
He revisado tu biblioteca y **este tema no se encuentra registrado en tus notas de estudio**.

Para poder ayudarte a profundizar, generar cuestionarios interactivos y esquematizar mapas conceptuales, **te pido que registres una nota en la sección "Mis Notas"** con tus apuntes de clase o tus ideas preliminares. En QuantumNova combatimos el mal uso de la IA de solo pedir que otros hagan el trabajo: queremos que construyas tu propio aprendizaje de manera activa.`;
}

export interface LibraryCard {
  title: string;
  category: string;
  description: string;
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
}

export async function generateLibraryRecommendations(
  userId?: string
): Promise<LibraryCard[]> {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey) {
    try {
      const filter = (userId && mongoose.Types.ObjectId.isValid(userId))
        ? { user: new mongoose.Types.ObjectId(userId) }
        : {};
      const notes = await Note.find(filter, 'title content');

      // If user has no notes, return empty array so that empty state triggers
      if (notes.length === 0) {
        return [];
      }

      const notesText = notes
        .map(n => `Título: ${n.title}\nContenido:\n${n.content}`)
        .join('\n\n');

      const systemInstruction = `Eres un psicólogo educativo y experto en diseño curricular para QuantumNova. Tu tarea es analizar las notas de estudio provistas abajo y generar una lista de exactamente 6 conceptos clave o temas recomendados para estudiar.
      
REGLAS:
1. Las recomendaciones deben ser temas conceptuales relevantes y directamente relacionados con los temas que el estudiante ya tiene en sus apuntes, sirviendo para complementar o expandir su biblioteca.
2. Devuelve la respuesta EXCLUSIVAMENTE en un formato JSON de array con esta estructura exacta (sin explicaciones ni formato markdown):
[
  {
    "title": "Nombre del concepto recomendado",
    "category": "Física" | "Productividad" | "Psicología" | "General" | "Biología" | etc. (categoría corta adecuada),
    "description": "Una breve descripción didáctica de 1 o 2 frases que motive a estudiarlo.",
    "difficulty": "Principiante" | "Intermedio" | "Avanzado"
  }
]`;
      const contents = [
        { role: 'user' as const, parts: [{ text: `Aquí están mis apuntes:\n\n${notesText}` }] }
      ];

      const jsonResponse = await callGeminiAPI(systemInstruction, contents, 0.7, 'application/json');
      return JSON.parse(jsonResponse) as LibraryCard[];
    } catch (err) {
      console.error('Error in generateLibraryRecommendations:', err);
    }
  }

  return [];
}
