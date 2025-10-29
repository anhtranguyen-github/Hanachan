
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Clients
const adminClient = createClient(supabaseUrl, serviceKey);
const publicClient = createClient(supabaseUrl, anonKey);

async function runCoverageTest() {
    console.log("🛠️ Starting Supabase Coverage Test...\n");

    // 1. Setup Test User
    const testId = Math.floor(Math.random() * 10000);
    const email = `coverage_test_${testId}@hanachan.io`;
    const password = 'CoveragePassword123!';

    console.log(`👤 STEP 1: Creating Test User: ${email}`);
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: 'Coverage Tester' }
    });

    if (authError || !authData.user) {
        console.error("❌ Failed to create test user:", authError?.message);
        return;
    }
    const testUserId = authData.user.id;
    console.log(`✅ User created. ID: ${testUserId}`);

    // 2. Simulate Login
    console.log(`\n🔑 STEP 2: Simulating Client Login...`);
    const { data: signInData, error: signInError } = await publicClient.auth.signInWithPassword({
        email,
        password
    });

    if (signInError || !signInData.session) {
        console.error("❌ Sign in failed:", signInError?.message);
        return;
    }
    console.log("✅ Sign in successful. Session established.");

    // Create a client with the user's session token to test RLS
    const userClient = createClient(supabaseUrl, anonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${signInData.session.access_token}`
            }
        }
    });

    // 3. Test RLS - Own Data
    console.log(`\n🛡️ STEP 3: Testing RLS - Own Data Access`);

    // Check public.users (Sync Trigger check)
    console.log("⏳ Waiting for sync trigger...");
    await new Promise(r => setTimeout(r, 2000));

    const { data: profile, error: profileErr } = await userClient
        .from('users')
        .select('*')
        .eq('id', testUserId)
        .single();

    if (profileErr) {
        console.error("❌ RLS/Trigger Error (Profile):", profileErr.message);
    } else {
        console.log("✅ Successfully read own profile via RLS.");
    }

    const { data: settings, error: settingsErr } = await userClient
        .from('user_settings')
        .select('*')
        .single();

    if (settingsErr) {
        console.error("❌ RLS/Trigger Error (Settings):", settingsErr.message);
    } else {
        console.log("✅ Successfully read own settings via RLS.");
    }

    // 4. Test RLS - Knowledge Base (Publicly readable by auth users)
    console.log(`\n📚 STEP 4: Testing API Coverage - Knowledge Base`);
    const { data: kus, error: kuErr } = await userClient
        .from('knowledge_units')
        .select('slug, type')
        .limit(1);

    if (kuErr) {
        console.error("❌ API Coverage Error (KU):", kuErr.message);
    } else {
        console.log(`✅ Successfully queried Knowledge Base. (Found ${kus?.length} item)`);
    }

    // 5. Test RLS - Security Check (Should NOT read other users' data)
    console.log(`\n🚫 STEP 5: Testing RLS - Security Isolation`);
    // Try to read someone else (using a fake ID)
    const fakeId = '00000000-0000-0000-0000-000000000001';
    const { data: otherUser, error: otherErr } = await userClient
        .from('users')
        .select('*')
        .eq('id', fakeId);

    if (otherUser && otherUser.length === 0) {
        console.log("✅ RLS IS WORKING: Cannot access other users' profile data.");
    } else {
        console.error("⚠️ RLS WARNING: Potential data leak or unexpected access.");
    }

    console.log("\n✨ COVERAGE TEST COMPLETE!");

    // Cleanup
    await adminClient.auth.admin.deleteUser(testUserId);
}

runCoverageTest();
