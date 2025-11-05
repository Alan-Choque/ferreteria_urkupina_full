// frontend/lib/api.ts
// ⚠️ DEPRECATED: Usar lib/apiClient.ts en su lugar
// Mantenido por compatibilidad con código existente

import { API_URL } from "./apiClient";

export async function fetchJSON<T = any>(path: string, init?: RequestInit): Promise<T> {
  // Si path ya incluye /api/v1, usar directamente; si no, prepend API_URL
  const fullPath = path.startsWith("/api/v1") ? path : `${API_URL}${path}`;
  const res = await fetch(fullPath, { cache: "no-store", ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.json();
}

export function qs(params?: Record<string, string | number | undefined>) {
  if (!params) return "";
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  return entries.length ? `?${new URLSearchParams(entries as [string, string][])}` : "";
}
