import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://aita_user:aita_password_123@localhost:5432/aita_db',
});

async function main() {
  console.log('--- Seeding Team 2 (Group5_CSD201_TravelPlanner) Members ---');
  
  // Verify team 2 exists
  const teamCheck = await pool.query('SELECT * FROM teams WHERE team_id = 2');
  console.log('Team 2:', teamCheck.rows);

  // Find users Mai and Vy
  const usersRes = await pool.query(`
    SELECT user_id, full_name, email FROM users 
    WHERE email IN ('lenguyenlinhnhi2110@gmail.com', 'vyntqe180099@fpt.edu.vn')
  `);
  console.log('Found users:', usersRes.rows);

  const mai = usersRes.rows.find(u => u.email === 'lenguyenlinhnhi2110@gmail.com');
  const vy = usersRes.rows.find(u => u.email === 'vyntqe180099@fpt.edu.vn');

  if (!mai || !vy) {
    throw new Error('Users not found in database!');
  }

  // Ensure course enrollments for course 2
  await pool.query(`
    INSERT INTO course_enrollments (course_id, user_id)
    VALUES (2, $1), (2, $2)
    ON CONFLICT ON CONSTRAINT uq_course_enrollment DO NOTHING
  `, [mai.user_id, vy.user_id]);

  // Insert into team_members
  await pool.query(`
    INSERT INTO team_members (team_id, user_id, assigned_module, role)
    VALUES 
      (2, $1, 'Graph Algorithms & Shortest Travel Path (Dijkstra)', 'LEADER'),
      (2, $2, 'BST Location Indexing & Budget Sorting (Min-Heap)', 'MEMBER')
    ON CONFLICT ON CONSTRAINT uq_team_user DO UPDATE SET
      assigned_module = EXCLUDED.assigned_module,
      role = EXCLUDED.role
  `, [mai.user_id, vy.user_id]);

  const membersRes = await pool.query(`
    SELECT tm.team_id, tm.user_id, u.full_name, u.email, tm.assigned_module, tm.role
    FROM team_members tm
    JOIN users u ON tm.user_id = u.user_id
    WHERE tm.team_id = 2
  `);
  console.log('Team 2 Members successfully updated:');
  console.table(membersRes.rows);

  await pool.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

