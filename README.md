# AITA-INTELLIGENT

> **AI-Powered Teaching Assistant, Multi-Language Docker Sandbox Autograder & Git Contribution Analytics Platform**  
> **Môn học:** SWD392 – Software Architecture & Design Project (FPT University Quy Nhơn – **Group 4**)

---

## 1. Giới Thiệu Dự Án

**AITA-INTELLIGENT** là hệ thống web hỗ trợ giảng dạy và đánh giá môn học lập trình/công nghệ phần mềm cho Giảng viên, Sinh viên và Quản trị viên, tập trung vào **4 trụ cột nghiệp vụ thực tế đang vận hành**:

1. **Chấm bài cá nhân tự động trong Docker Sandbox 3 ngôn ngữ:** Cô lập mã nguồn **Node.js 20**, **Python 3.11** và **Java 17** qua hàng đợi bất đồng bộ **Redis + BullMQ**, bảo mật Test Case ẩn (`BR-06`), hỗ trợ **Live Sandbox Terminal** và trích xuất bài thi Q1–Q4 từ file `.zip`.
2. **Chấm điểm đa tầng AI + 2 Giảng viên (Dual-Lecturer Moderation – `BR-09`):** Kết hợp AI Pre-grading, Giảng viên 1 duyệt/chấm điểm và chuyển **Giảng viên 2 chấm chéo độc lập**, tự động chốt điểm nếu độ lệch `≤ 0.5` hoặc mở bước **Đồng thuận** nếu độ lệch `> 0.5`.
3. **Gia sư ảo AI Socratic & Studio sinh đề bài (`BR-02`, `BR-04`, `BR-05`):** Hỗ trợ sinh viên gợi ý sửa lỗi theo phương pháp Socratic (theo session hoặc gắn trực tiếp vào bài nộp), hỗ trợ Giảng viên dùng AI sinh đề bài & test cases, đi kèm kho API Key mã hóa **AES-256** và xoay vòng key tự động ở cổng Admin.
4. **Phân tích đóng góp Git & Phát hiện Free-Rider (`BR-07`):** Đồng bộ lịch sử commit thực tế của đồ án nhóm qua `@octokit/rest` kết hợp fallback **Git CLI (`git clone --bare` + `git log --numstat`)**, lọc nhiễu file tự động bằng **Noise Filter** và cung cấp Radar đánh giá đóng góp cho Giảng viên.

---

## 2. Công Nghệ Sử Dụng (Tech Stack Thực Tế)

| Tầng hệ thống | Công nghệ & Thư viện |
| :--- | :--- |
| **Frontend (`client/`)** | Next.js 14 (`App Router`), React 18, TypeScript, Lucide Icons (`lucide-react`), `jszip` (giải nén `.zip` Q1–Q4 ở trình duyệt), Light/Dark Theme (`ThemeToggle`) & đa ngôn ngữ Việt/Anh (`LanguageContext`). |
| **Backend (`server/`)** | Node.js, Express, TypeScript, `bcryptjs`, `jsonwebtoken` (JWT + RBAC), `@google/generative-ai` (Gemini), `@octokit/rest` + Git CLI. |
| **Queue & Sandbox** | Redis (`ioredis`), BullMQ (`bullmq` queue `grading-queue`), Dockerode (`dockerode`, `tar-stream`) điều phối container `aita-sandbox-node:latest` (`node:20-alpine`), `aita-sandbox-python:latest` (`python:3.11-alpine`), `aita-sandbox-java:latest` (`eclipse-temurin:17-alpine`). |
| **Database & Công cụ** | PostgreSQL 16 (`pg`), Prisma Schema (`prisma studio` port `5555`), Docker Compose (`postgres:16-alpine`, `redis:7-alpine`, `adminer` port `8080`). |

---

## 3. Luồng Nghiệp Vụ Thực Tế Của Hệ Thống

