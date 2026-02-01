## 0. Mối liên hệ cốt lõi: Tam giác $S - D - R$

Trước khi đi sâu vào sự tiến hóa, ta cần hiểu FSRS vận hành dựa trên một tam giác toán học chặt chẽ:

1.  **$R$ (Retrievability)**: Là "Bề nổi" - Những gì ta thấy ngay bây giờ.
    *   Công thức: $R(t) = e^{-t/S}$ ($t$ là thời gian trôi qua).
    *   Ý nghĩa: Khi $t = S$, xác suất nhớ $R \approx 0.36$. Mục tiêu của FSRS là lập lịch sao cho khi $R$ chạm ngưỡng $0.9$ (90%) thì người dùng sẽ ôn tập.
2.  **$S$ (Stability)**: Là "Chiều sâu" - Độ bền của trí nhớ.
    *   $S$ càng lớn, đồ thị $R$ suy giảm càng chậm.
    *   $S$ được tăng lên sau mỗi lần ôn tập thành công.
3.  **$D$ (Difficulty)**: Là "Lực cản" - Độ khó của kiến thức.
    *   $D$ nằm ở **mẫu số** của hàm tăng trưởng $S$.
    *   $D$ càng cao, mỗi lần ôn tập đúng $S$ sẽ tăng càng ít (trí nhớ khó bền vững hơn).

---

## 1. Giai đoạn 1: FSRS Truyền thống (Original FSRS)

### Cơ chế hoạt động:
Trong giai đoạn đầu, Hanachan v2 sử dụng mô hình FSRS tiêu chuẩn với các quy tắc:
- **Thông số chính**: Stability ($S$), Difficulty ($D$), Retrievability ($R$).
- **Vai trò của $D$ (Difficulty)**: Quyết định tốc độ tăng trưởng của trí nhớ. Thẻ càng khó thì khoảng cách giữa các lần ôn tập càng ngắn lại.
- **Vai trò của $R$ (Retrievability)**: Xác suất nhớ được thẻ tại thời điểm hiện tại. Hệ thống lập lịch dựa trên việc giữ $R \ge 90\%$.
- **Phản ứng khi Sai**: 
    - Giảm Stability ngay lập tức về $40\%$ ($S = S \times 0.4$).
    - **Tăng Độ khó ($D$)**: Mỗi lần nhấn "Again", $D$ lại bị cộng thêm một lượng cố định.
    - **Reset xác suất ($R$)**: $R$ coi như về $0$, buộc phải học lại ngay.

### Nhược điểm (Vấn đề "D-Spike" và "R-Noise"):
- **D-Spike (Vọt độ khó)**: Nếu nhấn "Again" 5 lần liên tiếp, $D$ sẽ vọt lên mức tối đa ($5.0$) cực nhanh. Thẻ bị dán nhãn là "Siêu khó" một cách oan uổng, dù thực tế bạn chỉ quên tạm thời.
- **R-Noise (Nhiễu xác suất)**: Việc tính toán lại $R$ liên tục trong 5 phút không đem lại ý nghĩa về mặt thống kê trí nhớ dài hạn, mà chỉ gây tốn tài nguyên xử lý.
- **Trừng phạt lũy thừa**: $S \times 0.4 \times 0.4 \times 0.4 \dots$ khiến thành quả học tập nhiều tháng bị xóa sạch chỉ sau vài phút vật lộn.

---

## 2. Giai đoạn 2: Khung Failure Intensity Framework (FIF)

### FIF là gì?
FIF không phải là một thuật toán Spaced Repetition độc lập, mà là một **bộ lọc dữ liệu nỗ lực (Effort Filter)**. Nó hoạt động trong phạm vi **một phiên học (Intra-session)**.

### Cách FIF hoạt động (Drill Mode):
1.  Khi người dùng trả lời **Sai**, FIF chặn cuộc gọi cập nhật FSRS.
2.  Thay vào đó, nó tăng một biến đếm nỗ lực: `wrongCount++`.
3.  Nó đẩy thẻ xuống cuối hàng đợi để người dùng gặp lại ngay (Drilling).
4.  **Cường độ thất bại (Intensity - $I$)** được tính theo hàm Logarit:
    $$I = \min(\log_2(wrongCount + 1), 3.0)$$
    *Ý nghĩa: Lần lỗi thứ 10 ít "đau đớn" hơn lần lỗi đầu tiên. Phản ánh đúng thực tế là khi đã quên, việc thử lại nhiều lần là quá trình nạp lại thông tin (re-encoding), không phải là dấu hiệu của trí nhớ tệ đi hàng chục lần.*

