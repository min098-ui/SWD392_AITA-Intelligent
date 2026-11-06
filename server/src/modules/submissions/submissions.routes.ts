import { Router, Request, Response } from 'express';
import { pool } from '../../config/db';
import { authenticateJWT, requireRole } from '../../common/auth.middleware';
import { addGradingJob } from '../grading/grading.queue';

const router = Router();

// GET /api/submissions - Get submissions for team or assignment
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  const { assignment_id, team_id } = req.query;
  const user = req.user!;

  try {
    const isStudent = user && user.role === 'STUDENT';
    let query = `
      SELECT s.*, 
        a.title as assignment_title, 
        a.deadline as assignment_deadline,
        a.submission_type as assignment_submission_type,
        t.team_name,
        u.full_name as submitter_name, u.email as submitter_email,
        gj.grading_job_id, gj.status as grading_status,
        CASE WHEN a.deadline IS NOT NULL AND s.submitted_at > a.deadline THEN true ELSE false END as is_late,
        CASE WHEN a.deadline IS NOT NULL AND s.submitted_at > a.deadline THEN ROUND(EXTRACT(EPOCH FROM (s.submitted_at - a.deadline)) / 60) ELSE 0 END as late_minutes,
        COALESCE(s.final_score, s.reviewer_1_score, s.ai_score, (SELECT SUM(gr.score) FROM grading_results gr WHERE gr.grading_job_id = gj.grading_job_id), 0) as score,
        (
          SELECT json_agg(
            json_build_object(
              'result_id', gr.grading_result_id,
              'criterion', rr.criterion,
              'passed', gr.passed,
              'score', gr.score,
              'max_score', rr.max_score,
              'execution_time_ms', gr.execution_time_ms,
              'is_hidden', rr.is_hidden,
              'input_data', ${isStudent ? `CASE WHEN rr.is_hidden THEN '[PROTECTED TEST CASE]' ELSE rr.input_data END` : `rr.input_data`},
              'expected_output', ${isStudent ? `CASE WHEN rr.is_hidden THEN '[PROTECTED TEST CASE]' ELSE rr.expected_output END` : `rr.expected_output`},
              'actual_output', ${isStudent ? `CASE WHEN rr.is_hidden THEN 'Output ẩn theo chuẩn BR-06' ELSE gr.actual_output END` : `gr.actual_output`}
            ) ORDER BY rr.rubric_rule_id ASC
          )
          FROM grading_results gr
          JOIN rubric_rules rr ON gr.rubric_rule_id = rr.rubric_rule_id
          WHERE gr.grading_job_id = gj.grading_job_id
        ) as test_results
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.assignment_id
      LEFT JOIN teams t ON s.team_id = t.team_id
      LEFT JOIN users u ON s.submitted_by_user_id = u.user_id
      LEFT JOIN grading_jobs gj ON s.submission_id = gj.submission_id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    // Phân quyền: Sinh viên chỉ xem bài nộp của chính mình hoặc nhóm mình
    if (user && user.role === 'STUDENT') {
      params.push(user.userId);
      conditions.push(`(s.submitted_by_user_id = $${params.length} OR s.team_id IN (SELECT tm.team_id FROM team_members tm WHERE tm.user_id = $${params.length}))`);
    }

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
  const isStudent = req.user?.role === 'STUDENT';

  try {
    const result = await pool.query(
      `SELECT s.*, 
              a.title as assignment_title, 
              a.deadline as assignment_deadline,
              a.submission_type as assignment_submission_type,
              t.team_name,
              u.full_name as submitter_name, u.email as submitter_email,
              gj.grading_job_id, gj.status as grading_status, gj.completed_at,
              CASE WHEN a.deadline IS NOT NULL AND s.submitted_at > a.deadline THEN true ELSE false END as is_late,
              CASE WHEN a.deadline IS NOT NULL AND s.submitted_at > a.deadline THEN ROUND(EXTRACT(EPOCH FROM (s.submitted_at - a.deadline)) / 60) ELSE 0 END as late_minutes,
              COALESCE(s.final_score, s.reviewer_1_score, s.ai_score, (SELECT SUM(gr.score) FROM grading_results gr WHERE gr.grading_job_id = gj.grading_job_id), 0) as score,
              (
                SELECT json_agg(
                  json_build_object(
                    'result_id', gr.grading_result_id,
                    'criterion', rr.criterion,
                    'passed', gr.passed,
                    'score', gr.score,
                    'max_score', rr.max_score,
                    'execution_time_ms', gr.execution_time_ms,
                    'is_hidden', rr.is_hidden,
                    'input_data', ${isStudent ? `CASE WHEN rr.is_hidden THEN '[PROTECTED TEST CASE]' ELSE rr.input_data END` : `rr.input_data`},
                    'expected_output', ${isStudent ? `CASE WHEN rr.is_hidden THEN '[PROTECTED TEST CASE]' ELSE rr.expected_output END` : `rr.expected_output`},
                    'actual_output', ${isStudent ? `CASE WHEN rr.is_hidden THEN 'Output ẩn theo chuẩn BR-06' ELSE gr.actual_output END` : `gr.actual_output`}
                  ) ORDER BY rr.rubric_rule_id ASC
                )
                FROM grading_results gr
                JOIN rubric_rules rr ON gr.rubric_rule_id = rr.rubric_rule_id
                WHERE gr.grading_job_id = gj.grading_job_id
              ) as test_results
       FROM submissions s
       JOIN assignments a ON s.assignment_id = a.assignment_id
       LEFT JOIN teams t ON s.team_id = t.team_id
       LEFT JOIN users u ON s.submitted_by_user_id = u.user_id
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
    // Validate assignment exists
    const assignCheck = await client.query('SELECT assignment_id, submission_type, deadline FROM assignments WHERE assignment_id = $1', [assignment_id]);
    if (assignCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    const assignment = assignCheck.rows[0];
    const isLate = assignment.deadline ? new Date() > new Date(assignment.deadline) : false;

    // Validate team if submission is TEAM type and team_id is provided
    let finalTeamId: number | null = team_id ? Number(team_id) : null;

    if (assignment.submission_type === 'TEAM' && team_id) {
      const teamCheck = await client.query('SELECT team_id FROM teams WHERE team_id = $1', [team_id]);
      if (teamCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Team not found' });
      }

      if (user.role === 'STUDENT') {
        const memberCheck = await client.query('SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2', [team_id, user.userId]);
        if (memberCheck.rows.length === 0) {
          const teamHasMembers = await client.query('SELECT 1 FROM team_members WHERE team_id = $1 LIMIT 1', [team_id]);
          if (teamHasMembers.rows.length > 0) {
            return res.status(403).json({ message: 'Bạn không phải là thành viên của nhóm này' });
          }
        }
      }
    } else if (assignment.submission_type === 'INDIVIDUAL') {
      // Individual submissions don't strictly require a team
      if (!team_id) {
        finalTeamId = null;
      }
    }

    await client.query('BEGIN');

    // 1. Insert submission
    const subRes = await client.query(
      `INSERT INTO submissions (assignment_id, team_id, submitted_by_user_id, artifact_url, git_commit_hash, status)
       VALUES ($1, $2, $3, $4, $5, 'QUEUED') RETURNING *`,
      [assignment_id, finalTeamId, user.userId, artifact_url, git_commit_hash]
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
      team_id: finalTeamId || undefined,
      artifact_url,
      git_commit_hash,
      code_content: code_content || artifact_url,
      language: language || 'javascript',
      priority: 1,
    });

    return res.status(201).json({
      submission,
      grading_job: gradingJob,
      is_late: isLate,
      message: isLate 
        ? 'Bài nộp thành công (Nộp muộn sau hạn chót). Hệ thống đã đưa bài vào hàng đợi Docker Sandbox.'
        : 'Bài nộp thành công. Hệ thống đã đưa bài vào hàng đợi Docker Sandbox.',
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

// POST /api/submissions/:id/regrade - Re-grade a single submission (Lecturer / Admin only)
router.post('/:id/regrade', authenticateJWT, requireRole('LECTURER', 'ADMIN'), async (req: Request, res: Response) => {
  const submissionId = req.params.id;

  try {
    const subRes = await pool.query(
      `SELECT s.submission_id, s.assignment_id, s.team_id, s.artifact_url, s.git_commit_hash
       FROM submissions s
       WHERE s.submission_id = $1`,
      [submissionId]
    );

    if (subRes.rows.length === 0) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    const sub = subRes.rows[0];

    // Reset status to QUEUED
    await pool.query(
      `UPDATE submissions 
       SET status = 'QUEUED', 
           final_score = NULL, 
           reviewer_1_score = NULL, 
           ai_score = NULL 
       WHERE submission_id = $1`,
      [submissionId]
    );

    // Create new grading_job
    const jobRes = await pool.query(
      `INSERT INTO grading_jobs (submission_id, priority, status)
       VALUES ($1, 1, 'QUEUED')
       RETURNING grading_job_id`,
      [submissionId]
    );

    const gradingJobId = jobRes.rows[0].grading_job_id;
    const language = sub.artifact_url && sub.artifact_url.toLowerCase().includes('.py') ? 'python' : 'javascript';

    await addGradingJob({
      grading_job_id: gradingJobId,
      submission_id: Number(submissionId),
      assignment_id: sub.assignment_id,
      team_id: sub.team_id || undefined,
      artifact_url: sub.artifact_url,
      git_commit_hash: sub.git_commit_hash || 'HEAD',
      language,
      priority: 1
    });

    return res.json({
      message: 'Đã đưa bài nộp vào hàng đợi Docker Sandbox để chấm lại!',
      submissionId: sub.submission_id
    });
  } catch (error) {
    console.error('Error regrading single submission:', error);
    return res.status(500).json({ message: 'Internal server error while regrading submission.' });
  }
});

export default router;
