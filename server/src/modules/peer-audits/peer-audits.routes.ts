import { Router, Request, Response } from 'express';
import { pool } from '../../config/db';
import { authenticateJWT } from '../../common/auth.middleware';

const router = Router();

// GET /api/peer-audits/:teamId - Get audits for a team
router.get('/:teamId', authenticateJWT, async (req: Request, res: Response) => {
  const teamId = req.params.teamId;

  try {
    const result = await pool.query(
      `SELECT pa.*, 
        r1.full_name as reviewer_name, 
        r2.full_name as reviewee_name
       FROM peer_audits pa
       JOIN users r1 ON pa.reviewer_id = r1.user_id
       JOIN users r2 ON pa.reviewee_id = r2.user_id
       WHERE pa.team_id = $1
       ORDER BY pa.audit_round ASC, pa.created_at DESC`,
      [teamId]
    );
    return res.json({ audits: result.rows });
  } catch (error) {
    console.error('Error fetching peer audits:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/peer-audits - Submit peer audit
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  const { team_id, reviewee_id, audit_round, comments, passed, score } = req.body;
  const reviewer_id = req.user!.userId;

  if (reviewer_id === reviewee_id) {
    return res.status(400).json({ message: 'You cannot audit yourself' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO peer_audits (team_id, reviewer_id, reviewee_id, audit_round, comments, passed, score)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [team_id, reviewer_id, reviewee_id, audit_round || 1, comments, passed ?? true, score || 10.0]
    );
    return res.status(201).json({ audit: result.rows[0] });
  } catch (error) {
    console.error('Error creating peer audit:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
