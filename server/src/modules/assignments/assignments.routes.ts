import { Router, Request, Response } from 'express';
import { pool } from '../../config/db';
import { authenticateJWT, requireRole } from '../../common/auth.middleware';

const router = Router();

// GET /api/assignments - Get assignments for course
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  const { course_id } = req.query;
  const user = req.user!;

  try {
    let query = 'SELECT * FROM assignments';
    const params: any[] = [];

    if (course_id) {
      query += ' WHERE course_id = $1';
      params.push(course_id);
    }
    query += ' ORDER BY deadline ASC';

    const result = await pool.query(query, params);
    return res.json({ assignments: result.rows });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/assignments/:id - Get assignment details and rubric rules
router.get('/:id', authenticateJWT, async (req: Request, res: Response) => {
  const assignmentId = req.params.id;
  const user = req.user!;

  try {
    const assignmentResult = await pool.query('SELECT * FROM assignments WHERE assignment_id = $1', [assignmentId]);
    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Hide secret test cases from students (is_hidden = true)
    let rubricQuery = 'SELECT * FROM rubric_rules WHERE assignment_id = $1';
    if (user.role === 'STUDENT') {
      rubricQuery += ' AND is_hidden = FALSE';
    }
    rubricQuery += ' ORDER BY rubric_rule_id ASC';

    const rubricResult = await pool.query(rubricQuery, [assignmentId]);

    return res.json({
      assignment: assignmentResult.rows[0],
      rubric_rules: rubricResult.rows,
    });
  } catch (error) {
    console.error('Error fetching assignment details:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/assignments - Create assignment with rubric rules (Lecturer only)
router.post('/', authenticateJWT, requireRole('LECTURER', 'ADMIN'), async (req: Request, res: Response) => {
  const { course_id, title, description, deadline, max_score, rubrics } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const assignmentRes = await client.query(
      'INSERT INTO assignments (course_id, title, description, deadline, max_score) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [course_id, title, description, deadline, max_score || 10.0]
    );
    const newAssignment = assignmentRes.rows[0];

    if (Array.isArray(rubrics) && rubrics.length > 0) {
      for (const r of rubrics) {
        await client.query(
          `INSERT INTO rubric_rules 
           (assignment_id, rule_type, criterion, input_data, expected_output, weight, max_score, is_hidden) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            newAssignment.assignment_id,
            r.rule_type || 'AUTOMATED',
            r.criterion,
            r.input_data || null,
            r.expected_output || null,
            r.weight || 1.0,
            r.max_score || 10.0,
            r.is_hidden || false,
          ]
        );
      }
    }

    await client.query('COMMIT');
    return res.status(201).json({ assignment: newAssignment });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating assignment:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

export default router;
