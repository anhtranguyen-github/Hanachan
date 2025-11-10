# SAKURA SYSTEM V2: THE "FOLLOW" RULES

Đây là danh sách các quy tắc bắt buộc phải thực hiện để đạt được tiêu chuẩn Premium UI.

### 1. Color Collaboration (Set A x Set B)
- **Set A (Content Ink):** Ký tự chính, mặt chữ, hoặc tiêu đề nội dung PHẢI dùng màu theo **Loại nội dung** (Vocab: Green, Grammar: Amber, Radical: Teal).
- **Set B (UI Shell):** Viền (Border), Vòng sáng (Ring), Highlight background PHẢI dùng màu theo **Trạng thái học tập** (Mastered: Indigo, Learning: Action Blue, Burned: Gold).
- **Ink Rule:** Chỉ dùng `#1C1C1C` (Sakura Ink) cho văn bản mô tả, body text. Ký tự Kanji/Kana chính phải có màu.

### 2. Physical Layout (The "Paper" Feel)
- **Header Standardization:**
    - Desktop: 80px high, sticky, `backdrop-blur-md bg-white/80`.
    - Mobile: 56px high, sticky, `bg-white` (bỏ blur để tăng performance).
    - Cấu trúc: [L] Title + Subtitle Pill | [R] Action Icons.
- **Depth without Shadows:** Sử dụng `1px border` kết hợp với `ring-1` (inner glow) của màu Trạng thái để tạo độ nổi.
- Micro-interactions: 
    - Chỉ kích hoạt `ring-2` khi Hover hoặc Focus.
    - **Active Sidebar:** Icon + Active Pill phải mang màu Semantic của trang (Analyzer = Violet).
    - **Selection Sync:** Màu highlight của Token được chọn phải đồng nhất với màu trang trí của Panel phân tích tương ứng.

### 3. Navigation & Semantic Icons
- **Icon Color:** Icons phải có màu brand (Deep Cocoa) hoặc màu Semantic Indigo. TUYỆT ĐỐI không dùng màu đen.
- **Mobile Adaptive:** Tự động thu nhỏ text size và padding khi màn hình < 768px.

### 4. Data Layering & Mocking
- **Mocking Strategy:** Sử dụng `Adapter Pattern` hoặc `Mock Repository` cho dữ liệu demo. UI không được biết là dữ liệu đang lấy từ Seed hay từ DB thật.

### 5. Dashboard & Tables
- **Grid Lines:** Sử dụng `sakura-divider`, tuyệt đối không dùng màu đen hoặc xám đậm.
- **Chart Colors:** Phải đồng bộ với Content Palette (Vocab: Green, Grammar: Amber).
### 6. Visual Assets (Stickers & Backgrounds)
- **Texture Depth**: Sử dụng `sakura_mist_bg` làm nền cố định (fixed) để tạo chiều sâu thay cho hiệu ứng Blur tốn tài nguyên.
- **Micro-delights**: Thêm các Sticker kawaii (e.g., `hana_master_sticker`) vào các Empty states hoặc khi User đạt Milestone (Mastered/Burned).
- **Positioning**: Sticker nên được đặt `absolute` và "peeking" (nhô ra) khỏi cạnh của container để tạo cảm giác tự nhiên.
- **Image Optimization**: Luôn sử dụng component `next/image` với các thuộc tính `priority` cho ảnh nền.

### 7. Button Color Hierarchy (SakuraButton V2)
Buttons phải có màu phù hợp theo ngữ cảnh để người dùng dễ dàng nhận biết hành động:

**TIER 1 - ACTION BUTTONS (High Priority):**
- `primary`: Deep Cocoa (#4A3728) - Main CTA, nút quan trọng nhất
- `success`: Emerald Green - Xác nhận tích cực (Save, Confirm)
- `danger`: Rose Red - Hành động hủy/xóa (Delete, Cancel)

**TIER 2 - CONTENT TYPE BUTTONS (Semantic):**
- `radical`: Teal (#0D9488) - Liên quan đến Radicals
- `kanji`: Emerald (#059669) - Liên quan đến Kanji
- `vocabulary`: Blue (#2563EB) - Liên quan đến Vocabulary
- `grammar`: Amber (#D97706) - Liên quan đến Grammar

**TIER 3 - UTILITY BUTTONS (Low Priority):**
- `secondary`: White với border - Secondary action
- `ghost`: Transparent - Subtle actions
- `outline`: Border only - Minimal visual impact
- `info`: Cyan - Thông tin bổ sung
- `warning`: Orange - Cảnh báo

**Hover Effects (MANDATORY):**
- Tất cả buttons phải có `hover:-translate-y-0.5` để tạo hiệu ứng "lift"
- Color brightness phải tăng khi hover (sáng hơn 1 shade)
- `focus-visible:ring-2` cho keyboard accessibility

### 8. Sidebar Hover Effects (Enhanced)
Sidebar navigation items phải có hover effects rõ ràng và semantic:
- **Colored Hover Background**: Background khi hover phải match với màu active state (60% opacity)
- **Left Border Accent**: Khi hover, hiển thị `border-l-4` với màu nhạt hơn active
- **Icon Scale Animation**: Icons phải scale lên 110% khi hover
- **Smooth Transitions**: `transition-all duration-200 ease-out`

