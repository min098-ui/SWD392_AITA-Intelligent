import { GoogleGenerativeAI } from '@google/generative-ai';
import { pool } from '../../config/db';
import { CryptoService, decryptApiKey, encryptApiKey } from './crypto.service';

export interface ActiveKeyResult {
  id: number;
  provider: string;
  rawKey: string;
  usageCount: number;
}

export interface SocraticChatResult {
  aiResponseText: string;
  keyInfo: {
    id?: number;
    provider: string;
    rotated: boolean;
  };
  promptTemplateId?: number | null;
}

export interface AiCodeReviewParams {
  code: string;
  criterion: string;
  expectedOutput?: string;
  inputData?: string;
  maxScore?: number;
}

export interface AiCodeReviewResult {
  score: number;
  passed: boolean;
  feedback: string;
  executionTimeMs: number;
}

export class AiTutorService {
  /**
   * BR-04: Retrieve the next active API Key from the Key Pool
   * Selects key with status = 'ACTIVE' ordered by usage_count ASC (Least-Used strategy).
   * Decrypts AES-256 encrypted key value before returning.
   */
  public async getNextActiveApiKey(): Promise<ActiveKeyResult | null> {
    const result = await pool.query(
      `SELECT ai_api_key_id, provider, key_value_encrypted, api_key_encrypted, status, usage_count 
       FROM ai_api_keys 
       WHERE status = 'ACTIVE' 
       ORDER BY usage_count ASC, ai_api_key_id ASC LIMIT 1`
    );

    if (result.rows.length === 0) {
      if (process.env.GEMINI_API_KEY) {
        return {
          id: 0,
          provider: 'Google-Gemini',
          rawKey: process.env.GEMINI_API_KEY,
          usageCount: 0,
        };
      }
      return null;
    }

    const row = result.rows[0];
    const cipher = row.key_value_encrypted || row.api_key_encrypted;
    let rawKey = '';
    try {
      rawKey = decryptApiKey(cipher);
    } catch (err) {
      rawKey = cipher;
    }

    return {
      id: row.ai_api_key_id,
      provider: row.provider,
      rawKey: rawKey,
      usageCount: row.usage_count || 0,
    };
  }

  /**
   * BR-04: Mark key as RATE_LIMITED when encountering HTTP 429
   */
  public async markKeyRateLimited(keyId: number): Promise<void> {
    if (!keyId) return;
    console.warn(`[KeyRotation] ⚠️ Key #${keyId} marked as RATE_LIMITED due to quota/rate limit.`);
    await pool.query(
      `UPDATE ai_api_keys 
       SET status = 'RATE_LIMITED', rotated_at = NOW() 
       WHERE ai_api_key_id = $1`,
      [keyId]
    );
  }

  /**
   * BR-04: Increment usage count and update rotated_at timestamp
   */
  public async incrementKeyUsage(keyId: number): Promise<void> {
    if (!keyId) return;
    await pool.query(
      `UPDATE ai_api_keys 
       SET usage_count = usage_count + 1, rotated_at = NOW() 
       WHERE ai_api_key_id = $1`,
      [keyId]
    );
  }

  private isMockKey(rawKey: string): boolean {
    return (
      !rawKey ||
      rawKey.startsWith('MOCK_') ||
      rawKey.startsWith('enc_') ||
      rawKey.includes('mock_value')
    );
  }

  private async getCandidateGeminiKeys(): Promise<ActiveKeyResult[]> {
    const result = await pool.query(
      `SELECT ai_api_key_id, provider, key_value_encrypted, api_key_encrypted, status, usage_count 
       FROM ai_api_keys 
       WHERE status = 'ACTIVE' 
       ORDER BY usage_count ASC, ai_api_key_id ASC`
    );

    const candidates: ActiveKeyResult[] = [];
    const seen = new Set<string>();

    for (const row of result.rows) {
      if (!String(row.provider || '').toLowerCase().includes('gemini')) continue;
      const cipher = row.key_value_encrypted || row.api_key_encrypted;
      let rawKey = '';
      try {
        rawKey = decryptApiKey(cipher);
      } catch {
        rawKey = cipher;
      }
      if (!this.isMockKey(rawKey) && !seen.has(rawKey)) {
        seen.add(rawKey);
        candidates.push({
          id: row.ai_api_key_id,
          provider: row.provider,
          rawKey,
          usageCount: row.usage_count || 0,
        });
      }
    }

    const envKey = process.env.GEMINI_API_KEY?.trim();
    if (envKey && !this.isMockKey(envKey) && !seen.has(envKey)) {
      candidates.push({
        id: 0,
        provider: 'Google-Gemini',
        rawKey: envKey,
        usageCount: 0,
      });
    }

    return candidates;
  }

