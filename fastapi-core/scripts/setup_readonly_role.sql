-- Supabase Read-Only Role Setup for AI Agent
-- This script creates a limited 'readonly_agent' role that can only perform SELECT queries.

-- 1. Create the role with a secure password
-- REPLACE 'strong_password_here' with a real password and add it to your .env as DATABASE_READONLY_URL
-- CREATE ROLE readonly_agent WITH LOGIN PASSWORD 'strong_password_here';

-- 2. Grant usage on the public schema
GRANT USAGE ON SCHEMA public TO readonly_agent;

-- 3. Grant SELECT on all existing tables in the public schema
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_agent;

-- 4. Ensure the role can also read sequences if needed (e.g., for some query types)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO readonly_agent;

-- 5. Automatically grant SELECT on any future tables created in the public schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_agent;

-- 6. Verification: List tables the new role can see
-- SET ROLE readonly_agent;
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- RESET ROLE;
