import { fetcher, FetchOptions } from '@/utils/fetcher';

/**
 * Base API Client
 * Note: When used on the server, auth headers should be provided by the caller 
 * or handled by a server-specific subclass.
 */
class ApiClient {
  protected async request<T>(url: string, options: FetchOptions = {}): Promise<T> {
    // For browser-side calls to our own BFF, we don't need manual auth headers 
    // as cookies are sent automatically.
    // For server-side calls, we should ideally have a way to inject the token.
    return fetcher<T>(url, options);
  }

  protected async post<T>(url: string, body: any, options: FetchOptions = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  protected async get<T>(url: string, options: FetchOptions = {}): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  protected async patch<T>(url: string, body: any, options: FetchOptions = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  protected async delete<T>(url: string, options: FetchOptions = {}): Promise<T> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }
}

export default ApiClient;
