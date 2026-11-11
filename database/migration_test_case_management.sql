-- Migration: Test Case Management Enhancements
-- Adds status, order_index, and description to rubric_rules

DO $$ 
BEGIN
    -- 1. Add status column to rubric_rules if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rubric_rules' AND column_name = 'status'
    ) THEN
        ALTER TABLE rubric_rules ADD COLUMN status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Draft', 'Active', 'Hidden', 'Disabled'));
    END IF;

    -- 2. Add order_index column to rubric_rules if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rubric_rules' AND column_name = 'order_index'
    ) THEN
        ALTER TABLE rubric_rules ADD COLUMN order_index INT DEFAULT 0;
    END IF;

    -- 3. Add description column to rubric_rules if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rubric_rules' AND column_name = 'description'
    ) THEN
        ALTER TABLE rubric_rules ADD COLUMN description TEXT;
    END IF;

    -- 4. Sync status with is_hidden for existing records
    UPDATE rubric_rules SET status = 'Hidden' WHERE is_hidden = TRUE AND status = 'Active';
    UPDATE rubric_rules SET status = 'Active' WHERE is_hidden = FALSE AND (status IS NULL OR status = 'Active');

END $$;

