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

export const LLM_PROVIDER = process.env.LLM_PROVIDER === 'omniroute' ? 'omniroute' : 'openai';
export const LLM_MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
export const OPENAI_API_BASE_URL =
  process.env.OPENAI_API_BASE_URL?.replace(/\/+$/, '') ||
  process.env.OPENAI_API_BASE?.replace(/\/+$/, '') ||
  '';
export const OMNIROUTE_API_KEY = process.env.OMNIROUTE_API_KEY || OPENAI_API_KEY;
export const OMNIROUTE_BASE_URL =
  process.env.OMNIROUTE_BASE_URL?.replace(/\/+$/, '') ||
  process.env.LLM_BASE_URL?.replace(/\/+$/, '') ||
  '';

// Supabase
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Mocking
export const IS_MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
