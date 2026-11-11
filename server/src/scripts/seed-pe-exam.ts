import { pool } from '../config/db';

export async function seedPeExam() {
  console.log('🚀 [Seed PE Exam] Starting seeding PRO192 Java Practical Exam...');

  try {
    // 1. Ensure columns exist
    await pool.query(`
      ALTER TABLE grading_jobs ADD COLUMN IF NOT EXISTS total_score FLOAT;
      ALTER TABLE grading_jobs ADD COLUMN IF NOT EXISTS max_score FLOAT;
      ALTER TABLE grading_jobs ADD COLUMN IF NOT EXISTS sandbox_container_id VARCHAR(100);
      ALTER TABLE grading_jobs ADD COLUMN IF NOT EXISTS container_id VARCHAR(50);
      ALTER TABLE grading_jobs ADD COLUMN IF NOT EXISTS docker_image VARCHAR(100);
      ALTER TABLE grading_jobs ADD COLUMN IF NOT EXISTS code_hash VARCHAR(64);
      ALTER TABLE grading_results ADD COLUMN IF NOT EXISTS status VARCHAR(50);
      ALTER TABLE grading_results ADD COLUMN IF NOT EXISTS container_id VARCHAR(50);
      ALTER TABLE grading_results ADD COLUMN IF NOT EXISTS docker_image VARCHAR(100);
      ALTER TABLE grading_results ADD COLUMN IF NOT EXISTS exit_code INT DEFAULT 0;
      ALTER TABLE grading_results ADD COLUMN IF NOT EXISTS code_hash VARCHAR(64);
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS code_hash VARCHAR(64);
    `);

    // 1b. Ensure Course PRO192 (course_id: 3) exists with lecturer Yen (user_id: 5)
    await pool.query(`
      INSERT INTO courses (course_id, course_code, course_name, semester, lecturer_id)
      VALUES (3, 'PRO192', 'PRO192 - Object-Oriented Programming (Java OOP)', 'FA26', 5)
      ON CONFLICT (course_id) DO UPDATE SET
        course_code = EXCLUDED.course_code,
        course_name = EXCLUDED.course_name,
        semester = EXCLUDED.semester,
        lecturer_id = EXCLUDED.lecturer_id;
    `);
    await pool.query(`SELECT setval('courses_course_id_seq', (SELECT COALESCE(MAX(course_id), 1) FROM courses))`);

    // Enroll all active students in PRO192
    await pool.query(`
      INSERT INTO course_enrollments (course_id, user_id)
      SELECT 3, user_id FROM users WHERE role = 'STUDENT'
      AND user_id NOT IN (SELECT user_id FROM course_enrollments WHERE course_id = 3);
    `);

    // 2. Ensure Assignment 70 in Course 3 (PRO192)
    await pool.query(`
      INSERT INTO assignments (
        assignment_id, course_id, title, description, allowed_language,
        max_score, deadline, due_date, submission_type, status,
        max_submissions, allow_resubmission, allow_late_submission
      ) VALUES (
        70, 3,
        'PRO192 Practical Examination (Đề Số 1)',
        'Đề thi thực hành PE chuẩn FPT gồm 4 câu hỏi: Q1 (Xử lý chuỗi), Q2 (Kế thừa Car & SpecCar), Q3 (Quản lý MyList), Q4 (Thuật toán đảo chuỗi). Môi trường chấm: Docker OpenJDK 17 Sandbox cô lập.',
        'JAVA', 10.0,
        '2026-12-10 23:59:00+07', '2026-12-10 23:59:00+07',
        'INDIVIDUAL', 'PUBLISHED', 5, true, true
      )
      ON CONFLICT (assignment_id) DO UPDATE SET
        course_id = EXCLUDED.course_id,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        allowed_language = EXCLUDED.allowed_language,
        max_score = EXCLUDED.max_score,
        deadline = EXCLUDED.deadline,
        due_date = EXCLUDED.due_date,
        submission_type = EXCLUDED.submission_type,
        status = EXCLUDED.status;
    `);
    await pool.query(`SELECT setval('assignments_assignment_id_seq', (SELECT COALESCE(MAX(assignment_id), 1) FROM assignments))`);

    // 3. Rubric Rules (10 test cases)
    const testCases = [
      { id: 701, crit: 'Q1.1: Tính tổng số nguyên trong chuỗi (Test cơ bản)', desc: 'Nhập chuỗi ký tự chứa số nguyên, tính tổng các số hợp lệ.', inp: 'hello 123 world 456', exp: '579', ord: 1 },
      { id: 702, crit: 'Q1.2: Tính tổng số nguyên trong chuỗi (Test nâng cao)', desc: 'Kiểm tra chuỗi nhiều số âm và dương hỗn hợp.', inp: 'abc 10 def 20 ghi 30', exp: '60', ord: 2 },
      { id: 703, crit: 'Q2.1: Lớp Car & SpecCar - Khởi tạo & toString()', desc: 'Kiểm tra phương thức khởi tạo và toString theo đúng định dạng.', inp: 'Audi\n500\n2', exp: 'Audi, 500, 2', ord: 3 },
      { id: 704, crit: 'Q2.2: Lớp SpecCar - Phương thức setData()', desc: 'Kiểm tra ghi đè và cập nhật thuộc tính type của SpecCar.', inp: 'BMW\n800\n1', exp: 'BMW, 800, 1', ord: 4 },
      { id: 705, crit: 'Q2.3: Lớp SpecCar - Phương thức getValue()', desc: 'Kiểm tra tính toán giá trị xe sau điều chỉnh hệ số.', inp: 'Toyota\n300\n3', exp: 'Toyota, 300, 3', ord: 5 },
      { id: 706, crit: 'Q3.1: MyList - Hàm f1() đếm & tìm kiếm phần tử', desc: 'Kiểm tra tìm và đếm các đối tượng Car thỏa mãn điều kiện.', inp: '3\nA 10\nB 30\nC 20\n1', exp: 'A 10, C 20, B 30', ord: 6 },
      { id: 707, crit: 'Q3.2: MyList - Hàm f2() sắp xếp danh sách (Sort)', desc: 'Sắp xếp danh sách Car theo thứ tự giá giảm dần.', inp: '4\nX 50\nY 10\nZ 40\nW 20\n1', exp: 'Y 10, W 20, Z 40, X 50', ord: 7 },
      { id: 708, crit: 'Q3.3: MyList - Hàm f3() xóa phần tử đầu tiên', desc: 'Xóa node Car đầu tiên có giá nhỏ hơn ngưỡng cho trước.', inp: '2\nP 100\nQ 50\n2', exp: 'P 100', ord: 8 },
      { id: 709, crit: 'Q4.1: Xử lý chuỗi - Đảo ngược thứ tự từ (Reverse Words)', desc: 'Đảo ngược vị trí các từ trong câu cách nhau bởi khoảng trắng.', inp: 'university of fpt fpt', exp: 'fpt fpt of university', ord: 9 },
      { id: 710, crit: 'Q4.2: Xử lý chuỗi - Chuỗi nhiều từ phức tạp', desc: 'Kiểm tra câu dài chứa nhiều từ phức tạp.', inp: 'java oop practical exam', exp: 'exam practical oop java', ord: 10 },
    ];

    for (const tc of testCases) {
      await pool.query(`
        INSERT INTO rubric_rules (rubric_rule_id, assignment_id, rule_type, criterion, description, input_data, expected_output, weight, max_score, is_hidden, status, order_index)
        VALUES ($1, 70, 'AUTOMATED', $2, $3, $4, $5, 1.0, 1.0, false, 'Active', $6)
        ON CONFLICT (rubric_rule_id) DO UPDATE SET
          criterion = EXCLUDED.criterion,
          description = EXCLUDED.description,
          input_data = EXCLUDED.input_data,
          expected_output = EXCLUDED.expected_output,
          max_score = EXCLUDED.max_score,
          order_index = EXCLUDED.order_index;
      `, [tc.id, tc.crit, tc.desc, tc.inp, tc.exp, tc.ord]);
    }
    await pool.query(`SELECT setval('rubric_rules_rubric_rule_id_seq', (SELECT COALESCE(MAX(rubric_rule_id), 1) FROM rubric_rules))`);

    console.log('🎉 [Seed PE Exam] Successfully verified Assignment 70 with 4 Questions and 10 Test Cases (Clean slate ready for testing submissions)!');
  } catch (error: any) {
    console.error('❌ [Seed PE Exam] Error seeding PE exam:', error.message);
  }
}

if (require.main === module) {
  seedPeExam().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
