# Spaced Repetition (FSRS) Logic Specification

This document details the exact implementation of the Spaced Repetition System in Hanachan. The system uses a hybrid of **FSRS (Free Spaced Repetition Scheduler)** principles and **WaniKani-style** stage progression to manage memory retention for Radicals, Kanji, Vocabulary, and Grammar.

---

## 1. Input Interaction Types

### Input Logic: Binary System
Hanachan v2 sử dụng cơ chế **Binary Input** (Đúng/Sai) thay vì các mức đánh giá chủ quan (Easy/Hard/Good/Again) của các hệ thống cũ.

- **Kết quả người dùng**: `Correct` | `Incorrect`
- **Ánh xạ sang FSRS**:
    - `Correct` → `Good` (Pass): Tăng Stability, Tăng Reps.
    - `Incorrect` → `Again` (Fail): Giảm Stability, Reset Reps.

> **Lưu ý**: Dù `ReviewSessionController` có thể nhận input là string, nhưng `submitAnswer` chỉ quan tâm kết quả cuối cùng là `Rating` ('good' | 'again'). Viêc này loại bỏ gánh nặng nhận thức (cognitive load) cho người dùng.

### FAQ: Tại sao áp dụng Failure Intensity Framework (FIF)?
Người dùng có thể thắc mắc: *"Nếu tôi sai 5 lần trong 1 session, tại sao hệ thống lại theo dõi và phạt nặng hơn?"*

Hanachan v2 sử dụng **FIF** để đạt được sự cân bằng hoàn hảo giữa học tập và Spaced Repetition:
1.  **Chống "Ease Hell"**: Điểm yếu của hệ thống cũ là phạt 60% mỗi lần sai. Nếu sai 5 lần, Stability bị phá hủy hoàn toàn. FIF dùng hàm **Logarit** (`log2`) để hình phạt giảm dần theo số lần sai.
2.  **Tracking Effort**: Sai 1 lần cho thấy bạn chỉ "thoáng quên". Sai 10 lần cho thấy bạn "quên hoàn toàn". FIF phân biệt được hai mức độ này để điều chỉnh lịch học chính xác hơn.
3.  **Drill Mode Integration**: Trong một phiên học, bạn được phép sai nhiều lần để thuộc bài (Drill). Hệ thống chỉ tính toán hình phạt **duy nhất một lần** khi bạn đã trả lời đúng và kết thúc quá trình Drill cho thẻ đó.

> **Khuyến nghị**: FIF giúp bảo vệ dữ liệu dài hạn trong khi vẫn đảm bảo tính nghiêm khắc với các nội dung khó.

### Cơ chế Deferred Calculation (Tính toán Trễ)
*Ưu điểm*: Lịch học (`next_review`) sẽ được tính từ thời điểm bạn "thuộc bài" thật sự (lúc rời queue), thay vì lúc bạn bắt đầu sai.

**Hanachan v2 triển khai**: 
1.  **Atomic Persistence**: Lỗi sai (Incorrect) được lưu vào Session Item ngay lập tức để tránh mất dữ liệu nếu crash Browser.
2.  **Deferred FSRS**: Chỉ tính toán sự sụt giảm Stability và tăng Difficulty khi người dùng trả lời **Đúng** sau quá trình Drill.
3.  **FIF math**: Sử dụng tham số `wrongCount` tích lũy trong session làm đầu vào cho `failureIntensity`.

> **Kết luận**: Đây là cách tiếp cận hiện đại, vừa an toàn cho dữ liệu, vừa phản ánh đúng nỗ lực của người học.

### Case Study: Tại sao không cập nhật FSRS mỗi lần sai? (Your Proposal)
Model bạn đề xuất: *"Mỗi lần sai đều update Stats. Khi nào đúng thì mới tính Next Review."*

