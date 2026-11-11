import { Router, Request, Response } from 'express';
import { pool } from '../../config/db';
import { authenticateJWT, requireRole } from '../../common/auth.middleware';
import { addGradingJob } from '../grading/grading.queue';
import { aiTutorService } from '../ai-tutor/ai-tutor.service';
import { sandboxService } from '../grading/sandbox.service';
import { normalizeOutput } from '../grading/grading.worker';

const router = Router();

// GET /api/assignments - Get list of assignments (optional ?course_id=)
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  const { course_id } = req.query;
  const user = req.user!;
  const isStudent = user && user.role === 'STUDENT';

  try {
    let query = `
      SELECT a.*, c.course_code, c.course_name,
             (SELECT COUNT(*) FROM rubric_rules rr WHERE rr.assignment_id = a.assignment_id) as rubric_count,
             (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.assignment_id) as submission_count,
             (
               SELECT COALESCE(
                 json_agg(
                   json_build_object(
                     'team_id', t.team_id,
                     'team_name', t.team_name
                   )
                 ),
                 '[]'::json
               )
               FROM assignment_target_teams att
               JOIN teams t ON att.team_id = t.team_id
               WHERE att.assignment_id = a.assignment_id
             ) as target_teams
      FROM assignments a
      JOIN courses c ON a.course_id = c.course_id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (course_id) {
      params.push(course_id);
      conditions.push(`a.course_id = $${params.length}`);
    }

    // Role-based visibility: sinh viên chỉ xem bài tập PUBLISHED/CLOSED/ARCHIVED (không xem DRAFT) và được giao cho cả lớp hoặc nhóm mình
    if (isStudent) {
      conditions.push(`COALESCE(a.status, 'PUBLISHED') != 'DRAFT'`);
      params.push(user.userId);
      const studentIdx = params.length;
      conditions.push(`(
        (COALESCE(a.target_type, 'ALL') = 'ALL' AND (
          EXISTS (SELECT 1 FROM course_enrollments ce WHERE ce.course_id = a.course_id AND ce.user_id = $${studentIdx})
          OR EXISTS (SELECT 1 FROM team_members tm JOIN teams t ON tm.team_id = t.team_id WHERE t.course_id = a.course_id AND tm.user_id = $${studentIdx})
          OR NOT EXISTS (SELECT 1 FROM course_enrollments ce WHERE ce.course_id = a.course_id)
        ))
        OR
        (a.target_type = 'SPECIFIC_TEAMS' AND EXISTS (
          SELECT 1 FROM assignment_target_teams att
          JOIN team_members tm ON att.team_id = tm.team_id
          WHERE att.assignment_id = a.assignment_id AND tm.user_id = $${studentIdx}
        ))
      )`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }
    query += ' ORDER BY a.assignment_id ASC';

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

    // Phân quyền truy cập đối tượng giao bài cho sinh viên & chặn xem DRAFT
    if (user.role === 'STUDENT') {
      if (assignment.status === 'DRAFT') {
        return res.status(403).json({ message: 'Bài tập này đang ở trạng thái bản nháp (DRAFT), sinh viên không có quyền truy cập.' });
      }
      const targetType = assignment.target_type || 'ALL';
      if (targetType === 'SPECIFIC_TEAMS') {
        const checkTarget = await pool.query(
          `SELECT 1 FROM assignment_target_teams att
           JOIN team_members tm ON att.team_id = tm.team_id
           WHERE att.assignment_id = $1 AND tm.user_id = $2`,
          [assignmentId, user.userId]
        );
        if (checkTarget.rows.length === 0) {
          return res.status(403).json({ message: 'Bạn không thuộc danh sách đối tượng được giao bài tập này.' });
        }
      }
    }

    // Lấy danh sách nhóm được giao bài (target_teams)
    const targetTeamsRes = await pool.query(
      `SELECT t.team_id, t.team_name 
       FROM assignment_target_teams att
       JOIN teams t ON att.team_id = t.team_id
       WHERE att.assignment_id = $1`,
      [assignmentId]
    );
    assignment.target_teams = targetTeamsRes.rows;

    // Fetch rubric rules ordered by order_index ASC, rubric_rule_id ASC
    const rubricResult = await pool.query(
      'SELECT * FROM rubric_rules WHERE assignment_id = $1 ORDER BY order_index ASC, rubric_rule_id ASC',
      [assignmentId]
    );

    let rubrics = rubricResult.rows;

    // BR-06: Protect hidden test cases and hide Draft/Disabled for students
    if (user.role === 'STUDENT') {
      rubrics = rubrics
        .filter((r) => !r.status || r.status === 'Active' || r.status === 'Hidden')
        .map((r) => {
          if (r.is_hidden || r.status === 'Hidden') {
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

// POST /api/assignments/generate-ai - Generate assignment & test cases from lecture slides/topics via AI (BR-04 Key Pool / Gemini)
router.post('/generate-ai', authenticateJWT, requireRole('LECTURER', 'ADMIN'), async (req: Request, res: Response) => {
  const { topic, slideSummary, language = 'javascript', difficulty = 'MEDIUM' } = req.body;

  if (!topic || typeof topic !== 'string' || !topic.trim()) {
    return res.status(400).json({ 
      message: 'Vui lòng cung cấp chủ đề bài học hoặc slide bài giảng (topic is required).' 
    });
  }

  try {
    const generated = await aiTutorService.generateAssignmentFromSlide({
      topic: topic.trim(),
      slideSummary: slideSummary ? String(slideSummary).trim() : undefined,
      language: language === 'python' ? 'python' : 'javascript',
      difficulty: ['EASY', 'MEDIUM', 'HARD'].includes(difficulty) ? difficulty : 'MEDIUM',
    });

    return res.json({
      success: true,
      data: generated,
    });
  } catch (error: any) {
    console.error('Error in /api/assignments/generate-ai:', error);
    return res.status(500).json({
      message: 'Lỗi khi AI khởi tạo bài tập: ' + (error?.message || 'Internal server error'),
    });
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
    close_date,
    deadline,
    max_score = 10.0,
    submission_type = 'TEAM',
    target_type = 'ALL',
    target_team_ids = [],
    allowed_language = 'ALL',
    status = 'PUBLISHED',
    allow_late_submission = true,
    max_submissions = 0,
    allow_resubmission = true,
    rubrics = [],
  } = req.body;

  if (!course_id || !title) {
    return res.status(400).json({ message: 'course_id and title are required.' });
  }

  const cleanTargetType = target_type === 'SPECIFIC_TEAMS' ? 'SPECIFIC_TEAMS' : 'ALL';
  const cleanLang = ['python', 'javascript', 'java'].includes(String(allowed_language).toLowerCase()) 
    ? String(allowed_language).toLowerCase() 
    : 'ALL';
  const cleanStatus = ['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'].includes(String(status).toUpperCase())
    ? String(status).toUpperCase()
    : 'PUBLISHED';

  if (cleanTargetType === 'SPECIFIC_TEAMS') {
    if (!Array.isArray(target_team_ids) || target_team_ids.length === 0) {
      return res.status(400).json({ 
        message: 'Vui lòng chọn ít nhất một nhóm sinh viên khi chọn giao bài cho nhóm cụ thể.' 
      });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert Assignment
    const effectiveDeadline = due_date || deadline || new Date(Date.now() + 7 * 24 * 3600 * 1000);
    const effectiveStartDate = start_date || new Date();
    const effectiveCloseDate = close_date || effectiveDeadline;

    const assignmentRes = await client.query(
      `INSERT INTO assignments 
       (course_id, title, description, start_date, due_date, close_date, deadline, max_score, submission_type, target_type, allowed_language, status, allow_late_submission, max_submissions, allow_resubmission) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [
        course_id,
        title,
        description || '',
        effectiveStartDate,
        effectiveDeadline,
        effectiveCloseDate,
        effectiveDeadline,
        Number(max_score) || 10.0,
        submission_type || 'TEAM',
        cleanTargetType,
        cleanLang,
        cleanStatus,
        allow_late_submission !== undefined ? Boolean(allow_late_submission) : true,
        max_submissions !== undefined ? Number(max_submissions) : 0,
        allow_resubmission !== undefined ? Boolean(allow_resubmission) : true,
      ]
    );
    const newAssignment = assignmentRes.rows[0];

    // 1b. Gán nhóm mục tiêu nếu là SPECIFIC_TEAMS
    const targetTeamsList: any[] = [];
    if (cleanTargetType === 'SPECIFIC_TEAMS' && Array.isArray(target_team_ids)) {
      for (const tid of target_team_ids) {
        const teamIdNum = Number(tid);
        if (!isNaN(teamIdNum)) {
          await client.query(
            `INSERT INTO assignment_target_teams (assignment_id, team_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [newAssignment.assignment_id, teamIdNum]
          );
          targetTeamsList.push(teamIdNum);
        }
      }
    }

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
      assignment: {
        ...newAssignment,
        target_teams: targetTeamsList,
      },
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

// POST /api/assignments/:id/test-cases/preview - Run Reference Solution against Sandbox on-the-fly (Lecturer / Admin only)
router.post('/:id/test-cases/preview', authenticateJWT, requireRole('LECTURER', 'ADMIN'), async (req: Request, res: Response) => {
  const assignmentId = req.params.id;
  const { code_content, language, input_data, expected_output, time_limit_ms, memory_limit_mb } = req.body;

  if (!code_content || typeof code_content !== 'string' || !code_content.trim()) {
    return res.status(400).json({ message: 'Reference Solution code_content is required.' });
  }

  const normalizedLang = (language || '').toLowerCase().trim();
  if (normalizedLang !== 'python' && normalizedLang !== 'javascript' && normalizedLang !== 'java') {
    return res.status(400).json({ message: 'Only python, javascript, and java are supported in sandbox.' });
  }

  try {
    const checkRes = await pool.query('SELECT assignment_id FROM assignments WHERE assignment_id = $1', [assignmentId]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    const timeLimit = Math.min(Math.max(Number(time_limit_ms) || 5000, 500), 30000);
    const memoryLimit = Math.min(Math.max(Number(memory_limit_mb) || 256, 64), 1024);

    const execResult = await sandboxService.runCode({
      code: code_content,
      language: normalizedLang as 'python' | 'javascript' | 'java',
      inputData: input_data !== undefined && input_data !== null ? String(input_data) : '',
      timeoutMs: timeLimit,
      memoryLimitBytes: memoryLimit * 1024 * 1024,
    });

    const cleanActual = normalizeOutput(execResult.stdout);
    const cleanExpected = normalizeOutput(expected_output !== undefined && expected_output !== null ? String(expected_output) : '');

    let status: 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'SYSTEM_ERROR' = 'WRONG_ANSWER';
    let passed = false;

    if (execResult.error === 'Docker service unavailable' || (!execResult.timedOut && !execResult.memoryExceeded && (execResult.stderr || '').includes('Docker daemon is not reachable'))) {
      status = 'SYSTEM_ERROR';
    } else if (execResult.timedOut) {
      status = 'TIME_LIMIT_EXCEEDED';
    } else if (execResult.memoryExceeded) {
      status = 'MEMORY_LIMIT_EXCEEDED';
    } else if (execResult.exitCode !== 0) {
      status = 'RUNTIME_ERROR';
    } else if (cleanActual === cleanExpected) {
      status = 'ACCEPTED';
      passed = true;
    } else {
      status = 'WRONG_ANSWER';
    }

    return res.json({
      passed,
      status,
      actual_output: execResult.stdout || execResult.stderr || '',
      expected_output: expected_output || '',
      stderr: execResult.stderr,
      execution_time_ms: execResult.executionTimeMs,
      exit_code: execResult.exitCode,
      error_message: execResult.error,
    });
  } catch (error: any) {
    console.error('Error previewing test case:', error);
    return res.status(500).json({ message: 'Internal server error while executing reference solution.', error: error?.message });
  }
});

// PUT /api/assignments/:id/rubrics/reorder - Reorder Rubric Rules (Lecturer / Admin only)
router.put('/:id/rubrics/reorder', authenticateJWT, requireRole('LECTURER', 'ADMIN'), async (req: Request, res: Response) => {
  const assignmentId = req.params.id;
  const { orders } = req.body; // Array of { rubric_rule_id: number, order_index: number }

  if (!Array.isArray(orders)) {
    return res.status(400).json({ message: 'orders must be an array of { rubric_rule_id, order_index }' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of orders) {
      if (item.rubric_rule_id !== undefined && item.order_index !== undefined) {
        await client.query(
          'UPDATE rubric_rules SET order_index = $1 WHERE rubric_rule_id = $2 AND assignment_id = $3',
          [Number(item.order_index), item.rubric_rule_id, assignmentId]
        );
      }
    }
    await client.query('COMMIT');

    const updatedResult = await pool.query(
      'SELECT * FROM rubric_rules WHERE assignment_id = $1 ORDER BY order_index ASC, rubric_rule_id ASC',
      [assignmentId]
    );

    return res.json({
      message: 'Rubric rules reordered successfully.',
      rubrics: updatedResult.rows,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error reordering rubrics:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

// POST /api/assignments/:id/rubrics - Add a Rubric Rule to an existing assignment (Lecturer / Admin only)
router.post('/:id/rubrics', authenticateJWT, requireRole('LECTURER', 'ADMIN'), async (req: Request, res: Response) => {
  const assignmentId = req.params.id;
  const {
    rule_type = 'AUTOMATED',
    criterion,
    description = '',
    input_data,
    expected_output,
    weight = 1.0,
    max_score = 10.0,
    is_hidden = false,
    status = 'Active',
    order_index,
  } = req.body;

  if (!criterion) {
    return res.status(400).json({ message: 'criterion is required for rubric rule.' });
  }

  const scoreNum = Number(max_score);
  if (isNaN(scoreNum) || scoreNum <= 0) {
    return res.status(400).json({ message: 'max_score must be a positive number.' });
  }

  const validStatuses = ['Draft', 'Active', 'Hidden', 'Disabled'];
  const finalStatus = is_hidden ? 'Hidden' : (validStatuses.includes(status) ? status : 'Active');
  const finalIsHidden = Boolean(is_hidden || finalStatus === 'Hidden');

  try {
    const checkRes = await pool.query('SELECT assignment_id, max_score FROM assignments WHERE assignment_id = $1', [assignmentId]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    const assignmentMaxScore = Number(checkRes.rows[0].max_score) || 10.0;

    // Validate score cap: sum of active/hidden rubric rules + new max_score <= assignmentMaxScore
    if (finalStatus === 'Active' || finalStatus === 'Hidden') {
      const sumRes = await pool.query(
        "SELECT COALESCE(SUM(max_score), 0) AS total_score FROM rubric_rules WHERE assignment_id = $1 AND (status IS NULL OR status IN ('Active', 'Hidden'))",
        [assignmentId]
      );
      const currentTotal = Number(sumRes.rows[0].total_score) || 0;
      if (currentTotal + scoreNum > assignmentMaxScore + 0.0001) {
        return res.status(400).json({
          message: `Tổng điểm các Test Case (${(currentTotal + scoreNum).toFixed(1)}) vượt quá điểm tối đa của bài tập (${assignmentMaxScore.toFixed(1)}).`,
          current_total: currentTotal,
          assignment_max_score: assignmentMaxScore,
        });
      }
    }

    // Determine next order_index if not provided
    let finalOrderIndex = Number(order_index);
    if (isNaN(finalOrderIndex)) {
      const orderRes = await pool.query(
        'SELECT COALESCE(MAX(order_index), 0) + 1 AS next_index FROM rubric_rules WHERE assignment_id = $1',
        [assignmentId]
      );
      finalOrderIndex = Number(orderRes.rows[0].next_index) || 0;
    }

    const insertRes = await pool.query(
      `INSERT INTO rubric_rules 
       (assignment_id, rule_type, criterion, description, input_data, expected_output, weight, max_score, is_hidden, status, order_index) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        assignmentId,
        rule_type,
        criterion,
        description || '',
        input_data || '',
        expected_output || '',
        Number(weight) || 1.0,
        scoreNum,
        finalIsHidden,
        finalStatus,
        finalOrderIndex,
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

// PUT /api/assignments/:id/rubrics/:rubricId - Update a Rubric Rule (Lecturer / Admin only)
router.put('/:id/rubrics/:rubricId', authenticateJWT, requireRole('LECTURER', 'ADMIN'), async (req: Request, res: Response) => {
  const { id: assignmentId, rubricId } = req.params;
  const { criterion, description, input_data, expected_output, max_score, weight, is_hidden, status, order_index } = req.body;

  try {
    const existingRes = await pool.query(
      'SELECT * FROM rubric_rules WHERE rubric_rule_id = $1 AND assignment_id = $2',
      [rubricId, assignmentId]
    );
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ message: 'Rubric rule not found.' });
    }
    const existing = existingRes.rows[0];

    const targetStatus = status !== undefined ? status : (is_hidden !== undefined ? (is_hidden ? 'Hidden' : 'Active') : existing.status);
    const targetIsHidden = Boolean(is_hidden !== undefined ? is_hidden : (targetStatus === 'Hidden' ? true : existing.is_hidden));
    const targetScore = max_score !== undefined ? Number(max_score) : Number(existing.max_score);

    // Validate score cap if target status is active/hidden
    if (targetStatus === 'Active' || targetStatus === 'Hidden') {
      const assignRes = await pool.query('SELECT max_score FROM assignments WHERE assignment_id = $1', [assignmentId]);
      const assignmentMaxScore = Number(assignRes.rows[0]?.max_score) || 10.0;

      const sumRes = await pool.query(
        "SELECT COALESCE(SUM(max_score), 0) AS total_score FROM rubric_rules WHERE assignment_id = $1 AND rubric_rule_id != $2 AND (status IS NULL OR status IN ('Active', 'Hidden'))",
        [assignmentId, rubricId]
      );
      const otherTotal = Number(sumRes.rows[0].total_score) || 0;

      if (otherTotal + targetScore > assignmentMaxScore + 0.0001) {
        return res.status(400).json({
          message: `Tổng điểm các Test Case (${(otherTotal + targetScore).toFixed(1)}) vượt quá điểm tối đa của bài tập (${assignmentMaxScore.toFixed(1)}).`,
          current_total: otherTotal,
          assignment_max_score: assignmentMaxScore,
        });
      }
    }

    const updateRes = await pool.query(
      `UPDATE rubric_rules 
       SET criterion = COALESCE($1, criterion),
           description = COALESCE($2, description),
           input_data = COALESCE($3, input_data),
           expected_output = COALESCE($4, expected_output),
           max_score = COALESCE($5, max_score),
           weight = COALESCE($6, weight),
           is_hidden = COALESCE($7, is_hidden),
           status = COALESCE($8, status),
           order_index = COALESCE($9, order_index)
       WHERE rubric_rule_id = $10 AND assignment_id = $11
       RETURNING *`,
      [
        criterion,
        description !== undefined ? description : null,
        input_data !== undefined ? input_data : null,
        expected_output !== undefined ? expected_output : null,
        max_score !== undefined ? Number(max_score) : null,
        weight !== undefined ? Number(weight) : null,
        targetIsHidden,
        targetStatus,
        order_index !== undefined ? Number(order_index) : null,
        rubricId,
        assignmentId,
      ]
    );

    return res.json({
      message: 'Rubric rule updated successfully.',
      rubric_rule: updateRes.rows[0],
    });
  } catch (error) {
    console.error('Error updating rubric rule:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/assignments/:id/rubrics/:rubricId - Safe Delete or Deactivate a Rubric Rule (Lecturer / Admin only)
router.delete('/:id/rubrics/:rubricId', authenticateJWT, requireRole('LECTURER', 'ADMIN'), async (req: Request, res: Response) => {
  const { id: assignmentId, rubricId } = req.params;

  try {
    const existingRes = await pool.query(
      'SELECT * FROM rubric_rules WHERE rubric_rule_id = $1 AND assignment_id = $2',
      [rubricId, assignmentId]
    );
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ message: 'Rubric rule not found.' });
    }

    // Check if grading_results exist for this rubric rule
    const gradingHistoryRes = await pool.query(
      'SELECT COUNT(*) as count FROM grading_results WHERE rubric_rule_id = $1',
      [rubricId]
    );
    const hasGradingHistory = parseInt(gradingHistoryRes.rows[0]?.count || '0', 10) > 0;

    if (hasGradingHistory) {
      // Safe deactivation: do NOT delete, set status = 'Disabled' to preserve historical submissions
      await pool.query(
        "UPDATE rubric_rules SET status = 'Disabled' WHERE rubric_rule_id = $1 AND assignment_id = $2",
        [rubricId, assignmentId]
      );

      return res.json({
        message: 'Test Case đã có lịch sử chấm bài. Hệ thống đã chuyển trạng thái sang Vô hiệu hóa (Disabled) để bảo vệ lịch sử bài nộp của sinh viên.',
        disabled: true,
      });
    }

    // No grading history, safe to hard delete
    await pool.query(
      'DELETE FROM rubric_rules WHERE rubric_rule_id = $1 AND assignment_id = $2',
      [rubricId, assignmentId]
    );

    return res.json({ message: 'Rubric rule deleted successfully.', deleted: true });
  } catch (error) {
    console.error('Error deleting rubric rule:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/assignments/:id - Update assignment details (Lecturer / Admin only)
router.put('/:id', authenticateJWT, requireRole('LECTURER', 'ADMIN'), async (req: Request, res: Response) => {
  const assignmentId = req.params.id;
  const { 
    title, 
    description, 
    start_date, 
    due_date, 
    close_date,
    deadline, 
    max_score, 
    submission_type,
    target_type,
    target_team_ids,
    allowed_language,
    status,
    allow_late_submission,
    max_submissions,
    allow_resubmission,
  } = req.body;

  try {
    const effectiveDeadline = due_date || deadline;
    const cleanTargetType = target_type ? (target_type === 'SPECIFIC_TEAMS' ? 'SPECIFIC_TEAMS' : 'ALL') : null;
    const cleanLang = allowed_language !== undefined ? (['python', 'javascript', 'java'].includes(String(allowed_language).toLowerCase()) ? String(allowed_language).toLowerCase() : 'ALL') : null;
    const cleanStatus = status !== undefined && ['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'].includes(String(status).toUpperCase())
      ? String(status).toUpperCase()
      : null;

    const updateRes = await pool.query(
      `UPDATE assignments 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           start_date = COALESCE($3, start_date),
           due_date = COALESCE($4, due_date),
           deadline = COALESCE($4, deadline),
           max_score = COALESCE($5, max_score),
           submission_type = COALESCE($6, submission_type),
           target_type = COALESCE($7, target_type),
           allowed_language = COALESCE($8, allowed_language),
           close_date = COALESCE($9, close_date),
           status = COALESCE($10, status),
           allow_late_submission = COALESCE($11, allow_late_submission),
           max_submissions = COALESCE($12, max_submissions),
           allow_resubmission = COALESCE($13, allow_resubmission)
       WHERE assignment_id = $14 RETURNING *`,
      [
        title,
        description,
        start_date,
        effectiveDeadline,
        max_score ? Number(max_score) : null,
        submission_type,
        cleanTargetType,
        cleanLang,
        close_date !== undefined ? close_date : null,
        cleanStatus,
        allow_late_submission !== undefined ? Boolean(allow_late_submission) : null,
        max_submissions !== undefined ? Number(max_submissions) : null,
        allow_resubmission !== undefined ? Boolean(allow_resubmission) : null,
        assignmentId,
      ]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    // Cập nhật bảng trung gian assignment_target_teams nếu có thay đổi
    if (cleanTargetType === 'ALL') {
      await pool.query('DELETE FROM assignment_target_teams WHERE assignment_id = $1', [assignmentId]);
    } else if (cleanTargetType === 'SPECIFIC_TEAMS' && Array.isArray(target_team_ids)) {
      await pool.query('DELETE FROM assignment_target_teams WHERE assignment_id = $1', [assignmentId]);
      for (const tid of target_team_ids) {
        const teamIdNum = Number(tid);
        if (!isNaN(teamIdNum)) {
          await pool.query(
            `INSERT INTO assignment_target_teams (assignment_id, team_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [assignmentId, teamIdNum]
          );
        }
      }
    }

    const targetTeamsRes = await pool.query(
      `SELECT t.team_id, t.team_name 
       FROM assignment_target_teams att
       JOIN teams t ON att.team_id = t.team_id
       WHERE att.assignment_id = $1`,
      [assignmentId]
    );

    return res.json({
      message: 'Assignment updated successfully.',
      assignment: {
        ...updateRes.rows[0],
        target_teams: targetTeamsRes.rows,
      },
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/assignments/:id/status - Update assignment lifecycle status (Lecturer / Admin only)
router.patch('/:id/status', authenticateJWT, requireRole('LECTURER', 'ADMIN'), async (req: Request, res: Response) => {
  const assignmentId = req.params.id;
  const { status } = req.body;

  if (!status || !['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'].includes(String(status).toUpperCase())) {
    return res.status(400).json({ 
      message: 'Trạng thái không hợp lệ. Vui lòng chọn một trong: DRAFT, PUBLISHED, CLOSED, ARCHIVED.' 
    });
  }

  const cleanStatus = String(status).toUpperCase();

  try {
    const updateRes = await pool.query(
      `UPDATE assignments SET status = $1 WHERE assignment_id = $2 RETURNING *`,
      [cleanStatus, assignmentId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    return res.json({
      message: `Đã cập nhật trạng thái bài tập thành ${cleanStatus}.`,
      assignment: updateRes.rows[0],
    });
  } catch (error) {
    console.error('Error updating assignment status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/assignments/:id - Delete assignment (Lecturer / Admin only)
router.delete('/:id', authenticateJWT, requireRole('LECTURER', 'ADMIN'), async (req: Request, res: Response) => {
  const assignmentId = req.params.id;

  try {
    // 1. Delete AI tutor chat sessions & messages linked to this assignment
    await pool.query(
      'DELETE FROM tutor_chat_messages WHERE session_id IN (SELECT session_id FROM tutor_chat_sessions WHERE assignment_id = $1)',
      [assignmentId]
    );
    await pool.query('DELETE FROM tutor_chat_sessions WHERE assignment_id = $1', [assignmentId]);

    // 2. Delete grading_results linked to rubric_rules or submissions of this assignment
    await pool.query(
      `DELETE FROM grading_results 
       WHERE rubric_rule_id IN (SELECT rubric_rule_id FROM rubric_rules WHERE assignment_id = $1)
          OR grading_job_id IN (
            SELECT grading_job_id FROM grading_jobs 
            WHERE submission_id IN (SELECT submission_id FROM submissions WHERE assignment_id = $1)
          )`,
      [assignmentId]
    );

    // 3. Delete grading_jobs
    await pool.query(
      'DELETE FROM grading_jobs WHERE submission_id IN (SELECT submission_id FROM submissions WHERE assignment_id = $1)',
      [assignmentId]
    );

    // 4. Delete submissions
    await pool.query('DELETE FROM submissions WHERE assignment_id = $1', [assignmentId]);

    // 5. Delete rubric_rules
    await pool.query('DELETE FROM rubric_rules WHERE assignment_id = $1', [assignmentId]);

    // 6. Delete assignment
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

// POST /api/assignments/:id/regrade - Re-grade all submissions for this assignment (Lecturer / Admin only)
router.post('/:id/regrade', authenticateJWT, requireRole('LECTURER', 'ADMIN'), async (req: Request, res: Response) => {
  const assignmentId = req.params.id;
  const user = req.user!;
  const regradeReason = (req.body.regrade_reason || req.body.reason || 'Chấm lại toàn bộ bài tập theo yêu cầu giảng viên').trim();

  try {
    // 1. Verify assignment exists and lecturer has permission
    const assignRes = await pool.query(
      `SELECT a.assignment_id, a.title, a.course_id 
       FROM assignments a 
       WHERE a.assignment_id = $1`, 
      [assignmentId]
    );
    if (assignRes.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    const assignment = assignRes.rows[0];

    // RBAC: Check course ownership for Lecturer
    if (user.role === 'LECTURER') {
      const courseCheck = await pool.query(
        `SELECT 1 FROM courses WHERE course_id = $1 AND lecturer_id = $2`,
        [assignment.course_id, user.userId]
      );
      if (courseCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Bạn không có quyền quản lý bài tập của khóa học này để chấm lại hàng loạt.' });
      }
    }

    // 2. Query all submissions for this assignment with code_content and language
    const subsRes = await pool.query(
      `SELECT s.submission_id, s.assignment_id, s.team_id, s.code_content, s.language, s.artifact_url, s.git_commit_hash
       FROM submissions s
       WHERE s.assignment_id = $1
       ORDER BY s.submitted_at DESC`,
      [assignmentId]
    );

    if (subsRes.rows.length === 0) {
      return res.status(200).json({ 
        message: 'Không tìm thấy bài nộp nào cho bài tập này để chấm lại.', 
        total_submissions: 0,
        queued_count: 0,
        skipped_count: 0
      });
    }

    // 3. For each submission, validate code & language, avoid duplicate active jobs, and enqueue
    let queuedCount = 0;
    let skippedCount = 0;
    const skippedReasons: string[] = [];

    for (const sub of subsRes.rows) {
      // 3.1 Strict Validation: Must have code_content (NEVER fallback to artifact_url)
      if (!sub.code_content || typeof sub.code_content !== 'string' || sub.code_content.trim().length === 0) {
        skippedCount++;
        skippedReasons.push(`Bài #${sub.submission_id}: Thiếu mã nguồn đã lưu`);
        continue;
      }
      const codeToRun = sub.code_content.trim();

      // 3.2 Strict Validation: Must have valid language (NEVER default to javascript)
      if (!sub.language || !['python', 'javascript', 'nodejs', 'java'].includes(sub.language.toLowerCase())) {
        skippedCount++;
        skippedReasons.push(`Bài #${sub.submission_id}: Ngôn ngữ không hợp lệ (${sub.language || 'trống'})`);
        continue;
      }
      const cleanLang: 'python' | 'javascript' | 'java' = sub.language.toLowerCase() === 'python' ? 'python' : (sub.language.toLowerCase() === 'java' ? 'java' : 'javascript');

      // 3.3 Concurrency check: Skip if already QUEUED or PROCESSING to avoid duplicate jobs
      const activeJobRes = await pool.query(
        `SELECT grading_job_id FROM grading_jobs 
         WHERE submission_id = $1 AND status IN ('QUEUED', 'PROCESSING')`,
        [sub.submission_id]
      );
      if (activeJobRes.rows.length > 0) {
        skippedCount++;
        skippedReasons.push(`Bài #${sub.submission_id}: Đang có tiến trình chấm dở dang`);
        continue;
      }

      // 3.4 Calculate attempt number
      const attemptRes = await pool.query(
        `SELECT COALESCE(MAX(attempt_number), 0) + 1 as next_attempt FROM grading_jobs WHERE submission_id = $1`,
        [sub.submission_id]
      );
      const nextAttempt = Number(attemptRes.rows[0]?.next_attempt || 1);

      // 3.5 Reset submission status to QUEUED
      await pool.query(
        `UPDATE submissions 
         SET status = 'QUEUED' 
         WHERE submission_id = $1`,
        [sub.submission_id]
      );

      // 3.6 Create new grading_job with attempt_number and regrade_reason
      const jobRes = await pool.query(
        `INSERT INTO grading_jobs (submission_id, priority, status, attempt_number, regrade_reason, triggered_by_user_id)
         VALUES ($1, 1, 'QUEUED', $2, $3, $4)
         RETURNING grading_job_id`,
        [sub.submission_id, nextAttempt, regradeReason, user.userId]
      );

      const gradingJobId = jobRes.rows[0].grading_job_id;

      // 3.7 Push to BullMQ queue
      await addGradingJob({
        grading_job_id: gradingJobId,
        submission_id: sub.submission_id,
        assignment_id: Number(assignmentId),
        team_id: sub.team_id || undefined,
        artifact_url: sub.artifact_url || '',
        git_commit_hash: sub.git_commit_hash || 'DIRECT_SUBMIT',
        code_content: codeToRun,
        language: cleanLang as 'python' | 'javascript' | 'java',
        priority: 1
      });

      queuedCount++;
    }

    return res.json({
      message: `Đã đưa ${queuedCount}/${subsRes.rows.length} bài nộp vào hàng đợi Docker Sandbox để chấm lại tự động!`,
      total_submissions: subsRes.rows.length,
      queued_count: queuedCount,
      skipped_count: skippedCount,
      skipped_reasons: skippedReasons,
      regrade_reason: regradeReason
    });
  } catch (error) {
    console.error('Error regrading assignment submissions:', error);
    return res.status(500).json({ message: 'Internal server error while regrading.' });
  }
});

export default router;
