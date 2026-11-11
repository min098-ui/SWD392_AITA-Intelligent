import dotenv from 'dotenv';
import { pool } from '../config/db';

dotenv.config();

interface ExamQuestionSeed {
  qNum: number;
  points: number;
  title: string;
  desc: string;
  input: string;
  output: string;
}

interface ExamSeedSpec {
  title: string;
  summary: string;
  questions: ExamQuestionSeed[];
}

function buildExamDescription(spec: ExamSeedSpec): string {
  const customBlocks = spec.questions
    .map(
      (q) => `===CUSTOM_Q${q.qNum}===
${q.title}
${q.desc}
INPUT:
${q.input}
OUTPUT:
${q.output}
===END_Q${q.qNum}===`
    )
    .join('\n');

  const bulletSummary = spec.questions
    .map((q) => `• Q${q.qNum} (${q.points.toFixed(1)}đ): ${q.title}`)
    .join('\n');

  return `${customBlocks}

${spec.summary}
${bulletSummary}

Môi trường chấm: Docker Python 3.11 Sandbox cô lập (aita-sandbox-python:latest), bảo mật RAM 256MB, Timeout 10,000ms/test, xác thực toàn vẹn bằng mã băm SHA-256.`;
}

const CSD201_EXAMS: ExamSeedSpec[] = [
  {
    title: 'CSD201 Practical Examination - Python DSA (Đề Số 1)',
    summary: 'Đề thi thực hành CSD201 (Python 3.11 - Cấu trúc dữ liệu tuyến tính & Tìm kiếm) gồm 4 câu hỏi:',
    questions: [
      {
        qNum: 1,
        points: 2.0,
        title: 'Stack: Kiểm tra biểu thức ngoặc cân bằng (Balanced Brackets)',
        desc: 'Đọc 1 dòng biểu thức chứa chữ, số, toán tử và các cặp ngoặc (), [], {}. Sử dụng Stack (list Python) kiểm tra các cặp ngoặc có đóng mở đúng thứ tự hay không. In "VALID" nếu cân bằng hợp lệ, ngược lại in "INVALID".',
        input: '{[a+b]*(c-d)} + ([x/y])',
        output: 'VALID',
      },
      {
        qNum: 2,
        points: 3.0,
        title: 'Singly Linked List: Thao tác chèn & xóa node theo điều kiện',
        desc: 'Cài đặt lớp Node và SinglyLinkedList lưu số nguyên. Dòng 1 nhập các số nguyên ban đầu (cách nhau bởi dấu cách) đưa vào cuối danh sách (append). Dòng 2 nhập số nguyên k: nếu k chẵn thì chèn k vào đầu danh sách (insert_head), ngược lại xóa tất cả node có giá trị > k. In danh sách kết quả nối bởi " -> " (hoặc "EMPTY" nếu rỗng).',
        input: '10 25 5 30 15\n12',
        output: '12 -> 10 -> 25 -> 5 -> 30 -> 15',
      },
      {
        qNum: 3,
        points: 3.0,
        title: 'Queue (collections.deque): Mô phỏng hàng đợi xử lý tác vụ',
        desc: 'Dùng collections.deque mô phỏng hàng đợi tác vụ. Dòng 1 là số nguyên n lệnh. Mỗi dòng tiếp theo là ENQUEUE <name> (thêm cuối queue), DEQUEUE (lấy bỏ đầu queue nếu không rỗng), hoặc FRONT (in tên đầu queue, hoặc NONE nếu rỗng). Cuối cùng in tổng tác vụ còn lại theo dạng "REMAIN: <count>".',
        input: '6\nENQUEUE TaskA\nENQUEUE TaskB\nFRONT\nDEQUEUE\nFRONT\nDEQUEUE',
        output: 'TaskA\nTaskB\nREMAIN: 0',
      },
      {
        qNum: 4,
        points: 2.0,
        title: 'Merge Sort & Binary Search: Sắp xếp tăng dần và tìm kiếm nhị phân',
        desc: 'Dòng 1 nhập dãy số nguyên chưa sắp xếp (cách nhau bởi dấu cách). Dòng 2 nhập số nguyên target. Sắp xếp mảng tăng dần (O(N log N)) và in mảng sau khi sắp xếp trên dòng 1; sau đó dùng Binary Search tìm chỉ số 0-based đầu tiên của target (hoặc -1 nếu không tồn tại) và in trên dòng 2.',
        input: '42 7 19 3 25 14\n19',
        output: '3 7 14 19 25 42\n3',
      },
    ],
  },
  {
    title: 'CSD201 Practical Examination - Python DSA (Đề Số 2)',
    summary: 'Đề thi thực hành CSD201 (Python 3.11 - Hash Table, Cây BST & Đồ thị) gồm 4 câu hỏi:',
    questions: [
      {
        qNum: 1,
        points: 2.0,
        title: 'Hash Table (dict): Tìm cặp chỉ số có tổng bằng Target (Two Sum)',
        desc: 'Dòng 1 nhập danh sách số nguyên (cách nhau bởi dấu cách). Dòng 2 nhập số nguyên target. Dùng Hash Table (dict) độ phức tạp O(n) tìm cặp chỉ số (i, j) với i < j có nums[i] + nums[j] == target (ưu tiên cặp có j nhỏ nhất). In "i j" (0-based), nếu không có in "NO PAIR".',
        input: '11 2 15 7 9\n9',
        output: '1 3',
      },
      {
        qNum: 2,
        points: 3.0,
        title: 'Binary Search Tree (BST): Chèn, Xóa node & Duyệt cây In-order/Pre-order',
        desc: 'Cài đặt cây nhị phân tìm kiếm BST (TreeNode). Dòng 1 nhập các số nguyên chèn lần lượt vào BST (bỏ qua nếu trùng). Dòng 2 nhập giá trị nguyên x cần xóa (khi xóa node 2 con dùng inorder successor). Sau khi xóa x, in 2 dòng: dòng 1 là kết quả duyệt In-order, dòng 2 là kết quả duyệt Pre-order (cách nhau bởi 1 dấu cách).',
        input: '50 30 70 20 40 60 80\n30',
        output: '20 40 50 60 70 80\n50 40 20 70 60 80',
      },
      {
        qNum: 3,
        points: 3.0,
        title: 'Graph Traversal: Duyệt BFS theo thứ tự tăng dần & Đếm thành phần liên thông',
        desc: 'Cho đồ thị vô hướng V đỉnh (0..V-1) và E cạnh. Dòng 1 chứa V E S (S là đỉnh bắt đầu BFS). E dòng tiếp theo mỗi dòng là cạnh u v. Khi duyệt BFS từ S, các đỉnh kề luôn xét theo thứ tự tăng dần. In 2 dòng: dòng 1 là thứ tự thăm BFS từ S; dòng 2 in tổng số thành phần liên thông theo dạng "COMPONENTS: <count>".',
        input: '6 4 0\n0 2\n0 1\n1 3\n4 5',
        output: '0 1 2 3\nCOMPONENTS: 2',
      },
      {
        qNum: 4,
        points: 2.0,
        title: 'Shortest Path: Thuật toán Dijkstra với Min-Heap (heapq)',
        desc: 'Cho đồ thị có hướng trọng số không âm V đỉnh (0..V-1) và E cạnh. Dòng 1 chứa V E src dst. E dòng tiếp theo là u v w (trọng số w >= 0). Dùng thuật toán Dijkstra với heapq tìm đường đi ngắn nhất từ src đến dst. In theo dạng "COST: <min_cost> | PATH: <u->v->...>" (hoặc "NO PATH" nếu không tới được).',
        input: '5 6 0 4\n0 1 4\n0 2 1\n2 1 2\n1 3 1\n2 3 5\n3 4 3',
        output: 'COST: 7 | PATH: 0->2->1->3->4',
      },
    ],
  },
];

