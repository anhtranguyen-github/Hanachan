🔷 QUY TRÌNH NGHIỆP VỤ CHATBOT HỌC TIẾNG NHẬT

(mở rộng với CTA & Modal interactions)

1️⃣ Input & Intent
👤 User input

Câu tiếng Nhật

Câu hỏi về câu

Yêu cầu luyện / hỏi đáp

🤖 System – Intent detect
IF contains Japanese → Sentence Analysis
ELSE IF hỏi “tại sao / dùng khi nào” → Grammar Q&A
ELSE → General Q&A


📌 Intent này ẩn, user không cần biết.

2️⃣ Phân tích câu (Core Engine)
🤖 System
Raw sentence
 → Tokenize + POS
 → Normalize (base form, tense, polarity)
 → Grammar pattern matching

📤 Output chuẩn (internal)

Tokens (vocab units)

Grammar patterns

Nghĩa tổng

Grammar trọng tâm

📌 Output này chưa show full, chỉ dùng để quyết định phản hồi.

3️⃣ Gắn kiến thức (Linking – tự động)
🤖 System

Tự động map:

Vocabulary entities

Grammar entities

(Optional) Kanji entities

❌ Không cần user hỏi
❌ Không cần confirm

📌 Đây là knowledge graph linking, không phải teaching step.

4️⃣ Quyết định phản hồi (Response Strategy)
🤖 System
IF first-time grammar
 → Short explanation + 1 example
ELSE IF grammar seen before
 → Ask-back / mini drill
ELSE IF user asked specific question
 → Answer exactly


📌 Output = 1 message chat, không overload.

5️⃣ Chat Response + CTA Layer (PHẦN MỚI)
🤖 Bot response gồm 2 lớp:
🔹 A. Chat content (đọc liền)

Giải thích ngắn

Ví dụ

Câu hỏi ngược (nếu có)

🔹 B. CTA Buttons (click-to-expand)

Gắn ngay dưới message, không phá flow.

Ví dụ CTA:

🔍 Xem phân tích chi tiết

📘 Xem grammar này

🧠 Luyện nhanh (1 câu)

➕ Thêm từ này vào deck

📦 Thêm tất cả vocab vào custom deck

📌 CTA context-aware:

Có grammar → hiện grammar CTA

Có vocab → hiện add vocab CTA

Không hiện thừa

6️⃣ CTA → Modal Business Flows
🔍 CTA: Xem phân tích chi tiết

→ Open Analysis Modal

Nội dung modal

Sentence breakdown

Tokens + nghĩa

Grammar highlight

(Optional) kanji structure

📌 Read-only
📌 Không ảnh hưởng SRS

📘 CTA: Xem grammar này

→ Open Grammar Modal

Nội dung

Grammar name

Ý nghĩa

Khi dùng / khi không dùng

So sánh grammar gần nghĩa

Các ví dụ khác

CTA phụ trong modal:

🧠 Luyện thêm

🔁 So sánh với grammar khác

➕ CTA: Thêm từ này vào custom deck

→ Open Deck Picker Modal

Flow:

User chọn custom deck

System tạo reference:

vocab → canonical flashcard

Không tạo card mới

Không reset progress

📌 1 click = 1 hành động rõ ràng

📦 CTA: Thêm tất cả vocab

Bulk add

Skip vocab đã tồn tại

Show summary

🧠 CTA: Luyện nhanh

→ Inline mini drill

Bot hỏi 1 câu biến thể

User trả lời

Bot feedback ngắn

Không vào SRS chuẩn

📌 Đây là micro-learning loop

7️⃣ Ghi nhận học tập (Mock SRS – nhẹ)
🤖 System (background)

Chỉ ghi:

User × Grammar × Interaction
User × Vocab × Interaction


Lưu:

Seen count

Last interaction type

❌ Không due date
❌ Không interval

📌 Dùng để:

Tránh giải thích lại

Điều chỉnh độ khó

Quyết định CTA lần sau

8️⃣ Kết thúc vòng chat
👤 User

Gõ tiếp

Click CTA

Hoặc im lặng

🤖 Bot (nếu phù hợp)

Gợi ý nhẹ:

“Bạn muốn luyện thêm không?”

“Muốn so sánh với ～そうです không?”

❌ Không spam
❌ Không ép học

🔁 TÓM TẮT 1 DÒNG (bản mở rộng)

Chatbot phân tích câu → phản hồi vừa đủ → gắn CTA để học sâu khi user muốn → ghi nhớ nhẹ để dạy thông minh hơn