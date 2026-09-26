import mongoose, { Schema, Document } from 'mongoose';

export interface ITuningSnapshot {
  step: number;
  epoch: number;
  meanLoss: number;
}

export interface IGnosisTuningJob extends Document {
  jobId: string;
  status: 'CREATING' | 'TUNING' | 'ACTIVE' | 'FAILED';
  baseModel: string;
  epochs: number;
  learningRate: number;
  datasetSize: number;
  snapshots: ITuningSnapshot[];
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

const TuningSnapshotSchema = new Schema({
  step: { type: Number, required: true },
  epoch: { type: Number, required: true },
  meanLoss: { type: Number, required: true }
}, { _id: false });

const GnosisTuningJobSchema: Schema = new Schema(
  {
    jobId: { type: String, required: true, unique: true },
    status: { type: String, enum: ['CREATING', 'TUNING', 'ACTIVE', 'FAILED'], default: 'CREATING' },
    baseModel: { type: String, default: 'models/gemini-1.5-flash-001-tuning' },
    epochs: { type: Number, default: 5 },
    learningRate: { type: Number, default: 0.001 },
    datasetSize: { type: Number, required: true },
    snapshots: [TuningSnapshotSchema],
    errorMessage: { type: String },
    completedAt: { type: Date }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
  }
);

GnosisTuningJobSchema.index({ createdAt: -1 });

export default mongoose.model<IGnosisTuningJob>('GnosisTuningJob', GnosisTuningJobSchema);
