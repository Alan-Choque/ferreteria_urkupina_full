"use client"

import { useState, useEffect } from "react"
import { reservationsService } from "@/lib/services/reservations-service"
import { Loader2 } from "lucide-react"
import type { Reservation } from "@/lib/types/admin"

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadReservations = async () => {
      try {
        setLoading(true)
        setError(null)
        // Usar myReservations=true para obtener solo las reservaciones del usuario autenticado
        const reservationsList = await reservationsService.listReservations(undefined, true)
        // Ordenar por fecha más reciente primero
        reservationsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setReservations(reservationsList)
      } catch (err: any) {
        // Si es un error 403, el usuario no tiene permisos (normal para usuarios no-admin)
        if (err?.status === 403) {
          console.log("Usuario no tiene permisos para ver reservaciones (requiere admin)")
          setReservations([])
          setError(null) // No mostrar error, solo lista vacía
        } else {
          console.error("Error loading reservations:", err)
          setError(err instanceof Error ? err.message : "Error al cargar las reservaciones")
          setReservations([])
        }
      } finally {
        setLoading(false)
      }
    }

    loadReservations()
  }, [])

  const statusLabel: Record<string, string> = {
    PENDIENTE: "Pendiente",
    CONFIRMADA: "Confirmada",
    COMPLETADA: "Completada",
    CANCELADA: "Cancelada",
    pendiente: "Pendiente",
    confirmed: "Confirmada",
    completed: "Completada",
    canceled: "Cancelada",
    cancelled: "Cancelada",
  }

  const statusColor: Record<string, string> = {
    PENDIENTE: "bg-yellow-100 text-yellow-800",
    CONFIRMADA: "bg-blue-100 text-blue-800",
    COMPLETADA: "bg-green-100 text-green-800",
    CANCELADA: "bg-red-100 text-red-800",
    pendiente: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    canceled: "bg-red-100 text-red-800",
    cancelled: "bg-red-100 text-red-800",
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">Mis Reservaciones</h2>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">Mis Reservaciones</h2>
        <div className="text-center py-12 p-6 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-neutral-900 mb-6">Mis Reservaciones</h2>

      {reservations.length === 0 ? (
        <div className="text-center py-12 p-6 bg-neutral-50 rounded-lg">
          <p className="text-neutral-600 mb-4">No tienes reservaciones aún</p>
          <p className="text-sm text-neutral-500">
            Las reservaciones te permiten asegurar productos antes de comprarlos
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((res) => {
            const reservationDate = new Date(res.createdAt)
            const statusKey = res.status.toUpperCase()
            const status = statusLabel[statusKey] || statusLabel[res.status] || res.status
            const color = statusColor[statusKey] || statusColor[res.status] || "bg-neutral-100 text-neutral-800"

            return (
              <div key={res.id} className="p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-neutral-900">{res.reservationNumber}</h3>
                    <p className="text-sm text-neutral-600">
                      Variante ID: {res.variantId} • Cantidad: {res.qty}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded text-xs font-bold ${color}`}>
                    {status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-neutral-600">Cantidad:</span>
                    <p className="font-bold text-neutral-900">{res.qty} unidad{res.qty !== 1 ? "es" : ""}</p>
                  </div>
                  <div>
                    <span className="text-neutral-600">Depósito:</span>
                    <p className="font-bold text-neutral-900">
                      Bs. {res.depositAmount.toLocaleString("es-BO")}
                    </p>
                  </div>
                  <div>
                    <span className="text-neutral-600">Fecha:</span>
                    <p className="font-bold text-neutral-900">
                      {reservationDate.toLocaleDateString("es-BO", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {res.store && (
                  <div className="mb-4 text-sm">
                    <span className="text-neutral-600">Sucursal: </span>
                    <span className="font-medium text-neutral-900">{res.store}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  {res.status === "pending" && (
                    <>
                      <button
                        onClick={async () => {
                          const monto = prompt("Ingresa el monto del anticipio:")
                          const metodo = prompt("Método de pago (EFECTIVO, QR, TARJETA):")
                          if (monto && metodo) {
                            try {
                              await reservationsService.processDeposit(res.id, {
                                monto: Number(monto),
                                metodo_pago: metodo.toUpperCase(),
                              })
                              window.location.reload()
                            } catch (err) {
                              alert(err instanceof Error ? err.message : "Error al procesar anticipio")
                            }
                          }
                        }}
                        className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Pagar Anticipo
                      </button>
                      <button
                        onClick={async () => {
                          const motivo = prompt("Motivo de cancelación (opcional):")
                          if (confirm("¿Deseas cancelar esta reserva?")) {
                            try {
                              await reservationsService.cancelReservation(res.id, motivo || undefined)
                              window.location.reload()
                            } catch (err) {
                              alert(err instanceof Error ? err.message : "Error al cancelar reserva")
                            }
                          }
                        }}
                        className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                  <button className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    Ver Detalles
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
