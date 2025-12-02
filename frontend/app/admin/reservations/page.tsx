"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
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
  CheckCircle,
  Search,
  TrendingUp,
  DollarSign,
  Calendar,
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

import type { ActionItem } from "@/components/admin/ActionsGrid"
import { reservationsService } from "@/lib/services/reservations-service"
import { customersService } from "@/lib/services/customers-service"
import { productsService } from "@/lib/services/products-service"
import type { Reservation } from "@/lib/types/admin"
import type { AdminCustomer } from "@/lib/services/customers-service"
import type { ProductListItem } from "@/lib/services/products-service"

const statusMeta: Record<Reservation["status"], { label: string; badge: string }> = {
  pending: { label: "Pendiente", badge: "bg-yellow-600/20 border border-yellow-500/40 text-yellow-200" },
  confirmed: { label: "Confirmada", badge: "bg-green-600/20 border border-green-500/40 text-green-200" },
  canceled: { label: "Cancelada", badge: "bg-red-600/20 border border-red-500/40 text-red-200" },
  completed: { label: "Completada", badge: "bg-blue-600/20 border border-blue-500/40 text-blue-200" },
}

export default function ReservationsPage() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Detectar la acción desde la URL
  const getActionFromPath = () => {
    const actionParam = searchParams?.get("action")
    if (actionParam) return actionParam
    
    // Si estamos en la ruta base sin action, mostrar dashboard (null)
    if (pathname === "/admin/reservations" || pathname === "/admin/reservations/") {
      return null // Mostrar dashboard
    }
    return null // Por defecto mostrar dashboard
  }
  
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Estados para crear reserva
  const [customers, setCustomers] = useState<AdminCustomer[]>([])
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [createForm, setCreateForm] = useState({
    customerId: "",
    productId: "",
    variantId: "",
    qty: "1",
    depositAmount: "0",
    store: "Matriz",
    notes: "",
  })
  const [saving, setSaving] = useState(false)
  
  // Estados para entregas/retiros
  const [pickupForm, setPickupForm] = useState({
    reservationId: "",
    confirmPickup: false,
    notes: "",
  })
  const [pendingPickups, setPendingPickups] = useState<Reservation[]>([])

  // Actualizar selectedAction cuando cambia la ruta o query params
  useEffect(() => {
    const action = getActionFromPath()
    setSelectedAction(action)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  // Calcular métricas para el dashboard (siempre se ejecutan)
  const totalReservations = reservations.length
  const pendingReservations = reservations.filter(r => r.status === "pending").length
  const confirmedReservations = reservations.filter(r => r.status === "confirmed").length
  const canceledReservations = reservations.filter(r => r.status === "canceled").length
  const totalDeposits = reservations
    .filter(r => r.status === "confirmed" || r.status === "pending")
    .reduce((sum, r) => sum + (r.depositAmount || 0), 0)

  // Datos para gráfico de reservaciones por estado
  const statusData = useMemo(() => [
    { name: "Pendiente", value: pendingReservations, color: "#F59E0B" },
    { name: "Confirmada", value: confirmedReservations, color: "#10B981" },
    { name: "Cancelada", value: canceledReservations, color: "#EF4444" },
  ], [pendingReservations, confirmedReservations, canceledReservations])

  // Datos para gráfico de reservaciones mensuales
  const monthlyReservationsData = useMemo(() => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul"]
    return months.map((month, index) => ({
      month,
      reservaciones: Math.floor(Math.random() * 20) + 15 + (index * 2),
      confirmadas: Math.floor(Math.random() * 15) + 10 + (index * 1),
    }))
  }, [])

  const actions: ActionItem[] = useMemo(
    () => [
      {
        id: "list",
        label: "Listar y buscar reservas",
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
        const data = await reservationsService.listReservations(searchQuery.trim() || undefined)
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
  }, [searchQuery])
  
  // Cargar datos cuando cambia la acción
  useEffect(() => {
    if (selectedAction === "list") {
      void loadReservations()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAction])

  // Cargar clientes y productos cuando se selecciona "create"
  useEffect(() => {
    if (selectedAction === "create") {
      const loadData = async () => {
        setLoadingCustomers(true)
        setLoadingProducts(true)
        try {
          const [customersData, productsData] = await Promise.all([
            customersService.listCustomers(),
            productsService.listProducts({ page: 1, page_size: 100 }),
          ])
          setCustomers(customersData)
          setProducts(productsData.items)
        } catch (err) {
          console.error("Error loading data:", err)
        } finally {
          setLoadingCustomers(false)
          setLoadingProducts(false)
        }
      }
      void loadData()
    }
  }, [selectedAction])

  // Cargar reservas pendientes para retiro
  useEffect(() => {
    if (selectedAction === "pickups") {
      const loadPending = async () => {
        try {
          const reservationsData = await reservationsService.listReservations()
          setPendingPickups(reservationsData.filter(r => r.status === "pending" || r.status === "confirmed"))
        } catch (err) {
          console.error("Error loading pending pickups:", err)
        }
      }
      void loadPending()
    }
  }, [selectedAction])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(value ?? 0)

  const renderReservationList = () => {
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
        key="reservations-list"
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
              placeholder="Buscar por número de reserva o cliente..."
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
          <div className="p-6 text-center" style={{ color: PURPLE_COLORS.secondary }}>Cargando reservaciones...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">{error}</div>
        ) : reservations.length === 0 ? (
          <div className="p-6 text-center" style={{ color: "#6B7280" }}>Aún no se registraron reservas.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b" style={{ backgroundColor: PURPLE_COLORS.accent, borderColor: PURPLE_COLORS.accent }}>
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Reserva</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Cliente</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Producto</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Cantidad</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Depósito</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Sucursal</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Estado</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: PURPLE_COLORS.accent }}>
                {reservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-opacity-50 transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.accent} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                    <td className="px-6 py-4 text-sm font-mono" style={{ color: "#6B7280" }}>{reservation.reservationNumber}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#1F2937" }}>Cliente {reservation.customerId}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#1F2937" }}>Producto {reservation.productId}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#6B7280" }}>{reservation.qty}</td>
                    <td className="px-6 py-4 text-sm font-semibold" style={{ color: "#10B981" }}>
                      {formatCurrency(reservation.depositAmount)}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#6B7280" }}>{reservation.store}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${statusMeta[reservation.status]?.badge ?? ""}`}
                      >
                        {statusMeta[reservation.status]?.label ?? reservation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedReservation(reservation)}
                          className="inline-flex items-center gap-1 text-sm hover:opacity-80 transition-opacity"
                          style={{ color: PURPLE_COLORS.primary }}
                        >
                          Ver
                        </button>
                        {/* Botones de acción según estado */}
                        {reservation.status === "pending" && (
                          <>
                            <button
                              onClick={async () => {
                                const monto = prompt("Ingresa el monto del anticipio:")
                                const metodo = prompt("Método de pago (EFECTIVO, QR, TARJETA):")
                                if (monto && metodo) {
                                  try {
                                    await reservationsService.processDeposit(reservation.id, {
                                      monto: Number(monto),
                                      metodo_pago: metodo.toUpperCase(),
                                    })
                                    void loadReservations()
                                  } catch (err) {
                                    setError(err instanceof Error ? err.message : "Error al procesar anticipio")
                                  }
                                }
                              }}
                              className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                              title="Procesar anticipio"
                            >
                              Anticipo
                            </button>
                            <button
                              onClick={async () => {
                                const motivo = prompt("Motivo de cancelación (opcional):")
                                if (confirm("¿Deseas cancelar esta reserva?")) {
                                  try {
                                    await reservationsService.cancelReservation(reservation.id, motivo || undefined)
                                    void loadReservations()
                                  } catch (err) {
                                    setError(err instanceof Error ? err.message : "Error al cancelar reserva")
                                  }
                                }
                              }}
                              className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                              title="Cancelar reserva"
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                        {reservation.status === "confirmed" && (
                          <>
                            <button
                              onClick={async () => {
                                const enviar = confirm("¿Deseas enviar confirmación/recordatorio?")
                                if (enviar) {
                                  try {
                                    await reservationsService.sendConfirmation(reservation.id, {
                                      enviar_recordatorio: true,
                                    })
                                    void loadReservations()
                                  } catch (err) {
                                    setError(err instanceof Error ? err.message : "Error al enviar confirmación")
                                  }
                                }
                              }}
                              className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                              title="Enviar confirmación/recordatorio"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={async () => {
                                const metodo = prompt("Método de pago (EFECTIVO, QR):")
                                if (metodo) {
                                  try {
                                    await reservationsService.completeReservation(reservation.id, {
                                      metodo_pago: metodo.toUpperCase(),
                                    })
                                    void loadReservations()
                                  } catch (err) {
                                    setError(err instanceof Error ? err.message : "Error al completar reserva")
                                  }
                                }
                              }}
                              className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                              title="Completar pedido/Cobrar"
                            >
                              Completar
                            </button>
                          </>
                        )}
                        {reservation.status === "completed" && (
                          <span className="text-xs text-gray-500 italic">Completada</span>
                        )}
                        {reservation.status === "canceled" && (
                          <span className="text-xs text-red-500 italic">Cancelada</span>
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

  const handleCreateReservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.customerId) {
      setError("Debes seleccionar un cliente")
      return
    }
    if (!createForm.productId || !createForm.variantId) {
      setError("Debes seleccionar un producto y variante")
      return
    }
    if (!createForm.qty || Number(createForm.qty) <= 0) {
      setError("La cantidad debe ser mayor a 0")
      return
    }
    setSaving(true)
    setError(null)
    try {
      await reservationsService.createReservation({
        cliente_id: Number(createForm.customerId),
        items: [{
          variante_producto_id: Number(createForm.variantId),
          cantidad: Number(createForm.qty),
        }],
        observaciones: createForm.notes || null,
      })
      setCreateForm({
        customerId: "",
        productId: "",
        variantId: "",
        qty: "1",
        depositAmount: "0",
        store: "Matriz",
        notes: "",
      })
      void loadReservations()
      setSelectedAction("list")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la reserva")
    } finally {
      setSaving(false)
    }
  }

  const renderCreateReservation = () => {
    const selectedProduct = products.find(p => p.id === Number(createForm.productId))
    const availableVariants = selectedProduct?.variantes || []
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
        key="reservation-create"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleCreateReservationSubmit}
        className="space-y-6 rounded-xl shadow-sm bg-white border p-6"
        style={{ borderColor: PURPLE_COLORS.accent }}
      >
        <h3 className="text-lg font-semibold" style={{ color: PURPLE_COLORS.dark }}>Registrar reserva manual</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: PURPLE_COLORS.dark }}>Cliente *</label>
            {loadingCustomers ? (
              <div className="text-sm" style={{ color: PURPLE_COLORS.secondary }}>Cargando clientes...</div>
            ) : (
              <select
                value={createForm.customerId}
                onChange={(e) => setCreateForm(prev => ({ ...prev, customerId: e.target.value }))}
                required
                className="w-full border rounded-lg py-2 px-3 text-sm bg-white focus:outline-none"
                style={{ 
                  borderColor: PURPLE_COLORS.accent,
                  color: "#1F2937"
                }}
              >
                <option value="">Selecciona un cliente</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>{customer.nombre}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: PURPLE_COLORS.dark }}>Sucursal de retiro *</label>
            <select
              value={createForm.store}
              onChange={(e) => setCreateForm(prev => ({ ...prev, store: e.target.value }))}
              required
              className="w-full border rounded-lg py-2 px-3 text-sm bg-white focus:outline-none"
              style={{ 
                borderColor: PURPLE_COLORS.accent,
                color: "#1F2937"
              }}
            >
              <option value="Matriz">Matriz</option>
              <option value="Sucursal 1">Sucursal 1</option>
              <option value="Sucursal 2">Sucursal 2</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: PURPLE_COLORS.dark }}>Producto *</label>
            {loadingProducts ? (
              <div className="text-sm" style={{ color: PURPLE_COLORS.secondary }}>Cargando productos...</div>
            ) : (
              <select
                value={createForm.productId}
                onChange={(e) => {
                  const product = products.find(p => p.id === Number(e.target.value))
                  const variant = product?.variantes?.[0]
                  setCreateForm(prev => ({
                    ...prev,
                    productId: e.target.value,
                    variantId: variant ? String(variant.id) : "",
                  }))
                }}
                required
                className="w-full border rounded-lg py-2 px-3 text-sm bg-white focus:outline-none"
                style={{ 
                  borderColor: PURPLE_COLORS.accent,
                  color: "#1F2937"
                }}
              >
                <option value="">Selecciona un producto</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>{product.nombre}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: PURPLE_COLORS.dark }}>Variante *</label>
            <select
              value={createForm.variantId}
              onChange={(e) => setCreateForm(prev => ({ ...prev, variantId: e.target.value }))}
              required
              disabled={!selectedProduct || availableVariants.length === 0}
              className="w-full border rounded-lg py-2 px-3 text-sm bg-white focus:outline-none disabled:opacity-50"
              style={{ 
                borderColor: PURPLE_COLORS.accent,
                color: "#1F2937"
              }}
            >
              <option value="">Selecciona una variante</option>
              {availableVariants.map(variant => (
                <option key={variant.id} value={variant.id}>
                  {variant.nombre || `Variante ${variant.id}`} - {formatCurrency(variant.precio || 0)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: PURPLE_COLORS.dark }}>Cantidad *</label>
            <input
              type="number"
              min="1"
              value={createForm.qty}
              onChange={(e) => setCreateForm(prev => ({ ...prev, qty: e.target.value }))}
              required
              className="w-full border rounded-lg py-2 px-3 text-sm bg-white focus:outline-none"
              style={{ 
                borderColor: PURPLE_COLORS.accent,
                color: "#1F2937"
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: PURPLE_COLORS.dark }}>Monto de depósito (Bs.)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={createForm.depositAmount}
              onChange={(e) => setCreateForm(prev => ({ ...prev, depositAmount: e.target.value }))}
              className="w-full border rounded-lg py-2 px-3 text-sm bg-white focus:outline-none"
              style={{ 
                borderColor: PURPLE_COLORS.accent,
                color: "#1F2937"
              }}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: PURPLE_COLORS.dark }}>Notas adicionales</label>
          <textarea
            value={createForm.notes}
            onChange={(e) => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            placeholder="Instrucciones especiales, fecha límite de retiro, etc."
            className="w-full border rounded-lg py-2 px-3 text-sm bg-white focus:outline-none"
            style={{ 
              borderColor: PURPLE_COLORS.accent,
              color: "#1F2937"
            }}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: PURPLE_COLORS.accent }}>
          <button
            type="button"
            onClick={() => setCreateForm({
              customerId: "",
              productId: "",
              variantId: "",
              qty: "1",
              depositAmount: "0",
              store: "Matriz",
              notes: "",
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
            disabled={saving || !createForm.customerId || !createForm.productId || !createForm.variantId}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-white transition-colors"
            style={{ backgroundColor: PURPLE_COLORS.primary }}
            onMouseEnter={(e) => !(saving || !createForm.customerId || !createForm.productId || !createForm.variantId) && (e.currentTarget.style.backgroundColor = PURPLE_COLORS.dark)}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.primary}
          >
            {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <CalendarCheck2 size={16} />}
            Registrar reserva
          </button>
        </div>
      </motion.form>
    )
  }

  const handleSelectReservationForPickup = async (reservationId: string) => {
    try {
      const reservation = await reservationsService.getReservation(Number(reservationId))
      setPickupForm(prev => ({
        ...prev,
        reservationId,
        confirmPickup: false,
        notes: "",
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar la reserva")
    }
  }

  const handlePickupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pickupForm.reservationId) {
      setError("Debes seleccionar una reserva")
      return
    }
    setSaving(true)
    setError(null)
    try {
      // TODO: Implementar cuando la API esté lista
      // if (pickupForm.confirmPickup) {
      //   await reservationsService.updateReservationStatus(Number(pickupForm.reservationId), "confirmed", {
      //     notas: pickupForm.notes,
      //   })
      // } else {
      //   await reservationsService.updateReservationStatus(Number(pickupForm.reservationId), "canceled", {
      //     notas: pickupForm.notes,
      //   })
      // }
      alert("La API de entregas está en construcción. Los datos se guardarán cuando esté disponible.")
      setPickupForm({
        reservationId: "",
        confirmPickup: false,
        notes: "",
      })
      void loadReservations()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar la entrega")
    } finally {
      setSaving(false)
    }
  }

  const renderPickupsInfo = () => {
    const selectedReservation = pendingPickups.find(r => r.id === Number(pickupForm.reservationId))
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
        key="reservation-pickups"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handlePickupSubmit}
        className="space-y-6 rounded-xl shadow-sm bg-white border p-6"
        style={{ borderColor: PURPLE_COLORS.accent }}
      >
        <h3 className="text-lg font-semibold" style={{ color: PURPLE_COLORS.dark }}>Entregas y retiros</h3>
        
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: PURPLE_COLORS.dark }}>Reserva pendiente de retiro *</label>
          <select
            value={pickupForm.reservationId}
            onChange={(e) => handleSelectReservationForPickup(e.target.value)}
            required
            className="w-full border rounded-lg py-2 px-3 text-sm bg-white focus:outline-none"
            style={{ 
              borderColor: PURPLE_COLORS.accent,
              color: "#1F2937"
            }}
          >
            <option value="">Selecciona una reserva</option>
            {pendingPickups.map(reservation => (
              <option key={reservation.id} value={reservation.id}>
                {reservation.reservationNumber} - Cliente {reservation.customerId} - {formatCurrency(reservation.depositAmount)}
              </option>
            ))}
          </select>
        </div>

        {selectedReservation && (
          <div className="border rounded-lg p-4" style={{ borderColor: PURPLE_COLORS.accent, backgroundColor: PURPLE_COLORS.accent + "40" }}>
            <div className="grid gap-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "#6B7280" }}>Cliente:</span>
                <span style={{ color: "#1F2937" }}>{selectedReservation.customerId}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#6B7280" }}>Producto:</span>
                <span style={{ color: "#1F2937" }}>Producto {selectedReservation.productId}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#6B7280" }}>Cantidad:</span>
                <span style={{ color: "#1F2937" }}>{selectedReservation.qty}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#6B7280" }}>Depósito:</span>
                <span style={{ color: "#1F2937" }}>{formatCurrency(selectedReservation.depositAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#6B7280" }}>Sucursal:</span>
                <span style={{ color: "#1F2937" }}>{selectedReservation.store}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#6B7280" }}>Estado:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded ${statusMeta[selectedReservation.status]?.badge ?? ""}`}>
                  {statusMeta[selectedReservation.status]?.label ?? selectedReservation.status}
                </span>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: PURPLE_COLORS.dark }}>Acción *</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="pickupAction"
                checked={pickupForm.confirmPickup}
                onChange={() => setPickupForm(prev => ({ ...prev, confirmPickup: true }))}
                style={{ accentColor: PURPLE_COLORS.primary }}
              />
              <span className="text-sm" style={{ color: "#1F2937" }}>Confirmar retiro/entrega</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="pickupAction"
                checked={!pickupForm.confirmPickup}
                onChange={() => setPickupForm(prev => ({ ...prev, confirmPickup: false }))}
                style={{ accentColor: PURPLE_COLORS.primary }}
              />
              <span className="text-sm" style={{ color: "#1F2937" }}>Cancelar reserva</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: PURPLE_COLORS.dark }}>Notas adicionales</label>
          <textarea
            value={pickupForm.notes}
            onChange={(e) => setPickupForm(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            placeholder="Observaciones sobre la entrega o cancelación..."
            className="w-full border rounded-lg py-2 px-3 text-sm bg-white focus:outline-none"
            style={{ 
              borderColor: PURPLE_COLORS.accent,
              color: "#1F2937"
            }}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: PURPLE_COLORS.accent }}>
          <button
            type="button"
            onClick={() => setPickupForm({
              reservationId: "",
              confirmPickup: false,
              notes: "",
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
            disabled={saving || !pickupForm.reservationId}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-white transition-colors"
            style={{ backgroundColor: PURPLE_COLORS.primary }}
            onMouseEnter={(e) => !(saving || !pickupForm.reservationId) && (e.currentTarget.style.backgroundColor = PURPLE_COLORS.dark)}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.primary}
          >
            {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <ShieldCheck size={16} />}
            {pickupForm.confirmPickup ? "Confirmar retiro" : "Cancelar reserva"}
          </button>
        </div>
      </motion.form>
    )
  }

  const renderPrintInfo = () => {
    const PURPLE_COLORS = {
      primary: "#8B5CF6",
      secondary: "#A78BFA",
      light: "#C4B5FD",
      dark: "#6D28D9",
      accent: "#EDE9FE",
    }

    return (
      <motion.div
        key="reservation-print"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3 rounded-xl shadow-sm bg-white border p-6"
        style={{ borderColor: PURPLE_COLORS.accent }}
      >
        <h3 className="text-lg font-semibold" style={{ color: PURPLE_COLORS.dark }}>Imprimir listado</h3>
        <p className="text-sm" style={{ color: "#6B7280" }}>
          Usa <span className="font-semibold" style={{ color: PURPLE_COLORS.dark }}>Ctrl + P</span> (o <span className="font-semibold" style={{ color: PURPLE_COLORS.dark }}>⌘ + P</span>) para generar un PDF con las reservas actuales. Activa la
          opción de fondos para conservar el estilo.
        </p>
        <p className="text-xs" style={{ color: "#9CA3AF" }}>Filtra desde el listado antes de imprimir si necesitas un subset específico.</p>
      </motion.div>
    )
  }

  const renderEmptyState = () => {
    const PURPLE_COLORS = {
      primary: "#8B5CF6",
      secondary: "#A78BFA",
      light: "#C4B5FD",
      dark: "#6D28D9",
      accent: "#EDE9FE",
    }

    return (
      <motion.div
        key="reservation-empty"
        initial={{ opacity: 0, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-dashed p-6"
        style={{ borderColor: PURPLE_COLORS.accent, backgroundColor: PURPLE_COLORS.accent + "40", color: "#6B7280" }}
      >
        Selecciona una acción del menú para gestionar las reservaciones.
      </motion.div>
    )
  }

  // Renderizar dashboard de reservaciones
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
          {/* Reservaciones por Estado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-xl p-6 shadow-sm bg-white border"
            style={{ borderColor: PURPLE_COLORS.accent }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>
                Reservaciones por Estado
              </h3>
              <select className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
                <option>Último Mes</option>
                <option>Último Año</option>
              </select>
            </div>
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
                  {totalReservations}
                </span>
                <span className="text-sm font-semibold" style={{ color: "#10B981" }}>
                  +10%
                </span>
              </div>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                Total de reservaciones registradas
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
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
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

          {/* Reservaciones Mensuales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-xl p-6 shadow-sm bg-white border"
            style={{ borderColor: PURPLE_COLORS.accent }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>
                Reservaciones Mensuales
              </h3>
              <select className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
                <option>Último Mes</option>
                <option>Último Año</option>
              </select>
            </div>
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
                  {confirmedReservations}
                </span>
                <span className="text-sm font-semibold" style={{ color: "#10B981" }}>
                  Confirmadas
                </span>
              </div>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                {((confirmedReservations / totalReservations) * 100).toFixed(1)}% del total
              </p>
            </div>
            <ChartContainer
              config={{
                reservaciones: { color: PURPLE_COLORS.primary },
                confirmadas: { color: "#10B981" },
              }}
              className="h-[250px]"
            >
              <BarChart data={monthlyReservationsData}>
                <CartesianGrid strokeDasharray="3 3" stroke={PURPLE_COLORS.accent} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: WHITE,
                    border: `1px solid ${PURPLE_COLORS.accent}`,
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="reservaciones" fill={PURPLE_COLORS.primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="confirmadas" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </motion.div>
        </div>

        {/* Fila Media: KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-xl p-5 shadow-sm bg-white border"
            style={{ borderColor: PURPLE_COLORS.accent }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium" style={{ color: PURPLE_COLORS.secondary }}>
                Total Reservaciones
              </p>
              <div className="p-2 rounded-lg" style={{ backgroundColor: PURPLE_COLORS.accent }}>
                <ClipboardList size={18} style={{ color: PURPLE_COLORS.primary }} />
              </div>
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: PURPLE_COLORS.dark }}>
              {totalReservations}
            </p>
            <p className="text-xs" style={{ color: "#10B981" }}>
              vs. Período anterior <span className="font-semibold">+10.2%</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-xl p-5 shadow-sm bg-white border"
            style={{ borderColor: PURPLE_COLORS.accent }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium" style={{ color: PURPLE_COLORS.secondary }}>
                Pendientes
              </p>
              <div className="p-2 rounded-lg" style={{ backgroundColor: PURPLE_COLORS.accent }}>
                <CalendarCheck2 size={18} style={{ color: PURPLE_COLORS.primary }} />
              </div>
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: PURPLE_COLORS.dark }}>
              {pendingReservations}
            </p>
            <p className="text-xs" style={{ color: "#F59E0B" }}>
              vs. Período anterior <span className="font-semibold">+5.3%</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="rounded-xl p-5 shadow-sm bg-white border"
            style={{ borderColor: PURPLE_COLORS.accent }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium" style={{ color: PURPLE_COLORS.secondary }}>
                Confirmadas
              </p>
              <div className="p-2 rounded-lg" style={{ backgroundColor: PURPLE_COLORS.accent }}>
                <ShieldCheck size={18} style={{ color: PURPLE_COLORS.primary }} />
              </div>
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: PURPLE_COLORS.dark }}>
              {confirmedReservations}
            </p>
            <p className="text-xs" style={{ color: "#10B981" }}>
              vs. Período anterior <span className="font-semibold">+15.7%</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="rounded-xl p-5 shadow-sm bg-white border"
            style={{ borderColor: PURPLE_COLORS.accent }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium" style={{ color: PURPLE_COLORS.secondary }}>
                Depósitos Totales
              </p>
              <div className="p-2 rounded-lg" style={{ backgroundColor: PURPLE_COLORS.accent }}>
                <DollarSign size={18} style={{ color: PURPLE_COLORS.primary }} />
              </div>
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: PURPLE_COLORS.dark }}>
              Bs. {totalDeposits.toLocaleString()}
            </p>
            <p className="text-xs" style={{ color: "#10B981" }}>
              vs. Período anterior <span className="font-semibold">+18.4%</span>
            </p>
          </motion.div>
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
              Tendencias de Reservaciones
            </h3>
            <select className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
              <option>Últimos 6 meses</option>
              <option>Último año</option>
            </select>
          </div>
          <div className="flex items-center gap-4 mb-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PURPLE_COLORS.primary }}></div>
              <span style={{ color: "#6B7280" }}>Reservaciones</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#10B981" }}></div>
              <span style={{ color: "#6B7280" }}>Confirmadas</span>
            </div>
          </div>
          <ChartContainer
            config={{
              reservaciones: { color: PURPLE_COLORS.primary },
              confirmadas: { color: "#10B981" },
            }}
            className="h-[300px]"
          >
            <LineChart data={monthlyReservationsData}>
              <CartesianGrid strokeDasharray="3 3" stroke={PURPLE_COLORS.accent} />
              <XAxis 
                dataKey="month" 
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />
              <YAxis 
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: WHITE,
                  border: `1px solid ${PURPLE_COLORS.accent}`,
                  borderRadius: "8px",
                }}
              />
              <Line 
                type="monotone" 
                dataKey="reservaciones" 
                stroke={PURPLE_COLORS.primary} 
                strokeWidth={2}
                dot={{ fill: PURPLE_COLORS.primary, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="confirmadas" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ fill: "#10B981", r: 4 }}
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
        return renderReservationList()
      case "create":
        return renderCreateReservation()
      case "pickups":
        return renderPickupsInfo()
      case "print":
        return renderPrintInfo()
      default:
        return renderDashboard()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--admin-text-primary)" }}>Reservaciones</h1>
        <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>
          Gestiona apartados, depósitos y entregas de productos
        </p>
      </div>

      {error && (
        <div className="border border-red-700 bg-red-900/30 text-red-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <X size={16} /> {error}
        </div>
      )}

      <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>

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
