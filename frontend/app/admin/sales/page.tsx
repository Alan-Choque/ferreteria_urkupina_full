"use client"

import { useEffect, useState } from "react"
import { salesService } from "@/lib/services/sales-service"
import { Eye, Printer } from "lucide-react"
import { motion } from "framer-motion"
import type { SalesOrder, OrderStatus } from "@/lib/contracts"

export default function SalesPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await salesService.listOrders()
        setOrders(data)
      } catch (error) {
        console.error("Error loading orders:", error)
      } finally {
        setLoading(false)
      }
    }
    loadOrders()
  }, [])

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      PENDIENTE: "bg-yellow-600/20 text-yellow-400",
      PAGADO: "bg-green-600/20 text-green-400",
      ENVIADO: "bg-blue-600/20 text-blue-400",
      ENTREGADO: "bg-purple-600/20 text-purple-400",
      CANCELADO: "bg-red-600/20 text-red-400",
    }
    return colors[status] || "bg-gray-600/20 text-gray-400"
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Ventas / Órdenes</h1>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden"
      >
        {loading ? (
          <div className="p-6 text-center text-gray-400">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Orden ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Cliente</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Items</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Total</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Estado</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Fecha</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono">{order.id}</td>
                    <td className="px-6 py-4 text-sm">{order.customerId || "Sin asignar"}</td>
                    <td className="px-6 py-4 text-sm">{order.items.length}</td>
                    <td className="px-6 py-4 text-sm">{formatCurrency(order.totals.total)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{new Date(order.createdAt).toLocaleDateString("es-BO")}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="text-gray-400 hover:text-blue-400 transition-colors">
                          <Eye size={18} />
                        </button>
                        <button className="text-gray-400 hover:text-green-400 transition-colors">
                          <Printer size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}
