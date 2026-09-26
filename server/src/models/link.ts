import mongoose, { Schema, Document } from 'mongoose';

export interface ILink extends Document {
  source: mongoose.Types.ObjectId;
  target: mongoose.Types.ObjectId;
  label?: string;
  isManual?: boolean;
}

const LinkSchema: Schema = new Schema({
  source: { type: Schema.Types.ObjectId, ref: 'Note', required: true },
  target: { type: Schema.Types.ObjectId, ref: 'Note', required: true },
  label: { type: String, default: '' },
  isManual: { type: Boolean, default: false }
});

// Ensure a single connection between two specific notes is only recorded once
LinkSchema.index({ source: 1, target: 1 }, { unique: true });

export default mongoose.model<ILink>('Link', LinkSchema);
