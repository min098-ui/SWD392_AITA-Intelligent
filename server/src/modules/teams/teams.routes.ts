import { Router, Request, Response } from 'express';
import { pool } from '../../config/db';
import { authenticateJWT, requireRole } from '../../common/auth.middleware';

const router = Router();

// POST /api/teams - Giảng viên (hoặc Admin) tạo nhóm, gán repo_url GitHub
router.post('/', authenticateJWT, requireRole('ADMIN', 'LECTURER'), async (req: Request, res: Response) => {
  const { team_name, course_id, repo_url } = req.body;

  if (!team_name || !course_id || !repo_url) {
    return res.status(400).json({
      message: 'Vui lòng cung cấp đầy đủ tên nhóm (team_name), mã khóa học (course_id) và đường dẫn GitHub (repo_url).',
    });
  }

  const courseIdNum = parseInt(course_id, 10);
  if (isNaN(courseIdNum)) {
    return res.status(400).json({ message: 'course_id không hợp lệ.' });
  }

  try {
    // Kiểm tra môn học có tồn tại hay không
    const courseRes = await pool.query('SELECT * FROM courses WHERE course_id = $1', [courseIdNum]);
    if (courseRes.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy môn học tương ứng.' });
    }

    const course = courseRes.rows[0];

    // Nếu người tạo là Giảng viên, xác thực giảng viên phụ trách môn học này
    if (req.user!.role === 'LECTURER' && course.lecturer_id !== req.user!.userId) {
      return res.status(403).json({
        message: 'Bạn chỉ có quyền tạo nhóm cho môn học do chính mình phụ trách.',
      });
    }

    // Thêm nhóm mới
    const result = await pool.query(
      `INSERT INTO teams (team_name, course_id, repo_url) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [team_name.trim(), courseIdNum, repo_url.trim()]
    );

    return res.status(201).json({
      message: 'Tạo nhóm thành công',
      team: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating team:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/teams/:teamId/members - Thêm sinh viên vào nhóm với assigned_module
router.post('/:teamId/members', authenticateJWT, requireRole('ADMIN', 'LECTURER'), async (req: Request, res: Response) => {
  const teamId = parseInt(req.params.teamId, 10);
  const { user_id, assigned_module } = req.body;

  if (isNaN(teamId)) {
    return res.status(400).json({ message: 'teamId không hợp lệ.' });
  }

  if (!user_id || !assigned_module) {
    return res.status(400).json({
      message: 'Vui lòng cung cấp mã sinh viên (user_id) và phân hệ phân công (assigned_module).',
    });
  }

  const userIdNum = parseInt(user_id, 10);
  if (isNaN(userIdNum)) {
    return res.status(400).json({ message: 'user_id không hợp lệ.' });
  }

  try {
    // 1. Kiểm tra nhóm có tồn tại
    const teamRes = await pool.query(
      `SELECT t.*, c.lecturer_id 
       FROM teams t 
       JOIN courses c ON t.course_id = c.course_id 
       WHERE t.team_id = $1`,
      [teamId]
    );

    if (teamRes.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy nhóm tương ứng.' });
    }

    const team = teamRes.rows[0];

    // Nếu người thêm là Giảng viên, kiểm tra quyền phụ trách
    if (req.user!.role === 'LECTURER' && team.lecturer_id !== req.user!.userId) {
      return res.status(403).json({
        message: 'Bạn chỉ có quyền quản lý thành viên của nhóm thuộc môn do mình phụ trách.',
      });
    }

    // 2. Kiểm tra sinh viên có tồn tại và đúng vai trò STUDENT
    const userRes = await pool.query('SELECT user_id, full_name, email, role FROM users WHERE user_id = $1', [userIdNum]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng được chỉ định.' });
    }

    const targetUser = userRes.rows[0];
    if (targetUser.role !== 'STUDENT') {
      return res.status(400).json({ message: 'Chỉ có thể thêm tài khoản có vai trò STUDENT vào nhóm.' });
    }

    // 3. Kiểm tra xem sinh viên đã tham gia nhóm này chưa
    const existingMember = await pool.query(
      'SELECT team_member_id FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, userIdNum]
    );

    if (existingMember.rows.length > 0) {
      return res.status(409).json({ message: 'Sinh viên đã là thành viên của nhóm này.' });
    }

    // 4. Thêm thành viên vào nhóm
    const insertRes = await pool.query(
      `INSERT INTO team_members (team_id, user_id, assigned_module) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [teamId, userIdNum, assigned_module.trim()]
    );

    const newMember = insertRes.rows[0];

    return res.status(201).json({
      message: 'Thêm thành viên vào nhóm thành công',
      member: {
        team_member_id: newMember.team_member_id,
        team_id: newMember.team_id,
        user_id: targetUser.user_id,
        full_name: targetUser.full_name,
        email: targetUser.email,
        assigned_module: newMember.assigned_module,
      },
    });
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ message: 'Sinh viên đã là thành viên của nhóm này.' });
    }
    console.error('Error adding team member:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/teams/:teamId - Lấy thông tin nhóm và danh sách thành viên
router.get('/:teamId', authenticateJWT, async (req: Request, res: Response) => {
  const teamId = parseInt(req.params.teamId, 10);

  if (isNaN(teamId)) {
    return res.status(400).json({ message: 'teamId không hợp lệ.' });
  }

  try {
    const query = `
      SELECT 
        t.team_id,
        t.team_name,
        t.repo_url,
        t.course_id,
        c.course_code,
        c.course_name,
        c.semester,
        u_lec.full_name as lecturer_name,
        u_lec.email as lecturer_email,
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
      JOIN courses c ON t.course_id = c.course_id
      JOIN users u_lec ON c.lecturer_id = u_lec.user_id
      LEFT JOIN team_members tm ON t.team_id = tm.team_id
      LEFT JOIN users u ON tm.user_id = u.user_id
      WHERE t.team_id = $1
      GROUP BY t.team_id, c.course_id, u_lec.full_name, u_lec.email
    `;

    const result = await pool.query(query, [teamId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy nhóm tương ứng.' });
    }

    return res.json({ team: result.rows[0] });
  } catch (error) {
    console.error('Error fetching team details:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/teams - Lấy tất cả các nhóm (hoặc lọc theo course_id)
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  const { course_id } = req.query;

  try {
    let query = `
      SELECT 
        t.team_id,
        t.team_name,
        t.repo_url,
        t.course_id,
        c.course_code,
        c.course_name,
        c.semester,
        u_lec.full_name as lecturer_name,
        u_lec.email as lecturer_email,
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
      JOIN courses c ON t.course_id = c.course_id
      JOIN users u_lec ON c.lecturer_id = u_lec.user_id
      LEFT JOIN team_members tm ON t.team_id = tm.team_id
      LEFT JOIN users u ON tm.user_id = u.user_id
    `;

    const params: any[] = [];
    if (course_id) {
      query += ' WHERE t.course_id = $1';
      params.push(parseInt(course_id as string, 10));
    }

    query += ' GROUP BY t.team_id, c.course_id, u_lec.full_name, u_lec.email ORDER BY t.team_id DESC';

    const result = await pool.query(query, params);
    return res.json({ teams: result.rows });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
