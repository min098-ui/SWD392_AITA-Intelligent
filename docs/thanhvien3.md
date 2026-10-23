# BÁO CÁO TOÀN DIỆN CÔNG VIỆC THÀNH VIÊN 3 (THANHVIEN3.MD)

> **Dự án:** AITA-INTELLIGENT — AI-Powered Teaching Assistant & AST Code Analytics Platform  
> **Môn học:** SWD392 – Software Architecture & Design Project (FPT University Quy Nhơn)  
> **Nhóm thực hiện:** Group 4  
> **Họ và tên sinh viên:** **Đỗ Trần Đăng Khoa** (`dotrandangkhoa17@gmail.com`)  
> **Vai trò:** **Thành Viên 3 — AI Engine & Key Rotation Engineer**  
> **Nhánh Git phụ trách:** `Khoa` / `feature/ai-engine-key-rotation`  
> **Các bảng Database phụ trách:** `ai_api_keys`, `prompt_templates`, `tutor_chat_sessions`, `tutor_chat_messages`  

---

## 📑 MỤC LỤC

1. [Tổng Quan Vai Trò & Trách Nhiệm](#1-tổng-quan-vai-trò--trách-nhiệm)
2. [Các Quy Tắc Nghiệp Vụ Phụ Trách (Business Rules: BR-02, BR-04, BR-05, BR-09)](#2-các-quy-tắc-nghiệp-vụ-phụ-trách-business-rules)
3. [Kiến Trúc Kỹ Thuật AI Engine & Key Pool](#3-kiến-trúc-kỹ-thuật-ai-engine--key-pool)
4. [Chi Tiết Triển Khai Kỹ Thuật (4 Trọng Tâm)](#4-chi-tiết-triển-khai-kỹ-thuật)
   - [4.1. Module CryptoService — Chuẩn Mã Hóa 2 Chiều AES-256-GCM (BR-02)](#41-module-cryptoservice--chuẩn-mã-hóa-2-chiều-aes-256-gcm-br-02)
   - [4.2. Logic Xoay Tua Key Pool Tự Động & Xử Lý HTTP 429 Quota Exceeded (BR-04)](#42-logic-xoay-tua-key-pool-tự-động--xử-lý-http-429-quota-exceeded-br-04)
   - [4.3. Quản Lý Phiên Bản Prompt Template Versioning & Audit Trail (BR-05)](#43-quản-lý-phiên-bản-prompt-template-versioning--audit-trail-br-05)
   - [4.4. Trợ Giảng Socratic & Tích Hợp AI Code Review Đa Tầng (BR-09)](#44-trợ-giảng-socratic--tích-hợp-ai-code-review-đa-tầng-br-09)
5. [Danh Mục API Endpoints Phụ Trách](#5-danh-mục-api-endpoints-phụ-trách)
6. [Kết Quả Kiểm Thử Thực Tế (verify-member3.ts: 27/27 PASS 100%)](#6-kết-quả-kiểm-thử-thực-tế-verify-member3ts-2727-pass-100)
7. [Hướng Dẫn Demo Khi Bảo Vệ Đồ Án](#7-hướng-dẫn-demo-khi-bảo-vệ-đồ-án)
8. [Bộ Câu Hỏi Vấn Đáp & Phản Biện Chuyên Sâu (Defense Q&A / FAQs)](#8-bộ-câu-hỏi-vấn-đáp--phản-biện-chuyên-sâu-defense-qa--faqs)

---

## 1. Tổng Quan Vai Trò & Trách Nhiệm

Thành Viên 3 (Đỗ Trần Đăng Khoa) giữ trọng trách **"Bộ não Trí tuệ Nhân tạo & Bảo mật Khóa API"** của hệ sinh thái AITA-INTELLIGENT:
* Thiết kế và triển khai kiến trúc **AI Engine** tích hợp trực tiếp mô hình ngôn ngữ lớn **Google Gemini 1.5 Flash / Pro** phục vụ việc giảng dạy và đánh giá học thuật.
* Xây dựng tầng bảo mật mã hóa đối xứng 2 chiều chuẩn quân sự **AES-256-GCM** bảo vệ toàn bộ kho khóa API chống rò rỉ dữ liệu khi bị tấn công DB Dump.
* Thiết lập thuật toán điều phối luân chuyển khóa **Key Pool Rotation** theo chiến lược *Least-Used*, tự động phát hiện mã lỗi `429 Too Many Requests / Resource Exhausted` và xoay sang key dự phòng không làm gián đoạn trải nghiệm của sinh viên.
* Xây dựng cơ chế **Prompt Template Versioning** lưu vết lịch sử phiên bản (`v1.0`, `v2.0`...), cho phép Giảng viên tinh chỉnh phong cách sư phạm mà không làm mất tính toàn vẹn của dữ liệu cũ.
* Phát triển **Socratic AI Tutor**: Chatbot trợ giảng tương tác theo từng phiên (`tutor_chat_sessions`), tuyệt đối không giải bài hộ mà đặt câu hỏi gợi mở tư duy logic, hỗ trợ sinh viên tự sửa lỗi.
* Đóng góp trực tiếp vào **Quy trình Chấm Điểm Đa Tầng (BR-09)** qua tính năng **AI Pre-grading / AI Code Review**: Phân tích tiêu chí chất lượng mã nguồn Clean Code, cấu trúc AST và Design Pattern cho worker hàng đợi BullMQ.

---

## 2. Các Quy Tắc Nghiệp Vụ Phụ Trách (Business Rules)

| Mã BR | Tên Quy Tắc | Yêu Cầu Kỹ Thuật & Giải Pháp Triển Khai |
| :--- | :--- | :--- |
| **BR-02** | **Bảo Mật AI API Keys (AES-256-GCM)** | • Tất cả API keys trước khi lưu vào CSDL (`ai_api_keys`) bắt buộc phải được mã hóa đối xứng 2 chiều bằng thuật toán **AES-256-GCM** với IV 12 bytes ngẫu nhiên và Authentication Tag 16 bytes.<br>• Định dạng lưu trữ: `ivHex:authTagHex:encryptedHex`.<br>• Xác thực tính toàn vẹn dữ liệu (Tamper-Proof): Bất kỳ sự sửa đổi dù chỉ 1 ký tự trong ciphertext sẽ kích hoạt ngoại lệ từ chối giải mã.<br>• Che dấu khóa hiển thị (Masking): Tuyệt đối không hiển thị plain key trên UI Admin, chỉ hiển thị dạng `AIzaSy...cret`. |
| **BR-04** | **Hệ Thống Xoay Key Tự Động (Key Pool Rotation)** | • Chiến lược phân phối: **Least-Used (Ưu tiên khóa có usage_count thấp nhất)** nhằm san đều tải giữa các API Keys.<br>• Bắt lỗi Rate Limit: Khi SDK trả về mã lỗi HTTP 429 hoặc `RESOURCE_EXHAUSTED`, hệ thống tự động cập nhật `status = 'RATE_LIMITED'`, ghi nhận thời gian `rotated_at`, kích hoạt xoay sang khóa tiếp theo ngay lập tức.<br>• Phục hồi an toàn: Cung cấp API cập nhật trạng thái khóa dành riêng cho Quản trị viên (`ADMIN`). |
| **BR-05** | **Quản Lý Phiên Bản Prompt Template** | • Quản lý tách biệt giữa các mục đích sử dụng (`purpose`: `TutorChat`, `Grading`).<br>• Lưu vết phiên bản (`v1.0`, `v2.0`...): Không ghi đè các template cũ để đảm bảo tính minh bạch kiểm toán (Audit Trail) cho các bài tập đã nộp trước đó.<br>• Phân quyền RBAC nghiêm ngặt: Chỉ có tài khoản Giảng viên (`LECTURER`) hoặc Quản trị viên (`ADMIN`) mới có quyền tạo và chỉnh sửa Prompt Template; Sinh viên (`STUDENT`) bị chặn với mã lỗi HTTP 403. |
| **BR-09** | **AI Pre-Grading & Socratic AI Tutor** | • **AI Socratic Tutor:** Đóng vai trò trợ giảng dẫn dắt phương pháp Socratic. Nghiêm cấm xuất code hoàn chỉnh hoặc đáp án trực tiếp; tập trung phân tích edge cases, gợi ý hướng tiếp cận và tối ưu độ phức tạp Big-O.<br>• **AI Code Review:** Tự động đánh giá các tiêu chí nâng cao (`rule_type = 'AI_ANALYSIS'`) như Clean Code, đặt tên biến, tách hàm modular, áp dụng Design Pattern và cấu trúc AST, cập nhật điểm `ai_score` và nhận xét `ai_feedback` vào bảng `submissions`. |

---

## 3. Kiến Trúc Kỹ Thuật AI Engine & Key Pool

```mermaid
flowchart TD
    Client["Client: Sinh Viên / Giảng Viên / Admin"]
    Routes["Express Router: /api/ai-tutor/*"]
    AuthMiddleware["Middleware: authenticateJWT + requireRole"]
    AiService["AiTutorService"]
    CryptoService["CryptoService (AES-256-GCM)"]
    DB[(PostgreSQL 16: ai_api_keys, prompt_templates, tutor_chat_*)]
    GeminiAPI["Google Gemini 1.5 Flash / Pro API"]

    Client -->|"HTTP Request + JWT Token"| Routes
    Routes --> AuthMiddleware
    AuthMiddleware -->|"Xác thực RBAC thành công"| AiService

    subgraph Key Pool Manager [Hệ Thống Quản Lý Key Pool (BR-02 & BR-04)]
        AiService -->|"1. Lấy Active Key có usage_count thấp nhất"| DB
        AiService -->|"2. Giải mã key bằng AES-256"| CryptoService
        AiService -->|"3. Gọi mô hình ngôn ngữ"| GeminiAPI
        GeminiAPI -.->|"Lỗi HTTP 429 Quota Exceeded"| AiService
        AiService -.->|"4. Đánh dấu RATE_LIMITED & xoay key mới"| DB
    end

    subgraph Socratic Engine [Cơ Chế Socratic & Code Review (BR-05 & BR-09)]
        AiService -->|"5. Lấy active System Prompt Template"| DB
        AiService -->|"6. Gắn ngữ cảnh bài nộp & sinh phản hồi"| GeminiAPI
        AiService -->|"7. Lưu lịch sử phiên chat vào DB"| DB
    end

    AiService -->|"HTTP 200/201 JSON Response"| Client
```

---

## 4. Chi Tiết Triển Khai Kỹ Thuật

### 4.1. Module CryptoService — Chuẩn Mã Hóa 2 Chiều AES-256-GCM (BR-02)
* File mã nguồn: `server/src/modules/ai-tutor/crypto.service.ts`
* Thuật toán: **AES-256-GCM (Galois/Counter Mode)** — Thuật toán mã hóa đối xứng xác thực (Authenticated Encryption) tiêu chuẩn quốc tế.
* Cấu trúc đầu ra: Chuỗi phân tách bởi dấu hai chấm `iv:authTag:ciphertext`:
  - `iv`: Initialization Vector 12 bytes ngẫu nhiên được sinh bằng `crypto.randomBytes(12)` cho mỗi lần mã hóa, đảm bảo mã hóa cùng một khóa nhiều lần vẫn sinh ra chuỗi mã khác nhau.
  - `authTag`: Thẻ xác thực 16 bytes được trích xuất bằng `cipher.getAuthTag()`. Nếu dữ liệu mã hóa bị sửa đổi dù 1 bit, hàm giải mã sẽ ném lỗi lập tức (Tamper-Proof).
  - `ciphertext`: Chuỗi hex dữ liệu sau khi mã hóa.
* Tính năng an toàn phụ trợ:
  - `maskApiKey()`: Che giấu chuỗi khóa chỉ để lộ tiền tố và hậu tố (`AIzaSy...cret`), bảo đảm an toàn khi trả về cho UI quản trị viên.
  - `getKey()`: Chuẩn hóa Secret Key từ biến môi trường `AES_SECRET_KEY` thành Buffer 32 bytes qua hàm băm SHA-256.

### 4.2. Logic Xoay Tua Key Pool Tự Động & Xử Lý HTTP 429 (BR-04)
* File mã nguồn: `server/src/modules/ai-tutor/ai-tutor.service.ts`
* Thuật toán lựa chọn khóa:
  ```sql
  SELECT ai_api_key_id, provider, key_value_encrypted, api_key_encrypted, status, usage_count 
  FROM ai_api_keys 
  WHERE status = 'ACTIVE' 
  ORDER BY usage_count ASC, ai_api_key_id ASC LIMIT 1;
  ```
  Chiến lược *Least-Used* bảo đảm tất cả các khóa trong pool được khai thác đồng đều, hạn chế tối đa việc một khóa bị cạn kiệt quota trước các khóa khác.
* Vòng lặp xoay tua xử lý sự cố (Resilient Retry Loop):
  - Số lần thử lại tối đa: `maxRetries = 3`.
  - Khi bắt được lỗi HTTP `429 Too Many Requests`, `RESOURCE_EXHAUSTED` hoặc `Quota exceeded`:
    1. Kích hoạt `markKeyRateLimited(keyId)`: Cập nhật CSDL chuyển trạng thái khóa sang `RATE_LIMITED`, gán cờ `rotated = true`.
    2. Bỏ qua khóa lỗi, lập tức gọi `getNextActiveApiKey()` để lấy khóa tiếp theo trong pool.
    3. Thử lại yêu cầu gọi AI mà người dùng không nhận thấy bất kỳ lỗi nào.
  - Tăng biến đếm: Gọi `incrementKeyUsage(keyId)` cộng dồn `usage_count = usage_count + 1` và cập nhật `rotated_at = NOW()` sau mỗi lần gọi thành công.

### 4.3. Quản Lý Phiên Bản Prompt Template Versioning & Audit Trail (BR-05)
* Lưu trữ phiên bản trong bảng `prompt_templates` với các trường cốt lõi:
  - `purpose`: Phân định rõ mục đích (`TutorChat` cho trợ giảng hoặc `Grading` cho chấm bài).
  - `version`: Chuỗi nhận diện phiên bản (ví dụ: `v1.0`, `v2.0`).
  - `temperature`: Tùy biến độ sáng tạo của mô hình (mặc định `0.2` cho chấm bài để đảm bảo tính nhất quán, `0.3 - 0.7` cho Socratic Chat).
  - `is_active`: Đánh dấu trạng thái kích hoạt phiên bản.
* Nguyên tắc bất biến (Immutability & Audit Trail):
  - Khi Giảng viên cập nhật hướng dẫn mới, API `POST /api/ai-tutor/admin/prompts` sẽ tạo một dòng bản ghi mới hoàn toàn kèm số version mới thay vì ghi đè lên bản ghi cũ.
  - Điều này giúp hệ thống lưu vết lịch sử chấm bài: Bài nộp ở Sprint 1 được chấm bởi `v1.0`, bài nộp ở Sprint 2 được chấm bởi `v2.0` mà không bị sai lệch kết quả đối soát.

### 4.4. Trợ Giảng Socratic & Tích Hợp AI Code Review Đa Tầng (BR-09)
* **Chatbot Socratic tương tác theo phiên (`tutor_chat_sessions` & `tutor_chat_messages`):**
  - Hệ thống cho phép sinh viên tạo phiên thảo luận gắn liền với `assignment_id` hoặc `submission_id`.
  - Prompt hệ thống áp đặt quy tắc sư phạm khắt khe:
    > "Bạn là Trợ lý AI Giảng dạy phương pháp Socratic. TUYỆT ĐỐI KHÔNG giải bài trực tiếp hay đưa code copy-paste cho sinh viên. Chỉ đặt câu hỏi dẫn dắt, gợi ý tư duy thuật toán và chỉ ra vị trí lỗi logic."
* **Tích hợp AI Code Review vào Worker Hàng Đợi BullMQ (`grading.worker.ts`):**
  - Khi xử lý chấm bài, nếu tiêu chí có `rule.rule_type === 'AI_ANALYSIS'`, worker sẽ chuyển giao mã nguồn sinh viên sang hàm `reviewCodeWithAI()`.
  - AI sẽ phân tích: Naming conventions, Cyclomatic complexity, Modular architecture, Design patterns, Edge cases.
  - Kết quả được ghi nhận vào `grading_results` với cờ `is_ai_generated = TRUE`, đồng thời tự động cập nhật `ai_score` và `ai_feedback` vào bảng `submissions` phục vụ Giảng viên xem xét tại Bước 1 của quy trình BR-09.

---

## 5. Danh Mục API Endpoints Phụ Trách

| Method | Endpoint | Quyền (RBAC) | Mô Tả Chức Năng |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ai-tutor/sessions` | `STUDENT`, `LECTURER`, `ADMIN` | Khởi tạo phiên thảo luận Socratic mới gắn với bài tập / bài nộp |
| `GET` | `/api/ai-tutor/sessions/:sessionId/messages` | `STUDENT`, `LECTURER`, `ADMIN` | Truy xuất toàn bộ lịch sử tin nhắn của một phiên hội thoại |
| `POST` | `/api/ai-tutor/sessions/:sessionId/chat` | `STUDENT`, `LECTURER`, `ADMIN` | Gửi câu hỏi và nhận gợi ý Socratic thời gian thực (hỗ trợ xoay key 429) |
| `GET` | `/api/ai-tutor/:submissionId/messages` | `STUDENT`, `LECTURER`, `ADMIN` | Lấy lịch sử hội thoại tương thích ngược theo `submission_id` |
| `POST` | `/api/ai-tutor/:submissionId/chat` | `STUDENT`, `LECTURER`, `ADMIN` | Gửi câu hỏi trợ giảng trực tiếp trên bài nộp cụ thể |
| `GET` | `/api/ai-tutor/admin/keys` | `ADMIN` | Xem danh sách toàn bộ Key Pool (đã được che dấu key an toàn) |
| `POST` | `/api/ai-tutor/admin/keys` | `ADMIN` | Thêm API Key mới vào pool, tự động mã hóa AES-256 trước khi lưu DB |
| `PATCH` | `/api/ai-tutor/admin/keys/:id/status` | `ADMIN` | Cập nhật thủ công trạng thái key (`ACTIVE`, `INACTIVE`, `RATE_LIMITED`...) |
| `GET` | `/api/ai-tutor/admin/prompts` | `LECTURER`, `ADMIN` | Liệt kê danh sách các Prompt Template (hỗ trợ lọc theo `purpose`) |
| `POST` | `/api/ai-tutor/admin/prompts` | `LECTURER`, `ADMIN` | Tạo phiên bản mới của Prompt Template (`v1.0`, `v2.0`...) |

---

## 6. Kết Quả Kiểm Thử Thực Tế (`verify-member3.ts`: 27/27 PASS 100%)

Bộ kiểm thử tự động toàn diện được phát triển riêng trong `server/src/test/verify-member3.ts` và tích hợp lệnh chạy `npm run test:member3`. Kết quả thực thi đạt chuẩn tuyệt đối:

```bash
> aita-server@1.0.0 test:member3
> tsc && node dist/test/verify-member3.js

================================================================
🧪 BẮT ĐẦU KIỂM THỬ THÀNH VIÊN 3: AI ENGINE & KEY ROTATION
   Thành viên: Đỗ Trần Đăng Khoa (dotrandangkhoa17@gmail.com)
   Vai trò: AI Tutor Socratic, AES-256 Key Pool, Prompt Versioning & AI Review
   Business Rules: BR-02, BR-04, BR-05, BR-09 | SWD392 Group 4
================================================================

🔐 1. KIỂM THỬ MÃ HÓA 2 CHIỀU AES-256 (BR-02)
  ✅ PASS: AES-256-GCM: Mã hóa thành công ra định dạng iv:authTag:ciphertext
  ✅ PASS: AES-256-GCM: Giải mã thành công, kết quả khớp 100% với key ban đầu
  ✅ PASS: AES-256-GCM AuthTag: Phát hiện dữ liệu bị can thiệp và từ chối giải mã (Tamper-Proof)
  ✅ PASS: Masking: Key được che dấu an toàn khi hiển thị (e.g. AIzaSy...cret)
  ✅ PASS: Key Isolation: Dữ liệu mã hóa bởi khóa A không thể giải mã bởi khóa B

🔄 2. KIỂM THỬ HỆ THỐNG XOAY KEY TỰ ĐỘNG (BR-04)
  ✅ PASS: getNextActiveApiKey(): Trả về key ACTIVE hợp lệ từ Key Pool
  ✅ PASS: incrementKeyUsage(): Cập nhật usage_count và rotated_at thành công
  ✅ PASS: markKeyRateLimited(): Đánh dấu trạng thái RATE_LIMITED khi gặp lỗi quota

📝 3. KIỂM THỬ QUẢN LÝ PHIÊN BẢN PROMPT TEMPLATE (BR-05)
  ✅ PASS: GET /api/ai-tutor/admin/prompts: Giảng viên xem được danh sách templates
  ✅ PASS: GET /api/ai-tutor/admin/prompts?purpose=TutorChat: Lọc chính xác theo purpose
  ✅ PASS: POST /api/ai-tutor/admin/prompts: Tạo version mới v2.0 thành công, không ghi đè version cũ (Audit Trail)
  ✅ PASS: Phân quyền RBAC: Sinh viên không được phép quản lý Prompt Templates (HTTP 403)

🤖 4. KIỂM THỬ TRỢ GIẢNG AI SOCRATIC & CHAT SESSIONS
  ✅ PASS: POST /api/ai-tutor/sessions: Tạo phiên chat mới thành công
  ✅ PASS: POST /api/ai-tutor/sessions/:id/chat: Sinh viên gửi câu hỏi và nhận câu trả lời
  ✅ PASS: Phương pháp Socratic: AI định hướng tư duy, đặt câu hỏi gợi mở, không đưa code hoàn chỉnh
  ✅ PASS: GET /api/ai-tutor/sessions/:id/messages: Lấy đầy đủ lịch sử hội thoại của phiên chat
  ✅ PASS: POST /api/ai-tutor/:submissionId/chat: Tương thích ngược phiên chat gắn với submission_id

📊 5. KIỂM THỬ TÍCH HỢP AI CODE REVIEW (BR-09)
  ✅ PASS: AI Code Review: Chấm điểm bài nộp thành công với thang điểm 10
  ✅ PASS: AI Code Review: Nhận xét chi tiết về Clean Code, cấu trúc AST và Design Pattern
  ✅ PASS: Grading Worker: Xử lý thành công grading job có tiêu chí rule_type = AI_ANALYSIS
  ✅ PASS: grading_results: Lưu kết quả với cờ is_ai_generated = TRUE và ai_feedback chi tiết
  ✅ PASS: submissions: Tự động cập nhật ai_score và ai_feedback vào bảng submissions (BR-09)

🔑 6. KIỂM THỬ API QUẢN TRỊ AI KEY POOL
  ✅ PASS: GET /api/ai-tutor/admin/keys: Admin xem được toàn bộ Key Pool
  ✅ PASS: Bảo mật Admin: Key được che dấu (masked) an toàn trong danh sách quản trị
  ✅ PASS: POST /api/ai-tutor/admin/keys: Thêm key mới thành công, mã hóa AES-256 trước khi lưu DB
  ✅ PASS: PATCH /api/ai-tutor/admin/keys/:id/status: Cập nhật trạng thái key thành công (ACTIVE -> INACTIVE)
  ✅ PASS: Phân quyền RBAC: Sinh viên không được phép truy cập Key Pool quản trị (HTTP 403)

================================================================
📊 TỔNG KẾT KIỂM THỬ THÀNH VIÊN 3:
   Số bài test ĐẠT (PASSED): 27
   Số bài test LỖI (FAILED): 0
   🎉 XUẤT SẮC: TẤT CẢ TEST CASES CỦA THÀNH VIÊN 3 ĐÃ ĐẠT 100%!
   Sẵn sàng báo cáo và bảo vệ đồ án SWD392!
================================================================
```

---

## 7. Hướng Dẫn Demo Khi Bảo Vệ Đồ Án

### Kịch Bản 1: Minh Chứng Mã Hóa 2 Chiều AES-256-GCM (BR-02)
1. Đăng nhập tài khoản Admin trên giao diện `http://localhost:3000/admin`.
2. Mở tab **AI Key Pool Manager**: Chỉ thấy các key ở dạng masked (`AIzaSy...xxxx`).
3. Dùng Postman hoặc console thực hiện thêm key mới `POST /api/ai-tutor/admin/keys`.
4. Mở truy vấn trực tiếp vào PostgreSQL:
   ```sql
   SELECT ai_api_key_id, provider, key_value_encrypted FROM ai_api_keys ORDER BY ai_api_key_id DESC LIMIT 1;
   ```
   $\rightarrow$ **Minh chứng:** CSDL chỉ lưu chuỗi hex `iv:authTag:ciphertext`, chứng minh key được bảo mật tuyệt đối ngay cả khi lộ database.

### Kịch Bản 2: Cơ Chế Xoay Tua Key Tự Động Khi Gặp Lỗi 429 Quota Exceeded (BR-04)
1. Đặt trạng thái Key #1 có `usage_count = 100`, Key #2 có `usage_count = 0`.
2. Gửi request sinh viên hỏi AI $\rightarrow$ Hệ thống tự động chọn Key #2 vì có `usage_count` thấp nhất (*Least-Used*).
3. Giả lập key hiện tại trả về lỗi HTTP 429 Rate Limit.
4. Hệ thống tự động đánh dấu key lỗi thành `RATE_LIMITED`, đồng thời tự động lấy key tiếp theo trong pool và hoàn tất câu trả lời cho sinh viên mà không bị crash.

### Kịch Bản 3: Sinh Viên Tương Tác Socratic AI Tutor
1. Đăng nhập tài khoản Sinh viên (`dotrandangkhoa17@gmail.com`).
2. Vào Dashboard Sinh viên $\rightarrow$ Tab **AI Tutor Chat**.
3. Sinh viên gõ câu hỏi: *"Cho mình code giải bài Two Sum với?"*
4. Trợ lý AI phản hồi: Từ chối đưa code trực tiếp, giải thích cấu trúc dữ liệu Hash Map và đặt câu hỏi gợi ý để sinh viên tự code.

### Kịch Bản 4: AI Pre-Grading Đánh Giá Clean Code & AST (BR-09)
1. Sinh viên nộp bài tập có tiêu chí rubric `AI_ANALYSIS`.
2. Worker BullMQ thực thi chấm bài trong background.
3. Giảng viên vào Dashboard xem bài nộp: Hiển thị ngay điểm số `ai_score` và nhận xét chi tiết `ai_feedback` về phong cách code, giúp giảng viên tiết kiệm 80% thời gian đọc bài.

---

## 8. Bộ Câu Hỏi Vấn Đáp & Phản Biện Chuyên Sâu (Defense Q&A / FAQs)

**❓ Câu hỏi 1: Tại sao bạn lại chọn AES-256-GCM thay vì mã hóa một chiều Bcrypt như mật khẩu người dùng?**  
* **Trả lời:** Mật khẩu người dùng là dữ liệu xác thực danh tính một chiều, hệ thống chỉ cần kiểm tra tính khớp (`compare`) chứ không bao giờ cần đọc lại mật khẩu gốc, vì vậy sử dụng Bcrypt là chuẩn an toàn nhất (BR-01). Ngược lại, API Key của các nhà cung cấp AI (Google Gemini, OpenAI) là bí mật hệ thống cần được **giải mã ngược lại thành plain-text** để backend gửi HTTP Header tới Gemini API khi phục vụ người dùng. Do đó bắt buộc phải sử dụng mã hóa 2 chiều đối xứng. Em chọn chuẩn **AES-256-GCM** vì thuật toán này tích hợp sẵn thẻ xác thực `authTag`, ngăn chặn hoàn toàn tấn công sửa đổi ciphertext (bit-flipping attack).

**❓ Câu hỏi 2: Hệ thống làm thế nào để đảm bảo sinh viên không lợi dụng AI Tutor để gian lận đồ án?**  
* **Trả lời:** Em đã thiết lập cơ chế **Socratic Pedagogical Prompt Guard** ở tầng Prompt Template (`BR-05` & `BR-09`). Prompt hệ thống được khóa cứng với các ràng buộc nghiêm ngặt: Tuyệt đối không sinh code hoàn chỉnh, không sửa lỗi trực tiếp mà chỉ phân tích vị trí dòng code có nguy cơ sai logic và đặt câu hỏi gợi mở. Hơn nữa, toàn bộ lịch sử trò chuyện được lưu trong `tutor_chat_messages` có gắn kèm `user_id` và `submission_id`, giúp Giảng viên có thể kiểm tra lại nhật ký học tập của sinh viên bất cứ lúc nào.

**❓ Câu hỏi 3: Nếu tất cả API Key trong Key Pool đều bị Rate Limit 429 thì hệ thống xử lý ra sao?**  
* **Trả lời:** Trong `ai-tutor.service.ts`, em đã xây dựng cơ chế **Graceful Fallback & Circuit Breaker**: Nếu toàn bộ các key trong CSDL đều rơi vào trạng thái `RATE_LIMITED` hoặc hết quota, hệ thống sẽ tự động kích hoạt bộ sinh phản hồi nội bộ (`generateFallbackSocratic`), cung cấp các hướng dẫn tư duy cơ bản mà không làm sập ứng dụng (zero-crash policy). Đồng thời hệ thống ghi log cảnh báo để Quản trị viên bổ sung key mới qua API `/api/ai-tutor/admin/keys`.

---
*Tài liệu được hoàn thiện và xác minh bởi Thành viên 3 — Đỗ Trần Đăng Khoa — Group 4 SWD392.*
