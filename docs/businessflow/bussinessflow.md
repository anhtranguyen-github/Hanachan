1. Bắt đầu học

1.1 User bấm “Bắt đầu học”

1.2 System kiểm tra điều kiện mở khóa Level tiếp theo:
- Quét số lượng Kiến thức ở Level hiện tại.
- Nếu >= 90% Kiến thức đã ở trạng thái `review` (Stability >= 3 ngày):
  - Tự động nâng `max_unlocked_level` của User.
  - Tải bài học từ Level mới.
- Nếu chưa đủ 90%:
  - Tiếp tục tải bài học còn lại của Level hiện tại.

1.3 System tạo lô học (Fixed Sequential Batch):
- Nội dung bài học được chia thành các lô cố định (ví dụ: Lô 1, Lô 2...).
- User bắt buộc phải hoàn thành Lô hiện tại mới được truy cập Lô tiếp theo.
- Thứ tự các bài học bên trong mỗi Lô là cố định theo giáo trình.

2. Xem nội dung bài học

2.1 System hiển thị bài học đầu tiên

2.2 User xem nội dung bài học

2.3 System chuyển sang bài học tiếp theo

2.4 Rẽ nhánh:

2.4.A Nếu còn bài học chưa xem

Tiếp tục hiển thị bài học

2.4.B Nếu đã xem hết

Chuyển sang giai đoạn làm quiz

3. Khởi tạo quiz

3.1 System khởi tạo quiz cho lô học

3.2 System hiển thị câu hỏi quiz đầu tiên

4. Làm quiz

4.1 User trả lời câu hỏi

4.2 Rẽ nhánh:

4.A Trả lời đúng

Đánh dấu đúng

Chuyển sang câu hỏi tiếp theo

4.B Trả lời sai

Đưa câu hỏi về cuối lô quiz

4.C User thoát phiên học

Lưu trạng thái chưa hoàn thành

Kết thúc phiên

5. Kiểm tra hoàn thành quiz

5.1 Rẽ nhánh:

5.1.A Nếu còn câu hỏi sai

Tiếp tục vòng lặp quiz

5.1.B Nếu tất cả đều đúng

Hoàn thành lô học

6. Kết thúc

6.1 Đánh dấu lô học đã hoàn thành

6.2 Khởi tạo trạng thái FSRS: 
- Thiết lập trạng thái `learning` (Mới học).
- Thiết lập độ khó cơ bản (Difficulty Baseline) = 3.0.
- Lên lịch ôn tập lần đầu (Next Review) sau 15-30 phút.

6.3 User xem thông báo hoàn thành

Quy trình ôn tập bài đến hạn

1. Bắt đầu ôn tập

1.1 User bấm “Bắt đầu ôn tập”

System lấy danh sách kiến thức đến hạn

Tạo hàng chờ ôn tập

2. Chuẩn bị item

2.1 Lấy item đầu tiên trong hàng chờ

2.2 Xác định loại item:

Bộ thủ

Kanji

Từ vựng

Ngữ pháp

2.3 Sinh câu hỏi ôn tập tương ứng

3. Trả lời

3.1 User trả lời câu hỏi

4. Xử lý theo loại item

4.A Bộ thủ / Kanji

4.A.a Nếu đúng
- Cập nhật FSRS (Tăng Stability/Interval).
- Nếu Stability >= 3 ngày: Chuyển sang phẩm cấp `review` (Đã thuộc).
- Loại item khỏi hàng chờ.

4.A.b Nếu sai

Đưa item về cuối hàng chờ

4.B Từ vựng (Vocabulary Session Rule)

Kiểm tra nghĩa + cách đọc (Phải vượt qua cả hai mới được ra khỏi hàng chờ):

4.B.a Nếu trả lời đúng facet (nghĩa hoặc đọc)
- Facet đó được đánh dấu là "tạm thời vượt qua" trong phiên này.
- Nếu cả hai facet (nghĩa + đọc) đã xong: 
  - Tính toán FSRS (Nếu có lỗi trong phiên này thì dùng Rating 'fail', nếu không có lỗi thì dùng 'pass').
  - Loại item khỏi hàng chờ chính thức.

4.B.b Nếu trả lời sai 
- Đưa facet bị sai về cuối hàng chờ để làm lại.
- Đánh dấu KU này là "đã từng sai trong phiên" để phạt SRS khi hoàn thành.

4.C Ngữ pháp

Chọn ngẫu nhiên câu ví dụ

Tạo câu cloze

4.C.a Nếu đúng

Cập nhật FSRS

Loại item

4.C.b Nếu sai

Đưa item về cuối hàng chờ

5. Thoát sớm

5.1 User thoát phiên ôn tập

Kết thúc phiên

Giữ nguyên trạng thái các item còn lại

6. Kết thúc

6.1 Nếu hàng chờ rỗng

Kết thúc phiên ôn tập

Quy trình trò chuyện với Chatbot

1. Khởi tạo

1.1 User mở màn hình chatbot

System khởi tạo phiên trò chuyện

2. Nhập câu hỏi

2.1 User nhập câu hỏi / tin nhắn

2.2 System phân tích mục đích

2.3 Rẽ nhánh:

2.3.A Nếu không liên quan học tập

Từ chối hoặc chuyển hướng

2.3.B Nếu liên quan học tập

Tiếp tục xử lý

3. Xác định loại yêu cầu

3.1 System xác định loại yêu cầu

Loại 1: Hỏi về tiến độ học tập

3.1.A Truy vấn dữ liệu tiến độ học

3.1.A.1 Tổng hợp và diễn giải:
- Level hiện tại
- Số lượng kiến thức đã nắm vững (Review stage)
- Số lượng kiến thức cần ôn tập

3.1.A.2 User xem phản hồi
Hiển thị nhận xét và gợi ý học tập.

Loại 2: Giải thích kiến thức

3.1.B Truy vấn kiến thức trong CSDL

3.1.B.1 Sinh nội dung giải thích

3.1.B.2 Rẽ nhánh:

3.1.B.2.A Nếu tìm thấy kiến thức

Tạo CTA tương ứng

3.1.B.2.B Nếu không có

Chỉ hiển thị giải thích

3.1.B.3 User xem phản hồi

Câu trả lời

Các nút CTA (nếu có)

4. Điều hướng

4.1 User bấm CTA

Mở module tương ứng:

Lesson

Vocab

Kanji

Grammar

5. Kết thúc

5.1 Tiếp tục chat → quay lại bước nhập câu hỏi

5.2 Thoát chatbot → kết thúc phiên