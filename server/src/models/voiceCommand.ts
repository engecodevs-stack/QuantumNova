import mongoose, { Schema, Document } from 'mongoose';

export interface IVoiceCommand extends Document {
  rawText: string;
  commandType: string;
  payload?: string;
  timestamp: Date;
  status: string;
}

const VoiceCommandSchema: Schema = new Schema({
  rawText: { type: String, required: true },
  commandType: { type: String, required: true },
  payload: { type: String },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, default: 'success' }
});

export default mongoose.model<IVoiceCommand>('VoiceCommand', VoiceCommandSchema);
