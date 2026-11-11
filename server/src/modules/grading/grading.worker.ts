import { Worker, Job } from 'bullmq';
import crypto from 'crypto';
import { pool } from '../../config/db';
import { sandboxService } from './sandbox.service';
import { redisConnection, GRADING_QUEUE_NAME } from './grading.queue';
import { GradingJobPayload, RubricRuleItem, GradingStatus } from './grading.types';
import { aiTutorService } from '../ai-tutor/ai-tutor.service';

/**
 * Chuẩn hóa output theo tiêu chuẩn Online Judge:
 * - Chuẩn hóa CRLF / CR thành LF (\n).
 * - Loại bỏ khoảng trắng dư thừa ở cuối mỗi dòng (trailing whitespace).
 * - Loại bỏ các dòng trống dư thừa ở đầu và cuối toàn bộ output (trim leading & trailing empty lines).
 * - BẢO TỒN NGUYÊN VẸN các dòng trống và khoảng trắng bên trong nội dung.
 * - BẢO TỒN phân biệt hoa / thường (Case-sensitivity).
 */
export function normalizeOutput(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\\r\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/^\n+|\n+$/g, '');
}

export class GradingWorkerService {
  private worker: Worker<GradingJobPayload> | null = null;

  /**
   * Initialize BullMQ Worker
   */
  public initWorker(): void {
    if (this.worker) {
      return;
    }

    try {
      this.worker = new Worker<GradingJobPayload>(
        GRADING_QUEUE_NAME,
        async (job: Job<GradingJobPayload>) => {
          return await this.processJob(job);
        },
        {
          connection: redisConnection,
          concurrency: 3, // Concurrently process up to 3 sandbox grading jobs
        }
      );

      this.worker.on('ready', () => {
        console.log(`[BullMQ Worker] 🤖 Grading Worker is active and listening on "${GRADING_QUEUE_NAME}"`);
      });

      this.worker.on('completed', (job) => {
        console.log(`[BullMQ Worker] ✅ Job #${job.id} (GradingJob #${job.data.grading_job_id}) completed successfully.`);
      });

      this.worker.on('failed', (job, err) => {
        console.error(`[BullMQ Worker] ❌ Job #${job?.id} (GradingJob #${job?.data.grading_job_id}) failed:`, err.message);
      });
    } catch (error: any) {
      console.error('[BullMQ Worker] Failed to initialize worker:', error.message);
    }
  }

