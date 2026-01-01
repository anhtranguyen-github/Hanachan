
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function finalCheck() {
    const { data: user } = await supabase.from('users').select('id').limit(1).single();
    const { data: ku } = await supabase.from('knowledge_units').select('slug').limit(1).single();

    const possible = ['new', 'learning', 'review', 'relearning', 'mastered', 'burned', 'suspended', 'locked', 'known', 'mastery'];
    const results = [];

    for (const s of possible) {
        const { error } = await supabase.from('user_learning_states').upsert({ user_id: user.id, ku_id: ku.slug, state: s });
        if (!error || !error.message.includes('enum')) {
            results.push(s);
        }
    }
    console.log('FINAL_ENUM_LIST:', results);
}
finalCheck();
