import type { Supplier, ID } from "@/lib/contracts"

let suppliers: Supplier[] = [
  {
    id: "supp-1",
    name: "BOSCH Bolivia",
    contact: "Carlos López",
    phone: "+591 2 1234567",
    email: "sales@bosch.com.bo",
    terms: "Net 30",
    rating: 4.5,
  },
  {
    id: "supp-2",
    name: "DeWALT Latinoamérica",
    contact: "María García",
    phone: "+591 71234567",
    email: "distribuidora@dewalt.la",
    terms: "Net 15",
    rating: 4.8,
  },
]

let nextId = 3

export const suppliersService = {
  async listSuppliers() {
    await new Promise((r) => setTimeout(r, 300))
    return suppliers
  },

  async getSupplier(id: ID) {
    await new Promise((r) => setTimeout(r, 200))
    return suppliers.find((s) => s.id === id)
  },

  async createSupplier(data: Omit<Supplier, "id">) {
    await new Promise((r) => setTimeout(r, 400))
    const newSupplier: Supplier = {
      ...data,
      id: `supp-${nextId++}`,
    }
    suppliers.push(newSupplier)
    return newSupplier
  },

  async updateSupplier(id: ID, data: Partial<Supplier>) {
    await new Promise((r) => setTimeout(r, 400))
    const supplier = suppliers.find((s) => s.id === id)
    if (!supplier) throw new Error("Proveedor no encontrado")
    Object.assign(supplier, data)
    return supplier
  },

  async deleteSupplier(id: ID) {
    await new Promise((r) => setTimeout(r, 300))
    suppliers = suppliers.filter((s) => s.id !== id)
  },
}
