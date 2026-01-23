# Assistant Domain ER Diagram

```plantuml
@startuml
skinparam packageStyle rectangle
skinparam classAttributeIconSize 0
hide circle

' ==========================================
' STUBS FROM OTHER DOMAINS
' ==========================================
class User <<Stub>> {
  + id : UUID
}
class KnowledgeUnit <<Stub>> {
  + id : UUID
}

' ==========================================
' CHAT SYSTEM
' ==========================================
class ChatSession <<Entity>> {
  + id : UUID
  --
  user_id : UUID <<FK>>
  title : String
  created_at : Timestamp
  updated_at : Timestamp
}

class ChatMessage <<Entity>> {
  + id : UUID
  --
  session_id : UUID <<FK>>
  role : Enum (SYSTEM, USER, ASSISTANT)
  content : Text
  referenced_ku_ids : Array<UUID> -- Linked to KnowledgeUnit
  created_at : Timestamp
}

' (Bridge removed to match physical array column)

' ==========================================
' CONNECTIONS
' ==========================================
User ||--o{ ChatSession
ChatSession ||--o{ ChatMessage
ChatMessage }o--|| KnowledgeUnit : "references"

@enduml
```

## Key Architectural Decisions

1. **Array-based Referencing**: For technical simplicity and performance (Supabase/PostgreSQL), referenced Knowledge Units are stored as a UUID array directly on the `ChatMessage`. This allows the AI to "tag" relevant topics in its response.
2. **Session Persistence**: Storing chat in `ChatSession` allows a user to have multiple threads (e.g., "Grammar help", "Analysis of a news article") without mixing contexts.
3. **Role-based Messages**: Standard `role` field ensures compatibility with common LLM message formats (OpenAI/Anthropic).
