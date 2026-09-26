import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  fullname: string;
  username: string;
  email: string;
  password?: string;
  role: 'profe' | 'alumno';
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  fullname: { type: String, default: 'Estudiante Cuántico' },
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, default: '' },
  role: { type: String, enum: ['profe', 'alumno'], default: 'alumno' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>('User', UserSchema);
