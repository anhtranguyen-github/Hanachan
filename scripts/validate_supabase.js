
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Load ENV
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        // Strip quotes if present
        let val = match[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        env[match[1].trim()] = val;
    }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Error: Missing Supabase credentials in .env');
    process.exit(1);
}

console.log(`Connecting to Supabase: ${SUPABASE_URL}`);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

async function validate() {
    console.log('\n--- VALIDATING SUPABASE DATA (Raw Fetch) ---\n');

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/knowledge_units?limit=1`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });

        if (response.status === 404) {
            throw new Error("Table 'knowledge_units' NOT FOUND. Please run schema migration.");
        }

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP ${response.status}: ${text}`);
        }

        const data = await response.json();
        console.log(`✅ Connection Successful. Table 'knowledge_units' exists.`);
        console.log(`Rows found: ${data.length} (Sample check)`);

    } catch (err) {
        console.error('❌ VALIDATION FAILED:', err.message);
    }
}

validate();
