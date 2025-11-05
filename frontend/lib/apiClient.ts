// lib/apiClient.ts
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
export const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || "/api/v1";
export const API_URL = `${API_BASE}${API_PREFIX}`;

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    // En App Router, el fetch por defecto es cacheable; para datos dinámicos:
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status} ${res.statusText}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(p: string) => apiFetch<T>(p),
  post: <T>(p: string, body: any) =>
    apiFetch<T>(p, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  put: <T>(p: string, body: any) =>
    apiFetch<T>(p, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  patch: <T>(p: string, body: any) =>
    apiFetch<T>(p, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  delete: <T>(p: string) =>
    apiFetch<T>(p, {
      method: "DELETE",
    }),
};

