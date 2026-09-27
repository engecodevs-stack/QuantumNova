import { Router, Request, Response } from 'express';
import Note from './models/note.js';
import Folder from './models/folder.js';
import Link from './models/link.js';
import Course from './models/course.js';
import Stat from './models/stat.js';
import User from './models/user.js';
import VoiceCommand from './models/voiceCommand.js';
import History from './models/history.js';
import GnosisLog from './models/gnosisLog.js';
import GnosisTuningJob from './models/gnosisTuning.js';
import Community from './models/community.js';
import mongoose from 'mongoose';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  chatWithTutor,
  explainConcept,
  generateQuiz,
  generateSummary,
  suggestMindMapConnections,
  generateLibraryRecommendations,
  generateExamFromTeacherMaterial
} from './aiService.js';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const router = Router();

async function syncAllLinks(userId?: string) {
  try {
    const filter = (userId && mongoose.Types.ObjectId.isValid(userId))
      ? { user: new mongoose.Types.ObjectId(userId) }
      : {};
    const notes = await Note.find(filter, '_id title content');
    const currentLinkPairs: Array<{ source: string; target: string }> = [];
    
    for (const note of notes) {
      const regex = /\[\[(.*?)\]\]/g;
      let match;
      const linkedTitles: string[] = [];
      
      while ((match = regex.exec(note.content)) !== null) {
        const rawMatch = match[1].trim();
        const parts = rawMatch.split('|');
        const title = parts[0].trim();
        if (title && !linkedTitles.includes(title)) {
          linkedTitles.push(title);
        }
      }

      for (const title of linkedTitles) {
        const targetNote = notes.find(
          t => t.title.toLowerCase() === title.toLowerCase()
        );
        if (targetNote) {
          const sId = note._id.toString();
          const tId = targetNote._id.toString();
          currentLinkPairs.push({ source: sId, target: tId });

          const existing = await Link.findOne({ source: note._id, target: targetNote._id });
          if (!existing) {
            try {
              await Link.create({
                source: note._id,
                target: targetNote._id,
                isManual: false
              });
            } catch (err) {
              // Ignore unique constraints
            }
          }
        }
      }
    }

    const noteIds = notes.map(n => n._id);
    const allLinks = await Link.find({ isManual: false, source: { $in: noteIds }, target: { $in: noteIds } });
    for (const link of allLinks) {
      const stillExists = currentLinkPairs.some(
        pair => pair.source === link.source.toString() && pair.target === link.target.toString()
      );
      if (!stillExists) {
        await Link.deleteOne({ _id: link._id });
      }
    }
  } catch (err) {
    console.error('Error syncing links:', err);
  }
}

