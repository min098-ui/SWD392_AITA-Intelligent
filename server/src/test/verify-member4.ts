process.env.NODE_ENV = 'test';
import jwt from 'jsonwebtoken';
import http from 'http';
import app from '../index';
import { pool } from '../config/db';
import { isNoiseFile, parseGitHubUrl } from '../modules/git-analytics/git.routes';

/**
 * Automated Verification Test Suite for Member 4:
 * Git Analytics & Peer Audit Engineer (SWD392 Group 4)
 * Business Rules covered: BR-07 (Noise Filter & Free-Rider Detection), BR-08 (Non-self Peer Audit)
 */

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, failureDetail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${failureDetail ? ` -> ${failureDetail}` : ''}`);
    failedTests++;
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'aita_jwt_secret_dev_key_2026';

// Mock JWT Tokens
const student1Token = jwt.sign(
  { userId: 3, email: 'student1@fpt.edu.vn', role: 'STUDENT' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const student2Token = jwt.sign(
  { userId: 4, email: 'student2@fpt.edu.vn', role: 'STUDENT' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const lecturerToken = jwt.sign(
  { userId: 2, email: 'giangnv@fe.edu.vn', role: 'LECTURER' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

async function makeRequest(
  port: number,
  method: string,
  path: string,
  token?: string,
  body?: any
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData).toString();
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: port,
        path: path,
        method: method,
        headers: headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let parsedData = {};
          try {
            parsedData = rawData ? JSON.parse(rawData) : {};
          } catch (e) {
            parsedData = { raw: rawData };
          }
          resolve({ status: res.statusCode || 500, data: parsedData });
        });
      }
    );

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runMember4Tests() {
  console.log('\n================================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ THÀNH VIÊN 4: GIT ANALYTICS & PEER AUDIT');
  console.log('   Vai trò: Git Analytics, Noise Filter, Free-Rider & Peer Audit');
  console.log('   Business Rules: BR-07, BR-08 | SWD392 Group 4');
  console.log('================================================================\n');

  const server = http.createServer(app);
  const testPort = 5098;

  await new Promise<void>((resolve) => {
    server.listen(testPort, () => {
      resolve();
    });
  });

  try {
    // -------------------------------------------------------------------------
    // PHẦN 1: NOISE FILTER & URL PARSER UNIT TESTS (BR-07)
    // -------------------------------------------------------------------------
    console.log('📦 1. KIỂM THỬ BỘ LỌC NHIỄU (NOISE FILTER) & GIT URL PARSER (BR-07)');

    assert(
      isNoiseFile('node_modules/express/index.js') === true,
      'Noise Filter: Tự động loại bỏ thư mục node_modules/'
    );
    assert(
      isNoiseFile('package-lock.json') === true,
      'Noise Filter: Tự động loại bỏ file package-lock.json'
    );
    assert(
      isNoiseFile('.next/static/chunks/main.js') === true,
      'Noise Filter: Tự động loại bỏ thư mục build .next/'
    );
    assert(
      isNoiseFile('dist/bundle.min.js') === true,
      'Noise Filter: Tự động loại bỏ file minified .min.js'
    );
    assert(
      isNoiseFile('server/src/modules/git-analytics/git.routes.ts') === false,
      'Noise Filter: Giữ nguyên mã nguồn hợp lệ (.ts, .js, .py)'
    );

    const parsedHttps = parseGitHubUrl('https://github.com/aita-project/aita-intelligent.git');
    assert(
      parsedHttps?.owner === 'aita-project' && parsedHttps?.repo === 'aita-intelligent',
      'Git URL Parser: Phân tách chính xác owner/repo từ HTTPS URL'
    );

    const parsedSsh = parseGitHubUrl('git@github.com:fpt-swd392/group4-repo.git');
    assert(
      parsedSsh?.owner === 'fpt-swd392' && parsedSsh?.repo === 'group4-repo',
      'Git URL Parser: Phân tách chính xác owner/repo từ SSH Git URL'
    );

    // -------------------------------------------------------------------------
    // PHẦN 2: PEER AUDIT API (BR-08)
    // -------------------------------------------------------------------------
    console.log('\n👥 2. KIỂM THỬ HỆ THỐNG ĐÁNH GIÁ CHÉO NỘI BỘ (PEER AUDIT - BR-08)');

    // Đảm bảo dữ liệu test độc lập cho môn học và nhóm 1
    await pool.query(`INSERT INTO courses (course_id, course_code, course_name, semester, lecturer_id) VALUES (1, 'SWD392', 'Software Architecture & Design Project', 'FA26', 2) ON CONFLICT (course_id) DO NOTHING`);
    await pool.query(`INSERT INTO teams (team_id, team_name, course_id, repo_url) VALUES (1, 'Group 4 - AITA Project', 1, 'https://github.com/min098-ui/SWD392_AITA-Intelligent') ON CONFLICT (team_id) DO NOTHING`);
    await pool.query(`INSERT INTO users (user_id, full_name, email, password_hash, role) VALUES (3, 'Student One', 'student1@fpt.edu.vn', 'hash', 'STUDENT'), (4, 'Student Two', 'student2@fpt.edu.vn', 'hash', 'STUDENT') ON CONFLICT (user_id) DO NOTHING`);
    await pool.query(`INSERT INTO team_members (team_id, user_id, assigned_module, role) VALUES (1, 3, 'Backend', 'MEMBER'), (1, 4, 'Frontend', 'MEMBER') ON CONFLICT DO NOTHING`);

    // Test 2.1: Sinh viên 1 cố tình tự chấm điểm chính mình -> Phải bị từ chối HTTP 400
    const selfAuditRes = await makeRequest(
      testPort,
      'POST',
      '/api/peer-audits',
      student1Token, // user_id = 3
      {
        team_id: 1,
        reviewee_id: 3, // Cố tình chọn chính mình
        audit_round: 1,
        score: 10.0,
        comments: 'Tự khen mình làm tốt nhất nhóm',
      }
    );
    assert(
      selfAuditRes.status === 400,
      'BR-08 Cấm tự đánh giá: Sinh viên tự chấm điểm bản thân trả về HTTP 400 Bad Request',
      `Nhận mã HTTP: ${selfAuditRes.status}`
    );

    // Test 2.2: Sinh viên 1 đánh giá Sinh viên 2 hợp lệ -> Thành công HTTP 201 hoặc 200
    const validAuditRes = await makeRequest(
      testPort,
      'POST',
      '/api/peer-audits',
      student1Token, // user_id = 3
      {
        team_id: 1,
        reviewee_id: 4, // Đánh giá Sinh viên 2
        audit_round: 1,
        score: 9.5,
        comments: 'Bạn Khoa làm việc chăm chỉ, hoàn thành xuất sắc Docker Sandbox',
        passed: true,
      }
    );
    assert(
      validAuditRes.status === 201 || validAuditRes.status === 200,
      'BR-08 Đánh giá chéo hợp lệ: Sinh viên 1 đánh giá Sinh viên 2 thành công',
      `Nhận mã HTTP: ${validAuditRes.status}`
    );

    // Test 2.3: Sinh viên 2 đánh giá Sinh viên 1 hợp lệ
    const validAudit2Res = await makeRequest(
      testPort,
      'POST',
      '/api/peer-audits',
      student2Token, // user_id = 4
      {
        team_id: 1,
        reviewee_id: 3, // Đánh giá Sinh viên 1
        audit_round: 1,
        score: 9.0,
        comments: 'Bạn Mai thiết kế kiến trúc rõ ràng, hỗ trợ nhóm nhiệt tình',
        passed: true,
      }
    );
    assert(
      validAudit2Res.status === 201 || validAudit2Res.status === 200,
      'BR-08 Chiều ngược lại: Sinh viên 2 đánh giá Sinh viên 1 thành công',
      `Nhận mã HTTP: ${validAudit2Res.status}`
    );

    // Test 2.4: Lấy danh sách đánh giá chéo theo team
    const teamAuditsRes = await makeRequest(testPort, 'GET', '/api/peer-audits/1', lecturerToken);
    assert(
      teamAuditsRes.status === 200 && Array.isArray(teamAuditsRes.data.audits),
      'GET /api/peer-audits/:teamId: Trả về danh sách phiếu đánh giá chéo của nhóm',
      `Số lượng phiếu: ${teamAuditsRes.data.audits?.length}`
    );

    // Test 2.5: Tổng hợp điểm trung bình Peer Audit Summary
    const summaryRes = await makeRequest(testPort, 'GET', '/api/peer-audits/team/1/summary', lecturerToken);
    assert(
      summaryRes.status === 200 && Array.isArray(summaryRes.data.member_summaries),
      'GET /api/peer-audits/team/:id/summary: Tính điểm trung bình AVG(score) cho từng thành viên',
      `Số thành viên tổng hợp: ${summaryRes.data.member_summaries?.length}`
    );

    // -------------------------------------------------------------------------
    // PHẦN 3: GIT SYNC & FREE-RIDER DETECTION (BR-07)
    // -------------------------------------------------------------------------
    console.log('\n🐙 3. KIỂM THỬ ĐỒNG BỘ TELEMETRY GIT & PHÁT HIỆN FREE-RIDER (BR-07)');

    // Test 3.1: Trigger đồng bộ commit history
    const syncRes = await makeRequest(testPort, 'POST', '/api/git/1/sync', lecturerToken);
    assert(
      syncRes.status === 200 && syncRes.data.synced_commits_count > 0,
      'POST /api/git/:teamId/sync: Đồng bộ commit thành công và áp dụng Noise Filter',
      `Số commit nạp vào DB: ${syncRes.data.synced_commits_count}`
    );

    // Test 3.2: Lấy thống kê commits và đóng góp dòng code
    const commitsRes = await makeRequest(testPort, 'GET', '/api/git/1/commits', lecturerToken);
    assert(
      commitsRes.status === 200 && Array.isArray(commitsRes.data.member_contributions),
      'GET /api/git/:teamId/commits: Trả về bảng thống kê đóng góp LOC theo từng thành viên',
      `Tổng số commit: ${commitsRes.data.commits?.length}`
    );

    // Test 3.3: Kiểm tra công thức phát hiện Free-Rider (BR-07)
    // Thêm một thành viên đóng góp cực thấp (< 5% LOC) để kiểm tra thuật toán gắn cờ Free-Rider
    await pool.query(
      `INSERT INTO users (user_id, full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO NOTHING`,
      [99, 'Sinh Viên Ý Lại (Test Free-Rider)', 'ylai.test@fpt.edu.vn', 'hash_test', 'STUDENT']
    );
    await pool.query(
      `INSERT INTO team_members (team_id, user_id, assigned_module)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [1, 99, 'Documentation Support']
    );
    await pool.query('DELETE FROM git_commits WHERE author_user_id = $1 AND team_id = $2', [99, 1]);
    await pool.query(
      `INSERT INTO git_commits (team_id, author_user_id, commit_hash, message, lines_added, lines_deleted, committed_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (commit_hash) DO UPDATE SET lines_added = 3`,
      [1, 99, 'hash_freerider_test_sample', 'fix typo in comment', 3, 0]
    );

    const freeRiderCheckRes = await makeRequest(testPort, 'GET', '/api/git/1/commits', lecturerToken);
    const contributions = freeRiderCheckRes.data.member_contributions || [];
    const freeRiderMember = contributions.find((m: any) => m.user_id === 99 || (m.contribution_percentage < 5.0 && m.total_lines_added > 0));

    assert(
      freeRiderMember !== undefined && freeRiderMember.is_free_rider === true,
      'BR-07 Free-Rider Detection: Tự động phát hiện và gắn cờ FREE_RIDER_WARNING khi LOC% < 5%',
      `Thành viên bị cờ: ${freeRiderMember?.full_name} (${freeRiderMember?.contribution_percentage}%)`
    );

    // Dọn dẹp dữ liệu test ngay sau khi kiểm thử xong để không ảnh hưởng dữ liệu thật
    await pool.query('DELETE FROM peer_audits WHERE team_id = 1');
    await pool.query('DELETE FROM git_commits WHERE author_user_id IN (3, 4, 99) OR commit_hash = $1', ['hash_freerider_test_sample']);
    await pool.query('DELETE FROM team_members WHERE user_id IN (3, 4, 99)');
    await pool.query('DELETE FROM users WHERE user_id IN (3, 4, 99) OR email = $1', ['ylai.test@fpt.edu.vn']);
    await pool.query('DELETE FROM teams WHERE team_id = 1');

    // -------------------------------------------------------------------------
    // TỔNG KẾT KẾT QUẢ
    // -------------------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`📊 TỔNG KẾT KIỂM THỬ THÀNH VIÊN 4:`);
    console.log(`   Số bài test ĐẠT (PASSED): ${passedTests}`);
    console.log(`   Số bài test LỖI (FAILED): ${failedTests}`);
    if (failedTests === 0) {
      console.log('   🎉 XUẤT SẮC: TẤT CẢ 15 TEST CASES CỦA THÀNH VIÊN 4 ĐÃ ĐẠT 100%!');
      console.log('   Sẵn sàng báo cáo và bảo vệ đồ án SWD392!');
    }
    console.log('================================================================\n');
  } finally {
    try {
      await pool.query('DELETE FROM peer_audits WHERE team_id = 1');
      await pool.query('DELETE FROM git_commits WHERE author_user_id IN (3, 4, 99) OR commit_hash = $1', ['hash_freerider_test_sample']);
      await pool.query('DELETE FROM team_members WHERE user_id IN (3, 4, 99)');
      await pool.query('DELETE FROM users WHERE user_id IN (3, 4, 99) OR email = $1', ['ylai.test@fpt.edu.vn']);
      await pool.query('DELETE FROM teams WHERE team_id = 1');
    } catch (e) {}
    server.close();
  }
}

runMember4Tests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal Test Runner Error:', err);
    process.exit(1);
  });
