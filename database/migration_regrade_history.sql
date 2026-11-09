-- =============================================================================
-- Migration: Regrade & Grading History Enhancement (AITA-INTELLIGENT)
-- Adds columns to track grading attempts, reasons, and summary scores
-- =============================================================================

ALTER TABLE grading_jobs 
    ADD COLUMN IF NOT EXISTS attempt_number INT DEFAULT 1,
    ADD COLUMN IF NOT EXISTS regrade_reason TEXT,
    ADD COLUMN IF NOT EXISTS triggered_by_user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS total_score FLOAT,
    ADD COLUMN IF NOT EXISTS max_score FLOAT;

-- Index for fast lookup of attempts per submission
CREATE INDEX IF NOT EXISTS idx_grading_jobs_submission_attempt 
    ON grading_jobs(submission_id, attempt_number DESC);

-- Index for quick lookup of active jobs to prevent duplicate queueing
CREATE INDEX IF NOT EXISTS idx_grading_jobs_active 
    ON grading_jobs(submission_id, status) 
    WHERE status IN ('QUEUED', 'PROCESSING');

