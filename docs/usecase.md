# Hanachan Tóm tắt Usecase & Kế hoạch QA (Chất lượng)

Dưới đây là danh sách chi tiết các Usecase cho từng Agent và Hệ thống lõi trong Hanachan, kèm theo các kịch bản kiểm thử QA (Quality Assurance) nhằm đảm bảo hệ thống hoạt động chính xác theo kiến trúc REST/MCP đã thiết kế.

---

## 1. 🧠 Memory-Augmented Agent (Tương tác có bộ nhớ)

### 📌 Detailed Use Cases:
- **UC1.1 Gợi nhớ lịch sử học (Episodic):** Agent tự động nhắc lại nội dung hoặc sự kiện đã học trong buổi trước hoặc tuần trước.
- **UC1.2 Đánh giá kiến thức cá nhân (Semantic):** Agent nhận diện được từ vựng/kanji/ngữ pháp nào user đã học, đang học, hoặc đang gặp khó khăn.
- **UC1.3 Gọi lại ghi chú cá nhân (Notes):** Agent tự động tìm lại các "mẹo nhớ" (mnemonics) do chính user tạo ra khi giải thích từ vựng.
- **UC1.4 Báo cáo tiến trình học JLPT:** Thống kê và tư vấn lượng kiến thức cần học tiếp dựa trên lịch sử.

### 🧪 QA Test Scenarios:
- **[QA-Mem-01] Episodic Recall:** Bắt đầu một session mới, yêu cầu: "Hôm qua chúng ta đã thảo luận về điểm ngữ pháp nào?". Agent chuyển tool-call sang MCPDomainClient (`get_episodic_memory`) và trả lời chính xác.
- **[QA-Mem-02] Semantic Fact Checking:** Đặt câu hỏi: "Từ Kanji nào tôi hay trả lời sai nhất?". Agent phải gọi tool `get_semantic_facts` hoặc `get_learning_progress` và trả về thông tin phù hợp.
- **[QA-Mem-03] Note Retrieval:** Lấy một từ vựng đã có note cá nhân (ví dụ "犬: Con chó nhà bà hàng xóm"). Hỏi agent ý nghĩa từ này, Agent phải giải thích và đính kèm ngữ cảnh từ note cá nhân.

---

## 2. ⏱️ FSRS Enhanced Agent (Khoa học ghi nhớ)

### 📌 Detailed Use Cases:
- **UC2.1 Lấy danh sách Review Due:** Lấy danh sách các thẻ (cards) đến hạn ôn tập trong ngày theo thuật toán FSRS.
- **UC2.2 Xử lý bài đánh giá (Submit Review):** Ghi nhận kết quả ôn tập (Again, Hard, Good, Easy) và tính toán khoảng thời gian (interval) cho lần lặp tiếp theo.
- **UC2.3 Điều chỉnh Failure Intensity Framework (FIF):** Tự động điều chỉnh độ khó (Difficulty) và độ ổn định (Stability) nếu user liên tục sai một item nhiều lần trong cùng một session.

### 🧪 QA Test Scenarios:
- **[QA-FSRS-01] Next Review Calculation:** Gửi kết quả đánh giá "Good" cho một knowledge unit mới tinh. Kiểm tra xem `next_review` có được đặt cách xa ra (ví dụ 10 phút, hoặc 1 ngày tùy Stability khởi điểm) trong Database không.
- **[QA-FSRS-02] FIF Punishment:** Cố tình review sai (Rating = Again) liên tục 5 lần cho một từ vựng, kiểm tra xem difficulty có tăng chạm mốc trần không và thẻ có bị giáng cấp về `LEARNING` stage không.
- **[QA-FSRS-03] Retrieve Due Items:** Gọi Agent và yêu cầu: "Hôm nay tôi có bao nhiêu từ vựng cần ôn?". Agent phải phản hồi đúng con số đang ở trạng thái Due trong DB.

---

## 3. 🗂️ Deck Manager Agent (Quản lý Bộ bài học)

### 📌 Detailed Use Cases:
- **UC3.1 Tạo và Xóa Deck:** Cho phép user tạo mới bộ thư mục Flashcard chuyên biệt (VD: "Từ vựng N3 Youtuber").
- **UC3.2 Thêm/Xóa Item vào Deck:** Gắn các Knowledge Unit (từ, ngữ pháp, kanji), câu ví dụ, hoặc video ID vào trong deck.
- **UC3.3 Xem nội dung Deck:** Hiển thị và truy xuất tất cả các mặt thẻ đang tồn tại trong một Deck nhất định.

### 🧪 QA Test Scenarios:
- **[QA-Deck-01] Create Deck via Chat:** Trò chuyện với Deck Agent (qua FastMCP): "Tạo cho tôi một deck tên 'JLPT N2 Vocabulary'". Kiểm tra trong database `decks` xem bản ghi đã được tạo thành công bởi `fastapi-domain` hay chưa.
- **[QA-Deck-02] Add Item Validation:** Yêu cầu Agent thêm chữ "猫" vào deck vừa tạo. Agent gọi tool `add_to_deck`, kiểm tra database bảng `deck_items` phải chứa liên kết đúng giữa User -> Deck -> Item.
- **[QA-Deck-03] Cross-user Permission (RLS):** Thử trích xuất ID một deck của người dùng A, sau đó dùng token của người dùng B gọi API thêm item. DB / Domain_Service phải bắn lỗi `403 Access Denied`.

