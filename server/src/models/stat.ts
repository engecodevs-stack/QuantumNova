import mongoose, { Schema, Document } from 'mongoose';

export interface IStat extends Document {
  user?: mongoose.Types.ObjectId;
  date: string;
  studyMinutes: number;
  queriesAsked: number;
  notesCreated: number;
}

const StatSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  date: { type: String, required: true }, // Format YYYY-MM-DD
  studyMinutes: { type: Number, default: 0 },
  queriesAsked: { type: Number, default: 0 },
  notesCreated: { type: Number, default: 0 }
});

StatSchema.index({ date: 1, user: 1 }, { unique: true });

export default mongoose.model<IStat>('Stat', StatSchema);
