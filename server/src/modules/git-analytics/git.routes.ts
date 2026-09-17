import { Router, Request, Response } from 'express';
import { pool } from '../../config/db';
import { authenticateJWT } from '../../common/auth.middleware';

const router = Router();

// GET /api/git/:teamId/commits - Get commits and member contribution stats
router.get('/:teamId/commits', authenticateJWT, async (req: Request, res: Response) => {
  const teamId = req.params.teamId;

  try {
    const commitsRes = await pool.query(
      `SELECT c.*, u.full_name as author_name, u.email as author_email
       FROM git_commits c
       LEFT JOIN users u ON c.author_user_id = u.user_id
       WHERE c.team_id = $1
       ORDER BY c.committed_at DESC`,
      [teamId]
    );

    // Summary of lines added/deleted per user
    const statsRes = await pool.query(
      `SELECT 
        u.user_id,
        u.full_name,
        COUNT(c.commit_id) as total_commits,
        COALESCE(SUM(c.lines_added), 0) as total_lines_added,
        COALESCE(SUM(c.lines_deleted), 0) as total_lines_deleted
       FROM team_members tm
       JOIN users u ON tm.user_id = u.user_id
       LEFT JOIN git_commits c ON c.author_user_id = u.user_id AND c.team_id = tm.team_id
       WHERE tm.team_id = $1
       GROUP BY u.user_id, u.full_name
       ORDER BY total_lines_added DESC`,
      [teamId]
    );

    return res.json({
      commits: commitsRes.rows,
      member_contributions: statsRes.rows,
    });
  } catch (error) {
    console.error('Error fetching git commits:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
