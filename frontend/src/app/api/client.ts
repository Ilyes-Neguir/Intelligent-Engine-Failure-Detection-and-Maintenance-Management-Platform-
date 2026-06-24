import type { ApiErrorData } from '../types';

export const BASE_URL = 'http://localhost:8080/api';
const AUTH_KEY = 'engine_auth_user';

const IS_DEV = import.meta.env.DEV;

export function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw).token ?? null;
  } catch {
    return null;
  }
}

// ─── Error Types ──────────────────────────────────────────────────────────────

/** Thrown when the server returns a non-2xx HTTP status */
export class ApiError extends Error {
  status: number;
  data: ApiErrorData;

  constructor(status: number, data: ApiErrorData) {
    const msg =
      data?.message ||
      data?.details ||
      data?.error ||
      `HTTP Error ${status}`;
    super(msg);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/** Thrown when a network/CORS failure prevents the request from reaching the server */
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

// ─── Request Helper ───────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = getStoredToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${path}`;

  // ── Dev logging: request ─────────────────────────────────────────────────
  if (IS_DEV) {
    const method = (options.method ?? 'GET').toUpperCase();
    console.groupCollapsed(`[API] ${method} ${path}`);
    console.log('URL:', url);
    if (options.body) {
      try { console.log('Payload:', JSON.parse(options.body as string)); } catch { /* ignore */ }
    }
    console.groupEnd();
  }

  // ── Fetch (catch network / CORS failures) ────────────────────────────────
  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (err) {
    const isFailedFetch =
      err instanceof TypeError &&
      (err.message.includes('Failed to fetch') ||
        err.message.includes('NetworkError') ||
        err.message.includes('network'));

    const message = isFailedFetch
      ? 'Cannot reach the server. Ensure the backend is running on http://localhost:8080 and CORS allows http://localhost:5173.'
      : `Network error: ${err instanceof Error ? err.message : 'Unknown'}`;

    if (IS_DEV) console.error('[API] Network failure:', err);
    throw new NetworkError(message);
  }

  // ── Dev logging: response ────────────────────────────────────────────────
  if (IS_DEV) {
    const icon = res.ok ? '✅' : '❌';
    console.log(`[API] ${icon} ${res.status} ${path}`);
  }

  // ── Error responses ──────────────────────────────────────────────────────
  if (!res.ok) {
    let data: ApiErrorData = {};
    try {
      data = await res.json();
    } catch {
      data = { message: res.statusText };
    }

    if (IS_DEV) console.error('[API] Error body:', data);

    // Auto-logout on 401
    if (res.status === 401) {
      localStorage.removeItem(AUTH_KEY);
      window.location.href = '/login';
    }

    throw new ApiError(res.status, data);
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (res.status === 204) return null as T;

  const contentType = res.headers.get('content-type') ?? '';
  if (
    contentType.includes('application/octet-stream') ||
    contentType.includes('application/pdf')
  ) {
    return res.blob() as unknown as T;
  }

  return res.json();
}

// ─── Public API Client ────────────────────────────────────────────────────────

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),

  postPublic: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }, false),

  getBlob: (path: string) => request<Blob>(path, { method: 'GET' }),
};

// ─── Error Helpers ────────────────────────────────────────────────────────────

/** Extract a human-readable message from any caught error */
export function getErrorMessage(err: unknown, fallback = 'Operation failed. Please try again.'): string {
  if (err instanceof NetworkError) return err.message;
  if (err instanceof ApiError) {
    if (err.status >= 500) {
      return `Server error (${err.status}). The backend may be temporarily unavailable. Please retry.`;
    }
    return (
      err.data?.message ||
      err.data?.details ||
      err.data?.error ||
      fallback
    );
  }
  return fallback;
}

/** Returns true if the error is a network/CORS failure */
export function isNetworkError(err: unknown): err is NetworkError {
  return err instanceof NetworkError;
}

/** Returns true if the error is a server-side (5xx) error */
export function isServerError(err: unknown): err is ApiError {
  return err instanceof ApiError && err.status >= 500;
}
