
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Verify critical keys
if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️  OPENAI_API_KEY is missing in test environment!");
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn("⚠️  NEXT_PUBLIC_SUPABASE_URL is missing in test environment!");
}
