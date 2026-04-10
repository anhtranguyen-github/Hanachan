import os
import re
import unicodedata
from typing import Any, Dict, Iterable, List, Optional

from sqlalchemy import create_engine, text


USER_ID_SQL_PLACEHOLDER = "__USER_ID__"

DEFAULT_SAFE_SQL_TABLES = {
    "chat_messages",
    "chat_sessions",
    "decks",
    "knowledge_units",
    "lesson_batches",
    "lesson_items",
    "questions",
    "review_session_items",
    "review_sessions",
    "user_deck_settings",
    "user_learning_logs",
    "user_learning_progress",
    "user_learning_states",
    "user_reviews",
}

DEFAULT_USER_SCOPED_TABLES = {
    "chat_messages",
    "chat_sessions",
    "decks",
    "lesson_batches",
    "lesson_items",
    "review_session_items",
    "review_sessions",
    "user_deck_settings",
    "user_learning_logs",
    "user_learning_progress",
    "user_learning_states",
    "user_reviews",
}

DISALLOWED_SCHEMAS = {"auth", "information_schema", "pg_catalog", "storage", "vault"}
DISALLOWED_TABLE_PREFIXES = ("pg_",)
DISALLOWED_SQL_PATTERNS = (
    r"\binsert\b",
    r"\bupdate\b",
    r"\bdelete\b",
    r"\bdrop\b",
    r"\balter\b",
    r"\btruncate\b",
    r"\bcreate\b",
    r"\bgrant\b",
    r"\brevoke\b",
    r"\breplace\b",
    r"\bcopy\b",
    r"\bcall\b",
    r"\bexecute\b",
    r"\bprepare\b",
    r"\bdo\b",
    r"\bpg_sleep\b",
)
HIGH_RISK_SQL_FLAGS = {"uses_cte", "uses_join", "uses_set_operations", "multi_table_access"}


def _csv_set(name: str, default: set[str]) -> set[str]:
    raw = os.environ.get(name, "")
    if not raw.strip():
        return set(default)
    return {item.strip().lower() for item in raw.split(",") if item.strip()}


DEFAULT_TABLE_WHITELIST = _csv_set("SAFE_SQL_TABLES", DEFAULT_SAFE_SQL_TABLES)
DEFAULT_USER_TABLES = _csv_set("SAFE_SQL_USER_SCOPED_TABLES", DEFAULT_USER_SCOPED_TABLES)


class SafeSqlError(ValueError):
    """Raised when a generated SQL query violates guardrails."""


def normalize_sql(query: str) -> str:
    return unicodedata.normalize("NFKC", query or "").strip()


def _is_select_query(query: str) -> bool:
    q = normalize_sql(query).lower()
    if ";" in q:
        return False
    return q.startswith("select")


def _normalize_identifier(identifier: str) -> str:
    return identifier.replace('"', "").strip().lower()


def _extract_cte_names(query: str) -> set[str]:
    names = {
        _normalize_identifier(match.group(1))
        for match in re.finditer(r"\bwith\s+([a-zA-Z_][\w\"]*)\s+as\s*\(", query, re.IGNORECASE)
    }
    names.update(
        _normalize_identifier(match.group(1))
        for match in re.finditer(r",\s*([a-zA-Z_][\w\"]*)\s+as\s*\(", query, re.IGNORECASE)
    )
    return {name for name in names if name}


def _extract_tables(query: str) -> List[str]:
    pattern = re.compile(
        r"\b(?:from|join)\s+((?:[a-zA-Z_][\w]*|\"[^\"]+\")(?:\.(?:[a-zA-Z_][\w]*|\"[^\"]+\"))?)",
        re.IGNORECASE,
    )
    cte_names = _extract_cte_names(query)
    tables = set()
    for match in pattern.finditer(query):
        identifier = _normalize_identifier(match.group(1))
        if not identifier:
            continue
        base_name = identifier.split(".")[-1]
        if base_name in cte_names:
            continue
        tables.add(identifier)
    return sorted(tables)


def extract_tables(query: str) -> List[str]:
    return _extract_tables(normalize_sql(query))


def _validate_whitelist(tables: List[str], whitelist: Optional[set]) -> bool:
    if not whitelist:
        return False
    normalized_whitelist = {t.lower() for t in whitelist}
    return all(table.split(".")[-1].lower() in normalized_whitelist for table in tables)


def _validate_table_identifiers(tables: Iterable[str]) -> None:
    for table in tables:
        parts = [part for part in table.split(".") if part]
        if not parts:
            raise SafeSqlError("Unable to determine referenced tables")
        if len(parts) > 1 and parts[0] in DISALLOWED_SCHEMAS:
            raise SafeSqlError(f"Queries against schema '{parts[0]}' are not allowed")
        if any(part.startswith(prefix) for part in parts for prefix in DISALLOWED_TABLE_PREFIXES):
            raise SafeSqlError(f"Queries against system table '{table}' are not allowed")


