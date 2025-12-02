"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { purchasesService } from "@/lib/services/purchases-service"
import { Loader2, X, Truck, ArrowLeft, CheckCircle } from "lucide-react"
import type { PurchaseOrder } from "@/lib/types/admin"

const PURPLE_COLORS = {
  primary: "#8B5CF6",
  secondary: "#A78BFA",
  light: "#C4B5FD",
  dark: "#6D28D9",
  accent: "#EDE9FE",
}

export default function PurchaseReceivingPage() {
  const router = useRouter()
  const [pendingOrders, setPendingOrders] = useState<PurchaseOrder[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string>("")
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [receivedItems, setReceivedItems] = useState<Array<{ itemId: number; qty: string }>>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const loadPending = async () => {
      setLoading(true)
      try {
        const orders = await purchasesService.listPOs()
        // Órdenes que pueden recibirse: CONFIRMADO o ENVIADO
        setPendingOrders(orders.filter(o => 
          o.status === "confirmado" || 
          o.status === "enviado" || 
          o.status === "sent"
        ))
      } catch (err) {
        console.error("Error loading pending orders:", err)
        setError(err instanceof Error ? err.message : "Error al cargar órdenes pendientes")
      } finally {
        setLoading(false)
      }
    }
    void loadPending()
  }, [])

  const handleSelectOrder = async (orderId: string) => {
    try {
      const order = await purchasesService.getPO(Number(orderId))
      setSelectedOrder(order)
      setReceivedItems(order.items.map(item => ({
        itemId: item.id,
        qty: String(item.qty),
      })))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar la orden")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrderId || !selectedOrder) {
      setError("Debes seleccionar una orden")
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      // Mapear items recibidos usando variante_producto_id de la orden original
      const items = receivedItems.map(receivedItem => {
        const originalItem = selectedOrder.items.find(item => item.id === receivedItem.itemId)
        return {
          variante_producto_id: originalItem?.productId || 0,
          cantidad: Number(receivedItem.qty),
          precio_unitario: originalItem?.price || null,
        }
      }).filter(item => item.variante_producto_id > 0)

      await purchasesService.receivePO(Number(selectedOrderId), {
        items,
        observaciones: null,
      })

      setSuccess("Recepción registrada correctamente")
      setSelectedOrderId("")
      setSelectedOrder(null)
      setReceivedItems([])
      
      // Recargar órdenes pendientes
      const orders = await purchasesService.listPOs()
      setPendingOrders(orders.filter(o => 
        o.status === "confirmado" || 
        o.status === "enviado" || 
        o.status === "sent"
      ))
    } catch (err) {
      console.error("Error receiving purchase order", err)
      setError(err instanceof Error ? err.message : "Error al registrar la recepción")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/admin/purchases")}
          className="flex items-center gap-2 text-sm hover:opacity-80"
          style={{ color: PURPLE_COLORS.primary }}
        >
          <ArrowLeft size={16} />
          Volver a compras
        </button>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
            Recepción de mercancía
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
            Registra la recepción de productos de órdenes de compra
          </p>
        </div>
      </div>

      {error && (
        <div className="border border-red-700 bg-red-900/30 text-red-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <X size={16} /> {error}
        </div>
      )}

      {success && (
        <div className="border border-green-600 bg-green-600/90 text-white px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle size={16} /> {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl shadow-sm bg-white border p-6" style={{ borderColor: PURPLE_COLORS.accent }}>
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: PURPLE_COLORS.dark }}>
            Orden de compra pendiente <span className="text-red-600">*</span>
          </label>
          {loading ? (
            <div className="flex items-center gap-2 text-sm" style={{ color: "#6B7280" }}>
              <Loader2 className="animate-spin" size={16} />
              Cargando órdenes...
            </div>
          ) : (
            <select
              value={selectedOrderId}
              onChange={(e) => {
                setSelectedOrderId(e.target.value)
                if (e.target.value) {
                  void handleSelectOrder(e.target.value)
                } else {
                  setSelectedOrder(null)
                  setReceivedItems([])
                }
              }}
              required
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
              style={{ borderColor: PURPLE_COLORS.accent, color: "#1F2937" }}
            >
              <option value="">Selecciona una orden</option>
              {pendingOrders.map(order => (
                <option key={order.id} value={order.id}>
                  {order.poNumber} - {typeof order.supplierId === "string" ? order.supplierId : `Proveedor ${order.supplierId}`} - {new Date(order.createdAt).toLocaleDateString("es-BO")}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedOrder && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4" style={{ borderColor: PURPLE_COLORS.accent }}>
              <h3 className="font-semibold mb-2" style={{ color: PURPLE_COLORS.dark }}>
                Información de la orden
              </h3>
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium" style={{ color: "#6B7280" }}>Número:</span>{" "}
                  <span style={{ color: "#1F2937" }}>{selectedOrder.poNumber}</span>
                </div>
                <div>
                  <span className="font-medium" style={{ color: "#6B7280" }}>Proveedor:</span>{" "}
                  <span style={{ color: "#1F2937" }}>{typeof selectedOrder.supplierId === "string" ? selectedOrder.supplierId : `Proveedor ${selectedOrder.supplierId}`}</span>
                </div>
                <div>
                  <span className="font-medium" style={{ color: "#6B7280" }}>Fecha:</span>{" "}
                  <span style={{ color: "#1F2937" }}>{new Date(selectedOrder.createdAt).toLocaleDateString("es-BO")}</span>
                </div>
                <div>
                  <span className="font-medium" style={{ color: "#6B7280" }}>Total:</span>{" "}
                  <span style={{ color: "#1F2937" }}>
                    {new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(selectedOrder.totalAmount ?? 0)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3" style={{ color: PURPLE_COLORS.dark }}>
                Cantidades recibidas
              </h3>
              <div className="space-y-3">
                {selectedOrder.items.map((item, index) => {
                  const receivedItem = receivedItems.find(ri => ri.itemId === item.id)
                  return (
                    <div key={item.id} className="border rounded-lg p-4" style={{ borderColor: PURPLE_COLORS.accent }}>
                      <div className="grid md:grid-cols-3 gap-4 items-center">
                        <div>
                          <p className="text-sm font-medium" style={{ color: "#1F2937" }}>
                            Item #{item.id}
                          </p>
                          <p className="text-xs" style={{ color: "#6B7280" }}>
                            Cantidad ordenada: {item.qty}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs mb-1" style={{ color: PURPLE_COLORS.dark }}>
                            Cantidad recibida
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={receivedItem?.qty || "0"}
                            onChange={(e) => {
                              const newQty = e.target.value
                              setReceivedItems(prev => {
                                const existing = prev.find(ri => ri.itemId === item.id)
                                if (existing) {
                                  return prev.map(ri => ri.itemId === item.id ? { ...ri, qty: newQty } : ri)
                                } else {
                                  return [...prev, { itemId: item.id, qty: newQty }]
                                }
                              })
                            }}
                            className="w-full border rounded py-1.5 px-2 text-sm bg-white focus:outline-none"
                            style={{ borderColor: PURPLE_COLORS.accent, color: "#1F2937" }}
                          />
                        </div>
                        <div className="text-right">
                          <p className="text-xs" style={{ color: "#6B7280" }}>
                            Precio: {new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(item.price)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: PURPLE_COLORS.accent }}>
          <button
            type="button"
            onClick={() => router.push("/admin/purchases")}
            className="px-4 py-2 border rounded-lg text-sm transition-colors"
            style={{ 
              borderColor: PURPLE_COLORS.accent,
              backgroundColor: "#FFFFFF",
              color: PURPLE_COLORS.primary
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || !selectedOrderId || !selectedOrder}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-white transition-colors"
            style={{ backgroundColor: PURPLE_COLORS.primary }}
          >
            {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Truck size={16} />}
            Registrar recepción
          </button>
        </div>
      </form>
    </div>
  )
}
