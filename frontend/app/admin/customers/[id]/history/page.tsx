"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { customersService } from "@/lib/services/customers-service"
import { 
  History, 
  ShoppingCart, 
  Package, 
  FileText, 
  CreditCard, 
  ArrowLeft,
  Loader2,
  X,
  CheckCircle,
} from "lucide-react"

const PURPLE_COLORS = {
  primary: "#8B5CF6",
  secondary: "#A78BFA",
  light: "#C4B5FD",
  dark: "#6D28D9",
  accent: "#EDE9FE",
}

export default function CustomerHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = parseInt(params.id as string)
  
  const [historyData, setHistoryData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await customersService.getCustomerHistory(customerId)
        setHistoryData(data)
      } catch (err) {
        console.error("Error loading customer history", err)
        setError(err instanceof Error ? err.message : "No se pudo cargar el historial del cliente.")
      } finally {
        setLoading(false)
      }
    }
    if (customerId) {
      loadHistory()
    }
  }, [customerId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" size={32} style={{ color: PURPLE_COLORS.primary }} />
      </div>
    )
  }

  if (error || !historyData) {
    return (
      <div className="p-6">
        <button
          onClick={() => router.push("/admin/customers")}
          className="mb-4 flex items-center gap-2 text-sm hover:opacity-80"
          style={{ color: PURPLE_COLORS.primary }}
        >
          <ArrowLeft size={16} />
          Volver a clientes
        </button>
        <div className="text-center py-12 text-red-500">
          {error || "No se pudo cargar el historial"}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push("/admin/customers")}
            className="mb-2 flex items-center gap-2 text-sm hover:opacity-80"
            style={{ color: PURPLE_COLORS.primary }}
          >
            <ArrowLeft size={16} />
            Volver a clientes
          </button>
          <h1 className="text-3xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
            Historial de {historyData.current_data.nombre}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
            Compras, reservas, facturas y variaciones de datos
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4" style={{ borderColor: PURPLE_COLORS.accent }}>
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart size={18} style={{ color: PURPLE_COLORS.primary }} />
            <span className="text-sm font-semibold" style={{ color: "#6B7280" }}>Pedidos</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
            {historyData.statistics.total_orders}
          </p>
        </div>
        <div className="rounded-lg border p-4" style={{ borderColor: PURPLE_COLORS.accent }}>
          <div className="flex items-center gap-2 mb-2">
            <Package size={18} style={{ color: PURPLE_COLORS.primary }} />
            <span className="text-sm font-semibold" style={{ color: "#6B7280" }}>Reservas</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
            {historyData.statistics.total_reservations}
          </p>
        </div>
        <div className="rounded-lg border p-4" style={{ borderColor: PURPLE_COLORS.accent }}>
          <div className="flex items-center gap-2 mb-2">
            <FileText size={18} style={{ color: PURPLE_COLORS.primary }} />
            <span className="text-sm font-semibold" style={{ color: "#6B7280" }}>Facturas</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
            {historyData.statistics.total_invoices}
          </p>
        </div>
        <div className="rounded-lg border p-4" style={{ borderColor: PURPLE_COLORS.accent }}>
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={18} style={{ color: PURPLE_COLORS.primary }} />
            <span className="text-sm font-semibold" style={{ color: "#6B7280" }}>Total Gastado</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
            Bs. {historyData.statistics.total_spent.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Variaciones de Datos */}
      <div className="rounded-lg border p-6" style={{ borderColor: PURPLE_COLORS.accent }}>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: PURPLE_COLORS.dark }}>
          <History size={20} />
          Variaciones de Datos
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="font-medium mb-3" style={{ color: "#6B7280" }}>Nombres usados:</p>
            <div className="space-y-2">
              {historyData.variations.names.length > 0 ? (
                historyData.variations.names.map((name: string, idx: number) => (
                  <p key={idx} className="text-sm p-2 rounded bg-gray-50" style={{ color: "#1F2937" }}>
                    • {name}
                  </p>
                ))
              ) : (
                <p className="text-sm text-gray-400">No hay variaciones</p>
              )}
            </div>
          </div>
          <div>
            <p className="font-medium mb-3" style={{ color: "#6B7280" }}>Teléfonos usados:</p>
            <div className="space-y-2">
              {historyData.variations.phones.length > 0 ? (
                historyData.variations.phones.map((phone: string, idx: number) => (
                  <p key={idx} className="text-sm p-2 rounded bg-gray-50" style={{ color: "#1F2937" }}>
                    • {phone}
                  </p>
                ))
              ) : (
                <p className="text-sm text-gray-400">No hay variaciones</p>
              )}
            </div>
          </div>
          <div>
            <p className="font-medium mb-3" style={{ color: "#6B7280" }}>NIT/CI usados:</p>
            <div className="space-y-2">
              {historyData.variations.nits.length > 0 ? (
                historyData.variations.nits.map((nit: string, idx: number) => (
                  <p key={idx} className="text-sm p-2 rounded bg-gray-50" style={{ color: "#1F2937" }}>
                    • {nit}
                  </p>
                ))
              ) : (
                <p className="text-sm text-gray-400">No hay variaciones</p>
              )}
            </div>
          </div>
        </div>
        {historyData.variations.names.length === 1 && 
         historyData.variations.phones.length === 1 && 
         historyData.variations.nits.length <= 1 && (
          <div className="mt-4 p-3 rounded bg-green-50 border border-green-200">
            <p className="text-sm text-green-700 flex items-center gap-2">
              <CheckCircle size={16} />
              No hay duplicados detectados. Los datos del cliente son consistentes.
            </p>
          </div>
        )}
        {(historyData.variations.names.length > 1 || 
          historyData.variations.phones.length > 1 || 
          historyData.variations.nits.length > 1) && (
          <div className="mt-4 p-3 rounded bg-yellow-50 border border-yellow-200">
            <p className="text-sm text-yellow-700">
              ⚠️ Se detectaron variaciones en los datos. Esto puede indicar múltiples registros o actualizaciones.
            </p>
          </div>
        )}
      </div>

      {/* Historial de Pedidos */}
      {historyData.orders.items.length > 0 && (
        <div className="rounded-lg border p-6" style={{ borderColor: PURPLE_COLORS.accent }}>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: PURPLE_COLORS.dark }}>
            <ShoppingCart size={20} />
            Pedidos ({historyData.orders.total})
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {historyData.orders.items.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded bg-gray-50 hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-medium" style={{ color: "#1F2937" }}>
                    Pedido #{order.id}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                    {new Date(order.fecha).toLocaleDateString("es-BO", { 
                      year: "numeric", 
                      month: "long", 
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })} - {order.estado}
                  </p>
                </div>
                <p className="font-semibold text-lg" style={{ color: PURPLE_COLORS.dark }}>
                  Bs. {order.total?.toFixed(2) || "0.00"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información Actual */}
      <div className="rounded-lg border p-6" style={{ borderColor: PURPLE_COLORS.accent }}>
        <h2 className="text-xl font-semibold mb-4" style={{ color: PURPLE_COLORS.dark }}>Datos Actuales</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="font-medium mb-1" style={{ color: "#6B7280" }}>Nombre:</p>
            <p className="text-lg" style={{ color: "#1F2937" }}>{historyData.current_data.nombre}</p>
          </div>
          <div>
            <p className="font-medium mb-1" style={{ color: "#6B7280" }}>Teléfono:</p>
            <p className="text-lg" style={{ color: "#1F2937" }}>{historyData.current_data.telefono || "-"}</p>
          </div>
          <div>
            <p className="font-medium mb-1" style={{ color: "#6B7280" }}>Email:</p>
            <p className="text-lg" style={{ color: "#1F2937" }}>{historyData.current_data.correo || "-"}</p>
          </div>
          <div>
            <p className="font-medium mb-1" style={{ color: "#6B7280" }}>NIT/CI:</p>
            <p className="text-lg" style={{ color: "#1F2937" }}>{historyData.current_data.nit_ci || "-"}</p>
          </div>
          {historyData.current_data.usuario_id && (
            <div>
              <p className="font-medium mb-1" style={{ color: "#6B7280" }}>Cuenta vinculada:</p>
              <p className="text-green-600 text-sm flex items-center gap-2">
                <CheckCircle size={16} />
                Sí (Usuario ID: {historyData.current_data.usuario_id})
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

