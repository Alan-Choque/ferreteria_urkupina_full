"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { suppliersService } from "@/lib/services/suppliers-service"
import { Plus, Edit2, Trash2, Star, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { Supplier, ID } from "@/lib/contracts"

interface SupplierFormData {
  name: string
  contact?: string
  phone?: string
  email?: string
  terms?: string
  rating?: number
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<ID | null>(null)
  const [formData, setFormData] = useState<SupplierFormData>({
    name: "",
    contact: "",
    phone: "",
    email: "",
    terms: "",
    rating: 0,
  })

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const data = await suppliersService.listSuppliers()
        setSuppliers(data)
      } catch (error) {
        console.error("Error loading suppliers:", error)
      } finally {
        setLoading(false)
      }
    }
    loadSuppliers()
  }, [])

  const handleCreate = () => {
    setEditingId(null)
    setFormData({ name: "", contact: "", phone: "", email: "", terms: "", rating: 0 })
    setIsFormOpen(true)
  }

  const handleEdit = (supplier: Supplier) => {
    setEditingId(supplier.id)
    setFormData({
      name: supplier.name,
      contact: supplier.contact,
      phone: supplier.phone,
      email: supplier.email,
      terms: supplier.terms,
      rating: supplier.rating,
    })
    setIsFormOpen(true)
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!formData.name) {
        alert("El nombre es requerido")
        return
      }
      if (editingId) {
        await suppliersService.updateSupplier(editingId, formData)
        setSuppliers(suppliers.map((s) => (s.id === editingId ? { ...s, ...formData } : s)))
      } else {
        const newSupplier = await suppliersService.createSupplier(formData)
        setSuppliers([...suppliers, newSupplier])
      }
      setIsFormOpen(false)
      alert(editingId ? "Proveedor actualizado" : "Proveedor creado exitosamente")
    } catch (error) {
      console.error("Error submitting form:", error)
      alert("Error procesando formulario")
    }
  }

  const handleDelete = async (id: ID) => {
    if (confirm("¿Desea eliminar este proveedor?")) {
      try {
        await suppliersService.deleteSupplier(id)
        setSuppliers(suppliers.filter((s) => s.id !== id))
      } catch (error) {
        console.error("Error deleting supplier:", error)
      }
    }
  }

  const renderStars = (rating?: number) => {
    const r = rating || 0
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} size={16} className={i < Math.round(r) ? "fill-yellow-400 text-yellow-400" : "text-gray-600"} />
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Proveedores</h1>
        <button
          onClick={handleCreate}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nuevo Proveedor
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
                  <th className="px-6 py-3 text-left text-sm font-semibold">Contacto</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Teléfono</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Calificación</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm">{supplier.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{supplier.contact || "-"}</td>
                    <td className="px-6 py-4 text-sm text-blue-400">{supplier.email || "-"}</td>
                    <td className="px-6 py-4 text-sm">{supplier.phone || "-"}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-1">{renderStars(supplier.rating)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="text-gray-400 hover:text-blue-400 transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id)}
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
                <h2 className="text-xl font-bold">{editingId ? "Editar Proveedor" : "Nuevo Proveedor"}</h2>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contacto</label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>
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
                  <label className="block text-sm font-medium mb-1">Términos</label>
                  <input
                    type="text"
                    value={formData.terms}
                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Calificación (0-5)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.5"
                    value={formData.rating || 0}
                    onChange={(e) => setFormData({ ...formData, rating: Number.parseFloat(e.target.value) })}
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
                    {editingId ? "Guardar Cambios" : "Crear Proveedor"}
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
