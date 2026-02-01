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

**Quy trình độc lập (Independence Law)**: Với Kanji/Vocabulary, các khía cạnh (Nghĩa, Cách đọc) được cập nhật FSRS hoàn toàn độc lập. Fail một diện không ảnh hưởng đến diện kia. FSRS chỉ được cập nhật khi diện đó được trả lời đúng (Commit), ghi nhận tất cả lỗi sai trong phiên.

Luồng sự kiện chính

Hệ thống lấy mục kiến thức đầu tiên từ hàng chờ

Hệ thống hiển thị câu hỏi theo loại nội dung

Người dùng trả lời câu hỏi

Hệ thống đánh giá kết quả

Nếu trả lời đúng (Commit Phase):

Cập nhật FSRS (Sử dụng FIF với `wrongCount`). Nếu Stability >= 3 ngày, chuyển sang phẩm cấp `review`.

Loại mục khỏi hàng chờ (Remove from Session)

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

**Mô tả**: Hệ thống tự động kiểm tra và mở khóa nội dung của Cấp độ (Level) tiếp theo dựa trên tiến độ thực tế (Luật 90%).

**Tiền điều kiện**: Người dùng đã đăng nhập.

**Luồng sự kiện**:
1. Hệ thống tính tỷ lệ Kiến thức trong Level hiện tại đã đạt phẩm cấp `review` hoặc `burned` (Stability >= 3 ngày).
2. Nếu tỷ lệ này >= 90%:
   - Hệ thống tự động cập nhật cấp độ hiện tại (`level`) trong hồ sơ người dùng.
   - Các bài học mới của Level kế tiếp sẽ bắt đầu xuất hiện.
3. Nếu < 90%: Giữ nguyên cấp độ hiện tại để đảm bảo tính vững chắc của kiến thức nền tảng.

## Use Case 6: Giới hạn học tập hàng ngày (Daily Learning Limit)

**Mô tả**: Hệ thống giới hạn số lượng kiến thức mới nạp vào mỗi ngày để bảo vệ sức khỏe học tập.

**Điều kiện kích hoạt**: Người dùng bắt đầu một lô học mới (Lesson Batch).

**Luồng sự kiện**:
1. Hệ thống đếm số lượng `lesson_batches` người dùng đã thực hiện trong vòng 24 giờ qua (tính từ 00:00).
2. Nếu số lượng < 10: Cho phép tiếp tục bài học.
3. Nếu số lượng >= 10:
   - Hệ thống chặn việc tạo bài học mới.
   - Hiển thị thông báo giới hạn hàng ngày và khuyến khích người dùng quay lại vào ngày mai hoặc tập trung ôn tập thẻ cũ.

---

Use Case 4: Chat với trợ lý học tập

Tên Use Case

Chat với trợ lý học tập

Mô tả

Người dùng trò chuyện với chatbot để:

Hỏi đáp kiến thức

Giải thích nội dung học

Tra cứu thông tin liên quan (Kanji, Từ vựng)

Dữ liệu phản hồi dựa trên thông tin trong hệ thống

Actor

Người dùng

Điều kiện kích hoạt

Người dùng mở giao diện chatbot

Tiền điều kiện

Người dùng đã đăng nhập




Hậu điều kiện

Không thay đổi trạng thái học tập

Trạng thái chỉ thay đổi nếu người dùng điều hướng sang nội dung khác

Luồng sự kiện chính

Người dùng nhập câu hỏi

Hệ thống phân tích câu hỏi

Hệ thống truy vấn dữ liệu liên quan

Hệ thống trả lời người dùng

Hiển thị các CTA nếu có nội dung liên quan