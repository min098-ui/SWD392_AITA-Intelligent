import { Router, Request, Response } from 'express';
import { pool } from '../../config/db';
import { authenticateJWT, requireRole } from '../../common/auth.middleware';

const router = Router();

// GET /api/assignments - Get list of assignments (optional ?course_id=)
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  const { course_id } = req.query;

  try {
    let query = `
      SELECT a.*, c.course_code, c.course_name,
             (SELECT COUNT(*) FROM rubric_rules rr WHERE rr.assignment_id = a.assignment_id) as rubric_count,
             (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.assignment_id) as submission_count
      FROM assignments a
      JOIN courses c ON a.course_id = c.course_id
    `;
    const params: any[] = [];

    if (course_id) {
      query += ' WHERE a.course_id = $1';
      params.push(course_id);
    }
    query += ' ORDER BY a.created_at DESC';

    const result = await pool.query(query, params);
    return res.json({ assignments: result.rows });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/assignments/:id - Get assignment details and rubric rules (BR-06 Protection for Students)
router.get('/:id', authenticateJWT, async (req: Request, res: Response) => {
  const assignmentId = req.params.id;
  const user = req.user!;

  try {
    const assignmentResult = await pool.query(
      `SELECT a.*, c.course_code, c.course_name, c.lecturer_id
       FROM assignments a
       JOIN courses c ON a.course_id = c.course_id
       WHERE a.assignment_id = $1`,
      [assignmentId]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const assignment = assignmentResult.rows[0];

    // Fetch rubric rules
    const rubricResult = await pool.query(
      'SELECT * FROM rubric_rules WHERE assignment_id = $1 ORDER BY rubric_rule_id ASC',
      [assignmentId]
    );

    let rubrics = rubricResult.rows;

    // BR-06: Protect hidden test cases for students
    if (user.role === 'STUDENT') {
      rubrics = rubrics.map((r) => {
        if (r.is_hidden) {
          return {
            ...r,
            input_data: '[PROTECTED TEST CASE]',
            expected_output: '[PROTECTED TEST CASE]',
          };
        }
        return r;
      });
    }

    return res.json({
      assignment,
      rubric_rules: rubrics,
    });
  } catch (error) {
    console.error('Error fetching assignment details:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/assignments - Create assignment with rubric rules (Lecturer / Admin only)
router.post('/', authenticateJWT, requireRole('LECTURER', 'ADMIN'), async (req: Request, res: Response) => {
  const {
    course_id,
    title,
    description,
    start_date,
    due_date,
    deadline,
    max_score = 10.0,
    submission_type = 'TEAM',
    rubrics = [],
  } = req.body;

  if (!course_id || !title) {
    return res.status(400).json({ message: 'course_id and title are required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert Assignment
    const effectiveDeadline = due_date || deadline || new Date(Date.now() + 7 * 24 * 3600 * 1000);
    const assignmentRes = await client.query(
      `INSERT INTO assignments 
       (course_id, title, description, start_date, due_date, deadline, max_score, submission_type) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        course_id,
        title,
        description || '',
        start_date || new Date(),
        effectiveDeadline,
        effectiveDeadline,
        Number(max_score) || 10.0,
        submission_type || 'TEAM',
      ]
    );
    const newAssignment = assignmentRes.rows[0];

    // 2. Insert Rubric Rules if provided
    const insertedRubrics: any[] = [];
    if (Array.isArray(rubrics) && rubrics.length > 0) {
      for (const r of rubrics) {
        const ruleRes = await client.query(
          `INSERT INTO rubric_rules 
           (assignment_id, rule_type, criterion, input_data, expected_output, weight, max_score, is_hidden) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
          [
            newAssignment.assignment_id,
            r.rule_type || 'AUTOMATED',
            r.criterion || 'Autograding Test Case',
            r.input_data || '',
            r.expected_output || '',
            Number(r.weight) || 1.0,
            Number(r.max_score) || 10.0,
            Boolean(r.is_hidden),
          ]
        );
        insertedRubrics.push(ruleRes.rows[0]);
      }
    }

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Assignment created successfully.',
      assignment: newAssignment,
      rubric_rules: insertedRubrics,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating assignment:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

// POST /api/assignments/:id/rubrics - Add a Rubric Rule to an existing assignment (Lecturer / Admin only)
router.post('/:id/rubrics', authenticateJWT, requireRole('LECTURER', 'ADMIN'), async (req: Request, res: Response) => {
  const assignmentId = req.params.id;
  const { rule_type = 'AUTOMATED', criterion, input_data, expected_output, weight = 1.0, max_score = 10.0, is_hidden = false } = req.body;

  if (!criterion) {
    return res.status(400).json({ message: 'criterion is required for rubric rule.' });
  }

  try {
    const checkRes = await pool.query('SELECT assignment_id FROM assignments WHERE assignment_id = $1', [assignmentId]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    const insertRes = await pool.query(
      `INSERT INTO rubric_rules 
       (assignment_id, rule_type, criterion, input_data, expected_output, weight, max_score, is_hidden) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        assignmentId,
        rule_type,
        criterion,
        input_data || '',
        expected_output || '',
        Number(weight) || 1.0,
        Number(max_score) || 10.0,
        Boolean(is_hidden),
      ]
    );

    return res.status(201).json({
      message: 'Rubric rule added successfully.',
      rubric_rule: insertRes.rows[0],
    });
  } catch (error) {
    console.error('Error adding rubric rule:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/assignments/:id/rubrics/:rubricId - Delete a Rubric Rule (Lecturer / Admin only)
router.delete('/:id/rubrics/:rubricId', authenticateJWT, requireRole('LECTURER', 'ADMIN'), async (req: Request, res: Response) => {
  const { id: assignmentId, rubricId } = req.params;

  try {
    const delRes = await pool.query(
      'DELETE FROM rubric_rules WHERE rubric_rule_id = $1 AND assignment_id = $2 RETURNING *',
      [rubricId, assignmentId]
    );

    if (delRes.rows.length === 0) {
      return res.status(404).json({ message: 'Rubric rule not found.' });
    }

    return res.json({ message: 'Rubric rule deleted successfully.' });
  } catch (error) {
    console.error('Error deleting rubric rule:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/assignments/:id - Update assignment details (Lecturer / Admin only)
router.put('/:id', authenticateJWT, requireRole('LECTURER', 'ADMIN'), async (req: Request, res: Response) => {
  const assignmentId = req.params.id;
  const { title, description, start_date, due_date, deadline, max_score, submission_type } = req.body;

  try {
    const effectiveDeadline = due_date || deadline;
    const updateRes = await pool.query(
      `UPDATE assignments 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           start_date = COALESCE($3, start_date),
           due_date = COALESCE($4, due_date),
           deadline = COALESCE($4, deadline),
           max_score = COALESCE($5, max_score),
           submission_type = COALESCE($6, submission_type)
       WHERE assignment_id = $7 RETURNING *`,
      [
        title,
        description,
        start_date,
        effectiveDeadline,
        max_score ? Number(max_score) : null,
        submission_type,
        assignmentId,
      ]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    return res.json({
      message: 'Assignment updated successfully.',
      assignment: updateRes.rows[0],
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/assignments/:id - Delete assignment (Lecturer / Admin only)
router.delete('/:id', authenticateJWT, requireRole('LECTURER', 'ADMIN'), async (req: Request, res: Response) => {
  const assignmentId = req.params.id;

  try {
    const delRes = await pool.query('DELETE FROM assignments WHERE assignment_id = $1 RETURNING *', [assignmentId]);
    if (delRes.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    return res.json({ message: 'Assignment and associated rubrics deleted successfully.' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
