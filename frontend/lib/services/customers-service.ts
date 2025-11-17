import { api } from "@/lib/apiClient"

export interface AdminCustomer {
  id: number
  nombre: string
  nit_ci?: string | null
  telefono?: string | null
  correo?: string | null
  direccion?: string | null
  fecha_registro: string
}

export interface CustomerListResponse {
  items: AdminCustomer[]
  total: number
  page: number
  page_size: number
}

export interface CustomerPayload {
  nombre: string
  nit_ci?: string | null
  telefono?: string | null
  correo?: string | null
  direccion?: string | null
}

export const customersService = {
  async listCustomers(): Promise<AdminCustomer[]> {
    const response = await api.get<CustomerListResponse>("/customers")
    return response.items
  },

  async getCustomer(id: number): Promise<AdminCustomer> {
    return api.get<AdminCustomer>(`/customers/${id}`)
  },

  async createCustomer(data: CustomerPayload): Promise<AdminCustomer> {
    return api.post<AdminCustomer>("/customers", data)
  },

  async updateCustomer(id: number, data: CustomerPayload): Promise<AdminCustomer> {
    return api.put<AdminCustomer>(`/customers/${id}`, data)
  },

  async deleteCustomer(id: number): Promise<void> {
    await api.delete(`/customers/${id}`)
  },
}
