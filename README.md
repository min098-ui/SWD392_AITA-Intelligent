# AITA-INTELLIGENT: AI-Powered Teaching Assistant & AST Code Analytics Platform

> **Môn học:** SWD392 – Software Architecture & Design Project (FPT University Quy Nhơn)
> **Nhóm:** Group 4
> **Hệ thống:** Chấm code tự động trong Docker Sandbox · Trợ giảng AI Socratic · Phân tích đóng góp Git · Đánh giá chéo nội bộ nhóm

---

## 📂 Cấu Trúc Dự Án

```
SWD392_AITA-Intelligent/
├── client/                     # Frontend: Next.js 14 + React 18 + TypeScript (Port 3000)
│   ├── .env.example            # Mẫu cấu hình biến môi trường Frontend (.env.local)
│   └── src/
│       ├── app/                # App Router — Trang chủ, Auth, Dashboard Sinh viên / Giảng viên / Admin
│       ├── components/         # UI Components tái sử dụng (Navigation, LanguageSwitcher, Chatbot, Tables)
│       ├── context/            # LanguageContext đa ngôn ngữ (VI / EN)
│       └── styles/             # Global CSS Design System (Dark Glassmorphic UI/UX)
│
├── server/                     # Backend API & Sandbox Runner: Express + TypeScript (Port 5000)
│   ├── sandbox-images/         # Dockerfile Runner cô lập tài nguyên cho bài nộp sinh viên
│   ├── .env.example            # Mẫu cấu hình biến môi trường Backend (.env)
│   └── src/
│       ├── config/             # Cấu hình PostgreSQL Pool, Redis, Environment
│       ├── common/             # Middleware JWT, Phân quyền RBAC
│       └── modules/
│           ├── auth/           # Đăng nhập (Local, Google/GitHub OAuth), cấp Token JWT
│           ├── courses/        # Quản lý môn học, lớp học & danh sách sinh viên
│           ├── teams/          # Quản lý nhóm đồ án và thành viên trong nhóm
│           ├── assignments/    # Quản lý bài tập, rubric test case ẩn/hiện
│           ├── submissions/    # Nộp bài (Git hash), đưa vào hàng đợi chấm
│           ├── ai-tutor/       # Chatbot Trợ giảng AI, Key Pool & Rotation
│           ├── git-analytics/  # Kéo commit history, phân tích lines added/deleted
│           └── peer-audits/    # Đánh giá chéo giữa các thành viên trong nhóm
│
├── database/                   # Cơ sở dữ liệu PostgreSQL 16
│   ├── schema.sql              # DDL 16 bảng chuẩn 3NF theo ERD & SRS
│   └── seed.sql                # Dữ liệu mẫu khởi tạo (Users, Courses, Teams, Rubrics)
│
├── docs/                       # Tài liệu SRS đặc tả yêu cầu & sơ đồ kiến trúc
├── docker-compose.yml          # Khởi chạy PostgreSQL (5432) & Redis (6379)
└── README.md
```

---

## 👥 Phân Chia Công Việc Cho 5 Thành Viên (Team Task Allocation)

### 1. Bản Đồ Phân Bổ Trách Nhiệm (Responsibility Matrix - RACI)

Hệ thống được chia thành **5 vai trò chuyên biệt** tương ứng với 5 trụ cột kỹ thuật của dự án, đảm bảo khối lượng công việc cân bằng, không chồng chéo và dễ dàng chấm điểm đóng góp cá nhân trong đồ án SWD392:

| Vai Trò | Trọng Tâm Nhiệm Vụ | Module Backend Phụ Trách | Bảng DB Phụ Trách | Business Rules |
| :--- | :--- | :--- | :--- | :--- |
| **Role 1: Software Architect & Core Auth** | Kiến trúc hệ thống, JWT Auth RBAC, Quản lý môn học, ghi danh & nhóm, Docker Compose | `auth`, `courses`, `teams` | `users`, `courses`, `course_enrollments`, `teams`, `team_members` | BR-01 |
| **Role 2: Docker Sandbox & Autograding** | Docker Sandbox Container cô lập, BullMQ Queue, Chấm bài tự động, Rubric Test Case, Dual-Lecturer Workflow | `assignments`, `submissions`, `grading` | `assignments`, `rubric_rules`, `submissions`, `grading_jobs`, `grading_results` | BR-03, BR-06, BR-09 |
| **Role 3: AI Engine & Key Rotation** | Gemini AI Tutor Socratic, Chat Sessions, Key Pool AES-256, Prompt Versioning, Rotation, AI Pre-grading | `ai-tutor` | `ai_api_keys`, `prompt_templates`, `tutor_chat_sessions`, `tutor_chat_messages` | BR-02, BR-04, BR-05, BR-09 |
| **Role 4: Git Analytics & Peer Audit** | Octokit GitHub API, LOC Parser, Free-Rider Detection, Đánh giá chéo nội bộ nhóm | `git-analytics`, `peer-audits` | `git_commits`, `peer_audits` | BR-07, BR-08 |
| **Role 5: Frontend Lead & UI/UX & QA** | Toàn bộ Next.js 14 UI — Dashboard Student/Lecturer/Admin, Glassmorphic Design, Testing, Review Modal | `client/` toàn bộ | Tích hợp tất cả API | Phụ trợ BR-01→BR-09 |

