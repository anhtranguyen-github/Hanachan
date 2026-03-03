"""
LangChain Neo4j Graph & Vector Store Service — Cloud integration.

This module provides LangChain-compatible Neo4j integration for:
- Graph database operations (Cypher queries, schema management)
- Vector storage and retrieval (via Neo4j Vector index)
- Semantic search with embeddings
- Similarity search with scores

Uses Neo4j Aura (cloud) with URI and password authentication.

Dependencies:
    - neo4j: Official Neo4j Python driver
    - langchain_community: For Neo4jGraph and Neo4jVector wrappers

Environment Variables:
    NEO4J_URI: Neo4j connection URI (e.g., neo4j+s://xxxxx.databases.neo4j.io)
    NEO4J_USERNAME: Neo4j username (default: neo4j)
    NEO4J_PASSWORD: Neo4j password
    NEO4J_DATABASE: Database name (default: neo4j)
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Tuple

from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_openai import OpenAIEmbeddings

from ..core.config import settings
from ..core.llm import make_embedding_model

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Optional imports with graceful degradation
# ---------------------------------------------------------------------------

# Try new langchain-neo4j package first, fall back to langchain_community
try:
    from langchain_neo4j import Neo4jGraph
    HAS_NEO4J_GRAPH = True
    logger.debug("Using langchain_neo4j.Neo4jGraph")
except ImportError:
    try:
        from langchain_community.graphs import Neo4jGraph
        HAS_NEO4J_GRAPH = True
        logger.warning("Using deprecated langchain_community.graphs.Neo4jGraph")
    except ImportError:
        HAS_NEO4J_GRAPH = False
        logger.warning("Neo4jGraph not available - install with: pip install langchain-neo4j")

try:
    from langchain_neo4j import Neo4jVector
    HAS_NEO4J_VECTOR = True
    logger.debug("Using langchain_neo4j.Neo4jVector")
except ImportError:
    try:
        from langchain_community.vectorstores import Neo4jVector
        HAS_NEO4J_VECTOR = True
        logger.warning("Using deprecated langchain_community.vectorstores.Neo4jVector")
    except ImportError:
        HAS_NEO4J_VECTOR = False
        logger.warning("Neo4jVector not available - install with: pip install langchain-neo4j")

try:
    from neo4j import GraphDatabase, Driver, Session, Result
    HAS_NEO4J_DRIVER = True
except ImportError:
    HAS_NEO4J_DRIVER = False
    logger.warning("neo4j driver not available")

# ---------------------------------------------------------------------------
# Singleton instances
# ---------------------------------------------------------------------------

_driver: Optional[Driver] = None
_graph: Optional[Any] = None
_vector_store: Optional[Any] = None
_embedder: Optional[OpenAIEmbeddings] = None

# ---------------------------------------------------------------------------
# Configuration validation
# ---------------------------------------------------------------------------

def _validate_config() -> List[str]:
    """Check if Neo4j configuration is complete."""
    missing = []
    if not settings.neo4j_uri:
        missing.append("NEO4J_URI")
    if not settings.neo4j_username:
        missing.append("NEO4J_USERNAME")
    if not settings.neo4j_password:
        missing.append("NEO4J_PASSWORD")
    return missing


def is_configured() -> bool:
    """Check if Neo4j is properly configured."""
    return len(_validate_config()) == 0


# ---------------------------------------------------------------------------
# Driver initialization (low-level)
# ---------------------------------------------------------------------------

def _get_driver() -> Driver:
    """Get or create Neo4j driver instance."""
    global _driver
    
    if not HAS_NEO4J_DRIVER:
        raise ImportError("neo4j driver is required. Install with: pip install neo4j")
    
    missing = _validate_config()
    if missing:
        raise ValueError(f"Missing Neo4j configuration: {', '.join(missing)}")
    
    if _driver is None:
        logger.info(f"Initializing Neo4j driver for {settings.neo4j_uri}")
        _driver = GraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_username, settings.neo4j_password),
        )
        # Verify connectivity
        _driver.verify_connectivity()
        logger.info("Neo4j driver initialized successfully")
    
    return _driver


def close_driver() -> None:
    """Close the Neo4j driver connection."""
    global _driver
    if _driver is not None:
        _driver.close()
        _driver = None
        logger.info("Neo4j driver closed")


# ---------------------------------------------------------------------------
# Session helper
# ---------------------------------------------------------------------------

def get_session(database: Optional[str] = None) -> Session:
    """Get a Neo4j session.
    
    Args:
        database: Database name (defaults to settings.neo4j_database)
        
    Returns:
        Neo4j session context manager
    """
    driver = _get_driver()
    db = database or settings.neo4j_database
    return driver.session(database=db)


def execute_query(
    query: str,
    parameters: Optional[Dict[str, Any]] = None,
    database: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Execute a Cypher query and return results.
    
    Args:
        query: Cypher query string
        parameters: Query parameters
        database: Target database
        
    Returns:
        List of result records as dictionaries
    """
    with get_session(database) as session:
        result = session.run(query, parameters or {})
        return [record.data() for record in result]


