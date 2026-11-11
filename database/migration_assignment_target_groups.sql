-- =============================================================================
-- Migration: Assignment Target Group Selection & Language Constraint
-- Feature: Allow lecturers to target assignments to entire course or specific teams
-- =============================================================================

-- 1. Extend assignments table with target_type and allowed_language
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS target_type VARCHAR(20) NOT NULL DEFAULT 'ALL' 
CHECK (target_type IN ('ALL', 'SPECIFIC_TEAMS'));

ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS allowed_language VARCHAR(20) NOT NULL DEFAULT 'ALL' 
CHECK (allowed_language IN ('ALL', 'python', 'javascript'));

-- 2. Create intermediate table: assignment_target_teams
CREATE TABLE IF NOT EXISTS assignment_target_teams (
    assignment_id INT NOT NULL REFERENCES assignments(assignment_id) ON DELETE CASCADE,
    team_id INT NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_assignment_target_teams PRIMARY KEY (assignment_id, team_id)
);

-- 3. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_target_teams_assignment ON assignment_target_teams(assignment_id);
CREATE INDEX IF NOT EXISTS idx_target_teams_team ON assignment_target_teams(team_id);

