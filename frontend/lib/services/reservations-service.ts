import type { Reservation, ID, ReservationStatus } from "@/lib/contracts"

let reservations: Reservation[] = [
  {
    id: "res-1",
    customerId: "cust-1",
    productId: "prod-1",
    variantId: "var-1",
    qty: 1,
    storeId: "branch-1",
    deposit: 100000,
    status: "PENDIENTE",
    createdAt: new Date().toISOString(),
  },
]

let nextId = 2

export const reservationsService = {
  async listReservations() {
    await new Promise((r) => setTimeout(r, 300))
    return reservations
  },

  async getReservation(id: ID) {
    await new Promise((r) => setTimeout(r, 200))
    return reservations.find((r) => r.id === id)
  },

  async createReservation(data: Omit<Reservation, "id">) {
    await new Promise((r) => setTimeout(r, 400))
    const newReservation: Reservation = {
      ...data,
      id: `res-${nextId++}`,
    }
    reservations.push(newReservation)
    return newReservation
  },

  async updateReservation(id: ID, data: Partial<Reservation>) {
    await new Promise((r) => setTimeout(r, 400))
    const reservation = reservations.find((r) => r.id === id)
    if (!reservation) throw new Error("Reserva no encontrada")
    Object.assign(reservation, data)
    return reservation
  },

  async updateReservationStatus(id: ID, status: ReservationStatus) {
    await new Promise((r) => setTimeout(r, 300))
    const reservation = reservations.find((r) => r.id === id)
    if (!reservation) throw new Error("Reserva no encontrada")
    reservation.status = status
    return reservation
  },

  async deleteReservation(id: ID) {
    await new Promise((r) => setTimeout(r, 300))
    reservations = reservations.filter((r) => r.id !== id)
  },
}