### 3.1. Xác thực & Phân quyền 3 vai trò (`auth` – `BR-01`)
* Đăng ký & đăng nhập bằng Email/Mật khẩu (mật khẩu băm `bcryptjs`, cấp Access Token `JWT`), đồng thời hỗ trợ **Google OAuth 2.0** và **GitHub OAuth** qua route handlers tại `client/src/app/api/auth/callback/{google,github}/route.ts`.
* Bảo vệ API bằng `authenticateJWT` và `requireRole(...)` cho 3 vai trò: `STUDENT`, `LECTURER`, `ADMIN`.
* Admin có quyền quản lý trạng thái, vai trò tài khoản và duyệt tài khoản Giảng viên (`PATCH /api/auth/users/:userId/status`, `PATCH /api/auth/users/:userId/role`).

### 3.2. Học phần, Nhóm đồ án & Quản lý Đề bài (`courses`, `teams`, `assignments`)
* Giảng viên/Admin quản lý học phần (`courses`), ghi danh sinh viên (`course_enrollments`), quản lý nhóm đồ án & gắn `repo_url` (`teams`, `team_members`).
* Bài tập phân loại thành **`INDIVIDUAL`** (bài tập/bài thi cá nhân chấm Docker Sandbox) hoặc **`TEAM`** (đồ án nhóm Git), giao cho **toàn bộ lớp (`ALL`)** hoặc **các nhóm chỉ định (`SPECIFIC_TEAMS`** qua `assignment_target_teams`), quản lý trạng thái vòng đời (`Draft`, `Published`, `Closed`, `Archived`) và chính sách nộp trễ.
* Hỗ trợ **Studio AI sinh đề bài & test cases** (`POST /api/assignments/generate-ai`), quản lý Rubric/Test Case (`ACTIVE`, `HIDDEN`, `DRAFT`, `DISABLED`), sắp xếp thứ tự (`PUT /api/assignments/:id/rubrics/reorder`) và chạy thử test case (`POST /api/assignments/:id/test-cases/preview`).

### 3.3. Nộp bài & Chấm tự động tách biệt 2 luồng (`submissions`, `grading` – `BR-03`, `BR-06`)
* **Luồng 1 — Bài tập Cá nhân (`INDIVIDUAL`):**
  1. Sinh viên nhập/dán mã nguồn trực tiếp trên trình soạn thảo hoặc tải lên file `.zip` (client dùng `JSZip` tự động đọc cấu trúc câu Q1–Q4), chọn ngôn ngữ (**Node.js 20**, **Python 3.11**, hoặc **Java 17**).
  2. Có thể chạy thử code ngay trên web bằng **Live Sandbox Terminal** hoặc bấm nộp (`POST /api/submissions`) để đẩy job vào **BullMQ (`grading-queue`)**.
  3. Worker (`grading.worker.ts`) gọi `SandboxService` cấp Docker Container riêng cho từng lần chạy theo chuẩn **BR-03**:
     * **CPU:** `1.0 core` (`NanoCpus = 1_000_000_000`)
     * **RAM:** `256 MB` (vượt ngưỡng sẽ báo `MEMORY_LIMIT_EXCEEDED`)
     * **Mạng:** `NetworkMode: 'none'` (cách ly hoàn toàn mạng ngoài)
     * **Timeout Watchdog:** **`10,000ms`** (Node.js / Python) và **`15,000ms`** (Java 17)
  4. **Bảo mật Test Case Ẩn (`BR-06`):** Khi Sinh viên xem chi tiết kết quả, các test case ẩn (`is_hidden = true` hoặc `status = 'Hidden'`) bị che `input_data` và `expected_output` thành `[PROTECTED TEST CASE]`, chỉ hiển thị kết quả Đạt/Không đạt.
* **Luồng 2 — Đồ án Nhóm (`TEAM`):**
  * Sinh viên/đại diện nhóm nộp **GitHub Repository URL**, **Nhánh (Branch)** và **Commit SHA** (có nút **`⚡ Điền nhanh Repo mẫu`** trên UI).
  * Khi bài tập `TEAM` không có test case `AUTOMATED`, backend lưu bài nộp ở luồng đánh giá đồ án nhóm và **không đưa repo Git vào chạy Docker Sandbox**; việc chấm điểm thực hiện bởi Giảng viên kết hợp dữ liệu phân tích Git Telemetry.
