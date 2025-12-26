
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
    console.log("Checking Admin Access...");
    const email = `test_admin_${Date.now()}@test.com`;
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: 'password123',
        email_confirm: true
    });

    if (error) {
        console.error("Error creating user:", error);
    } else {
        console.log("User created successfully:", data.user?.id);
        // Cleanup
        await supabase.auth.admin.deleteUser(data.user!.id);
        console.log("User deleted.");
    }
}

check();
