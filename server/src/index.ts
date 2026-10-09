import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

import authRoutes from './modules/auth/auth.routes';
import coursesRoutes from './modules/courses/courses.routes';
import teamsRoutes from './modules/teams/teams.routes';
import assignmentsRoutes from './modules/assignments/assignments.routes';
import submissionsRoutes from './modules/submissions/submissions.routes';
import gradingRoutes from './modules/grading/grading.routes';
import aiTutorRoutes from './modules/ai-tutor/ai-tutor.routes';
import gitRoutes from './modules/git-analytics/git.routes';
import peerAuditsRoutes from './modules/peer-audits/peer-audits.routes';
import { pool } from './config/db';
import { gradingWorkerService } from './modules/grading/grading.worker';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration supporting CLIENT_URL or fallback
const clientUrl = process.env.CLIENT_URL;
app.use(
  cors({
    origin: clientUrl ? [clientUrl, 'http://localhost:3000'] : '*',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Healthcheck endpoint
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const dbRes = await pool.query('SELECT NOW()');
    return res.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      database: 'Connected',
      db_time: dbRes.rows[0].now,
      service: 'AITA-INTELLIGENT Core API',
      version: '1.0.0 (SWD392 Group 4)',
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'DEGRADED',
      database: 'Disconnected',
      error: error.message,
    });
  }
});

// Mount Application Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/grading', gradingRoutes);
app.use('/api/ai-tutor', aiTutorRoutes);
app.use('/api/git', gitRoutes);
app.use('/api/peer-audits', peerAuditsRoutes);

// 404 Handler for undefined routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Initialize Background BullMQ Grading Worker
gradingWorkerService.initWorker();

app.listen(PORT, () => {
  console.log(`🚀 AITA Backend Server running on http://localhost:${PORT}`);
  console.log(`🩺 Healthcheck: http://localhost:${PORT}/api/health`);
});

export default app;
