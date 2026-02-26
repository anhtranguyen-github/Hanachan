import psycopg2
from psycopg2.extras import RealDictCursor
from ..core.config import settings

def get_db_connection():
    # Construct connection string from settings or use the known local one
    # Assuming the local postgres is the one we want to use for "Supabase" persistence
    # postgresql://postgres:postgres@127.0.0.1:5432/postgres
    return psycopg2.connect(
        host="127.0.0.1",
        port=54422,
        database="postgres",
        user="postgres",
        password="postgres"
    )

def execute_query(query: str, params: tuple = None, fetch: bool = True):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            if fetch:
                return cur.fetchall()
            conn.commit()
            return None
    finally:
        conn.close()

def execute_single(query: str, params: tuple = None):
    results = execute_query(query, params)
    return results[0] if results else None
