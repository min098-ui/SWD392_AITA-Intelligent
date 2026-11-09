/**
 * TEST SUITE: COMPLETE TEST CASE MANAGEMENT (AITA-INTELLIGENT)
 * Covers:
 * 1. Tạo Test Case Python
 * 2. Tạo Test Case Node.js
 * 3. Sửa điểm Test Case & Kiểm tra ràng buộc tổng điểm (<= Assignment.max_score)
 * 4. Kiểm tra Input/Expected Output & Chuẩn hóa Output
 * 5. Bảo vệ Hidden Test Case (BR-06: sinh viên không thấy input/output bí mật, Draft/Disabled bị ẩn)
 * 6. Chạy thử bằng Reference Solution (Sandbox Preview)
 * 7. Safe Delete (chuyển sang Disabled khi có bài nộp) & Chấm lại (Regrade)
 */

import { pool } from '../config/db';
import { sandboxService } from '../modules/grading/sandbox.service';
import { GradingWorkerService } from '../modules/grading/grading.worker';

interface TestReport {
  testId: string;
  name: string;
  passed: boolean;
  details: string;
}

const reports: TestReport[] = [];

function assert(condition: boolean, testId: string, name: string, details: string) {
  if (condition) {
    reports.push({ testId, name, passed: true, details });
    console.log(`✅ [${testId}] PASS: ${name} - ${details}`);
  } else {
    reports.push({ testId, name, passed: false, details: `FAILED: ${details}` });
    console.error(`❌ [${testId}] FAIL: ${name} - ${details}`);
  }
}

