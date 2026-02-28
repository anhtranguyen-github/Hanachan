"""
Semantic Memory Module — backed by Neo4j (cloud).
"""

from __future__ import annotations

import logging
import re
from typing import Any, Dict, List

from neo4j import GraphDatabase, Driver

from ...core.config import settings
from ...schemas.memory import KnowledgeGraph, Node, Relationship

logger = logging.getLogger(__name__)

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
# Relationship type sanitisation (Issue #10)
# ---------------------------------------------------------------------------

_ALLOWED_REL_PATTERN = re.compile(r"^[A-Z][A-Z0-9_]{0,49}$")
_FALLBACK_REL_TYPE = "RELATED_TO"


def _safe_rel_type(raw: str) -> str:
    """Return a Cypher-safe relationship type string.

    - Uppercases and strips non-alphanumeric/underscore characters.
    - Strips leading digits (Cypher rel types must start with a letter).
    - Falls back to RELATED_TO if the result is empty or fails the allowlist.
    """
    sanitized = "".join(c for c in raw.upper() if c.isalnum() or c == "_")
    sanitized = sanitized.lstrip("0123456789")  # must start with a letter
    if not sanitized:
        sanitized = _FALLBACK_REL_TYPE
    if not _ALLOWED_REL_PATTERN.match(sanitized):
        logger.warning(
            "unsafe_rel_type_rejected",
            extra={"raw": raw, "sanitized": sanitized},
        )
        sanitized = _FALLBACK_REL_TYPE
    return sanitized


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def add_semantic_facts(user_id: str, kg: KnowledgeGraph) -> int:
    """Write KnowledgeGraph relationships to Neo4j in a single transaction.

    Returns number of relationships written.
    """
    if not kg.relationships:
        return 0
    driver = _get_driver()
    with driver.session() as session:

        def _write_tx(tx):
            for rel in kg.relationships:
                # Ensure both endpoint nodes exist
                tx.run(
                    "MERGE (n:Entity {id: $id, user_id: $user_id}) SET n.type = $type",
                    id=rel.source.id,
                    user_id=user_id,
                    type=rel.source.type,
                )
                tx.run(
                    "MERGE (n:Entity {id: $id, user_id: $user_id}) SET n.type = $type",
                    id=rel.target.id,
                    user_id=user_id,
                    type=rel.target.type,
                )
                rel_type = _safe_rel_type(rel.type)
                tx.run(
                    f"""
                    MERGE (s:Entity {{id: $src, user_id: $uid}})
                    MERGE (t:Entity {{id: $tgt, user_id: $uid}})
                    MERGE (s)-[:{rel_type}]->(t)
                    """,
                    src=rel.source.id,
                    tgt=rel.target.id,
                    uid=user_id,
                )

        session.execute_write(_write_tx)
    return len(kg.relationships)


def add_nodes_and_relationships(
    user_id: str, nodes: List[Node], relationships: List[Relationship]
) -> tuple[int, int]:
    """Manually add nodes and relationships in a single atomic transaction."""
    driver = _get_driver()
    with driver.session() as session:

        def _write_tx(tx):
            for node in nodes:
                tx.run(
                    "MERGE (n:Entity {id: $id, user_id: $user_id}) SET n.type = $type",
                    id=node.id,
                    user_id=user_id,
                    type=node.type,
                )
            for rel in relationships:
                rel_type = _safe_rel_type(rel.type)
                tx.run(
                    f"""
                    MERGE (s:Entity {{id: $src, user_id: $uid}})
                    MERGE (t:Entity {{id: $tgt, user_id: $uid}})
                    MERGE (s)-[:{rel_type}]->(t)
                    """,
                    src=rel.source.id,
                    tgt=rel.target.id,
                    uid=user_id,
                )

        session.execute_write(_write_tx)
    return len(nodes), len(relationships)


