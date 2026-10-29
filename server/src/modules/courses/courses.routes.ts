import { Router, Request, Response } from 'express';
import { pool } from '../../config/db';
import { authenticateJWT, requireRole } from '../../common/auth.middleware';

const router = Router();

// GET /api/courses - Lấy danh sách môn học (Giảng viên xem môn mình dạy, Admin xem tất cả)
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  const user = req.user!;

  try {
    let query: string;
    let params: any[] = [];

    if (user.role === 'ADMIN' || user.role === 'LECTURER') {
      // Giảng viên và Quản trị viên xem tất cả các môn học đang hoạt động
      // Đảm bảo hỗ trợ đánh giá chéo BR-09 (Dual-Lecturer Review) và quản lý học phần
      query = `
        SELECT c.*, u.full_name as lecturer_name, u.email as lecturer_email
        FROM courses c
        JOIN users u ON c.lecturer_id = u.user_id
        ORDER BY c.course_id ASC
      `;
    } else {
      // Sinh viên xem các môn học mình tham gia (qua teams) hoặc tất cả môn đang mở
      query = `
        SELECT DISTINCT c.*, u.full_name as lecturer_name, u.email as lecturer_email,
               (ce.user_id IS NOT NULL OR tm.user_id IS NOT NULL) as is_enrolled
        FROM courses c
        JOIN users u ON c.lecturer_id = u.user_id
        LEFT JOIN teams t ON c.course_id = t.course_id
        LEFT JOIN team_members tm ON t.team_id = tm.team_id AND tm.user_id = $1
        LEFT JOIN course_enrollments ce ON c.course_id = ce.course_id AND ce.user_id = $1
        WHERE (ce.user_id = $1 OR tm.user_id = $1 OR $2 = true)
        ORDER BY c.course_id DESC
      `;
      params = [user.userId, req.query.all === 'true'];
    }

    const result = await pool.query(query, params);
    return res.json({ courses: result.rows });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/courses - Chỉ Giảng viên mới có quyền tạo môn học mới
router.post('/', authenticateJWT, requireRole('ADMIN', 'LECTURER'), async (req: Request, res: Response) => {
  const { course_code, course_name, semester, lecturer_id } = req.body;

  if (!course_code || !course_name || !semester) {
    return res.status(400).json({ message: 'Vui lòng cung cấp mã môn học (course_code), tên môn học (course_name) và học kỳ (semester).' });
  }

  // Nếu là Giảng viên, tự động gán lecturer_id là chính mình; Nếu là Admin, có thể chỉ định hoặc lấy chính mình
  let assignedLecturerId = req.user!.userId;
  if (req.user!.role === 'ADMIN' && lecturer_id) {
    assignedLecturerId = parseInt(lecturer_id, 10);
  }

  try {
    // Kiểm tra xem lecturer_id có tồn tại và hợp lệ không
    const lecturerCheck = await pool.query(
      'SELECT user_id, role, full_name FROM users WHERE user_id = $1 AND role IN (\'LECTURER\', \'ADMIN\')',
      [assignedLecturerId]
    );

    if (lecturerCheck.rows.length === 0) {
      return res.status(400).json({ message: 'Giảng viên được chỉ định không tồn tại hoặc không hợp lệ.' });
    }

    const result = await pool.query(
      `INSERT INTO courses (course_code, course_name, semester, lecturer_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [course_code.trim(), course_name.trim(), semester.trim(), assignedLecturerId]
    );

    return res.status(201).json({
      message: 'Tạo môn học thành công',
      course: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating course:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/courses/:id - Chi tiết môn học kèm danh sách nhóm
router.get('/:id', authenticateJWT, async (req: Request, res: Response) => {
  const courseId = parseInt(req.params.id, 10);

  if (isNaN(courseId)) {
    return res.status(400).json({ message: 'Mã môn học không hợp lệ.' });
  }

  try {
    // Lấy thông tin môn học và giảng viên
    const courseQuery = `
      SELECT c.*, u.full_name as lecturer_name, u.email as lecturer_email
      FROM courses c
      JOIN users u ON c.lecturer_id = u.user_id
      WHERE c.course_id = $1
    `;
    const courseResult = await pool.query(courseQuery, [courseId]);

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy môn học.' });
    }

    const course = courseResult.rows[0];

    // Lấy danh sách nhóm cùng các thành viên trong nhóm của môn học này
    const teamsQuery = `
      SELECT t.team_id, t.team_name, t.repo_url, t.course_id,
        COALESCE(
          json_agg(
            json_build_object(
              'team_member_id', tm.team_member_id,
              'user_id', u.user_id,
              'full_name', u.full_name,
              'email', u.email,
              'assigned_module', tm.assigned_module,
              'role', tm.role
            )
            ORDER BY CASE WHEN tm.role = 'LEADER' THEN 0 ELSE 1 END, tm.team_member_id ASC
          ) FILTER (WHERE tm.team_member_id IS NOT NULL), '[]'::json
        ) as members
      FROM teams t
      LEFT JOIN team_members tm ON t.team_id = tm.team_id
      LEFT JOIN users u ON tm.user_id = u.user_id
      WHERE t.course_id = $1
      GROUP BY t.team_id
      ORDER BY t.team_id ASC
    `;
    const teamsResult = await pool.query(teamsQuery, [courseId]);

    // Lấy danh sách sinh viên đã ghi danh vào môn học này (course_enrollments)
    const studentsQuery = `
      SELECT ce.enrollment_id, ce.course_id, ce.enrolled_at,
             u.user_id, u.full_name, u.email, u.role
      FROM course_enrollments ce
      JOIN users u ON ce.user_id = u.user_id
      WHERE ce.course_id = $1
      ORDER BY ce.enrolled_at ASC, u.full_name ASC
    `;
    const studentsResult = await pool.query(studentsQuery, [courseId]);

    return res.json({
      course: {
        ...course,
        teams: teamsResult.rows,
        students: studentsResult.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching course detail:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/courses/:id/enroll - Ghi danh sinh viên vào khóa học (course_enrollments)
router.post('/:id/enroll', authenticateJWT, async (req: Request, res: Response) => {
  const courseId = parseInt(req.params.id, 10);
  if (isNaN(courseId)) {
    return res.status(400).json({ message: 'Mã môn học không hợp lệ.' });
  }

  // Nếu là LECTURER hoặc ADMIN thì có thể chỉ định user_id trong req.body
  // Nếu là STUDENT thì tự ghi danh chính mình (req.user!.userId)
  let targetUserId = req.user!.userId;
  if (['ADMIN', 'LECTURER'].includes(req.user!.role)) {
    if (req.body.user_id) {
      targetUserId = parseInt(req.body.user_id, 10);
    }
  }

  try {
    // 1. Kiểm tra môn học có tồn tại không
    const courseCheck = await pool.query('SELECT course_id, course_code, course_name, lecturer_id FROM courses WHERE course_id = $1', [courseId]);
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy môn học tương ứng.' });
    }

    // Giảng viên chỉ được ghi danh cho môn do mình phụ trách
    if (req.user!.role === 'LECTURER' && courseCheck.rows[0].lecturer_id !== req.user!.userId) {
      return res.status(403).json({ message: 'Bạn chỉ có quyền quản lý ghi danh cho môn do mình giảng dạy.' });
    }

    // 2. Kiểm tra sinh viên có tồn tại và đúng vai trò STUDENT không
    const userCheck = await pool.query('SELECT user_id, full_name, email, role FROM users WHERE user_id = $1', [targetUserId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin sinh viên.' });
    }
    if (userCheck.rows[0].role !== 'STUDENT') {
      return res.status(400).json({ message: 'Chỉ có thể ghi danh tài khoản có vai trò STUDENT vào môn học.' });
    }

    // 3. Thực hiện ghi danh vào bảng course_enrollments
    const insertRes = await pool.query(
      `INSERT INTO course_enrollments (course_id, user_id) 
       VALUES ($1, $2) 
       RETURNING *`,
      [courseId, targetUserId]
    );

    return res.status(201).json({
      message: 'Ghi danh sinh viên vào môn học thành công',
      enrollment: {
        ...insertRes.rows[0],
        student: userCheck.rows[0],
        course: courseCheck.rows[0],
      },
    });
  } catch (error: any) {
    if (error.code === '23505') { // Unique constraint violation (uq_course_enrollment)
      return res.status(409).json({ message: 'Sinh viên đã được ghi danh vào môn học này từ trước.' });
    }
    console.error('Error enrolling student:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/courses/:id/students - Lấy danh sách sinh viên đã ghi danh vào môn học
router.get('/:id/students', authenticateJWT, async (req: Request, res: Response) => {
  const courseId = parseInt(req.params.id, 10);
  if (isNaN(courseId)) {
    return res.status(400).json({ message: 'Mã môn học không hợp lệ.' });
  }

  try {
    const query = `
      SELECT ce.enrollment_id, ce.course_id, ce.enrolled_at,
             u.user_id, u.full_name, u.email, u.role
      FROM course_enrollments ce
      JOIN users u ON ce.user_id = u.user_id
      WHERE ce.course_id = $1
      ORDER BY ce.enrolled_at ASC, u.full_name ASC
    `;
    const result = await pool.query(query, [courseId]);
    return res.json({ students: result.rows });
  } catch (error) {
    console.error('Error fetching enrolled students:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/courses/:id/teams - List teams and members in course (Giữ để tương thích ngược)
router.get('/:id/teams', authenticateJWT, async (req: Request, res: Response) => {
  const courseId = parseInt(req.params.id, 10);
  if (isNaN(courseId)) {
    return res.status(400).json({ message: 'Mã môn học không hợp lệ.' });
  }

  try {
    const teamsQuery = `
      SELECT t.*, 
        COALESCE(
          json_agg(
            json_build_object(
              'team_member_id', tm.team_member_id,
              'user_id', u.user_id,
              'full_name', u.full_name,
              'email', u.email,
              'assigned_module', tm.assigned_module,
              'role', tm.role
            )
            ORDER BY CASE WHEN tm.role = 'LEADER' THEN 0 ELSE 1 END, tm.team_member_id ASC
          ) FILTER (WHERE tm.team_member_id IS NOT NULL), '[]'::json
        ) as members
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

// PUT /api/courses/:id - Giảng viên (hoặc Admin) cập nhật thông tin học phần
router.put('/:id', authenticateJWT, requireRole('ADMIN', 'LECTURER'), async (req: Request, res: Response) => {
  const courseId = parseInt(req.params.id, 10);
  const { course_code, course_name, semester } = req.body;

  if (isNaN(courseId)) {
    return res.status(400).json({ message: 'Mã môn học không hợp lệ.' });
  }

  if (!course_code || !course_name || !semester) {
    return res.status(400).json({ message: 'Vui lòng cung cấp mã môn học, tên môn học và học kỳ.' });
  }

  try {
    const courseRes = await pool.query('SELECT * FROM courses WHERE course_id = $1', [courseId]);
    if (courseRes.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy môn học.' });
    }

    const course = courseRes.rows[0];
    if (req.user!.role === 'LECTURER' && course.lecturer_id !== req.user!.userId) {
      return res.status(403).json({ message: 'Bạn chỉ có quyền chỉnh sửa môn học do mình giảng dạy.' });
    }

    const result = await pool.query(
      `UPDATE courses 
       SET course_code = $1, course_name = $2, semester = $3 
       WHERE course_id = $4 
       RETURNING *`,
      [course_code.trim(), course_name.trim(), semester.trim(), courseId]
    );

    return res.json({
      message: 'Cập nhật môn học thành công',
      course: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating course:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/courses/:id - Giảng viên (hoặc Admin) xóa học phần và dữ liệu liên quan
router.delete('/:id', authenticateJWT, requireRole('ADMIN', 'LECTURER'), async (req: Request, res: Response) => {
  const courseId = parseInt(req.params.id, 10);
  if (isNaN(courseId)) {
    return res.status(400).json({ message: 'Mã môn học không hợp lệ.' });
  }

  try {
    const courseRes = await pool.query('SELECT * FROM courses WHERE course_id = $1', [courseId]);
    if (courseRes.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy môn học.' });
    }

    const course = courseRes.rows[0];
    if (req.user!.role === 'LECTURER' && course.lecturer_id !== req.user!.userId) {
      return res.status(403).json({ message: 'Bạn chỉ có quyền xóa môn học do mình giảng dạy.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Lấy danh sách nhóm thuộc môn học
      const teamsRes = await client.query('SELECT team_id FROM teams WHERE course_id = $1', [courseId]);
      const teamIds = teamsRes.rows.map((r: any) => r.team_id);

      if (teamIds.length > 0) {
        await client.query('DELETE FROM peer_audits WHERE team_id = ANY($1)', [teamIds]);
        await client.query('DELETE FROM git_commits WHERE team_id = ANY($1)', [teamIds]);

        const subRes = await client.query('SELECT submission_id FROM submissions WHERE team_id = ANY($1)', [teamIds]);
        const subIds = subRes.rows.map((r: any) => r.submission_id);

        if (subIds.length > 0) {
          const jobsRes = await client.query('SELECT grading_job_id FROM grading_jobs WHERE submission_id = ANY($1)', [subIds]);
          const jobIds = jobsRes.rows.map((r: any) => r.grading_job_id);

          if (jobIds.length > 0) {
            await client.query('DELETE FROM grading_results WHERE grading_job_id = ANY($1)', [jobIds]);
            await client.query('DELETE FROM grading_jobs WHERE grading_job_id = ANY($1)', [jobIds]);
          }

          await client.query('DELETE FROM tutor_chat_messages WHERE submission_id = ANY($1)', [subIds]);
          await client.query('DELETE FROM submissions WHERE submission_id = ANY($1)', [subIds]);
        }

        await client.query('DELETE FROM team_members WHERE team_id = ANY($1)', [teamIds]);
        await client.query('DELETE FROM teams WHERE course_id = $1', [courseId]);
      }

      // 2. Xóa các bài tập và rubric của môn học
      const assignRes = await client.query('SELECT assignment_id FROM assignments WHERE course_id = $1', [courseId]);
      const assignIds = assignRes.rows.map((r: any) => r.assignment_id);

      if (assignIds.length > 0) {
        await client.query('DELETE FROM rubric_rules WHERE assignment_id = ANY($1)', [assignIds]);
        await client.query('DELETE FROM tutor_chat_sessions WHERE assignment_id = ANY($1)', [assignIds]);
        await client.query('DELETE FROM assignments WHERE course_id = $1', [courseId]);
      }

      // 3. Xóa ghi danh
      await client.query('DELETE FROM course_enrollments WHERE course_id = $1', [courseId]);

      // 4. Xóa môn học
      await client.query('DELETE FROM courses WHERE course_id = $1', [courseId]);

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    return res.json({ message: 'Đã xóa học phần và toàn bộ dữ liệu liên quan thành công.' });
  } catch (error) {
    console.error('Error deleting course:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;


