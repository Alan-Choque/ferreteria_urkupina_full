"use client"

import Link from "next/link"
import Header from "@/components/header"
import MegaMenu from "@/components/mega-menu"

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  // Mock order data
  const order = {
    id: params.id,
    date: "2024-11-15",
    status: "shipped" as const,
    customer: "Juan Pérez",
    email: "juan@example.com",
    phone: "71234567",
    shippingAddress: "Calle Principal 123, Apto 4B, La Paz",
    items: [
      { name: "Taladro Bosch GSB 20-2", quantity: 1, price: 244000 },
      { name: "Esmeril Angular Bosch", quantity: 1, price: 189000 },
    ],
    subtotal: 433000,
    discount: 43300,
    shipping: 50,
    total: 389750,
  }

  const timeline = [
    { status: "Pending", label: "Pedido Realizado", date: "2024-11-15", completed: true },
    { status: "Paid", label: "Pago Recibido", date: "2024-11-15", completed: true },
    { status: "Shipped", label: "Enviado", date: "2024-11-17", completed: true },
    { status: "Delivered", label: "Entregado", date: "", completed: false },
  ]

  return (
    <>
      <Header />
      <MegaMenu />
      <main className="min-h-screen bg-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <Link href="/account/orders" className="text-red-600 font-bold hover:underline">
              ← Volver a Pedidos
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-neutral-900 mb-8">Pedido {order.id}</h1>

          <div className="grid grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="col-span-2 space-y-8">
              {/* Status Timeline */}
              <div className="p-6 bg-neutral-50 rounded-lg border border-neutral-200">
                <h2 className="font-bold text-lg text-neutral-900 mb-6">Estado del Pedido</h2>
                <div className="space-y-4">
                  {timeline.map((item, index) => (
                    <div key={item.status} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            item.completed ? "bg-green-600 text-white" : "bg-neutral-300 text-neutral-600"
                          }`}
                        >
                          ✓
                        </div>
                        {index < timeline.length - 1 && (
                          <div className={`w-1 h-12 ${item.completed ? "bg-green-600" : "bg-neutral-300"}`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-neutral-900">{item.label}</h3>
                        {item.date && (
                          <p className="text-sm text-neutral-600">
                            {new Date(item.date).toLocaleDateString("es-BO", {
                              weekday: "long",
                              day: "2-digit",
                              month: "long",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items */}
              <div className="p-6 bg-neutral-50 rounded-lg border border-neutral-200">
                <h2 className="font-bold text-lg text-neutral-900 mb-4">Artículos</h2>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between py-3 border-b border-neutral-200 last:border-b-0">
                      <div>
                        <p className="font-medium text-neutral-900">{item.name}</p>
                        <p className="text-sm text-neutral-600">Cantidad: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-neutral-900">Bs. {item.price.toLocaleString("es-BO")}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="p-6 bg-neutral-50 rounded-lg border border-neutral-200">
                <h2 className="font-bold text-lg text-neutral-900 mb-4">Dirección de Envío</h2>
                <p className="text-neutral-700">{order.shippingAddress}</p>
              </div>

              {/* Action */}
              <button className="w-full py-3 border border-neutral-300 text-neutral-900 font-bold rounded-lg hover:bg-neutral-100">
                Descargar Recibo en PDF
              </button>
            </div>

            {/* Sidebar */}
            <div className="col-span-1">
              <div className="sticky top-4 p-6 bg-neutral-50 rounded-lg border border-neutral-200 space-y-6">
                {/* Customer Info */}
                <div>
                  <h3 className="font-bold text-neutral-900 mb-3">Información del Cliente</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-neutral-600">Nombre:</span> {order.customer}
                    </p>
                    <p>
                      <span className="text-neutral-600">Email:</span> {order.email}
                    </p>
                    <p>
                      <span className="text-neutral-600">Teléfono:</span> {order.phone}
                    </p>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t border-neutral-200 pt-4">
                  <h3 className="font-bold text-neutral-900 mb-3">Resumen</h3>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>Bs. {order.subtotal.toLocaleString("es-BO")}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Descuento:</span>
                        <span>-Bs. {order.discount.toLocaleString("es-BO")}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Envío:</span>
                      <span>Bs. {order.shipping}</span>
                    </div>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-4 border-t border-neutral-200">
                    <span>Total:</span>
                    <span>Bs. {order.total.toLocaleString("es-BO")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-neutral-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-neutral-400 text-sm">
          <p>&copy; 2025 Ferretería Urkupina. Todos los derechos reservados.</p>
        </div>
      </footer>
    </>
  )
}
