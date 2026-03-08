# Staff Level: RAG System Deep Dive

## 1. Context Window Optimization & Memory Consolidation
- **Question**: In `src/fastapi/app/services/memory/consolidation.py`, you have a `_consolidate_batch` function that synthesizes $N$ (batch_size=5) memories into a single concise summary. At a Staff level, analyze the **Entropy Loss** vs **Context Window gain**. Currently, `BATCH_SIZE` is fixed. How would you redesign this consolidation to use **Token-Aware Batching** and **Hierarchical Memory Summarization**? For a user with 5 years of chat history (approx. 100k messages), what is the optimal depth of this memory hierarchy to keep the **latency** of retrieval under 500ms?
- **Why it matters**: Evaluates knowledge of long-context LLM limits and recursive data summarization architectures.
- **Strong answer should include**:
    - **Entropy Loss**: Summaries discard the exact phrasing and emotions, which might be critical for a language tutor.
    - **Token-Aware Batching**: Using fixed `BATCH_SIZE` is risky if the memories are long; suggest batching based on token count using `tiktoken`.
    - **Hierarchical Memory**: Suggest keeping "Leaf" (raw) memories and only summarizing nodes above them (a **Tree-based RAG** structure).
    - **Latency**: Mentioning per-user partition performance in Qdrant and the O(1) retrieval from a summary vs. O(N) from a raw timeline.

## 2. Multilingual Query Transformation & Alignment
- **Question**: Hanachan supports Japanese, English, and Vietnamese. The current `memory_node.py` uses a naive keyword extractor (`[w for w in query.split() if len(w) > 2]`). This completely breaks for **Japanese** (which doesn't use spaces) and **Vietnamese** (where "học tiếng" might be split incorrectly). At a Staff level, design a **Language-Detection-to-Tokenization** pipeline that uses **MeCab/Janome** (for Japanese) and **PyVi** (for Vietnamese) to extract meaningful entities *before* querying Neo4j. How would you handle a mixed-language query like "Explain the difference between 食べる (taberu) and 飲む (nomu)"?
- **Why it matters**: Tests the ability to handle non-English NLP challenges and cross-lingual data consistency.
- **Strong answer should include**:
    - Identifying the lack of **Space-Separated Tokenization** in CJK languages.
    - Using an **LLM-based Query Reformulator** that identifies the query's primary language and returns "Search Keywords" in a standard format.
    - Suggesting **Cross-Lingual Embeddings** (like mBERT or Jina-Multilingual-v3) that map "water" and "みず" to the same vector space.

## 3. Empty Retrieval & Low-Confidence Fallbacks
- **Question**: Your LangGraph response node receives retrieved context strings. What happens if the RAG pipeline returns **"No specific facts found,"** or worse, results with **Very Low Similarity Scores** (e.g., 0.15)? How do you prevent the model from **Hallucinating** (e.g., "I don't remember you telling me anything, but I guess you like pizza")? Design a "Reasonable Fallback" system in the `response_node` that uses **Rejection-Tuning** or an **Explicit Confidence Score** from the retriever to shift the persona's tone from "Informed Friend" to "Inquisitive Stranger."
- **Why it matters**: Evaluates knowledge of RAG reliability and persona-consistent error handling.
- **Strong answer should include**:
    - **Soft Thresholding**: If max similarity score is below $X$, treat as "Empty Retrieval."
    - **Persona Shift**: Instruct the model to ask a clarifying question ("I don't recall talking about that yet, please tell me more!") rather than guessing.
    - **Self-Correction Node**: Adding a LangGraph node that "Graded" the context relevance *before* sending it to the generator.
