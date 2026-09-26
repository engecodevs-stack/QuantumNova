import mongoose, { Schema, Document } from 'mongoose';

export interface IGnosisLog extends Document {
  prompt: string;
  response: string;
  category: string;
  timestamp: Date;
}

const GnosisLogSchema: Schema = new Schema(
  {
    prompt: { type: String, required: true },
    response: { type: String, required: true },
    category: { type: String, default: 'General' },
    timestamp: { type: Date, default: Date.now }
  }
);

// Indexing prompt and timestamp for search and sorting
GnosisLogSchema.index({ timestamp: -1 });

export default mongoose.model<IGnosisLog>('GnosisLog', GnosisLogSchema);
