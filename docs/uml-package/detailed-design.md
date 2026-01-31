@startuml
title Thiết kế chi tiết các gói (Detailed Package Design)
top to bottom direction
skinparam packageStyle rectangle
skinparam shadowing false
hide circle
hide members

' Tầng Features
package "Features" {
    class ReviewSessionController
    class LearningService
    class HanachanChatService
    class QuizItem
}

' Tầng Domain
package "Domain" {
    class KnowledgeUnit
    class Kanji
    class Vocabulary
    class Question
    class FSRSEngine
    class UserLearningState
    class UserProfileManager
}

' Force vertical alignment between packages
Features -[hidden]down-> Domain

' Internal Domain Relations (Top-Down inside package)
Kanji -up-|> KnowledgeUnit
Vocabulary -up-|> KnowledgeUnit
KnowledgeUnit *-- "1..*" Question
UserLearningState "1" -- "1" KnowledgeUnit

' Internal Features Relations
ReviewSessionController o-- "0..*" QuizItem

' Inter-Package Dependencies (Forcing Downward)
ReviewSessionController -down..> FSRSEngine
ReviewSessionController -down..> UserLearningState
LearningService -down..> UserLearningState
LearningService -down..> UserProfileManager
HanachanChatService -down..> KnowledgeUnit
QuizItem -down..> KnowledgeUnit

@enduml
