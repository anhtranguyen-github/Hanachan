const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54421';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const TEST_USERS = [
    { email: 'test_worker_1@hanachan.test', password: 'Password123!', name: 'Test Worker 1', level: 1 },
    { email: 'test_worker_2@hanachan.test', password: 'Password123!', name: 'Test Worker 2', level: 5 },
    { email: 'test_worker_3@hanachan.test', password: 'Password123!', name: 'Test Worker 3', level: 10 }
];

async function seedUsers() {
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    for (const user of TEST_USERS) {
        console.log(`Seeding user: ${user.email}...`);

        let userId;
        const existing = users.find(u => u.email === user.email);

        if (existing) {
            userId = existing.id;
            console.log(`Auth user ${user.email} already exists. ID: ${userId}. Updating...`);
            await supabase.auth.admin.updateUserById(userId, {
                password: user.password,
                user_metadata: { display_name: user.name }
            });
        } else {
            console.log(`Creating new auth user: ${user.email}...`);
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: user.email,
                password: user.password,
                user_metadata: { display_name: user.name },
                email_confirm: true
            });

            if (authError) {
                console.error(`Error creating auth user ${user.email}:`, authError);
                continue;
            }
            userId = authData.user.id;
        }

        // 2. Ensure Profile exists in 'users' table
        // Based on column check: [ 'id', 'display_name', 'level', 'last_activity_at', 'created_at' ]
        const { error: profileError } = await supabase
            .from('users')
            .upsert({
                id: userId,
                display_name: user.name,
                level: user.level
            }, { onConflict: 'id' });

        if (profileError) {
            console.error(`Error seeding profile for ${user.email}:`, profileError);
        } else {
            console.log(`Profile for ${user.email} seeded successfully.`);
        }
    }
}

seedUsers().catch(console.error);
