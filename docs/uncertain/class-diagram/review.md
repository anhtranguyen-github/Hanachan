# Biểu đồ lớp: Hệ thống Ôn tập (Review System)

Biểu đồ này mô tả cơ chế cốt lõi của Hanachan: Thuật toán FSRS và Trình điều khiển phiên ôn tập, thể hiện mối liên kết chặt chẽ giữa logic điều khiển, nghiệp vụ và thực thể dữ liệu.

```plantuml
@startuml
title Biểu đồ lớp - Hệ thống Ôn tập (SRS)
skinparam classAttributeIconSize 0
skinparam shadowing false
hide circle

' --- Core Services ---
class ReviewSessionController <<Controller>> {
  - queue: List<QuizItem>
  - completedCount: Integer
  - firstAttemptDone: Set<String>
  --
  + initSession(items: List): Promise<List>
  + submitAnswer(rating: Rating): Promise<Boolean>
  + getNextItem(): QuizItem
  + getProgress(): SessionProgress
}

class LearningService <<Service>> {
  --
  + fetchDueItems(userId): Promise<List>
  + submitReview(userId, kuId, facet, rating, state): Promise<Data>
}

class FSRSEngine <<Static>> {
  + DEFAULT_DIFFICULTY: Double = 3.0
  + BURNED_THRESHOLD_DAYS: Integer = 120
  + REVIEW_THRESHOLD_DAYS: Integer = 3
  --
  + calculateNextReview(current: SRSState, rating: Rating): NextReviewData
}

' --- Data Structures (DTOs) ---
interface QuizItem <<DTO>> {
  + id: String
  + character: String
  + facet: Enum (meaning, reading, cloze)
  + currentState: SRSState
}

interface SRSState <<DTO>> {
  + stage: Enum
  + stability: Double
  + difficulty: Double
  + reps: Integer
  + lapses: Integer
}

interface NextReviewData <<DTO>> {
  + next_review: Date
  + next_state: SRSState
}

' --- Persistance Domain ---
class UserLearningState <<Entity>> {
  + user_id: UUID
  + ku_id: UUID
  + facet: Enum
  + state: Enum
  + stability: Double
  + last_review: Timestamp
  + next_review: Timestamp
  + reps: Integer
  + lapses: Integer
}

' --- Relationships (The Glue) ---

' Controller manages the flow of QuizItems
ReviewSessionController "1" o-- "*" QuizItem : manages queue >

' Controller relies on LearningService for data persistence
ReviewSessionController ..> LearningService : delegates storage >

' QuizItem carries the SRSState
QuizItem "1" *-- "1" SRSState : contains current state >

' LearningService is the orchestrator
LearningService ..> FSRSEngine : uses for calculation >
LearningService ..> UserLearningState : reads/writes >

' FSRSEngine flows
FSRSEngine ..> SRSState : inputs/outputs >
FSRSEngine ..> NextReviewData : produces >
NextReviewData "1" *-- "1" SRSState : embeds updated state >

@enduml
```

### Các quy tắc nghiệp vụ quan trọng:
1. **Dòng dữ liệu (Data Flow)**: `ReviewSessionController` quản lý hàng chờ các `QuizItem`. Khi người dùng trả lời, nó gọi `LearningService` để xử lý. `LearningService` lấy `UserLearningState` hiện tại, đưa qua `FSRSEngine` để nhận `NextReviewData`, sau đó lưu lại vào DB.
2. **Independence Law**: Mỗi `UserLearningState` được xác định duy nhất bởi bộ ba `(user_id, ku_id, facet)`.
3. **Atomic Update**: Mọi thay đổi về trạng thái SRS được thực hiện ngay lập tức sau câu trả lời đầu tiên để đảm bảo tính toàn vẹn dữ liệu.
4. **Zero-Reveal Rule**: Không hiển thị đáp án đúng khi trả lời sai (re-queue), đảm bảo trải nghiệm học tập tập trung vào việc thu hồi trí nhớ (active recall).
