import { test as setup } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
    // 1. Init Supabase Admin Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase credentials in .env");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const email = 'test_worker_1@hanachan.test';
    const password = 'Password123!';

    console.log(`📡 Authenticating ${email} via Supabase API (Production Grade)...`);

    // 2. Sign In via API
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        throw new Error(`Authentication failed: ${error.message}`);
    }

    if (!data.session) {
        throw new Error('No session returned from Supabase');
    }

    // 2.5 Ensure User exists in public.users table (to satisfy FK constraints)
    await supabase.from('users').upsert({
        id: data.user.id,
        email: data.user.email,
        display_name: data.user.email?.split('@')[0] || 'Test User'
    });

    console.log('✅ Got Session & Synchronized to public.users. Injecting to Cookies & Client...');

    // 3. Inject Session and Cookies
    await page.goto('/');

    const projectRef = supabaseUrl.split('://')[1].split('.')[0];
    console.log(`DEBUG: supabaseUrl=${supabaseUrl}, projectRef=${projectRef}`);
    const tokenKey = `sb-${projectRef}-auth-token`;

    // Construct the cookie value format expected by @supabase/ssr
    // Usually standard JSON string of the session/tokens
    const sessionStr = JSON.stringify(data.session);
    const base64Str = `base64-${Buffer.from(sessionStr).toString('base64')}`;

    // A. Inject into LocalStorage (Client-side Supabase)
    await page.evaluate(({ key, session }) => {
        localStorage.setItem(key, JSON.stringify(session));
    }, { key: tokenKey, session: data.session });

    // B. Inject into Cookies (Server-side middleware)
    await page.context().addCookies([
        {
            name: tokenKey,
            value: base64Str,
            domain: 'localhost',
            path: '/',
            httpOnly: false,
            secure: false,
            sameSite: 'Lax'
        },
        // Legacy fallback
        {
            name: `sb-access-token`,
            value: data.session.access_token,
            domain: 'localhost',
            path: '/',
            httpOnly: false,
            secure: false,
            sameSite: 'Lax'
        }
    ]);

    // 4. Save Storage State
    await page.context().storageState({ path: authFile });

    console.log(`💾 Saved auth state to ${authFile}`);
});
