
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testKeys() {
    console.log("🔍 Testing Supabase Keys...");
    console.log(`URL: ${supabaseUrl}`);

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
        console.error("❌ Missing keys in .env");
        return;
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    try {
        console.log("\n--- Testing Anon Key ---");
        const { data: anonData, error: anonError } = await anonClient.from('knowledge_units').select('count', { count: 'exact', head: true });
        if (anonError) {
            console.error("❌ Anon Key Error:", anonError.message);
        } else {
            console.log("✅ Anon Key is VALID. Access to 'knowledge_units' confirmed.");
        }

        console.log("\n--- Testing Service Role Key ---");
        const { data: serviceData, error: serviceError } = await serviceClient.from('knowledge_units').select('count', { count: 'exact', head: true });
        if (serviceError) {
            console.error("❌ Service Role Key Error:", serviceError.message);
        } else {
            console.log("✅ Service Role Key is VALID.");
        }

    } catch (err: any) {
        console.error("❌ Connection failed:", err.message);
    }
}

testKeys();