def _reject_obvious_injection(normalized_sql: str) -> None:
    lowered = normalized_sql.lower()
    if not lowered:
        raise SafeSqlError("SQL query is empty")
    if ";" in lowered:
        raise SafeSqlError("Only single-statement queries are allowed")
    if "--" in lowered or "/*" in lowered or "*/" in lowered:
        raise SafeSqlError("SQL comments are not allowed")
    if "\x00" in lowered:
        raise SafeSqlError("NUL bytes are not allowed")
    if not (lowered.startswith("select") or lowered.startswith("with")):
        raise SafeSqlError("Only SELECT or WITH queries are allowed")
    if re.search(r"(^|[\s,(])(?:select\s+\*|[a-zA-Z_][\w]*\.\*)(?=[\s,])", lowered):
        raise SafeSqlError("Wildcard selects are not allowed")
    for pattern in DISALLOWED_SQL_PATTERNS:
        if re.search(pattern, lowered, re.IGNORECASE):
            raise SafeSqlError("SQL contains a forbidden keyword or function")


def _require_user_scope(sql: str, tables: Iterable[str], user_scoped_tables: set[str]) -> None:
    normalized_tables = {table.split(".")[-1].lower() for table in tables}
    if not normalized_tables.intersection({t.lower() for t in user_scoped_tables}):
        return

    user_scope_pattern = re.compile(
        rf"\b(?:[a-zA-Z_][\w]*\.)?user_id\b\s*=\s*{re.escape(USER_ID_SQL_PLACEHOLDER)}\b",
        re.IGNORECASE,
    )
    if not user_scope_pattern.search(sql):
        raise SafeSqlError(
            f"Queries against user-scoped tables must filter by user_id = {USER_ID_SQL_PLACEHOLDER}"
        )


def validate_sql_query(
    query: str,
    *,
    table_whitelist: Optional[set[str]] = None,
    user_scoped_tables: Optional[set[str]] = None,
) -> str:
    normalized_sql = normalize_sql(query)
    _reject_obvious_injection(normalized_sql)

    tables = _extract_tables(normalized_sql)
    if not tables:
        raise SafeSqlError("Unable to determine referenced tables")

    _validate_table_identifiers(tables)

    whitelist = table_whitelist or DEFAULT_TABLE_WHITELIST
    if not whitelist:
        raise SafeSqlError("SAFE_SQL_TABLES not configured: refusing to execute queries")
    if not _validate_whitelist(tables, whitelist):
        raise SafeSqlError(f"Query references disallowed tables: {tables}")

    _require_user_scope(normalized_sql, tables, user_scoped_tables or DEFAULT_USER_TABLES)
    return normalized_sql


def render_sql_for_user(query: str, user_id: str | None) -> str:
    normalized_sql = normalize_sql(query)
    if USER_ID_SQL_PLACEHOLDER not in normalized_sql:
        return normalized_sql
    if not user_id:
        raise SafeSqlError("Authenticated user_id is required for scoped SQL queries")
    return normalized_sql.replace(USER_ID_SQL_PLACEHOLDER, f"'{user_id}'::uuid")


def assess_sql_risk(query: str) -> dict[str, Any]:
    normalized_sql = normalize_sql(query)
    lowered = normalized_sql.lower()
    tables = extract_tables(normalized_sql)
    risk_flags: list[str] = []

    if lowered.startswith("with "):
        risk_flags.append("uses_cte")
    if re.search(r"\bjoin\b", lowered):
        risk_flags.append("uses_join")
    if re.search(r"\b(group by|having|distinct)\b", lowered):
        risk_flags.append("uses_set_operations")
    if re.search(r"\b(count|sum|avg|min|max)\s*\(", lowered):
        risk_flags.append("uses_aggregation")
    if len(tables) > 1:
        risk_flags.append("multi_table_access")
    if "limit" not in lowered:
        risk_flags.append("no_explicit_limit")

    return {
        "tables": tables,
        "risk_flags": risk_flags,
        "requires_review": any(flag in HIGH_RISK_SQL_FLAGS for flag in risk_flags),
    }


def do_execute(engine_url: str, query: str, params: Optional[Dict[str, Any]] = None, *, table_whitelist: Optional[set] = None, row_cap: Optional[int] = 1000, timeout_ms: Optional[int] = None) -> List[Dict[str, Any]]:
    """Safely execute a SELECT query using parameterized SQL and a table whitelist.

    - Enforces the query starts with SELECT and contains no multiple statements.
    - Extracts table identifiers and validates them against `table_whitelist` or env var `SAFE_SQL_TABLES`.
    - Executes via SQLAlchemy `text()` with the provided params.

    Returns rows as list of dicts.
    """
    query = validate_sql_query(query, table_whitelist=table_whitelist)

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
