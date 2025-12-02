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
  nitCi?: string;
  telefono?: string;
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
  role: UserRole;
  branch?: string;
  active: boolean;
  createdAt?: Date;
  roles?: string[];
}

function mapBackendRoles(roles: string[]): UserRole {
  if (!roles || roles.length === 0) {
    return "SUPERVISOR"; // Rol por defecto más restrictivo
  }
  
  // Verificar todos los roles, no solo el primero
  const rolesUpper = roles.map(r => r.toUpperCase().trim());
  
  // Mapear roles reales de la base de datos
  // Prioridad: ADMIN > VENTAS > INVENTARIOS > SUPERVISOR
  if (rolesUpper.some(r => r === "ADMIN")) {
    return "ADMIN";
  }
  
  if (rolesUpper.some(r => r === "VENTAS")) {
    return "VENTAS";
  }
  
  if (rolesUpper.some(r => r === "INVENTARIOS")) {
    return "INVENTARIOS";
  }
  
  if (rolesUpper.some(r => r === "SUPERVISOR")) {
    return "SUPERVISOR";
  }
  
  // Si no coincide con ningún rol conocido, usar el primero como fallback
  return rolesUpper[0] as UserRole || "SUPERVISOR";
}

// Funciones helper para verificar permisos específicos
export function canViewInventory(roles: string[]): boolean {
  const rolesUpper = roles.map(r => r.toUpperCase());
  return rolesUpper.some(r => ["ADMIN", "INVENTARIOS", "SUPERVISOR"].includes(r));
}

export function canUpdateStock(roles: string[]): boolean {
  const rolesUpper = roles.map(r => r.toUpperCase());
  return rolesUpper.some(r => ["ADMIN", "INVENTARIOS"].includes(r));
}

export function canManageProducts(roles: string[]): boolean {
  const rolesUpper = roles.map(r => r.toUpperCase());
  return rolesUpper.includes("ADMIN");
}

function userResponseToAdminUser(user: UserResponse): AdminUser {
  return {
    id: user.id,
    name: user.nombre_usuario,
    email: user.correo,
    role: mapBackendRoles(user.roles),
    roles: user.roles,
    branch: "Matriz", // Default, can be extended later
    active: user.activo,
    createdAt: new Date(),
  };
}

export const mapUserRoles = mapBackendRoles;

// Roles reales de la base de datos
export type UserRole = "ADMIN" | "VENTAS" | "INVENTARIOS" | "SUPERVISOR";

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
      
      // Disparar evento para actualizar el header
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:login"));
      }
      
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
    // Mapear nitCi y telefono a nit_ci y telefono para el backend
    const payload: any = {
      username: data.username,
      email: data.email,
      password: data.password,
    }
    if (data.nitCi) {
      payload.nit_ci = data.nitCi
    }
    if (data.telefono) {
      payload.telefono = data.telefono
    }
    try {
      const response = await api.post<RegisterResponse>(
        "/auth/register",
        payload,
        { requireAuth: false, idempotencyKey: true } // Auto-generate Idempotency-Key
      );

      return response;
    } catch (error: any) {
      if (error.status === 409) {
        const detail = error.detail?.error || {};
        throw new Error(detail.message || "Este correo electrónico ya está registrado. Si ya tienes una cuenta, intenta iniciar sesión.");
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
    // Disparar evento para actualizar el header
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth:logout"));
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

  /**
   * Request password reset - sends email with reset token
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await api.post(
        "/auth/forgot-password",
        { email },
        { requireAuth: false }
      );
    } catch (error: any) {
      // No exponer si el email existe o no por seguridad
      // Siempre mostrar mensaje de éxito
      if (error.status === 404) {
        // Email no encontrado, pero no lo revelamos
        return;
      }
      throw error;
    }
  },

  /**
   * Reset password with token from email
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await api.post(
        "/auth/reset-password",
        { token, new_password: newPassword },
        { requireAuth: false }
      );
    } catch (error: any) {
      if (error.status === 400) {
        throw new Error("El token es inválido o ha expirado");
      }
      throw error;
    }
  },

  /**
   * Authenticate with social provider (Google, Facebook, etc.)
   */
  async socialAuth(provider: string, idToken: string, accessToken?: string): Promise<AdminUser> {
    try {
      const response = await api.post<TokenResponse>(
        "/auth/social-auth",
        {
          provider,
          id_token: idToken,
          access_token: accessToken,
        },
        { requireAuth: false }
      );

      // Store tokens
      setAccessToken(response.access_token);
      setRefreshToken(response.refresh_token);

      // Get user info
      const user = await this.getCurrentUser();
      
      // Disparar evento para actualizar el header
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:login"));
      }
      
      return user;
    } catch (error: any) {
      if (error.status === 401) {
        throw new Error("Error al autenticar con " + provider);
      }
      throw error;
    }
  },
};
