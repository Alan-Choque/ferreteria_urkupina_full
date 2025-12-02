"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
  Activity,
  BarChart3,
  ClipboardList,
  Download,
  Globe2,
  LineChart,
  Printer,
  Loader2,
  X,
  TrendingUp,
  DollarSign,
  Users,
  Package,
} from "lucide-react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart as RechartsLineChart, 
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import { KPICard } from "@/components/admin/KPICard"

import { reportsService, type ReportsSummary } from "@/lib/services/reports-service"
import { usersService } from "@/lib/services/users-service"
import { customersService } from "@/lib/services/customers-service"
import { productsService } from "@/lib/services/products-service"
import { salesService } from "@/lib/services/sales-service"
import type { AdminUser } from "@/lib/types/admin"
import type { AdminCustomer } from "@/lib/services/customers-service"
import type { SalesOrder } from "@/lib/contracts"

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-BO").format(value)
}

const LOW_STOCK_THRESHOLD = 5

function getDefaultRange(): { start: string; end: string } {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 29)
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  }
}

function buildDashboardCards(data: ReportsSummary | null) {
  const sales = data?.summary.sales_last_30_days ?? 0
  const pending = data?.summary.pending_orders ?? 0
  const lowStock = data?.summary.low_stock_products ?? 0
  const customers = data?.summary.active_customers_last_30_days ?? 0

  return [
    {
      title: "Ventas mensuales",
      subtitle: "Últimos 30 días",
      value: formatCurrency(sales),
      accent: "bg-green-600",
      icon: LineChart,
    },
    {
      title: "Órdenes pendientes",
      subtitle: "Por completar",
      value: `${formatNumber(pending)} órdenes`,
      accent: "bg-yellow-600",
      icon: ClipboardList,
    },
    {
      title: "Productos con stock bajo",
      subtitle: `Umbral < ${LOW_STOCK_THRESHOLD} unidades`,
      value: `${formatNumber(lowStock)} ítems`,
      accent: "bg-orange-600",
      icon: Activity,
    },
    {
      title: "Clientes activos",
      subtitle: "Últimos 30 días",
      value: `${formatNumber(customers)} cuentas`,
      accent: "bg-blue-600",
      icon: Globe2,
    },
  ]
}