async function seedCsd201PythonExams() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const courseRes = await client.query(
      `SELECT course_id, course_code, course_name FROM courses WHERE course_code = 'CSD201' LIMIT 1`
    );
    if (courseRes.rows.length === 0) {
      throw new Error('Course CSD201 not found in database.');
    }
    const courseId = courseRes.rows[0].course_id;

    for (let idx = 0; idx < CSD201_EXAMS.length; idx++) {
      const spec = CSD201_EXAMS[idx];
      const fullDesc = buildExamDescription(spec);

      const existingRes = await client.query(
        `SELECT assignment_id FROM assignments WHERE course_id = $1 AND title = $2 LIMIT 1`,
        [courseId, spec.title]
      );

      let assignmentId: number;
      if (existingRes.rows.length > 0) {
        assignmentId = existingRes.rows[0].assignment_id;
        await client.query(
          `UPDATE assignments
           SET description = $1,
               max_score = 10.0,
               submission_type = 'INDIVIDUAL',
               target_type = 'ALL',
               allowed_language = 'python',
               status = 'PUBLISHED',
               allow_late_submission = TRUE,
               max_submissions = 0,
               allow_resubmission = TRUE
           WHERE assignment_id = $2`,
          [fullDesc, assignmentId]
        );
        await client.query(`DELETE FROM rubric_rules WHERE assignment_id = $1`, [assignmentId]);
        console.log(`🔄 Updated existing CSD201 Python exam #${assignmentId}: ${spec.title}`);
      } else {
        const daysAhead = 14 + idx * 7;
        const insertRes = await client.query(
          `INSERT INTO assignments (
             course_id, title, description, start_date, due_date, deadline,
             max_score, submission_type, target_type, allowed_language,
             status, allow_late_submission, max_submissions, allow_resubmission
           )
           VALUES (
             $1, $2, $3, NOW(),
             date_trunc('day', NOW() + ($4 || ' days')::interval) + INTERVAL '23 hours 59 minutes',
             date_trunc('day', NOW() + ($4 || ' days')::interval) + INTERVAL '23 hours 59 minutes',
             10.0, 'INDIVIDUAL', 'ALL', 'python',
             'PUBLISHED', TRUE, 0, TRUE
           )
           RETURNING assignment_id`,
          [courseId, spec.title, fullDesc, String(daysAhead)]
        );
        assignmentId = insertRes.rows[0].assignment_id;
        console.log(`✅ Created CSD201 Python exam #${assignmentId}: ${spec.title}`);
      }

      for (const q of spec.questions) {
        await client.query(
          `INSERT INTO rubric_rules (
             assignment_id, rule_type, criterion, description,
             input_data, expected_output, weight, max_score,
             is_hidden, status, order_index
           )
           VALUES ($1, 'AUTOMATED', $2, $3, $4, $5, $6, $6, FALSE, 'Active', $7)`,
          [
            assignmentId,
            `Q${q.qNum}: ${q.title}`,
            q.desc,
            q.input,
            q.output,
            q.points,
            q.qNum,
          ]
        );
      }
    }

    await client.query(
      `SELECT setval('assignments_assignment_id_seq', (SELECT COALESCE(MAX(assignment_id), 1) FROM assignments))`
    );
    await client.query(
      `SELECT setval('rubric_rules_rubric_rule_id_seq', (SELECT COALESCE(MAX(rubric_rule_id), 1) FROM rubric_rules))`
    );

    await client.query('COMMIT');
    console.log('🎉 CSD201 Python exams seeded cleanly!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding CSD201 Python exams:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seedCsd201PythonExams();