**Kịch bản thảm họa (The Trap)**:
1.  Card có `Stability = 10 ngày`.
2.  Bạn sai lần 1: `S = 10 * 0.4 = 4 ngày`. (Hợp lý)
3.  Bạn sai lần 2 (ngay sau đó 1 phút): `S = 4 * 0.4 = 1.6 ngày`. (Sai lệch)
4.  Bạn sai lần 3 (ngay sau đó): `S = 1.6 * 0.4 = 0.6 ngày`. (Hỏng dữ liệu)
5.  Cuối cùng bạn trả lời đúng.
    -> **Kết quả**: `Next Review` được tính dựa trên `S = 0.6`.
    -> **Thực tế**: Bạn chỉ quên 1 lần (đáng lẽ `S=4`). Hệ thống lại phạt bạn như thể bạn đã quên 3 lần trong 3 ngày khác nhau.

=> **Kết luận**: FSRS là thuật toán theo ngày (Daily). Áp dụng nó theo phút (Minutely) sẽ phá hỏng hoàn toàn độ chính xác của nó.

### Future: Có cách nào nâng cấp không?
Có. Nhưng không phải sửa FSRS, mà là thêm một lớp **Short-term Learning Steps** (như Anki):
- Tách biệt **"Learning Phase"** (1m, 10m) khỏi **"Review Phase"** (FSRS).
- Trong Learning Phase: Sai bao nhiêu lần cũng được, không ảnh hưởng Stats FSRS.
- Chỉ khi "Tốt nghiệp" (Graduate) khỏi Learning Phase -> mới gọi FSRS 1 lần duy nhất.

> *Hiện tại Hanachan v2 giữ thiết kế đơn giản (Pure FSRS) để tối ưu trải nghiệm người dùng mobile/nhanh gọn.*

The learning logic starts with how the user interacts with a card. Performance on these interactions is the primary input for the FSRS engine.

### A. Radical Cards (Meaning Prompt)
- **Interaction**: Text Input (English).
- **Validation**: Strict case-insensitive matching against a list of accepted synonyms.
- **Fail Rule**: Any typo that isn't in the synonym list results in a **"Fail"** result.

### B. Kanji & Vocabulary Cards (Reading/Meaning Prompt)
- **Interaction**: 
    - **Meaning**: Text Input (English).
    - **Reading**: IME-style Input (Hiragana/Katakana).
- **Independence Law**: Unlike previous versions, the SRS state is now tracked **per-facet**. Vocabulary and Kanji have two independent memory traces: `meaning` and `reading`.
- **Immediate Update**: FSRS calculations occur immediately upon the first answer attempt for each facet in a session.
- **Fail Rule**: Failing 'reading' does not affect the 'meaning' state, and vice versa. Each facet follows its own FSRS trajectory.

### C. Grammar Cards (Cloze/Fill-in-the-blank)
- **Interaction**: **Exclusively** Fill-in-the-blank (Cloze) within a Japanese sentence. Grammar points are never tested in isolation (Meaning/Reading).
- **Logic**:
    - The engine selects a sentence containing the grammar point.
    - It masks the grammar pattern with `___`.
- **Validation**: Strict case-insensitive matching.
    - **Correct**: Exact match of the grammar pattern.
    - **Fail**: Any deviation results in an immediate Incorrect result.

---

## 2. SRS Stages & Progression Mapping

The "Stage" of a Knowledge Unit (Unit) facet determines its retention level.

| Stage | Definition | Stability Threshold |
| :--- | :--- | :--- |
| **New** | Never seen before. | N/A |
| **Learning** | In the "short-term" memory loop. | < 3 Days |
| **Review** | Items scheduled for long-term reinforcement. | 3 Days to 120 Days |
| **Burned** | Mastered items hidden from active review. | > 120 Days |

### When is the FSRS State Created?
1.  **Discovery**: You see a `new` item in a `lesson_batches` session.
2.  **Facet Activation**: The moment you answer
### Thời điểm tính toán Next Review (Confirmation)

### Cơ chế Failure Intensity (FIF Integration)
*Cập nhật: 01/02/2026 - Áp dụng kiến trúc FIF (Failure Intensity Framework).*

Hệ thống Hanachan v2 hiện tại sử dụng **Deferred Calculation** thông minh để xử lý việc người dùng sai nhiều lần trong một phiên (Drill):

