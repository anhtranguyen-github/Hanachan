"""
Database — ThreadedConnectionPool for PostgreSQL.
Fixes Issues #2 (no pool), #3 (hardcoded credentials), #4 (silent write failures).
"""
from __future__ import annotations

import logging
from contextlib import contextmanager
from typing import Any, Dict, List, Optional

from psycopg2 import pool as pg_pool
from psycopg2.extras import RealDictCursor

from .config import settings

logger = logging.getLogger(__name__)

_pool: pg_pool.ThreadedConnectionPool | None = None


def init_pool() -> None:
    """Initialise the connection pool at application startup.

    Raises on failure — the caller (lifespan) must treat this as a hard error.
    """
    global _pool
    _pool = pg_pool.ThreadedConnectionPool(
        minconn=2,
        maxconn=10,  # stay well under Supabase's 60-conn limit
        host=settings.db_host,
        port=settings.db_port,
        database=settings.db_name,
        user=settings.db_user,
        password=settings.db_password,
        connect_timeout=5,  # fail fast if DB is unreachable
    )
    logger.info("DB connection pool initialised (min=2, max=10)")


def close_pool() -> None:
    """Close all connections in the pool at shutdown."""
    global _pool
    if _pool is not None:
        _pool.closeall()
        _pool = None
        logger.info("DB connection pool closed")


@contextmanager
def get_db():
    """Yield a connection from the pool; commit on success, rollback on error."""
    if _pool is None:
        raise RuntimeError(
            "Database pool not initialized. Call init_pool() at application startup."
        )
    conn = _pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        _pool.putconn(conn)


def execute_query(
    query: str, params: Optional[tuple] = None, fetch: bool = True
) -> Optional[List[Dict[str, Any]]]:
    """Execute a query using a pooled connection.

    - fetch=True  → returns list of dicts
    - fetch=False → commits the write and returns None
    Exceptions propagate to the caller; no silent swallowing.
    """
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            if fetch:
                return [dict(r) for r in cur.fetchall()]
            return None


def execute_single(
    query: str, params: Optional[tuple] = None
) -> Optional[Dict[str, Any]]:
    """Execute a query and return the first row, or None."""
    results = execute_query(query, params)
    return results[0] if results else None


def check_db_health() -> str:
    """Return 'ok' if the DB pool is reachable, otherwise an error string."""
    try:
        execute_query("SELECT 1", fetch=True)
        return "ok"
    except Exception as exc:
        return f"error: {exc}"
