import { api } from "@/lib/apiClient"
import type { Reservation } from "@/lib/types/admin"

type ReservationItemResponse = {
  id: number
  variante_producto_id: number
  variante_nombre?: string | null
  cantidad: number
}

type ReservationResponse = {
  id: number
  fecha_reserva?: string | null
  estado: string
  cliente?: { id: number; nombre: string } | null
  usuario?: { id: number; nombre_usuario: string } | null
  items: ReservationItemResponse[]
  // Campos de anticipio
  monto_anticipio?: number | null
  fecha_anticipio?: string | null
  metodo_pago_anticipio?: string | null
  numero_comprobante_anticipio?: string | null
  // Campos de confirmación
  fecha_confirmacion?: string | null
  fecha_recordatorio?: string | null
  // Campos de completado
  fecha_completado?: string | null
  orden_venta_id?: number | null
  // Observaciones
  observaciones?: string | null
}

type ReservationListResponse = {
  items: ReservationResponse[]
  total: number
  page: number
  page_size: number
}

function toAdminReservation(reservation: ReservationResponse): Reservation {
  const item = reservation.items[0]
  
  // Mapear estados del backend a estados del frontend
  const estadoMap: Record<string, Reservation["status"]> = {
    "PENDIENTE": "pending",
    "CONFIRMADA": "confirmed",
    "CANCELADA": "canceled",
    "COMPLETADA": "completed",
    // Compatibilidad con estados antiguos
    "pending": "pending",
    "confirmed": "confirmed",
    "canceled": "canceled",
    "completed": "completed",
  }
  
  return {
    id: reservation.id,
    reservationNumber: `RS-${reservation.id}`,
    customerId: reservation.cliente?.id ?? reservation.cliente?.nombre ?? "Cliente",
    productId: item?.variante_producto_id ?? 0,
    variantId: item?.variante_producto_id ?? 0,
    qty: item?.cantidad ?? 0,
    store: reservation.usuario?.nombre_usuario ?? "Matriz",
    depositAmount: reservation.monto_anticipio ?? 0,
    status: estadoMap[reservation.estado.toUpperCase()] || "pending",
    createdAt: reservation.fecha_reserva ?? new Date().toISOString(),
  }
}

export const reservationsService = {
  async listReservations(search?: string, myReservations: boolean = false): Promise<Reservation[]> {
    const params = new URLSearchParams()
    if (search) params.append("q", search)
    
    const queryString = params.toString()
    // Si myReservations es true, usar el endpoint para reservaciones del usuario autenticado
    const url = myReservations 
      ? (queryString ? `/reservations/my-reservations?${queryString}` : "/reservations/my-reservations")
      : (queryString ? `/reservations?${queryString}` : "/reservations")
    // Ambos endpoints requieren autenticación: /reservations para admin y /my-reservations para usuarios
    const response = await api.get<ReservationListResponse>(url, { requireAuth: true })
    return response.items.map(toAdminReservation)
  },

  async getReservation(id: number): Promise<Reservation> {
    const response = await api.get<ReservationResponse>(`/reservations/${id}`, { requireAuth: true })
    return toAdminReservation(response)
  },

  async checkAvailability(variante_producto_id: number, cantidad: number): Promise<{
    variante_producto_id: number
    stock_total: number
    reservado: number
    disponible: number
    solicitado: number
    suficiente: boolean
  }> {
    const response = await api.get<{
      variante_producto_id: number
      stock_total: number
      reservado: number
      disponible: number
      solicitado: number
      suficiente: boolean
    }>(`/reservations/availability/${variante_producto_id}?cantidad=${cantidad}`)
    return response
  },

  async createReservation(data: {
    cliente_id?: number
    items: Array<{
      variante_producto_id: number
      cantidad: number
    }>
    fecha_reserva?: string | null
    observaciones?: string | null
  }): Promise<Reservation> {
    const response = await api.post<ReservationResponse>("/reservations", data, { requireAuth: true })
    return toAdminReservation(response)
  },

  async cancelReservation(id: number, motivo?: string): Promise<Reservation> {
    const response = await api.post<ReservationResponse>(
      `/reservations/${id}/cancel`,
      { motivo: motivo || null },
      { requireAuth: true }
    )
    return toAdminReservation(response)
  },

  async processDeposit(id: number, data: {
    monto: number
    metodo_pago: string
    numero_comprobante?: string | null
    observaciones?: string | null
  }): Promise<Reservation> {
    const response = await api.post<ReservationResponse>(
      `/reservations/${id}/deposit`,
      data,
      { requireAuth: true }
    )
    return toAdminReservation(response)
  },

  async sendConfirmation(id: number, data: {
    enviar_recordatorio?: boolean
    fecha_recordatorio?: string | null
    observaciones?: string | null
  }): Promise<Reservation> {
    const response = await api.post<ReservationResponse>(
      `/reservations/${id}/confirm`,
      data,
      { requireAuth: true }
    )
    return toAdminReservation(response)
  },

  async completeReservation(id: number, data: {
    metodo_pago: string
    direccion_entrega?: string | null
    sucursal_recogida_id?: number | null
    observaciones?: string | null
  }): Promise<Reservation> {
    const response = await api.post<ReservationResponse>(
      `/reservations/${id}/complete`,
      data,
      { requireAuth: true }
    )
    return toAdminReservation(response)
  },

  async updateReservation(): Promise<Reservation> {
    throw new Error("La actualización de reservas no está disponible todavía")
  },

  async updateReservationStatus(): Promise<Reservation> {
    throw new Error("El cambio de estado de reservas no está disponible todavía")
  },

  async deleteReservation(): Promise<void> {
    throw new Error("La eliminación de reservas no está disponible todavía")
  },
}