* **Chấm lại (`Regrade`) & Lịch sử chấm:**
  * Giảng viên/Admin có thể bấm chấm lại từng bài (`POST /api/submissions/:id/regrade` hoặc `POST /api/grading/regrade/:submissionId`) hoặc toàn bộ bài tập (`POST /api/assignments/:id/regrade`); lịch sử các lần chấm được ghi nhận trên bảng `grading_jobs` (`attempt_number`, `regrade_reason`, `total_score`, `max_score`) và truy vấn qua `GET /api/submissions/:id/grading-history`.

### 3.4. Quy trình Chấm Chéo 2 Giảng Viên — Dual-Lecturer Moderation (`BR-09`)
* Tại modal chi tiết bài nộp trên trang Giảng viên (`/lecturer`), quy trình gồm 3 bước tương ứng 5 API trong `grading.routes.ts`:
  1. **AI & GV1 Xem xét:** Phê duyệt kết quả AI (`POST /api/grading/review/approve-ai/:submissionId`), tự chấm trực tiếp (`POST /api/grading/review/manual-grade/:submissionId`), hoặc nhập điểm & nhận xét của **GV1** rồi gửi yêu cầu **GV2 chấm chéo độc lập** (`POST /api/grading/review/request-second-opinion/:submissionId`).
  2. **GV2 Chấm chéo độc lập** (`POST /api/grading/review/second-opinion/:submissionId`):
     * Nếu độ lệch điểm `|GV1 - GV2| ≤ 0.5`: Hệ thống tự động lấy trung bình và chốt điểm (`FINALIZED`).
     * Nếu độ lệch điểm `> 0.5`: Hệ thống chuyển sang bước **Biên bản Đồng thuận**.
  3. **Biên bản Đồng thuận** (`POST /api/grading/review/consensus/:submissionId`): Nhập điểm đồng thuận cuối cùng và lý do chốt điểm.
* Hệ thống dữ liệu mẫu cung cấp 2 tài khoản Giảng viên để kiểm thử đầy đủ luồng này: **Yen12 Yen** (`yeny36306@gmail.com`) và **Nguyen Lan** (`n011vynt@gmail.com`).

### 3.5. Gia sư ảo AI Socratic & Kho khóa AES-256 (`ai-tutor` – `BR-02`, `BR-04`, `BR-05`)
* Sinh viên trò chuyện với gia sư AI theo session độc lập (`POST /api/ai-tutor/sessions`, `POST /api/ai-tutor/sessions/:sessionId/chat`) hoặc gắn trực tiếp theo bài nộp (`GET/POST /api/ai-tutor/:submissionId/messages`, `/chat`).
* Hệ thống sử dụng `PromptTemplate` kiểu Socratic để gợi mở tư duy thay vì viết hộ lời giải; tự động xoay vòng API Key khi key gặp lỗi giới hạn/quota; API Key được mã hóa **AES-256** trong DB.

### 3.6. Phân tích Đóng góp Git & Phát hiện Free-Rider (`git-analytics` – `BR-07`)
* Đồng bộ commit theo nhánh qua `POST /api/git/:teamId/sync` sử dụng `@octokit/rest` và fallback **Git CLI (`git clone --bare` + `git log --numstat`)** để đọc đủ lịch sử commit ngay cả với repository nhiều commit.
* Lọc bỏ file tự động sinh/thư viện/lock qua `noise-filter.service.ts` trước khi tính LOC thêm/xóa và tỷ lệ đóng góp.
* **Trang Sinh viên (`/student`):** Xem tổng commit/LOC nhóm và cá nhân, chuyển nhánh phân tích, sử dụng nút **`Đổi link`** để cập nhật URL GitHub trực tiếp; hệ thống **ẩn cảnh báo đỏ `< 5%` Free-Rider** khỏi giao diện sinh viên.
* **Trang Giảng viên (`/lecturer`):** Xem Radar đóng góp từng thành viên và cảnh báo Free-Rider (`GET /api/git/:teamId/free-riders`, ngưỡng `< 5%`).

### 3.7. Đánh giá chéo nội bộ nhóm (`peer-audits` – `BR-08`)
* **Phạm vi triển khai hiện tại:** Đã hoàn thiện ở tầng **Backend REST API** (`GET /api/peer-audits/:teamId`, `GET /api/peer-audits/team/:teamId/summary`, `GET /api/peer-audits/team/:teamId/assignment/:assignmentId`, `GET /api/peer-audits/team/:teamId/my-reviews`, `POST /api/peer-audits`), ràng buộc SQL `CHECK (reviewer_id <> reviewee_id)` trong PostgreSQL (`BR-08`) và kịch bản kiểm thử tự động `npm run test:member4`.
* *(Lưu ý: Giao diện Web Dashboard `/student` và `/lecturer` hiện chưa mở tab UI riêng cho Peer Audit.)*

