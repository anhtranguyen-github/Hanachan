import ApiClient from './apiClient';
import { FetchOptions } from '@/utils/fetcher';

/**
 * API Client for Server-side usage with automatic Auth header injection from cookies.
 */
class ServerApiClient extends ApiClient {
  protected async request<T>(url: string, options: FetchOptions = {}): Promise<T> {
    let authHeader: string | null = null;
    
    // Only attempt to read cookies via next/headers on the server
    if (typeof window === 'undefined') {
      try {
        const { getBearerFromSupabaseCookie } = await import('@/lib/auth-utils');
        authHeader = await getBearerFromSupabaseCookie();
      } catch (e) {
        console.warn('[ServerApiClient] Failed to import server auth utils', e);
      }
    }
    
    const headers = {
      ...(authHeader ? { Authorization: authHeader } : {}),
      ...options.headers,
    };

    return super.request<T>(url, { ...options, headers });
  }
}

export default ServerApiClient;
