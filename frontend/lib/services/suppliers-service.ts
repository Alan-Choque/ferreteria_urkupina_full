import { api } from "@/lib/apiClient"

export interface SupplierProduct {
  id: number
  nombre: string
  categoria?: string | null
}

export interface SupplierContact {
  id: number
  proveedor_id: number
  nombre: string
  cargo?: string | null
  telefono?: string | null
  correo?: string | null
  observaciones?: string | null
  activo: boolean
}

export interface AdminSupplier {
  id: number
  nombre: string
  nit_ci?: string | null
  telefono?: string | null
  correo?: string | null
  direccion?: string | null
  fecha_registro: string
  activo: boolean
  productos?: SupplierProduct[]
  contactos?: SupplierContact[]
}

export interface SupplierListResponse {
  items: AdminSupplier[]
  total: number
  page: number
  page_size: number
}

export interface SupplierPayload {
  nombre: string
  nit_ci?: string | null
  telefono?: string | null
  correo?: string | null
  direccion?: string | null
  activo?: boolean
  productos_ids?: number[]
  contactos?: Array<{
    nombre: string
    cargo?: string | null
    telefono?: string | null
    correo?: string | null
    observaciones?: string | null
    activo?: boolean
  }>
}

export interface ContactPayload {
  nombre: string
  cargo?: string | null
  telefono?: string | null
  correo?: string | null
  observaciones?: string | null
  activo?: boolean
}

export interface SupplierReport {
  summary: {
    total_proveedores: number
    proveedores_activos: number
    proveedores_inactivos: number
  }
  top_proveedores: Array<{
    proveedor_id: number
    nombre: string
    total_ordenes: number
    total_comprado: number
  }>
}

export const suppliersService = {
  async listSuppliers(search?: string, page: number = 1, pageSize: number = 50): Promise<SupplierListResponse> {
    const params = new URLSearchParams()
    if (search) params.append("q", search)
    params.append("page", page.toString())
    params.append("page_size", pageSize.toString())
    
    const queryString = params.toString()
    const url = queryString ? `/suppliers?${queryString}` : `/suppliers?page=${page}&page_size=${pageSize}`
    return api.get<SupplierListResponse>(url, { requireAuth: true })
  },

  async getSupplier(id: number): Promise<AdminSupplier> {
    return api.get<AdminSupplier>(`/suppliers/${id}`, { requireAuth: true })
  },

  async createSupplier(data: SupplierPayload): Promise<AdminSupplier> {
    return api.post<AdminSupplier>("/suppliers", data, { requireAuth: true })
  },

  async updateSupplier(id: number, data: SupplierPayload): Promise<AdminSupplier> {
    return api.put<AdminSupplier>(`/suppliers/${id}`, data, { requireAuth: true })
  },

  async activateSupplier(id: number): Promise<AdminSupplier> {
    return api.patch<AdminSupplier>(`/suppliers/${id}/activate`, {}, { requireAuth: true })
  },

  async deactivateSupplier(id: number): Promise<AdminSupplier> {
    return api.patch<AdminSupplier>(`/suppliers/${id}/deactivate`, {}, { requireAuth: true })
  },

  async deleteSupplier(id: number): Promise<void> {
    await api.delete(`/suppliers/${id}`, { requireAuth: true })
  },

  // Contactos
  async createContact(supplierId: number, data: ContactPayload): Promise<SupplierContact> {
    return api.post<SupplierContact>(`/suppliers/${supplierId}/contacts`, {
      proveedor_id: supplierId,
      ...data,
    }, { requireAuth: true })
  },

  async updateContact(contactId: number, data: ContactPayload): Promise<SupplierContact> {
    return api.put<SupplierContact>(`/suppliers/contacts/${contactId}`, data, { requireAuth: true })
  },

  async deleteContact(contactId: number): Promise<void> {
    await api.delete(`/suppliers/contacts/${contactId}`, { requireAuth: true })
  },

  // Reportes
  async getSuppliersReport(): Promise<SupplierReport> {
    return api.get<SupplierReport>("/suppliers/reports/summary", { requireAuth: true })
  },
}
