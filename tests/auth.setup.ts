import { test as setup, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
    // 1. Create/Ensure Test User via Admin API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase URL or Service Role Key missing in environment variables');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    const email = 'e2e_global_user@hanachan.ai';
    const password = 'testpassword123';

    // Ensure user exists
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const existingUser = users.find(u => u.email === email);

    if (!existingUser) {
        const { error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: 'E2E Global User' }
        });
        if (createError) throw createError;
    }

    // 2. Perform UI Login
    await page.goto('/auth/signin');

    // Check if redirected (already logged in?)
    if (page.url().includes('dashboard')) {
        console.log('Already logged in!');
    } else {
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);

        const submitBtn = page.getByRole('button', { name: "Sign In" });

        // Use Promise.all to avoid race conditions as requested
        await Promise.all([
            page.waitForURL(/\/(dashboard|decks)/, { timeout: 15000 }),
            submitBtn.click({ force: true })
        ]);
    }

    // 3. Verify success and stable session
    await expect(page).toHaveURL(/\/(dashboard|decks)/);

    // Wait for network to be idle to ensure Supabase tokens are fully persisted in cookies/localStorage
    await page.waitForLoadState('networkidle');

    // Check for a characteristic element of the authenticated app (e.g., Matrix title or a user icon)
    // This confirms the UI has successfully hydrated with the auth state
    await expect(page.locator('h1')).toBeVisible();

    // Final safety: ensure Supabase cookie is actually present before saving
    await page.waitForFunction(() => {
        return document.cookie.split(';').some(c => c.trim().startsWith('sb-') && c.includes('-auth-token'));
    });

    // 4. Save state
    // Ensure directory exists
    const dir = path.dirname(authFile);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    await page.context().storageState({ path: authFile });
});
