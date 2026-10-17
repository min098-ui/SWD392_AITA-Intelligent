const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://aita_user:aita_password_123@localhost:5432/aita_db' });

async function check() {
  await client.connect();
  const res = await client.query(`
    SELECT t.team_id, t.team_name, t.repo_url, c.course_code, c.course_name,
           COUNT(tm.team_member_id) as member_count
    FROM teams t
    JOIN courses c ON t.course_id = c.course_id
    LEFT JOIN team_members tm ON t.team_id = tm.team_id
    GROUP BY t.team_id, t.team_name, t.repo_url, c.course_code, c.course_name
  `);
  console.table(res.rows);

  const members = await client.query(`
    SELECT tm.team_id, u.full_name, u.email, tm.assigned_module, tm.role
    FROM team_members tm
    JOIN users u ON tm.user_id = u.user_id
    ORDER BY tm.team_id, tm.role DESC, u.full_name ASC
  `);
  console.table(members.rows);

  const subs = await client.query(`
    SELECT s.submission_id, s.assignment_id, a.title, s.team_id, s.final_score, s.status, u.full_name as submitter
    FROM submissions s
    JOIN assignments a ON s.assignment_id = a.assignment_id
    JOIN users u ON s.submitted_by_user_id = u.user_id
  `);
  console.table(subs.rows);

  await client.end();
}

check().catch(console.error);
