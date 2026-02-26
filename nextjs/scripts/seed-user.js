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

async function seedUser() {
    const email = 'test@hanachan.app';
    const password = 'password123';
    const fullName = 'Test User';

    console.log(`Seeding user: ${email}...`);

    // Check if user exists
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    const existingUser = users.users.find(u => u.email === email);

    if (existingUser) {
        console.log('User already exists, updating password...');
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: password, user_metadata: { display_name: fullName } }
        );
        if (updateError) console.error('Error updating user:', updateError);
        else console.log('User updated successfully');
    } else {
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            user_metadata: { display_name: fullName },
            email_confirm: true
        });
        if (createError) console.error('Error creating user:', createError);
        else console.log('User created successfully:', newUser.user.id);
    }
}

seedUser();
