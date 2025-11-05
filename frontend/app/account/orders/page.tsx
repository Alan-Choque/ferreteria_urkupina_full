import Link from "next/link"

interface Order {
  id: string
  date: string
  status: "pending" | "paid" | "shipped" | "delivered"
  total: number
  items: number
}

export default function OrdersPage() {
  const orders: Order[] = [
    {
      id: "ORD-001",
      date: "2024-11-15",
      status: "delivered",
      total: 493050,
      items: 2,
    },
    {
      id: "ORD-002",
      date: "2024-11-10",
      status: "shipped",
      total: 240000,
      items: 1,
    },
    {
      id: "ORD-003",
      date: "2024-11-05",
      status: "paid",
      total: 350000,
      items: 3,
    },
  ]

  const statusLabel = {
    pending: "Pendiente",
    paid: "Pagado",
    shipped: "Enviado",
    delivered: "Entregado",
  }

  const statusColor = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-blue-100 text-blue-800",
    shipped: "bg-orange-100 text-orange-800",
    delivered: "bg-green-100 text-green-800",
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-neutral-900 mb-6">Mis Pedidos</h2>

      {orders.length === 0 ? (
        <div className="text-center py-12 p-6 bg-neutral-50 rounded-lg">
          <p className="text-neutral-600 mb-4">No tienes pedidos aún</p>
          <Link href="/categorias/herramientas-construccion" className="text-red-600 font-bold hover:underline">
            Empezar a comprar
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50"
            >
              <div>
                <h3 className="font-bold text-neutral-900">{order.id}</h3>
                <p className="text-sm text-neutral-600">
                  {new Date(order.date).toLocaleDateString("es-BO")} • {order.items} artículo(s)
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="font-bold text-neutral-900">Bs. {order.total.toLocaleString("es-BO")}</p>
                  <span className={`inline-block px-3 py-1 rounded text-xs font-bold ${statusColor[order.status]}`}>
                    {statusLabel[order.status]}
                  </span>
                </div>

                <Link
                  href={`/order/${order.id}`}
                  className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
                >
                  Ver Detalles
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
