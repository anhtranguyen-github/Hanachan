# Neo4j with LangChain: Tutorials and Best Practices (2025–2026 Edition)

Neo4j combined with LangChain provides powerful architectures for GraphRAG, natural language querying over structural data, and vector-graph hybrid knowledge layers.

## Tutorial

### Installation
```bash
uv pip install -U langchain langchain-community langchain-openai neo4j langchain-experimental
uv pip install -U "langchain-cli[serve]"
```

### 1. Vector Store + Similarity Search (`Neo4jVector`)
Excellent for indexing unstructured documentation context with semantic search.

```python
from langchain_community.vectorstores import Neo4jVector
from langchain_openai import OpenAIEmbeddings

db = Neo4jVector.from_documents(
    docs,
    OpenAIEmbeddings(),
    url="bolt://localhost:7687", username="neo4j", password="password"
)
results = db.similarity_search("Who is Ketanji Brown Jackson?", k=3)
```

### 2. Natural Language to Cypher (`GraphCypherQAChain`)
Allow LLMs to answer questions directly by converting language to Graph logic.

```python
from langchain_neo4j import GraphCypherQAChain
chain = GraphCypherQAChain.from_llm(llm=llm, graph=graph, verbose=True)
response = chain.invoke({"query": "Who acted in Top Gun?"})
```

### 3. Knowledge Graph Construction (`LLMGraphTransformer`)
Translate text documents into nodes and relationships.

```python
from langchain_experimental.graph_transformers import LLMGraphTransformer
transformer = LLMGraphTransformer(llm=llm)
graph_docs = transformer.convert_to_graph_documents(documents)
graph.add_graph_documents(graph_docs, baseEntityLabel=True)
```

## Best Practices
1. **Low-Privilege Execution**: Always deploy a severely restricted database profile for any role executing LLM-generated Cypher statements. Never afford write capabilities passively.
2. **Agentic/Tool Control**: For production safety and scale, wrap specific Cypher chains or parameterized functions into dedicated functional tools, rather than using an open-ended generic Cypher generation layer.
3. **Hybrid Search (GraphRAG)**: Connect vector similarities to locate entry anchors, and use multi-hop Graph capabilities to contextualize related items heavily to generate robust reasoning contexts.
4. **Model Efficiency**: Use exceptionally fast and cheap engines (like `gpt-4o-mini` or `Llama 3.1 8B`) simply for the Cypher parsing pipelines.
5. **Session Schema Control**: Manually invoke `graph.refresh_schema()` periodically, and utilize filtering masks if your total enterprise graph exceeds the prompt context window limit.