def search_semantic_memory(user_id: str, keywords: List[str]) -> List[Dict[str, Any]]:
    """Fulltext search with fuzzy matching and fallback 'about me' logic."""
    if not keywords:
        return []

    # 1. Clean and enhance keywords
    noise = {
        "ABOUT",
        "ME",
        "THE",
        "IS",
        "WHAT",
        "DO",
        "YOU",
        "KNOW",
        "FOR",
        "AND",
        "MY",
        "FACTS",
    }
    clean_kws = [k.strip().upper() for k in keywords if k.strip().upper() not in noise]

    # If all keywords were noise, use original keywords but at least we tried
    if not clean_kws:
        clean_kws = [k.upper() for k in keywords]

    logger.info(f"search_semantic_memory clean_kws: {clean_kws}")

    # Build Lucene query with fuzzy matching (~) for each term, quoting terms with spaces
    lucene_terms = []
    for k in clean_kws[:10]:
        if " " in k:
            lucene_terms.append(f'"{k}"~')
        else:
            lucene_terms.append(f"{k}~")
    kw_query = " OR ".join(lucene_terms)

    driver = _get_driver()
    results: List[Dict[str, Any]] = []

    with driver.session() as session:
        try:
            # 1. Primary search: Fulltext matching
            if kw_query:
                records = session.run(
                    """
                    CALL db.index.fulltext.queryNodes("entity", $kw_query)
                    YIELD node, score
                    WHERE node.user_id = $user_id
                    MATCH (node)-[r]-(related)
                    WHERE related.user_id = $user_id
                    RETURN node, r, related, score
                    ORDER BY score DESC
                    LIMIT 20
                    """,
                    kw_query=kw_query,
                    user_id=user_id,
                )
                for rec in records:
                    rel = rec["r"]
                    results.append(
                        {
                            "source": dict(rec["node"]),
                            "relationship": rel.type,
                            "target": dict(rec["related"]),
                            "score": rec["score"],
                        }
                    )

            # 2. Fallback: If nothing found or query is general, pull all persona relationships
            is_general = any(
                k.upper()
                in {
                    "ME",
                    "MY",
                    "INFO",
                    "FACTS",
                    "INTERESTS",
                    "GOALS",
                    "ABOUT",
                    "PROFILE",
                }
                for k in clean_kws
            )
            logger.info(
                f"search_semantic_memory results_len: {len(results)}, is_general: {is_general}"
            )
            if (not results or is_general) and len(results) < 10:
                logger.info(
                    f"search_semantic_memory entering fallback for user: {user_id}"
                )
                extra_records = session.run(
                    """
                    MATCH (n:Entity {user_id: $user_id})-[r]-(m)
                    WHERE m.user_id = $user_id
                    RETURN n, r, m, 1.0 AS score
                    LIMIT 30
                    """,
                    user_id=user_id,
                )
                for rec in extra_records:
                    results.append(
                        {
                            "source": dict(rec["n"]),
                            "relationship": rec["r"].type,
                            "target": dict(rec["m"]),
                            "score": rec["score"],
                        }
                    )
        except Exception as exc:
            logger.warning(
                "semantic_search_failed",
                extra={"error": str(exc), "kw_query": kw_query},
            )
            return []

    return _deduplicate(results)


def _deduplicate(results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen: set = set()
    deduped: List[Dict[str, Any]] = []
    for item in results:
        key = (
            item["source"].get("id"),
            item["relationship"],
            item["target"].get("id"),
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
        rel_types = [
            r["relationshipType"] for r in session.run("CALL db.relationshipTypes()")
        ]
    return {"node_labels": labels, "relationship_types": rel_types}


def clear_semantic_memory(user_id: str) -> None:
    """Delete all nodes (and their relationships) for a given user."""
    driver = _get_driver()
    with driver.session() as session:
        session.run(
            "MATCH (n:Entity {user_id: $user_id}) DETACH DELETE n",
            user_id=user_id,
        )
