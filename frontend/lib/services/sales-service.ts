import { api } from "@/lib/apiClient"
import type { SalesOrder } from "@/lib/contracts"

type SaleItemResponse = {
  id: number
  variante_producto_id: number
  variante_nombre?: string | null
  cantidad: number
  precio_unitario?: number | null
}

type SaleOrderResponse = {
  id: number
  fecha: string
  estado: string
  cliente?: { id: number; nombre: string } | null
  usuario?: { id: number; nombre_usuario: string } | null
  items: SaleItemResponse[]
  total: number
}

type SaleOrderListResponse = {
  items: SaleOrderResponse[]
  total: number
  page: number
  page_size: number
}

function toSalesOrder(order: SaleOrderResponse): SalesOrder {
  return {
    id: order.id.toString(),
    customerId: order.cliente?.nombre,
    status: order.estado as SalesOrder["status"],
    items: order.items.map((item) => ({
      id: item.id.toString(),
      variantId: item.variante_producto_id.toString(),
      sku: item.variante_producto_id.toString(),
      name: item.variante_nombre ?? "Variante",
      price: item.precio_unitario ?? 0,
      qty: item.cantidad,
    })),
    totals: {
      sub: order.total,
      discount: 0,
      shipping: 0,
      total: order.total,
      currency: "BOB",
    },
    shippingMethod: "RETIRO_TIENDA",
    createdAt: order.fecha,
  }
}

export const salesService = {
  async listOrders(): Promise<SalesOrder[]> {
    const response = await api.get<SaleOrderListResponse>("/sales")
    return response.items.map(toSalesOrder)
  },

  async getOrder(id: string): Promise<SalesOrder> {
    const response = await api.get<SaleOrderResponse>(`/sales/${id}`)
    return toSalesOrder(response)
  },

  async createOrder(): Promise<SalesOrder> {
    throw new Error("La creación de órdenes de venta no está habilitada todavía")
  },

  async updateOrder(): Promise<SalesOrder> {
    throw new Error("La actualización de órdenes de venta no está habilitada todavía")
  },

  async updateOrderStatus(): Promise<SalesOrder> {
    throw new Error("El cambio de estado de órdenes no está disponible todavía")
  },

  async addPayment(): Promise<never> {
    throw new Error("El registro de pagos no está habilitado todavía")
  },

  async listPayments(): Promise<never[]> {
    return []
  },
}
