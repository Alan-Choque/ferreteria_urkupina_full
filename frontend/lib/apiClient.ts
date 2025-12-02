// lib/apiClient.ts
import { v4 as uuidv4 } from "uuid"

// Usar 127.0.0.1 en lugar de localhost para evitar problemas de resolución DNS
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000"
export const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || "/api/v1"
export const API_URL = `${API_BASE}${API_PREFIX}`
export const API_PROXY_PREFIX = "/api/proxy"

// Token storage helpers (client-side only)
const TOKEN_KEY = "auth_access_token"
const REFRESH_TOKEN_KEY = "auth_refresh_token"

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(TOKEN_KEY, token)
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setRefreshToken(token: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export function clearTokens(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!res.ok) {
      clearTokens()
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
      return null
    }

    const data = await res.json()
    setAccessToken(data.access_token)
    if (data.refresh_token) {
      setRefreshToken(data.refresh_token)
    }
    return data.access_token
  } catch (error) {
    clearTokens()
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
    return null
  }
}

interface ApiFetchOptions extends RequestInit {
  requireAuth?: boolean
  idempotencyKey?: string | boolean // true = auto-generate, string = use provided, false = none
  _retryWithProxy?: boolean
}

function buildProxyUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  const relativePath = `${API_PROXY_PREFIX}${cleanPath}`
  
  // En el servidor, necesitamos una URL absoluta
  if (typeof window === "undefined") {
    // En el servidor, usar localhost con el puerto de Next.js
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    return `${baseUrl}${relativePath}`
  }
  
  // En el cliente, usar ruta relativa
  return relativePath
}

async function performFetch(url: string, init: RequestInit): Promise<Response> {
  // No usar keepalive ni timeout aquí, ya que pueden causar conflictos
  // El timeout se manejará en el nivel superior si es necesario
  return fetch(url, {
    cache: "no-store",
    ...init,
  })
}

async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { requireAuth = true, idempotencyKey = false, _retryWithProxy = false, ...init } = options

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers || {}),
  }

  if (requireAuth) {
    let token = getAccessToken()
    if (!token) {
      token = await refreshAccessToken()
    }
    if (!token) {
      // Si no hay token y requireAuth es true, lanzar error claro
      const authError = new Error("No autenticado. Por favor, inicia sesión.")
      ;(authError as any).status = 401
      throw authError
    }
    headers["Authorization"] = `Bearer ${token}`
  }

  if (idempotencyKey && (init.method === "POST" || init.method === "PUT" || init.method === "PATCH")) {
    const key = idempotencyKey === true ? uuidv4() : idempotencyKey
    headers["Idempotency-Key"] = key
  }

  // En el servidor (SSR), usar directamente el backend (más eficiente)
  // En el cliente, intentar directo primero, luego proxy si falla
  const isServer = typeof window === "undefined"
  const directUrl = `${API_URL}${path}`
  let res: Response
  
  if (isServer) {
    // En el servidor, usar directamente el backend (no necesita proxy)
    try {
      res = await performFetch(directUrl, { ...init, headers })
    } catch (directError) {
      const message =
        directError instanceof Error
          ? directError.message
          : typeof directError === "string"
            ? directError
            : "No se pudo contactar con la API"
      const networkError = new Error(`No se pudo contactar con la API. Verifica que el backend esté corriendo en ${API_BASE}. (${message})`)
      ;(networkError as any).cause = directError
      ;(networkError as any).isNetworkError = true
      throw networkError
    }
  } else {
    // En el cliente, intentar directo primero
    try {
      res = await performFetch(directUrl, { ...init, headers })
    } catch (error) {
      // Si falla, intentar con proxy
      if (!_retryWithProxy) {
        const proxyUrl = buildProxyUrl(path)
        try {
          console.log(`[API] Falló conexión directa a ${directUrl}, intentando con proxy: ${proxyUrl}`)
          res = await performFetch(proxyUrl, { ...init, headers })
          console.log(`[API] Proxy exitoso, status: ${res.status}`)
        } catch (proxyError) {
          console.error(`[API] Error en proxy:`, proxyError)
          const message =
            proxyError instanceof Error
              ? proxyError.message
              : typeof proxyError === "string"
                ? proxyError
                : "No se pudo contactar con la API"
          const networkError = new Error(`No se pudo contactar con la API. Verifica que el backend esté corriendo. (${message})`)
          ;(networkError as any).cause = proxyError
          ;(networkError as any).isNetworkError = true
          throw networkError
        }
      } else {
        const message =
          error instanceof Error ? error.message : typeof error === "string" ? error : "No se pudo contactar con la API"
        const networkError = new Error(`No se pudo contactar con la API. Verifica que el backend esté corriendo. (${message})`)
        ;(networkError as any).cause = error
        ;(networkError as any).isNetworkError = true
        throw networkError
      }
    }
  }

  if (res.status === 401 && requireAuth) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`
      res = await performFetch(directUrl, { ...init, headers })
    }
  }

  if (!res.ok) {
    const text = await res.text()
    let errorDetail: any
    try {
      errorDetail = JSON.parse(text)
    } catch {
      errorDetail = { message: text }
    }

    // FastAPI devuelve errores 422 en formato específico
    // Puede tener 'detail' como array o como objeto
    let detailMessage = errorDetail?.error?.message
    if (!detailMessage && errorDetail?.detail) {
      if (Array.isArray(errorDetail.detail)) {
        // Formato estándar de FastAPI para errores de validación
        detailMessage = errorDetail.detail.map((err: any) => {
          const loc = err.loc ? err.loc.join('.') : ''
          const msg = err.msg || err.message || 'Error de validación'
          return `${loc}: ${msg}`
        }).join(', ')
      } else if (typeof errorDetail.detail === 'string') {
        detailMessage = errorDetail.detail
      } else if (errorDetail.detail.message) {
        detailMessage = errorDetail.detail.message
      }
    }
    
    const fallbackMessage = `API ${res.status} ${res.statusText}`
    const message = detailMessage || errorDetail?.message || fallbackMessage

    const error = new Error(message)
    ;(error as any).status = res.status
    ;(error as any).detail = errorDetail
    ;(error as any).rawText = text
    throw error
  }

  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string, options?: ApiFetchOptions) => apiFetch<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body: any, options?: ApiFetchOptions) =>
    apiFetch<T>(path, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
      idempotencyKey: options?.idempotencyKey ?? true,
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
  delete: <T>(path: string, options?: ApiFetchOptions) => apiFetch<T>(path, { ...options, method: "DELETE" }),
}

export async function checkHealth(): Promise<{ status: string }> {
  try {
    return await api.get<{ status: string }>("/health", { requireAuth: false })
  } catch {
    return { status: "degraded" }
  }
}

