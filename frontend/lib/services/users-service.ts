import { api } from "@/lib/apiClient"
import type { AdminUser, UserRole } from "@/lib/types/admin"
import { mapUserRoles } from "@/lib/services/auth-service"
import { mockUsers, isMockDataEnabled } from "@/lib/mock-data"

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
  // Los roles ya están en el formato correcto de la base de datos
  return role.toUpperCase()
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
  async listUsers(search?: string, active?: boolean): Promise<AdminUser[]> {
    // Si los datos mock están habilitados, devolver datos de prueba
    if (isMockDataEnabled()) {
      let users = [...mockUsers]
      if (search) {
        const searchLower = search.toLowerCase()
        users = users.filter(user => 
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
        )
      }
      if (active !== undefined) {
        users = users.filter(user => user.active === active)
      }
      return users
    }
    
    const params = new URLSearchParams()
    if (search) params.append("q", search)
    if (active !== undefined) params.append("active", String(active))
    
    const queryString = params.toString()
    const url = queryString ? `/users?${queryString}` : "/users"
    const response = await api.get<UserListResponse>(url)
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
      try {
        const response = await api.put<UserResponse>(`/users/${id}`, payload)
        updated = toAdminUser(response)
      } catch (error: any) {
        console.error(`Error updating user ${id}:`, error)
        // Si es un 404, verificar que el endpoint existe
        if (error?.status === 404) {
          throw new Error(`Usuario no encontrado o endpoint no disponible. Verifica que el usuario con ID ${id} existe.`)
        }
        throw error
      }
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

  async getUserOrders(userId: number, page: number = 1, pageSize: number = 20) {
    const response = await api.get<{
      items: Array<{
        id: number
        fecha: string
        estado: string
        total: number
        cliente?: { id: number; nombre: string }
      }>
      total: number
      page: number
      page_size: number
    }>(`/users/${userId}/orders?page=${page}&page_size=${pageSize}`)
    return response
  },

  async getUserCustomerHistory(userId: number) {
    const response = await api.get<{
      user_id: number
      user_email: string
      has_customer: boolean
      customer_id?: number
      current_data?: {
        nombre: string
        telefono: string | null
        nit_ci: string | null
        correo: string | null
        direccion: string | null
        fecha_registro: string | null
      }
      orders_count: number
      first_order_date: string | null
      last_order_date: string | null
      variations_note: string
    }>(`/users/${userId}/customer-history`)
    return response
  },
}
