import pytest
from app.mcp.server import _is_safe_sql, _apply_sql_limit

def test_is_safe_sql():
    # Valid queries
    assert _is_safe_sql("SELECT * FROM users") is True
    assert _is_safe_sql("WITH cte AS (SELECT 1) SELECT * FROM cte") is True
    assert _is_safe_sql("  select 1;  ") is True
    
    # Mutating keywords
    assert _is_safe_sql("INSERT INTO users (name) VALUES ('hacker')") is False
    assert _is_safe_sql("UPDATE users SET name = 'hacker'") is False
    assert _is_safe_sql("DELETE FROM users") is False
    assert _is_safe_sql("DROP TABLE users") is False
    assert _is_safe_sql("ALTER TABLE users ADD column age int") is False
    assert _is_safe_sql("TRUNCATE users") is False
    
    # Non-SELECT starts
    assert _is_safe_sql("GRANT ALL ON users TO public") is False
    assert _is_safe_sql("EXEC my_proc") is False

def test_apply_sql_limit():
    assert "LIMIT 100" in _apply_sql_limit("SELECT * FROM users")
    assert "LIMIT 100" not in _apply_sql_limit("SELECT * FROM users LIMIT 5")
    assert _apply_sql_limit("SELECT * FROM users LIMIT 5") == "SELECT * FROM users LIMIT 5"
    assert "LIMIT 100" in _apply_sql_limit("SELECT * FROM users;")