---

### 2. Chi Tiết Task Cụ Thể Từng Thành Viên

#### 👤 Thành Viên 1: Software Architect & Core Auth Engineer
*Nhiệm vụ: Thiết kế kiến trúc tổng thể, xây dựng nền tảng xác thực và phân quyền, quản lý môn học, ghi danh và nhóm.*

- **Kiến trúc & DevOps:**
  - Thiết lập và duy trì `docker-compose.yml` khởi động đồng bộ PostgreSQL (port 5432) và Redis (port 6379).
  - Cấu hình Express server `src/index.ts`, CORS, middleware pipeline, health check endpoint `/api/health`.
  - Quản lý file `.env.example`, `tsconfig.json`, `.gitignore` — đảm bảo không lộ secret.
  - Thiết kế `database/schema.sql` cho các bảng nền tảng: `users`, `courses`, `course_enrollments`, `teams`, `team_members` và viết `database/seed.sql` nạp dữ liệu mẫu.

- **Module `auth` — Đăng nhập & JWT:**
  - API `POST /api/auth/register`: Hash mật khẩu bằng **Bcrypt (salt = 10)** trước khi lưu (`BR-01`).
  - API `POST /api/auth/login`: Xác thực email/password, cấp **JWT Access Token** với payload `{ userId, role }`.
  - Viết `src/common/auth.middleware.ts`: Middleware `authenticateJWT` xác minh token và middleware `requireRole('ADMIN' | 'LECTURER' | 'STUDENT')` kiểm tra RBAC 3 cấp.

- **Module `courses` — Quản lý Môn học & Ghi danh:**
  - API `GET /api/courses` — Lấy danh sách môn học (Giảng viên xem môn mình dạy, Admin xem tất cả).
  - API `POST /api/courses` — Giảng viên tạo môn học mới.
  - API `GET /api/courses/:id` — Chi tiết môn học kèm danh sách nhóm và sinh viên.
  - API `POST /api/courses/:id/enroll` — Ghi danh sinh viên vào khóa học (`course_enrollments`).
  - API `GET /api/courses/:id/students` — Lấy danh sách sinh viên đã ghi danh môn học.

- **Module `teams` — Quản lý Nhóm:**
  - API `POST /api/teams`: Giảng viên tạo nhóm, gán `repo_url` GitHub cho nhóm.
  - API `POST /api/teams/:teamId/members`: Thêm sinh viên vào nhóm với `assigned_module` và `role` (`LEADER` / `MEMBER`).
  - API `GET /api/teams/:teamId` — Lấy thông tin nhóm và danh sách thành viên.

#### 👤 Thành Viên 2: Docker Sandbox & Autograding Engineer
*Nhiệm vụ: Xây dựng pipeline chấm bài tự động trong Docker Container cô lập và hàng đợi xử lý bất đồng bộ.*

- **Sandbox Runner (`server/sandbox-images/`):**
  - Viết `Dockerfile` cho từng ngôn ngữ hỗ trợ (Python, JavaScript/Node.js): Non-root user, network disabled, ulimit.
  - Cấu hình **giới hạn tài nguyên container**: CPU 0.5 core · RAM 256MB · Timeout 10–30 giây (`BR-03`).
  - Dùng thư viện `dockerode` để tạo container, chạy code sinh viên, đọc stdout/stderr và xóa container sau khi chạy xong.

- **Module `assignments` — Quản lý Bài Tập:**
  - API `POST /api/assignments`: Giảng viên tạo bài tập với `start_date`, `due_date`, `max_score`, `submission_type` (`INDIVIDUAL` / `TEAM`).
  - API `POST /api/assignments/:id/rubrics`: Thêm **Rubric Rule** (AUTOMATED / MANUAL / AI_ANALYSIS), thiết lập `is_hidden = true` cho test case ẩn.
  - API `GET /api/assignments/:id/rubrics`: Trả về test case — Sinh viên chỉ thấy kết quả Đạt/Không Đạt với test ẩn, không xem được `input_data` / `expected_output` (`BR-06`).

- **Module `submissions` — Nộp bài:**
  - API `POST /api/submissions`: Sinh viên nộp `artifact_url` (URL GitHub/file) và `git_commit_hash`, lưu `submitted_by_user_id`. Hệ thống tự động tạo **Grading Job** với priority tương ứng và đưa vào BullMQ Queue.
  - API `GET /api/submissions/:id` — Lấy trạng thái bài nộp (SUBMITTED → QUEUED → GRADING → GRADED | FAILED).

