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

### Luồng xử lý:
1. **Lấy dữ liệu:** Lấy các khía cạnh (Facets) có `next_review <= NOW`. 
2. **Kiểm tra:**
   - Người dùng trả lời các Facet tương tự Mastery Quiz.
   - **No Reveal Rule:** Nếu trả lời sai, KHÔNG hiển thị đáp án. Re-queue Facet bị sai (trong phiên hiện tại).
3. **Tính toán FSRS (Algorithm) - NGAY LẬP TỨC:**
   - Cập nhật **ngay khi** người dùng trả lời lần đầu tiên trong phiên.
   - **Ratings:** `again` (incorrect), `good` (correct).
   - **Law of Independence:** Fail `reading` không ảnh hưởng đến `meaning`.
   - **Good:** `stability = stability * 1.5 * (difficulty/3.0)`. `reps++`.
   - **Again (Fail):** `stability = max(0.1, stability * 0.4)`. `reps = max(1, reps - 2)`. `lapses++`.
4. **Transition Stage:**
   - `stability >= 120 days`: State = `burned`.
   - `stability >= 3 days`: State = `review`.
   - Ngược lại: State = `learning`.

---

## 3. Immersion & Assistant Flow (Agentic Model)
**Mục tiêu:** Trợ lý Hanachan đóng vai trò là một "Hành khách" đồng hành cùng người dùng, tự động hỗ trợ thông tin dựa trên nhu cầu hội thoại.

### Đặc điểm thiết kế Agentic:
- **Heuristic Intent Routing**: Sử dụng bộ lọc từ khóa nhanh (Regex) để xác định ý định người dùng (Search/Progress) trước khi gửi tới LLM, giúp giảm latency và tiết kiệm token.
- **Just-in-Time Tooling**: AI tự quyết định khi nào cần tra cứu dữ liệu (Search) dựa trên các bối cảnh RAG được cung cấp.

### Luồng xử lý:
1. **Tiếp nhận & Suy luận (Reasoning):** AI nhận tin nhắn và xác định xem thông tin nào cần thiết để trả lời (ví dụ: cần truy cập Database để giải nghĩa từ, hoặc cần truy cập Analytics để báo cáo tiến độ).
2. **Kích hoạt Công cụ (Tool Call):**
   - **Entity Search Tool:** Bóc tách các cụm từ tiếng Nhật và tra cứu trong CKB.
   - **Knowledge Base Access**: AI có quyền truy cập vào danh mục tri thức để trả lời câu hỏi.
3. **Nhận diện thực thể phổ quát (Universal KU Detection):**
   - Mọi tin nhắn (bất kể có gọi tool hay không) đều được quét tự động để tìm các Knowledge Units (Kanji/Vocab).
   - Các KU này được đính kèm vào metadata phản hồi.
4. **Hiển thị linh hoạt (Dynamic UI):**
   - **Referenced KU:** Hiển thị dưới dạng các thẻ hoặc nút CTA bên dưới tin nhắn để người dùng xem chi tiết hoặc "Drill" (ôn luyện nhanh).
   - **Tool Results:** UI render tương ứng (ví dụ: một biểu đồ nhỏ nếu AI trả về dữ liệu tiến độ).

---

## 4. Level Progression (Mastery Rule)
1. **90% Mastery:** Nếu 90% các KU trong level hiện tại đạt trạng thái `review` hoặc `burned` (tất cả các Facet của KU đó phải thỏa mãn), người dùng được tự động mở khóa Level tiếp theo.
2. **Check points:** Kiểm tra diễn ra mỗi khi người dùng truy cập Dashboard hoặc hoàn thành một phiên học.