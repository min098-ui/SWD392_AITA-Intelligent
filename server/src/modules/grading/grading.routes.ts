import { Router, Request, Response } from 'express';
import { pool } from '../../config/db';
import { authenticateJWT, requireRole } from '../../common/auth.middleware';
import { addGradingJob } from './grading.queue';

const router = Router();

// GET /api/grading/:jobId/results - Get detailed grading results per rubric rule
router.get('/:jobId/results', authenticateJWT, async (req: Request, res: Response) => {
  const jobId = req.params.jobId;
  const user = req.user!;

  try {
    // 1. Fetch Grading Job and Submission info
    const jobRes = await pool.query(
      `SELECT gj.*, s.assignment_id, s.team_id, s.artifact_url, s.git_commit_hash, s.submitted_by_user_id,
              a.title as assignment_title, a.max_score as assignment_max_score
       FROM grading_jobs gj
       JOIN submissions s ON gj.submission_id = s.submission_id
       JOIN assignments a ON s.assignment_id = a.assignment_id
       WHERE gj.grading_job_id = $1`,
      [jobId]
    );

    if (jobRes.rows.length === 0) {
      return res.status(404).json({ message: 'Grading job not found' });
    }

    const job = jobRes.rows[0];

    // 2. Fetch individual test case results
    const resultsRes = await pool.query(
      `SELECT 
         gr.grading_result_id,
         gr.grading_job_id,
         gr.rubric_rule_id,
         gr.score,
         gr.actual_output,
         gr.passed,
         gr.execution_time_ms,
         gr.ai_feedback,
         gr.is_ai_generated,
         gr.graded_at,
         rr.criterion,
         rr.rule_type,
         rr.input_data,
         rr.expected_output,
         rr.weight,
         rr.max_score as rule_max_score,
         rr.is_hidden
       FROM grading_results gr
       JOIN rubric_rules rr ON gr.rubric_rule_id = rr.rubric_rule_id
       WHERE gr.grading_job_id = $1
       ORDER BY rr.rubric_rule_id ASC`,
      [jobId]
    );

    let results = resultsRes.rows;

    // BR-06: Hide input_data, expected_output, and raw actual_output of hidden test cases from students
    if (user.role === 'STUDENT') {
      results = results.map((r) => {
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

    const totalScore = results.reduce((sum, r) => sum + (Number(r.score) || 0), 0);
    const maxScore = results.reduce((sum, r) => sum + (Number(r.rule_max_score) || 0), 0);
    const passedCount = results.filter((r) => r.passed).length;

    return res.json({
      job: {
        grading_job_id: job.grading_job_id,
        submission_id: job.submission_id,
        assignment_id: job.assignment_id,
        assignment_title: job.assignment_title,
        status: job.status,
        queued_at: job.queued_at,
        completed_at: job.completed_at,
        total_score: totalScore,
        max_possible_score: maxScore,
        passed_rules_count: passedCount,
        total_rules_count: results.length,
      },
      results,
    });
  } catch (error) {
    console.error('Error fetching grading results:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/grading/regrade/:submissionId - Re-trigger a grading job (Lecturer/Admin only)
router.post('/regrade/:submissionId', authenticateJWT, requireRole('LECTURER', 'ADMIN'), async (req: Request, res: Response) => {
  const submissionId = req.params.submissionId;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch submission details
    const subRes = await client.query(
      `SELECT s.*, a.course_id 
       FROM submissions s 
       JOIN assignments a ON s.assignment_id = a.assignment_id 
       WHERE s.submission_id = $1`,
      [submissionId]
    );

    if (subRes.rows.length === 0) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const submission = subRes.rows[0];

    // 2. Insert new grading job
    const jobRes = await client.query(
      `INSERT INTO grading_jobs (submission_id, priority, status)
       VALUES ($1, 2, 'QUEUED') RETURNING *`,
      [submissionId]
    );
    const newJob = jobRes.rows[0];

    await client.query('COMMIT');

    // 3. Push to BullMQ queue
    await addGradingJob({
      grading_job_id: newJob.grading_job_id,
      submission_id: submission.submission_id,
      assignment_id: submission.assignment_id,
      team_id: submission.team_id,
      artifact_url: submission.artifact_url,
      git_commit_hash: submission.git_commit_hash,
      code_content: req.body.code_content || submission.artifact_url,
      language: req.body.language || 'python',
      priority: 2,
    });

    return res.status(201).json({
      message: 'Regrading job scheduled successfully.',
      grading_job: newJob,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error scheduling regrade:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

export default router;
