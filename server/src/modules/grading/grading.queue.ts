import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { GradingJobPayload } from './grading.types';

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

export const redisConnection = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    return Math.min(times * 100, 2000);
  },
});

redisConnection.on('connect', () => {
  console.log(`[BullMQ Redis] Connected to Redis at ${REDIS_HOST}:${REDIS_PORT}`);
});

redisConnection.on('error', (err) => {
  console.warn(`[BullMQ Redis] Redis connection warning: ${err.message}`);
});

export const GRADING_QUEUE_NAME = 'grading-queue';

export const gradingQueue = new Queue<GradingJobPayload>(GRADING_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

/**
 * Add a grading job to BullMQ queue
 */
export async function addGradingJob(payload: GradingJobPayload): Promise<void> {
  try {
    const job = await gradingQueue.add(`grading-job-${payload.grading_job_id}`, payload, {
      priority: payload.priority || 1,
    });
    console.log(`[BullMQ Queue] Queued grading job #${payload.grading_job_id} for submission #${payload.submission_id} (Job ID: ${job.id})`);
  } catch (error: any) {
    console.error(`[BullMQ Queue] Error adding job #${payload.grading_job_id} to queue:`, error.message);
  }
}
