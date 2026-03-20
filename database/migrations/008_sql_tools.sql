-- ==========================================================
-- MIGRATION 008: SQL Tools RPC
-- Purpose: Support executing arbitrary queries from the 
--          FastAPI backend via the Supabase Python SDK
-- ==========================================================

CREATE OR REPLACE FUNCTION get_database_schema()
RETURNS json AS $$
DECLARE
    schema_json json;
BEGIN
    SELECT json_agg(row_to_json(t)) INTO schema_json
    FROM (
        SELECT
            t.table_name,
            c.column_name,
            c.data_type,
            CASE WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY' ELSE '' END as key_type
        FROM information_schema.tables t
        JOIN information_schema.columns c ON t.table_name = c.table_name
        LEFT JOIN (
            SELECT ku.table_name, column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
            WHERE tc.constraint_type = 'PRIMARY KEY'
        ) pk ON t.table_name = pk.table_name AND c.column_name = pk.column_name
        WHERE t.table_schema = 'public'
        ORDER BY t.table_name, c.ordinal_position
    ) t;
    
    RETURN schema_json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION execute_read_only_sql(sql_query text)
RETURNS json AS $$
DECLARE
    result json;
    upper_query text;
BEGIN
    upper_query := upper(sql_query);
    IF upper_query LIKE '%INSERT %' OR upper_query LIKE '%UPDATE %' OR upper_query LIKE '%DELETE %' OR upper_query LIKE '%DROP %' OR upper_query LIKE '%ALTER %' OR upper_query LIKE '%TRUNCATE %' OR upper_query LIKE '%CREATE %' OR upper_query LIKE '%GRANT %' OR upper_query LIKE '%REVOKE %' OR upper_query LIKE '%REPLACE %' THEN
        RAISE EXCEPTION 'Only SELECT/WITH queries are allowed';
    END IF;

    -- Run the query as a readonly session
    SET LOCAL TRANSACTION READ ONLY;
    EXECUTE 'SELECT json_agg(row_to_json(q)) FROM (' || sql_query || ') q' INTO result;
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER set search_path = public;
