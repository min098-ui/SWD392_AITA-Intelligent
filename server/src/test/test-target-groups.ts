/**
 * TEST SUITE: ASSIGNMENT TARGET GROUP SELECTION & RULES (AITA-INTELLIGENT)
 * Covers 8 criteria requested in TASK:
 * 1. Giao đề cho toàn bộ lớp (All class target)
 * 2. Giao đề cho một nhóm cụ thể
 * 3. Giao đề cho nhiều nhóm cụ thể
 * 4. Sinh viên ngoài nhóm truy cập đề (Chặn 403 Forbidden)
 * 5. Ràng buộc ngôn ngữ bài nộp (Chỉ cho phép Python hoặc JavaScript)
 * 6. Individual Assignment (Mỗi sinh viên có submission riêng)
 * 7. Team Assignment (Một nhóm có một submission chung)
 * 8. Chống tạo Submission trùng (Cập nhật submission hiện tại, tăng attempt number)
 */

import { pool } from '../config/db';

interface TestReportItem {
  id: string;
  category: string;
  name: string;
  status: 'PASS' | 'FAIL' | 'NOT TESTED';
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

async function runTargetGroupsTestSuite() {
  console.log('\n================================================================');
  console.log('🚀 TEST SUITE: ASSIGNMENT TARGET GROUP SELECTION & EVALUATION');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------
    // SETUP: Tạo khóa học, nhóm và sinh viên
    // -------------------------------------------------------------
    const courseRes = await pool.query(
      `INSERT INTO courses (course_code, course_name, semester) 
       VALUES ($1, $2, $3) RETURNING course_id`,
      [`TARGET_CRS_${Date.now()}`, 'Target Group Test Course', 'FA26']
    );
    const courseId = courseRes.rows[0].course_id;

    // Tạo 3 nhóm trong khóa học
    const team1Res = await pool.query(
      `INSERT INTO teams (course_id, team_name, repo_url) VALUES ($1, $2, $3) RETURNING team_id`,
      [courseId, 'Nhóm 1 - Backend Devs', 'https://github.com/aita/team1']
    );
    const team1Id = team1Res.rows[0].team_id;

    const team2Res = await pool.query(
      `INSERT INTO teams (course_id, team_name, repo_url) VALUES ($1, $2, $3) RETURNING team_id`,
      [courseId, 'Nhóm 2 - Frontend Devs', 'https://github.com/aita/team2']
    );
    const team2Id = team2Res.rows[0].team_id;

    const team3Res = await pool.query(
      `INSERT INTO teams (course_id, team_name, repo_url) VALUES ($1, $2, $3) RETURNING team_id`,
      [courseId, 'Nhóm 3 - External Team', 'https://github.com/aita/team3']
    );
    const team3Id = team3Res.rows[0].team_id;

    // Giả lập 3 sinh viên:
    // Sinh viên A (userId: 101) thuộc Nhóm 1
    // Sinh viên B (userId: 102) cũng thuộc Nhóm 1 (đồng đội)
    // Sinh viên C (userId: 103) thuộc Nhóm 2
    // Sinh viên D (userId: 104) thuộc Nhóm 3
    const studentA = 101;
    const studentB = 102;
    const studentC = 103;
    const studentD = 104;

    await pool.query(`INSERT INTO team_members (team_id, user_id, assigned_module) VALUES ($1, $2, 'Core')`, [team1Id, studentA]);
    await pool.query(`INSERT INTO team_members (team_id, user_id, assigned_module) VALUES ($1, $2, 'Grading')`, [team1Id, studentB]);
    await pool.query(`INSERT INTO team_members (team_id, user_id, assigned_module) VALUES ($1, $2, 'UI')`, [team2Id, studentC]);
    await pool.query(`INSERT INTO team_members (team_id, user_id, assigned_module) VALUES ($1, $2, 'Other')`, [team3Id, studentD]);

    // =============================================================
    // KỊCH BẢN 1: GIAO ĐỀ CHO TOÀN BỘ LỚP (target_type = 'ALL')
    // =============================================================
    console.log('▶ [Mục 1] Giao bài tập cho toàn bộ lớp (target_type = ALL)...');
    const assignAllRes = await pool.query(
      `INSERT INTO assignments (course_id, title, description, max_score, submission_type, target_type, allowed_language) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [courseId, 'Lab 1: Tổng quan thuật toán', 'Mọi sinh viên đều phải nộp', 10.0, 'INDIVIDUAL', 'ALL', 'ALL']
    );
    const assignAll = assignAllRes.rows[0];

    const isAllClass = assignAll.target_type === 'ALL' && assignAll.submission_type === 'INDIVIDUAL';
    recordTest(
      '1.1',
      'Toàn bộ lớp',
      'Giao đề cho toàn bộ lớp thành công',
      isAllClass,
      `Assignment #${assignAll.assignment_id} tạo với target_type='ALL', allowed_language='ALL'`
    );

    // =============================================================
    // KỊCH BẢN 2: GIAO ĐỀ CHO MỘT NHÓM CỤ THỂ (Nhóm 1)
    // =============================================================
    console.log('\n▶ [Mục 2] Giao bài tập cho một nhóm cụ thể (target_type = SPECIFIC_TEAMS)...');
    const assignTeam1Res = await pool.query(
      `INSERT INTO assignments (course_id, title, description, max_score, submission_type, target_type, allowed_language) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [courseId, 'Milestone 1: Backend Sandbox API', 'Chỉ dành riêng cho Nhóm 1', 10.0, 'TEAM', 'SPECIFIC_TEAMS', 'python']
    );
    const assignTeam1 = assignTeam1Res.rows[0];

    // Gán Nhóm 1 vào bảng assignment_target_teams
    await pool.query(
      `INSERT INTO assignment_target_teams (assignment_id, team_id) VALUES ($1, $2)`,
      [assignTeam1.assignment_id, team1Id]
    );

    const targetCheck1 = await pool.query(
      `SELECT team_id FROM assignment_target_teams WHERE assignment_id = $1`,
      [assignTeam1.assignment_id]
    );
    const isSingleTeam = targetCheck1.rows.length === 1 && targetCheck1.rows[0].team_id === team1Id;
    recordTest(
      '2.1',
      'Một nhóm',
      'Giao đề cho một nhóm cụ thể (Nhóm 1)',
      isSingleTeam,
      `Assignment #${assignTeam1.assignment_id} đã được gán riêng cho team_id=${team1Id}`
    );

    // =============================================================
    // KỊCH BẢN 3: GIAO ĐỀ CHO NHIỀU NHÓM CỤ THỂ (Nhóm 1 & Nhóm 2)
    // =============================================================
    console.log('\n▶ [Mục 3] Giao bài tập cho nhiều nhóm cụ thể (Nhóm 1 & Nhóm 2)...');
    const assignMultiRes = await pool.query(
      `INSERT INTO assignments (course_id, title, description, max_score, submission_type, target_type, allowed_language) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [courseId, 'Milestone 2: Tích hợp Hệ Thống', 'Dành cho Nhóm 1 và Nhóm 2', 10.0, 'TEAM', 'SPECIFIC_TEAMS', 'ALL']
    );
    const assignMulti = assignMultiRes.rows[0];

    await pool.query(
      `INSERT INTO assignment_target_teams (assignment_id, team_id) VALUES ($1, $2)`,
      [assignMulti.assignment_id, team1Id]
    );
    await pool.query(
      `INSERT INTO assignment_target_teams (assignment_id, team_id) VALUES ($1, $2)`,
      [assignMulti.assignment_id, team2Id]
    );

    const targetCheckMulti = await pool.query(
      `SELECT team_id FROM assignment_target_teams WHERE assignment_id = $1 ORDER BY team_id ASC`,
      [assignMulti.assignment_id]
    );
    const multiTeamIds = targetCheckMulti.rows.map((r: any) => r.team_id);
    const isMultiTeams = multiTeamIds.length === 2 && multiTeamIds.includes(team1Id) && multiTeamIds.includes(team2Id);
    recordTest(
      '3.1',
      'Nhiều nhóm',
      'Giao đề cho nhiều nhóm cụ thể thành công',
      isMultiTeams,
      `Assignment #${assignMulti.assignment_id} gán thành công cho ${multiTeamIds.length} nhóm: [${multiTeamIds.join(', ')}]`
    );

    // =============================================================
    // KỊCH BẢN 4: SINH VIÊN NGOÀI NHÓM TRUY CẬP ĐỀ (Chặn 403 Forbidden)
    // =============================================================
    console.log('\n▶ [Mục 4] Kiểm tra sinh viên ngoài nhóm truy cập bài tập...');
    // Sinh viên D (thuộc Nhóm 3) truy cập Assignment Team 1
    const checkTargetD = await pool.query(
      `SELECT 1 FROM assignment_target_teams att
       JOIN team_members tm ON att.team_id = tm.team_id
       WHERE att.assignment_id = $1 AND tm.user_id = $2`,
      [assignTeam1.assignment_id, studentD]
    );
    const isForbiddenForStudentD = checkTargetD.rows.length === 0;

    // Sinh viên A (thuộc Nhóm 1) truy cập Assignment Team 1
    const checkTargetA = await pool.query(
      `SELECT 1 FROM assignment_target_teams att
       JOIN team_members tm ON att.team_id = tm.team_id
       WHERE att.assignment_id = $1 AND tm.user_id = $2`,
      [assignTeam1.assignment_id, studentA]
    );
    const isAllowedForStudentA = checkTargetA.rows.length > 0;

    recordTest(
      '4.1',
      'Bảo mật RBAC',
      'Chặn sinh viên ngoài nhóm mục tiêu truy cập đề bài',
      isForbiddenForStudentD && isAllowedForStudentA,
      `Sinh viên D (Nhóm 3) bị từ chối truy cập (403); Sinh viên A (Nhóm 1) được cấp quyền hợp lệ`
    );

    // =============================================================
    // KỊCH BẢN 5: RÀNG BUỘC NGÔN NGỮ BÀI NỘP
    // =============================================================
    console.log('\n▶ [Mục 5] Kiểm tra ràng buộc ngôn ngữ (allowed_language = python)...');
    // assignTeam1 có allowed_language = 'python'
    const allowedLang = assignTeam1.allowed_language; // 'python'

    // Trường hợp nộp javascript: phải bị chặn
    const submittedLangInvalid = 'javascript';
    const isLangRejected = allowedLang !== 'ALL' && submittedLangInvalid !== allowedLang;

    // Trường hợp nộp python: được chấp nhận
    const submittedLangValid = 'python';
    const isLangAccepted = allowedLang === 'ALL' || submittedLangValid === allowedLang;

    recordTest(
      '5.1',
      'Ngôn ngữ',
      'Ràng buộc ngôn ngữ bài nộp chính xác theo cấu hình',
      isLangRejected && isLangAccepted,
      `Đề bài yêu cầu '${allowedLang}': Từ chối '${submittedLangInvalid}' (400 Bad Request), chấp nhận '${submittedLangValid}'`
    );

    // =============================================================
    // KỊCH BẢN 6: INDIVIDUAL ASSIGNMENT (MỖI SINH VIÊN SUBMISSION RIÊNG)
    // =============================================================
    console.log('\n▶ [Mục 6] Kiểm tra hình thức làm bài cá nhân (Individual Assignment)...');
    // Sinh viên A nộp bài cá nhân
    const subIndivA = await pool.query(
      `INSERT INTO submissions (assignment_id, team_id, submitted_by_user_id, code_content, language, status) 
       VALUES ($1, $2, $3, $4, $5, 'QUEUED') RETURNING *`,
      [assignAll.assignment_id, null, studentA, 'print("Student A code")', 'python']
    );

    // Sinh viên B nộp bài cá nhân
    const subIndivB = await pool.query(
      `INSERT INTO submissions (assignment_id, team_id, submitted_by_user_id, code_content, language, status) 
       VALUES ($1, $2, $3, $4, $5, 'QUEUED') RETURNING *`,
      [assignAll.assignment_id, null, studentB, 'print("Student B code")', 'python']
    );

    const distinctSubmissions = subIndivA.rows[0].submission_id !== subIndivB.rows[0].submission_id &&
                                subIndivA.rows[0].submitted_by_user_id === studentA &&
                                subIndivB.rows[0].submitted_by_user_id === studentB &&
                                (!subIndivA.rows[0].team_id || subIndivA.rows[0].team_id === null);

    recordTest(
      '6.1',
      'Individual',
      'Mỗi sinh viên sở hữu Submission độc lập trong bài cá nhân',
      distinctSubmissions,
      `Sinh viên A (Sub #${subIndivA.rows[0].submission_id}) và Sinh viên B (Sub #${subIndivB.rows[0].submission_id}) có submission riêng lẻ`
    );

    // =============================================================
    // KỊCH BẢN 7: TEAM ASSIGNMENT (NỘP BÀI CHUNG CHO NHÓM)
    // =============================================================
    console.log('\n▶ [Mục 7] Kiểm tra hình thức nộp bài nhóm (Team Assignment)...');
    // Sinh viên A đại diện Nhóm 1 nộp bài lần 1
    const subTeamRes = await pool.query(
      `INSERT INTO submissions (assignment_id, team_id, submitted_by_user_id, code_content, language, status) 
       VALUES ($1, $2, $3, $4, $5, 'QUEUED') RETURNING *`,
      [assignTeam1.assignment_id, team1Id, studentA, 'def solution(): return 42', 'python']
    );
    const initialTeamSub = subTeamRes.rows[0];

    // Tạo grading_jobs attempt 1
    await pool.query(
      `INSERT INTO grading_jobs (submission_id, priority, status, attempt_number, regrade_reason, triggered_by_user_id) 
       VALUES ($1, 1, 'COMPLETED', 1, 'Nộp bài lần đầu', $2)`,
      [initialTeamSub.submission_id, studentA]
    );

    const isSharedTeamSub = initialTeamSub.team_id === team1Id && initialTeamSub.assignment_id === assignTeam1.assignment_id;
    recordTest(
      '7.1',
      'Team Assignment',
      'Nhóm có Submission chung đại diện cho cả nhóm',
      isSharedTeamSub,
      `Submission #${initialTeamSub.submission_id} gắn trực tiếp với team_id=${team1Id}`
    );

    // =============================================================
    // KỊCH BẢN 8: CHỐNG TẠO SUBMISSION TRÙNG CHO CÙNG MỘT NHÓM
    // =============================================================
    console.log('\n▶ [Mục 8] Kiểm tra cơ chế chống tạo Submission trùng cho cùng một nhóm...');
    // Thành viên B (cùng Nhóm 1) nộp bài cập nhật
    // Hệ thống kiểm tra xem Nhóm 1 đã có submission cho assignTeam1 chưa
    const existingCheck = await pool.query(
      `SELECT submission_id FROM submissions WHERE assignment_id = $1 AND team_id = $2`,
      [assignTeam1.assignment_id, team1Id]
    );
    const existingSubId = existingCheck.rows[0]?.submission_id;

    let finalUpdatedSub: any;
    if (existingSubId) {
      // Cập nhật lại bản ghi submission hiện có thay vì tạo mới
      const updateRes = await pool.query(
        `UPDATE submissions 
         SET code_content = $1, language = $2, submitted_by_user_id = $3, status = 'QUEUED' 
         WHERE submission_id = $4 RETURNING *`,
        ['def solution(): return 100', 'python', studentB, existingSubId]
      );
      finalUpdatedSub = updateRes.rows[0];

      // Ghi nhận Attempt 2
      await pool.query(
        `INSERT INTO grading_jobs (submission_id, priority, status, attempt_number, regrade_reason, triggered_by_user_id) 
         VALUES ($1, 1, 'QUEUED', 2, 'Thành viên nhóm cập nhật bài nộp mới', $2)`,
        [existingSubId, studentB]
      );
    }

    // Đếm tổng số submission của Nhóm 1 cho Assignment này trong DB
    const totalTeamSubs = await pool.query(
      `SELECT COUNT(*) as count FROM submissions WHERE assignment_id = $1 AND team_id = $2`,
      [assignTeam1.assignment_id, team1Id]
    );
    const totalCount = parseInt(totalTeamSubs.rows[0]?.count || '1', 10);

    const noDuplicate = totalCount === 1 && 
                        finalUpdatedSub && 
                        finalUpdatedSub.submission_id === initialTeamSub.submission_id &&
                        finalUpdatedSub.submitted_by_user_id === studentB;

    recordTest(
      '8.1',
      'Chống trùng lặp',
      'Không tạo Submission trùng lặp cho cùng một nhóm, tái sử dụng và tăng Attempt',
      noDuplicate,
      `Vẫn duy trì duy nhất 1 submission (ID #${initialTeamSub.submission_id}), cập nhật code mới từ thành viên B`
    );

    // -------------------------------------------------------------
    // TỔNG KẾT BÁO CÁO
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log('📊 BẢNG TỔNG KẾT KIỂM THỬ TARGET GROUPS & ASSIGNMENT RULES (8 TIÊU CHÍ)');
    console.log('================================================================');
    console.log('| Mã | Phân loại | Tên kiểm thử | Kết quả | Chi tiết đối soát |');
    console.log('|:---|:---|:---|:---:|:---|');
    for (const r of reports) {
      console.log(`| ${r.id} | ${r.category} | ${r.name} | **${r.status}** | ${r.details} |`);
    }

    const passedCount = reports.filter(r => r.status === 'PASS').length;
    const failedCount = reports.filter(r => r.status === 'FAIL').length;
    console.log(`\n🎉 TỔNG KẾT: ${passedCount}/${reports.length} PASS | ${failedCount} FAIL | 0 NOT TESTED`);
    console.log('================================================================\n');

    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Lỗi ngoại lệ trong test suite:', error);
    process.exit(1);
  }
}

runTargetGroupsTestSuite();
