
import dotenv from 'dotenv';
import path from 'path';

// Load .env if it exists (local dev). In CI, env vars are injected directly.
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Set safe defaults for unit tests that don't need real credentials
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key';
process.env.OPENAI_API_KEY ??= 'sk-test-key';
process.env.MEMORY_API_URL ??= 'http://localhost:8765';

