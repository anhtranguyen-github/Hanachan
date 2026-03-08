# RAG Pipeline Questions

## 1. Hybrid Retrieval (Neo4j + Qdrant) Coordination
- **Question**: Your RAG pipeline uses two the separate storage backends: **Neo4j** (Graph/Semantic) and **Qdrant** (Vector/Episodic). How does the `memory_node` decide the priority between these two types of context? If Neo4j returns a fact ("User is from Vietnam") and Qdrant returns a conflicting episodic memory ("User says they moved to Tokyo"), how should the **final response_node** handle this contradiction? Should the memories be weighted or just concatenated?
- **Why it matters**: Evaluates knowledge of data consistency, hybrid retrieval strategies, and how LLMs prioritize conflicting context.
- **Strong answer should include**:
    - Identifying the **Recency Bias**: Episodic memories (conversations) are often more up-to-date than long-term semantic facts.
    - Mentioning the **Instruction-Tuning** of the model: The system prompt in `response_node.py` currently doesn't tell the model what to do with contradictions.
    - Proposing a **Reranker** (like Cohere or Cross-Encoder) that takes the query and ALL retrieved contexts and orders them by relevance *before* they hit the generation prompt.

## 2. SQL Tool Security (Regex Blocklist)
- **Question**: `_is_safe_sql` in `src/fastapi/app/agents/tutor_agent/merged_tools.py` uses a blocklist of words like `INSERT`, `UPDATE`, `DELETE`, etc. Can you find a way to bypass this? For example, would `"(SELECT * FROM users) AS u"` match the `startswith("SELECT")` check? What about **case-sensitivity** or **Unicode normalization** (e.g. `İNSERT` vs `INSERT`)? Is there a more robust way to ensure a SQL query is read-only than using a regex-based blocklist?
- **Why it matters**: Evaluates security-first thinking and knowledge of database abstraction safety.
- **Strong answer should include**:
    - Mentioning **Database User Permissions**: The absolute safest way is to have the Supabase role used by the agent only have `SELECT` privileges.
    - Discussion on **SQL Parsers**: Using a library like `sqlglot` or `psycopg2` to parse the AST (Abstract Syntax Tree) and verify no nodes are `Insert`, `Update`, etc.
    - Identifying that `_is_safe_sql` doesn't check for destructive procedures or commands (`TRUNCATE`, `DROP`) if they are part of a CTE or complex query.

## 3. Multi-User Isolation and Scaling
- **Question**: Currently, all users' episodic memories are in a single Qdrant collection, filtered by `user_id`. At 1,000,000 users, each with 1,000 memories, your collection hits 1 billion vectors. Qdrant's performance on filtered queries can degrade if the filter's cardinality is extremely high. How would you **re-architect this for scale**? Would you split users into separate collections, use **Namespaces**, or perhaps a **Tenant-based partitioning** at the infrastructure level?
- **Why it matters**: Tests system design experience and understanding of how vector databases handle multi-tenancy.
- **Strong answer should include**:
    - Mention of Qdrant **Payload Indexing** on `user_id`, which helps but has limits.
    - Discussion on **Sharding**: Partitioning the collection based on `user_id` range.
    - Identifying **Archival**: Moving old episodic memories (> 1 year) to a cheaper cold storage and only search them if the user explicitly asks.
