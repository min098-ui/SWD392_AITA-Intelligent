import { Router, Request, Response } from 'express';
import { pool } from '../../config/db';
import { authenticateJWT } from '../../common/auth.middleware';

const router = Router();

// GET /api/submissions - Get submissions for team or assignment
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  const { assignment_id, team_id } = req.query;

  try {
    let query = `
      SELECT s.*, a.title as assignment_title, t.team_name,
        gj.grading_job_id, gj.status as grading_status
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.assignment_id
      JOIN teams t ON s.team_id = t.team_id
      LEFT JOIN grading_jobs gj ON s.submission_id = gj.submission_id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (assignment_id) {
      params.push(assignment_id);
      conditions.push(`s.assignment_id = $${params.length}`);
    }
    if (team_id) {
      params.push(team_id);
      conditions.push(`s.team_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }
    query += ` ORDER BY s.submitted_at DESC`;

    const result = await pool.query(query, params);
    return res.json({ submissions: result.rows });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/submissions - Submit assignment artifact and queue grading job
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  const { assignment_id, team_id, artifact_url, git_commit_hash } = req.body;

  if (!assignment_id || !team_id || !artifact_url || !git_commit_hash) {
    return res.status(400).json({ message: 'Missing required submission fields' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert submission
    const subRes = await client.query(
      `INSERT INTO submissions (assignment_id, team_id, artifact_url, git_commit_hash, status)
       VALUES ($1, $2, $3, $4, 'SUBMITTED') RETURNING *`,
      [assignment_id, team_id, artifact_url, git_commit_hash]
    );
    const submission = subRes.rows[0];

    // 2. Fetch default prompt template & active AI API Key
    const promptRes = await client.query(`SELECT prompt_template_id FROM prompt_templates WHERE purpose = 'Grading' LIMIT 1`);
    const promptId = promptRes.rows[0]?.prompt_template_id || null;

    const keyRes = await client.query(`SELECT ai_api_key_id FROM ai_api_keys WHERE status = 'ACTIVE' LIMIT 1`);
    const keyId = keyRes.rows[0]?.ai_api_key_id || null;

    // 3. Queue grading job
    const jobRes = await client.query(
      `INSERT INTO grading_jobs (submission_id, prompt_template_id, ai_api_key_id, priority, status)
       VALUES ($1, $2, $3, 1, 'QUEUED') RETURNING *`,
      [submission.submission_id, promptId, keyId]
    );

    await client.query('COMMIT');
    return res.status(201).json({
      submission,
      grading_job: jobRes.rows[0],
      message: 'Assignment submitted successfully. Background grading job has been queued.',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating submission:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/submissions/:id/results - Get detailed grading results per rubric rule
router.get('/:id/results', authenticateJWT, async (req: Request, res: Response) => {
  const submissionId = req.params.id;

  try {
    const query = `
      SELECT 
        gr.*,
        rr.criterion,
        rr.rule_type,
        rr.max_score as rule_max_score,
        rr.weight
      FROM grading_jobs gj
      JOIN grading_results gr ON gj.grading_job_id = gr.grading_job_id
      JOIN rubric_rules rr ON gr.rubric_rule_id = rr.rubric_rule_id
      WHERE gj.submission_id = $1
      ORDER BY rr.rubric_rule_id ASC
    `;
    const result = await pool.query(query, [submissionId]);
    return res.json({ results: result.rows });
  } catch (error) {
    console.error('Error fetching submission results:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
