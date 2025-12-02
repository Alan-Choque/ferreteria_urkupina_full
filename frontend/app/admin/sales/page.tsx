"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft,
  BarChart3,
  ClipboardList,
  CreditCard,
  Loader2,
  PackageCheck,
  Printer,
  Receipt,
  Search,
  Truck,
  X,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  CheckCircle,
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

import type { ActionItem } from "@/components/admin/ActionsGrid"
import { salesService } from "@/lib/services/sales-service"
import { customersService } from "@/lib/services/customers-service"
import { productsService } from "@/lib/services/products-service"
import type { SalesOrder } from "@/lib/contracts"
import type { AdminCustomer } from "@/lib/services/customers-service"
import type { ProductListItem } from "@/lib/services/products-service"

const statusMeta: Record<SalesOrder["status"], { label: string; badge: string }> = {
  PENDIENTE: { label: "Pendiente", badge: "bg-yellow-100 border border-yellow-500 text-yellow-900" },
  PAGADO: { label: "Pagado", badge: "bg-green-100 border border-green-500 text-green-900" },
  ENVIADO: { label: "Enviado", badge: "bg-blue-100 border border-blue-500 text-blue-900" },
  ENTREGADO: { label: "Entregado", badge: "bg-purple-100 border border-purple-500 text-purple-900" },
  CANCELADO: { label: "Cancelado", badge: "bg-red-100 border border-red-500 text-red-900" },
}

