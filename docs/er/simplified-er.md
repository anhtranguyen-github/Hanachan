# Sơ đồ ER Hệ thống Rút gọn

Sơ đồ này cung cấp cái nhìn tổng quan về các thực thể và mối quan hệ trong hệ thống, lược bỏ các trường dữ liệu và bảng phụ kỹ thuật để tập trung vào logic cốt lõi.

```plantuml
@startuml
skinparam packageStyle rectangle
skinparam classAttributeIconSize 0
hide circle
hide members

' ==========================================
' CÁC THỰC THỂ (ENTITIES)
' ==========================================

package "Người dùng" {
  entity User
}

package "Bài học và câu hỏi" {
  entity KnowledgeUnit
  entity Question
}

package "Học tập với SRS" {
  entity UserLearningState
  entity UserLearningLog
  entity LessonBatch
  entity LessonItem
  entity ReviewSession
  entity ReviewSessionItem
}

package "Trợ lý AI (Assistant)" {
  entity ChatSession
  entity ChatMessage
  entity ChatMessageAction
}

' ==========================================
' MỐI QUAN HỆ (RELATIONSHIPS)
' ==========================================

' Kết nối cốt lõi của Người dùng
User ||--o{ UserLearningState : "theo dõi tiến độ"
User ||--o{ UserLearningLog : "lịch sử ôn tập"
User ||--o{ LessonBatch : "phiên học mới"
User ||--o{ ReviewSession : "phiên ôn tập"
User ||--o{ ChatSession : "hội thoại"

' Cấu trúc Nội dung
KnowledgeUnit ||--o{ Question : "có các câu hỏi"
KnowledgeUnit ||--o{ UserLearningState : "có trạng thái SRS"
KnowledgeUnit }o--o{ KnowledgeUnit : "liên kết (Bộ thủ/Hán tự/Từ vựng/Ngữ pháp)"

' Luồng xử lý phiên học tập
LessonBatch ||--o{ LessonItem
LessonItem }o--|| KnowledgeUnit : "học đơn vị tri thức"

ReviewSession ||--o{ ReviewSessionItem
ReviewSessionItem }o--|| KnowledgeUnit : "ôn tập đơn vị tri thức"

' Tương tác với AI
ChatSession ||--o{ ChatMessage
ChatMessage ||--o{ ChatMessageAction
ChatMessage }o--o{ KnowledgeUnit : "nhắc đến"
ChatMessageAction }o--|| KnowledgeUnit : "tác động (phân tích/tìm)"

@enduml
```

## Tóm tắt các mối quan hệ

### Các miền (Domains) chính
- **User**: Chủ thể trung tâm kết nối với mọi tiến trình, phiên học và nội dung được tạo ra.
- **KnowledgeUnit**: Đối tượng học tập chính. Mọi hoạt động học tập, câu hỏi và ví dụ đều xoay quanh thực thể này.

### Luồng học tập
- **LessonBatch & LessonItem**: Theo dõi việc khám phá các đơn vị tri thức mới.
- **ReviewSession & ReviewSessionItem**: Theo dõi các nỗ lực ôn tập độc lập cho từng đơn vị.
- **UserLearningState (SRS)**: Trạng thái trí nhớ bền vững cho từng mặt (facet) của bài học.
- **UserLearningLog**: Hồ sơ lịch sử của mọi tương tác SRS (phục vụ thống kê/heatmaps).

- **ChatMessageAction**: Các hành động cụ thể do AI thực hiện (phân tích ngữ pháp, tìm kiếm) lên các thực thể bài học.
