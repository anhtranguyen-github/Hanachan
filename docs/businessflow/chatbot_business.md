# Luồng hoạt động của Trợ lý Hanachan (Góc nhìn Nghiệp vụ)

Trợ lý Hanachan không chỉ là một chatbot trả lời tự động, mà hoạt động như một **Gia sư thông minh** bám sát tiến trình của bạn. Dưới đây là cách Hanachan xử lý yêu cầu của bạn một cách đơn giản nhất.

### 1. Luồng xử lý câu hỏi
Khi bạn gửi một lời nhắn, Hanachan thực hiện các bước sau:

1.  **Hồi tưởng ngữ cảnh**: Thay vì đọc toàn bộ hàng trăm tin nhắn cũ (gây nhiễu), Hanachan chỉ tập trung vào **6 tin nhắn gần nhất** và một **"Bản ghi nhớ làm việc"** (Session Summary). Bản ghi nhớ này giúp Hanachan luôn biết "Chúng ta đang làm gì?" và "Bạn đã chốt phương án nào?".
2.  **Tra cứu chủ động**: Nếu bạn hỏi về một từ tiếng Nhật, Hanachan sẽ không "đoán" mò. Cô ấy sẽ tự động vào **Kho giáo trình chính thức** để lấy dữ liệu chuẩn (nghĩa, bộ thủ, ví dụ).
3.  **Học hỏi tức thì**: Nếu trong lúc trò chuyện, bạn chốt một ý kiến (Ví dụ: "Tôi muốn tập trung vào Kanji N3") hoặc bạn chuyển sang chủ đề khác, Hanachan sẽ **ngầm cập nhật lại Bản ghi nhớ**. Nhờ vậy, ở lần hỏi sau, cô ấy sẽ không làm phiền bạn bằng các giải thích cũ.
4.  **Phản hồi thông minh**: Câu trả lời gửi đến bạn luôn đi kèm các **Nút học tập**. Bạn chỉ cần nhấn vào là xem được ngay chi tiết từ vựng/hán tự mà không cần gõ tìm kiếm.

### 2. Sơ đồ mô phỏng
Mô tả quy trình xử lý của Trợ lý từ lúc nhận tin nhắn đến lúc phản hồi:

![Sơ đồ luồng Chatbot](../businessflow/chatbot_logic_flow.puml)

### 3. Tại sao cơ chế này lại hiệu quả?
*   **Không lặp lại**: Nhờ "Bản ghi nhớ", Hanachan tránh việc giải thích đi giải thích lại một vấn đề bạn đã hiểu.
*   **Độ chính xác cao**: Luôn ưu tiên dữ liệu từ giáo trình trước khi dùng kiến thức AI chung.
*   **Tập trung mục tiêu**: AI luôn bám sát "Mục tiêu hiện tại" được ghi trong bản tóm tắt phiên chat.