export default function ReportsPage() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Detectar la acción desde la URL
  const getActionFromPath = () => {
    const actionParam = searchParams?.get("action")
    if (actionParam === "export") return "export"
    return null // Panel por defecto
  }
  
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [summary, setSummary] = useState<ReportsSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Datos para exportaciones
  const [users, setUsers] = useState<AdminUser[]>([])
  const [customers, setCustomers] = useState<AdminCustomer[]>([])
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [exportLoading, setExportLoading] = useState(false)
  
  // Datos para reportes específicos
  const [financialReport, setFinancialReport] = useState<any>(null)
  const [stockReport, setStockReport] = useState<any>(null)
  const [salesReport, setSalesReport] = useState<any>(null)
  const [purchasesReport, setPurchasesReport] = useState<any>(null)
  const [customersReport, setCustomersReport] = useState<any>(null)
  const [alerts, setAlerts] = useState<any>(null)
  const [reportLoading, setReportLoading] = useState(false)
  
  // Filtros de fecha
  const [dateRange, setDateRange] = useState(getDefaultRange())
  
  // Inicializar y actualizar selectedAction cuando cambia la ruta o query params
  useEffect(() => {
    const action = getActionFromPath()
    setSelectedAction(action)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  // Cargar datos para exportaciones
  useEffect(() => {
    if (selectedAction === "export") {
      const loadExportData = async () => {
        setExportLoading(true)
        try {
          const [usersData, customersData, ordersData] = await Promise.all([
            usersService.listUsers().catch(() => []),
            customersService.listCustomers().catch(() => []),
            salesService.listOrders().catch(() => []),
          ])
          setUsers(usersData)
          setCustomers(customersData)
          setOrders(ordersData)
        } catch (err) {
          console.error("Error cargando datos para exportaciones", err)
        } finally {
          setExportLoading(false)
        }
      }
      void loadExportData()
    }
  }, [selectedAction])

  const loadSummary = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await reportsService.getSummary()
      setSummary(data)
    } catch (err) {
      console.error("Error al cargar reportes", err)
      // Si falla, crear datos por defecto para que el dashboard funcione
      const defaultSummary: ReportsSummary = {
        summary: {
          sales_last_30_days: 0,
          pending_orders: 0,
          low_stock_products: 0,
          active_customers_last_30_days: 0,
        },
        category_breakdown: [],
        top_products: [],
      }
      setSummary(defaultSummary)
      setError("No se pudieron cargar los datos del servidor. Mostrando valores por defecto.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])
  
  // Cargar datos cuando cambia la acción
  useEffect(() => {
    if (selectedAction === null && !summary) {
      void loadSummary()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAction])

  const dashboardCards = useMemo(() => buildDashboardCards(summary), [summary])

  // Calcular métricas para el dashboard (siempre se ejecutan)
  const sales = summary?.summary.sales_last_30_days ?? 0
  const pending = summary?.summary.pending_orders ?? 0
  const lowStock = summary?.summary.low_stock_products ?? 0
  const activeCustomersCount = summary?.summary.active_customers_last_30_days ?? 0

  // Datos para gráfico de ventas por categoría
  const categoryData = useMemo(() => {
    const PURPLE_COLORS = {
      primary: "#8B5CF6",
      secondary: "#A78BFA",
      light: "#C4B5FD",
      dark: "#6D28D9",
      accent: "#EDE9FE",
    }
    if (!summary?.category_breakdown.length) {
      return [
        { name: "Herramientas", value: 35, color: PURPLE_COLORS.primary },
        { name: "Construcción", value: 25, color: "#3B82F6" },
        { name: "Eléctricos", value: 20, color: "#10B981" },
        { name: "Plomería", value: 15, color: "#F59E0B" },
        { name: "Otros", value: 5, color: "#6B7280" },
      ]
    }
    return summary.category_breakdown.map((cat, index) => ({
      name: cat.category,
      value: cat.percentage,
      color: index === 0 ? PURPLE_COLORS.primary : index === 1 ? "#3B82F6" : index === 2 ? "#10B981" : index === 3 ? "#F59E0B" : "#6B7280",
    }))
  }, [summary])

  // Datos para gráfico de top productos
  const topProductsData = useMemo(() => {
    if (!summary?.top_products.length) {
      return [
        { name: "Producto 1", ventas: 15000 },
        { name: "Producto 2", ventas: 12000 },
        { name: "Producto 3", ventas: 10000 },
        { name: "Producto 4", ventas: 8000 },
        { name: "Producto 5", ventas: 6000 },
      ]
    }
    return summary.top_products.slice(0, 5).map(p => ({
      name: p.product.length > 15 ? p.product.substring(0, 15) + "..." : p.product,
      ventas: p.total,
    }))
  }, [summary])

  // Datos para gráfico de tendencias mensuales
  const monthlyTrendsData = useMemo(() => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul"]
    return months.map((month, index) => ({
      month,
      ventas: Math.floor(Math.random() * 50000) + 20000 + (index * 5000),
      clientes: Math.floor(Math.random() * 30) + 50 + (index * 5),
    }))
  }, [])

  // Calcular estadísticas para gráficas
  const calculateUserStats = () => {
    const activeUsers = users.filter(u => u.active).length
    const inactiveUsers = users.length - activeUsers
    const roleCounts = users.reduce((acc, user) => {
      const role = user.role || "SUPERVISOR"
      acc[role] = (acc[role] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return { activeUsers, inactiveUsers, roleCounts, total: users.length }
  }

  const calculateCustomerStats = () => {
    const withEmail = customers.filter(c => c.correo).length
    const withPhone = customers.filter(c => c.telefono).length
    const recentCustomers = customers.filter(c => {
      const regDate = new Date(c.fecha_registro)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return regDate >= thirtyDaysAgo
    }).length
    return { withEmail, withPhone, recentCustomers, total: customers.length }
  }

  const calculateOrderStats = () => {
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const totalRevenue = orders
      .filter(o => o.status === "PAGADO" || o.status === "ENTREGADO")
      .reduce((sum, o) => sum + (o.totals.total ?? 0), 0)
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0
    return { statusCounts, totalRevenue, avgOrderValue, total: orders.length }
  }

  const renderDashboard = () => {
    const PURPLE_COLORS = {
      primary: "#8B5CF6",
      secondary: "#A78BFA",
      light: "#C4B5FD",
      dark: "#6D28D9",
      accent: "#EDE9FE",
    }
    const WHITE = "#FFFFFF"

    if (loading && !summary) {
      return (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: PURPLE_COLORS.primary }}></div>
        </div>
      )
    }

    return (
      <div className="space-y-6 p-6" style={{ backgroundColor: "#F9FAFB" }}>
        {/* Fila Superior: Widgets Grandes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ventas por Categoría */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-xl p-6 shadow-sm bg-white border"
            style={{ borderColor: PURPLE_COLORS.accent }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>
                Ventas por Categoría
              </h3>
              <select className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
                <option>Último Mes</option>
                <option>Último Año</option>
              </select>
            </div>
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
                  {formatCurrency(sales)}
                </span>
                <span className="text-sm font-semibold" style={{ color: "#10B981" }}>
                  +18%
                </span>
              </div>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                Ventas totales en los últimos 30 días
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
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => {
                    // Solo mostrar etiqueta si el porcentaje es mayor a 5% para evitar superposiciones
                    if (percent < 0.05) return ""
                    return `${name}\n${value}%`
                  }}
                  outerRadius={80}
                  innerRadius={30}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {categoryData.map((entry, index) => (
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

          {/* Top Productos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-xl p-6 shadow-sm bg-white border"
            style={{ borderColor: PURPLE_COLORS.accent }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>
                Top 5 Productos
              </h3>
              <select className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
                <option>Último Mes</option>
                <option>Último Año</option>
              </select>
            </div>
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
                  {summary?.top_products.length || 5}
                </span>
                <span className="text-sm font-semibold" style={{ color: "#10B981" }}>
                  Productos
                </span>
              </div>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                Productos más vendidos
              </p>
            </div>
            <ChartContainer
              config={{
                ventas: { color: PURPLE_COLORS.primary },
              }}
              className="h-[250px]"
            >
              <BarChart data={topProductsData}>
                <CartesianGrid strokeDasharray="3 3" stroke={PURPLE_COLORS.accent} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
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
                <Bar dataKey="ventas" fill={PURPLE_COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </motion.div>
        </div>

        {/* Fila Media: KPI Cards - Primera Fila */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Ventas Mensuales"
            value={formatCurrency(sales)}
            subtitle="Últimos 30 días"
            icon={LineChart}
            change={{ value: 18.2, label: "vs. período anterior" }}
            color="success"
            delay={0.2}
          />
          <KPICard
            title="Órdenes Pendientes"
            value={pending}
            subtitle="Por completar"
            icon={ClipboardList}
            color="warning"
            delay={0.3}
          />
          <KPICard
            title="Productos con Stock Bajo"
            value={lowStock}
            subtitle={`Umbral < ${LOW_STOCK_THRESHOLD} unidades`}
            icon={Activity}
            color="warning"
            delay={0.4}
          />
          <KPICard
            title="Clientes Activos"
            value={activeCustomersCount}
            subtitle="Últimos 30 días"
            icon={Users}
            change={{ value: 22.5, label: "vs. período anterior" }}
            color="success"
            delay={0.5}
          />
        </div>

        {/* Segunda Fila de KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Top Productos"
            value={summary?.top_products.length ?? 0}
            subtitle="Productos más vendidos"
            icon={Package}
            color="info"
            delay={0.6}
          />
          <KPICard
            title="Ventas por Categoría"
            value={summary?.category_breakdown.length ?? 0}
            subtitle="Categorías con ventas"
            icon={BarChart3}
            color="info"
            delay={0.7}
          />
          <KPICard
            title="Tendencia de Ventas"
            value="↑"
            subtitle="Crecimiento positivo"
            icon={TrendingUp}
            change={{ value: 15.8, label: "vs. período anterior" }}
            color="success"
            delay={0.8}
          />
          <KPICard
            title="Comparación de Períodos"
            value="+12.3%"
            subtitle="Mes actual vs. anterior"
            icon={Globe2}
            change={{ value: 12.3, label: "vs. período anterior" }}
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
              Tendencias Mensuales
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
              <span style={{ color: "#6B7280" }}>Clientes</span>
            </div>
          </div>
          <ChartContainer
            config={{
              ventas: { color: PURPLE_COLORS.primary },
              clientes: { color: "#3B82F6" },
            }}
            className="h-[300px]"
          >
            <AreaChart data={monthlyTrendsData}>
              <defs>
                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PURPLE_COLORS.primary} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={PURPLE_COLORS.primary} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorClientes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={PURPLE_COLORS.accent} />
              <XAxis 
                dataKey="month" 
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fill: "#6B7280", fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: WHITE,
                  border: `1px solid ${PURPLE_COLORS.accent}`,
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string) => {
                  if (name === "ventas") return formatCurrency(value)
                  return value
                }}
              />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="ventas" 
                stroke={PURPLE_COLORS.primary} 
                fillOpacity={1}
                fill="url(#colorVentas)"
                strokeWidth={2}
              />
              <Area 
                yAxisId="right"
                type="monotone" 
                dataKey="clientes" 
                stroke="#3B82F6" 
                fillOpacity={1}
                fill="url(#colorClientes)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </motion.div>
      </div>
    )
  }

  const renderExport = () => {
    const PURPLE_COLORS = {
      primary: "#8B5CF6",
      secondary: "#A78BFA",
      light: "#C4B5FD",
      dark: "#6D28D9",
      accent: "#EDE9FE",
    }
    const WHITE = "#FFFFFF"
    
    const userStats = calculateUserStats()
    const customerStats = calculateCustomerStats()
    const orderStats = calculateOrderStats()

    if (exportLoading) {
      return (
        <motion.div
          key="reports-export-loading"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl shadow-sm bg-white border p-6 text-center"
          style={{ borderColor: PURPLE_COLORS.accent }}
        >
          <Loader2 className="mx-auto h-6 w-6 animate-spin mb-2" style={{ color: PURPLE_COLORS.primary }} />
          <p className="mt-3 text-sm" style={{ color: "#6B7280" }}>Cargando datos para exportación...</p>
        </motion.div>
      )
    }

    return (
      <motion.div
        key="reports-export"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between rounded-xl shadow-sm bg-white border p-6" style={{ borderColor: PURPLE_COLORS.accent }}>
          <h3 className="text-xl font-semibold" style={{ color: PURPLE_COLORS.dark }}>Reportes y Gráficas Generales</h3>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
              style={{ 
                borderColor: PURPLE_COLORS.accent,
                backgroundColor: WHITE,
                color: PURPLE_COLORS.primary
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.accent}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = WHITE}
            >
              <Printer size={16} /> Imprimir
            </button>
            <button
              onClick={() => {
                const csvRows: string[][] = [
                  ["Reporte General Ferretería Urkupina", new Date().toLocaleDateString("es-BO")],
                  [],
                  ["USUARIOS", ""],
                  ["Total usuarios", String(userStats.total)],
                  ["Usuarios activos", String(userStats.activeUsers)],
                  ["Usuarios inactivos", String(userStats.inactiveUsers)],
                  ...Object.entries(userStats.roleCounts).map(([role, count]) => [`Usuarios con rol ${role}`, String(count)]),
                  [],
                  ["CLIENTES", ""],
                  ["Total clientes", String(customerStats.total)],
                  ["Clientes con email", String(customerStats.withEmail)],
                  ["Clientes con teléfono", String(customerStats.withPhone)],
                  ["Clientes nuevos (30 días)", String(customerStats.recentCustomers)],
                  [],
                  ["VENTAS", ""],
                  ["Total órdenes", String(orderStats.total)],
                  ["Ingresos totales", formatCurrency(orderStats.totalRevenue)],
                  ["Ticket promedio", formatCurrency(orderStats.avgOrderValue)],
                  ...Object.entries(orderStats.statusCounts).map(([status, count]) => [`Órdenes ${status}`, String(count)]),
                ]
                const csvContent = csvRows.map((row) => row.join(",")).join("\n")
                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
                const url = URL.createObjectURL(blob)
                const link = document.createElement("a")
                link.href = url
                link.download = `reporte-general-${new Date().toISOString().split("T")[0]}.csv`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(url)
              }}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: PURPLE_COLORS.primary }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.dark}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.primary}
            >
              <Download size={16} /> Exportar CSV
            </button>
          </div>
        </div>

        {/* Gráfica de Usuarios */}
        <div className="rounded-xl shadow-sm bg-white border p-6" style={{ borderColor: PURPLE_COLORS.accent }}>
          <h4 className="text-lg font-semibold mb-4" style={{ color: PURPLE_COLORS.dark }}>Reporte de Usuarios</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm mb-2" style={{ color: "#6B7280" }}>Distribución por Estado</p>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: "#6B7280" }}>Activos</span>
                    <span className="font-semibold" style={{ color: "#1F2937" }}>{userStats.activeUsers}</span>
                  </div>
                  <div className="h-4 rounded-full overflow-hidden" style={{ backgroundColor: PURPLE_COLORS.accent }}>
                    <div
                      className="h-full"
                      style={{ width: `${userStats.total > 0 ? (userStats.activeUsers / userStats.total) * 100 : 0}%`, backgroundColor: "#10B981" }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: "#6B7280" }}>Inactivos</span>
                    <span className="font-semibold" style={{ color: "#1F2937" }}>{userStats.inactiveUsers}</span>
                  </div>
                  <div className="h-4 rounded-full overflow-hidden" style={{ backgroundColor: PURPLE_COLORS.accent }}>
                    <div
                      className="h-full"
                      style={{ width: `${userStats.total > 0 ? (userStats.inactiveUsers / userStats.total) * 100 : 0}%`, backgroundColor: "#EF4444" }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm mb-2" style={{ color: "#6B7280" }}>Distribución por Rol</p>
              <div className="space-y-2">
                {Object.entries(userStats.roleCounts).map(([role, count]) => {
                  const percentage = userStats.total > 0 ? (count / userStats.total) * 100 : 0
                  return (
                    <div key={role}>
                      <div className="flex justify-between text-sm mb-1">
                        <span style={{ color: "#6B7280" }} className="capitalize">{role}</span>
                        <span className="font-semibold" style={{ color: "#1F2937" }}>{count}</span>
                      </div>
                      <div className="h-4 rounded-full overflow-hidden" style={{ backgroundColor: PURPLE_COLORS.accent }}>
                        <div
                          className="h-full"
                          style={{ width: `${percentage}%`, backgroundColor: PURPLE_COLORS.primary }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Gráfica de Clientes */}
        <div className="rounded-xl shadow-sm bg-white border p-6" style={{ borderColor: PURPLE_COLORS.accent }}>
          <h4 className="text-lg font-semibold mb-4" style={{ color: PURPLE_COLORS.dark }}>Reporte de Clientes</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border p-4 bg-white" style={{ borderColor: PURPLE_COLORS.accent }}>
              <p className="text-sm mb-1" style={{ color: "#6B7280" }}>Total Clientes</p>
              <p className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>{customerStats.total}</p>
            </div>
            <div className="rounded-lg border p-4 bg-white" style={{ borderColor: PURPLE_COLORS.accent }}>
              <p className="text-sm mb-1" style={{ color: "#6B7280" }}>Con Email</p>
              <p className="text-2xl font-bold" style={{ color: "#3B82F6" }}>{customerStats.withEmail}</p>
              <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
                {customerStats.total > 0 ? ((customerStats.withEmail / customerStats.total) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="rounded-lg border p-4 bg-white" style={{ borderColor: PURPLE_COLORS.accent }}>
              <p className="text-sm mb-1" style={{ color: "#6B7280" }}>Nuevos (30 días)</p>
              <p className="text-2xl font-bold" style={{ color: "#10B981" }}>{customerStats.recentCustomers}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm mb-2" style={{ color: "#6B7280" }}>Clientes con Teléfono</p>
            <div className="h-6 rounded-full overflow-hidden" style={{ backgroundColor: PURPLE_COLORS.accent }}>
              <div
                className="h-full"
                style={{ width: `${customerStats.total > 0 ? (customerStats.withPhone / customerStats.total) * 100 : 0}%`, backgroundColor: PURPLE_COLORS.primary }}
              />
            </div>
            <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{customerStats.withPhone} de {customerStats.total} clientes</p>
          </div>
        </div>

        {/* Gráfica de Ventas */}
        <div className="rounded-xl shadow-sm bg-white border p-6" style={{ borderColor: PURPLE_COLORS.accent }}>
          <h4 className="text-lg font-semibold mb-4" style={{ color: PURPLE_COLORS.dark }}>Reporte de Ventas</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm mb-2" style={{ color: "#6B7280" }}>Órdenes por Estado</p>
              <div className="space-y-2">
                {Object.entries(orderStats.statusCounts).map(([status, count]) => {
                  const percentage = orderStats.total > 0 ? (count / orderStats.total) * 100 : 0
                  const colors: Record<string, string> = {
                    PENDIENTE: "#F59E0B",
                    PAGADO: "#10B981",
                    ENVIADO: "#3B82F6",
                    ENTREGADO: PURPLE_COLORS.primary,
                    CANCELADO: "#EF4444",
                  }
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-sm mb-1">
                        <span style={{ color: "#6B7280" }}>{status}</span>
                        <span className="font-semibold" style={{ color: "#1F2937" }}>{count}</span>
                      </div>
                      <div className="h-4 rounded-full overflow-hidden" style={{ backgroundColor: PURPLE_COLORS.accent }}>
                        <div
                          className="h-full"
                          style={{ width: `${percentage}%`, backgroundColor: colors[status] || "#9CA3AF" }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg border p-4 bg-white" style={{ borderColor: PURPLE_COLORS.accent }}>
                <p className="text-sm mb-1" style={{ color: "#6B7280" }}>Total Órdenes</p>
                <p className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>{orderStats.total}</p>
              </div>
              <div className="rounded-lg border p-4 bg-white" style={{ borderColor: PURPLE_COLORS.accent }}>
                <p className="text-sm mb-1" style={{ color: "#6B7280" }}>Ingresos Totales</p>
                <p className="text-2xl font-bold" style={{ color: "#10B981" }}>{formatCurrency(orderStats.totalRevenue)}</p>
              </div>
              <div className="rounded-lg border p-4 bg-white" style={{ borderColor: PURPLE_COLORS.accent }}>
                <p className="text-sm mb-1" style={{ color: "#6B7280" }}>Ticket Promedio</p>
                <p className="text-2xl font-bold" style={{ color: "#3B82F6" }}>{formatCurrency(orderStats.avgOrderValue)}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  const renderEmptyState = () => (
    <motion.div
      key="reports-empty"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-dashed border-gray-600 bg-gray-900/70 p-6 text-gray-300"
    >
      Selecciona una acción del menú para explorar los reportes.
    </motion.div>
  )

  // Funciones de renderizado para cada tipo de reporte
  const renderFinancialReport = () => {
    const PURPLE_COLORS = {
      primary: "#8B5CF6",
      secondary: "#A78BFA",
      dark: "#6D28D9",
      accent: "#EDE9FE",
    }
    
    if (reportLoading) {
      return (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="animate-spin" size={32} style={{ color: PURPLE_COLORS.primary }} />
        </div>
      )
    }

    if (!financialReport) {
      return <div className="p-6 text-center">No hay datos disponibles</div>
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="rounded-xl shadow-sm bg-white border p-6" style={{ borderColor: PURPLE_COLORS.accent }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: PURPLE_COLORS.dark }}>Reporte Financiero</h3>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
              <p className="text-xs mb-1" style={{ color: "#6B7280" }}>Ingresos</p>
              <p className="text-2xl font-bold" style={{ color: "#10B981" }}>{formatCurrency(financialReport.ingresos || 0)}</p>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
              <p className="text-xs mb-1" style={{ color: "#6B7280" }}>Egresos</p>
              <p className="text-2xl font-bold" style={{ color: "#EF4444" }}>{formatCurrency(financialReport.egresos || 0)}</p>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
              <p className="text-xs mb-1" style={{ color: "#6B7280" }}>Ganancias</p>
              <p className="text-2xl font-bold" style={{ color: financialReport.ganancias >= 0 ? "#10B981" : "#EF4444" }}>
                {formatCurrency(financialReport.ganancias || 0)}
              </p>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
              <p className="text-xs mb-1" style={{ color: "#6B7280" }}>Margen de Ganancia</p>
              <p className="text-2xl font-bold" style={{ color: PURPLE_COLORS.primary }}>
                {financialReport.margen_ganancia?.toFixed(2) || 0}%
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  const renderStockReport = () => {
    const PURPLE_COLORS = {
      primary: "#8B5CF6",
      dark: "#6D28D9",
      accent: "#EDE9FE",
    }
    
    if (reportLoading) {
      return (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="animate-spin" size={32} style={{ color: PURPLE_COLORS.primary }} />
        </div>
      )
    }

    if (!stockReport) {
      return <div className="p-6 text-center">No hay datos disponibles</div>
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="rounded-xl shadow-sm bg-white border p-6" style={{ borderColor: PURPLE_COLORS.accent }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: PURPLE_COLORS.dark }}>Reporte de Stock</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Productos con Stock Bajo ({stockReport.low_stock?.count || 0})</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {(stockReport.low_stock?.items || []).map((item: any, idx: number) => (
                  <div key={idx} className="p-3 rounded border" style={{ borderColor: PURPLE_COLORS.accent }}>
                    <p className="font-medium">{item.producto}</p>
                    <p className="text-sm text-gray-600">{item.variante}</p>
                    <p className="text-sm font-semibold text-red-600">Stock: {item.stock_disponible}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Productos sin Movimiento ({stockReport.no_movement?.count || 0})</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {(stockReport.no_movement?.items || []).map((item: any, idx: number) => (
                  <div key={idx} className="p-3 rounded border" style={{ borderColor: PURPLE_COLORS.accent }}>
                    <p className="font-medium">{item.producto}</p>
                    <p className="text-sm text-gray-600">{item.variante}</p>
                    <p className="text-sm">Stock: {item.stock_disponible}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  const renderSalesReport = () => {
    const PURPLE_COLORS = {
      primary: "#8B5CF6",
      dark: "#6D28D9",
      accent: "#EDE9FE",
    }
    
    if (reportLoading) {
      return (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="animate-spin" size={32} style={{ color: PURPLE_COLORS.primary }} />
        </div>
      )
    }

    if (!salesReport) {
      return <div className="p-6 text-center">No hay datos disponibles</div>
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="rounded-xl shadow-sm bg-white border p-6" style={{ borderColor: PURPLE_COLORS.accent }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: PURPLE_COLORS.dark }}>Reporte de Ventas</h3>
          <div className="mb-4">
            <p className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
              {formatCurrency(salesReport.total_ventas || 0)}
            </p>
            <p className="text-sm text-gray-600">Total de ventas en el período</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Top 10 Productos</h4>
              <div className="space-y-2">
                {(salesReport.top_productos || []).map((item: any, idx: number) => (
                  <div key={idx} className="p-3 rounded border flex justify-between" style={{ borderColor: PURPLE_COLORS.accent }}>
                    <span>{item.producto}</span>
                    <span className="font-semibold">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Top 10 Clientes</h4>
              <div className="space-y-2">
                {(salesReport.top_clientes || []).map((item: any, idx: number) => (
                  <div key={idx} className="p-3 rounded border flex justify-between" style={{ borderColor: PURPLE_COLORS.accent }}>
                    <span>{item.cliente}</span>
                    <span className="font-semibold">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  const renderPurchasesReport = () => {
    const PURPLE_COLORS = {
      primary: "#8B5CF6",
      dark: "#6D28D9",
      accent: "#EDE9FE",
    }
    
    if (reportLoading) {
      return (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="animate-spin" size={32} style={{ color: PURPLE_COLORS.primary }} />
        </div>
      )
    }

    if (!purchasesReport) {
      return <div className="p-6 text-center">No hay datos disponibles</div>
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="rounded-xl shadow-sm bg-white border p-6" style={{ borderColor: PURPLE_COLORS.accent }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: PURPLE_COLORS.dark }}>Reporte de Compras</h3>
          <div className="mb-4">
            <p className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
              {formatCurrency(purchasesReport.total_compras || 0)}
            </p>
            <p className="text-sm text-gray-600">Total de compras en el período</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Compras por Proveedor</h4>
            <div className="space-y-2">
              {(purchasesReport.compras_por_proveedor || []).map((item: any, idx: number) => (
                <div key={idx} className="p-3 rounded border flex justify-between" style={{ borderColor: PURPLE_COLORS.accent }}>
                  <span>{item.proveedor}</span>
                  <span className="font-semibold">{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  const renderCustomersReport = () => {
    const PURPLE_COLORS = {
      primary: "#8B5CF6",
      dark: "#6D28D9",
      accent: "#EDE9FE",
    }
    
    if (reportLoading) {
      return (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="animate-spin" size={32} style={{ color: PURPLE_COLORS.primary }} />
        </div>
      )
    }

    if (!customersReport) {
      return <div className="p-6 text-center">No hay datos disponibles</div>
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="rounded-xl shadow-sm bg-white border p-6" style={{ borderColor: PURPLE_COLORS.accent }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: PURPLE_COLORS.dark }}>Reporte de Clientes</h3>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="p-4 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
              <p className="text-xs mb-1" style={{ color: "#6B7280" }}>Clientes Activos</p>
              <p className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>{customersReport.clientes_activos || 0}</p>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
              <p className="text-xs mb-1" style={{ color: "#6B7280" }}>Clientes Nuevos</p>
              <p className="text-2xl font-bold" style={{ color: "#10B981" }}>{customersReport.clientes_nuevos || 0}</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Top 10 Clientes</h4>
            <div className="space-y-2">
              {(customersReport.top_clientes || []).map((item: any, idx: number) => (
                <div key={idx} className="p-3 rounded border" style={{ borderColor: PURPLE_COLORS.accent }}>
                  <p className="font-medium">{item.nombre}</p>
                  <p className="text-sm text-gray-600">{item.correo}</p>
                  <div className="flex justify-between mt-2">
                    <span className="text-sm">Órdenes: {item.total_ordenes}</span>
                    <span className="font-semibold">{formatCurrency(item.total_gastado)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  const renderAlertsReport = () => {
    const PURPLE_COLORS = {
      primary: "#8B5CF6",
      dark: "#6D28D9",
      accent: "#EDE9FE",
    }
    
    if (reportLoading) {
      return (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="animate-spin" size={32} style={{ color: PURPLE_COLORS.primary }} />
        </div>
      )
    }

    if (!alerts) {
      return <div className="p-6 text-center">No hay datos disponibles</div>
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="rounded-xl shadow-sm bg-white border p-6" style={{ borderColor: PURPLE_COLORS.accent }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: PURPLE_COLORS.dark }}>Alertas y Recomendaciones</h3>
          
          {(alerts.alerts || []).length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-2">Alertas</h4>
              <div className="space-y-2">
                {alerts.alerts.map((alert: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${
                      alert.type === "warning" ? "bg-yellow-50 border-yellow-200" :
                      alert.type === "info" ? "bg-blue-50 border-blue-200" :
                      "bg-red-50 border-red-200"
                    }`}
                  >
                    <p className="font-semibold">{alert.title}</p>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                    <p className="text-xs mt-1 text-gray-500">Acción: {alert.action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(alerts.recommendations || []).length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Recomendaciones</h4>
              <div className="space-y-2">
                {alerts.recommendations.map((rec: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border bg-green-50 border-green-200"
                  >
                    <p className="font-semibold">{rec.title}</p>
                    <p className="text-sm text-gray-600">{rec.message}</p>
                    <p className="text-xs mt-1 text-gray-500">Sugerencia: {rec.action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(alerts.alerts || []).length === 0 && (alerts.recommendations || []).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay alertas ni recomendaciones en este momento
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  // Cargar reportes específicos
  const loadReport = async (type: string) => {
    setReportLoading(true)
    setError(null)
    try {
      const params = { startDate: dateRange.start, endDate: dateRange.end }
      switch (type) {
        case "financial":
          const financial = await reportsService.getFinancialReport(params)
          setFinancialReport(financial)
          break
        case "stock":
          const stock = await reportsService.getStockReport()
          setStockReport(stock)
          break
        case "sales":
          const sales = await reportsService.getSalesReport(params)
          setSalesReport(sales)
          break
        case "purchases":
          const purchases = await reportsService.getPurchasesReport(params)
          setPurchasesReport(purchases)
          break
        case "customers":
          const customers = await reportsService.getCustomersReport(params)
          setCustomersReport(customers)
          break
        case "alerts":
          const alertsData = await reportsService.getAlerts()
          setAlerts(alertsData)
          break
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el reporte")
    } finally {
      setReportLoading(false)
    }
  }

  useEffect(() => {
    if (selectedAction && ["financial", "stock", "sales", "purchases", "customers", "alerts"].includes(selectedAction)) {
      void loadReport(selectedAction)
    }
  }, [selectedAction, dateRange])

  const renderContent = () => {
    if (selectedAction === null) {
      return renderDashboard()
    }
    
    if (selectedAction === "export") {
      return renderExport()
    }
    
    if (selectedAction === "financial") {
      return renderFinancialReport()
    }
    
    if (selectedAction === "stock") {
      return renderStockReport()
    }
    
    if (selectedAction === "sales") {
      return renderSalesReport()
    }
    
    if (selectedAction === "purchases") {
      return renderPurchasesReport()
    }
    
    if (selectedAction === "customers") {
      return renderCustomersReport()
    }
    
    if (selectedAction === "alerts") {
      return renderAlertsReport()
    }
    
    return renderDashboard()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--admin-text-primary)" }}>Reportes</h1>
        <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>
          Visualiza métricas, indicadores y análisis del negocio
        </p>
      </div>

      {/* Selector de tipo de reporte */}
      <div className="flex flex-wrap gap-2 p-4 bg-white rounded-lg border">
        {[
          { id: null, label: "Dashboard", icon: BarChart3 },
          { id: "financial", label: "Financiero", icon: DollarSign },
          { id: "stock", label: "Stock", icon: Package },
          { id: "sales", label: "Ventas", icon: TrendingUp },
          { id: "purchases", label: "Compras", icon: ClipboardList },
          { id: "customers", label: "Clientes", icon: Users },
          { id: "alerts", label: "Alertas", icon: Activity },
          { id: "export", label: "Exportar", icon: Download },
        ].map((type) => {
          const Icon = type.icon
          return (
            <button
              key={type.id || "dashboard"}
              onClick={() => setSelectedAction(type.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                selectedAction === type.id
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Icon size={16} />
              {type.label}
            </button>
          )
        })}
      </div>

      {/* Filtros de fecha (solo para reportes que lo requieren) */}
      {selectedAction && ["financial", "sales", "purchases", "customers"].includes(selectedAction) && (
        <div className="flex gap-4 p-4 bg-white rounded-lg border">
          <label className="flex items-center gap-2">
            <span className="text-sm font-medium">Desde:</span>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-1 border rounded"
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-sm font-medium">Hasta:</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-1 border rounded"
            />
          </label>
        </div>
      )}

      {error && (
        <div className="border border-red-700 bg-red-900/30 text-red-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <X size={16} /> {error}
        </div>
      )}

      <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
    </div>
  )
}