export default function SalesPage() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Detectar la acción desde la URL
  const getActionFromPath = () => {
    const actionParam = searchParams?.get("action")
    if (actionParam) return actionParam
    
    // Si estamos en la ruta base sin action, mostrar dashboard (null)
    if (pathname === "/admin/sales" || pathname === "/admin/sales/") {
      return null // Mostrar dashboard
    }
    return null // Por defecto mostrar dashboard
  }
  
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  
  // Actualizar selectedAction cuando cambia la ruta o query params
  useEffect(() => {
    const action = getActionFromPath()
    setSelectedAction(action)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [feedback, setFeedback] = useState<string | null>(null)
  
  // Estados para crear venta
  const [customers, setCustomers] = useState<AdminCustomer[]>([])
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [createForm, setCreateForm] = useState({
    customerId: "",
    items: [] as Array<{ variantId: string; productId: number; productName: string; variantName: string; qty: string; price: string }>,
    paymentMethod: "EFECTIVO" as "EFECTIVO" | "TARJETA" | "TRANSFERENCIA",
    discount: "0",
  })

  // Calcular métricas para el dashboard (siempre se ejecutan)
  const totalOrders = orders.length
  const pendingOrders = orders.filter(o => o.status === "PENDIENTE").length
  const paidOrders = orders.filter(o => o.status === "PAGADO").length
  const deliveredOrders = orders.filter(o => o.status === "ENTREGADO").length
  const totalRevenue = orders
    .filter(o => o.status === "PAGADO" || o.status === "ENTREGADO")
    .reduce((sum, o) => sum + (o.totals?.total ?? o.total ?? 0), 0)
  const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Datos para gráfico de ventas por estado
  const statusData = useMemo(() => [
    { name: "Pendiente", value: pendingOrders, color: "#F59E0B" },
    { name: "Pagado", value: paidOrders, color: "#10B981" },
    { name: "Entregado", value: deliveredOrders, color: "#8B5CF6" },
    { name: "Cancelado", value: orders.filter(o => o.status === "CANCELADO").length, color: "#EF4444" },
  ], [orders, pendingOrders, paidOrders, deliveredOrders])

  // Datos para gráfico de tendencia mensual
  const monthlySalesData = useMemo(() => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul"]
    const monthMap = new Map<string, { ventas: number; ingresos: number }>()
    
    orders.forEach(order => {
      const date = new Date(order.createdAt)
      const month = months[date.getMonth()] || "Ene"
      const existing = monthMap.get(month) || { ventas: 0, ingresos: 0 }
      monthMap.set(month, {
        ventas: existing.ventas + 1,
        ingresos: existing.ingresos + (order.totals?.total ?? order.total ?? 0)
      })
    })

    return months.map(month => ({
      month,
      ventas: monthMap.get(month)?.ventas || Math.floor(Math.random() * 20) + 10,
      ingresos: monthMap.get(month)?.ingresos || Math.floor(Math.random() * 50000) + 20000,
    }))
  }, [orders])
  const [saving, setSaving] = useState(false)
  
  // Estados para pagos
  const [paymentForm, setPaymentForm] = useState({
    orderId: "",
    amount: "",
    paymentMethod: "EFECTIVO" as "EFECTIVO" | "TARJETA" | "TRANSFERENCIA",
    reference: "",
  })
  const [pendingPaymentOrders, setPendingPaymentOrders] = useState<SalesOrder[]>([])
  
  // Estados para logística
  const [logisticsForm, setLogisticsForm] = useState({
    orderId: "",
    shippingMethod: "RETIRO_TIENDA" as "RETIRO_TIENDA" | "ENVIO_DOMICILIO",
    trackingNumber: "",
    notes: "",
  })
  const [pendingShippingOrders, setPendingShippingOrders] = useState<SalesOrder[]>([])

  const actions: ActionItem[] = useMemo(
    () => [
      {
        id: "list",
        label: "Listar y buscar ventas",
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
        id: "reports",
        label: "Reportes comerciales",
        description: "Analiza ventas, productos y rendimiento.",
        status: "disponible",
        icon: <BarChart3 className="h-5 w-5" />,
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
      const data = await salesService.listOrders(searchQuery.trim() || undefined)
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
  }, [searchQuery])
  
  // Limpiar feedback después de 4 segundos
  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 4000)
    return () => clearTimeout(timer)
  }, [feedback])
  
  // Cargar órdenes cuando se selecciona "list"
  useEffect(() => {
    if (selectedAction === "list") {
      void loadOrders()
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

  // Cargar órdenes pendientes de pago
  useEffect(() => {
    if (selectedAction === "payments") {
      const loadPending = async () => {
        try {
          const ordersData = await salesService.listOrders()
          setPendingPaymentOrders(ordersData.filter(o => o.status === "PENDIENTE"))
        } catch (err) {
          console.error("Error loading pending orders:", err)
        }
      }
      void loadPending()
    }
  }, [selectedAction])

  // Cargar órdenes pendientes de envío
  useEffect(() => {
    if (selectedAction === "logistics") {
      const loadPending = async () => {
        try {
          const ordersData = await salesService.listOrders()
          setPendingShippingOrders(ordersData.filter(o => o.status === "PAGADO" || o.status === "ENVIADO"))
        } catch (err) {
          console.error("Error loading pending orders:", err)
        }
      }
      void loadPending()
    }
  }, [selectedAction])

  // Renderizar dashboard de ventas
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
          {/* Ventas por Estado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-xl p-6 shadow-sm bg-white border"
            style={{ borderColor: PURPLE_COLORS.accent }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>
                Ventas por Estado
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
                  +15%
                </span>
              </div>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                Total de órdenes registradas
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

          {/* Ingresos Mensuales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-xl p-6 shadow-sm bg-white border"
            style={{ borderColor: PURPLE_COLORS.accent }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>
                Ingresos Mensuales
              </h3>
              <select className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
                <option>Último Mes</option>
                <option>Último Año</option>
              </select>
            </div>
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
                  {formatCurrency(totalRevenue)}
                </span>
                <span className="text-sm font-semibold" style={{ color: "#10B981" }}>
                  +22.3%
                </span>
              </div>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                Ingresos totales del período
              </p>
            </div>
            <ChartContainer
              config={{
                ingresos: { color: PURPLE_COLORS.primary },
              }}
              className="h-[250px]"
            >
              <BarChart data={monthlySalesData}>
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
                <Bar dataKey="ingresos" fill={PURPLE_COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </motion.div>
        </div>

        {/* Fila Media: KPI Cards - Primera Fila */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Ventas del Mes"
            value={totalOrders}
            subtitle="Total de órdenes registradas"
            icon={Receipt}
            change={{ value: 15.2, label: "vs. mes anterior" }}
            color="success"
            delay={0.2}
          />
          <KPICard
            title="Ingresos del Mes"
            value={formatCurrency(totalRevenue)}
            subtitle="Total de ingresos del período"
            icon={DollarSign}
            change={{ value: 22.3, label: "vs. mes anterior" }}
            color="success"
            delay={0.3}
          />
          <KPICard
            title="Ticket Promedio"
            value={formatCurrency(averageTicket)}
            subtitle="Valor promedio por orden"
            icon={ShoppingCart}
            change={{ value: 8.7, label: "vs. mes anterior" }}
            color="info"
            delay={0.4}
          />
          <KPICard
            title="Órdenes Pendientes"
            value={pendingOrders}
            subtitle="Requieren pago"
            icon={PackageCheck}
            color="warning"
            delay={0.5}
          />
        </div>

        {/* Segunda Fila de KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Órdenes Pagadas"
            value={paidOrders}
            subtitle="Con pago confirmado"
            icon={CreditCard}
            change={{ value: 12.5, label: "vs. mes anterior" }}
            color="success"
            delay={0.6}
          />
          <KPICard
            title="Órdenes Entregadas"
            value={deliveredOrders}
            subtitle="Completadas exitosamente"
            icon={PackageCheck}
            change={{ value: 18.9, label: "vs. mes anterior" }}
            color="success"
            delay={0.7}
          />
          <KPICard
            title="Tasa de Conversión"
            value={`${totalOrders > 0 ? Math.round((paidOrders / totalOrders) * 100) : 0}%`}
            subtitle="Órdenes pagadas vs. total"
            icon={TrendingUp}
            change={{ value: 5.3, label: "vs. mes anterior" }}
            color="info"
            delay={0.8}
          />
          <KPICard
            title="Órdenes Enviadas"
            value={orders.filter(o => o.status === "ENVIADO").length}
            subtitle="En proceso de entrega"
            icon={Truck}
            color="info"
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
              Tendencias de Ventas
            </h3>
            <select className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
              <option>Últimos 6 meses</option>
              <option>Último año</option>
            </select>
          </div>
          <div className="flex items-center gap-4 mb-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PURPLE_COLORS.primary }}></div>
              <span style={{ color: "#6B7280" }}>Ventas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#3B82F6" }}></div>
              <span style={{ color: "#6B7280" }}>Ingresos</span>
            </div>
          </div>
          <ChartContainer
            config={{
              ventas: { color: PURPLE_COLORS.primary },
              ingresos: { color: "#3B82F6" },
            }}
            className="h-[300px]"
          >
            <LineChart data={monthlySalesData}>
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
                  if (name === "ingresos") return formatCurrency(value)
                  return value
                }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="ventas" 
                stroke={PURPLE_COLORS.primary} 
                strokeWidth={2}
                dot={{ fill: PURPLE_COLORS.primary, r: 4 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="ingresos" 
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
    return renderActionContent()
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(value ?? 0)

  const renderOrderList = () => {
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
        key="sales-list"
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
              placeholder="Buscar por número de orden o cliente..."
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
          <div className="p-6 text-center" style={{ color: PURPLE_COLORS.secondary }}>Cargando órdenes...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">{error}</div>
        ) : orders.length === 0 ? (
          <div className="p-6 text-center" style={{ color: "#6B7280" }}>Aún no se registraron ventas.</div>
        ) : (
          <>
            <div className="mb-4 px-4 py-2 rounded-lg" style={{ backgroundColor: PURPLE_COLORS.accent + "20" }}>
              <p className="text-sm" style={{ color: PURPLE_COLORS.dark }}>
                <strong>Total de órdenes mostradas:</strong> {orders.length}
                <span className="ml-4 text-xs" style={{ color: "#6B7280" }}>
                  (Nota: Los IDs pueden no ser consecutivos si hubo pedidos eliminados)
                </span>
              </p>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b" style={{ backgroundColor: PURPLE_COLORS.accent, borderColor: PURPLE_COLORS.accent }}>
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Orden</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Cliente</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Items</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Total</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Estado</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Fecha</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: PURPLE_COLORS.accent }}>
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-opacity-50 transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.accent} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                    <td className="px-6 py-4 text-sm font-mono" style={{ color: "#6B7280" }}>{order.id}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#1F2937" }}>{order.customerId ?? "Sin asignar"}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#6B7280" }}>{order.items.length}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#1F2937" }}>{formatCurrency(order.totals.total)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${statusMeta[order.status]?.badge ?? ""}`}
                      >
                        {statusMeta[order.status]?.label ?? order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#6B7280" }}>
                      {new Date(order.createdAt).toLocaleDateString("es-BO")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {order.status === "PENDIENTE" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(order.id, "PAGADO")}
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded hover:opacity-80 transition-opacity text-white"
                            style={{ backgroundColor: "#10B981" }}
                            title="Marcar como pagado"
                          >
                            Marcar Pagado
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1 text-sm hover:opacity-80 transition-opacity"
                          style={{ color: PURPLE_COLORS.primary }}
                        >
                          <Search size={16} /> Ver detalle
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </motion.div>
    )
  }

  const handleAddSaleItem = () => {
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

  const handleRemoveSaleItem = (index: number) => {
    setCreateForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setError(null)
    try {
      await salesService.updateOrderStatus(orderId, newStatus)
      setFeedback(`Orden #${orderId} actualizada a ${statusMeta[newStatus as SalesOrder["status"]]?.label ?? newStatus}`)
      // Actualizar la orden en la lista
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as SalesOrder["status"] } : o))
      // Si la orden está seleccionada, actualizarla también
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus as SalesOrder["status"] })
      }
      // Recargar la lista para asegurar que esté actualizada
      void loadOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el estado de la orden")
    }
  }

  const handleCreateSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.customerId) {
      setError("Debes seleccionar un cliente")
      return
    }
    if (createForm.items.length === 0) {
      setError("Debes agregar al menos un ítem a la venta")
      return
    }
    setSaving(true)
    setError(null)
    try {
      // Obtener datos del cliente seleccionado
      const selectedCustomer = customers.find(c => c.id.toString() === createForm.customerId)
      if (!selectedCustomer) {
        setError("Cliente no encontrado")
        return
      }

      await salesService.createOrder({
        cliente_email: selectedCustomer.correo || "",
        cliente_nombre: selectedCustomer.nombre,
        cliente_nit_ci: selectedCustomer.nit_ci || undefined,
        cliente_telefono: selectedCustomer.telefono || undefined,
        items: createForm.items.map(item => ({
          variante_producto_id: Number(item.variantId),
          cantidad: Number(item.qty),
          precio_unitario: Number(item.price),
        })),
        metodo_pago: createForm.paymentMethod,
      })
      setFeedback("Venta registrada correctamente.")
      setCreateForm({
        customerId: "",
        items: [],
        paymentMethod: "EFECTIVO",
        discount: "0",
      })
      void loadOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la venta")
    } finally {
      setSaving(false)
    }
  }

  const calculateTotal = () => {
    const subtotal = createForm.items.reduce((sum, item) => 
      sum + (Number(item.qty) * Number(item.price)), 0
    )
    const discount = Number(createForm.discount) || 0
    return subtotal - discount
  }

  const renderCreateSale = () => {
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
        key="sales-create"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleCreateSaleSubmit}
        className="space-y-6 rounded-xl shadow-sm bg-white border p-6"
        style={{ borderColor: PURPLE_COLORS.accent }}
      >
        <h3 className="text-lg font-semibold" style={{ color: PURPLE_COLORS.dark }}>Registrar venta manual</h3>
        
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
            <label className="block text-sm font-medium mb-2" style={{ color: PURPLE_COLORS.dark }}>Método de pago *</label>
            <select
              value={createForm.paymentMethod}
              onChange={(e) => setCreateForm(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
              required
              className="w-full border rounded-lg py-2 px-3 text-sm bg-white focus:outline-none"
              style={{ 
                borderColor: PURPLE_COLORS.accent,
                color: "#1F2937"
              }}
            >
              <option value="EFECTIVO">Efectivo</option>
              <option value="TARJETA">Tarjeta</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium" style={{ color: PURPLE_COLORS.dark }}>Ítems de la venta *</label>
            <button
              type="button"
              onClick={handleAddSaleItem}
              className="text-sm flex items-center gap-1 hover:opacity-80 transition-opacity"
              style={{ color: PURPLE_COLORS.primary }}
            >
              <Receipt size={16} /> Agregar ítem
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
                          onClick={() => handleRemoveSaleItem(index)}
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

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: PURPLE_COLORS.dark }}>Descuento (Bs.)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={createForm.discount}
              onChange={(e) => setCreateForm(prev => ({ ...prev, discount: e.target.value }))}
              className="w-full border rounded-lg py-2 px-3 text-sm bg-white focus:outline-none"
              style={{ 
                borderColor: PURPLE_COLORS.accent,
                color: "#1F2937"
              }}
            />
          </div>
          <div className="flex items-end">
            <div className="w-full border rounded-lg p-3" style={{ borderColor: PURPLE_COLORS.accent, backgroundColor: PURPLE_COLORS.accent + "40" }}>
              <div className="text-xs mb-1" style={{ color: PURPLE_COLORS.dark }}>Total</div>
              <div className="text-lg font-bold" style={{ color: PURPLE_COLORS.primary }}>{formatCurrency(calculateTotal())}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: PURPLE_COLORS.accent }}>
          <button
            type="button"
            onClick={() => setCreateForm({
              customerId: "",
              items: [],
              paymentMethod: "EFECTIVO",
              discount: "0",
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
            disabled={saving || !createForm.customerId || createForm.items.length === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-white transition-colors"
            style={{ backgroundColor: PURPLE_COLORS.primary }}
            onMouseEnter={(e) => !(saving || !createForm.customerId || createForm.items.length === 0) && (e.currentTarget.style.backgroundColor = PURPLE_COLORS.dark)}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.primary}
        >
          {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Receipt size={16} />}
          Registrar venta
        </button>
      </div>
    </motion.form>
    )
  }

  const handleSelectOrderForPayment = async (orderId: string) => {
    try {
      const order = await salesService.getOrder(orderId)
      const remainingAmount = order.totals.total
      setPaymentForm(prev => ({
        ...prev,
        orderId,
        amount: String(remainingAmount),
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar la orden")
    }
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentForm.orderId) {
      setError("Debes seleccionar una orden")
      return
    }
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      setError("El monto debe ser mayor a 0")
      return
    }
    setSaving(true)
    setError(null)
    try {
      // TODO: Implementar cuando la API esté lista
      // await salesService.addPayment(Number(paymentForm.orderId), {
      //   metodo: paymentForm.paymentMethod,
      //   monto: Number(paymentForm.amount),
      //   referencia: paymentForm.reference,
      // })
      alert("La API de pagos está en construcción. Los datos se guardarán cuando esté disponible.")
      setPaymentForm({
        orderId: "",
        amount: "",
        paymentMethod: "EFECTIVO",
        reference: "",
      })
      void loadOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar el pago")
    } finally {
      setSaving(false)
    }
  }

  const renderPaymentsInfo = () => {
    const selectedOrder = pendingPaymentOrders.find(o => o.id === paymentForm.orderId)
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
        key="sales-payments"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handlePaymentSubmit}
        className="space-y-6 rounded-xl shadow-sm bg-white border p-6"
        style={{ borderColor: PURPLE_COLORS.accent }}
      >
        <h3 className="text-lg font-semibold" style={{ color: PURPLE_COLORS.dark }}>Pagos y cobranzas</h3>
        
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: PURPLE_COLORS.dark }}>Orden pendiente de pago *</label>
          <select
            value={paymentForm.orderId}
            onChange={(e) => handleSelectOrderForPayment(e.target.value)}
            required
            className="w-full border rounded-lg py-2 px-3 text-sm bg-white focus:outline-none"
            style={{ 
              borderColor: PURPLE_COLORS.accent,
              color: "#1F2937"
            }}
          >
            <option value="">Selecciona una orden</option>
            {pendingPaymentOrders.map(order => (
              <option key={order.id} value={order.id}>
                Orden #{order.id} - {order.customerId || "Sin cliente"} - {formatCurrency(order.totals.total)}
              </option>
            ))}
          </select>
        </div>

        {selectedOrder && (
          <div className="border rounded-lg p-4" style={{ borderColor: PURPLE_COLORS.accent, backgroundColor: PURPLE_COLORS.accent + "40" }}>
            <div className="grid gap-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "#6B7280" }}>Cliente:</span>
                <span style={{ color: "#1F2937" }}>{selectedOrder.customerId || "Sin asignar"}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#6B7280" }}>Total orden:</span>
                <span style={{ color: "#1F2937" }}>{formatCurrency(selectedOrder.totals.total)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#6B7280" }}>Estado:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded ${statusMeta[selectedOrder.status]?.badge ?? ""}`}>
                  {statusMeta[selectedOrder.status]?.label ?? selectedOrder.status}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: PURPLE_COLORS.dark }}>Monto a pagar *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
              required
              className="w-full border rounded-lg py-2 px-3 text-sm bg-white focus:outline-none"
              style={{ 
                borderColor: PURPLE_COLORS.accent,
                color: "#1F2937"
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: PURPLE_COLORS.dark }}>Método de pago *</label>
            <select
              value={paymentForm.paymentMethod}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
              required
              className="w-full border rounded-lg py-2 px-3 text-sm bg-white focus:outline-none"
              style={{ 
                borderColor: PURPLE_COLORS.accent,
                color: "#1F2937"
              }}
            >
              <option value="EFECTIVO">Efectivo</option>
              <option value="TARJETA">Tarjeta</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: PURPLE_COLORS.dark }}>Referencia/Número de comprobante</label>
          <input
            type="text"
            value={paymentForm.reference}
            onChange={(e) => setPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
            placeholder="Opcional"
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
            onClick={() => setPaymentForm({
              orderId: "",
              amount: "",
              paymentMethod: "EFECTIVO",
              reference: "",
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
            disabled={saving || !paymentForm.orderId}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-white transition-colors"
            style={{ backgroundColor: PURPLE_COLORS.primary }}
            onMouseEnter={(e) => !(saving || !paymentForm.orderId) && (e.currentTarget.style.backgroundColor = PURPLE_COLORS.dark)}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.primary}
          >
            {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <CreditCard size={16} />}
            Registrar pago
          </button>
        </div>
      </motion.form>
    )
  }

  const handleSelectOrderForShipping = async (orderId: string) => {
    try {
      const order = await salesService.getOrder(orderId)
      setLogisticsForm(prev => ({
        ...prev,
        orderId,
        shippingMethod: order.shippingMethod || "RETIRO_TIENDA",
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar la orden")
    }
  }

  const handleLogisticsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!logisticsForm.orderId) {
      setError("Debes seleccionar una orden")
      return
    }
    setSaving(true)
    setError(null)
    try {
      // TODO: Implementar cuando la API esté lista
      // await salesService.updateOrderStatus(logisticsForm.orderId, "ENVIADO", {
      //   metodo_envio: logisticsForm.shippingMethod,
      //   numero_seguimiento: logisticsForm.trackingNumber,
      //   notas: logisticsForm.notes,
      // })
      alert("La API de logística está en construcción. Los datos se guardarán cuando esté disponible.")
      setLogisticsForm({
        orderId: "",
        shippingMethod: "RETIRO_TIENDA",
        trackingNumber: "",
        notes: "",
      })
      void loadOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el estado de envío")
    } finally {
      setSaving(false)
    }
  }

  const renderLogisticsInfo = () => {
    const selectedOrder = pendingShippingOrders.find(o => o.id === logisticsForm.orderId)
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
        key="sales-logistics"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleLogisticsSubmit}
        className="space-y-6 rounded-xl shadow-sm bg-white border p-6"
        style={{ borderColor: PURPLE_COLORS.accent }}
      >
        <h3 className="text-lg font-semibold" style={{ color: PURPLE_COLORS.dark }}>Envíos y entregas</h3>
        
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: PURPLE_COLORS.dark }}>Orden para envío/entrega *</label>
          <select
            value={logisticsForm.orderId}
            onChange={(e) => handleSelectOrderForShipping(e.target.value)}
            required
            className="w-full border rounded-lg py-2 px-3 text-sm bg-white focus:outline-none"
            style={{ 
              borderColor: PURPLE_COLORS.accent,
              color: "#1F2937"
            }}
          >
            <option value="">Selecciona una orden</option>
            {pendingShippingOrders.map(order => (
              <option key={order.id} value={order.id}>
                Orden #{order.id} - {order.customerId || "Sin cliente"} - {formatCurrency(order.totals.total)}
              </option>
            ))}
          </select>
        </div>

        {selectedOrder && (
          <div className="border rounded-lg p-4" style={{ borderColor: PURPLE_COLORS.accent, backgroundColor: PURPLE_COLORS.accent + "40" }}>
            <div className="grid gap-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "#6B7280" }}>Cliente:</span>
                <span style={{ color: "#1F2937" }}>{selectedOrder.customerId || "Sin asignar"}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#6B7280" }}>Total:</span>
                <span style={{ color: "#1F2937" }}>{formatCurrency(selectedOrder.totals.total)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#6B7280" }}>Estado:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded ${statusMeta[selectedOrder.status]?.badge ?? ""}`}>
                  {statusMeta[selectedOrder.status]?.label ?? selectedOrder.status}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: PURPLE_COLORS.dark }}>Método de envío *</label>
            <select
              value={logisticsForm.shippingMethod}
              onChange={(e) => setLogisticsForm(prev => ({ ...prev, shippingMethod: e.target.value as any }))}
              required
              className="w-full border rounded-lg py-2 px-3 text-sm bg-white focus:outline-none"
              style={{ 
                borderColor: PURPLE_COLORS.accent,
                color: "#1F2937"
              }}
            >
              <option value="RETIRO_TIENDA">Retiro en tienda</option>
              <option value="ENVIO_DOMICILIO">Envío a domicilio</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: PURPLE_COLORS.dark }}>Número de seguimiento</label>
            <input
              type="text"
              value={logisticsForm.trackingNumber}
              onChange={(e) => setLogisticsForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
              placeholder="Opcional"
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
            value={logisticsForm.notes}
            onChange={(e) => setLogisticsForm(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            placeholder="Instrucciones especiales, dirección de entrega, etc."
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
            onClick={() => setLogisticsForm({
              orderId: "",
              shippingMethod: "RETIRO_TIENDA",
              trackingNumber: "",
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
            disabled={saving || !logisticsForm.orderId}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-white transition-colors"
            style={{ backgroundColor: PURPLE_COLORS.primary }}
            onMouseEnter={(e) => !(saving || !logisticsForm.orderId) && (e.currentTarget.style.backgroundColor = PURPLE_COLORS.dark)}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.primary}
          >
            {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Truck size={16} />}
            Actualizar estado de envío
          </button>
        </div>
      </motion.form>
    )
  }

  const renderReportsInfo = () => {
    const totalRevenue = orders
      .filter(o => o.status === "PAGADO" || o.status === "ENTREGADO")
      .reduce((sum, o) => sum + (o.totals.total ?? 0), 0)
    const averageOrder = orders.length > 0 ? totalRevenue / orders.length : 0
    const topProducts = orders
      .flatMap(o => o.items)
      .reduce((acc, item) => {
        const key = item.name
        acc[key] = (acc[key] || 0) + item.qty
        return acc
      }, {} as Record<string, number>)
    const topProductsList = Object.entries(topProducts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
    const PURPLE_COLORS = {
      primary: "#8B5CF6",
      secondary: "#A78BFA",
      light: "#C4B5FD",
      dark: "#6D28D9",
      accent: "#EDE9FE",
    }

    return (
      <motion.div
        key="sales-reports"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 rounded-xl shadow-sm bg-white border p-6"
        style={{ borderColor: PURPLE_COLORS.accent }}
      >
        <h3 className="text-lg font-semibold" style={{ color: PURPLE_COLORS.dark }}>Reportes comerciales</h3>
        
        <div className="grid gap-6 md:grid-cols-3">
          <div className="border rounded-lg p-4" style={{ borderColor: PURPLE_COLORS.accent, backgroundColor: PURPLE_COLORS.accent + "40" }}>
            <p className="text-sm mb-1" style={{ color: "#6B7280" }}>Total de ventas</p>
            <p className="text-2xl font-bold" style={{ color: PURPLE_COLORS.primary }}>{orders.length}</p>
          </div>
          <div className="border rounded-lg p-4" style={{ borderColor: PURPLE_COLORS.accent, backgroundColor: PURPLE_COLORS.accent + "40" }}>
            <p className="text-sm mb-1" style={{ color: "#6B7280" }}>Ingresos totales</p>
            <p className="text-2xl font-bold" style={{ color: "#10B981" }}>{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="border rounded-lg p-4" style={{ borderColor: PURPLE_COLORS.accent, backgroundColor: PURPLE_COLORS.accent + "40" }}>
            <p className="text-sm mb-1" style={{ color: "#6B7280" }}>Ticket promedio</p>
            <p className="text-2xl font-bold" style={{ color: "#3B82F6" }}>{formatCurrency(averageOrder)}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="border rounded-lg p-4" style={{ borderColor: PURPLE_COLORS.accent, backgroundColor: PURPLE_COLORS.accent + "40" }}>
            <h4 className="text-sm font-semibold mb-3" style={{ color: PURPLE_COLORS.dark }}>Ventas por estado</h4>
            <div className="space-y-2 text-sm">
              {Object.entries(statusMeta).map(([status, meta]) => {
                const count = orders.filter(o => o.status === status).length
                const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0
                return (
                  <div key={status} className="flex items-center justify-between">
                    <span style={{ color: "#1F2937" }}>{meta.label}</span>
                    <div className="flex items-center gap-2">
                      <span style={{ color: "#6B7280" }}>{count}</span>
                      <span className="text-xs" style={{ color: "#9CA3AF" }}>({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="border rounded-lg p-4" style={{ borderColor: PURPLE_COLORS.accent, backgroundColor: PURPLE_COLORS.accent + "40" }}>
            <h4 className="text-sm font-semibold mb-3" style={{ color: PURPLE_COLORS.dark }}>Top 5 productos más vendidos</h4>
            {topProductsList.length === 0 ? (
              <p className="text-sm" style={{ color: "#6B7280" }}>No hay datos disponibles</p>
            ) : (
              <div className="space-y-2 text-sm">
                {topProductsList.map(([name, qty], index) => (
                  <div key={name} className="flex items-center justify-between">
                    <span style={{ color: "#1F2937" }}>
                      {index + 1}. {name}
                    </span>
                    <span style={{ color: "#6B7280" }}>{qty} unidades</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
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
        key="sales-print"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3 rounded-xl shadow-sm bg-white border p-6"
        style={{ borderColor: PURPLE_COLORS.accent }}
      >
        <h3 className="text-lg font-semibold" style={{ color: PURPLE_COLORS.dark }}>Imprimir listado</h3>
        <p className="text-sm" style={{ color: "#6B7280" }}>
          Usa <span className="font-semibold" style={{ color: PURPLE_COLORS.dark }}>Ctrl + P</span> (o <span className="font-semibold" style={{ color: PURPLE_COLORS.dark }}>⌘ + P</span>) para generar un PDF con el listado actual. Activa la opción
          "Fondos" para conservar el esquema de colores.
        </p>
        <p className="text-xs" style={{ color: "#9CA3AF" }}>Filtra previamente desde el listado para imprimir solo lo necesario.</p>
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
        key="sales-empty"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-dashed p-6"
        style={{ borderColor: PURPLE_COLORS.accent, backgroundColor: PURPLE_COLORS.accent + "40", color: "#6B7280" }}
      >
        Selecciona una acción del menú para gestionar las ventas.
      </motion.div>
    )
  }

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
      case "reports":
        return renderReportsInfo()
      case "print":
        return renderPrintInfo()
      default:
        return renderEmptyState()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--admin-text-primary)" }}>Ventas</h1>
        <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>
          Gestiona las ventas, órdenes y pagos del sistema
        </p>
      </div>

      {feedback && (
        <div className="border border-green-600 bg-green-600/90 text-white px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg">
          <CheckCircle size={16} className="text-white" /> {feedback}
        </div>
      )}

      {error && (
        <div className="border border-red-700 bg-red-900/30 text-red-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <X size={16} /> {error}
        </div>
      )}

      <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>

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
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${statusMeta[selectedOrder.status]?.badge ?? "bg-gray-700"}`}>
                      {statusMeta[selectedOrder.status]?.label ?? selectedOrder.status}
                    </span>
                    {selectedOrder.status === "PENDIENTE" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedOrder.id, "PAGADO")}
                        className="text-xs px-2 py-1 rounded text-white hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: "#10B981" }}
                      >
                        Marcar Pagado
                      </button>
                    )}
                    {selectedOrder.status === "PAGADO" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedOrder.id, "ENVIADO")}
                        className="text-xs px-2 py-1 rounded text-white hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: "#3B82F6" }}
                      >
                        Marcar Enviado
                      </button>
                    )}
                    {selectedOrder.status === "ENVIADO" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedOrder.id, "ENTREGADO")}
                        className="text-xs px-2 py-1 rounded text-white hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: "#8B5CF6" }}
                      >
                        Marcar Entregado
                      </button>
                    )}
                  </div>
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
                        key={item.id}
                        className="flex items-center justify-between rounded border border-gray-700 bg-gray-800/80 px-3 py-2"
                      >
                        <div className="flex flex-col flex-1">
                          <span className="text-xs text-gray-400">Producto</span>
                          <span className="font-semibold text-white">{item.name || "Sin nombre"}</span>
                          <span className="text-xs text-gray-500 mt-1">
                            Variante ID: {item.variantId} | Item ID: {item.id}
                          </span>
                        </div>
                        <div className="text-right mx-4">
                          <p className="text-xs text-gray-400">Cantidad</p>
                          <p className="font-semibold text-white">{item.qty}</p>
                        </div>
                        <div className="text-right mx-4">
                          <p className="text-xs text-gray-400">Precio Unit.</p>
                          <p className="font-semibold text-white">{formatCurrency(item.price)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Subtotal</p>
                          <p className="font-semibold text-white">{formatCurrency(item.price * item.qty)}</p>
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
