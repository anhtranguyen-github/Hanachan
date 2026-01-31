# User Domain ER Diagram

```plantuml
@startuml
skinparam packageStyle rectangle
skinparam classAttributeIconSize 0
hide circle

' ==========================================
' CENTRAL USER ENTITY
' ==========================================
class User <<Entity>> {
  + id : UUID -- Primary Key (linked to auth.users)
  --
  display_name : String
  level : Integer -- Current curriculum level (1-60)
  last_activity_at : Timestamp
  created_at : Timestamp
}

' Note: UserSettings table has been removed.
' Settings are now handled via defaults and level-based logic.

@enduml
```

## Key Architectural Decisions

1. **Curriculum Progression Tracking**: The `level` field represents the user's progress through the 60-level curriculum. It is used as a "gate" to unlock new content batches.
2. **No Separate Settings Table**: UI preferences are now managed at the application layer with sensible defaults. The `user_settings` table has been removed to simplify the schema.
3. **Internal Activity Tracking**: `last_activity_at` is used to determine if the user has been active today for statistics.
