"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { customersService } from "@/lib/services/customers-service"
import { Plus, Edit2, Trash2, Eye, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { Customer, ID, DocumentType } from "@/lib/contracts"

interface CustomerFormData {
  type: "PERSON" | "COMPANY"
  firstName?: string
  lastName?: string
  name?: string
  email?: string
  phone?: string
  documentType?: DocumentType
  documentNumber?: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<ID | null>(null)
  const [formData, setFormData] = useState<CustomerFormData>({
    type: "PERSON",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    documentType: "CI",
    documentNumber: "",
  })

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await customersService.listCustomers()
        setCustomers(data)
      } catch (error) {
        console.error("Error loading customers:", error)
      } finally {
        setLoading(false)
      }
    }
    loadCustomers()
  }, [])

  const handleCreate = () => {
    setEditingId(null)
    setFormData({
      type: "PERSON",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      documentType: "CI",
      documentNumber: "",
    })
    setIsFormOpen(true)
  }

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id)
    setFormData({
      type: customer.type,
      firstName: customer.firstName,
      lastName: customer.lastName,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      documentType: customer.documentType,
      documentNumber: customer.documentNumber,
    })
    setIsFormOpen(true)
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (formData.type === "PERSON" && (!formData.firstName || !formData.lastName)) {
        alert("Nombre y apellido son requeridos")
        return
      }
      if (formData.type === "COMPANY" && !formData.name) {
        alert("Nombre de empresa es requerido")
        return
      }

      if (editingId) {
        await customersService.updateCustomer(editingId, {
          ...formData,
          addresses: customers.find((c) => c.id === editingId)?.addresses || [],
        })
        setCustomers(customers.map((c) => (c.id === editingId ? { ...c, ...formData, addresses: c.addresses } : c)))
      } else {
        const newCustomer = await customersService.createCustomer({ ...formData, addresses: [] })
        setCustomers([...customers, newCustomer])
      }
      setIsFormOpen(false)
      alert(editingId ? "Cliente actualizado" : "Cliente creado exitosamente")
    } catch (error) {
      console.error("Error submitting form:", error)
      alert("Error procesando formulario")
    }
  }

  const handleDelete = async (id: ID) => {
    if (confirm("¿Desea eliminar este cliente?")) {
      try {
        await customersService.deleteCustomer(id)
        setCustomers(customers.filter((c) => c.id !== id))
      } catch (error) {
        console.error("Error deleting customer:", error)
      }
    }
  }

  const getCustomerName = (customer: Customer) => {
    return customer.type === "PERSON" ? `${customer.firstName} ${customer.lastName}` : customer.name || "-"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <button
          onClick={handleCreate}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nuevo Cliente
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden"
      >
        {loading ? (
          <div className="p-6 text-center text-gray-400">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Nombre</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Tipo</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Teléfono</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Documento</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm">{getCustomerName(customer)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${customer.type === "PERSON" ? "bg-blue-600/20 text-blue-400" : "bg-purple-600/20 text-purple-400"}`}
                      >
                        {customer.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-400">{customer.email || "-"}</td>
                    <td className="px-6 py-4 text-sm">{customer.phone || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {customer.documentType}: {customer.documentNumber || "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="text-gray-400 hover:text-blue-400 transition-colors">
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(customer)}
                          className="text-gray-400 hover:text-blue-400 transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{editingId ? "Editar Cliente" : "Nuevo Cliente"}</h2>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Cliente *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="PERSON">Persona</option>
                    <option value="COMPANY">Empresa</option>
                  </select>
                </div>
                {formData.type === "PERSON" ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Nombre *</label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Apellido *</label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre Empresa *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo Documento</label>
                  <select
                    value={formData.documentType}
                    onChange={(e) => setFormData({ ...formData, documentType: e.target.value as DocumentType })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="CI">CI</option>
                    <option value="NIT">NIT</option>
                    <option value="PASSPORT">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Número Documento</label>
                  <input
                    type="text"
                    value={formData.documentNumber}
                    onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {editingId ? "Guardar Cambios" : "Crear Cliente"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
