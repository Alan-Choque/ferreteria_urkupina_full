import type { PurchaseOrder, ID } from "@/lib/contracts"

let purchaseOrders: PurchaseOrder[] = [
  {
    id: "po-1",
    supplierId: "supp-1",
    status: "SENT",
    expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    total: 488000,
    items: [
      {
        id: "poi-1",
        variantId: "var-1",
        qty: 2,
        price: 244000,
      },
    ],
    createdAt: new Date().toISOString(),
  },
]

const nextId = { po: 2, poi: 2 }

export const purchasesService = {
  async listPOs() {
    await new Promise((r) => setTimeout(r, 300))
    return purchaseOrders
  },

  async getPO(id: ID) {
    await new Promise((r) => setTimeout(r, 200))
    return purchaseOrders.find((po) => po.id === id)
  },

  async createPO(data: Omit<PurchaseOrder, "id" | "createdAt">) {
    await new Promise((r) => setTimeout(r, 400))
    const newPO: PurchaseOrder = {
      ...data,
      id: `po-${nextId.po++}`,
      createdAt: new Date().toISOString(),
    }
    purchaseOrders.push(newPO)
    return newPO
  },

  async updatePO(id: ID, data: Partial<PurchaseOrder>) {
    await new Promise((r) => setTimeout(r, 400))
    const po = purchaseOrders.find((p) => p.id === id)
    if (!po) throw new Error("Orden de compra no encontrada")
    Object.assign(po, data)
    return po
  },

  async deletePO(id: ID) {
    await new Promise((r) => setTimeout(r, 300))
    purchaseOrders = purchaseOrders.filter((p) => p.id !== id)
  },

  async receivePO(id: ID, receivedQties: Record<ID, number>) {
    await new Promise((r) => setTimeout(r, 400))
    const po = purchaseOrders.find((p) => p.id === id)
    if (!po) throw new Error("Orden de compra no encontrada")
    po.items.forEach((item) => {
      if (receivedQties[item.id]) {
        item.qty = receivedQties[item.id]
      }
    })
    const allReceived = po.items.every((i) => i.qty > 0)
    po.status = allReceived ? "RECEIVED" : "PARTIAL"
    return po
  },
}
