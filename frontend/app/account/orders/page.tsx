"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { salesService } from "@/lib/services/sales-service"
import { Loader2 } from "lucide-react"
import type { SalesOrder } from "@/lib/contracts"

export default function OrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true)
        setError(null)
        // Pasar myOrders: true para obtener solo los pedidos del usuario autenticado
        const ordersList = await salesService.listOrders(undefined, true)
        // Ordenar por fecha más reciente primero
        ordersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setOrders(ordersList)
      } catch (err: any) {
        console.error("Error loading orders:", err)
        console.error("Error status:", err?.status)
        console.error("Error details:", err?.detail)
        console.error("Error raw text:", err?.rawText)
        
        // Si es un error 403, el usuario no tiene permisos (normal para usuarios no-admin)
        if (err?.status === 403) {
          console.log("Usuario no tiene permisos para ver órdenes (requiere admin)")
          setOrders([])
          setError(null) // No mostrar error, solo lista vacía
        } else if (err?.status === 401) {
          // Error de autenticación - redirigir al login
          setError("Debes iniciar sesión para ver tus pedidos")
          setOrders([])
        } else if (err?.status === 422) {
          // Error de validación - mostrar mensaje más específico
          let errorMessage = "Error de validación en los parámetros"
          if (err?.detail) {
            if (Array.isArray(err.detail.detail)) {
              errorMessage = err.detail.detail.map((e: any) => `${e.loc?.join('.') || ''}: ${e.msg || e.message || ''}`).join(', ')
            } else if (typeof err.detail.detail === 'string') {
              errorMessage = err.detail.detail
            } else if (err.detail.message) {
              errorMessage = err.detail.message
            } else if (typeof err.detail === 'string') {
              errorMessage = err.detail
            }
          }
          console.error("Error de validación:", errorMessage)
          setError(`Error de validación: ${errorMessage}`)
          setOrders([])
        } else {
          setError(err instanceof Error ? err.message : "Error al cargar los pedidos")
          setOrders([])
        }
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [])

  const statusLabel: Record<string, string> = {
    PENDIENTE: "Pendiente",
    PAGADO: "Pagado",
    ENVIADO: "Enviado",
    ENTREGADO: "Entregado",
    CANCELADO: "Cancelado",
    pendiente: "Pendiente",
    paid: "Pagado",
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
  }

  const statusColor: Record<string, string> = {
    PENDIENTE: "bg-yellow-100 text-yellow-800",
    PAGADO: "bg-blue-100 text-blue-800",
    ENVIADO: "bg-orange-100 text-orange-800",
    ENTREGADO: "bg-green-100 text-green-800",
    CANCELADO: "bg-red-100 text-red-800",
    pendiente: "bg-yellow-100 text-yellow-800",
    paid: "bg-blue-100 text-blue-800",
    shipped: "bg-orange-100 text-orange-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">Mis Pedidos</h2>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">Mis Pedidos</h2>
        <div className="text-center py-12 p-6 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-neutral-900 mb-6">Mis Pedidos</h2>

      {orders.length === 0 ? (
        <div className="text-center py-12 p-6 bg-neutral-50 rounded-lg">
          <p className="text-neutral-600 mb-4">No tienes pedidos aún</p>
          <Link href="/catalogo" className="text-red-600 font-bold hover:underline">
            Empezar a comprar
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const orderDate = new Date(order.createdAt)
            const statusKey = order.status.toUpperCase()
            const status = statusLabel[statusKey] || statusLabel[order.status] || order.status
            const color = statusColor[statusKey] || statusColor[order.status] || "bg-neutral-100 text-neutral-800"
            const itemsCount = order.items.reduce((sum, item) => sum + item.qty, 0)

            return (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <div>
                  <h3 className="font-bold text-neutral-900">Pedido #{order.id}</h3>
                  <p className="text-sm text-neutral-600">
                    {orderDate.toLocaleDateString("es-BO", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    • {itemsCount} artículo{itemsCount !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-bold text-neutral-900">
                      Bs. {order.totals.total.toLocaleString("es-BO")}
                    </p>
                    <span className={`inline-block px-3 py-1 rounded text-xs font-bold ${color}`}>
                      {status}
                    </span>
                  </div>

                  <Link
                    href={`/order/${order.id}`}
                    className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Ver Detalles
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
