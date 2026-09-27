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

    if (user.role === 'ADMIN') {
      // Admin xem tất cả môn học
      query = `
        SELECT c.*, u.full_name as lecturer_name, u.email as lecturer_email
        FROM courses c
        JOIN users u ON c.lecturer_id = u.user_id
        ORDER BY c.course_id DESC
      `;
    } else if (user.role === 'LECTURER') {
      // Giảng viên xem môn do mình giảng dạy
      query = `
        SELECT c.*, u.full_name as lecturer_name, u.email as lecturer_email
        FROM courses c
        JOIN users u ON c.lecturer_id = u.user_id
        WHERE c.lecturer_id = $1
        ORDER BY c.course_id DESC
      `;
      params = [user.userId];
    } else {
      // Sinh viên xem các môn học mình tham gia (qua teams) hoặc tất cả môn đang mở
      query = `
        SELECT DISTINCT c.*, u.full_name as lecturer_name, u.email as lecturer_email
        FROM courses c
        JOIN users u ON c.lecturer_id = u.user_id
        LEFT JOIN teams t ON c.course_id = t.course_id
        LEFT JOIN team_members tm ON t.team_id = tm.team_id
        WHERE tm.user_id = $1 OR tm.user_id IS NULL
        ORDER BY c.course_id DESC
      `;
      params = [user.userId];
    }

    const result = await pool.query(query, params);
    return res.json({ courses: result.rows });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/courses - Giảng viên (hoặc Admin) tạo môn học mới
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
              'assigned_module', tm.assigned_module
            )
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

    return res.json({
      course: {
        ...course,
        teams: teamsResult.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching course detail:', error);
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
              'assigned_module', tm.assigned_module
            )
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

export default router;

