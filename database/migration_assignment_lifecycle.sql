-- =============================================================================
-- Migration: Assignment Lifecycle Management & Submission Policy
-- Feature: DRAFT, PUBLISHED, CLOSED, ARCHIVED states, start/due/close dates,
--          allow_late_submission, max_submissions, allow_resubmission
-- =============================================================================

-- 1. Add status column to assignments (default to 'PUBLISHED' for backwards compatibility)
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED' 
CHECK (status IN ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'));

-- 2. Add close_date (hard deadline)
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS close_date TIMESTAMPTZ;

-- 3. Add submission policies
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS allow_late_submission BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS max_submissions INT DEFAULT 5;

ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS allow_resubmission BOOLEAN NOT NULL DEFAULT TRUE;

-- 4. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_close_date ON assignments(close_date);