- **Module `grading` — Worker Chấm Bài:**
  - Cấu hình **BullMQ Worker** kết nối Redis, lắng nghe queue `grading-queue`.
  - Luồng xử lý: Kéo code từ `artifact_url` → Spin up Docker Container (`sandbox_container_id`) → Chạy từng Rubric Rule → So sánh `actual_output` với `expected_output` → Lưu `grading_results` (ứng với từng `rubric_rule_id`) → Cập nhật `status = 'COMPLETED'`.
  - Xử lý lỗi: Nếu container timeout hoặc crash → Cập nhật `status = 'FAILED'`, lưu log lỗi và tăng `retry_count`.
  - API `GET /api/grading/:jobId/results` — Lấy kết quả chi tiết từng test case và AI feedback.
  - **Quy trình Chấm Điểm Đa Tầng — Dual-Lecturer Moderation (`BR-09` — Bổ sung theo góp ý Milestone 2):**
    - Bước 1 (AI Pre-grading): AI chấm điểm sơ bộ và sinh nhận xét (`ai_score`, `ai_feedback`).
    - Bước 2 (Giảng viên 1 đánh giá & tự chấm lại): Giảng viên 1 duyệt điểm AI (`POST /api/grading/review/approve-ai/:id`). Nếu thấy chưa đúng, GV 1 tự xem lại và chấm điểm (`reviewer_1_score`), sau đó chỉ định Giảng viên 2 chấm chéo (`POST /api/grading/review/request-second-opinion/:id`).
    - Bước 3 (Giảng viên 2 chấm chéo độc lập): Giảng viên 2 chấm điểm độc lập (`reviewer_2_score`). Nếu độ lệch $\le 0.5$, hệ thống tự chốt điểm trung bình. Nếu độ lệch $> 0.5$, chuyển sang bước hội ý.
    - Bước 4 (Thảo luận & Thống nhất): Hai giảng viên trao đổi lý do, lập biên bản thống nhất (`consensus_notes`) và chốt điểm cuối cùng (`final_score`).

#### 👤 Thành Viên 3: AI Engine & Key Rotation Engineer
*Nhiệm vụ: Tích hợp Gemini AI làm trợ giảng Socratic, quản lý Key Pool mã hóa và Prompt Template versioning.*

- **Bảo mật AI API Keys (`ai_api_keys`):**
  - Viết service mã hóa/giải mã **AES-256** cho `api_key_encrypted` trước khi lưu vào DB (`BR-02`).
  - API Admin `GET /api/ai-tutor/admin/keys` — Xem danh sách key, trạng thái (`ACTIVE` / `RATE_LIMITED` / `EXHAUSTED`), `usage_count`, `rotated_at`.
  - API Admin `POST /api/ai-tutor/admin/keys` — Thêm key Gemini mới vào pool.
  - API Admin `PATCH /api/ai-tutor/admin/keys/:id/status` — Thay đổi trạng thái key thủ công.

- **Logic Key Rotation tự động (`BR-04`):**
  - Hàm `getNextActiveApiKey()`: Luôn chọn key `ACTIVE` có `usage_count` thấp nhất (Least-Used / Round-robin).
  - Khi gặp HTTP 429 (Rate Limit) từ Gemini: Tự động đánh dấu key hiện tại thành `RATE_LIMITED`, gọi lại `getNextActiveApiKey()` và thử request tiếp theo.
  - Cập nhật `usage_count++` và `rotated_at` sau mỗi lần dùng.

- **Prompt Template Versioning (`BR-05`):**
  - Bảng `prompt_templates` lưu `version` (v1.0, v2.0...) cho mỗi system prompt (`purpose`: `Grading`, `TutorChat`).
  - API `GET /api/ai-tutor/admin/prompts` — Liệt kê tất cả template theo `purpose`.
  - API Admin `POST /api/ai-tutor/admin/prompts` — Thêm version mới, không xóa version cũ (audit trail).

- **Module `ai-tutor` — Chatbot Trợ giảng Socratic & Chat Sessions:**
  - API `POST /api/ai-tutor/sessions` — Tạo phiên chat mới (`tutor_chat_sessions`), gắn với `submission_id` hoặc `assignment_id`.
  - API `GET /api/ai-tutor/sessions/:sessionId/messages` — Lấy lịch sử tin nhắn của phiên chat.
  - API `POST /api/ai-tutor/sessions/:sessionId/chat` — Sinh viên gửi câu hỏi → Hệ thống lấy Prompt Template phù hợp → Gọi Gemini AI với phong cách **Socratic** (dẫn dắt gợi ý, không cho đáp án thẳng) → Lưu tin nhắn vào `tutor_chat_messages`.
  - Tích hợp **AI Grading Feedback**: Sau khi chấm xong, gọi Gemini sinh ra `ai_feedback` nhận xét code chi tiết cho từng rubric rule trong `grading_results`.

