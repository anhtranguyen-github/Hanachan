import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixUser() {
    const userId = 'e7e546ad-5626-4042-8193-deb69bdd643e';

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    console.log('Current user data:', data);
    console.log('Error:', error);

    if (!data) {
        console.log('User not found, creating...');
        const { error: insertError } = await supabase.from('users').upsert({
            id: userId,
            display_name: 'Test User',
            level: 1
        });
        console.log('Insert error:', insertError);
        console.log('User created!');
    } else {
        console.log('User already exists');
    }
}

fixUser().then(() => process.exit(0));
