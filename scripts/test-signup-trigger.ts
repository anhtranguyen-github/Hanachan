
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAuthTrigger() {
    const testId = Math.floor(Math.random() * 10000);
    const testEmail = `tester${testId}@hanachan.io`;
    const testPassword = 'TestPassword123!';
    const testName = 'Test User';

    console.log(`🧪 Testing Auth Trigger with email: ${testEmail}`);

    // 1. Sign up user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
            data: {
                display_name: testName,
                avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Test'
            }
        }
    });

    if (signUpError) {
        console.error("❌ Sign Up failed:", signUpError.message);
        return;
    }

    const userId = signUpData.user?.id;
    console.log(`✅ Sign Up successful! User ID: ${userId}`);

    // 2. Wait for trigger to fire (Supabase triggers are near-instant)
    console.log("⏳ Waiting 3 seconds for trigger...");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Check public.users table
    const { data: publicUser, error: queryError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (queryError) {
        console.error("❌ Failed to find user in public.users:", queryError.message);
        console.log("ℹ️ This usually means the handle_new_user() trigger in 10_auth_logic.sql hasn't been run on the Supabase SQL Editor yet.");
    } else {
        console.log("🎉 SUCCESS! Trigger worked perfectly.");
        console.table(publicUser);
    }

    // Cleanup if needed (optional)
    // await supabase.auth.admin.deleteUser(userId);
}

testAuthTrigger();