#### 👤 Thành Viên 4: Git Analytics & Peer Audit Engineer
*Nhiệm vụ: Phân tích đóng góp cá nhân từ GitHub, phát hiện free-rider và xây dựng hệ thống đánh giá chéo nội bộ nhóm.*

- **Module `git-analytics` — Phân tích GitHub:**
  - Dùng thư viện `@octokit/rest` gọi **GitHub REST API** để kéo commit history của `repo_url` nhóm.
  - API `POST /api/git/:teamId/sync`: Trigger đồng bộ commit history mới nhất từ GitHub vào bảng `git_commits`.
  - Với mỗi commit, lưu `commit_hash`, `author_user_id` (map từ GitHub email sang `users.user_id`), `lines_added`, `lines_deleted`, `committed_at`.
  - **Bộ lọc Noise (BR-07):** Loại bỏ các file sinh tự động (`node_modules/`, `dist/`, `build/`, `package-lock.json`, `.next/`) khỏi thống kê LOC để tính đóng góp thực chất.
  - API `GET /api/git/:teamId/commits` — Trả về danh sách commit và bảng thống kê tổng hợp `lines_added` / `lines_deleted` / `total_commits` per thành viên.
  - **Free-Rider Detection (`BR-07`):** So sánh tỷ lệ đóng góp từng thành viên (LOC%) — nếu thấp hơn ngưỡng (ví dụ: <5% tổng nhóm), tự động đánh dấu cảnh báo cho Giảng viên.

- **Module `peer-audits` — Đánh giá Chéo Nội bộ:**
  - API `POST /api/peer-audits` — Sinh viên gửi đánh giá thành viên cùng nhóm: `team_id`, `assignment_id`, `reviewer_id`, `reviewee_id`, `audit_round`, `score`, `comments`.
  - **Ràng buộc DB cứng (`BR-08`):** Constraint `CHECK (reviewer_id <> reviewee_id)` ở tầng database cấm sinh viên tự đánh giá chính mình và `UNIQUE (assignment_id, reviewer_id, reviewee_id, audit_round)`.
  - API `GET /api/peer-audits/team/:teamId/assignment/:assignmentId` — Lấy danh sách phiếu đánh giá theo đợt nộp bài.
  - API `GET /api/peer-audits/team/:teamId/summary` — Tính điểm trung bình đánh giá chéo từng thành viên trong nhóm (`AVG(score)` group by `reviewee_id`), phục vụ Giảng viên.

#### 👤 Thành Viên 5: Frontend Lead & UI/UX & QA
*Nhiệm vụ: Xây dựng toàn bộ giao diện Next.js 14 với thiết kế Glassmorphic tối, tích hợp tất cả API và đảm bảo chất lượng kiểm thử.*

- **Hệ thống Design (`client/src/styles/`):**
  - Xây dựng **Global CSS Design System** Glassmorphic Dark Theme: Màu nền tối (`#0a0a1a`), backdrop-filter blur, gradient tím-xanh `#7c3aed → #2563eb`.
  - Định nghĩa CSS Variables cho màu sắc, spacing, border-radius, box-shadow — đảm bảo nhất quán toàn app.
  - Typography: Google Font **Inter** hoặc **Outfit**, smooth micro-animations (`transition: all 0.3s ease`).

- **Trang Landing & Auth (`client/src/app/page.tsx` & `(auth)/`):**
  - Trang chủ giới thiệu hệ thống AITA-INTELLIGENT với hero section, feature highlights.
  - Trang Login: Form đăng nhập, gọi `POST /api/auth/login`, lưu JWT vào `localStorage`, phân quyền route client-side theo role.

- **Dashboard Sinh viên (`client/src/app/(dashboard)/student/`):**
  - Hiển thị danh sách môn học đang học, bài tập còn deadline.
  - Trang nộp bài: Form nhập `artifact_url` + `git_commit_hash`, submit và theo dõi trạng thái chấm bài thời gian thực (polling 3s).
  - Xem kết quả chấm bài: Điểm chi tiết từng test case Rubric, badge Đạt/Không Đạt, AI Feedback.
  - **Chatbot AI Tutor**: Giao diện chat theo Session, gửi câu hỏi và nhận gợi ý Socratic từ Gemini AI.
  - Xem báo cáo đóng góp nhóm Git: Biểu đồ cột LOC per thành viên, badge cảnh báo Free-Rider.
  - Phiếu đánh giá chéo: Form chọn thành viên cùng nhóm (loại trừ chính mình), nhập điểm và nhận xét theo vòng đánh giá.

