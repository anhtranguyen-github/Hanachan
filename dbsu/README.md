
# Hanachan V2 Database Setup Unit (DBSU)

Thư mục này chứa toàn bộ dữ liệu thô, schema và script cần thiết để khởi tạo database Hanachan V2 từ con số 0.

## Cấu trúc thư mục
- `raw_data/`: Chứa các file JSON gốc (250MB+).
- `processed_data/`: Chứa dữ liệu sau khi đã được dọn sạch HTML và tính toán Cloze.
- `schema/`: Chứa các file .sql định nghĩa bảng.
- `scripts/`: Chứa các file logic (.ts).

## Quy trình khởi tạo (Hànachan Standard)

### 1. Cấu hình
Tạo file `.env` ở gốc project (hoặc đảm bảo biến môi trường `DATABASE_URL` tồn tại).
`DATABASE_URL=postgresql://user:pass@localhost:5432/hanachan_db`

### 2. Chạy Migration (Tạo bảng)
```bash
pnpm tsx dbsu/scripts/migrate.ts
```

### 3. Tiền xử lý dữ liệu (Transform)
Chuyển đổi dữ liệu thô sang định dạng sạch "CKB-Ready".
```bash
pnpm tsx dbsu/scripts/transform.ts
```

### 4. Nạp dữ liệu (Seed)
Đưa dữ liệu đã xử lý vào database.
```bash
pnpm tsx dbsu/scripts/seed.ts
```

### 5. Xác minh (Verify)
Chạy báo cáo độ phủ dữ liệu.
```bash
pnpm tsx dbsu/scripts/verify.ts
```

---
**Lưu ý**: Folder này được thiết kế để hoạt động độc lập. Mọi thay đổi về cấu trúc bảng sau này hãy cập nhật vào `dbsu/schema/`.
