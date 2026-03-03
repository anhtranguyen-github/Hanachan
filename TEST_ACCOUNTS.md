# Permanent Test Accounts for Automation

This document describes the permanent test accounts created for automated testing.

## Overview

Two permanent test accounts are created by the migration:
- `supabase/migrations/20260303_create_permanent_test_accounts.sql`

These accounts have **fixed UUIDs** that never change, making them ideal for automation tests.

## Test Accounts

### 1. Test User (Regular User)

| Field | Value |
|-------|-------|
| **ID** | `a1111111-1111-1111-1111-111111111111` |
| **Email** | `test.user@hanachan.test` |
| **Password** | `TestPassword123!` |
| **Display Name** | `Test User` |
| **Role** | Regular user (no admin privileges) |

### 2. Test Admin (Super Admin)

| Field | Value |
|-------|-------|
| **ID** | `b2222222-2222-2222-2222-222222222222` |
| **Email** | `test.admin@hanachan.test` |
| **Password** | `AdminPassword123!` |
| **Display Name** | `Test Admin` |
| **Role** | `super_admin` (full admin privileges) |

## Usage

### Python (FastAPI Tests)

```python
from fastapi.tests.fixtures.test_accounts import (
    TEST_USER_ID, TEST_USER_EMAIL, TEST_USER_PASSWORD,
    TEST_ADMIN_ID, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD,
    get_test_user_headers, get_test_admin_headers
)

# Use in tests
def test_something(auth_headers):
    # Use pre-built headers
    headers = get_test_user_headers()
    
    # Or reference the IDs directly
    user_id = TEST_USER_ID
```

### TypeScript (Next.js Tests)

```typescript
import { 
  TEST_USER, TEST_ADMIN,
  signInTestUser, signInTestAdmin 
} from '@/tests/fixtures/test-accounts';

// Use in tests
const { data, error } = await signInTestUser(supabase);

// Or reference directly
console.log(TEST_USER.email);    // test.user@hanachan.test
console.log(TEST_ADMIN.email);   // test.admin@hanachan.test
```

### Playwright E2E Tests

```typescript
import { loginAsTestUser, loginAsTestAdmin } from '@/tests/fixtures/test-accounts';

// In your test
test('user can access dashboard', async ({ page }) => {
  await loginAsTestUser(page, 'http://localhost:3000');
  await expect(page).toHaveURL('/dashboard');
});
```

### Direct SQL

```sql
-- Get test user
SELECT * FROM auth.users WHERE id = 'a1111111-1111-1111-1111-111111111111';

-- Get test admin with role
SELECT u.*, ar.role 
FROM auth.users u
JOIN public.admin_roles ar ON u.id = ar.user_id
WHERE u.id = 'b2222222-2222-2222-2222-222222222222';
```

## Creating the Test Accounts

Choose one of these methods to create the test accounts:

### Method 1: Using the JavaScript Script (Recommended)

Run the provided script (requires Supabase to be running):

```bash
# Set your Supabase service role key
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Run the script
node scripts/create-test-accounts.js

# Or using pnpm
pnpm run test:accounts:create
```

### Method 2: Using Supabase CLI

Apply the migration directly:

```bash
# Reset database with all migrations
supabase db reset

# Or apply just this migration
supabase migration up
```

### Method 3: Using Supabase Studio

1. Open Supabase Studio at `http://localhost:54423` (local) or your project URL
2. Go to the SQL Editor
3. Copy the contents of `supabase/migrations/20260303_create_permanent_test_accounts.sql`
4. Run the SQL

### Method 4: Using the Supabase API

Create users programmatically using the Supabase Admin API:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54421',
  'your_service_role_key'
);

// Create test user
await supabase.auth.admin.createUser({
  id: 'a1111111-1111-1111-1111-111111111111',
  email: 'test.user@hanachan.test',
  password: 'TestPassword123!',
  email_confirm: true,
});

// Create test admin
await supabase.auth.admin.createUser({
  id: 'b2222222-2222-2222-2222-222222222222',
  email: 'test.admin@hanachan.test',
  password: 'AdminPassword123!',
  email_confirm: true,
});
```

## Important Notes

1. **Fixed UUIDs**: The UUIDs are hardcoded and will never change. Use them confidently in your tests.
2. **Idempotent**: The migration handles re-runs gracefully (deletes and recreates accounts).
3. **Test Domain**: The email addresses use `@hanachan.test` domain, which is reserved for testing.
4. **Password Hashing**: Passwords are bcrypt-hashed in the database.
5. **Email Confirmed**: Both accounts have `email_confirmed_at` set, so no email verification is needed.

## Security Warning

⚠️ **Never use these accounts in production environments!** These accounts are for testing only and have known credentials.

## Troubleshooting

### Accounts not found

If the accounts don't exist, run the migration:

```bash
supabase migration up
```

### Password doesn't work

The passwords are bcrypt-hashed. The plaintext passwords are:
- Test User: `TestPassword123!`
- Test Admin: `AdminPassword123!`

### Admin permissions not working

Check the admin_roles table:

```sql
SELECT * FROM public.admin_roles 
WHERE user_id = 'b2222222-2222-2222-2222-222222222222';
```

The `is_active` should be `true` and `role` should be `super_admin`.
