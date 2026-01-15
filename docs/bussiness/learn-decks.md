1️⃣ Xem danh sách Decks
👤 User

Mở trang Decks

🤖 System

Load tất cả deck user có quyền thấy:

Official decks

Custom decks

Với mỗi deck:

Metadata

Progress summary (computed)

Study availability

📌 Deck không chứa state học, chỉ chứa reference.

2️⃣ Xem Deck Official
👤 User

Mở Official Deck

🤖 System

Load deck info:

Name, description

Entity type (radical / kanji / vocab / grammar)

Learning order rules

Resolve deck → flashcard_ids

Compute deck progress (on the fly)

📊 Thông tin hiển thị:

Total cards

Learned

Due

New

Coverage %

3️⃣ Xem Deck Custom
👤 User

Mở Custom Deck

🤖 System

Load deck metadata

Resolve flashcard references

Compute progress giống official

📌 Không có “thứ tự chuẩn”
Sort theo:

Due

Added time

Random

4️⃣ Xem tiến độ Deck (Progress view)
👤 User

Click Progress / Stats

🤖 System

Deck progress = aggregation từ FSRS state

Công thức chuẩn:
Total = count(flashcards)
New = state == new
Learning = state in (learning, relearning)
Review = state == review
Due = due_at <= now


📌 Không lưu progress → recompute mỗi lần

5️⃣ Deck Coverage vs Mastery (rất quan trọng)
📦 Coverage (deck-based)

% flashcard trong deck đã “touched”

Dùng để:

Giao diện

Curriculum tracking

🧠 Mastery (knowledge-based)

FSRS stability / retention

Không thuộc deck

👉 UI không được nói “Mastered this deck”
Chỉ nói: “Covered 80% cards”

6️⃣ Xem thông số Deck (Deck analytics)
👤 User

Mở Deck details → Analytics

🤖 System

Tính toán:

Avg stability

Due distribution (today / week)

Load forecast

New cards remaining

📊 Ví dụ:

120 cards

40 due today

Avg interval: 9.3d

7️⃣ Study availability (Deck có học được không?)
🤖 System

Deck is studyable nếu:

Có ≥1 flashcard:

new (Learn mode)

due (Review mode)

UI:

Start Study (enabled / disabled)

Badge “No cards due”

8️⃣ Start Study from Deck
👤 User

Click Study this deck

🤖 System

Resolve deck → flashcards

Delegate sang FSRS Study Flow

Session gắn với deck (context only)

📌 FSRS update vẫn là canonical

9️⃣ Deck impact sau khi học
Scenario

User học 1 card trong Deck A

🤖 System

Update FSRS state

Recompute:

Deck A stats

Mọi deck khác chứa card đó

📌 Deck stats luôn live

🔟 Xem flashcards trong Deck
👤 User

Open deck → list cards

🤖 System

Show:

Card content

FSRS state

Due date

Suspension status

⚠️ Edit FSRS = global

1️⃣1️⃣ Add / Remove card khỏi Custom Deck
👤 User

Add card → custom deck

🤖 System

Create reference

Không clone card

Không reset FSRS

Remove:

Remove reference only

FSRS untouched

1️⃣2️⃣ Deck settings
Official deck

Read-only

Custom deck

Rename

Description

Sort preference

Archive

1️⃣3️⃣ Grammar Deck đặc thù
Nội dung

Chỉ chứa ClozeSentence flashcards

Progress

Dựa trên cloze FSRS

Grammar status = derived

📌 Không có grammar flashcard