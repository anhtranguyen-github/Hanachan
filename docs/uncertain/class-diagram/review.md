# Biểu đồ lớp: Hệ thống Ôn tập (Review System)

Biểu đồ này mô tả cơ chế cốt lõi của Hanachan: Thuật toán FSRS và Trình điều khiển phiên ôn tập, thể hiện mối liên kết chặt chẽ giữa logic điều khiển, nghiệp vụ và thực thể dữ liệu.

```plantuml
@startuml
title Biểu đồ lớp - Hệ thống Ôn tập (SRS)
skinparam classAttributeIconSize 0
skinparam shadowing false
hide circle

class ReviewSessionController <<Controller>> {
  - queue: List<QuizItem>
  - completedCount: Integer
  - sessionState: Map<String, {attemptCount, wrongCount}>
  --
  + initSession(items: any[]): Promise<List>
  + submitAnswer(rating: Rating): Promise<Boolean>
  + getNextItem(): QuizItem
  + getProgress(): Object
}

class LearningService <<Service>> {
  --
  + fetchDueItems(userId): Promise<List>
  + submitReview(userId, unitId, facet, rating, currentState: SRSState, wrongCount: Integer): Promise<Data>
}

class FSRSEngine <<Static>> {
  + DEFAULT_DIFFICULTY: Double = 3.0
  + BURNED_THRESHOLD_DAYS: Integer = 120
  + REVIEW_THRESHOLD_DAYS: Integer = 3
  --
  + calculateNextReview(current: SRSState, rating: Rating, wrongCount: Integer): NextReviewData
}

interface QuizItem <<DTO>> {
  + id: String
  + unitId: String
  + facet: Enum
  + prompt: String
  + character: String
  + type: String
  + currentState: SRSState
}

interface SRSState <<DTO>> {
  + stage: Enum (new, learning, review, burned)
  + stability: Double
  + difficulty: Double
  + reps: Integer
  + lapses: Integer
}

interface NextReviewData <<DTO>> {
  + next_review: Date
  + next_state: SRSState
}

class UserLearningState <<Entity>> {
  + user_id: UUID
  + unit_id: UUID
  + facet: Enum
  --
  + state: Enum (new, learning, review, burned)
  + stability: Double
  + difficulty: Double
  + last_review: Timestamp
  + next_review: Timestamp
  + reps: Integer
  + lapses: Integer
}

interface questionRepository <<Repository>> {
  + fetchQuestionsForReview(userId, unitIds): Promise<List<Question>>
}

' --- Content Domain ---
class KnowledgeUnit <<Entity>> {
  + id: UUID
  + type: Enum
  + character: String
  + meaning: String
}

class Question <<Entity>> {
  + id: UUID
  + unitId: UUID
  + facet: Enum
  + prompt: String
  + correct_answers: List<String>
}

' --- Các mối quan hệ (Bộ khung kết nối) ---

' Controller quản lý luồng Câu hỏi
ReviewSessionController "1" o-- "*" QuizItem : quản lý hàng đợi >

' Controller dựa vào Service và Repository
ReviewSessionController ..> LearningService : ủy quyền lưu trữ >
ReviewSessionController ..> questionRepository : lấy câu hỏi từ DB >

' Content & Question Binding
KnowledgeUnit "1" *-- "*" Question : định nghĩa trong DB >
Question "1" ..> QuizItem : đóng gói thành >

' Câu hỏi chứa trạng thái SRS
QuizItem "1" *-- "1" SRSState : chứa trạng thái hiện tại >

' LearningService là người điều phối
LearningService ..> FSRSEngine : sử dụng để tính toán >
LearningService ..> UserLearningState : cập nhật trạng thái >
LearningService ..> srsRepository : lưu trữ dữ liệu >
ReviewSessionController ..> srsRepository : quản lý phiên ôn tập >

interface srsRepository <<Repository>> {
  + createReviewSession(userId, total): Promise<Session>
  + updateReviewSessionItem(sessionId, unitId, facet, status, rating, wrongCount, attempts): Promise<void>
  + incrementSessionProgress(sessionId): Promise<void>
  + finishReviewSession(sessionId): Promise<void>
  + updateUserState(userId, unitId, facet, updates): Promise<void>
}

' Luồng FSRSEngine
FSRSEngine ..> SRSState : đầu vào/đầu ra >
FSRSEngine ..> NextReviewData : sản sinh >
NextReviewData "1" *-- "1" SRSState : nhúng trạng thái mới >

@enduml
```

### Các quy tắc nghiệp vụ quan trọng:
1. **Dòng dữ liệu (Data Flow)**: `ReviewSessionController` quản lý hàng chờ các `QuizItem`. Khi người dùng trả lời, nó gọi `LearningService` để xử lý.
2. **FIF Architecture**: Thay vì `firstAttemptDone`, controller theo dõi `wrongCount` cho từng item.
3. **Commit on Success**: Chỉ khi trả lời đúng thì mới gọi `submitReview`. Lúc mình `wrongCount` được gửi kèm để tính toán hình phạt (Intensity).
4. **No Gen Quiz**: Hệ thống không tự sinh câu hỏi. Mọi khía cạnh (facet) cần ôn tập đều phải được định nghĩa sẵn là một bản ghi trong bảng `questions`.
5. **Stability Guard**: Đảm bảo $S_{new} \ge S_{prev}$ khi người dùng trả lời đúng, bất kể cường độ lỗi sai là bao nhiêu (không làm người dùng bị "văng ngược" quá xa).
6. **Min Stability Floor**: Luôn giữ sàn 0.1 ngày (~2.4h) cho các thẻ sai, đảm bảo người dùng ôn lại ngay trong phiên sau của cùng một ngày.
