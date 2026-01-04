
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createFixedAccount() {
    const email = 'user@hanachan.io';
    const password = 'password123';

    console.log(`🚀 Creating/Updating fixed account: ${email}`);

    // Try to create the user
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            display_name: 'Hana User'
        }
    });

    if (error) {
        if (error.message.includes('already registered')) {
            console.log('ℹ️ Account already exists. Resetting password just in case...');
            // Optional: reset password if already exists to be sure
            const { data: list } = await supabase.auth.admin.listUsers();
            const existingUser = list.users.find(u => u.email === email);
            if (existingUser) {
                await supabase.auth.admin.updateUserById(existingUser.id, { password });
                console.log('✅ Password reset to password123');
            }
        } else {
            console.error('❌ Error:', error.message);
        }
    } else {
        console.log('✅ Account created successfully!');
    }

    console.log(`\n---------------------------------`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`---------------------------------`);
}

createFixedAccount();
