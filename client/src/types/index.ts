export interface NoteImage {
  id: string;
  url: string; // base64 representation
  x: number;   // percentage
  y: number;   // percentage
  width?: number;
  height?: number;
  caption: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  images?: NoteImage[];
  created_at: string;
  updated_at: string;
  folder?: {
    id: string;
    name: string;
  } | null;
  folderId?: string | null;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  progress: number;
  category: string;
}

export interface WeeklyStat {
  date: string;
  study_minutes: number;
  queries_asked: number;
  notes_created: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: number;
  unlocked_at: string | null;
}

export interface DashboardData {
  weeklyStats: WeeklyStat[];
  achievements: Achievement[];
  totalNotes: number;
  totalStudyMinutes: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  quiz?: QuizQuestion[];
}

export interface SuggestionConnection {
  targetNoteId: string;
  reason: string;
}

export interface User {
  id: string;
  fullname: string;
  email: string;
  role?: 'profe' | 'alumno';
}

export interface TeacherMaterial {
  _id?: string;
  id?: string;
  title: string;
  category: 'presentacion' | 'material' | 'apuntes' | 'actividad';
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  fileData?: string;
  createdAt: string;
}

export interface CommunityExam {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  status: 'borrador' | 'activo' | 'finalizado' | 'pausado';
  durationMinutes: number;
  lockNotesDuringExam: boolean;
  basedOnMaterialTitle?: string;
  questions: QuizQuestion[];
  createdAt: string;
}

export interface StudentSubmission {
  _id?: string;
  id?: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  type: 'nota_pdf' | 'examen_resultado';
  title: string;
  content: string;
  pdfData?: string;
  fileName?: string;
  score?: number;
  submittedAt: string;
}

export interface Community {
  _id: string;
  id?: string;
  name: string;
  description: string;
  code: string;
  teacher: any;
  teacherName: string;
  students: any[];
  materials: TeacherMaterial[];
  exams: CommunityExam[];
  submissions: StudentSubmission[];
  createdAt: string;
}

export type ViewType =
  | 'chat'
  | 'courses'
  | 'communities'
  | 'teacher'
  | 'notes'
  | 'map'
  | 'library'
  | 'settings';
