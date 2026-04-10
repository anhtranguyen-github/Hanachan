from __future__ import annotations

from pathlib import Path

import pytest
from sqlalchemy import create_engine, text

from app.utils.safe_sql import (
    USER_ID_SQL_PLACEHOLDER,
    SafeSqlError,
    assess_sql_risk,
    do_execute,
    extract_tables,
    render_sql_for_user,
    validate_sql_query,
)


def _make_sqlite_db(tmp_path: Path) -> str:
    db_path = tmp_path / "safe-sql-test.db"
    engine = create_engine(f"sqlite+pysqlite:///{db_path}")
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY,
                    user_id TEXT,
                    name TEXT,
                    email TEXT
                )
                """
            )
        )
        conn.execute(
            text("INSERT INTO users (user_id, name, email) VALUES (:user_id, :name, :email)"),
            {"user_id": "user-1", "name": "alice", "email": "a@example.com"},
        )
        conn.execute(
            text("INSERT INTO users (user_id, name, email) VALUES (:user_id, :name, :email)"),
            {"user_id": "user-2", "name": "bob", "email": "b@example.com"},
        )
    return str(engine.url)


def test_do_execute_select_allowed_table(tmp_path: Path):
    url = _make_sqlite_db(tmp_path)
    rows = do_execute(
        url,
        "SELECT id, name FROM users WHERE name = :name",
        {"name": "alice"},
        table_whitelist={"users"},
        row_cap=10,
    )
    assert isinstance(rows, list)
    assert len(rows) == 1
    assert rows[0]["name"] == "alice"


def test_do_execute_rejects_non_select(tmp_path: Path):
    url = _make_sqlite_db(tmp_path)
    with pytest.raises(SafeSqlError):
        do_execute(url, "DROP TABLE users", {}, table_whitelist={"users"})


def test_validate_sql_rejects_comments_and_multiple_statements():
    with pytest.raises(SafeSqlError):
        validate_sql_query("SELECT id FROM users; DROP TABLE users", table_whitelist={"users"})

    with pytest.raises(SafeSqlError):
        validate_sql_query("SELECT id FROM users -- hidden payload", table_whitelist={"users"})


def test_validate_sql_rejects_wildcard_and_system_schema():
    with pytest.raises(SafeSqlError):
        validate_sql_query("SELECT * FROM users", table_whitelist={"users"})

    with pytest.raises(SafeSqlError):
        validate_sql_query(
            "SELECT tablename FROM pg_catalog.pg_tables",
            table_whitelist={"users"},
        )


def test_validate_sql_requires_user_scope_placeholder():
    with pytest.raises(SafeSqlError):
        validate_sql_query(
            "SELECT id, name FROM users WHERE name = 'alice'",
            table_whitelist={"users"},
            user_scoped_tables={"users"},
        )

    validated = validate_sql_query(
        f"SELECT id, name FROM users WHERE user_id = {USER_ID_SQL_PLACEHOLDER}",
        table_whitelist={"users"},
        user_scoped_tables={"users"},
    )
    assert USER_ID_SQL_PLACEHOLDER in validated


def test_validate_sql_allows_cte_when_backing_tables_are_whitelisted():
    sql = (
        f"WITH recent AS (SELECT id, user_id FROM users WHERE user_id = {USER_ID_SQL_PLACEHOLDER}) "
        "SELECT id FROM recent"
    )
    validated = validate_sql_query(
        sql,
        table_whitelist={"users"},
        user_scoped_tables={"users"},
    )
    assert validated.startswith("WITH recent")


def test_render_sql_for_user_replaces_placeholder():
    rendered = render_sql_for_user(
        f"SELECT id FROM users WHERE user_id = {USER_ID_SQL_PLACEHOLDER}",
        "00000000-0000-0000-0000-000000000123",
    )
    assert USER_ID_SQL_PLACEHOLDER not in rendered
    assert "'00000000-0000-0000-0000-000000000123'::uuid" in rendered


def test_extract_tables_and_risk_assessment():
    sql = (
        f"WITH recent AS (SELECT id, user_id FROM users WHERE user_id = {USER_ID_SQL_PLACEHOLDER}) "
        "SELECT id, COUNT(*) FROM recent JOIN logs ON logs.id = recent.id GROUP BY id"
    )
    assert extract_tables(sql) == ["logs", "users"]
    risk = assess_sql_risk(sql)
    assert risk["requires_review"] is True
    assert "uses_cte" in risk["risk_flags"]
    assert "uses_join" in risk["risk_flags"]
    assert "uses_aggregation" in risk["risk_flags"]


def test_do_execute_row_cap_enforced(tmp_path: Path):
    db_path = tmp_path / "safe-sql-cap.db"
    engine = create_engine(f"sqlite+pysqlite:///{db_path}")
    with engine.begin() as conn:
        conn.execute(text("CREATE TABLE logs (id INTEGER PRIMARY KEY, msg TEXT)"))
        for i in range(50):
            conn.execute(text("INSERT INTO logs (msg) VALUES (:msg)"), {"msg": f"msg-{i}"})
    rows = do_execute(
        str(engine.url),
        "SELECT id, msg FROM logs ORDER BY id",
        {},
        table_whitelist={"logs"},
        row_cap=10,
    )
    assert len(rows) == 10