---

## 4. 📖 Reading Creator Agent (Khởi tạo bài đọc hiểu)

### 📌 Detailed Use Cases:
- **UC4.1 Tạo bài đọc tự động theo cấp độ:** Tổ hợp bài đọc hiểu phù hợp với mức JLPT (N5 - N1) chứa các target vocabulary mong muốn.
- **UC4.2 Sinh câu hỏi trắc nghiệm:** Phân tích nội dung và sinh tự động chuỗi câu trắc nghiệm (T/F, Multiple Choice).
- **UC4.3 Lưu và đánh giá bài làm:** Nộp bài đọc hiểu (submit_answer) và tự động tính thời gian (Time Spent), độ chính xác, qua đó cập nhật tiến độ cho từng từ vựng xuất hiện trong bài.

### � QA Test Scenarios:
- **[QA-Read-01] Generate Context:** Đưa prompt cho Reading Agent: "Tạo một bài đọc N4 về chủ đề du lịch Nhật Bản". Xác nhận output JSON tuân thủ đúng schema cấu trúc bài đọc.
- **[QA-Read-02] Answer Submission:** Mô phỏng flow NextJS gọi REST tới POST `/api/v1/reading/submit-answer`. Hệ thống phải lưu được AnswerResult vào bảng `exercise_submissions`.
- **[QA-Read-03] Integration with FSRS:** Khi submit bài đọc thành công, hệ thống phải trích xuất các Knowledge Unit có trong bài đọc và tự động cập nhật độ quen thuộc vào FSRS / Learning Status.

---

## 5. 📚 Sentence Library & Video Learning

### 📌 Detailed Use Cases:
- **UC5.1 Lưu và Tìm Sentence:** Phân tích một câu tiếng Nhật dài thành từng cấu trúc nhỏ (MeCab/Kuromoji) và lưu lại, cho phép tra cứu câu có chứa từ "X".
- **UC5.2 Trích xuất từ vựng từ Subtitles:** Phân tích file SRT/VTT của Video để trích xuất list từ vựng theo tần suất xuất hiện và đối chiếu cấp độ JLPT.

### 🧪 QA Test Scenarios:
- **[QA-Multimedia-01] NLP Processing:** Đưa một cụm "私は猫が好きです" vào hệ thống. Hệ thống phải tách đúng thành: 私 (noun) / は (particle) / 猫 (noun) / が (particle) / 好き (adj) / です (copula).
- **[QA-Multimedia-02] Video Vocabulary Sync:** Giả lập thao tác push Video Subtitles, hệ thống phải tạo ra các record `video_vocabulary` một cách chính xác.

---

## 6. 📘 Knowledge Units & Tutoring

### 📌 Detailed Use Cases:
- **UC6.1 Tra cứu đa chiều:** Tra cứu từ vựng, ngữ pháp, chữ Hán từ kho dữ liệu tổng hợp chung.
- **UC6.2 Nhập vai giáo viên (Tutoring mode):** Giải thích cặn kẽ ý nghĩa và cách dùng từ cho user (có khả năng tuỳ biến theo cấp bậc của user, không dùng câu phức tạp với người mới học N5).
- **UC6.3 Luyện tập qua hội thoại:** User đóng vai trò tham gia hội thoại bằng tiếng Nhật, AI liên tục chỉnh sửa và phản hồi.

### 🧪 QA Test Scenarios:
- **[QA-Tutor-01] Knowledge Retrieval:** Yêu cầu Agent "Giải thích cho tôi chữ Hán 桜". Trả về phân tích Hán Việt, ON, KUN, số nét, từ ghép.
- **[QA-Tutor-02] Level Adjustment:** Config user level = N5. Hỏi giải thích ngữ pháp N3. Agent nên đưa ra cảnh báo ngữ pháp này quá khó nhưng vẫn giải thích với ngôn ngữ đơn giản nhất có thể.

---

## 🔒 7. Kiến trúc hệ thống & Bảo mật (System & Architecture)

### 📌 Security & Hygiene Use Cases:
- **UC7.1 Single Source of Truth:** FastAPI-Domain là nơi duy nhất được quyền gọi Supabase. AI Agents hoàn toàn không được nối thẳng Database.
- **UC7.2 RLS & Permissions:** Users chỉ xem và thay đổi được dữ liệu của cá nhân họ thông qua Supabase Policies và JWT Inject.
- **UC7.3 Tool Execution Boundary:** Cấu trúc giao tiếp MCP (Model Context Protocol) luôn phải tách rời giữa Agent Core và System Domain.

### 🧪 QA Test Scenarios:
- **[QA-Arch-01] MCP Network Isolation:** Đóng port của `fastapi-domain` và gọi Agent `fastapi-agents`. Agent phải văng lỗi Timeout / Connection Refused, chứng minh Agent không bypass tự gọi API của Supabase.
- **[QA-Arch-02] RLS Injection Test:** Viết unit test truyền JWT của tài khoản User Role thử chỉnh sửa dữ liệu Admin (Role Escalation). Supabase DB Policy sẽ đẩy ra lỗi `403`.
- **[QA-Arch-03] Test Coverage Check:** Chạy `vitest` và `pytest` - đảm bảo code coverage backend tối thiểu đạt mức an toàn trên branch chính, 0 warning linter cản trở CI pipeline.
