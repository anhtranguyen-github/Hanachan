/**
 * Standardized Fetcher Utility
 */

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, data: any, message?: string) {
    super(message || `API Error: ${status}`);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

export async function fetcher<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const { params, headers, ...rest } = options;

  let requestUrl = url;
  if (params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        query.append(key, String(value));
      }
    });
    const queryString = query.toString();
    if (queryString) {
      requestUrl += `${url.includes('?') ? '&' : '?'}${queryString}`;
    }
  }

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(requestUrl, {
    headers: { ...defaultHeaders, ...headers },
    ...rest,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorData);
  }

  // Handle empty responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
