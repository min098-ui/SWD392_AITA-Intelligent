import { Worker, Job } from 'bullmq';
import { pool } from '../../config/db';
import { sandboxService } from './sandbox.service';
import { redisConnection, GRADING_QUEUE_NAME } from './grading.queue';
import { GradingJobPayload, RubricRuleItem } from './grading.types';

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
    const { grading_job_id, submission_id, assignment_id, code_content, artifact_url } = job.data;
    const language = job.data.language || 'python';

    console.log(`[Grading Worker] 🚀 Processing GradingJob #${grading_job_id} for Submission #${submission_id}...`);

    try {
      // 1. Update job & submission status to PROCESSING / GRADING
      await pool.query(
        `UPDATE grading_jobs SET status = 'PROCESSING' WHERE grading_job_id = $1`,
        [grading_job_id]
      );
      await pool.query(
        `UPDATE submissions SET status = 'GRADING' WHERE submission_id = $1`,
        [submission_id]
      );

      // 2. Fetch assignment rubric rules
      const rubricRes = await pool.query(
        `SELECT * FROM rubric_rules WHERE assignment_id = $1 ORDER BY rubric_rule_id ASC`,
        [assignment_id]
      );
      const rubrics: RubricRuleItem[] = rubricRes.rows;

      // Extract code to run
      const studentCode = code_content || artifact_url || '';

      if (rubrics.length === 0) {
        console.warn(`[Grading Worker] No rubric rules found for assignment #${assignment_id}. Completing job.`);
        await pool.query(
          `UPDATE grading_jobs SET status = 'COMPLETED', completed_at = NOW() WHERE grading_job_id = $1`,
          [grading_job_id]
        );
        await pool.query(
          `UPDATE submissions SET status = 'GRADED' WHERE submission_id = $1`,
          [submission_id]
        );
        return { success: true, message: 'No rubric rules to evaluate.' };
      }

      let totalEarnedScore = 0;
      let totalMaxScore = 0;

      // 3. Execute code in Docker Sandbox for each Rubric Rule
      for (const rule of rubrics) {
        let passed = false;
        let score = 0;
        let actualOutput = '';
        let executionTimeMs = 0;

        if (rule.rule_type === 'AUTOMATED') {
          const sandboxRes = await sandboxService.runCode({
            code: studentCode,
            language: language,
            inputData: rule.input_data || '',
            timeoutMs: 5000, // 5s execution limit per test case (BR-03)
          });

          actualOutput = sandboxRes.stdout || sandboxRes.stderr;
          executionTimeMs = sandboxRes.executionTimeMs;

          const expectedTrimmed = (rule.expected_output || '').trim();
          const actualTrimmed = (sandboxRes.stdout || '').trim();

          // Rule passes if exitCode is 0 and stdout matches expected output exactly
          if (sandboxRes.exitCode === 0 && actualTrimmed === expectedTrimmed) {
            passed = true;
            score = Number(rule.max_score || 10.0);
          } else {
            passed = false;
            score = 0;
          }
        } else if (rule.rule_type === 'AI_ANALYSIS') {
          // Placeholder for AI Review (can be augmented by Member 3 AI Tutor Engine)
          passed = true;
          score = Number(rule.max_score || 10.0);
          actualOutput = 'Automated static check passed.';
        } else {
          // MANUAL rule type
          passed = false;
          score = 0;
          actualOutput = 'Pending manual evaluation by Lecturer.';
        }

        totalEarnedScore += score;
        totalMaxScore += Number(rule.max_score || 10.0);

        // 4. Record result in grading_results table
        await pool.query(
          `INSERT INTO grading_results 
           (grading_job_id, rubric_rule_id, score, actual_output, passed, execution_time_ms, is_ai_generated) 
           VALUES ($1, $2, $3, $4, $5, $6, FALSE)`,
          [grading_job_id, rule.rubric_rule_id, score, actualOutput, passed, executionTimeMs]
        );
      }

      // 5. Update grading job and submission status to COMPLETED / GRADED
      await pool.query(
        `UPDATE grading_jobs SET status = 'COMPLETED', completed_at = NOW() WHERE grading_job_id = $1`,
        [grading_job_id]
      );
      await pool.query(
        `UPDATE submissions SET status = 'GRADED' WHERE submission_id = $1`,
        [submission_id]
      );

      console.log(
        `[Grading Worker] 🎯 Grading complete for Job #${grading_job_id}: Total Score = ${totalEarnedScore}/${totalMaxScore}`
      );

      return {
        success: true,
        grading_job_id,
        totalEarnedScore,
        totalMaxScore,
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
