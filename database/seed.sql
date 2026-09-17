-- =============================================================================
-- AITA-INTELLIGENT Seed Data (PostgreSQL)
-- Course: SWD392 - Group 4
-- =============================================================================

-- 1. Insert Users (Password is 'Password@123' hashed with bcrypt)
INSERT INTO users (user_id, full_name, email, password_hash, role) VALUES
(1, 'System Administrator', 'admin@fpt.edu.vn', '$2a$10$wT8vGZzI9n7vYqO/V55u0u9Q.VdZlZkS8aVvE1Vp2bH6rJ9gK2YWe', 'ADMIN'),
(2, 'Dr. Nguyen Van Giang', 'giangnv@fe.edu.vn', '$2a$10$wT8vGZzI9n7vYqO/V55u0u9Q.VdZlZkS8aVvE1Vp2bH6rJ9gK2YWe', 'LECTURER'),
(3, 'Lê Nguyễn Ánh Mai', 'mai.lna.qe190151@fpt.edu.vn', '$2a$10$wT8vGZzI9n7vYqO/V55u0u9Q.VdZlZkS8aVvE1Vp2bH6rJ9gK2YWe', 'STUDENT'),
(4, 'Đỗ Trần Đăng Khoa', 'khoa.dtd.qe190122@fpt.edu.vn', '$2a$10$wT8vGZzI9n7vYqO/V55u0u9Q.VdZlZkS8aVvE1Vp2bH6rJ9gK2YWe', 'STUDENT'),
(5, 'Nguyễn Quốc Thanh Phong', 'phong.nqt.qe190030@fpt.edu.vn', '$2a$10$wT8vGZzI9n7vYqO/V55u0u9Q.VdZlZkS8aVvE1Vp2bH6rJ9gK2YWe', 'STUDENT'),
(6, 'Đinh Gia Huy', 'huy.dg.qe190149@fpt.edu.vn', '$2a$10$wT8vGZzI9n7vYqO/V55u0u9Q.VdZlZkS8aVvE1Vp2bH6rJ9gK2YWe', 'STUDENT'),
(7, 'Nguyễn Tường Vy', 'vy.nt.qe180099@fpt.edu.vn', '$2a$10$wT8vGZzI9n7vYqO/V55u0u9Q.VdZlZkS8aVvE1Vp2bH6rJ9gK2YWe', 'STUDENT')
ON CONFLICT (user_id) DO NOTHING;

SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));

-- 2. Insert Course
INSERT INTO courses (course_id, course_code, course_name, semester, lecturer_id) VALUES
(1, 'SWD392', 'Software Architecture & Design Project', 'FA26', 2)
ON CONFLICT (course_id) DO NOTHING;

SELECT setval('courses_course_id_seq', (SELECT MAX(course_id) FROM courses));

-- 3. Insert Team
INSERT INTO teams (team_id, team_name, course_id, repo_url) VALUES
(1, 'Group 4 - AITA Project', 1, 'https://github.com/aita-project/aita-intelligent.git')
ON CONFLICT (team_id) DO NOTHING;

SELECT setval('teams_team_id_seq', (SELECT MAX(team_id) FROM teams));

-- 4. Insert Team Members & Assigned Modules
INSERT INTO team_members (team_id, user_id, assigned_module) VALUES
(1, 3, 'Software Architecture, Auth & Course Core'),
(1, 4, 'Docker Sandbox Runner & Async Grading Queue'),
(1, 5, 'AI Engine, Socratic Tutor & Key Rotation'),
(1, 6, 'Database Schema, Git Analytics & Peer Audit'),
(1, 7, 'Frontend Web App (Next.js 14) & UI/UX')
ON CONFLICT ON CONSTRAINT uq_team_user DO NOTHING;

-- 5. Insert Prompt Templates
INSERT INTO prompt_templates (prompt_template_id, name, purpose, template_content, version) VALUES
(1, 'Code Grading Feedback Prompt', 'Grading', 
'You are an expert AI Teaching Assistant for Software Engineering. 
Evaluate the student submission for assignment "{{assignment_title}}".
Rubric criterion: {{criterion}}
Expected output: {{expected_output}}
Actual output: {{actual_output}}
Code Diff: {{code_diff}}
Provide:
1. Short constructive review of correctness.
2. Code style & complexity feedback (time/space complexity).
3. Concrete suggestion to improve without giving out the entire answer.', 'v1.0'),
(2, 'Interactive AI Tutor Chat Prompt', 'TutorChat', 
'You are AITA, a friendly and knowledgeable AI coding tutor for university students.
The student has submitted code for assignment "{{assignment_title}}" with status "{{submission_status}}".
Guide the student using the Socratic method: encourage them to think, explain concepts clearly with small code snippets, and help them debug step-by-step.', 'v1.0')
ON CONFLICT (prompt_template_id) DO NOTHING;

SELECT setval('prompt_templates_prompt_template_id_seq', (SELECT MAX(prompt_template_id) FROM prompt_templates));

-- 6. Insert Mock AI API Key
INSERT INTO ai_api_keys (ai_api_key_id, provider, key_value_encrypted, status, usage_count, rotated_at) VALUES
(1, 'Google-Gemini', 'enc_gemini_api_key_mock_value_xxxx1234', 'ACTIVE', 42, NOW()),
(2, 'OpenAI', 'enc_openai_api_key_mock_value_yyyy5678', 'ACTIVE', 15, NOW())
ON CONFLICT (ai_api_key_id) DO NOTHING;

SELECT setval('ai_api_keys_ai_api_key_id_seq', (SELECT MAX(ai_api_key_id) FROM ai_api_keys));

-- 7. Insert Assignment
INSERT INTO assignments (assignment_id, course_id, title, description, deadline, max_score) VALUES
(1, 1, 'Milestone 1: Backend API & Sandbox Runner', 
'Implement the core REST API endpoints and integrate Docker Sandbox execution for evaluating code submissions.',
NOW() + INTERVAL '14 days', 10.0)
ON CONFLICT (assignment_id) DO NOTHING;

SELECT setval('assignments_assignment_id_seq', (SELECT MAX(assignment_id) FROM assignments));

-- 8. Insert Rubric Rules
INSERT INTO rubric_rules (rubric_rule_id, assignment_id, rule_type, criterion, input_data, expected_output, weight, max_score, is_hidden) VALUES
(1, 1, 'AUTOMATED', 'Unit Test Case 1: Standard Input Evaluation', 'input_matrix = [[1,2],[3,4]]', 'result = 10', 0.3, 3.0, FALSE),
(2, 1, 'AUTOMATED', 'Unit Test Case 2: Boundary / Edge Case (Hidden)', 'input_matrix = []', 'result = 0', 0.3, 3.0, TRUE),
(3, 1, 'AI_ANALYSIS', 'Clean Code & Architectural Design Patterns', NULL, NULL, 0.4, 4.0, FALSE)
ON CONFLICT (rubric_rule_id) DO NOTHING;

SELECT setval('rubric_rules_rubric_rule_id_seq', (SELECT MAX(rubric_rule_id) FROM rubric_rules));
