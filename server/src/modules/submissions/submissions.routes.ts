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
        CASE WHEN COALESCE(a.due_date, a.deadline) IS NOT NULL AND s.submitted_at > COALESCE(a.due_date, a.deadline) THEN true ELSE false END as is_late,
        CASE WHEN COALESCE(a.due_date, a.deadline) IS NOT NULL AND s.submitted_at > COALESCE(a.due_date, a.deadline) THEN ROUND(EXTRACT(EPOCH FROM (s.submitted_at - COALESCE(a.due_date, a.deadline))) / 60) ELSE 0 END as late_minutes,
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
              'actual_output', ${isStudent ? `CASE WHEN rr.is_hidden THEN 'Output ẩn theo chuẩn BR-06' ELSE gr.actual_output END` : `gr.actual_output`},
              'status', COALESCE(gr.status, CASE WHEN gr.passed THEN 'Accepted' ELSE 'Wrong Answer' END),
              'ai_feedback', gr.ai_feedback,
              'container_id', gr.container_id,
              'docker_image', gr.docker_image,
              'exit_code', gr.exit_code,
              'code_hash', gr.code_hash
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
  const user = req.user!;
  const isStudent = user.role === 'STUDENT';

  try {
    const result = await pool.query(
      `SELECT s.*, 
              a.title as assignment_title, 
              a.deadline as assignment_deadline,
              a.due_date as assignment_due_date,
              a.close_date as assignment_close_date,
              a.status as assignment_status,
              a.submission_type as assignment_submission_type,
              a.max_score as assignment_max_score,
              a.course_id,
              t.team_name,
              u.full_name as submitter_name, u.email as submitter_email,
              gj.grading_job_id, gj.status as grading_status, gj.completed_at, gj.attempt_number,
              CASE WHEN COALESCE(a.due_date, a.deadline) IS NOT NULL AND s.submitted_at > COALESCE(a.due_date, a.deadline) THEN true ELSE false END as is_late,
              CASE WHEN COALESCE(a.due_date, a.deadline) IS NOT NULL AND s.submitted_at > COALESCE(a.due_date, a.deadline) THEN ROUND(EXTRACT(EPOCH FROM (s.submitted_at - COALESCE(a.due_date, a.deadline))) / 60) ELSE 0 END as late_minutes,
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
                    'actual_output', ${isStudent ? `CASE WHEN rr.is_hidden THEN 'Output ẩn theo chuẩn BR-06' ELSE gr.actual_output END` : `gr.actual_output`},
                    'status', COALESCE(gr.status, CASE WHEN gr.passed THEN 'ACCEPTED' ELSE 'WRONG_ANSWER' END),
                    'ai_feedback', gr.ai_feedback,
                    'container_id', gr.container_id,
                    'docker_image', gr.docker_image,
                    'exit_code', gr.exit_code,
                    'code_hash', gr.code_hash
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
       LEFT JOIN LATERAL (
         SELECT * FROM grading_jobs 
         WHERE submission_id = s.submission_id 
         ORDER BY grading_job_id DESC 
         LIMIT 1
       ) gj ON true
       WHERE s.submission_id = $1`,
      [submissionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const sub = result.rows[0];

    // RBAC: Sinh viên chỉ xem được bài của mình hoặc nhóm mình
    if (isStudent) {
      const isOwner = sub.submitted_by_user_id === user.userId;
      if (!isOwner) {
        if (sub.team_id) {
          const tmCheck = await pool.query(
            `SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2`,
            [sub.team_id, user.userId]
          );
          if (tmCheck.rows.length === 0) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập bài nộp này.' });
          }
        } else {
          return res.status(403).json({ message: 'Bạn không có quyền truy cập bài nộp này.' });
        }
      }
    }

    return res.json({ submission: sub });
  } catch (error) {
    console.error('Error fetching submission:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/submissions - Submit assignment direct code or artifact and queue BullMQ grading job
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  const { assignment_id, team_id, code_content, language, artifact_url, git_commit_hash } = req.body;
  const user = req.user!;

  // 1. Validate assignment_id
  if (!assignment_id) {
    return res.status(400).json({ message: 'Vui lòng chọn bài tập (assignment_id là bắt buộc).' });
  }

  // 2. Validate code_content: not empty
  if (!code_content || typeof code_content !== 'string' || code_content.trim().length === 0) {
    return res.status(400).json({ message: 'Mã nguồn không được để trống. Vui lòng nhập code trước khi nộp.' });
  }

  // 3. Validate code size: <= 100 KB (102,400 bytes)
  const codeBuffer = Buffer.from(code_content, 'utf8');
  if (codeBuffer.length > 102400) {
    return res.status(400).json({ message: 'Mã nguồn vượt quá dung lượng cho phép (tối đa 100 KB).' });
  }

  // 4. Validate language: python or javascript
  const normalizedLang = (language || '').toLowerCase().trim();
  if (normalizedLang !== 'python' && normalizedLang !== 'javascript' && normalizedLang !== 'nodejs') {
    return res.status(400).json({ message: 'Ngôn ngữ không hợp lệ. Hệ thống chỉ hỗ trợ "python" hoặc "javascript".' });
  }
  const cleanLang = normalizedLang === 'python' ? 'python' : 'javascript';

  const client = await pool.connect();
  try {
    // 5. Validate assignment exists & lifecycle policy
    const assignCheck = await client.query(
      `SELECT assignment_id, course_id, submission_type, deadline, due_date, start_date, close_date, 
              max_score, target_type, allowed_language, status, allow_late_submission, 
              max_submissions, allow_resubmission 
       FROM assignments WHERE assignment_id = $1`,
      [assignment_id]
    );
    if (assignCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Bài tập không tồn tại trong hệ thống.' });
    }
    const assignment = assignCheck.rows[0];
    const now = new Date();

    // 5a. Assignment lifecycle status check
    const currentStatus = assignment.status || 'PUBLISHED';
    if (currentStatus === 'DRAFT') {
      return res.status(403).json({ message: 'Bài tập đang ở trạng thái bản nháp (DRAFT), chưa mở nộp bài.' });
    }
    if (currentStatus === 'CLOSED') {
      return res.status(403).json({ message: 'Bài tập đã được đóng (CLOSED), không thể nộp bài.' });
    }
    if (currentStatus === 'ARCHIVED') {
      return res.status(403).json({ message: 'Bài tập đã được lưu trữ (ARCHIVED), không thể nộp bài.' });
    }

    // 5b. Start Date check
    if (assignment.start_date && now < new Date(assignment.start_date)) {
      return res.status(403).json({ message: 'Bài tập chưa đến thời gian mở nộp.' });
    }

    // 5c. Close Date check (hard deadline)
    if (assignment.close_date && now > new Date(assignment.close_date)) {
      return res.status(403).json({ message: 'Bài tập đã quá thời gian đóng bài (Close date), không thể tiếp tục nộp.' });
    }

    // 5d. Due Date & Late Submission check (soft deadline)
    const effectiveDeadline = assignment.due_date || assignment.deadline;
    const isLate = effectiveDeadline ? (now > new Date(effectiveDeadline)) : false;
    if (isLate && assignment.allow_late_submission === false) {
      return res.status(403).json({ message: 'Bài tập đã quá hạn nộp và không cho phép nộp trễ.' });
    }

    // 5b. Validate allowed language
    if (assignment.allowed_language && assignment.allowed_language !== 'ALL') {
      if (cleanLang !== assignment.allowed_language) {
        return res.status(400).json({
          message: `Bài tập này chỉ cho phép nộp bằng ngôn ngữ ${assignment.allowed_language}. Vui lòng chọn đúng ngôn ngữ yêu cầu.`,
        });
      }
    }

    // 6. Validate team/student authorization and target group
    let finalTeamId: number | null = team_id ? Number(team_id) : null;
    const targetType = assignment.target_type || 'ALL';

    if (assignment.submission_type === 'TEAM' && team_id) {
      const teamCheck = await client.query('SELECT team_id FROM teams WHERE team_id = $1', [team_id]);
      if (teamCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Nhóm đồ án không tồn tại.' });
      }

      if (user.role === 'STUDENT') {
        const memberCheck = await client.query(
          'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
          [team_id, user.userId]
        );
        if (memberCheck.rows.length === 0) {
          const teamHasMembers = await client.query('SELECT 1 FROM team_members WHERE team_id = $1 LIMIT 1', [team_id]);
          if (teamHasMembers.rows.length > 0) {
            return res.status(403).json({ message: 'Bạn không phải là thành viên của nhóm này.' });
          }
        }
      }
    } else if (assignment.submission_type === 'INDIVIDUAL') {
      if (!team_id) {
        finalTeamId = null;
      }
    }

    // Check target group permissions for students
    if (user.role === 'STUDENT') {
      if (targetType === 'SPECIFIC_TEAMS') {
        if (assignment.submission_type === 'TEAM') {
          if (!finalTeamId) {
            return res.status(400).json({ message: 'Bài tập nhóm yêu cầu nộp theo nhóm (vui lòng chọn team_id).' });
          }
          const checkTarget = await client.query(
            'SELECT 1 FROM assignment_target_teams WHERE assignment_id = $1 AND team_id = $2',
            [assignment_id, finalTeamId]
          );
          if (checkTarget.rows.length === 0) {
            return res.status(403).json({ message: 'Nhóm của bạn không thuộc danh sách đối tượng được giao bài tập này.' });
          }
        } else {
          // Individual assignment targeted to specific teams
          const checkTarget = await client.query(
            `SELECT 1 FROM assignment_target_teams att
             JOIN team_members tm ON att.team_id = tm.team_id
             WHERE att.assignment_id = $1 AND tm.user_id = $2`,
            [assignment_id, user.userId]
          );
          if (checkTarget.rows.length === 0) {
            return res.status(403).json({ message: 'Bạn không thuộc danh sách đối tượng được giao bài tập này.' });
          }
        }
      } else if (targetType === 'ALL') {
        // Enforce student enrolled in course
        const checkCourse = await client.query(
          `SELECT 1 FROM course_enrollments WHERE course_id = $1 AND user_id = $2
           UNION
           SELECT 1 FROM team_members tm JOIN teams t ON tm.team_id = t.team_id WHERE t.course_id = $1 AND tm.user_id = $2`,
          [assignment.course_id, user.userId]
        );
        const courseHasStudents = await client.query(
          `SELECT 1 FROM course_enrollments WHERE course_id = $1 LIMIT 1`,
          [assignment.course_id]
        );
        if (courseHasStudents.rows.length > 0 && checkCourse.rows.length === 0) {
          return res.status(403).json({ message: 'Bạn không thuộc lớp học phần được giao bài tập này.' });
        }
      }
    }

    await client.query('BEGIN');

    // 7. Team submission uniqueness: Một nhóm chỉ có một Submission chung cho cùng một Assignment & kiểm tra giới hạn nộp
    let submission: any;
    let attemptNumber = 1;

    if (assignment.submission_type === 'TEAM' && finalTeamId) {
      const existingSubRes = await client.query(
        'SELECT submission_id FROM submissions WHERE assignment_id = $1 AND team_id = $2 LIMIT 1',
        [assignment_id, finalTeamId]
      );

      if (existingSubRes.rows.length > 0) {
        if (assignment.allow_resubmission === false) {
          await client.query('ROLLBACK');
          return res.status(403).json({ message: 'Bài tập này không cho phép nộp lại (Resubmission is disabled).' });
        }

        const existingSubId = existingSubRes.rows[0].submission_id;
        const attemptRes = await client.query(
          'SELECT COALESCE(MAX(attempt_number), 0) + 1 as next_attempt, COUNT(*) as attempt_count FROM grading_jobs WHERE submission_id = $1',
          [existingSubId]
        );
        const currentAttempts = Number(attemptRes.rows[0]?.attempt_count) || (Number(attemptRes.rows[0]?.next_attempt) - 1) || 1;
        if (assignment.max_submissions && Number(assignment.max_submissions) > 0 && currentAttempts >= Number(assignment.max_submissions)) {
          await client.query('ROLLBACK');
          return res.status(403).json({ message: `Nhóm của bạn đã đạt giới hạn số lần nộp bài tối đa (${assignment.max_submissions} lần).` });
        }
        attemptNumber = Number(attemptRes.rows[0]?.next_attempt) || 2;

        const updateSubRes = await client.query(
          `UPDATE submissions 
           SET code_content = $1, language = $2, submitted_by_user_id = $3, 
               artifact_url = $4, git_commit_hash = $5, submitted_at = CURRENT_TIMESTAMP, 
               status = 'QUEUED'
           WHERE submission_id = $6
           RETURNING *`,
          [
            code_content.trim(),
            cleanLang,
            user.userId,
            artifact_url || '',
            git_commit_hash || 'DIRECT_SUBMIT',
            existingSubId
          ]
        );
        submission = updateSubRes.rows[0];
      } else {
        const subRes = await client.query(
          `INSERT INTO submissions (assignment_id, team_id, submitted_by_user_id, code_content, language, artifact_url, git_commit_hash, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'QUEUED') RETURNING *`,
          [
            assignment_id,
            finalTeamId,
            user.userId,
            code_content.trim(),
            cleanLang,
            artifact_url || '',
            git_commit_hash || 'DIRECT_SUBMIT'
          ]
        );
        submission = subRes.rows[0];
      }
    } else {
      const userSubsRes = await client.query(
        'SELECT COUNT(*) as sub_count FROM submissions WHERE assignment_id = $1 AND submitted_by_user_id = $2',
        [assignment_id, user.userId]
      );
      const existingUserSubs = Number(userSubsRes.rows[0]?.sub_count || 0);
      if (existingUserSubs > 0) {
        if (assignment.allow_resubmission === false) {
          await client.query('ROLLBACK');
          return res.status(403).json({ message: 'Bài tập này không cho phép nộp lại (Resubmission is disabled).' });
        }
        if (assignment.max_submissions && Number(assignment.max_submissions) > 0 && existingUserSubs >= Number(assignment.max_submissions)) {
          await client.query('ROLLBACK');
          return res.status(403).json({ message: `Bạn đã đạt giới hạn số lần nộp bài tối đa (${assignment.max_submissions} lần).` });
        }
      }

      const subRes = await client.query(
        `INSERT INTO submissions (assignment_id, team_id, submitted_by_user_id, code_content, language, artifact_url, git_commit_hash, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'QUEUED') RETURNING *`,
        [
          assignment_id,
          finalTeamId,
          user.userId,
          code_content.trim(),
          cleanLang,
          artifact_url || '',
          git_commit_hash || 'DIRECT_SUBMIT'
        ]
      );
      submission = subRes.rows[0];
    }

    // 8. Fetch default prompt template & active AI API Key
    const promptRes = await client.query(`SELECT prompt_template_id FROM prompt_templates WHERE purpose = 'Grading' LIMIT 1`);
    const promptId = promptRes.rows[0]?.prompt_template_id || null;

    const keyRes = await client.query(`SELECT ai_api_key_id FROM ai_api_keys WHERE status = 'ACTIVE' LIMIT 1`);
    const keyId = keyRes.rows[0]?.ai_api_key_id || null;

    // 9. Insert grading job
    const jobRes = await client.query(
      `INSERT INTO grading_jobs (submission_id, prompt_template_id, ai_api_key_id, priority, status, attempt_number, regrade_reason, triggered_by_user_id)
       VALUES ($1, $2, $3, 1, 'QUEUED', $4, $5, $6) RETURNING *`,
      [
        submission.submission_id,
        promptId,
        keyId,
        attemptNumber,
        attemptNumber > 1 ? 'Thành viên nhóm cập nhật bài nộp mới' : 'Nộp bài lần đầu',
        user.userId
      ]
    );
    const gradingJob = jobRes.rows[0];

    await client.query('COMMIT');

    // 10. Enqueue BullMQ job
    await addGradingJob({
      grading_job_id: gradingJob.grading_job_id,
      submission_id: submission.submission_id,
      assignment_id: Number(assignment_id),
      team_id: finalTeamId || undefined,
      artifact_url: artifact_url || '',
      git_commit_hash: git_commit_hash || 'DIRECT_SUBMIT',
      code_content: code_content.trim(),
      language: cleanLang,
      priority: 1,
    });

    return res.status(201).json({
      submission,
      grading_job: gradingJob,
      is_late: isLate,
      message: isLate 
        ? 'Nộp bài thành công (Nộp muộn sau hạn chót). Hệ thống đã đưa bài vào hàng đợi Docker Sandbox.'
        : 'Nộp bài thành công. Hệ thống đã đưa bài vào hàng đợi Docker Sandbox để chấm tự động.',
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
  const user = req.user!;
  const regradeReason = (req.body.regrade_reason || req.body.reason || 'Chấm lại theo yêu cầu giảng viên').trim();

  try {
    // 1. Fetch submission details along with assignment & course info
    const subRes = await pool.query(
      `SELECT s.submission_id, s.assignment_id, s.team_id, s.code_content, s.language, s.artifact_url, s.git_commit_hash,
              a.course_id, a.title as assignment_title
       FROM submissions s
       JOIN assignments a ON s.assignment_id = a.assignment_id
       WHERE s.submission_id = $1`,
      [submissionId]
    );

    if (subRes.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bài nộp (Submission not found).' });
    }

    const sub = subRes.rows[0];

    // 2. RBAC check: Lecturer must teach the course for this assignment
    if (user.role === 'LECTURER') {
      const courseCheck = await pool.query(
        `SELECT 1 FROM courses WHERE course_id = $1 AND lecturer_id = $2`,
        [sub.course_id, user.userId]
      );
      if (courseCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Bạn không có quyền quản lý bài tập của khóa học này để chấm lại.' });
      }
    }

    // 3. Concurrency check: Do not create duplicate jobs if already running or queued
    const activeJobRes = await pool.query(
      `SELECT grading_job_id, status FROM grading_jobs 
       WHERE submission_id = $1 AND status IN ('QUEUED', 'PROCESSING')`,
      [submissionId]
    );
    if (activeJobRes.rows.length > 0) {
      return res.status(409).json({
        message: `Bài nộp đang trong hàng đợi xử lý (Job #${activeJobRes.rows[0].grading_job_id}). Vui lòng đợi hoàn tất trước khi yêu cầu chấm lại.`
      });
    }

    // 4. Strict Validation: Must use stored code_content (NEVER fallback to artifact_url)
    if (!sub.code_content || typeof sub.code_content !== 'string' || sub.code_content.trim().length === 0) {
      return res.status(400).json({ message: 'Bài nộp không có mã nguồn đã lưu để chấm lại (Không dùng artifact_url thay thế).' });
    }
    const codeToRun = sub.code_content.trim();

    // 5. Strict Validation: Must have valid language (NEVER default to javascript)
    if (!sub.language || !['python', 'javascript', 'nodejs'].includes(sub.language.toLowerCase())) {
      return res.status(400).json({ message: 'Ngôn ngữ của bài nộp không hợp lệ hoặc bị thiếu (Không tự ý mặc định JavaScript).' });
    }
    const cleanLang = sub.language.toLowerCase() === 'python' ? 'python' : 'javascript';

    // 6. Compute next attempt_number
    const attemptRes = await pool.query(
      `SELECT COALESCE(MAX(attempt_number), 0) + 1 as next_attempt FROM grading_jobs WHERE submission_id = $1`,
      [submissionId]
    );
    const nextAttempt = Number(attemptRes.rows[0]?.next_attempt || 1);

    // 7. Reset submission status to QUEUED
    await pool.query(
      `UPDATE submissions 
       SET status = 'QUEUED' 
       WHERE submission_id = $1`,
      [submissionId]
    );

    // 8. Create new grading_job with attempt_number, regrade_reason, triggered_by_user_id
    const jobRes = await pool.query(
      `INSERT INTO grading_jobs (submission_id, priority, status, attempt_number, regrade_reason, triggered_by_user_id)
       VALUES ($1, 2, 'QUEUED', $2, $3, $4)
       RETURNING grading_job_id, attempt_number`,
      [submissionId, nextAttempt, regradeReason, user.userId]
    );

    const gradingJobId = jobRes.rows[0].grading_job_id;

    // 9. Add to BullMQ queue
    await addGradingJob({
      grading_job_id: gradingJobId,
      submission_id: Number(submissionId),
      assignment_id: sub.assignment_id,
      team_id: sub.team_id || undefined,
      artifact_url: sub.artifact_url || '',
      git_commit_hash: sub.git_commit_hash || 'DIRECT_SUBMIT',
      code_content: codeToRun,
      language: cleanLang as 'python' | 'javascript',
      priority: 2
    });

    return res.status(201).json({
      message: `Đã đưa bài nộp vào hàng đợi Docker Sandbox để chấm lại (Lần chấm #${nextAttempt})!`,
      submissionId: sub.submission_id,
      grading_job_id: gradingJobId,
      attempt_number: nextAttempt,
      language: cleanLang,
      regrade_reason: regradeReason
    });
  } catch (error) {
    console.error('Error regrading single submission:', error);
    return res.status(500).json({ message: 'Internal server error while regrading submission.' });
  }
});

// GET /api/submissions/:id/grading-history - Get full grading history & score diff between attempts
router.get('/:id/grading-history', authenticateJWT, async (req: Request, res: Response) => {
  const submissionId = req.params.id;
  const user = req.user!;
  const isStudent = user.role === 'STUDENT';

  try {
    // 1. Fetch submission details
    const subRes = await pool.query(
      `SELECT s.*, a.title as assignment_title, a.max_score as assignment_max_score, a.course_id
       FROM submissions s
       JOIN assignments a ON s.assignment_id = a.assignment_id
       WHERE s.submission_id = $1`,
      [submissionId]
    );

    if (subRes.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bài nộp.' });
    }

    const sub = subRes.rows[0];

    // 2. RBAC Access Control Check
    if (isStudent) {
      if (sub.submitted_by_user_id !== user.userId) {
        if (sub.team_id) {
          const teamMemberCheck = await pool.query(
            `SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2`,
            [sub.team_id, user.userId]
          );
          if (teamMemberCheck.rows.length === 0) {
            return res.status(403).json({ message: 'Bạn không có quyền xem lịch sử bài nộp này.' });
          }
        } else {
          return res.status(403).json({ message: 'Bạn không có quyền xem lịch sử bài nộp này.' });
        }
      }
    } else if (user.role === 'LECTURER') {
      const lecturerCheck = await pool.query(
        `SELECT 1 FROM courses WHERE course_id = $1 AND lecturer_id = $2`,
        [sub.course_id, user.userId]
      );
      if (lecturerCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Bạn không có quyền quản lý bài nộp của khóa học này.' });
      }
    }

    // 3. Query all grading_jobs for this submission ordered by attempt_number ASC, grading_job_id ASC
    const jobsRes = await pool.query(
      `SELECT gj.*, u.full_name as triggered_by_name
       FROM grading_jobs gj
       LEFT JOIN users u ON gj.triggered_by_user_id = u.user_id
       WHERE gj.submission_id = $1
       ORDER BY gj.attempt_number ASC, gj.grading_job_id ASC`,
      [submissionId]
    );

    const jobs = jobsRes.rows;

    // 4. Query all grading_results for these jobs
    const jobIds = jobs.map((j: any) => j.grading_job_id);
    let allResults: any[] = [];
    if (jobIds.length > 0) {
      const resultsRes = await pool.query(
        `SELECT gr.*, rr.criterion, rr.is_hidden, rr.max_score as rule_max_score, rr.input_data, rr.expected_output
         FROM grading_results gr
         JOIN rubric_rules rr ON gr.rubric_rule_id = rr.rubric_rule_id
         WHERE gr.grading_job_id = ANY($1::int[])
         ORDER BY rr.rubric_rule_id ASC`,
        [jobIds]
      );
      allResults = resultsRes.rows;
    }

    // 5. Build attempts with diffs
    const attempts = jobs.map((job: any, idx: number) => {
      let jobResults = allResults.filter(r => r.grading_job_id === job.grading_job_id);

      if (isStudent) {
        jobResults = jobResults.map(r => {
          if (r.is_hidden) {
            return {
              ...r,
              input_data: '[PROTECTED TEST CASE]',
              expected_output: '[PROTECTED TEST CASE]',
              actual_output: r.passed ? 'Output khớp tiêu chí bí mật' : 'Output không khớp tiêu chí bí mật'
            };
          }
          return r;
        });
      }

      const totalScore = job.total_score != null 
        ? Number(job.total_score) 
        : jobResults.reduce((sum, r) => sum + (Number(r.score) || 0), 0);
      const maxScore = job.max_score != null 
        ? Number(job.max_score) 
        : (Number(sub.assignment_max_score) || 10.0);

      // Diff against previous attempt
      let scoreDiff: string | null = null;
      let scoreDelta: number | null = null;
      const changedTestCases: any[] = [];

      if (idx > 0) {
        const prevJob = jobs[idx - 1];
        const prevResults = allResults.filter(r => r.grading_job_id === prevJob.grading_job_id);
        const prevTotal = prevJob.total_score != null 
          ? Number(prevJob.total_score) 
          : prevResults.reduce((sum, r) => sum + (Number(r.score) || 0), 0);
        
        scoreDelta = Number((totalScore - prevTotal).toFixed(2));
        scoreDiff = scoreDelta >= 0 ? `+${scoreDelta}` : `${scoreDelta}`;

        // Compare test cases
        for (const currTc of jobResults) {
          const prevTc = prevResults.find(p => p.rubric_rule_id === currTc.rubric_rule_id);
          if (prevTc) {
            if (prevTc.passed !== currTc.passed || Number(prevTc.score) !== Number(currTc.score)) {
              changedTestCases.push({
                rubric_rule_id: currTc.rubric_rule_id,
                criterion: currTc.criterion,
                previous_status: prevTc.status || (prevTc.passed ? 'ACCEPTED' : 'WRONG_ANSWER'),
                current_status: currTc.status || (currTc.passed ? 'ACCEPTED' : 'WRONG_ANSWER'),
                previous_score: Number(prevTc.score),
                current_score: Number(currTc.score),
                score_diff: Number((Number(currTc.score) - Number(prevTc.score)).toFixed(2))
              });
            }
          }
        }
      }

      return {
        attempt_number: job.attempt_number || (idx + 1),
        grading_job_id: job.grading_job_id,
        status: job.status,
        queued_at: job.queued_at,
        completed_at: job.completed_at,
        total_score: totalScore,
        max_score: maxScore,
        regrade_reason: job.regrade_reason || (idx === 0 ? 'Nộp bài ban đầu' : 'Chấm lại'),
        triggered_by_name: job.triggered_by_name || (idx === 0 ? 'Hệ thống tự động' : 'Giảng viên'),
        score_diff: scoreDiff,
        score_delta: scoreDelta,
        changed_test_cases: changedTestCases,
        test_results: jobResults
      };
    });

    return res.json({
      submission_id: sub.submission_id,
      assignment_id: sub.assignment_id,
      assignment_title: sub.assignment_title,
      total_attempts: attempts.length,
      current_score: sub.final_score != null ? Number(sub.final_score) : (attempts.length > 0 ? attempts[attempts.length - 1].total_score : 0),
      max_score: Number(sub.assignment_max_score) || 10.0,
      attempts
    });
  } catch (error) {
    console.error('Error fetching grading history:', error);
    return res.status(500).json({ message: 'Internal server error while fetching grading history.' });
  }
});

export default router;
