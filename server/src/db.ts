import './mongooseSetup.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';
import User from './models/user.js';
import Folder from './models/folder.js';
import Note from './models/note.js';
import Link from './models/link.js';
import Course from './models/course.js';
import Stat from './models/stat.js';
import Community from './models/community.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quantum_nova';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function initDb() {
  console.log(`Connecting to MongoDB at ${MONGODB_URI}...`);
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected.');

  // 1. Seed Default User if empty
  const notesCount = await Note.countDocuments();
  if (notesCount === 0) {
    console.log('Seeding initial MongoDB database data...');

    // Seed Default User
    const defaultUser = await User.create({
      username: 'QuantumStudent',
      email: 'student@quantumnova.ai',
      password: hashPassword('password123')
    });
    console.log('Default user seeded:', defaultUser.username);

    // Seed Folders for Default User
    const folderFisica = await Folder.create({ name: 'Física Cuántica', user: defaultUser._id });
    const folderEstudio = await Folder.create({ name: 'Métodos de Estudio', user: defaultUser._id });
    console.log('Default folders seeded.');

    // Seed Notes for Default User
    const now = new Date();
    const note1 = await Note.create({
      title: 'Introducción a la Física Cuántica',
      content: `# Introducción a la Física Cuántica\n\nLa **física cuántica** es la rama de la física que estudia la materia y la energía a escalas extremadamente pequeñas, como átomos y partículas subatómicas. A diferencia de la física clásica, en el mundo cuántico las partículas pueden comportarse de formas que desafían nuestro sentido común.\n\n## Conceptos Clave\n\n1. **Dualidad Onda-Partícula**: Las partículas como los electrones pueden comportarse como partículas discretas o como ondas de probabilidad. Ver [[Dualidad Onda Particula]] para más detalles.\n2. **Superposición**: Un estado cuántico puede existir en múltiples configuraciones al mismo tiempo hasta que sea medido. El ejemplo más famoso es el gato de Schrödinger.\n3. **Entrelazamiento Cuántico**: Dos partículas pueden quedar unidas de tal forma que el estado de una afecta instantáneamente al de la otra, sin importar la distancia.\n\n## Ecuación de Schrödinger\nLa ecuación fundamental de la mecánica cuántica es:\n\n$$i\\hbar\\frac{\\partial}{\\partial t}\\Psi(\\mathbf{r},t) = \\hat{H}\\Psi(\\mathbf{r},t)$$\n\n#fisica #cuantica #ciencia`,
      tags: ['#fisica', '#cuantica', '#ciencia'],
      folder: folderFisica._id,
      user: defaultUser._id
    });

    const note2 = await Note.create({
      title: 'Dualidad Onda Particula',
      content: `# Dualidad Onda Partícula\n\nLa **dualidad onda-partícula** es la propiedad de los objetos cuánticos por la cual muestran propiedades tanto ondulatorias (como la interferencia) como de partículas discretas (como la colisión).\n\n## El Experimento de la Doble Rendija\nEste experimento demuestra que la luz y la materia exhiben comportamientos de ondas y partículas:\n- Si no se observan, los electrones forman un patrón de interferencia (ondas).\n- Si se coloca un detector para ver por qué rendija pasan, se comportan como partículas individuales.\n\nEste fenómeno está intrínsecamente relacionado con la [[Introducción a la Física Cuántica]].\n\n#fisica #mecanicacuantica`,
      tags: ['#fisica', '#mecanicacuantica'],
      folder: folderFisica._id,
      user: defaultUser._id
    });

    const note3 = await Note.create({
      title: 'Técnicas de Retención de Información',
      content: `# Técnicas de Retención de Información\n\nPara maximizar el aprendizaje académico y construir una segunda mente digital efectiva, es crucial aplicar técnicas basadas en la ciencia cognitiva.\n\n## 1. Repetición Espaciada (Spaced Repetition)\nConsiste en repasar la información en intervalos crecientes de tiempo. Evita la curva del olvido de Ebbinghaus.\n\n## 2. Recuerdo Activo (Active Recall)\nEn lugar de leer pasivamente, ponte a prueba respondiendo cuestionarios o explicando el tema de memoria (ver [[Método Feynman]]).\n\n## 3. Mapas Mentales y Redes de Conocimiento\nConectar conceptos mediante enlaces bidireccionales ayuda a la retención visual y lógica del cerebro.\n\n#aprendizaje #productividad #estudio`,
      tags: ['#aprendizaje', '#productividad', '#estudio'],
      folder: folderEstudio._id,
      user: defaultUser._id
    });

    const note4 = await Note.create({
      title: 'Método Feynman',
      content: `# Método Feynman\n\nEl **Método Feynman** es una técnica de aprendizaje mental que consiste en explicar un concepto difícil en términos extremadamente simples, como si se lo enseñaras a un niño.\n\n## Pasos:\n1. **Elige el concepto**: Selecciona el tema que quieres aprender.\n2. **Explícalo de forma simple**: Escríbelo usando palabras sencillas sin tecnicismos.\n3. **Identifica lagunas**: Encuentra qué partes no pudiste explicar bien y vuelve al material de estudio.\n4. **Simplifica y analogiza**: Crea analogías para conectar el tema con conceptos conocidos.\n\nEs una de las mejores [[Técnicas de Retención de Información]] existentes.\n\n#estudio #feynman #productividad`,
      tags: ['#estudio', '#feynman', '#productividad'],
      folder: folderEstudio._id,
      user: defaultUser._id
    });

    console.log('Notes seeded.');

    // Seed Links
    await Link.create([
      { source: note1._id, target: note2._id },
      { source: note3._id, target: note4._id }
    ]);
    console.log('Note links seeded.');

    // Seed Courses
    await Course.create([
      {
        title: 'Introducción a la Física Cuántica',
        description: 'Domina los principios de superposición, entrelazamiento y la ecuación de Schrödinger desde cero.',
        progress: 45,
        category: 'Física'
      },
      {
        title: 'Estrategias de Aprendizaje Acelerado',
        description: 'Aprende a hackear tu cerebro con repetición espaciada, palacios de memoria y recuerdo activo.',
        progress: 80,
        category: 'Productividad'
      },
      {
        title: 'Desarrollo del Pensamiento Crítico',
        description: 'Analiza sesgos cognitivos y mejora tu capacidad de resolución de problemas complejos.',
        progress: 15,
        category: 'Filosofía'
      }
    ]);
    console.log('Courses seeded.');

    // Seed Stats (Last 7 Days) for Default User
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const studyMins = i === 0 ? 45 : Math.floor(Math.random() * 50) + 15;
      const queries = Math.floor(Math.random() * 6) + 1;
      const notesCreated = Math.random() > 0.5 ? 1 : 0;

      await Stat.create({
        user: defaultUser._id,
        date: dateStr,
        studyMinutes: studyMins,
        queriesAsked: queries,
        notesCreated: notesCreated
      });
    }
    console.log('Stats seeded successfully.');
  }

  // 2. Seed Physics test user and data if they don't exist
  const physicsEmail = 'fisica@quantumnova.ai';
  let physicsUser = await User.findOne({ email: physicsEmail });
  if (!physicsUser) {
    console.log('Seeding Physics test account...');
    physicsUser = await User.create({
      fullname: 'Físico Cuántico',
      username: 'fisica',
      email: physicsEmail,
      password: hashPassword('password123')
    });

    const folderFisica = await Folder.create({ name: 'Física Cuántica', user: physicsUser._id });

    const note1 = await Note.create({
      title: 'Leyes Cuánticas y Superposición',
      content: `# Leyes Cuánticas y Superposición\n\nLa **física cuántica** es la ciencia que describe el comportamiento de la materia y de la luz a escala atómica y subatómica.\n\n## Principio de Superposición\nUn sistema físico existe en múltiples estados al mismo tiempo hasta que se realiza una medición. Ver [[Ecuación de Schrödinger]] para la formulación matemática.\n\n#fisica #cuantica #superposicion`,
      tags: ['#fisica', '#cuantica', '#superposicion'],
      folder: folderFisica._id,
      user: physicsUser._id
    });

    const note2 = await Note.create({
      title: 'Ecuación de Schrödinger',
      content: `# Ecuación de Schrödinger\n\nLa ecuación de Schrödinger es la ecuación fundamental de la mecánica cuántica cuántica no relativista:\n\n$$i\\hbar\\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi$$\n\nDescribe la evolución de la función de onda de una partícula. Está íntimamente ligada al concepto de [[Leyes Cuánticas y Superposición]].\n\n#fisica #schrodinger #cuantica`,
      tags: ['#fisica', '#schrodinger', '#cuantica'],
      folder: folderFisica._id,
      user: physicsUser._id
    });

    await Link.create([
      { source: note1._id, target: note2._id }
    ]);
    console.log('Physics test account seeded successfully.');
  }

  // 3. Seed Psychology test user and data if they don't exist
  const psychologyEmail = 'psicologia@quantumnova.ai';
  let psychologyUser = await User.findOne({ email: psychologyEmail });
  if (!psychologyUser) {
    console.log('Seeding Psychology test account...');
    psychologyUser = await User.create({
      fullname: 'Psicólogo',
      username: 'psicologia',
      email: psychologyEmail,
      password: hashPassword('password123')
    });

    const folderPsicologia = await Folder.create({ name: 'Psicología Clínica', user: psychologyUser._id });

    const note1 = await Note.create({
      title: 'Introducción a la Psicología',
      content: `# Introducción a la Psicología\n\nLa **psicología** es la disciplina científica que estudia la conducta y los procesos mentales de los individuos.\n\n## Enfoque Cognitivo\nSe centra en cómo procesamos, almacenamos y recuperamos información. Ver [[Terapia Cognitivo Conductual]] para su aplicación práctica.\n\n#psicologia #cognicion #mente`,
      tags: ['#psicologia', '#cognicion', '#mente'],
      folder: folderPsicologia._id,
      user: psychologyUser._id
    });

    const note2 = await Note.create({
      title: 'Terapia Cognitivo Conductual',
      content: `# Terapia Cognitivo Conductual (TCC)\n\nLa TCC es un modelo de intervención terapéutica que se enfoca en modificar los pensamientos disfuncionales y las conductas desadaptativas.\n\nEs una aplicación fundamental en la [[Introducción a la Psicología]].\n\n#psicologia #terapia #tcc`,
      tags: ['#psicologia', '#terapia', '#tcc'],
      folder: folderPsicologia._id,
      user: psychologyUser._id
    });

    await Link.create([
      { source: note1._id, target: note2._id }
    ]);
    console.log('Psychology test account seeded successfully.');
  }

  // 4. Seed Teacher account and Community if they don't exist
  const teacherEmail = 'profesor@profe.edu.mx';
  let teacherUser = await User.findOne({ email: teacherEmail });
  if (!teacherUser) {
    console.log('Seeding Teacher test account...');
    teacherUser = await User.create({
      fullname: 'Prof. Roberto Martínez',
      username: 'profesor',
      email: teacherEmail,
      password: hashPassword('password123'),
      role: 'profe'
    });
    console.log('Teacher test account seeded successfully.');
  }

  // Ensure default student is registered with role 'alumno'
  let studentUser = await User.findOne({ email: 'student@quantumnova.ai' });
  if (studentUser && studentUser.role !== 'alumno') {
    studentUser.role = 'alumno';
    await studentUser.save();
  }

  // Seed sample Community if none exist
  const commCount = await Community.countDocuments();
  if (commCount === 0 && teacherUser) {
    console.log('Seeding initial Teacher Community...');
    const enrolledStudents = studentUser ? [studentUser._id] : [];
    await Community.create({
      name: 'Física Cuántica y Aprendizaje Activo',
      description: 'Comunidad oficial para estudiantes del curso. Materiales de clase, presentaciones y evaluaciones guiadas.',
      code: 'QN-FIS101',
      teacher: teacherUser._id,
      teacherName: teacherUser.fullname,
      students: enrolledStudents,
      materials: [
        {
          title: 'Diapositivas: Dualidad Onda-Partícula y Doble Rendija',
          category: 'presentacion',
          content: `# Presentación de Clase: Dualidad Onda-Partícula\n\n**Prof. Roberto Martínez** • QuantumNova Academia\n\n## 1. El Dilema Clásico vs Cuántico\nLa física clásica concebía la materia exclusivamente como partículas discretas y la radiación como ondas continuas.\n\n## 2. Experimento de la Doble Rendija\n- **Sin detector**: Los electrones interfieren entre sí como ondas de probabilidad.\n- **Con detector**: El acto de observación colapsa la función de onda en partículas individuales que cruzan una sola rendija.\n\n## 3. Conclusión Pedagógica\nEl observador forma parte activa de la realidad cuántica. De la misma manera, en el aprendizaje activo, el alumno es quien construye el significado con sus propias notas.\n\n*Recuerden repasar este contenido antes de la evaluación programada.*`,
          createdAt: new Date()
        },
        {
          title: 'Guía de Estudio: Métodos Cognitivos y Uso de IA',
          category: 'material',
          content: `# Guía de Clase: Aprender a Aprender con Inteligencia Artificial\n\n## Principio Central\nLa Inteligencia Artificial en QuantumNova debe ser un tutor que orienta ("IA, ayúdame a comprenderlo"), no un sustituto que hace la tarea ("IA, hazlo por mí").\n\n## Reglas de Evaluación\n1. Registra apuntes durante la sesión con tus propias palabras.\n2. Al presentar el examen oficial, las notas personales quedarán protegidas para medir tu razonamiento propio.`,
          createdAt: new Date()
        }
      ],
      exams: [
        {
          title: 'Evaluación Oficial: Mecánica Cuántica y Dualidad',
          description: 'Evaluación oficial basada en las diapositivas y presentaciones vistas en clase.',
          status: 'activo',
          durationMinutes: 20,
          lockNotesDuringExam: true,
          basedOnMaterialTitle: 'Diapositivas: Dualidad Onda-Partícula y Doble Rendija',
          questions: [
            {
              question: '¿Qué fenómeno físico se observa en el experimento de la doble rendija cuando NO hay detectores activos?',
              options: [
                'Un patrón de interferencia característico de las ondas',
                'Dos únicas franjas rectas sin interferencia',
                'El colapso instantáneo de los electrones en reposo',
                'La aniquilación total de la materia'
              ],
              answer: 0,
              explanation: 'Sin detectores, las partículas exhiben comportamiento ondulatorio y generan un patrón de interferencia.'
            },
            {
              question: '¿Cuál es el propósito de basar los exámenes directamente en los materiales provistos por el docente?',
              options: [
                'Impedir que los alumnos estudien por su cuenta',
                'Alinear las evaluaciones estrictamente con los temas impartidos y evitar "eso no lo vimos en clase"',
                'Permitir que la IA apruebe automáticamente el curso',
                'Hacer exámenes más largos y complejos'
              ],
              answer: 1,
              explanation: 'Garantiza equidad pedagógica y certeza sobre los contenidos evaluados en el curso.'
            },
            {
              question: '¿Por qué se bloquean las notas personales durante el Modo Examen Seguro?',
              options: [
                'Para borrar los apuntes del alumno',
                'Para separar claramente el proceso de Estudio → Preparación → Evaluación, asegurando la aplicación real del conocimiento',
                'Para obligar al estudiante a usar IA durante la prueba',
                'Por un error técnico del sistema'
              ],
              answer: 1,
              explanation: 'Separar el estudio de la evaluación permite verificar la comprensión genuina sin depender de apoyos externos.'
            }
          ],
          createdAt: new Date()
        }
      ],
      submissions: []
    });
    console.log('Sample Community QN-FIS101 seeded successfully.');
  }
}
export { mongoose };
