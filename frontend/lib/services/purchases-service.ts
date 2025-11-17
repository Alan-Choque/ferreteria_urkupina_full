import { api } from "@/lib/apiClient"
import type { PurchaseOrder } from "@/lib/types/admin"

type PurchaseItemResponse = {
  id: number
  variante_producto_id: number
  variante_nombre?: string | null
  cantidad: number
  precio_unitario?: number | null
}

type PurchaseOrderResponse = {
  id: number
  fecha: string
  estado: string
  proveedor?: { id: number; nombre: string } | null
  usuario?: { id: number; nombre_usuario: string } | null
  items: PurchaseItemResponse[]
  total: number
}

type PurchaseOrderListResponse = {
  items: PurchaseOrderResponse[]
  total: number
  page: number
  page_size: number
}

function toAdminPurchase(order: PurchaseOrderResponse): PurchaseOrder {
  return {
    id: order.id,
    poNumber: `PO-${order.id}`,
    supplierId: order.proveedor?.nombre ?? "Proveedor",
    status: order.estado.toLowerCase() as PurchaseOrder["status"],
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.variante_producto_id,
      qty: item.cantidad,
      price: item.precio_unitario ?? 0,
    })),
    expectedDate: order.fecha,
    totalAmount: order.total,
    createdAt: order.fecha,
  }
}

export const purchasesService = {
  async listPOs(): Promise<PurchaseOrder[]> {
    const response = await api.get<PurchaseOrderListResponse>("/purchases")
    return response.items.map(toAdminPurchase)
  },

  async getPO(id: number): Promise<PurchaseOrder> {
    const response = await api.get<PurchaseOrderResponse>(`/purchases/${id}`)
    return toAdminPurchase(response)
  },

  async createPO(): Promise<PurchaseOrder> {
    throw new Error("La creación de órdenes de compra no está disponible todavía")
  },

  async updatePO(): Promise<PurchaseOrder> {
    throw new Error("La actualización de órdenes de compra no está disponible todavía")
  },

  async deletePO(): Promise<void> {
    throw new Error("La eliminación de órdenes de compra no está disponible todavía")
  },

  async receivePO(): Promise<PurchaseOrder> {
    throw new Error("El recibo de órdenes no está implementado todavía")
  },
}
