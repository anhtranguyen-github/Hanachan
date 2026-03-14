import { cookies } from 'next/headers';
import { getBearerFromSupabaseCookie as getBearerFromStore } from '@/lib/auth-utils';

function parseCookieHeader(cookieHeader: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const name = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (!name) continue;
    out[name] = value;
  }
  return out;
}

export function getBearerFromCookieHeader(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  const parsedCookies = parseCookieHeader(cookieHeader);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const projectRef = supabaseUrl.split('.')[0].split('//')[1] || '';
  const matchSuffix = '-auth-token';

  for (const [name, value] of Object.entries(parsedCookies)) {
    const isMatch = projectRef 
        ? name === `sb-${projectRef}-auth-token` || name.includes(`sb-${projectRef}-auth-token`)
        : name.includes(matchSuffix);
        
    if (!isMatch) continue;
    try {
      let raw = value as string;
      if (raw.startsWith('base64-')) {
        raw = Buffer.from(raw.slice(7), 'base64').toString('utf8');
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed[0]) return `Bearer ${parsed[0]}`;
      if (parsed && typeof parsed === 'object' && 'access_token' in parsed) {
        const token = (parsed as any).access_token;
        if (typeof token === 'string' && token) return `Bearer ${token}`;
      }
    } catch {
      // ignore
    }
  }
  return null;
}

export async function getBearerFromSupabaseCookie(): Promise<string | null> {
  return getBearerFromStore();
}
