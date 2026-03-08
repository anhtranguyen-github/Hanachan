# Staff Level: System Design Follow-up Questions (Extensions)

## 1. Unified Knowledge Indexing & Real-time RAG
- **Question**: "Hanachan's **Reading** and **Learning** lessons currently live in Supabase. Your agent's **RAG index** in Qdrant/Neo4j is currently only built from **Episodic Memories** (past chats). Design a **Real-time Ingestion Pipeline** where, as soon as a user finishes a 'Reading' lesson in Supabase, a **Supabase Edge Function** or **WAL (Write-Ahead-Log) listener** kicks off an embedding job to index that lesson's content into the agent's memory. How would you handle **Conflict Resolution** if the lesson's content ('Japan's capital is Tokyo') contradicts a user's previous memory ('I think Kyoto is the capital')?"
- **Why it matters**: Tests event-driven architecture and RAG data consistency management.
- **Strong answer should include**:
    - **CDC (Change Data Capture)**: Using Supabase/Postgres listeners to trigger the ingestion.
    - **Conflict Mitigation**: Assigning a higher weight/priority to "Official Lesson Content" vs. "User Episodic Memory."
    - **Re-indexing**: Mentioning how to update the Neo4j Graph with news entities found in the lesson.

## 2. Global Multi-Region Scaling & State Consistency
- **Question**: "You're deploying Hanachan globally with users in the US, Europe, and Asia. Qdrant and Neo4j are hosted in a single US region. Design a **Global Low-Latency Retrieval Layer** where, as soon as a user logs in, their **Relevant Semantic Graph (Neo4j sub-graph)** and **Episodic Vector Cache (Top-k memories)** are 'eagerly' pulled to an **Edge-Cache (like Cloudflare Workers KV)** near the user's location. How would you maintain **Read-After-Write consistency** across regions if the user's chat session ends (and a write occurs) and they immediately reload the page in a different region?"
- **Why it matters**: Evaluates knowledge of edge computing, global consistency, and "Eager Loading" optimization.
- **Strong answer should include**:
    - **Eventual Consistency**: Understanding that the global index takes time to sync.
    - **Sticky Sessions**: Routing the user to the same "Regional Leader" node.
    - **Delta Sync**: Only pulling the latest memories from the primary region to the edge cache.

## 3. Observability, Cost Management, and LLM Guardrails
- **Question**: "High-volume agent usage (10M messages/day) can lead to **Astronomical LLM Costs** (due to the 10+ nodes per agent run in LangGraph). Design a **Cost-Aware Routing Node** that, based on the query complexity (e.g., 'What's the weather?' vs 'Explain Keigo grammar in detail'), chooses between a **Cheaper/Faster model (GPT-4o-mini)** and a **Premium/Expert model (Claude 3.5 Sonnet)**. What metrics (latency, token count, similarity score) would you track to **Alert** if the agents are becoming 'too talkative' or 'stuck in loops' during the LangGraph decision-making phase?"
- **Why it matters**: Tests operational pragmatism and ROI-focused engineering.
- **Strong answer should include**:
    - **Complexity Scoring**: Using a small "Classifier" model to route requests.
    - **Graph Iteration Limit**: Enforcing a strict limit on `iterations` in the `TutorState` (already in the code!).
    - **Alerting**: Monitoring **Tokens-per-Resolution** and **RAG-Retrieval-Hit-Rate**.
