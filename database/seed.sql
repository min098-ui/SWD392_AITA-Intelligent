-- =============================================================================
-- AITA-INTELLIGENT Seed Data (PostgreSQL)
-- Course: SWD392 - Group 4
-- =============================================================================

-- 1. Insert Users (Admins, Lecturer, 5 Official Group 4 Members)
-- Remove obsolete/mock users and former Dr. Nguyen Van Giang (giangnv@fe.edu.vn)
DELETE FROM users WHERE email IN (
  'student1@fpt.edu.vn', 'student2@fpt.edu.vn', 'student3@fpt.edu.vn', 'ylai.test@fpt.edu.vn',
  'phong.nqt.qe190030@fpt.edu.vn', 'huy.dg.qe190149@fpt.edu.vn', 'vy.nt.qe180099@fpt.edu.vn',
  'giangnv@fe.edu.vn'
);

-- Clean up any obsolete Course 1 and Team 1
DELETE FROM team_members WHERE team_id = 1;
DELETE FROM git_commits WHERE team_id = 1;
DELETE FROM peer_audits WHERE team_id = 1;
DELETE FROM teams WHERE team_id = 1;
DELETE FROM course_enrollments WHERE course_id = 1;
DELETE FROM assignments WHERE course_id = 1;
DELETE FROM courses WHERE course_id = 1;

INSERT INTO users (full_name, email, password_hash, role, status) VALUES
('System Administrator', 'admin@fpt.edu.vn', '$2a$10$fUyXvogZImWkD34ItWppmenaSNAgzilb7Ml7ZQ5DCx0OvRo3.RfX2', 'ADMIN', 'ACTIVE'),
('Yen12 Yen', 'yeny36306@gmail.com', '$2a$10$fUyXvogZImWkD34ItWppmenaSNAgzilb7Ml7ZQ5DCx0OvRo3.RfX2', 'LECTURER', 'ACTIVE'),
('Nguyen Lan', 'n011vynt@gmail.com', '$2a$10$fUyXvogZImWkD34ItWppmenaSNAgzilb7Ml7ZQ5DCx0OvRo3.RfX2', 'LECTURER', 'ACTIVE'),
('AMai Administrator', 'lenguyenanhmai05@gmail.com', '$2a$10$fUyXvogZImWkD34ItWppmenaSNAgzilb7Ml7ZQ5DCx0OvRo3.RfX2', 'ADMIN', 'ACTIVE'),
('Tuong Vy Administrator', 'tuongvy22102004@gmail.com', '$2a$10$fUyXvogZImWkD34ItWppmenaSNAgzilb7Ml7ZQ5DCx0OvRo3.RfX2', 'ADMIN', 'ACTIVE'),
('Tai Administrator', 'tajjjlojjj4444@gmail.com', '$2a$10$fUyXvogZImWkD34ItWppmenaSNAgzilb7Ml7ZQ5DCx0OvRo3.RfX2', 'ADMIN', 'ACTIVE'),

-- 5 Thành Viên Chính Thức Của Nhóm 4 (Group 4)
('Lê Nguyễn Ánh Mai', 'lenguyenlinhnhi2110@gmail.com', '$2a$10$fUyXvogZImWkD34ItWppmenaSNAgzilb7Ml7ZQ5DCx0OvRo3.RfX2', 'STUDENT', 'ACTIVE'),
('Đinh Gia Huy', 'dinhgiahuylol12345@gmail.com', '$2a$10$fUyXvogZImWkD34ItWppmenaSNAgzilb7Ml7ZQ5DCx0OvRo3.RfX2', 'STUDENT', 'ACTIVE'),
('Đỗ Trần Đăng Khoa', 'dotrandangkhoa17@gmail.com', '$2a$10$fUyXvogZImWkD34ItWppmenaSNAgzilb7Ml7ZQ5DCx0OvRo3.RfX2', 'STUDENT', 'ACTIVE'),
('Nguyễn Tường Vy', 'vyntqe180099@fpt.edu.vn', '$2a$10$fUyXvogZImWkD34ItWppmenaSNAgzilb7Ml7ZQ5DCx0OvRo3.RfX2', 'STUDENT', 'ACTIVE'),
('Nguyễn Quốc Thanh Phong', 'tfongcs05@gmail.com', '$2a$10$fUyXvogZImWkD34ItWppmenaSNAgzilb7Ml7ZQ5DCx0OvRo3.RfX2', 'STUDENT', 'ACTIVE')
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

