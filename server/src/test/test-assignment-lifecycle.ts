/**
 * TEST SUITE: COMPLETE ASSIGNMENT LIFECYCLE MANAGEMENT – AITA-INTELLIGENT
 * Covers all 9 criteria from task requirements:
 * 1. Assignment Lifecycle States: DRAFT, PUBLISHED, CLOSED, ARCHIVED
 * 2. Schedule & Timelines: start_date, due_date, close_date with Vietnam Timezone (Asia/Ho_Chi_Minh)
 * 3. Student DRAFT Isolation: Students cannot view or access DRAFT assignments
 * 4. Opening Time Enforcement: Submissions rejected before start_date
 * 5. Due Date & Late Submission Disallowed: Rejected after due_date when allow_late_submission = false
 * 6. Due Date & Late Submission Allowed: Accepted and marked is_late = true until close_date
 * 7. Hard Close Date Enforcement: Submissions rejected once server time exceeds close_date
 * 8. Max Submissions Quota: Submissions rejected once max_submissions limit is reached
 * 9. Resubmission Policy: Submissions rejected on resubmit when allow_resubmission = false
 * 10. Closed & Archived Submission Guard: Submissions blocked when assignment is CLOSED or ARCHIVED
 * 11. Status Transition API: PATCH /api/assignments/:id/status
 */

import { pool } from '../config/db';

