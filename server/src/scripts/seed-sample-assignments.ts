import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const connectionString =
  process.env.DATABASE_URL || 'postgresql://aita_user:aita_password_123@localhost:5432/aita_db';

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
});

async function seedSampleAssignments() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding 2 official sample assignments for Member 2 autograding...');

    // 1. Get first active course
    const courseRes = await client.query('SELECT course_id, course_code, course_name FROM courses ORDER BY course_id ASC LIMIT 1');
    if (courseRes.rows.length === 0) {
      console.error('❌ No course found! Please create a course first.');
      return;
    }
    const course = courseRes.rows[0];
    console.log(`📚 Attaching assignments to course: [${course.course_code}] ${course.course_name} (ID: ${course.course_id})`);

    // 2. Insert Assignment 1: Two Sum (INDIVIDUAL)
    const assign1Res = await client.query(
      `INSERT INTO assignments 
       (course_id, title, description, start_date, due_date, deadline, max_score, submission_type)
       VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days', 10.0, 'INDIVIDUAL')
       RETURNING *`,
      [
        course.course_id,
        'Lab 1: Thuật toán Two Sum & Kiểm tra biên dữ liệu',
        'Viết chương trình JavaScript đọc 2 số nguyên từ input chuẩn và in ra màn hình tổng của 2 số. Yêu cầu xử lý chính xác số âm, số 0 và số nguyên lớn.',
      ]
    );
    const a1 = assign1Res.rows[0];
    console.log(`\n✅ Created Assignment 1 (ID: ${a1.assignment_id}): "${a1.title}"`);

    // Rubrics for Assignment 1
    await client.query(
      `INSERT INTO rubric_rules 
       (assignment_id, rule_type, criterion, input_data, expected_output, weight, max_score, is_hidden)
       VALUES 
       ($1, 'AUTOMATED', 'Test Case 1 (Public): Số nguyên dương cơ bản', '15 25', '40', 1.0, 3.0, FALSE),
       ($1, 'AUTOMATED', 'Test Case 2 (Public): Số âm và số dương bù trừ', '-50 70', '20', 1.0, 3.0, FALSE),
       ($1, 'AUTOMATED', 'Test Case 3 (Hidden - BR-06): Số nguyên lớn và biên dữ liệu', '5000000 5000000', '10000000', 1.0, 4.0, TRUE)`,
      [a1.assignment_id]
    );
    console.log('   - Added 3 Rubric Rules (2 Public, 1 Hidden BR-06)');

    // 3. Insert Assignment 2: Reverse Words (TEAM)
    const assign2Res = await client.query(
      `INSERT INTO assignments 
       (course_id, title, description, start_date, due_date, deadline, max_score, submission_type)
       VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '30 days', NOW() + INTERVAL '30 days', 10.0, 'TEAM')
       RETURNING *`,
      [
        course.course_id,
        'Milestone 1: Đảo ngược chuỗi từ & Chuẩn hóa khoảng trắng',
        'Viết module JavaScript đọc chuỗi ký tự từ input và đảo ngược thứ tự các từ trong chuỗi. Loại bỏ toàn bộ các khoảng trắng thừa ở đầu, cuối và giữa các từ.',
      ]
    );
    const a2 = assign2Res.rows[0];
    console.log(`\n✅ Created Assignment 2 (ID: ${a2.assignment_id}): "${a2.title}"`);

    // Rubrics for Assignment 2
    await client.query(
      `INSERT INTO rubric_rules 
       (assignment_id, rule_type, criterion, input_data, expected_output, weight, max_score, is_hidden)
       VALUES 
       ($1, 'AUTOMATED', 'Test Case 1 (Public): Chuỗi 2 từ tiêu chuẩn', 'hello world', 'world hello', 1.0, 3.0, FALSE),
       ($1, 'AUTOMATED', 'Test Case 2 (Public): Chuỗi nhiều khoảng trắng thừa', 'AITA   Intelligent   Platform', 'Platform Intelligent AITA', 1.0, 3.0, FALSE),
       ($1, 'AUTOMATED', 'Test Case 3 (Hidden - BR-06): Chuỗi phức hợp đồ án kiến trúc', 'Software Architecture Design 2026', '2026 Design Architecture Software', 1.0, 4.0, TRUE)`,
      [a2.assignment_id]
    );
    console.log('   - Added 3 Rubric Rules (2 Public, 1 Hidden BR-06)');

    console.log('\n🎉 Successfully seeded 2 sample assignments with full test cases!');
  } catch (error) {
    console.error('❌ Error seeding sample assignments:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

seedSampleAssignments();