SELECT setval('users_user_id_seq', (SELECT COALESCE(MAX(user_id), 1) FROM users));

-- 2. Insert Official Courses (SWD392 taught by Yen12 Yen, CSD201 taught by Nguyen Lan)
INSERT INTO courses (course_id, course_code, course_name, semester, lecturer_id)
SELECT 1, 'SWD392', 'SWD392 - Software Architecture & Design Project', 'FA26', u.user_id
FROM users u WHERE u.email = 'yeny36306@gmail.com'
ON CONFLICT (course_id) DO UPDATE SET
  course_code = EXCLUDED.course_code,
  course_name = EXCLUDED.course_name,
  semester = EXCLUDED.semester,
  lecturer_id = EXCLUDED.lecturer_id;

INSERT INTO courses (course_id, course_code, course_name, semester, lecturer_id)
SELECT 2, 'CSD201', 'CSD201 - Data Structures & Algorithms', 'FA26', u.user_id
FROM users u WHERE u.email = 'n011vynt@gmail.com'
ON CONFLICT (course_id) DO UPDATE SET
  course_code = EXCLUDED.course_code,
  course_name = EXCLUDED.course_name,
  semester = EXCLUDED.semester,
  lecturer_id = EXCLUDED.lecturer_id;

SELECT setval('courses_course_id_seq', (SELECT COALESCE(MAX(course_id), 1) FROM courses));

-- 3. Insert Course Enrollments (Ghi danh 5 thành viên thật vào môn học)
INSERT INTO course_enrollments (course_id, user_id)
SELECT c.course_id, u.user_id
FROM courses c, users u
WHERE c.course_id IN (1, 2)
  AND u.email IN (
    'lenguyenlinhnhi2110@gmail.com',
    'dinhgiahuylol12345@gmail.com',
    'dotrandangkhoa17@gmail.com',
    'vyntqe180099@fpt.edu.vn',
    'tfongcs05@gmail.com'
  )
ON CONFLICT ON CONSTRAINT uq_course_enrollment DO NOTHING;

SELECT setval('course_enrollments_enrollment_id_seq', (SELECT COALESCE(MAX(enrollment_id), 1) FROM course_enrollments));

-- 4. Insert Team (Group 4 (AITA) - formerly Group 4 - AITA Project)
INSERT INTO teams (team_id, team_name, course_id, repo_url) VALUES
(1, 'Group 4 (AITA)', 1, 'https://github.com/min098-ui/SWD392_AITA-Intelligent.git')
ON CONFLICT (team_id) DO UPDATE SET
  team_name = EXCLUDED.team_name,
  course_id = EXCLUDED.course_id,
  repo_url = EXCLUDED.repo_url;

INSERT INTO teams (team_id, team_name, course_id, repo_url) VALUES
(2, 'Group5_CSD201_TravelPlanner', 2, 'https://github.com/lenguyenanhmai05-dotcom/Group5_CSD201_TravelPlanner.git')
ON CONFLICT (team_id) DO UPDATE SET
  team_name = EXCLUDED.team_name,
  course_id = EXCLUDED.course_id,
  repo_url = EXCLUDED.repo_url;

SELECT setval('teams_team_id_seq', (SELECT COALESCE(MAX(team_id), 1) FROM teams));

-- 5. Insert Team Members & Assigned Modules & Roles for Group 4 (SWD392) & Group 5 (CSD201)
DELETE FROM team_members WHERE team_id IN (1, 2);

