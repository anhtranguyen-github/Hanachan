FSRS – Business Flow (User ↔ System)
0️⃣ Nguyên tắc nền (assumptions)

FSRS chạy trên Canonical Flashcard, không chạy trên deck

1 flashcard = 1 trạng thái SRS duy nhất

Deck chỉ quyết định flashcard nào được đưa vào hàng đợi học

1️⃣ Entry: User bắt đầu học
👤 User

Chọn Deck

Chọn mode:

Learn (new)

Review (due)

Mixed

Nhấn Start

🤖 System

Resolve deck → danh sách flashcard_id

Với mỗi flashcard:

Load FSRS state

Xác định trạng thái:

new

learning

review

relearning

Lọc theo mode:

Learn → new

Review → due <= now

Mixed → union (ưu tiên due)

2️⃣ Queue building (xếp hàng học)
🤖 System

Apply giới hạn:

New/day

Review/day

Sort:

Review due ↑

Learning steps ↑

New theo official order

Lock queue snapshot

(tránh đổi thứ tự khi user đang học)

📌 Output:

StudyQueue {
  session_id
  flashcard_ids[]
}

3️⃣ Card presentation
🤖 System

Load flashcard content theo type:

Radical / Kanji / Vocab → basic / reading

ClozeSentence → grammar target

Render front side

👤 User

Xem mặt trước

Tự recall

Flip card

4️⃣ Grading (điểm nhớ)
👤 User

Chọn 1 trong 4 mức FSRS:

Grade	Ý nghĩa
Again	Không nhớ
Hard	Nhớ khó
Good	Nhớ ổn
Easy	Nhớ dễ
5️⃣ FSRS Update (trái tim hệ thống)
🤖 System

Load FSRS params:

difficulty

stability

reps

lapses

last_review

Gọi FSRS algorithm

Tính:

next_interval

next_due

Update state:

Review → Review

Fail → Relearning

New → Learning

📌 Ghi canonical state
➡️ Tự động sync cho mọi deck

6️⃣ Immediate feedback
🤖 System

Hiển thị:

Next review time

Streak / mastery (optional)

Prefetch card tiếp theo

7️⃣ Session end
👤 User

Hết card hoặc Stop

🤖 System

Persist:

FSRS state

Review log

Update stats:

Cards learned

Retention

Load per day

Unlock queue

8️⃣ Đặc biệt: Grammar + ClozeSentence
🧠 Key khác biệt

FSRS state thuộc về ClozeSentence

Grammar không có FSRS state

Flow

User học Grammar deck

System queue cloze sentences

Review 1 cloze = update FSRS của cloze đó

Grammar mastery = aggregate từ:

% cloze passed

stability trung bình

9️⃣ Cross-deck side effects (quan trọng)
Scenario

Vocab A nằm trong Deck X & Y

User học trong Deck X

Result

FSRS state của Vocab A cập nhật

Deck Y:

Card có thể biến mất (not due)

Stats tự động thay đổi

📌 Không có “progress per deck”
Chỉ có coverage per deck

🔟 Edge cases & rules
❗ Suspend / bury

Suspend = flashcard không vào queue

Bury = skip tạm trong session

❗ Reset

Reset FSRS = reset canonical state

Affects mọi deck

❗ Delete

Delete flashcard:

Remove from all decks

Delete FSRS history
⚠️ Thường không cho phép với official

1️⃣1️⃣ Data model (tối giản)
Flashcard
- id
- entity_type (radical | kanji | vocab | cloze)
- entity_id

FSRSState
- flashcard_id
- difficulty
- stability
- due_at
- reps
- lapses
- last_review

ReviewLog
- flashcard_id
- grade
- reviewed_at

1️⃣2️⃣ Mental summary (1 câu)

User học deck,
hệ thống review flashcard,
FSRS nhớ kiến thức,
không nhớ deck.