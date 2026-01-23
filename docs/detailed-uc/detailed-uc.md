Đặc tả chức năng
Use Case 1: Học bài theo lô

Tên Use Case

Học bài theo lô

Mô tả

Người dùng học một lô bài học (Fixed Batch) theo thứ tự cố định

Bắt buộc xem toàn bộ nội dung bài học trước khi được làm quiz

Chỉ khi hoàn thành quiz thì lô bài học mới được đánh dấu là hoàn thành. Người dùng phải hoàn thành Lô hiện tại mới được bắt đầu Lô tiếp theo.

Actor

Người dùng

Điều kiện kích hoạt

Người dùng chọn một lô bài học chưa hoàn thành từ giao diện học tập

Tiền điều kiện

Người dùng đã đăng nhập

Lô bài học tồn tại trong hệ thống

Lô bài học chưa được hoàn thành

Hậu điều kiện

Lô bài học được đánh dấu hoàn thành nếu quiz đạt yêu cầu

Trạng thái không thay đổi nếu người dùng thoát giữa chừng

Luồng sự kiện chính

Người dùng chọn lô bài học

Hệ thống hiển thị các bài học trong lô

Người dùng xem lần lượt toàn bộ bài học

Hệ thống mở khóa phần quiz

Người dùng làm quiz

Hệ thống chấm điểm

Hệ thống khởi tạo trạng thái FSRS cho lô học:
- Phẩm cấp ban đầu: `learning`.
- Độ khó cơ sở (Difficulty Baseline): 3.0.
- Lên lịch ôn tập lần đầu (Next Review): 15-30 phút sau khi hoàn thành.

Hệ thống đánh dấu lô bài học hoàn thành

Use Case 2: Ôn tập kiến thức

Tên Use Case

Ôn tập kiến thức

Mô tả

Người dùng ôn tập các kiến thức đến hạn theo cơ chế hàng chờ

Hệ thống cập nhật trạng thái FSRS dựa trên kết quả trả lời đúng hoặc sai

Actor

Người dùng

Điều kiện kích hoạt

Người dùng chọn chức năng ôn tập

Tiền điều kiện

Người dùng đã đăng nhập

Có ít nhất một mục kiến thức đến hạn

Hậu điều kiện

Mục trả lời đúng:

Được cập nhật FSRS

Bị loại khỏi hàng chờ

Mục trả lời sai:

Được đưa lại vào hàng chờ.

**Quy trình đồng bộ**: Với Kanji/Vocabulary, mục chỉ được tính là hoàn thành (`is_passed = True`) và cập nhật FSRS khi trả lời đúng cả 2 diện (Nghĩa và Cách đọc) trong cùng một phiên.

Luồng sự kiện chính

Hệ thống lấy mục kiến thức đầu tiên từ hàng chờ

Hệ thống hiển thị câu hỏi theo loại nội dung

Người dùng trả lời câu hỏi

Hệ thống đánh giá kết quả

Nếu trả lời đúng:

Cập nhật FSRS (Tăng Stability/Interval). Nếu Stability >= 3 ngày, chuyển sang phẩm cấp `review`.

Loại mục khỏi hàng chờ

Nếu trả lời sai:

Đưa mục lại vào hàng chờ

Lặp lại cho đến khi hàng chờ rỗng hoặc người dùng thoát.

Use Case 3: Xem nội dung học tập

Tên Use Case

Xem nội dung học tập

Mô tả

Người dùng duyệt và xem các nội dung học tập:

Bộ thủ

Kanji

Từ vựng

Ngữ pháp

Actor

Người dùng

Điều kiện kích hoạt

Người dùng chọn nội dung học tập từ giao diện chính

Tiền điều kiện

Người dùng đã đăng nhập

Hậu điều kiện

Không thay đổi trạng thái học tập hoặc ôn tập

Luồng sự kiện chính

Người dùng chọn loại nội dung

Hệ thống hiển thị danh sách nội dung

Người dùng chọn nội dung cụ thể

Hệ thống hiển thị chi tiết nội dung

---

## Use Case 5: Tự động mở khóa giáo trình (Curriculum Unlocking)

**Mô tả**: Hệ thống tự động kiểm tra và mở khóa nội dung của Cấp độ (Level) tiếp theo dựa trên tiến độ thực tế.

**Tiền điều kiện**: Người dùng đã hoàn thành phần lớn nội dung ở Level hiện tại.

**Luồng sự kiện**:
1. Hệ thống tính tỷ lệ Kiến thức trong Level hiện tại đã đạt phẩm cấp `review` (Stability >= 3 ngày).
2. Nếu tỷ lệ này >= 90%:
   - Hệ thống tự động cập nhật `max_unlocked_level` cho người dùng.
   - Các bài học mới của Level kế tiếp sẽ tự động xuất hiện trong hàng chờ bài học (Lesson Queue).
3. Nếu < 90%: Giữ nguyên cấp độ hiện tại để đảm bảo tính vững chắc của kiến thức nền tảng.

Use Case 4: Chat với trợ lý học tập

Tên Use Case

Chat với trợ lý học tập

Mô tả

Người dùng trò chuyện với chatbot để:

Hỏi đáp kiến thức

Giải thích nội dung học

Xem nhận xét về tiến độ học tập

Dữ liệu phản hồi dựa trên thông tin trong hệ thống

Actor

Người dùng

Điều kiện kích hoạt

Người dùng mở giao diện chatbot

Tiền điều kiện

Người dùng đã đăng nhập

Người dùng có dữ liệu học tập

Hậu điều kiện

Không thay đổi trạng thái học tập

Trạng thái chỉ thay đổi nếu người dùng điều hướng sang nội dung khác

Luồng sự kiện chính

Người dùng nhập câu hỏi

Hệ thống phân tích câu hỏi

Hệ thống truy vấn dữ liệu liên quan

Hệ thống trả lời người dùng

Hiển thị các CTA nếu có nội dung liên quan