-- =============================================================================
-- AITA-INTELLIGENT Database Schema (PostgreSQL)
-- Course: SWD392 - Software Design Project (Group 4)
-- Total 14 Domain Entities matching ERD & SRS Specification
-- =============================================================================

-- 1. Users Table (Admin, Lecturer, Student)
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'LECTURER', 'STUDENT')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Courses Table
CREATE TABLE IF NOT EXISTS courses (
    course_id SERIAL PRIMARY KEY,
    course_code VARCHAR(50) NOT NULL,
    course_name VARCHAR(150) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    lecturer_id INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT
);

-- 3. Teams Table
CREATE TABLE IF NOT EXISTS teams (
    team_id SERIAL PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    course_id INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    repo_url VARCHAR(255) NOT NULL
);

-- 4. Team Members Table (Mapping students to teams & modules)
CREATE TABLE IF NOT EXISTS team_members (
    team_member_id SERIAL PRIMARY KEY,
    team_id INT NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    assigned_module VARCHAR(100) NOT NULL,
    CONSTRAINT uq_team_user UNIQUE (team_id, user_id)
);

-- 5. Prompt Templates (Versioned system prompts for AI Grading & AI Tutor)
CREATE TABLE IF NOT EXISTS prompt_templates (
    prompt_template_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    purpose VARCHAR(100) NOT NULL,
    template_content TEXT NOT NULL,
    version VARCHAR(20) NOT NULL DEFAULT 'v1.0'
);

-- 6. AI API Keys (Key Pool with rotation and encryption)
CREATE TABLE IF NOT EXISTS ai_api_keys (
    ai_api_key_id SERIAL PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    key_value_encrypted VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'RATE_LIMITED', 'EXHAUSTED')),
    usage_count INT NOT NULL DEFAULT 0,
    rotated_at TIMESTAMP WITH TIME ZONE
);

-- 7. Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
    assignment_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    max_score FLOAT NOT NULL DEFAULT 10.0
);

-- 8. Rubric Rules Table (Test cases & evaluation criteria)
CREATE TABLE IF NOT EXISTS rubric_rules (
    rubric_rule_id SERIAL PRIMARY KEY,
    assignment_id INT NOT NULL REFERENCES assignments(assignment_id) ON DELETE CASCADE,
    rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('AUTOMATED', 'MANUAL', 'AI_ANALYSIS')),
    criterion VARCHAR(255) NOT NULL,
    input_data TEXT,
    expected_output TEXT,
    weight FLOAT NOT NULL DEFAULT 1.0,
    max_score FLOAT NOT NULL DEFAULT 10.0,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE
);

-- 9. Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
    submission_id SERIAL PRIMARY KEY,
    assignment_id INT NOT NULL REFERENCES assignments(assignment_id) ON DELETE CASCADE,
    team_id INT NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    artifact_url VARCHAR(255) NOT NULL,
    git_commit_hash VARCHAR(40) NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'QUEUED', 'GRADING', 'GRADED', 'FAILED'))
);

-- 10. Grading Jobs Table (Async Queue Pipeline & Sandbox execution)
CREATE TABLE IF NOT EXISTS grading_jobs (
    grading_job_id SERIAL PRIMARY KEY,
    submission_id INT NOT NULL REFERENCES submissions(submission_id) ON DELETE CASCADE,
    prompt_template_id INT REFERENCES prompt_templates(prompt_template_id) ON DELETE SET NULL,
    ai_api_key_id INT REFERENCES ai_api_keys(ai_api_key_id) ON DELETE SET NULL,
    priority INT NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED')),
    sandbox_container_id VARCHAR(100),
    queued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 11. Grading Results Table (Per-rule test case execution & AI feedback)
CREATE TABLE IF NOT EXISTS grading_results (
    grading_result_id SERIAL PRIMARY KEY,
    grading_job_id INT NOT NULL REFERENCES grading_jobs(grading_job_id) ON DELETE CASCADE,
    rubric_rule_id INT NOT NULL REFERENCES rubric_rules(rubric_rule_id) ON DELETE CASCADE,
    score FLOAT NOT NULL DEFAULT 0.0,
    actual_output TEXT,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    execution_time_ms INT DEFAULT 0,
    ai_feedback TEXT,
    is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE
);

-- 12. Git Commits Table (Tracking member contributions & lines changed)
CREATE TABLE IF NOT EXISTS git_commits (
    commit_id SERIAL PRIMARY KEY,
    team_id INT NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    author_user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    commit_hash VARCHAR(40) NOT NULL,
    message TEXT,
    lines_added INT DEFAULT 0,
    lines_deleted INT DEFAULT 0,
    committed_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 13. Peer Audits Table (Cross-evaluation among team members)
CREATE TABLE IF NOT EXISTS peer_audits (
    audit_id SERIAL PRIMARY KEY,
    team_id INT NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    reviewer_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reviewee_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    audit_round INT NOT NULL DEFAULT 1,
    comments TEXT,
    passed BOOLEAN NOT NULL DEFAULT TRUE,
    score FLOAT NOT NULL DEFAULT 10.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_peer_not_self CHECK (reviewer_id <> reviewee_id)
);

-- 14. Tutor Chat Messages Table (Interactive AI Tutor attached to submission)
CREATE TABLE IF NOT EXISTS tutor_chat_messages (
    message_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    submission_id INT NOT NULL REFERENCES submissions(submission_id) ON DELETE CASCADE,
    prompt_template_id INT REFERENCES prompt_templates(prompt_template_id) ON DELETE SET NULL,
    ai_api_key_id INT REFERENCES ai_api_keys(ai_api_key_id) ON DELETE SET NULL,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('STUDENT', 'AI')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Query Performance & Lookups
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_team ON submissions(team_id);
CREATE INDEX IF NOT EXISTS idx_grading_jobs_status ON grading_jobs(status);
CREATE INDEX IF NOT EXISTS idx_grading_results_job ON grading_results(grading_job_id);
CREATE INDEX IF NOT EXISTS idx_git_commits_team ON git_commits(team_id);
CREATE INDEX IF NOT EXISTS idx_tutor_messages_submission ON tutor_chat_messages(submission_id);
