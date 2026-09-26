import mongoose, { Schema, Document } from 'mongoose';

export interface IHistory extends Document {
  note?: mongoose.Types.ObjectId;
  action: string;
  details: string;
  timestamp: Date;
}

const HistorySchema: Schema = new Schema({
  note: { type: Schema.Types.ObjectId, ref: 'Note' },
  action: { type: String, required: true },
  details: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model<IHistory>('History', HistorySchema);