---

## 4. Các Cổng Giao Diện Web (`client/`)

Hệ thống hỗ trợ chuyển đổi **Light / Dark Mode** và **Tiếng Việt / English** trên toàn bộ các trang:

* **Trang xác thực (`/login`, `/register`, `/auth/callback`):** Đăng nhập Email/Password, Google OAuth, GitHub OAuth và đăng ký tài khoản.
* **Cổng Sinh viên (`/student`):**
  * `Học phần` (`courses`): Xem học phần đã ghi danh và thành viên nhóm đồ án.
  * `Nộp bài & Sandbox` (`submit`): Phân tách rõ `Bài tập cá nhân` (Editor / Upload `.zip` Q1–Q4 + Live Sandbox Terminal) và `Đồ án nhóm (Git)` (Nộp Repo URL / Branch / Commit SHA + nút `Điền nhanh Repo mẫu`).
  * `Kết quả & AI` (`results`): Xem điểm, chi tiết từng test case (`[PROTECTED TEST CASE]` với test ẩn), mã nguồn đã nộp và lịch sử chấm (`Bài tập cá nhân` & `Đồ án nhóm (Git)`).
  * `AI Tutor Chat` (`chat`): Chat Socratic với Gemini theo phiên hoặc theo bài nộp.
  * Phân tích Git (`analytics`): Theo dõi số commit, LOC sau Noise Filter, đổi link repo và chọn nhánh đồng bộ.
* **Cổng Giảng viên (`/lecturer`):**
  * Nhóm **Quản lý Lớp học:** `Danh sách học phần` (`courses`), `Nhóm đồ án` (`teams`), `Danh sách sinh viên` (`students`).
  * Nhóm **Đề bài & Bài tập:** `Tất cả đề bài` & `Rubrics & Test Cases` (`config`, tích hợp Studio AI tạo đề bài và preview test cases), `Chấm bài tự động` (`overview`) chia thành `Bài tập cá nhân` (kèm Modal chấm chéo GV1–GV2 `BR-09`, tab code Q1–Q4, nút Regrade & Lịch sử chấm) và `Đồ án nhóm (Git)` (Bảng điểm & Radar Git Telemetry + cảnh báo Free-Rider `BR-07`).
* **Cổng Quản trị viên (`/admin` — 6 tabs):**
  1. `Kho Khóa AI (Key Pool)` (`keys`)
  2. `Mẫu Prompt Hệ thống` (`prompts`)
  3. `Tài khoản & Phân quyền` (`users`)
  4. `Học phần & Giảng viên` (`courses`)
  5. `Giám sát Máy chủ & Docker` (`health`)
  6. `Cơ sở Dữ liệu (PostgreSQL)` (`database` — tra cứu bảng qua `/api/auth/db-inspect`)

---

## 5. Danh Sách Endpoints API Chính

Tất cả route dưới đây được mount tại `server/src/index.ts` (kèm `GET /api/health`):

