# AITA-INTELLIGENT: AI-Powered Teaching Assistant & AST Code Analytics Platform

> **Môn học:** SWD392 – Software Architecture & Design Project (FPT University Quy Nhơn)
> **Nhóm:** Group 4
> **Hệ thống:** Chấm code tự động trong Docker Sandbox · Trợ giảng AI Socratic · Phân tích đóng góp Git · Đánh giá chéo nội bộ nhóm

---

## 📂 Cấu Trúc Dự Án

```
SWD392_Group4/
├── client/                     # Frontend: Next.js 14 + React 18 + TypeScript (Port 3000)
│   └── src/
│       ├── app/                # App Router — Trang chủ, Dashboard Sinh viên / Giảng viên / Admin
│       ├── components/         # UI Components tái sử dụng (Navigation, Chatbot, Tables)
│       └── styles/             # Global CSS Design System (Dark Glassmorphic UI/UX)
│
├── server/                     # Backend API & Sandbox Runner: Express + TypeScript (Port 5000)
│   ├── sandbox-images/         # Dockerfile Runner cô lập tài nguyên cho bài nộp sinh viên
│   └── src/
│       ├── config/             # Cấu hình PostgreSQL Pool, Redis, Environment
│       ├── common/             # Middleware JWT, Phân quyền RBAC
│       └── modules/
│           ├── auth/           # Đăng nhập, cấp Token JWT
│           ├── courses/        # Quản lý môn học & lớp học
│           ├── assignments/    # Quản lý bài tập, rubric test case ẩn/hiện
│           ├── submissions/    # Nộp bài (Git hash), đưa vào hàng đợi chấm
│           ├── ai-tutor/       # Chatbot Trợ giảng AI, Key Pool & Rotation
│           ├── git-analytics/  # Kéo commit history, phân tích lines added/deleted
│           └── peer-audits/    # Đánh giá chéo giữa các thành viên trong nhóm
│
├── database/                   # Cơ sở dữ liệu PostgreSQL 16
│   ├── schema.sql              # DDL 14 bảng theo ERD & SRS
│   └── seed.sql                # Dữ liệu mẫu khởi tạo (Users, Courses, Teams, Rubrics)
│
├── docs/                       # Tài liệu SRS đặc tả yêu cầu môn học
├── docker-compose.yml          # Khởi chạy PostgreSQL (5432) & Redis (6379)
├── .env.example                # Mẫu cấu hình biến môi trường
└── README.md
```

---

## 👥 Phân Chia Công Việc — 5 Thành Viên

| STT | Thành viên | Role | Phân hệ phụ trách |
|:---:|:---|:---|:---|
| **1** | Thành viên 1 | Software Architect & Core Auth | Module `auth`, `courses`, `teams` · UC-01, UC-06, UC-09 |
| **2** | Thành viên 2 | Docker Sandbox & Autograding | Module `assignments`, `submissions`, `grading` · UC-02, UC-07, UC-08 |
| **3** | Thành viên 3 | AI Engine & Key Rotation | Module `ai-tutor`, `prompt_templates`, `ai_api_keys` · UC-04, UC-15, UC-16 |
| **4** | Thành viên 4 | Git Analytics & Peer Audit | Module `git-analytics`, `peer-audits`, `database` · UC-05, UC-11, UC-12 |
| **5** | Thành viên 5 | Frontend Lead & UI/UX & QA | Toàn bộ `client/` — Dashboard Student / Lecturer / Admin |

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

> Lệnh này tự động khởi tạo PostgreSQL, nạp 14 bảng từ `schema.sql` và dữ liệu mẫu từ `seed.sql`.

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