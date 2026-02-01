# Giải pháp học tích hợp với AI (AI Tutor)

Trong hệ thống Hanachan, trí tuệ nhân tạo được tích hợp nhằm hỗ trợ học tập theo hướng tương tác và cá nhân hóa, đóng vai trò như một trợ lý học tập thông minh thay vì một công cụ trả lời đơn thuần. Giải pháp AI được thiết kế xoay quanh một chatbot học tiếng Nhật, có khả năng phân tích ngôn ngữ, liên kết tri thức và điều chỉnh phản hồi phù hợp với ngữ cảnh học tập của từng người dùng.

## 1. Suy luận và Kích hoạt Công cụ (Agentic Reasoning & Tool Calling)

Thay vì sử dụng bộ lọc ý định (intent) cứng nhắc, Hanachan hoạt động như một Intelligent Agent:
- **Suy luận ngữ cảnh**: AI sử dụng LLM để hiểu nhu cầu của người dùng (ví dụ: cần tra cứu Hán tự hoặc Từ vựng).
- **Kích hoạt Công cụ (Tool Call)**: Dựa trên suy luận, AI tự quyết định gọi công cụ tra cứu:
    - `search_ku`: Tra cứu trực tiếp kiến thức Từ vựng/Hán tự từ CKB.


## 2. Liên kết Tri thức tự động (Knowledge Mapping & RAG)

Hệ thống sử dụng kỹ thuật **RAG (Retrieval-Augmented Generation)** để làm giàu bối cảnh phản hồi:
- **Trích xuất thực thể**: AI tự động nhận diện các mã Knowledge Unit (Unit ID) xuất hiện trong bối cảnh hoặc câu hỏi.
- **Truy vấn Database**: Dữ liệu chi tiết về Kanji/Vocab/Grammar được truy vấn từ Database và đưa vào Prompt làm "Grounding data".
- Giúp chatbot hiểu được bối cảnh kiến thức liên quan để cung cấp giải thích chính xác.

## 3. Phản hồi tùy chỉnh và Điểm tương tác (CTA - Call To Action)

Phản hồi của chatbot được thiết kế theo nguyên tắc "vừa đủ" (Just-in-time learning). Tập trung vào mục tiêu học tập tại thời điểm tương tác:
- **Ngữ cảnh hóa**: Nếu người dùng chưa biết một ngữ pháp sử dụng trong câu, AI sẽ gợi ý tìm hiểu thêm.
- **Hành động học tập (CTA)**: Các hành động như "Xem chi tiết bộ thủ" hoặc "Tra cứu từ vựng" được gắn dưới dạng các nút bấm tương tác. Kỹ thuật này sử dụng mảng `referencedKUs` trong phản hồi của Agent để render các component React tương ứng trên giao diện.

## 4. Tương tác dựa trên nội dung (Content-Driven Interaction)

Hệ thống tập trung vào việc bóc tách và giải thích kiến thức một cách khách quan:
- Nhận diện chính xác các thành phần ngôn ngữ trong hội thoại.
- Cung cấp dữ liệu gốc từ DB để đảm bảo tính chính xác của thông tin.
- Tạo ra trải nghiệm học tập tập trung vào việc hiểu sâu nội dung tri thức, hỗ trợ người dùng xây dựng nền tảng tiếng Nhật vững chắc.

---
*Tài liệu này được đồng bộ với `src/features/chat` và các tài liệu thiết kế Use Case.*
