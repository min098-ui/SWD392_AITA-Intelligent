# AITA-INTELLIGENT: AI-Powered Teaching Assistant & AST Code Analytics Platform
> **Course:** SWD392 – Software Architecture & Design Project (FPT University Quy Nhơn)  
> **Group:** Group 4  
> **Hệ thống:** Chấm code tự động trong Docker Sandbox, Trợ giảng AI gợi mở (Socratic Tutor), Phân tích đóng góp Git & Đánh giá chéo nội bộ

---

## 📂 Cấu Trúc Dự Án (Architecture & Directory Structure)

`
SWD392_Group4/
├── client/                     # Frontend Web App: Next.js 14 + React 18 + TypeScript (Port 3000)
│   ├── src/app/                # App Router: Trang chủ, Dashboard Sinh viên, Giảng viên, Quản trị
│   ├── src/components/         # Reusable UI Components (Navigation, Chatbot, Tables)
│   └── src/styles/             # Global CSS Design System (Dark Glassmorphic UI/UX)
├── server/                     # Backend Core API & Sandbox Runner: Express + TypeScript (Port 5000)
│   ├── sandbox-images/         # Dockerfile Runner cô lập tài nguyên cho bài nộp sinh viên
│   └── src/
│       ├── config/             # Cấu hình PostgreSQL Pool, Redis, Environment
│       ├── common/             # Middleware xác thực bảo mật JWT, Phân quyền RBAC
│       └── modules/            # Các phân hệ nghiệp vụ độc lập:
│           ├── auth/           # Đăng nhập, cấp Token JWT
│           ├── courses/        # Quản lý môn học, lớp học
│           ├── assignments/    # Quản lý bài tập, cấu hình rubric test case ẩn/hiện
│           ├── submissions/    # Nộp bài (Git hash + artifact), đưa vào hàng đợi chấm
│           ├── ai-tutor/       # Trợ giảng AI Chatbot, Key Pool & Xoay tua Key (Rotation)
│           ├── git-analytics/  # Kéo commit history, phân tích lines added/deleted
│           └── peer-audits/    # Đánh giá chéo giữa các thành viên trong nhóm
├── database/                   # Quản trị Cơ sở dữ liệu (PostgreSQL 16)
│   ├── schema.sql              # DDL chuẩn 14 bảng theo ERD & SRS
│   └── seed.sql                # Dữ liệu khởi tạo mẫu (Users, Courses, Teams, Rubrics, Prompts)
├── docs/                       # Tài liệu SRS đặc tả yêu cầu môn học (.docx)
├── docker-compose.yml          # Docker Compose khởi chạy PostgreSQL (5432) & Redis (6379)
├── .env.example                # Mẫu cấu hình biến môi trường
└── README.md                   # Tài liệu hướng dẫn cho nhóm
`

---

## 👥 Bảng Phân Chia Công Việc 5 Thành Viên (SWD392 Nhóm 4)

| STT | Thành viên | Trách nhiệm chính (Role) | Use Cases & Phân hệ phụ trách (Theo SRS) |
| :---: | :--- | :--- | :--- |
| **1** | **Thành viên 1** | **Software Architect & Core Auth** | • Khung kiến trúc tổng thể, System Context (C4 Model Level 1)<br>• Module Auth (JWT), Phân quyền RBAC (Admin, Lecturer, Student)<br>• Quản lý Khóa học & Nhóm: users, courses, 	eams, 	eam_members<br>• Use Cases: **UC-01, UC-06, UC-09, UC-13, UC-14** |
| **2** | **Thành viên 2** | **Docker Sandbox Runner & Autograding** | • Xây dựng Dockerfile runner cô lập tài nguyên (CPU 0.5 core, RAM 256MB)<br>• Quản lý hàng đợi chấm bài bất đồng bộ (grading_jobs)<br>• Cấu hình Rubric test cases công khai / ẩn (ssignments, ubric_rules)<br>• Use Cases: **UC-02, UC-07, UC-08, UC-10** |
| **3** | **Thành viên 3** | **AI Engine, Prompting & Key Rotation** | • Tích hợp LLM API (Google Gemini / OpenAI)<br>• Thuật toán **Key Rotation** khi gặp lỗi Rate Limit HTTP 429 (NFR-REL-02)<br>• Chatbot Trợ giảng AI Socratic & Tự động sinh Feedback chấm code<br>• Bảng phụ trách: prompt_templates, i_api_keys, 	utor_chat_messages<br>• Use Cases: **UC-04, UC-15, UC-16** |
| **4** | **Thành viên 4** | **Git Analytics & Peer Audit Engine** | • Tích hợp GitHub REST API: Kéo commit logs, đếm lines_added, lines_deleted<br>• Thuật toán phát hiện Free-Rider dựa trên độ lệch đóng góp<br>• Hệ thống đánh giá chéo nội bộ nhóm theo vòng (peer_audits)<br>• Bảng phụ trách: git_commits, peer_audits, database/schema.sql<br>• Use Cases: **UC-05, UC-11, UC-12** |
| **5** | **Thành viên 5** | **Frontend Lead, UI/UX & QA Testing** | • Xây dựng toàn bộ giao diện Web App (Next.js 14 + Dark Glassmorphic UI)<br>• Màn hình Sinh viên: Nộp bài, xem rubric kết quả test case, chat AI<br>• Màn hình Giảng viên: Soi biểu đồ commit Git, cấu hình test cases ẩn<br>• Màn hình Admin: Quản lý kho API Key & phiên bản Prompts<br>• Kịch bản kiểm thử (QA Test cases) & Trình chiếu Demo |

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy Cho Thành Viên