1.  **Failure Tracking**: Mỗi lần trả lời sai (`Again`), hệ thống tăng biến đếm `wrongCount` + 1 và đẩy thẻ xuống cuối hàng đợi để học lại (Drill). **Không cập nhật FSRS lúc này**.
2.  **Success Trigger**: Chỉ khi người dùng trả lời **Đúng (`Good`)**, hệ thống mới chốt sổ và gọi FSRS Calculator.
3.  **Failure Intensity Math**:
    - Thay vì phạt theo số lần (Linear), hệ thống dùng Logarit: `Intensity = log2(wrongCount + 1)`.
    - Sai 10 lần chỉ nặng gấp 3-4 lần so với sai 1 lần (Diminishing Return).
    - Công thức Decay: `Stability = Stability * exp(-0.3 * Intensity)`.

> **Kết quả**: Người dùng có thể sai thoải mái trong quá trình Drill (học ngắn hạn) mà không sợ làm hỏng chỉ số Stability dài hạn (Ease Hell). FSRS chỉ được cập nhật **DUY NHẤT 1 LẦN** khi thẻ rời khỏi hàng đợi.
**Independence**: Each facet is initialized separately.

---

## 3. The FSRS Calculation Engine

Khi bạn trả lời, hàm `calculateNextReview` (trong `FSRSEngine.ts`) sẽ chạy. Nó lấy **Trạng thái hiện tại** + **Kết quả (again/good)** và đưa ra **Trạng thái tiếp theo**.

### Quy luật đánh giá bài tập (Automated Quiz Impact)

Hệ thống **tự động** xác định độ khó và kết quả dựa trên tính chính xác của câu trả lời. Người dùng không cần chọn độ khó thủ công.

| Kết quả | SRS Rating | Tác động Stability | Tác động Difficulty | Tác động Reps |
| :--- | :--- | :--- | :--- | :--- |
| **Incorrect** | `again` | Phạt Decay logarit ($S = S \times e^{-0.3 \times Intensity}$) | Tăng độ khó | `max(1, reps-1)`, Lapses +1 |
| **Correct** | `good` | Tăng Stability ($S = S \times 1.5 \times (3/D)$) | Giảm độ khó | Reps +1 |

**(*) Guard Logic:** Stability sau khi trả lời Đúng luôn $\ge$ Stability tại thời điểm trước đó (tránh văng ngược thời gian quá sâu).

**(*) Fixed Intervals for Early Success:**
Để đảm bảo nền tảng kiến thức vững chắc, các lần trả lời đúng đầu tiên (khi reps thấp) sẽ sử dụng mức tăng trưởng cố định:
- Lần 1 (Success): ~4 Tiếng (0.166 ngày)
- Lần 2 (Success): ~8 Tiếng (0.333 ngày)
- Lần 3 (Success): 1 Ngày (1.0 ngày)
- Lần 4 (Success): 3 Ngày (3.0 ngày)

---

## 4. The Review Queue (How it "Pushes")

1.  **The Trigger**: FSRS updates are independent. `updateUserState(userId, kuId, facet, ...)` is called per facet.
2.  **Scheduling Rule**: A Knowledge Unit is considered **Due** if its weakest facet is due:
    `Due = (Now >= facet_1.next_review) OR (Now >= facet_2.next_review)`
3.  **Queue Fetching**: The app fetch facets where `next_review <= NOW`. If multiple facets of the same Unit are due, they are both added to the session queue.
4.  **Sorting Law**: When both facets are due, **Meaning** is always prompted before **Reading** to maximize recall difficulty.

---

## 5. Summary of the "Loop"

    - `stability`: 0.166 (Review in ~4 hours)
    - `difficulty`: 3.0 (Baseline)
    - `reps`: 1
3.  **REVIEW**: The time $(NextReview \le Now)$ passes $\rightarrow$ **Item Appears in Queue**.
4.  **RESULT**: 
    - If **Correct**: Item is pushed further into the future (days/weeks).
    - If **Incorrect**: Item is pulled back into the "Learning" loop (minutes/hours).
5.  **BURN**: Eventually, stability is so high that the item is no longer scheduled.
