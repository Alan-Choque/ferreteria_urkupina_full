"use client"
import { motion } from "framer-motion"
import { BarChart, TrendingUp, Package, ShoppingCart } from "lucide-react"

export default function AdminDashboard() {
  const stats = [
    { label: "Ventas Hoy", value: "Bs. 45,230", icon: ShoppingCart, type: "primary" },
    { label: "Productos", value: "1,245", icon: Package, type: "accent" },
    { label: "Clientes", value: "384", icon: TrendingUp, type: "success" },
    { label: "Órdenes Pendientes", value: "23", icon: BarChart, type: "warning" },
  ]

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

  const getColorForType = (type: string) => {
    const colors: Record<string, string> = {
      primary: "var(--admin-primary)",
      accent: "var(--admin-accent)",
      success: "var(--admin-success)",
      warning: "var(--admin-warning)",
    }
    return colors[type] || "var(--admin-primary)"
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Panel de Control</h1>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              className="rounded-lg p-6"
              style={{
                backgroundColor: "var(--admin-surface-light)",
                border: "1px solid var(--admin-border)",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold mt-2" style={{ color: "var(--admin-text-primary)" }}>
                    {stat.value}
                  </p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: getColorForType(stat.type) }}>
                  <Icon size={24} color="#FFFFFF" />
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="rounded-lg p-6 mt-6"
        style={{
          backgroundColor: "var(--admin-surface-light)",
          border: "1px solid var(--admin-border)",
        }}
      >
        <h2 className="text-xl font-bold mb-4">Actividad Reciente</h2>
        <div className="space-y-4">
          <div
            className="flex items-center justify-between border-b pb-3"
            style={{ borderColor: "var(--admin-border)" }}
          >
            <div>
              <p className="font-medium" style={{ color: "var(--admin-text-primary)" }}>
                Nueva orden registrada
              </p>
              <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>
                Hace 2 minutos
              </p>
            </div>
            <span style={{ color: "var(--admin-success)" }}>+Bs. 15,000</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