### 1. Yêu Cầu Môi Trường
* **Node.js:** Phiên bản >= 20.x (Khuyên dùng 22.x)
* **Docker Desktop:** Đang chạy (để khởi động PostgreSQL 16 & Redis 7)
* **Git CLI:** Đã cài đặt trên máy

---

### 2. Khởi Động Cơ Sở Dữ Liệu & Redis (Docker)
Mở terminal tại thư mục gốc dự án (C:\SWD392_Group4) và chạy:
`ash
docker compose up -d
`
> *(Lệnh này sẽ tự động khởi tạo database PostgreSQL, nạp toàn bộ 14 bảng trong schema.sql và nạp sẵn dữ liệu mẫu trong seed.sql)*

---

### 3. Khởi Chạy Backend API (Port 5000)
Mở một tab terminal mới:
`ash
cd server
npm install
npm run dev
`
* Backend API hoạt động tại: **http://localhost:5000**
* Kiểm tra trạng thái hệ thống: **http://localhost:5000/api/health**

---

### 4. Khởi Chạy Frontend Client (Port 3000)
Mở thêm một tab terminal mới:
`ash
cd client
npm install
npm run dev
`
* Truy cập Web Dashboard tại: **http://localhost:3000**
  * 🎓 **Không gian Sinh viên:** http://localhost:3000/student
  * 👨‍🏫 **Không gian Giảng viên:** http://localhost:3000/lecturer
  * ⚙️ **Không gian Quản trị:** http://localhost:3000/admin

---

## 📌 Các Quy Tắc Nghiệp Vụ Cốt Lõi (Business Rules & NFRs Summary)

* **BR-01 (Role-Based Access Control):** Hệ thống phân quyền chặt chẽ 3 roles (ADMIN, LECTURER, STUDENT). Toàn bộ mật khẩu lưu dưới dạng mã hóa Bcrypt salt rounds = 10.
* **BR-02 (API Key Security):** Khóa AI API của bên thứ ba (Google Gemini, OpenAI) phải được mã hóa chuẩn AES-256 (key_value_encrypted) trước khi lưu vào CSDL.
* **BR-03 (Sandbox Isolation Security):** Code sinh viên được thực thi trong Docker Container non-root, cấm truy cập mạng host, giới hạn CPU 0.5 core, RAM tối đa 256MB, timeout từ 10–30 giây để chống tấn công DoS hoặc vòng lặp vô tận.
* **BR-04 (Dynamic Key Rotation):** Khi gặp mã lỗi HTTP 429 (Rate Limit Exceeded) hoặc hết quota từ nhà cung cấp LLM, hệ thống tự động xoay tua sang API Key dự phòng đang ở trạng thái ACTIVE mà không làm gián đoạn bài chấm.
* **BR-05 (Prompt Template Versioning):** Mọi template prompt phục vụ chấm bài hoặc trợ giảng phải có thuộc tính ersion (v1.0, v2.0) để đảm bảo khả năng tái lập và kiểm toán tính minh bạch của AI.
* **BR-06 (Hidden Test Cases):** Giảng viên có quyền thiết lập cờ is_hidden = true trên các test cases kiểm thử biên. Sinh viên chỉ thấy kết quả Đạt/Không đạt mà không thể xem dữ liệu input/expected output bí mật.
* **BR-07 (Anti-Free-Riding Tracking):** Tự động phân tích commit SHA, author email từ GitHub repository. Thống kê tỷ lệ đóng góp dòng mã (lines_added, lines_deleted) để giảng viên nhận diện thành viên ỷ lại trong nhóm.
* **BR-08 (Peer Audit Integrity):** Sinh viên thực hiện đánh giá chéo nội bộ nhóm theo từng vòng (udit_round). Ràng buộc CSDL cấm sinh viên tự đánh giá chính mình (eviewer_id <> reviewee_id).

---

## 🔑 Tài Khoản Mẫu Thử Nghiệm (Seed Data Credentials)
* **Mật khẩu mặc định cho tất cả tài khoản:** Password@123

| Vai trò | Email đăng nhập | Tên hiển thị |
| :--- | :--- | :--- |
| **Quản trị viên (Admin)** | dmin@fpt.edu.vn | System Administrator |
| **Giảng viên (Lecturer)** | giangnv@fe.edu.vn | Dr. Nguyen Van Giang |
| **Sinh viên 1** | student1@fpt.edu.vn | Sinh Viên 1 (Module Architecture & Auth) |
| **Sinh viên 2** | student2@fpt.edu.vn | Sinh Viên 2 (Module Docker Sandbox) |
| **Sinh viên 3** | student3@fpt.edu.vn | Sinh Viên 3 (Module AI Tutor & Prompts) |
| **Sinh viên 4** | student4@fpt.edu.vn | Sinh Viên 4 (Module Git & Peer Audit) |
| **Sinh viên 5** | student5@fpt.edu.vn | Sinh Viên 5 (Module Frontend UI/UX) |