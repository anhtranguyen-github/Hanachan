import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/env';

const supabaseUrl = SUPABASE_URL;
const supabaseKey = SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in config");
}

// Browser client for cookie-syncing with @supabase/ssr middleware
export const supabase = typeof window !== 'undefined'
    ? createBrowserClient(supabaseUrl, supabaseKey)
    : createClient(supabaseUrl, supabaseKey)


