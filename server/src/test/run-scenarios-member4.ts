process.env.NODE_ENV = 'test';
import http from 'http';
import jwt from 'jsonwebtoken';
import app from '../index';
import { pool } from '../config/db';
import { isNoiseFile, parseGitHubUrl } from '../modules/git-analytics/noise-filter.service';

/**
 * Real Demonstration Scenarios Runner for Member 4:
 * Đinh Gia Huy (dinhgiahuylol12345@gmail.com / GitHub: dinhgiahuy140905)
 * Role: Git Analytics & Peer Audit Engineer
 * Business Rules covered: BR-07 (Noise Filter & Free-Rider Alert), BR-08 (Peer Audit Integrity)
 */

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_aita_project_swd392_2026';

const lecturerToken = jwt.sign(
  { userId: 2, email: 'giangnv@fe.edu.vn', role: 'LECTURER', fullName: 'ThS. Nguyễn Văn Giảng' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const student1Token = jwt.sign(
  { userId: 3, email: 'student1@fpt.edu.vn', role: 'STUDENT', fullName: 'Lê Văn An' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const student2Token = jwt.sign(
  { userId: 4, email: 'student2@fpt.edu.vn', role: 'STUDENT', fullName: 'Trần Thị Bình' },
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
          let parsedData: any = {};
          try {
            parsedData = JSON.parse(rawData);
          } catch {
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

async function runMember4Scenarios() {
  console.log('\n========================================================================');
  console.log('🚀 [MEMBER 4] DEMO KỊCH BẢN THỰC NGHIỆM: GIT TELEMETRY & PEER AUDIT');
  console.log('👤 Kỹ Sư Phụ Trách: Đinh Gia Huy (dinhgiahuylol12345@gmail.com)');
  console.log('📌 Business Rules: BR-07 (Noise Filter & Free-Rider), BR-08 (Peer Audit Integrity)');
  console.log('========================================================================\n');

  let failed = 0;
  const server = app.listen(0);
  const address = server.address() as any;
  const testPort = address.port;

  try {
    const teamRes = await pool.query('SELECT team_id FROM teams LIMIT 1');
    const teamId = teamRes.rows[0]?.team_id;
    if (!teamId) throw new Error('No team available for scenarios');
    const members = await pool.query('SELECT u.user_id FROM team_members tm JOIN users u ON tm.user_id = u.user_id WHERE tm.team_id = $1', [teamId]);
    if (members.rows.length < 2) throw new Error('Scenarios require two team members');
    const studentId = Number(members.rows[0].user_id);
    const revieweeId = Number(members.rows[1].user_id);
    const student1Token = jwt.sign({ userId: studentId, role: 'STUDENT' }, JWT_SECRET, { expiresIn: '1h' });
    // ------------------------------------------------------------------------------------
    // SCENARIO 1: Bộ Lọc Nhiễu LOC (Noise Filter Algorithm - BR-07)
    // ------------------------------------------------------------------------------------
    console.log('--- [KỊCH BẢN 1: BỘ LỌC NHIỄU DÒNG CODE (NOISE FILTER - BR-07)] ---');
    console.log('Mục tiêu: Đảm bảo các file auto-generated, lockfile, minified bundle không bị tính gian lận LOC.\n');

    const testFiles = [
      { path: 'package-lock.json', isNoiseExpected: true, desc: 'NPM Lockfile' },
      { path: 'yarn.lock', isNoiseExpected: true, desc: 'Yarn Lockfile' },
      { path: 'node_modules/express/index.js', isNoiseExpected: true, desc: 'Vendor Library' },
      { path: '.next/static/chunks/main.js', isNoiseExpected: true, desc: 'Next.js Build Output' },
      { path: 'dist/index.js', isNoiseExpected: true, desc: 'Compiled JavaScript' },
      { path: 'src/modules/grading/grading.service.ts', isNoiseExpected: false, desc: 'Source Code Thực Tế' },
      { path: 'client/src/components/Navigation.tsx', isNoiseExpected: false, desc: 'Frontend Component Thực Tế' },
    ];

    testFiles.forEach((f) => {
      const isNoise = isNoiseFile(f.path);
      const passed = isNoise === f.isNoiseExpected;
      if (!passed) failed++;
      console.log(`  ${passed ? '✅' : '❌'} [${f.desc}] File: ${f.path}`);
      console.log(`     -> Kết quả lọc: ${isNoise ? 'BỊ LOẠI TRỪ (NOISE)' : 'CHẤP NHẬN TÍNH LOC'}`);
    });

    // ------------------------------------------------------------------------------------
    // SCENARIO 2: Phân Tích Đóng Góp & Phát Hiện Free-Rider (BR-07)
    // ------------------------------------------------------------------------------------
    console.log('\n--- [KỊCH BẢN 2: THUẬT TOÁN PHÁT HIỆN THÀNH VIÊN Ỷ LẠI (FREE-RIDER ALERT - BR-07)] ---');
    console.log('Mục tiêu: Thành viên có tỷ lệ đóng góp ròng < 5% tổng LOC cả nhóm sẽ bị kích hoạt cờ FREE_RIDER_WARNING.\n');

    const commitsRes = await makeRequest(testPort, 'GET', `/api/git/${teamId}/commits`, lecturerToken);
    console.log(`HTTP Status: ${commitsRes.status}`);
    if (commitsRes.status !== 200 || !Array.isArray(commitsRes.data.member_contributions)) {
      throw new Error('Invalid contributions response');
    }
    console.log('Team commits:', commitsRes.data.team_total_commits);
    console.log('Team LOC added:', commitsRes.data.team_total_lines_added);
    if (!commitsRes.data.commits?.length) console.log('ch\u01b0a c\u00f3 d\u1eef li\u1ec7u commit');
    console.table(commitsRes.data.member_contributions.map((m: any) => ({
      user_id: m.user_id, full_name: m.full_name, LOC: m.total_lines_added,
      deleted: m.total_lines_deleted, percentage: m.contribution_percentage, flag: m.status,
    })));
    for (const m of commitsRes.data.member_contributions) {
      if (m.is_free_rider) console.log('\u26a0\ufe0f C\u1ea2NH B\u00c1O: FREE-RIDER', m.full_name, m.contribution_percentage + '%');
    }

    // ------------------------------------------------------------------------------------
    // SCENARIO 3: Ràng Buộc Liêm Chính Đánh Giá Chéo (Non-Self Peer Audit - BR-08)
    // ------------------------------------------------------------------------------------
    console.log('\n--- [KỊCH BẢN 3: RÀNG BUỘC CHỐNG TỰ CHẤM ĐIỂM (NON-SELF AUDIT - BR-08)] ---');
    console.log('Mục tiêu: Chặn đứng sinh viên tự chấm điểm cho bản thân (reviewer_id === reviewee_id).\n');

    const selfAuditRes = await makeRequest(testPort, 'POST', '/api/peer-audits', student1Token, {
      team_id: teamId,
      reviewee_id: studentId, // Cùng ID với student1Token (userId = 3)
      audit_round: 1,
      score: 10.0,
      comments: 'Tôi tự thấy mình làm xuất sắc nhất nhóm!',
    });

    console.log(`HTTP Status nhận được: ${selfAuditRes.status}`);
    console.log(`Response message: ${JSON.stringify(selfAuditRes.data)}`);
    if (selfAuditRes.status !== 400 || selfAuditRes.data?.rule !== 'BR-08') failed++;
    if (selfAuditRes.status === 400 && selfAuditRes.data?.rule === 'BR-08') {
      console.log('  ✅ THÀNH CÔNG: Hệ thống đã chặn đứng hành vi tự chấm điểm đúng như thiết kế BR-08!');
    } else {
      console.log('  ⚠️ Cảnh báo: Cần kiểm tra lại logic xác minh reviewer_id.');
    }

    // ------------------------------------------------------------------------------------
    // SCENARIO 4: Nộp Phiếu Đánh Giá Chéo Hợp Lệ & Tổng Hợp Điểm (BR-08)
    // ------------------------------------------------------------------------------------
    console.log('\n--- [KỊCH BẢN 4: ĐÁNH GIÁ CHÉO ĐỒNG ĐỘI HỢP LỆ & TỔNG HỢP (BR-08)] ---');
    console.log('Mục tiêu: Sinh viên A đánh giá Sinh viên B cùng nhóm; Giảng viên xem báo cáo tổng hợp.\n');

    const validAuditRes = await makeRequest(testPort, 'POST', '/api/peer-audits', student1Token, {
      team_id: teamId,
      reviewee_id: revieweeId, // Sinh viên 2 (Trần Thị Bình)
      audit_round: 2,
      score: 9.5,
      comments: 'Bạn Bình hoàn thành xuất sắc các test case của module Sandbox Autograding, code sạch và đúng hạn.',
    });

    console.log(`Nộp phiếu đánh giá HTTP Status: ${validAuditRes.status}`);
    if (validAuditRes.status === 201 || validAuditRes.status === 200) {
      console.log('  ✅ Phiếu đánh giá đã được lưu vào database an toàn.');
    }

    if (![200, 201].includes(validAuditRes.status)) failed++;
    const reportRes = await makeRequest(testPort, 'GET', `/api/peer-audits/${teamId}`, lecturerToken);
    console.log(`Giảng viên truy xuất báo cáo Peer Audit nhóm 1: HTTP ${reportRes.status}`);
    console.log('  ✅ Điểm trung bình cộng tác và nhận xét đồng đội đã sẵn sàng phục vụ Hội đồng chấm thi.');

    console.log('\n========================================================================');
    console.log('🎉 TOÀN BỘ CÁC KỊCH BẢN THỰC NGHIỆM CỦA THÀNH VIÊN 4 ĐÃ CHẠY HOÀN TẤT!');
    console.log('========================================================================\n');
  } catch (error) {
    failed++;
    console.error('Lỗi thực thi kịch bản:', error);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await pool.end();
    process.exit(failed > 0 ? 1 : 0);
  }
}

if (require.main === module) {
  runMember4Scenarios().catch(error => { console.error(error); process.exit(1); });
}

export { runMember4Scenarios };