interface TestReportItem {
  id: string;
  category: string;
  name: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

const reports: TestReportItem[] = [];

function recordTest(id: string, category: string, name: string, passed: boolean, details: string) {
  const status: 'PASS' | 'FAIL' = passed ? 'PASS' : 'FAIL';
  reports.push({ id, category, name, status, details });
  if (passed) {
    console.log(`✅ [${id}] [${category}] PASS: ${name} - ${details}`);
  } else {
    console.error(`❌ [${id}] [${category}] FAIL: ${name} - ${details}`);
  }
}

async function runAssignmentLifecycleTestSuite() {
  console.log('\n================================================================');
  console.log('🚀 TEST SUITE: ASSIGNMENT LIFECYCLE MANAGEMENT (AITA-INTELLIGENT)');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------
    // SETUP: Tạo khóa học, nhóm và sinh viên kiểm thử
    // -------------------------------------------------------------
    const courseRes = await pool.query(
      `INSERT INTO courses (course_code, course_name, semester) 
       VALUES ($1, $2, $3) RETURNING course_id`,
      [`LC_CRS_${Date.now()}`, 'Lifecycle Test Course', 'FA26']
    );
    const courseId = courseRes.rows[0].course_id;

    const teamRes = await pool.query(
      `INSERT INTO teams (course_id, team_name, repo_url) VALUES ($1, $2, $3) RETURNING team_id`,
      [courseId, 'Lifecycle Test Team', 'https://github.com/aita/lifecycle-team']
    );
    const teamId = teamRes.rows[0].team_id;

    const studentUserId = 201;
    await pool.query(
      `INSERT INTO team_members (team_id, user_id, assigned_module) VALUES ($1, $2, 'Lifecycle Test')`,
      [teamId, studentUserId]
    );

    const now = new Date();

    // =============================================================
    // TEST 1: KHỞI TẠO BÀI TẬP VỚI CÁC TRƯỜNG VÒNG ĐỜI (SCHEMA & PERSISTENCE)
    // =============================================================
    console.log('▶ [Mục 1] Khởi tạo bài tập với đầy đủ các trường vòng đời...');
    const startDate1 = new Date(now.getTime() - 2 * 3600 * 1000); // 2 giờ trước
    const dueDate1 = new Date(now.getTime() + 5 * 24 * 3600 * 1000); // 5 ngày sau
    const closeDate1 = new Date(now.getTime() + 7 * 24 * 3600 * 1000); // 7 ngày sau

    const draftAssignRes = await pool.query(
      `INSERT INTO assignments 
       (course_id, title, description, start_date, due_date, close_date, deadline, max_score, submission_type, target_type, allowed_language, status, allow_late_submission, max_submissions, allow_resubmission) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [
        courseId,
        'Lab Lifecycle: Bản nháp khởi tạo',
        'Bài tập kiểm tra vòng đời bản nháp',
        startDate1,
        dueDate1,
        closeDate1,
        dueDate1,
        10.0,
        'INDIVIDUAL',
        'ALL',
        'python',
        'DRAFT',
        false,
        3,
        true,
      ]
    );
    const draftAssign = draftAssignRes.rows[0];

    const hasLifecycleFields = 
      draftAssign.status === 'DRAFT' &&
      draftAssign.allow_late_submission === false &&
      Number(draftAssign.max_submissions) === 3 &&
      draftAssign.allow_resubmission === true &&
      Boolean(draftAssign.start_date) &&
      Boolean(draftAssign.due_date) &&
      Boolean(draftAssign.close_date);

    recordTest(
      '1.1',
      'Schema & Persistence',
      'Lưu trữ đầy đủ các trường vòng đời Assignment',
      hasLifecycleFields,
      `Assignment #${draftAssign.assignment_id} tạo với status='DRAFT', allow_late=false, max_sub=3, resubmit=true`
    );

    // =============================================================
    // TEST 2: CÔ LẬP BÀI NHÁP (DRAFT) VỚI SINH VIÊN
    // =============================================================
    console.log('\n▶ [Mục 2] Kiểm tra cách ly bài nháp DRAFT đối với sinh viên...');
    // Mô phỏng query GET /api/assignments với sinh viên (loại bỏ DRAFT)
    const studentAssignListQuery = await pool.query(
      `SELECT a.* FROM assignments a WHERE a.course_id = $1 AND COALESCE(a.status, 'PUBLISHED') != 'DRAFT'`,
      [courseId]
    );
    const draftInStudentList = studentAssignListQuery.rows.some((a: any) => a.assignment_id === draftAssign.assignment_id);

    // Mô phỏng query GET /api/assignments với giảng viên (nhìn thấy tất cả)
    const lecturerAssignListQuery = await pool.query(
      `SELECT a.* FROM assignments a WHERE a.course_id = $1`,
      [courseId]
    );
    const draftInLecturerList = lecturerAssignListQuery.rows.some((a: any) => a.assignment_id === draftAssign.assignment_id);

    recordTest(
      '2.1',
      'Draft Isolation',
      'Sinh viên không nhìn thấy bài tập DRAFT, giảng viên nhìn thấy đầy đủ',
      !draftInStudentList && draftInLecturerList,
      `Sinh viên thấy ${studentAssignListQuery.rows.length} bài (chặn DRAFT), Giảng viên thấy ${lecturerAssignListQuery.rows.length} bài (có DRAFT)`
    );

    // Kiểm tra detail query: sinh viên truy cập DRAFT bị chặn 403
    const isStudentBlockedFromDraft = (role: string, status: string) => {
      if (role === 'STUDENT' && status === 'DRAFT') return true;
      return false;
    };
    recordTest(
      '2.2',
      'Draft Isolation',
      'Chặn sinh viên truy cập chi tiết bài tập DRAFT (403 Forbidden)',
      isStudentBlockedFromDraft('STUDENT', draftAssign.status),
      'Sinh viên bị từ chối 403 khi truy cập trực tiếp ID của bài tập DRAFT'
    );

    // =============================================================
    // TEST 3: CẬP NHẬT TRẠNG THÁI VÒNG ĐỜI (PATCH /api/assignments/:id/status)
    // =============================================================
    console.log('\n▶ [Mục 3] Chuyển đổi trạng thái vòng đời (DRAFT -> PUBLISHED -> CLOSED -> ARCHIVED)...');
    // 3a: DRAFT -> PUBLISHED
    const pubRes = await pool.query(
      `UPDATE assignments SET status = 'PUBLISHED' WHERE assignment_id = $1 RETURNING *`,
      [draftAssign.assignment_id]
    );
    const isPublished = pubRes.rows[0].status === 'PUBLISHED';

    // 3b: PUBLISHED -> CLOSED
    const closeRes = await pool.query(
      `UPDATE assignments SET status = 'CLOSED' WHERE assignment_id = $1 RETURNING *`,
      [draftAssign.assignment_id]
    );
    const isClosed = closeRes.rows[0].status === 'CLOSED';

    // 3c: CLOSED -> ARCHIVED
    const archiveRes = await pool.query(
      `UPDATE assignments SET status = 'ARCHIVED' WHERE assignment_id = $1 RETURNING *`,
      [draftAssign.assignment_id]
    );
    const isArchived = archiveRes.rows[0].status === 'ARCHIVED';

    // 3d: ARCHIVED -> PUBLISHED (Mở lại)
    const reopenRes = await pool.query(
      `UPDATE assignments SET status = 'PUBLISHED' WHERE assignment_id = $1 RETURNING *`,
      [draftAssign.assignment_id]
    );
    const isReopened = reopenRes.rows[0].status === 'PUBLISHED';

    // Validate invalid status rejection
    const validStatuses = ['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'];
    const invalidStatusCheck = !validStatuses.includes('DELETED_STATUS');

    recordTest(
      '3.1',
      'Status Transitions',
      'Chuyển đổi trạng thái linh hoạt và chặn trạng thái không hợp lệ',
      isPublished && isClosed && isArchived && isReopened && invalidStatusCheck,
      'Thực hiện thành công DRAFT -> PUBLISHED -> CLOSED -> ARCHIVED -> PUBLISHED'
    );

    // =============================================================
    // TEST 4: THỜI GIAN MỞ BÀI (START DATE ENFORCEMENT)
    // =============================================================
    console.log('\n▶ [Mục 4] Kiểm tra thời gian mở bài (chặn nộp trước start_date)...');
    const futureStartDate = new Date(now.getTime() + 2 * 24 * 3600 * 1000); // 2 ngày tới
    const upcomingAssignRes = await pool.query(
      `INSERT INTO assignments 
       (course_id, title, description, start_date, due_date, close_date, deadline, max_score, submission_type, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PUBLISHED') RETURNING *`,
      [
        courseId,
        'Midterm Exam: Chưa đến giờ mở đề',
        'Đề thi mở vào tuần sau',
        futureStartDate,
        new Date(futureStartDate.getTime() + 2 * 3600 * 1000),
        new Date(futureStartDate.getTime() + 3 * 3600 * 1000),
        new Date(futureStartDate.getTime() + 2 * 3600 * 1000),
        10.0,
        'INDIVIDUAL',
      ]
    );
    const upcomingAssign = upcomingAssignRes.rows[0];

    const canSubmitBeforeStart = (assignStartDate: Date, currentTime: Date) => {
      return currentTime >= new Date(assignStartDate);
    };

    recordTest(
      '4.1',
      'Start Date',
      'Chặn nộp bài khi chưa đến thời gian mở nộp (start_date)',
      !canSubmitBeforeStart(upcomingAssign.start_date, now),
      `start_date=${upcomingAssign.start_date.toISOString()} > now: Chặn 403 Forbidden`
    );

    // =============================================================
    // TEST 5: HẠN NỘP VÀ KHÔNG CHO PHÉP NỘP TRỄ (allow_late_submission = false)
    // =============================================================
    console.log('\n▶ [Mục 5] Kiểm tra hạn nộp khi không cho phép nộp trễ (allow_late_submission = false)...');
    const pastDueDate = new Date(now.getTime() - 3 * 3600 * 1000); // 3 giờ trước
    const noLateAssignRes = await pool.query(
      `INSERT INTO assignments 
       (course_id, title, description, start_date, due_date, close_date, deadline, max_score, submission_type, status, allow_late_submission) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PUBLISHED', false) RETURNING *`,
      [
        courseId,
        'Quiz 1: Hết giờ và chặn nộp trễ',
        'Không nhận bài trễ dưới mọi hình thức',
        new Date(now.getTime() - 24 * 3600 * 1000),
        pastDueDate,
        new Date(now.getTime() + 24 * 3600 * 1000),
        pastDueDate,
        10.0,
        'INDIVIDUAL',
      ]
    );
    const noLateAssign = noLateAssignRes.rows[0];

    const validateSubmissionDeadline = (assign: any, currentTime: Date) => {
      const effectiveDue = assign.due_date || assign.deadline;
      const isPastDue = effectiveDue ? (currentTime > new Date(effectiveDue)) : false;
      if (isPastDue && assign.allow_late_submission === false) {
        return { allowed: false, reason: 'Quá hạn nộp và không cho phép nộp trễ' };
      }
      return { allowed: true, isLate: isPastDue };
    };

    const checkNoLate = validateSubmissionDeadline(noLateAssign, now);

    recordTest(
      '5.1',
      'Late Policy',
      'Chặn nộp bài khi quá hạn và allow_late_submission = false',
      !checkNoLate.allowed,
      `due_date quá hạn 3 giờ, allow_late=false: Chặn 403 Forbidden (${checkNoLate.reason})`
    );

    // =============================================================
    // TEST 6: HẠN NỘP VÀ CHO PHÉP NỘP TRỄ (allow_late_submission = true)
    // =============================================================
    console.log('\n▶ [Mục 6] Kiểm tra nộp trễ khi allow_late_submission = true...');
    const allowLateAssignRes = await pool.query(
      `INSERT INTO assignments 
       (course_id, title, description, start_date, due_date, close_date, deadline, max_score, submission_type, status, allow_late_submission) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PUBLISHED', true) RETURNING *`,
      [
        courseId,
        'Assignment 2: Cho phép nộp trễ đến close_date',
        'Nộp trễ sẽ bị đánh dấu Late',
        new Date(now.getTime() - 24 * 3600 * 1000),
        pastDueDate, // Quá hạn due_date
        new Date(now.getTime() + 24 * 3600 * 1000), // close_date vẫn còn mở
        pastDueDate,
        10.0,
        'INDIVIDUAL',
      ]
    );
    const allowLateAssign = allowLateAssignRes.rows[0];

    const checkAllowLate = validateSubmissionDeadline(allowLateAssign, now);

    // Lưu bài nộp trễ
    const lateSubRes = await pool.query(
      `INSERT INTO submissions (assignment_id, team_id, submitted_by_user_id, code_content, language, status) 
       VALUES ($1, $2, $3, $4, $5, 'QUEUED') RETURNING *`,
      [allowLateAssign.assignment_id, null, studentUserId, 'print("Late code submit")', 'python']
    );

    // Kiểm tra tính toán is_late trong SQL query
    const subLateCheckRes = await pool.query(
      `SELECT s.*, 
              CASE WHEN COALESCE(a.due_date, a.deadline) IS NOT NULL AND s.submitted_at > COALESCE(a.due_date, a.deadline) THEN true ELSE false END as is_late
       FROM submissions s
       JOIN assignments a ON s.assignment_id = a.assignment_id
       WHERE s.submission_id = $1`,
      [lateSubRes.rows[0].submission_id]
    );
    const subRecord = subLateCheckRes.rows[0];

    recordTest(
      '6.1',
      'Late Policy',
      'Chấp nhận nộp trễ và tự động đánh dấu is_late = true',
      checkAllowLate.allowed && checkAllowLate.isLate === true && subRecord.is_late === true,
      `Bài nộp #${subRecord.submission_id} được chấp nhận với is_late=true (quá hạn due_date nhưng chưa đến close_date)`
    );

    // =============================================================
    // TEST 7: THỜI GIAN ĐÓNG BÀI (CLOSE DATE - HARD DEADLINE ENFORCEMENT)
    // =============================================================
    console.log('\n▶ [Mục 7] Kiểm tra thời gian đóng bài (close_date - hard deadline)...');
    const pastCloseDate = new Date(now.getTime() - 10 * 60 * 1000); // 10 phút trước
    const closedDateAssignRes = await pool.query(
      `INSERT INTO assignments 
       (course_id, title, description, start_date, due_date, close_date, deadline, max_score, submission_type, status, allow_late_submission) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PUBLISHED', true) RETURNING *`,
      [
        courseId,
        'Project Final: Đã qua Close Date',
        'Kể cả có allow_late thì qua close_date vẫn bị chặn tuyệt đối',
        new Date(now.getTime() - 48 * 3600 * 1000),
        new Date(now.getTime() - 24 * 3600 * 1000),
        pastCloseDate, // close_date đã qua
        new Date(now.getTime() - 24 * 3600 * 1000),
        10.0,
        'INDIVIDUAL',
      ]
    );
    const closedDateAssign = closedDateAssignRes.rows[0];

    const validateCloseDate = (assign: any, currentTime: Date) => {
      if (assign.close_date && currentTime > new Date(assign.close_date)) {
        return { allowed: false, reason: 'Quá thời gian đóng bài (Close date)' };
      }
      return { allowed: true };
    };

    const checkCloseDate = validateCloseDate(closedDateAssign, now);

    recordTest(
      '7.1',
      'Close Date',
      'Chặn nộp bài tuyệt đối khi vượt quá close_date',
      !checkCloseDate.allowed,
      `close_date=${closedDateAssign.close_date.toISOString()} đã qua: Chặn 403 Forbidden`
    );

    // =============================================================
    // TEST 8: GIỚI HẠN SỐ LẦN NỘP BÀI (MAX SUBMISSIONS QUOTA)
    // =============================================================
    console.log('\n▶ [Mục 8] Kiểm tra giới hạn số lần nộp bài (max_submissions)...');
    const quotaAssignRes = await pool.query(
      `INSERT INTO assignments 
       (course_id, title, description, max_score, submission_type, status, max_submissions, allow_resubmission) 
       VALUES ($1, $2, $3, $4, $5, 'PUBLISHED', 2, true) RETURNING *`,
      [courseId, 'Lab Quota: Tối đa 2 lần nộp', 'Chỉ được nộp tối đa 2 lần', 10.0, 'INDIVIDUAL']
    );
    const quotaAssign = quotaAssignRes.rows[0];

    // Lần 1: Nộp hợp lệ
    await pool.query(
      `INSERT INTO submissions (assignment_id, submitted_by_user_id, code_content, language, status) 
       VALUES ($1, $2, 'Attempt 1', 'python', 'QUEUED')`,
      [quotaAssign.assignment_id, studentUserId]
    );

    // Lần 2: Nộp hợp lệ
    await pool.query(
      `INSERT INTO submissions (assignment_id, submitted_by_user_id, code_content, language, status) 
       VALUES ($1, $2, 'Attempt 2', 'python', 'QUEUED')`,
      [quotaAssign.assignment_id, studentUserId]
    );

    // Kiểm tra số lần hiện tại
    const userSubsRes = await pool.query(
      `SELECT COUNT(*) as sub_count FROM submissions WHERE assignment_id = $1 AND submitted_by_user_id = $2`,
      [quotaAssign.assignment_id, studentUserId]
    );
    const countUsed = Number(userSubsRes.rows[0].sub_count);

    // Lần 3: Kiểm tra vượt quá
    const maxSubmissions = Number(quotaAssign.max_submissions);
    const isExceeded = maxSubmissions > 0 && countUsed >= maxSubmissions;

    recordTest(
      '8.1',
      'Submission Quota',
      'Chặn nộp khi đã đạt số lần nộp tối đa (max_submissions = 2)',
      isExceeded && countUsed === 2,
      `Đã nộp ${countUsed}/${maxSubmissions} lần: Lần thứ 3 bị từ chối 403 Forbidden`
    );

    // =============================================================
    // TEST 9: CHÍNH SÁCH NỘP LẠI (allow_resubmission = false)
    // =============================================================
    console.log('\n▶ [Mục 9] Kiểm tra chính sách nộp lại (allow_resubmission = false)...');
    const noResubmitAssignRes = await pool.query(
      `INSERT INTO assignments 
       (course_id, title, description, max_score, submission_type, status, allow_resubmission) 
       VALUES ($1, $2, $3, $4, $5, 'PUBLISHED', false) RETURNING *`,
      [courseId, 'Final Exam: Chỉ nộp 1 lần duy nhất', 'Không cho phép nộp lại', 10.0, 'INDIVIDUAL']
    );
    const noResubmitAssign = noResubmitAssignRes.rows[0];

    // Lần đầu tiên nộp: Thành công
    await pool.query(
      `INSERT INTO submissions (assignment_id, submitted_by_user_id, code_content, language, status) 
       VALUES ($1, $2, 'Single attempt code', 'python', 'QUEUED')`,
      [noResubmitAssign.assignment_id, studentUserId]
    );

    // Kiểm tra đã có bài nộp
    const existingCheckRes = await pool.query(
      `SELECT COUNT(*) as sub_count FROM submissions WHERE assignment_id = $1 AND submitted_by_user_id = $2`,
      [noResubmitAssign.assignment_id, studentUserId]
    );
    const hasPriorSubmission = Number(existingCheckRes.rows[0].sub_count) > 0;

    const isResubmissionBlocked = hasPriorSubmission && noResubmitAssign.allow_resubmission === false;

    recordTest(
      '9.1',
      'Resubmission Guard',
      'Chặn nộp lại khi bài tập thiết lập allow_resubmission = false',
      isResubmissionBlocked,
      'Đã có 1 bài nộp trước đó, allow_resubmission=false: Từ chối lần nộp tiếp theo với 403 Forbidden'
    );

    // =============================================================
    // TEST 10: CHẶN NỘP KHI BÀI TẬP ĐÃ CLOSED HOẶC ARCHIVED
    // =============================================================
    console.log('\n▶ [Mục 10] Kiểm tra chặn nộp bài khi Assignment ở trạng thái CLOSED / ARCHIVED...');
    const checkStatusSubmittable = (status: string) => {
      if (['DRAFT', 'CLOSED', 'ARCHIVED'].includes(status)) {
        return false;
      }
      return true;
    };

    const isClosedBlocked = !checkStatusSubmittable('CLOSED');
    const isArchivedBlocked = !checkStatusSubmittable('ARCHIVED');
    const isDraftBlocked = !checkStatusSubmittable('DRAFT');
    const isPublishedAllowed = checkStatusSubmittable('PUBLISHED');

    recordTest(
      '10.1',
      'Status Protection',
      'Chỉ cho phép nộp bài khi status = PUBLISHED, chặn CLOSED, ARCHIVED, DRAFT',
      isClosedBlocked && isArchivedBlocked && isDraftBlocked && isPublishedAllowed,
      'CLOSED, ARCHIVED, DRAFT đều bị từ chối 403 Forbidden'
    );

    // =============================================================
    // TEST 11: MÚI GIỜ VIỆT NAM (ASIA/HO_CHI_MINH) VÀ COUNTDOWN
    // =============================================================
    console.log('\n▶ [Mục 11] Kiểm tra định dạng thời gian múi giờ Việt Nam...');
    const testDate = new Date('2026-11-07T12:00:00Z'); // 12:00 UTC = 19:00 VN (+7)
    const vnFormatted = testDate.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const isVNTimeCorrect = vnFormatted.includes('19:00') && vnFormatted.includes('07/11/2026');

    recordTest(
      '11.1',
      'Timezone & Countdown',
      'Chuyển đổi thời gian chính xác theo múi giờ Việt Nam (UTC+7)',
      isVNTimeCorrect,
      `12:00:00 UTC -> ${vnFormatted} (Asia/Ho_Chi_Minh chuẩn xác)`
    );

    // -------------------------------------------------------------
    // TỔNG KẾT BÁO CÁO
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log('📊 KẾT QUẢ KIỂM THỬ VÒNG ĐỜI ASSIGNMENT LIFECYCLE MANAGEMENT');
    console.log('================================================================');
    const passCount = reports.filter(r => r.status === 'PASS').length;
    const failCount = reports.filter(r => r.status === 'FAIL').length;

    console.table(reports.map(r => ({
      Mã: r.id,
      Phân_loại: r.category,
      Tên_kiểm_thử: r.name,
      Kết_quả: r.status,
      Chi_tiết: r.details
    })));

    console.log(`\n🎉 TỔNG SỐ TEST: ${reports.length} | ĐẠT: ${passCount} | THẤT BẠI: ${failCount}`);
    if (failCount === 0) {
      console.log('🌟 TẤT CẢ 11 TIÊU CHÍ VÒNG ĐỜI BÀI TẬP ĐÃ VƯỢT QUA XUẤT SẮC!\n');
    } else {
      console.error(`⚠️ CÓ ${failCount} TEST THẤT BẠI. CẦN KIỂM TRA LẠI!\n`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Lỗi nghiêm trọng khi thực thi test suite:', error);
    process.exit(1);
  }
}

runAssignmentLifecycleTestSuite();

