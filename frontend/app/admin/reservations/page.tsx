"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft,
  CalendarCheck2,
  ClipboardList,
  Loader2,
  Printer,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react"

import { ActionsGrid, type ActionItem } from "@/components/admin/ActionsGrid"
import { reservationsService } from "@/lib/services/reservations-service"
import type { Reservation } from "@/lib/types/admin"

const statusMeta: Record<Reservation["status"], { label: string; badge: string }> = {
  pending: { label: "Pendiente", badge: "bg-yellow-600/20 border border-yellow-500/40 text-yellow-200" },
  confirmed: { label: "Confirmada", badge: "bg-green-600/20 border border-green-500/40 text-green-200" },
  canceled: { label: "Cancelada", badge: "bg-red-600/20 border border-red-500/40 text-red-200" },
}

export default function ReservationsPage() {
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)

  const actions: ActionItem[] = useMemo(
    () => [
      {
        id: "list",
        label: "Listado de reservas",
        description: "Controla apartados, depósitos y fechas límite.",
        status: "disponible",
        icon: <ClipboardList className="h-5 w-5" />,
      },
      {
        id: "create",
        label: "Registrar reserva",
        description: "Aparta stock para clientes con pagos parciales.",
        status: "disponible",
        icon: <CalendarCheck2 className="h-5 w-5" />,
      },
      {
        id: "pickups",
        label: "Entregas y retiros",
        description: "Confirma retiros y libera inventario.",
        status: "disponible",
        icon: <ShieldCheck className="h-5 w-5" />,
      },
      {
        id: "print",
        label: "Imprimir listado",
        description: "Genera una versión imprimible o PDF.",
        status: "disponible",
        icon: <Printer className="h-5 w-5" />,
        onClick: () => window.print(),
      },
    ],
    [],
  )

  const loadReservations = async () => {
    setLoadingList(true)
    setError(null)
    try {
      const data = await reservationsService.listReservations()
      setReservations(data)
    } catch (err) {
      console.error("Error loading reservations", err)
      setError(err instanceof Error ? err.message : "No se pudo cargar el listado de reservaciones.")
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    void loadReservations()
  }, [])

  const handleActionSelect = (actionId: string) => {
    setSelectedAction(actionId)
    setError(null)
    setSelectedReservation(null)
    if (actionId === "list") {
      void loadReservations()
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(value ?? 0)

  const renderReservationList = () => (
    <motion.div
      key="reservations-list"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden text-white"
    >
      {loadingList ? (
        <div className="p-6 text-center text-gray-300">Cargando reservaciones...</div>
      ) : error ? (
        <div className="p-6 text-center text-red-200">{error}</div>
      ) : reservations.length === 0 ? (
        <div className="p-6 text-center text-gray-300">Aún no se registraron reservas.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Reserva</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Cliente</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Producto</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Cantidad</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Depósito</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Sucursal</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Estado</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-100">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {reservations.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-gray-200">{reservation.reservationNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-200">Cliente {reservation.customerId}</td>
                  <td className="px-6 py-4 text-sm text-gray-200">Producto {reservation.productId}</td>
                  <td className="px-6 py-4 text-sm text-gray-200">{reservation.qty}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-300">
                    {formatCurrency(reservation.depositAmount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-200">{reservation.store}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${statusMeta[reservation.status]?.badge ?? "bg-gray-700"}`}
                    >
                      {statusMeta[reservation.status]?.label ?? reservation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedReservation(reservation)}
                      className="inline-flex items-center gap-1 text-sm text-gray-300 hover:text-blue-300"
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  )

  const renderCreateReservation = () => (
    <motion.div
      key="reservation-create"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-6 text-white"
    >
      <h3 className="text-lg font-semibold">Registrar reserva manual</h3>
      <p className="text-sm text-gray-300">
        Pronto podremos capturar reservas desde el panel, asignando clientes, productos y montos de depósito con
        sincronización directa a inventario.
      </p>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-300">
        <li>Selecciona el cliente y la sucursal donde se retirará el producto.</li>
        <li>Añade variantes y define cantidades reservadas.</li>
        <li>Registra el depósito y las condiciones de expiración.</li>
        <li>Confirma la reserva para bloquear stock automáticamente.</li>
      </ol>
      <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
        Esta vista se integrará con `dbo.reservas` y movimientos de inventario para prevenir sobreventa.</div>
    </motion.div>
  )

  const renderPickupsInfo = () => (
    <motion.div
      key="reservation-pickups"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-6 text-white"
    >
      <h3 className="text-lg font-semibold">Entregas y retiros</h3>
      <p className="text-sm text-gray-300">
        Monitorea reservas próximas a retirar, confirma entregas y libera el stock bloqueado cuando un cliente cancela.
      </p>
      <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-300">
        <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-4">
          <p className="font-semibold text-white">Panel de retiros</p>
          <p className="text-xs text-gray-400">Prioriza reservas según fecha compromiso y depósito pagado.</p>
        </div>
        <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-4">
          <p className="font-semibold text-white">Historial de entregas</p>
          <p className="text-xs text-gray-400">Registra quién entregó, quién recibió y evidencias asociadas.</p>
        </div>
      </div>
    </motion.div>
  )

  const renderPrintInfo = () => (
    <motion.div
      key="reservation-print"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 rounded-lg border border-gray-700 bg-gray-800 p-6 text-white"
    >
      <h3 className="text-lg font-semibold">Imprimir listado</h3>
      <p className="text-sm text-gray-300">
        Usa <span className="font-semibold text-white">Ctrl + P</span> (o <span className="font-semibold text-white">⌘ + P</span>) para generar un PDF con las reservas actuales. Activa la
        opción de fondos para conservar el estilo.
      </p>
      <p className="text-xs text-gray-400">Filtra desde el listado antes de imprimir si necesitas un subset específico.</p>
    </motion.div>
  )

  const renderEmptyState = () => (
    <motion.div
      key="reservation-empty"
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-dashed border-gray-600 bg-gray-900/70 p-6 text-gray-300"
    >
      Selecciona una acción del menú para gestionar las reservaciones.
    </motion.div>
  )

  const renderActionContent = () => {
    switch (selectedAction) {
      case "list":
        return renderReservationList()
      case "create":
        return renderCreateReservation()
      case "pickups":
        return renderPickupsInfo()
      case "print":
        return renderPrintInfo()
      default:
        return renderEmptyState()
    }
  }

  const currentAction = actions.find((action) => action.id === selectedAction)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white">Reservaciones</h1>
        </div>
        {selectedAction === "list" && (
          <button
            type="button"
            onClick={() => void loadReservations()}
            disabled={loadingList}
            className="inline-flex items-center gap-2 rounded-md border border-gray-600 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-100 hover:border-orange-500 hover:bg-gray-800 disabled:opacity-50"
          >
            {loadingList ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualizar listado"}
          </button>
        )}
      </div>

      {selectedAction === null ? (
        <div className="space-y-4">
          <ActionsGrid
            title="Operaciones de reservas"
            subtitle="Panel general"
            actions={actions}
            selectedAction={selectedAction}
            onSelect={handleActionSelect}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedAction(null)}
                className="inline-flex items-center gap-2 rounded-md border border-gray-600 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-100 hover:border-orange-500 hover:bg-gray-800"
              >
                <ArrowLeft size={16} /> Volver al menú de acciones
              </button>
              <div>
                <h2 className="text-xl font-semibold text-white">{currentAction?.label ?? "Acción"}</h2>
                {currentAction?.description && (
                  <p className="max-w-xl text-xs text-gray-400">{currentAction.description}</p>
                )}
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">{renderActionContent()}</AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {selectedReservation && (
          <motion.div
            key={`reservation-${selectedReservation.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-lg border border-gray-700 bg-gray-900 p-6 text-white"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Reserva {selectedReservation.reservationNumber}</h3>
                  <p className="text-xs text-gray-400">
                    Cliente: <span className="text-gray-200">{selectedReservation.customerId}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReservation(null)}
                  className="text-sm text-gray-300 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-300">
                <p>
                  <span className="font-semibold text-white">Producto:</span> {selectedReservation.productId}
                </p>
                <p>
                  <span className="font-semibold text-white">Cantidad reservada:</span> {selectedReservation.qty}
                </p>
                <p>
                  <span className="font-semibold text-white">Depósito:</span> {formatCurrency(selectedReservation.depositAmount)}
                </p>
                <p>
                  <span className="font-semibold text-white">Sucursal:</span> {selectedReservation.store}
                </p>
                <p>
                  <span className="font-semibold text-white">Estado:</span>{" "}
                  <span className={`px-2 py-1 text-xs font-medium rounded ${statusMeta[selectedReservation.status]?.badge ?? "bg-gray-700"}`}>
                    {statusMeta[selectedReservation.status]?.label ?? selectedReservation.status}
                  </span>
                </p>
              </div>

              {selectedReservation.status === "pending" && (
                <div className="mt-4 flex items-center justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => alert("Confirmación disponible en próximas iteraciones")}
                    className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-500"
                  >
                    Confirmar retiro
                  </button>
                  <button
                    type="button"
                    onClick={() => alert("Cancelación disponible en próximas iteraciones")}
                    className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-500"
                  >
                    Cancelar reserva
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
