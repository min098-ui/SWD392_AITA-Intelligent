/**
 * Script phục hồi bài tập nhóm (Milestone 1 - TEAM) khi Thành viên 3 & 4 hoàn thành
 * Chạy bằng lệnh: npx ts-node src/scripts/restore-team-assignment.ts
 */
import { pool } from '../config/db';

async function restoreTeamAssignment() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Kiểm tra xem bài tập đã tồn tại chưa
    const check = await client.query('SELECT assignment_id FROM assignments WHERE assignment_id = 35');
    if (check.rows.length === 0) {
      await client.query(
        `INSERT INTO assignments 
         (assignment_id, course_id, title, description, deadline, max_score, start_date, due_date, submission_type, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          35,
          3,
          'Milestone 1: Thiết kế Kiến trúc Hệ thống & Đặc tả API (Group 4 (AITA))',
          'Đại diện nhóm nộp tài liệu thiết kế kiến trúc phần mềm, sơ đồ ERD 16 bảng, C4 Model và liên kết Git Repository chung của nhóm.',
          '2026-10-25 23:59:00+00',
          10,
          '2026-10-17 16:07:12.894+00',
          '2026-10-25 23:59:00+00',
          'TEAM',
          '2026-10-17 16:07:13.002+00'
        ]
      );
      console.log('✅ Đã phục hồi bài tập: Milestone 1: Thiết kế Kiến trúc Hệ thống & Đặc tả API (Group 4 (AITA)) [TEAM]');
    } else {
      console.log('ℹ️ Bài tập 35 đã tồn tại trong database.');
    }

    // 2. Phục hồi Rubrics Test Cases
    const rules = [
      {
        id: 95,
        criterion: 'Test 1: Kiểm tra cấu trúc API Reverse Words',
        input: 'hello world from aita\n',
        output: 'aita from world hello\n',
        weight: 1,
        maxScore: 5
      },
      {
        id: 96,
        criterion: 'Test 2: Kiểm tra xử lý chuỗi tham số kiến trúc',
        input: 'software architecture design\n',
        output: 'design architecture software\n',
        weight: 1,
        maxScore: 5
      }
    ];

    for (const r of rules) {
      const rCheck = await client.query('SELECT rubric_rule_id FROM rubric_rules WHERE rubric_rule_id = $1', [r.id]);
      if (rCheck.rows.length === 0) {
        await client.query(
          `INSERT INTO rubric_rules 
           (rubric_rule_id, assignment_id, rule_type, criterion, input_data, expected_output, weight, max_score, is_hidden)
           VALUES ($1, $2, 'AUTOMATED', $3, $4, $5, $6, $7, FALSE)`,
          [r.id, 35, r.criterion, r.input, r.output, r.weight, r.maxScore]
        );
        console.log(`✅ Đã phục hồi rubric rule: ${r.criterion}`);
      }
    }

    await client.query('COMMIT');
    console.log('\n🎉 Hoàn tất phục hồi bài tập nhóm cho Thành viên 3 & 4!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Lỗi khi phục hồi bài tập nhóm:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

restoreTeamAssignment();
