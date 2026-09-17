import { Router, Request, Response } from 'express';
import { pool } from '../../config/db';
import { authenticateJWT, requireRole } from '../../common/auth.middleware';

const router = Router();

// GET /api/courses - List courses with lecturer info
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT c.*, u.full_name as lecturer_name, u.email as lecturer_email
      FROM courses c
      JOIN users u ON c.lecturer_id = u.user_id
      ORDER BY c.course_id DESC
    `;
    const result = await pool.query(query);
    return res.json({ courses: result.rows });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/courses/:id/teams - List teams and members in course
router.get('/:id/teams', authenticateJWT, async (req: Request, res: Response) => {
  const courseId = req.params.id;
  try {
    const teamsQuery = `
      SELECT t.*, 
        json_agg(
          json_build_object(
            'team_member_id', tm.team_member_id,
            'user_id', u.user_id,
            'full_name', u.full_name,
            'email', u.email,
            'assigned_module', tm.assigned_module
          )
        ) FILTER (WHERE tm.team_member_id IS NOT NULL) as members
      FROM teams t
      LEFT JOIN team_members tm ON t.team_id = tm.team_id
      LEFT JOIN users u ON tm.user_id = u.user_id
      WHERE t.course_id = $1
      GROUP BY t.team_id
      ORDER BY t.team_id ASC
    `;
    const result = await pool.query(teamsQuery, [courseId]);
    return res.json({ teams: result.rows });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/courses - Create course (Admin only)
router.post('/', authenticateJWT, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { course_code, course_name, semester, lecturer_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO courses (course_code, course_name, semester, lecturer_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [course_code, course_name, semester, lecturer_id]
    );
    return res.status(201).json({ course: result.rows[0] });
  } catch (error) {
    console.error('Error creating course:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
