import { api } from "@/lib/apiClient"
import type { AdminUser, UserRole } from "@/lib/types/admin"
import { mapUserRoles } from "@/lib/services/auth-service"

type UserListResponse = {
  items: Array<{
    id: number
    nombre_usuario: string
    correo: string
    activo: boolean
    roles: string[]
  }>
  total: number
  page: number
  page_size: number
}

type UserResponse = UserListResponse["items"][number]

type RoleResponse = {
  id: number
  nombre: string
  descripcion?: string | null
}

type CreatePayload = {
  name: string
  email: string
  role: UserRole
  password: string
  active: boolean
}

type UpdatePayload = Partial<CreatePayload>

let cachedRoles: RoleResponse[] | null = null

function backendRoleName(role: UserRole): string {
  switch (role) {
    case "admin":
      return "ADMIN"
    case "manager":
      return "MANAGER"
    default:
      return "USER"
  }
}

async function ensureRoles(): Promise<RoleResponse[]> {
  if (cachedRoles) return cachedRoles
  cachedRoles = await api.get<RoleResponse[]>("/users/roles/all")
  return cachedRoles
}

function toAdminUser(user: UserResponse): AdminUser {
  return {
    id: user.id,
    name: user.nombre_usuario,
    email: user.correo,
    role: mapUserRoles(user.roles),
    active: user.activo,
    branch: undefined,
    createdAt: new Date(),
  }
}

export const usersService = {
  async listUsers(): Promise<AdminUser[]> {
    const response = await api.get<UserListResponse>("/users")
    return response.items.map(toAdminUser)
  },

  async getUser(id: number): Promise<AdminUser> {
    const response = await api.get<UserResponse>(`/users/${id}`)
    return toAdminUser(response)
  },

  async createUser(data: CreatePayload): Promise<AdminUser> {
    // Validar que la contraseña esté presente
    if (!data.password || data.password.length < 8) {
      throw new Error("La contraseña es obligatoria y debe tener al menos 8 caracteres")
    }
    
    const roles = await ensureRoles()
    const desiredRoleName = backendRoleName(data.role)
    const roleMatch =
      roles.find((r) => {
        const normalized = r.nombre.toUpperCase()
        return normalized === desiredRoleName || normalized.includes(desiredRoleName)
      }) ?? roles[0]
    const payload = {
      username: data.name,
      email: data.email,
      password: data.password,
      activo: data.active,
      role_ids: roleMatch ? [roleMatch.id] : [],
    }
    const response = await api.post<UserResponse>("/users", payload)
    return toAdminUser(response)
  },

  async updateUser(id: number, data: UpdatePayload): Promise<AdminUser> {
    const payload: Record<string, unknown> = {}
    if (data.name !== undefined) payload.username = data.name
    if (data.email !== undefined) payload.email = data.email
    if (data.active !== undefined) payload.activo = data.active

    let updated: AdminUser | null = null

    if (Object.keys(payload).length > 0) {
      const response = await api.put<UserResponse>(`/users/${id}`, payload)
      updated = toAdminUser(response)
    }

    if (data.role) {
      const roles = await ensureRoles()
      const desiredRoleName = backendRoleName(data.role)
      const roleMatch =
        roles.find((r) => {
          const normalized = r.nombre.toUpperCase()
          return normalized === desiredRoleName || normalized.includes(desiredRoleName)
        }) ?? roles[0]
      const roleResponse = await api.put<UserResponse>(`/users/${id}/roles`, {
        role_ids: roleMatch ? [roleMatch.id] : [],
      })
      updated = toAdminUser(roleResponse)
    }

    if (!updated) {
      const fallback = await api.get<UserResponse>(`/users/${id}`)
      updated = toAdminUser(fallback)
    }

    return updated
  },

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}`)
  },

  async resetUserPassword(id: number): Promise<void> {
    await api.post(`/users/${id}/reset-password`, {}, { idempotencyKey: false })
  },
}
