"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft,
  ClipboardList,
  CreditCard,
  Loader2,
  PackageCheck,
  Printer,
  Receipt,
  Search,
  Truck,
  X,
} from "lucide-react"

import { ActionsGrid, type ActionItem } from "@/components/admin/ActionsGrid"
import { salesService } from "@/lib/services/sales-service"
import type { SalesOrder } from "@/lib/contracts"

const statusMeta: Record<SalesOrder["status"], { label: string; badge: string }> = {
  PENDIENTE: { label: "Pendiente", badge: "bg-yellow-600/20 border border-yellow-500/40 text-yellow-200" },
  PAGADO: { label: "Pagado", badge: "bg-green-600/20 border border-green-500/40 text-green-200" },
  ENVIADO: { label: "Enviado", badge: "bg-blue-600/20 border border-blue-500/40 text-blue-200" },
  ENTREGADO: { label: "Entregado", badge: "bg-purple-600/20 border border-purple-500/40 text-purple-200" },
  CANCELADO: { label: "Cancelado", badge: "bg-red-600/20 border border-red-500/40 text-red-200" },
}

export default function SalesPage() {
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null)

  const actions: ActionItem[] = useMemo(
    () => [
      {
        id: "list",
        label: "Listado de ventas",
        description: "Consulta órdenes, montos y estado logístico.",
        status: "disponible",
        icon: <ClipboardList className="h-5 w-5" />,
      },
      {
        id: "create",
        label: "Registrar venta",
        description: "Captura ventas especiales desde el panel.",
        status: "disponible",
        icon: <Receipt className="h-5 w-5" />,
      },
      {
        id: "payments",
        label: "Pagos y cobranzas",
        description: "Administra abonos, saldos y medios de pago.",
        status: "disponible",
        icon: <CreditCard className="h-5 w-5" />,
      },
      {
        id: "logistics",
        label: "Envíos y entregas",
        description: "Gestiona picking, despacho y confirmación.",
        status: "disponible",
        icon: <Truck className="h-5 w-5" />,
      },
      {
        id: "print",
        label: "Imprimir listado",
        description: "Genera reportes imprimibles o PDF.",
        status: "disponible",
        icon: <Printer className="h-5 w-5" />,
        onClick: () => window.print(),
      },
    ],
    [],
  )

  const loadOrders = async () => {
    setLoadingList(true)
    setError(null)
    try {
      const data = await salesService.listOrders()
      setOrders(data)
    } catch (err) {
      console.error("Error loading orders", err)
      setError(err instanceof Error ? err.message : "No se pudo cargar el listado de ventas.")
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    void loadOrders()
  }, [])

  const handleActionSelect = (actionId: string) => {
    setSelectedAction(actionId)
    setError(null)
    setSelectedOrder(null)
    if (actionId === "list") {
      void loadOrders()
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(value ?? 0)

  const renderOrderList = () => (
    <motion.div
      key="sales-list"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden text-white"
    >
      {loadingList ? (
        <div className="p-6 text-center text-gray-300">Cargando órdenes...</div>
      ) : error ? (
        <div className="p-6 text-center text-red-200">{error}</div>
      ) : orders.length === 0 ? (
        <div className="p-6 text-center text-gray-300">Aún no se registraron ventas.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Orden</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Cliente</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Items</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Total</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Estado</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Fecha</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-100">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-gray-200">{order.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-200">{order.customerId ?? "Sin asignar"}</td>
                  <td className="px-6 py-4 text-sm text-gray-200">{order.items.length}</td>
                  <td className="px-6 py-4 text-sm text-gray-200">{formatCurrency(order.totals.total)}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${statusMeta[order.status]?.badge ?? "bg-gray-700"}`}
                    >
                      {statusMeta[order.status]?.label ?? order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {new Date(order.createdAt).toLocaleDateString("es-BO")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="inline-flex items-center gap-1 text-sm text-gray-300 hover:text-blue-300"
                    >
                      <Search size={16} /> Ver detalle
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

  const renderCreateSale = () => (
    <motion.div
      key="sales-create"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-6 text-white"
    >
      <h3 className="text-lg font-semibold">Registrar venta manual</h3>
      <p className="text-sm text-gray-300">
        El asistente permitirá ingresar ventas desde el mostrador, validar inventario disponible y generar la factura
        relacionada.
      </p>
      <ul className="list-disc space-y-2 pl-5 text-sm text-gray-300">
        <li>Selecciona el cliente o crea uno al instante.</li>
        <li>Añade productos y aplica descuentos o promociones activas.</li>
        <li>Confirma el medio de pago y registra comprobantes.</li>
        <li>Genera el documento fiscal y actualiza el inventario automáticamente.</li>
      </ul>
      <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
        Estamos conectando esta experiencia con los módulos de clientes, inventario y facturación.</div>
    </motion.div>
  )

  const renderPaymentsInfo = () => (
    <motion.div
      key="sales-payments"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-6 text-white"
    >
      <h3 className="text-lg font-semibold">Pagos y cobranzas</h3>
      <p className="text-sm text-gray-300">
        Gestiona abonos, pagos parciales y conciliación con métodos electrónicos o cajas físicas.
      </p>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-300">
        <li>Identifica órdenes con saldo pendiente y genera recordatorios.</li>
        <li>Registra abonos con detalle de medio de pago y referencia.</li>
        <li>Sincroniza con contabilidad y marca ordenes como saldadas.</li>
      </ol>
      <div className="rounded-md border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
        La API usará `dbo.pagos_cliente` y conciliará contra `ordenes_venta`.</div>
    </motion.div>
  )

  const renderLogisticsInfo = () => (
    <motion.div
      key="sales-logistics"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-6 text-white"
    >
      <h3 className="text-lg font-semibold">Envíos y entregas</h3>
      <p className="text-sm text-gray-300">
        Coordina preparación de pedidos, asignación de transportistas y confirmación de entrega.
      </p>
      <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-300">
        <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-4">
          <p className="font-semibold text-white">Picking y empaquetado</p>
          <p className="text-xs text-gray-400">Checklists por orden y trazabilidad de responsabilidad.</p>
        </div>
        <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-4">
          <p className="font-semibold text-white">Seguimiento de entrega</p>
          <p className="text-xs text-gray-400">Registro de guías, pruebas de entrega y alertas de retraso.</p>
        </div>
      </div>
    </motion.div>
  )

  const renderPrintInfo = () => (
    <motion.div
      key="sales-print"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 rounded-lg border border-gray-700 bg-gray-800 p-6 text-white"
    >
      <h3 className="text-lg font-semibold">Imprimir listado</h3>
      <p className="text-sm text-gray-300">
        Usa <span className="font-semibold text-white">Ctrl + P</span> (o <span className="font-semibold text-white">⌘ + P</span>) para generar un PDF con el listado actual. Activa la opción
        "Fondos" para conservar el esquema de colores.
      </p>
      <p className="text-xs text-gray-400">Filtra previamente desde el listado para imprimir solo lo necesario.</p>
    </motion.div>
  )

  const renderEmptyState = () => (
    <motion.div
      key="sales-empty"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-dashed border-gray-600 bg-gray-900/70 p-6 text-gray-300"
    >
      Selecciona una acción del menú para gestionar las ventas.
    </motion.div>
  )

  const renderActionContent = () => {
    switch (selectedAction) {
      case "list":
        return renderOrderList()
      case "create":
        return renderCreateSale()
      case "payments":
        return renderPaymentsInfo()
      case "logistics":
        return renderLogisticsInfo()
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
          <h1 className="text-3xl font-bold text-white">Ventas</h1>
        </div>
        {selectedAction === "list" && (
          <button
            type="button"
            onClick={() => void loadOrders()}
            disabled={loadingList}
            className="inline-flex items-center gap-2 rounded-md border border-gray-600 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-100 hover:border-orange-500 hover:bg-gray-800 disabled:opacity-50"
          >
            {loadingList ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck size={16} />} Actualizar listado
          </button>
        )}
      </div>

      {selectedAction === null ? (
        <div className="space-y-4">
          <ActionsGrid
            title="Operaciones de ventas"
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
        {selectedOrder && (
          <motion.div
            key={`order-${selectedOrder.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl rounded-lg border border-gray-700 bg-gray-900 p-6 text-white"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Orden #{selectedOrder.id}</h3>
                  <p className="text-xs text-gray-400">
                    Cliente: <span className="text-gray-200">{selectedOrder.customerId ?? "Sin asignar"}</span>
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
                  <span>Fecha</span>
                  <span className="text-gray-100">
                    {new Date(selectedOrder.createdAt).toLocaleDateString("es-BO")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Estado</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${statusMeta[selectedOrder.status]?.badge ?? "bg-gray-700"}`}>
                    {statusMeta[selectedOrder.status]?.label ?? selectedOrder.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total</span>
                  <span className="text-gray-100">{formatCurrency(selectedOrder.totals.total)}</span>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <p className="text-sm font-semibold text-white">Ítems vendidos</p>
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1 text-sm text-gray-200">
                  {selectedOrder.items.length === 0 ? (
                    <p className="text-xs text-gray-400">La orden no tiene ítems asociados.</p>
                  ) : (
                    selectedOrder.items.map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-center justify-between rounded border border-gray-700 bg-gray-800/80 px-3 py-2"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-400">Producto ID</span>
                          <span className="font-semibold text-white">{item.productId}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Cantidad</p>
                          <p className="font-semibold text-white">{item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Subtotal</p>
                          <p className="font-semibold text-white">{formatCurrency(item.total)}</p>
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
