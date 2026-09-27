import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../../config/db';
import { authenticateJWT } from '../../common/auth.middleware';

const router = Router();

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

  // Validate role
  const allowedRoles = ['ADMIN', 'LECTURER', 'STUDENT'];
  const userRole = allowedRoles.includes(role) ? role : 'STUDENT';

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
      `INSERT INTO users (full_name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING user_id, full_name, email, role, created_at`,
      [userFullName, userEmail, passwordHash, userRole]
    );

    const newUser = result.rows[0];

    return res.status(201).json({
      message: 'Đăng ký tài khoản thành công',
      user: {
        userId: newUser.user_id,
        fullName: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
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
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email và mật khẩu không được để trống.' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
    }

    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_aita_project_swd392_2026';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    // JWT Payload with userId, role, and email
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

    // Check if user already exists
    let result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [userEmail]);
    let user;

    const ADMIN_EMAILS = ['lenguyenanhmai05@gmail.com', 'admin@fpt.edu.vn'];
    const isAdmin = ADMIN_EMAILS.includes(userEmail);

    if (result.rows.length === 0) {
      // Auto-provision Google SSO user
      const defaultRole = isAdmin ? 'ADMIN' : (role || (userEmail.includes('@fe.edu.vn') ? 'LECTURER' : 'STUDENT'));
      const name = fullName || userEmail.split('@')[0];
      const insertRes = await pool.query(
        `INSERT INTO users (full_name, email, password_hash, role) 
         VALUES ($1, $2, $3, $4) 
         RETURNING user_id, full_name, email, role, created_at`,
        [name, userEmail, 'OAUTH_GOOGLE', defaultRole]
      );
      user = insertRes.rows[0];
    } else {
      user = result.rows[0];
      if (isAdmin) {
        if (user.role !== 'ADMIN') {
          await pool.query("UPDATE users SET role = 'ADMIN' WHERE user_id = $1", [user.user_id]);
          user.role = 'ADMIN';
        }
      } else if (role && user.role !== 'ADMIN' && (role === 'STUDENT' || role === 'LECTURER') && user.role !== role) {
        await pool.query('UPDATE users SET role = $1 WHERE user_id = $2', [role, user.user_id]);
        user.role = role;
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

    let result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [userEmail]);
    let user;

    if (result.rows.length === 0) {
      const name = fullName || (githubUsername ? `GitHub (@${githubUsername})` : 'Sinh Viên 1');
      const insertRes = await pool.query(
        `INSERT INTO users (full_name, email, password_hash, role) 
         VALUES ($1, $2, $3, $4) 
         RETURNING user_id, full_name, email, role, created_at`,
        [name, userEmail, 'OAUTH_GITHUB', role || 'STUDENT']
      );
      user = insertRes.rows[0];
    } else {
      user = result.rows[0];
      if (role && user.role !== 'ADMIN' && (role === 'STUDENT' || role === 'LECTURER') && user.role !== role) {
        await pool.query('UPDATE users SET role = $1 WHERE user_id = $2', [role, user.user_id]);
        user.role = role;
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
      'SELECT user_id, full_name, email, role, created_at FROM users WHERE user_id = $1',
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
    let query = 'SELECT user_id, full_name, email, role, created_at FROM users';
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

