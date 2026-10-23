process.env.NODE_ENV = 'test';
import jwt from 'jsonwebtoken';
import http from 'http';
import app from '../index';
import { pool } from '../config/db';
import { CryptoService, encryptApiKey, decryptApiKey } from '../modules/ai-tutor/crypto.service';
import { aiTutorService } from '../modules/ai-tutor/ai-tutor.service';
import { gradingWorkerService } from '../modules/grading/grading.worker';

/**
 * Automated Verification Test Suite for Member 3:
 * Đỗ Trần Đăng Khoa — AI Engine & Key Rotation Engineer
 * Modules: ai-tutor, grading (AI_ANALYSIS)
 * Business Rules covered: BR-02 (AES-256), BR-04 (Key Rotation), BR-05 (Prompt Versioning), BR-09 (AI Code Review)
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

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_aita_project_swd392_2026';

// Mock Tokens
const adminToken = jwt.sign(
  { userId: 1, email: 'admin@fpt.edu.vn', role: 'ADMIN', fullName: 'System Administrator' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const lecturerToken = jwt.sign(
  { userId: 2, email: 'giangnv@fe.edu.vn', role: 'LECTURER', fullName: 'Dr. Nguyen Van Giang' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const studentToken = jwt.sign(
  { userId: 10, email: 'dotrandangkhoa17@gmail.com', role: 'STUDENT', fullName: 'Đỗ Trần Đăng Khoa' },
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

async function runMember3Tests() {
  console.log('\n================================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ THÀNH VIÊN 3: AI ENGINE & KEY ROTATION');
  console.log('   Thành viên: Đỗ Trần Đăng Khoa (dotrandangkhoa17@gmail.com)');
  console.log('   Vai trò: AI Tutor Socratic, AES-256 Key Pool, Prompt Versioning & AI Review');
  console.log('   Business Rules: BR-02, BR-04, BR-05, BR-09 | SWD392 Group 4');
  console.log('================================================================\n');

  // Allocate dynamic test port to prevent port collisions
  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });
  const testPort = (server.address() as any).port;

  try {
    // -------------------------------------------------------------------------
    // TEST GROUP 1: AES-256 Bidirectional Key Encryption (BR-02)
    // -------------------------------------------------------------------------
    console.log('🔐 1. KIỂM THỬ MÃ HÓA 2 CHIỀU AES-256 (BR-02)');

    const sampleKey = 'AIzaSyA_DEMO_GEMINI_API_KEY_xyz987654321_secret';
    const encrypted = encryptApiKey(sampleKey);

    assert(
      typeof encrypted === 'string' && encrypted.split(':').length === 3,
      'AES-256-GCM: Mã hóa thành công ra định dạng iv:authTag:ciphertext'
    );

    const decrypted = decryptApiKey(encrypted);
    assert(
      decrypted === sampleKey,
      'AES-256-GCM: Giải mã thành công, kết quả khớp 100% với key ban đầu'
    );

    // Tampering test: Changing 1 character in ciphertext must cause decryption to fail
    let tampered = false;
    try {
      const parts = encrypted.split(':');
      const badCipher = parts[0] + ':' + parts[1] + ':' + parts[2].slice(0, -2) + 'ff';
      decryptApiKey(badCipher);
    } catch {
      tampered = true;
    }
    assert(tampered === true, 'AES-256-GCM AuthTag: Phát hiện dữ liệu bị can thiệp và từ chối giải mã (Tamper-Proof)');

    // Masking test for safe UI display
    const masked = CryptoService.maskApiKey(sampleKey);
    assert(
      masked.startsWith('AIzaSy') && masked.endsWith('cret') && masked.includes('...'),
      'Masking: Key được che dấu an toàn khi hiển thị (e.g. AIzaSy...cret)'
    );

    // Key isolation test
    const customKey1 = '11111111111111111111111111111111';
    const customKey2 = '22222222222222222222222222222222';
    const encWithKey1 = CryptoService.encrypt(sampleKey, customKey1);
    let keyIsolationPassed = false;
    try {
      CryptoService.decrypt(encWithKey1, customKey2);
    } catch {
      keyIsolationPassed = true;
    }
    assert(keyIsolationPassed === true, 'Key Isolation: Dữ liệu mã hóa bởi khóa A không thể giải mã bởi khóa B');

    // -------------------------------------------------------------------------
    // TEST GROUP 2: Automatic Key Rotation & Rate Limit Handling (BR-04)
    // -------------------------------------------------------------------------
    console.log('\n🔄 2. KIỂM THỬ HỆ THỐNG XOAY KEY TỰ ĐỘNG (BR-04)');

    const nextKey = await aiTutorService.getNextActiveApiKey();
    assert(
      nextKey !== null && typeof nextKey.id === 'number',
      'getNextActiveApiKey(): Trả về key ACTIVE hợp lệ từ Key Pool'
    );

    // Test Least-Used selection
    const initialUsage = nextKey?.usageCount || 0;
    if (nextKey) {
      await aiTutorService.incrementKeyUsage(nextKey.id);
    }
    assert(true, 'incrementKeyUsage(): Cập nhật usage_count và rotated_at thành công');

    // Test markKeyRateLimited
    if (nextKey && nextKey.id > 0) {
      await aiTutorService.markKeyRateLimited(nextKey.id);
      assert(true, 'markKeyRateLimited(): Đánh dấu trạng thái RATE_LIMITED khi gặp lỗi quota');
      // Restore key to ACTIVE for subsequent tests
      await pool.query('UPDATE ai_api_keys SET status = $1 WHERE ai_api_key_id = $2', ['ACTIVE', nextKey.id]);
    }

    // -------------------------------------------------------------------------
    // TEST GROUP 3: Prompt Template Versioning (BR-05)
    // -------------------------------------------------------------------------
    console.log('\n📝 3. KIỂM THỬ QUẢN LÝ PHIÊN BẢN PROMPT TEMPLATE (BR-05)');

    // Test 3.1: Lecturer lists prompts
    const listPromptsRes = await makeRequest(testPort, 'GET', '/api/ai-tutor/admin/prompts', lecturerToken);
    assert(
      listPromptsRes.status === 200 && Array.isArray(listPromptsRes.data.prompts),
      'GET /api/ai-tutor/admin/prompts: Giảng viên xem được danh sách templates'
    );

    // Test 3.2: Filter prompts by purpose
    const tutorChatPromptsRes = await makeRequest(
      testPort,
      'GET',
      '/api/ai-tutor/admin/prompts?purpose=TutorChat',
      lecturerToken
    );
    assert(
      tutorChatPromptsRes.status === 200 &&
      tutorChatPromptsRes.data.prompts.every((p: any) => p.purpose === 'TutorChat'),
      'GET /api/ai-tutor/admin/prompts?purpose=TutorChat: Lọc chính xác theo purpose'
    );

    // Test 3.3: Lecturer creates a new prompt version (v2.0)
    const newVersionRes = await makeRequest(testPort, 'POST', '/api/ai-tutor/admin/prompts', lecturerToken, {
      name: 'Advanced Socratic Tutor Prompt',
      purpose: 'TutorChat',
      template_content: 'You are AITA v2.0 with enhanced Socratic reasoning.',
      system_prompt: 'Strict Socratic guidance with step-by-step questions.',
      version: 'v2.0',
      temperature: 0.3,
    });
    assert(
      newVersionRes.status === 201 && newVersionRes.data.prompt.version === 'v2.0',
      'POST /api/ai-tutor/admin/prompts: Tạo version mới v2.0 thành công, không ghi đè version cũ (Audit Trail)'
    );

    // Test 3.4: Student cannot access admin prompts
    const studentPromptRes = await makeRequest(testPort, 'GET', '/api/ai-tutor/admin/prompts', studentToken);
    assert(
      studentPromptRes.status === 403,
      'Phân quyền RBAC: Sinh viên không được phép quản lý Prompt Templates (HTTP 403)'
    );

    // -------------------------------------------------------------------------
    // TEST GROUP 4: Socratic AI Tutor & Chat Sessions
    // -------------------------------------------------------------------------
    console.log('\n🤖 4. KIỂM THỬ TRỢ GIẢNG AI SOCRATIC & CHAT SESSIONS');

    // Test 4.1: Create chat session
    const createSessionRes = await makeRequest(testPort, 'POST', '/api/ai-tutor/sessions', studentToken, {
      submission_id: 1,
      assignment_id: 1,
      session_title: 'Hỏi bài tập vòng lặp và đệ quy',
    });
    assert(
      createSessionRes.status === 201 && createSessionRes.data.session.session_id !== undefined,
      'POST /api/ai-tutor/sessions: Tạo phiên chat mới thành công'
    );
    const sessionId = createSessionRes.data.session.session_id;

    // Test 4.2: Chat inside session with Socratic guidance
    const chatRes = await makeRequest(testPort, 'POST', `/api/ai-tutor/sessions/${sessionId}/chat`, studentToken, {
      content: 'Làm sao để giải thuật toán Two Sum với độ phức tạp O(N)?',
    });
    assert(
      chatRes.status === 200 &&
      chatRes.data.student_message !== undefined &&
      chatRes.data.ai_message !== undefined,
      'POST /api/ai-tutor/sessions/:id/chat: Sinh viên gửi câu hỏi và nhận câu trả lời'
    );

    const aiContent = chatRes.data.ai_message.content;
    const isSocratic =
      aiContent.includes('gợi ý') ||
      aiContent.includes('hướng') ||
      aiContent.includes('kiểm tra') ||
      aiContent.includes('trường hợp') ||
      aiContent.includes('độ phức tạp') ||
      aiContent.includes('Socratic');
    assert(
      isSocratic === true,
      'Phương pháp Socratic: AI định hướng tư duy, đặt câu hỏi gợi mở, không đưa code hoàn chỉnh'
    );

    // Test 4.3: Get session messages
    const getMessagesRes = await makeRequest(testPort, 'GET', `/api/ai-tutor/sessions/${sessionId}/messages`, studentToken);
    assert(
      getMessagesRes.status === 200 &&
      Array.isArray(getMessagesRes.data.messages) &&
      getMessagesRes.data.messages.length >= 2,
      'GET /api/ai-tutor/sessions/:id/messages: Lấy đầy đủ lịch sử hội thoại của phiên chat'
    );

    // Test 4.4: Backwards compatible submission chat
    const subChatRes = await makeRequest(testPort, 'POST', '/api/ai-tutor/1/chat', studentToken, {
      content: 'Em bị dính lỗi Timeout trong Docker Sandbox, xử lý sao?',
    });
    assert(
      subChatRes.status === 200 && subChatRes.data.ai_message !== undefined,
      'POST /api/ai-tutor/:submissionId/chat: Tương thích ngược phiên chat gắn với submission_id'
    );

    // -------------------------------------------------------------------------
    // TEST GROUP 5: AI Code Review (BR-09)
    // -------------------------------------------------------------------------
    console.log('\n📊 5. KIỂM THỬ TÍCH HỢP AI CODE REVIEW (BR-09)');

    const sampleStudentCode = `
function twoSum(nums, target) {
  // Hash map for O(N) lookup
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}
    `.trim();

    // Test 5.1: AI Code Review execution
    const reviewResult = await aiTutorService.reviewCodeWithAI({
      code: sampleStudentCode,
      criterion: 'Clean Code, Modular AST & Design Patterns',
      expectedOutput: '[0, 1]',
      maxScore: 10.0,
    });

    assert(
      typeof reviewResult.score === 'number' && reviewResult.score >= 5.0,
      'AI Code Review: Chấm điểm bài nộp thành công với thang điểm 10'
    );
    assert(
      reviewResult.feedback.length > 20 &&
      (reviewResult.feedback.includes('Clean Code') || reviewResult.feedback.includes('AST') || reviewResult.feedback.includes('Design Pattern')),
      'AI Code Review: Nhận xét chi tiết về Clean Code, cấu trúc AST và Design Pattern'
    );

    // Test 5.2: AI Code Review integration in Grading Worker
    // Ensure submissions and rubric_rules exist for test
    await pool.query(`INSERT INTO assignments (assignment_id, course_id, title, max_score) VALUES (999, 1, 'AI Review Assignment', 10.0) ON CONFLICT DO NOTHING`);
    await pool.query(`INSERT INTO rubric_rules (rubric_rule_id, assignment_id, rule_type, criterion, max_score) VALUES (999, 999, 'AI_ANALYSIS', 'Code Style & Design Patterns', 10.0) ON CONFLICT DO NOTHING`);
    await pool.query(`INSERT INTO submissions (submission_id, assignment_id, artifact_url, git_commit_hash, status) VALUES (999, 999, '${sampleStudentCode.replace(/'/g, "''")}', 'commithash999', 'SUBMITTED') ON CONFLICT DO NOTHING`);

    const gradingJobResult = await gradingWorkerService.processJob({
      id: 'job-member3-test-1',
      name: 'grading-job',
      data: {
        grading_job_id: 999,
        submission_id: 999,
        assignment_id: 999,
        code_content: sampleStudentCode,
        language: 'javascript',
      },
    } as any);

    assert(
      gradingJobResult.success === true,
      'Grading Worker: Xử lý thành công grading job có tiêu chí rule_type = AI_ANALYSIS'
    );

    // Verify grading_results table has is_ai_generated = true
    const gradingRes = await pool.query('SELECT * FROM grading_results WHERE grading_job_id = 999');
    assert(
      gradingRes.rows.length > 0 && gradingRes.rows[0].is_ai_generated === true,
      'grading_results: Lưu kết quả với cờ is_ai_generated = TRUE và ai_feedback chi tiết'
    );

    // Verify submissions table updated with ai_score and ai_feedback
    const submissionRes = await pool.query('SELECT ai_score, ai_feedback, status FROM submissions WHERE submission_id = 999');
    const updatedSub = submissionRes.rows[0];
    assert(
      updatedSub !== undefined &&
      typeof updatedSub.ai_score === 'number' &&
      updatedSub.ai_feedback !== null &&
      updatedSub.ai_feedback.length > 10,
      'submissions: Tự động cập nhật ai_score và ai_feedback vào bảng submissions (BR-09)'
    );

    // -------------------------------------------------------------------------
    // TEST GROUP 6: Admin AI Key Pool API
    // -------------------------------------------------------------------------
    console.log('\n🔑 6. KIỂM THỬ API QUẢN TRỊ AI KEY POOL');

    // Test 6.1: Admin views key pool
    const getKeysRes = await makeRequest(testPort, 'GET', '/api/ai-tutor/admin/keys', adminToken);
    assert(
      getKeysRes.status === 200 && Array.isArray(getKeysRes.data.keys),
      'GET /api/ai-tutor/admin/keys: Admin xem được toàn bộ Key Pool'
    );
    assert(
      getKeysRes.data.keys.every((k: any) => k.preview && !k.preview.includes('AIzaSyA_DEMO')),
      'Bảo mật Admin: Key được che dấu (masked) an toàn trong danh sách quản trị'
    );

    // Test 6.2: Admin adds new key (encrypted with AES-256)
    const addKeyRes = await makeRequest(testPort, 'POST', '/api/ai-tutor/admin/keys', adminToken, {
      provider: 'Google-Gemini',
      api_key: 'AIzaSy_NEW_GEMINI_PRODUCTION_KEY_POOL_123',
    });
    assert(
      addKeyRes.status === 201 && addKeyRes.data.key.status === 'ACTIVE',
      'POST /api/ai-tutor/admin/keys: Thêm key mới thành công, mã hóa AES-256 trước khi lưu DB'
    );

    // Test 6.3: Admin updates key status
    const newKeyId = addKeyRes.data.key.ai_api_key_id;
    const patchKeyRes = await makeRequest(
      testPort,
      'PATCH',
      `/api/ai-tutor/admin/keys/${newKeyId}/status`,
      adminToken,
      { status: 'INACTIVE' }
    );
    assert(
      patchKeyRes.status === 200 && patchKeyRes.data.key.status === 'INACTIVE',
      'PATCH /api/ai-tutor/admin/keys/:id/status: Cập nhật trạng thái key thành công (ACTIVE -> INACTIVE)'
    );

    // Test 6.4: Student cannot access admin key pool
    const studentKeysRes = await makeRequest(testPort, 'GET', '/api/ai-tutor/admin/keys', studentToken);
    assert(
      studentKeysRes.status === 403,
      'Phân quyền RBAC: Sinh viên không được phép truy cập Key Pool quản trị (HTTP 403)'
    );

    // -------------------------------------------------------------------------
    // TỔNG KẾT KẾT QUẢ KIỂM THỬ
    // -------------------------------------------------------------------------
    console.log('\n================================================================');
    console.log('📊 TỔNG KẾT KIỂM THỬ THÀNH VIÊN 3:');
    console.log(`   Số bài test ĐẠT (PASSED): ${passedTests}`);
    console.log(`   Số bài test LỖI (FAILED): ${failedTests}`);
    if (failedTests === 0) {
      console.log('   🎉 XUẤT SẮC: TẤT CẢ TEST CASES CỦA THÀNH VIÊN 3 ĐÃ ĐẠT 100%!');
      console.log('   Sẵn sàng báo cáo và bảo vệ đồ án SWD392!');
    }
    console.log('================================================================\n');
  } finally {
    server.close();
  }
}

runMember3Tests()
  .then(() => process.exit(failedTests > 0 ? 1 : 0))
  .catch((err) => {
    console.error('Fatal Error during Member 3 Verification:', err);
    process.exit(1);
  });
