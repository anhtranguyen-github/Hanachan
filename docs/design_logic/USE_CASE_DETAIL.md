# Combined Use Case Documentation

## Part 1: Refined Use Case Specifications
*(Source: usecases.md)*

# Human-Design: Use Case Specifications (Refined)

This document outlines the core interactions, emphasizing the **Sentence -> Analysis -> KU** learning loop.

## 1. Core Learning Loop (The "Trục" chính)

### UC-03: Sentence Analysis (Central Use Case)
- **Actor**: Student, Hana AI
- **Goal**: Deconstruct a sentence into learnable Knowledge Units (KU).
- **Flow**:
  1. Student encounters a sentence (from YouTube, Chat, or Manual Input).
  2. System triggers `analysis` module.
  3. **On-demand Refinement** (Optional): Student clicks "Refine" to get an AI assessment, grammar score, and a suggested "Golden Sentence" fix with explanation.
  4. Hana AI identifies Radicals, Kanji, Vocab, and Grammar points.
  5. System attempts to map these points to the **Core Knowledge Base (CKB)**.
  6. **Sentence Mining**: If a match is found, the sentence is linked to the KU's "Usage Pocket" (Sentence Pocket).

## 2. Study & Retention

### UC-02: SRS Study (Flashcards)
- **Actor**: Student
- **Goal**: Review items currently due in the user's `learning` queue.
- **Key Note**: Flashcards are just a **view** of a KU. The card content is pulled from `ckb`, and the review timing is managed by the `learning` module.

### UC-01: Personal Knowledge Management
- **Actor**: Student
- **Goal**: Browse and personalize their learning path.
- **Action**: Students can "bookmark" or "add to deck" specific KUs discovered during sentence analysis.

## 3. Supplementary Modes

### UC-04: YouTube Immersion
- Providing the primary source for "Sentences".
- Synchronization of transcripts with the learning state of KUs (highlighting known vs. unknown words).

### UC-05: AI Tutor (Chatbot)
- Context-aware support. The chatbot knows which KUs the student is struggling with (via `learning_state`) and uses them in conversations.

## 4. Administrative & Analytics
- Progress tracking across levels (1-60).
- Memory strength visualization (SRS heatmaps).

---

## Part 2: Comprehensive Use Case Overview
*(Source: 1. Tổng quan định hướng use case.txt)*

Nhóm UC-01: Quản lý và khai thác kiến thức nền (Core Knowledge)

UC-01.1: Truy cập kho kiến thức nền
(vocabulary, kanji, grammar, sentence)

UC-01.2: Xem bài học kiến thức theo cấu trúc chuẩn

UC-01.3: Cá nhân hóa trạng thái học trên từng đơn vị kiến thức
(trạng thái ghi nhớ, mức độ thành thạo, lịch ôn tập)

Nhóm UC-02: Học Flashcard & SRS (CORE)

UC-02.1: Học flashcard theo bộ 60 level có sẵn
(Vocab/Kanji/Radical: Mặt chữ - Nghĩa | Grammar: Câu - Cloze)

UC-02.2: Ôn tập kiến thức theo lịch SRS

UC-02.3: Đánh giá mức độ ghi nhớ sau mỗi lượt học

UC-02.4: Tạo flashcard cá nhân từ câu học
(Flashcard được ánh xạ về Knowledge Unit. Grammar LUÔN gắn với câu).

Nhóm UC-03: Phân tích câu học tập (CORE – TRUNG TÂM)

Đây là use case trung tâm, được kích hoạt từ nhiều nguồn khác nhau
(bài học, YouTube, chatbot, hoặc người dùng nhập thủ công).

UC-03.1: Phân tích một câu học tập bất kỳ

UC-03.2: Tra cứu từ vựng và thông tin mở rộng trong câu

UC-03.3: Nhận diện và giải thích điểm ngữ pháp trong câu

UC-03.4: Tạo hành động học từ kết quả phân tích câu
(thêm flashcard, thêm vào danh sách học, đánh dấu quan trọng)

UC-03.5: Đánh giá và đề xuất sửa đổi câu (On-demand AI Refinement)
(Trigger thủ công để kiểm tra độ chuẩn, nhận giải thích và bản sửa lỗi nếu cần)

Nhóm UC-04: Học tập thông qua YouTube (BỔ TRỢ)

UC-04.1: Kết nối và quản lý danh sách video YouTube học tập

UC-04.2: Trích xuất và hiển thị phụ đề video

UC-04.3: Phân tích câu từ phụ đề video

UC-04.4: Liên kết nội dung video với kiến thức nền hiện có

UC-04.5: Tạo flashcard từ nội dung video hợp lệ

Lưu ý:
Nội dung không ánh xạ được về Knowledge Base (CKB) sẽ không được đưa vào hệ thống học chính thức, nhằm đảm bảo tính nhất quán của trục học tập.

Nhóm UC-05: Học tập với Chatbot trợ giảng (BỔ TRỢ)

Chatbot đóng vai trò lớp tương tác thông minh, hỗ trợ người học thông qua hội thoại và các hành động học được đề xuất.

UC-05.1: Đặt câu hỏi về nội dung học tập

UC-05.2: Nhận giải thích dựa trên kiến thức nền và lịch sử học
(có xét đến trạng thái SRS và tiến độ cá nhân)

UC-05.3: Yêu cầu phân tích một câu thông qua chatbot

UC-05.4: Đề xuất nội dung học hoặc ôn tập phù hợp

UC-05.5: Khởi tạo hành động tạo bộ flashcard thông qua tương tác chatbot
(chatbot đề xuất, người học xác nhận, hệ thống thực hiện use case tạo deck)

UC-05.6: Thực hiện các lượt học hoặc ôn tập SRS thông qua giao diện hội thoại
(chatbot đóng vai trò giao diện, sử dụng cơ chế SRS hiện có)

Nhóm UC-06: Theo dõi và đánh giá quá trình học (IMPORTANT)

UC-06.1: Theo dõi tiến độ học theo flashcard

UC-06.2: Theo dõi tiến độ học theo ngữ pháp và câu
(quy chiếu về Knowledge Unit)

UC-06.3: Thống kê mức độ ghi nhớ và tần suất ôn tập

UC-06.4: Hiển thị biểu đồ và chỉ số học tập tổng quan
