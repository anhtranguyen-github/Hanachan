/**
 * Centralized Environment Configuration
 */

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
export const IS_TEST = process.env.NODE_ENV === 'test';

// Base URLs
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const AGENTS_BASE_URL = 
  process.env.AGENTS_API_URL?.replace(/\/+$/, '') || 
  'http://127.0.0.1:6100';

// Supabase
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Mocking
export const IS_MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
