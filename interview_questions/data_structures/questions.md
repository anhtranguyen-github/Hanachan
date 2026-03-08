# Data Structures & Algorithms Questions

## 1. Naive Keyword Extraction vs TF-IDF or Embedding-based extraction
- **Question**: In `src/fastapi/app/agents/tutor_agent/nodes/memory_node.py`, you extract keywords from the user's query by filtering for words longer than 2 characters: `keywords = [w for w in query.split() if len(w) > 2][:5]`. How would this **naive algorithm** perform on a query like "I want to learn about my cats' food"? What specific words would be extracted, and will they lead to a successful Neo4j fulltext search? How would you improve this using a **Stopword List**, **TF-IDF**, or a **Named Entity Recognition (NER)** model from spaCy or HuggingFace?
- **Why it matters**: Evaluates knowledge of natural language processing (NLP) basics and how they affect information retrieval quality.
- **Strong answer should include**:
    - Identifying the words extracted: `['want', 'learn', 'about', 'cats\'', 'food']`.
    - Pointing out that **"want", "learn", "about"** are noise and don't help in the Neo4j query.
    - Suggesting **LLM-based entity extraction** (calling the LLM once to get the "entities" to search for), which is more accurate but adds latency.
    - Mentioning **Stemming/Lemmatization** for words like "cats'" (to "cat").

## 2. Global In-Memory Deduplication Complexity
- **Question**: In `src/fastapi/app/services/memory/semantic_memory.py`, the `_deduplicate` function uses a `set` of tuples `(source_id, relationship, target_id)` to filter the results from Neo4j. What is the **time and space complexity** of this function relative to the number of results returned ($n$)? If the Neo4j search returns 100,000 facts (hypothetically), how would this in-memory `set` impact the process? Is there a way to offload this deduplication to the **Neo4j Cypher query** itself to avoid bringing all results into Python's memory?
- **Why it matters**: Tests basic algorithmic complexity analysis and database query optimization knowledge.
- **Strong answer should include**:
    - Complexity: $O(n)$ time and $O(n)$ space.
    - Identifying the **Network Overhead**: Transferring 100k items across the wire to Python just to discard them is wasteful.
    - Suggesting the **DISTINCT** keyword in Cypher or a grouped aggregation to only return unique triplets.

## 3. Graph Traversal vs Vector Distance
- **Question**: You use **Graph RAG (Neo4j)** for semantic facts and **Vector RAG (Qdrant)** for episodic memories. Conceptually, what's the difference between finding nodes connected by a relationship vs finding the $k$-nearest neighbors in a vector space? If a user says "Wait, I remember we talked about the movie Interstellar last Tuesday", which retrieval method will likely yield a better result, and why?
- **Why it matters**: Evaluates high-level understanding of data structures for AI and when to use specific retrieval paradigms.
- **Strong answer should include**:
    - Vector search is good for **fuzzy semantic overlap** (Interstellar -> space, sci-fi) but bad for specific multi-hop relationships.
    - Graph search is good for **structured facts** (User - LOVES -> Interstellar).
    - Recognizing that "last Tuesday" is a temporal constraint, and episodic memories (since they have a `created_at` timestamp) are better suited for this query.
