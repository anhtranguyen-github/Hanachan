from sqlalchemy import create_engine, text
import os
import re
from typing import Any, Dict, List, Optional


DEFAULT_TABLE_WHITELIST = set(os.environ.get("SAFE_SQL_TABLES", "").split(",")) if os.environ.get("SAFE_SQL_TABLES") else set()


def _is_select_query(query: str) -> bool:
    q = query.strip().lower()
    # disallow multiple statements and non-select starts
    if ";" in q:
        return False
    return q.startswith("select")


def _extract_tables(query: str) -> List[str]:
    # very small heuristic to pull table names after FROM/JOIN
    pattern = re.compile(r"\bfrom\s+([a-zA-Z0-9_]+)|\bjoin\s+([a-zA-Z0-9_]+)", re.IGNORECASE)
    tables = set()
    for m in pattern.finditer(query):
        if m.group(1):
            tables.add(m.group(1).lower())
        if m.group(2):
            tables.add(m.group(2).lower())
    return list(tables)


def _validate_whitelist(tables: List[str], whitelist: Optional[set]) -> bool:
    # Fail-closed: if no whitelist is configured, reject all queries.
    if not whitelist:
        return False
    return all(t.lower() in whitelist for t in tables)


def do_execute(engine_url: str, query: str, params: Optional[Dict[str, Any]] = None, *, table_whitelist: Optional[set] = None, row_cap: Optional[int] = 1000, timeout_ms: Optional[int] = None) -> List[Dict[str, Any]]:
    """Safely execute a SELECT query using parameterized SQL and a table whitelist.

    - Enforces the query starts with SELECT and contains no multiple statements.
    - Extracts table identifiers and validates them against `table_whitelist` or env var `SAFE_SQL_TABLES`.
    - Executes via SQLAlchemy `text()` with the provided params.

    Returns rows as list of dicts.
    """
    if not _is_select_query(query):
        raise ValueError("Only single-statement SELECT queries are allowed")

    tables = _extract_tables(query)
    whitelist = table_whitelist or DEFAULT_TABLE_WHITELIST
    if not whitelist:
        raise RuntimeError("SAFE_SQL_TABLES not configured: refusing to execute queries (fail-closed)")
    if not _validate_whitelist(tables, whitelist):
        raise ValueError(f"Query references disallowed tables: {tables}")

    engine = create_engine(engine_url)
    with engine.begin() as conn:
        # If Postgres and timeout requested, set statement_timeout for this transaction
        if timeout_ms and ("postgres" in engine_url or "postgresql" in engine_url):
            try:
                conn.execute(text(f"SET LOCAL statement_timeout = {int(timeout_ms)}"))
            except Exception:
                # ignore if DB doesn't support it; best-effort
                pass

        stmt = text(query)
        result = conn.execute(stmt, params or {})
        try:
            rows = [dict(row) for row in result.mappings().all()]
        except Exception:
            # fallback for older SQLAlchemy versions
            rows = [dict(r) for r in result.fetchall()]

    # enforce row cap in-memory as an additional safety net
    if row_cap is not None and isinstance(row_cap, int) and row_cap >= 0:
        if len(rows) > row_cap:
            return rows[:row_cap]
    return rows