-- 5.1. Nhóm SWD392: Group 4 (AITA) - Đủ 5 thành viên
INSERT INTO team_members (team_id, user_id, assigned_module, role)
SELECT t.team_id, u.user_id, m.module, m.role
FROM teams t
CROSS JOIN (
  VALUES
    -- TV1: Lê Nguyễn Ánh Mai
    ('lenguyenlinhnhi2110@gmail.com', 'Software Architecture, Auth & Course Core', 'MEMBER'),
    -- TV2: Nguyễn Tường Vy (Phần 2)
    ('vyntqe180099@fpt.edu.vn', 'Docker Sandbox Runner & Async Grading Queue', 'MEMBER'),
    -- TV3: Đỗ Trần Đăng Khoa (Phần 3)
    ('dotrandangkhoa17@gmail.com', 'AI Engine, Socratic Tutor & Key Rotation', 'MEMBER'),
    -- TV4: Đinh Gia Huy (Trưởng nhóm / Leader)
    ('dinhgiahuylol12345@gmail.com', 'Git Analytics, Noise Filter & Peer Audit', 'LEADER'),
    -- TV5: Nguyễn Quốc Thanh Phong (Phần 5)
    ('tfongcs05@gmail.com', 'Frontend Web App (Next.js 14) & UI/UX', 'MEMBER')
) AS m(email, module, role)
JOIN users u ON u.email = m.email
WHERE t.team_id = 1
ON CONFLICT ON CONSTRAINT uq_team_user DO UPDATE SET
  assigned_module = EXCLUDED.assigned_module,
  role = EXCLUDED.role;

-- 5.2. Nhóm CSD201: Group5_CSD201_TravelPlanner - 2 thành viên: Ánh Mai (Leader) & Tường Vy (Member)
INSERT INTO team_members (team_id, user_id, assigned_module, role)
SELECT t.team_id, u.user_id, m.module, m.role
FROM teams t
CROSS JOIN (
  VALUES
    ('lenguyenlinhnhi2110@gmail.com', 'Graph Algorithms & Shortest Travel Path (Dijkstra)', 'LEADER'),
    ('vyntqe180099@fpt.edu.vn', 'BST Location Indexing & Budget Sorting (Min-Heap)', 'MEMBER')
) AS m(email, module, role)
JOIN users u ON u.email = m.email
WHERE t.team_id = 2
ON CONFLICT ON CONSTRAINT uq_team_user DO UPDATE SET
  assigned_module = EXCLUDED.assigned_module,
  role = EXCLUDED.role;

SELECT setval('team_members_team_member_id_seq', (SELECT COALESCE(MAX(team_member_id), 1) FROM team_members));

-- 6. Insert Prompt Templates
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
ON CONFLICT (prompt_template_id) DO UPDATE SET
  name = EXCLUDED.name,
  purpose = EXCLUDED.purpose,
  template_content = EXCLUDED.template_content,
  version = EXCLUDED.version;

SELECT setval('prompt_templates_prompt_template_id_seq', (SELECT COALESCE(MAX(prompt_template_id), 1) FROM prompt_templates));

-- 7. Insert Mock AI API Key
INSERT INTO ai_api_keys (ai_api_key_id, provider, key_value_encrypted, status, usage_count, rotated_at) VALUES
(1, 'Google-Gemini', 'enc_gemini_api_key_mock_value_xxxx1234', 'ACTIVE', 42, NOW()),
(2, 'OpenAI', 'enc_openai_api_key_mock_value_yyyy5678', 'ACTIVE', 15, NOW())
ON CONFLICT (ai_api_key_id) DO UPDATE SET
  provider = EXCLUDED.provider,
  key_value_encrypted = EXCLUDED.key_value_encrypted,
  status = EXCLUDED.status;

SELECT setval('ai_api_keys_ai_api_key_id_seq', (SELECT COALESCE(MAX(ai_api_key_id), 1) FROM ai_api_keys));

-- Note for Member 1 test compatibility: giangnv@fe.edu.vn and Group 4 - AITA Project
