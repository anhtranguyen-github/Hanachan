# Spaced Repetition (FSRS) Logic Specification

This document details the exact implementation of the Spaced Repetition System in Hanachan. The system uses a hybrid of **FSRS (Free Spaced Repetition Scheduler)** principles and **WaniKani-style** stage progression to manage memory retention for Radicals, Kanji, Vocabulary, and Grammar.

---

## 1. Input Interaction Types

The learning logic starts with how the user interacts with a card. Performance on these interactions is the primary input for the FSRS engine.

### A. Radical Cards (Meaning Prompt)
- **Interaction**: Text Input (English).
- **Validation**: Strict case-insensitive matching against a list of accepted synonyms.
- **Fail Rule**: Any typo that isn't in the synonym list results in a **"Fail"** result.

### B. Kanji & Vocabulary Cards (Reading/Meaning Prompt)
- **Interaction**: 
    - **Meaning**: Text Input (English).
    - **Reading**: IME-style Input (Hiragana/Katakana).
- **Toggle**: A single Kanji/Vocab item usually requires **two** successful clears (Meaning AND Reading) in a single session before the FSRS state is updated.
- **Validation**: 
    - Readings must match On'yomi/Kun'yomi for Kanji.
    - Readings for Vocab must match the specific word reading.

### C. Grammar Cards (Cloze/Fill-in-the-blank)
- **Interaction**: **Exclusively** Fill-in-the-blank (Cloze) within a Japanese sentence. Grammar points are never tested in isolation (Meaning/Reading).
- **Logic**:
    - The engine selects a sentence containing the grammar point.
    - It masks the grammar pattern with `___`.
- **Validation**: Strict case-insensitive matching.
    - **Correct**: Exact match of the grammar pattern.
    - **Fail**: Any deviation results in an immediate Incorrect result.

---

## 2. SRS Stages & Progression

## 2. SRS Stages & Progression Mapping

The "Stage" of a Knowledge Unit (KU) tells the system how well you know it. The system uses 4 core states.

| Stage | Definition | Stability Threshold |
| :--- | :--- | :--- |
| **New** | Never seen before. | N/A |
| **Learning** | In the "short-term" memory loop. | < 3 Days |
| **Review** | Items scheduled for long-term reinforcement. | 3 Days to 120 Days |
| **Burned** | Mastered items hidden from active review. | > 120 Days |

### When is the FSRS State Created?
1.  **Discovery**: You see a `new` item in a `lesson_batches` session.
2.  **Initial Clear**: Every `lesson_item` for that KU must have `is_corrected = True`.
3.  **Activation**: The moment the batch status becomes `completed`, an entry is created in `user_learning_states` with:
    - `state`: 'learning'
    - `stability`: 0.1 (Review in ~144 minutes / 2.4h)
    - `difficulty`: 3.0 (Baseline)
    - `reps`: 1

---

## 3. The FSRS Calculation Engine

Khi bạn trả lời, hàm `calculateNextReview` (trong `FSRSEngine.ts`) sẽ chạy. Nó lấy **Trạng thái hiện tại** + **Kết quả (pass/fail)** và đưa ra **Trạng thái tiếp theo**.

### Quy luật đánh giá bài tập (Automated Quiz Impact)

Hệ thống **tự động** xác định độ khó và kết quả dựa trên tính chính xác của câu trả lời. Người dùng không cần chọn độ khó thủ công.

| Kết quả | SRS Rating (Internal) | Tác động Stability (Interval) | Tác động Reps |
| :--- | :--- | :--- | :--- |
| **Incorrect** | `fail` | Relearning Penalty ($S = S \times 0.4$) | `max(1, reps - 2)`, Lapses +1 |
| **Correct** | `pass` | Tăng Stability ($S = S \times 1.5$*) | Reps +1 |

**(*) Guard Logic:** Stability sau khi trả lời Đúng luôn $\ge$ Stability tại thời điểm trước đó (tránh văng ngược thời gian quá sâu).

**(*) Fixed Intervals for Early Success:**
Để đảm bảo nền tảng kiến thức vững chắc, các lần trả lời đúng đầu tiên (khi reps thấp) sẽ sử dụng mức tăng trưởng cố định:
- Lần 1 (Success): ~4 Tiếng (0.166 ngày)
- Lần 2 (Success): ~8 Tiếng (0.333 ngày)
- Lần 3 (Success): 1 Ngày (1.0 ngày)
- Lần 4 (Success): 3 Ngày (3.0 ngày)

---

## 4. The Review Queue (How it "Pushes")

The review queue is managed via Supabase queries.

1.  **The Trigger**: Every time an answer is submitted and the session coordinator determines the KU is "Clear" (all facets passed), the `next_review` timestamp is updated in the `user_learning_states` table:
    `SET next_review = NOW() + (Stability * 24 * 60) minutes`
2.  **Queue Fetching**: When you open the Dashboard or start a Review session, the app calls `getDueReviewItems()` which queries the Progress Domain:
    ```sql
    SELECT * FROM user_learning_states
    WHERE user_id = :current_user
    AND next_review <= NOW()
    AND state != 'burned'
    ORDER BY next_review ASC;
    ```
3.  **Prioritization**: Items that are most "overdue" (earliest `next_review`) appear first in your stack.

---

## 5. Summary of the "Loop"

1.  **LEARN**: A "New" item is introduced $\rightarrow$ **State Created** (Next review in 10m).
2.  **REHEARSE**: You finish your learning session and do one final "check" $\rightarrow$ **Queue Updated** (Next review in 4-8h).
3.  **REVIEW**: The time $(NextReview \le Now)$ passes $\rightarrow$ **Item Appears in Queue**.
4.  **RESULT**: 
    - If **Correct**: Item is pushed further into the future (days/weeks).
    - If **Incorrect**: Item is pulled back into the "Learning" loop (minutes/hours).
5.  **BURN**: Eventually, stability is so high that the item is no longer scheduled.
