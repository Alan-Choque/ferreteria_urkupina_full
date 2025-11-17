import { api } from "@/lib/apiClient"

export interface AdminSupplier {
  id: number
  nombre: string
  nit_ci?: string | null
  telefono?: string | null
  correo?: string | null
  direccion?: string | null
  fecha_registro: string
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
}

export const suppliersService = {
  async listSuppliers(): Promise<AdminSupplier[]> {
    const response = await api.get<SupplierListResponse>("/suppliers")
    return response.items
  },

  async getSupplier(id: number): Promise<AdminSupplier> {
    return api.get<AdminSupplier>(`/suppliers/${id}`)
  },

  async createSupplier(data: SupplierPayload): Promise<AdminSupplier> {
    return api.post<AdminSupplier>("/suppliers", data)
  },

  async updateSupplier(id: number, data: SupplierPayload): Promise<AdminSupplier> {
    return api.put<AdminSupplier>(`/suppliers/${id}`, data)
  },

  async deleteSupplier(id: number): Promise<void> {
    await api.delete(`/suppliers/${id}`)
  },
}