| Prefix | Endpoints thực tế |
| :--- | :--- |
| `/api/auth` | `POST /register`, `POST /login`, `POST /google`, `POST /github`, `GET /me`, `GET /users`, `PATCH /users/:userId/status`, `PATCH /users/:userId/role`, `GET /db-inspect`, `GET /db-inspect/:tableName` |
| `/api/courses` | `GET /`, `POST /`, `GET /:id`, `POST /:id/enroll`, `GET /:id/students`, `GET /:id/teams`, `PUT /:id`, `PATCH /:id/lecturer`, `DELETE /:id` |
| `/api/teams` | `GET /`, `POST /`, `GET /:teamId`, `PUT /:teamId`, `DELETE /:teamId`, `POST /:teamId/members`, `DELETE /:teamId/members/:teamMemberId` |
| `/api/assignments` | `GET /`, `GET /:id`, `POST /generate-ai`, `POST /`, `PUT /:id`, `PATCH /:id/status`, `DELETE /:id`, `POST /:id/test-cases/preview`, `PUT /:id/rubrics/reorder`, `POST /:id/rubrics`, `PUT /:id/rubrics/:rubricId`, `DELETE /:id/rubrics/:rubricId`, `POST /:id/regrade` |
| `/api/submissions` | `GET /`, `GET /:id`, `POST /`, `GET /:id/results`, `POST /:id/regrade`, `GET /:id/grading-history` |
| `/api/grading` | `GET /:jobId/results`, `POST /regrade/:submissionId`, `POST /review/approve-ai/:submissionId`, `POST /review/request-second-opinion/:submissionId`, `POST /review/second-opinion/:submissionId`, `POST /review/consensus/:submissionId`, `POST /review/manual-grade/:submissionId` |
| `/api/ai-tutor` | `POST /sessions`, `GET /history`, `POST /chat`, `GET /sessions/:sessionId/messages`, `POST /sessions/:sessionId/chat`, `GET /:submissionId/messages`, `POST /:submissionId/chat`, `GET /admin/keys`, `POST /admin/keys`, `PATCH /admin/keys/:id/status`, `GET /admin/prompts`, `POST /admin/prompts` |
| `/api/git` | `POST /:teamId/sync`, `GET /:teamId/commits`, `GET /:teamId/free-riders`, `GET /:teamId/team-health` |
| `/api/peer-audits` | `GET /:teamId`, `GET /team/:teamId/summary`, `GET /team/:teamId/assignment/:assignmentId`, `GET /team/:teamId/my-reviews`, `POST /` |

*(Xem thêm bộ sưu tập Postman có sẵn tại `postman/AITA_Intelligent_API.postman_collection.json` và `postman/AITA_Local.postman_environment.json`.)*

---

## 6. Cấu Trúc Thư Mục Dự Án

```text
SWD392_AITA-Intelligent/
├── client/                                   # Next.js 14 App Router Frontend
│   ├── .env.example                          # Mẫu biến môi trường Frontend (copy -> client/.env.local)
│   ├── package.json
│   └── src/
│       ├── app/
│       │   ├── (dashboard)/
│       │   │   ├── student/page.tsx          # Cổng Sinh viên
│       │   │   ├── lecturer/page.tsx         # Cổng Giảng viên
│       │   │   └── admin/page.tsx            # Cổng Quản trị viên (6 tabs)
│       │   ├── api/auth/callback/
│       │   │   ├── github/route.ts           # GitHub OAuth Callback Handler
│       │   │   └── google/route.ts           # Google OAuth Callback Handler
│       │   ├── auth/callback/page.tsx
│       │   ├── login/page.tsx
│       │   ├── register/page.tsx
│       │   ├── layout.tsx
│       │   └── page.tsx
│       ├── components/                       # AitaLogo, LanguageSwitcher, Navigation, ThemeToggle, Profile Modals
│       └── context/LanguageContext.tsx
├── server/                                   # Express + TypeScript Backend & BullMQ Worker
│   ├── .env.example                          # Mẫu biến môi trường Backend (copy -> server/.env)
│   ├── package.json
│   ├── prisma/schema.prisma                  # Schema dùng cho Prisma Studio
│   ├── sandbox-images/                       # Dockerfiles Sandbox Runner
│   │   ├── Dockerfile.node                   # Node.js 20 Alpine Sandbox
│   │   ├── Dockerfile.python                 # Python 3.11 Alpine Sandbox
│   │   ├── Dockerfile.java                   # Eclipse Temurin Java 17 Alpine Sandbox
│   │   └── Dockerfile.runner
│   └── src/
│       ├── index.ts                          # Entry point API, mount 9 modules, khởi động Worker & Auto-seed
│       ├── common/auth.middleware.ts         # authenticateJWT & requireRole
│       ├── config/
│       │   ├── db.ts
│       │   └── auto-seed.ts
│       ├── modules/
│       │   ├── auth/                         # auth.routes.ts
│       │   ├── courses/                      # courses.routes.ts
│       │   ├── teams/                        # teams.routes.ts
│       │   ├── assignments/                  # assignments.routes.ts
│       │   ├── submissions/                  # submissions.routes.ts
│       │   ├── grading/                      # grading.routes.ts, grading.queue.ts, grading.worker.ts, sandbox.service.ts, grading.types.ts
│       │   ├── ai-tutor/                     # ai-tutor.routes.ts, ai-tutor.service.ts, crypto.service.ts
│       │   ├── git-analytics/                # git.routes.ts, noise-filter.service.ts
│       │   └── peer-audits/                  # peer-audits.routes.ts
│       ├── scripts/                          # Script reset DB, seed dữ liệu mẫu & demo scenarios
│       └── test/                             # Bộ kiểm thử verify-member1..5 & 8 test suites chuyên sâu
├── database/
│   ├── schema.sql                            # 17 bảng PostgreSQL cốt lõi
│   ├── seed.sql                              # Tài khoản mẫu, học phần, nhóm & dữ liệu khởi tạo
│   ├── migration_assignment_lifecycle.sql
│   ├── migration_assignment_target_groups.sql
│   ├── migration_direct_code.sql
│   ├── migration_regrade_history.sql
│   └── migration_test_case_management.sql
├── docs/
│   ├── BANG_PHAN_CONG_NHIEM_VU_GROUP4.md
│   ├── SWD392_SRS_AITA-Intelligent_Group 4.docx
│   └── thanhvien1.md .. thanhvien5.md
├── postman/
│   ├── AITA_Intelligent_API.postman_collection.json
│   └── AITA_Local.postman_environment.json
├── docker-compose.yml                        # PostgreSQL 16 (5432), Redis 7 (6379), Adminer (8080)
├── enable-docker-features.ps1
└── package.json                              # Workspace scripts gốc (dev, test:member1..5, db:reset, studio)
```

