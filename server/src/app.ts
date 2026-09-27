import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes.js';
import { ensureDbConnected, mongoose } from './db.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database connection middleware for Serverless & Long-running requests
app.use(async (req, res, next) => {
  try {
    await ensureDbConnected();
  } catch (e) {
    console.warn('DB connection check:', e);
  }
  next();
});

// Main API Routes
app.use('/api', router);

// Healthcheck endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date()
  });
});

export default app;
