"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
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
  CheckCircle,
  Search,
  DollarSign,
  TrendingUp,
  Edit2,
  Send,
  CheckCircle2,
  XCircle,
  FileText,
  Lock,
} from "lucide-react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import { KPICard } from "@/components/admin/KPICard"

import { ActionsGrid, type ActionItem } from "@/components/admin/ActionsGrid"
import { purchasesService } from "@/lib/services/purchases-service"
import { suppliersService } from "@/lib/services/suppliers-service"
import { productsService } from "@/lib/services/products-service"
import type { PurchaseOrder } from "@/lib/types/admin"
import type { AdminSupplier } from "@/lib/services/suppliers-service"
import type { ProductListItem } from "@/lib/services/products-service"

export default function PurchasesPage() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Detectar la acción desde la URL
  const getActionFromPath = () => {
    const actionParam = searchParams?.get("action")
    if (actionParam) return actionParam
    
    // Si estamos en la ruta base sin action, mostrar dashboard (null)
    if (pathname === "/admin/purchases" || pathname === "/admin/purchases/") {
      return null // Mostrar dashboard
    }
    return null // Por defecto mostrar dashboard
  }
  
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Estados para crear orden
  const [suppliers, setSuppliers] = useState<AdminSupplier[]>([])
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [createForm, setCreateForm] = useState({
    supplierId: "",
    expectedDate: new Date().toISOString().split("T")[0],
    items: [] as Array<{ variantId: string; productId: number; productName: string; variantName: string; qty: string; price: string }>,
  })
  const [saving, setSaving] = useState(false)
  
  // Estados para recepción
  const [receivingForm, setReceivingForm] = useState({
    orderId: "",
    receivedItems: [] as Array<{ itemId: number; qty: string }>,
  })
  const [pendingOrders, setPendingOrders] = useState<PurchaseOrder[]>([])
  
  // Actualizar selectedAction cuando cambia la ruta o query params
  useEffect(() => {
    const action = getActionFromPath()
    setSelectedAction(action)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  // Calcular métricas para el dashboard (siempre se ejecutan)
  const totalOrders = purchaseOrders.length
  const draftOrders = purchaseOrders.filter(o => o.status === "borrador" || o.status === "draft").length
  const sentOrders = purchaseOrders.filter(o => o.status === "enviado" || o.status === "sent").length
  const confirmedOrders = purchaseOrders.filter(o => o.status === "confirmado").length
  const receivedOrders = purchaseOrders.filter(o => o.status === "recibido" || o.status === "received").length
  const invoicedOrders = purchaseOrders.filter(o => o.status === "facturado").length
  const closedOrders = purchaseOrders.filter(o => o.status === "cerrado").length
  const rejectedOrders = purchaseOrders.filter(o => o.status === "rechazado").length
  const totalAmount = purchaseOrders
    .filter(o => o.status === "recibido" || o.status === "received" || o.status === "enviado" || o.status === "sent" || o.status === "confirmado" || o.status === "facturado" || o.status === "cerrado")
    .reduce((sum, o) => sum + (o.totalAmount ?? 0), 0)
  const averageOrder = totalOrders > 0 ? totalAmount / totalOrders : 0

  // Datos para gráfico de órdenes por estado
  const statusData = useMemo(() => [
    { name: "Borrador", value: draftOrders, color: "#6B7280" },
    { name: "Enviada", value: sentOrders, color: "#3B82F6" },
    { name: "Confirmada", value: confirmedOrders, color: "#10B981" },
    { name: "Recibida", value: receivedOrders, color: "#059669" },
    { name: "Facturada", value: invoicedOrders, color: "#8B5CF6" },
    { name: "Cerrada", value: closedOrders, color: "#374151" },
    { name: "Rechazada", value: rejectedOrders, color: "#EF4444" },
  ], [draftOrders, sentOrders, confirmedOrders, receivedOrders, invoicedOrders, closedOrders, rejectedOrders])

  // Datos para gráfico de compras mensuales
  const monthlyPurchasesData = useMemo(() => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul"]
    return months.map((month, index) => ({
      month,
      ordenes: Math.floor(Math.random() * 15) + 10 + (index * 2),
      monto: Math.floor(Math.random() * 50000) + 30000 + (index * 5000),
    }))
  }, [])

  const loadPurchaseOrders = async () => {
    setLoadingList(true)
    setError(null)
      try {
        const data = await purchasesService.listPOs(searchQuery.trim() || undefined)
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
  }, [searchQuery])

  // Cargar órdenes cuando se selecciona "list"
  useEffect(() => {
    if (selectedAction === "list") {
      void loadPurchaseOrders()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAction])

  // Cargar proveedores y productos cuando se selecciona "create"
  useEffect(() => {
    if (selectedAction === "create") {
      const loadData = async () => {
        setLoadingSuppliers(true)
        setLoadingProducts(true)
        try {
          const [suppliersData, productsData] = await Promise.all([
            suppliersService.listSuppliers(undefined, 1, 1000),
            productsService.listProducts({ page: 1, page_size: 100 }),
          ])
          setSuppliers(suppliersData.items || [])
          setProducts(productsData.items)
        } catch (err) {
          console.error("Error loading data:", err)
          setSuppliers([]) // Asegurar que siempre sea un array
        } finally {
          setLoadingSuppliers(false)
          setLoadingProducts(false)
        }
      }
      void loadData()
    }
  }, [selectedAction])

  // Cargar órdenes pendientes para recepción
  useEffect(() => {
    if (selectedAction === "receiving") {
      const loadPending = async () => {
        try {
          const orders = await purchasesService.listPOs()
          // Órdenes que pueden recibirse: CONFIRMADO o ENVIADO
          setPendingOrders(orders.filter(o => 
            o.status === "confirmado" || 
            o.status === "enviado" || 
            o.status === "sent"
          ))
        } catch (err) {
          console.error("Error loading pending orders:", err)
        }
      }
      void loadPending()
    }
  }, [selectedAction])

  const actions: ActionItem[] = useMemo(
    () => [
      {
        id: "list",
        label: "Listar y buscar órdenes de compra",
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
      borrador: "bg-gray-100 border border-gray-500 text-gray-900",
      enviado: "bg-blue-100 border border-blue-500 text-blue-900",
      confirmado: "bg-cyan-100 border border-cyan-500 text-cyan-900",
      rechazado: "bg-red-100 border border-red-500 text-red-900",
      recibido: "bg-green-100 border border-green-500 text-green-900",
      facturado: "bg-purple-100 border border-purple-500 text-purple-900",
      cerrado: "bg-gray-200 border border-gray-600 text-gray-800",
      draft: "bg-gray-100 border border-gray-500 text-gray-900", // Compatibilidad
      sent: "bg-blue-100 border border-blue-500 text-blue-900",
      received: "bg-green-100 border border-green-500 text-green-900",
      partial: "bg-yellow-100 border border-yellow-500 text-yellow-900",
      canceled: "bg-red-100 border border-red-500 text-red-900",
    }
    return map[status] ?? map.borrador
  }

  const statusLabel = (status: PurchaseOrder["status"]) => {
    const labels: Record<PurchaseOrder["status"], string> = {
      borrador: "Borrador",
      enviado: "Enviada",
      confirmado: "Confirmada",
      rechazado: "Rechazada",
      recibido: "Recibida",
      facturado: "Facturada",
      cerrado: "Cerrada",
      draft: "Borrador", // Compatibilidad
      sent: "Enviada",
      received: "Recibida",
      partial: "Recepción parcial",
      canceled: "Cancelada",
    }
    return labels[status] ?? status
  }

  const renderPurchaseList = () => {
    const PURPLE_COLORS = {
      primary: "#8B5CF6",
      secondary: "#A78BFA",
      light: "#C4B5FD",
      dark: "#6D28D9",
      accent: "#EDE9FE",
    }
    const WHITE = "#FFFFFF"

    return (
      <motion.div
        key="purchases-list"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl shadow-sm bg-white border overflow-hidden"
        style={{ borderColor: PURPLE_COLORS.accent }}
      >
        {/* Barra de búsqueda */}
        <div className="p-4 border-b" style={{ borderColor: PURPLE_COLORS.accent }}>
          <div className="relative">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2" 
              size={18} 
              style={{ color: PURPLE_COLORS.secondary }}
            />
            <input
              type="text"
              placeholder="Buscar por número de orden o proveedor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm bg-white focus:outline-none"
              style={{ 
                borderColor: PURPLE_COLORS.accent,
                color: "#1F2937"
              }}
            />
          </div>
        </div>
        {loadingList ? (
          <div className="p-6 text-center" style={{ color: PURPLE_COLORS.secondary }}>Cargando órdenes de compra...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">{error}</div>
        ) : purchaseOrders.length === 0 ? (
          <div className="p-6 text-center" style={{ color: "#6B7280" }}>
            No existen órdenes de compra registradas todavía. Crea la primera desde el asistente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b" style={{ backgroundColor: PURPLE_COLORS.accent, borderColor: PURPLE_COLORS.accent }}>
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>OC</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Proveedor</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Fecha</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Total</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Estado</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: PURPLE_COLORS.accent }}>
                {purchaseOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-opacity-50 transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.accent} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                    <td className="px-6 py-4 text-sm font-mono" style={{ color: "#6B7280" }}>{order.poNumber}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#1F2937" }}>{order.supplierId}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#6B7280" }}>
                      {new Date(order.expectedDate ?? order.createdAt).toLocaleDateString("es-BO")}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#1F2937" }}>{formatCurrency(order.totalAmount ?? 0)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusBadgeClass(order.status)}`}>
                        {statusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1 text-sm hover:opacity-80 transition-opacity"
                          style={{ color: PURPLE_COLORS.primary }}
                          aria-label="Ver detalle"
                        >
                          <Eye size={16} /> Ver
                        </button>
                        {/* Botones de acción según estado */}
                        {order.status === "borrador" && (
                          <>
                            <button
                              onClick={() => {
                                // Navegar a página de edición
                                window.location.href = `/admin/purchases/${order.id}/edit`
                              }}
                              className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors flex items-center gap-1"
                              title="Editar orden"
                            >
                              <Edit2 size={12} />
                              Editar
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm("¿Deseas enviar esta orden al proveedor?")) {
                                  try {
                                    await purchasesService.sendPO(order.id)
                                    void loadPurchaseOrders()
                                  } catch (err) {
                                    setError(err instanceof Error ? err.message : "Error al enviar la orden")
                                  }
                                }
                              }}
                              className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex items-center gap-1"
                              title="Enviar al proveedor"
                            >
                              <Send size={12} />
                              Enviar
                            </button>
                          </>
                        )}
                        {order.status === "enviado" && (
                          <>
                            <button
                              onClick={async () => {
                                if (confirm("¿El proveedor confirmó esta orden?")) {
                                  try {
                                    await purchasesService.confirmPO(order.id)
                                    void loadPurchaseOrders()
                                  } catch (err) {
                                    setError(err instanceof Error ? err.message : "Error al confirmar la orden")
                                  }
                                }
                              }}
                              className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors flex items-center gap-1"
                              title="Confirmar orden (Proveedor)"
                            >
                              <CheckCircle2 size={12} />
                              Confirmar
                            </button>
                            <button
                              onClick={async () => {
                                const motivo = prompt("Motivo del rechazo:")
                                if (motivo) {
                                  try {
                                    await purchasesService.rejectPO(order.id, motivo)
                                    void loadPurchaseOrders()
                                  } catch (err) {
                                    setError(err instanceof Error ? err.message : "Error al rechazar la orden")
                                  }
                                }
                              }}
                              className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors flex items-center gap-1"
                              title="Rechazar orden (Proveedor)"
                            >
                              <XCircle size={12} />
                              Rechazar
                            </button>
                          </>
                        )}
                        {(order.status === "confirmado" || order.status === "enviado") && (
                          <button
                            onClick={() => {
                              window.location.href = `/admin/purchases/receiving?orderId=${order.id}`
                            }}
                            className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors flex items-center gap-1"
                            title="Registrar recepción"
                          >
                            <Truck size={12} />
                            Recibir
                          </button>
                        )}
                        {order.status === "recibido" && (
                          <button
                            onClick={async () => {
                              const factura = prompt("Ingresa el número de factura del proveedor:")
                              if (factura && factura.trim()) {
                                try {
                                  await purchasesService.invoicePO(order.id, factura.trim())
                                  void loadPurchaseOrders()
                                } catch (err) {
                                  setError(err instanceof Error ? err.message : "Error al asociar factura")
                                }
                              }
                            }}
                            className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors flex items-center gap-1"
                            title="Asociar factura / Procesar pago"
                          >
                            <FileText size={12} />
                            Facturar
                          </button>
                        )}
                        {order.status === "facturado" && (
                          <button
                            onClick={async () => {
                              if (confirm("¿Deseas cerrar esta orden? Esta acción no se puede deshacer.")) {
                                try {
                                  await purchasesService.closePO(order.id)
                                  void loadPurchaseOrders()
                                } catch (err) {
                                  setError(err instanceof Error ? err.message : "Error al cerrar la orden")
                                }
                              }
                            }}
                            className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-1"
                            title="Cerrar orden"
                          >
                            <Lock size={12} />
                            Cerrar
                          </button>
                        )}
                        {order.status === "cerrado" && (
                          <span className="text-xs text-gray-500 italic">Completada</span>
                        )}
                        {order.status === "rechazado" && (
                          <span className="text-xs text-red-500 italic">Rechazada</span>
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
    )
  }

  const handleAddItem = () => {
    const firstProduct = products[0]
    const variant = firstProduct?.variantes?.[0]
    if (firstProduct && variant) {
      setCreateForm(prev => ({
        ...prev,
        items: [...prev.items, {
          variantId: String(variant.id),
          productId: firstProduct.id,
          productName: firstProduct.nombre,
          variantName: variant.nombre || "Variante",
          qty: "1",
          price: String(variant.precio || 0),
        }],
      }))
    } else if (firstProduct) {
      setCreateForm(prev => ({
        ...prev,
        items: [...prev.items, {
          variantId: "",
          productId: firstProduct.id,
          productName: firstProduct.nombre,
          variantName: "Variante",
          qty: "1",
          price: "0",
        }],
      }))
    }
  }

  const handleRemoveItem = (index: number) => {
    setCreateForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.supplierId || createForm.items.length === 0) {
      setError("Debes seleccionar un proveedor y agregar al menos un ítem")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const items = createForm.items.map(item => ({
        variante_producto_id: Number(item.variantId),
        cantidad: Number(item.qty),
        precio_unitario: item.price ? Number(item.price) : null,
      }))
      
      const newOrder = await purchasesService.createPO({
        proveedor_id: Number(createForm.supplierId),
        items,
        observaciones: null,
      })
      
      setPurchaseOrders(prev => [newOrder, ...prev])
      setCreateForm({
        supplierId: "",
        expectedDate: new Date().toISOString().split("T")[0],
        items: [],
      })
      setSelectedAction("list")
      setError(null)
    } catch (err) {
      console.error("Error creating purchase order", err)
      setError(err instanceof Error ? err.message : "No se pudo crear la orden de compra.")
    } finally {
      setSaving(false)
    }
  }


  const renderCreatePurchase = () => {
    const PURPLE_COLORS = {
      primary: "#8B5CF6",
      secondary: "#A78BFA",
      light: "#C4B5FD",
      dark: "#6D28D9",
      accent: "#EDE9FE",
    }
    const WHITE = "#FFFFFF"

    return (
      <motion.form
        key="purchase-create"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleCreateSubmit}
        className="space-y-6 rounded-xl shadow-sm bg-white border p-6"
        style={{ borderColor: PURPLE_COLORS.accent }}
      >
        <h3 className="text-lg font-semibold" style={{ color: PURPLE_COLORS.dark }}>Crear nueva orden de compra</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: PURPLE_COLORS.dark }}>Proveedor *</label>
            {loadingSuppliers ? (
              <div className="text-sm" style={{ color: PURPLE_COLORS.secondary }}>Cargando proveedores...</div>
            ) : (
              <select
                value={createForm.supplierId}
                onChange={(e) => setCreateForm(prev => ({ ...prev, supplierId: e.target.value }))}
                required
                className="w-full border rounded-lg py-2 px-3 text-sm bg-white focus:outline-none"
                style={{ 
                  borderColor: PURPLE_COLORS.accent,
                  color: "#1F2937"
                }}
              >
                <option value="">Selecciona un proveedor</option>
                {Array.isArray(suppliers) && suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.nombre}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: PURPLE_COLORS.dark }}>Fecha estimada de entrega *</label>
            <input
              type="date"
              value={createForm.expectedDate}
              onChange={(e) => setCreateForm(prev => ({ ...prev, expectedDate: e.target.value }))}
              required
              className="w-full border rounded-lg py-2 px-3 text-sm bg-white focus:outline-none"
              style={{ 
                borderColor: PURPLE_COLORS.accent,
                color: "#1F2937"
              }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium" style={{ color: PURPLE_COLORS.dark }}>Ítems de la orden *</label>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-sm flex items-center gap-1 hover:opacity-80 transition-opacity"
              style={{ color: PURPLE_COLORS.primary }}
            >
              <FilePlus size={16} /> Agregar ítem
            </button>
          </div>
          {createForm.items.length === 0 ? (
            <div className="text-sm text-center py-4 border rounded-lg" style={{ borderColor: PURPLE_COLORS.accent, color: "#6B7280" }}>
              No hay ítems agregados. Haz clic en "Agregar ítem" para comenzar.
            </div>
          ) : (
            <div className="space-y-3">
              {createForm.items.map((item, index) => {
                const product = products.find(p => p.id === item.productId)
                return (
                  <div key={index} className="border rounded-lg p-4" style={{ borderColor: PURPLE_COLORS.accent, backgroundColor: PURPLE_COLORS.accent + "40" }}>
                    <div className="grid gap-3 md:grid-cols-5">
                      <div className="md:col-span-2">
                        <label className="block text-xs mb-1" style={{ color: PURPLE_COLORS.dark }}>Producto</label>
                        <select
                          value={item.productId}
                          onChange={(e) => {
                            const product = products.find(p => p.id === Number(e.target.value))
                            const variant = product?.variantes?.[0]
                            setCreateForm(prev => ({
                              ...prev,
                              items: prev.items.map((it, i) => i === index ? {
                                ...it,
                                productId: Number(e.target.value),
                                productName: product?.nombre || "",
                                variantId: variant ? String(variant.id) : "",
                                variantName: variant?.nombre || "Variante",
                                price: String(variant?.precio || 0),
                              } : it),
                            }))
                          }}
                          className="w-full border rounded py-1.5 px-2 text-sm bg-white focus:outline-none"
                          style={{ 
                            borderColor: PURPLE_COLORS.accent,
                            color: "#1F2937"
                          }}
                        >
                          <option value="">Selecciona producto</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs mb-1" style={{ color: PURPLE_COLORS.dark }}>Cantidad</label>
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => setCreateForm(prev => ({
                            ...prev,
                            items: prev.items.map((it, i) => i === index ? { ...it, qty: e.target.value } : it),
                          }))}
                          className="w-full border rounded py-1.5 px-2 text-sm bg-white focus:outline-none"
                          style={{ 
                            borderColor: PURPLE_COLORS.accent,
                            color: "#1F2937"
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs mb-1" style={{ color: PURPLE_COLORS.dark }}>Precio unitario</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => setCreateForm(prev => ({
                            ...prev,
                            items: prev.items.map((it, i) => i === index ? { ...it, price: e.target.value } : it),
                          }))}
                          className="w-full border rounded py-1.5 px-2 text-sm bg-white focus:outline-none"
                          style={{ 
                            borderColor: PURPLE_COLORS.accent,
                            color: "#1F2937"
                          }}
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="w-full hover:opacity-80 transition-opacity text-red-500 text-sm"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: PURPLE_COLORS.accent }}>
          <button
            type="button"
            onClick={() => setCreateForm({
              supplierId: "",
              expectedDate: new Date().toISOString().split("T")[0],
              items: [],
            })}
            className="px-4 py-2 border rounded-lg text-sm transition-colors"
            style={{ 
              borderColor: PURPLE_COLORS.accent,
              backgroundColor: WHITE,
              color: PURPLE_COLORS.primary
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.accent}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = WHITE}
          >
            Limpiar
          </button>
          <button
            type="submit"
            disabled={saving || !createForm.supplierId || createForm.items.length === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-white transition-colors"
            style={{ backgroundColor: PURPLE_COLORS.primary }}
            onMouseEnter={(e) => !(saving || !createForm.supplierId || createForm.items.length === 0) && (e.currentTarget.style.backgroundColor = PURPLE_COLORS.dark)}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.primary}
        >
          {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <FilePlus size={16} />}
          Crear orden
        </button>
      </div>
    </motion.form>
    )
  }

  const handleSelectOrderForReceiving = async (orderId: string) => {
    try {
      const order = await purchasesService.getPO(Number(orderId))
      setReceivingForm({
        orderId,
        receivedItems: order.items.map(item => ({
          itemId: item.id,
          qty: String(item.qty),
        })),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar la orden")
    }
  }

  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!receivingForm.orderId) {
      setError("Debes seleccionar una orden")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const selectedOrder = pendingOrders.find(o => o.id === Number(receivingForm.orderId))
      if (!selectedOrder) {
        setError("Orden no encontrada")
        return
      }

      // Mapear items recibidos usando variante_producto_id de la orden original
      const items = receivingForm.receivedItems.map(receivedItem => {
        const originalItem = selectedOrder.items.find(item => item.id === receivedItem.itemId)
        return {
          variante_producto_id: originalItem?.productId || 0,
          cantidad: Number(receivedItem.qty),
          precio_unitario: originalItem?.price || null,
        }
      }).filter(item => item.variante_producto_id > 0)

      await purchasesService.receivePO(Number(receivingForm.orderId), {
        items,
        observaciones: null,
      })
      
      setReceivingForm({
        orderId: "",
        receivedItems: [],
      })
      void loadPurchaseOrders()
      setError(null)
    } catch (err) {
      console.error("Error receiving purchase order", err)
      setError(err instanceof Error ? err.message : "Error al registrar la recepción")
    } finally {
      setSaving(false)
    }
  }

  const renderReceiving = () => {
    const PURPLE_COLORS = {
      primary: "#8B5CF6",
      secondary: "#A78BFA",
      light: "#C4B5FD",
      dark: "#6D28D9",
      accent: "#EDE9FE",
    }
    const WHITE = "#FFFFFF"
    const selectedOrder = pendingOrders.find(o => o.id === Number(receivingForm.orderId))
    
    return (
      <motion.form
        key="purchase-receiving"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleReceiveSubmit}
        className="space-y-6 rounded-xl shadow-sm bg-white border p-6"
        style={{ borderColor: PURPLE_COLORS.accent }}
      >
        <h3 className="text-lg font-semibold" style={{ color: PURPLE_COLORS.dark }}>Recepciones de mercancía</h3>
        
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: PURPLE_COLORS.dark }}>Orden de compra pendiente *</label>
          <select
            value={receivingForm.orderId}
            onChange={(e) => handleSelectOrderForReceiving(e.target.value)}
            required
            className="w-full border rounded-lg py-2 px-3 text-sm bg-white focus:outline-none"
            style={{ 
              borderColor: PURPLE_COLORS.accent,
              color: "#1F2937"
            }}
          >
            <option value="">Selecciona una orden</option>
            {pendingOrders.map(order => (
              <option key={order.id} value={order.id}>
                {order.poNumber} - {order.supplierId} - {formatCurrency(order.totalAmount ?? 0)}
              </option>
            ))}
          </select>
        </div>

        {selectedOrder && (
          <div className="border rounded-lg p-4" style={{ borderColor: PURPLE_COLORS.accent, backgroundColor: PURPLE_COLORS.accent + "40" }}>
            <div className="grid gap-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "#6B7280" }}>Proveedor:</span>
                <span style={{ color: "#1F2937", fontWeight: 600 }}>{selectedOrder.supplierId}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#6B7280" }}>Total orden:</span>
                <span style={{ color: "#1F2937", fontWeight: 600 }}>{formatCurrency(selectedOrder.totalAmount ?? 0)}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: PURPLE_COLORS.dark }}>Cantidades recibidas</label>
              <div className="space-y-3">
                {receivingForm.receivedItems.map((receivedItem, index) => {
                  const orderItem = selectedOrder.items.find(item => item.id === receivedItem.itemId)
                  return (
                    <div key={receivedItem.itemId} className="border rounded-lg p-3 bg-white" style={{ borderColor: PURPLE_COLORS.accent }}>
                      <div className="grid gap-3 md:grid-cols-3">
                        <div>
                          <label className="block text-xs mb-1" style={{ color: "#6B7280" }}>Variante ID</label>
                          <div className="text-sm" style={{ color: "#1F2937", fontWeight: 600 }}>{orderItem?.productId || "N/A"}</div>
                        </div>
                        <div>
                          <label className="block text-xs mb-1" style={{ color: "#6B7280" }}>Solicitado</label>
                          <div className="text-sm" style={{ color: "#6B7280" }}>{orderItem?.qty || 0}</div>
                        </div>
                        <div>
                          <label className="block text-xs mb-1" style={{ color: "#6B7280" }}>Recibido *</label>
                          <input
                            type="number"
                            min="0"
                            max={orderItem?.qty || 0}
                            value={receivedItem.qty}
                            onChange={(e) => setReceivingForm(prev => ({
                              ...prev,
                              receivedItems: prev.receivedItems.map((it, i) => 
                                i === index ? { ...it, qty: e.target.value } : it
                              ),
                            }))}
                            className="w-full border rounded py-1.5 px-2 text-sm bg-white focus:outline-none"
                            style={{ 
                              borderColor: PURPLE_COLORS.accent,
                              color: "#1F2937"
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: PURPLE_COLORS.accent }}>
          <button
            type="button"
            onClick={() => setReceivingForm({
              orderId: "",
              receivedItems: [],
            })}
            className="px-4 py-2 border rounded-lg text-sm transition-colors"
            style={{ 
              borderColor: PURPLE_COLORS.accent,
              backgroundColor: WHITE,
              color: PURPLE_COLORS.primary
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.accent}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = WHITE}
          >
            Limpiar
          </button>
          <button
            type="submit"
            disabled={saving || !receivingForm.orderId}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-white transition-colors"
            style={{ backgroundColor: PURPLE_COLORS.primary }}
            onMouseEnter={(e) => !(saving || !receivingForm.orderId) && (e.currentTarget.style.backgroundColor = PURPLE_COLORS.dark)}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.primary}
          >
            {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Truck size={16} />}
            Registrar recepción
          </button>
        </div>
      </motion.form>
    )
  }

  const renderReports = () => {
    const PURPLE_COLORS = {
      primary: "#8B5CF6",
      secondary: "#A78BFA",
      light: "#C4B5FD",
      dark: "#6D28D9",
      accent: "#EDE9FE",
    }
    const WHITE = "#FFFFFF"
    
    // Calcular estadísticas
    const totalOrders = purchaseOrders.length
    const byStatus = purchaseOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const totalAmount = purchaseOrders
      .filter(o => o.status === "received" || o.status === "sent")
      .reduce((sum, o) => sum + (o.totalAmount ?? 0), 0)
    
    const avgOrderValue = totalOrders > 0 
      ? purchaseOrders.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0) / totalOrders 
      : 0

    const ordersBySupplier = purchaseOrders.reduce((acc, order) => {
      const supplier = order.supplierId
      if (!acc[supplier]) {
        acc[supplier] = { count: 0, total: 0 }
      }
      acc[supplier].count++
      acc[supplier].total += order.totalAmount ?? 0
      return acc
    }, {} as Record<string, { count: number; total: number }>)

    const topSuppliers = Object.entries(ordersBySupplier)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)

    const pendingOrdersCount = purchaseOrders.filter(o => 
      o.status === "sent" || o.status === "partial"
    ).length

    return (
      <motion.div
        key="purchase-reports"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 rounded-xl shadow-sm bg-white border p-6"
        style={{ borderColor: PURPLE_COLORS.accent }}
      >
        <h3 className="text-lg font-semibold" style={{ color: PURPLE_COLORS.dark }}>Reportes de compras</h3>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-4 bg-white" style={{ borderColor: PURPLE_COLORS.accent }}>
            <p className="text-xs mb-1" style={{ color: "#6B7280" }}>Total órdenes</p>
            <p className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>{totalOrders}</p>
          </div>
          <div className="rounded-lg border p-4 bg-white" style={{ borderColor: PURPLE_COLORS.accent }}>
            <p className="text-xs mb-1" style={{ color: "#6B7280" }}>Monto total</p>
            <p className="text-2xl font-bold" style={{ color: "#10B981" }}>{formatCurrency(totalAmount)}</p>
          </div>
          <div className="rounded-lg border p-4 bg-white" style={{ borderColor: PURPLE_COLORS.accent }}>
            <p className="text-xs mb-1" style={{ color: "#6B7280" }}>Promedio por orden</p>
            <p className="text-2xl font-bold" style={{ color: "#3B82F6" }}>{formatCurrency(avgOrderValue)}</p>
          </div>
          <div className="rounded-lg border p-4 bg-white" style={{ borderColor: PURPLE_COLORS.accent }}>
            <p className="text-xs mb-1" style={{ color: "#6B7280" }}>Pendientes</p>
            <p className="text-2xl font-bold" style={{ color: "#F59E0B" }}>{pendingOrdersCount}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4 bg-white" style={{ borderColor: PURPLE_COLORS.accent }}>
            <p className="font-semibold mb-3" style={{ color: PURPLE_COLORS.dark }}>Órdenes por estado</p>
            <div className="space-y-2">
              {Object.entries(byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <span style={{ color: "#6B7280" }} className="capitalize">{statusLabel(status as PurchaseOrder["status"])}</span>
                  <span className="font-semibold" style={{ color: "#1F2937" }}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-4 bg-white" style={{ borderColor: PURPLE_COLORS.accent }}>
            <p className="font-semibold mb-3" style={{ color: PURPLE_COLORS.dark }}>Top 5 proveedores</p>
            <div className="space-y-2">
              {topSuppliers.length > 0 ? (
                topSuppliers.map(([supplier, data], index) => (
                  <div key={supplier} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span style={{ color: "#9CA3AF" }}>#{index + 1}</span>
                      <span style={{ color: "#6B7280" }}>{supplier}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold" style={{ color: "#1F2937" }}>{data.count} órdenes</div>
                      <div className="text-xs" style={{ color: "#9CA3AF" }}>{formatCurrency(data.total)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm" style={{ color: "#9CA3AF" }}>No hay datos disponibles</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4" style={{ borderColor: PURPLE_COLORS.light, backgroundColor: PURPLE_COLORS.accent + "40" }}>
          <p className="text-sm" style={{ color: PURPLE_COLORS.dark }}>
            <BarChart3 className="inline mr-2" size={16} />
            Reportes avanzados (lead time, análisis de costos, alertas) estarán disponibles cuando la API esté completa.
          </p>
        </div>
      </motion.div>
    )
  }

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

  // Renderizar dashboard de compras
  const renderDashboard = () => {
    const PURPLE_COLORS = {
      primary: "#8B5CF6",
      secondary: "#A78BFA",
      light: "#C4B5FD",
      dark: "#6D28D9",
      accent: "#EDE9FE",
    }
    const WHITE = "#FFFFFF"

    return (
      <div className="space-y-6 p-6" style={{ backgroundColor: "#F9FAFB" }}>
        {/* Fila Superior: Widgets Grandes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Órdenes por Estado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-xl p-6 shadow-sm bg-white border"
            style={{ borderColor: PURPLE_COLORS.accent }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>
                Órdenes por Estado
              </h3>
              <select className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
                <option>Último Mes</option>
                <option>Último Año</option>
              </select>
            </div>
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
                  {totalOrders}
                </span>
                <span className="text-sm font-semibold" style={{ color: "#10B981" }}>
                  +8%
                </span>
              </div>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                Total de órdenes de compra
              </p>
            </div>
            <ChartContainer
              config={{
                value: { color: PURPLE_COLORS.primary },
              }}
              className="h-[250px]"
            >
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => {
                    // Solo mostrar etiqueta si el porcentaje es mayor a 5% para evitar superposiciones
                    if (percent < 0.05) return ""
                    return `${name}\n${(percent * 100).toFixed(0)}%`
                  }}
                  outerRadius={80}
                  innerRadius={30}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: WHITE,
                    border: `1px solid ${PURPLE_COLORS.accent}`,
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ChartContainer>
          </motion.div>

          {/* Compras Mensuales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-xl p-6 shadow-sm bg-white border"
            style={{ borderColor: PURPLE_COLORS.accent }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>
                Compras Mensuales
              </h3>
              <select className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
                <option>Último Mes</option>
                <option>Último Año</option>
              </select>
            </div>
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
                  {formatCurrency(totalAmount)}
                </span>
                <span className="text-sm font-semibold" style={{ color: "#10B981" }}>
                  +15.3%
                </span>
              </div>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                Total de compras realizadas
              </p>
            </div>
            <ChartContainer
              config={{
                monto: { color: PURPLE_COLORS.primary },
              }}
              className="h-[250px]"
            >
              <BarChart data={monthlyPurchasesData}>
                <CartesianGrid strokeDasharray="3 3" stroke={PURPLE_COLORS.accent} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: WHITE,
                    border: `1px solid ${PURPLE_COLORS.accent}`,
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="monto" fill={PURPLE_COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </motion.div>
        </div>

        {/* Fila Media: KPI Cards - Primera Fila */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Órdenes de Compra"
            value={totalOrders}
            subtitle="Total de órdenes"
            icon={ClipboardList}
            change={{ value: 8.2, label: "vs. período anterior" }}
            color="success"
            delay={0.2}
          />
          <KPICard
            title="Órdenes Pendientes"
            value={draftOrders + sentOrders}
            subtitle="Borrador y enviadas"
            icon={Eye}
            color="warning"
            delay={0.3}
          />
          <KPICard
            title="Órdenes Recibidas"
            value={receivedOrders}
            subtitle="Completadas"
            icon={CheckCircle}
            change={{ value: 12.7, label: "vs. período anterior" }}
            color="success"
            delay={0.4}
          />
          <KPICard
            title="Valor Total de Compras"
            value={formatCurrency(totalAmount)}
            subtitle="Total gastado"
            icon={DollarSign}
            change={{ value: 15.3, label: "vs. período anterior" }}
            color="success"
            delay={0.5}
          />
        </div>

        {/* Segunda Fila de KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Ticket Promedio de Compra"
            value={formatCurrency(averageOrder)}
            subtitle="Valor promedio por orden"
            icon={TrendingUp}
            change={{ value: 6.8, label: "vs. período anterior" }}
            color="info"
            delay={0.6}
          />
          <KPICard
            title="Compras del Mes"
            value={formatCurrency(totalAmount * 0.35)}
            subtitle="Estimado del mes actual"
            icon={BarChart3}
            change={{ value: 18.5, label: "vs. mes anterior" }}
            color="success"
            delay={0.7}
          />
          <KPICard
            title="Órdenes en Borrador"
            value={draftOrders}
            subtitle="Pendientes de envío"
            icon={FilePlus}
            color="warning"
            delay={0.8}
          />
          <KPICard
            title="Tasa de Recepción"
            value={`${totalOrders > 0 ? Math.round((receivedOrders / totalOrders) * 100) : 0}%`}
            subtitle="Órdenes recibidas vs. total"
            icon={CheckCircle}
            change={{ value: 4.2, label: "vs. período anterior" }}
            color="success"
            delay={0.9}
          />
        </div>

        {/* Fila Inferior: Tendencias */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="rounded-xl p-6 shadow-sm bg-white border"
          style={{ borderColor: PURPLE_COLORS.accent }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>
              Tendencias de Compras
            </h3>
            <select className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
              <option>Últimos 6 meses</option>
              <option>Último año</option>
            </select>
          </div>
          <div className="flex items-center gap-4 mb-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PURPLE_COLORS.primary }}></div>
              <span style={{ color: "#6B7280" }}>Órdenes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#3B82F6" }}></div>
              <span style={{ color: "#6B7280" }}>Monto</span>
            </div>
          </div>
          <ChartContainer
            config={{
              ordenes: { color: PURPLE_COLORS.primary },
              monto: { color: "#3B82F6" },
            }}
            className="h-[300px]"
          >
            <LineChart data={monthlyPurchasesData}>
              <CartesianGrid strokeDasharray="3 3" stroke={PURPLE_COLORS.accent} />
              <XAxis 
                dataKey="month" 
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fill: "#6B7280", fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: WHITE,
                  border: `1px solid ${PURPLE_COLORS.accent}`,
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string) => {
                  if (name === "monto") return formatCurrency(value)
                  return value
                }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="ordenes" 
                stroke={PURPLE_COLORS.primary} 
                strokeWidth={2}
                dot={{ fill: PURPLE_COLORS.primary, r: 4 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="monto" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: "#3B82F6", r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        </motion.div>
      </div>
    )
  }

  const renderContent = () => {
    if (selectedAction === null) {
      return renderDashboard()
    }
    
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
        return renderDashboard()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--admin-text-primary)" }}>Compras</h1>
        <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>
          Gestiona las órdenes de compra y recepciones de mercancía
        </p>
      </div>

      {error && (
        <div className="border border-red-700 bg-red-900/30 text-red-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <X size={16} /> {error}
        </div>
      )}

      <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>

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
              className="w-full max-w-xl rounded-xl shadow-xl bg-white p-6"
              style={{ borderColor: "#EDE9FE", borderWidth: 1, borderStyle: "solid" }}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: "#6D28D9" }}>Orden de compra {selectedOrder.poNumber}</h3>
                  <p className="text-xs" style={{ color: "#6B7280" }}>
                    Proveedor: <span style={{ color: "#1F2937", fontWeight: 600 }}>{selectedOrder.supplierId}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="text-sm hover:opacity-80 transition-opacity"
                  style={{ color: "#6B7280" }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 grid gap-3 text-sm" style={{ color: "#6B7280" }}>
                <div className="flex items-center justify-between">
                  <span>Fecha estimada</span>
                  <span style={{ color: "#1F2937", fontWeight: 600 }}>
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
                  <span style={{ color: "#1F2937", fontWeight: 600 }}>{formatCurrency(selectedOrder.totalAmount ?? 0)}</span>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <p className="text-sm font-semibold" style={{ color: "#6D28D9" }}>Ítems solicitados</p>
                <div className="max-h-60 space-y-2 overflow-y-auto pr-1 text-sm">
                  {selectedOrder.items.length === 0 ? (
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>La orden no tiene ítems asociados.</p>
                  ) : (
                    selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded border px-3 py-2 bg-white"
                        style={{ borderColor: "#EDE9FE" }}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs" style={{ color: "#9CA3AF" }}>Variante ID</span>
                          <span className="font-semibold" style={{ color: "#1F2937" }}>{item.productId}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs" style={{ color: "#9CA3AF" }}>Cantidad</p>
                          <p className="font-semibold" style={{ color: "#1F2937" }}>{item.qty}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs" style={{ color: "#9CA3AF" }}>Precio</p>
                          <p className="font-semibold" style={{ color: "#1F2937" }}>{formatCurrency(item.price)}</p>
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