// 1. NOTES ENDPOINTS
router.get('/notes', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const filter = userId ? { user: new mongoose.Types.ObjectId(userId) } : {};
    const notes = await Note.find(filter).sort({ updated_at: -1 }).populate('folder');
    res.json(notes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/notes/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const note = await Note.findById(req.params.id).populate('folder');
    if (!note) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }
    if (userId && note.user && note.user.toString() !== userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    res.json(note);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/notes', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { title, content, tags, folderId, images } = req.body;
    const now = new Date();
    
    const noteData: any = {
      title: title || 'Sin Título',
      content: content || '',
      tags: tags || [],
      images: images || []
    };

    if (folderId && mongoose.Types.ObjectId.isValid(folderId)) {
      noteData.folder = new mongoose.Types.ObjectId(folderId);
    }
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      noteData.user = new mongoose.Types.ObjectId(userId);
    }

    const newNote = await Note.create(noteData);
    await syncAllLinks(userId);
    
    // Update stats: notes created
    const today = now.toISOString().split('T')[0];
    const statQuery: any = { date: today };
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      statQuery.user = new mongoose.Types.ObjectId(userId);
    }
    await Stat.findOneAndUpdate(
      statQuery,
      { $inc: { notesCreated: 1 } },
      { upsert: true }
    );

    // Log history
    await History.create({
      note: newNote._id,
      action: 'create',
      details: `Nota creada: ${newNote.title}`
    });

    const populated = await Note.findById(newNote._id).populate('folder');
    res.status(201).json(populated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/notes/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { title, content, tags, folderId, images } = req.body;
    
    const existing = await Note.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }

    if (userId && existing.user && existing.user.toString() !== userId) {
      return res.status(403).json({ error: 'No autorizado para editar esta nota' });
    }

    existing.title = title || 'Sin Título';
    existing.content = content || '';
    existing.tags = tags || [];
    existing.images = images || [];
    
    if (folderId && mongoose.Types.ObjectId.isValid(folderId)) {
      existing.folder = new mongoose.Types.ObjectId(folderId);
    } else if (folderId === null || folderId === '') {
      existing.folder = undefined;
    }

    await existing.save();
    await syncAllLinks(userId);

    // Log history
    await History.create({
      note: existing._id,
      action: 'update',
      details: `Nota actualizada: ${existing.title}`
    });

    const populated = await Note.findById(existing._id).populate('folder');
    res.json(populated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/notes/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const noteId = req.params.id;
    const note = await Note.findById(noteId);
    if (note) {
      if (userId && note.user && note.user.toString() !== userId) {
        return res.status(403).json({ error: 'No autorizado' });
      }
      // Log history
      await History.create({
        action: 'delete',
        details: `Nota eliminada: ${note.title}`
      });
      await Note.findByIdAndDelete(noteId);
    }
    await Link.deleteMany({ $or: [{ source: noteId }, { target: noteId }] });
    res.json({ success: true, message: 'Nota eliminada' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/notes/bulk-delete', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: 'Array of ids is required' });
    }
    const deletedNotes = await Note.find({ _id: { $in: ids } });
    for (const note of deletedNotes) {
      if (userId && note.user && note.user.toString() !== userId) {
        return res.status(403).json({ error: 'No autorizado' });
      }
      await History.create({
        action: 'delete',
        details: `Nota eliminada en lote: ${note.title}`
      });
    }
    await Note.deleteMany({ _id: { $in: ids } });
    await Link.deleteMany({ $or: [{ source: { $in: ids } }, { target: { $in: ids } }] });
    res.json({ success: true, message: 'Notas eliminadas' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. FOLDERS ENDPOINTS
router.get('/folders', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const filter = userId ? { user: new mongoose.Types.ObjectId(userId) } : {};
    const folders = await Folder.find(filter).sort({ name: 1 });
    res.json(folders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/folders', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { name, parentId } = req.body;
    const folderData: any = { name };
    
    if (parentId && mongoose.Types.ObjectId.isValid(parentId)) {
      folderData.parent = new mongoose.Types.ObjectId(parentId);
    }
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      folderData.user = new mongoose.Types.ObjectId(userId);
    }

    const newFolder = await Folder.create(folderData);
    res.status(201).json(newFolder);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/folders/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const folderId = req.params.id;
    const folder = await Folder.findById(folderId);
    if (folder) {
      if (userId && folder.user && folder.user.toString() !== userId) {
        return res.status(403).json({ error: 'No autorizado' });
      }
      await Folder.findByIdAndDelete(folderId);
      // Unset folder for notes inside this folder
      await Note.updateMany({ folder: folderId }, { $unset: { folder: 1 } });
    }
    res.json({ success: true, message: 'Carpeta eliminada' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. KNOWLEDGE GRAPH ENDPOINT
router.get('/graph', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const filter = userId ? { user: new mongoose.Types.ObjectId(userId) } : {};
    const notes = await Note.find(filter, '_id title tags');
    const noteIds = notes.map(n => n._id);
    const links = await Link.find({ source: { $in: noteIds }, target: { $in: noteIds } });
    
    const nodes = notes.map((note, index) => {
      const angle = (index / notes.length) * 2 * Math.PI;
      const radius = 250 + Math.random() * 50;
      const x = Math.cos(angle) * radius + 400;
      const y = Math.sin(angle) * radius + 300;
      
      return {
        id: note._id.toString(),
        type: 'customNote',
        data: {
          label: note.title,
          tags: note.tags
        },
        position: { x, y }
      };
    });

    const edges = links.map((link) => ({
      id: link._id.toString(),
      source: link.source.toString(),
      target: link.target.toString(),
      label: link.label || '',
      isManual: link.isManual || false,
      animated: true,
      style: { stroke: '#94A3B8', strokeWidth: 1.5 }
    }));

    res.json({ nodes, edges });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3.1. MANUAL LINK ENDPOINTS
router.post('/links', async (req: Request, res: Response) => {
  try {
    const { source, target, label } = req.body;
    
    // Check if link already exists
    const existing = await Link.findOne({
      $or: [
        { source: new mongoose.Types.ObjectId(source), target: new mongoose.Types.ObjectId(target) },
        { source: new mongoose.Types.ObjectId(target), target: new mongoose.Types.ObjectId(source) }
      ]
    });
    
    if (existing) {
      if (label !== undefined) {
        existing.label = label;
      }
      existing.isManual = true;
      await existing.save();
      return res.status(200).json(existing);
    }

    const newLink = await Link.create({
      source: new mongoose.Types.ObjectId(source),
      target: new mongoose.Types.ObjectId(target),
      label: label || '',
      isManual: true
    });
    
    res.status(201).json(newLink);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/links/:id', async (req: Request, res: Response) => {
  try {
    const { label } = req.body;
    const updated = await Link.findByIdAndUpdate(
      req.params.id,
      { label, isManual: true },
      { new: true }
    );
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/links/:id', async (req: Request, res: Response) => {
  try {
    await Link.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Enlace eliminado con éxito' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. COURSES ENDPOINTS
router.get('/courses', async (req: Request, res: Response) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/courses/:id/progress', async (req: Request, res: Response) => {
  try {
    const { progress } = req.body;
    await Course.findByIdAndUpdate(req.params.id, { progress });
    res.json({ success: true, progress });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. STATS & DASHBOARD ENDPOINTS
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const notesFilter = userId ? { user: new mongoose.Types.ObjectId(userId) } : {};
    const totalNotes = await Note.countDocuments(notesFilter);

    const statsFilter = userId ? { user: new mongoose.Types.ObjectId(userId) } : {};
    const stats = await Stat.find(statsFilter).sort({ date: -1 }).limit(7);
    
    const totalStudy = await Stat.aggregate([
      { $match: userId ? { user: new mongoose.Types.ObjectId(userId) } : {} },
      { $group: { _id: null, sum: { $sum: '$studyMinutes' } } }
    ]);
    const totalStudyMinutes = totalStudy[0]?.sum || 0;

    res.json({
      weeklyStats: stats.reverse(),
      achievements: [], // Empty since we deleted achievements/gamification
      totalNotes,
      totalStudyMinutes
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/stats/study', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { minutes } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    const query: any = { date: today };
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.user = new mongoose.Types.ObjectId(userId);
    }
    
    const stat = await Stat.findOneAndUpdate(
      query,
      { $inc: { studyMinutes: minutes } },
      { new: true, upsert: true }
    );

    res.json({ success: true, today, minutesAdded: minutes, stat });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Logging voice commands
router.post('/voice-commands', async (req: Request, res: Response) => {
  try {
    const { rawText, commandType, payload, status } = req.body;
    const log = await VoiceCommand.create({
      rawText,
      commandType,
      payload,
      status
    });
    res.json({ success: true, log });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. AI ENDPOINTS
router.post('/ai/chat', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { message, history, contextNotes } = req.body;
    const response = await chatWithTutor(message, history, contextNotes, userId);
    
    // Update stats: queries asked
    const today = new Date().toISOString().split('T')[0];
    const statQuery: any = { date: today };
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      statQuery.user = new mongoose.Types.ObjectId(userId);
    }
    await Stat.findOneAndUpdate(
      statQuery,
      { $inc: { queriesAsked: 1 } },
      { upsert: true }
    );

    res.json({ response });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ai/explain', async (req: Request, res: Response) => {
  try {
    const { concept } = req.body;
    const explanation = await explainConcept(concept);
    res.json({ explanation });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ai/quiz', async (req: Request, res: Response) => {
  try {
    const { concept } = req.body;
    const quiz = await generateQuiz(concept);
    res.json({ quiz });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ai/summary', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    const summary = await generateSummary(content);
    res.json({ summary });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/ai/library', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const cards = await generateLibraryRecommendations(userId);
    res.json({ cards });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ai/suggest-connections', async (req: Request, res: Response) => {
  try {
    const { noteTitle, noteContent } = req.body;
    const allNotes = await Note.find({}, '_id title');
    const suggestions = await suggestMindMapConnections(
      noteTitle,
      noteContent,
      allNotes.map(n => ({ id: n._id.toString(), title: n.title }))
    );
    res.json({ suggestions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. AUTH ENDPOINTS (MONGODB)
router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { fullname, email, password } = req.body;
    if (!fullname || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        dbConnected: false,
        error: 'Base de datos MongoDB no disponible. Configura la variable MONGODB_URI en Vercel con tu cadena de MongoDB Atlas.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
    }

    const isProfe = cleanEmail.endsWith('@profe.edu.mx');
    const role = isProfe ? 'profe' : 'alumno';

    const pwdHash = hashPassword(password);
    const newUser = await User.create({
      fullname: fullname.trim(),
      username: cleanEmail.split('@')[0],
      email: cleanEmail,
      password: pwdHash,
      role
    });

    res.status(201).json({
      success: true,
      user: {
        id: newUser._id.toString(),
        fullname: newUser.fullname,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contraseña requeridos' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        dbConnected: false,
        error: 'Base de datos MongoDB no disponible. Configura la variable MONGODB_URI en Vercel con tu cadena de MongoDB Atlas.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const pwdHash = hashPassword(password);
    if (user.password !== pwdHash) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Determine & sync role
    const expectedRole = cleanEmail.endsWith('@profe.edu.mx') ? 'profe' : 'alumno';
    if (user.role !== expectedRole) {
      user.role = expectedRole;
      await user.save();
    }

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        fullname: user.fullname,
        email: user.email,
        role: user.role
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. COMUNIDADES Y PORTAL DOCENTE (QUANTUM NOVA)
// ==========================================

// List communities owned by teacher
router.get('/teacher/communities', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    const communities = await Community.find({ teacher: new mongoose.Types.ObjectId(userId) })
      .populate('students', 'fullname email')
      .sort({ createdAt: -1 });
    res.json(communities);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create community with unique invite code
router.post('/teacher/communities', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'El nombre de la comunidad es obligatorio' });
    }
    const user = userId && mongoose.Types.ObjectId.isValid(userId) ? await User.findById(userId) : null;
    const randomCode = 'QN-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const community = await Community.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      code: randomCode,
      teacher: user?._id || new mongoose.Types.ObjectId(userId),
      teacherName: user?.fullname || 'Docente QuantumNova',
      students: [],
      materials: [],
      exams: [],
      submissions: []
    });
    res.status(201).json(community);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete community by teacher
router.delete('/teacher/communities/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }
    if (userId && community.teacher && community.teacher.toString() !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta comunidad' });
    }
    await Community.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Comunidad eliminada correctamente' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add presentation / class material
router.post('/teacher/communities/:id/materials', async (req: Request, res: Response) => {
  try {
    const { title, category, content, fileUrl, fileName, fileSize, fileType, fileData } = req.body;
    if (!title || (!content && !fileName && !fileData)) {
      return res.status(400).json({ error: 'Título y contenido o archivo de presentación son obligatorios' });
    }
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }

    let savedFileUrl = fileUrl || '';
    if (fileData && typeof fileData === 'string' && fileData.startsWith('data:')) {
      try {
        const matches = fileData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const ext = path.extname(fileName || '') || (matches[1].includes('pdf') ? '.pdf' : '.pptx');
          const safeName = `presentation_${Date.now()}_${Math.random().toString(36).slice(2, 7)}${ext}`;
          const uploadsDir = path.join(process.cwd(), 'uploads');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          const filePath = path.join(uploadsDir, safeName);
          const buffer = Buffer.from(matches[2], 'base64');
          fs.writeFileSync(filePath, buffer);
          savedFileUrl = `/uploads/${safeName}`;
        }
      } catch (fileErr) {
        console.error('Error saving presentation file to disk:', fileErr);
      }
    }

    community.materials.push({
      title: title.trim(),
      category: category || 'presentacion',
      content: (content || `Presentación de clase cargada: ${fileName || 'Archivo adjunto'}`).trim(),
      fileUrl: savedFileUrl,
      fileName: fileName || '',
      fileSize: fileSize || '',
      fileType: fileType || '',
      fileData: fileData && fileData.length < 500000 ? fileData : '',
      createdAt: new Date()
    });
    await community.save();
    const updated = await Community.findById(community._id).populate('students', 'fullname email');
    res.status(201).json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete presentation / material
router.delete('/teacher/communities/:id/materials/:materialId', async (req: Request, res: Response) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }
    community.materials = community.materials.filter(m => m._id?.toString() !== req.params.materialId);
    await community.save();
    const updated = await Community.findById(community._id).populate('students', 'fullname email');
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Generate evaluation via AI strictly based on teacher material
router.post('/teacher/communities/:id/generate-exam', async (req: Request, res: Response) => {
  try {
    const { materialId, materialTitle, materialContent, numQuestions } = req.body;
    let title = materialTitle;
    let content = materialContent;

    if (materialId && (!title || !content)) {
      const community = await Community.findById(req.params.id);
      const mat = community?.materials.find(m => m._id?.toString() === materialId);
      if (mat) {
        title = mat.title;
        content = mat.content;
      }
    }

    if (!content) {
      return res.status(400).json({ error: 'Se requiere contenido de clase para generar la evaluación' });
    }

    const questions = await generateExamFromTeacherMaterial(content, title || 'Clase', numQuestions || 3);
    res.json({ success: true, questions, basedOn: title });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save exam to community
router.post('/teacher/communities/:id/exams', async (req: Request, res: Response) => {
  try {
    const { title, description, durationMinutes, lockNotesDuringExam, questions, basedOnMaterialTitle } = req.body;
    if (!title || !questions || !questions.length) {
      return res.status(400).json({ error: 'Título y preguntas son requeridos' });
    }
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }
    community.exams.push({
      title: title.trim(),
      description: description ? description.trim() : '',
      status: 'borrador',
      durationMinutes: durationMinutes || 30,
      lockNotesDuringExam: lockNotesDuringExam !== false,
      basedOnMaterialTitle: basedOnMaterialTitle || '',
      questions,
      createdAt: new Date()
    });
    await community.save();
    const updated = await Community.findById(community._id).populate('students', 'fullname email');
    res.status(201).json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update exam status (active, draft, completed) and note locking
router.put('/teacher/communities/:id/exams/:examId/status', async (req: Request, res: Response) => {
  try {
    const { status, lockNotesDuringExam } = req.body;
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }
    const exam = community.exams.find(e => e._id?.toString() === req.params.examId);
    if (!exam) {
      return res.status(404).json({ error: 'Examen no encontrado' });
    }
    if (status) exam.status = status;
    if (typeof lockNotesDuringExam === 'boolean') exam.lockNotesDuringExam = lockNotesDuringExam;
    await community.save();
    const updated = await Community.findById(community._id).populate('students', 'fullname email');
    res.json({ success: true, community: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an exam
router.delete('/teacher/communities/:id/exams/:examId', async (req: Request, res: Response) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }
    community.exams = community.exams.filter(e => e._id?.toString() !== req.params.examId) as any;
    await community.save();
    const updated = await Community.findById(community._id).populate('students', 'fullname email');
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Duplicate an exam
router.post('/teacher/communities/:id/exams/:examId/duplicate', async (req: Request, res: Response) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }
    const exam = community.exams.find(e => e._id?.toString() === req.params.examId);
    if (!exam) {
      return res.status(404).json({ error: 'Examen no encontrado' });
    }
    const duplicatedExam = {
      title: `${exam.title} (Copia)`,
      description: exam.description || '',
      status: 'borrador',
      durationMinutes: exam.durationMinutes || 30,
      lockNotesDuringExam: exam.lockNotesDuringExam,
      basedOnMaterialTitle: exam.basedOnMaterialTitle || '',
      questions: exam.questions,
      createdAt: new Date()
    };
    community.exams.push(duplicatedExam as any);
    await community.save();
    const updated = await Community.findById(community._id).populate('students', 'fullname email');
    res.status(201).json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update exam details
router.put('/teacher/communities/:id/exams/:examId', async (req: Request, res: Response) => {
  try {
    const { title, description, durationMinutes, lockNotesDuringExam, status } = req.body;
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }
    const exam = community.exams.find(e => e._id?.toString() === req.params.examId);
    if (!exam) {
      return res.status(404).json({ error: 'Examen no encontrado' });
    }
    if (title) exam.title = title.trim();
    if (description !== undefined) exam.description = description.trim();
    if (durationMinutes) exam.durationMinutes = durationMinutes;
    if (typeof lockNotesDuringExam === 'boolean') exam.lockNotesDuringExam = lockNotesDuringExam;
    if (status) exam.status = status;
    await community.save();
    const updated = await Community.findById(community._id).populate('students', 'fullname email');
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Student: List enrolled communities
router.get('/student/communities', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    const userObjId = new mongoose.Types.ObjectId(userId);
    const communities = await Community.find({ students: userObjId })
      .populate('teacher', 'fullname email')
      .sort({ createdAt: -1 });
    res.json(communities);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Student: Join community by code
router.post('/student/communities/join', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { code } = req.body;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    if (!code) {
      return res.status(400).json({ error: 'Código de comunidad requerido' });
    }
    const cleanCode = code.trim().toUpperCase();
    const community = await Community.findOne({ code: cleanCode });
    if (!community) {
      return res.status(404).json({ error: 'No se encontró ninguna comunidad con el código ' + cleanCode });
    }
    const userObjId = new mongoose.Types.ObjectId(userId);
    if (!community.students.some(s => s.toString() === userId)) {
      community.students.push(userObjId);
      await community.save();
    }
    res.json({ success: true, community });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Student: Leave community (unenroll)
router.post('/student/communities/:id/leave', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }
    community.students = community.students.filter(s => s.toString() !== userId);
    await community.save();
    res.json({ success: true, message: 'Te has dado de baja de la comunidad' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Student: Submit note / PDF to community
router.post('/student/communities/:id/submit-note', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { title, content, pdfData, fileName } = req.body;
    const user = userId && mongoose.Types.ObjectId.isValid(userId) ? await User.findById(userId) : null;
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }
    community.submissions.unshift({
      studentId: userId || 'anonymous',
      studentName: user?.fullname || 'Estudiante',
      studentEmail: user?.email || '',
      type: 'nota_pdf',
      title: title || 'Nota de clase (PDF)',
      content: content || '',
      pdfData: pdfData || '',
      fileName: fileName || '',
      submittedAt: new Date()
    });
    await community.save();
    res.json({ success: true, message: 'Nota enviada correctamente en formato PDF al docente' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Student: Submit exam results
router.post('/student/communities/:id/submit-exam', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { examId, examTitle, score, totalQuestions, answers } = req.body;
    const user = userId && mongoose.Types.ObjectId.isValid(userId) ? await User.findById(userId) : null;
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }
    community.submissions.push({
      studentId: userId || 'anonymous',
      studentName: user?.fullname || 'Estudiante',
      studentEmail: user?.email || '',
      type: 'examen_resultado',
      title: `Evaluación: ${examTitle || 'Examen'} (${score}/${totalQuestions})`,
      content: JSON.stringify({ examId, score, totalQuestions, answers }),
      score,
      submittedAt: new Date()
    });
    await community.save();
    res.json({ success: true, score, totalQuestions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Student: Check if personal notes should be locked during active exam
router.get('/student/active-exam-lock', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.json({ locked: false });
    }
    const userObjId = new mongoose.Types.ObjectId(userId);
    const communities = await Community.find({
      students: userObjId,
      'exams.status': 'activo',
      'exams.lockNotesDuringExam': true
    });
    if (communities.length > 0) {
      const activeExam = communities[0].exams.find(e => e.status === 'activo' && e.lockNotesDuringExam);
      return res.json({
        locked: true,
        communityName: communities[0].name,
        examTitle: activeExam?.title || 'Evaluación en Curso'
      });
    }
    res.json({ locked: false });
  } catch (err: any) {
    res.json({ locked: false });
  }
});

// ==========================================
// GNOSIS DATASET ENDPOINTS
// ==========================================

const defaultGnosisQA = [
  {
    prompt: "Hola",
    response: "¡Hola! Soy Quantum, tu tutor de estudio. ¿En qué te puedo ayudar hoy?",
    category: "Tutor"
  },
  {
    prompt: "¿Qué es la Inteligencia Artificial?",
    response: "La Inteligencia Artificial es el campo de la informática dedicado a crear sistemas capaces de realizar tareas que requerirían inteligencia humana.",
    category: "Tutor"
  },
  {
    prompt: "¿Cómo funciona una red neuronal?",
    response: "Una red neuronal procesa información a través de capas de nodos interconectados que ajustan sus pesos durante el entrenamiento para detectar patrones.",
    category: "Tutor"
  },
  {
    prompt: "¿Qué es el aprendizaje supervisado?",
    response: "Es un tipo de aprendizaje automático donde el modelo se entrena con datos etiquetados, aprendiendo a mapear entradas a salidas correctas.",
    category: "Tutor"
  },
  {
    prompt: "¿Para qué sirve un mapa conceptual?",
    response: "Sirve para organizar y representar de manera gráfica y jerárquica las relaciones lógicas entre diferentes conceptos.",
    category: "Mapa Conceptual"
  },
  {
    prompt: "¿Qué es Obsidian?",
    response: "Obsidian es una aplicación de notas vinculadas que permite construir un segundo cerebro digital mediante un grafo de conexiones bidireccionales.",
    category: "Mapa Conceptual"
  },
  {
    prompt: "Adiós",
    response: "¡Hasta luego! Recuerda seguir organizando tus ideas y estudiando de forma activa.",
    category: "Tutor"
  },
  {
    prompt: "¿Qué es una neurona artificial?",
    response: "Es una unidad matemática que recibe entradas con pesos, calcula una suma ponderada, le aplica una función de activación y produce una salida.",
    category: "Tutor"
  },
  {
    prompt: "¿Qué es el sobreajuste u overfitting?",
    response: "El sobreajuste ocurre cuando un modelo de IA aprende tan bien los datos de entrenamiento que falla al intentar generalizar con datos nuevos.",
    category: "Tutor"
  },
  {
    prompt: "¿Qué es la retropropagación o backpropagation?",
    response: "Es el algoritmo utilizado para entrenar redes neuronales calculando el gradiente del error y ajustando los pesos de atrás hacia adelante.",
    category: "Tutor"
  }
];

// GET: Fetch all logs. If empty, auto-populate with defaults first.
router.get('/gnosis/dataset', async (req: Request, res: Response) => {
  try {
    let count = await GnosisLog.countDocuments();
    if (count === 0) {
      console.log('GnosisLog collection is empty. Populating default QA dataset...');
      await GnosisLog.insertMany(defaultGnosisQA);
    }
    const dataset = await GnosisLog.find().sort({ timestamp: 1 });
    res.json(dataset);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Add a new custom prompt-response pair
router.post('/gnosis/dataset', async (req: Request, res: Response) => {
  try {
    const { prompt, response, category } = req.body;
    if (!prompt || !response) {
      return res.status(400).json({ error: "Faltan los campos 'prompt' o 'response'" });
    }
    const newLog = await GnosisLog.create({
      prompt,
      response,
      category: category || 'Manual'
    });
    res.status(201).json(newLog);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Clear the dataset, optionally reloading defaults
router.post('/gnosis/clear', async (req: Request, res: Response) => {
  try {
    const { reloadDefaults } = req.body;
    await GnosisLog.deleteMany({});
    if (reloadDefaults) {
      await GnosisLog.insertMany(defaultGnosisQA);
    }
    res.json({ success: true, message: "Dataset de Gnosis actualizado correctamente" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Trigger Gemini model fine-tuning
router.post('/gnosis/tune', async (req: Request, res: Response) => {
  try {
    const { epochs, learningRate } = req.body;
    const numEpochs = epochs ? parseInt(epochs) : 5;
    const lr = learningRate ? parseFloat(learningRate) : 0.001;

    // Retrieve all logs from MongoDB
    const logs = await GnosisLog.find();
    if (logs.length < 10) {
      return res.status(400).json({ error: 'Se requieren al menos 10 registros de interacciones para entrenar el modelo.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    // Check if we want to call the real Gemini API
    if (apiKey && !apiKey.startsWith('AIzaSyFake') && apiKey.length > 15) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/tunedModels?key=${apiKey}`;
        const displayName = `gnosis-tuning-${Date.now()}`;
        
        // Format dataset examples
        const examples = logs.map(log => ({
          textInput: log.prompt,
          output: log.response
        }));

        const googlePayload = {
          displayName,
          baseModel: "models/gemini-1.5-flash-001-tuning",
          tuningTask: {
            hyperparameters: {
              epochCount: numEpochs,
              batchSize: 4,
              learningRate: lr
            },
            trainingData: {
              dataset: {
                examples: {
                  examples
                }
              }
            }
          }
        };

        const googleResponse = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(googlePayload)
        });

        if (googleResponse.ok) {
          const googleData = await googleResponse.json() as any;
          const name = googleData.metadata?.tunedModel || googleData.name || `tunedModels/gnosis-model-${Date.now()}`;
          const jobId = name.replace('tunedModels/', '');

          await GnosisTuningJob.create({
            jobId,
            status: 'CREATING',
            baseModel: 'models/gemini-1.5-flash-001-tuning',
            epochs: numEpochs,
            learningRate: lr,
            datasetSize: logs.length,
            snapshots: []
          });

          return res.json({ success: true, jobId, simulated: false });
        } else {
          const errText = await googleResponse.text();
          console.warn('Google Tuning API returned error, falling back to simulation:', errText);
        }
      } catch (googleErr) {
        console.error('Error contacting Google Tuning API, falling back to simulation:', googleErr);
      }
    }

    // FALLBACK: Simulation mode (Mock Job)
    const jobId = `mock_tuning_${Date.now()}`;
    await GnosisTuningJob.create({
      jobId,
      status: 'CREATING',
      epochs: numEpochs,
      learningRate: lr,
      datasetSize: logs.length,
      snapshots: []
    });

    res.json({ success: true, jobId, simulated: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Check status of a tuning job
router.get('/gnosis/tune/status/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = await GnosisTuningJob.findOne({ jobId });
    if (!job) {
      return res.status(404).json({ error: 'Trabajo de entrenamiento no encontrado.' });
    }

    // If it's a simulated job, progress it based on time elapsed
    if (jobId.startsWith('mock_tuning_')) {
      const elapsedSeconds = (Date.now() - job.createdAt.getTime()) / 1000;
      
      if (job.status !== 'ACTIVE' && job.status !== 'FAILED') {
        if (elapsedSeconds < 8) {
          job.status = 'CREATING';
        } else if (elapsedSeconds < 45) {
          job.status = 'TUNING';
          
          // Generate simulated snapshots over time
          const totalSteps = job.epochs * 10;
          const currentProgressRatio = Math.min(1, (elapsedSeconds - 8) / 37);
          const currentStep = Math.floor(currentProgressRatio * totalSteps);
          
          const newSnapshots = [];
          for (let step = 1; step <= currentStep; step++) {
            const epoch = Math.ceil(step / 10);
            const meanLoss = 1.5 * Math.exp(-step / (totalSteps / 2.5)) + Math.random() * 0.05 + 0.02;
            newSnapshots.push({ step, epoch, meanLoss });
          }
          job.snapshots = newSnapshots;
        } else {
          job.status = 'ACTIVE';
          job.completedAt = new Date();
          
          // Populate all final snapshots
          const totalSteps = job.epochs * 10;
          const newSnapshots = [];
          for (let step = 1; step <= totalSteps; step++) {
            const epoch = Math.ceil(step / 10);
            const meanLoss = 1.5 * Math.exp(-step / (totalSteps / 2.5)) + Math.random() * 0.03 + 0.01;
            newSnapshots.push({ step, epoch, meanLoss });
          }
          job.snapshots = newSnapshots;
        }
        await job.save();
      }
      return res.json(job);
    }

    // If it's a real Google job, poll the Google API
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && !apiKey.startsWith('AIzaSyFake') && apiKey.length > 15) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/tunedModels/${jobId}?key=${apiKey}`;
        const googleResponse = await fetch(url);
        if (googleResponse.ok) {
          const googleData = await googleResponse.json() as any;
          
          let newStatus: 'CREATING' | 'TUNING' | 'ACTIVE' | 'FAILED' = 'CREATING';
          if (googleData.state === 'ACTIVE') {
            newStatus = 'ACTIVE';
          } else if (googleData.state === 'FAILED') {
            newStatus = 'FAILED';
          } else if (googleData.state === 'CREATING') {
            const snap = googleData.tuningTask?.snapshots;
            if (snap && snap.length > 0) {
              newStatus = 'TUNING';
            } else {
              newStatus = 'CREATING';
            }
          }

          job.status = newStatus;
          
          if (googleData.tuningTask?.snapshots) {
            job.snapshots = googleData.tuningTask.snapshots.map((snap: any) => ({
              step: snap.step || 0,
              epoch: snap.epoch || 0,
              meanLoss: snap.meanLoss || 0
            }));
          }

          if (newStatus === 'ACTIVE') {
            job.completedAt = new Date();
          } else if (newStatus === 'FAILED') {
            job.errorMessage = googleData.error?.message || 'Error de Google API en la afinación';
          }

          await job.save();
        }
      } catch (googleErr: any) {
        console.error('Error polling real tuned model status:', googleErr);
      }
    }

    res.json(job);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
