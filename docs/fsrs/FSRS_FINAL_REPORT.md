# Báo cáo Phân tích Thuật toán FSRS - Hanachan v2
## Failure Intensity Framework (FIF) & Spaced Repetition

Tài liệu này tổng hợp chi tiết về mặt toán học, hiệu quả thực tế và các kịch bản vận hành của thuật toán FSRS được tinh chỉnh với kiến trúc FIF trong hệ thống Hanachan.

---

## 1. Hệ thống Công thức và Ý nghĩa Tham số

Thuật toán FSRS trong Hanachan v2 không chỉ là một bộ lập lịch (scheduler) mà là một mô hình mô phỏng trí nhớ động.

### 1.1. Các biến trạng thái (State Variables)
- **$S$ (Stability)**: Độ bền trí nhớ (đơn vị: ngày). Đây là khoảng thời gian dự kiến để xác suất người dùng nhớ được kiến thức đạt 90%.
- **$D$ (Difficulty)**: Độ khó nội tại của thẻ (thang điểm 1.3 - 5.0). $D$ càng cao, $S$ càng tăng chậm.
- **$Reps$ (Repetitions)**: Số lần trả lời đúng liên tiếp (trong các phiên khác nhau).
- **$Lapses$ (Lapses)**: Số lần người dùng quên thẻ hoàn toàn.

### 1.2. Các tham số điều khiển (Control Params)
- **$wrongCount$**: Số lần trả lời sai tích lũy trong **duy nhất một phiên** ôn tập hiện tại.
- **$Intensity$ ($I$)**: Cường độ thất bại, tính theo logarit:
  $$I = \min(\log_2(wrongCount + 1), 3.0)$$
- **$\alpha$ (0.2)**: Hệ số nhạy cảm của độ khó (Difficulty Sensitivity).
- **$\beta$ (0.3)**: Hệ số suy giảm (Decay Factor).

### 1.3. Logic Cập nhật (Math Logic)

#### Trường hợp A: Trả lời Đúng hoàn hảo ($wrongCount = 0$)
Hệ thống ghi nhận bạn đã nắm vững kiến thức:
1.  **Tăng Stability**: 
    $$S_{new} = S \times 1.5 \times \left(\frac{3.0}{D}\right)$$
2.  **Giảm Độ khó**: 
    $$D_{new} = \max(1.3, D - 0.1)$$

#### Trường hợp B: Trả lời Đúng sau khi đã Sai ($wrongCount > 0$)
Đây là lúc kiến trúc FIF phát huy tác dụng:
1.  **Phạt Độ khó**: 
    $$D_{new} = \min(5.0, D + (0.2 \times I))$$
2.  **Suy giảm Stability**: 
    $$S_{new} = \max(0.1, S \times e^{-0.3 \times I})$$
3.  **Reset Reps**: Nếu $I > 0.5$ (sai từ 1 lần trở lên), $Reps = \max(1, Reps - 1)$.

---

## 2. Phân tích Hiệu quả và Xử lý Trường hợp Đặc biệt

### 2.1. Giải quyết hiện tượng "Ease Hell" (Địa ngục độ khó)
Trong các hệ thống SRS cũ (như SM-2), mỗi lần bạn sai, hệ thống phạt bạn một lượng cố định. Nếu bạn sai 10 lần trong 1 phút do mệt mỏi, Stability sẽ về 0. 
**FIF Giải quyết bằng Logarit**: 
- Sai 1 lần: $I = 1.0 \rightarrow S$ giảm còn ~74%.
- Sai 3 lần: $I = 2.0 \rightarrow S$ giảm còn ~54%.
- Sai 7 lần: $I = 3.0 \rightarrow S$ giảm còn ~40%.
- **Lợi ích**: Hình phạt nặng hơn cho người thực sự quên, nhưng không bao giờ "xóa trắng" tiến trình của người dùng chỉ vì một lần vấp ngã trong phiên học.

### 2.2. Xử lý Trường hợp Biên (Edge Cases)

| Trường hợp | Cách xử lý | Ý nghĩa sư phạm |
| :--- | :--- | :--- |
| **New Card** | Khởi tạo $S=0.1$, $D=3.0$ | Bắt đầu từ mức trung bình. |
| **Bất tử (Burned)** | $S \ge 120$ ngày | Coi như đã nhớ vĩnh viễn, ẩn khỏi hàng chờ hàng ngày. |
| **Sai quá nhiều** | $I$ bị Cap ở mức 3.0 | Giới hạn hình phạt tối đa, tránh việc thẻ bị kẹt ở mốc 0.1s mãi mãi. |
| **Stability Guard** | $S_{new} \ge S_{prev}$ khi Đúng | Đảm bảo lịch học không bao giờ bị "văng ngược" về quá khứ khi bạn trả lời đúng. |
| **Min Stability** | Sàn 0.1 ngày (2.4h) | Đảm bảo bạn gặp lại thẻ trong ngày nếu sai, không đẩy sang ngày mai. |

---

## 3. Kịch bản Mô phỏng Thực tế

### Kịch bản 1: "Thiên tài ôn tập" (Perfect Path)
Người dùng trả lời đúng 100% các lần gặp đầu tiên.
- **Vòng đời**: 4h $\rightarrow$ 8h $\rightarrow$ 1 ngày $\rightarrow$ 3 ngày $\rightarrow$ 7 ngày...
- **Kết quả**: Thẻ thăng cấp rất nhanh, tiết kiệm thời gian cho người học.

### Kịch bản 2: "Sai lầm nhất thời" (One-hit Fail)
Người dùng đã học đến mốc $S = 10$ ngày, nhưng hôm nay quên. Sai 1 lần rồi nhớ ra ngay.
- **Tính toán**: $I = 1.0 \rightarrow S_{new} = 10 \times 0.74 = 7.4$ ngày.
- **Phản hồi**: Hệ thống lùi lịch lại một chút để củng cố, nhưng không bắt bạn học lại từ đầu ($S=0.1$).

### Kịch bản 3: "Quên sạch kiến thức" (Struggle Path)
Thẻ $S=10$ ngày, người dùng sai 7 lần mới nhớ ra.
- **Tính toán**: $I = 3.0 \rightarrow S_{new} = 10 \times 0.40 = 4.0$ ngày.
- **Phản hồi**: Hình phạt nặng nhất. Hệ thống nhận diện đây là mảng kiến thức cực khó và sẽ hỏi lại thường xuyên hơn trong thời gian tới để củng cố.

### Kịch bản 4: "Học bù tập trung" (Drill Session)
Người dùng đang trong phiên học mới (Lesson Quiz), sai 15 lần cho 1 từ vựng.
- **Tính toán**: $I$ đạt mức trần 3.0.
- **Phản hồi**: Stability khởi tạo sụt giảm tương ứng nhưng vẫn giữ ở mức an toàn. Người dùng được Drill thẻ đó liên tục tại chỗ cho đến khi thuộc mới được qua bài.

---

## 4. Kết luận
Kiến trúc FSRS-FIF trên Hanachan v2 là sự hài hòa giữa **toán học chính xác** và **tâm lý học thực hành**. Nó ngăn chặn sự nản lòng của người học bằng cách bảo vệ thành quả cũ, đồng thời vẫn đủ nghiêm khắc để đảm bảo kiến thức khó được lặp lại đủ nhiều.