> **17 bảng trong `database/schema.sql`:** `users`, `courses`, `course_enrollments`, `teams`, `team_members`, `prompt_templates`, `ai_api_keys`, `assignments`, `assignment_target_teams`, `rubric_rules`, `submissions`, `grading_jobs`, `grading_results`, `git_commits`, `peer_audits`, `tutor_chat_sessions`, `tutor_chat_messages`.

---

## 7. Hướng Dẫn Cài Đặt & Chạy Hệ Thống

### Yêu cầu môi trường
* **Node.js** `>= 20.x` và **npm**
* **Docker Desktop** (đang bật Linux Containers để chạy PostgreSQL, Redis và Docker Sandbox)
* **Git CLI** (để tính năng đồng bộ lịch sử commit CLI fallback hoạt động đầy đủ)

### Bước 1: Cấu hình biến môi trường
Dự án tách cấu hình riêng cho Backend và Frontend (không dùng file `.env` ở thư mục gốc):

```bash
# Backend -> server/.env
cp server/.env.example server/.env

# Frontend -> client/.env.local
cp client/.env.example client/.env.local
```
*Điền `GEMINI_API_KEY` (hoặc thêm key trong màn Admin -> Kho Khóa AI) và thông số `GOOGLE_CLIENT_ID` / `GITHUB_CLIENT_ID` nếu sử dụng đăng nhập OAuth.*

### Bước 2: Khởi động PostgreSQL, Redis và Adminer bằng Docker Compose
```bash
docker compose up -d
```
Lệnh này khởi tạo 3 dịch vụ:
* **PostgreSQL 16:** `localhost:5432` (tự động nạp `database/schema.sql` và `database/seed.sql` ở lần tạo volume đầu tiên)
* **Redis 7:** `localhost:6379`
* **Adminer (UI quản lý DB):** `http://localhost:8080`

### Bước 3: Cài đặt dependencies & khởi chạy ứng dụng
Tại thư mục gốc `SWD392_AITA-Intelligent/`:

```bash
# Cài dependencies cho workspace gốc, server và client
npm install
npm --prefix server install
npm --prefix client install

# (Tùy chọn) Reset sạch DB theo schema, migrations và seed mới nhất
npm run db:reset

# Chạy đồng thời cả Backend (port 5000) và Frontend (port 3000)
npm run dev
```

Hoặc chạy tách từng tiến trình ở 2 terminal:
* Backend API + Grading Worker: `npm run dev:server` (`http://localhost:5000`, health check tại `http://localhost:5000/api/health`)
* Frontend Web App: `npm run dev:client` (`http://localhost:3000`)
* Prisma Studio (nếu cần xem/sửa DB trực quan): `npm run studio` (`http://localhost:5555`)

