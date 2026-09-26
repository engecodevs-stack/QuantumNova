import mongoose, { Schema, Document } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  description: string;
  progress: number;
  category: string;
}

const CourseSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  progress: { type: Number, default: 0 },
  category: { type: String, default: 'General' }
});

export default mongoose.model<ICourse>('Course', CourseSchema);