- **Dashboard Giảng viên (`client/src/app/(dashboard)/lecturer/`):**
  - Quản lý môn học, sinh viên & nhóm: Tạo nhóm, ghi danh sinh viên, gán phân hệ, cập nhật `repo_url`.
  - Tạo bài tập & Rubric: Form tạo bài tập, thêm test case với toggle ẩn/hiện.
  - Xem kết quả lớp: Bảng điểm tổng hợp theo tiêu chí, lọc theo nhóm/trạng thái.
  - Báo cáo Git Analytics: Bảng đóng góp tất cả nhóm, highlight thành viên có dấu hiệu Free-Riding.
  - Xem tổng hợp Peer Audit theo đợt và vòng đánh giá.

- **Dashboard Admin (`client/src/app/(dashboard)/admin/`):**
  - Quản lý AI API Key Pool: Danh sách key, trạng thái, usage count, nút thêm key mới.
  - Quản lý Prompt Template: Danh sách template theo `purpose` và `version`, form tạo version mới.
  - Giám sát hệ thống: Hiển thị dữ liệu health check từ `/api/health`.

- **QA & Kiểm thử:**
  - Viết kịch bản test API bằng **Postman Collection**: Toàn bộ endpoints của các modules.
  - Chuẩn bị bộ dữ liệu demo cho buổi bảo vệ:
    - Kịch bản 1: Sinh viên nộp code đúng → chạy sandbox thành công → chấm điểm chi tiết theo rubric.
    - Kịch bản 2: Sinh viên nộp code lỗi runtime → sandbox timeout → trạng thái `FAILED`.
    - Kịch bản 3: Nhóm có 1 sinh viên ít commit/LOC thấp → hệ thống phát hiện Free-Rider, cảnh báo Giảng viên.
    - Kịch bản 4: AI API Key bị Rate Limit 429 → hệ thống tự xoay sang key dự phòng tiếp tục phục vụ.
  - Kiểm tra toàn bộ UI responsive trên các viewport (desktop 1440px · tablet 768px · mobile 375px).

---

### 3. Lộ Trình Triển Khai Cho Cả Nhóm (Milestone Roadmap)

```mermaid
gantt
    title Lộ Trình Triển Khai AITA-INTELLIGENT (SWD392 Group 4)
    dateFormat YYYY-MM-DD
    section Giai đoạn 1 - Nền Tảng
    Kiến trúc Docker DB Schema 16 bảng và Seed TV1        :done, m1, 2026-09-15, 2026-09-18
    section Giai đoạn 2 - Phát Triển Song Song
    TV1 - Auth RBAC Courses Enrollments Teams             :active, tv1, 2026-09-18, 2026-09-25
    TV2 - Docker Sandbox BullMQ Queue Grading Worker      :active, tv2, 2026-09-18, 2026-09-25
    TV3 - Gemini AI Tutor Key Pool và Prompt Versioning   :active, tv3, 2026-09-18, 2026-09-25
    TV4 - Git Analytics Octokit và Peer Audit API         :active, tv4, 2026-09-18, 2026-09-25
    TV5 - Next.js 14 Design System Dashboard Foundations  :active, tv5, 2026-09-18, 2026-09-25
    section Giai đoạn 3 - Tích Hợp
    Ghép API Backend vào Frontend UI Toàn Nhóm            :m3, 2026-09-25, 2026-09-30
    section Giai đoạn 4 - Hoàn Thiện
    Demo Kịch Bản Kiểm Thử và Tối Ưu Hệ Thống             :m4, 2026-09-30, 2026-10-04
    Viết Báo Cáo và Chuẩn Bị Bảo Vệ Đồ Án                 :m5, 2026-10-04, 2026-10-07
```

---

### 4. Quy Trình Phối Hợp Trên GitHub

| Nhánh | Mục đích | Phụ trách chính |
| :--- | :--- | :--- |
| `main` | Production-ready code (chỉ merge khi build passed, test E2E đạt) | Cả nhóm |
| `develop` | Nhánh tích hợp chung (merge từ các feature sau review) | Cả nhóm |
| `feature/auth-courses-teams` | Auth RBAC · Courses · Enrollments · Teams API | **Thành viên 1** |
| `feature/sandbox-autograding` | Docker Sandbox · BullMQ · Rubric Grading Worker | **Thành viên 2** |
| `feature/ai-engine-key-rotation` | Gemini AI Tutor · Key Pool Rotation · Prompt Versioning | **Thành viên 3** |
| `feature/git-analytics-peer-audit` | Octokit Git Sync · Free-Rider Detection · Peer Audit API | **Thành viên 4** |
| `feature/frontend-dashboard-ui` | Next.js 14 · Glassmorphic UI · Toàn bộ Dashboards | **Thành viên 5** |

---

### 5. Bảng API Endpoints Phân Chia Theo Thành Viên

