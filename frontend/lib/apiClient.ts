// lib/apiClient.ts
import { v4 as uuidv4 } from "uuid";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
export const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || "/api/v1";
export const API_URL = `${API_BASE}${API_PREFIX}`;

// Token storage helpers (client-side only)
const TOKEN_KEY = "auth_access_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// Refresh token helper
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return null;
    }

    const data = await res.json();
    setAccessToken(data.access_token);
    if (data.refresh_token) {
      setRefreshToken(data.refresh_token);
    }
    return data.access_token;
  } catch (error) {
    clearTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }
}

interface ApiFetchOptions extends RequestInit {
  requireAuth?: boolean;
  idempotencyKey?: string | boolean; // true = auto-generate, string = use provided, false = none
}

async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { requireAuth = true, idempotencyKey = false, ...init } = options;

  // Build headers
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers || {}),
  };

  // Add Authorization header if token exists
  if (requireAuth) {
    let token = getAccessToken();
    if (!token) {
      // Try to refresh
      token = await refreshAccessToken();
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  // Add Idempotency-Key for POST/PUT/PATCH if needed
  if (idempotencyKey && (init.method === "POST" || init.method === "PUT" || init.method === "PATCH")) {
    const key = idempotencyKey === true ? uuidv4() : idempotencyKey;
    headers["Idempotency-Key"] = key;
  }

  let res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers,
  });

  // Handle 401 Unauthorized - try refresh once
  if (res.status === 401 && requireAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      // Retry with new token
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(`${API_URL}${path}`, {
        cache: "no-store",
        ...init,
        headers,
      });
    }
  }

  if (!res.ok) {
    const text = await res.text();
    let errorDetail: any;
    try {
      errorDetail = JSON.parse(text);
    } catch {
      errorDetail = { message: text };
    }

    // If still 401 after refresh, clear tokens and redirect
    if (res.status === 401) {
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    const error = new Error(errorDetail.error?.message || errorDetail.message || `API ${res.status} ${res.statusText}`);
    (error as any).status = res.status;
    (error as any).detail = errorDetail;
    throw error;
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, options?: ApiFetchOptions) => apiFetch<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body: any, options?: ApiFetchOptions) =>
    apiFetch<T>(path, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
      idempotencyKey: options?.idempotencyKey ?? true, // Auto-generate for POST by default
    }),
  put: <T>(path: string, body: any, options?: ApiFetchOptions) =>
    apiFetch<T>(path, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
      idempotencyKey: options?.idempotencyKey ?? true,
    }),
  patch: <T>(path: string, body: any, options?: ApiFetchOptions) =>
    apiFetch<T>(path, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
      idempotencyKey: options?.idempotencyKey ?? true,
    }),
  delete: <T>(path: string, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: "DELETE" }),
};

// Health check helper
export async function checkHealth(): Promise<{ status: string }> {
  try {
    return await api.get<{ status: string }>("/health", { requireAuth: false });
  } catch {
    return { status: "degraded" };
  }
}

