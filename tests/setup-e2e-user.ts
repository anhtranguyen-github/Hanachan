
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase configuration");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function setup() {
    const email = 'test_worker_1@hanachan.test';
    const password = 'Password123!';

    console.log(`Ensuring test user ${email} exists...`);

    // Check if user exists in auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error("Failed to list users:", listError);
        return;
    }

    const existingUser = users.find(u => u.email === email);

    if (!existingUser) {
        console.log("Creating user...");
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { display_name: 'Test Worker' }
        });

        if (error) {
            console.error("Failed to create user:", error);
        } else {
            console.log("User created successfully:", data.user.id);
        }
    } else {
        console.log("User already exists:", existingUser.id);

        // Reset password just in case it was changed
        const { error: resetError } = await supabase.auth.admin.updateUserById(existingUser.id, {
            password: password
        });
        if (resetError) console.error("Failed to reset password:", resetError);
        else console.log("Password reset successful.");
    }

    const userId = existingUser ? existingUser.id : (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === email)?.id;
    if (!userId) return;

    console.log("Seeding learning states for test user...");
    // Get some KUs to link
    const { data: kus } = await supabase.from('knowledge_units').select('id').limit(10);

    if (kus) {
        for (const ku of kus) {
            await supabase.from('user_learning_states').upsert({
                user_id: userId,
                ku_id: ku.id,
                state: 'learning',
                reps: 1,
                lapses: 0,
                stability: 1,
                difficulty: 5,
                next_review: new Date(Date.now() - 86400000).toISOString(), // Yesterday (due)
                last_review: new Date().toISOString()
            }, { onConflict: 'user_id,ku_id' });
        }
        console.log("Seeded 10 items as DUES.");
    }
}

setup();
