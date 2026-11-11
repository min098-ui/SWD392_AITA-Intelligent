INSERT INTO assignments (assignment_id, course_id, title, description, allowed_language, max_score, deadline, due_date, submission_type, status, max_submissions, allow_resubmission, allow_late_submission)
VALUES
(66, 1, 'Assignment 2: Thiết kế RESTful API Service & Caching Redis cho Student Portal (Cá nhân)', 'Xây dựng service API chuẩn RESTful kết hợp caching Redis đệm kết quả truy vấn thông tin sinh viên và phòng chống race condition.', 'ALL', 10, '2026-11-30 23:59:00+07', '2026-11-30 23:59:00+07', 'INDIVIDUAL', 'PUBLISHED', 5, true, true),
(67, 1, 'Practical Exam: Cài đặt Dockerized Sandbox Runner & Worker Queue Cá Nhân', 'Bài thi thực hành: Viết module Docker Sandbox runner cô lập mã nguồn sinh viên, cấu hình timeout 10s và giới hạn bộ nhớ 256MB.', 'ALL', 10, '2026-12-05 23:59:00+07', '2026-12-05 23:59:00+07', 'INDIVIDUAL', 'PUBLISHED', 3, true, false)
ON CONFLICT (assignment_id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  allowed_language = EXCLUDED.allowed_language,
  max_score = EXCLUDED.max_score,
  deadline = EXCLUDED.deadline,
  due_date = EXCLUDED.due_date,
  submission_type = EXCLUDED.submission_type,
  status = EXCLUDED.status,
  max_submissions = EXCLUDED.max_submissions,
  allow_resubmission = EXCLUDED.allow_resubmission,
  allow_late_submission = EXCLUDED.allow_late_submission;

INSERT INTO rubric_rules (assignment_id, rule_type, criterion, input_data, expected_output, weight, max_score, is_hidden, status, order_index)
VALUES
(66, 'AUTOMATED', 'Test 1 (Public): Cache Hit trả về dữ liệu nhanh dưới 15ms', 'cache_test_key_1', 'CACHE_HIT: 200 OK', 1, 5, false, 'Active', 1),
(66, 'AUTOMATED', 'Test 2 (Public): Invalidate cache khi có thao tác UPDATE/DELETE', 'cache_invalidate_key_1', 'CACHE_INVALIDATED: 200 OK', 1, 5, false, 'Active', 2),
(67, 'AUTOMATED', 'Test 1 (Public): Chạy thành công mã nguồn sạch trong Sandbox trong 2s', 'sandbox_run_clean_code', 'SANDBOX_SUCCESS: 0 EXIT_CODE', 1, 5, false, 'Active', 1),
(67, 'AUTOMATED', 'Test 2 (Public): Kích hoạt Timeout Kill Process khi code chạy lặp vô tận (>10s)', 'sandbox_infinite_loop', 'TIMEOUT_KILLED: 137 EXIT_CODE', 1, 5, false, 'Active', 2)
ON CONFLICT DO NOTHING;

SELECT setval('assignments_assignment_id_seq', (SELECT COALESCE(MAX(assignment_id), 1) FROM assignments));
SELECT setval('rubric_rules_rubric_rule_id_seq', (SELECT COALESCE(MAX(rubric_rule_id), 1) FROM rubric_rules));
