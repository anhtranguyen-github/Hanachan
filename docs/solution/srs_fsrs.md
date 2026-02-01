# Phương pháp học lặp lại ngắt quãng - SRS (FSRS)

Hệ thống Hanachan áp dụng phương pháp học lặp lại ngắt quãng (Spaced Repetition System - SRS) nhằm tối ưu hóa khả năng ghi nhớ dài hạn của người học. Thay vì ôn tập theo lịch cố định, SRS cho phép hệ thống xác định thời điểm ôn lại phù hợp dựa trên mức độ ghi nhớ thực tế, qua đó giúp người học tập trung vào các nội dung có nguy cơ bị quên cao và giảm thiểu thời gian ôn tập không cần thiết.

## 1. Thuật toán FSRS (Free Spaced Repetition Scheduler)

Đề tài lựa chọn sử dụng thuật toán **FSRS** để triển khai SRS cho các flashcard trong hệ thống. Khác với các thuật toán truyền thống như SM-2, FSRS mô hình hóa trí nhớ người học thông qua các tham số toán học:
- **Stability (Độ ổn định)**: Khoảng thời gian (tính bằng ngày) mà người học có 90% khả năng ghi nhớ thông tin đó.
- **Difficulty (Độ khó)**: Phản ánh độ khó bản chất của một Knowledge Unit (KU).
- **Retrievability (Khả năng triệu hồi)**: Xác suất người học nhớ được kiến thức tại thời điểm hiện tại.

Mỗi flashcard được gắn với một trạng thái ghi nhớ duy nhất trong bảng `user_learning_states`, độc lập với Level hay bài học. Toàn bộ lịch ôn tập được quyết định dựa trên trạng thái SRS riêng biệt của từng flashcard. Việc cập nhật SRS được thực hiện **ngay sau khi trả lời đúng**, tích hợp toàn bộ số lỗi sai (`wrongCount`) trong phiên đó để tính toán hình phạt (FIF Architecture).

## 2. Quy trình học tập và Hàng đợi (Queue)

Trong quá trình học, hệ thống xây dựng hàng đợi học tập dựa trên trạng thái của flashcard:
- **New**: Các mục chưa từng được học.
- **Learning**: Các mục đang trong giai đoạn tiếp thu ban đầu (chưa ổn định).
- **Review**: Các mục đã ổn định và cần ôn tập dựa trên lịch của FSRS.
- **Relearning**: Các mục đã thuộc nhưng bị quên và cần học lại.

- **FIF (Failure Intensity Framework)**: Áp dụng cơ chế phạt logarit dựa trên số lần sai (`wrongCount`). $Stability_{new} = Stability \times exp(-0.3 \times log_2(wrongCount + 1))$.
- **Tính trễ (Deferred Update)**: Chỉ cập nhật FSRS khi người dùng đã vượt qua (Correct). Việc sai nhiều lần chỉ làm tăng "Cường độ thất bại" cho lần cập nhật duy nhất đó.
- Kết quả cuối cùng được cập nhật vào thời điểm `next_review` chính xác nhất.

## 3. Tính nhất quán của Trí nhớ (Memory Consistency)

Một đặc điểm quan trọng trong triển khai SRS của Hanachan là trạng thái FSRS được gán trực tiếp cho từng Knowledge Unit cụ thể (Kanji, từ vựng, ngữ pháp). Việc ôn tập một KU ở bất kỳ đâu (trong bài học chính hay phiên ôn tập) sẽ tự động cập nhật trạng thái ghi nhớ trên toàn bộ hệ thống. Điều này giúp tránh trùng lặp ôn tập và duy trì tiến trình học bền vững.

---
*Tài liệu này được đồng bộ với `FSRS_LOGIC.md` và `final_schema.sql`.*
