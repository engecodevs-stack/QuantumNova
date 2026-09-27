import app from './app.js';
import dotenv from 'dotenv';
import { initDb } from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5000;

// Serve uploaded presentation files locally
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Serve lobby static files
app.use(express.static(path.join(__dirname, '../../Loby')));

// Serve Gnosis static files
app.use('/gnosis', express.static(path.join(__dirname, '../../gnosis')));

// Serve client app static files
app.use('/app', express.static(path.join(__dirname, '../../client/dist')));

// Fallback for React app routing under /app
app.get('/app/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

// Root Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

async function start() {
  try {
    console.log('Initializing MongoDB Database...');
    await initDb();
    console.log('Database initialized successfully.');

    app.listen(PORT, () => {
      console.log(`QuantumNova Backend running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.warn('Backend started with database warning:', err);
    app.listen(PORT, () => {
      console.log(`QuantumNova Backend running at http://localhost:${PORT} (offline/local DB mode)`);
    });
  }
}

start();