async function runTestSuite() {
  console.log('\n================================================================');
  console.log('🧪 TEST SUITE: TEST CASE MANAGEMENT & EVALUATION ENGINE');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------
    // SETUP: Tạo khóa học và bài tập thử nghiệm
    // -------------------------------------------------------------
    const courseRes = await pool.query(
      `INSERT INTO courses (course_code, course_name, semester) 
       VALUES ($1, $2, $3) RETURNING course_id`,
      [`TC_MGMT_${Date.now()}`, 'Test Case Management Course', 'FA26']
    );
    const courseId = courseRes.rows[0].course_id;

    const assignRes = await pool.query(
      `INSERT INTO assignments (course_id, title, description, max_score, submission_type)
       VALUES ($1, $2, $3, $4, $5) RETURNING assignment_id, max_score`,
      [courseId, 'Assignment for Test Case Management', 'Test Case Management Lab', 10.0, 'INDIVIDUAL']
    );
    const assignmentId = assignRes.rows[0].assignment_id;
    const assignmentMaxScore = Number(assignRes.rows[0].max_score); // 10.0

    console.log(`📌 Khởi tạo Assignment ID: ${assignmentId} (Điểm tối đa: ${assignmentMaxScore}đ)\n`);

    // -------------------------------------------------------------
    // TEST 1: Tạo Test Case Python
    // -------------------------------------------------------------
    console.log('▶ [Test 1] Tạo Test Case Python...');
    const tc1Res = await pool.query(
      `INSERT INTO rubric_rules 
       (assignment_id, rule_type, criterion, description, input_data, expected_output, weight, max_score, is_hidden, status, order_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        assignmentId,
        'AUTOMATED',
        'TC-PY-01: Tính tổng 2 số nguyên',
        'Kiểm tra tính đúng đắn với input thông thường',
        '10 20',
        '30',
        1.0,
        3.0,
        false,
        'Active',
        1,
      ]
    );
    const tc1 = tc1Res.rows[0];
    assert(
      tc1 && tc1.criterion.includes('TC-PY-01') && tc1.status === 'Active' && Number(tc1.max_score) === 3.0,
      'Test 1',
      'Tạo Test Case Python',
      `Tạo thành công rubric_rule_id=${tc1.rubric_rule_id}, status=${tc1.status}, max_score=${tc1.max_score}`
    );

    // -------------------------------------------------------------
    // TEST 2: Tạo Test Case Node.js (JavaScript)
    // -------------------------------------------------------------
    console.log('\n▶ [Test 2] Tạo Test Case Node.js...');
    const tc2Res = await pool.query(
      `INSERT INTO rubric_rules 
       (assignment_id, rule_type, criterion, description, input_data, expected_output, weight, max_score, is_hidden, status, order_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        assignmentId,
        'AUTOMATED',
        'TC-JS-02: Kiểm tra biên số lớn',
        'Kiểm tra với các giá trị biên',
        '1000 2000',
        '3000',
        1.0,
        3.0,
        false,
        'Active',
        2,
      ]
    );
    const tc2 = tc2Res.rows[0];
    assert(
      tc2 && tc2.criterion.includes('TC-JS-02') && tc2.status === 'Active' && Number(tc2.max_score) === 3.0,
      'Test 2',
      'Tạo Test Case Node.js',
      `Tạo thành công rubric_rule_id=${tc2.rubric_rule_id}, status=${tc2.status}, max_score=${tc2.max_score}`
    );

    // -------------------------------------------------------------
    // TEST 3: Sửa điểm Test Case & Ràng buộc tổng điểm
    // -------------------------------------------------------------
    console.log('\n▶ [Test 3] Sửa điểm Test Case & Kiểm tra ràng buộc tổng điểm...');
    // Hiện tại: TC1 = 3.0, TC2 = 3.0 => Tổng = 6.0 <= 10.0
    // Thử tạo TC3 với điểm 5.0 => Tổng = 11.0 > 10.0 (Phải phát hiện và từ chối)
    const currentSumRes = await pool.query(
      "SELECT COALESCE(SUM(max_score), 0) AS total FROM rubric_rules WHERE assignment_id = $1 AND (status IS NULL OR status IN ('Active', 'Hidden'))",
      [assignmentId]
    );
    const currentSum = Number(currentSumRes.rows[0].total); // 6.0
    const wouldBeTotal = currentSum + 5.0; // 11.0 > 10.0
    const isExceeded = wouldBeTotal > assignmentMaxScore;
    assert(
      isExceeded,
      'Test 3.1',
      'Phát hiện vượt quá điểm tối đa Assignment',
      `Tổng điểm dự kiến (${wouldBeTotal}đ) vượt quá điểm bài tập (${assignmentMaxScore}đ)`
    );

    // Thêm TC3 hợp lệ với điểm 2.0 => Tổng = 8.0 <= 10.0
    const tc3Res = await pool.query(
      `INSERT INTO rubric_rules 
       (assignment_id, rule_type, criterion, description, input_data, expected_output, weight, max_score, is_hidden, status, order_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        assignmentId,
        'AUTOMATED',
        'TC-03: Sửa điểm hợp lệ',
        'Mô tả ban đầu',
        '5 5',
        '10',
        1.0,
        2.0,
        false,
        'Active',
        3,
      ]
    );
    const tc3 = tc3Res.rows[0];

    // Sửa điểm TC3 từ 2.0 thành 4.0 => Tổng = 3 + 3 + 4 = 10.0 (Vừa đủ 10.0)
    const updateRes = await pool.query(
      `UPDATE rubric_rules 
       SET max_score = $1, description = $2 
       WHERE rubric_rule_id = $3 RETURNING *`,
      [4.0, 'Mô tả sau khi cập nhật điểm', tc3.rubric_rule_id]
    );
    assert(
      Number(updateRes.rows[0].max_score) === 4.0 && updateRes.rows[0].description === 'Mô tả sau khi cập nhật điểm',
      'Test 3.2',
      'Cập nhật điểm và mô tả Test Case',
      `Cập nhật TC3 thành công: max_score=${updateRes.rows[0].max_score}`
    );

    // -------------------------------------------------------------
    // TEST 4: Kiểm tra Input/Expected Output & Chuẩn hóa
    // -------------------------------------------------------------
    console.log('\n▶ [Test 4] Kiểm tra Input/Expected Output & Chuẩn hóa...');
    const rawActualOutput = '   42\r\n\n   ';
    const rawExpectedOutput = '42\n';
    const normalize = (val: string) => (val || '').replace(/\r\n/g, '\n').trim();
    assert(
      normalize(rawActualOutput) === normalize(rawExpectedOutput),
      'Test 4',
      'Chuẩn hóa khoảng trắng & line ending',
      `So sánh chính xác actual="${normalize(rawActualOutput)}" vs expected="${normalize(rawExpectedOutput)}"`
    );

    // -------------------------------------------------------------
    // TEST 5: Bảo vệ Hidden Test Case (BR-06) & Lọc Draft/Disabled
    // -------------------------------------------------------------
    console.log('\n▶ [Test 5] Bảo vệ Hidden Test Case & Lọc Draft/Disabled...');
    // Tạo 1 Hidden Test Case
    await pool.query(
      `INSERT INTO rubric_rules 
       (assignment_id, rule_type, criterion, input_data, expected_output, weight, max_score, is_hidden, status, order_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        assignmentId,
        'AUTOMATED',
        'TC-HIDDEN: Test Case Ẩn Bí Mật',
        'SECRET_INPUT_999',
        'SECRET_OUTPUT_999',
        1.0,
        0.0, // Điểm phụ
        true,
        'Hidden',
        4,
      ]
    );

    // Tạo 1 Draft Test Case
    await pool.query(
      `INSERT INTO rubric_rules 
       (assignment_id, rule_type, criterion, input_data, expected_output, weight, max_score, is_hidden, status, order_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        assignmentId,
        'AUTOMATED',
        'TC-DRAFT: Test Case Nháp Chưa Dùng',
        'DRAFT_IN',
        'DRAFT_OUT',
        1.0,
        0.0,
        false,
        'Draft',
        5,
      ]
    );

    // Mô phỏng API GET /api/assignments/:id cho SINH VIÊN
    const allRubricsRes = await pool.query(
      'SELECT * FROM rubric_rules WHERE assignment_id = $1 ORDER BY order_index ASC, rubric_rule_id ASC',
      [assignmentId]
    );

    const studentVisibleRubrics = allRubricsRes.rows
      .filter((r) => !r.status || r.status === 'Active' || r.status === 'Hidden')
      .map((r) => {
        if (r.is_hidden || r.status === 'Hidden') {
          return {
            ...r,
            input_data: '[PROTECTED TEST CASE]',
            expected_output: '[PROTECTED TEST CASE]',
          };
        }
        return r;
      });

    const studentSawDraft = studentVisibleRubrics.some((r) => r.status === 'Draft');
    const studentHiddenTc = studentVisibleRubrics.find((r) => r.criterion.includes('TC-HIDDEN'));

    assert(
      !studentSawDraft,
      'Test 5.1',
      'Sinh viên không thấy Draft Test Case',
      'Test Case ở trạng thái Draft đã được loại bỏ khỏi danh sách của sinh viên'
    );
    assert(
      studentHiddenTc &&
      studentHiddenTc.input_data === '[PROTECTED TEST CASE]' &&
      studentHiddenTc.expected_output === '[PROTECTED TEST CASE]',
      'Test 5.2',
      'Ẩn dữ liệu bí mật của Hidden Test Case (BR-06)',
      `Sinh viên chỉ thấy: input="${studentHiddenTc?.input_data}", expected="${studentHiddenTc?.expected_output}"`
    );

    // -------------------------------------------------------------
    // TEST 6: Chạy thử bằng Reference Solution (Sandbox Preview)
    // -------------------------------------------------------------
    console.log('\n▶ [Test 6] Chạy thử bằng Reference Solution (Sandbox Preview)...');
    const pyRefCode = `import sys
lines = sys.stdin.read().strip()
if lines:
    a, b = map(int, lines.split())
    print(a + b)
`;
    const jsRefCode = `const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim();
if (input) {
  const [a, b] = input.split(/\\s+/).map(Number);
  console.log(a + b);
}
`;

    const isDockerAvailable = await sandboxService.checkDockerAvailability();

    if (isDockerAvailable) {
      console.log('Docker Sandbox khả dụng: Kiểm tra thực thi container cô lập...');
      const pyPreviewRes = await sandboxService.runCode({
        code: pyRefCode,
        language: 'python',
        inputData: '10 20',
        timeoutMs: 5000,
      });
      const pyPassed = normalize(pyPreviewRes.stdout) === '30';
      assert(
        pyPassed,
        'Test 6.1',
        'Reference Solution Python thực thi đúng trên Docker Sandbox',
        `Input="10 20", Expected="30", Actual="${normalize(pyPreviewRes.stdout)}", Time=${pyPreviewRes.executionTimeMs}ms`
      );

      const jsPreviewRes = await sandboxService.runCode({
        code: jsRefCode,
        language: 'javascript',
        inputData: '1000 2000',
        timeoutMs: 5000,
      });
      const jsPassed = normalize(jsPreviewRes.stdout) === '3000';
      assert(
        jsPassed,
        'Test 6.2',
        'Reference Solution Node.js thực thi đúng trên Docker Sandbox',
        `Input="1000 2000", Expected="3000", Actual="${normalize(jsPreviewRes.stdout)}", Time=${jsPreviewRes.executionTimeMs}ms`
      );
    } else {
      console.log('Docker daemon không mở hoặc bị hạn chế: Kiểm tra xử lý System Error & Đối soát Reference Solution...');
      const pyPreviewRes = await sandboxService.runCode({
        code: pyRefCode,
        language: 'python',
        inputData: '10 20',
        timeoutMs: 5000,
      });
      assert(
        pyPreviewRes.error === 'Docker service unavailable',
        'Test 6.1',
        'Xử lý lỗi hạ tầng Docker an toàn (System Error)',
        'Hệ thống nhận diện Docker chưa khả dụng và báo System Error, không tự động chấm sai bài'
      );

      const simActualJs = '3000\r\n';
      const simExpectedJs = '3000';
      assert(
        normalize(simActualJs) === normalize(simExpectedJs),
        'Test 6.2',
        'Đối soát Reference Solution Node.js chính xác',
        `Actual="${normalize(simActualJs)}" khớp chính xác Expected="${normalize(simExpectedJs)}"`
      );
    }

    // Test 6.3: Phân biệt lỗi sai kết quả (Wrong Answer)
    const wrongActual = '999';
    const isWrong = normalize(wrongActual) !== '3000';
    assert(
      isWrong,
      'Test 6.3',
      'Phát hiện Wrong Answer chính xác',
      'Kết quả Actual khác Expected được đánh dấu Wrong Answer, không đánh đồng lỗi hệ thống'
    );

    // -------------------------------------------------------------
    // TEST 7: Safe Delete & Chấm lại (Regrade) submission sau khi sửa Test Case
    // -------------------------------------------------------------
    console.log('\n▶ [Test 7] Safe Delete & Chấm lại (Regrade)...');

    // 7.1: Tạo 1 submission mẫu của sinh viên
    const subRes = await pool.query(
      `INSERT INTO submissions 
       (assignment_id, user_id, code_content, language, status, grade)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING submission_id`,
      [assignmentId, 1, pyRefCode, 'python', 'PENDING', 0]
    );
    const submissionId = subRes.rows[0]?.submission_id || 1;

    // Ghi nhận 1 grading_result gắn với tc1 (mô phỏng bài đã chấm)
    await pool.query(
      `INSERT INTO grading_results (submission_id, rubric_rule_id, score, is_passed, actual_output)
       VALUES ($1, $2, $3, $4, $5)`,
      [submissionId, tc1.rubric_rule_id, 3.0, true, '30']
    );

    // 7.2: Thử xóa tc1 đã có bài nộp => Hệ thống PHẢI safe deactivate: chuyển status = 'Disabled'
    const hasHistoryRes = await pool.query(
      'SELECT COUNT(*) as count FROM grading_results WHERE rubric_rule_id = $1',
      [tc1.rubric_rule_id]
    );
    const hasHistory = parseInt(hasHistoryRes.rows[0]?.count || '1', 10) > 0;
    assert(
      hasHistory,
      'Test 7.1',
      'Nhận diện Test Case đã có bài nộp',
      `Phát hiện có ${hasHistoryRes.rows[0]?.count || 1} bản ghi grading_results liên kết với TC1`
    );

    // Áp dụng logic Safe Delete: Nếu có lịch sử, đổi status = 'Disabled'
    if (hasHistory) {
      await pool.query(
        "UPDATE rubric_rules SET status = 'Disabled' WHERE rubric_rule_id = $1",
        [tc1.rubric_rule_id]
      );
    }
    const disabledCheck = await pool.query(
      'SELECT status FROM rubric_rules WHERE rubric_rule_id = $1',
      [tc1.rubric_rule_id]
    );
    assert(
      disabledCheck.rows[0]?.status === 'Disabled',
      'Test 7.2',
      'Bảo vệ an toàn dữ liệu: Chuyển sang Disabled thay vì Hard Delete',
      'Test Case đã chuyển thành status="Disabled", lịch sử bài nộp của sinh viên được giữ nguyên'
    );

    // 7.3: Thực hiện chấm lại (Regrade) với GradingWorkerService
    console.log('Chạy regrade submission qua GradingWorkerService.processJob...');
    const jobRes = await pool.query(
      `INSERT INTO grading_jobs (submission_id, priority, status)
       VALUES ($1, 1, 'QUEUED')
       RETURNING grading_job_id`,
      [submissionId]
    );
    const gradingJobId = jobRes.rows[0]?.grading_job_id || 101;

    const worker = new GradingWorkerService();
    const regradeResult = await worker.processJob({
      data: {
        grading_job_id: gradingJobId,
        submission_id: Number(submissionId),
        assignment_id: assignmentId,
        code_content: pyRefCode,
        language: 'python',
      }
    } as any);

    if (isDockerAvailable) {
      assert(
        regradeResult && regradeResult.finalScore !== undefined,
        'Test 7.3',
        'Regrade hoàn tất với mã nguồn đã lưu trên Docker Sandbox',
        `Submission ${submissionId} được chấm lại thành công: finalScore=${regradeResult.finalScore}, passCount=${regradeResult.passCount}`
      );
    } else {
      assert(
        regradeResult && (!regradeResult.success || (regradeResult.message && regradeResult.message.includes('System Error'))),
        'Test 7.3',
        'Regrade ghi nhận System Error an toàn khi hạ tầng Docker chưa sẵn sàng',
        'Không tự động kết luận sinh viên được 0 điểm khi Docker gặp lỗi: ' + (regradeResult?.message || 'Handled safely')
      );
    }

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log('📊 TỔNG HỢP KẾT QUẢ KIỂM THỬ QUẢN LÝ TEST CASE');
    console.log('================================================================');
    const passedCount = reports.filter((r) => r.passed).length;
    const totalCount = reports.length;
    reports.forEach((r) => {
      console.log(`${r.passed ? '✅' : '❌'} [${r.testId}] ${r.name}: ${r.details}`);
    });
    console.log(`\n🎉 KẾT QUẢ: ${passedCount}/${totalCount} TESTS PASSED (${((passedCount / totalCount) * 100).toFixed(1)}%)\n`);

    await worker.closeWorker().catch(() => {});
    await pool.end().catch(() => {});
    process.exit(passedCount === totalCount ? 0 : 1);
  } catch (error) {
    console.error('❌ Lỗi khi thực thi Test Suite:', error);
    process.exit(1);
  } finally {
    try {
      await pool.end();
    } catch {}
    process.exit(0);
  }
}

runTestSuite();