  /**
   * Process a single grading job from the queue
   */
  public async processJob(job: Job<GradingJobPayload>): Promise<any> {
    const { grading_job_id, submission_id, assignment_id } = job.data;

    console.log(`[Grading Worker] 🚀 Processing GradingJob #${grading_job_id} for Submission #${submission_id}...`);

    try {
      // 1. Fetch submission details and assignment configuration from DB
      const subRes = await pool.query(
        `SELECT s.submission_id, s.assignment_id, s.code_content, s.language, s.artifact_url, 
                a.max_score as assignment_max_score, a.title as assignment_title
         FROM submissions s
         JOIN assignments a ON s.assignment_id = a.assignment_id
         WHERE s.submission_id = $1`,
        [submission_id]
      );

      const submissionRow = subRes.rows[0];
      const rawCode = job.data.code_content || submissionRow?.code_content || job.data.artifact_url || submissionRow?.artifact_url || '';
      const studentCode = typeof rawCode === 'string' ? rawCode : '';
      const codeHash = crypto.createHash('sha256').update(studentCode).digest('hex').slice(0, 16);
      const rawLang = (job.data.language || submissionRow?.language || 'javascript').toLowerCase();
      const language: 'python' | 'javascript' | 'java' = rawLang === 'java' ? 'java' : (rawLang === 'python' ? 'python' : 'javascript');
      const assignmentMaxScore = Number(submissionRow?.assignment_max_score ?? 10.0);

      // 2. Update job & submission status to PROCESSING / GRADING
      await pool.query(
        `UPDATE grading_jobs SET status = 'PROCESSING' WHERE grading_job_id = $1`,
        [grading_job_id]
      );
      await pool.query(
        `UPDATE submissions SET status = 'GRADING' WHERE submission_id = $1`,
        [submission_id]
      );

      // 3. Fetch assignment rubric rules / test cases (Only Active & Hidden, ignore Draft & Disabled)
      const rubricRes = await pool.query(
        `SELECT * FROM rubric_rules 
         WHERE assignment_id = $1 
           AND (status IS NULL OR status IN ('Active', 'Hidden'))
         ORDER BY order_index ASC, rubric_rule_id ASC`,
        [assignment_id]
      );
      const rubrics: RubricRuleItem[] = rubricRes.rows;

      if (rubrics.length === 0) {
        console.warn(`[Grading Worker] No rubric rules / test cases found for assignment #${assignment_id}.`);
        await pool.query(
          `UPDATE grading_jobs SET status = 'FAILED', completed_at = NOW() WHERE grading_job_id = $1`,
          [grading_job_id]
        );
        await pool.query(
          `UPDATE submissions 
           SET status = 'FAILED', 
               ai_feedback = 'Không thể chấm bài: Bài tập chưa có Test Case hoặc Rubric được cấu hình.' 
           WHERE submission_id = $1`,
          [submission_id]
        );
        return { success: false, message: 'No rubric rules / test cases defined for this assignment.' };
      }

      const totalMaxScore = rubrics.reduce((sum, r) => sum + Number(r.max_score || 0), 0);
      if (totalMaxScore <= 0) {
        console.warn(`[Grading Worker] Invalid test case max_score configuration (${totalMaxScore}) for assignment #${assignment_id}.`);
        await pool.query(
          `UPDATE grading_jobs SET status = 'FAILED', completed_at = NOW() WHERE grading_job_id = $1`,
          [grading_job_id]
        );
        await pool.query(
          `UPDATE submissions 
           SET status = 'FAILED', 
               ai_feedback = 'Cấu hình điểm Test Case không hợp lệ: Tổng điểm tối đa phải lớn hơn 0.' 
           WHERE submission_id = $1`,
          [submission_id]
        );
        return { success: false, message: 'Invalid test case score configuration.' };
      }

      // Standard Online Judge output normalizer (Preserves internal whitespace & blank lines)

      let totalEarnedScore = 0;
      let hasTimeout = false;
      let hasSystemError = false;
      let passCount = 0;
      let failCount = 0;
      const testSummaries: string[] = [];
      const accumulatedAiFeedbacks: string[] = [];

      // 4. Execute code in Docker Sandbox for each Test Case (Prevent duplicate scoring)
      const evaluatedRuleIds = new Set<number>();

function extractQuestionCode(fullCode: string, ruleCriterion: string): string {
  if (!fullCode) return '';

  const qMatch = ruleCriterion.match(/Q([1-4])/i) || ruleCriterion.match(/C[âa]u\s*([1-4])/i);
  if (!qMatch) return fullCode;

  const qNum = qMatch[1]; // "1", "2", "3", "4"

  // 1. Explicit section delimiters: // ==================== QUESTION 1 ====================
  const delimiterRegex = new RegExp(
    `(?:\\/\\/\\s*={2,}\\s*(?:QUESTION|CÂU|Q)[\\s_]*${qNum}[\\s_]*={2,}|\\/\\*\\s*={2,}\\s*(?:QUESTION|CÂU|Q)[\\s_]*${qNum}[\\s_]*={2,}\\s*\\*\\/)([\\s\\S]*?)(?=(?:\\/\\/\\s*={2,}\\s*(?:QUESTION|CÂU|Q)|\\/\\*\\s*={2,}\\s*(?:QUESTION|CÂU|Q)|$))`,
    'i'
  );
  const match = fullCode.match(delimiterRegex);
  if (match && match[1] && match[1].trim().length > 0) {
    return match[1].trim();
  }

  // 2. Content heuristics if single file or partial submission
  if (qNum === '2' && (fullCode.includes('class Car') || fullCode.includes('class SpecCar'))) {
    return fullCode;
  }
  if (qNum === '3' && (fullCode.includes('MyList') || fullCode.includes('class Node'))) {
    return fullCode;
  }

  return fullCode;
}

      for (const rule of rubrics) {
        if (evaluatedRuleIds.has(rule.rubric_rule_id)) {
          console.warn(`[Grading Worker] Skipping duplicate rubric rule #${rule.rubric_rule_id}`);
          continue;
        }
        evaluatedRuleIds.add(rule.rubric_rule_id);

        let passed = false;
        let score = 0;
        let actualOutput = '';
        let executionTimeMs = 0;
        let ruleAiFeedback = '';
        let isAiGenerated = false;
        let testStatus: GradingStatus = 'WRONG_ANSWER';
        let testContainerId: string | null = null;
        let testDockerImage: string | null = null;
        let testExitCode: number = 0;

        if (rule.rule_type === 'AUTOMATED') {
          const codeToRun = extractQuestionCode(studentCode, rule.criterion);

          const sandboxRes = await sandboxService.runCode({
            code: codeToRun,
            language: language,
            inputData: rule.input_data || '',
            timeoutMs: language === 'java' ? 15000 : 5000, // 15s for Java (JVM warm-up & compilation), 5s for others (BR-03)
          });

          actualOutput = sandboxRes.stdout || sandboxRes.stderr || '';
          executionTimeMs = sandboxRes.executionTimeMs;
          testContainerId = sandboxRes.containerId || null;
          testDockerImage = sandboxRes.dockerImage || null;
          testExitCode = sandboxRes.exitCode;

          if (sandboxRes.error === 'Docker service unavailable' || (!sandboxRes.timedOut && !sandboxRes.memoryExceeded && (sandboxRes.stderr || '').includes('Docker daemon is not reachable'))) {
            testStatus = 'SYSTEM_ERROR';
            hasSystemError = true;
            actualOutput = 'System Error: Dịch vụ Docker Sandbox hiện không khả dụng.';
            ruleAiFeedback = 'Lỗi hệ thống Docker Sandbox: Không thể khởi chạy container chấm bài.';
          } else if (sandboxRes.timedOut) {
            testStatus = 'TIME_LIMIT_EXCEEDED';
            hasTimeout = true;
            actualOutput = sandboxRes.stdout || '';
            ruleAiFeedback = '[BR-03] Quá thời gian thực thi (Time Limit Exceeded: 5000ms). Container đã bị ngắt an toàn.';
          } else if (sandboxRes.memoryExceeded) {
            testStatus = 'MEMORY_LIMIT_EXCEEDED';
            actualOutput = sandboxRes.stdout || '';
            ruleAiFeedback = 'Vượt quá giới hạn bộ nhớ (Memory Limit: 256MB Exceeded).';
          } else if (sandboxRes.error === 'COMPILATION_ERROR' || (sandboxRes.exitCode !== 0 && ((sandboxRes.stderr || '').includes('error:') || (sandboxRes.stderr || '').includes('javac')))) {
            testStatus = 'COMPILATION_ERROR';
            actualOutput = (sandboxRes.stderr || sandboxRes.stdout || 'Compilation error occurred').trim();
            ruleAiFeedback = `Lỗi biên dịch (Compilation Error): ${(sandboxRes.stderr || '').trim()}`;
          } else if (sandboxRes.exitCode !== 0) {
            testStatus = 'RUNTIME_ERROR';
            actualOutput = (sandboxRes.stderr || sandboxRes.stdout || 'Runtime error occurred').trim();
            ruleAiFeedback = `Runtime Error (Exit Code ${sandboxRes.exitCode}): ${(sandboxRes.stderr || sandboxRes.error || '').trim()}`;
          } else {
            // exitCode === 0, executed cleanly. Compare outputs strictly!
            actualOutput = sandboxRes.stdout || '';
            const expectedNormalized = normalizeOutput(rule.expected_output || '');
            const actualNormalized = normalizeOutput(sandboxRes.stdout || '');

            if (actualNormalized === expectedNormalized) {
              testStatus = 'ACCEPTED';
              passed = true;
              score = Number(rule.max_score || 0);
              ruleAiFeedback = 'Test Case Passed.';
            } else {
              testStatus = 'WRONG_ANSWER';
              passed = false;
              score = 0;
              ruleAiFeedback = 'Output không khớp với Expected Output của Test Case.';
            }
          }
        } else if (rule.rule_type === 'AI_ANALYSIS') {
          // AI review provides pedagogical explanations only - score is derived deterministically
          const aiReview = await aiTutorService.reviewCodeWithAI({
            code: studentCode,
            criterion: rule.criterion,
            expectedOutput: rule.expected_output || '',
            inputData: rule.input_data || '',
            maxScore: Number(rule.max_score || 10.0),
          });

          passed = aiReview.passed;
          score = passed ? Number(rule.max_score || 0) : 0;
          actualOutput = aiReview.feedback;
          ruleAiFeedback = aiReview.feedback;
          executionTimeMs = aiReview.executionTimeMs;
          isAiGenerated = true;
          accumulatedAiFeedbacks.push(aiReview.feedback);
          testStatus = passed ? 'ACCEPTED' : 'WRONG_ANSWER';
        } else {
          // MANUAL rule type
          passed = false;
          score = 0;
          actualOutput = 'Pending manual evaluation by Lecturer.';
          testStatus = 'WRONG_ANSWER';
        }

        if (passed) {
          passCount++;
        } else {
          failCount++;
        }

        totalEarnedScore += score;
        testSummaries.push(`- ${rule.criterion || 'Test Case'}: [${testStatus}] (${score}/${rule.max_score} điểm)`);

        // Record result in grading_results table with Telemetry
        await pool.query(
          `INSERT INTO grading_results 
           (grading_job_id, rubric_rule_id, score, actual_output, passed, execution_time_ms, ai_feedback, is_ai_generated, status, container_id, docker_image, exit_code, code_hash) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [grading_job_id, rule.rubric_rule_id, score, actualOutput, passed, executionTimeMs, ruleAiFeedback || null, isAiGenerated, testStatus, testContainerId, testDockerImage, testExitCode, codeHash]
        );
      }

      // 5. Calculate Final Score according to Online Judge rules:
      // If sum of test case max scores matches assignment max score, use direct earned sum.
      // Otherwise scale proportionally: Final Score = (Tổng điểm TC đạt / Tổng điểm tối đa TC) * Điểm tối đa bài tập
      let calculatedFinalScore = 0;
      if (totalMaxScore > 0) {
        if (Math.abs(totalMaxScore - assignmentMaxScore) < 0.001) {
          calculatedFinalScore = Math.min(assignmentMaxScore, totalEarnedScore);
        } else {
          calculatedFinalScore = (totalEarnedScore / totalMaxScore) * assignmentMaxScore;
          calculatedFinalScore = Math.min(assignmentMaxScore, Math.max(0, Number(calculatedFinalScore.toFixed(2))));
        }
      }

      if (hasSystemError) {
        console.error(`[Grading Worker] System error encountered during grading job #${grading_job_id}.`);
        await pool.query(
          `UPDATE grading_jobs SET status = 'FAILED', completed_at = NOW(), total_score = 0, max_score = $1 WHERE grading_job_id = $2`,
          [assignmentMaxScore, grading_job_id]
        );
        await pool.query(
          `UPDATE submissions 
           SET status = 'FAILED', 
               ai_feedback = 'Lỗi hệ thống: Dịch vụ Docker Sandbox gặp sự cố. Bài nộp chưa được tính điểm, vui lòng thử lại sau.' 
           WHERE submission_id = $1`,
          [submission_id]
        );
        return { success: false, message: 'System Error: Sandbox service unavailable' };
      }

      // Normal execution: even if all test cases fail, status is GRADED with 0 score
      const submissionFinalStatus = 'GRADED';
      let finalAiFeedback = '';
      if (hasTimeout) {
        finalAiFeedback = `Cảnh báo BR-03: Phát hiện vòng lặp vô hạn hoặc thời gian xử lý vượt quá giới hạn 5,000ms. Watchdog đã can thiệp ngắt container an toàn.\nPassed: ${passCount}, Failed: ${failCount}\n` + testSummaries.join('\n');
      } else if (accumulatedAiFeedbacks.length > 0) {
        finalAiFeedback = accumulatedAiFeedbacks.join('\n\n---\n\n') + `\n\nPassed: ${passCount}, Failed: ${failCount}\n` + testSummaries.join('\n');
      } else {
        finalAiFeedback = `Chấm bài tự động hoàn tất (${calculatedFinalScore}/${assignmentMaxScore} điểm). Passed: ${passCount}/${rubrics.length}\n` + testSummaries.join('\n');
      }

      await pool.query(
        `UPDATE grading_jobs SET status = 'COMPLETED', completed_at = NOW(), total_score = $1, max_score = $2 WHERE grading_job_id = $3`,
        [calculatedFinalScore, assignmentMaxScore, grading_job_id]
      );

      await pool.query(
        `UPDATE submissions 
         SET status = $1, 
             ai_score = $2, 
             ai_feedback = $3, 
             final_score = $2 
         WHERE submission_id = $4`,
        [submissionFinalStatus, calculatedFinalScore, finalAiFeedback, submission_id]
      );

      console.log(
        `[Grading Worker] 🎯 Grading complete for Job #${grading_job_id}: Total Score = ${calculatedFinalScore}/${assignmentMaxScore} (${totalEarnedScore}/${totalMaxScore} TC)`
      );

      return {
        success: true,
        grading_job_id,
        totalEarnedScore,
        totalMaxScore,
        finalScore: calculatedFinalScore,
        assignmentMaxScore,
        passCount,
        failCount,
      };
    } catch (error: any) {
      console.error(`[Grading Worker] Fatal error processing Job #${grading_job_id}:`, error.message);

      // Update statuses to FAILED
      await pool.query(
        `UPDATE grading_jobs SET status = 'FAILED', retry_count = retry_count + 1 WHERE grading_job_id = $1`,
        [grading_job_id]
      ).catch(() => {});

      await pool.query(
        `UPDATE submissions SET status = 'FAILED' WHERE submission_id = $1`,
        [submission_id]
      ).catch(() => {});

      throw error;
    }
  }

  /**
   * Close BullMQ worker on server shutdown
   */
  public async closeWorker(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
  }
}

export const gradingWorkerService = new GradingWorkerService();
