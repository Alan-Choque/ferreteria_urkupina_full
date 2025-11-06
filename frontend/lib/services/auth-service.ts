// lib/services/auth-service.ts
import { api, setAccessToken, setRefreshToken, clearTokens, getAccessToken } from "@/lib/apiClient";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserResponse {
  id: number;
  nombre_usuario: string;
  correo: string;
  activo: boolean;
  roles: string[];
}

export interface RegisterResponse {
  user: UserResponse;
  token: TokenResponse;
}

// Convert backend UserResponse to AdminUser format for compatibility
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  branch?: string;
  active: boolean;
  createdAt?: Date;
}

function userResponseToAdminUser(user: UserResponse): AdminUser {
  return {
    id: user.id,
    name: user.nombre_usuario,
    email: user.correo,
    role: user.roles[0] || "user",
    branch: "Matriz", // Default, can be extended later
    active: user.activo,
    createdAt: new Date(),
  };
}

export type UserRole = "admin" | "manager" | "user" | "staff";

export const authService = {
  /**
   * Login with email and password
   * Stores tokens in localStorage and returns user info
   */
  async login(email: string, password: string): Promise<AdminUser> {
    try {
      const response = await api.post<TokenResponse>(
        "/auth/login",
        { email, password },
        { requireAuth: false, idempotencyKey: false }
      );

      // Store tokens
      setAccessToken(response.access_token);
      setRefreshToken(response.refresh_token);

      // Get user info
      const user = await this.getCurrentUser();
      return user;
    } catch (error: any) {
      if (error.status === 401) {
        throw new Error("Email o contraseña incorrectos");
      }
      throw error;
    }
  },

  /**
   * Register a new user
   * Stores tokens in localStorage and returns user info
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await api.post<RegisterResponse>(
        "/auth/register",
        data,
        { requireAuth: false, idempotencyKey: true } // Auto-generate Idempotency-Key
      );

      // Store tokens
      setAccessToken(response.token.access_token);
      setRefreshToken(response.token.refresh_token);

      return response;
    } catch (error: any) {
      if (error.status === 409) {
        const detail = error.detail?.error || {};
        throw new Error(detail.message || "El usuario ya existe");
      }
      if (error.status === 422) {
        const detail = error.detail || {};
        throw new Error(detail.message || "Error de validación");
      }
      throw error;
    }
  },

  /**
   * Get current authenticated user
   * Uses stored access token
   */
  async getCurrentUser(): Promise<AdminUser> {
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error("No hay sesión activa");
      }

      const user = await api.get<UserResponse>("/auth/me");
      return userResponseToAdminUser(user);
    } catch (error: any) {
      if (error.status === 401) {
        clearTokens();
        throw new Error("Sesión expirada");
      }
      throw error;
    }
  },

  /**
   * Logout - clear tokens and redirect
   */
  logout(): void {
    clearTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },

  /**
   * Check if user has permission based on role
   */
  hasPermission(role: UserRole, module: string, action: string): boolean {
    if (role === "admin") return true;
    if (role === "manager") return !action.includes("delete");
    if (role === "user" || role === "staff") return action === "view";
    return false;
  },

  /**
   * Check if user is authenticated (has token)
   */
  isAuthenticated(): boolean {
    return getAccessToken() !== null;
  },
};
