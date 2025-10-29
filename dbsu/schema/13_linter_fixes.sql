-- =========================================================
-- SUPABASE LINTER FIXES: SCHEMA & FUNCTION SECURITY
-- Addresses: 0011_function_search_path_mutable, 0014_extension_in_public
-- =========================================================

-- 1. Move Extensions to a dedicated schema (Best Practice)
-- This prevents cluttering the public schema and improves security.
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION "pg_trgm" SET SCHEMA extensions;

-- 2. Secure Function search_path
-- By explicitly setting search_path, we prevent search path hijacking attacks.
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- 3. Additional Security: Revoke public execution of sensitive functions if any 
-- (Not needed for handle_new_user as it's a trigger function, but good practice)
-- REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
