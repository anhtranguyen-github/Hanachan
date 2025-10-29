
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedTestReviews() {
    // 1. Get the user we just created (the latest one)
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .order('created_at', { ascending: false })
        .limit(1);

    if (userError || !users || users.length === 0) {
        console.error("No users found.");
        return;
    }
    const userId = users[0].id;
    console.log(`Seeding for user: ${users[0].email} (ID: ${userId})`);

    // 2. Get some Knowledge Units
    const { data: kus, error: kuError } = await supabase.from('knowledge_units').select('id').limit(10);
    if (kuError || !kus) {
        console.error("No Knowledge Units found.");
        return;
    }

    // 3. Seed learning states as "Due" (set next_review to past)
    const states = kus.map(ku => ({
        user_id: userId,
        ku_id: ku.id,
        state: 'New',
        stability: 0,
        difficulty: 0,
        next_review: new Date(Date.now() - 1000).toISOString(), // 1 second ago
        reps: 0,
        lapses: 0
    }));

    const { error: upsertError } = await supabase
        .from('user_learning_states')
        .upsert(states, { onConflict: 'user_id, ku_id' });

    if (upsertError) {
        console.error("Error seeding learning states:", upsertError.message);
    } else {
        console.log(`✅ Successfully seeded ${kus.length} cards for ${users[0].email}`);
    }
}

seedTestReviews();
