# Danh sách các gói (Package List) - Hanachan v2

Hệ thống được phân chia thành 4 tầng (Layer) để đảm bảo tính đóng gói và dễ bảo trì.

### 1. Presentation
- **`app_ui`**: Chứa các trang (Routes/Pages) và các thành phần giao diện người dùng (Components). Nhiệm vụ là tiếp nhận tương tác và hiển thị dữ liệu.

### 2. Features
- **`learning_feature`**: Điều phối luồng học và ôn tập, quản lý Session.
- **`knowledge_feature`**: Quản lý kho nội dung tri thức (Kanji, Vocab, Grammar).
- **`chat_feature`**: Quản lý hội thoại với Trợ lý AI và RAG.
- **`analytics_feature`**: Tổng hợp chỉ số học tập và biểu đồ.
- **`sentence_feature`**: Phân tích câu và trích xuất ngữ pháp (Immersion).

### 3. Domain Logic
- **`fsrs_engine`**: Thuật toán FSRS nằm trong `learning/domain`.
- **`schemas`**: Các định nghĩa dữ liệu và Zod validation.

### 4. Infrastructure
- **`supabase_client`**: Kết nối backend trực tiếp.
- **`shared_utils`**: Các hàm bổ trợ dùng chung.
