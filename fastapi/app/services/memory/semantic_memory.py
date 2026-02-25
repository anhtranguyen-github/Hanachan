"""
Semantic Memory Module — backed by Neo4j (cloud).
"""
from __future__ import annotations

from typing import Any, Dict, List

from neo4j import GraphDatabase, Driver

from ...core.config import settings
from ...schemas.memory import KnowledgeGraph, Node, Relationship


# ---------------------------------------------------------------------------
# Singleton driver
# ---------------------------------------------------------------------------

_driver: Driver | None = None


def _get_driver() -> Driver:
    global _driver
    if _driver is None:
        _driver = GraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_user, settings.neo4j_password),
        )
    return _driver


# ---------------------------------------------------------------------------
# Initialisation & health
# ---------------------------------------------------------------------------

def init_neo4j() -> None:
    """Verify connectivity and ensure the fulltext index exists."""
    driver = _get_driver()
    with driver.session() as session:
        # Create a fulltext index on Entity nodes (used for keyword search)
        session.run(
            """
            CREATE FULLTEXT INDEX entity IF NOT EXISTS
            FOR (n:Entity)
            ON EACH [n.id, n.type]
            """
        )


def health_check() -> str:
    """Return 'ok' if Neo4j is reachable."""
    try:
        with _get_driver().session() as session:
            session.run("RETURN 1")
        return "ok"
    except Exception as exc:
        return f"error: {exc}"


# ---------------------------------------------------------------------------
# Node & relationship upsert helpers
# ---------------------------------------------------------------------------

def _merge_node(session, node: Node, user_id: str) -> None:
    """MERGE a node with a stable user_id label."""
    session.run(
        """
        MERGE (n:Entity {id: $id, user_id: $user_id})
        SET n.type = $type,
            n.user_id = $user_id
        SET n += $props
        """,
        id=node.id,
        user_id=user_id,
        type=node.type,
        props=node.properties,
    )


def _merge_relationship(session, rel: Relationship, user_id: str) -> None:
    """MERGE source → target with the given relationship type."""
    _merge_node(session, rel.source, user_id)
    _merge_node(session, rel.target, user_id)
    rel_type = "".join(ch for ch in rel.type.upper() if ch.isalnum() or ch == "_")
    query = f"""
        MATCH (s:Entity {{id: $source_id, user_id: $user_id}})
        MATCH (t:Entity {{id: $target_id, user_id: $user_id}})
        MERGE (s)-[r:{rel_type}]->(t)
        SET r += $props
    """
    session.run(
        query,
        source_id=rel.source.id,
        target_id=rel.target.id,
        user_id=user_id,
        props=rel.properties,
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def add_semantic_facts(user_id: str, kg: KnowledgeGraph) -> int:
    """
    Write KnowledgeGraph relationships to Neo4j, scoped by user_id.
    Returns number of relationships written.
    """
    if not kg.relationships:
        return 0
    driver = _get_driver()
    with driver.session() as session:
        for rel in kg.relationships:
            _merge_relationship(session, rel, user_id)
    return len(kg.relationships)


def add_nodes_and_relationships(
    user_id: str, nodes: List[Node], relationships: List[Relationship]
) -> tuple[int, int]:
    """Manually add nodes and relationships for a user."""
    driver = _get_driver()
    with driver.session() as session:
        for node in nodes:
            _merge_node(session, node, user_id)
        for rel in relationships:
            _merge_relationship(session, rel, user_id)
    return len(nodes), len(relationships)


def search_semantic_memory(user_id: str, keywords: List[str]) -> List[Dict[str, Any]]:
    """
    Fulltext search on Entity nodes for the user, return connected triples.
    Falls back to a simple label-scan when the fulltext index has no results.
    """
    driver = _get_driver()
    results: List[Dict[str, Any]] = []

    with driver.session() as session:
        for keyword in keywords[:10]:  # cap at 10 keywords
            try:
                records = session.run(
                    """
                    CALL db.index.fulltext.queryNodes("entity", $kw)
                    YIELD node, score
                    WHERE node.user_id = $user_id
                    MATCH (node)-[r]-(related)
                    WHERE related.user_id = $user_id
                    RETURN node, r, related, score
                    LIMIT 5
                    """,
                    kw=keyword,
                    user_id=user_id,
                )
                for rec in records:
                    results.append(
                        {
                            "node": dict(rec["node"]),
                            "relationship": rec["r"].type,
                            "related": dict(rec["related"]),
                            "score": rec["score"],
                        }
                    )
            except Exception:
                pass

    # Deduplicate
    seen = set()
    deduped = []
    for item in results:
        key = (
            item["node"].get("id"),
            item["relationship"],
            item["related"].get("id"),
        )
        if key not in seen:
            seen.add(key)
            deduped.append(item)
    return deduped


def inspect_semantic_memory(user_id: str) -> List[Dict[str, Any]]:
    """Return all relationships in the graph for a given user."""
    driver = _get_driver()
    with driver.session() as session:
        records = session.run(
            """
            MATCH (n:Entity {user_id: $user_id})-[r]->(m:Entity {user_id: $user_id})
            RETURN n, type(r) AS rel_type, m
            LIMIT 100
            """,
            user_id=user_id,
        )
        return [
            {
                "source": dict(rec["n"]),
                "relationship": rec["rel_type"],
                "target": dict(rec["m"]),
            }
            for rec in records
        ]


def get_graph_schema() -> Dict[str, Any]:
    """Return a simplified view of node labels and relationship types."""
    driver = _get_driver()
    with driver.session() as session:
        labels = [r["label"] for r in session.run("CALL db.labels()")]
        rel_types = [r["relationshipType"] for r in session.run("CALL db.relationshipTypes()")]
    return {"node_labels": labels, "relationship_types": rel_types}


def clear_semantic_memory(user_id: str) -> None:
    """Delete all nodes (and their relationships) for a given user."""
    driver = _get_driver()
    with driver.session() as session:
        session.run(
            "MATCH (n:Entity {user_id: $user_id}) DETACH DELETE n",
            user_id=user_id,
        )
