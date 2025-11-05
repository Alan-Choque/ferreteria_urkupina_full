import type { Customer, Address, ID } from "@/lib/contracts"

let customers: Customer[] = [
  {
    id: "cust-1",
    type: "PERSON",
    firstName: "Juan",
    lastName: "Pérez",
    email: "juan@example.com",
    phone: "+591 71234567",
    documentType: "CI",
    documentNumber: "12345678",
    addresses: [
      {
        id: "addr-1",
        label: "Casa",
        line1: "Av. Principal 123",
        city: "La Paz",
        department: "La Paz",
        postalCode: "8200",
      },
    ],
  },
  {
    id: "cust-2",
    type: "COMPANY",
    name: "Constructora XYZ",
    email: "info@constructora.bo",
    phone: "+591 2 7654321",
    documentType: "NIT",
    documentNumber: "1234567890",
    addresses: [
      {
        id: "addr-2",
        label: "Oficina",
        line1: "Calle Comercial 456",
        city: "Santa Cruz",
        department: "Santa Cruz",
      },
    ],
  },
]

const nextId = { customer: 3, address: 3 }

export const customersService = {
  async listCustomers() {
    await new Promise((r) => setTimeout(r, 300))
    return customers
  },

  async getCustomer(id: ID) {
    await new Promise((r) => setTimeout(r, 200))
    return customers.find((c) => c.id === id)
  },

  async createCustomer(data: Omit<Customer, "id">) {
    await new Promise((r) => setTimeout(r, 400))
    const newCustomer: Customer = {
      ...data,
      id: `cust-${nextId.customer++}`,
    }
    customers.push(newCustomer)
    return newCustomer
  },

  async updateCustomer(id: ID, data: Partial<Customer>) {
    await new Promise((r) => setTimeout(r, 400))
    const customer = customers.find((c) => c.id === id)
    if (!customer) throw new Error("Cliente no encontrado")
    Object.assign(customer, data)
    return customer
  },

  async deleteCustomer(id: ID) {
    await new Promise((r) => setTimeout(r, 300))
    customers = customers.filter((c) => c.id !== id)
  },

  async addAddress(customerId: ID, address: Omit<Address, "id">) {
    await new Promise((r) => setTimeout(r, 300))
    const customer = customers.find((c) => c.id === customerId)
    if (!customer) throw new Error("Cliente no encontrado")
    const newAddress: Address = {
      ...address,
      id: `addr-${nextId.address++}`,
    }
    customer.addresses.push(newAddress)
    return newAddress
  },

  async updateAddress(customerId: ID, addressId: ID, data: Partial<Address>) {
    await new Promise((r) => setTimeout(r, 300))
    const customer = customers.find((c) => c.id === customerId)
    if (!customer) throw new Error("Cliente no encontrado")
    const address = customer.addresses.find((a) => a.id === addressId)
    if (!address) throw new Error("Dirección no encontrada")
    Object.assign(address, data)
    return address
  },

  async deleteAddress(customerId: ID, addressId: ID) {
    await new Promise((r) => setTimeout(r, 300))
    const customer = customers.find((c) => c.id === customerId)
    if (!customer) throw new Error("Cliente no encontrado")
    customer.addresses = customer.addresses.filter((a) => a.id !== addressId)
  },
}