| Thành viên | Method | Endpoint | Mô tả |
| :--- | :--- | :--- | :--- |
| **TV1** | POST | `/api/auth/register` | Đăng ký tài khoản, mã hóa Bcrypt |
| **TV1** | POST | `/api/auth/login` | Đăng nhập, cấp JWT Token |
| **TV1** | GET | `/api/courses` | Danh sách môn học |
| **TV1** | POST | `/api/courses` | Giảng viên tạo môn học mới |
| **TV1** | POST | `/api/courses/:id/enroll` | Ghi danh sinh viên vào lớp học |
| **TV1** | GET | `/api/courses/:id/students` | Lấy danh sách sinh viên trong lớp |
| **TV1** | POST | `/api/teams` | Giảng viên tạo nhóm và gắn `repo_url` |
| **TV1** | POST | `/api/teams/:id/members` | Thêm sinh viên vào nhóm kèm vai trò & module |
| **TV2** | POST | `/api/assignments` | Giảng viên tạo bài tập / Milestone |
| **TV2** | POST | `/api/assignments/:id/rubrics` | Thêm tiêu chí Rubric / test case ẩn/hiện |
| **TV2** | POST | `/api/submissions` | Nộp bài (`artifact_url`, `commit_hash`) → BullMQ |
| **TV2** | GET | `/api/grading/:jobId/results` | Lấy kết quả chấm chi tiết từng tiêu chí Rubric |
| **TV3** | POST | `/api/ai-tutor/sessions` | Khởi tạo phiên chat với Trợ giảng AI |
| **TV3** | GET | `/api/ai-tutor/sessions/:id/messages` | Lấy lịch sử chat theo phiên |
| **TV3** | POST | `/api/ai-tutor/sessions/:id/chat` | Gửi câu hỏi và nhận gợi ý Socratic từ Gemini |
| **TV3** | GET | `/api/ai-tutor/admin/keys` | Quản lý AI Key Pool, kiểm tra xoay tua key |
| **TV3** | GET | `/api/ai-tutor/admin/prompts` | Quản lý các phiên bản Prompt Template |
| **TV4** | POST | `/api/git/:teamId/sync` | Kéo commit history từ GitHub về hệ thống |
| **TV4** | GET | `/api/git/:teamId/commits` | Lấy commit list & thống kê LOC, cảnh báo Free-Rider |
| **TV4** | POST | `/api/peer-audits` | Gửi phiếu đánh giá chéo thành viên cùng nhóm |
| **TV4** | GET | `/api/peer-audits/team/:id/assignment/:assignmentId` | Xem kết quả đánh giá chéo theo đợt bài tập |
| **TV4** | GET | `/api/peer-audits/team/:id/summary` | Tổng hợp điểm trung bình đánh giá chéo của nhóm |
| **TV5** | *(UI)* | `localhost:3000/student` | Toàn bộ Dashboard Sinh viên |
| **TV5** | *(UI)* | `localhost:3000/lecturer` | Toàn bộ Dashboard Giảng viên |
| **TV5** | *(UI)* | `localhost:3000/admin` | Toàn bộ Dashboard Quản trị viên |

---

### 6. Hướng Dẫn Trải Nghiệm Tính Năng Từng Thành Viên Trên Web (UI Demo Walkthrough)

Hệ thống được thiết kế đồng bộ chặt chẽ giữa Giao diện người dùng (Frontend) và các Module nghiệp vụ (Backend), phân chia rõ rệt vai trò của từng thành viên:

#### 📊 Bảng Tra Cứu Nhanh Vị Trí Tính Năng & Nút Bấm Trên Web:

