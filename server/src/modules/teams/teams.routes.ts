import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
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

    // Giảng viên hoặc Admin đều có quyền tạo nhóm cho môn học


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

// POST /api/teams/:teamId/members - Thêm sinh viên vào nhóm qua user_id hoặc email
router.post('/:teamId/members', authenticateJWT, requireRole('ADMIN', 'LECTURER'), async (req: Request, res: Response) => {
  const teamId = parseInt(req.params.teamId, 10);
  const { user_id, email, student_email, emails, assigned_module, role } = req.body;

  if (isNaN(teamId)) {
    return res.status(400).json({ message: 'teamId không hợp lệ.' });
  }

  const memberRole = role === 'LEADER' ? 'LEADER' : 'MEMBER';

  try {
    // 1. Kiểm tra nhóm có tồn tại
    const teamRes = await pool.query(
      `SELECT t.*, c.lecturer_id, c.course_id, c.course_name, c.course_code 
       FROM teams t 
       JOIN courses c ON t.course_id = c.course_id 
       WHERE t.team_id = $1`,
      [teamId]
    );

    if (teamRes.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy nhóm tương ứng.' });
    }

    const team = teamRes.rows[0];

    // Giảng viên hoặc Admin đều có quyền quản lý thành viên của nhóm


    // 2. Thu thập danh sách người dùng cần gán
    const rawEmailString = (email || student_email || (Array.isArray(emails) ? emails.join(',') : emails) || '').toString().trim();
    const emailList = rawEmailString ? rawEmailString.split(/[,;\n]+/).map((s: string) => s.trim().toLowerCase()).filter(Boolean) : [];

    const targetUsers: Array<{ user_id: number; full_name: string; email: string; role: string }> = [];

    if (emailList.length > 0) {
      for (const mail of emailList) {
        // Tìm kiếm theo email
        let uRes = await pool.query('SELECT user_id, full_name, email, role FROM users WHERE LOWER(email) = LOWER($1)', [mail]);
        if (uRes.rows.length > 0) {
          const found = uRes.rows[0];
          if (found.role === 'LECTURER') {
            return res.status(400).json({
              message: `Email ${mail} đã được đăng ký cho Giảng viên, không thể gán vào nhóm sinh viên.`
            });
          }
          targetUsers.push(found);
        } else {
          // Tự động khởi tạo tài khoản Sinh viên mới nếu sinh viên chưa từng đăng nhập
          const emailPrefix = mail.split('@')[0];
          const defaultFullName = emailPrefix.split('.').map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
          const defaultHash = await bcrypt.hash('Password@123', 10);
          const newStudentRes = await pool.query(
            `INSERT INTO users (full_name, email, password_hash, role, status)
             VALUES ($1, $2, $3, 'STUDENT', 'ACTIVE')
             RETURNING user_id, full_name, email, role`,
            [defaultFullName, mail, defaultHash]
          );
          targetUsers.push(newStudentRes.rows[0]);
        }
      }
    } else if (user_id) {
      const userIdNum = parseInt(user_id, 10);
      if (isNaN(userIdNum)) {
        return res.status(400).json({ message: 'user_id không hợp lệ.' });
      }
      const uRes = await pool.query('SELECT user_id, full_name, email, role FROM users WHERE user_id = $1', [userIdNum]);
      if (uRes.rows.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy thông tin sinh viên.' });
      }
      const found = uRes.rows[0];
      if (found.role !== 'STUDENT') {
        return res.status(400).json({ message: 'Chỉ có thể thêm tài khoản có vai trò STUDENT vào nhóm.' });
      }
      targetUsers.push(found);
    } else {
      return res.status(400).json({
        message: 'Vui lòng cung cấp email sinh viên (email) hoặc mã sinh viên (user_id).'
      });
    }

    const assignedMembers: any[] = [];
    const moduleText = (assigned_module || 'Phát triển chức năng').trim();

    for (const targetUser of targetUsers) {
      // 3. Kiểm tra xem sinh viên đã tham gia nhóm này chưa
      const existingMember = await pool.query(
        'SELECT team_member_id FROM team_members WHERE team_id = $1 AND user_id = $2',
        [teamId, targetUser.user_id]
      );

      if (existingMember.rows.length > 0) {
        if (targetUsers.length === 1) {
          return res.status(409).json({ message: `Sinh viên (${targetUser.email}) đã là thành viên của nhóm này.` });
        }
        continue; // Bỏ qua nếu đã có trong nhóm
      }

      // 4. Thêm thành viên vào nhóm
      const insertRes = await pool.query(
        `INSERT INTO team_members (team_id, user_id, assigned_module, role) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [teamId, targetUser.user_id, moduleText, memberRole]
      );

      // 5. Đồng bộ gán sinh viên vào học phần tương ứng (course_enrollments)
      await pool.query(
        `INSERT INTO course_enrollments (course_id, user_id) 
         VALUES ($1, $2) 
         ON CONFLICT (course_id, user_id) DO NOTHING`,
        [team.course_id, targetUser.user_id]
      );

      const newMember = insertRes.rows[0];
      assignedMembers.push({
        team_member_id: newMember.team_member_id,
        team_id: newMember.team_id,
        user_id: targetUser.user_id,
        full_name: targetUser.full_name,
        email: targetUser.email,
        assigned_module: newMember.assigned_module,
        role: newMember.role,
      });
    }

    if (assignedMembers.length === 0) {
      return res.status(409).json({ message: 'Tất cả sinh viên chỉ định đã có tên trong nhóm này.' });
    }

    return res.status(201).json({
      message: `Đã thêm ${assignedMembers.length} sinh viên vào nhóm ${team.team_name} thành công.`,
      member: assignedMembers[0],
      members: assignedMembers,
    });
  } catch (error: any) {
    if (error.code === '23505') {
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
              'assigned_module', tm.assigned_module,
              'role', tm.role
            )
            ORDER BY CASE WHEN tm.role = 'LEADER' THEN 0 ELSE 1 END, tm.team_member_id ASC
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
              'assigned_module', tm.assigned_module,
              'role', tm.role
            )
            ORDER BY CASE WHEN tm.role = 'LEADER' THEN 0 ELSE 1 END, tm.team_member_id ASC
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

// DELETE /api/teams/:teamId/members/:teamMemberId - Xóa sinh viên khỏi nhóm
router.delete('/:teamId/members/:teamMemberId', authenticateJWT, requireRole('ADMIN', 'LECTURER'), async (req: Request, res: Response) => {
  const teamId = parseInt(req.params.teamId, 10);
  const teamMemberId = parseInt(req.params.teamMemberId, 10);

  if (isNaN(teamId) || isNaN(teamMemberId)) {
    return res.status(400).json({ message: 'Thông tin nhóm hoặc thành viên không hợp lệ.' });
  }

  try {
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

    // Giảng viên hoặc Admin đều có quyền quản lý thành viên của nhóm


    const deleteRes = await pool.query(
      'DELETE FROM team_members WHERE team_id = $1 AND team_member_id = $2 RETURNING *',
      [teamId, teamMemberId]
    );

    if (deleteRes.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy thành viên trong nhóm.' });
    }

    return res.json({ message: 'Đã xóa thành viên khỏi nhóm thành công.' });
  } catch (error) {
    console.error('Error removing team member:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/teams/:teamId - Xóa nhóm đồ án
router.delete('/:teamId', authenticateJWT, requireRole('ADMIN', 'LECTURER'), async (req: Request, res: Response) => {
  const teamId = parseInt(req.params.teamId, 10);
  if (isNaN(teamId)) {
    return res.status(400).json({ message: 'teamId không hợp lệ.' });
  }

  try {
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

    // Giảng viên hoặc Admin đều có quyền xóa nhóm


    // Xóa các dữ liệu liên quan đến nhóm
    await pool.query('DELETE FROM peer_audits WHERE team_id = $1', [teamId]);
    await pool.query('DELETE FROM git_commits WHERE team_id = $1', [teamId]);
    await pool.query('DELETE FROM submissions WHERE team_id = $1', [teamId]);
    await pool.query('DELETE FROM team_members WHERE team_id = $1', [teamId]);
    await pool.query('DELETE FROM teams WHERE team_id = $1', [teamId]);

    return res.json({ message: 'Đã xóa nhóm thành công.' });
  } catch (error) {
    console.error('Error deleting team:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
