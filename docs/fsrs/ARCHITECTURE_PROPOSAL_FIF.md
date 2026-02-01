# Đánh giá Kiến trúc FIF + SRF (Failure Intensity Framework)

Đây là bản đánh giá kỹ thuật về mô hình SRS thế hệ mới do bạn đề xuất.

## 1. Tổng quan (Status)
**Trạng thái: ĐÃ TRIỂN KHAI (Fully Implemented in v2)**

Mô hình này giải quyết triệt để 3 vấn đề lớn nhất của các hệ thống SRS truyền thống và cả hệ thống hiện tại của Hanachan V2:
1.  **Chống Ease Hell**: Công thức `Capping` và `log2` ngăn chặn việc thẻ bị "phá hủy" chỉ số khi người dùng Drill nhiều lần.
2.  **Tracking được Effort**: Phân biệt được "Quên chút xíu" (sai 1 lần) và "Quên sạch" (sai 10 lần) -> FSRS hiện tại đánh đồng 2 cái này.
3.  **Trải nghiệm mượt mà**: Vẫn giữ giao diện Binary (Đúng/Sai) đơn giản, không bắt người dùng tự đánh giá.

---

## 2. Phân tích Toán học

### A. Failure Intensity (`log2`)
Công thức: `failureIntensity = min(log2(wrongCount + 1), MAX_FAILURE)`

Đây là điểm sáng nhất của thiết kế. Hãy xem tác động thực tế:
- **Sai 1 lần**: `log2(2) = 1.0` -> Phạt 1 đơn vị.
- **Sai 3 lần**: `log2(4) = 2.0` -> Phạt 2 đơn vị.
- **Sai 7 lần**: `log2(8) = 3.0` -> Phạt 3 đơn vị.

**Nhận xét**: "Luật hiệu suất giảm dần" (Diminishing Returns) được áp dụng hoàn hảo. Lần sai thứ 10 ít đau đớn hơn lần sai thứ 1 rất nhiều. Điều này phản ánh đúng tâm lý học hành vi: *Sai quá nhiều trong 1 session thường do tâm lý/mệt mỏi chứ không phải do trí nhớ kém hơn theo cấp số nhân.*

### B. Decay Formula
Công thức: `S_new = max(S * exp(-β * failure), S_min)`

- Giả sử `S = 10 ngày`, `β = 0.3`.
- Sai 1 lần (`F=1`): `S = 10 * 0.74 = 7.4 ngày`.
- Sai 3 lần (`F=2`): `S = 10 * 0.54 = 5.4 ngày`.
- Sai Max (`F=3`): `S = 10 * 0.40 = 4.0 ngày`.

**Nhận xét**: So với logic cũ (mỗi lần sai giảm 60% -> 10 ngày còn 0.6 ngày), logic này cực kỳ nhân đạo và bảo toàn được lịch sử học tập (Progress Preservation).

---

## 3. Thử thách Triển khai (Implementation Challenges)

Điểm yếu duy nhất của mô hình này nằm ở phần **Lưu trữ Trạng thái (Persistence)** mà chúng ta đã thảo luận trước đó (Vấn đề "Crash Browser").

### Giải pháp kỹ thuật (Refined)
Để khắc phục rủi ro mất dữ liệu khi chờ "Deferred Calculation", ta cần update DB nhưng update vào bảng tạm:

1.  **Table**: `review_session_items` cần thêm cột `wrong_count` (int, default 0).
2.  **On Answer (Fail)**:
    - Update `wrong_count += 1` vào DB ngay lập tức (Atomic).
    - **Chưa** gọi FSRS recalculate.
    - Requeue thẻ trong Memory.
3.  **On Answer (Correct)**:
    - Đọc `wrong_count` từ DB (hoặc Memory state).
    - Tính toán `failureIntensity`.
    - Gọi FSRS update 1 lần duy nhất.
    - Commit `next_review`.

---

**Kết luận**: Đây là một bản nâng cấp cốt lõi, giúp Hanachan cạnh tranh sòng phẳng về độ thông minh với các app SRS hàng đầu.

**Ghi chú**: Đã hoàn thành tích hợp vào `FSRSEngine.ts` và `ReviewSessionController.ts`.

Chi tiết về báo cáo vận hành và kịch bản: [Báo cáo Tổng hợp FSRS (Final Report)](./FSRS_FINAL_REPORT.md)
