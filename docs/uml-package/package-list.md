# Danh sách các gói (Package List) - Hanachan v2

Hệ thống được phân chia thành 4 tầng (Layer) để đảm bảo tính đóng gói và dễ bảo trì.

### 1. Presentation
- **`app_ui`**: Chứa các trang (Routes/Pages) và các thành phần giao diện người dùng (Components). Nhiệm vụ là tiếp nhận tương tác và hiển thị dữ liệu.

### 2. Features
- **`learning_feature`**: Điều phối luồng học và ôn tập (Session Management). Kết nối giao diện với thuật toán ghi nhớ.
- **`chat_feature`**: Quản lý hội thoại với Trợ lý AI và xử lý các tham chiếu nội dung học tập.
- **`analytics_feature`**: Tổng hợp và tính toán các chỉ số học tập (Độ bao phủ, Độ chính xác).

### 3. Domain
- **`srs_domain`**: Chứa "trái tim" của hệ thống là thuật toán FSRS và các quy tắc logic về trạng thái bộ nhớ.
- **`content_domain`**: Định nghĩa cấu trúc và quan hệ của các đơn vị tri thức (Knowledge Units).

### 4. Infrastructure
- **`shared_lib`**: Chứa các Schema kiểm định (Validation), các hàm tiện ích dùng chung và cấu hình hệ thống.
- **`db_service`**: Quản lý kết nối và các thao tác truy vấn trực tiếp với Supabase/PostgreSQL.
