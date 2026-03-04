import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
}

// Browser client for cookie-syncing with @supabase/ssr middleware
export const supabase = typeof window !== 'undefined'
    ? createBrowserClient(supabaseUrl, supabaseKey)
    : createClient(supabaseUrl, supabaseKey)