def execute_write(
    query: str,
    parameters: Optional[Dict[str, Any]] = None,
    database: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Execute a write Cypher query.
    
    Args:
        query: Cypher query string
        parameters: Query parameters
        database: Target database
        
    Returns:
        List of result records as dictionaries
    """
    with get_session(database) as session:
        result = session.execute_write(
            lambda tx: tx.run(query, parameters or {}).data()
        )
        return result if result else []


# ---------------------------------------------------------------------------
# Graph interface (Neo4jGraph)
# ---------------------------------------------------------------------------

def _get_graph() -> Neo4jGraph:
    """Get or create Neo4jGraph instance."""
    global _graph
    
    if not HAS_NEO4J_GRAPH:
        raise ImportError(
            "langchain_community is required for Neo4jGraph. "
            "Install with: pip install langchain-community"
        )
    
    if _graph is None:
        missing = _validate_config()
        if missing:
            raise ValueError(f"Missing Neo4j configuration: {', '.join(missing)}")
        
        logger.info("Initializing Neo4jGraph")
        _graph = Neo4jGraph(
            url=settings.neo4j_uri,
            username=settings.neo4j_username,
            password=settings.neo4j_password,
            database=settings.neo4j_database,
        )
        logger.info("Neo4jGraph initialized successfully")
    
    return _graph


def refresh_schema() -> None:
    """Refresh the graph schema."""
    graph = _get_graph()
    graph.refresh_schema()
    logger.info("Graph schema refreshed")


def get_schema() -> str:
    """Get the current graph schema as a string."""
    graph = _get_graph()
    return graph.schema


def query_graph(query: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Execute a Cypher query through the Neo4jGraph interface.
    
    Args:
        query: Cypher query
        params: Query parameters
        
    Returns:
        Query results
    """
    graph = _get_graph()
    return graph.query(query, params or {})


# ---------------------------------------------------------------------------
# Vector store interface (Neo4jVector)
# ---------------------------------------------------------------------------

def _get_embedder() -> OpenAIEmbeddings:
    """Get or create embedding model."""
    global _embedder
    if _embedder is None:
        _embedder = make_embedding_model()
    return _embedder


def _get_vector_store(
    index_name: str = "vector",
    node_label: str = "Chunk",
    embedding_node_property: str = "embedding",
    text_node_property: str = "text",
) -> Neo4jVector:
    """Get or create Neo4jVector instance.
    
    First tries to connect to an existing index. If that fails,
    returns a Neo4jVector instance that can be used to create the index.
    
    Args:
        index_name: Name of the vector index
        node_label: Label for vector nodes
        embedding_node_property: Property name for embeddings
        text_node_property: Property name for text content
        
    Returns:
        Neo4jVector instance
    """
    global _vector_store
    
    if not HAS_NEO4J_VECTOR:
        raise ImportError(
            "langchain-neo4j is required for Neo4jVector. "
            "Install with: pip install langchain-neo4j"
        )
    
    # Create a unique key for caching based on parameters
    cache_key = f"{index_name}_{node_label}_{embedding_node_property}_{text_node_property}"
    
    if _vector_store is None or getattr(_vector_store, "_cache_key", None) != cache_key:
        missing = _validate_config()
        if missing:
            raise ValueError(f"Missing Neo4j configuration: {', '.join(missing)}")
        
        logger.info(f"Initializing Neo4jVector (index: {index_name})")
        embedder = _get_embedder()
        
        # Try to connect to existing index first
        try:
            _vector_store = Neo4jVector.from_existing_index(
                embedding=embedder,
                url=settings.neo4j_uri,
                username=settings.neo4j_username,
                password=settings.neo4j_password,
                database=settings.neo4j_database,
                index_name=index_name,
                node_label=node_label,
                embedding_node_property=embedding_node_property,
                text_node_property=text_node_property,
            )
            logger.info("Connected to existing vector index")
        except ValueError as e:
            if "does not exist" in str(e):
                # Index doesn't exist yet - create a new instance for initialization
                logger.info(f"Vector index '{index_name}' does not exist, will create on first use")
                _vector_store = Neo4jVector(
                    embedding=embedder,
                    url=settings.neo4j_uri,
                    username=settings.neo4j_username,
                    password=settings.neo4j_password,
                    database=settings.neo4j_database,
                    index_name=index_name,
                    node_label=node_label,
                    embedding_node_property=embedding_node_property,
                    text_node_property=text_node_property,
                    pre_delete_collection=False,
                )
            else:
                raise
        
        _vector_store._cache_key = cache_key
        logger.info("Neo4jVector initialized successfully")
    
    return _vector_store


def _create_vector_index(
    index_name: str,
    node_label: str,
    embedding_node_property: str,
    dimension: int,
    similarity_metric: str = "cosine",
) -> bool:
    """Create a vector index in Neo4j if it doesn't exist.
    
    Args:
        index_name: Name of the vector index
        node_label: Label for vector nodes
        embedding_node_property: Property name for embeddings
        dimension: Embedding dimension
        similarity_metric: Similarity metric (cosine, euclidean)
        
    Returns:
        True if index was created or already exists
    """
    # Map similarity metric to Neo4j function
    metric_map = {
        "cosine": "cosine",
        "euclidean": "euclidean",
        "dotproduct": "dotProduct",
    }
    neo4j_metric = metric_map.get(similarity_metric.lower(), "cosine")
    
    # Check if index already exists
    check_query = """
    SHOW VECTOR INDEXES YIELD name
    WHERE name = $index_name
    RETURN count(*) AS exists
    """
    result = execute_query(check_query, {"index_name": index_name})
    
    if result and result[0].get("exists", 0) > 0:
        logger.debug(f"Vector index '{index_name}' already exists")
        return True
    
    # Create the vector index
    create_query = f"""
    CREATE VECTOR INDEX {index_name} IF NOT EXISTS
    FOR (n:{node_label})
    ON (n.{embedding_node_property})
    OPTIONS {{
        indexConfig: {{
            `vector.dimensions`: {dimension},
            `vector.similarity_function`: '{neo4j_metric}'
        }}
    }}
    """
    
    try:
        execute_query(create_query)
        logger.info(f"Created vector index '{index_name}' (dim={dimension}, metric={neo4j_metric})")
        return True
    except Exception as exc:
        logger.error(f"Failed to create vector index: {exc}")
        raise


def init_vector_index(
    index_name: str = "vector",
    node_label: str = "Chunk",
    embedding_node_property: str = "embedding",
    text_node_property: str = "text",
    dimension: Optional[int] = None,
    similarity_metric: str = "cosine",
) -> None:
    """Initialize vector index with support for specified embedding dimension.
    
    Args:
        index_name: Name of the vector index
        node_label: Label for vector nodes
        embedding_node_property: Property name for embeddings
        text_node_property: Property name for text content
        dimension: Embedding dimension (defaults to settings.embedding_dimensions)
        similarity_metric: Similarity metric (cosine, euclidean, dotproduct)
    """
    if not HAS_NEO4J_VECTOR:
        raise ImportError(
            "langchain-neo4j is required for Neo4jVector. "
            "Install with: pip install langchain-neo4j"
        )
    
    missing = _validate_config()
    if missing:
        raise ValueError(f"Missing Neo4j configuration: {', '.join(missing)}")
    
    dim = dimension or settings.embedding_dimensions
    
    # Create the vector index
    _create_vector_index(
        index_name=index_name,
        node_label=node_label,
        embedding_node_property=embedding_node_property,
        dimension=dim,
        similarity_metric=similarity_metric,
    )
    
    logger.info(f"Vector index '{index_name}' ready")


def add_documents(
    documents: List[Document],
    index_name: str = "vector",
    node_label: str = "Chunk",
    ids: Optional[List[str]] = None,
) -> List[str]:
    """Add documents to the vector store.
    
    Args:
        documents: List of LangChain Document objects
        index_name: Name of the vector index
        node_label: Label for vector nodes
        ids: Optional list of IDs
        
    Returns:
        List of document IDs
    """
    store = _get_vector_store(index_name=index_name, node_label=node_label)
    return store.add_documents(documents, ids=ids)


def add_texts(
    texts: List[str],
    metadatas: Optional[List[Dict[str, Any]]] = None,
    index_name: str = "vector",
    node_label: str = "Chunk",
    ids: Optional[List[str]] = None,
) -> List[str]:
    """Add texts with optional metadata to the vector store.
    
    Args:
        texts: List of text strings
        metadatas: Optional list of metadata dictionaries
        index_name: Name of the vector index
        node_label: Label for vector nodes
        ids: Optional list of IDs
        
    Returns:
        List of document IDs
    """
    store = _get_vector_store(index_name=index_name, node_label=node_label)
    return store.add_texts(texts, metadatas=metadatas, ids=ids)


# ---------------------------------------------------------------------------
# Search operations
# ---------------------------------------------------------------------------

def similarity_search(
    query: str,
    k: int = 4,
    index_name: str = "vector",
    node_label: str = "Chunk",
    filter: Optional[Dict[str, Any]] = None,
) -> List[Document]:
    """Search for similar documents.
    
    Args:
        query: Search query text
        k: Number of results to return
        index_name: Name of the vector index
        node_label: Label for vector nodes
        filter: Optional metadata filter
        
    Returns:
        List of matching Document objects
    """
    store = _get_vector_store(index_name=index_name, node_label=node_label)
    return store.similarity_search(query, k=k, filter=filter)


def similarity_search_with_score(
    query: str,
    k: int = 4,
    index_name: str = "vector",
    node_label: str = "Chunk",
    filter: Optional[Dict[str, Any]] = None,
) -> List[Tuple[Document, float]]:
    """Search for similar documents with relevance scores.
    
    Args:
        query: Search query text
        k: Number of results to return
        index_name: Name of the vector index
        node_label: Label for vector nodes
        filter: Optional metadata filter
        
    Returns:
        List of (Document, score) tuples
    """
    store = _get_vector_store(index_name=index_name, node_label=node_label)
    return store.similarity_search_with_score(query, k=k, filter=filter)


def max_marginal_relevance_search(
    query: str,
    k: int = 4,
    fetch_k: int = 20,
    lambda_mult: float = 0.5,
    index_name: str = "vector",
    node_label: str = "Chunk",
    filter: Optional[Dict[str, Any]] = None,
) -> List[Document]:
    """Search with Maximal Marginal Relevance for diverse results.
    
    Args:
        query: Search query text
        k: Number of results to return
        fetch_k: Number of documents to fetch initially
        lambda_mult: Balance between relevance (1.0) and diversity (0.0)
        index_name: Name of the vector index
        node_label: Label for vector nodes
        filter: Optional metadata filter
        
    Returns:
        List of diverse Document objects
    """
    store = _get_vector_store(index_name=index_name, node_label=node_label)
    return store.max_marginal_relevance_search(
        query, k=k, fetch_k=fetch_k, lambda_mult=lambda_mult, filter=filter
    )


# ---------------------------------------------------------------------------
# Retrieval interface (for LangChain chains/agents)
# ---------------------------------------------------------------------------

def as_retriever(
    index_name: str = "vector",
    node_label: str = "Chunk",
    search_kwargs: Optional[Dict[str, Any]] = None,
):
    """Get the vector store as a LangChain retriever.
    
    Args:
        index_name: Name of the vector index
        node_label: Label for vector nodes
        search_kwargs: Optional search configuration
        
    Returns:
        VectorStoreRetriever instance
    """
    store = _get_vector_store(index_name=index_name, node_label=node_label)
    return store.as_retriever(search_kwargs=search_kwargs)


# ---------------------------------------------------------------------------
# Node operations
# ---------------------------------------------------------------------------

def delete_nodes(
    node_ids: List[str],
    node_label: str = "Chunk",
    database: Optional[str] = None,
) -> int:
    """Delete nodes by their IDs.
    
    Args:
        node_ids: List of node IDs to delete
        node_label: Label of the nodes
        database: Target database
        
    Returns:
        Number of nodes deleted
    """
    if not node_ids:
        return 0
    
    query = f"""
    MATCH (n:{node_label})
    WHERE n.id IN $node_ids
    DETACH DELETE n
    """
    
    with get_session(database) as session:
        result = session.run(query, {"node_ids": node_ids})
        summary = result.consume()
        deleted = summary.counters.nodes_deleted
        logger.info(f"Deleted {deleted} nodes")
        return deleted


def delete_by_filter(
    filter_dict: Dict[str, Any],
    node_label: str = "Chunk",
    database: Optional[str] = None,
) -> int:
    """Delete nodes matching a metadata filter.
    
    Args:
        filter_dict: Metadata filter (e.g., {"user_id": "123"})
        node_label: Label of the nodes
        database: Target database
        
    Returns:
        Number of nodes deleted
    """
    # Build WHERE clause from filter
    conditions = []
    params = {}
    for key, value in filter_dict.items():
        param_name = f"param_{key}"
        conditions.append(f"n.{key} = ${param_name}")
        params[param_name] = value
    
    where_clause = " AND ".join(conditions) if conditions else ""
    
    query = f"""
    MATCH (n:{node_label})
    {f"WHERE {where_clause}" if where_clause else ""}
    DETACH DELETE n
    """
    
    with get_session(database) as session:
        result = session.run(query, params)
        summary = result.consume()
        deleted = summary.counters.nodes_deleted
        logger.info(f"Deleted {deleted} nodes by filter")
        return deleted


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

def health_check() -> Dict[str, Any]:
    """Check Neo4j connection health.
    
    Returns:
        Dict with status and connection info
    """
    if not is_configured():
        return {
            "status": "not_configured",
            "message": "Neo4j configuration incomplete",
            "missing": _validate_config(),
        }
    
    try:
        driver = _get_driver()
        # Verify connectivity
        driver.verify_connectivity()
        
        # Get server info
        with get_session() as session:
            result = session.run("CALL dbms.components() YIELD name, versions, edition")
            record = result.single()
            
            return {
                "status": "ok",
                "uri": settings.neo4j_uri.replace(settings.neo4j_password, "***"),
                "database": settings.neo4j_database,
                "server_name": record.get("name") if record else "unknown",
                "server_version": record.get("versions", ["unknown"])[0] if record else "unknown",
                "edition": record.get("edition") if record else "unknown",
            }
    except Exception as exc:
        logger.error(f"Neo4j health check failed: {exc}")
        return {
            "status": "error",
            "message": str(exc),
        }


# ---------------------------------------------------------------------------
# Utility functions
# ---------------------------------------------------------------------------

def count_nodes(
    node_label: Optional[str] = None,
    database: Optional[str] = None,
) -> int:
    """Count nodes in the database.
    
    Args:
        node_label: Optional label to filter by
        database: Target database
        
    Returns:
        Number of nodes
    """
    if node_label:
        query = f"MATCH (n:{node_label}) RETURN count(n) AS count"
    else:
        query = "MATCH (n) RETURN count(n) AS count"
    
    result = execute_query(query, database=database)
    return result[0].get("count", 0) if result else 0


def get_node_labels(database: Optional[str] = None) -> List[str]:
    """Get all node labels in the database.
    
    Args:
        database: Target database
        
    Returns:
        List of label names
    """
    query = "CALL db.labels() YIELD label RETURN label ORDER BY label"
    result = execute_query(query, database=database)
    return [r.get("label") for r in result]


def get_relationship_types(database: Optional[str] = None) -> List[str]:
    """Get all relationship types in the database.
    
    Args:
        database: Target database
        
    Returns:
        List of relationship types
    """
    query = "CALL db.relationshipTypes() YIELD relationshipType RETURN relationshipType ORDER BY relationshipType"
    result = execute_query(query, database=database)
    return [r.get("relationshipType") for r in result]


def clear_database(confirm: bool = False, database: Optional[str] = None) -> Dict[str, int]:
    """Clear all data from the database. DANGER!
    
    Args:
        confirm: Must be True to proceed
        database: Target database
        
    Returns:
        Dict with counts of deleted nodes and relationships
    """
    if not confirm:
        raise ValueError("confirm=True required to clear database")
    
    query = """
    MATCH (n)
    DETACH DELETE n
    """
    
    with get_session(database) as session:
        result = session.run(query)
        summary = result.consume()
        
        deleted = {
            "nodes_deleted": summary.counters.nodes_deleted,
            "relationships_deleted": summary.counters.relationships_deleted,
        }
        logger.warning(f"Database cleared: {deleted}")
        return deleted