---

## 3. Giai đoạn 3: Sự kết hợp của FSRS và FIF (Current System)

Hệ thống hiện tại của Hanachan V2 là sự kết hợp hoàn hảo giữa tính khoa học của FSRS và tính thực tiễn của FIF.

### Quy trình "Drill then Commit":
- **Giai đoạn Drill (FIF)**: Người dùng có thể sai nhiều lần. Dữ liệu nỗ lực được tích lũy vào `wrongCount`. Không có dữ liệu FSRS nào bị thay đổi ở giai đoạn này.
- **Giai đoạn Commit (FSRS)**: Ngay khi người dùng trả lời **Đúng**, FIF "mở khóa" cho FSRS. FSRS sẽ thực hiện cập nhật **một lần duy nhất** dựa trên "Cường độ thất bại" đã được FIF tính toán.

### Công thức kết hợp (Hybrid Formulas):

#### 1. Điều chỉnh Độ khó ($D$) - Chống D-Spike:
$D$ không tăng theo từng lần Sai, mà tăng theo "Cường độ":
$$D_{new} = D + (0.2 \times I)$$

#### 2. Điều chỉnh Độ bền ($S$) - Chống Ease Hell:
$S$ được bảo vệ bằng cách tính toán trễ. Thay vì reset liên tục, FIF tính $S$ dựa trên cường độ lỗi duy nhất để giữ vững nền tảng trí nhớ:
$$S_{new} = S \times e^{-0.3 \times I}$$

#### 3. Điều chỉnh Lập lịch ($R$):
Lập lịch ôn tập tiếp theo ($t$) được thực hiện tại điểm mà Xác suất nhớ $R$ chạm ngưỡng mục tiêu (thường là $0.9$).
$$t = S \times \ln(1/0.9)$$
Nhờ FIF, giá trị $S$ không bị phá hủy, giúp khoảng thời gian $t$ này thực tế hơn, tránh việc người dùng bị "tra tấn" bởi các vòng lặp ôn tập quá dày đặc vô ích.

---

## 4. Bảng so sánh tổng hợp

| Đặc điểm | FSRS Truyền thống | Kiến trúc FSRS-FIF (Hanachan v2) |
| :--- | :--- | :--- |
| **Số lần cập nhật DB** | Mỗi lần nhấn nút (nhiều lần) | Chỉ duy nhất 1 lần khi trả lời Đúng (Atomic) |
| **Vấn đề Ease Hell** | Có (Nghiêm trọng) | **Không** (Được bảo vệ bởi logarit) |
| **Độ chính xác** | Thấp (Bị nhiễu bởi Drill) | **Cao** (Phản ánh đúng nỗ lực thực tế) |
| **Xử lý Sai nhiều lần** | Phạt lũy thừa (Exponential) | Phạt giảm dần (Logarithmic) |
| **Tính nhất quán** | Dễ bị Zombie Card nếu crash | An toàn nhờ Atomic Commit |

## 6. Giai đoạn 4: Hàng rào Bảo vệ Sức khỏe (Healthy Learning Boundary)

Sự tiến hóa cuối cùng không nằm ở công thức toán học, mà ở **Kỷ luật Học tập**.

### Giới hạn 10 Batch mỗi ngày:
Để ngăn chặn việc user học quá nhiều trong một lúc (gây ra hiện tượng nghẽn cổ chai ôn tập vào các ngày sau), hệ thống áp dụng:
*   **Quota**: Tối đa 10 đợt học (50 từ mới) / 24 giờ.
*   **Mục đích**: Bảo vệ bộ não khỏi sự quá tải (Cognitive Overload) và duy trì tỷ lệ nhớ (Retention) trên 90%.

## 7. Kết luận
Việc kết hợp **FSRS**, **FIF** và **Daily Limits** biến hệ thống Spaced Repetition của Hanachan từ một công cụ cứng nhắc thành một trí tuệ nhân tạo hiểu được nỗ lực của con người. Nó không chỉ hỏi "Bạn nhớ hay quên?", mà còn hỏi "Bạn đã vất vả như thế nào để nhớ lại?" và "Bạn đã học đủ cho hôm nay chưa?", từ đó đưa ra lộ trình bền vững nhất.
