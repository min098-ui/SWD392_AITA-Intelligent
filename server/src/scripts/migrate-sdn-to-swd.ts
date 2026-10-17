import { pool } from '../config/db';

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('1. Reassigning Assignment 34 to Course 3 (SWD)...');
    await client.query(`
      UPDATE assignments 
      SET course_id = 3,
          title = 'Milestone 2: Tích hợp Docker Sandbox & Autograding (AITA Group 4)',
          description = 'Sinh viên nộp mã nguồn đồ án SWD392 AITA-Intelligent. Hệ thống sẽ kéo code từ Git repo và chạy kiểm thử trong Docker Sandbox cô lập (CPU 0.5 core, RAM 256MB) theo các tiêu chí Rubric tự động.'
      WHERE assignment_id = 34
    `);

    console.log('2. Reassigning Submission 22 to Team 4 (SWD)...');
    await client.query(`
      UPDATE submissions
      SET team_id = 4,
          artifact_url = 'https://github.com/min098-ui/SWD392_AITA-Intelligent.git'
      WHERE submission_id = 22
    `);

    console.log('3. Cleaning up SDN related records...');
    // Delete any other records belonging to team 3
    await client.query('DELETE FROM peer_audits WHERE team_id = 3');
    await client.query('DELETE FROM git_commits WHERE team_id = 3');
    await client.query('DELETE FROM team_members WHERE team_id = 3');
    await client.query('DELETE FROM teams WHERE team_id = 3');

    // Delete enrollments and course 4 (SDN)
    await client.query('DELETE FROM course_enrollments WHERE course_id = 4');
    await client.query('DELETE FROM assignments WHERE course_id = 4');
    await client.query('DELETE FROM courses WHERE course_id = 4');

    console.log('4. Verifying Team 4 (SWD) members...');
    const members = [
      { email: 'lenguyenlinhnhi2110@gmail.com', name: 'Lê Nguyễn Ánh Mai', role: 'LEADER', module: 'Software Architect & Core Auth' },
      { email: 'vyntqe180099@fpt.edu.vn', name: 'Nguyễn Tường Vy', role: 'MEMBER', module: 'Docker Sandbox & Autograding' },
      { email: 'dotrandangkhoa17@gmail.com', name: 'Đỗ Trần Đăng Khoa', role: 'MEMBER', module: 'AI Engine & Key Rotation' },
      { email: 'dinhgiahuylol12345@gmail.com', name: 'Đinh Gia Huy', role: 'MEMBER', module: 'Git Analytics & Peer Audit' },
      { email: 'tfongcs05@gmail.com', name: 'Nguyễn Quốc Thanh Phong', role: 'MEMBER', module: 'Frontend Lead & UI/UX' },
    ];

    for (const m of members) {
      const uRes = await client.query('SELECT user_id FROM users WHERE LOWER(email) = LOWER($1)', [m.email]);
      if (uRes.rows.length > 0) {
        const uid = uRes.rows[0].user_id;
        const exists = await client.query('SELECT team_member_id FROM team_members WHERE team_id = 4 AND user_id = $1', [uid]);
        if (exists.rows.length === 0) {
          await client.query(
            'INSERT INTO team_members (team_id, user_id, assigned_module, role) VALUES (4, $1, $2, $3)',
            [uid, m.module, m.role]
          );
        } else {
          await client.query(
            'UPDATE team_members SET assigned_module = $1, role = $2 WHERE team_id = 4 AND user_id = $3',
            [m.module, m.role, uid]
          );
        }
      }
    }

    // Update Course 3 name if needed
    await client.query(`
      UPDATE courses 
      SET course_name = 'SWD392 - Software Architecture & Design Project',
          course_code = 'SWD392'
      WHERE course_id = 3
    `);

    // Update Team 4 name
    await client.query(`
      UPDATE teams
      SET team_name = 'Group 4 (AITA)',
          repo_url = 'https://github.com/min098-ui/SWD392_AITA-Intelligent.git'
      WHERE team_id = 4
    `);

    await client.query('COMMIT');
    console.log('Migration committed successfully!');

    // Check final counts
    const teams = await client.query('SELECT team_id, course_id, team_name, repo_url FROM teams');
    console.log('Remaining Teams:', teams.rows);

    const subs = await client.query('SELECT submission_id, assignment_id, team_id, final_score FROM submissions');
    console.log('Submissions:', subs.rows);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
