# SAKURA SYSTEM V2: THE "AVOID" RULES

Đây là danh sách các "tử huyệt" thiết kế và kỹ thuật cần tránh tuyệt đối.

### 1. Visual Anti-Patterns
- **NO Pure Black (#000):** Không bao giờ dùng màu đen tuyệt đối cho icon, viền, hay background. Thứ duy nhất dùng màu xậm là chữ (#1C1C1C).
- **NO Generic Shadows:** Cấm dùng `shadow-sm`, `shadow-md`, `shadow-lg` của Tailwind. Thay thế hoàn toàn bằng Border và Ring.
- **NO Heavy Blur on Lists:** Không sử dụng `backdrop-blur` cho các item nằm trong danh sách dài (Card list). Chỉ dùng cho các Layer cố định như Header hoặc Modal.
- **NO Low Contrast:** Không dùng chữ màu nhạt trên nền trắng. Nếu dùng màu sáng (như Amber), phải dùng biến thể Darker cho Text.

### 2. Interaction Anti-Patterns
- **NO Floating Content without Scrim:** Không mở Modal mà không có lớp Overlay (Scrim). Không dựa vào viền để phân cấp Layer khi chồng nhau.
- **NO Black Icons:** Icons không được là màu đen. Phải là Deep Cocoa, brand colors, hoặc Semantic colors.
- **NO Direct Demo Seed Consumption**: Không được import trực tiếp file `seed.json` vào UI components hoặc Server Actions chính.
- **NO Monotone Buttons**: KHÔNG dùng chung một màu cho tất cả buttons. Buttons phải có màu semantic theo ngữ cảnh (Content type, Action type).
- **NO Missing Hover States**: Tất cả interactive elements (buttons, links, cards) PHẢI có hover state rõ ràng. Không để hover invisible.
- **NO `hover:scale-100`**: Hover states phải tạo visual feedback. Ít nhất phải có color change hoặc subtle transform.
- **NO Flat Sidebar Items**: Sidebar navigation items phải có colored hover backgrounds matching their semantic color.

### 4. Visual Asset Anti-Patterns
- **NO Sticker Overload**: Tối đa 2 sticker trên một khung hình nhìn thấy (viewport). Tránh làm app trông giống "trò chơi trẻ con".
- **NO Low Contrast on Images**: Không đặt text trực tiếp lên ảnh nền mà không có lớp phủ (Overlay) hoặc Container có độ đục cao (opacity > 90%).
- **NO Massive Assets**: TUYỆT ĐỐI không dùng ảnh > 1MB. Phải tối ưu hóa dung lượng trước khi đưa vào `public/`.

### 3. Performance Anti-Patterns
- **NO Filters inside Scroll:** Tránh dùng `filter: grayscale()` hoặc `filter: blur()` trong các component có khả năng cuộn. Thay bằng việc thay đổi mã màu HEX trực tiếp.
- **NO Non-sticky Headers:** Không để Header trôi mất khi user cuộn trang, làm mất dấu ngữ cảnh (Context loss).
