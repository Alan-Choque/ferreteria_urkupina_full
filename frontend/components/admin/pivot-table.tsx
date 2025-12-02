"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { 
  ArrowUpDown, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Users, 
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  Filter,
  Download,
  Eye
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, Area, AreaChart, Legend } from "recharts"
import { ChartContainer } from "@/components/ui/chart"

type PivotData = {
  category: string
  month: string
  sales: number
  orders: number
  customers: number
  products: number
}

type PivotTableProps = {
  data: PivotData[]
  loading?: boolean
}

// Colores morado y blanco
const PURPLE_COLORS = {
  primary: "#8B5CF6",
  secondary: "#A78BFA",
  light: "#C4B5FD",
  dark: "#6D28D9",
  accent: "#EDE9FE",
}

const WHITE = "#FFFFFF"

// Animación de jitter solo para entrada inicial
const jitterEntryVariants = {
  initial: {
    opacity: 0,
    x: [0, -3, 3, -2, 2, 0],
    y: [0, 2, -2, 3, -3, 0],
    rotate: [0, -1, 1, -0.5, 0.5, 0],
  },
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    rotate: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
}

export default function PivotTable({ data, loading = false }: PivotTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof PivotData | null; direction: "asc" | "desc" }>({
    key: null,
    direction: "asc",
  })
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"table" | "charts">("charts")

  // Procesar datos para el tablero pivote
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return []

    const grouped = data.reduce((acc, item) => {
      const key = `${item.category}-${item.month}`
      if (!acc[key]) {
        acc[key] = {
          category: item.category,
          month: item.month,
          sales: 0,
          orders: 0,
          customers: 0,
          products: 0,
        }
      }
      acc[key].sales += item.sales
      acc[key].orders += item.orders
      acc[key].customers += item.customers
      acc[key].products += item.products
      return acc
    }, {} as Record<string, PivotData>)

    return Object.values(grouped)
  }, [data])

  // Datos para gráficos
  const chartData = useMemo(() => {
    const byCategory = processedData.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = {
          category: item.category,
          sales: 0,
          orders: 0,
          customers: 0,
          products: 0,
        }
      }
      acc[item.category].sales += item.sales
      acc[item.category].orders += item.orders
      acc[item.category].customers += item.customers
      acc[item.category].products += item.products
      return acc
    }, {} as Record<string, any>)

    return Object.values(byCategory)
  }, [processedData])

  const monthlyData = useMemo(() => {
    const byMonth = processedData.reduce((acc, item) => {
      if (!acc[item.month]) {
        acc[item.month] = {
          month: item.month,
          sales: 0,
          orders: 0,
        }
      }
      acc[item.month].sales += item.sales
      acc[item.month].orders += item.orders
      return acc
    }, {} as Record<string, any>)

    return Object.values(byMonth).sort((a, b) => {
      const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
      return months.indexOf(a.month) - months.indexOf(b.month)
    })
  }, [processedData])

  // Ordenar datos
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return processedData

    return [...processedData].sort((a, b) => {
      const aValue = a[sortConfig.key!]
      const bValue = b[sortConfig.key!]

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue
      }

      return 0
    })
  }, [processedData, sortConfig])

  // Totales
  const totals = useMemo(() => {
    return sortedData.reduce(
      (acc, item) => {
        acc.sales += item.sales
        acc.orders += item.orders
        acc.customers += item.customers
        acc.products += item.products
        return acc
      },
      { sales: 0, orders: 0, customers: 0, products: 0 }
    )
  }, [sortedData])

  const handleSort = (key: keyof PivotData) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }))
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("es-BO").format(value)
  }

  const pieColors = [PURPLE_COLORS.primary, PURPLE_COLORS.secondary, PURPLE_COLORS.light, PURPLE_COLORS.dark, "#9333EA", "#7C3AED"]

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: PURPLE_COLORS.primary }}></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas principales */}
      <motion.div
        variants={jitterEntryVariants}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          className="rounded-xl p-6 shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${PURPLE_COLORS.primary} 0%, ${PURPLE_COLORS.dark} 100%)`,
            color: WHITE,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <DollarSign size={24} className="opacity-80" />
            <TrendingUp size={20} className="opacity-80" />
          </div>
          <p className="text-sm opacity-90 mb-1">Ventas Totales</p>
          <p className="text-2xl font-bold">{formatCurrency(totals.sales)}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          className="rounded-xl p-6 shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${PURPLE_COLORS.secondary} 0%, ${PURPLE_COLORS.primary} 100%)`,
            color: WHITE,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <Package size={24} className="opacity-80" />
            <Activity size={20} className="opacity-80" />
          </div>
          <p className="text-sm opacity-90 mb-1">Órdenes</p>
          <p className="text-2xl font-bold">{formatNumber(totals.orders)}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          className="rounded-xl p-6 shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${PURPLE_COLORS.light} 0%, ${PURPLE_COLORS.secondary} 100%)`,
            color: WHITE,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <Users size={24} className="opacity-80" />
            <Target size={20} className="opacity-80" />
          </div>
          <p className="text-sm opacity-90 mb-1">Clientes</p>
          <p className="text-2xl font-bold">{formatNumber(totals.customers)}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          className="rounded-xl p-6 shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${PURPLE_COLORS.dark} 0%, ${PURPLE_COLORS.primary} 100%)`,
            color: WHITE,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <Zap size={24} className="opacity-80" />
            <BarChart3 size={20} className="opacity-80" />
          </div>
          <p className="text-sm opacity-90 mb-1">Productos</p>
          <p className="text-2xl font-bold">{formatNumber(totals.products)}</p>
        </motion.div>
      </motion.div>

      {/* Controles de vista */}
      <motion.div
        variants={jitterEntryVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("charts")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === "charts" 
                ? "text-white shadow-lg" 
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
            style={viewMode === "charts" ? { backgroundColor: PURPLE_COLORS.primary } : {}}
          >
            <BarChart3 size={18} className="inline mr-2" />
            Gráficos
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === "table" 
                ? "text-white shadow-lg" 
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
            style={viewMode === "table" ? { backgroundColor: PURPLE_COLORS.primary } : {}}
          >
            <Eye size={18} className="inline mr-2" />
            Tabla
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 rounded-lg bg-white text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
            <Filter size={18} className="inline mr-2" />
            Filtros
          </button>
          <button className="px-4 py-2 rounded-lg bg-white text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
            <Download size={18} className="inline mr-2" />
            Exportar
          </button>
        </div>
      </motion.div>

      {/* Vista de Gráficos */}
      {viewMode === "charts" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de barras por categoría */}
          <motion.div
            variants={jitterEntryVariants}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.3 }}
            className="rounded-xl p-6 shadow-lg bg-white"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>
                Ventas por Categoría
              </h3>
              <BarChart3 size={20} style={{ color: PURPLE_COLORS.primary }} />
            </div>
            <ChartContainer
              config={{
                sales: { color: PURPLE_COLORS.primary },
              }}
              className="h-[300px]"
            >
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={PURPLE_COLORS.accent} />
                <XAxis 
                  dataKey="category" 
                  tick={{ fill: PURPLE_COLORS.dark }}
                  style={{ fontSize: "12px" }}
                />
                <YAxis 
                  tick={{ fill: PURPLE_COLORS.dark }}
                  style={{ fontSize: "12px" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: WHITE,
                    border: `1px solid ${PURPLE_COLORS.light}`,
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="sales" fill={PURPLE_COLORS.primary} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </motion.div>

          {/* Gráfico de líneas mensual */}
          <motion.div
            variants={jitterEntryVariants}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.4 }}
            className="rounded-xl p-6 shadow-lg bg-white"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>
                Tendencia Mensual
              </h3>
              <Activity size={20} style={{ color: PURPLE_COLORS.primary }} />
            </div>
            <ChartContainer
              config={{
                sales: { color: PURPLE_COLORS.primary },
                orders: { color: PURPLE_COLORS.secondary },
              }}
              className="h-[300px]"
            >
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PURPLE_COLORS.primary} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={PURPLE_COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={PURPLE_COLORS.accent} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: PURPLE_COLORS.dark }}
                  style={{ fontSize: "12px" }}
                />
                <YAxis 
                  tick={{ fill: PURPLE_COLORS.dark }}
                  style={{ fontSize: "12px" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: WHITE,
                    border: `1px solid ${PURPLE_COLORS.light}`,
                    borderRadius: "8px",
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke={PURPLE_COLORS.primary} 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="orders" 
                  stroke={PURPLE_COLORS.secondary} 
                  fillOpacity={0.3} 
                  fill={PURPLE_COLORS.secondary} 
                />
              </AreaChart>
            </ChartContainer>
          </motion.div>

          {/* Gráfico de pastel */}
          <motion.div
            variants={jitterEntryVariants}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.5 }}
            className="rounded-xl p-6 shadow-lg bg-white"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>
                Distribución de Ventas
              </h3>
              <PieChart size={20} style={{ color: PURPLE_COLORS.primary }} />
            </div>
            <ChartContainer
              config={{
                sales: { color: PURPLE_COLORS.primary },
              }}
              className="h-[300px]"
            >
              <RechartsPieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill={PURPLE_COLORS.primary}
                  dataKey="sales"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: WHITE,
                    border: `1px solid ${PURPLE_COLORS.light}`,
                    borderRadius: "8px",
                  }}
                />
              </RechartsPieChart>
            </ChartContainer>
          </motion.div>

          {/* Gráfico de comparación */}
          <motion.div
            variants={jitterEntryVariants}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.6 }}
            className="rounded-xl p-6 shadow-lg bg-white"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>
                Órdenes vs Clientes
              </h3>
              <Target size={20} style={{ color: PURPLE_COLORS.primary }} />
            </div>
            <ChartContainer
              config={{
                orders: { color: PURPLE_COLORS.primary },
                customers: { color: PURPLE_COLORS.secondary },
              }}
              className="h-[300px]"
            >
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={PURPLE_COLORS.accent} />
                <XAxis 
                  dataKey="category" 
                  tick={{ fill: PURPLE_COLORS.dark }}
                  style={{ fontSize: "12px" }}
                />
                <YAxis 
                  tick={{ fill: PURPLE_COLORS.dark }}
                  style={{ fontSize: "12px" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: WHITE,
                    border: `1px solid ${PURPLE_COLORS.light}`,
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="orders" fill={PURPLE_COLORS.primary} radius={[8, 8, 0, 0]} />
                <Bar dataKey="customers" fill={PURPLE_COLORS.secondary} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </motion.div>
        </div>
      )}

      {/* Vista de Tabla */}
      {viewMode === "table" && (
        <motion.div
          variants={jitterEntryVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
          className="rounded-xl shadow-lg overflow-hidden bg-white"
        >
          <div className="p-6" style={{ backgroundColor: PURPLE_COLORS.accent }}>
            <h2 className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
              Tabla de Datos Detallada
            </h2>
            <p className="text-sm mt-1" style={{ color: PURPLE_COLORS.primary }}>
              Visualiza y ordena todos los datos de manera interactiva
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: PURPLE_COLORS.primary, color: WHITE }}>
                  <th
                    className="text-left p-4 font-semibold cursor-pointer select-none hover:opacity-80 transition-opacity"
                    onClick={() => handleSort("category")}
                  >
                    <div className="flex items-center gap-2">
                      Categoría
                      <ArrowUpDown size={14} />
                    </div>
                  </th>
                  <th
                    className="text-left p-4 font-semibold cursor-pointer select-none hover:opacity-80 transition-opacity"
                    onClick={() => handleSort("month")}
                  >
                    <div className="flex items-center gap-2">
                      Mes
                      <ArrowUpDown size={14} />
                    </div>
                  </th>
                  <th
                    className="text-right p-4 font-semibold cursor-pointer select-none hover:opacity-80 transition-opacity"
                    onClick={() => handleSort("sales")}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Ventas
                      <ArrowUpDown size={14} />
                    </div>
                  </th>
                  <th
                    className="text-right p-4 font-semibold cursor-pointer select-none hover:opacity-80 transition-opacity"
                    onClick={() => handleSort("orders")}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Órdenes
                      <ArrowUpDown size={14} />
                    </div>
                  </th>
                  <th
                    className="text-right p-4 font-semibold cursor-pointer select-none hover:opacity-80 transition-opacity"
                    onClick={() => handleSort("customers")}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Clientes
                      <ArrowUpDown size={14} />
                    </div>
                  </th>
                  <th
                    className="text-right p-4 font-semibold cursor-pointer select-none hover:opacity-80 transition-opacity"
                    onClick={() => handleSort("products")}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Productos
                      <ArrowUpDown size={14} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-gray-500">
                      No hay datos disponibles
                    </td>
                  </tr>
                ) : (
                  sortedData.map((row, index) => (
                    <motion.tr
                      key={`${row.category}-${row.month}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.3 }}
                      className="border-b hover:bg-purple-50 transition-colors"
                      style={{
                        borderColor: PURPLE_COLORS.accent,
                        backgroundColor: hoveredCell === `${row.category}-${row.month}` ? PURPLE_COLORS.accent : "transparent",
                      }}
                      onMouseEnter={() => setHoveredCell(`${row.category}-${row.month}`)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <td className="p-4 font-medium" style={{ color: PURPLE_COLORS.dark }}>
                        {row.category}
                      </td>
                      <td className="p-4" style={{ color: PURPLE_COLORS.primary }}>
                        {row.month}
                      </td>
                      <td className="p-4 text-right font-semibold" style={{ color: PURPLE_COLORS.primary }}>
                        <div className="flex items-center justify-end gap-2">
                          <DollarSign size={14} />
                          {formatCurrency(row.sales)}
                        </div>
                      </td>
                      <td className="p-4 text-right" style={{ color: PURPLE_COLORS.dark }}>
                        <div className="flex items-center justify-end gap-2">
                          <Package size={14} />
                          {formatNumber(row.orders)}
                        </div>
                      </td>
                      <td className="p-4 text-right" style={{ color: PURPLE_COLORS.dark }}>
                        <div className="flex items-center justify-end gap-2">
                          <Users size={14} />
                          {formatNumber(row.customers)}
                        </div>
                      </td>
                      <td className="p-4 text-right" style={{ color: PURPLE_COLORS.dark }}>
                        <div className="flex items-center justify-end gap-2">
                          <Package size={14} />
                          {formatNumber(row.products)}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
                {sortedData.length > 0 && (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: sortedData.length * 0.03 + 0.2 }}
                    style={{
                      backgroundColor: PURPLE_COLORS.primary,
                      color: WHITE,
                    }}
                  >
                    <td className="p-4 font-bold" colSpan={2}>
                      TOTALES
                    </td>
                    <td className="p-4 text-right font-bold">
                      <div className="flex items-center justify-end gap-2">
                        <DollarSign size={16} />
                        {formatCurrency(totals.sales)}
                      </div>
                    </td>
                    <td className="p-4 text-right font-bold">{formatNumber(totals.orders)}</td>
                    <td className="p-4 text-right font-bold">{formatNumber(totals.customers)}</td>
                    <td className="p-4 text-right font-bold">{formatNumber(totals.products)}</td>
                  </motion.tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  )
}
