-- Migration: Direct Code Submission Support
-- Adds code_content and language to submissions, makes Git fields optional, and adds status to grading_results

DO $$ 
BEGIN
    -- 1. Add code_content column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'code_content'
    ) THEN
        ALTER TABLE submissions ADD COLUMN code_content TEXT;
    END IF;

    -- 2. Add language column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'language'
    ) THEN
        ALTER TABLE submissions ADD COLUMN language VARCHAR(20) DEFAULT 'javascript' CHECK (language IN ('python', 'javascript', 'nodejs'));
    END IF;

    -- 3. Make artifact_url and git_commit_hash NULLABLE (previously NOT NULL)
    ALTER TABLE submissions ALTER COLUMN artifact_url DROP NOT NULL;
    ALTER TABLE submissions ALTER COLUMN git_commit_hash DROP NOT NULL;

    -- 4. Add status column to grading_results if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grading_results' AND column_name = 'status'
    ) THEN
        ALTER TABLE grading_results ADD COLUMN status VARCHAR(50) DEFAULT 'Accepted';
    END IF;

    -- 5. Set defaults for legacy / existing records
    UPDATE submissions SET language = 'javascript' WHERE language IS NULL;

END $$;
