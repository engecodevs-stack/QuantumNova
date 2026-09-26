import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db.js';
import router from './routes.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded presentation files
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

// Main API Routes
app.use('/api', router);

// Fallback for React app routing under /app
app.get('/app/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

// Healthcheck
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
    console.error('Failed to start QuantumNova server:', err);
    process.exit(1);
  }
}

start();
