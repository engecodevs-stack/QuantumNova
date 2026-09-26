import mongoose, { Schema, Document } from 'mongoose';

export interface INoteImage {
  id: string;
  url: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  caption?: string;
}

export interface INote extends Document {
  title: string;
  content: string;
  tags: string[];
  folder?: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  images?: INoteImage[];
  created_at: Date;
  updated_at: Date;
}

const NoteSchema: Schema = new Schema(
  {
    title: { type: String, default: 'Sin Título' },
    content: { type: String, default: '' },
    tags: [{ type: String }],
    folder: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    images: [
      {
        id: { type: String, required: true },
        url: { type: String, required: true },
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        width: { type: Number, default: 200 },
        height: { type: Number, default: 150 },
        caption: { type: String, default: '' }
      }
    ]
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// Indexing title and tags for fast query execution
NoteSchema.index({ title: 1 });
NoteSchema.index({ tags: 1 });
NoteSchema.index({ folder: 1 });
NoteSchema.index({ user: 1 });

export default mongoose.model<INote>('Note', NoteSchema);
