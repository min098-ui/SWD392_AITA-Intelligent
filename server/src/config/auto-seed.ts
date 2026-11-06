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

    if (!needSeed) {
      console.log('✅ [Auto-Seed] PostgreSQL ready: Full seed data verified (12 users, 2 courses, 2 teams).');
      return;
    }

    console.log('🌱 [Auto-Seed] Database requires initial data. Synchronizing automatically...');

    // 2. Run column safeguards
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
      ALTER TABLE assignments ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;
      ALTER TABLE assignments ADD COLUMN IF NOT EXISTS max_score FLOAT NOT NULL DEFAULT 10.0;
      ALTER TABLE assignments ADD COLUMN IF NOT EXISTS submission_type VARCHAR(20) NOT NULL DEFAULT 'TEAM';

      ALTER TABLE submissions ALTER COLUMN status TYPE VARCHAR(50);
      ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_status_check;
      ALTER TABLE submissions ADD CONSTRAINT submissions_status_check CHECK (status IN ('SUBMITTED', 'QUEUED', 'GRADING', 'GRADED', 'FAILED', 'AI_PREGRADED', 'FIRST_REVIEWED', 'PENDING_SECOND_REVIEW', 'FINALIZED'));
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
    `);

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

