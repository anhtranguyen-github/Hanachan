# Assistant Domain ER Diagram

This diagram outlines the structures supporting the Hanachan AI Chatbot, focusing on session management and persistent entity linking.

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
  + id : UUID <<PK>>
  --
  user_id : UUID <<FK>>
  title : String
  created_at : Timestamp
  updated_at : Timestamp
}

class ChatMessage <<Entity>> {
  + id : UUID <<PK>>
  --
  session_id : UUID <<FK>>
  role : Enum (system, user, assistant)
  content : Text
  referenced_ku_ids : Array<UUID> -- Linked to KnowledgeUnit
  created_at : Timestamp
}

' ==========================================
' CONNECTIONS
' ==========================================
User ||--o{ ChatSession
ChatSession ||--o{ ChatMessage
ChatMessage }o..|| KnowledgeUnit : "references"

@enduml
```

## Key Architectural Decisions

1. **Array-based Entity Referencing**: For technical simplicity and performance (Supabase/PostgreSQL), referenced Knowledge Units are stored as a UUID array directly on the `ChatMessage`. This allows the AI to "tag" relevant topics in its response for interactive UI elements.

2. **Threaded Session Management**: Storing chat in `ChatSession` allows users to maintain isolated conversation threads (e.g., specific grammar questions vs. general practice), keeping retrieval contexts clean.

3. **Standard LLM Role Mapping**: The `role` enum (`system`, `user`, `assistant`) maps directly to common LLM provider requirements, simplifying the integration with LangChain and OpenAI.
