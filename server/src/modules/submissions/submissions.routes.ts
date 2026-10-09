import { Router, Request, Response } from 'express';
import { pool } from '../../config/db';
import { authenticateJWT } from '../../common/auth.middleware';
import { addGradingJob } from '../grading/grading.queue';

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

// GET /api/submissions/:id - Get submission status and details
router.get('/:id', authenticateJWT, async (req: Request, res: Response) => {
  const submissionId = req.params.id;

  try {
    const result = await pool.query(
      `SELECT s.*, a.title as assignment_title, t.team_name,
              gj.grading_job_id, gj.status as grading_status, gj.completed_at
       FROM submissions s
       JOIN assignments a ON s.assignment_id = a.assignment_id
       LEFT JOIN teams t ON s.team_id = t.team_id
       LEFT JOIN grading_jobs gj ON s.submission_id = gj.submission_id
       WHERE s.submission_id = $1`,
      [submissionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    return res.json({ submission: result.rows[0] });
  } catch (error) {
    console.error('Error fetching submission:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/submissions - Submit assignment artifact and queue BullMQ grading job
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  const { assignment_id, team_id, artifact_url, git_commit_hash, code_content, language } = req.body;
  const user = req.user!;

  if (!assignment_id || !artifact_url || !git_commit_hash) {
    return res.status(400).json({ message: 'Missing required submission fields (assignment_id, artifact_url, git_commit_hash)' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert submission
    const subRes = await client.query(
      `INSERT INTO submissions (assignment_id, team_id, submitted_by_user_id, artifact_url, git_commit_hash, status)
       VALUES ($1, $2, $3, $4, $5, 'QUEUED') RETURNING *`,
      [assignment_id, team_id || null, user.userId, artifact_url, git_commit_hash]
    );
    const submission = subRes.rows[0];

    // 2. Fetch default prompt template & active AI API Key
    const promptRes = await client.query(`SELECT prompt_template_id FROM prompt_templates WHERE purpose = 'Grading' LIMIT 1`);
    const promptId = promptRes.rows[0]?.prompt_template_id || null;

    const keyRes = await client.query(`SELECT ai_api_key_id FROM ai_api_keys WHERE status = 'ACTIVE' LIMIT 1`);
    const keyId = keyRes.rows[0]?.ai_api_key_id || null;

    // 3. Insert grading job
    const jobRes = await client.query(
      `INSERT INTO grading_jobs (submission_id, prompt_template_id, ai_api_key_id, priority, status)
       VALUES ($1, $2, $3, 1, 'QUEUED') RETURNING *`,
      [submission.submission_id, promptId, keyId]
    );
    const gradingJob = jobRes.rows[0];

    await client.query('COMMIT');

    // 4. Enqueue BullMQ job
    await addGradingJob({
      grading_job_id: gradingJob.grading_job_id,
      submission_id: submission.submission_id,
      assignment_id: Number(assignment_id),
      team_id: team_id ? Number(team_id) : undefined,
      artifact_url,
      git_commit_hash,
      code_content: code_content || artifact_url,
      language: language || 'python',
      priority: 1,
    });

    return res.status(201).json({
      submission,
      grading_job: gradingJob,
      message: 'Assignment submitted successfully. Background grading job has been queued in BullMQ.',
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
  const user = req.user!;

  try {
    const query = `
      SELECT 
        gr.*,
        rr.criterion,
        rr.rule_type,
        rr.input_data,
        rr.expected_output,
        rr.max_score as rule_max_score,
        rr.weight,
        rr.is_hidden
      FROM grading_jobs gj
      JOIN grading_results gr ON gj.grading_job_id = gr.grading_job_id
      JOIN rubric_rules rr ON gr.rubric_rule_id = rr.rubric_rule_id
      WHERE gj.submission_id = $1
      ORDER BY rr.rubric_rule_id ASC
    `;
    const result = await pool.query(query, [submissionId]);

    let rows = result.rows;

    // BR-06: Hide input_data and expected_output for hidden test cases if student
    if (user.role === 'STUDENT') {
      rows = rows.map((r) => {
        if (r.is_hidden) {
          return {
            ...r,
            input_data: '[PROTECTED TEST CASE]',
            expected_output: '[PROTECTED TEST CASE]',
            actual_output: r.passed ? 'Output matched expected criteria.' : 'Output did not match expected criteria.',
          };
        }
        return r;
      });
    }

    return res.json({ results: rows });
  } catch (error) {
    console.error('Error fetching submission results:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
