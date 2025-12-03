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
  1. **Stage 1: Structural Analysis (Local)**: Instant tokenization (Furigana, POS) using local libraries (Kuromoji).
  2. **Stage 2: KB Mapping**: Automatically check which words/kanji exist in the Core Knowledge Base (CKB) via Slugs.
  3. **Stage 3: AI Insight (OpenAI)**: 
     - Contextual translation and meaning.
     - **Grammar Discovery**: AI identifies multi-token grammar patterns.
     - **Learning Recommendations**: AI selects the 3-5 most valuable items to learn.
  4. **Stage 4: Refinement & Mining**:
     - **On-demand Refine**: AI assesses sentence quality and suggests "Golden Sentence" fixes.
     - **Smart Mining**: User saves items to a "Usage Pocket" or creates new SRS cards.
     - **Cloze Suggestion**: AI proposes optimal cloze deletion positions for flashcards.
- **Source Tracking**: Every mined item automatically records its origin (e.g., `source_type: YouTube`, `video_id: ...`).

## 2. Study & Retention

### UC-02: SRS Study (Flashcards)
- **Actor**: Student
- **Goal**: Review items currently due in the user's `learning` queue.
- **Global Review Hub**: A central feature that pulls due items from **all decks** (System, YouTube-mined, Chat-mined). Users don't need to visit individual decks to stay on top of their SRS.
- **Dual Learning Mode**: Students can choose to study:
  1. The **Sentence** itself (Cloze Deletion style).
  2. The **Individual Words** (using the mined sentence as a context example).
- **Key Note**: Flashcards are just a **view** of a KU or Mined Sentence. The card content is pulled from `ckb` or `sentences` table.

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

Nhóm UC-01: Kiến thức nền & Cá nhân hóa (Knowledge Base)
**(Nhóm Browse, Lesson, Personalization)**

UC-01.1: Truy cập kho kiến thức nền (Browse)
(vocabulary, kanji, grammar, sentence)

UC-01.2: Xem bài học kiến thức theo cấu trúc chuẩn (Lesson View)

UC-01.3: Cá nhân hóa (Personalization)
(Bookmark, ghi chú, đánh dấu trạng thái "đã biết")

Nhóm UC-02: Học Flashcard & SRS (CORE FEATURE)
**(Hoạt động học chính - The Engine of Retention)**

UC-02.1: Học theo lộ trình chuẩn (Level-based Learning)
(Hệ thống chia sẵn 60 level. Mỗi level chứa Vocabulary, Kanji, Grammar, Sentence).

UC-02.2: Ôn tập (SRS Review)
(Hệ thống tự động nhắc lại dựa trên lịch sử ghi nhớ).

UC-02.3: Đánh giá & Phản hồi (Self-Evaluation)
(Người học tự đánh giá mức độ nhớ: Again, Hard, Good, Easy -> Cập nhật thuật toán FSRS).

UC-02.4: Quản lý Deck (Deck Management)
- **System Decks (Fixed)**: 60 Levels chuẩn, không thể chỉnh sửa nội dung.
- **Custom Decks (Dynamic)**: Created by user or auto-categorized by system:
  - **Mined from YouTube**: (Auto-labeled per video or source).
  - **Mined from Chat**: (Auto-labeled per session).
  - **Manual Mining**: (Manual entries).
- **Note**: Decks are logical groups of references to the same KUs/Sentences. No data duplication occurs. Every item in any deck is part of the **Global SRS Hub**.

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
- **Video Playback Controls**:
  - Play / Pause / Seek.
  - Sentence-based navigation (Previous / Next Sentence).
- **Subtitle Synchronization & Display**:
  - Sync text with video time.
  - Auto-highlight active sentence.
  - Viewing Modes: JP only, EN only, Bilingual (JP + EN).
  - Furigana Toggle: On/Off for kanji readings.

UC-04.3: Phân tích câu từ phụ đề video

UC-04.4: Liên kết nội dung video với kiến thức nền hiện có

UC-04.5: Tạo flashcard từ nội dung video hợp lệ

Lưu ý:
Nội dung không ánh xạ được về Knowledge Base (CKB) sẽ không được đưa vào hệ thống học chính thức, nhằm đảm bảo tính nhất quán của trục học tập.

Nhóm UC-05: Học tập với Chatbot trợ giảng (BỔ TRỢ)

Chatbot đóng vai trò lớp tương tác thông minh, hỗ trợ người học thông qua hội thoại và các hành động học được đề xuất.

UC-05.1: Hội thoại thông thường & Chuyển ngữ cảnh (Intent Routing)
- **Normal Chat**: Chat tự do với Persona Hana-chan.
- **Intent Detection**: Hệ thống tự động phát hiện ý định:
  - `GREETING` / `CHAT`: Phản hồi theo Persona.
  - `SRS_QUIZ`: Chuyển sang chế độ đố vui/ôn tập.
  - `ANALYZE`: Kích hoạt engine phân tích câu.

UC-05.3: Yêu cầu phân tích một câu thông qua chatbot
- **Trigger**: User gửi câu tiếng Nhật hoặc yêu cầu "Phân tích...".
- **Action**: Gọi `SentenceService.analyze()`.
- **Output**: Hiển thị kết quả phân tích chuẩn (Meaning, Grammar breakdown) ngay trong khung chat.

UC-05.6: Thực hiện các lượt học hoặc ôn tập SRS thông qua giao diện hội thoại
- **Modes**: 
  - **Passive**: Chatbot nhắc nhở về Trouble Items.
  - **Active**: User yêu cầu "Quiz me". Chatbot đưa ra câu hỏi trắc nghiệm hoặc điền từ.

Nhóm UC-06: Analytics & Tracking (IMPORTANT)
**(Không thể thiếu để duy trì động lực)**

UC-06.1: Dashboard tiến độ (Progress Dashboard)
(Tổng quan level, số thẻ đã học, streak ngày học).

UC-06.2: Heatmap & Charts
(Biểu đồ trí nhớ, khối lượng từ vựng tích lũy theo thời gian).

UC-06.3: Quản lý "Known Words" (Coverage Tracking)
(Thống kê % bao phủ từ vựng trong video/bài đọc dựa trên kiến thức đã học).
