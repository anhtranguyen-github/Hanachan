import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    const { data, error } = await supabase
        .from('lesson_batches')
        .select('*')
        .limit(1);

    if (data && data.length > 0) {
        console.log('Columns in lesson_batches:', Object.keys(data[0]));
    }
}

checkColumns().catch(console.error);
