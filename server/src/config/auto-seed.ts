import { pool } from './db';
import path from 'path';
import fs from 'fs';

function findSqlFile(filename: string): string | null {
  const candidates = [
    path.resolve(__dirname, '../../../database', filename),
    path.resolve(__dirname, '../../database', filename),
    path.resolve(process.cwd(), 'database', filename),
    path.resolve(process.cwd(), '../database', filename),
    path.resolve('c:/SWD392/SWD392_AITA-Intelligent/database', filename),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

export async function ensureDatabaseSeeded(): Promise<void> {
  let client;
  try {
    client = await pool.connect();
  } catch (err: any) {
    console.log('ℹ️  [Auto-Seed] PostgreSQL connection is offline or using mock store. Auto-seed deferred.');
    return;
  }

  try {
    // 1. Check if users table exists and count records
    const tableCheck = await client.query(`
      SELECT to_regclass('public.users') as tbl_exists
    `);

    let needSeed = false;
    if (!tableCheck.rows[0]?.tbl_exists) {
      needSeed = true;
    } else {
      const userCountRes = await client.query('SELECT COUNT(*)::int as count FROM users');
      const courseCountRes = await client.query('SELECT COUNT(*)::int as count FROM courses');
      const teamCountRes = await client.query('SELECT COUNT(*)::int as count FROM teams');
      if (
        (userCountRes.rows[0]?.count || 0) < 12 ||
        (courseCountRes.rows[0]?.count || 0) < 2 ||
        (teamCountRes.rows[0]?.count || 0) < 2
      ) {
        needSeed = true;
      }
    }

    // Always run column safeguards to ensure any new columns (e.g. code_content, language) are created
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'LECTURER', 'STUDENT')),
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING', 'LOCKED', 'REJECTED')),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

      CREATE TABLE IF NOT EXISTS team_members (
        team_member_id SERIAL PRIMARY KEY,
        team_id INT NOT NULL,
        user_id INT NOT NULL,
        assigned_module VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
        joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE team_members ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'MEMBER';
      ALTER TABLE team_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

      CREATE TABLE IF NOT EXISTS tutor_chat_sessions (
        session_id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        submission_id INT,
        assignment_id INT,
        prompt_template_id INT,
        session_title VARCHAR(150) NOT NULL DEFAULT 'New Conversation',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tutor_chat_messages (
        message_id SERIAL PRIMARY KEY,
        session_id INT,
        user_id INT NOT NULL,
        submission_id INT NOT NULL,
        prompt_template_id INT,
        ai_api_key_id INT,
        sender_type VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE tutor_chat_messages ADD COLUMN IF NOT EXISTS session_id INT;
      ALTER TABLE tutor_chat_messages ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

      ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS template_name VARCHAR(100);
      ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS name VARCHAR(100);
      ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS system_prompt TEXT;
      ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS temperature FLOAT NOT NULL DEFAULT 0.2;
      ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

      ALTER TABLE ai_api_keys ADD COLUMN IF NOT EXISTS api_key_encrypted VARCHAR(255);
      ALTER TABLE ai_api_keys ADD COLUMN IF NOT EXISTS key_value_encrypted VARCHAR(255);
      ALTER TABLE ai_api_keys ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

      ALTER TABLE assignments ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE assignments ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;
      ALTER TABLE assignments ADD COLUMN IF NOT EXISTS close_date TIMESTAMPTZ;
      ALTER TABLE assignments ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;
      ALTER TABLE assignments ADD COLUMN IF NOT EXISTS max_score FLOAT NOT NULL DEFAULT 10.0;
      ALTER TABLE assignments ADD COLUMN IF NOT EXISTS submission_type VARCHAR(20) NOT NULL DEFAULT 'TEAM';
      ALTER TABLE assignments ADD COLUMN IF NOT EXISTS target_type VARCHAR(20) NOT NULL DEFAULT 'ALL';
      ALTER TABLE assignments ADD COLUMN IF NOT EXISTS allowed_language VARCHAR(20) NOT NULL DEFAULT 'ALL';
      ALTER TABLE assignments ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED';
      ALTER TABLE assignments ADD COLUMN IF NOT EXISTS allow_late_submission BOOLEAN NOT NULL DEFAULT TRUE;
      ALTER TABLE assignments ADD COLUMN IF NOT EXISTS max_submissions INT DEFAULT 5;
      ALTER TABLE assignments ADD COLUMN IF NOT EXISTS allow_resubmission BOOLEAN NOT NULL DEFAULT TRUE;

      CREATE TABLE IF NOT EXISTS assignment_target_teams (
        assignment_id INT NOT NULL,
        team_id INT NOT NULL,
        assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (assignment_id, team_id)
      );

      ALTER TABLE rubric_rules ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active';
      ALTER TABLE rubric_rules ADD COLUMN IF NOT EXISTS order_index INT DEFAULT 0;
      ALTER TABLE rubric_rules ADD COLUMN IF NOT EXISTS description TEXT;

      ALTER TABLE submissions ALTER COLUMN status TYPE VARCHAR(50);
      ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_status_check;
      ALTER TABLE submissions ADD CONSTRAINT submissions_status_check CHECK (status IN ('SUBMITTED', 'QUEUED', 'GRADING', 'GRADED', 'FAILED', 'AI_PREGRADED', 'FIRST_REVIEWED', 'PENDING_SECOND_REVIEW', 'FINALIZED'));
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS code_content TEXT;
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS language VARCHAR(20) DEFAULT 'javascript';
      ALTER TABLE submissions ALTER COLUMN artifact_url DROP NOT NULL;
      ALTER TABLE submissions ALTER COLUMN git_commit_hash DROP NOT NULL;
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS submitted_by_user_id INT;
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS ai_score FLOAT;
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS ai_feedback TEXT;
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS reviewer_1_id INT;
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS reviewer_1_score FLOAT;
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS reviewer_1_notes TEXT;
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS needs_second_review BOOLEAN DEFAULT FALSE;
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS reviewer_2_id INT;
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS reviewer_2_score FLOAT;
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS reviewer_2_notes TEXT;
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS consensus_notes TEXT;
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS final_score FLOAT;

      ALTER TABLE git_commits ADD COLUMN IF NOT EXISTS commit_message TEXT;
      ALTER TABLE git_commits ADD COLUMN IF NOT EXISTS assignment_id INT;
      ALTER TABLE peer_audits ADD COLUMN IF NOT EXISTS assignment_id INT;
      ALTER TABLE peer_audits ADD COLUMN IF NOT EXISTS evaluated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE grading_results ADD COLUMN IF NOT EXISTS status VARCHAR(50);

      -- Ensure team 2 has Ánh Mai & Tường Vy in team_members
      INSERT INTO team_members (team_id, user_id, assigned_module, role)
      SELECT 2, u.user_id, m.module, m.role
      FROM (
        VALUES
          ('lenguyenlinhnhi2110@gmail.com', 'Graph Algorithms & Shortest Travel Path (Dijkstra)', 'LEADER'),
          ('vyntqe180099@fpt.edu.vn', 'BST Location Indexing & Budget Sorting (Min-Heap)', 'MEMBER')
      ) AS m(email, module, role)
      JOIN users u ON u.email = m.email
      ON CONFLICT ON CONSTRAINT uq_team_user DO UPDATE SET
        assigned_module = EXCLUDED.assigned_module,
        role = EXCLUDED.role;

      -- Ensure Nguyen Lan (n011vynt@gmail.com) exists as LECTURER and manages CSD201
      INSERT INTO users (full_name, email, password_hash, role, status)
      VALUES ('Nguyen Lan', 'n011vynt@gmail.com', '$2a$10$fUyXvogZImWkD34ItWppmenaSNAgzilb7Ml7ZQ5DCx0OvRo3.RfX2', 'LECTURER', 'ACTIVE')
      ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = 'LECTURER',
        status = 'ACTIVE';

      UPDATE courses
      SET lecturer_id = (SELECT user_id FROM users WHERE email = 'n011vynt@gmail.com' LIMIT 1)
      WHERE course_code = 'CSD201' OR course_id = 2;

      -- Ensure individual assignments for CSD201 & SWD392
      INSERT INTO assignments (assignment_id, course_id, title, description, allowed_language, max_score, deadline, due_date, submission_type, status, max_submissions, allow_resubmission, allow_late_submission)
      VALUES
      (51, 2, 'Assignment 1: Linked List & Binary Search Tree – Quản lý Điểm Du lịch (Cá nhân)', 'Xây dựng cấu trúc danh sách liên kết kép và cây nhị phân tìm kiếm BST để quản lý và tra cứu các điểm du lịch theo mã số.', 'ALL', 10, '2026-11-22 23:59:00+07', '2026-11-22 23:59:00+07', 'INDIVIDUAL', 'PUBLISHED', 5, true, true),
      (52, 2, 'Assignment 2: Graph & Dijkstra Algorithm – Tối ưu Lộ trình Du lịch (Cá nhân)', 'Cài đặt thuật toán Dijkstra tìm đường đi ngắn nhất giữa các địa điểm du lịch trên đồ thị có trọng số.', 'ALL', 10, '2026-11-27 23:59:00+07', '2026-11-27 23:59:00+07', 'INDIVIDUAL', 'PUBLISHED', 5, true, true),
      (65, 1, 'Assignment 1: Cài đặt JWT Authentication & RBAC Middleware Bảo mật (Cá nhân)', 'Cài đặt JWT verify token, phân quyền RBAC Middleware (STUDENT, LECTURER, ADMIN) và xử lý refresh token an toàn theo chuẩn OWASP.', 'ALL', 10, '2026-11-25 23:59:00+07', '2026-11-25 23:59:00+07', 'INDIVIDUAL', 'PUBLISHED', 5, true, true),
      (66, 1, 'Assignment 2: Thiết kế RESTful API Service & Caching Redis cho Student Portal (Cá nhân)', 'Xây dựng service API chuẩn RESTful kết hợp caching Redis đệm kết quả truy vấn thông tin sinh viên và phòng chống race condition.', 'ALL', 10, '2026-11-30 23:59:00+07', '2026-11-30 23:59:00+07', 'INDIVIDUAL', 'PUBLISHED', 5, true, true),
      (67, 1, 'Practical Exam: Cài đặt Dockerized Sandbox Runner & Worker Queue Cá Nhân', 'Bài thi thực hành: Viết module Docker Sandbox runner cô lập mã nguồn sinh viên, cấu hình timeout 10s và giới hạn bộ nhớ 256MB.', 'ALL', 10, '2026-12-05 23:59:00+07', '2026-12-05 23:59:00+07', 'INDIVIDUAL', 'PUBLISHED', 3, true, false)
      ON CONFLICT (assignment_id) DO UPDATE SET
        course_id = EXCLUDED.course_id,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        allowed_language = EXCLUDED.allowed_language,
        max_score = EXCLUDED.max_score,
        deadline = EXCLUDED.deadline,
        due_date = EXCLUDED.due_date,
        submission_type = EXCLUDED.submission_type,
        status = EXCLUDED.status,
        max_submissions = EXCLUDED.max_submissions,
        allow_resubmission = EXCLUDED.allow_resubmission,
        allow_late_submission = EXCLUDED.allow_late_submission;

      SELECT setval('assignments_assignment_id_seq', (SELECT COALESCE(MAX(assignment_id), 1) FROM assignments));
    `);

    if (!needSeed) {
      console.log('✅ [Auto-Seed] PostgreSQL ready: Schema safeguards verified & full seed data present.');
      return;
    }

    console.log('🌱 [Auto-Seed] Database requires initial data. Synchronizing automatically...');

    // 3. Run schema.sql if needed
    const schemaFile = findSqlFile('schema.sql');
    if (schemaFile) {
      const schemaSql = fs.readFileSync(schemaFile, 'utf8');
      await client.query(schemaSql);
    }

    // 4. Run seed.sql
    const seedFile = findSqlFile('seed.sql');
    if (seedFile) {
      const seedSql = fs.readFileSync(seedFile, 'utf8');
      await client.query(seedSql);
      console.log('🎉 [Auto-Seed] Successfully synchronized 12 users, 2 courses, 2 teams, and 7 team members!');
    }
  } catch (err: any) {
    console.warn('⚠️  [Auto-Seed] Notice during database auto-seed:', err.message);
  } finally {
    if (client) client.release();
  }
}

