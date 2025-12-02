import { api } from "@/lib/apiClient"
import type { PurchaseOrder } from "@/lib/types/admin"

type PurchaseItemRequest = {
  variante_producto_id: number
  cantidad: number
  precio_unitario?: number | null
}

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
  fecha_envio?: string | null
  fecha_confirmacion?: string | null
  fecha_recepcion?: string | null
  fecha_facturacion?: string | null
  fecha_cierre?: string | null
  numero_factura_proveedor?: string | null
  observaciones?: string | null
}

type PurchaseOrderListResponse = {
  items: PurchaseOrderResponse[]
  total: number
  page: number
  page_size: number
}

function toAdminPurchase(order: PurchaseOrderResponse): PurchaseOrder {
  // Mapear estados del backend a estados del frontend
  // Incluye mapeo de estados antiguos para compatibilidad
  const estadoMap: Record<string, PurchaseOrder["status"]> = {
    "BORRADOR": "borrador",
    "ENVIADO": "enviado",
    "CONFIRMADO": "confirmado",
    "RECHAZADO": "rechazado",
    "RECIBIDO": "recibido",
    "FACTURADO": "facturado",
    "CERRADO": "cerrado",
    // Estados antiguos (compatibilidad)
    "draft": "borrador",
    "DRAFT": "borrador",
    "sent": "enviado",
    "SENT": "enviado",
    "received": "recibido",
    "RECEIVED": "recibido",
    "partial": "recibido", // partial se mapea a recibido
    "PARTIAL": "recibido",
    "canceled": "rechazado",
    "CANCELED": "rechazado",
  }
  
  return {
    id: order.id,
    poNumber: `PO-${order.id}`,
    supplierId: order.proveedor?.id ?? order.proveedor?.nombre ?? "Proveedor",
    status: estadoMap[order.estado.toUpperCase()] || "borrador",
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.variante_producto_id,
      qty: item.cantidad,
      price: item.precio_unitario ?? 0,
    })),
    expectedDate: order.fecha,
    totalAmount: order.total,
    createdAt: order.fecha,
    fecha_envio: order.fecha_envio,
    fecha_confirmacion: order.fecha_confirmacion,
    fecha_recepcion: order.fecha_recepcion,
    fecha_facturacion: order.fecha_facturacion,
    fecha_cierre: order.fecha_cierre,
    numero_factura_proveedor: order.numero_factura_proveedor,
    observaciones: order.observaciones,
  }
}

export const purchasesService = {
  async listPOs(search?: string): Promise<PurchaseOrder[]> {
    const params = new URLSearchParams()
    if (search) params.append("q", search)
    
    const queryString = params.toString()
    const url = queryString ? `/purchases?${queryString}` : "/purchases"
    const response = await api.get<PurchaseOrderListResponse>(url)
    return response.items.map(toAdminPurchase)
  },

  async getPO(id: number): Promise<PurchaseOrder> {
    const response = await api.get<PurchaseOrderResponse>(`/purchases/${id}`)
    return toAdminPurchase(response)
  },

  async createPO(data: {
    proveedor_id: number
    items: Array<{
      variante_producto_id: number
      cantidad: number
      precio_unitario?: number | null
    }>
    observaciones?: string | null
  }): Promise<PurchaseOrder> {
    const response = await api.post<PurchaseOrderResponse>("/purchases", data, { requireAuth: true })
    return toAdminPurchase(response)
  },

  async updatePO(id: number, data: {
    proveedor_id?: number
    items?: Array<{
      variante_producto_id: number
      cantidad: number
      precio_unitario?: number | null
    }>
    observaciones?: string | null
  }): Promise<PurchaseOrder> {
    const response = await api.put<PurchaseOrderResponse>(`/purchases/${id}`, data, { requireAuth: true })
    return toAdminPurchase(response)
  },

  async sendPO(id: number, observaciones?: string): Promise<PurchaseOrder> {
    const response = await api.post<PurchaseOrderResponse>(
      `/purchases/${id}/send`,
      { observaciones: observaciones || null },
      { requireAuth: true }
    )
    return toAdminPurchase(response)
  },

  async confirmPO(id: number, data?: {
    items?: Array<{
      variante_producto_id: number
      cantidad: number
      precio_unitario?: number | null
    }>
    observaciones?: string | null
  }): Promise<PurchaseOrder> {
    const response = await api.post<PurchaseOrderResponse>(
      `/purchases/${id}/confirm`,
      data || {},
      { requireAuth: true }
    )
    return toAdminPurchase(response)
  },

  async rejectPO(id: number, motivo: string): Promise<PurchaseOrder> {
    const response = await api.post<PurchaseOrderResponse>(
      `/purchases/${id}/reject`,
      { motivo },
      { requireAuth: true }
    )
    return toAdminPurchase(response)
  },

  async receivePO(id: number, data: {
    items: Array<{
      variante_producto_id: number
      cantidad: number
      precio_unitario?: number | null
    }>
    observaciones?: string | null
  }): Promise<PurchaseOrder> {
    const response = await api.post<PurchaseOrderResponse>(
      `/purchases/${id}/receive`,
      data,
      { requireAuth: true }
    )
    return toAdminPurchase(response)
  },

  async invoicePO(id: number, numero_factura_proveedor: string, observaciones?: string): Promise<PurchaseOrder> {
    const response = await api.post<PurchaseOrderResponse>(
      `/purchases/${id}/invoice`,
      {
        numero_factura_proveedor,
        observaciones: observaciones || null,
      },
      { requireAuth: true }
    )
    return toAdminPurchase(response)
  },

  async closePO(id: number, observaciones?: string): Promise<PurchaseOrder> {
    const response = await api.post<PurchaseOrderResponse>(
      `/purchases/${id}/close`,
      { observaciones: observaciones || null },
      { requireAuth: true }
    )
    return toAdminPurchase(response)
  },

  async deletePO(): Promise<void> {
    throw new Error("La eliminación de órdenes de compra no está disponible todavía")
  },
}
