from src.fastapi.app.utils.hitl import execute_with_approval
from src.fastapi.app.utils.safe_sql import do_execute
from sqlalchemy import create_engine


def test_example_api_flow(tmp_path):
    # Example: create in-memory DB and validate a simple flow using safe executor
    engine = create_engine("sqlite+pysqlite:///:memory:")
    with engine.begin() as conn:
        conn.execute("""
        CREATE TABLE pipeline_results (
            id INTEGER PRIMARY KEY,
            status TEXT
        )
        """)
        conn.execute("INSERT INTO pipeline_results (status) VALUES (:s)", {"s": "ok"})

    db_url = str(engine.url)

    # approver that auto-approves for CI tests
    def approver(proposed):
        return {"type": "approve"}

    rows = execute_with_approval(db_url, "SELECT id, status FROM pipeline_results", None, table_whitelist={"pipeline_results"}, approver=approver)
    assert rows and rows[0]["status"] == "ok"
