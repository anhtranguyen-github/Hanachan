# Hướng dẫn chi tiết Thuật toán FSRS (Hanachan v2)

Tài liệu này giải thích ý nghĩa, cơ chế hoạt động và các kịch bản thực tế của thuật toán **FSRS (Free Spaced Repetition Scheduler)** được áp dụng trong Hanachan.

---

## 1. FSRS là gì? Tại sao lại dùng nó?

### Ý nghĩa triết học
Bình thường, chúng ta học rồi quên. FSRS không cố gắng ngăn cản việc quên, mà nó tìm cách **nhắc lại đúng lúc bạn chuẩn bị quên**.
- **Spaced Repetition (Lặp lại ngắt quãng)**: Càng ghi nhớ tốt, thời gian gặp lại càng xa.
- **Tính cá nhân hóa**: Mỗi người có tốc độ quên khác nhau. FSRS điều chỉnh lịch trình dựa trên chính "lịch sử thất bại" của bạn.

### Các thông số cốt lõi (The Brain)

Trong Hanachan, việc người dùng "điền kết quả" (Typing) sẽ được hệ thống tự động ánh xạ (mapping) sang các tín hiệu điều khiển của thuật toán FSRS:

- **Hành động của Người dùng**: Nhập đáp án vào ô input.
- **Hành động của Hệ thống**:
    - **Nếu đáp án ĐÚNG**: Hệ thống tự động phát tín hiệu `Good` tới bộ não FSRS.
    - **Nếu đáp án SAI**: Hệ thống tự động phát tín hiệu `Again` tới bộ não FSRS.

*Lưu ý: Bạn không cần phải tự chọn "Dễ" hay "Khó" như các app khác. Hanachan đo lường trí nhớ của bạn một cách khách quan dựa trên việc bạn có nhớ đúng từ đó hay không.*

---

## 2. Vòng đời của một thẻ kiến thức (4 Stages)

Mỗi "khía cạnh" của từ vựng (Ý nghĩa - Meaning hoặc Cách đọc - Reading) sẽ trải qua 4 giai đoạn:

| Giai đoạn | Ý nghĩa giáo dục | Logic FSRS |
| :--- | :--- | :--- |
| **New** | Mới gặp lần đầu | Chưa có chỉ số. |
| **Learning** | Giai đoạn "Nhồi" | Stability < 3 ngày. Bạn sẽ gặp lại từ này liên tục trong ngày. |
| **Review** | Giai đoạn "Ngấm" | Stability từ 3 - 120 ngày. Kiến thức bắt đầu chuyển vào bộ nhớ dài hạn. |
| **Burned** | Giai đoạn "Thành thục" | Stability > 120 ngày (4 tháng). Bạn đã nhớ vĩnh viễn, thẻ sẽ được cất đi. |

---

## 3. Các kịch bản thực tế (Scenarios)

### Kịch bản A: "Học giỏi" (Thăng tiến thần tốc)
Bạn liên tục **trả lời ĐÚNG** (Hệ thống tự nhận diện là `Good`).
- **Lần 1**: Gặp lại sau 4 tiếng.
- **Lần 2**: Gặp lại sau 8 tiếng.
- **Lần 3**: Gặp lại sau 1 ngày.
- **Lần 4**: Gặp lại sau 3 ngày (Lên cấp **Review**).
- **Lần 15**: Stability đạt > 120 ngày (Lên cấp **Burned**).
- **Ý nghĩa**: Mỗi lần bạn đúng, Stability tăng gấp khoảng 1.5 lần.

### Kịch bản B: "Hay quên" (Hệ thống tự thích nghi)
Bạn gặp một Kanji khó và **trả lời SAI** một hoặc nhiều lần trong phiên.
- **Hình phạt (FIF)**: Stability giảm dựa trên cường độ lỗi (`Intensity`). Càng sai nhiều lần trong quá trình Drill, thẻ càng bị kéo về mốc thời gian gần hơn.
- **Lùi cấp**: Ngay cả khi đang ở mức Review, nếu gặp lỗi đáng kể bạn sẽ bị kéo về mức **Learning** để "củng cố lại nền tảng".
- **Điều chỉnh độ khó**: Hệ thống tự tăng độ khó của từ đó (`difficulty` tăng), khiến những lần đúng tiếp theo Stability sẽ tăng chậm hơn bình thường (do D nằm ở mẫu số trong công thức tăng trưởng).

### Kịch bản C: "Tính độc lập" (Independence Law)
Bạn học từ **日本語 (Nihongo)**. 
- Bạn nhớ nghĩa là "Tiếng Nhật" (**Trả lời ĐÚNG** nghĩa).
- Nhưng bạn quên cách đọc là "Nihongo" (**Trả lời SAI** cách đọc).
- **Kết quả**: Nghĩa của từ vẫn được đẩy đi xa (ví dụ 3 ngày sau mới hỏi lại), nhưng cách đọc sẽ bị bắt gặp lại sau 2 tiếng. Não bạn chỉ tập trung sửa lỗi chỗ nào thực sự yếu.

---

## 4. Quy tắc 90% Mastery (Checkpoints)

Hệ thống không chỉ nhìn vào từng từ đơn lẻ mà còn nhìn vào toàn bộ Level:
- Khi **90%** số từ trong Level hiện tại của bạn đạt trạng thái **Review** hoặc **Burned**, Hanachan sẽ thông báo: *"Bạn đã làm chủ Level này!"* và tự động mở khóa Level tiếp theo.
- Điều này đảm bảo bạn không bị "ngợp" bởi quá nhiều từ mới trong khi từ cũ chưa thực sự ổn định.

---

## 5. Tổng kết thông số kỹ thuật

- **Sàn Stability**: 0.1 ngày (2.4 giờ).
- **Trần Stability**: Không giới hạn (nhưng > 120 ngày là Burned).
- **Trần Difficulty**: 1.3 (Dễ nhất) đến 5.0 (Khó nhất).
- **Default Difficulty**: 3.0.

---

## 6. Tài liệu Kỹ thuật (Technical Docs)

- [Báo cáo Tổng hợp FSRS (Final Report)](./FSRS_FINAL_REPORT.md) - Tài liệu tổng hợp công thức, hiệu quả và kịch bản.
- [Sự tiến hóa của FSRS & FIF](./EVOLUTION_FSRS_TO_FIF.md) - So sánh FSRS truyền thống và kiến trúc FIF mới.
- [Quy trình Review chi tiết (Process Flow)](./REVIEW_PROCESS.md) - Giải thích luồng dữ liệu và xử lý backend.
- [Các kịch bản FSRS (Scenarios)](./FSRS_SCENARIOS.md) - Các ví dụ cụ thể về thay đổi trạng thái.
- [Kiến trúc Failure Intensity (FIF)](./ARCHITECTURE_PROPOSAL_FIF.md) - Cơ chế xử lý lỗi sai nâng cao.
- [Backend Logic (ReviewSessionController)](../../src/features/learning/ReviewSessionController.ts)

