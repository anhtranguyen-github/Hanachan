import os
import tempfile
from sqlalchemy import create_engine
from src.fastapi.app.utils.safe_sql import do_execute


def _make_sqlite_db():
    engine = create_engine("sqlite+pysqlite:///:memory:", echo=False)
    with engine.begin() as conn:
        conn.execute(
            """
            CREATE TABLE users (
                id INTEGER PRIMARY KEY,
                name TEXT,
                email TEXT
            )
            """
        )
        conn.execute("INSERT INTO users (name, email) VALUES (:n, :e)", {"n": "alice", "e": "a@example.com"})
        conn.execute("INSERT INTO users (name, email) VALUES (:n, :e)", {"n": "bob", "e": "b@example.com"})
    return engine


def test_do_execute_select_allowed_table():
    engine = _make_sqlite_db()
    url = str(engine.url)
    rows = do_execute(url, "SELECT id, name FROM users WHERE name = :name", {"name": "alice"}, table_whitelist={"users"}, row_cap=10)
    assert isinstance(rows, list)
    assert len(rows) == 1
    assert rows[0]["name"] == "alice"


def test_do_execute_rejects_non_select():
    engine = _make_sqlite_db()
    url = str(engine.url)
    try:
        do_execute(url, "DROP TABLE users", {}, table_whitelist={"users"})
        assert False, "Non-select should raise"
    except ValueError:
        pass


def test_do_execute_rejects_unwhitelisted_table():
    engine = _make_sqlite_db()
    url = str(engine.url)
    try:
        do_execute(url, "SELECT * FROM users", {}, table_whitelist={"other_table"})
        assert False, "Unwhitelisted table should raise"
    except ValueError:
        pass


def test_do_execute_row_cap_enforced():
    engine = create_engine("sqlite+pysqlite:///:memory:")
    with engine.begin() as conn:
        conn.execute("CREATE TABLE logs (id INTEGER PRIMARY KEY, msg TEXT)")
        for i in range(50):
            conn.execute("INSERT INTO logs (msg) VALUES (:m)", {"m": f"msg-{i}"})
    url = str(engine.url)
    rows = do_execute(url, "SELECT id, msg FROM logs ORDER BY id", {}, table_whitelist={"logs"}, row_cap=10)
    assert len(rows) == 10
