/**
 * Permanent Test Accounts for Automation Testing
 * 
 * These accounts are created by migration:
 * supabase/migrations/20260303_create_permanent_test_accounts.sql
 * 
 * They will always exist after running migrations and can be used
 * for integration tests, e2e tests, and automation.
 */

// ==========================================
// TEST ACCOUNT CONSTANTS
// ==========================================

/** Test User Account (Regular User) */
export const TEST_USER = {
  id: 'a1111111-1111-1111-1111-111111111111',
  email: 'test.user@hanachan.test',
  password: 'TestPassword123!',
  displayName: 'Test User',
} as const;

/** Test Admin Account (Super Admin) */
export const TEST_ADMIN = {
  id: 'b2222222-2222-2222-2222-222222222222',
  email: 'test.admin@hanachan.test',
  password: 'AdminPassword123!',
  displayName: 'Test Admin',
  role: 'super_admin',
} as const;

/** All test accounts for easy iteration */
export const ALL_TEST_ACCOUNTS = [TEST_USER, TEST_ADMIN] as const;

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface TestAccount {
  id: string;
  email: string;
  password: string;
  displayName: string;
  role?: string;
}

// ==========================================
// SUPABASE AUTH HELPERS
// ==========================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Sign in the test user using Supabase auth
 */
export async function signInTestUser(supabase: SupabaseClient) {
  return await supabase.auth.signInWithPassword({
    email: TEST_USER.email,
    password: TEST_USER.password,
  });
}

/**
 * Sign in the test admin using Supabase auth
 */
export async function signInTestAdmin(supabase: SupabaseClient) {
  return await supabase.auth.signInWithPassword({
    email: TEST_ADMIN.email,
    password: TEST_ADMIN.password,
  });
}

/**
 * Get authenticated Supabase client for test user
 */
export async function getAuthenticatedUserClient(supabaseUrl: string, supabaseKey: string): Promise<SupabaseClient> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { error } = await signInTestUser(supabase);
  if (error) throw error;
  return supabase;
}

/**
 * Get authenticated Supabase client for test admin
 */
export async function getAuthenticatedAdminClient(supabaseUrl: string, supabaseKey: string): Promise<SupabaseClient> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { error } = await signInTestAdmin(supabase);
  if (error) throw error;
  return supabase;
}

// ==========================================
// PLAYWRIGHT / E2E HELPERS
// ==========================================

/**
 * Login as test user in a Playwright page
 */
export async function loginAsTestUser(page: any, baseUrl: string): Promise<void> {
  await page.goto(`${baseUrl}/login`);
  await page.fill('[data-testid="email-input"]', TEST_USER.email);
  await page.fill('[data-testid="password-input"]', TEST_USER.password);
  await page.click('[data-testid="login-button"]');
  await page.waitForNavigation();
}

/**
 * Login as test admin in a Playwright page
 */
export async function loginAsTestAdmin(page: any, baseUrl: string): Promise<void> {
  await page.goto(`${baseUrl}/login`);
  await page.fill('[data-testid="email-input"]', TEST_ADMIN.email);
  await page.fill('[data-testid="password-input"]', TEST_ADMIN.password);
  await page.click('[data-testid="login-button"]');
  await page.waitForNavigation();
}

// ==========================================
// MOCK DATA HELPERS
// ==========================================

/**
 * Get mock JWT token payload for test user
 */
export function getTestUserJwtPayload() {
  return {
    sub: TEST_USER.id,
    email: TEST_USER.email,
    role: 'authenticated',
    aud: 'authenticated',
  };
}

/**
 * Get mock JWT token payload for test admin
 */
export function getTestAdminJwtPayload() {
  return {
    sub: TEST_ADMIN.id,
    email: TEST_ADMIN.email,
    role: 'super_admin',
    aud: 'authenticated',
  };
}

// ==========================================
// DEBUG HELPERS
// ==========================================

/**
 * Print test account info to console
 */
export function printTestAccounts(): void {
  // eslint-disable-next-line no-console
  console.log('='.repeat(60));
  // eslint-disable-next-line no-console
  console.log('PERMANENT TEST ACCOUNTS');
  // eslint-disable-next-line no-console
  console.log('='.repeat(60));
  // eslint-disable-next-line no-console
  console.log();
  // eslint-disable-next-line no-console
  console.log('Test User:');
  // eslint-disable-next-line no-console
  console.log(`  ID:       ${TEST_USER.id}`);
  // eslint-disable-next-line no-console
  console.log(`  Email:    ${TEST_USER.email}`);
  // eslint-disable-next-line no-console
  console.log(`  Password: ${TEST_USER.password}`);
  // eslint-disable-next-line no-console
  console.log();
  // eslint-disable-next-line no-console
  console.log('Test Admin:');
  // eslint-disable-next-line no-console
  console.log(`  ID:       ${TEST_ADMIN.id}`);
  // eslint-disable-next-line no-console
  console.log(`  Email:    ${TEST_ADMIN.email}`);
  // eslint-disable-next-line no-console
  console.log(`  Password: ${TEST_ADMIN.password}`);
  // eslint-disable-next-line no-console
  console.log(`  Role:     ${TEST_ADMIN.role}`);
  // eslint-disable-next-line no-console
  console.log();
  // eslint-disable-next-line no-console
  console.log('='.repeat(60));
}
