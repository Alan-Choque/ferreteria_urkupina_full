"use client"

import { useEffect, useState } from "react"
import { reservationsService } from "@/lib/services/reservations-service"
import { Eye, CheckCircle, XCircle, X } from "lucide-react"
import { motion } from "framer-motion"
import type { Reservation } from "@/lib/types/admin"

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)

  useEffect(() => {
    const loadReservations = async () => {
      try {
        const data = await reservationsService.listReservations()
        setReservations(data)
      } catch (error) {
        console.error("Error loading reservations:", error)
      } finally {
        setLoading(false)
      }
    }
    loadReservations()
  }, [])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-600/20 text-yellow-400",
      confirmed: "bg-green-600/20 text-green-400",
      canceled: "bg-red-600/20 text-red-400",
    }
    return colors[status] || "bg-gray-600/20 text-gray-400"
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
    }).format(value)
  }

  const handleConfirm = async (id: string) => {
    try {
      await reservationsService.updateReservationStatus(id, "confirmed")
      setReservations(reservations.map((r) => (r.id === id ? { ...r, status: "confirmed" } : r)))
    } catch (error) {
      console.error("Error confirming reservation:", error)
    }
  }

  const handleCancel = async (id: string) => {
    try {
      await reservationsService.updateReservationStatus(id, "canceled")
      setReservations(reservations.map((r) => (r.id === id ? { ...r, status: "canceled" } : r)))
    } catch (error) {
      console.error("Error canceling reservation:", error)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reservaciones</h1>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden"
      >
        {loading ? (
          <div className="p-6 text-center text-gray-400">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Reservación #</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Cliente</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Producto</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Cantidad</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Depósito</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Sucursal</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Estado</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {reservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono">{reservation.reservationNumber}</td>
                    <td className="px-6 py-4 text-sm">Cliente {reservation.customerId}</td>
                    <td className="px-6 py-4 text-sm">Producto {reservation.productId}</td>
                    <td className="px-6 py-4 text-sm">{reservation.qty}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-400">
                      {formatCurrency(reservation.depositAmount)}
                    </td>
                    <td className="px-6 py-4 text-sm">{reservation.store}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(reservation.status)}`}>
                        {reservation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedReservation(reservation)}
                          className="text-gray-400 hover:text-blue-400 transition-colors"
                        >
                          <Eye size={18} />
                        </button>
                        {reservation.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleConfirm(reservation.id)}
                              className="text-gray-400 hover:text-green-400 transition-colors"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleCancel(reservation.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Detalles de Reservación</h2>
              <button onClick={() => setSelectedReservation(null)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-400">Reservación #:</span>{" "}
                {selectedReservation.reservationNumber}
              </div>
              <div>
                <span className="font-medium text-gray-400">Cliente:</span> {selectedReservation.customerId}
              </div>
              <div>
                <span className="font-medium text-gray-400">Producto:</span> {selectedReservation.productId}
              </div>
              <div>
                <span className="font-medium text-gray-400">Cantidad:</span> {selectedReservation.qty}
              </div>
              <div>
                <span className="font-medium text-gray-400">Depósito:</span>{" "}
                {formatCurrency(selectedReservation.depositAmount)}
              </div>
              <div>
                <span className="font-medium text-gray-400">Saldo Pendiente:</span>{" "}
                {formatCurrency(selectedReservation.depositAmount * 0.5)}
              </div>
              <div>
                <span className="font-medium text-gray-400">Sucursal:</span> {selectedReservation.store}
              </div>
              <div>
                <span className="font-medium text-gray-400">Estado:</span>{" "}
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedReservation.status)}`}>
                  {selectedReservation.status}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
