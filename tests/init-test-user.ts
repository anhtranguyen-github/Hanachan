
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function initTestUsers() {
    const users = [
        { email: 'test_worker_1@hanachan.test', password: 'Password123!', display_name: 'Test Worker 1' },
        { email: 'test_worker_2@hanachan.test', password: 'Password123!', display_name: 'Test Worker 2' },
        { email: 'test_worker_3@hanachan.test', password: 'Password123!', display_name: 'Test Worker 3' },
        { email: 'test_worker_4@hanachan.test', password: 'Password123!', display_name: 'Test Worker 4' },
    ];

    console.log('🚀 Initializing test users...');

    for (const u of users) {
        // Create user in Auth
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email: u.email,
            password: u.password,
            email_confirm: true,
            user_metadata: { display_name: u.display_name }
        });

        if (userError) {
            if (userError.message.includes('already exists')) {
                console.log(`✅ User ${u.email} already exists.`);
            } else {
                console.error(`❌ Error creating user ${u.email}:`, userError.message);
                continue;
            }
        } else {
            console.log(`✨ Created user ${u.email}`);
        }

        // Get the ID (either from creation or by searching)
        let userId = userData?.user?.id;
        if (!userId) {
            const { data: searchData } = await supabaseAdmin.auth.admin.listUsers();
            userId = searchData.users.find(user => user.email === u.email)?.id;
        }

        if (userId) {
            // Upsert into public.users table
            const { error: profileError } = await supabaseAdmin
                .from('users')
                .upsert({
                    id: userId,
                    email: u.email,
                    display_name: u.display_name
                });

            if (profileError) {
                console.error(`❌ Error upserting profile for ${u.email}:`, profileError.message);
            }
        }
    }

    console.log('✅ Test users ready.');
}

initTestUsers().catch(console.error);
