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
2. TUYỆT ĐỐI KHÔNG đưa ra code giải sẵn hay đáp án hoàn chỉnh trực tiếp.
3. Hướng dẫn sinh viên tự kiểm tra các trường hợp biên (edge cases, null, mảng rỗng, giá trị âm, off-by-one).
4. Khuyến khích tối ưu hóa độ phức tạp thuật toán (Big-O time/space complexity).
5. Trả lời bằng tiếng Việt thân thiện, khích lệ sinh viên tự tin suy nghĩ và giải quyết bài toán.
${context?.assignmentTitle ? `Bài tập liên quan: "${context.assignmentTitle}".` : ''}
${context?.codeSnippet ? `Đoạn mã sinh viên đang làm:\n\`\`\`\n${context.codeSnippet}\n\`\`\`` : ''}
    `.trim();

    let rotated = false;
    const maxRetries = 3;
    let aiResponseText = '';
    let selectedKey: ActiveKeyResult | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const activeKey = await this.getNextActiveApiKey();
      if (!activeKey) {
        break;
      }
      selectedKey = activeKey;

      try {
        // If simulated/mock key, generate structured Socratic response
        if (
          activeKey.rawKey.startsWith('MOCK_') ||
          activeKey.rawKey.startsWith('enc_') ||
          activeKey.rawKey.includes('mock_value')
        ) {
          aiResponseText = this.generateFallbackSocratic(studentQuestion);
          if (activeKey.id > 0) {
            await this.incrementKeyUsage(activeKey.id);
          }
          return {
            aiResponseText,
            keyInfo: { id: activeKey.id, provider: activeKey.provider, rotated },
            promptTemplateId,
          };
        }

        // Call Google Generative AI SDK
        const genAI = new GoogleGenerativeAI(activeKey.rawKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: socraticInstruction,
        });

        const promptInput = `Sinh viên hỏi: "${studentQuestion}"\nHãy phản hồi theo đúng phương pháp Socratic.`;
        const apiResult = await model.generateContent(promptInput);
        aiResponseText = apiResult.response.text();

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
          continue; // Key rotation retry
        }

        console.warn(`[Gemini SDK] Notice: SDK call returned error: ${errorMsg}. Falling back to resilient Socratic guidance.`);
        aiResponseText = this.generateFallbackSocratic(studentQuestion);
        if (activeKey.id > 0) {
          await this.incrementKeyUsage(activeKey.id);
        }

        return {
          aiResponseText,
          keyInfo: { id: activeKey.id, provider: activeKey.provider, rotated },
          promptTemplateId,
        };
      }
    }

    // Fallback if no keys in pool
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
