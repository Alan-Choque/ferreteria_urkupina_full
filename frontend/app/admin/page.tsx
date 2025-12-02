"use client"
import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart,
  Users,
  MessageSquare,
  ChevronDown,
  DollarSign
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
  Cell,
  PieChart,
  Pie
} from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import { salesService } from "@/lib/services/sales-service"
import { reportsService } from "@/lib/services/reports-service"
import type { SalesOrder } from "@/lib/contracts"

// Colores morado y blanco para CRM
const PURPLE_COLORS = {
  primary: "#8B5CF6",
  secondary: "#A78BFA",
  light: "#C4B5FD",
  dark: "#6D28D9",
  accent: "#EDE9FE",
}
const WHITE = "#FFFFFF"

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [ordersData, summaryData] = await Promise.all([
          salesService.listOrders(),
          reportsService.getSummary().catch(() => null),
        ])
        setOrders(ordersData)
        setSummary(summaryData)
      } catch (error) {
        console.error("Error cargando datos del dashboard:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Calcular datos reales para gráficas basados en órdenes
  const salesPipelineData = useMemo(() => {
    // Agrupar órdenes por mes (últimos 7 meses)
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul"]
    const now = new Date()
    const monthData = months.map((month, index) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (6 - index), 1)
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
      
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt)
        return orderDate >= monthStart && orderDate <= monthEnd
      })
      
      const won = monthOrders
        .filter(o => o.status === "PAGADO" || o.status === "ENTREGADO")
        .reduce((sum, o) => sum + (o.totals?.total || 0), 0)
      
      const discovery = monthOrders
        .filter(o => o.status === "PENDIENTE" || o.status === "ENVIADO")
        .reduce((sum, o) => sum + (o.totals?.total || 0), 0)
      
      return {
        month,
        won: won || 0,
        discovery: discovery || 0,
      }
    })
    
    return monthData
  }, [orders])

  // Datos para Average Ticket (gráfico de líneas) - últimos 6 meses
  const averageTicketData = useMemo(() => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun"]
    const now = new Date()
    
    return months.map((month, index) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
      
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt)
        return orderDate >= monthStart && orderDate <= monthEnd
      })
      
      const completedOrders = monthOrders.filter(o => 
        o.status === "PAGADO" || o.status === "ENTREGADO"
      )
      
      const checkout = completedOrders.length > 0
        ? completedOrders.reduce((sum, o) => sum + (o.totals?.total || 0), 0) / completedOrders.length
        : 0
      
      const viewing = monthOrders.length > 0
        ? monthOrders.reduce((sum, o) => sum + (o.totals?.total || 0), 0) / monthOrders.length
        : 0
      
      return {
        month,
        checkout: Math.round(checkout) || 0,
        viewing: Math.round(viewing) || 0,
      }
    })
  }, [orders])

  // Calcular KPIs reales basados en datos
  const metrics = useMemo(() => {
    const totalSales = orders.reduce((sum, o) => sum + (o.totals?.total || 0), 0)
    const totalOrders = orders.length
    const activeCustomers = new Set(orders.map(o => o.customerId)).size
    
    // Calcular órdenes por estado
    const paidOrders = orders.filter(o => o.status === "PAGADO" || o.status === "ENTREGADO")
    const pendingOrders = orders.filter(o => o.status === "PENDIENTE")
    
    // Calcular ticket promedio
    const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0
    
    // Calcular ventas del último mes vs mes anterior (simulado para demo)
    const now = new Date()
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0)
    
    const lastMonthSales = orders
      .filter(o => {
        const orderDate = new Date(o.createdAt)
        return orderDate >= lastMonthStart && orderDate <= lastMonthEnd
      })
      .reduce((sum, o) => sum + (o.totals?.total || 0), 0)
    
    const previousMonthSales = orders
      .filter(o => {
        const orderDate = new Date(o.createdAt)
        return orderDate >= previousMonthStart && orderDate <= previousMonthEnd
      })
      .reduce((sum, o) => sum + (o.totals?.total || 0), 0)
    
    const salesChange = previousMonthSales > 0
      ? ((lastMonthSales - previousMonthSales) / previousMonthSales) * 100
      : 0
    
    // Pipeline de ventas (suma de todas las órdenes)
    const salesPipeline = orders.reduce((sum, o) => sum + (o.totals?.total || 0), 0)
    
    // Usar datos del summary si está disponible
    const salesLast30Days = summary?.summary?.sales_last_30_days || lastMonthSales
    const pendingOrdersCount = summary?.summary?.pending_orders || pendingOrders.length
    const lowStockProducts = summary?.summary?.low_stock_products || 0
    const activeCustomersCount = summary?.summary?.active_customers_last_30_days || activeCustomers

    return {
      // KPIs principales
      salesPipeline: salesPipeline || salesLast30Days,
      salesPipelineChange: salesChange > 0 ? Math.round(salesChange * 10) / 10 : 0,
      revenue: salesLast30Days,
      revenueChange: salesChange > 0 ? Math.round(salesChange * 10) / 10 : Math.round(salesChange * 10) / 10,
      productRevenue: salesLast30Days * 0.95, // Estimado: 95% de ventas son productos
      productRevenueChange: salesChange > 0 ? Math.round(salesChange * 10) / 10 : Math.round(salesChange * 10) / 10,
      activeSales: totalSales,
      activeSalesChange: salesChange > 0 ? Math.round(salesChange * 10) / 10 : Math.round(salesChange * 10) / 10,
      totalDeals: totalOrders,
      totalDealsChange: 0, // Se puede calcular comparando con período anterior
      replyRate: totalOrders > 0 ? Math.round((paidOrders.length / totalOrders) * 100 * 10) / 10 : 0,
      replyRateChange: 0,
      // KPIs adicionales
      averageTicket: Math.round(averageTicket),
      pendingOrders: pendingOrdersCount,
      lowStockProducts: lowStockProducts,
      activeCustomers: activeCustomersCount,
    }
  }, [orders, summary])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (loading) {
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
        {/* Sales Pipeline Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-xl p-6 shadow-sm bg-white border"
          style={{ borderColor: PURPLE_COLORS.accent }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>
              Pipeline de Ventas
            </h3>
            <select className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
              <option>Último Mes</option>
              <option>Última Semana</option>
              <option>Último Año</option>
            </select>
          </div>
          <div className="mb-4">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
                {formatCurrency(metrics.salesPipeline)}
              </span>
              <span className="text-sm font-semibold" style={{ color: "#10B981" }}>
                +{metrics.salesPipelineChange}%
              </span>
            </div>
            <p className="text-xs" style={{ color: "#6B7280" }}>
              Las tasas aumentaron un {metrics.salesPipelineChange}% en los últimos 7 días
            </p>
          </div>
          <div className="flex items-center gap-4 mb-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PURPLE_COLORS.primary }}></div>
              <span style={{ color: "#6B7280" }}>Ganado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#3B82F6" }}></div>
              <span style={{ color: "#6B7280" }}>Descubrimiento</span>
            </div>
          </div>
          <ChartContainer
            config={{
              won: { color: PURPLE_COLORS.primary },
              discovery: { color: "#3B82F6" },
            }}
            className="h-[250px]"
          >
            <BarChart data={salesPipelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke={PURPLE_COLORS.accent} />
              <XAxis 
                dataKey="month" 
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />
              <YAxis 
                tick={{ fill: "#6B7280", fontSize: 12 }}
                domain={[16000, 19000]}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: WHITE,
                  border: `1px solid ${PURPLE_COLORS.accent}`,
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="won" stackId="a" fill={PURPLE_COLORS.primary} radius={[0, 0, 0, 0]} />
              <Bar dataKey="discovery" stackId="a" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </motion.div>

        {/* Revenue Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-xl p-6 shadow-sm bg-white border"
          style={{ borderColor: PURPLE_COLORS.accent }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>
              Ingresos
            </h3>
            <select className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
              <option>Última Semana</option>
              <option>Último Mes</option>
              <option>Último Año</option>
            </select>
          </div>
          <div className="mb-4">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
                {formatCurrency(metrics.revenue)}
              </span>
              <span className="text-sm font-semibold" style={{ color: "#EF4444" }}>
                {metrics.revenueChange}%
              </span>
            </div>
            <p className="text-xs" style={{ color: "#6B7280" }}>
              Las tasas disminuyeron un {Math.abs(metrics.revenueChange)}% en los últimos 7 días
            </p>
          </div>
          <div className="flex items-center justify-center h-[250px]">
            <div className="relative w-48 h-48">
              {/* Gauge Chart simplificado */}
              <svg viewBox="0 0 200 120" className="w-full h-full">
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke={PURPLE_COLORS.accent}
                  strokeWidth="20"
                />
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke={PURPLE_COLORS.primary}
                  strokeWidth="20"
                  strokeDasharray={`${2 * Math.PI * 80 * 0.75} ${2 * Math.PI * 80}`}
                  strokeDashoffset={2 * Math.PI * 80 * 0.25}
                  strokeLinecap="round"
                />
                <text
                  x="100"
                  y="80"
                  textAnchor="middle"
                  className="text-xs"
                  fill="#6B7280"
                >
                  vs. Período anterior
                </text>
                <text
                  x="100"
                  y="95"
                  textAnchor="middle"
                  className="text-sm font-bold"
                  style={{ fill: "#10B981" }}
                >
                  +27.3%
                </text>
              </svg>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Fila Media: KPI Cards - Métricas Clave del Negocio */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Ventas Totales (últimos 30 días) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-xl p-5 shadow-sm bg-white border"
          style={{ borderColor: PURPLE_COLORS.accent }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: PURPLE_COLORS.secondary }}>
              Ventas Totales (30 días)
            </p>
            <div className="p-2 rounded-lg" style={{ backgroundColor: PURPLE_COLORS.accent }}>
              <TrendingUp size={18} style={{ color: PURPLE_COLORS.primary }} />
            </div>
          </div>
          <p className="text-2xl font-bold mb-1" style={{ color: PURPLE_COLORS.dark }}>
            {formatCurrency(metrics.revenue)}
          </p>
          <p className={`text-xs ${metrics.revenueChange >= 0 ? "text-green-600" : "text-red-600"}`}>
            {metrics.revenueChange >= 0 ? "↑" : "↓"} {Math.abs(metrics.revenueChange).toFixed(1)}% vs. mes anterior
          </p>
        </motion.div>

        {/* KPI 2: Órdenes Pendientes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-xl p-5 shadow-sm bg-white border"
          style={{ borderColor: PURPLE_COLORS.accent }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: PURPLE_COLORS.secondary }}>
              Órdenes Pendientes
            </p>
            <div className="p-2 rounded-lg" style={{ backgroundColor: PURPLE_COLORS.accent }}>
              <ShoppingCart size={18} style={{ color: PURPLE_COLORS.primary }} />
            </div>
          </div>
          <p className="text-2xl font-bold mb-1" style={{ color: PURPLE_COLORS.dark }}>
            {metrics.pendingOrders}
          </p>
          <p className="text-xs" style={{ color: "#F59E0B" }}>
            Requieren atención inmediata
          </p>
        </motion.div>

        {/* KPI 3: Ticket Promedio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-xl p-5 shadow-sm bg-white border"
          style={{ borderColor: PURPLE_COLORS.accent }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: PURPLE_COLORS.secondary }}>
              Ticket Promedio
            </p>
            <div className="p-2 rounded-lg" style={{ backgroundColor: PURPLE_COLORS.accent }}>
              <DollarSign size={18} style={{ color: PURPLE_COLORS.primary }} />
            </div>
          </div>
          <p className="text-2xl font-bold mb-1" style={{ color: PURPLE_COLORS.dark }}>
            {formatCurrency(metrics.averageTicket)}
          </p>
          <p className="text-xs" style={{ color: "#6B7280" }}>
            Por orden de venta
          </p>
        </motion.div>

        {/* KPI 4: Productos Stock Bajo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="rounded-xl p-5 shadow-sm bg-white border"
          style={{ borderColor: PURPLE_COLORS.accent }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: PURPLE_COLORS.secondary }}>
              Stock Bajo
            </p>
            <div className="p-2 rounded-lg" style={{ backgroundColor: PURPLE_COLORS.accent }}>
              <Package size={18} style={{ color: PURPLE_COLORS.primary }} />
            </div>
          </div>
          <p className="text-2xl font-bold mb-1" style={{ color: PURPLE_COLORS.dark }}>
            {metrics.lowStockProducts}
          </p>
          <p className="text-xs" style={{ color: metrics.lowStockProducts > 0 ? "#EF4444" : "#10B981" }}>
            {metrics.lowStockProducts > 0 ? "Requieren reposición" : "Todo en orden"}
          </p>
        </motion.div>
      </div>

      {/* Segunda Fila de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 5: Total de Órdenes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="rounded-xl p-5 shadow-sm bg-white border"
          style={{ borderColor: PURPLE_COLORS.accent }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: PURPLE_COLORS.secondary }}>
              Total de Órdenes
            </p>
            <div className="p-2 rounded-lg" style={{ backgroundColor: PURPLE_COLORS.accent }}>
              <BarChart3 size={18} style={{ color: PURPLE_COLORS.primary }} />
            </div>
          </div>
          <p className="text-2xl font-bold mb-1" style={{ color: PURPLE_COLORS.dark }}>
            {metrics.totalDeals}
          </p>
          <p className="text-xs" style={{ color: "#6B7280" }}>
            Todas las órdenes registradas
          </p>
        </motion.div>

        {/* KPI 6: Clientes Activos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="rounded-xl p-5 shadow-sm bg-white border"
          style={{ borderColor: PURPLE_COLORS.accent }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: PURPLE_COLORS.secondary }}>
              Clientes Activos (30 días)
            </p>
            <div className="p-2 rounded-lg" style={{ backgroundColor: PURPLE_COLORS.accent }}>
              <Users size={18} style={{ color: PURPLE_COLORS.primary }} />
            </div>
          </div>
          <p className="text-2xl font-bold mb-1" style={{ color: PURPLE_COLORS.dark }}>
            {metrics.activeCustomers}
          </p>
          <p className="text-xs" style={{ color: "#6B7280" }}>
            Con compras en el último mes
          </p>
        </motion.div>

        {/* KPI 7: Tasa de Conversión */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="rounded-xl p-5 shadow-sm bg-white border"
          style={{ borderColor: PURPLE_COLORS.accent }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: PURPLE_COLORS.secondary }}>
              Tasa de Conversión
            </p>
            <div className="p-2 rounded-lg" style={{ backgroundColor: PURPLE_COLORS.accent }}>
              <MessageSquare size={18} style={{ color: PURPLE_COLORS.primary }} />
            </div>
          </div>
          <p className="text-2xl font-bold mb-1" style={{ color: PURPLE_COLORS.dark }}>
            {metrics.replyRate}%
          </p>
          <p className="text-xs" style={{ color: "#6B7280" }}>
            Órdenes pagadas vs. total
          </p>
        </motion.div>

        {/* KPI 8: Pipeline de Ventas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="rounded-xl p-5 shadow-sm bg-white border"
          style={{ borderColor: PURPLE_COLORS.accent }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: PURPLE_COLORS.secondary }}>
              Pipeline Total
            </p>
            <div className="p-2 rounded-lg" style={{ backgroundColor: PURPLE_COLORS.accent }}>
              <TrendingUp size={18} style={{ color: PURPLE_COLORS.primary }} />
            </div>
          </div>
          <p className="text-2xl font-bold mb-1" style={{ color: PURPLE_COLORS.dark }}>
            {formatCurrency(metrics.salesPipeline)}
          </p>
          <p className={`text-xs ${metrics.salesPipelineChange >= 0 ? "text-green-600" : "text-red-600"}`}>
            {metrics.salesPipelineChange >= 0 ? "↑" : "↓"} {Math.abs(metrics.salesPipelineChange).toFixed(1)}% vs. anterior
          </p>
        </motion.div>
      </div>

      {/* Fila Inferior: Average Ticket Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="rounded-xl p-6 shadow-sm bg-white border"
        style={{ borderColor: PURPLE_COLORS.accent }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>
            Ticket Promedio
          </h3>
          <select className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
            <option>Últimos 6 meses</option>
            <option>Último mes</option>
            <option>Último año</option>
          </select>
        </div>
        <div className="flex items-center gap-4 mb-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#3B82F6" }}></div>
            <span style={{ color: "#6B7280" }}>Checkout</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PURPLE_COLORS.primary }}></div>
            <span style={{ color: "#6B7280" }}>Visualizando</span>
          </div>
        </div>
        <ChartContainer
          config={{
            checkout: { color: "#3B82F6" },
            viewing: { color: PURPLE_COLORS.primary },
          }}
          className="h-[300px]"
        >
          <LineChart data={averageTicketData}>
            <CartesianGrid strokeDasharray="3 3" stroke={PURPLE_COLORS.accent} />
            <XAxis 
              dataKey="month" 
              tick={{ fill: "#6B7280", fontSize: 12 }}
            />
            <YAxis 
              tick={{ fill: "#6B7280", fontSize: 12 }}
              domain={[250, 5000]}
              tickFormatter={(value) => {
                if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
                return value.toString()
              }}
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
              dataKey="checkout" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ fill: "#3B82F6", r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="viewing" 
              stroke={PURPLE_COLORS.primary} 
              strokeWidth={2}
              dot={{ fill: PURPLE_COLORS.primary, r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      </motion.div>
    </div>
  )
}
