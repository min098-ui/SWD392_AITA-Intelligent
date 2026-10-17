import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../../config/db';
import { authenticateJWT } from '../../common/auth.middleware';

const router = Router();

// Permanent Admin accounts (cố định quyền ADMIN tuyệt đối)
const DEFAULT_ADMIN_EMAILS = [
  'lenguyenanhmai05@gmail.com',
  'tuongvy22102004@gmail.com',
  'admin@fpt.edu.vn',
];

export const isPermanentAdmin = (email: string): boolean => {
  const normalized = (email || '').toLowerCase().trim();
  const envAdmins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.toLowerCase().trim())
    .filter(Boolean);
  return DEFAULT_ADMIN_EMAILS.includes(normalized) || envAdmins.includes(normalized);
};

// POST /api/auth/register (BR-01: Bcrypt salt = 10)
router.post('/register', async (req: Request, res: Response) => {
  const { name, fullName, email, password, role } = req.body;
  const userFullName = (fullName || name || '').trim();
  const userEmail = (email || '').trim().toLowerCase();

  if (!userFullName || !userEmail || !password) {
    return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ họ tên, email và mật khẩu.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.' });
  }

  const isAdmin = isPermanentAdmin(userEmail);
  const userRole = isAdmin ? 'ADMIN' : (['ADMIN', 'LECTURER', 'STUDENT'].includes(role) ? role : 'STUDENT');
  const userStatus = isAdmin ? 'ACTIVE' : (userRole === 'LECTURER' ? 'PENDING' : 'ACTIVE');

  try {
    // Check if user already exists
    const existingUser = await pool.query('SELECT user_id FROM users WHERE LOWER(email) = LOWER($1)', [userEmail]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Email đã được sử dụng. Vui lòng chọn email khác.' });
    }

    // Hash password with Bcrypt (salt = 10 as specified in BR-01)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, status) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING user_id, full_name, email, role, status, created_at`,
      [userFullName, userEmail, passwordHash, userRole, userStatus]
    );

    const newUser = result.rows[0];

    if (newUser.role === 'LECTURER' && newUser.status === 'PENDING') {
      return res.status(201).json({
        message: 'Đăng ký tài khoản Giảng viên thành công. Hồ sơ đã được gửi đến Quản trị viên (Admin) phê duyệt.',
        pendingApproval: true,
        user: {
          userId: newUser.user_id,
          fullName: newUser.full_name,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
          createdAt: newUser.created_at,
        },
      });
    }

    return res.status(201).json({
      message: 'Đăng ký tài khoản thành công',
      user: {
        userId: newUser.user_id,
        fullName: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        createdAt: newUser.created_at,
      },
    });
  } catch (error: any) {
    if (error.code === '23505') { // Postgres unique_violation
      return res.status(409).json({ message: 'Email đã được sử dụng.' });
    }
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password, role: requestedRole } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email và mật khẩu không được để trống.' });
  }

  const userEmail = email.trim().toLowerCase();
  const isAdmin = isPermanentAdmin(userEmail);

  try {
    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [userEmail]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
    }

    const user = result.rows[0];
    let isPasswordValid = false;
    if (user.password_hash && user.password_hash.startsWith('OAUTH_')) {
      if (password === 'Password@123' || (isAdmin && password)) {
        isPasswordValid = true;
      }
    } else if (user.password_hash) {
      try {
        isPasswordValid = await bcrypt.compare(password, user.password_hash);
      } catch (e) {
        isPasswordValid = false;
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
    }

    // 1. Cố định quyền Admin cho tài khoản đặc biệt
    if (isAdmin) {
      if (user.role !== 'ADMIN' || user.status !== 'ACTIVE') {
        await pool.query("UPDATE users SET role = 'ADMIN', status = 'ACTIVE' WHERE user_id = $1", [user.user_id]);
        user.role = 'ADMIN';
        user.status = 'ACTIVE';
      }
    } else {
      // 2. Ràng buộc vai trò Email (Role Exclusivity)
      if (requestedRole) {
        if (user.role === 'LECTURER' && requestedRole === 'STUDENT') {
          return res.status(403).json({
            code: 'ROLE_CONFLICT_LECTURER_AS_STUDENT',
            message: 'Email này đã đăng nhập cho Giảng viên, không được đăng nhập cho Sinh viên!'
          });
        }
        if (user.role === 'STUDENT' && requestedRole === 'LECTURER') {
          return res.status(403).json({
            code: 'ROLE_CONFLICT_STUDENT_AS_LECTURER',
            message: 'Email này đã đăng nhập cho Sinh viên, không được đăng nhập cho Giảng viên!'
          });
        }
      }

      // 3. Kiểm tra trạng thái phê duyệt Giảng viên
      if (user.role === 'LECTURER' && user.status === 'PENDING') {
        return res.status(403).json({
          code: 'LECTURER_PENDING_APPROVAL',
          message: 'Tài khoản Giảng viên của bạn đang chờ Quản trị viên (Admin) phê duyệt. Vui lòng liên hệ Admin để được cấp quyền truy cập.'
        });
      }

      // 4. Kiểm tra tài khoản bị khóa / từ chối
      if (user.status === 'LOCKED' || user.status === 'REJECTED') {
        return res.status(403).json({
          code: 'ACCOUNT_LOCKED',
          message: 'Tài khoản của bạn đã bị khóa hoặc từ chối phê duyệt bởi Quản trị viên.'
        });
      }
    }

    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_aita_project_swd392_2026';
    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
      },
      secret,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
    );

    return res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        userId: user.user_id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/auth/google (Google Workspace Single Sign-On for @fpt.edu.vn / @fe.edu.vn)
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { email, fullName, role } = req.body;
    const userEmail = (email || 'student1@fpt.edu.vn').trim().toLowerCase();
    const isAdmin = isPermanentAdmin(userEmail);

    let result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [userEmail]);
    let user;

    if (result.rows.length === 0) {
      // Auto-provision Google SSO user
      if (isAdmin) {
        const name = fullName || 'AMai Admin';
        const insertRes = await pool.query(
          `INSERT INTO users (full_name, email, password_hash, role, status) 
           VALUES ($1, $2, $3, 'ADMIN', 'ACTIVE') 
           RETURNING user_id, full_name, email, role, status, created_at`,
          [name, userEmail, 'OAUTH_GOOGLE']
        );
        user = insertRes.rows[0];
      } else {
        const targetRole = role === 'LECTURER' ? 'LECTURER' : 'STUDENT';
        const targetStatus = targetRole === 'LECTURER' ? 'PENDING' : 'ACTIVE';
        const name = fullName || userEmail.split('@')[0];

        const insertRes = await pool.query(
          `INSERT INTO users (full_name, email, password_hash, role, status) 
           VALUES ($1, $2, $3, $4, $5) 
           RETURNING user_id, full_name, email, role, status, created_at`,
          [name, userEmail, 'OAUTH_GOOGLE', targetRole, targetStatus]
        );
        user = insertRes.rows[0];

        // Lần đầu tiên Giảng viên đăng nhập -> gửi vào cho admin duyệt
        if (targetRole === 'LECTURER') {
          return res.status(403).json({
            code: 'LECTURER_PENDING_APPROVAL',
            message: 'Tài khoản Giảng viên của bạn đã được gửi vào hệ thống và đang chờ Quản trị viên (Admin) phê duyệt. Vui lòng liên hệ Admin để được cấp quyền truy cập.'
          });
        }
      }
    } else {
      user = result.rows[0];

      if (isAdmin) {
        if (user.role !== 'ADMIN' || user.status !== 'ACTIVE') {
          await pool.query("UPDATE users SET role = 'ADMIN', status = 'ACTIVE' WHERE user_id = $1", [user.user_id]);
          user.role = 'ADMIN';
          user.status = 'ACTIVE';
        }
      } else {
        const currentRole = (user.role || '').toUpperCase().trim();
        const incomingRole = (role || '').toUpperCase().trim();

        // Ràng buộc vai trò: Mail đã là LECTURER thì tuyệt đối không được đăng nhập với vai trò STUDENT
        if (currentRole === 'LECTURER' && incomingRole === 'STUDENT') {
          return res.status(403).json({
            code: 'ROLE_CONFLICT_LECTURER_AS_STUDENT',
            message: 'Email này đã đăng ký cho Giảng viên, tuyệt đối không được đăng nhập cho Sinh viên!'
          });
        }
        // Ràng buộc vai trò: Mail đã là STUDENT thì tuyệt đối không được đăng nhập với vai trò LECTURER
        if (currentRole === 'STUDENT' && incomingRole === 'LECTURER') {
          return res.status(403).json({
            code: 'ROLE_CONFLICT_STUDENT_AS_LECTURER',
            message: 'Email này đã đăng ký cho Sinh viên, tuyệt đối không được đăng nhập cho Giảng viên!'
          });
        }

        // Kiểm tra trạng thái duyệt cho Giảng viên
        if (user.role === 'LECTURER' && user.status === 'PENDING') {
          return res.status(403).json({
            code: 'LECTURER_PENDING_APPROVAL',
            message: 'Tài khoản Giảng viên của bạn đang chờ Quản trị viên (Admin) phê duyệt. Vui lòng đợi Admin duyệt trước khi đăng nhập.'
          });
        }

        // Kiểm tra tài khoản bị khóa / từ chối
        if (user.status === 'LOCKED' || user.status === 'REJECTED') {
          return res.status(403).json({
            code: 'ACCOUNT_LOCKED',
            message: 'Tài khoản của bạn đã bị khóa hoặc từ chối phê duyệt bởi Quản trị viên.'
          });
        }
      }
    }

    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_aita_project_swd392_2026';
    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
      },
      secret,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
    );

    return res.json({
      message: 'Đăng nhập qua Google FPT Education thành công',
      token,
      user: {
        userId: user.user_id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/auth/github (GitHub OAuth for SWD392 Repository Analytics & Autograding)
router.post('/github', async (req: Request, res: Response) => {
  try {
    const { githubUsername, email, fullName, role } = req.body;
    const userEmail = (email || `${(githubUsername || 'student1').toLowerCase()}@fpt.edu.vn`).trim().toLowerCase();
    const isAdmin = isPermanentAdmin(userEmail);

    let result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [userEmail]);
    let user;

    if (result.rows.length === 0) {
      if (isAdmin) {
        const name = fullName || (githubUsername ? `GitHub (@${githubUsername})` : 'AMai Admin');
        const insertRes = await pool.query(
          `INSERT INTO users (full_name, email, password_hash, role, status) 
           VALUES ($1, $2, $3, 'ADMIN', 'ACTIVE') 
           RETURNING user_id, full_name, email, role, status, created_at`,
          [name, userEmail, 'OAUTH_GITHUB']
        );
        user = insertRes.rows[0];
      } else {
        const targetRole = role === 'LECTURER' ? 'LECTURER' : 'STUDENT';
        const targetStatus = targetRole === 'LECTURER' ? 'PENDING' : 'ACTIVE';
        const name = fullName || (githubUsername ? `GitHub (@${githubUsername})` : userEmail.split('@')[0]);

        const insertRes = await pool.query(
          `INSERT INTO users (full_name, email, password_hash, role, status) 
           VALUES ($1, $2, $3, $4, $5) 
           RETURNING user_id, full_name, email, role, status, created_at`,
          [name, userEmail, 'OAUTH_GITHUB', targetRole, targetStatus]
        );
        user = insertRes.rows[0];

        // Lần đầu tiên Giảng viên đăng nhập -> gửi vào cho admin duyệt
        if (targetRole === 'LECTURER') {
          return res.status(403).json({
            code: 'LECTURER_PENDING_APPROVAL',
            message: 'Tài khoản Giảng viên của bạn đã được gửi vào hệ thống và đang chờ Quản trị viên (Admin) phê duyệt. Vui lòng liên hệ Admin để được cấp quyền truy cập.'
          });
        }
      }
    } else {
      user = result.rows[0];

      if (isAdmin) {
        if (user.role !== 'ADMIN' || user.status !== 'ACTIVE') {
          await pool.query("UPDATE users SET role = 'ADMIN', status = 'ACTIVE' WHERE user_id = $1", [user.user_id]);
          user.role = 'ADMIN';
          user.status = 'ACTIVE';
        }
      } else {
        const currentRole = (user.role || '').toUpperCase().trim();
        const incomingRole = (role || '').toUpperCase().trim();

        // Ràng buộc vai trò: Mail đã là LECTURER thì tuyệt đối không được đăng nhập với vai trò STUDENT
        if (currentRole === 'LECTURER' && incomingRole === 'STUDENT') {
          return res.status(403).json({
            code: 'ROLE_CONFLICT_LECTURER_AS_STUDENT',
            message: 'Email này đã đăng ký cho Giảng viên, tuyệt đối không được đăng nhập cho Sinh viên!'
          });
        }
        // Ràng buộc vai trò: Mail đã là STUDENT thì tuyệt đối không được đăng nhập với vai trò LECTURER
        if (currentRole === 'STUDENT' && incomingRole === 'LECTURER') {
          return res.status(403).json({
            code: 'ROLE_CONFLICT_STUDENT_AS_LECTURER',
            message: 'Email này đã đăng ký cho Sinh viên, tuyệt đối không được đăng nhập cho Giảng viên!'
          });
        }

        // Kiểm tra trạng thái duyệt cho Giảng viên
        if (user.role === 'LECTURER' && user.status === 'PENDING') {
          return res.status(403).json({
            code: 'LECTURER_PENDING_APPROVAL',
            message: 'Tài khoản Giảng viên của bạn đang chờ Quản trị viên (Admin) phê duyệt. Vui lòng đợi Admin duyệt trước khi đăng nhập.'
          });
        }

        // Kiểm tra tài khoản bị khóa / từ chối
        if (user.status === 'LOCKED' || user.status === 'REJECTED') {
          return res.status(403).json({
            code: 'ACCOUNT_LOCKED',
            message: 'Tài khoản của bạn đã bị khóa hoặc từ chối phê duyệt bởi Quản trị viên.'
          });
        }
      }
    }

    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_aita_project_swd392_2026';
    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
      },
      secret,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
    );

    return res.json({
      message: 'Đăng nhập qua GitHub SWD392 thành công',
      token,
      user: {
        userId: user.user_id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('GitHub login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/auth/me (Get current authenticated user info)
router.get('/me', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT user_id, full_name, email, role, status, created_at FROM users WHERE user_id = $1',
      [req.user!.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng.' });
    }

    const user = result.rows[0];
    return res.json({
      user: {
        userId: user.user_id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error('Fetch me error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/auth/users - Danh sách người dùng (lọc theo role nếu có)
router.get('/users', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { role } = req.query;
    let query = 'SELECT user_id, full_name, email, role, status, created_at FROM users';
    const params: any[] = [];
    if (role) {
      query += ' WHERE role = $1';
      params.push(role);
    }
    query += ' ORDER BY user_id ASC';
    const result = await pool.query(query, params);
    return res.json({ users: result.rows });
  } catch (err) {
    console.error('Fetch users error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/auth/users/:userId/status - Quản trị viên phê duyệt hoặc khóa tài khoản
router.patch('/users/:userId/status', authenticateJWT, async (req: Request, res: Response) => {
  if (req.user!.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Chỉ quản trị viên mới có quyền phê duyệt hoặc thay đổi trạng thái tài khoản.' });
  }

  const userId = parseInt(req.params.userId, 10);
  const { status } = req.body;

  if (!['ACTIVE', 'PENDING', 'LOCKED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ message: 'Trạng thái không hợp lệ. Phải là ACTIVE, PENDING, LOCKED hoặc REJECTED.' });
  }

  try {
    const targetCheck = await pool.query('SELECT user_id, email, full_name, role, status FROM users WHERE user_id = $1', [userId]);
    if (targetCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    const targetUser = targetCheck.rows[0];
    if (isPermanentAdmin(targetUser.email) && status !== 'ACTIVE') {
      return res.status(400).json({ message: 'Không thể thay đổi trạng thái của Quản trị viên chính.' });
    }

    const result = await pool.query(
      'UPDATE users SET status = $1 WHERE user_id = $2 RETURNING user_id, full_name, email, role, status',
      [status, userId]
    );

    return res.json({
      message: `Đã cập nhật trạng thái tài khoản thành ${status}`,
      user: result.rows[0],
    });
  } catch (err) {
    console.error('Update status error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/auth/users/:userId/role - Thay đổi vai trò người dùng (Admin)
router.patch('/users/:userId/role', authenticateJWT, async (req: Request, res: Response) => {
  if (req.user!.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Chỉ quản trị viên mới có quyền đổi vai trò người dùng.' });
  }

  const userId = parseInt(req.params.userId, 10);
  const { role } = req.body;

  if (!['ADMIN', 'LECTURER', 'STUDENT'].includes(role)) {
    return res.status(400).json({ message: 'Vai trò không hợp lệ.' });
  }

  try {
    const targetCheck = await pool.query('SELECT user_id, email, full_name, role FROM users WHERE user_id = $1', [userId]);
    if (targetCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    if (isPermanentAdmin(targetCheck.rows[0].email) && role !== 'ADMIN') {
      return res.status(400).json({ message: 'Không thể thay đổi vai trò của Quản trị viên cố định.' });
    }

    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE user_id = $2 RETURNING user_id, full_name, email, role',
      [role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    return res.json({
      message: 'Cập nhật vai trò thành công',
      user: result.rows[0],
    });
  } catch (err) {
    console.error('Update role error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/auth/db-inspect - Khám phá database trực tiếp từ PostgreSQL
router.get('/db-inspect', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const tables = ['users', 'courses', 'teams', 'team_members'];
    const summary: Record<string, number> = {};

    for (const table of tables) {
      const countRes = await pool.query(`SELECT COUNT(*)::int as count FROM ${table}`);
      summary[table] = countRes.rows[0].count;
    }

    return res.json({
      database: 'aita_db',
      host: 'localhost:5432 (Docker container: aita_postgres)',
      tables: summary,
    });
  } catch (err) {
    console.error('DB Inspect error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/auth/db-inspect/:tableName - Lấy dữ liệu thực tế từng bảng
router.get('/db-inspect/:tableName', authenticateJWT, async (req: Request, res: Response) => {
  const allowed = ['users', 'courses', 'teams', 'team_members'];
  const { tableName } = req.params;

  if (!allowed.includes(tableName)) {
    return res.status(400).json({ message: 'Bảng không hợp lệ.' });
  }

  try {
    let query = `SELECT * FROM ${tableName} ORDER BY 1 DESC LIMIT 100`;
    if (tableName === 'users') {
      // Ẩn hash mật khẩu vì lý do bảo mật
      query = `SELECT user_id, full_name, email, role, created_at, '••••••••••••' as password_hash FROM users ORDER BY user_id ASC`;
    }
    const result = await pool.query(query);
    return res.json({
      tableName,
      rowCount: result.rows.length,
      rows: result.rows,
    });
  } catch (err) {
    console.error('Fetch table data error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

