import { api, getAccessToken } from "@/lib/apiClient"
import type { SalesOrder } from "@/lib/contracts"
import { mockSalesOrders, isMockDataEnabled } from "@/lib/mock-data"

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
  metodo_pago?: string | null
  fecha_pago?: string | null
  fecha_preparacion?: string | null
  fecha_envio?: string | null
  fecha_entrega?: string | null
  direccion_entrega?: string | null
  sucursal_recogida_id?: number | null
  persona_recibe?: string | null
  observaciones_entrega?: string | null
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

function toSalesOrder(order: SaleOrderResponse): SalesOrder & {
  metodo_pago?: string | null
  fecha_pago?: string | null
  fecha_preparacion?: string | null
  fecha_envio?: string | null
  fecha_entrega?: string | null
  direccion_entrega?: string | null
  persona_recibe?: string | null
  observaciones_entrega?: string | null
} {
  // Determinar shippingMethod basado en metodo_pago
  let shippingMethod: "DOMICILIO" | "RETIRO_TIENDA" = "RETIRO_TIENDA"
  if (order.metodo_pago === "CONTRA_ENTREGA" || (order.metodo_pago === "PREPAGO" && order.direccion_entrega)) {
    shippingMethod = "DOMICILIO"
  } else if (order.metodo_pago === "RECOGER_EN_TIENDA") {
    shippingMethod = "RETIRO_TIENDA"
  }
  
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
    shippingMethod,
    createdAt: order.fecha,
    // Campos adicionales de entrega/recogida
    metodo_pago: order.metodo_pago,
    fecha_pago: order.fecha_pago,
    fecha_preparacion: order.fecha_preparacion,
    fecha_envio: order.fecha_envio,
    fecha_entrega: order.fecha_entrega,
    direccion_entrega: order.direccion_entrega,
    sucursal_recogida_id: order.sucursal_recogida_id,
    persona_recibe: order.persona_recibe,
    observaciones_entrega: order.observaciones_entrega,
  }
}

export const salesService = {
  async listOrders(search?: string, myOrders: boolean = false): Promise<SalesOrder[]> {
    // Si los datos mock están habilitados, devolver datos de prueba
    if (isMockDataEnabled()) {
      let orders = [...mockSalesOrders]
      if (search) {
        const searchLower = search.toLowerCase()
        orders = orders.filter(order => 
          order.id.toLowerCase().includes(searchLower) ||
          order.customerId?.toString().toLowerCase().includes(searchLower)
        )
      }
      return orders
    }
    
    const params = new URLSearchParams()
    // Solicitar un número grande de órdenes para mostrar todas (hasta 1000)
    params.append("page_size", "1000")
    params.append("page", "1")
    
    // Nota: El backend no soporta búsqueda por texto, solo por customer_id y estado
    // Si se necesita búsqueda, se debe implementar en el backend
    
    const queryString = params.toString()
    // Si myOrders es true, usar el endpoint para pedidos del usuario autenticado
    const url = myOrders ? `/sales/my-orders?${queryString}` : `/sales?${queryString}`
    // Ambos endpoints requieren autenticación:
    // - /sales/my-orders: para usuarios autenticados ver sus propias órdenes
    // - /sales: para administradores ver todas las órdenes
    console.log(`[SalesService] Calling ${url} with myOrders=${myOrders}`)
    try {
      const response = await api.get<SaleOrderListResponse>(url, { requireAuth: true })
      return response.items.map(toSalesOrder)
    } catch (error: any) {
      console.error(`[SalesService] Error calling ${url}:`, error)
      console.error(`[SalesService] Error status:`, error?.status)
      console.error(`[SalesService] Error detail:`, error?.detail)
      throw error
    }
  },

  async getOrder(id: string): Promise<SalesOrder> {
    // requireAuth es true por defecto, pero si el usuario no está autenticado
    // el backend debería manejar el caso de pedidos públicos
    const response = await api.get<SaleOrderResponse>(`/sales/${id}`)
    return toSalesOrder(response)
  },

  async createOrder(data: {
    cliente_email: string
    cliente_nombre: string
    cliente_nit_ci?: string
    cliente_telefono?: string
    items: Array<{
      variante_producto_id: number
      cantidad: number
      precio_unitario: number
    }>
    metodo_pago?: string
    direccion_entrega?: string
    sucursal_recogida_id?: number
  }): Promise<SalesOrder> {
    const payload = {
      cliente_email: data.cliente_email,
      cliente_nombre: data.cliente_nombre,
      cliente_nit_ci: data.cliente_nit_ci || null,
      cliente_telefono: data.cliente_telefono || null,
      items: data.items.map(item => ({
        variante_producto_id: item.variante_producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
      })),
      estado: "PENDIENTE",
      metodo_pago: data.metodo_pago || null,
      direccion_entrega: data.direccion_entrega || null,
      sucursal_recogida_id: data.sucursal_recogida_id || null,
    }
    
    // Intentar con autenticación si hay token disponible
    // Si no hay token, intentar sin autenticación (para usuarios no autenticados)
    // El backend maneja ambos casos con get_current_user_optional
    const hasToken = getAccessToken()
    const response = await api.post<SaleOrderResponse>(
      "/sales", 
      payload, 
      { requireAuth: !!hasToken }
    )
    return toSalesOrder(response)
  },

  async updateOrder(): Promise<SalesOrder> {
    throw new Error("La actualización de órdenes de venta no está habilitada todavía")
  },

  async updateOrderStatus(orderId: string, estado: string): Promise<SalesOrder> {
    const response = await api.patch<SaleOrderResponse>(
      `/sales/${orderId}/status`,
      { estado },
      { requireAuth: true }
    )
    return toSalesOrder(response)
  },

  async addPayment(): Promise<never> {
    throw new Error("El registro de pagos no está habilitado todavía")
  },

  async listPayments(): Promise<never[]> {
    return []
  },
}
