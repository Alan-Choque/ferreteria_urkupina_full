"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft,
  BarChart3,
  ClipboardList,
  Eye,
  FilePlus,
  Loader2,
  Printer,
  RefreshCw,
  Truck,
  X,
} from "lucide-react"

import { ActionsGrid, type ActionItem } from "@/components/admin/ActionsGrid"
import { purchasesService } from "@/lib/services/purchases-service"
import type { PurchaseOrder } from "@/lib/types/admin"

export default function PurchasesPage() {
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)

  const loadPurchaseOrders = async () => {
    setLoadingList(true)
    setError(null)
    try {
      const data = await purchasesService.listPOs()
      setPurchaseOrders(data)
    } catch (err) {
      console.error("Error loading purchase orders", err)
      setError(err instanceof Error ? err.message : "No se pudo cargar el listado de compras.")
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    void loadPurchaseOrders()
  }, [])

  const actions: ActionItem[] = useMemo(
    () => [
      {
        id: "list",
        label: "Órdenes de compra",
        description: "Consulta pedidos, montos y estados por proveedor.",
        status: "disponible",
        icon: <ClipboardList className="h-5 w-5" />,
      },
      {
        id: "create",
        label: "Nueva orden de compra",
        description: "Asistente para registrar solicitudes a proveedores.",
        status: "disponible",
        icon: <FilePlus className="h-5 w-5" />,
      },
      {
        id: "receiving",
        label: "Recepciones de mercancía",
        description: "Controla entregas vs. orden y registra diferencias.",
        status: "disponible",
        icon: <Truck className="h-5 w-5" />,
      },
      {
        id: "reports",
        label: "Reportes de compras",
        description: "Analiza tiempos de entrega, costos y rendimiento.",
        status: "disponible",
        icon: <BarChart3 className="h-5 w-5" />,
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

  const handleActionSelect = (actionId: string) => {
    setSelectedOrder(null)
    setSelectedAction(actionId)
    if (actionId === "list") {
      void loadPurchaseOrders()
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(value ?? 0)

  const statusBadgeClass = (status: PurchaseOrder["status"]) => {
    const map: Record<PurchaseOrder["status"], string> = {
      draft: "bg-gray-600/20 border border-gray-600/40 text-gray-200",
      sent: "bg-blue-600/20 border border-blue-500/40 text-blue-200",
      received: "bg-green-600/20 border border-green-500/40 text-green-200",
      partial: "bg-yellow-600/20 border border-yellow-500/40 text-yellow-200",
      canceled: "bg-red-600/20 border border-red-500/40 text-red-200",
    }
    return map[status] ?? map.draft
  }

  const statusLabel = (status: PurchaseOrder["status"]) => {
    const labels: Record<PurchaseOrder["status"], string> = {
      draft: "Borrador",
      sent: "Enviada",
      received: "Recibida",
      partial: "Recepción parcial",
      canceled: "Cancelada",
    }
    return labels[status] ?? status
  }

  const renderPurchaseList = () => (
    <motion.div
      key="purchases-list"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden text-white"
    >
      {loadingList ? (
        <div className="p-6 text-center text-gray-300">Cargando órdenes de compra...</div>
      ) : error ? (
        <div className="p-6 text-center text-red-200">{error}</div>
      ) : purchaseOrders.length === 0 ? (
        <div className="p-6 text-center text-gray-300">
          No existen órdenes de compra registradas todavía. Crea la primera desde el asistente.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">OC</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Proveedor</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Fecha</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Total</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Estado</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-100">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {purchaseOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-gray-200">{order.poNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-200">{order.supplierId}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {new Date(order.expectedDate ?? order.createdAt).toLocaleDateString("es-BO")}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-200">{formatCurrency(order.totalAmount ?? 0)}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusBadgeClass(order.status)}`}>
                      {statusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="inline-flex items-center gap-1 text-sm text-gray-300 hover:text-blue-300"
                      aria-label="Ver detalle"
                    >
                      <Eye size={16} /> Ver
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

  const renderCreatePurchase = () => (
    <motion.div
      key="purchase-create"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-6 text-gray-100"
    >
      <h3 className="text-lg font-semibold text-white">Crear nueva orden de compra</h3>
      <p className="text-sm text-gray-300">
        Este asistente permitirá seleccionar proveedor, productos y condiciones de la orden. Estamos conectando los
        catálogos de proveedores y variantes para garantizar una experiencia consistente con inventario.
      </p>
      <ul className="list-disc space-y-2 pl-5 text-sm text-gray-300">
        <li>Selecciona un proveedor registrado y define la fecha estimada de entrega.</li>
        <li>Añade variantes con cantidades y costo objetivo (se sincroniza con listas de precios).</li>
        <li>Genera la orden en estado <span className="font-semibold text-white">Borrador</span> para revisión.</li>
        <li>Confirma y envía para notificar automáticamente al proveedor.</li>
      </ul>
      <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
        Estamos finalizando la API de creación. Mientras tanto, puedes cargar órdenes desde SQL o importar vía scripts.
      </div>
    </motion.div>
  )

  const renderReceiving = () => (
    <motion.div
      key="purchase-receiving"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-6 text-gray-100"
    >
      <h3 className="text-lg font-semibold text-white">Recepciones de mercancía</h3>
      <p className="text-sm text-gray-300">
        Podrás registrar la llegada de productos, comparar cantidades recibidas vs. solicitadas y generar ajustes de
        inventario automáticamente.
      </p>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-300">
        <li>Escanea o selecciona la orden de compra pendiente de recepción.</li>
        <li>Captura las cantidades recibidas por variante y registra diferencias o daños.</li>
        <li>Genera automáticamente los ingresos de inventario y actualiza el estado de la orden.</li>
      </ol>
      <div className="rounded-md border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
        Esta sección se integrará con el módulo de inventario para impactar stock y bitácora de movimientos.
      </div>
    </motion.div>
  )

  const renderReports = () => (
    <motion.div
      key="purchase-reports"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-6 text-gray-100"
    >
      <h3 className="text-lg font-semibold text-white">Reportes de compras</h3>
      <p className="text-sm text-gray-300">
        Estamos preparando dashboards con tiempos de entrega promedio, órdenes por proveedor y análisis de costos.
      </p>
      <div className="grid gap-3 text-sm text-gray-300 md:grid-cols-2">
        <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-4">
          <p className="font-semibold text-white">Lead time por proveedor</p>
          <p className="mt-1 text-xs text-gray-400">Promedio de días entre la orden y la recepción completa.</p>
        </div>
        <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-4">
          <p className="font-semibold text-white">Top productos comprados</p>
          <p className="mt-1 text-xs text-gray-400">Cantidad y monto agregado por familia de producto.</p>
        </div>
        <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-4">
          <p className="font-semibold text-white">Análisis de costos</p>
          <p className="mt-1 text-xs text-gray-400">Variaciones de precio vs. presupuesto y promociones activas.</p>
        </div>
        <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-4">
          <p className="font-semibold text-white">Alertas de recepción</p>
          <p className="mt-1 text-xs text-gray-400">Identifica órdenes con más de 7 días de retraso.</p>
        </div>
      </div>
    </motion.div>
  )

  const renderPrintInfo = () => (
    <motion.div
      key="purchase-print"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 rounded-lg border border-gray-700 bg-gray-800 p-6 text-gray-100"
    >
      <h3 className="text-lg font-semibold text-white">Imprimir listado</h3>
      <p className="text-sm text-gray-300">
        Usa <span className="font-semibold text-white">Ctrl + P</span> (o <span className="font-semibold text-white">⌘ + P</span>) para generar una
        versión PDF. Ajusta el filtro de acciones antes de imprimir para incluir únicamente la información relevante.
      </p>
      <p className="text-xs text-gray-400">Tip: activa la opción "Fondo" en tu impresora para conservar los estilos oscuros.</p>
    </motion.div>
  )

  const renderEmptyState = () => (
    <motion.div
      key="purchase-empty"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-dashed border-gray-600 bg-gray-900/70 p-6 text-gray-300"
    >
      Selecciona una acción para administrar tus compras.
    </motion.div>
  )

  const renderActionContent = () => {
    switch (selectedAction) {
      case "list":
        return renderPurchaseList()
      case "create":
        return renderCreatePurchase()
      case "receiving":
        return renderReceiving()
      case "reports":
        return renderReports()
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
          <h1 className="text-3xl font-bold text-white">Compras</h1>
        </div>
        {selectedAction === "list" && (
          <button
            type="button"
            onClick={() => void loadPurchaseOrders()}
            disabled={loadingList}
            className="inline-flex items-center gap-2 rounded-md border border-gray-600 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-100 hover:border-orange-500 hover:bg-gray-800 disabled:opacity-50"
          >
            {loadingList ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw size={16} />} Actualizar listado
          </button>
        )}
      </div>

      {selectedAction === null ? (
        <div className="space-y-4">
          <ActionsGrid
            title="Operaciones de compras"
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
                onClick={() => {
                  setSelectedAction(null)
                  setSelectedOrder(null)
                }}
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
        {selectedOrder && (
          <motion.div
            key={`po-${selectedOrder.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl rounded-lg border border-gray-700 bg-gray-900 p-6 text-white shadow-xl"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Orden de compra {selectedOrder.poNumber}</h3>
                  <p className="text-xs text-gray-400">
                    Proveedor: <span className="text-gray-200">{selectedOrder.supplierId}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="text-sm text-gray-300 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 grid gap-3 text-sm text-gray-300">
                <div className="flex items-center justify-between">
                  <span>Fecha estimada</span>
                  <span className="text-gray-100">
                    {new Date(selectedOrder.expectedDate ?? selectedOrder.createdAt).toLocaleDateString("es-BO")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Estado</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${statusBadgeClass(selectedOrder.status)}`}>
                    {statusLabel(selectedOrder.status)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total</span>
                  <span className="text-gray-100">{formatCurrency(selectedOrder.totalAmount ?? 0)}</span>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <p className="text-sm font-semibold text-white">Ítems solicitados</p>
                <div className="max-h-60 space-y-2 overflow-y-auto pr-1 text-sm text-gray-200">
                  {selectedOrder.items.length === 0 ? (
                    <p className="text-xs text-gray-400">La orden no tiene ítems asociados.</p>
                  ) : (
                    selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded border border-gray-700 bg-gray-800/80 px-3 py-2"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-400">Variante ID</span>
                          <span className="font-semibold text-white">{item.productId}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Cantidad</p>
                          <p className="font-semibold text-white">{item.qty}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Precio</p>
                          <p className="font-semibold text-white">{formatCurrency(item.price)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
