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
}

type ReservationListResponse = {
  items: ReservationResponse[]
  total: number
  page: number
  page_size: number
}

function toAdminReservation(reservation: ReservationResponse): Reservation {
  const item = reservation.items[0]
  return {
    id: reservation.id,
    reservationNumber: `RS-${reservation.id}`,
    customerId: reservation.cliente?.nombre ?? "Cliente",
    productId: item?.variante_producto_id ?? 0,
    variantId: item?.variante_producto_id ?? 0,
    qty: item?.cantidad ?? 0,
    store: reservation.usuario?.nombre_usuario ?? "Matriz",
    depositAmount: 0,
    status: reservation.estado.toLowerCase() as Reservation["status"],
    createdAt: reservation.fecha_reserva ?? new Date().toISOString(),
  }
}

export const reservationsService = {
  async listReservations(): Promise<Reservation[]> {
    const response = await api.get<ReservationListResponse>("/reservations")
    return response.items.map(toAdminReservation)
  },

  async getReservation(id: number): Promise<Reservation> {
    const response = await api.get<ReservationResponse>(`/reservations/${id}`)
    return toAdminReservation(response)
  },

  async createReservation(): Promise<Reservation> {
    throw new Error("La creación de reservas no está disponible todavía")
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