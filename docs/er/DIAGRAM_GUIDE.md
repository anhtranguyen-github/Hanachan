# Hướng dẫn Đọc Sơ đồ ER (Quick Guide)

Tài liệu này giải thích ngắn gọn vai trò của từng sơ đồ trong việc giải quyết các bài toán cốt lõi của Hanachan v2.

### 1. [Full System ER (Master)](./full-system-er.md)
*   **Mục tiêu**: Cái nhìn toàn cảnh (Big Picture).
*   **Giải quyết**: Cách tất cả các Domain (User, Content, Session, State, AI) kết nối với nhau để tạo thành một hệ thống học tập khép kín.

### 2. [User Domain](./user-er.md)
*   **Mục tiêu**: Danh tính và "Cổng" giáo trình.
*   **Cốt lõi**: Trường `level` (1-60). Đây là chìa khóa để hệ thống quyết định người dùng được phép học những gì tiếp theo.

### 3. [Content Domain](./content-er.md)
*   **Mục tiêu**: Kho tri thức và Ngân hàng câu hỏi.
*   **Cốt lõi**: Chứa dữ liệu chi tiết của Bộ thủ, Hán tự, Từ vựng, Ngữ pháp và các loại câu hỏi (Fill-in, Cloze). Đây là "nguyên liệu" cho mọi phiên học.

### 4. [Discovery & Review Domain](./discovery-er.md) / [SRS Domain](./review-er.md)
*   **Mục tiêu**: Luồng học tập thực tế và Trạng thái trí nhớ dài hạn.
*   **Cốt lõi**: 
    *   `LessonBatch`: Quản lý các lô học cố định (discovery-er.md).
    *   `UserLearningState`: Trạng thái FSRS và lịch ôn tập (review-er.md).

### 5. [Assistant Domain](./assistant-er.md)
*   **Mục tiêu**: Trợ lý học tập thông minh.
*   **Cốt lõi**: Kết nối giữa hội thoại AI và dữ liệu tri thức. Cho phép AI "nhắc tên" (`referenced_unit_ids`) các bài học cụ thể trong khi chat.

---
**Nguyên tắc thiết kế**: *Tối giản dữ liệu thừa (No UI settings, No gamification), tập trung 100% vào logic học thuật và tự động hóa FSRS.*
