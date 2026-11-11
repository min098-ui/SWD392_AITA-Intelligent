import dotenv from 'dotenv';
import { pool } from '../config/db';

dotenv.config();

interface CourseTeamProjectSpec {
  courseCode: string;
  title: string;
  description: string;
}

const TEAM_PROJECT_SPECS: CourseTeamProjectSpec[] = [
  {
    courseCode: 'SWD392',
    title: 'SWD392 Đồ Án Nhóm - GitHub Repository & Git Telemetry (BR-07)',
    description:
      'Cổng nộp đồ án nhóm môn SWD392 (Architecture & Design). Sinh viên chỉ cần nộp Tên đề tài, Đường dẫn GitHub Repository và Branch chính để hệ thống bóc tách commit, phân tích đóng góp BR-07 và chờ Giảng viên xem xét, chấm điểm thủ công (không chấm Docker Sandbox).',
  },
  {
    courseCode: 'CSD201',
    title: 'CSD201 Đồ Án Nhóm - GitHub Repository & Git Telemetry (BR-07)',
    description:
      'Cổng nộp đồ án nhóm môn CSD201 (Data Structures & Algorithms). Sinh viên chỉ cần nộp Tên đề tài, Đường dẫn GitHub Repository và Branch chính để hệ thống đồng bộ commit BR-07 và chờ Giảng viên thẩm định, chấm điểm thủ công (không chấm Docker Sandbox).',
  },
  {
    courseCode: 'PRO192',
    title: 'PRO192 Đồ Án Nhóm - GitHub Repository & Git Telemetry (BR-07)',
    description:
      'Cổng nộp đồ án nhóm môn PRO192 (Object-Oriented Programming). Sinh viên chỉ cần nộp Tên đề tài, Đường dẫn GitHub Repository và Branch chính để hệ thống đồng bộ commit BR-07 và chờ Giảng viên xem xét, chấm điểm thủ công (không chấm Docker Sandbox).',
  },
];

async function seedTeamProjectAssignments() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const spec of TEAM_PROJECT_SPECS) {
      const courseRes = await client.query(
        `SELECT course_id FROM courses WHERE course_code = $1 ORDER BY course_id ASC LIMIT 1`,
        [spec.courseCode]
      );
      if (courseRes.rows.length === 0) {
        console.warn(`⚠️ Course ${spec.courseCode} not found, skipping.`);
        continue;
      }
      const courseId = courseRes.rows[0].course_id;

      const existingRes = await client.query(
        `SELECT assignment_id FROM assignments
         WHERE course_id = $1 AND submission_type = 'TEAM'
         ORDER BY assignment_id ASC LIMIT 1`,
        [courseId]
      );

      let assignmentId: number;
      if (existingRes.rows.length > 0) {
        assignmentId = existingRes.rows[0].assignment_id;
        await client.query(
          `UPDATE assignments
           SET title = $1,
               description = $2,
               allowed_language = 'ALL',
               target_type = 'ALL',
               status = 'PUBLISHED',
               max_score = 10.0,
               allow_late_submission = true,
               allow_resubmission = true,
               max_submissions = 20,
               due_date = NOW() + INTERVAL '60 days',
               deadline = NOW() + INTERVAL '60 days'
           WHERE assignment_id = $3`,
          [spec.title, spec.description, assignmentId]
        );
        console.log(`🔄 Updated existing TEAM project #${assignmentId} (${spec.courseCode}): ${spec.title}`);
      } else {
        const insertRes = await client.query(
          `INSERT INTO assignments (
             course_id, title, description, deadline, due_date, start_date,
             max_score, submission_type, target_type, allowed_language,
             status, allow_late_submission, allow_resubmission, max_submissions
           ) VALUES (
             $1, $2, $3, NOW() + INTERVAL '60 days', NOW() + INTERVAL '60 days', NOW() - INTERVAL '1 day',
             10.0, 'TEAM', 'ALL', 'ALL',
             'PUBLISHED', true, true, 20
           )
           RETURNING assignment_id`,
          [courseId, spec.title, spec.description]
        );
        assignmentId = insertRes.rows[0].assignment_id;
        console.log(`✅ Created TEAM project #${assignmentId} (${spec.courseCode}): ${spec.title}`);
      }

      const ruleRes = await client.query(
        `SELECT rubric_rule_id FROM rubric_rules WHERE assignment_id = $1 LIMIT 1`,
        [assignmentId]
      );
      if (ruleRes.rows.length === 0) {
        await client.query(
          `INSERT INTO rubric_rules (
             assignment_id, rule_type, criterion, input_data, expected_output,
             weight, max_score, is_hidden, status, order_index, description
           ) VALUES (
             $1, 'MANUAL',
             'Đánh giá Đồ án Nhóm qua GitHub Repository & Đóng góp thành viên (BR-07)',
             '', '',
             10.0, 10.0, false, 'Active', 1,
             'Giảng viên kiểm tra GitHub Repository, mức độ đóng góp commit/LOC của từng thành viên và chấm điểm trực tiếp.'
           )`,
          [assignmentId]
        );
      }
    }

    await client.query('COMMIT');
    console.log('🎉 Seeded TEAM Git Repository assignments successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to seed TEAM assignments:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seedTeamProjectAssignments();
