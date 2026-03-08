# Staff Level: Vector Store & Retrieval

## 1. ANN Filtering & HNSW Predicate Logic
- **Question**: In `src/fastapi/app/services/memory/episodic_memory.py`, you apply a `user_id` filter via `qmodels.Filter`. At a Staff level, explain how this filter behaves in relation to the **HNSW (Hierarchical Navigable Small World)** index. Does Qdrant perform **pre-filtering** (filtering *during* the graph traversal) or **post-filtering** (filtering the top-k results *after* retrieval)? What are the performance and **accuracy trade-offs** if a user has only 10 points in a 100-million-point collection? How would you handle the "vanishing filter" problem where the filter is so restrictive that the ANN search finds zero matching neighbors in the local graph neighborhood?
- **Why it matters**: Evaluates deep understanding of vector database internals and how metadata filtering impacts retrieval efficiency.
- **Strong answer should include**:
    - Mention of **Pre-filtering** being the default in Qdrant (which ensures accuracy but can be slow if the filter is very restrictive).
    - Explanation of the **Bitmap** or **Index Masking** strategies used to prune the HNSW graph search.
    - Suggestion of **Payload Indexing** (which is already implemented in the code) to speed up these filtered queries.
    - Discussion on when to fall back to **Exact Search** (flat scan) for extremely high-cardinality filters.

## 2. Cross-Modal Hybrid Retrieval (Neo4j + Qdrant)
- **Question**: You have both a **Semantic Graph (Neo4j)** and an **Episodic Vector Store (Qdrant)**. Currently, they are queried independently in `memory_node.py` and concatenated. Design a **Cross-Modal Retrieval** strategy where entities found in the Graph (e.g., "The user is studying N5 Kanji") are used as **hard constraints** or **semantic boosters** for the Episodic search. How would you implement this "Graph-informed Vector Search" in a single tool call to reduce latency?
- **Why it matters**: Tests the ability to synthesize two different data paradigms into a cohesive system design.
- **Strong answer should include**:
    - A **two-pass retrieval** or **Fusion** strategy (e.g., Reciprocal Rank Fusion - RRF).
    - Using the Graph results to generate **Dynamically Derived Filters** for the Vector query.
    - Mentioning the **latency vs. precision** trade-off of serialized vs. parallel retrieval.

## 3. Late Interaction (ColBERT) vs Naive Embeddings
- **Question**: The code uses standard `OpenAIEmbeddings` / `JinaEmbeddings` (single-vector dense embeddings). For a tutoring use case where queries are often short (e.g., "Tell me about that one particle..."), why might **Late Interaction models** like **ColBERT** or **Multi-Vector** embeddings perform better than the current naive dense embedding approach? What is the impact on **Storage (Disk/RAM)** and **Retrieval Latency** if we shifted to a ColBERT-style approach for Hanachan's episodic memory?
- **Why it matters**: Evaluates knowledge of state-of-the-art (SOTA) retrieval techniques beyond basic dense vectors.
- **Strong answer should include**:
    - Understanding that ColBERT keeps **per-token embeddings**, allowing for finer-grained alignment.
    - Discussion on the **MaxSim** (Maximum Similarity) operation.
    - Recognition of the significant **Storage Overhead** (approx. 10x-100x more vectors) and how to mitigate it with **compression** or **quantization**.
