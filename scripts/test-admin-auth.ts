
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAuthWithAdmin() {
    const testId = Math.floor(Math.random() * 10000);
    const testEmail = `tester${testId}@hanachan.io`;
    const testPassword = 'TestPassword123!';

    console.log(`🧪 Testing Auth with Admin Create: ${testEmail}`);

    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: {
            display_name: 'Test Admin User',
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
        }
    });

    if (userError) {
        console.error("❌ Admin Create failed:", userError.message);
        return;
    }

    const userId = userData.user?.id;
    console.log(`✅ User created via Admin! ID: ${userId}`);

    console.log("⏳ Waiting 3 seconds for trigger...");
    await new Promise(resolve => setTimeout(resolve, 3000));

    const { data: publicUser, error: queryError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (queryError) {
        console.error("❌ Failed to find in public.users:", queryError.message);
    } else {
        console.log("🎉 SUCCESS! Trigger worked.");
        console.table(publicUser);
    }
}

testAuthWithAdmin();
