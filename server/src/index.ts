import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './modules/auth/auth.routes';
import coursesRoutes from './modules/courses/courses.routes';
import assignmentsRoutes from './modules/assignments/assignments.routes';
import submissionsRoutes from './modules/submissions/submissions.routes';
import aiTutorRoutes from './modules/ai-tutor/ai-tutor.routes';
import gitRoutes from './modules/git-analytics/git.routes';
import peerAuditsRoutes from './modules/peer-audits/peer-audits.routes';
import { pool } from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Healthcheck
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

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/ai-tutor', aiTutorRoutes);
app.use('/api/git', gitRoutes);
app.use('/api/peer-audits', peerAuditsRoutes);

app.listen(PORT, () => {
  console.log(`🚀 AITA Backend Server running on http://localhost:${PORT}`);
  console.log(`🩺 Healthcheck: http://localhost:${PORT}/api/health`);
});
