from src.fastapi.app.utils.hitl import execute_with_approval
from src.fastapi.app.utils.safe_sql import do_execute
from sqlalchemy import create_engine


def _make_sqlite_db():
    engine = create_engine("sqlite+pysqlite:///:memory:", echo=False)
    with engine.begin() as conn:
        conn.execute(
            """
            CREATE TABLE items (
                id INTEGER PRIMARY KEY,
                title TEXT
            )
            """
        )
        conn.execute("INSERT INTO items (title) VALUES (:t)", {"t": "hello"})
    return engine


def test_execute_with_approval_approved():
    engine = _make_sqlite_db()
    url = str(engine.url)

    def approver(proposed):
        assert "query" in proposed
        return {"type": "approve"}

    rows = execute_with_approval(url, "SELECT id, title FROM items", None, table_whitelist={"items"}, approver=approver, row_cap=10)
    assert isinstance(rows, list)
    assert rows and rows[0]["title"] == "hello"


def test_execute_with_approval_rejected():
    engine = _make_sqlite_db()
    url = str(engine.url)

    def approver(proposed):
        return {"type": "reject", "message": "not allowed"}

    try:
        execute_with_approval(url, "SELECT id, title FROM items", None, table_whitelist={"items"}, approver=approver)
        assert False, "Should have raised PermissionError"
    except PermissionError:
        pass
