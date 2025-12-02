import { api } from "@/lib/apiClient"
import { mockCustomers, isMockDataEnabled } from "@/lib/mock-data"

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
  async listCustomers(search?: string): Promise<AdminCustomer[]> {
    // Si los datos mock están habilitados, devolver datos de prueba
    if (isMockDataEnabled()) {
      let customers = [...mockCustomers]
      if (search) {
        const searchLower = search.toLowerCase()
        customers = customers.filter(customer => 
          customer.nombre.toLowerCase().includes(searchLower) ||
          customer.correo?.toLowerCase().includes(searchLower) ||
          customer.telefono?.includes(search)
        )
      }
      return customers
    }
    
    const params = new URLSearchParams()
    if (search) params.append("q", search)
    
    const queryString = params.toString()
    const url = queryString ? `/customers?${queryString}` : "/customers"
    const response = await api.get<CustomerListResponse>(url)
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

  async getCustomerHistory(id: number) {
    return api.get<{
      customer_id: number
      current_data: {
        nombre: string
        telefono: string | null
        nit_ci: string | null
        correo: string | null
        direccion: string | null
        fecha_registro: string | null
        usuario_id: number | null
      }
      orders: {
        items: Array<{
          id: number
          fecha: string
          estado: string
          total: number
        }>
        total: number
      }
      reservations: Array<{
        id: number
        fecha: string | null
        estado: string
      }>
      invoices: Array<{
        id: number
        numero_factura: string
        fecha_emision: string | null
        total: number
        estado: string
      }>
      payments: Array<{
        id: number
        monto: number
        metodo_pago: string
        fecha_pago: string | null
        estado: string
      }>
      variations: {
        names: string[]
        phones: string[]
        nits: string[]
        note: string
      }
      statistics: {
        total_orders: number
        total_reservations: number
        total_invoices: number
        total_payments: number
        total_spent: number
        first_order_date: string | null
        last_order_date: string | null
      }
    }>(`/customers/${id}/history`, { requireAuth: true })
  },

  async getMyCustomer(): Promise<AdminCustomer> {
    return api.get<AdminCustomer>("/customers/me", { requireAuth: true })
  },

  async updateMyCustomer(data: CustomerPayload): Promise<AdminCustomer> {
    return api.put<AdminCustomer>("/customers/me", data, { requireAuth: true })
  },

  async getCustomersReport() {
    return api.get<{
      summary: {
        total_clientes: number
        clientes_con_email: number
        clientes_con_telefono: number
        clientes_con_usuario: number
        clientes_nuevos_30_dias: number
      }
      top_clientes_ordenes: Array<{
        cliente_id: number
        nombre: string
        total_ordenes: number
        total_gastado: number
      }>
      top_clientes_reservas: Array<{
        cliente_id: number
        nombre: string
        total_reservas: number
      }>
    }>("/customers/reports/summary", { requireAuth: true })
  },
}