| Thành viên | Trọng tâm chức năng | Màn hình trên Web | Nút bấm & Form tương tác chính | Tài khoản demo khuyên dùng |
| :---: | :--- | :--- | :--- | :--- |
| **TV1** | Auth, RBAC, Khóa học, Nhóm | `/login`, `/register`<br>👨‍🏫 GV: Tab `Quản lý Nhóm & Môn` (`teams`) | • Nút **Đăng nhập phân quyền**<br>• Nút **`+ Tạo Khóa Học`**<br>• Nút **`+ Tạo Nhóm Mới`** & **`+ Thêm Thành Viên`** | `giangnv@fe.edu.vn`<br>`admin@fpt.edu.vn` |
| **TV2** | Sandbox Chấm bài, Hàng đợi, Duyệt đa tầng | 🎓 SV: Tab `Nộp bài` (`submit`), `Kết quả` (`results`)<br>👨‍🏫 GV: Tab `Danh sách nộp` (`overview`), `Cấu hình` (`config`) | • Nút **`⚡ Điền nhanh dữ liệu demo`** & **`Nộp bài ngay`**<br>• Bảng điểm Rubric (Test case công khai & **Test case ẩn**)<br>• Modal **Duyệt điểm Đa tầng Dual-Lecturer** (Duyệt AI / Yêu cầu GV2 chấm chéo / Chốt điểm) | `student1@fpt.edu.vn`<br>`giangnv@fe.edu.vn` |
| **TV3** | Trợ lý Socratic AI, Xoay Key AES-256 | 🎓 SV: Tab `Trợ lý AI` (`chat`)<br>⚙️ Admin: Tab `Kho Khóa AI` (`keys`), `Mẫu Prompt` (`prompts`) | • Khung chat **Socratic AI Tutor** (gợi mở tư duy, không giải hộ)<br>• Bảng quản lý **AI Key Pool** (xoay key tự động khi dính 429)<br>• Lịch sử các phiên bản Prompt Template | `student2@fpt.edu.vn`<br>`admin@fpt.edu.vn` |
| **TV4** | Git Analytics, Bắt Free-Rider, Đánh giá chéo | 🎓 SV: Tab `Đánh giá chéo` (`peer`)<br>👨‍🏫 GV: Tab `Git Analytics` (`analytics`), `Đánh giá chéo` (`peer`) | • Form **Peer Audit** (chặn tự chấm chính mình `BR-08`)<br>• Badge cảnh báo **`⚠️ FREE-RIDER DETECTED`** (< 5% LOC `BR-07`)<br>• Bảng ma trận điểm trung bình `AVG(score)` chéo | `student1@fpt.edu.vn`<br>`giangnv@fe.edu.vn` |
| **TV5** | Toàn bộ UI Next.js 14, Đa ngôn ngữ, UX | Toàn bộ các trang Web | • Nút chuyển ngôn ngữ **`VI / EN`** trên thanh Navigation<br>• Giao diện **Dark Glassmorphic** hiện đại<br>• Responsive và hiệu ứng Toast, Loading realtime | Tất cả tài khoản |

#### 🔍 Chi Tiết Thao Tác Trải Nghiệm Từng Tính Năng:

1. **Thành viên 1 — Nền tảng Xác thực & Quản lý Đào tạo:**
   * Truy cập `/login`: Đăng nhập với các vai trò khác nhau để kiểm tra middleware JWT RBAC tự động điều hướng đúng Dashboard.
   * Truy cập `/lecturer` $\rightarrow$ chọn tab **Quản lý Nhóm & Môn học**: Bấm nút `+ Tạo Khóa Học` hoặc `+ Thêm Thành Viên` để đưa sinh viên vào nhóm làm đồ án.
   * Truy cập `/student` $\rightarrow$ chọn tab **Khóa học & Nhóm của tôi**: Sinh viên thấy thông tin nhóm, module được giao và danh sách bạn cùng nhóm.

2. **Thành viên 2 — Động cơ Chấm bài Cô lập & Quy trình Phê duyệt Đa tầng:**
   * Truy cập `/student` $\rightarrow$ chọn tab **Nộp bài tập**: Nhấn nút `⚡ Điền nhanh dữ liệu demo`, sau đó nhấn `Nộp bài ngay`. Hệ thống hiển thị thanh tiến trình 4 bước đẩy bài vào hàng đợi Redis BullMQ và Docker Sandbox.
   * Chuyển sang tab **Kết quả bài nộp**: Quan sát kết quả chấm tự động theo Rubric, phân biệt rõ test case công khai và test case ẩn (`is_hidden = true`).
   * Truy cập `/lecturer` $\rightarrow$ chọn tab **Danh sách Bài nộp**: Mở modal chấm bài để thử nghiệm quy trình **Dual-Lecturer Moderation (`BR-09`)**: duyệt điểm AI, yêu cầu giảng viên 2 chấm lại khi lệch điểm, hoặc ghi biên bản thống nhất điểm cuối cùng.

3. **Thành viên 3 — Trí tuệ Nhân tạo & Quản trị Tài nguyên:**
   * Truy cập `/student` $\rightarrow$ chọn tab **Trợ lý AI AITA**: Chat trực tiếp với mô hình Gemini được huấn luyện theo phương pháp Socratic để nhận gợi ý tối ưu thuật toán.
   * Truy cập `/admin` $\rightarrow$ chọn tab **Kho Khóa AI (Key Pool)**: Xem danh sách key đã mã hóa AES-256 và cơ chế tự động xoay key khi một key bị Rate Limit (HTTP 429).

4. **Thành viên 4 — Đo lường Đóng góp & Trọng tài Nội bộ:**
   * Truy cập `/lecturer` $\rightarrow$ chọn tab **Báo cáo Git Analytics**: Xem biểu đồ tỷ lệ đóng góp (LOC%). Kiểm tra sinh viên có đóng góp < 5% bị gắn cờ cảnh báo `⚠️ FREE-RIDER DETECTED` tự động.
   * Truy cập `/student` $\rightarrow$ chọn tab **Đánh giá Chéo Nhóm**: Điền form đánh giá thành viên cùng nhóm (hệ thống tự động loại bỏ tên chính sinh viên đang đăng nhập để tránh gian lận `BR-08`).
   * Truy cập `/lecturer` $\rightarrow$ chọn tab **Đánh giá Chéo**: Xem ma trận tổng hợp điểm trung bình của từng sinh viên do đồng đội đánh giá.

