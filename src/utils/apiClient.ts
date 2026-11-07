/**
 * Dynamic API Client for ZoomPhant
 * Automatically routes requests to the correct API domain based on environment:
 *   - Local test: http://localhost:3070
 *   - Test env (zoomphant.cn): http://api.zoomphant.cn
 *   - Production (zoomphant.com): https://api.zoomphant.com
 */

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return 'https://api.zoomphant.com';
  }

  // Allow explicit override via localStorage if needed for custom local ports
  const customOverride = localStorage.getItem('zp_api_url');
  if (customOverride) {
    return customOverride.replace(/\/$/, '');
  }

  const hostname = window.location.hostname;

  // 1. Local Development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:1070';
  }

  // 2. Test Environment (.cn) - Dev environment uses HTTP
  if (hostname.endsWith('zoomphant.cn')) {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//api.zoomphant.cn`;
  }

  // 3. Production Environment (.com)
  return 'https://api.zoomphant.com';
}

/**
 * Returns OAuth authorization URL for Google, GitHub, or Cloudflare
 */
export function getOAuthUrl(provider: 'google' | 'github' | 'cloudflare', returnTo?: string): string {
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const params = new URLSearchParams();
  if (appOrigin) params.set('redirect_origin', appOrigin);
  if (returnTo) params.set('return_to', returnTo);
  const queryStr = params.toString() ? `?${params.toString()}` : '';
  return `${getApiBaseUrl()}/api/auth/oauth/${provider}${queryStr}`;
}

export interface ApiClientOptions extends RequestInit {
  token?: string;
  skipAuth?: boolean;
}

/**
 * Standard fetch wrapper that handles base URL resolution, headers, and authentication
 */
export async function apiClient<T = any>(path: string, options: ApiClientOptions = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${cleanPath}`;

  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  // Automatically attach session token from localStorage if available
  if (!options.skipAuth && !headers.has('Authorization') && typeof window !== 'undefined') {
    const token = options.token || localStorage.getItem('zp_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || (data && data.success === false && data.error)) {
    const errorMsg = data?.error || `Request failed with status ${res.status}`;
    const err: any = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}
