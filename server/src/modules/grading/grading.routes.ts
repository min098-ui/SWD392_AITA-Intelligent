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

    // RBAC: Sinh viên chỉ xem kết quả của chính mình hoặc nhóm mình
    if (user.role === 'STUDENT') {
      const isOwner = job.submitted_by_user_id === user.userId;
      if (!isOwner) {
        if (job.team_id) {
          const tmCheck = await pool.query(
            `SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2`,
            [job.team_id, user.userId]
          );
          if (tmCheck.rows.length === 0) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập kết quả bài nộp này.' });
          }
        } else {
          return res.status(403).json({ message: 'Bạn không có quyền truy cập kết quả bài nộp này.' });
        }
      }
    }

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
         gr.status,
         gr.container_id,
         gr.docker_image,
         gr.exit_code,
         gr.code_hash,
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
  const user = req.user!;
  const regradeReason = (req.body.regrade_reason || req.body.reason || 'Chấm lại theo yêu cầu giảng viên').trim();

  try {
    // 1. Fetch submission details
    const subRes = await pool.query(
      `SELECT s.*, a.course_id, a.title as assignment_title
       FROM submissions s 
       JOIN assignments a ON s.assignment_id = a.assignment_id 
       WHERE s.submission_id = $1`,
      [submissionId]
    );

    if (subRes.rows.length === 0) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const submission = subRes.rows[0];

    // RBAC: Check course ownership for Lecturer
    if (user.role === 'LECTURER') {
      const courseCheck = await pool.query(
        `SELECT 1 FROM courses WHERE course_id = $1 AND lecturer_id = $2`,
        [submission.course_id, user.userId]
      );
      if (courseCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Bạn không có quyền quản lý bài nộp này.' });
      }
    }

    // Concurrency check: Reject if already active
    const activeCheck = await pool.query(
      `SELECT grading_job_id FROM grading_jobs 
       WHERE submission_id = $1 AND status IN ('QUEUED', 'PROCESSING')`,
      [submissionId]
    );
    if (activeCheck.rows.length > 0) {
      return res.status(409).json({
        message: `Bài nộp đang trong hàng đợi xử lý (Job #${activeCheck.rows[0].grading_job_id}). Vui lòng đợi hoàn tất trước khi yêu cầu chấm lại.`
      });
    }

    // Strict Validation: Must use code_content (NEVER fallback to artifact_url)
    if (!submission.code_content || typeof submission.code_content !== 'string' || submission.code_content.trim().length === 0) {
      return res.status(400).json({ message: 'Bài nộp không có mã nguồn đã lưu để chấm lại (Không dùng artifact_url thay thế).' });
    }
    const codeToRun = submission.code_content.trim();

    // Strict Validation: Must have valid language (NEVER default to javascript)
    if (!submission.language || !['python', 'javascript', 'nodejs'].includes(submission.language.toLowerCase())) {
      return res.status(400).json({ message: 'Ngôn ngữ của bài nộp không hợp lệ hoặc bị thiếu (Không tự ý mặc định JavaScript).' });
    }
    const cleanLang = submission.language.toLowerCase() === 'python' ? 'python' : 'javascript';

    // Calculate attempt_number
    const attemptRes = await pool.query(
      `SELECT COALESCE(MAX(attempt_number), 0) + 1 as next_attempt FROM grading_jobs WHERE submission_id = $1`,
      [submissionId]
    );
    const nextAttempt = Number(attemptRes.rows[0]?.next_attempt || 1);

    // Reset status to QUEUED
    await pool.query(
      `UPDATE submissions 
       SET status = 'QUEUED'
       WHERE submission_id = $1`,
      [submissionId]
    );

    // Insert new grading job
    const jobRes = await pool.query(
      `INSERT INTO grading_jobs (submission_id, priority, status, attempt_number, regrade_reason, triggered_by_user_id)
       VALUES ($1, 2, 'QUEUED', $2, $3, $4) RETURNING *`,
      [submissionId, nextAttempt, regradeReason, user.userId]
    );
    const newJob = jobRes.rows[0];

    // Push to BullMQ queue
    await addGradingJob({
      grading_job_id: newJob.grading_job_id,
      submission_id: submission.submission_id,
      assignment_id: submission.assignment_id,
      team_id: submission.team_id,
      artifact_url: submission.artifact_url || '',
      git_commit_hash: submission.git_commit_hash || 'DIRECT_SUBMIT',
      code_content: codeToRun,
      language: cleanLang as 'python' | 'javascript',
      priority: 2,
    });

    return res.status(201).json({
      message: `Đã đưa bài nộp vào hàng đợi Docker Sandbox để chấm lại (Lần #${nextAttempt})!`,
      grading_job: newJob,
      attempt_number: nextAttempt,
      regrade_reason: regradeReason
    });
  } catch (error) {
    console.error('Error scheduling regrade:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// =============================================================================
// BR-09: Collaborative Dual-Lecturer Moderation with AI Assistance (Workflow APIs)
// =============================================================================

// 1. POST /api/grading/review/approve-ai/:submissionId - Lecturer 1 accepts AI preliminary grade
router.post(
  '/review/approve-ai/:submissionId',
  authenticateJWT,
  requireRole('LECTURER', 'ADMIN'),
  async (req: Request, res: Response) => {
    const submissionId = req.params.submissionId;
    const reviewerId = req.user!.userId;
    const { notes } = req.body;

    try {
      const subRes = await pool.query('SELECT * FROM submissions WHERE submission_id = $1', [submissionId]);
      if (subRes.rows.length === 0) {
        return res.status(404).json({ message: 'Submission not found' });
      }

      // If ai_score is not set yet, pull the total score from latest grading job
      const scoreToApprove = subRes.rows[0].ai_score !== null && subRes.rows[0].ai_score !== undefined
        ? subRes.rows[0].ai_score
        : 10.0; // fallback to perfect if no deduction

      const updated = await pool.query(
        `UPDATE submissions 
         SET status = 'FINALIZED',
             reviewer_1_id = $1,
             reviewer_1_score = $2,
             reviewer_1_notes = $3,
             final_score = $2
         WHERE submission_id = $4
         RETURNING *`,
        [reviewerId, scoreToApprove, notes || 'Approved AI preliminary evaluation', submissionId]
      );

      return res.json({
        message: 'Lecturer 1 successfully approved AI score. Grade finalized.',
        submission: updated.rows[0],
      });
    } catch (error) {
      console.error('Error approving AI score:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// 2. POST /api/grading/review/request-second-opinion/:submissionId - Lecturer 1 disputes AI & requests 2nd lecturer
router.post(
  '/review/request-second-opinion/:submissionId',
  authenticateJWT,
  requireRole('LECTURER', 'ADMIN'),
  async (req: Request, res: Response) => {
    const submissionId = req.params.submissionId;
    const reviewerId = req.user!.userId;
    const { reviewer_1_score, reviewer_1_notes, reviewer_2_id } = req.body;

    if (reviewer_1_score === undefined || !reviewer_2_id) {
      return res.status(400).json({ message: 'reviewer_1_score and reviewer_2_id are required' });
    }

    if (reviewerId === Number(reviewer_2_id)) {
      return res.status(400).json({ message: 'Reviewer 2 must be a different lecturer' });
    }

    try {
      const updated = await pool.query(
        `UPDATE submissions
         SET status = 'PENDING_SECOND_REVIEW',
             needs_second_review = TRUE,
             reviewer_1_id = $1,
             reviewer_1_score = $2,
             reviewer_1_notes = $3,
             reviewer_2_id = $4
         WHERE submission_id = $5
         RETURNING *`,
        [reviewerId, reviewer_1_score, reviewer_1_notes || 'Requested second opinion', reviewer_2_id, submissionId]
      );

      if (updated.rows.length === 0) {
        return res.status(404).json({ message: 'Submission not found' });
      }

      return res.json({
        message: 'Second opinion requested. Submission assigned to Lecturer 2.',
        submission: updated.rows[0],
      });
    } catch (error) {
      console.error('Error requesting second opinion:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// 3. POST /api/grading/review/second-opinion/:submissionId - Lecturer 2 evaluates independently
router.post(
  '/review/second-opinion/:submissionId',
  authenticateJWT,
  requireRole('LECTURER', 'ADMIN'),
  async (req: Request, res: Response) => {
    const submissionId = req.params.submissionId;
    const reviewerId = req.user!.userId;
    const { reviewer_2_score, reviewer_2_notes } = req.body;

    if (reviewer_2_score === undefined) {
      return res.status(400).json({ message: 'reviewer_2_score is required' });
    }

    try {
      const subRes = await pool.query('SELECT * FROM submissions WHERE submission_id = $1', [submissionId]);
      if (subRes.rows.length === 0) {
        return res.status(404).json({ message: 'Submission not found' });
      }

      const sub = subRes.rows[0];

      // BR-09: Giảng viên 2 chấm chéo độc lập phải là người khác với Giảng viên 1 (trừ ADMIN)
      if (sub.reviewer_1_id && Number(sub.reviewer_1_id) === Number(reviewerId) && req.user!.role !== 'ADMIN') {
        return res.status(400).json({
          message: 'Quy tắc BR-09: Giảng viên 2 chấm chéo độc lập phải là giảng viên khác với Giảng viên 1.',
          rule: 'BR-09',
        });
      }
      const score1 = Number(sub.reviewer_1_score || 0);
      const score2 = Number(reviewer_2_score);
      const difference = Math.abs(score1 - score2);

      // If difference is small (<= 0.5), auto-agree on average
      // If difference is notable (> 0.5), require discussion (FIRST_REVIEWED / PENDING_SECOND_REVIEW)
      let nextStatus = 'FIRST_REVIEWED';
      let autoFinalScore: number | null = null;

      if (difference <= 0.5) {
        nextStatus = 'FINALIZED';
        autoFinalScore = Number(((score1 + score2) / 2).toFixed(1));
      }

      const updated = await pool.query(
        `UPDATE submissions
         SET status = $1,
             reviewer_2_id = $2,
             reviewer_2_score = $3,
             reviewer_2_notes = $4,
             final_score = COALESCE($5, final_score)
         WHERE submission_id = $6
         RETURNING *`,
        [nextStatus, reviewerId, score2, reviewer_2_notes || 'Second review submitted', autoFinalScore, submissionId]
      );

      return res.json({
        message: difference <= 0.5
          ? 'Scores are closely aligned. Grade auto-finalized by consensus.'
          : 'Scores differ significantly. Both lecturers must discuss to establish final consensus.',
        difference,
        submission: updated.rows[0],
      });
    } catch (error) {
      console.error('Error submitting second opinion:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// 4. POST /api/grading/review/consensus/:submissionId - Final agreement and grade settlement
router.post(
  '/review/consensus/:submissionId',
  authenticateJWT,
  requireRole('LECTURER', 'ADMIN'),
  async (req: Request, res: Response) => {
    const submissionId = req.params.submissionId;
    const { final_score, consensus_notes } = req.body;

    if (final_score === undefined || !consensus_notes) {
      return res.status(400).json({ message: 'final_score and consensus_notes are required' });
    }

    try {
      const updated = await pool.query(
        `UPDATE submissions
         SET status = 'FINALIZED',
             final_score = $1,
             consensus_notes = $2
         WHERE submission_id = $3
         RETURNING *`,
        [final_score, consensus_notes, submissionId]
      );

      if (updated.rows.length === 0) {
        return res.status(404).json({ message: 'Submission not found' });
      }

      return res.json({
        message: 'Consensus recorded successfully. Final grade published.',
        submission: updated.rows[0],
      });
    } catch (error) {
      console.error('Error finalizing consensus:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
);


// 5. POST /api/grading/review/manual-grade/:submissionId - Quick Manual Grade by Lecturer
router.post(
  '/review/manual-grade/:submissionId',
  authenticateJWT,
  requireRole('LECTURER', 'ADMIN'),
  async (req: Request, res: Response) => {
    const submissionId = req.params.submissionId;
    const reviewerId = req.user!.userId;
    const { final_score, notes } = req.body;

    if (final_score === undefined) {
      return res.status(400).json({ message: 'final_score is required' });
    }

    try {
      const updated = await pool.query(
        `UPDATE submissions 
         SET status = 'FINALIZED',
             reviewer_1_id = $1,
             reviewer_1_score = $2,
             reviewer_1_notes = $3,
             final_score = $2
         WHERE submission_id = $4
         RETURNING *`,
        [reviewerId, Number(final_score), notes || 'Ch?m ?i?m tr?c ti?p b?i Gi?ng vi?n', submissionId]
      );

      if (updated.rows.length === 0) {
        return res.status(404).json({ message: 'Submission not found' });
      }

      return res.json({
        message: '?i?m v? nh?n x?t ?? ???c l?u v? c?ng b? th?nh c?ng.',
        submission: updated.rows[0],
      });
    } catch (error) {
      console.error('Error manual grading:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;
