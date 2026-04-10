/**
 * Create Test Accounts Script
 * 
 * This script creates the permanent test accounts in Supabase.
 * Run this after your Supabase instance is running.
 * 
 * Usage:
 *   node scripts/create-test-accounts.js
 * 
 * Requirements:
 *   - Supabase must be running
 *   - SERVICE_ROLE_KEY must be set in environment
 */

const { createClient } = require('@supabase/supabase-js');

// Test account credentials
const TEST_USER = {
  id: 'a1111111-1111-1111-1111-111111111111',
  email: 'test.user@hanachan.test',
  password: 'TestPassword123!',
  displayName: 'Test User',
};

const TEST_ADMIN = {
  id: 'b2222222-2222-2222-2222-222222222222',
  email: 'test.admin@hanachan.test',
  password: 'AdminPassword123!',
  displayName: 'Test Admin',
  role: 'super_admin',
};

// Get Supabase credentials from environment or use defaults for local dev
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://fcrrepkexghzchohbsrj.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY environment variable is required');
  console.error('');
  console.error('Please set one of these environment variables:');
  console.error('  export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.error('');
  console.error('Or run with the key:');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/create-test-accounts.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createTestUser() {
  console.log(`📝 Creating test user: ${TEST_USER.email}`);
  
  // Delete existing user if exists
  const { data: existingUser } = await supabase.auth.admin.getUserById(TEST_USER.id);
  if (existingUser?.user) {
    console.log('   User exists, deleting...');
    await supabase.auth.admin.deleteUser(TEST_USER.id);
  }
  
  // Create user with specific UUID
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    id: TEST_USER.id,
    email: TEST_USER.email,
    password: TEST_USER.password,
    email_confirm: true,
    user_metadata: {
      display_name: TEST_USER.displayName,
    },
  });
  
  if (userError) {
    console.error(`❌ Failed to create test user: ${userError.message}`);
    return false;
  }
  
  // Create public.users entry
  const { error: profileError } = await supabase
    .from('users')
    .upsert({
      id: TEST_USER.id,
      display_name: TEST_USER.displayName,
      level: 1,
      last_activity_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });
  
  if (profileError) {
    console.error(`❌ Failed to create user profile: ${profileError.message}`);
    return false;
  }
  
  console.log(`✅ Test user created: ${TEST_USER.id}`);
  return true;
}

async function createTestAdmin() {
  console.log(`📝 Creating test admin: ${TEST_ADMIN.email}`);
  
  // Delete existing user if exists
  const { data: existingUser } = await supabase.auth.admin.getUserById(TEST_ADMIN.id);
  if (existingUser?.user) {
    console.log('   Admin exists, deleting...');
    await supabase.auth.admin.deleteUser(TEST_ADMIN.id);
  }
  
  // Create admin user with specific UUID
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    id: TEST_ADMIN.id,
    email: TEST_ADMIN.email,
    password: TEST_ADMIN.password,
    email_confirm: true,
    user_metadata: {
      display_name: TEST_ADMIN.displayName,
    },
  });
  
  if (userError) {
    console.error(`❌ Failed to create test admin: ${userError.message}`);
    return false;
  }
  
  // Create public.users entry
  const { error: profileError } = await supabase
    .from('users')
    .upsert({
      id: TEST_ADMIN.id,
      display_name: TEST_ADMIN.displayName,
      level: 1,
      last_activity_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });
  
  if (profileError) {
    console.error(`❌ Failed to create admin profile: ${profileError.message}`);
    return false;
  }
  
  // Create admin role entry
  const { error: roleError } = await supabase
    .from('admin_roles')
    .upsert({
      user_id: TEST_ADMIN.id,
      role: TEST_ADMIN.role,
      permissions: [
        'view_users', 'edit_users', 'suspend_users',
        'view_costs', 'manage_cost_limits',
        'view_audit_logs', 'view_system_health',
        'manage_rate_limits', 'view_ai_traces',
        'manage_ai_config', 'view_abuse_alerts',
        'manage_abuse_alerts', 'manage_admins'
      ],
      granted_by: TEST_ADMIN.id,
      granted_at: new Date().toISOString(),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  
  if (roleError) {
    console.error(`❌ Failed to create admin role: ${roleError.message}`);
    return false;
  }
  
  console.log(`✅ Test admin created: ${TEST_ADMIN.id}`);
  return true;
}

async function verifyAccounts() {
  console.log('\n🔍 Verifying accounts...');
  
  // Test login as user
  const { data: userLogin, error: userLoginError } = await supabase.auth.signInWithPassword({
    email: TEST_USER.email,
    password: TEST_USER.password,
  });
  
  if (userLoginError) {
    console.error(`❌ Test user login failed: ${userLoginError.message}`);
  } else {
    console.log('✅ Test user login works!');
  }
  
  // Test login as admin
  const { data: adminLogin, error: adminLoginError } = await supabase.auth.signInWithPassword({
    email: TEST_ADMIN.email,
    password: TEST_ADMIN.password,
  });
  
  if (adminLoginError) {
    console.error(`❌ Test admin login failed: ${adminLoginError.message}`);
  } else {
    console.log('✅ Test admin login works!');
  }
}

async function main() {
  console.log('🚀 Creating Permanent Test Accounts');
  console.log('=====================================\n');
  console.log(`Supabase URL: ${SUPABASE_URL}\n`);
  
  try {
    const userCreated = await createTestUser();
    const adminCreated = await createTestAdmin();
    
    if (userCreated && adminCreated) {
      await verifyAccounts();
      
      console.log('\n=====================================');
      console.log('✅ All test accounts created successfully!');
      console.log('\nTest Accounts:');
      console.log(`  User:  ${TEST_USER.email} / ${TEST_USER.password}`);
      console.log(`  Admin: ${TEST_ADMIN.email} / ${TEST_ADMIN.password}`);
      console.log('\nUse these for your automation tests!');
    } else {
      console.log('\n⚠️  Some accounts could not be created');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
