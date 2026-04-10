import ApiClient from './apiClient';
import { FetchOptions } from '@/utils/fetcher';
import { getBearerFromSupabaseCookie } from '@/lib/auth-utils';

/**
 * API Client for Server-side usage with automatic Auth header injection from cookies.
 */
class ServerApiClient extends ApiClient {
  protected async request<T>(url: string, options: FetchOptions = {}): Promise<T> {
    const authHeader = await getBearerFromSupabaseCookie();
    
    const headers = {
      ...(authHeader ? { Authorization: authHeader } : {}),
      ...options.headers,
    };

    return super.request<T>(url, { ...options, headers });
  }
}

export default ServerApiClient;
