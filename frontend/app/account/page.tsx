"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { authService } from "@/lib/services/auth-service"
import { salesService } from "@/lib/services/sales-service"
import { reservationsService } from "@/lib/services/reservations-service"
import { Loader2, Package, Calendar, User } from "lucide-react"
import type { AdminUser } from "@/lib/types/admin"
import type { SalesOrder } from "@/lib/contracts"
import type { Reservation } from "@/lib/types/admin"

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Cargar datos del usuario
        const userData = await authService.getCurrentUser()
        setUser(userData)

        // Cargar pedidos recientes del usuario autenticado (últimos 5)
        try {
          const ordersList = await salesService.listOrders(undefined, true) // myOrders: true para obtener solo las del usuario
          ordersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          setOrders(ordersList.slice(0, 5))
        } catch (err: any) {
          // Si es un error 401, el usuario no está autenticado
          if (err?.status === 401) {
            console.log("Usuario no autenticado, no se pueden cargar órdenes")
            setOrders([])
          } else if (err?.status === 403) {
            console.log("Usuario no tiene permisos para ver órdenes")
            setOrders([])
          } else {
            console.error("Error loading orders:", err)
            setOrders([])
          }
        }

        // Cargar reservaciones recientes del usuario autenticado (últimas 5)
        try {
          const reservationsList = await reservationsService.listReservations(undefined, true) // myReservations: true
          reservationsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          setReservations(reservationsList.slice(0, 5))
        } catch (err: any) {
          // Si es un error 401, el usuario no está autenticado
          if (err?.status === 401) {
            console.log("Usuario no autenticado, no se pueden cargar reservaciones")
            setReservations([])
          } else if (err?.status === 403) {
            console.log("Usuario no tiene permisos para ver reservaciones")
            setReservations([])
          } else {
            console.error("Error loading reservations:", err)
            setReservations([])
          }
        }
      } catch (err) {
        console.error("Error loading account data:", err)
        setError(err instanceof Error ? err.message : "Error al cargar la información")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">
              ¡Bienvenido, {user?.name || "Usuario"}!
            </h2>
            <p className="text-neutral-600">Gestiona tu cuenta y revisa tus pedidos</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-neutral-600">Total de Pedidos</p>
              <p className="text-2xl font-bold text-neutral-900">{orders.length}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-neutral-600">Reservaciones</p>
              <p className="text-2xl font-bold text-neutral-900">{reservations.length}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-neutral-600">Estado</p>
              <p className={`text-2xl font-bold ${user?.active ? "text-green-600" : "text-red-600"}`}>
                {user?.active ? "Activo" : "Inactivo"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-neutral-900">Pedidos Recientes</h3>
          <Link
            href="/account/orders"
            className="text-orange-600 hover:text-orange-700 font-medium text-sm"
          >
            Ver todos →
          </Link>
        </div>
        {orders.length === 0 ? (
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-lg text-center">
            <p className="text-neutral-600 mb-2">No tienes pedidos aún</p>
            <Link href="/catalogo" className="text-orange-600 hover:text-orange-700 font-medium">
              Empezar a comprar
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const orderDate = new Date(order.createdAt)
              const itemsCount = order.items.reduce((sum, item) => sum + item.qty, 0)
              return (
                <Link
                  key={order.id}
                  href={`/order/${order.id}`}
                  className="block p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-neutral-900">Pedido #{order.id}</p>
                      <p className="text-sm text-neutral-600">
                        {orderDate.toLocaleDateString("es-BO")} • {itemsCount} artículo{itemsCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-neutral-900">
                        Bs. {order.totals.total.toLocaleString("es-BO")}
                      </p>
                      <p className="text-xs text-neutral-500 capitalize">{order.status}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent Reservations */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-neutral-900">Reservaciones Recientes</h3>
          <Link
            href="/account/reservations"
            className="text-orange-600 hover:text-orange-700 font-medium text-sm"
          >
            Ver todas →
          </Link>
        </div>
        {reservations.length === 0 ? (
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-lg text-center">
            <p className="text-neutral-600">No tienes reservaciones aún</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reservations.map((res) => {
              const reservationDate = new Date(res.createdAt)
              return (
                <div
                  key={res.id}
                  className="p-4 border border-neutral-200 rounded-lg"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-neutral-900">{res.reservationNumber}</p>
                      <p className="text-sm text-neutral-600">
                        {reservationDate.toLocaleDateString("es-BO")} • Cantidad: {res.qty}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-neutral-500 capitalize">{res.status}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/account/profile"
          className="p-4 border-2 border-neutral-200 rounded-lg hover:border-orange-600 transition-colors"
        >
          <h4 className="font-bold text-neutral-900 mb-2">Editar Perfil</h4>
          <p className="text-sm text-neutral-600">Actualiza tu información personal</p>
        </Link>
        <Link
          href="/account/orders"
          className="p-4 border-2 border-neutral-200 rounded-lg hover:border-orange-600 transition-colors"
        >
          <h4 className="font-bold text-neutral-900 mb-2">Ver Todos los Pedidos</h4>
          <p className="text-sm text-neutral-600">Revisa el historial completo de tus compras</p>
        </Link>
      </div>
    </div>
  )
}


