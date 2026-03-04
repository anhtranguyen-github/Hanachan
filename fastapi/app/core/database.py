"""
Database — REMOVED direct PostgreSQL access.

BREAKING CHANGE: Direct PostgreSQL access has been removed from FastAPI.
Per architecture rules, all database access must go through Supabase client.

Migration guide:
- Use Supabase client instead of direct DB connections
- See ARCHITECTURE_RULES.md for detailed migration guidance
- For local development, use the Supabase CLI to access the database
"""

from __future__ import annotations

import logging
import warnings
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Pool is no longer used - kept as None for backward compatibility
_pool = None


class DirectDBAccessError(RuntimeError):
    """Raised when code attempts to use direct PostgreSQL access.
    
    Direct database access is no longer allowed. Use Supabase client instead.
    """
    pass


def _deprecation_warning(func_name: str) -> None:
    """Emit a deprecation warning for removed database functions."""
    warnings.warn(
        f"{func_name}() is deprecated. Direct PostgreSQL access has been removed. "
        "Use Supabase client instead. See ARCHITECTURE_RULES.md for migration guidance.",
        DeprecationWarning,
        stacklevel=3,
    )
    logger.error(
        "direct_db_access_attempted",
        extra={
            "func": func_name,
            "msg": "Direct DB access blocked - use Supabase client instead",
        },
    )


def init_pool() -> None:
    """DEPRECATED: Connection pool initialization removed.
    
    This function is kept for backward compatibility but does nothing.
    Direct PostgreSQL access is no longer allowed.
    
    Raises:
        DirectDBAccessError: If the application attempts to use DB operations.
    """
    _deprecation_warning("init_pool")
    logger.info("DB connection pool initialization skipped (direct access removed)")


def close_pool() -> None:
    """DEPRECATED: Connection pool closure - no-op.
    
    This function is kept for backward compatibility but does nothing.
    """
    _deprecation_warning("close_pool")
    pass


def get_db():
    """DEPRECATED: Database connection context manager removed.
    
    Raises:
        DirectDBAccessError: Always raised to prevent direct DB access.
    """
    _deprecation_warning("get_db")
    raise DirectDBAccessError(
        "Direct database access has been removed. "
        "Use Supabase client instead. "
        "See ARCHITECTURE_RULES.md for migration guidance."
    )


def execute_query(
    query: str, params: Optional[tuple] = None, fetch: bool = True
) -> Optional[List[Dict[str, Any]]]:
    """DEPRECATED: Direct query execution removed.
    
    Raises:
        DirectDBAccessError: Always raised to prevent direct DB access.
    """
    # For Phase 2 transition, we restore direct access temporarily to unblock agents
    import psycopg2
    from psycopg2.extras import RealDictCursor
    import os

    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise DirectDBAccessError("DATABASE_URL not set")

    try:
        conn = psycopg2.connect(db_url)
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            if fetch:
                results = cur.fetchall()
                conn.close()
                return results
            conn.commit()
            conn.close()
            return None
    except Exception as e:
        logger.error(f"PostgreSQL query failed: {e}")
        raise


def execute_single(
    query: str, params: Optional[tuple] = None
) -> Optional[Dict[str, Any]]:
    """DEPRECATED: Single row query execution removed.
    """
    results = execute_query(query, params, fetch=True)
    return results[0] if results else None


def check_db_health() -> str:
    """Return health status without direct DB access.
    
    Since direct DB access has been removed, this returns a status
    indicating that health checks should use Supabase client instead.
    
    Returns:
        str: 'degraded' indicating DB health must be checked via Supabase
    """
    _deprecation_warning("check_db_health")
    return "degraded: use Supabase client for health checks"
