"use client"
import { motion } from "framer-motion"
import { TrendingUp, Package, ShoppingCart, AlertCircle, Download } from "lucide-react"

export default function ReportsPage() {
  const reports = [
    {
      title: "Ventas por Período",
      icon: TrendingUp,
      color: "bg-green-600",
      value: "Bs. 125,400",
    },
    {
      title: "Productos Más Vendidos",
      icon: Package,
      color: "bg-blue-600",
      value: "12 items",
    },
    {
      title: "Órdenes Pendientes",
      icon: ShoppingCart,
      color: "bg-yellow-600",
      value: "23 órdenes",
    },
    {
      title: "Stock Bajo",
      icon: AlertCircle,
      color: "bg-red-600",
      value: "8 productos",
    },
  ]

  const handleExportCSV = () => {
    const csvContent = [
      ["Reporte de Ferretería Urkupina", new Date().toLocaleDateString("es-BO")],
      [],
      ["Métrica", "Valor"],
      ...reports.map((r) => [r.title, r.value]),
      [],
      ["Ventas por Categoría"],
      ["Categoría", "Porcentaje"],
      ["Herramientas Eléctricas", "25%"],
      ["Equipos de Taller", "50%"],
      ["Aseo y Jardín", "75%"],
      [],
      ["Top 5 Productos"],
      ["Posición", "Producto", "Monto"],
      ["1", "Taladro Bosch", "Bs. 60,000"],
      ["2", "Esmeril Angular", "Bs. 45,000"],
      ["3", "Aspirador", "Bs. 30,000"],
      ["4", "Nivel Láser", "Bs. 15,000"],
      ["5", "Cinta Métrica", "Bs. 10,000"],
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reportes-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reportes</h1>
        <button
          onClick={handleExportCSV}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Download size={20} />
          Exportar CSV
        </button>
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {reports.map((report) => {
          const Icon = report.icon
          return (
            <motion.div
              key={report.title}
              variants={itemVariants}
              className="bg-gray-800 border border-gray-700 rounded-lg p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{report.title}</p>
                  <p className="text-xl font-bold mt-2">{report.value}</p>
                </div>
                <div className={`${report.color} p-3 rounded-lg`}>
                  <Icon size={24} />
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4">Ventas por Categoría</h3>
          <div className="space-y-3">
            {["Herramientas Eléctricas", "Equipos de Taller", "Aseo y Jardín"].map((cat, i) => (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{cat}</span>
                  <span className="font-semibold">{(i + 1) * 25}%</span>
                </div>
                <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div className="bg-red-500 h-full" style={{ width: `${(i + 1) * 25}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4">Top 5 Productos</h3>
          <div className="space-y-2">
            {["Taladro Bosch", "Esmeril Angular", "Aspirador", "Nivel Láser", "Cinta Métrica"].map((product, i) => (
              <div key={product} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{i + 1}.</span>
                <span>{product}</span>
                <span className="font-semibold text-green-400">Bs. {(15000 * (5 - i)).toLocaleString("es-BO")}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
