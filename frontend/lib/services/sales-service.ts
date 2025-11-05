import type { SalesOrder, Payment, ID, OrderStatus } from "@/lib/contracts"

const salesOrders: SalesOrder[] = [
  {
    id: "ord-1",
    customerId: "cust-1",
    status: "PENDIENTE",
    items: [
      {
        id: "oi-1",
        variantId: "var-1",
        sku: "BOSCH-GSB-20-2RE-V1",
        name: "Taladro de impacto Bosch",
        price: 244000,
        qty: 2,
        image: "/claw-hammer.png",
      },
    ],
    totals: {
      sub: 488000,
      discount: 0,
      shipping: 50000,
      total: 538000,
      currency: "BOB",
    },
    shippingMethod: "DOMICILIO",
    shippingAddressId: "addr-1",
    createdAt: new Date().toISOString(),
  },
]

const payments: Payment[] = []
const nextId = { order: 2, item: 2, payment: 1 }

export const salesService = {
  async listOrders() {
    await new Promise((r) => setTimeout(r, 300))
    return salesOrders
  },

  async getOrder(id: ID) {
    await new Promise((r) => setTimeout(r, 200))
    return salesOrders.find((o) => o.id === id)
  },

  async createOrder(data: Omit<SalesOrder, "id" | "createdAt">) {
    await new Promise((r) => setTimeout(r, 400))
    const newOrder: SalesOrder = {
      ...data,
      id: `ord-${nextId.order++}`,
      createdAt: new Date().toISOString(),
    }
    salesOrders.push(newOrder)
    return newOrder
  },

  async updateOrder(id: ID, data: Partial<SalesOrder>) {
    await new Promise((r) => setTimeout(r, 400))
    const order = salesOrders.find((o) => o.id === id)
    if (!order) throw new Error("Pedido no encontrado")
    Object.assign(order, data)
    return order
  },

  async updateOrderStatus(id: ID, status: OrderStatus) {
    await new Promise((r) => setTimeout(r, 300))
    const order = salesOrders.find((o) => o.id === id)
    if (!order) throw new Error("Pedido no encontrado")
    order.status = status
    return order
  },

  async addPayment(salesOrderId: ID, data: Omit<Payment, "id">) {
    await new Promise((r) => setTimeout(r, 400))
    const payment: Payment = {
      ...data,
      id: `pay-${nextId.payment++}`,
    }
    payments.push(payment)
    return payment
  },

  async listPayments(salesOrderId: ID) {
    await new Promise((r) => setTimeout(r, 200))
    return payments.filter((p) => p.salesOrderId === salesOrderId)
  },
}
