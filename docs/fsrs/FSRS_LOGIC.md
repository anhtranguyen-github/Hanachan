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

The "Stage" of a Knowledge Unit (KU) facet determines its retention level.

| Stage | Definition | Stability Threshold |
| :--- | :--- | :--- |
| **New** | Never seen before. | N/A |
| **Learning** | In the "short-term" memory loop. | < 3 Days |
| **Review** | Items scheduled for long-term reinforcement. | 3 Days to 120 Days |
| **Burned** | Mastered items hidden from active review. | > 120 Days |

### When is the FSRS State Created?
1.  **Discovery**: You see a `new` item in a `lesson_batches` session.
2.  **Facet Activation**: The moment you answer a facet for the first time, its state is initialized:
    - `state`: 'learning'
    - `stability`: 0.1 (Review in ~144 minutes / 2.4h)
    - `difficulty`: 3.0 (Baseline)
    - `reps`: 1
3.  **Independence**: Each facet is initialized separately.

---

## 3. The FSRS Calculation Engine

Khi bạn trả lời, hàm `calculateNextReview` (trong `FSRSEngine.ts`) sẽ chạy. Nó lấy **Trạng thái hiện tại** + **Kết quả (again/good)** và đưa ra **Trạng thái tiếp theo**.

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

1.  **The Trigger**: FSRS updates are independent. `updateUserState(userId, kuId, facet, ...)` is called per facet.
2.  **Scheduling Rule**: A Knowledge Unit is considered **Due** if its weakest facet is due:
    `Due = (Now >= facet_1.next_review) OR (Now >= facet_2.next_review)`
3.  **Queue Fetching**: The app fetch facets where `next_review <= NOW`. If multiple facets of the same KU are due, they are both added to the session queue.
4.  **Sorting Law**: When both facets are due, **Meaning** is always prompted before **Reading** to maximize recall difficulty.

---

## 5. Summary of the "Loop"

1.  **LEARN**: A "New" item is introduced $\rightarrow$ **State Created** (Next review in 10m).
2.  **REHEARSE**: You finish your learning session and do one final "check" $\rightarrow$ **Queue Updated** (Next review in 4-8h).
3.  **REVIEW**: The time $(NextReview \le Now)$ passes $\rightarrow$ **Item Appears in Queue**.
4.  **RESULT**: 
    - If **Correct**: Item is pushed further into the future (days/weeks).
    - If **Incorrect**: Item is pulled back into the "Learning" loop (minutes/hours).
5.  **BURN**: Eventually, stability is so high that the item is no longer scheduled.
