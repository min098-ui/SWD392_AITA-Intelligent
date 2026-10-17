import { pool } from '../config/db';

async function seedAssignments() {
  console.log('🌱 Seeding 1 Team Assignment and 5 Individual Assignments with Rubrics...');

  try {
    // Xóa bài cũ để làm sạch
    await pool.query('DELETE FROM grading_results');
    await pool.query('DELETE FROM grading_jobs');
    await pool.query('DELETE FROM submissions');
    await pool.query('DELETE FROM rubric_rules');
    await pool.query('DELETE FROM assignments');

    const courseId = 1; // SWD392

    // 1. Bài tập Nhóm (TEAM)
    const teamAssignRes = await pool.query(`
      INSERT INTO assignments (course_id, title, description, due_date, max_score, submission_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING assignment_id
    `, [
      courseId,
      'Đồ án Tổng hợp SWD392: AITA-Intelligent Platform (Nhóm đồ án)',
      'Bài nộp đồ án chính thức của Group 4. Kèm link GitHub Repository và Commit SHA. Hệ thống kiểm thử kiến trúc tổng thể, chạy Docker Sandbox và AI Review.',
      '2026-11-30 23:59:00',
      10,
      'TEAM'
    ]);
    const teamAssignId = teamAssignRes.rows[0].assignment_id;

    // Rubric cho bài nhóm
    await pool.query(`
      INSERT INTO rubric_rules (assignment_id, rule_type, criterion, input_data, expected_output, weight, max_score, is_hidden)
      VALUES 
      ($1, 'AUTOMATED', 'Test 1 (Public): Thuật toán Two Sum cơ bản', '2 7 11 15\\n9', '9', 1, 4.0, false),
      ($1, 'AUTOMATED', 'Test 2 (Public): Thuật toán Đảo ngược chuỗi từ (Reverse Words)', 'hello world aita', 'aita world hello', 1, 3.0, false),
      ($1, 'AUTOMATED', 'Test 3 (Hidden): Chuỗi có khoảng trắng thừa và ký tự đặc biệt (BR-06)', '  swd392   software   engineering  ', 'engineering software swd392', 1, 3.0, true)
    `, [teamAssignId]);

    // 2. Bài cá nhân cho 5 thành viên (INDIVIDUAL)
    const individualAssignments = [
      {
        title: 'Bài cá nhân 1: Xác thực Token & Mã hóa Hash (Lê Nguyễn Ánh Mai)',
        desc: 'Kiểm thử giải thuật nối chuỗi bảo mật và xác thực tính toàn vẹn JWT payload (Phân hệ Architecture & Auth).',
        rubrics: [
          { crit: 'Test 1 (Public): Chuẩn hóa và nối chuỗi mã hóa', input: 'swd392 mai', output: 'swd392_mai', score: 5.0, hidden: false },
          { crit: 'Test 2 (Hidden): Xác thực email người dùng hợp lệ (BR-06)', input: 'lenguyenlinhnhi2110@gmail.com', output: 'VALID_AUTH_USER', score: 5.0, hidden: true }
        ]
      },
      {
        title: 'Bài cá nhân 2: Sandbox Runner & Xử lý Chuỗi Số (Đinh Gia Huy)',
        desc: 'Kiểm thử giải thuật Two Sum và quản lý timeout trong Docker Sandbox Runner cô lập (Phân hệ Autograding & BullMQ).',
        rubrics: [
          { crit: 'Test 1 (Public): Tính tổng 2 số nguyên đầu vào', input: '10 20', output: '30', score: 5.0, hidden: false },
          { crit: 'Test 2 (Hidden): Xử lý số âm và biên 0 (BR-06)', input: '-5 15', output: '10', score: 5.0, hidden: true }
        ]
      },
      {
        title: 'Bài cá nhân 3: Tiền xử lý Prompt AI Socratic Tutor (Đỗ Trần Đăng Khoa)',
        desc: 'Kiểm thử hàm chuẩn hóa câu hỏi học viên và bóc tách từ khóa trước khi gọi Gemini AI (Phân hệ AI Tutor & Key Pool).',
        rubrics: [
          { crit: 'Test 1 (Public): Đếm số lượng từ khóa trong câu hỏi học viên', input: 'explain docker sandbox queue', output: '4', score: 5.0, hidden: false },
          { crit: 'Test 2 (Hidden): Chuẩn hóa khoảng trắng prompt học viên (BR-06)', input: '  gemini   socratic   tutor  ', output: 'gemini socratic tutor', score: 5.0, hidden: true }
        ]
      },
      {
        title: 'Bài cá nhân 4: Bộ lọc Noise Filter & Phân tích LOC Git (Nguyễn Tường Vy)',
        desc: 'Kiểm thử thuật toán lọc file rác (node_modules, package-lock.json) để tính chỉ số đóng góp thực chất (Phân hệ Git Analytics & Peer Audit).',
        rubrics: [
          { crit: 'Test 1 (Public): Nhận diện file mã nguồn hợp lệ (.ts, .js)', input: 'server/src/index.ts', output: 'VALID_SOURCE', score: 5.0, hidden: false },
          { crit: 'Test 2 (Hidden): Loại bỏ file lock không tính vào LOC (BR-06)', input: 'package-lock.json', output: 'IGNORED_NOISE', score: 5.0, hidden: true }
        ]
      },
      {
        title: 'Bài cá nhân 5: Format Giao diện & Rút gọn SHA Commit (Nguyễn Quốc Thanh Phong)',
        desc: 'Kiểm thử hàm rút gọn mã Git commit SHA 40 ký tự và format điểm số hiển thị trên giao diện (Phân hệ Next.js 14 UI/UX).',
        rubrics: [
          { crit: 'Test 1 (Public): Rút gọn Git SHA về 7 ký tự chuẩn GitHub', input: '7a9f4c28e9b11029c0d3817f456', output: '7a9f4c2', score: 5.0, hidden: false },
          { crit: 'Test 2 (Hidden): Định dạng hiển thị điểm số (BR-06)', input: '9.65', output: '9.7', score: 5.0, hidden: true }
        ]
      }
    ];

    for (const item of individualAssignments) {
      const aRes = await pool.query(`
        INSERT INTO assignments (course_id, title, description, due_date, max_score, submission_type)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING assignment_id
      `, [
        courseId,
        item.title,
        item.desc,
        '2026-11-25 23:59:00',
        10,
        'INDIVIDUAL'
      ]);
      const aId = aRes.rows[0].assignment_id;

      for (const r of item.rubrics) {
        await pool.query(`
          INSERT INTO rubric_rules (assignment_id, rule_type, criterion, input_data, expected_output, weight, max_score, is_hidden)
          VALUES ($1, 'AUTOMATED', $2, $3, $4, 1, $5, $6)
        `, [
          aId,
          r.crit,
          r.input,
          r.output,
          r.score,
          r.hidden
        ]);
      }
    }

    console.log('✅ Successfully seeded 1 Team Assignment and 5 Individual Assignments with complete Rubrics!');
  } catch (err) {
    console.error('❌ Error seeding assignments:', err);
  } finally {
    await pool.end();
  }
}

seedAssignments();