5. **Thành viên 5 — Trải nghiệm Người dùng & Giao diện Cao cấp:**
   * Nhấn nút đổi ngôn ngữ **VI / EN** trên thanh menu để chuyển đổi giao diện tức thì.
   * Trải nghiệm giao diện Dark Glassmorphic đồng nhất, responsive mượt mà trên cả máy tính và thiết bị di động.

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### Yêu Cầu Môi Trường

| Công cụ | Phiên bản | Ghi chú |
|:---|:---|:---|
| Node.js | >= 20.x (khuyên 22.x) | [nodejs.org](https://nodejs.org) |
| Docker Desktop | >= 4.x | Phải đang **chạy** trước bước 2 |
| Git CLI | >= 2.x | [git-scm.com](https://git-scm.com) |

---

### Bước 1 — Clone dự án

```bash
git clone https://github.com/min098-ui/SWD392_AITA-Intelligent.git
cd SWD392_AITA-Intelligent
```

---

### Bước 2 — Tạo file `.env`

```bash
cp .env.example .env
```

> Mở file `.env` và điền `GEMINI_API_KEY`, `GITHUB_ACCESS_TOKEN` của nhóm vào.

---

### Bước 3 — Khởi động Database & Redis (Docker)

```bash
docker compose up -d
```

> Lệnh này tự động khởi tạo PostgreSQL, nạp 16 bảng từ `schema.sql` và dữ liệu mẫu từ `seed.sql`.

Kiểm tra container đang chạy:

```bash
docker compose ps
```

---

### Bước 4 — Khởi chạy Backend API (Port 5000)

```bash
cd server
npm install
npm run dev
```

- API hoạt động tại: **http://localhost:5000**
- Kiểm tra hệ thống: **http://localhost:5000/api/health**

---

### Bước 5 — Khởi chạy Frontend (Port 3000)

Mở tab terminal mới:

```bash
cd client
npm install
npm run dev
```

- Web Dashboard: **http://localhost:3000**
- 🎓 Sinh viên: http://localhost:3000/student
- 👨‍🏫 Giảng viên: http://localhost:3000/lecturer
- ⚙️ Quản trị: http://localhost:3000/admin

---

## 📌 Quy Tắc Nghiệp Vụ Cốt Lõi (Business Rules)

| Mã | Quy tắc |
|:---|:---|
| **BR-01** | Phân quyền RBAC 3 roles: ADMIN · LECTURER · STUDENT. Mật khẩu lưu dạng Bcrypt (salt = 10) |
| **BR-02** | AI API Key của bên thứ ba phải mã hóa AES-256 trước khi lưu vào CSDL |
| **BR-03** | Code sinh viên chạy trong Docker Container non-root: CPU 0.5 core · RAM 256MB · timeout 10–30s |
| **BR-04** | Khi gặp HTTP 429 (Rate Limit), tự động xoay sang API Key dự phòng ACTIVE (Key Rotation) |
| **BR-05** | Mọi Prompt Template phải có trường `version` (v1.0, v2.0...) để kiểm toán AI |
| **BR-06** | Test case ẩn (`is_hidden = true`): sinh viên chỉ thấy Đạt/Không đạt, không xem được input/output |
| **BR-07** | Tự động phân tích `lines_added`, `lines_deleted` từ GitHub để phát hiện free-rider |
| **BR-08** | Peer audit: ràng buộc DB cấm sinh viên tự đánh giá chính mình (`reviewer_id <> reviewee_id`) |
| **BR-09** | Chấm điểm đa tầng (Dual-Lecturer Moderation): AI hỗ trợ sơ bộ, Giảng viên 1 duyệt & chấm lại, Giảng viên 2 chấm chéo độc lập, hội ý chốt điểm cuối cùng |

---

## 🔑 Tài Khoản Mẫu (Seed Data)

> **Mật khẩu mặc định cho tất cả tài khoản:** `Password@123`

| Vai trò | Email đăng nhập | Tên |
|:---|:---|:---|
| Admin | admin@fpt.edu.vn | System Administrator |
| Giảng viên | giangnv@fe.edu.vn | Dr. Nguyen Van Giang |
| Sinh viên 1 | student1@fpt.edu.vn | Sinh Viên 1 (Auth & Architecture) |
| Sinh viên 2 | student2@fpt.edu.vn | Sinh Viên 2 (Docker Sandbox) |
| Sinh viên 3 | student3@fpt.edu.vn | Sinh Viên 3 (AI Tutor & Prompts) |
| Sinh viên 4 | student4@fpt.edu.vn | Sinh Viên 4 (Git & Peer Audit) |
| Sinh viên 5 | student5@fpt.edu.vn | Sinh Viên 5 (Frontend UI/UX) |