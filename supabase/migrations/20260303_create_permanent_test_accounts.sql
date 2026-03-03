-- ==========================================================
-- MIGRATION: Create Permanent Test Accounts for Automation
-- Purpose: Create fixed test user accounts that always work
--          for automated testing (1 regular user, 1 admin)
-- ==========================================================

-- Fixed UUIDs for test accounts (never change these!)
-- These UUIDs are deterministic and will persist across all environments
-- Use these IDs in your automation tests

-- Test User Account
-- Email: test.user@hanachan.test
-- Password: TestPassword123!
-- UUID: a1111111-1111-1111-1111-111111111111

-- Test Admin Account  
-- Email: test.admin@hanachan.test
-- Password: AdminPassword123!
-- UUID: b2222222-2222-2222-2222-222222222222

-- Note: Passwords are bcrypt hashed
-- TestPassword123! = $2a$10$K8ZpRDVxJzKQjjG1DHKJPuT0pHVX7Iq0gBdXGvLr5QxPmH.hXjO8O
-- AdminPassword123! = $2a$10$L9ZqSEWxKzLRjjG2EILQWvU1qIWY8Jr1hCYwMs6r6RxQnI.iYkP9P

DO $$
DECLARE
    test_user_id UUID := 'a1111111-1111-1111-1111-111111111111';
    test_admin_id UUID := 'b2222222-2222-2222-2222-222222222222';
    test_user_email TEXT := 'test.user@hanachan.test';
    test_admin_email TEXT := 'test.admin@hanachan.test';
BEGIN
    -- ==========================================
    -- CREATE TEST USER ACCOUNT
    -- ==========================================
    
    -- Delete existing test user if exists (for idempotency)
    DELETE FROM auth.users WHERE id = test_user_id;
    DELETE FROM public.users WHERE id = test_user_id;
    
    -- Insert into Supabase auth.users
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_token,
        recovery_token,
        email_change,
        new_email,
        new_phone,
        phone,
        phone_confirmed_at,
        confirmation_sent_at,
        recovery_sent_at,
        email_change_sent_at,
        phone_change_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone_change,
        email_change_token_current,
        email_change_token_new,
        reauthentication_token,
        is_sso_user,
        deleted_at
    ) VALUES (
        test_user_id,
        test_user_email,
        '$2a$10$K8ZpRDVxJzKQjjG1DHKJPuT0pHVX7Iq0gBdXGvLr5QxPmH.hXjO8O', -- TestPassword123!
        NOW(),
        '',
        '',
        '',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"display_name": "Test User"}'::jsonb,
        FALSE,
        NOW(),
        NOW(),
        '',
        '',
        '',
        '',
        FALSE,
        NULL
    );
    
    -- Insert into public.users
    INSERT INTO public.users (
        id,
        display_name,
        level,
        last_activity_at,
        created_at
    ) VALUES (
        test_user_id,
        'Test User',
        1,
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Created test user: % (ID: %)', test_user_email, test_user_id;
    
    -- ==========================================
    -- CREATE TEST ADMIN ACCOUNT
    -- ==========================================
    
    -- Delete existing test admin if exists (for idempotency)
    DELETE FROM auth.users WHERE id = test_admin_id;
    DELETE FROM public.users WHERE id = test_admin_id;
    DELETE FROM public.admin_roles WHERE user_id = test_admin_id;
    
    -- Insert into Supabase auth.users
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_token,
        recovery_token,
        email_change,
        new_email,
        new_phone,
        phone,
        phone_confirmed_at,
        confirmation_sent_at,
        recovery_sent_at,
        email_change_token_current,
        email_change_token_new,
        reauthentication_token,
        email_change_sent_at,
        phone_change_sent_at,
        phone_change,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        is_sso_user,
        deleted_at
    ) VALUES (
        test_admin_id,
        test_admin_email,
        '$2a$10$L9ZqSEWxKzLRjjG2EILQWvU1qIWY8Jr1hCYwMs6r6RxQnI.iYkP9P', -- AdminPassword123!
        NOW(),
        '',
        '',
        '',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        '',
        '',
        '',
        NULL,
        NULL,
        '',
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"display_name": "Test Admin"}'::jsonb,
        FALSE,
        NOW(),
        NOW(),
        FALSE,
        NULL
    );
    
    -- Insert into public.users
    INSERT INTO public.users (
        id,
        display_name,
        level,
        last_activity_at,
        created_at
    ) VALUES (
        test_admin_id,
        'Test Admin',
        1,
        NOW(),
        NOW()
    );
    
    -- Insert into admin_roles with super_admin privileges
    INSERT INTO public.admin_roles (
        user_id,
        role,
        permissions,
        granted_by,
        granted_at,
        revoked_at,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        test_admin_id,
        'super_admin',
        ARRAY[
            'view_users', 'edit_users', 'suspend_users',
            'view_costs', 'manage_cost_limits',
            'view_audit_logs', 'view_system_health',
            'manage_rate_limits', 'view_ai_traces',
            'manage_ai_config', 'view_abuse_alerts',
            'manage_abuse_alerts', 'manage_admins'
        ],
        test_admin_id,  -- Self-granted for test account
        NOW(),
        NULL,
        TRUE,
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Created test admin: % (ID: %)', test_admin_email, test_admin_id;
    
END $$;

-- ==========================================================
-- DOCUMENTATION
-- ==========================================================
COMMENT ON TABLE auth.users IS 'Test accounts created by 20260303_create_permanent_test_accounts.sql:
- test.user@hanachan.test / TestPassword123! / ID: a1111111-1111-1111-1111-111111111111
- test.admin@hanachan.test / AdminPassword123! / ID: b2222222-2222-2222-2222-222222222222';