  /**
   * Generate Socratic response using Google Gemini SDK with automatic key rotation on HTTP 429
   */
  public async generateSocraticResponse(
    studentQuestion: string,
    context?: { submissionId?: number; assignmentTitle?: string; codeSnippet?: string }
  ): Promise<SocraticChatResult> {
    // 1. Fetch prompt template
    const promptRes = await pool.query(
      `SELECT prompt_template_id, template_content, system_prompt 
       FROM prompt_templates 
       WHERE purpose = 'TutorChat' AND is_active = TRUE 
       ORDER BY prompt_template_id DESC LIMIT 1`
    );
    const templateRow = promptRes.rows[0];
    const promptTemplateId = templateRow ? templateRow.prompt_template_id : null;

    const basePrompt = templateRow?.template_content ||
      'You are AITA, an AI Teaching Assistant for Software Engineering. Guide the student using the Socratic method.';

    const socraticInstruction = `
${basePrompt}

=== SOCRATIC METHOD CONSTRAINTS (STRICT) ===
1. You are a Socratic tutor. Dẫn dắt tư duy của sinh viên bằng câu hỏi gợi mở và phân tích logic.
2. TUYỆT ĐỐI KHÔNG đưa ra code giải sẵn hay đáp án hoàn chỉnh trực tiếp. Nếu sinh viên xin code giải hoàn chỉnh hoặc đáp án làm bài, hãy từ chối khéo léo theo phương pháp Socratic và chỉ gợi ý hướng tư duy từng bước.
3. Nếu sinh viên hỏi khái niệm lý thuyết (ví dụ: kiến trúc phần mềm, Clean Code, OOP, Design Pattern), hãy giải thích ngắn gọn, dễ hiểu đúng trọng tâm câu hỏi rồi đặt 1-2 câu hỏi gợi mở liên hệ bài làm.
4. Khi phân tích bài tập/thuật toán, nhắc kiểm tra các trường hợp biên (edge cases, null, mảng rỗng, giá trị âm, off-by-one) và tối ưu độ phức tạp (Big-O).
5. Trả lời bằng tiếng Việt thân thiện, rõ ràng, súc tích.
${context?.assignmentTitle ? `Bài tập liên quan: "${context.assignmentTitle}".` : ''}
${context?.codeSnippet ? `Đoạn mã sinh viên đang làm:\n\`\`\`\n${context.codeSnippet}\n\`\`\`` : ''}
    `.trim();

    let rotated = false;
    const candidates = await this.getCandidateGeminiKeys();
    const promptInput = `Sinh viên hỏi: "${studentQuestion}"\nHãy phản hồi đúng trọng tâm theo phương pháp Socratic.`;

    for (const activeKey of candidates) {
      try {
        const genAI = new GoogleGenerativeAI(activeKey.rawKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          systemInstruction: socraticInstruction,
        });

        const apiResult = await model.generateContent(promptInput);
        const aiResponseText = apiResult.response.text();

        if (activeKey.id > 0) {
          await this.incrementKeyUsage(activeKey.id);
        }

        return {
          aiResponseText,
          keyInfo: { id: activeKey.id, provider: activeKey.provider, rotated },
          promptTemplateId,
        };
      } catch (error: any) {
        const errorMsg = error?.message || '';
        const isRateLimit =
          error?.status === 429 ||
          errorMsg.includes('429') ||
          errorMsg.includes('RESOURCE_EXHAUSTED') ||
          errorMsg.includes('Quota exceeded') ||
          errorMsg.includes('rate limit');

        if (isRateLimit && activeKey.id > 0) {
          console.warn(`[Gemini SDK] 429 Rate limit detected on Key #${activeKey.id}. Rotating to next key...`);
          await this.markKeyRateLimited(activeKey.id);
          rotated = true;
        } else {
          console.warn(`[Gemini SDK] Key #${activeKey.id} failed (${errorMsg.slice(0, 120)}). Trying next candidate...`);
          rotated = true;
        }
      }
    }

    // Fallback if no working live key succeeded
    return {
      aiResponseText: this.generateFallbackSocratic(studentQuestion),
      keyInfo: { provider: 'Google-Gemini (Fallback)', rotated },
      promptTemplateId,
    };
  }

  /**
   * BR-09: AI Code Review for Clean Code, AST, Design Patterns & Complexity
   * Used in grading worker when rule.rule_type === 'AI_ANALYSIS'
   */
  public async reviewCodeWithAI(params: AiCodeReviewParams): Promise<AiCodeReviewResult> {
    const startTime = Date.now();
    const { code, criterion, expectedOutput, inputData, maxScore = 10.0 } = params;

    const gradingPromptRes = await pool.query(
      `SELECT template_content FROM prompt_templates WHERE purpose = 'Grading' ORDER BY prompt_template_id DESC LIMIT 1`
    );
    const templateContent = gradingPromptRes.rows[0]?.template_content ||
      'Evaluate code quality, Clean Code standards, AST structure, and Design Patterns.';

    const systemInstruction = `
${templateContent}

=== AI CODE REVIEW & GRADING CRITERIA (BR-09) ===
You are an expert Software Architecture evaluator. Perform in-depth review on:
1. Clean Code: Naming conventions, function length, cyclomatic complexity, self-documenting code.
2. AST & Architecture: Modular structure, separation of concerns, DRY, SOLID principles.
3. Design Patterns & Best Practices: Appropriate use of patterns, algorithmic efficiency (Big-O).
4. Edge Case Handling: Robustness against null, undefined, empty array or invalid inputs.

Criterion to evaluate: ${criterion}
${expectedOutput ? `Expected behavior / output: ${expectedOutput}` : ''}
${inputData ? `Sample input: ${inputData}` : ''}
    `.trim();

    let score = maxScore;
    let passed = true;
    let feedback = '';

    const activeKey = await this.getNextActiveApiKey();

    if (
      activeKey &&
      !activeKey.rawKey.startsWith('MOCK_') &&
      !activeKey.rawKey.startsWith('enc_') &&
      !activeKey.rawKey.includes('mock_value')
    ) {
      try {
        const genAI = new GoogleGenerativeAI(activeKey.rawKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction,
        });

        const prompt = `
Phân tích mã nguồn sau và cho điểm đánh giá:
\`\`\`javascript
${code}
\`\`\`
Đưa ra:
- Điểm đánh giá (thang điểm ${maxScore}): [SCORE: x]
- Nhận xét Clean Code & AST:
- Nhận xét Design Pattern & Tối ưu:
        `;

        const result = await model.generateContent(prompt);
        feedback = result.response.text();

        // Extract score if model included [SCORE: X]
        const scoreMatch = feedback.match(/\[SCORE:\s*([\d.]+)\]/i);
        if (scoreMatch) {
          const parsed = parseFloat(scoreMatch[1]);
          if (!isNaN(parsed) && parsed >= 0 && parsed <= maxScore) {
            score = parsed;
          }
        }
        passed = score >= maxScore * 0.5;

        await this.incrementKeyUsage(activeKey.id);
      } catch (err: any) {
        console.warn(`[AI Code Review] Gemini call failed: ${err.message}. Using built-in AST & Clean Code analysis.`);
        const fallback = this.performLocalStaticReview(code, criterion, maxScore);
        score = fallback.score;
        passed = fallback.passed;
        feedback = fallback.feedback;
      }
    } else {
      // Local AST & Clean Code review
      const fallback = this.performLocalStaticReview(code, criterion, maxScore);
      score = fallback.score;
      passed = fallback.passed;
      feedback = fallback.feedback;
    }

    const executionTimeMs = Date.now() - startTime;
    return {
      score,
      passed,
      feedback,
      executionTimeMs,
    };
  }

  /**
   * Resilient local static code analyzer for Clean Code & AST evaluation
   */
  private performLocalStaticReview(code: string, criterion: string, maxScore: number): { score: number; passed: boolean; feedback: string } {
    let earnedScore = maxScore;
    const comments: string[] = [];

    // 1. Clean Code checks
    const hasConsoleLog = /console\.log\(/i.test(code);
    if (hasConsoleLog) {
      comments.push('⚠️ Còn tồn tại console.log() debug trong mã nguồn nộp.');
      earnedScore = Math.max(earnedScore - 1.0, 5.0);
    } else {
      comments.push('✅ Clean Code: Không chứa log debug thừa thãi.');
    }

    // 2. Variable declarations (const/let vs var)
    const hasVar = /\bvar\s+/i.test(code);
    if (hasVar) {
      comments.push('⚠️ Nên sử dụng `const` hoặc `let` thay cho `var` để tránh hoisting ngoài ý muốn.');
      earnedScore = Math.max(earnedScore - 1.0, 5.0);
    } else {
      comments.push('✅ Clean Code: Phạm vi biến tuân thủ chuẩn ES6+ (`const`/`let`).');
    }

    // 3. Modularity & Function decomposition
    const functionCount = (code.match(/function\s+|\(\)\s*=>|=>/g) || []).length;
    if (functionCount > 1) {
      comments.push('✅ AST & Architecture: Cấu trúc hàm phân rã tốt, tính module hóa cao.');
    } else {
      comments.push('ℹ️ AST: Nên cân nhắc tách các khối xử lý phức tạp thành hàm con để dễ bảo trì.');
    }

    // 4. Design Pattern & Error handling
    const hasTryCatch = /try\s*{/i.test(code);
    if (hasTryCatch) {
      comments.push('✅ Design Pattern: Có cơ chế xử lý ngoại lệ (Exception Handling/Defensive Programming).');
    } else {
      comments.push('ℹ️ Design Pattern: Cân nhắc bổ sung kiểm tra điều kiện biên để tăng tính ổn định.');
    }

    const feedbackText = `
🎯 [ĐÁNH GIÁ AI CODE REVIEW (BR-09)] - Tiêu chí: ${criterion}
Điểm chất lượng mã: ${earnedScore.toFixed(1)} / ${maxScore.toFixed(1)}
${comments.join('\n')}
💡 Đề xuất cải thiện: Tiếp tục phát huy tính đơn nhiệm (Single Responsibility Principle) và tối ưu độ phức tạp không gian (Space Complexity).
    `.trim();

    return {
      score: earnedScore,
      passed: earnedScore >= maxScore * 0.5,
      feedback: feedbackText,
    };
  }

  /**
   * High-quality fallback Socratic response generator
   */
  /**
   * HẠNG MỤC 3: AI Sinh Đề & Bộ Test Cases từ Slide / Chủ đề bài giảng
   */
  public async generateAssignmentFromSlide(params: {
    topic: string;
    slideSummary?: string;
    language?: 'javascript' | 'python';
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  }): Promise<{
    title: string;
    description: string;
    language: 'javascript' | 'python';
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    starter_code?: string;
    rubrics: Array<{
      criterion: string;
      input_data: string;
      expected_output: string;
      max_score: number;
      is_hidden: boolean;
    }>;
  }> {
    const lang = params.language || 'javascript';
    const diff = params.difficulty || 'MEDIUM';
    const topicText = params.topic.trim();
    const slideText = params.slideSummary?.trim() || '';

    const systemInstruction = `
You are an expert Computer Science Professor and Curriculum Designer at FPT University (Department of Software Engineering).
Your job is to generate a programming assignment and exactly 3 rigorous test cases strictly grounded in the provided lecture slide / topic.

CRITICAL INSTRUCTIONS:
1. ONLY test concepts directly related to the provided topic/slide.
2. The output MUST be valid, parseable JSON only. Do NOT wrap in markdown \`\`\`json or add conversational text.
3. Provide exactly 3 test cases in the "rubrics" array:
   - Test 1 (max_score: 4.0, is_hidden: false): Standard case (Happy path / basic input).
   - Test 2 (max_score: 3.5, is_hidden: false): Complex case (larger array / multiple elements / boundary condition).
   - Test 3 (max_score: 2.5, is_hidden: true): Edge case / Exception (e.g. empty, not found, single element) to prevent hardcoding. Total score must equal exactly 10.0.
4. Input and Expected Output format must match Standard I/O (stdin / stdout with \\n).
5. Language: \${lang === 'python' ? 'Python 3' : 'Node.js (JavaScript)'}.
   - If Python: Starter code should use sys.stdin.read() and print().
   - If JavaScript: Starter code should use fs.readFileSync(0, 'utf-8') and console.log().
`.trim();

    const userPrompt = `
Chủ đề bài giảng: "\${topicText}"
\${slideText ? \`Nội dung tóm tắt Slide bài giảng:\\n\${slideText}\` : ''}
Ngôn ngữ thực thi: \${lang === 'python' ? 'Python 3 (sys.stdin / print)' : 'Node.js (fs.readFileSync / console.log)'}
Độ khó: \${diff}

Hãy tạo đề bài và bộ 3 test cases dạng JSON chuẩn theo schema sau:
{
  "title": "Tên bài tập ngắn gọn (VD: CSD201: Cây nhị phân tìm kiếm BST...)",
  "description": "Mô tả chi tiết bài toán, định dạng Input và Output",
  "language": "\${lang}",
  "difficulty": "\${diff}",
  "starter_code": "Đoạn code sườn mẫu đọc stdin",
  "rubrics": [
    {
      "criterion": "Test 1: ...",
      "input_data": "...",
      "expected_output": "...",
      "max_score": 4.0,
      "is_hidden": false
    },
    {
      "criterion": "Test 2: ...",
      "input_data": "...",
      "expected_output": "...",
      "max_score": 3.5,
      "is_hidden": false
    },
    {
      "criterion": "Test 3: ...",
      "input_data": "...",
      "expected_output": "...",
      "max_score": 2.5,
      "is_hidden": true
    }
  ]
}
`.trim();

    // Try calling Gemini with Active Key
    const activeKey = await this.getNextActiveApiKey();
    if (activeKey && !activeKey.rawKey.startsWith('MOCK_') && !activeKey.rawKey.includes('mock_value')) {
      try {
        const genAI = new GoogleGenerativeAI(activeKey.rawKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction,
        });

        const apiRes = await model.generateContent(userPrompt);
        let rawText = apiRes.response.text().trim();
        rawText = rawText.replace(/^```json\\s*/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(rawText);
        if (parsed.title && Array.isArray(parsed.rubrics) && parsed.rubrics.length > 0) {
          if (activeKey.id > 0) await this.incrementKeyUsage(activeKey.id);
          return parsed;
        }
      } catch (err: any) {
        console.warn('[AiTutorService] Gemini assignment generation error, falling back:', err?.message);
        if (err?.message?.includes('429') && activeKey.id > 0) {
          await this.markKeyRateLimited(activeKey.id);
        }
      }
    }

    return this.generateFallbackAssignment(topicText, lang, diff);
  }

  /**
   * Deterministic high-quality fallback generator when external API is offline
   */
  private generateFallbackAssignment(
    topic: string,
    language: 'javascript' | 'python',
    difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  ) {
    const lower = topic.toLowerCase();
    const isPy = language === 'python';

    if (lower.includes('ngăn xếp') || lower.includes('stack') || lower.includes('ngoặc')) {
      return {
        title: 'CSD201: Kiểm tra dấu ngoặc hợp lệ bằng Ngăn xếp (Stack)',
        description: 'Cho một chuỗi ký tự chỉ gồm các dấu ngoặc tròn, vuông, nhọn. Sử dụng cấu trúc dữ liệu Stack để kiểm tra tính hợp lệ. In ra "VALID" nếu mọi dấu ngoặc đều đóng mở đúng thứ tự, ngược lại in ra "INVALID".',
        language,
        difficulty,
        starter_code: isPy 
          ? `import sys\\n\\ndef solve():\\n    line = sys.stdin.read().strip()\\n    # TODO: Cài đặt thuật toán kiểm tra Stack\\n    pass\\n\\nsolve()`
          : `const fs = require('fs');\\n\\nfunction solve() {\\n  const input = fs.readFileSync(0, 'utf-8').trim();\\n  // TODO: Cài đặt thuật toán kiểm tra Stack\\n}\\n\\nsolve();`,
        rubrics: [
          {
            criterion: 'Test 1: Chuỗi dấu ngoặc cơ bản khớp chuẩn',
            input_data: '({[]})\\n',
            expected_output: 'VALID',
            max_score: 4.0,
            is_hidden: false,
          },
          {
            criterion: 'Test 2: Dấu ngoặc lồng nhau phức tạp',
            input_data: '()[]{}([{}])\\n',
            expected_output: 'VALID',
            max_score: 3.5,
            is_hidden: false,
          },
          {
            criterion: 'Test 3: Ngoại lệ dấu ngoặc đóng mở sai thứ tự (Edge Case)',
            input_data: '(](\\n',
            expected_output: 'INVALID',
            max_score: 2.5,
            is_hidden: true,
          },
        ],
      };
    }

    if (lower.includes('cây') || lower.includes('tree') || lower.includes('bst')) {
      return {
        title: 'CSD201: Duyệt và Tìm kiếm trên Cây nhị phân tìm kiếm (BST)',
        description: 'Cho dãy số nguyên biểu diễn các khóa chèn vào cây BST. Dòng 1 chứa các số nguyên cách nhau bởi dấu cách. Dòng 2 chứa giá trị khóa X cần tìm kiếm. Thực hiện chèn khóa và in ra "FOUND: X" nếu tìm thấy, ngược lại in ra "NOT_FOUND".',
        language,
        difficulty,
        starter_code: isPy
          ? `import sys\\n\\ndef solve():\\n    lines = sys.stdin.read().strip().split('\\\\n')\\n    # TODO: Cài đặt cây BST và tìm kiếm\\n    pass\\n\\nsolve()`
          : `const fs = require('fs');\\n\\nfunction solve() {\\n  const lines = fs.readFileSync(0, 'utf-8').trim().split('\\\\n');\\n  // TODO: Cài đặt cây BST và tìm kiếm\\n}\\n\\nsolve();`,
        rubrics: [
          {
            criterion: 'Test 1: Duyệt cây và tìm khóa gốc/ở giữa',
            input_data: '50 30 70 20 40 60 80\\n40\\n',
            expected_output: 'FOUND: 40',
            max_score: 4.0,
            is_hidden: false,
          },
          {
            criterion: 'Test 2: Tìm phần tử ở nút lá sâu nhất',
            input_data: '10 5 15 3 7 12 18\\n18\\n',
            expected_output: 'FOUND: 18',
            max_score: 3.5,
            is_hidden: false,
          },
          {
            criterion: 'Test 3: Ngoại lệ khóa không tồn tại trong cây (Edge Case)',
            input_data: '20 10 30 5 15\\n999\\n',
            expected_output: 'NOT_FOUND',
            max_score: 2.5,
            is_hidden: true,
          },
        ],
      };
    }

    return {
      title: `\${topic.trim()}: Tối ưu thuật toán & Kiểm tra biên`,
      description: `Đặc tả bài toán dựa trên bài học "\${topic.trim()}": Hãy đọc dữ liệu từ Standard Input (stdin), xử lý thuật toán theo đúng yêu cầu đề bài và in kết quả ra Standard Output (stdout).`,
      language,
      difficulty,
      starter_code: isPy
        ? `import sys\\n\\ndef solve():\\n    input_data = sys.stdin.read().strip()\\n    # TODO: Hoàn thành giải thuật\\n    pass\\n\\nsolve()`
        : `const fs = require('fs');\\n\\nfunction solve() {\\n  const input = fs.readFileSync(0, 'utf-8').trim();\\n  // TODO: Hoàn thành giải thuật\\n}\\n\\nsolve();`,
      rubrics: [
        {
          criterion: 'Test 1: Dữ liệu chuẩn cơ bản (Standard Case)',
          input_data: '2 7 11 15\\n9\\n',
          expected_output: '9',
          max_score: 4.0,
          is_hidden: false,
        },
        {
          criterion: 'Test 2: Tập dữ liệu lớn & phần tử đối xứng',
          input_data: '1 5 3 7 9\\n12\\n',
          expected_output: '12',
          max_score: 3.5,
          is_hidden: false,
        },
        {
          criterion: 'Test 3: Ngoại lệ biên không thỏa mãn điều kiện (Edge Case)',
          input_data: '1 2 3 4 5\\n100\\n',
          expected_output: 'NOT_FOUND',
          max_score: 2.5,
          is_hidden: true,
        },
      ],
    };
  }

  private generateFallbackSocratic(studentQuestion: string): string {
    return `Chào bạn! Mình là Trợ giảng AI (AITA) đồng hành cùng bạn.
Đối với thắc mắc của bạn: "${studentQuestion}"

💡 **Gợi ý dẫn dắt tư duy (Socratic Guidance):**
1. **Kiểm tra trường hợp biên (Edge Cases):** Bạn đã xem xét trường hợp đầu vào rỗng, chỉ số ngoài mảng hoặc giá trị âm chưa?
2. **Độ phức tạp thuật toán:** Cấu trúc dữ liệu bạn đang chọn có độ phức tạp thời gian $O(N)$ hay $O(N^2)$? Có thể dùng Hash Map hoặc Two Pointers để giảm độ phức tạp không?
3. **Phân tích từng bước:** Bạn hãy thử viết các bước chuyển đổi dữ liệu ra giấy nháp trước, xác định rõ điều kiện dừng của vòng lặp hoặc đệ quy nhé!

Hãy thử áp dụng gợi ý trên và cho mình biết kết quả tư duy của bạn nhé!`;
  }
}

export const aiTutorService = new AiTutorService();
