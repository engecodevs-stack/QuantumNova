import mongoose, { Schema, Document } from 'mongoose';

export interface IFolder extends Document {
  name: string;
  parent?: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const FolderSchema: Schema = new Schema({
  name: { type: String, required: true },
  parent: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
  user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now }
});

FolderSchema.index({ user: 1 });

export default mongoose.model<IFolder>('Folder', FolderSchema);
