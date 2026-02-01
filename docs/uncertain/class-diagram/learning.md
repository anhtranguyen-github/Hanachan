# Biểu đồ lớp: Hệ thống Học bài mới (Learning System)

Biểu đồ này tập trung vào logic của **Trình quản lý bài học (Learning Service)**, chịu trách nhiệm cho quy trình học từ mới theo đợt (batch) và quy hoạch lộ trình học tập.

```plantuml
@startuml
title Biểu đồ lớp - Hệ thống Học bài mới (Discovery System)
skinparam classAttributeIconSize 0
skinparam shadowing false
hide circle

' --- Orchestrator for Learning Lifecycle ---
class LearningController <<Controller>> {
  - batchId: UUID
  - items: List<LearningItem>
  - quizQueue: List<QuizItem>
  - currentIndex: Integer
  --
  + init(items: any[]): Promise<void>
  + nextLessonItem(): Promise<Boolean>
  + startQuiz(): List<QuizItem>
  + submitQuizAnswer(rating: Rating): Promise<Boolean>
  + isBatchComplete(): Boolean
}

class LearningService <<Service>> {
  --
  + fetchNewItems(userId, levelId, limit): Promise<List>
  + initializeSRS(userId, unitId, facets): Promise<void>
  + checkAndUnlockNextLevel(userId, currentLevel): Promise<void>
}

' --- Data Structures (DTOs) ---
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

' --- Core Logic & Rules ---
class FSRSEngine <<Static>> {
  + calculateNextReview(current: SRSState, rating: Rating): NextReviewData
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

' --- Persistence for "Resume" capability ---
class LessonBatch <<Entity>> {
  + id: UUID
  + user_id: UUID
  + level: Integer
  + status: Enum (in_progress, completed, abandoned)
}

class LessonItem <<Entity>> {
  + id: UUID
  + batch_id: UUID
  + unit_id: UUID
  + status: Enum (unseen, viewed, quiz_passed)
}

class UserLearningState <<Entity>> {
  + user_id: UUID
  + unit_id: UUID
  + facet: Enum
  --
  + state: Enum
  + stability: Double
  + difficulty: Double
  + last_review: Timestamp
  + next_review: Timestamp
  + reps: Integer
  + lapses: Integer
}

interface lessonRepository <<Repository>> {
  + createLessonBatch(userId, level): Promise<Batch>
  + createLessonItems(batchId, unitIds): Promise<void>
  + updateLessonItemStatus(batchId, unitId, status): Promise<void>
  + completeLessonBatch(batchId): Promise<void>
  + fetchLevelContent(level, userId): Promise<List>
}

interface questionRepository <<Repository>> {
  + fetchQuestionsByUnits(unitIds): Promise<List<Question>>
}

' --- Các mối quan hệ (Bộ khung kết nối) ---

' Controller quản lý luồng Bài học & Câu hỏi
LearningController "1" *-- "1" LessonBatch : quản lý lô bài học >
LearningController "1" o-- "*" QuizItem : quản lý hàng đợi câu hỏi >
LessonBatch "1" *-- "*" LessonItem : chứa tiến độ học >

' Controller dựa vào Service và Repository
LearningController ..> LearningService : kích hoạt khởi tạo SRS sau khi "Vượt qua (Pass)" >
LearningController ..> lessonRepository : lưu trữ tiến độ (để học tiếp) >

' Service là cơ quan đầu não về SRS & Logic
LearningService ..> FSRSEngine : tạo trạng thái khởi đầu >
LearningService ..> UserLearningState : tạo bản ghi mới >
LearningService ..> lessonRepository : đọc/ghi dữ liệu >

' Ràng buộc Logic SRS
FSRSEngine ..> SRSState : sản sinh trạng thái đầu >
UserLearningState "1" *-- "1" SRSState : lưu trữ trạng thái hiện tại >

' Ràng buộc Nội dung
KnowledgeUnit "1" *-- "*" Question : định nghĩa trong DB >
Question "1" ..> QuizItem : đóng gói thành >

' Logic câu hỏi (DB-driven)
LearningController ..> questionRepository : lấy câu hỏi từ DB >
questionRepository ..> Question : truy vấn >
LearningController "1" o-- "*" QuizItem : quản lý hàng đợi >
@enduml
```

### Các quy tắc nghiệp vụ đặc thù của Learning:
1. **Batch Persistence**: Trạng thái học tập được lưu vào `LessonBatch` và `LessonItem`. Nếu người dùng thoát giữa chừng, họ có thể quay lại đúng slide hoặc câu hỏi đang làm dở (Resume).
2. **Onboarding-Triggered SRS**: Khác với Review, Learning chỉ khởi tạo trạng thái FSRS cho một Knowledge Unit khi nó đạt trạng thái `quiz_passed` (trả lời đúng tất cả các facet trong bài test cuối đợt học). Điều này đánh dấu việc kiến thức chính thức **bước vào** chu trình SRS với trạng thái khởi điểm (Stability ~4h).
3. **Strict DB-Driven Questions**: Không còn việc tự sinh câu hỏi (no gen quiz). Mọi câu hỏi (như hỏi Nghĩa, hỏi Cách đọc) đều phải có bản ghi tương ứng trong bảng `questions`. `LearningController` sẽ tải toàn bộ câu hỏi liên quan từ `questionRepository`.
4. **90% Knowledge Rule**: `LearningService` kiểm tra điều kiện thăng cấp sau khi mỗi Batch hoàn thành (Complete).
5. **No FIF in Learning**: Quy trình Discovery không áp dụng kiến trúc FIF. Việc người dùng sai bao nhiêu lần trong bài kiểm tra (Quiz) không ảnh hưởng đến trạng thái khởi tạo của SRS. Mọi Knowledge Unit sau khi Pass đều bắt đầu với cùng một chỉ số Stability nền tảng (măc định ~4h).

### Các thành phần chính:
1. **LearningService**: "Bộ não" của tầng chức năng, điều phối việc lấy dữ liệu và kiểm tra quy tắc mở khóa Level mới (90% Knowledge Rule).
2. **90% Knowledge Rule**: Quy tắc nghiệp vụ kiểm tra nếu 90% nội dung Level hiện tại đạt trạng thái 'Review' trở lên thì tự động thăng cấp cho User.
3. **LessonBatch/Item**: Đảm bảo tính **Bền vững (Persistence)**. Người dùng có thể dừng học giữa chừng và quay lại đúng vị trí đang học nhờ vào việc lưu trạng thái từng item vào DB. Trạng thái `abandoned` được dùng khi người dùng hủy bỏ lô học.
