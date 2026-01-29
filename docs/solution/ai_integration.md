# Giải pháp học tích hợp với AI (AI Tutor)

Trong hệ thống Hanachan, trí tuệ nhân tạo được tích hợp nhằm hỗ trợ học tập theo hướng tương tác và cá nhân hóa, đóng vai trò như một trợ lý học tập thông minh thay vì một công cụ trả lời đơn thuần. Giải pháp AI được thiết kế xoay quanh một chatbot học tiếng Nhật, có khả năng phân tích ngôn ngữ, liên kết tri thức và điều chỉnh phản hồi phù hợp với ngữ cảnh học tập của từng người dùng.

## 1. Phân tích mục đích và Ngôn ngữ (NLP Analysis)

Khi người dùng nhập nội dung, hệ thống thực hiện nhận diện mục đích tương tác thông qua bộ lọc intent:
- **Phân tích câu (Sentence Analysis)**: Tách từ (tokenization), nhận diện từ loại và mẫu ngữ pháp.
- **Giải đáp thắc mắc (Question Answering)**: Giải thích các khái niệm Kanji, Vocab hoặc Grammar.
- **Luyện tập hội thoại (Practice)**: Tương tác giao tiếp tự nhiên.

Kết quả phân tích này được sử dụng nội bộ để quyết định chiến lược phản hồi, đảm bảo nội dung trả lời ngắn gọn, đúng trọng tâm và không gây quá tải thông tin.

## 2. Liên kết Tri thức tự động (Knowledge Mapping & RAG)

Hệ thống sử dụng kỹ thuật **RAG (Retrieval-Augmented Generation)** để làm giàu bối cảnh phản hồi:
- **Trích xuất thực thể**: AI tự động nhận diện các mã Knowledge Unit (KU ID) xuất hiện trong bối cảnh hoặc câu hỏi.
- **Truy vấn Database**: Dữ liệu chi tiết về Kanji/Vocab/Grammar được truy vấn từ Database và đưa vào Prompt làm "Grounding data".
- Giúp chatbot hiểu được bối cảnh học tập hiện tại của người dùng (ví dụ: người dùng đang hỏi về một từ vựng đã có trong danh sách "Learning").

## 3. Phản hồi tùy chỉnh và Điểm tương tác (CTA - Call To Action)

Phản hồi của chatbot được thiết kế theo nguyên tắc "vừa đủ" (Just-in-time learning). Tập trung vào mục tiêu học tập tại thời điểm tương tác:
- **Ngữ cảnh hóa**: Nếu người dùng chưa biết một ngữ pháp sử dụng trong câu, AI sẽ gợi ý tìm hiểu thêm.
- **Hành động học tập (CTA)**: Các hành động như "Xem chi tiết bộ thủ" hoặc "Học tập từ vựng này" được gắn dưới dạng các nút bấm tương tác. Kỹ thuật này sử dụng cột `referenced_ku_ids` trong bảng `chat_messages` để render các component React tương ứng trên giao diện.

## 4. Thích nghi linh hoạt (Adaptive Learning)

Hệ thống ghi nhận các tương tác học tập ở mức độ nhẹ (exposure). Dữ liệu này giúp chatbot:
- Điều chỉnh độ khó của từ vựng sử dụng trong hội thoại.
- Tránh giải thích lặp lại các quy tắc ngữ pháp đã được hướng dẫn trước đó.
- Tạo ra trải nghiệm học tập cá nhân hóa, giúp người dùng vận dụng kiến thức tiếng Nhật vào thực tế một cách tự nhiên và bền vững.

---
*Tài liệu này được đồng bộ với `src/features/chat` và các tài liệu thiết kế Use Case.*
