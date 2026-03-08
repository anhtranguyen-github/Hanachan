# System Design Follow-up Questions (Extensions)

## 1. Multi-Stage Retrieval and Reranking
- **Question**: "The current `memory_node` retrieves both episodic and semantic context simultaneously. If we wanted to add a **third source** (e.g., a massive PDF knowledge base or a public YouTube API) and then use a **Cross-Encoder Reranker** (like BGE-Reranker-v2) to select the top 5 most relevant contexts from ALL sources before the LLM sees them, how would you modify the LangGraph structure to handle this efficiently without increasing latency too much?"
- **Why it matters**: Tests ability to scale and optimize complex RAG pipelines.
- **Strong answer should include**:
    - Suggestion of **Parallel Nodes** in LangGraph (executing all retrieval sources concurrently).
    - Adding a specific **Reranker Node** that collects results from all retrieval nodes and reorders them.
    - Mentioning **Asynchronous Processing** for all sources to keep the request time as low as possible.

## 2. Long-Running Agents and "Human-in-the-Loop"
- **Question**: "You have a `human_gate_node` but it currently doesn't seem to have a complex persistent storage for 'pending' requests. How would you redesign the system to handle a multi-day response where the agent needs to wait for a teacher to approve a lesson plan before sending it to the student, and how would you store the **serialized graph state** in PostgreSQL/Supabase during the wait?"
- **Why it matters**: Evaluates knowledge of LangGraph **Checkpointers** and state persistence.
- **Strong answer should include**:
    - Mention of **PostgresSaver** or a custom `Checkpointer` that saves the graph state to Supabase.
    - Discussion on **State Serialization** (saving the `TutorState` dictionary as a JSONB column).
    - Designing a separate `/gate/approve` endpoint that resumes the graph run using the `thread_id`.

## 3. Global Edge-Caching and Vector Partitioning
- **Question**: "Hanachan is scaling globally with users in Japan, USA, and Europe. Retrieval from a single Qdrant cluster in the US is too slow for Tokyo users (~200ms latency just for the request). How would you architect a **Global Vector Store** using Qdrant's 'Cloud Clusters' or 'Multi-Region' features, and how would you handle the synchronization of episodic memories across regions so a user's context is available regardless of where they login?"
- **Why it matters**: Tests horizontal scaling and global availability design principles.
- **Strong answer should include**:
    - Suggestion of **Local Read-Replicas** for each region to speed up retrieval.
    - Use of a **Primary-Secondary** replication strategy for writes.
    - Mentioning **Edge Tokens (JWT)** that include the user's "Home Region" to route requests to the nearest database partition.