---

## 8. Tài Khoản Mẫu (`database/seed.sql`)

Mật khẩu chung cho toàn bộ tài khoản seed mặc định là **`Password@123`**:

| Vai trò | Họ tên | Email | Ghi chú sử dụng |
| :--- | :--- | :--- | :--- |
| **ADMIN** | System Administrator | `admin@fpt.edu.vn` | Quản trị Key Pool, Prompt, User & DB |
| **LECTURER** | Yen12 Yen | `yeny36306@gmail.com` | Giảng viên 1 (chính / chấm bài & đề bài) |
| **LECTURER** | Nguyen Lan | `n011vynt@gmail.com` | Giảng viên 2 (chấm chéo `BR-09`) |
| **STUDENT** | Lê Nguyễn Ánh Mai | `lenguyenlinhnhi2110@gmail.com` | Thành viên nhóm Group 4 |
| **STUDENT** | Nguyễn Tường Vy | `vyntqe180099@fpt.edu.vn` | Thành viên nhóm Group 4 |
| **STUDENT** | Đỗ Trần Đăng Khoa | `dotrandangkhoa17@gmail.com` | Thành viên nhóm Group 4 |
| **STUDENT** | Nguyễn Quốc Thanh Phong | `tfongcs05@gmail.com` | Thành viên nhóm Group 4 |
| **STUDENT** | Đinh Gia Huy | `dinhgiahuylol12345@gmail.com` | Thành viên nhóm Group 4 |

*(Ngoài ra `database/seed.sql` còn khởi tạo thêm các tài khoản Admin nhóm và danh sách sinh viên mẫu phục vụ quản lý lớp & phân nhóm.)*

---

## 9. Kiểm Thử Tự Động (Test Suites)

Từ thư mục gốc `SWD392_AITA-Intelligent/`, chạy các bộ test tích hợp theo từng phân hệ:

```bash
npm run test:member1   # Auth RBAC, Courses & Teams
npm run test:member2   # Docker Sandbox BR-03, Hidden Test Case BR-06 & Dual-Lecturer BR-09
npm run test:member3   # AI Tutor Socratic, Key Pool AES-256 & Key Rotation
npm run test:member4   # Git Analytics BR-07 Noise Filter & Peer Audit API/DB BR-08
npm run test:member5   # Frontend Integration & End-to-End Flow
```

Các test suite chuyên sâu tại thư mục `server/`:

```bash
npm --prefix server run test:direct-submission
npm --prefix server run test:test-case-mgmt
npm --prefix server run test:grading-engine
npm --prefix server run test:regrade-history
npm --prefix server run test:target-groups
npm --prefix server run test:lifecycle
npm --prefix server run test:noise-filter
```

---

## 10. Đội Ngũ Thực Hiện (Group 4 – SWD392)

| Thành viên | Vai trò chính | Phân hệ phụ trách |
| :--- | :--- | :--- |
| **Lê Nguyễn Ánh Mai** | Software Architect & Core Auth Engineer (Leader) | Kiến trúc hệ thống, Docker Compose, DB Schema, `auth`, `courses`, `teams` |
| **Nguyễn Tường Vy** | Docker Sandbox & Autograding Engineer | Docker Sandbox 3 ngôn ngữ (`BR-03`), BullMQ Worker, `assignments`, `submissions`, `grading` (`BR-06`, `BR-09`) |
| **Đỗ Trần Đăng Khoa** | AI Engine & Key Rotation Engineer | `ai-tutor`, Key Pool AES-256, Prompt Versioning, AI Pre-grading (`BR-02`, `BR-04`, `BR-05`) |
| **Đinh Gia Huy** | Git Analytics & Peer Audit Engineer | `git-analytics` (`@octokit/rest` + Git CLI, Noise Filter `BR-07`), `peer-audits` API (`BR-08`) |
| **Nguyễn Quốc Thanh Phong** | Frontend Lead & UI/UX & QA | Toàn bộ Next.js 14 UI (`student`, `lecturer`, `admin`, OAuth UI) & kiểm thử |
