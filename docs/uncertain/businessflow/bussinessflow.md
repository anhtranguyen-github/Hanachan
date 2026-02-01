# Hanachan v2 Business Flows & Logic

## 1. Discovery Flow (New → Learning)
**Mục tiêu:** Giới thiệu kiến thức mới cho người dùng thông qua các slide bài học và kiểm tra ngay lập tức.

### Luồng xử lý:
1. **Lấy dữ liệu:** Hệ thống lấy các Knowledge Units (KU) chưa từng học thuộc Level hiện tại của người dùng (mặc định 5 items mỗi đợt để đảm bảo tính tập trung).
2. **Slides (Lesson View):** 
   - Người dùng xem slide chi tiết cho từng KU (Character, Meaning, Mnemonic, Examples).
   - Phải nhấn "Mastered" để sang KU tiếp theo.
3. **Kiểm tra (Mastery Quiz):**
   - Sau khi xem hết Batch, người dùng vào giai đoạn Quiz.
   - Mỗi KU sẽ có các "Facet" (khía cạnh) cần kiểm tra:
     - Radical: Meaning.
     - Kanji: Meaning, Reading.
     - Vocabulary: Meaning, Reading.
     - Grammar: Cloze (Điền vào chỗ trống).
4. **Cơ chế Correction Loop (Strict Mode):**
   - Nếu trả lời sai một Facet:
     - **KHÔNG hiển thị đáp án đúng.**
     - Thông báo "Incorrect" và đưa Facet đó về cuối hàng chờ (Re-queue).
     - Người dùng gặp lại Facet này sau đó và phải tự nhớ/tìm lại câu trả lời đúng.
     - Ghi nhận "mistake" để tính Accuracy cuối phiên.
   - Phiên học chỉ hoàn thành khi tất cả Facet được trả lời đúng ít nhất 1 lần.
5. **Kết thúc (Persistence):**
   - Sau khi hoàn thành Quiz cho một KU:
     - Khởi tạo FSRS state cho mỗi khía cạnh (**Facet**): `stability: 0.166` (khoảng 4 giờ), `reps: 1`, `state: learning`.
     - Lưu vào bảng `user_learning_states` với định danh `(user_id, ku_id, facet)`.
     - Với Vocabulary/Kanji, sẽ có 2 traces độc lập: `meaning` và `reading`.
     - Ghi log vào `user_learning_logs`.

---

## 2. Review Flow (Learning → Review/Burned)
**Mục tiêu:** Spaced Repetition để củng cố kiến thức.

### Đặc điểm quan trọng: **Atomic Processing**
- **Không có "Session" theo nghĩa transactional.**
- Mỗi item được xử lý độc lập: Trả lời đúng = FSRS update + Ra khỏi queue **ngay lập tức và vĩnh viễn**.
- Nếu người dùng F5/Quit giữa chừng: Các item đã trả lời đúng sẽ KHÔNG xuất hiện lại (vì đã được schedule lại rồi).
- Khác với Lesson: Không cần "hoàn thành" hay "commit" gì cả.

4. **Transition Stage:**
   - `stability >= 120 days`: State = `burned`.
   - `stability >= 3 days`: State = `review`.
   - Ngược lại: State = `learning`.

### Luồng xử lý (FIF Updated):
1. **Lấy dữ liệu:** Lấy các khía cạnh (Facets) có `next_review <= NOW`.
2. **Kiểm tra & Drill (Review Loop):**
   - **Trả lời Sai (Again):**
     - Increment `wrongCount` (Biến đếm lỗi trong phiên).
     - **KHÔNG** cập nhật FSRS ngay.
     - Re-queue (Đẩy xuống cuối hàng đợi) để học lại ngay (Drill).
   - **Trả lời Đúng (Good):**
     - Đứng ở bước "Commit".
     - Tính toán `Failure Intensity = log2(wrongCount + 1)`.
     - Gọi FSRS update **1 lần duy nhất** với hình phạt logarit.
     - Loại bỏ khỏi hàng đợi.
3. **Ý nghĩa:**
   - Phân biệt rõ "Quên" (Fail) và "Đang học lại" (Drill).
   - Tránh "Ease Hell" (giảm chỉ số quá mức do lặp lại nhiều lần trong 1 phiên).

---

## 3. Immersion & Assistant Flow (Agentic Tool Use)
**Mục tiêu:** Trợ lý Hanachan đóng vai trò là một "Giáo viên hướng dẫn" thông minh, không chỉ phản ứng theo lệnh mà còn chủ động xác thực thông tin và kết nối người dùng với lộ trình học tập chuẩn.

### Đặc điểm thiết kế Agentic Tool Use:
- **Proactive Reasoning (Tư duy chủ động)**: LLM thực hiện luồng ReAct (Reasoning + Acting). AI tự đặt câu hỏi: *"Để trả lời câu này chính xác, mình có cần dữ liệu từ giáo trình không?"* và tự thực hiện tra cứu ngay cả khi không có yêu cầu trực tiếp từ người dùng.
- **Verification-First Policy**: AI được chỉ thị phải "xác thực sự thật trước khi nói". Nếu câu trả lời dự định có nhắc đến từ vựng/ngữ pháp tiếng Nhật, AI phải gọi công cụ tìm kiếm để đảm bảo thông tin khớp với giáo trình Hanachan.
- **Curriculum-First Priority**: Ưu tiên dữ liệu từ Database hơn bộ nhớ của AI. Phản hồi luôn cố gắng dẫn dắt người dùng về các thực thể (KU) có sẵn trong hệ thống để tối ưu lộ trình học.
- **Context-Aware Fallback**: Khi kiến thức nằm ngoài DB, AI vẫn hỗ trợ giải thích nhưng BẮT ĐẦU bằng cảnh báo: *"Lưu ý: Kiến thức này hiện nằm ngoài giáo trình chính thức của Hanachan."*

### Luồng xử lý:
1. **Tiếp nhận & Suy luận (Inner Monologue):** AI nhận tin nhắn, phân tích từ khóa và quyết định các bước tra cứu cần thiết để cung cấp câu trả lời có kèm dẫn chứng (CTA).
2. **Kích hoạt Công cụ Chủ động (Proactive Tool Call):**
   - AI thực hiện một hoặc nhiều `tool_call` tới `search_curriculum`.
   - Cơ chế xử lý từ khóa linh hoạt: Tự động lọc các từ ngữ thừa để tăng tỷ lệ "Hit" trong Database.
3. **Tổng hợp & Đối soát (Synthesis):**
   - AI nhận kết quả từ DB, đối soát với kiến thức bản thân.
   - Viết lại câu trả lời để đồng bộ với định nghĩa, cách đọc và ví dụ trong giáo trình.
4. **Đồng bộ hóa CTA & Entity Linking:**
   - Dựa trên kết quả `hit` thực tế từ công cụ, hệ thống đính kèm danh sách `referencedKUs` chính xác 100%.
   - UI hiển thị các nút CTA giúp người dùng mở ngay QuickView để học sâu hơn về thực thể đó.
5. **Minh bạch phạm vi (Transparency):** Người dùng luôn biết rõ thông tin nào đến từ hệ thống chuẩn và thông tin nào là kiến thức bổ trợ của AI.

---

## 4. Level Progression (Mastery Rule)
1. **90% Mastery:** Nếu 90% các KU trong level hiện tại đạt trạng thái `review` hoặc `burned` (tất cả các Facet của KU đó phải thỏa mãn), người dùng được tự động mở khóa Level tiếp theo.
2. **Check points:** Kiểm tra diễn ra mỗi khi người dùng truy cập Dashboard hoặc hoàn thành một phiên học.