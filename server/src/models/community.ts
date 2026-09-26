import mongoose, { Schema, Document } from 'mongoose';

export interface ITeacherMaterial {
  _id?: string;
  title: string;
  category: 'presentacion' | 'material' | 'apuntes' | 'actividad';
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  fileData?: string;
  createdAt: Date;
}

export interface ICommunityExam {
  _id?: string;
  title: string;
  description?: string;
  status: 'borrador' | 'activo' | 'finalizado';
  durationMinutes: number;
  lockNotesDuringExam: boolean;
  basedOnMaterialTitle?: string;
  questions: Array<{
    question: string;
    options: string[];
    answer: number;
    explanation: string;
  }>;
  createdAt: Date;
}

export interface IStudentSubmission {
  _id?: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  type: 'nota_pdf' | 'examen_resultado';
  title: string;
  content: string;
  pdfData?: string;
  fileName?: string;
  score?: number;
  submittedAt: Date;
}

export interface ICommunity extends Document {
  name: string;
  description: string;
  code: string;
  teacher: mongoose.Types.ObjectId;
  teacherName: string;
  students: mongoose.Types.ObjectId[];
  materials: ITeacherMaterial[];
  exams: ICommunityExam[];
  submissions: IStudentSubmission[];
  createdAt: Date;
}

const TeacherMaterialSchema = new Schema({
  title: { type: String, required: true },
  category: {
    type: String,
    enum: ['presentacion', 'material', 'apuntes', 'actividad'],
    default: 'presentacion'
  },
  content: { type: String, default: '' },
  fileUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  fileSize: { type: String, default: '' },
  fileType: { type: String, default: '' },
  fileData: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const CommunityExamSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: {
    type: String,
    enum: ['borrador', 'activo', 'finalizado'],
    default: 'borrador'
  },
  durationMinutes: { type: Number, default: 30 },
  lockNotesDuringExam: { type: Boolean, default: true },
  basedOnMaterialTitle: { type: String, default: '' },
  questions: [
    {
      question: { type: String, required: true },
      options: [{ type: String, required: true }],
      answer: { type: Number, required: true },
      explanation: { type: String, default: '' }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

const StudentSubmissionSchema = new Schema({
  studentId: { type: String, required: true },
  studentName: { type: String, default: 'Estudiante' },
  studentEmail: { type: String, required: true },
  type: {
    type: String,
    enum: ['nota_pdf', 'examen_resultado'],
    default: 'nota_pdf'
  },
  title: { type: String, required: true },
  content: { type: String, default: '' },
  pdfData: { type: String, default: '' },
  fileName: { type: String, default: '' },
  score: { type: Number },
  submittedAt: { type: Date, default: Date.now }
});

const CommunitySchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  code: { type: String, required: true, unique: true, uppercase: true },
  teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  teacherName: { type: String, default: 'Docente' },
  students: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  materials: [TeacherMaterialSchema],
  exams: [CommunityExamSchema],
  submissions: [StudentSubmissionSchema],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ICommunity>('Community', CommunitySchema);
