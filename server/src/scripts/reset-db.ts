import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const connectionString =
  process.env.DATABASE_URL || 'postgresql://aita_user:aita_password_123@localhost:5432/aita_db';

console.log('================================================================');
console.log('🔄 AITA-INTELLIGENT DATABASE SYNC & RESET TOOL (Cách 2)');
console.log('================================================================');
console.log(`📡 Connecting to PostgreSQL at: ${connectionString.replace(/:([^:@]+)@/, ':****@')}`);

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
});

async function runReset() {
  const client = await pool.connect();
  const startTime = Date.now();

  try {
    console.log('\n[1/4] 🛠️ Applying schema safeguards & column migrations on existing tables...');
    // Safeguard missing columns across all existing tables
    await client.query(`
      -- Users table safeguards
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

      -- Team Members table safeguards
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

      -- Tutor Chat Sessions & Messages safeguards
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

      -- Prompt Templates safeguards
      ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS template_name VARCHAR(100);
      ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS name VARCHAR(100);
      ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS system_prompt TEXT;
      ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS temperature FLOAT NOT NULL DEFAULT 0.2;
      ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

      -- AI API Keys safeguards
      ALTER TABLE ai_api_keys ADD COLUMN IF NOT EXISTS api_key_encrypted VARCHAR(255);
      ALTER TABLE ai_api_keys ADD COLUMN IF NOT EXISTS key_value_encrypted VARCHAR(255);
      UPDATE ai_api_keys SET key_value_encrypted = api_key_encrypted WHERE key_value_encrypted IS NULL AND api_key_encrypted IS NOT NULL;
    `);

    // Run schema.sql
    const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log(`[2/4] 📜 Executing schema definitions (${schemaPath})...`);
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      await client.query(schemaSql);
    } else {
      console.warn(`⚠️ Warning: schema.sql not found at ${schemaPath}, skipping.`);
    }

    // Run seed.sql
    const seedPath = path.resolve(__dirname, '../../../database/seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log(`[3/4] 🌱 Executing seed data (${seedPath})...`);
      const seedSql = fs.readFileSync(seedPath, 'utf-8');
      await client.query(seedSql);
    } else {
      throw new Error(`seed.sql not found at ${seedPath}`);
    }

    console.log('[4/4] 🔍 Verifying synchronized data in PostgreSQL...');
    const usersCountRes = await client.query('SELECT COUNT(*) FROM users');
    const teamsRes = await client.query(`
      SELECT tm.team_id, t.team_name, u.email, u.full_name, tm.assigned_module, tm.role
      FROM team_members tm
      JOIN teams t ON t.team_id = tm.team_id
      JOIN users u ON u.user_id = tm.user_id
      ORDER BY tm.role DESC, u.full_name ASC
    `);

    console.log(`\n✅ Total users registered: ${usersCountRes.rows[0].count}`);
    console.log(`✅ Members assigned to Teams (${teamsRes.rows.length} assignments):`);
    teamsRes.rows.forEach((row) => {
      console.log(`   - [${row.role.padEnd(6)}] ${row.full_name} (${row.email}) -> ${row.assigned_module}`);
    });

    const elapsed = Date.now() - startTime;
    console.log('\n================================================================');
    console.log(`🎉 DATABASE RESET & SEED COMPLETED SUCCESSFULLY in ${elapsed}ms!`);
    console.log('   Mọi thành viên trong nhóm giờ đây có thể kéo code về và chạy');
    console.log('   "npm run db:reset" để đồng bộ dữ liệu ngay lập tức mà không cần');
    console.log('   phải xóa hay cài lại Docker container!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n❌ ERROR during database reset:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

runReset();
