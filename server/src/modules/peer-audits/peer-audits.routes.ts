import { Router, Request, Response } from 'express';
import { pool } from '../../config/db';
import { authenticateJWT } from '../../common/auth.middleware';

const router = Router();

/**
 * GET /api/peer-audits/:teamId
 * Retrieve all peer audits for a team
 */
router.get('/:teamId', authenticateJWT, async (req: Request, res: Response) => {
  const teamId = Number(req.params.teamId);

  try {
    const result = await pool.query(
      `SELECT pa.reviewee_id, pa.score, pa.comments, pa.audit_round,
        r2.full_name as reviewee_name,
        r2.email as reviewee_email
       FROM peer_audits pa
       JOIN users r1 ON pa.reviewer_id = r1.user_id
       JOIN users r2 ON pa.reviewee_id = r2.user_id
       WHERE pa.team_id = $1
       ORDER BY pa.audit_round ASC, pa.created_at DESC`,
      [teamId]
    );
    return res.json({ audits: result.rows.map(({ reviewer_id, reviewer_name, reviewer_email, ...audit }) => audit) });
  } catch (error: any) {
    console.error('Error fetching peer audits:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

/**
 * GET /api/peer-audits/team/:teamId/summary
 * Aggregate average peer audit scores and feedback per member (BR-08)
 */
router.get('/team/:teamId/summary', authenticateJWT, async (req: Request, res: Response) => {
  const teamId = Number(req.params.teamId);

  try {
    const summaryRes = await pool.query(
      `SELECT 
        u.user_id,
        u.full_name,
        u.email,
        tm.assigned_module,
        COUNT(pa.audit_id)::int as total_reviews_received,
        COALESCE(ROUND(AVG(pa.score)::numeric, 2), 0.0) as average_score,
        COALESCE(bool_and(pa.passed), true) as peer_consensus_passed,
        json_agg(
          json_build_object(
            'score', pa.score,
            'comments', pa.comments,
            'audit_round', pa.audit_round,
            'created_at', pa.created_at
          )
        ) FILTER (WHERE pa.audit_id IS NOT NULL) as feedback_comments
       FROM team_members tm
       JOIN users u ON tm.user_id = u.user_id
       LEFT JOIN peer_audits pa ON pa.reviewee_id = u.user_id AND pa.team_id = tm.team_id
       WHERE tm.team_id = $1
       GROUP BY u.user_id, u.full_name, u.email, tm.assigned_module
       ORDER BY average_score DESC`,
      [teamId]
    );

    const summaries = summaryRes.rows.map((row) => ({
      ...row,
      average_score: Number(row.average_score),
      feedback_comments: (row.feedback_comments || []).map(({ reviewer_name, reviewer_id, reviewer_email, ...feedback }: any) => feedback),
      needs_attention: row.total_reviews_received > 0 && Number(row.average_score) < 5.0,
    }));

    return res.json({
      team_id: teamId,
      member_summaries: summaries,
    });
  } catch (error: any) {
    console.error('Error fetching peer audit summary:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

/**
 * POST /api/peer-audits
 * Submit confidential peer audit for a teammate (BR-08)
 * Enforces non-self evaluation and round uniqueness.
 */
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  const reviewer_id = req.user!.userId;
  const { team_id, reviewee_id, audit_round, comments, passed, score, assignment_id } = req.body;

  if (!team_id || !reviewee_id) {
    return res.status(400).json({ message: 'team_id and reviewee_id are required' });
  }

  if (assignment_id !== undefined && (!Number.isInteger(assignment_id) || assignment_id <= 0)) {
    return res.status(400).json({ message: 'assignment_id must be a positive integer' });
  }

  // BR-08: Strictly prevent self-evaluation
  if (Number(reviewer_id) === Number(reviewee_id)) {
    return res.status(400).json({
      message: 'BR-08 Violation: You cannot evaluate yourself (Non-self audit rule)!',
      rule: 'BR-08',
    });
  }

  // Validate score range
  const numScore = typeof score === 'number' ? score : NaN;
  if (!Number.isFinite(numScore) || numScore < 0 || numScore > 10) {
    return res.status(400).json({ message: 'Score must be between 0 and 10' });
  }

  const round = audit_round === undefined ? 1 : audit_round;
  if (round !== 1 && round !== 2) return res.status(400).json({ message: 'audit_round must be 1 or 2' });
  if (!Number.isInteger(team_id) || team_id <= 0 || !Number.isInteger(reviewee_id) || reviewee_id <= 0) return res.status(400).json({ message: 'Invalid team_id or reviewee_id' });
  try {
    const members = await pool.query('SELECT u.user_id FROM team_members tm JOIN users u ON tm.user_id = u.user_id WHERE tm.team_id = $1', [team_id]);
    if (![reviewer_id, reviewee_id].every(id => members.rows.some(m => Number(m.user_id) === Number(id)))) return res.status(403).json({ message: 'Reviewer and reviewee must belong to the same team', rule: 'BR-08' });
    const isPassed = passed !== undefined ? Boolean(passed) : numScore >= 5.0;

    // Check duplicate evaluation in same round
    const existing = await pool.query(
      `SELECT audit_id FROM peer_audits 
       WHERE team_id = $1 AND reviewer_id = $2 AND reviewee_id = $3 AND audit_round = $4`,
      [Number(team_id), reviewer_id, Number(reviewee_id), round]
    );

    if (existing.rows.length > 0) {
      // Update existing audit
      const updated = await pool.query(
        `UPDATE peer_audits 
         SET score = $1, comments = $2, passed = $3, assignment_id = $5
         WHERE audit_id = $4
         RETURNING *`,
        [numScore, comments || '', isPassed, existing.rows[0].audit_id, assignment_id ?? null]
      );
      return res.status(200).json({
        message: 'Peer audit updated successfully for this round',
        audit: updated.rows[0],
        rule_verified: 'BR-08 (Updated)',
      });
    }

    // Insert new audit record
    const result = await pool.query(
      `INSERT INTO peer_audits (team_id, reviewer_id, reviewee_id, audit_round, comments, passed, score, assignment_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [Number(team_id), reviewer_id, Number(reviewee_id), round, comments || '', isPassed, numScore, assignment_id ?? null]
    );

    return res.status(201).json({
      message: 'Peer audit submitted successfully (BR-08 passed)!',
      audit: result.rows[0],
      rule_verified: 'BR-08',
    });
  } catch (error: any) {
    console.error('Error creating peer audit:', error);
    if (error.code === '23514') {
      return res.status(400).json({ message: 'BR-08 Check constraint violation: Reviewer cannot be reviewee.' });
    }
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Duplicate audit submission for this round.' });
    }
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

export default router;
